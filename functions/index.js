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

// Godkända källor för klinikstöd-frågor. OBS: domänerna nedan är inte verifierade mot en
// aktiv webbuppslagning (byggd utan nätåtkomst) – dubbelkolla särskilt
// "nationelltklinisktkunskapsstod.se" innan detta tas i skarp drift, och justera listan
// vid behov.
const GODKANDA_KALLDOMANER = [
  "internetmedicin.se",
  "1177.se",
  "nationelltklinisktkunskapsstod.se",
  "fass.se",
  "lakemedelsverket.se",
];

function domanGodkand(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return GODKANDA_KALLDOMANER.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

// Gemini/Vertex AI:s grounding-API returnerar käll-URL:er som går via
// vertexaisearch.cloud.google.com/grounding-api-redirect/... – ALDRIG den riktiga sidans
// domän direkt. Att domänvalidera redirect-länken (som förra versionen gjorde) blockerar
// därför varje svar, oavsett vilken sida Gemini egentligen använde. Löser upp varje länk
// till dess slutgiltiga URL (via HEAD + redirect-following) innan domänen kontrolleras,
// och byter ut länken mot den riktiga sidan i det som visas för användaren.
async function losUppSlutgiltigUrl(url) {
  // Vissa redirect-slutpunkter avvisar HEAD – provar GET som fallback om så behövs.
  for (const metod of ["HEAD", "GET"]) {
    try {
      const svar = await fetch(url, {
        method: metod,
        redirect: "follow",
        signal: AbortSignal.timeout(5000),
      });
      if (svar.url && !svar.url.includes("vertexaisearch.cloud.google.com")) {
        return svar.url;
      }
    } catch {
      // provar nästa metod
    }
  }
  // Om upplösningen misslyckas behålls redirect-länken – den klarar aldrig
  // domänkontrollen, vilket är rätt (vi kan då inte verifiera var den faktiskt pekar).
  return url;
}

async function losUppKallor(kallor) {
  return Promise.all(
    kallor.map(async (k) => {
      const slutgiltigUrl = await losUppSlutgiltigUrl(k.url);
      return { titel: k.titel, url: slutgiltigUrl };
    })
  );
}

// Kliniskt uppslagsstöd: tvingar Gemini att söka live (Google Search-grounding) varje
// gång istället för att svara ur minnet, och validerar i efterhand att ALLA angivna källor
// faktiskt ligger på en godkänd domän. Om något inte kan verifieras blockeras svaret hellre
// än att visas som om det vore godkänt.
exports.fragaKlinisktStod = onCall(
  { secrets: [GEMINI_API_KEY], region: "europe-west1", memory: "512MiB", timeoutSeconds: 60 },
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

    const kalldomanerText =
      "internetmedicin.se, 1177.se, nationelltklinisktkunskapsstod.se (Nationella kliniska " +
      "kunskapsstödet), fass.se (Läkemedelsverkets FASS för vårdpersonal), lakemedelsverket.se";

    function byggPrompt(korrigering) {
      return `Du är ett kliniskt uppslagsverktyg för vårdpersonal på en akutmottagning i Sverige.

Fråga: "${fraga}"
${korrigering ?? ""}
Regler du MÅSTE följa:
1. Sök alltid upp aktuell information live via websökning – svara ALDRIG enbart ur minnet.
2. Använd ENDAST information från dessa källor: ${kalldomanerText}.
3. Formulera dina sökningar med "site:"-operatorn riktad mot en av dessa domäner i taget, t.ex.
   "site:internetmedicin.se ${fraga}" eller "site:1177.se ${fraga}" – sök ALDRIG brett på öppna
   webben utan site:-begränsning.
4. Om du inte hittar ett tillförlitligt svar på dessa sidor: säg det tydligt istället för att
   gissa eller använda någon annan källa, oavsett hur relevant den kan verka.
5. Ange tydligt vilken specifik källa varje påstående kommer ifrån.
6. Detta är beslutsstöd, inte en diagnos – uppmana alltid till egen klinisk bedömning.
7. Svara på svenska, kortfattat och praktiskt.
8. Ställ aldrig frågor om eller referera till en specifik patient – om frågan verkar handla om
   en namngiven eller identifierbar person, svara att du bara kan besvara generella frågor.`;
    }

    // Anropar Gemini REST-API direkt (istället för @google/generative-ai-paketet) med
    // "googleSearch"-verktyget, som är den nuvarande sök-grounding-mekanismen för
    // gemini-2.5-flash. Paketets typdefinitioner (v0.21) känner bara till det äldre,
    // 1.5-modell-specifika "googleSearchRetrieval"-verktyget, vilket inte är tillförlitligt
    // för den modell resten av appen redan använder.
    async function anropaGemini(promptText) {
      const httpSvar = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY.value()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            tools: [{ googleSearch: {} }],
          }),
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

    async function anropaMedOmforsokVid503(promptText) {
      try {
        return await anropaGemini(promptText);
      } catch (forstaFel) {
        // 503/UNAVAILABLE betyder att Gemini är tillfälligt överbelastat (inte ett fel i vårt
        // anrop) – ett enda snabbt återförsök löser detta i de flesta fall.
        if (forstaFel.status === 503) {
          await new Promise((r) => setTimeout(r, 2000));
          return await anropaGemini(promptText);
        }
        throw forstaFel;
      }
    }

    async function tolkaSvar(svarJson) {
      const kandidat = svarJson.candidates?.[0];
      const svar = kandidat?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      const grounding = kandidat?.groundingMetadata;
      const raKallor = (grounding?.groundingChunks ?? grounding?.groundingChuncks ?? [])
        .map((c) => c.web)
        .filter(Boolean)
        .map((w) => ({ titel: w.title ?? w.uri, url: w.uri }));
      // Länkarna från grounding-API:et går via vertexaisearch.cloud.google.com och måste
      // lösas upp till den riktiga sidans URL innan domänen går att kontrollera.
      const kallor = await losUppKallor(raKallor);
      return { svar, kallor };
    }

    let resultat;
    try {
      resultat = await tolkaSvar(await anropaMedOmforsokVid503(byggPrompt()));

      // Om Gemini trots instruktionerna hänvisade till otillåtna källor: ge den EN chans till
      // med en skarpare, korrigerande prompt som pekar ut exakt vilka domäner som floppade.
      const otillatnaForsta = resultat.kallor.filter((k) => !domanGodkand(k.url));
      if (resultat.kallor.length === 0 || otillatnaForsta.length > 0) {
        const korrigering = `
OBS: ett tidigare försök att besvara den här frågan använde felaktigt källor utanför listan${
          otillatnaForsta.length > 0 ? ` (${otillatnaForsta.map((k) => k.url).join(", ")})` : ""
        }. Sök EN GÅNG TILL, den här gången strikt med "site:"-sökningar mot endast de fem
godkända domänerna nedan – ingen annan källa accepteras denna gång.
`;
        resultat = await tolkaSvar(await anropaMedOmforsokVid503(byggPrompt(korrigering)));
      }
    } catch (fel) {
      console.error("Klinikstöd-sökning misslyckades:", fel);
      if (fel.status === 503) {
        throw new HttpsError(
          "unavailable",
          "Gemini är tillfälligt överbelastat just nu. Vänta en liten stund och försök igen."
        );
      }
      // Övriga felmeddelanden visas i klienten (istället för ett generiskt "något gick fel")
      // eftersom Cloud Functions-loggarna inte är tillgängliga under utveckling/felsökning av
      // den här funktionen – gör felsökning möjlig direkt från gränssnittet.
      throw new HttpsError("internal", `Sökningen misslyckades: ${fel.message}`);
    }

    const { svar, kallor } = resultat;

    if (kallor.length === 0) {
      throw new HttpsError(
        "not-found",
        "Kunde inte hitta ett verifierbart svar från de godkända källorna (försökte två gånger). Sök manuellt istället."
      );
    }

    const otillatna = kallor.filter((k) => !domanGodkand(k.url));
    if (otillatna.length > 0) {
      console.warn("Blockerat svar pga otillåtna källor:", otillatna.map((k) => k.url));
      throw new HttpsError(
        "failed-precondition",
        `Svaret hänvisade fortfarande till källor utanför de godkända (${kalldomanerText}) ` +
          `efter två försök. Källor det faktiskt använde: ${kallor.map((k) => k.url).join(", ")}. ` +
          "Blockerat av säkerhetsskäl – sök manuellt istället."
      );
    }

    return { svar, kallor };
  }
);
