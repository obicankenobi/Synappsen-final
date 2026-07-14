// Loggar automatiskt ut efter en period av inaktivitet – relevant säkerhetsfunktion på delade
// datorer/surfplattor på en akutmottagning. Varnar en kort stund innan utloggningen sker.
import { useCallback, useEffect, useRef, useState } from "react";

const VARNING_MINUTER = 1;
const HANDELSER = ["mousemove", "keydown", "touchstart", "click", "scroll"];

export function useInaktivitetsUtloggning(aktiv, loggaUt, inaktivMinuter = 20) {
  const [visaVarning, setVisaVarning] = useState(false);
  const varningTimer = useRef(null);
  const utloggningTimer = useRef(null);
  const senasteNollstallning = useRef(0);

  const startaTimers = useCallback(() => {
    clearTimeout(varningTimer.current);
    clearTimeout(utloggningTimer.current);
    if (!aktiv) return;
    const vantetidMinuter = Math.max(inaktivMinuter - VARNING_MINUTER, 0.5);
    varningTimer.current = setTimeout(() => {
      setVisaVarning(true);
      utloggningTimer.current = setTimeout(loggaUt, VARNING_MINUTER * 60 * 1000);
    }, vantetidMinuter * 60 * 1000);
  }, [aktiv, loggaUt, inaktivMinuter]);

  const nollstall = useCallback(() => {
    setVisaVarning(false);
    startaTimers();
  }, [startaTimers]);

  const handelseHanterare = useCallback(() => {
    const nu = Date.now();
    // Strypning – behöver inte nollställa timern flera gånger per sekund
    if (nu - senasteNollstallning.current < 5000) return;
    senasteNollstallning.current = nu;
    nollstall();
  }, [nollstall]);

  useEffect(() => {
    if (!aktiv) return undefined;
    startaTimers();
    HANDELSER.forEach((h) => window.addEventListener(h, handelseHanterare));
    return () => {
      HANDELSER.forEach((h) => window.removeEventListener(h, handelseHanterare));
      clearTimeout(varningTimer.current);
      clearTimeout(utloggningTimer.current);
    };
  }, [aktiv, startaTimers, handelseHanterare]);

  return { visaVarning, fortsattInloggad: nollstall };
}
