// Etapp 64 (ETAPPLAN13.md), scaffolding-fasen: baspaketreferenser/{refId}. HÅRT begränsad
// till plattformsadmin – ingen kundorganisation (inte ens en egen superadmin) kan läsa eller
// skriva collectionen alls. Det här ÄR den "hårda spärren" tills en extern juridisk bedömning
// (MDR + upphovsrätt) finns, se ETAPPLAN13.md/OPPNA-PUNKTER.md.
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/baspaketreferenser.test.mjs"
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDocs, collection, addDoc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";

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

const GILTIG_REFERENS = {
  titel: "Exempeltitel (fiktiv testpost)",
  utgivare: "Exempelutgivare",
  kalldatum: "2026-01-01",
  url: "https://vardhandboken.se/exempel",
  kategori: "test",
};

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
    await setDoc(doc(db, "users", "superBasp"), { role: "superadmin", organisationId: "orgBasp" });
    await setDoc(doc(db, "plattformsadmin", "levBasp"), { blevPlattformsadmin: new Date() });
    await setDoc(doc(db, "organisationer", "orgBasp"), { namn: "Baspakettest AB", status: "aktiv" });
  });

  const lev = testEnv.authenticatedContext("levBasp").firestore();
  const super1 = testEnv.authenticatedContext("superBasp").firestore();

  console.log("\nbaspaketreferenser – läsning");
  await test("en plattformsadmin KAN läsa collectionen (tom lista är en giltig läsning)", () =>
    assertSucceeds(getDocs(collection(lev, "baspaketreferenser")))
  );
  await test("en kunds superadmin kan INTE läsa collectionen alls", () =>
    assertFails(getDocs(collection(super1, "baspaketreferenser")))
  );

  console.log("\nbaspaketreferenser – skapande");
  await test("en plattformsadmin KAN lägga till en giltig referenspost", () =>
    assertSucceeds(
      addDoc(collection(lev, "baspaketreferenser"), {
        ...GILTIG_REFERENS,
        tillagd: new Date(),
        tillagdAv: "levBasp",
      })
    )
  );
  await test("en kunds superadmin kan INTE skapa en referenspost", () =>
    assertFails(
      addDoc(collection(super1, "baspaketreferenser"), {
        ...GILTIG_REFERENS,
        tillagd: new Date(),
        tillagdAv: "superBasp",
      })
    )
  );
  await test("en plattformsadmin kan INTE utge sig för att vara en annan (tillagdAv måste vara den egna uiden)", () =>
    assertFails(
      addDoc(collection(lev, "baspaketreferenser"), {
        ...GILTIG_REFERENS,
        tillagd: new Date(),
        tillagdAv: "nagonAnnan",
      })
    )
  );
  await test("en plattformsadmin kan INTE lägga till en länk utanför de godkända källdomänerna", () =>
    assertFails(
      addDoc(collection(lev, "baspaketreferenser"), {
        ...GILTIG_REFERENS,
        url: "https://example.com/instrument",
        tillagd: new Date(),
        tillagdAv: "levBasp",
      })
    )
  );
  await test("en plattformsadmin kan INTE lägga till ett innehållsfält (schemat tillåter bara metadata)", () =>
    assertFails(
      addDoc(collection(lev, "baspaketreferenser"), {
        ...GILTIG_REFERENS,
        innehall: "Instrumentets fulla text skulle aldrig få lagras här",
        tillagd: new Date(),
        tillagdAv: "levBasp",
      })
    )
  );
  await test("en plattformsadmin kan INTE lägga till en titel med ett misstänkt personnummer", () =>
    assertFails(
      addDoc(collection(lev, "baspaketreferenser"), {
        ...GILTIG_REFERENS,
        titel: "Angående 19900101-1234",
        tillagd: new Date(),
        tillagdAv: "levBasp",
      })
    )
  );

  console.log("\nbaspaketreferenser – uppdatering och radering");
  let refId;
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const ref = await addDoc(collection(context.firestore(), "baspaketreferenser"), {
      ...GILTIG_REFERENS,
      tillagd: new Date(),
      tillagdAv: "levBasp",
    });
    refId = ref.id;
  });
  await test("en kunds superadmin kan INTE uppdatera en referenspost", () =>
    assertFails(updateDoc(doc(super1, "baspaketreferenser", refId), { titel: "Kapad titel" }))
  );
  await test("en plattformsadmin KAN uppdatera en referenspost", () =>
    assertSucceeds(updateDoc(doc(lev, "baspaketreferenser", refId), { titel: "Uppdaterad exempeltitel" }))
  );
  await test("en kunds superadmin kan INTE radera en referenspost", () =>
    assertFails(deleteDoc(doc(super1, "baspaketreferenser", refId)))
  );
  await test("en plattformsadmin KAN radera en referenspost", () =>
    assertSucceeds(deleteDoc(doc(lev, "baspaketreferenser", refId)))
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
