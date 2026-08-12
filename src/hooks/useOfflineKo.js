// Etapp 29c: skickar kön av offline-gjorda åtgärder (läskvittering, bristanmälan) så fort
// nätet är tillbaka. Monteras EN gång vid approten (se OfflineKoLyssnare.jsx/App.jsx) så det
// fungerar oavsett vilken sida användaren råkar stå på när täckningen kommer tillbaka.
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import { useBristanmalningar } from "./useBristanmalningar";
import { kvitteraLast, kvitteraLastAnslag } from "./useLaskvittering";
import { lasKo, tabortUrKo } from "../utils/offlineKo";

// Firestore-felkoder som aldrig blir bättre av ett nytt försök. Allt annat (unavailable,
// deadline-exceeded, internal, aborted …) behandlas som tillfälligt.
const PERMANENTA_FELKODER = new Set([
  "permission-denied",
  "unauthenticated",
  "invalid-argument",
  "not-found",
  "failed-precondition",
]);

export function useOfflineKo() {
  const { currentUser, namn } = useAuth();
  const mittNamn = namn || currentUser?.email;
  const uid = currentUser?.uid;
  // skapaBristanmalning slår ihop en ny anmälan med en redan öppen (samma artikel, senaste
  // 24 h) baserat på den LOKALA bristanmalningar-listan – den måste ha hunnit ladda klart
  // innan en köad bristanmälan spelas upp, annars riskerar den att bli en dubblett istället
  // för att räknas upp (se firestore.rules-kommentaren för bristanmalningar, Etapp 29c).
  const { skapaBristanmalning, laddar: bristanmalningarLaddar } = useBristanmalningar();
  const [antalIKo, setAntalIKo] = useState(() => (uid ? lasKo(uid).length : 0));
  const [antalMisslyckade, setAntalMisslyckade] = useState(0);
  const skickarRef = useRef(false);

  const uppdateraAntal = useCallback(() => {
    setAntalIKo(uid ? lasKo(uid).length : 0);
  }, [uid]);

  const skickaKo = useCallback(async () => {
    if (!uid || skickarRef.current) return;
    const ko = lasKo(uid);
    if (ko.length === 0) return;
    if (ko.some((p) => p.typ === "bristanmalning") && bristanmalningarLaddar) return;
    skickarRef.current = true;
    try {
      for (const post of ko) {
        try {
          if (post.typ === "laskvittering-rutin") {
            await kvitteraLast(post.data.rutinId, uid, post.data.namn ?? mittNamn);
          } else if (post.typ === "laskvittering-anslag") {
            await kvitteraLastAnslag(post.data.anslagId, uid, post.data.namn ?? mittNamn);
          } else if (post.typ === "bristanmalning") {
            await skapaBristanmalning({ ...post.data, uid, namn: post.data.namn ?? mittNamn });
          }
          tabortUrKo(uid, post.id);
        } catch (fel) {
          // Skilj på tillfälliga och permanenta fel. Ett tillfälligt fel (nätet försvann
          // igen mitt i sändningen) ska lämna kön orörd och försöka igen nästa gång
          // "online" utlöses. Ett PERMANENT fel (regeln nekar posten, användaren har
          // förlorat behörigheten, artikeln är borttagen) kommer aldrig att lyckas – låg
          // den kvar blockerade den dessutom ALLA efterföljande poster i kön för evigt,
          // eftersom slingan bryts här. Ta bort den och fortsätt med resten.
          if (PERMANENTA_FELKODER.has(fel?.code)) {
            tabortUrKo(uid, post.id);
            setAntalMisslyckade((n) => n + 1);
            continue;
          }
          break;
        }
      }
    } finally {
      skickarRef.current = false;
      uppdateraAntal();
    }
  }, [uid, mittNamn, skapaBristanmalning, bristanmalningarLaddar, uppdateraAntal]);

  useEffect(() => {
    if (!uid) return undefined;
    function hanteraOnline() {
      skickaKo();
    }
    window.addEventListener("online", hanteraOnline);
    if (navigator.onLine) skickaKo();
    return () => window.removeEventListener("online", hanteraOnline);
  }, [uid, skickaKo]);

  // antalMisslyckade: poster som kastades permanent under den här sessionen. Ännu inte
  // visad i något gränssnitt (OfflineKoLyssnare.jsx) – men värdet finns här så att en
  // tyst bortkastad läskvittering/bristanmälan går att synliggöra för användaren.
  return { antalIKo, antalMisslyckade };
}
