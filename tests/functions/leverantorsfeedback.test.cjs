// Etapp L1 beslutspunkt 7 (avgjord 2026-08-30): en EGEN kanal till leverantören
// (leverantorsfeedback), skild från kundens interna feedback-collection som leverantören
// aldrig ser.
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore \
//     "node tests/functions/leverantorsfeedback.test.cjs"
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
  await db.collection("plattformsadmin").doc("levFeedback").set({ blevPlattformsadmin: Date.now() });
  await db.collection("users").doc("superFeedback").set({
    role: "superadmin",
    organisationId: "orgFeedback",
    namn: "Test Superadmin",
  });
  await db.collection("users").doc("kioskFeedback").set({ role: "kiosk", organisationId: "orgFeedback" });

  console.log("\nskickaLeverantorsfeedback");
  await test("kräver inloggning", () =>
    forvantaFel("unauthenticated", () => funcs.skickaLeverantorsfeedback.run({ data: { text: "Hej" }, auth: null }))
  );

  await test("kräver text", () =>
    forvantaFel("invalid-argument", () =>
      funcs.skickaLeverantorsfeedback.run({ data: { text: "" }, auth: { uid: "superFeedback" } })
    )
  );

  await test("nekar personnummer", () =>
    // 900101-0017 är Skatteverkets kända test-personnummer (giltig Luhn-checksumma), samma
    // som används i tests/functions/epost.test.cjs.
    forvantaFel("invalid-argument", () =>
      funcs.skickaLeverantorsfeedback.run({
        data: { text: "Mitt personnummer är 900101-0017" },
        auth: { uid: "superFeedback" },
      })
    )
  );

  await test("kiosk kan INTE skicka", () =>
    forvantaFel("permission-denied", () =>
      funcs.skickaLeverantorsfeedback.run({ data: { text: "Hej" }, auth: { uid: "kioskFeedback" } })
    )
  );

  let feedbackId;
  await test("en vanlig användare kan skicka, hamnar i EN ANNAN collection än feedback", async () => {
    const resultat = await funcs.skickaLeverantorsfeedback.run({
      data: { text: "Kan ni lägga till X?" },
      auth: { uid: "superFeedback" },
    });
    feedbackId = resultat.id;
    const snap = await db.collection("leverantorsfeedback").doc(feedbackId).get();
    vantaSig(snap.exists, "posten skrevs inte till leverantorsfeedback");
    vantaSig(snap.data().organisationId === "orgFeedback", "fel organisationId");
    vantaSig(snap.data().last === false, "en ny post ska vara omärkt (last: false)");
    const feedbackSnap = await db.collection("feedback").where("skapadAv", "==", "superFeedback").get();
    vantaSig(feedbackSnap.empty, "posten läckte in i den vanliga feedback-collectionen");
  });

  console.log("\nhamtaLeverantorsfeedback / markeraLeverantorsfeedbackLast");
  await test("en icke-plattformsadmin kan INTE läsa inkorgen", () =>
    forvantaFel("permission-denied", () => funcs.hamtaLeverantorsfeedback.run({ data: {}, auth: { uid: "superFeedback" } }))
  );

  await test("en plattformsadmin kan läsa inkorgen, tvärs organisationer", async () => {
    const resultat = await funcs.hamtaLeverantorsfeedback.run({ data: {}, auth: { uid: "levFeedback" } });
    const rad = resultat.poster.find((p) => p.id === feedbackId);
    vantaSig(Boolean(rad), "den skickade posten syns inte i inkorgen");
    vantaSig(typeof rad.skapad === "string", "skapad borde vara en ISO-sträng, inte en rå Timestamp");
  });

  await test("en icke-plattformsadmin kan INTE markera som läst", () =>
    forvantaFel("permission-denied", () =>
      funcs.markeraLeverantorsfeedbackLast.run({ data: { id: feedbackId }, auth: { uid: "superFeedback" } })
    )
  );

  await test("en plattformsadmin kan markera som läst", async () => {
    await funcs.markeraLeverantorsfeedbackLast.run({ data: { id: feedbackId }, auth: { uid: "levFeedback" } });
    const snap = await db.collection("leverantorsfeedback").doc(feedbackId).get();
    vantaSig(snap.data().last === true, "last uppdaterades inte");
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
