// Länkbibliotek – externa resurser (FASS, Internetmedicin, regionala PM osv.)
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
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useLankbibliotek() {
  const { organisationId, role } = useAuth();
  const [lankar, setLankar] = useState([]);
  const [laddar, setLaddar] = useState(true);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    const q = query(
      collection(db, "lankbibliotek"),
      where("organisationId", "==", organisationId),
      orderBy("kategori", "asc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setLankar(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLaddar(false);
        setFel(null);
      },
      (error) => {
        setLaddar(false);
        setFel(error);
        rapporteraNekadListning({ collection: "lankbibliotek", roll: role, organisationId, fel: error });
      },
    );
    return unsubscribe;
  }, [organisationId, role]);

  async function skapaLank({ titel, url, kategori, beskrivning, uid }) {
    const ref = await addDoc(collection(db, "lankbibliotek"), {
      titel,
      url,
      kategori: kategori || "Övrigt",
      beskrivning: beskrivning || "",
      organisationId: organisationId ?? STANDARD_ORG,
      skapad: serverTimestamp(),
    });
    loggaHandelse({ beskrivning: `Länk skapad: "${titel}"`, entitetTyp: "lank", entitetId: ref.id, uid, organisationId });
    return ref;
  }

  async function uppdateraLank(id, falt, uid) {
    await updateDoc(doc(db, "lankbibliotek", id), falt);
    loggaHandelse({ beskrivning: "Länk uppdaterad", entitetTyp: "lank", entitetId: id, uid, organisationId });
  }

  async function taBortLank(id, uid) {
    await deleteDoc(doc(db, "lankbibliotek", id));
    loggaHandelse({ beskrivning: "Länk borttagen", entitetTyp: "lank", entitetId: id, uid, organisationId });
  }

  return { lankar, laddar, fel, skapaLank, uppdateraLank, taBortLank };
}
