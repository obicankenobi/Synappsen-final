import { useState } from "react";
import { skapaInbjudan } from "../firebase/functions";
import { ROLES, ROLE_LABELS } from "../firebase/roles";
import "./InbjudanFormular.css";

const BJUDBARA_ROLLER = [
  ROLES.PERSONAL,
  ROLES.FORRADSANSVARIG,
  ROLES.SEKTIONSLEDARE,
  ROLES.VEC,
  ROLES.VOL,
  ROLES.SUPERADMIN,
];

// Etapp 6c: ersätter den gamla öppna självbetjänings-registreringen. En superadmin bjuder in
// en specifik e-postadress till en specifik roll; länken är giltig i 7 dagar och kan bara
// lösas in av den inbjudna e-postadressen (se losInInbjudan i functions/index.js).
export default function InbjudanFormular() {
  const [epost, setEpost] = useState("");
  const [roll, setRoll] = useState(ROLES.PERSONAL);
  const [skapar, setSkapar] = useState(false);
  const [lank, setLank] = useState(null);
  const [fel, setFel] = useState(null);

  async function hanteraSubmit(e) {
    e.preventDefault();
    setFel(null);
    setLank(null);
    setSkapar(true);
    try {
      const { data } = await skapaInbjudan(epost.trim(), roll);
      setLank(`${window.location.origin}/registrera?bjudan=${data.token}`);
      setEpost("");
    } catch (e2) {
      setFel(e2.message ?? "Kunde inte skapa inbjudan.");
    } finally {
      setSkapar(false);
    }
  }

  return (
    <div className="inbjudan-formular">
      <form onSubmit={hanteraSubmit}>
        <label>
          E-post
          <input
            type="email"
            required
            value={epost}
            onChange={(e) => setEpost(e.target.value)}
            placeholder="kollega@exempel.se"
          />
        </label>
        <label>
          Roll
          <select value={roll} onChange={(e) => setRoll(e.target.value)}>
            {BJUDBARA_ROLLER.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="knapp" disabled={skapar}>
          {skapar ? "Skapar..." : "Skapa inbjudningslänk"}
        </button>
      </form>
      {fel && <p className="inbjudan-formular__fel">{fel}</p>}
      {lank && (
        <div className="inbjudan-formular__lank">
          <p>Skicka den här länken till personen (giltig i 7 dagar):</p>
          <input type="text" readOnly value={lank} onFocus={(e) => e.target.select()} />
        </div>
      )}
    </div>
  );
}
