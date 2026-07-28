import SektionsKort from "../components/SektionsKort";
import { FORRAD, forradTillSlug } from "../firebase/forrad";
import { useAuth } from "../hooks/useAuth";
import { useBristanmalningar, BRIST_STATUS } from "../hooks/useBristanmalningar";
import { useForradsartiklar } from "../hooks/useForradsartiklar";
import { gerUtInom30Dagar } from "../utils/forradHjalp";
import { KAN_HANTERA_FORRAD } from "../firebase/roles";
import "./Admin.css";
import "./Logistik.css";

const IKONER = {
  Engångsförrådet: "🧴",
  Sterilförrådet: "🧼",
  Ortopedförrådet: "🦴",
  Tvättförrådet: "🧺",
  Kontorsförrådet: "🖇️",
  Läkemedelsrummet: "💊",
};

export default function Logistik() {
  const { currentUser, role } = useAuth();
  const farHantera = KAN_HANTERA_FORRAD.includes(role);
  const { bristanmalningar, hanteraBristanmalning, avvisaBristanmalning } = useBristanmalningar();
  // Etapp 20c: hela organisationens artiklar (utan forrad-filter), bara för att räkna fram
  // vilka som går ut snart – kortet i sig visas fortfarande på respektive förråds egen sida.
  const { artiklar: allaArtiklar } = useForradsartiklar();

  // Etapp 20b: flest anmälningar överst – tre personer som anmäler samma artikel är en
  // starkare signal om verklig brist än en enskild anmälan.
  const oppna = bristanmalningar
    .filter((b) => b.status === BRIST_STATUS.NY)
    .sort((a, b) => (b.antalAnmalningar ?? 1) - (a.antalAnmalningar ?? 1));

  const utgaende = farHantera
    ? allaArtiklar.filter(gerUtInom30Dagar).sort((a, b) => a.utgangsdatum.localeCompare(b.utgangsdatum))
    : [];

  return (
    <div className="sida">
      <h1>📦 Logistik</h1>
      <p className="sida__beskrivning">
        Välj ett förråd för att se vilka artiklar som finns och var de förvaras.
      </p>

      {farHantera && oppna.length > 0 && (
        <section className="admin-sektion">
          <h2>⚠️ Öppna bristanmälningar ({oppna.length})</h2>
          <ul className="admin-lista">
            {oppna.map((b) => (
              <li key={b.id} className="admin-lista__rad">
                <div>
                  <strong>{b.artikelNamn}</strong> – {b.forrad}
                  {(b.antalAnmalningar ?? 1) > 1 && (
                    <span className="logistik__antal-badge"> {b.antalAnmalningar} anmälningar</span>
                  )}
                  {b.kommentar && <div className="admin-lista__email">"{b.kommentar}"</div>}
                </div>
                <div className="forrad-artikel-kort__atgarder">
                  <button
                    className="knapp knapp--liten"
                    onClick={() => hanteraBristanmalning(b.id, currentUser.uid, currentUser.email)}
                  >
                    Markera hanterad
                  </button>
                  <button
                    className="knapp knapp--liten knapp--sekundar"
                    onClick={() => avvisaBristanmalning(b.id, currentUser.uid, currentUser.email)}
                  >
                    Avvisa
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {farHantera && utgaende.length > 0 && (
        <section className="admin-sektion">
          <h2>⏳ Går ut inom 30 dagar ({utgaende.length})</h2>
          <ul className="admin-lista">
            {utgaende.map((a) => (
              <li key={a.id} className="admin-lista__rad">
                <strong>{a.namn}</strong> – {a.forrad}
                <div className="admin-lista__email">Utgår {a.utgangsdatum}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

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
