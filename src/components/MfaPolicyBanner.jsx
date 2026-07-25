import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMfaPolicy } from "../hooks/useMfaPolicy";
import "./MfaPolicyBanner.css";

// Etapp 3d: mjuk (UI-lager) påminnelse om organisationens 2FA-krav – döljs på /profil så
// användaren kan faktiskt aktivera det. Den verkliga spärren för de känsligaste
// superadmin-skrivningarna sitter i firestore.rules (mfaKravUppfylld()), oavsett vad UI:t gör.
export default function MfaPolicyBanner() {
  const { currentUser } = useAuth();
  const { laddat, kravUppfyllt } = useMfaPolicy();
  const location = useLocation();

  if (!currentUser || !laddat || kravUppfyllt || location.pathname === "/profil") {
    return null;
  }

  return (
    <div className="mfa-policy-banner" role="alert">
      Din organisation kräver tvåfaktorsautentisering för din roll.{" "}
      <Link to="/profil">Aktivera det på din profil</Link>.
    </div>
  );
}
