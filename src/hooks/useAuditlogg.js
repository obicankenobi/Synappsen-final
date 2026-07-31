// Ändringslogg (audit trail) – vem gjorde vad och när. Endast superadmin kan läsa listan
// (se firestore.rules). loggaHandelse() importeras och anropas från andra hooks vid
// skapa/ändra/godkänn/ta bort, så att alla väsentliga händelser fångas på ett ställe.
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { STANDARD_ORG } from "../firebase/organisation";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useAuditlogg(laddaLista) {
  const { organisationId, role } = useAuth();
  const [auditlogg, setAuditlogg] = useState([]);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!laddaLista || !organisationId) return undefined;
    const q = query(
      collection(db, "auditlogg"),
      where("organisationId", "==", organisationId),
      orderBy("tidpunkt", "desc"),
      limit(100)
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setAuditlogg(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "auditlogg", roll: role, organisationId, fel: error });
      },
    );
    return unsubscribe;
  }, [laddaLista, organisationId, role]);

  return { auditlogg, fel };
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
