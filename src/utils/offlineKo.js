// Etapp 29c: kö för åtgärder gjorda offline. Ren localStorage-baserad primitiv (samma mönster
// som useOfflineCenter.js/sessionStorage-kön i LaddaUpp.jsx) – inga React-beroenden, så både
// fristående funktioner (kvitteraLastMedKo m.fl.) och en React-hook kan dela samma kö.
// Gränsdragning (genomgående, se ETAPPLAN4.md Etapp 29c): ENDAST idempotenta, ofarliga
// åtgärder får köas här – läskvittering och bristanmälan. Ingenting som ändrar publicerat
// innehåll (rutintext, godkännanden, etc.) får någonsin köas offline.
const KO_NYCKEL_PREFIX = "offlineKo_";

function koNyckel(uid) {
  return `${KO_NYCKEL_PREFIX}${uid}`;
}

export function lasKo(uid) {
  try {
    return JSON.parse(localStorage.getItem(koNyckel(uid)) ?? "[]");
  } catch {
    return [];
  }
}

function skrivKo(uid, ko) {
  try {
    localStorage.setItem(koNyckel(uid), JSON.stringify(ko));
  } catch {
    // Privat läge/full lagring – kön tappas, men appen kraschar inte.
  }
}

export function laggTillIKo(uid, typ, data) {
  const post = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, typ, data, tidpunkt: Date.now() };
  skrivKo(uid, [...lasKo(uid), post]);
  return post;
}

export function tabortUrKo(uid, id) {
  skrivKo(uid, lasKo(uid).filter((p) => p.id !== id));
}
