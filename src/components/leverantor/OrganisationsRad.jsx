import { Link } from "react-router-dom";
import { AVTALSSTATUS_ETIKETT } from "./avtalsstatusEtikett";

// Etapp 67e (ETAPPLAN16.md, ren flytt ur Leverantor.jsx – ingen beteendeförändring). En rad i
// organisationslistan, med sina tre utfällbara paneler (diagnostik/innehåll/ärenden). Äger
// ingen egen state – "bara ETT öppet åt gången i hela listan" (den ursprungliga
// diagnostikOppen/innehallOppen/arendenOppen-semantiken) kräver att öppet/stängt avgörs av
// OrganisationsListaSektion, inte av raden själv. Se den filens kommentar för varför.
//
// Etapp L1p byggde en fjärde panel ("Avtal & åtaganden") här, självförsörjande utanför "bara
// en åt gången"-modellen. Etapp L1b gav den en riktig hemvist i kunddossién
// (KundEkonomi.jsx) – panelen TOGS BORT härifrån till förmån för en länk dit, så samma
// funktion inte finns på två ställen samtidigt.
export default function OrganisationsRad({
  org,
  sokkvot,
  atgard,
  provperiodDraft,
  onProvperiodDraft,
  arsavgiftDraft,
  onArsavgiftDraft,
  huvudmanDraft,
  onHuvudmanDraft,
  sokkvotTakDraft,
  onSokkvotTakDraft,
  onPausa,
  onAvtalsstatus,
  onProvperiod,
  onArsavgift,
  onHuvudman,
  onSokkvotTak,
  onAvbrytRadering,
  onAvslutaSupportAtkomst,
  onExport,
  diagnostikApen,
  diagnostikData,
  diagnostikLaddar,
  onVaxlaDiagnostik,
  innehallApen,
  innehallData,
  innehallLaddar,
  onVaxlaInnehall,
  arendenApen,
  arendenData,
  arendenLaddar,
  onVaxlaArenden,
  nyttArendeText,
  onNyttArendeText,
  arendeSparar,
  onLaggTillArende,
  onTaBortArende,
}) {
  const upptagen = atgard === org.orgId;

  return (
    <li id={`org-${org.orgId}`} className="admin-lista__rad leverantor__rad">
      <div>
        <strong>{org.namn}</strong>{" "}
        {org.status === "pausad" && <span className="leverantor__pausad">⏸ Pausad</span>}
        {org.status === "raderad" && <span className="leverantor__fel">🗑️ Raderad</span>}
        {org.arDemo && <span className="leverantor__pausad">🎓 Demo</span>}
        {org.huvudman && <span className="leverantor__pausad">🏛️ {org.huvudman}</span>}
        {org.raderingSchemalagdTill && (
          <div className="leverantor__fel">
            ⚠️ Radering schemalagd till {new Date(org.raderingSchemalagdTill).toLocaleString("sv-SE")}. Anledning:
            "{org.raderingAnledning}".{" "}
            <button type="button" className="knapp knapp--liten" disabled={upptagen} onClick={() => onAvbrytRadering(org.orgId)}>
              Avbryt radering
            </button>
          </div>
        )}
        {org.supportAtkomstTill && new Date(org.supportAtkomstTill) > new Date() && (
          <div className="leverantor__varning">
            🔓 Supportåtkomst aktiv till {new Date(org.supportAtkomstTill).toLocaleString("sv-SE")}. Anledning:
            "{org.supportAtkomstAnledning}".{" "}
            <button type="button" className="knapp knapp--liten" disabled={upptagen} onClick={() => onAvslutaSupportAtkomst(org.orgId)}>
              Avsluta åtkomsten
            </button>
          </div>
        )}
        <div className="admin-lista__email">
          {org.antalAnvandare} användare · Operations {org.moduler?.operations ? "✅" : "❌"} ·{" "}
          Intelligence {org.moduler?.intelligence ? "✅" : "❌"}
          {org.senasteKostnad && <> · Senaste avslutade månad: {(org.senasteKostnad.anvantOre / 100).toFixed(2)} kr</>}
          {org.sokkvotIdag > 0 && (
            <> · Sökkvot idag: {org.sokkvotIdag} / {org.sokkvotTakPerDygn ?? sokkvot?.orgTakStandard ?? "–"}</>
          )}
          {org.avtaladArsavgiftKr != null && <> · Avtalat: {org.avtaladArsavgiftKr.toLocaleString("sv-SE")} kr/år</>}
          {org.provperiodSlut && <> · Provperiod t.o.m. {org.provperiodSlut}</>}
        </div>
      </div>
      <div className="admin-lista__atgarder">
        <label className="leverantor__avtalsstatus">
          Avtalsstatus
          <select value={org.avtalsstatus} disabled={upptagen} onChange={(e) => onAvtalsstatus(org.orgId, e.target.value)}>
            {Object.entries(AVTALSSTATUS_ETIKETT).map(([varde, etikett]) => (
              <option key={varde} value={varde}>
                {etikett}
              </option>
            ))}
          </select>
        </label>
        <label className="leverantor__avtalsstatus">
          Provperiod t.o.m.
          <input
            type="date"
            value={provperiodDraft ?? org.provperiodSlut ?? ""}
            disabled={upptagen}
            onChange={(e) => onProvperiodDraft(org.orgId, e.target.value)}
          />
        </label>
        <button
          type="button"
          className="knapp knapp--liten"
          disabled={upptagen}
          onClick={() => onProvperiod(org.orgId, provperiodDraft ?? org.provperiodSlut)}
        >
          Spara provperiod
        </button>
        <label className="leverantor__avtalsstatus">
          Avtalat pris (kr/år)
          <input
            type="number"
            min="0"
            step="1"
            placeholder="Ej ifyllt"
            value={arsavgiftDraft ?? org.avtaladArsavgiftKr ?? ""}
            disabled={upptagen}
            onChange={(e) => onArsavgiftDraft(org.orgId, e.target.value)}
          />
        </label>
        <button
          type="button"
          className="knapp knapp--liten"
          disabled={upptagen}
          onClick={() => onArsavgift(org.orgId, arsavgiftDraft ?? org.avtaladArsavgiftKr ?? "")}
        >
          Spara pris
        </button>
        <label className="leverantor__avtalsstatus">
          Huvudman (för gruppering, valfritt)
          <input
            type="text"
            placeholder="Ej ifyllt"
            value={huvudmanDraft ?? org.huvudman ?? ""}
            disabled={upptagen}
            onChange={(e) => onHuvudmanDraft(org.orgId, e.target.value)}
          />
        </label>
        <button
          type="button"
          className="knapp knapp--liten"
          disabled={upptagen}
          onClick={() => onHuvudman(org.orgId, huvudmanDraft ?? org.huvudman ?? "")}
        >
          Spara huvudman
        </button>
        <label className="leverantor__avtalsstatus">
          Sökkvottak/dygn
          <input
            type="number"
            min="1"
            max={sokkvot?.tak ?? 100}
            step="1"
            placeholder={`Standard (${sokkvot?.orgTakStandard ?? 50})`}
            value={sokkvotTakDraft ?? org.sokkvotTakPerDygn ?? ""}
            disabled={upptagen}
            onChange={(e) => onSokkvotTakDraft(org.orgId, e.target.value)}
          />
        </label>
        <button
          type="button"
          className="knapp knapp--liten"
          disabled={upptagen}
          onClick={() => onSokkvotTak(org.orgId, sokkvotTakDraft ?? org.sokkvotTakPerDygn ?? "")}
        >
          Spara tak
        </button>
        <button type="button" className="knapp knapp--liten" disabled={upptagen} onClick={() => onPausa(org.orgId, org.status !== "pausad")}>
          {org.status === "pausad" ? "Återaktivera" : "Pausa"}
        </button>
        <button type="button" className="knapp knapp--liten" disabled={upptagen} onClick={() => onExport(org.orgId)}>
          Exportera
        </button>
        <button type="button" className="knapp knapp--liten" onClick={() => onVaxlaDiagnostik(org.orgId)}>
          {diagnostikApen ? "Dölj diagnostik" : "Diagnostik"}
        </button>
        {org.supportAtkomstTill && new Date(org.supportAtkomstTill) > new Date() && (
          <button type="button" className="knapp knapp--liten" onClick={() => onVaxlaInnehall(org.orgId)}>
            {innehallApen ? "Dölj innehåll" : "🔓 Visa innehåll"}
          </button>
        )}
        <button type="button" className="knapp knapp--liten" onClick={() => onVaxlaArenden(org.orgId)}>
          {arendenApen ? "Dölj ärenden" : "🗒️ Ärenden"}
        </button>
        <Link to={`/leverantor/kund/${org.orgId}/ekonomi`} className="knapp knapp--liten">
          ⚖️ Avtal & åtaganden
        </Link>
      </div>
      {diagnostikApen && (
        <div className="leverantor__diagnostik">
          {diagnostikLaddar && !diagnostikData ? (
            <p>Laddar diagnostik...</p>
          ) : (
            diagnostikData && (
              <>
                <p className="sida__beskrivning">
                  Strukturell hälsa – antal och tidpunkter, aldrig dokumentinnehåll. Visningen loggas i organisationens egen
                  revisionslogg.
                </p>
                <ul className="leverantor__diagnostik-lista">
                  {Object.entries(diagnostikData.antalDokument).map(([namn, antal]) => (
                    <li key={namn}>
                      {namn}: {antal}
                    </li>
                  ))}
                </ul>
                <p>
                  Senaste loggade händelse:{" "}
                  {diagnostikData.senasteHandelse
                    ? `${diagnostikData.senasteHandelse.handelsetyp} (${new Date(diagnostikData.senasteHandelse.tidpunkt).toLocaleString("sv-SE")})`
                    : "Ingen"}
                </p>
                <p>
                  Backup:{" "}
                  {diagnostikData.backupstatus.harOperationsModul
                    ? `${diagnostikData.backupstatus.antalBackuper} st, senast ${diagnostikData.backupstatus.senasteDatum ?? "aldrig"}`
                    : "Kräver Operations-modulen"}
                </p>
                <p className="sida__beskrivning">
                  Felfrekvens (t.ex. upprepade nekade anrop) är ännu inte tillgänglig här – kräver ett separat Sentry
                  API-token, se <code>ETAPPLAN5.md</code> §32b.
                </p>
              </>
            )
          )}
        </div>
      )}
      {innehallApen && (
        <div className="leverantor__diagnostik">
          {innehallLaddar && !innehallData ? (
            <p>Laddar innehåll...</p>
          ) : (
            innehallData && (
              <>
                <p className="sida__beskrivning">
                  🔓 Läses under det aktiva supportfönstret – organisationen ser i sin egen adminpanel att detta pågår.
                </p>
                {Object.entries(innehallData).map(([namn, poster]) => (
                  <div key={namn}>
                    <strong>
                      {namn} ({poster?.length ?? 0})
                    </strong>
                    <ul className="leverantor__diagnostik-lista">
                      {(poster ?? []).map((post) => (
                        <li key={post.id}>
                          {post.titel}
                          {post.status && ` (${post.status})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            )
          )}
        </div>
      )}
      {arendenApen && (
        <div className="leverantor__diagnostik">
          <p className="sida__beskrivning">Internt leverantörsminne – syns aldrig för organisationens egna användare, oavsett roll.</p>
          {arendenLaddar && !arendenData ? (
            <p>Laddar ärenden...</p>
          ) : (
            <ul className="leverantor__diagnostik-lista leverantor__arendelista">
              {(arendenData ?? []).length === 0 && <li>Inga ärenden ännu.</li>}
              {(arendenData ?? []).map((a) => (
                <li key={a.id}>
                  <span>
                    {a.skapadTidpunkt?.toDate ? a.skapadTidpunkt.toDate().toLocaleString("sv-SE") : "..."}
                    {" – "}
                    {a.text}
                  </span>
                  <button type="button" className="knapp knapp--liten" disabled={arendeSparar} onClick={() => onTaBortArende(org.orgId, a.id)}>
                    Ta bort
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="leverantor__form">
            <label>
              Ny anteckning
              <textarea rows={2} value={nyttArendeText} onChange={(e) => onNyttArendeText(e.target.value)} />
            </label>
            <button
              type="button"
              className="knapp knapp--liten"
              disabled={arendeSparar || !nyttArendeText.trim()}
              onClick={() => onLaggTillArende(org.orgId)}
            >
              {arendeSparar ? "..." : "Lägg till"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
