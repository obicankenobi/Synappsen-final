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

---

## Fas 4 – Versionering, samarbetsfunktioner och kvalitetsverktyg

**Datum:** 2026-07-03
**Branch:** `claude/compassionate-euler-rho0q5`

### Bakgrund

Efter en genomgång av samtliga tidigare faser identifierades ett antal förslag inom fyra
teman (sök/tillgänglighet, innehåll/kvalitet, samarbete/drift, samt uttryckligt önskade
sociala funktioner). Användaren bad om att samtliga förslag implementerades i en release,
tillsammans med versionsnumrering, en användarvänd ändringslogg, en feedbackfunktion synlig
endast för superadmin, samt en hjälp-/FAQ-sida.

### Genomfört

- `src/version.js` – `APP_VERSION`, höjs manuellt vid varje release (semver).
- `src/data/andringslogg.js` + `src/pages/Nyheter.jsx` (`/nyheter`) – användarvänd
  ändringslogg, nyast överst. Ska uppdateras med en ny post vid varje release, tillsammans
  med denna fil.
- `src/pages/Hjalp.jsx` (`/hjalp`) – statisk hjälptext om appens funktioner/roller samt en
  FAQ-sektion (`<details>`). Uppdateras löpande när nya funktioner tillkommer.
- `src/hooks/useFeedback.js` + `src/pages/Feedback.jsx` (`/feedback`) – alla inloggade kan
  skicka in förslag/buggrapporter, ny Firestore-collection `feedback`. Endast superadmin kan
  läsa listan (Firestore-regler), visas i en ny sektion i adminpanelen.
- `src/hooks/useAnslag.js` + `src/pages/Anslagstavla.jsx` (`/anslag`) + `AnslagFormular.jsx`/
  `AnslagKort.jsx` – ny anslagstavla, ny collection `anslag`. VEC/superadmin (samma roller som
  `KAN_HANTERA_ANSLAG`, tidigare odefinierad i UI) kan skapa/redigera/ta bort, med möjlighet
  att fästa ett anslag högst upp och sätta utgångsdatum. Länkad från Hem och `BottomNav`.
- `src/hooks/useKommentarer.js` + `src/components/Kommentarer.jsx` – kommentarer/frågor
  kopplade till en rutin (ny collection `kommentarer`, fält `rutinId`), inbäddat och
  hopfällbart i `RutinKort`. Ägare eller valfri redaktörsroll får ta bort en kommentar.
- `src/hooks/useLaskvittering.js` – `lasteAv`-array (uid/namn/tidpunkt) på `rutiner`-dokument.
  Knappen "Jag har läst och förstått" i `RutinKort`; redaktörer ser antal som kvitterat.
  Firestore-regler tillåter alla inloggade att skriva enbart detta fält utan att i övrigt ha
  redigeringsbehörighet för området.
- `src/hooks/useFavoriter.js` + `src/components/FavoritKnapp.jsx` – favoriter sparas som en
  array av `"typ:id"`-strängar på `users/{uid}.favoriter`. Stjärnknapp i `RutinKort` och
  `ForradArtikelKort`. Firestore-regler tillåter ägaren att uppdatera enbart `favoriter`-fältet
  på sitt eget användardokument (annars styrs `users`-uppdateringar av superadmin).
- `src/hooks/useVisningar.js` – ny collection `visningar`, räknar upp `antal` (via
  `increment()`) när ett sökresultat i `SokFalt` klickas. `usePopularaste()` visar de mest
  klickade posterna på Hem ("Mest använda"). Fristående collection istället för ett fält på
  rutinen/artikeln, så att alla inloggade kan räkna upp utan skrivbehörighet på själva
  innehållet.
- `src/hooks/useSokloggar.js` – loggar sökningar (≥3 tecken, 800 ms debounce) som ger noll
  träffar i `SokFalt`, ny collection `sokloggar`. Endast superadmin kan läsa listan, ny
  sektion i adminpanelen ("Sökningar utan träffar") visar vilket innehåll som efterfrågas
  men saknas.
- `src/firebase/config.js` – Firestore initieras nu med `persistentLocalCache` +
  `persistentMultipleTabManager` istället för `getFirestore()`, så tidigare hämtat innehåll
  går att läsa offline/vid dåligt nät, delat mellan flikar.
