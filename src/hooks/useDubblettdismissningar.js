// Etapp 37c: en redaktör avfärdar ett misstänkt dubblettpar som INTE en dubblett, så det
// inte flaggas igen nästa gång. Ingen sammanslagning av innehåll sker här (krav 15) – bara en
// markering av att paret redan tittats på.
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function parNyckelFran(idA, idB) {
  return [idA, idB].sort().join("::");
}

export function useDubblettdismissningar(omrade) {
  const { organisationId, role } = useAuth();
  const [dismissningar, setDismissningar] = useState([]);

  useEffect(() => {
    if (!organisationId || !omrade) return undefined;
    const q = query(
      collection(db, "dubblettdismissningar"),
      where("organisationId", "==", organisationId),
      where("omrade", "==", omrade)
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => setDismissningar(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (error) => {
        rapporteraNekadListning({ collection: "dubblettdismissningar", roll: role, organisationId, sokvag: omrade, fel: error });
      },
    );
    return unsubscribe;
  }, [organisationId, omrade, role]);

  async function avfardaPar(parNyckel, uid, namn) {
    return addDoc(collection(db, "dubblettdismissningar"), {
      organisationId,
      omrade,
      parNyckel,
      dismissadAv: uid,
      dismissadAvNamn: namn ?? "",
      dismissadDatum: serverTimestamp(),
    });
  }

  return { dismissningar, avfardaPar };
}
