// Räknar hur många gånger en rutin/artikel öppnats via sökresultat, för att visa "populärast"
// på startsidan. Separat collection (inte ett fält på rutinen/artikeln) så att alla inloggade
// kan räkna upp den utan att behöva skrivbehörighet på själva innehållet.
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";

// organisationId ingår i nyckeln – annars skulle två organisationers räknare för en likadant
// namngiven rutin/sökväg kunna kollidera och räknas ihop.
function nyckelFran(titel, sokvag, organisationId) {
  return `${organisationId}::${sokvag}::${titel}`.replace(/[/.#$[\]]/g, "_").slice(0, 300);
}

export async function registreraVisning(titel, sokvag, organisationId) {
  return setDoc(
    doc(db, "visningar", nyckelFran(titel, sokvag, organisationId)),
    {
      titel,
      sokvag,
      organisationId,
      antal: increment(1),
      senastVisad: serverTimestamp(),
    },
    { merge: true }
  );
}

export function usePopularaste(antalPost = 5) {
  const { organisationId } = useAuth();
  const [populara, setPopulara] = useState([]);

  useEffect(() => {
    if (!organisationId) return undefined;
    const q = query(
      collection(db, "visningar"),
      where("organisationId", "==", organisationId),
      orderBy("antal", "desc"),
      limit(antalPost)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setPopulara(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [antalPost, organisationId]);

  return populara;
}
