import { useState } from "react";
import { skapaOrganisation } from "../../firebase/functions";
import { VERKSAMHETSTYPER } from "../../config/verksamhetstyper";

// Etapp 67e (ETAPPLAN16.md, ren flytt ur Leverantor.jsx – ingen beteendeförändring).
export default function SkapaOrganisationSektion({ onSkapad, onFel }) {
  const [namn, setNamn] = useState("");
  const [operations, setOperations] = useState(false);
  const [intelligence, setIntelligence] = useState(false);
  const [verksamhetstyp, setVerksamhetstyp] = useState("");
  const [orgnr, setOrgnr] = useState("");
  const [kontaktNamn, setKontaktNamn] = useState("");
  const [kontaktEpost, setKontaktEpost] = useState("");
  const [anvandartak, setAnvandartak] = useState("");
  const [skapar, setSkapar] = useState(false);
  const [skapadInfo, setSkapadInfo] = useState(null);
  const [inbjudanLank, setInbjudanLank] = useState(null);

  async function hanteraSkapa(e) {
    e.preventDefault();
    setSkapar(true);
    setSkapadInfo(null);
    setInbjudanLank(null);
    try {
      const { data } = await skapaOrganisation(namn.trim(), { operations, intelligence }, verksamhetstyp || undefined, {
        orgnr: orgnr.trim() || undefined,
        kontaktperson:
          kontaktNamn.trim() || kontaktEpost.trim()
            ? { namn: kontaktNamn.trim(), epost: kontaktEpost.trim() }
            : undefined,
        anvandartak: anvandartak.trim() || undefined,
      });
      const meddelanden = [];
      if (data.antalMallrutiner > 0) {
        meddelanden.push(`${data.antalMallrutiner} startmall-rutiner`);
      }
      if (data.antalForradsartiklar > 0) {
        meddelanden.push(`${data.antalForradsartiklar} förrådsartiklar`);
      }
      if (data.antalKontakter > 0) {
        meddelanden.push(`${data.antalKontakter} kontakter`);
      }
      if (data.introduktionssparId) {
        meddelanden.push("ett introduktionsspår");
      }
      if (data.kompetenskravId) {
        meddelanden.push("ett kompetenskrav");
      }
      setSkapadInfo(meddelanden.length > 0 ? `Organisationen skapades med ${meddelanden.join(", ")}.` : "Organisationen skapades.");
      if (data.inbjudanToken) {
        setInbjudanLank(`${window.location.origin}/registrera?bjudan=${data.inbjudanToken}`);
      }
      setNamn("");
      setOperations(false);
      setIntelligence(false);
      setVerksamhetstyp("");
      setOrgnr("");
      setKontaktNamn("");
      setKontaktEpost("");
      setAnvandartak("");
      await onSkapad();
    } catch (e2) {
      onFel(e2);
    } finally {
      setSkapar(false);
    }
  }

  return (
    <section className="admin-sektion">
      <h2>Skapa ny organisation</h2>
      <form className="leverantor__form" onSubmit={hanteraSkapa}>
        <label>
          Namn
          <input type="text" required value={namn} onChange={(e) => setNamn(e.target.value)} />
        </label>
        <label className="leverantor__checkbox">
          <input type="checkbox" checked={operations} onChange={(e) => setOperations(e.target.checked)} />
          Operations
        </label>
        <label className="leverantor__checkbox">
          <input type="checkbox" checked={intelligence} onChange={(e) => setIntelligence(e.target.checked)} />
          Intelligence
        </label>
        <label>
          Startbibliotek (valfritt)
          <select value={verksamhetstyp} onChange={(e) => setVerksamhetstyp(e.target.value)}>
            {VERKSAMHETSTYPER.map((v) => (
              <option key={v.varde} value={v.varde}>
                {v.namn}
              </option>
            ))}
          </select>
        </label>
        <label>
          Org.nr (valfritt)
          <input type="text" value={orgnr} onChange={(e) => setOrgnr(e.target.value)} />
        </label>
        <label>
          Kontaktperson – namn (valfritt)
          <input type="text" value={kontaktNamn} onChange={(e) => setKontaktNamn(e.target.value)} />
        </label>
        <label>
          Kontaktperson – e-post (valfritt, bjuder in som superadmin)
          <input
            type="email"
            value={kontaktEpost}
            onChange={(e) => setKontaktEpost(e.target.value)}
            placeholder="kontakt@kund.se"
          />
        </label>
        <label>
          Användartak (valfritt)
          <input type="number" min="1" value={anvandartak} onChange={(e) => setAnvandartak(e.target.value)} />
        </label>
        <button type="submit" className="knapp" disabled={skapar}>
          {skapar ? "Skapar..." : "Skapa organisation"}
        </button>
      </form>
      {skapadInfo && <p className="leverantor__info">{skapadInfo}</p>}
      {inbjudanLank && (
        <div className="leverantor__info">
          <p>
            Inbjudan är skickad till e-postadressen (om en angavs). Reservlänk om mejlet inte
            kommer fram (giltig i 7 dagar):
          </p>
          <input type="text" readOnly value={inbjudanLank} onFocus={(e) => e.target.select()} />
        </div>
      )}
    </section>
  );
}
