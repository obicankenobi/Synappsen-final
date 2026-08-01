// Etapp 37b: bevisar att granskningsrundor/{rundaId} bara kan skapas och läsas av superadmin
// i den egna organisationen, aldrig uppdateras av en klient (ögonblicksbilden av rutinIds ska
// vara oföränderlig), och att en icke-superadmin-roll inte kommer åt collectionen alls
// (krav 14 i ETAPPLAN6.md – detta är ett arbetsverktyg för ledningen, inte en bredare vy).
// Körs mot Firestore-emulatorn:
//
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/granskningsrundor.test.mjs"
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

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
    await setDoc(doc(db, "users", "superadminB"), { role: "superadmin", organisationId: ORG_B });
    await setDoc(doc(db, "users", "volA"), { role: "vol", organisationId: ORG_A });

    await setDoc(doc(db, "granskningsrundor", "rundaA1"), {
      organisationId: ORG_A,
      omrade: "kliniskt-stod",
      trosallDagar: 540,
      deadline: "2026-12-01",
      rutinIds: ["rutin1", "rutin2"],
      skapadAv: "superadminA",
      skapadAvNamn: "Super A",
    });
  });

  const superA = testEnv.authenticatedContext("superadminA").firestore();
  const superB = testEnv.authenticatedContext("superadminB").firestore();
  const volA = testEnv.authenticatedContext("volA").firestore();

  console.log("\ngranskningsrundor/{rundaId} – läsning");
  await test("superadminA kan läsa sin egen organisations runda", () =>
    assertSucceeds(getDoc(doc(superA, "granskningsrundor", "rundaA1")))
  );
  await test("superadminB kan INTE läsa org A:s runda", () =>
    assertFails(getDoc(doc(superB, "granskningsrundor", "rundaA1")))
  );
  await test("en vanlig roll (vol) kan INTE läsa sin egen organisations rundor", () =>
    assertFails(getDoc(doc(volA, "granskningsrundor", "rundaA1")))
  );

  console.log("\ngranskningsrundor/{rundaId} – skapande");
  await test("superadminA kan starta en ny runda i sin egen organisation", () =>
    assertSucceeds(
      setDoc(doc(superA, "granskningsrundor", "rundaA2"), {
        organisationId: ORG_A,
        omrade: "administration",
        trosallDagar: 365,
        deadline: "2026-11-01",
        rutinIds: ["rutin3"],
        skapadAv: "superadminA",
        skapadAvNamn: "Super A",
      })
    )
  );
  await test("en vanlig roll (vol) kan INTE starta en runda", () =>
    assertFails(
      setDoc(doc(volA, "granskningsrundor", "rundaVol"), {
        organisationId: ORG_A,
        omrade: "kliniskt-stod",
        trosallDagar: 540,
        deadline: "2026-12-01",
        rutinIds: ["rutin1"],
        skapadAv: "volA",
        skapadAvNamn: "Vol A",
      })
    )
  );
  await test("superadminA kan INTE starta en runda med en tom rutinIds-lista", () =>
    assertFails(
      setDoc(doc(superA, "granskningsrundor", "rundaTom"), {
        organisationId: ORG_A,
        omrade: "kliniskt-stod",
        trosallDagar: 540,
        deadline: "2026-12-01",
        rutinIds: [],
        skapadAv: "superadminA",
        skapadAvNamn: "Super A",
      })
    )
  );
  await test("superadminA kan INTE starta en runda med ett ogiltigt område", () =>
    assertFails(
      setDoc(doc(superA, "granskningsrundor", "rundaOgiltig"), {
        organisationId: ORG_A,
        omrade: "pausrum",
        trosallDagar: 540,
        deadline: "2026-12-01",
        rutinIds: ["rutin1"],
        skapadAv: "superadminA",
        skapadAvNamn: "Super A",
      })
    )
  );
  await test("superadminA kan INTE starta en runda åt en annan organisation", () =>
    assertFails(
      setDoc(doc(superA, "granskningsrundor", "rundaFramand"), {
        organisationId: ORG_B,
        omrade: "kliniskt-stod",
        trosallDagar: 540,
        deadline: "2026-12-01",
        rutinIds: ["rutin1"],
        skapadAv: "superadminA",
        skapadAvNamn: "Super A",
      })
    )
  );

  console.log("\ngranskningsrundor/{rundaId} – ingen klient får uppdatera en runda");
  await test("superadminA kan INTE uppdatera sin egen organisations runda", () =>
    assertFails(updateDoc(doc(superA, "granskningsrundor", "rundaA1"), { deadline: "2027-01-01" }))
  );

  console.log("\ngranskningsrundor/{rundaId} – radering");
  await test("superadminA kan radera sin egen organisations runda", () =>
    assertSucceeds(deleteDoc(doc(superA, "granskningsrundor", "rundaA1")))
  );
  await test("superadminB kan INTE radera org A:s runda", () =>
    assertFails(deleteDoc(doc(superB, "granskningsrundor", "rundaA2")))
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
