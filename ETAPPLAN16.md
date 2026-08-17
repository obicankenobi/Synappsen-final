# Etapplan 16 – Leverantörens överblick: från lista till dashboard

*Utkast 2026-08-16. **ANTAGEN 2026-08-16, HELT KLAR OCH BYGGD 2026-08-17.** Ägaren följde
samtliga tre rekommendationer (samma sida, bygg `avtalsstatusAndrad` väg (a), oförändrad
omfattning), se `BESLUTSLOGG.md`, och bad därefter att köra 67b–67e i följd utan att stanna
mellan varje. Alla fem delmål (67a–67e) är nu klara: 67a v5.108.0, beslutspunkt 2:s
serverunderlag v5.109.0, 67b v5.110.0, 67c v5.111.0, 67d v5.112.0, 67e v5.113.0.*

**Bakgrund:** ägaren frågade om det finns en huvudvy för leverantören och en
dashboard-funktion för översyn och hantering av alla kunder. Svaret efter en genomgång av
faktisk kod: **ja till förvaltning, nej till överblick.** `src/pages/Leverantor.jsx` (990
rader, byggd i Etapp 6a och påbyggd i ett tiotal etapper sedan) kan redan nästan allt som
behöver *göras* med en kund – skapa, pausa, prissätta, exportera, diagnostisera, radera,
supporta, anteckna. Det den inte kan är att svara på frågan "hur ligger det till, och vad
behöver jag göra något åt i dag?" utan att man läser hela listan rad för rad.

Den här planen lägger alltså inte till förvaltningsfunktioner. Den lägger till
**presentationslagret ovanpå data som redan hämtas**, plus fixar en akut brist som
premisskontrollen bekräftade: vyn går inte att nå från gränssnittet alls.

---

## Premisskontroll (genomgående krav 8)

Kontrollerad mot faktisk kod 2026-08-16, innan planen skrevs. Fem premisser höll, två
visade sig innehålla komplikationer som ändrar bygget.

| # | Premiss | Utfall | Konsekvens för planen |
|---|---|---|---|
| 1 | Det finns ingen länk till `/leverantor` i gränssnittet | ✅ **Bekräftad.** Grep efter `/leverantor` i hela `src/` ger exakt två träffar: routedefinitionen (`App.jsx:306`) och sidtiteln (`useSidTitel.js:25`). Ingen träff i `BottomNav.jsx`, `MerMeny.jsx`, `KommandopalettInnehall.jsx`, `sokindex.js` eller `Hem.jsx` | 67a byggs |
| 2 | Länken kan gatas på användarens roll, som `/admin` redan gatas | ❌ **Håller INTE.** `/admin` gatas på `arRedaktor(role)` (`BottomNav.jsx:77`), men **plattformsadmin-status finns inte i `role`-fältet alls** – den bor i en egen collection, `plattformsadmin/{uid}`. Klienten vet i dag ingenting om den | 67a måste bygga en ny hook först. Se fynd nedan |
| 3 | Klienten kan ta reda på om den är plattformsadmin | ✅ **Bekräftad, men indirekt.** `firestore.rules:300–302` säger `allow read: if arPlattformsadmin()`, och `arPlattformsadmin()` är i sin tur `exists(plattformsadmin/$(uid))`. En plattformsadmin får alltså läsa sitt eget dokument; alla andra får `permission-denied`. Statusen avgörs av om läsningen lyckas | 67a:s hook bygger på detta. Ingen ny collection, ingen regeländring |
| 4 | `listaOrganisationer` returnerar allt som behövs för en nyckeltalsrad | ✅ **Bekräftad.** `organisationslivscykel.js:237` returnerar en platt array med användarantal, moduler, kostnad, avtalsstatus, pris, provperiod, sökkvot, radering, supportfönster, demo-flagga och huvudman – plus `sokkvot` och `epostAvstangd`. **Inga aggregat beräknas någonstans**, varken server- eller klientsidan (enda undantaget: summerat pris per huvudman, `Leverantor.jsx:628`) | 67b blir ren klientberäkning på redan hämtad data – ingen ny läsväg, ingen extra kostnad |
| 5 | Demo-organisationen kan räknas med i aggregaten | ❌ **Håller INTE, och det här är fyndet som lättast hade blivit ett tyst fel.** `manadsrapportOrganisationer` filtrerar uttryckligen bort demo (`avtalslivscykel.js:324–325`, med motiveringen att den nollställs varje natt), men **`listaOrganisationer` gör det inte** – demo kommer med, bara flaggad `arDemo: true`. En nyckeltalsrad byggd rakt på arrayen hade alltså räknat demomiljön som en betalande kund | Blir **genomgående krav 29**, se nedan |
| 6 | Signaler för en "kräver åtgärd"-lista finns redan i datan | ⚠️ **Delvis.** Provperiodslut, sökkvot mot tak, pausad status, schemalagd radering och aktivt supportfönster finns alla redan i svaret. **Men `satAvtalsstatus` (`avtalslivscykel.js:62`) skriver bara `{ avtalsstatus }` – ingen tidsstämpel.** "Den här offerten har legat stilla i 40 dagar" går alltså inte att svara på i dag | 67d bygger bara på det som bevisligen finns. Tidsstämpeln blir beslutspunkt 2 |
| 7 | Kostnadstrend per kund kräver ny datainsamling | ❌ **Håller inte – datan finns redan.** `organisationer/{orgId}/kostnadshistorik` skrivs en post per månad (`gemensamt.js:383`); `listaOrganisationer` läser bara `limit(1)` av den (`organisationslivscykel.js:254`). Trend kräver alltså bara en bredare läsning, ingen ny insamling | Uteslutet ändå, men av kostnadsskäl – se "Vad jag INTE föreslår" |

