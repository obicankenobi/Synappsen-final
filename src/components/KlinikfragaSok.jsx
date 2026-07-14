import { useState } from "react";
import { fragaKlinisktStod } from "../firebase/functions";
import { kontrolleraPatientuppgifter } from "../utils/piiFilter";
import "./KlinikfragaSok.css";

export default function KlinikfragaSok() {
  const [fraga, setFraga] = useState("");
  const [laddar, setLaddar] = useState(false);
  const [svar, setSvar] = useState(null);
  const [fel, setFel] = useState(null);

  async function hanteraSubmit(e) {
    e.preventDefault();
    if (!fraga.trim()) return;
    const kontroll = kontrolleraPatientuppgifter(fraga);
    if (kontroll.blockerad) {
      if (kontroll.meddelande) setFel(kontroll.meddelande);
      return;
    }
    setLaddar(true);
    setSvar(null);
    setFel(null);
    try {
      const { data } = await fragaKlinisktStod(fraga.trim());
      setSvar(data);
    } catch (e2) {
      setFel(e2.message ?? "Något gick fel. Försök igen.");
    } finally {
      setLaddar(false);
    }
  }

  return (
    <section className="klinikfraga">
      <h2>🔍 Klinikstöd-sökning</h2>
      <p className="klinikfraga__hjalptext">
        Ställ en generell fråga om sjukdomstillstånd, läkemedel eller behandling. Gemini söker
        upp aktuell information live och svarar bara utifrån internetmedicin.se, 1177.se,
        Nationella kliniska kunskapsstödet, FASS vårdpersonal och Läkemedelsverket, med
        källhänvisning. <strong>Beslutsstöd – ersätter aldrig klinisk bedömning.</strong> Ställ
        aldrig frågor om en specifik patient.
      </p>

      <form className="klinikfraga__formular" onSubmit={hanteraSubmit}>
        <input
          type="text"
          placeholder="T.ex. Dosering amoxicillin vuxen"
          value={fraga}
          onChange={(e) => setFraga(e.target.value)}
          maxLength={500}
        />
        <button type="submit" className="knapp" disabled={laddar}>
          {laddar ? "Söker..." : "Fråga"}
        </button>
      </form>

      {fel && <p className="klinikfraga__fel">{fel}</p>}

      {svar && (
        <div className="klinikfraga__svar">
          <p>{svar.svar}</p>
          <div className="klinikfraga__kallor">
            <strong>Källor:</strong>
            <ul>
              {svar.kallor.map((k, i) => (
                <li key={i}>
                  <a href={k.url} target="_blank" rel="noreferrer">
                    {k.titel}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
