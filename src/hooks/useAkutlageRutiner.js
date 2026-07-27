// Etapp 17c: kuraterade akutlägesrutiner, över ALLA områden (inte bara ett), sorterade på
// akutlageOrdning. Ingen orderBy i själva Firestore-frågan (undviker ett sammansatt index,
// samma mönster som useOfflineCenter.js) – sorteringen görs klientsidan istället, på en
// redan liten, kuraterad mängd (max ett fåtal poster).
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";

export function useAkutlageRutiner() {
  const { organisationId } = useAuth();
  const [rutiner, setRutiner] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    if (!organisationId) return undefined;
    const q = query(
      collection(db, "rutiner"),
      where("organisationId", "==", organisationId),
      where("akutlage", "==", true)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const alla = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((r) => r.status === "godkand" && !r.borttagen);
      alla.sort((a, b) => (a.akutlageOrdning ?? 0) - (b.akutlageOrdning ?? 0));
      setRutiner(alla);
      setLaddar(false);
    });
    return unsubscribe;
  }, [organisationId]);

  return { rutiner, laddar };
}
