// Etapp 37c: bevisar att dubblettdismissningar/{dismissId} bara kan skapas/raderas av en
// redaktör för det angivna området (eller superadmin), att läsning respekterar
// organisationsisolering, och att en dismissning aldrig kan uppdateras i efterhand.
// Körs mot Firestore-emulatorn:
//
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/dubblettdismissningar.test.mjs"
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
    await setDoc(doc(db, "users", "volA"), { role: "vol", organisationId: ORG_A });
    await setDoc(doc(db, "users", "personalA"), { role: "personal", organisationId: ORG_A });
    await setDoc(doc(db, "users", "superadminB"), { role: "superadmin", organisationId: ORG_B });

    await setDoc(doc(db, "dubblettdismissningar", "dismissA1"), {
      organisationId: ORG_A,
      omrade: "kliniskt-stod",
      parNyckel: "rutin1::rutin2",
      dismissadAv: "volA",
      dismissadAvNamn: "Vol A",
    });
  });

  const volA = testEnv.authenticatedContext("volA").firestore();
  const personalA = testEnv.authenticatedContext("personalA").firestore();
  const superB = testEnv.authenticatedContext("superadminB").firestore();

  console.log("\ndubblettdismissningar/{dismissId} – läsning");
  await test("volA (redaktör i egen org) kan läsa", () =>
    assertSucceeds(getDoc(doc(volA, "dubblettdismissningar", "dismissA1")))
  );
  await test("superadminB (annan org) kan INTE läsa", () =>
    assertFails(getDoc(doc(superB, "dubblettdismissningar", "dismissA1")))
  );

  console.log("\ndubblettdismissningar/{dismissId} – skapande");
  await test("volA (redaktör för kliniskt-stod) kan skapa en dismissning", () =>
    assertSucceeds(
      setDoc(doc(volA, "dubblettdismissningar", "dismissA2"), {
        organisationId: ORG_A,
        omrade: "kliniskt-stod",
        parNyckel: "rutin3::rutin4",
        dismissadAv: "volA",
        dismissadAvNamn: "Vol A",
      })
    )
  );
  await test("personalA (INTE redaktör) kan INTE skapa en dismissning", () =>
    assertFails(
      setDoc(doc(personalA, "dubblettdismissningar", "dismissPersonal"), {
        organisationId: ORG_A,
        omrade: "kliniskt-stod",
        parNyckel: "rutin5::rutin6",
        dismissadAv: "personalA",
        dismissadAvNamn: "Personal A",
      })
    )
  );
  await test("volA kan INTE skapa en dismissning för administration (fel område för sin roll)", () =>
    assertFails(
      setDoc(doc(volA, "dubblettdismissningar", "dismissFelOmrade"), {
        organisationId: ORG_A,
        omrade: "administration",
        parNyckel: "rutin7::rutin8",
        dismissadAv: "volA",
        dismissadAvNamn: "Vol A",
      })
    )
  );
  await test("volA kan INTE utge sig för att vara en annan (dismissadAv måste vara den egna uiden)", () =>
    assertFails(
      setDoc(doc(volA, "dubblettdismissningar", "dismissFalskAv"), {
        organisationId: ORG_A,
        omrade: "kliniskt-stod",
        parNyckel: "rutin9::rutin10",
        dismissadAv: "annanAnvandare",
        dismissadAvNamn: "Annan",
      })
    )
  );

  console.log("\ndubblettdismissningar/{dismissId} – ingen klient får uppdatera");
  await test("volA kan INTE uppdatera en befintlig dismissning", () =>
    assertFails(updateDoc(doc(volA, "dubblettdismissningar", "dismissA1"), { parNyckel: "annat::par" }))
  );

  console.log("\ndubblettdismissningar/{dismissId} – radering");
  await test("volA (redaktör) kan radera en dismissning i sin egen organisation", () =>
    assertSucceeds(deleteDoc(doc(volA, "dubblettdismissningar", "dismissA1")))
  );

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
