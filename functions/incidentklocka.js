// Etapp L1p punkt 3 (intern/ETAPPLAN-INTERN-1.md), B11: 72-timmarsklockan från
// drift/INCIDENT-CHECKLISTA.md steg 6, byggd i appen i stället för på papper. Klockan
// ERSÄTTER inte checklistan – den utför bara dess steg 6 (registrera klockslaget, räkna ned,
// visa deadline). Checklistan i övrigt förblir ett dokument, avsiktligt: den ska gå att
// följa även om appen är nere.
//
// Två olika frister kan gälla samtidigt för olika kunder i SAMMA incident:
// granskningar/JURIDISK-GRANSKNING.md risk 15 – en kund under cybersäkerhetslagen
// (2025:1506) har en egen, snävare tidig varning på 24 timmar, medan PUB-avtalet lovar
// leverantören 72. Fristen väljs per organisation (satOmfattasAvNIS2), inte per incident.
const { db, admin, onCall, HttpsError, loggaRevision, kravPlattformsadmin } = require("./gemensamt");

exports.startaIncident = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);

  const kannedomTidpunkt = request.data?.kannedomTidpunkt;
  const orgIds = request.data?.orgIds;
  if (typeof kannedomTidpunkt !== "string" || Number.isNaN(new Date(kannedomTidpunkt).getTime())) {
    throw new HttpsError("invalid-argument", "kannedomTidpunkt måste vara en giltig ISO-tidsstämpel.");
  }
  if (!Array.isArray(orgIds) || orgIds.length === 0 || orgIds.some((id) => typeof id !== "string")) {
    throw new HttpsError("invalid-argument", "orgIds krävs och måste vara en icke-tom lista av organisations-id.");
  }

  const underrattelser = Object.fromEntries(orgIds.map((orgId) => [orgId, { skickad: false, skickadTidpunkt: null }]));
  const ref = db.collection("incidenter").doc();
  await ref.set({
    kannedomTidpunkt,
    orgIds,
    underrattelser,
    skapadAv: request.auth.uid,
    skapad: admin.firestore.FieldValue.serverTimestamp(),
  });

  for (const orgId of orgIds) {
    await loggaRevision({
      organisationId: orgId,
      aktorUid: request.auth.uid,
      aktorRoll: "plattformsadmin",
      handelsetyp: "incidentklocka_startad",
      objektTyp: "incidenter",
      objektId: ref.id,
      sammanfattning: `Incidentklocka startad, kännedom ${kannedomTidpunkt}`,
    });
  }

  return { id: ref.id };
});

exports.kvitteraIncidentunderrattelse = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);

  const { incidentId, orgId } = request.data ?? {};
  if (!incidentId || typeof incidentId !== "string") {
    throw new HttpsError("invalid-argument", "incidentId krävs.");
  }
  if (!orgId || typeof orgId !== "string") {
    throw new HttpsError("invalid-argument", "orgId krävs.");
  }

  const ref = db.collection("incidenter").doc(incidentId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Incidenten hittades inte.");
  }
  if (!(orgId in (snap.data().underrattelser ?? {}))) {
    throw new HttpsError("invalid-argument", "Organisationen ingår inte i den här incidenten.");
  }

  await ref.set(
    {
      underrattelser: {
        [orgId]: { skickad: true, skickadTidpunkt: admin.firestore.FieldValue.serverTimestamp() },
      },
    },
    { merge: true }
  );
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "incidentunderrattelse_kvitterad",
    objektTyp: "incidenter",
    objektId: incidentId,
    sammanfattning: "Underrättelse om personuppgiftsincident skickad till kunden",
  });

  return { ok: true };
});
