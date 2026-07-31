// Etapp 3c: sparad historik från "Testa anslutningar" och den dagliga klinikstöd-
// verifieringen, så trender syns över tid i adminpanelen. Delad infrastruktur (som
// systemvarningar), medvetet INTE organisationsskopat – se firestore.rules.
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useHalsokontrollhistorik(laddaLista) {
  const [historik, setHistorik] = useState([]);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!laddaLista) return undefined;
    const q = query(collection(db, "halsokontrollhistorik"), orderBy("tidpunkt", "desc"), limit(20));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setHistorik(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "halsokontrollhistorik", organisationId: undefined, fel: error });
      },
    );
    return unsubscribe;
  }, [laddaLista]);

  return { historik, fel };
}
