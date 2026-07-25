// Etapp 2 (feature-gating): bevisar att modulkontrollen (kravModul) faktiskt nekar
// när Intelligence är avstängd, och tillåter när den är påslagen – samt att den sitter
// på RÄTT PLATS i tolkaForradsbild (nekar med failed-precondition innan något Storage-/
// Gemini-anrop görs, även vid ett direktanrop mot funktionen). Körs mot Firestore-emulatorn:
//
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/functions/modulgating.test.cjs"
//
// kravModul testas direkt (inte bara indirekt via ett helt tolkaForradsbild-anrop) för att
// undvika ett långsamt/instabilt test som annars skulle behöva låta anropet nå riktig
// Storage/Gemini för att bevisa att det INTE stoppades av modulkontrollen.
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
  await db.collection("organisationer").doc("orgUtanIntelligence").set({
    namn: "Utan Intelligence",
    moduler: { operations: true, intelligence: false },
  });
  await db.collection("organisationer").doc("orgMedIntelligence").set({
    namn: "Med Intelligence",
    moduler: { operations: true, intelligence: true },
  });
  await db.collection("organisationer").doc("orgUtanModulerFalt").set({
    namn: "Saknar moduler-fält helt",
  });
  await db.collection("users").doc("uidUtan").set({
    role: "vol",
    organisationId: "orgUtanIntelligence",
  });

  console.log("\nkravModul – direkt");
  await test("nekar (failed-precondition) när modulen är avstängd", async () => {
    try {
      await funcs.kravModul("orgUtanIntelligence", "intelligence", "AI-import kräver Intelligence-modulen.");
      throw new Error("förväntade fel, fick inget");
    } catch (fel) {
      vantaSig(fel.code === "failed-precondition", `fel kod: ${fel.code}`);
    }
  });
  await test("nekar när organisationen helt saknar moduler-fältet (fail closed, inte fail open)", async () => {
    try {
      await funcs.kravModul("orgUtanModulerFalt", "intelligence", "x");
      throw new Error("förväntade fel, fick inget");
    } catch (fel) {
      vantaSig(fel.code === "failed-precondition", `fel kod: ${fel.code}`);
    }
  });
  await test("tillåter (kastar inget) när modulen är påslagen", () =>
    funcs.kravModul("orgMedIntelligence", "intelligence", "x")
  );

  console.log("\ntolkaForradsbild – modulkontrollen sitter på rätt plats i det riktiga anropet");
  await test("nekas med failed-precondition INNAN Storage/Gemini nås, även vid direktanrop", async () => {
    try {
      await funcs.tolkaForradsbild.run({
        data: { storagePath: "inkommande/uidUtan/bild.jpg", forrad: "Engångsförrådet" },
        auth: { uid: "uidUtan" },
      });
      throw new Error("förväntade fel, fick inget");
    } catch (fel) {
      vantaSig(
        fel.code === "failed-precondition",
        `fick fel kod ${fel.code} istället för failed-precondition (${fel.message}) – om detta är ett Storage-/Gemini-relaterat fel sitter kontrollen på fel plats`
      );
    }
  });

  console.log("\ntolkaDokument – modulkontrollen sitter på rätt plats i det riktiga anropet");
  await test("nekas med failed-precondition INNAN Storage/Gemini nås, även vid direktanrop", async () => {
    try {
      await funcs.tolkaDokument.run({
        data: { storagePath: "inkommande/uidUtan/bild.jpg", omrade: "kliniskt-stod" },
        auth: { uid: "uidUtan" },
      });
      throw new Error("förväntade fel, fick inget");
    } catch (fel) {
      vantaSig(
        fel.code === "failed-precondition",
        `fick fel kod ${fel.code} istället för failed-precondition (${fel.message}) – om detta är ett Storage-/Gemini-relaterat fel sitter kontrollen på fel plats`
      );
    }
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
