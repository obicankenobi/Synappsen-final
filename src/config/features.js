// Etapp 2 (feature-gating): central definition av vilka funktioner som hör till vilken
// modul. Enda källan till sanning – UI, klienthookar och Cloud Functions ska alla referera
// hit istället för att sprida strängar/moduler-namn på flera ställen.
export const FEATURE = {
  OFFLINE_CENTER: "offlineCenter",
  OWNER_REMINDERS: "ownerReminders",
  HEALTH_HISTORY: "healthHistory",
  EXPORT_BACKUP: "exportBackup",
  KIOSK_MODE: "kioskMode",
  AI_IMPORT: "aiImport",
  AI_ANALYTICS: "aiAnalytics",
  CLINICAL_SUPPORT: "clinicalSupport",
};

// Modulnamnen matchar fälten i organisationer/{orgId}.moduler (se functions/index.js
// migreraTillOrganisation och firestore.rules). Core har inga gatade funktioner – allt i
// Core är alltid tillgängligt oavsett moduler.
export const PACKAGE_FEATURES = {
  operations: [
    FEATURE.OFFLINE_CENTER,
    FEATURE.OWNER_REMINDERS,
    FEATURE.HEALTH_HISTORY,
    FEATURE.EXPORT_BACKUP,
    FEATURE.KIOSK_MODE,
  ],
  intelligence: [FEATURE.AI_IMPORT, FEATURE.AI_ANALYTICS, FEATURE.CLINICAL_SUPPORT],
};

// Härleder vilka FEATURE-nycklar en organisation har tillgång till utifrån dess
// moduler-fält, t.ex. { operations: true, intelligence: false }.
export function aktivaFeatures(moduler) {
  const aktiva = new Set();
  for (const [modul, paslagen] of Object.entries(moduler ?? {})) {
    if (paslagen && PACKAGE_FEATURES[modul]) {
      for (const feature of PACKAGE_FEATURES[modul]) {
        aktiva.add(feature);
      }
    }
  }
  return aktiva;
}
