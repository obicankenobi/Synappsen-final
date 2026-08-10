// avtalslivscykel.js – del av Synappsen Cloud Functions.
//
// Etapp 61a (ETAPPLAN12.md): functions/index.js hade vuxit till ~4700 rader och ~93
// exports i EN fil. Den är nu uppdelad per domän – samma kod, samma exports, samma
// beteende – och index.js är bara en tunn åter-exporterande skarv (så både
// firebase deploy och tests/functions/*.test.cjs fungerar oförändrat).
//
// Den här filen: brutits ut ur organisationslivscykel.js (som ändå landade på 1 229
// rader efter första delningsomgången, över planens ~800-radersriktmärke – etablering/
// demo-frö och avtals-/avvecklingslivscykeln är två separata teman som råkade ligga i
// samma originalfil, utan någon delad kod mellan dem förutom de vanliga gemensamt.js-
// primitiverna). Innehåll: avtalsstatus/provperiod/årsavgift/sökkvottak/huvudman,
// månadsrapport, paus, export, raderingsbegäran med ångerfrist, tidsbegränsad
// supportåtkomst och den faktiska raderingen.

const { onSchedule } = require("firebase-functions/v2/scheduler");
const Sentry = require("@sentry/node");
const {
  admin,
  db,
  bucket,
  onCall,
  HttpsError,
  UPPSKATTAD_KOSTNAD_ORE,
  SOKKVOT_DAGSTAK,
  SOKKVOT_ORG_TAK_STANDARD,
  hamtaAnvandarInfo,
  aktuellManadNyckel,
  loggaRevision,
  arPlattformsadminServer,
  kravPlattformsadmin,
} = require("./gemensamt");
const { BACKUP_COLLECTIONS, BACKUP_SUBCOLLECTIONS, backupaOrganisation } = require("./backup");

// Etapp 15d: avtals-/betalningsflödet sker MEDVETET utanför appen (avtalssignering och
// fakturering, se beslutspunkt 6 i ETAPPLAN3.md) – det här är bara en statusflagga en
// leverantörsadmin sätter manuellt i takt med att det faktiskt händer. Ingen koppling till
// organisationer/{orgId}.status (drift-på/av, se pausaOrganisation) – en organisation kan
// mycket väl vara avtalsstatus="signerat" men ännu inte satts i drift, eller vice versa.
const GILTIGA_AVTALSSTATUSAR = ["offert", "signerat", "aktiv", "pausad", "avslutad"];

exports.satAvtalsstatus = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { orgId, avtalsstatus } = request.data ?? {};
  if (!orgId || typeof orgId !== "string") {
    throw new HttpsError("invalid-argument", "orgId krävs.");
  }
  if (!GILTIGA_AVTALSSTATUSAR.includes(avtalsstatus)) {
    throw new HttpsError(
      "invalid-argument",
      `avtalsstatus måste vara en av: ${GILTIGA_AVTALSSTATUSAR.join(", ")}.`
    );
  }
  const orgRef = db.collection("organisationer").doc(orgId);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) {
    throw new HttpsError("not-found", "Organisationen hittades inte.");
  }
  await orgRef.set({ avtalsstatus }, { merge: true });
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_avtalsstatus_andrad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: `Avtalsstatus ändrad till "${avtalsstatus}"`,
  });
  return { ok: true };
});

// Etapp 15e: sätter/ändrar en organisations provperiodSlut (ISO-datum "ÅÅÅÅ-MM-DD", eller
// null för att ta bort en provperiod helt). Anropet PAUSAR ALDRIG något självt – bara
// datumet ändras här, så en leverantörsadmin kan förlänga en provperiod utan att behöva
// återaktivera organisationen manuellt efteråt om den redan hunnit pausas automatiskt.
// Den faktiska pausningen sker i kontrolleraProvperioderSchemalagt() nedan.
const ISO_DATUM_REGEX = /^\d{4}-\d{2}-\d{2}$/;

