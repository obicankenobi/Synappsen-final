// Papperskorg – samlar mjukraderade rutiner, förrådsartiklar och anslag från alla områden,
// med möjlighet att återställa eller radera permanent.
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { loggaHandelse } from "./useAuditlogg";
import { useAuth } from "./useAuth";

function lyssnaPaBorttagna(samlingRef, organisationId, satt) {
  const q = query(samlingRef, where("organisationId", "==", organisationId), where("borttagen", "==", true));
  return onSnapshot(q, (snap) => {
    satt(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function usePapperskorg() {
  const { organisationId } = useAuth();
  const [rutiner, setRutiner] = useState([]);
  const [artiklar, setArtiklar] = useState([]);
  const [anslag, setAnslag] = useState([]);

  useEffect(() => {
    if (!organisationId) return undefined;
    const av1 = lyssnaPaBorttagna(collection(db, "rutiner"), organisationId, setRutiner);
    const av2 = lyssnaPaBorttagna(collection(db, "forradsartiklar"), organisationId, setArtiklar);
    const av3 = lyssnaPaBorttagna(collection(db, "anslag"), organisationId, setAnslag);
    return () => {
      av1();
      av2();
      av3();
    };
  }, [organisationId]);

  async function aterstall(samling, id, uid) {
    await updateDoc(doc(db, samling, id), { borttagen: false, borttagenAv: null, borttagenDatum: null });
    loggaHandelse({ beskrivning: `Återställde från papperskorgen (${samling})`, entitetTyp: samling, entitetId: id, uid, organisationId });
  }

  async function raderaPermanent(samling, id, uid) {
    await deleteDoc(doc(db, samling, id));
    loggaHandelse({ beskrivning: `Permanent raderad (${samling})`, entitetTyp: samling, entitetId: id, uid, organisationId });
  }

  return { rutiner, artiklar, anslag, aterstall, raderaPermanent };
}
