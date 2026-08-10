import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import "./MerMeny.css";

// Etapp 42f: BottomNav.jsx växte till 9 poster (Sök, Hem, Anslag, Kliniskt, Logistik, Regler,
// Nyheter, Godkänn, Admin) och löste trängseln med overflow-x: auto – funktionellt, men en
// post man måste skrolla fram till är i praktiken osynlig på en smal skärm. De poster som
// inte är en av de fyra vanligaste (Hem/Kliniskt/Logistik/Sök) samlas här i en bottom-sheet
// istället, öppnad via en femte "Mer"-knapp i BottomNav.
export default function MerMeny({ poster, onStang }) {
  const rutaRef = useRef(null);
  const senasteFokusRef = useRef(null);

  // Etapp 45c: samma Esc/fokusfångst/återlämning-mönster som DialogProvider.jsx redan
  // använder för bekräftelsedialogen (Etapp 13g) – MerMeny fick aldrig samma behandling när
  // den byggdes i Etapp 42f, trots att den också är role="dialog" aria-modal="true". Ett
  // element som PÅSTÅR sig vara en modal dialog för hjälpmedel men inte beter sig som en
  // (Tab läcker ut till bakgrunden, Esc gör inget) är värre än att inte påstå det alls.
  useEffect(() => {
    senasteFokusRef.current = document.activeElement;
    const forstaLanken = rutaRef.current?.querySelector("a, button");
    forstaLanken?.focus();

    function hanteraTangent(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onStang();
        return;
      }
      if (e.key !== "Tab" || !rutaRef.current) return;
      const fokuserbara = rutaRef.current.querySelectorAll("a, button");
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

  return (
    <div className="mer-meny__bakgrund" role="dialog" aria-modal="true" aria-label="Mer" onClick={onStang}>
      <div className="mer-meny" ref={rutaRef} onClick={(e) => e.stopPropagation()}>
        <div className="mer-meny__handtag" aria-hidden="true" />
        <p className="mer-meny__rubrik">Mer</p>
        <div className="mer-meny__rutnat">
          {poster.map((post) =>
            // Etapp 55b: kioskläget behöver en post som öppnar en PIN-dialog istället för att
            // navigera till en länk ("Lämna kioskläge") – samma post-form, bara en klickbar
            // knapp istället för en NavLink när onKlick anges.
            post.onKlick ? (
              <button
                key={post.namn}
                type="button"
                className="mer-meny__post"
                onClick={() => {
                  onStang();
                  post.onKlick();
                }}
              >
                <span className="mer-meny__ikon" aria-hidden="true">{post.ikon}</span>
                <span>{post.namn}</span>
              </button>
            ) : (
              <NavLink key={post.till} to={post.till} className="mer-meny__post" onClick={onStang}>
                <span className="mer-meny__ikon" aria-hidden="true">{post.ikon}</span>
                <span>{post.namn}</span>
              </NavLink>
            )
          )}
        </div>
      </div>
    </div>
  );
}
