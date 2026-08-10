// Etapp 51: bevisar nollstallDemoOrganisation (bara plattformsadmin, seedar realistiskt
// exempelinnehåll som visar checklistläge/godkännandekö/innehållshälsa/kompetensmatris, en
// valfri inbjudan till en angiven e-post) och att en andra körning verkligen städar bort det
// FÖRRA anropets innehåll/användare innan den seedar om (idempotent nollställning, inte
// ackumulerande).
//
// Körs mot Firestore-, Storage- OCH Auth-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage,auth \
//     "node tests/functions/demo-organisation.test.cjs"
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

async function forvantaFel(kod, promiseFn) {
  try {
    await promiseFn();
    throw new Error(`förväntade fel ${kod}, fick inget`);
  } catch (fel) {
    vantaSig(fel.code === kod, `fel kod: ${fel.code} (${fel.message})`);
  }
}

async function main() {
  await db.collection("users").doc("superVanlig51").set({ role: "superadmin", organisationId: "orgVanlig51" });
  await db.collection("plattformsadmin").doc("lev51").set({ blevPlattformsadmin: Date.now() });

  console.log("\nnollstallDemoOrganisation – behörighet");
  await test("kräver inloggning", () =>
    forvantaFel("unauthenticated", () => funcs.nollstallDemoOrganisation.run({ data: {}, auth: null }))
  );
  await test("en superadmin (inte plattformsadmin) nekas", () =>
    forvantaFel("permission-denied", () =>
      funcs.nollstallDemoOrganisation.run({ data: {}, auth: { uid: "superVanlig51" } })
    )
  );
  await test("en ogiltig e-postadress avvisas", () =>
    forvantaFel("invalid-argument", () =>
      funcs.nollstallDemoOrganisation.run({ data: { inbjudanEpost: "inte-en-epost" }, auth: { uid: "lev51" } })
    )
  );

  console.log("\nnollstallDemoOrganisation – seedar realistiskt exempelinnehåll");
  let forstaResultat;
  await test("en plattformsadmin KAN nollställa demomiljön, utan inbjudan", async () => {
    forstaResultat = await funcs.nollstallDemoOrganisation.run({ data: {}, auth: { uid: "lev51" } });
    vantaSig(forstaResultat.inbjudanToken === null, "väntade ingen inbjudan utan angiven e-post");
  });
  await test("organisationen finns, är aktiv och flaggad arDemo", async () => {
    const orgSnap = await db.collection("organisationer").doc("_demo").get();
    vantaSig(orgSnap.exists, "organisationen skapades inte");
    vantaSig(orgSnap.data().arDemo === true, "arDemo saknas/fel");
    vantaSig(orgSnap.data().status === "aktiv", "status fel");
  });
  await test("minst en godkänd rutin, ett utkast (godkännandekö) och en akutlägeschecklista seedades", async () => {
    const snap = await db.collection("rutiner").where("organisationId", "==", "_demo").get();
    const rutiner = snap.docs.map((d) => d.data());
    vantaSig(rutiner.some((r) => r.status === "godkand"), "ingen godkänd rutin");
    vantaSig(rutiner.some((r) => r.status === "utkast"), "ingen utkast-rutin (godkännandekö)");
    vantaSig(rutiner.some((r) => r.akutlage === true && Array.isArray(r.steg) && r.steg.length > 0), "ingen checklistrutin");
  });
  await test("en rutin har medvetet ett gammalt granskadDatum (innehållshälsa)", async () => {
    const snap = await db.collection("rutiner").where("organisationId", "==", "_demo").get();
    const gammal = snap.docs
      .map((d) => d.data())
      .find((r) => r.titel.includes("bör granskas"));
    vantaSig(!!gammal, "hittade ingen 'bör granskas'-rutin");
    const dagarSedan = (Date.now() - gammal.granskadDatum.toDate().getTime()) / (1000 * 60 * 60 * 24);
    vantaSig(dagarSedan > 180, `granskadDatum var inte gammalt nog: ${dagarSedan} dagar`);
  });
  await test("förrådsartiklar, anslag, kontakter och ett kompetenskrav seedades", async () => {
    const [artiklar, anslag, kontakter, krav] = await Promise.all([
      db.collection("forradsartiklar").where("organisationId", "==", "_demo").get(),
      db.collection("anslag").where("organisationId", "==", "_demo").get(),
      db.collection("kontakter").where("organisationId", "==", "_demo").get(),
      db.collection("kompetenskrav").where("organisationId", "==", "_demo").get(),
    ]);
    vantaSig(artiklar.size >= 2, `för få förrådsartiklar: ${artiklar.size}`);
    vantaSig(anslag.size >= 1, "inget anslag");
    vantaSig(kontakter.size >= 2, `för få kontakter: ${kontakter.size}`);
    vantaSig(krav.size === 1, `förväntade 1 kompetenskrav, fick ${krav.size}`);
  });

  console.log("\nnollstallDemoOrganisation – med angiven e-post skapas en inbjudan");
  let andraResultat;
  await test("en plattformsadmin KAN nollställa med en angiven e-post – får ett inbjudanToken", async () => {
    andraResultat = await funcs.nollstallDemoOrganisation.run({
      data: { inbjudanEpost: "Prospekt@Exempel.se" },
      auth: { uid: "lev51" },
    });
    vantaSig(!!andraResultat.inbjudanToken, "inbjudanToken saknas");
  });
  await test("inbjudan pekar på _demo-organisationen med rätt (normaliserad) e-post och superadmin-roll", async () => {
    const inbjudanSnap = await db.collection("inbjudningar").doc(andraResultat.inbjudanToken).get();
    vantaSig(inbjudanSnap.data().organisationId === "_demo", "fel organisationId i inbjudan");
    vantaSig(inbjudanSnap.data().epost === "prospekt@exempel.se", "e-post normaliserades inte till gemener");
    vantaSig(inbjudanSnap.data().roll === "superadmin", "fel roll i inbjudan");
  });

  console.log("\nnollstallDemoOrganisation – en andra körning städar bort förra körningens innehåll");
  await test("dubblerar INTE rutinerna vid ett andra anrop (städas innan omseedning)", async () => {
    await funcs.nollstallDemoOrganisation.run({ data: {}, auth: { uid: "lev51" } });
    const snap = await db.collection("rutiner").where("organisationId", "==", "_demo").get();
    // Etapp 56a utökade VERKSAMHETSMALLAR.akutmottagning från 2 till 8 mallar, Etapp 59a
    // (ETAPPLAN12.md, bugfynd) tog bort de 2 logistik-mallarna igen (8 → 6) – 9 rutiner
    // seedas nu varje gång (6 mallar + 1 utkast + 1 checklista + 1 granskningsdemo, se
    // froSaDemoOrganisationensInnehall) – oavsett antal ska det INTE dubbleras av ett andra anrop.
    vantaSig(snap.size === 9, `förväntade exakt 9 rutiner efter ett andra anrop, fick ${snap.size}`);
  });

  console.log("\nnollstallDemoOrganisation – loggar till '_plattform'-revisionsloggen");
  await test("varje nollställning loggas", async () => {
    const logg = await db
      .collection("revisionslogg")
      .where("organisationId", "==", "_plattform")
      .where("handelsetyp", "==", "demo_organisation_nollstalld")
      .get();
    vantaSig(logg.size >= 3, `förväntade minst 3 loggposter (tre anrop gjorda), fick ${logg.size}`);
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
