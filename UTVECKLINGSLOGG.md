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

## Fas 6 – Kontaktlista, länkbibliotek, samarbetsfunktioner på rutiner, papperskorg, 2FA och visuell helrenovering

**Datum:** 2026-07-07
**Branch:** `claude/compassionate-euler-rho0q5`

### Bakgrund

Uppföljning på Fas 5: användaren valde tekniska förbättringsförslag samt en stor mängd
funktionsförslag från en tidigare presenterad lista (kontaktlista, länkbibliotek, signatur på
rutiner, relaterade rutiner, referensfält, notisflöde, privata anteckningar, papperskorg och
2FA), följt av en uttrycklig instruktion att göra en fullständig visuell översyn av hela appen
och därefter en säkerhets-/buggenomgång av all kod. Kontaktlistan fick ett uttryckligt krav:
numren ska visas som text utan någon ring-funktion.

### Genomfört

**Tekniskt underhåll**
- `functions/package.json` – Node 20 → 22, `firebase-functions` ^6 → ^7.2.5,
  `firebase-admin` ^12 → ^13.10.0 (senaste versionen som är kompatibel med
  `firebase-functions` 7.x:s peer-dependency-krav).
- `src/App.jsx` – alla sidor laddas nu via `React.lazy()` bakom en gemensam `<Suspense>`, för
  mindre initial JS-bundle (kodsplitting fanns delvis sedan Fas 5, nu konsekvent för samtliga
  rutter inklusive de nya sidorna nedan).

**Kontaktlista och länkbibliotek**
- `src/hooks/useKontakter.js` + `src/components/KontaktFormular.jsx` + `src/pages/Kontakter.jsx`
  (`/kontakter`) – ny collection `kontakter` (namn, nummer, kategori, beskrivning), grupperad
  lista med sökfilter. Numret renderas som vanlig text (`<span>`), aldrig som `tel:`-länk.
- `src/hooks/useLankbibliotek.js` + `src/components/LankFormular.jsx` +
  `src/pages/Lankbibliotek.jsx` (`/lankbibliotek`) – samma mönster för en länksamling (titel,
  url, kategori, beskrivning), grupperad per kategori.
- Redigering av båda kräver samma behörighet som anslagstavlan (`KAN_HANTERA_ANSLAG`).

**Samarbetsfunktioner på rutiner**
- `src/hooks/useRutiner.js` – `godkannRutin`/`markeraGranskad` sparar nu även vem som
  godkände/granskade (`godkandAvNamn`/`granskadAvNamn`) utöver tidpunkt.
- `src/components/RutinFormular.jsx` – nytt fritextfält för referenser/källor samt kryssrutor
  för att länka rutinen till andra rutiner inom samma område ("relaterade rutiner").
- `src/components/RutinKort.jsx` – visar signatur (godkänd/granskad av + datum), referenser och
  en "Se även"-lista med länkar till relaterade rutiner (`#rutin-{id}`-ankare).

**Notisflöde**
- `src/hooks/useNotiser.js` + `src/components/Notisklocka.jsx` – klockikon i `Hem.jsx` som visar
  antal nya anslag/rutiner sedan användarens senaste besök (`users/{uid}.senasteNotisBesok`),
  med en nedfällbar panel. Rent in-app, ingen push/FCM.

**Privata anteckningar**
- `src/hooks/usePrivatAnteckning.js` + `src/components/PrivatAnteckning.jsx` – en anteckning per
  användare och rutin (dokument-id `{uid}_{rutinId}` i collectionen `anteckningar`), inbäddad i
  `RutinKort`. Anteckningen laddas in i utkastfältet först när panelen öppnas (event-handler),
  inte via en effekt, för att undvika `react-hooks/set-state-in-effect`/`react-hooks/refs`.

**Papperskorg / mjuk borttagning**
- `src/hooks/useRutiner.js`, `useForradsartiklar.js`, `useAnslag.js` – `taBort*`-funktionerna
  sätter nu `{borttagen: true, borttagenAv, borttagenDatum}` istället för att radera dokumentet;
  läslyssnarna filtrerar bort dessa poster som vanligt.
- `src/hooks/usePapperskorg.js` + `src/pages/Papperskorg.jsx` (`/papperskorg`) – samlar
  mjukraderade rutiner/artiklar/anslag och erbjuder återställning eller permanent radering.
  Knapparna fångar nu permission-denied-fel från Firestore och visar ett tydligt felmeddelande
  istället för att misslyckas tyst, eftersom den faktiska behörighetskontrollen (per område)
  sker i `firestore.rules`, inte i denna sidas synlighetsfilter.

**Tvåfaktorsautentisering (TOTP)**
- `src/firebase/mfa.js` – tunt lager ovanpå Firebase Auths inbyggda TOTP-MFA
  (`multiFactor()`, `TotpMultiFactorGenerator`, `getMultiFactorResolver`). QR-koden genereras
  klientsidan med npm-paketet `qrcode` (ingen extern nätverkstjänst).
- `src/components/TvaFaktorSektion.jsx` (i `Profil.jsx`) – aktivera/inaktivera 2FA, med
  återautentisering (lösenord) innan registrering.
- `src/pages/LoggaIn.jsx` – hanterar `auth/multi-factor-auth-required` och visar ett andra steg
  för engångskod.
- **Manuellt steg krävs:** MFA måste aktiveras för projektet i Firebase Console (Authentication
  → Sign-in method → Multi-factor authentication) innan funktionen fungerar i produktion.

**Visuell helrenovering**
- `src/index.css` – utökad uppsättning CSS-variabler (`--primar-mork/ljus`, `--kant-stark`,
  `--farlig-mork/ljus`, `--amber*`, `--radius`/`--radius-liten`, `--skugga`/`--skugga-hover`)
  som gemensam designtoken-bas.
- Samtliga sid-/komponent-CSS-filer konverterade från hårdkodade hex-färger till dessa
  variabler, och kort-liknande element (rutin-kort, anslag-kort, kontakt-/länk-rader,
  papperskorgsrader m.fl.) fick en enhetlig `box-shadow: var(--skugga)`.
- `.knapp`-familjen, `.sektionskort` och `.bottom-nav` fick hover/aktiv-tillstånd och
  övergångar (`transition`) för tydligare interaktiv feedback.
- `Hem.jsx`s snabblänkar gjordes om till pill-formade chips; bottennavigeringen fick en tydlig
  bakgrundsplatta för aktiv flik.

**Säkerhets- och buggenomgång**
- `functions/index.js` – **IDOR-fix:** `tolkaDokument`/`tolkaForradsbild` litade tidigare på
  klientens `storagePath` utan att kontrollera ägarskap. Admin SDK kringgår Storage-reglerna,
  så vem som helst med ett giltigt konto kunde teoretiskt peka på en annan användares
  `inkommande/`-foto (eller någon annan fil i bucketen) och få innehållet tolkat/sparat.
  Båda funktionerna kräver nu att `storagePath` matchar exakt `inkommande/{eget uid}/...`.
  `tolkaDokument` validerar även `omrade` mot en fast lista, som redan gjordes för `forrad`
  i `tolkaForradsbild`.
- `firestore.rules` – nya regelblock för `kontakter` och `lankbibliotek` (läs: alla inloggade,
  skriv: samma behörighet som anslagstavlan), samt `anteckningar` (endast ägaren, matchat mot
  `resource.data.uid`/`request.resource.data.uid` – aldrig läsbart av någon annan, inte ens
  redaktörer/superadmin). `users/{userId}` tillåter nu självuppdatering av
  `senasteNotisBesok` utöver `favoriter` (krävs av notisklockan).
- `src/pages/Papperskorg.jsx` – återställ/radera permanent fångar nu behörighetsfel istället för
  att misslyckas tyst (se ovan).
- Genomgång av `dangerouslySetInnerHTML`-användning (endast `MarkdownInnehall.jsx`, redan
  saniterad med DOMPurify), samt sökning efter `eval`/`new Function`/direkt `innerHTML`-
  tilldelning i projektets egen kod – inga träffar utanför `node_modules`.
- Kvarstående, ej åtgärdad observation: Gemini-budgetspärren (`installningar/geminiBudget`) är
  global per månad, inte per användare – en enskild inloggad användare kan i teorin förbruka
  hela månadens budget genom upprepade anrop. Inte åtgärdat i denna release då det kräver ett
  designbeslut (t.ex. per-användarkvot) utöver en "uppenbar bugg"-fix.
- `src/version.js` → 5.0.0, `package.json` → 5.0.0, ny post i `src/data/andringslogg.js`.

### Kända begränsningar / medvetna avgränsningar

- Se Fas 4/Fas 5 för tidigare avgränsningar (push-notiser, statistikens 100-händelsers-fönster).
- Gemini-budgetspärren är global, inte per användare (se ovan) – åtgärdat i Fas 7.

## Fas 7 – Mörkt läge, sök- och rutinförbättringar, områdesscopad adminstatistik och kvarvarande säkerhetspunkt

**Datum:** 2026-07-13
**Branch:** `claude/compassionate-euler-rho0q5`

### Bakgrund

Ytterligare en runda på samma mönster som tidigare faser: en lista med förslag presenterades,
användaren valde ut elva av dem och bad dessutom om en förklaring av vad som krävs för riktiga
push-notiser (besvarades i chatten, ingen kod). En av punkterna var direkt kopplad till en
observation från säkerhetsgenomgången i Fas 6 (global istället för per-användare Gemini-budget).

### Genomfört

- `index.html` + `src/hooks/useTema.js` + `src/components/TemaVaxlare.jsx` (i `Profil.jsx`) –
  mörkt läge. `index.html` sätter `data-tema` synkront innan React laddar (ingen vit blink).
  `src/index.css` fick ett `:root[data-tema="dark"]`-block och ett `@media (prefers-color-scheme:
  dark)`-block med samma värden (för de som inte gjort ett explicit val), så temat följer
  systemet som standard men går att överstyra och sparas i `localStorage`.
- `src/components/SokFalt.jsx` – kontakter och länkbibliotek vävdes in i sökindexet
  (`useKontakter`/`useLankbibliotek`). Sökträffar fetmarkerar nu den del av titeln som exakt
  matchar söktermen (`<mark>`, fuzzy-träffar utan exakt substräng visas omarkerade). Lade även
  till tangentbordsnavigering: `Escape` i fältet rensar sökningen, `ArrowDown` flyttar fokus till
  första träffen, pilarna flyttar mellan träffar, `Escape` i en träff återgår till fältet.
- `src/data/rutinmallar.js` (ny) + `src/components/RutinFormular.jsx` – tre fördefinierade
  mallar (Behandlingsrutin, Checklista, Larmrutin) valbara när en ny rutin skapas; fyller
  innehållsfältet (med bekräftelse om det redan innehåller text). Samma formulär fick även ett
  `taggar`-fält (kommaseparerad text → array).
- `src/components/Sektionssida.jsx` + `RutinKort.jsx` – taggar sparas på rutinen och visas som
  chips på kortet; en klickbar taggfilter-rad ovanför listan filtrerar synliga rutiner per tagg.
- `src/hooks/useKommentarer.js` + `src/components/Kommentarer.jsx` – kommentarer fick ett
  `svarPa`-fält (kommentar-id). `Kommentarer.jsx` bygger nu ett träd (en nivå rekursiv
  komponent `KommentarRad`) med en "Svara"-länk per kommentar/svar.
- `src/firebase/roles.js` – `REDAKTORSROLLER` exporterades (var tidigare privat) för
  återanvändning i routingen.
- `src/App.jsx` + `src/components/BottomNav.jsx` – `/admin` är inte längre superadmin-only i
  routingen; alla redaktörsroller (VÖL, sektionsledare, VEC, förrådsansvarig, superadmin) kommer
  nu in på sidan, men ser bara en begränsad, områdesscopad vy (se nedan).
- `src/pages/Admin.jsx` – delades upp i gated sektioner: budget, användarhantering, global
  statistik, feedback och ändringslogg är fortsatt `arSuperadmin`-only (matchar att
  `feedback`/`sokloggar`/`auditlogg` fortfarande bara är läsbara av superadmin enligt
  `firestore.rules` – hooken för respektive lista anropas nu med `laddaLista=false` för
  icke-superadmin så inget permission-denied-anrop görs). Ny sektion "Statistik för mitt
  område": VÖL/sektionsledare/VEC ser utkastantal + mest kvitterade rutiner för sitt område,
  förrådsansvarig ser utkastantal + senast tillagda artiklar. Ingen ny Firestore-regel krävdes,
  eftersom underlaget (rutiner/förrådsartiklar) redan var läsbart för dessa roller.
- `src/pages/Admin.jsx` – sökningar-utan-träffar-sektionen fick en enkel trendvy (antal per dag,
  senaste 50 loggade sökningar) som CSS-staplar, utan extra beroenden.
- `functions/index.js` – **säkerhetsfix från Fas 6:s kvarstående observation.** Gemini-budgeten
  hade bara ett globalt månadstak; en enskild användare kunde i teorin förbruka hela det på egen
  hand. `reserveraBudget()` tar nu emot `uid` och håller även räkning per användare
  (`installningar/geminiBudget.anvantPerUid`), med ett eget tak på 50 kr/användare/månad utöver
  det globala taket. Ingen regeländring behövdes (dokumentet skrivs bara via Admin SDK).
