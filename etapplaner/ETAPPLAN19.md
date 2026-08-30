# Etapplan 19 – Från rutindatabas till ledningssystem

**Etapp 72. UTKAST 2026-08-30 – EJ ANTAGEN.** Skriven på ägarens begäran efter en genomgång
av produktens nuvarande form mot de behov en svensk vårdgivare faktiskt har. Bygger på faktisk
kodstatus i v5.137.0 (30 rutter, 74 hooks, 40 admin-/leverantörssektioner, 11 schemalagda
jobb).

> **Antagandet av den här planen är inte en formalitet.** Den föreslår att produkten växer
> ut ur sin nuvarande kategori. Det är ett affärsbeslut lika mycket som ett byggbeslut, och
> beslutspunkt 1 (avvikelsehantering och patientuppgifter) kan behöva samma externa juridiska
> bedömning som `etapplaner/ETAPPLAN13.md` Etapp 64 väntar på. **Bygg ingenting härifrån
> förrän planen är antagen delmål för delmål.**

> **Vad den här planen är:** ett förslag på hur Synappsen går från att svara på *"var finns
> rutinen och har den lästs?"* till att bära de återkommande, daterade och signerade
> skyldigheter en vårdgivare ändå måste fullgöra – och som idag ligger i Excel och pärmar hos
> exakt den målgrupp kandidatlistan pekar ut.
>
> **Vad den inte är:** ett journalsystem, ett schemasystem, en e-learningplattform eller ett
> fullskaligt ärendehanteringssystem. Se "Vad jag INTE föreslår".

---

## Premisskontroll (genomgående krav 8)

Tolv antaganden kontrollerade mot faktisk kod innan planen skrevs. Åtta höll, fyra ändrade
innehållet.

### Höll

| # | Antagande | Verifierat mot |
|---|---|---|
| 1 | Det finns ingen avvikelsehantering i produkten | `grep` över `src/` och `functions/` – ordet förekommer bara som rutinMALL |
| 2 | Det finns inget delegeringsstöd | Ordet finns bara i `functions/kvissfragorSeed.js` och `src/utils/kvissbank.js`, alltså som kvissfråga |
| 3 | Patientsäkerhetsberättelse är aldrig nämnt som produktförmåga | Förekommer bara i `saljmaterial/` – som något ni läser HOS kandidater |
| 4 | Schemaläggningsinfrastruktur finns och är mogen | 11 `onSchedule`-jobb i `functions/` (dagliga, veckovisa, timvisa) |
| 5 | PII-spärr finns i tre lager | `firestore.rules` (`harTroligtPersonnummer`), `functions/gemensamt.js` (`innehallerPersonnummer`, Luhn), `src/utils/piiFilter.js` |
| 6 | Revisionsloggen är en hashkedja med manipuleringsdetektering | `functions/gemensamt.js` `raknaHash`/`verifieraRevisionskedja` |
| 7 | Talsyntes finns redan | `src/hooks/useTalsyntes.js` |
| 8 | QR/skanning finns | `src/components/SkannaModal.jsx`, QR-koder per rutin |

### Ändrade planen

