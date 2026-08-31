# Etapplan 19 – Från rutindatabas till ledningssystem

**Etapp 72. ANTAGEN 2026-08-30 (v0.2).** Skriven på ägarens begäran efter en genomgång av
produktens nuvarande form mot de behov en svensk vårdgivare faktiskt har. Bygger på faktisk
kodstatus i v5.137.0 (30 rutter, 74 hooks, 40 admin-/leverantörssektioner, 11 schemalagda
jobb).

> **Antagen i sin helhet.** Ägaren godkände planens egna rekommendationer på samtliga sju
> beslutspunkter (se `BESLUTSLOGG.md` 2026-08-30 och tabellen nedan, kolumnen "Status"). Det
> låser fast RIKTNINGEN – **det låser inte upp bygget av något enskilt delmål**, eftersom
> beslutspunkt 5 (efterfrågegrinden) själv säger att inget delmål byggs innan en namngiven
> kund bett om det skriftligt. Det som faktiskt går att göra direkt är undantagen i
> beslutspunkt 5 – och samtliga tre är gjorda, se dess sektion.

> **v0.2 är omskriven mot `granskningar/GRANSKNING-IDEBANK-2026-08-30.md`.** Den granskningen
> gäller formellt ett ANNAT dokument – produktidébanken, 18 förslag – men sex av dess förslag
> motsvarar delmål här, och den gjorde det arbete v0.1 utpekade som sin egen svaghet: den
> verifierade regulatoriska påståenden mot primärkälla. Fem fynd ändrade den här planen, och
> ett av dem (delegering.se) var ett verkligt misstag i v0.1. Se versionshistoriken för hela
> listan.

> **Antagandet var inte en formalitet, och det är fortfarande inte ett byggbeslut per delmål.**
> Planen föreslår att produkten växer ut ur sin nuvarande kategori – ett affärsbeslut lika
> mycket som ett byggbeslut. **72e (avvikelsestatistik) väntar fortfarande på att en extern
> juridisk bedömning bekräftar fältuppsättningen**, lämpligen i samma uppdrag som
> `etapplaner/ETAPPLAN13.md` Etapp 64 redan väntar på (se beslutspunkt 1). Och även utan den
> spärren: **bygg inget delmål utan en namngiven kund som bett om det skriftligt** – se
> beslutspunkt 5.

> **Vad den här planen är:** ett förslag på hur Synappsen går från att svara på *"var finns
> rutinen och har den lästs?"* till att bära de återkommande, daterade och signerade
> skyldigheter en vårdgivare ändå måste fullgöra – och som idag ligger i Excel och pärmar hos
> exakt den målgrupp kandidatlistan pekar ut.
>
> **Vad den inte är:** ett journalsystem, ett schemasystem, en e-learningplattform eller ett
> fullskaligt ärendehanteringssystem. Se "Vad jag INTE föreslår".

---

## Premisskontroll (genomgående krav 8)

**Premisskontrollen har två ben sedan v0.2.** v0.1 kontrollerade tolv antaganden mot vår egen
kod och missade ändå att en svensk specialist redan säljer delmål 72c som färdig produkt
(delegering.se). Kodkontroll fångar "bygger vi på fel grund"; den fångar aldrig "är det här
redan byggt av någon annan". Båda frågorna måste ställas innan ett delmål antas.

**Ben 1 – mot koden.** Tolv antaganden kontrollerade. Åtta höll, fyra ändrade innehållet.

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

### Ben 2 – mot marknaden (tillkom i v0.2)

**Regeln:** innan ett delmål antas ska frågan *"säljer någon redan detta till den här
målgruppen, i Sverige, idag?"* ställas och besvaras skriftligt i delmålet. Ett svar räcker
inte som "trolig konkurrent" – det ska vara en namngiven aktör med en kontrollerad
funktionsjämförelse, eller ett konstaterande att ingen hittades och hur det söktes.

