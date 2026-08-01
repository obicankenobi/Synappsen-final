// Delade hjälpfunktioner för rutinstatus, återanvänds av RutinKort, Sektionssida och MinaUppgifter.
const GRANSKNINGSINTERVALL_DAGAR = 180;
const GRANSKNING_PAMINNELSE_DAGAR = 14;

export function borGranskas(granskadDatum) {
  if (!granskadDatum?.toDate) return false;
  const granslinje = new Date();
  granslinje.setDate(granslinje.getDate() - GRANSKNINGSINTERVALL_DAGAR);
  return granskadDatum.toDate() < granslinje;
}

// Sant under de sista GRANSKNING_PAMINNELSE_DAGAR innan en rutin blir "bör granskas" – ger
// redaktörer en förvarning (notis) istället för att de bara upptäcker det passivt när
// fristen redan gått ut.
export function narmarSigGranskning(granskadDatum) {
  if (!granskadDatum?.toDate) return false;
  const dagarSedan = (Date.now() - granskadDatum.toDate().getTime()) / (1000 * 60 * 60 * 24);
  return (
    dagarSedan >= GRANSKNINGSINTERVALL_DAGAR - GRANSKNING_PAMINNELSE_DAGAR &&
    dagarSedan < GRANSKNINGSINTERVALL_DAGAR
  );
}

export function arUtgangen(rutin) {
  return Boolean(rutin.utgangsdatum) && new Date(rutin.utgangsdatum) < new Date();
}

// Etapp 37d: "gäller inte längre" som ett eget, manuellt satt tillstånd – skilt från
// papperskorgen (borttagen). En arkiverad rutin finns kvar, är sökbar för den som letar
// historik (redaktörer ser den fortfarande i listan, tydligt märkt), men utlöser inget
// kvitteringskrav och räknas inte in i innehållshälsan, granskningsrundor eller
// dubblettdetektionen.
export function arArkiverad(rutin) {
  return rutin?.arkiverad === true;
}
