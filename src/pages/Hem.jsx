import { Link } from "react-router-dom";
import SokFalt from "../components/SokFalt";
import SektionsKort from "../components/SektionsKort";
import Notisklocka from "../components/Notisklocka";
import { useAuth } from "../hooks/useAuth";
import { useMinaFavoritPoster } from "../hooks/useMinaFavoritPoster";
import { usePopularaste } from "../hooks/useVisningar";
import { ROLE_LABELS } from "../firebase/roles";

export default function Hem() {
  const { currentUser, role, loggaUt } = useAuth();
  const favoritPoster = useMinaFavoritPoster();
  const populara = usePopularaste(5);

  return (
    <div className="sida sida--hem">
      <header className="hem__header">
        <div>
          <h1>Synappsen</h1>
          {currentUser && (
            <p className="hem__valkommen">
              Inloggad som {currentUser.email}
              {role && ` (${ROLE_LABELS[role] ?? role})`}
            </p>
          )}
        </div>
        <div className="hem__header-atgarder">
          <Notisklocka />
          {currentUser && (
            <button className="knapp knapp--sekundar" onClick={loggaUt}>
              Logga ut
            </button>
          )}
        </div>
      </header>

      <nav className="hem__snabblankar">
        <Link to="/anslag">📢 Anslagstavla</Link>
        <Link to="/nyheter">🆕 Nyheter</Link>
        <Link to="/feedback">💬 Feedback</Link>
        <Link to="/hjalp">❓ Hjälp</Link>
        <Link to="/profil">👤 Min profil</Link>
        <Link to="/kontakter">☎️ Kontakter</Link>
        <Link to="/lankbibliotek">🔗 Länkbibliotek</Link>
        <Link to="/papperskorg">🗑️ Papperskorg</Link>
      </nav>

      <SokFalt />

      {favoritPoster.length > 0 && (
        <section className="hem__sektion">
          <h2>⭐ Mina favoriter</h2>
          <ul className="hem__lista">
            {favoritPoster.map((p, i) => (
              <li key={i}>
                <Link to={p.sokvag}>{p.titel}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {populara.length > 0 && (
        <section className="hem__sektion">
          <h2>🔥 Mest använda</h2>
          <ul className="hem__lista">
            {populara.map((p) => (
              <li key={p.id}>
                <Link to={p.sokvag}>{p.titel}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="hem__kort-grid">
        <SektionsKort
          titel="Kliniskt stöd"
          beskrivning="Handläggningsrutiner, triagering och kom-ihåg-saker"
          ikon="🩺"
          lank="/kliniskt-stod"
        />
        <SektionsKort
          titel="Logistik"
          beskrivning="Introduktionsguide och förvaringskarta"
          ikon="📦"
          lank="/logistik"
        />
        <SektionsKort
          titel="Administration"
          beskrivning="Policys, regelverk och anslag"
          ikon="📋"
          lank="/administration"
        />
        <SektionsKort
          titel="Ladda upp dokument"
          beskrivning="Fota en whiteboard eller ett papper – Gemini tolkar innehållet"
          ikon="📷"
          lank="/ladda-upp"
        />
        <SektionsKort
          titel="Skiftrapport"
          beskrivning="Praktisk drift-info mellan skift (ej patientinformation)"
          ikon="🛠️"
          lank="/skiftrapport"
        />
      </div>
    </div>
  );
}
