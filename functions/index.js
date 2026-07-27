// Cloud Functions för Synappsen – Gemini Vision-tolkning av uppladdade foton
const { onCall: onCallUtanRapportering, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const crypto = require("node:crypto");
const { VERKSAMHETSMALLAR } = require("./verksamhetsmallar");
const Sentry = require("@sentry/node");

// Ingen SENTRY_DSN i miljön (lokala emulatorer, tester) → Sentry.init() no-opar tyst.
Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0 });

// Alla callable-exports i den här filen (varje "onCall(...)"-anrop) ska rapportera oväntade
// fel till Sentry innan de når klienten, utan att ändra svaret. Att wrappa själva
// onCall-importen (istället
// för varje enskilt anropsställe) gör det gäller automatiskt för både befintliga och
// framtida funktioner. onCall fångar redan avvisade promises och gör om dem till ett
// felsvar – det är därför Sentry inte kan förlita sig på sina egna globala
// uncaughtException/unhandledRejection-lyssnare här. Medvetna HttpsError-avvisningar
// (saknad modul, budget, valideringsfel) är inte buggar och rapporteras inte.
function onCall(optionerEllerHanterare, kanskeHanterare) {
  const harEgnaOptioner = typeof optionerEllerHanterare !== "function";
  const hanterare = harEgnaOptioner ? kanskeHanterare : optionerEllerHanterare;
  const medRapportering = async (request) => {
    try {
      return await hanterare(request);
    } catch (fel) {
      if (!(fel instanceof HttpsError)) {
        Sentry.captureException(fel);
      }
      throw fel;
    }
  };
  return harEgnaOptioner
    ? onCallUtanRapportering(optionerEllerHanterare, medRapportering)
    : onCallUtanRapportering(medRapportering);
}

admin.initializeApp();
const db = admin.firestore();
// Explicit bucket name: admin.storage().bucket() with no argument can resolve to the
// legacy <project-id>.appspot.com bucket instead of the project's actual configured
// bucket, causing "no such object" failures for files the client just uploaded.
const bucket = admin.storage().bucket("synappsen-final-build.firebasestorage.app");

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const SOKMOTOR_API_KEY = defineSecret("SOKMOTOR_API_KEY");

// Etapp 1 (multi-tenant-grund): organisationen som all data/alla konton tillhör tills en
// andra kund finns. Måste vara identisk med src/firebase/organisation.js.
const STANDARD_ORG = "default";

// Slår upp anroparens roll och organisation i EN läsning. Faller tillbaka på STANDARD_ORG
// om organisationId saknas (konton skapade innan Etapp 1) – samma fallback som i
// firestore.rules, så server och regler alltid är överens.
async function hamtaAnvandarInfo(uid) {
  const data = (await db.collection("users").doc(uid).get()).data() ?? {};
  return { roll: data.role, organisationId: data.organisationId ?? STANDARD_ORG };
}

// Etapp 2 (feature-gating): serverkontroll av att organisationens Intelligence-modul är
// påslagen. Måste köras INNAN budgetreservation/Gemini-anrop – detta är den verkliga
// spärren (UI-gating i src/hooks/useFeatures.js är bara UX). Standardorganisationens
// moduler.intelligence sattes till true vid migreringen (Etapp 1), så detta ändrar inget
// för befintlig drift förrän en superadmin faktiskt slår av modulen.
async function kravModul(organisationId, modul, felmeddelande) {
  const orgSnap = await db.collection("organisationer").doc(organisationId).get();
  if (orgSnap.data()?.moduler?.[modul] !== true) {
    throw new HttpsError("failed-precondition", felmeddelande);
  }
}
// Exporterad enbart för tests/functions/modulgating.test.cjs – låter testet verifiera
// gatingen direkt utan att behöva låta ett riktigt anrop nå Storage/Gemini (vilket i en
// testmiljö utan de tjänsterna hade gett ett långsamt/instabilt test snarare än ett snabbt,
// deterministiskt).
exports.kravModul = kravModul;

// Grov kostnadsuppskattning per bildtolkning (öre), används för budgetspärren.
const UPPSKATTAD_KOSTNAD_ORE = 50;
const STANDARD_TAK_ORE = 20000; // 200 kr
// Tak per enskild användare och månad, så att en person inte kan förbruka hela
// den gemensamma budgeten själv.
const MAX_PER_ANVANDARE_ORE = 5000; // 50 kr

// Etapp 7d: separat hastighetstak för klinikstöd-sökningen, UTÖVER kronbudgeten ovan. Anledningen
// är att sökmotorn (Custom Search) delar en gemensam kvot på 100 gratis sökningar/DAG för HELA
// installationen (alla organisationer), inte per organisation eller användare. Kronbudgeten
// (MAX_PER_ANVANDARE_ORE) skyddar mot kostnad men tillåter ändå ~100 anrop/månad per användare –
// en enskild klient som råkar hamna i en snabb återförsöksloop skulle på några sekunder kunna
// förbruka HELA dagens delade sökkvot för samtliga kunder. Detta rullande 1-timmesfönster stoppar
// den bristen oavsett budgettak.
const MAX_KLINIKSTOD_FRAGOR_PER_TIMME = 20;

// Budgeten är per organisation (Etapp 1) – annars skulle två kunder dela samma pott.
// Ligger som en egen subcollection under organisationen, i samma dokumentform som tidigare
// (installningar/geminiBudget), bara omplacerad.
function budgetDok(orgId) {
  return db.collection("organisationer").doc(orgId).collection("installningar").doc("geminiBudget");
}

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
// Exporterad enbart för tests/functions/klinikstodratelimit.test.cjs.
exports.kontrolleraOchOkaHastighet = kontrolleraOchOkaHastighet;

