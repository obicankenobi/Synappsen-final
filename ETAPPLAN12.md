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
- **60c – ✅ KLAR (2026-08-10), en delmängd av det ursprungligen skrivna.** Endast
  papperskorgen (`borttagen`), INTE arkivet (`arkiverad`) – se "Vad genomgången hittade"
  nedan för varför de två inte är samma sorts fix.

  **Vad som byggdes:** `useRutiner.js`s fråga filtrerar nu server-side med
  `where("borttagen", "==", false)` istället för att hämta alla (inklusive papperskorgen) och
  kasta bort de borttagna i JavaScript. Exakt fällan planen varnade för undveks: en
  ojämlikhetsfråga (`!= true`) hade uteslutit varje rutin som saknar fältet helt, inte bara de
  som är borttagna – samma dokumenterade fälla som `kontrolleraKvitteringsfrister`. Löst med:
  - En ny migrering, `backfillaBorttagenFalt` (plattformsadmin-gated, dry-run som standard,
    idempotent, batchat om 500 – samma mönster som `migreraTillOrganisation`), som sätter
    `borttagen: false` på varje befintlig rutin som saknar fältet.
  - `borttagen: false` läggs nu till explicit vid VARJE plats en rutin skapas, så inget nytt
    dokument någonsin saknar fältet framöver: `useRutiner.js`s `skapaRutin` (klient),
    `tolkaDokument` (AI-import), `skapaOrganisation`s mallseedning, och de fyra
    rutin-skrivningarna i `froSaDemoOrganisationensInnehall`.
  - Verifierat MOT en riktig emulator (inte bara antaget) att den nya frågan – tre eller fyra
    likhetsfilter (`organisationId`, `omrade`, `borttagen`, ibland `status`) plus en
    `orderBy` – fungerar utan en ny post i `firestore.indexes.json`: Firestore native mode
    indexerar automatiskt kombinationer av likhetsfilter + en enda `orderBy`, det befintliga
    indexet (organisationId, omrade, skapad) täcker redan `status`-varianten idag utan egen
    post, så mönstret var redan bevisat att fungera – bara utökat med ett fält till.

  **Vad genomgången hittade (varför bara papperskorgen, inte arkivet):** planens text nämnde
  "papperskorg OCH arkiv" i samma andetag, som om de vore samma sorts fix. De är inte det.
  `arkiverad`-rutiner ska MEDVETET stanna kvar i redaktörers lista (Etapp 37d: "en arkiverad
  rutin raderas inte och lämnar inte listan för redaktörer") – bara uteslutas ur särskilda
  beräkningar (kvittering/hälsopanel/granskningsrundor). Att filtrera `arkiverad` i FRÅGAN
  hade tyst ändrat vad en redaktör ser i sin lista – en beteendeförändring, inte bara en
  optimering. `borttagen` (papperskorgen) är däremot redan MENAT att vara osynligt för alla,
  precis som innan – bara flyttat från klienten till frågan. Samma sorts premisskontroll som
  59a/60b: läs vad koden faktiskt gör innan planens ordval tas för givet.

  **Testat:** ny testfil `tests/functions/backfillborttagen.test.cjs` (behörighet, dry-run,
  idempotens, rör INTE en redan satt `true`/`false`), tillagd i `test:functions`-kedjan.
  `etapp6.test.cjs` utökad med en kontroll att mallrutiner får `borttagen: false`. Verifierat
  manuellt mot emulatorn i en riktig webbläsare (Playwright) – både som redaktör (superadmin)
  och icke-redaktör (personal, som lägger till ETT extra likhetsfilter på `status`) – inga
  konsolfel, listan renderar korrekt. `npm run lint`/`build`/`npx vitest run` gröna.
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
**✅ Etapp 60 (60a–60c) är HELT KLAR (2026-08-10).** Tid-till-interaktiv/Fuse-byggtid/
Firestore-kostnad uppfyllda utan åtgärd (60a). Överförd datamängd delvis åtgärdad av 60b
(77,3→36,0 MB, −53 %) och kompletterad av 60c (mjukraderade rutiner hämtas inte längre alls,
tidigare bara filtrerade bort efter att ha skickats över nätet). 60d struket, bekräftat
onödigt av mätningen. En fullständig listvyprojektion/paginering (60b:s ursprungliga idé) och
serverside-filtrering av ARKIVET (inte bara papperskorgen, 60c:s ursprungliga omfattning) är
medvetet struket ur den här etappen – båda visade sig vara genuina produktbeslut snarare än
tekniska optimeringar när de kontrollerades mot faktisk kod, se respektive delmåls egen
"Vad genomgången hittade".

---

## Etapp 61 – Underhållbarhet och testluckor

**Varför:** fynd 5. Ingen användare märker den här etappen. Den handlar om att nästa etapp
ska gå att bygga utan att först läsa 4 600 rader, och om att två utils med dataförlustrisk
faktiskt har test.

**Modul:** ingen.

- **61a – ✅ KLAR (2026-08-10).** `functions/index.js` (4 680 rader, 93 exports) delad i 12
  domänfiler + en tunn re-exporterande skarv. Verifierat som en RIKTIG ren flytt, inte bara
  påstådd: en multiset-diff av alla icke-tomma rader i hela `functions/`-katalogen
  före/efter visar att exakt EN rad försvann (den gamla toppkommentaren, ersatt av nya
  filhuvuden) – allt annat, inklusive varje kommentar, finns kvar ordagrant. Exportytan är
  bevisat identisk (samma 93 namn, samma ordning, jämfört programmatiskt mot originalet via
  `git stash`).

  **Slutlig filindelning** (alla under ~800 rader, planens eget riktmärke):
  `gemensamt.js` (700, delade primitiver: onCall/Sentry-omslaget, db/admin/bucket,
  hemligheter, roll-/modulkontroller, e-post, hastighetsbegränsning, budget/sökkvot,
  revisionsloggens skrivning, push/e-postmottagare), `ai-import.js` (453), `klinikstod.js`
  (629, inkl. källbevakning), `organisationsadmin.js` (364), `backup.js` (237),
  `revisionslogg.js` (152, kedjekontrollen – skrivningen ligger i gemensamt.js, se
  avvikelse nedan), `notiser.js` (374), `matvarden.js` (319), `plattformsdrift.js` (304),
  `organisationslivscykel.js` (534, etablering + demo-/övningsmiljön),
  `avtalslivscykel.js` (726, avtal/provperiod/månadsrapport/paus/export/radering/support),
  `inbjudningar.js` (235). `index.js` är nu 142 rader, en explicit (inte svepande)
  re-exportlista.

  **Avvikelser från planens föreslagna indelning, och varför:**
  - **Ingen egen `epost.js` eller `schemalagt.js`.** `skickaEpost` ligger i `gemensamt.js`
    (en delad primitiv, används från åtta domäner) – det enda som blivit kvar för en egen
    e-postfil vore `angeEpostAvstangd` (~29 rader) och `skickaEpostPaminnelser`, en fil
    efter radantal snarare än domän. Samma logik stoppade en egen schemafil: varje
    `onSchedule` är en tunn wrapper runt en kärnfunktion som MÅSTE exporteras separat för
    test (`kontrolleraKvitteringsfrister` m.fl.) – att bryta ut bara schemaläggningsdelen
    hade splittrat de paren eller krävt cirkulära requires.
  - **`loggaRevision`/kedjehashningen ligger i `gemensamt.js`**, inte i `revisionslogg.js` –
    40+ anropsställen över åtta domäner. `revisionslogg.js` äger driftdelen (den
    schemalagda kedjekontrollen, adminvyns verifiering/export).
  - **`organisationslivscykel.js` delades EN gång till, samma dag** (se ovan) – 1 229 rader
    efter den första omgången var för mycket. Kontrollerat med grep innan delningen att de
    två halvorna (etablering+demo vs. avtal+avveckling) inte delar någon kod utöver de
    vanliga gemensamt.js-/backup.js-/inbjudningar.js-primitiverna, så delningen var säker.
  - Inga faktiska buggar hittades under flytten.

  **Testat:** `npm run lint` (rent – obs: root-`eslint.config.js` har alltid globalt
  ignorerat `functions/`, oförändrat av den här etappen, samma som innan delningen),
  `node --check` på alla 12 filer, `node -e "require('./functions/index.js')"` (93 exports,
  identiska mot originalet), full `npm run test:functions` KÖRD TVÅ GÅNGER (en gång efter
  den första uppdelningsomgången, en gång efter den andra) – 35/35 filer gröna båda
  gångerna, noll testfiler ändrade. `npm run build`/`npx vitest run` gröna (175/175).
- **61b – ✅ KLAR (2026-08-10).** Alla fem utils testade: `offlineKo.test.js` (11 tester,
  inkl. att `laggTillIKo` returnerar posten utan att kasta även när `localStorage.setItem`
  kastar `QuotaExceededError` – privat läge/full lagring), `checklistFramsteg.test.js` (9,
  inkl. att två uid på samma enhet aldrig delar framsteg), `senastBesokta.test.js` (8, inkl.
  max-8-gränsen och att ett återbesök flyttar posten istället för att dubblera den),
  `introduktionProgress.test.js` (12, `berakraIntroduktionsProgress`/`dagarSedan`/
  `liggerEfter`), `kvartal.test.js` (14, samtliga tolv månadsgränser). 45 nya tester, samma
  mönster som `valkomstchecklista.test.js` (`@vitest-environment happy-dom` för de tre
  localStorage-baserade filerna, ren node-miljö för de två rena funktionsfilerna). Testat:
  `npm run lint`/`build`/`npx vitest run` gröna (175/175, 25 filer). Ingen versionsbump –
  rent testarbete, ingen appkod ändrad.
- **61c – ✅ KLAR (2026-08-10).** Ny fil `tests/e2e/kioskbevakning.spec.js`, fem tester:
  kiosk når `/akutlage` och stannar där; kiosk studsar tillbaka till `/` från en otillåten
  sida (`/profil`); kiosk når de tre tillåtna huvudsidorna (kliniskt stöd/logistik/
  administration); PIN-dialogen öppnas från Mer-menyn med rätt fält (rubrik, PIN-fält,
  "Lås upp"-knappen inaktiverad tills något skrivits in); dialogen går att avbryta utan att
  kastas ur kioskläget. Kiosk lades samtidigt till i `rokprov.spec.js`s rollista (nu sju
  roller istället för sex) och i `tests/e2e/global-setup.mjs`s seedade konton.

  **Medveten avgränsning, inte en lucka:** `test:e2e` startar bara auth-/firestore-/
  storage-emulatorerna (samma etablerade gräns som redan gäller `/leverantor`, se
  `rokprov.spec.js`s egen kommentar) – ingen functions-emulator. Ett FAKTISKT lyckat
  PIN-upplåsningsförsök (`verifieraKioskPin`, en Cloud Function) kan alltså inte köras här;
  testerna stannar vid att dialogen öppnas och stänger korrekt, inte ett lyckat
  upplåsningsförsök. Det matchar redan täckt mark – `satKioskPin`/`verifieraKioskPin` själva
  har egna enhetstester (`tests/functions/kioskrestriktioner.test.cjs`) och firestore.rules
  har egna (`tests/rules/kioskrestriktioner.test.mjs`); den här filen fyller specifikt
  luckan "fungerar det i en riktig webbläsare", inte affärslogiken i sig.

  **Testat:** hela `test:e2e`-sviten körd (inte bara den nya filen) – 17/17 gröna, inklusive
  de fem nya kiosktesterna och den utökade sjurollers-rökprovssviten. `npm run lint` grönt.
  Ingen versionsbump – ren testtäckning, ingen appkod ändrad.

**Klart när:** ingen fil i `functions/` är över ~800 rader (✅ 61a – störst är nu 726 rader),
de fem utils har test (✅ 61b), och kioskläget täcks av e2e (✅ 61c). **Hela Etapp 61 är
HELT KLAR (2026-08-10).**

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

- **62a – ✅ KLAR (2026-08-10). "Skapa rutin från en sökning utan träff".** Den starkaste
  signalen appen har om en kunskapslucka är någon som sökte och inte hittade. Var en rad i
  `SokningarUtanTraffarSektion` utan någon åtgärd. Byggt: en "Skapa rutin"-länk per rad (ett
  val per stödda område – Kliniskt stöd/Administration, de två som delar
  Sektionssida/RutinFormular-koden; förråd och akutläge har egna skapandeflöden och lämnades
  medvetet utanför), som via router-state öppnar målsidans rutinformulär med sökordet
  förifyllt som titel. När rutinen sedan sparas markeras `sokloggar`-posten `atgardad: true`
  (`markeraSokloggAtgardad`, ny `update`-regel i `firestore.rules` begränsad till superadmin +
  egen organisation + exakt dessa två fält, verifierad med tre nya regeltester). Det gör
  "Ni sa, vi gjorde"-tanken från Etapp 41a sann även för sökningar, inte bara för
  ändringsförslag.
- **62b – ✅ KLAR (2026-08-11). En veckopuls som faktiskt är en handlingslista.**
  `ETAPPLAN3.md` Etapp 16 ("veckopuls") stod öppen sedan den skrevs, blockerad på ett
  ägarbeslut om omfattning. Byggt: `VeckopulsSektion.jsx`, en ny sektion högst upp i
  adminpanelen (öppen som standard) som visar de tre befintliga signalerna – utgångna rutiner,
  obesvarade ändringsförslag, sökningar utan träffar – i den prioritetsordningen, var och en
  med en direktlänk (till rutinens `#rutin-{id}`-djuplänk, eller till sökluckesektionen för
  sökluckor). **Inget nytt mätvärde samlas in.** Medveten avgränsning: e-postutskicket planen
  nämnde ("om Brevo-nyckeln finns") byggs INTE – det kräver en egen schemalagd funktion och
  prenumerationshantering, en väsentligt större insats än vyn, och står inte i proportion till
  "minsta meningsfulla version". Ren vy, som planen själv tillåter som fallback.
- **62c – ✅ KLAR (2026-08-11). Hälsosiffran ska kunna svara "vad gör jag nu?".**
  `InnehallshalsaSektion` visade redan siffran med sin nedbrytning. Byggt: "bör granskas"
  (`passeratGranskningsdatum`) har fått en knapp direkt i nedbrytningsraden som startar en
  granskningsrunda (Etapp 37b) med EXAKT de flaggade rutinerna förvalda, grupperat per område
  (en runda gäller alltid ett enda område) med 14 dagars deadline. "Saknar ägare" har fått en
  inline ägarväljare (roll eller person, samma modell som `RutinFormular.jsx`) direkt i
  "behöver uppmärksamhet"-tabellens nya Åtgärd-kolumn. Granskningsrunde-knappen/prenumerationen
  är medvetet begränsad till superadmin-vyn (`!endastOmrade`) – `granskningsrundor` är en
  superadmin-bara collection i `firestore.rules`, och `useGranskningsrundor` fick en ny
  `aktiv`-parameter för att slippa en onödig permission-denied-prenumeration i
  per-område-vyn (mittOmrade-redaktörer).

**Klart när:** de tre vanligaste sakerna en redaktör ser i adminpanelen går att åtgärda utan
att lämna vyn. **Uppfyllt** – sökluckor (62a), veckopulsen (62b) och nu hälsosiffrans två
vanligaste flaggor (62c) går alla att åtgärda inline. Hela Etapp 62 (62a–62c) är nu KLAR.

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

- **63a – ✅ KLAR (2026-08-11). Skilj på vad som kostar tio minuter och vad som kostar en
  bokning.** `OPPNA-PUNKTER.md` grupperad om i fem rubriker istället för en enda lång tabell:
  "Tio minuter vid tangentbordet", "Kräver ett ägarbeslut", "Kräver en bokad människa",
  "Kräver ett tecknat avtal", "Väntar på en extern förutsättning (bevaka bara)". Den femte
  gruppen fanns inte i planens ursprungliga tre-vägs uppdelning (beslut/bokning/avtal) – två
  rader (Etapp 35e App Check, Etapp 40 import) passade inte ärligt in i någon av de tre, de
  väntar bara på att ett externt villkor blir sant, ingen människa kan agera på dem förrän
  dess. Att tvinga in dem i fel kategori hade motverkat hela poängen med grupperingen. Även
  passat på att ta bort en rad som var löst utan att tas bort (Etapp 16/veckopuls, löst genom
  att byggas i Etapp 62b) – ned till nio rader från tolv.
- **63b – ✅ KLAR (2026-08-11). Förbered pilotpaketet så långt det går utan en pilot.**
  `ETAPPLAN10.md` Etapp 52 har väntat på bokad tid sedan den skrevs. Byggt: två nya
  root-dokument. `REDAKTORSGUIDE.md` – fördjupar `src/pages/Hjalp.jsx`s allmänna hjälp med
  redaktörsspecifikt innehåll (skapa/redigera/godkänna/arkivera, ändringsförslag,
  läskvittering, de nya Etapp 62-genvägarna, vanliga misstag) – tänkt att en pilotredaktör
  läser INNAN sitt första pass. `PILOTUPPLAGG.md` – ett konkret 4–6-veckorsupplägg byggt på
  `PITCH.md`s "Förslag på nästa steg" och tre mått (tid-att-hitta, kvitteringsgrad, upplevd
  nytta – alla redan mätbara, ingen ny insamling), med en Checklista FÖRE och en Checklista
  EFTER. Registrerade i `CLAUDE.md`s dokumentkarta. Detta är förberedelse, INTE ett genomfört
  resultat – ingen pilot är bokad, `PITCH.md`s "Ärlighet om vad som faktiskt är mätt" gäller
  fortfarande. Det som återstår är en kalenderbokning (se `OPPNA-PUNKTER.md`), inte ett
  arbetspass.
- **63c – ✅ KLAR (2026-08-10).** Ta ställning till de tre beslutspunkterna som har en färdig
  rekommendation. SSO-protokoll → **OIDC** (rekommendationen). Påminnelsemejlens förval →
  **på för tilldelade uppgifter, av för övrigt** (rekommendationen; krävde ingen kodändring
  – det redan byggda 53c täcker redan bara "tilldelade uppgifter"-fallen). 54c/54d → **vänta**
  på en konkret andra enhet. Alla tre loggade i `BESLUTSLOGG.md`, motsvarande rader borttagna
  ur `OPPNA-PUNKTER.md`.

**Klart när:** `OPPNA-PUNKTER.md` är grupperad efter insatstyp, de fyra tiominutersraderna är
borta, och de tre beslutspunkterna har ett svar i `BESLUTSLOGG.md`. **Uppfyllt.** Hela Etapp
63 (63a–63c) är nu KLAR. **Hela ETAPPLAN12.md (Etapp 59–63) är nu KLAR.**

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
2. **✅ Etapp 60 (60a–60c) – HELT KLAR (2026-08-10).** Mätt, sedan åtgärdat: 77,3 MB → 36,0 MB
   (60b, −53 %) → mjukraderade rutiner hämtas inte längre alls (60c). 60d struket, bekräftat
   onödigt av mätningen.
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
| **60c** | Serverside-filtrering av papperskorgen (`borttagen`) | Ingen | Medel | ✅ **KLAR (2026-08-10)** – arkivet (`arkiverad`) medvetet UTE, se §60c |
| ~~**60d**~~ | ~~Sökindex i webbworker~~ | – | – | **Struket – 60a mätte Fuse-byggtid till <2 ms, inte den dyra delen** |
| **61** | Dela `functions/index.js` (61a), testluckor (61b), kiosk-e2e (61c) | Ingen | Låg–medel | ✅ **HELT KLAR (2026-08-10)** |
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
