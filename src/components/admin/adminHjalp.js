// Delade hjälpfunktioner/konstanter för adminpanel-sektionerna (Etapp 8c – utbruten från den
// tidigare monolitiska Admin.jsx, se UTVECKLINGSLOGG.md).
export function formateraTid(tidpunkt) {
  if (!tidpunkt?.toDate) return "";
  return tidpunkt.toDate().toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

export const OMRADE_NAMN = {
  "kliniskt-stod": "Kliniskt stöd",
  administration: "Administration",
  logistik: "Logistik",
};

// Text skriven för en admin som inte nödvändigtvis är tekniker – "fungerar/långsamt/fungerar
// inte" istället för tekniska termer som "OK/degraderad/fel".
export const STATUS_IKON = { ok: "🟢", degraderad: "🟡", fel: "🔴" };
export const STATUS_TEXT = {
  ok: "Fungerar",
  degraderad: "Fungerar, men långsamt just nu",
  fel: "Fungerar inte",
};
