// Etapp 3d: läser organisationens 2FA-policy (organisationer/{orgId}.sakerhet.
// kravMfaForRoller) och avgör om den inloggade användaren uppfyller kravet. Detta är
// UI/UX-lagret ("kräv" i praktiken); den faktiska spärren för de känsligaste superadmin-
// skrivningarna sitter i firestore.rules (mfaKravUppfylld()).
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { hamtaInskrivnaFaktorer } from "../firebase/mfa";

export function useMfaPolicy() {
  const { currentUser, role, organisationId } = useAuth();
  const [kravMfaForRoller, setKravMfaForRoller] = useState([]);
  const [laddat, setLaddat] = useState(false);

  useEffect(() => {
    if (!organisationId) return undefined;
    const unsubscribe = onSnapshot(doc(db, "organisationer", organisationId), (snap) => {
      setKravMfaForRoller(snap.data()?.sakerhet?.kravMfaForRoller ?? []);
      setLaddat(true);
    });
    return unsubscribe;
  }, [organisationId]);

  const kravsForMinRoll = kravMfaForRoller.includes(role);
  const harAktiverat = currentUser ? hamtaInskrivnaFaktorer(currentUser).length > 0 : false;

  return {
    laddat,
    kravUppfyllt: !kravsForMinRoll || harAktiverat,
    kravsForMinRoll,
  };
}
