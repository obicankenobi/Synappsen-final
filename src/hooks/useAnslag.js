// Anslagstavla – meddelanden från ledningen till all personal
import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { loggaHandelse } from "./useAuditlogg";

export function useAnslag() {
  const [anslag, setAnslag] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "anslag"), orderBy("skapad", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setAnslag(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLaddar(false);
    });
    return unsubscribe;
  }, []);

  async function skapaAnslag({ titel, innehall, fastNaglad, utgangsdatum, skapadAv, skapadAvNamn }) {
    const ref = await addDoc(collection(db, "anslag"), {
      titel,
      innehall,
      fastNaglad: Boolean(fastNaglad),
      utgangsdatum: utgangsdatum || null,
      skapadAv,
      skapadAvNamn: skapadAvNamn ?? "",
      skapad: serverTimestamp(),
    });
    loggaHandelse({
      beskrivning: `Anslag skapat: "${titel}"`,
      entitetTyp: "anslag",
      entitetId: ref.id,
      uid: skapadAv,
    });
    return ref;
  }

  async function uppdateraAnslag(id, falt, uid) {
    await updateDoc(doc(db, "anslag", id), falt);
    loggaHandelse({ beskrivning: "Anslag uppdaterat", entitetTyp: "anslag", entitetId: id, uid });
  }

  async function taBortAnslag(id, uid) {
    await deleteDoc(doc(db, "anslag", id));
    loggaHandelse({ beskrivning: "Anslag borttaget", entitetTyp: "anslag", entitetId: id, uid });
  }

  // Fastnaglade anslag högst upp, sedan nyast först. Utgångna anslag filtreras bort.
  const nu = new Date();
  const synligaAnslag = anslag
    .filter((a) => !a.utgangsdatum || new Date(a.utgangsdatum) >= nu)
    .sort((a, b) => (b.fastNaglad ? 1 : 0) - (a.fastNaglad ? 1 : 0));

  return { anslag: synligaAnslag, laddar, skapaAnslag, uppdateraAnslag, taBortAnslag };
}
