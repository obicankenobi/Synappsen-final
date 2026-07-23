// Cloud Functions för Synappsen – Gemini Vision-tolkning av uppladdade foton
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

admin.initializeApp();
const db = admin.firestore();
// Explicit bucket name: admin.storage().bucket() with no argument can resolve to the
// legacy <project-id>.appspot.com bucket instead of the project's actual configured
// bucket, causing "no such object" failures for files the client just uploaded.
const bucket = admin.storage().bucket("synappsen-final-build.firebasestorage.app");

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const SOKMOTOR_API_KEY = defineSecret("SOKMOTOR_API_KEY");

// Grov kostnadsuppskattning per bildtolkning (öre), används för budgetspärren.
const UPPSKATTAD_KOSTNAD_ORE = 50;
const BUDGET_DOK = db.collection("installningar").doc("geminiBudget");
const STANDARD_TAK_ORE = 20000; // 200 kr
// Tak per enskild användare och månad, så att en person inte kan förbruka hela
// den gemensamma budgeten själv.
const MAX_PER_ANVANDARE_ORE = 5000; // 50 kr

function aktuellManadNyckel() {
  const nu = new Date();
  return `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, "0")}`;
}

// Upptäcker svenska personnummer/samordningsnummer (giltigt datum + Luhn-checksumma) i
// AI-tolkat innehåll, så att foton som råkar innehålla patientuppgifter aldrig sparas i
// Firestore. Samma algoritm som src/utils/piiFilter.js på klienten (duplicerad hit eftersom
// Cloud Functions är ett separat CommonJS-paket).
function luhnGiltig(siffror) {
  let summa = 0;
  for (let i = 0; i < 9; i++) {
    let d = siffror[i] * (i % 2 === 0 ? 2 : 1);
    if (d > 9) d -= 9;
    summa += d;
  }
  return (10 - (summa % 10)) % 10 === siffror[9];
}

function giltigtDatum(man, dag) {
  const m = Number(man);
  let d = Number(dag);
  if (d > 60) d -= 60;
  return m >= 1 && m <= 12 && d >= 1 && d <= 31;
}

function innehallerPersonnummer(text) {
  if (!text) return false;
  const regex = /\b(\d{2})(\d{2})(\d{2})[-+]?(\d{4})\b/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const [, ar, man, dag, sista4] = match;
    if (!giltigtDatum(man, dag)) continue;
    const tioSiffror = `${ar}${man}${dag}${sista4}`.split("").map(Number);
    if (luhnGiltig(tioSiffror)) return true;
  }
  return false;
}

// Enkel per-användare hastighetsbegränsning (rullande 1-timmesfönster), återanvänds av
// skapaKommentar/skickaFeedback för att förhindra spam-skapande direkt mot Cloud Functions.
const HASTIGHETSFONSTER_MS = 60 * 60 * 1000;

