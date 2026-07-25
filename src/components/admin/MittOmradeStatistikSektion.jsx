import { OMRADE_NAMN } from "./adminHjalp";

export default function MittOmradeStatistikSektion({
  mittOmrade,
  utkastIMittOmrade,
  senasteArtiklarIMittOmrade,
  kvitteradeIMittOmrade,
}) {
  return (
    <section className="admin-sektion">
      <h2>Statistik för mitt område ({OMRADE_NAMN[mittOmrade]})</h2>
      {mittOmrade === "logistik" ? (
        <>
          <p className="sida__beskrivning">{utkastIMittOmrade} artikelutkast väntar på granskning.</p>
          <h3>Senast tillagda artiklar</h3>
          {senasteArtiklarIMittOmrade.length === 0 && (
            <p className="sida__beskrivning">Ingen data ännu.</p>
          )}
          <ol className="admin-statistik-lista">
            {senasteArtiklarIMittOmrade.map((a) => (
              <li key={a.id}>
                {a.namn} <span>({a.forrad})</span>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <>
          <p className="sida__beskrivning">{utkastIMittOmrade} utkast väntar på granskning.</p>
          <h3>Mest kvitterade rutiner</h3>
          {kvitteradeIMittOmrade.length === 0 && (
            <p className="sida__beskrivning">Ingen data ännu.</p>
          )}
          <ol className="admin-statistik-lista">
            {kvitteradeIMittOmrade.map((r) => (
              <li key={r.id}>
                {r.titel} <span>({r.antal} kvitteringar)</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
