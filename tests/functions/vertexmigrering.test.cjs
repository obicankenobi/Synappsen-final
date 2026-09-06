// Etapp 72 (Vertex AI-migrering, granskningar/VERTEX-AI-MIGRERING-KOSTNADSUPPSKATTNING-
// 2026-08-30.md): ingen automatiserad test täckte tidigare något av de sex Gemini-
// anropsställena (uttryckligen konstaterat i dokumentet), och det gäller fortfarande – en
// riktig anrops-test kräver Vertex AI-API:et aktiverat och en IAM-roll som bara kan sättas
// i GCP-konsolen (se OPPNA-PUNKTER.md), inte i en emulator.
//
// Det den här filen KAN bevisa mekaniskt: att migreringen faktiskt genomfördes fullt ut och
// inte kan glida tillbaka i tysthet – ingen kvarvarande referens till det gamla, publika
// Gemini API:et eller dess API-nyckel, och att region/projekt-konstanterna som är den
// faktiska databehandlingsgarantin inte ändras utan att någon aktivt gör det.
//
// Körs mot Firestore-emulatorn (samma svit som klinikstodratelimit.test.cjs, av samma skäl):
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore \
//     "node tests/functions/vertexmigrering.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "demo-test";
process.env.GCP_PROJECT = "demo-test";

const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const funcs = require("../../functions/gemensamt.js");

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

const ROT = join(__dirname, "../..");
const las = (p) => readFileSync(join(ROT, p), "utf8");
// gemensamt.js dokumenterar MEDVETET vad som ersattes, med URL:en till det gamla API:et i en
// förklarande kommentar (rad ~65) – det ska stå kvar. Vakten nedan ska bara reagera på att
// KODEN faktiskt anropar det gamla API:et, inte på att någon förklarar historien i en
// kommentar. Rå strippning av //-kommentarer räcker här (ingen av filerna har flerradiga
// /* */-kommentarer kring det som testas).
const utanKommentarer = (text) =>
  text
    .split("\n")
    .filter((rad) => !rad.trim().startsWith("//"))
    .join("\n");

async function main() {
  await test("gemensamt.js exporterar skapaVertexKlient, inte längre GEMINI_API_KEY", () => {
    vantaSig(typeof funcs.skapaVertexKlient === "function", "skapaVertexKlient saknas");
    vantaSig(funcs.GEMINI_API_KEY === undefined, "GEMINI_API_KEY exporteras fortfarande");
  });

  await test("skapaVertexKlient() ger en klient med models.generateContent", () => {
    const klient = funcs.skapaVertexKlient();
    vantaSig(typeof klient.models?.generateContent === "function", "generateContent saknas på klienten");
  });

  await test("regionen är satt (den faktiska databehandlingsgarantin)", () => {
    vantaSig(typeof funcs.VERTEX_REGION === "string" && funcs.VERTEX_REGION.length > 0, "VERTEX_REGION saknas");
    vantaSig(funcs.VERTEX_PROJEKT === "synappsen-final-build", `oväntat projekt: ${funcs.VERTEX_PROJEKT}`);
  });

  await test("inga kvarvarande referenser till det publika Gemini API:et i koden", () => {
    for (const fil of ["functions/ai-import.js", "functions/klinikstod.js", "functions/gemensamt.js"]) {
      const innehall = utanKommentarer(las(fil));
      vantaSig(!innehall.includes("generativelanguage.googleapis.com"), `${fil} anropar fortfarande det publika API:et`);
      vantaSig(!innehall.includes("GoogleGenerativeAI"), `${fil} använder fortfarande @google/generative-ai`);
      vantaSig(!innehall.includes("GEMINI_API_KEY"), `${fil} refererar fortfarande GEMINI_API_KEY`);
    }
  });

  await test("functions/package.json har bytt SDK helt", () => {
    const pkg = JSON.parse(las("functions/package.json"));
    vantaSig(Boolean(pkg.dependencies["@google/genai"]), "@google/genai saknas som beroende");
    vantaSig(!pkg.dependencies["@google/generative-ai"], "@google/generative-ai finns kvar som beroende");
  });

  await test("deploy.yml sätter inte längre GEMINI_API_KEY som secret", () => {
    vantaSig(
      !las(".github/workflows/deploy.yml").includes("GEMINI_API_KEY"),
      "deploy.yml refererar fortfarande GEMINI_API_KEY"
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
