import { ROLES, ROLE_LABELS } from "../../firebase/roles";

export default function AnvandareRollerSektion({
  anvandare,
  laddar,
  currentUser,
  uppdateraRoll,
  loggarUtAnvandare,
  hanteraTvingaUtloggning,
}) {
  return (
    <section className="admin-sektion">
      <h2>Användare och roller</h2>
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
              >
                {Object.values(ROLES).map((roll) => (
                  <option key={roll} value={roll}>
                    {ROLE_LABELS[roll]}
                  </option>
                ))}
              </select>
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
    </section>
  );
}
