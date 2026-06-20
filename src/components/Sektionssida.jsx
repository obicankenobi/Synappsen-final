import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useRutiner, RUTIN_STATUS } from "../hooks/useRutiner";
import { laddaUppRutinBild } from "../firebase/storage";
import RutinFormular from "./RutinFormular";
import RutinKort from "./RutinKort";

export default function Sektionssida({
  omrade,
  titel,
  ikon,
  beskrivning,
  redigeraRoller,
  godkannaRoller,
}) {
  const { currentUser, role } = useAuth();
  const { rutiner, laddar, skapaRutin, uppdateraRutin, godkannRutin, taBortRutin } =
    useRutiner(omrade);
  const [redigerar, setRedigerar] = useState(null);
  const [visaFormular, setVisaFormular] = useState(false);

  const farRedigera = redigeraRoller.includes(role);
  const farGodkanna = godkannaRoller.includes(role);
  // Om ingen separat godkännarroll finns publiceras innehållet direkt vid sparning
  const kraverGodkannande = redigeraRoller.some((r) => !godkannaRoller.includes(r));
  const synligaRutiner = farRedigera
    ? rutiner
    : rutiner.filter((r) => r.status === RUTIN_STATUS.GODKAND);

  async function hanteraSpara({ titel: titelVarde, innehall, bild }) {
    if (redigerar) {
      const bildUrl = bild
        ? await laddaUppRutinBild(omrade, redigerar.id, bild)
        : redigerar.bildUrl;
      await uppdateraRutin(redigerar.id, { titel: titelVarde, innehall, bildUrl });
    } else {
      const ref = await skapaRutin({
        titel: titelVarde,
        innehall,
        omrade,
        skapadAv: currentUser.uid,
        kraverGodkannande,
      });
      if (bild) {
        const bildUrl = await laddaUppRutinBild(omrade, ref.id, bild);
        await uppdateraRutin(ref.id, { bildUrl });
      }
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
          onSpara={hanteraSpara}
          onAvbryt={() => {
            setVisaFormular(false);
            setRedigerar(null);
          }}
        />
      )}

      {laddar && <p className="sida__beskrivning">Laddar...</p>}

      {!laddar && synligaRutiner.length === 0 && (
        <div className="platshallare">
          <p>Inga rutiner publicerade ännu.</p>
        </div>
      )}

      {synligaRutiner.map((rutin) => (
        <RutinKort
          key={rutin.id}
          rutin={rutin}
          farRedigera={farRedigera}
          farGodkanna={farGodkanna}
          onRedigera={oppnaRedigering}
          onGodkann={godkannRutin}
          onTaBort={taBortRutin}
        />
      ))}
    </div>
  );
}
