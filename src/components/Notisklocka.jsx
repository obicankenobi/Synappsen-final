import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotiser } from "../hooks/useNotiser";
import "./Notisklocka.css";

export default function Notisklocka() {
  const { notiser, markeraSomLast } = useNotiser();
  const [oppen, setOppen] = useState(false);
  const navigate = useNavigate();
  const knappRef = useRef(null);

  function hanteraOppna() {
    setOppen((v) => !v);
    if (!oppen && notiser.length > 0) markeraSomLast();
  }

  function hanteraKlick(sokvag) {
    setOppen(false);
    navigate(sokvag);
  }

  // Stäng med Escape och lägg fokus tillbaka på klockan, så tangentbordsanvändare inte fastnar
  useEffect(() => {
    if (!oppen) return;
    function hanteraTangent(e) {
      if (e.key === "Escape") {
        setOppen(false);
        knappRef.current?.focus();
      }
    }
    document.addEventListener("keydown", hanteraTangent);
    return () => document.removeEventListener("keydown", hanteraTangent);
  }, [oppen]);

  return (
    <div className="notisklocka">
      <button
        ref={knappRef}
        type="button"
        className="notisklocka__knapp"
        onClick={hanteraOppna}
        aria-label="Notiser"
        aria-haspopup="true"
        aria-expanded={oppen}
      >
        🔔
        {notiser.length > 0 && <span className="notisklocka__badge">{notiser.length}</span>}
      </button>
      {oppen && (
        <div className="notisklocka__panel" role="menu">
          {notiser.length === 0 && <p>Inget nytt sedan sist.</p>}
          <ul>
            {notiser.map((n) => (
              <li key={n.id}>
                <button role="menuitem" onClick={() => hanteraKlick(n.sokvag)}>
                  {n.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
