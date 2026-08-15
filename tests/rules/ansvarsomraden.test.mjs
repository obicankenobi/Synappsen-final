// Etapp 66b (ETAPPLAN15.md): users/{uid}.ansvarsomraden – ett nytt skrivbart fält på ett
// redan existerande dokument, inte en ny collection, så INGEN regeländring krävdes för att
// bygga funktionen (superadmin fick redan skriva "vad som helst utom role" direkt). Den här
// testfilen finns ändå för att LÅSA FAST planens uttryckliga designbeslut: "ansvarsomraden får
// INTE läggas i självbetjäningsvitlistan" – en framtida ändring av bararForandrarFalt-listan
// på users/{userId} som råkar inkludera ansvarsomraden ska fångas här, inte upptäckas i
// produktion.
//
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/ansvarsomraden.test.mjs"
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, updateDoc, setDoc } from "firebase/firestore";

const ORG_A = "orgAnsvA";
const ORG_B = "orgAnsvB";

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
    await setDoc(doc(db, "users", "superA"), { role: "superadmin", organisationId: ORG_A });
    await setDoc(doc(db, "users", "personalA"), { role: "personal", organisationId: ORG_A });
    await setDoc(doc(db, "users", "superB"), { role: "superadmin", organisationId: ORG_B });
  });

  const superA = testEnv.authenticatedContext("superA").firestore();
  const personalA = testEnv.authenticatedContext("personalA").firestore();
  const superB = testEnv.authenticatedContext("superB").firestore();

  console.log("\nusers/{uid}.ansvarsomraden – skrivrätt");
  await test("superadmin KAN sätta ansvarsomraden på en annan användare i egna orgen", () =>
    assertSucceeds(updateDoc(doc(superA, "users", "personalA"), { ansvarsomraden: ["medicinteknik"] }))
  );
  await test("en vanlig användare kan INTE sätta sina EGNA ansvarsomraden (designbeslut: inte självbetjäning)", () =>
    assertFails(updateDoc(doc(personalA, "users", "personalA"), { ansvarsomraden: ["utsedd av mig själv"] }))
  );
  await test("en vanlig användare kan INTE sätta någon ANNANS ansvarsomraden", () =>
    assertFails(updateDoc(doc(personalA, "users", "superA"), { ansvarsomraden: ["kapning"] }))
  );
  await test("en superadmin i en ANNAN organisation kan INTE sätta ansvarsomraden (organisationsisolering)", () =>
    assertFails(updateDoc(doc(superB, "users", "personalA"), { ansvarsomraden: ["fel org"] }))
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
