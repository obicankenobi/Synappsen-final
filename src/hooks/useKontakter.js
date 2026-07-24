// Kontaktlista – interna/externa telefonnummer, ren textlista (ingen ring-funktion i appen)
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { loggaHandelse } from "./useAuditlogg";
import { useAuth } from "./useAuth";
import { STANDARD_ORG } from "../firebase/organisation";

export function useKontakter() {
  const { organisationId } = useAuth();
  const [kontakter, setKontakter] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    if (!organisationId) return undefined;
    const q = query(
      collection(db, "kontakter"),
      where("organisationId", "==", organisationId),
      orderBy("kategori", "asc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setKontakter(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLaddar(false);
    });
    return unsubscribe;
  }, [organisationId]);

  async function skapaKontakt({ namn, nummer, kategori, beskrivning, uid }) {
    const ref = await addDoc(collection(db, "kontakter"), {
      namn,
      nummer,
      kategori: kategori || "Övrigt",
      beskrivning: beskrivning || "",
      organisationId: organisationId ?? STANDARD_ORG,
      skapad: serverTimestamp(),
    });
    loggaHandelse({ beskrivning: `Kontakt skapad: "${namn}"`, entitetTyp: "kontakt", entitetId: ref.id, uid, organisationId });
    return ref;
  }

  async function uppdateraKontakt(id, falt, uid) {
    await updateDoc(doc(db, "kontakter", id), falt);
    loggaHandelse({ beskrivning: "Kontakt uppdaterad", entitetTyp: "kontakt", entitetId: id, uid, organisationId });
  }

  async function taBortKontakt(id, uid) {
    await deleteDoc(doc(db, "kontakter", id));
    loggaHandelse({ beskrivning: "Kontakt borttagen", entitetTyp: "kontakt", entitetId: id, uid, organisationId });
  }

  return { kontakter, laddar, skapaKontakt, uppdateraKontakt, taBortKontakt };
}
