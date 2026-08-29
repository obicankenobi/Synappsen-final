// Etapp L1p punkt 3 (intern/ETAPPLAN-INTERN-1.md): incidenter/{id} – plattformsnivå,
// skrivs ENDAST via startaIncident/kvitteraIncidentunderrattelse (Admin SDK).
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/incidenter.test.mjs"
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

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

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users", "superIncident"), { role: "superadmin", organisationId: "orgIncident" });
    await setDoc(doc(db, "plattformsadmin", "levIncident"), { blevPlattformsadmin: new Date() });
    await setDoc(doc(db, "incidenter", "inc1"), {
      kannedomTidpunkt: "2026-08-29T12:00:00.000Z",
      orgIds: ["orgIncident"],
      underrattelser: { orgIncident: { skickad: false } },
    });
  });

  const superadmin = testEnv.authenticatedContext("superIncident").firestore();
  const leverantor = testEnv.authenticatedContext("levIncident").firestore();
  const utloggad = testEnv.unauthenticatedContext().firestore();

  console.log("\nincidenter – läsning");
  await test("en plattformsadmin KAN läsa", () => assertSucceeds(getDoc(doc(leverantor, "incidenter", "inc1"))));
  await test("en superadmin i en kundorganisation kan INTE läsa", () =>
    assertFails(getDoc(doc(superadmin, "incidenter", "inc1")))
  );
  await test("en utloggad kan INTE läsa", () => assertFails(getDoc(doc(utloggad, "incidenter", "inc1"))));

  console.log("\nincidenter – ingen klient får NÅGONSIN skriva, inte ens en plattformsadmin");
  await test("kan INTE skapa en ny post direkt", () =>
    assertFails(setDoc(doc(leverantor, "incidenter", "forfalskad"), { orgIds: [] }))
  );
  await test("kan INTE uppdatera en befintlig post direkt", () =>
    assertFails(updateDoc(doc(leverantor, "incidenter", "inc1"), { orgIds: [] }))
  );
  await test("kan INTE ta bort en post", () => assertFails(deleteDoc(doc(leverantor, "incidenter", "inc1"))));

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  await testEnv.cleanup();
  if (antalMisslyckade > 0) {
    process.exit(1);
  }
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
