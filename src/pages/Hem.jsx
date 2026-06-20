import SokFalt from "../components/SokFalt";
import SektionsKort from "../components/SektionsKort";
import { useAuth } from "../hooks/useAuth";
import { ROLE_LABELS } from "../firebase/roles";

export default function Hem() {
  const { currentUser, role, loggaUt } = useAuth();

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

      <SokFalt />

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
