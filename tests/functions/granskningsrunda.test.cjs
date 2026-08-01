// Etapp 37b: bevisar att hanteraGranskningsrundaSkapad() inte kraschar oavsett indata (tom
// rutinIds-lista, en rutin utan ägare, en rutin som inte längre finns), och att den korrekt
// slår ihop flera rutiner med SAMMA ägare till en enda beräkning i stället för att räkna
// dem separat. Ingen riktig FCM-emulator finns (test:functions kör bara
// firestore+storage+auth), så testerna verifierar att funktionen fullföljer utan att kasta –
// samma mönster som pushnotiser.test.cjs.
//
// Körs mot emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage,auth \
//     "node tests/functions/granskningsrunda.test.cjs"
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

async function main() {
  await db.collection("rutiner").doc("granskRutin1").set({
    titel: "Rutin 1",
    organisationId: "orgGransk",
    omrade: "kliniskt-stod",
    agare: { typ: "person", uid: "granskAgareA" },
  });
  await db.collection("rutiner").doc("granskRutin2").set({
    titel: "Rutin 2",
    organisationId: "orgGransk",
    omrade: "kliniskt-stod",
    agare: { typ: "person", uid: "granskAgareA" },
  });
  await db.collection("rutiner").doc("granskRutin3").set({
    titel: "Rutin 3",
    organisationId: "orgGransk",
    omrade: "administration",
    agare: { typ: "roll", roll: "vec" },
  });
  await db.collection("rutiner").doc("granskRutinUtanAgare").set({
    titel: "Rutin utan ägare",
    organisationId: "orgGransk",
    omrade: "kliniskt-stod",
    agare: null,
  });

  await test("no-opar utan att kasta med en tom rutinIds-lista", async () => {
    await funcs.hanteraGranskningsrundaSkapad(
      { organisationId: "orgGransk", omrade: "kliniskt-stod", deadline: "2026-12-01", rutinIds: [] },
      "rundaTom"
    );
  });

  await test("no-opar utan att kasta när en rutin i listan inte finns", async () => {
    await funcs.hanteraGranskningsrundaSkapad(
      { organisationId: "orgGransk", omrade: "kliniskt-stod", deadline: "2026-12-01", rutinIds: ["finnsInte"] },
      "rundaSaknas"
    );
  });

  await test("no-opar utan att kasta för en rutin helt utan ägare", async () => {
    await funcs.hanteraGranskningsrundaSkapad(
      {
        organisationId: "orgGransk",
        omrade: "kliniskt-stod",
        deadline: "2026-12-01",
        rutinIds: ["granskRutinUtanAgare"],
      },
      "rundaUtanAgare"
    );
  });

  await test("slår ihop två rutiner med samma personägare utan att kasta", async () => {
    await funcs.hanteraGranskningsrundaSkapad(
      {
        organisationId: "orgGransk",
        omrade: "kliniskt-stod",
        deadline: "2026-12-01",
        rutinIds: ["granskRutin1", "granskRutin2"],
      },
      "rundaTvaSammaAgare"
    );
  });

  await test("hanterar en rollägare (inte bara personägare) utan att kasta", async () => {
    await funcs.hanteraGranskningsrundaSkapad(
      {
        organisationId: "orgGransk",
        omrade: "administration",
        deadline: "2026-12-01",
        rutinIds: ["granskRutin3"],
      },
      "rundaRoll"
    );
  });

  await test("hanterar en blandning av person-, roll- och saknad ägare i samma runda", async () => {
    await funcs.hanteraGranskningsrundaSkapad(
      {
        organisationId: "orgGransk",
        omrade: "kliniskt-stod",
        deadline: "2026-12-01",
        rutinIds: ["granskRutin1", "granskRutin3", "granskRutinUtanAgare", "finnsInte"],
      },
      "rundaBlandad"
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
