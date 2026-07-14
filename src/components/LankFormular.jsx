import { useState } from "react";
import "./KontaktFormular.css";

export default function LankFormular({ initialaVarden, befintliga = [], onSpara, onAvbryt }) {
  const [titel, setTitel] = useState(initialaVarden?.titel ?? "");
  const [url, setUrl] = useState(initialaVarden?.url ?? "");
  const [kategori, setKategori] = useState(initialaVarden?.kategori ?? "");
  const [beskrivning, setBeskrivning] = useState(initialaVarden?.beskrivning ?? "");
  const [sparar, setSparar] = useState(false);

  async function hanteraSubmit(e) {
    e.preventDefault();
    const dubblett = befintliga.some(
      (l) => l.id !== initialaVarden?.id && l.titel.trim().toLowerCase() === titel.trim().toLowerCase()
    );
    if (dubblett && !confirm(`En länk med titeln "${titel}" finns redan. Spara ändå?`)) return;
    setSparar(true);
    try {
      await onSpara({ titel, url, kategori, beskrivning });
    } finally {
      setSparar(false);
    }
  }

  return (
    <form className="kontakt-formular" onSubmit={hanteraSubmit}>
      <label>
        Titel
        <input type="text" required value={titel} onChange={(e) => setTitel(e.target.value)} />
      </label>
      <label>
        URL
        <input
          type="url"
          required
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </label>
      <label>
        Kategori
        <input
          type="text"
          placeholder="t.ex. Läkemedel, Riktlinjer, Regionalt"
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
        />
      </label>
      <label>
        Beskrivning (valfritt)
        <input type="text" value={beskrivning} onChange={(e) => setBeskrivning(e.target.value)} />
      </label>
      <div className="kontakt-formular__knappar">
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
