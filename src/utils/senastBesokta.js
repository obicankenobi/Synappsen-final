// Lokal (per enhet, inte per konto) lista över senast besökta rutiner, för en "fortsätt där
// du var"-sektion på startsidan. Kräver ingen backend-ändring – rent klientminne.
const NYCKEL = "synappsen_senast_besokta";
const MAX_ANTAL = 8;

export function lasSenastBesokta() {
  try {
    const rad = localStorage.getItem(NYCKEL);
    return rad ? JSON.parse(rad) : [];
  } catch {
    return [];
  }
}

export function registreraBesok({ id, titel, sokvag }) {
  if (!id || !titel || !sokvag) return;
  try {
    const nuvarande = lasSenastBesokta().filter((p) => p.id !== id);
    const uppdaterad = [{ id, titel, sokvag }, ...nuvarande].slice(0, MAX_ANTAL);
    localStorage.setItem(NYCKEL, JSON.stringify(uppdaterad));
  } catch {
    // localStorage kan vara fullt/blockerat – fungerar utan, bara sämre UX
  }
}
