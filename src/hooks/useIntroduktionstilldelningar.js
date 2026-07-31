// Etapp 19a: tilldelningar av introduktionsspår. Dokument-id är användarens uid (en aktiv
// tilldelning åt gången). Progress beräknas INTE här utan i src/utils/introduktionProgress.js,
// utifrån de befintliga lasteAv-listorna på rutiner/anslag (se useLaskvittering.js) – ingen
// parallell "klar"-status lagras, enligt planens uttryckliga krav.
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useMinIntroduktionstilldelning() {
  const { currentUser, role, organisationId } = useAuth();
  const [tilldelning, setTilldelning] = useState(undefined);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) return undefined;
    return onSnapshot(
      doc(db, "introduktionstilldelningar", currentUser.uid),
      (snap) => {
        setTilldelning(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "introduktionstilldelningar", roll: role, organisationId, fel: error });
      },
    );
  }, [currentUser?.uid, role, organisationId]);

  return { tilldelning, laddar: tilldelning === undefined, fel };
}

// Chefsvyn – alla pågående tilldelningar i organisationen.
export function useAllaIntroduktionstilldelningar() {
  const { organisationId, role } = useAuth();
  const [tilldelningar, setTilldelningar] = useState([]);
  const [laddar, setLaddar] = useState(true);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    const q = query(collection(db, "introduktionstilldelningar"), where("organisationId", "==", organisationId));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setTilldelningar(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLaddar(false);
        setFel(null);
      },
      (error) => {
        setLaddar(false);
        setFel(error);
        rapporteraNekadListning({ collection: "introduktionstilldelningar", roll: role, organisationId, fel: error });
      },
    );
    return unsubscribe;
  }, [organisationId, role]);

  return { tilldelningar, laddar, fel };
}

// Manuell tilldelning av VEC/superadmin (utöver den automatiska vid inbjudan, se
// losInInbjudan i functions/index.js).
export async function tilldelaIntroduktionsspar({ uid, namn, organisationId, spar }) {
  await setDoc(doc(db, "introduktionstilldelningar", uid), {
    uid,
    namn,
    organisationId,
    sparId: spar.id,
    sparNamn: spar.namn,
    malRoll: spar.malRoll,
    tilldelad: serverTimestamp(),
  });
}

export async function taBortIntroduktionstilldelning(uid) {
  await deleteDoc(doc(db, "introduktionstilldelningar", uid));
}
