// Etapp 18d: aggregerad, personkopplingsfri användningsstatistik för checklistläget – se
// SAKERHETSRAPPORT.md (tillägget om Etapp 18) för varför: en logg med patientkoppling vore
// journalföring. Ett enda ackumulerande dokument per rutin (samma mönster som visningar/
// useVisningar.js), aldrig en rad per körning – annars börjar det likna en tidslinje över
// enskilda händelser igen.
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, setDoc, increment, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export async function registreraChecklistaPaborjad(rutinId, organisationId) {
  await setDoc(
    doc(db, "checklistkorningar", rutinId),
    { organisationId, antalPaborjade: increment(1) },
    { merge: true }
  );
}

export async function registreraChecklistaSlutford(rutinId, organisationId, tidMs) {
  await setDoc(
    doc(db, "checklistkorningar", rutinId),
    { organisationId, antalSlutforda: increment(1), totalTidMs: increment(Math.max(0, Math.round(tidMs))) },
    { merge: true }
  );
}

// Bästa-försök-signal (inte 100% pålitlig – täcker "Avsluta"-knappen och avmontering, inte
// t.ex. att fliken stängs helt) om vilket steg flest ger upp på. Ingen identitet lagras.
export async function registreraChecklistaAvbruten(rutinId, organisationId, stegIndex) {
  await setDoc(
    doc(db, "checklistkorningar", rutinId),
    { organisationId, [`avbrottPerSteg.${stegIndex}`]: increment(1) },
    { merge: true }
  );
}

export function useChecklistStatistik() {
  const { organisationId, role } = useAuth();
  const [statistik, setStatistik] = useState([]);

  useEffect(() => {
    if (!organisationId) return undefined;
    const q = query(collection(db, "checklistkorningar"), where("organisationId", "==", organisationId));
    return onSnapshot(
      q,
      (snap) => {
        setStatistik(snap.docs.map((d) => ({ rutinId: d.id, ...d.data() })));
      },
      (error) => {
        rapporteraNekadListning({ collection: "checklistkorningar", roll: role, organisationId, fel: error });
      },
    );
  }, [organisationId, role]);

  return statistik;
}
