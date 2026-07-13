// Hanterar val av ljust/mörkt/system-tema, sparat i localStorage.
// index.html sätter data-tema-attributet innan React laddar för att undvika en vit blink.
import { useEffect, useState } from "react";

const NYCKEL = "synappsen-tema";

function lasSparatTema() {
  try {
    const varde = localStorage.getItem(NYCKEL);
    return varde === "light" || varde === "dark" ? varde : "system";
  } catch {
    return "system";
  }
}

export function useTema() {
  const [tema, setTema] = useState(lasSparatTema);

  useEffect(() => {
    const root = document.documentElement;
    if (tema === "system") {
      delete root.dataset.tema;
    } else {
      root.dataset.tema = tema;
    }
    try {
      if (tema === "system") localStorage.removeItem(NYCKEL);
      else localStorage.setItem(NYCKEL, tema);
    } catch {
      // Privat läge/blockerad lagring – temat gäller ändå för denna session
    }
  }, [tema]);

  return { tema, setTema };
}
