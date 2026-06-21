import SektionsKort from "../components/SektionsKort";
import { FORRAD, forradTillSlug } from "../firebase/forrad";

const IKONER = {
  Engångsförrådet: "🧴",
  Sterilförrådet: "🧼",
  Ortopedförrådet: "🦴",
  Tvättförrådet: "🧺",
  Kontorsförrådet: "🖇️",
  Läkemedelsrummet: "💊",
};

export default function Logistik() {
  return (
    <div className="sida">
      <h1>📦 Logistik</h1>
      <p className="sida__beskrivning">
        Välj ett förråd för att se vilka artiklar som finns och var de förvaras.
      </p>
      <div className="hem__kort-grid">
        {FORRAD.map((forrad) => (
          <SektionsKort
            key={forrad}
            titel={forrad}
            beskrivning="Visa artiklar och förvaringsplats"
            ikon={IKONER[forrad] ?? "📦"}
            lank={`/logistik/${forradTillSlug(forrad)}`}
          />
        ))}
      </div>
    </div>
  );
}
