import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useMatvardenTrend } from "../../hooks/useMatvardenTrend";
import { useMatvardenMarkeringar } from "../../hooks/useMatvardenMarkeringar";
import { useDialog } from "../../hooks/useDialog";
import { ROLES } from "../../firebase/roles";

const NYCKELTAL = [
  { falt: "kvitteringsgradKlinisktStod", namn: "Kvittering kliniskt stöd", enhet: "%" },
  { falt: "kvitteringsgradAdministration", namn: "Kvittering administration", enhet: "%" },
  { falt: "andelNollTraffar", namn: "Nollträffar", enhet: "%" },
  { falt: "tidAttHittaSekunder", namn: "Tid-att-hitta", enhet: "s" },
  { falt: "innehallshalsaKlinisktStod", namn: "Innehållshälsa kliniskt stöd", enhet: "%" },
];

// Etapp 39a/39b: veckovis mätvärdestrend (matvardenSnapshots, skrivs av en schemalagd Cloud
// Function varje måndag) plus manuella datummarkeringar (matvardenMarkeringar) för att se om
// en åtgärd faktiskt gav utslag i siffrorna – bara synligt för superadmin (samma begränsning
// som rules-nivå, se firestore.rules).
export default function MatvardenTrendSektion() {
  const { role } = useAuth();
  const arSuperadmin = role === ROLES.SUPERADMIN;
  const { confirm } = useDialog();
  const { snapshots } = useMatvardenTrend(arSuperadmin);
  const { markeringar, skapaMarkering, taBortMarkering } = useMatvardenMarkeringar(arSuperadmin);

  const [etikett, setEtikett] = useState("");
  const [datum, setDatum] = useState("");
  const [sparar, setSparar] = useState(false);

  if (!arSuperadmin) return null;

  const sorterade = [...snapshots].sort((a, b) => a.datum.localeCompare(b.datum));

  async function hanteraSkapaMarkering(e) {
    e.preventDefault();
    if (!etikett.trim() || !datum) return;
    setSparar(true);
    try {
      await skapaMarkering({ etikett: etikett.trim(), datum });
      setEtikett("");
      setDatum("");
    } finally {
      setSparar(false);
    }
  }

  async function hanteraTaBort(id) {
    if (await confirm("Ta bort markeringen?")) {
      await taBortMarkering(id);
    }
  }

  return (
    <section className="admin-sektion">
      <h2>Effekt över tid</h2>
      <p className="sida__beskrivning">
        Veckovisa ögonblicksbilder av nyckeltalen ovan, så en trend syns istället för bara
        dagens värde. Ny rad skrivs varje måndag – ingen historik före den här funktionens
        driftsättning.
      </p>
      {sorterade.length === 0 ? (
        <p className="sida__beskrivning">Ingen trenddata ännu – första snapshoten skrivs nästa måndag.</p>
      ) : (
        <div className="ledningsrapport__tabell-wrapper">
          <table className="ledningsrapport__tabell">
            <thead>
              <tr>
                <th>Vecka</th>
                {NYCKELTAL.map((n) => (
                  <th key={n.falt}>{n.namn}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorterade.map((s) => (
                <tr key={s.id}>
                  <td>{s.datum}</td>
                  {NYCKELTAL.map((n) => (
                    <td key={n.falt}>{s[n.falt] !== null && s[n.falt] !== undefined ? `${s[n.falt]}${n.enhet}` : "–"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3>Markeringar</h3>
      <p className="sida__beskrivning">
        Markera ett datum (t.ex. en införd åtgärd eller genomförd granskningsrunda) för att
        kunna se förändringen i trenden omkring det.
      </p>
      {markeringar.length > 0 && (
        <ul className="admin-lista">
          {markeringar.map((m) => (
            <li key={m.id} className="admin-lista__rad">
              {m.datum} – {m.etikett}
              <button type="button" className="knapp knapp--liten" onClick={() => hanteraTaBort(m.id)}>
                Ta bort
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={hanteraSkapaMarkering} className="admin-formular-rad">
        <input
          type="date"
          value={datum}
          onChange={(e) => setDatum(e.target.value)}
          aria-label="Datum för markering"
          required
        />
        <input
          type="text"
          value={etikett}
          onChange={(e) => setEtikett(e.target.value)}
          placeholder="Vad hände? (t.ex. Granskningsrunda genomförd)"
          aria-label="Etikett för markering"
          required
        />
        <button type="submit" className="knapp" disabled={sparar}>
          {sparar ? "Sparar…" : "Markera datum"}
        </button>
      </form>
    </section>
  );
}
