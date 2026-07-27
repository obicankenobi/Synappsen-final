import { useMemo, useState } from "react";

const HANDELSETYP_ETIKETT = {
  organisation_etablerad: "Organisation etablerad",
  organisation_pausad: "Organisation pausad",
  organisation_atveraktiverad: "Organisation återaktiverad",
  organisation_exporterad: "Organisation exporterad",
  anvandare_skapad: "Användare skapad",
  anvandare_utloggning_tvingad: "Tvingad utloggning",
  rutin_publicerad: "Rutin publicerad",
  rutin_godkand: "Rutin godkänd",
  rutin_borttagen: "Rutin borttagen",
  revisionslogg_exporterad: "Revisionslogg exporterad",
};

function formateraRevisionsTid(tidpunkt) {
  if (!tidpunkt) return "-";
  return new Date(tidpunkt).toLocaleString("sv-SE");
}

function laddaNerFil(innehall, filnamn, mimetyp) {
  const blob = new Blob([innehall], { type: mimetyp });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filnamn;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function RevisionsloggSektion({
  revisionslogg,
  hanteraVerifieraRevisionslogg,
  verifierarRevisionslogg,
  revisionsloggVerifiering,
  hanteraExporteraRevisionslogg,
  exporterarRevisionslogg,
}) {
  const [datumFran, setDatumFran] = useState("");
  const [datumTill, setDatumTill] = useState("");
  const [aktorFilter, setAktorFilter] = useState("");
  const [handelsetypFilter, setHandelsetypFilter] = useState("");

  const handelsetyper = useMemo(
    () => [...new Set(revisionslogg.map((p) => p.handelsetyp).filter(Boolean))].sort(),
    [revisionslogg]
  );

  const filtreradRevisionslogg = useMemo(() => {
    const franTid = datumFran ? new Date(datumFran).getTime() : null;
    // +1 dag så "till"-datumet är inkluderande (annars räknas det som midnatt samma dag)
    const tillTid = datumTill ? new Date(datumTill).getTime() + 24 * 60 * 60 * 1000 : null;
    const aktorSok = aktorFilter.trim().toLowerCase();
    return revisionslogg.filter((p) => {
      if (franTid && p.tidpunkt < franTid) return false;
      if (tillTid && p.tidpunkt >= tillTid) return false;
      if (handelsetypFilter && p.handelsetyp !== handelsetypFilter) return false;
      if (aktorSok && !(p.aktorUid ?? "").toLowerCase().includes(aktorSok)) return false;
      return true;
    });
  }, [revisionslogg, datumFran, datumTill, aktorFilter, handelsetypFilter]);

  async function exporteraCSV() {
    const resultat = await hanteraExporteraRevisionslogg();
    if (!resultat) return;
    const rader = [
      `# ${resultat.begransningstext.replaceAll("\n", " ")}`,
      `# Kedjeverifiering vid exporttillfället: ${resultat.giltig ? "GILTIG" : `TRASIG (${resultat.orsak ?? "okänt fel"}, post ${resultat.avvikelseVidId ?? "?"})`}`,
      "tidpunkt;handelsetyp;aktorUid;aktorRoll;objektTyp;objektId;sammanfattning;foregaendeHash;hash",
      ...filtreradRevisionslogg.map((p) =>
        [
          formateraRevisionsTid(p.tidpunkt),
          p.handelsetyp ?? "",
          p.aktorUid ?? "",
          p.aktorRoll ?? "",
          p.objektTyp ?? "",
          p.objektId ?? "",
          (p.sammanfattning ?? "").replaceAll(";", ","),
          p.foregaendeHash ?? "",
          p.hash ?? "",
        ].join(";")
      ),
    ];
    laddaNerFil("﻿" + rader.join("\n"), `revisionslogg-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8");
  }

  async function exporteraJSON() {
    const resultat = await hanteraExporteraRevisionslogg();
    if (!resultat) return;
    const innehall = JSON.stringify(
      {
        begransningstext: resultat.begransningstext,
        kedjeverifieringVidExport: { giltig: resultat.giltig, avvikelseVidId: resultat.avvikelseVidId, orsak: resultat.orsak },
        poster: filtreradRevisionslogg,
      },
      null,
      2
    );
    laddaNerFil(innehall, `revisionslogg-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
  }

  return (
    <section className="admin-sektion">
      <h2>🔒 Revisionslogg</h2>
      <p className="sida__beskrivning">
        En granskningsbar logg med begränsad manipuleringsdetektion (hashkedja) – se
        "Verifiera kedjan" nedan för vad kontrollen faktiskt bevisar och inte bevisar.
        Skiljer sig från Ändringslogg ovan genom att ingen klient, oavsett roll, kan skriva
        eller ändra en post här direkt.
      </p>

      <div className="admin-audit-filter">
        <label>
          Från <input type="date" value={datumFran} onChange={(e) => setDatumFran(e.target.value)} />
        </label>
        <label>
          Till <input type="date" value={datumTill} onChange={(e) => setDatumTill(e.target.value)} />
        </label>
        <input
          type="search"
          placeholder="Sök på aktör (uid)..."
          value={aktorFilter}
          onChange={(e) => setAktorFilter(e.target.value)}
        />
        <select value={handelsetypFilter} onChange={(e) => setHandelsetypFilter(e.target.value)}>
          <option value="">Alla händelsetyper</option>
          {handelsetyper.map((t) => (
            <option key={t} value={t}>
              {HANDELSETYP_ETIKETT[t] ?? t}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-beroendetest">
        <button
          type="button"
          className="knapp knapp--sekundar knapp--liten"
          onClick={hanteraVerifieraRevisionslogg}
          disabled={verifierarRevisionslogg}
        >
          {verifierarRevisionslogg ? "Verifierar..." : "Verifiera kedjan"}
        </button>{" "}
        <button type="button" className="knapp knapp--sekundar knapp--liten" onClick={exporteraCSV} disabled={exporterarRevisionslogg}>
          Exportera som CSV
        </button>{" "}
        <button type="button" className="knapp knapp--sekundar knapp--liten" onClick={exporteraJSON} disabled={exporterarRevisionslogg}>
          Exportera som JSON
        </button>
        {revisionsloggVerifiering && (
          <p className={revisionsloggVerifiering.giltig ? "admin-beroendetest__punkt--ok" : "admin-beroendetest__punkt--fel"}>
            {revisionsloggVerifiering.giltig
              ? "🟢 Kedjan är giltig – inga poster har ändrats eller tagits bort via normal appanvändning."
              : `🔴 Kedjan är TRASIG: ${revisionsloggVerifiering.orsak} (post ${revisionsloggVerifiering.avvikelseVidId})`}
            {revisionsloggVerifiering.fel && ` Fel: ${revisionsloggVerifiering.fel}`}
          </p>
        )}
        {revisionsloggVerifiering?.begransningstext && (
          <p className="sida__beskrivning">{revisionsloggVerifiering.begransningstext}</p>
        )}
      </div>

      {revisionslogg.length === 0 && <p className="sida__beskrivning">Inga händelser loggade ännu.</p>}
      {revisionslogg.length > 0 && (
        <ul className="admin-lista admin-lista--vertikal">
          {filtreradRevisionslogg.map((p) => (
            <li key={p.id} className="admin-feedback-rad">
              <div className="admin-feedback-rad__meta">
                <span>
                  {HANDELSETYP_ETIKETT[p.handelsetyp] ?? p.handelsetyp} – {p.sammanfattning}
                </span>
                <span>
                  {formateraRevisionsTid(p.tidpunkt)} · {p.aktorRoll ?? "okänd roll"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
