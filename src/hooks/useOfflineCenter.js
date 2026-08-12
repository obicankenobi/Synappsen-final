// Etapp 3a (Operations): offline-center. Appen använder redan Firestores persistenta
// lokala cache (IndexedDB, se src/firebase/config.js persistentLocalCache) – varje post någon
// läst finns redan sparad lokalt. Det som saknas är ett sätt att MEDVETET hämta hem allt i
// förväg (inte bara det man råkat besöka), och att se när det senast gjordes.
// Etapp 29a: utökad från bara rutiner till även kontakter och godkända förrådsartiklar (små
// datamängder, ingen anledning att avgränsa bort dem längre). Bilder är fortsatt medvetet
// AVGRÄNSADE från huvudnedladdningen – de är den enda delen som faktiskt kostar utrymme, så
// de är ett separat, valbart steg (laddaNerBilder) som körs EFTER huvudnedladdningen och
// cachar bildernas URL:er via Cache Storage API (inte Firestores dokumentcache, som bara
// hanterar Firestore-dokument – bilder ligger i Cloud Storage).
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, BILDCACHE_NAMN } from "../firebase/config";
import { useAuth } from "./useAuth";
import { RUTIN_STATUS } from "./useRutiner";
import { ARTIKEL_STATUS } from "./useForradsartiklar";

// BILDCACHE_NAMN bor numera i firebase/config.js – utloggningsstädningen där måste kunna
// tömma samma cache utan att importera den här hooken (cirkulär import via useAuth).
const INNEHALLSTYPER = ["rutiner", "kontakter", "forradsartiklar"];

// Nyckeln inkluderar uid – annars visar en delad/kiosk-dator fel "senast nedladdad"-tid för
// nästa person som loggar in, som ser en tidigare användares nedladdning som sin egen.
function lagringsnyckel(typ, uid) {
  return `offlineCenter_${typ}_${uid}`;
}

function lasSparadStatus(uid) {
  const status = {};
  for (const typ of INNEHALLSTYPER) {
    const sparad = localStorage.getItem(lagringsnyckel(typ, uid));
    status[typ] = sparad ? JSON.parse(sparad) : { senast: null, antal: null };
  }
  const bilder = localStorage.getItem(lagringsnyckel("bilder", uid));
  status.bilder = bilder ? JSON.parse(bilder) : { senast: null, antal: null };
  return status;
}

function skrivSparadStatus(typ, uid, post) {
  localStorage.setItem(lagringsnyckel(typ, uid), JSON.stringify(post));
}

export function useOfflineCenter() {
  const { currentUser, organisationId } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);
  // Lazy init (körs bara vid montering) – currentUser finns redan här (AuthProvider
  // renderar aldrig sina children förrän inloggningsstatusen är känd, se AuthContext.jsx).
  const [status, setStatus] = useState(() => (currentUser ? lasSparadStatus(currentUser.uid) : {}));
  const [laddarNer, setLaddarNer] = useState(false);
  const [laddarNerBilder, setLaddarNerBilder] = useState(false);
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

  function uppdateraStatus(typ, antal) {
    const post = { senast: new Date().toISOString(), antal };
    skrivSparadStatus(typ, currentUser.uid, post);
    setStatus((tidigare) => ({ ...tidigare, [typ]: post }));
  }

  async function nedladda() {
    if (!organisationId || !currentUser) return;
    setLaddarNer(true);
    setFel(null);
    try {
      // Ingen where("omrade", ...) – hämtar godkända rutiner från ALLA områden i ett svep.
      // Två likhetsfilter (utan orderBy) kräver inget nytt composite-index.
      const rutinSnap = await getDocs(
        query(
          collection(db, "rutiner"),
          where("organisationId", "==", organisationId),
          where("status", "==", RUTIN_STATUS.GODKAND)
        )
      );
      // Etapp 37d: en arkiverad rutin ("gäller inte längre") laddas inte ner för offline-
      // bruk – filtrerat klientsidan (inte i frågan) eftersom äldre rutiner saknar fältet
      // helt, och ett where("arkiverad","==",false) hade tyst uteslutit dem.
      const antalArkiverade = rutinSnap.docs.filter((d) => d.data().arkiverad === true).length;
      uppdateraStatus("rutiner", rutinSnap.size - antalArkiverade);

      const kontaktSnap = await getDocs(query(collection(db, "kontakter"), where("organisationId", "==", organisationId)));
      uppdateraStatus("kontakter", kontaktSnap.size);

      const artikelSnap = await getDocs(
        query(
          collection(db, "forradsartiklar"),
          where("organisationId", "==", organisationId),
          where("status", "==", ARTIKEL_STATUS.GODKAND)
        )
      );
      uppdateraStatus("forradsartiklar", artikelSnap.size);
    } catch (e) {
      setFel(e.message ?? "Nedladdningen misslyckades.");
    } finally {
      setLaddarNer(false);
    }
  }

  // 29a: separat, valbart steg – hämtar bildadresserna från redan nedladdade godkända
  // rutiner och sparar själva bildfilerna i en namngiven Cache Storage-cache. Kräver att
  // huvudnedladdningen redan körts (annars finns ingen färsk lista över vilka rutiner som
  // ens har bilder).
  async function laddaNerBilder() {
    if (!organisationId || !currentUser) return;
    setLaddarNerBilder(true);
    setFel(null);
    try {
      const rutinSnap = await getDocs(
        query(
          collection(db, "rutiner"),
          where("organisationId", "==", organisationId),
          where("status", "==", RUTIN_STATUS.GODKAND)
        )
      );
      const bildUrler = [];
      rutinSnap.docs.forEach((d) => {
        const data = d.data();
        if (data.arkiverad === true) return;
        if (data.bildUrl) bildUrler.push(data.bildUrl);
        (data.bilagor ?? []).forEach((b) => {
          if (b.typ === "bild" && b.url) bildUrler.push(b.url);
        });
      });
      const cache = await caches.open(BILDCACHE_NAMN);
      await Promise.all(bildUrler.map((url) => cache.add(url).catch(() => null)));
      uppdateraStatus("bilder", bildUrler.length);
    } catch (e) {
      setFel(e.message ?? "Nedladdningen av bilder misslyckades.");
    } finally {
      setLaddarNerBilder(false);
    }
  }

  return { online, status, laddarNer, laddarNerBilder, fel, nedladda, laddaNerBilder };
}
