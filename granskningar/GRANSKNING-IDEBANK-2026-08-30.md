# Granskning av produktidébanken

**Internt · 2026-08-30 · granskning av "Researchunderlag & förslagsutkast för Synappsens
produktidébank"**

> **Detta är inte juridisk rådgivning.** Jag är inte jurist. Bedömningarna nedan bygger på
> primärkällor som verifierats under arbetet, och de pekar ut var en jurist behövs snarare
> än att ersätta en. MDR-klassificering kräver produktspecifik bedömning.
>
> Utkastets egna källhänvisningar har kontrollerats mot primärkälla där det gått. Fem
> påståenden visade sig felaktiga eller för kategoriska, och ett av dem bär upp hela
> rekommendationens första steg.

---

## 1. Sammanfattning

Utkastet är gediget. Den regulatoriska kartan är i huvudsak rätt ritad, avrådan-sektionen är
korrekt och välmotiverad, och strukturen med omprövningsvillkor per förslag är ovanligt
disciplinerad för ett idédokument.

Fyra saker ändrar ändå slutsatserna.

**Tidsfönstret i steg 1 stängde i går.** Utkastet bygger sin första rekommendation på att
SKR:s webbutbildning "Jobba säkert med läkemedel" stängs 31 augusti 2026 och att Socialstyrelsen
saknar ersättare. Datumet stämmer, alltså i morgon räknat från i dag. Men påståendet om att
ersättare saknas stämmer inte: Socialstyrelsen har tagit fram webbstöd om delegering, ett för
den som delegerar och ett för den som tar emot, och SKR hänvisar uttryckligen till det.
Vakuumet som skulle motivera ett halvårs byggande finns alltså inte, och fönstret som skulle
utnyttjas är i praktiken redan passerat.

**MDR-analysen missar det undantag från undantaget som träffar Synappsen.** Utkastet lutar sig
på att "simple search" inte är medicinteknisk programvara. Det stämmer, men MDCG 2019-11 Rev.1
fortsätter i samma stycke med att sökning som använder språkmodeller inte räknas som simple
search om den bidrar till ett medicinskt syfte. Det är precis vad klinikstöd-sökningen gör.
Se avsnitt 3.1, som är den viktigaste delen av den här granskningen.

**Steget mot andra branscher kastar bort vallgraven.** `MARKNADSANALYS.md` avsnitt 5 slår fast
att skyddet mot utländska konkurrenter är den svenska regulatoriska tröskeln, alltså PUB-avtal,
patientdatalag, DOS-lagen och godkända svenska källor. Att gå in i livsmedel och GMP innebär att
lämna den tröskeln och möta etablerade specialister utan den fördelen. Det är dessutom inte
"minst ombyggnad", se avsnitt 5.4.

**Segmentet byter riktning utan att någon säger det.** Utkastets steg 1 riktar sig mot
**kommunal** omsorg, eftersom delegeringsfrågan bor där. Men `MARKNADSANALYS.md` avsnitt 8
rangordnade privat vårdgivare först, och hela säljarbetet den senaste veckan, från
kandidatlistan till de tre mejlutkasten, går mot privata vårdcentraler och kliniker. Utkastet
föreslår i praktiken ett annat go-to-market än det som just påbörjats, utan att behandla det som
ett vägval.

---

## 2. Vad utkastet gör bra

**Avrådan-sektionen är korrekt.** Samtliga sju avrådda funktioner skulle med hög sannolikhet
tippa produkten över MDR-gränsen eller in i patientdata. Dos- och interaktionskontroll mot
patientdata är ordagrant det scenario EU-domstolen prövade i C-329/16, och domslutet är entydigt.

**Omprövningsvillkor per förslag** är den enskilt bästa strukturella idén i dokumentet. Varje
förslag har ett villkor för när det ska byggas i stället för en position i en prioritetslista.
Det gör idébanken till ett beslutsunderlag i stället för en backlogg, och det motverkar precis
det mönster projektet har haft: 67 etapper byggda utan en extern användare.

**Marknadsluckan är korrekt identifierad och källbelagd.** Att Vårdhandboken och 1177 för
vårdpersonal uttryckligen inte innehåller lokala rutiner, medan Centuri och Stratsys är byggda
för administratörer, är rätt observation och stämmer med `MARKNADSANALYS.md` avsnitt 5.

