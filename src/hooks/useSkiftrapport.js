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
import { rapporteraNekadListning } from "../firebase/felrapportering";

const VISNINGSGRANS_TIMMAR = 48;

export function useSkiftrapport() {
  const { organisationId, role } = useAuth();
  const [poster, setPoster] = useState([]);
  const [laddar, setLaddar] = useState(true);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    const q = query(
      collection(db, "skiftrapporter"),
      where("organisationId", "==", organisationId),
      orderBy("skapad", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setPoster(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLaddar(false);
        setFel(null);
      },
      (error) => {
        setLaddar(false);
        setFel(error);
        rapporteraNekadListning({ collection: "skiftrapporter", roll: role, organisationId, fel: error });
      },
    );
    return unsubscribe;
  }, [organisationId, role]);

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

  // Etapp 66d: kategori/rutinId sätts I EFTERHAND (t.ex. när det blir tydligt vilken rutin som
  // faktiskt gäller), skilt från skapaPost. `falt` kan innehålla endera eller båda fälten –
  // reglerna tillåter inget annat att ändras samtidigt (se firestore.rules
  // skiftrapporter/{postId} allow update).
  async function kategoriseraPost(id, falt, uid) {
    await updateDoc(doc(db, "skiftrapporter", id), falt);
    loggaHandelse({
      beskrivning: "Skiftrapport kategoriserad/länkad till rutin",
      entitetTyp: "skiftrapport",
      entitetId: id,
      uid,
      organisationId,
    });
  }

  async function taBortPost(id, uid) {
    await deleteDoc(doc(db, "skiftrapporter", id));
    loggaHandelse({ beskrivning: "Skiftrapport borttagen", entitetTyp: "skiftrapport", entitetId: id, uid, organisationId });
  }

  const grans = new Date();
  grans.setHours(grans.getHours() - VISNINGSGRANS_TIMMAR);

  const aktiva = poster.filter((p) => !p.atgardad && (!p.skapad?.toDate || p.skapad.toDate() >= grans));
  const atgardadeSenaste = poster.filter((p) => p.atgardad && (!p.skapad?.toDate || p.skapad.toDate() >= grans));

  // Etapp 66d: frågan har ingen tidsbegränsning (ingen where/limit på skapad), så `poster`
  // innehåller redan HELA historiken – standardvyerna ovan filtrerar bara ner den. En
  // driftstörningslogg som ska gå att följa upp behöver kunna visa mer än 48 timmar, utan att
  // det kräver en egen Firestore-fråga eller ändrar standardvyns beteende.
  return { aktiva, atgardadeSenaste, alla: poster, laddar, fel, skapaPost, markeraAtgardad, kategoriseraPost, taBortPost };
}