// Kontrollerar och reserverar budget innan ett dyrt Gemini-anrop görs.
// Kastar fel om månadens tak är nått, så att vi aldrig betalar för anrop vi inte har råd med.
async function reserveraBudget(orgId, uid) {
  const budgetRef = budgetDok(orgId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(budgetRef);
    const data = snap.exists ? snap.data() : {};
    const manad = aktuellManadNyckel();

    let anvantOre = data.anvantOre ?? 0;
    let aktuellManad = data.aktuellManad ?? manad;
    let anvantPerUid = data.anvantPerUid ?? {};
    const taketOre = data.taketOre ?? STANDARD_TAK_ORE;

    if (aktuellManad !== manad) {
      // Etapp 5: arkivera föregående månads slutliga förbrukning innan den nollställs, så
      // kostnadsuppföljning över tid blir möjlig (annars går siffrorna förlorade för alltid).
      // Sker "lativt" (första gången någon använder AI-import i den NYA månaden), inte via
      // ett schemalagt jobb exakt vid månadsskiftet – samma lata mönster budgeten redan
      // använde för själva nollställningen.
      if (data.aktuellManad) {
        tx.set(
          db.collection("organisationer").doc(orgId).collection("kostnadshistorik").doc(aktuellManad),
          { manad: aktuellManad, anvantOre, antalAnvandare: Object.keys(anvantPerUid).length }
        );
      }
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
      budgetRef,
      { anvantOre: anvantOre + UPPSKATTAD_KOSTNAD_ORE, aktuellManad, taketOre, anvantPerUid },
      { merge: true }
    );
  });
}
// Exporterad enbart för tests/functions/kostnadshistorik.test.cjs.
exports.reserveraBudget = reserveraBudget;

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

    const { organisationId } = await hamtaAnvandarInfo(request.auth.uid);
    await kravModul(organisationId, "intelligence", "AI-import kräver Intelligence-modulen.");
    await reserveraBudget(organisationId, request.auth.uid);

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

      // Matcha mot befintliga artiklar i SAMMA organisation och förråd på normaliserat namn,
      // så att en ny uppladdning ersätter en tidigare (t.ex. felaktig/utdaterad) post – och
      // aldrig av misstag skriver över en annan organisations artikel.
      const befintligaSnap = await db
        .collection("forradsartiklar")
        .where("organisationId", "==", organisationId)
        .where("forrad", "==", forrad)
        .get();
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
          organisationId,
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

    const { organisationId } = await hamtaAnvandarInfo(request.auth.uid);
    await kravModul(organisationId, "intelligence", "AI-import kräver Intelligence-modulen.");
    await reserveraBudget(organisationId, request.auth.uid);

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
        organisationId,
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

    const { organisationId } = await hamtaAnvandarInfo(request.auth.uid);
    await kravModul(organisationId, "intelligence", "Klinikstöd kräver Intelligence-modulen.");
    // Se kommentaren vid MAX_KLINIKSTOD_FRAGOR_PER_TIMME: skyddar den delade sökkvoten, inte
    // bara kronbudgeten. Ligger EFTER modulkontrollen (ingen anledning att räkna mot en
    // organisation som ändå skulle nekas) men FÖRE cache/sökmotor.
    await kontrolleraOchOkaHastighet(request.auth.uid, "klinikstod", MAX_KLINIKSTOD_FRAGOR_PER_TIMME);

    // Frågelogg (utan uid – vi vill se VAD som efterfrågas, inte VEM som frågar) så att
    // ledningen ser vilka kunskapsluckor som finns; vanliga frågor kan bli permanenta rutiner.
    // organisationId sätts ändå, så en organisations frågestatistik inte blandas med en annans.
    const fragaNyckel = fraga.toLowerCase().replace(/\s+/g, " ");
    db.collection("klinikfrageloggar")
      .add({ fraga: fragaNyckel, organisationId, tidpunkt: admin.firestore.FieldValue.serverTimestamp() })
      .catch(() => {});

    // Cache: samma fråga ställs ofta av flera personer. Ett cachat svar (7 dagar) sparar
    // både Custom Search-kvoten (100 gratis/dag) och Gemini-kostnad, och svarar direkt.
    // Nyckeln inkluderar organisationId – annars skulle en organisations cachade svar kunna
    // serveras till en annan (samma fråga, olika kunder ska inte dela cache).
    const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
    const cacheRef = db
      .collection("klinikfragecache")
      .doc(Buffer.from(`${organisationId}::${fragaNyckel}`).toString("base64url").slice(0, 480));
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
    await reserveraBudget(organisationId, request.auth.uid);

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
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan tvinga utloggning.");
  }

  const { userId } = request.data ?? {};
  if (!userId) {
    throw new HttpsError("invalid-argument", "userId krävs.");
  }

  // En superadmin i organisation A får aldrig kunna tvinga utloggning på en användare i
  // organisation B, även om de känner till uid:t.
  const mal = await hamtaAnvandarInfo(userId);
  if (mal.organisationId !== uppringare.organisationId) {
    throw new HttpsError("permission-denied", "Användaren tillhör inte din organisation.");
  }

  await admin.auth().revokeRefreshTokens(userId);
  await loggaRevision({
    organisationId: uppringare.organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: uppringare.roll,
    handelsetyp: "anvandare_utloggning_tvingad",
    objektTyp: "users",
    objektId: userId,
    sammanfattning: "Tvingade utloggning av en användare",
  });
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

  const { roll: _roll, organisationId } = await hamtaAnvandarInfo(request.auth.uid);
  void _roll;
  const [skaparSnap, orgAnvandare] = await Promise.all([
    db.collection("users").doc(request.auth.uid).get(),
    // Begränsat till SAMMA organisation – annars skulle man kunna @nämna (och trigga en
    // notis till) en användare i en helt annan kunds organisation.
    db.collection("users").where("organisationId", "==", organisationId).get(),
  ]);
  const skapadAvNamn = skaparSnap.data()?.namn ?? skaparSnap.data()?.email ?? "";

  const handtag = [...rensadText.matchAll(/@([a-zA-Z0-9._-]+)/g)].map((m) => m[1].toLowerCase());
  const omnamnda = handtag.length
    ? orgAnvandare.docs
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
    organisationId,
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

  const [skaparSnap, { organisationId }] = await Promise.all([
    db.collection("users").doc(request.auth.uid).get(),
    hamtaAnvandarInfo(request.auth.uid),
  ]);
  const skapadAvNamn = skaparSnap.data()?.namn ?? skaparSnap.data()?.email ?? "";

  const ref = await db.collection("feedback").add({
    typ,
    text: rensadText,
    status: "ny",
    organisationId,
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
    // Ingen organisationsskopning här avsiktligt: Gemini-nyckeln, sökmotorn och Storage-
    // bucketen är delad infrastruktur för hela installationen (inte kunddata), så vem som
    // helst med superadmin-roll i sin egen organisation får testa/verifiera den.
    const { roll } = await hamtaAnvandarInfo(request.auth.uid);
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
    // Etapp 3c: sparar resultatet så trender syns över tid i adminpanelen, inte bara senaste
    // körningen. Delad infrastruktur (som systemvarningar) – medvetet INTE organisationsskopat.
    await db.collection("halsokontrollhistorik").add({
      gemini,
      sokmotor,
      storage,
      klinikstod,
      tidpunkt: admin.firestore.FieldValue.serverTimestamp(),
    });
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
    // Ingen organisationsskopning här avsiktligt: Gemini-nyckeln, sökmotorn och Storage-
    // bucketen är delad infrastruktur för hela installationen (inte kunddata), så vem som
    // helst med superadmin-roll i sin egen organisation får testa/verifiera den.
    const { roll } = await hamtaAnvandarInfo(request.auth.uid);
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

// Kör samma kontroll som verifieraKlinikstod automatiskt varje morgon, så att en drift i
// sökmotorns domänkonfiguration (den enda punkt som kan gå sönder utanför appens egen kod,
// se Fas 13/16) upptäcks utan att någon admin behöver komma ihåg att klicka "Kör testfrågor"
// manuellt. Skriver en varning till systemvarningar (superadmin-only, se firestore.rules) bara
// om något faktiskt är fel – ingen notis skapas vid ett normalt, godkänt resultat.
exports.verifieraKlinikstodSchemalagt = onSchedule(
  { schedule: "every day 06:00", timeZone: "Europe/Stockholm", secrets: [SOKMOTOR_API_KEY], region: "europe-west1" },
  async () => {
    const resultat = await Promise.all(
      KLINIKSTOD_TESTFRAGOR.map(async (fraga) => {
        try {
          const traffar = await sokViaProgrammerbarSokmotor(fraga);
          const otillatna = traffar.filter((t) => !domanGodkand(t.url));
          return { fraga, otillatna: otillatna.map((t) => t.url) };
        } catch (fel) {
          return { fraga, fel: fel.message };
        }
      })
    );

    const problem = resultat.filter((r) => r.fel || r.otillatna?.length > 0);

    // Etapp 3c: sparar ett dagligt resultat (även när allt är OK), så adminpanelens historik
    // visar en obruten trend – inte bara larm vid problem.
    await db.collection("halsokontrollhistorik").add({
      klinikstod: {
        status: problem.length === 0 ? "ok" : "fel",
        meddelande:
          problem.length === 0
            ? null
            : problem.map((r) => r.fel ?? `otillåtna källor: ${r.otillatna.join(", ")}`).join(" | "),
      },
      tidpunkt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (problem.length === 0) return;

    const meddelande = problem
      .map((r) =>
        r.fel
          ? `"${r.fraga}": sökningen misslyckades (${r.fel})`
          : `"${r.fraga}": otillåtna källor – ${r.otillatna.join(", ")}`
      )
      .join(" | ");

    await db.collection("systemvarningar").add({
      typ: "klinikstod_kalla",
      meddelande: `Automatisk verifiering av klinikstöd-sökningen hittade problem: ${meddelande}`,
      tidpunkt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
);

// Etapp 3b (Operations): veckovis backup av kärncollections till Storage, per organisation.
// Endast för organisationer med Operations-modulen påslagen (samma modul som EXPORT_BACKUP-
// featuren i src/config/features.js hör till). Skriver EN json-fil per organisation och
// körning till backups/{orgId}/{datum}.json (se storage.rules – helt stängd för klienter,
// bara läsbar via Cloud Console/gsutil av den som har tillgång till projektet).
const BACKUP_COLLECTIONS = [
  "rutiner",
  "anslag",
  "kontakter",
  "lankbibliotek",
  "forradsartiklar",
  "skiftrapporter",
  "kommentarer",
];

async function backupaOrganisation(orgId) {
  const samlingar = {};
  for (const namn of BACKUP_COLLECTIONS) {
    const snap = await db.collection(namn).where("organisationId", "==", orgId).get();
    samlingar[namn] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  const datum = new Date().toISOString().slice(0, 10);
  const path = `backups/${orgId}/${datum}.json`;
  await bucket.file(path).save(JSON.stringify({ orgId, datum, samlingar }, null, 2), {
    contentType: "application/json",
  });
  return path;
}

exports.veckovisBackupSchemalagt = onSchedule(
  { schedule: "every monday 03:00", timeZone: "Europe/Stockholm", region: "europe-west1", timeoutSeconds: 300 },
  async () => {
    const orgSnap = await db.collection("organisationer").get();
    for (const orgDoc of orgSnap.docs) {
      if (orgDoc.data()?.moduler?.operations !== true) continue;
      try {
        await backupaOrganisation(orgDoc.id);
      } catch (fel) {
        console.error(`Backup misslyckades för organisation ${orgDoc.id}:`, fel);
      }
    }
  }
);
// Exporterad enbart för tests/functions/backup.test.cjs.
exports.backupaOrganisation = backupaOrganisation;

// Etapp 14b: hashkedjan för revisionslogg (se firestore.rules – collectionen är helt
// stängd för klienter, bara denna funktion skriver dit). Varje post länkas till den
// föregående via foregaendeHash, så en manipulerad eller borttagen post gör att kedjan
// inte längre stämmer. VIKTIG BEGRÄNSNING (se ETAPPLAN3.md Etapp 14): detta skyddar mot
// en icke-privilegierad klient som skriver direkt mot Firestore – INTE mot någon med
// Admin SDK- eller Firebase-konsolåtkomst, som kan skriva om hela kedjan inklusive
// omräknade hashar. Denna begränsning ska alltid anges tydligt i en export (Etapp 14d).
const REVISIONSLOGG_GENESIS_HASH = "genesis";

// Deterministisk JSON-serialisering (sorterade nycklar) – en vanlig JSON.stringify räcker
// inte, eftersom nyckelordningen annars kan skilja mellan skrivning och verifiering och ge
// en annan hash för identiskt innehåll.
function kanoniseraJSON(varde) {
  if (Array.isArray(varde)) {
    return `[${varde.map(kanoniseraJSON).join(",")}]`;
  }
  if (varde !== null && typeof varde === "object") {
    const nycklar = Object.keys(varde).sort();
    return `{${nycklar.map((k) => `${JSON.stringify(k)}:${kanoniseraJSON(varde[k])}`).join(",")}}`;
  }
  return JSON.stringify(varde);
}

function raknaHash(post) {
  return crypto.createHash("sha256").update(kanoniseraJSON(post)).digest("hex");
}

// tidpunkt sätts som Date.now() (inte FieldValue.serverTimestamp()) eftersom hashen måste
// beräknas över ett KÄNT värde innan skrivningen – ett serverTimestamp-sentinel-objekt vet
// vi inte det faktiska värdet av förrän efter commit. Funktionen körs ändå bara på servern
// (Cloud Functions), så tidsstämpeln är fortfarande betrodd, inte klientstyrd.
async function loggaRevision({ organisationId, aktorUid, aktorRoll, handelsetyp, objektTyp = null, objektId = null, sammanfattning }) {
  const huvudRef = db.collection("revisionsloggHuvud").doc(organisationId);
  const loggRef = db.collection("revisionslogg").doc();

  await db.runTransaction(async (transaktion) => {
    const huvudSnap = await transaktion.get(huvudRef);
    const foregaendeHash = huvudSnap.exists ? huvudSnap.data().senasteHash : REVISIONSLOGG_GENESIS_HASH;

    const post = {
      organisationId,
      tidpunkt: Date.now(),
      aktorUid,
      aktorRoll,
      handelsetyp,
      objektTyp,
      objektId,
      sammanfattning,
      foregaendeHash,
    };
    const hash = raknaHash(post);

    transaktion.set(loggRef, { ...post, hash });
    transaktion.set(huvudRef, { senasteHash: hash }, { merge: true });
  });

  return loggRef.id;
}

// Läser hela kedjan för en organisation i skrivordning och bygger om den från noll,
// oberoende av det som faktiskt står lagrat i respektive posts "hash"-fält – en post vars
// innehåll ändrats i efterhand (utan att hash-fältet räknades om) upptäcks alltså också,
// inte bara ett trasigt foregaendeHash-fält.
async function verifieraRevisionskedja(organisationId) {
  const snap = await db
    .collection("revisionslogg")
    .where("organisationId", "==", organisationId)
    .orderBy("tidpunkt", "asc")
    .get();

  let forvantadFoeregaendeHash = REVISIONSLOGG_GENESIS_HASH;
  for (const dokument of snap.docs) {
    const data = dokument.data();
    if (data.foregaendeHash !== forvantadFoeregaendeHash) {
      return { giltig: false, avvikelseVidId: dokument.id, orsak: "kedjan bruten (foregaendeHash matchar inte föregående post)" };
    }
    const { hash: lagradHash, ...postUtanHash } = data;
    const raknadHash = raknaHash(postUtanHash);
    if (raknadHash !== lagradHash) {
      return { giltig: false, avvikelseVidId: dokument.id, orsak: "posten har manipulerats (hash matchar inte innehållet)" };
    }
    forvantadFoeregaendeHash = raknadHash;
  }
  return { giltig: true, avvikelseVidId: null };
}

// Exporterade enbart för tests/functions/revisionslogg-hash.test.cjs och för framtida
// interna anrop (Etapp 14c: loggaRevision() anropas från befintliga flöden; Etapp 14d:
// verifieraRevisionskedja() nås via en admin-vy).
exports.loggaRevision = loggaRevision;
exports.verifieraRevisionskedja = verifieraRevisionskedja;

// Etapp 14c: kopplar loggaRevision() till händelser som redan sker idag. De flesta av
// dessa (rutinens godkännande och mjuka radering) skrivs DIREKT av klienten till
// Firestore (se useRutiner.js) – inte via en Cloud Function – så den enda platsen att
// pålitligt fånga dem server-side är en Firestore-trigger. En trigger får INTE automatiskt
// veta vem som gjorde skrivningen (bara dokumentets före/efter-innehåll), så aktören
// hämtas ur de fält klienten redan sparar (skapadAv/godkandAv/borttagenAv).
async function hamtaRollForAktor(uid) {
  if (!uid) return null;
  try {
    const snap = await db.collection("users").doc(uid).get();
    return snap.exists ? (snap.data().role ?? null) : null;
  } catch {
    return null;
  }
}

// Kärnlogiken är en egen, direkt anropbar funktion (inte bara triggerns callback) av samma
// skäl som backupaOrganisation/loggaRevision exporteras separat: `test:functions` kör bara
// firestore+storage-emulatorerna, INTE functions-emulatorn, så en riktig
// onDocumentCreated/onDocumentUpdated-trigger utlöses aldrig i testerna – bara den
// underliggande logiken kan testas direkt.

// Fångar det fall en rutin skapas SOM redan godkänd (en VÖL/superadmin som inte behöver
// eget godkännande, se kraverGodkannande i useRutiner.js) – det finns då ingen separat
// "godkännande"-skrivning att fånga med en update-trigger.
async function hanteraRutinSkapad(data, rutinId) {
  if (data.status !== "godkand") return;
  await loggaRevision({
    organisationId: data.organisationId ?? "default",
    aktorUid: data.skapadAv ?? null,
    aktorRoll: await hamtaRollForAktor(data.skapadAv),
    handelsetyp: "rutin_publicerad",
    objektTyp: "rutiner",
    objektId: rutinId,
    sammanfattning: `Rutin publicerad direkt vid skapande: ${data.titel ?? "(namnlös)"}`,
  });
}

exports.loggaRutinSkapadTrigger = onDocumentCreated(
  { document: "rutiner/{rutinId}", region: "europe-west1" },
  (event) => hanteraRutinSkapad(event.data.data(), event.params.rutinId)
);
exports.hanteraRutinSkapad = hanteraRutinSkapad;

// Fångar godkännande av ett tidigare utkast, samt mjuk radering (papperskorg).
// "Avpublicerad" nämns i ETAPPLAN3.md Etapp 14c, men finns inte som en faktisk funktion i
// appen (bara utkast→godkänd och mjuk radering existerar, se useRutiner.js) – loggas
// därför inte, i enlighet med genomgående krav 8 (bygg inte efter en premiss som inte
// stämmer mot koden).
async function hanteraRutinAndrad(fore, efter, rutinId) {
  const organisationId = efter.organisationId ?? fore.organisationId ?? "default";

  if (fore.status !== "godkand" && efter.status === "godkand") {
    await loggaRevision({
      organisationId,
      aktorUid: efter.godkandAv ?? null,
      aktorRoll: await hamtaRollForAktor(efter.godkandAv),
      handelsetyp: "rutin_godkand",
      objektTyp: "rutiner",
      objektId: rutinId,
      sammanfattning: `Rutin godkänd: ${efter.titel ?? "(namnlös)"}`,
    });
  }

  if (!fore.borttagen && efter.borttagen === true) {
    await loggaRevision({
      organisationId,
      aktorUid: efter.borttagenAv ?? null,
      aktorRoll: await hamtaRollForAktor(efter.borttagenAv),
      handelsetyp: "rutin_borttagen",
      objektTyp: "rutiner",
      objektId: rutinId,
      sammanfattning: `Rutin borttagen: ${efter.titel ?? "(namnlös)"}`,
    });
  }
}

exports.loggaRutinAndradTrigger = onDocumentUpdated(
  { document: "rutiner/{rutinId}", region: "europe-west1" },
  (event) => hanteraRutinAndrad(event.data.before.data(), event.data.after.data(), event.params.rutinId)
);
exports.hanteraRutinAndrad = hanteraRutinAndrad;

// Etapp 14d: begränsningstext som MÅSTE följa med varje export/verifiering, i enlighet med
// begränsningsrutan i ETAPPLAN3.md Etapp 14 – en granskare ska förstå exakt vad kontrollen
// bevisar och inte bevisar, inte bara få ett "OK".
const REVISIONSLOGG_BEGRANSNINGSTEXT =
  "Denna hashkedja bevisar att ingen post i listan nedan har ändrats eller tagits bort " +
  "VIA NORMAL APPANVÄNDNING (en inloggad klient som skriver mot Firestore) sedan den " +
  "skapades. Den bevisar INTE att kedjan aldrig manipulerats av någon med åtkomst till " +
  "Firebase-konsolen eller Admin SDK-behörighet (t.ex. en superadmin på leverantörssidan, " +
  "eller vid ett komprometterat tjänstekonto) – en sådan aktör kan i princip skriva om " +
  "hela kedjan, inklusive omräknade efterföljande hashar. Verifieringsinstruktion: varje " +
  "post innehåller foregaendeHash (hashen av föregående post) och hash (sha256 av postens " +
  "eget innehåll plus foregaendeHash). En bruten kedja - antingen ett foregaendeHash som " +
  "inte matchar föregående posts hash, eller en post vars innehåll inte längre ger samma " +
  "hash som lagrats - avslöjar en ändring gjord utanför loggaRevision().";

// Endast superadmin (egen organisation) eller leverantörsadmin får verifiera/exportera –
// samma behörighet som firestore.rules redan kräver för att LÄSA revisionslogg, men detta
// är en Cloud Function eftersom verifieraRevisionskedja() kör serverlogik (Admin SDK) som
// en klient inte kan utföra själv bara genom att läsa collectionen.
async function kravLasningAvRevisionslogg(request, organisationIdFranData) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  if (await arPlattformsadminServer(request.auth.uid)) {
    if (!organisationIdFranData) {
      throw new HttpsError("invalid-argument", "organisationId krävs.");
    }
    return organisationIdFranData;
  }
  const { roll, organisationId } = await hamtaAnvandarInfo(request.auth.uid);
  if (roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin eller leverantörsadmin kan läsa revisionsloggen.");
  }
  return organisationId;
}

exports.verifieraRevisionsloggAdmin = onCall({ region: "europe-west1" }, async (request) => {
  const organisationId = await kravLasningAvRevisionslogg(request, request.data?.organisationId);
  const resultat = await verifieraRevisionskedja(organisationId);
  return { ...resultat, begransningstext: REVISIONSLOGG_BEGRANSNINGSTEXT };
});

// Loggar själva exporttillfället (se Etapp 14c/ETAPPLAN3.md Etapp 14d: "Själva exporten
// loggas"). Innehållet i exporten byggs av klienten utifrån den revisionslogg-lista den
// redan har läsrätt till direkt via firestore.rules – denna funktion returnerar bara
// begränsningstexten plus kedjeresultatet, så klienten inte behöver hårdkoda texten själv
// och exporten alltid bygger på en färsk verifiering.
exports.exporteraRevisionslogg = onCall({ region: "europe-west1" }, async (request) => {
  const organisationId = await kravLasningAvRevisionslogg(request, request.data?.organisationId);
  const resultat = await verifieraRevisionskedja(organisationId);
  await loggaRevision({
    organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: (await hamtaAnvandarInfo(request.auth.uid)).roll ?? "plattformsadmin",
    handelsetyp: "revisionslogg_exporterad",
    objektTyp: "revisionslogg",
    objektId: null,
    sammanfattning: "Revisionsloggen exporterades",
  });
  return { ...resultat, begransningstext: REVISIONSLOGG_BEGRANSNINGSTEXT };
});

// Etapp 1 (multi-tenant-grund) – engångsmigrering: sätter organisationId = STANDARD_ORG på
// alla dokument som saknar det. Idempotent (hoppar över dokument som redan har fältet), så
// den kan köras flera gånger utan risk. Kör ALLTID med dryRun (standard) först och verifiera
// antalet mot förväntan innan den körs skarpt – se ETAPP1-ARBETSUPPGIFTER.md block 1b.
// klinikfragecache migreras medvetet INTE – cachenycklar är redan organisationsnamngivna för
// nya svar, och gamla omigrerade cache-poster upphör bara att träffas och byggs om naturligt.
const MIGRERBARA_COLLECTIONS = [
  "users",
  "rutiner",
  "forradsartiklar",
  "anslag",
  "kommentarer",
  "feedback",
  "klinikfragefeedback",
  "klinikfrageloggar",
  "sokloggar",
  "auditlogg",
  "visningar",
  "skiftrapporter",
  "kontakter",
  "lankbibliotek",
  "anteckningar",
];

exports.migreraTillOrganisation = onCall(
  { region: "europe-west1", timeoutSeconds: 540 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
    }
    const { roll } = await hamtaAnvandarInfo(request.auth.uid);
    if (roll !== "superadmin") {
      throw new HttpsError("permission-denied", "Endast superadmin kan köra migreringen.");
    }

    const dryRun = request.data?.dryRun !== false;

    if (!dryRun) {
      await db
        .collection("organisationer")
        .doc(STANDARD_ORG)
        .set(
          {
            namn: "Standardorganisation",
            status: "active",
            plan: "core",
            moduler: { operations: true, intelligence: true },
          },
          { merge: true }
        );
    }

    const resultat = {};
    for (const samling of MIGRERBARA_COLLECTIONS) {
      const snap = await db.collection(samling).get();
      const attSkriva = snap.docs.filter((d) => !d.data().organisationId).map((d) => d.ref);
      resultat[samling] = { totalt: snap.size, saknarOrganisationId: attSkriva.length };

      if (!dryRun) {
        for (let i = 0; i < attSkriva.length; i += 500) {
          const batch = db.batch();
          attSkriva
            .slice(i, i + 500)
            .forEach((ref) => batch.set(ref, { organisationId: STANDARD_ORG }, { merge: true }));
          await batch.commit();
        }
      }
    }
    return { dryRun, resultat };
  }
);

// ---------------------------------------------------------------------------------------
// Etapp 6 (kund nummer två): leverantörsadmin, organisationsetablering och ett
// inbjudningsflöde som ersätter den tidigare öppna självbetjänings-registreringen.
// Se ETAPPLAN2.md Etapp 6 och firestore.rules (arPlattformsadmin, organisationenArAktiv).
// ---------------------------------------------------------------------------------------

// Existens i denna collection ÄR behörigheten – inget annat fält kontrolleras. Collectionen
// kan ALDRIG skrivas av en klient (se firestore.rules), bara av Admin SDK härifrån, så en
// leverantörsadmin kan aldrig utses av misstag eller av en kund. Medvetet frikopplad från
// organisationId/role på users/{uid} – en leverantörsadmin behöver inte tillhöra någon
// specifik kundorganisation alls.
async function arPlattformsadminServer(uid) {
  const snap = await db.collection("plattformsadmin").doc(uid).get();
  return snap.exists;
}

async function kravPlattformsadmin(uid) {
  if (!(await arPlattformsadminServer(uid))) {
    throw new HttpsError("permission-denied", "Endast en leverantörsadmin har åtkomst till detta.");
  }
}

// Engångsbootstrap: fungerar ENDAST innan någon leverantörsadmin finns alls, och kräver då
// att anroparen redan är superadmin i sin egen organisation (stoppar en godtycklig
// nyregistrerad från att bootstrappa sig själv till leverantörsadmin i en tom installation).
// Efter den första finns är detta anrop permanent stängt – gorTillPlattformsadmin används då.
exports.blibForstaPlattformsadmin = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const { roll } = await hamtaAnvandarInfo(request.auth.uid);
  if (roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast en superadmin kan bootstrappa den första leverantörsadmin-kontot.");
  }
  const befintliga = await db.collection("plattformsadmin").limit(1).get();
  if (!befintliga.empty) {
    throw new HttpsError(
      "failed-precondition",
      "Det finns redan minst en leverantörsadmin. Be en befintlig leverantörsadmin om åtkomst istället."
    );
  }
  await db.collection("plattformsadmin").doc(request.auth.uid).set({
    blevPlattformsadmin: admin.firestore.FieldValue.serverTimestamp(),
    satteSig: request.auth.uid,
  });
  return { ok: true };
});

// Låter en BEFINTLIG leverantörsadmin utse fler – normalfallet efter bootstrap.
exports.gorTillPlattformsadmin = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { uid } = request.data ?? {};
  if (!uid || typeof uid !== "string") {
    throw new HttpsError("invalid-argument", "uid krävs.");
  }
  await db.collection("plattformsadmin").doc(uid).set({
    blevPlattformsadmin: admin.firestore.FieldValue.serverTimestamp(),
    satteSig: request.auth.uid,
  });
  return { ok: true };
});

// Etapp 15a: nyckelstegen i etableringsguidens välkomstchecklista för kundens superadmin.
// Bara en lista av nycklar än så länge – Etapp 15b bygger den interaktiva vyn som läser/
// bockar av dessa, men dokumentet skapas redan här så steget inte glöms bort separat.
const VALKOMSTCHECKLISTA_STEG = [
  "bjud_in_kollegor",
  "satt_roller",
  "importera_rutiner",
  "aktivera_2fa_policy",
  "satt_gemini_budget",
];

// Etapp 6b (utökad i 15a): skapar en ny kundorganisation i en enda skrivning – standard-
// inställningar (budgettak) sätts direkt så en superadmin i den nya organisationen möter en
// färdig, fungerande installation, inte en tom lucka som råkar sakna förväntade fält.
// Etapp 15a lägger till de fält upphandlings-/faktureringsunderlaget (15c/15d) behöver
// (org.nr, kontaktperson, användartak, avtalsstatus) samt bjuder in kundens första
// superadmin i samma anrop – tidigare krävde det ett manuellt steg utanför appen, eftersom
// skapaInbjudan bara kan anropas av en superadmin som redan finns i organisationen.
exports.skapaOrganisation = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const namn = (request.data?.namn ?? "").trim();
  if (!namn) {
    throw new HttpsError("invalid-argument", "Ett organisationsnamn krävs.");
  }
  const moduler = {
    operations: Boolean(request.data?.moduler?.operations),
    intelligence: Boolean(request.data?.moduler?.intelligence),
  };

  const orgnr = (request.data?.orgnr ?? "").trim();
  const kontaktNamn = (request.data?.kontaktperson?.namn ?? "").trim();
  const kontaktEpost = (request.data?.kontaktperson?.epost ?? "").trim().toLowerCase();
  if (kontaktEpost && !kontaktEpost.includes("@")) {
    throw new HttpsError("invalid-argument", "Kontaktpersonens e-postadress är ogiltig.");
  }
  const anvandartakRaw = request.data?.anvandartak;
  const anvandartak =
    anvandartakRaw === undefined || anvandartakRaw === null || anvandartakRaw === ""
      ? null
      : Number(anvandartakRaw);
  if (anvandartak !== null && (!Number.isInteger(anvandartak) || anvandartak < 1)) {
    throw new HttpsError("invalid-argument", "Användartak måste vara ett positivt heltal.");
  }

  const orgRef = db.collection("organisationer").doc();
  await orgRef.set({
    namn,
    status: "aktiv",
    moduler,
    orgnr: orgnr || null,
    kontaktperson: kontaktNamn || kontaktEpost ? { namn: kontaktNamn || null, epost: kontaktEpost || null } : null,
    anvandartak,
    // 15d: statusflagga istället för avtalssignering/betalning i appen (se ETAPPLAN3.md,
    // rekommendationen under 15d) – "offert" tills leverantören manuellt sätter den vidare.
    avtalsstatus: "offert",
    // 15e: sätts av ett separat steg när provperioden faktiskt startar, inte här.
    provperiodSlut: null,
    skapad: admin.firestore.FieldValue.serverTimestamp(),
    skapadAv: request.auth.uid,
  });
  await orgRef.collection("installningar").doc("geminiBudget").set({
    anvantOre: 0,
    aktuellManad: aktuellManadNyckel(),
    taketOre: STANDARD_TAK_ORE,
    anvantPerUid: {},
  });
  await orgRef.collection("installningar").doc("valkomstchecklista").set({
    steg: Object.fromEntries(VALKOMSTCHECKLISTA_STEG.map((nyckel) => [nyckel, false])),
    skapad: admin.firestore.FieldValue.serverTimestamp(),
  });

  let inbjudanToken = null;
  if (kontaktEpost) {
    inbjudanToken = await skapaInbjudanIntern({
      organisationId: orgRef.id,
      epost: kontaktEpost,
      roll: "superadmin",
      skapadAv: request.auth.uid,
    });
  }

  // Etapp 10d: valfritt startbibliotek av rutinmallar så en ny kund inte möter en helt tom
  // app. Skapas som REDAN GODKÄNDA (synliga direkt) men tydligt märkta "(mall)" i titeln och
  // med en anmärkning i innehållet – se verksamhetsmallar.js för resonemanget kring varför
  // detta är strukturella exempel, inte riktig klinisk vägledning.
  const verksamhetstyp = request.data?.verksamhetstyp;
  const mallar = VERKSAMHETSMALLAR[verksamhetstyp];
  let antalMallrutiner = 0;
  if (mallar) {
    const batch = db.batch();
    for (const mall of mallar) {
      batch.set(db.collection("rutiner").doc(), {
        titel: mall.titel,
        innehall: mall.innehall,
        omrade: mall.omrade,
        status: "godkand",
        organisationId: orgRef.id,
        kalla: "verksamhetsmall",
        skapadAv: request.auth.uid,
        skapad: admin.firestore.FieldValue.serverTimestamp(),
      });
      antalMallrutiner += 1;
    }
    await batch.commit();
  }

  await loggaRevision({
    organisationId: orgRef.id,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_etablerad",
    objektTyp: "organisationer",
    objektId: orgRef.id,
    sammanfattning: `Organisationen "${namn}" etablerad`,
  });

  return { orgId: orgRef.id, antalMallrutiner, inbjudanToken };
});

