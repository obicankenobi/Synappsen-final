# ETAPPLAN 7 – Gränssnittsförnyelse

**✅ ANTAGEN 2026-08-02.** Utgångsläge v5.63.0, efter att Etapp 37–39 (`ETAPPLAN6.md`) blivit
klara. Etapp 42 (a–f) är HELT KLAR (2026-08-03), v5.67.0, deployad. **Etapp 43 (tillagd
2026-08-03) är också HELT KLAR (2026-08-03), v5.72.0** – täckte de 20 sidor och tre
uppskjutna punkter (snabblänksrad, Admin-densitet, mörkt läge) Etapp 42 aldrig nådde. Se
Etapp 43:s egen sektion längst ner för detaljer, inklusive två genuina buggar som hittades
och fixades under bygget (Korvy-knappens flex-läckage, Leverantörsvyns null-krasch).
**Hela ETAPPLAN7.md (Etapp 42 + 43) är därmed helt klar. Inte deployad ännu (senaste deploy
är v5.67.0).**

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

### 42f ✅ KLAR (2026-08-03)

De fyra saknade mockuperna togs fram (Claude Design) och granskades 2026-08-03: alla fyra
skärmar (Administration, Godkännanden, Admin, Nyheter) samt en explicit lösning på det
9-postersproblem i `BottomNav.jsx` som redan var dokumenterat som känt (`overflow-x: auto`-
kommentaren i `BottomNav.css`) – en "Mer"-meny som samlar de mindre använda posterna.

**Premisskontroll vid byggstart (krav 8) omkullkastade mockupens egen ramberättelse:**
mockupens `github.md` påstod att en "nedre flikbar ersätter sidopanelen på smala skärmar" –
men appen har ALDRIG haft en sidopanel att ersätta. `BottomNav.jsx` monteras redan idag på
alla skärmstorlekar (`App.jsx`, samma `SkyddatLayout`/`RollSkyddadRoute` oavsett bredd). Det
finns med andra ord ingen ny "mobilvy" att bygga från grunden – det som faktiskt behövde
fixas var två konkreta, verifierade buggar i den redan existerande, alltid-mobila
navigeringen:

1. **9 poster i `BottomNav.jsx` överflödade synligt fält** på en 375px-skärm (bekräftat med en
   riktig inloggad session mot emulatorerna, Playwright-skärmdump) – `overflow-x: auto` gjorde
   dem NÅBARA men inte SYNLIGA, precis den brist mockupens "Mer"-meny adresserar. Löst genom
   att reducera den alltid synliga raden till fem poster (Sök/Hem/Kliniskt/Logistik/Mer) och
   flytta Anslag/Regler/Nyheter/Godkänn/Admin till en ny bottom-sheet (`MerMeny.jsx`).
2. **`.app-innehall` reserverade inget utrymme för den fixed-positionerade `BottomNav.jsx`** –
   bekräftat i en riktig skärmdump (Nyheter-sidan, skrollad till botten) att sidans sista
   innehåll hamnade delvis bakom navigeringen. Fixat med samma `76px`-marginal
   `AkutKnappFloating.css` redan använder (`padding-bottom` på `.app-innehall`).

**En bugg till hittades och fixades under byggpasset, inte i premisskontrollen:** `MerMeny`
renderades först som barn till `<nav className="bottom-nav">`, vars `position: fixed` +
`z-index: 100` skapar en egen stapel-kontext – menyns eget `z-index: 800` gällde då bara
INOM den kontexten, vilket fick den flytande Akut-knappen (`z-index: 150`, monterad utanför
navets kontext i `App.jsx`) att felaktigt rendera ovanpå menyn. Löst genom att rendera
`MerMeny` som syskon till `<nav>` (React-fragment) istället för barn.

**Medvetet mindre omfattning än mockupens fem nya skärmar:** mockupens Administration-,
Admin- och Nyheter-skärmar visar en tätare/omdesignad kortlayout för respektive sida – men
`ETAPPLAN7.md`s egen skrivna definition av 42f (se ovan) omfattade bara navigeringen och
Akut-knappen, inte en omdesign av innehållet på varje sida. Att bygga om Admin.jsx:s
sektionslista till en accordion (mockupens lösning på dess densitet på mobil) är en
betydligt större, fristående insats som förtjänar en egen etapp om den ska tas – inte
klämmas in som en bonus här. Ingen ny "mobilvy" per sida byggdes; de befintliga sidornas
flexbox-/grid-layouter (utan tidigare mobil-brytpunkter) visade sig redan fungera
tillfredsställande staplade på 375px, bekräftat i samma skärmdumpar.

