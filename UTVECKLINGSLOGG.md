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
