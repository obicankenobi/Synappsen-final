// Etapp 14d: läser revisionslogg-collectionen (Etapp 14a-c) för adminvyn. Ingen skrivning
// härifrån – revisionslogg är helt stängd för klienter (se firestore.rules), all skrivning
// sker via loggaRevision() i functions/index.js. Endast superadmin får läsa (samma
// behörighet som firestore.rules redan kräver).
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useRevisionslogg(laddaLista) {
  const { organisationId, role } = useAuth();
  const [revisionslogg, setRevisionslogg] = useState([]);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!laddaLista || !organisationId) return undefined;
    const q = query(
      collection(db, "revisionslogg"),
      where("organisationId", "==", organisationId),
      orderBy("tidpunkt", "desc"),
      limit(500)
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setRevisionslogg(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "revisionslogg", roll: role, organisationId, fel: error });
      },
    );
    return unsubscribe;
  }, [laddaLista, organisationId, role]);

  return { revisionslogg, fel };
}
