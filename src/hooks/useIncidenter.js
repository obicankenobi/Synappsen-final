// Etapp L1p punkt 3 (intern/ETAPPLAN-INTERN-1.md): direkt klientläsning av incidenter/{id},
// gated av firestore.rules (arPlattformsadmin()) – samma mönster som useAtagandekalender.js.
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useIncidenter() {
  const { organisationId, role } = useAuth();
  const [incidenter, setIncidenter] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    const avsluta = onSnapshot(
      collection(db, "incidenter"),
      (snap) => {
        setIncidenter(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLaddar(false);
      },
      (fel) => {
        setLaddar(false);
        rapporteraNekadListning({ collection: "incidenter", roll: role, organisationId, fel });
      }
    );
    return avsluta;
  }, [organisationId, role]);

  return { incidenter, laddar };
}
