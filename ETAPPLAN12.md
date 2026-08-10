# Etapplan 12 – Från demo till drift: det som går sönder när någon faktiskt använder appen

**✅ ANTAGEN 2026-08-10.** Utgångsläge v5.91.0, efter en genomgång av faktisk kod (inte
dokumentation). Etapp 59 (59a–59c) byggd samma dag som antagandet.

> **Läs detta först.** De elva tidigare etapplanerna har byggt funktioner. Den här bygger
> nästan inga – bara Etapp 62 tillför något nytt, resten rättar och stärker det som redan
> finns. Den utgår från ett obekvämt konstaterande: **appen har aldrig mött en verklig
> datamängd, en verklig kund eller en verklig arbetsdag** – och den här genomgången hittade
> tre saker som redan är trasiga just nu, varav två infördes av de två senaste etapperna. Det
> är inte ett argument mot tempot hittills. Det är ett argument för att nästa etapp ska handla
> om hållfasthet snarare än om ännu en funktion.
>
> **Se `ETAPPLAN13.md` för ett separat, fristående förslag** (baspaket av nationella
> referenser/kunskapsstöd) som uppstod under samma genomgång men som medvetet hålls skild
> från den här planen – den rör en regulatorisk gräns (MDR) som förtjänar sin egen,
> ograskade behandling istället för att blandas in bland rättningarna nedan.

---

## Vad som faktiskt finns i dag (nulägesbild)

Verifierat mot kod, inte mot planfilerna:

| Mått | Värde |
|---|---|
| Kodrader (`src/` + `functions/`) | ~26 000 |
| Sidor / komponenter / adminsektioner | 27 / 59 / 32 |
| Hooks / utils | 63 / 37 |
| Cloud Functions (exports) | 92, i **en** fil på 4 621 rader |
| `firestore.rules` | 916 rader, 40 collections |
| Tester | 130 vitest · 11 regelfiler · 32 functions-filer · 4 e2e-specar |
| Etapper genomförda | Etapp 1–58 över elva planfiler |

**Alla tre säljbara paket (Core, Operations, Intelligence) plus Källbevakning är byggda.**
`ETAPPLAN11.md` har bara två öppna punkter kvar, och båda väntar medvetet på en extern
förutsättning: 54c/54d (en konkret andra enhet hos en kund) och Etapp 58 (SSO, en kund som
kräver det). Ur ett rent funktionsperspektiv finns det inget uppenbart hål kvar att fylla.

**Det är just därför den här planen ser ut som den gör.** När funktionslistan är färdig är
den intressanta frågan inte "vad mer kan vi bygga" utan "vad håller inte när det används".

---

## Vad genomgången hittade

Fem fynd, alla verifierade mot kod. De tre första är fel som finns i produktionsgrenen just nu.

### 1. Sex rutiner per ny organisation som ingen kan nå (regression från Etapp 56a)

Etapp 56a utökade `functions/verksamhetsmallar.js` till att seeda rutiner i **alla tre
områdena** – tidigare bara `kliniskt-stod`. Sex av mallarna per verksamhetstyp har
`omrade: "logistik"`. Men:

- **Logistik-sidan visar inga rutiner.** `src/pages/Logistik.jsx` renderar förrådsartiklar
  (`SektionsKort` per förråd), inte en `Sektionssida` – till skillnad från `/kliniskt-stod`
  och `/administration`. Det finns ingen vy där en `omrade: "logistik"`-rutin kan läsas.
- **De är inte sökbara.** `useSokindex()` monterar `useRutiner("kliniskt-stod")` och
  `useRutiner("administration")` – inte `"logistik"`. Varken sökfältet eller
  kommandopaletten hittar dem.
- **De kan inte godkännas.** `useGodkannandeKo()` slår ihop samma två områden. En seedad
  logistikrutin med status `utkast` kan aldrig nå godkännandeknappen.
- **Men de räknas.** `InnehallshalsaSektion` och `Ledningsrapport` läser explicit
  `useRutiner("logistik")` och räknar in dem i hälsosiffran och kvitteringsgraden.

Nettoeffekten för en ny kund: sex osynliga rutiner som aldrig kan läsas, kvitteras eller
godkännas – men som drar ned hälsosiffran och syns i ledningsrapporten. Det är precis
motsatsen till vad Etapp 56 skulle åstadkomma, och det gör hälsosiffran missvisande från
dag ett.

### 2. Kioskläget gatas inte av sin egen modulflagga (lucka från Etapp 55a)

`FEATURE.KIOSK_MODE` finns i `src/config/features.js` och är listad under `operations` i
`PACKAGE_FEATURES`. **Ingen kodrad läser den.** Jämför `FEATURE.OFFLINE_CENTER`, som
kontrolleras i `OfflineCenter.jsx`.

Konsekvensen är dubbel. Affärsmässigt: kiosk-rollen går att skapa i en organisation som inte
betalar för Operations. Tekniskt allvarligare: `MODULPLAN.md` beskriver en **trelagersgating**
(UI → klient → server) som en byggd, testad disciplin med en egen gating-matris-testsvit
(`ETAPPLAN2.md` 7c). Etapp 55 byggde en hel funktion utan att följa den, och gating-matrisen
fångade det inte – vilket betyder att matrisen inte täcker nya funktioner automatiskt.

### 3. `dompurify` – XSS-saneraren – har en känd sårbarhet

`npm audit` rapporterar tio sårbarheter. Fördelningen spelar roll och bör inte
sammanfattas som "1 kritisk":

