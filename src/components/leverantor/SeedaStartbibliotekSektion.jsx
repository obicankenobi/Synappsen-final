import { useState } from "react";
import { seedaStartbibliotek } from "../../firebase/functions";
import { VERKSAMHETSTYPER } from "../../config/verksamhetstyper";

// Etapp 70e: seedar startbiblioteket mot en organisation som redan finns.
//
// Bakgrund (verkligt fynd 2026-08-26): ägaren skapade en organisation, bjöd in två kollegor,
// och de möttes av en helt tom app. Orsaken var att verksamhetstyp har default "" ("Inget
// startbibliotek") i SkapaOrganisationSektion, och att hela seedningen bara körs vid
// skapandet. Det fanns ingen väg tillbaka – därav den här sektionen.
//
// Anropet är idempotent server-side: varje del (rutiner/förråd/kontakter) hoppas över om den
// redan har innehåll, och svaret talar om vad som hoppades över.
export default function SeedaStartbibliotekSektion({ organisationer, onSeedat, onFel }) {
  const [orgId, setOrgId] = useState("");
  const [verksamhetstyp, setVerksamhetstyp] = useState("");
  const [pagar, setPagar] = useState(false);
  const [resultat, setResultat] = useState(null);

  // Tomvärdet ("Inget startbibliotek") är meningslöst här – man seedar för att FÅ innehåll.
  const valbaraTyper = VERKSAMHETSTYPER.filter((t) => t.varde !== "");

  async function hanteraSubmit(e) {
    e.preventDefault();
    if (!orgId || !verksamhetstyp) return;
    setPagar(true);
    setResultat(null);
    onFel?.(null);
    try {
      const { data } = await seedaStartbibliotek(orgId, verksamhetstyp);
      setResultat(data);
      onSeedat?.();
    } catch (fel) {
      onFel?.(fel.message ?? "Kunde inte seeda startbiblioteket.");
    } finally {
      setPagar(false);
    }
  }

  return (
    <details className="admin-sektion admin-sektion--hopfallbar">
      <summary>
        <h2>Seeda startbibliotek i efterhand</h2>
      </summary>
      <p className="sida__beskrivning">
        För en organisation som skapades utan verksamhetstyp och därför står tom. Hoppar över
        rutiner, förråd respektive kontakter som redan har innehåll – det går alltså att köra
        igen utan att något dubbleras.
      </p>
      <form className="leverantor__form" onSubmit={hanteraSubmit}>
        <label>
          Organisation
          <select required value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            <option value="">Välj organisation…</option>
            {organisationer.map((org) => (
              <option key={org.orgId} value={org.orgId}>
                {org.namn}
                {org.verksamhetstyp ? ` (${org.verksamhetstyp})` : " – ingen verksamhetstyp"}
              </option>
            ))}
          </select>
        </label>
        <label>
          Verksamhetstyp
          <select
            required
            value={verksamhetstyp}
            onChange={(e) => setVerksamhetstyp(e.target.value)}
          >
            <option value="">Välj typ…</option>
            {valbaraTyper.map((t) => (
              <option key={t.varde} value={t.varde}>
                {t.namn}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="knapp" disabled={pagar || !orgId || !verksamhetstyp}>
          {pagar ? "Seedar..." : "Seeda startbibliotek"}
        </button>
      </form>
      {resultat && (
        <div className="leverantor__resultat">
          <p>
            Klart: {resultat.antalMallrutiner} rutiner, {resultat.antalForradsartiklar}{" "}
            förrådsartiklar, {resultat.antalKontakter} kontakter.
          </p>
          {(resultat.hoppadeOver?.rutiner ||
            resultat.hoppadeOver?.forradsartiklar ||
            resultat.hoppadeOver?.kontakter) && (
            <p className="sida__beskrivning">
              Hoppade över (hade redan innehåll):{" "}
              {[
                resultat.hoppadeOver.rutiner && "rutiner",
                resultat.hoppadeOver.forradsartiklar && "förråd",
                resultat.hoppadeOver.kontakter && "kontakter",
              ]
                .filter(Boolean)
                .join(", ")}
              .
            </p>
          )}
        </div>
      )}
    </details>
  );
}
