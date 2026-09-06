// Seedar Firestore-/Auth-emulatorn med den DEMODATA som webbplatsens skärmbilder visar.
//
// Varför den här filen finns: produkt/VARUMARKE.md §12 säger "visa gränssnittet, alltid med
// demodata, aldrig en kunds verkliga innehåll". Fram till 2026-09-06 hade webbplatsen inga
// skärmbilder alls, bara två handritade HTML-attrapper – och en av dem stavade fel på ett
// kliniskt begrepp ("Urinkadeter"), vilket är precis vad som händer när ett gränssnitt ritas
// av för hand i stället för att fotograferas.
//
// Innehållet nedan är PÅHITTAT men fackmässigt rimligt. Det ska aldrig ersättas med en kunds
// verkliga rutiner, och det ska aldrig innehålla personuppgifter – appen spärrar personnummer
// i tre lager och en skärmbild av demodata får inte bli det första undantaget.
//
// Körs av skarmbilder.config.mjs som globalSetup. Emulatorerna startas utanför Playwright,
// se kommentaren överst i skarmbilder.config.mjs.
import admin from "firebase-admin";

const ORG = "demoEnhet";
const LOSENORD = "test1234";

export const DEMO = {
  org: ORG,
  losenord: LOSENORD,
  redaktor: "demo-sektionsledare@demo.test",
};

// Ett datum N dagar tillbaka, som Firestore-Timestamp. Rutinernas granskningsdatum måste
// ligga på bestämt avstånd från "i dag" för att appens granskningsflagga ska falla ut rätt –
// ett hårdkodat datum hade gjort skärmbilderna felaktiga så fort de togs om ett halvår senare.
//
// Typen är INTE valfri: både formateraDatum() (src/utils/datum.js) och borGranskas()
// (src/utils/rutinHjalp.js) kräver ett objekt med .toDate(). En ISO-sträng ger tyst en tom
// datumtext och en flagga som aldrig utlöses – första utkastet av den här filen gjorde exakt
// det, och det syntes bara för att skärmbilden granskades renderad.
const dagarSedan = (n) =>
  admin.firestore.Timestamp.fromDate(new Date(Date.now() - n * 86_400_000));

const KONTON = [
  { uid: "demoSuper", email: "demo-superadmin@demo.test", role: "superadmin", namn: "Anna Lindqvist" },
  { uid: "demoSektion", email: DEMO.redaktor, role: "sektionsledare", namn: "Johan Ek" },
  { uid: "demoPersonal", email: "demo-personal@demo.test", role: "personal", namn: "Sara Nyman" },
];

// Rutinerna är valda så att skärmbilden visar det sidan faktiskt påstår: granskningsdatum,
// namngiven ägare, och en blandning av områden. "Urinkateter (KAD)" finns med därför att det
// är sökexemplet på startsidan – bilden och texten ska visa samma sak.
const RUTINER = [
  {
    id: "demoKad",
    titel: "Urinkateter (KAD) – inläggning",
    omrade: "kliniskt-stod",
    granskadDagar: 12,
    agare: { typ: "roll", roll: "sektionsledare" },
    kvitteratAv: ["demoSuper", "demoSektion", "demoPersonal"],
    innehall:
      "Indikation, materialval och steril teknik vid inläggning av kvarliggande kateter.\n\n" +
      "1. Kontrollera indikation och dokumentera den.\n" +
      "2. Välj storlek efter patientens förutsättningar.\n" +
      "3. Använd steril teknik genom hela momentet.\n" +
      "4. Fixera katetern och notera tidpunkt.",
  },
  {
    id: "demoPvk",
    titel: "Perifer venkateter (PVK) – inläggning och skötsel",
    omrade: "kliniskt-stod",
    granskadDagar: 34,
    agare: { typ: "person", uid: "demoSektion", namn: "Johan Ek" },
    kvitteratAv: ["demoSuper", "demoSektion"],
    innehall: "Val av insticksställe, fixering, inspektion varje pass och byte enligt lokal rutin.",
  },
  {
    id: "demoSepsis",
    titel: "Misstänkt sepsis – omhändertagande första timmen",
    omrade: "kliniskt-stod",
    granskadDagar: 5,
    agare: { typ: "roll", roll: "vec" },
    kvitteratAv: ["demoSuper", "demoSektion", "demoPersonal"],
    innehall: "Larmkriterier, provtagningsordning och vem som kontaktas i vilken ordning.",
  },
  {
    id: "demoHlr",
    titel: "HLR vuxen – larmkedja och utrustningens placering",
    omrade: "kliniskt-stod",
    granskadDagar: 210,
    agare: { typ: "roll", roll: "sektionsledare" },
    kvitteratAv: ["demoSuper"],
    innehall: "Larmnummer, defibrillatorns placering och rollfördelning vid larm.",
  },
  {
    id: "demoHygien",
    titel: "Basala hygienrutiner och klädregler",
    omrade: "administration",
    granskadDagar: 48,
    agare: { typ: "roll", roll: "vec" },
    kvitteratAv: ["demoSuper", "demoSektion", "demoPersonal"],
    innehall: "Handdesinfektion, arbetsdräkt och skyddsutrustning.",
  },
  {
    id: "demoAvvikelse",
    titel: "Avvikelsehantering – när och hur du rapporterar",
    omrade: "administration",
    granskadDagar: 96,
    agare: { typ: "person", uid: "demoSuper", namn: "Anna Lindqvist" },
    kvitteratAv: ["demoSuper", "demoPersonal"],
    innehall: "Vad som ska rapporteras, var formuläret finns och vad som händer sedan.",
  },
];

