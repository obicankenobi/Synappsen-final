// Lokal lista över senast besökta rutiner, för en "fortsätt där du var"-sektion på
// startsidan. Kräver ingen backend-ändring – rent klientminne.
//
// Säkerhetsgranskning 2026-08-17 (Del 3 – fynd 3.2): nyckeln var tidigare GLOBAL per enhet,
// inte per konto. useOfflineCenter.js och checklistFramsteg.js resonerar båda uttryckligen om
// delade enheter och nycklar per uid – den här filen (äldre, Etapp 17b) missade det, och det
// var den enda av de tre som lagrar faktiskt INNEHÅLL (rutintitlar och sökvägar) i stället för
// en tidsstämpel. Två konsekvenser på en delad akutmottagningsdator eller en kioskplatta:
//   1. Nästa person som loggade in såg föregående persons lista på startsidan.
//   2. Värre: useSenastBesokta.js faller tillbaka på den lokala listan när kontots eget
//      senastBesokta-fält saknas (en ny användare har inget), och skriver sedan tillbaka
//      lasSenastBesokta() till users/{uid} – föregående persons historik hamnade alltså
//      permanent i en ANNAN användares konto.
// uid är därför obligatoriskt. Saknas det (utloggad) används inget lokalt minne alls.
const NYCKEL_PREFIX = "synappsen_senast_besokta";
const MAX_ANTAL = 8;

function nyckel(uid) {
  return `${NYCKEL_PREFIX}_${uid}`;
}

export function lasSenastBesokta(uid) {
  if (!uid) return [];
  try {
    const rad = localStorage.getItem(nyckel(uid));
    return rad ? JSON.parse(rad) : [];
  } catch {
    return [];
  }
}

export function registreraBesok(uid, { id, titel, sokvag }) {
  if (!uid || !id || !titel || !sokvag) return;
  try {
    const nuvarande = lasSenastBesokta(uid).filter((p) => p.id !== id);
    const uppdaterad = [{ id, titel, sokvag }, ...nuvarande].slice(0, MAX_ANTAL);
    localStorage.setItem(nyckel(uid), JSON.stringify(uppdaterad));
  } catch {
    // localStorage kan vara fullt/blockerat – fungerar utan, bara sämre UX
  }
}

// Tar bort den gamla, kontolösa nyckeln. Anropas vid inloggning OCH utloggning: den ligger
// kvar på varje enhet som kört en tidigare version, och innehåller då den sist inloggade
// personens historik. Att bara sluta LÄSA den räcker inte – den ska bort från enheten.
export function rensaGammalDelalNyckel() {
  try {
    localStorage.removeItem(NYCKEL_PREFIX);
  } catch {
    // se ovan
  }
}

// Utloggningsstädning (se rensaLokalaAnvandardata i firebase/config.js): tar bort ALLA
// användares lokala listor från enheten. Medvetet bredare än bara den utloggande användaren –
// på en delad enhet är poängen att ingenting av någon tidigare session ligger kvar.
export function rensaAllaSenastBesokta() {
  try {
    for (const n of Object.keys(localStorage)) {
      if (n === NYCKEL_PREFIX || n.startsWith(`${NYCKEL_PREFIX}_`)) {
        localStorage.removeItem(n);
      }
    }
  } catch {
    // se ovan
  }
}
