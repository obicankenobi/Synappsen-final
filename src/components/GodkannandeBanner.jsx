import { Link } from "react-router-dom";
import { useGodkannandeKo } from "../hooks/useGodkannandeKo";
import "./GodkannandeBanner.css";

// Etapp 42d: en banderoll på Hem som länkar vidare till den samlade godkännandekön (42b).
// Monteras BARA av en förälder som redan villkorat den på arRedaktor(role) (se Hem.jsx) –
// useGodkannandeKo() lägger annars på flera Firestore-lyssnare i onödan för alla andra roller.
export default function GodkannandeBanner() {
  const { antal } = useGodkannandeKo();

  if (antal === 0) return null;

  return (
    <Link to="/godkannanden" className="godkannande-banner">
      ⏳ {antal} {antal === 1 ? "sak" : "saker"} väntar på granskning
      <span className="godkannande-banner__pil">→</span>
    </Link>
  );
}
