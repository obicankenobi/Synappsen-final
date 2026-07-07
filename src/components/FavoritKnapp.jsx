import { useAuth } from "../hooks/useAuth";
import { useFavoriter } from "../hooks/useFavoriter";
import "./FavoritKnapp.css";

// typ: "rutin" eller "artikel"
export default function FavoritKnapp({ typ, id }) {
  const { currentUser } = useAuth();
  const { arFavorit, laggTillFavorit, taBortFavorit } = useFavoriter(currentUser?.uid);
  const aktiv = arFavorit(typ, id);

  function hanteraKlick() {
    if (aktiv) {
      taBortFavorit(typ, id);
    } else {
      laggTillFavorit(typ, id);
    }
  }

  return (
    <button
      type="button"
      className={`favorit-knapp ${aktiv ? "favorit-knapp--aktiv" : ""}`}
      onClick={hanteraKlick}
      aria-label={aktiv ? "Ta bort favorit" : "Lägg till favorit"}
      title={aktiv ? "Ta bort favorit" : "Lägg till favorit"}
    >
      {aktiv ? "★" : "☆"}
    </button>
  );
}
