import { useEffect, useState } from "react";
import "./VersionsHistorik.css";

function formateraTid(tidpunkt) {
  if (!tidpunkt?.toDate) return "";
  return tidpunkt.toDate().toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

export default function VersionsHistorik({ hamtaVersioner, onStang }) {
  const [versioner, setVersioner] = useState(null);

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
            <p>{v.innehall}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
