// Läskvittering – personal kan markera att de läst och förstått en rutin.
// Sparas som en array av {uid, namn, tidpunkt} direkt på rutin-dokumentet.
import { doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { laggTillIKo } from "../utils/offlineKo";

export async function kvitteraLast(rutinId, uid, namn) {
  return updateDoc(doc(db, "rutiner", rutinId), {
    lasteAv: arrayUnion({ uid, namn: namn ?? "", tidpunkt: Timestamp.now() }),
  });
}

export async function kvitteraLastAnslag(anslagId, uid, namn) {
  return updateDoc(doc(db, "anslag", anslagId), {
    lasteAv: arrayUnion({ uid, namn: namn ?? "", tidpunkt: Timestamp.now() }),
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
