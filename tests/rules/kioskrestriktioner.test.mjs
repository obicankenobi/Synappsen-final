// Etapp 55: bevisar att kiosk-rollen (ett delat enhetskonto, inte en person) INTE kan utföra
// identitetsbundna handlingar (kvittera en rutin/anslag, bristanmäla, föreslå en ändring,
// skiftrapportera) trots att den i övrigt är en vanlig inloggad medlem av organisationen – och
// att kiosk-PIN:en (organisationer/{orgId}/installningar/kioskPin) är helt stängd för alla
// klienter, inklusive superadmin. Körs mot Firestore-emulatorn:
//
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/kioskrestriktioner.test.mjs"
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const ORG_A = "orgA";

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
    await setDoc(doc(db, "users", "kioskA"), { role: "kiosk", organisationId: ORG_A });
    await setDoc(doc(db, "users", "personalA"), { role: "personal", organisationId: ORG_A });
    await setDoc(doc(db, "users", "superadminA"), { role: "superadmin", organisationId: ORG_A });

    // Fynd 4.4: en anteckning som redan finns under kioskkontot – bevisar att läsning finns
    // kvar (inget försvinner tyst) medan skrivning stängs.
    await setDoc(doc(db, "anteckningar", "kioskA_befintlig"), { uid: "kioskA", text: "Sedan tidigare" });

    await setDoc(doc(db, "rutiner", "rutinA1"), {
      organisationId: ORG_A,
      omrade: "kliniskt-stod",
      status: "godkand",
      titel: "En rutin",
      innehall: "Innehåll",
      lasteAv: [],
    });
    await setDoc(doc(db, "anslag", "anslagA1"), {
      organisationId: ORG_A,
      titel: "Ett anslag",
      innehall: "Innehåll",
      lasteAv: [],
    });
    await setDoc(doc(db, "organisationer", ORG_A), { namn: "Org A" });
  });

  const kioskA = testEnv.authenticatedContext("kioskA").firestore();
  const personalA = testEnv.authenticatedContext("personalA").firestore();
  const superA = testEnv.authenticatedContext("superadminA").firestore();

  console.log("\nkiosk – kan INTE kvittera läsning");
  await test("kioskA kan INTE kvittera en rutin (lasteAv)", () =>
    assertFails(updateDoc(doc(kioskA, "rutiner", "rutinA1"), { lasteAv: ["kioskA"] }))
  );
  await test("personalA (jämförelse) KAN kvittera samma rutin", () =>
    assertSucceeds(updateDoc(doc(personalA, "rutiner", "rutinA1"), { lasteAv: ["personalA"] }))
  );
  await test("kioskA kan INTE kvittera ett anslag (lasteAv)", () =>
    assertFails(updateDoc(doc(kioskA, "anslag", "anslagA1"), { lasteAv: ["kioskA"] }))
  );

  console.log("\nkiosk – kan INTE göra identitetsbundna skapanden");
  await test("kioskA kan INTE skapa en bristanmälan", () =>
    assertFails(
      setDoc(doc(kioskA, "bristanmalningar", "bristKiosk"), {
        organisationId: ORG_A,
        anmaldAv: "kioskA",
        status: "ny",
        antalAnmalningar: 1,
      })
    )
  );
  await test("kioskA kan INTE föreslå en ändring", () =>
    assertFails(
      setDoc(doc(kioskA, "andringsforslag", "forslagKiosk"), {
        organisationId: ORG_A,
        omrade: "kliniskt-stod",
        foreslagenAv: "kioskA",
        status: "ny",
        markeratStycke: "x",
        forslag: "y",
        motivering: "z",
      })
    )
  );
  await test("kioskA kan INTE skapa en skiftrapport", () =>
    assertFails(
      setDoc(doc(kioskA, "skiftrapporter", "postKiosk"), {
        organisationId: ORG_A,
        skapadAv: "kioskA",
        text: "Driftinfo",
        atgardad: false,
      })
    )
  );

  console.log("\nkiosk-PIN – helt stängd för klienter");
  await test("superadminA kan INTE läsa kiosk-PIN-hashen direkt", () =>
    assertFails(getDoc(doc(superA, "organisationer", ORG_A, "installningar", "kioskPin")))
  );
  await test("superadminA kan INTE skriva kiosk-PIN-hashen direkt", () =>
    assertFails(setDoc(doc(superA, "organisationer", ORG_A, "installningar", "kioskPin"), { hash: "x" }))
  );

  // SÄKERHETSGRANSKNING 2026-08-17 (Del 4 – fynd 4.4). anteckningar/{uid}_{rutinId} saknade
  // !arKiosk() trots att fem andra collections i den här filen redan har den – och det är den
  // ENDA collectionen vars gränssnitt uttryckligen lovar avskildhet ("Bara du kan se det du
  // skriver här"). På ett delat enhetskonto var löftet falskt: nästa person vid plattan såg
  // samma text, eftersom dokument-id:t bygger på kontots uid och kiosken har ett enda uid.
  // De två första testerna nedan FAILADE mot reglerna före patchen.
  console.log("\nprivata anteckningar – kiosk får inte skriva under ett falskt privatlöfte");
  await test("kioskA kan INTE skapa en privat anteckning", () =>
    assertFails(
      setDoc(doc(kioskA, "anteckningar", "kioskA_rutinA1"), { uid: "kioskA", text: "Hemligt" })
    )
  );
  await test("kioskA kan INTE uppdatera en befintlig anteckning", () =>
    assertFails(updateDoc(doc(kioskA, "anteckningar", "kioskA_befintlig"), { text: "Ändrad" }))
  );
  await test("kioskA kan fortfarande LÄSA det som redan skrivits (raderas inte tyst)", () =>
    assertSucceeds(getDoc(doc(kioskA, "anteckningar", "kioskA_befintlig")))
  );
  await test("en vanlig person kan fortfarande skapa sin egen anteckning", () =>
    assertSucceeds(
      setDoc(doc(personalA, "anteckningar", "personalA_rutinA1"), {
        uid: "personalA",
        text: "Min minnesanteckning",
      })
    )
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