**Caveats-sektionen är ovanligt ärlig.** Att skriva ut att priser är overifierade, att tre
konkurrenter inte kunde kontrolleras och att bedömningarna inte är juridisk rådgivning är precis
den disciplin `VARUMARKE.md` avsnitt 6 kräver.

---

## 3. Juridisk granskning

### 3.1 MDR: undantaget för sökning gäller inte språkmodeller

Detta är granskningens viktigaste fynd.

Utkastet skriver att MDCG 2019-11 "slår fast att 'simple search' (sökning/hämtning av
information) och rena utbildnings-/uppslagsverktyg inte är medicinteknisk programvara". Det är
riktigt så långt. Men vägledningen fortsätter, ordagrant i Rev.1 från juni 2025:

> "software would not be considered as conducting 'Simple search' if it contributes to achieving
> a medical purpose. E.g. User Interface (UI) search feature or a software that performs search
> using Natural Language Processing (NLP) where those actions contribute to achieving a medical
> purpose."

Klinikstöd-sökningen använder en språkmodell för att sammanfatta träffar ur medicinska källor
åt vårdpersonal. Den ligger alltså inte automatiskt i det undantag utkastet vilar på. Frågan
blir i stället om sammanfattningen "bidrar till ett medicinskt syfte", och det avgörs inte av
tekniken utan av det avsedda ändamålet.

**Detta ändrar inte slutsatsen att produkten sannolikt ligger på rätt sida, men det flyttar
skälet.** Skyddet är inte att sökning är undantagen. Skyddet är att funktionen är beskriven,
avgränsad och marknadsförd som hjälp att hitta i organisationens egna och externa dokument,
inte som stöd för ett kliniskt beslut om en patient. Den distinktionen måste hållas i kod, i
gränssnittstext och i säljmaterial samtidigt.

**Praktiska konsekvenser att skriva in i etapplanen:**

- Formulera det avsedda ändamålet skriftligt, i en egen fil, och håll det uppdaterat. Det är
  det dokument en granskare kommer att be om först.
- Klinikstödet ska aldrig svara på en fråga som innehåller patientspecifika uppgifter. Spärren
  finns redan i tre lager för personnummer, men frågan "min patient är 78 år, njursvikt, vad
  gäller" innehåller inget personnummer och är ändå patientspecifik. Överväg en avvisning på
  frågeformuleringen, inte bara på identifierare.
- Sammanfattningen ska alltid visa källa och aldrig rangordna, poängsätta eller rekommendera.
  MDCG:s exempellista tar uttryckligen upp riskpoäng, rangordnade behandlingsförslag och
  prioritetsflaggor som klassificerande.

### 3.2 Avsett ändamål omfattar marknadsföringen

MDR artikel 2.12 definierar avsett ändamål som användningen enligt de uppgifter tillverkaren
lämnar "on the label, in the instructions for use or **in promotional or sales materials or
statements**".

Er webbplats är alltså formellt en del av klassificeringsunderlaget.

Kommissionens Borderline Manual visar samtidigt att marknadsföring ensam inte kan göra en
produkt medicinteknisk om den tekniska funktionen ligger inom de undantagna kategorierna. Men
det omvända gäller: när funktionen väl gör något med data, och en NLP-sammanfattning gör det,
är det era egna ord som avgör vilket syfte den tjänar.

Skillnaden mellan dessa två meningar är juridiskt betydande:

| Formulering | Effekt |
|---|---|
| "Hjälper personalen hitta och sammanfatta era egna rutiner snabbare" | Stannar utanför |
| "Ger personalen kliniskt stöd i beslutssituationen" | Kan dra in funktionen i MDSW |

`VARUMARKE.md` avsnitt 9 förbjuder redan orden AI-driven, intelligent och smart av
positioneringsskäl. Lägg till en regulatorisk rad i samma lista: **skriv aldrig beslutsstöd,
kliniskt stöd i beslut, rekommendation eller bedömning om klinikstödet.** Ordet "klinikstöd"
som funktionsnamn är i gränslandet och bör övervägas om.

### 3.3 AI-förordningen: utkastet missar en artikel som redan gäller

Artikel 50 stämmer. Transparenskraven tillämpas från 2 augusti 2026, alltså sedan fyra veckor,
och den maskinläsbara märkningen av generativt innehåll har övergång till 2 december 2026 för
system som fanns på marknaden dessförinnan.

Två tillägg utkastet inte har med:

