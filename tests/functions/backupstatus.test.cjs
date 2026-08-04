// Etapp 46: bevisar att hamtaBackupstatus (a) kräver superadmin/leverantörsadmin, (b)
// returnerar "ingen backup" korrekt när Operations-modulen är avstängd (utan att fråga
// Storage alls), och (c) hittar det SENASTE datumet bland flera sparade backuper för rätt
// organisation, utan att blanda in en annan organisations filer.
//
// Körs mot Firestore- OCH Storage-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage \
//     "node tests/functions/backupstatus.test.cjs"
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
const bucket = admin.storage().bucket("synappsen-final-build.firebasestorage.app");

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
  const ORG_UTAN = "orgBackupstatusUtanOps";
  const ORG_MED = "orgBackupstatusMedOps";
  const ORG_ANNAN = "orgBackupstatusAnnan";

  await db.collection("organisationer").doc(ORG_UTAN).set({ namn: "Utan Operations", moduler: { operations: false } });
  await db.collection("organisationer").doc(ORG_MED).set({ namn: "Med Operations", moduler: { operations: true } });
  await db.collection("organisationer").doc(ORG_ANNAN).set({ namn: "Annan org", moduler: { operations: true } });

  await db.collection("users").doc("superBackupstatus").set({ role: "superadmin", organisationId: ORG_MED });
  await db.collection("users").doc("personalBackupstatus").set({ role: "personal", organisationId: ORG_MED });

  await bucket.file(`backups/${ORG_MED}/2026-06-01.json`).save("{}", { contentType: "application/json" });
  await bucket.file(`backups/${ORG_MED}/2026-08-01.json`).save("{}", { contentType: "application/json" });
  await bucket.file(`backups/${ORG_ANNAN}/2026-08-04.json`).save("{}", { contentType: "application/json" });

  console.log("\nhamtaBackupstatus – behörighet");
  await test("en vanlig roll (personal) nekas med permission-denied", () =>
    forvantaFel("permission-denied", () =>
      funcs.hamtaBackupstatus.run({ data: {}, auth: { uid: "personalBackupstatus" } })
    )
  );
  await test("en icke inloggad nekas med unauthenticated", () =>
    forvantaFel("unauthenticated", () => funcs.hamtaBackupstatus.run({ data: {} }))
  );

  console.log("\nhamtaBackupstatus – resultat");
  await test("en organisation utan Operations-modulen får harOperationsModul: false, ingen Storage-fråga behövs", async () => {
    await db.collection("users").doc("superBackupstatusUtan").set({ role: "superadmin", organisationId: ORG_UTAN });
    const resultat = await funcs.hamtaBackupstatus.run({ data: {}, auth: { uid: "superBackupstatusUtan" } });
    vantaSig(resultat.harOperationsModul === false, "förväntade harOperationsModul: false");
    vantaSig(resultat.senasteDatum === null, "senasteDatum ska vara null");
    vantaSig(resultat.antalBackuper === 0, "antalBackuper ska vara 0");
  });
  await test("hittar det SENASTE datumet bland flera backuper, för rätt organisation", async () => {
    const resultat = await funcs.hamtaBackupstatus.run({ data: {}, auth: { uid: "superBackupstatus" } });
    vantaSig(resultat.harOperationsModul === true, "förväntade harOperationsModul: true");
    vantaSig(resultat.senasteDatum === "2026-08-01", `fel senaste datum: ${resultat.senasteDatum}`);
    vantaSig(resultat.antalBackuper === 2, `fel antal: ${resultat.antalBackuper}`);
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  process.exit(antalMisslyckade > 0 ? 1 : 0);
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
