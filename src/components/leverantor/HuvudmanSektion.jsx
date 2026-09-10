// Etapp 67e (ETAPPLAN16.md, ren flytt ur Leverantor.jsx – ingen beteendeförändring).
// Etapp 54b: ren klientgruppering av redan hämtad data – ingen ny läsväg, ingen dataflytt.
// Organisationer utan huvudman ingår inte i någon grupp (ett fritextfält som aldrig fyllts i
// betyder "ingen huvudman", inte "en egen grupp kallad tomt").
export default function HuvudmanSektion({ organisationer }) {
  const grupper = new Map();
  for (const org of organisationer ?? []) {
    if (!org.huvudman) continue;
    if (!grupper.has(org.huvudman)) grupper.set(org.huvudman, []);
    grupper.get(org.huvudman).push(org);
  }
  if (grupper.size === 0) return null;

  return (
    <section className="admin-sektion">
      <h2><span aria-hidden="true">🏛️</span> Huvudmän</h2>
      <p className="sida__beskrivning">
        Grupperar organisationer som delar samma huvudman (t.ex. samma sjukhus med flera
        enheter). Rent visuellt – varje organisation är fortfarande en egen, fullt isolerad
        organisation i grunden.
      </p>
      <ul className="admin-lista">
        {Array.from(grupper.entries()).map(([huvudman, orgar]) => {
          const summaKr = orgar.reduce((s, o) => s + (o.avtaladArsavgiftKr ?? 0), 0);
          return (
            <li key={huvudman} className="admin-lista__rad leverantor__rad">
              <div>
                <strong>{huvudman}</strong> · {orgar.length} enheter: {orgar.map((o) => o.namn).join(", ")}
                {summaKr > 0 && <> · Summerat avtalat pris: {summaKr.toLocaleString("sv-SE")} kr/år</>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
