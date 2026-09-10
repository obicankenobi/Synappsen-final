import { useEffect, useState } from "react";
import { hamtaLeverantorsAtgardslogg } from "../../firebase/functions";

function formateraTid(tidpunkt) {
  if (!tidpunkt) return "-";
  return new Date(tidpunkt).toLocaleString("sv-SE");
}

// Etapp L1g (intern/ETAPPLAN-INTERN-1.md): en REN läsvy av leverantörens egna poster i
// kundernas revisionsloggar – ingen ny logg, ingen andra sanning (krav 39). Kedjorna är per
// organisation och slås ALDRIG ihop; det här är bara en sorterad lista av redan existerande
// poster, filtrerad på den inloggades eget uid server-side.
export default function AtgardsloggSektion({ organisationer, onFel }) {
  const [poster, setPoster] = useState(null);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    hamtaLeverantorsAtgardslogg()
      .then(({ data }) => setPoster(data.poster))
      .catch((fel) => onFel?.(fel.message ?? "Kunde inte hämta åtgärdsloggen."))
      .finally(() => setLaddar(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hämtas en gång vid montering
  }, []);

  function orgNamn(orgId) {
    if (orgId === "_plattform") return "Plattformen";
    return (organisationer ?? []).find((o) => o.orgId === orgId)?.namn ?? orgId;
  }

  return (
    <section className="admin-sektion">
      <h2><span aria-hidden="true">📜</span> Åtgärdslogg</h2>
      <p className="sida__beskrivning">
        Dina egna åtgärder mot kundorganisationer, senaste först. Operativt minne och
        egenkontroll – "vad har jag rört den senaste veckan?". Varje post finns redan i
        kundens egen revisionslogg; det här är bara en samlad vy av dem.
      </p>

      {laddar && <p className="sida__beskrivning">Laddar...</p>}
      {!laddar && poster?.length === 0 && <p className="sida__beskrivning">Inga åtgärder loggade ännu.</p>}
      {!laddar && poster?.length > 0 && (
        <ul className="admin-lista admin-lista--vertikal">
          {poster.map((p) => (
            <li key={p.id} className="admin-feedback-rad">
              <div className="admin-feedback-rad__meta">
                <span>
                  <strong>{orgNamn(p.organisationId)}</strong> – {p.handelsetyp}: {p.sammanfattning}
                </span>
                <span>{formateraTid(p.tidpunkt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
