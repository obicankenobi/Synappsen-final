import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listaOrganisationer,
  skapaOrganisation,
  pausaOrganisation,
  exporteraOrganisation,
  satAvtalsstatus,
  satProvperiod,
  satAvtaladArsavgift,
  blibForstaPlattformsadmin,
} from "../firebase/functions";
import { VERKSAMHETSTYPER } from "../config/verksamhetstyper";
import ManadsrapportSektion from "../components/ManadsrapportSektion";
import "./Leverantor.css";

// Etapp 15d: avtalssignering och betalning sker MEDVETET utanför appen – det här är bara en
// statusflagga leverantörsadmin sätter manuellt, se ETAPPLAN3.md beslutspunkt 6.
const AVTALSSTATUS_ETIKETT = {
  offert: "Offert",
  signerat: "Signerat",
  aktiv: "Aktiv",
  pausad: "Pausad",
  avslutad: "Avslutad",
};

// Etapp 6a: leverantörsvy – en enda plats för att se/administrera ALLA kundorganisationer.
// Åtkomsten avgörs helt server-side (plattformsadmin/{uid}-collectionen, se firestore.rules
// och functions/index.js) – den här sidan är bara ett gränssnitt ovanpå det, ingen egen
// klientkontroll ger faktisk säkerhet.
export default function Leverantor() {
  const [organisationer, setOrganisationer] = useState(null);
  const [sokkvot, setSokkvot] = useState(null);
  const [fel, setFel] = useState(null);
  const [laddar, setLaddar] = useState(true);
  const [namn, setNamn] = useState("");
  const [operations, setOperations] = useState(false);
  const [intelligence, setIntelligence] = useState(false);
  const [verksamhetstyp, setVerksamhetstyp] = useState("");
  const [orgnr, setOrgnr] = useState("");
  const [kontaktNamn, setKontaktNamn] = useState("");
  const [kontaktEpost, setKontaktEpost] = useState("");
  const [anvandartak, setAnvandartak] = useState("");
  const [skapar, setSkapar] = useState(false);
  const [skapadInfo, setSkapadInfo] = useState(null);
  const [inbjudanLank, setInbjudanLank] = useState(null);
  const [atgard, setAtgard] = useState(null);
  const [bootstrapar, setBootstrapar] = useState(false);
  const [exportMeddelande, setExportMeddelande] = useState(null);
  const [provperiodDraft, setProvperiodDraft] = useState({});
  const [arsavgiftDraft, setArsavgiftDraft] = useState({});

  function ladda() {
    setLaddar(true);
    setFel(null);
    return listaOrganisationer()
      .then(({ data }) => {
        setOrganisationer(data.organisationer);
        setSokkvot(data.sokkvot);
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

  async function hanteraSkapa(e) {
    e.preventDefault();
    setSkapar(true);
    setSkapadInfo(null);
    setInbjudanLank(null);
    try {
      const { data } = await skapaOrganisation(namn.trim(), { operations, intelligence }, verksamhetstyp || undefined, {
        orgnr: orgnr.trim() || undefined,
        kontaktperson:
          kontaktNamn.trim() || kontaktEpost.trim()
            ? { namn: kontaktNamn.trim(), epost: kontaktEpost.trim() }
            : undefined,
        anvandartak: anvandartak.trim() || undefined,
      });
      const meddelanden = [];
      if (data.antalMallrutiner > 0) {
        meddelanden.push(`${data.antalMallrutiner} startmall-rutiner`);
      }
      setSkapadInfo(meddelanden.length > 0 ? `Organisationen skapades med ${meddelanden.join(", ")}.` : "Organisationen skapades.");
      if (data.inbjudanToken) {
        setInbjudanLank(`${window.location.origin}/registrera?bjudan=${data.inbjudanToken}`);
      }
      setNamn("");
      setOperations(false);
      setIntelligence(false);
      setVerksamhetstyp("");
      setOrgnr("");
      setKontaktNamn("");
      setKontaktEpost("");
      setAnvandartak("");
      await ladda();
    } catch (e2) {
      setFel(e2);
    } finally {
      setSkapar(false);
    }
  }

  async function hanteraPausa(orgId, pausad) {
    setAtgard(orgId);
    try {
      await pausaOrganisation(orgId, pausad);
      await ladda();
    } catch (e) {
      setFel(e);
    } finally {
      setAtgard(null);
    }
  }

  async function hanteraAvtalsstatus(orgId, avtalsstatus) {
    setAtgard(orgId);
    try {
      await satAvtalsstatus(orgId, avtalsstatus);
      await ladda();
    } catch (e) {
      setFel(e);
    } finally {
      setAtgard(null);
    }
  }

  async function hanteraProvperiod(orgId, provperiodSlut) {
    setAtgard(orgId);
    try {
      await satProvperiod(orgId, provperiodSlut || null);
      await ladda();
    } catch (e) {
      setFel(e);
    } finally {
      setAtgard(null);
    }
  }

  async function hanteraArsavgift(orgId, varde) {
    setAtgard(orgId);
    try {
      const kr = varde === "" ? null : Number(varde);
      await satAvtaladArsavgift(orgId, kr === null || Number.isNaN(kr) ? null : kr);
      await ladda();
    } catch (e) {
      setFel(e);
    } finally {
      setAtgard(null);
    }
  }

  async function hanteraExport(orgId) {
    setAtgard(orgId);
    setExportMeddelande(null);
    try {
      const { data } = await exporteraOrganisation(orgId);
      setExportMeddelande(`Export sparad i Storage: ${data.path}`);
    } catch (e) {
      setFel(e);
    } finally {
      setAtgard(null);
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
        <p className="sida__beskrivning">
          Den här vyn kräver leverantörsadmin-åtkomst, som du inte har.
        </p>
        <p className="sida__beskrivning">
          Om ingen leverantörsadmin finns alls än kan en befintlig superadmin bootstrappa
          sig själv till den första:
        </p>
        <button type="button" className="knapp" disabled={bootstrapar} onClick={hanteraBootstrap}>
          {bootstrapar ? "..." : "Bli första leverantörsadmin"}
        </button>
      </div>
    );
  }

  return (
    <div className="sida">
      <Link to="/">← Hem</Link>
      <h1>🏢 Leverantörsvy</h1>
      <p className="sida__beskrivning">
        Översikt över alla kundorganisationer – moduler, antal användare och senaste
        avslutade månadens AI-kostnad.
      </p>

      {fel && <p className="leverantor__fel">{fel.message}</p>}
      {exportMeddelande && <p className="leverantor__info">{exportMeddelande}</p>}

      {sokkvot && (
        <section className="admin-sektion">
          <h2>🔍 Delad sökkvot idag</h2>
          <p className={sokkvot.totalAntal >= sokkvot.tak * 0.8 ? "leverantor__varning" : "sida__beskrivning"}>
            {sokkvot.totalAntal} / {sokkvot.tak} sökningar (Custom Search, delas av ALLA
            organisationer).{" "}
            {sokkvot.totalAntal >= sokkvot.tak * 0.8 &&
              "⚠️ Nära dagstaket – klinikstöd kan sluta fungera för alla kunder om taket nås."}
          </p>
        </section>
      )}

      <section className="admin-sektion">
        <h2>Skapa ny organisation</h2>
        <form className="leverantor__form" onSubmit={hanteraSkapa}>
          <label>
            Namn
            <input type="text" required value={namn} onChange={(e) => setNamn(e.target.value)} />
          </label>
          <label className="leverantor__checkbox">
            <input type="checkbox" checked={operations} onChange={(e) => setOperations(e.target.checked)} />
            Operations
          </label>
          <label className="leverantor__checkbox">
            <input type="checkbox" checked={intelligence} onChange={(e) => setIntelligence(e.target.checked)} />
            Intelligence
          </label>
          <label>
            Startbibliotek (valfritt)
            <select value={verksamhetstyp} onChange={(e) => setVerksamhetstyp(e.target.value)}>
              {VERKSAMHETSTYPER.map((v) => (
                <option key={v.varde} value={v.varde}>
                  {v.namn}
                </option>
              ))}
            </select>
          </label>
          <label>
            Org.nr (valfritt)
            <input type="text" value={orgnr} onChange={(e) => setOrgnr(e.target.value)} />
          </label>
          <label>
            Kontaktperson – namn (valfritt)
            <input type="text" value={kontaktNamn} onChange={(e) => setKontaktNamn(e.target.value)} />
          </label>
          <label>
            Kontaktperson – e-post (valfritt, bjuder in som superadmin)
            <input
              type="email"
              value={kontaktEpost}
              onChange={(e) => setKontaktEpost(e.target.value)}
              placeholder="kontakt@kund.se"
            />
          </label>
          <label>
            Användartak (valfritt)
            <input
              type="number"
              min="1"
              value={anvandartak}
              onChange={(e) => setAnvandartak(e.target.value)}
            />
          </label>
          <button type="submit" className="knapp" disabled={skapar}>
            {skapar ? "Skapar..." : "Skapa organisation"}
          </button>
        </form>
        {skapadInfo && <p className="leverantor__info">{skapadInfo}</p>}
        {inbjudanLank && (
          <div className="leverantor__info">
            <p>Skicka den här länken till kundens första superadmin (giltig i 7 dagar):</p>
            <input type="text" readOnly value={inbjudanLank} onFocus={(e) => e.target.select()} />
          </div>
        )}
      </section>

      <section className="admin-sektion">
        {/* Etapp 43e: `organisationer` är `null` tills anropet lyckas – om `fel` sätts till
            NÅGOT annat än exakt `permission-denied` (t.ex. ett nätverksfel eller en annan
            functions-felkod) faller renderingen igenom till här med `organisationer` fortfarande
            `null`, vilket kraschade sidan (bekräftat i en riktig webbläsare). `?? []` täcker alla
            felfall, inte bara det enda som redan hade en egen tidig retur. */}
        <h2>Organisationer ({(organisationer ?? []).length})</h2>
        <p className="sida__beskrivning">
          "Avtalat pris" fylls i manuellt och är inte kopplat till någon betalningstjänst.
          Ställt mot "Senaste avslutade månad" ger det en GROV fingervisning, inte ett
          täckningsbidrag – den siffran täcker bara AI-kostnad, inte Firestore/Storage/
          Functions-kostnad. Fullständig molnkostnad kräver GCP-faktureringsexport till
          BigQuery, ett ägarbeslut (se <code>ETAPPLAN10.md</code> Etapp 48c).
        </p>
        <ul className="admin-lista">
          {(organisationer ?? []).map((org) => (
            <li key={org.orgId} className="admin-lista__rad leverantor__rad">
              <div>
                <strong>{org.namn}</strong>{" "}
                {org.status === "pausad" && <span className="leverantor__pausad">⏸ Pausad</span>}
                <div className="admin-lista__email">
                  {org.antalAnvandare} användare · Operations {org.moduler?.operations ? "✅" : "❌"} ·
                  {" "}Intelligence {org.moduler?.intelligence ? "✅" : "❌"}
                  {org.senasteKostnad && (
                    <> · Senaste avslutade månad: {(org.senasteKostnad.anvantOre / 100).toFixed(2)} kr</>
                  )}
                  {org.sokkvotIdag > 0 && <> · Sökkvot idag: {org.sokkvotIdag}</>}
                  {org.avtaladArsavgiftKr != null && (
                    <> · Avtalat: {org.avtaladArsavgiftKr.toLocaleString("sv-SE")} kr/år</>
                  )}
                  {org.provperiodSlut && <> · Provperiod t.o.m. {org.provperiodSlut}</>}
                </div>
              </div>
              <div className="admin-lista__atgarder">
                <label className="leverantor__avtalsstatus">
                  Avtalsstatus
                  <select
                    value={org.avtalsstatus}
                    disabled={atgard === org.orgId}
                    onChange={(e) => hanteraAvtalsstatus(org.orgId, e.target.value)}
                  >
                    {Object.entries(AVTALSSTATUS_ETIKETT).map(([varde, etikett]) => (
                      <option key={varde} value={varde}>
                        {etikett}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="leverantor__avtalsstatus">
                  Provperiod t.o.m.
                  <input
                    type="date"
                    value={provperiodDraft[org.orgId] ?? org.provperiodSlut ?? ""}
                    disabled={atgard === org.orgId}
                    onChange={(e) =>
                      setProvperiodDraft((d) => ({ ...d, [org.orgId]: e.target.value }))
                    }
                  />
                </label>
                <button
                  type="button"
                  className="knapp knapp--liten"
                  disabled={atgard === org.orgId}
                  onClick={() => hanteraProvperiod(org.orgId, provperiodDraft[org.orgId] ?? org.provperiodSlut)}
                >
                  Spara provperiod
                </button>
                <label className="leverantor__avtalsstatus">
                  Avtalat pris (kr/år)
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Ej ifyllt"
                    value={arsavgiftDraft[org.orgId] ?? org.avtaladArsavgiftKr ?? ""}
                    disabled={atgard === org.orgId}
                    onChange={(e) =>
                      setArsavgiftDraft((d) => ({ ...d, [org.orgId]: e.target.value }))
                    }
                  />
                </label>
                <button
                  type="button"
                  className="knapp knapp--liten"
                  disabled={atgard === org.orgId}
                  onClick={() =>
                    hanteraArsavgift(org.orgId, arsavgiftDraft[org.orgId] ?? org.avtaladArsavgiftKr ?? "")
                  }
                >
                  Spara pris
                </button>
                <button
                  type="button"
                  className="knapp knapp--liten"
                  disabled={atgard === org.orgId}
                  onClick={() => hanteraPausa(org.orgId, org.status !== "pausad")}
                >
                  {org.status === "pausad" ? "Återaktivera" : "Pausa"}
                </button>
                <button
                  type="button"
                  className="knapp knapp--liten"
                  disabled={atgard === org.orgId}
                  onClick={() => hanteraExport(org.orgId)}
                >
                  Exportera
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <ManadsrapportSektion />
    </div>
  );
}
