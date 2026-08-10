// gemensamt.js – del av Synappsen Cloud Functions.
//
// Etapp 61a (ETAPPLAN12.md): functions/index.js hade vuxit till ~4700 rader och ~93
// exports i EN fil. Den är nu uppdelad per domän – samma kod, samma exports, samma
// beteende – och index.js är bara en tunn åter-exporterande skarv (så både
// firebase deploy och tests/functions/*.test.cjs fungerar oförändrat).
//
// Den här filen: de delade grundstenarna som nästan varje domänfil behöver –
// onCall-omslaget med Sentry-rapportering, admin/db/bucket, hemligheter, roll- och
// modulkontroller, personnummerspärren, e-postutskick, hastighetsbegränsning,
// budget-/sökkvotsreservation, revisionsloggens skrivning och push-/e-postmottagare.

const { onCall: onCallUtanRapportering, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("node:crypto");
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
const GILTIGA_ROLLER = ["superadmin", "vol", "sektionsledare", "vec", "forradesansvarig", "personal", "kiosk"];

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

// Etapp 53a: e-post som utgående kanal. EN enda intern hjälpare som allt annat i planen
// (inbjudan 53b, påminnelser 53c, månadsrapport 53d) ska gå igenom – aldrig spridda
// fetch()-anrop mot Brevo på flera ställen. Se ETAPPLAN11.md §53 för resonemanget: ett mejl
// från Synappsen får aldrig innehålla verksamhetens innehåll eller personuppgifter utöver
// mottagarens egen adress (genomgående krav 18), och ska kunna stängas av globalt utan en
// deploy (den enda funktionen i produkten som kan generera hundratals irreversibla utgående
// händelser till riktiga människor på en minut).
const BREVO_API_KEY = defineSecret("BREVO_API_KEY");
// EU-baserat underbiträde (Sendinblue/Brevo, Frankrike) – se BESLUTSLOGG.md 2026-08-10 och
// OPPNA-PUNKTER.md för beslutspunkt 1 (Etapp 53). Avsändaradressen är inget hemligt värde,
// satt som en vanlig env-rad i functions/.env (se deploy.yml), samma mönster som SENTRY_DSN.
const EPOST_AVSANDARE = process.env.EPOST_AVSANDARE || "noreply@synappsen.se";

function giltigEpostadress(epost) {
  return typeof epost === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(epost.trim());
}

// systemstatus/epost är den globala nödstoppet (punkt iv i 53a) – samma delade,
// icke-org-skopade infrastruktur-collection som revisionskedjan/sökkvoten. Skrivs endast av
// angeEpostAvstangd (Admin SDK), aldrig direkt av en klient (se firestore.rules
// systemstatus/{id}, oförändrad).
async function epostArAvstangdGlobalt() {
  const snap = await db.collection("systemstatus").doc("epost").get();
  return snap.exists && snap.data()?.avstangd === true;
}

// Skickar ETT transaktionellt e-postmeddelande via Brevos API. Kastar bara vid ett faktiskt
// fel i anropet (ogiltig adress, misstänkt personnummer) – ett obekräftat/oskickat mejl på
// grund av nödstoppet eller en saknad nyckel är INTE ett fel för anroparen, så att t.ex. en
// inbjudan fortfarande skapas och går att dela som länk även om e-postkanalen är nere.
async function skickaEpost({ till, amne, text, organisationId = null }) {
  if (!giltigEpostadress(till)) {
    throw new HttpsError("invalid-argument", "Ogiltig mottagaradress för e-post.");
  }
  if (innehallerPersonnummer(`${amne}\n${text}`)) {
    throw new HttpsError(
      "invalid-argument",
      "E-postinnehållet verkar innehålla ett personnummer och skickades inte."
    );
  }
  if (await epostArAvstangdGlobalt()) {
    console.warn(`E-post till ${till} skippad: utgående e-post är globalt avstängd.`);
    return { skickat: false, anledning: "epost_avstangd_globalt" };
  }
  const apiNyckel = BREVO_API_KEY.value();
  if (!apiNyckel) {
    console.warn(`E-post till ${till} skippad: BREVO_API_KEY är inte konfigurerad än.`);
    return { skickat: false, anledning: "epost_ej_konfigurerad" };
  }
  const svar = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiNyckel, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: EPOST_AVSANDARE, name: "Synappsen" },
      to: [{ email: till.trim() }],
      subject: amne,
      textContent: text,
    }),
  });
  if (!svar.ok) {
    const feltext = await svar.text();
    Sentry.captureMessage(`E-postutskick misslyckades (${svar.status}): ${feltext}`, {
      level: "error",
      tags: { typ: "epostutskick_misslyckades" },
    });
    return { skickat: false, anledning: "leverantorsfel" };
  }
  if (organisationId) {
    await loggaRevision({
      organisationId,
      aktorUid: "_system",
      aktorRoll: "system",
      handelsetyp: "epost_skickad",
      sammanfattning: "Ett e-postmeddelande skickades till en användare.",
    });
  }
  return { skickat: true };
}
exports.skickaEpost = skickaEpost;

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

