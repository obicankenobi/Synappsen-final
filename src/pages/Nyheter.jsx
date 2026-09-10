import { Link } from "react-router-dom";
import { APP_VERSION } from "../version";
import { ANDRINGSLOGG } from "../data/andringslogg";
import NiSaViGjorde from "../components/NiSaViGjorde";
import "./Nyheter.css";

export default function Nyheter() {
  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1><span aria-hidden="true">🆕</span> Nyheter</h1>
      <p className="sida__beskrivning">
        Aktuell version: <strong>{APP_VERSION}</strong>. Här listas vad som ändrats i varje
        uppdatering av Synappsen.
      </p>

      <NiSaViGjorde />

      {ANDRINGSLOGG.map((post) => (
        <article key={post.version} className="nyheter-post">
          <header className="nyheter-post__header">
            <h2>Version {post.version}</h2>
            <time className="nyheter-post__datum">{post.datum}</time>
          </header>
          <ul>
            {post.andringar.map((rad, i) => (
              <li key={i}>{rad}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
