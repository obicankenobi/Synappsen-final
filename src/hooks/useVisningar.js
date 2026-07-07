// Räknar hur många gånger en rutin/artikel öppnats via sökresultat, för att visa "populärast"
// på startsidan. Separat collection (inte ett fält på rutinen/artikeln) så att alla inloggade
// kan räkna upp den utan att behöva skrivbehörighet på själva innehållet.
import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

function nyckelFran(titel, sokvag) {
  return `${sokvag}::${titel}`.replace(/[/.#$[\]]/g, "_").slice(0, 300);
}

export async function registreraVisning(titel, sokvag) {
  return setDoc(
    doc(db, "visningar", nyckelFran(titel, sokvag)),
    {
      titel,
      sokvag,
      antal: increment(1),
      senastVisad: serverTimestamp(),
    },
    { merge: true }
  );
}

export function usePopularaste(antalPost = 5) {
  const [populara, setPopulara] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "visningar"), orderBy("antal", "desc"), limit(antalPost));
    const unsubscribe = onSnapshot(q, (snap) => {
      setPopulara(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [antalPost]);

  return populara;
}
