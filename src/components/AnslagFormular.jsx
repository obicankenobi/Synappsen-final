import { useState } from "react";
import { ANSLAG_PRIORITET } from "../hooks/useAnslag";
import "./AnslagFormular.css";

export default function AnslagFormular({ initialaVarden, onSpara, onAvbryt }) {
  const [titel, setTitel] = useState(initialaVarden?.titel ?? "");
  const [innehall, setInnehall] = useState(initialaVarden?.innehall ?? "");
  const [fastNaglad, setFastNaglad] = useState(initialaVarden?.fastNaglad ?? false);
  const [prioritet, setPrioritet] = useState(initialaVarden?.prioritet ?? ANSLAG_PRIORITET.INFO);
  const [utgangsdatum, setUtgangsdatum] = useState(initialaVarden?.utgangsdatum ?? "");
  const [sparar, setSparar] = useState(false);

  async function hanteraSubmit(e) {
    e.preventDefault();
    setSparar(true);
    try {
      await onSpara({ titel, innehall, fastNaglad, prioritet, utgangsdatum });
    } finally {
      setSparar(false);
    }
  }

  return (
    <form className="anslag-formular" onSubmit={hanteraSubmit}>
      <label>
        Titel
        <input type="text" required value={titel} onChange={(e) => setTitel(e.target.value)} />
      </label>
      <label>
        Meddelande
        <textarea required rows={5} value={innehall} onChange={(e) => setInnehall(e.target.value)} />
      </label>
      <label className="anslag-formular__checkbox">
        <input type="checkbox" checked={fastNaglad} onChange={(e) => setFastNaglad(e.target.checked)} />
        Fäst högst upp
      </label>
      <label>
        Prioritet
        <select value={prioritet} onChange={(e) => setPrioritet(e.target.value)}>
          <option value={ANSLAG_PRIORITET.INFO}>Info</option>
          <option value={ANSLAG_PRIORITET.VIKTIGT}>⚠️ Viktigt</option>
        </select>
      </label>
      <label>
        Utgångsdatum (valfritt)
        <input type="date" value={utgangsdatum} onChange={(e) => setUtgangsdatum(e.target.value)} />
      </label>
      <div className="anslag-formular__knappar">
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
