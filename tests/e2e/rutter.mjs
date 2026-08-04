// Delad routlista för e2e-sviterna (rokprov.spec.js, tillganglighet.spec.js) – extraherad i
// Etapp 45c så de två sviterna aldrig kan driva isär om en route läggs till/tas bort i
// App.jsx utan att båda uppdateras.

// Alla routes i App.jsx som kräver inloggning (SkyddadRoute/RollSkyddadRoute/SkyddatLayout).
// /logga-in och /registrera är uteslutna (publika, inte del av den inloggade upplevelsen).
export const STATISKA_ROUTES = [
  "/",
  "/kliniskt-stod",
  "/logistik",
  "/administration",
  "/ladda-upp",
  "/nyheter",
  "/hjalp",
  "/feedback",
  "/anslag",
  "/skiftrapport",
  "/profil",
  "/kontakter",
  "/introduktion",
  "/kompetensmatris",
  "/lankbibliotek",
  "/papperskorg",
  "/offline-center",
  "/leverantor",
  "/admin",
  "/godkannanden",
  "/ledningsrapport",
  "/akutlage",
  "/sedan-forra-passet",
];

// Dynamiska routes med ett konkret, giltigt exempel-id. /logistik/:forradSlug använder en av
// de sex fasta förrådsslugsen (src/firebase/forrad.js, inte per-organisation-data).
// /checklista/:rutinId använder den redan seedade e2eRutinA (godkänd, kliniskt-stöd).
export const DYNAMISKA_ROUTES = ["/logistik/sterilforradet", "/checklista/e2eRutinA"];

export const ALLA_ROUTES = [...STATISKA_ROUTES, ...DYNAMISKA_ROUTES];
