// UI-designjustering (2026-07): ETT datumformat genomgående för "rent datum, inget
// klockslag"-visningar (t.ex. "Godkänd ... 24 juli 2026"), oavsett skärmstorlek – RutinKort.jsx,
// AnslagKort.jsx och Feedback.jsx använde redan identiskt `dateStyle: "medium"` var för sig;
// samlat hit så det bara finns EN plats att ändra formatet på. Gäller INTE datum+klockslag för
// logg-/revisionsvyer (adminHjalp.js m.fl.) – det är ett annat, avsiktligt mer detaljerat
// behov, inte samma typ av visning.
export function formateraDatum(tidpunkt) {
  const datum = tidpunkt?.toDate ? tidpunkt.toDate() : tidpunkt instanceof Date ? tidpunkt : null;
  if (!datum) return "";
  return datum.toLocaleDateString("sv-SE", { dateStyle: "medium" });
}