exports.satProvperiod = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { orgId, provperiodSlut } = request.data ?? {};
  if (!orgId || typeof orgId !== "string") {
    throw new HttpsError("invalid-argument", "orgId krävs.");
  }
  if (provperiodSlut !== null && !ISO_DATUM_REGEX.test(provperiodSlut ?? "")) {
    throw new HttpsError(
      "invalid-argument",
      "provperiodSlut måste vara null eller ett datum på formen ÅÅÅÅ-MM-DD."
    );
  }
  const orgRef = db.collection("organisationer").doc(orgId);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) {
    throw new HttpsError("not-found", "Organisationen hittades inte.");
  }
  await orgRef.set({ provperiodSlut }, { merge: true });
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_provperiod_andrad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: provperiodSlut ? `Provperiod satt till ${provperiodSlut}` : "Provperiod borttagen",
  });
  return { ok: true };
});

// Etapp 48c: manuellt inmatat avtalat årspris (kr), så att leverantörsvyn kan visa det
// bredvid den redan kända AI-kostnaden – INTE ett fullständigt täckningsbidrag. Faktisk
// molnkostnad (Firestore/Storage/Functions utöver AI) kräver GCP-faktureringsexport till
// BigQuery, ett projektval bara ägaren kan aktivera i GCP-konsolen, inte en kodfråga (se
// samma slutsats redan dragen för Etapp 32b:s inloggningslarm, ETAPPLAN5.md/
// SAKERHETSRAPPORT.md). Utan den exporten finns ingen programmatisk källa till total
// molnkostnad per organisation, så det här fältet är ett förberedande steg, inte en färdig
// automatisk vy.
exports.satAvtaladArsavgift = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { orgId, avtaladArsavgiftKr } = request.data ?? {};
  if (!orgId || typeof orgId !== "string") {
    throw new HttpsError("invalid-argument", "orgId krävs.");
  }
  if (
    avtaladArsavgiftKr !== null &&
    (typeof avtaladArsavgiftKr !== "number" || !Number.isFinite(avtaladArsavgiftKr) || avtaladArsavgiftKr < 0)
  ) {
    throw new HttpsError("invalid-argument", "avtaladArsavgiftKr måste vara null eller ett tal ≥ 0.");
  }
  const orgRef = db.collection("organisationer").doc(orgId);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) {
    throw new HttpsError("not-found", "Organisationen hittades inte.");
  }
  await orgRef.set({ avtaladArsavgiftKr }, { merge: true });
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_avtalad_arsavgift_andrad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning:
      avtaladArsavgiftKr === null
        ? "Avtalad årsavgift borttagen"
        : `Avtalad årsavgift satt till ${avtaladArsavgiftKr} kr/år`,
  });
  return { ok: true };
});

// Etapp 48d: konfigurerbart tak för en enskild organisations andel av den DELADE dygnskvoten
// (se SOKKVOT_ORG_TAK_STANDARD/okaSokkvot ovan). null = använd standardtaket.
exports.satSokkvotTakPerDygn = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { orgId, sokkvotTakPerDygn } = request.data ?? {};
  if (!orgId || typeof orgId !== "string") {
    throw new HttpsError("invalid-argument", "orgId krävs.");
  }
  if (
    sokkvotTakPerDygn !== null &&
    (typeof sokkvotTakPerDygn !== "number" ||
      !Number.isInteger(sokkvotTakPerDygn) ||
      sokkvotTakPerDygn < 1 ||
      sokkvotTakPerDygn > SOKKVOT_DAGSTAK)
  ) {
    throw new HttpsError(
      "invalid-argument",
      `sokkvotTakPerDygn måste vara null eller ett heltal mellan 1 och ${SOKKVOT_DAGSTAK}.`
    );
  }
  const orgRef = db.collection("organisationer").doc(orgId);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) {
    throw new HttpsError("not-found", "Organisationen hittades inte.");
  }
  await orgRef.set({ sokkvotTakPerDygn }, { merge: true });
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_sokkvottak_andrad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning:
      sokkvotTakPerDygn === null
        ? `Sökkvottak återställt till standard (${SOKKVOT_ORG_TAK_STANDARD}/dygn)`
        : `Sökkvottak satt till ${sokkvotTakPerDygn}/dygn`,
  });
  return { ok: true };
});

