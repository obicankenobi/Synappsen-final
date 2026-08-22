import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useNavigeringData } from "../hooks/useNavigeringData";
import { oppnaKommandopalett } from "../hooks/useKommandopalett";
import KioskPinModal from "./KioskPinModal";
import "./Sidomeny.css";

/**
 * Etapp 69c: huvudnavigeringen på en datorskärm. Ersätter INTE BottomNav.jsx – båda är
 * monterade samtidigt i App.jsx och CSS avgör vilken som syns (index.css:s brytpunkt,
 * `@media (min-width: 1024px)`). De får ALDRIG synas samtidigt (genomgående krav 34); ett
 * test i tests/e2e/sidomeny.spec.js bevisar det, inte bara en kommentar.
 *
 * Till skillnad från BottomNav visar den ALLA sidor samtidigt – ingen "Mer"-meny behövs när
 * det finns plats. Datan (vilka sidor, i vilken ordning) kommer från useNavigeringData.js,
 * samma källa BottomNav använder, så de två inte kan glida isär (se den filens motivering).
 */
export default function Sidomeny() {
  const { loggaUt } = useAuth();
  const { kiosk, huvud, ovriga } = useNavigeringData();
  const [pinOppen, setPinOppen] = useState(false);
  const navigate = useNavigate();

  const poster = [...huvud, ...ovriga];

  return (
    <>
      <nav className="sidomeny" aria-label="Huvudnavigering">
        <Symbol className="sidomeny__marke" />

        <button type="button" className="sidomeny__lank sidomeny__lank--knapp" onClick={oppnaKommandopalett}>
          <span className="sidomeny__ikon" aria-hidden="true">🔎</span>
          Sök
        </button>

        {poster.map((post) => (
          <NavLink key={post.till} to={post.till} end={post.end} className="sidomeny__lank">
            <span className="sidomeny__ikon" aria-hidden="true">{post.ikon}</span>
            {post.namn}
          </NavLink>
        ))}

        {kiosk && (
          <button
            type="button"
            className="sidomeny__lank sidomeny__lank--knapp"
            onClick={() => setPinOppen(true)}
          >
            <span className="sidomeny__ikon" aria-hidden="true">🔓</span>
            Lämna kioskläge
          </button>
        )}
      </nav>

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

// Samma geometri som public/icons/symbol.svg, inline av samma skäl som AuthSkal.jsx: en SVG
// laddad via <img> är ett eget dokument och kan inte färgsättas utifrån.
function Symbol({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g transform="translate(0.3 -1.0)" fill="none" stroke="currentColor">
        <circle cx="9.8" cy="11.2" r="3.15" fill="currentColor" stroke="none" />
        <path d="M 15.697 9.284 A 6.2 6.2 0 0 1 11.089 17.264" strokeWidth="2.7" strokeLinecap="round" />
      </g>
    </svg>
  );
}
