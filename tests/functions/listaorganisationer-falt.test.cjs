// Etapp L1b (intern/ETAPPLAN-INTERN-1.md): bugfix + hamtaKundensLeverantorshistorik.
//
// BUGGEN (upptäckt vid L1b:s premisskontroll): orgnr, kontaktperson, anvandartak (Etapp 6b)
// och pubAvtalTecknat/pubAvtalVersion/underbitradeUnderrattad/omfattasAvNIS2/atagandeblock
// (Etapp L1p) sätts alla på organisationsdokumentet, men listaOrganisationer returnerade dem
// ALDRIG. Konsekvensen var tyst: AvtalOchAtagandeSektion.jsx (byggd i L1p) läser dem från just
// det svaret och visade därför ALLTID "inte tecknat"/tomt, oavsett Firestore-innehåll – ett
// fel inga tidigare tester kunde fånga eftersom de skrev/läste dokumentet direkt, aldrig via
// listaOrganisationer.
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore \
//     "node tests/functions/listaorganisationer-falt.test.cjs"
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
  if (!villkor) throw new Error(meddelande);
}

async function forvantaFel(kod, lofte) {
  try {
    await lofte();
    throw new Error(`Förväntade felkod "${kod}" men anropet lyckades`);
  } catch (fel) {
    vantaSig(fel.code === kod, `Förväntade felkod "${kod}", fick "${fel.code}": ${fel.message}`);
  }
}

async function main() {
  await db.collection("plattformsadmin").doc("levL1b").set({ blevPlattformsadmin: Date.now() });
  await db.collection("organisationer").doc("orgL1bFalt").set({
    namn: "L1b-testkund",
    orgnr: "556677-8899",
    kontaktperson: { namn: "Kontakt Person", epost: "kontakt@l1b.test" },
    anvandartak: 25,
    pubAvtalTecknat: admin.firestore.Timestamp.now(),
    pubAvtalVersion: "2026-08-29",
    underbitradeUnderrattad: { version: "2026-08-29", datum: admin.firestore.Timestamp.now() },
    omfattasAvNIS2: true,
    atagandeblock: { text: "Utfallsgaranti 3 mån", andrad: admin.firestore.Timestamp.now() },
  });

  console.log("\nlistaOrganisationer returnerar de tidigare tappade fälten");
  await test("orgnr, kontaktperson, anvandartak", async () => {
    const resultat = await funcs.listaOrganisationer.run({ data: {}, auth: { uid: "levL1b" } });
    const rad = resultat.organisationer.find((o) => o.orgId === "orgL1bFalt");
    vantaSig(rad.orgnr === "556677-8899", `fel orgnr: ${rad.orgnr}`);
    vantaSig(rad.kontaktperson?.namn === "Kontakt Person", "fel kontaktperson.namn");
    vantaSig(rad.kontaktperson?.epost === "kontakt@l1b.test", "fel kontaktperson.epost");
    vantaSig(rad.anvandartak === 25, `fel anvandartak: ${rad.anvandartak}`);
  });

  await test("pubAvtalTecknat/pubAvtalVersion (L1p)", async () => {
    const resultat = await funcs.listaOrganisationer.run({ data: {}, auth: { uid: "levL1b" } });
    const rad = resultat.organisationer.find((o) => o.orgId === "orgL1bFalt");
    vantaSig(Boolean(rad.pubAvtalTecknat), "pubAvtalTecknat saknas i svaret");
    vantaSig(rad.pubAvtalVersion === "2026-08-29", "fel pubAvtalVersion");
  });

  await test("underbitradeUnderrattad, omfattasAvNIS2, atagandeblock (L1p)", async () => {
    const resultat = await funcs.listaOrganisationer.run({ data: {}, auth: { uid: "levL1b" } });
    const rad = resultat.organisationer.find((o) => o.orgId === "orgL1bFalt");
    vantaSig(rad.underbitradeUnderrattad?.version === "2026-08-29", "fel underbitradeUnderrattad.version");
    vantaSig(rad.omfattasAvNIS2 === true, "fel omfattasAvNIS2");
    vantaSig(rad.atagandeblock?.text === "Utfallsgaranti 3 mån", "fel atagandeblock.text");
  });

  await test("saknade fält ger null, inte undefined eller krasch", async () => {
    await db.collection("organisationer").doc("orgL1bTom").set({ namn: "Tom org" });
    const resultat = await funcs.listaOrganisationer.run({ data: {}, auth: { uid: "levL1b" } });
    const rad = resultat.organisationer.find((o) => o.orgId === "orgL1bTom");
    vantaSig(rad.orgnr === null, "orgnr borde vara null");
    vantaSig(rad.kontaktperson === null, "kontaktperson borde vara null");
    vantaSig(rad.pubAvtalTecknat === null, "pubAvtalTecknat borde vara null");
    vantaSig(rad.underbitradeUnderrattad === null, "underbitradeUnderrattad borde vara null");
    vantaSig(rad.omfattasAvNIS2 === false, "omfattasAvNIS2 borde vara false (default)");
    vantaSig(rad.atagandeblock === null, "atagandeblock borde vara null");
  });

  console.log("\nhamtaKundensLeverantorshistorik");
  await db.collection("users").doc("superL1bHist").set({ role: "superadmin", organisationId: "orgL1bHist" });
  await db.collection("revisionslogg").add({
    organisationId: "orgL1bHist",
    tidpunkt: Date.now() - 1000,
    aktorUid: "levL1b",
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_pausad",
    sammanfattning: "Pausade kunden",
  });
  await db.collection("revisionslogg").add({
    organisationId: "orgL1bHist",
    tidpunkt: Date.now(),
    aktorUid: "superL1bHist",
    aktorRoll: "superadmin",
    handelsetyp: "rutin_publicerad",
    sammanfattning: "Kundens EGEN åtgärd, ska INTE synas i leverantörens historik",
  });

  await test("en icke-plattformsadmin kan INTE läsa", () =>
    forvantaFel("permission-denied", () =>
      funcs.hamtaKundensLeverantorshistorik.run({ data: { orgId: "orgL1bHist" }, auth: { uid: "superL1bHist" } })
    )
  );

  await test("returnerar BARA leverantörens egna åtgärder mot den kunden", async () => {
    const resultat = await funcs.hamtaKundensLeverantorshistorik.run({
      data: { orgId: "orgL1bHist" },
      auth: { uid: "levL1b" },
    });
    vantaSig(resultat.poster.length === 1, `förväntade 1 post, fick ${resultat.poster.length}`);
    vantaSig(resultat.poster[0].handelsetyp === "organisation_pausad", "fel post returnerad");
  });

  await test("en annan organisations poster läcker INTE igenom", async () => {
    await db.collection("revisionslogg").add({
      organisationId: "enAnnanOrgL1b",
      tidpunkt: Date.now(),
      aktorUid: "levL1b",
      aktorRoll: "plattformsadmin",
      handelsetyp: "organisation_pausad",
      sammanfattning: "Fel organisation",
    });
    const resultat = await funcs.hamtaKundensLeverantorshistorik.run({
      data: { orgId: "orgL1bHist" },
      auth: { uid: "levL1b" },
    });
    vantaSig(resultat.poster.length === 1, `en annan organisations post läckte in, fick ${resultat.poster.length}`);
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  if (antalMisslyckade > 0) {
    process.exit(1);
  }
}

main().catch((fel) => {
  console.error(fel);
  process.exit(1);
});
