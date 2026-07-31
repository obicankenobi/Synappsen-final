// Loggar sökningar som gav noll träffar, så att ledningen ser vilket innehåll som saknas.
// Endast superadmin kan läsa listan (se firestore.rules).
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { STANDARD_ORG } from "../firebase/organisation";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useSokloggar(laddaLista) {
  const { organisationId, role } = useAuth();
  const [sokloggar, setSokloggar] = useState([]);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!laddaLista || !organisationId) return undefined;
    const q = query(
      collection(db, "sokloggar"),
      where("organisationId", "==", organisationId),
      orderBy("tidpunkt", "desc"),
      limit(50)
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setSokloggar(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "sokloggar", roll: role, organisationId, fel: error });
      },
    );
    return unsubscribe;
  }, [laddaLista, organisationId, role]);

  async function loggaNollTraff(term, uid) {
    return addDoc(collection(db, "sokloggar"), {
      term,
      uid: uid ?? null,
      organisationId: organisationId ?? STANDARD_ORG,
      tidpunkt: serverTimestamp(),
    });
  }

  return { sokloggar, fel, loggaNollTraff };
}