**Artikel 4 om AI-kunnighet gäller sedan 2 februari 2025.** Den ålägger både leverantörer och
den som använder AI-system att arbeta för tillräcklig AI-kunnighet hos den personal som hanterar
systemen. Digital Omnibus, som trädde i kraft 27 juli 2026, mjukade upp kravet från att
"säkerställa" till att "stödja utvecklingen av" AI-kunnighet, men artikeln kvarstår. För
Synappsen betyder det två saker: ni bör kunna visa hur ni själva uppfyller den, och den är ett
säljargument, eftersom er kund också omfattas när hon använder AI-funktionerna.

**Digital Omnibus sköt fram högriskreglerna men inte artikel 50.** Bilaga III-systemen flyttades
från 2 augusti 2026 till 2 december 2027. Utkastets oro för Annex III och triage kvarstår
sakligt men är mindre akut i tid än dokumentet antyder.

MDCG 2025-6 bekräftar utkastets beskrivning: högrisk via MDR-spåret utlöses bara om produkten är
medicinteknisk **och** kräver tredjepartsbedömning, alltså klass IIa eller högre. Klass I räcker
inte. Det är en viktig nyans som utkastet uttrycker något för hårt.

### 3.4 Produktansvarslagen är ett förslag, inte gällande rätt

Utkastet skriver att den nya produktansvarslagen "träder i kraft 9 december 2026". Det är för
kategoriskt. Direktivets införlivandefrist är 9 december 2026 och SOU 2025:103 lämnades i
oktober 2025, men den svenska lagen är ännu inte beslutad av riksdagen. Nästa steg är
lagrådsremiss och proposition.

Sakinnehållet stämmer däremot, och det är allvarligt nog: fristående programvara och
molntjänster föreslås omfattas av strikt produktansvar, och en väsentlig ändring efter
lansering kan behandlas som en ny produkt.

**Den konsekvens utkastet inte drar:** för en tjänst som deployas kontinuerligt är frågan om
vad som utgör en väsentlig ändring inte teoretisk. Det talar för tre saker som hör hemma i en
etapplan snarare än i ett idédokument: versionsdisciplin med spårbar releaselogg, en tydlig
ansvarsbegränsning i huvudavtalet, och ansvarsförsäkring med produktansvarsmoment tecknad före
första skarpa användning. Det sista står redan som risk 2 i `MARKNADSANALYS.md` och som åtgärd
i `VARUMARKE.md`.

### 3.5 NIS2 och cybersäkerhetslagen: rätt lag, ett felaktigt datum

Cybersäkerhetslagen (2025:1506) trädde i kraft 15 januari 2026. Tidig varning inom 24 timmar och
rapport inom 72 timmar stämmer. Slutrapporten anges i lagen som "senast en månad", inte 30 dagar.

**Registreringsdatumet 30 september 2026 kunde inte beläggas i någon officiell källa.** MSB:s
tidsplan anger 2 februari 2026 när anmälningstjänsten öppnade, 1 juli 2026 för föreskriften om
incidentrapportering och 1 oktober 2026 för föreskriften om säkerhetsåtgärder. Anmälan ska ske
"så snart det kan ske" utan absolut slutdatum. Sannolikt är 30 september en sammanblandning med
1 oktober. Ta bort det.

**Synappsen omfattas sannolikt inte självt.** Storleksgränsen går vid minst 50 anställda eller
över tio miljoner euro i omsättning. Ett enmansbolag ligger långt under. Men utkastets
huvudpoäng håller ändå och är den kommersiellt intressanta: leverantörskedjekravet gör att era
kunder kommer att ställa krav på er oavsett er egen storlek, och det gör offline-läget,
reservrutinerna och revisionsloggen till säljbara egenskaper.

### 3.6 Delegering: rätt slutsats, fel författningsnummer, och en lucka

Utkastet anger att SOSFS 1997:14 upphört genom HSLF-FS 2025:6. Upphävandet skedde genom
**HSLF-FS 2025:5**, medan 2025:6 är ändringen i HSLF-FS 2017:37 som lägger till
delegeringsbestämmelserna för läkemedel. Sakligt samma resultat, men ett felaktigt
författningsnummer i ett säljargument mot en MAS är dyrt.

