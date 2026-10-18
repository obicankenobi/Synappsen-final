// Deterministiska kontroller för ai-evaluering.cjs (fynd 4, AI-INTEGRATIONSRISKER-2026-09-06).
// Utbrutna så att de kan testas utan modellanrop (tests/functions/aikontroller.test.cjs):
// en kontroll som aldrig bevisats kunna FÄLLA något säger ingenting när den rapporterar OK.

// Mängd + enhet, t.ex. "10 ml", "0,5 mg", "5 minuter". Tid ingår medvetet: "under 10 minuter"
// är lika uppfunnet som en dos om källtexten inte säger det.
const ENHETER =
  "mg\\/kg|mikrogram|µg|mcg|mmol|mg|ml|mL|dl|liter|IE|enheter|E|g|%|sekunder|minuter|min|timmar|tim|dygn|dagar";
const MANGD_ENHET = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(${ENHETER})(?![\\p{L}])`, "giu");

function normalisera(token) {
  return token.replace(",", ".").replace(/\s+/g, " ").trim().toLowerCase();
}

// Alla "tal + enhet" i en text, normaliserade (decimalkomma → punkt, enhet i gemener).
function mangdUttryck(text) {
  const funna = new Set();
  for (const m of `${text ?? ""}`.matchAll(MANGD_ENHET)) {
    funna.add(normalisera(`${m[1]} ${m[2]}`));
  }
  return funna;
}

// Uttryck i `svar` som INTE förekommer i `kalla` – dvs. doser/tider modellen lagt till.
function uppfunnaMangder(svar, kalla) {
  const iKalla = mangdUttryck(kalla);
  return [...mangdUttryck(svar)].filter((m) => !iKalla.has(m));
}

// Kvissfrågans facit är det som bär auktoritet: rätt alternativ + hänvisning måste hålla sig
// till källan. Felaktiga alternativ FÅR avvika – en distraktor är per definition fel.
function kvissProblem(fraga, kalla) {
  const problem = [];
  const alt = Array.isArray(fraga.alternativ) ? fraga.alternativ : [];
  if (alt.length < 2) problem.push("färre än två svarsalternativ");
  if (!Number.isInteger(fraga.rattIndex) || fraga.rattIndex < 0 || fraga.rattIndex >= alt.length) {
    problem.push(`rattIndex (${fraga.rattIndex}) pekar utanför alternativen`);
  }
  const facit = alt[fraga.rattIndex] ?? "";
  const uppfunna = uppfunnaMangder(`${facit} ${fraga.hanvisning ?? ""}`, kalla);
  if (uppfunna.length > 0) problem.push(`facit/hänvisning innehåller mängd som inte står i källtexten: ${uppfunna.join(", ")}`);
  return problem;
}

module.exports = { mangdUttryck, uppfunnaMangder, kvissProblem };
