import { REDAKTORSROLLER, ROLE_LABELS } from "../../firebase/roles";

export default function SakerhetSektion({ kravMfaForRoller, vaxlaMfaKrav, sakerhetSparad }) {
  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2><span aria-hidden="true">🔐</span> Säkerhet</h2></summary>
      <p className="sida__beskrivning">
        Kräv tvåfaktorsautentisering för valda roller. Den som inte har aktiverat det
        möts av en påminnelse i appen och blockeras från att ändra roller eller
        organisationsinställningar tills det är aktiverat (under Profil).
      </p>
      <div className="admin-beroendetest">
        <ul className="admin-beroendetest__lista">
          {REDAKTORSROLLER.map((roll) => (
            <li key={roll}>
              <label>
                <input
                  type="checkbox"
                  checked={kravMfaForRoller.includes(roll)}
                  onChange={(e) => vaxlaMfaKrav(roll, e.target.checked)}
                />{" "}
                {ROLE_LABELS[roll]}
              </label>
            </li>
          ))}
        </ul>
        {sakerhetSparad && "✓ Sparat"}
      </div>
    </details>
  );
}
