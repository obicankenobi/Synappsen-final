import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Etapp 13g (WCAG 2.4.2): sidans <title> ska ändras per rutt, annars kan varken en
// skärmläsaranvändare eller någon med flera öppna flikar se vilken sida de är på.
const SIDTITLAR = [
  { monster: /^\/logga-in$/, titel: "Logga in" },
  { monster: /^\/registrera$/, titel: "Registrera" },
  { monster: /^\/$/, titel: "Hem" },
  { monster: /^\/kliniskt-stod$/, titel: "Kliniskt stöd" },
  { monster: /^\/logistik\/.+/, titel: "Logistik" },
  { monster: /^\/logistik$/, titel: "Logistik" },
  { monster: /^\/administration$/, titel: "Administration" },
  { monster: /^\/ladda-upp$/, titel: "Ladda upp" },
  { monster: /^\/nyheter$/, titel: "Nyheter" },
  { monster: /^\/hjalp$/, titel: "Hjälp" },
  { monster: /^\/feedback$/, titel: "Feedback" },
  { monster: /^\/anslag$/, titel: "Anslagstavla" },
  { monster: /^\/skiftrapport$/, titel: "Skiftrapport" },
  { monster: /^\/profil$/, titel: "Profil" },
  { monster: /^\/kontakter$/, titel: "Kontakter" },
  { monster: /^\/lankbibliotek$/, titel: "Länkbibliotek" },
  { monster: /^\/papperskorg$/, titel: "Papperskorg" },
  { monster: /^\/offline-center$/, titel: "Offline-center" },
  { monster: /^\/leverantor$/, titel: "Leverantör" },
  { monster: /^\/admin$/, titel: "Adminpanel" },
  { monster: /^\/ledningsrapport$/, titel: "Ledningsrapport" },
];

function titelForSokvag(sokvag) {
  return SIDTITLAR.find((rad) => rad.monster.test(sokvag))?.titel;
}

export function useSidTitel() {
  const { pathname } = useLocation();

  useEffect(() => {
    const titel = titelForSokvag(pathname);
    document.title = titel ? `${titel} – Synappsen` : "Synappsen";
  }, [pathname]);
}