// Etapp 54b: en huvudmannanivå OVANPÅ organisationsmodellen, inte istället för den – ingen
// dataflytt, ingen ändrad regel (se ETAPPLAN11.md §54 "Premisskontroll" och
// firestore.rules-kommentaren för organisationer/{orgId}, oförändrad). Ett fritextfält, satt
// av leverantören, som bara används för att GRUPPERA redan separata, redan fullt isolerade
// organisationer i leverantörsvyn – ingen ny läsväg mellan organisationer skapas.
exports.satHuvudman = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { orgId, huvudman } = request.data ?? {};
  if (!orgId || typeof orgId !== "string") {
    throw new HttpsError("invalid-argument", "orgId krävs.");
  }
  if (huvudman !== null && (typeof huvudman !== "string" || huvudman.trim().length === 0)) {
    throw new HttpsError("invalid-argument", "huvudman måste vara null eller en icke-tom text.");
  }
  const varde = huvudman === null ? null : huvudman.trim();
  const orgRef = db.collection("organisationer").doc(orgId);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) {
    throw new HttpsError("not-found", "Organisationen hittades inte.");
  }
  await orgRef.set({ huvudman: varde }, { merge: true });
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_huvudman_andrad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: varde === null ? "Huvudman borttagen" : `Huvudman satt till "${varde}"`,
  });
  return { ok: true };
});

// Etapp 15e: automatisk pausning när en organisations provperiod gått ut. Pausat läge =
// läsbehörighet kvar, ingen ny skrivning (samma mekanism som pausaOrganisation/Etapp 6d,
// se organisationenArAktiv() i firestore.rules) – raderar ALDRIG kunddata automatiskt.
// Varningarna 14/7/1 dag innan är inget som skrivs härifrån – de beräknas direkt i klienten
// (ProvperiodBanner.jsx) utifrån samma provperiodSlut-fält, som redan är läsbart för alla
// organisationsmedlemmar. Körs dagligen, inte exakt vid midnatt UTC för provperiodSlut-dagen,
// så en organisation kan vara pausad upp till ett dygn efter det formella slutdatumet.
async function kontrolleraProvperioder() {
  const idagIso = new Date().toISOString().slice(0, 10);
  const orgSnap = await db.collection("organisationer").where("status", "==", "aktiv").get();
  for (const orgDoc of orgSnap.docs) {
    const provperiodSlut = orgDoc.data()?.provperiodSlut;
    if (!provperiodSlut || provperiodSlut > idagIso) continue;
    await orgDoc.ref.set({ status: "pausad" }, { merge: true });
    await loggaRevision({
      organisationId: orgDoc.id,
      aktorUid: null,
      aktorRoll: "system",
      handelsetyp: "organisation_provperiod_utgangen",
      objektTyp: "organisationer",
      objektId: orgDoc.id,
      sammanfattning: `Provperioden gick ut (${provperiodSlut}) – organisationen pausades automatiskt`,
    });
  }
}
// Exporterad enbart för tests/functions/etapp6.test.cjs (samma mönster som
// backupaOrganisation/reserveraBudget – test:functions kör bara firestore+storage-
// emulatorerna, inte en riktig scheduler, så kärnlogiken måste vara anropbar direkt).
exports.kontrolleraProvperioder = kontrolleraProvperioder;

exports.kontrolleraProvperioderSchemalagt = onSchedule(
  { schedule: "every day 05:00", timeZone: "Europe/Stockholm", region: "europe-west1" },
  kontrolleraProvperioder
);

