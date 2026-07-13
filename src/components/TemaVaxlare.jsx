import { useTema } from "../hooks/useTema";
import "./TemaVaxlare.css";

const VAL = [
  { varde: "light", ikon: "☀️", namn: "Ljust" },
  { varde: "dark", ikon: "🌙", namn: "Mörkt" },
  { varde: "system", ikon: "🖥️", namn: "System" },
];

export default function TemaVaxlare() {
  const { tema, setTema } = useTema();

  return (
    <div className="tema-vaxlare" role="radiogroup" aria-label="Välj tema">
      {VAL.map((v) => (
        <button
          key={v.varde}
          type="button"
          role="radio"
          aria-checked={tema === v.varde}
          className={`tema-vaxlare__val ${tema === v.varde ? "tema-vaxlare__val--vald" : ""}`}
          onClick={() => setTema(v.varde)}
        >
          <span aria-hidden="true">{v.ikon}</span> {v.namn}
        </button>
      ))}
    </div>
  );
}
