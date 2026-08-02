// Etapp 39b: superadmin markerar ett datum ("införande av X", "granskningsrunda genomförd")
// för att kunna se förändringen i mätvärdestrenden omkring det. Klientskrivbar direkt (till
// skillnad från matvardenSnapshots), se firestore.rules-kommentaren för matvardenMarkeringar.
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useMatvardenMarkeringar(laddaLista) {
  const { organisationId, role, currentUser } = useAuth();
  const [markeringar, setMarkeringar] = useState([]);

  useEffect(() => {
    if (!laddaLista || !organisationId) return undefined;
    const q = query(
      collection(db, "organisationer", organisationId, "matvardenMarkeringar"),
      orderBy("datum", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => setMarkeringar(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (error) => {
        rapporteraNekadListning({ collection: "matvardenMarkeringar", roll: role, organisationId, fel: error });
      },
    );
    return unsubscribe;
  }, [laddaLista, organisationId, role]);

  async function skapaMarkering({ etikett, datum }) {
    return addDoc(collection(db, "organisationer", organisationId, "matvardenMarkeringar"), {
      etikett,
      datum,
      skapadAv: currentUser.uid,
      skapad: serverTimestamp(),
    });
  }

  async function taBortMarkering(id) {
    return deleteDoc(doc(db, "organisationer", organisationId, "matvardenMarkeringar", id));
  }

  return { markeringar, skapaMarkering, taBortMarkering };
}
