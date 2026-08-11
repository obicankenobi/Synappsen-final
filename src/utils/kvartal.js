// Etapp 39c: klientmotsvarighet till beraknaKvartal() i functions/matvarden.js – MÅSTE hållas
// i synk med den (avsiktligt duplicerad, inte importerad, se ESM/CommonJS-gränsen i CLAUDE.md).
export function beraknaKvartal(datum = new Date()) {
  const kvartal = Math.floor(datum.getMonth() / 3) + 1;
  return `${datum.getFullYear()}-Q${kvartal}`;
}
