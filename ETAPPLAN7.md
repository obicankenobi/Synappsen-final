# ETAPPLAN 7 – Gränssnittsförnyelse

**✅ ANTAGEN 2026-08-02.** Utgångsläge v5.63.0, efter att Etapp 37–39 (`ETAPPLAN6.md`) blivit
klara. Etapp 42.

**Detta är den AKTIVA planen för nytt arbete.** `ETAPPLAN6.md` är inte stängd – dess
kvarvarande punkter (Etapp 40, villkorad av en konkret ny kund, och Etapp 41, lågt hängande
frukt som kan tas när som helst) är **inte blockerade av kapacitet**, bara av att den här
planen kom i vägen kronologiskt. Ta dem närhelst det passar; bygg allt nytt UI-arbete härifrån.

> **Bakgrund:** användaren tog fram två fristående, AI-genererade UI-designutkast för
> Synappsen ("Nordic Clinical" – en lugn, kortbaserad stil, och "Synappsen Redesign" – en
> tätare, mer klinisk stil med en tillhörande mobilmockup) och bad om en jämförelse. Den här
> planen är sammanställningen av den granskningen: vilka delar av respektive utkast som är
> värda att bygga, i vilken ordning, och vad som medvetet väljs bort. Ingen av de två
> mockuperna ska adopteras i sin helhet – se premisskontrollen nedan för varför.

---

## Premisskontroll utförd före antagande (genomgående krav 8)

Båda mockupernas centrala påståenden är kontrollerade mot faktisk kod 2026-08-02, innan planen
antogs:

| Påstående i mockuperna | Verifierat |
|---|---|
| Färger/badge-system är "lyft direkt från `src/index.css`/`utils/badge.js`" (mockupernas egna `github.md`-anteckningar) | ⚠️ **Delvis falskt.** Stickprov visar att paletten är INSPIRERAD av de riktiga tokens, inte identisk. Ingen av mockuperna får antas vara pixel-facit för färg/spacing – se 42e. |
| En samlad, domänöverskridande godkännandekö ("Godkännanden") | ❌ **Finns inte idag.** Godkännande sker per sektion via `godkannAllaUtkast()` i `Sektionssida.jsx` ("Godkänn alla"-knappen), en kö per område – inte en gemensam vy. Det här är alltså en GENUIN ny funktion, inte en flytt av något befintligt. |
| En flytande, alltid synlig Akut-knapp | ❌ **Finns inte idag.** `hem__akutlage-knapp` existerar bara på `Hem.jsx` – försvinner så fort man navigerar till en sektionssida. |
| Egen nav-post för Sök | ❌ Sök är idag ett inbäddat fält (`SokFalt.jsx`) på Hem, inte en egen route/nav-post i `BottomNav.jsx`. |
| Egen nav-post för Nyheter i huvudnavigationen | ❌ `/nyheter`-routen finns (`App.jsx:192`), men syns inte i `BottomNav.jsx` – nås idag via en länk någon annanstans. |
| Bulk-godkänn/markera flera i listvyer | ✅ Finns delvis redan (`godkannAllaUtkast`, samt bulk-hantering byggd i Etapp 38 för ändringsförslag i `ForslagSektion.jsx`) – 42b generaliserar mönstret, bygger inte om det från grunden. |
| Mörkt läge (växlare i Design 2) | ⚠️ **Overifierat.** Växlaren finns strukturellt i mockupen men gick inte att bekräfta att den faktiskt växlar färger vid granskningen (Playwright-testet klickade troligen fel element). Anta INTE att funktionen är komplett förrän den testats i mockupen själv. |

**Slutsats:** ingen av mockuperna är en färdig ritning att implementera rakt av. De är två
källor att ta enskilda, namngivna beslut ifrån (nedan) – resten av premisskontrollen (exakta
hex-värden, spacing-skala) görs som en del av 42e, INNAN något annat i planen börjar byggas.

---

## Modul: Core (UI/navigation), gäller alla tre domäner

# Etapp 42 – Gränssnittsförnyelse

