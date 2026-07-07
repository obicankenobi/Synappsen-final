import { useState } from "react";
import "./RutinFormular.css";

export default function RutinFormular({ initialaVarden, onSpara, onAvbryt }) {
  const [titel, setTitel] = useState(initialaVarden?.titel ?? "");
  const [innehall, setInnehall] = useState(initialaVarden?.innehall ?? "");
  const [bild, setBild] = useState(null);
  const [sparar, setSparar] = useState(false);

  async function hanteraSubmit(e) {
    e.preventDefault();
    setSparar(true);
    try {
      await onSpara({ titel, innehall, bild });
    } finally {
      setSparar(false);
    }
  }

  return (
    <form className="rutin-formular" onSubmit={hanteraSubmit}>
      <label>
        Titel
        <input
          type="text"
          required
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
        />
      </label>
      <label>
        Innehåll
        <textarea
          required
          rows={6}
          value={innehall}
          onChange={(e) => setInnehall(e.target.value)}
        />
        <span className="rutin-formular__hjalptext">
          Stöd för enkel textformatering: **fet text**, *kursiv*, # Rubrik, - punktlista
        </span>
      </label>
      <label>
        Bild (valfritt)
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setBild(e.target.files[0] ?? null)}
        />
      </label>
      <div className="rutin-formular__knappar">
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
