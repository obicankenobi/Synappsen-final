# Etapplan 6 – Innehållet som håller: redaktionell kvalitet och bevisad nytta

**✅ ANTAGEN 2026-08-01.** Utgångsläge v5.56.0, efter Etapp 22–31 och med `etapplaner/ETAPPLAN5.md`
(Etapp 32–36) i det närmaste avslutad. Etapp 37–41.

**Detta är den AKTIVA planen för nytt arbete.** `etapplaner/ETAPPLAN5.md` är inte stängd – dess
kvarvarande punkter (Etapp 32b, ToS-genomgången, Etapp 30b, uppföljningen av 35e) är
**blockerade av ägarbeslut eller extern tid, inte av kapacitet**, och fortsätter spåras där.
Ta dem så snart respektive blockering lossnar; bygg allt annat nytt härifrån.

> **Tre alternativ valdes bort till förmån för den här planen** – "Från byggd produkt till såld
> produkt" (SSO, veckopuls, kioskläge, onboarding), "Förtjäna förtroendet" (rollmatris som
> testsvit, tomläge kontra felläge, WCAG AA, akutläget i verkligheten) och "Kund nummer tre"
> (flera enheter, demo, supportbarhet, kostnad per kund). De är **inte förkastade** utan
> flyttade till `produkt/FRAMTIDSPLAN.md`, som numera är arkivet för ej antagna planer. Se den filen
> för motivering per alternativ och för när respektive bör omprövas.
>
> **Ärlig anmärkning om de tre (premisskontroll 2026-08-01):** de två första finns som
> fullständiga utkast (`etapplaner/ETAPPLAN5-ALT-A.md`, `etapplaner/ETAPPLAN5-ALT-B.md`). Det tredje, "Kund nummer
> tre", har **aldrig skrivits ned som en egen fil** – det existerar bara som den
> sammanfattning som står i `produkt/FRAMTIDSPLAN.md`. Om det alternativet någon gång ska antas
> måste det skrivas ut ordentligt först; behandla det inte som ett färdigt underlag.

---

## Premisskontroll utförd före antagande (genomgående krav 8)

Planens kodpåståenden är stickprovskontrollerade mot faktisk kod 2026-08-01, innan den antogs:

| Påstående i planen | Verifierat |
|---|---|
| `borGranskas()` finns i `utils/rutinHjalp.js` | ✅ `src/utils/rutinHjalp.js:5` |
| `useVisningar` finns | ✅ `src/hooks/useVisningar.js` |
| `useLaskvittering` finns | ✅ `src/hooks/useLaskvittering.js` |
| Rutinägarfält finns | ✅ används i `RutinFormular.jsx`, `RutinKort.jsx`, `useNotiser.js` |
| Källbevakningens varningar finns | ✅ `functions/index.js` (`kallbevakningSchemalagt`) |
| Versionsdiff byggd i fas 8 (38c) | ✅ `src/components/VersionsHistorik.jsx` – radbaserad LCS-diff |
| Kvissbank finns (41b) | ✅ `src/components/KvissModal.jsx` |
| Checklistestatistik finns (39a) | ✅ `src/hooks/useChecklistStatistik.js`, `ChecklistStatistikSektion.jsx` |

Slutsats: planens antagande att Etapp 37a i huvudsak är en **sammanställning av befintlig
data, inte ny insamling**, håller. De per-delmål-markerade premisskontrollerna nedan ska ändå
göras vid byggstart – det här är en rimlighetskontroll av planen, inte en omfattningsanalys.

---

## Varför innehåll blir nästa bas

`etapplaner/ETAPPLAN5.md`s huvudinsikt var att produkten var byggd för att **förhindra** men inte för att
**upptäcka**. Samma mening gäller ordagrant om innehållet, och den saknar fortfarande sin
lösning:

> **Synappsen är byggd för att innehåll ska skapas och godkännas korrekt, men saknar nästan
> helt förmågan att upptäcka när det som redan ligger där har blivit fel, gammalt eller
> motsägelsefullt.**

Fyra konkreta belägg ur den uppdaterade dokumentationen:

1. **Källbevakningen (Etapp 21) larmar bara om att en *extern* källa ändrats.** Ingenting
   larmar om att organisationens egen rutin är tre år gammal, saknar ägare och aldrig lästs av
   någon. En kunskapsbank som ruttnar inifrån ser precis likadan ut som en välskött – ända
   tills någon följer en inaktuell rutin i ett akutförlopp.
2. **Etapp 31b är själva beviset på mönstret.** Standardrollen `personal` såg tomma listor i
   rutiner, förråd och akutläge i månader utan att någon märkte det. `etapplaner/ETAPPLAN5.md` drog rätt
   slutsats för säkerhet (32a byggde felmedvetna hooks). Samma slutsats för innehåll är inte
   dragen.
3. **Nyttan mäts men går inte att visa över tid.** Tid-att-hitta (fas 32), kvitteringsgrad,
   nollträffar i sökloggarna och checklistkörningar (18d) finns – men som ögonblicksbilder i
   adminpanelen. Vid en avtalsförlängning är frågan inte "vad kan appen?" utan "vad hände hos
   er?". Trenddata måste dessutom börja sparas *innan* den kan visas: ju senare den här planen
   körs, desto mindre historik finns det.
4. **Etapp 26 gav medarbetarna en röst – men ingen kapacitet att svara.** Ändringsförslag är
   byggt. `etapplaner/ETAPPLAN4.md`s egen beslutspunkt om vem som modererar och med vilken svarstid är
   fortfarande obesvarad. Ett förslagsflöde utan bemanning blir en besvikelsemaskin, precis
   som planen själv varnade för.

**Målgruppen är alltså inte personalen och inte upphandlaren – det är de fem till tio
personer som bär hela produktens värde: VÖL, VEC, sektionsledare och förrådsansvariga.**
De har fått mer att göra i varje etappplan hittills och inga nya verktyg sedan Etapp 8.

---

## Ordningsprincip

1. **Etapp 37 först** – innehållshälsan är den enda risken i planen som växer av sig själv
   varje dag den inte hanteras.
2. **Etapp 38 direkt efter** – den gör redaktörernas arbete snabbare, och Etapp 37 kommer att
   ge dem mer att göra. I omvänd ordning blir 37 en pekpinne.
3. **Etapp 39** måste börja mäta tidigt av rent kronologiska skäl.
4. **Etapp 40–41** är förädling som blir meningsfull först när grunden ovan sitter.

