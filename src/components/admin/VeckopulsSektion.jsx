import { Link } from "react-router-dom";
import { formateraTid, OMRADE_NAMN, OMRADE_SOKVAG } from "./adminHjalp";

// Etapp 62b: veckopulsen ETAPPLAN3.md Etapp 16 föreslog, byggd som den minsta meningsfulla
// versionen – INGET nytt mätvärde samlas in, bara tre redan befintliga signaler (utgångna
// rutiner, obesvarade ändringsförslag, sökningar utan träffar) sorterade efter vad som är
// värt att göra först, med en direktlänk per rad. E-postutskick (planens "om Brevo-nyckeln
// finns...") byggs medvetet INTE här – det kräver en egen schemalagd funktion och
// prenumerationshantering, en väsentligt större insats än vyn, se ETAPPLAN12.md §62b.
export default function VeckopulsSektion({ utgangnaRutiner, oppnaForslag, oppnaSokluckor }) {
  const totalt = utgangnaRutiner.length + oppnaForslag.length + oppnaSokluckor.length;

  return (
    <details className="admin-sektion admin-sektion--hopfallbar" open>
      <summary><h2>📋 Veckopuls – vad är värt att göra först</h2></summary>
      <p className="sida__beskrivning">
        De tre vanligaste sakerna som väntar på en redaktör, sorterade efter angelägenhet.
        Inget nytt mätvärde – bara det som redan samlas in någon annanstans i panelen, samlat.
      </p>
      {totalt === 0 ? (
        <p className="sida__beskrivning">Inget väntar just nu. 🎉</p>
      ) : (
        <ul className="admin-lista admin-lista--vertikal">
          {utgangnaRutiner.map((r) => (
            <li key={`utgangen-${r.id}`} className="admin-feedback-rad">
              <div className="admin-feedback-rad__meta">
                <span className="admin-feedback-rad__typ">Utgången rutin</span>
                <span>{OMRADE_NAMN[r.omrade] ?? r.omrade}</span>
              </div>
              <p>{r.titel}</p>
              <Link className="knapp knapp--liten knapp--sekundar" to={`${OMRADE_SOKVAG[r.omrade] ?? "/"}#rutin-${r.id}`}>
                Öppna rutinen
              </Link>
            </li>
          ))}
          {oppnaForslag.map((f) => (
            <li key={`forslag-${f.id}`} className="admin-feedback-rad">
              <div className="admin-feedback-rad__meta">
                <span className="admin-feedback-rad__typ">Obesvarat ändringsförslag</span>
                <span>{OMRADE_NAMN[f.omrade] ?? f.omrade}</span>
                <span>{formateraTid(f.tidpunkt)}</span>
              </div>
              <p>{f.rutinTitel}</p>
              <Link
                className="knapp knapp--liten knapp--sekundar"
                to={`${OMRADE_SOKVAG[f.omrade] ?? "/"}#rutin-${f.rutinId}`}
              >
                Öppna rutinen
              </Link>
            </li>
          ))}
          {oppnaSokluckor.map((s) => (
            <li key={`sokning-${s.id}`} className="admin-feedback-rad">
              <div className="admin-feedback-rad__meta">
                <span className="admin-feedback-rad__typ">Sökning utan träff</span>
                <span>{formateraTid(s.tidpunkt)}</span>
              </div>
              <p>"{s.term}"</p>
              <a className="knapp knapp--liten knapp--sekundar" href="#sokningar-utan-traffar">
                Skapa rutin
              </a>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
