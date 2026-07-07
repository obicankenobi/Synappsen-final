import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotiser } from "../hooks/useNotiser";
import "./Notisklocka.css";

export default function Notisklocka() {
  const { notiser, markeraSomLast } = useNotiser();
  const [oppen, setOppen] = useState(false);
  const navigate = useNavigate();

  function hanteraOppna() {
    setOppen((v) => !v);
    if (!oppen && notiser.length > 0) markeraSomLast();
  }

  function hanteraKlick(sokvag) {
    setOppen(false);
    navigate(sokvag);
  }

  return (
    <div className="notisklocka">
      <button type="button" className="notisklocka__knapp" onClick={hanteraOppna} aria-label="Notiser">
        🔔
        {notiser.length > 0 && <span className="notisklocka__badge">{notiser.length}</span>}
      </button>
      {oppen && (
        <div className="notisklocka__panel">
          {notiser.length === 0 && <p>Inget nytt sedan sist.</p>}
          <ul>
            {notiser.map((n) => (
              <li key={n.id}>
                <button onClick={() => hanteraKlick(n.sokvag)}>{n.text}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