Inga nya vitest-tester (ren UI/CSS, ingen ny logik att enhetstesta). Inga rules-ändringar.
Fullt testsvep grönt (lint, build, 123 vitest-tester). Verifierat i en riktig webbläsare mot
emulatorerna vid 375×812: den reducerade bottennavigeringen, "Mer"-menyn (öppnar/stänger,
rätt poster per roll), att Akut-knappen inte längre kryper ovanpå menyn, och att sidans sista
innehåll inte längre göms bakom navigeringen. Version 5.66.0 → 5.67.0.

**Etapp 42 är nu helt klar (42a–42f).**

---

## Beslutspunkter som kräver ägaren

1. ✅ **Utrullningsstrategi – löst genom praxis 2026-08-02:** sektion för sektion, som
   rekommenderat. 42e/42a/42b/42c/42d byggda och släppta (42e/42a/42b/42c i ett pass, 42d
   separat) – bara 42f kvarstår.
2. ✅ **Omfattning av 42f (mobil) – beslutat 2026-08-02: VÄNTA, klar 2026-08-03.** Mockuper
   för de fyra saknade skärmarna togs fram och granskades; premisskontroll vid byggstart
   visade att den egentliga luckan var smalare än mockupens ramberättelse (ingen "sidopanel"
   att ersätta, se 42f:s egen sektion ovan för detaljer). Byggt: reducerad bottennavigering +
   "Mer"-meny, samt en fix för att sidans sista innehåll gömdes bakom navigeringen.
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
| 42f | Nav-överflöde ("Mer"-meny) + fix för dold innehåll bakom nav | Låg (visade sig smalare än väntat) | Bottennavigeringen syns och fungerar fullt ut även med 9 poster |

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

---

## Etapp 43 – Slutföra gränssnittsförnyelsen (sidorna Etapp 42 aldrig nådde)

**Varför:** Etapp 42 gjorde bara de sju sidor de två mockuperna faktiskt visade (Hem,
Kliniskt stöd, Logistik, Administration, Godkännanden, Admin, Nyheter) rättvisa. Appen har
27 routade sidor totalt (`App.jsx`) – **20 har aldrig jämförts mot den nya profilen**, bland
dem den allra första sidan varje användare möter (`LoggaIn.jsx`). De delar visserligen samma
CSS-tokens som resten av appen (`--primar`/`--kant`/badge-systemet i `src/index.css`) så de
är inte trasiga eller omoderna – bara oreviderade. Utöver det finns tre kända, uppskjutna
punkter från Etapp 42 som hör hemma här: Hem:s snabblänksrad, Admin-panelens mobildensitet,
och mörkt läge (beslutspunkt 3, aldrig löst).

**Genomgående krav 8 gäller extra strikt här:** Etapp 42a och 42d visade båda att en plans
antagande om "detta behöver byggas om" ofta var fel – innehållet fanns redan, bara inte på
den plats/i den form planen trodde. Anta INTE att någon av de 20 sidorna nedan faktiskt
behöver ändras förrän den faktiskt öppnats i en riktig webbläsare (mobil OCH desktop) och
jämförts mot samma måttstock som 42a–42f använde (innehållstäthet, ägare/taggar-synlighet,
bulk-hantering, nav-överflöde). Flera kan visa sig redan vara i sin ordning.

### 43a ✅ KLAR (2026-08-03) – Första intrycket: LoggaIn, Registrera, Introduktion
Den enda sida ALLA användare ser innan de ens är inloggade, plus onboardingflödet direkt
efter. Högst prioritet trots låg teknisk komplexitet (109/118/319 rader) – ett dåligt första
intryck väger tyngre än en sida en redaktör öppnar en gång i månaden.

**Premisskontroll (skärmdump, 1280px och 375px) hittade den faktiska bristen:**
`.sida--auth` (LoggaIn/Registrera) var den ENDA platsen i appen utan kort/upphöjning – bara
vänsterjusterad text/formulär direkt mot bakgrunden, dessutom uppe i det tomma övre vänstra
hörnet på breda skärmar istället för centrerat. Introduktion (och därmed även Kompetensmatris,
Feedback, Leverantor, `AnslagFormular`/`InbjudanFormular`/`Personalpuls`/`RutinFormular` –
alla `<select>`-fält i appen) hade obemärkta webbläsarstandard-dropdowns, synligt avvikande
från de intilliggande `<input>`-fälten.

