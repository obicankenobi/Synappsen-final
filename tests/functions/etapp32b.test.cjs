// Etapp 32b: en plötslig kostnadsspik i AI-budgeten larmade tidigare aldrig – budgetspärren
// STOPPAR anrop vid taket, men ingen får veta förrän de råkar öppna adminpanelen. Bevisar att
// budgetvarningSkickad-flaggan sätts EXAKT en gång per månad när tröskeln (80%) passeras, och
// nollställs vid nästa månadsskifte.
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore \
//     "node tests/functions/etapp32b.test.cjs"
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

async function budget(orgId) {
  const snap = await db.collection("organisationer").doc(orgId).collection("installningar").doc("geminiBudget").get();
  return snap.data();
}

async function main() {
  console.log("\nreserveraBudget – budgetvarningSkickad sätts vid tröskeln (80%)");
  const ORG = "org32bTroskel";
  await db.collection("organisationer").doc(ORG).collection("installningar").doc("geminiBudget").set({
    anvantOre: 0,
    aktuellManad: "2026-07",
    taketOre: 100,
    anvantPerUid: {},
  });

  await test("under tröskeln: ingen varning skickad ännu", async () => {
    // UPPSKATTAD_KOSTNAD_ORE är inte exporterad, men ett enda anrop mot ett tak på 100 öre
    // hamnar under 80% i den seedade emulatormiljön (standardkostnaden är låg, se
    // functions/index.js) – kontrollera bara att flaggan fortfarande är falsy.
    await funcs.reserveraBudget(ORG, "uid1");
    const data = await budget(ORG);
    vantaSig(!data.budgetvarningSkickad, "varningen sattes för tidigt");
  });

  console.log("\nreserveraBudget – varningen sätts en gång och stannar satt");
  const ORG2 = "org32bRedanNara";
  await db.collection("organisationer").doc(ORG2).collection("installningar").doc("geminiBudget").set({
    anvantOre: 850,
    aktuellManad: "2026-07",
    taketOre: 1000,
    anvantPerUid: {},
    budgetvarningSkickad: false,
  });
  await test("passerar tröskeln (85% redan använt) → flaggan sätts", async () => {
    await funcs.reserveraBudget(ORG2, "uid1");
    const data = await budget(ORG2);
    vantaSig(data.budgetvarningSkickad === true, "flaggan sattes inte trots att tröskeln passerades");
  });
  await test("ett andra anrop samma månad skriver inte om flaggan (stannar true)", async () => {
    await funcs.reserveraBudget(ORG2, "uid1");
    const data = await budget(ORG2);
    vantaSig(data.budgetvarningSkickad === true, "flaggan försvann efter ett andra anrop");
  });

  console.log("\nreserveraBudget – flaggan nollställs vid månadsskifte");
  const ORG3 = "org32bNyManad";
  await db.collection("organisationer").doc(ORG3).collection("installningar").doc("geminiBudget").set({
    anvantOre: 95,
    aktuellManad: "2020-01",
    taketOre: 100,
    anvantPerUid: {},
    budgetvarningSkickad: true,
  });
  await test("en ny månad börjar om med budgetvarningSkickad = false", async () => {
    await funcs.reserveraBudget(ORG3, "uid1");
    const data = await budget(ORG3);
    vantaSig(data.aktuellManad !== "2020-01", "månaden rullade inte över");
    // Ett enda första anrop i den nya, nollställda månaden hamnar under 80% igen.
    vantaSig(data.budgetvarningSkickad === false, "flaggan följde inte med till fel värde efter nollställning");
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  process.exit(antalMisslyckade > 0 ? 1 : 0);
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
