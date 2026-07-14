import { useState } from "react";
import { fragaKlinisktStod } from "../firebase/functions";
import { kontrolleraPatientuppgifter } from "../utils/piiFilter";
import "./KlinikfragaSok.css";

// Pausad tills vidare (2026-07-14): tre raka tester visade att Gemini inte pålitligt går
// att styra till enbart de fem godkända källorna via prompt-instruktion (den söker brett på
// webben trots explicita "site:"-instruktioner och en skarpare andra-försök-prompt).
// Efterhandsspärren mot godkända domäner fungerade korrekt varje gång, men det gör
// funktionen i praktiken oanvändbar – nästan alla svar blockeras. Sätt till false för att
// återaktivera när sökningen byggts om att själv styra källorna (t.ex. via Google Custom
// Search API riktad mot de fem domänerna) istället för att förlita sig på att Gemini följer
// instruktionen. Se UTVECKLINGSLOGG.md, Fas 9.4/9.5.
const PAUSAD = true;

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

  if (PAUSAD) {
    return (
      <section className="klinikfraga">
        <h2>🔍 Klinikstöd-sökning</h2>
        <p className="klinikfraga__hjalptext">
          <strong>Tillfälligt pausad.</strong> Vi kunde inte få den att pålitligt hålla sig till
          enbart godkända medicinska källor, så den är avstängd tills det är löst – för att inte
          riskera att visa information från ej godkända källor. Hör av dig till superadmin om du
          vill veta mer.
        </p>
      </section>
    );
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
