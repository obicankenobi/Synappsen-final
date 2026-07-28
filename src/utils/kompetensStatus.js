// Etapp 19c: beräknar kompetensstatus LIVE utifrån data som redan finns (lasteAv,
// senasteVasentligaAndring) – precis som introduktionsspårets progress (utils/
// introduktionProgress.js), ingen egen "godkänd"-status lagras per person och rutin.
export const KOMPETENS_STATUS = {
  KLAR: "klar",
  FORFALLER_SNART: "forfaller_snart",
  FORFALLEN: "forfallen",
  SAKNAS: "saknas",
};

const FORFALLER_SNART_DAGAR = 30;

function laggTillManader(datum, manader) {
  const d = new Date(datum);
  d.setMonth(d.getMonth() + manader);
  return d;
}

// Senaste läskvittering en viss person har gjort av en given rutin (kan finnas flera,
// t.ex. vid omkvittering efter en väsentlig ändring).
export function senasteKvittens(rutin, uid) {
  const poster = (rutin?.lasteAv ?? []).filter((k) => k.uid === uid);
  if (poster.length === 0) return null;
  return poster.reduce((senast, p) =>
    p.tidpunkt.toMillis() > senast.tidpunkt.toMillis() ? p : senast
  );
}

// frekvensManader: hur ofta rutinen ska omkvitteras (t.ex. 12 för årligen).
export function berakraKompetensStatus(rutin, frekvensManader, uid, nu = new Date()) {
  const kvittens = senasteKvittens(rutin, uid);
  if (!kvittens) return KOMPETENS_STATUS.SAKNAS;

  const kvittensDatum = kvittens.tidpunkt.toDate();
  // Väsentlig ändring gjord EFTER senaste kvittensen ogiltigförklarar den – personen måste
  // läsa och kvittera igen, oavsett hur nyligen den gamla kvittensen gjordes.
  if (rutin.senasteVasentligaAndring && kvittensDatum < rutin.senasteVasentligaAndring.toDate()) {
    return KOMPETENS_STATUS.SAKNAS;
  }

  const forfallerDatum = laggTillManader(kvittensDatum, frekvensManader);
  const dagarKvar = (forfallerDatum.getTime() - nu.getTime()) / (1000 * 60 * 60 * 24);
  if (dagarKvar < 0) return KOMPETENS_STATUS.FORFALLEN;
  if (dagarKvar <= FORFALLER_SNART_DAGAR) return KOMPETENS_STATUS.FORFALLER_SNART;
  return KOMPETENS_STATUS.KLAR;
}

export const KOMPETENS_STATUS_LABEL = {
  [KOMPETENS_STATUS.KLAR]: "Klar",
  [KOMPETENS_STATUS.FORFALLER_SNART]: "Förfaller snart",
  [KOMPETENS_STATUS.FORFALLEN]: "Förfallen",
  [KOMPETENS_STATUS.SAKNAS]: "Saknas",
};
