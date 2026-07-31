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
    // Etapp 31b (bugfynd): samma constraint som useAkutlageRutiner.js – en fråga över ALLA
    // områden kan inte förlita sig på klientsidig statusfiltrering, regeln kräver ett
    // matchande where("status","==","godkand") för att listningen inte ska nekas helt för
    // den som inte är redaktör i något av områdena. Namnet lovade redan "alla GODKÄNDA" –
    // nu håller frågan själv det löftet, inte bara klientfiltret.
    const q = query(
      collection(db, "rutiner"),
      where("organisationId", "==", organisationId),
      where("status", "==", "godkand")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const alla = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => !r.borttagen);
      setRutiner(alla);
      setLaddar(false);
    });
    return unsubscribe;
  }, [organisationId]);

  return { rutiner, laddar };
}
