import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import {
  listaOrganisationer,
  skapaOrganisation,
  pausaOrganisation,
  exporteraOrganisation,
  satAvtalsstatus,
  satProvperiod,
  satAvtaladArsavgift,
  satSokkvotTakPerDygn,
  avbrytRaderingAvOrganisation,
  blibForstaPlattformsadmin,
  hamtaOrganisationsdiagnostik,
  avslutaSupportAtkomst,
  nollstallDemoOrganisation,
} from "../firebase/functions";
import { VERKSAMHETSTYPER } from "../config/verksamhetstyper";
import ManadsrapportSektion from "../components/ManadsrapportSektion";
import "./Leverantor.css";

// Etapp 50b: läses direkt av leverantörens klient mot Firestore (inte via en Cloud Function) –
// exercerar samma firestore.rules-fönster (farSupportlasa) som en riktig support-situation
// skulle göra. Bara aktiv under ett kundbeviljat supportfönster, se firestore.rules.
const SUPPORTINNEHALL_COLLECTIONS = [
  { namn: "rutiner", falt: "titel" },
  { namn: "forradsartiklar", falt: "namn" },
  { namn: "anslag", falt: "titel" },
  { namn: "kontakter", falt: "namn" },
];

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
  const { currentUser } = useAuth();
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
  const [sokkvotTakDraft, setSokkvotTakDraft] = useState({});
  const [diagnostikOppen, setDiagnostikOppen] = useState(null);
  const [diagnostikData, setDiagnostikData] = useState({});
  const [diagnostikLaddar, setDiagnostikLaddar] = useState(false);
  const [innehallOppen, setInnehallOppen] = useState(null);
  const [innehallData, setInnehallData] = useState({});
  const [innehallLaddar, setInnehallLaddar] = useState(false);
  const [arendenOppen, setArendenOppen] = useState(null);
  const [arendenData, setArendenData] = useState({});
  const [arendenLaddar, setArendenLaddar] = useState(false);
  const [nyttArendeText, setNyttArendeText] = useState("");
  const [arendeSparar, setArendeSparar] = useState(false);
  const [demoEpost, setDemoEpost] = useState("");
  const [demoNollstaller, setDemoNollstaller] = useState(false);
  const [demoInbjudanLank, setDemoInbjudanLank] = useState(null);
  const [demoMeddelande, setDemoMeddelande] = useState(null);

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

  async function hanteraSokkvotTak(orgId, varde) {
    setAtgard(orgId);
    try {
      const tak = varde === "" ? null : Number(varde);
      await satSokkvotTakPerDygn(orgId, tak === null || Number.isNaN(tak) ? null : tak);
      await ladda();
    } catch (e) {
      setFel(e);
    } finally {
      setAtgard(null);
    }
  }

  async function hanteraAvbrytRadering(orgId) {
    setAtgard(orgId);
    try {
      await avbrytRaderingAvOrganisation(orgId);
      await ladda();
    } catch (e) {
      setFel(e);
    } finally {
      setAtgard(null);
    }
  }

  async function hanteraDiagnostik(orgId) {
    if (diagnostikOppen === orgId) {
      setDiagnostikOppen(null);
      return;
    }
    setDiagnostikOppen(orgId);
    if (diagnostikData[orgId]) {
      return;
    }
    setDiagnostikLaddar(true);
    try {
      const { data } = await hamtaOrganisationsdiagnostik(orgId);
      setDiagnostikData((d) => ({ ...d, [orgId]: data }));
    } catch (e) {
      setFel(e);
    } finally {
      setDiagnostikLaddar(false);
    }
  }

  async function hanteraAvslutaSupportAtkomst(orgId) {
    setAtgard(orgId);
    try {
      await avslutaSupportAtkomst(orgId);
      await ladda();
    } catch (e) {
      setFel(e);
    } finally {
      setAtgard(null);
    }
  }

  async function hanteraVisaInnehall(orgId) {
    if (innehallOppen === orgId) {
      setInnehallOppen(null);
      return;
    }
    setInnehallOppen(orgId);
    if (innehallData[orgId]) {
      return;
    }
    setInnehallLaddar(true);
    try {
      const perCollection = await Promise.all(
        SUPPORTINNEHALL_COLLECTIONS.map(async ({ namn, falt }) => {
          const snap = await getDocs(query(collection(db, namn), where("organisationId", "==", orgId)));
          return [namn, snap.docs.map((d) => ({ id: d.id, titel: d.data()[falt] ?? "(utan titel)", status: d.data().status ?? null }))];
        })
      );
      setInnehallData((d) => ({ ...d, [orgId]: Object.fromEntries(perCollection) }));
    } catch (e) {
      setFel(e);
    } finally {
      setInnehallLaddar(false);
    }
  }

  async function hanteraArenden(orgId) {
    if (arendenOppen === orgId) {
      setArendenOppen(null);
      return;
    }
    setArendenOppen(orgId);
    setNyttArendeText("");
    await laddaArenden(orgId);
  }

  async function laddaArenden(orgId) {
    setArendenLaddar(true);
    try {
      const snap = await getDocs(
        query(collection(db, "organisationer", orgId, "arendeanteckningar"), orderBy("skapadTidpunkt", "desc"))
      );
      setArendenData((d) => ({ ...d, [orgId]: snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) }));
    } catch (e) {
      setFel(e);
    } finally {
      setArendenLaddar(false);
    }
  }

  async function hanteraLaggTillArende(orgId) {
    const text = nyttArendeText.trim();
    if (!text || !currentUser) return;
    setArendeSparar(true);
    try {
      await addDoc(collection(db, "organisationer", orgId, "arendeanteckningar"), {
        text,
        skapadAv: currentUser.uid,
        skapadTidpunkt: serverTimestamp(),
      });
      setNyttArendeText("");
      await laddaArenden(orgId);
    } catch (e) {
      setFel(e);
    } finally {
      setArendeSparar(false);
    }
  }

  async function hanteraTaBortArende(orgId, arendeId) {
    setArendeSparar(true);
    try {
      await deleteDoc(doc(db, "organisationer", orgId, "arendeanteckningar", arendeId));
      await laddaArenden(orgId);
    } catch (e) {
      setFel(e);
    } finally {
      setArendeSparar(false);
    }
  }

  async function hanteraNollstallDemo(e) {
    e.preventDefault();
    setDemoNollstaller(true);
    setDemoMeddelande(null);
    setDemoInbjudanLank(null);
    try {
      const { data } = await nollstallDemoOrganisation(demoEpost.trim() || undefined);
      if (data.inbjudanToken) {
        setDemoInbjudanLank(`${window.location.origin}/registrera?bjudan=${data.inbjudanToken}`);
        setDemoMeddelande("Demomiljön nollställd med nytt exempelinnehåll. Inbjudan skapad.");
      } else {
        setDemoMeddelande("Demomiljön nollställd med nytt exempelinnehåll.");
      }
      setDemoEpost("");
      await ladda();
    } catch (e2) {
      setFel(e2);
    } finally {
      setDemoNollstaller(false);
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
        <h2>🎓 Demo- och övningsmiljö</h2>
        <p className="sida__beskrivning">
          En egen organisation ("_demo") med fiktivt exempelinnehåll – aldrig en riktig kund,
          aldrig i faktureringsunderlaget. Nollställs automatiskt varje natt 04:00. Fyll i en
          e-postadress för att direkt få en färsk superadmin-inbjudan till den personen (giltig
          i 7 dagar) – annars nollställs bara innehållet.
        </p>
        <form className="leverantor__form" onSubmit={hanteraNollstallDemo}>
          <label>
            E-post för inbjudan (valfritt)
            <input
              type="email"
              value={demoEpost}
              onChange={(e) => setDemoEpost(e.target.value)}
              placeholder="prospekt@exempel.se"
            />
          </label>
          <button type="submit" className="knapp" disabled={demoNollstaller}>
            {demoNollstaller ? "..." : "Nollställ demomiljön nu"}
          </button>
        </form>
        {demoMeddelande && <p className="leverantor__info">{demoMeddelande}</p>}
        {demoInbjudanLank && (
          <div className="leverantor__info">
            <p>Skicka den här länken (giltig i 7 dagar):</p>
            <input type="text" readOnly value={demoInbjudanLank} onFocus={(e) => e.target.select()} />
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
                {org.status === "raderad" && <span className="leverantor__fel">🗑️ Raderad</span>}
                {org.arDemo && <span className="leverantor__pausad">🎓 Demo</span>}
                {org.raderingSchemalagdTill && (
                  <div className="leverantor__fel">
                    ⚠️ Radering schemalagd till {new Date(org.raderingSchemalagdTill).toLocaleString("sv-SE")}.
                    Anledning: "{org.raderingAnledning}".{" "}
                    <button
                      type="button"
                      className="knapp knapp--liten"
                      disabled={atgard === org.orgId}
                      onClick={() => hanteraAvbrytRadering(org.orgId)}
                    >
                      Avbryt radering
                    </button>
                  </div>
                )}
                {org.supportAtkomstTill && new Date(org.supportAtkomstTill) > new Date() && (
                  <div className="leverantor__varning">
                    🔓 Supportåtkomst aktiv till {new Date(org.supportAtkomstTill).toLocaleString("sv-SE")}.
                    Anledning: "{org.supportAtkomstAnledning}".{" "}
                    <button
                      type="button"
                      className="knapp knapp--liten"
                      disabled={atgard === org.orgId}
                      onClick={() => hanteraAvslutaSupportAtkomst(org.orgId)}
                    >
                      Avsluta åtkomsten
                    </button>
                  </div>
                )}
                <div className="admin-lista__email">
                  {org.antalAnvandare} användare · Operations {org.moduler?.operations ? "✅" : "❌"} ·
                  {" "}Intelligence {org.moduler?.intelligence ? "✅" : "❌"}
                  {org.senasteKostnad && (
                    <> · Senaste avslutade månad: {(org.senasteKostnad.anvantOre / 100).toFixed(2)} kr</>
                  )}
                  {org.sokkvotIdag > 0 && (
                    <> · Sökkvot idag: {org.sokkvotIdag} / {org.sokkvotTakPerDygn ?? sokkvot?.orgTakStandard ?? "–"}</>
                  )}
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
                <label className="leverantor__avtalsstatus">
                  Sökkvottak/dygn
                  <input
                    type="number"
                    min="1"
                    max={sokkvot?.tak ?? 100}
                    step="1"
                    placeholder={`Standard (${sokkvot?.orgTakStandard ?? 50})`}
                    value={sokkvotTakDraft[org.orgId] ?? org.sokkvotTakPerDygn ?? ""}
                    disabled={atgard === org.orgId}
                    onChange={(e) =>
                      setSokkvotTakDraft((d) => ({ ...d, [org.orgId]: e.target.value }))
                    }
                  />
                </label>
                <button
                  type="button"
                  className="knapp knapp--liten"
                  disabled={atgard === org.orgId}
                  onClick={() =>
                    hanteraSokkvotTak(org.orgId, sokkvotTakDraft[org.orgId] ?? org.sokkvotTakPerDygn ?? "")
                  }
                >
                  Spara tak
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
                <button
                  type="button"
                  className="knapp knapp--liten"
                  onClick={() => hanteraDiagnostik(org.orgId)}
                >
                  {diagnostikOppen === org.orgId ? "Dölj diagnostik" : "Diagnostik"}
                </button>
                {org.supportAtkomstTill && new Date(org.supportAtkomstTill) > new Date() && (
                  <button
                    type="button"
                    className="knapp knapp--liten"
                    onClick={() => hanteraVisaInnehall(org.orgId)}
                  >
                    {innehallOppen === org.orgId ? "Dölj innehåll" : "🔓 Visa innehåll"}
                  </button>
                )}
                <button
                  type="button"
                  className="knapp knapp--liten"
                  onClick={() => hanteraArenden(org.orgId)}
                >
                  {arendenOppen === org.orgId ? "Dölj ärenden" : "🗒️ Ärenden"}
                </button>
              </div>
              {diagnostikOppen === org.orgId && (
                <div className="leverantor__diagnostik">
                  {diagnostikLaddar && !diagnostikData[org.orgId] ? (
                    <p>Laddar diagnostik...</p>
                  ) : (
                    (() => {
                      const d = diagnostikData[org.orgId];
                      if (!d) return null;
                      return (
                        <>
                          <p className="sida__beskrivning">
                            Strukturell hälsa – antal och tidpunkter, aldrig dokumentinnehåll.
                            Visningen loggas i organisationens egen revisionslogg.
                          </p>
                          <ul className="leverantor__diagnostik-lista">
                            {Object.entries(d.antalDokument).map(([namn, antal]) => (
                              <li key={namn}>
                                {namn}: {antal}
                              </li>
                            ))}
                          </ul>
                          <p>
                            Senaste loggade händelse:{" "}
                            {d.senasteHandelse
                              ? `${d.senasteHandelse.handelsetyp} (${new Date(d.senasteHandelse.tidpunkt).toLocaleString("sv-SE")})`
                              : "Ingen"}
                          </p>
                          <p>
                            Backup:{" "}
                            {d.backupstatus.harOperationsModul
                              ? `${d.backupstatus.antalBackuper} st, senast ${d.backupstatus.senasteDatum ?? "aldrig"}`
                              : "Kräver Operations-modulen"}
                          </p>
                          <p className="sida__beskrivning">
                            Felfrekvens (t.ex. upprepade nekade anrop) är ännu inte tillgänglig
                            här – kräver ett separat Sentry API-token, se{" "}
                            <code>ETAPPLAN5.md</code> §32b.
                          </p>
                        </>
                      );
                    })()
                  )}
                </div>
              )}
              {innehallOppen === org.orgId && (
                <div className="leverantor__diagnostik">
                  {innehallLaddar && !innehallData[org.orgId] ? (
                    <p>Laddar innehåll...</p>
                  ) : (
                    (() => {
                      const inn = innehallData[org.orgId];
                      if (!inn) return null;
                      return (
                        <>
                          <p className="sida__beskrivning">
                            🔓 Läses under det aktiva supportfönstret – organisationen ser i sin
                            egen adminpanel att detta pågår.
                          </p>
                          {SUPPORTINNEHALL_COLLECTIONS.map(({ namn }) => (
                            <div key={namn}>
                              <strong>{namn} ({inn[namn]?.length ?? 0})</strong>
                              <ul className="leverantor__diagnostik-lista">
                                {(inn[namn] ?? []).map((post) => (
                                  <li key={post.id}>
                                    {post.titel}
                                    {post.status && ` (${post.status})`}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </>
                      );
                    })()
                  )}
                </div>
              )}
              {arendenOppen === org.orgId && (
                <div className="leverantor__diagnostik">
                  <p className="sida__beskrivning">
                    Internt leverantörsminne – syns aldrig för organisationens egna
                    användare, oavsett roll.
                  </p>
                  {arendenLaddar && !arendenData[org.orgId] ? (
                    <p>Laddar ärenden...</p>
                  ) : (
                    <ul className="leverantor__diagnostik-lista leverantor__arendelista">
                      {(arendenData[org.orgId] ?? []).length === 0 && <li>Inga ärenden ännu.</li>}
                      {(arendenData[org.orgId] ?? []).map((a) => (
                        <li key={a.id}>
                          <span>
                            {a.skapadTidpunkt?.toDate
                              ? a.skapadTidpunkt.toDate().toLocaleString("sv-SE")
                              : "..."}
                            {" – "}
                            {a.text}
                          </span>
                          <button
                            type="button"
                            className="knapp knapp--liten"
                            disabled={arendeSparar}
                            onClick={() => hanteraTaBortArende(org.orgId, a.id)}
                          >
                            Ta bort
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="leverantor__form">
                    <label>
                      Ny anteckning
                      <textarea
                        rows={2}
                        value={nyttArendeText}
                        onChange={(e) => setNyttArendeText(e.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      className="knapp knapp--liten"
                      disabled={arendeSparar || !nyttArendeText.trim()}
                      onClick={() => hanteraLaggTillArende(org.orgId)}
                    >
                      {arendeSparar ? "..." : "Lägg till"}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <ManadsrapportSektion />
    </div>
  );
}
