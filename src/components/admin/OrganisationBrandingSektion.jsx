// Etapp 28a/28b: logotyp, accentfärg och valfri välkomsttext för den egna organisationen.
// Uppdelat i en datahämtande wrapper (denna) + ett formulär som initierar sin lokala state
// direkt från props vid mount (samma mönster som ForradArtikelFormular.jsx – useState(props ?? "")
// istället för en useEffect som synkar in laddad data, vilket annars ger kaskaderande
// omrenderingar, se react-hooks/set-state-in-effect).
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useOrganisationBranding } from "../../hooks/useOrganisationBranding";
import { laddaUppLogotyp } from "../../firebase/storage";
import { useDialog } from "../../hooks/useDialog";
import "./OrganisationBrandingSektion.css";

function OrganisationBrandingFormular({ branding, organisationId, sparaBranding }) {
  const { visaMeddelande } = useDialog();
  const [accentfarg, setAccentfarg] = useState(branding.accentfarg ?? "");
  const [valkomsttext, setValkomsttext] = useState(branding.valkomsttext ?? "");
  const [laddarUpp, setLaddarUpp] = useState(false);
  const [sparat, setSparat] = useState(false);

  async function hanteraSparaText() {
    const resultat = await sparaBranding({ accentfarg: accentfarg || "", valkomsttext });
    if (!resultat.sparad) {
      visaMeddelande(resultat.fel ?? "Kunde inte spara.");
      return;
    }
    setSparat(true);
    setTimeout(() => setSparat(false), 2000);
  }

  async function hanteraLogotyp(e) {
    const fil = e.target.files?.[0];
    if (!fil || !organisationId) return;
    setLaddarUpp(true);
    try {
      const url = await laddaUppLogotyp(organisationId, fil);
      await sparaBranding({ logotypUrl: url });
    } finally {
      setLaddarUpp(false);
      e.target.value = "";
    }
  }

  return (
    <div className="admin-beroendetest org-branding">
      <label className="org-branding__falt">
        Logotyp
        {branding.logotypUrl && <img src={branding.logotypUrl} alt="" className="org-branding__logotyp" />}
        <input type="file" accept="image/*" onChange={hanteraLogotyp} disabled={laddarUpp} />
      </label>

      <label className="org-branding__falt" htmlFor="org-accentfarg">
        Accentfärg (hex)
      </label>
      <div className="org-branding__accentrad">
        <input
          id="org-accentfarg"
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(accentfarg) ? accentfarg : "#2f5fd6"}
          onChange={(e) => setAccentfarg(e.target.value)}
        />
        <input
          type="text"
          placeholder="#2f5fd6"
          value={accentfarg}
          onChange={(e) => setAccentfarg(e.target.value)}
          className="org-branding__hexinput"
        />
      </div>

      <label className="org-branding__falt" htmlFor="org-valkomsttext">
        Välkomsttext på startsidan
      </label>
      <textarea
        id="org-valkomsttext"
        rows={2}
        value={valkomsttext}
        onChange={(e) => setValkomsttext(e.target.value)}
        placeholder="T.ex. namnet på er verksamhet"
      />

      <div className="org-branding__sparaknapp">
        <button type="button" className="knapp" onClick={hanteraSparaText}>
          Spara
        </button>
        {sparat && " ✓ Sparat"}
      </div>
    </div>
  );
}

export default function OrganisationBrandingSektion() {
  const { organisationId } = useAuth();
  const { branding, laddat, sparaBranding } = useOrganisationBranding();

  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2><span aria-hidden="true">🏷️</span> Vår profil</h2></summary>
      <p className="sida__beskrivning">
        Logotyp, accentfärg och en kort välkomsttext som visas för alla i er organisation.
        Akutläget behåller alltid sin egen färgsättning, oavsett vad ni väljer här.
      </p>

      {!laddat && <p>Laddar...</p>}
      {laddat && (
        <OrganisationBrandingFormular branding={branding} organisationId={organisationId} sparaBranding={sparaBranding} />
      )}
    </details>
  );
}
