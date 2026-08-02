import { Link } from "react-router-dom";
import { useNiSaViGjorde } from "../hooks/useAndringsforslag";
import { OMRADE_NAMN } from "./admin/adminHjalp";
import { formateraDatum } from "../utils/datum";
import "./NiSaViGjorde.css";

// Etapp 41a: en kort, publik lista över genomförda förbättringar som kom från personalens
// egna ändringsförslag, bredvid ändringsloggen på /nyheter. Namnger ALDRIG förslagsställaren
// om denne stängt av det (visaNamnOffentligt), se useNiSaViGjorde().
export default function NiSaViGjorde() {
  const { forslag } = useNiSaViGjorde(true);

  if (forslag.length === 0) return null;

  return (
    <section className="ni-sa-vi-gjorde">
      <h2>💡 Ni sa, vi gjorde</h2>
      <p className="sida__beskrivning">
        Ändringsförslag från personalen som faktiskt införts i rutinerna.
      </p>
      <ul>
        {forslag.map((f) => (
          <li key={f.id}>
            <Link to={`/${f.omrade}#rutin-${f.rutinId}`}>{f.rutinTitel}</Link>
            <span className="ni-sa-vi-gjorde__omrade">{OMRADE_NAMN[f.omrade] ?? f.omrade}</span>
            {f.visaNamnOffentligt !== false && f.foreslagenAvNamn && (
              <span className="ni-sa-vi-gjorde__forslagsstallare"> – förslag från {f.foreslagenAvNamn}</span>
            )}
            <time className="ni-sa-vi-gjorde__datum">{formateraDatum(f.hanteradDatum)}</time>
          </li>
        ))}
      </ul>
    </section>
  );
}