**Byggt:**
1. `.sida--auth` är nu ett centrerat kort (`--yta`/`--skugga`/`--radius`, samma tokens som
   resten av appens kort) istället för fri text. `flex: 0 1 auto` (inte `.sida`s ärvda
   `flex: 1`) så kortet hugger om sitt innehåll istället för att sträcka sig till hela
   viewportens höjd.
2. En global `select`-regel i `src/index.css` (samma stil som `.auth-form input`) – täcker
   ALLA sidor med ett `<select>`, inte bara Introduktion, eftersom ingen tidigare hade en
   global stil. Sidor med en egen, mer specifik select-regel (LaddaUpp/Leverantor/Feedback)
   påverkas inte av cascade-regler.

Inga nya vitest-tester (ren CSS). Inga rules-ändringar. Fullt testsvep grönt (lint, build,
123 vitest-tester). Verifierat i en riktig webbläsare mot emulatorerna vid 1280px och 375px:
LoggaIn, Registrera och Introduktion. Version 5.67.0 → 5.68.0.

### 43b ✅ KLAR (2026-08-03) – Hem:s snabblänksrad
Bekräftad i en riktig 375px-skärmdump under 42f:s byggpass: nio korta länkar (Anslagstavla,
Nyheter, Feedback, Hjälp, Min profil, Kontakter, Introduktion, Kompetensmatris,
Länkbibliotek, Papperskorg) tar upp fem rader ovanför sökfältet innan man ens når det
faktiska innehållet.

**Premisskontroll vid byggstart hittade en existerande, underutnyttjad lösning:**
`useSnabblankar.js` låter varje användare redan idag välja vilka snabblänkar som visas
(sparat på `users/{uid}.snabblankar`, redigerbart i `Profil.jsx`) – men standardvärdet
(`valda === null`, dvs. ingen har anpassat sina val) visar ALLA. Att ändra det standardvärdet
avvisades: det hade ändrat beteendet för alla BEFINTLIGA användare som aldrig besökt Profil,
inte bara nya. Löste istället densiteten utan att röra datamodellen: `Hem.jsx` visar bara de
första fyra länkarna, resten bakom en "Fler (N) ▾"-växlare (ren lokal `useState`, inget sparat
val). Alla länkar är fortfarande nåbara i ett klick, bara inte alla synliga direkt.

Ingen ny vitest-testning (ren UI/CSS + lokal komponent-state, ingen ny logik i en delad
hook/util). Inga rules-ändringar. Fullt testsvep grönt (lint, build, 123 vitest-tester).
Verifierat i en riktig webbläsare mot emulatorerna vid 375px: hopfälld vy (2 rader istället
för 5, sökfältet syns direkt) och expanderad vy (alla 10 länkar + "Färre ▲"). Version 5.68.0
→ 5.69.0.

### 43c ✅ KLAR (2026-08-03) – Admin-panelens densitet på mobil
Mockupens accordion-lösning (varje sektion – Användare & roller, Moduler, Innehållshälsa,
Granskningsrundor, Personalpuls, Kostnadsuppföljning, Säkerhet – som en egen hopfällbar rad)
bekräftades under 42f:s premisskontroll vara en genuin förbättring: en lång, platt
statistiklista utan struktur på en 375px-skärm.

**Premisskontroll vid byggstart:** `Admin.jsx` består sedan Etapp 8c av **26 fristående
sektionskomponenter** i `src/components/admin/`, alla med samma uniforma mönster
(`<section className="admin-sektion"><h2>ikon titel</h2>...</section>`) – inte mockupens
gissning om ett fåtal namngivna sektioner, utan betydligt fler.