> **Undantag värt att notera:** 39a (veckovis ögonblicksbild) är billig och ren
> datainsamling utan UI-beroenden. Den kan – och bör – byggas parallellt med Etapp 37 i
> stället för att invänta sin tur, eftersom varje vecka utan snapshot är permanent förlorad
> historik. Det är den enda avvikelsen från ordningen ovan som rekommenderas.

---

## Genomgående krav

De tretton kraven i `etapplaner/ETAPPLAN3.md`/`etapplaner/ETAPPLAN4.md`/`etapplaner/ETAPPLAN5.md` gäller oförändrat. Två
tillkommer:

14. **Ingen mätning får kunna peka ut en enskild medarbetare i en chefsvy.** Den här planen
    samlar mer användningsdata än någon tidigare. Individdata syns bara för individen själv;
    allt som visas för en chef är aggregerat, och det ska framgå i gränssnittet vad som mäts.
    Samma hållning som Etapp 19b redan tog för mikrokvissen – nu som ett formellt krav.
    **Konkretisering (tillagd vid antagandet):** "aggregerat" räcker inte som skydd i en
    verksamhet med fem till tio nyckelpersoner. Varje aggregerad vy som bygger på frivilliga
    svar eller individuellt beteende ska ha en **minsta-n-spärr: visa ingenting alls om
    underlaget understiger 5 svarande/individer**, och skriv ut i vyn varför det är tomt
    ("för få svar för att visas anonymt") i stället för att visa en nolla. Gäller särskilt
    39c, men även varje nedbrytning per område i 37a och 39a där ett område kan bestå av en
    handfull personer.
15. **Ingen automatik får ändra kliniskt innehåll.** Systemet får flagga, föreslå och sortera.
    Att slå ihop, skriva om eller avpublicera en rutin är alltid ett mänskligt beslut. Detta är
    en direkt förlängning av MDR-gränsdragningen i `granskningar/SAKERHETSRAPPORT.md` (2026-07-27).

---

# Etapp 37 – Innehållets hälsa

**Varför:** Den största obyggda risken i produkten. Appen kan i dag svara på "vad står i
kunskapsbanken?" men inte på "hur aktuell är den?".

**Modul:** Core (panelen) / Operations (kampanjerna – de bygger på rutinägare och påminnelser
som redan finns där).

### 37a – Innehållshälsopanel ✅ KLAR (2026-08-01)

- En vy (superadmin, samt VÖL/VEC för sitt eget område) som per godkänd rutin visar: ålder,
  passerat granskningsdatum, saknad ägare, aldrig kvitterad av någon, obesvarad
  källvarning, utgångsdatum passerat.
- En sammanvägd hälsosiffra per område och för organisationen, **med synlig uträkning** – aldrig
  ett svart-låda-betyg som ingen kan ifrågasätta.
- **Siffran får aldrig visas utan sin nedbrytning i samma vy** (skärpning tillagd vid
  antagandet). En ensam siffra som går att citera i ett ledningsmöte blir ett mål i sig i
  stället för ett diagnosverktyg – och det som optimeras då är siffran, inte innehållet. Den
  ska alltid stå bredvid de poster den räknats fram ur, så att nästa naturliga klick är "vilka
  rutiner drar ner det här?" snarare än "hur höjer vi talet?". Av samma skäl: **exportera inte
  hälsosiffran som ett ensamt nyckeltal till ledningsrapporten** utan att de tre största
  bidragande orsakerna följer med.

**Premisskontroll vid byggstart (krav 8) hittade TVÅ fel i utkastet, båda åtgärdade genom att
ta bort respektive kriterium i stället för att bygga något som ger fel svar:**

1. **"Aldrig visad" gick INTE att bygga på `visningar`-collectionen.** Den skrivs bara när en
   rutin öppnas via sökresultat eller kommandopaletten (`SokFalt.jsx`/
   `KommandopalettInnehall.jsx`) – inte vid vanlig bläddring i en sektion, vilket är hur de
   flesta faktiskt läser en rutin. Kriteriet hade flaggat nästan alla rutiner som "aldrig
   visade" oavsett hur ofta de faktiskt lästs. En felaktig signal är värre än ingen (samma
   princip som redan gäller incidentdokumenten) – kriteriet är därför medvetet inte byggt.
2. **"Saknade steg trots att checklistläget är påslaget för organisationen" beskrev en växel
   som inte finns.** Checklistläge är en egenskap per rutin (om `steg` är ifyllt), inte ett
   organisationsomfattande moduläge. Kriteriet är därför omöjligt att implementera som
   beskrivet och är utelämnat.

**Genomfört:** ren beräkningsfunktion `sammanstallHalsa()`/`berakningHalsa()` i
`src/utils/innehallshalsa.js` (13 vitest-tester, inklusive att en tom organisation ger `null`
i stället för 0, och att utkast aldrig räknas med). Ny sektion
`InnehallshalsaSektion.jsx` i adminpanelen – visas hela för superadmin (alla tre områden:
kliniskt-stod, logistik, administration) och begränsad till eget område för VÖL/sektions-
ledare/VEC/förrådsansvarig (`endastOmrade`-prop). Ingen ny collection, inget nytt Firestore-
fält – ren sammanställning av `granskadDatum`, `agare`, `lasteAv`, `kallVarning`,
`utgangsdatum`, precis som premisskontrollen förutsåg. Verifierat i en riktig webbläsare mot
Firestore-/Auth-emulatorerna (Playwright, inte bara vitest): en frisk rutin utan flaggor, en
rutin med fyra flaggor, och ett utkast som korrekt utelämnas helt – hälsosiffran (50%) visades
tillsammans med sin fullständiga nedbrytning, aldrig ensam. Version 5.56.0 → **5.57.0**.

### 37b – Riktade granskningsrundor ✅ KLAR (2026-08-01)

- Superadmin startar en runda: ett urval (t.ex. allt över 18 månader i Kliniskt stöd), en
  deadline, och en påminnelse till varje rutins ägare via befintliga notiser + push (Etapp 24).
- Följs upp i ledningsrapporten: hur många granskade, av vem (rundans SKAPARE, inte per
  redaktör), vad återstår.
- **Ingen ny notiskanal** – genomgående krav 10 gäller, och push är redan avstängbart per typ.
- **"Vad återstår" redovisas per rutin och område, inte som en rankning per person**
  (förtydligande tillagt vid antagandet, krav 14). Skillnaden är liten i kod och avgörande i
  praktiken: en lista över eftersläpande rutiner är ett arbetsverktyg, en lista över
  eftersläpande kollegor är ett övervakningsverktyg.

