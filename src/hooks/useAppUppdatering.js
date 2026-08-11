import { useEffect, useState } from "react";
import { registerSW } from "virtual:pwa-register";

// Etapp 44c: registrerar service workern EN gång per sidladdning (modulscope, inte i
// komponenten – annars skulle varje omrendering av en anropande komponent registrera på
// nytt). `registerType: 'prompt'` i vite.config.js gör att en ny, väntande service worker
// ALDRIG aktiverar sig själv – bara `uppdatera()` nedan (anropad från en knapptryckning i
// AppUppdateringBanner.jsx) skickar skip-waiting-meddelandet.
let uppdateraServiceWorker;
let behoverUppdateringLyssnare = [];

function notifieraBehoverUppdatering() {
  for (const lyssnare of behoverUppdateringLyssnare) lyssnare();
}

// Hur ofta en redan öppen app frågar servern om det finns en ny version. Webbläsaren gör
// den kontrollen SPONTANT bara vid sidladdning/navigering – en app som körs i standalone-
// eller kiosk-läge på en avdelningsdator kan stå öppen i veckor utan att någonsin ladda om,
// och skulle utan den här timern kunna visa en månadsgammal build av en medicinsk
// rutindatabas utan att någon märker det. Se ETAPPLAN4.md Etapp 24a/44c.
const UPPDATERINGSKONTROLL_INTERVALL_MS = 30 * 60 * 1000;

async function kontrolleraNyVersion(registrering) {
  if (!registrering || !navigator.onLine) return;
  try {
    await registrering.update();
  } catch {
    // Nätet kan ha försvunnit mellan onLine-kontrollen och anropet, eller servern svarar
    // med ett fel. Nästa intervall försöker igen – ett misslyckat försök ska aldrig
    // påverka appen som körs.
  }
}

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  uppdateraServiceWorker = registerSW({
    onNeedRefresh() {
      notifieraBehoverUppdatering();
    },
    onRegisteredSW(_swUrl, registrering) {
      if (!registrering) return;
      setInterval(() => kontrolleraNyVersion(registrering), UPPDATERINGSKONTROLL_INTERVALL_MS);
      // Kontrollera också när appen kommer i förgrunden igen eller nätet kommer tillbaka –
      // en enhet som legat i viloläge över natten hinner inte till nästa intervalltick
      // förrän någon redan hunnit läsa en gammal rutin.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") kontrolleraNyVersion(registrering);
      });
      window.addEventListener("online", () => kontrolleraNyVersion(registrering));
    },
  });
}

export function useAppUppdatering() {
  const [behoverUppdatering, setBehoverUppdatering] = useState(false);

  useEffect(() => {
    const lyssnare = () => setBehoverUppdatering(true);
    behoverUppdateringLyssnare.push(lyssnare);
    return () => {
      behoverUppdateringLyssnare = behoverUppdateringLyssnare.filter((l) => l !== lyssnare);
    };
  }, []);

  return {
    behoverUppdatering,
    uppdatera: () => uppdateraServiceWorker?.(true),
  };
}
