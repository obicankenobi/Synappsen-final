import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useRutiner, RUTIN_STATUS } from "../hooks/useRutiner";
import { useForradsartiklar, ARTIKEL_STATUS } from "../hooks/useForradsartiklar";
import { useAnvandare } from "../hooks/useAnvandare";
import { useKlinikfrageStatistik } from "../hooks/useKlinikfrageStatistik";
import { useSokstatistik } from "../hooks/useSokstatistik";
import { borGranskas } from "../utils/rutinHjalp";
import "./Admin.css";
import "./Ledningsrapport.css";

function kvitteringsgradForOmrade(rutiner, antalAnvandare) {
  const godkanda = rutiner.filter((r) => r.status === RUTIN_STATUS.GODKAND);
  if (godkanda.length === 0 || antalAnvandare === 0) return null;
  const summaAndelar = godkanda.reduce((sum, r) => sum + (r.lasteAv ?? []).length / antalAnvandare, 0);
  return Math.round((summaAndelar / godkanda.length) * 100);
}

function borGranskasLista(rutiner) {
  return rutiner
    .filter((r) => r.status === RUTIN_STATUS.GODKAND && borGranskas(r.granskadDatum))
    .map((r) => ({ id: r.id, titel: r.titel, granskadDatum: r.granskadDatum }));
}

