import { useEffect, useState } from "react";
import { useDialog } from "../hooks/useDialog";
import { diffRader } from "../utils/diff";
import DiffVy from "./DiffVy";
import "./VersionsHistorik.css";

function formateraTid(tidpunkt) {
  if (!tidpunkt?.toDate) return "";
  return tidpunkt.toDate().toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

export default function VersionsHistorik({ hamtaVersioner, nuvarandeInnehall, onAterstall, onStang }) {
  const { confirm } = useDialog();
  const [versioner, setVersioner] = useState(null);
  const [visarDiff, setVisarDiff] = useState(null);

  async function hanteraAterstall(v) {
    if (!(await confirm(`Återställa till versionen från ${formateraTid(v.sparadVersionTidpunkt)}?`))) return;
    await onAterstall(v);
    onStang();
  }

  useEffect(() => {
    let aktiv = true;
    hamtaVersioner().then((v) => {
      if (aktiv) setVersioner(v);
    });
    return () => {
      aktiv = false;
    };
  }, [hamtaVersioner]);

  return (
    <div className="versionshistorik-overlag" onClick={onStang}>
      <div className="versionshistorik" onClick={(e) => e.stopPropagation()}>
        <header className="versionshistorik__header">
          <h3>Versionshistorik</h3>
          <button className="knapp--lank" onClick={onStang}>
            Stäng
          </button>
        </header>

        {versioner === null && <p>Laddar...</p>}
        {versioner?.length === 0 && <p>Inga tidigare versioner sparade.</p>}

        {versioner?.map((v) => (
          <article key={v.id} className="versionshistorik__post">
            <div className="versionshistorik__meta">{formateraTid(v.sparadVersionTidpunkt)}</div>
            <h4>{v.titel}</h4>
            {visarDiff === v.id ? (
              <DiffVy rader={diffRader(v.innehall, nuvarandeInnehall)} />
            ) : (
              <p>{v.innehall}</p>
            )}
            <div className="versionshistorik__post-atgarder">
              <button
                type="button"
                className="knapp--lank"
                onClick={() => setVisarDiff((aktuell) => (aktuell === v.id ? null : v.id))}
              >
                {visarDiff === v.id ? "Visa vanlig text" : "Visa ändringar sedan denna version"}
              </button>
              <button type="button" className="knapp knapp--sekundar knapp--liten" onClick={() => hanteraAterstall(v)}>
                Återställ den här versionen
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
