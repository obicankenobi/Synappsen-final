// Etapp 48b: bevisar att okaSokkvot (a) räknar upp den DELADE dygnstotalen oavsett
// organisation, (b) räknar upp varje organisations EGEN andel separat, (c) nollställer båda
// räknarna när datumet inte längre är "idag" (gårdagens siffror ska aldrig blandas in), och
// (d) inte läcker en organisations sökförbrukning till en annan organisations dokument.
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore \
//     "node tests/functions/sokkvot.test.cjs"
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
  const ORG_A = "orgSokkvotA";
  const ORG_B = "orgSokkvotB";
  await db.collection("organisationer").doc(ORG_A).set({ namn: "Sökkvot A" });
  await db.collection("organisationer").doc(ORG_B).set({ namn: "Sökkvot B" });

  await test("första anropet sätter total- och orgräknaren till 1", async () => {
    await funcs.okaSokkvot(ORG_A);
    const global = (await db.collection("systemstatus").doc("sokkvot").get()).data();
    const org = (await db.collection("organisationer").doc(ORG_A).get()).data();
    vantaSig(global.totalAntal === 1, `totalAntal: ${global.totalAntal}`);
    vantaSig(org.sokkvotAntal === 1, `sokkvotAntal: ${org.sokkvotAntal}`);
  });

  await test("ett anrop från en ANNAN organisation ökar totalen men inte den första organisationens räknare", async () => {
    await funcs.okaSokkvot(ORG_B);
    const global = (await db.collection("systemstatus").doc("sokkvot").get()).data();
    const orgA = (await db.collection("organisationer").doc(ORG_A).get()).data();
    const orgB = (await db.collection("organisationer").doc(ORG_B).get()).data();
    vantaSig(global.totalAntal === 2, `totalAntal: ${global.totalAntal}`);
    vantaSig(orgA.sokkvotAntal === 1, `orgA påverkades: ${orgA.sokkvotAntal}`);
    vantaSig(orgB.sokkvotAntal === 1, `orgB fel antal: ${orgB.sokkvotAntal}`);
  });

  await test("ett gammalt datum på den delade totalen nollställs istället för att räknas vidare på", async () => {
    await db.collection("systemstatus").doc("sokkvot").set({ datum: "2020-01-01", totalAntal: 97, tak: 100, larmSkickad: true });
    await funcs.okaSokkvot(ORG_A);
    const global = (await db.collection("systemstatus").doc("sokkvot").get()).data();
    vantaSig(global.totalAntal === 1, `totalAntal borde nollställts och räknats till 1: ${global.totalAntal}`);
    vantaSig(global.larmSkickad === false, "larmSkickad borde nollställts för det nya datumet");
  });

  await test("ett gammalt datum på en organisations egen räknare nollställs likaså", async () => {
    await db.collection("organisationer").doc(ORG_A).set({ sokkvotDatum: "2020-01-01", sokkvotAntal: 55 }, { merge: true });
    await funcs.okaSokkvot(ORG_A);
    const org = (await db.collection("organisationer").doc(ORG_A).get()).data();
    vantaSig(org.sokkvotAntal === 1, `sokkvotAntal borde nollställts och räknats till 1: ${org.sokkvotAntal}`);
  });

  await test("larmar (utan att kasta fel) när 80%-tröskeln nås, en gång", async () => {
    const idag = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm" });
    await db.collection("systemstatus").doc("sokkvot").set({
      datum: idag,
      totalAntal: 79,
      tak: 100,
      larmSkickad: false,
    });
    await funcs.okaSokkvot(ORG_A);
    const global = (await db.collection("systemstatus").doc("sokkvot").get()).data();
    vantaSig(global.totalAntal === 80, `totalAntal: ${global.totalAntal}`);
    vantaSig(global.larmSkickad === true, "larmSkickad borde vara true vid 80/100");
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  process.exit(antalMisslyckade > 0 ? 1 : 0);
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
