import { useAccent, ACCENTER } from "../hooks/useAccent";
import "./AccentValjare.css";

// Etapp 22e: ett fast, litet urval fördefinierade accentfärger (inte ett fritt färgval),
// så WCAG AA-kontrasten alltid håller oavsett vad någon väljer.
export default function AccentValjare() {
  const { accent, setAccent } = useAccent();

  return (
    <div className="accent-valjare" role="radiogroup" aria-label="Välj accentfärg">
      {ACCENTER.map((a) => (
        <button
          key={a.varde}
          type="button"
          role="radio"
          aria-checked={accent === a.varde}
          aria-label={a.namn}
          title={a.namn}
          className={`accent-valjare__val ${accent === a.varde ? "accent-valjare__val--vald" : ""}`}
          style={{ "--accent-forhandsvisning": a.farg }}
          onClick={() => setAccent(a.varde)}
        >
          {accent === a.varde && <span aria-hidden="true">✓</span>}
        </button>
      ))}
    </div>
  );
}
