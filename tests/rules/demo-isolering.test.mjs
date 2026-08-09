// Etapp 51: "Hårt krav" i ETAPPLAN10.md §51 – demo-organisationen ("_demo") får ALDRIG nås
// från ett riktigt kundkonto eller tvärtom, och det ska bevisas med ett rules-test, inte bara
// litas på som en UI-regel. Mekanismen är identisk med all annan organisationsisolering
// (matcharMinOrg, redan uttömmande testad generiskt i organisationsisolering.test.mjs) – den
// här filen finns för att göra just "_demo" explicit, så att en framtida specialbehandling av
// demo-organisationen i koden inte kan råka bryta isoleringen utan att ett test upptäcker det.
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/demo-isolering.test.mjs"
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
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
    await setDoc(doc(db, "organisationer", "_demo"), { namn: "Demo & övning", status: "aktiv", arDemo: true });
    await setDoc(doc(db, "organisationer", "orgRiktig"), { namn: "Riktig kund AB", status: "aktiv" });
    await setDoc(doc(db, "users", "superDemo"), { role: "superadmin", organisationId: "_demo" });
    await setDoc(doc(db, "users", "superRiktig"), { role: "superadmin", organisationId: "orgRiktig" });
    await setDoc(doc(db, "rutiner", "rDemo"), {
      organisationId: "_demo",
      titel: "Demo-rutin",
      status: "godkand",
      omrade: "kliniskt-stod",
    });
    await setDoc(doc(db, "rutiner", "rRiktig"), {
      organisationId: "orgRiktig",
      titel: "Riktig rutin",
      status: "godkand",
      omrade: "kliniskt-stod",
    });
  });

  const superDemo = testEnv.authenticatedContext("superDemo").firestore();
  const superRiktig = testEnv.authenticatedContext("superRiktig").firestore();

  console.log("\n_demo-isolering – ett riktigt kundkonto kan ALDRIG nå demo-organisationen");
  await test("en riktig kunds superadmin kan INTE läsa demo-organisationens rutin", () =>
    assertFails(getDoc(doc(superRiktig, "rutiner", "rDemo")))
  );

  console.log("\n_demo-isolering – demo-organisationen kan ALDRIG nå ett riktigt kundkonto");
  await test("demo-organisationens superadmin kan INTE läsa den riktiga kundens rutin", () =>
    assertFails(getDoc(doc(superDemo, "rutiner", "rRiktig")))
  );

  console.log("\n_demo-isolering – båda läser fortfarande sin egen data som vanligt");
  await test("demo-organisationens superadmin KAN läsa sin egen demo-rutin", () =>
    assertSucceeds(getDoc(doc(superDemo, "rutiner", "rDemo")))
  );
  await test("den riktiga kundens superadmin KAN läsa sin egen rutin", () =>
    assertSucceeds(getDoc(doc(superRiktig, "rutiner", "rRiktig")))
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
