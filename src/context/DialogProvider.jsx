import { useCallback, useRef, useState } from "react";
import { DialogContext } from "./dialogContextDef";
import "./DialogProvider.css";

const MEDDELANDE_VISAS_MS = 5000;

// Etapp 8e: en enda global instans (monterad i App.jsx) ersätter native confirm()/alert()
// överallt i appen. Se dialogContextDef.js för resonemanget.
export function DialogProvider({ children }) {
  const [fraga, setFraga] = useState(null);
  const resolveRef = useRef(null);
  const [meddelanden, setMeddelanden] = useState([]);

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
        <div className="bekraftelse-overlay" role="alertdialog" aria-modal="true">
          <div className="bekraftelse-ruta">
            <p>{fraga}</p>
            <div className="bekraftelse-knappar">
              <button type="button" className="knapp knapp--sekundar" onClick={() => svara(false)}>
                Avbryt
              </button>
              <button type="button" className="knapp" onClick={() => svara(true)} autoFocus>
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