- `src/hooks/useRutiner.js` – `rutiner`-dokument får ett `granskadDatum`-fält (sätts vid
  skapande). `RutinKort` flaggar rutinen med en röd "Bör granskas"-badge för redaktörer när
  det gått mer än 180 dagar sedan senaste granskning (konstant
  `GRANSKNINGSINTERVALL_DAGAR`); `markeraGranskad()` nollställer datumet.
- `src/hooks/useRutiner.js` – `uppdateraRutin()` sparar nu automatiskt en ögonblicksbild av
  rutinen i subcollectionen `rutiner/{id}/versioner` innan ändringen skrivs, med
  `hamtaVersioner()` för att läsa historiken. `src/components/VersionsHistorik.jsx` visar
  historiken i en modal ("Visa historik"-knapp, endast redaktörer).
- `src/hooks/useAuditlogg.js` – ny collection `auditlogg`; `loggaHandelse()` anropas från
  `useRutiner.js` och `useAnslag.js` vid skapa/uppdatera/godkänna/ta bort/granska. Ny sektion
  i adminpanelen visar de 100 senaste händelserna. Endast superadmin kan läsa listan.
- `marked` + `dompurify` (nya npm-beroenden) – `src/components/MarkdownInnehall.jsx`
  renderar rutin-/anslagsinnehåll som sanerad HTML från enkel Markdown (rubriker, fetstil,
  kursiv, punktlistor, länkar). `RutinFormular` fick en hjälptext om stödd syntax; själva
  redigeringsfältet är fortfarande vanlig text.
- `firestore.rules` – nya regelblock för `anslag`, `kommentarer`, `feedback`, `sokloggar`,
  `auditlogg`, `visningar` och `rutiner/{id}/versioner`. `users`-regeln och `rutiner`-regeln
  utökade med fältbegränsade undantag (`bararForandrarFalt()`) för `favoriter` respektive
  `lasteAv`, så vanlig personal kan skriva just de fälten utan bredare behörighet.
- `firestore.indexes.json` – nytt kompositindex för `kommentarer` (`rutinId` + `skapad`).
- `src/pages/Hem.jsx` – nya snabblänkar (Anslagstavla/Nyheter/Feedback/Hjälp), sektionerna
  "Mina favoriter" och "Mest använda" ovanför sektionskorten.
- `src/components/BottomNav.jsx` – ny länk till Anslagstavlan.
- Verifierat: `npm run build` och `npm run lint` gröna.

### Kända begränsningar / medvetna avgränsningar

- Riktiga push-notiser (Firebase Cloud Messaging) implementerades inte i denna fas – det
  kräver manuell generering av ett VAPID-nyckelpar i Firebase Console som inte kan
  automatiseras härifrån, och går inte att verifiera utan en riktig mottagarenhet. "Mest
  använda"/anslagstavlan täcker en del av samma behov (upptäckbarhet av nytt innehåll) utan
  extern konfiguration. Kan läggas till senare om det önskas.
- Sökfältet indexerar fortfarande inte de riktiga `rutiner`-dokumenten från Kliniskt stöd/
  Administration (endast ett statiskt platshållarindex + Firestore-backade
  förrådsartiklar, sedan tidigare faser) – "Mest använda" och "Mina favoriter" fungerar även
  för rutiner, men fritextsökning gör det ännu inte. Separat, större uppgift.
  **Åtgärdat i Fas 5, se nedan.**

---

## Fas 5 – Sökning i rutiner, skiftrapport och driftkvalitet

**Datum:** 2026-07-07
**Branch:** `claude/compassionate-euler-rho0q5`

### Bakgrund

Uppföljning på Fas 4: användaren bad om ytterligare en runda förslag (utom riktiga
push-notiser, som medvetet avgränsades bort i Fas 4). En ny funktion – skiftrapport – fick ett
uttryckligt krav: den får aldrig användas för patientinformation (sekretess/GDPR), utan är
enbart till för praktisk drift-info mellan skift.

### Genomfört

- `src/components/SokFalt.jsx` – vävde in riktiga godkända `rutiner` (Kliniskt stöd +
  Administration) i sökindexet, utöver förrådsartiklar och den statiska platshållarlistan.
  Sökträffar för rutiner länkar till `{sektionssida}#rutin-{id}`.
