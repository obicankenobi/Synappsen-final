// Etapp 65a: tunn wrapper runt webbläsarens inbyggda speechSynthesis (talsyntes).
// Skiljer sig fundamentalt från röstsökning (23d, avfärdad i ETAPPLAN4.md): det här är
// UTDATA, inget ljud spelas in och ingenting lämnar enheten. En röst filtrerad på
// `lang.startsWith("sv")` är dessutom typiskt en on-device-röst i moderna webbläsare.
import { useCallback, useEffect, useState } from "react";

function valjSvenskRost() {
  const roster = window.speechSynthesis?.getVoices?.() ?? [];
  return roster.find((r) => r.lang?.toLowerCase().startsWith("sv")) ?? null;
}

export function useTalsyntes() {
  const stods = typeof window !== "undefined" && "speechSynthesis" in window;
  const [laserUpp, setLaserUpp] = useState(false);

  // Avbryter alltid vid avmontering – annars fortsätter webbläsaren läsa högt över nästa
  // sida om användaren navigerar bort medan uppläsningen pågår.
  useEffect(() => {
    return () => {
      if (stods) window.speechSynthesis.cancel();
    };
  }, [stods]);

  const stoppa = useCallback(() => {
    if (stods) window.speechSynthesis.cancel();
    setLaserUpp(false);
  }, [stods]);

  const lasUpp = useCallback(
    (text) => {
      if (!stods || !text) return;
      window.speechSynthesis.cancel();
      const yttrande = new window.SpeechSynthesisUtterance(text);
      const rost = valjSvenskRost();
      if (rost) yttrande.voice = rost;
      yttrande.lang = rost?.lang ?? "sv-SE";
      yttrande.onend = () => setLaserUpp(false);
      yttrande.onerror = () => setLaserUpp(false);
      setLaserUpp(true);
      window.speechSynthesis.speak(yttrande);
    },
    [stods]
  );

  const vaxla = useCallback(
    (text) => {
      if (laserUpp) {
        stoppa();
      } else {
        lasUpp(text);
      }
    },
    [laserUpp, lasUpp, stoppa]
  );

  return { stods, laserUpp, lasUpp, stoppa, vaxla };
}
