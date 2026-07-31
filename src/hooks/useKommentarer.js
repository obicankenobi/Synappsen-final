// Kommentarer/frågor kopplade till en rutin
import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { skapaKommentar as skapaKommentarAnrop } from "../firebase/functions";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useKommentarer(rutinId) {
  const { organisationId, role } = useAuth();
  const [kommentarer, setKommentarer] = useState([]);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!rutinId || !organisationId) return undefined;
    // rutinId är i sig unikt per rutin oavsett organisation (slumpat Firestore-id), men
    // organisationId krävs ändå strukturellt för att frågan ska godkännas av en
    // organisationsmedveten läsregel (se firestore.rules).
    const q = query(
      collection(db, "kommentarer"),
      where("organisationId", "==", organisationId),
      where("rutinId", "==", rutinId),
      orderBy("skapad", "asc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setKommentarer(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "kommentarer", roll: role, organisationId, sokvag: rutinId, fel: error });
      },
    );
    return unsubscribe;
  }, [rutinId, organisationId, role]);

  // Skapas via en Cloud Function (inte en direkt Firestore-skrivning) så att personnummer-
  // spärren och hastighetsbegränsningen körs server-side. @omnämnanden räknas ut av
  // funktionen utifrån den faktiska texten, klientens egen gissning ignoreras.
  async function skapaKommentar({ text, svarPa = null }) {
    return skapaKommentarAnrop({ rutinId, text, svarPa });
  }

  async function taBortKommentar(id) {
    return deleteDoc(doc(db, "kommentarer", id));
  }

  return { kommentarer, fel, skapaKommentar, taBortKommentar };
}
