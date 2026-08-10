// Etapp 31b: seedar Firestore-/Auth-emulatorn med precis den data e2e-testerna behöver innan
// Playwright kör några tester. Emulatorerna själva startas UTANFÖR Playwright (via
// `firebase emulators:exec`, se package.json:s "test:e2e"), så den här funktionen förutsätter
// att de redan svarar när den körs.
import admin from "firebase-admin";

const ORG_A = "orgA";
const ORG_B = "orgB";

export default async function globalSetup() {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
  process.env.GCLOUD_PROJECT = "demo-test";

  const app = admin.initializeApp({ projectId: "demo-test" }, "e2e-global-setup");
  const db = app.firestore();
  const auth = app.auth();

  const KONTON = [
    { uid: "e2eSuperA", email: "e2e-superA@orga.test", role: "superadmin", organisationId: ORG_A, namn: "E2E Super A" },
    { uid: "e2eVolA", email: "e2e-volA@orga.test", role: "vol", organisationId: ORG_A, namn: "E2E Vol A" },
    { uid: "e2ePersonalA", email: "e2e-personalA@orga.test", role: "personal", organisationId: ORG_A, namn: "E2E Personal A" },
    { uid: "e2eSuperB", email: "e2e-superB@orgb.test", role: "superadmin", organisationId: ORG_B, namn: "E2E Super B" },
    // Etapp 45b (rökprovssvit): tre roller som tidigare saknade ett eget seedat konto, så
    // "varje route, varje roll" faktiskt kan testas mot alla sex roller i src/firebase/roles.js
    // – inte bara de tre som råkade finnas sedan Etapp 31b.
    { uid: "e2eSektionsledareA", email: "e2e-sektionsledareA@orga.test", role: "sektionsledare", organisationId: ORG_A, namn: "E2E Sektionsledare A" },
    { uid: "e2eVecA", email: "e2e-vecA@orga.test", role: "vec", organisationId: ORG_A, namn: "E2E Vec A" },
    { uid: "e2eForradA", email: "e2e-forradA@orga.test", role: "forradesansvarig", organisationId: ORG_A, namn: "E2E Förråd A" },
  ];

  for (const k of KONTON) {
    await auth
      .createUser({ uid: k.uid, email: k.email, password: "test1234", emailVerified: true })
      .catch(() => auth.updateUser(k.uid, { email: k.email, password: "test1234" }));
    await db.collection("users").doc(k.uid).set({ namn: k.namn, email: k.email, role: k.role, organisationId: k.organisationId });
  }

  await db.collection("organisationer").doc(ORG_A).set({
    namn: "E2E Organisation A",
    status: "active",
    plan: "core",
    moduler: { operations: true, intelligence: true },
  });
  await db.collection("organisationer").doc(ORG_B).set({
    namn: "E2E Organisation B",
    status: "active",
    plan: "core",
    moduler: { operations: true, intelligence: true },
  });

  // En rutin i org A, unikt namngiven så testerna entydigt kan slå fast att den ALDRIG syns
  // för en användare i org B.
  await db.collection("rutiner").doc("e2eRutinA").set({
    titel: "E2E-hemlig rutin ORG-A-ENDAST",
    omrade: "kliniskt-stod",
    status: "godkand",
    innehall: "Detta innehåll ska ENDAST synas för organisation A.",
    organisationId: ORG_A,
    // Etapp 60c (ETAPPLAN12.md): useRutiner.js frågar nu server-side på
    // where("borttagen", "==", false) – utan fältet här skulle rutinen bli osynlig i UI:t
    // och tysta ut hela e2e-svitens poäng.
    borttagen: false,
    skapad: admin.firestore.FieldValue.serverTimestamp(),
  });

  // En förrådsartikel + en bristanmälan på den – exakt den kombination som avslöjade
  // list-provability-buggen i Etapp 29 (en icke-förrådsansvarig roll som tidigare fick
  // permission-denied på HELA sin bristanmalningar-lyssnare).
  await db.collection("forradsartiklar").doc("e2eArtikelA").set({
    namn: "E2E Sterila handskar",
    skap: "A",
    hylla: "1",
    antal: 10,
    status: "godkand",
    forrad: "Sterilförrådet",
    organisationId: ORG_A,
    skapadAv: "e2eSuperA",
    skapad: admin.firestore.FieldValue.serverTimestamp(),
  });
  await db.collection("bristanmalningar").doc("e2eBristA").set({
    artikelId: "e2eArtikelA",
    artikelNamn: "E2E Sterila handskar",
    forrad: "Sterilförrådet",
    status: "ny",
    kommentar: "",
    antalAnmalningar: 1,
    anmaldAv: "e2eVolA",
    anmaldAvNamn: "E2E Vol A",
    organisationId: ORG_A,
    tidpunkt: admin.firestore.FieldValue.serverTimestamp(),
    senastAnmald: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Ett ändringsförslag – samma list-provability-buggklass som Etapp 26 upptäckte
  // (andringsforslag/{forslagId}s läsregel refererar resource.data.omrade).
  await db.collection("andringsforslag").doc("e2eForslagA").set({
    rutinId: "e2eRutinA",
    rutinTitel: "E2E-hemlig rutin ORG-A-ENDAST",
    omrade: "kliniskt-stod",
    markeratStycke: "",
    forslag: "E2E-testförslag",
    motivering: "",
    status: "ny",
    foreslagenAv: "e2ePersonalA",
    foreslagenAvNamn: "E2E Personal A",
    visaNamnOffentligt: true,
    organisationId: ORG_A,
    tidpunkt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await app.delete();
}
