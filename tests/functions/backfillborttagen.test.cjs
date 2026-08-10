// Etapp 60c (ETAPPLAN12.md): bevisar att backfillaBorttagenFalt (Cloud Function, se
// functions/index.js) gör vad den ska innan useRutiner.js:s klientfråga börjar filtrera
// server-side med where("borttagen", "==", false) – idempotent, dry-run-först, rör bara
// dokument som verkligen saknar fältet, lämnar redan satta värden (true ELLER false) orörda.
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/functions/backfillborttagen.test.cjs"
//
// VIKTIGT för placeringen i test:functions-kedjan (package.json): den skarpa körningen
// (dryRun:false) skriver borttagen:false på VARJE rutin i HELA collectionen som saknar
// fältet – inte bara testets egna, eftersom migreringen är medvetet global (se
// functions/index.js). Måste därför stå SIST i kedjan, annars kan den tysta ändra data som
// en tidigare testfil redan hunnit asserta på.
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
  await db.collection("plattformsadmin").doc("levBorttagen60c").set({ blevPlattformsadmin: true });
  await db.collection("users").doc("volBorttagen60c").set({ role: "vol", organisationId: "orgX" });

  console.log("\nBehörighet");
  await test("Anropas utan inloggning ger unauthenticated", async () => {
    try {
      await funcs.backfillaBorttagenFalt.run({ data: { dryRun: true }, auth: undefined });
      throw new Error("förväntade fel, fick inget");
    } catch (fel) {
      vantaSig(fel.code === "unauthenticated", `fel kod: ${fel.code}`);
    }
  });
  await test("Anropas av en vanlig (icke-plattformsadmin) användare ger permission-denied", async () => {
    try {
      await funcs.backfillaBorttagenFalt.run({ data: { dryRun: true }, auth: { uid: "volBorttagen60c" } });
      throw new Error("förväntade fel, fick inget");
    } catch (fel) {
      vantaSig(fel.code === "permission-denied", `fel kod: ${fel.code}`);
    }
  });

  // Migreringen frågar HELA rutiner-collectionen (medvetet, ingen organisationId-avgränsning
  // – ett globalt schemafix, inte ett per-kund-fix), och testsviten delar EN emulator-
  // instans mellan alla ~30 testfiler i tests/functions/test:functions-kedjan. Den absoluta
  // totalen är därför inte deterministisk härifrån – räkna en DELTA mot ett nollpunktsvärde
  // istället för att anta en tom collection.
  const nollpunkt = await funcs.backfillaBorttagenFalt.run({ data: {}, auth: { uid: "levBorttagen60c" } });

  // Två rutiner helt UTAN fältet (pre-Etapp-60c-läge), en som redan är satt till true (en
  // riktig papperskorgspost – ska INTE ändras), en som redan är satt till false (redan
  // migrerad – ska räknas som "klar", inte skrivas om).
  await db.collection("rutiner").doc("borttagen60cSaknas1").set({ titel: "Saknar fältet 1" });
  await db.collection("rutiner").doc("borttagen60cSaknas2").set({ titel: "Saknar fältet 2" });
  await db.collection("rutiner").doc("borttagen60cRedanTrue").set({ titel: "Redan i papperskorgen", borttagen: true });
  await db.collection("rutiner").doc("borttagen60cRedanFalse").set({ titel: "Redan migrerad", borttagen: false });

  console.log("\nDry-run (standard) – ska INTE skriva något");
  const dryRunResultat = await funcs.backfillaBorttagenFalt.run({
    data: {},
    auth: { uid: "levBorttagen60c" },
  });
  await test("dryRun är sant som standard", () => vantaSig(dryRunResultat.dryRun === true, JSON.stringify(dryRunResultat)));
  await test("dry-run räknar EXAKT 2 fler än nollpunkten (bara de två nya som saknar fältet)", () =>
    vantaSig(
      dryRunResultat.saknarBorttagenFalt === nollpunkt.saknarBorttagenFalt + 2,
      `nollpunkt=${nollpunkt.saknarBorttagenFalt}, efteråt=${dryRunResultat.saknarBorttagenFalt}`
    )
  );
  await test("dry-run har INTE skrivit fältet på borttagen60cSaknas1", async () => {
    const doc = await db.collection("rutiner").doc("borttagen60cSaknas1").get();
    vantaSig(doc.data().borttagen === undefined, JSON.stringify(doc.data()));
  });

  console.log("\nSkarp körning (dryRun:false)");
  const skarpResultat = await funcs.backfillaBorttagenFalt.run({
    data: { dryRun: false },
    auth: { uid: "levBorttagen60c" },
  });
  await test("skarpResultat.dryRun är false", () => vantaSig(skarpResultat.dryRun === false, ""));
  await test("de två som saknade fältet har nu borttagen: false", async () => {
    const a = await db.collection("rutiner").doc("borttagen60cSaknas1").get();
    const b = await db.collection("rutiner").doc("borttagen60cSaknas2").get();
    vantaSig(a.data().borttagen === false && b.data().borttagen === false, JSON.stringify([a.data(), b.data()]));
  });
  await test("en riktig papperskorgspost (borttagen:true) rördes INTE", async () => {
    const doc = await db.collection("rutiner").doc("borttagen60cRedanTrue").get();
    vantaSig(doc.data().borttagen === true, JSON.stringify(doc.data()));
  });
  await test("en redan migrerad rutin (borttagen:false) rördes INTE (samma värde ändå)", async () => {
    const doc = await db.collection("rutiner").doc("borttagen60cRedanFalse").get();
    vantaSig(doc.data().borttagen === false, JSON.stringify(doc.data()));
  });

  console.log("\nIdempotens – köra igen ska visa 0 kvarvarande (skarpa körningen fixade ALLT, inte bara testets egna poster)");
  const andraKorningen = await funcs.backfillaBorttagenFalt.run({
    data: { dryRun: true },
    auth: { uid: "levBorttagen60c" },
  });
  await test("en andra (dry-run-)körning visar 0 kvarvarande i HELA collectionen", () =>
    vantaSig(
      andraKorningen.saknarBorttagenFalt === 0,
      `förväntade 0, fick ${andraKorningen.saknarBorttagenFalt}`
    )
  );

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  if (antalMisslyckade > 0) {
    process.exit(1);
  }
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
