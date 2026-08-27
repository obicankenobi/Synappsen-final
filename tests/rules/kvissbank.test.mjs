// Etapp 71: regeltester för frågebanken bakom Öva-läget.
//
// Två egenskaper bevisas här, och båda är avgörande:
//
// 1. INGEN klient får skriva någonstans i banken – varken leverantörens globala frågor,
//    kundens överlagringar eller kundens egna frågor. Allt går via Cloud Functions, eftersom
//    varje ändring ska rolltestas, PII-kontrolleras och revisionsloggas. Ett `allow write`
//    som råkat slinka in hade tyst kringgått alla tre.
// 2. Kundens överlagringar och egna frågor är ORGANISATIONSISOLERADE. En kvissfråga kan
//    innehålla verksamhetsintern information ("så här gör VI"), och att en organisation kunde
//    läsa en annans vore samma klass av läcka som för rutiner.
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/kvissbank.test.mjs"
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";

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
    await setDoc(doc(db, "users", "volA"), { role: "vol", organisationId: ORG_A });
    await setDoc(doc(db, "users", "personalA"), { role: "personal", organisationId: ORG_A });
    await setDoc(doc(db, "users", "superadminB"), { role: "superadmin", organisationId: ORG_B });
    await setDoc(doc(db, "organisationer", ORG_A), { namn: "Org A" });
    await setDoc(doc(db, "organisationer", ORG_B), { namn: "Org B" });

    await setDoc(doc(db, "kvissfragor", "g1"), {
      paket: "yrkeskunskap",
      fraga: "En global fråga?",
      alternativ: ["a", "b", "c"],
      rattIndex: 0,
    });
    await setDoc(doc(db, "kvisspaket", "kliniskt"), { avstangt: true });

    await setDoc(doc(db, "organisationer", ORG_A, "kvissoverlagring", "g1"), { dold: true });
    await setDoc(doc(db, "organisationer", ORG_A, "kvissegna", "e1"), {
      paket: "eget",
      fraga: "Vår egen fråga?",
      alternativ: ["a", "b", "c"],
      rattIndex: 0,
    });
    await setDoc(doc(db, "organisationer", ORG_B, "kvissegna", "e2"), {
      paket: "eget",
      fraga: "Org B:s fråga?",
      alternativ: ["a", "b", "c"],
      rattIndex: 0,
    });
  });

  const superA = testEnv.authenticatedContext("superadminA").firestore();
  const volA = testEnv.authenticatedContext("volA").firestore();
  const personalA = testEnv.authenticatedContext("personalA").firestore();
  const superB = testEnv.authenticatedContext("superadminB").firestore();
  const utloggad = testEnv.unauthenticatedContext().firestore();

  console.log("\nGlobala frågor – läsbara för alla inloggade, skrivbara för ingen");
  await test("personal KAN läsa den globala banken (Öva-läget behöver den)", () =>
    assertSucceeds(getDocs(collection(personalA, "kvissfragor")))
  );
  await test("en superadmin i EN ANNAN organisation kan också läsa den (den är global)", () =>
    assertSucceeds(getDoc(doc(superB, "kvissfragor", "g1")))
  );
  await test("en UTLOGGAD kan INTE läsa den", () =>
    assertFails(getDoc(doc(utloggad, "kvissfragor", "g1")))
  );
  await test("superadmin kan INTE skriva en global fråga direkt (måste gå via Cloud Function)", () =>
    assertFails(setDoc(doc(superA, "kvissfragor", "nyG"), { paket: "yrkeskunskap", fraga: "x" }))
  );
  await test("superadmin kan INTE ändra en global fråga direkt", () =>
    assertFails(updateDoc(doc(superA, "kvissfragor", "g1"), { fraga: "kapad" }))
  );
  await test("superadmin kan INTE radera en global fråga direkt", () =>
    assertFails(deleteDoc(doc(superA, "kvissfragor", "g1")))
  );

  console.log("\nGlobalt nödstopp – måste vara LÄSBART för vanliga användare, annars döljer det inget");
  await test("personal KAN läsa kvisspaket (annars kan nödstoppet inte tillämpas)", () =>
    assertSucceeds(getDoc(doc(personalA, "kvisspaket", "kliniskt")))
  );
  await test("superadmin kan INTE skriva nödstoppet direkt", () =>
    assertFails(setDoc(doc(superA, "kvisspaket", "kliniskt"), { avstangt: false }))
  );

  console.log("\nÖverlagringar – organisationsisolerade, skrivbara för ingen klient");
  await test("personal i egen org KAN läsa överlagringarna (Öva måste tillämpa dem)", () =>
    assertSucceeds(getDoc(doc(personalA, "organisationer", ORG_A, "kvissoverlagring", "g1")))
  );
  await test("org B kan INTE läsa org A:s överlagringar", () =>
    assertFails(getDoc(doc(superB, "organisationer", ORG_A, "kvissoverlagring", "g1")))
  );
  await test("superadmin kan INTE skriva en överlagring direkt", () =>
    assertFails(
      setDoc(doc(superA, "organisationer", ORG_A, "kvissoverlagring", "g1"), { dold: false })
    )
  );
  await test("VÖL kan INTE heller skriva en överlagring direkt", () =>
    assertFails(
      setDoc(doc(volA, "organisationer", ORG_A, "kvissoverlagring", "g1"), { dold: false })
    )
  );

  console.log("\nEgna frågor – organisationsisolerade, skrivbara för ingen klient");
  await test("personal i egen org KAN läsa organisationens egna frågor", () =>
    assertSucceeds(getDocs(collection(personalA, "organisationer", ORG_A, "kvissegna")))
  );
  await test("org B kan INTE läsa org A:s egna frågor", () =>
    assertFails(getDocs(collection(superB, "organisationer", ORG_A, "kvissegna")))
  );
  await test("org A kan INTE läsa org B:s egna frågor (kontroll åt andra hållet)", () =>
    assertFails(getDocs(collection(superA, "organisationer", ORG_B, "kvissegna")))
  );
  await test("superadmin kan INTE skapa en egen fråga direkt", () =>
    assertFails(
      setDoc(doc(superA, "organisationer", ORG_A, "kvissegna", "nyE"), {
        fraga: "x",
        alternativ: ["a", "b", "c"],
        rattIndex: 0,
      })
    )
  );
  await test("superadmin kan INTE radera en egen fråga direkt", () =>
    assertFails(deleteDoc(doc(superA, "organisationer", ORG_A, "kvissegna", "e1")))
  );

  console.log("\nPaketvalet på organisationsdokumentet skrivs bara via satKvisspaket");
  await test("superadmin kan INTE sätta kvisspaket direkt på organisationen", () =>
    assertFails(updateDoc(doc(superA, "organisationer", ORG_A), { kvisspaket: { kliniskt: false } }))
  );
  await test("en orörd uppdatering av organisationen fungerar fortfarande (ingen regression)", () =>
    assertSucceeds(updateDoc(doc(superA, "organisationer", ORG_A), { namn: "Org A omdöpt" }))
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
