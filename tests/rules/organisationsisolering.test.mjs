// Bevisar den viktigaste egenskapen från Etapp 1 (ETAPP1-ARBETSUPPGIFTER.md, block 1c.5):
// en användare i organisation A kan ALDRIG läsa, skriva eller ta bort ett dokument som
// tillhör organisation B, oavsett roll. Körs mot Firestore-emulatorn (kräver INGEN riktig
// Firebase-inloggning), via:
//
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/organisationsisolering.test.mjs"
//
// Detta är INTE en del av `npm run test` (vitest) eftersom det kräver en körande emulator.
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
} from "firebase/firestore";

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

  // Seed testdata med reglerna avstängda (annars skulle vi behöva testa reglerna för att
  // kunna sätta upp testdata FÖR att testa reglerna).
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users", "superadminA"), { role: "superadmin", organisationId: ORG_A });
    await setDoc(doc(db, "users", "superadminB"), { role: "superadmin", organisationId: ORG_B });
    await setDoc(doc(db, "users", "volA"), { role: "vol", organisationId: ORG_A });
    await setDoc(doc(db, "users", "vecB"), { role: "vec", organisationId: ORG_B });

    await setDoc(doc(db, "rutiner", "rutinA"), {
      omrade: "kliniskt-stod",
      status: "godkand",
      organisationId: ORG_A,
      titel: "Rutin A",
      innehall: "Innehåll A",
    });
    await setDoc(doc(db, "rutiner", "rutinB"), {
      omrade: "kliniskt-stod",
      status: "godkand",
      organisationId: ORG_B,
      titel: "Rutin B",
      innehall: "Innehåll B",
    });

    await setDoc(doc(db, "anslag", "anslagA"), {
      titel: "Anslag A",
      innehall: "Info A",
      organisationId: ORG_A,
    });

    await setDoc(doc(db, "kontakter", "kontaktA"), {
      namn: "Kontakt A",
      nummer: "123",
      kategori: "Övrigt",
      organisationId: ORG_A,
    });

    await setDoc(doc(db, "forradsartiklar", "artikelA"), {
      namn: "Artikel A",
      forrad: "Engångsförrådet",
      status: "godkand",
      organisationId: ORG_A,
    });
  });

  const superA = testEnv.authenticatedContext("superadminA").firestore();
  const superB = testEnv.authenticatedContext("superadminB").firestore();
  const volA = testEnv.authenticatedContext("volA").firestore();
  const vecB = testEnv.authenticatedContext("vecB").firestore();

  console.log("\nusers/{uid} – organisationsisolering");
  await test("superadminA kan läsa sin egen organisations användare (volA)", () =>
    assertSucceeds(getDoc(doc(volA, "users", "volA")))
  );
  await test("superadminB kan INTE läsa org A:s användare (volA)", () =>
    assertFails(getDoc(doc(superB, "users", "volA")))
  );
  await test("superadminB kan INTE ändra roll på org A:s användare (volA)", () =>
    assertFails(updateDoc(doc(superB, "users", "volA"), { role: "superadmin" }))
  );
  await test("superadminA KAN ändra roll på sin egen organisations användare (volA)", () =>
    assertSucceeds(updateDoc(doc(superA, "users", "volA"), { role: "vol" }))
  );

  console.log("\nrutiner/{rutinId} – organisationsisolering");
  await test("superadminA kan läsa org A:s rutin", () =>
    assertSucceeds(getDoc(doc(superA, "rutiner", "rutinA")))
  );
  await test("superadminB kan INTE läsa org A:s rutin (annan organisation)", () =>
    assertFails(getDoc(doc(superB, "rutiner", "rutinA")))
  );
  await test("superadminB kan INTE uppdatera org A:s rutin", () =>
    assertFails(updateDoc(doc(superB, "rutiner", "rutinA"), { titel: "Kapad!" }))
  );
  await test("superadminB kan INTE ta bort org A:s rutin", () =>
    assertFails(deleteDoc(doc(superB, "rutiner", "rutinA")))
  );
  await test("superadminB kan INTE skapa en rutin och låtsas att den tillhör org A", () =>
    assertFails(
      setDoc(doc(superB, "rutiner", "forfalskad"), {
        omrade: "kliniskt-stod",
        status: "godkand",
        organisationId: ORG_A,
        titel: "Förfalskad",
        innehall: "x",
      })
    )
  );
  await test("superadminB KAN skapa en rutin i sin egen organisation", () =>
    assertSucceeds(
      setDoc(doc(superB, "rutiner", "rutinB2"), {
        omrade: "kliniskt-stod",
        status: "godkand",
        organisationId: ORG_B,
        titel: "Rutin B2",
        innehall: "x",
      })
    )
  );

  console.log("\nanslag/{anslagId} – organisationsisolering");
  await test("superadminB kan INTE läsa org A:s anslag", () =>
    assertFails(getDoc(doc(superB, "anslag", "anslagA")))
  );
  await test("vecB (rätt roll, fel organisation) kan INTE ta bort org A:s anslag", () =>
    assertFails(deleteDoc(doc(vecB, "anslag", "anslagA")))
  );

  console.log("\nkontakter/{kontaktId} – organisationsisolering");
  await test("superadminB kan INTE läsa org A:s kontakt", () =>
    assertFails(getDoc(doc(superB, "kontakter", "kontaktA")))
  );
  await test("vecB kan INTE ändra org A:s kontakt", () =>
    assertFails(updateDoc(doc(vecB, "kontakter", "kontaktA"), { namn: "Kapad" }))
  );

  console.log("\nforradsartiklar/{artikelId} – organisationsisolering");
  await test("superadminB kan INTE läsa org A:s förrådsartikel", () =>
    assertFails(getDoc(doc(superB, "forradsartiklar", "artikelA")))
  );

  console.log("\nBefintliga rollkontroller INOM en organisation gäller fortfarande");
  await test('volA (fel roll för "administration") kan INTE skapa en administration-rutin', () =>
    assertFails(
      addDoc(collection(volA, "rutiner"), {
        omrade: "administration",
        status: "utkast",
        organisationId: ORG_A,
        titel: "x",
        innehall: "x",
      })
    )
  );
  await test('volA KAN skapa en kliniskt-stod-rutin (har rätt roll för området)', () =>
    assertSucceeds(
      addDoc(collection(volA, "rutiner"), {
        omrade: "kliniskt-stod",
        status: "utkast",
        organisationId: ORG_A,
        titel: "x",
        innehall: "x",
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
