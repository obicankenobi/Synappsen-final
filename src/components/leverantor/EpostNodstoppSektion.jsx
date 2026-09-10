import { useState } from "react";
import { angeEpostAvstangd } from "../../firebase/functions";
import { useDialog } from "../../hooks/useDialog";

// Etapp 67e (ETAPPLAN16.md, ren flytt ur Leverantor.jsx – ingen beteendeförändring).
// Etapp 53a: genomgående krav 17 (dubbel bekräftelse för en irreversibel/potentiellt skadlig
// handling) – att av misstag stänga AV nödstoppet igen mitt under en pågående incident är
// precis lika allvarligt som att glömma stänga av det när man borde.
export default function EpostNodstoppSektion({ epostAvstangd, onAndrad, onFel }) {
  const [epostAndrar, setEpostAndrar] = useState(false);
  const { confirm } = useDialog();

  async function hanteraEpostAvstangd(nyttVarde) {
    const fraga = nyttVarde
      ? "Stänga av ALL utgående e-post, för alla organisationer, med omedelbar verkan?"
      : "Slå på utgående e-post igen, för alla organisationer?";
    if (!(await confirm(fraga))) return;
    setEpostAndrar(true);
    try {
      await angeEpostAvstangd(nyttVarde);
      onAndrad(nyttVarde);
    } catch (e) {
      onFel(e);
    } finally {
      setEpostAndrar(false);
    }
  }

  return (
    <section className="admin-sektion">
      <h2><span aria-hidden="true">✉️</span> Utgående e-post</h2>
      <p className="sida__beskrivning">
        Sedan Etapp 53b skickas inbjudningar per e-post (utöver den kopierbara länken). Fler
        kanaler (påminnelser, månadsrapport) tillkommer i 53c–d. {epostAvstangd
          ? "Just nu AVSTÄNGD för alla organisationer – inbjudningar skapas fortfarande, men mejlas inte."
          : "Just nu påslagen."}
      </p>
      <button
        type="button"
        className="knapp"
        disabled={epostAndrar}
        onClick={() => hanteraEpostAvstangd(!epostAvstangd)}
      >
        {epostAndrar ? "..." : epostAvstangd ? "Slå på utgående e-post igen" : "Stäng av all utgående e-post"}
      </button>
    </section>
  );
}
