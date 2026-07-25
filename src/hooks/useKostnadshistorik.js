// Etapp 5: arkiverad AI-kostnad per avslutad månad (organisationer/{orgId}/kostnadshistorik),
// så adminpanelen kan visa en trend över tid istället för bara denna månads förbrukning
// (useGeminiBudget). Skrivs av functions/index.js reserveraBudget vid varje månadsskifte.
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";

export function useKostnadshistorik(laddaLista) {
  const { organisationId } = useAuth();
  const [historik, setHistorik] = useState([]);

  useEffect(() => {
    if (!laddaLista || !organisationId) return undefined;
    const q = query(
      collection(db, "organisationer", organisationId, "kostnadshistorik"),
      orderBy("manad", "desc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setHistorik(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [laddaLista, organisationId]);

  return { historik };
}