| Delmål | Fynd | Följd |
|---|---|---|
| **72c** delegering | **delegering.se** gör hela det ursprungliga förslaget: kunskapstester, översikt över vem som delegerat till vem, bedömningsstöd för reell kompetens, påminnelser inför utgångsdatum, loggade delegeringar per person. Målgruppen anges uttryckligen som vårdpersonal, chefer och MAS | **72c omskrivet i v0.2** från register till koppling. Se delmålet |
| 72a, 72d | Stratsys, CANEA och Centuri säljer motsvarande – men uttryckligen till administratörer, i prisklasser målgruppen inte når. Granskningen konstaterar samma sak i sitt avsnitt 6.1 | Ingen ändring. En funktion som finns i ett system målgruppen inte kan köpa är inte en tagen marknad |
| 72b | Ingen aktör hittad som genererar utkast ur kundens egen driftdata. Ledningssystemen tillhandahåller mallar, inte underlag | Ingen ändring |
| 72k | Verksamhetssystemen (Sekoia, Lifecare, Combine, Alfa eCare) är en **kanalrisk**, inte en funktionskonkurrent: om något av dem lägger till en enkel rutinbank blir Synappsen ett tillägg kunden inte behöver köpa | Noterat som risk, inte som hinder |
| — | **Eolas Medical** (~154 kr/användare/år) är den närmaste internationella analogen och saknades helt i v0.1:s underlag | Inget akut hot – ingen svensk datalagring, inget svenskt PUB-avtal. Men det är prisgolvet om de kommer in |

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

> **Gränsen, formulerad så den går att pröva** (ur granskningen, avsnitt 3.7, marknadsförings-
> lagen): *"Systemet kan stödja kundens efterlevnad. Det uppfyller inte en föreskrift som
> riktar sig till vårdgivaren."* Ett påstående om att Synappsen "uppfyller" en föreskrift är
> ett påstående som måste kunna styrkas – och det kan det inte, eftersom föreskriften riktar
> sig till kunden. Gäller i kod, i gränssnittstext och i säljmaterial samtidigt.

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

**44. Vid en KOMMUNAL kund gäller andra bevaranderegler än produktens egna.** *(Nytt i v0.2,
ur granskningens avsnitt 3.7. Premissen är verifierad mot kod 2026-08-30.)*

Två av produktens egna regler är leverantörsbeslut som kolliderar med arkivlagen (1990:782):

| Vår regel | Var den bor | Konflikten |
|---|---|---|
| Backuper gallras efter 90 dagar | `BACKUP_RETENTION_DAGAR = 90` i `functions/backup.js` | Gallringsbeslut fattas av kundens arkivmyndighet, inte av leverantören |
| En organisation kan raderas efter 48 timmars ångerfrist | `RADERING_VANTETID_TIMMAR = 48` i `functions/avtalslivscykel.js` | Samma sak, och betydligt allvarligare – raderingen är irreversibel |

Dessutom: uppgifter som förvaras hos en privat leverantör för en kommuns räkning kan behöva
lämnas ut vid en begäran om allmän handling (tryckfrihetsförordningen, OSL). En loggbok (72a)
och en årlig berättelse (72b) hos en kommunal kund blir sannolikt allmänna handlingar.

**Följd:** ingen kommunal pilot tecknas innan detta är utrett, och ingetdera av 72a och 72b
säljs mot kommun förrän bevarandefrågan har ett svar. **Detta saknades helt i v0.1** och är
det enda fyndet i granskningen som pekar på en konflikt mellan planen och kod som redan är i
drift.

---

## Delmål

**Tretton delmål sedan v0.2** (72a–72m), efter att 72e delades. 72m är placerat sist i stället
för i bokstavsordning, så att inga befintliga beteckningar behövde numreras om.

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

**Billig att bygga.** Nästan ingen ny datafångst – det är en rapport över data ni redan samlar.
Och det byter argument från "ett verktyg som gör arbetet möjligt" till "en handling ni ändå
måste producera, färdig att granska". Det är exakt vägvalet `saljmaterial/KOPARANALYS.md`
avsnitt 12 efterlyser, utan att sälja konsulttid.

