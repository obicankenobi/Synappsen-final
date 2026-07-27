import { Link } from "react-router-dom";
import { CHECKLISTA_STEG, useValkomstchecklista } from "../hooks/useValkomstchecklista";
import "./KomIgangChecklista.css";

// Etapp 15b: guidad uppstart. Visas bara för superadmin (avgörs av den anropande sidan) och
// bara medan checklistan finns och inte redan är helt avklarad – en etablerad, i drift-satt
// organisation ska inte mötas av en påminnelse om steg den redan tagit.
export default function KomIgangChecklista() {
  const { steg, markeraSteg, antalKlara, totalt, alltKlart } = useValkomstchecklista();

  if (steg == null || alltKlart) {
    return null;
  }

  const procent = Math.round((antalKlara / totalt) * 100);

  return (
    <section className="kom-igang" aria-label="Kom igång-checklista">
      <h2>🚀 Kom igång</h2>
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
              <label>
                <input
                  type="checkbox"
                  checked={klar}
                  onChange={(e) => markeraSteg(s.nyckel, e.target.checked)}
                />
                <span className={klar ? "kom-igang__titel kom-igang__titel--klar" : "kom-igang__titel"}>
                  {s.titel}
                </span>
              </label>
              <p className="kom-igang__beskrivning">{s.beskrivning}</p>
              <Link to={s.lank} className="kom-igang__lank">
                Gå till sidan →
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
