// Delade hjälpfunktioner för rutinstatus, återanvänds av RutinKort, Sektionssida och MinaUppgifter.
const GRANSKNINGSINTERVALL_DAGAR = 180;

export function borGranskas(granskadDatum) {
  if (!granskadDatum?.toDate) return false;
  const granslinje = new Date();
  granslinje.setDate(granslinje.getDate() - GRANSKNINGSINTERVALL_DAGAR);
  return granskadDatum.toDate() < granslinje;
}

export function arUtgangen(rutin) {
  return Boolean(rutin.utgangsdatum) && new Date(rutin.utgangsdatum) < new Date();
}
