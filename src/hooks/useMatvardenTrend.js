// Etapp 39a: veckovisa mätvärdessnapshots (organisationer/{orgId}/matvardenSnapshots), så
// ledningsrapporten kan visa en trend istället för bara ett ögonblicksvärde. Skrivs av
// functions/index.js skapaMatvardenSnapshot varje måndag 02:00.
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useMatvardenTrend(laddaLista) {
  const { organisationId, role } = useAuth();
  const [snapshots, setSnapshots] = useState([]);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!laddaLista || !organisationId) return undefined;
    const q = query(
      collection(db, "organisationer", organisationId, "matvardenSnapshots"),
      orderBy("datum", "desc"),
      limit(12)
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setSnapshots(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "matvardenSnapshots", roll: role, organisationId, fel: error });
      },
    );
    return unsubscribe;
  }, [laddaLista, organisationId, role]);

  return { snapshots, fel };
}
