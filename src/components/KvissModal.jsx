import { useState } from "react";
import "./KvissModal.css";

// Etapp 19b: en kort mikrokviss (2-4 flervalsfrågor) som visas INNAN kvitteringen räknas.
// Syftet är förståelse, inte betyg – fel svar visar bara rätt svar + hänvisning och låter
// personen försöka igen, om och om igen tills alla frågor är rätt. Ingen felsvarshistorik
// sparas någonstans (varken här eller i Firestore), bara det slutgiltiga "klar"-läget via
// den vanliga kvitteringen (se RutinKort.jsx – kvitteraLast anropas EFTER klarad kviss).
export default function KvissModal({ rutin, onKlar, onAvbryt }) {
  const fragor = rutin.kviss ?? [];
  const [index, setIndex] = useState(0);
  const [valt, setValt] = useState(null);
  const [visaFacit, setVisaFacit] = useState(false);

  const fraga = fragor[index];
  const ratt = valt === fraga.rattIndex;

  function hanteraSvara() {
    if (valt === null) return;
    setVisaFacit(true);
  }

  function hanteraForsokIgen() {
    setValt(null);
    setVisaFacit(false);
  }

  function hanteraNasta() {
    if (index < fragor.length - 1) {
      setIndex((i) => i + 1);
      setValt(null);
      setVisaFacit(false);
    } else {
      onKlar();
    }
  }

  return (
    <div className="kviss-modal__bakgrund" role="dialog" aria-modal="true">
      <div className="kviss-modal">
        <p className="kviss-modal__progress">
          Fråga {index + 1} av {fragor.length}
        </p>
        <h3>{fraga.fraga}</h3>
        <div className="kviss-modal__alternativ">
          {fraga.alternativ.map((alt, i) => (
            <label key={i} className="kviss-modal__alternativ-rad">
              <input
                type="radio"
                name="kviss-alternativ"
                checked={valt === i}
                disabled={visaFacit}
                onChange={() => setValt(i)}
              />
              {alt}
            </label>
          ))}
        </div>

        {visaFacit && (
          <div className={ratt ? "kviss-modal__facit kviss-modal__facit--ratt" : "kviss-modal__facit kviss-modal__facit--fel"}>
            {ratt ? (
              <p>✅ Rätt svar!</p>
            ) : (
              <>
                <p>
                  Rätt svar var: <strong>{fraga.alternativ[fraga.rattIndex]}</strong>
                </p>
                {fraga.hanvisning && <p className="kviss-modal__hanvisning">{fraga.hanvisning}</p>}
              </>
            )}
          </div>
        )}

        <div className="kviss-modal__knappar">
          <button type="button" className="knapp knapp--sekundar" onClick={onAvbryt}>
            Avbryt
          </button>
          {!visaFacit && (
            <button type="button" className="knapp" disabled={valt === null} onClick={hanteraSvara}>
              Svara
            </button>
          )}
          {visaFacit && !ratt && (
            <button type="button" className="knapp" onClick={hanteraForsokIgen}>
              Försök igen
            </button>
          )}
          {visaFacit && ratt && (
            <button type="button" className="knapp" onClick={hanteraNasta}>
              {index < fragor.length - 1 ? "Nästa fråga" : "Klar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