| # | Antagande | Verkligheten | Följd |
|---|---|---|---|
| 9 | *"Bristanmälan kan generaliseras till avvikelsehantering"* | `useBristanmalningar.js` är hårt knuten till förrådsartiklar (dubblettdetektering på artikel-id, `hanteraBristanmalning`/`avvisaBristanmalning`). Den är ett **mönster** att härma, inte en grund att bygga vidare på | 72e blir en egen collection, inte en utökning. Minskar risken att en förrådsbrist och en vårdavvikelse hamnar i samma flöde med samma behörigheter |
| 10 | *"Checklistkörningar loggas redan"* | `checklistkorningar/{rutinId}` innehåller bara `antalPaborjade` – en räknare, ingen signerad post med tidpunkt, utförare eller värde | 72a kan inte återanvända den. Ny collection krävs, och räknaren ska INTE byggas om (den föder `matvardenSnapshots`) |
| 11 | *"Kompetensmatrisen kan bära delegeringar"* | Kompetensmatrisen är härledd, inte lagrad: den räknar ut "har person X kvitterat de rutiner rollen kräver". Den har inget eget dokument per person, inget utgångsdatum och ingen utfärdare | 72c blir ett eget register. Kompetensmatrisen blir dess **villkor** ("delegering får utfärdas först när kraven är gröna"), inte dess datamodell |
| 12 | *"Förrådsartiklar kan bära utrustning med kontrollintervall"* | Artikeln har `namn, skap, hylla, antal, utgangsdatum` – plats och utgångsdatum finns, men inget serienummer, intervall, ansvarig eller servicehistorik | 72g blir ett eget objekt som ÅTERANVÄNDER platsmodellen (`skap`/`hylla`) men inte artikelsamlingen. Utrustning är inte förbrukningsmaterial |

---

## Analysen planen vilar på

Två observationer ur koden, som förklarar varför luckorna ser ut som de gör.

### 1. Produkten ber kunden beskriva processer som sker någon annanstans

`functions/verksamhetsmallar.js` ger en ny kund en rutinmall som heter *"Avvikelsehantering"*
och vars innehåll är:

> *"Beskriv er rutin för att rapportera och följa upp avvikelser. 1. Var en avvikelse anmäls
> 2. Vem utreder den…"*

Kunden skriver alltså i Synappsen **var någon annanstans** avvikelser hanteras. Samma mönster
för delegering: produkten *provar* personalen på delegeringsreglerna i öva-läget men *hanterar*
inga delegeringar. Och patientsäkerhetsberättelsen — en handling varje vårdgivare måste
producera årligen — förekommer bara i säljmaterialet, som något ni läser hos kandidater för
att kvalificera dem.

En vårdgivares skyldighet är bredare än en rutindatabas: att ha, tillämpa **och kunna bevisa**
ett fungerande kvalitetssystem. Synappsen har byggt ett ben av kanske sex, och byggt det
ovanligt väl. De andra fem ligger kvar i Excel hos exakt den målgrupp
`saljmaterial/KANDIDATLISTA-PRIVAT-VARD.md` pekar ut — verksamheter som är för små för
Centuri och Stratsys.

### 2. Frekvensproblemet

Rutindatabasen **konsulteras**. De skyldigheter som saknas **utförs** – dagligen, veckovis,
med signatur och datum.

`saljmaterial/KOPARANALYS.md` avsnitt 6 punkt 1 utpekar kallstarten som den främsta
dödsorsaken och svarar med mer innehåll. Den här planen föreslår ett annat svar: en app som
kräver en signatur varje pass har inget kallstartsproblem, eftersom värdet uppstår vid första
kontrollen i stället för vid den trettionde rutinen. Det är också svaret på invändningen
"ännu ett system som ingen använde" (avsnitt 6 punkt 4) – ett system man *måste* öppna för att
fullgöra en skyldighet konkurrerar inte om uppmärksamhet.

**Delmål 72a är därför planens tyngdpunkt, inte dess enklaste post.**

---

## Genomgående krav

Fortsätter numreringen från `intern/ETAPPLAN-INTERN-1.md` (krav 36–39).

**40. En genererad lagstadgad handling är ALLTID ett utkast, aldrig en färdig handling.**
Den ska vara märkt som utkast i själva dokumentet, kräva ett aktivt mänskligt godkännande med
namn och datum, och aldrig kunna exporteras omärkt. En felaktig patientsäkerhetsberättelse som
ser färdig ut är farligare än ingen alls – den flyttar ansvaret dit det inte hör hemma och
kan användas mot kunden i en tillsyn. Samma princip som genomgående krav 8 (bocka aldrig av
utan att ha verifierat) fast riktad mot kunden i stället för mot oss.

