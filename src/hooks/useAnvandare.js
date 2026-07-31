// Hämtning och rolladministration av användare – endast för superadmin
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";
import { uppdateraAnvandarRoll } from "../firebase/functions";

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

  // Etapp 32c: går numera via en Cloud Function (uppdateraAnvandarRoll) istället för en
  // direkt klient-skrivning, så att rolländringen loggas i revisionsloggen – tidigare
  // lämnade en ändring av t.ex. "vem som är superadmin" inga spår alls.
  async function uppdateraRoll(userId, roll) {
    return uppdateraAnvandarRoll(userId, roll);
  }

  return { anvandare, laddar, fel, uppdateraRoll };
}
