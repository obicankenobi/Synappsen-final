// Etapp 18c: "Fortsätt där du var" – lokalt, INTE i molnet (ingen synk, ingen patientkoppling
// någonstans i det här flödet). Nyckeln inkluderar uid så två personer som delar en enhet
// inte råkar fortsätta varandras körning.
function nyckel(uid, rutinId) {
  return `synappsen_checklista_${uid}_${rutinId}`;
}

export function lasFramsteg(uid, rutinId) {
  try {
    const rad = localStorage.getItem(nyckel(uid, rutinId));
    return rad ? JSON.parse(rad) : null;
  } catch {
    return null;
  }
}

export function sparaFramsteg(uid, rutinId, stegIndex, startTid) {
  try {
    localStorage.setItem(nyckel(uid, rutinId), JSON.stringify({ stegIndex, startTid }));
  } catch {
    // localStorage kan vara fullt/blockerat – fungerar utan, bara utan "fortsätt där du var"
  }
}

export function rensaFramsteg(uid, rutinId) {
  try {
    localStorage.removeItem(nyckel(uid, rutinId));
  } catch {
    // se ovan
  }
}
