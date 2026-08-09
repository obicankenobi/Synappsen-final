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

// Etapp 24b: samma rollmängd som KAN_HANTERA_FORRAD i src/firebase/roles.js – dupliceras
// lokalt eftersom functions/ är CommonJS och inte delar moduler med det ES-modulbaserade
// src/-trädet (samma mönster som GILTIGA_ROLLER nedan).
const KAN_HANTERA_FORRAD = ["superadmin", "forradesansvarig"];
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

// Delad av skapaInbjudan, losInInbjudan och uppdateraAnvandarRoll (Etapp 32c).
const GILTIGA_ROLLER = ["superadmin", "vol", "sektionsledare", "vec", "forradesansvarig", "personal"];

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

// Etapp 48b: den delade dygnskvoten (100/dygn, kommentaren ovan) hade fram tills nu ingen
// egen mätpunkt alls – bara hastighetsbegränsningen per användare. Utan detta kunde en kunds
// förmiddag släcka klinikstödet för alla andra kunder utan att någon fick en förvarning.
const SOKKVOT_DAGSTAK = 100;
const SOKKVOT_VARNING_TROSKEL = 0.8;

// Etapp 48d: 48b löste bara SYNLIGHET (larm till en människa) – ingenting stoppade en enskild
// organisation från att själv ta hela den delade dygnskvoten. Förvalt till hälften av den
// delade kvoten: ett skyddsräcke (ingen ensam organisation kan släcka klinikstödet för alla
// andra), inte en åtstramning – de allra flesta organisationer använder aldrig i närheten av
// detta. Konfigurerbart högre eller lägre per organisation via satSokkvotTakPerDygn.
const SOKKVOT_ORG_TAK_STANDARD = 50;

function dagensDatumStockholm() {
  // sv-SE ger "ÅÅÅÅ-MM-DD", samma sorterbara format som används för manadsNyckel m.fl.
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm" });
}

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

// Etapp 48b: räknar upp den delade sökmotorkvoten (se SOKKVOT_DAGSTAK) EN gång per faktiskt
// externt anrop till Custom Search – anropas alltså aldrig vid en cacheträff, bara direkt
// före sokViaProgrammerbarSokmotor(). Totalen ligger i systemstatus/sokkvot, samma delade,
// icke-organisationsskopade infrastruktur-collection som revisionskedjan (Etapp 46) – bara
// AGGREGAT (ingen per-organisation-uppdelning) sparas där, eftersom systemstatus/{id} är
// läsbar för EN superadmin I VILKEN ORGANISATION SOM HELST (se firestore.rules), inte bara
// leverantörsadmin. Att lägga en annan kunds sökförbrukning där hade läckt cross-tenant, av
// exakt samma skäl som redan gjorde att AI-budgetlarmet går via Sentry och inte
// systemvarningar (se kommentaren i reserveraBudget). Per-organisation-räkningen sparas
// därför på organisationer/{orgId} istället, som redan bara är läsbar av den egna
// organisationen och leverantörsadmin.
async function okaSokkvot(organisationId) {
  const idag = dagensDatumStockholm();
  const globalRef = db.collection("systemstatus").doc("sokkvot");
  const orgRef = db.collection("organisationer").doc(organisationId);
  let larmAttSkicka = null;

  await db.runTransaction(async (tx) => {
    const [globalSnap, orgSnap] = await Promise.all([tx.get(globalRef), tx.get(orgRef)]);

    // Etapp 48d: kontrolleras FÖRST, innan något skrivs – en organisation som redan nått sitt
    // eget tak ska varken räknas mot den delade totalen eller mot sig själv en gång till, och
    // det faktiska Custom Search-anropet (efter denna funktion, se fragaKlinisktStod) ska
    // aldrig göras alls i så fall.
    const orgData = orgSnap.exists ? orgSnap.data() : {};
    const orgTak = orgData.sokkvotTakPerDygn ?? SOKKVOT_ORG_TAK_STANDARD;
    const orgDagensAntal = orgData.sokkvotDatum === idag ? (orgData.sokkvotAntal ?? 0) : 0;
    if (orgDagensAntal >= orgTak) {
      throw new HttpsError(
        "resource-exhausted",
        "Din organisations dagliga sökkvot för klinikstöd är slut. Den delas av alla era " +
          "kollegor och återställs vid midnatt – kontakta superadmin om taket behöver höjas."
      );
    }

    const globalData = globalSnap.exists ? globalSnap.data() : {};
    const globalDagensAntal = globalData.datum === idag ? (globalData.totalAntal ?? 0) : 0;
    const nyttTotalAntal = globalDagensAntal + 1;
    // Larmar EN gång per dygn (flaggan nollställs automatiskt när datumet byts ovan) när
    // förbrukningen passerar tröskeln – samma "inte vid varje anrop därefter"-princip som
    // BUDGETVARNING_TROSKEL redan använder.
    const larmRedanSkickatIdag = globalData.datum === idag && (globalData.larmSkickad ?? false);
    const larmSkickad =
      larmRedanSkickatIdag || nyttTotalAntal >= SOKKVOT_DAGSTAK * SOKKVOT_VARNING_TROSKEL;
    if (!larmRedanSkickatIdag && larmSkickad) {
      larmAttSkicka = { organisationId, totalAntal: nyttTotalAntal, tak: SOKKVOT_DAGSTAK };
    }
    tx.set(globalRef, { datum: idag, totalAntal: nyttTotalAntal, tak: SOKKVOT_DAGSTAK, larmSkickad });

    tx.set(orgRef, { sokkvotDatum: idag, sokkvotAntal: orgDagensAntal + 1 }, { merge: true });
  });

  if (larmAttSkicka) {
    Sentry.captureMessage("Delad sökkvot (klinikstöd) närmar sig dagstaket", {
      level: "warning",
      tags: { typ: "sokkvotvarning" },
      extra: larmAttSkicka,
    });
  }
}
// Exporterad enbart för tests/functions/sokkvot.test.cjs.
exports.okaSokkvot = okaSokkvot;

// Etapp 32b: en plötslig kostnadsspik "tystnar" idag – budgetspärren STOPPAR anropet vid
// taket, men larmar aldrig innan dess, så en organisation kan gå från 10% till 100% använd
// budget mellan två adminpanelsbesök utan att någon blir varskodd. Larmar EN gång per månad
// (flaggan nollställs vid månadsskiftet ovan) när förbrukningen passerar tröskeln, inte vid
// varje anrop därefter – annars drunknar en riktig spik i upprepade larm.
const BUDGETVARNING_TROSKEL = 0.8;

// Kontrollerar och reserverar budget innan ett dyrt Gemini-anrop görs.
// Kastar fel om månadens tak är nått, så att vi aldrig betalar för anrop vi inte har råd med.
async function reserveraBudget(orgId, uid) {
  const budgetRef = budgetDok(orgId);
  let larmAttSkicka = null;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(budgetRef);
    const data = snap.exists ? snap.data() : {};
    const manad = aktuellManadNyckel();

    let anvantOre = data.anvantOre ?? 0;
    let aktuellManad = data.aktuellManad ?? manad;
    let anvantPerUid = data.anvantPerUid ?? {};
    let budgetvarningSkickad = data.budgetvarningSkickad ?? false;
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
      budgetvarningSkickad = false;
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
    const nyttAnvantOre = anvantOre + UPPSKATTAD_KOSTNAD_ORE;

    if (!budgetvarningSkickad && taketOre > 0 && nyttAnvantOre / taketOre >= BUDGETVARNING_TROSKEL) {
      budgetvarningSkickad = true;
      larmAttSkicka = { orgId, anvantOre: nyttAnvantOre, taketOre };
    }

    tx.set(
      budgetRef,
      { anvantOre: nyttAnvantOre, aktuellManad, taketOre, anvantPerUid, budgetvarningSkickad },
      { merge: true }
    );
  });

  // Skickas EFTER transaktionen (samma mönster som losInInbjudan/loggaRevision) – Sentry, INTE
  // systemvarningar: den collectionen är delad, orgs-oberoende infrastruktur (superadmin i
  // VILKEN organisation som helst kan läsa den, se firestore.rules) och skulle här läcka
  // en annan kunds AI-förbrukning till alla andra kunders superadmins.
  if (larmAttSkicka) {
    Sentry.captureMessage("AI-budget närmar sig taket", {
      level: "warning",
      tags: { typ: "budgetvarning" },
      extra: larmAttSkicka,
    });
  }
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

// Etapp 18b: "Föreslå steg" – delar upp en REDAN GODKÄND rutins befintliga text i
// stegförslag. Skapar ALDRIG nytt kliniskt innehåll, bara en annan layout på det som redan
// står i den godkända rutinen (se SAKERHETSRAPPORT.md, MDR-ställningstagandet för Etapp 18).
// Går under samma Gemini-budgetspärr som bildtolkning, och resultatet är alltid ett förslag
// som klienten visar upp för granskning – ingen skrivning till Firestore sker härifrån.
const stegForslagSchema = {
  type: SchemaType.OBJECT,
  properties: {
    steg: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING },
        },
        required: ["text"],
      },
    },
  },
  required: ["steg"],
};

async function foreslaStegMedGemini(innehall) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: stegForslagSchema,
    },
  });

  const prompt = `Du delar upp en REDAN GODKÄND rutintext från en akutmottagning i en
stegvis checklista, till för att köras ett steg i taget under ett akut arbetsmoment.

VIKTIGT: Återge ENDAST innehåll som redan står i texten nedan, omformulerat till korta,
konkreta handlingssteg. Lägg ALDRIG till nya rekommendationer, doser, bedömningar eller
information som inte redan finns i texten – det är en ren omstrukturering, inte en
klinisk bedömning.

Rutintext:
"""
${innehall}
"""

Returnera en lista med steg, i den ordning de ska utföras. Varje steg ska vara en kort mening
som beskriver EN handling.`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text()).steg;
}

exports.foreslaChecklistSteg = onCall(
  { secrets: [GEMINI_API_KEY], region: "europe-west1", timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
    }
    const innehall = (request.data?.innehall ?? "").trim();
    if (!innehall) {
      throw new HttpsError("invalid-argument", "innehall krävs.");
    }
    if (innehallerPersonnummer(innehall)) {
      throw new HttpsError(
        "invalid-argument",
        "Texten verkar innehålla ett personnummer. Patientuppgifter får inte sparas i Synappsen."
      );
    }

    const { organisationId } = await hamtaAnvandarInfo(request.auth.uid);
    await kravModul(organisationId, "intelligence", "Föreslå steg kräver Intelligence-modulen.");
    await reserveraBudget(organisationId, request.auth.uid);

    try {
      const steg = await foreslaStegMedGemini(innehall);
      const rensadeSteg = steg
        .filter((s) => !innehallerPersonnummer(s.text))
        .slice(0, 12);
      return { steg: rensadeSteg };
    } catch (fel) {
      console.error("Stegförslag misslyckades:", fel);
      if (fel instanceof HttpsError) throw fel;
      throw new HttpsError("internal", `Stegförslag misslyckades: ${fel.message}`);
    }
  }
);

// Etapp 19b: "Föreslå frågor" – tar fram 2-4 flervalsfrågor ur en REDAN GODKÄND rutins
// befintliga text, till mikrokvissen som visas vid kvittering. Samma princip som
// foreslaChecklistSteg (Etapp 18b): frågorna får bara pröva förståelse av det som redan står
// i texten, aldrig lägga till nytt kliniskt innehåll. Alltid ett utkast som måste granskas.
const kvissForslagSchema = {
  type: SchemaType.OBJECT,
  properties: {
    fragor: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          fraga: { type: SchemaType.STRING },
          alternativ: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          rattIndex: { type: SchemaType.NUMBER },
          hanvisning: { type: SchemaType.STRING },
        },
        required: ["fraga", "alternativ", "rattIndex", "hanvisning"],
      },
    },
  },
  required: ["fragor"],
};

