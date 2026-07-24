// Data om klinikstöd-sökningen som redan samlas in (skrivs via andra vägar – se
// KlinikfragaSok.jsx för feedback och functions/index.js/fragaKlinisktStod för frågeloggen),
// men som fram tills nu inte visades någonstans. Endast superadmin kan läsa listorna (se
// firestore.rules) – frågeloggen är dessutom anonym (inget uid sparas där).
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

export function useKlinikfrageStatistik(laddaLista) {
  const [feedback, setFeedback] = useState([]);
  const [fragor, setFragor] = useState([]);

  useEffect(() => {
    if (!laddaLista) return undefined;
    const q = query(collection(db, "klinikfragefeedback"), orderBy("tidpunkt", "desc"), limit(200));
    const unsubscribe = onSnapshot(q, (snap) => {
      setFeedback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [laddaLista]);

  useEffect(() => {
    if (!laddaLista) return undefined;
    const q = query(collection(db, "klinikfrageloggar"), orderBy("tidpunkt", "desc"), limit(200));
    const unsubscribe = onSnapshot(q, (snap) => {
      setFragor(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [laddaLista]);

  return { feedback, fragor };
}
