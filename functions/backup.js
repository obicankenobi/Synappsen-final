// backup.js – del av Synappsen Cloud Functions.
//
// Etapp 61a (ETAPPLAN12.md): functions/index.js hade vuxit till ~4700 rader och ~93
// exports i EN fil. Den är nu uppdelad per domän – samma kod, samma exports, samma
// beteende – och index.js är bara en tunn åter-exporterande skarv (så både
// firebase deploy och tests/functions/*.test.cjs fungerar oförändrat).
//
// Den här filen: backup, gallring och återställning av en organisations data
// (Etapp 3b/33a/33c/49d).

const { onSchedule } = require("firebase-functions/v2/scheduler");
const {
  admin,
  db,
  bucket,
  onCall,
  HttpsError,
  loggaRevision,
  kravPlattformsadmin,
} = require("./gemensamt");

// Etapp 3b (Operations): veckovis backup av kärncollections till Storage, per organisation.
// Endast för organisationer med Operations-modulen påslagen (samma modul som EXPORT_BACKUP-
// featuren i src/config/features.js hör till). Skriver EN json-fil per organisation och
// körning till backups/{orgId}/{datum}.json (se storage.rules – helt stängd för klienter,
// bara läsbar via Cloud Console/gsutil av den som har tillgång till projektet).
//
// Etapp 49d: samma funktion används av BÅDE den schemalagda katastrofbackupen OCH knappen
// "Exportera" i leverantörsvyn (GDPR-liknande dataportabilitet) – exporteraOrganisation
// nedan är bara en tunn wrapper runt den här. Utökad från 7 till 12 collections + en
// underkollektion + en särskild post, efter en premisskontroll som visade att hälften av
// appens org-skopade data saknades helt. `systemstatus` läggs MEDVETET INTE till – den
// collectionen är delad plattforminfrastruktur (Etapp 46/48b) utan organisationId-fält
// överhuvudtaget, inte orgdata; en where("organisationId","==",orgId)-fråga mot den skulle
// bara ge ett tomt, missvisande resultat.
const BACKUP_COLLECTIONS = [
  "rutiner",
  "anslag",
  "kontakter",
  "lankbibliotek",
  "forradsartiklar",
  "skiftrapporter",
  "kommentarer",
  "checklistkorningar",
  "bristanmalningar",
  "introduktionsspar",
  "introduktionstilldelningar",
  "kompetenskrav",
  "revisionslogg",
];

// Etapp 49d: matvardenSnapshots är INTE en toppnivå-collection som de ovan – den ligger som
// en underkollektion på organisationer/{orgId}/matvardenSnapshots/{datum} (se
// skapaMatvardenSnapshot), utan eget organisationId-fält (skopningen är redan implicit i
// sökvägen). Kräver därför en egen fråga/skrivväg, inte den generiska where()-loopen ovan.
const BACKUP_SUBCOLLECTIONS = ["matvardenSnapshots"];

