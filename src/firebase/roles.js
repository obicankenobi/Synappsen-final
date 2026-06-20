// Definition av alla användarroller i Synappsen
export const ROLES = {
  SUPERADMIN: "superadmin",
  VOL: "vol",
  SEKTIONSLEDARE: "sektionsledare",
  VEC: "vec",
  FORRADSANSVARIG: "forradesansvarig",
  PERSONAL: "personal",
};

export const ROLE_LABELS = {
  [ROLES.SUPERADMIN]: "Superadmin",
  [ROLES.VOL]: "VÖL",
  [ROLES.SEKTIONSLEDARE]: "Sektionsledare",
  [ROLES.VEC]: "VEC",
  [ROLES.FORRADSANSVARIG]: "Förrådsansvarig",
  [ROLES.PERSONAL]: "Personal",
};

// Standardroll för nya konton skapade via registreringsformuläret
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
