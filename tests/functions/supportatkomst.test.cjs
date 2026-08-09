// Etapp 50b: bevisar beviljaSupportAtkomst (bara superadmin, kräver anledning, sätter ett
// 6-timmarsfönster) och avslutaSupportAtkomst (superadmin ELLER plattformsadmin, tar bort
// fönstret i förtid, loggar med rätt aktörsroll).
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore \
//     "node tests/functions/supportatkomst.test.cjs"
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

async function forvantaFel(kod, promiseFn) {
  try {
    await promiseFn();
    throw new Error(`förväntade fel ${kod}, fick inget`);
  } catch (fel) {
    vantaSig(fel.code === kod, `fel kod: ${fel.code} (${fel.message})`);
  }
}

async function main() {
  const ORG = "orgSupport50b";
  await db.collection("organisationer").doc(ORG).set({ namn: "Supporttest AB", status: "aktiv" });
  await db.collection("users").doc("superSupport50b").set({ role: "superadmin", organisationId: ORG });
  await db.collection("users").doc("personalSupport50b").set({ role: "personal", organisationId: ORG });
  await db.collection("users").doc("annanOrgSuper50b").set({ role: "superadmin", organisationId: "annanOrg50b" });
  await db.collection("plattformsadmin").doc("levSupport50b").set({ blevPlattformsadmin: Date.now() });

  console.log("\nbeviljaSupportAtkomst – behörighet och effekt");
  await test("en icke-superadmin kan INTE bevilja supportåtkomst", () =>
    forvantaFel("permission-denied", () =>
      funcs.beviljaSupportAtkomst.run({ data: { anledning: "Test" }, auth: { uid: "personalSupport50b" } })
    )
  );
  await test("en tom anledning avvisas med invalid-argument", () =>
    forvantaFel("invalid-argument", () =>
      funcs.beviljaSupportAtkomst.run({ data: { anledning: "  " }, auth: { uid: "superSupport50b" } })
    )
  );
  await test("superadmin KAN bevilja supportåtkomst för sin egen organisation – ~6h framåt", async () => {
    const nu = Date.now();
    const resultat = await funcs.beviljaSupportAtkomst.run({
      data: { anledning: "Kunden ser inte sin nya rutin" },
      auth: { uid: "superSupport50b" },
    });
    vantaSig(!!resultat.till, "till saknas i svaret");
    const tillMs = new Date(resultat.till).getTime();
    const diffTimmar = (tillMs - nu) / (60 * 60 * 1000);
    vantaSig(diffTimmar > 5.9 && diffTimmar < 6.1, `fönstret var inte ~6h: ${diffTimmar}h`);
    const orgSnap = await db.collection("organisationer").doc(ORG).get();
    const data = orgSnap.data();
    vantaSig(data.supportAtkomstBeviljadAv === "superSupport50b", "supportAtkomstBeviljadAv fel");
    vantaSig(data.supportAtkomstAnledning === "Kunden ser inte sin nya rutin", "supportAtkomstAnledning fel");
    vantaSig(!!data.supportAtkomstTill, "supportAtkomstTill saknas");
  });
  await test("beviljandet loggas i organisationens egen revisionslogg", async () => {
    const logg = await db
      .collection("revisionslogg")
      .where("organisationId", "==", ORG)
      .where("handelsetyp", "==", "support_atkomst_beviljad")
      .get();
    vantaSig(logg.size === 1, `förväntade 1 loggpost, fick ${logg.size}`);
  });

  console.log("\navslutaSupportAtkomst – behörighet och effekt");
  await test("en superadmin i en ANNAN organisation kan INTE avsluta (ingen orgId, fel org)", () =>
    forvantaFel("failed-precondition", () =>
      funcs.avslutaSupportAtkomst.run({ data: {}, auth: { uid: "annanOrgSuper50b" } })
    )
  );
  await test("plattformsadmin KAN avsluta åt en organisation – tar bort fönstret", async () => {
    await funcs.avslutaSupportAtkomst.run({ data: { orgId: ORG }, auth: { uid: "levSupport50b" } });
    const orgSnap = await db.collection("organisationer").doc(ORG).get();
    const data = orgSnap.data();
    vantaSig(data.supportAtkomstTill === undefined, "supportAtkomstTill finns kvar");
    vantaSig(data.supportAtkomstBeviljadAv === undefined, "supportAtkomstBeviljadAv finns kvar");
    vantaSig(data.supportAtkomstAnledning === undefined, "supportAtkomstAnledning finns kvar");
  });
  await test("avslutandet loggas med aktorRoll plattformsadmin", async () => {
    const logg = await db
      .collection("revisionslogg")
      .where("organisationId", "==", ORG)
      .where("handelsetyp", "==", "support_atkomst_avslutad")
      .get();
    vantaSig(logg.size === 1, `förväntade 1 loggpost, fick ${logg.size}`);
    vantaSig(logg.docs[0].data().aktorRoll === "plattformsadmin", "fel aktorRoll");
  });
  await test("ett andra avslutförsök (inget fönster kvar) ger failed-precondition", () =>
    forvantaFel("failed-precondition", () =>
      funcs.avslutaSupportAtkomst.run({ data: { orgId: ORG }, auth: { uid: "levSupport50b" } })
    )
  );
  await test("superadmin KAN bevilja igen och sedan avsluta sin egen åtkomst", async () => {
    await funcs.beviljaSupportAtkomst.run({ data: { anledning: "Nytt ärende" }, auth: { uid: "superSupport50b" } });
    await funcs.avslutaSupportAtkomst.run({ data: {}, auth: { uid: "superSupport50b" } });
    const orgSnap = await db.collection("organisationer").doc(ORG).get();
    vantaSig(orgSnap.data().supportAtkomstTill === undefined, "supportAtkomstTill finns kvar efter eget avslut");
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