> **Dyr att äga — rättelse i v0.2.** v0.1 satte "högst värde per byggtimme" på det här
> delmålet. Den mätningen var fel storhet. Ett delmål som återger strukturen i en föreskrift
> måste **följa den föreskriftens ändringar för alltid**, och den kostnaden syns inte i en
> byggtidsuppskattning. Granskningens avsnitt 5.3 har rätt: den bindande resursen är ägarens
> tid, och regulatoriska moduler sänker kapacitetstaket i stället för att bara belasta det en
> gång. 72a:s kontroller definieras av kunden och har ingen sådan svans; 72b och 72c har en
> permanent. Se den nya kolumnen i arbetsinsatstabellen.

---

### 72c. Delegeringskopplingen — OMSKRIVEN i v0.2

> **Vad som ändrades och varför.** v0.1 föreslog ett fullständigt delegeringsregister. Den
> marknadskontroll som saknades då visar att **delegering.se redan säljer exakt det** till
> exakt den målgruppen – kunskapstester, vem-har-delegerat-till-vem, bedömningsstöd för reell
> kompetens, utgångspåminnelser, loggade delegeringar per person. En specialist med färdig
> produkt, innehåll och kundrelationer vinner en funktionsjämförelse mot vår första version.
> Delmålet är därför omskrivet från *register* till *koppling*.

**Behovet, omformulerat.** Det Synappsen kan göra som en fristående delegeringstjänst
strukturellt inte kan: koppla delegeringen till **rutinen och kvitteringen**. Frågan
*"har personen som fått delegering för uppgiften också läst och kvitterat rutinen som hör till
den?"* kräver att delegeringen och rutinbeståndet bor i samma system. Det gör de bara hos oss.

**Den andra halvan – en lucka granskningen hittade.** När SOSFS 1997:14 upphävdes (genom
**HSLF-FS 2025:5**, inte 2025:6 som en tidigare version av underlaget angav) försvann den
bindande föreskriften för delegering av *andra arbetsuppgifter än läkemedel*. Kvar finns
patientsäkerhetslagens generella bestämmelser och Socialstyrelsens vägledning. **Varje
vårdgivare måste alltså nu själv utforma sin rutin för icke-läkemedelsdelegering.**

Det är ett behov som (a) är nytt, (b) inte är tidsbegränsat, (c) ingen specialist täcker,
och (d) ligger i produktens absoluta kärna – att skriva, äga, granska och kvittera en rutin.

**Bygg:**

1. **En rutinmall för icke-läkemedelsdelegering** i `verksamhetsmallar.js`, med de moment
   patientsäkerhetslagen och vägledningen kräver. Kunden fyller i sin egen tillämpning; vi
   tillhandahåller strukturen. Detta är ren innehållsproduktion, inte kod.
2. **Kopplingsfältet:** en uppgift som kräver delegering pekar ut vilken rutin som hör till
   den, och vilka kompetenskrav som måste vara gröna.
3. **Uppföljningsvyn:** "dessa personer har delegering för uppgift X – så här ser deras
   kvitteringsläge ut för den tillhörande rutinen." Matar 72d.

**Bygg INTE:** själva delegeringsdokumentet, utgångslarmen eller kunskapsprovet. Det finns
redan hos delegering.se, och våra kompetenskrav och öva-läget täcker halva behovet ändå. Om en
kund använder båda systemen är kopplingsfältet det som gör dem värda mer tillsammans än var
för sig — och om en kund senare kräver hela registret är det ett eget beslut, inte en
biprodukt av det här delmålet.

**Segmentnytta:** störst i ASIH, hemsjukvård och äldreomsorg. **Marginell för de privata
vårdcentraler och specialistkliniker som säljarbetet faktiskt riktar sig mot just nu** – se
beslutspunkt 7.

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

### 72e. Avvikelsestatistik — DELAT i v0.2

> **Vad som ändrades och varför.** v0.1 behandlade "avvikelsehantering" som ett delmål med tre
> vägar att välja mellan. Granskningen invänder att *"det går inte att bygga en lex Maria-modul
> utan patientuppgifter … mellanläget finns inte"*. Den invändningen är riktig — men den gäller
> **utredningen av en enskild händelse**, inte avvikelsearbetet som helhet. v0.1 blandade ihop
> två saker med olika juridisk status. De är nu delade: **72e (statistik, byggbar)** och
> **72m (händelseanalys, blockerad)**.

