import { useState } from "react";
import { RUTIN_STATUS } from "../hooks/useRutiner";
import { useAuth } from "../hooks/useAuth";
import { kvitteraLast } from "../hooks/useLaskvittering";
import FavoritKnapp from "./FavoritKnapp";
import Kommentarer from "./Kommentarer";
import VersionsHistorik from "./VersionsHistorik";
import MarkdownInnehall from "./MarkdownInnehall";
import PrivatAnteckning from "./PrivatAnteckning";
import "./RutinKort.css";

const GRANSKNINGSINTERVALL_DAGAR = 180;

function borGranskas(granskadDatum) {
  if (!granskadDatum?.toDate) return false;
  const granslinje = new Date();
  granslinje.setDate(granslinje.getDate() - GRANSKNINGSINTERVALL_DAGAR);
  return granskadDatum.toDate() < granslinje;
}

function formateraTid(tidpunkt) {
  if (!tidpunkt?.toDate) return "";
  return tidpunkt.toDate().toLocaleDateString("sv-SE", { dateStyle: "medium" });
}

function skrivUtRutin(rutinId) {
  document.querySelectorAll(".rutin-kort--utskrift").forEach((el) => el.classList.remove("rutin-kort--utskrift"));
  document.getElementById(`rutin-${rutinId}`)?.classList.add("rutin-kort--utskrift");
  document.body.classList.add("utskrift-lage");
  window.print();
  window.addEventListener(
    "afterprint",
    () => document.body.classList.remove("utskrift-lage"),
    { once: true }
  );
}

export default function RutinKort({
  rutin,
  allaRutiner = [],
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
  const relaterade = (rutin.relateradeRutiner ?? [])
    .map((id) => allaRutiner.find((r) => r.id === id))
    .filter(Boolean);

  return (
    <article className="rutin-kort" id={`rutin-${rutin.id}`}>
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

      {(rutin.godkandAvNamn || rutin.granskadAvNamn) && (
        <div className="rutin-kort__signatur">
          {rutin.godkandAvNamn && (
            <span>
              Godkänd av {rutin.godkandAvNamn}
              {rutin.godkandDatum && ` · ${formateraTid(rutin.godkandDatum)}`}
            </span>
          )}
          {rutin.granskadAvNamn && (
            <span>
              Senast granskad av {rutin.granskadAvNamn}
              {rutin.granskadDatum && ` · ${formateraTid(rutin.granskadDatum)}`}
            </span>
          )}
        </div>
      )}

      {/* bildUrl är kvar för bakåtkompatibilitet med rutiner skapade innan bilagor (fas 5) */}
      {rutin.bildUrl && !rutin.bilagor?.length && (
        <img className="rutin-kort__bild" src={rutin.bildUrl} alt="" />
      )}
      {rutin.bilagor?.length > 0 && (
        <div className="rutin-kort__bilagor">
          {rutin.bilagor.map((b, i) =>
            b.typ === "dokument" ? (
              <a key={i} href={b.url} target="_blank" rel="noreferrer" className="rutin-kort__dokument">
                📎 {b.namn ?? "Bilaga"}
              </a>
            ) : (
              <img key={i} className="rutin-kort__bild" src={b.url} alt="" />
            )
          )}
        </div>
      )}
      <MarkdownInnehall className="rutin-kort__innehall" text={rutin.innehall} />

      {rutin.referenser && (
        <p className="rutin-kort__referenser">
          <strong>Referenser:</strong> {rutin.referenser}
        </p>
      )}

      {relaterade.length > 0 && (
        <div className="rutin-kort__relaterade">
          <strong>Se även:</strong>{" "}
          {relaterade.map((r, i) => (
            <span key={r.id}>
              {i > 0 && ", "}
              <a href={`#rutin-${r.id}`}>{r.titel}</a>
            </span>
          ))}
        </div>
      )}

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

      <button
        type="button"
        className="knapp knapp--sekundar knapp--liten rutin-kort__skriv-ut"
        onClick={() => skrivUtRutin(rutin.id)}
      >
        🖨️ Skriv ut / PDF
      </button>

      <PrivatAnteckning rutinId={rutin.id} />

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
