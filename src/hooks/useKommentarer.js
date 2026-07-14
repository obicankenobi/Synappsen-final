// Kommentarer/frågor kopplade till en rutin
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { skapaKommentar as skapaKommentarAnrop } from "../firebase/functions";

export function useKommentarer(rutinId) {
  const [kommentarer, setKommentarer] = useState([]);

  useEffect(() => {
    if (!rutinId) return;
    const q = query(
      collection(db, "kommentarer"),
      where("rutinId", "==", rutinId),
      orderBy("skapad", "asc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setKommentarer(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [rutinId]);

  // Skapas via en Cloud Function (inte en direkt Firestore-skrivning) så att personnummer-
  // spärren och hastighetsbegränsningen körs server-side. @omnämnanden räknas ut av
  // funktionen utifrån den faktiska texten, klientens egen gissning ignoreras.
  async function skapaKommentar({ text, svarPa = null }) {
    return skapaKommentarAnrop({ rutinId, text, svarPa });
  }

  async function taBortKommentar(id) {
    return deleteDoc(doc(db, "kommentarer", id));
  }

  return { kommentarer, skapaKommentar, taBortKommentar };
}
