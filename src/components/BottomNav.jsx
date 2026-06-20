import { NavLink } from "react-router-dom";
import "./BottomNav.css";

// Mobilanpassad navigering längst ned på skärmen
export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className="bottom-nav__lank">
        <span className="bottom-nav__ikon">🏠</span>
        <span>Hem</span>
      </NavLink>
      <NavLink to="/kliniskt-stod" className="bottom-nav__lank">
        <span className="bottom-nav__ikon">🩺</span>
        <span>Kliniskt</span>
      </NavLink>
      <NavLink to="/logistik" className="bottom-nav__lank">
        <span className="bottom-nav__ikon">📦</span>
        <span>Logistik</span>
      </NavLink>
      <NavLink to="/administration" className="bottom-nav__lank">
        <span className="bottom-nav__ikon">📋</span>
        <span>Admin</span>
      </NavLink>
    </nav>
  );
}
