// Etapp 49a: bevisar hela livscykeln för en schemalagd, avbrytbar radering –
// begarRaderingAvOrganisation (bara superadmin, kräver anledning, pausar + schemalägger),
// avbrytRaderingAvOrganisation (superadmin ELLER plattformsadmin, tar bort schemaläggningen
// utan att återaktivera), och den faktiska raderingen (raderaOrganisationensData): Firestore-
// dokument, uppladdade filer och Auth-konton försvinner, MEN revisionslogg/revisionsloggHuvud
// och backupfiler överlever, och en minimal "gravsten" blir kvar i organisationer/{orgId}.
//
// Körs mot Firestore-, Storage- OCH Auth-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage,auth \
//     "node tests/functions/radering.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.STORAGE_EMULATOR_HOST = "http://127.0.0.1:9199";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.GCLOUD_PROJECT = "demo-test";
process.env.GCP_PROJECT = "demo-test";

const path = require("node:path");
const admin = require(
  require.resolve("firebase-admin", { paths: [path.join(__dirname, "../../functions")] })
);
const funcs = require("../../functions/index.js");

const db = admin.firestore();
const bucket = admin.storage().bucket("synappsen-final-build.firebasestorage.app");

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

async function forvantaFel(kod, promiseFn) {
  try {
    await promiseFn();
    throw new Error(`förväntade fel ${kod}, fick inget`);
  } catch (fel) {
    vantaSig(fel.code === kod, `fel kod: ${fel.code} (${fel.message})`);
  }
}

