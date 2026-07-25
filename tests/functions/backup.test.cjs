// Etapp 3b (Operations): bevisar att veckobackupen faktiskt skriver en läsbar JSON-fil per
// organisation till Storage, bara för organisationer med Operations-modulen påslagen, och
// att filen innehåller rätt (och bara rätt organisations) data. Körs mot Firestore- OCH
// Storage-emulatorn:
//
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage \
//     "node tests/functions/backup.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.STORAGE_EMULATOR_HOST = "http://127.0.0.1:9199";
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
  await db.collection("rutiner").doc("rutinOrgA").set({
    titel: "Rutin A",
    organisationId: "orgA",
  });
  await db.collection("rutiner").doc("rutinOrgB").set({
    titel: "Rutin B",
    organisationId: "orgB",
  });
  await db.collection("anslag").doc("anslagOrgA").set({
    titel: "Anslag A",
    organisationId: "orgA",
  });

  console.log("\nbackupaOrganisation – direkt");
  let path1;
  await test("skriver en json-fil med bara org A:s data", async () => {
    path1 = await funcs.backupaOrganisation("orgA");
    vantaSig(path1.startsWith("backups/orgA/") && path1.endsWith(".json"), `oväntad path: ${path1}`);
  });
  await test("den skrivna filen går att läsa och innehåller rätt innehåll", async () => {
    const bucket = admin.storage().bucket("synappsen-final-build.firebasestorage.app");
    const [buffer] = await bucket.file(path1).download();
    const data = JSON.parse(buffer.toString());
    vantaSig(data.orgId === "orgA", `orgId: ${data.orgId}`);
    vantaSig(
      data.samlingar.rutiner.length === 1 && data.samlingar.rutiner[0].titel === "Rutin A",
      `rutiner: ${JSON.stringify(data.samlingar.rutiner)}`
    );
    vantaSig(
      data.samlingar.anslag.length === 1 && data.samlingar.anslag[0].titel === "Anslag A",
      `anslag: ${JSON.stringify(data.samlingar.anslag)}`
    );
    vantaSig(
      !JSON.stringify(data).includes("Rutin B"),
      "org B:s data läckte in i org A:s backup!"
    );
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  if (antalMisslyckade > 0) {
    process.exit(1);
  }
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
