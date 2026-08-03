import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRutiner } from "../../hooks/useRutiner";
import { useDubblettdismissningar } from "../../hooks/useDubblettdismissningar";
import { hittaMisstankaDubbletter } from "../../utils/dubblettdetektion";

// Etapp 37c, pilot på ETT område (se ETAPPLAN6.md) – kliniskt-stod, medvetet hårdkodat
// istället för en valbar dropdown. Mekanisk textlikhet ger falska positiver, och den här
// funktionen ska utvärderas mot verkligt innehåll i EN kontext innan den eventuellt utökas
// till fler områden. Klart-kriterium: minst hälften av de flaggade paren ska bedömas rimliga
// av en redaktör – det kräver en människas bedömning över tid och avgörs INTE i den här koden.
const PILOTOMRADE = "kliniskt-stod";
// 0.3 valt efter kalibrering mot verklighetsnära exempel under utvecklingen (två rutiner med
// identiskt innehåll men en titel som bara skiljer sig genom ett suffix som "(uppdaterad)"
// gav ett poäng på ~0.27) – tillräckligt lågt för att undvika uppenbart orelaterade par, men
// högt nog för att fånga den vanligaste dubblett-varianten direkt utan att en redaktör
// behöver justera reglaget vid första besöket.
const STANDARD_MAX_POANG = 0.3;

export default function DubbletterSektion() {
  const { currentUser, namn } = useAuth();
  const { rutiner } = useRutiner(PILOTOMRADE);
  const { dismissningar, avfardaPar } = useDubblettdismissningar(PILOTOMRADE);
  const [maxPoang, setMaxPoang] = useState(STANDARD_MAX_POANG);

  const avfardadeNycklar = new Set(dismissningar.map((d) => d.parNyckel));
  const par = hittaMisstankaDubbletter(rutiner, maxPoang).filter(
    (p) => !avfardadeNycklar.has(p.nyckel)
  );

  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2>🔍 Möjliga dubbletter (pilot: Kliniskt stöd)</h2></summary>
      <p className="sida__beskrivning">
        Mekanisk likhetsjämförelse mellan godkända rutiner – en fråga att titta på, aldrig ett
        påstående. Ingenting slås ihop automatiskt. Öppna båda rutinerna och avgör själv; om de
        INTE hör ihop, avfärda paret så det inte flaggas igen.
      </p>
      <label>
        Känslighet (lägre = bara nästan identiska par)
        <input
          type="range"
          min="0.05"
          max="0.6"
          step="0.05"
          value={maxPoang}
          onChange={(e) => setMaxPoang(Number(e.target.value))}
        />{" "}
        {maxPoang.toFixed(2)}
      </label>
      {par.length === 0 ? (
        <p className="sida__beskrivning">Inga misstänkta par vid den här känsligheten.</p>
      ) : (
        <ul className="admin-lista">
          {par.map((p) => (
            <li key={p.nyckel} className="admin-lista__rad">
              <a href={`/kliniskt-stod#rutin-${p.a.id}`} target="_blank" rel="noreferrer">
                {p.a.titel}
              </a>
              {" ↔ "}
              <a href={`/kliniskt-stod#rutin-${p.b.id}`} target="_blank" rel="noreferrer">
                {p.b.titel}
              </a>
              <div className="admin-lista__email">
                Likhetspoäng {p.poang.toFixed(2)} (lägre = mer lika){" "}
                <button
                  type="button"
                  className="knapp knapp--liten"
                  onClick={() => avfardaPar(p.nyckel, currentUser?.uid, namn)}
                >
                  Inte samma sak – avfärda
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
