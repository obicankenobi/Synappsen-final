// Säkerhetsgranskning 2026-08-17 (Del 3 – fynd 3.4): avgör om en bildadress faktiskt pekar på
// projektets egen Firebase Storage-bucket.
//
// Bakgrund: bildUrl och bilagor[].url är vanliga Firestore-fält som en redaktör kan sätta till
// vilken adress som helst. externaKallor valideras mot en domänlista server-side
// (arGodkandaKallor i firestore.rules), men bildfälten hade ingen motsvarande spärr – och
// offline-nedladdningen (useOfflineCenter.js) HÄMTAR adressen med cache.add(), så en godtycklig
// extern värd fick ett anrop från varje anställd som laddade ner bilder för offline-bruk.
//
// Bor i src/utils och inte i hooken av samma skäl som farForsokaLasaPlattformsadmin() bor i
// roles.js (Etapp 67a): hookfilen importerar firebase/config, som initierar Auth och kraschar i
// vitests nodmiljö. src/utils är medvetet fritt från Firebase-importer.
export function arStorageUrl(url) {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:") return false;
    // Båda värdnamnen behövs: getDownloadURL() returnerade historiskt
    // firebasestorage.googleapis.com, och returnerar för nyare projekt
    // <bucket>.firebasestorage.app.
    return hostname === "firebasestorage.googleapis.com" || hostname.endsWith(".firebasestorage.app");
  } catch {
    // Tom, relativ eller trasig adress – aldrig "vår".
    return false;
  }
}
