// Etapp 66b (ETAPPLAN15.md): rutiner/{id}/versioner-mönstret återanvänt för
// introduktionstilldelningar/{uid}/signeringar/{postNyckel} – en handledares bekräftelse att
// en introduktionspunkt gåtts igenom, skild från personens egen lasteAv-kvittering.
// Genomgående krav 28: en signatur om en annan människa får ALDRIG kunna sättas av personen
// själv – bevisas nedan direkt mot reglerna, inte bara mot gränssnittet.
//
//   npx firebase-tools@13 emulators:exec --project demo-test \
//     --only firestore "node tests/rules/introduktionssigneringar.test.mjs"
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDoc, getDocs, collection, setDoc, deleteDoc } from "firebase/firestore";

const ORG_A = "orgSignA";
const ORG_B = "orgSignB";

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

const GILTIG_SIGNERING = {
  postTyp: "rutin",
  postId: "rutinX",
  etappNamn: "Dag 1",
  tidpunkt: new Date(),
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
    await setDoc(doc(db, "users", "nyanstalldA"), { role: "personal", organisationId: ORG_A });
    await setDoc(doc(db, "users", "handledareA"), { role: "sektionsledare", organisationId: ORG_A });
    await setDoc(doc(db, "users", "vecA"), { role: "vec", organisationId: ORG_A });
    await setDoc(doc(db, "users", "superadminB"), { role: "superadmin", organisationId: ORG_B });

    await setDoc(doc(db, "introduktionstilldelningar", "nyanstalldA"), {
      uid: "nyanstalldA",
      namn: "Ny Anställd",
      organisationId: ORG_A,
      sparId: "sparX",
      sparNamn: "Standardspår",
    });
  });

  const nyanstalld = testEnv.authenticatedContext("nyanstalldA").firestore();
  const handledare = testEnv.authenticatedContext("handledareA").firestore();
  const vec = testEnv.authenticatedContext("vecA").firestore();
  const superB = testEnv.authenticatedContext("superadminB").firestore();

  console.log("\nintroduktionstilldelningar/{uid}/signeringar – skapande");
  await test("en kollega (handledare) KAN signera NÅGON ANNANS introduktionspunkt", () =>
    assertSucceeds(
      setDoc(doc(handledare, "introduktionstilldelningar", "nyanstalldA", "signeringar", "rutin:rutinX"), {
        ...GILTIG_SIGNERING,
        signeradAv: "handledareA",
        signeradAvNamn: "Handledaren",
      })
    )
  );
  await test("den nyanställda kan INTE signera sin EGEN introduktionspunkt (krav 28)", () =>
    assertFails(
      setDoc(doc(nyanstalld, "introduktionstilldelningar", "nyanstalldA", "signeringar", "rutin:rutinY"), {
        postTyp: "rutin",
        postId: "rutinY",
        etappNamn: "Dag 1",
        tidpunkt: new Date(),
        signeradAv: "nyanstalldA",
        signeradAvNamn: "Ny Anställd",
      })
    )
  );
  await test("en person kan INTE utge sig för att vara en annan (signeradAv måste vara den egna uiden)", () =>
    assertFails(
      setDoc(doc(handledare, "introduktionstilldelningar", "nyanstalldA", "signeringar", "rutin:rutinZ"), {
        postTyp: "rutin",
        postId: "rutinZ",
        etappNamn: "Dag 1",
        tidpunkt: new Date(),
        signeradAv: "nagonAnnan",
        signeradAvNamn: "Förfalskad",
      })
    )
  );
  await test("en superadmin i en ANNAN organisation kan INTE signera (organisationsisolering)", () =>
    assertFails(
      setDoc(doc(superB, "introduktionstilldelningar", "nyanstalldA", "signeringar", "rutin:rutinW"), {
        postTyp: "rutin",
        postId: "rutinW",
        etappNamn: "Dag 1",
        tidpunkt: new Date(),
        signeradAv: "superadminB",
        signeradAvNamn: "Fel org",
      })
    )
  );
  await test("ett andra setDoc-försök mot en REDAN SIGNERAD punkt avvisas (update är stängd)", () =>
    assertFails(
      setDoc(doc(vec, "introduktionstilldelningar", "nyanstalldA", "signeringar", "rutin:rutinX"), {
        ...GILTIG_SIGNERING,
        signeradAv: "vecA",
        signeradAvNamn: "VEC (försöker skriva över)",
      })
    )
  );

  console.log("\nintroduktionstilldelningar/{uid}/signeringar – läsning");
  await test("den nyanställda KAN läsa sina egna signaturer", () =>
    assertSucceeds(getDoc(doc(nyanstalld, "introduktionstilldelningar", "nyanstalldA", "signeringar", "rutin:rutinX")))
  );
  await test("VEC (farHanteraAnslag) KAN läsa någon annans signaturer i egna orgen", () =>
    assertSucceeds(getDocs(collection(vec, "introduktionstilldelningar", "nyanstalldA", "signeringar")))
  );
  await test("en vanlig kollega utan hanteringsrätt kan INTE läsa någon ANNANS signaturer", () =>
    assertFails(getDocs(collection(handledare, "introduktionstilldelningar", "nyanstalldA", "signeringar")))
  );
  await test("en superadmin i en ANNAN organisation kan INTE läsa alls", () =>
    assertFails(getDocs(collection(superB, "introduktionstilldelningar", "nyanstalldA", "signeringar")))
  );

  console.log("\nintroduktionstilldelningar/{uid}/signeringar – radering (rätta ett misstag)");
  await test("en vanlig kollega kan INTE radera en signatur", () =>
    assertFails(deleteDoc(doc(handledare, "introduktionstilldelningar", "nyanstalldA", "signeringar", "rutin:rutinX")))
  );
  await test("VEC (farHanteraAnslag) KAN radera en felaktig signatur", () =>
    assertSucceeds(deleteDoc(doc(vec, "introduktionstilldelningar", "nyanstalldA", "signeringar", "rutin:rutinX")))
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
