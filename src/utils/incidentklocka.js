// Etapp L1p punkt 3 (intern/ETAPPLAN-INTERN-1.md), B11: 72-timmarsklockan från
// drift/INCIDENT-CHECKLISTA.md steg 6, med en 24-timmarsgren för kunder under
// cybersäkerhetslagen (2025:1506) – granskningar/JURIDISK-GRANSKNING.md risk 15.
const TIMMAR_ORDINARIE = 72;
const TIMMAR_NIS2 = 24;

export function fristTimmar(omfattasAvNIS2) {
  return omfattasAvNIS2 ? TIMMAR_NIS2 : TIMMAR_ORDINARIE;
}

export function berakDeadline(kannedomTidpunkt, omfattasAvNIS2) {
  return new Date(new Date(kannedomTidpunkt).getTime() + fristTimmar(omfattasAvNIS2) * 60 * 60 * 1000);
}

// Returnerar { timmarKvar, forfallen, halvtidPasserad } – rent tal, ingen textformatering
// (den hör hemma i komponenten, som vet vilket språk den renderar för).
export function berakAterstaende(kannedomTidpunkt, omfattasAvNIS2, nu = new Date()) {
  const deadline = berakDeadline(kannedomTidpunkt, omfattasAvNIS2);
  const totalTimmar = fristTimmar(omfattasAvNIS2);
  const timmarKvar = (deadline.getTime() - nu.getTime()) / (60 * 60 * 1000);
  return {
    deadline,
    timmarKvar,
    forfallen: timmarKvar <= 0,
    halvtidPasserad: timmarKvar <= totalTimmar / 2,
  };
}
