import { useState } from "react";
import { avslutaSupportAtkomst } from "../../firebase/functions";
import { useDialog } from "../../hooks/useDialog";

function formateraNedrakning(tillISO) {
  const kvarMs = new Date(tillISO).getTime() - Date.now();
  if (kvarMs <= 0) return "Går ut nu";
  const timmar = Math.floor(kvarMs / (60 * 60 * 1000));
  const minuter = Math.floor((kvarMs % (60 * 60 * 1000)) / (60 * 1000));
  return `${timmar}h ${minuter}m kvar`;
}

// Etapp L1f, punkt 2: aktiva supportfönster samlade på ETT ställe (tidigare bara synligt per
// kundrad i registret, en i taget). Ren läsvy ovanpå fält som redan finns i
// listaOrganisationer – ingen ny datakälla, se krav 39.
export default function AktivaSupportfonsterSektion({ organisationer, onFel }) {
  const { confirm } = useDialog();
  const [pagar, setPagar] = useState(null);

  const aktiva = (organisationer ?? []).filter(
    (org) => org.supportAtkomstTill && new Date(org.supportAtkomstTill) > new Date()
  );

  if (aktiva.length === 0) return null;

  async function hanteraAvsluta(org) {
    if (!(await confirm(`Avsluta det aktiva supportfönstret för "${org.namn}" i förtid?`))) return;
    setPagar(org.orgId);
    try {
      await avslutaSupportAtkomst(org.orgId);
    } catch (fel) {
      onFel?.(fel.message ?? "Kunde inte avsluta supportfönstret.");
    } finally {
      setPagar(null);
    }
  }

  return (
    <section className="admin-sektion">
      <h2>🔓 Aktiva supportfönster ({aktiva.length})</h2>
      <ul className="admin-lista admin-lista--vertikal">
        {aktiva.map((org) => (
          <li key={org.orgId} className="admin-feedback-rad">
            <div className="admin-feedback-rad__meta">
              <span>
                <a href={`#org-${org.orgId}`}>{org.namn}</a> · {formateraNedrakning(org.supportAtkomstTill)}
              </span>
              <span>{org.supportAtkomstAnledning}</span>
            </div>
            <button
              type="button"
              className="knapp knapp--liten"
              disabled={pagar === org.orgId}
              onClick={() => hanteraAvsluta(org)}
            >
              Avsluta i förtid
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