**Behovet.** Ett kvalitetsledningssystem kräver att avvikelser sammanställs, följs över tid och
används för att förbättra rutiner. Det arbetet är **aggregerat till sin natur** och kräver
ingen patientidentitet.

**Bygg — strikt strukturerat, inga fritextfält om en person:**

1. **Registrering:** händelsetyp (förvald lista), enhet, tidpunkt, allvarlighetsgrad, förlopp
   valt ur förvalda kategorier, vidtagen åtgärd. Ingen fritext som kan bära en beskrivning av
   en patient.
2. **Koppling till rutin** – "den här avvikelsetypen ledde till att rutin X ändrades"
   (se även 72i).
3. **Trend och sammanställning** per typ, enhet och period. Matar 72b och 72d.

**Varför det håller.** Ett fält som bara accepterar ett val ur en lista kan inte innehålla
"den äldre damen på rum 4". Spärren är då strukturell i stället för en filtrering i efterhand
— samma princip som gör kioskläget säkert (Etapp 55): förmågan finns inte, snarare än att den
finns och blockeras.

**Kvarstående risk att pröva innan bygget:** kunden vill skriva mer än fälten tillåter och
lägger patientuppgifter i ett fält avsett för något annat. Det är samma risk som redan finns
i kommentarer och skiftrapporter, och den hanteras med samma medel — men den ska stå i
beslutsunderlaget, inte upptäckas efteråt. Se genomgående krav 41.

---

### 72m. Händelseanalys och lex Maria — BLOCKERAD, byggs sannolikt inte

> **Utbrutet ur 72e i v0.2.** Placerat sist i stället för att skjutas in mellan 72e och 72f,
> så att inga delmålsbeteckningar behöver numreras om.

**Behovet.** En avvikelse som kan leda till en anmälan enligt patientsäkerhetslagen kräver en
utredning av en identifierad händelse och en identifierad patient. Det är den delen av
avvikelsearbetet som 72e medvetet inte täcker.

**Bedömning: bygg inte.** Granskningen formulerar det rätt — antingen bygger man det och
accepterar att produkten byter riskklass, eller så bygger man det inte. Konsekvenserna av det
första:

- Nytt DPIA-underlag, omskrivet PUB-avtal, ny bedömning av datalagring och åtkomstloggning
- Frågan om innehållet blir en **journalhandling** enligt patientdatalagen, med krav på
  förvaring och åtkomstlogg produkten inte är byggd för
- Hela positioneringen "inga patientuppgifter" faller, och med den de svar i
  `saljmaterial/kallfiler/Synappsen-upphandlingssvar.html` som vilar på den

**Det är inte ett delmål utan ett produktbeslut**, och det bör i så fall behandlas som en egen
etapp med egen juridisk grund — inte som en punkt i en lista. Det står här för att gränsen ska
vara skriven, inte för att den ska övervägas.

**Ett ärligt alternativ att erbjuda kunden i stället:** 72e ger sammanställningen, och
händelseanalysen sker där patientuppgifterna redan får finnas — i journalsystemet eller på
papper. Att säga det rakt ut är ett bättre säljargument än att antyda att vi täcker hela
kedjan.

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

**Samtliga sju avgjorda 2026-08-30** – ägaren godkände planens egna rekommendationer i sin
helhet. Se `BESLUTSLOGG.md` samma datum.

