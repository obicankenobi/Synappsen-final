// Etapp L1o (intern/ETAPPLAN-INTERN-1.md): återkommande leverantörsskyldigheter som
// signaler i stället för prosa i fyra olika dokument. Se src/utils/leverantorSignaler.js
// (berakAtagandeSignaler) för hur ett förfallet åtagande blir en signal i leverantörsvyn.
//
// "Att kvittera ett åtagande är att skriva senastUtfort, inte att bocka en ruta" (planen,
// L1o) – det är hela poängen med att det här går via en Cloud Function och inte en direkt
// klientskrivning: en kvittering ska revisionsloggas precis som varje annan leverantörsåtgärd
// mot kundinnehåll, annars är den inte skiljbar från att bara ha ändrat en lokal flagga.
const { db, admin, onCall, HttpsError, hamtaAnvandarInfo, loggaRevision, kravPlattformsadmin } = require("./gemensamt");

// Fyra åtaganden, alla med sin källa dokumenterad i intern/ETAPPLAN-INTERN-1.md L1o.
// "rto-matning" är det enda av de fyra som kvitteras AUTOMATISKT (av
// functions/scripts/rto-matning.cjs efter en lyckad körning) – de tre andra kvitteras
// manuellt via sattAtagandeUtfort. Se AtagandekalenderSektion.jsx för hur det syns i UI:t.
const SEED = [
  {
    id: "nyckelrotation",
    vad: "Nyckelrotation av samtliga fem hemligheter",
    intervallManader: 12,
    kalla: "drift/INCIDENT-CHECKLISTA.md, avsnittet Nyckelrotation",
  },
  {
    id: "rto-matning",
    vad: "Faktisk RTO-mätning mot skarp infrastruktur",
    intervallManader: 6,
    kalla: "CLAUDE.md säkerhetsgenomgången p. 5, avtal/IT-FAKTABLAD.md p. 6",
  },
  {
    id: "incidentresponsplan-oversyn",
    vad: "Översyn av incidentresponsplanen",
    intervallManader: 6,
    kalla: "avtal/INCIDENTRESPONSPLAN.md avsnitt 12",
  },
  {
    id: "tillganglighetsredogorelse-oversyn",
    vad: "Översyn av tillgänglighetsredogörelsen",
    intervallManader: 12,
    kalla: "granskningar/TILLGANGLIGHETSREDOGORELSE.md",
  },
];

// Idempotent, samma "merge utan att röra senastUtfort"-idé som seedaKvissbank – en omkörning
// (t.ex. om ett femte åtagande läggs till senare) får ALDRIG nollställa en redan registrerad
// kvittering, eftersom senastUtfort medvetet inte ingår i det som skrivs här.
exports.seedaAtagandekalender = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  await kravPlattformsadmin(request.auth.uid);

  let skapade = 0;
  let uppdaterade = 0;
  const befintliga = new Set((await db.collection("atagandekalender").select().get()).docs.map((d) => d.id));

  const batch = db.batch();
  for (const { id, ...falt } of SEED) {
    batch.set(db.collection("atagandekalender").doc(id), falt, { merge: true });
    if (befintliga.has(id)) uppdaterade += 1;
    else skapade += 1;
  }
  await batch.commit();

  return { skapade, uppdaterade };
});

// Manuell kvittering för de åtaganden som inte skrivs av ett automatiskt jobb (allt utom
// "rto-matning", se SEED ovan). Tar valfritt ett eget datum (ISO, ÅÅÅÅ-MM-DD) för det sällsynta
// fallet att arbetet gjordes för några dagar sedan och inte just idag – annars UTC "nu".
exports.sattAtagandeUtfort = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  await kravPlattformsadmin(request.auth.uid);

  const id = request.data?.id;
  const angivetDatum = request.data?.senastUtfort ?? null;
  if (!id || typeof id !== "string") {
    throw new HttpsError("invalid-argument", "id krävs.");
  }
  if (angivetDatum !== null && !/^\d{4}-\d{2}-\d{2}$/.test(angivetDatum)) {
    throw new HttpsError("invalid-argument", "senastUtfort måste vara null eller ÅÅÅÅ-MM-DD.");
  }

  const ref = db.collection("atagandekalender").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Åtagandet finns inte. Kör seedaAtagandekalender först.");
  }

  const senastUtfort = angivetDatum ? new Date(`${angivetDatum}T00:00:00.000Z`).toISOString() : new Date().toISOString();
  await ref.set({ senastUtfort }, { merge: true });

  const { organisationId } = await hamtaAnvandarInfo(request.auth.uid);
  await loggaRevision({
    organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "atagande_kvitterat",
    objektTyp: "atagandekalender",
    objektId: id,
    sammanfattning: `${snap.data().vad} kvitterat utfört (${senastUtfort.slice(0, 10)})`,
  });

  return { id, senastUtfort };
});

// Exporterad ENBART för tests/functions/atagandekalender.test.cjs, som verifierar att seeden
// innehåller exakt de fyra förväntade åtagandena. functions/scripts/rto-matning.cjs skriver
// sitt eget "rto-matning"-kvitto direkt mot Firestore (den har redan Admin SDK-åtkomst och
// ingen plattformsadmin-uid att autentisera som) – den importerar inte den här filen alls.
exports._SEED = SEED;
