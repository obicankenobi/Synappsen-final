import { useState } from "react";
import "./RutinFormular.css";

export default function RutinFormular({ initialaVarden, ovrigaRutiner = [], onSpara, onAvbryt }) {
  const [titel, setTitel] = useState(initialaVarden?.titel ?? "");
  const [innehall, setInnehall] = useState(initialaVarden?.innehall ?? "");
  const [referenser, setReferenser] = useState(initialaVarden?.referenser ?? "");
  const [relaterade, setRelaterade] = useState(initialaVarden?.relateradeRutiner ?? []);
  const [nyaFiler, setNyaFiler] = useState([]);
  const [befintligaBilagor, setBefintligaBilagor] = useState(initialaVarden?.bilagor ?? []);
  const [sparar, setSparar] = useState(false);

  function taBortBefintlig(index) {
    setBefintligaBilagor((b) => b.filter((_, i) => i !== index));
  }

  function taBortNy(index) {
    setNyaFiler((f) => f.filter((_, i) => i !== index));
  }

  function vaxlaRelaterad(id) {
    setRelaterade((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));
  }

  const harBilagor = nyaFiler.length > 0 || befintligaBilagor.length > 0;

  async function hanteraSubmit(e) {
    e.preventDefault();
    if (!innehall.trim() && !harBilagor) {
      alert("Fyll i innehåll eller bifoga minst en fil.");
      return;
    }
    setSparar(true);
    try {
      await onSpara({ titel, innehall, referenser, relaterade, nyaFiler, befintligaBilagor });
    } finally {
      setSparar(false);
    }
  }

  const valbaraRutiner = ovrigaRutiner.filter((r) => r.id !== initialaVarden?.id);

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
        Innehåll {!harBilagor && "(krävs om ingen bilaga bifogas)"}
        <textarea
          rows={6}
          value={innehall}
          onChange={(e) => setInnehall(e.target.value)}
        />
        <span className="rutin-formular__hjalptext">
          Stöd för enkel textformatering: **fet text**, *kursiv*, # Rubrik, - punktlista
        </span>
      </label>
      <label>
        Referenser/källor (valfritt)
        <textarea
          rows={2}
          placeholder="T.ex. regionalt PM, författare, år"
          value={referenser}
          onChange={(e) => setReferenser(e.target.value)}
        />
      </label>

      {valbaraRutiner.length > 0 && (
        <label>
          Relaterade rutiner (valfritt)
          <div className="rutin-formular__relaterade">
            {valbaraRutiner.map((r) => (
              <label key={r.id} className="rutin-formular__relaterad-rad">
                <input
                  type="checkbox"
                  checked={relaterade.includes(r.id)}
                  onChange={() => vaxlaRelaterad(r.id)}
                />
                {r.titel}
              </label>
            ))}
          </div>
        </label>
      )}

      <label>
        Bilagor (bilder eller PDF, valfritt, flera går bra)
        <input
          type="file"
          accept="image/*,.pdf"
          multiple
          onChange={(e) => setNyaFiler((f) => [...f, ...Array.from(e.target.files ?? [])])}
        />
      </label>

      {(befintligaBilagor.length > 0 || nyaFiler.length > 0) && (
        <ul className="rutin-formular__bilagelista">
          {befintligaBilagor.map((b, i) => (
            <li key={`befintlig-${i}`}>
              {b.namn ?? "Bilaga"}
              <button type="button" className="knapp--lank" onClick={() => taBortBefintlig(i)}>
                Ta bort
              </button>
            </li>
          ))}
          {nyaFiler.map((f, i) => (
            <li key={`ny-${i}`}>
              {f.name} (ny)
              <button type="button" className="knapp--lank" onClick={() => taBortNy(i)}>
                Ta bort
              </button>
            </li>
          ))}
        </ul>
      )}

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
