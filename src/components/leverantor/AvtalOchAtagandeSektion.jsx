import { useState } from "react";
import {
  satPubAvtal,
  satUnderbitradeUnderrattad,
  satOmfattasAvNIS2,
  satAtagandeblock,
  begarReferensunderlag,
} from "../../firebase/functions";
import { UNDERBITRADEN_AKTUELL_VERSION } from "../../config/underbitraden";
import { useDialog } from "../../hooks/useDialog";

// Etapp L1p (intern/ETAPPLAN-INTERN-1.md): avtal och åtaganden per kund. Ligger i
// OrganisationsRad.jsx:s expansion, inte i en egen kunddossié-sida – L1b (kunddossién) är
// inte byggd än, och L1a höll uttryckligen kvar OrganisationsRad:s inline-expansion just för
// att panelen aldrig ska stå utan en väg till PER-KUND-åtgärder under tiden.
export default function AvtalOchAtagandeSektion({ org, onFel }) {
  const { confirm, visaMeddelande } = useDialog();
  const [version, setVersion] = useState(UNDERBITRADEN_AKTUELL_VERSION);
  const [atagandeText, setAtagandeText] = useState(org.atagandeblock?.text ?? "");
  const [referensAnledning, setReferensAnledning] = useState("");
  const [pagar, setPagar] = useState(false);

  const underrattadVersion = org.underbitradeUnderrattad?.version ?? null;
  const behoverUnderrattelse = underrattadVersion !== UNDERBITRADEN_AKTUELL_VERSION;

  async function korMed(fn) {
    setPagar(true);
    onFel?.(null);
    try {
      await fn();
    } catch (fel) {
      onFel?.(fel.message ?? "Något gick fel.");
    } finally {
      setPagar(false);
    }
  }

  async function hanteraPubAvtal(tecknat) {
    if (tecknat && !(await confirm(`Registrera ett tecknat PUB-avtal (version ${version}) för "${org.namn}"?`))) return;
    await korMed(async () => {
      await satPubAvtal(org.orgId, tecknat, tecknat ? version : undefined);
      visaMeddelande(tecknat ? "PUB-avtal registrerat." : "PUB-avtalet återkallat/borttaget.");
    });
  }

  async function hanteraUnderrattelse() {
    await korMed(async () => {
      await satUnderbitradeUnderrattad(org.orgId, UNDERBITRADEN_AKTUELL_VERSION);
      visaMeddelande("Underrättelse registrerad.");
    });
  }

  async function hanteraNIS2(varde) {
    await korMed(() => satOmfattasAvNIS2(org.orgId, varde));
  }

  async function hanteraAtagandeblock() {
    await korMed(async () => {
      await satAtagandeblock(org.orgId, atagandeText);
      visaMeddelande("Åtagandeblocket sparat.");
    });
  }

  async function hanteraReferensbegaran() {
    await korMed(async () => {
      await begarReferensunderlag(org.orgId, referensAnledning);
      visaMeddelande("Begäran skickad – kunden ser den i sin egen adminpanel.");
      setReferensAnledning("");
    });
  }

  return (
    <div className="leverantor__diagnostik">
      <h3>⚖️ Avtal & åtaganden</h3>

      <p className="sida__beskrivning">
        PUB-avtal (art. 28.3):{" "}
        {org.pubAvtalTecknat ? (
          <strong>Tecknat (version {org.pubAvtalVersion})</strong>
        ) : (
          <span className="leverantor__varning">Inte registrerat – "aktiv" är spärrad tills detta är gjort</span>
        )}
      </p>
      {!org.pubAvtalTecknat && (
        <p style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="text" placeholder="Version, t.ex. 2026-08-29" value={version} onChange={(e) => setVersion(e.target.value)} />
          <button type="button" className="knapp knapp--liten" disabled={pagar || !version.trim()} onClick={() => hanteraPubAvtal(true)}>
            Registrera som tecknat
          </button>
        </p>
      )}
      {org.pubAvtalTecknat && (
        <button type="button" className="knapp knapp--liten knapp--sekundar" disabled={pagar} onClick={() => hanteraPubAvtal(false)}>
          Återkalla registreringen
        </button>
      )}

      <p className="sida__beskrivning">
        Underbiträdesunderrättelse:{" "}
        {behoverUnderrattelse ? (
          <span className="leverantor__varning">
            Ligger efter (senast {underrattadVersion ?? "aldrig"}, aktuell {UNDERBITRADEN_AKTUELL_VERSION})
          </span>
        ) : (
          <strong>À jour ({underrattadVersion})</strong>
        )}
      </p>
      {behoverUnderrattelse && (
        <button type="button" className="knapp knapp--liten" disabled={pagar} onClick={hanteraUnderrattelse}>
          Registrera underrättelse ({UNDERBITRADEN_AKTUELL_VERSION})
        </button>
      )}

      <p>
        <label className="leverantor__checkbox">
          <input type="checkbox" checked={org.omfattasAvNIS2 === true} disabled={pagar} onChange={(e) => hanteraNIS2(e.target.checked)} />
          Omfattas av cybersäkerhetslagen (NIS2) – ger 24h i stället för 72h vid en incident
        </label>
      </p>

      <label>
        Åtagandeblock (vad har utlovats den här kunden)
        <textarea rows={2} value={atagandeText} onChange={(e) => setAtagandeText(e.target.value)} />
      </label>
      <button type="button" className="knapp knapp--liten" disabled={pagar} onClick={hanteraAtagandeblock}>
        Spara åtagandeblock
      </button>

      <label>
        Begär referensunderlag (kunden utför själv, med eget samtycke)
        <input type="text" placeholder="Anledning (valfritt)" value={referensAnledning} onChange={(e) => setReferensAnledning(e.target.value)} />
      </label>
      <button type="button" className="knapp knapp--liten" disabled={pagar} onClick={hanteraReferensbegaran}>
        Skicka begäran
      </button>
    </div>
  );
}
