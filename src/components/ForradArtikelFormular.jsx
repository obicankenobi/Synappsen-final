import { useState } from "react";
import { kontrolleraPatientuppgifter } from "../utils/piiFilter";
import { useDialog } from "../hooks/useDialog";
import "./ForradArtikelFormular.css";

export default function ForradArtikelFormular({ initialaVarden, onSpara, onAvbryt }) {
  const { visaMeddelande } = useDialog();
  const [namn, setNamn] = useState(initialaVarden?.namn ?? "");
  const [skap, setSkap] = useState(initialaVarden?.skap ?? "");
  const [hylla, setHylla] = useState(initialaVarden?.hylla ?? "");
  const [antal, setAntal] = useState(initialaVarden?.antal ?? "");
  const [utgangsdatum, setUtgangsdatum] = useState(initialaVarden?.utgangsdatum ?? "");
  const [bild, setBild] = useState(null);
  const [sparar, setSparar] = useState(false);

  async function hanteraSubmit(e) {
    e.preventDefault();
    const kontroll = kontrolleraPatientuppgifter(`${namn} ${skap} ${hylla}`);
    if (kontroll.blockerad) {
      if (kontroll.meddelande) visaMeddelande(kontroll.meddelande);
      return;
    }
    setSparar(true);
    try {
      await onSpara({ namn, skap, hylla, antal, utgangsdatum: utgangsdatum || null, bild });
    } finally {
      setSparar(false);
    }
  }

  return (
    <form className="forrad-artikel-formular" onSubmit={hanteraSubmit}>
      <label>
        Artikelnamn
        <input type="text" required value={namn} onChange={(e) => setNamn(e.target.value)} />
      </label>
      <div className="forrad-artikel-formular__rad">
        <label>
          Skåp
          <input type="text" value={skap} onChange={(e) => setSkap(e.target.value)} />
        </label>
        <label>
          Hylla
          <input type="text" value={hylla} onChange={(e) => setHylla(e.target.value)} />
        </label>
      </div>
      <label>
        Antal (valfritt)
        <input type="text" value={antal} onChange={(e) => setAntal(e.target.value)} />
      </label>
      <label>
        Utgångsdatum (valfritt)
        <input type="date" value={utgangsdatum} onChange={(e) => setUtgangsdatum(e.target.value)} />
        <span className="forrad-artikel-formular__hjalptext">
          Används av utgångsdatumbevakningen i Logistik – artiklar som går ut inom 30 dagar
          listas där för förrådsansvarig.
        </span>
      </label>
      <label>
        Bild (valfritt)
        <input type="file" accept="image/*" onChange={(e) => setBild(e.target.files[0] ?? null)} />
      </label>
      <div className="forrad-artikel-formular__knappar">
        <button type="button" className="knapp knapp--sekundar" onClick={onAvbryt}>
          Avbryt
        </button>
        <button type="submit" className="knapp" disabled={sparar}>
          {sparar ? "Sparar..." : "Spara"}
        </button>
      </div>
    </form>
  );
}
