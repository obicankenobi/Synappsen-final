import { grupperaPipeline } from "../../utils/leverantorPipeline";
import { AVTALSSTATUS_ETIKETT } from "./avtalsstatusEtikett";
import "./PipelineSektion.css";

// Samma tröskel som signalen offert_stillastaende i leverantorSignaler.js – bara till för att
// visuellt märka en gammal rad här, ingen egen signal räknas ut i den här komponenten.
const GAMMAL_EFTER_DAGAR = 30;

// Etapp L1h (intern/ETAPPLAN-INTERN-1.md): onboarding-pipelinen. Ingen ny datakälla –
// avtalsstatus och avtalsstatusAndrad finns redan i listaOrganisationer-svaret. Grupperingen
// och åldersberäkningen sker i src/utils/leverantorPipeline.js, den här komponenten renderar
// bara, samma delning som KraverAtgardSektion/leverantorSignaler.js redan etablerade.
export default function PipelineSektion({ organisationer }) {
  const grupper = grupperaPipeline(organisationer);

  return (
    <section className="admin-sektion pipeline">
      <h2>🧭 Pipeline</h2>
      <p className="sida__beskrivning">Var varje organisation står i avtalslivscykeln, och hur länge.</p>
      <div className="pipeline__grupper">
        {grupper.map(({ status, organisationer: orgs }) => (
          <div className="pipeline__grupp" key={status}>
            <h3>
              {AVTALSSTATUS_ETIKETT[status] ?? status} ({orgs.length})
            </h3>
            {orgs.length === 0 ? (
              <p className="pipeline__tom">Ingen</p>
            ) : (
              <ul className="pipeline__lista">
                {orgs.map((org) => (
                  <li
                    key={org.orgId}
                    className={
                      org.dagarISteg !== null && org.dagarISteg >= GAMMAL_EFTER_DAGAR
                        ? "pipeline__rad pipeline__rad--gammal"
                        : "pipeline__rad"
                    }
                  >
                    <a href={`#org-${org.orgId}`}>{org.orgNamn}</a>
                    <span className="pipeline__alder">
                      {org.dagarISteg === null
                        ? "okänt"
                        : org.dagarISteg === 0
                          ? "idag"
                          : `${org.dagarISteg} dag${org.dagarISteg === 1 ? "" : "ar"}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
