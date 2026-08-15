// Etapp 66d (ETAPPLAN15.md): skiftrapporter/{postId} fick två nya valfria fält – kategori
// (fast lista, se arGiltigDriftstorningskategori i firestore.rules) och rutinId – som kan
// sättas I EFTERHAND, inte bara vid skapandet. `text` förblir MEDVETET oföränderlig efter
// publicering (bararForandrarFalt-listan utökades, den bytte inte princip).
//
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/skiftrapportkategorisering.test.mjs"
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, updateDoc, setDoc, collection, addDoc } from "firebase/firestore";

const ORG_A = "orgSkiftA";
const ORG_B = "orgSkiftB";

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
    await setDoc(doc(db, "users", "superadminB"), { role: "superadmin", organisationId: ORG_B });

    await setDoc(doc(db, "skiftrapporter", "skiftKatA"), {
      text: "Hiss 2 ur funktion",
      skapadAv: "personalA",
      atgardad: false,
      organisationId: ORG_A,
    });
  });

  const personalA = testEnv.authenticatedContext("personalA").firestore();
  const superB = testEnv.authenticatedContext("superadminB").firestore();

  console.log("\nskiftrapporter/{postId} – skapande med kategori");
  await test("skapande UTAN kategori fungerar fortfarande (oförändrat beteende)", () =>
    assertSucceeds(
      addDoc(collection(personalA, "skiftrapporter"), {
        text: "Slut på sutur-set",
        skapadAv: "personalA",
        atgardad: false,
        organisationId: ORG_A,
      })
    )
  );
  await test("skapande MED en giltig kategori fungerar", () =>
    assertSucceeds(
      addDoc(collection(personalA, "skiftrapporter"), {
        text: "Vattenläcka i taket",
        skapadAv: "personalA",
        atgardad: false,
        kategori: "lokal",
        organisationId: ORG_A,
      })
    )
  );
  await test("skapande MED en OGILTIG kategori avvisas", () =>
    assertFails(
      addDoc(collection(personalA, "skiftrapporter"), {
        text: "Fritextkategori istället för fast lista",
        skapadAv: "personalA",
        atgardad: false,
        kategori: "vad som helst",
        organisationId: ORG_A,
      })
    )
  );

  console.log("\nskiftrapporter/{postId} – kategorisering/länkning i efterhand");
  await test("en organisationsmedlem KAN sätta kategori i efterhand, även utan att äga posten", () =>
    assertSucceeds(updateDoc(doc(personalA, "skiftrapporter", "skiftKatA"), { kategori: "it" }))
  );
  await test("en organisationsmedlem KAN länka posten till en rutin i efterhand", () =>
    assertSucceeds(updateDoc(doc(personalA, "skiftrapporter", "skiftKatA"), { rutinId: "rutinX" }))
  );
  await test("en OGILTIG kategori avvisas även vid uppdatering", () =>
    assertFails(updateDoc(doc(personalA, "skiftrapporter", "skiftKatA"), { kategori: "pafittat" }))
  );
  await test("kategori kan rensas tillbaka till null (inte bara sättas)", () =>
    assertSucceeds(updateDoc(doc(personalA, "skiftrapporter", "skiftKatA"), { kategori: null }))
  );
  await test("text kan fortfarande INTE ändras i efterhand (oförändrad princip)", () =>
    assertFails(updateDoc(doc(personalA, "skiftrapporter", "skiftKatA"), { text: "Ändrad i efterhand" }))
  );
  await test("en superadmin i en ANNAN organisation kan INTE kategorisera (organisationsisolering)", () =>
    assertFails(updateDoc(doc(superB, "skiftrapporter", "skiftKatA"), { kategori: "medicinteknik" }))
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
