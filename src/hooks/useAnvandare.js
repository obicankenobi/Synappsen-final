// Hämtning och rolladministration av användare – endast för superadmin
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useAnvandare() {
  const { organisationId, role } = useAuth();
  const [anvandare, setAnvandare] = useState([]);
  const [laddar, setLaddar] = useState(true);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    // Begränsat till egen organisation – annars skulle en admin i org A se personallistan
    // för org B.
    const q = query(collection(db, "users"), where("organisationId", "==", organisationId));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setAnvandare(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLaddar(false);
        setFel(null);
      },
      (error) => {
        setLaddar(false);
        setFel(error);
        rapporteraNekadListning({ collection: "users", roll: role, organisationId, fel: error });
      },
    );
    return unsubscribe;
  }, [organisationId, role]);

  async function uppdateraRoll(userId, roll) {
    return updateDoc(doc(db, "users", userId), { role: roll });
  }

  return { anvandare, laddar, fel, uppdateraRoll };
}
