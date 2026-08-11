import { useEffect, useRef, useState } from "react";
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
  const rutaRef = useRef(null);
  const senasteFokusRef = useRef(null);

  // Tillgänglighet: överlägget låg ovanpå sidan men var bara två `<div>`-element – utan
  // `role="dialog"`, utan Esc-stängning, utan fokusfångst och utan fokusåterlämning. Bakgrunden
  // gick bara att stänga med musklick (WCAG 2.1.1). Samma mönster som MerMeny.jsx (Etapp 45c).
  useEffect(() => {
    senasteFokusRef.current = document.activeElement;
    rutaRef.current?.querySelector("button")?.focus();

    function hanteraTangent(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onStang();
        return;
      }
      if (e.key !== "Tab" || !rutaRef.current) return;
      const fokuserbara = rutaRef.current.querySelectorAll("a, button, input, select, textarea");
      if (fokuserbara.length === 0) return;
      const forsta = fokuserbara[0];
      const sista = fokuserbara[fokuserbara.length - 1];
      if (e.shiftKey && document.activeElement === forsta) {
        e.preventDefault();
        sista.focus();
      } else if (!e.shiftKey && document.activeElement === sista) {
        e.preventDefault();
        forsta.focus();
      }
    }

    document.addEventListener("keydown", hanteraTangent);
    return () => {
      document.removeEventListener("keydown", hanteraTangent);
      senasteFokusRef.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ska bara köras vid montering/avmontering
  }, []);

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
      <div
        className="versionshistorik"
        ref={rutaRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="versionshistorik-rubrik"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="versionshistorik__header">
          <h3 id="versionshistorik-rubrik">Versionshistorik</h3>
          <button className="knapp--lank" onClick={onStang}>
            Stäng
          </button>
        </header>

        {/* Laddnings-/tomtillståndet byttes tidigare ut tyst för en skärmläsare (WCAG 4.1.3). */}
        <div role="status" aria-live="polite">
          {versioner === null && <p>Laddar...</p>}
          {versioner?.length === 0 && <p>Inga tidigare versioner sparade.</p>}
        </div>

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
