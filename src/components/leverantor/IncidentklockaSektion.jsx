import { useState } from "react";
import { startaIncident, kvitteraIncidentunderrattelse } from "../../firebase/functions";
import { useIncidenter } from "../../hooks/useIncidenter";
import { berakAterstaende, fristTimmar } from "../../utils/incidentklocka";
import { useDialog } from "../../hooks/useDialog";
import "./IncidentklockaSektion.css";

function formateraAterstaende(timmarKvar) {
  if (timmarKvar <= 0) return "Fristen har gått ut";
  const timmar = Math.floor(timmarKvar);
  const minuter = Math.round((timmarKvar - timmar) * 60);
  return `${timmar} h ${minuter} min kvar`;
}

// Etapp L1p punkt 3 (intern/ETAPPLAN-INTERN-1.md), B11: utför drift/INCIDENT-CHECKLISTA.md
// steg 6 (registrera klockslaget, räkna ned, visa deadline) – ersätter inte checklistan i
// övrigt. Två frister kan gälla samtidigt i SAMMA incident: en organisation märkt NIS2 räknar
// 24 timmar, övriga 72 (granskningar/JURIDISK-GRANSKNING.md risk 15).
export default function IncidentklockaSektion({ organisationer, onFel }) {
  const { incidenter, laddar } = useIncidenter();
  const { confirm, visaMeddelande } = useDialog();
  const [visaFormular, setVisaFormular] = useState(false);
  const [kannedomTidpunkt, setKannedomTidpunkt] = useState(() => new Date().toISOString().slice(0, 16));
  const [valdaOrgIds, setValdaOrgIds] = useState([]);
  const [startar, setStartar] = useState(false);
  const [kvitterarId, setKvitterarId] = useState(null);

  const ickeDemo = (organisationer ?? []).filter((o) => !o.arDemo);

  function orgNamn(orgId) {
    return ickeDemo.find((o) => o.orgId === orgId)?.namn ?? orgId;
  }
  function orgOmfattasAvNIS2(orgId) {
    return ickeDemo.find((o) => o.orgId === orgId)?.omfattasAvNIS2 === true;
  }

  function vaxlaVal(orgId) {
    setValdaOrgIds((fore) => (fore.includes(orgId) ? fore.filter((id) => id !== orgId) : [...fore, orgId]));
  }

  async function hanteraStarta(e) {
    e.preventDefault();
    if (valdaOrgIds.length === 0) return;
    if (
      !(await confirm(
        `Starta en incidentklocka för ${valdaOrgIds.length} organisation(er), kännedom ${kannedomTidpunkt}? ` +
          "Det här registrerar klockslaget enligt drift/INCIDENT-CHECKLISTA.md steg 6."
      ))
    ) {
      return;
    }
    setStartar(true);
    onFel?.(null);
    try {
      await startaIncident(new Date(kannedomTidpunkt).toISOString(), valdaOrgIds);
      visaMeddelande("Incidentklocka startad.");
      setVisaFormular(false);
      setValdaOrgIds([]);
    } catch (fel) {
      onFel?.(fel.message ?? "Kunde inte starta incidentklockan.");
    } finally {
      setStartar(false);
    }
  }

  async function hanteraKvittera(incidentId, orgId) {
    setKvitterarId(`${incidentId}-${orgId}`);
    onFel?.(null);
    try {
      await kvitteraIncidentunderrattelse(incidentId, orgId);
    } catch (fel) {
      onFel?.(fel.message ?? "Kunde inte registrera kvitteringen.");
    } finally {
      setKvitterarId(null);
    }
  }

  return (
    <section className="admin-sektion">
      <h2>⏱️ Incidentklocka</h2>
      <p className="sida__beskrivning">
        Utför drift/INCIDENT-CHECKLISTA.md steg 6 – registrerar klockslaget för kännedom och
        räknar ned mot underrättelsefristen. 72 timmar enligt PUB-avtalet, 24 för en kund som
        omfattas av cybersäkerhetslagen (NIS2).
      </p>

      {!laddar && !visaFormular && (
        <button type="button" className="knapp knapp--farlig" onClick={() => setVisaFormular(true)}>
          Starta incidentklocka
        </button>
      )}

      {visaFormular && (
        <form className="leverantor__form" onSubmit={hanteraStarta}>
          <label>
            Kännedom (tidpunkt)
            <input
              type="datetime-local"
              required
              value={kannedomTidpunkt}
              onChange={(e) => setKannedomTidpunkt(e.target.value)}
            />
          </label>
          <div className="incidentklocka__orgval">
            {ickeDemo.map((o) => (
              <label key={o.orgId} className="leverantor__checkbox">
                <input type="checkbox" checked={valdaOrgIds.includes(o.orgId)} onChange={() => vaxlaVal(o.orgId)} />
                {o.namn} ({fristTimmar(o.omfattasAvNIS2 === true)}h)
              </label>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="knapp knapp--farlig" disabled={startar || valdaOrgIds.length === 0}>
              {startar ? "Startar..." : "Bekräfta och starta"}
            </button>
            <button type="button" className="knapp knapp--sekundar" onClick={() => setVisaFormular(false)}>
              Avbryt
            </button>
          </div>
        </form>
      )}

      {!laddar && incidenter.length > 0 && (
        <ul className="incidentklocka__lista">
          {incidenter.map((incident) => (
            <li key={incident.id} className="incidentklocka__incident">
              <p className="sida__beskrivning">Kännedom: {new Date(incident.kannedomTidpunkt).toLocaleString("sv-SE")}</p>
              {incident.orgIds.map((orgId) => {
                const { timmarKvar, forfallen, halvtidPasserad } = berakAterstaende(
                  incident.kannedomTidpunkt,
                  orgOmfattasAvNIS2(orgId)
                );
                const skickad = incident.underrattelser?.[orgId]?.skickad === true;
                return (
                  <div key={orgId} className="incidentklocka__orgrad">
                    <span>
                      <strong>{orgNamn(orgId)}</strong>{" "}
                      <span className={forfallen ? "incidentklocka__forfallen" : halvtidPasserad ? "incidentklocka__halvtid" : ""}>
                        {skickad ? "✅ Underrättad" : formateraAterstaende(timmarKvar)}
                      </span>
                    </span>
                    {!skickad && (
                      <button
                        type="button"
                        className="knapp knapp--liten"
                        disabled={kvitterarId === `${incident.id}-${orgId}`}
                        onClick={() => hanteraKvittera(incident.id, orgId)}
                      >
                        Markera underrättad
                      </button>
                    )}
                  </div>
                );
              })}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
