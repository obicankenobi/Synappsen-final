import { APP_VERSION } from "../../version";
import { formateraTid, STATUS_IKON, STATUS_TEXT } from "./adminHjalp";

export default function SystemstatusSektion({
  anvandare,
  antalRutiner,
  forradsartiklar,
  budget,
  utloggningMinuter,
  hanteraTestaBeroenden,
  testarBeroenden,
  beroendeStatus,
  halsokontrollhistorik,
}) {
  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2><span aria-hidden="true">📊</span> Systemstatus</h2></summary>
      <div className="admin-statistik-grid">
        <p className="sida__beskrivning">
          Version <strong>{APP_VERSION}</strong>
        </p>
        <p className="sida__beskrivning">
          {anvandare.length} användare, {antalRutiner} rutiner, {forradsartiklar.length} förrådsartiklar
        </p>
        {budget && (
          <p className="sida__beskrivning">
            Gemini-budget: {(budget.anvantOre / 100).toFixed(0)} kr / {(budget.taketOre / 100).toFixed(0)} kr
            denna månad
          </p>
        )}
        <p className="sida__beskrivning">Auto-utloggning: {utloggningMinuter} min inaktivitet</p>
      </div>

      <div className="admin-beroendetest">
        <p className="sida__beskrivning">
          Kontrollerar att apps stödtjänster faktiskt fungerar just nu – bra att köra om
          något känns trögt eller om en användare rapporterar ett fel med AI-funktionerna.
        </p>
        <button
          className="knapp knapp--sekundar knapp--liten"
          onClick={hanteraTestaBeroenden}
          disabled={testarBeroenden}
        >
          {testarBeroenden ? "Testar..." : "🔌 Testa anslutningar"}
        </button>
        {beroendeStatus?.fel && <p className="klinikfraga__fel">{beroendeStatus.fel}</p>}
        {beroendeStatus && !beroendeStatus.fel && (
          <ul className="admin-beroendetest__lista">
            {[
              ["Bildtolkning/klinikstöd-svar (Gemini)", beroendeStatus.gemini],
              ["Klinikstöd-sökningen hittar källor", beroendeStatus.sokmotor],
              ["Bilduppladdning (lagring)", beroendeStatus.storage],
              ["Klinikstöd håller sig till godkända källor", beroendeStatus.klinikstod],
            ].map(([namn, status]) => (
              <li key={namn}>
                <span className={`admin-beroendetest__punkt--${status.status}`}>
                  {STATUS_IKON[status.status]}
                </span>{" "}
                {namn} – {STATUS_TEXT[status.status]}
                {status.meddelande && <span> ({status.meddelande})</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {halsokontrollhistorik.length > 0 && (
        <div className="admin-beroendetest">
          <p className="sida__beskrivning">
            Sparad historik – bygger med varje "Testa anslutningar" och den dagliga
            klinikstöd-kontrollen, så trender syns över tid.
          </p>
          <ul className="admin-beroendetest__lista">
            {halsokontrollhistorik.map((h) => (
              <li key={h.id}>
                {formateraTid(h.tidpunkt)}:{" "}
                {[
                  h.gemini && `Gemini ${STATUS_IKON[h.gemini.status]}`,
                  h.sokmotor && `Sökmotor ${STATUS_IKON[h.sokmotor.status]}`,
                  h.storage && `Lagring ${STATUS_IKON[h.storage.status]}`,
                  h.klinikstod && `Klinikstöd ${STATUS_IKON[h.klinikstod.status]}`,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </details>
  );
}
