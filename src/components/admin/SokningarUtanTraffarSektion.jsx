import { Link } from "react-router-dom";
import { formateraTid } from "./adminHjalp";

// Etapp 62a: "Skapa rutin" öppnar rätt områdes sida med söktermen förifylld i formuläret
// (se Sektionssida.jsx) – bara de två områden som använder den gemensamma
// Sektionssida/RutinFormular-koden stöds (kliniskt stöd, administration). Förråd och
// akutläge har egna skapandeflöden och lämnas medvetet utanför den här genvägen.
const MALOMRADEN = [
  { sokvag: "/kliniskt-stod", etikett: "Kliniskt stöd" },
  { sokvag: "/administration", etikett: "Administration" },
];

export default function SokningarUtanTraffarSektion({ sokloggar, sokningarPerDag, maxPerDag }) {
  return (
    <details className="admin-sektion admin-sektion--hopfallbar" id="sokningar-utan-traffar">
      <summary><h2>Sökningar utan träffar</h2></summary>
      {sokloggar.length === 0 && (
        <p className="sida__beskrivning">Inga nolleträffar loggade ännu.</p>
      )}
      {sokningarPerDag.length > 0 && (
        <div className="admin-statistik-trend">
          {sokningarPerDag.map(([dag, antal]) => (
            <div key={dag} className="admin-statistik-trend__rad">
              <span className="admin-statistik-trend__dag">{dag}</span>
              <div className="admin-statistik-trend__bar-bakgrund">
                <div
                  className="admin-statistik-trend__bar"
                  style={{ width: `${(antal / maxPerDag) * 100}%` }}
                />
              </div>
              <span className="admin-statistik-trend__antal">{antal}</span>
            </div>
          ))}
        </div>
      )}
      <ul className="admin-lista admin-lista--vertikal">
        {sokloggar.map((s) => (
          <li key={s.id} className="admin-feedback-rad">
            <div className="admin-feedback-rad__meta">
              <span>"{s.term}"</span>
              <span>{formateraTid(s.tidpunkt)}</span>
            </div>
            {s.atgardad ? (
              <span className="admin-feedback-rad__atgard-klar">✓ Rutin skapad</span>
            ) : (
              <div className="admin-feedback-rad__atgarder">
                {MALOMRADEN.map((m) => (
                  <Link
                    key={m.sokvag}
                    className="knapp knapp--liten knapp--sekundar"
                    to={m.sokvag}
                    state={{ sokloggTitel: s.term, sokloggId: s.id }}
                  >
                    Skapa rutin – {m.etikett}
                  </Link>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