Kraven stämmer: beslutet ska vara skriftligt, personligt, tidsbegränsat, följas upp minst en
gång per år, och dokumentationen bevaras i minst tre år efter att beslutet upphört.
Ettårsgränsen anges av Vårdhandboken men kunde inte beläggas ordagrant i föreskriften efter
reformen. Kontrollera den innan den används i en offert.

**Luckan utkastet inte ser:** när SOSFS 1997:14 upphörde försvann den bindande föreskriften för
delegering av *andra* arbetsuppgifter än läkemedel. Kvar finns patientsäkerhetslagens generella
bestämmelser och Socialstyrelsens vägledning. Det betyder att varje vårdgivare nu själv måste
utforma sin rutin för icke-läkemedelsdelegering. Det är, om något, en större öppning än den
utkastet pekar på, och den är inte tidsbegränsad till en nedlagd webbutbildning.

### 3.7 Lagar och regler utkastet inte tar upp

Detta avsnitt är där granskningen tillför mest.

**Patientdatalagen och journalföringsplikten, kopplat till skiftrapporten.** Utkastets
sammanfattning pekar ut skiftöverlämning som ett av tre tillväxtområden. Men en skiftrapport i
vården handlar per definition om patienter. Även utan personnummer blir "rum 4, den äldre
kvinnan med höftfrakturen" identifierande i sitt sammanhang. Personnummerspärren i tre lager
fångar inte det. Frågan är dessutom inte bara GDPR utan om innehållet blir en journalhandling
enligt patientdatalagen, med krav på förvaring och åtkomstloggning som Synappsen inte är byggd
för. **Att bygga ut skiftöverlämning är den enskilt mest riskabla riktningen i hela utkastet,
och den nämns i sammanfattningen som säker.**

**Lex Maria-modulen har samma problem, tydligare.** Förslag 3 säger "INTE patientjournal". En
avvikelseutredning som kan leda till en anmälan enligt patientsäkerhetslagen och HSLF-FS 2017:41
handlar om en identifierad patient och en identifierad händelse. Det går inte att bygga en
lex Maria-modul utan patientuppgifter. Antingen bygger man den och accepterar att produkten
byter riskklass, med allt vad det innebär för PUB-avtal, DPIA och försäkring, eller så bygger
man den inte. Mellanläget finns inte.

**Offentlighetsprincipen och arkivlagen, om kunden är kommunal.** Utkastets steg 1 riktar sig
mot kommuner. Då gäller tryckfrihetsförordningen och offentlighets- och sekretesslagen: uppgifter
som förvaras hos en privat leverantör för en kommuns räkning kan behöva lämnas ut vid en
begäran om allmän handling. Och **arkivlagen (1990:782)** ställer krav på bevarande och gallring
som kan stå i direkt konflikt med produktens egna regler, till exempel att veckobackuper raderas
efter 90 dagar och att en organisation kan raderas efter 48 timmar. En kommunal kunds
arkivmyndighet fattar gallringsbeslut, inte leverantören. Detta bör utredas innan en kommunal
pilot tecknas, och det är inte nämnt någonstans i utkastet.

**GDPR artikel 9.** Kompetens- och delegeringsdata är personaldata och normalt inte känsliga.
Men bedömning av "reell kompetens" kan i praktiken innehålla uppgifter om hälsa, till exempel
skäl till att en delegering inte förnyas. Håll fritextfälten i delegeringsmodulen strikt
strukturerade.

**Upphandlingsrätten vid kommunal försäljning.** Direktupphandlingsgränsen 700 000 kr avser
myndighetens samlade inköp av samma slag under räkenskapsåret, inte per enhet. En
verksamhetschef i en kommun kan alltså inte ensam avgöra att gränsen håller.
`MARKNADSANALYS.md` avsnitt 7.1 har detta, men utkastet upprepar inte varningen trots att det
föreslår kommunala pilotkunder som benchmark.

**Marknadsföringslagen.** Att beskriva funktioner med regulatoriska begrepp man inte uppfyller,
till exempel att antyda att systemet "uppfyller HSLF-FS 2025:6", är ett påstående som måste
kunna styrkas. Systemet kan stödja kundens efterlevnad. Det uppfyller inte en föreskrift som
riktar sig till vårdgivaren.

---

## 4. Faktafel och osäkra uppgifter

