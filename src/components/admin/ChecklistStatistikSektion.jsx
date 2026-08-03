import { useChecklistStatistik } from "../../hooks/useChecklistStatistik";
import { useRutiner } from "../../hooks/useRutiner";
import "./ChecklistStatistikSektion.css";

function formateraTid(ms) {
  if (!ms || ms <= 0) return "-";
  const minuter = Math.round(ms / 60000);
  return minuter < 1 ? "< 1 min" : `${minuter} min`;
}

function mestAvbrutnaSteg(avbrottPerSteg) {
  if (!avbrottPerSteg) return "-";
  const poster = Object.entries(avbrottPerSteg);
  if (poster.length === 0) return "-";
  const [stegIndex] = poster.sort((a, b) => b[1] - a[1])[0];
  return `Steg ${Number(stegIndex) + 1}`;
}

// Etapp 18d: aggregerad, personkopplingsfri användningsstatistik för checklistläget – se
// SAKERHETSRAPPORT.md. Löser upp rutinId -> titel genom att läsa samma tre områdens rutiner
// som resten av adminpanelen redan hämtar (inget nytt sammansatt index).
export default function ChecklistStatistikSektion() {
  const statistik = useChecklistStatistik();
  const { rutiner: klinisktRutiner } = useRutiner("kliniskt-stod");
  const { rutiner: logistikRutiner } = useRutiner("logistik");
  const { rutiner: adminRutiner } = useRutiner("administration");
  const allaRutiner = [...klinisktRutiner, ...logistikRutiner, ...adminRutiner];

  const rader = statistik
    .filter((s) => (s.antalPaborjade ?? 0) > 0)
    .map((s) => {
      const rutin = allaRutiner.find((r) => r.id === s.rutinId);
      const antalPaborjade = s.antalPaborjade ?? 0;
      const antalSlutforda = s.antalSlutforda ?? 0;
      return {
        rutinId: s.rutinId,
        titel: rutin?.titel ?? "(rutin borttagen)",
        antalPaborjade,
        antalSlutforda,
        andelSlutforda: antalPaborjade > 0 ? Math.round((antalSlutforda / antalPaborjade) * 100) : 0,
        genomsnittligTid: antalSlutforda > 0 ? (s.totalTidMs ?? 0) / antalSlutforda : 0,
        mestAvbrutnaSteg: mestAvbrutnaSteg(s.avbrottPerSteg),
      };
    })
    .sort((a, b) => b.antalPaborjade - a.antalPaborjade);

  if (rader.length === 0) return null;

  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2>☑️ Checklistanvändning</h2></summary>
      <p className="sida__beskrivning">
        Aggregerad, personkopplingsfri statistik per rutin – ingen patientkoppling, ingen
        körningslogg (se SAKERHETSRAPPORT.md).
      </p>
      <div className="checklist-statistik__tabell-wrapper">
        <table className="checklist-statistik__tabell">
          <thead>
            <tr>
              <th>Rutin</th>
              <th>Påbörjade</th>
              <th>Andel slutförda</th>
              <th>Genomsnittlig tid</th>
              <th>Mest avbrutna steg</th>
            </tr>
          </thead>
          <tbody>
            {rader.map((r) => (
              <tr key={r.rutinId}>
                <td>{r.titel}</td>
                <td>{r.antalPaborjade}</td>
                <td>{r.andelSlutforda}%</td>
                <td>{formateraTid(r.genomsnittligTid)}</td>
                <td>{r.mestAvbrutnaSteg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
