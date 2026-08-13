// Etapp 65b (ETAPPLAN14.md): läsrätten till rutiner/{id}/versioner vidgades från redaktörer
// till samma krets som redan läser den LIVE rutinen (farLasaVersioner i firestore.rules) –
// "ändrat sedan du läste"-funktionen är byggd för vanliga medarbetare, inte bara redaktörer.
// Bevisar dels att den nya kretsen faktiskt kommer in, dels att den INTE blivit bredare än
// den levande rutinens egen läsregel (organisationsisolering, utkast förblir dolt).
//
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/versionerlasratt.test.mjs"
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDoc, getDocs, collection, addDoc, setDoc } from "firebase/firestore";

const ORG_A = "orgVersA";
const ORG_B = "orgVersB";

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
    await setDoc(doc(db, "users", "personalA"), { role: "personal", organisationId: ORG_A });
    await setDoc(doc(db, "users", "volA"), { role: "vol", organisationId: ORG_A });
    await setDoc(doc(db, "users", "superadminB"), { role: "superadmin", organisationId: ORG_B });

    await setDoc(doc(db, "rutiner", "godkandA"), {
      omrade: "kliniskt-stod",
      status: "godkand",
      organisationId: ORG_A,
      titel: "Godkänd rutin",
      innehall: "Nuvarande innehåll",
    });
    await setDoc(doc(db, "rutiner", "utkastA"), {
      omrade: "kliniskt-stod",
      status: "utkast",
      organisationId: ORG_A,
      titel: "Ej godkänd rutin",
      innehall: "Utkastinnehåll",
    });

    await setDoc(doc(db, "rutiner", "godkandA", "versioner", "v1"), {
      titel: "Godkänd rutin",
      innehall: "Äldre innehåll",
      sparadVersionTidpunkt: new Date(),
    });
    await setDoc(doc(db, "rutiner", "utkastA", "versioner", "v1"), {
      titel: "Ej godkänd rutin",
      innehall: "Äldre utkastinnehåll",
      sparadVersionTidpunkt: new Date(),
    });
  });

  const personalA = testEnv.authenticatedContext("personalA").firestore();
  const volA = testEnv.authenticatedContext("volA").firestore();
  const superB = testEnv.authenticatedContext("superadminB").firestore();

  console.log("\nrutiner/{id}/versioner – läsning (Etapp 65b)");
  await test("en vanlig medarbetare (ingen redaktörsroll) KAN nu läsa versioner av en GODKÄND rutin i egna orgen", () =>
    assertSucceeds(getDoc(doc(personalA, "rutiner", "godkandA", "versioner", "v1")))
  );
  await test("en vanlig medarbetare kan INTE läsa versioner av en rutin som fortfarande är UTKAST (speglar rutinens egen läsregel)", () =>
    assertFails(getDoc(doc(personalA, "rutiner", "utkastA", "versioner", "v1")))
  );
  await test("en redaktör (VÖL) kan fortsatt läsa versioner, oavsett status – oförändrat beteende", () =>
    assertSucceeds(getDoc(doc(volA, "rutiner", "utkastA", "versioner", "v1")))
  );
  await test("en superadmin i en ANNAN organisation kan INTE läsa versioner (organisationsisoleringen är oförändrad)", () =>
    assertFails(getDoc(doc(superB, "rutiner", "godkandA", "versioner", "v1")))
  );
  await test("en vanlig medarbetare KAN lista hela versionshistoriken för en godkänd rutin i egna orgen", () =>
    assertSucceeds(getDocs(collection(personalA, "rutiner", "godkandA", "versioner")))
  );

  console.log("\nrutiner/{id}/versioner – skapande (oförändrat, fortsatt redaktörsbart)");
  await test("en vanlig medarbetare kan INTE skapa en versionspost", () =>
    assertFails(
      addDoc(collection(personalA, "rutiner", "godkandA", "versioner"), {
        titel: "Försök",
        innehall: "Försök",
        sparadVersionTidpunkt: new Date(),
      })
    )
  );
  await test("en redaktör (VÖL) KAN skapa en versionspost", () =>
    assertSucceeds(
      addDoc(collection(volA, "rutiner", "godkandA", "versioner"), {
        titel: "Ny version",
        innehall: "Nytt innehåll",
        sparadVersionTidpunkt: new Date(),
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
