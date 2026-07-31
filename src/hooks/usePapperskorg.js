// Papperskorg – samlar mjukraderade rutiner, förrådsartiklar och anslag från alla områden,
// med möjlighet att återställa eller radera permanent.
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { loggaHandelse } from "./useAuditlogg";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

function lyssnaPaBorttagna(samlingNamn, organisationId, satt, roll, sattFel) {
  const q = query(
    collection(db, samlingNamn),
    where("organisationId", "==", organisationId),
    where("borttagen", "==", true)
  );
  return onSnapshot(
    q,
    (snap) => {
      satt(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      sattFel(null);
    },
    (error) => {
      sattFel(error);
      rapporteraNekadListning({ collection: samlingNamn, roll, organisationId, sokvag: "papperskorg", fel: error });
    },
  );
}

export function usePapperskorg() {
  const { organisationId, role } = useAuth();
  const [rutiner, setRutiner] = useState([]);
  const [artiklar, setArtiklar] = useState([]);
  const [anslag, setAnslag] = useState([]);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    const av1 = lyssnaPaBorttagna("rutiner", organisationId, setRutiner, role, setFel);
    const av2 = lyssnaPaBorttagna("forradsartiklar", organisationId, setArtiklar, role, setFel);
    const av3 = lyssnaPaBorttagna("anslag", organisationId, setAnslag, role, setFel);
    return () => {
      av1();
      av2();
      av3();
    };
  }, [organisationId, role]);

  async function aterstall(samling, id, uid) {
    await updateDoc(doc(db, samling, id), { borttagen: false, borttagenAv: null, borttagenDatum: null });
    loggaHandelse({ beskrivning: `Återställde från papperskorgen (${samling})`, entitetTyp: samling, entitetId: id, uid, organisationId });
  }

  async function raderaPermanent(samling, id, uid) {
    await deleteDoc(doc(db, samling, id));
    loggaHandelse({ beskrivning: `Permanent raderad (${samling})`, entitetTyp: samling, entitetId: id, uid, organisationId });
  }

  return { rutiner, artiklar, anslag, fel, aterstall, raderaPermanent };
}
