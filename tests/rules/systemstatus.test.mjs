// Etapp 46: bevisar att systemstatus/{id} (ny collection – senaste läget för en automatisk
// bakgrundskontroll, t.ex. revisionskedjans nattliga verifiering) bara är läsbar för en
// superadmin och ALDRIG skrivbar från klienten, oavsett roll – samma resonemang som redan
// gäller för systemvarningar (delad, icke-organisationsskopad infrastruktur, skrivs bara av
// Cloud Functions). Körs mot Firestore-emulatorn:
//
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/systemstatus.test.mjs"
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
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
    await setDoc(doc(db, "users", "superadminStatus"), { role: "superadmin", organisationId: "orgStatus" });
    await setDoc(doc(db, "users", "volStatus"), { role: "vol", organisationId: "orgStatus" });
    await setDoc(doc(db, "systemstatus", "revisionskedja"), {
      senastKord: new Date(),
      alletGiltigt: true,
      antalOrganisationerKontrollerade: 3,
      avvikelser: [],
    });
  });

  const super1 = testEnv.authenticatedContext("superadminStatus").firestore();
  const vol1 = testEnv.authenticatedContext("volStatus").firestore();
  const utloggad = testEnv.unauthenticatedContext().firestore();

  console.log("\nsystemstatus/{id} – läsning");
  await test("en superadmin kan läsa", () =>
    assertSucceeds(getDoc(doc(super1, "systemstatus", "revisionskedja")))
  );
  await test("en vanlig roll (vol) kan INTE läsa", () =>
    assertFails(getDoc(doc(vol1, "systemstatus", "revisionskedja")))
  );
  await test("en utloggad kan INTE läsa", () =>
    assertFails(getDoc(doc(utloggad, "systemstatus", "revisionskedja")))
  );

  console.log("\nsystemstatus/{id} – ingen klient får någonsin skriva, oavsett roll");
  await test("en superadmin kan INTE skapa en ny post", () =>
    assertFails(setDoc(doc(super1, "systemstatus", "forfalskad"), { alletGiltigt: true }))
  );
  await test("en superadmin kan INTE uppdatera en befintlig post", () =>
    assertFails(updateDoc(doc(super1, "systemstatus", "revisionskedja"), { alletGiltigt: false }))
  );
  await test("en superadmin kan INTE ta bort en befintlig post", () =>
    assertFails(deleteDoc(doc(super1, "systemstatus", "revisionskedja")))
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
