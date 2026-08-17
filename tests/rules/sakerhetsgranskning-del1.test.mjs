// Säkerhetsgranskning 2026-08-17, Del 1 (regel- och behörighetslagret).
// Låser fast de tre fynd som patchades i firestore.rules. Varje test är skrivet så att det
// FAILAR mot regelfilen som den såg ut före granskningen – annars bevisar det ingenting.
//
//   1.1  harTroligtPersonnummer() missade samordningsnummer med dagfält 82–91
//   1.2  revisionslogg var läsbar av varje plattformsadmin utan kundbeviljat supportfönster
//   1.3  visningar/checklistkorningar saknade fältbegränsning på create/update
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

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
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "organisationer", "orgA"), { namn: "Org A", status: "aktiv" });
    await setDoc(doc(db, "organisationer", "orgB"), { namn: "Org B", status: "aktiv" });
    await setDoc(doc(db, "users", "volA"), { role: "vol", organisationId: "orgA" });
    await setDoc(doc(db, "users", "superA"), { role: "superadmin", organisationId: "orgA" });
    await setDoc(doc(db, "users", "leverantor"), { role: "personal", organisationId: "orgB" });
    await setDoc(doc(db, "plattformsadmin", "leverantor"), { blevPlattformsadmin: new Date() });
    await setDoc(doc(db, "revisionslogg", "post1"), {
      organisationId: "orgA",
      aktorUid: "volA",
      handelsetyp: "rutin_andrad",
      sammanfattning: "Rutin ändrad av volA",
    });
    await setDoc(doc(db, "visningar", "orgA::_kliniskt-stod::Rutin"), {
      titel: "Rutin",
      sokvag: "/kliniskt-stod",
      organisationId: "orgA",
      antal: 1,
    });
    await setDoc(doc(db, "checklistkorningar", "rutinA"), {
      organisationId: "orgA",
      antalPaborjade: 1,
    });
  });

  const volA = testEnv.authenticatedContext("volA").firestore();
  const superA = testEnv.authenticatedContext("superA").firestore();
  const leverantor = testEnv.authenticatedContext("leverantor").firestore();

  console.log("\nFynd 1.1 – samordningsnummer med dagfält 82–91 (födda den 22:a–31:a)");
  // Dagfältet är födelsedagen + 60. Dag 25 => 85, dag 31 => 91. Före fixen täckte regeln
  // bara 61–81, dvs. bara personer födda den 1:a–21:a.
  for (const [dagfalt, beskrivning] of [
    ["85", "dag 25"],
    ["88", "dag 28"],
    ["91", "dag 31"],
  ]) {
    await test(`samordningsnummer 9001${dagfalt}-0017 (${beskrivning}) BLOCKERAS i skiftrapport`, () =>
      assertFails(
        setDoc(doc(volA, "skiftrapporter", `sam${dagfalt}`), {
          organisationId: "orgA",
          skapadAv: "volA",
          text: `Patient 9001${dagfalt}-0017 inskriven`,
        })
      )
    );
  }
  await test("samordningsnummer med dagfält 61 (dag 1) blockeras fortfarande", () =>
    assertFails(
      setDoc(doc(volA, "skiftrapporter", "sam61"), {
        organisationId: "orgA",
        skapadAv: "volA",
        text: "Patient 900161-0017 inskriven",
      })
    )
  );
  await test("vanligt personnummer blockeras fortfarande", () =>
    assertFails(
      setDoc(doc(volA, "skiftrapporter", "pnr"), {
        organisationId: "orgA",
        skapadAv: "volA",
        text: "Patient 900101-0017 inskriven",
      })
    )
  );
  await test("ogiltigt dagfält 92 är INTE ett personnummer och släpps igenom", () =>
    assertSucceeds(
      setDoc(doc(volA, "skiftrapporter", "dag92"), {
        organisationId: "orgA",
        skapadAv: "volA",
        text: "Serienummer 900192-0017 på pumpen",
      })
    )
  );
  await test("ofarlig drifttext släpps fortfarande igenom", () =>
    assertSucceeds(
      setDoc(doc(volA, "skiftrapporter", "ofarlig"), {
        organisationId: "orgA",
        skapadAv: "volA",
        text: "Rum 12, hylla 4 behöver fyllas på",
      })
    )
  );

  console.log("\nFynd 1.2 – revisionslogg kräver nu kundbeviljat supportfönster");
  await test("plattformsadmin UTAN supportfönster kan INTE läsa kundens revisionslogg", () =>
    assertFails(getDoc(doc(leverantor, "revisionslogg", "post1")))
  );
  await test("kundens egen superadmin kan fortfarande läsa sin revisionslogg", () =>
    assertSucceeds(getDoc(doc(superA, "revisionslogg", "post1")))
  );

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), "organisationer", "orgA"),
      { supportAtkomstTill: new Date(Date.now() + 3600_000) },
      { merge: true }
    );
  });
  await test("plattformsadmin MED aktivt supportfönster KAN läsa revisionsloggen", () =>
    assertSucceeds(getDoc(doc(leverantor, "revisionslogg", "post1")))
  );

  console.log("\nFynd 1.3 – fältbegränsning på visningar/checklistkorningar");
  await test("godtyckligt extrafält i visningar nekas", () =>
    assertFails(
      setDoc(doc(volA, "visningar", "orgA::_x::Ny"), {
        titel: "Ny",
        sokvag: "/x",
        organisationId: "orgA",
        antal: 1,
        smygfalt: "godtycklig text som visas för hela organisationen",
      })
    )
  );
  await test("personnummer i visningar.titel nekas", () =>
    assertFails(
      setDoc(doc(volA, "visningar", "orgA::_x::Pnr"), {
        titel: "Patient 900101-0017",
        sokvag: "/x",
        organisationId: "orgA",
        antal: 1,
      })
    )
  );
  await test("legitim visningsregistrering fungerar oförändrat", () =>
    assertSucceeds(
      setDoc(doc(volA, "visningar", "orgA::_kliniskt-stod::Hjartstopp"), {
        titel: "Hjärtstopp",
        sokvag: "/kliniskt-stod",
        organisationId: "orgA",
        antal: 1,
      })
    )
  );
  await test("godtyckligt extrafält i checklistkorningar nekas", () =>
    assertFails(
      updateDoc(doc(volA, "checklistkorningar", "rutinA"), { fritext: "godtycklig text" })
    )
  );
  await test("legitim räknaruppdatering i checklistkorningar fungerar oförändrat", () =>
    assertSucceeds(updateDoc(doc(volA, "checklistkorningar", "rutinA"), { antalSlutforda: 1 }))
  );

  await testEnv.cleanup();
  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  if (antalMisslyckade > 0) process.exit(1);
}

main();