**Genomfört:** ny collection `granskningsrundor/{rundaId}` (`organisationId`, `omrade`,
`trosallDagar`, `deadline`, `rutinIds` – en OFÖRÄNDERLIG ögonblicksbild tagen vid skapandet,
`skapadAv`/`skapadAvNamn`, `skapad`). `firestore.rules`: läsning/skrivning bara för superadmin
i egen organisation, `rutinIds` kan aldrig uppdateras i efterhand (`allow update: if false`) –
11 nya regeltester (`tests/rules/granskningsrundor.test.mjs`). Ny Cloud Function-trigger
`hanteraGranskningsrundaSkapad` slår ihop flera rutiner med SAMMA ägare till EN push (inte en
per rutin) – 6 nya funktionstester. Klientsidan: `useGranskningsrundor()`-hook,
`GranskningsrundorSektion.jsx` (superadmin-only: väljer område + tröskel i dagar + deadline,
listar aktiva rundor med framsteg och en "Vad återstår"-lista av rutinnamn), ny push-typ
`granskningsrunda` i `Profil.jsx` (förvalt avstängd, krav 10), och en ny sektion i
`Ledningsrapport.jsx`. **Återanvänder helt den befintliga "Markera som granskad"-knappen**
(fanns redan i `Sektionssida.jsx`/`RutinKort.jsx` sedan tidigare) – en rutin räknas som klar
i en runda när dess `granskadDatum` är nyare än rundans starttid, ingen ny
"klar"-mekanism byggd.

Ren beräkningsfunktion `berakningRundaFramsteg()` i `src/utils/granskningsrunda.js` (5
vitest-tester) håller `kvarstar`-listan fri från allt annat än `{id, titel, omrade, granskad}`
– verifierat direkt i ett test att inga personfält kan smyga sig in (krav 14). Verifierat i en
riktig webbläsare mot emulatorerna (Playwright): en runda skapad med rätt urval (100-dagars
tröskel matchade 1 av 2 rutiner korrekt), framsteg visade "0 av 1" direkt efter start och "1 av
1" efter att den befintliga "Markera som granskad"-knappen klickats – hela kedjan
UI→Firestore→beräkning fungerar utan någon ny mekanism för själva granskningen. Fullt testsvep
grönt (lint, build, vitest 91/91, test:rules, test:functions, test:storage). Version 5.57.0 →
**5.58.0**.

### 37c – Dubbletter och motsägelser ⏳ BYGGD (2026-08-01), VÄNTAR PÅ PILOTUTVÄRDERING

- Mekanisk likhetsjämförelse mellan godkända rutiner (Fuse.js finns redan) som flaggar par som
  liknar varandra misstänkt mycket.
- **Presenteras som en fråga till en människa, aldrig som ett påstående.** Ingen automatisk
  sammanslagning (krav 15). En felaktig hopslagning av två vårdrutiner är en patientsäkerhets-
  händelse, inte en städbugg.
- **Bygg detta sist inom Etapp 37, och pilota på ETT område först** (tillagt vid antagandet).
  Mekanisk textlikhet i en kunskapsbank där rutiner medvetet delar struktur, rubriker och
  standardformuleringar kommer att ge falska positiver – och en flagga som oftast har fel
  slutar läsas efter tredje gången, precis som förslagsflödet i 38b. **Klart-kriterium för
  37c specifikt:** på det piloterade området ska minst hälften av de flaggade paren bedömas
  som rimliga att titta på av en redaktör. Nås inte det, justera tröskeln eller lägg ner
  delmålet – hellre ingen dubblettdetektion än en som lär redaktörerna att ignorera flaggor.

**Genomfört – premisskontroll (krav 8):** Fuse.js är redan en dependency (`package.json`),
bekräftat innan bygget. **Viktigt tekniskt fynd under byggandet:** en naiv implementation som
matar in TITEL+INNEHÅLL ihopklistrat som Fuse-sökfråga gav en missvisande hög poäng (~0.64)
även för en rutin jämförd med sig SJÄLV, eftersom Fuse:s fuzzy-algoritm (Bitap) är byggd för
korta sökfrågor mot ett fält, inte för att jämföra hela dokument mot varandra. Löst genom att
söka på bara TITELN som fråga (innehållet vägs ändå in som ett indexerat `keys`-fält) – gav
en poängseparation på ~0.15 för en verklig nästan-dubblett mot ~0.6 för besläktat men olika
innehåll, en tydlig marginal att lägga en tröskel i.

Ny ren funktion `hittaMisstankaDubbletter()` i `src/utils/dubblettdetektion.js` (7
vitest-tester) returnerar par sorterade efter likhet, med DET LÄGSTA av de två asymmetriska
Fuse-poängen (sökning A→B ger inte samma poäng som B→A). Ny collection
`dubblettdismissningar/{dismissId}` (organisationId, omrade, `parNyckel`, `dismissadAv`) så en
redaktör kan avfärda ett par som INTE är en dubblett utan att det flaggas igen – 8 nya
regeltester (skapande/radering kräver redigeringsbehörighet för området, ingen uppdatering
tillåten alls). Ny `DubbletterSektion.jsx`, **hårdkodad till Kliniskt stöd som pilotområde**
(inte en valbar dropdown – en medveten begränsning tills klart-kriteriet utvärderats), med ett
justerbart känslighetsreglage (förval 0.3, kalibrerat mot ett verklighetsnära exempel under
utvecklingen: en rutin med identiskt innehåll men ett titelsuffix som "(uppdaterad)" gav
poäng ~0.27). Varje par visas med länkar till båda rutinerna och en "Inte samma sak –
avfärda"-knapp – **ingen sammanslagningsfunktion byggd, ingen kan finnas** (krav 15).

Verifierat i en riktig webbläsare mot emulatorerna: ett verkligt nästan-dubblettpar upptäcktes
korrekt (poäng 0.27, under förvalet 0.3), och efter avfärdande försvann paret permanent (ny
Firestore-dokument skrivet, filtrerat bort vid nästa rendering). Fullt testsvep grönt (lint,
build, vitest 98/98, test:rules, test:storage). Version 5.58.0 → **5.59.0**.

**Varför INTE "✅ KLAR":** klart-kriteriet ("minst hälften av flaggade par bedöms rimliga")
kräver en människas bedömning mot verkligt innehåll över tid – något den här sessionen inte
kan avgöra åt ägaren. Koden är byggd, testad och verifierad att fungera tekniskt korrekt;
återstår är att en redaktör faktiskt använder funktionen på riktiga rutiner och avgör om
träffkvaliteten håller måttet, eller om tröskeln/reglaget behöver justeras eller delmålet
läggas ner.

### 37d – Arkiverad status ✅ KLAR (2026-08-01)

