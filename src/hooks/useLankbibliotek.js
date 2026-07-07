// Länkbibliotek – externa resurser (FASS, Internetmedicin, regionala PM osv.)
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

export function useLankbibliotek() {
  const [lankar, setLankar] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "lankbibliotek"), orderBy("kategori", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setLankar(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLaddar(false);
    });
    return unsubscribe;
  }, []);

  async function skapaLank({ titel, url, kategori, beskrivning, uid }) {
    const ref = await addDoc(collection(db, "lankbibliotek"), {
      titel,
      url,
      kategori: kategori || "Övrigt",
      beskrivning: beskrivning || "",
      skapad: serverTimestamp(),
    });
    loggaHandelse({ beskrivning: `Länk skapad: "${titel}"`, entitetTyp: "lank", entitetId: ref.id, uid });
    return ref;
  }

  async function uppdateraLank(id, falt, uid) {
    await updateDoc(doc(db, "lankbibliotek", id), falt);
    loggaHandelse({ beskrivning: "Länk uppdaterad", entitetTyp: "lank", entitetId: id, uid });
  }

  async function taBortLank(id, uid) {
    await deleteDoc(doc(db, "lankbibliotek", id));
    loggaHandelse({ beskrivning: "Länk borttagen", entitetTyp: "lank", entitetId: id, uid });
  }

  return { lankar, laddar, skapaLank, uppdateraLank, taBortLank };
}
