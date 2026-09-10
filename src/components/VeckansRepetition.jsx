import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useRutiner } from "../hooks/useRutiner";
import { valjVeckansFraga, veckoNyckel } from "../utils/veckansRepetition";
import "./VeckansRepetition.css";

const OMRADE_ROUTE = { "kliniskt-stod": "/kliniskt-stod", administration: "/administration", logistik: "/logistik" };

function harBesvaratDennaVecka(uid) {
  try {
    return localStorage.getItem(`veckansRepetition_${uid}`) === veckoNyckel();
  } catch {
    return false;
  }
}

function markeraBesvarad(uid) {
  try {
    localStorage.setItem(`veckansRepetition_${uid}`, veckoNyckel());
  } catch {
    // localStorage kan vara otillgängligt (privat läge) – ingen konsekvens, frågan visas bara igen
  }
}

// Etapp 41b: en frivillig fråga ur kvissbanken om en rutin man kvitterade för länge sedan.
// Rent klientarbete – inget svar, rätt eller fel, sparas någonsin någonstans (krav 14, samma
// princip som KvissModal.jsx). Visar sig inte alls om inget kvalificerar eller om veckans
// fråga redan besvarats (lokal flagga, inte synkad mellan enheter – ofarligt för en
// lågprioriterad, frivillig funktion som denna).
export default function VeckansRepetition() {
  const { currentUser } = useAuth();
  const { rutiner: klinisktRutiner } = useRutiner("kliniskt-stod");
  const { rutiner: adminRutiner } = useRutiner("administration");
  const { rutiner: logistikRutiner } = useRutiner("logistik");
  const [valt, setValt] = useState(null);
  const [dold, setDold] = useState(false);
  // Fryst vid montering – annars skulle markeraBesvarad() i hanteraSvar() (nedan) göra att
  // komponenten gömmer sig SJÄLV mitt i att visa facit, eftersom harBesvaratDennaVecka() då
  // plötsligt returnerar true på nästa rendering.
  const [redanBesvaradVidMontering] = useState(() =>
    currentUser?.uid ? harBesvaratDennaVecka(currentUser.uid) : false
  );

  const allaRutiner = useMemo(
    () => [...klinisktRutiner, ...adminRutiner, ...logistikRutiner],
    [klinisktRutiner, adminRutiner, logistikRutiner]
  );

  const veckansFraga = useMemo(
    () => valjVeckansFraga(allaRutiner, currentUser?.uid),
    [allaRutiner, currentUser?.uid]
  );

  if (!veckansFraga || !currentUser?.uid || dold || redanBesvaradVidMontering) {
    return null;
  }

  const { rutin, fraga } = veckansFraga;

  function hanteraSvar(index) {
    setValt(index);
    markeraBesvarad(currentUser.uid);
  }

  function hanteraStang() {
    markeraBesvarad(currentUser.uid);
    setDold(true);
  }

  const ratt = valt !== null && valt === fraga.rattIndex;

  return (
    <section className="admin-sektion veckans-repetition">
      <h2><span aria-hidden="true">🔁</span> Veckans repetition</h2>
      <p className="sida__beskrivning">
        Om <Link to={`${OMRADE_ROUTE[rutin.omrade] ?? "/"}#rutin-${rutin.id}`}>{rutin.titel}</Link> – frivilligt,
        30 sekunder.
      </p>
      <p className="veckans-repetition__fraga">{fraga.fraga}</p>
      {valt === null ? (
        <div className="veckans-repetition__alternativ">
          {fraga.alternativ.map((alt, i) => (
            <button key={i} type="button" className="knapp knapp--sekundar" onClick={() => hanteraSvar(i)}>
              {alt}
            </button>
          ))}
        </div>
      ) : (
        <div className="veckans-repetition__facit">
          <p>{ratt ? "✅ Rätt!" : `❌ Rätt svar: ${fraga.alternativ[fraga.rattIndex]}`}</p>
          {!ratt && fraga.hanvisning && <p className="veckans-repetition__hanvisning">{fraga.hanvisning}</p>}
          <button type="button" className="knapp knapp--liten knapp--sekundar" onClick={hanteraStang}>
            Stäng
          </button>
        </div>
      )}
    </section>
  );
}