// Etapp 15c: faktureringsunderlaget – en rad per organisation med den här månadens
// användning så en prismodell kan sättas på riktiga siffror istället för en gissning.
// Läser bara metadata (antal/summor), aldrig kunddatans innehåll. Lagringsvolymen kräver en
// bucket-genomgång eftersom Storage-sökvägarna är strukturerade per rutin/artikel-id, inte
// per organisation (se storage.rules) – görs en gång för HELA bucketen och fördelas sedan
// på organisationer via en uppslagskarta, istället för en genomgång per organisation.
exports.manadsrapportOrganisationer = onCall({ region: "europe-west1", timeoutSeconds: 120 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);

  const [orgSnap, rutinerSnap, forradsartiklarSnap] = await Promise.all([
    db.collection("organisationer").get(),
    db.collection("rutiner").select("organisationId", "borttagen").get(),
    db.collection("forradsartiklar").select("organisationId").get(),
  ]);

  // rutinId/artikelId -> organisationId, för att fördela Storage-filernas storlek nedan.
  const agareOrganisation = new Map();
  const antalRutinerPerOrg = new Map();
  for (const rutinDoc of rutinerSnap.docs) {
    const data = rutinDoc.data();
    agareOrganisation.set(rutinDoc.id, data.organisationId);
    if (!data.borttagen) {
      antalRutinerPerOrg.set(data.organisationId, (antalRutinerPerOrg.get(data.organisationId) ?? 0) + 1);
    }
  }
  for (const artikelDoc of forradsartiklarSnap.docs) {
    agareOrganisation.set(artikelDoc.id, artikelDoc.data().organisationId);
  }

  const lagringBytesPerOrg = new Map();
  const [rutinFiler, artikelFiler] = await Promise.all([
    bucket.getFiles({ prefix: "rutiner/" }),
    bucket.getFiles({ prefix: "forradsartiklar/" }),
  ]);
  for (const fil of [...rutinFiler[0], ...artikelFiler[0]]) {
    // Sökvägsformen är {rutiner|forradsartiklar}/{omrade|forradSlug}/{agarId}/{filnamn} –
    // se storage.rules – så ägarens id sitter alltid på index 2.
    const agarId = fil.name.split("/")[2];
    const orgId = agareOrganisation.get(agarId);
    if (!orgId) continue;
    const storlek = Number(fil.metadata?.size ?? 0);
    lagringBytesPerOrg.set(orgId, (lagringBytesPerOrg.get(orgId) ?? 0) + storlek);
  }

  const organisationer = await Promise.all(
    // Etapp 51: demo-organisationen är aldrig en betalande kund – att räkna in den i
    // faktureringsunderlaget hade förvrängt siffrorna varje natt den nollställs och seedas om.
    orgSnap.docs
      .filter((orgDoc) => orgDoc.data()?.arDemo !== true)
      .map(async (orgDoc) => {
      const data = orgDoc.data();
      const [anvandareSnap, budgetSnap] = await Promise.all([
        db.collection("users").where("organisationId", "==", orgDoc.id).select().get(),
        orgDoc.ref.collection("installningar").doc("geminiBudget").get(),
      ]);
      const budget = budgetSnap.exists ? budgetSnap.data() : {};
      const anvantOre = budget.anvantOre ?? 0;
      return {
        orgId: orgDoc.id,
        namn: data.namn ?? orgDoc.id,
        aktuellManad: budget.aktuellManad ?? aktuellManadNyckel(),
        antalAnvandare: anvandareSnap.size,
        antalRutiner: antalRutinerPerOrg.get(orgDoc.id) ?? 0,
        anvantOre,
        // Grovt uppskattat: varje AI-anrop reserverar en FAST uppskattad kostnad
        // (UPPSKATTAD_KOSTNAD_ORE), inte den faktiska Gemini-fakturan per anrop – se
        // reserveraBudget(). Exakt antal anrop loggas inte separat någonstans.
        antalAnropUppskattat: Math.round(anvantOre / UPPSKATTAD_KOSTNAD_ORE),
        lagringBytes: lagringBytesPerOrg.get(orgDoc.id) ?? 0,
      };
    })
  );
  // Etapp 32c: se listaOrganisationer ovan – samma motivering, "_plattform" som pseudo-org.
  await loggaRevision({
    organisationId: "_plattform",
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "plattform_manadsrapport_hamtad",
    objektTyp: null,
    objektId: null,
    sammanfattning: `Månadsrapport hämtad för ${organisationer.length} organisationer`,
  });
  return { organisationer };
});