// Etapp 6a: översikt åt leverantörsadmin – en rad per kundorganisation med moduler, antal
// användare och senaste avslutade månadens AI-kostnad (redan arkiverad av reserveraBudget,
// se Etapp 5). Ingen kunddata (rutiner/anslag/etc) exponeras, bara administrativ metadata.
exports.listaOrganisationer = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);

  const orgSnap = await db.collection("organisationer").get();
  const organisationer = await Promise.all(
    orgSnap.docs.map(async (orgDoc) => {
      const data = orgDoc.data();
      const [anvandareSnap, kostnadSnap] = await Promise.all([
        db.collection("users").where("organisationId", "==", orgDoc.id).get(),
        orgDoc.ref.collection("kostnadshistorik").orderBy("manad", "desc").limit(1).get(),
      ]);
      return {
        orgId: orgDoc.id,
        namn: data.namn ?? orgDoc.id,
        status: data.status ?? "aktiv",
        moduler: data.moduler ?? {},
        antalAnvandare: anvandareSnap.size,
        senasteKostnad: kostnadSnap.empty ? null : kostnadSnap.docs[0].data(),
      };
    })
  );
  return { organisationer };
});

// Etapp 6d: pausar/återaktiverar en organisation. Enforcementet sker i firestore.rules
// (organisationenArAktiv(), infogat i matcharMinOrg()) – en pausad organisations medlemmar
// nekas läs-/skrivåtkomst till allt organisationsskopat innehåll, men kan fortfarande läsa
// organisationer/{orgId} själv (så de faktiskt ser meddelandet om att kontot är pausat).
exports.pausaOrganisation = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { orgId, pausad } = request.data ?? {};
  if (!orgId || typeof pausad !== "boolean") {
    throw new HttpsError("invalid-argument", "orgId och pausad (boolean) krävs.");
  }
  await db.collection("organisationer").doc(orgId).set({ status: pausad ? "pausad" : "aktiv" }, { merge: true });
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: pausad ? "organisation_pausad" : "organisation_atveraktiverad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: pausad ? "Organisationen pausades" : "Organisationen återaktiverades",
  });
  return { ok: true };
});

