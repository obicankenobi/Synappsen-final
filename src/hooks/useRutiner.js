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
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { loggaHandelse } from "./useAuditlogg";

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
    const ref = await addDoc(collection(db, "rutiner"), {
      titel,
      innehall,
      bildUrl: bildUrl ?? null,
      omrade: omradeFalt,
      granskadDatum: serverTimestamp(),
      status: kraverGodkannande ? RUTIN_STATUS.UTKAST : RUTIN_STATUS.GODKAND,
      skapadAv,
      skapad: serverTimestamp(),
    });
    loggaHandelse({
      beskrivning: `Rutin skapad: "${titel}"`,
      entitetTyp: "rutin",
      entitetId: ref.id,
      uid: skapadAv,
    });
    return ref;
  }

  async function uppdateraRutin(id, falt, uid) {
    // Spara en ögonblicksbild av innehållet innan det skrivs över, så äldre versioner går att titta på
    const befintlig = rutiner.find((r) => r.id === id);
    if (befintlig) {
      const { id: _id, ...utanId } = befintlig;
      void _id;
      await addDoc(collection(db, "rutiner", id, "versioner"), {
        ...utanId,
        sparadVersionAv: uid ?? null,
        sparadVersionTidpunkt: serverTimestamp(),
      });
    }
    await updateDoc(doc(db, "rutiner", id), falt);
    loggaHandelse({ beskrivning: "Rutin uppdaterad", entitetTyp: "rutin", entitetId: id, uid });
  }

  async function godkannRutin(id, uid) {
    await updateDoc(doc(db, "rutiner", id), { status: RUTIN_STATUS.GODKAND });
    loggaHandelse({ beskrivning: "Rutin godkänd", entitetTyp: "rutin", entitetId: id, uid });
  }

  async function taBortRutin(id, uid) {
    await deleteDoc(doc(db, "rutiner", id));
    loggaHandelse({ beskrivning: "Rutin borttagen", entitetTyp: "rutin", entitetId: id, uid });
  }

  async function markeraGranskad(id, uid) {
    await updateDoc(doc(db, "rutiner", id), { granskadDatum: serverTimestamp() });
    loggaHandelse({ beskrivning: "Rutin markerad som granskad", entitetTyp: "rutin", entitetId: id, uid });
  }

  async function hamtaVersioner(id) {
    const q = query(collection(db, "rutiner", id, "versioner"), orderBy("sparadVersionTidpunkt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  return {
    rutiner,
    laddar,
    skapaRutin,
    uppdateraRutin,
    godkannRutin,
    taBortRutin,
    markeraGranskad,
    hamtaVersioner,
  };
}
