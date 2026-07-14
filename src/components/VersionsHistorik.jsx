import { useEffect, useState } from "react";
import "./VersionsHistorik.css";

function formateraTid(tidpunkt) {
  if (!tidpunkt?.toDate) return "";
  return tidpunkt.toDate().toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}

// Radbaserad diff (LCS) mellan två textinnehåll, för att visuellt visa vad som ändrats.
function diffRader(gammal, ny) {
  const a = (gammal ?? "").split("\n");
  const b = (ny ?? "").split("\n");
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const resultat = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      resultat.push({ typ: "lika", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      resultat.push({ typ: "borttagen", text: a[i] });
      i++;
    } else {
      resultat.push({ typ: "tillagd", text: b[j] });
      j++;
    }
  }
  while (i < n) {
    resultat.push({ typ: "borttagen", text: a[i] });
    i++;
  }
  while (j < m) {
    resultat.push({ typ: "tillagd", text: b[j] });
    j++;
  }
  return resultat;
}

function DiffVy({ rader }) {
  return (
    <pre className="versionshistorik__diff">
      {rader.map((r, i) => (
        <div key={i} className={`versionshistorik__diff-rad versionshistorik__diff-rad--${r.typ}`}>
          {r.typ === "tillagd" ? "+ " : r.typ === "borttagen" ? "- " : "  "}
          {r.text}
        </div>
      ))}
    </pre>
  );
}

export default function VersionsHistorik({ hamtaVersioner, nuvarandeInnehall, onAterstall, onStang }) {
  const [versioner, setVersioner] = useState(null);
  const [visarDiff, setVisarDiff] = useState(null);

  async function hanteraAterstall(v) {
    if (!confirm(`Återställa till versionen från ${formateraTid(v.sparadVersionTidpunkt)}?`)) return;
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
