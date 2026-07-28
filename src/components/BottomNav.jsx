import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { arRedaktor } from "../firebase/roles";
import { oppnaKommandopalett } from "../hooks/useKommandopalett";
import "./BottomNav.css";

// Mobilanpassad navigering längst ned på skärmen
export default function BottomNav() {
  const { role } = useAuth();

  return (
    <nav className="bottom-nav">
      {/* Etapp 23a: samma kommandopalett som Ctrl/Cmd+K på ett tangentbord – mobilen har
          inget tangentbord, så den behöver en egen ingång. */}
      <button type="button" className="bottom-nav__lank" onClick={oppnaKommandopalett}>
        <span className="bottom-nav__ikon">🔎</span>
        <span>Sök</span>
      </button>
      <NavLink to="/" end className="bottom-nav__lank">
        <span className="bottom-nav__ikon">🏠</span>
        <span>Hem</span>
      </NavLink>
      <NavLink to="/anslag" className="bottom-nav__lank">
        <span className="bottom-nav__ikon">📢</span>
        <span>Anslag</span>
      </NavLink>
      <NavLink to="/kliniskt-stod" className="bottom-nav__lank">
        <span className="bottom-nav__ikon">🩺</span>
        <span>Kliniskt</span>
      </NavLink>
      <NavLink to="/logistik" className="bottom-nav__lank">
        <span className="bottom-nav__ikon">📦</span>
        <span>Logistik</span>
      </NavLink>
      {/* UI-designjustering (2026-07): "Administration" (policys/anslag/regelverk, alla
          inloggade) och "/admin" (superadmin-panelen, roller/organisation) hette båda
          "Admin" i bottennavigeringen – identiskt text på två olika sidor, precis den typen
          av otydlighet granskningen bad om att åtgärda. Den här heter nu "Regler" (matchar
          "regelverk" i sidans egen beskrivning), superadmin-panelen behåller "Admin". */}
      <NavLink to="/administration" className="bottom-nav__lank">
        <span className="bottom-nav__ikon">📋</span>
        <span>Regler</span>
      </NavLink>
      {arRedaktor(role) && (
        <NavLink to="/admin" className="bottom-nav__lank">
          <span className="bottom-nav__ikon">⚙️</span>
          <span>Admin</span>
        </NavLink>
      )}
    </nav>
  );
}
