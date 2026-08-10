// Etapp 24b: bevisar push-hjälparnas urvalslogik mot Firestore-emulatorn. Ingen riktig FCM-
// emulator finns (test:functions kör bara firestore+storage+auth), så testerna nöjer sig med
// att kontrollera VILKA mottagare som väljs ut (hamtaAnvandareMedPushPreferens) och att
// skickaPush inte kraschar/anropar nätverket när ingen av mottagarna har någon pushTokens
// (vilket är fallet för alla testanvändare här – ingen riktig enhet är registrerad).
//
// Körs mot emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage,auth \
//     "node tests/functions/pushnotiser.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "demo-test";
process.env.GCP_PROJECT = "demo-test";

const path = require("node:path");
const admin = require(
  require.resolve("firebase-admin", { paths: [path.join(__dirname, "../../functions")] })
);
const funcs = require("../../functions/index.js");

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
  const db = admin.firestore();

  await test("hamtaAnvandareMedPushPreferens hittar bara rätt organisation + preferens", async () => {
    await db.collection("users").doc("pushA1").set({
      organisationId: "orgPush1",
      role: "personal",
      pushInstallningar: { nyRutin: true },
    });
    await db.collection("users").doc("pushA2").set({
      organisationId: "orgPush1",
      role: "personal",
      pushInstallningar: { nyRutin: false },
    });
    await db.collection("users").doc("pushA3").set({
      organisationId: "orgPush2",
      role: "personal",
      pushInstallningar: { nyRutin: true },
    });
    const mottagare = await funcs.hamtaAnvandareMedPushPreferens("orgPush1", "nyRutin");
    vantaSig(mottagare.length === 1, `förväntade 1 mottagare, fick ${mottagare.length}`);
    vantaSig(mottagare[0].id === "pushA1", "fel användare valdes ut");
  });

  await test("hamtaAnvandareMedPushPreferens respekterar extraFilter", async () => {
    await db.collection("users").doc("pushB1").set({
      organisationId: "orgPush3",
      role: "forradesansvarig",
      pushInstallningar: { bristanmalan: true },
    });
    await db.collection("users").doc("pushB2").set({
      organisationId: "orgPush3",
      role: "personal",
      pushInstallningar: { bristanmalan: true },
    });
    const mottagare = await funcs.hamtaAnvandareMedPushPreferens(
      "orgPush3",
      "bristanmalan",
      (a) => a.role === "forradesansvarig"
    );
    vantaSig(mottagare.length === 1 && mottagare[0].id === "pushB1", "extraFilter filtrerade inte korrekt");
  });

  await test("skickaPush no-opar tyst utan att kasta när ingen mottagare har en token", async () => {
    const anvandare = [{ id: "pushC1", pushTokens: [] }, { id: "pushC2" }];
    await funcs.skickaPush(anvandare, { titel: "Test", body: "Body", url: "/" });
  });

  await test("hanteraBristanmalningSkapad kraschar inte, oavsett om mottagare hittas", async () => {
    await funcs.hanteraBristanmalningSkapad(
      { organisationId: "orgPush3", artikelNamn: "Handskar" },
      "bristTest1"
    );
  });

  await test("kontrolleraKvitteringsfrister markerar mottagare i pushPaminnelseSkickadTill", async () => {
    const organisationId = "orgPushFrist";
    await db.collection("users").doc("pushD1").set({
      organisationId,
      role: "personal",
      pushInstallningar: { anslagsfrist: true },
    });
    await db.collection("users").doc("pushD2").set({
      organisationId,
      role: "personal",
      pushInstallningar: { anslagsfrist: false },
      // Etapp 53c: e-post är opt-OUT (motsatt förval av push) – utan denna rad skulle pushD2
      // bli e-postmottagare trots att push är avstängt, och alltså ändå markeras påmind.
      epostInstallningar: { paminnelser: false },
    });
    const imorgon = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await db.collection("anslag").doc("anslagFrist1").set({
      organisationId,
      titel: "Viktig information",
      kvitteringsfrist: imorgon,
      lasteAv: [],
    });

    await funcs.kontrolleraKvitteringsfrister();

    const anslag = await db.collection("anslag").doc("anslagFrist1").get();
    const paminda = anslag.data().pushPaminnelseSkickadTill ?? [];
    vantaSig(paminda.includes("pushD1"), "pushD1 (preferens på) borde ha markerats påmind");
    vantaSig(!paminda.includes("pushD2"), "pushD2 (preferens av) borde INTE ha markerats påmind");
  });

  await test("kontrolleraKvitteringsfrister hoppar över redan kvitterade och borttagna anslag", async () => {
    const organisationId = "orgPushFrist2";
    await db.collection("users").doc("pushE1").set({
      organisationId,
      role: "personal",
      pushInstallningar: { anslagsfrist: true },
    });
    const imorgon = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await db.collection("anslag").doc("anslagKvitterat").set({
      organisationId,
      titel: "Redan läst",
      kvitteringsfrist: imorgon,
      lasteAv: [{ uid: "pushE1", tidpunkt: new Date().toISOString() }],
    });
    await db.collection("anslag").doc("anslagBorttaget").set({
      organisationId,
      titel: "Borttaget",
      kvitteringsfrist: imorgon,
      lasteAv: [],
      borttagen: true,
    });

    await funcs.kontrolleraKvitteringsfrister();

    const kvitterat = await db.collection("anslag").doc("anslagKvitterat").get();
    vantaSig(
      !(kvitterat.data().pushPaminnelseSkickadTill ?? []).includes("pushE1"),
      "en användare som redan kvitterat ska inte påminnas"
    );
    const borttaget = await db.collection("anslag").doc("anslagBorttaget").get();
    vantaSig(
      !borttaget.data().pushPaminnelseSkickadTill,
      "ett mjukt borttaget anslag ska aldrig behandlas"
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