async function foreslaKvissfragorMedGemini(innehall) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: kvissForslagSchema,
    },
  });

  const prompt = `Du tar fram en kort mikrokviss (2-4 flervalsfrågor) för en REDAN GODKÄND
rutintext från en akutmottagning, som visas när personal kvitterar att de läst och förstått.

VIKTIGT: Frågorna får ENDAST pröva förståelse av det som redan står i texten nedan. Lägg
ALDRIG till nya rekommendationer, doser, bedömningar eller information som inte redan finns
i texten – det är kunskapskontroll, inte en klinisk bedömning.

Rutintext:
"""
${innehall}
"""

Returnera 2-4 frågor. Varje fråga ska ha 3-4 svarsalternativ, ett rättIndex (0-baserat index
i alternativ-listan för det rätta svaret), och en hänvisning – en kort text som pekar ut
VILKET stycke/vilken del av rutinen svaret kommer från.`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text()).fragor;
}

exports.foreslaKvissfragor = onCall(
  { secrets: [GEMINI_API_KEY], region: "europe-west1", timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
    }
    const innehall = (request.data?.innehall ?? "").trim();
    if (!innehall) {
      throw new HttpsError("invalid-argument", "innehall krävs.");
    }
    if (innehallerPersonnummer(innehall)) {
      throw new HttpsError(
        "invalid-argument",
        "Texten verkar innehålla ett personnummer. Patientuppgifter får inte sparas i Synappsen."
      );
    }

    const { organisationId } = await hamtaAnvandarInfo(request.auth.uid);
    await kravModul(organisationId, "intelligence", "Föreslå frågor kräver Intelligence-modulen.");
    await reserveraBudget(organisationId, request.auth.uid);

    try {
      const fragor = await foreslaKvissfragorMedGemini(innehall);
      const rensadeFragor = fragor
        .filter((f) => !innehallerPersonnummer(f.fraga) && !innehallerPersonnummer(f.hanvisning))
        .slice(0, 4);
      return { fragor: rensadeFragor };
    } catch (fel) {
      console.error("Kvissförslag misslyckades:", fel);
      if (fel instanceof HttpsError) throw fel;
      throw new HttpsError("internal", `Kvissförslag misslyckades: ${fel.message}`);
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

// Etapp 21b: källbevakning – ett schemalagt jobb som hämtar varje externt refererad källa
// (rutiner.externaKallor, se Etapp 21a) en gång i veckan och jämför en hash av innehållet mot
// senast sparade. Cachas per URL över ALLA organisationer (kallbevakning/{urlHash}) – samma
// källa refererad av flera kunder hämtas bara en gång, inte en gång per kund.
const KALLBEVAKNING_USER_AGENT = "SynappsenKallbevakning/1.0 (+kontakt via leverantören)";
// Snällt mot källorna: en liten paus mellan varje hämtning istället för att skjuta iväg alla
// samtidigt. Källistan är i praktiken liten (ett fåtal unika URL:er över alla kunder), så det
// här är inget verkligt kostnadstak – bara ett artigt tempo.
const KALLBEVAKNING_PAUS_MS = 500;

function extraheraText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashaInnehall(html) {
  return crypto.createHash("sha256").update(extraheraText(html)).digest("hex");
}

function hashaUrl(url) {
  return crypto.createHash("sha256").update(url).digest("hex");
}

// Enkel (inte fullständigt RFC 9309-kompatibel) tolkning av robots.txt: hittar blocket för
// "User-agent: *" och samlar dess Disallow-mönster. Källistan är ett litet, känt urval
// medicinska referenssajter – målet är att respektera ett uttryckligt förbud, inte att bygga
// en generell webbcrawler.
async function hamtaDisallowMonster(host) {
  try {
    const svar = await fetch(`https://${host}/robots.txt`, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": KALLBEVAKNING_USER_AGENT },
    });
    if (!svar.ok) return [];
    const text = await svar.text();
    const monster = [];
    let iRelevantBlock = false;
    for (const radRaw of text.split("\n")) {
      const rad = radRaw.trim();
      const kolonIndex = rad.indexOf(":");
      if (kolonIndex === -1) continue;
      const nyckel = rad.slice(0, kolonIndex).trim().toLowerCase();
      const varde = rad.slice(kolonIndex + 1).trim();
      if (nyckel === "user-agent") {
        iRelevantBlock = varde === "*";
      } else if (iRelevantBlock && nyckel === "disallow" && varde) {
        monster.push(varde);
      }
    }
    return monster;
  } catch {
    // Inget robots.txt, eller ett fel vid hämtning – tolkas som inget uttryckligt förbud
    // (samma "fail open" som när sidan i övrigt inte svarar).
    return [];
  }
}

function tillatenAvRobots(pathname, disallowMonster) {
  return !disallowMonster.some((monster) => pathname.startsWith(monster));
}

// Kärnlogiken, exporterad separat (samma mönster som kontrolleraProvperioder) så
// tests/functions kan anropa den direkt utan en riktig schemaläggare.
async function kontrolleraKallbevakning() {
  const orgSnap = await db.collection("organisationer").get();
  const bevakadeOrgar = new Set(
    orgSnap.docs.filter((d) => d.data()?.moduler?.kallbevakning === true).map((d) => d.id)
  );
  if (bevakadeOrgar.size === 0) return;

  const rutinSnap = await db.collection("rutiner").where("status", "==", "godkand").get();

  const urlTillRutiner = new Map();
  for (const rutinDoc of rutinSnap.docs) {
    const data = rutinDoc.data();
    if (!bevakadeOrgar.has(data.organisationId)) continue;
    for (const url of data.externaKallor ?? []) {
      // Extra skyddslager: samma domänkontroll som firestore.rules – en URL som av någon
      // anledning skulle ha smugit sig igenom (t.ex. skriven direkt av Admin SDK) hämtas
      // ändå aldrig.
      if (!domanGodkand(url)) continue;
      if (!urlTillRutiner.has(url)) urlTillRutiner.set(url, []);
      urlTillRutiner.get(url).push({ id: rutinDoc.id, organisationId: data.organisationId });
    }
  }

  const robotsCache = new Map();
  for (const [url, rutiner] of urlTillRutiner) {
    try {
      const uppslagenUrl = new URL(url);
      if (!robotsCache.has(uppslagenUrl.host)) {
        robotsCache.set(uppslagenUrl.host, await hamtaDisallowMonster(uppslagenUrl.host));
      }
      if (!tillatenAvRobots(uppslagenUrl.pathname, robotsCache.get(uppslagenUrl.host))) {
        console.log(`Källbevakning: hoppar över ${url} (nekad av robots.txt)`);
        continue;
      }

      await new Promise((resolve) => setTimeout(resolve, KALLBEVAKNING_PAUS_MS));

      const cacheRef = db.collection("kallbevakning").doc(hashaUrl(url));
      const cacheSnap = await cacheRef.get();

      const svar = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": KALLBEVAKNING_USER_AGENT },
      });

      if (!svar.ok) {
        // Etapp 21d: en trasig länk (404 m.fl.) är i sig ett kvalitetsfynd, och rapporteras
        // som en egen typ – inte samma sak som en faktisk innehållsändring.
        if (svar.status === 404) {
          await Promise.all(
            rutiner.map((r) =>
              db.collection("rutiner").doc(r.id).update({
                kallVarning: true,
                kallVarningTyp: "trasig_lank",
                kallVarningUrl: url,
                kallVarningTidpunkt: admin.firestore.FieldValue.serverTimestamp(),
              })
            )
          );
        } else {
          console.error(`Källbevakning: ${url} svarade ${svar.status}`);
        }
        continue;
      }

      const html = await svar.text();
      const nyHash = hashaInnehall(html);
      const tidigareHash = cacheSnap.exists ? cacheSnap.data().senasteHash : null;

      await cacheRef.set(
        { url, senasteHash: nyHash, senastKontrollerad: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );

      // Bara en verklig ändring (INTE den allra första kontrollen av en ny URL) flaggas –
      // annars skulle varje nyligen tillagd källa omedelbart visas som "ändrad".
      if (tidigareHash && tidigareHash !== nyHash) {
        await Promise.all(
          rutiner.map((r) =>
            db.collection("rutiner").doc(r.id).update({
              kallVarning: true,
              kallVarningTyp: "andring",
              kallVarningUrl: url,
              kallVarningTidpunkt: admin.firestore.FieldValue.serverTimestamp(),
            })
          )
        );
      }
    } catch (fel) {
      console.error(`Källbevakning misslyckades för ${url}:`, fel);
    }
  }
}
exports.kontrolleraKallbevakning = kontrolleraKallbevakning;

exports.kallbevakningSchemalagt = onSchedule(
  { schedule: "every monday 04:00", timeZone: "Europe/Stockholm", region: "europe-west1", timeoutSeconds: 300 },
  kontrolleraKallbevakning
);

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

    // Etapp 48b: räknas här, direkt före det faktiska externa anropet – en cacheträff ovan
    // returnerar redan innan den här punkten och kostar ingen kvot. Räknas oavsett om anropet
    // nedan sedan lyckas eller inte, eftersom kvoten hos Google konsumeras av själva anropet.
    await okaSokkvot(organisationId);

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

// Etapp 32c: rolländring är sannolikt den enskilt allvarligaste luckan i revisionsloggen –
// den gamla klientkoden (en naken updateDoc, se firestore.rules) lämnade INGA spår när någon
// gjordes till superadmin. Flyttat hit så att varje rolländring går genom loggaRevision().
// firestore.rules stänger nu den direkta klientvägen (role-fältet är immutabelt för
// superadmin-grenen av users/{userId}s update-regel) – detta är den enda återstående vägen.
exports.uppdateraAnvandarRoll = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan ändra roller.");
  }
  const { userId, roll } = request.data ?? {};
  if (!userId || !GILTIGA_ROLLER.includes(roll)) {
    throw new HttpsError("invalid-argument", "userId och en giltig roll krävs.");
  }
  const mal = await hamtaAnvandarInfo(userId);
  if (mal.organisationId !== uppringare.organisationId) {
    throw new HttpsError("permission-denied", "Användaren tillhör inte din organisation.");
  }
  const gammalRoll = mal.roll;
  await db.collection("users").doc(userId).update({ role: roll });
  await loggaRevision({
    organisationId: uppringare.organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: uppringare.roll,
    handelsetyp: "anvandare_roll_andrad",
    objektTyp: "users",
    objektId: userId,
    sammanfattning: `Roll ändrad: ${gammalRoll ?? "okänd"} → ${roll}`,
  });
  return { ok: true };
});

// Etapp 32c: moduler på/av flyttat från en naken klient-updateDoc (Admin.jsx) hit, så
// på/av-slag loggas. Samma behörighet som tidigare (superadmin, egen organisation) –
// firestore.rules stänger nu den direkta klientvägen för moduler-fältet.
const GILTIGA_MODULER = ["operations", "intelligence", "kallbevakning"];

exports.uppdateraModuler = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan ändra moduler.");
  }
  const { modul, paslagen } = request.data ?? {};
  if (!GILTIGA_MODULER.includes(modul) || typeof paslagen !== "boolean") {
    throw new HttpsError("invalid-argument", "En giltig modul och paslagen (boolean) krävs.");
  }
  await db.collection("organisationer").doc(uppringare.organisationId).set(
    { moduler: { [modul]: paslagen } },
    { merge: true }
  );
  await loggaRevision({
    organisationId: uppringare.organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: uppringare.roll,
    handelsetyp: "organisation_modul_andrad",
    objektTyp: "organisationer",
    objektId: uppringare.organisationId,
    sammanfattning: `Modulen "${modul}" ${paslagen ? "aktiverad" : "avaktiverad"}`,
  });
  return { ok: true };
});

// Etapp 32c: 2FA-policyn (vilka roller som kräver en andra faktor) flyttat från en naken
// klient-updateDoc (Admin.jsx) hit. En organisation som sänker sina egna säkerhetskrav är
// exakt den typen av händelse som ska synas i revisionsloggen.
exports.uppdateraMfaPolicy = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan ändra 2FA-policyn.");
  }
  const { kravMfaForRoller } = request.data ?? {};
  if (!Array.isArray(kravMfaForRoller) || !kravMfaForRoller.every((r) => GILTIGA_ROLLER.includes(r))) {
    throw new HttpsError("invalid-argument", "kravMfaForRoller måste vara en lista av giltiga roller.");
  }
  await db.collection("organisationer").doc(uppringare.organisationId).set(
    { sakerhet: { kravMfaForRoller } },
    { merge: true }
  );
  await loggaRevision({
    organisationId: uppringare.organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: uppringare.roll,
    handelsetyp: "organisation_mfapolicy_andrad",
    objektTyp: "organisationer",
    objektId: uppringare.organisationId,
    sammanfattning: `2FA krävs nu för: ${kravMfaForRoller.length ? kravMfaForRoller.join(", ") : "ingen roll"}`,
  });
  return { ok: true };
});

