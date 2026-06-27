# Utvecklingslogg – Synappsen

Loggen uppdateras löpande efter varje avslutad fas med vilka funktioner och åtgärder som genomförts.

## Fas 1 – Grundapp, Firebase och PWA-struktur

**Datum:** 2026-06-20
**Branch:** `claude/compassionate-euler-rho0q5`

### Genomfört

- Initierat React/Vite-projekt med `react-router-dom`, `firebase` och `fuse.js`.
- `.env` med Firebase-konfiguration skapad lokalt och lagd till i `.gitignore` (committas aldrig).
- `src/firebase/config.js` – initierar Firebase App, Auth och Firestore.
- `src/firebase/roles.js` – definierar 6 roller (superadmin, vol, sektionsledare, vec, forradesansvarig, personal) och behörighetsgrupper.
- `AuthContext` (`src/context/AuthContext.jsx`) + `useAuth`-hook (`src/hooks/useAuth.js`):
  - Registrering skapar konto i Firebase Auth och ett `users/{uid}`-dokument i Firestore med standardrollen `personal`.
  - Inloggning/utloggning.
  - Rollen hämtas från Firestore vid inloggning och hålls i context.
- Sidor: `Hem`, `LoggaIn`, `Registrera`, samt platshållarsidor för `KlinisktStod`, `Logistik`, `Administration`.
- Komponenter: `SokFalt` (fuzzy-sökning via Fuse.js mot statiskt sökindex), `SektionsKort`, `BottomNav` (mobilanpassad nedre navigering), `SkyddadRoute` (kräver inloggning).
- PWA: `vite-plugin-pwa` konfigurerad i `vite.config.js` (manifest, service worker, autoUpdate). SVG-ikon använd eftersom inga bildkonverteringsverktyg fanns tillgängliga i miljön.
- `firestore.rules` – behörigheter per roll för `users`, `rutiner`, `anslag`, `forrad` och `administration`.
- `firebase.json` + `firestore.indexes.json` för driftsättning.
- Verifierat: `npm run build` och `npm run lint` gröna.
- Commit + push till `claude/compassionate-euler-rho0q5`.

---

## Fas 2 – Adminpanel, rutinhantering och bilduppladdning

**Datum:** 2026-06-20
**Branch:** `claude/compassionate-euler-rho0q5`

### Genomfört

- `src/firebase/storage.js` – `laddaUppRutinBild()` laddar upp bilder till Firebase Storage under `rutiner/{omrade}/{rutinId}/...` och returnerar en nedladdnings-URL.
- `src/hooks/useRutiner.js` – realtidshämtning (onSnapshot) av rutiner per område samt `skapaRutin`, `uppdateraRutin`, `godkannRutin`, `taBortRutin`. Nya rutiner får status `utkast` eller `godkand` direkt beroende på om området har ett separat godkännandesteg.
- `src/hooks/useAnvandare.js` – realtidslista över alla användare samt `uppdateraRoll()` för adminpanelen.
- `src/components/Sektionssida.jsx` – generisk sektionssida (lista, skapa, redigera, godkänna, ta bort) som de tre sektionssidorna (`KlinisktStod`, `Logistik`, `Administration`) nu återanvänder med olika rollkonfiguration:
  - **Kliniskt stöd**: sektionsledare/VÖL skapar utkast, VÖL/superadmin godkänner.
  - **Logistik**: förrådsansvarig publicerar direkt.
  - **Administration**: VEC publicerar direkt.
- `src/components/RutinFormular.jsx` + `RutinKort.jsx` – formulär för att skapa/redigera rutiner (titel, innehåll, bilduppladdning) och kort för visning med statusmärkning och åtgärdsknappar.
- `src/components/RollSkyddadRoute.jsx` – skyddar rutter som kräver en specifik roll (används för `/admin`).
- `src/pages/Admin.jsx` – adminpanel (endast superadmin) för att ändra roll på registrerade användare. Ny rutt `/admin` samt villkorlig länk i `BottomNav` för superadmin.
- `firestore.rules` – omskriven så att redigeringsbehörighet för `rutiner` styrs av dokumentets `omrade`-fält och roll. Utkast är endast synliga för de som får redigera området. Endast VÖL/superadmin får ändra godkännandestatus för kliniskt stöd. Tidigare ej använda collections (`anslag`, `forrad`, `administration`) togs bort ur regelfilen eftersom allt innehåll nu samlas i `rutiner`.
- `storage.rules` – nytt, styr bilduppladdning per område baserat på användarens roll i Firestore.
- `firebase.json` uppdaterad med `storage`-konfiguration, `firestore.indexes.json` utökad med kompositindex för frågan `omrade` + `skapad`.
- Verifierat: `npm run build` och `npm run lint` gröna.