**Ytterligare bekräftat under kontrollen:** `organisationer/{orgId}.skapad` finns som
serverTimestamp (`organisationslivscykel.js:94`) men returneras inte av
`listaOrganisationer`. Det är en billig serverändring som ger "skapad för N dagar sedan" –
relevant för beslutspunkt 2. Och `blibForstaPlattformsadmin` (`plattformsdrift.js:267`) är
korrekt spärrad (kräver superadmin OCH att ingen plattformsadmin finns än) – knappen som
visas vid `permission-denied` i leverantörsvyn är alltså inte en säkerhetslucka.

---

## Genomgående krav 29 (nytt)

> **Ett aggregat som summerar över alla kunder måste alltid exkludera demo-organisationen
> (`arDemo === true`), och exkluderingen ska synas i koden på beräkningsstället – inte
> antas ha skett tidigare i kedjan.**

Motiveringen är fynd 5 ovan: de två serverfunktioner som i dag levererar kundlistor
behandlar demo olika, och skillnaden är osynlig från anropsstället. Ett aggregat som råkar
bygga på fel källa blir inte fel med ett felmeddelande – det blir tyst fel med en siffra som
ser rimlig ut. Ett faktureringsunderlag eller en ARR-siffra som inkluderar en miljö som
nollställs varje natt 04:00 är precis den sortens fel som upptäcks först när någon undrar
varför summan inte stämmer mot verkligheten.

---

## Etapp 67 – Delmål

### 67a – Vägen in ✅ KLAR (2026-08-16, v5.108.0)

**Idé:** gör vyn nåbar. Det här är den enskilt största bristen och den billigaste att rätta:
i dag måste man skriva `/leverantor` för hand i adressfältet varje gång.

**Premisskontroll:** se fynd 1–3. Länken kan inte gatas som `/admin` gatas, eftersom
plattformsadmin inte är en roll utan en separat collection. Hooken måste byggas först.

**Bygge:**
- Ny `src/hooks/useArPlattformsadmin.js` – läser `plattformsadmin/{currentUser.uid}`, tolkar
  lyckad läsning som ja och `permission-denied` som nej. Cachar resultatet för sessionen
  (statusen ändras aldrig mitt i en session – den sätts av en Cloud Function, aldrig av
  klienten). Returnerar `{ arPlattformsadmin, laddar }` så gränssnittet kan låta bli att
  blinka fram länken.
