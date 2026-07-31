// Hämtning och justering av månadsbudgeten för Gemini Vision-tolkning – per organisation
// (Etapp 1), samma dokumentform som tidigare men flyttad från installningar/geminiBudget
// till organisationer/{orgId}/installningar/geminiBudget så att två kunder aldrig delar pott.
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";
import { uppdateraGeminiBudgetTak } from "../firebase/functions";

export function useGeminiBudget() {
  const { organisationId, role } = useAuth();
  const [budget, setBudget] = useState(null);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    const ref = doc(db, "organisationer", organisationId, "installningar", "geminiBudget");
    return onSnapshot(
      ref,
      (snap) => {
        setBudget(snap.exists() ? snap.data() : { anvantOre: 0, taketOre: 20000 });
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "organisationer", roll: role, organisationId, sokvag: "gemini-budget", fel: error });
      },
    );
  }, [organisationId, role]);

  // Etapp 32c: går numera via en Cloud Function (uppdateraGeminiBudgetTak) istället för en
  // direkt klient-skrivning, så att ändringen loggas i revisionsloggen.
  async function satTakKr(takKr) {
    if (!organisationId) return;
    await uppdateraGeminiBudgetTak(Math.round(takKr * 100));
  }

  return { budget, satTakKr, fel };
}
