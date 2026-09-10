import { Link } from "react-router-dom";
import { useFeatures } from "../hooks/useFeatures";
import { useOfflineCenter } from "../hooks/useOfflineCenter";
import { FEATURE } from "../config/features";
import "./OfflineCenter.css";

const INNEHALLSETIKETT = {
  rutiner: "Rutiner",
  kontakter: "Kontakter",
  forradsartiklar: "Förrådsartiklar",
  bilder: "Bilder på rutiner",
};

function formateraTid(iso) {
  if (!iso) return "Har inte laddats ner än";
  return new Date(iso).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

export default function OfflineCenter() {
  const { laddat: featuresLaddade, hasFeature } = useFeatures();
  const { online, status, laddarNer, laddarNerBilder, fel, nedladda, laddaNerBilder } = useOfflineCenter();

  if (featuresLaddade && !hasFeature(FEATURE.OFFLINE_CENTER)) {
    return (
      <div className="sida">
        <Link to="/">← Hem</Link>
        <h1><span aria-hidden="true">📥</span> Offline-center</h1>
        <div className="offline-center__kraver-modul">
          <p>Offline-center kräver Operations-modulen, som inte är aktiverad för din organisation.</p>
          <p>Kontakta en superadmin om ni vill aktivera den.</p>
        </div>
      </div>
    );
  }

  const harLaddatNerNagot = Boolean(status.rutiner?.senast);

  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1><span aria-hidden="true">📥</span> Offline-center</h1>
      <p className="sida__beskrivning">
        Ladda ner godkända rutiner, kontakter och förrådsartiklar så att de går att läsa även
        utan internetanslutning (t.ex. vid nätverksbortfall på avdelningen). Sökning och nya
        uppladdningar kräver fortfarande nät.
      </p>

      <p>
        Nätverksstatus: {online ? "🟢 Online" : "📴 Offline – visar tidigare nedladdad kopia"}
      </p>

      <ul className="offline-center__status">
        {["rutiner", "kontakter", "forradsartiklar"].map((typ) => (
          <li key={typ}>
            <strong>{INNEHALLSETIKETT[typ]}:</strong> {formateraTid(status[typ]?.senast)}
            {status[typ]?.antal != null && ` (${status[typ].antal} st)`}
          </li>
        ))}
      </ul>

      <button className="knapp" onClick={nedladda} disabled={laddarNer || !online}>
        {laddarNer ? "Laddar ner..." : "Ladda ner för offline"}
      </button>
      {!online && (
        <p className="sida__beskrivning">Du måste vara online för att starta en nedladdning.</p>
      )}

      <div className="offline-center__bilder">
        <p>
          <strong>{INNEHALLSETIKETT.bilder}:</strong> {formateraTid(status.bilder?.senast)}
          {status.bilder?.antal != null && ` (${status.bilder.antal} st)`}
        </p>
        <p className="sida__beskrivning">
          Ett separat, valfritt steg – bilder tar betydligt mer plats än text. Ladda ner
          rutinerna ovan först.
        </p>
        <button
          className="knapp knapp--sekundar"
          onClick={laddaNerBilder}
          disabled={laddarNerBilder || !online || !harLaddatNerNagot}
        >
          {laddarNerBilder ? "Laddar ner bilder..." : "Ladda ner bilder också"}
        </button>
      </div>

      {fel && <p className="offline-center__fel">{fel}</p>}
    </div>
  );
}