---

## Fas 3 – Bildtolkning med Gemini Vision (batch-uppladdning)

**Datum:** 2026-06-20
**Branch:** `claude/compassionate-euler-rho0q5`

### Bakgrund och beslut

Efter genomgång av planeringsdokumentet identifierades att batch-uppladdning med Gemini
Vision-tolkning saknades helt. Tre arkitekturbeslut togs tillsammans med användaren:

- Rollhantering behålls som Firestore-fält (`users/{uid}.role`) istället för att migreras till
  Firebase custom claims, som planen ursprungligen nämnde.
- Gemini-anrop görs server-side via en Cloud Function (Blaze-plan), inte direkt från klienten,
  för att Gemini-nyckeln aldrig ska riskera att bakas in i den publika JS-bundlen (vilket sker med
  alla `VITE_`-prefixade miljövariabler).
- Ett hårt kostnadstak på 200 kr/månad infördes på applikationsnivå, som endast kan höjas manuellt
  av en superadmin – inte automatiskt.

### Genomfört

- `functions/index.js` (ny Cloud Function, `tolkaDokument`, region `europe-west1`):
  - `reserveraBudget()` – Firestore-transaktion mot `installningar/geminiBudget` som nollställer
    `anvantOre` vid ny månad och kastar `resource-exhausted` om taket är nått, annars reserverar en
    uppskattad kostnad per anrop innan Gemini anropas.
  - Anropar Gemini Vision (`gemini-2.0-flash`) med strukturerat JSON-schema (`titel`, `innehall`,
    `nyckelord`, `komIhagFlaggor`) och en svensk prompt anpassad för fotade dokument/whiteboards.
  - Skapar ett utkast i `rutiner` med `status: "utkast"` och `kalla: "gemini"`, som måste granskas
    och godkännas av den roll som äger området precis som manuellt skapat innehåll.
  - Gemini-nyckeln hämtas via Firebase Secret Manager (`defineSecret("GEMINI_API_KEY")`), aldrig
    från `.env`.
- `src/firebase/functions.js` – klient-wrapper som anropar `tolkaDokument` via `httpsCallable`.
- `src/firebase/storage.js` – `laddaUppInkommandeFoto()` laddar upp råfoton till
  `inkommande/{uid}/...` innan tolkning.
- `src/pages/LaddaUpp.jsx` + `.css` – ny sida (`/ladda-upp`) där alla inloggade användare kan välja
  område och ladda upp flera foton i följd (kameraintegration via `capture="environment"`), med
  statusspårning per fil (väntar/laddar upp/tolkar/klar/fel). Länkad från `Hem`.
- `src/hooks/useGeminiBudget.js` – realtidshämtning av budgetstatus samt `satTakKr()` för
  adminpanelen.
- `src/pages/Admin.jsx` + `.css` – ny sektion som visar använd/tillgänglig budget i kronor och låter
  superadmin höja taket.
- `firestore.rules` – nytt regelblock för `installningar/geminiBudget`: alla inloggade får läsa,
  endast superadmin får skriva (Cloud Function skriver via Admin SDK och kringgår reglerna).
- `storage.rules` – nytt regelblock för `inkommande/{uid}/{filnamn}`: ägaren och redaktörer/
  superadmin får läsa, endast ägaren får ladda upp.
- `firebase.json` – Cloud Functions-konfiguration tillagd (`functions`-block, runtime nodejs20).
- `eslint.config.js` – `functions/`-katalogen lagd till i `globalIgnores` eftersom den är CommonJS
  och inte ska lintas mot webbläsarmiljön.
- `README.md` – nya avsnitt om Gemini Vision-flödet (inklusive rekommendation att även sätta ett
  riktigt budgetlarm i Google Cloud Console som komplement) och fullständiga driftsättningssteg
  inklusive `firebase functions:secrets:set GEMINI_API_KEY`.
- Verifierat: `npm run build` och `npm run lint` gröna.

---

## Fas 3.1 – Strukturerade förrådsartiklar med platsangivelse (Logistik)

**Datum:** 2026-06-20
**Branch:** `claude/compassionate-euler-rho0q5`

### Genomfört

