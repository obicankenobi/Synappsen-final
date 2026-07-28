import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSokindex } from "../hooks/useSokindex";
import { useAuth } from "../hooks/useAuth";
import { useSenastBesokta } from "../hooks/useSenastBesokta";
import { useMinaFavoritPoster } from "../hooks/useMinaFavoritPoster";
import { usePopularaste, registreraVisning } from "../hooks/useVisningar";
import { DomanBadge } from "./Badge";
import { domanNyckelForEtikett } from "../utils/badge";
import "./KommandopalettInnehall.css";

// Etapp 23a-c: det tunga innehållet i kommandopaletten (Fuse.js-sökmotorn,
// favoriter/senast besökta/populärast) – lazy-laddat av KommandopalettLyssnare.jsx först när
// paletten faktiskt öppnas första gången, så Ctrl/Cmd+K/"/" fungerar direkt utan att tynga
// ner startladdningen för alla (genomgående krav 9, ETAPPLAN4.md). Återanvänder samma
// sökmotor som SokFalt.jsx (useSokindex, Etapp 23a) – ingen parallell sökmotor byggs här.
export default function KommandopalettInnehall({ onStang }) {
  const { fuse } = useSokindex();
  const { currentUser, organisationId } = useAuth();
  const { senastBesokta } = useSenastBesokta(currentUser?.uid);
  const favoritPoster = useMinaFavoritPoster();
  const populara = usePopularaste(5);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [sokterm, setSokterm] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function stang() {
    onStang();
    setSokterm("");
  }

  function hanteraNavigera(post) {
    registreraVisning(post.titel, post.sokvag, organisationId);
    navigate(post.sokvag);
    stang();
  }

  function hanteraFaltTangent(e) {
    if (e.key === "Escape") {
      stang();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      document.querySelector(".kommandopalett__resultat button")?.focus();
    }
  }

  function hanteraResultatTangent(e, index, knapplista) {
    const knappar = Array.from(document.querySelectorAll(knapplista));
    if (e.key === "ArrowDown") {
      e.preventDefault();
      knappar[index + 1]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (index === 0) inputRef.current?.focus();
      else knappar[index - 1]?.focus();
    } else if (e.key === "Escape") {
      stang();
    }
  }

  const traffar = sokterm.trim() ? fuse.search(sokterm).map((r) => r.item) : [];

  return (
    <div className="kommandopalett__bakgrund" onClick={stang}>
      <div
        className="kommandopalett"
        role="dialog"
        aria-modal="true"
        aria-label="Kommandopalett"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="search"
          className="kommandopalett__falt"
          placeholder="Sök rutin, diagnos eller nyckelord – eller kör en åtgärd..."
          value={sokterm}
          onChange={(e) => setSokterm(e.target.value)}
          onKeyDown={hanteraFaltTangent}
          aria-label="Sök i kunskapsbanken eller kör en åtgärd"
        />

        {sokterm.trim() ? (
          <ul className="kommandopalett__resultat" role="listbox">
            {traffar.length === 0 && <li className="kommandopalett__tomt">Inga träffar.</li>}
            {traffar.map((post, i) => (
              <li key={`${post.titel}-${i}`} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => hanteraNavigera(post)}
                  onKeyDown={(e) => hanteraResultatTangent(e, i, ".kommandopalett__resultat button")}
                >
                  <span className="kommandopalett__titel">{post.titel}</span>
                  <span className="kommandopalett__meta">
                    <DomanBadge nyckel={domanNyckelForEtikett(post.kategori)} etikett={post.kategori} />
                    {post.plats && <span className="kommandopalett__plats">{post.plats}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="kommandopalett__forslag">
            {favoritPoster.length > 0 && (
              <section>
                <h3>⭐ Favoriter</h3>
                <ul className="kommandopalett__resultat" role="listbox">
                  {favoritPoster.map((p, i) => (
                    <li key={`favorit-${i}`} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected="false"
                        onClick={() => hanteraNavigera(p)}
                        onKeyDown={(e) => hanteraResultatTangent(e, i, ".kommandopalett__forslag .kommandopalett__resultat button")}
                      >
                        <span className="kommandopalett__titel">{p.titel}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {senastBesokta.length > 0 && (
              <section>
                <h3>🕓 Senast besökta</h3>
                <ul className="kommandopalett__resultat" role="listbox">
                  {senastBesokta.slice(0, 5).map((p, i) => (
                    <li key={`senast-${i}`} role="presentation">
                      <button type="button" role="option" aria-selected="false" onClick={() => hanteraNavigera(p)}>
                        <span className="kommandopalett__titel">{p.titel}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {populara.length > 0 && (
              <section>
                <h3>🔥 Populärast</h3>
                <ul className="kommandopalett__resultat" role="listbox">
                  {populara.map((p) => (
                    <li key={p.id} role="presentation">
                      <button type="button" role="option" aria-selected="false" onClick={() => hanteraNavigera(p)}>
                        <span className="kommandopalett__titel">{p.titel}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {favoritPoster.length === 0 && senastBesokta.length === 0 && populara.length === 0 && (
              <p className="kommandopalett__tomt">Börja skriva för att söka, eller kör en åtgärd.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
