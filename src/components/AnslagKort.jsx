import MarkdownInnehall from "./MarkdownInnehall";
import { ANSLAG_PRIORITET } from "../hooks/useAnslag";
import { kvitteraLastAnslag } from "../hooks/useLaskvittering";
import { useAuth } from "../hooks/useAuth";
import "./AnslagKort.css";

function formateraTid(tidpunkt) {
  if (!tidpunkt?.toDate) return "";
  return tidpunkt.toDate().toLocaleDateString("sv-SE", { dateStyle: "medium" });
}

export default function AnslagKort({ anslag, farHantera, onRedigera, onTaBort }) {
  const { currentUser } = useAuth();
  const arViktigt = anslag.prioritet === ANSLAG_PRIORITET.VIKTIGT;
  const lasteAv = anslag.lasteAv ?? [];
  const jagHarLast = lasteAv.some((l) => l.uid === currentUser?.uid);

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
