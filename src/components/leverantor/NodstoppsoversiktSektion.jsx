import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { hamtaLeverantorsAtgardslogg } from "../../firebase/functions";
import { filtreraAtgardstidslinje } from "../../utils/atgardstidslinje";

function formateraTid(tidpunkt) {
  if (!tidpunkt) return "-";
  return new Date(tidpunkt).toLocaleString("sv-SE");
}

// Etapp L1e, punkt 1 + 4: EN panel med samtliga nödstoppslägen synliga utan att klicka sig
// in, plus en tidslinje över vad som stoppats/startats, av vem, när. Ingen ny backend – bara
// en sammanställning av fält och poster som redan finns (epostAvstangd, kvisspaket-
// collectionen, hamtaLeverantorsAtgardslogg från L1g). Punkt 2 (ett generaliserat
// nodstopp/{funktion}-mönster som de två befintliga mekanismerna migreras till) byggdes
// MEDVETET INTE: det vore en riskabel omskrivning av redan skarpa, säkerhetskritiska
// nödstopp för en oproportionerlig vinst just nu – görs om och när en TREDJE mekanism
// faktiskt tillkommer, se intern/ETAPPLAN-INTERN-1.md.
export default function NodstoppsoversiktSektion({ epostAvstangd, onFel }) {
  const [kvisspaket, setKvisspaket] = useState({});
  const [tidslinje, setTidslinje] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "kvisspaket"),
      (snap) => setKvisspaket(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))),
      () => {}
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    hamtaLeverantorsAtgardslogg()
      .then(({ data }) => setTidslinje(filtreraAtgardstidslinje(data.poster)))
      .catch((fel) => onFel?.(fel.message ?? "Kunde inte hämta åtgärdstidslinjen."));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hämtas en gång vid montering
  }, []);

  const paket = Object.entries(kvisspaket);

  return (
    <section className="admin-sektion">
      <h2><span aria-hidden="true">🛑</span> Nödstoppsöversikt</h2>
      <dl className="kund-lista">
        <div>
          <dt>Utgående e-post</dt>
          <dd>{epostAvstangd ? "🛑 Avstängd" : "✅ Påslagen"}</dd>
        </div>
        {paket.map(([id, data]) => (
          <div key={id}>
            <dt>Öva-läge: {id}</dt>
            <dd>{data.avstangt ? "🛑 Stoppat" : "✅ Aktivt"}</dd>
          </div>
        ))}
      </dl>
      <p className="sida__beskrivning">
        Pausning per kund och tvingad utloggning per användare hanteras i respektive
        kunddossié – de är riktade åtgärder utan ett eget globalt läge att visa här.
      </p>

      <h3>Tidslinje</h3>
      {tidslinje === null && <p className="sida__beskrivning">Laddar...</p>}
      {tidslinje?.length === 0 && (
        <p className="sida__beskrivning">Inga nödstopp eller pausningar loggade ännu.</p>
      )}
      {tidslinje && tidslinje.length > 0 && (
        <ul className="admin-lista admin-lista--vertikal">
          {tidslinje.map((p) => (
            <li key={p.id} className="admin-feedback-rad">
              <div className="admin-feedback-rad__meta">
                <span>{p.handelsetyp}: {p.sammanfattning}</span>
                <span>{formateraTid(p.tidpunkt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
