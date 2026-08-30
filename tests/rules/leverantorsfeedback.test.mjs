// Etapp L1 beslutspunkt 7 (avgjord 2026-08-30): leverantorsfeedback är EN EGEN kanal till
// leverantören, medvetet en HELT ANNAN collection än feedback (som stannar hos kundens egen
// superadmin). Bevisar: plattformsadmin läser tvärs organisationer, avsändaren läser sina
// egna, ingen annan superadmin läcker in, och ingen klient kan skriva direkt.
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/leverantorsfeedback.test.mjs"
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDoc, getDocs, collection, query, where, setDoc } from "firebase/firestore";

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
    await setDoc(doc(db, "users", "avsandareLF"), { role: "superadmin", organisationId: "orgLF" });
    await setDoc(doc(db, "users", "enAnnanSuperLF"), { role: "superadmin", organisationId: "orgLF" });
    await setDoc(doc(db, "plattformsadmin", "levLF"), { blevPlattformsadmin: new Date() });
    await setDoc(doc(db, "leverantorsfeedback", "f1"), {
      text: "Ett förslag till leverantören",
      skapadAv: "avsandareLF",
      organisationId: "orgLF",
      last: false,
    });
  });

  const avsandare = testEnv.authenticatedContext("avsandareLF").firestore();
  const enAnnanSuper = testEnv.authenticatedContext("enAnnanSuperLF").firestore();
  const lev = testEnv.authenticatedContext("levLF").firestore();

  console.log("\nleverantorsfeedback – läsning");
  await test("avsändaren KAN läsa sitt eget meddelande", () =>
    assertSucceeds(getDoc(doc(avsandare, "leverantorsfeedback", "f1")))
  );
  await test("en plattformsadmin KAN läsa (det är dennes inkorg)", () =>
    assertSucceeds(getDoc(doc(lev, "leverantorsfeedback", "f1")))
  );
  await test("en ANNAN superadmin i SAMMA organisation kan INTE läsa (det är inte deras)", () =>
    assertFails(getDoc(doc(enAnnanSuper, "leverantorsfeedback", "f1")))
  );

  console.log("\nleverantorsfeedback – skrivning: ENDAST Admin SDK");
  await test("ingen klient kan skapa direkt (måste gå via skickaLeverantorsfeedback)", () =>
    assertFails(
      setDoc(doc(avsandare, "leverantorsfeedback", "f2"), {
        text: "Försök kringgå Cloud Function",
        skapadAv: "avsandareLF",
        organisationId: "orgLF",
        last: false,
      })
    )
  );
  await test("en plattformsadmin kan INTE markera som läst direkt (måste gå via callable)", () =>
    assertFails(
      setDoc(
        doc(lev, "leverantorsfeedback", "f1"),
        { last: true },
        { merge: true }
      )
    )
  );

  console.log("\nleverantorsfeedback och feedback är olika collections – ingen läcker in i den andra");
  await test("en lista mot 'feedback' hittar INTE leverantorsfeedback-posten", async () => {
    const snap = await getDocs(query(collection(enAnnanSuper, "feedback"), where("organisationId", "==", "orgLF")));
    if (snap.docs.some((d) => d.id === "f1")) {
      throw new Error("leverantorsfeedback-posten dök upp i feedback-collectionen");
    }
  });

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
