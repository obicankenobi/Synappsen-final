import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { useInaktivitetsUtloggning } from "./hooks/useInaktivitetsUtloggning";
import InaktivitetsVarning from "./components/InaktivitetsVarning";
import SkyddadRoute from "./components/SkyddadRoute";
import RollSkyddadRoute from "./components/RollSkyddadRoute";
import BottomNav from "./components/BottomNav";
import Hem from "./pages/Hem";
import LoggaIn from "./pages/LoggaIn";
import Registrera from "./pages/Registrera";
import KlinisktStod from "./pages/KlinisktStod";
import Logistik from "./pages/Logistik";
import ForradVy from "./pages/ForradVy";
import Administration from "./pages/Administration";
import Admin from "./pages/Admin";
import LaddaUpp from "./pages/LaddaUpp";
import Nyheter from "./pages/Nyheter";
import Hjalp from "./pages/Hjalp";
import Feedback from "./pages/Feedback";
import Anslagstavla from "./pages/Anslagstavla";
import Skiftrapport from "./pages/Skiftrapport";
import Profil from "./pages/Profil";
import { ROLES } from "./firebase/roles";

function SkyddatLayout({ children }) {
  return (
    <SkyddadRoute>
      <div className="app-innehall">{children}</div>
      <BottomNav />
    </SkyddadRoute>
  );
}

// Loggar automatiskt ut vid inaktivitet, oavsett vilken skyddad rutt användaren är på
function InaktivitetsBevakning() {
  const { currentUser, loggaUt } = useAuth();
  const { visaVarning, fortsattInloggad } = useInaktivitetsUtloggning(Boolean(currentUser), loggaUt);
  return visaVarning ? <InaktivitetsVarning onFortsatt={fortsattInloggad} /> : null;
}

export default function App() {
  return (
    <AuthProvider>
      <InaktivitetsBevakning />
      <BrowserRouter>
        <Routes>
          <Route path="/logga-in" element={<LoggaIn />} />
          <Route path="/registrera" element={<Registrera />} />
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
            path="/admin"
            element={
              <RollSkyddadRoute tillatnaRoller={[ROLES.SUPERADMIN]}>
                <div className="app-innehall">
                  <Admin />
                </div>
                <BottomNav />
              </RollSkyddadRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
