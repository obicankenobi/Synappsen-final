// Etapp 7c (gating-härdning): en samlad matris över VARJE Cloud Function som ska kräva en
// betald modul, körd som en enda datadriven testsvit istället för att lita på att varje ny
// gatad funktion får ett eget handskrivet test (det är precis så fragaKlinisktStod glömdes
// bort vid Etapp 2 – se ETAPPLAN2.md). Matrisen har två delar:
//
//   1. Ett STATISKT check: läser functions/index.js som text och hittar automatiskt varje
//      `exports.X = onCall(...)`-block som anropar kravModul(...) någonstans i sin kropp.
//      Om en ny sådan funktion läggs till i produktionskoden men inte i MATRIS nedan,
//      FALLERAR testet – det går inte att tyst glömma bort en funktion i matrisen.
//   2. Ett dynamiskt check: för varje rad i MATRIS, anropar den riktiga funktionen mot en
//      organisation som saknar modulen och verifierar failed-precondition INNAN något
//      externt anrop (Storage/Gemini/sökmotor) kan ha skett.
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/functions/gatingmatris.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "demo-test";
process.env.GCP_PROJECT = "demo-test";

const fs = require("node:fs");
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

// Den faktiska matrisen: varje funktion som ska vara modulgated, vilken modul den kräver,
// och ett minimalt (annars ogiltigt) anrop som räcker för att bevisa VAR i funktionen
// kontrollen sitter – den ska aldrig nå Storage/Gemini/sökmotorn.
const MATRIS = [
  {
    namn: "tolkaForradsbild",
    modul: "intelligence",
    anropa: (uid) =>
      funcs.tolkaForradsbild.run({
        data: { storagePath: `inkommande/${uid}/bild.jpg`, forrad: "Engångsförrådet" },
        auth: { uid },
      }),
  },
  {
    namn: "tolkaDokument",
    modul: "intelligence",
    anropa: (uid) =>
      funcs.tolkaDokument.run({
        data: { storagePath: `inkommande/${uid}/bild.jpg`, omrade: "kliniskt-stod" },
        auth: { uid },
      }),
  },
  {
    namn: "fragaKlinisktStod",
    modul: "intelligence",
    anropa: (uid) =>
      funcs.fragaKlinisktStod.run({
        data: { fraga: "Dosering amoxicillin vuxen" },
        auth: { uid },
      }),
  },
];

// Statiskt check: hitta varje `exports.X = onCall(` i källkoden vars kropp innehåller ett
// kravModul(...)-anrop, och kräv att X finns i MATRIS ovan.
function hittaGatadeFunktionerICallkoden() {
  const kalla = fs.readFileSync(path.join(__dirname, "../../functions/index.js"), "utf8");
  const gatade = [];
  const exportRegex = /exports\.(\w+)\s*=\s*onCall\(/g;
  let match;
  while ((match = exportRegex.exec(kalla))) {
    const startIndex = match.index;
    // Hitta blockets ungefärliga slut: nästa `exports.` (eller filslut).
    const nastaExport = kalla.indexOf("\nexports.", startIndex + 1);
    const block = kalla.slice(startIndex, nastaExport === -1 ? kalla.length : nastaExport);
    if (block.includes("kravModul(")) {
      gatade.push(match[1]);
    }
  }
  return gatade;
}

async function main() {
  await test("statisk matris: alla kravModul-gatade exports i index.js finns med i MATRIS", () => {
    const gatade = hittaGatadeFunktionerICallkoden();
    const iMatris = new Set(MATRIS.map((r) => r.namn));
    const saknas = gatade.filter((namn) => !iMatris.has(namn));
    vantaSig(
      saknas.length === 0,
      `dessa gatade funktioner finns i koden men saknas i MATRIS (uppdatera gatingmatris.test.cjs): ${saknas.join(", ")}`
    );
  });

  for (const rad of MATRIS) {
    const orgId = `orgUtan_${rad.namn}`;
    const uid = `uid_${rad.namn}`;
    await db.collection("organisationer").doc(orgId).set({
      namn: `Saknar ${rad.modul}`,
      moduler: { [rad.modul]: false },
    });
    await db.collection("users").doc(uid).set({ role: "vol", organisationId: orgId });

    console.log(`\n${rad.namn} (kräver ${rad.modul})`);
    await test(
      `nekas med failed-precondition INNAN externt anrop, även vid direktanrop (org saknar ${rad.modul})`,
      async () => {
        try {
          await rad.anropa(uid);
          throw new Error("förväntade fel, fick inget");
        } catch (fel) {
          vantaSig(
            fel.code === "failed-precondition",
            `fick fel kod ${fel.code} istället för failed-precondition (${fel.message}) – kontrollen sitter på fel plats eller saknas`
          );
        }
      }
    );
  }

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  if (antalMisslyckade > 0) {
    process.exit(1);
  }
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