**41. Ingen ny collection tar emot fritext om en enskild patient förrän beslutspunkt 1 är
avgjord.** Produktens hela juridiska hållning – PUB-avtalet, DPIA-underlaget, den tekniska
beskrivningen, upphandlingssvaret – bygger på att patientuppgifter aldrig finns. En avvikelse
handlar till sin natur om en händelse som rör en patient. PII-spärren i tre lager fångar
personnummer, inte "den äldre damen på rum 4". Det här kravet är den enda anledningen till att
72e står som blockerat i stället för som planens första delmål.

**42. En återkommande kontroll måste gå att utföra och signera OFFLINE.** En kontroll som
kräver nät är otillgänglig exakt när den behövs mest – vid ett IT-avbrott. Kravet binder ihop
72a med 72f och gör offline-läget till en förutsättning snarare än en modulfunktion.
`useOfflineKo` finns redan och är rätt mekanism.

**43. En signerad post får aldrig ändras i efterhand, bara kompletteras.** Rättelser sker som
en ny post som pekar på den gamla, inte som en redigering. En loggbok som går att skriva om i
efterhand har noll bevisvärde, och bevisvärdet är hela poängen med att flytta den från papper.
Samma princip som revisionsloggens hashkedja redan bygger på – och `firestore.rules` har redan
mönstret (`allow update: if false`).

---

## Delmål

Grupperade efter vad som driver dem. Bokstavsordningen inom en grupp är inte en byggordning –
se "Beroendeordning".

---

### Grupp A – Lagstadgade skyldigheter som idag sker på papper

---

### 72a. Återkommande kontroller med loggbok

**Behovet.** Varje vårdenhet har återkommande kontroller som ska utföras, signeras och kunna
visas upp: kylskåps- och frystemperatur, akutväskans innehåll och utgångsdatum,
narkotikaräkning, egenkontroll av medicinteknisk utrustning, hygienronder. De görs idag på
papper eller i ett Excel-ark som ingen hittar när tillsynen frågar.

**Bygg:**

1. **Kontrolldefinition** – vad som ska kontrolleras, hur ofta (dagligen/veckovis/månadsvis/
   kvartalsvis), av vilken roll, med vilka fält (mätvärde med gräns, ja/nej, fritext,
   antal). Kopplad till en plats (`skap`/`hylla`, samma modell som förrådsartiklar) och
   valfritt till en rutin.
2. **Utförandevy** – "att göra idag", med de kontroller som förfallit eller förfaller.
   Signeras med namn och tidpunkt. **Måste fungera offline** (krav 42).
3. **Loggbok per kontroll** – kronologisk, oföränderlig (krav 43), exporterbar.
4. **Avvikelseeskalering** – ett värde utanför gräns eller en missad kontroll skapar en
   notis till ansvarig roll. Om 72e byggs: skapar ett avvikelseutkast i stället.
5. **Efterlevnadssiffra** – andel kontroller utförda i tid, per typ och period. Går in i
   72b och 72d.

**Bygger på:** de 11 schemalagda jobben, notismotorn, roller, `useOfflineKo`, platsmodellen i
förrådsartiklar, kvitteringens signaturmönster.

**Bygger INTE på:** `checklistkorningar` (se premissfynd 10) – den räknaren lämnas orörd.

**Varför det är planens tyngdpunkt.** Det är den enda funktionen i hela planen som ger en
anledning att öppna appen *varje pass*. Se "Frekvensproblemet" ovan.

---

### 72b. Patientsäkerhetsberättelsen som utkast ur befintlig data

**Behovet.** En årlig handling varje vårdgivare måste producera, med hård deadline. För en
liten verksamhet är den ett flera dagar långt skrivarbete som inleds med att leta rätt på
underlag som inte finns samlat.

