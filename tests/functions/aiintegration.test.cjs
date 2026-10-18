// Fynd 3, 7 och 8 (granskningar/AI-INTEGRATIONSRISKER-2026-09-06.md). Bevisar:
//  - Fynd 8: en reserverad budget återbetalas när modellen inte levererar ett svar, men INTE
//    när ett svar levererats och sedan kasseras (det har kostat på riktigt).
//  - Fynd 7: varje lyckad reservation lämnar en spårbarhetspost UTAN prompt/bild/innehåll,
//    och ett budgetnekat anrop lämnar ingen.
//  - Fynd 3: gallraAiData() raderar gammalt men rör nytt, och bara i de tre collectionerna.
// Körs mot Firestore-emulatorn:
//
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore \
//     "node tests/functions/aiintegration.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "demo-test";
process.env.GCP_PROJECT = "demo-test";

const path = require("node:path");
const funcDir = path.join(__dirname, "../../functions");
const admin = require(require.resolve("firebase-admin", { paths: [funcDir] }));
const genai = require(require.resolve("@google/genai", { paths: [funcDir] }));

// Ersätter Vertex-klienten INNAN functions/ laddas (gemensamt.js destrukturerar GoogleGenAI
// vid inläsning). Beteendet styrs per test via `nastaSvar`.
let nastaSvar = null;
genai.GoogleGenAI = class {
  constructor() {
    this.models = {
      generateContent: async () => {
        if (nastaSvar instanceof Error) throw nastaSvar;
        return { text: nastaSvar };
      },
    };
  }
};

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
  if (!villkor) throw new Error(meddelande);
}

async function budget(orgId) {
  const snap = await db.collection("organisationer").doc(orgId).collection("installningar").doc("geminiBudget").get();
  return snap.data() ?? { anvantOre: 0, anvantPerUid: {} };
}

async function loggFor(orgId) {
  const snap = await db.collection("aiAnropslogg").where("organisationId", "==", orgId).get();
  return snap.docs.map((d) => d.data());
}

async function skapaOrg(orgId, uid) {
  await db.collection("organisationer").doc(orgId).set({ moduler: { intelligence: true } });
  await db.collection("users").doc(uid).set({ role: "vol", organisationId: orgId });
}

