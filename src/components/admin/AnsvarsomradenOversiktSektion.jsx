import { useMemo } from "react";
import { OMRADE_NAMN } from "./adminHjalp";
import { arAnsvarigForRutin } from "../../utils/rutinHjalp";

// Etapp 66c: "vem ansvarar för vad" – slår ihop TVÅ separata ansvarsbegrepp som redan finns
// i datamodellen utan att dubblera dem: users/{uid}.ansvarsomraden (vad en person ansvarar
// för i STORT, satt av superadmin) och rutin.agare (vem som äger en SPECIFIK rutin, satt per
// rutin i RutinFormular.jsx). En läsning-bara operativ vy, ingen egen datamodell.
//
// Uttrycklig avgränsning (se ETAPPLAN15.md §66c): det här är INTE ett bemannings- eller
// schemaverktyg. Den svarar på "vem äger den här frågan", aldrig på "vem arbetar just nu".
//
// Återanvänder arAnsvarigForRutin() (Etapp 66a, utils/rutinHjalp.js) med
// farRedigeraOmradet: false – det gör att den generiska "redaktör för området"-fallbacken
// aldrig slår till här, bara ett FAKTISKT satt agare-fält räknas. Exakt vad "äger den här
// rutinen" ska betyda, och samma regel som notissystemet redan bygger på.
function agarAvRutin(rutin, anvandarpost) {
  return arAnsvarigForRutin(rutin, { uid: anvandarpost.id, role: anvandarpost.role, farRedigeraOmradet: false });
}

export default function AnsvarsomradenOversiktSektion({ anvandare, rutiner }) {
  const rader = useMemo(() => {
    return anvandare
      .map((anvandarpost) => ({
        anvandarpost,
        omraden: anvandarpost.ansvarsomraden ?? [],
        agdaRutiner: rutiner.filter((r) => agarAvRutin(r, anvandarpost)),
      }))
      .filter((rad) => rad.omraden.length > 0 || rad.agdaRutiner.length > 0);
  }, [anvandare, rutiner]);

  if (rader.length === 0) return null;

  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2>Vem ansvarar för vad</h2></summary>
      <p className="sida__beskrivning">
        Ansvarsområden (tilldelade under "Användare och roller") och rutiner personen äger,
        samlat på ett ställe.
      </p>
      <ul className="admin-lista">
        {rader.map(({ anvandarpost, omraden, agdaRutiner }) => (
          <li key={anvandarpost.id} className="admin-lista__rad">
            <div>
              <strong>{anvandarpost.namn || anvandarpost.email}</strong>
              {omraden.length > 0 && (
                <div className="admin-lista__email">Ansvarsområden: {omraden.join(", ")}</div>
              )}
              {agdaRutiner.length > 0 && (
                <div className="admin-lista__email">
                  Äger {agdaRutiner.length} {agdaRutiner.length === 1 ? "rutin" : "rutiner"}:{" "}
                  {agdaRutiner.map((r, i) => (
                    <span key={r.id}>
                      {i > 0 && ", "}
                      {r.titel} ({OMRADE_NAMN[r.omrade] ?? r.omrade})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}
