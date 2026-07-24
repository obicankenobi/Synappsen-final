// Bevisar att migreraTillOrganisation (Cloud Function, se functions/index.js) faktiskt gör
// vad ETAPP1-ARBETSUPPGIFTER.md block 1b beskriver: idempotent, dry-run-först migrering av
// organisationId på befintlig data. Körs mot Firestore-emulatorn (ingen riktig Firebase-
// inloggning behövs) via:
//
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/functions/migrering.test.cjs"
//
// Anropar den exporterade funktionens .run() direkt (samma tekniken som firebase-functions
// v2 själv exponerar för enhetstester) istället för att gå via HTTP – det ger oss den
// faktiska affärslogiken (db-läsning/skrivning, superadmin-kontroll, dry-run-spärr) utan att
// behöva sätta upp functions-emulatorn och en riktig auth-token.
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "demo-test";
process.env.GCP_PROJECT = "demo-test";

// firebase-admin är installerat under functions/node_modules (egen package.json där), inte
// i repots rot-node_modules – hämta samma admin-instans som functions/index.js använder.
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
  // Seed: data helt UTAN organisationId (simulerar pre-Etapp-1-läge), plus en handfull
  // dokument som redan HAR fältet (ska lämnas orörda av idempotensen).
  await db.collection("users").doc("superadminX").set({ role: "superadmin" });
  await db.collection("users").doc("volX").set({ role: "vol" });
  await db.collection("rutiner").doc("rutinX1").set({ titel: "X1", omrade: "kliniskt-stod" });
  await db.collection("rutiner").doc("rutinX2").set({ titel: "X2", omrade: "kliniskt-stod" });
  await db
    .collection("rutiner")
    .doc("rutinRedanMigrerad")
    .set({ titel: "Redan migrerad", omrade: "logistik", organisationId: "annan-org" });
  await db.collection("anslag").doc("anslagX").set({ titel: "Anslag X" });
  await db.collection("kontakter").doc("kontaktX").set({ namn: "Kontakt X" });

  console.log("\nBehörighet");
  await test("Anropas utan inloggning ger unauthenticated", async () => {
    try {
      await funcs.migreraTillOrganisation.run({ data: { dryRun: true }, auth: undefined });
      throw new Error("förväntade fel, fick inget");
    } catch (fel) {
      vantaSig(fel.code === "unauthenticated", `fel kod: ${fel.code}`);
    }
  });
  await test("Anropas av icke-superadmin (volX) ger permission-denied", async () => {
    try {
      await funcs.migreraTillOrganisation.run({
        data: { dryRun: true },
        auth: { uid: "volX" },
      });
      throw new Error("förväntade fel, fick inget");
    } catch (fel) {
      vantaSig(fel.code === "permission-denied", `fel kod: ${fel.code}`);
    }
  });

  console.log("\nDry-run (standard) – ska INTE skriva något");
  const dryRunResultat = await funcs.migreraTillOrganisation.run({
    data: {},
    auth: { uid: "superadminX" },
  });
  await test("dryRun är sant som standard (data:{} utan dryRun-fält)", () =>
    vantaSig(dryRunResultat.dryRun === true, JSON.stringify(dryRunResultat))
  );
  await test("dry-run räknar rutiner korrekt (2 saknar fältet, 1 har det redan)", () =>
    vantaSig(
      dryRunResultat.resultat.rutiner.totalt === 3 &&
        dryRunResultat.resultat.rutiner.saknarOrganisationId === 2,
      JSON.stringify(dryRunResultat.resultat.rutiner)
    )
  );
  await test("dry-run räknar users korrekt (2 saknar fältet)", () =>
    vantaSig(
      dryRunResultat.resultat.users.totalt === 2 &&
        dryRunResultat.resultat.users.saknarOrganisationId === 2,
      JSON.stringify(dryRunResultat.resultat.users)
    )
  );
  await test("dry-run har INTE skrivit organisationId på rutinX1", async () => {
    const doc = await db.collection("rutiner").doc("rutinX1").get();
    vantaSig(doc.data().organisationId === undefined, JSON.stringify(doc.data()));
  });
  await test("dry-run har INTE skapat organisationer/default", async () => {
    const doc = await db.collection("organisationer").doc("default").get();
    vantaSig(!doc.exists, "organisationer/default fanns redan innan skarp körning");
  });

  console.log("\nSkarp körning (dryRun:false)");
  const skarpResultat = await funcs.migreraTillOrganisation.run({
    data: { dryRun: false },
    auth: { uid: "superadminX" },
  });
  await test("skarpResultat.dryRun är false", () => vantaSig(skarpResultat.dryRun === false, ""));
  await test("organisationer/default skapades med förväntade fält", async () => {
    const doc = await db.collection("organisationer").doc("default").get();
    const data = doc.data();
    vantaSig(
      doc.exists &&
        data.status === "active" &&
        data.plan === "core" &&
        data.moduler?.operations === true &&
        data.moduler?.intelligence === true,
      JSON.stringify(data)
    );
  });
  await test("rutinX1 och rutinX2 har nu organisationId = default", async () => {
    const x1 = await db.collection("rutiner").doc("rutinX1").get();
    const x2 = await db.collection("rutiner").doc("rutinX2").get();
    vantaSig(
      x1.data().organisationId === "default" && x2.data().organisationId === "default",
      JSON.stringify([x1.data(), x2.data()])
    );
  });
  await test("rutinRedanMigrerad rördes INTE (behåller organisationId = annan-org)", async () => {
    const doc = await db.collection("rutiner").doc("rutinRedanMigrerad").get();
    vantaSig(doc.data().organisationId === "annan-org", JSON.stringify(doc.data()));
  });
  await test("superadminX och volX har nu organisationId = default", async () => {
    const a = await db.collection("users").doc("superadminX").get();
    const b = await db.collection("users").doc("volX").get();
    vantaSig(
      a.data().organisationId === "default" && b.data().organisationId === "default",
      JSON.stringify([a.data(), b.data()])
    );
  });
  await test("anslagX och kontaktX har nu organisationId = default", async () => {
    const a = await db.collection("anslag").doc("anslagX").get();
    const b = await db.collection("kontakter").doc("kontaktX").get();
    vantaSig(
      a.data().organisationId === "default" && b.data().organisationId === "default",
      JSON.stringify([a.data(), b.data()])
    );
  });

  console.log("\nIdempotens – köra igen ska vara en no-op");
  const andraKorningen = await funcs.migreraTillOrganisation.run({
    data: { dryRun: true },
    auth: { uid: "superadminX" },
  });
  await test("en andra (dry-run-)körning visar 0 kvarvarande utan organisationId överallt", () => {
    const allaNoll = Object.values(andraKorningen.resultat).every(
      (r) => r.saknarOrganisationId === 0
    );
    vantaSig(allaNoll, JSON.stringify(andraKorningen.resultat));
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