// Etapp 32c: budgettaket (Gemini Vision) flyttat från en naken klient-setDoc (useGeminiBudget.js)
// hit. anvantOre (den faktiska förbrukningen) rörs aldrig här – bara det superadmin-satta taket.
exports.uppdateraGeminiBudgetTak = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan ändra budgettaket.");
  }
  const { taketOre } = request.data ?? {};
  if (!Number.isInteger(taketOre) || taketOre < 0) {
    throw new HttpsError("invalid-argument", "taketOre måste vara ett heltal ≥ 0.");
  }
  await db
    .collection("organisationer")
    .doc(uppringare.organisationId)
    .collection("installningar")
    .doc("geminiBudget")
    .set({ taketOre }, { merge: true });
  await loggaRevision({
    organisationId: uppringare.organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: uppringare.roll,
    handelsetyp: "organisation_budgettak_andrad",
    objektTyp: "organisationer",
    objektId: uppringare.organisationId,
    sammanfattning: `Budgettak ändrat till ${(taketOre / 100).toFixed(2)} kr`,
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
//
// Etapp 49d: samma funktion används av BÅDE den schemalagda katastrofbackupen OCH knappen
// "Exportera" i leverantörsvyn (GDPR-liknande dataportabilitet) – exporteraOrganisation
// nedan är bara en tunn wrapper runt den här. Utökad från 7 till 12 collections + en
// underkollektion + en särskild post, efter en premisskontroll som visade att hälften av
// appens org-skopade data saknades helt. `systemstatus` läggs MEDVETET INTE till – den
// collectionen är delad plattforminfrastruktur (Etapp 46/48b) utan organisationId-fält
// överhuvudtaget, inte orgdata; en where("organisationId","==",orgId)-fråga mot den skulle
// bara ge ett tomt, missvisande resultat.
const BACKUP_COLLECTIONS = [
  "rutiner",
  "anslag",
  "kontakter",
  "lankbibliotek",
  "forradsartiklar",
  "skiftrapporter",
  "kommentarer",
  "checklistkorningar",
  "bristanmalningar",
  "introduktionsspar",
  "introduktionstilldelningar",
  "kompetenskrav",
  "revisionslogg",
];

// Etapp 49d: matvardenSnapshots är INTE en toppnivå-collection som de ovan – den ligger som
// en underkollektion på organisationer/{orgId}/matvardenSnapshots/{datum} (se
// skapaMatvardenSnapshot), utan eget organisationId-fält (skopningen är redan implicit i
// sökvägen). Kräver därför en egen fråga/skrivväg, inte den generiska where()-loopen ovan.
const BACKUP_SUBCOLLECTIONS = ["matvardenSnapshots"];

async function backupaOrganisation(orgId) {
  const samlingar = {};
  for (const namn of BACKUP_COLLECTIONS) {
    const snap = await db.collection(namn).where("organisationId", "==", orgId).get();
    samlingar[namn] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  for (const namn of BACKUP_SUBCOLLECTIONS) {
    const snap = await db.collection("organisationer").doc(orgId).collection(namn).get();
    samlingar[namn] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  // Etapp 49d: revisionsloggHuvud/{orgId} är EN post per organisation, nyckeln ÄR orgId –
  // ingen where()-fråga, bara en direkt läsning. Behövs för att revisionsloggens hashkedja
  // ska kunna fortsätta korrekt efter en återställning (se loggaRevision, som läser
  // senasteHash härifrån för nästa post) – utan den skulle kedjan se intakt ut bakåt men
  // knäckas framåt av nästa händelse som loggas efter en återställning.
  const huvudSnap = await db.collection("revisionsloggHuvud").doc(orgId).get();
  samlingar.revisionsloggHuvud = huvudSnap.exists ? [{ id: orgId, ...huvudSnap.data() }] : [];

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

// Etapp 33c: gallring av backuper äldre än retentionstiden. Ägarbeslut 2026-08-01 (se
// ETAPPLAN5.md Etapp 33c, avtal/PUB-AVTAL-MALL.md p. 6): 90 dagar. Filnamnet självt bär
// datumet (backups/{orgId}/{ÅÅÅÅ-MM-DD}.json, satt av backupaOrganisation ovan) – vi litar
// på det snarare än filens skapelsemetadata, eftersom en återställd/kopierad fil ändå ska
// räknas efter sitt ANGIVNA backup-datum, inte efter när den råkade hamna i bucketen.
const BACKUP_RETENTION_DAGAR = 90;

async function gallraGamlaBackuper() {
  const [filer] = await bucket.getFiles({ prefix: "backups/" });
  const grans = Date.now() - BACKUP_RETENTION_DAGAR * 24 * 60 * 60 * 1000;
  let antalRaderade = 0;
  for (const fil of filer) {
    // Sökvägsformen är backups/{orgId}/{ÅÅÅÅ-MM-DD}.json.
    const matchning = fil.name.match(/^backups\/[^/]+\/(\d{4}-\d{2}-\d{2})\.json$/);
    if (!matchning) continue;
    const filDatum = new Date(`${matchning[1]}T00:00:00Z`).getTime();
    if (Number.isNaN(filDatum) || filDatum >= grans) continue;
    await fil.delete();
    antalRaderade++;
  }
  return antalRaderade;
}
// Exporterad enbart för tests/functions/backup-gallring.test.cjs.
exports.gallraGamlaBackuper = gallraGamlaBackuper;

exports.backupGallringSchemalagt = onSchedule(
  { schedule: "every monday 03:30", timeZone: "Europe/Stockholm", region: "europe-west1", timeoutSeconds: 300 },
  async () => {
    try {
      const antal = await gallraGamlaBackuper();
      if (antal > 0) console.log(`Backupgallring: raderade ${antal} backup(er) äldre än ${BACKUP_RETENTION_DAGAR} dagar.`);
    } catch (fel) {
      console.error("Backupgallring misslyckades:", fel);
    }
  }
);

// Etapp 33a: motstycket till backupaOrganisation() – fanns inte alls tidigare (verifierat).
// En backup som aldrig kan läsas tillbaka är en förhoppning, inte ett skydd.
//
// JSON.stringify skriver en Firestore Timestamp som { _seconds, _nanoseconds } (dess enda
// egna, uppräkningsbara fält – inget eget toJSON). Utan att bygga om det till en riktig
// Timestamp här skulle en återställd rutins "skapad"-fält bli en vanlig map, inte ett
// tidsstämpelfält frågor som orderBy("skapad") kan sortera på.
function ateruppbyggTidsstamplar(varde) {
  if (Array.isArray(varde)) return varde.map(ateruppbyggTidsstamplar);
  if (varde && typeof varde === "object") {
    const nycklar = Object.keys(varde);
    if (
      nycklar.length === 2 &&
      typeof varde._seconds === "number" &&
      typeof varde._nanoseconds === "number"
    ) {
      return new admin.firestore.Timestamp(varde._seconds, varde._nanoseconds);
    }
    const resultat = {};
    for (const [nyckel, delvarde] of Object.entries(varde)) {
      resultat[nyckel] = ateruppbyggTidsstamplar(delvarde);
    }
    return resultat;
  }
  return varde;
}

// Läser en tidigare skriven backupfil och skriver tillbaka innehållet till Firestore för EN
// organisation. Hård gränsdragning (se ETAPPLAN5.md Etapp 33a): enbart plattformsadmin, path
// måste peka på en backup under EXAKT den angivna organisationens egen mapp, och varje
// dokument som skulle höra till en ANNAN organisation hoppas över – en felriktad eller
// manipulerad backupfil kan alltså aldrig skriva över en annan kunds data, oavsett vad filen
// påstår sig innehålla.
async function aterstallOrganisation(orgId, sokvag) {
  if (!sokvag.startsWith(`backups/${orgId}/`)) {
    throw new HttpsError(
      "invalid-argument",
      "Sökvägen måste peka på en backup under den angivna organisationens egen mapp."
    );
  }
  const [buffer] = await bucket.file(sokvag).download();
  const data = JSON.parse(buffer.toString("utf8"));
  if (data.orgId !== orgId) {
    throw new HttpsError(
      "failed-precondition",
      "Backupfilens orgId matchar inte den angivna organisationen."
    );
  }

  let antalAterstallda = 0;
  for (const [samlingsNamn, dokument] of Object.entries(data.samlingar ?? {})) {
    // Etapp 49d: matvardenSnapshots ligger under organisationer/{orgId}/... i Firestore
    // (se BACKUP_SUBCOLLECTIONS/backupaOrganisation ovan) – måste skrivas tillbaka dit, inte
    // till en toppnivå-collection med samma namn (som inte existerar för den datan).
    const samlingsRef = BACKUP_SUBCOLLECTIONS.includes(samlingsNamn)
      ? db.collection("organisationer").doc(orgId).collection(samlingsNamn)
      : db.collection(samlingsNamn);
    const BATCHSTORLEK = 400; // Firestores gräns är 500 skrivningar per batch
    for (let i = 0; i < dokument.length; i += BATCHSTORLEK) {
      const batch = db.batch();
      for (const dok of dokument.slice(i, i + BATCHSTORLEK)) {
        const { id, ...falt } = dok;
        if (falt.organisationId && falt.organisationId !== orgId) continue;
        batch.set(samlingsRef.doc(id), ateruppbyggTidsstamplar(falt));
        antalAterstallda += 1;
      }
      await batch.commit();
    }
  }
  return antalAterstallda;
}
// Exporterad enbart för tests/functions/aterstallning.test.cjs.
exports.aterstallOrganisation = aterstallOrganisation;

exports.aterstallOrganisationCallable = onCall({ region: "europe-west1", timeoutSeconds: 300 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { orgId, sokvag } = request.data ?? {};
  if (!orgId || typeof orgId !== "string" || !sokvag || typeof sokvag !== "string") {
    throw new HttpsError("invalid-argument", "orgId och sokvag krävs.");
  }
  const antalAterstallda = await aterstallOrganisation(orgId, sokvag);
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_aterstalld",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: `Återställd från backup (${sokvag}), ${antalAterstallda} dokument`,
  });
  return { antalAterstallda };
});

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

// Etapp 32d: "en manipuleringsdetekterande logg som ingen kontrollerar detekterar inget"
// (ETAPPLAN5.md krav 11). Kedjekontrollen (Etapp 14) kördes tidigare bara på begäran, från
// adminpanelen – en manipulerad kedja hade kunnat stå oupptäckt på obestämd tid om ingen
// råkade klicka på "Verifiera". Kör samma kontroll automatiskt varje natt, för ALLA
// organisationer, och larma (Sentry + systemvarningar, samma mönster som
// verifieraKlinikstodSchemalagt ovan) bara vid en faktisk avvikelse.
async function verifieraRevisionskedjor() {
  const orgSnap = await db.collection("organisationer").get();
  const avvikelser = [];
  for (const orgDoc of orgSnap.docs) {
    const resultat = await verifieraRevisionskedja(orgDoc.id);
    if (!resultat.giltig) {
      avvikelser.push({ orgId: orgDoc.id, ...resultat });
    }
  }

  // Etapp 46: skriv resultatet ÄVEN när allt är i sin ordning, inte bara vid en avvikelse.
  // Utan detta går det inte att skilja "kedjan är intakt" från "det här jobbet slutade
  // köras för tre veckor sedan" – tystnad betydde tidigare båda sakerna, oskiljbart, för
  // den som tittar i adminpanelen. `systemstatus/revisionskedja` är ett enda, delat
  // sammanfattningsdokument (samma icke-organisationsskopade mönster som
  // `systemvarningar`) – inte en logg, bara senaste kända läget.
  await db
    .collection("systemstatus")
    .doc("revisionskedja")
    .set({
      senastKord: admin.firestore.FieldValue.serverTimestamp(),
      alletGiltigt: avvikelser.length === 0,
      antalOrganisationerKontrollerade: orgSnap.size,
      // Bara organisation + den redan maskinella orsakstexten (t.ex. "kedjan bruten") –
      // aldrig dokumentinnehåll, samma försiktighet som Sentry-larmet nedan.
      avvikelser: avvikelser.map((a) => ({ orgId: a.orgId, orsak: a.orsak })),
    });

  if (avvikelser.length === 0) return avvikelser;

  // Aldrig dokumentinnehåll i larmet – bara organisation, dokument-ID och den redan
  // maskinella orsakstexten (t.ex. "kedjan bruten"), som inte innehåller PII.
  Sentry.captureMessage("Revisionsloggens hashkedja är bruten", {
    level: "error",
    tags: { typ: "revisionslogg-integritetsbrott" },
    extra: { avvikelser },
  });
  await db.collection("systemvarningar").add({
    typ: "revisionslogg_integritet",
    meddelande: `Hashkedjan är bruten för ${avvikelser.length} organisation(er): ${avvikelser
      .map((a) => `${a.orgId} (${a.orsak})`)
      .join(" | ")}`,
    tidpunkt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return avvikelser;
}
// Exporterad enbart för tests/functions/etapp32d.test.cjs (samma mönster som
// kontrolleraProvperioder/backupaOrganisation – test:functions kör bara firestore+storage-
// emulatorerna, inte en riktig scheduler).
exports.verifieraRevisionskedjor = verifieraRevisionskedjor;

exports.verifieraRevisionskedjorSchemalagt = onSchedule(
  { schedule: "every day 04:00", timeZone: "Europe/Stockholm", region: "europe-west1" },
  verifieraRevisionskedjor
);

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

// Etapp 24b: central push-sändning. Notiserna är MEDVETET ordfattiga (bara titel + en
// generisk rad, aldrig rutinens/anslagets/bristanmälans fritext) – en push syns på en låst
// skärm som vem som helst i väntrummet kan se, se ETAPPLAN4.md Etapp 24b. Datat skickas som
// "data-only" (inget "notification"-fält) så att src/sw.js:s onBackgroundMessage är den ENDA
// som visar notisen – annars visar FCM en egen, odekorerad standardnotis UTÖVER vår egen.
async function skickaPush(anvandarLista, { titel, body, url }) {
  const tokenTillUid = new Map();
  const tokens = [];
  for (const a of anvandarLista) {
    for (const token of a.pushTokens ?? []) {
      tokenTillUid.set(token, a.id);
      tokens.push(token);
    }
  }
  if (tokens.length === 0) return;

  const resp = await admin.messaging().sendEachForMulticast({
    data: { title: titel, body: body ?? "", url: url ?? "/" },
    tokens,
  });

  const dodaTokensPerUid = new Map();
  resp.responses.forEach((r, i) => {
    if (r.success) return;
    const kod = r.error?.code;
    if (kod !== "messaging/registration-token-not-registered" && kod !== "messaging/invalid-registration-token") {
      return;
    }
    const uid = tokenTillUid.get(tokens[i]);
    if (!dodaTokensPerUid.has(uid)) dodaTokensPerUid.set(uid, []);
    dodaTokensPerUid.get(uid).push(tokens[i]);
  });
  await Promise.all(
    Array.from(dodaTokensPerUid.entries()).map(([uid, dodaTokens]) =>
      db
        .collection("users")
        .doc(uid)
        .update({ pushTokens: admin.firestore.FieldValue.arrayRemove(...dodaTokens) })
    )
  );
}
exports.skickaPush = skickaPush;

// Etapp 24c: förvalt läge är återhållsamt (genomgående krav 10) – `pushInstallningar` saknas
// helt för de allra flesta användare tills de aktivt slår på en notistyp i Profil.jsx, så
// frågan filtrerar på `== true` (inte "!= false") för att aldrig av misstag inkludera någon
// som inte gjort ett aktivt val.
async function hamtaAnvandareMedPushPreferens(organisationId, installningsNyckel, extraFilter) {
  const snap = await db
    .collection("users")
    .where("organisationId", "==", organisationId)
    .where(`pushInstallningar.${installningsNyckel}`, "==", true)
    .get();
  const anvandare = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return extraFilter ? anvandare.filter(extraFilter) : anvandare;
}
exports.hamtaAnvandareMedPushPreferens = hamtaAnvandareMedPushPreferens;

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
  await skickaPushForNyRutin(data.organisationId ?? "default", data.omrade, data.skapadAv);
}

// Etapp 24b: "ny/ändrad rutin inom mitt område" – premisskontroll (genomgående krav 8): det
// finns inget användarfält som binder en person till ett specifikt omrade (`kliniskt-stod`/
// `administration`), bara rollbaserad redigeringsbehörighet (se farRedigeraOmrade i
// firestore.rules). En riktig områdesfiltrering hade därför krävt en ny datamodell för
// "vilket område jobbar jag i", vilket inte finns idag. Förenklat till hela organisationen
// istället – dokumenterat som en avsiktlig avgränsning i ETAPPLAN4.md.
async function skickaPushForNyRutin(organisationId, omrade, skapadAv) {
  const mottagare = await hamtaAnvandareMedPushPreferens(
    organisationId,
    "nyRutin",
    (a) => a.id !== skapadAv
  );
  await skickaPush(mottagare, {
    titel: omrade === "administration" ? "Ny rutin i Administration" : "Ny rutin i Kliniskt stöd",
    body: "Det finns en ny eller ändrad rutin att läsa.",
    url: omrade === "administration" ? "/administration" : "/kliniskt-stod",
  });
}

// Etapp 24b: "källvarning till rutinens ägare" – agare är antingen { typ: "person", uid } eller
// { typ: "roll", roll } (se RutinFormular.jsx). Ingen fritext (rutinens titel räcker som
// generisk identifiering, samma nivå av detalj som redan syns i appens egen notisklocka).
async function skickaPushForKallvarning(organisationId, agare, titel, rutinId) {
  if (!agare) return;
  let mottagare;
  if (agare.typ === "person" && agare.uid) {
    mottagare = await hamtaAnvandareMedPushPreferens(organisationId, "kallVarning", (a) => a.id === agare.uid);
  } else if (agare.typ === "roll" && agare.roll) {
    mottagare = await hamtaAnvandareMedPushPreferens(organisationId, "kallVarning", (a) => a.role === agare.roll);
  } else {
    return;
  }
  await skickaPush(mottagare, {
    titel: "Källvarning på en rutin du äger",
    body: `Källan till "${titel ?? "en rutin"}" verkar ha ändrats eller sluta fungera.`,
    url: `/kliniskt-stod#rutin-${rutinId}`,
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
    await skickaPushForNyRutin(organisationId, efter.omrade, efter.godkandAv);
  }

  // Etapp 24b: källvarning (se kontrolleraKallbevakning/Sektionssida.jsx) sätts via update,
  // inte en separat collection – fångas här som en tredje gren i samma update-trigger istället
  // för en ny trigger.
  if (!fore.kallVarning && efter.kallVarning === true) {
    await skickaPushForKallvarning(organisationId, efter.agare, efter.titel, rutinId);
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

// Etapp 24b: bristanmälan till förrådsansvarig. Ingen fritext skickas (kommentarfältet på
// bristanmälan hoppas medvetet över, se ETAPPLAN4.md Etapp 24b) – bara artikelns namn, som
// redan är strukturerad katalogdata, inte fritext skriven av en användare.
async function hanteraBristanmalningSkapad(data, bristId) {
  const organisationId = data.organisationId ?? "default";
  const mottagare = await hamtaAnvandareMedPushPreferens(
    organisationId,
    "bristanmalan",
    (a) => KAN_HANTERA_FORRAD.includes(a.role)
  );
  await skickaPush(mottagare, {
    titel: "Ny bristanmälan",
    body: `${data.artikelNamn ?? "En artikel"} har anmälts som slut eller lågt saldo.`,
    url: "/logistik",
  });
  return bristId;
}
exports.hanteraBristanmalningSkapad = hanteraBristanmalningSkapad;

exports.hanteraBristanmalningSkapadTrigger = onDocumentCreated(
  { document: "bristanmalningar/{bristId}", region: "europe-west1" },
  (event) => hanteraBristanmalningSkapad(event.data.data(), event.params.bristId)
);

// Etapp 37b: när en superadmin startar en riktad granskningsrunda, meddela varje berörd
// rutins ägare EN gång (inte en push per rutin) om hur många av deras rutiner ingår i rundan
// och till när. `rutinIds` är redan en tagen ögonblicksbild (se firestore.rules) – funktionen
// läser bara upp respektive rutins nuvarande ägare för att veta vem som ska meddelas.
async function hanteraGranskningsrundaSkapad(data, rundaId) {
  const organisationId = data.organisationId ?? "default";
  const rutinIds = data.rutinIds ?? [];
  if (rutinIds.length === 0) return rundaId;

  const rutinDocs = await Promise.all(rutinIds.map((id) => db.collection("rutiner").doc(id).get()));
  const perAgare = new Map();
  for (const snap of rutinDocs) {
    if (!snap.exists) continue;
    const agare = snap.data().agare;
    const nyckel =
      agare?.typ === "person" && agare.uid
        ? `person:${agare.uid}`
        : agare?.typ === "roll" && agare.roll
          ? `roll:${agare.roll}`
          : null;
    if (!nyckel) continue;
    if (!perAgare.has(nyckel)) perAgare.set(nyckel, { agare, antal: 0 });
    perAgare.get(nyckel).antal += 1;
  }

  const omradeUrl =
    data.omrade === "administration" ? "/administration" : data.omrade === "logistik" ? "/logistik" : "/kliniskt-stod";

  await Promise.all(
    Array.from(perAgare.values()).map(async ({ agare, antal }) => {
      const mottagare =
        agare.typ === "person"
          ? await hamtaAnvandareMedPushPreferens(organisationId, "granskningsrunda", (a) => a.id === agare.uid)
          : await hamtaAnvandareMedPushPreferens(organisationId, "granskningsrunda", (a) => a.role === agare.roll);
      await skickaPush(mottagare, {
        titel: "En granskningsrunda har startat",
        body:
          antal === 1
            ? `En rutin du äger ska granskas senast ${data.deadline ?? "snart"}.`
            : `${antal} rutiner du äger ska granskas senast ${data.deadline ?? "snart"}.`,
        url: omradeUrl,
      });
    })
  );
  return rundaId;
}
exports.hanteraGranskningsrundaSkapad = hanteraGranskningsrundaSkapad;

exports.hanteraGranskningsrundaSkapadTrigger = onDocumentCreated(
  { document: "granskningsrundor/{rundaId}", region: "europe-west1" },
  (event) => hanteraGranskningsrundaSkapad(event.data.data(), event.params.rundaId)
);

// Etapp 24b: daglig påminnelse om anslag med en kvitteringsfrist som närmar sig, till var och
// en som inte redan kvitterat – mirrorar exakt samma "vem har inte kvitterat"-logik som
// Admin.jsx redan visar klientsidan (anslagMedFrist), se ETAPPLAN4.md Etapp 24b.
// `pushPaminnelseSkickadTill` håller reda på vem som redan fått EN påminnelse per anslag, så
// jobbet (som körs dagligen) inte skickar samma push varje dag fram till fristen.
const KVITTERINGSPAMINNELSE_FONSTER_MS = 3 * 24 * 60 * 60 * 1000;

async function kontrolleraKvitteringsfrister() {
  const nu = Date.now();
  // `borttagen` sätts bara VID radering (se useAnslag.js) – aldrig till `false` vid
  // skapande – så ett Firestore-villkor `where("borttagen", "!=", true)` hade uteslutit ALLA
  // icke-raderade anslag (inequality-filter matchar aldrig dokument som helt saknar fältet).
  // Filtreras därför i JS istället, samma mönster som useAnslag.js redan använder.
  const snap = await db.collection("anslag").get();
  for (const anslagDoc of snap.docs) {
    const data = anslagDoc.data();
    if (data.borttagen) continue;
    if (!data.kvitteringsfrist) continue;
    const fristTid = new Date(data.kvitteringsfrist).getTime();
    if (Number.isNaN(fristTid) || fristTid < nu || fristTid - nu > KVITTERINGSPAMINNELSE_FONSTER_MS) continue;

    const lasteAv = new Set((data.lasteAv ?? []).map((l) => l.uid));
    const redanPaminda = new Set(data.pushPaminnelseSkickadTill ?? []);
    const organisationId = data.organisationId ?? "default";

    const mottagare = await hamtaAnvandareMedPushPreferens(
      organisationId,
      "anslagsfrist",
      (a) => !lasteAv.has(a.id) && !redanPaminda.has(a.id)
    );
    if (mottagare.length === 0) continue;

    await skickaPush(mottagare, {
      titel: "Ett anslag väntar på kvittering",
      body: `"${data.titel ?? "Ett anslag"}" måste läsas och kvitteras innan fristen går ut.`,
      url: "/anslag",
    });
    await anslagDoc.ref.update({
      pushPaminnelseSkickadTill: admin.firestore.FieldValue.arrayUnion(...mottagare.map((a) => a.id)),
    });
  }
}
exports.kontrolleraKvitteringsfrister = kontrolleraKvitteringsfrister;

exports.kvitteringsfristerSchemalagt = onSchedule(
  { schedule: "every day 07:00", timeZone: "Europe/Stockholm", region: "europe-west1" },
  kontrolleraKvitteringsfrister
);

// Etapp 38b: den beslutade svarstiden (ägarbeslut 2026-08-01, se ETAPPLAN6.md beslutspunkt 1)
// är EN VECKA på ett ändringsförslag. "Vad hände med min ändring?" är planens egen bedömning
// av det viktigaste raden i hela etappen – ett förslag som tystnar i sju dagar utan att
// någon ens fått en påminnelse är precis det scenario som får förslagsflödet att sluta
// användas. Rollerna per område mirrorar firebase/roles.js farRedigeraOmrade (klienten) –
// samma uppdelning som redan gäller redigeringsrätt, nu även ägarbeslutad för granskningskön.
const FORSLAG_SVARSTID_MS = 7 * 24 * 60 * 60 * 1000;
const ROLLER_PER_OMRADE = {
  "kliniskt-stod": ["vol", "sektionsledare"],
  administration: ["vec"],
};

async function kontrolleraForslagPaminnelser() {
  const nu = Date.now();
  const snap = await db.collection("andringsforslag").where("status", "==", "ny").get();
  for (const forslagDoc of snap.docs) {
    const data = forslagDoc.data();
    if (data.paminnelseSkickad) continue;
    const tidpunktMs = data.tidpunkt?.toMillis?.() ?? null;
    if (tidpunktMs === null || nu - tidpunktMs < FORSLAG_SVARSTID_MS) continue;

    const agandeRoller = ROLLER_PER_OMRADE[data.omrade];
    if (!agandeRoller) continue;
    const organisationId = data.organisationId ?? "default";

    const mottagare = await hamtaAnvandareMedPushPreferens(
      organisationId,
      "forslagPaminnelse",
      (a) => agandeRoller.includes(a.role)
    );
    if (mottagare.length === 0) continue;

    await skickaPush(mottagare, {
      titel: "Ett ändringsförslag väntar sedan över en vecka",
      body: `Förslaget om "${data.rutinTitel ?? "en rutin"}" har inte hanterats än.`,
      url: data.omrade === "administration" ? "/administration" : "/kliniskt-stod",
    });
    await forslagDoc.ref.update({ paminnelseSkickad: true });
  }
}
exports.kontrolleraForslagPaminnelser = kontrolleraForslagPaminnelser;

exports.forslagPaminnelserSchemalagt = onSchedule(
  { schedule: "every day 08:00", timeZone: "Europe/Stockholm", region: "europe-west1" },
  kontrolleraForslagPaminnelser
);

// Etapp 39a: veckovis ögonblicksbild av nyckeltalen, så en trend kan visas i stället för bara
// ett ögonblicksvärde. Insamlingen byggs medvetet FÖRE en riktig visning – varje vecka utan
// snapshot är historik som aldrig går att skapa i efterhand.
//
// beraknaHalsaServer() är en avsiktlig, minimal DUPLICERING av logiken i
// src/utils/innehallshalsa.js (klientens ESM-modul kan inte importeras rakt av i denna
// CommonJS-miljö) – samma mönster som firestore.rules redan har flera exempel på (klient-
// och regellogik hålls medvetet i synk manuellt, med kommentarer som pekar på originalet).
function beraknaHalsaServer(rutiner) {
  const nu = Date.now();
  const GRANSKNINGSINTERVALL_MS = 180 * 24 * 60 * 60 * 1000;
  const godkanda = rutiner.filter((r) => r.status === "godkand" && r.arkiverad !== true);
  if (godkanda.length === 0) return null;
  let utanFlaggor = 0;
  for (const r of godkanda) {
    const granskadMs = r.granskadDatum?.toMillis ? r.granskadDatum.toMillis() : null;
    const passeratGranskning = granskadMs !== null && nu - granskadMs > GRANSKNINGSINTERVALL_MS;
    const saknarAgare = !r.agare;
    const aldrigKvitterad = !Array.isArray(r.lasteAv) || r.lasteAv.length === 0;
    const obesvaradKallvarning = r.kallVarning === true;
    const utgangen = Boolean(r.utgangsdatum) && new Date(r.utgangsdatum).getTime() < nu;
    if (!passeratGranskning && !saknarAgare && !aldrigKvitterad && !obesvaradKallvarning && !utgangen) {
      utanFlaggor++;
    }
  }
  return Math.round((utanFlaggor / godkanda.length) * 100);
}
exports.beraknaHalsaServer = beraknaHalsaServer;

function kvitteringsgradServer(rutiner, antalAnvandare) {
  const godkanda = rutiner.filter((r) => r.status === "godkand" && r.arkiverad !== true);
  if (godkanda.length === 0 || antalAnvandare === 0) return null;
  const summa = godkanda.reduce((sum, r) => sum + (r.lasteAv?.length ?? 0) / antalAnvandare, 0);
  return Math.round((summa / godkanda.length) * 100);
}
exports.kvitteringsgradServer = kvitteringsgradServer;

async function skapaMatvardenSnapshot() {
  const orgSnap = await db.collection("organisationer").get();
  const datum = new Date().toISOString().slice(0, 10);
  for (const orgDoc of orgSnap.docs) {
    const orgId = orgDoc.id;
    try {
      const [klinRutinSnap, adminRutinSnap, anvandareSnap, soksnap, checklistSnap] = await Promise.all([
        db.collection("rutiner").where("organisationId", "==", orgId).where("omrade", "==", "kliniskt-stod").get(),
        db.collection("rutiner").where("organisationId", "==", orgId).where("omrade", "==", "administration").get(),
        db.collection("users").where("organisationId", "==", orgId).select().get(),
        db.collection("soksstatistik").doc(orgId).get(),
        db.collection("checklistkorningar").where("organisationId", "==", orgId).get(),
      ]);

      const klinRutiner = klinRutinSnap.docs.map((d) => d.data());
      const adminRutiner = adminRutinSnap.docs.map((d) => d.data());
      const antalAnvandare = anvandareSnap.size;

      const soksdata = soksnap.exists ? soksnap.data() : {};
      const andelNollTraffar =
        soksdata.totaltAntalSokningar > 0
          ? Math.round((soksdata.antalNollTraffar / soksdata.totaltAntalSokningar) * 100)
          : null;
      const tidAttHittaSekunder =
        soksdata.antalTidmatningar > 0
          ? Math.round(soksdata.totalTidTillKlickMs / soksdata.antalTidmatningar / 1000)
          : null;

      const antalChecklistkorningar = checklistSnap.docs.reduce((sum, d) => sum + (d.data().antalPaborjade ?? 0), 0);

      await db
        .collection("organisationer")
        .doc(orgId)
        .collection("matvardenSnapshots")
        .doc(datum)
        .set({
          datum,
          kvitteringsgradKlinisktStod: kvitteringsgradServer(klinRutiner, antalAnvandare),
          kvitteringsgradAdministration: kvitteringsgradServer(adminRutiner, antalAnvandare),
          andelNollTraffar,
          tidAttHittaSekunder,
          antalChecklistkorningar,
          innehallshalsaKlinisktStod: beraknaHalsaServer(klinRutiner),
          innehallshalsaAdministration: beraknaHalsaServer(adminRutiner),
          skapad: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (fel) {
      console.error(`Mätvärdessnapshot misslyckades för organisation ${orgId}:`, fel);
    }
  }
}
exports.skapaMatvardenSnapshot = skapaMatvardenSnapshot;

exports.matvardenSnapshotSchemalagt = onSchedule(
  { schedule: "every monday 02:00", timeZone: "Europe/Stockholm", region: "europe-west1", timeoutSeconds: 300 },
  skapaMatvardenSnapshot
);

// Etapp 39c: anonym personalpuls. "Anonym" bygger på att INGET enskilt svar någonsin skrivs
// någonstans – bara aggregerade summor (FieldValue.increment) i en per-område-per-kvartal-
// collection som är Cloud-Function-only (samma mönster som matvardenSnapshots), plus en enda
// flagga på användarens EGET dokument som bara säger "redan svarat detta kvartal" (inget om
// VAD personen svarade). Dubbelinskick förhindras i en transaktion så att flaggkontroll och
// increment sker atomiskt.
function beraknaKvartal(datum = new Date()) {
  const kvartal = Math.floor(datum.getMonth() / 3) + 1;
  return `${datum.getFullYear()}-Q${kvartal}`;
}
exports.beraknaKvartal = beraknaKvartal;

const GILTIGA_PERSONALPULS_OMRADEN = ["kliniskt-stod", "administration", "logistik"];

exports.svaraPersonalpuls = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const { omrade, svar1, svar2, svar3 } = request.data ?? {};
  if (!GILTIGA_PERSONALPULS_OMRADEN.includes(omrade)) {
    throw new HttpsError("invalid-argument", "Ogiltigt område.");
  }
  const arGiltigtSvar = (v) => Number.isInteger(v) && v >= 1 && v <= 5;
  if (!arGiltigtSvar(svar1) || !arGiltigtSvar(svar2) || !arGiltigtSvar(svar3)) {
    throw new HttpsError("invalid-argument", "Varje svar måste vara ett heltal 1–5.");
  }

  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  const kvartal = beraknaKvartal();
  const userRef = db.collection("users").doc(request.auth.uid);
  const resultatRef = db
    .collection("organisationer")
    .doc(uppringare.organisationId)
    .collection("personalpulsResultat")
    .doc(`${omrade}_${kvartal}`);

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (userSnap.data()?.personalpulsSenastBesvarad === kvartal) {
      throw new HttpsError("already-exists", "Du har redan svarat på personalpulsen detta kvartal.");
    }
    tx.set(
      resultatRef,
      {
        omrade,
        kvartal,
        antalSvar: admin.firestore.FieldValue.increment(1),
        summaFraga1: admin.firestore.FieldValue.increment(svar1),
        summaFraga2: admin.firestore.FieldValue.increment(svar2),
        summaFraga3: admin.firestore.FieldValue.increment(svar3),
        senastUppdaterad: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    tx.update(userRef, { personalpulsSenastBesvarad: kvartal });
  });

  return { ok: true };
});

// Etapp 39d: referensunderlag för säljmaterial. Ägarbeslut 2026-08-02: anonymiserat – kundens
// namn/organisationId får ALDRIG förekomma i den data som returneras till klienten, och
// medgivandet ska bekräftas AKTIVT i varje enskild export (samtycke==true skickas av klienten
// varje gång, sparas inte som en förutsättning en gång för alla) samt loggas i revisionsloggen.
exports.exporteraReferensunderlag = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan exportera referensunderlag.");
  }
  if (request.data?.samtycke !== true) {
    throw new HttpsError(
      "failed-precondition",
      "Kundens uttryckliga medgivande måste bekräftas aktivt innan export."
    );
  }

  const orgId = uppringare.organisationId;
  const [snapshotSnap, anvandareSnap] = await Promise.all([
    db
      .collection("organisationer")
      .doc(orgId)
      .collection("matvardenSnapshots")
      .orderBy("datum", "desc")
      .limit(1)
      .get(),
    db.collection("users").where("organisationId", "==", orgId).select().get(),
  ]);
  const senaste = snapshotSnap.empty ? null : snapshotSnap.docs[0].data();

  // Medvetet INGA fält här som kan identifiera kunden (namn, orgnr, orgId) – anonymiseringen
  // sitter i vilka fält som SAKNAS i det här objektet, inte i en efterbehandling.
  const underlag = {
    antalAnstallda: anvandareSnap.size,
    kvitteringsgradKlinisktStod: senaste?.kvitteringsgradKlinisktStod ?? null,
    kvitteringsgradAdministration: senaste?.kvitteringsgradAdministration ?? null,
    andelNollTraffar: senaste?.andelNollTraffar ?? null,
    tidAttHittaSekunder: senaste?.tidAttHittaSekunder ?? null,
    innehallshalsaKlinisktStod: senaste?.innehallshalsaKlinisktStod ?? null,
    genererad: new Date().toISOString().slice(0, 10),
  };

  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: uppringare.roll,
    handelsetyp: "referensunderlag_exporterat",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: "Anonymiserat referensunderlag exporterat (kundens medgivande bekräftat aktivt i exportflödet)",
  });

  return underlag;
});

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

// Etapp 46: gör "senaste backup" till något en superadmin kan se i adminpanelen istället för
// att behöva leta i Firebase Storage-konsolen (vilket `INCIDENT-CHECKLISTA.md` steg 8
// tidigare krävde). Storage-listningen kräver Admin SDK (klienten har ingen läsrätt alls till
// backups/, se storage.rules) – därför en egen callable, inte en direkt Firestore-fråga.
// Återanvänder samma auth-upplösning som revisionsloggens callables (superadmin i egen
// organisation, eller plattformsadmin med ett angivet orgId).
async function hamtaBackupstatusForOrg(organisationId) {
  const orgDoc = await db.collection("organisationer").doc(organisationId).get();
  const harOperationsModul = orgDoc.data()?.moduler?.operations === true;

  if (!harOperationsModul) {
    return { harOperationsModul: false, senasteDatum: null, antalBackuper: 0 };
  }

  const [filer] = await bucket.getFiles({ prefix: `backups/${organisationId}/` });
  const datum = filer
    .map((fil) => fil.name.match(/^backups\/[^/]+\/(\d{4}-\d{2}-\d{2})\.json$/)?.[1])
    .filter(Boolean)
    .sort();

  return {
    harOperationsModul: true,
    senasteDatum: datum.length > 0 ? datum[datum.length - 1] : null,
    antalBackuper: datum.length,
  };
}

exports.hamtaBackupstatus = onCall({ region: "europe-west1" }, async (request) => {
  const organisationId = await kravLasningAvRevisionslogg(request, request.data?.organisationId);
  return hamtaBackupstatusForOrg(organisationId);
});

// Etapp 50a: strukturell hälsodiagnostik per organisation för leverantörsvyn – "kan en
// supportfråga besvaras utan att gissa, och utan stående åtkomst till kundinnehåll?".
// Returnerar MEDVETET bara antal och tidpunkter, aldrig dokumentinnehåll (krav 13).
// Premisskontroll (ETAPPLAN10.md §50a): 32a:s permission-denied-rapportering går bara till
// Sentry (klientsidan) – det finns ingen serverbar väg att läsa Sentrys händelsedatabas utan
// ett separat API-token, samma blockering som redan är dokumenterad för 32b:s tre kvarvarande
// larmtyper. "Felfrekvens" är därför MEDVETET UTELÄMNAD här, inte bortglömd – se
// OPPNA-PUNKTER.md/ETAPPLAN5.md §32b för samma öppna punkt. "Senaste skrivning" byggs inte
// heller på en ny tidsstämpel per collection (skulle kräva att ändra alla skrivvägar i hela
// appen) utan på den redan existerande revisionsloggen, som redan fångar de bokförda
// innehållshändelserna (rutin_publicerad/rutin_godkand/rutin_borttagen m.fl.) – "senaste
// loggade händelse", inte en fullständig senaste-skrivning-garanti.
const DIAGNOSTIK_COLLECTIONS = ["rutiner", "forradsartiklar", "anslag", "kontakter"];

exports.hamtaOrganisationsdiagnostik = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { orgId } = request.data ?? {};
  if (!orgId || typeof orgId !== "string") {
    throw new HttpsError("invalid-argument", "orgId krävs.");
  }

  const [antalPerCollection, senasteHandelseSnap, backupstatus] = await Promise.all([
    Promise.all(
      DIAGNOSTIK_COLLECTIONS.map(async (namn) => {
        const agg = await db.collection(namn).where("organisationId", "==", orgId).count().get();
        return [namn, agg.data().count];
      })
    ),
    db
      .collection("revisionslogg")
      .where("organisationId", "==", orgId)
      .orderBy("tidpunkt", "desc")
      .limit(1)
      .get(),
    hamtaBackupstatusForOrg(orgId),
  ]);

  const senasteHandelseDoc = senasteHandelseSnap.empty ? null : senasteHandelseSnap.docs[0].data();

  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_diagnostik_visad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: "Leverantören visade strukturell diagnostik (antal/status, inget innehåll)",
  });

  return {
    antalDokument: Object.fromEntries(antalPerCollection),
    senasteHandelse: senasteHandelseDoc
      ? { tidpunkt: senasteHandelseDoc.tidpunkt, handelsetyp: senasteHandelseDoc.handelsetyp }
      : null,
    backupstatus,
    felfrekvensTillganglig: false,
  };
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

  const idag = dagensDatumStockholm();
  const [orgSnap, sokkvotSnap] = await Promise.all([
    db.collection("organisationer").get(),
    db.collection("systemstatus").doc("sokkvot").get(),
  ]);
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
        // Saknas fältet helt (organisationer etablerade före Etapp 15a) antas de redan vara
        // en riktig, aktiv kund – annars skulle en befintlig kund plötsligt visas som "offert".
        avtalsstatus: data.avtalsstatus ?? "aktiv",
        provperiodSlut: data.provperiodSlut ?? null,
        // Etapp 48b: dagens andel av den DELADE sökkvoten – 0 om organisationen inte sökt
        // alls idag, oavsett vad fältet råkar innehålla från ett tidigare datum.
        sokkvotIdag: data.sokkvotDatum === idag ? (data.sokkvotAntal ?? 0) : 0,
        // Etapp 48c: manuellt inmatat avtalat årspris, se satAvtaladArsavgift.
        avtaladArsavgiftKr: data.avtaladArsavgiftKr ?? null,
        // Etapp 48d: null betyder "använder standardtaket", inte "inget tak alls".
        sokkvotTakPerDygn: data.sokkvotTakPerDygn ?? null,
        // Etapp 49a: en pågående, avbrytbar radering – visas som en varning i leverantörsvyn.
        raderingSchemalagdTill: data.raderingSchemalagdTill?.toDate?.().toISOString() ?? null,
        raderingAnledning: data.raderingAnledning ?? null,
        // Etapp 50b: en aktiv, kundbeviljad supportåtkomst – visas i leverantörsvyn så det
        // alltid syns VILKA organisationer som just nu går att läsa innehåll för.
        supportAtkomstTill: data.supportAtkomstTill?.toDate?.().toISOString() ?? null,
        supportAtkomstAnledning: data.supportAtkomstAnledning ?? null,
      };
    })
  );
  const sokkvotData = sokkvotSnap.exists ? sokkvotSnap.data() : null;
  const sokkvot = {
    // Samma "0 om datumet inte är idag"-princip som ovan, per organisation – annars visas
    // gårdagens sista mätning som om den vore aktuell tills första sökningen idag.
    totalAntal: sokkvotData?.datum === idag ? (sokkvotData.totalAntal ?? 0) : 0,
    tak: sokkvotData?.tak ?? SOKKVOT_DAGSTAK,
    // Etapp 48d: så leverantörsvyn kan visa vad "Ej ifyllt" faktiskt betyder i praktiken.
    orgTakStandard: SOKKVOT_ORG_TAK_STANDARD,
  };
  // Etapp 32c: plattformsadmins tvärorganisatoriska åtkomst loggades tidigare inte alls.
  // "_plattform" är inget riktigt organisationId (det finns aldrig en kund vid namn det) –
  // en egen hashkedja för händelser som spänner över ALLA organisationer, inte en specifik.
  await loggaRevision({
    organisationId: "_plattform",
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "plattform_organisationer_listade",
    objektTyp: null,
    objektId: null,
    sammanfattning: `Listade ${organisationer.length} organisationer`,
  });
  return { organisationer, sokkvot };
});

