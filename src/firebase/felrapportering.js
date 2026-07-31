// Etapp 32a: nekade Firestore-listningar (t.ex. permission-denied från en list-provability-bugg,
// se roles.js farRedigeraOmrade) syntes tidigare bara som en tyst konsolrad – Sentry fångar inget
// eftersom React aldrig kraschar av ett onSnapshot-fel. Den här funktionen är den enda platsen
// som ska anropas från hooks error-callback, så att rapporteringen blir enhetlig.
//
// Skickar ALDRIG dokumentinnehåll eller annan patientdata (krav 13) – bara metadata om VILKEN
// collection, VILKEN roll, VILKEN organisation och VILKEN sökväg som nekades.
import { Sentry } from "../sentry";

export function rapporteraNekadListning({ collection, roll, organisationId, sokvag, fel }) {
  if (fel?.code !== "permission-denied") return;
  Sentry.captureMessage("Nekad Firestore-listning", {
    level: "warning",
    tags: {
      typ: "permission-denied-listning",
      collection,
      roll: roll ?? "okand",
    },
    extra: {
      organisationId: organisationId ?? "okand",
      sokvag: sokvag ?? "okand",
    },
  });
}
