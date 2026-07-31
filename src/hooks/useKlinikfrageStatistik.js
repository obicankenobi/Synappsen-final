// Data om klinikstöd-sökningen som redan samlas in (skrivs via andra vägar – se
// KlinikfragaSok.jsx för feedback och functions/index.js/fragaKlinisktStod för frågeloggen),
// men som fram tills nu inte visades någonstans. Endast superadmin kan läsa listorna (se
// firestore.rules) – frågeloggen är dessutom anonym (inget uid sparas där).
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useKlinikfrageStatistik(laddaLista) {
  const { organisationId, role } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [fragor, setFragor] = useState([]);
  const [felFeedback, setFelFeedback] = useState(null);
  const [felFragor, setFelFragor] = useState(null);

  useEffect(() => {
    if (!laddaLista || !organisationId) return undefined;
    const q = query(
      collection(db, "klinikfragefeedback"),
      where("organisationId", "==", organisationId),
      orderBy("tidpunkt", "desc"),
      limit(200)
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setFeedback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setFelFeedback(null);
      },
      (error) => {
        setFelFeedback(error);
        rapporteraNekadListning({ collection: "klinikfragefeedback", roll: role, organisationId, fel: error });
      },
    );
    return unsubscribe;
  }, [laddaLista, organisationId, role]);

  useEffect(() => {
    if (!laddaLista || !organisationId) return undefined;
    const q = query(
      collection(db, "klinikfrageloggar"),
      where("organisationId", "==", organisationId),
      orderBy("tidpunkt", "desc"),
      limit(200)
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setFragor(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setFelFragor(null);
      },
      (error) => {
        setFelFragor(error);
        rapporteraNekadListning({ collection: "klinikfrageloggar", roll: role, organisationId, fel: error });
      },
    );
    return unsubscribe;
  }, [laddaLista, organisationId, role]);

  return { feedback, fragor, felFeedback, felFragor };
}