async function kontrolleraOchOkaHastighet(uid, typ, maxPerFonster) {
  const ref = db.collection("hastighetsgranser").doc(`${uid}_${typ}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const nu = Date.now();
    const data = snap.exists ? snap.data() : {};
    let antal = data.antal ?? 0;
    let fonsterStart = data.fonsterStart ?? nu;
    if (nu - fonsterStart > HASTIGHETSFONSTER_MS) {
      antal = 0;
      fonsterStart = nu;
    }
    if (antal >= maxPerFonster) {
      throw new HttpsError(
        "resource-exhausted",
        "Du har skickat in för många på kort tid. Vänta en stund och försök igen."
      );
    }
    tx.set(ref, { antal: antal + 1, fonsterStart });
  });
}

// Kontrollerar och reserverar budget innan ett dyrt Gemini-anrop görs.
// Kastar fel om månadens tak är nått, så att vi aldrig betalar för anrop vi inte har råd med.
async function reserveraBudget(uid) {
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(BUDGET_DOK);
    const data = snap.exists ? snap.data() : {};
    const manad = aktuellManadNyckel();

    let anvantOre = data.anvantOre ?? 0;
    let aktuellManad = data.aktuellManad ?? manad;
    let anvantPerUid = data.anvantPerUid ?? {};
    const taketOre = data.taketOre ?? STANDARD_TAK_ORE;

    if (aktuellManad !== manad) {
      anvantOre = 0;
      anvantPerUid = {};
      aktuellManad = manad;
    }

    if (anvantOre >= taketOre) {
      throw new HttpsError(
        "resource-exhausted",
        "Månadens budget för bildtolkning är slut. Kontakta superadmin för att höja taket i adminpanelen."
      );
    }

    const anvantAvDennaAnvandare = anvantPerUid[uid] ?? 0;
    if (anvantAvDennaAnvandare >= MAX_PER_ANVANDARE_ORE) {
      throw new HttpsError(
        "resource-exhausted",
        "Du har nått din egna månadskvot för bildtolkning. Kontakta superadmin om du behöver mer."
      );
    }

    anvantPerUid = { ...anvantPerUid, [uid]: anvantAvDennaAnvandare + UPPSKATTAD_KOSTNAD_ORE };

    tx.set(
      BUDGET_DOK,
      { anvantOre: anvantOre + UPPSKATTAD_KOSTNAD_ORE, aktuellManad, taketOre, anvantPerUid },
      { merge: true }
    );
  });
}

const extraktionsSchema = {
  type: SchemaType.OBJECT,
  properties: {
    titel: { type: SchemaType.STRING },
    innehall: { type: SchemaType.STRING },
    nyckelord: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    komIhagFlaggor: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    giltigtTill: { type: SchemaType.STRING },
  },
  required: ["titel", "innehall", "nyckelord", "komIhagFlaggor", "giltigtTill"],
};

async function tolkaBildMedGemini(bildBuffer, mimeType) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: extraktionsSchema,
    },
  });

  const prompt = `Du tolkar ett foto av ett dokument, en whiteboard eller en anteckning från en akutmottagning.
Extrahera innehållet och returnera strukturerad data på svenska:
- titel: en kort, beskrivande titel
- innehall: dokumentets text/innehåll, sammanfattat och strukturerat
- nyckelord: en lista med sökord som personal skulle kunna söka på
- komIhagFlaggor: en lista med kritiska kom-ihåg-punkter eller varningar, om sådana finns (annars tom lista)
- giltigtTill: om dokumentet anger ett giltighetsdatum, utgångsdatum eller "gäller till och med"-datum,
  ange det i formatet ÅÅÅÅ-MM-DD. Annars en tom sträng.`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: bildBuffer.toString("base64"), mimeType } },
  ]);

  return JSON.parse(result.response.text());
}

const OMRADEN = ["kliniskt-stod", "logistik", "administration"];

const FORRAD = [
  "Engångsförrådet",
  "Sterilförrådet",
  "Ortopedförrådet",
  "Tvättförrådet",
  "Kontorsförrådet",
  "Läkemedelsrummet",
];

const forradsArtikelSchema = {
  type: SchemaType.OBJECT,
  properties: {
    artiklar: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          namn: { type: SchemaType.STRING },
          skap: { type: SchemaType.STRING },
          hylla: { type: SchemaType.STRING },
          antal: { type: SchemaType.STRING },
          sokord: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ["namn", "skap", "hylla", "antal", "sokord"],
      },
    },
  },
  required: ["artiklar"],
};

async function tolkaForradsbildMedGemini(bildBuffer, mimeType, forrad) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: forradsArtikelSchema,
    },
  });

  const prompt = `Du tolkar ett foto från förrådet "${forrad}" på en akutmottagning.
Fotot kan visa ANTINGEN enskilda artiklar i ett skåp/på en hylla (med skyltar/etiketter),
ELLER en skriven/utskriven/tryckt lista/tabell över artiklar (t.ex. en innehållsförteckning
i en pärm, ofta med kolumner som "Benämning", "Hylla" och "Skåp").

Extrahera en lista över alla artiklar som syns i bilden. För varje artikel anger du:
- namn: artikelns namn (t.ex. innehållet i kolumnen "Benämning" om det är en lista)
- skap: skåpets beteckning (bokstav/nummer). Om bilden är en tabell/lista med en egen
  kolumn för "Skåp", läs av VARJE rads eget värde i den kolumnen – anta ALDRIG att alla
  rader har samma skåp/hylla bara för att de ligger nära varandra i tabellen. Om bilden
  istället visar fysiska artiklar, ange skåpet ENDAST om det syns på en skylt/etikett.
  Lämna tom sträng om inget av detta går att avläsa.
- hylla: hyllans beteckning, avläst på samma sätt som skap (egen kolumn i tabellen, eller
  skylt/etikett för fysiska artiklar). Lämna tom sträng om det inte går att avläsa.
- antal: angiven mängd/antal om det står i bilden, annars tom sträng
- sokord: en lista med alternativa sökord/synonymer som vårdpersonal kan tänkas söka på för att
  hitta artikeln – t.ex. vanliga förkortningar, slangbegrepp eller bredare produktkategorier
  (exempel: en "Foley-kateter" bör även ge sökord som "kateter", "urinkateter" och "KAD")
Gissa aldrig ett värde som inte faktiskt går att läsa i bilden – lämna då skap/hylla tomma.`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: bildBuffer.toString("base64"), mimeType } },
  ]);

  return JSON.parse(result.response.text()).artiklar;
}

exports.tolkaForradsbild = onCall(
  { secrets: [GEMINI_API_KEY], region: "europe-west1", memory: "1GiB", timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
    }

    const { storagePath, forrad } = request.data;
    if (!storagePath || !FORRAD.includes(forrad)) {
      throw new HttpsError("invalid-argument", "storagePath och ett giltigt forrad krävs.");
    }
    if (storagePath !== `inkommande/${request.auth.uid}/${storagePath.split("/").pop()}`) {
      throw new HttpsError("permission-denied", "storagePath måste peka på ditt eget uppladdade foto.");
    }

    await reserveraBudget(request.auth.uid);

    try {
      const fil = bucket.file(storagePath);
      const [bildBuffer] = await fil.download();
      const [metadata] = await fil.getMetadata();
      const mimeType = metadata.contentType || "image/jpeg";

      const artiklar = await tolkaForradsbildMedGemini(bildBuffer, mimeType, forrad);
      if (artiklar.some((a) => innehallerPersonnummer(`${a.namn} ${(a.sokord ?? []).join(" ")}`))) {
        throw new HttpsError(
          "invalid-argument",
          "Bilden verkar innehålla ett personnummer. Patientuppgifter får inte sparas i Synappsen – ta en ny bild utan sådan text."
        );
      }
      const bildUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

      // Matcha mot befintliga artiklar i samma förråd på normaliserat namn, så att en ny
      // uppladdning ersätter en tidigare (t.ex. felaktig/utdaterad) post istället för att
      // skapa en duplett varje gång samma lista fotas på nytt.
      const befintligaSnap = await db.collection("forradsartiklar").where("forrad", "==", forrad).get();
      const befintligaPerNamn = new Map();
      befintligaSnap.forEach((doc) => {
        const namn = (doc.data().namn ?? "").trim().toLowerCase();
        if (namn) befintligaPerNamn.set(namn, doc.ref);
      });

      const batch = db.batch();
      const skapade = artiklar.map((artikel) => {
        const normaliseratNamn = (artikel.namn ?? "").trim().toLowerCase();
        const befintligRef = befintligaPerNamn.get(normaliseratNamn);
        const ref = befintligRef ?? db.collection("forradsartiklar").doc();
        batch.set(ref, {
          namn: artikel.namn,
          skap: artikel.skap || null,
          hylla: artikel.hylla || null,
          antal: artikel.antal || null,
          sokord: artikel.sokord ?? [],
          bildUrl,
          forrad,
          status: "utkast",
          kalla: "gemini",
          skapadAv: request.auth.uid,
          skapad: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { id: ref.id, ersatte: Boolean(befintligRef), ...artikel };
      });
      await batch.commit();

      return { antal: skapade.length, artiklar: skapade };
    } catch (fel) {
      console.error("Tolkning misslyckades:", fel);
      if (fel instanceof HttpsError) throw fel;
      throw new HttpsError("internal", `Tolkning misslyckades: ${fel.message}`);
    }
  }
);

exports.tolkaDokument = onCall(
  { secrets: [GEMINI_API_KEY], region: "europe-west1", memory: "1GiB", timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
    }

    const { storagePath, omrade } = request.data;
    if (!storagePath || !OMRADEN.includes(omrade)) {
      throw new HttpsError("invalid-argument", "storagePath och ett giltigt omrade krävs.");
    }
    if (storagePath !== `inkommande/${request.auth.uid}/${storagePath.split("/").pop()}`) {
      throw new HttpsError("permission-denied", "storagePath måste peka på ditt eget uppladdade foto.");
    }

    await reserveraBudget(request.auth.uid);

    try {
      const fil = bucket.file(storagePath);
      const [bildBuffer] = await fil.download();
      const [metadata] = await fil.getMetadata();
      const mimeType = metadata.contentType || "image/jpeg";

      const extraherat = await tolkaBildMedGemini(bildBuffer, mimeType);
      if (
        innehallerPersonnummer(
          `${extraherat.titel} ${extraherat.innehall} ${(extraherat.komIhagFlaggor ?? []).join(" ")}`
        )
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Bilden verkar innehålla ett personnummer. Patientuppgifter får inte sparas i Synappsen – ta en ny bild utan sådan text."
        );
      }
      const bildUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
      // Endast ett väl formaterat datum (ÅÅÅÅ-MM-DD) sätts som utgångsdatum – annars ignoreras det.
      const giltigtTill = /^\d{4}-\d{2}-\d{2}$/.test(extraherat.giltigtTill) ? extraherat.giltigtTill : null;

      const rutinRef = await db.collection("rutiner").add({
        titel: extraherat.titel,
        innehall: extraherat.innehall,
        nyckelord: extraherat.nyckelord,
        komIhagFlaggor: extraherat.komIhagFlaggor,
        utgangsdatum: giltigtTill,
        bildUrl,
        omrade,
        status: "utkast",
        kalla: "gemini",
        skapadAv: request.auth.uid,
        skapad: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { rutinId: rutinRef.id, ...extraherat };
    } catch (fel) {
      console.error("Tolkning misslyckades:", fel);
      if (fel instanceof HttpsError) throw fel;
      throw new HttpsError("internal", `Tolkning misslyckades: ${fel.message}`);
    }
  }
);

// Godkända källor för klinikstöd-frågor – samma domäner som är konfigurerade i den
// programmerbara sökmotorn (se SOKMOTOR_CX nedan). Fungerar som ett extra skyddslager om
// sökmotorns egen domänbegränsning någonsin skulle ändras av misstag.
const GODKANDA_KALLDOMANER = [
  "internetmedicin.se",
  "1177.se",
  "nationelltklinisktkunskapsstod.se",
  "fass.se",
  "lakemedelsverket.se",
  "vardhandboken.se",
  "folkhalsomyndigheten.se",
];

// Sökmotorns Search Engine ID (cx) – inte hemlig (syns redan publikt i inbäddningskoden för
// sökwidgeten), så den behöver inte hanteras som ett Firebase-secret som API-nyckeln nedan.
const SOKMOTOR_CX = "b78ded0f2f19e4ab6";

function domanGodkand(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return GODKANDA_KALLDOMANER.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

// Söker via Google Programmable Search Engine (Custom Search JSON API), konfigurerad att
// bara söka inom de godkända domänerna (se GODKANDA_KALLDOMANER) – till skillnad från den
// tidigare varianten som bad Gemini "lova" att bara söka med site:-operatorn (vilket den i
// praktiken inte alltid respekterade), är denna begränsning inbyggd i själva sökmotorn.
async function sokViaProgrammerbarSokmotor(fraga) {
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", SOKMOTOR_API_KEY.value());
  url.searchParams.set("cx", SOKMOTOR_CX);
  url.searchParams.set("q", fraga);
  url.searchParams.set("num", "5");

  const httpSvar = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!httpSvar.ok) {
    const felText = await httpSvar.text();
    const fel = new Error(`Sökmotorn svarade ${httpSvar.status}: ${felText.slice(0, 500)}`);
    fel.status = httpSvar.status;
    throw fel;
  }
  const json = await httpSvar.json();
  return (json.items ?? []).map((i) => ({ titel: i.title, url: i.link, utdrag: i.snippet ?? "" }));
}

// Kliniskt uppslagsstöd: hämtar först faktiska sökträffar från en domänbegränsad
// Programmable Search Engine (se ovan), och ber sedan Gemini svara ENBART utifrån dessa
// träffars innehåll – inte fri websökning. Domänkontrollen (domanGodkand) körs ändå som ett
// extra skyddslager ifall sökmotorns egen konfiguration någonsin skulle ändras av misstag.
exports.fragaKlinisktStod = onCall(
  {
    secrets: [GEMINI_API_KEY, SOKMOTOR_API_KEY],
    region: "europe-west1",
    memory: "512MiB",
    timeoutSeconds: 60,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
    }

    const fraga = (request.data?.fraga ?? "").trim();
    if (!fraga || fraga.length > 500) {
      throw new HttpsError("invalid-argument", "Ange en fråga (max 500 tecken).");
    }
    // Skickar aldrig en fråga som verkar innehålla ett personnummer vidare till Gemini
    // (tredjepartstjänst) – patientuppgifter får inte lämna appen överhuvudtaget.
    if (innehallerPersonnummer(fraga)) {
      throw new HttpsError(
        "invalid-argument",
        "Frågan verkar innehålla ett personnummer. Ställ bara generella frågor, inte frågor om " +
          "specifika patienter."
      );
    }

    // Frågelogg (utan uid – vi vill se VAD som efterfrågas, inte VEM som frågar) så att
    // ledningen ser vilka kunskapsluckor som finns; vanliga frågor kan bli permanenta rutiner.
    const fragaNyckel = fraga.toLowerCase().replace(/\s+/g, " ");
    db.collection("klinikfrageloggar")
      .add({ fraga: fragaNyckel, tidpunkt: admin.firestore.FieldValue.serverTimestamp() })
      .catch(() => {});

    // Cache: samma fråga ställs ofta av flera personer. Ett cachat svar (7 dagar) sparar
    // både Custom Search-kvoten (100 gratis/dag) och Gemini-kostnad, och svarar direkt.
    const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
    const cacheRef = db
      .collection("klinikfragecache")
      .doc(Buffer.from(fragaNyckel).toString("base64url").slice(0, 480));
    const cacheSnap = await cacheRef.get();
    if (cacheSnap.exists) {
      const c = cacheSnap.data();
      if (c.skapad?.toMillis && Date.now() - c.skapad.toMillis() < CACHE_TTL_MS) {
        return { svar: c.svar, kallor: c.kallor, franCache: true };
      }
    }

    // Samma budgetspärr som bild-/dokumenttolkningen, så att den här funktionen inte kan
    // anropas direkt (förbi den pausade UI-vyn) utan tak på kostnad eller antal anrop.
    // Ligger EFTER cache-kontrollen – cachade svar kostar inget och ska inte äta budget.
    await reserveraBudget(request.auth.uid);

    const kalldomanerText = GODKANDA_KALLDOMANER.join(", ");

    let traffar;
    try {
      traffar = await sokViaProgrammerbarSokmotor(fraga);
    } catch (fel) {
      console.error("Sökmotor-anrop misslyckades:", fel);
      throw new HttpsError("internal", `Sökningen misslyckades: ${fel.message}`);
    }

    // Extra skyddslager: sökmotorn ska redan vara konfigurerad att bara söka inom
    // GODKANDA_KALLDOMANER, men om den konfigurationen någonsin ändras av misstag ska en
    // träff utanför listan aldrig nå Gemini eller användaren.
    const godkandaTraffar = traffar.filter((t) => domanGodkand(t.url));
    if (godkandaTraffar.length === 0) {
      throw new HttpsError(
        "not-found",
        `Hittade inget svar bland de godkända källorna (${kalldomanerText}). Sök manuellt istället.`
      );
    }

    const traffTextBlock = godkandaTraffar
      .map((t, i) => `[${i + 1}] ${t.titel} (${t.url})\n${t.utdrag}`)
      .join("\n\n");

    const prompt = `Du är ett kliniskt uppslagsverktyg för vårdpersonal på en akutmottagning i Sverige.

Fråga: "${fraga}"

Här är sökträffar från godkända medicinska källor (${kalldomanerText}):

${traffTextBlock}

Regler du MÅSTE följa:
1. Svara ENDAST utifrån informationen i sökträffarna ovan – gissa aldrig och använd aldrig
   information från minnet eller andra källor.
2. Om träffarna inte innehåller ett tillförlitligt svar: säg det tydligt istället för att gissa.
3. Ange efter varje påstående vilken träff ([1], [2], osv.) det kommer ifrån.
4. Detta är beslutsstöd, inte en diagnos – uppmana alltid till egen klinisk bedömning.
5. Svara på svenska, kortfattat och praktiskt.
6. Ställ aldrig frågor om eller referera till en specifik patient – om frågan verkar handla om
   en namngiven eller identifierbar person, svara att du bara kan besvara generella frågor.`;

    async function anropaGemini() {
      const httpSvar = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY.value()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      if (!httpSvar.ok) {
        const felText = await httpSvar.text();
        const fel = new Error(`Gemini API svarade ${httpSvar.status}: ${felText.slice(0, 500)}`);
        fel.status = httpSvar.status;
        throw fel;
      }
      return httpSvar.json();
    }

    let svarJson;
    try {
      try {
        svarJson = await anropaGemini();
      } catch (forstaFel) {
        // 503/UNAVAILABLE betyder att Gemini är tillfälligt överbelastat (inte ett fel i vårt
        // anrop) – ett enda snabbt återförsök löser detta i de flesta fall.
        if (forstaFel.status === 503) {
          await new Promise((r) => setTimeout(r, 2000));
          svarJson = await anropaGemini();
        } else {
          throw forstaFel;
        }
      }
    } catch (fel) {
      console.error("Klinikstöd-sökning misslyckades:", fel);
      if (fel.status === 503) {
        throw new HttpsError(
          "unavailable",
          "Gemini är tillfälligt överbelastat just nu. Vänta en liten stund och försök igen."
        );
      }
      throw new HttpsError("internal", `Sökningen misslyckades: ${fel.message}`);
    }

    const svar = svarJson.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    const kallor = godkandaTraffar.map((t) => ({ titel: t.titel, url: t.url }));

    await cacheRef
      .set({ svar, kallor, skapad: admin.firestore.FieldValue.serverTimestamp() })
      .catch(() => {});

    return { svar, kallor, franCache: false };
  }
);

// Tvingar utloggning av en användare genom att återkalla dess refresh-tokens (Admin SDK).
// Klientens nästa tokenförnyelse (eller sidladdning) gör att den loggas ut automatiskt.
// En redan hämtad ID-token kan fortsätta fungera i upp till ~1 timme tills den löper ut.
exports.tvingaUtloggning = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringarensRoll = (await db.collection("users").doc(request.auth.uid).get()).data()?.role;
  if (uppringarensRoll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan tvinga utloggning.");
  }

  const { userId } = request.data ?? {};
  if (!userId) {
    throw new HttpsError("invalid-argument", "userId krävs.");
  }

  await admin.auth().revokeRefreshTokens(userId);
  return { ok: true };
});

const MAX_KOMMENTARER_PER_TIMME = 30;
const MAX_FEEDBACK_PER_TIMME = 10;

// Skapar en kommentar via Admin SDK istället för en direkt klient-skrivning, så att
// personnummer-spärren kan köras server-side (Firestore-regler kan inte replikera
// Luhn-kontrollen) och skaparen inte kan skicka spam obegränsat (hastighetsbegränsning).
// @omnämnanden räknas alltid ut här, från den faktiska texten – klienten kan inte längre
// peka ut godtyckliga användare som "omnämnda".
exports.skapaKommentar = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const { rutinId, text, svarPa } = request.data ?? {};
  const rensadText = (text ?? "").trim();
  if (!rutinId || !rensadText || rensadText.length > 2000) {
    throw new HttpsError("invalid-argument", "Ange en kommentar (max 2000 tecken).");
  }
  if (innehallerPersonnummer(rensadText)) {
    throw new HttpsError(
      "invalid-argument",
      "Kommentaren verkar innehålla ett personnummer. Patientuppgifter får inte sparas."
    );
  }

  await kontrolleraOchOkaHastighet(request.auth.uid, "kommentar", MAX_KOMMENTARER_PER_TIMME);

  const [skaparSnap, allaAnvandare] = await Promise.all([
    db.collection("users").doc(request.auth.uid).get(),
    db.collection("users").get(),
  ]);
  const skapadAvNamn = skaparSnap.data()?.namn ?? skaparSnap.data()?.email ?? "";

  const handtag = [...rensadText.matchAll(/@([a-zA-Z0-9._-]+)/g)].map((m) => m[1].toLowerCase());
  const omnamnda = handtag.length
    ? allaAnvandare.docs
        .filter((d) => {
          const lokalDel = (d.data().email ?? "").split("@")[0].toLowerCase();
          return lokalDel && handtag.includes(lokalDel);
        })
        .map((d) => d.id)
        .filter((uid) => uid !== request.auth.uid)
    : [];

  const ref = await db.collection("kommentarer").add({
    rutinId,
    text: rensadText,
    skapadAv: request.auth.uid,
    skapadAvNamn,
    svarPa: svarPa ?? null,
    omnamnda,
    skapad: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
});

// Skickar in feedback via Admin SDK av samma skäl som skapaKommentar: server-side
// personnummer-spärr och hastighetsbegränsning som Firestore-regler inte kan replikera.
exports.skickaFeedback = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const { typ, text } = request.data ?? {};
  const rensadText = (text ?? "").trim();
  if (!typ || !rensadText || rensadText.length > 2000) {
    throw new HttpsError("invalid-argument", "Ange typ och text (max 2000 tecken).");
  }
  if (innehallerPersonnummer(rensadText)) {
    throw new HttpsError(
      "invalid-argument",
      "Texten verkar innehålla ett personnummer. Patientuppgifter får inte sparas."
    );
  }

  await kontrolleraOchOkaHastighet(request.auth.uid, "feedback", MAX_FEEDBACK_PER_TIMME);

  const skaparSnap = await db.collection("users").doc(request.auth.uid).get();
  const skapadAvNamn = skaparSnap.data()?.namn ?? skaparSnap.data()?.email ?? "";

  const ref = await db.collection("feedback").add({
    typ,
    text: rensadText,
    status: "ny",
    skapadAv: request.auth.uid,
    skapadAvNamn,
    skapad: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
});

// Beroende-statustest för adminpanelen: pingar Gemini, den programmerbara sökmotorn och
// Storage var för sig så en trasig nyckel/konfiguration upptäcks av admin direkt istället för
// först när en användare stöter på ett fel. Görs INTE mot budgeten (manuellt, sällan använt,
// minimala anrop) – bara ett kort "OK"-svar från Gemini resp. en enda sökträff.
// Tröskel för "fungerar men långsamt" – ett svar som kommer igenom men tar orimligt lång
// tid är ofta ett tidigt tecken på ett problem (t.ex. Google-tjänsten är överbelastad) innan
// den blir ett hårt fel. Enkel att förstå för en icke-teknisk admin: grönt/gult/rött.
const DEGRADERAD_GRANS_MS = 4000;

function statusFranTid(millisekunder) {
  return millisekunder > DEGRADERAD_GRANS_MS ? "degraderad" : "ok";
}

exports.testaBeroenden = onCall(
  { secrets: [GEMINI_API_KEY, SOKMOTOR_API_KEY], region: "europe-west1", timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
    }
    const roll = (await db.collection("users").doc(request.auth.uid).get()).data()?.role;
    if (roll !== "superadmin") {
      throw new HttpsError("permission-denied", "Endast superadmin kan testa anslutningar.");
    }

    async function testaGemini() {
      const start = Date.now();
      try {
        const svar = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY.value()}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: "Svara med endast ordet OK." }] }] }),
            signal: AbortSignal.timeout(10000),
          }
        );
        if (!svar.ok) {
          return { status: "fel", meddelande: `Svarade med felkod ${svar.status}.` };
        }
        return { status: statusFranTid(Date.now() - start), meddelande: null };
      } catch (fel) {
        return { status: "fel", meddelande: fel.message };
      }
    }

    async function testaSokmotor() {
      const start = Date.now();
      try {
        const url = new URL("https://www.googleapis.com/customsearch/v1");
        url.searchParams.set("key", SOKMOTOR_API_KEY.value());
        url.searchParams.set("cx", SOKMOTOR_CX);
        url.searchParams.set("q", "test");
        url.searchParams.set("num", "1");
        const svar = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!svar.ok) {
          return { status: "fel", meddelande: `Svarade med felkod ${svar.status}.` };
        }
        return { status: statusFranTid(Date.now() - start), meddelande: null };
      } catch (fel) {
        return { status: "fel", meddelande: fel.message };
      }
    }

    async function testaStorage() {
      try {
        await bucket.getMetadata();
        return { status: "ok", meddelande: null };
      } catch (fel) {
        return { status: "fel", meddelande: fel.message };
      }
    }

    // Lätt version av verifieraKlinikstod (en enda fråga istället för tre) – ger en snabb
    // indikation här, medan den fullständiga körningen med tre frågor finns i sin egen
    // sektion ("Verifiera klinikstöd-sökningen") för djupare felsökning.
    async function testaKlinikstodKalla() {
      try {
        const traffar = await sokViaProgrammerbarSokmotor(KLINIKSTOD_TESTFRAGOR[0]);
        const otillatna = traffar.filter((t) => !domanGodkand(t.url));
        if (otillatna.length > 0) {
          return {
            status: "fel",
            meddelande: `Hittade källor utanför godkända domäner: ${otillatna.map((t) => t.url).join(", ")}.`,
          };
        }
        if (traffar.length === 0) {
          return { status: "degraderad", meddelande: "Testfrågan gav inga träffar just nu." };
        }
        return { status: "ok", meddelande: null };
      } catch (fel) {
        return { status: "fel", meddelande: fel.message };
      }
    }

    const [gemini, sokmotor, storage, klinikstod] = await Promise.all([
      testaGemini(),
      testaSokmotor(),
      testaStorage(),
      testaKlinikstodKalla(),
    ]);
    return { gemini, sokmotor, storage, klinikstod };
  }
);

// Fördefinierade testfrågor som täcker olika medicinska ämnesområden, för att verifiera att
// klinikstöd-sökningen faktiskt håller sig till de godkända källorna – inte bara att API:et
// svarar (det gör testaBeroenden redan). Testar ENDAST sökmotorsteget (inte Gemini): det är
// sökmotorns egen domänkonfiguration som är den riskabla enskilda punkten (kan ändras av
// misstag i Google-kontot, utanför appens kod), och just det steget är vad domanGodkand()
// skyddar mot. Kostar ingen Gemini-budget och går förbi cachen (alltid färskt resultat).
const KLINIKSTOD_TESTFRAGOR = [
  "behandling hyperkalemi",
  "dosering amoxicillin barn",
  "akut anafylaxi vuxen",
];

exports.verifieraKlinikstod = onCall(
  { secrets: [SOKMOTOR_API_KEY], region: "europe-west1", timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
    }
    const roll = (await db.collection("users").doc(request.auth.uid).get()).data()?.role;
    if (roll !== "superadmin") {
      throw new HttpsError("permission-denied", "Endast superadmin kan verifiera sökningen.");
    }

    const resultat = await Promise.all(
      KLINIKSTOD_TESTFRAGOR.map(async (fraga) => {
        try {
          const traffar = await sokViaProgrammerbarSokmotor(fraga);
          const otillatnaTraffar = traffar.filter((t) => !domanGodkand(t.url));
          return {
            fraga,
            ok: traffar.length > 0 && otillatnaTraffar.length === 0,
            antalTraffar: traffar.length,
            kallor: traffar.map((t) => t.url),
            otillatnaKallor: otillatnaTraffar.map((t) => t.url),
          };
        } catch (fel) {
          return { fraga, ok: false, fel: fel.message };
        }
      })
    );
    return { resultat };
  }
);
