// Etapp L1k (intern/ETAPPLAN-INTERN-1.md): listaOrganisationer gjorde tidigare en extra
// users-läsning PER ORGANISATION, varje gång leverantörsvyn öppnades. losInInbjudan och
// raderaAnvandare underhåller nu en denormaliserad räknare (organisationer/{orgId}.antalAnvandare)
// i stället.
//
// Det här testet bevisar särskilt SKYDDET mot en tyst felräkning: FieldValue.increment(±1) på
// ett ÄNNU INTE INITIERAT fält hade skapat en felaktig ABSOLUT siffra (t.ex. "1 användare" för
// en organisation som redan har tio) i stället för en korrekt delta. Både losInInbjudan och
// raderaAnvandare ska därför LÅTA FÄLTET VARA om det saknas, och lämna det åt
// listaOrganisationers lativa backfill att räkna rätt från grunden.
//
// Körs mot Firestore- OCH Auth-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,auth \
//     "node tests/functions/antalanvandare-raknare.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.GCLOUD_PROJECT = "demo-test";
process.env.GCP_PROJECT = "demo-test";

const path = require("node:path");
const admin = require(
  require.resolve("firebase-admin", { paths: [path.join(__dirname, "../../functions")] })
);
const funcs = require("../../functions/index.js");

const db = admin.firestore();

let antalKlarade = 0;
let antalMisslyckade = 0;

async function test(namn, fn) {
  try {
    await fn();
    antalKlarade++;
    console.log(`  OK   ${namn}`);
  } catch (fel) {
    antalMisslyckade++;
    console.error(`  FEL  ${namn}`);
    console.error(`       ${fel.stack || fel.message}`);
  }
}

function vantaSig(villkor, meddelande) {
  if (!villkor) throw new Error(meddelande);
}

async function skapaKonto(uid, epost) {
  await admin.auth().deleteUser(uid).catch(() => {});
  await admin.auth().createUser({ uid, email: epost, password: "hemligt123" });
}

async function bjudInOchLosIn({ superadminUid, orgId, nyttUid, epost }) {
  const resultat = await funcs.skapaInbjudan.run({
    data: { epost, roll: "personal" },
    auth: { uid: superadminUid },
  });
  await skapaKonto(nyttUid, epost);
  await funcs.losInInbjudan.run({
    data: { token: resultat.token, namn: "Test Person" },
    auth: { uid: nyttUid, token: { email: epost } },
  });
}

async function main() {
  // ── Del 1: en organisation vars räknare ALDRIG initierats ──────────────────────────────
  const ORG_OINIT = "orgL1kOinitierad";
  await skapaKonto("superOinit", "super@l1k-oinit.test");
  await db.collection("users").doc("superOinit").set({ role: "superadmin", organisationId: ORG_OINIT });
  await db.collection("organisationer").doc(ORG_OINIT).set({ namn: "Oinitierad org" });
  // Ett konto skapat direkt (inte via losInInbjudan) – motsvarar precis den verkliga
  // situationen: befintliga organisationer hade redan användare innan L1k fanns.
  await db.collection("users").doc("befintligOinit").set({ role: "personal", organisationId: ORG_OINIT });

  await test("losInInbjudan mot en organisation UTAN räknare skapar INTE ett felaktigt '1'", async () => {
    await bjudInOchLosIn({
      superadminUid: "superOinit",
      orgId: ORG_OINIT,
      nyttUid: "nyOinit",
      epost: "ny@l1k-oinit.test",
    });
    const orgSnap = await db.collection("organisationer").doc(ORG_OINIT).get();
    vantaSig(
      typeof orgSnap.data().antalAnvandare !== "number",
      `räknaren skulle lämnas oinitierad, men blev ${orgSnap.data().antalAnvandare}`
    );
  });

  await test("listaOrganisationer backfillar räknaren korrekt (superadmin + befintlig + ny = 3)", async () => {
    await db.collection("plattformsadmin").doc("levL1k").set({ blevPlattformsadmin: Date.now() });
    const resultat = await funcs.listaOrganisationer.run({ data: {}, auth: { uid: "levL1k" } });
    const rad = resultat.organisationer.find((o) => o.orgId === ORG_OINIT);
    vantaSig(rad.antalAnvandare === 3, `förväntade 3, fick ${rad.antalAnvandare}`);

    const orgSnap = await db.collection("organisationer").doc(ORG_OINIT).get();
    vantaSig(orgSnap.data().antalAnvandare === 3, "backfillen skrevs inte tillbaka till dokumentet");
  });

  await test("raderaAnvandare mot en organisation UTAN räknare (nollställd igen för testet) rör inte fältet", async () => {
    // Nollställ räknaren för att bevisa samma skydd på raderingssidan, isolerat från delen ovan.
    await db.collection("organisationer").doc(ORG_OINIT).update({
      antalAnvandare: admin.firestore.FieldValue.delete(),
    });
    await funcs.raderaAnvandare.run({ data: { userId: "nyOinit" }, auth: { uid: "superOinit" } });
    const orgSnap = await db.collection("organisationer").doc(ORG_OINIT).get();
    vantaSig(
      typeof orgSnap.data().antalAnvandare !== "number",
      `räknaren skulle förbli oinitierad, men blev ${orgSnap.data().antalAnvandare}`
    );
  });

  // ── Del 2: en organisation vars räknare REDAN är initierad ─────────────────────────────
  const ORG_INIT = "orgL1kInitierad";
  await skapaKonto("superInit", "super@l1k-init.test");
  await db.collection("users").doc("superInit").set({ role: "superadmin", organisationId: ORG_INIT });
  await db.collection("organisationer").doc(ORG_INIT).set({ namn: "Initierad org", antalAnvandare: 1 });

  await test("losInInbjudan mot en organisation MED räknare ökar den atomiskt", async () => {
    await bjudInOchLosIn({
      superadminUid: "superInit",
      orgId: ORG_INIT,
      nyttUid: "nyInit",
      epost: "ny@l1k-init.test",
    });
    const orgSnap = await db.collection("organisationer").doc(ORG_INIT).get();
    vantaSig(orgSnap.data().antalAnvandare === 2, `förväntade 2, fick ${orgSnap.data().antalAnvandare}`);
  });

  await test("raderaAnvandare mot en organisation MED räknare minskar den atomiskt", async () => {
    await funcs.raderaAnvandare.run({ data: { userId: "nyInit" }, auth: { uid: "superInit" } });
    const orgSnap = await db.collection("organisationer").doc(ORG_INIT).get();
    vantaSig(orgSnap.data().antalAnvandare === 1, `förväntade 1, fick ${orgSnap.data().antalAnvandare}`);
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  if (antalMisslyckade > 0) {
    process.exit(1);
  }
}

main().catch((fel) => {
  console.error(fel);
  process.exit(1);
});
