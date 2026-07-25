import { formateraTid } from "./adminHjalp";

export default function SokningarUtanTraffarSektion({ sokloggar, sokningarPerDag, maxPerDag }) {
  return (
    <section className="admin-sektion">
      <h2>Sökningar utan träffar</h2>
      {sokloggar.length === 0 && (
        <p className="sida__beskrivning">Inga nolleträffar loggade ännu.</p>
      )}
      {sokningarPerDag.length > 0 && (
        <div className="admin-statistik-trend">
          {sokningarPerDag.map(([dag, antal]) => (
            <div key={dag} className="admin-statistik-trend__rad">
              <span className="admin-statistik-trend__dag">{dag}</span>
              <div className="admin-statistik-trend__bar-bakgrund">
                <div
                  className="admin-statistik-trend__bar"
                  style={{ width: `${(antal / maxPerDag) * 100}%` }}
                />
              </div>
              <span className="admin-statistik-trend__antal">{antal}</span>
            </div>
          ))}
        </div>
      )}
      <ul className="admin-lista admin-lista--vertikal">
        {sokloggar.map((s) => (
          <li key={s.id} className="admin-feedback-rad">
            <div className="admin-feedback-rad__meta">
              <span>"{s.term}"</span>
              <span>{formateraTid(s.tidpunkt)}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
