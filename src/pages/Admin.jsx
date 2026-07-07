import { useState } from "react";
import { useAnvandare } from "../hooks/useAnvandare";
import { useAuth } from "../hooks/useAuth";
import { useGeminiBudget } from "../hooks/useGeminiBudget";
import { useFeedback, FEEDBACK_TYP_LABELS } from "../hooks/useFeedback";
import { useSokloggar } from "../hooks/useSokloggar";
import { useAuditlogg } from "../hooks/useAuditlogg";
import { ROLES, ROLE_LABELS } from "../firebase/roles";
import "./Admin.css";

function formateraTid(tidpunkt) {
  if (!tidpunkt?.toDate) return "";
  return tidpunkt.toDate().toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

export default function Admin() {
  const { anvandare, laddar, uppdateraRoll } = useAnvandare();
  const { currentUser } = useAuth();
  const { budget, satTakKr } = useGeminiBudget();
  const { feedback, taBortFeedback } = useFeedback(true);
  const { sokloggar } = useSokloggar(true);
  const { auditlogg } = useAuditlogg(true);
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

      <section className="admin-sektion">
        <h2>Feedback från användare ({feedback.length})</h2>
        {feedback.length === 0 && <p className="sida__beskrivning">Ingen feedback ännu.</p>}
        <ul className="admin-lista admin-lista--vertikal">
          {feedback.map((f) => (
            <li key={f.id} className="admin-feedback-rad">
              <div className="admin-feedback-rad__meta">
                <span className="admin-feedback-rad__typ">{FEEDBACK_TYP_LABELS[f.typ] ?? f.typ}</span>
                <span>{f.skapadAvNamn}</span>
                <span>{formateraTid(f.skapad)}</span>
              </div>
              <p>{f.text}</p>
              <button className="knapp knapp--farlig knapp--liten" onClick={() => taBortFeedback(f.id)}>
                Ta bort
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-sektion">
        <h2>Sökningar utan träffar</h2>
        {sokloggar.length === 0 && (
          <p className="sida__beskrivning">Inga nolleträffar loggade ännu.</p>
        )}
        <ul className="admin-lista admin-lista--vertikal">
          {sokloggar.map((s) => (
            <li key={s.id} className="admin-feedback-rad">
              <div className="admin-feedback-rad__meta">
                <span>"{s.term}"</span>
                <span>{formateraTid(s.tidpunkt)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-sektion">
        <h2>Ändringslogg</h2>
        {auditlogg.length === 0 && <p className="sida__beskrivning">Inga händelser loggade ännu.</p>}
        <ul className="admin-lista admin-lista--vertikal">
          {auditlogg.map((a) => (
            <li key={a.id} className="admin-feedback-rad">
              <div className="admin-feedback-rad__meta">
                <span>{a.beskrivning}</span>
                <span>{formateraTid(a.tidpunkt)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
