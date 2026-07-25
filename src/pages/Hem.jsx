import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SokFalt from "../components/SokFalt";
import SektionsKort from "../components/SektionsKort";
import Notisklocka from "../components/Notisklocka";
import MinaUppgifter from "../components/MinaUppgifter";
import { useAuth } from "../hooks/useAuth";
import { useMinaFavoritPoster } from "../hooks/useMinaFavoritPoster";
import { usePopularaste } from "../hooks/useVisningar";
import { useSnabblankar } from "../hooks/useSnabblankar";
import { ROLE_LABELS } from "../firebase/roles";
import { lasSenastBesokta } from "../utils/senastBesokta";

export default function Hem() {
  const { currentUser, role, loggaUt } = useAuth();
  const favoritPoster = useMinaFavoritPoster();
  const populara = usePopularaste(5);
  const { synliga: snabblankar } = useSnabblankar(currentUser?.uid);
  // Lazy useState-init (körs en gång vid montering) istället för useEffect+useState, eftersom
  // localStorage inte ändras av något annat i appen medan Hem är monterad.
  const [senastBesokta] = useState(() => lasSenastBesokta());

  // Tangentbordsgenväg: tryck "/" var som helst på sidan för att hoppa till sökfältet,
  // utom när man redan skriver i ett annat fält.
  useEffect(() => {
    function hanteraTangent(e) {
      if (e.key !== "/") return;
      const aktivt = document.activeElement;
      const skriverRedan =
        aktivt && (aktivt.tagName === "INPUT" || aktivt.tagName === "TEXTAREA" || aktivt.isContentEditable);
      if (skriverRedan) return;
      e.preventDefault();
      document.querySelector(".sok-falt input")?.focus();
    }
    document.addEventListener("keydown", hanteraTangent);
    return () => document.removeEventListener("keydown", hanteraTangent);
  }, []);

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
        {snabblankar.map((s) => (
          <Link key={s.nyckel} to={s.sokvag}>
            {s.ikon} {s.namn}
          </Link>
        ))}
      </nav>

      <SokFalt />

      <MinaUppgifter />

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

      {senastBesokta.length > 0 && (
        <section className="hem__sektion">
          <h2>🕓 Senast besökta</h2>
          <ul className="hem__lista">
            {senastBesokta.map((p) => (
              <li key={p.id}>
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
        <SektionsKort
          titel="Offline-center"
          beskrivning="Ladda ner godkända rutiner så de går att läsa utan internet"
          ikon="📥"
          lank="/offline-center"
        />
      </div>
    </div>
  );
}