**Iakttagelsen som gör detta billigt:** Synappsen äger redan merparten av underlaget.
`matvardenSnapshots` (veckovis, sedan Etapp 39a), granskningsrundor med utfall, kvitteringsgrad
per område, innehållshälsa, källvarningar, kompetensmatrisens täckning, introduktionssigneringar,
klinikstödets kunskapsluckor. `src/pages/Ledningsrapport.jsx` är redan en rapport över samma
data – men den är en *driftrapport*, inte en *lagstadgad handling*.

**Bygg:**

1. **Utkastgenerator** – ett dokument med de avsnitt handlingen brukar innehålla, där varje
   avsnitt är antingen (a) ifyllt ur data, (b) ifyllt ur föregående års text, eller (c) en
   tom ruta med en förklaring av vad som ska stå.
2. **Tydlig utkastmärkning och godkännandesteg** (krav 40).
3. **Årsjämförelse** – förra årets siffra bredvid årets, eftersom handlingen efterfrågar
   utveckling över tid och det är den delen som är svårast att skriva i efterhand.
4. **Arkiv** – varje års godkända version sparas oföränderligt (krav 43).

**Kritiskt:** avsnittsstrukturen måste verifieras mot gällande föreskrift innan bygget, inte
härledas ur hur andra vårdgivares publicerade berättelser ser ut. Se "Källor och
verifieringsbehov".

**Varför det är planens högsta värde per byggtimme.** Nästan ingen ny datafångst – det är en
rapport över data ni redan samlar. Och det byter argument från "ett verktyg som gör arbetet
möjligt" till "en handling ni ändå måste producera, färdig att granska". Det är exakt vägvalet
`saljmaterial/KOPARANALYS.md` avsnitt 12 efterlyser, utan att sälja konsulttid.

---

### 72c. Delegeringsregister

**Behovet.** Delegering av medicinska arbetsuppgifter är personlig, tidsbegränsad, knuten till
bevisad kompetens och återkallelsebar. Den ska kunna visas upp vid tillsyn. Idag: pärm.

**Bygg:**

1. **Delegeringsdokument** per person och uppgift: utfärdare, mottagare, uppgift, giltig
   från/till, villkor, återkallelse med datum och skäl.
2. **Villkorskoppling** – en delegering får utfärdas först när kompetensmatrisens krav för
   uppgiften är uppfyllda och kunskapsprovet i öva-läget är godkänt. Det gör de två befintliga
   funktionerna juridiskt meningsfulla i stället för informativa.
3. **Utgångslarm** – notis till utfärdare och mottagare i god tid, plus en lista över
   delegeringar som löper ut.
4. **Mottagarens vy** – "detta får jag göra, till och med detta datum".
5. **Register för tillsyn** – exporterbart (matar 72d).

**Bygger på:** kompetensmatrisen (som villkor, inte som lagring – se premissfynd 11),
öva-läget, introduktionssigneringarnas signaturmönster, notismotorn.

**Segmentnytta:** störst i ASIH, hemsjukvård och äldreomsorg – en betydande del av
kandidatlistan. Marginell för en renodlad specialistmottagning med enbart legitimerad personal.

---

### 72d. Tillsyns- och revisionspaket

**Behovet.** När IVO eller en certifieringsrevisor hör av sig ska ett antal handlingar fram
snabbt. Idag betyder det en veckas letande.

**Bygg:** ett exportpaket som i ett steg producerar rutinbestånd med ägare, giltighet och
granskningsdatum; kvitteringsläge per rutin och person; kompetens- och delegeringsläge (72c);
kontrollhistorik (72a); avvikelsestatistik (72e, om byggt); revisionsloggens verifierade
kedja; senaste patientsäkerhetsberättelsen (72b). Med innehållsförteckning och tidsstämpel.

**Bygger på:** befintlig CSV-export, revisionsloggexporten, `exporteraOrganisation`,
ledningsrapporten.

**Låg byggkostnad, hög säljeffekt.** Det adresserar direkt den rädsla som driver köpet, och
det är ett demoögonblick som inte kräver att kunden först lagt in innehåll.

---

### 72e. Avvikelsehantering — BLOCKERAD av beslutspunkt 1

