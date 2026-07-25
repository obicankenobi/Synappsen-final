// Etapp 3a (Operations): offline-center. Appen använder redan Firestores persistenta
// lokala cache (IndexedDB, se src/firebase/config.js persistentLocalCache) – varje rutin
// någon läst finns redan sparad lokalt. Det som saknas är ett sätt att MEDVETET hämta hem
// ALLA godkända rutiner i förväg (inte bara de man råkat besöka), och att se när det senast
// gjordes. Medvetet avgränsat (se ETAPPLAN.md 3a): ingen offline-sök, ingen bakgrundssynk,
// inga bilagor/bilder – bara rutinernas text.
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { RUTIN_STATUS } from "./useRutiner";

const LAGRINGSNYCKEL = "offlineCenter_senasteNedladdning";

export function useOfflineCenter() {
  const { organisationId } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);
  const [senasteNedladdning, setSenasteNedladdning] = useState(() => {
    const sparad = localStorage.getItem(LAGRINGSNYCKEL);
    return sparad ? new Date(sparad) : null;
  });
  const [antalNedladdade, setAntalNedladdade] = useState(null);
  const [laddarNer, setLaddarNer] = useState(false);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    function satOnline() {
      setOnline(true);
    }
    function satOffline() {
      setOnline(false);
    }
    window.addEventListener("online", satOnline);
    window.addEventListener("offline", satOffline);
    return () => {
      window.removeEventListener("online", satOnline);
      window.removeEventListener("offline", satOffline);
    };
  }, []);

  async function nedladda() {
    if (!organisationId) return;
    setLaddarNer(true);
    setFel(null);
    try {
      // Ingen where("omrade", ...) – hämtar godkända rutiner från ALLA områden i ett svep.
      // Två likhetsfilter (utan orderBy) kräver inget nytt composite-index.
      const snap = await getDocs(
        query(
          collection(db, "rutiner"),
          where("organisationId", "==", organisationId),
          where("status", "==", RUTIN_STATUS.GODKAND)
        )
      );
      const nu = new Date();
      localStorage.setItem(LAGRINGSNYCKEL, nu.toISOString());
      setSenasteNedladdning(nu);
      setAntalNedladdade(snap.size);
    } catch (e) {
      setFel(e.message ?? "Nedladdningen misslyckades.");
    } finally {
      setLaddarNer(false);
    }
  }

  return { online, senasteNedladdning, antalNedladdade, laddarNer, fel, nedladda };
}
