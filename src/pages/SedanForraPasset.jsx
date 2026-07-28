import { useState } from "react";
import { Link } from "react-router-dom";
import { useSedanForraPasset } from "../hooks/useSedanForraPasset";
import "./SedanForraPasset.css";

const TYP_IKON = {
  anslag: "📌",
  rutin: "🩺",
  skiftrapport: "🛠️",
};

// Etapp 25b/25c: den fulla sidan bakom startsidans kort (SedanForraPassetKort.jsx) – visar
// ALLA poster, grupperade per typ, med möjlighet att kvittera direkt ur listan (25c) utan att
// öppna varje post för sig. Mikrokvittensen (Etapp 19b) gäller fortfarande där den redan finns
// (RutinKort.jsx/Anslagstavla.jsx) – det här är en GENVÄG till samma kvittering, inte en ny
// mekanism.
export default function SedanForraPasset() {
  const { poster, sedan } = useSedanForraPasset();
  const [kvitterade, setKvitterade] = useState(new Set());

  async function hanteraKvittera(post) {
    await post.kvittera();
    setKvitterade((f) => new Set(f).add(post.id));
  }

  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1>🕑 Sedan ditt förra pass</h1>
      <p className="sida__beskrivning">
        {sedan?.toDate
          ? `Sammanställning sedan din förra inloggning, ${sedan.toDate().toLocaleString("sv-SE")}.`
          : "Sammanställning av det senaste i Synappsen."}
      </p>

      {poster.length === 0 ? (
        <p className="sida__beskrivning">Inget nytt sedan ditt förra pass. 🎉</p>
      ) : (
        <ul className="sedan-forra-passet__lista">
          {poster.map((p) => (
            <li key={p.id} className="sedan-forra-passet__rad">
              <span className="sedan-forra-passet__ikon" aria-hidden="true">
                {TYP_IKON[p.typ] ?? "•"}
              </span>
              <Link to={p.sokvag} className="sedan-forra-passet__text">
                {p.text}
              </Link>
              {p.kanKvittera && (
                <button
                  type="button"
                  className="knapp knapp--liten knapp--sekundar"
                  disabled={kvitterade.has(p.id)}
                  onClick={() => hanteraKvittera(p)}
                >
                  {kvitterade.has(p.id) ? "✓ Kvitterat" : "Läst och förstått"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