// Etapp 53c/53d: MOTSATT förval av push ovan, med avsikt. En tilldelad arbetsuppgift (mitt
// anslag, mitt ändringsförslag) eller en periodisk sammanfattning riktad till mig är inte
// brus – förvalet är PÅ, med opt-out i Profil.jsx (`epostInstallningar.<installningsNyckel>`,
// t.ex. `paminnelser` för 53c, `manadsrapport` för 53d – EGNA fält, en avstängd
// dagspåminnelse ska inte tysta månadssammanfattningen och tvärtom). En Firestore-
// likhetsfråga kan inte matcha "fältet saknas ELLER är true", så alla
// organisationsmedlemmar hämtas och de som uttryckligen stängt av just DEN kategorin
// filtreras bort i JS istället för i frågan.
async function hamtaAnvandareForEpostPaminnelse(organisationId, extraFilter, installningsNyckel = "paminnelser") {
  const snap = await db.collection("users").where("organisationId", "==", organisationId).get();
  const anvandare = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((a) => a.epostInstallningar?.[installningsNyckel] !== false && !!a.email);
  return extraFilter ? anvandare.filter(extraFilter) : anvandare;
}
exports.hamtaAnvandareForEpostPaminnelse = hamtaAnvandareForEpostPaminnelse;

// Etapp 53c: en daglig SAMMANSLAGNING, inte ett mejl per händelse (se ETAPPLAN11.md §53c) –
// varje källa (kvitteringsfrister, ändringsförslag, framtida källor) köar hit istället för
// att anropa skickaEpost() direkt. skickaEpostPaminnelserSchemalagt tömmer kön en gång om
// dagen, efter att båda källjobben (07:00/08:00) hunnit köra.
async function koaEpostPaminnelse(uid, organisationId, epost, text, url) {
  if (!epost) return;
  await db
    .collection("epostPaminnelseko")
    .doc(uid)
    .set(
      {
        organisationId,
        epost,
        poster: admin.firestore.FieldValue.arrayUnion({ text, url: url ?? null }),
        uppdaterad: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}
exports.koaEpostPaminnelse = koaEpostPaminnelse;

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

// Etapp 53b: appens publika URL, för länken i inbjudningsmejlet. Klienten bygger samma länk
// från window.location.origin (se t.ex. InbjudanFormular.jsx), men servern har ingen
// motsvarighet – en Cloud Function körs inte i en webbläsare.
const APP_URL = "https://synappsen-final-build.web.app";

// Etapp 61a: allt ovan som andra domänfiler behöver görs åtkomligt här. index.js
// åter-exporterar MEDVETET bara de namn som redan var exports i den odelade filen –
// firebase-functions letar igenom index.js exports rekursivt efter Cloud Functions, och
// ska därför inte se t.ex. Firestore-instansen db.
exports.admin = admin;
exports.db = db;
exports.bucket = bucket;
exports.onCall = onCall;
exports.HttpsError = HttpsError;
exports.GEMINI_API_KEY = GEMINI_API_KEY;
exports.SOKMOTOR_API_KEY = SOKMOTOR_API_KEY;
exports.BREVO_API_KEY = BREVO_API_KEY;
exports.STANDARD_ORG = STANDARD_ORG;
exports.GILTIGA_ROLLER = GILTIGA_ROLLER;
exports.KAN_HANTERA_FORRAD = KAN_HANTERA_FORRAD;
exports.APP_URL = APP_URL;
exports.UPPSKATTAD_KOSTNAD_ORE = UPPSKATTAD_KOSTNAD_ORE;
exports.STANDARD_TAK_ORE = STANDARD_TAK_ORE;
exports.MAX_PER_ANVANDARE_ORE = MAX_PER_ANVANDARE_ORE;
exports.MAX_KLINIKSTOD_FRAGOR_PER_TIMME = MAX_KLINIKSTOD_FRAGOR_PER_TIMME;
exports.SOKKVOT_DAGSTAK = SOKKVOT_DAGSTAK;
exports.SOKKVOT_VARNING_TROSKEL = SOKKVOT_VARNING_TROSKEL;
exports.SOKKVOT_ORG_TAK_STANDARD = SOKKVOT_ORG_TAK_STANDARD;
exports.hamtaAnvandarInfo = hamtaAnvandarInfo;
exports.kravModul = kravModul;
exports.dagensDatumStockholm = dagensDatumStockholm;
exports.budgetDok = budgetDok;
exports.aktuellManadNyckel = aktuellManadNyckel;
exports.innehallerPersonnummer = innehallerPersonnummer;
exports.giltigEpostadress = giltigEpostadress;
exports.skickaEpost = skickaEpost;
exports.kontrolleraOchOkaHastighet = kontrolleraOchOkaHastighet;
exports.okaSokkvot = okaSokkvot;
exports.reserveraBudget = reserveraBudget;
exports.loggaRevision = loggaRevision;
exports.verifieraRevisionskedja = verifieraRevisionskedja;
exports.skickaPush = skickaPush;
exports.hamtaAnvandareMedPushPreferens = hamtaAnvandareMedPushPreferens;
exports.hamtaAnvandareForEpostPaminnelse = hamtaAnvandareForEpostPaminnelse;
exports.koaEpostPaminnelse = koaEpostPaminnelse;
exports.hamtaRollForAktor = hamtaRollForAktor;
exports.arPlattformsadminServer = arPlattformsadminServer;
exports.kravPlattformsadmin = kravPlattformsadmin;