| # | Fråga | Rekommendation | Status |
|---|---|---|---|
| 1 | Ska **avvikelsestatistiken** (72e) byggas strikt strukturerad, och **händelseanalysen** (72m) lämnas obyggd? | **Ja på båda.** Den strukturella spärren (bara val ur listor, ingen fritext om person) gör 72e byggbart utan att röra grundlöftet. 72m byter produktens riskklass och är ett produktbeslut, inte ett delmål. En extern juridisk bedömning bör ändå bekräfta 72e:s fältuppsättning – lämpligen i samma uppdrag som Etapp 64:s | **Avgjord 2026-08-30.** 72m byggs inte. 72e väntar fortfarande på den juridiska bekräftelsen innan bygget – riktningen är beslutad, bygget är det inte |
| 2 | **Vilket paket** hör de nya funktionerna till? Core, Operations, eller en ny modul? | **En ny modul, "Efterlevnad".** Men flytta samtidigt innehållshälsan till Core, enligt `saljmaterial/KOPARANALYS.md` avsnitt 11 punkt 4 – skälet att köpa måste finnas i det paket köparen köper. Att lägga även det nya bakom en tilläggsmodul upprepar samma misstag | **Avgjord 2026-08-30.** `src/config/features.js` uppdateras när ett första delmål i modulen faktiskt byggs – ingen kod ändras för en modul utan innehåll |
| 3 | Ska **arbetsmiljödelen** (72j) byggas? | **Vänta.** Den breddar produkten bortom vård och riktar sig till en annan köpare. Bygg den när en verklig kund efterfrågar den, inte i förväg – samma resonemang som 54c/54d i `BESLUTSLOGG.md` | **Avgjord 2026-08-30.** Vänta |
| 4 | Ska **patientsäkerhetsberättelsen** (72b) generera en färdig handling eller ett underlag? | **Utkast, aldrig färdig handling** (genomgående krav 40). Ansvaret för innehållet är vårdgivarens och får inte se ut att ha flyttat | **Avgjord 2026-08-30.** Utkast |
| 5 | **Vad utlöser att ett delmål byggs?** | **En namngiven kund som bett om det skriftligt** – inte en position i en lista. Se nedan; detta ersätter v0.1:s föreslagna byggordning | **Avgjord 2026-08-30.** Se sektionen nedan – undantag 1 är genomfört samma dag |
| 6 | Är detta rätt riktning **över huvud taget**, jämfört med att fördjupa rutindatabasen? | **Ja, men det är ett vägval.** Se "Den större frågan" nedan | **Avgjord 2026-08-30.** Ja |
| 7 | **Vilket segment** gäller planen? *(Ny i v0.2)* | **Privat vårdgivare, oförändrat** enligt `saljmaterial/MARKNADSANALYS.md` avsnitt 8. Nio av tretton delmål tjänar det segmentet direkt; 72c och 72h skevar mot kommunal omsorg och ska inte driva prioriteringen. Ett segmentbyte får ske – men som ett beslut, inte som en bieffekt av att delegeringsfrågan är intressant | **Avgjord 2026-08-30.** Privat vårdgivare |

### Beslutspunkt 5, utskriven: efterfrågegrinden

**v0.1 föreslog en byggordning (72a → 72d → 72b → 72c). Den är struken.** En byggordning
formulerad innan någon kund finns är samma mönster som gav projektet 67 etapper och noll
externa användare, och `saljmaterial/MARKNADSANALYS.md` avsnitt 6.3 är kategorisk om att varje
timme före första kunden har negativt förväntat värde.

**Regeln i stället:** inget delmål i den här planen byggs innan en **namngiven kund har bett om
det skriftligt.** Vad ordningen ovan i så fall betyder är vilket delmål som byggs *först när
efterfrågan finns* – inte vilket som byggs först.

**Tre undantag**, eftersom regeln annars blir dogmatisk:

