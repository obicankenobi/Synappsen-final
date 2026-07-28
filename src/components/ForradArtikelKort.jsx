import { useState } from "react";
import { ARTIKEL_STATUS } from "../hooks/useForradsartiklar";
import { kontrolleraPatientuppgifter } from "../utils/piiFilter";
import { useDialog } from "../hooks/useDialog";
import FavoritKnapp from "./FavoritKnapp";
import "./ForradArtikelKort.css";

export default function ForradArtikelKort({
  artikel,
  farRedigera,
  farGodkanna,
  onRedigera,
  onGodkann,
  onTaBort,
  onAnmalBrist,
}) {
  const { visaMeddelande } = useDialog();
  const arUtkast = artikel.status === ARTIKEL_STATUS.UTKAST;
  const [visaBristformular, setVisaBristformular] = useState(false);
  const [bristKommentar, setBristKommentar] = useState("");
  const [skickar, setSkickar] = useState(false);

  async function hanteraSkickaBrist() {
    const kontroll = kontrolleraPatientuppgifter(bristKommentar);
    if (kontroll.blockerad) {
      if (kontroll.meddelande) visaMeddelande(kontroll.meddelande);
      return;
    }
    setSkickar(true);
    try {
      await onAnmalBrist(artikel, bristKommentar.trim());
      setBristKommentar("");
      setVisaBristformular(false);
    } finally {
      setSkickar(false);
    }
  }

  return (
    <article className="forrad-artikel-kort">
      {artikel.bildUrl && (
        <img className="forrad-artikel-kort__bild" src={artikel.bildUrl} alt="" />
      )}
      <div className="forrad-artikel-kort__info">
        <header className="forrad-artikel-kort__header">
          <div className="forrad-artikel-kort__titelrad">
            <h3>{artikel.namn}</h3>
            {arUtkast && <span className="forrad-artikel-kort__badge">Utkast</span>}
          </div>
          <FavoritKnapp typ="artikel" id={artikel.id} />
        </header>
        <p className="forrad-artikel-kort__plats">
          {artikel.skap ? `Skåp ${artikel.skap}` : "Skåp ej angivet"}
          {" · "}
          {artikel.hylla ? `Hylla ${artikel.hylla}` : "Hylla ej angiven"}
        </p>
        {artikel.antal && <p className="forrad-artikel-kort__antal">Antal: {artikel.antal}</p>}
      </div>

      {onAnmalBrist && !arUtkast && (
        <div className="forrad-artikel-kort__brist">
          {!visaBristformular && (
            <button
              type="button"
              className="knapp knapp--liten knapp--sekundar"
              onClick={() => setVisaBristformular(true)}
            >
              ⚠️ Slut/lågt saldo
            </button>
          )}
          {visaBristformular && (
            <div className="forrad-artikel-kort__bristformular">
              <input
                type="text"
                placeholder="Kommentar (valfritt)"
                value={bristKommentar}
                onChange={(e) => setBristKommentar(e.target.value)}
              />
              <button type="button" className="knapp knapp--liten" disabled={skickar} onClick={hanteraSkickaBrist}>
                {skickar ? "Skickar..." : "Skicka"}
              </button>
              <button
                type="button"
                className="knapp knapp--liten knapp--sekundar"
                onClick={() => {
                  setVisaBristformular(false);
                  setBristKommentar("");
                }}
              >
                Avbryt
              </button>
            </div>
          )}
        </div>
      )}

      {(farRedigera || farGodkanna) && (
        <div className="forrad-artikel-kort__atgarder">
          {farRedigera && (
            <button className="knapp knapp--sekundar" onClick={() => onRedigera(artikel)}>
              Redigera
            </button>
          )}
          {farGodkanna && arUtkast && (
            <button className="knapp" onClick={() => onGodkann(artikel.id)}>
              Godkänn
            </button>
          )}
          {farRedigera && (
            <button className="knapp knapp--farlig" onClick={() => onTaBort(artikel.id)}>
              Ta bort
            </button>
          )}
        </div>
      )}
    </article>
  );
}
