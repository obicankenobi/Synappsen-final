// Etapp L1m (intern/ETAPPLAN-INTERN-1.md): skapaLeverantorskonto och flyttaTillPlattformskonto.
//
// Den bärande idén i L1m: ett leverantörskonto får `organisationId: "_plattform"`, ett värde
// som matchar ingen riktig organisation – isoleringen är därför en följd av VARJE befintlig
// organisationsgrindad regel, inte av ett nytt undantag. Det testas skarpt mot firestore.rules
// i tests/rules/plattformskonto.test.mjs; det här testet bevisar bara att FUNKTIONERNA sätter
// rätt fält och loggar rätt.
//
// Körs mot Firestore- OCH Auth-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,auth \
//     "node tests/functions/leverantorskonto.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
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

async function senastaPosterAvTyp(organisationId, handelsetyp) {
  const snap = await db
    .collection("revisionslogg")
    .where("organisationId", "==", organisationId)
    .where("handelsetyp", "==", handelsetyp)
    .get();
  return snap.docs.map((d) => d.data());
}

async function main() {
  await db.collection("users").doc("vanligSuperL1m").set({ role: "superadmin", organisationId: "orgL1m" });
  await db.collection("users").doc("levL1m").set({ role: "superadmin", organisationId: "orgLevL1m" });
  await db.collection("plattformsadmin").doc("levL1m").set({ blevPlattformsadmin: Date.now() });

  console.log("\nskapaLeverantorskonto");
  await test("en icke-plattformsadmin kan INTE skapa ett leverantörskonto", () =>
    forvantaFel("permission-denied", () =>
      funcs.skapaLeverantorskonto.run({ data: { epost: "x@x.se", namn: "X" }, auth: { uid: "vanligSuperL1m" } })
    )
  );

  await test("ogiltig e-post ger invalid-argument", () =>
    forvantaFel("invalid-argument", () =>
      funcs.skapaLeverantorskonto.run({ data: { epost: "inte-en-epost", namn: "X" }, auth: { uid: "levL1m" } })
    )
  );

  await test("saknat namn ger invalid-argument", () =>
    forvantaFel("invalid-argument", () =>
      funcs.skapaLeverantorskonto.run({ data: { epost: "x@x.se", namn: "" }, auth: { uid: "levL1m" } })
    )
  );

  let nyttUid;
  let engangsLosenord;
  await test("en plattformsadmin KAN skapa ett nytt, organisationslöst leverantörskonto", async () => {
    const resultat = await funcs.skapaLeverantorskonto.run({
      data: { epost: "ny-leverantor@l1m.test", namn: "Ny Leverantör" },
      auth: { uid: "levL1m" },
    });
    nyttUid = resultat.uid;
    engangsLosenord = resultat.engangsLosenord;
    vantaSig(typeof nyttUid === "string" && nyttUid.length > 0, "inget uid returnerades");
    vantaSig(typeof engangsLosenord === "string" && engangsLosenord.length >= 24, "inget rimligt engångslösenord returnerades");
  });

  await test("Auth-kontot skapades med rätt e-post", async () => {
    const authAnvandare = await admin.auth().getUser(nyttUid);
    vantaSig(authAnvandare.email === "ny-leverantor@l1m.test", "fel e-post på Auth-kontot");
  });

  await test("users/{uid} har organisationId '_plattform' och role 'superadmin'", async () => {
    const snap = await db.collection("users").doc(nyttUid).get();
    vantaSig(snap.data().organisationId === "_plattform", `fel organisationId: ${snap.data().organisationId}`);
    vantaSig(snap.data().role === "superadmin", `fel role: ${snap.data().role}`);
  });

  await test("plattformsadmin/{uid} skapades", async () => {
    const snap = await db.collection("plattformsadmin").doc(nyttUid).get();
    vantaSig(snap.exists, "plattformsadmin-dokumentet skapades inte");
  });

  await test("skapandet loggas mot _plattform", async () => {
    const poster = await senastaPosterAvTyp("_plattform", "leverantorskonto_skapat");
    vantaSig(poster.some((p) => p.objektId === nyttUid), "ingen loggpost för det nya kontot");
  });

  console.log("\nflyttaTillPlattformskonto");
  await test("en icke-plattformsadmin kan INTE flytta sitt konto", () =>
    forvantaFel("permission-denied", () =>
      funcs.flyttaTillPlattformskonto.run({ data: {}, auth: { uid: "vanligSuperL1m" } })
    )
  );

  await test("en plattformsadmin i en riktig organisation FLYTTAS till _plattform", async () => {
    const resultat = await funcs.flyttaTillPlattformskonto.run({ data: {}, auth: { uid: "levL1m" } });
    vantaSig(resultat.ok === true, "ok skulle vara true");
    vantaSig(resultat.redanFlyttat === false, "redanFlyttat skulle vara false första gången");
    vantaSig(resultat.foregaendeOrganisationId === "orgLevL1m", "fel föregående organisationId i svaret");

    const snap = await db.collection("users").doc("levL1m").get();
    vantaSig(snap.data().organisationId === "_plattform", `organisationId flyttades inte: ${snap.data().organisationId}`);
    vantaSig(snap.data().role === "superadmin", "rollen skulle vara oförändrad (superadmin)");
  });

  await test("flytten loggas i BÅDA kedjorna – den gamla organisationens OCH _plattforms", async () => {
    const gammal = await senastaPosterAvTyp("orgLevL1m", "konto_flyttat_till_plattform");
    const ny = await senastaPosterAvTyp("_plattform", "konto_flyttat_till_plattform");
    vantaSig(gammal.length === 1, `förväntade 1 post i orgLevL1m, fick ${gammal.length}`);
    vantaSig(ny.length === 1, `förväntade 1 post i _plattform, fick ${ny.length}`);
  });

  await test("ett andra anrop är en no-op (idempotent), loggar INGET nytt", async () => {
    const resultat = await funcs.flyttaTillPlattformskonto.run({ data: {}, auth: { uid: "levL1m" } });
    vantaSig(resultat.redanFlyttat === true, "redanFlyttat skulle vara true andra gången");

    const gammal = await senastaPosterAvTyp("orgLevL1m", "konto_flyttat_till_plattform");
    vantaSig(gammal.length === 1, `en andra körning skrev en ny loggpost – fick ${gammal.length}, förväntade fortfarande 1`);
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
