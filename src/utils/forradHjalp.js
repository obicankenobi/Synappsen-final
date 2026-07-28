// Etapp 20c: utgångsdatumbevakning för förrådsartiklar.
const VARNINGSFONSTER_DAGAR = 30;

export function gerUtInom30Dagar(artikel) {
  if (!artikel.utgangsdatum) return false;
  const dagarKvar = (new Date(artikel.utgangsdatum).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return dagarKvar >= 0 && dagarKvar <= VARNINGSFONSTER_DAGAR;
}

export function arUtgangenArtikel(artikel) {
  return Boolean(artikel.utgangsdatum) && new Date(artikel.utgangsdatum) < new Date();
}