**Byggt:** samtliga 26 sektionskomponenter + Admin.jsx:s egen inline "Bjud in kollega"-sektion
konverterade till native `<details>`/`<summary>` – ren HTML-semantik, ingen ny JS-logik,
ingen React-state. Varje sektions redan existerande `<h2>` flyttades in i `<summary>` (samma
rubriktext, ingen dubblering), så ingen av de 26 komponenternas övriga JSX behövde ändras.
Ny CSS-klass `admin-sektion--hopfallbar` (i `Admin.css`) ger en klickbar rad med
rotationspil, ram och padding – scopad till just den klassen, INTE till den delade
`.admin-sektion`-basklassen, eftersom den återanvänds av flera andra sidor (Logistik,
Introduktion, Leverantor, Kompetensmatris, Ledningsrapport, Godkännanden, Personalpuls m.fl.)
som inte skulle få bli klickbara/hopfällbara av misstag.

**En genuin scope creep hittades och korrigerades under byggpasset:** en bulkkonvertering
(mönstret var 100 % identiskt i alla filer i mappen, verifierat innan bygget) råkade även
konvertera `MatvardenTrendSektion.jsx`/`ReferensunderlagSektion.jsx` – två filer som ligger i
`components/admin/`-mappen men som faktiskt används av `Ledningsrapport.jsx` (en
utskriftsvänlig rapportsida, `window.print()`), inte av `Admin.jsx`. Att göra en
utskriftssidas innehåll hopfällt-som-standard hade varit direkt kontraproduktivt (osynligt
vid utskrift) och var dessutom utanför den här delpunktens omfattning – `Ledningsrapport.jsx`
hör hemma i 43e:s "Ledning/leverantör"-grupp, inte här. Båda filerna återställda innan commit.

Alla sektioner är collapsade som standard (matchar mockupens mönster) – en medveten avvägning:
innehåll bakom en hopfälld sektion är inte sökbart med webbläsarens Ctrl+F förrän den öppnats,
men densitetsvinsten (en 26-posters lista istället för flera skärmhöjder statistik) bedömdes
väga tyngre för en adminpanel som besöks för specifika uppgifter, inte för att läsas i sin
helhet.

Inga nya vitest-tester (ren HTML/CSS-konvertering, ingen ny logik). Inga rules-ändringar.
Fullt testsvep grönt (lint, build, 123 vitest-tester). Verifierat i en riktig webbläsare mot
emulatorerna vid 1280px och 375px: hopfällt/expanderat läge för flera sektioner, chevron-
rotation, och en regressionskontroll av Logistik/Kompetensmatris (båda använder den delade
`.admin-sektion`-klassen) som bekräftade att de förblev OFÖRÄNDRADE. Version 5.70.0 → 5.71.0.

### 43d ✅ KLAR (2026-08-03) – Mörkt läge, redan komplett byggt
Aldrig avgjort under Etapp 42 eftersom mockupens växlare inte gick att verifiera som
fungerande – planen antog därför att en manuell växlare behövde BYGGAS (data-tema-attribut,
inställning i `Profil.jsx`, premisskontroll av vilka komponenter som saknade en mörk variant).

**Premisskontroll vid byggstart visade att antagandet var fel: funktionen finns redan, helt
färdig.** `src/hooks/useTema.js` + `src/components/TemaVaxlare.jsx` (monterad i `Profil.jsx`)
ger precis den `data-tema`-attribut-lösningen planen beskrev som "sannolikt" behövde byggas –
ljust/mörkt/system, sparat i `localStorage`, FOUC-säkert (satt i `index.html` innan React
laddar), PLUS en accentfärgsväljare (blå/grön/lila/orange) som planen inte ens kände till.

Verifierat i en riktig webbläsare, inte bara läst i källkoden: växlaren fungerar, temat
appliceras direkt på Hem/Admin/alla andra sidor (inklusive den nya 43c-accordionen, som
renderar korrekt i mörkt läge eftersom den byggdes mot samma CSS-tokens som allt annat), och
inställningen ÖVERLEVER en sidladdning (localStorage-persistens bekräftad).

**Ingen kodändring gjord.** Precis som 43e:s "Vardagsverktyg" är detta en ärlig
premisskontroll-utgång: en delpunkt som visade sig redan vara klar, inte en delpunkt som
byggdes. Ingen version-bump. Beslutspunkt 3 från Etapp 42 (skulle mörkt läge ingå?) är därmed
löst av sig själv – svaret var "det finns redan".

#### 43e:s tre återstående grupper ✅ KLARA (2026-08-03)

