import { beraknaEkonomiOversikt } from "../../utils/leverantorEkonomi";
import "./EkonomiOversiktSektion.css";

const TREND_IKON = { up: "📈", down: "📉", stable: "➡️" };

// Etapp L1i (intern/ETAPPLAN-INTERN-1.md): ARR-summering, marginal per kund, kostnadstrend,
// och kunder utan satt årsavgift. Allt beräknas i src/utils/leverantorEkonomi.js (ren
// funktion, egna tester) – ingen ny datakälla, bara en sammanställning av det
// listaOrganisationer redan returnerar.
export default function EkonomiOversiktSektion({ organisationer }) {
  const oversikt = beraknaEkonomiOversikt(organisationer);

  return (
    <section className="admin-sektion">
      <h2>💰 Ekonomisk överblick</h2>
      <p className="sida__beskrivning">
        Underlag, inte ett ekonomisystem – ingen fakturering eller bokföringsintegration.
      </p>

      <div className="ekonomi-oversikt__nyckeltal">
        <div className="ekonomi-oversikt__ruta">
          <span className="ekonomi-oversikt__varde">{oversikt.arrSummaKr.toLocaleString("sv-SE")} kr</span>
          <span className="ekonomi-oversikt__etikett">Summerad ARR ({oversikt.antalMedPris} kunder)</span>
        </div>
        <div className="ekonomi-oversikt__ruta">
          <span className="ekonomi-oversikt__varde">{Math.round(oversikt.snittArrKr).toLocaleString("sv-SE")} kr</span>
          <span className="ekonomi-oversikt__etikett">Snitt per kund</span>
        </div>
        <div className="ekonomi-oversikt__ruta">
          <span className="ekonomi-oversikt__varde">{oversikt.antalUtanPris}</span>
          <span className="ekonomi-oversikt__etikett">Kunder utan satt årsavgift</span>
        </div>
        <div className="ekonomi-oversikt__ruta">
          <span className="ekonomi-oversikt__varde">{oversikt.negativMarginal.length}</span>
          <span className="ekonomi-oversikt__etikett">Med negativ marginal</span>
        </div>
      </div>

      {oversikt.orgUtanPris.length > 0 && (
        <p className="leverantor__varning">
          Utan satt årsavgift: {oversikt.orgUtanPris.map((o) => o.orgNamn).join(", ")}.
        </p>
      )}

      {oversikt.perKund.length === 0 ? (
        <p className="sida__beskrivning">Inga organisationer ännu.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="ekonomi-oversikt__tabell">
            <thead>
              <tr>
                <th>Kund</th>
                <th>Årsavgift</th>
                <th>Senaste AI-kostnad</th>
                <th>Marginal/mån</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {oversikt.perKund.map((k) => (
                <tr key={k.orgId}>
                  <td>
                    <a href={`#org-${k.orgId}`}>{k.orgNamn}</a>
                  </td>
                  <td>{k.arsavgiftKr !== null ? `${k.arsavgiftKr.toLocaleString("sv-SE")} kr/år` : "–"}</td>
                  <td>{k.senasteKostnadKr.toLocaleString("sv-SE")} kr</td>
                  <td className={k.marginalKr !== null && k.marginalKr < 0 ? "ekonomi-oversikt__negativ" : ""}>
                    {k.marginalKr !== null ? `${Math.round(k.marginalKr).toLocaleString("sv-SE")} kr` : "–"}
                  </td>
                  <td>{k.trend ? TREND_IKON[k.trend] : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
