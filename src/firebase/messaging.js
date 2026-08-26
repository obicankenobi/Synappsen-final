// Etapp 24a/24c: klientsidan för push-notiser. Ansvarar för behörighetsbegäran, registrering
// av enhetstoken (`users/{uid}.pushTokens`) och avstängning – aldrig för att bygga eller visa
// notisinnehåll (det görs uteslutande server-side i functions/index.js:s skickaPush, se
// ETAPPLAN4.md Etapp 24b).
import { getMessaging, getToken, deleteToken, isSupported } from "firebase/messaging";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { app, db } from "./config";

// Etapp 24d: iOS Safari stödjer webbpush bara i en app tillagd på hemskärmen (iOS 16.4+),
// annars kastar Notification/serviceWorker-API:erna eller ger aldrig behörighet.
export function pushStodsAvEnheten() {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

// display-mode: standalone är hur en till hemskärmen tillagd PWA känns igen på iOS – det
// finns ingen annan officiell signal.
export function korSomInstalleradApp() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

export function arIos() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Begär notisbehörighet och registrerar enhetens token på users/{uid}.pushTokens. Ska
// ANROPAS efter en meningsfull handling (Etapp 24c), aldrig automatiskt vid inloggning.
export async function aktiveraPush(uid) {
  if (!pushStodsAvEnheten() || !(await isSupported())) {
    return { status: "ej-stodd" };
  }
  const tillstand = await Notification.requestPermission();
  if (tillstand !== "granted") {
    return { status: "nekad" };
  }
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    return { status: "ej-konfigurerad" };
  }
  const registrering = await navigator.serviceWorker.ready;
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registrering });
  if (!token) {
    return { status: "fel" };
  }
  // Etapp 70d: users/{uid} skapas av losInInbjudan (Cloud Function) EFTER att Auth-kontot
  // finns – under registreringen är användaren alltså inloggad en kort stund innan
  // profildokumentet existerar. En updateDoc i det fönstret nekas av firestore.rules
  // (resource är null), vilket i produktion syntes som "FirebaseError: Missing or
  // insufficient permissions" från firebase-messaging-chunken i Sentry 2026-08-26.
  // Kontrollen nedan gör det till ett begripligt returvärde i stället för ett kastat fel.
  const profil = await getDoc(doc(db, "users", uid));
  if (!profil.exists()) {
    return { status: "profil-saknas" };
  }
  await updateDoc(doc(db, "users", uid), { pushTokens: arrayUnion(token) });
  return { status: "aktiverad" };
}

// Tar bort den här enhetens token, både lokalt hos FCM och från users/{uid}.pushTokens.
export async function inaktiveraPush(uid) {
  if (!pushStodsAvEnheten() || !(await isSupported())) return;
  const messaging = getMessaging(app);
  let token = null;
  try {
    token = await getToken(messaging);
  } catch {
    // Ingen befintlig token att ta bort – inget att göra.
  }
  if (token) {
    await deleteToken(messaging);
    await updateDoc(doc(db, "users", uid), { pushTokens: arrayRemove(token) });
  }
}
