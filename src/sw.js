// Etapp 24a: egen service worker-källa, byggd av Vite via vite-plugin-pwas
// injectManifest-läge (se vite.config.js) istället för den tidigare auto-genererade
// (generateSW). Skälet är att Vite/Rollup då faktiskt bearbetar den här filen, vilket gör
// att import.meta.env.VITE_FIREBASE_* ersätts med riktiga värden vid bygget – en statisk
// public/firebase-messaging-sw.js hade krävt hårdkodade konfigurationsvärden i klartext.
import { precacheAndRoute } from "workbox-precaching";
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

precacheAndRoute(self.__WB_MANIFEST);

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
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
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
