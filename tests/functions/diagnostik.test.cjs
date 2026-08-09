// Etapp 50a: bevisar att hamtaOrganisationsdiagnostik (1) kräver plattformsadmin,
// (2) räknar dokument per collection korrekt scopat till orgId, (3) returnerar senaste
// loggade revisionslogg-händelse, (4) returnerar backupstatus, och (5) ALDRIG returnerar
// dokumentinnehåll – bara antal/tidpunkter/handelsetyper.
//
// Körs mot Firestore- OCH Storage-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage \
//     "node tests/functions/diagnostik.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.STORAGE_EMULATOR_HOST = "http://127.0.0.1:9199";
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

async function forvantaFel(kod, promiseFn) {
  try {
    await promiseFn();
    throw new Error(`förväntade fel ${kod}, fick inget`);
  } catch (fel) {
    vantaSig(fel.code === kod, `fel kod: ${fel.code} (${fel.message})`);
  }
}

async function main() {
  const ORG = "orgDiagnostik50a";
  const ANNAN_ORG = "annanOrgDiagnostik50a";
  await db.collection("organisationer").doc(ORG).set({ namn: "Diagnostiktest AB", status: "aktiv", moduler: {} });
  await db.collection("users").doc("superDiag").set({ role: "superadmin", organisationId: ORG });
  await db.collection("plattformsadmin").doc("levDiag").set({ blevPlattformsadmin: Date.now() });

  await db.collection("rutiner").doc("r1").set({ organisationId: ORG, titel: "Hemlig titel 1" });
  await db.collection("rutiner").doc("r2").set({ organisationId: ORG, titel: "Hemlig titel 2" });
  await db.collection("rutiner").doc("rAnnan").set({ organisationId: ANNAN_ORG, titel: "Ska inte räknas" });
  await db.collection("forradsartiklar").doc("f1").set({ organisationId: ORG, namn: "Artikel" });

  console.log("\nhamtaOrganisationsdiagnostik – behörighet");
  await test("kräver inloggning", () =>
    forvantaFel("unauthenticated", () => funcs.hamtaOrganisationsdiagnostik.run({ data: { orgId: ORG }, auth: null }))
  );
  await test("en superadmin (inte plattformsadmin) nekas", () =>
    forvantaFel("permission-denied", () =>
      funcs.hamtaOrganisationsdiagnostik.run({ data: { orgId: ORG }, auth: { uid: "superDiag" } })
    )
  );
  await test("saknat orgId avvisas", () =>
    forvantaFel("invalid-argument", () =>
      funcs.hamtaOrganisationsdiagnostik.run({ data: {}, auth: { uid: "levDiag" } })
    )
  );

  console.log("\nhamtaOrganisationsdiagnostik – effekt");
  let resultat;
  await test("en plattformsadmin får diagnostik tillbaka", async () => {
    const svar = await funcs.hamtaOrganisationsdiagnostik.run({ data: { orgId: ORG }, auth: { uid: "levDiag" } });
    resultat = svar;
  });
  await test("dokumentantal är rätt scopat till organisationen (2 rutiner, inte 3)", () => {
    vantaSig(resultat.antalDokument.rutiner === 2, `rutiner: ${resultat.antalDokument.rutiner}`);
    vantaSig(resultat.antalDokument.forradsartiklar === 1, `forradsartiklar: ${resultat.antalDokument.forradsartiklar}`);
  });
  await test("inget dokumentinnehåll läcker (ingen 'titel'/'namn' i svaret)", () => {
    const somJson = JSON.stringify(resultat);
    vantaSig(!somJson.includes("Hemlig titel"), "dokumentinnehåll läckte ut i diagnostiksvaret");
  });
  await test("backupstatus returneras (ingen Operations-modul => harOperationsModul: false)", () => {
    vantaSig(resultat.backupstatus.harOperationsModul === false, "förväntade harOperationsModul: false");
  });
  await test("felfrekvensTillganglig är false (medvetet, se ETAPPLAN5.md §32b)", () => {
    vantaSig(resultat.felfrekvensTillganglig === false, "förväntade felfrekvensTillganglig: false");
  });
  await test("ingen tidigare revisionslogg-händelse ger senasteHandelse: null", () => {
    vantaSig(resultat.senasteHandelse === null, "förväntade null innan något loggats");
  });
  await test("anropet självt loggas in i organisationens egen revisionslogg", async () => {
    const logg = await db.collection("revisionslogg").where("organisationId", "==", ORG).get();
    vantaSig(logg.size === 1, `förväntade 1 loggpost, fick ${logg.size}`);
    vantaSig(logg.docs[0].data().handelsetyp === "organisation_diagnostik_visad", "fel handelsetyp");
  });
  await test("ett andra anrop ser den loggade händelsen som senasteHandelse", async () => {
    const svar = await funcs.hamtaOrganisationsdiagnostik.run({ data: { orgId: ORG }, auth: { uid: "levDiag" } });
    vantaSig(svar.senasteHandelse?.handelsetyp === "organisation_diagnostik_visad", "senasteHandelse saknades/fel");
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
