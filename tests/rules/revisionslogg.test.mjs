// Etapp 14a: bevisar att revisionslogg/{loggId} är skrivskyddad för ALLA klienter, oavsett
// roll – bara Cloud Functions (Admin SDK) får skriva en post. Detta är medvetet skilt från
// auditlogg (som en inloggad klient FÅR skriva till direkt, se firestore.rules) och är hela
// poängen med den nya collectionen: en manipulerad eller fabricerad post ska inte kunna
// skapas av någon som bara har en giltig inloggning. Körs mot Firestore-emulatorn:
//
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/revisionslogg.test.mjs"
//
// Detta är INTE en del av `npm run test` (vitest) eftersom det kräver en körande emulator.
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

const ORG_A = "orgA";
const ORG_B = "orgB";

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
    await setDoc(doc(db, "users", "superadminA"), { role: "superadmin", organisationId: ORG_A });
    await setDoc(doc(db, "users", "superadminB"), { role: "superadmin", organisationId: ORG_B });
    await setDoc(doc(db, "users", "volA"), { role: "vol", organisationId: ORG_A });

    await setDoc(doc(db, "revisionslogg", "loggA1"), {
      organisationId: ORG_A,
      handelsetyp: "inloggning_lyckad",
      aktorUid: "volA",
      aktorRoll: "vol",
      sammanfattning: "volA loggade in",
      foregaendeHash: "genesis",
      hash: "abc123",
    });
    await setDoc(doc(db, "revisionslogg", "loggB1"), {
      organisationId: ORG_B,
      handelsetyp: "inloggning_lyckad",
      aktorUid: "superadminB",
      aktorRoll: "superadmin",
      sammanfattning: "superadminB loggade in",
      foregaendeHash: "genesis",
      hash: "def456",
    });
    await setDoc(doc(db, "plattformsadmin", "superadminA"), { blevPlattformsadmin: true });
  });

  const superA = testEnv.authenticatedContext("superadminA").firestore();
  const superB = testEnv.authenticatedContext("superadminB").firestore();
  const volA = testEnv.authenticatedContext("volA").firestore();

  console.log("\nrevisionslogg/{loggId} – läsning respekterar organisationsisolering");
  await test("superadminA kan läsa sin egen organisations post", () =>
    assertSucceeds(getDoc(doc(superA, "revisionslogg", "loggA1")))
  );
  await test("superadminB kan INTE läsa org A:s post", () =>
    assertFails(getDoc(doc(superB, "revisionslogg", "loggA1")))
  );
  await test("en vanlig roll (vol) kan INTE läsa sin egen organisations revisionslogg", () =>
    assertFails(getDoc(doc(volA, "revisionslogg", "loggA1")))
  );
  await test("en plattformsadmin (superadminA, seedad ovan) kan läsa ÄVEN org B:s post", () =>
    assertSucceeds(getDoc(doc(superA, "revisionslogg", "loggB1")))
  );

  console.log("\nrevisionslogg/{loggId} – ingen klient får någonsin skriva, oavsett roll");
  await test("superadminA (egen organisation) kan INTE skapa en ny post", () =>
    assertFails(
      setDoc(doc(superA, "revisionslogg", "forfalskad"), {
        organisationId: ORG_A,
        handelsetyp: "rolländring",
        sammanfattning: "Påhittad post",
        foregaendeHash: "abc123",
        hash: "fejk",
      })
    )
  );
  await test("superadminA kan INTE uppdatera en befintlig post i sin egen organisation", () =>
    assertFails(updateDoc(doc(superA, "revisionslogg", "loggA1"), { sammanfattning: "Ändrad i efterhand" }))
  );
  await test("superadminA kan INTE ta bort en befintlig post i sin egen organisation", () =>
    assertFails(deleteDoc(doc(superA, "revisionslogg", "loggA1")))
  );
  await test("en plattformsadmin kan INTE heller skriva (existensen ger bara läsrätt)", () =>
    assertFails(
      setDoc(doc(superA, "revisionslogg", "forfalskad2"), {
        organisationId: ORG_B,
        handelsetyp: "rolländring",
        sammanfattning: "Påhittad post från plattformsadmin",
        foregaendeHash: "def456",
        hash: "fejk2",
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
