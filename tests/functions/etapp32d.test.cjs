// Etapp 32d: hashkedjans integritetskontroll (Etapp 14) kördes tidigare bara på begäran.
// Bevisar att den schemalagda varianten faktiskt går igenom ALLA organisationer och skriver
// en systemvarning bara när något faktiskt är brutet – inte vid ett normalt resultat.
//
// Körs mot emulatorerna:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage \
//     "node tests/functions/etapp32d.test.cjs"
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

async function main() {
  await db.collection("organisationer").doc("org32dHel").set({ namn: "32d Hel kedja" });
  await db.collection("organisationer").doc("org32dTrasig").set({ namn: "32d Trasig kedja" });

  await funcs.loggaRevision({
    organisationId: "org32dHel",
    aktorUid: "volX",
    aktorRoll: "vol",
    handelsetyp: "inloggning_lyckad",
    sammanfattning: "En helt normal post",
  });

  await funcs.loggaRevision({
    organisationId: "org32dTrasig",
    aktorUid: "volY",
    aktorRoll: "vol",
    handelsetyp: "inloggning_lyckad",
    sammanfattning: "En post som senare manipuleras",
  });
  const snap = await db
    .collection("revisionslogg")
    .where("organisationId", "==", "org32dTrasig")
    .get();
  await db.collection("revisionslogg").doc(snap.docs[0].id).update({ sammanfattning: "Manipulerad i efterhand" });

  // OBS: test:functions kör flera testfiler i sekvens mot SAMMA emulator (t.ex.
  // revisionslogg-hash.test.cjs, som medvetet lämnar kvar trasiga kedjor i andra
  // organisationer permanent) – funktionen skannar ALLA organisationer, så påståendena
  // nedan kollar specifikt efter VÅRA två testorganisationer i resultatlistan, inte det
  // globala antalet avvikelser.
  console.log("\nverifieraRevisionskedjor – kör igenom ALLA organisationer och larmar bara vid avvikelse");
  let avvikelser;
  await test("flaggar den trasiga organisationen, inte den hela", async () => {
    avvikelser = await funcs.verifieraRevisionskedjor();
    vantaSig(avvikelser.some((a) => a.orgId === "org32dTrasig"), "org32dTrasig flaggades inte");
    vantaSig(!avvikelser.some((a) => a.orgId === "org32dHel"), "org32dHel flaggades felaktigt");
  });
  // ÄNDRAD FÖRVÄNTAN (säkerhetsgranskning 2026-08-17, Del 2 – fynd 2.1). Testet krävde
  // tidigare att systemvarningen NÄMNDE den trasiga organisationen vid namn. Men
  // systemvarningar/{id} är läsbar av en superadmin i VILKEN organisation som helst (se
  // firestore.rules), så det innebar att varje kund kunde läsa ut vilka ANDRA kunder som hade
  // en bruten revisionskedja – inklusive leverantörens kundlista. Larmet ska finnas kvar, men
  // utan kundidentiteter; detaljerna går till Sentry, som bara når leverantören.
  await test("systemvarningen finns kvar men läcker INTE någon organisations identitet", async () => {
    const varningSnap = await db
      .collection("systemvarningar")
      .where("typ", "==", "revisionslogg_integritet")
      .get();
    vantaSig(varningSnap.size > 0, "ingen systemvarning skrevs alls");
    const lackande = varningSnap.docs.find((d) => d.data().meddelande.includes("org32dTrasig"));
    vantaSig(!lackande, "systemvarningen innehöll ett organisations-ID (cross-tenant-läckage)");
    const nagonNamnerAntal = varningSnap.docs.some((d) => /\d+ organisation/.test(d.data().meddelande));
    vantaSig(nagonNamnerAntal, "systemvarningen bör ange ANTALET drabbade organisationer");
  });

  await test("varje organisation får sin EGNA kedjestatus på organisationer/{orgId}", async () => {
    const trasig = await db.collection("organisationer").doc("org32dTrasig").get();
    const hel = await db.collection("organisationer").doc("org32dHel").get();
    vantaSig(trasig.data()?.revisionskedja?.giltig === false, "org32dTrasig fick inte giltig:false");
    vantaSig(hel.data()?.revisionskedja?.giltig === true, "org32dHel fick inte giltig:true");
    vantaSig(trasig.data()?.revisionskedja?.senastKord != null, "senastKord saknas per organisation");
  });

  console.log("\nverifieraRevisionskedjor – en borttagen organisation slutar flaggas");
  await db.collection("organisationer").doc("org32dTrasig").delete();
  await test("org32dTrasig försvinner ur resultatet när organisationen tas bort", async () => {
    const nyaAvvikelser = await funcs.verifieraRevisionskedjor();
    vantaSig(!nyaAvvikelser.some((a) => a.orgId === "org32dTrasig"), "org32dTrasig flaggades trots att organisationen togs bort");
  });

  console.log("\nverifieraRevisionskedjor – Etapp 46: skriver systemstatus/revisionskedja VARJE körning");
  await test("summeringsdokumentet uppdateras även när allt är i sin ordning (inte bara vid en avvikelse)", async () => {
    await funcs.verifieraRevisionskedjor();
    const statusDoc = await db.collection("systemstatus").doc("revisionskedja").get();
    vantaSig(statusDoc.exists, "systemstatus/revisionskedja skrevs inte");
    const data = statusDoc.data();
    vantaSig(data.senastKord != null, "senastKord saknas");
    vantaSig(typeof data.alletGiltigt === "boolean", "alletGiltigt saknas eller har fel typ");
    vantaSig(typeof data.antalOrganisationerKontrollerade === "number", "antalOrganisationerKontrollerade saknas");
    // ÄNDRAD FÖRVÄNTAN (fynd 2.1): fältet `avvikelser` innehöll en lista med varje avvikande
    // organisations ID, i ett dokument som varje kunds superadmin kunde läsa. Det ska nu vara
    // borta helt – bara ett antal återstår, och läsrätten är begränsad till plattformsadmin.
    vantaSig(data.avvikelser === undefined, "avvikelser-listan med organisations-ID ska vara borttagen");
    vantaSig(typeof data.antalAvvikelser === "number", "antalAvvikelser saknas");
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  process.exit(antalMisslyckade > 0 ? 1 : 0);
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
