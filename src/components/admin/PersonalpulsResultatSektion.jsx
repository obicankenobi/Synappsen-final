import { usePersonalpulsResultat } from "../../hooks/usePersonalpulsResultat";
import { OMRADE_NAMN } from "./adminHjalp";

const MINSTA_ANTAL_SVAR = 5;

const FRAGOR = [
  "Hittar du det du söker i appen när du behöver det?",
  "Litar du på att informationen i rutinerna är uppdaterad?",
  "Skulle du sakna appen om den försvann imorgon?",
];

function Kvartalsrad({ post }) {
  if (post.antalSvar < MINSTA_ANTAL_SVAR) {
    return (
      <li>
        <strong>{post.kvartal}</strong> – färre än {MINSTA_ANTAL_SVAR} svar ({post.antalSvar}), visas
        inte (krav 14: minsta-n-spärr).
      </li>
    );
  }
  const snitt = [post.summaFraga1, post.summaFraga2, post.summaFraga3].map((s) =>
    (s / post.antalSvar).toFixed(1)
  );
  return (
    <li>
      <strong>{post.kvartal}</strong> – {post.antalSvar} svar
      <ul className="admin-statistik-lista">
        {FRAGOR.map((fraga, i) => (
          <li key={fraga}>
            {fraga} <span>snitt {snitt[i]} av 5</span>
          </li>
        ))}
      </ul>
    </li>
  );
}

// Etapp 39c: läser det aggregerade resultatet – aldrig ett enskilt svar (finns inte att läsa,
// se functions/index.js svaraPersonalpuls). Ägarbeslut 2026-08-02: VÖL/sektionsledare läser
// kliniskt-stod, VEC läser administration, superadmin läser alla områden.
export default function PersonalpulsResultatSektion({ endastOmrade }) {
  const { resultat } = usePersonalpulsResultat(endastOmrade);

  const grupperat = endastOmrade
    ? { [endastOmrade]: resultat }
    : resultat.reduce((acc, post) => {
        (acc[post.omrade] ??= []).push(post);
        return acc;
      }, {});

  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2><span aria-hidden="true">💬</span> Personalpulsen</h2></summary>
      <p className="sida__beskrivning">
        Anonym, aggregerad – aldrig ett enskilt svar. Ett kvartal med färre än{" "}
        {MINSTA_ANTAL_SVAR} svar visas inte alls, även om siffran finns lagrad (krav 14).
      </p>
      {Object.keys(grupperat).length === 0 && (
        <p className="sida__beskrivning">Inga svar ännu.</p>
      )}
      {Object.entries(grupperat).map(([omrade, poster]) =>
        poster.length === 0 ? null : (
          <div key={omrade}>
            <h3>{OMRADE_NAMN[omrade] ?? omrade}</h3>
            <ul className="admin-lista">
              {poster.map((post) => (
                <Kvartalsrad key={post.id} post={post} />
              ))}
            </ul>
          </div>
        )
      )}
    </details>
  );
}