// Etapp 6d: GDPR-/uppsägningsexport – återanvänder Etapp 3b:s backupaOrganisation() rakt av,
// samma filformat och lagringsplats (backups/{orgId}/{datum}.json), bara nåbar på begäran
// istället för bara via det schemalagda veckojobbet.
exports.exporteraOrganisation = onCall({ region: "europe-west1", timeoutSeconds: 120 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { orgId } = request.data ?? {};
  if (!orgId) {
    throw new HttpsError("invalid-argument", "orgId krävs.");
  }
  const path = await backupaOrganisation(orgId);
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_exporterad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: `Organisationsdata exporterad (${path})`,
  });
  return { path };
});

// Etapp 6c: inbjudningsflöde istället för öppen självbetjänings-registrering. Ett nytt konto
// kan numera ALDRIG skapa sitt eget users/{uid}-dokument direkt (se firestore.rules – create
// är stängt helt) – den enda vägen in är att lösa in en giltig inbjudan här, som körs med
// Admin SDK och därför kan kringgå den regeln på ett kontrollerat sätt.
const GILTIGA_ROLLER = ["superadmin", "vol", "sektionsledare", "vec", "forradesansvarig", "personal"];
const INBJUDAN_GILTIGHETSTID_MS = 7 * 24 * 60 * 60 * 1000;