| Paket | Allvarlighet | Prod eller dev? | Bedömning |
|---|---|---|---|
| `dompurify` | moderate | **Produktion** | **Den enda som betyder något direkt.** Används i `MarkdownInnehall.jsx` för att sanera ALLT rutininnehåll. En saneringslucka är per definition relevant för en app vars redaktörer skriver markdown. |
| `react-router-dom` | high | Produktion | CVE:n gäller RSC-läge. Appen är en ren SPA med `BrowserRouter` – sannolikt inte exploaterbar, men bör uppdateras. |
| `tar` (via `firebase-tools`) | **critical** | Endast dev | Byggverktyg, når aldrig en användare. "Kritisk" i utskriften, låg i verkligheten. |
| Övriga sex | high/moderate | Endast dev | Samma sak. |

> **Rättelse (Etapp 59c, samma dag):** det här stycket påstod ursprungligen att
> `npm-audit-rapport.md` "inte finns i repot" och att `CLAUDE.md`s checklista därför pekade på
> ett dokument som inte existerar. **Det var fel, och berodde på en ofullständig kontroll** –
> jag letade i repot men kollade aldrig `.gitignore` eller `.github/workflows/ci.yml` innan
> jag skrev slutsatsen. Filen är MEDVETET gitignorad (`scripts/npm-audit-rapport.mjs`, Etapp
> 31a): CI kör den vid varje körning och postar resultatet till GitHub Actions
> `$GITHUB_STEP_SUMMARY` – en färskare mekanism än en incheckad fil som kan bli inaktuell,
> inte en lucka. Kvar står bara den genuina poängen: prod/dev-uppdelningen nedan syns inte i
> den råa CI-utskriften, och gör bedömningen tydligare oavsett var den läses.

### 4. Appen hämtar hela innehållsdatabasen, varje gång

`useRutiner(omrade)` öppnar en `onSnapshot`-lyssnare utan `limit()`, utan paginering och utan
fältprojektion – hela dokumentet, inklusive `innehall` (full markdown), `steg`, `kviss` och
`externaKallor`. Mjukraderade och arkiverade rutiner filtreras **klientsidan**, alltså efter
att de hämtats. Fjorton av hooksen kör samma mönster mot sina collections; bara nio frågor i
hela kodbasen använder `limit()`.

`useSokindex()` – som driver både sökfältet på startsidan och kommandopaletten – monterar
`useRutiner` för två områden **plus** förrådsartiklar, kontakter och länkbibliotek, och bygger
ett Fuse.js-index över alltihop i en `useMemo`. Startsidan öppnar alltså i praktiken en
livelyssnare över hela organisationens innehåll.

Med dagens datamängd (8 mallrutiner) är det gratis. Men `PITCH.md` säljer uttryckligen
motsatsen: *"fyll på med befintliga rutiner (fotofunktionen gör detta snabbt)"* och
bulkimport av en hel avdelnings pärmar. En avdelning med 500–2 000 rutiner är precis det
lyckade utfallet – och det är den datamängden appen aldrig har körts mot.

`persistentLocalCache` är påslaget, vilket mildrar återbesök rejält (deltasynk mot lokal
IndexedDB). Problemet är alltså **första inloggningen på en ny enhet** och **CPU-kostnaden
för att bygga om Fuse-indexet**, inte den löpande Firestore-notan.

> **Viktigt:** detta är ett *identifierat* problem, inte ett *uppmätt*. Se Etapp 60a – planen
> kräver mätning före optimering, av precis samma skäl som genomgående krav 8 finns.
>
> **Uppdatering (Etapp 60a, 2026-08-10):** mätningen är nu gjord. Gissningen ovan om
> Fuse-CPU-kostnaden stämde INTE – under 2 ms även vid 2 000 rutiner. Gissningen om första
> inloggningens datamängd stämde desto bättre – 77 MB vid 2 000 rutiner, se Etapp 60:s
> resultatsektion för hela utfallet.

### 5. `functions/index.js`: 4 621 rader, 92 exports, en fil

`Admin.jsx` delades upp i 32 sektionskomponenter vid ~600 rader (Etapp 8c). Backendfilen är
sju gånger så stor och har aldrig fått samma behandling. Den innehåller allt från
`skickaEpost` till hela raderingslivscykeln till klinikstödets sökkedja. Varje ny Cloud
Function gör det svårare att se vad som redan finns – och `hamtaAnvandarInfo`-mönstret,
rollkontrollerna och hastighetsbegränsningen upprepas i dussintals varianter utan att vara
en gemensam wrapper.

Fem utils saknar test, varav två med reell risk: `offlineKo` (offlinekön – dataförlust om den
tappar en post) och `checklistFramsteg`. Kioskläget (Etapp 55) har noll e2e-täckning.

---

## Genomgående krav (fortsätter numreringen från `ETAPPLAN11.md`)

21. **Mät före du optimerar.** Etapp 60 får inte påbörjas med en kodändring. Den börjar med
    att seeda en realistisk datamängd och mäta – annars optimerar vi en gissning. Det här är
    genomgående krav 8 (premisskontroll) tillämpat på prestanda, och skälet är detsamma:
    projektet har flera gånger byggt på antaganden som inte höll.

22. **Varje ny kundvänd funktion ska gatas av sin modulflagga i samma commit som den byggs.**
    Fynd 2 uppstod för att gatingen är en muntlig konvention, inte något som fångas
    automatiskt. Etapp 59b ska både rätta kioskläget och göra det svårare att glömma nästa
    gång.

23. **En siffra som visas för ledningen måste räkna samma sak som användaren kan se.**
    Fynd 1 bröt mot detta: hälsosiffran räknade rutiner som ingen användare kan nå. Gäller
    hälsosiffran, kvitteringsgraden, ledningsrapporten och innehållshälsan.

