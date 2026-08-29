import { useOutletContext } from "react-router-dom";

// Etapp L1b, block 4 "Användning". "Senaste aktivitet" byggdes MEDVETET INTE – planen kräver
// L1j, som i sin tur väntar på beslutspunkt 2 (ägaren har inte tagit ställning till om
// klienten ska rapportera "senast aktiv" per användare – en form av personalövervakning som
// behöver ett tydligare syfte innan den byggs).
export default function KundAnvandning() {
  const { org, sokkvot } = useOutletContext();
  const egetTak = org.sokkvotTakPerDygn ?? sokkvot?.orgTakStandard ?? null;

  return (
    <div>
      <section className="admin-sektion">
        <h2>Användning</h2>
        <dl className="kund-lista">
          <div>
            <dt>Antal användare</dt>
            <dd>
              {org.antalAnvandare}
              {org.anvandartak != null ? ` / ${org.anvandartak}` : ""}
            </dd>
          </div>
          <div>
            <dt>Sökkvot idag</dt>
            <dd>
              {org.sokkvotIdag} / {egetTak ?? "standardtak"}
            </dd>
          </div>
          <div>
            <dt>Operations-modul</dt>
            <dd>{org.moduler?.operations ? "På" : "Av"}</dd>
          </div>
          <div>
            <dt>Intelligence-modul</dt>
            <dd>{org.moduler?.intelligence ? "På" : "Av"}</dd>
          </div>
        </dl>
      </section>

      <section className="admin-sektion">
        <h2>Senaste aktivitet</h2>
        <p className="sida__beskrivning">
          Inte byggt – kräver L1j och ett ägarbeslut (beslutspunkt 2) om huruvida klienten ska
          rapportera "senast aktiv" per användare. Se <code>intern/ETAPPLAN-INTERN-1.md</code>.
        </p>
      </section>
    </div>
  );
}