- `src/components/RutinKort.jsx` + `src/components/Sektionssida.jsx` – varje rutinkort får ett
  `id="rutin-{id}"`; `Sektionssida` scrollar automatiskt till rätt kort när sidan laddas med
  ett hash i URL:en (djuplänkning från sökresultat).
- `src/components/Sektionssida.jsx` – "Godkänn alla"/"Neka alla" för utkast-rutiner, samma
  mönster som redan fanns i `ForradVy` för förrådsartiklar.
- `src/hooks/useAnslag.js` + `AnslagFormular.jsx`/`AnslagKort.jsx` – nytt `prioritet`-fält
  (`info`/`viktigt`) på anslag. Viktiga anslag får en tydlig röd ram och varningsikon, och
  sorteras efter fastnaglade men före övriga.
- `src/pages/Admin.jsx` – ny statistiksektion: mest aktiva användare (räknat på de senaste 100
  händelserna i ändringsloggen) och mest kvitterade rutiner (flest "jag har läst"-kvitteringar).
- `src/hooks/useSkiftrapport.js` + `src/pages/Skiftrapport.jsx` (`/skiftrapport`) – ny
  collection `skiftrapporter` för korta driftmeddelanden mellan skift (t.ex. "vattenläcka i
  taket", "slut på sutur-set"). Tydlig varningstext i gränssnittet om att patientinformation
  aldrig får skrivas här. Alla inloggade kan skapa och markera som åtgärdat; ägaren eller en
  redaktörsroll kan ta bort. Poster äldre än 48 timmar döljs automatiskt ur huvudlistan (kan
  visas via "Visa åtgärdade").
- `src/hooks/useInaktivitetsUtloggning.js` + `src/components/InaktivitetsVarning.jsx` – loggar
  automatiskt ut efter 20 minuters inaktivitet (mus/tangentbord/touch/scroll), med en
  varningsdialog 1 minut innan. Kopplas in globalt i `App.jsx` oavsett vilken skyddad sida
  användaren är på – relevant på delade datorer/surfplattor.
- `src/components/RutinKort.jsx` – "Skriv ut / PDF"-knapp som isolerar en enskild rutin via en
  `@media print`-regel (döljer navigering, formulär och övriga kort) och anropar
  `window.print()`; användaren väljer "Spara som PDF" i webbläsarens utskriftsdialog.
- `src/firebase/storage.js` – `laddaUppRutinBilagor()` laddar upp flera filer (bilder eller
  PDF) och returnerar `{url, namn, typ}` per fil. `RutinFormular.jsx` stödjer nu multi-upload
  med möjlighet att ta bort enskilda bilagor innan sparning. Rutiner har fått ett `bilagor`-
  fält (array) som ersätter det gamla ensamma `bildUrl`-fältet för nytt innehåll; `RutinKort`
  hanterar båda formaten (bakåtkompatibelt).
- `src/hooks/useMinaFavoritPoster.js` – favoritupplösningen (matcha `users.favoriter` mot
  riktiga rutiner/artiklar) bröts ut från `Hem.jsx` till en delad hook.
- `src/pages/Profil.jsx` (`/profil`) – ny profilsida: byt lösenord (med återautentisering via
  `reauthenticateWithCredential`), se roll/e-post, och en lista över egna favoriter.
- `src/firebase/roles.js` – `arRedaktor()`-hjälpfunktion (motsvarar samma logik som redan
  fanns i `firestore.rules`) för klientsidig behörighetskontroll, t.ex. i Skiftrapport.
- `firestore.rules` – nytt regelblock för `skiftrapporter` (fältbegränsat: alla inloggade får
  ändra `atgardad`/`atgardadAv`, men inget annat).
- `src/version.js` → 4.1.0, ny post i `src/data/andringslogg.js`.
- Verifierat: `npm run build` och `npm run lint` gröna (en `react-hooks/set-state-in-effect`-
  varning i `useInaktivitetsUtloggning` åtgärdades genom att bryta ut timer-uppstarten från
  den initiala `setState`-anropet).

### Kända begränsningar / medvetna avgränsningar

- Riktiga push-notiser (FCM) är fortsatt medvetet bortvalda, se Fas 4.
- Statistiken i adminpanelen ("mest aktiva användare") baseras på de senaste 100 händelserna i
  ändringsloggen, inte hela historiken – tillräckligt för en översikt men inte en exakt
  totalräkning över tid.