async function backupaOrganisation(orgId) {
  const samlingar = {};
  for (const namn of BACKUP_COLLECTIONS) {
    const snap = await db.collection(namn).where("organisationId", "==", orgId).get();
    samlingar[namn] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  for (const namn of BACKUP_SUBCOLLECTIONS) {
    const snap = await db.collection("organisationer").doc(orgId).collection(namn).get();
    samlingar[namn] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  // Etapp 49d: revisionsloggHuvud/{orgId} är EN post per organisation, nyckeln ÄR orgId –
  // ingen where()-fråga, bara en direkt läsning. Behövs för att revisionsloggens hashkedja
  // ska kunna fortsätta korrekt efter en återställning (se loggaRevision, som läser
  // senasteHash härifrån för nästa post) – utan den skulle kedjan se intakt ut bakåt men
  // knäckas framåt av nästa händelse som loggas efter en återställning.
  const huvudSnap = await db.collection("revisionsloggHuvud").doc(orgId).get();
  samlingar.revisionsloggHuvud = huvudSnap.exists ? [{ id: orgId, ...huvudSnap.data() }] : [];

  const datum = new Date().toISOString().slice(0, 10);
  const path = `backups/${orgId}/${datum}.json`;
  await bucket.file(path).save(JSON.stringify({ orgId, datum, samlingar }, null, 2), {
    contentType: "application/json",
  });
  return path;
}

exports.veckovisBackupSchemalagt = onSchedule(
  { schedule: "every monday 03:00", timeZone: "Europe/Stockholm", region: "europe-west1", timeoutSeconds: 300 },
  async () => {
    const orgSnap = await db.collection("organisationer").get();
    for (const orgDoc of orgSnap.docs) {
      if (orgDoc.data()?.moduler?.operations !== true) continue;
      try {
        await backupaOrganisation(orgDoc.id);
      } catch (fel) {
        console.error(`Backup misslyckades för organisation ${orgDoc.id}:`, fel);
      }
    }
  }
);
// Exporterad enbart för tests/functions/backup.test.cjs.
exports.backupaOrganisation = backupaOrganisation;

// Etapp 33c: gallring av backuper äldre än retentionstiden. Ägarbeslut 2026-08-01 (se
// ETAPPLAN5.md Etapp 33c, avtal/PUB-AVTAL-MALL.md p. 6): 90 dagar. Filnamnet självt bär
// datumet (backups/{orgId}/{ÅÅÅÅ-MM-DD}.json, satt av backupaOrganisation ovan) – vi litar
// på det snarare än filens skapelsemetadata, eftersom en återställd/kopierad fil ändå ska
// räknas efter sitt ANGIVNA backup-datum, inte efter när den råkade hamna i bucketen.
const BACKUP_RETENTION_DAGAR = 90;

async function gallraGamlaBackuper() {
  const [filer] = await bucket.getFiles({ prefix: "backups/" });
  const grans = Date.now() - BACKUP_RETENTION_DAGAR * 24 * 60 * 60 * 1000;
  let antalRaderade = 0;
  for (const fil of filer) {
    // Sökvägsformen är backups/{orgId}/{ÅÅÅÅ-MM-DD}.json.
    const matchning = fil.name.match(/^backups\/[^/]+\/(\d{4}-\d{2}-\d{2})\.json$/);
    if (!matchning) continue;
    const filDatum = new Date(`${matchning[1]}T00:00:00Z`).getTime();
    if (Number.isNaN(filDatum) || filDatum >= grans) continue;
    await fil.delete();
    antalRaderade++;
  }
  return antalRaderade;
}
// Exporterad enbart för tests/functions/backup-gallring.test.cjs.
exports.gallraGamlaBackuper = gallraGamlaBackuper;

exports.backupGallringSchemalagt = onSchedule(
  { schedule: "every monday 03:30", timeZone: "Europe/Stockholm", region: "europe-west1", timeoutSeconds: 300 },
  async () => {
    try {
      const antal = await gallraGamlaBackuper();
      if (antal > 0) console.log(`Backupgallring: raderade ${antal} backup(er) äldre än ${BACKUP_RETENTION_DAGAR} dagar.`);
    } catch (fel) {
      console.error("Backupgallring misslyckades:", fel);
    }
  }
);

// Etapp 33a: motstycket till backupaOrganisation() – fanns inte alls tidigare (verifierat).
// En backup som aldrig kan läsas tillbaka är en förhoppning, inte ett skydd.
//
// JSON.stringify skriver en Firestore Timestamp som { _seconds, _nanoseconds } (dess enda
// egna, uppräkningsbara fält – inget eget toJSON). Utan att bygga om det till en riktig
// Timestamp här skulle en återställd rutins "skapad"-fält bli en vanlig map, inte ett
// tidsstämpelfält frågor som orderBy("skapad") kan sortera på.
function ateruppbyggTidsstamplar(varde) {
  if (Array.isArray(varde)) return varde.map(ateruppbyggTidsstamplar);
  if (varde && typeof varde === "object") {
    const nycklar = Object.keys(varde);
    if (
      nycklar.length === 2 &&
      typeof varde._seconds === "number" &&
      typeof varde._nanoseconds === "number"
    ) {
      return new admin.firestore.Timestamp(varde._seconds, varde._nanoseconds);
    }
    const resultat = {};
    for (const [nyckel, delvarde] of Object.entries(varde)) {
      resultat[nyckel] = ateruppbyggTidsstamplar(delvarde);
    }
    return resultat;
  }
  return varde;
}

// Läser en tidigare skriven backupfil och skriver tillbaka innehållet till Firestore för EN
// organisation. Hård gränsdragning (se ETAPPLAN5.md Etapp 33a): enbart plattformsadmin, path
// måste peka på en backup under EXAKT den angivna organisationens egen mapp, och varje
// dokument som skulle höra till en ANNAN organisation hoppas över – en felriktad eller
// manipulerad backupfil kan alltså aldrig skriva över en annan kunds data, oavsett vad filen
// påstår sig innehålla.
async function aterstallOrganisation(orgId, sokvag) {
  if (!sokvag.startsWith(`backups/${orgId}/`)) {
    throw new HttpsError(
      "invalid-argument",
      "Sökvägen måste peka på en backup under den angivna organisationens egen mapp."
    );
  }
  const [buffer] = await bucket.file(sokvag).download();
  const data = JSON.parse(buffer.toString("utf8"));
  if (data.orgId !== orgId) {
    throw new HttpsError(
      "failed-precondition",
      "Backupfilens orgId matchar inte den angivna organisationen."
    );
  }

  let antalAterstallda = 0;
  for (const [samlingsNamn, dokument] of Object.entries(data.samlingar ?? {})) {
    // Etapp 49d: matvardenSnapshots ligger under organisationer/{orgId}/... i Firestore
    // (se BACKUP_SUBCOLLECTIONS/backupaOrganisation ovan) – måste skrivas tillbaka dit, inte
    // till en toppnivå-collection med samma namn (som inte existerar för den datan).
    const samlingsRef = BACKUP_SUBCOLLECTIONS.includes(samlingsNamn)
      ? db.collection("organisationer").doc(orgId).collection(samlingsNamn)
      : db.collection(samlingsNamn);
    const BATCHSTORLEK = 400; // Firestores gräns är 500 skrivningar per batch
    for (let i = 0; i < dokument.length; i += BATCHSTORLEK) {
      const batch = db.batch();
      for (const dok of dokument.slice(i, i + BATCHSTORLEK)) {
        const { id, ...falt } = dok;
        if (falt.organisationId && falt.organisationId !== orgId) continue;
        batch.set(samlingsRef.doc(id), ateruppbyggTidsstamplar(falt));
        antalAterstallda += 1;
      }
      await batch.commit();
    }
  }
  return antalAterstallda;
}
// Exporterad enbart för tests/functions/aterstallning.test.cjs.
exports.aterstallOrganisation = aterstallOrganisation;

exports.aterstallOrganisationCallable = onCall({ region: "europe-west1", timeoutSeconds: 300 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { orgId, sokvag } = request.data ?? {};
  if (!orgId || typeof orgId !== "string" || !sokvag || typeof sokvag !== "string") {
    throw new HttpsError("invalid-argument", "orgId och sokvag krävs.");
  }
  const antalAterstallda = await aterstallOrganisation(orgId, sokvag);
  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_aterstalld",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: `Återställd från backup (${sokvag}), ${antalAterstallda} dokument`,
  });
  return { antalAterstallda };
});

// Etapp 61a: exporteras för de domänfiler som anropar dem över filgränsen
// (se index.js – dessa åter-exporteras INTE därifrån, de var aldrig exports förut).
exports.BACKUP_COLLECTIONS = BACKUP_COLLECTIONS;
exports.BACKUP_SUBCOLLECTIONS = BACKUP_SUBCOLLECTIONS;
