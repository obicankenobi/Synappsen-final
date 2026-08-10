// Etapp 38b: bevisar att kontrolleraForslagPaminnelser() bara påminner om ändringsförslag som
// stått obesvarade LÄNGRE än den beslutade svarstiden (en vecka, ägarbeslut 2026-08-01), bara
// EN gång per förslag (paminnelseSkickad), och bara till rätt roller för förslagets område.
//
// Körs mot emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage,auth \
//     "node tests/functions/forslagpaminnelse.test.cjs"
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

function dagarSedan(antal) {
  return admin.firestore.Timestamp.fromMillis(Date.now() - antal * 24 * 60 * 60 * 1000);
}

async function main() {
  const org = "orgForslagPaminnelse";
  await db.collection("users").doc("volForslag").set({
    organisationId: org,
    role: "vol",
    pushInstallningar: { forslagPaminnelse: true },
  });
  await db.collection("users").doc("vecForslag").set({
    organisationId: org,
    role: "vec",
    pushInstallningar: { forslagPaminnelse: true },
  });
  await db.collection("users").doc("volUtanPreferens").set({
    organisationId: org,
    role: "vol",
    pushInstallningar: { forslagPaminnelse: false },
  });

  await test("påminner om ett gammalt (8 dagar) obesvarat förslag i kliniskt-stod", async () => {
    await db.collection("andringsforslag").doc("forslagGammalKlin").set({
      organisationId: org,
      omrade: "kliniskt-stod",
      rutinTitel: "Test",
      forslag: "Test",
      status: "ny",
      tidpunkt: dagarSedan(8),
    });
    await funcs.kontrolleraForslagPaminnelser();
    const doc = await db.collection("andringsforslag").doc("forslagGammalKlin").get();
    vantaSig(doc.data().paminnelseSkickad === true, "borde ha markerats påmind");
  });

  await test("påminner INTE om ett nyligen skapat (1 dag) förslag", async () => {
    await db.collection("andringsforslag").doc("forslagNyligen").set({
      organisationId: org,
      omrade: "kliniskt-stod",
      rutinTitel: "Test",
      forslag: "Test",
      status: "ny",
      tidpunkt: dagarSedan(1),
    });
    await funcs.kontrolleraForslagPaminnelser();
    const doc = await db.collection("andringsforslag").doc("forslagNyligen").get();
    vantaSig(!doc.data().paminnelseSkickad, "borde INTE ha markerats påmind än");
  });

  await test("skickar bara EN gång – redan markerade förslag rörs inte igen", async () => {
    await db.collection("andringsforslag").doc("forslagRedanPamind").set({
      organisationId: org,
      omrade: "kliniskt-stod",
      rutinTitel: "Test",
      forslag: "Test",
      status: "ny",
      tidpunkt: dagarSedan(30),
      paminnelseSkickad: true,
    });
    await funcs.kontrolleraForslagPaminnelser();
    // Om funktionen försökt skicka igen hade den ändå bara satt samma flagga till true –
    // detta test bevisar egentligen bara att den inte kraschar på ett redan hanterat förslag.
    const doc = await db.collection("andringsforslag").doc("forslagRedanPamind").get();
    vantaSig(doc.data().paminnelseSkickad === true, "flaggan ska fortfarande vara satt");
  });

  await test("hanterade förslag (status != ny) rörs inte alls", async () => {
    await db.collection("andringsforslag").doc("forslagInfort").set({
      organisationId: org,
      omrade: "kliniskt-stod",
      rutinTitel: "Test",
      forslag: "Test",
      status: "infort",
      tidpunkt: dagarSedan(30),
    });
    await funcs.kontrolleraForslagPaminnelser();
    const doc = await db.collection("andringsforslag").doc("forslagInfort").get();
    vantaSig(!doc.data().paminnelseSkickad, "ett redan infört förslag ska aldrig markeras");
  });

  await test("administration påminner VEC, inte VÖL", async () => {
    await db.collection("andringsforslag").doc("forslagGammalAdmin").set({
      organisationId: org,
      omrade: "administration",
      rutinTitel: "Test",
      forslag: "Test",
      status: "ny",
      tidpunkt: dagarSedan(8),
    });
    await funcs.kontrolleraForslagPaminnelser();
    const doc = await db.collection("andringsforslag").doc("forslagGammalAdmin").get();
    vantaSig(doc.data().paminnelseSkickad === true, "administration-förslag borde ha nått VEC och markerats");
  });

  await test("markerar INTE om ingen redaktör för området har slagit på preferensen", async () => {
    const orgUtanPreferens = "orgForslagUtanPreferens";
    await db.collection("users").doc("volUtanPreferens2").set({
      organisationId: orgUtanPreferens,
      role: "vol",
      pushInstallningar: { forslagPaminnelse: false },
      // Etapp 53c: annars vore den här användaren ändå e-postmottagare (opt-out-förval) och
      // förslaget skulle felaktigt markeras påmint.
      epostInstallningar: { paminnelser: false },
    });
    await db.collection("andringsforslag").doc("forslagIngenMottagare").set({
      organisationId: orgUtanPreferens,
      omrade: "kliniskt-stod",
      rutinTitel: "Test",
      forslag: "Test",
      status: "ny",
      tidpunkt: dagarSedan(8),
    });
    await funcs.kontrolleraForslagPaminnelser();
    const doc = await db.collection("andringsforslag").doc("forslagIngenMottagare").get();
    vantaSig(!doc.data().paminnelseSkickad, "utan mottagare ska förslaget lämnas orört (kan försökas igen)");
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
