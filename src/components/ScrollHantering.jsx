import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Etapp 69f (ETAPPLAN18.md): appen återställde inte skrollpositionen vid ruttbyte. Gick man
// långt ner i en lista i Kliniskt stöd och öppnade en rutin öppnades den mitt i texten -
// verifierat att ingen komponent i projektet gjorde detta sedan tidigare.
//
// `<BrowserRouter>` (den deklarativa routern appen använder, inte `createBrowserRouter`) har
// inget inbyggt `<ScrollRestoration>` - den komponenten kräver en data-router. Byggs därför
// för hand, och det tog två felaktiga försök att komma dit - båda värda att skriva ner så
// att ingen försöker samma sak igen:
//
//   1. Att lita på webbläsarens EGNA `history.scrollRestoration` ("auto") för bakåt-fallet.
//      Ett e2e-test som klickade bakåt och mätte `window.scrollY` fick konsekvent 0.
//   2. Att spara positionen i CLEANUP-funktionen för effekten som kör vid varje ruttbyte
//      ("spara det gamla värdet precis innan jag sätter det nya"). Det MÅTTE fel av ett
//      skäl som inte är uppenbart förrän man ser det hända: cleanup för den gamla sidan
//      körs efter att React redan bytt ut DOM-innehållet mot den NYA sidans. Är den nya
//      sidan kortare än skrollpositionen (Hem är kortare än en långt nerskrollad
//      Nyheter-lista) har webbläsaren redan KLAMPAT om scrollY till vad som får plats -
//      ofta 0 - innan cleanup hinner läsa av den. Bekräftat genom att logga hela
//      navigeringssekvensen: värdet var redan 0 när cleanup kördes, trots att sidan var
//      skrollad till 1200px precis innan klicket som startade navigeringen.
//
// Lösningen är att spara LÖPANDE, medan sidan fortfarande är fullt renderad - en
// `scroll`-lyssnare uppdaterar kartan för varje skroll, så värdet redan finns sparat INNAN
// någon navigering ens påbörjas, och därför aldrig hinner klampas om.
const SPARADE_POSITIONER = new Map();

// Tar bort webbläsarens EGNA försök att göra samma sak - annars konkurrerar de två (ett
// synligt hopp när webbläsarens gissning ersätts av vår, eller tvärtom).
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

export default function ScrollHantering() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    function sparaPosition() {
      SPARADE_POSITIONER.set(location.key, window.scrollY);
    }
    window.addEventListener("scroll", sparaPosition, { passive: true });
    return () => window.removeEventListener("scroll", sparaPosition);
  }, [location.key]);

  useEffect(() => {
    if (navigationType === "POP") {
      window.scrollTo(0, SPARADE_POSITIONER.get(location.key) ?? 0);
      return;
    }
    // Djuplänkning (`/kliniskt-stod#rutin-{id}`): Sektionssida.jsx scrollar redan till rätt
    // kort med sin egen `scrollIntoView`. Skrollar vi till toppen FÖRST blir det bara ett
    // synligt hopp innan den andra effekten hinner köra.
    if (location.hash) return;
    window.scrollTo(0, 0);
  }, [location.key, location.hash, navigationType]);

  return null;
}