**Behovet.** Den mest använda kvalitetsfunktionen i svensk vård, och den enda i den här planen
som kunden med säkerhet redan gör varje vecka – någon annanstans.

**Bygg (om beslutspunkt 1 tillåter):**

1. Anmälan i två klick, med en fältuppsättning som är **strukturerad i stället för fritext**.
2. Utredningsflöde: mottagen → utredd → åtgärd → uppföljd, med ansvarig och frist.
3. Koppling till rutin – "den här avvikelsen ledde till att rutin X ändrades" (se även 72i).
4. Statistik per typ, enhet och period. Matar 72b och 72d.

**Den avgörande designfrågan.** En avvikelse beskriver till sin natur en händelse som rör en
patient. Produktens hela juridiska hållning bygger på att patientuppgifter aldrig finns.
Alternativen:

| Väg | Innebär | Nackdel |
|---|---|---|
| **A. Strukturerad, avidentifierad** | Endast händelsetyp, enhet, tidpunkt, förlopp i förvalda kategorier, åtgärd. Inga fritextfält om personen | Räcker för statistik och systematik, men kan vara otillräckligt för den enskilda utredningen – och kunden kommer att skriva ändå om det finns ett fritextfält någonstans |
| **B. Fritext med PII-spärr** | Som idag i kommentarer/skiftrapport | **Spärren fångar personnummer, inte "den äldre damen på rum 4".** Bryter mot hela hållningen i praktiken även om den håller i teorin |
| **C. Bygg inte** | Kunden fortsätter i sitt Excel-ark | Den största kvarvarande luckan lämnas öppen, och konkurrentens starkaste argument står kvar |

**Rekommendation: väg A, men först efter samma externa juridiska bedömning som Etapp 64
väntar på.** Om bedömningen ändå ska beställas är detta en andra fråga att ställa i samma
uppdrag, till marginell extra kostnad. Se genomgående krav 41.

---

### Grupp B – Inte lagkrav, men avgör om appen används

---

### 72f. Driftstoppsläge

**Behovet.** När journalsystemet ligger nere ska personalen kunna arbeta på reservrutiner.
Det är också exakt det scenario där en offline-kapabel rutinapp bevisar sitt pris.

**Bygg:** ett eget läge, i samma anda som akutläget, som samlar de rutiner som gäller vid
IT-avbrott och som garanterat finns cachade. Plus en "vad gäller nu"-vy och möjlighet att
signera 72a:s kontroller offline (krav 42).

**Bygger på:** `OfflineCenter`, `useOfflineKo`, akutlägets mönster (`useAkutlageRutiner`,
`AkutlagePrefetch`).

**Litet bygge, stort demoögonblick.** Offline är idag en teknisk funktion i Drift-paketet.
Som *scenario* säljer den sig själv, och det svarar mot iakttagelsen i
`saljmaterial/KOPARANALYS.md` avsnitt 6 punkt 6 om att det starkaste demoögonblicket ligger i
fel paket.

---

### 72g. Utrustningsregister med QR och servicehistorik

**Behovet.** Defibrillatorn, autoklaven, vaccinkylen och vågen har serienummer,
kontrollintervall, serviceavtal och en historik som ska kunna visas upp. Idag: en pärm bredvid
apparaten.

**Bygg:** ett utrustningsobjekt (namn, serienummer, plats, ansvarig, kontrollintervall,
serviceavtal, historik), QR-etikett att sätta på apparaten, och skanning som leder direkt till
utrustningens rutin, loggbok (72a) och servicehistorik.

**Bygger på:** `SkannaModal`, QR-generering, platsmodellen (`skap`/`hylla`).
**Bygger INTE på** förrådsartikelsamlingen – utrustning är inte förbrukningsmaterial
(premissfynd 12).

Knyter ihop 72a med den fysiska miljön och är produktens tydligaste differentiering mot ett
dokumenthanteringssystem.

---

