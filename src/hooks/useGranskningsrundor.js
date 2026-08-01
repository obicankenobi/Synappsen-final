// Etapp 37b: riktade granskningsrundor. Bara superadmin läser/skriver denna collection (se
// firestore.rules) – ett arbetsverktyg för ledningen, inte en bredare vy (krav 14 i
// ETAPPLAN6.md). rutinIds är en oföränderlig ögonblicksbild tagen VID SKAPANDET, så vilka
// rutiner en runda omfattar aldrig kan ändras i efterhand.
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useGranskningsrundor() {
  const { organisationId, role } = useAuth();
  const [rundor, setRundor] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    if (!organisationId) return undefined;
    const q = query(collection(db, "granskningsrundor"), where("organisationId", "==", organisationId));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setRundor(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLaddar(false);
      },
      (error) => {
        setLaddar(false);
        rapporteraNekadListning({ collection: "granskningsrundor", roll: role, organisationId, fel: error });
      },
    );
    return unsubscribe;
  }, [organisationId, role]);

  async function startaRunda({ omrade, trosallDagar, deadline, rutinIds, uid, namn }) {
    return addDoc(collection(db, "granskningsrundor"), {
      organisationId,
      omrade,
      trosallDagar,
      deadline,
      rutinIds,
      skapadAv: uid,
      skapadAvNamn: namn ?? "",
      skapad: serverTimestamp(),
    });
  }

  async function taBortRunda(id) {
    return deleteDoc(doc(db, "granskningsrundor", id));
  }

  return { rundor, laddar, startaRunda, taBortRunda };
}
