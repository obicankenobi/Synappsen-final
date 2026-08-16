# Etapplan 16 – Leverantörens överblick: från lista till dashboard

*Utkast 2026-08-16. **ANTAGEN 2026-08-16** – ägaren följde samtliga tre rekommendationer
(samma sida, bygg `avtalsstatusAndrad` väg (a), oförändrad omfattning), se `BESLUTSLOGG.md`.
**67a är klart** (v5.108.0, byggt separat samma dag). 67b–67e är antagna men ännu ogjorda.*

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

### 67b – Nyckeltalsrad överst ⬜

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

---

### 67c – "Kräver åtgärd"-listan ⬜

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

---

### 67d – Sortering, filtrering och sök ⬜

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

---

### 67e – Dela upp `Leverantor.jsx` ⬜

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
| 67b | Nyckeltalsrad överst, demo exkluderad (krav 29) | Nej | Nej |
| 67c | "Kräver åtgärd"-lista med sex verifierade signaler | Nej | Nej |
| 67d | Sortering, filtrering, fritextsök, filter i URL:en | Nej | Nej |
| 67e | Dela upp `Leverantor.jsx` enligt Etapp 8c:s mönster | Nej | Nej |

Fyra av fem delmål kräver **ingen serverändring alls** – all data hämtas redan, den
presenteras bara aldrig. Enda undantaget är beslutspunkt 2, om ägaren väljer väg (a).
