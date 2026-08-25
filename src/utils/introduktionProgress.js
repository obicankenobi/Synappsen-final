// Etapp 19a: beräknar progress för en introduktionstilldelning utifrån BEFINTLIGA
// lasteAv-listor på rutiner/anslag – ingen egen "klar"-status lagras (se
// useIntroduktionstilldelningar.js).
const DAG_MS = 24 * 60 * 60 * 1000;

// innehallMap: Map med nyckel "{typ}:{id}" -> { titel, sokvag, lasteAv }
export function berakraIntroduktionsProgress(etapper, uid, innehallMap) {
  const allaPoster = (etapper ?? []).flatMap((e) =>
    (e.poster ?? []).map((p) => ({ ...p, etappNamn: e.namn }))
  );
  let klara = 0;
  const detaljer = allaPoster.map((p) => {
    const innehall = innehallMap.get(`${p.typ}:${p.id}`);
    const arKlar = innehall?.lasteAv?.some((l) => l.uid === uid) ?? false;
    if (arKlar) klara += 1;
    return {
      ...p,
      titel: innehall?.titel ?? "(borttaget innehåll)",
      sokvag: innehall?.sokvag ?? null,
      klar: arKlar,
      // Etapp 65d/19b: en rutin med kviss visar mikrokvissen automatiskt vid kvittering
      // (RutinKort.jsx) – det behöver inget eget bygge, bara synas i listan så att både den
      // nyanställda och den som bygger spåret vet att en kunskapskontroll väntar.
      harKviss: (innehall?.kviss?.length ?? 0) > 0,
    };
  });
  return {
    detaljer,
    klara,
    totalt: allaPoster.length,
    procent: allaPoster.length > 0 ? Math.round((klara / allaPoster.length) * 100) : 0,
  };
}

// Antal dagar sedan en tilldelning skedde – för att jämföra mot rekommenderadDag och
// se vem som "ligger efter".
export function dagarSedan(tilldeladTimestamp) {
  if (!tilldeladTimestamp?.toDate) return 0;
  return Math.floor((Date.now() - tilldeladTimestamp.toDate().getTime()) / DAG_MS);
}

export function liggerEfter(detaljer, dagarSedanTilldelning) {
  return detaljer.some((p) => !p.klar && (p.rekommenderadDag ?? 0) < dagarSedanTilldelning);
}