async function main() {
  const ORG = "orgRadering49a";
  await db.collection("organisationer").doc(ORG).set({ namn: "Raderingstest AB", status: "aktiv" });
  await db.collection("users").doc("superRadering").set({ role: "superadmin", organisationId: ORG });
  await db.collection("users").doc("personalRadering").set({ role: "personal", organisationId: ORG });
  await db.collection("users").doc("annanOrgSuper").set({ role: "superadmin", organisationId: "annanOrgRadering" });

  console.log("\nbegarRaderingAvOrganisation – behörighet och effekt");
  await test("en icke-superadmin kan INTE begära radering", () =>
    forvantaFel("permission-denied", () =>
      funcs.begarRaderingAvOrganisation.run({ data: { anledning: "Test" }, auth: { uid: "personalRadering" } })
    )
  );
  await test("en tom anledning avvisas med invalid-argument", () =>
    forvantaFel("invalid-argument", () =>
      funcs.begarRaderingAvOrganisation.run({ data: { anledning: "  " }, auth: { uid: "superRadering" } })
    )
  );
  await test("superadmin KAN begära radering av sin egen organisation – pausar och schemalägger", async () => {
    const resultat = await funcs.begarRaderingAvOrganisation.run({
      data: { anledning: "Avslutar avtalet" },
      auth: { uid: "superRadering" },
    });
    vantaSig(!!resultat.schemalagdTill, "schemalagdTill saknas i svaret");
    const orgSnap = await db.collection("organisationer").doc(ORG).get();
    const data = orgSnap.data();
    vantaSig(data.status === "pausad", `status: ${data.status}`);
    vantaSig(data.raderingBegardAv === "superRadering", "raderingBegardAv fel");
    vantaSig(data.raderingAnledning === "Avslutar avtalet", "raderingAnledning fel");
    vantaSig(!!data.raderingSchemalagdTill, "raderingSchemalagdTill saknas");
  });

  console.log("\navbrytRaderingAvOrganisation – behörighet och effekt");
  await test("en superadmin i en ANNAN organisation kan INTE avbryta (ingen orgId att falla tillbaka på, och fel org ändå)", () =>
    forvantaFel("failed-precondition", () =>
      funcs.avbrytRaderingAvOrganisation.run({ data: {}, auth: { uid: "annanOrgSuper" } })
    )
  );
  await test("superadmin i RÄTT organisation KAN avbryta – tar bort schemaläggningen, rör INTE status", async () => {
    await funcs.avbrytRaderingAvOrganisation.run({ data: {}, auth: { uid: "superRadering" } });
    const data = (await db.collection("organisationer").doc(ORG).get()).data();
    vantaSig(data.raderingSchemalagdTill === undefined, "raderingSchemalagdTill togs inte bort");
    vantaSig(data.status === "pausad", `status skulle förbli pausad: ${data.status}`);
  });
  await test("ett andra avbrytförsök (ingen schemalagd radering kvar) ger failed-precondition", () =>
    forvantaFel("failed-precondition", () =>
      funcs.avbrytRaderingAvOrganisation.run({ data: {}, auth: { uid: "superRadering" } })
    )
  );

  console.log("\nraderaOrganisationensData – den faktiska, irreversibla raderingen");
  // Seedar riklig data: Firestore-dokument (inkl. en underkollektion och revisionslogg),
  // ett Auth-konto, och Storage-filer på flera av de icke-org-prefixade sökvägarna.
  await db.collection("rutiner").doc("rutinRad").set({ titel: "Snart borta", organisationId: ORG, omrade: "kliniskt-stod" });
  await db.collection("forradsartiklar").doc("artikelRad").set({ namn: "Snart borta", organisationId: ORG });
  await db
    .collection("organisationer")
    .doc(ORG)
    .collection("matvardenSnapshots")
    .doc("2026-08")
    .set({ datum: "2026-08" });
  await funcs.loggaRevision({
    organisationId: ORG,
    aktorUid: "superRadering",
    aktorRoll: "superadmin",
    handelsetyp: "test_handelse",
    sammanfattning: "Ska överleva raderingen",
  });
  await admin.auth().createUser({ uid: "superRadering", email: "super@raderingstest.se" }).catch(() => {});
  await bucket.file("rutiner/kliniskt-stod/rutinRad/bild.jpg").save("x", { contentType: "image/jpeg" });
  await bucket.file("forradsartiklar/logistik/artikelRad/bild.jpg").save("x", { contentType: "image/jpeg" });
  await bucket.file(`organisationer/${ORG}/logotyp/logo.png`).save("x", { contentType: "image/png" });
  await bucket.file("avatarer/superRadering/bild.jpg").save("x", { contentType: "image/jpeg" });

  let resultat;
  await test("kör igenom hela raderingen utan att kasta", async () => {
    resultat = await funcs.raderaOrganisationensData(ORG);
    // ORG har två användare seedade högst upp i filen (superRadering + personalRadering).
    vantaSig(resultat.antalAnvandare === 2, `antalAnvandare: ${resultat.antalAnvandare}`);
  });
  await test("en säkerhetskopia togs innan raderingen (backups/{orgId}/...)", async () => {
    const [filer] = await bucket.getFiles({ prefix: `backups/${ORG}/` });
    vantaSig(filer.length >= 1, "ingen backupfil hittades innan radering");
  });
  await test("rutinen, förrådsartikeln och users-dokumentet är borta", async () => {
    vantaSig(!(await db.collection("rutiner").doc("rutinRad").get()).exists, "rutin fanns kvar");
    vantaSig(!(await db.collection("forradsartiklar").doc("artikelRad").get()).exists, "artikel fanns kvar");
    vantaSig(!(await db.collection("users").doc("superRadering").get()).exists, "users-dokumentet fanns kvar");
  });
  await test("underkollektionen matvardenSnapshots är borta", async () => {
    const undersnap = await db.collection("organisationer").doc(ORG).collection("matvardenSnapshots").doc("2026-08").get();
    vantaSig(!undersnap.exists, "matvardenSnapshots-posten fanns kvar");
  });
  await test("revisionslogg/revisionsloggHuvud överlevde MEDVETET (organisationens historik raderas aldrig)", async () => {
    const loggSnap = await db.collection("revisionslogg").where("organisationId", "==", ORG).get();
    vantaSig(loggSnap.size > 0, "revisionsloggen försvann – den ska överleva raderingen");
  });
  await test("Auth-kontot är borttaget", async () => {
    await forvantaFel("auth/user-not-found", () => admin.auth().getUser("superRadering"));
  });
  await test("uppladdade filer (rutin/artikel/logotyp/avatar) är borttagna", async () => {
    const [rutinFiler] = await bucket.getFiles({ prefix: "rutiner/kliniskt-stod/rutinRad/" });
    const [artikelFiler] = await bucket.getFiles({ prefix: "forradsartiklar/logistik/artikelRad/" });
    const [logoFiler] = await bucket.getFiles({ prefix: `organisationer/${ORG}/logotyp/` });
    const [avatarFiler] = await bucket.getFiles({ prefix: "avatarer/superRadering/" });
    vantaSig(rutinFiler.length === 0, "rutinbild fanns kvar");
    vantaSig(artikelFiler.length === 0, "artikelbild fanns kvar");
    vantaSig(logoFiler.length === 0, "logotyp fanns kvar");
    vantaSig(avatarFiler.length === 0, "avatar fanns kvar");
  });
  await test("organisationer/{orgId} blev en minimal 'gravsten', inte helt borttagen", async () => {
    const data = (await db.collection("organisationer").doc(ORG).get()).data();
    vantaSig(data.namn === "Raderingstest AB", "namnet försvann");
    vantaSig(data.status === "raderad", `status: ${data.status}`);
    vantaSig(data.avtalsstatus === "avslutad", `avtalsstatus: ${data.avtalsstatus}`);
    vantaSig(data.raderingSchemalagdTill === undefined, "raderingSchemalagdTill borde vara borttaget");
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  process.exit(antalMisslyckade > 0 ? 1 : 0);
}

main().catch((fel) => {
  console.error("Testkörningen kraschade:", fel);
  process.exit(1);
});
