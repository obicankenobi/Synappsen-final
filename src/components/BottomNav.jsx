import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { arRedaktor } from "../firebase/roles";
import { oppnaKommandopalett } from "../hooks/useKommandopalett";
import MerMeny from "./MerMeny";
import "./BottomNav.css";

// Mobilanpassad navigering längst ned på skärmen
export default function BottomNav() {
  const { role } = useAuth();
  const [merOppen, setMerOppen] = useState(false);

  // Etapp 42f: navet växte till 9 poster för en redaktör (Sök, Hem, Anslag, Kliniskt,
  // Logistik, Regler, Nyheter, Godkänn, Admin) – för många för att alla ska rymmas synligt på
  // en smal skärm utan att skrolla fram till dem (overflow-x: auto, se BottomNav.css:s
  // historik, löste bara att de gick att NÅ, inte att de syns). De fyra mest använda
  // (Sök/Hem/Kliniskt/Logistik) står kvar, resten flyttas till en "Mer"-meny.
  const merPoster = [
    { till: "/anslag", ikon: "📢", namn: "Anslag" },
    { till: "/administration", ikon: "📋", namn: "Regler" },
    { till: "/nyheter", ikon: "📰", namn: "Nyheter" },
    ...(arRedaktor(role) ? [{ till: "/godkannanden", ikon: "✅", namn: "Godkänn" }] : []),
    ...(arRedaktor(role) ? [{ till: "/admin", ikon: "⚙️", namn: "Admin" }] : []),
  ];

  return (
    <>
      <nav className="bottom-nav">
        {/* Etapp 23a: samma kommandopalett som Ctrl/Cmd+K på ett tangentbord – mobilen har
            inget tangentbord, så den behöver en egen ingång. */}
        <button type="button" className="bottom-nav__lank" onClick={oppnaKommandopalett}>
          <span className="bottom-nav__ikon">🔎</span>
          <span>Sök</span>
        </button>
        <NavLink to="/" end className="bottom-nav__lank">
          <span className="bottom-nav__ikon">🏠</span>
          <span>Hem</span>
        </NavLink>
        <NavLink to="/kliniskt-stod" className="bottom-nav__lank">
          <span className="bottom-nav__ikon">🩺</span>
          <span>Kliniskt</span>
        </NavLink>
        <NavLink to="/logistik" className="bottom-nav__lank">
          <span className="bottom-nav__ikon">📦</span>
          <span>Logistik</span>
        </NavLink>
        <button type="button" className="bottom-nav__lank" onClick={() => setMerOppen(true)}>
          <span className="bottom-nav__ikon">⋯</span>
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
