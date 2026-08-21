// Etapp 22e: personlig accentfärg, sparad per enhet (samma mönster som useTema.js, inte
// synkad mellan enheter/konto) – ett fast, litet urval fördefinierade färger, inte ett fritt
// färgval, så WCAG AA-kontrasten är garanterad oavsett vad någon väljer.
import { useEffect, useState } from "react";

const NYCKEL = "synappsen-accent";

export const ACCENTER = [
  { varde: "bla", namn: "Blå", farg: "#2f5fd6" },
  { varde: "gron", namn: "Grön", farg: "#15803d" },
  { varde: "lila", namn: "Lila", farg: "#7c3aed" },
  { varde: "orange", namn: "Orange", farg: "#c2410c" },
];

function lasSparadAccent() {
  try {
    const varde = localStorage.getItem(NYCKEL);
    return ACCENTER.some((a) => a.varde === varde) ? varde : "bla";
  } catch {
    return "bla";
  }
}

export function useAccent() {
  const [accent, setAccent] = useState(lasSparadAccent);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
    try {
      if (accent === "bla") localStorage.removeItem(NYCKEL);
      else localStorage.setItem(NYCKEL, accent);
    } catch {
      // Privat läge/blockerad lagring – accenten gäller ändå för denna session
    }
  }, [accent]);

  return { accent, setAccent };
}
