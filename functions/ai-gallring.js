// Fynd 3 och 7 (granskningar/AI-INTEGRATIONSRISKER-2026-09-06.md): gallring av den data
// AI-vägarna själva producerar. Samma mönster som backup.js:s gallraGamlaBackuper().
//
// Tidigare raderades ingenting alls: klinikfragecache hade en 7-dagars LÄS-TTL (ett gammalt
// svar ignorerades, men dokumentet låg kvar för alltid) och klinikfrageloggar hade ingen
// gräns. Ett obegränsat växande arkiv över vad personal frågar om, utan ett fattat beslut om
// hur länge det behövs, är precis vad en DPIA ska ha en uttrycklig retentionssiffra för.
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { Timestamp } = require("firebase-admin/firestore");
const { db } = require("./gemensamt");

const DAG_MS = 24 * 60 * 60 * 1000;

// Frågeloggen och anropsloggen behövs för att se kunskapsluckor respektive för att kunna
// utreda en misstänkt incident – båda ändamålen är kortlivade. 90 dagar matchar
// backupretentionen (BACKUP_RETENTION_DAGAR), så att alla tre har samma horisont.
const KLINIKFRAGELOGG_RETENTION_DAGAR = 90;
const AI_ANROPSLOGG_RETENTION_DAGAR = 90;
// Cachen får inte leva längre än den kan användas: samma 7 dagar som läs-TTL:en i
// fragaKlinisktStod (CACHE_TTL_MS). Ändra båda tillsammans.
const KLINIKFRAGECACHE_RETENTION_DAGAR = 7;

const BATCH_STORLEK = 400; // under Firestores gräns på 500 skrivningar per batch

async function raderaAldreAn(collection, faltNamn, dagar) {
  const grans = Timestamp.fromMillis(Date.now() - dagar * DAG_MS);
  let antal = 0;
  for (;;) {
    const snap = await db.collection(collection).where(faltNamn, "<", grans).limit(BATCH_STORLEK).get();
    if (snap.empty) return antal;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    antal += snap.size;
    if (snap.size < BATCH_STORLEK) return antal;
  }
}

async function gallraAiData() {
  return {
    klinikfrageloggar: await raderaAldreAn("klinikfrageloggar", "tidpunkt", KLINIKFRAGELOGG_RETENTION_DAGAR),
    klinikfragecache: await raderaAldreAn("klinikfragecache", "skapad", KLINIKFRAGECACHE_RETENTION_DAGAR),
    aiAnropslogg: await raderaAldreAn("aiAnropslogg", "tidpunkt", AI_ANROPSLOGG_RETENTION_DAGAR),
  };
}
// Exporterad enbart för tests/functions/ai-gallring.test.cjs.
exports.gallraAiData = gallraAiData;

exports.aiGallringSchemalagt = onSchedule(
  { schedule: "every monday 03:45", timeZone: "Europe/Stockholm", region: "europe-west1", timeoutSeconds: 300 },
  async () => {
    try {
      const antal = await gallraAiData();
      const totalt = Object.values(antal).reduce((a, b) => a + b, 0);
      if (totalt > 0) console.log("AI-datagallring:", JSON.stringify(antal));
    } catch (fel) {
      console.error("AI-datagallring misslyckades:", fel);
    }
  }
);
