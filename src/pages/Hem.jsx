import { Link } from "react-router-dom";
import SokFalt from "../components/SokFalt";
import SektionsKort from "../components/SektionsKort";
import { useAuth } from "../hooks/useAuth";
import { useRutiner } from "../hooks/useRutiner";
import { useForradsartiklar, ARTIKEL_STATUS } from "../hooks/useForradsartiklar";
import { useFavoriter } from "../hooks/useFavoriter";
import { usePopularaste } from "../hooks/useVisningar";
import { ROLE_LABELS } from "../firebase/roles";
import { forradTillSlug } from "../firebase/forrad";

export default function Hem() {
  const { currentUser, role, loggaUt } = useAuth();
  const { favoriter } = useFavoriter(currentUser?.uid);
  const populara = usePopularaste(5);

  const { rutiner: klinisktRutiner } = useRutiner("kliniskt-stod");
  const { rutiner: adminRutiner } = useRutiner("administration");
  const { artiklar } = useForradsartiklar();

  const favoritRutiner = [...klinisktRutiner, ...adminRutiner]
    .filter((r) => favoriter.includes(`rutin:${r.id}`))
    .map((r) => ({ titel: r.titel, sokvag: r.omrade === "kliniskt-stod" ? "/kliniskt-stod" : "/administration" }));

  const favoritArtiklar = artiklar
    .filter((a) => a.status === ARTIKEL_STATUS.GODKAND && favoriter.includes(`artikel:${a.id}`))
    .map((a) => ({ titel: a.namn, sokvag: `/logistik/${forradTillSlug(a.forrad)}` }));

  const favoritPoster = [...favoritRutiner, ...favoritArtiklar];

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
        {currentUser && (
          <button className="knapp knapp--sekundar" onClick={loggaUt}>
            Logga ut
          </button>
        )}
      </header>

      <nav className="hem__snabblankar">
        <Link to="/anslag">📢 Anslagstavla</Link>
        <Link to="/nyheter">🆕 Nyheter</Link>
        <Link to="/feedback">💬 Feedback</Link>
        <Link to="/hjalp">❓ Hjälp</Link>
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
      </div>
    </div>
  );
}
