// Etapp L1c + L1j (intern/ETAPPLAN-INTERN-1.md), beslutspunkt 1 respektive 2, båda avgjorda
// 2026-08-30 (se BESLUTSLOGG.md samma datum).
//
// L1c: hamtaKundmatvarden(orgId) – väg B ur planens beslutspunkt 1. Läser BARA de redan
// aggregerade fälten i matvardenSnapshots, aldrig en enskild rutin/sökfråga/användarnamn, och
// loggas mot KUNDENS egen revisionskedja (inte "_plattform") så kunden ser i sin egen historik
// att aggregaten lästs.
//
// L1j: rapporteraAppVersion(version) – bara appversion (beslutspunkt 2: INTE "senast aktiv"
// per användare). Skriver på organisationsdokumentet, inte per användare.
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore \
//     "node tests/functions/kundmatvarden-och-appversion.test.cjs"
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
  if (!villkor) throw new Error(meddelande);
}

async function forvantaFel(kod, lofte) {
  try {
    await lofte();
    throw new Error(`Förväntade felkod "${kod}" men anropet lyckades`);
  } catch (fel) {
    vantaSig(fel.code === kod, `Förväntade felkod "${kod}", fick "${fel.code}": ${fel.message}`);
  }
}

async function main() {
  await db.collection("plattformsadmin").doc("levL1c").set({ blevPlattformsadmin: Date.now() });
  await db.collection("users").doc("superL1c").set({ role: "superadmin", organisationId: "orgL1c" });
  await db.collection("organisationer").doc("orgL1c").set({ namn: "L1c-testkund" });

  const veckor = ["2026-08-03", "2026-08-10", "2026-08-17"];
  for (const [i, datum] of veckor.entries()) {
    await db
      .collection("organisationer")
      .doc("orgL1c")
      .collection("matvardenSnapshots")
      .doc(datum)
      .set({
        datum,
        kvitteringsgradKlinisktStod: 50 + i * 10,
        kvitteringsgradAdministration: 60 + i * 5,
        andelNollTraffar: 10 - i,
        tidAttHittaSekunder: 20,
        antalChecklistkorningar: 3,
        innehallshalsaKlinisktStod: 80,
        innehallshalsaAdministration: 75,
      });
  }

  console.log("\nhamtaKundmatvarden (L1c)");
  await test("en icke-plattformsadmin kan INTE läsa", () =>
    forvantaFel("permission-denied", () =>
      funcs.hamtaKundmatvarden.run({ data: { orgId: "orgL1c" }, auth: { uid: "superL1c" } })
    )
  );

  await test("returnerar bara de aggregerade fälten, äldst först", async () => {
    const resultat = await funcs.hamtaKundmatvarden.run({
      data: { orgId: "orgL1c" },
      auth: { uid: "levL1c" },
    });
    vantaSig(resultat.snapshots.length === 3, `förväntade 3 snapshots, fick ${resultat.snapshots.length}`);
    vantaSig(resultat.snapshots[0].datum === "2026-08-03", "fel ordning, ska vara äldst först");
    vantaSig(resultat.snapshots[2].kvitteringsgradKlinisktStod === 70, "fel aggregatvärde");
    vantaSig(
      Object.keys(resultat.snapshots[0]).every((k) =>
        [
          "datum",
          "kvitteringsgradKlinisktStod",
          "kvitteringsgradAdministration",
          "andelNollTraffar",
          "tidAttHittaSekunder",
          "antalChecklistkorningar",
          "innehallshalsaKlinisktStod",
          "innehallshalsaAdministration",
        ].includes(k)
      ),
      "svaret innehöll ett oväntat fält (t.ex. rutininnehåll eller ett användarnamn)"
    );
  });

  await test("loggas mot KUNDENS egen kedja, inte _plattform", async () => {
    await funcs.hamtaKundmatvarden.run({ data: { orgId: "orgL1c" }, auth: { uid: "levL1c" } });
    const loggSnap = await db
      .collection("revisionslogg")
      .where("organisationId", "==", "orgL1c")
      .where("handelsetyp", "==", "plattform_matvarden_lasta")
      .get();
    vantaSig(loggSnap.size >= 1, "ingen revisionspost skrevs mot kundens kedja");
  });

  console.log("\nrapporteraAppVersion (L1j)");
  await db.collection("users").doc("anvL1j").set({ role: "personal", organisationId: "orgL1j" });
  await db.collection("organisationer").doc("orgL1j").set({ namn: "L1j-testkund" });

  await test("kräver inloggning", () =>
    forvantaFel("unauthenticated", () =>
      funcs.rapporteraAppVersion.run({ data: { version: "5.135.0" }, auth: null })
    )
  );

  await test("skriver versionen på ORGANISATIONENS dokument, inte per användare", async () => {
    await funcs.rapporteraAppVersion.run({ data: { version: "5.135.0" }, auth: { uid: "anvL1j" } });
    const orgSnap = await db.collection("organisationer").doc("orgL1j").get();
    vantaSig(orgSnap.data().senasteAppVersion === "5.135.0", "fel version skriven");
    vantaSig(Boolean(orgSnap.data().senasteAppVersionTid), "senasteAppVersionTid saknas");
  });

  await test("avvisar en ogiltig version", () =>
    forvantaFel("invalid-argument", () =>
      funcs.rapporteraAppVersion.run({ data: { version: 12345 }, auth: { uid: "anvL1j" } })
    )
  );

  console.log("\nbegarSupportAtkomst / svaraSupportbegaran (L1f)");
  await db.collection("users").doc("superL1f").set({ role: "superadmin", organisationId: "orgL1f" });
  await db.collection("organisationer").doc("orgL1f").set({ namn: "L1f-testkund" });

  await test("en icke-plattformsadmin kan INTE begära åtkomst", () =>
    forvantaFel("permission-denied", () =>
      funcs.begarSupportAtkomst.run({
        data: { orgId: "orgL1f", anledning: "Test" },
        auth: { uid: "superL1f" },
      })
    )
  );

  await test("kräver en anledning", () =>
    forvantaFel("invalid-argument", () =>
      funcs.begarSupportAtkomst.run({ data: { orgId: "orgL1f", anledning: "" }, auth: { uid: "levL1c" } })
    )
  );

  let begaranId;
  await test("leverantören kan skapa en begäran", async () => {
    const resultat = await funcs.begarSupportAtkomst.run({
      data: { orgId: "orgL1f", anledning: "Kunden rapporterade ett fel" },
      auth: { uid: "levL1c" },
    });
    vantaSig(Boolean(resultat.id), "inget id returnerades");
    begaranId = resultat.id;
    const snap = await db.collection("organisationer").doc("orgL1f").collection("supportbegaran").doc(begaranId).get();
    vantaSig(snap.data().status === "vantar", "fel status på nyskapad begäran");
  });

  await test("en annan organisations superadmin kan INTE godkänna denna begäran (fel kund, inget läckt id)", async () => {
    await db.collection("users").doc("enAnnanSuperL1f").set({ role: "superadmin", organisationId: "enAnnanOrgL1f" });
    // svaraSupportbegaran läser uppringarens EGEN organisation (uppringare.organisationId),
    // aldrig ett orgId skickat från klienten – en annan kunds superadmin hittar därför ingen
    // begäran med det id:t i SIN organisations subcollection, oavsett vad de skickar in.
    await forvantaFel("not-found", () =>
      funcs.svaraSupportbegaran.run({
        data: { begaranId, godkann: true },
        auth: { uid: "enAnnanSuperL1f" },
      })
    );
  });

  await test("kundens superadmin godkänner – öppnar samma fönster som beviljaSupportAtkomst", async () => {
    await funcs.svaraSupportbegaran.run({ data: { begaranId, godkann: true }, auth: { uid: "superL1f" } });
    const orgSnap = await db.collection("organisationer").doc("orgL1f").get();
    vantaSig(Boolean(orgSnap.data().supportAtkomstTill), "supportAtkomstTill sattes inte");
    const begaranSnap = await db
      .collection("organisationer")
      .doc("orgL1f")
      .collection("supportbegaran")
      .doc(begaranId)
      .get();
    vantaSig(begaranSnap.data().status === "godkand", "begärans status uppdaterades inte");
  });

  await test("en redan besvarad begäran kan inte besvaras igen", () =>
    forvantaFel("failed-precondition", () =>
      funcs.svaraSupportbegaran.run({ data: { begaranId, godkann: true }, auth: { uid: "superL1f" } })
    )
  );

  await test("kundens superadmin kan avslå en begäran", async () => {
    const { id: annanBegaranId } = await funcs.begarSupportAtkomst.run({
      data: { orgId: "orgL1f", anledning: "En andra fråga" },
      auth: { uid: "levL1c" },
    });
    await funcs.svaraSupportbegaran.run({ data: { begaranId: annanBegaranId, godkann: false }, auth: { uid: "superL1f" } });
    const snap = await db
      .collection("organisationer")
      .doc("orgL1f")
      .collection("supportbegaran")
      .doc(annanBegaranId)
      .get();
    vantaSig(snap.data().status === "avslagen", "status uppdaterades inte till avslagen");
  });

  console.log(`\n${antalKlarade} klarade, ${antalMisslyckade} misslyckade`);
  if (antalMisslyckade > 0) {
    process.exit(1);
  }
}

main().catch((fel) => {
  console.error(fel);
  process.exit(1);
});
