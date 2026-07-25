// Etapp 5: bevisar att reserveraBudget arkiverar föregående månads slutliga förbrukning till
// organisationer/{orgId}/kostnadshistorik/{manad} INNAN den nollställer budgeten vid ett
// månadsskifte, och att den INTE arkiverar något vid en vanlig reservation samma månad.
// Körs mot Firestore-emulatorn:
//
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore \
//     "node tests/functions/kostnadshistorik.test.cjs"
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
  console.log("\nreserveraBudget – arkivering vid månadsskifte");
  await test("arkiverar INTE något vid en vanlig reservation (första gången, ingen tidigare månad)", async () => {
    await funcs.reserveraBudget("orgFörstaGången", "uid1");
    const historikSnap = await db
      .collection("organisationer")
      .doc("orgFörstaGången")
      .collection("kostnadshistorik")
      .get();
    vantaSig(historikSnap.empty, `förväntade ingen historik, fick ${historikSnap.size} dokument`);
  });

  await db
    .collection("organisationer")
    .doc("orgGammalManad")
    .collection("installningar")
    .doc("geminiBudget")
    .set({
      anvantOre: 1234,
      aktuellManad: "2020-01",
      taketOre: 20000,
      anvantPerUid: { uidA: 600, uidB: 634 },
    });

  await test("arkiverar föregående månads slutsumma vid ett månadsskifte", async () => {
    await funcs.reserveraBudget("orgGammalManad", "uid1");
    const historikDoc = await db
      .collection("organisationer")
      .doc("orgGammalManad")
      .collection("kostnadshistorik")
      .doc("2020-01")
      .get();
    vantaSig(historikDoc.exists, "historikdokumentet för 2020-01 skapades inte");
    const data = historikDoc.data();
    vantaSig(data.anvantOre === 1234, `anvantOre: ${data.anvantOre}`);
    vantaSig(data.antalAnvandare === 2, `antalAnvandare: ${data.antalAnvandare}`);
  });

  await test("nollställer och sätter den nya månaden i själva budgetdokumentet", async () => {
    const budgetDoc = await db
      .collection("organisationer")
      .doc("orgGammalManad")
      .collection("installningar")
      .doc("geminiBudget")
      .get();
    const data = budgetDoc.data();
    vantaSig(data.aktuellManad !== "2020-01", "aktuellManad nollställdes inte till den nya månaden");
    vantaSig(data.anvantOre === 50, `anvantOre efter nollställning: ${data.anvantOre}`);
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