// Etapp 15d: avtals-/betalningsflödet sker MEDVETET utanför appen (avtalssignering och
// fakturering, se beslutspunkt 6 i ETAPPLAN3.md) – det här är bara en statusflagga en
// leverantörsadmin sätter manuellt i takt med att det faktiskt händer. Ingen koppling till
// organisationer/{orgId}.status (drift-på/av, se pausaOrganisation) – en organisation kan
// mycket väl vara avtalsstatus="signerat" men ännu inte satts i drift, eller vice versa.
const GILTIGA_AVTALSSTATUSAR = ["offert", "signerat", "aktiv", "pausad", "avslutad"];

exports.satAvtalsstatus = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { orgId, avtalsstatus } = request.data ?? {};
  if (!orgId || typeof orgId !== "string") {
    throw new HttpsError("invalid-argument", "orgId krävs.");
  }
  if (!GILTIGA_AVTALSSTATUSAR.includes(avtalsstatus)) {
    throw new HttpsError(
      "invalid-argument",
      `avtalsstatus måste vara en av: ${GILTIGA_AVTALSSTATUSAR.join(", ")}.`
    );
  }
  const orgRef = db.collection("organisationer").doc(orgId);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) {
    throw new HttpsError("not-found", "Organisationen hittades inte.");
  }
  await orgRef.set({ avtalsstatus }, { merge: true });
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_avtalsstatus_andrad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: `Avtalsstatus ändrad till "${avtalsstatus}"`,
  });
  return { ok: true };
});

