import { useState } from "react";
import { useAnvandare } from "../hooks/useAnvandare";
import { useAuth } from "../hooks/useAuth";
import { useGeminiBudget } from "../hooks/useGeminiBudget";
import { ROLES, ROLE_LABELS } from "../firebase/roles";
import "./Admin.css";

export default function Admin() {
  const { anvandare, laddar, uppdateraRoll } = useAnvandare();
  const { currentUser } = useAuth();
  const { budget, satTakKr } = useGeminiBudget();
  const [nyttTak, setNyttTak] = useState("");

  async function hanteraNyttTak(e) {
    e.preventDefault();
    if (!nyttTak) return;
    await satTakKr(Number(nyttTak));
    setNyttTak("");
  }

  return (
    <div className="sida">
      <h1>Adminpanel</h1>

      <section className="admin-sektion">
        <h2>Budget för bildtolkning (Gemini)</h2>
        {budget && (
          <p className="sida__beskrivning">
            Använt denna månad: <strong>{(budget.anvantOre / 100).toFixed(2)} kr</strong> av{" "}
            <strong>{(budget.taketOre / 100).toFixed(2)} kr</strong>.
            {budget.anvantOre >= budget.taketOre && (
              <span className="admin-budget__sparrad"> Taket är nått – tolkning är pausad.</span>
            )}
          </p>
        )}
        <form className="admin-budget__form" onSubmit={hanteraNyttTak}>
          <input
            type="number"
            min="0"
            step="10"
            placeholder="Nytt tak i kr"
            value={nyttTak}
            onChange={(e) => setNyttTak(e.target.value)}
          />
          <button type="submit" className="knapp">
            Uppdatera tak
          </button>
        </form>
      </section>

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
      </section>
    </div>
  );
}