| Påstående i utkastet | Utfall | Åtgärd |
|---|---|---|
| "Simple search" är undantaget | Ofullständigt. NLP-sökning som bidrar till medicinskt syfte är inte simple search | Skriv om avsnitt 3.1 i utkastet |
| Socialstyrelsen saknar ersättare till SKR:s utbildning | Fel. Webbstöd om delegering finns, SKR hänvisar till det | Ta bort vakuum-argumentet |
| SOSFS 1997:14 upphävd genom HSLF-FS 2025:6 | Fel nummer. Upphävandet är 2025:5 | Rätta |
| Registrering hos MSB senast 30 sep 2026 | Kunde inte beläggas. Sannolikt förväxling med 1 okt | Ta bort |
| Produktansvarslagen "träder i kraft 9 dec 2026" | Förslag, ej beslutad lag | Omformulera till målsättning |
| Slutrapport NIS2 "30 dagar" | Lagen säger "senast en månad" | Marginellt, men rätta |
| Delegering högst ett år | Anges av Vårdhandboken, kunde inte beläggas ordagrant i föreskriften efter reformen | Kontrollera före användning i offert |
| Artikel 50 gäller från 2 aug 2026 | Stämmer, bekräftat av kommissionen | Behåll |
| C-329/16, dom 7 dec 2017 | Stämmer, domslutet återgivet korrekt | Behåll |
| Högrisk kräver tredjepartsbedömning enligt MDR | Stämmer enligt MDCG 2025-6. Klass I räcker inte | Behåll, men nyansera |
| Artikel 4 om AI-kunnighet | Saknas helt i utkastet. Gäller sedan 2 feb 2025 | Lägg till |
| Digital Omnibus | Nämns som "i rörelse". Trädde i kraft 27 juli 2026 och sköt bilaga III till 2 dec 2027 | Uppdatera |

---

## 5. Strategisk granskning

### 5.1 Utkastet föreslår ett annat segment än det som just valts

Steg 1 handlar om delegering, egenkontroll och kompetens. Den efterfrågan bor i kommunal vård
och omsorg, inte hos de privata vårdcentraler och kliniker som `KANDIDATLISTA-PRIVAT-VARD.md`
kartlade och som de tre mejlutkasten går till.

Det är inte fel att byta segment. Det är fel att byta segment utan att behandla det som ett
beslut. Antingen står `MARKNADSANALYS.md` avsnitt 8 fast, och då är delegeringsspåret något som
byggs efter privatvårdskunder, eller så ändras segmentordningen, och då bör kandidatlistan göras
om mot kommuner.

### 5.2 Bygg-före-kund-mönstret återkommer

`MARKNADSANALYS.md` avsnitt 6.3 är kategorisk: varje timme som läggs på funktioner före första
kunden har negativt förväntat värde. Utkastets steg 1 föreslår att prioritera fyra moduler under
noll till sex månader, med benchmarken "minst 2 betalande kommunala pilotkunder" för att gå
vidare. Läst välvilligt betyder det sälj först. Läst som en utvecklingsplan betyder det bygg
först. Formuleringen bör göras entydig, och svaret bör vara att ingen av modulerna byggs innan
en namngiven kund har efterfrågat den skriftligt. Utkastets egna omprövningsvillkor säger
faktiskt detta för flera av förslagen. Rekommendationssektionen motsäger dem.

### 5.3 Kapacitetstaket ignoreras

`KOSTNADSKALKYL-OCH-PRISSATTNING.md` visar att den bindande resursen inte är pengar utan din
tid: break-even vid heltidslön ligger på omkring 16 kunder, vilket är i övre delen av vad en
person klarar av att supporta. Arton nya funktioner ändrar inte det taket. De sänker det, genom
att varje modul tillför supportyta, dokumentation och regulatoriskt underhåll. En modul som
berör delegering måste följa föreskriftsändringar för alltid.

### 5.4 GMP och livsmedel är inte "minst ombyggnad"

Utkastet rangordnar andra branscher efter "låg regulatorisk friktion + hög intäktspotential +
minst ombyggnad" och placerar GMP på tredje plats med kommentaren att det "kräver validerings-
och spårbarhetsmognad".

Det underskattar arbetet kraftigt. GMP-miljöer kräver validering av datoriserade system, alltså
installations-, funktions- och prestandakvalificering med dokumentation, samt elektroniska
signaturer och oföränderliga spårloggar av det slag 21 CFR Part 11 och EU GMP Annex 11 beskriver.
Det är inte en modul, det är ett kvalitetssystem runt hela produkten, och kunden kommer att
kräva leverantörsrevision. **[uppskattning: månader av arbete, inte veckor]**

