// Anslagstavla – meddelanden från ledningen till all personal
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
} from "firebase/firestore";
import { db } from "../firebase/config";
import { loggaHandelse } from "./useAuditlogg";
import { useAuth } from "./useAuth";
import { STANDARD_ORG } from "../firebase/organisation";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export const ANSLAG_PRIORITET = {
  VIKTIGT: "viktigt",
  INFO: "info",
};

export function useAnslag() {
  const { organisationId, role } = useAuth();
  const [anslag, setAnslag] = useState([]);
  const [laddar, setLaddar] = useState(true);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    const q = query(
      collection(db, "anslag"),
      where("organisationId", "==", organisationId),
      orderBy("skapad", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setAnslag(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLaddar(false);
        setFel(null);
      },
      (error) => {
        setLaddar(false);
        setFel(error);
        rapporteraNekadListning({ collection: "anslag", roll: role, organisationId, fel: error });
      },
    );
    return unsubscribe;
  }, [organisationId, role]);

  async function skapaAnslag({
    titel,
    innehall,
    fastNaglad,
    prioritet,
    utgangsdatum,
    kvitteringsfrist,
    skapadAv,
    skapadAvNamn,
  }) {
    const ref = await addDoc(collection(db, "anslag"), {
      titel,
      innehall,
      fastNaglad: Boolean(fastNaglad),
      prioritet: prioritet || ANSLAG_PRIORITET.INFO,
      utgangsdatum: utgangsdatum || null,
      kvitteringsfrist: kvitteringsfrist || null,
      organisationId: organisationId ?? STANDARD_ORG,
      skapadAv,
      skapadAvNamn: skapadAvNamn ?? "",
      skapad: serverTimestamp(),
    });
    loggaHandelse({
      beskrivning: `Anslag skapat: "${titel}"`,
      entitetTyp: "anslag",
      entitetId: ref.id,
      uid: skapadAv,
      organisationId,
    });
    return ref;
  }

  async function uppdateraAnslag(id, falt, uid) {
    await updateDoc(doc(db, "anslag", id), falt);
    loggaHandelse({ beskrivning: "Anslag uppdaterat", entitetTyp: "anslag", entitetId: id, uid, organisationId });
  }

  // Mjuk radering – anslaget hamnar i papperskorgen istället för att raderas direkt
  async function taBortAnslag(id, uid) {
    await updateDoc(doc(db, "anslag", id), {
      borttagen: true,
      borttagenAv: uid ?? null,
      borttagenDatum: serverTimestamp(),
    });
    loggaHandelse({ beskrivning: "Anslag borttaget", entitetTyp: "anslag", entitetId: id, uid, organisationId });
  }

  // Fastnaglade anslag högst upp, sedan viktiga, sedan nyast först. Utgångna/borttagna anslag filtreras bort.
  const nu = new Date();
  const synligaAnslag = anslag
    .filter((a) => !a.borttagen && (!a.utgangsdatum || new Date(a.utgangsdatum) >= nu))
    .sort((a, b) => {
      if (Boolean(b.fastNaglad) !== Boolean(a.fastNaglad)) return (b.fastNaglad ? 1 : 0) - (a.fastNaglad ? 1 : 0);
      const aViktigt = a.prioritet === ANSLAG_PRIORITET.VIKTIGT;
      const bViktigt = b.prioritet === ANSLAG_PRIORITET.VIKTIGT;
      return (bViktigt ? 1 : 0) - (aViktigt ? 1 : 0);
    });

  return { anslag: synligaAnslag, laddar, fel, skapaAnslag, uppdateraAnslag, taBortAnslag };
}
