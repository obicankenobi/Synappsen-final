// Hämtning och hantering av rutiner (CRUD + godkännandeflöde) för en sektion
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { loggaHandelse } from "./useAuditlogg";
import { useAuth } from "./useAuth";
import { STANDARD_ORG } from "../firebase/organisation";

export const RUTIN_STATUS = {
  UTKAST: "utkast",
  GODKAND: "godkand",
};

export function useRutiner(omrade) {
  const { organisationId } = useAuth();
  const [rutiner, setRutiner] = useState([]);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    if (!organisationId) return undefined;
    const q = query(
      collection(db, "rutiner"),
      where("organisationId", "==", organisationId),
      where("omrade", "==", omrade),
      orderBy("skapad", "desc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      // Mjukraderade rutiner (papperskorg) filtreras bort ur den vanliga listan
      setRutiner(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => !r.borttagen));
      setLaddar(false);
    });
    return unsubscribe;
  }, [omrade, organisationId]);

  async function skapaRutin({
    titel,
    innehall,
    bildUrl,
    omrade: omradeFalt,
    skapadAv,
    kraverGodkannande = true,
  }) {
    const ref = await addDoc(collection(db, "rutiner"), {
      titel,
      innehall,
      bildUrl: bildUrl ?? null,
      omrade: omradeFalt,
      organisationId: organisationId ?? STANDARD_ORG,
      granskadDatum: serverTimestamp(),
      status: kraverGodkannande ? RUTIN_STATUS.UTKAST : RUTIN_STATUS.GODKAND,
      skapadAv,
      skapad: serverTimestamp(),
    });
    loggaHandelse({
      beskrivning: `Rutin skapad: "${titel}"`,
      entitetTyp: "rutin",
      entitetId: ref.id,
      uid: skapadAv,
      organisationId,
    });
    return ref;
  }

  async function uppdateraRutin(id, falt, uid) {
    // Spara en ögonblicksbild av innehållet innan det skrivs över, så äldre versioner går att titta på
    const befintlig = rutiner.find((r) => r.id === id);
    if (befintlig) {
      const { id: _id, ...utanId } = befintlig;
      void _id;
      await addDoc(collection(db, "rutiner", id, "versioner"), {
        ...utanId,
        sparadVersionAv: uid ?? null,
        sparadVersionTidpunkt: serverTimestamp(),
      });
    }
    await updateDoc(doc(db, "rutiner", id), falt);
    loggaHandelse({ beskrivning: "Rutin uppdaterad", entitetTyp: "rutin", entitetId: id, uid, organisationId });
  }

  async function godkannRutin(id, uid, namn) {
    await updateDoc(doc(db, "rutiner", id), {
      status: RUTIN_STATUS.GODKAND,
      godkandAv: uid ?? null,
      godkandAvNamn: namn ?? "",
      godkandDatum: serverTimestamp(),
    });
    loggaHandelse({ beskrivning: "Rutin godkänd", entitetTyp: "rutin", entitetId: id, uid, organisationId });
  }

  // Mjuk radering – rutinen hamnar i papperskorgen istället för att raderas direkt
  async function taBortRutin(id, uid) {
    await updateDoc(doc(db, "rutiner", id), {
      borttagen: true,
      borttagenAv: uid ?? null,
      borttagenDatum: serverTimestamp(),
    });
    loggaHandelse({ beskrivning: "Rutin borttagen", entitetTyp: "rutin", entitetId: id, uid, organisationId });
  }

  async function markeraGranskad(id, uid, namn) {
    await updateDoc(doc(db, "rutiner", id), {
      granskadDatum: serverTimestamp(),
      granskadAv: uid ?? null,
      granskadAvNamn: namn ?? "",
    });
    loggaHandelse({ beskrivning: "Rutin markerad som granskad", entitetTyp: "rutin", entitetId: id, uid, organisationId });
  }

  async function hamtaVersioner(id) {
    const q = query(collection(db, "rutiner", id, "versioner"), orderBy("sparadVersionTidpunkt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  return {
    rutiner,
    laddar,
    skapaRutin,
    uppdateraRutin,
    godkannRutin,
    taBortRutin,
    markeraGranskad,
    hamtaVersioner,
  };
}

// Etapp 18c: en enskild rutin oavsett vilket område den tillhör – körvyn navigeras till via
// /checklista/{rutinId}, som inte i sig vet vilket område rutinen ligger i.
export function useRutin(id) {
  const [rutin, setRutin] = useState(undefined);

  useEffect(() => {
    if (!id) return undefined;
    return onSnapshot(doc(db, "rutiner", id), (snap) => {
      setRutin(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
  }, [id]);

  return { rutin, laddar: rutin === undefined };
}
