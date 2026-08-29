import { useEffect, useState } from "react";
import { hamtaKundensLeverantorshistorik } from "../../firebase/functions";

function formateraTid(tidpunkt) {
  if (!tidpunkt) return "-";
  return new Date(tidpunkt).toLocaleString("sv-SE");
}

// Etapp L1b, block 6 "Historik": "kundens revisionslogg filtrerad på leverantörens egna
// åtgärder, så det syns vad VI gjort hos just den här kunden". Ren läsvy (krav 39) – samma
// revisionslogg som redan finns, bara filtrerad server-side till en organisation.
export default function KundHistorikSektion({ orgId, onFel }) {
  const [poster, setPoster] = useState(null);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- orgId är en EXTERN nyckel (URL-param
       via KundLayout); en ny kund ska visa "Laddar..." omedelbart, inte den förra kundens
       historik medan den nya hämtas. */
    setLaddar(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    hamtaKundensLeverantorshistorik(orgId)
      .then(({ data }) => setPoster(data.poster))
      .catch((fel) => onFel?.(fel.message ?? "Kunde inte hämta historiken."))
      .finally(() => setLaddar(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hämtas om bara när orgId byts
  }, [orgId]);

  return (
    <section className="admin-sektion">
      <h2>Historik</h2>
      <p className="sida__beskrivning">Vad leverantören gjort mot den här kunden, senast först.</p>
      {laddar && <p className="sida__beskrivning">Laddar...</p>}
      {!laddar && poster?.length === 0 && <p className="sida__beskrivning">Inga åtgärder loggade ännu.</p>}
      {!laddar && poster?.length > 0 && (
        <ul className="admin-lista admin-lista--vertikal">
          {poster.map((p) => (
            <li key={p.id} className="admin-feedback-rad">
              <div className="admin-feedback-rad__meta">
                <span>
                  {p.handelsetyp}: {p.sammanfattning}
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
