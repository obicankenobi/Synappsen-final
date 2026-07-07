// Privata anteckningar på en rutin – bara den som skrev dem kan se dem.
// Dokument-id är "{uid}_{rutinId}" så varje användare har högst en anteckning per rutin.
import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export function usePrivatAnteckning(uid, rutinId) {
  const [text, setText] = useState("");
  const [laddad, setLaddad] = useState(false);

  useEffect(() => {
    if (!uid || !rutinId) return;
    const unsubscribe = onSnapshot(doc(db, "anteckningar", `${uid}_${rutinId}`), (snap) => {
      setText(snap.data()?.text ?? "");
      setLaddad(true);
    });
    return unsubscribe;
  }, [uid, rutinId]);

  async function spara(nyText) {
    if (!nyText.trim()) {
      await deleteDoc(doc(db, "anteckningar", `${uid}_${rutinId}`));
      return;
    }
    await setDoc(doc(db, "anteckningar", `${uid}_${rutinId}`), {
      uid,
      rutinId,
      text: nyText,
      uppdaterad: serverTimestamp(),
    });
  }

  return { text, laddad, spara };
}
