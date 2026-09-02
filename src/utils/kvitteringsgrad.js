// Etapp 72d: kvitteringsläge per rutin, för tillsyns- och revisionspaketet. Ren funktion
// över redan laddad data (samma mönster som src/utils/innehallshalsa.js och den
// serverside-motsvarande kvitteringsgradServer i functions/matvarden.js, som räknar ett
// ORGANISATIONSGENOMSNITT över flera rutiner) – den här varianten räknar PER RUTIN istället,
// vilket är vad ett tillsynspaket behöver kunna visa: "rutin X är läst av 80 % av personalen,
// rutin Y bara 20 %", inte bara ett totalgenomsnitt.
export function kvitteringsgradForRutin(rutin, antalAnvandare) {
  if (!antalAnvandare || antalAnvandare <= 0) return null;
  const antalKvitterat = Array.isArray(rutin?.lasteAv) ? rutin.lasteAv.length : 0;
  return Math.round((Math.min(antalKvitterat, antalAnvandare) / antalAnvandare) * 100);
}

// Kvitteringsläge för en lista rutiner, en post per rutin – sorterad fallande på titel för
// stabil, förutsägbar exportordning (samma princip som andra exporter i appen: samma indata
// ska alltid ge samma utdata, oavsett i vilken ordning Firestore råkade returnera dokumenten).
export function kvitteringsgradPerRutin(rutiner, antalAnvandare) {
  return [...(rutiner ?? [])]
    .map((r) => ({
      id: r.id,
      titel: r.titel,
      omrade: r.omrade,
      antalKvitterat: Array.isArray(r.lasteAv) ? r.lasteAv.length : 0,
      antalTotalt: antalAnvandare,
      andel: kvitteringsgradForRutin(r, antalAnvandare),
    }))
    .sort((a, b) => (a.titel ?? "").localeCompare(b.titel ?? "", "sv"));
}
