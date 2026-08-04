import { useInstallBanner } from "../hooks/useInstallBanner";
import "./InstalleraAppBanner.css";

// Etapp 44a: en egen, avvisningsbar installationsuppmaning – webbläsarens egen diskreta
// installationsikon (Chrome/Edge-adressfältet) missas lätt av de flesta. iOS Safari avfyrar
// aldrig beforeinstallprompt, så där visas en instruktion istället för en (falsk) knapp.
export default function InstalleraAppBanner() {
  const banner = useInstallBanner();

  if (!banner.visaBanner) return null;

  return (
    <div className="installera-app-banner" role="status">
      {banner.typ === "installera" ? (
        <>
          <span>Lägg till Synappsen på hemskärmen för snabbare åtkomst.</span>
          <button type="button" className="installera-app-banner__knapp" onClick={banner.installera}>
            Installera
          </button>
        </>
      ) : (
        <span>
          Lägg till Synappsen på hemskärmen: tryck <strong>Dela</strong> ⬆️ och sedan{" "}
          <strong>Lägg till på hemskärmen</strong>.
        </span>
      )}
      <button
        type="button"
        className="installera-app-banner__stang"
        onClick={banner.dolj}
        aria-label="Stäng"
      >
        ✕
      </button>
    </div>
  );
}
