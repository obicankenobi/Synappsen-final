import { useState } from "react";
import { ROLES, ROLE_LABELS } from "../../firebase/roles";

// Etapp 66c: eget litet fält för ansvarsområden per rad, samma "kommaseparerad text,
// split/trim/filter vid spara"-mönster som taggar redan använder i RutinFormular.jsx. Egen
// komponent eftersom varje rad behöver sin egen lokala inputtext innan den sparas – annars
// skulle en enda delad state i föräldern skriva om alla rader samtidigt.
function AnsvarsomradenFalt({ anvandarpost, uppdateraAnsvarsomraden, currentUser, organisationId }) {
  const [text, setText] = useState((anvandarpost.ansvarsomraden ?? []).join(", "));
  const [sparar, setSparar] = useState(false);

  async function hanteraSpara() {
    const omraden = text
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    setSparar(true);
    try {
      await uppdateraAnsvarsomraden(anvandarpost.id, omraden, currentUser.uid, organisationId);
    } finally {
      setSparar(false);
    }
  }

  return (
    <label className="admin-lista__ansvarsomraden">
      Ansvarsområden
      <input
        type="text"
        placeholder="T.ex. medicinteknik, brandskydd"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={hanteraSpara}
        disabled={sparar}
        aria-label={`Ansvarsområden för ${anvandarpost.namn || anvandarpost.email || "användare"}`}
      />
    </label>
  );
}

export default function AnvandareRollerSektion({
  anvandare,
  laddar,
  currentUser,
  organisationId,
  uppdateraRoll,
  uppdateraAnsvarsomraden,
  loggarUtAnvandare,
  hanteraTvingaUtloggning,
}) {
  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2>Användare och roller</h2></summary>
      {laddar && <p>Laddar...</p>}
      <ul className="admin-lista">
        {anvandare.map((anvandarpost) => (
          <li key={anvandarpost.id} className="admin-lista__rad">
            <div>
              <strong>{anvandarpost.namn || "(namn saknas)"}</strong>
              <div className="admin-lista__email">{anvandarpost.email}</div>
            </div>
            <div className="admin-lista__atgarder">
              <select
                value={anvandarpost.role}
                disabled={anvandarpost.id === currentUser.uid}
                onChange={(e) => uppdateraRoll(anvandarpost.id, e.target.value)}
                aria-label={`Roll för ${anvandarpost.namn || anvandarpost.email || "användare"}`}
              >
                {Object.values(ROLES).map((roll) => (
                  <option key={roll} value={roll}>
                    {ROLE_LABELS[roll]}
                  </option>
                ))}
              </select>
              <AnsvarsomradenFalt
                anvandarpost={anvandarpost}
                uppdateraAnsvarsomraden={uppdateraAnsvarsomraden}
                currentUser={currentUser}
                organisationId={organisationId}
              />
              {anvandarpost.id !== currentUser.uid && (
                <button
                  type="button"
                  className="knapp knapp--farlig knapp--liten"
                  disabled={loggarUtAnvandare === anvandarpost.id}
                  onClick={() => hanteraTvingaUtloggning(anvandarpost)}
                >
                  {loggarUtAnvandare === anvandarpost.id ? "..." : "Tvinga utloggning"}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}
