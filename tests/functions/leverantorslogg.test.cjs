// Etapp L1g (intern/ETAPPLAN-INTERN-1.md): hamtaLeverantorsAtgardslogg.
//
// Kärnan i testet: filtret måste vara BÅDE aktorUid OCH aktorRoll == "plattformsadmin".
// En leverantör i dagens modell är samtidigt superadmin i sin egen organisation (innan L1m är
// genomfört på riktigt) – utan aktorRoll-filtret hade den egna vardagliga användningen av
// appen (skapa en rutin i sin egen org) läckt in i "vad har jag gjort mot KUNDER"-loggen.
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore \
//     "node tests/functions/leverantorslogg.test.cjs"
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
  await db.collection("users").doc("vanligSuperL1g").set({ role: "superadmin", organisationId: "orgL1gVanlig" });
  await db.collection("users").doc("levL1g").set({ role: "superadmin", organisationId: "orgL1gLev" });
  await db.collection("plattformsadmin").doc("levL1g").set({ blevPlattformsadmin: Date.now() });

  const bas = Date.now();
  await db.collection("revisionslogg").add({
    organisationId: "orgL1gA",
    tidpunkt: bas - 3000,
    aktorUid: "levL1g",
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_pausad",
    sammanfattning: "Pausade orgL1gA",
  });
  await db.collection("revisionslogg").add({
    organisationId: "orgL1gB",
    tidpunkt: bas - 1000,
    aktorUid: "levL1g",
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_atveraktiverad",
    sammanfattning: "Återaktiverade orgL1gB",
  });
  // Samma uid, men agerade som VANLIG superadmin i sin EGEN organisation – ska INTE räknas.
  await db.collection("revisionslogg").add({
    organisationId: "orgL1gLev",
    tidpunkt: bas - 2000,
    aktorUid: "levL1g",
    aktorRoll: "superadmin",
    handelsetyp: "rutin_publicerad",
    sammanfattning: "Publicerade en rutin i sin egen organisation",
  });
  // En ANNAN plattformsadmins åtgärd – ska INTE räknas som "mina".
  await db.collection("revisionslogg").add({
    organisationId: "orgL1gA",
    tidpunkt: bas - 500,
    aktorUid: "enAnnanLeverantor",
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_pausad",
    sammanfattning: "En annan leverantörs åtgärd",
  });

  console.log("\nhamtaLeverantorsAtgardslogg");
  await test("en icke-plattformsadmin kan INTE läsa", () =>
    forvantaFel("permission-denied", () =>
      funcs.hamtaLeverantorsAtgardslogg.run({ data: {}, auth: { uid: "vanligSuperL1g" } })
    )
  );

  await test("returnerar BARA de två poster där aktorUid OCH aktorRoll matchar, sorterat senast först", async () => {
    const resultat = await funcs.hamtaLeverantorsAtgardslogg.run({ data: {}, auth: { uid: "levL1g" } });
    vantaSig(resultat.poster.length === 2, `förväntade 2 poster, fick ${resultat.poster.length}`);
    vantaSig(resultat.poster[0].organisationId === "orgL1gB", "fel sortering – nyaste borde vara först");
    vantaSig(resultat.poster[1].organisationId === "orgL1gA", "fel sortering – äldsta borde vara sist");
    vantaSig(
      resultat.poster.every((p) => p.aktorRoll === "plattformsadmin"),
      "en post med fel aktorRoll läckte igenom"
    );
  });

  await test("limit begränsar antalet poster", async () => {
    const resultat = await funcs.hamtaLeverantorsAtgardslogg.run({ data: { limit: 1 }, auth: { uid: "levL1g" } });
    vantaSig(resultat.poster.length === 1, `förväntade 1 post, fick ${resultat.poster.length}`);
    vantaSig(resultat.poster[0].organisationId === "orgL1gB", "limit 1 borde ge den senaste posten");
  });

  await test("ett orimligt limit (>200) ignoreras, standard (100) används i stället", async () => {
    const resultat = await funcs.hamtaLeverantorsAtgardslogg.run({ data: { limit: 99999 }, auth: { uid: "levL1g" } });
    vantaSig(resultat.poster.length === 2, "ett orimligt limit skulle inte ändra antalet faktiska poster här, men fick fel antal");
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