// Etapp 10c: en enda utskriftsvänlig sida avsedd för verksamhetschefer, inte redaktörer –
// medan adminpanelen visar operativa detaljer (feedback, ändringslogg, budget...) samlar den
// här sidan bara de siffror en chef faktiskt vill kunna visa uppåt: läser personalen det som
// publiceras, och hittar de vad de söker efter. "Exportera som PDF" är webbläsarens egen
// utskriftsfunktion (Ctrl+P → Spara som PDF) med en egen utskriftsstil – inget nytt PDF-
// bibliotek behövdes för det.
export default function Ledningsrapport() {
  const { anvandare } = useAnvandare();
  const { rutiner: klinisktRutiner } = useRutiner("kliniskt-stod");
  const { rutiner: adminRutiner } = useRutiner("administration");
  const { artiklar: forradsartiklar } = useForradsartiklar();
  const { feedback: klinikfeedback, fragor: klinikfragor } = useKlinikfrageStatistik(true);
  const { statistik: sokstatistik } = useSokstatistik(true);

  const antalAnvandare = anvandare.length;

  const omraden = useMemo(
    () => [
      {
        namn: "Kliniskt stöd",
        antalRutiner: klinisktRutiner.length,
        kvitteringsgrad: kvitteringsgradForOmrade(klinisktRutiner, antalAnvandare),
        borGranskas: borGranskasLista(klinisktRutiner),
      },
      {
        namn: "Administration",
        antalRutiner: adminRutiner.length,
        kvitteringsgrad: kvitteringsgradForOmrade(adminRutiner, antalAnvandare),
        borGranskas: borGranskasLista(adminRutiner),
      },
    ],
    [klinisktRutiner, adminRutiner, antalAnvandare]
  );

  const logistikUtkast = forradsartiklar.filter((a) => a.status === ARTIKEL_STATUS.UTKAST).length;
  const logistikGodkanda = forradsartiklar.filter((a) => a.status === ARTIKEL_STATUS.GODKAND).length;

  const klinikHjalpsamAndel =
    klinikfeedback.length > 0
      ? Math.round((klinikfeedback.filter((f) => f.hjalpsam).length / klinikfeedback.length) * 100)
      : null;

  const klinikVanligaFragor = useMemo(() => {
    const antalPerFraga = new Map();
    klinikfragor.forEach((f) => antalPerFraga.set(f.fraga, (antalPerFraga.get(f.fraga) ?? 0) + 1));
    return [...antalPerFraga.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([fraga, antal]) => ({ fraga, antal }));
  }, [klinikfragor]);

  const nollTraffarAndel =
    sokstatistik && sokstatistik.totaltAntalSokningar > 0
      ? Math.round((sokstatistik.antalNollTraffar / sokstatistik.totaltAntalSokningar) * 100)
      : null;

  const genereradDatum = new Date().toLocaleDateString("sv-SE", { dateStyle: "long" });

  return (
    <div className="sida ledningsrapport">
      <div className="ledningsrapport__verktygsrad">
        <Link to="/">← Hem</Link>
        <button type="button" className="knapp" onClick={() => window.print()}>
          🖨️ Exportera som PDF
        </button>
      </div>

      <h1>Ledningsrapport</h1>
      <p className="sida__beskrivning">Genererad {genereradDatum} · {antalAnvandare} anställda i systemet.</p>

      <section className="admin-sektion">
        <h2>Kvitteringsgrad per område</h2>
        <p className="sida__beskrivning">
          Genomsnittlig andel av personalen som kvitterat läsning av varje godkänd rutin i
          området – ett mått på hur väl information faktiskt når fram, inte bara publiceras.
        </p>
        <table className="ledningsrapport__tabell">
          <thead>
            <tr>
              <th>Område</th>
              <th>Antal rutiner</th>
              <th>Kvitteringsgrad</th>
            </tr>
          </thead>
          <tbody>
            {omraden.map((o) => (
              <tr key={o.namn}>
                <td>{o.namn}</td>
                <td>{o.antalRutiner}</td>
                <td>{o.kvitteringsgrad !== null ? `${o.kvitteringsgrad}%` : "Ingen data ännu"}</td>
              </tr>
            ))}
            <tr>
              <td>Logistik</td>
              <td>{logistikGodkanda} godkända, {logistikUtkast} väntar på granskning</td>
              <td>Kvittering spåras inte per förrådsartikel</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="admin-sektion">
        <h2>Rutiner som bör granskas</h2>
        <p className="sida__beskrivning">
          Godkända rutiner vars granskningsfrist (180 dagar sedan senaste granskning) har
          passerat – en indikation på var innehållet riskerar att bli inaktuellt.
        </p>
        {omraden.every((o) => o.borGranskas.length === 0) ? (
          <p className="sida__beskrivning">Inga rutiner behöver granskas just nu.</p>
        ) : (
          omraden.map(
            (o) =>
              o.borGranskas.length > 0 && (
                <div key={o.namn}>
                  <h3>{o.namn} ({o.borGranskas.length})</h3>
                  <ul className="admin-statistik-lista">
                    {o.borGranskas.map((r) => (
                      <li key={r.id}>{r.titel}</li>
                    ))}
                  </ul>
                </div>
              )
          )
        )}
      </section>

      <section className="admin-sektion">
        <h2>Klinikstöd-sökningen</h2>
        <ul className="admin-beroendetest__lista">
          <li>
            <strong>Upplevd nytta:</strong>{" "}
            {klinikHjalpsamAndel !== null
              ? `${klinikHjalpsamAndel}% hjälpsamma svar av ${klinikfeedback.length} bedömda`
              : "Ingen feedback ännu"}
          </li>
        </ul>
        {klinikVanligaFragor.length > 0 && (
          <>
            <h3>Vanligaste frågorna (kunskapsluckor)</h3>
            <ul className="admin-statistik-lista">
              {klinikVanligaFragor.map((f) => (
                <li key={f.fraga}>
                  "{f.fraga}" <span>({f.antal} gånger)</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="admin-sektion">
        <h2>Sökträffar</h2>
        <p className="sida__beskrivning">
          <strong>Andel nollträffar:</strong>{" "}
          {nollTraffarAndel !== null
            ? `${nollTraffarAndel}% av ${sokstatistik.totaltAntalSokningar} sökningar gav ingen träff`
            : "Inga sökningar loggade ännu"}
          . En hög andel kan betyda att innehåll saknas eller att sökorden inte matchar det
          som faktiskt finns.
        </p>
      </section>
    </div>
  );
}