- "Gäller inte längre" som ett eget tillstånd, skilt från papperskorgen: rutinen finns kvar och
  är sökbar för den som letar historik, men är tydligt märkt och utlöser inget kvitteringskrav.
- **Premisskontroll:** verifiera vad papperskorgen (fas 6) och den mjuka raderingen faktiskt
  gör i dag – det kan vara ett utökat fält snarare än en ny mekanism.
- **Kontrollera samtidigt hur arkiverade rutiner ska behandlas i offline-centret, sökindexet
  och akutläget** (tillagt vid antagandet). Ett nytt tillstånd som bara implementeras i
  listvyn men inte i de tre cachande/filtrerande ytorna är precis den sortens halva
  införande som orsakade 31b-buggen.

**Premisskontroll (krav 8) bekräftade att detta ÄR ett utökat fält, inte en ny mekanism:**
papperskorgen (`borttagen`) filtreras redan bort klientsidan i flera hookar (`useRutiner.js`,
`useAkutlageRutiner.js`), ett mönster den nya `arkiverad`-flaggan kunde återanvända rakt av.
`firestore.rules`s `farUppdateraRutin()` tillåter redan att en redaktör för området ändrar
godtyckliga fält (bara `status`/`akutlage`/`senasteVasentligaAndring` är extra spärrade till
VÖL/superadmin) – **ingen regeländring behövdes** för att låta en redaktör toggla arkiverad.

**Designval:** samma synlighetsmönster som redan finns för `arUtgangen()` (utgångna rutiner) –
dold i listan för vanlig personal, men fullt synlig (med en "Arkiverad"-badge) för redaktörer,
som kan återaktivera med samma knapp. Sökindexet (`useSokindex.js`) filtrerar varken på
utgången eller arkiverad sedan tidigare, så arkiverat innehåll förblir sökbart för ALLA utan
extra kod – bara märkt med "(arkiverad)" i kategorin.

**Genomfört, i alla tre ytor krav 8-kontrollen pekade ut (plus fyra till som hittades under
byggandet):**
- `arArkiverad()` i `utils/rutinHjalp.js` + `arkiveraRutin()`-togglefunktion i `useRutiner.js`.
- `RutinKort.jsx`: "Arkiverad"-badge, kvitteringsblocket ersätts med en informationstext,
  "Arkivera"/"Återaktivera"-knapp för redaktörer.
- `Sektionssida.jsx`: dold för icke-redaktörer (`synligaRutiner`), synlig för redaktörer.
- **Akutläget** (`useAkutlageRutiner.js`): explicit uteslutning, ÄVEN om `akutlage: true`
  fortfarande står kvar på en arkiverad rutin – patientsäkerhet går före datakonsistens.
- **Sökindexet** (`useSokindex.js`): ingen filtrering (medvetet), bara märkt "(arkiverad)".
- **Offline-centret** (`useOfflineCenter.js`): uteslutet ur nedladdningsräkningen och
  bildnedladdningen (klientsidig filtrering, inte i frågan – ett `where("arkiverad","==",
  false)` hade tyst uteslutit alla äldre rutiner som saknar fältet helt).
- Innehållshälsan (37a), granskningsrundor (37b) och dubblettdetektionen (37c): alla tre
  utesluter nu arkiverade rutiner konsekvent, plus `Ledningsrapport.jsx`s kvitteringsgrad/
  "bör granskas"-listor/källvarningar och `MinaUppgifter.jsx`/`useNotiser.js`s
  granskningspåminnelser.

Verifierat i en riktig webbläsare mot emulatorerna, sex separata kontroller: (1) personal ser
INTE en arkiverad rutin i listan, (2) den syns INTE i akutläget trots `akutlage: true`,
(3) superadmin ser den med badge, ingen kvitteringsknapp, en Återaktivera-knapp, (4) att
arkivera en aktiv rutin ger badgen direkt, (5) att återaktivera tar bort badgen igen,
(6) sökning hittar den arkiverade rutinen märkt "(arkiverad)" även för en icke-redaktör.
Fullt testsvep grönt (lint, build, vitest 104/104, test:rules, test:functions, test:storage).
Version 5.59.0 → **5.60.0**.

**Etapp 37 (innehållets hälsa) är därmed helt avslutad** utom 37c:s pilotutvärdering
(väntar på en redaktörs bedömning, se den etappens egen status).

**Klart när:** en superadmin kan svara på "hur aktuell är vår kunskapsbank?" med en siffra hon
litar på, och en granskningsrunda kan startas och följas upp utan ett kalkylark vid sidan om.

---

# Etapp 38 – Redaktörens vardag ✅ KLAR (2026-08-01)

**Varför:** Hela produkten vilar på ett fåtal personer. Etapp 26 (ändringsförslag) har dessutom
öppnat en ny inkorg till dem utan att ge dem verktyg att beta av den.

**Modul:** Core.

**✅ Beslutat 2026-08-01 (se beslutspunkt 1 nedan):** granskningskön ägs **per område** –
VÖL/sektionsledare för Kliniskt stöd, VEC för Administration, samma uppdelning som redan
gäller redigeringsrätten. **38a måste därför stödja flera samtidiga granskare** (en kö per
område räcker inte, eftersom flera personer kan dela redigeringsrätt för samma område).
Utlovad svarstid på ett ändringsförslag: **inom en vecka.**

- **38a – Granskningskö med samlade åtgärder, per område.** ✅ **Premisskontroll (krav 8)
  visade att det mesta redan fanns:** utkast hade redan "Godkänn alla"/"Neka alla" i
  `Sektionssida.jsx`, ändringsförslag hade redan en egen granskningskö
  (`ForslagSektion.jsx`), och flera samtidiga granskare stöds redan GRATIS av Firestores
  realtidslyssnare (`onSnapshot`) – ingen låsning eller extra kod behövdes. Det som
  FAKTISKT saknades var enkel upptäckbarhet: en redaktör såg bara sin kö genom att faktiskt
  navigera till sin egen sektion. Åtgärdat genom att lägga till ändringsförslags-antal i
  `MinaUppgifter.jsx`, bredvid de redan existerande utkast-antalen – en redaktör ser nu HELA
  sin kö (utkast + förslag) på startsidan utan att klicka sig in någonstans.
