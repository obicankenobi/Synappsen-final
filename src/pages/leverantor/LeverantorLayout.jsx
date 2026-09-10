import { useEffect, useMemo, useState } from "react";
import { Outlet, Link, Navigate } from "react-router-dom";
import { listaOrganisationer, blibForstaPlattformsadmin } from "../../firebase/functions";
import LeverantorNav from "../../components/leverantor/LeverantorNav";
import { berakLeverantorSignaler, berakAtagandeSignaler, sorteraSignaler } from "../../utils/leverantorSignaler";
import { useAtagandekalender } from "../../hooks/useAtagandekalender";
import { useAuth } from "../../hooks/useAuth";
import "../Leverantor.css";

// Etapp L1m/L1a (intern/ETAPPLAN-INTERN-1.md): panelens EGEN skal. Monterar varken
// BottomNav eller Sidomeny (L1m punkt 2) – de hör till kundens app, och ett organisationslöst
// leverantörskonto navigerar aldrig dit. All datahämtning som flera underrutter delar
// (organisationslistan, signalerna, åtagandekalendern) görs EN gång här och når varje
// underrutt via <Outlet context={...} />, samma mönster React Router själv rekommenderar för
// data som flera syskonrutter behöver (useOutletContext() i varje sidas komponent).
//
// Klientens inloggningskontroll här är BARA UX (snabbare besked, ingen tom sida medan ett
// nätverksanrop pågår i onödan) – den faktiska säkerheten sitter i firestore.rules/Cloud
// Functions (arPlattformsadmin()), som varje enskild rutt redan provas mot i
// tests/rules/plattformskonto.test.mjs och i respektive funktions egna tester.
export default function LeverantorLayout() {
  const { currentUser, loading } = useAuth();
  const [organisationer, setOrganisationer] = useState(null);
  const [sokkvot, setSokkvot] = useState(null);
  const [fel, setFel] = useState(null);
  const [laddar, setLaddar] = useState(true);
  const [bootstrapar, setBootstrapar] = useState(false);
  const [epostAvstangd, setEpostAvstangd] = useState(false);
  const { atagandekalender, laddar: atagandekalenderLaddar } = useAtagandekalender();

  function ladda() {
    setLaddar(true);
    setFel(null);
    return listaOrganisationer()
      .then(({ data }) => {
        setOrganisationer(data.organisationer);
        setSokkvot(data.sokkvot);
        setEpostAvstangd(data.epostAvstangd);
      })
      .catch((e) => setFel(e))
      .finally(() => setLaddar(false));
  }

  // Se motiveringen i den forna Leverantor.jsx (nu borttagen): den allra första laddningen
  // undviker att anropa ladda() direkt eftersom dess synkrona setState-anrop annars flaggas
  // av react-hooks/set-state-in-effect. laddar/fel har redan rätt startvärden.
  useEffect(() => {
    listaOrganisationer()
      .then(({ data }) => {
        setOrganisationer(data.organisationer);
        setSokkvot(data.sokkvot);
        setEpostAvstangd(data.epostAvstangd);
      })
      .catch((e) => setFel(e))
      .finally(() => setLaddar(false));
  }, []);

  const orgSignaler = useMemo(() => berakLeverantorSignaler(organisationer, sokkvot), [organisationer, sokkvot]);
  const atagandeSignaler = useMemo(() => berakAtagandeSignaler(atagandekalender), [atagandekalender]);
  const signaler = useMemo(
    () => sorteraSignaler([...orgSignaler, ...atagandeSignaler]),
    [orgSignaler, atagandeSignaler]
  );
  const orgIdMedSignal = useMemo(() => new Set(orgSignaler.map((s) => s.orgId)), [orgSignaler]);

  async function hanteraBootstrap() {
    setBootstrapar(true);
    try {
      await blibForstaPlattformsadmin();
      await ladda();
    } catch (e) {
      setFel(e);
    } finally {
      setBootstrapar(false);
    }
  }

  if (loading) return null;
  if (!currentUser) return <Navigate to="/logga-in" replace />;

  // De två tidiga returerna nedan är <main id="huvudinnehall">, inte <div>, av samma skäl som
  // den lyckade grenen längst ned: hoppa-till-innehåll-länken i App.jsx pekar på just det
  // id:t, och utan det finns varken något landmärke eller något hoppmål på sidan. Det var en
  // verklig brist (WCAG 1.3.1/2.4.1) som axe-svepet aldrig såg, eftersom laddningsläget
  // passerade för snabbt när Cloud Functions-anropet fick connection refused i testmiljön.
  // Den syntes först när functions-emulatorn började svara på riktigt (2026-09-07).
  if (laddar) {
    return (
      <main className="sida" id="huvudinnehall" tabIndex={-1}>
        <Link to="/">← Hem</Link>
        <h1><span aria-hidden="true">🏢</span> Leverantörsvy</h1>
        <p>Laddar...</p>
      </main>
    );
  }

  if (fel?.code === "permission-denied") {
    return (
      <main className="sida" id="huvudinnehall" tabIndex={-1}>
        <Link to="/">← Hem</Link>
        <h1><span aria-hidden="true">🏢</span> Leverantörsvy</h1>
        <p className="sida__beskrivning">Den här vyn kräver leverantörsadmin-åtkomst, som du inte har.</p>
        <p className="sida__beskrivning">
          Om ingen leverantörsadmin finns alls än kan en befintlig superadmin bootstrappa sig
          själv till den första:
        </p>
        <button type="button" className="knapp" disabled={bootstrapar} onClick={hanteraBootstrap}>
          {bootstrapar ? "..." : "Bli första leverantörsadmin"}
        </button>
      </main>
    );
  }

  return (
    <div className="leverantor-skal">
      <LeverantorNav />
      <main id="huvudinnehall" className="leverantor-skal__innehall" tabIndex={-1}>
        {/* fel kan vara antingen ett Error-objekt (onFel(e), OrganisationsListaSektion.jsx:s
            eget mönster) eller en ren sträng (onFel?.(fel.message ?? "...")), som flera
            sektioner runt om i panelen redan använder – render:a båda formerna korrekt i
            stället för att tysta ned den ena. */}
        {fel && <p className="leverantor__fel">{typeof fel === "string" ? fel : fel.message}</p>}
        <Outlet
          context={{
            organisationer,
            sokkvot,
            epostAvstangd,
            setEpostAvstangd,
            fel,
            setFel,
            ladda,
            signaler,
            orgSignaler,
            orgIdMedSignal,
            atagandekalender,
            atagandekalenderLaddar,
          }}
        />
      </main>
    </div>
  );
}
