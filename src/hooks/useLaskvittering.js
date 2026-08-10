// Läskvittering – personal kan markera att de läst och förstått en rutin.
// Sparas som en array av {uid, tidpunkt} direkt på rutin-/anslag-dokumentet.
//
// Etapp 60b (ETAPPLAN12.md): fältet innehöll tidigare även `namn`, men det är ren
// duplicering – varje konsument (RutinKort.jsx, AnslagKort.jsx) har redan organisationens
// användarlista laddad separat och kan slå upp namnet från `uid` istället. Att sluta skriva
// namn krymper varje post med ~15–20 byte, vilket adderas upp rejält på en populär rutin med
// många kvitteringar (60a mätte lasteAv till en av de tyngre bidragarna till en kall
// förstagångsinloggnings nätverkstrafik). `namn`-parametern behålls i signaturen så att
// anropsställena (inklusive den köade offline-repriseringen i useOfflineKo.js) inte behöver
// ändras – den är bara inte med i det som faktiskt skrivs längre.
import { doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { laggTillIKo } from "../utils/offlineKo";

// eslint-disable-next-line no-unused-vars -- se motiveringen ovan: signaturen behålls medvetet
export async function kvitteraLast(rutinId, uid, namn) {
  return updateDoc(doc(db, "rutiner", rutinId), {
    lasteAv: arrayUnion({ uid, tidpunkt: Timestamp.now() }),
  });
}

// eslint-disable-next-line no-unused-vars -- se motiveringen ovan: signaturen behålls medvetet
export async function kvitteraLastAnslag(anslagId, uid, namn) {
  return updateDoc(doc(db, "anslag", anslagId), {
    lasteAv: arrayUnion({ uid, tidpunkt: Timestamp.now() }),
  });
}

// Etapp 29c: samma anrop, men lägger sig i offline-kön istället för att kasta ett fel om
// nätet saknas eller skrivningen misslyckas – läskvittering är idempotent (arrayUnion) och
// därför säker att köa. Byt bara ut importen på anropsstället, samma signatur.
export async function kvitteraLastMedKo(rutinId, uid, namn) {
  if (!navigator.onLine) {
    laggTillIKo(uid, "laskvittering-rutin", { rutinId, namn });
    return;
  }
  try {
    await kvitteraLast(rutinId, uid, namn);
  } catch {
    laggTillIKo(uid, "laskvittering-rutin", { rutinId, namn });
  }
}

export async function kvitteraLastAnslagMedKo(anslagId, uid, namn) {
  if (!navigator.onLine) {
    laggTillIKo(uid, "laskvittering-anslag", { anslagId, namn });
    return;
  }
  try {
    await kvitteraLastAnslag(anslagId, uid, namn);
  } catch {
    laggTillIKo(uid, "laskvittering-anslag", { anslagId, namn });
  }
}
