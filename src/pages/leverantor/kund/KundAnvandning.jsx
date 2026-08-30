import { useOutletContext } from "react-router-dom";

function formateraTid(tidpunkt) {
  if (!tidpunkt) return "-";
  return new Date(tidpunkt).toLocaleString("sv-SE");
}

// Etapp L1b, block 4 "Användning". Etapp L1j fyllde "Senaste aktivitet" med appversion (se
// beslutspunkt 2, avgjord 2026-08-30: BARA version, aldrig "senast aktiv" per användare –
// det vore en form av personalövervakning som behöver ett tydligare syfte).
export default function KundAnvandning() {
  const { org, sokkvot } = useOutletContext();
  const egetTak = org.sokkvotTakPerDygn ?? sokkvot?.orgTakStandard ?? null;

  return (
    <div>
      <section className="admin-sektion">
        <h2>Användning</h2>
        <dl className="kund-lista">
          <div>
            <dt>Antal användare</dt>
            <dd>
              {org.antalAnvandare}
              {org.anvandartak != null ? ` / ${org.anvandartak}` : ""}
            </dd>
          </div>
          <div>
            <dt>Sökkvot idag</dt>
            <dd>
              {org.sokkvotIdag} / {egetTak ?? "standardtak"}
            </dd>
          </div>
          <div>
            <dt>Operations-modul</dt>
            <dd>{org.moduler?.operations ? "På" : "Av"}</dd>
          </div>
          <div>
            <dt>Intelligence-modul</dt>
            <dd>{org.moduler?.intelligence ? "På" : "Av"}</dd>
          </div>
        </dl>
      </section>

      <section className="admin-sektion">
        <h2>Version</h2>
        <p className="sida__beskrivning">
          Vilken appversion en klient hos kunden senast rapporterade vid inloggning. PWA:n
          cachar, så en kund kan ligga efter en release utan att någon märker det.
        </p>
        <dl className="kund-lista">
          <div>
            <dt>Senast rapporterade version</dt>
            <dd>{org.senasteAppVersion ?? "Okänd (ingen inloggning sedan L1j byggdes)"}</dd>
          </div>
          <div>
            <dt>Rapporterad</dt>
            <dd>{formateraTid(org.senasteAppVersionTid)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
