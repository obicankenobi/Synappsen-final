import { useState } from "react";
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../hooks/useAuth";
import {
  pausaOrganisation,
  exporteraOrganisation,
  satAvtalsstatus,
  satProvperiod,
  satAvtaladArsavgift,
  satSokkvotTakPerDygn,
  satHuvudman,
  avbrytRaderingAvOrganisation,
  hamtaOrganisationsdiagnostik,
  avslutaSupportAtkomst,
} from "../../firebase/functions";
import { SORT_FALT } from "../../utils/leverantorFilter";
import { AVTALSSTATUS_ETIKETT } from "./avtalsstatusEtikett";
import OrganisationsRad from "./OrganisationsRad";

const SORT_ETIKETT = {
  [SORT_FALT.NAMN]: "Namn",
  [SORT_FALT.ANVANDARE]: "Antal användare",
  [SORT_FALT.PRIS]: "Avtalat pris",
  [SORT_FALT.KOSTNAD]: "Senaste månadens kostnad",
  [SORT_FALT.PROVPERIOD]: "Provperiod t.o.m.",
};

// Etapp 50b: läses direkt av leverantörens klient mot Firestore (inte via en Cloud Function) –
// exercerar samma firestore.rules-fönster (farSupportlasa) som en riktig support-situation
// skulle göra. Bara aktiv under ett kundbeviljat supportfönster, se firestore.rules.
const SUPPORTINNEHALL_COLLECTIONS = [
  { namn: "rutiner", falt: "titel" },
  { namn: "forradsartiklar", falt: "namn" },
  { namn: "anslag", falt: "titel" },
  { namn: "kontakter", falt: "namn" },
];