// Delad av skapaInbjudan (superadmin bjuder in till sin egen organisation) och skapaOrganisation
// (Etapp 15a: leverantörsadmin bjuder in den nya kundens första superadmin i samma anrop som
// etableringen). Ingen egen behörighetskontroll här – anroparen ansvarar för det.
async function skapaInbjudanIntern({ organisationId, epost, roll, skapadAv }) {
  const token = crypto.randomBytes(24).toString("base64url");
  await db.collection("inbjudningar").doc(token).set({
    organisationId,
    roll,
    epost,
    anvand: false,
    skapadAv,
    skapad: admin.firestore.FieldValue.serverTimestamp(),
    utgangstid: Date.now() + INBJUDAN_GILTIGHETSTID_MS,
  });
  return token;
}

// Skapas av en superadmin i adminpanelen (KAN bara bjuda in till sin EGEN organisation –
// organisationId hämtas här server-side från anroparen, tas ALDRIG emot som klientdata,
// annars hade en superadmin kunnat bjuda in någon till en annan organisation).
exports.skapaInbjudan = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const { roll: anroparRoll, organisationId } = await hamtaAnvandarInfo(request.auth.uid);
  if (anroparRoll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan bjuda in nya konton.");
  }
  const epost = (request.data?.epost ?? "").trim().toLowerCase();
  const roll = request.data?.roll;
  if (!epost || !epost.includes("@")) {
    throw new HttpsError("invalid-argument", "En giltig e-postadress krävs.");
  }
  if (!GILTIGA_ROLLER.includes(roll)) {
    throw new HttpsError("invalid-argument", "En giltig roll krävs.");
  }

  const token = await skapaInbjudanIntern({ organisationId, epost, roll, skapadAv: request.auth.uid });
  return { token };
});

