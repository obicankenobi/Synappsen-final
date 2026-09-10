import { useState } from "react";
import { listaBackuper, aterstallOrganisation, exporteraOrganisation } from "../../firebase/functions";
import { useDialog } from "../../hooks/useDialog";
import "./AterstallningSektion.css";

function formateraStorlek(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} kB`;
}

// Etapp L1n (intern/ETAPPLAN-INTERN-1.md), B1: den enskilt viktigaste raden i hela Etapp L1.
// aterstallOrganisationCallable och backupaOrganisation fanns sedan tidigare som Cloud
// Functions, men UTAN gränssnitt – `avtal/INCIDENTRESPONSPLAN.md` och
// `drift/INCIDENT-CHECKLISTA.md` beskriver återställning som en existerande förmåga, men den
// gick inte att UTÖVA utan CLI mot produktionsprojektet. Den här sektionen stänger gapet.
//
// "Ta backup nu" återanvänder den REDAN BEFINTLIGA exporteraOrganisation (samma callable som
// "Exportera"-knappen i kundregistret) – planens ursprungliga premiss att backupaOrganisation
// var helt "oanvänd" höll bara för LÄSNINGEN (listaBackuper saknades), inte för skrivningen.
export default function AterstallningSektion({ organisationer, onFel }) {
  const { confirm, visaMeddelande } = useDialog();
  const [orgId, setOrgId] = useState("");
  const [backuper, setBackuper] = useState(null);
  const [laddarBackuper, setLaddarBackuper] = useState(false);
  const [tarBackupNu, setTarBackupNu] = useState(false);
  const [aterstallerSokvag, setAterstallerSokvag] = useState(null);
  const [skrivetNamn, setSkrivetNamn] = useState("");

  const valdOrg = (organisationer ?? []).find((o) => o.orgId === orgId);
  const ickeDemo = (organisationer ?? []).filter((o) => !o.arDemo);

  async function laddaBackuper(nyttOrgId) {
    setLaddarBackuper(true);
    setBackuper(null);
    onFel?.(null);
    try {
      const { data } = await listaBackuper(nyttOrgId);
      setBackuper(data.backuper);
    } catch (fel) {
      onFel?.(fel.message ?? "Kunde inte hämta backuplistan.");
    } finally {
      setLaddarBackuper(false);
    }
  }

  function hanteraValjOrg(nyttOrgId) {
    setOrgId(nyttOrgId);
    setAterstallerSokvag(null);
    setSkrivetNamn("");
    if (nyttOrgId) laddaBackuper(nyttOrgId);
    else setBackuper(null);
  }

  async function hanteraTaBackupNu() {
    setTarBackupNu(true);
    onFel?.(null);
    try {
      await exporteraOrganisation(orgId);
      visaMeddelande("Backup tagen.");
      await laddaBackuper(orgId);
    } catch (fel) {
      onFel?.(fel.message ?? "Kunde inte ta backup.");
    } finally {
      setTarBackupNu(false);
    }
  }

  async function hanteraAterstall(sokvag) {
    if (skrivetNamn !== valdOrg?.namn) return;
    if (
      !(await confirm(
        `Återställ "${valdOrg.namn}" från backupen ${sokvag}? Detta SKRIVER ÖVER all nuvarande ` +
          "data i organisationen med innehållet från den valda backupen. Går INTE att ångra."
      ))
    ) {
      return;
    }
    onFel?.(null);
    try {
      const { data } = await aterstallOrganisation(orgId, sokvag);
      visaMeddelande(`Återställd. ${data.antalAterstallda} dokument skrevs tillbaka.`);
      setAterstallerSokvag(null);
      setSkrivetNamn("");
    } catch (fel) {
      onFel?.(fel.message ?? "Kunde inte återställa.");
    }
  }

  return (
    <section className="admin-sektion">
      <h2><span aria-hidden="true">♻️</span> Backup och återställning</h2>
      <p className="sida__beskrivning">
        Välj en kund för att se sparade backuper, ta en ny, eller återställa från en tidigare.
      </p>

      <label className="leverantor__filterfalt">
        Kund
        <select value={orgId} onChange={(e) => hanteraValjOrg(e.target.value)}>
          <option value="">Välj organisation…</option>
          {ickeDemo.map((o) => (
            <option key={o.orgId} value={o.orgId}>
              {o.namn}
            </option>
          ))}
        </select>
      </label>

      {orgId && (
        <>
          <p>
            <button type="button" className="knapp knapp--sekundar knapp--liten" disabled={tarBackupNu} onClick={hanteraTaBackupNu}>
              {tarBackupNu ? "Tar backup..." : "Ta backup nu"}
            </button>
          </p>

          {laddarBackuper && <p className="sida__beskrivning">Hämtar backuper...</p>}
          {!laddarBackuper && backuper?.length === 0 && (
            <p className="sida__beskrivning">Inga backuper sparade ännu för den här organisationen.</p>
          )}
          {!laddarBackuper && backuper?.length > 0 && (
            <ul className="aterstallning__backuplista">
              {backuper.map((b) => (
                <li key={b.sokvag} className="aterstallning__backuprad">
                  <span>
                    {b.datum} ({formateraStorlek(b.storlekBytes)})
                  </span>
                  {aterstallerSokvag === b.sokvag ? (
                    <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder={`Skriv "${valdOrg?.namn}" för att bekräfta`}
                        value={skrivetNamn}
                        onChange={(e) => setSkrivetNamn(e.target.value)}
                      />
                      <button
                        type="button"
                        className="knapp knapp--farlig knapp--liten"
                        disabled={skrivetNamn !== valdOrg?.namn}
                        onClick={() => hanteraAterstall(b.sokvag)}
                      >
                        Återställ
                      </button>
                      <button
                        type="button"
                        className="knapp knapp--sekundar knapp--liten"
                        onClick={() => {
                          setAterstallerSokvag(null);
                          setSkrivetNamn("");
                        }}
                      >
                        Avbryt
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="knapp knapp--farlig knapp--liten"
                      onClick={() => setAterstallerSokvag(b.sokvag)}
                    >
                      Återställ från denna
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
