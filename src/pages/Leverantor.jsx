import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listaOrganisationer, blibForstaPlattformsadmin } from "../firebase/functions";
import ManadsrapportSektion from "../components/ManadsrapportSektion";
import BaspaketreferenserSektion from "../components/BaspaketreferenserSektion";
import NyckeltalSektion from "../components/leverantor/NyckeltalSektion";
import KraverAtgardSektion from "../components/leverantor/KraverAtgardSektion";
import EpostNodstoppSektion from "../components/leverantor/EpostNodstoppSektion";
import SkapaOrganisationSektion from "../components/leverantor/SkapaOrganisationSektion";
import DemomiljoSektion from "../components/leverantor/DemomiljoSektion";
import HuvudmanSektion from "../components/leverantor/HuvudmanSektion";
import OrganisationsListaSektion from "../components/leverantor/OrganisationsListaSektion";
import { berakLeverantorSignaler } from "../utils/leverantorSignaler";
import { filtreraOchSorteraOrganisationer, SORT_FALT } from "../utils/leverantorFilter";
import "./Leverantor.css";

// Etapp 6a: leverantörsvy – en enda plats för att se/administrera ALLA kundorganisationer.
// Åtkomsten avgörs helt server-side (plattformsadmin/{uid}-collectionen, se firestore.rules
// och functions/index.js) – den här sidan är bara ett gränssnitt ovanpå det, ingen egen
// klientkontroll ger faktisk säkerhet.
//
// Etapp 67e (ETAPPLAN16.md): sidan var 1145 rader innan uppdelningen (990 innan 67a–67d
// byggdes ovanpå). Den håller nu bara kvar det som genuint delas mellan flera sektioner –
// den initiala datahämtningen, och filter-/sorterings-/söktillståndet i URL:en, som både
// NyckeltalSektion (nyckeltalsrutornas snabbfilter) och OrganisationsListaSektion behöver.
// Allt annat (formulär, listrader, paneler) flyttades till src/components/leverantor/, samma
// mönster och katalogkonvention som Etapp 8c redan etablerade för Admin.jsx.
export default function Leverantor() {
  const [organisationer, setOrganisationer] = useState(null);
  const [sokkvot, setSokkvot] = useState(null);
  const [fel, setFel] = useState(null);
  const [laddar, setLaddar] = useState(true);
  const [bootstrapar, setBootstrapar] = useState(false);
  const [epostAvstangd, setEpostAvstangd] = useState(false);

  // Etapp 67d: hela filter-/sorterings-/söktillståndet lever i URL:en (?snabb=atgard&status=
  // pausad&...) istället för lokal state, så en vy går att länka till och bokmärka. Kvarstår
  // från 67b: `snabb` (nyckeltalsrutornas genväg) är en ANNAN dimension än de detaljerade
  // filtren och kombineras med AND av filtreraOchSorteraOrganisationer, inte ersätts av dem.
  const [sokparametrar, setSokparametrar] = useSearchParams();
  const snabbfilter = sokparametrar.get("snabb");
  const statusFilter = sokparametrar.get("status") ?? "";
  const avtalsstatusFilter = sokparametrar.get("avtalsstatus") ?? "";
  const modulFilter = sokparametrar.get("modul") ?? "";
  // Standard = visa (matchar det oförändrade beteendet innan 67d fanns) – "demo=0" krävs
  // uttryckligen i URL:en för att DÖLJA, aldrig tvärtom.
  const visaDemo = sokparametrar.get("demo") !== "0";
  const sokterm = sokparametrar.get("sok") ?? "";
  const sortField = sokparametrar.get("sort") ?? SORT_FALT.NAMN;
  const sortRiktning = sokparametrar.get("riktning") ?? "asc";

  // En enda uppdateringsfunktion för alla filterkontroller: `null`/`""` tar bort parametern
  // istället för att skriva ut den tom, så URL:en förblir kort och läsbar
  // (`/leverantor?status=pausad`, inte `/leverantor?status=pausad&avtalsstatus=&modul=...`).
  // `replace: true` eftersom varje knapptryck/tangentslag annars skulle lägga en egen post i
  // webbläsarhistoriken – bakåtknappen ska ta dig bort från sidan, inte igenom varje bokstav
  // som skrivits i sökfältet.
  function uppdateraFilter(patch) {
    setSokparametrar(
      (fore) => {
        const efter = new URLSearchParams(fore);
        for (const [nyckel, varde] of Object.entries(patch)) {
          if (varde === null || varde === "" || varde === undefined) efter.delete(nyckel);
          else efter.set(nyckel, String(varde));
        }
        return efter;
      },
      { replace: true }
    );
  }

  // Etapp 67b/67c: EN beräkning, delad mellan nyckeltalsrutan ("Kräver åtgärd": {n}) och
  // 67c:s lista – annars räknas samma sju villkor ut på två ställen och riskerar att glida
  // isär.
  const signaler = useMemo(() => berakLeverantorSignaler(organisationer, sokkvot), [organisationer, sokkvot]);
  const orgIdMedSignal = useMemo(() => new Set(signaler.map((s) => s.orgId)), [signaler]);

  const visadeOrganisationer = useMemo(
    () =>
      filtreraOchSorteraOrganisationer(
        organisationer,
        {
          snabbfilter,
          status: statusFilter,
          avtalsstatus: avtalsstatusFilter,
          modul: modulFilter,
          visaDemo,
          sok: sokterm,
          sortField,
          sortRiktning,
        },
        orgIdMedSignal
      ),
    [organisationer, snabbfilter, statusFilter, avtalsstatusFilter, modulFilter, visaDemo, sokterm, sortField, sortRiktning, orgIdMedSignal]
  );
  const nagotFilterAktivt =
    Boolean(snabbfilter) || Boolean(statusFilter) || Boolean(avtalsstatusFilter) || Boolean(modulFilter) || Boolean(sokterm) || !visaDemo;

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

  // Den allra första laddningen (vid mount) undviker att anropa ladda() direkt – dess första
  // rader sätter state synkront, vilket react-hooks/set-state-in-effect flaggar. laddar/fel
  // har redan rätt startvärden (true/null) så bara resultatet behöver sättas här.
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

  if (laddar) {
    return (
      <div className="sida">
        <Link to="/">← Hem</Link>
        <h1>🏢 Leverantörsvy</h1>
        <p>Laddar...</p>
      </div>
    );
  }

  if (fel?.code === "permission-denied") {
    return (
      <div className="sida">
        <Link to="/">← Hem</Link>
        <h1>🏢 Leverantörsvy</h1>
        <p className="sida__beskrivning">Den här vyn kräver leverantörsadmin-åtkomst, som du inte har.</p>
        <p className="sida__beskrivning">
          Om ingen leverantörsadmin finns alls än kan en befintlig superadmin bootstrappa sig
          själv till den första:
        </p>
        <button type="button" className="knapp" disabled={bootstrapar} onClick={hanteraBootstrap}>
          {bootstrapar ? "..." : "Bli första leverantörsadmin"}
        </button>
      </div>
    );
  }

  return (
    <div className="sida sida--bred">
      <Link to="/">← Hem</Link>
      <h1>🏢 Leverantörsvy</h1>
      <p className="sida__beskrivning">
        Översikt över alla kundorganisationer – moduler, antal användare och senaste avslutade
        månadens AI-kostnad.
      </p>

      {fel && <p className="leverantor__fel">{fel.message}</p>}

      <NyckeltalSektion
        organisationer={organisationer}
        sokkvot={sokkvot}
        antalSignaler={signaler.length}
        aktivtFilter={snabbfilter}
        onValjFilter={(v) => uppdateraFilter({ snabb: v })}
      />

      <KraverAtgardSektion signaler={signaler} />

      <EpostNodstoppSektion epostAvstangd={epostAvstangd} onAndrad={setEpostAvstangd} onFel={setFel} />

      <SkapaOrganisationSektion onSkapad={ladda} onFel={setFel} />

      <DemomiljoSektion onNollstallt={ladda} onFel={setFel} />

      <HuvudmanSektion organisationer={organisationer} />

      <OrganisationsListaSektion
        organisationer={organisationer}
        sokkvot={sokkvot}
        visadeOrganisationer={visadeOrganisationer}
        nagotFilterAktivt={nagotFilterAktivt}
        sokterm={sokterm}
        avtalsstatusFilter={avtalsstatusFilter}
        statusFilter={statusFilter}
        modulFilter={modulFilter}
        sortField={sortField}
        sortRiktning={sortRiktning}
        visaDemo={visaDemo}
        uppdateraFilter={uppdateraFilter}
        onRensaFilter={() => setSokparametrar(new URLSearchParams(), { replace: true })}
        ladda={ladda}
        onFel={setFel}
      />

      <BaspaketreferenserSektion />

      <ManadsrapportSektion />
    </div>
  );
}
