// Skiftrapport – korta, praktiska driftmeddelanden mellan skift (t.ex. "vattenläcka i taket",
// "slut på sutur-set"). Får ALDRIG innehålla patientinformation. Alla inloggade kan skapa och
// markera som åtgärdat. Poster äldre än 48 timmar visas som standard inte i huvudlistan.
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

const VISNINGSGRANS_TIMMAR = 48;

export function useSkiftrapport() {
  const [poster, setPoster] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "skiftrapporter"), orderBy("skapad", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setPoster(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLaddar(false);
    });
    return unsubscribe;
  }, []);

  async function skapaPost({ text, skapadAv, skapadAvNamn }) {
    const ref = await addDoc(collection(db, "skiftrapporter"), {
      text,
      atgardad: false,
      atgardadAv: null,
      skapadAv,
      skapadAvNamn: skapadAvNamn ?? "",
      skapad: serverTimestamp(),
    });
    loggaHandelse({
      beskrivning: "Skiftrapport skapad",
      entitetTyp: "skiftrapport",
      entitetId: ref.id,
      uid: skapadAv,
    });
    return ref;
  }

  async function markeraAtgardad(id, uid) {
    await updateDoc(doc(db, "skiftrapporter", id), { atgardad: true, atgardadAv: uid });
    loggaHandelse({ beskrivning: "Skiftrapport åtgärdad", entitetTyp: "skiftrapport", entitetId: id, uid });
  }

  async function taBortPost(id, uid) {
    await deleteDoc(doc(db, "skiftrapporter", id));
    loggaHandelse({ beskrivning: "Skiftrapport borttagen", entitetTyp: "skiftrapport", entitetId: id, uid });
  }

  const grans = new Date();
  grans.setHours(grans.getHours() - VISNINGSGRANS_TIMMAR);

  const aktiva = poster.filter((p) => !p.atgardad && (!p.skapad?.toDate || p.skapad.toDate() >= grans));
  const atgardadeSenaste = poster.filter((p) => p.atgardad && (!p.skapad?.toDate || p.skapad.toDate() >= grans));

  return { aktiva, atgardadeSenaste, laddar, skapaPost, markeraAtgardad, taBortPost };
}
