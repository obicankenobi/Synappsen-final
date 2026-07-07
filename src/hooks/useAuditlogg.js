// Ändringslogg (audit trail) – vem gjorde vad och när. Endast superadmin kan läsa listan
// (se firestore.rules). loggaHandelse() importeras och anropas från andra hooks vid
// skapa/ändra/godkänn/ta bort, så att alla väsentliga händelser fångas på ett ställe.
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export function useAuditlogg(laddaLista) {
  const [auditlogg, setAuditlogg] = useState([]);

  useEffect(() => {
    if (!laddaLista) return;
    const q = query(collection(db, "auditlogg"), orderBy("tidpunkt", "desc"), limit(100));
    const unsubscribe = onSnapshot(q, (snap) => {
      setAuditlogg(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [laddaLista]);

  return { auditlogg };
}

// Fristående funktion (ingen hook) så att den kan anropas från vilken CRUD-funktion som helst.
export async function loggaHandelse({ beskrivning, entitetTyp, entitetId, uid }) {
  return addDoc(collection(db, "auditlogg"), {
    beskrivning,
    entitetTyp: entitetTyp ?? null,
    entitetId: entitetId ?? null,
    uid: uid ?? null,
    tidpunkt: serverTimestamp(),
  });
}
