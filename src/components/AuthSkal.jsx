import "./AuthSkal.css";

/**
 * Gemensamt skal för LoggaIn och Registrera (Etapp 69h).
 *
 * Varför en delad komponent och inte två uppsättningar klasser: sidorna hade tidigare var sin
 * kopia av samma markup med samma klassnamn (`sida sida--auth`), vilket är exakt det mönster
 * som gjort dokument i det här projektet inaktuella gång på gång – två ställen som ska
 * ändras, och bara det ena blir ändrat. Nu finns skalet på ett ställe.
 *
 * Layouten är avsiktligt en del av Etapp 69: över 1024 px delad vy med märkespanel till
 * vänster, under den bara formuläret med en kompakt märkesrad ovanför. Samma brytpunkt som
 * sidomenyn i 69c, beslutad i BESLUTSLOGG.md 2026-08-22.
 */
export default function AuthSkal({ rubrik, undertext, children, foten }) {
  return (
    <div className="auth-skal">
      <aside className="auth-panel" aria-hidden="true">
        <Symbol className="auth-panel__vattenmarke" />
        <div className="auth-panel__innehall">
          <div className="auth-panel__marke">
            <Symbol className="auth-panel__symbol" />
            <span className="auth-panel__ordmarke">Synappsen</span>
          </div>
          <p className="auth-panel__rad">Kunskapsbank för akutmottagningen.</p>
          <ul className="auth-panel__omraden">
            <li>Kliniskt stöd</li>
            <li>Logistik</li>
            <li>Regler och rutiner</li>
          </ul>
        </div>
      </aside>

      <main id="huvudinnehall" className="auth-vy" tabIndex={-1}>
        <div className="auth-vy__kort">
          {/* Syns bara under brytpunkten – över den bär panelen märket i stället. */}
          <div className="auth-vy__marke">
            <Symbol className="auth-vy__symbol" />
            <span>Synappsen</span>
          </div>
          <h1>{rubrik}</h1>
          {undertext && <p className="auth__undertext">{undertext}</p>}
          {children}
          {foten}
          {/* Etapp 74 (granskningar/TILLGANGLIGHETSREDOGORELSE.md, "Att göra före publicering"
              p. 2): redogörelsen fanns publicerad på marknadswebbplatsen sedan tidigare, men
              ingenstans länkad FRÅN appen – varken hjälpsidan eller inloggningssidan, som
              dokumentet självt pekar ut som lämpligast. */}
          <p className="auth__tillganglighet">
            <a href="https://synappsen.se/tillganglighet.html" target="_blank" rel="noreferrer">
              Tillgänglighetsredogörelse
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

/**
 * Symbolen inline i stället för via <img>, så att den ärver färgen från sitt sammanhang.
 * En SVG som laddas genom en img-tagg är ett eget dokument och kan inte färgsättas utifrån –
 * samma skäl som står i public/icons/symbol.svg. Geometrin är identisk med den filen.
 */
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
