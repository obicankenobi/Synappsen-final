export default function KostnadsuppfoljningSektion({ kostnadshistorik }) {
  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2><span aria-hidden="true">💰</span> Kostnadsuppföljning (Etapp 5)</h2></summary>
      <p className="sida__beskrivning">
        AI-kostnad per avslutad månad, arkiverad automatiskt vid varje månadsskifte – för
        att se en trend, inte bara denna månads förbrukning ovan.
      </p>
      {kostnadshistorik.length === 0 && (
        <p className="sida__beskrivning">
          Ingen historik ännu – första posten skapas vid nästa månadsskifte.
        </p>
      )}
      {kostnadshistorik.length > 0 && (
        <ul className="admin-beroendetest__lista">
          {kostnadshistorik.map((h) => (
            <li key={h.id}>
              {h.manad}: {(h.anvantOre / 100).toFixed(2)} kr ({h.antalAnvandare} användare)
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
