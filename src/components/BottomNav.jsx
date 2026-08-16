import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { arRedaktor, ROLES } from "../firebase/roles";
import { useArPlattformsadmin } from "../hooks/useArPlattformsadmin";
import { oppnaKommandopalett } from "../hooks/useKommandopalett";
import MerMeny from "./MerMeny";
import KioskPinModal from "./KioskPinModal";
import "./BottomNav.css";

// Mobilanpassad navigering längst ned på skärmen
export default function BottomNav() {
  const { role, loggaUt } = useAuth();
  // Måste anropas före kiosk-returen nedan – hooks får inte stå bakom en villkorlig retur.
  // En kiosk är aldrig superadmin, så hooken gör ändå ingen läsning i det fallet.
  const { arPlattformsadmin } = useArPlattformsadmin();
  const [merOppen, setMerOppen] = useState(false);
  const [pinOppen, setPinOppen] = useState(false);
  const navigate = useNavigate();

  if (role === ROLES.KIOSK) {
    return (
      <>
        <nav className="bottom-nav" aria-label="Huvudnavigering">
          <button type="button" className="bottom-nav__lank" onClick={oppnaKommandopalett}>
            <span className="bottom-nav__ikon" aria-hidden="true">🔎</span>
            <span>Sök</span>
          </button>
          <NavLink to="/" end className="bottom-nav__lank">
            <span className="bottom-nav__ikon" aria-hidden="true">🏠</span>
            <span>Hem</span>
          </NavLink>
          {/* Etapp 55b: akutläget ska vara en tryckning bort på en kiosk-enhet, inte gömt i
              "Mer" som för övriga roller. */}
          <NavLink to="/akutlage" className="bottom-nav__lank">
            <span className="bottom-nav__ikon" aria-hidden="true">🚨</span>
            <span>Akutläge</span>
          </NavLink>
          <button type="button" className="bottom-nav__lank" onClick={() => setMerOppen(true)}>
            <span className="bottom-nav__ikon" aria-hidden="true">⋯</span>
            <span>Mer</span>
          </button>
        </nav>
        {merOppen && (
          <MerMeny
            poster={[
              { till: "/kliniskt-stod", ikon: "🩺", namn: "Kliniskt" },
              { till: "/logistik", ikon: "📦", namn: "Logistik" },
              { till: "/administration", ikon: "📋", namn: "Regler" },
              { onKlick: () => setPinOppen(true), ikon: "🔓", namn: "Lämna kioskläge" },
            ]}
            onStang={() => setMerOppen(false)}
          />
        )}
        {pinOppen && (
          <KioskPinModal
            onLyckad={async () => {
              setPinOppen(false);
              await loggaUt();
              navigate("/logga-in");
            }}
            onAvbryt={() => setPinOppen(false)}
          />
        )}
      </>
    );
  }

  // Etapp 42f: navet växte till 9 poster för en redaktör (Sök, Hem, Anslag, Kliniskt,
  // Logistik, Regler, Nyheter, Godkänn, Admin) – för många för att alla ska rymmas synligt på
  // en smal skärm utan att skrolla fram till dem (overflow-x: auto, se BottomNav.css:s
  // historik, löste bara att de gick att NÅ, inte att de syns). De fyra mest använda
  // (Sök/Hem/Kliniskt/Logistik) står kvar, resten flyttas till en "Mer"-meny.
  const merPoster = [
    { till: "/anslag", ikon: "📢", namn: "Anslag" },
    { till: "/administration", ikon: "📋", namn: "Regler" },
    { till: "/nyheter", ikon: "📰", namn: "Nyheter" },
    // Etapp 65d: övningspasset – hör hemma i "Mer" precis som övriga sällan-varje-dag-poster.
    { till: "/ova", ikon: "🎓", namn: "Öva" },
    ...(arRedaktor(role) ? [{ till: "/godkannanden", ikon: "✅", namn: "Godkänn" }] : []),
    ...(arRedaktor(role) ? [{ till: "/admin", ikon: "⚙️", namn: "Admin" }] : []),
    // Etapp 67a: leverantörsvyn hade sedan Etapp 6a INGEN väg in från gränssnittet alls –
    // den nåddes bara genom att skriva /leverantor för hand i adressfältet. Gatas inte på
    // role (plattformsadmin är ingen roll, se useArPlattformsadmin.js) utan på den faktiska
    // behörigheten. Läggs sist eftersom den rör som mest en handfull konton totalt.
    ...(arPlattformsadmin ? [{ till: "/leverantor", ikon: "🏢", namn: "Leverantör" }] : []),
  ];

  return (
    <>
      <nav className="bottom-nav" aria-label="Huvudnavigering">
        {/* Etapp 23a: samma kommandopalett som Ctrl/Cmd+K på ett tangentbord – mobilen har
            inget tangentbord, så den behöver en egen ingång. */}
        <button type="button" className="bottom-nav__lank" onClick={oppnaKommandopalett}>
          <span className="bottom-nav__ikon" aria-hidden="true">🔎</span>
          <span>Sök</span>
        </button>
        <NavLink to="/" end className="bottom-nav__lank">
          <span className="bottom-nav__ikon" aria-hidden="true">🏠</span>
          <span>Hem</span>
        </NavLink>
        <NavLink to="/kliniskt-stod" className="bottom-nav__lank">
          <span className="bottom-nav__ikon" aria-hidden="true">🩺</span>
          <span>Kliniskt</span>
        </NavLink>
        <NavLink to="/logistik" className="bottom-nav__lank">
          <span className="bottom-nav__ikon" aria-hidden="true">📦</span>
          <span>Logistik</span>
        </NavLink>
        <button type="button" className="bottom-nav__lank" onClick={() => setMerOppen(true)}>
          <span className="bottom-nav__ikon" aria-hidden="true">⋯</span>
          <span>Mer</span>
        </button>
      </nav>
      {/* Etapp 42f-fix: måste renderas UTANFÖR <nav> – .bottom-nav är position: fixed +
          z-index, vilket skapar en egen stapel-kontext. Låg MerMeny kvar som barn till nav
          hamnade den kontexten under AkutKnappFloating (z-index 150) oavsett eget z-index,
          bekräftat i en riktig skärmdump där Akut-knappen låg ovanpå menyn. */}
      {merOppen && <MerMeny poster={merPoster} onStang={() => setMerOppen(false)} />}
    </>
  );
}
