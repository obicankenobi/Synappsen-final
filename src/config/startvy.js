// Etapp 17a: rollbaserad startvy. Central definition av vilka "block" (kort) som finns på
// Hem.jsx och i vilken ORDNING de visas per roll som standard – superadmin kan ändra
// ordningen per organisation (se useStartvyKonfiguration.js), men appen ska fungera bra
// direkt utan att någon konfigurerar något.
import { ROLES } from "../firebase/roles";

export const STARTVY_BLOCK = {
  // Etapp 25b: enda blocket med DYNAMISKT innehåll (antal + de tre viktigaste posterna
  // sedan förra passet) – Hem.jsx särskiljer den här nyckeln och renderar
  // SedanForraPassetKort.jsx istället för den generiska SektionsKort. Titel/beskrivning/ikon
  // här används ändå av StartvyKonfigurationSektion.jsx:s ordningslista i adminpanelen.
  "sedan-forra-passet": {
    titel: "Sedan ditt förra pass",
    beskrivning: "Vad som hänt sedan din förra inloggning",
    ikon: "🕑",
    lank: "/sedan-forra-passet",
  },
  "kliniskt-stod": {
    titel: "Kliniskt stöd",
    beskrivning: "Handläggningsrutiner, triagering och kom-ihåg-saker",
    ikon: "🩺",
    lank: "/kliniskt-stod",
  },
  logistik: {
    titel: "Logistik",
    beskrivning: "Introduktionsguide och förvaringskarta",
    ikon: "📦",
    lank: "/logistik",
  },
  administration: {
    titel: "Administration",
    beskrivning: "Policys, regelverk och anslag",
    ikon: "📋",
    lank: "/administration",
  },
  "ladda-upp": {
    titel: "Ladda upp dokument",
    beskrivning: "Fota en whiteboard eller ett papper – Gemini tolkar innehållet",
    ikon: "📷",
    lank: "/ladda-upp",
  },
  skiftrapport: {
    titel: "Skiftrapport",
    beskrivning: "Praktisk drift-info mellan skift (ej patientinformation)",
    ikon: "🛠️",
    lank: "/skiftrapport",
  },
  "offline-center": {
    titel: "Offline-center",
    beskrivning: "Ladda ner godkända rutiner så de går att läsa utan internet",
    ikon: "📥",
    lank: "/offline-center",
  },
  // Etapp 72f: ingen egen flytande knapp (skulle konkurrera visuellt med "🚨 Akut"-knappen,
  // se AkutKnappFloating.jsx) – i stället surfas driftstoppsläget upp via detta generiska
  // startvyblock, samma väg som alla andra block på Hem.jsx.
  driftstopp: {
    titel: "Driftstopp",
    beskrivning: "Reservrutiner för när journalsystemet eller nätet ligger nere",
    ikon: "🔌",
    lank: "/driftstopp",
  },
};

const STANDARDORDNING = [
  "sedan-forra-passet",
  "kliniskt-stod",
  "logistik",
  "administration",
  "ladda-upp",
  "skiftrapport",
  "offline-center",
  "driftstopp",
];

// Sensible standardordning per roll (se ETAPPLAN3.md Etapp 17a) – ingen konfiguration krävs
// för att komma igång. Superadmin ser administration överst (den egna vyn hen använder
// mest), VEC ser administration (kvitteringsläget bor där idag) före kliniskt stöd,
// förrådsansvarig ser logistik (förrådet) överst.
export const STARTVY_STANDARD = {
  [ROLES.SUPERADMIN]: ["administration", ...STANDARDORDNING.filter((b) => b !== "administration")],
  [ROLES.VEC]: ["administration", ...STANDARDORDNING.filter((b) => b !== "administration")],
  [ROLES.FORRADSANSVARIG]: ["logistik", ...STANDARDORDNING.filter((b) => b !== "logistik")],
  [ROLES.SEKTIONSLEDARE]: STANDARDORDNING,
  [ROLES.VOL]: STANDARDORDNING,
  [ROLES.PERSONAL]: STANDARDORDNING,
};

// Returnerar blocknycklar i rätt ordning för en roll: organisationens egen konfiguration om
// den finns, annars standardordningen, annars (okänd roll) den generella STANDARDORDNING.
// Filtrerar alltid bort nycklar som inte längre finns i STARTVY_BLOCK (om appen någon gång
// tar bort ett block ska en gammal sparad konfiguration inte krascha på ett okänt kort).
export function blockordningForRoll(roll, organisationensOrdning) {
  const kalla = organisationensOrdning?.[roll] ?? STARTVY_STANDARD[roll] ?? STANDARDORDNING;
  return kalla.filter((nyckel) => nyckel in STARTVY_BLOCK);
}
