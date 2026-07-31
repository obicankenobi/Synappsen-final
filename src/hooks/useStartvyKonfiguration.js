// Etapp 17a: läser/skriver organisationens rollbaserade startvy-ordning
// (organisationer/{orgId}/installningar/startvy). Samma mönster som useGeminiBudget.js/
// useValkomstchecklista.js – firestore.rules tillåter redan en superadmin i egen
// organisation att skriva direkt till installningar/{dokId}, ingen Cloud Function behövs.
import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { blockordningForRoll } from "../config/startvy";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useStartvyKonfiguration() {
  const { organisationId, role } = useAuth();
  const [blockOrdning, setBlockOrdning] = useState(undefined);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    const ref = doc(db, "organisationer", organisationId, "installningar", "startvy");
    return onSnapshot(
      ref,
      (snap) => {
        setBlockOrdning(snap.exists() ? snap.data().blockOrdning ?? {} : {});
        setFel(null);
      },
      (error) => {
        setFel(error);
        rapporteraNekadListning({ collection: "organisationer", roll: role, organisationId, sokvag: "startvy", fel: error });
      },
    );
  }, [organisationId, role]);

  async function satBlockOrdningForRoll(roll, ordning) {
    if (!organisationId) return;
    const ref = doc(db, "organisationer", organisationId, "installningar", "startvy");
    await setDoc(ref, { blockOrdning: { [roll]: ordning } }, { merge: true });
  }

  return {
    laddat: blockOrdning !== undefined,
    blockordningForRoll: (roll) => blockordningForRoll(roll, blockOrdning),
    satBlockOrdningForRoll,
    fel,
  };
}