// Etapp 6d: pausar/återaktiverar en organisation. Enforcementet sker i firestore.rules
// (organisationenArAktiv(), infogat i matcharMinOrg()) – en pausad organisations medlemmar
// nekas läs-/skrivåtkomst till allt organisationsskopat innehåll, men kan fortfarande läsa
// organisationer/{orgId} själv (så de faktiskt ser meddelandet om att kontot är pausat).
exports.pausaOrganisation = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { orgId, pausad } = request.data ?? {};
  if (!orgId || typeof pausad !== "boolean") {
    throw new HttpsError("invalid-argument", "orgId och pausad (boolean) krävs.");
  }
  await db.collection("organisationer").doc(orgId).set({ status: pausad ? "pausad" : "aktiv" }, { merge: true });
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: pausad ? "organisation_pausad" : "organisation_atveraktiverad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: pausad ? "Organisationen pausades" : "Organisationen återaktiverades",
  });
  return { ok: true };
});

// Etapp 6d: GDPR-/uppsägningsexport – återanvänder Etapp 3b:s backupaOrganisation() rakt av,
// samma filformat och lagringsplats (backups/{orgId}/{datum}.json), bara nåbar på begäran
// istället för bara via det schemalagda veckojobbet.
exports.exporteraOrganisation = onCall({ region: "europe-west1", timeoutSeconds: 120 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { orgId } = request.data ?? {};
  if (!orgId) {
    throw new HttpsError("invalid-argument", "orgId krävs.");
  }
  const path = await backupaOrganisation(orgId);
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_exporterad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: `Organisationsdata exporterad (${path})`,
  });
  return { path };
});

// Etapp 49a: automatiserad radering vid avetablering, med ett fönster där leverantören ELLER
// kundens egen superadmin kan ångra – ägarbeslut 2026-08-06 (se ETAPPLAN10.md, OPPNA-PUNKTER.md
// innan dess). Beslutat mönster: kundens superadmin begär radering själv i appen (inte bara
// leverantören via konsolen som första utkastet föreslog), men den utförs INTE direkt – en
// väntetid ger tid att upptäcka och stoppa ett misstag eller en obehörig begäran (t.ex. en
// avskedad anställd som hann vara superadmin). Krav 17 (ETAPPLAN10.md): dubbel bekräftelse
// (skriv organisationens namn + en explicit "Ja"-dialog i UI:t) och en loggad anledning INNAN
// körningen, inte efter.
const RADERING_VANTETID_TIMMAR = 48;

// Etapp 49a: kunden begär radering av sin EGEN organisation. Pausar organisationen omedelbart
// (ingen ny data ska hinna tillkomma under väntetiden) och schemalägger den faktiska
// raderingen. Kan när som helst ångras av kundens egen superadmin ELLER leverantören, se
// avbrytRaderingAvOrganisation nedan.
exports.begarRaderingAvOrganisation = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan begära radering av organisationen.");
  }
  const anledning = (request.data?.anledning ?? "").trim();
  if (!anledning) {
    throw new HttpsError("invalid-argument", "En anledning måste anges.");
  }
  const orgId = uppringare.organisationId;
  const schemalagdTill = new Date(Date.now() + RADERING_VANTETID_TIMMAR * 60 * 60 * 1000);
  await db.collection("organisationer").doc(orgId).set(
    {
      status: "pausad",
      raderingSchemalagdTill: admin.firestore.Timestamp.fromDate(schemalagdTill),
      raderingBegardAv: request.auth.uid,
      raderingAnledning: anledning,
    },
    { merge: true }
  );
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "superadmin",
    handelsetyp: "organisation_radering_begard",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: `Radering begärd, schemalagd till ${schemalagdTill.toISOString()}. Anledning: ${anledning}`,
  });
  // Sentry, inte systemvarningar: en schemalagd radering är tidskritisk (leverantören måste
  // FAKTISKT märka den för att fönstret ska betyda något) och det finns ingen anledning att
  // låta andra kunders superadmins se att DEN HÄR organisationen ska raderas.
  Sentry.captureMessage("Organisation har begärt radering – schemalagd", {
    level: "error",
    tags: { typ: "radering_schemalagd" },
    extra: { orgId, schemalagdTill: schemalagdTill.toISOString(), anledning },
  });
  return { schemalagdTill: schemalagdTill.toISOString() };
});