**Stöd/hjälp** (`Hjalp`, `Feedback`, `Kontakter`, `Lankbibliotek`) och **Personligt**
(`Profil`, `Papperskorg`, `OfflineCenter`) granskade i en riktig webbläsare vid 1280px/375px –
alla sju redan konsekventa med resten av appens kort/tokens. `Hjalp.jsx`s FAQ-sektion visade
sig redan använda native `<details>/<summary>` för sina utfällbara svar, samma mönster 43c
byggde på i adminpanelen – ytterligare en bekräftelse på att mönstret redan var etablerat i
kodbasen. **Ingen kodändring i någon av de sju.**

**Ledning/leverantör** (`Leverantor`, `Kompetensmatris`, `Ledningsrapport`) granskades med
extra försiktighet efter 43c:s scope-creep-fynd kring `Ledningsrapport.jsx`s delade
komponenter. `Kompetensmatris.jsx` och `Ledningsrapport.jsx` var rena (ingen ändring;
`Ledningsrapport.jsx`s `.admin-sektion`-sektioner förblir medvetet ICKE hopfällbara, eftersom
sidan är en utskriftsvänlig rapport – samma resonemang som redan gav grunden till 43c:s
scope-creep-fix).

**En genuin bugg hittades och fixades i `Leverantor.jsx`:** sidan kraschade
(`TypeError: Cannot read properties of null (reading 'length')`) om anropet till
`listaOrganisationer()` misslyckades med något ANNAT än exakt felkoden `permission-denied` –
`organisationer` förblir `null` i det läget, och renderingen antog fel att bara det ena
felfallet behövde hanteras. Bekräftat i en riktig webbläsare (ett nätverksfel i sandlådan
utlöste det, men buggen är lika verklig vid t.ex. ett tillfälligt Functions-timeout i
produktion). Fixat med `organisationer ?? []` på båda användningsställena.

Inga nya vitest-tester (en defensiv null-koll, ingen ny logik att enhetstesta separat). Inga
rules-ändringar. Fullt testsvep grönt (lint, build, 123 vitest-tester). Version 5.71.0 →
5.72.0.

**Etapp 43 är därmed HELT KLAR** – alla delpunkter (43a–43e, samtliga fem 43e-grupper).

### 43e – Resterande 17 sidor, granskade i grupper
Grupperas efter vem som använder dem, inte efter filstorlek, så varje delomgång ger ett
sammanhängande värde:

| Grupp | Sidor | Vem berörs |
|---|---|---|
| Vardagsverktyg ✅ GRANSKAD (2026-08-03) | `ForradVy`, `LaddaUpp`, `Skiftrapport`, `Anslagstavla` | All personal, dagligen |
| Stöd/hjälp ✅ GRANSKAD | `Hjalp`, `Feedback`, `Kontakter`, `Lankbibliotek` | All personal, sällan |
| Personligt ✅ GRANSKAD | `Profil`, `Papperskorg`, `OfflineCenter` | All personal, sällan |
| Ledning/leverantör ✅ GRANSKAD, 1 bugg fixad | `Leverantor`, `Kompetensmatris`, `Ledningsrapport` | Redaktörer/superadmin |
| Kritiska specialfall ✅ KLAR (2026-08-03) | `Akutlage`, `Korvy`, `SedanForraPasset` | Se egen skrivning nedan |

**Rekommenderad ordning:** 43a → 43b (båda låg insats, hög synlighet) → 43e:s "Kritiska
specialfall" (Akutlage särskilt, patientsäkerhetsrelaterat) → 43e:s "Vardagsverktyg" → 43c →
43d → 43e:s återstående grupper (Stöd/Personligt/Ledning, lägst prioritet – låg
användningsfrekvens).

#### 43e:s "Kritiska specialfall" ✅ KLAR (2026-08-03)

Premisskontroll (källkod + riktiga skärmdumpar, 1280px/375px, mot emulatorerna) för alla tre:

- **`Akutlage.jsx`/`.css`:** medvetet, dokumenterat FORCERAD hög kontrast (svart bakgrund,
  vit/röd text) oavsett ljust/mörkt tema – en explicit Etapp 17c-motiverad avvikelse från
  resten av profilen ("ska vara omedelbart visuellt avvikande och läsbart i starkt ljus").
  **Ingen ändring** – att göra den mer lik resten av appen hade varit fel, inte en förbättring.
