import { lazy, Suspense, useEffect } from "react";
import { useKommandopalett } from "../hooks/useKommandopalett";

// Lazy-laddad: Fuse.js och sökhookarna (useSokindex m.fl.) ska inte tynga ner
// startladdningen för alla, bara för de som faktiskt öppnar paletten (genomgående krav 9,
// ETAPPLAN4.md).
const KommandopalettInnehall = lazy(() => import("./KommandopalettInnehall"));

function faltErSkrivbart(el) {
  return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
}

// Etapp 23a: den enda delen av kommandopaletten som behöver vara med i huvudbundlen – bara
// en global tangentbordslyssnare (Ctrl/Cmd+K, "/") och öppen/stängd-status. Mounted en gång
// i App.jsx (SkyddatLayout), så genvägen fungerar på VILKEN sida som helst.
export default function KommandopalettLyssnare() {
  const { oppen, setOppen } = useKommandopalett();

  useEffect(() => {
    function hanteraTangent(e) {
      const cmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      const snedstreck = e.key === "/" && !faltErSkrivbart(document.activeElement);
      if (!cmdK && !snedstreck) return;
      e.preventDefault();
      setOppen(true);
    }
    document.addEventListener("keydown", hanteraTangent);
    return () => document.removeEventListener("keydown", hanteraTangent);
  }, [setOppen]);

  if (!oppen) return null;

  return (
    <Suspense fallback={null}>
      <KommandopalettInnehall onStang={() => setOppen(false)} />
    </Suspense>
  );
}
