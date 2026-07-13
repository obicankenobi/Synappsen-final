import { useState } from "react";
import QRCode from "qrcode";
import { RUTIN_STATUS } from "../hooks/useRutiner";
import { useAuth } from "../hooks/useAuth";
import { kvitteraLast } from "../hooks/useLaskvittering";
import { borGranskas, arUtgangen } from "../utils/rutinHjalp";
import FavoritKnapp from "./FavoritKnapp";
import Kommentarer from "./Kommentarer";
import VersionsHistorik from "./VersionsHistorik";
import MarkdownInnehall from "./MarkdownInnehall";
import PrivatAnteckning from "./PrivatAnteckning";
import "./RutinKort.css";

const OMRADE_SOKVAG = {
  "kliniskt-stod": "/kliniskt-stod",
  administration: "/administration",
};

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
  anvandare = [],
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
  const [visaOlasta, setVisaOlasta] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);
  const arUtkast = rutin.status === RUTIN_STATUS.UTKAST;
  const flaggadForGranskning = farRedigera && borGranskas(rutin.granskadDatum);
  const utgangen = farRedigera && arUtgangen(rutin);
  const lasteAv = rutin.lasteAv ?? [];
  const jagHarLast = lasteAv.some((l) => l.uid === currentUser?.uid);
  const relaterade = (rutin.relateradeRutiner ?? [])
    .map((id) => allaRutiner.find((r) => r.id === id))
    .filter(Boolean);
  const oläste = anvandare.filter((a) => !lasteAv.some((l) => l.uid === a.id));

  async function hanteraVisaQr() {
    if (!qrUrl) {
      const lank = `${window.location.origin}${OMRADE_SOKVAG[rutin.omrade] ?? "/"}#rutin-${rutin.id}`;
      setQrUrl(await QRCode.toDataURL(lank));
    } else {
      setQrUrl(null);
    }
  }

  return (
    <article className="rutin-kort" id={`rutin-${rutin.id}`}>
      <header className="rutin-kort__header">
        <h3>{rutin.titel}</h3>
        <div className="rutin-kort__badgar">
          {arUtkast && <span className="rutin-kort__badge">Utkast</span>}
          {flaggadForGranskning && (
            <span className="rutin-kort__badge rutin-kort__badge--varning">Bör granskas</span>
          )}
          {utgangen && <span className="rutin-kort__badge rutin-kort__badge--varning">Utgången</span>}
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

      {rutin.taggar?.length > 0 && (
        <div className="rutin-kort__taggar">
          {rutin.taggar.map((t) => (
            <span key={t} className="rutin-kort__tagg">
              {t}
            </span>
          ))}
        </div>
      )}

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
        {farRedigera && oläste.length > 0 && (
          <button type="button" className="knapp--lank" onClick={() => setVisaOlasta((v) => !v)}>
            {oläste.length} har inte kvitterat
          </button>
        )}
      </div>

      {visaOlasta && (
        <ul className="rutin-kort__olasta-lista">
          {oläste.map((a) => (
            <li key={a.id}>{a.namn || a.email}</li>
          ))}
        </ul>
      )}

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

      <div className="rutin-kort__verktyg">
        <button
          type="button"
          className="knapp knapp--sekundar knapp--liten rutin-kort__skriv-ut"
          onClick={() => skrivUtRutin(rutin.id)}
        >
          🖨️ Skriv ut / PDF
        </button>
        <button type="button" className="knapp knapp--sekundar knapp--liten" onClick={hanteraVisaQr}>
          🔳 QR-kod
        </button>
      </div>

      {qrUrl && (
        <div className="rutin-kort__qr">
          <img src={qrUrl} alt="QR-kod som länkar till rutinen" width={160} height={160} />
          <p className="rutin-kort__qr-hjalptext">Skanna för att öppna rutinen direkt.</p>
        </div>
      )}

      <PrivatAnteckning rutinId={rutin.id} />

      <Kommentarer rutinId={rutin.id} farTaBortAlla={farRedigera} />

      {visaHistorik && (
        <VersionsHistorik
          hamtaVersioner={() => hamtaVersioner(rutin.id)}
          nuvarandeInnehall={rutin.innehall}
          onStang={() => setVisaHistorik(false)}
        />
      )}
    </article>
  );
}
