import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  useFeedback,
  useMinaFeedback,
  FEEDBACK_TYPER,
  FEEDBACK_TYP_LABELS,
  FEEDBACK_STATUS_LABELS,
} from "../hooks/useFeedback";
import { kontrolleraPatientuppgifter } from "../utils/piiFilter";
import { useDialog } from "../hooks/useDialog";
import { formateraDatum } from "../utils/datum";
import "./Feedback.css";

export default function Feedback() {
  const { currentUser } = useAuth();
  const { visaMeddelande } = useDialog();
  const { skickaFeedback } = useFeedback(false);
  const minaInskick = useMinaFeedback(currentUser.uid);
  const [typ, setTyp] = useState(FEEDBACK_TYPER.FORSLAG);
  const [text, setText] = useState("");
  const [skickar, setSkickar] = useState(false);
  const [skickat, setSkickat] = useState(false);

  async function hanteraSubmit(e) {
    e.preventDefault();
    const kontroll = kontrolleraPatientuppgifter(text);
    if (kontroll.blockerad) {
      if (kontroll.meddelande) visaMeddelande(kontroll.meddelande);
      return;
    }
    setSkickar(true);
    try {
      await skickaFeedback({ typ, text });
      setText("");
      setSkickat(true);
    } catch (fel) {
      visaMeddelande(fel.message ?? "Kunde inte skicka feedback.");
    } finally {
      setSkickar(false);
    }
  }

  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1><span aria-hidden="true">💬</span> Feedback</h1>
      <p className="sida__beskrivning">
        Har du ett förslag eller hittat ett problem? Skriv det här.{" "}
        <strong>Det här går till DIN ORGANISATIONS EGEN superadmin – inte till Synappsen
        (leverantören av appen).</strong> Vill du i stället kontakta Synappsen direkt, använd{" "}
        <Link to="/kontakta-leverantoren">Kontakta Synappsen</Link>.
      </p>

      {skickat && (
        <div className="feedback-tack">
          Tack för din feedback! Vill du skicka något mer?{" "}
          <button className="knapp--lank" onClick={() => setSkickat(false)}>
            Skriv ett nytt meddelande
          </button>
        </div>
      )}

      {!skickat && (
        <form className="feedback-formular" onSubmit={hanteraSubmit}>
          <label>
            Typ
            <select value={typ} onChange={(e) => setTyp(e.target.value)}>
              {Object.values(FEEDBACK_TYPER).map((v) => (
                <option key={v} value={v}>
                  {FEEDBACK_TYP_LABELS[v]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Meddelande
            <textarea
              required
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Beskriv ditt förslag eller problem..."
            />
          </label>
          <button type="submit" className="knapp" disabled={skickar}>
            {skickar ? "Skickar..." : "Skicka"}
          </button>
        </form>
      )}

      {minaInskick.length > 0 && (
        <section className="feedback-mina">
          <h2>Dina tidigare inskick</h2>
          <ul className="feedback-mina__lista">
            {minaInskick.map((f) => (
              <li key={f.id} className="feedback-mina__rad">
                <div className="feedback-mina__meta">
                  <span>{FEEDBACK_TYP_LABELS[f.typ] ?? f.typ}</span>
                  <span>{formateraDatum(f.skapad)}</span>
                  <span className={`feedback-mina__status feedback-mina__status--${f.status ?? "ny"}`}>
                    {FEEDBACK_STATUS_LABELS[f.status] ?? "Ny"}
                  </span>
                </div>
                <p>{f.text}</p>
                {f.svar && (
                  <div className="feedback-mina__svar">
                    <strong>Svar:</strong> {f.svar}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
