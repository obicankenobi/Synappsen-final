import { useState } from "react";
import { Link } from "react-router-dom";
import { useAllaGodkandaRutiner } from "../hooks/useAllaGodkandaRutiner";
import { byggFragepool, slumpaFragor } from "../utils/ovaLage";
import { OMRADE_LABELS } from "../hooks/useSokindex";
import "./OvaLage.css";

const ANTAL_FRAGOR = 8;

const OMRADEN = [
  { nyckel: "blandat", namn: "Blandat" },
  { nyckel: "kliniskt-stod", namn: OMRADE_LABELS["kliniskt-stod"] },
  { nyckel: "administration", namn: OMRADE_LABELS.administration },
];

// Etapp 65d: ett kort övningspass – slumpade frågor ur flera rutiners kviss-banker i följd,
// initierat av användaren själv (inte bundet till en kvittering som KvissModal.jsx, eller en
// kalendervecka som VeckansRepetition.jsx). Syftet är förståelse, inte betyg: precis som de
// två andra kvissytorna sparas INGET svar, rätt eller fel, någonstans (krav 14) – och till
// skillnad från dem visas heller inget sammanlagt resultat vid slutet, medvetet, för att inte
// ens en ofarlig sifferantydan ska kunna läsas som ett mätvärde (se ETAPPLAN14.md 65d:s
// uttryckliga avgränsning: inga poäng, inga streaks, inget synligt för någon annan).
export default function OvaLage() {
  const { rutiner, laddar } = useAllaGodkandaRutiner();
  const [fragor, setFragor] = useState(null);
  const [index, setIndex] = useState(0);
  const [valt, setValt] = useState(null);
  const [visaFacit, setVisaFacit] = useState(false);

  function startaPass(omrade) {
    const pool = byggFragepool(rutiner, omrade);
    setFragor(slumpaFragor(pool, ANTAL_FRAGOR));
    setIndex(0);
    setValt(null);
    setVisaFacit(false);
  }

  function avslutaPass() {
    setFragor(null);
  }

  function hanteraSvara() {
    if (valt === null) return;
    setVisaFacit(true);
  }

  function hanteraNasta() {
    if (index < fragor.length - 1) {
      setIndex((i) => i + 1);
      setValt(null);
      setVisaFacit(false);
    } else {
      avslutaPass();
    }
  }

  if (laddar) {
    return (
      <div className="sida sida--ova-lage">
        <p>Laddar...</p>
      </div>
    );
  }

  // Steg 1: välj område, inget pass pågår
  if (!fragor) {
    const totalPool = byggFragepool(rutiner, "blandat").length;
    return (
      <div className="sida sida--ova-lage">
        <h1>🎓 Öva</h1>
        <p className="sida__beskrivning">
          Ett kort övningspass med slumpade frågor från flera rutiner. Inget svar sparas eller
          visas för någon annan – det här är bara till för dig.
        </p>
        {totalPool === 0 ? (
          <p>Det finns ännu inga kvissfrågor att öva på.</p>
        ) : (
          <div className="ova-lage__omradesval">
            {OMRADEN.map((o) => {
              const antal = byggFragepool(rutiner, o.nyckel).length;
              return (
                <button
                  key={o.nyckel}
                  type="button"
                  className="knapp"
                  disabled={antal === 0}
                  onClick={() => startaPass(o.nyckel)}
                >
                  {o.namn} ({antal} {antal === 1 ? "fråga" : "frågor"})
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Passet är klart – medvetet inget resultat/sammanfattning visas, se filens toppkommentar
  if (fragor.length === 0 || index >= fragor.length) {
    return (
      <div className="sida sida--ova-lage">
        <h1>✅ Bra jobbat</h1>
        <p className="sida__beskrivning">Övningspasset är klart.</p>
        <div className="ova-lage__slutknappar">
          <button type="button" className="knapp" onClick={() => setFragor(null)}>
            Öva igen
          </button>
          <Link to="/" className="knapp knapp--sekundar">
            Till startsidan
          </Link>
        </div>
      </div>
    );
  }

  const post = fragor[index];
  const { fraga } = post;
  const ratt = valt === fraga.rattIndex;

  return (
    <div className="sida sida--ova-lage">
      <div className="ova-lage__header">
        <h1>🎓 Öva</h1>
        <button type="button" className="knapp--lank" onClick={avslutaPass}>
          Avsluta passet
        </button>
      </div>
      <p className="ova-lage__progress">
        Fråga {index + 1} av {fragor.length} · {post.rutinTitel}
      </p>

      <div className="ova-lage__fraga-kort">
        <h2>{fraga.fraga}</h2>
        <div className="ova-lage__alternativ">
          {fraga.alternativ.map((alt, i) => (
            <label key={i} className="ova-lage__alternativ-rad">
              <input
                type="radio"
                name="ova-lage-alternativ"
                checked={valt === i}
                disabled={visaFacit}
                onChange={() => setValt(i)}
              />
              {alt}
            </label>
          ))}
        </div>

        {visaFacit && (
          <div className={ratt ? "ova-lage__facit ova-lage__facit--ratt" : "ova-lage__facit ova-lage__facit--fel"}>
            {ratt ? (
              <p>✅ Rätt svar!</p>
            ) : (
              <>
                <p>
                  Rätt svar var: <strong>{fraga.alternativ[fraga.rattIndex]}</strong>
                </p>
                {fraga.hanvisning && <p className="ova-lage__hanvisning">{fraga.hanvisning}</p>}
              </>
            )}
          </div>
        )}

        <div className="ova-lage__knappar">
          {!visaFacit && (
            <button type="button" className="knapp" disabled={valt === null} onClick={hanteraSvara}>
              Svara
            </button>
          )}
          {visaFacit && (
            <button type="button" className="knapp" onClick={hanteraNasta}>
              {index < fragor.length - 1 ? "Nästa fråga" : "Klar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
