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

    await setDoc(doc(db, "kommentarer", "kommentarA"), {
      text: "En kommentar",
      rutinId: "rutinA",
      skapadAv: "volA",
      organisationId: ORG_A,
    });

    await setDoc(doc(db, "feedback", "feedbackA"), {
      text: "Ett förslag",
      skapadAv: "volA",
      status: "ny",
      organisationId: ORG_A,
    });

    await setDoc(doc(db, "klinikfragefeedback", "klinikfeedbackA"), {
      fraga: "En fråga",
      hjalpsam: true,
      uid: "volA",
      organisationId: ORG_A,
    });

    await setDoc(doc(db, "klinikfrageloggar", "klinikloggA"), {
      fraga: "En fråga",
      organisationId: ORG_A,
    });

    await setDoc(doc(db, "sokloggar", "sokloggA"), {
      sokterm: "något",
      organisationId: ORG_A,
    });

    await setDoc(doc(db, "auditlogg", "auditA"), {
      handelse: "skapade rutin",
      organisationId: ORG_A,
    });

    await setDoc(doc(db, "visningar", `${ORG_A}::rutinA`), {
      titel: "Rutin A",
      antal: 3,
      organisationId: ORG_A,
    });

    await setDoc(doc(db, "skiftrapporter", "skiftA"), {
      text: "Info till nästa skift",
      skapadAv: "volA",
      atgardad: false,
      organisationId: ORG_A,
    });

    await setDoc(doc(db, "lankbibliotek", "lankA"), {
      titel: "En länk",
      url: "https://example.com",
      kategori: "Övrigt",
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

  console.log("\nkommentarer/{kommentarId} – organisationsisolering");
  await test("superadminB kan INTE läsa org A:s kommentar", () =>
    assertFails(getDoc(doc(superB, "kommentarer", "kommentarA")))
  );
  await test("superadminB kan INTE ta bort org A:s kommentar (fel org, trots redaktörsroll)", () =>
    assertFails(deleteDoc(doc(superB, "kommentarer", "kommentarA")))
  );

  console.log("\nfeedback/{feedbackId} – organisationsisolering");
  await test("superadminB kan INTE läsa org A:s feedback", () =>
    assertFails(getDoc(doc(superB, "feedback", "feedbackA")))
  );
  await test("superadminB kan INTE ta bort org A:s feedback", () =>
    assertFails(deleteDoc(doc(superB, "feedback", "feedbackA")))
  );

  console.log("\nklinikfragefeedback/{feedbackId} – organisationsisolering");
  await test("superadminB kan INTE läsa org A:s klinikfrågefeedback", () =>
    assertFails(getDoc(doc(superB, "klinikfragefeedback", "klinikfeedbackA")))
  );
  await test("vecB kan INTE skapa klinikfrågefeedback och låtsas tillhöra org A", () =>
    assertFails(
      setDoc(doc(vecB, "klinikfragefeedback", "forfalskad"), {
        fraga: "x",
        hjalpsam: true,
        uid: "vecB",
        organisationId: ORG_A,
      })
    )
  );

  console.log("\nklinikfrageloggar/{loggId} – organisationsisolering");
  await test("superadminB kan INTE läsa org A:s klinikfrågelogg", () =>
    assertFails(getDoc(doc(superB, "klinikfrageloggar", "klinikloggA")))
  );

  console.log("\nsokloggar/{loggId} – organisationsisolering");
  await test("superadminB kan INTE läsa org A:s söklogg", () =>
    assertFails(getDoc(doc(superB, "sokloggar", "sokloggA")))
  );

  console.log("\nauditlogg/{handelseId} – organisationsisolering");
  await test("superadminB kan INTE läsa org A:s auditlogg", () =>
    assertFails(getDoc(doc(superB, "auditlogg", "auditA")))
  );

  console.log("\nvisningar/{nyckel} – organisationsisolering");
  await test("vecB kan INTE läsa org A:s visningsräknare", () =>
    assertFails(getDoc(doc(vecB, "visningar", `${ORG_A}::rutinA`)))
  );
  await test("vecB kan INTE uppdatera org A:s visningsräknare", () =>
    assertFails(updateDoc(doc(vecB, "visningar", `${ORG_A}::rutinA`), { antal: 99 }))
  );

  console.log("\nskiftrapporter/{postId} – organisationsisolering");
  await test("vecB kan INTE läsa org A:s skiftrapport", () =>
    assertFails(getDoc(doc(vecB, "skiftrapporter", "skiftA")))
  );
  await test("vecB kan INTE markera org A:s skiftrapport som åtgärdad", () =>
    assertFails(updateDoc(doc(vecB, "skiftrapporter", "skiftA"), { atgardad: true }))
  );
  await test("vecB kan INTE ta bort org A:s skiftrapport (fel org, trots redaktörsroll)", () =>
    assertFails(deleteDoc(doc(vecB, "skiftrapporter", "skiftA")))
  );

  console.log("\nlankbibliotek/{lankId} – organisationsisolering");
  await test("vecB kan INTE läsa org A:s länk", () =>
    assertFails(getDoc(doc(vecB, "lankbibliotek", "lankA")))
  );
  await test("vecB kan INTE ändra org A:s länk (fel org, trots rätt roll)", () =>
    assertFails(updateDoc(doc(vecB, "lankbibliotek", "lankA"), { titel: "Kapad" }))
  );
  await test("vecB KAN skapa en länk i sin egen organisation", () =>
    assertSucceeds(
      setDoc(doc(vecB, "lankbibliotek", "lankB"), {
        titel: "Länk B",
        url: "https://example.com/b",
        kategori: "Övrigt",
        organisationId: ORG_B,
      })
    )
  );

  console.log("\nanteckningar/{dokId} – läsning av ett dokument som INTE finns än");
  await test("volA kan lyssna på sin egen (ännu ej skapade) anteckning utan rules-fel", () =>
    assertSucceeds(getDoc(doc(volA, "anteckningar", "volA_rutinA")))
  );
  await test("superB kan INTE läsa volA:s (ännu ej skapade) anteckning", () =>
    assertFails(getDoc(doc(superB, "anteckningar", "volA_rutinA")))
  );

  console.log("\nsoksstatistik/{orgId} – Etapp 4 mätvärden");
  await test("volA kan öka sina egna organisations sökräknare", () =>
    assertSucceeds(
      setDoc(
        doc(volA, "soksstatistik", ORG_A),
        { totaltAntalSokningar: 1, antalNollTraffar: 0 },
        { merge: true }
      )
    )
  );
  await test("vecB kan INTE öka org A:s sökräknare (fel org)", () =>
    assertFails(
      setDoc(
        doc(vecB, "soksstatistik", ORG_A),
        { totaltAntalSokningar: 1, antalNollTraffar: 0 },
        { merge: true }
      )
    )
  );
  await test("volA kan INTE skriva andra fält än räknarna i soksstatistik", () =>
    assertFails(setDoc(doc(volA, "soksstatistik", ORG_A), { annatFalt: "x" }, { merge: true }))
  );
  await test("volA (fel roll, superadmin krävs) kan INTE läsa soksstatistik", () =>
    assertFails(getDoc(doc(volA, "soksstatistik", ORG_A)))
  );
  await test("superadminA KAN läsa sin egen organisations soksstatistik", () =>
    assertSucceeds(getDoc(doc(superA, "soksstatistik", ORG_A)))
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