**Varför:** Två oberoende granskade designutkast pekar båda på samma underliggande problem –
dagens listvyer (titel + status + datum) tvingar fram ett extra klick för att se innehåll,
ägare eller sammanhang, och godkännande sker spritt per sektion istället för samlat. Det är
samma typ av friktion `ETAPPLAN6.md` Etapp 38 redan löste för ändringsförslag; den här planen
generaliserar samma princip till nya utkast och till gränssnittet i stort.

- **42a – Innehållstätare listvyer.** Varje rutinkort i domänvyerna (Kliniskt stöd/Logistik/
  Administration) visar, utöver titel/status/datum: en kort förhandsvisning av innehållet,
  ägare + roll (redan tillgängligt via `agare`-fältet), taggar/kategori som ett filter utöver
  domänen, och bulk-knappar ("Markera flera") byggda på samma mönster som redan finns i
  `ForslagSektion.jsx`.
  **Ta INTE** med Design 2:s inline Godkänn/Neka-knappar i dessa listvyer – se 42b för varför.
- **42b – Samlad, domänöverskridande godkännandekö.** En ny sida/route ("Godkännanden") i
  huvudnavigationen med badge-räknare, som listar ALLA väntande utkast tvärs över domäner i en
  enda kö – med samma innehållstäthet som 42a (fulltext, ägare, datum, taggar), inte bara
  titel. Godkännande/avvisning sker ENDAST här, inte längre inline i de vanliga listvyerna –
  annars uppstår två parallella vägar att godkänna samma utkast. Bygger vidare på det
  redan existerande mönstret i `Sektionssida.jsx`/`ForslagSektion.jsx`, men gör kön
  domänöverskridande istället för en kö per sektion.
  **Roll-/behörighetskrav oförändrat:** vem som får godkänna vad i den samlade kön styrs
  fortfarande av exakt samma `farRedigeraOmrade`/`farGodkannaKlinisktInnehall`-logik som idag –
  den samlade vyn är en ny PRESENTATION av befintlig behörighet, inte en ny behörighetsmodell.
- **42c – Navigation.** Sök blir en egen nav-post/route (inte bara ett inbäddat fält på Hem).
  Nyheter blir en egen nav-post (routen `/nyheter` finns redan, saknas bara i navigationen).
  Akut-knappen görs **persistent och flytande på alla sidor**, inte bara Hem – det är den
  enskilt viktigaste UI-förändringen för akutläget, eftersom en knapp som försvinner så fort
  man bläddrar i Kliniskt stöd är fel prioritering i en akutmottagning.
- **42d – Hem/dashboard.** Lägg till "Senast besökta" och "Mest lästa" sida vid sida på Hem –
  mappar direkt till redan befintliga `useSenastBesokta`/`usePopularaste`, som idag inte har
  en lika tydlig egen plats i gränssnittet. Behåll dagens tre domänkort med rutinantal. En
  banderoll ("X rutiner väntar på godkännande") länkar vidare till 42b:s samlade kö.
- **42e – Design-tokenrevision (görs FÖRST, blockerar resten av etappen).** Innan någon av
  42a–42d byggs: diffa mockupernas faktiska hex-värden, spacing-skala och typsnittsstorlekar
  mot `src/index.css`/`utils/badge.js`. Premisskontrollen ovan visar att mockuppernas egna
  påståenden om att vara "lyfta direkt" från den riktiga paletten inte stämmer fullt ut – bygg
  därför mot de VERIFIERADE, riktiga tokens, inte mot vad mockupen råkar rendera med.
- **42f – Mobilvy (egen, avgränsad delinsats, inte gated på 42a–42e).** En första riktig
  mobilanpassning: nedre flikbar (ersätter sidopanelen på smala skärmar, redan konceptuellt
  likt `BottomNav.jsx` men i en tätare, mer app-lik form) och samma persistenta,
  flytande Akut-knapp som 42c. Detta är en HELT NY yta (ingen mobilvy finns idag utöver att
  webbappen krymper responsivt) och bör tidsuppskattas separat – blanda inte ihop den med
  42a–42e:s ommöblering av befintliga skärmar.

