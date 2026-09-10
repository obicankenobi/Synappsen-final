// Etapp 49a: låter en superadmin begära permanent radering av sin EGEN organisation, med en
// 48-timmars väntetid innan något faktiskt raderas – både kunden själv och leverantören kan
// avbryta under fönstret. Krav 17 (ETAPPLAN10.md): dubbel bekräftelse (skriv organisationens
// namn ordagrant + en explicit "Ja"-dialog) och en obligatorisk anledning, INNAN körningen.
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useOrganisationsstatus } from "../../hooks/useOrganisationsstatus";
import { begarRaderingAvOrganisation, avbrytRaderingAvOrganisation } from "../../firebase/functions";
import { useDialog } from "../../hooks/useDialog";
import { formateraTid } from "./adminHjalp";

export default function RaderaOrganisationSektion() {
  const { organisationId } = useAuth();
  const { namn, raderingSchemalagdTill, raderingAnledning, fel } = useOrganisationsstatus(organisationId);
  const { confirm, visaMeddelande } = useDialog();
  const [skrivetNamn, setSkrivetNamn] = useState("");
  const [anledning, setAnledning] = useState("");
  const [pagar, setPagar] = useState(false);

  async function hanteraBegar(e) {
    e.preventDefault();
    if (!(await confirm(
      `Begär permanent radering av "${namn}"? Organisationen pausas omedelbart. Om ingen ` +
        "avbryter inom 48 timmar raderas all data permanent (backuper sparas i 90 dagar till, " +
        "därefter är den definitivt borta)."
    ))) {
      return;
    }
    setPagar(true);
    try {
      await begarRaderingAvOrganisation(anledning.trim());
      visaMeddelande("Radering begärd. Organisationen är nu pausad.");
      setSkrivetNamn("");
      setAnledning("");
    } catch (e2) {
      visaMeddelande(e2.message ?? "Kunde inte begära radering.");
    } finally {
      setPagar(false);
    }
  }

  async function hanteraAvbryt() {
    if (!(await confirm("Avbryta den schemalagda raderingen?"))) return;
    setPagar(true);
    try {
      await avbrytRaderingAvOrganisation();
      visaMeddelande("Raderingen avbröts. Organisationen är fortfarande pausad – återaktivera separat om ni vill fortsätta använda den.");
    } catch (e2) {
      visaMeddelande(e2.message ?? "Kunde inte avbryta raderingen.");
    } finally {
      setPagar(false);
    }
  }

  return (
    <details className="admin-sektion admin-sektion--hopfallbar admin-sektion--farlig">
      <summary><h2><span aria-hidden="true">🗑️</span> Radera organisationen permanent</h2></summary>
      {fel && <p className="klinikfraga__fel">Kunde inte läsa status just nu.</p>}

      {raderingSchemalagdTill && (
        <div className="admin-beroendetest">
          <p className="sida__beskrivning">
            ⚠️ <strong>Radering är schemalagd till {formateraTid(raderingSchemalagdTill)}.</strong>{" "}
            Anledning: "{raderingAnledning}". Organisationen är pausad under tiden.
          </p>
          <button type="button" className="knapp knapp--sekundar" disabled={pagar} onClick={hanteraAvbryt}>
            Avbryt raderingen
          </button>
        </div>
      )}

      {!raderingSchemalagdTill && (
        <>
          <p className="sida__beskrivning">
            Detta pausar organisationen omedelbart och schemalägger permanent radering av all
            data (rutiner, anslag, kontakter, förråd, användarkonton m.m.) 48 timmar senare –
            inom fönstret kan ni själva eller leverantören avbryta. Redan tagna backupfiler
            sparas ytterligare 90 dagar efter det, som ett sista skyddsnät. Det går INTE att
            ångra efter att raderingen väl har körts.
          </p>
          <form className="leverantor__form" onSubmit={hanteraBegar}>
            <label>
              Skriv organisationens namn ("{namn ?? "..."}") för att bekräfta
              <input
                type="text"
                required
                value={skrivetNamn}
                onChange={(e) => setSkrivetNamn(e.target.value)}
              />
            </label>
            <label>
              Anledning (obligatoriskt)
              <textarea
                required
                value={anledning}
                onChange={(e) => setAnledning(e.target.value)}
                rows={2}
              />
            </label>
            <button
              type="submit"
              className="knapp knapp--farlig"
              disabled={pagar || !namn || skrivetNamn !== namn || !anledning.trim()}
            >
              {pagar ? "..." : "Begär radering"}
            </button>
          </form>
        </>
      )}
    </details>
  );
}