Livsmedel är enklare men har ett annat problem: temperaturloggning och kritiska styrpunkter
förutsätter mätvärden över tid, ofta från givare. Det är en annan datamodell än rutiner och
kvitteringar.

### 5.5 Andra branscher kastar bort det som skyddar affären

`MARKNADSANALYS.md` avsnitt 5 D är tydlig: skyddsvallen mot Eolas, MicroGuide och andra
utländska aktörer är den svenska regulatoriska tröskeln. I livsmedel och fastighetsdrift finns
ingen sådan tröskel, och där möter ni i stället etablerade nischsystem med tio års försprång.

Det finns ett scenario där andra branscher är rätt, och det är om vårdspåret visar sig sälja för
långsamt. Men då är det en pivot, inte ett parallellt spår, och det bör beskrivas som en pivot
med ett tydligt utlösande villkor.

---

## 6. Konkurrensanalys

### 6.1 Vad utkastet har rätt om

Kartläggningen av svenska system är bättre än den i `MARKNADSANALYS.md` och tillför flera namn
som saknades: Sekoia, Joliv, Alfa eCare, Combine, Lifecare, MedControl PRO, IA-systemet,
DF Respons, Aiai och Add Systems. Observationen att de tunga ledningssystemen är byggda för
administratörer och inte för golvpersonal stämmer och är den rätta positioneringen.

### 6.2 Den direkta konkurrenten till förslag 1 finns redan och nämns i förbigående

**delegering.se gör exakt det förslag 1 föreslår.** Kontrollerat 2026-08-30: tjänsten erbjuder
kunskapstester, scenariobaserade övningar, översikt över vem som delegerat till vem och när,
bedömningsstöd för reell kompetens, automatiska påminnelser inför utgångsdatum och loggade
delegeringar per person. Målgruppen anges uttryckligen som vårdpersonal, chefer och
MAS-funktioner.

Utkastet nämner tjänsten i en bisats som "en modern nischspelare" och föreslår ändå
delegeringsregistret som högst prioriterade nybygge. Det är motsägelsefullt. En specialist som
redan har produkten byggd, kundrelationer och innehåll kommer att vinna en funktionsjämförelse.

Det starkare draget är integration eller avgränsning: Synappsen kopplar delegeringen till
**rutinen och kompetensmatrisen**, alltså till frågan om personen som fått delegering också har
läst och kvitterat rutinen som hör till uppgiften. Det är en koppling en fristående
delegeringstjänst inte kan göra, och den ligger i produktens befintliga kärna.

### 6.3 De internationella analogerna saknas helt

Utkastet nämner inte **Eolas Medical** eller **MicroGuide**, trots att `MARKNADSANALYS.md`
avsnitt 5 D identifierar Eolas som den närmaste analogen som finns och som prisgolv. Eolas är en
kunskapshub för sjukhusavdelningar med egen innehållshantering, team spaces och en publik
prislista på 1 pund per användare och månad, vilket omräknat är omkring 154 kr per användare och
år. Synappsens Kärna ligger på 520 kr per användare och år.

Det är inte ett akut hot, eftersom ingen av dem finns i Sverige med svenskt PUB-avtal och svensk
datalagring. Men ett idédokument om framtida produktriktning som utelämnar den närmaste
internationella analogen missar den enda konkurrent som skulle kunna komma in i marknaden ovanifrån.

### 6.4 Add Systems är underanalyserad

Utkastet kallar Add Systems "trolig direktkonkurrent" med admin-DNA och lämnar det där. Det är
den enda aktören i listan som beskriver sig som ett mobilt kvalitetsledningssystem för personal
som inte sitter framför datorn, vilket är Synappsens exakta positionering. Den förtjänar en egen
genomgång: prismodell, vilka branscher de faktiskt säljer till, och om de har vårdreferenser.

### 6.5 Verksamhetssystemen är en kanalrisk, inte bara en konkurrent

Sekoia, Lifecare, Combine och Alfa eCare är system kommuner redan har upphandlat. Om någon av
dem lägger till en enkel rutinbank blir Synappsen ett tillägg kunden inte behöver köpa separat.
Det är samma risk som `MARKNADSANALYS.md` risk 10 beskriver för Centuri, men närmare i tid för
det kommunala segmentet utkastet vill in i.

