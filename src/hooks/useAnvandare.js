// Hämtning och rolladministration av användare – endast för superadmin
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";

export function useAnvandare() {
  const { organisationId } = useAuth();
  const [anvandare, setAnvandare] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    if (!organisationId) return undefined;
    // Begränsat till egen organisation – annars skulle en admin i org A se personallistan
    // för org B.
    const q = query(collection(db, "users"), where("organisationId", "==", organisationId));
    const unsubscribe = onSnapshot(q, (snap) => {
      setAnvandare(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLaddar(false);
    });
    return unsubscribe;
  }, [organisationId]);

  async function uppdateraRoll(userId, roll) {
    return updateDoc(doc(db, "users", userId), { role: roll });
  }

  return { anvandare, laddar, uppdateraRoll };
}
