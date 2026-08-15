// Hämtning och rolladministration av användare – endast för superadmin
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";
import { uppdateraAnvandarRoll } from "../firebase/functions";
import { loggaHandelse } from "./useAuditlogg";

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

  // Etapp 66c: till skillnad från roll (Etapp 32c, ovan) kräver ansvarsomraden ingen Cloud
  // Function – reglerna tillåter redan superadmin att skriva vilket fält som helst utom
  // role direkt (se firestore.rules users/{userId}), och det här är inte en identitetshöjande
  // ändring på samma sätt som en rolländring. Loggas ändå i revisionsloggen, samma
  // ansvarsprincip som resten av adminpanelens skrivningar.
  async function uppdateraAnsvarsomraden(userId, omraden, uid, organisationId) {
    await updateDoc(doc(db, "users", userId), { ansvarsomraden: omraden });
    loggaHandelse({
      beskrivning: "Ansvarsområden uppdaterade",
      entitetTyp: "anvandare",
      entitetId: userId,
      uid,
      organisationId,
    });
  }

  return { anvandare, laddar, fel, uppdateraRoll, uppdateraAnsvarsomraden };
}
