import { RUTIN_STATUS } from "../hooks/useRutiner";
import "./RutinKort.css";

export default function RutinKort({
  rutin,
  farRedigera,
  farGodkanna,
  onRedigera,
  onGodkann,
  onTaBort,
}) {
  const arUtkast = rutin.status === RUTIN_STATUS.UTKAST;

  return (
    <article className="rutin-kort">
      <header className="rutin-kort__header">
        <h3>{rutin.titel}</h3>
        {arUtkast && <span className="rutin-kort__badge">Utkast</span>}
      </header>
      {rutin.bildUrl && (
        <img className="rutin-kort__bild" src={rutin.bildUrl} alt="" />
      )}
      <p className="rutin-kort__innehall">{rutin.innehall}</p>
      {(farRedigera || farGodkanna) && (
        <div className="rutin-kort__atgarder">
          {farRedigera && (
            <button className="knapp knapp--sekundar" onClick={() => onRedigera(rutin)}>
              Redigera
            </button>
          )}
          {farGodkanna && arUtkast && (
            <button className="knapp" onClick={() => onGodkann(rutin.id)}>
              Godkänn
            </button>
          )}
          {farRedigera && (
            <button className="knapp knapp--farlig" onClick={() => onTaBort(rutin.id)}>
              Ta bort
            </button>
          )}
        </div>
      )}
    </article>
  );
}