// Publikt (INGEN inloggning krävs – personen har ännu inget konto) läs-anrop som bara
// avslöjar det minimum som behövs för att visa ett meningsfullt registreringsformulär:
// e-postadress, roll och organisationsnamn. Avslöjar ALDRIG organisationId rakt av eller
// någon annan organisations existens – token är den enda hemligheten (192 bitar, se
// crypto.randomBytes(24) ovan, praktiskt taget ogissningsbar).
exports.granskaInbjudan = onCall({ region: "europe-west1" }, async (request) => {
  const token = request.data?.token;
  if (!token || typeof token !== "string") {
    throw new HttpsError("invalid-argument", "token krävs.");
  }
  const snap = await db.collection("inbjudningar").doc(token).get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Inbjudan hittades inte. Kontrollera länken eller be om en ny.");
  }
  const data = snap.data();
  if (data.anvand) {
    throw new HttpsError("failed-precondition", "Inbjudan har redan använts.");
  }
  if (Date.now() > data.utgangstid) {
    throw new HttpsError("failed-precondition", "Inbjudan har gått ut. Be om en ny.");
  }
  const orgSnap = await db.collection("organisationer").doc(data.organisationId).get();
  return {
    epost: data.epost,
    roll: data.roll,
    organisationsNamn: orgSnap.data()?.namn ?? data.organisationId,
  };
});

