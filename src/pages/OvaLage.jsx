import { useState } from "react";
import { Link } from "react-router-dom";
import { useAllaGodkandaRutiner } from "../hooks/useAllaGodkandaRutiner";
import { useKvissbank } from "../hooks/useKvissbank";
import { byggBankFragepool, byggFragepool, slumpaFragor, tillgangligaKategorier } from "../utils/ovaLage";
import { OMRADE_LABELS } from "../hooks/useSokindex";
import { KVISS_KATEGORI_LABEL } from "../data/kvissbank";
import { PAKET_LABEL, paketMedInnehall } from "../utils/kvissbank";
import "./OvaLage.css";

const ANTAL_FRAGOR = 8;

const OMRADEN = [
  { nyckel: "blandat", namn: "Blandat" },
  { nyckel: "kliniskt-stod", namn: OMRADE_LABELS["kliniskt-stod"] },
  { nyckel: "administration", namn: OMRADE_LABELS.administration },
];

// Etapp 65d: ett kort övningspass – slumpade frågor i följd, initierat av användaren själv
// (inte bundet till en kvittering som KvissModal.jsx, eller en kalendervecka som
// VeckansRepetition.jsx). Syftet är förståelse, inte betyg: precis som de två andra
// kvissytorna sparas INGET svar, rätt eller fel, någonstans (krav 14) – och till skillnad från
// dem visas heller inget sammanlagt resultat vid slutet, medvetet, för att inte ens en ofarlig
// sifferantydan ska kunna läsas som ett mätvärde (se ETAPPLAN14.md 65d:s uttryckliga
// avgränsning: inga poäng, inga streaks, inget synligt för någon annan).
//
// Etapp 71: frågorna kommer numera från TVÅ håll – organisationens egna rutiner (rutin.kviss,
// som förut) och den redigerbara frågebanken (useKvissbank.js), som är indelad i paket en
// admin kan slå av och på. Krav 14 gäller oförändrat för båda.
export default function OvaLage() {
  const { rutiner, laddar } = useAllaGodkandaRutiner();
  const { bank, laddar: laddarBank } = useKvissbank();
  const [fragor, setFragor] = useState(null);
  const [index, setIndex] = useState(0);
  const [valt, setValt] = useState(null);
  const [visaFacit, setVisaFacit] = useState(false);
  const [valdKategori, setValdKategori] = useState(null);

  function startaPass(kalla, kategori) {
    const pool =
      kalla.typ === "paket"
        ? byggBankFragepool(bank, kalla.nyckel, kategori)
        : byggFragepool(rutiner, kalla.nyckel, kategori);
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

  if (laddar || laddarBank) {
    return (
      <div className="sida sida--ova-lage">
        <p>Laddar...</p>
      </div>
    );
  }

  // Steg 1: välj ev. kategori och källa, inget pass pågår
  if (!fragor) {
    const rutinPool = byggFragepool(rutiner, "blandat").length;
    const paket = paketMedInnehall(bank);
    // Kategorierna som faktiskt förekommer, oavsett om frågan kommer från en rutin eller
    // banken – annars hade en kategori som bara finns i banken saknats i listan.
    const kategorier = [
      ...new Set([
        ...tillgangligaKategorier(rutiner, "blandat"),
        ...bank.map((f) => f.kategori).filter(Boolean),
      ]),
    ];
    const inget = paket.length === 0 && rutinPool === 0;

    return (
      <div className="sida sida--ova-lage">
        <h1>🎓 Öva</h1>
        <p className="sida__beskrivning">
          Ett kort övningspass med slumpade frågor. Inget svar sparas eller visas för någon
          annan – det här är bara till för dig.
        </p>

        {inget && (
          <p>
            Det finns ännu inga frågor att öva på. En superadmin eller VÖL kan slå på ett
            frågepaket under Admin → Övningsfrågor.
          </p>
        )}

        {!inget && (
          <>
            {kategorier.length > 0 && (
              <div className="ova-lage__kategorival">
                <label htmlFor="ova-lage-kategori">Kategori (valfritt)</label>
                <select
                  id="ova-lage-kategori"
                  value={valdKategori ?? ""}
                  onChange={(e) => setValdKategori(e.target.value || null)}
                >
                  <option value="">Alla kategorier</option>
                  {kategorier.map((k) => (
                    <option key={k} value={k}>
                      {KVISS_KATEGORI_LABEL[k] ?? k}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {paket.length > 0 && (
              <>
                <h2 className="ova-lage__rubrik">Frågepaket</h2>
                <div className="ova-lage__omradesval">
                  {paket.map((p) => {
                    const antal = byggBankFragepool(bank, p, valdKategori).length;
                    return (
                      <button
                        key={p}
                        type="button"
                        className="knapp"
                        disabled={antal === 0}
                        onClick={() => startaPass({ typ: "paket", nyckel: p }, valdKategori)}
                      >
                        {PAKET_LABEL[p] ?? p} ({antal} {antal === 1 ? "fråga" : "frågor"})
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {rutinPool > 0 && (
              <>
                <h2 className="ova-lage__rubrik">Frågor ur våra rutiner</h2>
                <div className="ova-lage__omradesval">
                  {OMRADEN.map((o) => {
                    const antal = byggFragepool(rutiner, o.nyckel, valdKategori).length;
                    return (
                      <button
                        key={o.nyckel}
                        type="button"
                        className="knapp"
                        disabled={antal === 0}
                        onClick={() => startaPass({ typ: "rutin", nyckel: o.nyckel }, valdKategori)}
                      >
                        {o.namn} ({antal} {antal === 1 ? "fråga" : "frågor"})
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </>
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
        Fråga {index + 1} av {fragor.length} · {post.rutinTitel ?? PAKET_LABEL[post.omrade] ?? post.omrade}
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
            {/* Källhänvisningen visas alltid när den finns, även vid rätt svar – den är
                poängen med spår 2 och det som gör ett kliniskt facit granskningsbart. */}
            {fraga.kalla && (
              <p className="ova-lage__kalla">
                Källa: {fraga.kalla}
                {fraga.kallaDatum ? ` (kontrollerad ${fraga.kallaDatum})` : ""}
              </p>
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