- **38b – "Vad hände med min ändring?"** ✅ **Den genuina luckan i hela etappen** – innan
  detta fanns INGEN plats i appen där en medarbetare kunde se status på ett förslag hon
  lämnat, bara redaktörens granskningskö visste. Ny komponent `MinaForslag.jsx` på startsidan
  (synlig bara om man faktiskt har lämnat förslag) visar status (väntar/godkänd/avvisad,
  återanvänder det befintliga statusbadge-systemet) och avvisningsmotivering. Ny schemalagd
  Cloud Function `kontrolleraForslagPaminnelser` (körs dagligen) skickar en engångspåminnelse
  till den ägande rollen för området om ett förslag stått obesvarat längre än den beslutade
  svarstiden (en vecka) – ny opt-in push-typ `forslagPaminnelse` (förvalt avstängd, krav 10).
- **38c – Granska utan att tappa sammanhanget.** ✅ **Premisskontrollen (redan gjord vid
  antagandet) stämde exakt:** diffen fanns redan i `VersionsHistorik.jsx`, bara inte
  återanvändbar. Extraherad till delade `utils/diff.js` + `DiffVy.jsx` (ren refaktorering,
  `VersionsHistorik.jsx` fungerar identiskt efteråt). En redaktör kan nu klicka "Visa ändring
  i sitt sammanhang" direkt i `ForslagSektion.jsx` och se EXAKT vad ett förslag skulle ändra
  – innan hon ens öppnar redigeringsformuläret – i stället för att behöva läsa igenom hela
  rutinen mentalt för att hitta skillnaden.
- **38d – Byggblock i redigeraren.** ✅ Tre knappar i `RutinFormular.jsx`s befintliga
  verktygsfält (samma mönster som fet text/rubrik/lista): Varning, Kontakt, Material – infogar
  en färdig markdown-mall vid markörens position.

**Genomfört och verifierat i en riktig webbläsare mot emulatorerna, hela kedjan end-to-end:**
en personal-roll skickade ett förslag → status "Väntar på godkännande" syntes omedelbart i
`MinaForslag.jsx` → VÖL-rollen såg räknaren i `MinaUppgifter.jsx` ("1 ändringsförslag väntar")
→ diffvyn visade exakt den tillagda raden → efter att VÖL infört förslaget visade
`MinaForslag.jsx` status "✓ Godkänd" med hanteringsdatum. Byggblocken verifierade att infoga
rätt markdown vid rätt position. Fullt testsvep grönt (lint, build, vitest 108/108, test:rules,
test:functions inkl. 6 nya tester för påminnelsefunktionen, test:storage). Version 5.60.0 →
**5.61.0**.

**Klart när:** en VÖL kan beta av granskningskön på en kafferast i stället för att skjuta upp
den till nästa vecka. **Uppnått** – hela kön (utkast + förslag) syns nu samlat, med diff och
byggblock som gör själva granskningen/redigeringen snabbare.

---

# Etapp 39 – Bevisad effekt ✅ KLAR (2026-08-02, alla fyra delmål)

**Varför:** Underlag som inte går att skapa i efterhand. Varje vecka som passerar utan
snapshot är en vecka historik som aldrig kommer tillbaka.

**Modul:** Core (mätning) / Operations (rapport).

- **39a – Effekt över tid.** Veckovis ögonblicksbild av nyckeltalen (kvitteringsgrad per
  område, tid-att-hitta, andel nollträffar, checklistkörningar, innehållshälsa från 37a),
  visad som trend i ledningsrapporten. Återanvänder det schemalagda jobbmönstret som redan
  finns (veckobackup, källbevakning, nattlig hashkedjekontroll).
  **Bygg insamlingen först och separat från visningen** (förtydligande vid antagandet):
  snapshot-jobbet är ~en dags arbete och kan skrivas innan 37a finns – då sparas
  innehållshälsofältet helt enkelt som `null` tills 37a levererar det. Visningen kan komma
  månader senare utan att någon historik gått förlorad.
- **39b – Före och efter.** Markera ett datum som "införande" eller "granskningsrunda
  genomförd" och se förändringen omkring det.
- **39c – Anonym personalpuls.** Tre frågor per kvartal, aggregerat, inget individsvar sparat.
  **Detta är produktens enda källa till *upplevd* nytta** – allt annat mäter beteende. Håll den
  under 30 sekunder, annars besvaras den inte mitt i ett pass.
  **Minsta-n-spärr gäller (krav 14, konkretiserat):** med en målgrupp på fem till tio
  nyckelpersoner är "aggregerat" inte automatiskt anonymt – tre svar av fem kan peka ut en
  person lika säkert som ett namn. Inga resultat visas alls under fem svarande, och det ska
  stå i vyn för de tillfrågade **innan** de svarar, inte bara i en integritetstext.
  **Ägarbeslut 2026-08-02:** resultatet läses per område av samma roll som redan äger
  granskningskön där (VÖL/sektionsledare Kliniskt stöd, VEC Administration) – inte
  superadmin ensam. Spärren på fem svar gäller PER OMRÅDE.
- **39d – Referensunderlag.** Anonymiserad sammanställning som kan bifogas `saljmaterial/PITCH.md` eller ett
  anbud. **Kräver kundens uttryckliga medgivande** som ett aktivt val i exporten, inte som en
  förutsättning. Medgivandet ska dessutom **loggas i revisionsloggen** (Etapp 14-mekaniken
  finns) – ett muntligt "ja, det går bra" räcker inte om frågan kommer upp två år senare.

**Klart när:** det går att visa en trovärdig nyttosiffra för en ny kund utan att be den
befintliga kunden gräva fram något.

### 39a/39b – Effekt över tid + Före och efter ✅ KLARA (2026-08-02)

**Genomfört (39a):** `organisationer/{orgId}/matvardenSnapshots/{datum}` – Cloud-Function-only
(samma mönster som `kostnadshistorik`), skriven av en ny schemalagd funktion
`matvardenSnapshotSchemalagt` (måndagar 02:00, `functions/index.js`). Snapshoten innehåller
kvitteringsgrad per område, andel nollträffar, tid-att-hitta, antal checklistkörningar och
innehållshälsa (från 37a) – de två sistnämnda beräknas server-side med `beraknaHalsaServer`/
`kvitteringsgradServer`, avsiktligt duplicerade (inte importerade) från klientens
`sammanstallHalsa`/kvitteringsgradlogik eftersom `functions/index.js` är CommonJS och
`src/utils` är ESM. En organisation utan data kraschar inte hela jobbet för övriga
organisationer (varje org hanteras i sitt eget try/catch). 8 nya tester i
`tests/functions/matvardensnapshot.test.cjs` (helperfunktionerna + en fullständig
integrationskörning + en tom organisation). Visas som en 12-veckorstabell i
`Ledningsrapport.jsx` via `useMatvardenTrend.js`.

