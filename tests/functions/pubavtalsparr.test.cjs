// Etapp L1p punkt 1 (intern/ETAPPLAN-INTERN-1.md), B12: den enskilt viktigaste raden i hela
// delmålet. Innan detta fanns ingenting som hindrade att en organisation sattes till
// avtalsstatus "aktiv" utan ett tecknat PUB-avtal – samma feltyp som Brevo, fast med
// Synappsen som biträdet. Det här testet bevisar spärren, och att den INTE blockerar något
// den inte ska (pausad/avslutad, eller en organisation som redan har ett registrerat avtal).
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore \
//     "node tests/functions/pubavtalsparr.test.cjs"
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
  await db.collection("plattformsadmin").doc("levPub").set({ blevPlattformsadmin: Date.now() });

  console.log("\nDen faktiska spärren (B12)");
  await db.collection("organisationer").doc("orgPubUtanAvtal").set({ namn: "Utan PUB-avtal" });
  await test("satAvtalsstatus('aktiv') NEKAS utan ett registrerat PUB-avtal", () =>
    forvantaFel("failed-precondition", () =>
      funcs.satAvtalsstatus.run({ data: { orgId: "orgPubUtanAvtal", avtalsstatus: "aktiv" }, auth: { uid: "levPub" } })
    )
  );

  await test("...men 'pausad' är fortfarande tillåtet utan avtal", async () => {
    await funcs.satAvtalsstatus.run({ data: { orgId: "orgPubUtanAvtal", avtalsstatus: "pausad" }, auth: { uid: "levPub" } });
    const snap = await db.collection("organisationer").doc("orgPubUtanAvtal").get();
    vantaSig(snap.data().avtalsstatus === "pausad", "avtalsstatus borde ha blivit 'pausad'");
  });

  await test("...och 'offert'/'signerat' är fortfarande tillåtet utan avtal", async () => {
    await funcs.satAvtalsstatus.run({ data: { orgId: "orgPubUtanAvtal", avtalsstatus: "signerat" }, auth: { uid: "levPub" } });
    const snap = await db.collection("organisationer").doc("orgPubUtanAvtal").get();
    vantaSig(snap.data().avtalsstatus === "signerat", "avtalsstatus borde ha blivit 'signerat'");
  });

  console.log("\nsatPubAvtal");
  await test("en icke-plattformsadmin kan INTE registrera ett PUB-avtal", () =>
    forvantaFel("permission-denied", () =>
      funcs.satPubAvtal.run({
        data: { orgId: "orgPubUtanAvtal", tecknat: true, version: "1.0" },
        auth: { uid: "nagonAnnan" },
      })
    )
  );

  await test("tecknat:true utan version ger invalid-argument", () =>
    forvantaFel("invalid-argument", () =>
      funcs.satPubAvtal.run({ data: { orgId: "orgPubUtanAvtal", tecknat: true }, auth: { uid: "levPub" } })
    )
  );

  await test("en plattformsadmin KAN registrera ett PUB-avtal", async () => {
    await funcs.satPubAvtal.run({
      data: { orgId: "orgPubUtanAvtal", tecknat: true, version: "2026-08-29" },
      auth: { uid: "levPub" },
    });
    const snap = await db.collection("organisationer").doc("orgPubUtanAvtal").get();
    vantaSig(Boolean(snap.data().pubAvtalTecknat), "pubAvtalTecknat borde vara satt");
    vantaSig(snap.data().pubAvtalVersion === "2026-08-29", "fel pubAvtalVersion");
  });

  await test("EFTER registrering går det att sätta 'aktiv'", async () => {
    await funcs.satAvtalsstatus.run({ data: { orgId: "orgPubUtanAvtal", avtalsstatus: "aktiv" }, auth: { uid: "levPub" } });
    const snap = await db.collection("organisationer").doc("orgPubUtanAvtal").get();
    vantaSig(snap.data().avtalsstatus === "aktiv", "avtalsstatus borde nu vara 'aktiv'");
  });

  await test("en organisation som redan ÄR aktiv med ett tecknat avtal kan sättas 'aktiv' igen (no-op)", async () => {
    await funcs.satAvtalsstatus.run({ data: { orgId: "orgPubUtanAvtal", avtalsstatus: "aktiv" }, auth: { uid: "levPub" } });
  });

  console.log("\nsatUnderbitradeUnderrattad");
  await test("en plattformsadmin KAN registrera en underrättelse", async () => {
    await funcs.satUnderbitradeUnderrattad.run({
      data: { orgId: "orgPubUtanAvtal", version: "2026-08-28" },
      auth: { uid: "levPub" },
    });
    const snap = await db.collection("organisationer").doc("orgPubUtanAvtal").get();
    vantaSig(snap.data().underbitradeUnderrattad?.version === "2026-08-28", "fel version registrerad");
  });

  console.log("\nsatOmfattasAvNIS2");
  await test("en plattformsadmin KAN sätta NIS2-märkningen", async () => {
    await funcs.satOmfattasAvNIS2.run({ data: { orgId: "orgPubUtanAvtal", omfattasAvNIS2: true }, auth: { uid: "levPub" } });
    const snap = await db.collection("organisationer").doc("orgPubUtanAvtal").get();
    vantaSig(snap.data().omfattasAvNIS2 === true, "omfattasAvNIS2 borde vara true");
  });

  console.log("\nsatAtagandeblock");
  await test("en plattformsadmin KAN sätta åtagandeblocket", async () => {
    await funcs.satAtagandeblock.run({ data: { orgId: "orgPubUtanAvtal", text: "Utfallsgaranti 3 mån" }, auth: { uid: "levPub" } });
    const snap = await db.collection("organisationer").doc("orgPubUtanAvtal").get();
    vantaSig(snap.data().atagandeblock?.text === "Utfallsgaranti 3 mån", "fel text i åtagandeblocket");
  });

  console.log("\nbegarReferensunderlag");
  await test("en plattformsadmin KAN begära referensunderlag", async () => {
    await funcs.begarReferensunderlag.run({
      data: { orgId: "orgPubUtanAvtal", anledning: "Nytt anbud" },
      auth: { uid: "levPub" },
    });
    const snap = await db.collection("organisationer").doc("orgPubUtanAvtal").get();
    vantaSig(snap.data().referensunderlagBegart?.anledning === "Nytt anbud", "fel anledning registrerad");
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
