import { useState } from "react";
import { RUTIN_STATUS } from "../hooks/useRutiner";
import { useAuth } from "../hooks/useAuth";
import { kvitteraLast } from "../hooks/useLaskvittering";
import FavoritKnapp from "./FavoritKnapp";
import Kommentarer from "./Kommentarer";
import VersionsHistorik from "./VersionsHistorik";
import MarkdownInnehall from "./MarkdownInnehall";
import "./RutinKort.css";

const GRANSKNINGSINTERVALL_DAGAR = 180;

function borGranskas(granskadDatum) {
  if (!granskadDatum?.toDate) return false;
  const granslinje = new Date();
  granslinje.setDate(granslinje.getDate() - GRANSKNINGSINTERVALL_DAGAR);
  return granskadDatum.toDate() < granslinje;
}

export default function RutinKort({
  rutin,
  farRedigera,
  farGodkanna,
  onRedigera,
  onGodkann,
  onTaBort,
  onMarkeraGranskad,
  hamtaVersioner,
}) {
  const { currentUser } = useAuth();
  const [visaHistorik, setVisaHistorik] = useState(false);
  const arUtkast = rutin.status === RUTIN_STATUS.UTKAST;
  const flaggadForGranskning = farRedigera && borGranskas(rutin.granskadDatum);
  const lasteAv = rutin.lasteAv ?? [];
  const jagHarLast = lasteAv.some((l) => l.uid === currentUser?.uid);

  return (
    <article className="rutin-kort">
      <header className="rutin-kort__header">
        <h3>{rutin.titel}</h3>
        <div className="rutin-kort__badgar">
          {arUtkast && <span className="rutin-kort__badge">Utkast</span>}
          {flaggadForGranskning && (
            <span className="rutin-kort__badge rutin-kort__badge--varning">Bör granskas</span>
          )}
        </div>
        <FavoritKnapp typ="rutin" id={rutin.id} />
      </header>
      {rutin.bildUrl && (
        <img className="rutin-kort__bild" src={rutin.bildUrl} alt="" />
      )}
      <MarkdownInnehall className="rutin-kort__innehall" text={rutin.innehall} />

      <div className="rutin-kort__laskvittering">
        <button
          type="button"
          className="knapp knapp--sekundar knapp--liten"
          disabled={jagHarLast}
          onClick={() => kvitteraLast(rutin.id, currentUser.uid, currentUser.email)}
        >
          {jagHarLast ? "✓ Du har läst detta" : "Jag har läst och förstått"}
        </button>
        {farRedigera && lasteAv.length > 0 && (
          <span className="rutin-kort__last-antal" title={lasteAv.map((l) => l.namn).join(", ")}>
            {lasteAv.length} har kvitterat
          </span>
        )}
      </div>

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
          {farRedigera && (
            <button className="knapp knapp--sekundar" onClick={() => onMarkeraGranskad(rutin.id)}>
              Markera som granskad
            </button>
          )}
          {farRedigera && (
            <button className="knapp knapp--sekundar" onClick={() => setVisaHistorik(true)}>
              Visa historik
            </button>
          )}
        </div>
      )}

      <Kommentarer rutinId={rutin.id} farTaBortAlla={farRedigera} />

      {visaHistorik && (
        <VersionsHistorik
          hamtaVersioner={() => hamtaVersioner(rutin.id)}
          onStang={() => setVisaHistorik(false)}
        />
      )}
    </article>
  );
}
