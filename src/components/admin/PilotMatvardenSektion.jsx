export default function PilotMatvardenSektion({
  sokstatistik,
  kvitteringsgrad,
  klinikHjalpsamAndel,
  klinikfeedback,
  feedback,
}) {
  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2>📈 Pilot-mätvärden</h2></summary>
      <p className="sida__beskrivning">
        Sammanställning inför/under en pilot (Etapp 4): vilka Operations/Intelligence-
        funktioner som faktiskt värderas och hur väl information når fram.
      </p>
      <ul className="admin-beroendetest__lista">
        <li>
          <strong>Andel nollträffar:</strong>{" "}
          {sokstatistik && sokstatistik.totaltAntalSokningar > 0
            ? `${Math.round((sokstatistik.antalNollTraffar / sokstatistik.totaltAntalSokningar) * 100)}% av ${sokstatistik.totaltAntalSokningar} sökningar`
            : "Inga sökningar loggade ännu"}
        </li>
        <li>
          <strong>Kvitteringsgrad:</strong>{" "}
          {kvitteringsgrad !== null
            ? `${kvitteringsgrad}% av personalen har i snitt kvitterat läsning av varje godkänd rutin`
            : "Inga godkända rutiner/användare att räkna på ännu"}
        </li>
        <li>
          <strong>Upplevd nytta (klinikstöd):</strong>{" "}
          {klinikHjalpsamAndel !== null
            ? `${klinikHjalpsamAndel}% hjälpsamma svar av ${klinikfeedback.length} bedömda`
            : "Ingen klinikstöd-feedback ännu"}
          . Allmän feedback: {feedback.length} inskick totalt.
        </li>
        <li>
          <strong>Tid-att-hitta:</strong>{" "}
          {sokstatistik?.antalTidmatningar > 0
            ? `${(sokstatistik.totalTidTillKlickMs / sokstatistik.antalTidmatningar / 1000).toFixed(1)} sekunder i snitt (${sokstatistik.antalTidmatningar} mätningar) från påbörjad sökning till klick på ett resultat`
            : "Inga mätningar ännu"}
        </li>
      </ul>
    </details>
  );
}
