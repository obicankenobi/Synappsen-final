// revisionslogg.js – del av Synappsen Cloud Functions.
//
// Etapp 61a (ETAPPLAN12.md): functions/index.js hade vuxit till ~4700 rader och ~93
// exports i EN fil. Den är nu uppdelad per domän – samma kod, samma exports, samma
// beteende – och index.js är bara en tunn åter-exporterande skarv (så både
// firebase deploy och tests/functions/*.test.cjs fungerar oförändrat).
//
// Den här filen: revisionsloggens kedjekontroll i drift: den schemalagda genomgången av
// alla organisationers hashkedjor samt admin-vyns verifiering/export. Själva
// skrivningen (loggaRevision) och kedjekontrollen för EN organisation ligger i
// gemensamt.js, eftersom nästan varje domän loggar revision.

const { onSchedule } = require("firebase-functions/v2/scheduler");
const Sentry = require("@sentry/node");
const {
  admin,
  db,
  onCall,
  HttpsError,
  hamtaAnvandarInfo,
  loggaRevision,
  verifieraRevisionskedja,
  arPlattformsadminServer,
} = require("./gemensamt");

// Etapp 32d: "en manipuleringsdetekterande logg som ingen kontrollerar detekterar inget"
// (ETAPPLAN5.md krav 11). Kedjekontrollen (Etapp 14) kördes tidigare bara på begäran, från
// adminpanelen – en manipulerad kedja hade kunnat stå oupptäckt på obestämd tid om ingen
// råkade klicka på "Verifiera". Kör samma kontroll automatiskt varje natt, för ALLA
// organisationer, och larma (Sentry + systemvarningar, samma mönster som
// verifieraKlinikstodSchemalagt ovan) bara vid en faktisk avvikelse.
async function verifieraRevisionskedjor() {
  const orgSnap = await db.collection("organisationer").get();
  const avvikelser = [];
  for (const orgDoc of orgSnap.docs) {
    const resultat = await verifieraRevisionskedja(orgDoc.id);
    if (!resultat.giltig) {
      avvikelser.push({ orgId: orgDoc.id, ...resultat });
    }
  }

  // Etapp 46: skriv resultatet ÄVEN när allt är i sin ordning, inte bara vid en avvikelse.
  // Utan detta går det inte att skilja "kedjan är intakt" från "det här jobbet slutade
  // köras för tre veckor sedan" – tystnad betydde tidigare båda sakerna, oskiljbart, för
  // den som tittar i adminpanelen. `systemstatus/revisionskedja` är ett enda, delat
  // sammanfattningsdokument (samma icke-organisationsskopade mönster som
  // `systemvarningar`) – inte en logg, bara senaste kända läget.
  await db
    .collection("systemstatus")
    .doc("revisionskedja")
    .set({
      senastKord: admin.firestore.FieldValue.serverTimestamp(),
      alletGiltigt: avvikelser.length === 0,
      antalOrganisationerKontrollerade: orgSnap.size,
      // Bara organisation + den redan maskinella orsakstexten (t.ex. "kedjan bruten") –
      // aldrig dokumentinnehåll, samma försiktighet som Sentry-larmet nedan.
      avvikelser: avvikelser.map((a) => ({ orgId: a.orgId, orsak: a.orsak })),
    });

  if (avvikelser.length === 0) return avvikelser;

  // Aldrig dokumentinnehåll i larmet – bara organisation, dokument-ID och den redan
  // maskinella orsakstexten (t.ex. "kedjan bruten"), som inte innehåller PII.
  Sentry.captureMessage("Revisionsloggens hashkedja är bruten", {
    level: "error",
    tags: { typ: "revisionslogg-integritetsbrott" },
    extra: { avvikelser },
  });
  await db.collection("systemvarningar").add({
    typ: "revisionslogg_integritet",
    meddelande: `Hashkedjan är bruten för ${avvikelser.length} organisation(er): ${avvikelser
      .map((a) => `${a.orgId} (${a.orsak})`)
      .join(" | ")}`,
    tidpunkt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return avvikelser;
}
// Exporterad enbart för tests/functions/etapp32d.test.cjs (samma mönster som
// kontrolleraProvperioder/backupaOrganisation – test:functions kör bara firestore+storage-
// emulatorerna, inte en riktig scheduler).
exports.verifieraRevisionskedjor = verifieraRevisionskedjor;

exports.verifieraRevisionskedjorSchemalagt = onSchedule(
  { schedule: "every day 04:00", timeZone: "Europe/Stockholm", region: "europe-west1" },
  verifieraRevisionskedjor
);

// Etapp 14d: begränsningstext som MÅSTE följa med varje export/verifiering, i enlighet med
// begränsningsrutan i ETAPPLAN3.md Etapp 14 – en granskare ska förstå exakt vad kontrollen
// bevisar och inte bevisar, inte bara få ett "OK".
const REVISIONSLOGG_BEGRANSNINGSTEXT =
  "Denna hashkedja bevisar att ingen post i listan nedan har ändrats eller tagits bort " +
  "VIA NORMAL APPANVÄNDNING (en inloggad klient som skriver mot Firestore) sedan den " +
  "skapades. Den bevisar INTE att kedjan aldrig manipulerats av någon med åtkomst till " +
  "Firebase-konsolen eller Admin SDK-behörighet (t.ex. en superadmin på leverantörssidan, " +
  "eller vid ett komprometterat tjänstekonto) – en sådan aktör kan i princip skriva om " +
  "hela kedjan, inklusive omräknade efterföljande hashar. Verifieringsinstruktion: varje " +
  "post innehåller foregaendeHash (hashen av föregående post) och hash (sha256 av postens " +
  "eget innehåll plus foregaendeHash). En bruten kedja - antingen ett foregaendeHash som " +
  "inte matchar föregående posts hash, eller en post vars innehåll inte längre ger samma " +
  "hash som lagrats - avslöjar en ändring gjord utanför loggaRevision().";

// Endast superadmin (egen organisation) eller leverantörsadmin får verifiera/exportera –
// samma behörighet som firestore.rules redan kräver för att LÄSA revisionslogg, men detta
// är en Cloud Function eftersom verifieraRevisionskedja() kör serverlogik (Admin SDK) som
// en klient inte kan utföra själv bara genom att läsa collectionen.
async function kravLasningAvRevisionslogg(request, organisationIdFranData) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  if (await arPlattformsadminServer(request.auth.uid)) {
    if (!organisationIdFranData) {
      throw new HttpsError("invalid-argument", "organisationId krävs.");
    }
    return organisationIdFranData;
  }
  const { roll, organisationId } = await hamtaAnvandarInfo(request.auth.uid);
  if (roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin eller leverantörsadmin kan läsa revisionsloggen.");
  }
  return organisationId;
}

exports.verifieraRevisionsloggAdmin = onCall({ region: "europe-west1" }, async (request) => {
  const organisationId = await kravLasningAvRevisionslogg(request, request.data?.organisationId);
  const resultat = await verifieraRevisionskedja(organisationId);
  return { ...resultat, begransningstext: REVISIONSLOGG_BEGRANSNINGSTEXT };
});

// Loggar själva exporttillfället (se Etapp 14c/ETAPPLAN3.md Etapp 14d: "Själva exporten
// loggas"). Innehållet i exporten byggs av klienten utifrån den revisionslogg-lista den
// redan har läsrätt till direkt via firestore.rules – denna funktion returnerar bara
// begränsningstexten plus kedjeresultatet, så klienten inte behöver hårdkoda texten själv
// och exporten alltid bygger på en färsk verifiering.
exports.exporteraRevisionslogg = onCall({ region: "europe-west1" }, async (request) => {
  const organisationId = await kravLasningAvRevisionslogg(request, request.data?.organisationId);
  const resultat = await verifieraRevisionskedja(organisationId);
  await loggaRevision({
    organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: (await hamtaAnvandarInfo(request.auth.uid)).roll ?? "plattformsadmin",
    handelsetyp: "revisionslogg_exporterad",
    objektTyp: "revisionslogg",
    objektId: null,
    sammanfattning: "Revisionsloggen exporterades",
  });
  return { ...resultat, begransningstext: REVISIONSLOGG_BEGRANSNINGSTEXT };
});

// Etapp 61a: exporteras för de domänfiler som anropar dem över filgränsen
// (se index.js – dessa åter-exporteras INTE därifrån, de var aldrig exports förut).
exports.kravLasningAvRevisionslogg = kravLasningAvRevisionslogg;
