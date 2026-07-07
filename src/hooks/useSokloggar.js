// Loggar sökningar som gav noll träffar, så att ledningen ser vilket innehåll som saknas.
// Endast superadmin kan läsa listan (se firestore.rules).
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export function useSokloggar(laddaLista) {
  const [sokloggar, setSokloggar] = useState([]);

  useEffect(() => {
    if (!laddaLista) return;
    const q = query(collection(db, "sokloggar"), orderBy("tidpunkt", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snap) => {
      setSokloggar(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [laddaLista]);

  async function loggaNollTraff(term, uid) {
    return addDoc(collection(db, "sokloggar"), {
      term,
      uid: uid ?? null,
      tidpunkt: serverTimestamp(),
    });
  }

  return { sokloggar, loggaNollTraff };
}
