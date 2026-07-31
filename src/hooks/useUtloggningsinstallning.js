// Konfigurerbar auto-utloggningstid (minuter av inaktivitet), per organisation (Etapp 1).
// Läsbar av alla inloggade i organisationen, skrivbar endast av superadmin.
import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { rapporteraNekadListning } from "../firebase/felrapportering";

const STANDARD_MINUTER = 20;

export function useUtloggningsinstallning() {
  const { organisationId, role } = useAuth();
  const [minuter, setMinuterState] = useState(STANDARD_MINUTER);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    const ref = doc(db, "organisationer", organisationId, "installningar", "utloggning");
    return onSnapshot(
      ref,
      (snap) => {
        setMinuterState(snap.exists() ? snap.data().minuter ?? STANDARD_MINUTER : STANDARD_MINUTER);
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "organisationer", roll: role, organisationId, sokvag: "utloggning", fel: error });
      },
    );
  }, [organisationId, role]);

  async function satMinuter(minuter) {
    if (!organisationId) return;
    const ref = doc(db, "organisationer", organisationId, "installningar", "utloggning");
    await setDoc(ref, { minuter }, { merge: true });
  }

  return { minuter, satMinuter, fel };
}
