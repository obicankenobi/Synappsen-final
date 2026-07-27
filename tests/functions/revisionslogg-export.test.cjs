// Etapp 14d: bevisar att verifieraRevisionsloggAdmin/exporteraRevisionslogg (a) kräver
// superadmin eller leverantörsadmin, (b) returnerar ett korrekt kedjeresultat och
// begränsningstexten, och (c) att exporteraRevisionslogg faktiskt loggar sig själv
// (revisionslogg_exporterad).
//
// Körs mot emulatorerna:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage \
//     "node tests/functions/revisionslogg-export.test.cjs"
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

async function forvantaFel(kod, promiseFn) {
  try {
    await promiseFn();
    throw new Error(`förväntade fel ${kod}, fick inget`);
  } catch (fel) {
    vantaSig(fel.code === kod, `fel kod: ${fel.code} (${fel.message})`);
  }
}

async function main() {
  const ORG = "orgExport14d";
  await db.collection("users").doc("superExport14d").set({ role: "superadmin", organisationId: ORG });
  await db.collection("users").doc("personalExport14d").set({ role: "personal", organisationId: ORG });
  await db.collection("plattformsadmin").doc("plattformExport14d").set({ blevPlattformsadmin: true });

  await funcs.loggaRevision({
    organisationId: ORG,
    aktorUid: "superExport14d",
    aktorRoll: "superadmin",
    handelsetyp: "inloggning_lyckad",
    sammanfattning: "Testpost inför export",
  });

  console.log("\nverifieraRevisionsloggAdmin – behörighet och resultat");
  await test("en vanlig roll (personal) nekas med permission-denied", () =>
    forvantaFel("permission-denied", () =>
      funcs.verifieraRevisionsloggAdmin.run({ data: {}, auth: { uid: "personalExport14d" } })
    )
  );
  await test("en icke inloggad nekas med unauthenticated", () =>
    forvantaFel("unauthenticated", () => funcs.verifieraRevisionsloggAdmin.run({ data: {} }))
  );
  await test("superadmin i rätt organisation får ett giltigt kedjeresultat + begränsningstext", async () => {
    const resultat = await funcs.verifieraRevisionsloggAdmin.run({
      data: {},
      auth: { uid: "superExport14d" },
    });
    vantaSig(resultat.giltig === true, "förväntade en giltig kedja");
    vantaSig(
      typeof resultat.begransningstext === "string" && resultat.begransningstext.includes("Admin SDK"),
      "begränsningstexten saknades eller innehöll inte den förväntade texten"
    );
  });
  await test("en leverantörsadmin kan verifiera EN ANNAN organisations kedja via organisationId", async () => {
    const resultat = await funcs.verifieraRevisionsloggAdmin.run({
      data: { organisationId: ORG },
      auth: { uid: "plattformExport14d" },
    });
    vantaSig(resultat.giltig === true, "förväntade en giltig kedja");
  });
  await test("en leverantörsadmin UTAN organisationId nekas med invalid-argument", () =>
    forvantaFel("invalid-argument", () =>
      funcs.verifieraRevisionsloggAdmin.run({ data: {}, auth: { uid: "plattformExport14d" } })
    )
  );

  console.log("\nexporteraRevisionslogg – loggar sig själv");
  await test("exporten returnerar kedjeresultat + begränsningstext OCH loggar revisionslogg_exporterad", async () => {
    const resultat = await funcs.exporteraRevisionslogg.run({ data: {}, auth: { uid: "superExport14d" } });
    vantaSig(resultat.giltig === true, "förväntade en giltig kedja");
    vantaSig(Boolean(resultat.begransningstext), "begränsningstexten saknades");

    const snap = await db
      .collection("revisionslogg")
      .where("organisationId", "==", ORG)
      .orderBy("tidpunkt", "desc")
      .limit(1)
      .get();
    vantaSig(!snap.empty, "ingen post hittades alls efter export");
    vantaSig(
      snap.docs[0].data().handelsetyp === "revisionslogg_exporterad",
      `senaste posten var inte en exportlogg: ${snap.docs[0].data().handelsetyp}`
    );
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  process.exit(antalMisslyckade > 0 ? 1 : 0);
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
