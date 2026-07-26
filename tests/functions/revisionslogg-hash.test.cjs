// Etapp 14b: bevisar att loggaRevision() bygger en giltig hashkedja och att
// verifieraRevisionskedja() upptäcker både en manipulerad post och en post där bara
// foregaendeHash-länken brutits. Körs mot Firestore-emulatorn:
//
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage \
//     "node tests/functions/revisionslogg-hash.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
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
  if (!villkor) {
    throw new Error(meddelande);
  }
}

async function main() {
  const ORG = "orgHashkedja";

  console.log("\nloggaRevision – bygger en giltig kedja");
  await funcs.loggaRevision({
    organisationId: ORG,
    aktorUid: "volA",
    aktorRoll: "vol",
    handelsetyp: "inloggning_lyckad",
    sammanfattning: "Första posten",
  });
  await funcs.loggaRevision({
    organisationId: ORG,
    aktorUid: "superadminA",
    aktorRoll: "superadmin",
    handelsetyp: "rolländring",
    objektTyp: "users",
    objektId: "volA",
    sammanfattning: "Ändrade volA:s roll",
  });
  await funcs.loggaRevision({
    organisationId: ORG,
    aktorUid: "superadminA",
    aktorRoll: "superadmin",
    handelsetyp: "organisation_pausad",
    sammanfattning: "Pausade organisationen",
  });

  let resultat;
  await test("en kedja med tre poster verifieras som giltig", async () => {
    resultat = await funcs.verifieraRevisionskedja(ORG);
    vantaSig(resultat.giltig === true, `förväntade giltig kedja, fick: ${JSON.stringify(resultat)}`);
  });

  await test("huvuddokumentet håller den senaste postens hash", async () => {
    const huvudSnap = await db.collection("revisionsloggHuvud").doc(ORG).get();
    const snap = await db
      .collection("revisionslogg")
      .where("organisationId", "==", ORG)
      .orderBy("tidpunkt", "asc")
      .get();
    const sistaPosten = snap.docs[snap.docs.length - 1].data();
    vantaSig(
      huvudSnap.data().senasteHash === sistaPosten.hash,
      "revisionsloggHuvud.senasteHash matchar inte den sista postens hash"
    );
  });

  console.log("\nverifieraRevisionskedja – upptäcker manipulation");
  const snapForeManipulation = await db
    .collection("revisionslogg")
    .where("organisationId", "==", ORG)
    .orderBy("tidpunkt", "asc")
    .get();
  const mellanPostensId = snapForeManipulation.docs[1].id;

  await db.collection("revisionslogg").doc(mellanPostensId).update({
    sammanfattning: "Manipulerad i efterhand, hash omräknades INTE",
  });

  await test("en post vars innehåll ändrats utan att räkna om hash upptäcks", async () => {
    resultat = await funcs.verifieraRevisionskedja(ORG);
    vantaSig(resultat.giltig === false, "förväntade en trasig kedja efter manipulation");
    vantaSig(resultat.avvikelseVidId === mellanPostensId, `avvikelsen pekade på fel post: ${resultat.avvikelseVidId}`);
  });

  console.log("\nverifieraRevisionskedja – upptäcker en bruten foregaendeHash-länk");
  const ORG2 = "orgTrasigLank";
  await funcs.loggaRevision({
    organisationId: ORG2,
    aktorUid: "volB",
    aktorRoll: "vol",
    handelsetyp: "inloggning_lyckad",
    sammanfattning: "Första posten i en annan organisation",
  });
  await funcs.loggaRevision({
    organisationId: ORG2,
    aktorUid: "volB",
    aktorRoll: "vol",
    handelsetyp: "inloggning_lyckad",
    sammanfattning: "Andra posten",
  });
  const snap2 = await db
    .collection("revisionslogg")
    .where("organisationId", "==", ORG2)
    .orderBy("tidpunkt", "asc")
    .get();
  const andraPostensId = snap2.docs[1].id;
  await db.collection("revisionslogg").doc(andraPostensId).update({ foregaendeHash: "kapad-lank" });

  await test("en bruten foregaendeHash-länk upptäcks, även om hash-fältet stämmer mot innehållet", async () => {
    resultat = await funcs.verifieraRevisionskedja(ORG2);
    vantaSig(resultat.giltig === false, "förväntade en trasig kedja efter kapad länk");
    vantaSig(resultat.avvikelseVidId === andraPostensId, `avvikelsen pekade på fel post: ${resultat.avvikelseVidId}`);
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  process.exit(antalMisslyckade > 0 ? 1 : 0);
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
