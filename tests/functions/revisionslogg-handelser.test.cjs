// Etapp 14c: bevisar att loggaRevision() faktiskt anropas från de befintliga flöden den
// kopplades till – organisationens livscykel (Cloud Functions, testade via .run()) och
// rutinens skapande/godkännande/borttagning (Firestore-triggerns kärnlogik, testad direkt
// eftersom `test:functions` bara kör firestore+storage-emulatorerna, inte
// functions-emulatorn som skulle behövas för att en riktig trigger ska utlösas).
//
// Körs mot emulatorerna:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage \
//     "node tests/functions/revisionslogg-handelser.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.STORAGE_EMULATOR_HOST = "http://127.0.0.1:9199";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
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

async function senastePostAvTyp(organisationId, handelsetyp) {
  const snap = await db
    .collection("revisionslogg")
    .where("organisationId", "==", organisationId)
    .orderBy("tidpunkt", "desc")
    .get();
  return snap.docs.map((d) => d.data()).find((p) => p.handelsetyp === handelsetyp);
}

async function main() {
  await db.collection("users").doc("superX").set({ role: "superadmin", organisationId: "orgFore14c" });
  // Seedas direkt (Admin SDK) istället för via blibForstaPlattformsadmin – emulatorn delas
  // med övriga testfiler i samma npm-script-körning, och en plattformsadmin kan redan
  // finnas från en tidigare fil (etapp6.test.cjs).
  await db.collection("plattformsadmin").doc("superX").set({ blevPlattformsadmin: true });

  console.log("\norganisationens livscykel – loggaRevision() anropas från de befintliga funktionerna");
  let nyOrgId;
  await test("skapaOrganisation loggar organisation_etablerad", async () => {
    const resultat = await funcs.skapaOrganisation.run({
      data: { namn: "14c Testkund" },
      auth: { uid: "superX" },
    });
    nyOrgId = resultat.orgId;
    const post = await senastePostAvTyp(nyOrgId, "organisation_etablerad");
    vantaSig(Boolean(post), "ingen organisation_etablerad-post hittades");
    vantaSig(post.aktorUid === "superX", "fel aktör loggades");
  });

  await test("pausaOrganisation(pausad=true) loggar organisation_pausad", async () => {
    await funcs.pausaOrganisation.run({ data: { orgId: nyOrgId, pausad: true }, auth: { uid: "superX" } });
    const post = await senastePostAvTyp(nyOrgId, "organisation_pausad");
    vantaSig(Boolean(post), "ingen organisation_pausad-post hittades");
  });

  await test("pausaOrganisation(pausad=false) loggar organisation_atveraktiverad", async () => {
    await funcs.pausaOrganisation.run({ data: { orgId: nyOrgId, pausad: false }, auth: { uid: "superX" } });
    const post = await senastePostAvTyp(nyOrgId, "organisation_atveraktiverad");
    vantaSig(Boolean(post), "ingen organisation_atveraktiverad-post hittades");
  });

  await test("exporteraOrganisation loggar organisation_exporterad", async () => {
    await funcs.exporteraOrganisation.run({ data: { orgId: nyOrgId }, auth: { uid: "superX" } });
    const post = await senastePostAvTyp(nyOrgId, "organisation_exporterad");
    vantaSig(Boolean(post), "ingen organisation_exporterad-post hittades");
  });

  console.log("\ntvingaUtloggning – loggaRevision() anropas");
  await db.collection("users").doc("volTvingad").set({ role: "vol", organisationId: "orgFore14c" });
  await admin.auth().createUser({ uid: "volTvingad", email: "voltvingad@exempel.se" });
  await test("tvingaUtloggning loggar anvandare_utloggning_tvingad", async () => {
    await funcs.tvingaUtloggning.run({ data: { userId: "volTvingad" }, auth: { uid: "superX" } });
    const post = await senastePostAvTyp("orgFore14c", "anvandare_utloggning_tvingad");
    vantaSig(Boolean(post), "ingen anvandare_utloggning_tvingad-post hittades");
    vantaSig(post.objektId === "volTvingad", "fel objektId loggades");
  });

  console.log("\nlosInInbjudan – loggaRevision() anropas EFTER transaktionen (inte inuti den)");
  const inbjudanRef = db.collection("inbjudningar").doc("token14c");
  await inbjudanRef.set({
    organisationId: "orgFore14c",
    roll: "personal",
    epost: "ny14c@exempel.se",
    anvand: false,
    utgangstid: Date.now() + 1000 * 60 * 60,
  });
  await test("losInInbjudan loggar anvandare_skapad", async () => {
    await funcs.losInInbjudan.run({
      data: { token: "token14c", namn: "Ny Person" },
      auth: { uid: "nyUid14c", token: { email: "ny14c@exempel.se" } },
    });
    const post = await senastePostAvTyp("orgFore14c", "anvandare_skapad");
    vantaSig(Boolean(post), "ingen anvandare_skapad-post hittades");
    vantaSig(post.objektId === "nyUid14c", "fel objektId loggades");
  });

  console.log("\nhanteraRutinSkapad – rutin publicerad direkt vid skapande");
  await test("en rutin skapad med status=godkand loggar rutin_publicerad", async () => {
    await funcs.hanteraRutinSkapad(
      { organisationId: "orgRutin14c", status: "godkand", skapadAv: "volTvingad", titel: "Direktpublicerad" },
      "rutinDirekt"
    );
    const post = await senastePostAvTyp("orgRutin14c", "rutin_publicerad");
    vantaSig(Boolean(post), "ingen rutin_publicerad-post hittades");
    vantaSig(post.objektId === "rutinDirekt", "fel objektId loggades");
  });
  await test("en rutin skapad med status=utkast loggar INGENTING", async () => {
    await funcs.hanteraRutinSkapad(
      { organisationId: "orgRutin14c", status: "utkast", skapadAv: "volTvingad", titel: "Ett utkast" },
      "rutinUtkast"
    );
    const post = await senastePostAvTyp("orgRutin14c", "rutin_publicerad");
    vantaSig(post.objektId !== "rutinUtkast", "ett utkast loggades felaktigt som publicerat");
  });

  console.log("\nhanteraRutinAndrad – godkännande och mjuk radering");
  await test("en övergång utkast→godkänd loggar rutin_godkand", async () => {
    await funcs.hanteraRutinAndrad(
      { organisationId: "orgRutin14c", status: "utkast", titel: "Rutin X" },
      { organisationId: "orgRutin14c", status: "godkand", titel: "Rutin X", godkandAv: "superX" },
      "rutinX"
    );
    const post = await senastePostAvTyp("orgRutin14c", "rutin_godkand");
    vantaSig(Boolean(post), "ingen rutin_godkand-post hittades");
    vantaSig(post.aktorUid === "superX", "fel aktör loggades för godkännandet");
  });
  await test("en mjuk radering (borttagen: false→true) loggar rutin_borttagen", async () => {
    await funcs.hanteraRutinAndrad(
      { organisationId: "orgRutin14c", status: "godkand", titel: "Rutin X", borttagen: false },
      { organisationId: "orgRutin14c", status: "godkand", titel: "Rutin X", borttagen: true, borttagenAv: "volTvingad" },
      "rutinX"
    );
    const post = await senastePostAvTyp("orgRutin14c", "rutin_borttagen");
    vantaSig(Boolean(post), "ingen rutin_borttagen-post hittades");
  });
  await test("en oförändrad status/borttagen loggar INGENTING", async () => {
    const foreSnap = await db
      .collection("revisionslogg")
      .where("organisationId", "==", "orgRutin14c")
      .get();
    const antalFore = foreSnap.size;
    await funcs.hanteraRutinAndrad(
      { organisationId: "orgRutin14c", status: "godkand", titel: "Rutin X oförändrad" },
      { organisationId: "orgRutin14c", status: "godkand", titel: "Rutin X oförändrad, redigerad text" },
      "rutinOandrad"
    );
    const efterSnap = await db
      .collection("revisionslogg")
      .where("organisationId", "==", "orgRutin14c")
      .get();
    vantaSig(efterSnap.size === antalFore, "en post loggades trots att ingen bevakad övergång skedde");
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  process.exit(antalMisslyckade > 0 ? 1 : 0);
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