- Post i "Mer"-menyn (`BottomNav.jsx:70–78`), gated på hooken: `{ till: "/leverantor",
  ikon: "🏢", namn: "Leverantör" }`. Läggs sist, efter Admin-posten.
- Post i kommandopaletten och i `src/data/sokindex.js`, samma gating.

**Klart när:** en plattformsadmin ser "Leverantör" i Mer-menyn och i kommandopaletten; en
vanlig superadmin ser den inte; ingen extra Firestore-läsning sker för användare som inte är
plattformsadmin utöver det enda misslyckade försöket per session.

**Genomfört (2026-08-16, v5.108.0).** Två avvikelser mot skissen ovan, båda upptäckta i en
premisskontroll av bygget självt:

- **Planen sa "post i `src/data/sokindex.js`". Det var fel fil.** `sokindex.js` är
  platshållardata från Fas 1 – fem påhittade kliniska rutiner ("Ryggsmärta", "Trauma höft"),
  inte ett navigationsindex. Rätt plats visade sig vara `STATISKA_ATGARDER` i
  `useSokindex.js:34`, där de befintliga navigationsåtgärderna (Akutläge, Skiftrapport, Öva …)
  redan bor. Posten lades där i stället.
- **`STATISKA_ATGARDER` är en modulkonstant utan någon rollgating alls** – varenda användare
  får hela listan. En post rakt in i den hade gett varje undersköterska en sökträff
  "Leverantörsvy" som leder till "den här vyn kräver leverantörsadmin-åtkomst, som du inte
  har". Listan byggs därför nu ihop inne i `useMemo` med posten villkorad av
  `useArPlattformsadmin()`.

