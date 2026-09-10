import { useState } from "react";
import { testaBeroenden, verifieraKlinikstod, verifieraRevisionslogg, hamtaBackupstatus } from "../../firebase/functions";
import { STATUS_IKON, STATUS_TEXT } from "../admin/adminHjalp";

// Etapp L1n punkt 4 (intern/ETAPPLAN-INTERN-1.md): beredskapskontrollerna, flyttade hit från
// src/components/admin/IncidentberedskapSektion.jsx (kundens adminpanel). De är leverantörens
// driftansvar, inte en enskild kunds superadmins vardag – och efter L1m når ett
// `_plattform`-konto den gamla platsen aldrig, eftersom den kräver superadmin-roll I EN
// KUNDORGANISATION.
//
// testaBeroenden/verifieraKlinikstod testar delad infrastruktur (Gemini, sökmotorn,
// Storage) – GENUINT globalt, ingen organisation att välja. verifieraRevisionslogg/
// hamtaBackupstatus är per organisation och kräver ett val, till skillnad från den gamla
// sektionen som bara kunde visa den inloggades EGEN organisation.
export default function BeredskapSektion({ organisationer, onFel }) {
  const [testarBeroenden, setTestarBeroenden] = useState(false);
  const [beroendeStatus, setBeroendeStatus] = useState(null);
  const [verifierarKlinikstod, setVerifierarKlinikstod] = useState(false);
  const [klinikstodResultat, setKlinikstodResultat] = useState(null);

  const [orgId, setOrgId] = useState("");
  const [kontrollerar, setKontrollerar] = useState(false);
  const [kedjeresultat, setKedjeresultat] = useState(null);
  const [backupstatus, setBackupstatus] = useState(null);

  const ickeDemo = (organisationer ?? []).filter((o) => !o.arDemo);

  async function hanteraTestaBeroenden() {
    setTestarBeroenden(true);
    onFel?.(null);
    try {
      const { data } = await testaBeroenden();
      setBeroendeStatus(data);
    } catch (fel) {
      onFel?.(fel.message ?? "Kunde inte testa anslutningarna.");
    } finally {
      setTestarBeroenden(false);
    }
  }

  async function hanteraVerifieraKlinikstod() {
    setVerifierarKlinikstod(true);
    onFel?.(null);
    try {
      const { data } = await verifieraKlinikstod();
      setKlinikstodResultat(data.resultat);
    } catch (fel) {
      onFel?.(fel.message ?? "Kunde inte verifiera klinikstöd-sökningen.");
    } finally {
      setVerifierarKlinikstod(false);
    }
  }

  async function hanteraKontrolleraOrg() {
    if (!orgId) return;
    setKontrollerar(true);
    setKedjeresultat(null);
    setBackupstatus(null);
    onFel?.(null);
    try {
      const [kedja, backup] = await Promise.all([
        verifieraRevisionslogg(orgId).then((r) => r.data),
        hamtaBackupstatus(orgId).then((r) => r.data),
      ]);
      setKedjeresultat(kedja);
      setBackupstatus(backup);
    } catch (fel) {
      onFel?.(fel.message ?? "Kunde inte kontrollera organisationen.");
    } finally {
      setKontrollerar(false);
    }
  }

  return (
    <section className="admin-sektion">
      <h2><span aria-hidden="true">🚨</span> Beredskapskontroll</h2>

      <div className="admin-beroendetest">
        <h3>Delad infrastruktur (alla kunder)</h3>
        <button type="button" className="knapp knapp--sekundar knapp--liten" onClick={hanteraTestaBeroenden} disabled={testarBeroenden}>
          {testarBeroenden ? "Testar..." : "🔌 Testa anslutningar"}
        </button>
        {beroendeStatus && (
          <ul className="admin-beroendetest__lista">
            {[
              ["Bildtolkning/klinikstöd-svar (Gemini)", beroendeStatus.gemini],
              ["Klinikstöd-sökningen hittar källor", beroendeStatus.sokmotor],
              ["Bilduppladdning (lagring)", beroendeStatus.storage],
              ["Klinikstöd håller sig till godkända källor", beroendeStatus.klinikstod],
            ].map(([namn, status]) => (
              <li key={namn}>
                <span className={`admin-beroendetest__punkt--${status.status}`}>{STATUS_IKON[status.status]}</span>{" "}
                {namn} – {STATUS_TEXT[status.status]}
                {status.meddelande && <span> ({status.meddelande})</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="admin-beroendetest">
        <h3>Klinikstöd-sökningen, djupare kontroll (tre frågor, alltid färskt)</h3>
        <button
          type="button"
          className="knapp knapp--sekundar knapp--liten"
          onClick={hanteraVerifieraKlinikstod}
          disabled={verifierarKlinikstod}
        >
          {verifierarKlinikstod ? "Verifierar..." : "Kör testfrågor"}
        </button>
        {klinikstodResultat && (
          <ul className="admin-beroendetest__lista">
            {klinikstodResultat.map((r) => (
              <li key={r.fraga}>
                <span className={`admin-beroendetest__punkt--${r.ok ? "ok" : "fel"}`}>{r.ok ? "🟢" : "🔴"}</span>{" "}
                "{r.fraga}" – {r.ok ? `${r.antalTraffar} godkända träffar` : r.fel ?? `otillåtna källor: ${r.otillatnaKallor?.join(", ")}`}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="admin-beroendetest">
        <h3>Revisionskedja och backup, per kund</h3>
        <label className="leverantor__filterfalt">
          Kund
          <select value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            <option value="">Välj organisation…</option>
            {ickeDemo.map((o) => (
              <option key={o.orgId} value={o.orgId}>
                {o.namn}
              </option>
            ))}
          </select>
        </label>
        <p>
          <button type="button" className="knapp knapp--sekundar knapp--liten" disabled={!orgId || kontrollerar} onClick={hanteraKontrolleraOrg}>
            {kontrollerar ? "Kontrollerar..." : "Kontrollera"}
          </button>
        </p>
        {kedjeresultat && (
          <p className="sida__beskrivning">
            {kedjeresultat.giltig ? "🟢 Kedjan är intakt." : `🔴 Kedjan är TRASIG: ${kedjeresultat.orsak} (post ${kedjeresultat.avvikelseVidId}).`}
          </p>
        )}
        {backupstatus && !backupstatus.harOperationsModul && (
          <p className="sida__beskrivning">Ingen backup körs – Operations-modulen är inte påslagen.</p>
        )}
        {backupstatus?.harOperationsModul && (
          <p className="sida__beskrivning">
            {backupstatus.senasteDatum
              ? `Senaste backup: ${backupstatus.senasteDatum} (${backupstatus.antalBackuper} sparade)`
              : "Ingen backup hittad ännu."}
          </p>
        )}
      </div>
    </section>
  );
}
