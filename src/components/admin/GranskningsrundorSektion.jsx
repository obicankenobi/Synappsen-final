import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRutiner } from "../../hooks/useRutiner";
import { useGranskningsrundor } from "../../hooks/useGranskningsrundor";
import { useDialog } from "../../hooks/useDialog";
import { antalDagarSedan } from "../../utils/innehallshalsa";
import { berakningRundaFramsteg } from "../../utils/granskningsrunda";
import { OMRADE_NAMN } from "./adminHjalp";
import "./GranskningsrundorSektion.css";

// Förval "18 månader", som nämns som exempel i ETAPPLAN6.md Etapp 37b.
const STANDARD_TROSKEL_DAGAR = 540;

// Etapp 37b: superadmin startar en riktad granskningsrunda – ett urval rutiner i ett område,
// äldre än en vald tröskel, med en gemensam deadline. Varje berörd rutins ägare meddelas en
// gång (Cloud Function-trigger, se functions/index.js). Framsteg redovisas per RUTIN och
// OMRÅDE, aldrig per person (krav 14) – "markera som granskad" är samma befintliga knapp som
// redan finns i Sektionssida.jsx, ingen ny mekanism för att räknas som klar.
export default function GranskningsrundorSektion() {
  const { currentUser, namn } = useAuth();
  const { confirm } = useDialog();
  const { rutiner: klinisktRutiner } = useRutiner("kliniskt-stod");
  const { rutiner: logistikRutiner } = useRutiner("logistik");
  const { rutiner: adminRutiner } = useRutiner("administration");
  const { rundor, startaRunda, taBortRunda } = useGranskningsrundor();

  const rutinerPerOmrade = {
    "kliniskt-stod": klinisktRutiner,
    logistik: logistikRutiner,
    administration: adminRutiner,
  };

  const [omrade, setOmrade] = useState("kliniskt-stod");
  const [trosallDagar, setTrosallDagar] = useState(String(STANDARD_TROSKEL_DAGAR));
  const [deadline, setDeadline] = useState("");
  const [skapar, setSkapar] = useState(false);
  const [meddelande, setMeddelande] = useState(null);

  // Etapp 37d: en arkiverad rutin ("gäller inte längre") tas aldrig med i en granskningsrunda
  // – att be någon granska innehåll som redan är avskrivet vore bortkastad tid.
  const kandidater = (rutinerPerOmrade[omrade] ?? []).filter(
    (r) =>
      r.status === "godkand" &&
      r.arkiverad !== true &&
      (antalDagarSedan(r.granskadDatum) ?? Infinity) >= Number(trosallDagar)
  );

  async function hanteraSkapa(e) {
    e.preventDefault();
    if (kandidater.length === 0 || !deadline) return;
    setSkapar(true);
    try {
      await startaRunda({
        omrade,
        trosallDagar: Number(trosallDagar),
        deadline,
        rutinIds: kandidater.map((r) => r.id),
        uid: currentUser?.uid,
        namn,
      });
      setMeddelande(`Runda startad med ${kandidater.length} rutiner.`);
      setDeadline("");
      setTimeout(() => setMeddelande(null), 4000);
    } finally {
      setSkapar(false);
    }
  }

  async function hanteraTaBort(id) {
    if (!(await confirm("Ta bort den här granskningsrundan? Detta påverkar inte rutinerna själva."))) return;
    await taBortRunda(id);
  }

  return (
    <section className="admin-sektion">
      <h2>📋 Riktade granskningsrundor</h2>
      <p className="sida__beskrivning">
        Starta en runda för ett urval äldre rutiner i ett område, med en gemensam deadline.
        Varje rutins ägare meddelas. En rutin räknas som klar när dess redaktör trycker
        "Markera som granskad" som vanligt.
      </p>

      <form onSubmit={hanteraSkapa} className="granskningsrundor__form">
        <label>
          Område
          <select value={omrade} onChange={(e) => setOmrade(e.target.value)}>
            {Object.entries(OMRADE_NAMN).map(([nyckel, namnText]) => (
              <option key={nyckel} value={nyckel}>
                {namnText}
              </option>
            ))}
          </select>
        </label>
        <label>
          Äldre än (dagar)
          <input
            type="number"
            min="1"
            value={trosallDagar}
            onChange={(e) => setTrosallDagar(e.target.value)}
          />
        </label>
        <label>
          Deadline
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
        </label>
        <p className="sida__beskrivning">
          {kandidater.length === 0
            ? "Inga godkända rutiner matchar urvalet just nu."
            : `${kandidater.length} rutiner matchar urvalet.`}
        </p>
        <button type="submit" className="knapp" disabled={skapar || kandidater.length === 0 || !deadline}>
          {skapar ? "Startar..." : "Starta runda"}
        </button>
        {meddelande && <p role="status">{meddelande}</p>}
      </form>

      {rundor.length > 0 && (
        <ul className="granskningsrundor__lista">
          {rundor.map((runda) => {
            const { total, granskade, kvarstar } = berakningRundaFramsteg(
              runda,
              rutinerPerOmrade[runda.omrade] ?? []
            );
            return (
              <li key={runda.id} className="granskningsrundor__runda">
                <div className="granskningsrundor__runda-rubrik">
                  <strong>{OMRADE_NAMN[runda.omrade] ?? runda.omrade}</strong>
                  <span>Deadline: {runda.deadline}</span>
                  <button type="button" className="knapp knapp--liten" onClick={() => hanteraTaBort(runda.id)}>
                    Ta bort
                  </button>
                </div>
                <p>
                  {granskade} av {total} granskade sedan rundan startade
                </p>
                {kvarstar.length > 0 && (
                  <details>
                    <summary>Vad återstår ({kvarstar.length})</summary>
                    <ul>
                      {kvarstar.map((p) => (
                        <li key={p.id}>{p.titel}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
