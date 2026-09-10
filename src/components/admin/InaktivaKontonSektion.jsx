import { formateraDatum } from "../../utils/datum";

export default function InaktivaKontonSektion({ inaktivaKonton }) {
  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2><span aria-hidden="true">💤</span> Inaktiva konton (ingen inloggning på 90 dagar)</h2></summary>
      <p className="sida__beskrivning">
        Gamla konton är en onödig attackyta – överväg att ta bort de som inte längre används.
        Konton skapade före v5.7.0 visas här tills de loggar in en första gång efter
        uppdateringen (inloggningstid spårades inte tidigare).
      </p>
      <ul className="admin-statistik-lista">
        {inaktivaKonton.map((a) => (
          <li key={a.id}>
            {a.namn || a.email}{" "}
            <span>
              {a.senasteInloggning?.toDate
                ? `senast ${formateraDatum(a.senasteInloggning)}`
                : "aldrig registrerad inloggning"}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