**En tredje sak avgjordes under bygget och är värd att skriva ut, eftersom den inte syns i
diffen:** hooken läser `plattformsadmin/{uid}` **bara för superadmins**. Skälet är inte
behörighet – regellagret avgör det ändå – utan brus. `useSokindex` används av både
`SokFalt.jsx` och kommandopaletten, som båda renderas på startsidan; en oskyddad hook hade
lagt en *alltid misslyckad* Firestore-läsning på den kritiska vägen för varje användare vid
varje session, och matat exakt den signal Etapp 32b vill larma på ("upprepade
`permission-denied`", se `OPPNA-PUNKTER.md`). Att förorena den mätningen innan larmet ens är
byggt vore att sabotera den i förväg. Avgränsningen är säker eftersom
`blibForstaPlattformsadmin` uttryckligen kräver superadmin
(`functions/plattformsdrift.js:272`); en plattformsadmin som utsetts via
`gorTillPlattformsadmin` utan att vara superadmin får ingen menypost men når fortfarande
`/leverantor` genom att skriva adressen – alltså exakt dagens läge, ingen regression.

**Testet flyttade en funktion.** Predikatet låg först i `useArPlattformsadmin.js`, men det
gick inte att enhetstesta: filen importerar `firebase/config`, som anropar `getAuth(app)` vid
import och kraschar i vitests nodmiljö. `farForsokaLasaPlattformsadmin(uid, role)` bor därför i
`src/firebase/roles.js`, som är medvetet fri från Firebase-importer (samma egenskap som gör
`src/utils`/`src/config` testbara). Det är också en bättre hemvist rent sakligt – den står nu
bredvid `arRedaktor` och `farRedigeraOmrade`.

**Övrigt byggt:** avduplicering av samtidiga läsningar (`pagaendePerUid`) eftersom `BottomNav`
och `useSokindex` monteras samtidigt på startsidan och annars hade skickat var sin identisk
läsning; sessionscache per uid (statusen kan aldrig ändras mitt i en session – den sätts bara
av en Cloud Function); och en effekt utan synkrona `setState`-anrop, eftersom
`react-hooks/set-state-in-effect` flaggar det (samma problem som redan är kommenterat i
`Leverantor.jsx:109`).

**Incidentdokumenten:** `INCIDENT-CHECKLISTA.md`s snabbreferens "Var saker finns" fick en ny
rad. Fem steg i checklistan pekar på `/leverantor` under tidspress – bland annat det globala
e-postnödstoppet – och fram till nu stod det ingenstans hur man tar sig dit.
`avtal/INCIDENTRESPONSPLAN.md` rördes INTE: ingen detektions-, begränsnings- eller
återställningsförmåga är ändrad, inga nya personuppgifter, ingen regeländring. Samma
bedömningsmönster som för Etapp 65b/66b/66c/66d.

**Testat:** `npm run lint`, `npm run build`, `npx vitest run` (216/216, varav 4 nya i
`src/firebase/arPlattformsadminGating.test.js` som låser fast superadmin-avgränsningen så att
en framtida "förenkling" inte tyst kan vidga den). `test:rules`/`test:storage`/`test:functions`
kördes inte – varken `firestore.rules`, `storage.rules` eller någon Cloud Function är rörd.

---

### 67b – Nyckeltalsrad överst ✅ KLAR (2026-08-16, v5.110.0)

**Idé:** svara på "hur ligger det till?" innan man börjar läsa listan. Överblick först,
detaljer sen – det är hela skillnaden mellan en lista och en dashboard.

**Premisskontroll:** se fynd 4 och 5. All data finns redan i svaret från
`listaOrganisationer`; ingen ny läsväg behövs. Demo måste exkluderas explicit (krav 29).

**Bygge:** ny `src/components/leverantor/NyckeltalSektion.jsx`, renderad först på sidan:

| Nyckeltal | Härledning |
|---|---|
| Aktiva kunder | `status === "aktiv" && !arDemo` |
| Varav i provperiod | `provperiodSlut` satt och i framtiden |
| Totalt antal användare | summa `antalAnvandare`, demo exkluderad |
| Summerat avtalat pris | summa `avtaladArsavgiftKr`, demo exkluderad – **med uttrycklig märkning av hur många kunder som saknar ifyllt pris**, annars ser summan mer komplett ut än den är |
| Kräver åtgärd | antal poster i 67c:s lista |
| Delad sökkvot i dag | finns redan som egen sektion – flyttas in hit istället för att dupliceras |

Varje tal är klickbart och filtrerar organisationslistan därunder (kopplar ihop med 67d).

**Klart när:** raden syns överst, siffrorna stämmer mot en manuell räkning av listan,
demo-organisationen räknas inte in i något av talen, och antalet kunder utan ifyllt pris
framgår explicit av prissiffran.

**Genomfört.** En avvikelse mot skissen, gjord medvetet för att inte bygga bort sig själv i
67c/67d: "Kräver åtgärd"-räkningen bygger på en NY delad util,
`src/utils/leverantorSignaler.js` (`berakLeverantorSignaler`), byggd nu snarare än separat i
67c – annars hade 67b antingen behövt en förenklad tillfällig räkning som 67c sedan skrivit
över, eller så hade samma sex/sju villkor riskerat att implementeras på två ställen och glida
isär. Funktionen tar en injicerbar "nu"-tidpunkt (samma mönster som `utils/kompetensStatus.js`)
för deterministisk testning. 14 tester i `leverantorSignaler.test.js`, inklusive att
demo-organisationen ALDRIG ger en signal oavsett tillstånd (krav 29) och att en organisation
med flera samtidiga problem sorteras HÖG→MEDEL→LÅG.

Klickbarheten byggdes som ett `snabbfilter`-state i `Leverantor.jsx` (`null | "aktiva" |
"provperiod" | "atgard"`) – medvetet en egen, bestående variabel redan nu (inte en tillfällig
lösning), eftersom 67d ska bygga vidare på DEN, inte ersätta den med något nytt. Listan nedanför
filtreras av samma state, med en explicit "Visa alla (rensa filter)"-knapp och en rubrik som
visar "N av M" när ett filter är aktivt. Varje rad fick ett stabilt `id="org-{orgId}"` – inte
använt av 67b själv, men förberett för att 67c:s åtgärdsrader ska kunna länka dit.

"Delad sökkvot idag" flyttades in i `NyckeltalSektion.jsx` från sin tidigare egna sektion,
enligt planens uttryckliga instruktion – inte duplicerad.

**Testat:** `lint`/`build`/`vitest run` (230/230, varav 14 nya). Inga regelfiler eller
Cloud Functions rörda – `test:rules`/`test:storage`/`test:functions` kördes inte.

---

### 67c – "Kräver åtgärd"-listan ✅ KLAR (2026-08-16, v5.111.0)

**Idé:** gör vyn styrande i stället för bara beskrivande. I dag måste du själv komma ihåg
att kolla vilka provperioder som håller på att ta slut – ingenting påminner dig.

**Premisskontroll:** se fynd 6. Fem av sex tänkta signaler finns bevisligen i datan i dag.
Den sjätte ("offert som legat stilla") kräver ett nytt fält och ligger därför i
beslutspunkt 2, inte i det här bygget.

**Bygge:** ny `src/components/leverantor/KraverAtgardSektion.jsx`, direkt under nyckeltalen.
Varje rad länkar till rätt organisation längre ner. Signaler, samtliga verifierade:

- **Provperiod går ut inom 14 dagar** – i dag pausas organisationen automatiskt av
  `kontrolleraProvperioder` (dagligen 05:00) och kunden varnas av `ProvperiodBanner.jsx`,
  men **leverantören får ingen förvarning alls**. Det är den mest värdefulla signalen i
  listan.
- **Provperiod redan utgången** (organisationen är alltså nypausad).
- **Nära sökkvottaket** – ≥80 % av sitt eget tak, samma tröskel som den globala varningen
  redan använder (`Leverantor.jsx:482`).
- **Schemalagd radering pågår** – finns redan som badge på raden, men syns bara om man
  skrollar till just den kunden.
- **Aktivt supportfönster** – samma sak; ett öppet fönster är något man vill se direkt.
- **Pausad utan schemalagd radering** – en kund som blivit pausad och sedan glömts bort.

Sorteras med allvarligast först. Är listan tom visas det uttryckligen ("Inget kräver din
uppmärksamhet just nu") – en tom yta läses som "inte laddat än", inte som "allt är bra".

**Klart när:** varje signal går att provocera fram mot emulatorn, listan är tom med rätt
text när inget är fel, och ingen signal bygger på ett fält som inte finns.

**Genomfört.** Signalberäkningen (`berakLeverantorSignaler`) byggdes redan i 67b, delad med
nyckeltalsrutans räkning – se 67b:s "Genomfört". Det här delmålet blev därför en ren
renderingskomponent, `KraverAtgardSektion.jsx`: en rad per signal med allvarlighetsikon
(🔴/🟡/🔵), organisationsnamn som en `<a href="#org-{orgId}">`-länk (native ankarlänk räcker –
67b:s `id="org-{orgId}"` på varje rad gör att webbläsaren skrollar dit utan egen JS), och
signalens text. Tom lista visar uttryckligen "Inget kräver din uppmärksamhet just nu" istället
för en tom yta.

**En sjunde signal utöver planens ursprungliga sex, möjliggjord av beslutspunkt 2:**
"stillastående offert" (`avtalsstatus === "offert"` och ≥30 dagar sedan `avtalsstatusAndrad`,
med `skapad` som fallback för en offert som aldrig ändrats). 30 dagar är inte hämtat ur någon
plan-text – ett rimligt förstaval, dokumenterat som sådant i koden, inte en branschnorm.

**Testat:** signalernas logik är redan täckt av 67b:s 14 tester i `leverantorSignaler.test.js`
(byggda mot den delade utilen, inte mot en UI-komponent). `lint`/`build`/`vitest run`
(230/230, oförändrat antal eftersom inga nya tester behövdes för en ren renderingskomponent).

---

### 67d – Sortering, filtrering och sök ✅ KLAR (2026-08-16, v5.112.0)

**Idé:** listan är i dag osorterad (den kommer i den ordning Firestore råkar returnera
dokumenten) och har varken filter eller sök. Vid tre kunder spelar det ingen roll; vid
trettio är det ohanterligt.

**Premisskontroll:** ren klientlogik på redan hämtad data – ingen ny läsväg. Fritextsök över
`namn` och `huvudman` behöver inget sökindex vid den här datamängden; `Fuse.js` finns i
projektet men är överdrivet här och läggs medvetet inte på.

**Bygge:**
- Sortering: namn, antal användare, avtalat pris, senaste månadens kostnad, provperiodslut.
- Filter: avtalsstatus, status (aktiv/pausad/raderad), modul, visa/dölj demo.
- Fritextsök på namn och huvudman.
- Valt filter speglas i URL:en (`?status=pausad`) så en vy går att länka till och bokmärka.

**Klart när:** listan går att sortera och filtrera, valen överlever en siduppdatering, och
nyckeltalen i 67b fungerar som filtergenvägar.

**Genomfört.** Filter-/sorteringslogiken ligger i en ny ren util,
`src/utils/leverantorFilter.js` (`filtreraOchSorteraOrganisationer`), samma
utils-först-mönster som `leverantorSignaler.js`. Hela tillståndet – snabbfilter, avtalsstatus,
status, modul, visa/dölj demo, fritextsök, sorteringsfält, sorteringsriktning – speglas i
URL:en via `useSearchParams` (`?status=pausad&sort=pris&riktning=desc`), med `replace: true` så
varje tangenttryckning i sökfältet inte lägger en egen post i webbläsarhistoriken.

67b:s `snabbfilter` (nyckeltalsrutornas genväg) ersattes INTE av det nya – det är fortfarande
samma variabel, bara flyttad från lokal `useState` till URL-parametern `snabb`, precis som
utlovat i 67b:s "Genomfört". De två filterlagren kombineras med OCH i
`filtreraOchSorteraOrganisationer`.

En detalj värd att notera: saknade värden (t.ex. ett avtalat pris som aldrig fyllts i) sorteras
alltid sist, oavsett stigande/fallande riktning – annars hoppar "sortera på pris, fallande"
förvirrande mellan "dyraste kund" och "kund utan ifyllt pris" beroende på vilken riktning man
valt.

**Testat:** 9 nya tester i `leverantorFilter.test.js` (kombinerade filter med OCH inte ELLER,
fritextsök mot namn ELLER huvudman, saknade sorteringsvärden alltid sist i båda riktningarna,
snabbfiltret `atgard` exkluderar alltid demo). `lint`/`build`/`vitest run` (239/239) gröna.

---

### 67e – Dela upp `Leverantor.jsx` ✅ KLAR (2026-08-17, v5.113.0)

**Idé:** filen är 990 rader redan innan den här etappen och skulle passera 1 300 med
67a–67d inbyggda. Dela upp den i sektionskomponenter.

**Premisskontroll:** projektet har gjort exakt det här förut, med gott resultat – Etapp 8c
delade upp `Admin.jsx` i `src/components/admin/`, som i dag rymmer ~40 sektionsfiler och är
lätt att arbeta i. Samma mönster, samma katalogkonvention.

**Bygge:** flytta ut till `src/components/leverantor/`: `SkapaOrganisationSektion`,
`DemomiljoSektion`, `HuvudmanSektion`, `OrganisationsListaSektion`,
`OrganisationsRad` (raden med sina fyra utfällbara paneler – diagnostik, innehåll, ärenden),
`EpostNodstoppSektion`. Ren flytt, ingen beteendeförändring.

**Ligger sist, medvetet:** en ren refaktorering utan synlig nytta ska inte blockera de fyra
delmål som faktiskt ger något. Etapp 8c gjorde likadant – delade upp `Admin.jsx` *efter* att
den vuxit, inte i förebyggande syfte.

**Klart när:** `Leverantor.jsx` är under ~250 rader, allt beteende är oförändrat, och hela
testsviten är fortsatt grön.

**Genomfört.** `Leverantor.jsx` gick från 1145 till **217 rader**. Sex nya filer i
`src/components/leverantor/`: `SkapaOrganisationSektion`, `DemomiljoSektion`,
`EpostNodstoppSektion`, `HuvudmanSektion`, `OrganisationsListaSektion`, `OrganisationsRad` –
plus en delad konstant, `avtalsstatusEtikett.js` (tidigare definierad en gång i
`Leverantor.jsx`, nu behövd på två ställen: filterradens avtalsstatus-väljare och varje rads
egen).

**Avvikelse mot Admin.jsx:s rena mönster, medveten:** Etapp 8c:s sektioner i `src/components/
admin/` är nästan alla HELT självständiga (egna hooks, egna Firestore-anrop, i praktiken noll
props – se t.ex. `RaderaOrganisationSektion.jsx`). Tre av de sex nya komponenterna följer det
exakt (`SkapaOrganisationSektion`, `DemomiljoSektion`, `HuvudmanSektion` – minimala props, en
callback för att trigga omladdning). Men `OrganisationsListaSektion`/`OrganisationsRad` kunde
INTE göras lika självständiga: `NyckeltalSektion` (67b, ett SYSKON högre upp på sidan) behöver
exakt samma filter-/sorteringstillstånd som listan, så det tillståndet måste ligga i
`Leverantor.jsx` (föräldern till båda) och skickas ner som props – annars hade nyckeltalsrutan
och listan kunnat visa olika saker.

**Ett beteende bevarades medvetet oförändrat trots att det inte var den "naturliga" lösningen:**
`diagnostikOppen`/`innehallOppen`/`arendenOppen` är fortfarande EN variabel var i
`OrganisationsListaSektion` (inte per-rad-state i `OrganisationsRad`) – exakt den
ursprungliga semantiken "bara en organisations panel åt gången i HELA listan". Projektets
etablerade per-rad-hook-mönster (`RutinKort.jsx`, `PagagendeTilldelning` från Etapp 66b) hade
gett en teknisk sett snyggare lösning med flera samtidigt öppna paneler, men planens egen
"Klart när" kräver oförändrat beteende – en förbättring smugglad in i en refaktorering är
precis vad "ren flytt" utesluter.

**Testat:** inga nya tester behövdes – ingen ny logik skrevs, bara flyttad. `lint`/`build`/
`vitest run` (239/239, oförändrat antal) gröna, vilket bekräftar att inga importfel eller
brutna referenser smög sig in under flytten.

---

## Beslutspunkter som kräver ägaren — AVGJORDA 2026-08-16

Ägaren svarade "vi följer dina rekommendationer" på samtliga tre. Se `BESLUTSLOGG.md` för
raden. Originaltexten står kvar nedan, kort, som ett spår för varför varje val gjordes.

**1. Samma sida eller en ny? → Samma sida.** Nyckeltal och åtgärdslista läggs överst i
`/leverantor`, resten skrollar under. En separat `/leverantor/oversikt` skulle dela
plattformsadmin-funktionerna över två adresser i onödan.

**2. Ska `avtalsstatusAndrad` byggas? → Ja, väg (a). ✅ KLAR (2026-08-16, v5.109.0).** En
`serverTimestamp()` läggs till i `satAvtalsstatus` (framåtriktat – befintliga kunder får
ingen historik för tidigare byten), plus att `skapad` börjar returneras av
`listaOrganisationer` (fältet fanns redan, skrevs bara aldrig ut). Ger "kund skapad för N
dagar sedan, fortfarande i offertläge" utan loggenomgång. Den avgörande skillnaden mot
alternativ (b) – härledning ur revisionsloggen – är kostnad: (b) hade krävt en extra läsning
PER organisation vid varje sidladdning.

**Genomfört:** `avtalslivscykel.js`s `satAvtalsstatus` skriver nu `avtalsstatusAndrad` i samma
`set(..., { merge: true })` som `avtalsstatus` själv – ingen extra skrivning, ingen ändrad
transaktionsgräns. `organisationslivscykel.js`s `listaOrganisationer` returnerar båda fälten
som ISO-strängar (`null` om aldrig satt). **Ren serverändring, ingen UI-yta ännu** – 67b/67c
är de delmål som faktiskt visar värdena; det här var bara underlaget beslutspunkt 2 pekade ut.
Tre nya tester i `tests/functions/etapp6.test.cjs`: `avtalsstatusAndrad` sätts av
`satAvtalsstatus` och syns i `listaOrganisationer`; en organisation som aldrig bytt
avtalsstatus visar `null` (inte ett fel); `skapad` returneras som en giltig ISO-tidsstämpel
för en nyetablerad organisation. **Testat:** `lint`/`build`/`vitest run` (216/216) och
`test:functions` (hela kedjan, inklusive de tre nya) – alla gröna. `test:rules`/`test:storage`
kördes inte, ingen regelfil rörd.

**3. Är omfattningen rätt? → Ja, oförändrad.** Faller behovet att korta senare är 67e
(ren underhållbarhet) och 67d (bekvämlighet vid få kunder) de som ska strykas först – i den
ordningen. 67a–67c är kärnan.

---

## Vad jag INTE föreslår, och varför

- **Kostnadstrend per kund över tid.** Datan finns (fynd 7) och det vore snyggt, men en
  bredare läsning av `kostnadshistorik` för alla organisationer × 12 månader multiplicerar
  antalet dokumentläsningar vid varje sidladdning av en vy man öppnar ofta. Vänta tills
  GCP-faktureringsexporten (beslutad 2026-08-15, se `BESLUTSLOGG.md`) faktiskt levererar
  data – då hör trend och full molnkostnad hemma i samma bygge, som Etapp 48c, i stället för
  att byggas två gånger.
- **Täckningsbidrag per kund.** Samma sak: det är Etapp 48c, nu upplåst men inte byggbart
  förrän exporten kört en tid. Nyckeltalsraden i 67b säger medvetet "avtalat pris", inte
  "marginal", och `Leverantor.jsx:651–657` har redan en ärlig brasklapp om skillnaden som
  ska stå kvar.
- **Notiser/mejl till leverantören när något kräver åtgärd.** Frestande, men
  `skickaEpost()`-infrastrukturen finns redan (Etapp 53a) och skulle göra det här till ett
  mycket större bygge med en egen beslutspunkt om frekvens och nödstopp. Bygg
  åtgärdslistan först och se om den räcker – en daglig vana att öppna vyn är billigare än
  ett mejlflöde man börjar ignorera.
- **Grafer och diagram.** Projektet har inget diagrambibliotek och ska inte få ett för det
  här. Siffror och sorterbara listor svarar på frågorna; ett stapeldiagram över fem kunder
  är dekoration.

---

## Sammanfattning

| Delmål | Vad | Ny läsväg? | Serverändring? |
|---|---|---|---|
| 67a ✅ | Vägen in: hook + länk i Mer-menyn och kommandopaletten | Ja, en per session – och bara för superadmins | Nej |
| 67b ✅ | Nyckeltalsrad överst, demo exkluderad (krav 29) | Nej | Nej |
| 67c ✅ | "Kräver åtgärd"-lista, nu sju signaler (sjätte tillkom med beslutspunkt 2) | Nej | Nej |
| 67d ✅ | Sortering, filtrering, fritextsök, filter i URL:en | Nej | Nej |
| 67e ✅ | Dela upp `Leverantor.jsx` enligt Etapp 8c:s mönster | Nej | Nej |

Fyra av fem delmål kräver **ingen serverändring alls** – all data hämtas redan, den
presenteras bara aldrig. Enda undantaget är beslutspunkt 2, om ägaren väljer väg (a).
