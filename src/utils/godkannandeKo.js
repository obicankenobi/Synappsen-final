// Etapp 42b: den samlade, domänöverskridande godkännandekön. Ren sammanställningsfunktion
// utan sidoeffekter – bygger EN lista av "väntande" poster ur redan hämtade rutiner/
// förrådsartiklar/ändringsförslag, så att den kan testas isolerat och återanvändas av både
// Godkannanden.jsx (hela listan) och en framtida badge-räknare (bara antalet).
export function byggGodkannandeKo({ rutinerPerOmrade = {}, artiklar = [], forslagPerOmrade = {}, behorighet = {} }) {
  const utkast = [];
  for (const [omrade, rutiner] of Object.entries(rutinerPerOmrade)) {
    if (!behorighet[omrade]) continue;
    for (const rutin of rutiner) {
      if (rutin.status === "utkast") {
        utkast.push({ typ: "rutin", omrade, id: rutin.id, titel: rutin.titel, innehall: rutin.innehall, agare: rutin.agare, taggar: rutin.taggar, skapad: rutin.skapad });
      }
    }
  }
  if (behorighet.logistik) {
    for (const artikel of artiklar) {
      if (artikel.status === "utkast") {
        utkast.push({ typ: "forradsartikel", omrade: "logistik", id: artikel.id, titel: artikel.namn, skapad: artikel.skapad });
      }
    }
  }

  const forslag = [];
  for (const [omrade, poster] of Object.entries(forslagPerOmrade)) {
    if (!behorighet[omrade]) continue;
    for (const post of poster) {
      if (post.status === "ny") {
        // Etapp 26c: samma "anonym kollega om avstängt"-princip som redan gäller i
        // ForslagSektion.jsx – visaNamnOffentligt respekteras här också, inte bara publikt.
        forslag.push({
          typ: "forslag",
          omrade,
          id: post.id,
          rutinId: post.rutinId,
          titel: post.rutinTitel,
          forslag: post.forslag,
          foreslagenAvNamn: post.visaNamnOffentligt !== false ? post.foreslagenAvNamn : null,
          tidpunkt: post.tidpunkt,
        });
      }
    }
  }

  return { utkast, forslag, antal: utkast.length + forslag.length };
}