**Klart när:** en redaktör kan beta av HELA sin godkännandekö (oavsett vilket område den
kommer ifrån) från en enda skärm, och en anställd i en akutsituation aldrig behöver navigera
bort från akut-knappen för att komma åt den.

### 42e/42a/42b/42c ✅ KLARA (2026-08-02)

**Premisskontroll vid byggstart (krav 8) hittade ytterligare en felaktig mockup-premiss, utöver
de som redan listades ovan vid antagandet:**

1. **42a:s "innehållstätare listvyer" var redan i stort sett byggda.** `RutinKort.jsx`
   visade redan full markdown-text, `agare`, `taggar`, godkänd/granskad-signaturer och
   bulk-markering (`massval`/`valda`, byggd för masstaggning) INNAN den här etappen
   påbörjades – jämförelsen mot mockupernas terser kort (särskilt Design 1) höll inte för den
   FAKTISKA appen. **Den enda genuina luckan:** bulk-markeringen kunde bara masstagga, inte
   massgodkänna/-neka ett urval (bara "Godkänn alla"/"Neka alla" för HELA utkastkön fanns).
   Det är den enda kodändring 42a faktiskt behövde – två nya knappar ("Godkänn N markerade
   utkast"/"Ta bort N markerade utkast") i `Sektionssida.jsx`, som återanvänder exakt samma
   markeringsmekanism.
2. **42c:s "Sök blir en egen nav-post" var delvis redan löst, fast annorlunda än förväntat.**
   `BottomNav.jsx`s "Sök"-knapp öppnar redan en global kommandopalett (Ctrl/Cmd+K-motsvarighet,
   samma Fuse.js-index som `SokFalt.jsx`) – tillgänglig från ALLA sidor redan idag, vilket
   objektivt är BÄTTRE än en enda dedikerad `/sok`-sida hade varit. **Beslut: bygg ingen ny
   `/sok`-route** – den skulle bara duplicera en redan bättre lösning. Se "Vad denna plan
   medvetet INTE gör" nedan.

**Genomfört (42e):** ingen kodändring i sig – bekräftade att `src/index.css` redan har
kompletta, namngivna design-tokens (`--primar`, `--kant`, `--text-svag`, `--bg`, `--yta`,
med ljust/mörkt-varianter) och byggde all ny kod i 42a/42b/42c mot DESSA, aldrig mot
mockupernas egna hexvärden.

**Genomfört (42b):** ny sida `Godkannanden.jsx` (`/godkannanden`, i `BottomNav.jsx` bakom
samma `arRedaktor(role)`-grind som Admin) med en ren, testad sammanställningsfunktion
(`src/utils/godkannandeKo.js`, `byggGodkannandeKo()`) som slår ihop utkast-rutiner
(kliniskt-stöd + administration), utkast-förrådsartiklar (logistik) och väntande
ändringsförslag – filtrerat per den inloggades FAKTISKA behörighet i varje område
(`KAN_GODKANNA_RUTINER`/`KAN_HANTERA_ANSLAG`/`KAN_HANTERA_FORRAD`, ingen ny behörighetsmodell).
**Två medvetna avsteg från plantextens ordalydelse, med skäl:**
- **Inline Godkänn/Ta bort-knapparna i de vanliga listvyerna togs INTE bort.** Planen sa
  "endast här" – men att ta bort en redan välfungerande, existerande väg i samma
  arbetspass som den nya samlade kön byggs bedömdes som onödigt hög risk utan en egen
  regressionsrunda. Den samlade kön är ett TILLÄGG, inte en ersättning, tills vidare. Ingen
  korrekthetsrisk av att båda finns kvar samtidigt (samma fält skrivs oavsett vilken knapp
  som användes) – bara en kvarvarande dubblering av UI-vägar att städa bort i en senare,
  egen omgång.
- **Väntande ändringsförslag visas läsbara med länk till sektionen, inte med en fullt
  inbyggd Inför-åtgärd i den samlade kön.** Att "införa" ett förslag kräver att det klistras
  in i rutinens text via samma redigeringsflöde som redan finns i `Sektionssida.jsx`
  (`oppnaInforForslag`) – att bygga om hela det flödet in i en ny sida hade varit en
  betydligt större omfattning än vad "de tre första delarna" rimligen syftade på.
- **Ingen live badge-räknare i `BottomNav.jsx`.** En räknare där hade krävt att koppla
  samma tre-fyra Firestore-lyssnare till EVERY sidvisning för EVERY inloggad användare
  (BottomNav monteras på nästan alla routes), oavsett om personen har någon
  godkännanderätt alls – en kostnad plantexten inte vägde in. Nav-länken finns och fungerar,
  bara utan siffra. Kan läggas till senare, roll-villkorat, om det visar sig efterfrågat.

**Genomfört (42c):** `/nyheter` tillagd i `BottomNav.jsx` (fanns som route men inte i
navigationen). Ny global, flytande `AkutKnappFloating.jsx` (monterad en gång i `App.jsx`,
inte per route) – syns på alla sidor utom `/akutlage` självt (redundant där) och när ingen är
inloggad. Den gamla Hem-bundna `.hem__akutlage-knapp` togs bort (död kod annars, ren
duplicering). Ingen `/sok`-route byggd – se premisskontroll-fyndet ovan.

15 nya tester (5 vitest för `godkannandeKo.js`; övrig testsvep opåverkad eftersom inget nytt
i firestore.rules/storage.rules behövdes – varken 42a, 42b eller 42c läser/skriver något som
inte redan hade regler). Fullt testsvep grönt (lint, build, 123 vitest-tester, test:rules
oförändrat 168/8/13/11/8 gröna). Verifierat i en riktig webbläsare mot emulatorerna: bulk-
godkänn av ett markerat utkast i Kliniskt stöd, den samlade kön som visar utkast från alla tre
domäner plus ett väntande förslag, godkännande direkt från den samlade kön, och den flytande
Akut-knappen synlig på Hem och Kliniskt stöd men korrekt dold på `/akutlage`.

### 42d ✅ KLAR (2026-08-02)

**Premisskontroll vid byggstart hittade samma mönster som för 42a:** "Senast besökta" och
"Mest använda" fanns REDAN på Hem (`useSenastBesokta`/`usePopularaste`, monterade sedan
tidigare) – planens beskrivning ("lägg till...") stämde inte, de behövde bara läggas sida vid
sida istället för staplat (`.hem__sektion-rad`, ny CSS-klass, samma `.hem__sektion`-innehåll
oförändrat). De tre domänkorten (`hem__kort-grid`/`SektionsKort`) fanns också redan.

**Den enda genuint nya funktionen:** banderollen ("X saker väntar på granskning" →
`/godkannanden`). Byggd som `GodkannandeBanner.jsx`, som delar en ny hook
(`useGodkannandeKo.js`) med `Godkannanden.jsx` (42b) – refaktorerade 42b:s tidigare inline-
logik in i den delade hooken så de två ställena aldrig kan råka räkna olika. Banderollen
monteras BARA för `arRedaktor(role)` (samma villkor som Admin-länken i `BottomNav.jsx`) –
annars hade `useGodkannandeKo()`s sex Firestore-lyssnare lagts på Hem, appens mest besökta
sida, för varje inloggad användare oavsett behörighet.

Inga nya vitest-tester (ren UI-sammansättning av redan testad logik – `byggGodkannandeKo()`
har redan 5 tester sedan 42b). Inga rules-ändringar. Fullt testsvep grönt (lint, build, 123
vitest-tester, test:rules oförändrat). Verifierat i en riktig webbläsare: banderollen syns och
räknar rätt för en superadmin (4 väntande poster, matchande 42b:s kö), länkar till
`/godkannanden`, och syns INTE alls för en `personal`-roll. Version 5.65.0 → 5.66.0.

**Kvar i Etapp 42:** endast 42f (mobilvy) – ägarbeslut 2026-08-02: vänta tills de saknade
mockuperna (Administration, Admin, Godkännanden, Nyheter i mobilformat) finns. Se
beslutspunkt 2. Etapp 42 är i praktiken klar för nu; 42f är en medveten paus, inte en
oavslutad uppgift.

---

## Beslutspunkter som kräver ägaren

1. ✅ **Utrullningsstrategi – löst genom praxis 2026-08-02:** sektion för sektion, som
   rekommenderat. 42e/42a/42b/42c/42d byggda och släppta (42e/42a/42b/42c i ett pass, 42d
   separat) – bara 42f kvarstår.
2. ✅ **Omfattning av 42f (mobil) – beslutat 2026-08-02: VÄNTA.** Mobilvyn skjuts upp tills
   de skärmar som saknar mockup (Administration, Admin-panelen, Godkännanden, Nyheter) har
   designats – annars blir 42f en ofullständig mobilupplevelse (tre skärmar mobilanpassade,
   resten inte) istället för en komplett i ett svep. **Inget kodat.** Nästa steg för 42f är
   INTE att bygga, utan att ta fram mockuper för de fyra saknade skärmarna (t.ex. via Claude
   Design, samma väg som de två ursprungliga utkasten kom in) – ta upp det igen när de finns.
3. **Mörkt läge:** ska det ingå i den här etappen, givet att det inte gick att verifiera som
   fungerande i källmockupen (se premisskontrollen)? Om ja: bygg det som en avgränsad
   delpunkt med egen testning, inte som en underförstådd bonus i 42a–42d.

---

## Sammanfattning

| Delpunkt | Innehåll | Insats | Vad det ger |
|---|---|---|---|
| 42e | Design-tokenrevision | Låg | Förhindrar ett andra, obemärkt designspråk |
| 42b | Samlad godkännandekö | Medel | En redaktör behöver bara en skärm för hela sin kö |
| 42a | Innehållstätare listvyer | Medel | Färre klick för att bedöma ett utkast |
| 42c | Navigation (Sök/Nyheter/persistent Akut) | Låg–medel | Akut alltid nåbar, oavsett sida |
| 42d | Hem/dashboard-tillägg | Låg | Synliggör redan byggd data (senast besökta/mest lästa) |
| 42f | Mobilvy | Hög (villkorad av beslutspunkt 2) | Första riktiga mobilupplevelsen |

**Om bara en sak hinns med:** 42e (tokenrevisionen) följt av 42b (samlad godkännandekö) – den
förra skyddar mot att bygga fel, den senare ger det mätbart största friktionslyftet.

---

## Vad denna plan medvetet INTE gör

| Idé från mockuperna | Varför inte (här) |
|---|---|
| Adoptera endera mockupens exakta färgpalett/spacing rakt av | Premisskontrollen visade att paletterna bara är inspirerade av, inte identiska med, de riktiga tokens – se 42e. |
| Bygga om behörighetsmodellen för vem som får godkänna vad | Ingen av mockuperna föreslår detta uttryckligen, men risken finns att en ny samlad vy av misstag slarvar bort per-område-kontrollen. 42b är explicit en ny PRESENTATION av befintlig `farRedigeraOmrade`-logik, inte en ny modell. |
| Fullständig mobilvy för samtliga skärmar (Administration, Admin, Godkännanden, Nyheter) | Mockupen visar bara tre skärmar i mobilformat. Se beslutspunkt 2 – resten är inte designat än. |
| En dedikerad `/sok`-route (ursprungligen planerad i 42c) | Premisskontroll vid byggstart (2026-08-02) visade att `BottomNav.jsx`s "Sök" redan öppnar en global kommandopalett från alla sidor – objektivt bättre än en enda sida hade varit. Att bygga en till skulle bara duplicera en redan bättre lösning. |
| Ta bort de befintliga inline Godkänn/Ta bort-knapparna ur de vanliga listvyerna (planerat i 42b) | Medvetet avsteg – se 42b:s egen sektion ovan. Den nya samlade kön är ett tillägg, inte (ännu) en ersättning; borttagningen av de gamla knapparna sparas till en egen, senare omgång med dedikerad regressionstestning. |
| En live badge-räknare på "Godkänn" i `BottomNav.jsx` (planerat i 42b) | Skulle kräva flera extra Firestore-lyssnare på nästan varje sidvisning för varje användare, oavsett behörighet – en kostnad plantexten inte vägde in. Länken fungerar, bara utan siffra. |