// Etapp 49a: avbryter en schemalagd radering. Ospärrar INTE organisationen automatiskt (den
// befintliga "Återaktivera"-knappen gör det, medvetet – ett avbrutet raderingsförsök förtjänar
// en egen, uttrycklig granskning av leverantören innan drift återupptas, inte en tyst
// återgång). Tillåten för BÅDE kundens egen superadmin (ångra sitt eget misstag) och
// leverantören (upptäcka och stoppa en obehörig begäran).
exports.avbrytRaderingAvOrganisation = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  const arPlattformsadminUppringare = await arPlattformsadminServer(request.auth.uid);
  let orgId = request.data?.orgId;
  if (arPlattformsadminUppringare) {
    if (!orgId || typeof orgId !== "string") {
      throw new HttpsError("invalid-argument", "orgId krävs för en leverantörsadmin.");
    }
  } else if (uppringare.roll === "superadmin") {
    orgId = uppringare.organisationId;
  } else {
    throw new HttpsError("permission-denied", "Endast superadmin eller leverantörsadmin kan avbryta en radering.");
  }
  const orgRef = db.collection("organisationer").doc(orgId);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists || !orgSnap.data().raderingSchemalagdTill) {
    throw new HttpsError("failed-precondition", "Det finns ingen schemalagd radering att avbryta.");
  }
  await orgRef.update({
    raderingSchemalagdTill: admin.firestore.FieldValue.delete(),
    raderingBegardAv: admin.firestore.FieldValue.delete(),
    raderingAnledning: admin.firestore.FieldValue.delete(),
  });
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: arPlattformsadminUppringare ? "plattformsadmin" : "superadmin",
    handelsetyp: "organisation_radering_avbruten",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: "Schemalagd radering avbruten",
  });
  return { ok: true };
});

// Etapp 50b: tillfällig, kundinitierad supportåtkomst – ägarbeslut 2026-08-09 (alternativ A,
// se BESLUTSLOGG.md): kundens EGEN superadmin beviljar leverantören läsrätt till organisationens
// innehåll i ett begränsat fönster (6 timmar), med en obligatorisk anledning. Till skillnad
// från 50a (som bara visar antal/metadata) ger detta fönster leverantören RIKTIG läsåtkomst
// till innehållet i firestore.rules (se farSupportlasa() där) – därför krävs en anledning och
// full loggning i båda ändar, och fönstret upphör automatiskt (request.time-jämförelsen i
// regeln, ingen serverstädning krävs).
const SUPPORTATKOMST_FONSTER_TIMMAR = 6;

exports.beviljaSupportAtkomst = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan bevilja supportåtkomst.");
  }
  const anledning = (request.data?.anledning ?? "").trim();
  if (!anledning) {
    throw new HttpsError("invalid-argument", "En anledning måste anges.");
  }
  const orgId = uppringare.organisationId;
  const till = new Date(Date.now() + SUPPORTATKOMST_FONSTER_TIMMAR * 60 * 60 * 1000);
  await db.collection("organisationer").doc(orgId).set(
    {
      supportAtkomstTill: admin.firestore.Timestamp.fromDate(till),
      supportAtkomstBeviljadAv: request.auth.uid,
      supportAtkomstAnledning: anledning,
    },
    { merge: true }
  );
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "superadmin",
    handelsetyp: "support_atkomst_beviljad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: `Supportåtkomst beviljad till ${till.toISOString()}. Anledning: ${anledning}`,
  });
  return { till: till.toISOString() };
});

