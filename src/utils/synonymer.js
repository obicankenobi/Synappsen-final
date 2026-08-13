// Etapp 65c: expanderar en posts nyckelordslista med synonymer – för varje synonymgrupp där
// NÅGOT ord i gruppen förekommer i innehållet, läggs HELA gruppens övriga ord till som
// sökbara nyckelord. Ren indexeringstidsberäkning, ingen Firestore-fråga, ingen mutation av
// argumenten.
import { SYNONYMGRUPPER } from "../data/synonymer";

export function expanderaNyckelord(nyckelord, innehall) {
  const text = (innehall ?? "").toLowerCase();
  if (!text) return nyckelord;

  const tillagda = new Set();
  for (const grupp of SYNONYMGRUPPER) {
    const forekommer = grupp.some((ord) => text.includes(ord));
    if (!forekommer) continue;
    for (const ord of grupp) {
      tillagda.add(ord);
    }
  }
  if (tillagda.size === 0) return nyckelord;

  const befintliga = new Set((nyckelord ?? []).map((ord) => String(ord).toLowerCase()));
  const nya = [...tillagda].filter((ord) => !befintliga.has(ord));
  return [...(nyckelord ?? []), ...nya];
}
