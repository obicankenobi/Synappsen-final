// Ändringslogg (audit trail) – vem gjorde vad och när. Endast superadmin kan läsa listan
// (se firestore.rules). loggaHandelse() importeras och anropas från andra hooks vid
// skapa/ändra/godkänn/ta bort, så att alla väsentliga händelser fångas på ett ställe.
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { STANDARD_ORG } from "../firebase/organisation";

export function useAuditlogg(laddaLista) {
  const { organisationId } = useAuth();
  const [auditlogg, setAuditlogg] = useState([]);

  useEffect(() => {
    if (!laddaLista || !organisationId) return undefined;
    const q = query(
      collection(db, "auditlogg"),
      where("organisationId", "==", organisationId),
      orderBy("tidpunkt", "desc"),
      limit(100)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setAuditlogg(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [laddaLista, organisationId]);

  return { auditlogg };
}

// Fristående funktion (ingen hook) så att den kan anropas från vilken CRUD-funktion som helst.
// organisationId måste skickas in av anroparen (som redan har den via useAuth()) eftersom
// detta inte är en hook och därför inte kan läsa kontext själv.
export async function loggaHandelse({ beskrivning, entitetTyp, entitetId, uid, organisationId }) {
  return addDoc(collection(db, "auditlogg"), {
    beskrivning,
    entitetTyp: entitetTyp ?? null,
    entitetId: entitetId ?? null,
    uid: uid ?? null,
    organisationId: organisationId ?? STANDARD_ORG,
    tidpunkt: serverTimestamp(),
  });
}
