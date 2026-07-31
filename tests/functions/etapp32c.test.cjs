// Etapp 32c: rolländring, moduler på/av, 2FA-policy och budgettak flyttades från direkta
// klient-skrivningar till egna Cloud Functions, så att varje ändring loggas i revisionsloggen.
// Bevisar dels att loggning faktiskt sker, dels de behörighetskontroller som INTE kan testas
// via firestore.rules längre (funktionerna använder Admin SDK och kringgår reglerna helt).
//
// Körs mot emulatorerna:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage \
//     "node tests/functions/etapp32c.test.cjs"
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
  await db.collection("users").doc("super32c").set({ role: "superadmin", organisationId: "org32c" });
  await db.collection("users").doc("volAtt32c").set({ role: "vol", organisationId: "org32c" });
  await db.collection("users").doc("volAnnanOrg32c").set({ role: "vol", organisationId: "annanOrg32c" });
  await db.collection("organisationer").doc("org32c").set({ namn: "32c Testkund", moduler: { operations: false } });
  await db.collection("plattformsadmin").doc("plattform32c").set({ blevPlattformsadmin: true });
  await db.collection("users").doc("plattform32c").set({ role: "personal", organisationId: "annanOrg32c" });

  console.log("\nuppdateraAnvandarRoll");
  await test("superadmin kan ändra en roll i sin egen organisation, och det loggas", async () => {
    await funcs.uppdateraAnvandarRoll.run({
      data: { userId: "volAtt32c", roll: "sektionsledare" },
      auth: { uid: "super32c" },
    });
    const anvandare = (await db.collection("users").doc("volAtt32c").get()).data();
    vantaSig(anvandare.role === "sektionsledare", "rollen skrevs inte");
    const post = await senastePostAvTyp("org32c", "anvandare_roll_andrad");
    vantaSig(Boolean(post), "ingen anvandare_roll_andrad-post hittades");
    vantaSig(post.sammanfattning.includes("vol") && post.sammanfattning.includes("sektionsledare"), "sammanfattningen saknar gammal/ny roll");
  });
  await test("en icke-superadmin kan INTE ändra roller", async () => {
    await vantaSigKastar(
      funcs.uppdateraAnvandarRoll.run({ data: { userId: "volAtt32c", roll: "vec" }, auth: { uid: "volAtt32c" } }),
      "borde ha kastat permission-denied"
    );
  });
  await test("superadmin kan INTE ändra en roll i en ANNAN organisation", async () => {
    await vantaSigKastar(
      funcs.uppdateraAnvandarRoll.run({ data: { userId: "volAnnanOrg32c", roll: "superadmin" }, auth: { uid: "super32c" } }),
      "borde ha kastat permission-denied"
    );
  });
  await test("en ogiltig roll avvisas", async () => {
    await vantaSigKastar(
      funcs.uppdateraAnvandarRoll.run({ data: { userId: "volAtt32c", roll: "diktator" }, auth: { uid: "super32c" } }),
      "borde ha kastat invalid-argument"
    );
  });

  console.log("\nuppdateraModuler");
  await test("superadmin kan slå på en modul, och det loggas", async () => {
    await funcs.uppdateraModuler.run({
      data: { modul: "operations", paslagen: true },
      auth: { uid: "super32c" },
    });
    const org = (await db.collection("organisationer").doc("org32c").get()).data();
    vantaSig(org.moduler.operations === true, "modulen slogs inte på");
    const post = await senastePostAvTyp("org32c", "organisation_modul_andrad");
    vantaSig(Boolean(post), "ingen organisation_modul_andrad-post hittades");
  });
  await test("en ogiltig modul avvisas", async () => {
    await vantaSigKastar(
      funcs.uppdateraModuler.run({ data: { modul: "hittepa", paslagen: true }, auth: { uid: "super32c" } }),
      "borde ha kastat invalid-argument"
    );
  });

  console.log("\nuppdateraMfaPolicy");
  await test("superadmin kan kräva 2FA för en roll, och det loggas", async () => {
    await funcs.uppdateraMfaPolicy.run({
      data: { kravMfaForRoller: ["superadmin", "vol"] },
      auth: { uid: "super32c" },
    });
    const org = (await db.collection("organisationer").doc("org32c").get()).data();
    vantaSig(JSON.stringify(org.sakerhet.kravMfaForRoller) === JSON.stringify(["superadmin", "vol"]), "policyn skrevs inte");
    const post = await senastePostAvTyp("org32c", "organisation_mfapolicy_andrad");
    vantaSig(Boolean(post), "ingen organisation_mfapolicy_andrad-post hittades");
  });
  await test("en lista med en ogiltig roll avvisas", async () => {
    await vantaSigKastar(
      funcs.uppdateraMfaPolicy.run({ data: { kravMfaForRoller: ["kung"] }, auth: { uid: "super32c" } }),
      "borde ha kastat invalid-argument"
    );
  });

  console.log("\nuppdateraGeminiBudgetTak");
  await test("superadmin kan ändra budgettaket, och det loggas", async () => {
    await funcs.uppdateraGeminiBudgetTak.run({ data: { taketOre: 50000 }, auth: { uid: "super32c" } });
    const budget = (
      await db.collection("organisationer").doc("org32c").collection("installningar").doc("geminiBudget").get()
    ).data();
    vantaSig(budget.taketOre === 50000, "budgettaket skrevs inte");
    const post = await senastePostAvTyp("org32c", "organisation_budgettak_andrad");
    vantaSig(Boolean(post), "ingen organisation_budgettak_andrad-post hittades");
  });
  await test("ett negativt tak avvisas", async () => {
    await vantaSigKastar(
      funcs.uppdateraGeminiBudgetTak.run({ data: { taketOre: -1 }, auth: { uid: "super32c" } }),
      "borde ha kastat invalid-argument"
    );
  });

  console.log("\nlistaOrganisationer / manadsrapportOrganisationer – plattformsadmins åtkomst loggas");
  await test("listaOrganisationer loggar plattform_organisationer_listade", async () => {
    await funcs.listaOrganisationer.run({ auth: { uid: "plattform32c" } });
    const post = await senastePostAvTyp("_plattform", "plattform_organisationer_listade");
    vantaSig(Boolean(post), "ingen plattform_organisationer_listade-post hittades");
    vantaSig(post.aktorUid === "plattform32c", "fel aktör loggades");
  });
  await test("manadsrapportOrganisationer loggar plattform_manadsrapport_hamtad", async () => {
    await funcs.manadsrapportOrganisationer.run({ auth: { uid: "plattform32c" } });
    const post = await senastePostAvTyp("_plattform", "plattform_manadsrapport_hamtad");
    vantaSig(Boolean(post), "ingen plattform_manadsrapport_hamtad-post hittades");
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  process.exit(antalMisslyckade > 0 ? 1 : 0);
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
