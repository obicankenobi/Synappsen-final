// Etapp 50b: låter en superadmin bevilja leverantören tillfällig läsåtkomst till organisationens
// innehåll (rutiner, förråd, anslag, kontakter) i ett 6-timmarsfönster, med en obligatorisk
// anledning. Reversibelt och tidsbegränsat (till skillnad från 49a:s radering) – kräver därför
// bara en enkel bekräftelse, inte krav 17:s dubbla bekräftelse.
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useOrganisationsstatus } from "../../hooks/useOrganisationsstatus";
import { beviljaSupportAtkomst, avslutaSupportAtkomst } from "../../firebase/functions";
import { useDialog } from "../../hooks/useDialog";
import { formateraTid } from "./adminHjalp";

export default function SupportatkomstSektion() {
  const { organisationId } = useAuth();
  const { supportAtkomstTill, supportAtkomstAnledning, fel } = useOrganisationsstatus(organisationId);
  const { confirm, visaMeddelande } = useDialog();
  const [anledning, setAnledning] = useState("");
  const [pagar, setPagar] = useState(false);

  const aktiv = supportAtkomstTill && supportAtkomstTill.toDate() > new Date();

  async function hanteraBevilja(e) {
    e.preventDefault();
    if (!(await confirm(
      "Bevilja leverantören läsåtkomst till organisationens innehåll (rutiner, förråd, " +
        "anslag, kontakter) i 6 timmar? Ni kan avsluta åtkomsten när som helst innan dess."
    ))) {
      return;
    }
    setPagar(true);
    try {
      await beviljaSupportAtkomst(anledning.trim());
      visaMeddelande("Supportåtkomst beviljad i 6 timmar.");
      setAnledning("");
    } catch (e2) {
      visaMeddelande(e2.message ?? "Kunde inte bevilja supportåtkomst.");
    } finally {
      setPagar(false);
    }
  }

  async function hanteraAvsluta() {
    if (!(await confirm("Avsluta supportåtkomsten nu?"))) return;
    setPagar(true);
    try {
      await avslutaSupportAtkomst();
      visaMeddelande("Supportåtkomsten avslutad.");
    } catch (e2) {
      visaMeddelande(e2.message ?? "Kunde inte avsluta supportåtkomsten.");
    } finally {
      setPagar(false);
    }
  }

  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary><h2>🔓 Tillfällig supportåtkomst</h2></summary>
      {fel && <p className="klinikfraga__fel">Kunde inte läsa status just nu.</p>}

      {aktiv && (
        <div className="admin-beroendetest">
          <p className="sida__beskrivning">
            🔓 <strong>Supportåtkomst är aktiv till {formateraTid(supportAtkomstTill)}.</strong>{" "}
            Anledning: "{supportAtkomstAnledning}". Leverantören kan under tiden läsa
            organisationens rutiner, förråd, anslag och kontakter.
          </p>
          <button type="button" className="knapp knapp--sekundar" disabled={pagar} onClick={hanteraAvsluta}>
            Avsluta åtkomsten nu
          </button>
        </div>
      )}

      {!aktiv && (
        <>
          <p className="sida__beskrivning">
            Ger leverantören läsåtkomst till organisationens innehåll (rutiner, förråd, anslag,
            kontakter – aldrig användarkonton eller inställningar) i 6 timmar, för att kunna
            besvara en supportfråga utan att ni behöver skicka skärmdumpar. Loggas i
            revisionsloggen och syns här hela tiden den är aktiv. Ni kan avsluta den när som
            helst.
          </p>
          <form className="leverantor__form" onSubmit={hanteraBevilja}>
            <label>
              Anledning (obligatoriskt)
              <textarea
                required
                value={anledning}
                onChange={(e) => setAnledning(e.target.value)}
                rows={2}
              />
            </label>
            <button type="submit" className="knapp" disabled={pagar || !anledning.trim()}>
              {pagar ? "..." : "Bevilja supportåtkomst"}
            </button>
          </form>
        </>
      )}
    </details>
  );
}
