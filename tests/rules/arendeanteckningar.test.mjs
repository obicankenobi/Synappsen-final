// Etapp 50c: organisationer/{orgId}/arendeanteckningar/{id} – leverantörens egen
// ärendehistorik. Bara plattformsadmin får läsa/skriva, aldrig organisationens egna
// användare (inte ens superadmin) – detta är internt leverantörsminne, inte en kundfacing yta.
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/arendeanteckningar.test.mjs"
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDocs, collection, addDoc, deleteDoc, setDoc } from "firebase/firestore";

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
    await setDoc(doc(db, "users", "superArende"), { role: "superadmin", organisationId: "orgArende" });
    await setDoc(doc(db, "plattformsadmin", "levArende"), { blevPlattformsadmin: new Date() });
    await setDoc(doc(db, "organisationer", "orgArende"), { namn: "Ärendetest AB", status: "aktiv" });
    await addDoc(collection(db, "organisationer", "orgArende", "arendeanteckningar"), {
      text: "Kunden ringde om långsam sökning",
      skapadAv: "levArende",
      skapadTidpunkt: new Date(),
    });
  });

  const lev = testEnv.authenticatedContext("levArende").firestore();
  const super1 = testEnv.authenticatedContext("superArende").firestore();

  console.log("\narendeanteckningar – läsning");
  await test("en plattformsadmin KAN läsa ärendehistoriken", () =>
    assertSucceeds(getDocs(collection(lev, "organisationer", "orgArende", "arendeanteckningar")))
  );
  await test("organisationens egen superadmin kan INTE läsa (internt leverantörsminne)", () =>
    assertFails(getDocs(collection(super1, "organisationer", "orgArende", "arendeanteckningar")))
  );

  console.log("\narendeanteckningar – skapande");
  await test("en plattformsadmin KAN lägga till en anteckning", () =>
    assertSucceeds(
      addDoc(collection(lev, "organisationer", "orgArende", "arendeanteckningar"), {
        text: "Löst: cache-bugg åtgärdad",
        skapadAv: "levArende",
        skapadTidpunkt: new Date(),
      })
    )
  );
  await test("en plattformsadmin kan INTE utge sig för att vara en annan (skapadAv måste vara den egna uiden)", () =>
    assertFails(
      addDoc(collection(lev, "organisationer", "orgArende", "arendeanteckningar"), {
        text: "Förfalskad",
        skapadAv: "nagonAnnan",
        skapadTidpunkt: new Date(),
      })
    )
  );
  await test("organisationens egen superadmin kan INTE skapa en anteckning", () =>
    assertFails(
      addDoc(collection(super1, "organisationer", "orgArende", "arendeanteckningar"), {
        text: "Ska inte gå",
        skapadAv: "superArende",
        skapadTidpunkt: new Date(),
      })
    )
  );

  console.log("\narendeanteckningar – radering (korrigera misstag)");
  let anteckningId;
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const ref = await addDoc(collection(context.firestore(), "organisationer", "orgArende", "arendeanteckningar"), {
      text: "Ska raderas",
      skapadAv: "levArende",
      skapadTidpunkt: new Date(),
    });
    anteckningId = ref.id;
  });
  await test("en plattformsadmin KAN radera en anteckning", () =>
    assertSucceeds(deleteDoc(doc(lev, "organisationer", "orgArende", "arendeanteckningar", anteckningId)))
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
