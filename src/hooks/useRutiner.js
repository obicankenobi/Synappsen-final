// Hämtning och hantering av rutiner (CRUD + godkännandeflöde) för en sektion
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

export const RUTIN_STATUS = {
  UTKAST: "utkast",
  GODKAND: "godkand",
};

export function useRutiner(omrade) {
  const [rutiner, setRutiner] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "rutiner"),
      where("omrade", "==", omrade),
      orderBy("skapad", "desc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setRutiner(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLaddar(false);
    });
    return unsubscribe;
  }, [omrade]);

  async function skapaRutin({
    titel,
    innehall,
    bildUrl,
    omrade: omradeFalt,
    skapadAv,
    kraverGodkannande = true,
  }) {
    return addDoc(collection(db, "rutiner"), {
      titel,
      innehall,
      bildUrl: bildUrl ?? null,
      omrade: omradeFalt,
      status: kraverGodkannande ? RUTIN_STATUS.UTKAST : RUTIN_STATUS.GODKAND,
      skapadAv,
      skapad: serverTimestamp(),
    });
  }

  async function uppdateraRutin(id, falt) {
    return updateDoc(doc(db, "rutiner", id), falt);
  }

  async function godkannRutin(id) {
    return updateDoc(doc(db, "rutiner", id), { status: RUTIN_STATUS.GODKAND });
  }

  async function taBortRutin(id) {
    return deleteDoc(doc(db, "rutiner", id));
  }

  return { rutiner, laddar, skapaRutin, uppdateraRutin, godkannRutin, taBortRutin };
}
