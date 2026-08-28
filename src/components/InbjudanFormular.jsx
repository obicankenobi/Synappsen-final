import { useState } from "react";
import { skapaInbjudan } from "../firebase/functions";
import { ROLES, ROLE_LABELS } from "../firebase/roles";
import { useFeatures } from "../hooks/useFeatures";
import { FEATURE } from "../config/features";
import "./InbjudanFormular.css";

// Etapp 53a-tillägg 2026-08-28: texten sa tidigare ALLTID "e-post är inte konfigurerat för
// den här installationen", oavsett varför utskicket uteblev. Det blev osant i samma stund som
// den rättsliga spärren mot Brevo infördes – nyckeln är konfigurerad, utskicket är pausat – och
// skickade den som läste meddelandet på jakt efter ett konfigurationsfel som inte fanns.
// Anledningen kommer nu från servern (se epostAnledning i functions/inbjudningar.js).
const EPOST_ANLEDNING_TEXT = {
  pub_avtal_saknas: "utgående e-post är tillfälligt pausat.",
  epost_avstangd_globalt: "utgående e-post är tillfälligt avstängt.",
  epost_ej_konfigurerad: "e-post är inte konfigurerat för den här installationen.",
  leverantorsfel: "e-postleverantören svarade med ett fel.",
  utskicksfel: "något gick fel vid utskicket.",
  okand: "orsaken är okänd.",
};

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
// Etapp 53b: servern FÖRSÖKER även skicka inbjudan direkt till e-postadressen
// (skapaInbjudanIntern). Länken visas ändå alltid – ett mejl kan fastna i ett spamfilter,
// och den ger en garanterad reservväg om utskicket uteblir.
// Etapp 70c: texten skilde tidigare INTE på skickat och inte skickat, utan påstod alltid
// "Inbjudan är skickad". Under hela den tid BREVO_API_KEY saknades var det osant, och
// superadmin hade ingen aning om att kollegan aldrig fick något mejl. skapaInbjudan
// returnerar nu epostSkickat, och texten nedan följer det faktiska utfallet.
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
  const [epostSkickat, setEpostSkickat] = useState(false);
  const [epostAnledning, setEpostAnledning] = useState(null);
  const [fel, setFel] = useState(null);

  async function hanteraSubmit(e) {
    e.preventDefault();
    setFel(null);
    setLank(null);
    setSkapar(true);
    try {
      const { data } = await skapaInbjudan(epost.trim(), roll);
      setLank(`${window.location.origin}/registrera?bjudan=${data.token}`);
      setEpostSkickat(data.epostSkickat === true);
      setEpostAnledning(data.epostAnledning ?? null);
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
          {epostSkickat ? (
            <p>
              Inbjudan är skickad till e-postadressen. Om mejlet inte kommer fram (t.ex. ett
              spamfilter) – skicka den här länken direkt istället (giltig i 7 dagar):
            </p>
          ) : (
            <p className="inbjudan-formular__fel">
              <strong>Inbjudan är skapad, men mejlet kunde INTE skickas</strong> –{" "}
              {EPOST_ANLEDNING_TEXT[epostAnledning] ?? EPOST_ANLEDNING_TEXT.okand} Skicka länken
              nedan till personen själv (giltig i 7 dagar):
            </p>
          )}
          <input type="text" readOnly value={lank} onFocus={(e) => e.target.select()} />
        </div>
      )}
    </div>
  );
}
