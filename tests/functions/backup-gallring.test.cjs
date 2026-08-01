// Etapp 33c (Operations): bevisar att gallraGamlaBackuper() raderar backuper äldre än
// retentionstiden (90 dagar, ägarbeslut 2026-08-01) men rör INTE nyare backuper eller filer
// som inte matchar backup-filnamnsmönstret. Körs mot Storage-emulatorn:
//
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage \
//     "node tests/functions/backup-gallring.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.STORAGE_EMULATOR_HOST = "http://127.0.0.1:9199";
process.env.GCLOUD_PROJECT = "demo-test";
process.env.GCP_PROJECT = "demo-test";

const path = require("node:path");
const admin = require(
  require.resolve("firebase-admin", { paths: [path.join(__dirname, "../../functions")] })
);
const funcs = require("../../functions/index.js");

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

function datumForDagarSedan(dagar) {
  const d = new Date(Date.now() - dagar * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const bucket = admin.storage().bucket("synappsen-final-build.firebasestorage.app");

  const gammalt = `backups/orgA/${datumForDagarSedan(100)}.json`;
  const nyligen = `backups/orgA/${datumForDagarSedan(10)}.json`;
  const pagransen = `backups/orgB/${datumForDagarSedan(89)}.json`;
  const ovidkommande = "backups/orgA/inte-en-backupfil.txt";

  await bucket.file(gammalt).save(JSON.stringify({ orgId: "orgA" }), { contentType: "application/json" });
  await bucket.file(nyligen).save(JSON.stringify({ orgId: "orgA" }), { contentType: "application/json" });
  await bucket.file(pagransen).save(JSON.stringify({ orgId: "orgB" }), { contentType: "application/json" });
  await bucket.file(ovidkommande).save("skräpdata", { contentType: "text/plain" });

  console.log("\ngallraGamlaBackuper()");
  let antalRaderade;
  await test("raderar exakt en fil (den äldre än 90 dagar)", async () => {
    antalRaderade = await funcs.gallraGamlaBackuper();
    vantaSig(antalRaderade === 1, `antalRaderade: ${antalRaderade}`);
  });
  await test("den gamla backupen är faktiskt borta", async () => {
    const [finns] = await bucket.file(gammalt).exists();
    vantaSig(!finns, "den gamla backupfilen finns fortfarande kvar");
  });
  await test("en nyare backup för samma organisation rörs inte", async () => {
    const [finns] = await bucket.file(nyligen).exists();
    vantaSig(finns, "en backup som INTE är äldre än 90 dagar raderades felaktigt");
  });
  await test("en backup precis under gränsen (89 dagar) rörs inte", async () => {
    const [finns] = await bucket.file(pagransen).exists();
    vantaSig(finns, "en backup på 89 dagar raderades felaktigt");
  });
  await test("en fil som inte matchar backup-namnmönstret rörs inte", async () => {
    const [finns] = await bucket.file(ovidkommande).exists();
    vantaSig(finns, "en icke-backupfil raderades felaktigt");
  });
  await test("en andra körning raderar inget nytt (redan gallrat)", async () => {
    const andraKorningen = await funcs.gallraGamlaBackuper();
    vantaSig(andraKorningen === 0, `andraKorningen: ${andraKorningen}`);
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
