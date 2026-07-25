export default function KlinikstodAnvandningSektion({
  klinikHjalpsamAndel,
  klinikfeedback,
  klinikTrendPerVecka,
  klinikVanligaFragor,
}) {
  return (
    <section className="admin-sektion">
      <h2>💬 Klinikstöd – hur används det?</h2>
      {klinikHjalpsamAndel !== null && (
        <p className="sida__beskrivning">
          {klinikHjalpsamAndel}% av {klinikfeedback.length} besvarade "var detta
          hjälpsamt?"-frågor var positiva.
        </p>
      )}
      {klinikTrendPerVecka.length > 1 && (
        <>
          <h3>Hjälpsamhetsgrad per vecka (Etapp 5)</h3>
          <p className="sida__beskrivning">
            Så att en försämring eller förbättring över tid syns, inte bara totalvärdet
            ovan (baserat på de senaste {klinikfeedback.length} bedömningarna).
          </p>
          <ul className="admin-statistik-lista">
            {klinikTrendPerVecka.map((v) => (
              <li key={v.vecka}>
                Vecka från {v.vecka}: {v.andel}% hjälpsamma ({v.totalt} bedömda)
              </li>
            ))}
          </ul>
        </>
      )}
      {klinikVanligaFragor.length > 0 && (
        <>
          <h3>Vanligaste frågorna</h3>
          <p className="sida__beskrivning">
            Loggen är anonym (inget uid sparas) – ger en bild av vilka kunskapsluckor
            personalen efterfrågar, inte vem som frågat.
          </p>
          <ul className="admin-statistik-lista">
            {klinikVanligaFragor.map((f) => (
              <li key={f.fraga}>
                "{f.fraga}" <span>({f.antal} gånger)</span>{" "}
                <button
                  type="button"
                  className="knapp--lank"
                  onClick={() => navigator.clipboard?.writeText(f.fraga)}
                  title="Kopiera frågan, t.ex. för att använda som titel på en ny rutin"
                >
                  Kopiera
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