// Etapp 15e: sätter/ändrar en organisations provperiodSlut (ISO-datum "ÅÅÅÅ-MM-DD", eller
// null för att ta bort en provperiod helt). Anropet PAUSAR ALDRIG något självt – bara
// datumet ändras här, så en leverantörsadmin kan förlänga en provperiod utan att behöva
// återaktivera organisationen manuellt efteråt om den redan hunnit pausas automatiskt.
// Den faktiska pausningen sker i kontrolleraProvperioderSchemalagt() nedan.
const ISO_DATUM_REGEX = /^\d{4}-\d{2}-\d{2}$/;

exports.satProvperiod = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { orgId, provperiodSlut } = request.data ?? {};
  if (!orgId || typeof orgId !== "string") {
    throw new HttpsError("invalid-argument", "orgId krävs.");
  }
  if (provperiodSlut !== null && !ISO_DATUM_REGEX.test(provperiodSlut ?? "")) {
    throw new HttpsError(
      "invalid-argument",
      "provperiodSlut måste vara null eller ett datum på formen ÅÅÅÅ-MM-DD."
    );
  }
  const orgRef = db.collection("organisationer").doc(orgId);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) {
    throw new HttpsError("not-found", "Organisationen hittades inte.");
  }
  await orgRef.set({ provperiodSlut }, { merge: true });
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_provperiod_andrad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: provperiodSlut ? `Provperiod satt till ${provperiodSlut}` : "Provperiod borttagen",
  });
  return { ok: true };
});

