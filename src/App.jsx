import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import SkyddadRoute from "./components/SkyddadRoute";
import BottomNav from "./components/BottomNav";
import Hem from "./pages/Hem";
import LoggaIn from "./pages/LoggaIn";
import Registrera from "./pages/Registrera";
import KlinisktStod from "./pages/KlinisktStod";
import Logistik from "./pages/Logistik";
import Administration from "./pages/Administration";

function SkyddatLayout({ children }) {
  return (
    <SkyddadRoute>
      <div className="app-innehall">{children}</div>
      <BottomNav />
    </SkyddadRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
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
            path="/administration"
            element={
              <SkyddatLayout>
                <Administration />
              </SkyddatLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
