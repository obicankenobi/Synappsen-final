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
  const rutaRef = useRef(null);
  const senasteFokusRef = useRef(null);
  const [sokterm, setSokterm] = useState("");

  // Tillgänglighet: paletten är `role="dialog" aria-modal="true"` men saknade det
  // Esc/fokusfångst/återlämning-mönster som DialogProvider.jsx (Etapp 13g) och MerMeny.jsx
  // (Etapp 45c) redan använder. Esc fanns bara på sökfältet och på träfflistans knappar –
  // knapparna under "Senast besökta"/"Populärast" saknade den helt, och Tab kunde vandra ut
  // i bakgrundsinnehållet bakom en dialog som påstår sig vara modal (WCAG 2.1.2, 2.4.3).
  useEffect(() => {
    senasteFokusRef.current = document.activeElement;
    inputRef.current?.focus();

    function hanteraTangent(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onStang();
        return;
      }
      if (e.key !== "Tab" || !rutaRef.current) return;
      const fokuserbara = rutaRef.current.querySelectorAll("a, button, input, select, textarea");
      if (fokuserbara.length === 0) return;
      const forsta = fokuserbara[0];
      const sista = fokuserbara[fokuserbara.length - 1];
      if (e.shiftKey && document.activeElement === forsta) {
        e.preventDefault();
        sista.focus();
      } else if (!e.shiftKey && document.activeElement === sista) {
        e.preventDefault();
        forsta.focus();
      }
    }

    document.addEventListener("keydown", hanteraTangent);
    return () => {
      document.removeEventListener("keydown", hanteraTangent);
      senasteFokusRef.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ska bara köras vid montering/avmontering
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
        ref={rutaRef}
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

        {/* Sökresultaten byttes ut tyst medan fokus låg kvar i fältet – en skärmläsare fick
            ingen signal om att antalet träffar ändrats (WCAG 4.1.3 Statusmeddelanden). */}
        <p className="sr-only" role="status" aria-live="polite">
          {sokterm.trim() ? `${traffar.length} träffar` : ""}
        </p>

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
                <h3><span aria-hidden="true">⭐</span> Favoriter</h3>
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
                <h3><span aria-hidden="true">🕓</span> Senast besökta</h3>
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
                <h3><span aria-hidden="true">🔥</span> Populärast</h3>
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