**Genomfört (39b):** `organisationer/{orgId}/matvardenMarkeringar/{id}` – till skillnad från
snapshoten är detta en ren anteckning utan beräkning, så den är klientskrivbar direkt av
superadmin (skapande kräver `skapadAv == request.auth.uid` samt PII-kontroll på etiketten,
samma `harTroligtPersonnummer`-mönster som redan finns för andra fritextfält). Ingen Cloud
Function behövdes. UI (skapa/radera markering) i samma sektion som 39a,
`src/components/admin/MatvardenTrendSektion.jsx` / `useMatvardenMarkeringar.js`.

**Premisskontroll (krav 8):** planens formulering "kan komma månader senare utan att någon
historik gått förlorad" stämde – insamlingen (39a) byggdes och testades helt fristående från
visningen, som ETAPPLAN6.md redan föreskrev. Inga andra avvikelser mot planen hittades; till
skillnad från 37a fanns inga felaktiga antaganden att skala bort.

Både 39a och 39b begränsas till superadmin i firestore.rules (`arSuperadmin()`), trots att
`/ledningsrapport`-routen själv tillåter alla redaktörsroller (`REDAKTORSROLLER`) – sektionen
returnerar `null` och laddar ingen data om `role !== ROLES.SUPERADMIN` (samma gating-mönster
som `arSuperadmin && <KostnadsuppfoljningSektion .../>` i `Admin.jsx`). Verifierat i en riktig
webbläsare mot Firestore-/Auth-emulatorerna (Playwright): trendtabell med tre veckors seedad
data renderades korrekt, en markering skapades och syntes omedelbart, och togs bort igen utan
kvarvarande data. Full testsvep grönt (lint, build, 108 vitest-tester, test:rules inkl. 9 nya
regeltester för de två nya collections, test:functions inkl. de 8 nya, test:storage). Version
5.61.0 → **5.62.0**.

### 39c/39d – Personalpuls + Referensunderlag ✅ KLARA (2026-08-02) → hela Etapp 39 klar

**Ägarbeslut 2026-08-02:** 39c byggs, resultatet läses PER OMRÅDE av VÖL/sektionsledare
(kliniskt-stod) och VEC (administration) – inte superadmin ensam. 39d byggs, men
ANONYMISERAT (kundens namn får aldrig förekomma i exporten).

**Genomfört (39c):** tre skalfrågor (1–5) plus vilket område man tillhör, under 30 sekunder.
`svaraPersonalpuls` (Cloud Function, `functions/index.js`) skriver ALDRIG ett enskilt svar –
bara en atomär `FieldValue.increment` i en aggregatpost
`organisationer/{orgId}/personalpulsResultat/{omrade}_{kvartal}`, i samma transaktion som en
enda flagga på svarandens EGET användardokument (`personalpulsSenastBesvarad`, bara VILKET
kvartal, aldrig VAD personen svarade) som spärrar dubbelinskick. `Personalpuls.jsx` på
startsidan (alla roller), `PersonalpulsResultatSektion.jsx` i adminpanelen (superadmin ser
alla områden, VÖL/VEC ser sitt eget – `firestore.rules` kräver `farRedigeraOmrade
(resource.data.omrade)`, samma per-dokument-villkor som gör att frågan MÅSTE ha ett matchande
`where("omrade","==",...)` för icke-superadmin, annars nekas hela listningen: samma "list-
provability"-mönster som redan dokumenterats i `src/firebase/roles.js` för rutiner/förråds-
artiklar). Minsta-n-spärren (krav 14, fem svar) gäller PER OMRÅDE och kontrolleras
klient-sidan i visningskomponenten – ett kvartal med färre än fem svar visas som "visas inte",
aldrig som en siffra.

**Genomfört (39d):** `exporteraReferensunderlag` (superadmin, kräver `samtycke: true` i VARJE
enskilt anrop – sparas aldrig som en förutsättning) returnerar ett objekt med bara siffror
(antal anställda, kvitteringsgrad, nollträffar, tid-att-hitta, innehållshälsa från senaste
`matvardenSnapshots`-posten) och medvetet ALDRIG kundens namn/orgnr/organisationId – anonymi-
seringen sitter i vilka fält som SAKNAS i svaret, inte i en efterbehandling av text. Loggas i
revisionsloggen (`referensunderlag_exporterat`). UI i `ReferensunderlagSektion.jsx`
(Ledningsrapport, superadmin) med en kryssruta för medgivandet och en "Kopiera som text"-knapp.

**Premisskontroll (krav 8):** inga avvikelser mot planen. 39c:s tre frågor och 39d:s fältlista
formulerades vid byggstarten (planen specificerade inte exakt frågetext/fältlista) – ingen
konflikt med något befintligt antagande.

15 nya tester (6 rules för `personalpulsResultat`, 6 funktionstester för `svaraPersonalpuls`, 3
för `exporteraReferensunderlag`), alla gröna. Fullt testsvep grönt (lint, build, 108
vitest-tester, test:rules, test:functions, test:storage).

**Browserverifiering – delvis, med en dokumenterad begränsning:** UI:t verifierades i en
riktig webbläsare mot Firestore-/Auth-emulatorerna (formuläret renderas, "Skicka"-knappen är
inaktiverad tills alla tre frågor är besvarade, resultatvyns minsta-n-spärr visar rätt
platshållartext, samtyckeskryssrutan styr "Generera"-knappen korrekt). Det faktiska
skicka-och-aggregera-anropet gick INTE att verifiera end-to-end i den här sessionen: ett
riktigt HTTP-anrop mot Cloud Functions-emulatorn hänger utan svar i den här sandboxade
miljön – bekräftat att detta INTE är en regression genom att samma sak händer för en redan
levererad, sedan tidigare fungerande funktion (`skickaFeedback`) anropad på samma sätt.
Sannolik orsak: emulatorns metadata-serveruppslag blockeras av miljöns nätverksproxy
("MetadataLookupWarning ... 502", syns i emulatorloggen redan vid uppstart). Korrektheten i
själva anropslogiken täcks istället av de 9 nya emulatortesterna ovan, som anropar funktionerna
direkt (`funcs.svaraPersonalpuls.run({data, auth})`) och därmed kringgår HTTP-lagret helt.

**Version 5.62.0 → 5.63.0.** Hela Etapp 39 är nu klar.

---

# Etapp 40 – Innehåll in, utan handpåläggning

**Varför:** Bulkimport (Etapp 10b) tar bilder och dokument. En verksamhet som byter från en
befintlig dokumentsamling har Word-filer, PDF:er och en mappstruktur som betyder något.

**Modul:** intelligence (AI-tolkningen) / Core (strukturen).

