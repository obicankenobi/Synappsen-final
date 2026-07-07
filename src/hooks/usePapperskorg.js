// Papperskorg – samlar mjukraderade rutiner, förrådsartiklar och anslag från alla områden,
// med möjlighet att återställa eller radera permanent.
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { loggaHandelse } from "./useAuditlogg";

function lyssnaPaBorttagna(samlingRef, satt) {
  const q = query(samlingRef, where("borttagen", "==", true));
  return onSnapshot(q, (snap) => {
    satt(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function usePapperskorg() {
  const [rutiner, setRutiner] = useState([]);
  const [artiklar, setArtiklar] = useState([]);
  const [anslag, setAnslag] = useState([]);

  useEffect(() => {
    const av1 = lyssnaPaBorttagna(collection(db, "rutiner"), setRutiner);
    const av2 = lyssnaPaBorttagna(collection(db, "forradsartiklar"), setArtiklar);
    const av3 = lyssnaPaBorttagna(collection(db, "anslag"), setAnslag);
    return () => {
      av1();
      av2();
      av3();
    };
  }, []);

  async function aterstall(samling, id, uid) {
    await updateDoc(doc(db, samling, id), { borttagen: false, borttagenAv: null, borttagenDatum: null });
    loggaHandelse({ beskrivning: `Återställde från papperskorgen (${samling})`, entitetTyp: samling, entitetId: id, uid });
  }

  async function raderaPermanent(samling, id, uid) {
    await deleteDoc(doc(db, samling, id));
    loggaHandelse({ beskrivning: `Permanent raderad (${samling})`, entitetTyp: samling, entitetId: id, uid });
  }

  return { rutiner, artiklar, anslag, aterstall, raderaPermanent };
}
