// Hämtning och justering av månadsbudgeten för Gemini Vision-tolkning
import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const BUDGET_REF = doc(db, "installningar", "geminiBudget");

export function useGeminiBudget() {
  const [budget, setBudget] = useState(null);

  useEffect(() => {
    return onSnapshot(BUDGET_REF, (snap) => {
      setBudget(snap.exists() ? snap.data() : { anvantOre: 0, taketOre: 20000 });
    });
  }, []);

  async function satTakKr(takKr) {
    await setDoc(BUDGET_REF, { taketOre: Math.round(takKr * 100) }, { merge: true });
  }

  return { budget, satTakKr };
}
