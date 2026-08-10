// Etapp 55: bevisar satKioskPin/verifieraKioskPin (hashad PIN, aldrig läsbar tillbaka av
// klienten) och att kiosk-rollen blockeras av skapaKommentar/skickaFeedback/svaraPersonalpuls
// (identitetsbundet innehåll ett delat enhetskonto aldrig ska kunna skapa).
//
// Körs mot emulatorerna:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage,auth \
//     "node tests/functions/kioskrestriktioner.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "demo-test";
process.env.GCP_PROJECT = "demo-test";

const path = require("node:path");
const admin = require(
  require.resolve("firebase-admin", { paths: [path.join(__dirname, "../../functions")] })
);
const funcs = require("../../functions/index.js");

const db = admin.firestore();

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
    console.error(`       ${fel.stack || fel.message}`);
  }
}

function vantaSig(villkor, meddelande) {
  if (!villkor) {
    throw new Error(meddelande);
  }
}

async function vantaSigKastar(lofte, meddelande) {
  try {
    await lofte;
    throw new Error(meddelande);
  } catch (fel) {
    if (fel.message === meddelande) throw fel;
  }
}

async function main() {
  const orgId = "orgKiosk55";
  // Etapp 59b (ETAPPLAN12.md, bugfynd): kioskläget hör till Operations – satKioskPin
  // (och en kiosk-inbjudan) kräver nu modulen aktiv, se moduler.operations nedan.
  await db.collection("organisationer").doc(orgId).set({ namn: "Kiosk-org", moduler: { operations: true } });
  await db.collection("users").doc("superadminKiosk").set({ organisationId: orgId, role: "superadmin" });
  await db.collection("users").doc("kioskEnhet").set({ organisationId: orgId, role: "kiosk" });

  console.log("\nsatKioskPin / verifieraKioskPin");
  await test("en icke-superadmin kan INTE sätta PIN-koden", () =>
    vantaSigKastar(
      funcs.satKioskPin.run({ data: { pin: "1234" }, auth: { uid: "kioskEnhet" } }),
      "borde ha kastat permission-denied"
    )
  );
  await test("en ogiltig PIN (bokstäver) avvisas", () =>
    vantaSigKastar(
      funcs.satKioskPin.run({ data: { pin: "abcd" }, auth: { uid: "superadminKiosk" } }),
      "borde ha kastat invalid-argument"
    )
  );
  await test("superadmin kan sätta en giltig PIN-kod", async () => {
    await funcs.satKioskPin.run({ data: { pin: "4711" }, auth: { uid: "superadminKiosk" } });
    const dok = await db
      .collection("organisationer")
      .doc(orgId)
      .collection("installningar")
      .doc("kioskPin")
      .get();
    vantaSig(dok.exists, "kioskPin-dokumentet skapades inte");
    vantaSig(typeof dok.data().hash === "string" && dok.data().hash !== "4711", "PIN-koden lagrades i klartext");
  });
  await test("verifieraKioskPin returnerar giltig:true för rätt PIN", async () => {
    const resultat = await funcs.verifieraKioskPin.run({ data: { pin: "4711" }, auth: { uid: "kioskEnhet" } });
    vantaSig(resultat.giltig === true, "rätt PIN gav inte giltig:true");
    vantaSig(!("hash" in resultat) && !("pin" in resultat), "svaret läckte hashen/PIN-koden till klienten");
  });
  await test("verifieraKioskPin returnerar giltig:false för fel PIN", async () => {
    const resultat = await funcs.verifieraKioskPin.run({ data: { pin: "0000" }, auth: { uid: "kioskEnhet" } });
    vantaSig(resultat.giltig === false, "fel PIN gav inte giltig:false");
  });

  console.log("\nkiosk blockeras från identitetsbundna Cloud Functions");
  await test("kiosk kan INTE skapa en kommentar", () =>
    vantaSigKastar(
      funcs.skapaKommentar.run({
        data: { rutinId: "rutinX", text: "En kommentar" },
        auth: { uid: "kioskEnhet" },
      }),
      "borde ha kastat permission-denied"
    )
  );
  await test("kiosk kan INTE skicka feedback", () =>
    vantaSigKastar(
      funcs.skickaFeedback.run({
        data: { typ: "ide", text: "En idé" },
        auth: { uid: "kioskEnhet" },
      }),
      "borde ha kastat permission-denied"
    )
  );
  await test("kiosk kan INTE svara på personalpulsen", () =>
    vantaSigKastar(
      funcs.svaraPersonalpuls.run({
        data: { omrade: "kliniskt-stod", svar1: 3, svar2: 3, svar3: 3 },
        auth: { uid: "kioskEnhet" },
      }),
      "borde ha kastat permission-denied"
    )
  );

  console.log("\nEtapp 59b (ETAPPLAN12.md, bugfynd): kioskläget kräver Operations-modulen");
  const orgUtanOperations = "orgKioskUtanOperations";
  await db.collection("organisationer").doc(orgUtanOperations).set({ namn: "Ingen Operations-org" });
  await db.collection("users").doc("superadminUtanOps").set({ organisationId: orgUtanOperations, role: "superadmin" });
  await db.collection("users").doc("kioskUtanOps").set({ organisationId: orgUtanOperations, role: "kiosk" });

  await test("satKioskPin nekas utan Operations-modulen (kan inte KONFIGURERA en ny PIN)", () =>
    vantaSigKastar(
      funcs.satKioskPin.run({ data: { pin: "9999" }, auth: { uid: "superadminUtanOps" } }),
      "borde ha kastat failed-precondition"
    )
  );
  await test("skapaInbjudan med roll=kiosk nekas utan Operations-modulen", () =>
    vantaSigKastar(
      funcs.skapaInbjudan.run({
        data: { epost: "ny-kiosk@exempel.se", roll: "kiosk" },
        auth: { uid: "superadminUtanOps" },
      }),
      "borde ha kastat failed-precondition"
    )
  );
  await test("skapaInbjudan med en ANNAN roll fungerar ändå utan Operations (bara kiosk är gated)", async () => {
    const { token } = await funcs.skapaInbjudan.run({
      data: { epost: "vanlig-personal@exempel.se", roll: "personal" },
      auth: { uid: "superadminUtanOps" },
    });
    vantaSig(!!token, "en vanlig inbjudan ska fungera oavsett moduler");
  });
  await test("verifieraKioskPin fungerar ÄNDÅ utan Operations-modulen (kan alltid LÄMNA kioskläget – ingen inlåsning)", async () => {
    // Ingen PIN är satt i den här organisationen ännu (satKioskPin ovan nekades), så en
    // godtycklig PIN ska ge giltig:false – men anropet i sig får INTE kastas som
    // failed-precondition, det vore en inlåsningsrisk om en organisation stänger av
    // Operations EFTER att en kiosk-enhet redan är konfigurerad.
    const resultat = await funcs.verifieraKioskPin.run({ data: { pin: "0000" }, auth: { uid: "kioskUtanOps" } });
    vantaSig(resultat.giltig === false, "förväntade giltig:false (ingen PIN satt än)");
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  if (antalMisslyckade > 0) {
    process.exit(1);
  }
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
