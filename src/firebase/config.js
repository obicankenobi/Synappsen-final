// Firebase-initiering för Synappsen
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
} from "firebase/firestore";
import { connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);

// Etapp 12c-i (App Check, mätfas): intygar för Firebase att anrop kommer från den riktiga
// appen, inte ett skript. Aktiveras bara om en reCAPTCHA v3-sitenyckel är konfigurerad –
// utan den är detta ett no-op, precis som Sentry-DSN:et. Ingen serverkontroll ännu
// (`enforceAppCheck` på Cloud Functions är 12c-ii, ett separat steg EFTER en mätperiod som
// visar att riktig trafik faktiskt får giltiga tokens – annars riskerar man att stänga ute
// riktiga användare, t.ex. med en gammal cachad PWA-version). Se ETAPPLAN2.md Etapp 12c.
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY && import.meta.env.VITE_USE_EMULATOR !== "true") {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);
// Lokal cache (IndexedDB) så att redan hämtat innehåll går att läsa vid dåligt/inget nät,
// och flera öppna flikar delar samma cache.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

// Endast för lokal utveckling/manuell verifiering mot emulatorerna (t.ex. Etapp 1:s
// organisationsisolering) – av som standard, kräver ett explicit .env.local-flagga så det
// aldrig av misstag pekar en riktig build mot en lokal emulator.
if (import.meta.env.VITE_USE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