async function main() {
  console.log("\nFynd 7 – spårbarhetspost per AI-anrop");
  await test("en lyckad reservation loggar organisation, uid, funktion och tid – inget annat", async () => {
    await funcs.reserveraBudget("orgLogg", "uidLogg", "fragaKlinisktStod");
    const poster = await loggFor("orgLogg");
    vantaSig(poster.length === 1, `förväntade 1 post, fick ${poster.length}`);
    const nycklar = Object.keys(poster[0]).sort().join(",");
    vantaSig(nycklar === "funktion,organisationId,tidpunkt,uid", `oväntade fält: ${nycklar}`);
    vantaSig(poster[0].funktion === "fragaKlinisktStod" && poster[0].uid === "uidLogg", "fel innehåll");
  });
  await test("en reservation utan funktionsnamn loggar inget (bakåtkompatibelt anrop)", async () => {
    await funcs.reserveraBudget("orgUtanNamn", "uidX");
    vantaSig((await loggFor("orgUtanNamn")).length === 0, "en post skrevs utan funktionsnamn");
  });
  await test("ett anrop som nekas av budgetspärren loggas INTE (det nådde aldrig Google)", async () => {
    await db.collection("organisationer").doc("orgSlut").collection("installningar").doc("geminiBudget")
      .set({ anvantOre: 100, taketOre: 100, aktuellManad: new Date().toISOString().slice(0, 7), anvantPerUid: {} });
    let kastade = false;
    try { await funcs.reserveraBudget("orgSlut", "uidY", "tolkaDokument"); } catch { kastade = true; }
    vantaSig(kastade, "förväntade att spärren kastade");
    vantaSig((await loggFor("orgSlut")).length === 0, "ett nekat anrop loggades");
  });

  console.log("\nFynd 8 – återbetalning av budget");
  await test("aterbetalaBudget ger tillbaka exakt en reservation, totalt och per användare", async () => {
    await funcs.reserveraBudget("orgAter", "uidA");
    await funcs.reserveraBudget("orgAter", "uidA");
    await funcs.aterbetalaBudget("orgAter", "uidA");
    const b = await budget("orgAter");
    vantaSig(b.anvantOre === funcs.UPPSKATTAD_KOSTNAD_ORE, `anvantOre: ${b.anvantOre}`);
    vantaSig(b.anvantPerUid.uidA === funcs.UPPSKATTAD_KOSTNAD_ORE, `per uid: ${b.anvantPerUid.uidA}`);
  });
  await test("aterbetalaBudget kan aldrig ge ett negativt saldo", async () => {
    await funcs.aterbetalaBudget("orgAter", "uidA");
    await funcs.aterbetalaBudget("orgAter", "uidA");
    const b = await budget("orgAter");
    vantaSig(b.anvantOre === 0 && b.anvantPerUid.uidA === 0, `${b.anvantOre}/${b.anvantPerUid.uidA}`);
  });
  await test("aterbetalaBudget på en organisation utan budgetdokument gör ingenting och kastar inte", async () => {
    await funcs.aterbetalaBudget("orgIngenBudget", "uidZ");
  });

  console.log("\nFynd 8 – end-to-end genom foreslaKvissfragor");
  await skapaOrg("orgKviss", "uidKviss");
  const anrop = () => funcs.foreslaKvissfragor.run({ data: { innehall: "Spola kanylen med natriumklorid före och efter." }, auth: { uid: "uidKviss" } });
  await test("ett Vertex-fel (503) lämnar budgeten som den var", async () => {
    nastaSvar = Object.assign(new Error("overloaded"), { status: 503 });
    let kastade = false;
    try { await anrop(); } catch { kastade = true; }
    vantaSig(kastade, "förväntade ett fel");
    const b = await budget("orgKviss");
    vantaSig(b.anvantOre === 0, `anvantOre efter misslyckat anrop: ${b.anvantOre}`);
  });
  await test("ett lyckat anrop kostar en reservation och loggas som foreslaKvissfragor", async () => {
    nastaSvar = JSON.stringify({ fragor: [{ fraga: "Vad spolar man med?", alternativ: ["NaCl", "Vatten"], rattIndex: 0, hanvisning: "Spola kanylen" }] });
    await anrop();
    const b = await budget("orgKviss");
    vantaSig(b.anvantOre === funcs.UPPSKATTAD_KOSTNAD_ORE, `anvantOre: ${b.anvantOre}`);
    const poster = (await loggFor("orgKviss")).filter((p) => p.funktion === "foreslaKvissfragor");
    vantaSig(poster.length === 2, `förväntade 2 loggposter (båda anropen nådde reservationen), fick ${poster.length}`);
  });
  await test("ett svar som levererats men kasseras (personnummer) återbetalas INTE", async () => {
    const fore = (await budget("orgKviss")).anvantOre;
    nastaSvar = JSON.stringify({ fragor: [{ fraga: "Patient 900101-0017?", alternativ: ["a", "b"], rattIndex: 0, hanvisning: "x" }] });
    await anrop(); // personnummerfrågan filtreras bort, anropet lyckas med tom lista
    const efter = (await budget("orgKviss")).anvantOre;
    vantaSig(efter === fore + funcs.UPPSKATTAD_KOSTNAD_ORE, `före ${fore}, efter ${efter}`);
  });

  console.log("\nFynd 3 – gallraAiData()");
  const { Timestamp } = require(require.resolve("firebase-admin/firestore", { paths: [funcDir] }));
  const dagarSedan = (d) => Timestamp.fromMillis(Date.now() - d * 24 * 60 * 60 * 1000);
  await db.collection("klinikfrageloggar").doc("gammal").set({ fraga: "x", organisationId: "o", tidpunkt: dagarSedan(100) });
  await db.collection("klinikfrageloggar").doc("ny").set({ fraga: "x", organisationId: "o", tidpunkt: dagarSedan(10) });
  await db.collection("klinikfrageloggar").doc("pagransen").set({ fraga: "x", organisationId: "o", tidpunkt: dagarSedan(89) });
  await db.collection("klinikfragecache").doc("gammalCache").set({ svar: "x", skapad: dagarSedan(8) });
  await db.collection("klinikfragecache").doc("nyCache").set({ svar: "x", skapad: dagarSedan(6) });
  await db.collection("aiAnropslogg").doc("gammalAnrop").set({ organisationId: "o", uid: "u", funktion: "f", tidpunkt: dagarSedan(100) });
  await db.collection("aiAnropslogg").doc("nyttAnrop").set({ organisationId: "o", uid: "u", funktion: "f", tidpunkt: dagarSedan(1) });
  await db.collection("rutiner").doc("rutinSkaRorasEj").set({ titel: "t", skapad: dagarSedan(500), tidpunkt: dagarSedan(500) });

  let antal;
  await test("raderar exakt det gamla i varje collection", async () => {
    antal = await funcs.gallraAiData();
    vantaSig(antal.klinikfrageloggar === 1, `klinikfrageloggar: ${antal.klinikfrageloggar}`);
    vantaSig(antal.klinikfragecache === 1, `klinikfragecache: ${antal.klinikfragecache}`);
    vantaSig(antal.aiAnropslogg === 1, `aiAnropslogg: ${antal.aiAnropslogg}`);
  });
  await test("nyare poster och poster precis under gränsen (89 dagar / 6 dagar) rörs inte", async () => {
    for (const [c, id] of [["klinikfrageloggar", "ny"], ["klinikfrageloggar", "pagransen"], ["klinikfragecache", "nyCache"], ["aiAnropslogg", "nyttAnrop"]]) {
      vantaSig((await db.collection(c).doc(id).get()).exists, `${c}/${id} raderades felaktigt`);
    }
  });
  await test("en collection som inte ingår i gallringen rörs inte, även om den är gammal", async () => {
    vantaSig((await db.collection("rutiner").doc("rutinSkaRorasEj").get()).exists, "rutiner rördes");
  });
  await test("en andra körning raderar inget nytt", async () => {
    const igen = await funcs.gallraAiData();
    vantaSig(Object.values(igen).every((n) => n === 0), JSON.stringify(igen));
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  if (antalMisslyckade > 0) process.exit(1);
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
