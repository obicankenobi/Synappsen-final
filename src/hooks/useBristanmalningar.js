// Etapp 20: bristanmälningar ("Slut/lågt saldo") på förrådsartiklar. Alla inloggade i
// organisationen får anmäla, bara förrådsansvarig/superadmin hanterar (se firestore.rules).
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";

export const BRIST_STATUS = {
  NY: "ny",
  HANTERAD: "hanterad",
  AVVISAD: "avvisad",
};

// Etapp 20b: dubblettskydd – samma artikel anmäld inom 24 h slås ihop till EN post istället
// för att skapa en ny, så förrådsansvarig ser "3 personer anmälde det här" i stället för tre
// separata rader.
const DUBBLETT_FONSTER_MS = 24 * 60 * 60 * 1000;

export function useBristanmalningar() {
  const { organisationId } = useAuth();
  const [bristanmalningar, setBristanmalningar] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    if (!organisationId) return undefined;
    const q = query(collection(db, "bristanmalningar"), where("organisationId", "==", organisationId));
    const unsubscribe = onSnapshot(q, (snap) => {
      setBristanmalningar(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLaddar(false);
    });
    return unsubscribe;
  }, [organisationId]);

  async function skapaBristanmalning({ artikelId, artikelNamn, forrad, kommentar, uid, namn }) {
    const nu = Date.now();
    const dubblett = bristanmalningar.find(
      (b) =>
        b.artikelId === artikelId &&
        b.status === BRIST_STATUS.NY &&
        nu - (b.senastAnmald?.toMillis?.() ?? b.tidpunkt?.toMillis?.() ?? 0) < DUBBLETT_FONSTER_MS
    );
    if (dubblett) {
      return updateDoc(doc(db, "bristanmalningar", dubblett.id), {
        antalAnmalningar: (dubblett.antalAnmalningar ?? 1) + 1,
        senastAnmald: serverTimestamp(),
      });
    }
    return addDoc(collection(db, "bristanmalningar"), {
      artikelId,
      artikelNamn,
      forrad,
      status: BRIST_STATUS.NY,
      kommentar: kommentar || "",
      antalAnmalningar: 1,
      anmaldAv: uid,
      anmaldAvNamn: namn ?? "",
      organisationId,
      tidpunkt: serverTimestamp(),
      senastAnmald: serverTimestamp(),
    });
  }

  async function hanteraBristanmalning(id, uid, namn) {
    return updateDoc(doc(db, "bristanmalningar", id), {
      status: BRIST_STATUS.HANTERAD,
      hanteradAv: uid ?? null,
      hanteradAvNamn: namn ?? "",
      hanteradDatum: serverTimestamp(),
    });
  }

  async function avvisaBristanmalning(id, uid, namn) {
    return updateDoc(doc(db, "bristanmalningar", id), {
      status: BRIST_STATUS.AVVISAD,
      hanteradAv: uid ?? null,
      hanteradAvNamn: namn ?? "",
      hanteradDatum: serverTimestamp(),
    });
  }

  return { bristanmalningar, laddar, skapaBristanmalning, hanteraBristanmalning, avvisaBristanmalning };
}
