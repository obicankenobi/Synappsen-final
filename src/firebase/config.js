// Firebase-initiering för Synappsen
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  terminate,
  clearIndexedDbPersistence,
} from "firebase/firestore";
import { connectAuthEmulator } from "firebase/auth";
// Ren util utan Firebase-beroenden – ingen risk för cirkulär import (jfr BILDCACHE_NAMN nedan).
import { rensaAllaSenastBesokta } from "../utils/senastBesokta";

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
// Etapp 30a: dynamisk import istället för ett statiskt top-level-import – de flesta
// organisationer har (ännu) ingen reCAPTCHA-nyckel konfigurerad, så firebase/app-check ska
// inte behöva laddas ner av alla i den redan tunga firebase-vendor-chunken.
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY && import.meta.env.VITE_USE_EMULATOR !== "true") {
  import("firebase/app-check").then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  });
}

export const auth = getAuth(app);
// Lokal cache (IndexedDB) så att redan hämtat innehåll går att läsa vid dåligt/inget nät,
// och flera öppna flikar delar samma cache.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

// Cache Storage-cachen där offline-centret sparar bilder (useOfflineCenter.js). Namnet bor
// här, inte i hooken, så att utloggningsstädningen nedan kan tömma den utan att importera en
// React-hook (och riskera en cirkulär import via useAuth).
export const BILDCACHE_NAMN = "synappsen-offline-bilder";

// Säkerhetsfix: Firestores persistenta cache (IndexedDB ovan) är INTE nycklad per användare.
// På en delad akutmottagningsdator låg därför allt en tidigare inloggad person läst –
// rutiner, kontakter, förrådsartiklar – kvar läsbart för nästa person efter en utloggning,
// och en offline-query efter ett organisationsbyte kunde serveras ur fel organisations
// cachade dokument. Städas därför explicit vid utloggning.
//
// Ordningen är tvingande: terminate() först (annars vägrar clearIndexedDbPersistence), och
// EFTERÅT går instansen inte att återanvända i samma sidlivstid – anroparen måste därför
// ladda om sidan hårt (se loggaUt i AuthContext.jsx).
//
// Varje steg har egen felhantering och sväljer sitt fel: en utloggning får ALDRIG misslyckas
// eller hänga för att städningen gör det. Vanligaste fallet är `failed-precondition` – en
// annan flik har samma Firestore-instans öppen, och då kan cachen helt enkelt inte tömmas.
// Den efterföljande hårda omladdningen gör ändå att ingenting av föregående användares data
// ligger kvar i minnet i den här fliken.
export async function rensaLokalaAnvandardata() {
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
  } catch (fel) {
    console.warn("Kunde inte tömma den lokala Firestore-cachen vid utloggning:", fel?.code ?? fel);
  }

  try {
    if (typeof caches !== "undefined") {
      await caches.delete(BILDCACHE_NAMN);
    }
  } catch (fel) {
    console.warn("Kunde inte tömma bildcachen vid utloggning:", fel);
  }

  try {
    const nycklar = Object.keys(localStorage).filter((n) => n.startsWith("offlineCenter_"));
    for (const nyckel of nycklar) {
      localStorage.removeItem(nyckel);
    }
  } catch (fel) {
    console.warn("Kunde inte rensa offline-centrets lokala nycklar vid utloggning:", fel);
  }

  // Säkerhetsgranskning 2026-08-17 (Del 3 – fynd 3.2). Städningen ovan skrevs för
  // offline-centrets nycklar och tog bara dem, trots att motiveringen högst upp i det här
  // blocket är den delade akutmottagningsdatorn i allmänhet. "Senast besökta" är den enda
  // övriga lokala nyckeln som innehåller INNEHÅLL (rutintitlar och sökvägar) i stället för en
  // tidsstämpel, och den enda som saknade uid i nyckeln – den städas därför också.
  //
  // MEDVETET INTE städade, och skälet ska stå kvar:
  //   • offlineKo_{uid} – köade läskvitteringar och BRISTANMÄLNINGAR som ännu inte nått
  //     servern. Att tömma den vid utloggning hade tyst kastat bort en anmälan någon gjort
  //     offline. Nyckeln innehåller uid, så nästa användare kommer aldrig åt den via appen.
  //   • synappsen_checklista_{uid}_{rutinId} – en påbörjad checklistkörning ("fortsätt där du
  //     var"). Samma resonemang: per uid, och att kasta den förstör pågående arbete.
  //   • tema/accent/installationsbanner – enhetsinställningar utan användardata.
  rensaAllaSenastBesokta();
}

// Endast för lokal utveckling/manuell verifiering mot emulatorerna (t.ex. Etapp 1:s
// organisationsisolering) – av som standard, kräver ett explicit .env.local-flagga så det
// aldrig av misstag pekar en riktig build mot en lokal emulator.
if (import.meta.env.VITE_USE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
