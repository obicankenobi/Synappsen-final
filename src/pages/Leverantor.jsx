import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listaOrganisationer,
  skapaOrganisation,
  pausaOrganisation,
  exporteraOrganisation,
  blibForstaPlattformsadmin,
} from "../firebase/functions";
import { VERKSAMHETSTYPER } from "../config/verksamhetstyper";
import "./Leverantor.css";

// Etapp 6a: leverantörsvy – en enda plats för att se/administrera ALLA kundorganisationer.
// Åtkomsten avgörs helt server-side (plattformsadmin/{uid}-collectionen, se firestore.rules
// och functions/index.js) – den här sidan är bara ett gränssnitt ovanpå det, ingen egen
// klientkontroll ger faktisk säkerhet.
export default function Leverantor() {
  const [organisationer, setOrganisationer] = useState(null);
  const [fel, setFel] = useState(null);
  const [laddar, setLaddar] = useState(true);
  const [namn, setNamn] = useState("");
  const [operations, setOperations] = useState(false);
  const [intelligence, setIntelligence] = useState(false);
  const [verksamhetstyp, setVerksamhetstyp] = useState("");
  const [skapar, setSkapar] = useState(false);
  const [skapadInfo, setSkapadInfo] = useState(null);
  const [atgard, setAtgard] = useState(null);
  const [bootstrapar, setBootstrapar] = useState(false);
  const [exportMeddelande, setExportMeddelande] = useState(null);

  function ladda() {
    setLaddar(true);
    setFel(null);
    return listaOrganisationer()
      .then(({ data }) => setOrganisationer(data.organisationer))
      .catch((e) => setFel(e))
      .finally(() => setLaddar(false));
  }

  // Den allra första laddningen (vid mount) undviker att anropa ladda() direkt – dess första
  // rader sätter state synkront, vilket react-hooks/set-state-in-effect flaggar. laddar/fel
  // har redan rätt startvärden (true/null) så bara resultatet behöver sättas här.
  useEffect(() => {
    listaOrganisationer()
      .then(({ data }) => setOrganisationer(data.organisationer))
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
    try {
      const { data } = await skapaOrganisation(namn.trim(), { operations, intelligence }, verksamhetstyp || undefined);
      if (data.antalMallrutiner > 0) {
        setSkapadInfo(`Organisationen skapades med ${data.antalMallrutiner} startmall-rutiner.`);
      }
      setNamn("");
      setOperations(false);
      setIntelligence(false);
      setVerksamhetstyp("");
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
          <button type="submit" className="knapp" disabled={skapar}>
            {skapar ? "Skapar..." : "Skapa organisation"}
          </button>
        </form>
        {skapadInfo && <p className="leverantor__info">{skapadInfo}</p>}
      </section>

      <section className="admin-sektion">
        <h2>Organisationer ({organisationer.length})</h2>
        <ul className="admin-lista">
          {organisationer.map((org) => (
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
                </div>
              </div>
              <div className="admin-lista__atgarder">
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
    </div>
  );
}
