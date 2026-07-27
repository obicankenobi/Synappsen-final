// Etapp 19a: tilldelningar av introduktionsspår. Dokument-id är användarens uid (en aktiv
// tilldelning åt gången). Progress beräknas INTE här utan i src/utils/introduktionProgress.js,
// utifrån de befintliga lasteAv-listorna på rutiner/anslag (se useLaskvittering.js) – ingen
// parallell "klar"-status lagras, enligt planens uttryckliga krav.
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";

export function useMinIntroduktionstilldelning() {
  const { currentUser } = useAuth();
  const [tilldelning, setTilldelning] = useState(undefined);

  useEffect(() => {
    if (!currentUser?.uid) return undefined;
    return onSnapshot(doc(db, "introduktionstilldelningar", currentUser.uid), (snap) => {
      setTilldelning(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
  }, [currentUser?.uid]);

  return { tilldelning, laddar: tilldelning === undefined };
}

// Chefsvyn – alla pågående tilldelningar i organisationen.
export function useAllaIntroduktionstilldelningar() {
  const { organisationId } = useAuth();
  const [tilldelningar, setTilldelningar] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    if (!organisationId) return undefined;
    const q = query(collection(db, "introduktionstilldelningar"), where("organisationId", "==", organisationId));
    const unsubscribe = onSnapshot(q, (snap) => {
      setTilldelningar(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLaddar(false);
    });
    return unsubscribe;
  }, [organisationId]);

  return { tilldelningar, laddar };
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
