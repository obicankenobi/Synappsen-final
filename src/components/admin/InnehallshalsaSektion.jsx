import { useRutiner } from "../../hooks/useRutiner";
import { sammanstallHalsa } from "../../utils/innehallshalsa";
import { OMRADE_NAMN } from "./adminHjalp";
import "./InnehallshalsaSektion.css";

const FLAGGA_TEXT = {
  passeratGranskningsdatum: "Bör granskas (över 180 dagar)",
  saknarAgare: "Saknar ägare",
  aldrigKvitterad: "Ingen har kvitterat",
  obesvaradKallvarning: "Obesvarad källvarning",
  utgangen: "Utgångsdatum har passerat",
};

function Nedbrytning({ nedbrytning, total }) {
  return (
    <ul className="innehallshalsa__nedbrytning">
      {Object.entries(nedbrytning).map(([flagga, antal]) => (
        <li key={flagga}>
          <span>{FLAGGA_TEXT[flagga]}</span>
          <span>
            {antal} av {total}
          </span>
        </li>
      ))}
    </ul>
  );
}

// Etapp 37a: innehållshälsopanelen. Sammanställer redan befintlig data (granskadDatum, agare,
// lasteAv, kallVarning, utgångsdatum) – ingen ny insamling. Hälsosiffran visas ALDRIG utan sin
// nedbrytning i samma vy (se ETAPPLAN6.md Etapp 37a) – annars blir den ett mål i sig i stället
// för ett diagnosverktyg.
export default function InnehallshalsaSektion({ endastOmrade }) {
  const { rutiner: klinisktRutiner } = useRutiner("kliniskt-stod");
  const { rutiner: logistikRutiner } = useRutiner("logistik");
  const { rutiner: adminRutiner } = useRutiner("administration");
  const allaRutiner = endastOmrade
    ? { "kliniskt-stod": klinisktRutiner, logistik: logistikRutiner, administration: adminRutiner }[
        endastOmrade
      ] ?? []
    : [...klinisktRutiner, ...logistikRutiner, ...adminRutiner];

  const { total, halsosiffra, nedbrytning, poster } = sammanstallHalsa(allaRutiner);
  const sjukaPoster = poster.filter((p) => p.antalFlaggor > 0).slice(0, 20);

  return (
    <section className="admin-sektion">
      <h2>🩺 Innehållshälsa{endastOmrade ? ` – ${OMRADE_NAMN[endastOmrade]}` : ""}</h2>
      <p className="sida__beskrivning">
        Hur aktuella de godkända rutinerna är – sammanställt av data som redan finns, ingen ny
        insamling.
      </p>
      {total === 0 ? (
        <p className="sida__beskrivning">Inga godkända rutiner ännu.</p>
      ) : (
        <>
          <p className="innehallshalsa__siffra">
            <strong>{halsosiffra}%</strong> av {total} godkända rutiner har ingen flagga
          </p>
          <Nedbrytning nedbrytning={nedbrytning} total={total} />
          {sjukaPoster.length > 0 && (
            <>
              <h3>Rutiner som behöver uppmärksamhet</h3>
              <div className="innehallshalsa__tabell-wrapper">
                <table className="innehallshalsa__tabell">
                  <thead>
                    <tr>
                      <th>Rutin</th>
                      <th>Område</th>
                      <th>Ålder (dagar)</th>
                      <th>Flaggor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sjukaPoster.map((p) => (
                      <tr key={p.id}>
                        <td>{p.titel}</td>
                        <td>{OMRADE_NAMN[p.omrade] ?? p.omrade}</td>
                        <td>{p.aldrDagar ?? "-"}</td>
                        <td>
                          {Object.entries(p.flaggor)
                            .filter(([, sant]) => sant)
                            .map(([flagga]) => FLAGGA_TEXT[flagga])
                            .join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {poster.length > sjukaPoster.length && (
                <p className="sida__beskrivning">
                  Visar de {sjukaPoster.length} mest flaggade av {poster.filter((p) => p.antalFlaggor > 0).length} rutiner med minst en flagga.
                </p>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
