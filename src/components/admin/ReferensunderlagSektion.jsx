import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useOrganisationsstatus } from "../../hooks/useOrganisationsstatus";
import { exporteraReferensunderlag } from "../../firebase/functions";
import { ROLES } from "../../firebase/roles";

const FALT_NAMN = {
  antalAnstallda: "Antal anställda",
  kvitteringsgradKlinisktStod: "Kvittering kliniskt stöd",
  kvitteringsgradAdministration: "Kvittering administration",
  andelNollTraffar: "Andel nollträffar",
  tidAttHittaSekunder: "Tid-att-hitta (sekunder)",
  innehallshalsaKlinisktStod: "Innehållshälsa kliniskt stöd",
};

// Etapp 39d: anonymiserat referensunderlag för säljmaterial. Ägarbeslut 2026-08-02: ja, men
// ANONYMISERAT – kundens namn får aldrig förekomma i exporten (se functions/index.js
// exporteraReferensunderlag, som medvetet aldrig hämtar/returnerar namn/orgnr/organisationId).
// Medgivandet bekräftas aktivt vid VARJE export (kryssrutan återställs efter varje export,
// sparas aldrig som en förutsättning) och loggas i revisionsloggen server-side.
export default function ReferensunderlagSektion() {
  const { role, organisationId } = useAuth();
  // Etapp L1p punkt 5: leverantören kan BE om ett referensunderlag, aldrig ta ut det själv –
  // exporten kräver fortfarande aktivt samtycke här, varje gång.
  const { referensunderlagBegart } = useOrganisationsstatus(organisationId);
  const [samtycke, setSamtycke] = useState(false);
  const [genererar, setGenererar] = useState(false);
  const [underlag, setUnderlag] = useState(null);
  const [fel, setFel] = useState(null);
  const [kopierat, setKopierat] = useState(false);

  if (role !== ROLES.SUPERADMIN) return null;

  async function hanteraGenerera() {
    setGenererar(true);
    setFel(null);
    try {
      const { data } = await exporteraReferensunderlag(samtycke);
      setUnderlag(data);
      setSamtycke(false);
    } catch (felObjekt) {
      setFel(felObjekt.message || "Kunde inte generera referensunderlaget.");
    } finally {
      setGenererar(false);
    }
  }

  function textVersion(data) {
    return Object.entries(FALT_NAMN)
      .map(([falt, namnText]) => `${namnText}: ${data[falt] ?? "–"}`)
      .join("\n");
  }

  async function hanteraKopiera() {
    await navigator.clipboard.writeText(textVersion(underlag));
    setKopierat(true);
    setTimeout(() => setKopierat(false), 2000);
  }

  return (
    <section className="admin-sektion">
      <h2>Referensunderlag för säljmaterial</h2>
      <p className="sida__beskrivning">
        Anonymiserad sammanställning – kundens namn ingår ALDRIG. Kräver att kundens
        uttryckliga medgivande bekräftas aktivt varje gång, och loggas i revisionsloggen.
      </p>
      {referensunderlagBegart && (
        <p className="leverantor__info">
          Leverantören har bett om ett referensunderlag
          {referensunderlagBegart.anledning ? ` (${referensunderlagBegart.anledning})` : ""}. Ni väljer själva om
          och när ni genererar och delar det – ingenting skickas automatiskt.
        </p>
      )}
      <label className="admin-formular-rad">
        <input type="checkbox" checked={samtycke} onChange={(e) => setSamtycke(e.target.checked)} />
        Jag bekräftar att kunden gett sitt uttryckliga medgivande till att dessa (anonymiserade)
        siffror används externt.
      </label>
      <button type="button" className="knapp" onClick={hanteraGenerera} disabled={!samtycke || genererar}>
        {genererar ? "Genererar…" : "Generera referensunderlag"}
      </button>
      {fel && <p role="alert">{fel}</p>}
      {underlag && (
        <div>
          <ul className="admin-statistik-lista">
            {Object.entries(FALT_NAMN).map(([falt, namnText]) => (
              <li key={falt}>
                {namnText} <span>{underlag[falt] ?? "–"}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="knapp knapp--liten" onClick={hanteraKopiera}>
            {kopierat ? "Kopierat!" : "Kopiera som text"}
          </button>
        </div>
      )}
    </section>
  );
}
