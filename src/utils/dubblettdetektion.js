// Etapp 37c: mekanisk likhetsjämförelse mellan godkända rutiner i SAMMA område, via Fuse.js
// (redan en dependency, se package.json – premisskontroll 2026-08-01). Returnerar par att
// STÄLLA SOM EN FRÅGA till en människa, aldrig ett påstående och aldrig en automatisk
// sammanslagning (krav 15 i ETAPPLAN6.md – en felaktig hopslagning av två vårdrutiner är en
// patientsäkerhetshändelse, inte en städbugg).
import Fuse from "fuse.js";

const STANDARD_MAX_POANG = 0.25;

// Fuse.js score: 0 = perfekt träff, 1 = ingen likhet alls. threshold: 1 här betyder att Fuse
// själv INTE filtrerar bort några kandidater – all filtrering sker explicit nedan mot
// maxPoang, så anroparen kan justera tröskeln utan att bygga om Fuse-instansen.
export function hittaMisstankaDubbletter(rutiner, maxPoang = STANDARD_MAX_POANG) {
  // Etapp 37d: en arkiverad rutin ("gäller inte längre") jämförs inte – ett dubblettpar där
  // ena halvan redan är avskriven är inte en fråga någon behöver ta ställning till.
  const godkanda = rutiner.filter((r) => r.status === "godkand" && r.arkiverad !== true);
  if (godkanda.length < 2) return [];

  const fuse = new Fuse(godkanda, {
    keys: [
      { name: "titel", weight: 0.4 },
      { name: "innehall", weight: 0.6 },
    ],
    includeScore: true,
    threshold: 1,
    ignoreLocation: true,
  });

  // Ett par ska bara rapporteras EN gång, oavsett vilken av de två rutinerna som var
  // "frågan" i Fuse-sökningen – nyckeln är därför de sorterade id:na tillsammans, och det
  // LÄGSTA av de två (asymmetriska) poängen sparas.
  //
  // Sökfrågan är MEDVETET bara titeln, inte titel+innehåll ihopklistrat. Fuse.js:s
  // fuzzy-algoritm (Bitap) jämför en KORT sökfråga mot ett fält – matar man in en lång
  // ihopklistrad text som fråga mot kortare enskilda fält (samma mönster som SokFalt.jsx
  // redan använder Fuse till) blir poängen missvisande höga även för identiska rutiner
  // (uppmätt till ~0.64 för en rutin mot sig själv under utvecklingen av den här funktionen).
  // Innehåll vägs ändå in eftersom `innehall` fortfarande är ett indexerat `keys`-fält, bara
  // inte en del av själva sökfrågan.
  const parPerNyckel = new Map();
  for (const rutin of godkanda) {
    for (const traff of fuse.search(rutin.titel ?? "")) {
      if (traff.item.id === rutin.id) continue;
      if (traff.score === undefined || traff.score > maxPoang) continue;
      const nyckel = [rutin.id, traff.item.id].sort().join("::");
      const befintlig = parPerNyckel.get(nyckel);
      if (!befintlig || traff.score < befintlig.poang) {
        parPerNyckel.set(nyckel, {
          nyckel,
          a: { id: rutin.id, titel: rutin.titel },
          b: { id: traff.item.id, titel: traff.item.titel },
          poang: traff.score,
        });
      }
    }
  }
  return Array.from(parPerNyckel.values()).sort((x, y) => x.poang - y.poang);
}
