// Etapp 19a: definitionen av introduktionsspår (namn, målroll, etapper med
// rutin-/anslagsreferenser). Hanteras av VEC/superadmin, se firestore.rules
// (farHanteraAnslag()) – samma behörighet som anslagstavlan.
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useIntroduktionsspar() {
  const { organisationId, role } = useAuth();
  const [spar, setSpar] = useState([]);
  const [laddar, setLaddar] = useState(true);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    const q = query(collection(db, "introduktionsspar"), where("organisationId", "==", organisationId));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setSpar(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLaddar(false);
        setFel(null);
      },
      (error) => {
        setLaddar(false);
        setFel(error);
        rapporteraNekadListning({ collection: "introduktionsspar", roll: role, organisationId, fel: error });
      },
    );
    return unsubscribe;
  }, [organisationId, role]);

  async function skapaSpar({ namn, malRoll, etapper }) {
    return addDoc(collection(db, "introduktionsspar"), {
      namn,
      malRoll,
      etapper,
      organisationId,
      skapad: serverTimestamp(),
    });
  }

  async function uppdateraSpar(id, falt) {
    await updateDoc(doc(db, "introduktionsspar", id), falt);
  }

  async function taBortSpar(id) {
    await deleteDoc(doc(db, "introduktionsspar", id));
  }

  return { spar, laddar, fel, skapaSpar, uppdateraSpar, taBortSpar };
}
