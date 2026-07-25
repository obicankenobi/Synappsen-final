import { useState } from "react";
import { useDialog } from "../hooks/useDialog";
import "./KontaktFormular.css";

export default function KontaktFormular({ initialaVarden, befintliga = [], onSpara, onAvbryt }) {
  const { confirm } = useDialog();
  const [namn, setNamn] = useState(initialaVarden?.namn ?? "");
  const [nummer, setNummer] = useState(initialaVarden?.nummer ?? "");
  const [kategori, setKategori] = useState(initialaVarden?.kategori ?? "");
  const [beskrivning, setBeskrivning] = useState(initialaVarden?.beskrivning ?? "");
  const [sparar, setSparar] = useState(false);

  async function hanteraSubmit(e) {
    e.preventDefault();
    const dubblett = befintliga.some(
      (k) => k.id !== initialaVarden?.id && k.namn.trim().toLowerCase() === namn.trim().toLowerCase()
    );
    if (dubblett && !(await confirm(`En kontakt med namnet "${namn}" finns redan. Spara ändå?`))) return;
    setSparar(true);
    try {
      await onSpara({ namn, nummer, kategori, beskrivning });
    } finally {
      setSparar(false);
    }
  }

  return (
    <form className="kontakt-formular" onSubmit={hanteraSubmit}>
      <label>
        Namn/funktion
        <input type="text" required value={namn} onChange={(e) => setNamn(e.target.value)} />
      </label>
      <label>
        Nummer
        <input type="text" required value={nummer} onChange={(e) => setNummer(e.target.value)} />
      </label>
      <label>
        Kategori
        <input
          type="text"
          placeholder="t.ex. Jourlinje, Avdelning, Externt"
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
