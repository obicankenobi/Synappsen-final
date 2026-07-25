export default function StatistikAllaOmradenSektion({ mestAktiva, mestKvitterade }) {
  return (
    <section className="admin-sektion">
      <h2>Statistik (alla områden)</h2>
      <div className="admin-statistik-grid">
        <div>
          <h3>Mest aktiva användare</h3>
          {mestAktiva.length === 0 && <p className="sida__beskrivning">Ingen data ännu.</p>}
          <ol className="admin-statistik-lista">
            {mestAktiva.map((u) => (
              <li key={u.uid}>
                {u.namn} <span>({u.antal} händelser)</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3>Mest kvitterade rutiner</h3>
          {mestKvitterade.length === 0 && <p className="sida__beskrivning">Ingen data ännu.</p>}
          <ol className="admin-statistik-lista">
            {mestKvitterade.map((r) => (
              <li key={r.id}>
                {r.titel} <span>({r.antal} kvitteringar)</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
