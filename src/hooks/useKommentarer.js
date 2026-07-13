// Kommentarer/frågor kopplade till en rutin
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

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

  async function skapaKommentar({ text, skapadAv, skapadAvNamn, svarPa = null }) {
    return addDoc(collection(db, "kommentarer"), {
      rutinId,
      text,
      skapadAv,
      skapadAvNamn: skapadAvNamn ?? "",
      svarPa,
      skapad: serverTimestamp(),
    });
  }

  async function taBortKommentar(id) {
    return deleteDoc(doc(db, "kommentarer", id));
  }

  return { kommentarer, skapaKommentar, taBortKommentar };
}
