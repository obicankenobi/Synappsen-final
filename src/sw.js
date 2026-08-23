// Etapp 24a: egen service worker-källa, byggd av Vite via vite-plugin-pwas
// injectManifest-läge (se vite.config.js) istället för den tidigare auto-genererade
// (generateSW). Skälet är att Vite/Rollup då faktiskt bearbetar den här filen, vilket gör
// att import.meta.env.VITE_FIREBASE_* ersätts med riktiga värden vid bygget – en statisk
// public/firebase-messaging-sw.js hade krävt hårdkodade konfigurationsvärden i klartext.
import { precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

precacheAndRoute(self.__WB_MANIFEST);

// "Uppdatera"-knappen i AppUppdateringBanner.jsx anropar updateSW(true), som (via
// workbox-window) postar {type: "SKIP_WAITING"} till den väntande service workern och
// väntar sedan på ett "controlling"-event för att ladda om sidan - se
// useAppUppdatering.js. `generateSW`-läget (Workbox standardbygge) lägger till BÅDA
// stegen nedan automatiskt; i `injectManifest`-läge (se vite.config.js, Etapp 24a) är den
// här filen den FAKTISKA service worker-koden, och ingen av dem fanns. Utan lyssnaren
// gjorde knappen bokstavligen ingenting - self.skipWaiting() anropades aldrig, den nya
// workern aktiverade sig aldrig, och "controlling" fyrades aldrig av. Upptäckt av ägaren i
// produktion, inte av något test - `test:e2e` startar aldrig en riktig service worker
// (Playwright kör mot dev-servern), så det här hade inte kunnat fångas där.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

// Utan clientsClaim() tar den nya workern bara kontroll över FRAMTIDA sidladdningar, inte
// den redan öppna fliken - och då fyras "controlling" aldrig av på den, så
// window.location.reload() i useAppUppdatering.js hade aldrig kört.
clientsClaim();

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Utan projectId (t.ex. under vissa testbyggen) går det inte att initiera Messaging – en
// tom konfiguration ska inte krascha service workern, bara hoppa över push-delen.
if (firebaseConfig.projectId) {
  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  // Etapp 24b (hård regel): en push innehåller ALDRIG kliniskt innehåll eller fritext från
  // appen – bara generiska titlar/texter som redan är genererade server-side i
  // functions/index.js (skickaPush). Den här hanteraren visar bara vidare det som redan
  // kommit, den lägger inte till något eget innehåll.
  onBackgroundMessage(messaging, (payload) => {
    const { title, body, url } = payload.data ?? {};
    if (!title) return;
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon.svg",
      data: { url: url ?? "/" },
    });
  });
}

// Låter en klickad notis öppna (eller fokusera en redan öppen flik med) rätt sida, istället
// för att bara stänga notisen.
// Säkerhetsgranskning 2026-08-17 (Del 4 – fynd 4.3): `url` kommer ur FCM-payloaden, och
// openWindow() nedan skulle lyda även en absolut adress till en helt annan värd. Samtliga
// riktiga anropsställen (functions/notiser.js) skickar redan interna sökvägar som börjar med
// "/", så det här ändrar ingenting i praktiken – men en service worker är fel plats att lita
// på indata i. Kräver en payload-injektion (dvs. en komprometterad FCM-servernyckel) för att
// bli utnyttjbar, vilket är just den situation där ett andra försvarslager är värt något.
function saakerIntern(url) {
  // "/x" är internt. "//annanvärd" ser ut som en sökväg men är en protokollrelativ ADRESS,
  // så det dubbla snedstrecket måste uteslutas explicit.
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : "/";
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = saakerIntern(event.notification.data?.url);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
      return undefined;
    })
  );
});