24. **Ingen refaktorering utan grönt testsvep före och efter.** Etapp 61 flyttar kod som
    styr radering, behörighet och betalning. Diffen ska vara läsbar som ren flytt.

---

## Etapp 59 – ✅ KLAR (2026-08-10) – Rätta det som redan är trasigt

**Varför:** tre av fem fynd är fel som finns i produktionsgrenen nu. Två infördes av de två
senaste etapperna. Att bygga vidare ovanpå dem gör dem dyrare att rätta, och fynd 1 gör
dessutom hälsosiffran missvisande för varje ny kund som etableras under tiden.

**Modul:** ingen (rättningar i Core respektive Operations).

- **59a – ✅ Alternativ B (mallarna borttagna).** Ägarens fråga om A/B förblev obesvarad, så
  bygget gick vidare med planens egen rekommendation snarare än att stå still: de sex
  `omrade: "logistik"`-mallarna borttagna ur `functions/verksamhetsmallar.js` (8→6 mallar för
  akutmottagning/vårdcentral, 7→5 för hemtjänst). `InnehallshalsaSektion.jsx` slutade räkna
  in `omrade: "logistik"`-rutiner (som redan var oräkneliga i UI:t). **Ingen migrering
  behövdes**, till skillnad från vad texten ovan antog – bekräftat genom att läsa
  `CLAUDE_STATUS.md` innan bygget: Etapp 56a (som introducerade felet) nådde ALDRIG
  produktion (senaste bekräftade deploy var v5.89.0, ett steg innan). De felaktiga mallarna
  fanns bara i lokala emulator-/testkörningar, aldrig i en riktig kunds Firestore.
- **59b – ✅ Gatat, men INTE exakt som texten ovan föreslog – se avvikelsen.** Under bygget
  visade det sig att ett rakt `kravModul("operations")`-anrop på `verifieraKioskPin` (att
  LÄMNA kioskläget) skulle skapa en inlåsningsrisk: om en organisation stänger av Operations
  EFTER att en kiosk-enhet redan konfigurerats kan enheten då aldrig lämna kioskläget igen –
  den skulle vara permanent fast. Löst genom att flytta spärren till där den faktiska
  affärsrisken finns:
  - `skapaInbjudan` nekar nu (`failed-precondition`) en inbjudan med `roll: "kiosk"` om
    organisationen saknar Operations-modulen – detta är den faktiska "kan inte SKAPA ett
    kiosk-konto"-spärren fynd 2 efterlyste.
  - `satKioskPin` kräver likaså modulen (att KONFIGURERA en ny PIN är en del av att sätta upp
    funktionen, ingen inlåsningsrisk – en superadmin som stängt av modulen kan alltid slå på
    den igen för att åtgärda en PIN).
  - `verifieraKioskPin` (att LÄMNA kioskläget) är MEDVETET INTE modul-gated – samma princip
    som `tvingaUtloggning` (alltid tillgänglig, oavsett moduler). Att lämna kioskläget är en
    säkerhetsventil, inte funktionen som säljs.
  - UI-lagret: `InbjudanFormular.jsx` döljer "Kioskläge (delad enhet)" ur rolldropdownen när
    modulen är av. `KioskPinSektion.jsx` visar en informerande (inte blockerande) notis.
  - `KioskBevakning`/`BottomNav`s kioskgren rördes MEDVETET INTE – de styr en REDAN inloggad
    kiosk-enhets beteende, och att hårdblockera dem hade återinfört exakt samma
    inlåsningsrisk som `verifieraKioskPin`-resonemanget ovan löste bort.
  - `tests/functions/gatingmatris.test.cjs` utökad med `satKioskPin` och `skapaInbjudan`
    (villkorligt, bara vid `roll: "kiosk"`) – testsvitens EGNA statiska kontroll (som letar
    efter `kravModul(...)`-anrop i källkoden) fångade automatiskt att båda nu behövde en rad
    i matrisen, precis det mönster testet är byggt för att upptäcka.
- **59c – ✅ Uppdaterat, med en rättelse av min egen ursprungliga bedömning.**
  `dompurify` 3.4.12→3.4.13 och `react-router-dom` 7.18.1→7.18.2, båda patch-nivå. `npm
  audit`: 10 → 7 sårbarheter, samtliga sju nu dev-only (`firebase-tools`-kedjan, bedömd och
  medvetet lämnad – kräver `--force` med risk för brytande ändringar i verktygskedjan, står
  i disproportion till att den aldrig når en användare). Regressionsverifiering av
  `dompurify` gjord via ett manuellt Node-probe (skript-tagg och `onerror`-hanterare
  saneras korrekt, oförändrat) snarare än ett committat vitest-test – `happy-dom` (projektets
  vitest-miljö) har en egen inkompatibilitet med DOMPurify för annars ofarliga taggar (t.ex.
  `<h1>`) som hade gjort ett sådant test opålitligt åt båda hållen. Verklig täckning kommer
  från `tests/e2e/rokprov.spec.js`/`tillganglighet.spec.js`, som redan öppnar riktiga
  rutinsidor i Chromium och passerade grönt efter uppdateringen.
  **Rättelse av min egen premisskontroll:** planens ursprungliga text påstod att
  `npm-audit-rapport.md` "inte finns i repot" och att `CLAUDE.md`s checklista pekade på ett
  dokument som inte existerar. Det var fel – jag hade inte kontrollerat `.gitignore` eller
  `.github/workflows/ci.yml` innan jag skrev den slutsatsen. Filen är MEDVETET gitignorad
  (`scripts/npm-audit-rapport.mjs`, Etapp 31a): CI genererar och postar den till GitHub
  Actions `$GITHUB_STEP_SUMMARY` vid VARJE körning – en färskare mekanism än en incheckad
  fil, inte en lucka. Ingen ny fil skapades; se stycket ovan i "Vad genomgången hittade" för
  den fullständiga rättelsen.

