import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMinaLeverantorsfeedback } from "../hooks/useLeverantorsfeedback";
import { kontrolleraPatientuppgifter } from "../utils/piiFilter";
import { useDialog } from "../hooks/useDialog";
import { formateraDatum } from "../utils/datum";
import "./Feedback.css";

// Etapp L1 beslutspunkt 7 (avgjord 2026-08-30): en EGEN, tydligt märkt kanal till Synappsen
// (leverantören) – till skillnad från /feedback, som går till DIN ORGANISATIONS EGEN
// superadmin och aldrig når Synappsen. De två skrivs till helt olika collections
// (leverantorsfeedback respektive feedback) för att en tyst utvidgning av vem som läser den
// befintliga feedbacken aldrig ska kunna hända.
export default function KontaktaLeverantoren() {
  const { currentUser } = useAuth();
  const { visaMeddelande } = useDialog();
  const { poster, skickaLeverantorsfeedback } = useMinaLeverantorsfeedback(currentUser.uid);
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
      await skickaLeverantorsfeedback(text);
      setText("");
      setSkickat(true);
    } catch (fel) {
      visaMeddelande(fel.message ?? "Kunde inte skicka meddelandet.");
    } finally {
      setSkickar(false);
    }
  }

  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1>📮 Kontakta Synappsen</h1>
      <p className="sida__beskrivning">
        <strong>Det här går till Synappsen (leverantören av appen) – inte till din
        organisations admin.</strong> Vill du i stället nå din egen organisations superadmin,
        använd <Link to="/feedback">Feedback</Link>. Skriv aldrig patientuppgifter eller
        personnummer här.
      </p>

      {skickat && (
        <div className="feedback-tack">
          Tack! Meddelandet är skickat till Synappsen. Vill du skicka något mer?{" "}
          <button className="knapp--lank" onClick={() => setSkickat(false)}>
            Skriv ett nytt meddelande
          </button>
        </div>
      )}

      {!skickat && (
        <form className="feedback-formular" onSubmit={hanteraSubmit}>
          <label>
            Meddelande till Synappsen
            <textarea
              required
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Beskriv din fråga eller ditt ärende till leverantören..."
            />
          </label>
          <button type="submit" className="knapp" disabled={skickar}>
            {skickar ? "Skickar..." : "Skicka till Synappsen"}
          </button>
        </form>
      )}

      {poster.length > 0 && (
        <section className="feedback-mina">
          <h2>Dina tidigare meddelanden till Synappsen</h2>
          <ul className="feedback-mina__lista">
            {poster.map((p) => (
              <li key={p.id} className="feedback-mina__rad">
                <div className="feedback-mina__meta">
                  <span>{formateraDatum(p.skapad)}</span>
                  <span className="feedback-mina__status">{p.last ? "Läst" : "Väntar"}</span>
                </div>
                <p>{p.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
