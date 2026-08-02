import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./AkutKnappFloating.css";

// Etapp 42c: Akutläget var tidigare bara nåbart via en knapp på Hem – försvann så fort man
// navigerade till en sektionssida. Den flyter nu ovanpå ALLA sidor (monterad en gång i
// App.jsx, inte per route), utom på /akutlage själv (redundant där) och när ingen är
// inloggad (login/registrera har ingen relevant akutläges-vy att länka till).
export default function AkutKnappFloating() {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser || location.pathname === "/akutlage") return null;

  return (
    <Link to="/akutlage" className="akut-knapp-floating" aria-label="Akutläge">
      🚨 Akut
    </Link>
  );
}