### 72h. Språkstöd: lättläst och uppläsning

**Behovet.** En betydande andel vårdpersonal har svenska som andraspråk. En rutin som inte
förstås är inte läst, oavsett vad kvitteringsgraden säger.

**Bygg:** ett lättläst-läge per rutin (kortare meningar, förklarade facktermer – redaktören
skriver, produkten strukturerar), en begreppsordlista som kan hovras/tryckas, och uppläsning
via `useTalsyntes` som redan finns.

**Avgränsning:** ingen maskinöversättning av medicinskt innehåll. Risken för en felöversatt
rutin är oacceptabel och skulle dessutom kollidera med hela klinikstödets domänbegränsning.
Detta är ett redaktörsstöd, inte en översättningsmotor.

**Ingen konkurrent i segmentet gör detta**, och det är ett argument som talar direkt till
verksamhetschefen i en verksamhet med hög andel vikarier – ett av kandidatlistans
urvalskriterier (nr 5).

---

### 72i. Beslut → rutinändring

**Behovet.** APT- och ledningsgruppsbeslut lever i Word och mejl. När en revisor frågar
*"varför ändrades den här rutinen?"* finns svaret i någons inkorg.

**Bygg:** ett lättviktigt beslutsobjekt (datum, forum, beslut, ansvarig, frist) som kan kopplas
till en eller flera rutinändringar, och som syns i rutinens versionshistorik som "ändrad till
följd av beslut X".

**Bygger på:** versionshistoriken, `DiffVy`, revisionsloggen.

Medvetet litet. Det här ska inte bli ett mötesbokningssystem.

---

### Grupp C – Kräver kunder, eller riktar sig till en annan köpare

---

### 72j. Systematiskt arbetsmiljöarbete

Skyddsrond, riskbedömning, handlingsplan, tillbudsrapportering för personal. **Samma motor som
72a och 72e**, men en annan köpare (chef/HR) och ett annat regelverk.

**Bör byggas som en egen modul** och kan höja takhöjden per affär – men den breddar produkten
bortom vård, vilket är ett positioneringsbeslut. Se beslutspunkt 3.

---

### 72k. Kundens eget avtals- och leverantörsregister

Kunden har också leverantörer: labb, städ, avfall, utrustningsservice, journalsystem – med
avtal, uppsägningstider och förnyelsedatum som glöms bort.

**Exakt samma mönster som åtagandekalendern (`atagandekalender`) som byggdes internt i Etapp
L1o** – en collection, en signal, en lista. Den koden finns och fungerar; det här är att göra
samma sak kundvänt.

---

### 72l. Anonymiserad benchmarking

*"Er kvitteringsgrad är 78 %. Snittet bland jämförbara enheter är 64 %."*

`matvardenSnapshots` är redan rätt datastruktur och samlas redan veckovis. **Kräver flera
kunder för att vara meningsfullt**, och kräver att jämförelsen aldrig kan peka ut en enskild
organisation – vilket med två kunder är omöjligt. Byggs tidigast vid fem kunder.

---

## Beslutspunkter (ägaren)

Ingen av dessa är avgjord. **Planen kan inte antas i sin helhet utan svar på 1 och 2.**

