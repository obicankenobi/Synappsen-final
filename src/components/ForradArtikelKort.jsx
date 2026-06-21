import { ARTIKEL_STATUS } from "../hooks/useForradsartiklar";
import "./ForradArtikelKort.css";

export default function ForradArtikelKort({
  artikel,
  farRedigera,
  farGodkanna,
  onRedigera,
  onGodkann,
  onTaBort,
}) {
  const arUtkast = artikel.status === ARTIKEL_STATUS.UTKAST;

  return (
    <article className="forrad-artikel-kort">
      {artikel.bildUrl && (
        <img className="forrad-artikel-kort__bild" src={artikel.bildUrl} alt="" />
      )}
      <div className="forrad-artikel-kort__info">
        <header className="forrad-artikel-kort__header">
          <h3>{artikel.namn}</h3>
          {arUtkast && <span className="forrad-artikel-kort__badge">Utkast</span>}
        </header>
        <p className="forrad-artikel-kort__plats">
          {artikel.skap ? `Skåp ${artikel.skap}` : "Skåp ej angivet"}
          {" · "}
          {artikel.hylla ? `Hylla ${artikel.hylla}` : "Hylla ej angiven"}
        </p>
        {artikel.antal && <p className="forrad-artikel-kort__antal">Antal: {artikel.antal}</p>}
      </div>
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
