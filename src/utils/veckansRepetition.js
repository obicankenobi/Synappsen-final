// Etapp 41b: "Veckans repetition" – en fråga ur kvissbanken (rutin.kviss, se KvissModal.jsx)
// om en rutin du kvitterade för länge sedan. Frivilligt, 30 sekunder. Precis som KvissModal.jsx
// (se dess egen kommentar) sparas INGET svar, rätt eller fel, någonstans (krav 14) – all
// tillståndshantering nedan är ren klientlogik, ingen Firestore-skrivning förekommer.
const TROSKEL_DAGAR = 90;
const MS_PER_DAG = 24 * 60 * 60 * 1000;

// ISO-veckonyckel (år + veckonummer) – samma fråga hela veckan för en given användare, sedan
// byter den. Behöver inte vara en exakt ISO 8601-vecka; bara stabil inom en kalendervecka och
// unik mellan veckor.
export function veckoNyckel(datum = new Date()) {
  const forstaJanuari = new Date(datum.getFullYear(), 0, 1);
  const dagarSedanNyar = Math.floor((datum - forstaJanuari) / MS_PER_DAG);
  const vecka = Math.floor(dagarSedanNyar / 7) + 1;
  return `${datum.getFullYear()}-W${vecka}`;
}

// Enkel, deterministisk hash (inte kryptografisk) – bara till för att sprida ut vilken
// rutin/fråga en given användare ser en given vecka, utan någon server-komponent.
function enkelHash(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// rutin.lasteAv är en array av { uid, namn, tidpunkt } (se useLaskvittering.js) – hittar
// EGEN kvittering och avgör om den är äldre än tröskeln.
function kvitteradForLangeSedan(rutin, uid, nu) {
  const egen = (rutin.lasteAv ?? []).find((post) => post.uid === uid);
  if (!egen?.tidpunkt) return false;
  const tidpunktMs = egen.tidpunkt.toMillis ? egen.tidpunkt.toMillis() : new Date(egen.tidpunkt).getTime();
  return nu - tidpunktMs > TROSKEL_DAGAR * MS_PER_DAG;
}

// Väljer en rutin (med minst en kvissfråga, godkänd, inte arkiverad, kvitterad av den
// inloggade för länge sedan) och en fråga ur den, stabilt för hela veckan. Returnerar null om
// inget kvalificerar – funktionen som anropar den ska då inte visa något alls (frivilligt
// tillägg, inget att sakna).
export function valjVeckansFraga(allaRutiner, uid, datum = new Date()) {
  if (!uid) return null;
  const kandidater = allaRutiner.filter(
    (r) =>
      r.status === "godkand" &&
      r.arkiverad !== true &&
      Array.isArray(r.kviss) &&
      r.kviss.length > 0 &&
      kvitteradForLangeSedan(r, uid, datum.getTime())
  );
  if (kandidater.length === 0) return null;

  const frokandidater = [...kandidater].sort((a, b) => a.id.localeCompare(b.id));
  const nyckel = `${veckoNyckel(datum)}-${uid}`;
  const rutinIndex = enkelHash(nyckel) % frokandidater.length;
  const rutin = frokandidater[rutinIndex];
  const frageIndex = enkelHash(`${nyckel}-fraga`) % rutin.kviss.length;
  return { rutin, fraga: rutin.kviss[frageIndex], frageIndex };
}
