import { useState } from "react";
import { Link } from "react-router-dom";
import SokFalt from "../components/SokFalt";
import SektionsKort from "../components/SektionsKort";
import SedanForraPassetKort from "../components/SedanForraPassetKort";
import Notisklocka from "../components/Notisklocka";
import MinaUppgifter from "../components/MinaUppgifter";
import MinaForslag from "../components/MinaForslag";
import Personalpuls from "../components/Personalpuls";
import VeckansRepetition from "../components/VeckansRepetition";
import KomIgangChecklista from "../components/KomIgangChecklista";
import GodkannandeBanner from "../components/GodkannandeBanner";
import { useAuth } from "../hooks/useAuth";
import { useMinaFavoritPoster } from "../hooks/useMinaFavoritPoster";
import { usePopularaste } from "../hooks/useVisningar";
import { useSnabblankar } from "../hooks/useSnabblankar";
import { useSenastBesokta } from "../hooks/useSenastBesokta";
import { useStartvyKonfiguration } from "../hooks/useStartvyKonfiguration";
import { useOrganisationBranding } from "../hooks/useOrganisationBranding";
import { STARTVY_BLOCK } from "../config/startvy";
import { ROLE_LABELS, ROLES, arRedaktor } from "../firebase/roles";

// Etapp 43b: bekräftat i en riktig 375px-skärmdump under 42f:s byggpass att snabblänkarna
// (upp till 10 st, valbara per användare i Profil.jsx men ALLA visas som standard – se
// useSnabblankar.js) tar upp fem rader innan sökfältet ens syns. Reglerna kunde inte ändras
// (skulle ändra beteendet för alla befintliga användare som aldrig anpassat sina val, inte
// bara nya) – istället visas bara de första fyra, resten bakom en "Fler"-växlare.
const SNABBLANKAR_ALLTID_SYNLIGA = 4;

export default function Hem() {
  const { currentUser, role, namn, loggaUt } = useAuth();
  const favoritPoster = useMinaFavoritPoster();
  const populara = usePopularaste(5);
  const { synliga: snabblankar } = useSnabblankar(currentUser?.uid);
  const [visaAllaSnabblankar, setVisaAllaSnabblankar] = useState(false);
  const doldaSnabblankar = Math.max(0, snabblankar.length - SNABBLANKAR_ALLTID_SYNLIGA);
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

      {/* Etapp 42c: den här knappen fanns tidigare bara på Hem – ersatt av en global,
          flytande knapp (AkutKnappFloating.jsx, monterad i App.jsx) som syns på alla sidor. */}

      {/* Etapp 42d: bara monterad (och därmed bara Firestore-lyssnande) för roller som
          faktiskt kan godkänna något – se GodkannandeBanner.jsx/useGodkannandeKo.js. */}
      {arRedaktor(role) && <GodkannandeBanner />}

      {/* Etapp 45c: aria-label krävs eftersom det redan finns en annan <nav> (BottomNav) på
          sidan – två landmärken av samma typ utan unik namngivning blir odistinguerbara för
          en skärmläsaranvändare som navigerar landmärkesvis (axe-core: landmark-unique). */}
      <nav className="hem__snabblankar" aria-label="Snabblänkar">
        {(visaAllaSnabblankar ? snabblankar : snabblankar.slice(0, SNABBLANKAR_ALLTID_SYNLIGA)).map((s) => (
          <Link key={s.nyckel} to={s.sokvag}>
            {s.ikon} {s.namn}
          </Link>
        ))}
        {doldaSnabblankar > 0 && (
          <button
            type="button"
            className="hem__snabblankar-fler"
            onClick={() => setVisaAllaSnabblankar((v) => !v)}
          >
            {visaAllaSnabblankar ? "Färre ▲" : `Fler (${doldaSnabblankar}) ▾`}
          </button>
        )}
      </nav>

      <SokFalt />

      <MinaUppgifter />
      <MinaForslag />
      <VeckansRepetition />
      <Personalpuls />

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

      {/* Etapp 42d: sida vid sida på bred skärm, staplat på smal (se .hem__sektion-rad) –
          samma två listor som redan fanns, bara omplacerade. */}
      <div className="hem__sektion-rad">
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
      </div>

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
