import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useFeedback, FEEDBACK_TYPER, FEEDBACK_TYP_LABELS } from "../hooks/useFeedback";
import { kontrolleraPatientuppgifter } from "../utils/piiFilter";
import "./Feedback.css";

export default function Feedback() {
  const { currentUser } = useAuth();
  const { skickaFeedback } = useFeedback(false);
  const [typ, setTyp] = useState(FEEDBACK_TYPER.FORSLAG);
  const [text, setText] = useState("");
  const [skickar, setSkickar] = useState(false);
  const [skickat, setSkickat] = useState(false);

  async function hanteraSubmit(e) {
    e.preventDefault();
    const kontroll = kontrolleraPatientuppgifter(text);
    if (kontroll.blockerad) {
      if (kontroll.meddelande) alert(kontroll.meddelande);
      return;
    }
    setSkickar(true);
    try {
      await skickaFeedback({
        typ,
        text,
        skapadAv: currentUser.uid,
        skapadAvNamn: currentUser.email,
      });
      setText("");
      setSkickat(true);
    } finally {
      setSkickar(false);
    }
  }

  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1>💬 Feedback</h1>
      <p className="sida__beskrivning">
        Har du ett förslag eller hittat ett problem? Skriv det här. Endast superadmin kan läsa det
        du skickar in.
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
    </div>
  );
}