1. **Arbete som inte är en funktion — ✅ GENOMFÖRT 2026-08-30.** Att skriva ned det avsedda
   ändamålet för klinikstöd-sökningen, kontrollera artikel 50-märkningen och uppskatta
   kostnaden för en Vertex AI-migrering kostar timmar, kräver ingen kund och stänger
   regulatorisk risk.
   - **Avsett ändamål:** `granskningar/AVSETT-ANDAMAL-KLINIKSTOD-2026-08-30.md`. Hittade och
     rättade en självmotsägelse i `functions/klinikstod.js`s Gemini-prompt, som uttryckligen
     sa "Detta är beslutsstöd" – rakt emot avgränsningen som håller funktionen utanför MDR.
   - **Artikel 50:** var en bekräftad brist (`granskningar/JURIDISK-GRANSKNING.md` §7.4).
     Byggd: en AI-tolkad rutins ursprung märks nu i läsvyn (`src/components/RutinKort.jsx`),
     oavsett om rutinen sedan godkänts av en redaktör. `saljmaterial/kallfiler/
     Synappsen-upphandlingssvar.html` svar E2 uppdaterat från "ej byggt" till "byggt".
   - **Vertex AI-kostnad:** `granskningar/VERTEX-AI-MIGRERING-KOSTNADSUPPSKATTNING-2026-08-30.md`
     – grovt 2–3 arbetsdagar, refererad från `avtal/UNDERBITRADEN.md`.
   - **Bifynd, rättat i samma svep:** `avtal/UNDERBITRADEN.md` sa "fem godkända medicinska
     källdomäner" – koden har haft sju sedan källbevakningen byggdes ut. Rättat, med en ny
     assertion i `tests/docs/dokumentpastaenden.test.js`.
2. **72d (tillsynspaketet)** är en export över data som redan samlas – ingen ny datamodell,
   inget nytt regulatoriskt underhåll. Det ligger närmare punkt 1 än ett nytt delmål, och kan
   byggas på egen risk om ett säljmöte behöver det.
3. **Rutinmallar** (delar av 72c) är innehållsproduktion, inte kod. Samma resonemang.

**Och det billigaste steget av alla, som varken kräver kod eller kund:** fråga de tre
mottagarna i det pågående utskicket vad de skulle vilja ha härnäst. Tre meningar från någon
som överväger att betala är ett bättre underlag än tretton delmål framtagna genom research.

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

**Ordningen nedan är inte en byggordning** (se beslutspunkt 5) – den säger vad som blir sämre
om det byggs i fel ordning, den dagen efterfrågan finns.

```
72a (återkommande kontroller)   ← om något byggs, börja här
 ├─ 72d (tillsynspaket)          – blir tunt utan 72a:s kontrollhistorik
 ├─ 72g (utrustning + QR)        – kontrollerna behöver något att sitta på
 └─ 72f (driftstoppsläge)        – krav 42 gör dem beroende av varandra

72b (patientsäkerhetsberättelse) – fristående, blir rikare med 72a och 72e
72c (delegeringskopplingen)      – fristående, vilar på befintlig kompetensmatris
72e (avvikelsestatistik)         – strukturerad, byggbar
 └─ 72j (arbetsmiljö)            [beslutspunkt 3] – samma motor, bygg aldrig före 72e

Fristående, när som helst:
 72h (språkstöd)      – vilar bara på useTalsyntes som redan finns
 72i (beslut→rutin)   – litet
 72k (avtalsregister) – i praktiken en kundvänd kopia av atagandekalender

Kräver kunder:
 72l (benchmarking)   – tidigast vid fem kunder

BYGGS INTE:
 72m (händelseanalys, lex Maria) – produktbeslut, inte delmål. Se dess egen sektion
```

---

## Uppskattad arbetsinsats

Samma skala som tidigare etapplaner (ett "delmål" ≈ en eller flera fokuserade arbetsinsatser).

**Kolumnen "underhållssvans" är ny i v0.2** och är den viktigare av de två. Byggkostnaden
betalas en gång; underhållet betalas för alltid, ur samma timmar som supporten. Ett delmål som
återger strukturen i en föreskrift måste följa den föreskriftens ändringar så länge produkten
finns. `saljmaterial/KOSTNADSKALKYL-OCH-PRISSATTNING.md` visar att break-even ligger runt 16
kunder, vilket är i övre delen av vad en person klarar av att supporta — **regulatoriska
moduler sänker det taket, de belastar det inte bara en gång.**

