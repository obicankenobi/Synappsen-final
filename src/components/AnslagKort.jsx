import MarkdownInnehall from "./MarkdownInnehall";
import { ANSLAG_PRIORITET } from "../hooks/useAnslag";
import "./AnslagKort.css";

function formateraTid(tidpunkt) {
  if (!tidpunkt?.toDate) return "";
  return tidpunkt.toDate().toLocaleDateString("sv-SE", { dateStyle: "medium" });
}

export default function AnslagKort({ anslag, farHantera, onRedigera, onTaBort }) {
  const arViktigt = anslag.prioritet === ANSLAG_PRIORITET.VIKTIGT;
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
