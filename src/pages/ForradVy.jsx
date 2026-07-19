import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useForradsartiklar, ARTIKEL_STATUS } from "../hooks/useForradsartiklar";
import { laddaUppForradsbild } from "../firebase/storage";
import { FORRAD_SLUGS } from "../firebase/forrad";
import { KAN_HANTERA_FORRAD } from "../firebase/roles";
import ForradArtikelFormular from "../components/ForradArtikelFormular";
import ForradArtikelKort from "../components/ForradArtikelKort";
import Skelett from "../components/Skelett";

export default function ForradVy() {
  const { forradSlug } = useParams();
  const forrad = FORRAD_SLUGS[forradSlug];
  const { currentUser, role } = useAuth();
  const { artiklar, laddar, skapaArtikel, uppdateraArtikel, godkannArtikel, taBortArtikel } =
    useForradsartiklar(forrad);
  const [redigerar, setRedigerar] = useState(null);
  const [visaFormular, setVisaFormular] = useState(false);

  if (!forrad) {
    return (
      <div className="sida">
        <p className="sida__beskrivning">Okänt förråd.</p>
        <Link to="/logistik">Tillbaka till Logistik</Link>
      </div>
    );
  }

  const farRedigera = KAN_HANTERA_FORRAD.includes(role);
  const synligaArtiklar = farRedigera
    ? artiklar
    : artiklar.filter((a) => a.status === ARTIKEL_STATUS.GODKAND);

  const sorterade = [...synligaArtiklar].sort((a, b) => {
    const skapJamforelse = (a.skap ?? "").localeCompare(b.skap ?? "");
    if (skapJamforelse !== 0) return skapJamforelse;
    return (a.hylla ?? "").localeCompare(b.hylla ?? "");
  });

  const utkast = sorterade.filter((a) => a.status === ARTIKEL_STATUS.UTKAST);

  async function godkannAllaUtkast() {
    await Promise.all(utkast.map((a) => godkannArtikel(a.id)));
  }

  async function nekaAllaUtkast() {
    if (!confirm(`Ta bort alla ${utkast.length} utkast? De hamnar i papperskorgen.`)) return;
    await Promise.all(utkast.map((a) => taBortArtikel(a.id, currentUser.uid)));
  }

  async function hanteraSpara({ namn, skap, hylla, antal, bild }) {
    if (redigerar) {
      const bildUrl = bild
        ? await laddaUppForradsbild(forradSlug, redigerar.id, bild)
        : redigerar.bildUrl;
      await uppdateraArtikel(redigerar.id, { namn, skap, hylla, antal, bildUrl });
    } else {
      const ref = await skapaArtikel({ namn, skap, hylla, antal, forrad, skapadAv: currentUser.uid });
      if (bild) {
        const bildUrl = await laddaUppForradsbild(forradSlug, ref.id, bild);
        await uppdateraArtikel(ref.id, { bildUrl });
      }
    }
    setVisaFormular(false);
    setRedigerar(null);
  }

  function oppnaRedigering(artikel) {
    setRedigerar(artikel);
    setVisaFormular(true);
  }

  return (
    <div className="sida">
      <Link to="/logistik">← Logistik</Link>
      <h1>{forrad}</h1>

      {farRedigera && !visaFormular && (
        <button className="knapp" onClick={() => setVisaFormular(true)}>
          Lägg till artikel
        </button>
      )}

      {visaFormular && (
        <ForradArtikelFormular
          initialaVarden={redigerar}
          onSpara={hanteraSpara}
          onAvbryt={() => {
            setVisaFormular(false);
            setRedigerar(null);
          }}
        />
      )}

      {farRedigera && utkast.length > 0 && (
        <div className="forrad-vy__bulkatgarder">
          <span>{utkast.length} utkast väntar på granskning</span>
          <button className="knapp" onClick={godkannAllaUtkast}>
            Godkänn alla
          </button>
          <button className="knapp knapp--farlig" onClick={nekaAllaUtkast}>
            Neka alla
          </button>
        </div>
      )}

      {laddar && <Skelett />}

      {!laddar && sorterade.length === 0 && (
        <div className="platshallare">
          <p>Inga artiklar registrerade i det här förrådet ännu.</p>
        </div>
      )}

      {sorterade.map((artikel) => (
        <ForradArtikelKort
          key={artikel.id}
          artikel={artikel}
          farRedigera={farRedigera}
          farGodkanna={farRedigera}
          onRedigera={oppnaRedigering}
          onGodkann={godkannArtikel}
          onTaBort={(id) => taBortArtikel(id, currentUser.uid)}
        />
      ))}
    </div>
  );
}
