import { useOfflineKo } from "../hooks/useOfflineKo";

// Etapp 29c: renderar inget – bara en monteringspunkt för useOfflineKo (samma mönster som
// OrganisationsBranding.jsx) så kö-flushningen körs oavsett vilken sida användaren står på.
export default function OfflineKoLyssnare() {
  useOfflineKo();
  return null;
}