**⚠️ Villkorad byggstart (tillagt vid antagandet).** Den här etappen bygger uteslutande för
en NY kunds inflyttning – ingen befintlig kund har nytta av den. Samtidigt ligger
onboarding-alternativen ("Kund nummer tre") medvetet bortvalda i `produkt/FRAMTIDSPLAN.md`. Det är
en spänning som ska lösas medvetet, inte glidas förbi:

- **Bygg 40 när en ny kund är konkret nog att ha visat sin faktiska dokumentsamling** – inte
  tidigare. Utan riktiga källfiler att testa mot är en importtolk gissningar i kod.
- Om ingen ny kund är aktuell när Etapp 39 är klar: **hoppa över 40 och gå till 41**, och
  ompröva 40 tillsammans med "Kund nummer tre" som en samlad onboarding-satsning i stället
  för som en isolerad importfunktion.

- **40a** Mappstruktur → områdesförslag vid import, i stället för att allt hamnar i en hög.
- **40b** Word/PDF med rubriknivåer tolkas till rutinstruktur, inte till en textklump.
  **Insatsen är sannolikt underskattad** (justerat vid antagandet från "Medel" till
  **Medel–Hög**): strukturextraktion ur godtyckliga kunddokument är en helt annan sak än
  bildtolkningen som redan finns, och svårighetsgraden bestäms av hur inkonsekventa
  källdokumenten är – vilket inte går att veta i förväg. **Gör en tidsboxad spik (max en dag)
  mot tio verkliga kunddokument innan omfattningen sätts.** Faller den ut dåligt är ett
  fullgott utfall att 40b krymper till "importera som textklump, men flagga tydligt att
  strukturen behöver sättas manuellt".
- **40c** Importrapport: vad kom in, vad hoppades över och varför, vad kräver granskning.
- **Gäller oförändrat:** allt importerat är utkast (`kalla: "gemini"` där AI varit inblandad),
  aldrig autopublicerat, alltid PII-kontrollerat i tre lager.

**Klart när:** en ny kund kan flytta in sin befintliga dokumentsamling på en förmiddag i
stället för en vecka.

---

# Etapp 41 – Innehåll som märks i vardagen ✅ KLAR (2026-08-02, alla tre delmål)

**Varför:** Liten, fristående förädling som gör innehållsarbetet i 37–38 synligt för dem det
är till för. Kan lyftas fram när som helst om en pilot behöver ett snabbt synligt tillskott.

**Modul:** Core.

- **41a – "Ni sa, vi gjorde".** En kort publik lista över genomförda förbättringar som kom från
  personalens feedback och ändringsförslag, bredvid ändringsloggen på `/nyheter`. Mycket låg
  insats, oproportionerligt stor effekt på viljan att fortsätta lämna förslag.
  **Namnge aldrig förslagsställaren utan att ha frågat** – för vissa är det en uppmuntran, för
  andra ett obehag att synas i en publik lista. Förvalt av: initialer eller ingenting.
- **41b – Veckans repetition.** En fråga ur kvissbanken (19b) om en rutin du kvitterade för
  länge sedan. Frivilligt, 30 sekunder, **inget felsvar registreras någonstans** (krav 14).
- **41c – Förrådet visuellt.** Foto på hyllplatsen på artikelkortet; bilduppladdning finns
  redan. "Hitta på fem sekunder" blir bokstavligt för en vikarie.

**Klart när:** en medarbetare ser att det hon påpekade faktiskt ledde någonstans.

**Premisskontroll (krav 8) vid byggstart hittade en verklig, redan tagen produktbeslut som
41a:s formulering inte kände till:** "Namnge aldrig förslagsställaren utan att ha frågat" är
redan löst – Etapp 26c (`skapaForslag()`, `visaNamnOffentligt`-fältet) frågar redan
förslagsställaren VID INLÄMNINGEN, och fältet visas redan idag i `RutinKort.jsx`s signatur.
41a återanvänder exakt samma fält/princip istället för att uppfinna en ny standardinställning
– det fanns inget att lösa på nytt.

**Genomfört (41a):** `useNiSaViGjorde()` (`src/hooks/useAndringsforslag.js`) läser
`andringsforslag` där `status=="infort"`, en ny sektion `NiSaViGjorde.jsx` på `/nyheter`,
synlig för ALLA roller (inte bara redaktörer). Krävde en regeländring i `firestore.rules` –
ett infört förslag är inte längre känsligt utkastmaterial och görs läsbart för hela
organisationen (frågan filtrerar på `status=="infort"`, annars hade Firestore inte kunnat
bevisa villkoret och nekat hela listningen för icke-redaktörer, samma "list-provability"-
mönster som redan gäller `useAndringsforslag(omrade)`). Ny sammansatt index i
`firestore.indexes.json`. 3 nya regeltester.

**Genomfört (41b):** ren klientfunktion `src/utils/veckansRepetition.js` väljer en godkänd,
icke-arkiverad rutin med minst en kvissfråga som användaren själv kvitterat för mer än 90
dagar sedan, stabilt för hela kalenderveckan (inte slumpmässigt varje sidladdning). Ny
komponent `VeckansRepetition.jsx` på Hem – visar sig inte alls om inget kvalificerar.
**Inget svar, rätt eller fel, skrivs någonsin till Firestore** (krav 14) – exakt samma princip
som redan gäller `KvissModal.jsx`. "Redan besvarad denna vecka" är en lokal `localStorage`-
flagga per uid, inte synkad mellan enheter (medvetet, för en frivillig lågprioriterad
funktion). 10 nya vitest-tester.

**Genomfört (41c):** nytt fält `hyllfotoUrl` på `forradsartiklar` (skilt från `bildUrl`, som
visar artikeln själv, inte platsen). Ny uppladdningsfunktion
`laddaUppForradHyllfoto()` (`src/firebase/storage.js`) delar Storage-sökväg och behörighet
med den redan existerande `laddaUppForradsbild()` (ingen ändring av `storage.rules` behövdes –
samma mapp, bara ett annat filnamnsprefix). Nytt fält i `ForradArtikelFormular.jsx`, visas i
`ForradArtikelKort.jsx`.

