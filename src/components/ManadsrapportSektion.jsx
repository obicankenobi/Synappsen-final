import { useState } from "react";
import { manadsrapportOrganisationer } from "../firebase/functions";
import "./ManadsrapportSektion.css";

function laddaNerFil(innehall, filnamn, mimetyp) {
  const blob = new Blob([innehall], { type: mimetyp });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filnamn;
  a.click();
  URL.revokeObjectURL(a.href);
}

function formateraStorlek(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Etapp 15c: faktureringsunderlaget. Hämtas bara på begäran (inte vid varje sidladdning av
// Leverantor.jsx) eftersom lagringsvolymen kräver en genomgång av HELA Storage-bucketen
// server-side (se manadsrapportOrganisationer i functions/index.js) – onödigt dyrt att köra
// automatiskt varje gång en leverantörsadmin bara vill pausa en organisation.
export default function ManadsrapportSektion() {
  const [rapport, setRapport] = useState(null);
  const [laddar, setLaddar] = useState(false);
  const [fel, setFel] = useState(null);

  async function hanteraLadda() {
    setLaddar(true);
    setFel(null);
    try {
      const { data } = await manadsrapportOrganisationer();
      setRapport(data.organisationer);
    } catch (e) {
      setFel(e);
    } finally {
      setLaddar(false);
    }
  }

  function exporteraCSV() {
    const rader = [
      "organisation;manad;anvandare;rutiner;aikostnadKr;aianropUppskattat;lagringMB",
      ...rapport.map((r) =>
        [
          r.namn.replaceAll(";", ","),
          r.aktuellManad,
          r.antalAnvandare,
          r.antalRutiner,
          (r.anvantOre / 100).toFixed(2),
          r.antalAnropUppskattat,
          (r.lagringBytes / (1024 * 1024)).toFixed(1),
        ].join(";")
      ),
    ];
    laddaNerFil(
      "﻿" + rader.join("\n"),
      `manadsrapport-${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8"
    );
  }

  return (
    <section className="admin-sektion">
      <h2>📊 Månadsrapport</h2>
      <p className="sida__beskrivning">
        Faktureringsunderlag per organisation för innevarande månad: aktiva användare, antal
        rutiner, AI-kostnad/AI-anrop (uppskattat) och lagringsvolym.
      </p>
      <div className="manadsrapport__atgarder">
        <button type="button" className="knapp knapp--liten" disabled={laddar} onClick={hanteraLadda}>
          {laddar ? "Laddar..." : "Ladda rapport"}
        </button>
        {rapport && (
          <button type="button" className="knapp knapp--sekundar knapp--liten" onClick={exporteraCSV}>
            Exportera som CSV
          </button>
        )}
      </div>
      {fel && <p className="leverantor__fel">{fel.message}</p>}
      {rapport && (
        <div className="manadsrapport__tabell-wrapper">
          <table className="manadsrapport__tabell">
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Månad</th>
                <th>Användare</th>
                <th>Rutiner</th>
                <th>AI-kostnad</th>
                <th>AI-anrop (uppskattat)</th>
                <th>Lagring</th>
              </tr>
            </thead>
            <tbody>
              {rapport.map((r) => (
                <tr key={r.orgId}>
                  <td>{r.namn}</td>
                  <td>{r.aktuellManad}</td>
                  <td>{r.antalAnvandare}</td>
                  <td>{r.antalRutiner}</td>
                  <td>{(r.anvantOre / 100).toFixed(2)} kr</td>
                  <td>{r.antalAnropUppskattat}</td>
                  <td>{formateraStorlek(r.lagringBytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