**Klart när:** en nyetablerad organisation har noll oåtkomliga rutiner ✅, hälsosiffran
räknar bara det en användare kan nå ✅, ett nytt kiosk-konto kan inte skapas utan Operations
✅ (utan att en redan konfigurerad enhet någonsin kan låsas in ✅), och `npm audit`s utfall
är bedömt och nedskrivet ✅ (i den här planen, eftersom den fristående rapportfilen visade
sig redan vara löst av CI).

**Testat:** `tests/functions/etapp6.test.cjs` (räknarna 8→6 uppdaterade),
`tests/functions/demo-organisation.test.cjs` (11→9 uppdaterat),
`tests/functions/gatingmatris.test.cjs` (2 nya rader),
`tests/functions/kioskrestriktioner.test.cjs` (4 nya tester: satKioskPin/skapaInbjudan nekas
utan modulen, verifieraKioskPin fungerar ändå, en icke-kiosk-inbjudan opåverkad). Full
testsvep grön: lint, build, vitest (130/130 + 1 ny fil), functions (samtliga 32 filer,
inklusive de fyra ändrade). Inga ändringar i `firestore.rules`/`storage.rules` denna gång,
så `test:rules`/`test:storage` kördes inte om (inget att testa om).

---

## Etapp 60 – Skala till en verklig rutinmängd

**Varför:** fynd 4. Den enda datamängd appen någonsin körts mot är en demo. Det lyckade
utfallet av en pilot – en avdelning som importerar hela sin pärmvägg – är samtidigt det
scenario som aldrig testats. Det vore ett dåligt sätt att upptäcka en flaskhals.

**Modul:** ingen (Core-prestanda).

- **60a – ✅ KLAR (2026-08-10).** Mätt först, med riktig volym – ingen optimering i det här
  delmålet. Byggde `scripts/prestandaseed.mjs` (seedar Firestore-emulatorn, ALDRIG
  produktion, med N rutiner + 200 användare vars uid:n sprids ut i varje rutins
  `lasteAv`-array) och `scripts/prestandamat.mjs` (Playwright, mäter en riktig kall
  inloggning mot en redan seedad organisation). Körde 500/1 000/2 000 rutiner. Resultat och
  slutsats i en egen underrubrik direkt nedan.