**Browserverifiering – 41a och 41b helt verifierade end-to-end i en riktig webbläsare mot
emulatorerna** (41a: sektionen syns för en vanlig `personal`-roll utan redaktörsbehörighet med
korrekt innehåll; 41b: frågan visas, ett fel svar ger rätt facit, kortet försvinner efter
omladdning samma vecka). **41c kunde INTE verifieras end-to-end i den här sessionen** – av
samma dokumenterade skäl som Cloud Functions-anropen i Etapp 39c/39d (se den sektionens
"Browserverifiering"-stycke): en riktig filuppladdning via Storage-klient-SDK:t hänger utan
fel i den här sandboxade miljön. Bekräftat att det INTE är en regression av 41c specifikt –
den REDAN BEFINTLIGA `bildUrl`-uppladdningen (`laddaUppForradsbild`, oförändrad av den här
etappen) uppvisar exakt samma symptom i samma testkörning. Regellogiken är istället verifierad
direkt mot Storage-regelmotorn via `test:storage` (21/21 gröna, inklusive samma sökvägsmönster
`forradsartiklar/{forradSlug}/{artikelId}/{filnamn}`).

Fullt testsvep grönt (lint, build, 118 vitest-tester, test:rules, test:functions,
test:storage). Version 5.63.0 → 5.64.0.

---

## Sådant den här planen medvetet INTE gör

| Idé | Varför inte |
|---|---|
| AI som skriver om eller slår ihop rutiner automatiskt | Krav 15 och MDR-gränsdragningen. Flagga ja, besluta nej. |
| "Fråga Synappsen" – fritextsvar mot egen kunskapsbank | Intressant, men `etapplaner/ETAPPLAN4.md` avvisade uttryckligen fler AI-ytor mot personalen tills den befintliga är stabil. Ompröva efter Etapp 39, när det finns data på om klinikstödet faktiskt används. |
| Poäng, märken eller topplistor kopplade till granskningsrundor | Samma skäl som redan avvisats två gånger i tidigare planer. |
| Individuell läs-/kvitteringsstatistik i chefsvyer | Krav 14. Aggregerat eller inget – och aggregerat först över fem personer. |
| SSO, kiosk, veckopuls, flera enheter, demo/sandlåda, supportåtkomst, kostnad per kund | Ligger som ej antagna alternativ i `produkt/FRAMTIDSPLAN.md`. Att blanda in delar av dem här är att göra ingendera ordentligt – välj om, hellre än att smyga in. |

---

## Beslutspunkter som kräver ägaren

1. ✅ **Etapp 38 (moderering) – beslutat 2026-08-01:** granskningskön ägs per område
   (VÖL/sektionsledare för Kliniskt stöd, VEC för Administration – samma uppdelning som
   redigeringsrätten). Utlovad svarstid på ett ändringsförslag: **inom en vecka.** Löser
   `etapplaner/ETAPPLAN4.md`s tidigare obesvarade beslutspunkt 3. Konsekvens för byggarbetet: 38a måste
   stödja flera samtidiga granskare (en per område, inte en gemensam kö), och 38b:s
   påminnelsemekanism ska utlösas efter en vecka utan svar.
2. ✅ **Etapp 39c (personalpuls) – beslutat 2026-08-02:** ja, bygg den. Resultatet bryts ner
   per område och läses av samma roll som redan äger granskningskön där (VÖL/sektionsledare
   för Kliniskt stöd, VEC för Administration – samma uppdelning som beslutspunkt 1). Inte
   superadmin ensam. Minsta-n-spärren (krav 14, fem svar) gäller per område, inte bara
   organisationen som helhet – i ett litet område kan det innebära att resultatet aldrig
   visas, vilket är avsiktligt och inte en bugg.
3. ✅ **Etapp 39d (referensunderlag) – beslutat 2026-08-02:** ja, men anonymiserat – kundens
   namn får INTE förekomma i exporten. Medgivandet ska ändå aktivt bekräftas (kryssruta i
   exportflödet, inte en förutsättning) och loggas i revisionsloggen.
4. **Etapp 37b (granskningsrundor):** vem har mandat att sätta en deadline på en kollegas
   granskning? Det är en verksamhetsfråga, inte en teknisk.
5. **Etapp 40 (villkorad):** finns en ny kund konkret nog att bygga importstöd mot, eller ska
   40 skjutas och omprövas ihop med "Kund nummer tre"? Se den villkorade byggstarten i Etapp
   40 ovan.

---

## Sammanfattning

| Etapp | Innehåll | Insats | Vad det ger |
|---|---|---|---|
| 37 | Innehållets hälsa | Medel | Kunskapsbanken ruttnar inte i tysthet |
| 38 | Redaktörens vardag | Låg–medel | Bär hela 37 – och räddar Etapp 26 |
| 39 | Bevisad effekt | Medel | Underlag för förlängning och nästa kund |
| 40 | Innehåll in utan handpåläggning | Medel–Hög (villkorad) | Kortare väg från avtal till drift |
| 41 | Innehåll som märks | Låg | Personalen ser att deras röst leder någonstans |

**Om bara en sak hinns med:** 39a:s insamlingsdel (inte visningen). Den är billig, kan byggas
utan att 37a finns, och varje vecka den skjuts upp är en vecka historik som aldrig går att
skapa i efterhand.

**Om bara en etapp hinns med:** 37. Allt annat i planen förutsätter att någon vet vilket
innehåll som faktiskt behöver arbete.

---

## Vad som kommer efter

Den här planen är avgränsad till innehållets kvalitet och bevisad nytta. Alternativen ligger
i `produkt/FRAMTIDSPLAN.md`s arkiv över ej antagna planer:

- **"Från byggd produkt till såld produkt"** (`etapplaner/ETAPPLAN5-ALT-A.md`) – SSO/Entra ID (13f),
  veckopuls (Etapp 16), kioskläge, onboarding utan konsult. **Bör lyftas fram omedelbart om en
  regionkund blir aktuell** – SSO blockerar den affären oavsett hur bra resten är.
- **"Förtjäna förtroendet"** (`etapplaner/ETAPPLAN5-ALT-B.md`) – rollmatris som testsvit, tomläge kontra
  felläge, WCAG AA utan förbehåll, akutläget under verkliga förhållanden.
- **"Kund nummer tre"** – flera enheter i samma organisation, demo/sandlåda, supportbarhet utan
  innehållsåtkomst, kostnad och kapacitet per kund. **Finns bara som sammanfattning i
  `produkt/FRAMTIDSPLAN.md`, inte som en egen planfil** – måste skrivas ut innan den kan antas.

**Överlappning värd att notera:** Etapp 39 (bevisad effekt) producerar precis det underlag som
"Från byggd produkt till såld produkt" behöver för att kunna säljas på annat än funktionslistor.
De två hänger ihop i den ordningen – mätning först, säljargument sedan.

**Andra överlappningen:** Etapp 40 och "Kund nummer tre" löser samma problem (en ny kunds väg
in) från två håll. Bygg inte 40 isolerat om det andra alternativet är på väg att antas – se
beslutspunkt 5.
