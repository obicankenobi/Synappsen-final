// "Var detta hjälpsamt?"-svar på klinikstöd-sökningen. Skrivs direkt av klienten (inte via
// Cloud Function) eftersom det bara är en bool kopplad till en fråga som redan passerat
// personnummer-kontrollen när den skickades till fragaKlinisktStod.
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export async function skickaKlinikfrageFeedback(fraga, hjalpsam, uid, organisationId) {
  return addDoc(collection(db, "klinikfragefeedback"), {
    fraga,
    hjalpsam,
    uid,
    organisationId,
    tidpunkt: serverTimestamp(),
  });
}
