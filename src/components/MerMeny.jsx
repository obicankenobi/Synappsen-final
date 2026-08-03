import { NavLink } from "react-router-dom";
import "./MerMeny.css";

// Etapp 42f: BottomNav.jsx växte till 9 poster (Sök, Hem, Anslag, Kliniskt, Logistik, Regler,
// Nyheter, Godkänn, Admin) och löste trängseln med overflow-x: auto – funktionellt, men en
// post man måste skrolla fram till är i praktiken osynlig på en smal skärm. De poster som
// inte är en av de fyra vanligaste (Hem/Kliniskt/Logistik/Sök) samlas här i en bottom-sheet
// istället, öppnad via en femte "Mer"-knapp i BottomNav.
export default function MerMeny({ poster, onStang }) {
  return (
    <div className="mer-meny__bakgrund" role="dialog" aria-modal="true" aria-label="Mer" onClick={onStang}>
      <div className="mer-meny" onClick={(e) => e.stopPropagation()}>
        <div className="mer-meny__handtag" aria-hidden="true" />
        <p className="mer-meny__rubrik">Mer</p>
        <div className="mer-meny__rutnat">
          {poster.map((post) => (
            <NavLink key={post.till} to={post.till} className="mer-meny__post" onClick={onStang}>
              <span className="mer-meny__ikon" aria-hidden="true">{post.ikon}</span>
              <span>{post.namn}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
