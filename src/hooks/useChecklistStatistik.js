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
// Säkerhetsgranskning 2026-08-17 (Del 3 – fynd 3.5). Skrivningen såg tidigare ut så här:
//   { organisationId, [`avbrottPerSteg.${stegIndex}`]: increment(1) }
// Punktnotation tolkas som en fältSÖKVÄG av updateDoc, men INTE av setDoc – setDoc skapar ett
// toppnivåfält som bokstavligen HETER "avbrottPerSteg.3". Två följder:
//   1. Statistiken har aldrig fungerat: ChecklistStatistikSektion.jsx läser s.avbrottPerSteg
//      och kör Object.entries() på den, men det fältet skapades aldrig – "mest avbrutna steg"
//      har visat "-" sedan Etapp 18d.
//   2. Del 1:s fältbegränsning på collectionen (hasOnly([... 'avbrottPerSteg'])) NEKAR
//      skrivningen, eftersom nyckeln heter något annat än det tillåtna namnet. Regressionen
//      hann aldrig ut i produktion (inget av granskningen är deployat), men hade gjort det.
// En riktig nästlad map löser båda: increment() fungerar inne i en map, och merge:true slår
// ihop den med befintliga steg i stället för att skriva över dem.
export async function registreraChecklistaAvbruten(rutinId, organisationId, stegIndex) {
  await setDoc(
    doc(db, "checklistkorningar", rutinId),
    { organisationId, avbrottPerSteg: { [String(stegIndex)]: increment(1) } },
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
