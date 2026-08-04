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

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  uppdateraServiceWorker = registerSW({
    onNeedRefresh() {
      notifieraBehoverUppdatering();
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
