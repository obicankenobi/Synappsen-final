// Etapp L1d (beslutspunkt 3, avgjord 2026-08-30: egen inline-SVG, inget diagrambibliotek).
// Ren funktion – tar en lista tal (eller null för saknade veckor) och räknar ut en SVG-path
// för en enkel sparkline. Ingen rendering här, bara geometrin, så den går att testa utan DOM.
export function genereraSparklinePath(varden, { bredd = 200, hojd = 40, marginal = 4 } = {}) {
  const punkterMedIndex = varden.map((v, i) => ({ v, i })).filter((p) => typeof p.v === "number");
  if (punkterMedIndex.length === 0) return null;

  const min = Math.min(...punkterMedIndex.map((p) => p.v));
  const max = Math.max(...punkterMedIndex.map((p) => p.v));
  // En konstant serie (min === max) skulle annars ge division med noll – ritas som en rak
  // linje i mitten i stället för att krascha eller försvinna.
  const spann = max - min || 1;
  const stegX = varden.length > 1 ? (bredd - 2 * marginal) / (varden.length - 1) : 0;

  const segment = punkterMedIndex
    .map(({ v, i }) => {
      const x = marginal + i * stegX;
      const y = hojd - marginal - ((v - min) / spann) * (hojd - 2 * marginal);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" L");

  return `M${segment}`;
}
