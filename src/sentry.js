// Felrapportering till Sentry (produkt: synappsen/synappsen-frontend). Ingen DSN i miljön
// (lokal utveckling, PR-förhandsvisningar utan .env) → Sentry.init() no-opar tyst, vilket är
// SDK:ns avsedda beteende och kräver ingen egen villkorslogik här.
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0,
});

export { Sentry };
