export default function VerifieraKlinikstodSektion({
  hanteraVerifieraKlinikstod,
  verifierarKlinikstod,
  klinikstodStatus,
}) {
  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2><span aria-hidden="true">🔍</span> Verifiera klinikstöd-sökningen</h2></summary>
      <p className="sida__beskrivning">
        Kör tre fasta testfrågor genom sökmotorn (förbi cachen) och kontrollerar att ALLA
        källor den hittar ligger inom de godkända domänerna. Kör detta om ni misstänker att
        sökningen visar fel källor, eller efter att ha ändrat sökmotorns konfiguration i
        Google-kontot – det är den delen som kan drifta utan att synas i koden.
      </p>
      <button
        className="knapp knapp--sekundar knapp--liten"
        onClick={hanteraVerifieraKlinikstod}
        disabled={verifierarKlinikstod}
      >
        {verifierarKlinikstod ? "Verifierar..." : "Kör testfrågor"}
      </button>
      {klinikstodStatus?.fel && <p className="klinikfraga__fel">{klinikstodStatus.fel}</p>}
      {Array.isArray(klinikstodStatus) && (
        <ul className="admin-beroendetest__lista">
          {klinikstodStatus.map((r) => (
            <li key={r.fraga}>
              <span className={r.ok ? "admin-beroendetest__punkt--ok" : "admin-beroendetest__punkt--fel"}>
                {r.ok ? "🟢" : "🔴"}
              </span>{" "}
              <strong>"{r.fraga}"</strong>
              {r.fel && <span> – Fel: {r.fel}</span>}
              {!r.fel && (
                <span>
                  {" "}
                  – {r.antalTraffar} träff(ar)
                  {r.otillatnaKallor.length > 0 && (
                    <span className="admin-frist-varning">
                      {" "}
                      ⚠️ {r.otillatnaKallor.length} otillåten källa: {r.otillatnaKallor.join(", ")}
                    </span>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
