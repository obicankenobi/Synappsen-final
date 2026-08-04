// Etapp 46: läser systemstatus/revisionskedja – senaste kända resultatet av den nattliga
// hashkedjekontrollen (functions/index.js verifieraRevisionskedjor), skrivet VARJE körning
// (inte bara vid en avvikelse). Delad, icke-organisationsskopad infrastruktur, samma mönster
// som useHalsokontrollhistorik.js/systemvarningar.
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useSystemstatus() {
  const [revisionskedja, setRevisionskedja] = useState(null);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "systemstatus", "revisionskedja"),
      (snap) => {
        setRevisionskedja(snap.exists() ? snap.data() : null);
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "systemstatus", sokvag: "revisionskedja", fel: error });
      },
    );
    return unsubscribe;
  }, []);

  return { revisionskedja, fel };
}
