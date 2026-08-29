import { useOutletContext } from "react-router-dom";

// Etapp L1b (intern/ETAPPLAN-INTERN-1.md), block 1 "Huvud" + block 2 "Kontakt".
//
// Block 2 är MEDVETET avgränsat till kontaktperson (redan lagrad, leverantörsvänt metadata
// sedan Etapp 6b). "Vem som är superadmin" och "när de senast bjöd in någon" byggdes INTE:
// firestore.rules ger en plattformsadmin ingen läsrätt alls till users/{uid} (ingen
// farSupportlasa-koppling där, till skillnad från rutiner/anslag m.fl.), och att bygga en ny
// läsväg för att lista kundens anställda med namn är precis den typ av utvidgning krav 37
// varnar för ("leverantören får se metadata, aggregat och driftstatus fritt" – enskilda
// personers namn i en annan organisation är inte det). Kräver ett eget ägarbeslut, inte en
// biprodukt av L1b.
export default function KundOversikt() {
  const { org } = useOutletContext();

  return (
    <div>
      <section className="admin-sektion">
        <h2>Huvud</h2>
        <dl className="kund-lista">
          <div>
            <dt>Organisationsnummer</dt>
            <dd>{org.orgnr ?? "Ej ifyllt"}</dd>
          </div>
          <div>
            <dt>Huvudman</dt>
            <dd>{org.huvudman ?? "Ingen"}</dd>
          </div>
          <div>
            <dt>Avtalsstatus</dt>
            <dd>{org.avtalsstatus}</dd>
          </div>
          <div>
            <dt>Provperiod</dt>
            <dd>{org.provperiodSlut ?? "Ingen"}</dd>
          </div>
          <div>
            <dt>Demo-organisation</dt>
            <dd>{org.arDemo ? "Ja" : "Nej"}</dd>
          </div>
          <div>
            <dt>Användare</dt>
            <dd>
              {org.antalAnvandare}
              {org.anvandartak != null ? ` / ${org.anvandartak}` : " (inget tak satt)"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="admin-sektion">
        <h2>Kontakt</h2>
        {org.kontaktperson ? (
          <p className="sida__beskrivning">
            {org.kontaktperson.namn ?? "Namn saknas"}
            {org.kontaktperson.epost ? ` · ${org.kontaktperson.epost}` : ""}
          </p>
        ) : (
          <p className="sida__beskrivning">Ingen kontaktperson registrerad.</p>
        )}
        <p className="sida__beskrivning">
          Vem som är superadmin och när de senast bjöd in någon byggdes INTE i L1b – det
          kräver en ny läsväg till kundens användarlista, vilket är ett eget ägarbeslut
          (krav 37), inte en självklar del av kunddossién.
        </p>
      </section>

      <section className="admin-sektion">
        <h2>Hälsa</h2>
        <p className="sida__beskrivning">
          Mätvärdestrend – inte byggt. Kräver L1c och ett ägarbeslut (beslutspunkt 1): i dag
          är <code>matvardenSnapshots</code> inte läsbara för en plattformsadmin, och att lossa
          den regeln utan spårning vore en utvidgning av vad biträdet ser om kundens
          verksamhet. Se <code>intern/ETAPPLAN-INTERN-1.md</code>.
        </p>
      </section>
    </div>
  );
}
