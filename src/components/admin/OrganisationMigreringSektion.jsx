export default function OrganisationMigreringSektion({ hanteraMigrering, migrerar, migreringResultat }) {
  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2><span aria-hidden="true">🏢</span> Organisation (Etapp 1-migrering)</h2></summary>
      <p className="sida__beskrivning">
        Engångsverktyg som sätter organisationId på allt befintligt innehåll (första steget
        mot att kunna hantera flera kunder). Kör alltid "Förhandsgranska" först och kolla att
        siffrorna stämmer innan du kör den skarpt – skarp körning kan köras flera gånger utan
        risk (den skriver bara på dokument som ännu saknar fältet).
      </p>
      <div className="admin-beroendetest">
        <button
          className="knapp knapp--sekundar knapp--liten"
          onClick={() => hanteraMigrering(true)}
          disabled={migrerar}
        >
          {migrerar ? "Arbetar..." : "Förhandsgranska (dry-run)"}
        </button>{" "}
        <button
          className="knapp knapp--farlig knapp--liten"
          onClick={() => hanteraMigrering(false)}
          disabled={migrerar}
        >
          Kör skarpt
        </button>
        {migreringResultat?.fel && <p className="klinikfraga__fel">{migreringResultat.fel}</p>}
        {migreringResultat?.resultat && (
          <>
            <p className="sida__beskrivning">
              {migreringResultat.dryRun ? "Förhandsgranskning – inget skrivet ännu:" : "Skarpt kört:"}
            </p>
            <ul className="admin-beroendetest__lista">
              {Object.entries(migreringResultat.resultat).map(([samling, r]) => (
                <li key={samling}>
                  {samling}: {r.totalt} dokument, {r.saknarOrganisationId} saknade organisationId
                  {!migreringResultat.dryRun && r.saknarOrganisationId > 0 && " (nu åtgärdat)"}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </details>
  );
}
