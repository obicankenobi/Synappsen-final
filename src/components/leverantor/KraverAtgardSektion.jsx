import "./KraverAtgardSektion.css";

const ALLVARLIGHET_IKON = {
  hog: "🔴",
  medel: "🟡",
  lag: "🔵",
};

// Etapp 67c (ETAPPLAN16.md): gör vyn styrande istället för bara beskrivande. Signalerna
// beräknas av den delade utilen src/utils/leverantorSignaler.js (byggd i 67b, se dess
// "Genomfört") – den här komponenten renderar bara, den räknar ingenting själv.
export default function KraverAtgardSektion({ signaler }) {
  return (
    <section className="admin-sektion krav-atgard">
      <h2><span aria-hidden="true">⚠️</span> Kräver åtgärd ({signaler.length})</h2>
      {signaler.length === 0 ? (
        <p className="sida__beskrivning">Inget kräver din uppmärksamhet just nu.</p>
      ) : (
        <ul className="krav-atgard__lista">
          {signaler.map((signal, i) => (
            <li key={`${signal.orgId ?? "plattform"}-${signal.typ}-${i}`} className="krav-atgard__rad">
              <span aria-hidden="true">{ALLVARLIGHET_IKON[signal.allvarlighet]}</span>
              {/* Etapp L1o: plattformsnivå-signaler (t.ex. åtagandekalendern) har ingen
                  organisation att länka till – orgNamn visas då som ren text, inte som länk. */}
              {signal.orgId ? (
                <a href={`#org-${signal.orgId}`} className="krav-atgard__lank">
                  {signal.orgNamn}
                </a>
              ) : (
                <span className="krav-atgard__lank">{signal.orgNamn}</span>
              )}
              <span className="krav-atgard__text">{signal.text}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
