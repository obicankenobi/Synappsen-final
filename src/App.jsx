import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DialogProvider } from "./context/DialogProvider";
import { useAuth } from "./hooks/useAuth";
import { useInaktivitetsUtloggning } from "./hooks/useInaktivitetsUtloggning";
import { useUtloggningsinstallning } from "./hooks/useUtloggningsinstallning";
import { useSidTitel } from "./hooks/useSidTitel";
import InaktivitetsVarning from "./components/InaktivitetsVarning";
import OfflineIndikator from "./components/OfflineIndikator";
import ErrorBoundary from "./components/ErrorBoundary";
import MfaPolicyBanner from "./components/MfaPolicyBanner";
import ProvperiodBanner from "./components/ProvperiodBanner";
import InstalleraAppBanner from "./components/InstalleraAppBanner";
import AppUppdateringBanner from "./components/AppUppdateringBanner";
import AkutlagePrefetch from "./components/AkutlagePrefetch";
import AkutKnappFloating from "./components/AkutKnappFloating";
import OrganisationsBranding from "./components/OrganisationsBranding";
import OfflineKoLyssnare from "./components/OfflineKoLyssnare";
import SkyddadRoute from "./components/SkyddadRoute";
import RollSkyddadRoute from "./components/RollSkyddadRoute";
import BottomNav from "./components/BottomNav";
import Sidomeny from "./components/Sidomeny";
import ScrollHantering from "./components/ScrollHantering";
import KommandopalettLyssnare from "./components/KommandopalettLyssnare";
import KioskBevakning from "./components/KioskBevakning";
import { REDAKTORSROLLER } from "./firebase/roles";
import { PLATTFORMSORGANISATION } from "./firebase/organisation";

