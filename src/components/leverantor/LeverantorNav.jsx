import { NavLink } from "react-router-dom";
import "./LeverantorNav.css";

// Etapp L1a: de sju portföljvyerna, se "Panelens upplägg" i intern/ETAPPLAN-INTERN-1.md.
// `end` bara på Översikt – annars skulle den matcha (och lysa upp) på VARJE underrutt,
// inklusive /leverantor/kund/:orgId.
const POSTER = [
  { till: "/leverantor", namn: "Översikt", ikon: "📊", end: true },
  { till: "/leverantor/kunder", namn: "Kunder", ikon: "🏢" },
  { till: "/leverantor/support", namn: "Support", ikon: "🎧" },
  { till: "/leverantor/drift", namn: "Drift & incident", ikon: "🚨" },
  { till: "/leverantor/innehall", namn: "Innehåll", ikon: "📚" },
  { till: "/leverantor/ekonomi", namn: "Ekonomi", ikon: "💰" },
  { till: "/leverantor/logg", namn: "Åtgärdslogg", ikon: "📜" },
];

export default function LeverantorNav() {
  return (
    <nav className="leverantor-nav" aria-label="Leverantörspanelens navigering">
      {POSTER.map((post) => (
        <NavLink key={post.till} to={post.till} end={post.end} className="leverantor-nav__lank">
          <span aria-hidden="true">{post.ikon}</span>
          {post.namn}
        </NavLink>
      ))}
    </nav>
  );
}
