// Etapp L1p punkt 3 (intern/ETAPPLAN-INTERN-1.md), B11: startaIncident och
// kvitteraIncidentunderrattelse.
//
// Den kritiska egenskapen: kvitteraIncidentunderrattelse för EN organisation får ALDRIG
// skriva över de andra organisationernas underrattelser-poster i samma incident. set() med
// {merge:true} och ett nästlat objekt gör en REKURSIV merge i Firestore (inte en total
// överskrivning av hela underrattelser-mapen) – det här testet bevisar det skarpt i stället
// för att lita på det som ett antagande, eftersom en trasig merge hade varit en tyst
// dataförlust (övriga kunders "skickad: false" hade tystnat till "fältet finns inte alls").
//
// Körs mot Firestore-emulatorn:
//   npx firebase-tools@13 emulators:exec --project demo-test --only firestore \
//     "node tests/functions/incidentklocka.test.cjs"
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

async function senastePostAvTyp(organisationId, handelsetyp) {
  const snap = await db
    .collection("revisionslogg")
    .where("organisationId", "==", organisationId)
    .where("handelsetyp", "==", handelsetyp)
    .get();
  return snap.docs.map((d) => d.data());
}

async function main() {
  await db.collection("plattformsadmin").doc("levIncident").set({ blevPlattformsadmin: Date.now() });
  await db.collection("organisationer").doc("orgIncA").set({ namn: "A", omfattasAvNIS2: true });
  await db.collection("organisationer").doc("orgIncB").set({ namn: "B", omfattasAvNIS2: false });

  console.log("\nstartaIncident");
  await test("en icke-plattformsadmin kan INTE starta en incident", () =>
    forvantaFel("permission-denied", () =>
      funcs.startaIncident.run({
        data: { kannedomTidpunkt: new Date().toISOString(), orgIds: ["orgIncA"] },
        auth: { uid: "nagonAnnan" },
      })
    )
  );

  await test("ogiltig kannedomTidpunkt ger invalid-argument", () =>
    forvantaFel("invalid-argument", () =>
      funcs.startaIncident.run({
        data: { kannedomTidpunkt: "inte-ett-datum", orgIds: ["orgIncA"] },
        auth: { uid: "levIncident" },
      })
    )
  );

  await test("tom orgIds-lista ger invalid-argument", () =>
    forvantaFel("invalid-argument", () =>
      funcs.startaIncident.run({
        data: { kannedomTidpunkt: new Date().toISOString(), orgIds: [] },
        auth: { uid: "levIncident" },
      })
    )
  );

  let incidentId;
  await test("en plattformsadmin KAN starta en incident för flera organisationer", async () => {
    const resultat = await funcs.startaIncident.run({
      data: { kannedomTidpunkt: "2026-08-29T12:00:00.000Z", orgIds: ["orgIncA", "orgIncB"] },
      auth: { uid: "levIncident" },
    });
    incidentId = resultat.id;
    const snap = await db.collection("incidenter").doc(incidentId).get();
    vantaSig(snap.data().underrattelser.orgIncA.skickad === false, "orgIncA borde starta som ej skickad");
    vantaSig(snap.data().underrattelser.orgIncB.skickad === false, "orgIncB borde starta som ej skickad");
  });

  await test("starten loggas i BÅDA organisationernas kedjor", async () => {
    const a = await senastePostAvTyp("orgIncA", "incidentklocka_startad");
    const b = await senastePostAvTyp("orgIncB", "incidentklocka_startad");
    vantaSig(a.length === 1, "saknar loggpost för orgIncA");
    vantaSig(b.length === 1, "saknar loggpost för orgIncB");
  });

  console.log("\nkvitteraIncidentunderrattelse");
  await test("en icke-plattformsadmin kan INTE kvittera", () =>
    forvantaFel("permission-denied", () =>
      funcs.kvitteraIncidentunderrattelse.run({
        data: { incidentId, orgId: "orgIncA" },
        auth: { uid: "nagonAnnan" },
      })
    )
  );

  await test("okänt incidentId ger not-found", () =>
    forvantaFel("not-found", () =>
      funcs.kvitteraIncidentunderrattelse.run({
        data: { incidentId: "finns-inte", orgId: "orgIncA" },
        auth: { uid: "levIncident" },
      })
    )
  );

  await test("en organisation som inte ingår i incidenten ges invalid-argument", () =>
    forvantaFel("invalid-argument", () =>
      funcs.kvitteraIncidentunderrattelse.run({
        data: { incidentId, orgId: "orgIncC-finns-inte-i-incidenten" },
        auth: { uid: "levIncident" },
      })
    )
  );

  await test("KRITISKT: kvittering av orgIncA rör INTE orgIncB:s post i samma incident", async () => {
    await funcs.kvitteraIncidentunderrattelse.run({ data: { incidentId, orgId: "orgIncA" }, auth: { uid: "levIncident" } });

    const snap = await db.collection("incidenter").doc(incidentId).get();
    vantaSig(snap.data().underrattelser.orgIncA.skickad === true, "orgIncA borde vara markerad skickad");
    vantaSig(
      snap.data().underrattelser.orgIncB.skickad === false,
      "orgIncB skulle vara OFÖRÄNDRAD, men kvitteringen av orgIncA påverkade den"
    );
  });

  await test("kvitteringen loggas i den drabbade kundens egen kedja", async () => {
    const poster = await senastePostAvTyp("orgIncA", "incidentunderrattelse_kvitterad");
    vantaSig(poster.length === 1, "kvitteringen borde loggas");
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
