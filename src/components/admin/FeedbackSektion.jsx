import { FEEDBACK_TYP_LABELS, FEEDBACK_STATUS, FEEDBACK_STATUS_LABELS } from "../../hooks/useFeedback";
import { formateraTid } from "./adminHjalp";

export default function FeedbackSektion({
  feedback,
  svarUtkast,
  setSvarUtkast,
  hanteraSvaraPaFeedback,
  taBortFeedback,
  uppdateraFeedbackStatus,
}) {
  return (
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
              <select
                value={f.status ?? FEEDBACK_STATUS.NY}
                onChange={(e) => uppdateraFeedbackStatus(f.id, e.target.value)}
              >
                {Object.values(FEEDBACK_STATUS).map((s) => (
                  <option key={s} value={s}>
                    {FEEDBACK_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <p>{f.text}</p>
            {f.svar && (
              <p className="admin-feedback-rad__svar">
                <strong>Ditt svar:</strong> {f.svar}
              </p>
            )}
            <div className="admin-feedback-rad__svarformular">
              <input
                type="text"
                placeholder="Skriv ett svar till avsändaren..."
                value={svarUtkast[f.id] ?? ""}
                onChange={(e) => setSvarUtkast((u) => ({ ...u, [f.id]: e.target.value }))}
              />
              <button className="knapp knapp--liten" onClick={() => hanteraSvaraPaFeedback(f.id)}>
                Svara
              </button>
            </div>
            <button className="knapp knapp--farlig knapp--liten" onClick={() => taBortFeedback(f.id)}>
              Ta bort
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