- Kontrastgranskning av `src/index.css`: `--text-svag` (#64748b → #475569) och `--success`
  (#16a34a → #15803d) hade för låg kontrast mot `--bg` för normal text (under WCAG AA:s 4.5:1).
  Bytte till mörkare nyanser i det ljusa temat; det mörka temats motsvarigheter hade redan
  tillräcklig kontrast och lämnades oförändrade.
- `src/components/Notisklocka.jsx` – `Escape` stänger panelen och återför fokus till
  klockknappen; lade till `aria-haspopup`/`aria-expanded` samt `role="menu"`/`role="menuitem"`.
  Passade även på att fixa en dubblerad `box-shadow`-deklaration i `Notisklocka.css` som av
  misstag hade ett hårdkodat `rgba(...)`-värde istället för temavariabeln `--skugga-hover`
  (hade fungerat i ljust läge men inte anpassat sig i mörkt läge).
- Besvarade (i chatten, ingen kodändring) vad som krävs för riktiga push-notiser: Firebase
  Cloud Messaging-integration (service worker, token-registrering, ett Cloud Function-triggat
  utskick, samt hanteringen av användarens medgivande för webbnotiser) – medvetet fortsatt
  avgränsat, se Fas 4.
- `src/version.js` → 5.1.0, `package.json` → 5.1.0, ny post i `src/data/andringslogg.js`.
- Verifierat: `npm run build` och `npm run lint` gröna (en `react-hooks/exhaustive-deps`-varning
  i `Admin.jsx` åtgärdades genom att bryta ut `rutinerIMittOmrade` i en egen `useMemo`).

### Kända begränsningar / medvetna avgränsningar

- Se Fas 4/Fas 5 för push-notiser och statistikens 100-händelsers-fönster.
- Riktiga push-notiser (FCM) fortsatt inte implementerat, se ovan.
- Rutin-mallarna är statiska (hårdkodade i `src/data/rutinmallar.js`), inte redigerbara via UI.

## Fas 8 – Läskvitteringspåminnelse, QR-koder, "Mina uppgifter", versionsdiff, sökgenväg och AI-utläst utgångsdatum

**Datum:** 2026-07-13
**Branch:** `claude/compassionate-euler-rho0q5`

### Bakgrund

Direkt uppföljning på Fas 7: användaren valde fem av sex nya förslag rakt av (höll medvetet
tillbaka på riktiga push-notiser, som förklarades men inte implementerades) och gav en specifik
instruktion för det sjätte: att ett giltighetsdatum som syns på ett fotograferat dokument ska
extraheras av Gemini och sättas automatiskt som rutinens utgångsdatum.

### Genomfört

- `src/utils/rutinHjalp.js` (ny) – `borGranskas`/`arUtgangen` bröts ut hit från `RutinKort.jsx`
  eftersom `react-refresh/only-export-components` inte tillåter att en komponentfil exporterar
  fristående funktioner. Används nu av `RutinKort.jsx`, `Sektionssida.jsx` och `MinaUppgifter.jsx`.
- `src/components/RutinKort.jsx` + `src/components/Sektionssida.jsx` – redaktörer ser nu, utöver
  antalet som kvitterat läsning, en utfällbar lista "X har inte kvitterat" med namn/e-post på de
  som saknas (jämför `lasteAv` mot hela användarlistan från `useAnvandare`, som numera skickas
  ner till `RutinKort` men bara när `farRedigera` är sant).
- `src/components/RutinKort.jsx` – ny "🔳 QR-kod"-knapp som genererar en QR-kod (samma `qrcode`-
  paket som redan används för 2FA) länkande till `{origin}{sektionens sökväg}#rutin-{id}`,
  tänkt att skrivas ut och sättas upp fysiskt.
- `src/components/MinaUppgifter.jsx` (ny, i `Hem.jsx`) – aggregerar per roll: utkast som väntar
  på godkännande (kliniskt stöd/administration/förråd), rutiner flaggade för granskning, och
  antal olästa notiser. Visas bara om det finns något att visa.
- `src/components/VersionsHistorik.jsx` – lade till en radbaserad diff (egen LCS-implementation,
  inget externt beroende) som jämför en historisk version mot rutinens nuvarande innehåll,
  bakom en "Visa ändringar sedan denna version"-knapp per version.
- `src/pages/Hem.jsx` – global tangentbordsgenväg: `/` flyttar fokus till sökfältet (utom när
  man redan skriver i ett annat fält), avgränsat till startsidan eftersom sökfältet bara finns
  där.
- **Auto-utgångsdatum:** `functions/index.js` – `extraktionsSchema` fick ett nytt fält
  `giltigtTill` (ÅÅÅÅ-MM-DD eller tom sträng), prompten uppdaterades att leta efter ett
  giltighets-/utgångsdatum i dokumentet. `tolkaDokument` validerar formatet med ett regex innan
  det sparas som `utgangsdatum` på den nya rutinen (ogiltigt/saknat värde → `null`, inget krav
  att ett sådant datum finns).
- `src/components/RutinFormular.jsx` – manuellt `utgangsdatum`-fält (`<input type="date">`) så
  att redaktörer kan sätta/ändra det även utan foto-tolkning.
- `src/components/Sektionssida.jsx` – rutiner med passerat `utgangsdatum` filtreras bort ur den
  vy vanlig personal ser (samma mönster som `useAnslag`s `utgangsdatum`-hantering), men förblir
  synliga och redigerbara för redaktörer, med en "Utgången"-badge på kortet (`RutinKort.jsx`).
- Ingen ändring i `firestore.rules` krävdes för något av detta – alla nya fält omfattas redan av
  befintliga fältbegränsningar/redaktörsbehörigheter, och QR-kodsgenerering sker helt klientsidan.
- `src/version.js` → 5.2.0, `package.json` → 5.2.0, ny post i `src/data/andringslogg.js`.
- Verifierat: `npm run build` och `npm run lint` gröna (två `react-refresh/only-export-
  components`-fel åtgärdades genom utbrytningen till `rutinHjalp.js` ovan).

### Kända begränsningar / medvetna avgränsningar

- Se Fas 4/5/7 för push-notiser, statistikfönster och statiska mallar.
- Versionsdiffen är radbaserad, inte ord-/teckenbaserad – en ändring mitt i en lång rad visas
  som att hela raden bytts ut, inte som en inline-markering av den ändrade delen.
- Utgångsdatum-extraktionen litar på Gemini's tolkning av dokumentets datumformat; ett otydligt
  eller tvetydigt datum kan bli fel eller utebli (då sätts inget datum, snarare än ett gissat).

## Fas 9 – PII-filter (GDPR/patientdatalagen) och källbegränsad klinikstöd-sökning

**Datum:** 2026-07-14
**Branch:** `claude/compassionate-euler-rho0q5`

### Bakgrund

Två uttryckliga, juridiskt motiverade krav från användaren: (1) ett filter som förhindrar att
patientuppgifter (personnummer, namn) av misstag sparas i appen, med hänvisning till GDPR och
patientdatalagen; (2) en möjlighet att ställa generella kliniska frågor där Gemini tvingas söka
upp aktuell information live och bara använder fem namngivna, officiella källor med
källhänvisning.

Innan implementation ställdes två klargörande frågor till användaren (via `AskUserQuestion`)
eftersom båda kraven har tekniska begränsningar som är viktiga att vara tydlig med givet den
juridiska vikten:

1. **Personnummer** går att upptäcka tillförlitligt (giltigt datum + Luhn-checksumma, samma
   algoritm som används för att validera svenska personnummer på riktigt). **Namn går INTE att
   upptäcka tillförlitligt** med mönstermatchning – det finns ingen regel som skiljer ett
   patientnamn från t.ex. ett personalnamn i en signatur eller ett läkemedelsnamn. Användaren
   valde: hård spärr på personnummer + en icke-blockerande påminnelse (confirm-dialog) vid
   misstänkta namn, med tydlig disclaimer om att det senare inte är en garanti.
2. En **hård domänbegränsning** (Gemini kan bara *se* sökresultat från fem godkända domäner)
   kräver en egen Google Programmable Search Engine och ett nytt Google Cloud-API – manuella
   steg utanför vad som kan automatiseras här. Användaren valde istället: tvinga fram en riktig
   websökning varje gång (Gemini Search-grounding) + **efterhandsvalidering** av alla citerade
   käll-URL:er mot en godkänd-lista – om något inte kan verifieras blockeras hela svaret.

### Genomfört

**PII-filter**
- `src/utils/piiFilter.js` (ny) – `hittaPersonnummer(text)`: hittar text-sekvenser som ser ut
  som svenska personnummer/samordningsnummer (regex `\d{6}[-+]?\d{4}` + giltigt datum, dag -60
  för samordningsnummer + Luhn-checksumma). `hittaMisstankaNamn(text)`: grov heuristik (två
  efterföljande versalinledda ord), medvetet enkel och med förväntade falska larm.
  `kontrolleraPatientuppgifter(text)`: kombinerar båda – blockerar hårt vid personnummer,
  frågar via `window.confirm` vid misstänkta namn.
- Kopplades in i alla formulär med fritext som skulle kunna innehålla patientuppgifter:
  `RutinFormular.jsx` (titel+innehåll+referenser), `Kommentarer.jsx`, `PrivatAnteckning.jsx`,
  `Skiftrapport.jsx` (kompletterar den redan befintliga varningstexten med en faktisk spärr) och
  `Feedback.jsx`.
- `functions/index.js` – samma personnummer-algoritm (`innehallerPersonnummer`) duplicerad
  server-side (Cloud Functions är ett separat CommonJS-paket, delar inte moduler med
  `src/`). Både `tolkaDokument` och `tolkaForradsbild` kastar nu ett fel och avbryter helt
  (ingen skrivning till Firestore) om det AI-tolkade innehållet innehåller ett personnummer –
  detta skyddar även mot att direkta API-anrop (förbi klientens formulär) kringgår filtret.

**Klinikstöd-sökning**
- `functions/index.js` – ny callable `fragaKlinisktStod`. Blockerar personnummer i själva
  frågan INNAN något skickas till Gemini (ett tredjepartsapi) – patientuppgifter ska aldrig
  lämna appen överhuvudtaget, inte bara aldrig sparas. Anropar `gemini-1.5-flash` med
  `googleSearchRetrieval`-verktyget (`DynamicRetrievalMode.MODE_DYNAMIC`) aktiverat, vilket
  tvingar en riktig websökning för varje fråga istället för att modellen svarar ur minnet.
  Prompten instruerar modellen att bara använda internetmedicin.se, 1177.se,
  nationelltklinisktkunskapsstod.se, fass.se och lakemedelsverket.se, att alltid källhänvisa,
  att avstå hellre än att gissa, och att aldrig besvara frågor om en namngiven/identifierbar
  patient.
- Efter svaret: `groundingMetadata.groundingChuncks` (de faktiska käll-URL:erna Gemini använde)
  valideras mot en hårdkodad godkänd-lista (`domanGodkand`). Om Gemini inte returnerar några
  källor alls, eller om NÅGON källa ligger utanför listan, blockeras hela svaret med ett
  `HttpsError` istället för att visas – även om texten i sig hade varit korrekt. Detta är den
  faktiska tekniska spärren; prompt-instruktionen ovan är bara första försvarslinjen.
- `src/firebase/functions.js` – `fragaKlinisktStod(fraga)`-wrapper.
- `src/components/KlinikfragaSok.jsx` (ny) – sökruta med tydlig disclaimer ("beslutsstöd,
  ersätter aldrig klinisk bedömning", "ställ aldrig frågor om en specifik patient"), kör
  `kontrolleraPatientuppgifter` på frågan klientsidan innan anrop (samma filter som ovan),
  visar svar + klickbara källänkar. Inbäddad i `Sektionssida.jsx` via en ny `extra`-prop,
  använd från `KlinisktStod.jsx` (visas bara i Kliniskt stöd, inte Administration/Logistik).
- Inget sparas i Firestore av frågor/svar – helt ephemert i klienten, vilket också minskar
  risken att en fråga som ändå råkar beröra en patientsituation blir kvar någonstans.
- `src/version.js` → 5.3.0, `package.json` → 5.3.0, ny post i `src/data/andringslogg.js`.
- Verifierat: `npm run build`, `npm run lint` och `node -c` på `functions/index.js` gröna.

### Kända begränsningar / medvetna avgränsningar

- **Namn-varningen är en påminnelse, inte ett skydd.** Den missar troligen de flesta riktiga
  namn och ger falska larm på annat versalinlett (platser, läkemedel, organisationer). Förlita
  er inte på den juridiskt – den kompletterar utbildning/rutiner, ersätter dem inte.
- **Domänlistan för klinikstöd-sökningen är inte verifierad mot en aktiv webbuppslagning**
  (byggd utan nätåtkomst i den här sessionen). Domänen för "Nationella kliniska kunskapsstödet"
  (`nationelltklinisktkunskapsstod.se`) är en bästa gissning utifrån tränad kunskap, inte en
  bekräftad uppslagning – dubbelkolla den specifikt innan skarp drift, liksom de övriga fyra.
- `googleSearchRetrieval`-verktyget requestas mot `gemini-1.5-flash` (inte `gemini-2.5-flash`
  som används för fototolkning) eftersom det är den modell/verktygsform `@google/generative-ai`
  v0.21:s typdefinitioner dokumenterar stöd för. Detta har inte kunnat testköras mot skarpt
  Gemini-API i den här sessionen (ingen nätåtkomst) – **funktionen bör testas manuellt direkt
  efter driftsättning** innan den littas på i skarpt bruk, i händelse av att verktyget/modellen
  inte längre stöds eller beter sig annorlunda än typdefinitionerna antyder.
- Domänvalideringen sker på `groundingChunks`, dvs. de käll-URL:er Gemini själv anger att den
  använt. Den kontrollerar inte att svarstexten verkligen är hämtad exakt ordagrant från dessa
  sidor, bara att de sidor Gemini uppger som källor ligger på godkända domäner.

### Fas 9.1 – Rättning: klinikstöd-sökningen misslyckades alltid (5.3.1)

Precis som varnat för i Fas 9 gick den manuella testningen inte bra: sökningen misslyckades med
"Sökningen misslyckades. Försök igen." varje gång. Ingen tillgång till Cloud Functions-loggar
fanns i den här sessionen (inga `gcloud`/`firebase`-CLI:er, inget loggverktyg), så felsökningen
fick göras genom kodgranskning istället för att läsa den faktiska felorsaken.

Sannolik grundorsak: `@google/generative-ai` v0.21:s typdefinitioner känner bara till det äldre
`googleSearchRetrieval`-verktyget (byggt för Gemini 1.0/1.5 med "dynamic retrieval"), inte det
nyare `googleSearch`-verktyget som `gemini-2.5-flash` (modellen resten av appen redan använder
framgångsrikt) förväntar sig. Att blanda `gemini-1.5-flash` med det gamla verktyget riskerade
antingen en utfasad modell eller en verktygskonfiguration modellen inte accepterar.

**Åtgärd:** `functions/index.js` – `fragaKlinisktStod` anropar nu Gemini REST-API:et
(`generativelanguage.googleapis.com/v1beta/.../gemini-2.5-flash:generateContent`) direkt via
`fetch`, med `tools: [{ googleSearch: {} }]`, istället för `@google/generative-ai`-paketet.
Detta kringgår paketets föråldrade typdefinitioner helt. Käll-sökningen (`groundingChunks`,
rättad stavning – tidigare kod sökte även efter den historiska felstavningen `groundingChuncks`
som skydd om API:et fortfarande skulle råka använda den).

**Viktigt:** även denna version kunde inte testköras live (ingen nätåtkomst i utvecklingssessionen).
Skillnaden är att om anropet misslyckas igen visas nu det faktiska HTTP-statuskoden och
felmeddelandet från Gemini API:et direkt i gränssnittet (`Sökningen misslyckades: ...`), istället
för ett generiskt meddelande – så nästa felsökningsrunda har faktisk information att gå på utan
att behöva Cloud Functions-loggar.

### Fas 9.2 – Bekräftelse: implementationen fungerar, plus återförsök vid överbelastning (5.3.2)

Den förbättrade felsökningen i 5.3.1 gjorde nytta direkt: användarens nästa testförsök gav ett
konkret, läsbart fel istället för ett generiskt: `Gemini API svarade 503: {"error": {"code": 503,
"message": "This model is currently experiencing high demand...", "status": "UNAVAILABLE"}}`.

Det bekräftar att REST-anropet, modellen och `googleSearch`-verktyget fungerar korrekt – felet är
en tillfällig kapacitetsbegränsning hos Google, inte ett konfigurationsfel i vår kod.

**Åtgärd:** `functions/index.js` – `fragaKlinisktStod` gör nu ett automatiskt återförsök (efter 2
sekunders paus) specifikt vid `503`-svar, eftersom sådana överbelastningar oftast är kortvariga.
Om även återförsöket misslyckas visas ett tydligt, användarvänligt meddelande ("Gemini är
tillfälligt överbelastat just nu...") istället för rå JSON.
- `src/version.js` → 5.3.2, `package.json` → 5.3.2, ny post i `src/data/andringslogg.js`.

### Fas 9.3 – Källbegränsningen respekterades inte, och otillräcklig insyn i vad som blockerades (5.3.3)

Nästa test (efter 503-fixen) gick hela vägen fram – anropet lyckades och Gemini sökte faktiskt
live – men svaret hänvisade till källor utanför de fem godkända, och blockerades korrekt av
efterhandsvalideringen. Det bekräftade att säkerhetsspärren fungerar som den ska. Två problem
kvarstod dock: (1) prompten var bara en instruktion, inget som faktiskt styrde vad
`googleSearch`-verktyget sökte efter, så Gemini gjorde uppenbarligen en bred websökning ändå;
(2) felmeddelandet talade om ATT något blockerats men inte VILKA källor det gällde, vilket
gjorde det svårt att bedöma om spärren var för sträng eller körde korrekt.

**Åtgärd:** `functions/index.js`:
- Prompten instruerar nu uttryckligen Gemini att formulera sina sökningar med `site:`-operatorn
  riktad mot en domän i taget (t.ex. `site:internetmedicin.se <fråga>`), istället för att bara
  räkna upp domänerna som en allmän regel. Detta är samma teknik som en riktig Google-sökning
  respekterar, och ger `googleSearch`-verktyget en konkret sökstrategi att följa istället för en
  vag instruktion att "bara använda" vissa sidor.
- Om första svaret ändå hänvisar till otillåtna källor (eller inga källor alls): **ett andra,
  korrigerande försök** görs automatiskt med en skarpare prompt som pekar ut exakt vilka
  domäner som floppade förra gången och kräver strikt `site:`-sökning denna gång. Detta är
  separat från 503-återförsöket (som bara gäller överbelastning) – nu kan funktionen alltså
  göra upp till två Gemini-anrop totalt av olika anledningar.
- Om svaret ändå blockeras efter båda försöken listar felmeddelandet nu explicit vilka
  käll-URL:er Gemini faktiskt använde, så det går att se vad den försökte referera till istället
  för att bara veta att något blockerades.
- `src/version.js` → 5.3.3, `package.json` → 5.3.3, ny post i `src/data/andringslogg.js`.

**Kvarstående osäkerhet:** `site:`-instruktionen i prompten är fortfarande bara en instruktion
till modellen om hur den ska använda sökverktyget, inte en hård teknisk spärr på själva
sökfrågan (den REST-baserade `googleSearch`-tool-konfigurationen exponerar inga parametrar för
att själva bestämma sökfrågan). Efterhandsvalideringen mot den godkända domänlistan är
fortfarande den enda faktiska garantin – prompten är bara ett försök att minska hur ofta den
spärren behöver träda in.

### Fas 9.4 – Den faktiska bugg-grundorsaken: domänvalidering mot fel URL (5.3.4)

Nästa test avslöjade den verkliga grundorsaken bakom att svaret blockerades: de käll-URL:er som
`groundingChunks[].web.uri` returnerar går ALLTID via
`vertexaisearch.cloud.google.com/grounding-api-redirect/...` – en redirect-tjänst från Google,
aldrig sidans riktiga domän direkt. Domänvalideringen (`domanGodkand`) körde alltså hela tiden
mot `vertexaisearch.cloud.google.com`, som förstås aldrig matchar de fem godkända domänerna –
oavsett vilken sida Gemini faktiskt hade hittat. Detta hade sannolikt gjort att FUNKTIONEN
blockerade i princip alla svar permanent, helt oavsett hur bra prompten var.

**Åtgärd:** `functions/index.js` – ny `losUppSlutgiltigUrl(url)`/`losUppKallor(kallor)`: varje
käll-länk följs (HEAD, med GET som fallback om HEAD avvisas) för att hitta den slutgiltiga,
riktiga URL:en innan domänen kontrolleras. Om upplösningen misslyckas behålls redirect-länken
som den är, vilket medvetet gör att den käll-länken inte klarar domänkontrollen (säkert
default – vi godkänner aldrig en källa vi inte kunnat verifiera). De körlösta URL:erna används
även i det som visas för användaren, så källänkarna pekar direkt på rätt sida istället för via
en Google-redirect.
- `src/version.js` → 5.3.4, `package.json` → 5.3.4, ny post i `src/data/andringslogg.js`.

**Kvarstående osäkerhet:** kunde inte testköras live (samma begränsning som tidigare i den här
fasen). Om `vertexaisearch.cloud.google.com`-slutpunkten skulle blockera server-till-server-
anrop (t.ex. kräva en webbläsarliknande User-Agent, eller sätta en kort giltighetstid på
redirect-länken) skulle upplösningen kunna misslyckas och svaret blockeras i onödan – detta bör
verifieras vid nästa manuella test.

### Fas 9.5 – Beslut: pausa klinikstöd-sökningen (5.3.5)

Redirect-upplösningen i 5.3.4 fungerade delvis (tre av fyra länkar löstes upp korrekt till
riktiga domäner: `ec.europa.eu` och `ema.europa.eu`), vilket bekräftar att den tekniska
mekaniken är sund. Problemet är istället grundläggande: Gemini sökte fortfarande brett på
webben och hittade EU/EMA-läkemedelsdokument på nederländska om ett läkemedel, helt utanför de
fem godkända svenska källorna – trots en prompt med explicit `site:`-instruktion OCH ett andra,
ännu skarpare korrigerande försök. Det är tredje raka testet med samma grundmönster:
efterhandsspärren blockerar korrekt, men Gemini går inte att pålitligt styra till specifika
domäner enbart via prompt-instruktion till dess autonoma sökverktyg.

Ställdes inför användaren som ett vägval (via `AskUserQuestion`): fortsätta patcha prompten
(låg förväntad träffsäkerhet), bygga om till att själva styra sökningen via en riktig
domänbegränsad sökmotor (kräver att användaren sätter upp ett Google Cloud-projekt +
Custom Search API + Programmable Search Engine – manuella steg utanför vad som kan
automatiseras här), eller pausa funktionen tills vidare. Användaren valde att **pausa**.

**Åtgärd:** `src/components/KlinikfragaSok.jsx` – en `PAUSAD`-konstant (satt till `true`) gör
att komponenten visar ett tydligt pausat-meddelande istället för sök-formuläret. Resten av
implementationen (Cloud Function, PII-filter på frågan, domänvalidering, redirect-upplösning)
ligger kvar oförändrad i koden för att kunna återaktiveras senare – antingen genom fler
prompt-iterationer eller genom att bygga om till en riktig sökmotor-baserad lösning (se
`PAUSAD`-kommentaren i filen för sammanfattning och pekare till denna logg).
- `src/version.js` → 5.3.5, `package.json` → 5.3.5, ny post i `src/data/andringslogg.js`.

### Kända begränsningar / medvetna avgränsningar (Fas 9)

- Klinikstöd-sökningen (`fragaKlinisktStod`) är pausad i gränssnittet. Att återaktivera med
  samma prompt-baserade ansats riskerar samma låga träffsäkerhet som observerats i tre raka
  tester. En riktig lösning kräver sannolikt att servern själv gör domänbegränsade sökningar
  (t.ex. via Google Custom Search JSON API med `siteSearch` satt till en av de fem domänerna,
  en sökning per domän) och matar Gemini med enbart dessa träffar som kontext – istället för
  att låta Gemini söka fritt och hoppas att den håller sig till instruktionen.
- PII-filtret (personnummer-spärr + namn-varning) och den övriga säkerhetsgranskningen från
  Fas 9 är opåverkade av pausningen och förblir aktiva.

## Fas 10 – Femton mindre funktioner: samarbete, adminverktyg och kvalitet

**Datum:** 2026-07-14
**Branch:** `claude/compassionate-euler-rho0q5`

### Bakgrund

Två raka rundor med förslag där användaren valde 15 punkter totalt att implementera direkt:
systemstatus-widget, @omnämnanden i kommentarer, egna genvägar på startsidan, feedback-svar,
läskvittering på anslag, PDF-export av hela sektioner, en lätt WYSIWYG-verktygsrad, sökbar
ändringslogg, bulk-taggning, återställ tidigare version, konfigurerbar auto-utloggningstid,
force-logout, tydligare offline-indikator, feedback-status och dubblettvarning.

### Genomfört

**Firestore-regler** – tre tillägg: `users/{uid}` tillåter nu självuppdatering av
`snabblankar` utöver `favoriter`/`senasteNotisBesok`; `anslag` tillåter fältbegränsad
`lasteAv`-uppdatering av alla inloggade (samma mönster som rutiner); `feedback` tillåter
avsändaren att läsa sina egna inskick (`resource.data.skapadAv == request.auth.uid`) och
superadmin att fältbegränsat uppdatera `svar`/`svarDatum`/`status`.

**Samarbete på rutiner**
- `src/components/Kommentarer.jsx` – `hittaOmnamndaUid()` matchar `@handtag` i kommentartext
  mot användarnas e-post (delen före @), sparar träffarna som `omnamnda`-array på kommentaren.
  `src/hooks/useNotiser.js` lyssnar på `kommentarer where omnamnda array-contains uid` och
  slår ihop dessa med anslags-/rutinnotiserna. `anvandare`-listan skickas nu alltid ner till
  `RutinKort`/`Kommentarer` (tidigare bara vid `farRedigera`) så mention-matchning fungerar
  för alla, medan den redan befintliga "olästa"-listan förblir redaktörsgated.
- `src/components/RutinFormular.jsx` – enkel WYSIWYG-lite-verktygsrad (Fet/Kursiv/Rubrik/Lista)
  som omsluter/infogar markdown-syntax i textarean via `selectionStart`/`selectionEnd`, istället
  för att kräva att användaren skriver markdown för hand. Inget nytt beroende.
- `src/components/VersionsHistorik.jsx` – "Återställ den här versionen"-knapp per historisk
  version, kopplad via en ny `onAterstall`-prop genom `RutinKort.jsx` till en handler i
  `Sektionssida.jsx` som återanvänder `uppdateraRutin` (vilket i sin tur snapshotar det
  nuvarande innehållet som en ny version innan återställningen skrivs, precis som vid vanlig
  redigering).
- `src/components/Sektionssida.jsx` – bulk-taggning: ett "☑️ Markera flera"-läge visar
  kryssrutor bredvid varje rutinkort, en liten verktygsrad lägger till en gemensam tagg på alla
  markerade (`Promise.all` av `uppdateraRutin`-anrop). Samma fil fick också en
  "🖨️ Skriv ut hela sektionen"-knapp som sätter en ny body-klass `utskrift-sektion`;
  `RutinKort.css`s utskriftsregler utökades att även dölja navigering/formulär/verktyg för det
  nya läget men (till skillnad från den befintliga per-rutin-utskriften) visa ALLA rutinkort
  istället för bara ett.

**Anslag**
- `src/hooks/useLaskvittering.js` + `src/components/AnslagKort.jsx` – samma
  `lasteAv`-mönster som rutiner, egen knapp och kvitteringsräknare.

**Feedback**
- `src/hooks/useFeedback.js` – nya `FEEDBACK_STATUS`-värden (ny/under_utredning/åtgärdad/
  avvisad), `uppdateraFeedbackStatus()`, `svaraPaFeedback()` samt en ny `useMinaFeedback(uid)`
  för avsändarens egen vy. `src/pages/Feedback.jsx` visar nu användarens tidigare inskick med
  status och ev. svar. `src/pages/Admin.jsx` fick en statusväljare och ett litet
  svarsformulär per feedbackpost.

**Egna genvägar på startsidan**
- `src/hooks/useSnabblankar.js` (ny) – sparar valda genvägsnycklar på `users/{uid}.snabblankar`
  (samma mönster som `useFavoriter.js`). `null` (inget val gjort) tolkas som "visa alla", för
  bakåtkompatibilitet med befintliga konton. `src/pages/Hem.jsx` renderar nu listan dynamiskt;
  `src/pages/Profil.jsx` fick en ny sektion med kryssrutor för att välja vilka som visas.

**Adminverktyg**
- `src/pages/Admin.jsx` – ny "📊 Systemstatus"-sektion (appversion, antal
  användare/rutiner/artiklar, Gemini-budget, auto-utloggningstid). Ändringsloggen fick ett
  sök- och typfilter (klientsidig filtrering av redan hämtade poster). Användarlistan fick en
  "Tvinga utloggning"-knapp per användare (utom sig själv).
- `src/hooks/useUtloggningsinstallning.js` (ny) – konfigurerbar auto-utloggningstid lagrad i
  `installningar/utloggning.minuter` (samma collection/regelmönster som Gemini-budgeten:
  läsbar av alla, skrivbar av superadmin). `src/hooks/useInaktivitetsUtloggning.js` tar nu emot
  minutervärdet som parameter istället för en hårdkodad konstant.
- `functions/index.js` – ny callable `tvingaUtloggning({userId})`: verifierar att anroparen är
  superadmin (slår upp rollen direkt mot `users`-collectionen med Admin SDK, kringgår Firestore-
  reglerna avsiktligt eftersom detta är en säkerhetskontroll i själva funktionen), anropar sedan
  `admin.auth().revokeRefreshTokens(userId)`. `src/App.jsx` fick en `SessionKontroll`-komponent
  som var 5:e minut tvingar fram en tokenförnyelse (`currentUser.getIdToken(true)`) och loggar
  ut lokalt om den misslyckas – annars hade en redan utfärdad ID-token kunnat fortsätta fungera
  i upp till en timme efter en påtvingad utloggning.

**Övrigt**
- `src/components/OfflineIndikator.jsx` (ny) – lyssnar på `online`/`offline`-händelser, visar en
  sticky banner högst upp när `navigator.onLine` är falskt. Monterad globalt i `src/App.jsx`.
- `src/components/KontaktFormular.jsx`/`LankFormular.jsx` – varnar (via `confirm()`, inte en
  hård spärr) om en kontakt/länk med samma namn redan finns, med möjlighet att spara ändå.
- `src/version.js` → 5.4.0, `package.json` → 5.4.0, ny post i `src/data/andringslogg.js`.
- Verifierat: `npm run build`, `npm run lint` och `node -c` på `functions/index.js` gröna
  genomgående under implementationen (byggdes i flera checkpoints).

### Kända begränsningar / medvetna avgränsningar

- Force-logout-effekten kan dröja upp till 5 minuter (kontrollintervallet i `SessionKontroll`)
  istället för att vara omedelbar, som en avvägning mot att inte göra ett Firestore/Auth-anrop
  vid varje interaktion.
- Bulk-taggning stödjer bara att lägga till en tagg på flera rutiner samtidigt, inte att ta
  bort en tagg i bulk.
- @omnämnanden matchar mot e-postens lokala del (`namn` i `namn@domän`), inte mot visningsnamn
  – fungerar bäst om användarna känner till varandras e-postadresser.

## Fas 11 – Fullständig säkerhets-/buggenomgång av hela kodbasen

Efter fem releaser (5.0.0–5.4.0) genomfördes en samlad genomgång av samtliga lager (Firestore-
regler, Storage-regler, Cloud Functions, samtliga React-hooks/komponenter/sidor) med fokus på
sårbarheter, inte bara nya buggar. Metod: manuell genomläsning av `firestore.rules` och
`storage.rules` i sin helhet, grep-genomsökning efter riskabla mönster
(`dangerouslySetInnerHTML`, `eval`, `innerHTML=`, `tel:`-länkar, hårdkodade nycklar,
`console.log` av känslig data) samt en riktad genomgång av alla `href`/`src`-bindningar mot sin
källa. Ett separat delmoment gick igenom alla filer under `src/hooks`, `src/pages`,
`src/components`, `src/utils` och `src/firebase` som inte redan var täckta av tidigare
säkerhetsgenomgångar (Fas 6, Fas 9).

**Åtgärdat**

- `src/components/LankFormular.jsx` / `src/pages/Lankbibliotek.jsx` – en sparad länk validerades
  bara av `<input type="url">`s inbyggda kontroll, som INTE tillförlitligt stoppar
  `javascript:`-URI:er (de är syntaktiskt giltiga webbadresser). En sparad `javascript:`-länk
  hade kunnat köra kod i webbläsaren när någon senare klickade på den i länkbiblioteket (lagrad
  self-XSS). Fixat med en explicit `^https?:\/\//i`-kontroll dels innan sparning, dels innan
  renderingen väljer att visa titeln som en klickbar länk över huvud taget (den senare skyddar
  även mot ev. redan sparad felaktig data).
- `functions/index.js` – `fragaKlinisktStod` (klinikstöd-sökningen, för närvarande pausad i
  klientgränssnittet) saknade helt budgetspärren som de två andra Gemini-anropande funktionerna
  har. Utan den kunde en inloggad användare i teorin anropa funktionen direkt (förbi den
  pausade knappen) obegränsat många gånger, vardera med upp till fyra Gemini-anrop (två
  modellförsök × ett omförsök var). Samma `reserveraBudget()`-anrop som `tolkaForradsbild`/
  `tolkaDokument` lades till.
- `src/components/AnslagFormular.jsx` – anslagstavlan (meddelanden till ALL personal) hade
  ingen patientuppgiftskontroll alls, till skillnad från rutiner, kommentarer, skiftrapport,
  privata anteckningar och feedback som alla kör `kontrolleraPatientuppgifter()` innan sparning.
  Eftersom anslag är den mest bredspridda textytan i appen (varje inloggad användare ser varje
  anslag) bedömdes detta som den mest angelägna av de kvarvarande luckorna att täppa till.
  Samma mönster som `Skiftrapport.jsx` la till: hård spärr vid personnummer, `confirm()`-varning
  vid misstänkt namn.

**Granskat, inga ändringar (redan säkert)**

- `src/components/MarkdownInnehall.jsx` – enda stället med `dangerouslySetInnerHTML`, men
  körs alltid genom `DOMPurify.sanitize()` först.
- `src/components/KlinikfragaSok.jsx` (`<a href={k.url}>`) – URL:en är redan
  domänvaliderad server-side innan den returneras till klienten.
- `src/components/RutinKort.jsx` (`<a href={b.url}>`) – URL:en kommer alltid från Firebase
  Storages egen `getDownloadURL()`, aldrig från användarinmatning.
- `src/pages/Kontakter.jsx` – telefonnummer renderas som vanlig text, ingen `tel:`-länk,
  vilket är ett medvetet, tidigare beslutat krav (inget ring-i-appen).
- Samtliga CRUD-hooks delegerar behörighetskontrollen helt till Firestore-reglerna; UI-nivåns
  roll-flaggor (`farHantera`, `farRedigera` m.fl.) är enbart presentation, ingen mutation
  litar på en klient-uppgift om roll eller ägarskap utan att reglerna också kontrollerar det.
- Ingen `eval`, `innerHTML=`, hårdkodad hemlighet eller känslig `console.log` hittades någonstans
  i kodbasen.

**Kvarvarande, medvetet accepterade avgränsningar (ej åtgärdade i denna fas)**

1. **PII-filtret är enbart klientsidigt för direkta Firestore-skrivningar.** Det juridiskt
   viktigaste skyddet (`innehallerPersonnummer()` i `functions/index.js`) gäller bara text som
   går via en Cloud Function (AI-bild-/dokumenttolkning, klinikstöd-frågan). För rutiner,
   kommentarer, skiftrapport, anteckningar, feedback och nu anslag är personnummer-/namn-
   kontrollen bara ett klientsidigt JavaScript-anrop innan `onSpara`/`skapaPost` – en klient som
   pratar direkt med Firestore-API:et (t.ex. via webbläsarkonsolen eller ett eget skript, med en
   giltig inloggning) kan kringgå kontrollen helt. Att stänga denna lucka på regelnivå skulle
   kräva antingen (a) en förenklad regex-kontroll i `firestore.rules` utan datum-/Luhn-
   validering (fler falska positiva, blockerar sparning hårt utan möjlighet till "spara ändå"),
   eller (b) att flytta alla skrivningar via en Cloud Function som kan återanvända den
   fullständiga, validerade kontrollen. Båda är arkitekturförändringar som medvetet lämnas
   utanför denna genomgång och bör beslutas av verksamheten, inte antas.
2. `storage.rules`: `inkommande/{uid}/{filnamn}` får läsas av vem som helst med en icke-
   "personal"-roll, inte bara den som laddade upp filen – d.v.s. en råbild kan ses av andra
   redaktörer innan/utan att AI-tolkningens PII-skanning någonsin körs på den (skanningen körs
   bara på den extraherade TEXTEN, aldrig på själva bilden). Avsiktlig design för
   granskningsflödet (flera roller ska kunna se och godkänna inkommande underlag), men värt att
   känna till.
3. `kommentarer/{kommentarId}` tillåter att skaparen sätter ett godtyckligt `omnamnda`-fält
   (vilka uid:n som får en @omnämnande-notis) utan serverside-validering mot texten. Låg
   allvarlighetsgrad – ger i värsta fall en missvisande notis till fel person, exponerar ingen
   data.
4. `src/components/ForradArtikelFormular.jsx` saknar samma patientuppgiftskontroll som övriga
   formulär. Bedömt som lägre prioritet eftersom fälten (artikelnamn, skåp, hylla, antal) är
   korta, strukturerade logistikuppgifter där patientinformation osannolikt skulle hamna av
   misstag – men inkonsekvent med resten av appens mönster.

**Verifiering**

- `npm run build`, `npm run lint` och `node -c functions/index.js` gröna efter samtliga
  ändringar.
- `src/version.js` → 5.4.1, `package.json` → 5.4.1, ny post i `src/data/andringslogg.js`.

## Fas 12 – Uppföljning på säkerhetsrapporten: åtgärdade punkter + nya funktioner

Efter Fas 11-rapporten bad användaren om ett skräddarsytt regelbaserat personnummerfilter
(se resonemang nedan) samt implementation av samtliga övriga förslag från rapporten, förutom
"exportera hela kunskapsbasen som PDF", "kiosk-läge" och att återuppta klinikstöd-sökningen med
en riktig domänbegränsad sökmotor (kräver att användaren själv skapar en Google Programmable
Search Engine och delar API-nyckel/sök-ID – inget som går att provisionera automatiskt, så den
lämnades därför orörd).

**Regelbaserat personnummerfilter (`firestore.rules`)**

Användaren frågade specifikt om ett smalare regelvillkor: blockera bara 12-siffriga nummer om
seklet är 19 eller 20 (ingen levande person är född på 1600/1800-talet), och bara om
månad/dag faktiskt kan vara ett datum. Utrett och implementerat som `harTroligtPersonnummer()`:

- Ren regex kan validera sekel (`(19|20)`), månad (`0[1-9]|1[0-2]`) och dag (inkl.
  samordningsnummer, dag+60) – allt detta stänger ute siffersviter som inte ens kan vara ett
  datum.
- Regelspråket (CEL) kan INTE replikera Luhn-checksumman – det saknar sträng→heltal-konvertering
  per tecken och loop-konstruktioner för det. Det här filtret är alltså en trubbigare backup,
  inte en fullständig ersättning för klientens/Cloud Functions fulla kontroll.
- `\b`-ordgränser gör att ett 10-siffrigt och ett 12-siffrigt alternativ inte kolliderar (en
  angränsande siffra bryter gränsen), så century-kravet gäller bara när talet faktiskt är
  12 siffror i följd.
- Tillämpat på `rutiner` (titel/innehåll/referenser), `anslag` (titel/innehåll),
  `skiftrapporter` och `anteckningar` (text), både vid create och (där tillämpligt) update.

**Kommentarer och feedback flyttade till Cloud Functions**

För att kunna köra den FULLSTÄNDIGA Luhn-kontrollen (inte bara regel-approximationen) samt
en hastighetsspärr, skapas kommentarer och feedback nu via två nya callable-funktioner
(`skapaKommentar`, `skickaFeedback`) istället för direkta klient-skrivningar:

- `firestore.rules`: `create` för `kommentarer` och `feedback` är nu `if false` – all skapande
  går via Admin SDK i Cloud Functions, som kringgår reglerna avsiktligt.
- Hastighetsbegränsning: en enkel rullande 1-timmesräknare per (uid, typ) i en ny
  `hastighetsgranser`-collection (max 30 kommentarer/timme, 10 feedback/timme).
- @omnämnanden räknas nu ut server-side från den faktiska texten (matchar `@handtag` mot
  användarnas e-postens lokala del), istället för att lita på ett klient-skickat `omnamnda`-
  fält – stänger helt luckan som beskrevs i Fas 11 (tidigare kunde en klient peka ut
  godtyckliga uid:n som "omnämnda").
- `src/hooks/useKommentarer.js` och `useFeedback.js` anropar nu dessa funktioner istället för
  `addDoc`. `Kommentarer.jsx`/`Feedback.jsx` uppdaterade därefter (enklare anrops-signatur,
  try/catch med felmeddelande från servern).

**Storage-regler åtstramade istället för loggade**

Rapportens förslag om en åtkomstlogg för råbilder i `inkommande/{uid}/` visade sig inte gå att
implementera som avsett: Cloud Storage-läsningar via klient-SDK:t triggar inga Cloud Functions
eller Firestore-skrivningar, så det finns ingen server-side hook att logga från. Eftersom
ingen nuvarande UI-funktion faktiskt läser en annan användares råbild (bekräftat genom att gå
igenom hela uppladdningsflödet i `LaddaUpp.jsx`), togs den bredare läsbehörigheten (alla
icke-"personal"-roller) bort helt istället – `storage.rules` tillåter nu bara ägaren själv att
läsa sin egen råbild (Cloud Functions med Admin SDK kringgår ändå reglerna för
Gemini-tolkningen).

**@mention-autocomplete**

`src/components/Kommentarer.jsx` fick en enkel autocomplete: skriver man `@` följt av bokstäver
i kommentarfältet visas en dropdown med matchande användare (baserat på e-postens lokala del),
och ett klick infogar hela handtaget. Ersatte den gamla `hittaOmnamndaUid`-hjälpfunktionen som
inte längre behövs (omnämnanden räknas nu ut server-side, se ovan).

**Bulk-borttagning av tagg**

`src/components/Sektionssida.jsx` fick en spegelvänd variant av den befintliga
bulk-tillägg-knappen: samma taggfält, men en "Ta bort tagg från markerade"-knapp filtrerar bort
taggen istället för att lägga till den.

**Sökfilter per kategori**

`src/components/SokFalt.jsx`: när en sökning ger träffar i mer än en kategori (Logistik,
Kliniskt stöd, Administration, Kontakt, Länk) visas nu klickbara filter-chips ovanför
resultatlistan med antal per kategori. Noll-träff-loggningen använder fortfarande den
ofiltrerade träfflistan, så ett för snävt kategorival inte felaktigt loggas som "inga träffar".

**Notis inför granskningsfrist**

Rutiner har sedan tidigare en passiv "bör granskas"-flagga (180 dagar sedan `granskadDatum`).
`src/utils/rutinHjalp.js` fick en ny `narmarSigGranskning()` som är sann under de sista 14
dagarna INNAN fristen går ut. `src/hooks/useNotiser.js` lägger nu till en notis-post för detta,
synlig bara för redaktörer med behörighet för rutinens område (kliniskt stöd: superadmin/VÖL/
sektionsledare, administration: superadmin/VEC). Till skillnad från appens övriga notiser (som
jämförs mot `senasteNotisBesok`) är detta ett stående tillstånd – posten finns kvar tills
rutinen faktiskt markeras som granskad, den försvinner inte bara för att man öppnat
notisklockan en gång.

**Kvitteringsfrist på anslag**

`AnslagFormular.jsx` fick ett valfritt "Kräv kvittering senast"-datumfält. `AnslagKort.jsx`
visar deadline (röd/fet om passerad) och, för den som får hantera anslag, hur många som INTE
kvitterat än. En ny sektion i `Admin.jsx` ("⏰ Kvitteringar med deadline") listar alla anslag med
en frist och hur många av alla användare som kvitterat. Avgränsning: samma koncept lades INTE
till på rutiner, eftersom rutiner redan har ett eget, separat "behöver granskas"-datum
(`granskadDatum` + granskningsintervall) som fyller en liknande funktion – att lägga till ännu
ett datumfält där bedömdes öka schemakomplexiteten utan att lösa ett nytt problem.

**Enhetstester (Vitest)**

Projektet hade inget testverktyg alls. La till `vitest` som devDependency, `npm run test`-
skript, samt `src/utils/piiFilter.test.js` med tio tester av `hittaPersonnummer`/
`hittaMisstankaNamn` – bl.a. Skatteverkets kända testpersonnummer (900101-0017), ett giltigt
samordningsnummer, samt flera fall som INTE ska flaggas (fel checksumma, omöjlig månad/dag,
slumpmässiga 10-siffriga tal). Dessa tester validerade samtidigt att antagandena bakom det nya
regelbaserade filtret (sekel/månad/dag-logiken) stämmer med den befintliga Luhn-
implementationen.

**Bundle-storlek**

`vite.config.js` fick en `manualChunks`-funktion som bryter ut alla `firebase`/`@firebase`-
moduler i en egen `firebase-vendor`-chunk. Huvudbundeln minskade från ~892 kB till ~244 kB;
Firebase-SDK:t (som sällan ändras mellan releaser) cachas nu separat från appens egen,
betydligt oftare uppdaterade kod.

**CI-workflow**

Ny `.github/workflows/ci.yml`: kör `npm ci`, `npm run lint`, `npm run test`, `npm run build`
och en syntaxkontroll av `functions/index.js` på varje push och pull request – separat från den
befintliga manuella `deploy.yml`.

**Firestore-index**

Granskade alla `where`/`orderBy`-kombinationer i `src/hooks`. Hittade en composite-query utan
matchande index: `useMinaFeedback` (`where("skapadAv","==",uid) + orderBy("skapad","desc")`).
La till motsvarande post i `firestore.indexes.json`.

**Verifiering**

- `npm run build`, `npm run lint`, `npm run test` (10/10 gröna) och `node -c functions/index.js`
  gröna efter samtliga ändringar.
- `src/version.js` → 5.5.0, `package.json` → 5.5.0, ny post i `src/data/andringslogg.js`.

### Kända begränsningar / medvetna avgränsningar

- Kvitteringsfrist finns bara på anslag, inte rutiner (se resonemang ovan).
- Det regelbaserade personnummerfiltret i `firestore.rules` kan fortfarande ge enstaka falska
  positiva (ett tal som råkar se ut som ett datum men inte är ett personnummer) eftersom det
  saknar Luhn-validering – en medveten avvägning eftersom regelspråket inte kan göra bättre.

## Fas 13 – Klinikstöd-sökningen återaktiverad med en riktig domänbegränsad sökmotor

Fas 11 flaggade att klinikstöd-sökningen (pausad sedan 5.3.5) skulle kräva en riktig
domänbegränsad sökmotor för att bli pålitlig, eftersom Gemini inte tillförlitligt respekterade
en `site:`-prompt-instruktion. Användaren skapade en Google Programmable Search Engine
(konfigurerad att bara söka inom internetmedicin.se, 1177.se,
nationelltklinisktkunskapsstod.se, fass.se, lakemedelsverket.se – samt två nya:
vardhandboken.se och folkhalsomyndigheten.se), aktiverade Custom Search JSON API, och delade
Search Engine ID (cx) och en API-nyckel begränsad till just den API:n.

**`functions/index.js` – `fragaKlinisktStod` omskriven i grunden:**

- Ny `sokViaProgrammerbarSokmotor(fraga)`: anropar
  `https://www.googleapis.com/customsearch/v1` med `key`/`cx`/`q`/`num=5`, returnerar
  titel/länk/utdrag för varje träff.
- Domänbegränsningen sitter nu i sökmotorns egen konfiguration (Google söker aldrig utanför
  de konfigurerade domänerna), inte i en instruktion till Gemini. `domanGodkand()` körs ändå
  kvar som ett extra skyddslager på träffarna, ifall sökmotorns konfiguration någonsin skulle
  ändras av misstag.
- Gemini används bara för att SAMMANFATTA de faktiska sökträffarna (titel + utdrag skickas i
  prompten) och citera vilken träff varje påstående kommer ifrån – inte för att själv "leta
  upp" information, vilket var precis det steg som tidigare inte gick att lita på.
- Den gamla retry-med-korrigerande-prompt-logiken (Fas 9.3) och redirect-upplösningen av
  Vertex-grounding-länkar (`losUppSlutgiltigUrl`/`losUppKallor`, Fas 9.4) togs bort helt –
  onödiga nu när källorna aldrig kan hamna utanför listan från början.
- Ny secret `SOKMOTOR_API_KEY` (samma mönster som `GEMINI_API_KEY`, hanteras via
  `defineSecret` + Firebase Secret Manager, aldrig i klientkod eller repo). Search Engine ID
  (cx) är däremot inte hemligt (syns redan publikt i sökwidgetens inbäddningskod) och ligger
  som en vanlig konstant i koden.
- `GODKANDA_KALLDOMANER` utökad med `vardhandboken.se` och `folkhalsomyndigheten.se`.

**`.github/workflows/deploy.yml`:** nytt steg som sätter `SOKMOTOR_API_KEY` i Secret Manager
från en ny GitHub Actions-secret, precis som för `GEMINI_API_KEY`.

**`src/components/KlinikfragaSok.jsx`:** `PAUSAD` satt till `false` – funktionen är synlig i
gränssnittet igen.

**Säkerhetsnotis:** användaren delade API-nyckeln direkt i chatten under detta arbete. Nyckeln
är begränsad till enbart Custom Search API (kan inte missbrukas för annat), men flaggades
ändå till användaren eftersom den nu finns i klartext i konversationshistoriken.

**Verifiering:** `npm run build`, `npm run lint`, `npm run test` och `node -c
functions/index.js` gröna. Kunde INTE testköra den faktiska sökningen/Gemini-anropet live i
den här miljön (ingen nätåtkomst till Google-API:erna) – kräver att användaren driftsätter och
testar i skarp miljö, enligt samma mönster som tidigare faser i det här projektet.

## Fas 14 – Snabba förbättringar under tidsbegränsning (5.7.0)

Användaren beställde 13 punkter med en hård tidsgräns (~10 min) och instruktionen att bara
göra klart det som hinns. Fem små, fristående punkter valdes och slutfördes helt; resten
pausades (se "Ej påbörjat" nedan).

**Genomfört**

- **Klinikstöd-cache (7 dagar):** `fragaKlinisktStod` cachar nu svar+källor per normaliserad
  fråga i `klinikfragecache` (dok-id = base64url av frågan). Cache-träff returnerar direkt,
  FÖRE budgetspärren (kostar inget → ska inte äta budget). Sparar Custom Search-kvot
  (100 gratis/dag) och Gemini-kostnad.
- **Anonym frågelogg:** varje fråga loggas (utan uid, medvetet – VAD efterfrågas, inte VEM)
  i `klinikfrageloggar`. Läsbar endast av superadmin; skrivs endast server-side.
  Nya Firestore-regler för båda collections (klienten helt utestängd från cachen).
- **Filstorlekvarning:** `LaddaUpp.jsx` varnar (confirm, ingen spärr) för bilder > 8 MB.
- **CSV-export av kvitteringsläge:** knapp i adminpanelens "Kvitteringar med deadline"
  (BOM + semikolon-separerat så Excel med svenska inställningar öppnar den korrekt direkt).
- **Inaktiva konton:** `AuthContext` sätter nu `users/{uid}.senasteInloggning` vid varje
  inloggning (fältet tillagt i reglernas självuppdaterings-lista); ny superadmin-sektion i
  adminpanelen listar konton utan inloggning på 90 dagar. Konton skapade före 5.7.0 saknar
  fältet och listas som "aldrig registrerad inloggning" tills första inloggningen efter
  uppdateringen. Lint-notis: `react-hooks/purity` förbjuder `Date.now()` i render – löst med
  lazy `useState`-init (läses en gång vid montering, vilket räcker för en 90-dagarsgräns).

**Ej påbörjat (pga tidsgränsen):** "hjälpsamt?"-knapp på klinikstöd-svar, beroende-statustest
i adminpanelen, schemalagd Firestore-backup, ägare per rutin, markdown-förhandsvisning,
dödlänk-kontroll i länkbiblioteket, "senast besökta rutiner" på startsidan och
skelettladdning. Alla är fortsatt bra kandidater för nästa fas.

**Verifiering:** build, lint, test (10/10) och `node -c functions/index.js` gröna.
`src/version.js`/`package.json` → 5.7.0, ny post i andringslogg.

## Fas 15 – Femton-punkter-listans första fem (5.8.0)

Fortsättning på FRAMTIDSPLAN.md "Närmast"-listan. Alla fem klara.

- **Hjälpsamt-knapp:** `klinikfragefeedback`-collection (create-only för egen uid, läsbar
  bara av superadmin). `KlinikfragaSok.jsx` visar 👍/👎 efter ett svar; tyst felhantering
  eftersom det bara är statistik, inte kritisk funktionalitet.
- **Beroende-statustest:** ny `testaBeroenden`-callable (superadmin-only) som pingar Gemini
  (minimal "svara OK"-prompt), sökmotorn (en sökträff) och Storage (`bucket.getMetadata()`)
  parallellt med `Promise.all`. Körs INTE mot Gemini-budgeten – manuellt, sällan använt,
  försumbar kostnad. Ny knapp i adminpanelens Systemstatus-sektion med 🟢/🔴 per tjänst.
- **Markdown-förhandsvisning:** ny knapp i `RutinFormular.jsx`s verktygsrad växlar mellan
  textarean och `MarkdownInnehall`-rendering av samma innehåll.
- **Senast besökta:** `src/utils/senastBesokta.js` (ren `localStorage`, per enhet – inget
  konto-synkat). `Sektionssida.jsx` registrerar ett besök när URL:ens hash matchar
  `#rutin-{id}` för en rutin i den aktuella listan – täcker sökträffar, notislänkar,
  QR-länkar och direkta bokmärken i ett enda ställe. Lyssnar även på `hashchange` eftersom
  navigering mellan två rutiner på samma sida inte monterar om komponenten.
- **Skelettladdning:** ny generisk `Skelett`-komponent (tre pulserande platshållarkort),
  ersätter "Laddar..."-texten i de fem mest besökta listvyerna (rutiner, förråd, anslag,
  kontakter, länkbibliotek). `Admin.jsx`/`App.jsx`/`Skiftrapport.jsx`/`VersionsHistorik.jsx`
  lämnades oförändrade (lägre trafik, redan snabba) för att hålla ändringen avgränsad.

**Verifiering:** build, lint, test (10/10) och `node -c functions/index.js` gröna.
`src/version.js`/`package.json` → 5.8.0, ny post i andringslogg.

### Kvarstående från FRAMTIDSPLAN.md

Kort sikt: rutinägare, schemalagd backup, dödlänk-kontroll, riktig offline-åtkomst
(IndexedDB). Medellång sikt: tvinga 2FA, PDF-export av kunskapsbasen, kiosk-läge,
pilotutvärdering. Se FRAMTIDSPLAN.md för fullständig lista och motivering.

## Fas 16 – Ägare per rutin + verifieringsstöd för klinikstöd-sökningen (5.9.0)

Uppföljning på användarens genomgång av framtidsplanen. Tre punkter valdes ut (offline och
den generella skelettutökningen avvaktas medvetet – se nedan), i prioritetsordning:
verifieringsstöd (säkerhetsmässigt viktigast), utökad hälsokontroll, sedan ägarfältet.

**Ägare per rutin – `agare: { typ, roll?, uid?, namn? }`**

Precisering från användaren: fältet ska kunna peka på ANTINGEN en roll (alla med den rollen
räknas som ansvariga) ELLER en specifik person – vem som helst i systemet, oavsett om den
personen har en roll med redigeringsbehörighet för området. Implementerat som:

- `RutinFormular.jsx`: ny "Ansvarig"-väljare (Ingen / En roll / En specifik person). Vid
  "person" listas ALLA användare (inte filtrerat på redigeringsbehörighet), enligt uttrycklig
  instruktion. Namnet cachas i fältet vid sparning (`agare.namn`) för visning utan extra
  uppslag – kan bli inaktuellt om personen byter namn, en medveten avvägning för v1.
- `Sektionssida.jsx`: skickar `anvandare`-listan till formuläret, sparar `agare` i både
  skapa- och redigera-flödet.
- `RutinKort.jsx`: visar "Ansvarig: X" i signatur-raden när fältet är satt.
- **Medvetet INTE gjort** (enligt instruktion): ingen koppling till granskningspåminnelser
  än – `useNotiser.js`s `narmarSigGranskning`-logik riktar sig fortfarande till alla
  redaktörer för området, inte specifikt till `agare`. Strukturen är förberedd för det.
- Ingen ny Firestore-regel behövdes – fältet skrivs via samma `farRedigeraOmrade`-skyddade
  update-regel som alla andra rutinfält.

**Verifieringsstöd för klinikstöd-sökningen – ny `verifieraKlinikstod`-funktion**

Skiljer sig medvetet från `testaBeroenden`: den senare testar bara att API:erna SVARAR
(HTTP 200), inte att källbegränsningen faktiskt håller. Den nya funktionen kör tre fasta
testfrågor (olika medicinska ämnesområden) genom `sokViaProgrammerbarSokmotor` – förbi cachen,
alltid färskt – och kontrollerar att INGEN träff hamnar utanför `GODKANDA_KALLDOMANER`.
Testar medvetet INTE Gemini-steget: sedan Fas 13-ombyggnaden är sökmotorns egen konfiguration
den enda punkt där källbegränsningen faktiskt kan drifta (t.ex. om någon råkar ändra
sökmotorns inställningar i Google-kontot), så det är den punkten som behöver bevakas. Ny
adminsektion "🔍 Verifiera klinikstöd-sökningen" visar resultat per testfråga: antal träffar,
och – om något går fel – exakt vilka otillåtna källor som hittades.

**Utökad hälsokontroll – grönt/gult/rött + klinikstöd**

`testaBeroenden` mätte tidigare bara HTTP-status. Lade till svarstidsmätning
(`DEGRADERAD_GRANS_MS = 4000`): ett svar som kommer igenom men tar för lång tid flaggas nu
som "degraderad" (gult) istället för att bara vara "ok". La till en fjärde kontrollpunkt,
`testaKlinikstodKalla()` – en lättviktsversion av `verifieraKlinikstod` (en fråga istället
för tre) för att ge en snabb indikation i samma vy som de andra tjänsterna. Texten i
`Admin.jsx` skrevs om till "Fungerar / Fungerar, men långsamt just nu / Fungerar inte" –
uttryckligen för att vara begriplig för en admin utan teknisk bakgrund, enligt instruktion.

**Verifiering:** build, lint, test (10/10) och `node -c functions/index.js` gröna.
`src/version.js`/`package.json` → 5.9.0, ny post i andringslogg.

### Medvetet avvaktade (enligt instruktion)

- **Skelettladdning på fler vyer** (startsida/adminpanel/uppladdningsflöde) – lågt
  prioriterad av användaren, sparas till en framtida fas. Redan klart: de fem mest besökta
  listvyerna (Fas 15).
- **Offline-stöd via IndexedDB** – uttryckligen hög prioritet för FRAMTIDEN, men medvetet
  inte påbörjad i denna fas. Se FRAMTIDSPLAN.md för föreslaget avgränsat första steg
  (nedladdningsknapp + läs-only-cache, ingen offline-sök eller bakgrundssynk).

## Fas 17 – Slutför ägare + klinikstöd-arbetet (5.10.0)

Uppföljning enligt prioritetsordning A1–A3 från föregående diskussion: fullfölj det som redan
var påbörjat innan nya lösa trådar läggs till.

**Ägare kopplat till granskningspåminnelser**

`useNotiser.js`s `granskningsposter`-filter tar nu hänsyn till `rutin.agare`: om satt till en
roll visas påminnelsen bara för den rollen (inte alla redaktörer för området); om satt till en
specifik person visas den bara för den personen, oavsett roll (även om personen saknar
redigeringsbehörighet för området – i linje med hur fältet designades i Fas 16). Utan `agare`
gäller det gamla beteendet oförändrat. `MinaUppgifter.jsx` fick en ny rad: "X rutin(er) du
ansvarar för behöver granskas snart", beräknad separat från den befintliga
områdesbehörighets-baserade raden.

**Klinikstöd-data synliggjord**

Ny `useKlinikfrageStatistik.js`-hook läser `klinikfragefeedback` och `klinikfrageloggar`
(båda redan superadmin-only enligt reglerna, skapades i Fas 15/14 men visades ingenstans).
Ny adminsektion "💬 Klinikstöd – hur används det?": andel positiva hjälpsamhets-svar, samt de
10 vanligaste frågorna (grupperade från den anonyma loggen) med en "Kopiera"-knapp per fråga
(för att t.ex. klistra in som titel när en ny rutin skapas från en återkommande fråga).

**Automatisk daglig klinikstöd-verifiering**

Ny schemalagd funktion `verifieraKlinikstodSchemalagt` (`onSchedule`, `firebase-functions/v2/
scheduler`, dagligen 06:00 Europe/Stockholm) kör samma kontroll som den manuella
"Verifiera klinikstöd-sökningen"-knappen (Fas 16), men skriver bara något om ett problem
faktiskt hittas – inget brus vid normal drift. Ny `systemvarningar`-collection
(superadmin-only läsning, server-only skrivning) och en ny källa i `useNotiser.js` som visar
en sådan varning i notisklockan för superadmin, med länk till `/admin`.

**Obs (infrastruktur):** schemalagda Cloud Functions kräver att Cloud Scheduler-API:et är
aktiverat i Google Cloud-projektet. Om det inte redan är på (t.ex. om det här är första
schemalagda funktionen i projektet) kan `firebase deploy` behöva köras en gång till, eller
API:et aktiveras manuellt i Google Cloud Console, innan schemat börjar köras.

**Verifiering:** build, lint, test (10/10) och `node -c functions/index.js` gröna.
`src/version.js`/`package.json` → 5.10.0, ny post i andringslogg.

## Fas 18 – Etapp 1: multi-tenant-grunden (organisationsmodellen)

Genomförande av ETAPP1-ARBETSUPPGIFTER.md i sin helhet (block 1a–1e), efter att MODULPLAN.md
och ETAPPLAN.md tagits fram. Detta är den enskilt största enskilda ändringen i projektets
historia – nästan varje collection, varje regel och flera Cloud Functions berörs.

**Förenkling mot ursprungsskissen (medvetet avsteg, motiverat):** planen skissade en separat
`organisationer/{orgId}/medlemmar/{uid}`-subcollection för roll+org-medlemskap. Vid
implementation valdes istället att lägga `organisationId` direkt som ett fält på befintliga
`users/{uid}` (bredvid det redan existerande `role`-fältet). Motivering: en användare tillhör
bara EN organisation i den här produkten (ingen multi-org-medlemskap-funktion planerad), så en
separat subcollection hade bara inneburit extra migreringsyta och extra `get()`-anrop utan
motsvarande nytta – YAGNI. `organisationer/{orgId}` finns kvar som egen collection för
organisationens EGNA inställningar (namn, moduler, status).

**1a – Datamodell:** `src/firebase/organisation.js` exporterar `STANDARD_ORG = "default"`,
identisk sträng återanvänd i klient (`AuthContext.jsx`, alla hooks) och server
(`functions/index.js`). `AuthContext` läser/exponerar `organisationId` (med fallback till
STANDARD_ORG för konton från innan denna fas) parallellt med `role`, från samma
Firestore-läsning.

**1b – Migrering:** ny callable `migreraTillOrganisation` (superadmin-only, `dryRun`-parameter,
standard `true`). Loopar över 15 collections, sätter `organisationId` på dokument som saknar
det, i batchar om 500. Idempotent (kollar `!doc.data().organisationId` innan skrivning).
Exponerad i adminpanelen under en ny sektion "🏢 Organisation (Etapp 1-migrering)" med en
förhandsgranskningsknapp och en skarp körning (med `confirm()`-spärr). Samtliga create-flöden
i klienten (alla CRUD-hooks) och i Cloud Functions sätter nu `organisationId` på nya dokument
framåt, så migreringsluckan aldrig växer efter driftsättning.

**1c – Regelomskrivning:** `firestore.rules` skrevs om i grunden. Ny `minAnvandare()`-funktion
(ett enda `get()`, cachat av Firestore inom samma utvärdering) ger både `minRoll()` och den nya
`minOrganisation()` – med fallback till `'default'` så att ett konto/dokument utan
`organisationId` (innan migreringen körts) aldrig plötsligt nekas åtkomst. Ny
`matcharMinOrg(orgId)`-hjälpfunktion används i VARJE match-block som håller kunddata (14 av 17
collections – `anteckningar` är redan fullt isolerad per uid oavsett org och behövde ingen
ändring, `klinikfragecache`/`hastighetsgranser` är redan `if false` server-only,
`systemvarningar` lämnades medvetet global eftersom den gäller delad AI-infrastruktur, inte
kunddata). Kritisk insikt under arbetet: rena rollkontroller (`arSuperadmin()` m.fl.) är
MEDVETET org-agnostiska – varje ställe de används för att skydda ett dokument måste ANDA ihop
med ett `matcharMinOrg(...)`-anrop, annars skulle en superadmin i organisation A kunna
läsa/ändra organisation B:s data. `storage.rules` fick en dokumenterad, medvetet kvarlämnad
lucka (se filen) – att organisationsskopa lagringssökvägarna kräver en path-omstrukturering
som skjuts till en senare fas.

**Verifiering som faktiskt kördes (inte bara skriven och lämnad):** Firestore-emulatorn gick
att starta lokalt (`npx firebase-tools emulators:exec`), vilket gjorde det möjligt att skriva
och KÖRA en riktig testsvit (`tests/rules/organisationsisolering.test.mjs`,
`@firebase/rules-unit-testing`) mot de nya reglerna – inte bara skriva testerna utan att kunna
exekvera dem, vilket var den ursprungliga planens antagande om vad som INTE skulle gå att
göra i den här miljön. 17 tester, alla gröna (`npm run test:rules`): bevisar att en
superadmin i organisation B varken kan läsa, uppdatera, ta bort eller förfalska ägarskap
(skapa med ett annat orgId) av organisation A:s rutiner/anslag/kontakter/förrådsartiklar/
användare, samtidigt som befintliga rollbaserade begränsningar (t.ex. att "vol" inte får
redigera administration-rutiner) fortfarande gäller inom en organisation. Detta uppfyller
"hårda stoppet" som sattes i ETAPP1-ARBETSUPPGIFTER.md 1c.5.

**1d – Per-org AI-budget:** `installningar/geminiBudget` och `installningar/utloggning`
flyttade till `organisationer/{orgId}/installningar/{...}`. `reserveraBudget(uid)` blev
`reserveraBudget(orgId, uid)`. `useGeminiBudget.js`/`useUtloggningsinstallning.js`
uppdaterade. Gamla toppnivå-`installningar`-collectionen är nu oanvänd (ingen kod refererar
den längre) – lämnad orörd i Firestore (ofarlig, ingen kod läser den), inte aktivt raderad.

**1e – Org-medvetna Cloud Functions:** samtliga nio functions uppdaterade. Två specifika
säkerhetsfynd under genomgången, båda åtgärdade:
- `fragaKlinisktStod`s cache-nyckel inkluderar nu `organisationId` – annars hade en
  organisations cachade klinikstöd-svar kunnat serveras till en annan.
- `skapaKommentar`s @omnämnande-uppslag (`db.collection("users").get()`) begränsades till
  `where("organisationId","==",organisationId)` – innan denna fix kunde en kommentar i teorin
  @nämna (och trigga en notis till) en användare i en helt annan organisation.
- `tvingaUtloggning` kräver nu att målanvändaren tillhör samma organisation som anroparen.

**Klienthookar:** samtliga 16 hooks som frågar Firestore-collections fick
`where("organisationId","==",organisationId)` tillagt (härlett via `useAuth()` i varje hook),
och alla create-anrop sätter fältet. `loggaHandelse()` (fristående funktion, ingen hook) fick
en ny `organisationId`-parameter som tolv anropsställen uppdaterades att skicka in.
`registreraVisning()`s dokument-nyckel fick organisationId inbakat för att förhindra
kollisioner mellan organisationers "mest använda"-räknare.

**Nya composite-index:** 15 poster tillagda i `firestore.indexes.json` (en per collection som
kombinerar en `organisationId`-likhetsfilter med ytterligare filter/sortering).

**Verifiering:** `npm run build`, `npm run lint`, `npm run test` (10/10) och `node -c
functions/index.js` gröna. `npm run test:rules` (ny, kräver Firestore-emulatorn – separat
kommando, inte del av CI ännu eftersom `.github/workflows/ci.yml` inte har Java/emulatorn
installerad) – ursprungligen 17/17 gröna, senare utökad (se nedan) till 34/34.

**Kompletterande verifiering (samma dag, efter en självkritisk genomgång av vad som
faktiskt var bevisat):**
- `tests/rules/organisationsisolering.test.mjs` utökades från 5 till samtliga 14
  organisationsskopade collections (lade till `kommentarer`, `feedback`,
  `klinikfragefeedback`, `klinikfrageloggar`, `sokloggar`, `auditlogg`, `visningar`,
  `skiftrapporter`, `lankbibliotek`) – **34/34 gröna**. Tidigare täckte testerna bara 5 av 14
  collections; regelmönstret var identiskt men obevisat för de övriga nio.
- Ny testsvit `tests/functions/migrering.test.cjs` (`npm run test:functions`) kör
  **`migreraTillOrganisation`s faktiska affärslogik** mot Firestore-emulatorn – anropar den
  exporterade funktionens `.run()` direkt (samma mekanism firebase-functions v2 själv
  exponerar) istället för att bara läsa koden. 14/14 gröna: behörighetsspärren
  (unauthenticated/permission-denied), att dry-run räknar rätt UTAN att skriva något, att en
  skarp körning faktiskt sätter `organisationId` och skapar `organisationer/default` med
  förväntade fält, att redan migrerad data lämnas orörd, och att en andra körning är en sann
  no-op (idempotens). Detta var tidigare bara kodgranskat, aldrig körkontrollerat.
- `functions/node_modules` installerades (fanns inte sedan tidigare i denna miljö) för att
  `test:functions` skulle kunna requira `firebase-admin`/`@google/generative-ai`.
- `vite.config.js` fick `tests/functions/**` tillagt i `test.exclude` av samma skäl som
  `tests/rules/**` sedan tidigare (vitest plockade annars upp filen och kraschade).

**UI-verifiering mot emulatorerna (samma dag, sista steget):** appen kördes faktiskt i en
riktig browser (Chromium, styrd via Playwright) mot Auth+Firestore+Functions-emulatorerna,
inloggad som en riktig användare i två seedade testorganisationer. Detta krävde att koppla in
`connectAuthEmulator`/`connectFirestoreEmulator`/`connectFunctionsEmulator`, gated bakom en ny
`VITE_USE_EMULATOR`-flagga (av som standard, satt via en icke-committad `.env.local`) i
`src/firebase/config.js` och `src/firebase/functions.js`, plus en `emulators`-sektion i
`firebase.json`. 8/8 kontroller gröna: inloggning, att org A:s superadmin ser sin egen
organisations rutin men inte org B:s (och tvärtom för org B), att adminpanelens
migreringsknapp faktiskt fungerar i UI:t, och att inga oväntade permission-denied-fel dyker
upp i webbläsarkonsolen under ett normalt flöde.

Den sista kontrollen fångade en **verklig, tidigare okänd bugg** (inte en Etapp 1-regression –
`anteckningar`-reglerna var explicit oförändrade): `usePrivatAnteckning.js` lyssnar på en
anteckning INNAN användaren någonsin skrivit en, dvs. dokumentet finns ännu inte. Den gamla
regeln `resource.data.uid == request.auth.uid` refererar `.uid` på `resource.data`, som är
`null` för ett dokument som inte finns – det gav ett rules-evaluationsfel (permission-denied)
istället för en tom, giltig läsning, vilket i praktiken innebar att den privata
anteckningsrutan aldrig blev redo att skriva i förrän efter en omladdning. Fixat genom att
istället kontrollera dokument-id:ts prefix (`dokId.split('_')[0] == request.auth.uid`), som
fungerar oavsett om dokumentet finns eller ej. Ny rules-testcase lagd till som bevisar båda
fallen (36/36 gröna efter tillägget). Detta hade INTE upptäckts av rules- eller
functions-testerna – de testar aldrig en riktig `onSnapshot`-lyssnare mot ett dokument som
saknas, bara direkta `get()`/`set()`-anrop mot kända dokument-id:n.

### Produktionsdeploy och migrering (2026-07-25)

Deployad till `synappsen-final-build` via `.github/workflows/deploy.yml`. Två tidigare
okända, driftsblockerande brister i tjänstekontots (`github-deploy@synappsen-final-build
.iam.gserviceaccount.com`) IAM-rättigheter upptäcktes och åtgärdades under arbetet (av
kontots ägare, i Cloud Console – inget jag kunde göra själv):

- Saknade `roles/serviceusage.serviceUsageAdmin` → `firebase deploy` kunde inte aktivera
  `cloudscheduler.googleapis.com`, vilket fick HELA deploy-kommandot att avbryta sig självt
  innan något över huvud taget hann släppas (deploy.yml:s `continue-on-error: true` på
  deploy-steget maskerade detta som "success" på jobbnivå – en riktig fälla, loggen var enda
  sättet att se den faktiska statusen).
- Efter den fixen kom deployen förbi, och släppte regler/index/8 av 9 functions – men
  kraschade återigen på den SISTA function (`verifieraKlinikstodSchemalagt`, saknade det mer
  specifika `roles/cloudscheduler.jobs.update`/`roles/cloudscheduler.admin`) precis innan
  hosting-releasen. Eftersom Firebase CLI bara finaliserar/släpper hosting som sista steg i
  en lyckad körning innebar detta ett par minuter där de NYA organisationsskopade
  Firestore-reglerna var live men den GAMLA frontend-byggen (utan organisationId-filter i
  sina queries) fortfarande var det som faktiskt kördes för besökare – en verklig risk för
  permission-denied-fel i skarp drift. Åtgärdat akut med en tillfällig `--only hosting`-körning
  (reverterad igen efter bekräftad korrekt hosting-version) för att snabbt återskapa
  konsistens, i väntan på att den sista IAM-rollen lades till och en fullständig deploy kunde
  köras rent.
- Tredje körningen, efter att `roles/cloudscheduler.admin` lagts till, gick igenom helt utan
  fel (`Deploy complete!`, alla 9 functions, hosting, regler och index).

Migreringen kördes därefter skarpt av superadmin i adminpanelen: 466 dokument (1 användare,
463 förrådsartiklar, 2 sökloggar) fick `organisationId: "default"`. Produktionen är nu fullt
konsistent på den nya datamodellen.

### Kvarstående efter Etapp 1 (medvetet avgränsat, dokumenterat)

- Storage-reglerna för `rutiner`/`forradsartiklar` är inte organisationsskopade än (se
  kommentar i `storage.rules`).
- CI (`ci.yml`) kör inte `test:rules`/`test:functions` automatiskt ännu – kräver Java +
  Firestore-emulatorn i GitHub Actions-miljön, en separat uppgift.
- `deploy.yml`s deploy-steg har fortfarande `continue-on-error: true`, vilket maskerar
  faktiska deploy-fel som "success" på jobbnivå (upptäckt och kringgått manuellt denna gång,
  men bör städas bort eller ersättas med explicit loggranskning i en senare uppgift).
- Ingen egen signup-flow för att välja/skapa en ny organisation – nya konton går fortfarande
  automatiskt till `STANDARD_ORG`. Det är en senare etapp (Etapp 4/5 i ETAPPLAN.md).

**Version:** `src/version.js`/`package.json` → se nästa post i andringslogg.

---

## Fas 19 – Etapp 2: feature-gating (moduler), gata AI-import

**Mål (ETAPPLAN.md):** kunder ska kunna ha olika moduler påslagna, kontrollerat i tre lager
(UI/klient/server), med AI-import som referens-implementation.

**Ny feature-registry:** `src/config/features.js` – `FEATURE`-konstanter (åtta funktioner
över Operations/Intelligence, sammanställda i MODULPLAN.md) och `PACKAGE_FEATURES` som mappar
modul → vilka features den ger. `aktivaFeatures(moduler)` härleder en `Set` av påslagna
features från organisationens `moduler`-fält (`{operations: bool, intelligence: bool}`).

**`src/hooks/useFeatures.js`:** lyssnar i realtid på `organisationer/{orgId}` (redan läsbart
för alla medlemmar sedan Etapp 1:s regler) och ger `{ laddat, moduler, hasFeature(feature) }`.

**UI-gating (referens: AI-import):** `src/pages/LaddaUpp.jsx` visar en neutral förklaring
("AI-import kräver Intelligence-modulen... Kontakta en superadmin") istället för
uppladdningsflödet när `hasFeature(FEATURE.AI_IMPORT)` är falskt – knappen till sidan på
startsidan döljs INTE (medvetet, enligt MODULPLAN.md: en kund ska förstå VARFÖR något saknas,
inte bara se en tyst borttagen funktion).

**Serverkontroll (den faktiska spärren):** ny helper `kravModul(organisationId, modul,
felmeddelande)` i `functions/index.js`, körs i både `tolkaForradsbild` och `tolkaDokument`
**innan** budgetreservation och innan Storage/Gemini nås. "Fail closed": om en organisation
helt saknar `moduler`-fältet nekas anropet (kastar `failed-precondition`) istället för att
tillåtas – annars hade ett bortglömt/oskrivet fält av misstag gett full åtkomst. Standard­
organisationens `moduler.intelligence` sattes till `true` vid Etapp 1:s migrering, så detta
ändrar inget för befintlig drift förrän en superadmin faktiskt stänger av modulen.

**Adminpanel:** ny sektion "🧩 Moduler" (superadmin) i `Admin.jsx` med kryssrutor för
Operations/Intelligence, skriver direkt till `organisationer/{orgId}.moduler.<namn>` (klienten
har redan skrivrätt dit sedan Etapp 1 – ingen ny regel behövdes).

**Verifiering:** ny testsvit `tests/functions/modulgating.test.cjs` (del av
`npm run test:functions`, tillsammans med migreringstestet) – 5 gröna:
- `kravModul` nekar när modulen är av, nekar (fail closed) när `moduler`-fältet helt saknas,
  och tillåter när modulen är på.
- `tolkaForradsbild`/`tolkaDokument` nekar med `failed-precondition` vid ett direktanrop mot
  den exporterade funktionen (kringgår UI:t helt), INNAN något Storage-/Gemini-anrop görs –
  exakt det ETAPPLAN.md:s "klart när"-kriterium efterfrågar ("kan inte utlösa ett enda
  Gemini-anrop ens via ett manipulerat direktanrop"). `kravModul` exporteras enbart för detta
  test, för att undvika ett långsamt/instabilt test som annars hade behövt låta anropet nå
  riktig Storage/Gemini för att bevisa att det INTE stoppades av modulkontrollen.
- `npm run test:rules` (36/36), `npm run lint`, `npm run build`, `npx vitest run` (10/10) och
  `node -c functions/index.js` gröna.

### Kvarstående efter Etapp 2 (medvetet avgränsat)

- Endast AI-import är faktiskt gatad – klinikstöd (`fragaKlinisktStod`, också en
  Intelligence-funktion) är INTE gatad ännu. Nästa modul att gata är ett eget, litet
  uppföljningsarbete.
- Operations-funktionerna i `PACKAGE_FEATURES.operations` är till största delen inte byggda
  än (offline-center m.fl. – se Etapp 3 i ETAPPLAN.md), så gating av dem väntar naturligt.
- Ingen UI-gating av navigationslänkar/kort baserat på moduler ännu utöver `LaddaUpp.jsx`
  själv – "Ladda upp dokument"-kortet på startsidan visas alltid (medvetet, se ovan).

**Version:** 5.12.0.

---

## Fas 20 – Etapp 3 (3a–3d): offline-center, veckobackup, hälsohistorik, 2FA-policy

**Mål (ETAPPLAN.md):** bygga färdigt de delar av Operations-paketet som saknades. 3e
(kiosk-/delad-enhetsläge) hoppades medvetet över – ingen pilot har efterfrågat det, precis
som planen själv förutsätter.

**3a – Offline-center:** appen hade redan Firestores egen persistenta lokala cache
(`persistentLocalCache` i `src/firebase/config.js`, från tidigare arbete) – varje rutin en
användare besökt fanns redan sparad lokalt. Det som saknades var att MEDVETET hämta hem ALLA
godkända rutiner i förväg. Ny `src/hooks/useOfflineCenter.js` + `src/pages/OfflineCenter.jsx`
(ny route `/offline-center`, nytt kort på startsidan) kör en engångs-`getDocs()` över alla
godkända rutiner (org-skopat, inget nytt index behövs – två likhetsfilter). Visar senaste
nedladdningstid (lagrad i `localStorage`, per enhet) och antal. Nätverksbanner
(`OfflineIndikator.jsx`) fanns redan sedan tidigare och uppfyllde redan "visar sparad
kopia"-kravet – ingen ändring behövdes där. Gatad bakom `FEATURE.OFFLINE_CENTER` (Operations),
samma mönster som AI-import i Etapp 2. Medvetet avgränsat enligt planen: ingen offline-sök,
ingen bakgrundssynk, inga bilagor.

**3b – Veckovis Firestore-backup:** ny schemalagd funktion `veckovisBackupSchemalagt`
(måndagar 03:00) i `functions/index.js`. Loopar över `organisationer`, hoppar över de som
inte har Operations påslagen, och skriver en json-fil per organisation
(`backups/{orgId}/{datum}.json`) med `rutiner`, `anslag`, `kontakter`, `lankbibliotek`,
`forradsartiklar`, `skiftrapporter`, `kommentarer` – org-skopat. `storage.rules` fick ett
explicit `allow read, write: if false` för `backups/{orgId}/{filnamn}` (var redan implicit
nekad, men skrivs ut för tydlighet). `firebase.json` fick en `storage`-emulator (port 9199)
så testerna kan verifiera en riktig fil-skrivning/läsning, inte bara mocka anropet.

**3c – Sparad hälsokontroll-historik:** ny collection `halsokontrollhistorik` (delad
infrastruktur, medvetet INTE organisationsskopad – samma resonemang som `systemvarningar`).
`testaBeroenden` sparar nu sitt fullständiga resultat vid varje körning; den redan befintliga
dagliga `verifieraKlinikstodSchemalagt` sparar nu ETT resultat per dag (inte bara vid problem
som tidigare) så adminpanelens nya historik-lista visar en obruten trend. Ny
`src/hooks/useHalsokontrollhistorik.js` + en lista i `Admin.jsx` under "Testa
anslutningar"-sektionen.

**3d – 2FA-policy:** ny `organisationer/{orgId}.sakerhet.kravMfaForRoller`-array, redigerbar
av superadmin i en ny "🔐 Säkerhet"-sektion i adminpanelen (kryssrutor per redaktörsroll).
Klientlagret (`src/hooks/useMfaPolicy.js` + `MfaPolicyBanner.jsx`) visar en påminnelse-banner
(döljs på `/profil` så man faktiskt kan aktivera 2FA där, TOTP-flödet fanns redan sedan
tidigare i `TvaFaktorSektion.jsx`). Den verkliga spärren sitter i `firestore.rules`: Firebase
Auth lägger automatiskt till `firebase.sign_in_second_factor` i ID-token när en session
faktiskt använde en TOTP-faktor – detta kunde läsas direkt i regelspråket
(`request.auth.token.get('firebase', {}).get('sign_in_second_factor', null)`), så **ingen
egen custom claim eller Identity Platform-blocking-function behövdes**. Ny
`mfaKravUppfylld()`-regelhjälpare tillämpad på de två känsligaste superadmin-skrivningarna:
rolländringar (`users/{userId}` update) och organisationsinställningar
(`organisationer/{orgId}` write) – medvetet INTE alla skrivningar i hela appen, för att hålla
blast radius litet och begripligt i denna v1.

**Fel hittat och fixat under arbetet:** första versionen av `kravMfaForRoll()` läste
`get(...organisationer/{orgId}).data.get('sakerhet', {})` utan att kontrollera att
organisationsdokumentet faktiskt finns – exakt samma klass av bugg som `anteckningar`-fixen i
Fas 18 (Etapp 1): `.data` på ett obefintligt dokument är `null`, och `.get()` på `null`
kraschar regelutvärderingen. Upptäcktes direkt av `npm run test:rules` (en befintlig
"superadminA ändrar roll"-testcase gick från grön till röd), fixat med ett `exists()`-vakt
innan `get()`.

**Verifiering:**
- `npm run test:rules` – 41/41 gröna (36 tidigare + 5 nya 2FA-policytester, inklusive en
  bakåtkompatibilitetstest som bevisar att organisationer UTAN policyn är helt opåverkade).
- `npm run test:functions` – 21/21 gröna (14 migrering + 5 modulgating + 2 nya backuptester,
  det senare mot en riktig Storage-emulator som bevisar att den skrivna filen faktiskt går
  att läsa tillbaka och bara innehåller rätt organisations data).
- `npm run lint`, `npm run build`, `npx vitest run` (10/10) och `node -c functions/index.js`
  gröna.

### Kvarstående efter Etapp 3 (medvetet avgränsat)

- 2FA-policyns servergating täcker bara de två känsligaste superadmin-skrivningarna, inte
  alla skrivningar en gated roll gör – en medveten v1-avgränsning, inte en lucka som glömdes.
- Ingen rules-emulator-test för att `backups/`-sökvägen i Storage faktiskt nekar klienter
  (verifierat genom kodgranskning/resonemang – implicit deny genom att ingen `allow`-regel
  matchar – men inte körtestat som storage.rules övriga sökvägar).
- 3e (kiosk-/delad-enhetsläge) inte byggt – väntar på pilotefterfrågan enligt planen.

**Version:** 5.13.0.

---

## Fas 21 – Etapp 4 (delvis): säkerhetsgenomgång, prestanda/index-granskning, pilot-mätvärden

**Mål (ETAPPLAN.md):** bevisa nyttan hos en riktig kund och härda produkten. Klargjort med
användaren först: själva piloten och "verklig användningsdata över en mätperiod" kräver en
riktig kund och att tid går – inget som kan byggas i kod. Fokus lades istället på de tre
tekniska delmålen som faktiskt är kod jag kan skriva/granska nu.

**Säkerhetsgenomgång av multi-tenant-lagret** (metod: samma som Fas 11 – manuell
genomläsning av `firestore.rules`/`storage.rules` i sin helhet, grep efter riskabla mönster,
genomgång av samtliga Cloud Functions och klienthooks som frågar org-skopade collections):

- **Fynd, åtgärdat:** `storage.rules`s sedan Etapp 1 dokumenterade, medvetet avgränsade lucka
  – `rutiner/{omrade}/{rutinId}/{filnamn}` och `forradsartiklar/{forradSlug}/{artikelId}/
  {filnamn}` var inte organisationsskopade. Löst med en Firestore-uppslagning
  (`dokumentOrganisation()`, samma cross-service-mekanism `firestore.get()`/`firestore.exists()`
  som `minRoll()` redan använde för rollkontroll) istället för att bygga om storage-pathen.
  `exists()`-vakt mot `.data` på ett obefintligt dokument (samma buggklass som fixades två
  gånger tidigare, Fas 18/20) – i praktiken finns Firestore-dokumentet alltid redan när en
  bild laddas upp (klienten skapar rutinen/artikeln FÖRST, se `Sektionssida.jsx`/
  `ForradVy.jsx`), men annars nekas det istället för att av misstag släppas igenom.
  Verifierat med en ny Storage-rules-emulator-testsvit (`tests/rules/storage.test.mjs`,
  `npm run test:storage`, ny Storage-emulator i `firebase.json`) – 6/6 gröna, inklusive att
  en organisation B inte kan läsa/skriva en organisation A-bild, och att en obefintlig
  rutinId nekas ("fail closed").
- **Granskat, inga fynd:** samtliga 14 organisationsskopade collections rules-lager,
  samtliga klienthooks (`collection(db, ...)`-anrop) för saknad `organisationId`-filtrering,
  samtliga Cloud Functions för saknad org-derivering, `mfaKravUppfylld()`/`kravMfaForRoll()`s
  självlåsnings-resonemang (en superadmin som stänger av sin egen 2FA-policy utan att ha 2FA
  aktiverat kan alltid ändå aktivera 2FA via `/profil`, som inte går via denna regel).

**Prestanda-/bundle-genomgång:**
- Samtliga 15 composite-index i `firestore.indexes.json` matchade en verklig klientfråga –
  inga överflödiga, inga saknade (Etapp 2–4:s nya frågor behövde inga nya index: antingen
  bara likhetsfilter utan `orderBy`, eller enkelfältsindex som redan skapas automatiskt).
- Bundlestorlek dokumenterad: `firebase-vendor` (~678 kB obyggd / ~200 kB gzip) är och
  förblir den dominerande kostnaden – redan i sin egen chunk sedan tidigare, en följd av att
  använda hela den modulära Firebase-SDK:n (Auth+Firestore+Storage+Functions+persistent
  cache), inte något Etapp 1–4 introducerat. Huvudbunten (`index-*.js`) växte måttligt
  (~9 kB gzip) över hela Etapp 1–4-arbetet, rimligt givet mängden ny funktionalitet.
  Sidspecifika chunkar (t.ex. `Profil` som drar in `qrcode` för TOTP-QR-koder) är redan
  korrekt lazy-loadade och ligger inte i huvudbunten.

**Pilot-mätvärden i adminpanelen:** ny sektion "📈 Pilot-mätvärden".
- **Andel nollträffar** – upptäckte under arbetet att detta INTE gick att räkna ut korrekt
  tidigare: `sokloggar` begränsas till de 50 senaste nollträffarna (ingen nämnare för totalt
  antal sökningar). Ny `soksstatistik/{orgId}`-collection (två räknarfält, `increment()`)
  löser detta – `src/hooks/useSokstatistik.js`, ökas i `SokFalt.jsx` vid varje avslutad
  sökning (≥3 tecken, samma 800ms-debounce som den befintliga nollträff-loggningen).
  Firestore-regel skräddarsydd: alla inloggade i organisationen får öka ENDAST de två
  räknarfälten (`hasOnly`), bara superadmin läser dem. Verifierat med 5 nya rules-tester.
- **Kvitteringsgrad** och **upplevd nytta (klinikstöd)** – beräknas från redan befintlig,
  redan laddad data (`lasteAv` på rutiner, `klinikfrageStatistik`), ingen ny instrumentering
  behövdes.
- **Tid-att-hitta** – medvetet INTE byggt. Skulle kräva sessionsnivå-tidmätning (tidpunkt när
  en sökning påbörjas → tidpunkt för klick på ett resultat) som inte fanns någonstans i
  kodbasen och som är en meningsfull egen avgränsad uppgift, inte något att klämma in i
  befintlig kod under tidspress. Dokumenterat tydligt i adminpanelen som "inte
  instrumenterat ännu" istället för att fejkas fram.

**Verifiering:** `npm run test:rules` (46/46: tidigare 41 + 5 nya soksstatistik-tester),
`npm run test:functions` (21/21, oförändrat), `npm run test:storage` (ny, 6/6),
`npm run lint`, `npm run build`, `npx vitest run` (10/10) och `node -c functions/index.js`
gröna.

### Kvarstående efter Etapp 4

- Själva piloten (Core+Operations till en riktig avdelning, mätperiod, betalningsvilja för
  Operations) är inte påbörjad – kräver en riktig kund, inget tekniskt arbete återstår för
  att kunna starta en.
- "Tid-att-hitta" saknar instrumentering (se ovan).
- Ingen formell godkänd säkerhetsgenomgångs-signoff från en tredje part – denna genomgång är
  min egen, grundlig men inte en oberoende extern revision.

**Version:** 5.14.0.

---

## Fas 22 – Etapp 5 (delvis): AI-feedbackanalys per vecka, kostnadsuppföljning över tid

**Mål (ETAPPLAN.md):** börja ta betalt för AI i kontrollerad ordning. Klargjort med
användaren först (samma mönster som Etapp 4): att faktiskt lansera AI-import/klinikstöd som
betalda funktioner och få en kund att betala är ett affärsbeslut, inte kod. Fokus lades på de
två tekniska delmålen.

**Djupare AI-feedbackanalys:** ny `klinikTrendPerVecka`-beräkning i `Admin.jsx`, grupperar
redan laddad `klinikfragefeedback` (senaste 200, redan hämtad av `useKlinikfrageStatistik`
sedan tidigare) per veckostart och räknar hjälpsamhetsgrad per vecka. Ingen ny Firestore-
läsning eller regeländring behövdes – all data fanns redan, bara oanvänd för trender.

**Kostnadsuppföljning per organisation:** `useGeminiBudget`/adminpanelen visade bara
INNEVARANDE månads förbrukning – när `reserveraBudget` (functions/index.js) nollställer
budgeten vid ett månadsskifte gick föregående månads siffror förlorade för alltid. Fixat:
innan nollställningen skrivs nu en arkivpost till en ny
`organisationer/{orgId}/kostnadshistorik/{manad}`-subcollection (samma transaktion, ingen
extra Firestore-kostnad). Sker "lativt" (första AI-import-anropet i den nya månaden), inte
via ett eget schemalagt jobb – samma mönster nollställningen redan använde. Ny
Firestore-regel (superadmin läser sin egen organisations historik, skrivning endast via Cloud
Function) och ny `src/hooks/useKostnadshistorik.js`. Ny adminpanel-sektion "💰
Kostnadsuppföljning" visar kr/månad + antal användare per månad.

**Verifiering:**
- Ny testsvit `tests/functions/kostnadshistorik.test.cjs` (del av `npm run test:functions`) –
  3 gröna: ingen arkivering vid en organisations FÖRSTA användning (ingen tidigare månad att
  arkivera), korrekt arkivering av föregående månads slutsumma vid ett simulerat
  månadsskifte (seedad med en gammal `aktuellManad`), och att budgeten faktiskt nollställs
  och sätter den nya månaden efteråt. `reserveraBudget` exporterad enbart för detta test.
- 4 nya rules-tester i `tests/rules/organisationsisolering.test.mjs` (org-isolering +
  superadmin-only + read-only för kostnadshistorik).
- `npm run test:rules` (50/50), `npm run test:functions` (24/24), `npm run test:storage`
  (6/6), `npm run lint`, `npm run build`, `npx vitest run` (10/10) och
  `node -c functions/index.js` gröna.

### Kvarstående efter Etapp 5

- Själva lanseringen (prissättning, marknadsföring, att faktiskt fakturera en kund för
  Intelligence) är inte påbörjad – ett affärsbeslut, inget tekniskt arbete återstår för att
  kunna göra det (modulen är redan byggd och gated sedan Etapp 2).
- Kostnadshistoriken börjar tom – första posten skapas vid nästa månadsskifte en organisation
  faktiskt använder AI-import.

**Version:** 5.15.0.

---

## Fas 23 – Två fynd från extern kodgranskning: delad-dator-bugg och ErrorBoundary

En extern genomgång av kodbasen (v5.15.0) lämnades av användaren för kommentar. De flesta
observationerna stämde och var redan kända/medvetna avvägningar, men två var verkliga,
tidigare omärkta fynd som åtgärdades direkt:

- **`useOfflineCenter` – delad-dator-bugg.** `senasteNedladdning` lagrades i `localStorage`
  under en global nyckel (`offlineCenter_senasteNedladdning`), inte per användare. På en
  delad/kiosk-dator (vanligt på en akutmottagning) hade nästa inloggade person sett en
  FÖREGÅENDE persons nedladdningstid som sin egen. Fixat: nyckeln inkluderar nu
  `currentUser.uid` (`offlineCenter_senasteNedladdning_{uid}`).
- **Ingen `ErrorBoundary` fanns någonstans.** En krasch i en enskild sidas rendering (t.ex.
  ett Firestore-dokument i oväntat format) skulle ha tagit ner hela appen till en vit skärm.
  Ny `src/components/ErrorBoundary.jsx` (klasskomponent – React har ingen hook-motsvarighet
  för `getDerivedStateFromError`/`componentDidCatch`), inslagen runt varje routes
  `Suspense`-block i `App.jsx` (både `SkyddatLayout`, `/admin`-rutten och de oautentiserade
  `/logga-in`/`/registrera`). Verifierat MANUELLT i en riktig browser (Chromium via
  Playwright, mot emulatorerna): en tillfällig `throw` injicerad i `OfflineCenter.jsx` gav en
  synlig "Något gick fel"-vy med en "Ladda om"-knapp, och `BottomNav`/navigationen förblev
  synlig runt felet (kraschen isolerades till just den sidan) – sedan togs test-`throw`:en
  bort igen.

Övriga punkter i granskningen (dela upp `Admin.jsx`, byt `confirm()`/`alert()` mot
inline-bekräftelse, skeleton-loaders, `void _id`-mönstret) bedömdes som rimliga men lägre
prioriterade stil-/underhållbarhetsfrågor, inte buggar – lämnade orörda denna gång.
Granskningen missade multi-tenant-säkerhetslagret helt (där de historiskt faktiska
buggarna funnits, se Fas 11/18/20/21).

**Verifiering:** `npm run lint`, `npm run build`, `npx vitest run` (10/10),
`npm run test:rules` (50/50), `npm run test:functions` (24/24), `npm run test:storage`
(6/6) gröna – ingen av dessa svit rörs av ändringarna, men kördes om för säkerhets skull.

**Version:** 5.15.1.

---

## Fas 24 – Ny etappplan (ETAPPLAN2.md) och start på Etapp 6–8, 10

Efter Etapp 1–5 gjordes en fristående genomgång av hela kodbasen på användarens begäran,
resulterande i `ETAPPLAN2.md` (Etapp 6–11). Huvudslutsatsen: multi-tenant-isoleringen är
byggd och bevisad, men det finns ingen väg till kund nummer två (registrering hårdkodar
`organisationId: "default"`), gatingen av Intelligence-funktioner var ofullständig, och
Node 20 avvecklas 2026-10-30. Användaren valde att påbörja Etapp 6, 7, 8 samt 10b–10e.
Denna fas täcker det som hanns med i den första omgången: **Etapp 7 (fyra delmål, alla
klara), Etapp 8a och 8b.**

- **Etapp 8a – Node 20 → Node 22.** `firebase.json`:s `functions.runtime` var fortfarande
  hårdkodat till `"nodejs20"` trots att `functions/package.json`:s `engines`-fält redan sa
  22 (den faktiska deployade runtimen styrs av `firebase.json`, inte `engines`). Rättat till
  `"nodejs22"`. `firebase-functions` uppgraderad `^7.2.5` → `^7.3.0` (senaste stabila –
  `firebase-admin` lämnad på `^13.10.0` eftersom 7.x kräver `firebase-admin` ^11–13 som
  peer-beroende; en bump till firebase-admin 14 gav en olöst peer-konflikt). Alla 24 (nu 32,
  se nedan) functions-tester kördes om grönt mot den nya konfigurationen.
- **Etapp 8b – `deploy.yml`.** Tog bort `continue-on-error: true` på "Deploya till
  Firebase"-steget, som gjort att ett faktiskt `firebase deploy`-fel visats som jobb-nivå
  "success" – ett problem som gett upprepat extraarbete under Etapp 1–5 (varje deploy var
  tvungen att verifieras genom att läsa rå loggtext, inte lita på jobbstatus). Höjde även
  `node-version` i både `deploy.yml` och `ci.yml` till 22, i linje med 8a.
- **Etapp 7a – Gata `fragaKlinisktStod`.** Den enskilt viktigaste kostnadsläckan från
  genomgången: `fragaKlinisktStod` är en Intelligence-funktion enligt `features.js`
  (`FEATURE.CLINICAL_SUPPORT`) men saknade helt serverkontroll – en Core-kund kunde anropa
  den obegränsat och förbruka både Gemini- och sökmotor-kvot på leverantörens bekostnad.
  Lade till `kravModul(organisationId, "intelligence", …)` direkt efter organisations-
  uppslaget, före frågelogg/cache/sökmotor-anrop. La samtidigt till UI-gating i
  `KlinikfragaSok.jsx` (samma mönster som `LaddaUpp.jsx` för AI-import) – tidigare visades
  sökrutan för alla oavsett modul. Nytt test i `modulgating.test.cjs`.
- **Etapp 7b – Servergating av Operations.** Genomgången av samtliga `PACKAGE_FEATURES.
  operations`-nycklar visade: `EXPORT_BACKUP` var redan korrekt gated (den schemalagda
  veckobackupen hoppar redan över organisationer utan modulen), `OFFLINE_CENTER` är
  medvetet bara UI-gated (läs-only, ingen extra kostnad/risk utöver vad användaren redan
  får läsa), `KIOSK_MODE` är inte byggt alls (inget att gata), men `OWNER_REMINDERS`
  (ägarpåminnelser om rutingranskning i `useNotiser.js`) hade INGEN gating alls – varje
  organisation, oavsett modul, fick den funktionen "gratis". Fixat med `hasFeature
  (FEATURE.OWNER_REMINDERS)` runt `granskningsposter`. `HEALTH_HISTORY` lämnades medvetet
  ogated: `testaBeroenden` är explicit dokumenterad i koden som delad infrastruktur (Gemini/
  sökmotor/Storage-hälsa för hela installationen, inte kunddata) – att gata den per
  organisation skulle motsäga den designen. Den hör snarare hemma som en leverantörsadmin-
  vy (Etapp 6a) i en framtida omarbetning, inte en kundmodul.
- **Etapp 7c – Gating-matris som test.** Ny `tests/functions/gatingmatris.test.cjs`: en
  datadriven tabell (funktion × modul × förväntat utfall) PLUS ett statiskt käll-check som
  läser `functions/index.js` som text, hittar varje `exports.X = onCall(...)` vars kropp
  anropar `kravModul(...)`, och FALLERAR om den funktionen saknas i testets egen tabell.
  Detta var precis den typ av lucka som gjorde att `fragaKlinisktStod` glömdes bort vid
  Etapp 2 (bara `tolkaForradsbild`/`tolkaDokument` fick gating då) – nu kan en framtida ny
  Intelligence-funktion inte läggas till utan att antingen gatas eller få testet att
  fallera.
- **Etapp 7d – Kvotskydd utöver kronbudgeten.** `reserveraBudget` hade redan ett tak per
  användare i kronor (`MAX_PER_ANVANDARE_ORE`), men det tillåter ändå ~100 anrop/månad per
  person – och sökmotorn (Custom Search) delar en gemensam kvot på bara 100 GRATIS
  sökningar/DAG för HELA installationen (alla kunder). En enskild klient i en snabb
  återförsöksloop hade på några sekunder kunnat förbruka hela dagens delade sökkvot för
  samtliga kunder, långt innan kronbudgeten ens märkte något. Ny
  `MAX_KLINIKSTOD_FRAGOR_PER_TIMME` (20/timme, rullande fönster) via den redan befintliga
  `kontrolleraOchOkaHastighet`-hjälpfunktionen (tidigare bara använd av
  `skapaKommentar`/`skickaFeedback`), nu även exporterad för test. Nytt
  `tests/functions/klinikstodratelimit.test.cjs`.

**Verifiering:** `npm run lint`, `npm run build` gröna. `npm run test:functions` nu **32/32**
gröna (14 migrering + 6 modulgating + 4 gatingmatris + 3 klinikstodratelimit + 2 backup +
3 kostnadshistorik). `npm run test:rules` 50/50, `npm run test:storage` 6/6, `npx vitest
run` 10/10 – alla omkörda och gröna, opåverkade av ändringarna.

**Kvarstående i denna omgång (fortsätter i efterföljande commits):** Etapp 6 (leverantörs-
admin, organisationsetablering, inbjudningsflöde, avetablering), Etapp 8c–8e (Admin.jsx-
uppdelning, frontend-tester, confirm/alert), Etapp 10b–10e (bulkimport, ledningsrapport,
rutinmallar, tid-att-hitta).

**Version:** 5.16.0.

---

## Fas 25 – Etapp 6: kund nummer två (leverantörsadmin, organisationsetablering, inbjudan, avetablering)

Den enskilt viktigaste luckan från ETAPPLAN2.md: det fanns ingen väg till kund nummer två.
`/registrera` var helt öppen (vem som helst fick ett konto med läsåtkomst till organisationens
vårdrutiner), och det gick inte att skapa en ny organisation eller administrera flera kunder
utan att manuellt redigera Firestore. Alla fyra delmål (6a–6d) genomförda i en enda
sammanhängande omgång eftersom de delar samma datamodell och rör samma säkerhetskritiska yta
(autentisering, roller, regler).

- **Ny collection `plattformsadmin/{uid}`** – existens ÄR hela behörigheten (samma mönster
  som redan användes för `dokumentOrganisation()` i storage.rules). Aldrig skrivbar av någon
  klient (`allow write: if false`). Utses via `blibForstaPlattformsadmin` (fungerar bara
  EN gång, innan någon plattformsadmin finns, och kräver att anroparen redan är superadmin
  någonstans – stoppar en anonym nyregistrerad från att bootstrappa sig själv i en tom
  installation) eller `gorTillPlattformsadmin` (kräver en BEFINTLIG plattformsadmin).
- **`organisationenArAktiv()` inflätad i `matcharMinOrg()`** (firestore.rules) – den enda
  funktion som används i 31 av rules-filens match-block. En enda ny rad
  (`&& organisationenArAktiv()`) fick avetableringsspärren att gälla för i praktiken ALL
  org-skopad data i ett svep, utan att röra ett enda annat match-block. `organisationer/
  {orgId}` läses fortfarande av organisationens egna medlemmar även när pausad (så de ser
  VARFÖR de är utestängda), men allt annat (rutiner, anslag, förråd, …) nekas.
- **`skapaOrganisation`** (Cloud Function, plattformsadmin-only) – skapar organisations-
  dokumentet OCH standardbudgeten (`installningar/geminiBudget`) i samma anrop, så en ny
  kund aldrig möter ett dokument som råkar sakna förväntade fält.
- **`listaOrganisationer`** – leverantörsöversikt: moduler, antal användare, senaste
  avslutade månadens AI-kostnad (återanvänder Etapp 5:s `kostnadshistorik` rakt av).
- **`pausaOrganisation` / `exporteraOrganisation`** – avetablering. Export återanvänder
  Etapp 3b:s `backupaOrganisation()` oförändrad (samma filformat, `backups/{orgId}/
  {datum}.json`), bara nu nåbar på begäran istället för bara via veckojobbet.
- **Inbjudningsflödet (6c) – den mest säkerhetskänsliga biten.** `firestore.rules` stänger
  `users/{userId}`s `allow create` helt (`if false`) – det gamla självbetjänings-hålet
  ("alla nya konton hamnar i 'default' som personal") är stängt. Enda vägen in:
  1. En superadmin anropar `skapaInbjudan({epost, roll})` (organisationId hämtas server-
     side från ANROPAREN, tas aldrig emot som klientdata – annars hade en superadmin kunnat
     bjuda in någon till en ANNAN organisation). Genererar ett 192-bitars slumpat token
     (`crypto.randomBytes(24)`), giltigt 7 dagar.
  2. Mottagaren öppnar `/registrera?bjudan=token`, som anropar `granskaInbjudan` (kräver
     INGEN inloggning – personen har ännu inget konto). Avslöjar bara e-post/roll/
     organisationsNAMN, aldrig organisationId rakt av.
  3. Klienten skapar Firebase Auth-kontot FÖRST (`createUserWithEmailAndPassword`), anropar
     sedan `losInInbjudan({token, namn})` som (Admin SDK) skriver `users/{uid}` och märker
     token som använt i en transaktion. Kräver att den nu inloggade e-postadressen matchar
     inbjudans e-post – annars kunde vem som helst med token lösa in NÅGON ANNANS inbjudan.
     Misslyckas inlösningen (t.ex. token redan använt av en annan flik) raderar klienten det
     precis skapade auth-kontot igen (`user.delete()`) så inget föräldralöst konto blir kvar.
- **Ny UI:** `InbjudanFormular.jsx` i adminpanelen ("✉️ Bjud in kollega"), `Leverantor.jsx`
  (`/leverantor`) för leverantörsöversikten – båda tunna gränssnitt ovanpå server-kontrollerna,
  ingen egen klientsäkerhet. `Registrera.jsx` omskriven helt: utan giltigt `?bjudan=`-token
  visas nu "kräver en inbjudan" istället för ett öppet formulär.

**Verifiering:** Ny `tests/functions/etapp6.test.cjs` (22 tester – bootstrap, utnämning,
organisationsetablering, leverantörsöversikt, pausning, export, hela inbjudningskedjan
inklusive dubbelinlösning och fel e-post). Nya sektioner i
`tests/rules/organisationsisolering.test.mjs` (10 nya tester – stängt self-serve-create,
plattformsadmin-läsning/skrivspärr, inbjudningar helt onåbara för klienter, pausad
organisation nekar/återfår åtkomst). `npm run test:functions` nu **54/54**, `npm run
test:rules` nu **60/60**. `npm run lint`, `npm run build`, `npx vitest run` (10/10) gröna.

**Version:** 5.17.0.

---

## Fas 26 – Etapp 8e: ersätt confirm()/alert() med en egen dialog

Sista kvarvarande punkten från den externa kodgranskningen (Fas 23) som ännu inte var
åtgärdad. Native `confirm()`/`alert()` går inte att styla, känns malplacerade på mobil, och
blockerar hela sidans JS-tråd. Ny global `DialogProvider` (monterad en gång i `App.jsx`,
innanför `AuthProvider`) exponerar två primitiv via `useDialog()`:

- **`confirm(text)`** – returnerar ett `Promise<boolean>` (samma anropsmönster som
  `window.confirm`, bara asynkront: `if (!(await confirm(...))) return;`). Renderar en
  inline-dialog (`.bekraftelse-overlay`/`.bekraftelse-ruta`) med Avbryt/Ja.
- **`visaMeddelande(text)`** – ersätter `alert()`, fire-and-forget. Renderar ett litet
  meddelande i appens stil längst ner på skärmen, auto-stängs efter 5 sekunder eller vid
  klick.

Alla ~24 anropsställen i 15 filer konverterade (`Sektionssida`, `RutinFormular`,
`KontaktFormular`, `VersionsHistorik`, `PrivatAnteckning`, `Kommentarer`, `AnslagFormular`,
`TvaFaktorSektion`, `LankFormular`, `Papperskorg`, `Skiftrapport`, `Feedback`, `Admin`,
`LaddaUpp`, `ForradVy`). Funktioner som anropade `confirm()` synkront gjordes `async` och
fick `await`.

**Medveten avgränsning:** `src/utils/piiFilter.js`s `window.confirm` (varning vid ett
misstänkt namn i fritext) lämnades OFÖRÄNDRAD – det är en vanlig synkron util-funktion, inte
en komponent, så `useDialog()` går inte att använda där utan att göra funktionen `async` och
uppdatera samtliga sju anropsställen. Låg utlösningsfrekvens (bara vid misstänkta namn, inte
varje sparning) gjorde att den bredare refaktoreringen inte bedömdes värd det just nu.
Dokumenterat med en kommentar i filen.

**Verifiering:** manuell Playwright-körning mot en riktig browser (emulatorer + dev-server):
klickade på adminpanelens "Kör migreringen SKARPT"-knapp, bekräftade att appens EGEN dialog
renderades med rätt text, att "Avbryt" stängde den, och att INGET nativt
`window.confirm`/`alert` någonsin utlöstes (lyssnade på sidans `dialog`-event). `npm run
lint`, `npm run build`, `npm run test:rules` (60/60), `npm run test:functions` (54/54),
`npm run test:storage` (6/6), `npx vitest run` (10/10) – alla gröna.

**Version:** 5.18.0.

---

## Fas 27 – Etapp 8d: grundläggande frontend-tester

Innan detta fanns exakt ETT vitest-testfall i `src/` (`piiFilter.test.js`) – all annan
automatiserad verifiering låg på regel-/funktionsnivå. Bytt ut mot en riktig, om än
avgränsad, start: `@testing-library/react` och `happy-dom` tillagda som devDependencies.
`vitest.config` (i `vite.config.js`) kör fortfarande "node"-miljö som standard (snabbare,
inget DOM behövs för rena util-tester); komponenttester som faktiskt behöver en DOM sätter
`// @vitest-environment happy-dom` som en fil-docblock (testat och verifierat att fungera –
ett försök med `environmentMatchGlobs` i configen gav ingen effekt av okänd anledning,
docblock-varianten är den robusta vägen).

Tre nya testfiler, valda efter genuin nytta snarare än täckningsprocent:

- **`src/utils/rutinHjalp.test.js`** – `borGranskas`/`narmarSigGranskning`/`arUtgangen`, ren
  datumlogik som styr granskningspåminnelser och utgångsspärrar men som aldrig testats
  automatiskt förut (bara verifierats manuellt genom att vänta ut riktiga datum).
- **`src/config/features.test.js`** – `aktivaFeatures()`, den centrala fail-closed-logiken
  bakom HELA Etapp 2:s modul-gating. Testar uttryckligen att ett saknat `moduler`-fält ger
  en TOM mängd (fail closed), inte en krasch eller fail-open.
- **`src/components/ErrorBoundary.test.jsx`** – ett riktigt komponenttest (inte bara manuell
  Playwright-verifiering som i Fas 23): renderar normalt utan fel, och fångar ett kastat fel
  och visar reservvyn, med `@testing-library/react`.

**Verifiering:** `npx vitest run` nu **29/29** (tidigare 10). `npm run lint`, `npm run
build` gröna.

**Version:** 5.19.0.

---

## Fas 28 – Etapp 8c: dela upp Admin.jsx

Sista punkten från den externa kodgranskningen (Fas 23). `Admin.jsx` var 1072 rader och
växande – varje ny adminpanel-funktion i Etapp 2–6 hade landat där. Bröt ut alla 19
`<section>`-block till egna presentationskomponenter under nya `src/components/admin/`:
`SystemstatusSektion`, `PilotMatvardenSektion`, `ModulerSektion`, `SakerhetSektion`,
`OrganisationMigreringSektion`, `VerifieraKlinikstodSektion`, `KlinikstodAnvandningSektion`,
`KvitteringarMedDeadlineSektion`, `MittOmradeStatistikSektion`, `BudgetSektion`,
`KostnadsuppfoljningSektion`, `AutoUtloggningSektion`, `AnvandareRollerSektion`,
`InaktivaKontonSektion`, `StatistikAllaOmradenSektion`, `FeedbackSektion`,
`SokningarUtanTraffarSektion`, `AndringsloggSektion`, plus en delad `adminHjalp.js`
(`formateraTid`, `STATUS_IKON`/`STATUS_TEXT`, `OMRADE_NAMN`).

**Medveten avgränsning:** all datahämtning (samtliga `useX()`-hookar, `useState`,
`useMemo`-beräkningar) ligger KVAR i `Admin.jsx` oförändrad – bara JSX:en och rent lokal
presentationslogik bröts ut, som tunna komponenter som tar emot färdigberäknad data via
props. Detta var den lägre-risk vägen: ingen ändring i datahämtningsmönster, inga nya
Firestore-lyssnare, ingen ändrad timing. `Admin.jsx` gick från **1072 → 520 rader**.

**Verifiering:** manuell Playwright-körning mot en riktig browser (emulatorer + dev-server):
loggade in, öppnade `/admin`, bekräftade att 15 av 19 sektioner renderades (de 4 övriga är
villkorade på data som inte finns i en tom testinstallation – förväntat), inga
konsolfel, och att `ErrorBoundary`s reservvy INTE visades (dvs. ingen krasch). `npm run
lint`, `npm run build`, `npm run test:rules` (60/60), `npm run test:functions` (54/54),
`npm run test:storage` (6/6), `npx vitest run` (29/29) – alla gröna.

**Version:** 5.20.0.

---

## Fas 29 – Etapp 10b: bulkimport av dokument

Den enligt ETAPPLAN2.md sannolikt starkaste enskilda säljfunktionen: "vi har 400 dokument,
vi orkar inte flytta över dem" är den vanligaste invändningen mot ett nytt rutinsystem.
`LaddaUpp.jsx` hade redan stöd för att köa och tolka FLERA filer i en batch (multi-file-
uppladdning fanns sedan tidigare) – det som saknades var (a) ett sätt att välja en hel mapp
på en gång, och (b) en riktig granskningskö där de färska utkasten kan godkännas/nekas direkt,
istället för att behöva navigera till varje områdes egen sida efteråt.

- **Mappuppladdning:** ny fil-input med `webkitdirectory` (fungerar i Chrome/Edge-
  skrivbordsläge), filtrerar bort allt som inte är en bild klientsidan, återanvänder sedan
  exakt samma uppladdnings-/köflöde som redan fanns (`valjFilerFranLista`, extraherad ur den
  tidigare `valjFiler` för att delas mellan galleri-/kamera-/mappval).
- **Granskningskö på samma sida:** varje klar post visar nu Godkänn/Ta bort-knappar direkt i
  listan, plus en "Godkänn alla N klara"-knapp när fler än en post väntar. Återanvänder
  MEDVETET samma `godkannRutin`/`taBortRutin` (`useRutiner`) och `godkannArtikel`/
  `taBortArtikel` (`useForradsartiklar`) som `Sektionssida.jsx`/`ForradVy.jsx` redan
  använder – ingen ny godkännande-logik eller behörighetskontroll, bara ett bekvämare
  ställe att köra den befintliga från direkt efter en bulkimport.
- Statusen "klar/hanterad" per post härleds live från den faktiska rutin-/artikeldatan
  (`rutiner`/`artiklar`-listorna), inte ett eget lokalt godkänt-flagga – om en annan
  redaktör godkänner samma utkast från en annan flik/sida syns det direkt.

**Verifiering:** manuell Playwright-körning mot en riktig browser (emulatorer + dev-server):
bekräftade att mappuppladdningsknappen och dess hjälptext renderas korrekt tillsammans med
de befintliga galleri-/kameraknapparna, inga konsol- eller sidfel. `npm run lint`, `npm run
build`, `npm run test:rules` (60/60), `npm run test:functions` (54/54), `npm run
test:storage` (6/6), `npx vitest run` (29/29) – alla gröna (ingen av testsviterna rör denna
rent klientsidiga funktion, men kördes om för säkerhets skull).

**Version:** 5.21.0.

---

## Fas 30 – Etapp 10c: ledningsrapport

En enda utskriftsvänlig sida (`/ledningsrapport`, länkad från adminpanelen) riktad mot
verksamhetschefer snarare än redaktörer – medan adminpanelen visar operativa detaljer
(feedback, ändringslogg, budget) samlar den här sidan bara det en chef faktiskt vill kunna
visa uppåt: läser personalen det som publiceras, och hittar de vad de söker efter.

- **Kvitteringsgrad per område** (Kliniskt stöd/Administration separat, inte bara ett
  kombinerat globalt snitt som i adminpanelens "Pilot-mätvärden") – samma beräkning
  (godkända rutiners `lasteAv`/antal användare) som redan fanns i `Admin.jsx`, bara uppdelad.
  Logistik särredovisas separat (utkast/godkända) eftersom förrådsartiklar inte har samma
  läskvitteringsspårning som rutiner.
- **Rutiner som bör granskas**, per område – återanvänder `borGranskas()` från
  `utils/rutinHjalp.js` (samma logik som redan flaggar enskilda rutinkort i `RutinKort.jsx`
  och `MinaUppgifter.jsx`), men listar dem samlat istället för spridda per rutin.
- **Klinikstöd-nytta och vanligaste frågor** samt **andel nollträffar** – återanvänder
  `useKlinikfrageStatistik`/`useSokstatistik` rakt av, samma data som redan visas i
  adminpanelen.
- **"Exportera som PDF"** är webbläsarens egen `window.print()` med en `@media print`-
  stilmall som gömmer navigation/knappar – inget nytt PDF-bibliotek eller server-genererat
  dokument behövdes, "Spara som PDF" är redan en standardknapp i webbläsarens utskriftsdialog.

**Verifiering:** manuell Playwright-körning mot en riktig browser (emulatorer + dev-server):
sidan renderade alla fem sektioner korrekt utan konsol-/sidfel, ingen `ErrorBoundary`-krasch.
`npm run lint`, `npm run build`, `npm run test:rules` (60/60), `npm run test:functions`
(54/54), `npm run test:storage` (6/6), `npx vitest run` (29/29) – alla gröna.

**Version:** 5.22.0.

---

## Fas 31 – Etapp 10d: rutinmallar per verksamhetstyp

Ett startbibliotek så att en ny kundorganisation inte möter en helt tom app direkt efter
etablering (Etapp 6b). Ny `functions/verksamhetsmallar.js`: tre verksamhetstyper
(`akutmottagning`, `vardcentral`, `hemtjanst`), vardera med två startrutiner. `skapaOrganisation`
tar nu emot ett valfritt `verksamhetstyp`-fält och seedar, om det matchar en känd typ, den nya
organisationen med dessa rutiner – redan satta till `status: "godkand"` (synliga direkt,
inget granskningssteg krävs för startmaterial) men tydligt märkta "(mall)" i titeln och med
en anmärkningstext i innehållet.

**Ett medvetet, viktigt övervägande:** mallinnehållet är EXPLICIT skrivet som strukturella
platshållare ("Beskriv er lokala rutin för...", inga faktiska doser/diagnoskriterier), inte
fabricerad klinisk vägledning. Att låta AI hitta på eller hårdkoda medicinskt innehåll och
presentera det som en riktig rutin hade varit både medicinskt och juridiskt oansvarigt – varje
mall bär en anmärkning om att den ska ersättas med verksamhetens egen, granskade rutin.

Ny UI i `Leverantor.jsx`: en "Startbibliotek (valfritt)"-väljare i formuläret för att skapa en
organisation (`src/config/verksamhetstyper.js`, nycklar synkade manuellt med
`verksamhetsmallar.js` – kommenterat i båda filerna), samt ett kvitto ("skapades med N
startmall-rutiner") efter lyckad skapelse.

**Verifiering:** tre nya tester i `tests/functions/etapp6.test.cjs` – en känd verksamhetstyp
ger rätt antal redan godkända, mall-märkta rutiner; ingen verksamhetstyp ger noll (bakåt-
kompatibelt, alla tidigare `skapaOrganisation`-anrop opåverkade); ett okänt värde ger noll
utan att krascha (fail closed). `npm run test:functions` nu **57/57**. `npm run lint`, `npm
run build`, `npm run test:rules` (60/60), `npm run test:storage` (6/6), `npx vitest run`
(29/29) – alla gröna.

**Version:** 5.23.0.

---

## Fas 32 – Etapp 10e: tid-att-hitta-mätning

Sista punkten från ETAPPLAN2.md:s Etapp 10, medvetet bortvald i Etapp 4 ("skulle kräva att
mäta tiden mellan påbörjad sökning och klick på ett resultat per session") – nu byggd.

- **`SokFalt.jsx`:** en `ref` (`sokStartTid`, INTE `useState` – ska aldrig trigga en
  omrendering) sätts till tidpunkten första gången sökfältet går från tomt till icke-tomt
  (start på en "sökningssession"). Nollställs om fältet töms igen utan klick (avbruten
  sökning räknas inte). Vid klick på ett resultat räknas `nu - sokStartTid` ut och skickas
  till en ny `loggaTidTillKlick()`.
- **`useSokstatistik.js`:** samma lätta summa/antal-räknarmönster som redan användes för
  nollträffar (Etapp 4) – `totalTidTillKlickMs`/`antalTidmatningar` i `soksstatistik/{orgId}`,
  inte en rad sparad per sökning. Ett snitt räknas fram i UI (`totalTidTillKlickMs /
  antalTidmatningar`).
- **`firestore.rules`:** `soksstatistik/{orgId}`s `hasOnly(...)`-fältlista utökad med de två
  nya fälten (samma skrivbehörighet som redan gällde – vem som helst inloggad i sin egen
  organisation får öka räknarna, bara superadmin läser dem samlat).
- Visas nu på riktigt i både `PilotMatvardenSektion` (adminpanelen) och `Ledningsrapport.jsx`
  – ersätter den tidigare texten "inte instrumenterat ännu".
- **`react-hooks/purity`-fynd under vägen:** ett direktanrop till `Date.now()` inuti en
  event-handler definierad i komponentkroppen flaggades av linter-regeln (även fast det
  bara körs vid en användarhändelse, aldrig i render-passet) – löst genom att flytta anropet
  till en liten `nuTid()`-hjälpfunktion definierad UTANFÖR komponenten, samma mönster som
  redan användes av `genId()` i `LaddaUpp.jsx`.

**Verifiering:** manuell Playwright-körning mot en riktig browser (emulatorer + dev-server,
en seedad godkänd rutin att söka fram): sökte, klickade på träffen, navigerade till
adminpanelen och bekräftade att raden verkligen visade en riktig uppmätt siffra ("0.9
sekunder i snitt (1 mätningar)"), inte platshållartexten. Nytt test i
`tests/rules/organisationsisolering.test.mjs` som bevisar att de två nya fälten går att
skriva. `npm run test:rules` nu **61/61**. `npm run lint`, `npm run build`, `npm run
test:functions` (57/57), `npm run test:storage` (6/6), `npx vitest run` (29/29) – alla gröna.

Med detta är ETAPPLAN2.md:s Etapp 6, 7, 8 och 10 (b–e) samtliga genomförda.

**Version:** 5.24.0.

---

## Fas 33 – Felövervakning (Sentry), backlogg i Linear, sessionsverktyg

Inte en egen etapp i ETAPPLAN.md/ETAPPLAN2.md – ett svar på frågan "vad saknas fortfarande i
verktygslådan runt projektet, inte i själva appen". Ingen kodbas hade tidigare någon
produktionsövervakning av fel alls (`ErrorBoundary.jsx` loggade bara till `console.error`),
och den återstående backloggen (Etapp 9, 10a, 11) fanns bara som text i ETAPPLAN2.md.

**Felövervakning:**
- Två Sentry-projekt skapade (`synappsen-frontend`, `synappsen-functions`) under
  organisationen `synappsen`.
- `src/sentry.js`: `Sentry.init()` med DSN från `VITE_SENTRY_DSN` (build-time env, satt i
  `deploy.yml` på samma sätt som Firebase-konfigurationen redan sattes där – en DSN är
  designad för att vara publik, den tillåter bara att SKICKA in fel, aldrig att läsa dem, så
  den behandlas inte som en hemlighet). `ErrorBoundary.jsx` skickar nu varje fångat
  renderingsfel vidare till `Sentry.captureException`.
- `functions/index.js`: `@sentry/node` initieras med DSN från `process.env.SENTRY_DSN` (satt
  via ett `functions/.env` som skrivs i `deploy.yml`, samma icke-hemliga mönster). Istället
  för att röra alla ~18 `exports.X = onCall(...)`-anropsställen wrappas själva `onCall`-
  importen EN gång i en lokal `onCall()`-funktion som fångar och vidarerapporterar oväntade
  fel (men inte medvetna `HttpsError`-avvisningar som saknad modul/budget) innan den kastar
  vidare – gäller därför automatiskt för både befintliga och framtida callable-funktioner
  utan någon ytterligare ändring.
- **Fälla under vägen:** gating-matris-testet (`gatingmatris.test.cjs`) bygger sin statiska
  kontroll på en regex som letar efter bokstavlig text `exports.X = onCall(` i källkoden. En
  kommentar som (i förklarande syfte) innehöll exakt den strängen fick testet att felaktigt
  tro att en gated funktion literally hette "X" och saknades i matrisen. Löst genom att skriva
  om kommentaren utan den bokstavliga regex-träffbara formen.

**Linear (backlogg):** ett projekt ("Synappsen") kopplat till teamet, och sju issues skapade
för hela den återstående, icke-påbörjade delen av ETAPPLAN2.md: Etapp 9a–9e
(upphandlingsbarhet: SSO, WCAG, GDPR, granskningslogg, driftdokumentation), Etapp 10a
(demoläge/sandlåda) och Etapp 11 (Intelligence 2.0, uttryckligen märkt att den INTE ska
påbörjas förrän en betalande Intelligence-kund finns). ETAPPLAN2.md förblir källan till den
fylliga motiveringen per punkt – Linear-issuen länkar dit istället för att duplicera texten.

**Claude Code-sessionsverktyg (inget av detta är applikationskod):**
- `.claude/hooks/session-start.sh` + `.claude/settings.json`: kör `npm install` (rot och
  `functions/`) automatiskt vid start av en ny fjärrsession, så beroenden alltid är på plats
  innan första testkörningen.
- `.claude/settings.json`s `permissions.allow`: ett tillståndsurval baserat på faktisk
  användning i den här sessionens transkript (`npm run lint/build/test:*`, `npx vitest`,
  `npx eslint`, `sed -n`, `node -c`, en smalt avgränsad `curl` mot produktions-URL:en för
  asset-hash-verifiering, samt de två read-only GitHub Actions-MCP-verktygen) – enbart
  skrivskyddade/icke-muterande kommandon, inget som kan trigga deploy, push eller godtycklig
  kodkörning.

**Verifiering:** `npm run lint`, `npm run build`, `npx vitest run` (29/29), `npm run
test:rules` (61/61), `npm run test:functions` (57/57, inklusive gating-matris-testet efter
kommentarfixen), `npm run test:storage` (6/6) – alla gröna. `node -c functions/index.js`
grönt. Sentry/Linear-integrationen är INTE verifierad mot en riktig utlöst felrapport i den
här sessionen (skulle kräva en riktig produktionsdeploy och ett framprovocerat fel) – DSN:er
och SDK-inkoppling är verifierade genom kod-/syntaxgranskning och att befintliga tester
(inklusive `ErrorBoundary.test.jsx`) fortfarande går igenom oförändrade.

**Version:** 5.25.0.

---

## Fas 34 – Tillgänglighetsgranskning och tillgänglighetsredogörelse (Etapp 9b, delvis)

Första halvan av ETAPPLAN2.md:s Etapp 9b (WCAG 2.1 AA): en faktisk granskning genomförd och
dokumenterad i `TILLGANGLIGHETSREDOGORELSE.md`. **Inga tillgänglighetsfel är åtgärdade i
den här fasen** – detta är mätningen, inte fixarna. Åtgärderna spåras som Linear-ärende
SYN-6.

**Ingen versionsbump.** Endast dokumentation har tillkommit; ingen kod i appen har ändrats.
Att höja `APP_VERSION` och lägga en post i `andringslogg.js` hade visat användarna en ny
version utan någon synlig förändring, vilket vore missvisande.

### Metod

Granskningen kördes mot en fullständig lokal miljö (auth+firestore-emulatorer, seedad
organisation med rutiner och anslag, riktig inloggning via UI, Vite-dev-server) i Chromium
via Playwright – alltså mot appen som den faktiskt renderas, inte mot statisk kod.

- **axe-core** (`--no-save`-installerad, ej tillagd som projektberoende) med regeluppsättning
  `wcag2a, wcag2aa, wcag21a, wcag21aa`, körd på fem flöden.
- **Numerisk kontrastberäkning** av hela färgpaletten i båda teman enligt WCAG:s
  luminansformel.
- **Tangentbordsgenomgång** (12 tabbsteg från sidtoppen, med avläsning av `outline` och
  `box-shadow` på `document.activeElement`).
- **Kodgranskning** av landmärken, rubriker, etiketter, ARIA och dialoghantering.

### Resultat i siffror

axe-core: **0 överträdelser** på inloggning, startsida, kliniskt stöd och anslagstavla.
**1 överträdelse** på adminpanelen (`select-name`, critical, WCAG 4.1.2) – rollväljaren i
`AnvandareRollerSektion.jsx` saknar tillgängligt namn.

Kontrast, ljust tema (krav 4,5:1 för normal text): brödtext 17,06 · dämpad text 7,24 ·
primärfärg 4,94 · success 4,79 · farlig 4,62 · amber-text 6,78 – **samtliga godkända**.
Färgpaletten bär redan kommentarer om att `--text-svag` och `--success` medvetet mörkats för
att nå AA; granskningen bekräftar att de valen faktiskt håller.

Två kontrastbrister hittades: `--kant` (#e2e8f0) mot `--yta` (#ffffff) ger **1,23:1** mot
kravet 3:1 i WCAG 1.4.11 – och den färgen används som ram i 68 CSS-regler, inklusive
inmatningsfält. I mörkt tema ger `--primar` (#3b82f6) mot `--yta` (#1e293b) **3,98:1** mot
kravet 4,5:1.

### Strukturella fynd (verifierade i browser, inte bara i kod)

- **Inget `<main>`-landmärke** finns någonstans i appen, och **ingen "hoppa till
  innehåll"-länk**. Tabbgenomgången bekräftade konsekvensen konkret: tabbsteg 1–10 är
  notisklocka, utloggning och åtta navigeringslänkar; sökfältet – sidans huvudfunktion – nås
  först vid steg 11. Det är ett brott mot WCAG 2.4.1 på **nivå A**.
- **`<title>` är "Synappsen" på samtliga testade routes** (`/`, `/kliniskt-stod`,
  `/anslagstavla`, `/admin`, `/nyheter`) och uppdateras aldrig vid navigering. WCAG 2.4.2,
  nivå A. Typiskt SPA-problem som ingen märker utan skärmläsare.
- **Anslagstavlan saknar `<h1>`** helt (övriga sidor har en).
- Fokusmarkering finns på samtliga 12 kontrollerade element. De fyra `outline: none` i
  CSS visade sig alla ha ersättningsindikator (`box-shadow`-ring eller bakgrundsbyte), så
  det som såg ut som en brist vid kodläsning var det inte.
- `DialogProvider` har `role="alertdialog"`, `aria-modal` och `autoFocus` – men saknar
  Esc-stängning, fokusfälla, fokusåterlämning och tillgängligt namn. Notiserna är
  `<div onClick>` (endast mus) och självstängs efter 5 s utan möjlighet att förlänga.

### Bedömning

Statusen i redogörelsen är **"delvis förenlig"**. Det är den ärliga slutsatsen: grunden är
klart bättre än väntat för ett projekt som aldrig gjort ett tillgänglighetsarbete – fyra av
fem flöden helt rena maskinellt, korrekt `lang`, alt-texter överallt, etiketter kopplade,
kontrast genomtänkt – men det finns kvarstående brott på nivå A, och nivå A-brott utesluter
"fullt förenlig". Redogörelsen redovisar också uttryckligen vad som **inte** testats
(skärmläsare, 400 % zoom, träffytor, ~28 övriga sidor), eftersom en redogörelse som döljer
sina egna luckor är värdelös som upphandlingsunderlag.

Tre uppgifter i dokumentet är markerade `[FYLL I]` och kan inte härledas ur koden:
leverantörens juridiska namn, e-postadress för tillgänglighetsfrågor och måldatum för
åtgärder. Dokumentet får inte publiceras förrän de fyllts i – och publiceringen i sig
(en `/tillganglighet`-sida) är inte gjord, eftersom en publicerad redogörelse är ett
juridiskt åtagande som ägaren ska fatta beslut om.

---

## Fas 35 – Etapp 12a: emulator-testerna in i CI

En extern "säkerhetsgenomlysning" av projektet visade sig i praktiken vara en
sammanställning av vår egen dokumentation snarare än en oberoende granskning (noll nya
fynd, ett sakfel om en påhittad "Etapp 12"). Den lyfte ändå en verklig, obekväm sanning:
`ci.yml` körde bara `npm run test` (vitest, 29 tester på ren klientlogik). De tester som
faktiskt bevisar organisationsisoleringen – rules (61), functions (57) och storage (6),
alla mot riktiga Firestore-/Storage-emulatorer – kördes bara när någon startade dem
manuellt. En regression i `firestore.rules` eller `functions/index.js` hade kunnat mergas
utan att CI slog larm.

**Ändring:** `ci.yml` kör nu, i denna ordning: `npm ci` (rot), `npm ci` i `functions/`
(behövdes inte tidigare eftersom inget CI-steg läste functions-kod), lint, vitest, sedan
`npm run test:rules`, `npm run test:functions`, `npm run test:storage` – samma
`firebase emulators:exec`-kommandon som redan användes lokalt, oförändrade. Sist bygg och
`node -c functions/index.js`, som tidigare.

Inget nytt skrevs – detta lägger bara till kontroller som redan fanns lokalt. Ingen risk
för produktionsbeteende, men verifierat ändå genom att köra precis den sekvens CI kommer
köra (inklusive `npm ci` i `functions/`, inte det mer förlåtande `npm install`) lokalt:
lint, vitest (29/29), test:rules (61/61), test:functions (57/57), test:storage (6/6), bygg,
och syntaxkontroll – alla gröna.

**Ingen versionsbump.** Ren CI-/infrastrukturändring utan någon som helst effekt på
appens beteende för en användare.

Kvarstår i Etapp 12: 12b (beroendesårbarheter), 12c (App Check), 12d–12g (PII-härdning).

---

## Fas 36 – Etapp 12b: beroendesårbarheter

`npm audit` hade aldrig körts systematiskt tidigare i projektet – 33 sårbarheter i roten
(1 kritisk, 25 höga, 6 måttliga, 1 låg) och 11 i `functions/` (1 hög, 9 måttliga, 1 låg),
ingen omnämnd i någon dokumentation. Genomfört i tre steg enligt planen i ETAPPLAN2.md.

**Steg 1 – `npm audit fix` (icke-brytande) i båda katalogerna.** Fixade `dompurify` (låg),
`postcss`, `protobufjs` och `fast-uri` i roten; `body-parser` och `fast-xml-parser` i
`functions/`. Rot: 33 → 29. Functions: 11 → 9.

**Steg 2 – grundorsaksanalys av det som blev kvar.** Samtliga 9 kvarvarande i `functions/`,
och flera i roten (`gcp-metadata`, `googleapis-common`, `uuid` m.fl.), spårade till EN enda
CVE: [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) – en
buffer-gränskontroll som saknas i `uuid` <11.1.1, men ENDAST utnyttjas om anroparen skickar
en egen `buf`-parameter till `uuid.v3()/v5()/v6()`. Googles egna klientbibliotek
(`google-gax`, `gaxios`, `teeny-request` – alla interna beroenden till `firebase-admin`/
`firebase-tools`) anropar aldrig `uuid` på det sättet, bara det argumentlösa `uuidv4()`.
`npm audit fix` föreslog i praktiken en NEDGRADERING (`firebase-admin` 13.10.0 → 10.3.0,
`firebase-functions` 7.3.0 → 4.9.0) som "fix" – ett resultat av att äldre versioner råkar
undvika hela den beroendekedjan, inte en riktig fix. Att följa det hade varit en regression,
inte en härdning.

**Åtgärd:** ett riktat `"overrides": { "uuid": "^11.1.1" }` i BÅDA `package.json`
(rot och `functions/`), som tvingar hela beroendeträdet till en patchad `uuid`-version utan
att röra `firebase-admin`/`firebase-tools`/`firebase-functions` alls. `uuid`s publika API
för argumentlös `uuidv4()`-generering är oförändrat över de här major-versionerna, så
ändringen är osynlig för all kod som faktiskt anropar den (vår egen kod anropar aldrig
`uuid` direkt – det är helt internt i Googles bibliotek).

**Resultat:** `functions/` **11 → 0**. Rot **33 → 24** (0 kritiska/höga kvar i något som
faktiskt körs i produktion).

**De 24 kvarvarande i roten, med motivering (`npm audit`s eget "fixAvailable" pekade här
konsekvent på en NEDGRADERING, inte en uppgradering – samma mönster som ovan):**

- **`firebase-tools`-kedjan** (`archiver`, `archiver-utils`, `tar` (kritisk), `glob`,
  `minimatch`, `brace-expansion`, `rimraf`, `superstatic`, `exegesis`, `exegesis-express`,
  `readdir-glob`, `gaxios`, `gcp-metadata`, `googleapis-common`, `firebase-tools` självt –
  16 poster): `firebase-tools` är en **devDependency** – ett CLI-verktyg som körs interaktivt
  av en utvecklare eller i den betrodda GitHub Actions-miljön för att köra `firebase deploy`.
  Det skeppas aldrig till någon användares webbläsare och körs aldrig i den deployade
  Cloud Functions-runtimen. En riktig fix finns (`firebase-tools@15.24.0`, en majorversion
  nyare än vår `^13.35.1`) men är en CLI-majoruppgradering som kan ändra kommandoflaggor
  och konfigurationsformat – bör göras som en egen, uppmärksamt testad uppgift (deploy
  dry-run mot en testorganisation), inte i förbigående här. **Accepterad risk tills vidare**,
  kandidat för en framtida egen delmål.
- **`vite-plugin-pwa`-kedjan** (`ejs`, `jake`, `filelist`, `workbox-build`,
  `@trickfilm400/rollup-plugin-off-main-thread` – 5 poster): samma resonemang –
  **devDependency**, körs bara vid `vite build` för att generera service workern, skeppas
  aldrig till klienten. Verifierat att `^1.3.0` (vår version) redan ÄR den senast publicerade
  – det finns i skrivande stund ingen nyare version som löser detta uppströms.
  **Accepterad risk**, ingen uppgradering möjlig just nu.
- **`react-router-dom`/`react-router`** (2 poster, **direkt runtime-beroende, skeppas till
  webbläsaren**): [GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2),
  en CSRF-kringgång specifik för React Routers "RSC mode" (React Server Components/
  server actions, ett opt-in-ramverksläge). Synappsen använder `<BrowserRouter>` i ett rent
  klientsidigt SPA – inga server actions, ingen RSC, ingen datarouter-serverdel. Sårbarheten
  har ingen anfallsyta i vår användning. Verifierat att `^7.18.0` redan är senaste publicerade
  version (7.18.1 finns, men samma sårbara intervall `>=7.12.0 <8.3.0` täcker den också –
  det finns ingen patchad 7.x). **Accepterad risk**, ingen anfallsyta för vår
  användningsmodell.

**Verifiering:** hela testsvepet kört på nytt efter `overrides`-ändringen (viktigast:
functions-testerna, eftersom `firebase-admin` nu drar in `uuid@11` internt istället för
`uuid@9`) – `npm run lint`, `npm run build`, `npx vitest run` (29/29), `npm run test:rules`
(61/61), `npm run test:functions` (57/57), `npm run test:storage` (6/6), `node -c
functions/index.js` – alla gröna, ingen regression.

**Ingen versionsbump.** Beroendehärdning utan förändrat appbeteende för en användare.

Kvarstår i Etapp 12: 12c (App Check), 12d–12g (PII-härdning). En framtida
`firebase-tools`-majoruppgradering (13→15) är identifierad men medvetet inte schemalagd
här – kräver en egen, försiktig testcykel. Denna uppgradering är nu formellt spårad som
**Etapp 12h** i ETAPPLAN2.md (EJ PÅBÖRJAD), med testcykeln (isolerad gren, läsa
ändringsloggen för brytande CLI-ändringar, hela testsvepet mot den nya versionen, en
deploy-verifiering mot ett separat testprojekt) uttryckligen nedskriven där så den inte
glöms bort eller görs som en snabb sidoeffekt av något annat delmål.

---

## Fas 37 – Etapp 12c-i: App Check aktiverat i klienten (mätfas)

Steg ett av tre i Etapp 12c. `enforceAppCheck` förekom noll gånger i `functions/index.js` –
rules och `kravModul`-gating bär redan hela den verkliga säkerhetsbördan (bevisat av
testsviterna), men App Check är standardfrågan vid en Firebase-säkerhetsgranskning och
saknades helt som lager.

**Ändring:** `src/firebase/config.js` initierar nu `initializeAppCheck()` med
`ReCaptchaV3Provider`, direkt efter `initializeApp()` och före `getAuth()`. Aktiveras bara
om `VITE_RECAPTCHA_SITE_KEY` är satt OCH `VITE_USE_EMULATOR` inte är `"true"` – utan
sitenyckel är det ett rent no-op, samma mönster som Sentry-DSN:et i Fas 33. Ingen
serverkontroll läggs till i detta steg (det är 12c-ii, medvetet separat).

**Detta steg kräver en extern, manuell åtgärd som inte kan göras av Claude:** en
reCAPTCHA v3-sitenyckel måste registreras på google.com/recaptcha/admin, appen måste
registreras för App Check i Firebase-konsolen med den nyckeln, och nyckeln måste läggas
till som `VITE_RECAPTCHA_SITE_KEY` i `deploy.yml` (icke-hemlig, samma hantering som
Firebase-konfigen – en reCAPTCHA-sitenyckel är avsedd att vara publik). Full instruktion
i ETAPPLAN2.md Etapp 12c. Fram tills dess är koden inaktiv men ofarlig.

**Verifiering:** `npm run build` (firebase-app-check-modulen bäddas in, `firebase-vendor`-
chunken växer marginellt, ~678 kB → ~686 kB), `npm run lint`, `npx vitest run` (29/29) –
alla gröna. Manuell Playwright-körning mot emulatorer i riktig browser (samma inloggning
som tidigare sessioner verifierat med): inga sid- eller konsollfel, inloggningen fungerar
identiskt som innan ändringen – bekräftar att no-op-vägen (ingen sitenyckel konfigurerad,
vilket är det verkliga läget just nu) inte introducerar några regressioner.

**Ingen versionsbump.** Koden är för närvarande helt inaktiv (ingen sitenyckel existerar
ännu) – det finns inget beteende att beskriva i en användarvänd ändringslogg förrän
sitenyckeln är på plats och App Check faktiskt börjar utfärda tokens.

Kvarstår i Etapp 12: 12c-ii (`enforceAppCheck`, väntar på mätperiod efter att sitenyckeln
finns), 12c-iii (test), 12d–12g (PII-härdning), 12h (`firebase-tools`-uppgradering,
EJ PÅBÖRJAD, egen testcykel krävs).

---

## Fas 38 – Etapp 12d: PII-kontroll i förrådsartikelformuläret

Första av fyra PII-härdningsdelmål i Etapp 12. Den enda konkreta, omedelbart åtgärdbara
luckan den externa rapporten pekade på: `ForradArtikelFormular.jsx` var det sista
fritextformuläret i appen utan `kontrolleraPatientuppgifter()` – rutiner, kommentarer,
anslag, skiftrapport, anteckningar och feedback hade redan kontrollen.

**Ändring:** exakt samma mönster som `AnslagFormular.jsx` – `kontrolleraPatientuppgifter()`
körs på `namn`/`skap`/`hylla` (fritextfälten; `antal` och bilden lämnas orörda, ingen
anledning att kontrollera ett numeriskt fält eller en bildfil) innan `onSpara` anropas.
Vid träff visas meddelandet via `useDialog()`s `visaMeddelande` och sparningen avbryts.

**Verifiering:** manuell Playwright-körning mot en riktig browser (emulatorer + dev-server,
inloggad testanvändare, `/logistik/engangsforradet`): (1) ett giltigt testpersonnummer
(`900101-0017`, samma Luhn-giltiga testvärde som redan används i `piiFilter`-testerna)
skrivet i namnfältet blockerar sparningen med ett synligt felmeddelande och formuläret
förblir öppet; (2) en vanlig artikel ("Kompresser 10x10") sparas normalt, formuläret stängs
och artikeln syns i listan – ingen regression för det vanliga flödet. `npm run lint`,
`npm run build`, `npx vitest run` (29/29), `npm run test:rules` (61/61), `npm run
test:functions` (57/57), `npm run test:storage` (6/6) – alla gröna.

**Ingen versionsbump.** Konsekvenshöjning av en redan existerande policy till ett fält som
av misstag saknade den – inte en ny funktion i sig.

Kvarstår i Etapp 12: 12e (rutiner → Cloud Function), 12f (skiftrapport → Cloud Function),
12g (regelbaserad spärr för resten, kräver ett föregående beslut om strikthet), 12c-ii/iii,
12h.

---

## Fas 39 – Etapp 12e: omprövad efter regelgranskning, och en riktig bugg hittad och fixad

Innan implementation av 12e (planerad Cloud-Function-omskrivning av rutinskapande) lästes
`firestore.rules` igenom rad för rad för `rutiner`-collectionen, för att förstå exakt vad
som redan skyddade den. Det visade sig att premissen i ETAPPLAN2.md:s ursprungliga 12e –
att rutiner bara hade klientsidigt PII-skydd och kunde kringgås via ett direktanrop mot
Firestore – **inte stämde**. `rutiner`, `anslag`, `skiftrapporter` och `anteckningar` hade
alla redan en `harTroligtPersonnummer()`-kontroll på regelnivå (create/update),
`kommentarer`/`feedback` var redan helt låsta (`allow create: if false`, går bara via
Cloud Functions med full Luhn). Detta lyftes till användaren innan något byggdes –
att skriva om hela rutin-CRUD:et till Cloud Functions (bilagor, versionshistorik, taggar,
återställning) hade varit stort, riskabelt arbete för att lösa ett problem som redan var
löst. Användaren valde att istället fokusera på den enda verkliga luckan: `forradsartiklar`
saknade regelskyddet helt (12d hade bara lagt en klientkontroll där).

**Ändring 1 – den verkliga luckan stängd.** `harTroligtPersonnummer()` läggs till på
`forradsartiklar`s create/update (namn/skap/hylla), identiskt mönster som de fyra andra
collectionerna redan hade.

**Ändring 2 – en allvarligare, redan existerande bugg hittades och fixades under
testverifieringen.** Ett nytt rules-test skrevs för att bevisa att `forradsartiklar`s nya
spärr fungerar: ett personnummer i `namn`-fältet skulle blockeras. Testet med ETT ord
prefix ("Handskar 900101-0017") misslyckades oväntat – anropet SLAPP igenom. Ett test med
bara det bara siffrorna ("900101-0017", inget prefix) blockerades korrekt. Det avslöjade
att Firestore-reglernas `string.matches()` gör en **helt förankrad** matchning (hela
strängen måste matcha mönstret, som `String.fullmatch` i andra språk) – till skillnad från
JavaScripts `regex.test()`/`.matches()` i klienten, som söker var som helst i strängen.

Konsekvensen: `harTroligtPersonnummer()` i sin ursprungliga form fångade bara ett fält vars
**HELA** innehåll var exakt ett personnummer – aldrig ett personnummer inbäddat i en
mening ("Patientens pnr 900101-0017 gäller uppföljning..."), vilket är det realistiska
sättet ett personnummer faktiskt hade hamnat i ett titel- eller innehållsfält. Denna bugg
fanns redan i produktion och påverkade ALLA FYRA collections som använde funktionen
(`rutiner`, `anslag`, `skiftrapporter`, `anteckningar`) – inte bara den nya
forradsartiklar-kontrollen. Fixad genom att omsluta regexmönstret med `[\s\S]*` på båda
sidor i den delade `harTroligtPersonnummer()`-funktionen.

**Verifiering av fixen:** ett nytt regressionstest på `rutiner` (den collection med störst
klinisk relevans) bevisar att ett personnummer INBÄDDAT i innehållet nu blockeras (skulle
ha slunkit igenom före fixen), och ett kompletterande test bevisar att normalt innehåll
utan personnummer fortfarande går igenom utan problem. Totalt sex nya rules-test (tre för
forradsartiklar, två regressionstest för rutiner, en uppdatering-test). `npm run
test:rules` **67/67** (upp från 61). `npm run lint`, `npm run build`, `npx vitest run`
(29/29), `npm run test:functions` (57/57), `npm run test:storage` (6/6) – alla gröna,
ingen regression.

**Beslut om resten av PII-härdningen:** 12f (skiftrapport → Cloud Function) är avskriven
som ursprungligen skriven, av samma skäl som 12e – premissen höll inte. 12g (regelbaserad
spärr för resten) är till största delen redan uppfylld av denna fas; kvarvarande fråga är
ett affärsbeslut (är regelns datumregex lagom strikt, eller behövs en annan avvägning för
något specifikt fält) som väntar på ägarens ställningstagande.

**Ingen versionsbump.** Ren regel- och testhärdning; appens beteende för en användare som
skriver normalt innehåll är oförändrat. Beteendet ändras bara för den (tidigare möjliga)
attacken – som nu faktiskt stoppas istället för att bara se ut att vara stoppad.

Kvarstår i Etapp 12: 12c-ii/iii (App Check-enforcement, väntar på sitenyckel + mätperiod),
12g (affärsbeslut om regelstrikthet), 12h (`firebase-tools`-uppgradering, EJ PÅBÖRJAD,
egen testcykel krävs). 12f avskriven som ursprungligen skriven.

---

## Fas 40 – Etapp 12c-i: reCAPTCHA-sitenyckeln på plats, App Check aktivt

Ägaren registrerade en reCAPTCHA v3-sitenyckel (google.com/recaptcha/admin) för
produktionsdomänen och skickade den. `VITE_RECAPTCHA_SITE_KEY` tillagd i `deploy.yml`s
`.env`-genereringssteg, identiskt mönster som `VITE_FIREBASE_*`/`VITE_SENTRY_DSN` – en
icke-hemlig, publik nyckel som bara låser upp att BE om ett App Check-intyg, inte att
bevilja ett.

Ingen ytterligare kodändring krävdes – `src/firebase/config.js`s villkor
(`VITE_RECAPTCHA_SITE_KEY` satt OCH inte emulator) slår nu igenom automatiskt från och med
nästa deploy. App Check går därmed live i **mätläge**: klienten skickar App Check-tokens,
men `functions/index.js` kräver dem ännu inte (`enforceAppCheck` är fortfarande inte satt
någonstans – det är 12c-ii, medvetet uppskjutet).

**Verifiering:** `npm run lint`, `npm run build` – gröna. Ingen browserverifiering mot en
riktig reCAPTCHA-nyckel gjordes i den här sessionen (skulle kräva ett riktigt
produktionsdeploy och nätverksåtkomst till Googles reCAPTCHA-tjänst, som denna
sandboxmiljö inte nödvändigtvis har); koden följer samma redan testade no-op/aktiv-mönster
som Sentry-DSN:et, och `initializeAppCheck()` är designad att aldrig blockera
apprendering synkront oavsett nätverksstatus.

**Ingen versionsbump.** Ren konfigurationsändring (en env-variabel i CI), ingen kodändring.

**Nästa steg (kräver ingen kod från Claude just nu):** efter nästa produktionsdeploy bör
ägaren låta en mätperiod (1–2 veckor rekommenderas) passera, kontrollera Firebase-konsolens
App Check-metrik (Build → App Check → Metrics) för att bekräfta att så gott som all trafik
bär giltiga tokens, och sedan be en session aktivera 12c-ii (`enforceAppCheck: true`) samt
12c-iii (testet som bevisar att ett anrop utan token nekas).

---

## Fas 41 – Etapp 13a: Personuppgiftsbiträdesavtal (PUB/DPA)-mall

Första delmålet i `ETAPPLAN3.md` (Etapp 13, upphandlings- och granskningspaketet). Ren
dokumentation, ingen kodändring.

Skapade `avtal/PUB-AVTAL-MALL.md`: en GDPR art. 28-mall med Synappsen som
personuppgiftsbiträde och kundorganisationen som personuppgiftsansvarig, med tydligt
markerade `[FYLLS I: ...]`-fält för det som är kundspecifikt. Innehåller behandlingens art
och ändamål, kategorier av registrerade (personal, uttryckligen inte patienter),
kategorier av personuppgifter, hänvisning till den kommande underbiträdesförteckningen
(Etapp 13b), lagringstid/radering, säkerhetsåtgärder, incidenthantering (72 h) och
granskningsrätt.

**Avvikelse funnen vid premisskontroll (genomgående krav 8 i ETAPPLAN3.md):** planen antog
att radering vid avetablering var kopplad till "befintligt avetableringsflöde från fas 25".
Vid genomläsning av `functions/index.js` visade det sig att fas 25 byggde
`pausaOrganisation` (stänger åtkomst) och `exporteraOrganisation` (GDPR-/uppsägningsexport)
– men **ingen** funktion för att permanent radera en avetablerad organisations data i
Firestore, och ingen livslängdsgräns (lifecycle-regel) på de veckovisa backupfilerna i
Storage (`backups/{orgId}/...`). Permanent radering är alltså i praktiken ett manuellt steg
idag, inte automatiserat. Mallen skriver detta explicit (punkt 6) istället för att felaktigt
lova en automatiserad process, med en rekommendation om att bygga radering + lifecycle-regel
innan avtalet undertecknas mot en kund med strikta raderingskrav. `ETAPPLAN3.md` 13a
uppdaterad med samma resultat.

**Verifiering:** dokumentationsarbete, ingen build/lint/test-svep relevant.

**Ingen versionsbump.** Nytt avtalsmaterial i repot, ingen ändring av appens beteende.

Kvarstår i Etapp 13: 13b (underbiträdesförteckning), 13c (DPIA-underlag), 13d (IT-faktablad),
13e (uppdatera PITCH.md), 13f (SSO/Entra ID – kräver ägarbeslut om SAML/OIDC före byggstart),
13g (WCAG-A-snabbfixar).

---

## Fas 42 – Etapp 13b: Underbiträdesförteckning

Ren dokumentation, ingen kodändring.

Skapade `avtal/UNDERBITRADEN.md`: en tabell över samtliga underbiträden/tredjepartstjänster
verifierade direkt i koden – Google Firebase (Auth/Firestore/Storage/Functions/Hosting),
Google Generative AI (Gemini API), Google Custom Search API (klinikstöd-sökningen, pausad i
UI), Sentry, Google reCAPTCHA/App Check, samt Linear (internt verktyg, ingen kunddata) och
en not om den ännu inte upphandlade e-postleverantören för Etapp 16.

**Verifierat direkt i koden (inte antaget):**
- Samtliga Cloud Functions kör `region: "europe-west1"` (redan känt sedan 13a-arbetet).
- Sentry-DSN:erna i `.github/workflows/deploy.yml` pekar mot `ingest.de.sentry.io` – Sentrys
  EU-region (Frankfurt), bekräftat.

**Nytt fynd vid premisskontroll (genomgående krav 8):** `functions/index.js` använder det
publika Gemini API:et (`GoogleGenerativeAI` mot `generativelanguage.googleapis.com`), inte
Vertex AI. Vertex AI har en tydlig regional databehandlingsgaranti (EU-only-drift möjlig);
det publika Gemini API:et har det inte på samma dokumenterade sätt. Detta var inte känt
sedan tidigare och är fört in i `UNDERBITRADEN.md` som en öppen punkt: kontrollera Googles
aktuella villkor innan avtalet undertecknas mot en kund med strikta regionkrav på
AI-behandlingen, med migrering till Vertex AI (samma modell, regional endpoint) som teknisk
lösning om det krävs.

Firestore-/Storage-regionen kvarstår som en konsolkontroll för ägaren, oförändrat sedan
13a – kan inte verifieras genom kodgranskning eftersom den sätts vid projektskapande.

`ETAPPLAN3.md` 13b uppdaterad med samma resultat.

**Verifiering:** dokumentationsarbete, ingen build/lint/test-svep relevant.

**Ingen versionsbump.**

Kvarstår i Etapp 13: 13c (DPIA-underlag), 13d (IT-faktablad), 13e (uppdatera PITCH.md),
13f (SSO/Entra ID), 13g (WCAG-A-snabbfixar).

---

## Fas 43 – Etapp 13c: DPIA-underlag

Ren dokumentation, ingen kodändring.

Skapade `avtal/DPIA-UNDERLAG.md`: ett underlag som Kunden kan lämna vidare till sitt eget
dataskyddsombud, skrivet för en icke-teknisk läsare. Bygger vidare på redan verifierat
innehåll från `SAKERHETSRAPPORT.md` (PII-filtrets tre lager, roll-/behörighetsmodell) och
`avtal/UNDERBITRADEN.md` (Etapp 13b) snarare än att skriva nya, overifierade påståenden.

Innehåller en sammanfattande risktabell som medvetet inte överdriver vad som är byggt: den
anger explicit att dagens ändringslogg saknar manipuleringsskydd (den planerade hashkedjan
i Etapp 14 är inte byggd än) och att Gemini API:ets regionsgaranti är en öppen fråga (samma
fynd som i fas 42). Fas 39-bugfixen (den fullt förankrade `matches()`-buggen i
`harTroligtPersonnummer()`) används som ett konkret exempel på att PII-skyddet aktivt
underhålls och testas, inte bara påstås fungera.

`ETAPPLAN3.md` 13c uppdaterad med samma resultat.

**Verifiering:** dokumentationsarbete, ingen build/lint/test-svep relevant.

**Ingen versionsbump.**

Kvarstår i Etapp 13: 13d (IT-faktablad), 13e (uppdatera PITCH.md), 13f (SSO/Entra ID),
13g (WCAG-A-snabbfixar).

---

## Fas 44 – Etapp 13d: Tekniskt faktablad till kundens IT

Ren dokumentation, ingen kodändring.

Skapade `avtal/IT-FAKTABLAD.md` – avsett att kunna skickas rakt av till en kunds
IT-avdelning. Återanvänder samma verifierade fakta som redan etablerats i 13a–13c
(Cloud Functions-regionen europe-west1, veckovis backup varje måndag 03:00 verifierad i
`functions/index.js`s `veckovisBackupSchemalagt`, App Check-status i mätfas, den öppna
Firestore-/Storage-regionfrågan och Gemini-regionfrågan, den manuella
raderingsbegränsningen från 13a) istället för att skriva nya, overifierade påståenden.

**Nytt öppet fält identifierat vid skrivandet:** en dokumenterad återställningstid (RTO)
efter en backup finns inte någonstans i kodbasen eller tidigare planeringsdokument –
återställning är idag en manuell process utan en angiven målsatt tid. Markerad
`[FYLLS I]` i faktabladet som en punkt ägaren/leverantören bör besvara innan
faktabladet används mot en kund som frågar specifikt om detta.

`ETAPPLAN3.md` 13d uppdaterad med samma resultat.

**Verifiering:** dokumentationsarbete, ingen build/lint/test-svep relevant.

**Ingen versionsbump.**

Kvarstår i Etapp 13: 13e (uppdatera PITCH.md), 13f (SSO/Entra ID),
13g (WCAG-A-snabbfixar).
