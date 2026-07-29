// Etapp 27b: skriv ut ett QR-ark per skåp/hylla i förrådet. Varje etikett kodar en länk till
// förrådets sida, filtrerad till just den platsen (?skap=...&hylla=...) – skanna hyllan, se vad
// som ska stå där (ForradVy.jsx tolkar samma parametrar). Platserna är INTE en egen datamodell,
// bara de unika skap/hylla-kombinationer som redan finns fritextade på artiklarna – att skapa en
// ny "plats"-collection bara för etiketter hade varit att lösa ett problem ingen har än.
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import "./HyllEtiketter.css";

function unikaPlatser(artiklar) {
  const sedd = new Set();
  const platser = [];
  artiklar.forEach((a) => {
    if (!a.skap && !a.hylla) return;
    const nyckel = `${a.skap ?? ""}|${a.hylla ?? ""}`;
    if (sedd.has(nyckel)) return;
    sedd.add(nyckel);
    platser.push({ skap: a.skap ?? "", hylla: a.hylla ?? "" });
  });
  return platser.sort((a, b) => a.skap.localeCompare(b.skap) || a.hylla.localeCompare(b.hylla));
}

export default function HyllEtiketter({ forrad, forradSlug, artiklar, onStang }) {
  const [etiketter, setEtiketter] = useState([]);

  useEffect(() => {
    let avbruten = false;
    async function generera() {
      const platser = unikaPlatser(artiklar);
      const resultat = await Promise.all(
        platser.map(async (p) => {
          const params = new URLSearchParams();
          if (p.skap) params.set("skap", p.skap);
          if (p.hylla) params.set("hylla", p.hylla);
          const lank = `${window.location.origin}/logistik/${forradSlug}?${params.toString()}`;
          return { ...p, qrUrl: await QRCode.toDataURL(lank) };
        })
      );
      if (!avbruten) setEtiketter(resultat);
    }
    generera();
    return () => {
      avbruten = true;
    };
  }, [artiklar, forradSlug]);

  function skrivUt() {
    document.body.classList.add("utskrift-etiketter");
    window.print();
    window.addEventListener("afterprint", () => document.body.classList.remove("utskrift-etiketter"), {
      once: true,
    });
  }

  return (
    <div className="hyll-etiketter-overlay">
      <div className="hyll-etiketter">
        <div className="hyll-etiketter__verktyg">
          <h2>Hylletiketter – {forrad}</h2>
          <div>
            <button type="button" className="knapp" onClick={skrivUt} disabled={etiketter.length === 0}>
              🖨️ Skriv ut
            </button>
            <button type="button" className="knapp knapp--sekundar" onClick={onStang}>
              Stäng
            </button>
          </div>
        </div>

        {etiketter.length === 0 && (
          <p className="sida__beskrivning">
            Inga skåp/hyllor angivna på artiklarna i det här förrådet ännu.
          </p>
        )}

        <div className="hyll-etiketter__grid">
          {etiketter.map((e) => (
            <div className="hyll-etiketter__etikett" key={`${e.skap}|${e.hylla}`}>
              <img src={e.qrUrl} alt="" className="hyll-etiketter__qr" />
              <p className="hyll-etiketter__text">
                {forrad}
                {e.skap && <><br />Skåp {e.skap}</>}
                {e.hylla && <><br />Hylla {e.hylla}</>}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
