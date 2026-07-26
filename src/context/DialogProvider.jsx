import { useCallback, useEffect, useRef, useState } from "react";
import { DialogContext } from "./dialogContextDef";
import "./DialogProvider.css";

const MEDDELANDE_VISAS_MS = 5000;

// Etapp 8e: en enda global instans (monterad i App.jsx) ersätter native confirm()/alert()
// överallt i appen. Se dialogContextDef.js för resonemanget.
export function DialogProvider({ children }) {
  const [fraga, setFraga] = useState(null);
  const resolveRef = useRef(null);
  const [meddelanden, setMeddelanden] = useState([]);
  const rutaRef = useRef(null);
  const senasteFokusRef = useRef(null);

  const confirm = useCallback((text) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setFraga(text);
    });
  }, []);

  function svara(resultat) {
    setFraga(null);
    resolveRef.current?.(resultat);
    resolveRef.current = null;
  }

  // Etapp 13g (WCAG 2.4.3/4.1.2): kom ihåg vad som var fokuserat innan dialogen öppnades,
  // flytta fokus in i dialogen, och fånga Tab/Esc så fokus aldrig läcker ut till
  // bakgrundsinnehållet medan dialogen är öppen. Vid stängning återlämnas fokus dit det kom
  // ifrån.
  useEffect(() => {
    if (!fraga) return undefined;

    senasteFokusRef.current = document.activeElement;
    const jaKnapp = rutaRef.current?.querySelector("[data-dialog-ja]");
    jaKnapp?.focus();

    function hanteraTangent(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        svara(false);
        return;
      }
      if (e.key !== "Tab" || !rutaRef.current) return;
      const fokuserbara = rutaRef.current.querySelectorAll("button, [href], input, select, textarea");
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
  }, [fraga]);

  const visaMeddelande = useCallback((text) => {
    const id = crypto.randomUUID();
    setMeddelanden((nu) => [...nu, { id, text }]);
    setTimeout(() => {
      setMeddelanden((nu) => nu.filter((m) => m.id !== id));
    }, MEDDELANDE_VISAS_MS);
  }, []);

  function stangMeddelande(id) {
    setMeddelanden((nu) => nu.filter((m) => m.id !== id));
  }

  return (
    <DialogContext.Provider value={{ confirm, visaMeddelande }}>
      {children}

      {fraga && (
        <div className="bekraftelse-overlay" role="alertdialog" aria-modal="true" aria-labelledby="bekraftelse-text">
          <div className="bekraftelse-ruta" ref={rutaRef}>
            <p id="bekraftelse-text">{fraga}</p>
            <div className="bekraftelse-knappar">
              <button type="button" className="knapp knapp--sekundar" onClick={() => svara(false)}>
                Avbryt
              </button>
              <button type="button" className="knapp" onClick={() => svara(true)} data-dialog-ja autoFocus>
                Ja
              </button>
            </div>
          </div>
        </div>
      )}

      {meddelanden.length > 0 && (
        <div className="meddelande-stack" role="status">
          {meddelanden.map((m) => (
            <div key={m.id} className="meddelande-ruta" onClick={() => stangMeddelande(m.id)}>
              {m.text}
            </div>
          ))}
        </div>
      )}
    </DialogContext.Provider>
  );
}
