// Etapp 3d: bevisar att 2FA-policyn (organisationer/{orgId}.sakerhet.kravMfaForRoller)
// faktiskt nekar superadmin-skrivningar (rolländring, organisationsinställningar) när
// policyn kräver 2FA för rollen och sessionen inte använde en andra faktor, och tillåter
// när den gjorde det (simulerat via authenticatedContext's tokenOptions, samma fält
// firebase.sign_in_second_factor som Firebase Auth själv sätter i en riktig TOTP-inloggning).
// Körs mot Firestore-emulatorn:
//
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore \
//     "node tests/rules/mfapolicy.test.mjs"
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, setDoc, updateDoc } from "firebase/firestore";

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
    await setDoc(doc(db, "organisationer", "orgKravMfa"), {
      namn: "Kräver 2FA för superadmin",
      sakerhet: { kravMfaForRoller: ["superadmin"] },
    });
    await setDoc(doc(db, "users", "superUtanMfa"), { role: "superadmin", organisationId: "orgKravMfa" });
    await setDoc(doc(db, "users", "volUtanMfa"), { role: "vol", organisationId: "orgKravMfa" });
  });

  const superUtanAndrafaktor = testEnv.authenticatedContext("superUtanMfa").firestore();
  const superMedAndrafaktor = testEnv
    .authenticatedContext("superUtanMfa", { firebase: { sign_in_second_factor: "totp" } })
    .firestore();

  console.log("\norganisationer/{orgId} – 2FA-policy på superadmin-skrivningar");
  await test("superadmin UTAN andra faktor kan INTE ändra organisationsinställningar när policyn kräver det för rollen", () =>
    assertFails(
      updateDoc(doc(superUtanAndrafaktor, "organisationer", "orgKravMfa"), {
        "moduler.intelligence": false,
      })
    )
  );
  await test("superadmin MED andra faktor (simulerad) KAN ändra organisationsinställningar", () =>
    assertSucceeds(
      updateDoc(doc(superMedAndrafaktor, "organisationer", "orgKravMfa"), {
        "moduler.intelligence": false,
      })
    )
  );

  console.log("\nusers/{userId} – 2FA-policy på rolländringar");
  await test("superadmin UTAN andra faktor kan INTE ändra en annan användares roll", () =>
    assertFails(updateDoc(doc(superUtanAndrafaktor, "users", "volUtanMfa"), { role: "sektionsledare" }))
  );
  await test("superadmin MED andra faktor (simulerad) KAN ändra en annan användares roll", () =>
    assertSucceeds(updateDoc(doc(superMedAndrafaktor, "users", "volUtanMfa"), { role: "sektionsledare" }))
  );

  console.log("\nOrganisationer UTAN policyn är opåverkade (bakåtkompatibilitet)");
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "organisationer", "orgUtanKrav"), { namn: "Ingen 2FA-policy" });
    await setDoc(doc(db, "users", "superUtanKrav"), { role: "superadmin", organisationId: "orgUtanKrav" });
  });
  const superUtanKrav = testEnv.authenticatedContext("superUtanKrav").firestore();
  await test("superadmin utan någon 2FA-policy alls kan skriva som vanligt", () =>
    assertSucceeds(
      updateDoc(doc(superUtanKrav, "organisationer", "orgUtanKrav"), { "moduler.operations": true })
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
