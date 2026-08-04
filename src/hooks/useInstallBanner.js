import { useEffect, useState } from "react";

const DOLD_NYCKEL = "synappsen-installbanner-dold";

function arStandalone() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari exponerar aldrig display-mode: standalone på samma sätt – egen flagga.
    window.navigator.standalone === true
  );
}

function arIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const arIos = /iphone|ipad|ipod/i.test(ua);
  // Utesluter andra iOS-webbläsare (Chrome/Firefox på iOS delar WebKit men saknar
  // "Lägg till på hemskärmen" i samma meny) – de har alla "CriOS"/"FxiOS" i UA-strängen.
  const arAndraIosBlasare = /crios|fxios|edgios/i.test(ua);
  return arIos && !arAndraIosBlasare;
}

// Etapp 44a: fångar webbläsarens `beforeinstallprompt` (Android/Chrome/Edge/Desktop) istället
// för att förlita sig på webbläsarens egen, lätt missade installationsikon i adressfältet.
// iOS Safari avfyrar aldrig det eventet (Apple stöder bara manuell "Dela → Lägg till på
// hemskärmen") – separat gren visar en instruktionstext istället för en falsk knapp.
export function useInstallBanner() {
  const [installEvent, setInstallEvent] = useState(null);
  const [dold, setDold] = useState(() => {
    try {
      return localStorage.getItem(DOLD_NYCKEL) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    function hanteraBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallEvent(event);
    }
    window.addEventListener("beforeinstallprompt", hanteraBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", hanteraBeforeInstallPrompt);
  }, []);

  function dolj() {
    setDold(true);
    try {
      localStorage.setItem(DOLD_NYCKEL, "1");
    } catch {
      // Privat läge/blockerad lagring – banderollen döljs ändå för den här sidladdningen.
    }
  }

  async function installera() {
    if (!installEvent) return;
    await installEvent.prompt();
    setInstallEvent(null);
  }

  if (dold || arStandalone()) {
    return { visaBanner: false };
  }
  if (installEvent) {
    return { visaBanner: true, typ: "installera", installera, dolj };
  }
  if (arIosSafari()) {
    return { visaBanner: true, typ: "ios-instruktion", dolj };
  }
  return { visaBanner: false };
}