- **`Korvy.jsx`/`.css`:** använder redan konsekvent `--bg`/`--text`/`--primar`/`--kant`-tokens.
  **En genuin bugg hittades och fixades:** `.korvy__knapp` hade `flex: 1` avsett för
  knapparaden (`.korvy__knappar`, två jämnbreda knappar), men klassen återanvänds även
  FRISTÅENDE (t.ex. "← Tillbaka" när rutinen saknar checklistesteg, "Till startsidan" på
  klar-skärmen) – som en direkt flex-child av `.korvy` (flex-direction: column) fick
  `flex: 1` den fristående länken att sträcka sig till HELA sidans höjd, bekräftat i en
  skärmdump. `flex: 1` gäller nu bara via `.korvy__knappar .korvy__knapp`, inte basklassen.
- **`SedanForraPasset.jsx`/`.css`:** använder redan `--yta`/`--kant`/`--radius`-tokens
  korrekt. **Ingen ändring.**

Inga nya vitest-tester (ren CSS-scoping-fix). Inga rules-ändringar. Fullt testsvep grönt
(lint, build, 123 vitest-tester). Verifierat i en riktig webbläsare: Akutlage (tomt läge),
Korvy (både utan steg och med en seedad 3-stegs checklista – båda knapplägena), och
SedanForraPasset. Version 5.69.0 → 5.70.0.

#### 43e:s "Vardagsverktyg" ✅ GRANSKAD (2026-08-03) – inget att fixa

Premisskontroll (källkod + riktiga skärmdumpar, 1280px/375px, mot emulatorerna) av
`ForradVy`, `LaddaUpp`, `Skiftrapport` och `Anslagstavla`: alla fyra använder redan samma
delade `.sida`-omslag, `Skelett`-laddningsskelett, `platshallare`-tomtillstånd och
`--yta`/`--kant`/`--radius`-tokens som resten av appen – samma mönster som redan verifierades
för de sju sidorna i Etapp 42. Till skillnad från 43e:s "Kritiska specialfall" hittades ingen
genuin bugg här. **Ingen kodändring gjord** – en ärlig premisskontroll-utgång är ibland "redan
i sin ordning", inte alltid en hittad brist (samma mönster som Akutlage/SedanForraPasset
ovan). Ingen version-bump eftersom inget som visas för användaren ändrades.

---

## Beslutspunkter för Etapp 43 – lösta 2026-08-03

1. ✅ **Omfattning – gruppvis, som Etapp 42.** Släpps sektion för sektion (43a, sedan 43b,
   sedan grupperna i 43e, osv.), inte som en enda sammanhängande omgång.
2. ✅ **Mörkt läge (43d) – in i den här etappen (7), inte en egen separat plan.** Byggs som en
   avgränsad delpunkt med egen premisskontroll och testning, precis som ursprungligen
   föreslaget – bara *var* den hör hemma (samma fil) var frågan, inte *om*.
3. ✅ **43c:s prioritet – ingen framflyttning.** Tas i den ordning som annars är lämplig;
   ägaren har inget behov av att Admin-panelens accordion görs före resten.

**Byggordning härifrån:** 43a ✅ KLAR → 43b ✅ KLAR →
43e:s "Kritiska specialfall" ✅ KLAR → 43e:s "Vardagsverktyg" ✅ GRANSKAD → 43c ✅ KLAR
→ 43d ✅ KLAR (redan byggt) → 43e:s återstående grupper (Stöd/Personligt/Ledning –
Ledningsrapport ingår här nu, med extra försiktighet efter 43c:s scope-creep-fynd).
Samma motivering som tidigare: låg insats/hög synlighet och patientsäkerhet går före
lågfrekventa admin-sidor.

---

## Sammanfattning – Etapp 43

| Delpunkt | Innehåll | Insats | Vad det ger |
|---|---|---|---|
| 43a | LoggaIn/Registrera/Introduktion | Låg–medel | Det första intrycket matchar resten av appen |
| 43b | Hem:s snabblänksrad | Låg | Mindre skrollning innan innehåll syns på mobil |
| 43c | Admin-panelens mobildensitet (accordion) | Medel–hög | Löser en redan bekräftad, konkret brist |
| 43d | Mörkt läge | Ingen (redan byggt – premisskontroll visade funktionen redan fanns) | Löser en tre etapper gammal, olöst fråga – svaret var "redan klart" |
| 43e | Resterande 17 sidor, gruppvis | Medel (sprids ut) | Hela appen, inte bara sju sidor, matchar samma profil |