exports.avslutaSupportAtkomst = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  const arPlattformsadminUppringare = await arPlattformsadminServer(request.auth.uid);
  let orgId = request.data?.orgId;
  if (arPlattformsadminUppringare) {
    if (!orgId || typeof orgId !== "string") {
      throw new HttpsError("invalid-argument", "orgId krävs för en leverantörsadmin.");
    }
  } else if (uppringare.roll === "superadmin") {
    orgId = uppringare.organisationId;
  } else {
    throw new HttpsError("permission-denied", "Endast superadmin eller leverantörsadmin kan avsluta supportåtkomst.");
  }
  const orgRef = db.collection("organisationer").doc(orgId);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists || !orgSnap.data().supportAtkomstTill) {
    throw new HttpsError("failed-precondition", "Det finns ingen aktiv supportåtkomst att avsluta.");
  }
  await orgRef.update({
    supportAtkomstTill: admin.firestore.FieldValue.delete(),
    supportAtkomstBeviljadAv: admin.firestore.FieldValue.delete(),
    supportAtkomstAnledning: admin.firestore.FieldValue.delete(),
  });
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: arPlattformsadminUppringare ? "plattformsadmin" : "superadmin",
    handelsetyp: "support_atkomst_avslutad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: "Supportåtkomst avslutad i förtid",
  });
  return { ok: true };
});

