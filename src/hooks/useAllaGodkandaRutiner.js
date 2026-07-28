// Etapp 19c: kompetensmatrisen behöver kunna referera obligatoriska rutiner oavsett vilket
// område de tillhör (kliniskt stöd, logistik, administration) – samma över-alla-områden-mönster
// som useAkutlageRutiner.js, men utan akutlage-filtret.
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";

export function useAllaGodkandaRutiner() {
  const { organisationId } = useAuth();
  const [rutiner, setRutiner] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    if (!organisationId) return undefined;
    const q = query(collection(db, "rutiner"), where("organisationId", "==", organisationId));
    const unsubscribe = onSnapshot(q, (snap) => {
      const alla = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((r) => r.status === "godkand" && !r.borttagen);
      setRutiner(alla);
      setLaddar(false);
    });
    return unsubscribe;
  }, [organisationId]);

  return { rutiner, laddar };
}
