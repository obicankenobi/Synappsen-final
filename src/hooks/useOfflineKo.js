// Etapp 29c: skickar kön av offline-gjorda åtgärder (läskvittering, bristanmälan) så fort
// nätet är tillbaka. Monteras EN gång vid approten (se OfflineKoLyssnare.jsx/App.jsx) så det
// fungerar oavsett vilken sida användaren råkar stå på när täckningen kommer tillbaka.
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import { useBristanmalningar } from "./useBristanmalningar";
import { kvitteraLast, kvitteraLastAnslag } from "./useLaskvittering";
import { lasKo, tabortUrKo } from "../utils/offlineKo";

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
        } catch {
          // Nätet kan ha försvunnit igen mitt i sändningen – låt resten ligga kvar, försök
          // igen nästa gång "online" utlöses.
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

  return { antalIKo };
}