// Etapp 48c: manuellt inmatat avtalat årspris (kr), så att leverantörsvyn kan visa det
// bredvid den redan kända AI-kostnaden – INTE ett fullständigt täckningsbidrag. Faktisk
// molnkostnad (Firestore/Storage/Functions utöver AI) kräver GCP-faktureringsexport till
// BigQuery, ett projektval bara ägaren kan aktivera i GCP-konsolen, inte en kodfråga (se
// samma slutsats redan dragen för Etapp 32b:s inloggningslarm, ETAPPLAN5.md/
// SAKERHETSRAPPORT.md). Utan den exporten finns ingen programmatisk källa till total
// molnkostnad per organisation, så det här fältet är ett förberedande steg, inte en färdig
// automatisk vy.
exports.satAvtaladArsavgift = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { orgId, avtaladArsavgiftKr } = request.data ?? {};
  if (!orgId || typeof orgId !== "string") {
    throw new HttpsError("invalid-argument", "orgId krävs.");
  }
  if (
    avtaladArsavgiftKr !== null &&
    (typeof avtaladArsavgiftKr !== "number" || !Number.isFinite(avtaladArsavgiftKr) || avtaladArsavgiftKr < 0)
  ) {
    throw new HttpsError("invalid-argument", "avtaladArsavgiftKr måste vara null eller ett tal ≥ 0.");
  }
  const orgRef = db.collection("organisationer").doc(orgId);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) {
    throw new HttpsError("not-found", "Organisationen hittades inte.");
  }
  await orgRef.set({ avtaladArsavgiftKr }, { merge: true });
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_avtalad_arsavgift_andrad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning:
      avtaladArsavgiftKr === null
        ? "Avtalad årsavgift borttagen"
        : `Avtalad årsavgift satt till ${avtaladArsavgiftKr} kr/år`,
  });
  return { ok: true };
});

