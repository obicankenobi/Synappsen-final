// Konfigurerbar auto-utloggningstid (minuter av inaktivitet). Läsbar av alla inloggade,
// skrivbar endast av superadmin (samma "installningar"-collection/regel som Gemini-budgeten).
import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const STANDARD_MINUTER = 20;
const REF = doc(db, "installningar", "utloggning");

export function useUtloggningsinstallning() {
  const [minuter, setMinuterState] = useState(STANDARD_MINUTER);

  useEffect(() => {
    return onSnapshot(REF, (snap) => {
      setMinuterState(snap.exists() ? snap.data().minuter ?? STANDARD_MINUTER : STANDARD_MINUTER);
    });
  }, []);

  async function satMinuter(minuter) {
    await setDoc(REF, { minuter }, { merge: true });
  }

  return { minuter, satMinuter };
}
