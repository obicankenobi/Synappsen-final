// Etapp 53d: bevisar skickaManadssammanfattningar() – bygger på det befintliga
// matvardenSnapshots (Etapp 39a), skickar bara till superadmin(ar), respekterar en EGEN
// opt-out (`epostInstallningar.manadsrapport`, skild från 53c:s `paminnelser`), hoppar över
// demo-/pausade organisationer och organisationer utan något mätvärde ännu, och läcker
// aldrig ett organisationsnamn eller verksamhetsinnehåll (genomgående krav 18).
//
// Körs mot emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage,auth \
//     "node tests/functions/manadssammanfattning.test.cjs"
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

async function korMedMockadFetch(fn) {
  const ursprungligFetch = global.fetch;
  const anrop = [];
  process.env.BREVO_API_KEY = "testnyckel";
  global.fetch = async (url, init) => {
    anrop.push(JSON.parse(init.body));
    return { ok: true };
  };
  try {
    await fn();
  } finally {
    global.fetch = ursprungligFetch;
    delete process.env.BREVO_API_KEY;
  }
  return anrop;
}

async function main() {
  console.log("\nskickaManadssammanfattningar – hoppar över demo/pausade/mätvärdeslösa organisationer");
  await db.collection("organisationer").doc("orgManadDemo").set({ namn: "Demo AB", arDemo: true, status: "aktiv" });
  await db.collection("users").doc("manadDemoSuper").set({
    organisationId: "orgManadDemo",
    role: "superadmin",
    email: "demo@exempel.se",
  });
  await db.collection("organisationer").doc("orgManadDemo").collection("matvardenSnapshots").doc("2026-08-01").set({
    datum: "2026-08-01",
    kvitteringsgradKlinisktStod: 90,
  });

  await db.collection("organisationer").doc("orgManadPausad").set({ namn: "Pausad AB", status: "pausad" });
  await db.collection("users").doc("manadPausadSuper").set({
    organisationId: "orgManadPausad",
    role: "superadmin",
    email: "pausad@exempel.se",
  });
  await db.collection("organisationer").doc("orgManadPausad").collection("matvardenSnapshots").doc("2026-08-01").set({
    datum: "2026-08-01",
    kvitteringsgradKlinisktStod: 50,
  });

  await db.collection("organisationer").doc("orgManadUtanSnapshot").set({ namn: "Ny AB", status: "aktiv" });
  await db.collection("users").doc("manadUtanSnapshotSuper").set({
    organisationId: "orgManadUtanSnapshot",
    role: "superadmin",
    email: "ny@exempel.se",
  });

  await test("ingen av de tre (demo/pausad/utan mätvärde) får något mejl", async () => {
    const anrop = await korMedMockadFetch(() => funcs.skickaManadssammanfattningar());
    const mottagare = anrop.map((a) => a.to[0].email);
    vantaSig(!mottagare.includes("demo@exempel.se"), "demo-organisationen skulle aldrig få ett mejl");
    vantaSig(!mottagare.includes("pausad@exempel.se"), "en pausad organisation skulle aldrig få ett mejl");
    vantaSig(!mottagare.includes("ny@exempel.se"), "utan ett mätvärde alls finns inget att sammanfatta");
  });

  console.log("\nskickaManadssammanfattningar – normalfallet: bara superadmin, siffror, aldrig organisationsnamn");
  const org = "orgManadNormal";
  await db.collection("organisationer").doc(org).set({ namn: "Hemlig Klinik AB", status: "aktiv" });
  await db.collection("users").doc("manadSuper").set({ organisationId: org, role: "superadmin", email: "chef@exempel.se" });
  await db.collection("users").doc("manadPersonal").set({ organisationId: org, role: "personal", email: "personal@exempel.se" });
  await db.collection("organisationer").doc(org).collection("matvardenSnapshots").doc("2026-07-15").set({
    datum: "2026-07-15",
    kvitteringsgradKlinisktStod: 60,
  });
  await db.collection("organisationer").doc(org).collection("matvardenSnapshots").doc("2026-08-01").set({
    datum: "2026-08-01",
    kvitteringsgradKlinisktStod: 82,
    kvitteringsgradAdministration: 91,
    innehallshalsaKlinisktStod: 77,
    innehallshalsaAdministration: null,
  });
  await db.collection("andringsforslag").doc("forslagManad1").set({
    organisationId: org,
    status: "ny",
    omrade: "kliniskt-stod",
  });
  await db.collection("andringsforslag").doc("forslagManad2").set({
    organisationId: org,
    status: "infort",
    omrade: "kliniskt-stod",
  });

  let anrop;
  await test("skickar exakt ETT mejl, till superadmin – aldrig till personal", async () => {
    anrop = await korMedMockadFetch(() => funcs.skickaManadssammanfattningar());
    const tillOrg = anrop.filter((a) => a.to[0].email === "chef@exempel.se" || a.to[0].email === "personal@exempel.se");
    vantaSig(tillOrg.length === 1, `förväntade exakt 1 mejl till org, fick ${tillOrg.length}`);
    vantaSig(tillOrg[0].to[0].email === "chef@exempel.se", "fel mottagare – ska vara superadmin");
  });
  await test("använder det SENASTE mätvärdet (82%), inte det äldre (60%)", () => {
    const mejl = anrop.find((a) => a.to[0].email === "chef@exempel.se");
    vantaSig(mejl.textContent.includes("82%"), "saknar den senaste kvitteringsgraden");
    vantaSig(!mejl.textContent.includes("60%"), "använde det gamla mätvärdet istället för det senaste");
  });
  await test("räknar bara ändringsförslag med status 'ny', inte 'infort'", () => {
    const mejl = anrop.find((a) => a.to[0].email === "chef@exempel.se");
    vantaSig(mejl.textContent.includes("Obesvarade ändringsförslag: 1"), "fel antal obesvarade förslag");
  });
  await test("innehåller ALDRIG organisationens namn, varken i ämnesrad eller text", () => {
    const mejl = anrop.find((a) => a.to[0].email === "chef@exempel.se");
    vantaSig(!mejl.subject.includes("Hemlig Klinik"), "organisationsnamnet läckte i ämnesraden");
    vantaSig(!mejl.textContent.includes("Hemlig Klinik"), "organisationsnamnet läckte i brödtexten");
  });
  await test("länkar till /ledningsrapport", () => {
    const mejl = anrop.find((a) => a.to[0].email === "chef@exempel.se");
    vantaSig(mejl.textContent.includes("/ledningsrapport"), "länken till ledningsrapporten saknas");
  });

  console.log("\nskickaManadssammanfattningar – opt-out är EGET fält, skilt från 53c:s paminnelser");
  const orgOptOut = "orgManadOptOut";
  await db.collection("organisationer").doc(orgOptOut).set({ namn: "Optout AB", status: "aktiv" });
  await db.collection("users").doc("manadOptOutSuper").set({
    organisationId: orgOptOut,
    role: "superadmin",
    email: "optout@exempel.se",
    // Stängde av DAGLIGA påminnelser men INTE månadsrapporten – ska ändå få den.
    epostInstallningar: { paminnelser: false },
  });
  await db.collection("organisationer").doc(orgOptOut).collection("matvardenSnapshots").doc("2026-08-01").set({
    datum: "2026-08-01",
    kvitteringsgradKlinisktStod: 70,
  });
  await test("opt-out av DAGLIGA påminnelser tystar INTE månadsrapporten", async () => {
    const anrop2 = await korMedMockadFetch(() => funcs.skickaManadssammanfattningar());
    vantaSig(
      anrop2.some((a) => a.to[0].email === "optout@exempel.se"),
      "en användare som bara stängt av dagliga påminnelser borde ändå fått månadsrapporten"
    );
  });

  const orgManadOptOut2 = "orgManadOptOut2";
  await db.collection("organisationer").doc(orgManadOptOut2).set({ namn: "Optout2 AB", status: "aktiv" });
  await db.collection("users").doc("manadOptOutSuper2").set({
    organisationId: orgManadOptOut2,
    role: "superadmin",
    email: "optout2@exempel.se",
    epostInstallningar: { manadsrapport: false },
  });
  await db
    .collection("organisationer")
    .doc(orgManadOptOut2)
    .collection("matvardenSnapshots")
    .doc("2026-08-01")
    .set({ datum: "2026-08-01", kvitteringsgradKlinisktStod: 70 });
  await test("opt-out av MÅNADSRAPPORTEN respekteras", async () => {
    const anrop3 = await korMedMockadFetch(() => funcs.skickaManadssammanfattningar());
    vantaSig(
      !anrop3.some((a) => a.to[0].email === "optout2@exempel.se"),
      "en användare som stängt av månadsrapporten fick den ändå"
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