- **60b – ✅ KLAR (2026-08-10), men i en MYCKET mindre form än ursprungligen skriven.** Se
  "Vad som hände" nedan – originalskrivningens premiss (innehåll/steg/kviss "behövs bara för
  att öppna rutinen") visade sig felaktig när den kontrollerades mot faktisk kod.

  **Vad som hände:** innan något byggdes kontrollerades premissen mot `Sektionssida.jsx` –
  och den höll inte. Det finns ingen separat "öppna rutinen"-vy: `RutinKort` renderar HELA
  `innehall` direkt, ogömt, för VARJE godkänd rutin på sidan samtidigt (troligen medvetet – en
  akutmottagning ska inte behöva ett extra klick för att se en rutin under press). En
  listvyprojektion (alternativ i eller ii) hade alltså inte sparat någon bandbredd alls –
  sidan hade ändå behövt hämta allt innehåll för att rendera det den redan renderar. Att
  bygga om till en riktig "hämta bara vid öppning"-modell hade krävt att sidan själv byggdes
  om (paginering/virtualisering) – en genuin UX-förändring, inte en datalagerjustering, och
  betydligt större risk än vad originaltexten antydde ("(i) ett listvy-fält, (ii) en separat
  collection" – båda beskrivningarna underskattade omfattningen rejält).

  Lades fram för ägaren som tre alternativ. Valt: en tredje, mindre väg som identifierades
  under undersökningen och inte fanns i planen från början – **ta bort `namn` ur varje
  `lasteAv`-post** (`{uid, namn, tidpunkt}` → `{uid, tidpunkt}`, `useLaskvittering.js`).
  Namnet var ren duplicering: `RutinKort.jsx`/`AnslagKort.jsx` har redan organisationens
  användarlista laddad som en separat prop och kan slå upp namnet från `uid` (samma
  lösning tillämpad konsekvent på BÅDA `lasteAv`-användningarna, rutiner och anslag – inte
  bara rutiner, eftersom de delar exakt samma datamodell och skrivfunktion). Ingen ny
  collection, ingen migrering, inga regeländringar (`bararForandrarFalt(['lasteAv'])` bryr
  sig inte om den interna formen på varje post), `kompetensStatus.js`/`veckansRepetition.js`
  (som båda genuint behöver `tidpunkt` per person, se undersökningen) helt orörda.

  **Uppmätt effekt (samma harness som 60a, `prestandaOrg`, 2 000 rutiner, kall inloggning):**
  77,3 MB → **36,0 MB, en minskning med 53 %** – större än det ~30–40 % som uppskattades i
  förväg, eftersom `namn`-strängarna (`"Testperson 123"`, ~15–20 byte) utgjorde en större
  andel av varje kvitteringspost än väntat relativt `{uid, tidpunkt}`s ~25–30 byte.
  `innehall`/`steg`/`kviss` finns kvar oförändrade – 36 MB är fortfarande betydande, men det
  är den ärliga, uppmätta siffran för vad den HÄR åtgärden faktiskt gav, inte ett löfte om
  att problemet är löst i sin helhet.

  **Testat:** `npm run lint`/`build`/`npx vitest run` gröna (130/130 – befintliga tester i
  `kompetensStatus.test.js`/`veckansRepetition.test.js`/`innehallshalsa.test.js` använde
  redan `{uid, tidpunkt}` utan `namn`, vilket bekräftar i efterhand att `namn` aldrig
  behövdes av logiken, bara av en tidigare (nu borttagen) direktvisning). Inga
  `functions/index.js`-/regeländringar denna gång, så `test:functions`/`test:rules` kördes
  inte om.

  **Struket, inte bara "inte gjort":** en fullständig listvyprojektion (alternativ i/ii från
  originaltexten) är inte längre rekommenderad som nästa steg i den här formen – premissen
  den byggde på (att listan och "öppna rutinen" är olika vyer) stämmer inte med hur appen
  faktiskt är byggd. Om bandbredden vid en verklig pilotorganisations volym fortfarande är
  ett problem efter 60c, är rätt nästa fråga "ska Sektionssida pagineras/virtualiseras" –
  ett UX-beslut för ägaren, inte en teknisk detalj att besluta i en kodsession.
- **60c – Filtrera bort papperskorg och arkiv i frågan, inte i klienten.** `useRutiner`
  hämtar mjukraderade och arkiverade rutiner och kastar dem i JavaScript. Med
  `where("borttagen", "!=", true)` finns en känd fälla: **Firestore utesluter dokument som
  saknar fältet helt** (samma sak som redan är dokumenterad i `kontrolleraKvitteringsfrister`).
  Kräver alltså att fältet backfillas till `false` på alla befintliga rutiner först – ett
  migreringssteg, inte en enradsändring. Skriv ut det i planen så att nästa session inte
  faller i fällan.
- **60d – Sökindexet.** *Villkorat av 60a.* Om Fuse-bygget är den dyra delen: bygg indexet en
  gång och dela det (kontext/`useRef`) i stället för per konsument, alternativt flytta det
  till en Web Worker så att huvudtråden inte fryser. Rör inte träffkvaliteten – sökningen är
  produktens mest använda funktion och en tyst försämring där är värre än en långsam
  indexering.

### 60a – Resultat (2026-08-10)

Uppmätt mot Firestore-/Auth-emulatorn (`prestandaOrg`, 200 användare, en superadmin loggar in
i en HELT KALL webbläsarkontext – ingen `persistentLocalCache`-data sedan tidigare, alltså
det dyraste tänkbara fallet):

| Rutiner | Tid till interaktiv startsida | Fuse-byggtid | Överförd data (kall inloggning) | Firestore-läsningar (kall, analytiskt) |
|---|---|---|---|---|
| 500 | 1 007 ms | 1,7 ms | 16,5 MB | ~525 |
| 1 000 | 923 ms | 1,1 ms | 41,2 MB | ~1 025 |
| 2 000 | 918 ms | 0,9 ms | 77,3 MB | ~2 025 |

**Metodanmärkning, värd att känna till innan siffrorna återanvänds:** den överförda
datamängden gick INTE att mäta genom att summera `content-length`-headern (Firestores
Listen/Write-kanaler svarar chunked, utan den headern) och inte heller genom att läsa
`response.body()` (Firestores WebChannel håller en enda långlivad förbindelse öppen för
realtidsdata, så den löser sig aldrig under en session). Båda gav samma (felaktiga) totalsumma
oavsett rutinantal första gången detta kördes. Den tillförlitliga metoden – samma som Chrome
DevTools Network-flikens "Transferred"-kolumn – är CDP:s `Network.dataReceived`, som eldar
löpande i takt med att bytes faktiskt anländer. Skriv in det här om siffrorna någonsin
återanvänds med ett annat verktyg. Firestore-läsningarna är beräknade analytiskt (rutinantal +
en liten konstant för användar-/organisationsdokument och de små samlingarna), inte uppmätta
via nätverket – Firestores egen fakturering räknar exakt så (1 läsning per dokument i en
lyssnares INITIALA ögonblicksbild), så det är en korrekt siffra, bara inte en direkt
instrumenterad.

**Slutsats per mätvärde:**

- **Tid till interaktiv och Fuse-byggtid: GODKÄNT, ingen åtgärd.** Under en sekund respektive
  under 2 millisekunder även vid 2 000 rutiner – i praktiken oberoende av rutinantalet i det
  här spannet. **60d (webbworker för sökindexet) är därmed INTE nödvändigt** – Fuse-bygget är
  inte den dyra delen.
- **Firestore-läsningar/kostnad: GODKÄNT, ingen åtgärd.** Appen använder redan
  `persistentLocalCache` (`src/firebase/config.js`) – en andra inloggning på SAMMA enhet
  synkar bara ändrade dokument sedan senast, inte hela samlingen igen. Den dyra kalla
  synkroniseringen (~2 025 läsningar vid 2 000 rutiner) sker alltså en gång per (användare,
  enhet), inte varje session. Även ett pessimistiskt antagande – alla 40 användare tvingas
  till en kall omsynk en gång i månaden (ny enhet, rensad webbläsarcache, privat läge) – ger
  ~81 000 läsningar/månad vid 2 000 rutiner, långt under en (1) krona i månadskostnad enligt
  Googles publicerade Firestore-läsningspris. Den löpande kostnaden domineras i praktiken av
  ANTAL ÄNDRINGAR × antal aktiva lyssnare, inte av samlingens totala storlek.
- **Överförd datamängd: DET ENDA MÅTTET SOM INTE ÄR HELT GODKÄNT.** 16,5 → 41,2 → 77,3 MB
  skalar ungefär linjärt med rutinantalet. 77 MB vid en kall förstagångsinloggning är mycket
  för en app som ska fungera över sjukhus-wifi eller mobilnät på en akutmottagning – detta är
  DEN siffra som gör att **60b (trimma listvyns nyttolast) är befogat**, inte bara en
  teoretisk möjlighet. En sidoupptäckt under mätningen, värd att lägga till 60b:s omfattning:
  **`lasteAv`-arrayen (kvitteringar) kan vara lika stor eller större än `innehall`/`steg`/
  `kviss` tillsammans** för en populär rutin (upp till ~170 kvitteringsposter × ~70 byte
  vardera ≈ 12 KB, jämfört med `innehall`s typiska 1,5–3 KB) – 60b:s ursprungliga fältlista
  (`innehall`, `steg`, `kviss`, `externaKallor`) missade den. En listvyprojektion måste
  utesluta `lasteAv` också, annars är vinsten liten.

**Ärlig avvikelse från "Klart när"-kriteriet nedan:** planen sa att mätningen skulle jämföras
mot "en gräns som skrivits ned i planen i förväg" – ingen sådan gräns skrevs ned innan
mätningen kördes (ett eget premisskontroll-hål, upptäckt i efterhand snarare än undvikt i
förväg). Bedömningen ovan är därför gjord i efterhand med sunt förnuft (vad som är rimligt för
en app som ska fungera på ett mobilnät på en akutmottagning), inte mot en förutbestämd siffra.

**Rekommendation, inte body av arbete:** 60a:s eget resultat pekar på 60b som motiverat och
60c som ett billigt, lågrisk komplement (filtrera bort papperskorg/arkiv server-side snarare
än att skicka ner dem och kasta dem i klienten – samma "onödig nätverkstrafik"-problem som
60b, fast för ett annat skäl). 60d stryks som onödigt, bekräftat genom mätning snarare än
antaget. 60b/60c är INTE byggda i den här sessionen – bara mätta och rekommenderade, eftersom
uppdraget var specifikt "Etapp 60a".

**Testat:** `npm run lint`/`build`/`npx vitest run` gröna (inga produktionsfiler ändrade –
`src/hooks/useSokindex.js` instrumenterades TILLFÄLLIGT med `performance.mark`/`measure` för
Fuse-byggtidsmätningen och återställdes till exakt ursprungligt skick innan commit, verifierat
med en tom `git diff`). De två nya skripten (`scripts/prestandaseed.mjs`,
`scripts/prestandamat.mjs`) är committade som återanvändbara mätverktyg för nästa gång
volymen behöver mätas om (t.ex. efter 60b/60c, eller vid en verklig pilotorganisations
faktiska rutinantal).

**Klart när:** samma tre mätvärden som i 60a är körda igen mot 2 000 rutiner och ligger inom
en gräns som skrivits ned i planen i förväg – eller när 60a visat att inget behövde göras.
**✅ Uppfyllt för tid-till-interaktiv/Fuse-byggtid/Firestore-kostnad (inget behövde göras).**
**Överförd datamängd delvis åtgärdad av 60b** (77,3→36,0 MB, se §60b) – 60c kvarstår som
rekommenderat, ej byggt, lågriskkomplement. En fullständig lösning (paginering/
virtualisering av Sektionssida) är struken som fel omfattning för den här etappen, se 60b:s
egen slutsats.

---

## Etapp 61 – Underhållbarhet och testluckor

**Varför:** fynd 5. Ingen användare märker den här etappen. Den handlar om att nästa etapp
ska gå att bygga utan att först läsa 4 600 rader, och om att två utils med dataförlustrisk
faktiskt har test.

**Modul:** ingen.

- **61a – Dela `functions/index.js`.** Samma behandling som `Admin.jsx` fick i Etapp 8c, och
  samma motivering. Föreslagen indelning efter domän, inte efter storlek:
  `epost.js`, `organisationslivscykel.js` (etablering/paus/radering/support),
  `revisionslogg.js`, `klinikstod.js`, `ai-import.js`, `schemalagt.js`, `notiser.js`,
  och ett `gemensamt.js` för `hamtaAnvandarInfo`/`kravModul`/`kontrolleraOchOkaHastighet`/
  `loggaRevision`. **Ren flytt, noll beteendeändring** – och krav 24 gäller: fullt testsvep
  före och efter, diffen ska gå att läsa som förflyttning. Behåll `index.js` som en tunn fil
  som bara re-exporterar, så att `firebase deploy` och de 32 testfilernas `require`-sökvägar
  fortsätter fungera oförändrade.
- **61b – Testa det som kan tappa data.** `offlineKo` (offlinekön – en tappad post är en
  förlorad kvittering eller bristanmälan som användaren tror gick fram) och
  `checklistFramsteg` först. Därefter `introduktionProgress`, `kvartal`, `senastBesokta`.
  Rena funktioner, ingen Firestore-mockning – samma mönster som `valkomstchecklista.test.js`.
- **61c – E2E för kioskläget.** Etapp 55 byggde en ny inloggningsväg med en egen
  ruttbegränsning och en automatisk återgång, och har noll e2e-täckning. Minst: en
  kiosk-roll kan nå `/akutlage` men studsar från `/profil`, och PIN-dialogen öppnas från
  Mer-menyn. Lägg samtidigt till kiosk i `rokprov.spec.js` rollista.

**Klart när:** ingen fil i `functions/` är över ~800 rader, de fem utils har test, och
kioskläget täcks av e2e.

---

## Etapp 62 – Från mätvärde till åtgärd

**Varför:** det här är planens enda riktiga funktionsetapp, och den bygger på en observation
snarare än en önskelista. Appen mäter redan ovanligt mycket: kvitteringsgrad, tid-att-hitta,
innehållshälsa, personalpuls, dubbletter, **sökningar utan träffar**. Nästan allt presenteras
som en siffra eller en lista i adminpanelen. Det som saknas är steget från *"här är ett
problem"* till *"här är knappen som löser det"*.

`PITCH.md` säljer redan detta som **"datadriven prioritering – ledningen ser exakt vilka
rutiner som saknas och efterfrågas mest"**. I dag är det en lista man läser och sedan gör
något åt någon annanstans. Att stänga den loopen är billigt, eftersom all mätning redan finns.

**Modul:** Operations.

- **62a – "Skapa rutin från en sökning utan träff".** Den starkaste signalen appen har om en
  kunskapslucka är någon som sökte och inte hittade. I dag är det en rad i
  `SokningarUtanTraffarSektion`. Lägg till en knapp som öppnar rutinformuläret med sökordet
  som förifylld titel och området förvalt – och som, när rutinen publiceras, markerar
  sökluckan som åtgärdad. Det gör "Ni sa, vi gjorde"-tanken från Etapp 41a sann även för
  sökningar, inte bara för ändringsförslag.
- **62b – En veckopuls som faktiskt är en handlingslista.** `ETAPPLAN3.md` Etapp 16
  ("veckopuls") har stått öppen sedan den skrevs, blockerad på ett ägarbeslut om omfattning.
  Fatta beslutet genom att göra den minsta meningsfulla versionen: **inget nytt mätvärde**,
  bara de befintliga signalerna sorterade efter vad som är värt att göra först
  (utgångna rutiner före obesvarade förslag före sökluckor), med en direktlänk per rad. Om
  Brevo-nyckeln finns kan den skickas som e-post; annars är den en vy. Det avslutar en punkt
  som stått öppen i månader utan att bygga något nytt att underhålla.
- **62c – Hälsosiffran ska kunna svara "vad gör jag nu?".** `InnehallshalsaSektion` visar
  redan siffran med sin nedbrytning (bra, och medvetet – se `PITCH.md`). Nästa steg är att
  varje rad i nedbrytningen får en åtgärd: "saknar ägare" → tilldela ägare direkt i listan;
  "bör granskas" → starta en granskningsrunda med exakt de rutinerna förvalda (funktionen
  finns redan, Etapp 37b).

**Klart när:** de tre vanligaste sakerna en redaktör ser i adminpanelen går att åtgärda utan
att lämna vyn.

---

## Etapp 63 – Gör de mänskliga punkterna enkla att avsluta

**Varför:** `OPPNA-PUNKTER.md` har tolv rader. **Ingen av dem är blockerad av kapacitet** –
alla väntar på ett beslut, en bokning eller ett avtal. Den externa granskningen 2026-08-04
pekade ut exakt det mönstret (fem punkter stod stilla i tre veckor medan ett tjugotal etapper
byggdes), och registret skapades för att göra dem synliga. Det har fungerat delvis: de är
synliga, men de flesta står kvar.

Det här är inte en uppmaning att bygga mer. Det är en etapp för att göra det billigare för
ägaren att stänga dem.

**Modul:** ingen.

- **63a – Skilj på vad som kostar tio minuter och vad som kostar en bokning.** Fyra av tolv
  rader är rena ifyllnadsuppgifter (`INCIDENT-CHECKLISTA.md`s tre tomma kontaktrader,
  `TILLGANGLIGHETSREDOGORELSE.md`s datum och juridiska namn). De har stått öppna sedan
  2026-08-01 trots att registret självt noterar *"Inget – tar tio minuter, ingen blockering"*.
  Gruppera registret efter **vad som faktiskt krävs** (tio minuter vid tangentbordet / ett
  beslut / en bokad människa / ett tecknat avtal) i stället för efter planfil. En ägare som
  har tio minuter ska kunna se vad som ryms i dem.
- **63b – Förbered pilotpaketet så långt det går utan en pilot.** `ETAPPLAN10.md` Etapp 52
  har väntat på bokad tid sedan den skrevs. Allt som inte kräver en riktig människa kan
  färdigställas i förväg: introduktionsmaterial för en redaktör, ett förslag på
  pilotupplägg med de tre måtten från `PITCH.md`, och en checklista för vad som ska mätas
  före/efter. Då är det som återstår en kalenderbokning, inte ett arbetspass.
- **63c – Ta ställning till de tre beslutspunkterna som har en färdig rekommendation.**
  SSO-protokoll (rekommendation: OIDC), påminnelsemejlens förval (rekommendation: på för
  tilldelade uppgifter, av för övrigt) och 54c/54d. Alla tre har redan ett analyserat svar i
  `ETAPPLAN11.md` – de behöver bara ett ja eller nej, och sedan en rad i `BESLUTSLOGG.md`.
  Ett nej är ett lika bra utfall som ett ja; det som kostar är att raden står kvar.

**Klart när:** `OPPNA-PUNKTER.md` är grupperad efter insatstyp, de fyra tiominutersraderna är
borta, och de tre beslutspunkterna har ett svar i `BESLUTSLOGG.md`.

---

## Beslutspunkter som kräver ägaren

| # | Fråga | Varför det inte är mitt beslut | Min rekommendation |
|---|---|---|---|
| 1 | ~~59a: alternativ A eller B?~~ **Avgjort genom att bygga (2026-08-10).** Frågan ställdes till ägaren men förblev obesvarad; bygget gick vidare med planens egen rekommendation (B) snarare än att stå still. **Fortsatt öppet: ska A (ett fullvärdigt logistik-rutinområde) byggas senare?** | Produktfråga – hör logistikrutiner hemma i produkten, eller är logistik enbart ett förrådsområde? | Oförändrad rekommendation: bygg A först när en konkret kund efterfrågar det. |
| 2 | **Ska Etapp 60b–60d byggas innan en kund med stor datamängd finns?** | Avvägning mellan att bli överraskad och att optimera i onödan. | **Kör 60a nu, vänta med resten.** Mätningen kostar en dag och tar bort gissningen. Om siffrorna är bra har vi ett svar att ge en upphandlare; om de är dåliga vill vi veta det före piloten, inte under. |
| 3 | **Ska Etapp 61a (dela `functions/index.js`) göras nu eller vid nästa större backendarbete?** | Ren underhållsinvestering utan synligt utfall – ett tempoval. | **Nu, medan inget nytt byggs ovanpå.** Refaktorering är billigast när ingen etapp pågår samtidigt, och nästa plan blir lättare oavsett vad den innehåller. |
| 4 | **Etapp 62b: ska veckopulsen skickas som e-post eller bara vara en vy?** | Beror på om Brevo-avtalet tecknas (`OPPNA-PUNKTER.md`). | **Bygg vyn först, e-posten som ett tillägg.** Vyn fungerar oavsett nyckel; e-postutskicket kopplas på när kanalen är i skarp drift. |

---

## Föreslagen ordning

1. **✅ Etapp 59 – KLAR (2026-08-10).** Tre kända fel i produktionsgrenen rättade, varav ett
   som gjorde hälsosiffran missvisande för varje ny organisation som etableras. 59b stänger
   dessutom en affärsspärr (kiosk utan Operations).
2. **✅ Etapp 60a – KLAR (2026-08-10).** Mätningen visade att 60d inte behövs (Fuse-byggtid
   <2 ms även vid 2 000 rutiner) men att 60b/60c är motiverade (77 MB vid en kall
   förstagångsinloggning med 2 000 rutiner). 60b/60c rekommenderade men INTE byggda ännu.
3. **Etapp 61 när inget annat pågår** – störst nytta, minst risk, om den inte konkurrerar med
   ett funktionsbygge.
4. **Etapp 62 när 59 är stängd.** Det är den enda etappen som ger en kund något nytt att se,
   men den bygger på mätvärden som måste räkna rätt först (krav 23) – därför efter 59a.
5. **Etapp 63 löpande**, parallellt med allt annat. Den kräver ingen kodkapacitet.

---

## Sammanfattning

| Etapp | Innehåll | Modul | Risk | Status |
|---|---|---|---|---|
| **59** | Rätta logistikrutinerna, gata kioskläget, beroendehygien | Ingen/Operations | Låg | ✅ **HELT KLAR (2026-08-10)** – 59a–59c alla byggda |
| **60a** | Mät prestanda med 500–2 000 rutiner | Ingen | Låg | ✅ **KLAR (2026-08-10)** |
| **60b** | Krympa `lasteAv` (tog `namn` bort) | Ingen | Låg | ✅ **KLAR (2026-08-10)** – 77,3→36,0 MB (−53 %). Full listvyprojektion struken, se §60b |
| **60c** | Serverside-filtrering (papperskorg/arkiv) | Ingen | Medel | Rekommenderat, ej byggt |
| ~~**60d**~~ | ~~Sökindex i webbworker~~ | – | – | **Struket – 60a mätte Fuse-byggtid till <2 ms, inte den dyra delen** |
| **61** | Dela `functions/index.js`, testluckor, kiosk-e2e | Ingen | Låg–medel | Förslag |
| **62** | Sökluckor → rutin, veckopuls, åtgärdbar hälsosiffra | Operations | Låg | Förslag |
| **63** | Gruppera öppna punkter, förbered pilot, tre beslut | Ingen | Ingen | Förslag – kräver ägaren |

Se `ETAPPLAN13.md` för det fristående baspaket-förslaget (Etapp 64) – medvetet hållet utanför
den här tabellen, se motiveringen i inledningen ovan.

---

## Vad jag INTE föreslår, och varför

Samma avsnitt som `ETAPPLAN11.md` har, av samma skäl: så att en framtida session inte
föreslår dem igen utan att känna till invändningen.

- **Flerspråkigt gränssnitt (i18n).** Det finns inget språkstöd alls i dag, och svensk
  akutsjukvård har personal som är tryggare på engelska. Ändå: det är ett stort ingrepp i
  varje komponent, och det verkliga språkproblemet sitter i *rutininnehållet* (som kunden
  skriver), inte i knapptexterna. Ett översatt gränssnitt runt en svensk rutin löser inte
  det. Vänta tills en kund uttryckligen efterfrågar det.
- **Fler mätvärden.** Appen mäter redan sex saker och har noll verkliga veckor av data. Ett
  sjunde mätvärde före den första riktiga användaren är att bygga i mörker – det är därför
  Etapp 62 handlar om att *använda* de befintliga, inte lägga till ett nytt.
- **Realtidslarm (Etapp 32b) och täckningsbidrag per kund (48c).** Båda kräver GCP-
  faktureringsexport till BigQuery, ett ägarbeslut med en kostnad – inte en kodfråga. De hör
  hemma i `OPPNA-PUNKTER.md`, där de redan står, inte i en etapplan.
- **Ombyggnad av kvitteringsmodellen** (`lasteAv` som array på rutindokumentet). Vid 200
  anställda är arrayen ~20 kB – långt under Firestores 1 MB-gräns – och `arrayUnion` klarar
  belastningen. Det är en verklig gräns men inte en nära förestående, och en flytt till en
  subcollection skulle röra kvitteringsgraden, kompetensmatrisen och hälsosiffran samtidigt.
  Rör den inte förrän en kund passerar ~500 anställda.
- **Etapp 54c (gemensamma rutiner mellan enheter).** Oförändrad bedömning från
  `ETAPPLAN11.md`: envägsdörr, kräver en konkret andra enhet först. Den här planen ändrar
  inget i det.