| # | Fråga | Rekommendation | Status |
|---|---|---|---|
| 1 | Ska **avvikelsehantering** (72e) byggas, och i så fall enligt väg A (strukturerad, avidentifierad)? | **Ja, väg A – men först efter en extern juridisk bedömning**, lämpligen i samma uppdrag som Etapp 64:s. Utan bedömning: bygg inte. Risken är inte teknisk utan att produktens grundlöfte ("inga patientuppgifter") blir osant i praktiken | Öppen |
| 2 | **Vilket paket** hör de nya funktionerna till? Core, Operations, eller en ny modul? | **En ny modul, "Efterlevnad".** Men flytta samtidigt innehållshälsan till Core, enligt `saljmaterial/KOPARANALYS.md` avsnitt 11 punkt 4 – skälet att köpa måste finnas i det paket köparen köper. Att lägga även det nya bakom en tilläggsmodul upprepar samma misstag | Öppen |
| 3 | Ska **arbetsmiljödelen** (72j) byggas? | **Vänta.** Den breddar produkten bortom vård och riktar sig till en annan köpare. Bygg den när en verklig kund efterfrågar den, inte i förväg – samma resonemang som 54c/54d i `BESLUTSLOGG.md` | Öppen |
| 4 | Ska **patientsäkerhetsberättelsen** (72b) generera en färdig handling eller ett underlag? | **Utkast, aldrig färdig handling** (genomgående krav 40). Ansvaret för innehållet är vårdgivarens och får inte se ut att ha flyttat | Öppen |
| 5 | Ska hela planen byggas, eller **bara grupp A**? | **Grupp A först, i ordningen 72a → 72d → 72b → 72c.** Grupp B och C är värdefulla men inget av dem ändrar produktens kategori | Öppen |
| 6 | Är detta rätt riktning **över huvud taget**, jämfört med att fördjupa rutindatabasen? | **Ja, men det är ett vägval.** Se "Den större frågan" nedan | Öppen |

---

## Den större frågan

`saljmaterial/KOPARANALYS.md` avsnitt 12 formulerar det som att köparens problem inte är
avsaknaden av ett verktyg, utan att ingen har tid att göra ordning på rutinerna – och drar
slutsatsen att det mest attraktiva vore en tjänst: *"jag ordnar era rutiner, och de bor sen
här."*

Den här planen är ett **tredje alternativ** till det vägvalet. I stället för att sälja
tjänstetid eller djupare rutinfunktioner flyttar den produkten till de skyldigheter kunden
måste fullgöra oavsett hur bra deras rutiner är. Skillnaden i praktiken:

- **Djupare rutindatabas:** värdet uppstår när kunden lagt in trettio rutiner. Kallstarten
  kvarstår.
- **Tjänsteförsäljning:** konverterar bäst, skalar sämst, kräver tid som inte finns bredvid
  en anställning.
- **Den här planen:** värdet uppstår vid första signerade kontrollen. Kallstarten blir
  irrelevant för adoptionen, och det som säljs är ett resultat i stället för en möjlighet –
  utan att någon behöver sälja sin tid.

**Det bör fattas som ett medvetet vägval, inte glidas in i.** Samma formulering som
köparanalysen använder, och den gäller här också.

---

## Vad jag INTE föreslår

- **Patientuppgifter i någon form.** Se genomgående krav 41. Detta är inte en avgränsning av
  bekvämlighet utan produktens juridiska grundval.
- **Journalintegration.** Annan produktkategori, andra krav, andra godkännanden.
- **Schema- och bemanningssystem.** Etablerade konkurrenter, ingen differentiering.
- **En fullskalig e-learningplattform.** Öva-läget och introduktionsspåret är avsiktligt
  lätta. Att göra dem till en LMS är att börja tävla med produkter som gör det bättre.
- **Maskinöversättning av medicinskt innehåll.** Se 72h.
- **Att bygga 72e innan beslutspunkt 1 är avgjord.** Även om det är den funktion en kund
  frågar efter först.
- **Automatiska åtgärder på en missad kontroll.** En missad kontroll ska notifiera, aldrig
  eskalera automatiskt till en avvikelse utan att en människa sett den. Samma princip som
  redan gäller signalmotorn i leverantörspanelen.

---

## Beroendeordning

