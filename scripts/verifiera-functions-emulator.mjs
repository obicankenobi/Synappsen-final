#!/usr/bin/env node
// Verifierar att functions-EMULATORN faktiskt kan ta emot och besvara ett riktigt anrop, inte
// bara ladda funktionsdefinitionerna. Skrivet 2026-09-08 för att pröva om en bump av
// firebase-tools (rot-package.json) löser den kända buggen: emulatorruntimen i
// firebase-tools@13 anropar functions.config(), som togs bort i firebase-functions@7
// (functions/package.json) – varje anrop dör då med "Your function was killed because it
// raised an unhandled error", trots att funktionsdefinitionerna laddas helt utan fel. Se
// OPPNA-PUNKTER.md för bakgrunden och varför en sådan bugg annars kan vara osynlig länge:
// test:functions kör exporten direkt i Node (aldrig via emulatorns HTTP-lager) och
// test:e2e:s frontend sväljer 500-svar tyst.
//
// Körs MOT en redan startad emulator (functions + auth + firestore krävs – rapporteraAppVersion
// skriver till Firestore), t.ex.:
//   firebase emulators:exec --project demo-test --only auth,firestore,functions,storage \
//     "node scripts/verifiera-functions-emulator.mjs"
//
// Anropar rapporteraAppVersion – vald för att den bara kräver en inloggad användare (ingen
// roll, ingen organisation måste finnas i förväg: hamtaAnvandarInfo faller tillbaka på
// STANDARD_ORG för en okänd uid) och skriver ett harmlöst fält. Ett lyckat anrop bevisar att
// HELA vägen fungerar: emulatorn startade funktionen, körde den, och Admin SDK inuti
// funktionen nådde Firestore-emulatorn.
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInAnonymously } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";

const app = initializeApp({ projectId: "demo-test", apiKey: "fake-api-key" });
const auth = getAuth(app);
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
const functions = getFunctions(app, "europe-west1");
connectFunctionsEmulator(functions, "127.0.0.1", 5001);

async function main() {
  await signInAnonymously(auth);
  const rapporteraAppVersion = httpsCallable(functions, "rapporteraAppVersion");
  const resultat = await rapporteraAppVersion("0.0.0-emulatorverifiering");
  console.log("FUNCTIONS_EMULATOR_VERIFIERING: OK", JSON.stringify(resultat.data));
  process.exit(0);
}

main().catch((fel) => {
  console.error("FUNCTIONS_EMULATOR_VERIFIERING: MISSLYCKADES");
  console.error("kod:", fel.code, "meddelande:", fel.message);
  process.exit(1);
});