| Delmål | Byggomfång | Underhållssvans | Kommentar |
|---|---|---|---|
| 72i, 72k | Små | Ingen | 72k är en kundvänd variant av kod som redan finns |
| 72d | Medel | Ingen | Export över befintlig data |
| 72f, 72h | Medel | Ingen | Gränssnitt ovanpå befintlig data och talsyntes |
| 72a | **Stor – planens kärna** | **Låg** | Kunden definierar sina egna kontroller. Vi äger mekanismen, inte innehållet |
| 72g | Medel–stor | Låg | Ny datamodell, men ingen föreskrift att följa |
| 72e | Medel | **Medel** | Fältuppsättningen måste hållas strukturerad, och den kan behöva följa praxis |
| 72c | **Liten efter omskrivningen** | **Hög** | Rutinmallen måste följa föreskriftsändringar för alltid. Kopplingsfältet i sig är trivialt |
| 72b | Liten kod, mest research | **Hög** | Avsnittsstrukturen speglar en föreskrift som rör sig |
| 72j | Stor, annan köpare | Hög | Eget regelverk att följa. Bygg inte förrän en kund efterfrågar den |
| 72l | Liten kod | Ingen | Datastrukturen finns redan, men kräver kunder |
| 72m | — | — | Byggs inte. Se dess egen sektion |

**Slutsatsen av kolumnen:** 72a är dyrast att bygga och billigast att äga. 72b och 72c är
tvärtom. Det motsäger v0.1:s ranking, som bara mätte byggtid.

---

## Källor och verifieringsbehov

**v0.1 skrev en lista över vad som behövde verifieras. v0.2 har delvis fått det gjort** –
`granskningar/GRANSKNING-IDEBANK-2026-08-30.md` kontrollerade angränsande påståenden mot
primärkälla. Nedan står vad som därmed är belagt, och vad som fortfarande inte är det.

### Belagt mot primärkälla (via granskningen, 2026-08-30)

| Påstående | Utfall |
|---|---|
| SOSFS 1997:14 om delegering är upphävd | **Stämmer** – genom HSLF-FS 2025:**5** (inte 2025:6, som är ändringen i HSLF-FS 2017:37) |
| Delegeringsbeslut ska vara skriftligt, personligt, tidsbegränsat, följas upp minst årligen, bevaras minst tre år | **Stämmer** |
| Cybersäkerhetslagen (2025:1506) gäller, med 24h tidig varning och 72h rapport | **Stämmer.** Slutrapport anges som "senast en månad", inte 30 dagar |
| Synappsen omfattas självt av NIS2 | **Nej** – storleksgränsen går vid 50 anställda eller 10 M€. Men leverantörskedjekravet gör att kunderna ställer kraven ändå, vilket är den kommersiellt relevanta effekten |
| AI-förordningens artikel 50 gäller sedan 2 augusti 2026 | **Stämmer.** Maskinläsbar märkning har övergång till 2 december 2026 |
| "Simple search" är undantaget från MDR | **Ofullständigt.** MDCG 2019-11 Rev.1 undantar inte NLP-sökning som bidrar till ett medicinskt syfte – vilket är vad klinikstöd-sökningen gör. Se nedan |

### Fortfarande inte belagt — måste kontrolleras före respektive delmål

| Påstående | Måste verifieras innan |
|---|---|
| Patientsäkerhetsberättelsens exakta avsnittsstruktur och deadline | 72b påbörjas, och innan det används i säljmaterial |
| Att ettårsgränsen för delegeringsbeslut gäller ordagrant efter 2025 års reform | 72c:s rutinmall skrivs. Granskningen kunde belägga den hos Vårdhandboken men inte i föreskriftstexten |
| Vad som gäller för delegering av **andra uppgifter än läkemedel** efter upphävandet | 72c:s rutinmall skrivs. Socialstyrelsens meddelandeblad från december 2025 är källan att läsa |
| Vilka egenkontroller som är föreskrivna kontra branschpraxis | 72a:s standardmallar skrivs |
| Vad ledningssystemsföreskriften kräver av en liten privat vårdgivare | Planen antas – den är hela premissen |
| Arkivlagens krav vid kommunal kund kontra våra 90/48 (krav 44) | En kommunal pilot tecknas |

### En regulatorisk risk utanför planen som ändå berör den

Granskningens avsnitt 3.1 är dess viktigaste fynd, och det gäller en funktion som **redan är i
drift**: klinikstöd-sökningen använder en språkmodell för att sammanfatta medicinska källor åt
vårdpersonal, och det ligger inte automatiskt i MDR:s undantag för sökning.

