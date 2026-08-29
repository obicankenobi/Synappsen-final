// Etapp L1o (intern/ETAPPLAN-INTERN-1.md): atagandekalender/{id} – återkommande
// leverantörsskyldigheter. Ingen organisationskoppling (plattformsnivå), och ingen klient
// får NÅGONSIN skriva – kvittering ska alltid gå via sattAtagandeUtfort (Cloud Function) så
// att den revisionsloggas, precis som varje annan leverantörsåtgärd.
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/atagandekalender.test.mjs"
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

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
    await setDoc(doc(db, "users", "superAtagande"), { role: "superadmin", organisationId: "orgAtagande" });
    await setDoc(doc(db, "users", "personalAtagande"), { role: "personal", organisationId: "orgAtagande" });
    await setDoc(doc(db, "plattformsadmin", "levAtagande"), { blevPlattformsadmin: new Date() });
    await setDoc(doc(db, "atagandekalender", "nyckelrotation"), {
      vad: "Nyckelrotation",
      intervallManader: 12,
      senastUtfort: null,
    });
  });

  const superadmin = testEnv.authenticatedContext("superAtagande").firestore();
  const personal = testEnv.authenticatedContext("personalAtagande").firestore();
  const leverantor = testEnv.authenticatedContext("levAtagande").firestore();
  const utloggad = testEnv.unauthenticatedContext().firestore();

  console.log("\natagandekalender – läsning");
  await test("en plattformsadmin KAN läsa", () =>
    assertSucceeds(getDoc(doc(leverantor, "atagandekalender", "nyckelrotation")))
  );
  await test("en plattformsadmin KAN lista collectionen", () =>
    assertSucceeds(getDocs(collection(leverantor, "atagandekalender")))
  );
  await test("en superadmin i en kundorganisation kan INTE läsa", () =>
    assertFails(getDoc(doc(superadmin, "atagandekalender", "nyckelrotation")))
  );
  await test("vanlig personal kan INTE läsa", () =>
    assertFails(getDoc(doc(personal, "atagandekalender", "nyckelrotation")))
  );
  await test("en utloggad kan INTE läsa", () =>
    assertFails(getDoc(doc(utloggad, "atagandekalender", "nyckelrotation")))
  );

  console.log("\natagandekalender – ingen klient får NÅGONSIN skriva, inte ens en plattformsadmin");
  await test("en plattformsadmin kan INTE skapa en ny post direkt", () =>
    assertFails(setDoc(doc(leverantor, "atagandekalender", "forfalskad"), { vad: "x", intervallManader: 1 }))
  );
  await test("en plattformsadmin kan INTE uppdatera en befintlig post direkt", () =>
    assertFails(updateDoc(doc(leverantor, "atagandekalender", "nyckelrotation"), { senastUtfort: new Date().toISOString() }))
  );
  await test("en plattformsadmin kan INTE ta bort en post", () =>
    assertFails(deleteDoc(doc(leverantor, "atagandekalender", "nyckelrotation")))
  );

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  await testEnv.cleanup();
  if (antalMisslyckade > 0) {
    process.exit(1);
  }
}

main().catch((fel) => {
  console.error(fel);
  process.exit(1);
});
