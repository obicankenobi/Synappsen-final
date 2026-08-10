// Definition av alla användarroller i Synappsen
export const ROLES = {
  SUPERADMIN: "superadmin",
  VOL: "vol",
  SEKTIONSLEDARE: "sektionsledare",
  VEC: "vec",
  FORRADSANSVARIG: "forradesansvarig",
  PERSONAL: "personal",
  // Etapp 55: delat enhetskonto (t.ex. en foajé-platta), inte en person – se arKiosk() i
  // firestore.rules för den fullständiga motiveringen och listan över uteslutna handlingar.
  KIOSK: "kiosk",
};

export const ROLE_LABELS = {
  [ROLES.SUPERADMIN]: "Superadmin",
  [ROLES.VOL]: "VÖL",
  [ROLES.SEKTIONSLEDARE]: "Sektionsledare",
  [ROLES.VEC]: "VEC",
  [ROLES.FORRADSANSVARIG]: "Förrådsansvarig",
  [ROLES.PERSONAL]: "Personal",
  [ROLES.KIOSK]: "Kioskläge (delad enhet)",
};

// Föreslagen standardroll när en superadmin bjuder in ett nytt konto (Etapp 6c) – inte
// längre en självbetjänings-standard, eftersom registrering kräver en inbjudan.
export const DEFAULT_ROLE = ROLES.PERSONAL;

// Roller som får skapa/ändra/ta bort medicinska rutiner
export const KAN_REDIGERA_RUTINER = [
  ROLES.SUPERADMIN,
  ROLES.VOL,
  ROLES.SEKTIONSLEDARE,
];

// Roller som får godkänna medicinskt innehåll
export const KAN_GODKANNA_RUTINER = [ROLES.SUPERADMIN, ROLES.VOL];

// Roller som får hantera anslag/nyheter
export const KAN_HANTERA_ANSLAG = [ROLES.SUPERADMIN, ROLES.VEC];

// Roller som får hantera förrådsartiklar
export const KAN_HANTERA_FORRAD = [ROLES.SUPERADMIN, ROLES.FORRADSANSVARIG];

// Alla roller med någon form av redaktörsbehörighet (används t.ex. för att moderera
// andras kommentarer/skiftrapporter oavsett vilket område rollen äger)
export const REDAKTORSROLLER = [
  ROLES.SUPERADMIN,
  ROLES.VOL,
  ROLES.SEKTIONSLEDARE,
  ROLES.VEC,
  ROLES.FORRADSANSVARIG,
];

export function arRedaktor(role) {
  return REDAKTORSROLLER.includes(role);
}

// Klientmotsvarighet till firestore.rules farRedigeraOmrade(omrade) – MÅSTE hållas i synk med
// den. Etapp 31b (bugfynd): useRutiner(omrade)/useForradsartiklar() frågar Firestore utan att
// filtrera på status, och förlitar sig på att regeln själv filtrerar bort utkast för den som
// inte får redigera området. Men regelns villkor är
// `resource.data.status == 'godkand' || farRedigeraOmrade(resource.data.omrade)` – ett OR där
// andra ledet är sant/falskt konstant per request, men FÖRSTA ledet (status) inte är
// bevisbart utan ett matchande where() i frågan (samma "list-provability"-constraint som
// andringsforslag/Etapp 26 och bristanmalningar/Etapp 29). Utan den konstanten nekas HELA
// listningen för alla utom just den områdets redaktörer – vilket i praktiken var HELA appens
// kärninnehåll (rutiner/förrådsartiklar), osynligt för standardrollen "personal" sedan appen
// byggdes. Se useRutiner.js/useForradsartiklar.js för hur den här funktionen används för att
// lägga till where("status","==","godkand") när den inloggade INTE är en redaktör.
export function farRedigeraOmrade(role, omrade) {
  return (
    role === ROLES.SUPERADMIN ||
    (omrade === "kliniskt-stod" && (role === ROLES.VOL || role === ROLES.SEKTIONSLEDARE)) ||
    (omrade === "logistik" && role === ROLES.FORRADSANSVARIG) ||
    (omrade === "administration" && role === ROLES.VEC)
  );
}
