// Etapp L1o (intern/ETAPPLAN-INTERN-1.md): seedaAtagandekalender och sattAtagandeUtfort.
//
// Två egenskaper är avgörande, utöver den vanliga plattformsadmin-spärren:
// 1. En omkörning av seedaAtagandekalender får ALDRIG nollställa ett redan kvitterat
//    senastUtfort – annars skulle nästa gång någon lägger till ett femte åtagande tysta
//    ned varenda tidigare kvittering.
// 2. sattAtagandeUtfort revisionsloggar varje kvittering – "att kvittera är att skriva
//    senastUtfort, inte att bocka en ruta" (planen, L1o).
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore \
//     "node tests/functions/atagandekalender.test.cjs"
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "demo-test";
process.env.GCP_PROJECT = "demo-test";

const path = require("node:path");
const admin = require(
  require.resolve("firebase-admin", { paths: [path.join(__dirname, "../../functions")] })
);
const funcs = require("../../functions/index.js");
const { _SEED } = require("../../functions/atagandekalender.js");

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

async function senastePostAvTyp(organisationId, handelsetyp) {
  const snap = await db
    .collection("revisionslogg")
    .where("organisationId", "==", organisationId)
    .orderBy("tidpunkt", "desc")
    .get();
  return snap.docs.map((d) => d.data()).find((p) => p.handelsetyp === handelsetyp);
}

async function main() {
  await db.collection("users").doc("superAtagande").set({ role: "superadmin", organisationId: "orgAtagandeFn" });
  // levAtagandeFn är BÅDE plattformsadmin OCH superadmin i sin egen organisation – precis
  // som verkligheten idag (blibForstaPlattformsadmin kräver role === "superadmin", se
  // gemensamt.js). Behövs här så att hamtaAnvandarInfo i sattAtagandeUtfort har ett
  // organisationId att revisionslogga mot, i stället för att falla tillbaka på "default".
  await db.collection("users").doc("levAtagandeFn").set({ role: "superadmin", organisationId: "orgLevAtagandeFn" });
  await db.collection("plattformsadmin").doc("levAtagandeFn").set({ blevPlattformsadmin: Date.now() });

  console.log("\nseedaAtagandekalender");
  await test("en icke-plattformsadmin kan INTE seeda", () =>
    forvantaFel("permission-denied", () =>
      funcs.seedaAtagandekalender.run({ data: {}, auth: { uid: "superAtagande" } })
    )
  );

  await test("en plattformsadmin KAN seeda – alla fyra åtaganden skapas", async () => {
    const resultat = await funcs.seedaAtagandekalender.run({ data: {}, auth: { uid: "levAtagandeFn" } });
    vantaSig(resultat.skapade === 4, `förväntade 4 skapade, fick ${resultat.skapade}`);
    vantaSig(resultat.uppdaterade === 0, `förväntade 0 uppdaterade, fick ${resultat.uppdaterade}`);

    for (const post of _SEED) {
      const snap = await db.collection("atagandekalender").doc(post.id).get();
      vantaSig(snap.exists, `${post.id} skapades inte`);
      vantaSig(snap.data().vad === post.vad, `${post.id}: fel "vad"`);
      vantaSig(snap.data().intervallManader === post.intervallManader, `${post.id}: fel intervall`);
      vantaSig(snap.data().senastUtfort === undefined, `${post.id}: senastUtfort skulle INTE skrivas av seeden`);
    }
  });

  await test("en omkörning nollställer ALDRIG ett redan satt senastUtfort", async () => {
    const KAND_DATUM = "2026-01-01T00:00:00.000Z";
    await db.collection("atagandekalender").doc("nyckelrotation").set({ senastUtfort: KAND_DATUM }, { merge: true });

    const resultat = await funcs.seedaAtagandekalender.run({ data: {}, auth: { uid: "levAtagandeFn" } });
    vantaSig(resultat.uppdaterade === 4, `förväntade 4 uppdaterade vid omkörning, fick ${resultat.uppdaterade}`);

    const snap = await db.collection("atagandekalender").doc("nyckelrotation").get();
    vantaSig(snap.data().senastUtfort === KAND_DATUM, "en omkörning skrev över senastUtfort – det får den ALDRIG göra");
  });

  console.log("\nsattAtagandeUtfort");
  await test("en icke-plattformsadmin kan INTE kvittera", () =>
    forvantaFel("permission-denied", () =>
      funcs.sattAtagandeUtfort.run({ data: { id: "nyckelrotation" }, auth: { uid: "superAtagande" } })
    )
  );

  await test("okänt id ger not-found", () =>
    forvantaFel("not-found", () =>
      funcs.sattAtagandeUtfort.run({ data: { id: "finns-inte" }, auth: { uid: "levAtagandeFn" } })
    )
  );

  await test("ogiltigt datumformat ger invalid-argument", () =>
    forvantaFel("invalid-argument", () =>
      funcs.sattAtagandeUtfort.run({
        data: { id: "nyckelrotation", senastUtfort: "igår" },
        auth: { uid: "levAtagandeFn" },
      })
    )
  );

  await test("en plattformsadmin KAN kvittera med dagens datum", async () => {
    const fore = Date.now();
    const resultat = await funcs.sattAtagandeUtfort.run({
      data: { id: "incidentresponsplan-oversyn" },
      auth: { uid: "levAtagandeFn" },
    });
    vantaSig(new Date(resultat.senastUtfort).getTime() >= fore, "senastUtfort borde vara nu eller senare");

    const snap = await db.collection("atagandekalender").doc("incidentresponsplan-oversyn").get();
    vantaSig(snap.data().senastUtfort === resultat.senastUtfort, "Firestore-dokumentet matchar inte svaret");
  });

  await test("en plattformsadmin KAN kvittera med ett eget datum", async () => {
    const resultat = await funcs.sattAtagandeUtfort.run({
      data: { id: "tillganglighetsredogorelse-oversyn", senastUtfort: "2026-03-15" },
      auth: { uid: "levAtagandeFn" },
    });
    vantaSig(resultat.senastUtfort.startsWith("2026-03-15"), `förväntade 2026-03-15, fick ${resultat.senastUtfort}`);
  });

  await test("kvitteringen revisionsloggas", async () => {
    const post = await senastePostAvTyp("orgLevAtagandeFn", "atagande_kvitterat");
    vantaSig(post, "kvitteringen borde loggas");
    vantaSig(post.objektId === "tillganglighetsredogorelse-oversyn", "fel objektId i loggposten");
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
