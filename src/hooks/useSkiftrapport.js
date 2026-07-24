// Skiftrapport – korta, praktiska driftmeddelanden mellan skift (t.ex. "vattenläcka i taket",
// "slut på sutur-set"). Får ALDRIG innehålla patientinformation. Alla inloggade kan skapa och
// markera som åtgärdat. Poster äldre än 48 timmar visas som standard inte i huvudlistan.
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

const VISNINGSGRANS_TIMMAR = 48;

export function useSkiftrapport() {
  const { organisationId } = useAuth();
  const [poster, setPoster] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    if (!organisationId) return undefined;
    const q = query(
      collection(db, "skiftrapporter"),
      where("organisationId", "==", organisationId),
      orderBy("skapad", "desc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setPoster(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLaddar(false);
    });
    return unsubscribe;
  }, [organisationId]);

  async function skapaPost({ text, skapadAv, skapadAvNamn }) {
    const ref = await addDoc(collection(db, "skiftrapporter"), {
      text,
      atgardad: false,
      atgardadAv: null,
      organisationId: organisationId ?? STANDARD_ORG,
      skapadAv,
      skapadAvNamn: skapadAvNamn ?? "",
      skapad: serverTimestamp(),
    });
    loggaHandelse({
      beskrivning: "Skiftrapport skapad",
      entitetTyp: "skiftrapport",
      entitetId: ref.id,
      uid: skapadAv,
      organisationId,
    });
    return ref;
  }

  async function markeraAtgardad(id, uid) {
    await updateDoc(doc(db, "skiftrapporter", id), { atgardad: true, atgardadAv: uid });
    loggaHandelse({ beskrivning: "Skiftrapport åtgärdad", entitetTyp: "skiftrapport", entitetId: id, uid, organisationId });
  }

  async function taBortPost(id, uid) {
    await deleteDoc(doc(db, "skiftrapporter", id));
    loggaHandelse({ beskrivning: "Skiftrapport borttagen", entitetTyp: "skiftrapport", entitetId: id, uid, organisationId });
  }

  const grans = new Date();
  grans.setHours(grans.getHours() - VISNINGSGRANS_TIMMAR);

  const aktiva = poster.filter((p) => !p.atgardad && (!p.skapad?.toDate || p.skapad.toDate() >= grans));
  const atgardadeSenaste = poster.filter((p) => p.atgardad && (!p.skapad?.toDate || p.skapad.toDate() >= grans));

  return { aktiva, atgardadeSenaste, laddar, skapaPost, markeraAtgardad, taBortPost };
}
