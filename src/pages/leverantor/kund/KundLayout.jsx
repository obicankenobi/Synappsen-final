import { NavLink, Outlet, useOutletContext, useParams } from "react-router-dom";
import { AVTALSSTATUS_ETIKETT } from "../../../components/leverantor/avtalsstatusEtikett";

const FLIKAR = [
  { till: "", namn: "Översikt", end: true },
  { till: "anvandning", namn: "Användning" },
  { till: "ekonomi", namn: "Ekonomi" },
  { till: "atgarder", namn: "Åtgärder" },
  { till: "historik", namn: "Historik" },
];

// Etapp L1a byggde skalet (navigationsträdet, :orgId-hämtningen); Etapp L1b fyllde de fem
// flikarna med riktigt innehåll (kunddossién). Två block ur planens ursprungliga sju
// (Hälsa/mätvärdestrend, och delen av Användning som är "senaste aktivitet") är fortfarande
// placeholders – de väntar på öppna beslutspunkter (1 respektive 2), inte på L1b självt.
// OrganisationsRad.jsx:s inline-expansion i kundregistret rördes MEDVETET INTE (se den filens
// egen kommentar) – att retirera den är ett separat, större steg som L1b inte kräver.
export default function KundLayout() {
  const { orgId } = useParams();
  const context = useOutletContext();
  const { organisationer } = context;
  const org = (organisationer ?? []).find((o) => o.orgId === orgId);

  if (!org) {
    return (
      <div className="sida sida--bred">
        <p className="sida__beskrivning">Organisationen hittades inte (eller laddas fortfarande).</p>
      </div>
    );
  }

  return (
    <div className="sida sida--bred">
      <div className="kund-layout__rubrik">
        <h1>{org.namn}</h1>
        <span>{AVTALSSTATUS_ETIKETT[org.avtalsstatus] ?? org.avtalsstatus}</span>
        {org.arDemo && <span>🧪 Demo</span>}
        {org.supportAtkomstTill && new Date(org.supportAtkomstTill) > new Date() && <span>🔓 Supportfönster aktivt</span>}
      </div>
      <nav className="kund-layout__flikar" aria-label={`Flikar för ${org.namn}`}>
        {FLIKAR.map((flik) => (
          <NavLink key={flik.till} to={flik.till} end={flik.end} className="kund-layout__flik">
            {flik.namn}
          </NavLink>
        ))}
      </nav>
      <Outlet context={{ ...context, org }} />
    </div>
  );
}
