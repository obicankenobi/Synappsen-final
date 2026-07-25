import { Link } from "react-router-dom";
import { useFeatures } from "../hooks/useFeatures";
import { useOfflineCenter } from "../hooks/useOfflineCenter";
import { FEATURE } from "../config/features";
import "./OfflineCenter.css";

function formateraTid(datum) {
  return datum.toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

export default function OfflineCenter() {
  const { laddat: featuresLaddade, hasFeature } = useFeatures();
  const { online, senasteNedladdning, antalNedladdade, laddarNer, fel, nedladda } =
    useOfflineCenter();

  if (featuresLaddade && !hasFeature(FEATURE.OFFLINE_CENTER)) {
    return (
      <div className="sida">
        <Link to="/">← Hem</Link>
        <h1>📥 Offline-center</h1>
        <div className="offline-center__kraver-modul">
          <p>Offline-center kräver Operations-modulen, som inte är aktiverad för din organisation.</p>
          <p>Kontakta en superadmin om ni vill aktivera den.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1>📥 Offline-center</h1>
      <p className="sida__beskrivning">
        Ladda ner alla godkända rutiner så att de går att läsa även utan internetanslutning
        (t.ex. vid nätverksbortfall på avdelningen). Sökning och nya uppladdningar kräver
        fortfarande nät. Detta laddar bara ner texten i rutinerna, inga bilder/bilagor.
      </p>

      <p>
        Nätverksstatus: {online ? "🟢 Online" : "📴 Offline – visar tidigare nedladdad kopia"}
      </p>
      <p>
        Senaste nedladdning:{" "}
        {senasteNedladdning ? formateraTid(senasteNedladdning) : "Har inte laddats ner än"}
        {antalNedladdade !== null && ` (${antalNedladdade} rutiner)`}
      </p>

      <button className="knapp" onClick={nedladda} disabled={laddarNer || !online}>
        {laddarNer ? "Laddar ner..." : "Ladda ner för offline"}
      </button>
      {!online && (
        <p className="sida__beskrivning">Du måste vara online för att starta en nedladdning.</p>
      )}
      {fel && <p className="offline-center__fel">{fel}</p>}
    </div>
  );
}
