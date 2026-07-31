// Etapp 3d: läser organisationens 2FA-policy (organisationer/{orgId}.sakerhet.
// kravMfaForRoller) och avgör om den inloggade användaren uppfyller kravet. Detta är
// UI/UX-lagret ("kräv" i praktiken); den faktiska spärren för de känsligaste superadmin-
// skrivningarna sitter i firestore.rules (mfaKravUppfylld()).
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { hamtaInskrivnaFaktorer } from "../firebase/mfa";
import { rapporteraNekadListning } from "../firebase/felrapportering";

export function useMfaPolicy() {
  const { currentUser, role, organisationId } = useAuth();
  const [kravMfaForRoller, setKravMfaForRoller] = useState([]);
  const [laddat, setLaddat] = useState(false);
  const [fel, setFel] = useState(null);

  useEffect(() => {
    if (!organisationId) return undefined;
    const unsubscribe = onSnapshot(
      doc(db, "organisationer", organisationId),
      (snap) => {
        setKravMfaForRoller(snap.data()?.sakerhet?.kravMfaForRoller ?? []);
        setLaddat(true);
        setFel(null);
      },
      (error) => {
        setLaddat(true);
        setFel(error);
        rapporteraNekadListning({ collection: "organisationer", roll: role, organisationId, sokvag: "mfa-policy", fel: error });
      },
    );
    return unsubscribe;
  }, [organisationId, role]);

  const kravsForMinRoll = kravMfaForRoller.includes(role);
  const harAktiverat = currentUser ? hamtaInskrivnaFaktorer(currentUser).length > 0 : false;

  return {
    laddat,
    kravUppfyllt: !kravsForMinRoll || harAktiverat,
    kravsForMinRoll,
    fel,
  };
}
