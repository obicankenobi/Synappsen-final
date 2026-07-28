// UI-designjustering (2026-07): domän-/statusinfo delad mellan Badge.jsx (komponenterna) och
// vanliga anropsställen som bara behöver slå upp en nyckel utifrån en visningsetikett
// (SokFalt.jsx/KommandopalettInnehall.jsx). Egen fil, inte i Badge.jsx, eftersom
// react-refresh/only-export-components kräver att en komponentfil BARA exporterar
// komponenter.
export const DOMAN_INFO = {
  "kliniskt-stod": { etikett: "Kliniskt stöd", css: "badge--doman-kliniskt-stod" },
  logistik: { etikett: "Logistik", css: "badge--doman-logistik" },
  administration: { etikett: "Administration", css: "badge--doman-administration" },
};

export const STATUS_INFO = {
  vantar: { etikett: "Väntar på godkännande", ikon: "⏳", css: "badge--status-vantar" },
  godkand: { etikett: "Godkänd", ikon: "✓", css: "badge--status-godkand" },
  avvisad: { etikett: "Avvisad", ikon: "✕", css: "badge--status-avvisad" },
};

// Slår upp domännyckeln för en visningsetikett (t.ex. "Kliniskt stöd" → "kliniskt-stod"), så
// befintliga textkategorier (useSokindex.js:s `kategori`-fält) kan badgas om utan att
// datamodellen där behöver ändras.
export function domanNyckelForEtikett(etikett) {
  const funnen = Object.entries(DOMAN_INFO).find(([, v]) => v.etikett === etikett);
  return funnen?.[0] ?? null;
}
