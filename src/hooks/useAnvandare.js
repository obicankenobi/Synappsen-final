// Hämtning och rolladministration av användare – endast för superadmin
import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export function useAnvandare() {
  const [anvandare, setAnvandare] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snap) => {
      setAnvandare(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLaddar(false);
    });
    return unsubscribe;
  }, []);

  async function uppdateraRoll(userId, roll) {
    return updateDoc(doc(db, "users", userId), { role: roll });
  }

  return { anvandare, laddar, uppdateraRoll };
}
