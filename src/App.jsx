import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DialogProvider } from "./context/DialogProvider";
import { useAuth } from "./hooks/useAuth";
import { useInaktivitetsUtloggning } from "./hooks/useInaktivitetsUtloggning";
import { useUtloggningsinstallning } from "./hooks/useUtloggningsinstallning";
import InaktivitetsVarning from "./components/InaktivitetsVarning";
import OfflineIndikator from "./components/OfflineIndikator";
import ErrorBoundary from "./components/ErrorBoundary";
import MfaPolicyBanner from "./components/MfaPolicyBanner";
import SkyddadRoute from "./components/SkyddadRoute";
import RollSkyddadRoute from "./components/RollSkyddadRoute";
import BottomNav from "./components/BottomNav";
import { REDAKTORSROLLER } from "./firebase/roles";

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
const Anslagstavla = lazy(() => import("./pages/Anslagstavla"));
const Skiftrapport = lazy(() => import("./pages/Skiftrapport"));
const Profil = lazy(() => import("./pages/Profil"));
const Kontakter = lazy(() => import("./pages/Kontakter"));
const Lankbibliotek = lazy(() => import("./pages/Lankbibliotek"));
const Papperskorg = lazy(() => import("./pages/Papperskorg"));
const OfflineCenter = lazy(() => import("./pages/OfflineCenter"));
const Leverantor = lazy(() => import("./pages/Leverantor"));
const Ledningsrapport = lazy(() => import("./pages/Ledningsrapport"));

function SidLaddare() {
  return <div className="sida sida--laddar">Laddar...</div>;
}

function SkyddatLayout({ children }) {
  return (
    <SkyddadRoute>
      <div className="app-innehall">
        <ErrorBoundary>
          <Suspense fallback={<SidLaddare />}>{children}</Suspense>
        </ErrorBoundary>
      </div>
      <BottomNav />
    </SkyddadRoute>
  );
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
      <InaktivitetsBevakning />
      <SessionKontroll />
      <BrowserRouter>
        <MfaPolicyBanner />
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
              <SkyddatLayout>
                <Leverantor />
              </SkyddatLayout>
            }
          />
          <Route
            path="/admin"
            element={
              <RollSkyddadRoute tillatnaRoller={REDAKTORSROLLER}>
                <div className="app-innehall">
                  <ErrorBoundary>
                    <Suspense fallback={<SidLaddare />}>
                      <Admin />
                    </Suspense>
                  </ErrorBoundary>
                </div>
                <BottomNav />
              </RollSkyddadRoute>
            }
          />
          <Route
            path="/ledningsrapport"
            element={
              <RollSkyddadRoute tillatnaRoller={REDAKTORSROLLER}>
                <div className="app-innehall">
                  <ErrorBoundary>
                    <Suspense fallback={<SidLaddare />}>
                      <Ledningsrapport />
                    </Suspense>
                  </ErrorBoundary>
                </div>
                <BottomNav />
              </RollSkyddadRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      </DialogProvider>
    </AuthProvider>
  );
}