const ARTIKLAR = [
  { id: "demoKadSet", namn: "KAD-set, Foley 14 Ch", forrad: "Sterilförrådet", skap: "4", hylla: "B", antal: 12 },
  { id: "demoKadSet16", namn: "KAD-set, Foley 16 Ch", forrad: "Sterilförrådet", skap: "4", hylla: "B", antal: 9 },
  { id: "demoPvkRosa", namn: "PVK 20G, rosa", forrad: "Sterilförrådet", skap: "2", hylla: "A", antal: 60 },
  { id: "demoHandskar", namn: "Sterila handskar stl 7", forrad: "Sterilförrådet", skap: "1", hylla: "C", antal: 24 },
  { id: "demoKompress", namn: "Kompresser 10x10, sterila", forrad: "Sterilförrådet", skap: "3", hylla: "A", antal: 40 },
  { id: "demoUrinpase", namn: "Urinuppsamlingspåse 2 l", forrad: "Sterilförrådet", skap: "4", hylla: "C", antal: 18 },
];

export default async function seedaDemodata() {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
  process.env.GCLOUD_PROJECT = "demo-test";

  const app = admin.initializeApp({ projectId: "demo-test" }, `demodata-${Date.now()}`);
  const db = app.firestore();
  const auth = app.auth();

  for (const k of KONTON) {
    await auth
      .createUser({ uid: k.uid, email: k.email, password: LOSENORD, emailVerified: true })
      .catch(() => auth.updateUser(k.uid, { email: k.email, password: LOSENORD }));
    await db.collection("users").doc(k.uid).set({
      namn: k.namn,
      email: k.email,
      role: k.role,
      organisationId: ORG,
    });
  }

  await db.collection("organisationer").doc(ORG).set({
    namn: "Demoenheten, akutmottagning",
    status: "active",
    plan: "core",
    moduler: { operations: true, intelligence: true },
  });

  for (const r of RUTINER) {
    await db.collection("rutiner").doc(r.id).set({
      titel: r.titel,
      omrade: r.omrade,
      status: "godkand",
      innehall: r.innehall,
      organisationId: ORG,
      borttagen: false,
      arkiverad: false,
      agare: r.agare,
      granskadDatum: dagarSedan(r.granskadDagar),
      granskadAvNamn: r.agare.typ === "person" ? r.agare.namn : "Johan Ek",
      // Läskvitteringar, så ledningsrapportens kvitteringsgrad visar ett verkligt tal i
      // stället för 0 %. Formen är den useLaskvittering.js faktiskt skriver: {uid, tidpunkt},
      // utan namn (Etapp 60b).
      lasteAv: (r.kvitteratAv ?? []).map((uid) => ({
        uid,
        tidpunkt: admin.firestore.Timestamp.now(),
      })),
      godkandAvNamn: "Anna Lindqvist",
      skapad: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  for (const a of ARTIKLAR) {
    await db.collection("forradsartiklar").doc(a.id).set({
      namn: a.namn,
      skap: a.skap,
      hylla: a.hylla,
      antal: a.antal,
      status: "godkand",
      forrad: a.forrad,
      organisationId: ORG,
      skapadAv: "demoSuper",
      skapad: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await app.delete();
}