Slutsatsen förändras sannolikt inte – produkten ligger rimligen på rätt sida – **men skälet
gör det.** Skyddet är inte att sökning är undantagen; skyddet är att funktionen är beskriven,
avgränsad och marknadsförd som hjälp att hitta i dokument, inte som stöd för ett kliniskt
beslut om en patient.

Det hör inte hemma i den här planen, men det påverkar den på två sätt: det är **billigare och
mer brådskande än varje delmål här** (se undantag 1 i beslutspunkt 5), och det skärper
genomgående krav 40:s gräns mot marknadsföring.

**Ingen rad i den här planen får citeras i kundvänt material innan den står i den övre
tabellen, eller har verifierats separat.**

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 0.1 | 2026-08-30 | Första utkastet, skrivet på ägarens begäran efter en genomgång av produktens nuvarande form mot vårdgivares faktiska behov. Tolv premissantaganden kontrollerade mot kod, varav fyra ändrade innehållet. **Ej antagen** – sex beslutspunkter öppna, varav 1 och 2 blockerar antagandet i sin helhet |
| 0.2 | 2026-08-30 | **Omskriven mot `granskningar/GRANSKNING-IDEBANK-2026-08-30.md`.** Sju ändringar: (1) **72c omskrivet från register till koppling** – delegering.se säljer redan hela det ursprungliga förslaget, vilket v0.1 missade; delmålet bygger nu kopplingen delegering↔rutin↔kvittering plus en rutinmall för icke-läkemedelsdelegering, den lucka upphävandet av SOSFS 1997:14 lämnade. (2) **72e delat** i statistik (strukturerad, byggbar) och nya **72m** (händelseanalys/lex Maria, byggs inte) – v0.1 blandade två saker med olika juridisk status. (3) **Premisskontrollen har fått ett andra ben, mot marknaden** – kodkontroll fångar aldrig "redan byggt av någon annan". (4) **Nytt genomgående krav 44** om arkivlag och offentlighetsprincip vid kommunal kund; premissen (90 dagars backupgallring, 48 timmars raderingsfönster) verifierad mot kod. (5) **Beslutspunkt 5 omskriven** från byggordning till efterfrågegrind med tre undantag – v0.1 föreslog en byggordning utan kund, vilket är projektets dominerande felmönster. (6) **Arbetsinsatstabellen har fått en kolumn för underhållssvans**, och "högst värde per byggtimme" är struket från 72b: det mätte byggtid, inte ägandekostnad. (7) **Ny beslutspunkt 7 om segment**, eftersom 72c och 72h skevar mot kommunal omsorg medan säljarbetet går mot privat vård. Verifieringstabellen ersatt av granskningens belagda fynd. **Fortfarande ej antagen** – nu sju öppna beslutspunkter |
| 0.2.1 | 2026-08-30 | **ANTAGEN.** Ägaren godkände planens egna rekommendationer på samtliga sju beslutspunkter (se `BESLUTSLOGG.md` samma datum). Antagandet låser riktningen, inte bygget av enskilda delmål – beslutspunkt 5 (efterfrågegrinden) gäller fortfarande. **Beslutspunkt 5, undantag 1 genomfört samma dag:** `granskningar/AVSETT-ANDAMAL-KLINIKSTOD-2026-08-30.md` skriven, en självmotsägande rad ("Detta är beslutsstöd") rättad i `functions/klinikstod.js`s Gemini-prompt, artikel 50-märkning byggd i `src/components/RutinKort.jsx` (bekräftad brist sedan `granskningar/JURIDISK-GRANSKNING.md` §7.4) och upphandlingssvaret uppdaterat, `granskningar/VERTEX-AI-MIGRERING-KOSTNADSUPPSKATTNING-2026-08-30.md` skriven (~2–3 dagar). Bifynd rättat: `avtal/UNDERBITRADEN.md` hade fel antal källdomäner (fem → sju), ny assertion i `tests/docs/dokumentpastaenden.test.js` |
