import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useForradsartiklar, ARTIKEL_STATUS } from "../hooks/useForradsartiklar";
import { useBristanmalningar } from "../hooks/useBristanmalningar";
import { laddaUppForradsbild } from "../firebase/storage";
import { laggTillIKo } from "../utils/offlineKo";
import { FORRAD_SLUGS } from "../firebase/forrad";
import { KAN_HANTERA_FORRAD } from "../firebase/roles";
import ForradArtikelFormular from "../components/ForradArtikelFormular";
import ForradArtikelKort from "../components/ForradArtikelKort";
import HyllEtiketter from "../components/HyllEtiketter";
import Skelett from "../components/Skelett";
import { useDialog } from "../hooks/useDialog";

export default function ForradVy() {
  const { forradSlug } = useParams();
  const forrad = FORRAD_SLUGS[forradSlug];
  const { currentUser, role, namn } = useAuth();
  const mittNamn = namn || currentUser?.email;
  const { confirm } = useDialog();
  const { artiklar, laddar, skapaArtikel, uppdateraArtikel, godkannArtikel, taBortArtikel } =
    useForradsartiklar(forrad);
  const { skapaBristanmalning } = useBristanmalningar();
  const [redigerar, setRedigerar] = useState(null);
  const [visaFormular, setVisaFormular] = useState(false);
  const [visaEtiketter, setVisaEtiketter] = useState(false);
  // Etapp 27b/27c: en hyll-etikett kodar ?skap=&hylla=, en direktlänk till en artikel (t.ex.
  // en QR skannad direkt på hyllan i en framtida etapp) kodar #artikel-<id>. Båda tolkas här,
  // inte i SkannaModal – den vet bara VAD som skannades, inte vad det betyder i förrådsvyn.
  const [sokparametrar] = useSearchParams();
  const skapFilter = sokparametrar.get("skap");
  const hyllaFilter = sokparametrar.get("hylla");
  const artikelHash = typeof window !== "undefined" ? window.location.hash.replace("#artikel-", "") : "";

  useEffect(() => {
    if (!artikelHash || laddar) return;
    document.getElementById(`artikel-${artikelHash}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [artikelHash, laddar]);

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

  // 27b: en skannad hylletikett landar här med ?skap=&hylla= – visa bara vad som faktiskt
  // hör hemma på den platsen istället för hela förrådets lista.
  const ingenPlatsfiltrering = !skapFilter && !hyllaFilter;
  const visade = ingenPlatsfiltrering
    ? sorterade
    : sorterade.filter((a) => (!skapFilter || a.skap === skapFilter) && (!hyllaFilter || a.hylla === hyllaFilter));

  async function godkannAllaUtkast() {
    await Promise.all(utkast.map((a) => godkannArtikel(a.id)));
  }

  async function nekaAllaUtkast() {
    if (!(await confirm(`Ta bort alla ${utkast.length} utkast? De hamnar i papperskorgen.`))) return;
    await Promise.all(utkast.map((a) => taBortArtikel(a.id, currentUser.uid)));
  }

  async function hanteraSpara({ namn, skap, hylla, antal, utgangsdatum, bild }) {
    if (redigerar) {
      const bildUrl = bild
        ? await laddaUppForradsbild(forradSlug, redigerar.id, bild)
        : redigerar.bildUrl;
      await uppdateraArtikel(redigerar.id, { namn, skap, hylla, antal, utgangsdatum, bildUrl });
    } else {
      const ref = await skapaArtikel({ namn, skap, hylla, antal, utgangsdatum, forrad, skapadAv: currentUser.uid });
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

  // Etapp 29c: en bristanmälan gjord offline läggs i kön istället för att misslyckas tyst –
  // useOfflineKo.js (monterad vid approten) skickar den så fort nätet är tillbaka, och väntar
  // då på att den EGNA bristanmalningar-listan laddat klart innan den gör det (annars
  // riskerar dubblettskyddet i skapaBristanmalning att missa en redan öppen anmälan).
  async function hanteraAnmalBrist(artikel, kommentar) {
    const post = { artikelId: artikel.id, artikelNamn: artikel.namn, forrad, kommentar };
    if (!navigator.onLine) {
      laggTillIKo(currentUser.uid, "bristanmalning", post);
      return;
    }
    try {
      await skapaBristanmalning({ ...post, uid: currentUser.uid, namn: mittNamn });
    } catch {
      laggTillIKo(currentUser.uid, "bristanmalning", post);
    }
  }

  return (
    <div className="sida">
      <Link to="/logistik">← Logistik</Link>
      <h1>{forrad}</h1>

      {!ingenPlatsfiltrering && (
        <div className="forrad-vy__platsfilter">
          <span>
            Visar plats: {[skapFilter && `Skåp ${skapFilter}`, hyllaFilter && `Hylla ${hyllaFilter}`]
              .filter(Boolean)
              .join(" · ")}
          </span>
          <Link to={`/logistik/${forradSlug}`}>Visa alla artiklar</Link>
        </div>
      )}

      {farRedigera && !visaFormular && (
        <div className="sektionssida__topatgarder">
          <button className="knapp" onClick={() => setVisaFormular(true)}>
            Lägg till artikel
          </button>
          <button className="knapp knapp--sekundar" onClick={() => setVisaEtiketter(true)}>
            🖨️ Hylletiketter
          </button>
        </div>
      )}

      {visaEtiketter && (
        <HyllEtiketter
          forrad={forrad}
          forradSlug={forradSlug}
          artiklar={sorterade}
          onStang={() => setVisaEtiketter(false)}
        />
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

      {!laddar && sorterade.length > 0 && visade.length === 0 && (
        <div className="platshallare">
          <p>Inga artiklar registrerade på den här platsen.</p>
        </div>
      )}

      {visade.map((artikel) => (
        <ForradArtikelKort
          key={artikel.id}
          artikel={artikel}
          farRedigera={farRedigera}
          farGodkanna={farRedigera}
          onRedigera={oppnaRedigering}
          onGodkann={godkannArtikel}
          onTaBort={(id) => taBortArtikel(id, currentUser.uid)}
          onAnmalBrist={hanteraAnmalBrist}
          markerad={artikel.id === artikelHash}
        />
      ))}
    </div>
  );
}
