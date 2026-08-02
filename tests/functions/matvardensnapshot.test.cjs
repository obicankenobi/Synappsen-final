// Etapp 39a: bevisar att skapaMatvardenSnapshot() beräknar rätt kvitteringsgrad/nollträffar/
// tid-att-hitta/checklistkörningar/innehållshälsa per organisation och skriver en snapshot per
// vecka, samt att en organisation utan data inte kraschar hela jobbet för andra organisationer.
//
// Körs mot emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore,storage,auth \
//     "node tests/functions/matvardensnapshot.test.cjs"
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

function dagarSedan(antal) {
  const d = new Date();
  d.setDate(d.getDate() - antal);
  return admin.firestore.Timestamp.fromDate(d);
}

async function main() {
  await test("kvitteringsgradServer räknar rätt snitt", () => {
    const rutiner = [
      { status: "godkand", lasteAv: [{ uid: "a" }, { uid: "b" }] },
      { status: "godkand", lasteAv: [] },
    ];
    // 2 användare totalt: rutin1 = 2/2=100%, rutin2 = 0/2=0% → snitt 50%
    vantaSig(funcs.kvitteringsgradServer(rutiner, 2) === 50, "förväntade 50%");
  });

  await test("kvitteringsgradServer returnerar null utan godkända rutiner", () => {
    vantaSig(funcs.kvitteringsgradServer([{ status: "utkast" }], 5) === null, "förväntade null");
  });

  await test("kvitteringsgradServer utesluter arkiverade rutiner", () => {
    const rutiner = [
      { status: "godkand", lasteAv: [{ uid: "a" }] },
      { status: "godkand", lasteAv: [], arkiverad: true },
    ];
    // Bara den icke-arkiverade räknas: 1/1 = 100%
    vantaSig(funcs.kvitteringsgradServer(rutiner, 1) === 100, "arkiverad rutin drog ner snittet felaktigt");
  });

  await test("beraknaHalsaServer: en frisk rutin ger 100%", () => {
    const rutiner = [
      {
        status: "godkand",
        granskadDatum: dagarSedan(10),
        agare: { typ: "roll", roll: "vol" },
        lasteAv: [{ uid: "a" }],
        kallVarning: false,
      },
    ];
    vantaSig(funcs.beraknaHalsaServer(rutiner) === 100, "förväntade 100%");
  });

  await test("beraknaHalsaServer: en rutin utan ägare drar ner siffran", () => {
    const rutiner = [
      {
        status: "godkand",
        granskadDatum: dagarSedan(10),
        agare: null,
        lasteAv: [{ uid: "a" }],
        kallVarning: false,
      },
    ];
    vantaSig(funcs.beraknaHalsaServer(rutiner) === 0, "förväntade 0%");
  });

  await test("beraknaHalsaServer returnerar null utan godkända rutiner", () => {
    vantaSig(funcs.beraknaHalsaServer([]) === null, "förväntade null");
  });

  await test("skapaMatvardenSnapshot skriver en komplett snapshot för en organisation med data", async () => {
    const orgId = "orgSnapshot1";
    await db.collection("organisationer").doc(orgId).set({ namn: "Snapshot-org" });
    await db.collection("users").doc("snapAnv1").set({ organisationId: orgId, role: "personal" });
    await db.collection("users").doc("snapAnv2").set({ organisationId: orgId, role: "vol" });
    await db.collection("rutiner").doc("snapRutin1").set({
      organisationId: orgId,
      omrade: "kliniskt-stod",
      status: "godkand",
      titel: "Snapsrutin",
      lasteAv: [{ uid: "snapAnv1" }, { uid: "snapAnv2" }],
      agare: { typ: "roll", roll: "vol" },
      granskadDatum: dagarSedan(5),
      kallVarning: false,
    });
    await db.collection("soksstatistik").doc(orgId).set({
      totaltAntalSokningar: 10,
      antalNollTraffar: 2,
      totalTidTillKlickMs: 20000,
      antalTidmatningar: 4,
    });
    await db.collection("checklistkorningar").doc("snapRutin1").set({
      organisationId: orgId,
      antalPaborjade: 3,
    });

    await funcs.skapaMatvardenSnapshot();

    const datum = new Date().toISOString().slice(0, 10);
    const snap = await db.collection("organisationer").doc(orgId).collection("matvardenSnapshots").doc(datum).get();
    vantaSig(snap.exists, "snapshot skrevs inte");
    const data = snap.data();
    vantaSig(data.kvitteringsgradKlinisktStod === 100, `kvitteringsgrad: ${data.kvitteringsgradKlinisktStod}`);
    vantaSig(data.andelNollTraffar === 20, `andelNollTraffar: ${data.andelNollTraffar}`);
    vantaSig(data.tidAttHittaSekunder === 5, `tidAttHittaSekunder: ${data.tidAttHittaSekunder}`);
    vantaSig(data.antalChecklistkorningar === 3, `antalChecklistkorningar: ${data.antalChecklistkorningar}`);
    vantaSig(data.innehallshalsaKlinisktStod === 100, `innehallshalsaKlinisktStod: ${data.innehallshalsaKlinisktStod}`);
  });

  await test("skapaMatvardenSnapshot fortsätter till nästa organisation även om en saknar all data", async () => {
    const orgId = "orgSnapshotTom";
    await db.collection("organisationer").doc(orgId).set({ namn: "Tom organisation" });
    // Ingen rutin, ingen sökstatistik, inga checklistkörningar – ska INTE kasta.
    await funcs.skapaMatvardenSnapshot();

    const datum = new Date().toISOString().slice(0, 10);
    const snap = await db.collection("organisationer").doc(orgId).collection("matvardenSnapshots").doc(datum).get();
    vantaSig(snap.exists, "snapshot skrevs inte ens för en tom organisation");
    const data = snap.data();
    vantaSig(data.kvitteringsgradKlinisktStod === null, "förväntade null utan rutiner");
    vantaSig(data.andelNollTraffar === null, "förväntade null utan sökstatistik");
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
