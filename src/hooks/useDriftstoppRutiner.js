// Etapp 72f: kuraterade driftstoppsrutiner, över ALLA områden (inte bara ett), sorterade på
// driftstoppOrdning. Exakt samma mönster som useAkutlageRutiner.js (Etapp 17c) – ingen
// orderBy i själva Firestore-frågan (undviker ett sammansatt index), sorteringen görs
// klientsidan istället, på en redan liten, kuraterad mängd (max ett fåtal poster).
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useDriftstoppRutiner() {
  const { organisationId, role } = useAuth();
  const [rutiner, setRutiner] = useState([]);
  const [laddar, setLaddar] = useState(true);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    // Samma bevisbarhetsresonemang som useAkutlageRutiner.js: frågan spänner över ALLA
    // områden, och rutiner/{rutinId}s läsregel kräver status=='godkand' ELLER redaktör FÖR
    // DET SPECIFIKA OMRÅDET – utan ett matchande where("status","==","godkand") kan
    // Firestore inte bevisa villkoret och nekar hela listningen för alla utom VÖL/superadmin.
    const q = query(
      collection(db, "rutiner"),
      where("organisationId", "==", organisationId),
      where("driftstopp", "==", true),
      where("status", "==", "godkand")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        // En arkiverad rutin ("gäller inte längre") ska aldrig synas i driftstoppsläget,
        // oavsett driftstopp-flaggan – samma patientsäkerhetsresonemang som akutläget.
        const alla = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => !r.borttagen && !r.arkiverad);
        alla.sort((a, b) => (a.driftstoppOrdning ?? 0) - (b.driftstoppOrdning ?? 0));
        setRutiner(alla);
        setLaddar(false);
        setFel(null);
      },
      (error) => {
        setLaddar(false);
        setFel(error);
        rapporteraNekadListning({ collection: "rutiner", roll: role, organisationId, sokvag: "driftstopp", fel: error });
      },
    );
    return unsubscribe;
  }, [organisationId, role]);

  return { rutiner, laddar, fel };
}
