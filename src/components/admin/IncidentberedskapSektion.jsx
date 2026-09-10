import { useState } from "react";
import { useSystemstatus } from "../../hooks/useSystemstatus";
import { hamtaBackupstatus } from "../../firebase/functions";
import { formateraTid } from "./adminHjalp";

// Etapp 46: en aktiv adminvy för det INCIDENT-CHECKLISTA.md tidigare bara beskrev i text –
// samma "en manipuleringsdetekterande logg som ingen kontrollerar detekterar inget"-princip
// som redan gav upphov till Etapp 32d, applicerad här på SYNLIGHETEN av det resultatet.
//
// Premisskontroll (krav 8, gjord innan bygget): planens ursprungliga idé nämnde också
// "App Check-verifieringsgrad" och "misslyckade inloggningsförsök i realtid". Ingen av dem
// går att bygga just nu – App Check-metriken exponeras inte via någon Firebase Admin SDK-
// funktion (bara i Firebase-konsolens UI), och larm på misslyckade inloggningar är redan
// dokumenterat blockerat på ett ägarbeslut om en betald tjänst (Etapp 32b, se
// OPPNA-PUNKTER.md). Båda är därför medvetet UTANFÖR den här sektionen, med en tydlig
// pekare till var de faktiskt finns/spåras istället för att låtsas vara byggda.
export default function IncidentberedskapSektion() {
  const { revisionskedja, fel } = useSystemstatus();
  const [backupstatus, setBackupstatus] = useState(null);
  const [laddarBackup, setLaddarBackup] = useState(false);
  const [backupFel, setBackupFel] = useState(null);

  async function hanteraHamtaBackupstatus() {
    setLaddarBackup(true);
    setBackupFel(null);
    try {
      const { data } = await hamtaBackupstatus();
      setBackupstatus(data);
    } catch {
      // Firebase callable-fel (t.ex. "internal") är inte begripliga för en admin under
      // press – visa en egen, tydlig text istället för det tekniska felmeddelandet.
      setBackupFel("Kunde inte hämta backupstatus just nu. Kontrollera Firebase Storage-konsolen (backups/{orgId}/) direkt om det brådskar.");
    } finally {
      setLaddarBackup(false);
    }
  }

  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2><span aria-hidden="true">🚨</span> Incidentberedskap</h2></summary>
      <p className="sida__beskrivning">
        Snabb status på det incidentchecklistan annars skulle kräva att du letar i
        Firebase-konsolen mitt under en stressad situation.
      </p>

      <div className="admin-beroendetest">
        <h3>Revisionsloggens hashkedja</h3>
        {fel && <p className="klinikfraga__fel">Kunde inte läsa status just nu.</p>}
        {!fel && !revisionskedja && (
          <p className="sida__beskrivning">Ingen automatisk kontroll har körts ännu.</p>
        )}
        {/* Säkerhetsgranskning 2026-08-17 (fynd 2.1): visade tidigare en GLOBAL dom över
            samtliga kunders kedjor, plus hur många organisationer leverantören har. Kund A
            fick alltså "🔴 Avvikelse upptäckt" när kund B:s kedja brast. Visar nu den EGNA
            organisationens status, vilket är det enda som är meningsfullt här. */}
        {revisionskedja && (
          <p className="sida__beskrivning">
            {revisionskedja.giltig ? "🟢 Intakt" : "🔴 Avvikelse upptäckt"} – senast
            kontrollerad {formateraTid(revisionskedja.senastKord)}.
            {!revisionskedja.giltig && revisionskedja.orsak && ` Orsak: ${revisionskedja.orsak}.`}
            {" "}Körs automatiskt varje natt 04:00.
          </p>
        )}
      </div>

      <div className="admin-beroendetest">
        <h3>Senaste backup, din organisation</h3>
        <button
          type="button"
          className="knapp knapp--sekundar knapp--liten"
          onClick={hanteraHamtaBackupstatus}
          disabled={laddarBackup}
        >
          {laddarBackup ? "Hämtar..." : "🔄 Kontrollera backupstatus"}
        </button>
        {backupFel && <p className="klinikfraga__fel">{backupFel}</p>}
        {backupstatus && !backupstatus.harOperationsModul && (
          <p className="sida__beskrivning">
            Ingen backup körs – Operations-modulen är inte påslagen för organisationen.
          </p>
        )}
        {backupstatus?.harOperationsModul && (
          <p className="sida__beskrivning">
            {backupstatus.senasteDatum
              ? `Senaste backup: ${backupstatus.senasteDatum} (${backupstatus.antalBackuper} sparade, 90 dagars gallring)`
              : "Ingen backup hittad ännu – körs veckovis (måndagar 03:00)."}
          </p>
        )}
      </div>

      <div className="admin-beroendetest">
        <h3>Vad den här vyn INTE visar</h3>
        <p className="sida__beskrivning">
          <strong>App Check-verifieringsgrad</strong> – kontrollera manuellt i Firebase-
          konsolen (Build → App Check → Metrics), det finns ingen API-väg att hämta den
          hit.{" "}
          <strong>Misslyckade inloggningsförsök</strong> – larmas inte alls ännu, kräver ett
          ägarbeslut om en betald tjänst (se <code>OPPNA-PUNKTER.md</code>).
        </p>
      </div>
    </details>
  );
}
