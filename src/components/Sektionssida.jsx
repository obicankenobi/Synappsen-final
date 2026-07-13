import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAnvandare } from "../hooks/useAnvandare";
import { useRutiner, RUTIN_STATUS } from "../hooks/useRutiner";
import { laddaUppRutinBilagor } from "../firebase/storage";
import RutinFormular from "./RutinFormular";
import RutinKort from "./RutinKort";
import { arUtgangen } from "../utils/rutinHjalp";

export default function Sektionssida({
  omrade,
  titel,
  ikon,
  beskrivning,
  redigeraRoller,
  godkannaRoller,
}) {
  const { currentUser, role } = useAuth();
  const { rutiner, laddar, skapaRutin, uppdateraRutin, godkannRutin, taBortRutin, markeraGranskad, hamtaVersioner } =
    useRutiner(omrade);
  const { anvandare } = useAnvandare();
  const [redigerar, setRedigerar] = useState(null);
  const [visaFormular, setVisaFormular] = useState(false);
  const [aktivTagg, setAktivTagg] = useState(null);

  const farRedigera = redigeraRoller.includes(role);
  const farGodkanna = godkannaRoller.includes(role);
  // Om ingen separat godkännarroll finns publiceras innehållet direkt vid sparning
  const kraverGodkannande = redigeraRoller.some((r) => !godkannaRoller.includes(r));
  const synligaRutiner = farRedigera
    ? rutiner
    : rutiner.filter((r) => r.status === RUTIN_STATUS.GODKAND && !arUtgangen(r));

  const utkastRutiner = synligaRutiner.filter((r) => r.status === RUTIN_STATUS.UTKAST);

  const allaTaggar = useMemo(() => {
    const set = new Set();
    synligaRutiner.forEach((r) => (r.taggar ?? []).forEach((t) => set.add(t)));
    return [...set].sort();
  }, [synligaRutiner]);

  const filtreradeRutiner = aktivTagg
    ? synligaRutiner.filter((r) => (r.taggar ?? []).includes(aktivTagg))
    : synligaRutiner;

  // Möjliggör djuplänkning från sökresultat: /kliniskt-stod#rutin-{id} scrollar till rätt kort
  useEffect(() => {
    if (!laddar && window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [laddar, rutiner]);

  async function godkannAllaUtkast() {
    await Promise.all(utkastRutiner.map((r) => godkannRutin(r.id, currentUser.uid, currentUser.email)));
  }

  async function nekaAllaUtkast() {
    if (!confirm(`Ta bort alla ${utkastRutiner.length} utkast? Detta går inte att ångra.`)) return;
    await Promise.all(utkastRutiner.map((r) => taBortRutin(r.id, currentUser.uid)));
  }

  async function hanteraSpara({
    titel: titelVarde,
    innehall,
    referenser,
    taggar,
    utgangsdatum,
    relaterade,
    nyaFiler,
    befintligaBilagor,
  }) {
    if (redigerar) {
      const nyaBilagor = nyaFiler.length ? await laddaUppRutinBilagor(omrade, redigerar.id, nyaFiler) : [];
      await uppdateraRutin(
        redigerar.id,
        {
          titel: titelVarde,
          innehall,
          referenser,
          taggar,
          utgangsdatum,
          relateradeRutiner: relaterade,
          bilagor: [...befintligaBilagor, ...nyaBilagor],
        },
        currentUser.uid
      );
    } else {
      const ref = await skapaRutin({
        titel: titelVarde,
        innehall,
        omrade,
        skapadAv: currentUser.uid,
        kraverGodkannande,
      });
      await uppdateraRutin(ref.id, {
        referenser,
        taggar,
        utgangsdatum,
        relateradeRutiner: relaterade,
        bilagor: nyaFiler.length ? await laddaUppRutinBilagor(omrade, ref.id, nyaFiler) : [],
      });
    }
    setVisaFormular(false);
    setRedigerar(null);
  }

  function oppnaRedigering(rutin) {
    setRedigerar(rutin);
    setVisaFormular(true);
  }

  function oppnaNyRutin() {
    setRedigerar(null);
    setVisaFormular(true);
  }

  return (
    <div className="sida">
      <h1>
        {ikon} {titel}
      </h1>
      <p className="sida__beskrivning">{beskrivning}</p>

      {farRedigera && !visaFormular && (
        <button className="knapp" onClick={oppnaNyRutin}>
          Lägg till ny rutin
        </button>
      )}

      {visaFormular && (
        <RutinFormular
          initialaVarden={redigerar}
          ovrigaRutiner={rutiner.filter((r) => r.status === RUTIN_STATUS.GODKAND)}
          onSpara={hanteraSpara}
          onAvbryt={() => {
            setVisaFormular(false);
            setRedigerar(null);
          }}
        />
      )}

      {farGodkanna && utkastRutiner.length > 0 && (
        <div className="forrad-vy__bulkatgarder">
          <span>{utkastRutiner.length} utkast väntar på granskning</span>
          <button className="knapp" onClick={godkannAllaUtkast}>
            Godkänn alla
          </button>
          <button className="knapp knapp--farlig" onClick={nekaAllaUtkast}>
            Neka alla
          </button>
        </div>
      )}

      {allaTaggar.length > 0 && (
        <div className="sektionssida__taggfilter">
          <button
            type="button"
            className={`sektionssida__tagg ${aktivTagg === null ? "sektionssida__tagg--vald" : ""}`}
            onClick={() => setAktivTagg(null)}
          >
            Alla
          </button>
          {allaTaggar.map((tagg) => (
            <button
              key={tagg}
              type="button"
              className={`sektionssida__tagg ${aktivTagg === tagg ? "sektionssida__tagg--vald" : ""}`}
              onClick={() => setAktivTagg(tagg)}
            >
              {tagg}
            </button>
          ))}
        </div>
      )}

      {laddar && <p className="sida__beskrivning">Laddar...</p>}

      {!laddar && filtreradeRutiner.length === 0 && (
        <div className="platshallare">
          <p>{aktivTagg ? "Inga rutiner med den taggen." : "Inga rutiner publicerade ännu."}</p>
        </div>
      )}

      {filtreradeRutiner.map((rutin) => (
        <RutinKort
          key={rutin.id}
          rutin={rutin}
          allaRutiner={rutiner}
          anvandare={farRedigera ? anvandare : []}
          farRedigera={farRedigera}
          farGodkanna={farGodkanna}
          onRedigera={oppnaRedigering}
          onGodkann={(id) => godkannRutin(id, currentUser.uid, currentUser.email)}
          onTaBort={(id) => taBortRutin(id, currentUser.uid)}
          onMarkeraGranskad={(id) => markeraGranskad(id, currentUser.uid, currentUser.email)}
          hamtaVersioner={hamtaVersioner}
        />
      ))}
    </div>
  );
}
