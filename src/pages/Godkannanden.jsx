import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDialog } from "../hooks/useDialog";
import { useGodkannandeKo } from "../hooks/useGodkannandeKo";
import { ROLE_LABELS } from "../firebase/roles";
import { OMRADE_NAMN } from "../components/admin/adminHjalp";
import { formateraDatum } from "../utils/datum";
import "./Godkannanden.css";

const OMRADE_ROUTE = { "kliniskt-stod": "/kliniskt-stod", administration: "/administration", logistik: "/logistik" };

// Etapp 42b: en enda, domänöverskridande godkännandekö. Ersätter INTE de befintliga per-
// sektion-godkännandeknapparna (se ETAPPLAN7.md 42b-anteckningen om varför den delen av
// planen medvetet skjuts upp) – det här är ett TILLÄGG: en redaktör som ansvarar för flera
// områden slipper besöka varje sektion för sig för att se vad som väntar.
export default function Godkannanden() {
  const { currentUser, namn } = useAuth();
  const mittNamn = namn || currentUser?.email;
  const { confirm } = useDialog();
  const { utkast, forslag, antal, godkann, taBort } = useGodkannandeKo();

  async function hanteraGodkann(post) {
    await godkann(post, currentUser.uid, mittNamn);
  }

  async function hanteraTaBort(post) {
    if (!(await confirm(`Ta bort "${post.titel}"? Detta går inte att ångra.`))) return;
    await taBort(post, currentUser.uid);
  }

  if (antal === 0) {
    return (
      <div className="sida">
        <Link to="/">← Hem</Link>
        <h1>✅ Godkännanden</h1>
        <p className="sida__beskrivning">Inget väntar på granskning just nu.</p>
      </div>
    );
  }

  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1>✅ Godkännanden ({antal})</h1>
      <p className="sida__beskrivning">
        Allt som väntar på dig, oavsett område – samma godkännande/borttagning som i respektive
        sektion.
      </p>

      {utkast.length > 0 && (
        <section className="admin-sektion">
          <h2>Nya utkast</h2>
          <ul className="godkannanden__lista">
            {utkast.map((post) => (
              <li key={`${post.typ}-${post.id}`} className="godkannanden__post">
                <div className="godkannanden__post-header">
                  <Link to={`${OMRADE_ROUTE[post.omrade]}#rutin-${post.id}`}>{post.titel}</Link>
                  <span className="godkannanden__omrade">{OMRADE_NAMN[post.omrade] ?? post.omrade}</span>
                  {post.skapad && <time>{formateraDatum(post.skapad)}</time>}
                </div>
                {post.innehall && <p className="godkannanden__forhandsvisning">{post.innehall.slice(0, 200)}</p>}
                {post.agare && (
                  <p className="godkannanden__agare">
                    Ansvarig: {post.agare.typ === "roll" ? ROLE_LABELS[post.agare.roll] ?? post.agare.roll : post.agare.namn}
                  </p>
                )}
                {post.taggar?.length > 0 && (
                  <p className="godkannanden__taggar">{post.taggar.join(" · ")}</p>
                )}
                <div className="godkannanden__atgarder">
                  <button type="button" className="knapp knapp--liten" onClick={() => hanteraGodkann(post)}>
                    Godkänn
                  </button>
                  <button type="button" className="knapp knapp--liten knapp--farlig" onClick={() => hanteraTaBort(post)}>
                    Ta bort
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {forslag.length > 0 && (
        <section className="admin-sektion">
          <h2>Väntande ändringsförslag</h2>
          <p className="sida__beskrivning">
            Kräver att ändringen infogas i rutinens text – öppna rutinen i sin sektion för att
            granska och besluta (samma flöde som redan finns där).
          </p>
          <ul className="godkannanden__lista">
            {forslag.map((post) => (
              <li key={`forslag-${post.id}`} className="godkannanden__post">
                <div className="godkannanden__post-header">
                  <Link to={`${OMRADE_ROUTE[post.omrade]}#rutin-${post.rutinId}`}>{post.titel}</Link>
                  <span className="godkannanden__omrade">{OMRADE_NAMN[post.omrade] ?? post.omrade}</span>
                  {post.tidpunkt && <time>{formateraDatum(post.tidpunkt)}</time>}
                </div>
                <p className="godkannanden__forhandsvisning">{post.forslag}</p>
                <p className="godkannanden__agare">Förslag från {post.foreslagenAvNamn || "en anonym kollega"}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
