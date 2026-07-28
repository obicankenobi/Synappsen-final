// Etapp 19c: vilka rutiner som är obligatoriska för en viss roll, och med vilken
// omkvitteringsfrekvens. Hanteras av VEC/superadmin, se firestore.rules (farHanteraAnslag()) –
// samma behörighet som introduktionsspår/anslagstavlan.
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";

export function useKompetenskrav() {
  const { organisationId } = useAuth();
  const [krav, setKrav] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    if (!organisationId) return undefined;
    const q = query(collection(db, "kompetenskrav"), where("organisationId", "==", organisationId));
    const unsubscribe = onSnapshot(q, (snap) => {
      setKrav(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLaddar(false);
    });
    return unsubscribe;
  }, [organisationId]);

  async function skapaKrav({ roll, rutinId, rutinTitel, omrade, frekvensManader }) {
    return addDoc(collection(db, "kompetenskrav"), {
      roll,
      rutinId,
      rutinTitel,
      omrade,
      frekvensManader,
      organisationId,
      skapad: serverTimestamp(),
    });
  }

  async function uppdateraKrav(id, falt) {
    await updateDoc(doc(db, "kompetenskrav", id), falt);
  }

  async function taBortKrav(id) {
    await deleteDoc(doc(db, "kompetenskrav", id));
  }

  return { krav, laddar, skapaKrav, uppdateraKrav, taBortKrav };
}
