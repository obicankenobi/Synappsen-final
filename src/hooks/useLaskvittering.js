// Läskvittering – personal kan markera att de läst och förstått en rutin.
// Sparas som en array av {uid, namn, tidpunkt} direkt på rutin-dokumentet.
import { doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";

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
