// Etapp 2 (feature-gating): läser organisationens modulkonfiguration (organisationer/{orgId})
// och ger hasFeature(...) för UI-gating. Detta är UX, inte säkerhet – Cloud Functions gör om
// samma kontroll server-side innan något kostsamt (t.ex. Gemini-anrop) sker.
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { aktivaFeatures } from "../config/features";

export function useFeatures() {
  const { organisationId } = useAuth();
  const [moduler, setModuler] = useState(null);
  const [laddat, setLaddat] = useState(false);

  useEffect(() => {
    if (!organisationId) return;
    const unsubscribe = onSnapshot(doc(db, "organisationer", organisationId), (snap) => {
      setModuler(snap.data()?.moduler ?? {});
      setLaddat(true);
    });
    return unsubscribe;
  }, [organisationId]);

  const features = aktivaFeatures(moduler);

  return {
    laddat,
    moduler: moduler ?? {},
    hasFeature: (feature) => features.has(feature),
  };
}
