import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useKommentarer } from "../hooks/useKommentarer";
import "./Kommentarer.css";

function formateraTid(tidpunkt) {
  if (!tidpunkt?.toDate) return "";
  return tidpunkt.toDate().toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

export default function Kommentarer({ rutinId, farTaBortAlla }) {
  const { currentUser } = useAuth();
  const { kommentarer, skapaKommentar, taBortKommentar } = useKommentarer(rutinId);
  const [oppen, setOppen] = useState(false);
  const [text, setText] = useState("");
  const [skickar, setSkickar] = useState(false);

  async function hanteraSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSkickar(true);
    try {
      await skapaKommentar({
        text: text.trim(),
        skapadAv: currentUser.uid,
        skapadAvNamn: currentUser.email,
      });
      setText("");
    } finally {
      setSkickar(false);
    }
  }

  return (
    <div className="kommentarer">
      <button type="button" className="knapp--lank kommentarer__toggle" onClick={() => setOppen((v) => !v)}>
        💬 {kommentarer.length > 0 ? `${kommentarer.length} kommentar(er)` : "Kommentera / fråga"}
      </button>

      {oppen && (
        <div className="kommentarer__panel">
          {kommentarer.map((k) => (
            <div key={k.id} className="kommentarer__rad">
              <div className="kommentarer__meta">
                <strong>{k.skapadAvNamn}</strong>
                <span>{formateraTid(k.skapad)}</span>
              </div>
              <p>{k.text}</p>
              {(farTaBortAlla || k.skapadAv === currentUser.uid) && (
                <button className="knapp--lank" onClick={() => taBortKommentar(k.id)}>
                  Ta bort
                </button>
              )}
            </div>
          ))}

          <form className="kommentarer__formular" onSubmit={hanteraSubmit}>
            <textarea
              rows={2}
              placeholder="Skriv en kommentar eller fråga..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="knapp knapp--liten" disabled={skickar}>
              Skicka
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
