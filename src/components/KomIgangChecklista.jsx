import { Link } from "react-router-dom";
import { CHECKLISTA_STEG, useValkomstchecklista } from "../hooks/useValkomstchecklista";
import "./KomIgangChecklista.css";

// Etapp 15b: guidad uppstart. Visas bara för superadmin (avgörs av den anropande sidan) och
// bara medan checklistan finns och inte redan är helt avklarad – en etablerad, i drift-satt
// organisation ska inte mötas av en påminnelse om steg den redan tagit.
//
// Etapp 56c: varje steg härleds nu ur faktisk data (se useValkomstchecklista.js) istället för
// att vara en självrapporterad checkbox – därför bara en statusindikator, inte en interaktiv
// ruta att klicka i. Steget blir avbockat av sig själv när handlingen faktiskt utförs.
export default function KomIgangChecklista() {
  const { steg, antalKlara, totalt, alltKlart } = useValkomstchecklista();

  if (steg == null || alltKlart) {
    return null;
  }

  const procent = Math.round((antalKlara / totalt) * 100);

  return (
    <section className="kom-igang" aria-label="Kom igång-checklista">
      <h2><span aria-hidden="true">🚀</span> Kom igång</h2>
      <p className="kom-igang__status">
        {antalKlara} av {totalt} steg klara
      </p>
      <div className="kom-igang__stapel" role="progressbar" aria-valuenow={procent} aria-valuemin={0} aria-valuemax={100}>
        <div className="kom-igang__stapel-fyllnad" style={{ width: `${procent}%` }} />
      </div>
      <ul className="kom-igang__lista">
        {CHECKLISTA_STEG.map((s) => {
          const klar = Boolean(steg[s.nyckel]);
          return (
            <li key={s.nyckel} className="kom-igang__steg">
              <span aria-hidden="true">{klar ? "✅" : "⬜"}</span>{" "}
              <span className={klar ? "kom-igang__titel kom-igang__titel--klar" : "kom-igang__titel"}>
                {s.titel}
              </span>
              <p className="kom-igang__beskrivning">{s.beskrivning}</p>
              {!klar && (
                <Link to={s.lank} className="kom-igang__lank">
                  Gå till sidan →
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
