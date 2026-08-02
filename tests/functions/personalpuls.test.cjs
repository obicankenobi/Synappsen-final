// Etapp 39c: anonym personalpuls. Bevisar att svaraPersonalpuls() aggregerar korrekt (aldrig
// skriver ett enskilt svar), spärrar dubbelinskick samma kvartal, och validerar indata.
//
// Körs mot emulatorerna:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage,auth \
//     "node tests/functions/personalpuls.test.cjs"
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

async function vantaSigKastar(lofte, meddelande) {
  try {
    await lofte;
    throw new Error(meddelande);
  } catch (fel) {
    if (fel.message === meddelande) throw fel;
  }
}

async function main() {
  const orgId = "orgPuls39c";
  await db.collection("organisationer").doc(orgId).set({ namn: "Puls-org" });
  await db.collection("users").doc("pulsAnv1").set({ organisationId: orgId, role: "personal" });
  await db.collection("users").doc("pulsAnv2").set({ organisationId: orgId, role: "personal" });
  await db.collection("users").doc("pulsAnv3").set({ organisationId: orgId, role: "personal" });

  const kvartal = funcs.beraknaKvartal();

  console.log("\nsvaraPersonalpuls");
  await test("ett giltigt svar aggregeras, inget enskilt svar sparas", async () => {
    await funcs.svaraPersonalpuls.run({
      data: { omrade: "kliniskt-stod", svar1: 4, svar2: 5, svar3: 3 },
      auth: { uid: "pulsAnv1" },
    });
    const resultat = (
      await db.collection("organisationer").doc(orgId).collection("personalpulsResultat").doc(`kliniskt-stod_${kvartal}`).get()
    ).data();
    vantaSig(resultat.antalSvar === 1, `antalSvar: ${resultat.antalSvar}`);
    vantaSig(resultat.summaFraga1 === 4, `summaFraga1: ${resultat.summaFraga1}`);
    vantaSig(resultat.summaFraga2 === 5, `summaFraga2: ${resultat.summaFraga2}`);
    vantaSig(resultat.summaFraga3 === 3, `summaFraga3: ${resultat.summaFraga3}`);
    vantaSig(Object.keys(resultat).every((f) => f !== "uid" && f !== "svarAv"), "resultatet innehöll ett fält som pekar på svaranden");
  });

  await test("ett andra svar samma kvartal, samma område, läggs till i summan", async () => {
    await funcs.svaraPersonalpuls.run({
      data: { omrade: "kliniskt-stod", svar1: 2, svar2: 2, svar3: 2 },
      auth: { uid: "pulsAnv2" },
    });
    const resultat = (
      await db.collection("organisationer").doc(orgId).collection("personalpulsResultat").doc(`kliniskt-stod_${kvartal}`).get()
    ).data();
    vantaSig(resultat.antalSvar === 2, `antalSvar: ${resultat.antalSvar}`);
    vantaSig(resultat.summaFraga1 === 6, `summaFraga1: ${resultat.summaFraga1}`);
  });

  await test("samma användare kan INTE svara två gånger samma kvartal", async () => {
    await vantaSigKastar(
      funcs.svaraPersonalpuls.run({
        data: { omrade: "kliniskt-stod", svar1: 1, svar2: 1, svar3: 1 },
        auth: { uid: "pulsAnv1" },
      }),
      "borde ha kastat already-exists"
    );
    const resultat = (
      await db.collection("organisationer").doc(orgId).collection("personalpulsResultat").doc(`kliniskt-stod_${kvartal}`).get()
    ).data();
    vantaSig(resultat.antalSvar === 2, "dubbelinskicket räknades ändå med");
  });

  await test("ett ogiltigt område avvisas", async () => {
    await vantaSigKastar(
      funcs.svaraPersonalpuls.run({
        data: { omrade: "hittepa", svar1: 3, svar2: 3, svar3: 3 },
        auth: { uid: "pulsAnv1" },
      }),
      "borde ha kastat invalid-argument"
    );
  });

  await test("ett svar utanför 1-5 avvisas", async () => {
    await vantaSigKastar(
      funcs.svaraPersonalpuls.run({
        data: { omrade: "administration", svar1: 6, svar2: 3, svar3: 3 },
        auth: { uid: "pulsAnv1" },
      }),
      "borde ha kastat invalid-argument"
    );
  });

  await test("en annan användare som svarar för ett annat område skapar en egen resultatpost", async () => {
    await funcs.svaraPersonalpuls.run({
      data: { omrade: "administration", svar1: 5, svar2: 5, svar3: 5 },
      auth: { uid: "pulsAnv3" },
    });
    const resultat = (
      await db.collection("organisationer").doc(orgId).collection("personalpulsResultat").doc(`administration_${kvartal}`).get()
    ).data();
    vantaSig(resultat.antalSvar === 1, `antalSvar: ${resultat.antalSvar}`);
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
