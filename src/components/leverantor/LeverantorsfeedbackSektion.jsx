import { useEffect, useState } from "react";
import { hamtaLeverantorsfeedback, markeraLeverantorsfeedbackLast } from "../../firebase/functions";

function formateraTid(tidpunkt) {
  if (!tidpunkt) return "-";
  return new Date(tidpunkt).toLocaleString("sv-SE");
}

// Etapp L1 beslutspunkt 7 (avgjord 2026-08-30): leverantörens sida av den EGNA kanalen
// (KontaktaLeverantoren.jsx / skickaLeverantorsfeedback), skild från kundens interna
// feedback-collection som leverantören aldrig ser.
export default function LeverantorsfeedbackSektion({ organisationer, onFel }) {
  const [poster, setPoster] = useState(null);
  const [laddar, setLaddar] = useState(true);

  useEffect(() => {
    hamtaLeverantorsfeedback()
      .then(({ data }) => setPoster(data.poster))
      .catch((fel) => onFel?.(fel.message ?? "Kunde inte hämta meddelandena."))
      .finally(() => setLaddar(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hämtas en gång vid montering
  }, []);

  function orgNamn(orgId) {
    return (organisationer ?? []).find((o) => o.orgId === orgId)?.namn ?? orgId;
  }

  async function hanteraMarkeraLast(id) {
    setPoster((nuvarande) => nuvarande.map((p) => (p.id === id ? { ...p, last: true } : p)));
    try {
      await markeraLeverantorsfeedbackLast(id);
    } catch (fel) {
      onFel?.(fel.message ?? "Kunde inte markera meddelandet som läst.");
    }
  }

  const antalOlasta = poster?.filter((p) => !p.last).length ?? 0;

  return (
    <section className="admin-sektion">
      <h2>📮 Meddelanden till Synappsen {antalOlasta > 0 && `(${antalOlasta} olästa)`}</h2>
      <p className="sida__beskrivning">
        Skickade via kundernas egen "Kontakta Synappsen"-sida – en EGEN kanal, skild från
        kundernas interna feedback (som leverantören aldrig ser).
      </p>

      {laddar && <p className="sida__beskrivning">Laddar...</p>}
      {!laddar && poster?.length === 0 && <p className="sida__beskrivning">Inga meddelanden ännu.</p>}
      {!laddar && poster?.length > 0 && (
        <ul className="admin-lista admin-lista--vertikal">
          {poster.map((p) => (
            <li key={p.id} className="admin-feedback-rad">
              <div className="admin-feedback-rad__meta">
                <span>
                  <strong>{orgNamn(p.organisationId)}</strong> · {p.skapadAvNamn}
                  {!p.last && " · 🔵 Oläst"}
                </span>
                <span>{formateraTid(p.skapad)}</span>
              </div>
              <p>{p.text}</p>
              {!p.last && (
                <button type="button" className="knapp knapp--liten" onClick={() => hanteraMarkeraLast(p.id)}>
                  Markera som läst
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
