import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useInaktivitetsUtloggning } from "../hooks/useInaktivitetsUtloggning";
import { ROLES } from "../firebase/roles";

// Etapp 55b: sidor en kiosk-enhet (delat konto, ingen person) får visa. Allt annat studsar
// tillbaka till startsidan – t.ex. kan kommandopalettens sökträffar annars ta en kiosk-
// användare in på en sida som förutsätter en identifierbar person (profil, skiftrapport,
// kontakter m.fl.).
const KIOSK_TILLATNA_VAGAR = ["/", "/kliniskt-stod", "/logistik", "/administration", "/akutlage"];

function arTillatenKioskVag(pathname) {
  if (KIOSK_TILLATNA_VAGAR.includes(pathname)) return true;
  if (pathname.startsWith("/logistik/")) return true;
  if (pathname.startsWith("/checklista/")) return true;
  return false;
}

// Kortare än den vanliga inaktivitets-utloggningen (20 min, se useUtloggningsinstallning) –
// en obevakad delad platta i foajén ska återgå till startsidan snabbt, inte förbli kvar på en
// enskild rutin. Loggar INTE ut kontot (det finns ingen enskild person att logga ut), navigerar
// bara tillbaka.
const KIOSK_INAKTIV_MINUTER = 3;

// Håller kiosk-rollen instängd på sitt tillåtna vägnät och återställer till startsidan efter
// inaktivitet. Monteras inuti BrowserRouter (behöver useLocation/useNavigate), bredvid
// InaktivitetsBevakning i App.jsx.
export default function KioskBevakning() {
  const { currentUser, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const arKioskAnvandare = Boolean(currentUser) && role === ROLES.KIOSK;

  useEffect(() => {
    if (arKioskAnvandare && !arTillatenKioskVag(location.pathname)) {
      navigate("/", { replace: true });
    }
  }, [arKioskAnvandare, location.pathname, navigate]);

  useInaktivitetsUtloggning(arKioskAnvandare, () => navigate("/"), KIOSK_INAKTIV_MINUTER);

  return null;
}
