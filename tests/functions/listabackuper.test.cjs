// Etapp L1n (intern/ETAPPLAN-INTERN-1.md): listaBackuper. Klienten kan inte lista
// backups/{orgId}/ själv (storage.rules: `allow read, write: if false`) – det här är den
// enda vägen in, och returnerar MEDVETET bara datum och storlek, aldrig innehåll (krav 13).
//
// Körs mot Firestore- OCH Storage-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage \
//     "node tests/functions/listabackuper.test.cjs"
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
  if (!villkor) throw new Error(meddelande);
}

async function forvantaFel(kod, lofte) {
  try {
    await lofte();
    throw new Error(`Förväntade felkod "${kod}" men anropet lyckades`);
  } catch (fel) {
    vantaSig(fel.code === kod, `Förväntade felkod "${kod}", fick "${fel.code}": ${fel.message}`);
  }
}

async function main() {
  await db.collection("users").doc("vanligSuperL1n").set({ role: "superadmin", organisationId: "orgL1n" });
  await db.collection("plattformsadmin").doc("levL1n").set({ blevPlattformsadmin: Date.now() });

  await bucket.file("backups/orgL1n/2026-06-01.json").save(JSON.stringify({ orgId: "orgL1n", samlingar: {} }));
  await bucket.file("backups/orgL1n/2026-07-01.json").save(JSON.stringify({ orgId: "orgL1n", samlingar: { rutiner: [1, 2, 3] } }));
  // En ANNAN organisations backup – ska inte synas i orgL1n:s lista.
  await bucket.file("backups/enAnnanOrg/2026-07-01.json").save(JSON.stringify({ orgId: "enAnnanOrg", samlingar: {} }));

  console.log("\nlistaBackuper");
  await test("en icke-plattformsadmin kan INTE lista", () =>
    forvantaFel("permission-denied", () =>
      funcs.listaBackuper.run({ data: { orgId: "orgL1n" }, auth: { uid: "vanligSuperL1n" } })
    )
  );

  await test("saknat orgId ger invalid-argument", () =>
    forvantaFel("invalid-argument", () => funcs.listaBackuper.run({ data: {}, auth: { uid: "levL1n" } }))
  );

  await test("en plattformsadmin ser BARA den angivna organisationens backuper, senast först", async () => {
    const resultat = await funcs.listaBackuper.run({ data: { orgId: "orgL1n" }, auth: { uid: "levL1n" } });
    vantaSig(resultat.backuper.length === 2, `förväntade 2 backuper, fick ${resultat.backuper.length}`);
    vantaSig(resultat.backuper[0].datum === "2026-07-01", "senaste backupen borde vara först");
    vantaSig(resultat.backuper[1].datum === "2026-06-01", "äldsta backupen borde vara sist");
  });

  await test("innehåller storlek men ALDRIG dokumentinnehåll (krav 13)", async () => {
    const resultat = await funcs.listaBackuper.run({ data: { orgId: "orgL1n" }, auth: { uid: "levL1n" } });
    for (const backup of resultat.backuper) {
      vantaSig(typeof backup.storlekBytes === "number" && backup.storlekBytes > 0, "storlekBytes saknas eller är fel typ");
      vantaSig(!("samlingar" in backup) && !("innehall" in backup), "backupen läckte innehåll");
    }
  });

  await test("en organisation utan backuper ger en tom lista, kraschar inte", async () => {
    const resultat = await funcs.listaBackuper.run({ data: { orgId: "orgUtanBackup" }, auth: { uid: "levL1n" } });
    vantaSig(resultat.backuper.length === 0, "förväntade en tom lista");
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
