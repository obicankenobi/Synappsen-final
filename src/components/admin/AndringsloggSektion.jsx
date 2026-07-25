import { formateraTid } from "./adminHjalp";

export default function AndringsloggSektion({
  auditlogg,
  auditSok,
  setAuditSok,
  auditTypFilter,
  setAuditTypFilter,
  auditTyper,
  filtreradAuditlogg,
}) {
  return (
    <section className="admin-sektion">
      <h2>Ändringslogg</h2>
      {auditlogg.length === 0 && <p className="sida__beskrivning">Inga händelser loggade ännu.</p>}
      {auditlogg.length > 0 && (
        <div className="admin-audit-filter">
          <input
            type="search"
            placeholder="Sök i beskrivning..."
            value={auditSok}
            onChange={(e) => setAuditSok(e.target.value)}
          />
          <select value={auditTypFilter} onChange={(e) => setAuditTypFilter(e.target.value)}>
            <option value="">Alla typer</option>
            {auditTyper.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}
      <ul className="admin-lista admin-lista--vertikal">
        {filtreradAuditlogg.map((a) => (
          <li key={a.id} className="admin-feedback-rad">
            <div className="admin-feedback-rad__meta">
              <span>{a.beskrivning}</span>
              <span>{formateraTid(a.tidpunkt)}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