---

## 7. Förslagen, en och en

Bedömningen utgår från tre frågor: tippar det över en regulatorisk gräns, konkurrerar det med
någon som redan gjort jobbet, och kräver det arbete före första kunden.

| # | Förslag | Bedömning |
|---|---|---|
| 1 | Delegeringsregister | **Omformulera.** delegering.se gör detta redan. Bygg kopplingen delegering till rutin och kvittering i stället, det är den del ingen annan kan. Premissen om ett utbildningsvakuum håller inte. |
| 2 | Egenkontroll och internrevision | **Avvakta.** Rimligt, låg risk, men det är precis vad Stratsys och CANEA säljer. Bygg först när en kund ber om det skriftligt. |
| 3 | Avvikelse och lex Maria (light) | **Avråd i föreslagen form.** Går inte att bygga utan patientuppgifter. Se avsnitt 3.7. Om det ändå ska byggas krävs ny DPIA, omskrivet PUB-avtal och juristgranskning. |
| 4 | IVO-redo exportpaket | **Bygg när den första tillsynsfrågan kommer.** Låg risk, hög upplevd nytta, bygger på befintlig export. Ett av de bättre förslagen. |
| 5 | Reservrutin och kontinuitetsläge | **Bygg tidigt.** Lägst risk och högst värde i hela listan. Bygger på befintligt offline-center, säljer mot NIS2-leverantörskedjekrav, och kräver ingen ny datatyp. |
| 6 | Krigsplacering och beredskap | **Avvakta.** Smalt, och kräver en kund med beredskapsuppdrag. |
| 7 | Språkstöd och lättläst | **Bygg tidigt.** Utkastet har rätt: låg risk, stort värde, stärker tillgänglighetsredogörelsen och träffar en verklig andel av personalen i omsorgen. |
| 8 | Kompetensgap per pass | **Avvakta.** Risk att glida in i schemaläggning, där Medvind och Quinyx är etablerade. Håll som läsvy om det byggs. |
| 9 | AI-förslag på sökord | **Bygg efter mätning.** Utkastets eget villkor är rätt: mät nollträffar först. Regulatoriskt oproblematiskt eftersom det påverkar sökningen, inte innehållet. |
| 10 | AI-sammanfattning av diff | **Bygg, med märkning.** Sammanfattar organisationens egen text, ingen extern medicinsk källa, ingen patientdata. Den säkraste AI-funktionen i hela listan. |
| 11 | HACCP-läge | **Avråd nu.** Se 5.4 och 5.5. |
| 12 | GMP och SOP-läge | **Avråd nu.** Kräver systemvalidering och leverantörsrevision. Inte en modul. |
| 13 | Rondering och skyddsrond | **Avvakta.** Tekniskt nära befintlig checklista, men öppnar en bransch utan vallgrav. |
| 14 | NIS2-incidentflöde | **Avvakta.** Kunden rapporterar själv till MSB. Ni kan tillhandahålla underlaget, vilket redan är förslag 4. |
| 15 | Branschmallbibliotek | **Avvakta.** Följer respektive branschbeslut, inte tvärtom. |
| 16 | SSO och Entra ID | **Bygg mot första kund som kräver det.** Oförändrad bedömning från `MARKNADSANALYS.md`. |
| 17 | EU-datresidens | **Utred kostnaden nu, bygg senare.** Se nedan. |
| 18 | Utökad leverantörsvy | **Bygg när kundantalet motiverar det.** Byggd grund finns i Etapp 67. |

**Om förslag 17.** Utkastet placerar det i steg 3, tolv till 24 månader. Det är sannolikt rätt
för region och kommun, men frågan förtjänar en kostnadsuppskattning tidigare, eftersom svaret
kan visa sig vara billigt. Firestore och Storage körs redan i europe-west1, och Cloud Functions
likaså. Det som återstår är AI-behandlingen, där en migrering från det publika Gemini-API:et
till Vertex AI är den tekniska lösningen och redan noterad som öppen punkt i
`avtal/UNDERBITRADEN.md`. Är den migreringen en veckas arbete bör den göras innan en kunds
dataskyddsombud frågar, inte efter.

---

## 8. Vad jag skulle göra med utkastet

**Behåll det som idébank.** Strukturen med omprövningsvillkor är bra och bör inte ersättas av en
prioriterad backlogg.

