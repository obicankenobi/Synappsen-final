// Anrop till Cloud Functions för Synappsen
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./config";

const functions = getFunctions(app, "europe-west1");

export function tolkaDokument(storagePath, omrade) {
  const fn = httpsCallable(functions, "tolkaDokument");
  return fn({ storagePath, omrade });
}