// Löser in en inbjudan för ett REDAN skapat Firebase Auth-konto (klienten anropar
// createUserWithEmailAndPassword FÖRST, sedan detta – se src/context/AuthContext.jsx).
// Skriver users/{uid} via Admin SDK, vilket är den enda vägen in numera eftersom
// firestore.rules stänger klientens egen create-rätt helt.
exports.losInInbjudan = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const token = request.data?.token;
  const namn = (request.data?.namn ?? "").trim();
  if (!token || typeof token !== "string" || !namn) {
    throw new HttpsError("invalid-argument", "token och namn krävs.");
  }

  const inbjudanRef = db.collection("inbjudningar").doc(token);
  // organisationId/roll fångas här och används EFTER transaktionen för att logga
  // revisionen – loggaRevision() kör sin egen transaktion (mot revisionsloggHuvud) och kan
  // därför inte anropas inifrån den här transaktionens callback.
  let inbjudanOrganisationId;
  let inbjudanRoll;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(inbjudanRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Inbjudan hittades inte.");
    }
    const data = snap.data();
    if (data.anvand) {
      throw new HttpsError("failed-precondition", "Inbjudan har redan använts.");
    }
    if (Date.now() > data.utgangstid) {
      throw new HttpsError("failed-precondition", "Inbjudan har gått ut.");
    }
    // Kräver att kontot som faktiskt loggade in matchar den inbjudna e-postadressen – annars
    // skulle vem som helst med token kunna lösa in NÅGON ANNANS inbjudan mot sitt eget konto.
    const inloggadEpost = (request.auth.token.email ?? "").trim().toLowerCase();
    if (inloggadEpost !== data.epost) {
      throw new HttpsError(
        "permission-denied",
        "Den inloggade e-postadressen matchar inte inbjudans e-postadress."
      );
    }

    inbjudanOrganisationId = data.organisationId;
    inbjudanRoll = data.roll;

    tx.set(db.collection("users").doc(request.auth.uid), {
      namn,
      email: data.epost,
      role: data.roll,
      organisationId: data.organisationId,
      skapad: admin.firestore.FieldValue.serverTimestamp(),
    });
    tx.set(
      inbjudanRef,
      { anvand: true, anvandAv: request.auth.uid, anvandTid: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
  });

  await loggaRevision({
    organisationId: inbjudanOrganisationId,
    aktorUid: request.auth.uid,
    aktorRoll: inbjudanRoll,
    handelsetyp: "anvandare_skapad",
    objektTyp: "users",
    objektId: request.auth.uid,
    sammanfattning: `Nytt konto skapat via inbjudan, roll: ${inbjudanRoll}`,
  });

  return { ok: true };
});