**Stryk rekommendationssektionen och skriv om den.** Den är den svagaste delen: den bygger på ett
tidsfönster som stängt, den föreslår ett annat segment än det pågående säljarbetet, och den
motsäger flera av dokumentets egna omprövningsvillkor.

**Ersätt den med tre saker som kan göras utan en kund:**

1. Skriv ned det avsedda ändamålet för klinikstöd-sökningen och granska webbplatsens och appens
   formuleringar mot det. Kostar timmar, stänger den största regulatoriska risken.
2. Kontrollera AI-förordningens artikel 50-märkning i rutinvyn. Den står redan som bekräftad
   brist i `MARKNADSANALYS.md` risk 8 och har gällt sedan 2 augusti.
3. Uppskatta kostnaden för Vertex AI-migreringen.

**Och en sak som kräver en kund men inte kod:** fråga de tre mottagarna i det första utskicket
vad de skulle vilja ha härnäst. Arton funktionsförslag framtagna genom research är ett sämre
underlag än tre meningar från någon som faktiskt betalar.

---

## 9. Källor

**Verifierat under arbetet 2026-08-30:**

- [MDCG 2019-11 Rev.1, juni 2025](https://health.ec.europa.eu/document/download/b45335c5-1679-4c71-a91c-fc7a4d37f12b_en?filename=mdcg_2019_11_en.pdf) — citatet om NLP och simple search
- [MDCG 2025-6, FAQ om MDR och AI-förordningen](https://health.ec.europa.eu/latest-updates/mdcg-2025-6-faq-interplay-between-medical-devices-regulation-vitro-diagnostic-medical-devices-2025-06-19_en)
- [Kommissionens Borderline Manual v5](https://health.ec.europa.eu/document/download/71a87df8-5ca1-4555-b453-b65bdf8de909_en?filename=md_borderline_manual_en.pdf)
- [MDR artikel 2.12, avsett ändamål](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX%3A02017R0745-20250110)
- [C-329/16, dom 7 december 2017](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX%3A62016CJ0329)
- [Kommissionens FAQ om artikel 50](https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act)
- [Cybersäkerhetslag (2025:1506)](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/cybersakerhetslag-20251506_sfs-2025-1506/)
- [MSB/NCSC tidsplan för cybersäkerhetslagen](https://www.ncsc.se/sv/radgivning-och-stod/cybersakerhetslagen-nis2/tidsplan-for-inforandet-av-cybersakerhetslagen-i-sverige/)
- [Socialstyrelsen om delegering av läkemedelshantering](https://www.socialstyrelsen.se/kunskapsstod-och-regler/regler-och-riktlinjer/vem-far-gora-vad/lakemedel-delegera-lakemedelshantering/)
- [HSLF-FS 2025:5, upphävande av SOSFS 1997:14](https://www.socialstyrelsen.se/publikationer/hslf-fs-20255-socialstyrelsens-foreskrifter-om-upphavande-av-foreskrifterna-och-allmanna-raden-sosfs-199714-om-delegering-av-arbetsuppgifter-inom-halso--och-sjukvard-och-tandvard-2025-4-9531/)
- [Demenscentrum om stängningen av Jobba säkert med läkemedel](https://demenscentrum.se/nyheter/jobba-sakert-med-lakemedel-stangs-den-31-augusti)
- [SOU 2025:103, En ny produktansvarslag](https://www.regeringen.se/rattsliga-dokument/statens-offentliga-utredningar/2025/10/sou-2025103/)
- [delegering.se](https://delegering.se/) — funktionsjämförelse mot förslag 1

**Internt:** `MARKNADSANALYS.md`, `KOSTNADSKALKYL-OCH-PRISSATTNING.md`,
`KANDIDATLISTA-PRIVAT-VARD.md`, `VARUMARKE.md`, `avtal/PUB-AVTAL-MALL.md`,
`avtal/UNDERBITRADEN.md`, `TILLGANGLIGHETSREDOGORELSE.md`.

**Kvarstår att kontrollera:** Socialstyrelsens meddelandeblad "Föreskrifter om delegering
upphävs och ändras" (december 2025) för definitivt besked om vad som gäller för delegering av
andra uppgifter än läkemedel. Ettårsgränsen för delegeringsbeslut i föreskriftstexten efter
reformen. Läkemedelsverkets aktuella avgifter för registrering av medicinteknisk produkt, om
klass I någon gång skulle bli aktuellt.
