import { useState } from "react";
import { skapaInbjudan } from "../firebase/functions";
import { ROLES, ROLE_LABELS } from "../firebase/roles";
import { useFeatures } from "../hooks/useFeatures";
import { FEATURE } from "../config/features";
import "./InbjudanFormular.css";

const BJUDBARA_ROLLER_UTAN_KIOSK = [
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
// Etapp 53b: servern skickar nu ÄVEN inbjudan direkt till e-postadressen (skapaInbjudanIntern).
// Länken visas ändå alltid – ett mejl kan fastna i ett spamfilter, och den ger en garanterad
// reservväg om utskicket av någon anledning uteblir.
export default function InbjudanFormular() {
  const { hasFeature } = useFeatures();
  // Etapp 59b (ETAPPLAN12.md, bugfynd): kiosk-rollen (Etapp 55) hör till Operations
  // (FEATURE.KIOSK_MODE) och ska inte gå att bjuda in utan den – UI-lagret av samma
  // trelagersgating som redan gäller AI-import/klinikstöd (se skapaInbjudan i
  // functions/index.js för den faktiska spärren; det här döljer bara valet).
  const bjudbaraRoller = hasFeature(FEATURE.KIOSK_MODE)
    ? [...BJUDBARA_ROLLER_UTAN_KIOSK, ROLES.KIOSK]
    : BJUDBARA_ROLLER_UTAN_KIOSK;
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
            {bjudbaraRoller.map((r) => (
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
          <p>
            Inbjudan är skickad till e-postadressen. Om mejlet inte kommer fram (t.ex. ett
            spamfilter) – skicka den här länken direkt istället (giltig i 7 dagar):
          </p>
          <input type="text" readOnly value={lank} onFocus={(e) => e.target.select()} />
        </div>
      )}
    </div>
  );
}