- `src/firebase/forrad.js` – definierar de sex förråden (Engångsförrådet, Sterilförrådet,
  Ortopedförrådet, Tvättförrådet, Kontorsförrådet, Läkemedelsrummet) samt slug-hjälpfunktioner för
  URL-vägar.
- Ny Firestore-collection `forradsartiklar` med fälten `namn`, `forrad`, `skap`, `hylla`, `antal`,
  `bildUrl`, `status` och `kalla`.
- `functions/index.js` – ny Cloud Function `tolkaForradsbild`: tar emot en bild och vilket förråd
  den hör till, ber Gemini Vision identifiera samtliga artiklar i bilden (antingen fysiska artiklar
  eller en skriven lista) och extrahera skåp/hylla/antal *endast* om det faktiskt är märkt i bilden.
  Varje hittad artikel skapas som ett separat utkast i `forradsartiklar`, kopplat till samma
  budgetspärr som övrig Gemini-tolkning.
- `src/hooks/useForradsartiklar.js` – realtidshämtning (filtrerad på förråd, eller alla för
  sökmotorn) samt `skapaArtikel`, `uppdateraArtikel`, `godkannArtikel`, `taBortArtikel`. Manuellt
  tillagda artiklar publiceras direkt (precis som övrigt manuellt innehåll i Logistik), medan
  Gemini-tolkade artiklar kräver godkännande av förrådsansvarig/superadmin innan de syns för andra.
- `src/pages/Logistik.jsx` – omskriven till en lista med kort för de sex förråden.
- `src/pages/ForradVy.jsx` (ny, rutt `/logistik/:forradSlug`) – visar artiklarna i ett valt förråd
  sorterade på skåp/hylla, med formulär för att manuellt lägga till/redigera artiklar
  (`ForradArtikelFormular`) och kort per artikel (`ForradArtikelKort`) med redigera/godkänn/ta bort.
- `src/pages/LaddaUpp.jsx` – vid val av område "Logistik" visas ett extra val för vilket förråd
  bilden hör till, och anropar `tolkaForradsbild` istället för `tolkaDokument`.
- `src/components/SokFalt.jsx` – sökmotorn slogs samman med en realtidsström av godkända
  förrådsartiklar från Firestore (tidigare endast ett statiskt platshållarindex), så att en sökning
  visar exakt vilket förråd, skåp och hylla en artikel finns i.
- `firestore.rules` / `storage.rules` – nya regelblock för `forradsartiklar` respektive
  `forradsartiklar/{forradSlug}/{artikelId}/{filnamn}`, baserade på samma `farRedigeraOmrade('logistik')`
  som övrigt logistikinnehåll.
- `firestore.indexes.json` – nytt kompositindex för `forrad` + `skapad`.
- Verifierat: `npm run build` och `npm run lint` gröna, `node -c functions/index.js` syntax-OK.

---

## Fas 3.2 – Robust bilduppladdning och synonymsökning (Logistik)

**Datum:** 2026-06-27
**Branch:** `claude/compassionate-euler-rho0q5`

### Genomfört

- `src/pages/LaddaUpp.jsx` – filinputarna för "Välj bilder från galleri" och "Ta foto" triggas nu
  via `ref` + `button.click()` istället för att ligga inbäddade i en `<label>`, för att undvika
  webbläsarspecifika kvirkar kring flerval på mobil. Den dolda input-stylingen i `LaddaUpp.css`
  bytte till det vedertagna "visually hidden"-mönstret (clip-rect istället för opacity/overflow).
- `functions/index.js` – `tolkaForradsbild` extraherar nu även `sokord`: en lista med synonymer/
  förkortningar/vardagsbegrepp som Gemini genererar per artikel (t.ex. att en Foley-kateter även
  taggas med "kateter", "urinkateter" och "KAD"), sparas på varje `forradsartiklar`-dokument.
- `src/hooks/useForradsartiklar.js` – manuellt skapade artiklar får ett tomt `sokord`-fält som
  standard (fältet är bara meningsfullt för AI-tolkade artiklar i nuläget).
- `src/components/SokFalt.jsx` – `sokord` vävs in i sökindexets `nyckelord`, och Fuse.js-vikterna
  justerades (titel 0.5, nyckelord 0.4, kategori 0.1, `ignoreLocation: true`) så att en sökning på
  ett synonymt eller vardagligt begrepp ("kad") hittar rätt artikel även om den AI-extraherade
  titeln använder ett annat ord ("Urinkateter").
- Verifierat: `npm run build` och `npm run lint` gröna, `node -c functions/index.js` syntax-OK.
