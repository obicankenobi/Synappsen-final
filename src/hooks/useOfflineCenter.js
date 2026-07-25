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

// Nyckeln inkluderar uid – annars visar en delad/kiosk-dator fel "senast nedladdad"-tid för
// nästa person som loggar in, som ser en tidigare användares nedladdning som sin egen.
function lagringsnyckel(uid) {
  return `offlineCenter_senasteNedladdning_${uid}`;
}

export function useOfflineCenter() {
  const { currentUser, organisationId } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);
  // Lazy init (körs bara vid montering) – currentUser finns redan här (AuthProvider
  // renderar aldrig sina children förrän inloggningsstatusen är känd, se AuthContext.jsx).
  const [senasteNedladdning, setSenasteNedladdning] = useState(() => {
    if (!currentUser) return null;
    const sparad = localStorage.getItem(lagringsnyckel(currentUser.uid));
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
    if (!organisationId || !currentUser) return;
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
      localStorage.setItem(lagringsnyckel(currentUser.uid), nu.toISOString());
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
