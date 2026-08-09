// Etapp 50b: bevisar farSupportlasa()-mönstret isolerat, som ETAPPLAN10.md §50b uttryckligen
// kräver INNAN det kopplas in i en riktig UI-yta – en plattformsadmin får läsa en organisations
// INNEHÅLL (rutiner här som representant för de fyra gatade collectionerna) ENDAST inom ett
// kundbeviljat, tidsbegränsat fönster (organisationer/{orgId}.supportAtkomstTill), aldrig
// utanför det, aldrig om organisationen är pausad, och fälten går INTE att sätta direkt av
// en klient (bara via beviljaSupportAtkomst/avslutaSupportAtkomst, Admin SDK).
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/supportatkomst.test.mjs"
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDoc, getDocs, collection, query, where, setDoc, updateDoc } from "firebase/firestore";

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
    console.error(`       ${fel.message}`);
  }
}

async function main() {
  const testEnv = await initializeTestEnvironment({
    projectId: "demo-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });

  const OM_EN_TIMME = new Date(Date.now() + 60 * 60 * 1000);
  const FOR_EN_TIMME_SEDAN = new Date(Date.now() - 60 * 60 * 1000);

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users", "superSupport"), { role: "superadmin", organisationId: "orgSupport" });
    await setDoc(doc(db, "plattformsadmin", "levSupport"), { blevPlattformsadmin: new Date() });
    await setDoc(doc(db, "organisationer", "orgSupport"), { namn: "Supporttest AB", status: "aktiv" });
    await setDoc(doc(db, "organisationer", "orgSupportPausad"), {
      namn: "Pausad AB",
      status: "pausad",
      supportAtkomstTill: OM_EN_TIMME,
    });
    await setDoc(doc(db, "organisationer", "orgSupportUtgangen"), {
      namn: "Utgången AB",
      status: "aktiv",
      supportAtkomstTill: FOR_EN_TIMME_SEDAN,
    });
    await setDoc(doc(db, "rutiner", "r1"), { organisationId: "orgSupport", titel: "Hemlig rutin", status: "godkand", omrade: "kliniskt-stod" });
  });

  const lev = testEnv.authenticatedContext("levSupport").firestore();
  const super1 = testEnv.authenticatedContext("superSupport").firestore();

  console.log("\nfarSupportlasa – utan ett aktivt fönster");
  await test("en plattformsadmin kan INTE läsa rutinen utan ett supportfönster", () =>
    assertFails(getDocs(query(collection(lev, "rutiner"), where("organisationId", "==", "orgSupport"))))
  );

  console.log("\nfarSupportlasa – med ett aktivt fönster");
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), "organisationer", "orgSupport"), {
      supportAtkomstTill: OM_EN_TIMME,
      supportAtkomstBeviljadAv: "superSupport",
      supportAtkomstAnledning: "Test",
    });
  });
  await test("en plattformsadmin KAN läsa rutinen inom ett aktivt fönster", () =>
    assertSucceeds(getDocs(query(collection(lev, "rutiner"), where("organisationId", "==", "orgSupport"))))
  );
  await test("organisationens egen superadmin påverkas inte (läser som vanligt)", () =>
    assertSucceeds(getDoc(doc(super1, "rutiner", "r1")))
  );

  console.log("\nfarSupportlasa – utgånget fönster");
  await test("en plattformsadmin kan INTE läsa efter att fönstret gått ut", () =>
    assertFails(getDocs(query(collection(lev, "rutiner"), where("organisationId", "==", "orgSupportUtgangen"))))
  );

  console.log("\nfarSupportlasa – pausad organisation, trots aktivt fönster");
  await test("en plattformsadmin kan INTE läsa en pausad organisations innehåll", () =>
    assertFails(getDocs(query(collection(lev, "rutiner"), where("organisationId", "==", "orgSupportPausad"))))
  );

  console.log("\norganisationer/{orgId} – supportAtkomst-fälten skrivs ENDAST via Admin SDK");
  await test("en superadmin kan INTE ÄNDRA supportAtkomstTill direkt (t.ex. förlänga fönstret)", () =>
    assertFails(
      updateDoc(doc(super1, "organisationer", "orgSupport"), {
        supportAtkomstTill: new Date(Date.now() + 2 * 60 * 60 * 1000),
      })
    )
  );
  await test("en superadmin kan INTE ta bort supportAtkomstTill direkt", () =>
    assertFails(
      updateDoc(doc(super1, "organisationer", "orgSupport"), {
        supportAtkomstTill: null,
      })
    )
  );

  await testEnv.cleanup();

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  if (antalMisslyckade > 0) {
    process.exit(1);
  }
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