// Etapp 49a: den faktiska, irreversibla raderingen – körs ENDAST av
// utforSchemalagdRaderingSchemalagt nedan efter att väntetiden gått ut, aldrig direkt av en
// callable. Ordning, av en anledning:
//   1. En sista säkerhetskopia (samma backupaOrganisation() som redan täcker alla 13
//      collections + underkollektionen + revisionsloggHuvud sedan Etapp 49d) – om något går
//      fel i stegen nedan, eller om kunden ändå ångrar sig efter att fönstret stängt, finns
//      ändå en färsk kopia kvar (backups/{orgId}/... gallras som vanligt efter 90 dagar,
//      beslutat 2026-08-06 som ett medvetet extra skyddsnät utöver 48-timmarsfönstret).
//   2. Uppladdade filer knutna till rutiner/förrådsartiklar (Storage-sökvägarna är INTE
//      organisationsskopade i sig, se storage.rules – kräver en uppslagskarta, samma mönster
//      som manadsrapportOrganisationer() redan använder för att fördela lagringsvolym).
//   3. Organisationens användare: Firebase Auth-kontot, profilbild, råfoton och users/{uid}.
//   4. Firestore-dokumenten (samma lista som backupaOrganisation), i batchar.
//   5. organisationer/{orgId} skrivs INTE bort helt – ersätts med en minimal "gravsten" så att
//      leverantörsvyn kan visa att organisationen fanns och raderades, utan att någon av dess
//      egna data blir kvar. revisionslogg/revisionsloggHuvud rörs ALDRIG – organisationens
//      historik över vad som hänt (inklusive raderingen själv) ska överleva raderingen.
async function raderaOrganisationensData(orgId) {
  await loggaRevision({
    organisationId: orgId,
    aktorUid: "_system",
    aktorRoll: "system",
    handelsetyp: "organisation_permanent_radering_paborjad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: "Permanent radering påbörjad efter utgången väntetid",
  });

  await backupaOrganisation(orgId);

  const [rutinerSnap, artiklarSnap, anvandareSnap] = await Promise.all([
    db.collection("rutiner").where("organisationId", "==", orgId).select().get(),
    db.collection("forradsartiklar").where("organisationId", "==", orgId).select().get(),
    db.collection("users").where("organisationId", "==", orgId).select().get(),
  ]);
  const rutinIds = new Set(rutinerSnap.docs.map((d) => d.id));
  const artikelIds = new Set(artiklarSnap.docs.map((d) => d.id));
  const uids = anvandareSnap.docs.map((d) => d.id);

  // Samma "ägar-id sitter på path-index 2"-mönster som manadsrapportOrganisationer() – filerna
  // är inte organisationsskopade i sökvägen, bara via det ägande dokumentets organisationId.
  const [rutinFiler, artikelFiler] = await Promise.all([
    bucket.getFiles({ prefix: "rutiner/" }),
    bucket.getFiles({ prefix: "forradsartiklar/" }),
  ]);
  const filerAttRadera = [
    ...rutinFiler[0].filter((f) => rutinIds.has(f.name.split("/")[2])),
    ...artikelFiler[0].filter((f) => artikelIds.has(f.name.split("/")[2])),
  ];
  await Promise.all(filerAttRadera.map((f) => f.delete().catch(() => {})));
  await bucket.deleteFiles({ prefix: `organisationer/${orgId}/logotyp/`, force: true }).catch(() => {});

  for (const uid of uids) {
    await bucket.deleteFiles({ prefix: `avatarer/${uid}/`, force: true }).catch(() => {});
    await bucket.deleteFiles({ prefix: `inkommande/${uid}/`, force: true }).catch(() => {});
    await admin.auth().deleteUser(uid).catch(() => {});
  }

  let antalRaderadeDokument = 0;
  // revisionslogg ingår i BACKUP_COLLECTIONS (för export/backup, Etapp 49d) men ska ALDRIG
  // raderas här – se kommentaren ovanför funktionen: organisationens historik, inklusive den
  // här raderingen själv, ska överleva raderingen.
  const allaSamlingar = [
    ...BACKUP_COLLECTIONS.filter((namn) => namn !== "revisionslogg"),
    ...BACKUP_SUBCOLLECTIONS.map((n) => ({ underkollektion: n })),
  ];
  for (const post of allaSamlingar) {
    const ar = typeof post === "string";
    const snap = ar
      ? await db.collection(post).where("organisationId", "==", orgId).get()
      : await db.collection("organisationer").doc(orgId).collection(post.underkollektion).get();
    const BATCHSTORLEK = 400;
    for (let i = 0; i < snap.docs.length; i += BATCHSTORLEK) {
      const batch = db.batch();
      for (const dok of snap.docs.slice(i, i + BATCHSTORLEK)) {
        batch.delete(dok.ref);
        antalRaderadeDokument += 1;
      }
      await batch.commit();
    }
  }
  for (const uid of uids) {
    await db.collection("users").doc(uid).delete().catch(() => {});
  }

  const orgSnap = await db.collection("organisationer").doc(orgId).get();
  const namn = orgSnap.data()?.namn ?? orgId;
  // Ett fullständigt (icke-merge) set() skriver över HELA dokumentet, så de gamla
  // raderingSchemalagdTill/raderingBegardAv/raderingAnledning-fälten försvinner redan av det
  // – FieldValue.delete() är bara giltigt i update()/merge-set(), inte här.
  await db.collection("organisationer").doc(orgId).set({
    namn,
    status: "raderad",
    avtalsstatus: "avslutad",
    moduler: {},
    raderadTidpunkt: admin.firestore.FieldValue.serverTimestamp(),
    provperiodSlut: null,
  });

  await loggaRevision({
    organisationId: orgId,
    aktorUid: "_system",
    aktorRoll: "system",
    handelsetyp: "organisation_permanent_raderad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: `Permanent radering slutförd: ${antalRaderadeDokument} dokument, ${uids.length} användarkonton`,
  });
  Sentry.captureMessage("Organisation permanent raderad", {
    level: "warning",
    tags: { typ: "radering_slutford" },
    extra: { orgId, antalRaderadeDokument, antalAnvandare: uids.length },
  });
  return { antalRaderadeDokument, antalAnvandare: uids.length };
}
// Exporterad enbart för tests/functions/radering.test.cjs.
exports.raderaOrganisationensData = raderaOrganisationensData;

exports.utforSchemalagdRaderingSchemalagt = onSchedule(
  { schedule: "every 60 minutes", timeZone: "Europe/Stockholm", region: "europe-west1", timeoutSeconds: 540 },
  async () => {
    const nu = admin.firestore.Timestamp.now();
    const snap = await db.collection("organisationer").where("raderingSchemalagdTill", "<=", nu).get();
    for (const orgDoc of snap.docs) {
      try {
        await raderaOrganisationensData(orgDoc.id);
      } catch (fel) {
        console.error(`Schemalagd radering misslyckades för organisation ${orgDoc.id}:`, fel);
        Sentry.captureException(fel);
      }
    }
  }
);
