import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useKommentarer } from "../hooks/useKommentarer";
import { kontrolleraPatientuppgifter } from "../utils/piiFilter";
import "./Kommentarer.css";

function formateraTid(tidpunkt) {
  if (!tidpunkt?.toDate) return "";
  return tidpunkt.toDate().toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

function KommentarRad({ kommentar, svar, currentUser, farTaBortAlla, taBortKommentar, onSvara, djup }) {
  return (
    <div className="kommentarer__rad" style={{ marginLeft: djup * 20 }}>
      <div className="kommentarer__meta">
        <strong>{kommentar.skapadAvNamn}</strong>
        <span>{formateraTid(kommentar.skapad)}</span>
      </div>
      <p>{kommentar.text}</p>
      <div className="kommentarer__rad-atgarder">
        <button type="button" className="knapp--lank" onClick={() => onSvara(kommentar.id)}>
          Svara
        </button>
        {(farTaBortAlla || kommentar.skapadAv === currentUser.uid) && (
          <button className="knapp--lank" onClick={() => taBortKommentar(kommentar.id)}>
            Ta bort
          </button>
        )}
      </div>
      {svar.map((s) => (
        <KommentarRad
          key={s.id}
          kommentar={s}
          svar={[]}
          currentUser={currentUser}
          farTaBortAlla={farTaBortAlla}
          taBortKommentar={taBortKommentar}
          onSvara={onSvara}
          djup={djup + 1}
        />
      ))}
    </div>
  );
}

export default function Kommentarer({ rutinId, farTaBortAlla }) {
  const { currentUser } = useAuth();
  const { kommentarer, skapaKommentar, taBortKommentar } = useKommentarer(rutinId);
  const [oppen, setOppen] = useState(false);
  const [text, setText] = useState("");
  const [svararPa, setSvararPa] = useState(null);
  const [skickar, setSkickar] = useState(false);

  const toppniva = kommentarer.filter((k) => !k.svarPa);
  const svarTill = (id) => kommentarer.filter((k) => k.svarPa === id);

  async function hanteraSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const kontroll = kontrolleraPatientuppgifter(text);
    if (kontroll.blockerad) {
      if (kontroll.meddelande) alert(kontroll.meddelande);
      return;
    }
    setSkickar(true);
    try {
      await skapaKommentar({
        text: text.trim(),
        skapadAv: currentUser.uid,
        skapadAvNamn: currentUser.email,
        svarPa: svararPa,
      });
      setText("");
      setSvararPa(null);
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
          {toppniva.map((k) => (
            <KommentarRad
              key={k.id}
              kommentar={k}
              svar={svarTill(k.id)}
              currentUser={currentUser}
              farTaBortAlla={farTaBortAlla}
              taBortKommentar={taBortKommentar}
              onSvara={setSvararPa}
              djup={0}
            />
          ))}

          <form className="kommentarer__formular" onSubmit={hanteraSubmit}>
            {svararPa && (
              <p className="kommentarer__svarar-pa">
                Svarar på en kommentar.{" "}
                <button type="button" className="knapp--lank" onClick={() => setSvararPa(null)}>
                  Avbryt
                </button>
              </p>
            )}
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