// Etapp 48d: konfigurerbart tak för en enskild organisations andel av den DELADE dygnskvoten
// (se SOKKVOT_ORG_TAK_STANDARD/okaSokkvot ovan). null = använd standardtaket.
exports.satSokkvotTakPerDygn = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { orgId, sokkvotTakPerDygn } = request.data ?? {};
  if (!orgId || typeof orgId !== "string") {
    throw new HttpsError("invalid-argument", "orgId krävs.");
  }
  if (
    sokkvotTakPerDygn !== null &&
    (typeof sokkvotTakPerDygn !== "number" ||
      !Number.isInteger(sokkvotTakPerDygn) ||
      sokkvotTakPerDygn < 1 ||
      sokkvotTakPerDygn > SOKKVOT_DAGSTAK)
  ) {
    throw new HttpsError(
      "invalid-argument",
      `sokkvotTakPerDygn måste vara null eller ett heltal mellan 1 och ${SOKKVOT_DAGSTAK}.`
    );
  }
  const orgRef = db.collection("organisationer").doc(orgId);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) {
    throw new HttpsError("not-found", "Organisationen hittades inte.");
  }
  await orgRef.set({ sokkvotTakPerDygn }, { merge: true });
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_sokkvottak_andrad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning:
      sokkvotTakPerDygn === null
        ? `Sökkvottak återställt till standard (${SOKKVOT_ORG_TAK_STANDARD}/dygn)`
        : `Sökkvottak satt till ${sokkvotTakPerDygn}/dygn`,
  });
  return { ok: true };
});

// Etapp 15e: automatisk pausning när en organisations provperiod gått ut. Pausat läge =
// läsbehörighet kvar, ingen ny skrivning (samma mekanism som pausaOrganisation/Etapp 6d,
// se organisationenArAktiv() i firestore.rules) – raderar ALDRIG kunddata automatiskt.
// Varningarna 14/7/1 dag innan är inget som skrivs härifrån – de beräknas direkt i klienten
// (ProvperiodBanner.jsx) utifrån samma provperiodSlut-fält, som redan är läsbart för alla
// organisationsmedlemmar. Körs dagligen, inte exakt vid midnatt UTC för provperiodSlut-dagen,
// så en organisation kan vara pausad upp till ett dygn efter det formella slutdatumet.
async function kontrolleraProvperioder() {
  const idagIso = new Date().toISOString().slice(0, 10);
  const orgSnap = await db.collection("organisationer").where("status", "==", "aktiv").get();
  for (const orgDoc of orgSnap.docs) {
    const provperiodSlut = orgDoc.data()?.provperiodSlut;
    if (!provperiodSlut || provperiodSlut > idagIso) continue;
    await orgDoc.ref.set({ status: "pausad" }, { merge: true });
    await loggaRevision({
      organisationId: orgDoc.id,
      aktorUid: null,
      aktorRoll: "system",
      handelsetyp: "organisation_provperiod_utgangen",
      objektTyp: "organisationer",
      objektId: orgDoc.id,
      sammanfattning: `Provperioden gick ut (${provperiodSlut}) – organisationen pausades automatiskt`,
    });
  }
}
// Exporterad enbart för tests/functions/etapp6.test.cjs (samma mönster som
// backupaOrganisation/reserveraBudget – test:functions kör bara firestore+storage-
// emulatorerna, inte en riktig scheduler, så kärnlogiken måste vara anropbar direkt).
exports.kontrolleraProvperioder = kontrolleraProvperioder;

exports.kontrolleraProvperioderSchemalagt = onSchedule(
  { schedule: "every day 05:00", timeZone: "Europe/Stockholm", region: "europe-west1" },
  kontrolleraProvperioder
);

// Etapp 15c: faktureringsunderlaget – en rad per organisation med den här månadens
// användning så en prismodell kan sättas på riktiga siffror istället för en gissning.
// Läser bara metadata (antal/summor), aldrig kunddatans innehåll. Lagringsvolymen kräver en
// bucket-genomgång eftersom Storage-sökvägarna är strukturerade per rutin/artikel-id, inte
// per organisation (se storage.rules) – görs en gång för HELA bucketen och fördelas sedan
// på organisationer via en uppslagskarta, istället för en genomgång per organisation.
exports.manadsrapportOrganisationer = onCall({ region: "europe-west1", timeoutSeconds: 120 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);

  const [orgSnap, rutinerSnap, forradsartiklarSnap] = await Promise.all([
    db.collection("organisationer").get(),
    db.collection("rutiner").select("organisationId", "borttagen").get(),
    db.collection("forradsartiklar").select("organisationId").get(),
  ]);

  // rutinId/artikelId -> organisationId, för att fördela Storage-filernas storlek nedan.
  const agareOrganisation = new Map();
  const antalRutinerPerOrg = new Map();
  for (const rutinDoc of rutinerSnap.docs) {
    const data = rutinDoc.data();
    agareOrganisation.set(rutinDoc.id, data.organisationId);
    if (!data.borttagen) {
      antalRutinerPerOrg.set(data.organisationId, (antalRutinerPerOrg.get(data.organisationId) ?? 0) + 1);
    }
  }
  for (const artikelDoc of forradsartiklarSnap.docs) {
    agareOrganisation.set(artikelDoc.id, artikelDoc.data().organisationId);
  }

  const lagringBytesPerOrg = new Map();
  const [rutinFiler, artikelFiler] = await Promise.all([
    bucket.getFiles({ prefix: "rutiner/" }),
    bucket.getFiles({ prefix: "forradsartiklar/" }),
  ]);
  for (const fil of [...rutinFiler[0], ...artikelFiler[0]]) {
    // Sökvägsformen är {rutiner|forradsartiklar}/{omrade|forradSlug}/{agarId}/{filnamn} –
    // se storage.rules – så ägarens id sitter alltid på index 2.
    const agarId = fil.name.split("/")[2];
    const orgId = agareOrganisation.get(agarId);
    if (!orgId) continue;
    const storlek = Number(fil.metadata?.size ?? 0);
    lagringBytesPerOrg.set(orgId, (lagringBytesPerOrg.get(orgId) ?? 0) + storlek);
  }

  const organisationer = await Promise.all(
    orgSnap.docs.map(async (orgDoc) => {
      const data = orgDoc.data();
      const [anvandareSnap, budgetSnap] = await Promise.all([
        db.collection("users").where("organisationId", "==", orgDoc.id).select().get(),
        orgDoc.ref.collection("installningar").doc("geminiBudget").get(),
      ]);
      const budget = budgetSnap.exists ? budgetSnap.data() : {};
      const anvantOre = budget.anvantOre ?? 0;
      return {
        orgId: orgDoc.id,
        namn: data.namn ?? orgDoc.id,
        aktuellManad: budget.aktuellManad ?? aktuellManadNyckel(),
        antalAnvandare: anvandareSnap.size,
        antalRutiner: antalRutinerPerOrg.get(orgDoc.id) ?? 0,
        anvantOre,
        // Grovt uppskattat: varje AI-anrop reserverar en FAST uppskattad kostnad
        // (UPPSKATTAD_KOSTNAD_ORE), inte den faktiska Gemini-fakturan per anrop – se
        // reserveraBudget(). Exakt antal anrop loggas inte separat någonstans.
        antalAnropUppskattat: Math.round(anvantOre / UPPSKATTAD_KOSTNAD_ORE),
        lagringBytes: lagringBytesPerOrg.get(orgDoc.id) ?? 0,
      };
    })
  );
  // Etapp 32c: se listaOrganisationer ovan – samma motivering, "_plattform" som pseudo-org.
  await loggaRevision({
    organisationId: "_plattform",
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "plattform_manadsrapport_hamtad",
    objektTyp: null,
    objektId: null,
    sammanfattning: `Månadsrapport hämtad för ${organisationer.length} organisationer`,
  });
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

// Etapp 49a: automatiserad radering vid avetablering, med ett fönster där leverantören ELLER
// kundens egen superadmin kan ångra – ägarbeslut 2026-08-06 (se ETAPPLAN10.md, OPPNA-PUNKTER.md
// innan dess). Beslutat mönster: kundens superadmin begär radering själv i appen (inte bara
// leverantören via konsolen som första utkastet föreslog), men den utförs INTE direkt – en
// väntetid ger tid att upptäcka och stoppa ett misstag eller en obehörig begäran (t.ex. en
// avskedad anställd som hann vara superadmin). Krav 17 (ETAPPLAN10.md): dubbel bekräftelse
// (skriv organisationens namn + en explicit "Ja"-dialog i UI:t) och en loggad anledning INNAN
// körningen, inte efter.
const RADERING_VANTETID_TIMMAR = 48;

// Etapp 49a: kunden begär radering av sin EGEN organisation. Pausar organisationen omedelbart
// (ingen ny data ska hinna tillkomma under väntetiden) och schemalägger den faktiska
// raderingen. Kan när som helst ångras av kundens egen superadmin ELLER leverantören, se
// avbrytRaderingAvOrganisation nedan.
exports.begarRaderingAvOrganisation = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan begära radering av organisationen.");
  }
  const anledning = (request.data?.anledning ?? "").trim();
  if (!anledning) {
    throw new HttpsError("invalid-argument", "En anledning måste anges.");
  }
  const orgId = uppringare.organisationId;
  const schemalagdTill = new Date(Date.now() + RADERING_VANTETID_TIMMAR * 60 * 60 * 1000);
  await db.collection("organisationer").doc(orgId).set(
    {
      status: "pausad",
      raderingSchemalagdTill: admin.firestore.Timestamp.fromDate(schemalagdTill),
      raderingBegardAv: request.auth.uid,
      raderingAnledning: anledning,
    },
    { merge: true }
  );
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "superadmin",
    handelsetyp: "organisation_radering_begard",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: `Radering begärd, schemalagd till ${schemalagdTill.toISOString()}. Anledning: ${anledning}`,
  });
  // Sentry, inte systemvarningar: en schemalagd radering är tidskritisk (leverantören måste
  // FAKTISKT märka den för att fönstret ska betyda något) och det finns ingen anledning att
  // låta andra kunders superadmins se att DEN HÄR organisationen ska raderas.
  Sentry.captureMessage("Organisation har begärt radering – schemalagd", {
    level: "error",
    tags: { typ: "radering_schemalagd" },
    extra: { orgId, schemalagdTill: schemalagdTill.toISOString(), anledning },
  });
  return { schemalagdTill: schemalagdTill.toISOString() };
});

// Etapp 49a: avbryter en schemalagd radering. Ospärrar INTE organisationen automatiskt (den
// befintliga "Återaktivera"-knappen gör det, medvetet – ett avbrutet raderingsförsök förtjänar
// en egen, uttrycklig granskning av leverantören innan drift återupptas, inte en tyst
// återgång). Tillåten för BÅDE kundens egen superadmin (ångra sitt eget misstag) och
// leverantören (upptäcka och stoppa en obehörig begäran).
exports.avbrytRaderingAvOrganisation = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  const arPlattformsadminUppringare = await arPlattformsadminServer(request.auth.uid);
  let orgId = request.data?.orgId;
  if (arPlattformsadminUppringare) {
    if (!orgId || typeof orgId !== "string") {
      throw new HttpsError("invalid-argument", "orgId krävs för en leverantörsadmin.");
    }
  } else if (uppringare.roll === "superadmin") {
    orgId = uppringare.organisationId;
  } else {
    throw new HttpsError("permission-denied", "Endast superadmin eller leverantörsadmin kan avbryta en radering.");
  }
  const orgRef = db.collection("organisationer").doc(orgId);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists || !orgSnap.data().raderingSchemalagdTill) {
    throw new HttpsError("failed-precondition", "Det finns ingen schemalagd radering att avbryta.");
  }
  await orgRef.update({
    raderingSchemalagdTill: admin.firestore.FieldValue.delete(),
    raderingBegardAv: admin.firestore.FieldValue.delete(),
    raderingAnledning: admin.firestore.FieldValue.delete(),
  });
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: arPlattformsadminUppringare ? "plattformsadmin" : "superadmin",
    handelsetyp: "organisation_radering_avbruten",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: "Schemalagd radering avbruten",
  });
  return { ok: true };
});

