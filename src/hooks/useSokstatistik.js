// Etapp 4: enkla räknare för att kunna visa "andel nollträffar" som en riktig procentsats i
// adminpanelen (sokloggar räcker inte ensamt – bara de 50 senaste hålls, ingen nämnare för
// totalt antal sökningar).
import { useEffect, useState } from "react";
import { doc, setDoc, increment, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";

export async function loggaSokning(organisationId, gavTraff) {
  if (!organisationId) return;
  await setDoc(
    doc(db, "soksstatistik", organisationId),
    {
      totaltAntalSokningar: increment(1),
      antalNollTraffar: increment(gavTraff ? 0 : 1),
    },
    { merge: true }
  );
}

// Etapp 10e: "tid-att-hitta" – tiden från att en sökning påbörjades till att användaren
// klickade på ett resultat, summerad + räknad så ett snitt kan visas (samma lätta
// summa/antal-mönster som redan används för nollträffar ovan, inte varje enskild mätning
// sparad för sig – ingen anledning att spara per-session-data mer detaljerat än så).
export async function loggaTidTillKlick(organisationId, tidMs) {
  if (!organisationId) return;
  await setDoc(
    doc(db, "soksstatistik", organisationId),
    {
      totalTidTillKlickMs: increment(tidMs),
      antalTidmatningar: increment(1),
    },
    { merge: true }
  );
}

export function useSokstatistik(laddaLista) {
  const { organisationId } = useAuth();
  const [statistik, setStatistik] = useState(null);

  useEffect(() => {
    if (!laddaLista || !organisationId) return undefined;
    return onSnapshot(doc(db, "soksstatistik", organisationId), (snap) => {
      setStatistik(snap.data() ?? null);
    });
  }, [laddaLista, organisationId]);

  return { statistik };
}
