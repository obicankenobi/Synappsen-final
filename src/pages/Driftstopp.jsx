import { Link } from "react-router-dom";
import { useDriftstoppRutiner } from "../hooks/useDriftstoppRutiner";
import MarkdownInnehall from "../components/MarkdownInnehall";
import "./Driftstopp.css";

// Etapp 72f: driftstoppsläge, i samma anda som akutläget (Akutlage.jsx) men för scenariot
// "journalsystemet ligger nere" istället för ett kliniskt akutläge. Innehållet är kuraterat
// i förväg (rutiner: driftstopp=true, VÖL/superadmin, se Sektionssida.jsx/RutinFormular.jsx)
// och läses via samma useRutiner-mönster som resten av appen, som redan går via Firestores
// IndexedDB-cache (persistentLocalCache) – innehållet är läsbart offline så snart sidan
// besökts en gång med nät (se DriftstoppPrefetch.jsx, som håller frågan varm globalt).
//
// Avgränsning (ETAPPLAN19.md 72f): "signera 72a:s kontroller offline" byggs INTE här –
// 72a (kontrollsystem/loggbok) finns inte i kodbasen ännu, så det finns inget att signera.
// Se etapplaner/ETAPPLAN19.md för scoping-beslutet.
export default function Driftstopp() {
  const { rutiner, laddar } = useDriftstoppRutiner();

  return (
    // Utanför SkyddatLayout (se App.jsx – ett medvetet val, samma som /akutlage), sidan har
    // ingen BottomNav.
    <main id="huvudinnehall" className="driftstopp" tabIndex={-1}>
      <header className="driftstopp__header">
        <h1>🔌 Driftstopp — IT-avbrott</h1>
        <Link to="/" className="driftstopp__stang">
          ✕ Stäng
        </Link>
      </header>

      <section className="driftstopp__sektion driftstopp__intro">
        <h2>Vad gäller nu</h2>
        <p>
          Journalsystemet eller nätverket ligger nere. Rutinerna nedan är särskilt utvalda för
          det här scenariot och garanterat cachade – de går att läsa på den här enheten även
          utan internetuppkoppling, så länge sidan besökts en gång tidigare med nät.
          Dokumentera det som normalt skulle skrivits i journalsystemet på papper tills
          systemet är åter, enligt verksamhetens ordinarie reservrutin för dokumentation.
        </p>
      </section>

      {!laddar && rutiner.length === 0 && (
        <p className="driftstopp__tomt">
          Inget innehåll är kuraterat för driftstoppsläget än. En VÖL eller superadmin kan
          markera rutiner via "Visa i driftstoppsläget" i rutinformuläret.
        </p>
      )}

      {rutiner.length > 0 && (
        <section className="driftstopp__sektion">
          <h2>🩺 Reservrutiner vid IT-avbrott</h2>
          <ul className="driftstopp__rutinlista">
            {rutiner.map((r) => (
              <li key={r.id} className="driftstopp__rutin">
                <h3>{r.titel}</h3>
                <MarkdownInnehall className="driftstopp__rutin-innehall" text={r.innehall} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