// Kontrollerar var 5:e minut om sessionen fortfarande är giltig – om en superadmin har
// tvingat utloggning (återkallade refresh-tokens) upptäcks det här istället för att kunna
// dröja upp till en timme (ordinarie livslängd för en redan hämtad ID-token).
function SessionKontroll() {
  const { currentUser, loggaUt } = useAuth();

  useEffect(() => {
    if (!currentUser) return undefined;
    const intervall = setInterval(async () => {
      try {
        await currentUser.getIdToken(true);
      } catch {
        loggaUt();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(intervall);
  }, [currentUser, loggaUt]);

  return null;
}

// Varje sida laddas i sin egen chunk vid behov istället för att bakas in i huvudbundlen
const Hem = lazy(() => import("./pages/Hem"));
const LoggaIn = lazy(() => import("./pages/LoggaIn"));
const Registrera = lazy(() => import("./pages/Registrera"));
const KlinisktStod = lazy(() => import("./pages/KlinisktStod"));
const Logistik = lazy(() => import("./pages/Logistik"));
const ForradVy = lazy(() => import("./pages/ForradVy"));
const Administration = lazy(() => import("./pages/Administration"));
const Admin = lazy(() => import("./pages/Admin"));
const LaddaUpp = lazy(() => import("./pages/LaddaUpp"));
const Nyheter = lazy(() => import("./pages/Nyheter"));
const Hjalp = lazy(() => import("./pages/Hjalp"));
const Feedback = lazy(() => import("./pages/Feedback"));
const KontaktaLeverantoren = lazy(() => import("./pages/KontaktaLeverantoren"));
const Anslagstavla = lazy(() => import("./pages/Anslagstavla"));
const Skiftrapport = lazy(() => import("./pages/Skiftrapport"));
const Profil = lazy(() => import("./pages/Profil"));
const Kontakter = lazy(() => import("./pages/Kontakter"));
const Lankbibliotek = lazy(() => import("./pages/Lankbibliotek"));
const Papperskorg = lazy(() => import("./pages/Papperskorg"));
const OfflineCenter = lazy(() => import("./pages/OfflineCenter"));
const LeverantorLayout = lazy(() => import("./pages/leverantor/LeverantorLayout"));
const LeverantorOversikt = lazy(() => import("./pages/leverantor/LeverantorOversikt"));
const LeverantorKunder = lazy(() => import("./pages/leverantor/LeverantorKunder"));
const LeverantorSupport = lazy(() => import("./pages/leverantor/LeverantorSupport"));
const LeverantorDrift = lazy(() => import("./pages/leverantor/LeverantorDrift"));
const LeverantorInnehall = lazy(() => import("./pages/leverantor/LeverantorInnehall"));
const LeverantorEkonomi = lazy(() => import("./pages/leverantor/LeverantorEkonomi"));
const LeverantorLogg = lazy(() => import("./pages/leverantor/LeverantorLogg"));
const KundLayout = lazy(() => import("./pages/leverantor/kund/KundLayout"));
const KundOversikt = lazy(() => import("./pages/leverantor/kund/KundOversikt"));
const KundAnvandning = lazy(() => import("./pages/leverantor/kund/KundAnvandning"));
const KundEkonomi = lazy(() => import("./pages/leverantor/kund/KundEkonomi"));
const KundAtgarder = lazy(() => import("./pages/leverantor/kund/KundAtgarder"));
const KundHistorik = lazy(() => import("./pages/leverantor/kund/KundHistorik"));
const Introduktion = lazy(() => import("./pages/Introduktion"));
const Kompetensmatris = lazy(() => import("./pages/Kompetensmatris"));
const Ledningsrapport = lazy(() => import("./pages/Ledningsrapport"));
const Godkannanden = lazy(() => import("./pages/Godkannanden"));
const Akutlage = lazy(() => import("./pages/Akutlage"));
const Korvy = lazy(() => import("./pages/Korvy"));
const SedanForraPasset = lazy(() => import("./pages/SedanForraPasset"));
const OvaLage = lazy(() => import("./pages/OvaLage"));

function SidLaddare() {
  return <div className="sida sida--laddar">Laddar...</div>;
}

// Etapp L1m (intern/ETAPPLAN-INTERN-1.md), punkt 3: ett organisationslöst leverantörskonto
// har ingen kundvy att gå till – SkyddatLayout omsluter i praktiken all annan skyddad rutt i
// appen (inklusive "/", dit inloggning alltid navigerar), så en enda kontroll här räcker för
// "SkyddatLayout och / skickar ett _plattform-konto till /leverantor". Rör aldrig
// /leverantor/* själv, eftersom den rutten använder LeverantorLayout, inte den här.
function SkyddatLayout({ children }) {
  const { organisationId } = useAuth();
  if (organisationId === PLATTFORMSORGANISATION) {
    return <Navigate to="/leverantor" replace />;
  }
  return (
    <SkyddadRoute>
      <main id="huvudinnehall" className="app-innehall" tabIndex={-1}>
        <ErrorBoundary>
          <Suspense fallback={<SidLaddare />}>{children}</Suspense>
        </ErrorBoundary>
      </main>
      <BottomNav />
      <Sidomeny />
      <KommandopalettLyssnare />
    </SkyddadRoute>
  );
}

// Etapp 13g (WCAG 2.4.2): sätter document.title per rutt. Måste monteras inuti
// BrowserRouter (useLocation kräver Router-kontext), renderar inget synligt.
function SidTitelBevakning() {
  useSidTitel();
  return null;
}

// Loggar automatiskt ut vid inaktivitet, oavsett vilken skyddad rutt användaren är på
function InaktivitetsBevakning() {
  const { currentUser, loggaUt } = useAuth();
  const { minuter } = useUtloggningsinstallning();
  const { visaVarning, fortsattInloggad } = useInaktivitetsUtloggning(Boolean(currentUser), loggaUt, minuter);
  return visaVarning ? <InaktivitetsVarning onFortsatt={fortsattInloggad} /> : null;
}

export default function App() {
  return (
    <AuthProvider>
      <DialogProvider>
      <OfflineIndikator />
      <OrganisationsBranding />
      <OfflineKoLyssnare />
      <InaktivitetsBevakning />
      <SessionKontroll />
      <BrowserRouter>
        <a href="#huvudinnehall" className="hoppa-till-innehall">
          Hoppa till innehåll
        </a>
        <SidTitelBevakning />
        <ScrollHantering />
        <KioskBevakning />
        <AppUppdateringBanner />
        <MfaPolicyBanner />
        <ProvperiodBanner />
        <InstalleraAppBanner />
        <AkutlagePrefetch />
        <AkutKnappFloating />
        <Routes>
          <Route
            path="/logga-in"
            element={
              <ErrorBoundary>
                <Suspense fallback={<SidLaddare />}>
                  <LoggaIn />
                </Suspense>
              </ErrorBoundary>
            }
          />
          <Route
            path="/registrera"
            element={
              <ErrorBoundary>
                <Suspense fallback={<SidLaddare />}>
                  <Registrera />
                </Suspense>
              </ErrorBoundary>
            }
          />
          <Route
            path="/"
            element={
              <SkyddatLayout>
                <Hem />
              </SkyddatLayout>
            }
          />
          <Route
            path="/kliniskt-stod"
            element={
              <SkyddatLayout>
                <KlinisktStod />
              </SkyddatLayout>
            }
          />
          <Route
            path="/logistik"
            element={
              <SkyddatLayout>
                <Logistik />
              </SkyddatLayout>
            }
          />
          <Route
            path="/logistik/:forradSlug"
            element={
              <SkyddatLayout>
                <ForradVy />
              </SkyddatLayout>
            }
          />
          <Route
            path="/administration"
            element={
              <SkyddatLayout>
                <Administration />
              </SkyddatLayout>
            }
          />
          <Route
            path="/ladda-upp"
            element={
              <SkyddatLayout>
                <LaddaUpp />
              </SkyddatLayout>
            }
          />
          <Route
            path="/nyheter"
            element={
              <SkyddatLayout>
                <Nyheter />
              </SkyddatLayout>
            }
          />
          <Route
            path="/hjalp"
            element={
              <SkyddatLayout>
                <Hjalp />
              </SkyddatLayout>
            }
          />
          <Route
            path="/feedback"
            element={
              <SkyddatLayout>
                <Feedback />
              </SkyddatLayout>
            }
          />
          <Route
            path="/kontakta-leverantoren"
            element={
              <SkyddatLayout>
                <KontaktaLeverantoren />
              </SkyddatLayout>
            }
          />
          <Route
            path="/anslag"
            element={
              <SkyddatLayout>
                <Anslagstavla />
              </SkyddatLayout>
            }
          />
          <Route
            path="/skiftrapport"
            element={
              <SkyddatLayout>
                <Skiftrapport />
              </SkyddatLayout>
            }
          />
          <Route
            path="/profil"
            element={
              <SkyddatLayout>
                <Profil />
              </SkyddatLayout>
            }
          />
          <Route
            path="/kontakter"
            element={
              <SkyddatLayout>
                <Kontakter />
              </SkyddatLayout>
            }
          />
          <Route
            path="/introduktion"
            element={
              <SkyddatLayout>
                <Introduktion />
              </SkyddatLayout>
            }
          />
          <Route
            path="/kompetensmatris"
            element={
              <SkyddatLayout>
                <Kompetensmatris />
              </SkyddatLayout>
            }
          />
          <Route
            path="/ova"
            element={
              <SkyddatLayout>
                <OvaLage />
              </SkyddatLayout>
            }
          />
          <Route
            path="/lankbibliotek"
            element={
              <SkyddatLayout>
                <Lankbibliotek />
              </SkyddatLayout>
            }
          />
          <Route
            path="/papperskorg"
            element={
              <SkyddatLayout>
                <Papperskorg />
              </SkyddatLayout>
            }
          />
          <Route
            path="/offline-center"
            element={
              <SkyddatLayout>
                <OfflineCenter />
              </SkyddatLayout>
            }
          />
          <Route
            path="/leverantor"
            element={
              <ErrorBoundary>
                <Suspense fallback={<SidLaddare />}>
                  <LeverantorLayout />
                </Suspense>
              </ErrorBoundary>
            }
          >
            <Route index element={<LeverantorOversikt />} />
            <Route path="kunder" element={<LeverantorKunder />} />
            <Route path="support" element={<LeverantorSupport />} />
            <Route path="drift" element={<LeverantorDrift />} />
            <Route path="innehall" element={<LeverantorInnehall />} />
            <Route path="ekonomi" element={<LeverantorEkonomi />} />
            <Route path="logg" element={<LeverantorLogg />} />
            <Route path="kund/:orgId" element={<KundLayout />}>
              <Route index element={<KundOversikt />} />
              <Route path="anvandning" element={<KundAnvandning />} />
              <Route path="ekonomi" element={<KundEkonomi />} />
              <Route path="atgarder" element={<KundAtgarder />} />
              <Route path="historik" element={<KundHistorik />} />
            </Route>
          </Route>
          <Route
            path="/admin"
            element={
              <RollSkyddadRoute tillatnaRoller={REDAKTORSROLLER}>
                <main id="huvudinnehall" className="app-innehall" tabIndex={-1}>
                  <ErrorBoundary>
                    <Suspense fallback={<SidLaddare />}>
                      <Admin />
                    </Suspense>
                  </ErrorBoundary>
                </main>
                <BottomNav />
                <Sidomeny />
              </RollSkyddadRoute>
            }
          />
          <Route
            path="/godkannanden"
            element={
              <RollSkyddadRoute tillatnaRoller={REDAKTORSROLLER}>
                <main id="huvudinnehall" className="app-innehall" tabIndex={-1}>
                  <ErrorBoundary>
                    <Suspense fallback={<SidLaddare />}>
                      <Godkannanden />
                    </Suspense>
                  </ErrorBoundary>
                </main>
                <BottomNav />
                <Sidomeny />
              </RollSkyddadRoute>
            }
          />
          <Route
            path="/ledningsrapport"
            element={
              <RollSkyddadRoute tillatnaRoller={REDAKTORSROLLER}>
                <main id="huvudinnehall" className="app-innehall" tabIndex={-1}>
                  <ErrorBoundary>
                    <Suspense fallback={<SidLaddare />}>
                      <Ledningsrapport />
                    </Suspense>
                  </ErrorBoundary>
                </main>
                <BottomNav />
                <Sidomeny />
              </RollSkyddadRoute>
            }
          />
          <Route
            path="/akutlage"
            element={
              <SkyddadRoute>
                <ErrorBoundary>
                  <Suspense fallback={<SidLaddare />}>
                    <Akutlage />
                  </Suspense>
                </ErrorBoundary>
              </SkyddadRoute>
            }
          />
          <Route
            path="/sedan-forra-passet"
            element={
              <SkyddatLayout>
                <SedanForraPasset />
              </SkyddatLayout>
            }
          />
          <Route
            path="/checklista/:rutinId"
            element={
              <SkyddadRoute>
                <ErrorBoundary>
                  <Suspense fallback={<SidLaddare />}>
                    <Korvy />
                  </Suspense>
                </ErrorBoundary>
              </SkyddadRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      </DialogProvider>
    </AuthProvider>
  );
}
