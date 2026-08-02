// Etapp 39d: referensunderlag för säljmaterial. Bevisar att exporten (1) kräver superadmin,
// (2) kräver ett AKTIVT samtycke i varje enskilt anrop, (3) ALDRIG innehåller kundens namn
// eller organisationId i svaret, och (4) loggas i revisionsloggen.
//
// Körs mot emulatorerna:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage,auth \
//     "node tests/functions/referensunderlag.test.cjs"
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

async function senastePostAvTyp(organisationId, handelsetyp) {
  const snap = await db
    .collection("revisionslogg")
    .where("organisationId", "==", organisationId)
    .orderBy("tidpunkt", "desc")
    .get();
  return snap.docs.map((d) => d.data()).find((p) => p.handelsetyp === handelsetyp);
}

async function main() {
  const orgId = "orgReferens39d";
  await db.collection("organisationer").doc(orgId).set({ namn: "Hemlig Akutmottagning AB" });
  await db.collection("users").doc("superReferens39d").set({ role: "superadmin", organisationId: orgId });
  await db.collection("users").doc("volReferens39d").set({ role: "vol", organisationId: orgId });
  await db.collection("users").doc("anv1Referens39d").set({ organisationId: orgId, role: "personal" });
  await db.collection("organisationer").doc(orgId).collection("matvardenSnapshots").doc("2026-07-27").set({
    datum: "2026-07-27",
    kvitteringsgradKlinisktStod: 70,
    andelNollTraffar: 12,
  });
  await db.collection("organisationer").doc(orgId).collection("matvardenSnapshots").doc("2026-08-03").set({
    datum: "2026-08-03",
    kvitteringsgradKlinisktStod: 82,
    andelNollTraffar: 9,
    tidAttHittaSekunder: 14,
    innehallshalsaKlinisktStod: 91,
  });

  console.log("\nexporteraReferensunderlag");
  await test("en icke-superadmin kan INTE exportera", async () => {
    await vantaSigKastar(
      funcs.exporteraReferensunderlag.run({
        data: { samtycke: true },
        auth: { uid: "volReferens39d" },
      }),
      "borde ha kastat permission-denied"
    );
  });

  await test("superadmin kan INTE exportera utan att aktivt bekräfta samtycke", async () => {
    await vantaSigKastar(
      funcs.exporteraReferensunderlag.run({ data: { samtycke: false }, auth: { uid: "superReferens39d" } }),
      "borde ha kastat failed-precondition"
    );
    await vantaSigKastar(
      funcs.exporteraReferensunderlag.run({ data: {}, auth: { uid: "superReferens39d" } }),
      "borde ha kastat failed-precondition"
    );
  });

  await test("superadmin med bekräftat samtycke får ett anonymiserat underlag och det loggas", async () => {
    const resultat = await funcs.exporteraReferensunderlag.run({
      data: { samtycke: true },
      auth: { uid: "superReferens39d" },
    });
    vantaSig(resultat.antalAnstallda === 3, `antalAnstallda: ${resultat.antalAnstallda}`);
    vantaSig(resultat.kvitteringsgradKlinisktStod === 82, "hämtade inte senaste snapshoten");
    vantaSig(resultat.andelNollTraffar === 9, "andelNollTraffar fel");
    vantaSig(resultat.tidAttHittaSekunder === 14, "tidAttHittaSekunder fel");

    const somText = JSON.stringify(resultat).toLowerCase();
    vantaSig(!somText.includes("hemlig"), "underlaget läckte organisationens namn");
    vantaSig(!somText.includes(orgId.toLowerCase()), "underlaget läckte organisationens id");
    vantaSig(!("namn" in resultat) && !("organisationId" in resultat) && !("orgnr" in resultat), "underlaget hade ett identifierande fält");

    const post = await senastePostAvTyp(orgId, "referensunderlag_exporterat");
    vantaSig(Boolean(post), "ingen referensunderlag_exporterat-post hittades");
    vantaSig(post.aktorUid === "superReferens39d", "fel aktör loggades");
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
