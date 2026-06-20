import { useAnvandare } from "../hooks/useAnvandare";
import { useAuth } from "../hooks/useAuth";
import { ROLES, ROLE_LABELS } from "../firebase/roles";
import "./Admin.css";

export default function Admin() {
  const { anvandare, laddar, uppdateraRoll } = useAnvandare();
  const { currentUser } = useAuth();

  return (
    <div className="sida">
      <h1>Adminpanel</h1>
      <p className="sida__beskrivning">
        Hantera roller för alla registrerade användare.
      </p>

      {laddar && <p>Laddar...</p>}

      <ul className="admin-lista">
        {anvandare.map((anvandarpost) => (
          <li key={anvandarpost.id} className="admin-lista__rad">
            <div>
              <strong>{anvandarpost.namn || "(namn saknas)"}</strong>
              <div className="admin-lista__email">{anvandarpost.email}</div>
            </div>
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
          </li>
        ))}
      </ul>
    </div>
  );
}
