// Etapp L1m (intern/ETAPPLAN-INTERN-1.md): bevisar att ett konto med
// `organisationId: "_plattform"` är isolerat från ALL kundorganisations innehåll, precis som
// vilket annat konto som helst i FEL organisation skulle vara – och, avgörande, att det INTE
// råkar falla tillbaka på organisationen "default" (minOrganisation() defaultar dit när
// fältet SAKNAS helt – men _plattform-kontots fält är explicit satt, inte saknat).
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/plattformskonto.test.mjs"
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDoc, setDoc } from "firebase/firestore";

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

    // Leverantörskontot – ETT konto, ingen organisation.
    await setDoc(doc(db, "users", "plattformL1m"), { role: "superadmin", organisationId: "_plattform" });
    await setDoc(doc(db, "plattformsadmin", "plattformL1m"), { blevPlattformsadmin: new Date() });

    // En riktig kundorganisation, med ett dokument i varje collection planen räknar upp.
    await setDoc(doc(db, "organisationer", "orgL1mRegel"), { namn: "L1m-testkund", status: "aktiv" });
    await setDoc(doc(db, "rutiner", "rutinL1m"), { organisationId: "orgL1mRegel", omrade: "logistik", status: "godkand" });
    await setDoc(doc(db, "anslag", "anslagL1m"), { organisationId: "orgL1mRegel" });
    await setDoc(doc(db, "kontakter", "kontaktL1m"), { organisationId: "orgL1mRegel" });
    await setDoc(doc(db, "forradsartiklar", "artikelL1m"), { organisationId: "orgL1mRegel", status: "godkand" });
    await setDoc(doc(db, "lankbibliotek", "lankL1m"), { organisationId: "orgL1mRegel" });
    await setDoc(doc(db, "skiftrapporter", "skiftL1m"), { organisationId: "orgL1mRegel" });
    await setDoc(doc(db, "revisionslogg", "loggL1m"), { organisationId: "orgL1mRegel" });

    // Organisationen "default" (STANDARD_ORG) – den FAKTISKA fällan: om _plattform av
    // misstag föll tillbaka dit skulle det här dokumentet bli läsbart.
    await setDoc(doc(db, "organisationer", "default"), { namn: "Standardorganisationen", status: "aktiv" });
    await setDoc(doc(db, "rutiner", "rutinDefault"), { organisationId: "default", omrade: "logistik", status: "godkand" });
  });

  const plattformskonto = testEnv.authenticatedContext("plattformL1m").firestore();

  console.log("\n_plattform-kontot nekas ALLT kundinnehåll i en riktig organisation");
  await test("rutiner", () => assertFails(getDoc(doc(plattformskonto, "rutiner", "rutinL1m"))));
  await test("anslag", () => assertFails(getDoc(doc(plattformskonto, "anslag", "anslagL1m"))));
  await test("kontakter", () => assertFails(getDoc(doc(plattformskonto, "kontakter", "kontaktL1m"))));
  await test("forradsartiklar", () => assertFails(getDoc(doc(plattformskonto, "forradsartiklar", "artikelL1m"))));
  await test("lankbibliotek", () => assertFails(getDoc(doc(plattformskonto, "lankbibliotek", "lankL1m"))));
  await test("skiftrapporter", () => assertFails(getDoc(doc(plattformskonto, "skiftrapporter", "skiftL1m"))));
  await test("revisionslogg (utan aktivt supportfönster)", () =>
    assertFails(getDoc(doc(plattformskonto, "revisionslogg", "loggL1m")))
  );

  console.log("\nDEN FAKTISKA FÄLLAN: _plattform faller INTE tillbaka på organisationen \"default\"");
  await test("kan INTE läsa default-organisationens rutin", () =>
    assertFails(getDoc(doc(plattformskonto, "rutiner", "rutinDefault")))
  );

  console.log("\nMen metadata (organisationer/{orgId}) är fortfarande läsbar – arPlattformsadmin() är oförändrad");
  await test("kan läsa VILKEN SOM HELST organisations metadatadokument", () =>
    assertSucceeds(getDoc(doc(plattformskonto, "organisationer", "orgL1mRegel")))
  );
  await test("...inklusive 'default'", () => assertSucceeds(getDoc(doc(plattformskonto, "organisationer", "default"))));

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
