// Anrop till Cloud Functions för Synappsen
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./config";

const functions = getFunctions(app, "europe-west1");

export function tolkaDokument(storagePath, omrade) {
  const fn = httpsCallable(functions, "tolkaDokument");
  return fn({ storagePath, omrade });
}

export function tolkaForradsbild(storagePath, forrad) {
  const fn = httpsCallable(functions, "tolkaForradsbild");
  return fn({ storagePath, forrad });
}

export function fragaKlinisktStod(fraga) {
  const fn = httpsCallable(functions, "fragaKlinisktStod");
  return fn({ fraga });
}

export function tvingaUtloggning(userId) {
  const fn = httpsCallable(functions, "tvingaUtloggning");
  return fn({ userId });
}

export function skapaKommentar({ rutinId, text, svarPa }) {
  const fn = httpsCallable(functions, "skapaKommentar");
  return fn({ rutinId, text, svarPa });
}

export function skickaFeedback({ typ, text }) {
  const fn = httpsCallable(functions, "skickaFeedback");
  return fn({ typ, text });
}
