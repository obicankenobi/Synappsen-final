import { useEffect, useState } from "react";
import { hamtaKundmatvarden } from "../../firebase/functions";
import { genereraSparklinePath } from "../../utils/sparkline";

const METRIKER = [
  { nyckel: "kvitteringsgradKlinisktStod", etikett: "Kvitteringsgrad, kliniskt stöd", enhet: "%" },
  { nyckel: "kvitteringsgradAdministration", etikett: "Kvitteringsgrad, administration", enhet: "%" },
  { nyckel: "andelNollTraffar", etikett: "Andel nollträffar i sök", enhet: "%" },
  { nyckel: "innehallshalsaKlinisktStod", etikett: "Innehållshälsa, kliniskt stöd", enhet: "%" },
];

function Sparkline({ varden, etikett }) {
  const path = genereraSparklinePath(varden);
  if (!path) {
    return <p className="sida__beskrivning">Ingen data ännu.</p>;
  }
  return (
    <svg
      viewBox="0 0 200 40"
      width="200"
      height="40"
      role="img"
      aria-label={`Trend, senaste veckorna: ${etikett}`}
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// Etapp L1c+L1d (beslutspunkt 1 respektive 3, båda avgjorda 2026-08-30): mätvärdesaggregat
// via en spårbar Cloud Function (hamtaKundmatvarden), visualiserade som egna inline-SVG-
// sparklines – inget diagrambibliotek, inget CSP-undantag. Varje diagram har en
// textalternativ-tabell bakom <details> (WCAG-krav från planen, och ofta det man faktiskt
// vill läsa av).
export default function KundHalsaSektion({ orgId, onFel }) {
  const [snapshots, setSnapshots] = useState(null);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- orgId är en EXTERN nyckel (URL-param
       via KundLayout); en ny kund ska visa "Laddar..." omedelbart. */
    setLaddar(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    hamtaKundmatvarden(orgId)
      .then(({ data }) => setSnapshots(data.snapshots))
      .catch((fel) => onFel?.(fel.message ?? "Kunde inte hämta mätvärdena."))
      .finally(() => setLaddar(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hämtas om bara när orgId byts
  }, [orgId]);

  if (laddar) {
    return <p className="sida__beskrivning">Laddar...</p>;
  }
  if (!snapshots || snapshots.length === 0) {
    return (
      <p className="sida__beskrivning">
        Inga mätvärdesögonblicksbilder ännu – tas varje måndag. Se{" "}
        <code>functions/matvarden.js</code>.
      </p>
    );
  }

  return (
    <div className="kund-halsa">
      {METRIKER.map((metrik) => (
        <div key={metrik.nyckel} className="kund-halsa__rad">
          <h3>{metrik.etikett}</h3>
          <Sparkline
            varden={snapshots.map((s) => s[metrik.nyckel])}
            etikett={metrik.etikett}
          />
          <details>
            <summary>Siffror bakom kurvan</summary>
            <table className="kund-halsa__tabell">
              <thead>
                <tr>
                  <th>Vecka</th>
                  <th>Värde</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s) => (
                  <tr key={s.datum}>
                    <td>{s.datum}</td>
                    <td>
                      {s[metrik.nyckel] != null ? `${s[metrik.nyckel]}${metrik.enhet}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      ))}
    </div>
  );
}
