import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './sentry.js'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Bugfix: ErrorBoundary fanns tidigare BARA inuti varje rutt (App.jsx). Allt ovanför rutterna
// – AuthProvider, DialogProvider och de alltid monterade komponenterna (OfflineIndikator,
// OrganisationsBranding, InaktivitetsBevakning, KioskBevakning, banners …) – låg alltså
// oskyddat: ett renderingsfel där avmonterade hela trädet till en helvit skärm, precis det
// ErrorBoundary skrevs för att förhindra. Den yttre gränsen fångar nu även dem.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
