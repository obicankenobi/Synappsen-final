import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useNavigeringData } from "../hooks/useNavigeringData";
import { oppnaKommandopalett } from "../hooks/useKommandopalett";
import MerMeny from "./MerMeny";
import KioskPinModal from "./KioskPinModal";
import "./BottomNav.css";

// Mobilanpassad navigering längst ned på skärmen. Källan för VILKA sidor som finns är
// useNavigeringData.js, delad med Sidomeny.jsx (Etapp 69c) – den här filen bestämmer bara
// vilka av dem som syns direkt kontra bakom "Mer" på en smal skärm.
export default function BottomNav() {
  const { loggaUt } = useAuth();
  const { kiosk, huvud, ovriga } = useNavigeringData();
  const [merOppen, setMerOppen] = useState(false);
  const [pinOppen, setPinOppen] = useState(false);
  const navigate = useNavigate();

  if (kiosk) {
    return (
      <>
        <nav className="bottom-nav" aria-label="Huvudnavigering">
          <button type="button" className="bottom-nav__lank" onClick={oppnaKommandopalett}>
            <span className="bottom-nav__ikon" aria-hidden="true">🔎</span>
            <span>Sök</span>
          </button>
          {huvud.map((post) => (
            <NavLink key={post.till} to={post.till} end={post.end} className="bottom-nav__lank">
              <span className="bottom-nav__ikon" aria-hidden="true">{post.ikon}</span>
              <span>{post.namn}</span>
            </NavLink>
          ))}
          <button type="button" className="bottom-nav__lank" onClick={() => setMerOppen(true)}>
            <span className="bottom-nav__ikon" aria-hidden="true">⋯</span>
            <span>Mer</span>
          </button>
        </nav>
        {merOppen && (
          <MerMeny
            poster={[
              ...ovriga,
              {
                // Etapp 69a: satte tidigare BARA setPinOppen(true), utan att stänga menyn.
                // merOppen stannade alltså true medan PIN-dialogen visades - båda är
                // fullskärmsoverlägg (position: fixed; inset: 0), och berodde man sig på att
                // MerMenys äldre z-index (800) råkade vinna över KioskPinModals (300) hade
                // PIN-dialogen renderats OSYNLIG bakom Mer-menyns halvgenomskinliga bakgrund -
                // enda vägen ut ur kioskläget (Etapp 55b) obrukbar. Bekräftat genom att
                // återskapa exakt detta DOM-tillstånd och rendera det, se ETAPPLAN18.md 69a.
                // Att stänga menyn ordentligt här är den riktiga fixen; z-index-skalan
                // nedan är ett skyddsnät, inte ersättningen för den.
                onKlick: () => {
                  setMerOppen(false);
                  setPinOppen(true);
                },
                ikon: "🔓",
                namn: "Lämna kioskläge",
              },
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
  // historik, löste bara att de gick att NÅ, inte att de syns). De tre mest använda
  // (Hem/Kliniskt/Logistik, se useNavigeringData.js:s "huvud") står kvar synliga, resten
  // ligger i "Mer" ("ovriga").
  return (
    <>
      <nav className="bottom-nav" aria-label="Huvudnavigering">
        {/* Etapp 23a: samma kommandopalett som Ctrl/Cmd+K på ett tangentbord – mobilen har
            inget tangentbord, så den behöver en egen ingång. */}
        <button type="button" className="bottom-nav__lank" onClick={oppnaKommandopalett}>
          <span className="bottom-nav__ikon" aria-hidden="true">🔎</span>
          <span>Sök</span>
        </button>
        {huvud.map((post) => (
          <NavLink key={post.till} to={post.till} end={post.end} className="bottom-nav__lank">
            <span className="bottom-nav__ikon" aria-hidden="true">{post.ikon}</span>
            <span>{post.namn}</span>
          </NavLink>
        ))}
        <button type="button" className="bottom-nav__lank" onClick={() => setMerOppen(true)}>
          <span className="bottom-nav__ikon" aria-hidden="true">⋯</span>
          <span>Mer</span>
        </button>
      </nav>
      {/* Etapp 42f-fix: måste renderas UTANFÖR <nav> – .bottom-nav är position: fixed +
          z-index, vilket skapar en egen stapel-kontext. Låg MerMeny kvar som barn till nav
          hamnade den kontexten under AkutKnappFloating (z-index 150) oavsett eget z-index,
          bekräftat i en riktig skärmdump där Akut-knappen låg ovanpå menyn. */}
      {merOppen && <MerMeny poster={ovriga} onStang={() => setMerOppen(false)} />}
    </>
  );
}
