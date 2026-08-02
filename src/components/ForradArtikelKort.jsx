import { useState } from "react";
import { ARTIKEL_STATUS } from "../hooks/useForradsartiklar";
import { kontrolleraPatientuppgifter } from "../utils/piiFilter";
import { useDialog } from "../hooks/useDialog";
import FavoritKnapp from "./FavoritKnapp";
import { StatusBadge } from "./Badge";
import "./ForradArtikelKort.css";

export default function ForradArtikelKort({
  artikel,
  farRedigera,
  farGodkanna,
  onRedigera,
  onGodkann,
  onTaBort,
  onAnmalBrist,
  markerad = false,
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
    <article
      id={`artikel-${artikel.id}`}
      className={`forrad-artikel-kort${markerad ? " forrad-artikel-kort--markerad" : ""}`}
    >
      {artikel.bildUrl && (
        <img className="forrad-artikel-kort__bild" src={artikel.bildUrl} alt="" />
      )}
      <div className="forrad-artikel-kort__info">
        <header className="forrad-artikel-kort__header">
          <div className="forrad-artikel-kort__titelrad">
            <h3>{artikel.namn}</h3>
            {arUtkast && <StatusBadge status="vantar" />}
          </div>
          <FavoritKnapp typ="artikel" id={artikel.id} />
        </header>
        {/* 27c: tydlig väg ("Förråd → Skåp → Hylla") istället för en textrad utan sammanhang */}
        <p className="forrad-artikel-kort__plats">
          {artikel.forrad}
          {artikel.skap && <> → Skåp {artikel.skap}</>}
          {artikel.hylla && <> → Hylla {artikel.hylla}</>}
          {!artikel.skap && !artikel.hylla && " → plats ej angiven"}
        </p>
        {/* Etapp 41c: foto på hyllplatsen (skilt från artikel.bildUrl, som visar artikeln
            själv) – "hitta på fem sekunder" blir bokstavligt för en vikarie. */}
        {artikel.hyllfotoUrl && (
          <img
            className="forrad-artikel-kort__hyllfoto"
            src={artikel.hyllfotoUrl}
            alt="Foto på hyllplatsen"
          />
        )}
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
