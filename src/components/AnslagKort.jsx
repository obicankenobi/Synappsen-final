import MarkdownInnehall from "./MarkdownInnehall";
import { ANSLAG_PRIORITET } from "../hooks/useAnslag";
import { kvitteraLastAnslag } from "../hooks/useLaskvittering";
import { useAuth } from "../hooks/useAuth";
import "./AnslagKort.css";

function formateraTid(tidpunkt) {
  if (!tidpunkt?.toDate) return "";
  return tidpunkt.toDate().toLocaleDateString("sv-SE", { dateStyle: "medium" });
}

export default function AnslagKort({ anslag, farHantera, anvandare = [], onRedigera, onTaBort }) {
  const { currentUser } = useAuth();
  const arViktigt = anslag.prioritet === ANSLAG_PRIORITET.VIKTIGT;
  const lasteAv = anslag.lasteAv ?? [];
  const jagHarLast = lasteAv.some((l) => l.uid === currentUser?.uid);

  const fristPasserad = anslag.kvitteringsfrist && new Date(anslag.kvitteringsfrist) < new Date();
  const ejKvitterat = anvandare.filter((a) => !lasteAv.some((l) => l.uid === a.id));

  return (
    <article
      className={`anslag-kort ${anslag.fastNaglad ? "anslag-kort--fastnaglad" : ""} ${
        arViktigt ? "anslag-kort--viktigt" : ""
      }`}
    >
      <header className="anslag-kort__header">
        <h3>
          {anslag.fastNaglad && "📌 "}
          {arViktigt && "⚠️ "}
          {anslag.titel}
        </h3>
        <span className="anslag-kort__datum">{formateraTid(anslag.skapad)}</span>
      </header>
      <MarkdownInnehall className="anslag-kort__innehall" text={anslag.innehall} />
      <div className="anslag-kort__meta">Av {anslag.skapadAvNamn}</div>

      {anslag.kvitteringsfrist && (
        <div className={`anslag-kort__frist ${fristPasserad ? "anslag-kort__frist--passerad" : ""}`}>
          {jagHarLast
            ? `Kvittering krävdes senast ${anslag.kvitteringsfrist}`
            : `⏰ Kräver kvittering senast ${anslag.kvitteringsfrist}${fristPasserad ? " – frist passerad" : ""}`}
        </div>
      )}

      <div className="anslag-kort__laskvittering">
        <button
          type="button"
          className="knapp knapp--sekundar knapp--liten"
          disabled={jagHarLast}
          onClick={() => kvitteraLastAnslag(anslag.id, currentUser.uid, currentUser.email)}
        >
          {jagHarLast ? "✓ Du har läst detta" : "Jag har läst"}
        </button>
        {farHantera && lasteAv.length > 0 && (
          <span className="anslag-kort__last-antal" title={lasteAv.map((l) => l.namn).join(", ")}>
            {lasteAv.length} har kvitterat
          </span>
        )}
        {farHantera && anslag.kvitteringsfrist && ejKvitterat.length > 0 && (
          <span
            className="anslag-kort__last-antal"
            title={ejKvitterat.map((a) => a.namn ?? a.email).join(", ")}
          >
            {ejKvitterat.length} har INTE kvitterat än
          </span>
        )}
      </div>

      {farHantera && (
        <div className="anslag-kort__atgarder">
          <button className="knapp knapp--sekundar knapp--liten" onClick={() => onRedigera(anslag)}>
            Redigera
          </button>
          <button className="knapp knapp--farlig knapp--liten" onClick={() => onTaBort(anslag.id)}>
            Ta bort
          </button>
        </div>
      )}
    </article>
  );
}
