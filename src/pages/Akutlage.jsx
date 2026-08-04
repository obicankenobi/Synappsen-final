import { Link } from "react-router-dom";
import { useAkutlageRutiner } from "../hooks/useAkutlageRutiner";
import { useKontakter } from "../hooks/useKontakter";
import MarkdownInnehall from "../components/MarkdownInnehall";
import { telHref } from "../utils/telefon";
import "./Akutlage.css";

// Etapp 17c: helskärms, hög kontrast, medvetet FÅ val. Innehållet är kuraterat i förväg
// (rutiner: akutlage=true, VÖL/superadmin, se Sektionssida.jsx/RutinFormular.jsx; kontakter:
// akutnummer=true) och läses via samma useRutiner/useKontakter-frågor som resten av appen,
// som redan går via Firestores IndexedDB-cache (persistentLocalCache, src/firebase/
// config.js) – ingen separat nedladdningsknapp behövs, bara att sidan/frågan besökts en
// gång med nät gör innehållet läsbart offline efteråt. Ingen sökning krävs: den enda vägen
// hit är en enda knapptryckning från startsidan.
export default function Akutlage() {
  const { rutiner, laddar: laddarRutiner } = useAkutlageRutiner();
  const { kontakter, laddar: laddarKontakter } = useKontakter();
  const akutnummer = kontakter.filter((k) => k.akutnummer);

  return (
    // Etapp 45c: /akutlage renderas UTANFÖR SkyddatLayout (se App.jsx – ett medvetet val,
    // sidan har ingen BottomNav) och saknade därför helt <main id="huvudinnehall">. Utöver
    // axe-core: "region" gjorde det den globala "Hoppa till innehåll"-länken obsolet
    // (pekade mot ett id som inte fanns) på just den sida där ett snabbt tangentbordshopp
    // förbi ett hopp till innehållet borde spela störst roll.
    <main id="huvudinnehall" className="akutlage" tabIndex={-1}>
      <header className="akutlage__header">
        <h1>🚨 Akutläge</h1>
        <Link to="/" className="akutlage__stang">
          ✕ Stäng
        </Link>
      </header>

      {!laddarRutiner && !laddarKontakter && rutiner.length === 0 && akutnummer.length === 0 && (
        <p className="akutlage__tomt">
          Inget innehåll är kuraterat för akutläget än. En VÖL eller superadmin kan markera
          rutiner via "Visa i akutläget" och kontakter via "Visa i akutläget" i kontaktlistan.
        </p>
      )}

      {akutnummer.length > 0 && (
        <section className="akutlage__sektion">
          <h2>☎️ Larmnummer</h2>
          <ul className="akutlage__nummerlista">
            {akutnummer.map((k) => (
              <li key={k.id} className="akutlage__nummerrad">
                <span className="akutlage__nummer-namn">{k.namn}</span>
                <a className="akutlage__nummer" href={telHref(k.nummer)}>
                  📞 {k.nummer}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {rutiner.length > 0 && (
        <section className="akutlage__sektion">
          <h2>🩺 Tidskritiska rutiner</h2>
          <ul className="akutlage__rutinlista">
            {rutiner.map((r) => (
              <li key={r.id} className="akutlage__rutin">
                <h3>{r.titel}</h3>
                <MarkdownInnehall className="akutlage__rutin-innehall" text={r.innehall} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