// Etapp 67e (ETAPPLAN16.md, ren flytt ur Leverantor.jsx – ingen beteendeförändring). Äger
// filterraden (67d), listan och varje rads mutationer/paneler. Filter-/sorterings-/sök-
// TILLSTÅNDET (URL:en) hör hemma i Leverantor.jsx, inte här – NyckeltalSektion behöver samma
// `snabbfilter`-värde, och den renderas som ett SYSKON till den här sektionen, inte ett barn.
//
// `diagnostikOppen`/`innehallOppen`/`arendenOppen` är MEDVETET en enda variabel var (inte en
// map, inte per-rad-state) – exakt den ursprungliga semantiken "bara en organisations panel
// åt gången i HELA listan". En per-rad-state hade tekniskt sett varit en trevligare UX (flera
// paneler öppna samtidigt), men planens "Klart när" kräver oförändrat beteende, inte en
// förbättring smugglad in i en refaktorering.
export default function OrganisationsListaSektion({
  organisationer,
  sokkvot,
  visadeOrganisationer,
  nagotFilterAktivt,
  sokterm,
  avtalsstatusFilter,
  statusFilter,
  modulFilter,
  sortField,
  sortRiktning,
  visaDemo,
  uppdateraFilter,
  onRensaFilter,
  ladda,
  onFel,
}) {
  const { currentUser } = useAuth();
  const [atgard, setAtgard] = useState(null);
  const [exportMeddelande, setExportMeddelande] = useState(null);
  const [provperiodDraft, setProvperiodDraft] = useState({});
  const [arsavgiftDraft, setArsavgiftDraft] = useState({});
  const [huvudmanDraft, setHuvudmanDraft] = useState({});
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

  async function hanteraPausa(orgId, pausad) {
    setAtgard(orgId);
    try {
      await pausaOrganisation(orgId, pausad);
      await ladda();
    } catch (e) {
      onFel(e);
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
      onFel(e);
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
      onFel(e);
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
      onFel(e);
    } finally {
      setAtgard(null);
    }
  }

  async function hanteraHuvudman(orgId, varde) {
    setAtgard(orgId);
    try {
      const trimmat = varde.trim();
      await satHuvudman(orgId, trimmat === "" ? null : trimmat);
      await ladda();
    } catch (e) {
      onFel(e);
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
      onFel(e);
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
      onFel(e);
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
      onFel(e);
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
      onFel(e);
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
      onFel(e);
    } finally {
      setInnehallLaddar(false);
    }
  }

  async function laddaArenden(orgId) {
    setArendenLaddar(true);
    try {
      const snap = await getDocs(query(collection(db, "organisationer", orgId, "arendeanteckningar"), orderBy("skapadTidpunkt", "desc")));
      setArendenData((d) => ({ ...d, [orgId]: snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })) }));
    } catch (e) {
      onFel(e);
    } finally {
      setArendenLaddar(false);
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
      onFel(e);
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
      onFel(e);
    } finally {
      setArendeSparar(false);
    }
  }

  async function hanteraExport(orgId) {
    setAtgard(orgId);
    setExportMeddelande(null);
    try {
      const { data } = await exporteraOrganisation(orgId);
      setExportMeddelande(`Export sparad i Storage: ${data.path}`);
    } catch (e) {
      onFel(e);
    } finally {
      setAtgard(null);
    }
  }

  return (
    <section className="admin-sektion">
      {exportMeddelande && <p className="leverantor__info">{exportMeddelande}</p>}
      {/* Etapp 43e: `organisationer` är `null` tills anropet lyckas – om `fel` sätts till
          NÅGOT annat än exakt `permission-denied` (t.ex. ett nätverksfel eller en annan
          functions-felkod) faller renderingen igenom till här med `organisationer` fortfarande
          `null`, vilket kraschade sidan (bekräftat i en riktig webbläsare). `?? []` täcker alla
          felfall, inte bara det enda som redan hade en egen tidig retur. */}
      <h2>
        Organisationer ({visadeOrganisationer.length}
        {nagotFilterAktivt && ` av ${(organisationer ?? []).length}`})
      </h2>
      <p className="sida__beskrivning">
        "Avtalat pris" fylls i manuellt och är inte kopplat till någon betalningstjänst. Ställt
        mot "Senaste avslutade månad" ger det en GROV fingervisning, inte ett täckningsbidrag –
        den siffran täcker bara AI-kostnad, inte Firestore/Storage/Functions-kostnad.
        Fullständig molnkostnad kräver GCP-faktureringsexport till BigQuery, ett ägarbeslut (se{" "}
        <code>ETAPPLAN10.md</code> Etapp 48c).
      </p>

      {/* Etapp 67d: sortering/filtrering/sök, hela tillståndet speglat i URL:en av Leverantor.jsx. */}
      <div className="leverantor__filterrad">
        <label className="leverantor__filterfalt">
          Sök
          <input type="search" placeholder="Namn eller huvudman" value={sokterm} onChange={(e) => uppdateraFilter({ sok: e.target.value })} />
        </label>
        <label className="leverantor__filterfalt">
          Avtalsstatus
          <select value={avtalsstatusFilter} onChange={(e) => uppdateraFilter({ avtalsstatus: e.target.value })}>
            <option value="">Alla</option>
            {Object.entries(AVTALSSTATUS_ETIKETT).map(([varde, etikett]) => (
              <option key={varde} value={varde}>
                {etikett}
              </option>
            ))}
          </select>
        </label>
        <label className="leverantor__filterfalt">
          Status
          <select value={statusFilter} onChange={(e) => uppdateraFilter({ status: e.target.value })}>
            <option value="">Alla</option>
            <option value="aktiv">Aktiv</option>
            <option value="pausad">Pausad</option>
            <option value="raderad">Raderad</option>
          </select>
        </label>
        <label className="leverantor__filterfalt">
          Modul
          <select value={modulFilter} onChange={(e) => uppdateraFilter({ modul: e.target.value })}>
            <option value="">Alla</option>
            <option value="operations">Operations</option>
            <option value="intelligence">Intelligence</option>
          </select>
        </label>
        <label className="leverantor__filterfalt">
          Sortera på
          <select value={sortField} onChange={(e) => uppdateraFilter({ sort: e.target.value })}>
            {Object.entries(SORT_ETIKETT).map(([varde, etikett]) => (
              <option key={varde} value={varde}>
                {etikett}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="knapp knapp--sekundar knapp--liten"
          onClick={() => uppdateraFilter({ riktning: sortRiktning === "desc" ? null : "desc" })}
          aria-label={sortRiktning === "desc" ? "Sorterar fallande, klicka för stigande" : "Sorterar stigande, klicka för fallande"}
        >
          {sortRiktning === "desc" ? "↓ Fallande" : "↑ Stigande"}
        </button>
        <label className="leverantor__filterfalt leverantor__checkbox">
          <input type="checkbox" checked={visaDemo} onChange={(e) => uppdateraFilter({ demo: e.target.checked ? null : "0" })} />
          Visa demo
        </label>
      </div>

      {nagotFilterAktivt && (
        <button type="button" className="knapp knapp--sekundar knapp--liten" onClick={onRensaFilter}>
          Visa alla (rensa filter)
        </button>
      )}

      <ul className="admin-lista">
        {visadeOrganisationer.map((org) => (
          <OrganisationsRad
            key={org.orgId}
            org={org}
            sokkvot={sokkvot}
            atgard={atgard}
            provperiodDraft={provperiodDraft[org.orgId]}
            onProvperiodDraft={(orgId, varde) => setProvperiodDraft((d) => ({ ...d, [orgId]: varde }))}
            arsavgiftDraft={arsavgiftDraft[org.orgId]}
            onArsavgiftDraft={(orgId, varde) => setArsavgiftDraft((d) => ({ ...d, [orgId]: varde }))}
            huvudmanDraft={huvudmanDraft[org.orgId]}
            onHuvudmanDraft={(orgId, varde) => setHuvudmanDraft((d) => ({ ...d, [orgId]: varde }))}
            sokkvotTakDraft={sokkvotTakDraft[org.orgId]}
            onSokkvotTakDraft={(orgId, varde) => setSokkvotTakDraft((d) => ({ ...d, [orgId]: varde }))}
            onPausa={hanteraPausa}
            onAvtalsstatus={hanteraAvtalsstatus}
            onProvperiod={hanteraProvperiod}
            onArsavgift={hanteraArsavgift}
            onHuvudman={hanteraHuvudman}
            onSokkvotTak={hanteraSokkvotTak}
            onAvbrytRadering={hanteraAvbrytRadering}
            onAvslutaSupportAtkomst={hanteraAvslutaSupportAtkomst}
            onExport={hanteraExport}
            diagnostikApen={diagnostikOppen === org.orgId}
            diagnostikData={diagnostikData[org.orgId]}
            diagnostikLaddar={diagnostikLaddar}
            onVaxlaDiagnostik={hanteraDiagnostik}
            innehallApen={innehallOppen === org.orgId}
            innehallData={innehallData[org.orgId]}
            innehallLaddar={innehallLaddar}
            onVaxlaInnehall={hanteraVisaInnehall}
            arendenApen={arendenOppen === org.orgId}
            arendenData={arendenData[org.orgId]}
            arendenLaddar={arendenLaddar}
            onVaxlaArenden={hanteraArenden}
            nyttArendeText={nyttArendeText}
            onNyttArendeText={setNyttArendeText}
            arendeSparar={arendeSparar}
            onLaggTillArende={hanteraLaggTillArende}
            onTaBortArende={hanteraTaBortArende}
          />
        ))}
      </ul>
    </section>
  );
}
