import { useState } from "react";
import {
  pausaOrganisation,
  satAvtalsstatus,
  satProvperiod,
  satAvtaladArsavgift,
  satSokkvotTakPerDygn,
  satHuvudman,
  seedaStartbibliotek,
  exporteraOrganisation,
  avslutaSupportAtkomst,
} from "../../firebase/functions";
import { AVTALSSTATUS_ETIKETT } from "./avtalsstatusEtikett";
import { VERKSAMHETSTYPER } from "../../config/verksamhetstyper";
import { useDialog } from "../../hooks/useDialog";

const VALBARA_VERKSAMHETSTYPER = VERKSAMHETSTYPER.filter((t) => t.varde !== "");

// Etapp L1b, block 7 "Åtgärder": allt som tidigare låg utspritt i `OrganisationsRad.jsx`
// och tre andra sektioner, samlat på ett ställe för EN kund. Fristående komponent (egen
// state, egna anrop) – återanvänder samma Cloud Functions som redan är byggda och testade,
// ingen ny backend. `OrganisationsRad.jsx`s motsvarande fält rörs INTE (se den filens egen
// kommentar) – att flytta bort dem därifrån är ett separat, större steg som L1b inte kräver.
export default function KundAtgarderSektion({ org, onAndrad, onFel }) {
  const { confirm, visaMeddelande } = useDialog();
  const [pagar, setPagar] = useState(false);
  const [provperiodDraft, setProvperiodDraft] = useState(org.provperiodSlut ?? "");
  const [arsavgiftDraft, setArsavgiftDraft] = useState(org.avtaladArsavgiftKr ?? "");
  const [sokkvotTakDraft, setSokkvotTakDraft] = useState(org.sokkvotTakPerDygn ?? "");
  const [huvudmanDraft, setHuvudmanDraft] = useState(org.huvudman ?? "");
  const [verksamhetstyp, setVerksamhetstyp] = useState("");
  const [seedResultat, setSeedResultat] = useState(null);

  async function korMed(fn) {
    setPagar(true);
    onFel?.(null);
    try {
      await fn();
      onAndrad?.();
    } catch (fel) {
      onFel?.(fel.message ?? "Något gick fel.");
    } finally {
      setPagar(false);
    }
  }

  async function hanteraPausa() {
    const blirPausad = org.status !== "pausad";
    if (!(await confirm(blirPausad ? `Pausa "${org.namn}"?` : `Återaktivera "${org.namn}"?`))) return;
    await korMed(() => pausaOrganisation(org.orgId, blirPausad));
  }

  async function hanteraAvtalsstatus(e) {
    const nyStatus = e.target.value;
    await korMed(async () => {
      await satAvtalsstatus(org.orgId, nyStatus);
    });
  }

  async function hanteraProvperiod() {
    await korMed(() => satProvperiod(org.orgId, provperiodDraft || null));
  }

  async function hanteraArsavgift() {
    const varde = arsavgiftDraft === "" ? null : Number(arsavgiftDraft);
    await korMed(() => satAvtaladArsavgift(org.orgId, varde));
  }

  async function hanteraSokkvotTak() {
    const varde = sokkvotTakDraft === "" ? null : Number(sokkvotTakDraft);
    await korMed(() => satSokkvotTakPerDygn(org.orgId, varde));
  }

  async function hanteraHuvudman() {
    await korMed(() => satHuvudman(org.orgId, huvudmanDraft.trim() || null));
  }

  async function hanteraSeed() {
    if (!verksamhetstyp) return;
    setPagar(true);
    onFel?.(null);
    try {
      const { data } = await seedaStartbibliotek(org.orgId, verksamhetstyp);
      setSeedResultat(data);
      onAndrad?.();
    } catch (fel) {
      onFel?.(fel.message ?? "Kunde inte seeda startbiblioteket.");
    } finally {
      setPagar(false);
    }
  }

  async function hanteraExport() {
    await korMed(async () => {
      const { data } = await exporteraOrganisation(org.orgId);
      visaMeddelande(`Exporterad till ${data.path}.`);
    });
  }

  async function hanteraAvslutaSupport() {
    if (!(await confirm(`Avsluta det aktiva supportfönstret för "${org.namn}" i förtid?`))) return;
    await korMed(() => avslutaSupportAtkomst(org.orgId));
  }

  return (
    <div>
      <section className="admin-sektion">
        <h2>Status</h2>
        <p>
          <button type="button" className="knapp knapp--liten" disabled={pagar} onClick={hanteraPausa}>
            {org.status === "pausad" ? "Återaktivera" : "Pausa"}
          </button>
        </p>
        <label className="leverantor__avtalsstatus">
          Avtalsstatus
          <select value={org.avtalsstatus} disabled={pagar} onChange={hanteraAvtalsstatus}>
            {Object.entries(AVTALSSTATUS_ETIKETT).map(([varde, etikett]) => (
              <option key={varde} value={varde}>
                {etikett}
              </option>
            ))}
          </select>
        </label>
        {org.supportAtkomstTill && new Date(org.supportAtkomstTill) > new Date() && (
          <p>
            <button type="button" className="knapp knapp--liten" disabled={pagar} onClick={hanteraAvslutaSupport}>
              Avsluta supportfönster i förtid
            </button>
          </p>
        )}
      </section>

      <section className="admin-sektion">
        <h2>Villkor</h2>
        <label>
          Provperiod slut (lämna tomt för ingen)
          <input type="date" value={provperiodDraft} onChange={(e) => setProvperiodDraft(e.target.value)} />
        </label>
        <button type="button" className="knapp knapp--liten" disabled={pagar} onClick={hanteraProvperiod}>
          Spara provperiod
        </button>

        <label>
          Avtalad årsavgift (kr)
          <input type="number" min="0" value={arsavgiftDraft} onChange={(e) => setArsavgiftDraft(e.target.value)} />
        </label>
        <button type="button" className="knapp knapp--liten" disabled={pagar} onClick={hanteraArsavgift}>
          Spara årsavgift
        </button>

        <label>
          Sökkvottak per dygn (lämna tomt för standardtak)
          <input type="number" min="1" value={sokkvotTakDraft} onChange={(e) => setSokkvotTakDraft(e.target.value)} />
        </label>
        <button type="button" className="knapp knapp--liten" disabled={pagar} onClick={hanteraSokkvotTak}>
          Spara sökkvottak
        </button>

        <label>
          Huvudman (lämna tomt för ingen)
          <input type="text" value={huvudmanDraft} onChange={(e) => setHuvudmanDraft(e.target.value)} />
        </label>
        <button type="button" className="knapp knapp--liten" disabled={pagar} onClick={hanteraHuvudman}>
          Spara huvudman
        </button>
      </section>

      <section className="admin-sektion">
        <h2>Startbibliotek</h2>
        <p className="sida__beskrivning">Hoppar över det som redan har innehåll – går att köra om.</p>
        <label>
          Verksamhetstyp
          <select value={verksamhetstyp} onChange={(e) => setVerksamhetstyp(e.target.value)}>
            <option value="">Välj typ…</option>
            {VALBARA_VERKSAMHETSTYPER.map((t) => (
              <option key={t.varde} value={t.varde}>
                {t.namn}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="knapp knapp--liten" disabled={pagar || !verksamhetstyp} onClick={hanteraSeed}>
          Seeda startbibliotek
        </button>
        {seedResultat && (
          <p className="sida__beskrivning">
            Klart: {seedResultat.antalMallrutiner} rutiner, {seedResultat.antalForradsartiklar} förrådsartiklar,{" "}
            {seedResultat.antalKontakter} kontakter.
          </p>
        )}
      </section>

      <section className="admin-sektion">
        <h2>Export</h2>
        <button type="button" className="knapp knapp--liten" disabled={pagar} onClick={hanteraExport}>
          Exportera (backup/GDPR-underlag)
        </button>
      </section>
    </div>
  );
}
