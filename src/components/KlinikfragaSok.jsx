import { useState } from "react";
import { fragaKlinisktStod } from "../firebase/functions";
import { kontrolleraPatientuppgifter } from "../utils/piiFilter";
import { skickaKlinikfrageFeedback } from "../hooks/useKlinikfrageFeedback";
import { useAuth } from "../hooks/useAuth";
import { useFeatures } from "../hooks/useFeatures";
import { FEATURE } from "../config/features";
import "./KlinikfragaSok.css";

// Återaktiverad (2026-07-14, Fas 13): byggdes om att söka via en riktig domänbegränsad
// Programmable Search Engine istället för att förlita sig på att Gemini respekterar en
// "site:"-prompt-instruktion (vilket den inte gjorde tillförlitligt, se Fas 9.4/9.5).
// Källbegränsningen sitter nu i själva sökmotorns konfiguration, inte i en instruktion till
// AI:n. Sätt till true igen om nya problem upptäcks efter driftsättning.
const PAUSAD = false;

export default function KlinikfragaSok() {
  const { currentUser, organisationId } = useAuth();
  const { laddat: featuresLaddade, hasFeature } = useFeatures();
  const [fraga, setFraga] = useState("");
  const [stalldFraga, setStalldFraga] = useState("");
  const [laddar, setLaddar] = useState(false);
  const [svar, setSvar] = useState(null);
  const [fel, setFel] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState(null);

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
    setFeedbackGiven(null);
    try {
      const { data } = await fragaKlinisktStod(fraga.trim());
      setSvar(data);
      setStalldFraga(fraga.trim());
    } catch (e2) {
      setFel(e2.message ?? "Något gick fel. Försök igen.");
    } finally {
      setLaddar(false);
    }
  }

  async function hanteraFeedback(hjalpsam) {
    setFeedbackGiven(hjalpsam);
    try {
      await skickaKlinikfrageFeedback(stalldFraga, hjalpsam, currentUser?.uid, organisationId);
    } catch {
      // Feedback är valfri statistik – misslyckad skrivning ska inte visa fel för användaren.
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

  if (featuresLaddade && !hasFeature(FEATURE.CLINICAL_SUPPORT)) {
    return (
      <section className="klinikfraga">
        <h2>🔍 Klinikstöd-sökning</h2>
        <p className="klinikfraga__hjalptext">
          Klinikstöd-sökning kräver Intelligence-modulen, som inte är aktiverad för din
          organisation. Kontakta en superadmin om ni vill aktivera den.
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
              {/* `?? []` – ett svar utan kallor (t.ex. ett äldre cachat dokument från innan
                  fältet fanns, se functions/klinikstod.js:304) kraschade annars hela vyn på
                  `undefined.map` istället för att bara visa svaret utan källista. */}
              {(svar.kallor ?? []).map((k, i) => (
                <li key={i}>
                  <a href={k.url} target="_blank" rel="noreferrer">
                    {k.titel}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="klinikfraga__feedback">
            {feedbackGiven === null ? (
              <>
                <span>Var detta hjälpsamt?</span>
                <button type="button" className="knapp--lank" onClick={() => hanteraFeedback(true)}>
                  👍 Ja
                </button>
                <button type="button" className="knapp--lank" onClick={() => hanteraFeedback(false)}>
                  👎 Nej
                </button>
              </>
            ) : (
              <span>Tack för din feedback!</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
