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
    await setDoc(doc(db, "users", "sektionsledareA"), { role: "sektionsledare", organisationId: ORG_A });
    await setDoc(doc(db, "users", "vecA"), { role: "vec", organisationId: ORG_A });
    await setDoc(doc(db, "users", "personalA"), { role: "personal", organisationId: ORG_A });

    await setDoc(doc(db, "rutiner", "rutinKurateradA"), {
      omrade: "kliniskt-stod",
      status: "godkand",
      organisationId: ORG_A,
      titel: "Kurateringstest",
      innehall: "Innehåll",
      akutlage: false,
      akutlageOrdning: 0,
    });

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

    await setDoc(doc(db, "organisationer", ORG_A, "installningar", "valkomstchecklista"), {
      steg: { bjud_in_kollegor: false, satt_roller: false },
    });
  });

  const superA = testEnv.authenticatedContext("superadminA").firestore();
  const superB = testEnv.authenticatedContext("superadminB").firestore();
  const volA = testEnv.authenticatedContext("volA").firestore();
  const vecB = testEnv.authenticatedContext("vecB").firestore();
  const sektionsledareA = testEnv.authenticatedContext("sektionsledareA").firestore();
  const vecA = testEnv.authenticatedContext("vecA").firestore();
  const personalA = testEnv.authenticatedContext("personalA").firestore();

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

  console.log("\nusers/{uid}.senastBesokta – Etapp 17b (synkad mellan enheter)");
  await test("volA KAN uppdatera sin egen senastBesokta-lista", () =>
    assertSucceeds(
      updateDoc(doc(volA, "users", "volA"), {
        senastBesokta: [{ id: "rutinA", titel: "Rutin A", sokvag: "/kliniskt-stod#rutin-rutinA" }],
      })
    )
  );
  await test("volA kan INTE smyga med en rollhöjning i samma skrivning som senastBesokta", () =>
    assertFails(
      updateDoc(doc(volA, "users", "volA"), {
        senastBesokta: [],
        role: "superadmin",
      })
    )
  );

  console.log("\nusers/{uid}.namn – Etapp 22a: eget visningsnamn istället för e-post");
  await test("volA KAN sätta sitt eget visningsnamn", () =>
    assertSucceeds(updateDoc(doc(volA, "users", "volA"), { namn: "Anna Svensson" }))
  );
  await test("volA kan INTE sätta ett personnummer som eget visningsnamn", () =>
    assertFails(updateDoc(doc(volA, "users", "volA"), { namn: "900101-0017" }))
  );
  await test("volA kan INTE smyga med en rollhöjning i samma skrivning som namn", () =>
    assertFails(updateDoc(doc(volA, "users", "volA"), { namn: "Anna", role: "superadmin" }))
  );
  await test("volA kan INTE ändra en ANNAN användares namn", () =>
    assertFails(updateDoc(doc(volA, "users", "sektionsledareA"), { namn: "Kapat namn" }))
  );

  console.log("\norganisationer/{orgId}/installningar/valkomstchecklista – Etapp 15b");
  await test("superadminA KAN bocka av ett eget checklistesteg", () =>
    assertSucceeds(
      updateDoc(doc(superA, "organisationer", ORG_A, "installningar", "valkomstchecklista"), {
        "steg.bjud_in_kollegor": true,
      })
    )
  );
  await test("volA (fel roll, rätt organisation) kan INTE ändra checklistan", () =>
    assertFails(
      updateDoc(doc(volA, "organisationer", ORG_A, "installningar", "valkomstchecklista"), {
        "steg.satt_roller": true,
      })
    )
  );
  await test("superadminB (rätt roll, fel organisation) kan INTE läsa org A:s checklista", () =>
    assertFails(getDoc(doc(superB, "organisationer", ORG_A, "installningar", "valkomstchecklista")))
  );
  await test("superadminB (rätt roll, fel organisation) kan INTE ändra org A:s checklista", () =>
    assertFails(
      updateDoc(doc(superB, "organisationer", ORG_A, "installningar", "valkomstchecklista"), {
        "steg.satt_roller": true,
      })
    )
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

  console.log("\nforradsartiklar/{artikelId} – personnummerspärr på regelnivå (Etapp 12e)");
  await test("superadminA kan INTE skapa en förrådsartikel med ett personnummer i namnet", () =>
    assertFails(
      setDoc(doc(superA, "forradsartiklar", "artikelMedPersonnummer"), {
        namn: "Handskar 900101-0017",
        forrad: "Engångsförrådet",
        status: "utkast",
        organisationId: ORG_A,
      })
    )
  );
  await test("superadminA kan INTE skapa en förrådsartikel med ett personnummer i skåp-fältet", () =>
    assertFails(
      setDoc(doc(superA, "forradsartiklar", "artikelMedPersonnummerSkap"), {
        namn: "Kompresser",
        skap: "900101-0017",
        forrad: "Engångsförrådet",
        status: "utkast",
        organisationId: ORG_A,
      })
    )
  );
  await test("superadminA KAN skapa en vanlig förrådsartikel utan personnummer", () =>
    assertSucceeds(
      setDoc(doc(superA, "forradsartiklar", "artikelUtanPersonnummer"), {
        namn: "Kompresser 10x10",
        skap: "B",
        hylla: "3",
        forrad: "Engångsförrådet",
        status: "utkast",
        organisationId: ORG_A,
      })
    )
  );
  await test("superadminA kan INTE uppdatera en förrådsartikel så namnet blir ett personnummer", () =>
    assertFails(
      updateDoc(doc(superA, "forradsartiklar", "artikelA"), { namn: "900101-0017" })
    )
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
  await test("volA kan öka Etapp 10e:s tid-att-hitta-räknare i soksstatistik", () =>
    assertSucceeds(
      setDoc(
        doc(volA, "soksstatistik", ORG_A),
        { totalTidTillKlickMs: 4200, antalTidmatningar: 1 },
        { merge: true }
      )
    )
  );
  await test("volA (fel roll, superadmin krävs) kan INTE läsa soksstatistik", () =>
    assertFails(getDoc(doc(volA, "soksstatistik", ORG_A)))
  );
  await test("superadminA KAN läsa sin egen organisations soksstatistik", () =>
    assertSucceeds(getDoc(doc(superA, "soksstatistik", ORG_A)))
  );

  console.log("\norganisationer/{orgId}/kostnadshistorik/{manad} – Etapp 5");
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "organisationer", ORG_A, "kostnadshistorik", "2026-01"), {
      manad: "2026-01",
      anvantOre: 500,
      antalAnvandare: 2,
    });
  });
  await test("superadminA kan läsa sin egen organisations kostnadshistorik", () =>
    assertSucceeds(getDoc(doc(superA, "organisationer", ORG_A, "kostnadshistorik", "2026-01")))
  );
  await test("superadminB kan INTE läsa org A:s kostnadshistorik", () =>
    assertFails(getDoc(doc(superB, "organisationer", ORG_A, "kostnadshistorik", "2026-01")))
  );
  await test("volA (fel roll, superadmin krävs) kan INTE läsa kostnadshistorik", () =>
    assertFails(getDoc(doc(volA, "organisationer", ORG_A, "kostnadshistorik", "2026-01")))
  );
  await test("superadminA kan INTE skriva till kostnadshistorik (endast Cloud Function)", () =>
    assertFails(
      setDoc(doc(superA, "organisationer", ORG_A, "kostnadshistorik", "2026-02"), {
        manad: "2026-02",
        anvantOre: 0,
        antalAnvandare: 0,
      })
    )
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

  console.log("\nrutiner/{rutinId} – Etapp 17c: bara VÖL/superadmin kurerar akutläget");
  await test("sektionsledareA (får redigera kliniskt-stod, men inte VÖL/superadmin) kan INTE sätta akutlage=true", () =>
    assertFails(
      updateDoc(doc(sektionsledareA, "rutiner", "rutinKurateradA"), { akutlage: true })
    )
  );
  await test("sektionsledareA kan INTE ändra akutlageOrdning", () =>
    assertFails(
      updateDoc(doc(sektionsledareA, "rutiner", "rutinKurateradA"), { akutlageOrdning: 3 })
    )
  );
  await test("sektionsledareA KAN fortfarande redigera övrigt innehåll på samma rutin", () =>
    assertSucceeds(updateDoc(doc(sektionsledareA, "rutiner", "rutinKurateradA"), { titel: "Uppdaterad titel" }))
  );
  await test("volA (VÖL) KAN sätta akutlage=true", () =>
    assertSucceeds(updateDoc(doc(volA, "rutiner", "rutinKurateradA"), { akutlage: true }))
  );
  await test("superadminA KAN ändra akutlageOrdning", () =>
    assertSucceeds(updateDoc(doc(superA, "rutiner", "rutinKurateradA"), { akutlageOrdning: 1 }))
  );
  await test("sektionsledareA kan INTE skapa en ny rutin direkt in i akutläget", () =>
    assertFails(
      addDoc(collection(sektionsledareA, "rutiner"), {
        omrade: "kliniskt-stod",
        status: "utkast",
        organisationId: ORG_A,
        titel: "Ny",
        innehall: "x",
        akutlage: true,
      })
    )
  );

  console.log("\nrutiner/{rutinId}.steg – Etapp 18a: PII-spärr och taklängd för checklistesteg");
  await test("volA kan INTE skapa en rutin med ett personnummer inbäddat i ett stegs text", () =>
    assertFails(
      addDoc(collection(volA, "rutiner"), {
        omrade: "kliniskt-stod",
        status: "utkast",
        organisationId: ORG_A,
        titel: "Checklista",
        innehall: "x",
        steg: [{ text: "Kontrollera patient 900101-0017 enligt rutin." }],
      })
    )
  );
  await test("volA KAN skapa en rutin med giltiga checklistesteg (ingen PII)", () =>
    assertSucceeds(
      addDoc(collection(volA, "rutiner"), {
        omrade: "kliniskt-stod",
        status: "utkast",
        organisationId: ORG_A,
        titel: "Checklista",
        innehall: "x",
        steg: [{ text: "Kontrollera puls" }, { text: "Kontrollera andning" }],
      })
    )
  );
  await test("volA kan INTE spara en rutin med fler än 12 checklistesteg", () =>
    assertFails(
      addDoc(collection(volA, "rutiner"), {
        omrade: "kliniskt-stod",
        status: "utkast",
        organisationId: ORG_A,
        titel: "För lång checklista",
        innehall: "x",
        steg: Array.from({ length: 13 }, (_, i) => ({ text: `Steg ${i + 1}` })),
      })
    )
  );
  await test("sektionsledareA kan INTE smyga in ett personnummer i ett stegs text vid en uppdatering", () =>
    assertFails(
      updateDoc(doc(sektionsledareA, "rutiner", "rutinKurateradA"), {
        steg: [{ text: "Ring 900101-0017 vid komplikation." }],
      })
    )
  );

  console.log("\nrutiner/{rutinId}.kviss – Etapp 19b: PII-spärr och taklängd för mikrokvissens frågor");
  await test("volA kan INTE skapa en rutin med ett personnummer inbäddat i en kviss-fråga", () =>
    assertFails(
      addDoc(collection(volA, "rutiner"), {
        omrade: "kliniskt-stod",
        status: "utkast",
        organisationId: ORG_A,
        titel: "Checklista",
        innehall: "x",
        kviss: [
          {
            fraga: "Vad gäller för patient 900101-0017?",
            alternativ: ["A", "B"],
            rattIndex: 0,
            hanvisning: "Se rutin",
          },
        ],
      })
    )
  );
  await test("volA kan INTE skapa en rutin med ett personnummer inbäddat i en kviss-hänvisning", () =>
    assertFails(
      addDoc(collection(volA, "rutiner"), {
        omrade: "kliniskt-stod",
        status: "utkast",
        organisationId: ORG_A,
        titel: "Checklista",
        innehall: "x",
        kviss: [
          {
            fraga: "Vad gäller?",
            alternativ: ["A", "B"],
            rattIndex: 0,
            hanvisning: "Ring 900101-0017 vid komplikation.",
          },
        ],
      })
    )
  );
  await test("volA KAN skapa en rutin med giltiga kviss-frågor (ingen PII)", () =>
    assertSucceeds(
      addDoc(collection(volA, "rutiner"), {
        omrade: "kliniskt-stod",
        status: "utkast",
        organisationId: ORG_A,
        titel: "Checklista",
        innehall: "x",
        kviss: [
          { fraga: "Vad kontrolleras först?", alternativ: ["Puls", "Andning"], rattIndex: 0, hanvisning: "Se steg 1" },
        ],
      })
    )
  );
  await test("volA kan INTE spara en rutin med fler än 4 kviss-frågor", () =>
    assertFails(
      addDoc(collection(volA, "rutiner"), {
        omrade: "kliniskt-stod",
        status: "utkast",
        organisationId: ORG_A,
        titel: "För lång kviss",
        innehall: "x",
        kviss: Array.from({ length: 5 }, (_, i) => ({
          fraga: `Fråga ${i + 1}`,
          alternativ: ["A", "B"],
          rattIndex: 0,
          hanvisning: "x",
        })),
      })
    )
  );
  await test("sektionsledareA kan INTE smyga in ett personnummer i en kviss-fråga vid en uppdatering", () =>
    assertFails(
      updateDoc(doc(sektionsledareA, "rutiner", "rutinKurateradA"), {
        kviss: [
          {
            fraga: "Ring 900101-0017 vid komplikation.",
            alternativ: ["A", "B"],
            rattIndex: 0,
            hanvisning: "x",
          },
        ],
      })
    )
  );

  console.log("\nrutiner/{rutinId}.externaKallor – Etapp 21a: bara godkända källdomäner, taklängd 4");
  await test("volA KAN skapa en rutin med en referens till en godkänd källdomän", () =>
    assertSucceeds(
      addDoc(collection(volA, "rutiner"), {
        omrade: "kliniskt-stod",
        status: "utkast",
        organisationId: ORG_A,
        titel: "Med källa",
        innehall: "x",
        externaKallor: ["https://www.internetmedicin.se/artikel"],
      })
    )
  );
  await test("volA kan INTE skapa en rutin med en referens till en icke-godkänd domän", () =>
    assertFails(
      addDoc(collection(volA, "rutiner"), {
        omrade: "kliniskt-stod",
        status: "utkast",
        organisationId: ORG_A,
        titel: "Med otillåten källa",
        innehall: "x",
        externaKallor: ["https://www.example.com/artikel"],
      })
    )
  );
  await test("volA kan INTE spara en rutin med fler än 4 källor", () =>
    assertFails(
      addDoc(collection(volA, "rutiner"), {
        omrade: "kliniskt-stod",
        status: "utkast",
        organisationId: ORG_A,
        titel: "För många källor",
        innehall: "x",
        externaKallor: [
          "https://www.1177.se/a",
          "https://www.1177.se/b",
          "https://www.1177.se/c",
          "https://www.1177.se/d",
          "https://www.1177.se/e",
        ],
      })
    )
  );
  await test("sektionsledareA kan INTE smyga in en otillåten källdomän vid en uppdatering", () =>
    assertFails(
      updateDoc(doc(sektionsledareA, "rutiner", "rutinKurateradA"), {
        externaKallor: ["https://evil.example.com"],
      })
    )
  );

  console.log("\nrutiner/{rutinId}.senasteVasentligaAndring – Etapp 19c: bara VÖL/superadmin flaggar väsentlig ändring");
  await test("sektionsledareA (redigerar men godkänner inte) kan INTE sätta senasteVasentligaAndring", () =>
    assertFails(
      updateDoc(doc(sektionsledareA, "rutiner", "rutinKurateradA"), {
        senasteVasentligaAndring: new Date(),
      })
    )
  );
  await test("volA (får godkänna kliniskt innehåll) KAN sätta senasteVasentligaAndring", () =>
    assertSucceeds(
      updateDoc(doc(volA, "rutiner", "rutinKurateradA"), {
        senasteVasentligaAndring: new Date(),
      })
    )
  );

  console.log("\nkompetenskrav/{kravId} – Etapp 19c: bara VEC/superadmin definierar obligatoriska rutiner");
  let kravTestId;
  await test("personalA (ingen redaktörsroll) kan INTE skapa ett kompetenskrav", () =>
    assertFails(
      addDoc(collection(personalA, "kompetenskrav"), {
        roll: "personal", rutinId: "rutinKurateradA", rutinTitel: "Test", omrade: "kliniskt-stod",
        frekvensManader: 12, organisationId: ORG_A,
      })
    )
  );
  await test("vecA KAN skapa ett kompetenskrav i sin egen organisation", async () => {
    const ref = await addDoc(collection(vecA, "kompetenskrav"), {
      roll: "personal", rutinId: "rutinKurateradA", rutinTitel: "Test", omrade: "kliniskt-stod",
      frekvensManader: 12, organisationId: ORG_A,
    });
    kravTestId = ref.id;
  });
  await test("personalA (alla i organisationen) KAN läsa ett kompetenskrav", () =>
    assertSucceeds(getDoc(doc(personalA, "kompetenskrav", kravTestId)))
  );
  await test("superadminB (fel organisation) kan INTE läsa org A:s kompetenskrav", () =>
    assertFails(getDoc(doc(superB, "kompetenskrav", kravTestId)))
  );
  await test("personalA kan INTE ta bort ett kompetenskrav", () =>
    assertFails(deleteDoc(doc(personalA, "kompetenskrav", kravTestId)))
  );
  await test("vecA KAN ta bort ett kompetenskrav i sin egen organisation", () =>
    assertSucceeds(deleteDoc(doc(vecA, "kompetenskrav", kravTestId)))
  );

  console.log("\nbristanmalningar/{bristId} – Etapp 20a/b: anmäla, dubblettskydd, hantering");
  let bristTestId;
  await test("personalA (ingen redaktörsroll) KAN anmäla en brist på en artikel", async () => {
    const ref = await addDoc(collection(personalA, "bristanmalningar"), {
      artikelId: "artikelA", artikelNamn: "Kanyler", forrad: "Engångsförrådet",
      status: "ny", antalAnmalningar: 1, kommentar: "", anmaldAv: "personalA",
      organisationId: ORG_A,
    });
    bristTestId = ref.id;
  });
  await test("personalA kan INTE anmäla en brist i någon annans namn (anmaldAv måste vara den egna uiden)", () =>
    assertFails(
      addDoc(collection(personalA, "bristanmalningar"), {
        artikelId: "artikelA", artikelNamn: "Kanyler", forrad: "Engångsförrådet",
        status: "ny", antalAnmalningar: 1, kommentar: "", anmaldAv: "volA",
        organisationId: ORG_A,
      })
    )
  );
  await test("personalA kan INTE anmäla en brist med ett personnummer i kommentaren", () =>
    assertFails(
      addDoc(collection(personalA, "bristanmalningar"), {
        artikelId: "artikelA", artikelNamn: "Kanyler", forrad: "Engångsförrådet",
        status: "ny", antalAnmalningar: 1, kommentar: "Gäller patient 900101-0017", anmaldAv: "personalA",
        organisationId: ORG_A,
      })
    )
  );
  await test("volA (ingen förrådsroll, men rätt organisation) KAN höja antalAnmalningar på personalA:s öppna anmälan (dubblettskydd)", () =>
    assertSucceeds(
      updateDoc(doc(volA, "bristanmalningar", bristTestId), { antalAnmalningar: 2, senastAnmald: new Date() })
    )
  );
  await test("volA kan INTE byta status på en anmälan (det kräver förrådsansvarig/superadmin)", () =>
    assertFails(updateDoc(doc(volA, "bristanmalningar", bristTestId), { status: "hanterad" }))
  );
  await test("personalA (som anmälde den) KAN läsa sin egen anmälan", () =>
    assertSucceeds(getDoc(doc(personalA, "bristanmalningar", bristTestId)))
  );
  await test("superadminB (fel organisation) kan INTE läsa org A:s bristanmälan", () =>
    assertFails(getDoc(doc(superB, "bristanmalningar", bristTestId)))
  );
  await test("superadminA (får hantera logistik) KAN markera anmälan som hanterad", () =>
    assertSucceeds(
      updateDoc(doc(superA, "bristanmalningar", bristTestId), {
        status: "hanterad", hanteradAv: "superadminA", hanteradAvNamn: "", hanteradDatum: new Date(),
      })
    )
  );
  await test("personalA kan INTE ta bort en bristanmälan", () =>
    assertFails(deleteDoc(doc(personalA, "bristanmalningar", bristTestId)))
  );
  await test("superadminA KAN ta bort en bristanmälan i sin egen organisation", () =>
    assertSucceeds(deleteDoc(doc(superA, "bristanmalningar", bristTestId)))
  );

  console.log("\ncheckriktlistkorningar/{rutinId} – Etapp 18d: aggregerad statistik, organisationsisolerad");
  await test("volA KAN räkna upp påbörjade körningar för en rutin i sin egen organisation", () =>
    assertSucceeds(
      setDoc(
        doc(volA, "checklistkorningar", "rutinKurateradA"),
        { organisationId: ORG_A, antalPaborjade: 1 },
        { merge: true }
      )
    )
  );
  await test("superadminB (fel organisation) kan INTE läsa org A:s checklistastatistik", () =>
    assertFails(getDoc(doc(superB, "checklistkorningar", "rutinKurateradA")))
  );
  await test("superadminB (fel organisation) kan INTE räkna upp org A:s checklistastatistik", () =>
    assertFails(
      setDoc(
        doc(superB, "checklistkorningar", "rutinKurateradA"),
        { organisationId: ORG_A, antalPaborjade: 99 },
        { merge: true }
      )
    )
  );

  console.log("\nintroduktionsspar/{sparId} – Etapp 19a: bara VEC/superadmin hanterar definitioner");
  let sparTestId;
  await test("personalA (ingen redaktörsroll) kan INTE skapa ett introduktionsspår", () =>
    assertFails(
      addDoc(collection(personalA, "introduktionsspar"), {
        namn: "Test", malRoll: "personal", organisationId: ORG_A, etapper: [],
      })
    )
  );
  await test("vecA KAN skapa ett introduktionsspår i sin egen organisation", async () => {
    const ref = await addDoc(collection(vecA, "introduktionsspar"), {
      namn: "Introduktion för personal", malRoll: "personal", organisationId: ORG_A, etapper: [],
    });
    sparTestId = ref.id;
  });
  await test("personalA (alla i organisationen) KAN läsa spårets namn", () =>
    assertSucceeds(getDoc(doc(personalA, "introduktionsspar", sparTestId)))
  );
  await test("superadminB (fel organisation) kan INTE läsa org A:s introduktionsspår", () =>
    assertFails(getDoc(doc(superB, "introduktionsspar", sparTestId)))
  );
  await test("personalA kan INTE ta bort ett introduktionsspår", () =>
    assertFails(deleteDoc(doc(personalA, "introduktionsspar", sparTestId)))
  );

  console.log("\nintroduktionstilldelningar/{uid} – Etapp 19a: egen läsning + VEC/superadmin-hantering");
  await test("vecA KAN tilldela personalA ett introduktionsspår", () =>
    assertSucceeds(
      setDoc(doc(vecA, "introduktionstilldelningar", "personalA"), {
        uid: "personalA", namn: "Personal A", organisationId: ORG_A,
        sparId: sparTestId, sparNamn: "Introduktion för personal", malRoll: "personal",
      })
    )
  );
  await test("personalA KAN läsa sin EGEN tilldelning", () =>
    assertSucceeds(getDoc(doc(personalA, "introduktionstilldelningar", "personalA")))
  );
  await test("sektionsledareA (annan person, ingen redaktörsroll för det här) kan INTE läsa personalA:s tilldelning", () =>
    assertFails(getDoc(doc(sektionsledareA, "introduktionstilldelningar", "personalA")))
  );
  await test("superadminB (fel organisation) kan INTE läsa org A:s tilldelning", () =>
    assertFails(getDoc(doc(superB, "introduktionstilldelningar", "personalA")))
  );
  await test("personalA kan INTE ta bort sin egen tilldelning", () =>
    assertFails(deleteDoc(doc(personalA, "introduktionstilldelningar", "personalA")))
  );

  console.log("\nharTroligtPersonnummer – måste fånga ett INBÄDDAT personnummer, inte bara ett exakt fält (Etapp 12e-fixen)");
  await test("volA kan INTE skapa en rutin där innehållet INNEHÅLLER ett personnummer mitt i en mening", () =>
    assertFails(
      addDoc(collection(volA, "rutiner"), {
        omrade: "kliniskt-stod",
        status: "utkast",
        organisationId: ORG_A,
        titel: "Patientuppföljning",
        innehall: "Se journalanteckning för patient med personnummer 900101-0017 för detaljer.",
      })
    )
  );
  await test("volA KAN fortfarande skapa en rutin med normalt innehåll utan personnummer", () =>
    assertSucceeds(
      addDoc(collection(volA, "rutiner"), {
        omrade: "kliniskt-stod",
        status: "utkast",
        organisationId: ORG_A,
        titel: "Handläggning vid bröstsmärta",
        innehall: "Kontrollera vitalparametrar och gör EKG inom 10 minuter.",
      })
    )
  );

  console.log("\nusers/{userId} – Etapp 6c: självbetjänings-create är stängt helt");
  await test("volA kan INTE skapa sitt eget users-dokument direkt (måste gå via losInInbjudan)", () =>
    assertFails(
      setDoc(doc(volA, "users", "nyttKontoA"), { role: "personal", organisationId: ORG_A })
    )
  );
  await test('en klient kan INTE ens skapa sig själv i "default" med rollen personal (gamla hålet)', () =>
    assertFails(
      setDoc(doc(volA, "users", "nyttKontoDefault"), { role: "personal", organisationId: "default" })
    )
  );

  console.log("\nplattformsadmin/{uid} – Etapp 6a: existens är hela behörigheten");
  await test("volA (ingen plattformsadmin) kan INTE läsa plattformsadmin-collectionen", () =>
    assertFails(getDoc(doc(volA, "plattformsadmin", "vemsomhelst")))
  );
  await test("ingen klient kan NÅGONSIN skriva till plattformsadmin, inte ens sig själv", () =>
    assertFails(setDoc(doc(superA, "plattformsadmin", "superadminA"), { blevPlattformsadmin: true }))
  );
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "plattformsadmin", "superadminA"), { blevPlattformsadmin: true });
  });
  await test("en utsedd leverantörsadmin KAN läsa organisationer/{orgId} för VILKEN organisation som helst", () =>
    Promise.all([
      assertSucceeds(getDoc(doc(superA, "organisationer", ORG_A))),
      assertSucceeds(getDoc(doc(superA, "organisationer", ORG_B))),
    ])
  );

  console.log("\ninbjudningar/{token} – Etapp 6c: bara nåbar via Cloud Functions");
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "inbjudningar", "test-token"), {
      organisationId: ORG_A,
      roll: "personal",
      epost: "ny@exempel.se",
      anvand: false,
    });
  });
  await test("ingen klient (ens superadmin i rätt org) kan läsa en inbjudan direkt", () =>
    assertFails(getDoc(doc(superA, "inbjudningar", "test-token")))
  );
  await test("ingen klient kan skriva/skapa en inbjudan direkt", () =>
    assertFails(setDoc(doc(superA, "inbjudningar", "eget-token"), { organisationId: ORG_A }))
  );

  console.log("\nEtapp 6d – pausad organisation nekar org-skopat innehåll (organisationenArAktiv)");
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "organisationer", ORG_A), { status: "pausad" }, { merge: true });
  });
  await test("volA kan INTE längre läsa org A:s rutin när organisationen är pausad", () =>
    assertFails(getDoc(doc(volA, "rutiner", "rutinA")))
  );
  await test("volA kan fortfarande läsa organisationer/{orgId} själv (ser att den är pausad)", () =>
    assertSucceeds(getDoc(doc(volA, "organisationer", ORG_A)))
  );
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "organisationer", ORG_A), { status: "aktiv" }, { merge: true });
  });
  await test("volA kan läsa org A:s rutin igen efter att organisationen återaktiverats", () =>
    assertSucceeds(getDoc(doc(volA, "rutiner", "rutinA")))
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