```
72a (återkommande kontroller)   ← bygg FÖRST, allt annat blir bättre av att den finns
 ├─ 72d (tillsynspaket)          – blir tunt utan 72a:s kontrollhistorik
 ├─ 72g (utrustning + QR)        – kontrollerna behöver något att sitta på
 └─ 72f (driftstoppsläge)        – krav 42 gör dem beroende av varandra

72b (patientsäkerhetsberättelse) – kan byggas fristående, blir rikare med 72a och 72e
72c (delegeringsregister)        – fristående, vilar på befintlig kompetensmatris
72e (avvikelsehantering)         [beslutspunkt 1 – BLOCKERAD]
 └─ 72j (arbetsmiljö)            [beslutspunkt 3] – samma motor, bygg aldrig före 72e

Fristående, när som helst:
 72h (språkstöd)     – vilar bara på useTalsyntes som redan finns
 72i (beslut→rutin)  – litet
 72k (avtalsregister) – i praktiken en kundvänd kopia av atagandekalender

Kräver kunder:
 72l (benchmarking)  – tidigast vid fem kunder
```

---

## Uppskattad arbetsinsats

Samma skala som tidigare etapplaner (ett "delmål" ≈ en eller flera fokuserade arbetsinsatser).

| Delmål | Omfång | Kommentar |
|---|---|---|
| 72i, 72k | Små | 72k är i praktiken en kundvänd variant av kod som redan finns |
| 72d, 72f, 72h | Medel | Alla tre är gränssnitt och sammanställningar ovanpå befintlig data |
| 72b, 72c, 72g | Medel–stora | Ny datamodell, men avgränsad. 72b är mest research, minst kod |
| 72a | **Stor – planens kärna** | Ny datamodell, schemaläggning, offline-signering, oföränderlig logg |
| 72e | Stor + juridiskt blockerad | Bygg inte förrän beslutspunkt 1 är avgjord |
| 72j | Stor, annan köpare | Bygg inte förrän en kund efterfrågar den |
| 72l | Liten kod, kräver kunder | Datastrukturen finns redan |

**Föreslagen ordning om planen antas:** 72a → 72d → 72b → 72c → (paus för utvärdering mot en
verklig kund) → 72f, 72g, 72h.

---

## Källor och verifieringsbehov

**Det här avsnittet är avsiktligt obekvämt.** Planen vilar på påståenden om svensk
vårdlagstiftning som **inte har verifierats mot primärkällor** i den session som skrev den.
De är härledda ur allmän kunskap om regelverket, inte ur lästa föreskrifter.

Samma disciplin som `saljmaterial/MARKNADSANALYS.md` och
`saljmaterial/KANDIDATLISTA-PRIVAT-VARD.md` redan tillämpar gäller här:

| Påstående | Måste verifieras innan |
|---|---|
| Att patientsäkerhetsberättelse är en lagstadgad årlig handling, dess deadline och dess avsnittsstruktur | 72b påbörjas, och innan påståendet används i säljmaterial |
| Vilka krav som gäller för delegering: form, längsta giltighetstid, återkallelse, dokumentation | 72c påbörjas |
| Vilka egenkontroller som är föreskrivna kontra branschpraxis (temperatur, medicinteknik, narkotika) | 72a:s standardmallar skrivs |
| Vad ledningssystemsföreskriften faktiskt kräver av en liten privat vårdgivare | Planen antas – den är hela premissen |
| Att avvikelsehantering är ett formellt krav och i vilken form | Beslutspunkt 1 avgörs |

**Ett varningsexempel ur projektets egen kod:** `functions/kvissfragorSeed.js` noterar att
SOSFS 1997:14 om delegering – den föreskrift i stort sett varje svensk delegeringsutbildning
har vilat på – är upphävd. Regelverket rör sig. En plan som bygger på ett minne av det är
inte ett beslutsunderlag.

**Ingen rad i den här planen får citeras i kundvänt material innan tabellen ovan är
avbockad mot faktiska källor.**

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 0.1 | 2026-08-30 | Första utkastet, skrivet på ägarens begäran efter en genomgång av produktens nuvarande form mot vårdgivares faktiska behov. Tolv premissantaganden kontrollerade mot kod, varav fyra ändrade innehållet. **Ej antagen** – sex beslutspunkter öppna, varav 1 och 2 blockerar antagandet i sin helhet |
