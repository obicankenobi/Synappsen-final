import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { usePrivatAnteckning } from "../hooks/usePrivatAnteckning";
import "./PrivatAnteckning.css";

export default function PrivatAnteckning({ rutinId }) {
  const { currentUser } = useAuth();
  const { text, laddad, spara } = usePrivatAnteckning(currentUser?.uid, rutinId);
  const [oppen, setOppen] = useState(false);
  const [utkast, setUtkast] = useState("");
  const [sparad, setSparad] = useState(false);

  // Utkastet sätts först när panelen faktiskt öppnas (ett användarinitierat event),
  // inte via en effekt som speglar props – då texten redan hunnit laddas klart.
  function hanteraOppna() {
    if (!oppen) setUtkast(text);
    setOppen((v) => !v);
  }

  async function hanteraSpara() {
    await spara(utkast);
    setSparad(true);
    setTimeout(() => setSparad(false), 1500);
  }

  if (!laddad) return null;

  return (
    <div className="privat-anteckning">
      <button type="button" className="knapp--lank" onClick={hanteraOppna}>
        📝 {text ? "Min anteckning" : "Lägg till privat anteckning"}
      </button>
      {oppen && (
        <div className="privat-anteckning__panel">
          <p className="privat-anteckning__hjalptext">Bara du kan se det du skriver här.</p>
          <textarea rows={2} value={utkast} onChange={(e) => setUtkast(e.target.value)} />
          <button className="knapp knapp--liten" onClick={hanteraSpara}>
            {sparad ? "✓ Sparat" : "Spara"}
          </button>
        </div>
      )}
    </div>
  );
}