// Etapp 50b: tillfällig, kundinitierad supportåtkomst – ägarbeslut 2026-08-09 (alternativ A,
// se BESLUTSLOGG.md): kundens EGEN superadmin beviljar leverantören läsrätt till organisationens
// innehåll i ett begränsat fönster (6 timmar), med en obligatorisk anledning. Till skillnad
// från 50a (som bara visar antal/metadata) ger detta fönster leverantören RIKTIG läsåtkomst
// till innehållet i firestore.rules (se farSupportlasa() där) – därför krävs en anledning och
// full loggning i båda ändar, och fönstret upphör automatiskt (request.time-jämförelsen i
// regeln, ingen serverstädning krävs).
const SUPPORTATKOMST_FONSTER_TIMMAR = 6;

exports.beviljaSupportAtkomst = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan bevilja supportåtkomst.");
  }
  const anledning = (request.data?.anledning ?? "").trim();
  if (!anledning) {
    throw new HttpsError("invalid-argument", "En anledning måste anges.");
  }
  const orgId = uppringare.organisationId;
  const till = new Date(Date.now() + SUPPORTATKOMST_FONSTER_TIMMAR * 60 * 60 * 1000);
  await db.collection("organisationer").doc(orgId).set(
    {
      supportAtkomstTill: admin.firestore.Timestamp.fromDate(till),
      supportAtkomstBeviljadAv: request.auth.uid,
      supportAtkomstAnledning: anledning,
    },
    { merge: true }
  );
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "superadmin",
    handelsetyp: "support_atkomst_beviljad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: `Supportåtkomst beviljad till ${till.toISOString()}. Anledning: ${anledning}`,
  });
  return { till: till.toISOString() };
});

exports.avslutaSupportAtkomst = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  const arPlattformsadminUppringare = await arPlattformsadminServer(request.auth.uid);
  let orgId = request.data?.orgId;
  if (arPlattformsadminUppringare) {
    if (!orgId || typeof orgId !== "string") {
      throw new HttpsError("invalid-argument", "orgId krävs för en leverantörsadmin.");
    }
  } else if (uppringare.roll === "superadmin") {
    orgId = uppringare.organisationId;
  } else {
    throw new HttpsError("permission-denied", "Endast superadmin eller leverantörsadmin kan avsluta supportåtkomst.");
  }
  const orgRef = db.collection("organisationer").doc(orgId);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists || !orgSnap.data().supportAtkomstTill) {
    throw new HttpsError("failed-precondition", "Det finns ingen aktiv supportåtkomst att avsluta.");
  }
  await orgRef.update({
    supportAtkomstTill: admin.firestore.FieldValue.delete(),
    supportAtkomstBeviljadAv: admin.firestore.FieldValue.delete(),
    supportAtkomstAnledning: admin.firestore.FieldValue.delete(),
  });
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: arPlattformsadminUppringare ? "plattformsadmin" : "superadmin",
    handelsetyp: "support_atkomst_avslutad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: "Supportåtkomst avslutad i förtid",
  });
  return { ok: true };
});

// Etapp 49a: den faktiska, irreversibla raderingen – körs ENDAST av
// utforSchemalagdRaderingSchemalagt nedan efter att väntetiden gått ut, aldrig direkt av en
// callable. Ordning, av en anledning:
//   1. En sista säkerhetskopia (samma backupaOrganisation() som redan täcker alla 13
//      collections + underkollektionen + revisionsloggHuvud sedan Etapp 49d) – om något går
//      fel i stegen nedan, eller om kunden ändå ångrar sig efter att fönstret stängt, finns
//      ändå en färsk kopia kvar (backups/{orgId}/... gallras som vanligt efter 90 dagar,
//      beslutat 2026-08-06 som ett medvetet extra skyddsnät utöver 48-timmarsfönstret).
//   2. Uppladdade filer knutna till rutiner/förrådsartiklar (Storage-sökvägarna är INTE
//      organisationsskopade i sig, se storage.rules – kräver en uppslagskarta, samma mönster
//      som manadsrapportOrganisationer() redan använder för att fördela lagringsvolym).
//   3. Organisationens användare: Firebase Auth-kontot, profilbild, råfoton och users/{uid}.
//   4. Firestore-dokumenten (samma lista som backupaOrganisation), i batchar.
//   5. organisationer/{orgId} skrivs INTE bort helt – ersätts med en minimal "gravsten" så att
//      leverantörsvyn kan visa att organisationen fanns och raderades, utan att någon av dess
//      egna data blir kvar. revisionslogg/revisionsloggHuvud rörs ALDRIG – organisationens
//      historik över vad som hänt (inklusive raderingen själv) ska överleva raderingen.
async function raderaOrganisationensData(orgId) {
  await loggaRevision({
    organisationId: orgId,
    aktorUid: "_system",
    aktorRoll: "system",
    handelsetyp: "organisation_permanent_radering_paborjad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: "Permanent radering påbörjad efter utgången väntetid",
  });

  await backupaOrganisation(orgId);

  const [rutinerSnap, artiklarSnap, anvandareSnap] = await Promise.all([
    db.collection("rutiner").where("organisationId", "==", orgId).select().get(),
    db.collection("forradsartiklar").where("organisationId", "==", orgId).select().get(),
    db.collection("users").where("organisationId", "==", orgId).select().get(),
  ]);
  const rutinIds = new Set(rutinerSnap.docs.map((d) => d.id));
  const artikelIds = new Set(artiklarSnap.docs.map((d) => d.id));
  const uids = anvandareSnap.docs.map((d) => d.id);

  // Samma "ägar-id sitter på path-index 2"-mönster som manadsrapportOrganisationer() – filerna
  // är inte organisationsskopade i sökvägen, bara via det ägande dokumentets organisationId.
  const [rutinFiler, artikelFiler] = await Promise.all([
    bucket.getFiles({ prefix: "rutiner/" }),
    bucket.getFiles({ prefix: "forradsartiklar/" }),
  ]);
  const filerAttRadera = [
    ...rutinFiler[0].filter((f) => rutinIds.has(f.name.split("/")[2])),
    ...artikelFiler[0].filter((f) => artikelIds.has(f.name.split("/")[2])),
  ];
  await Promise.all(filerAttRadera.map((f) => f.delete().catch(() => {})));
  await bucket.deleteFiles({ prefix: `organisationer/${orgId}/logotyp/`, force: true }).catch(() => {});

  for (const uid of uids) {
    await bucket.deleteFiles({ prefix: `avatarer/${uid}/`, force: true }).catch(() => {});
    await bucket.deleteFiles({ prefix: `inkommande/${uid}/`, force: true }).catch(() => {});
    await admin.auth().deleteUser(uid).catch(() => {});
  }

  let antalRaderadeDokument = 0;
  // revisionslogg ingår i BACKUP_COLLECTIONS (för export/backup, Etapp 49d) men ska ALDRIG
  // raderas här – se kommentaren ovanför funktionen: organisationens historik, inklusive den
  // här raderingen själv, ska överleva raderingen.
  const allaSamlingar = [
    ...BACKUP_COLLECTIONS.filter((namn) => namn !== "revisionslogg"),
    ...BACKUP_SUBCOLLECTIONS.map((n) => ({ underkollektion: n })),
  ];
  for (const post of allaSamlingar) {
    const ar = typeof post === "string";
    const snap = ar
      ? await db.collection(post).where("organisationId", "==", orgId).get()
      : await db.collection("organisationer").doc(orgId).collection(post.underkollektion).get();
    const BATCHSTORLEK = 400;
    for (let i = 0; i < snap.docs.length; i += BATCHSTORLEK) {
      const batch = db.batch();
      for (const dok of snap.docs.slice(i, i + BATCHSTORLEK)) {
        batch.delete(dok.ref);
        antalRaderadeDokument += 1;
      }
      await batch.commit();
    }
  }
  for (const uid of uids) {
    await db.collection("users").doc(uid).delete().catch(() => {});
  }

  const orgSnap = await db.collection("organisationer").doc(orgId).get();
  const namn = orgSnap.data()?.namn ?? orgId;
  // Ett fullständigt (icke-merge) set() skriver över HELA dokumentet, så de gamla
  // raderingSchemalagdTill/raderingBegardAv/raderingAnledning-fälten försvinner redan av det
  // – FieldValue.delete() är bara giltigt i update()/merge-set(), inte här.
  await db.collection("organisationer").doc(orgId).set({
    namn,
    status: "raderad",
    avtalsstatus: "avslutad",
    moduler: {},
    raderadTidpunkt: admin.firestore.FieldValue.serverTimestamp(),
    provperiodSlut: null,
  });

  await loggaRevision({
    organisationId: orgId,
    aktorUid: "_system",
    aktorRoll: "system",
    handelsetyp: "organisation_permanent_raderad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: `Permanent radering slutförd: ${antalRaderadeDokument} dokument, ${uids.length} användarkonton`,
  });
  Sentry.captureMessage("Organisation permanent raderad", {
    level: "warning",
    tags: { typ: "radering_slutford" },
    extra: { orgId, antalRaderadeDokument, antalAnvandare: uids.length },
  });
  return { antalRaderadeDokument, antalAnvandare: uids.length };
}
// Exporterad enbart för tests/functions/radering.test.cjs.
exports.raderaOrganisationensData = raderaOrganisationensData;

exports.utforSchemalagdRaderingSchemalagt = onSchedule(
  { schedule: "every 60 minutes", timeZone: "Europe/Stockholm", region: "europe-west1", timeoutSeconds: 540 },
  async () => {
    const nu = admin.firestore.Timestamp.now();
    const snap = await db.collection("organisationer").where("raderingSchemalagdTill", "<=", nu).get();
    for (const orgDoc of snap.docs) {
      try {
        await raderaOrganisationensData(orgDoc.id);
      } catch (fel) {
        console.error(`Schemalagd radering misslyckades för organisation ${orgDoc.id}:`, fel);
        Sentry.captureException(fel);
      }
    }
  }
);

// Etapp 6c: inbjudningsflöde istället för öppen självbetjänings-registrering. Ett nytt konto
// kan numera ALDRIG skapa sitt eget users/{uid}-dokument direkt (se firestore.rules – create
// är stängt helt) – den enda vägen in är att lösa in en giltig inbjudan här, som körs med
// Admin SDK och därför kan kringgå den regeln på ett kontrollerat sätt.
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

  // Etapp 19a: automatisk tilldelning av introduktionsspår, om organisationen har definierat
  // ett för den här rollen. Görs EFTER transaktionen (precis som loggaRevision ovan) – en
  // fristående, icke-transaktionell skrivning, så ett saknat/dubbelt spår i värsta fall bara
  // innebär att den automatiska tilldelningen uteblir, inte att hela inloggningen misslyckas.
  try {
    const sparSnap = await db
      .collection("introduktionsspar")
      .where("organisationId", "==", inbjudanOrganisationId)
      .where("malRoll", "==", inbjudanRoll)
      .limit(1)
      .get();
    if (!sparSnap.empty) {
      const spar = sparSnap.docs[0];
      await db.collection("introduktionstilldelningar").doc(request.auth.uid).set({
        uid: request.auth.uid,
        namn,
        organisationId: inbjudanOrganisationId,
        sparId: spar.id,
        sparNamn: spar.data().namn,
        malRoll: inbjudanRoll,
        tilldelad: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (fel) {
    console.error("Automatisk tilldelning av introduktionsspår misslyckades:", fel);
  }

  return { ok: true };
});
