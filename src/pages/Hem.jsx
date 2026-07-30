import { Link } from "react-router-dom";
import SokFalt from "../components/SokFalt";
import SektionsKort from "../components/SektionsKort";
import SedanForraPassetKort from "../components/SedanForraPassetKort";
import Notisklocka from "../components/Notisklocka";
import MinaUppgifter from "../components/MinaUppgifter";
import KomIgangChecklista from "../components/KomIgangChecklista";
import { useAuth } from "../hooks/useAuth";
import { useMinaFavoritPoster } from "../hooks/useMinaFavoritPoster";
import { usePopularaste } from "../hooks/useVisningar";
import { useSnabblankar } from "../hooks/useSnabblankar";
import { useSenastBesokta } from "../hooks/useSenastBesokta";
import { useStartvyKonfiguration } from "../hooks/useStartvyKonfiguration";
import { useOrganisationBranding } from "../hooks/useOrganisationBranding";
import { STARTVY_BLOCK } from "../config/startvy";
import { ROLE_LABELS, ROLES } from "../firebase/roles";

export default function Hem() {
  const { currentUser, role, namn, loggaUt } = useAuth();
  const favoritPoster = useMinaFavoritPoster();
  const populara = usePopularaste(5);
  const { synliga: snabblankar } = useSnabblankar(currentUser?.uid);
  const { senastBesokta } = useSenastBesokta(currentUser?.uid);
  const { blockordningForRoll } = useStartvyKonfiguration();
  const blockordning = blockordningForRoll(role);
  const { branding } = useOrganisationBranding();

  return (
    <div className="sida sida--hem">
      <header className="hem__header">
        <div>
          {branding?.logotypUrl && (
            <img src={branding.logotypUrl} alt="" className="hem__logotyp" />
          )}
          <h1>Synappsen</h1>
          {branding?.valkomsttext && <p className="hem__egen-valkomsttext">{branding.valkomsttext}</p>}
          {currentUser && (
            <p className="hem__valkommen">
              Inloggad som {namn || currentUser.email}
              {role && ` (${ROLE_LABELS[role] ?? role})`}
            </p>
          )}
        </div>
        <div className="hem__header-atgarder">
          <Notisklocka />
          {currentUser && (
            <button className="knapp knapp--sekundar" onClick={loggaUt}>
              Logga ut
            </button>
          )}
        </div>
      </header>

      <Link to="/akutlage" className="hem__akutlage-knapp">
        🚨 Akutläge
      </Link>

      <nav className="hem__snabblankar">
        {snabblankar.map((s) => (
          <Link key={s.nyckel} to={s.sokvag}>
            {s.ikon} {s.namn}
          </Link>
        ))}
      </nav>

      <SokFalt />

      <MinaUppgifter />

      {role === ROLES.SUPERADMIN && <KomIgangChecklista />}

      {favoritPoster.length > 0 && (
        <section className="hem__sektion">
          <h2>⭐ Mina favoriter</h2>
          <ul className="hem__lista">
            {favoritPoster.map((p, i) => (
              <li key={i}>
                <Link to={p.sokvag}>{p.titel}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {senastBesokta.length > 0 && (
        <section className="hem__sektion">
          <h2>🕓 Senast besökta</h2>
          <ul className="hem__lista">
            {senastBesokta.map((p) => (
              <li key={p.id}>
                <Link to={p.sokvag}>{p.titel}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {populara.length > 0 && (
        <section className="hem__sektion">
          <h2>🔥 Mest använda</h2>
          <ul className="hem__lista">
            {populara.map((p) => (
              <li key={p.id}>
                <Link to={p.sokvag}>{p.titel}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="hem__kort-grid">
        {blockordning.map((nyckel) =>
          nyckel === "sedan-forra-passet" ? (
            <SedanForraPassetKort key={nyckel} />
          ) : (
            <SektionsKort key={nyckel} {...STARTVY_BLOCK[nyckel]} />
          )
        )}
      </div>
    </div>
  );
}
