import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { svaraPersonalpuls } from "../firebase/functions";
import { beraknaKvartal } from "../utils/kvartal";
import { OMRADE_NAMN } from "./admin/adminHjalp";
import "./Personalpuls.css";

const FRAGOR = [
  "Hittar du det du söker i appen när du behöver det?",
  "Litar du på att informationen i rutinerna är uppdaterad?",
  "Skulle du sakna appen om den försvann imorgon?",
];

// Etapp 39c: anonym personalpuls, tre frågor per kvartal. Ägarbeslut 2026-08-02: byggs, läses
// per område av VÖL/sektionsledare (kliniskt-stod) och VEC (administration) – se
// PersonalpulsResultatSektion.jsx. Inget enskilt svar sparas någonsin (se functions/index.js
// svaraPersonalpuls) – bara en aggregerad summa per område och kvartal. Under 30 sekunder att
// besvara (krav i ETAPPLAN6.md): tre skalfrågor plus vilket område man tillhör, inget annat.
export default function Personalpuls() {
  const { personalpulsSenastBesvarad } = useAuth();
  const [omrade, setOmrade] = useState("kliniskt-stod");
  const [svar, setSvar] = useState([null, null, null]);
  const [skickar, setSkickar] = useState(false);
  const [fel, setFel] = useState(null);
  const [tack, setTack] = useState(false);

  const kvartal = beraknaKvartal();
  const redanBesvarad = personalpulsSenastBesvarad === kvartal;

  if (redanBesvarad || tack) {
    return (
      <section className="admin-sektion personalpuls">
        <h2>💬 Personalpulsen</h2>
        <p className="sida__beskrivning">Tack, du har redan svarat för det här kvartalet ({kvartal}).</p>
      </section>
    );
  }

  const allaBesvarade = svar.every((s) => s !== null);

  async function hanteraSkicka(e) {
    e.preventDefault();
    if (!allaBesvarade) return;
    setSkickar(true);
    setFel(null);
    try {
      await svaraPersonalpuls(omrade, svar[0], svar[1], svar[2]);
      setTack(true);
    } catch (felObjekt) {
      setFel(
        felObjekt.code === "already-exists"
          ? "Du har redan svarat för det här kvartalet."
          : "Kunde inte skicka svaret just nu, försök igen."
      );
    } finally {
      setSkickar(false);
    }
  }

  function satSvar(index, varde) {
    setSvar((forra) => forra.map((v, i) => (i === index ? varde : v)));
  }

  return (
    <section className="admin-sektion personalpuls">
      <h2>💬 Personalpulsen ({kvartal})</h2>
      <p className="sida__beskrivning">
        Tre snabba frågor, helt anonymt – inget enskilt svar sparas, bara ett sammanlagt
        resultat för ditt område. Tar under 30 sekunder.
      </p>
      <form onSubmit={hanteraSkicka} className="personalpuls__form">
        <label>
          Vilket område jobbar du huvudsakligen i?
          <select value={omrade} onChange={(e) => setOmrade(e.target.value)}>
            {Object.entries(OMRADE_NAMN).map(([nyckel, namnText]) => (
              <option key={nyckel} value={nyckel}>
                {namnText}
              </option>
            ))}
          </select>
        </label>
        {FRAGOR.map((fraga, index) => (
          <fieldset key={fraga} className="personalpuls__fraga">
            <legend>{fraga}</legend>
            <div className="personalpuls__skala">
              {[1, 2, 3, 4, 5].map((varde) => (
                <label key={varde}>
                  <input
                    type="radio"
                    name={`fraga-${index}`}
                    value={varde}
                    checked={svar[index] === varde}
                    onChange={() => satSvar(index, varde)}
                  />
                  {varde}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        {fel && (
          <p className="personalpuls__fel" role="alert">
            {fel}
          </p>
        )}
        <button type="submit" className="knapp" disabled={!allaBesvarade || skickar}>
          {skickar ? "Skickar…" : "Skicka anonymt"}
        </button>
      </form>
    </section>
  );
}
