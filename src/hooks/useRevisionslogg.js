// Etapp 14d: läser revisionslogg-collectionen (Etapp 14a-c) för adminvyn. Ingen skrivning
// härifrån – revisionslogg är helt stängd för klienter (se firestore.rules), all skrivning
// sker via loggaRevision() i functions/index.js. Endast superadmin får läsa (samma
// behörighet som firestore.rules redan kräver).
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";

export function useRevisionslogg(laddaLista) {
  const { organisationId } = useAuth();
  const [revisionslogg, setRevisionslogg] = useState([]);

  useEffect(() => {
    if (!laddaLista || !organisationId) return undefined;
    const q = query(
      collection(db, "revisionslogg"),
      where("organisationId", "==", organisationId),
      orderBy("tidpunkt", "desc"),
      limit(500)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setRevisionslogg(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [laddaLista, organisationId]);

  return { revisionslogg };
}
