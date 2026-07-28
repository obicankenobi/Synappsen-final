// Etapp 23a: delad öppen/stängd-status för kommandopaletten. BottomNav.jsx (mobil, ingen
// tangentbordsgenväg) och Kommandopalett.jsx (Ctrl/Cmd+K, /) behöver kunna öppna SAMMA
// instans utan att paletten måste lyftas upp till en egen Context bara för det – ett litet
// globalt DOM-event räcker och håller ändringen till två filer.
import { useEffect, useState } from "react";

const HANDELSE = "synappsen:oppna-kommandopalett";

export function oppnaKommandopalett() {
  window.dispatchEvent(new Event(HANDELSE));
}

export function useKommandopalett() {
  const [oppen, setOppen] = useState(false);

  useEffect(() => {
    function hanteraHandelse() {
      setOppen(true);
    }
    window.addEventListener(HANDELSE, hanteraHandelse);
    return () => window.removeEventListener(HANDELSE, hanteraHandelse);
  }, []);

  return { oppen, setOppen };
}
