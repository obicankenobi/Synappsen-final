import { useAppUppdatering } from "../hooks/useAppUppdatering";
import "./AppUppdateringBanner.css";

// Etapp 44c: ersätter den tidigare tysta window.location.reload()-omladdningen (se
// vite.config.js) med en synlig, användarstyrd uppdatering – laddar aldrig om utan att
// användaren själv klickat, så en pågående arbetssession (t.ex. ett halvifyllt formulär)
// aldrig avbryts oanmält av en deploy.
export default function AppUppdateringBanner() {
  const { behoverUppdatering, uppdatera } = useAppUppdatering();

  if (!behoverUppdatering) return null;

  return (
    <div className="app-uppdatering-banner" role="status">
      <span>En ny version av Synappsen är redo.</span>
      <button type="button" className="app-uppdatering-banner__knapp" onClick={uppdatera}>
        Uppdatera
      </button>
    </div>
  );
}
