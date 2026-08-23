# Synappsen – marknadsanalys, värdering och prismodell

**Intern fullversion · 2026-08-17 · mot kodläge v5.117.0**

> **Dokumentets status:** internt beslutsunderlag. Innehåller bedömningar om bolagsform,
> bisyssla, jäv och produktens svagheter som **inte** ska lämna det interna materialet.
> En extern kortversion finns i `MARKNADSANALYS-EXTERN.md`.
>
> **Metodnot:** allt som är hämtat ur projektkunskapen är märkt med källfil. Allt som är
> hämtat externt är källbelagt i avsnitt 11. Allt som är min egen uppskattning är märkt
> **[uppskattning]**. Den disciplinen är medvetet lånad från `PITCH.md`s avsnitt "Ärlighet
> om vad som faktiskt är mätt" – en marknadsanalys som blandar mätt och gissat är värdelös
> som beslutsunderlag.

---

## 1. Sammanfattning

Synappsen är en tekniskt mogen, upphandlingsförberedd vertikal SaaS-produkt utan en enda
betalande kund. Den observationen styr hela analysen.

**Fyra slutsatser:**

1. **Produktens återanskaffningsvärde är 2,5–5 Mkr. Dess marknadsvärde idag är under 1 Mkr.**
   Hela skillnaden förklaras av att noll kunder betalar. Det är inte en teknisk brist – det
   är den enda bristen som betyder något.

2. **Den verkliga konkurrenten är inte ett annat system, det är SharePoint och pärmen.**
   De namngivna konkurrenterna (Centuri, CANEA, Stratsys, AM System) säljs centralt till
   regionen och är byggda för att *förvalta* styrande dokument. Synappsen är byggd för att
   *använda* dem mitt i ett pass. Det är en verklig, försvarbar positionsskillnad – men den
   måste säljas som en skillnad i användningssituation, inte i funktionslista.

3. **Rekommenderad prismodell: 39 000 / 59 000 / 89 000 kr per enhet och år**, tre nivåer,
   per enhet och inte per användare, med tillägg för källbevakning, extra användare och
   AI-pott. Modellen håller sig med bred marginal under direktupphandlingsgränsen (700 000 kr
   för 2026) och ligger 20–40 % under det närmaste svenska prisankaret (AM System).

4. **Den snabbaste vägen till intäkt går inte via en region.** Privata vårdgivare och
   kommunal vård/omsorg är inte LOU-bundna på samma sätt, kräver inte SSO, har ingen
   jävsproblematik och har lägre IT-mognad – alltså större relativ nytta. Projektets samlade
   material är nästan uteslutande orienterat mot region/akutmottagning. Det är sannolikt en
   felprioritering av kundsegment, inte av produkt.

---

## 2. Vad Synappsen faktiskt är

Sammanfattat ur `CLAUDE.md`, `MODULPLAN.md`, `PITCH.md` och `avtal/IT-FAKTABLAD.md`.

**Teknik.** Installerbar PWA (React 19, Vite, Fuse.js) på Firebase – Auth, Firestore, Storage,
Cloud Functions (samtliga i `europe-west1`), Hosting. Multi-tenant med organisationsisolering
enforcerad i Firestore-regler och bevisad med en egen testsvit. Sentry i EU-region.

**Paketstruktur** (`MODULPLAN.md`, feature-gating i tre lager: UI → klient → server):

| Paket | Innehåll i sammandrag |
|---|---|
| **Core** (obligatorisk) | Rutiner, sök + kommandopalett, anslag, förråd med hyllplats, kontakter, länkar, 7 roller, versionshistorik, läskvittering, godkännandeflöde, revisionslogg med hashkedja, papperskorg, checklistläge, kompetensmatris, introduktionsspår, akutläge, QR-koder, 2FA, PII-spärr i tre lager, bristanmälan |
| **Operations** | Offline-center, ägarpåminnelser, hälsohistorik, export/backup, kioskläge |
| **Intelligence** | AI-import (foto → utkast), klinikstöd-sökning mot domänbegränsade svenska källor, AI-analys |
| **Källbevakning** | Veckovis kontroll av externa referenser, larm vid ändring eller trasig länk |

**Det som skiljer produkten från ett dokumenthanteringssystem** – och som är den faktiska
värdekärnan:

- **Innehållshälsa.** En hälsosiffra per område som *alltid* visas med sin nedbrytning: vilka
  rutiner saknar ägare, är utgångna, aldrig kvitterade. Med åtgärdsknappar i samma vy.
  `ETAPPLAN6.md` formulerar problemet exakt rätt: *"en kunskapsbank som ruttnar inifrån ser
  precis likadan ut som en välskött – ända tills någon följer en inaktuell rutin i ett
  akutförlopp."* Ingen av de svenska konkurrenterna gör detta.
- **Effektmätning över tid.** Tid-att-hitta per sökning, andel nollträffar, kvitteringsgrad,
  veckovis snapshot, före/efter-markeringar, anonym personalpuls med minsta-n-spärr. Detta
  är underlaget för avtalsförlängning – och det är byggt.
- **PII-spärr i tre lager.** Klient, server och Firestore-regel. Det är produktens starkaste
  enskilda upphandlingsargument, eftersom det tillåter kunden att säga "systemet innehåller
  inte patientuppgifter" och styrka det tekniskt.
- **Upphandlingspaketet.** PUB-avtalsmall, underbiträdesförteckning, DPIA-underlag,
  IT-faktablad, incidentresponsplan, tillgänglighetsredogörelse. Färdigskrivna. Detta är
  månaders arbete som en konkurrent i samma storleksklass inte har gjort.

**Medvetna avgränsningar** (`PITCH.md`, `ETAPPLAN11.md`) – och de är kloka:

- Ingen dos- eller läkemedelsberäkning → undviker MDR-klassning
- Ingen journalsystemsintegration (Cosmic, Melior, TakeCare) → undviker patientdata och en
  helt annan riskklass
- Ingen chatt → undviker det enda ställe där ett personnummer garanterat hade skrivits in

---

## 3. Nulägets hårda fakta

Detta avsnitt är det som gör analysen ärlig i stället för säljande.

| Fakta | Källa | Konsekvens |
|---|---|---|
| **Noll betalande kunder, noll pilot, noll intäkt** | `PILOTUPPLAGG.md`, `OPPNA-PUNKTER.md` | Alla nyttosiffror är uppskattningar. Värderingen faller. |
| Produktion kör **v5.106.0**, kod ligger på **v5.117.0** | `SAKERHETSGRANSKNING-2026-08.md` | Patchade men odeployade sårbarheter. En patchad sårbarhet som inte deployats skyddar ingen. |
| **SSO/Entra ID är inte byggt** | `PITCH.md`, `ETAPPLAN11.md` §58 | Blockerar regionaffär oavsett hur bra resten är. |
| **Flera enheter under samma huvudman: inte byggt** (54c/54d) | `ETAPPLAN11.md` | Kan sälja till en avdelning, inte till ett sjukhus. Taket på affärsstorlek. |
| **WCAG nivå A-brister kvarstår** (SYN-6, punkt 4–6 och 8–11) | `TILLGANGLIGHETSREDOGORELSE.md` | I ett anbud är "brister på nivå A" betydligt värre än "brister på nivå AA". |
| **Tillgänglighetsredogörelsen är inte publicerad** | samma | En redogörelse som inte går att nå uppfyller inte kravet. |
| **AI-förordningens art. 50-märkning saknas i rutinvyn** | `JURIDISK-GRANSKNING.md` §7.4 | Kravet gäller sedan 2 aug 2026. Liten kodändring, brådskande. |
| **Ingen ansvarsförsäkring tecknad** | `JURIDISK-GRANSKNING.md` §17 | Produktansvar är strikt och kan inte avtalas bort. |
| **Bolagsform inte beslutad** | `JURIDISK-GRANSKNING.md` §3 | Vid enskild firma möter privatekonomin ett produktansvarskrav. |
| **Verklig molnkostnad per kund är okänd** | `ETAPPLAN10.md` §48c | Prismodellen sätts utan att kostnadssidan är mätt. |
| **Ingen extern säkerhets- eller penetrationstestning** | `ETAPPLAN5.md` §36c (beslut: nej för nu) | En regionupphandling kommer att fråga. |

### 3.1 Ett fynd som gjordes under arbetet med den här rapporten

Vid kontroll av rollmodellen mot flera källdokument uppstod en motsägelse:

| Dokument | Antal roller |
|---|---|
| `avtal/IT-FAKTABLAD.md` | **sju** (superadmin, VOL, sektionsledare, VEC, förrådsansvarig, personal, kiosk) |
| `MODULPLAN.md` / `ETAPPLAN11.md` | sju – kioskläget byggdes i Etapp 55, 2026-08-10 |
| `PITCH.md` (v5.114.0) | **"Rollstyrd behörighet (6 roller)"** |
| `SAKERHETSRAPPORT.md` | räknar upp **sex** – kiosk saknas |

Kioskläget är byggt och beskrivs utförligt i IT-faktabladet, men `PITCH.md` och
`SAKERHETSRAPPORT.md` har inte uppdaterats. Det är litet i sak, men det är **sjunde gången**
samma stale-dokument-mönster inträffar i projektet – ett mönster som redan gett upphov till
fyra av projektets underhållsregler och till versionsdriftstestet i `tests/docs/pitch-version.test.js`.
Versionsvakthunden fångar versionsnummer, inte sakinnehåll.

**Varför det spelar roll kommersiellt:** `PITCH.md` är det enda dokument en köpare faktiskt
läser, och `SAKERHETSRAPPORT.md` är det en IT-avdelning granskar. Ett säljdokument som
underrapporterar en byggd funktion kostar inget i förtroende – men det visar att samma
mekanism som en gång påstod att klinikstöd-sökningen var pausad (Etapp 57a) fortfarande är
aktiv. **Åtgärd: rätta båda, minuters arbete.**

**Det som däremot är genuint starkt och ovanligt för storleken:** organisationsisoleringen är
bevisad, inte påstådd (149+ regeltester, egna emulatortestsviter för rules, functions och
storage, körda i CI). Fyra fullständiga säkerhetsgenomgångar av all kod är dokumenterade. Den
juridiska genomlysningen är mer komplett än vad de flesta bolag i tioMkr-klassen har.

---

## 4. Marknaden

### 4.1 Storlek och struktur

| Segment | Antal enheter | Kommentar |
|---|---|---|
| Regioner | 21 | Köparen vid stor affär, men kräver annonserad upphandling |
| Sjukhusbundna akutmottagningar | ca 60–70 **[uppskattning]** | Produktens ursprungliga målgrupp. Mycket liten marknad i sig. |
| Vårdcentraler | **1 176**, varav **564 privata** (2025) | Störst enhetsvolym i primärvården |
| Kommuner | 290 | SÄBO, hemtjänst, LSS – startbibliotek finns redan för "kommunal hemtjänst" |
| Sjukhusavdelningar/mottagningar totalt | flera tusen **[uppskattning]** | Den egentliga adresserbara volymen |

**Ekonomisk kontext:** regionernas totala kostnader var ca **493 mdkr** (2025). IT-kostnaderna
utgjorde **3,6 %** av regionernas kostnader 2023, upp från ca 3,2 % året innan, med en
ökningstakt på ca 12 % under 2023. Det ger en grov IT-budget i storleksordningen 17–18 mdkr/år
**[uppskattning baserad på de två publicerade andelarna]** – men merparten är journalsystem,
infrastruktur och personal, inte inköpsbara verktyg av Synappsens typ.

**Efterfrågedrivaren är dokumenterad, inte påhittad.** En tidsstudie vid elva vårdcentraler i
sydöstra Sverige visade att personalen ägnar **43 % av arbetstiden åt direkt patientarbete** –
resten går till administration och annat, och studien visade att personalen själv
*underskattade* administrationens omfattning. Det är exakt den känsla Synappsens pitch
adresserar. Notera dock: studien mäter administration brett, inte "tid att leta rutiner".
Att använda den som direkt stöd för en tidsbesparingssiffra vore precis den typ av
överdrift `PITCH.md` medvetet undviker och marknadsföringslagen kräver att man kan styrka.

### 4.2 TAM / SAM / SOM **[uppskattning genomgående]**

Alla siffror baseras på den föreslagna prismodellen i avsnitt 7 (genomsnittligt 55 000 kr per
enhet och år).

| | Definition | Enheter | Årsvärde |
|---|---|---|---|
| **TAM** | Alla svenska vårdenheter som skulle kunna ha nytta av en lokal rutindatabas | 8 000–12 000 | **440–660 Mkr** |
| **SAM** | Enheter som kan köpa *idag*, dvs. med egen budget, utan SSO-krav och utan flerenhetsbehov | 1 500–2 500 | **80–140 Mkr** |
| **SOM (3 år)** | Vad en ensam grundare eller ett litet bolag realistiskt kan nå och leverera till | 10–40 kunder | **0,5–2,2 Mkr ARR** |

TAM-siffran är intressant bara som takhöjd. **SOM är det tal som styr varje beslut i den här
rapporten.** En enskild näringsidkare med ett fulltidsjobb bredvid kan realistiskt onboarda
och supporta i storleksordningen 10–20 kunder utan att kvaliteten faller – och
`avtal/INCIDENTRESPONSPLAN.md` redovisar redan öppet att bemanningen är en person.

---

## 5. Konkurrensläget

Konkurrenterna faller i fyra kategorier som kräver fyra olika svar.

### A. Ledningssystem och dokumenthanteringssystem – den namngivna konkurrensen

| System | Position | Publikt pris |
|---|---|---|
| **Centuri** | 140 kunder, 160 000+ användare i Norden. Uttalat stark i vård. Svensk drift. Används av bl.a. Region Västmanland som regionens ledningssystem. | **från 5 kr/anv/mån** (listpris) |
| **CANEA ONE** | Har vård och omsorg som egen branschvertikal. Kombinerar kvalitet, miljö, arbetsmiljö och verksamhet. | Ej publikt |
| **Stratsys** | Etablerad hos regioner för verksamhetsstyrning, med en egen modul för kvalitets- och patientsäkerhetsarbete. | Ej publikt |
| **AM System** | Molntjänst för kvalitetsledning. **Publik prislista** – det bästa prisankaret som finns. | **4 900 kr/mån / 25 anv**, **7 900 / 100 anv**, **19 900 / 1 000 anv** |
| Add, PreWoe, EcoTech, Zimplicit, RamBase, Datakvalitet | Generella QMS, ingen vårdvertikal | Varierande |

**Hur Synappsen står sig.** Ärligt: dessa system är *bättre* än Synappsen på klassisk
dokumentstyrning i stor skala – processkartläggning, ISO-koppling, avvikelsehantering,
koncernstruktur, integrationer. De är också djupt etablerade och köps centralt av regionen.

Men de är byggda för en annan användningssituation. De besvarar frågan *"var finns den
godkända versionen av det styrande dokumentet?"*. Synappsen besvarar frågan *"vilket skåp
ligger CVK-setet i, och gäller den här rutinen fortfarande?"* – på en mobil, med handskar,
mitt i ett pass, offline om nätet är dåligt. Ingen av dem har innehållshälsa, tid-att-hitta,
förrådsplatser, checklistläge, akutläge eller läskvittering med påminnelse till just de som
inte läst.

**Prisproblemet med Centuri.** 5 kr/anv/mån är 60 kr per användare och år. En avdelning med
80 personer skulle på det priset kosta 4 800 kr/år. Det är en tiondel av Synappsens
föreslagna pris. Detta *kommer* att komma upp i en förhandling.

**Svaret på invändningen är inte att sänka priset.** Det är tre saker:

1. Det är ett "från"-pris för stora volymer. En enskild avdelning kan i praktiken inte köpa
   Centuri – det är ett regionalt systembeslut med central införandekostnad, förvaltning och
   projekttid som inte syns i licenspriset.
2. Regionens Centuri-installation *innehåller inte* avdelningens praktiska kunskap. Den
   innehåller de styrande dokumenten. Skillnaden är hela produkten.
3. Om regionen redan har Centuri är Synappsen ett komplement, inte en ersättare – och ska
   säljas som det. Att försöka ersätta ett regionalt ledningssystem är en förlorad affär
   innan den börjat.

### B. Nationella kunskapsstöd – gratis, och inte egentligen konkurrenter

- **Vårdhandboken** (Inera): ca 120 ämnen, kvalitetssäkrade nationella metoder och riktlinjer,
  öppen för alla utan inloggning. Täcker **nationell nivå, inte lokala rutiner.**
- **Nationellt kliniskt kunskapsstöd / 1177 för vårdpersonal** (Inera/SKR)
- FASS, Läkemedelsverket, Internetmedicin

Dessa är inte konkurrenter – Synappsens klinikstöd-sökning *använder* dem som godkänd
källista. Det är ett säljargument, inte ett hot: produkten är komplementär till den
nationella infrastrukturen och konkurrerar inte med den.

**Men de är en inköpsinvändning.** "Vi har ju redan Vårdhandboken" kommer att sägas. Svaret:
Vårdhandboken vet inte vilket skåp ni förvarar era saker i, vem hos er som ansvarar för en
rutin, eller att den inte lästs av nattpersonalen.

**Bevakningspunkt:** om 1177 för vårdpersonal börjar erbjuda lokal anpassning per verksamhet
förändras konkurrensbilden materiellt. Bevaka Ineras tjänsteutveckling.

### C. Status quo – den verkliga konkurrenten

SharePoint, Teams, delade mappar, intranät, pärmar, whiteboard, muntlig överlämning.

Marginalkostnaden är noll, eftersom M365 redan är betald. **Detta är den svåraste
invändningen i hela affären** och den som avgör om produkten säljs. Den kan inte vinnas på
funktionsjämförelse; den vinns bara på en mätbar upplevelse hos en referenskund. Vilket är
ännu ett argument för att piloten är den enskilt viktigaste öppna punkten i hela projektet
– precis som `ETAPPLAN10.md` själv skriver om Etapp 52.

### D. Internationella analoger – närmast produkten, och prisankaret

- **Eolas Medical** (UK/IE) – den närmaste analogen som finns. Kunskapshub för
  sjukhusavdelningar, egen innehållshantering, team spaces, CPD.
  **Pris: gratis för individ; £2 500/år för team upp till 250 medlemmar; gratis upp till
  50 användare i standardplanen, därefter $10/medlem/år; custom för institutioner.
  Flerårsrabatt 10 % (2 år) upp till 30 % (5 år). Tre månaders fri provperiod.**
- **MicroGuide / Induction Healthcare** (UK) – riktlinjeapp med stark ställning i NHS,
  särskilt inom antibiotikastyrning. Induction förvärvade Podmedics för 16 MUSD 2020.
- **PolicyStat, Lucidoc, MCN Healthcare** (US), **Radar Healthcare**, **Perfect Ward** (UK).

**Vad detta betyder.** Ingen av dem finns i Sverige med svenskt PUB-avtal, svensk
datalagring, svenska godkända källor, svensk personnummerspärr eller svensk
tillgänglighetsredogörelse. Det är Synappsens verkliga skyddsvall – och den är starkare än
någon funktion i produkten.

**Men Eolas prissättning sätter ett tak.** £2 500/år för 250 användare är ca 33 000 kr –
under Synappsens föreslagna ingångspris. Om Eolas eller MicroGuide skulle etablera sig i
Norden med svensk lokalisering är det ett reellt hot mot prisnivån. Sannolikheten bedöms
som låg på 2–3 års sikt **[uppskattning]**: den svenska regulatoriska tröskeln (PUB-avtal,
DOS-lagen, patientdatalagen, upphandlingskrav) är just den kostnad som gör marknaden
oattraktiv för en utländsk aktör med 10 miljoner engelsktalande kliniker att sälja till först.

---

## 6. Vad produkten är värd

Tre värderingsansatser, med olika svar. Alla tre behövs.

### 6.1 Återanskaffningsvärde – vad det skulle kosta att bygga om

Underlaget: 67 etapper, 40+ dokumenterade utvecklingsfaser, ca 28 000 rader produktionskod
(`SAKERHETSGRANSKNING-2026-08.md`s egen radräkning över de fyra delarna), ca 240 vitest-tester
plus separata emulatortestsviter för Firestore-regler, Cloud Functions och Storage, samt ett
komplett avtals- och upphandlingspaket.

En konsultbyrå med vårdvertikal skulle behöva 3 000–5 000 timmar för motsvarande omfattning
inklusive testtäckning, juridiskt underlag och tillgänglighetsarbete, till 1 000–1 400 kr/tim.

> **Återanskaffningsvärde: 3–7 Mkr. Konservativt spann: 2,5–5 Mkr.** **[uppskattning]**

Det är ett verkligt värde – men bara för en köpare som *behöver just detta* och annars hade
byggt det själv.

### 6.2 Marknadsvärde – vad någon skulle betala idag

Privata SaaS-bolag i lower middle market handlas 2026 på **3–7× ARR, median ca 4,5×**. Under
1 MUSD ARR tillämpas i praktiken inte omsättningsmultiplar alls – bolag i det spannet
värderas på ägarens resultatuttag, "as a job rather than an asset". Tillväxt är den enskilt
starkaste multipeldrivaren: 40 % tillväxt ger ungefär dubbelt så hög multipel som 10 %.

Synappsens ARR är **noll**. Kundantalet är **noll**. Det finns ingen retention att mäta.

> **Marknadsvärde idag: 0,5–1,5 Mkr**, och då som ett teknik-/acqui-hire-köp där köparen
> betalar för kodbasen, avtalspaketet och tidsvinsten – inte för en affär. **[uppskattning]**

### 6.3 Optionsvärdet – och detta är den viktiga siffran

Gapet mellan 6.1 och 6.2 stängs nästan uteslutande av kundbevis. Modellerat mot
multipelspannen ovan:

| Läge | ARR | Indikativ värdering **[uppskattning]** |
|---|---|---|
| Idag: 0 kunder | 0 kr | 0,5–1,5 Mkr |
| 1 referenskund med mätdata | ca 40 000 kr | 1–2 Mkr (bevis väger tyngre än ARR i det här läget) |
| 3 betalande kunder | ca 165 000 kr | 1,5–3 Mkr |
| 10 kunder | ca 550 000 kr | 2,5–5 Mkr |
| 25 kunder + SSO + flerenhet | ca 1,4 Mkr | 4–8 Mkr |

> **Viktig reservation om multiplarna.** Samtliga scenarier ovan ligger under den nivå där
> ARR-multiplar egentligen tillämpas – gränsen går vid ungefär 1 MUSD ARR, dvs. omkring
> 9–10 Mkr. Under den nivån värderas bolag i praktiken på ägarens resultatuttag, inte på
> omsättningsmultipel. Siffrorna ovan är därför inte multipelvärderingar utan en blandning av
> återanskaffningsvärdet i 6.1 och det strategiska värdet för en köpare som specifikt behöver
> en svensk vårdvertikal med färdigt upphandlingspaket. De ska läsas som riktning, inte som
> pris.

**Slutsats:** varje krona och timme som läggs på ytterligare funktioner före den första
kunden har negativt förväntat värde. Varje timme som läggs på att få en pilot bokad har
extremt högt förväntat värde. Projektets egen dokumentation har redan dragit exakt den
slutsatsen två gånger (`ETAPPLAN10.md`: *"Om bara en etapp hinns med: 52"*) utan att den
följts.

---

## 7. Föreslagen prismodell

### 7.1 Principerna

Bygger vidare på `MODULPLAN.md`s befintliga struktur, som är rätt. Fyra bärande principer:

1. **Per enhet och år – aldrig per användare.** Tre skäl. (a) Ett avdelningsgemensamt verktyg
   ska inte straffa kunden för att fler i personalen använder det – det motverkar hela nyttan.
   (b) Kunden får en budgeterbar, förutsägbar post. (c) **Momsargumentet**: SaaS till vårdgivare
   är momspliktigt med 25 %, medan kundens egen vårdverksamhet är momsbefriad och avdragsrätten
   därför starkt begränsad. Kundens effektiva kostnad är listpris × 1,25. Ett rörligt
   användarpris gör den effekten oförutsägbar (`JURIDISK-GRANSKNING.md` §3).
2. **Aldrig "obegränsad AI" till fast pris.** Den globala och per-användarbaserade
   AI-budgeten finns redan i produkten – prismodellen ska spegla den, inte motsäga den.
3. **Under direktupphandlingsgränsen med bred marginal.** Den ligger på **700 000 kr** för
   2026 och höjdes inte trots att tröskelvärdena justerades. Notera att gränsen avser
   myndighetens *samlade* inköp av samma slag under räkenskapsåret, inte per avdelning –
   en avdelningschef kan inte ensam avgöra att den håller.
4. **Priset ska gå att försvara per anställd.** 39 000 kr för en enhet med 80 anställda är
   490 kr per anställd och år, ca 40 kr i månaden. Det är mindre än en timmes lönekostnad
   per anställd och år. Den jämförelsen ska finnas i varje offert.

### 7.2 Nivåerna

| | **Kärna** | **Drift** | **Full** |
|---|---|---|---|
| **Pris per enhet och år** | **39 000 kr** | **59 000 kr** | **89 000 kr** |
| Ingår, antal användare | 75 | 150 | 150 |
| Core-funktionalitet | ✅ | ✅ | ✅ |
| Operations (offline-center, ägarpåminnelser, hälsohistorik, export/backup, kiosk) | – | ✅ | ✅ |
| Innehållshälsa, granskningsrundor, ledningsrapport, effektmätning över tid, personalpuls | – | ✅ | ✅ |
| Intelligence (AI-import, klinikstöd-sökning, AI-analys) | – | – | ✅ |
| AI-pott ingår | – | – | 500 kr/mån faktisk förbrukning |
| Startbibliotek, e-postinbjudningar, revisionslogg, PII-spärr, 2FA | ✅ | ✅ | ✅ |
| Upphandlingspaket (PUB-avtal, DPIA-underlag, IT-faktablad, underbiträdesförteckning) | ✅ | ✅ | ✅ |

*Kärnan är avsiktligt ett komplett pilotpaket i sig – `MODULPLAN.md` konstaterar korrekt att
Core "kräver ingen AI-diskussion för att sälja". Det är en styrka: den svåraste
inköpsinvändningen (AI i vården) kan skjutas till år två.*

### 7.3 Tillägg

| Tillägg | Pris |
|---|---|
| Källbevakning | 6 000 kr/år |
| Extra användare utöver taket | 350 kr/användare/år |
| Extra AI-pott | 3 000 kr per steg om 500 kr/mån faktisk förbrukning |
| Uppstart: konfiguration, innehållsimport, redaktörsutbildning | 25 000 kr engångs |
| SSO / Microsoft Entra ID | Ingår i Drift och Full **när det byggts**. Första kunden som kräver det får det utan extra kostnad mot referensåtagande. |

**Volym under samma huvudman:** enhet 2 −25 %, enhet 3–5 −35 %, från enhet 6 offert.
*Förutsätter att 54c/54d byggs – sälj det inte innan.*

**Flerårsavtal:** 2 år −8 %, 3 år −15 %. Medvetet mer konservativt än Eolas 10/20/25/30-modell,
eftersom en ensam leverantör inte bör låsa pris över lång tid utan indexklausul – och en
indexklausul är enligt `JURIDISK-GRANSKNING.md` §14 obligatorisk i ett flerårigt offentligt
avtal.

**Referenskundspris (kund 1–3):** 50 % rabatt år 1 mot ett dokumenterat, i revisionsloggen
loggat medgivande att användas som namngiven referens och att anonymiserat referensunderlag
får publiceras. Exportfunktionen för detta finns byggd (39d). **Ta inte en gratis kund –
en kund som betalar något, om än lite, är en kund. En som inte betalar är en testanvändare.**

### 7.4 Pilotprissättning – och den juridiska fällan

`JURIDISK-GRANSKNING.md` §13.1 pekar ut en fälla som är lätt att gå i:

- En **betald** pilot kan formellt vara ett upphandlingspliktigt inköp.
- En **kostnadsfri** pilot är enklare upphandlingsrättsligt, men skapar en annan risk: att
  leverantören senare anses ha deltagit i förberedelserna av upphandlingen och därmed haft
  en konkurrensfördel – i värsta fall uteslutning.

**Rekommendation:** kostnadsfri pilot om 6 veckor, med ett skriftligt dokument undertecknat
*före* start som slår fast att piloten är kostnadsfri och tidsbegränsad, att den inte ger
någon förtur i en framtida upphandling, och att **leverantören inte deltar i utformningen av
eventuellt framtida upphandlingsunderlag**. Den tredje punkten är den som annars
diskvalificerar hela affären senare, och den bryts lättast av välvilja – genom att skicka
över "ett förslag på kravspecifikation".

`PILOTUPPLAGG.md` är redan skriven och körbar. Den saknar bara datum, namn och detta
juridiska försättsblad.

### 7.5 Prisjämförelse mot marknaden

| Referens | Årskostnad | Per användare/år |
|---|---|---|
| Centuri (listpris "från") | 4 800 kr @ 80 anv | 60 kr |
| Eolas Healthcare Teams | ca 33 000 kr @ ≤250 anv | ca 130 kr |
| **Synappsen Kärna** | **39 000 kr @ 75 anv** | **520 kr** |
| AM System Standard | 58 800 kr @ 25 anv | 2 352 kr |
| **Synappsen Drift** | **59 000 kr @ 150 anv** | **393 kr** |
| **Synappsen Full** | **89 000 kr @ 150 anv** | **593 kr** |
| AM System Premium | 94 800 kr @ 100 anv | 948 kr |
| AM System Enterprise | 238 800 kr @ 1 000 anv | 239 kr |

Synappsen hamnar mellan de billiga generiska volymsystemen och de dyra QMS-plattformarna –
vilket är rätt läge för en vertikal produkt. Mot AM System, det enda direkt jämförbara
publika svenska priset, är Drift **38 % billigare per år** och **59 % billigare per användare**
än Premium.

### 7.6 Marginalen – den enda siffra som inte går att räkna ut

`ETAPPLAN10.md` §48c är tydlig: verklig molnkostnad per organisation kräver att GCP:s
faktureringsexport till BigQuery aktiveras, vilket bara ägaren kan göra i konsolen. Fältet
`avtaladArsavgiftKr` finns byggt, men kostnadssidan saknas.

**Uppskattning i väntan på mätning:** Firebase-kostnaden för en avdelning med 80 användare och
normal användning bör ligga i storleksordningen några hundra kronor per månad, och AI-kostnaden
är redan hårt budgetstyrd. Bruttomarginalen bör landa på 85 %+. **Men detta är en gissning,
och prismodellen ovan är satt utan att kostnadssidan är känd.**

> **Åtgärd med hög prioritet och låg insats: aktivera faktureringsexporten nu.** Den kostar
> tio minuter och gör att prismodellen kan valideras redan efter första kunden, i stället för
> efter tredje. Beslutet är enligt `BESLUTSLOGG.md` redan fattat 2026-08-15 – genomför det.

---

## 8. Go-to-market: segmenten i fel ordning idag

Projektets samlade material – `PITCH.md`, `MODULPLAN.md`, samtliga etapplaner – är orienterat
mot region och akutmottagning. Det är produktens ursprung, men det är sannolikt **fel första
segment.**

| Segment | Antal | Beslutsväg | Blockerare | Bedömning |
|---|---|---|---|---|
| **Privat vårdgivare** (vårdcentral, specialistklinik, privat äldreomsorg) | 564 privata vårdcentraler + koncerner | Ägaren/VD beslutar | Inga | **★ Starkast. Ingen LOU, ingen jävsrisk, inget SSO-krav, snabbt beslut, betalar för faktiskt värde.** |
| **Kommunal vård och omsorg** | 290 kommuner, SÄBO/hemtjänst | Verksamhetschef, direktupphandling | Låg IT-budget | **★ Näst starkast. Lägre IT-mognad = större relativ nytta. Startbibliotek för "kommunal hemtjänst" finns redan byggt.** |
| **Enskild avdelning i region** | flera tusen | Direktupphandling under 700 000 kr | Jäv/bisyssla om egen arbetsgivare | Möjlig, men den juridiska ytan är störst här |
| **Region centralt** | 21 | Annonserad upphandling | **SSO, WCAG nivå A, flerenhetsmodell, extern säkerhetsgranskning** | Sist. Inte förrän tre blockerare är stängda och det finns referenser. |

**Den obekväma slutsatsen:** akutmottagningen är produktens hemvist och ursprung, men marknaden
är 60–70 enheter stora, samtliga inne i regioner med LOU, SSO-krav och en jävsproblematik som
uppstår om leverantören är anställd hos köparen. Privat vård och kommunal omsorg är tio till
tjugo gånger fler enheter, med enklare beslutsvägar och utan de blockerare som faktiskt finns.

Produkten behöver **inte** byggas om för det. Startbiblioteket stödjer redan vårdcentral och
kommunal hemtjänst som verksamhetstyper. Det som behöver skrivas om är `PITCH.md`s exempel
och tonläge – det är dagars arbete, inte etappers.

---

## 9. Risker som påverkar värde och pris

| # | Risk | Sannolikhet | Påverkan | Åtgärd |
|---|---|---|---|---|
| 1 | **Ingen kund inom 12 månader** | Medel–hög | **Mycket hög** | Boka piloten. Byt till privat/kommunalt segment. Detta är den enda risken som verkligen betyder något. |
| 2 | Produktansvar: strikt ansvar, kan inte avtalas bort | Låg | **Mycket hög** | Ansvarsförsäkring med produktansvarsmoment **före första skarpa användning**. Kontrollera att programvara omfattas och vårdverksamhet inte är undantagen. |
| 3 | Enskild firma möter anspråket med privatekonomin | Låg | **Mycket hög** | Aktiebolag före första betalande kund (`JURIDISK-GRANSKNING.md` §17 A3) |
| 4 | Leverantören blir varaktigt oförmögen (sjukdom, dödsfall) | Låg | Mycket hög för kunden | Källkodsdeposition + dokumenterad exitväg + avtalsklausul. Detta är den fråga varje kunds jurist ställer först om en ensam leverantör. |
| 5 | Odeployade säkerhetspatchar | Hög (pågår nu) | Medel | Deploya v5.117.0. En patchad men odeployad sårbarhet skyddar ingen. |
| 6 | LOU: otillåten direktupphandling eller diskvalificering efter pilot | Medel | Hög | Skriftligt pilotupplägg enligt 7.4 |
| 7 | Bisyssla/jäv vid försäljning till egen arbetsgivare | Medel | Hög | Skriftligt godkännande finns sedan 2026-08-11. Anmäl på nytt vid bolagisering. |
| 8 | AI-förordningen art. 50: märkning saknas | **Bekräftad brist** | Medel | Villkorad märkning i rutinvyn där `kalla === "gemini"`. Minuters arbete. |
| 9 | WCAG nivå A blockerar i anbud | Medel | Medel | Stäng SYN-6, publicera redogörelsen på `/tillganglighet` |
| 10 | Centuri/Stratsys bygger en mobilnära avdelningsvy | Låg–medel | Hög | Differentieringen är innehållshälsa + mätning + akutläge, inte mobilanpassning i sig. Bevaka. |
| 11 | Eolas/MicroGuide etablerar sig i Norden | Låg | Hög | Den svenska regulatoriska tröskeln är skyddet. Bevaka. |
| 12 | Marginalen är okänd | **Bekräftad** | Medel | Aktivera GCP-faktureringsexporten |

---

## 10. Rekommendationer i prioritetsordning

**Denna månad – kostar dagar, inte etapper:**

1. **Deploya v5.117.0.** Säkerhetsgranskningens patchar ligger odeployade.
2. **Lägg till AI-märkningen i rutinvyn** (art. 50). Kravet gäller sedan 2 augusti 2026.
3. **Aktivera GCP:s faktureringsexport.** Utan den går prismodellen inte att validera.
4. **Skriv om `PITCH.md`s exempel** för vårdcentral och kommunal omsorg vid sidan av
   akutmottagning. Behåll den ärliga tonen – den är produktens starkaste retoriska tillgång.
5. **Skriv det juridiska försättsbladet till `PILOTUPPLAGG.md`** enligt 7.4.

**Före första betalande kund:**

6. **Bilda aktiebolag.** Produktansvaret ensamt motiverar det.
7. **Teckna ansvarsförsäkring med produktansvarsmoment.**
8. **Låt jurist granska PUB-avtal och huvudavtal** – tystnadsplikt, upphörandeklausul,
   ansvarsbegränsning, exit, indexklausul.
9. **Boka piloten.** Hos en privat vårdcentral eller ett kommunalt SÄBO, inte hos en
   regiondriven akutmottagning – enklast beslutsväg, ingen jävsrisk.

**Före regionkund (inte tidigare, det vore spekulativt bygge):**

10. Bygg SSO/OIDC (Etapp 58) – protokollbeslutet är fattat
11. Stäng WCAG nivå A (SYN-6) och publicera tillgänglighetsredogörelsen
12. Bygg flerenhetsmodellen (54c/54d) mot en verklig kund med flera enheter
13. Extern säkerhetsgranskning / penetrationstest

**Sluta göra:**

14. **Bygg inga nya funktioner före första kunden.** Sjutton etapplaner och 67 etapper är
    byggda utan en enda användare utanför projektet. Marginalnyttan av etapp 68 är nära noll;
    marginalnyttan av kund 1 är hela värderingsgapet i avsnitt 6.

---

## 11. Källor

**Projektkunskap:** `CLAUDE.md`, `PITCH.md` (v5.114.0), `MODULPLAN.md`, `PILOTUPPLAGG.md`,
`JURIDISK-GRANSKNING.md`, `SAKERHETSGRANSKNING-2026-08.md`, `SAKERHETSRAPPORT.md`,
`TILLGANGLIGHETSREDOGORELSE.md`, `OPPNA-PUNKTER.md`, `ETAPPLAN.md`, `ETAPPLAN2.md`,
`ETAPPLAN5.md`, `ETAPPLAN6.md`, `ETAPPLAN10.md`, `ETAPPLAN11.md`, `ETAPPLAN16.md`,
`avtal/PUB-AVTAL-MALL.md`, `avtal/IT-FAKTABLAD.md`, `avtal/UNDERBITRADEN.md`,
`avtal/INCIDENTRESPONSPLAN.md`.

**Externa källor:**

- [Tröskelvärden 2026 – belopp för LOU, LUF och LUK (Tilldelat)](https://tilldelat.se/kunskap/troskelvarden) – direktupphandlingsgräns 700 000 kr
- [Nya tröskelvärden från 1 januari 2026 (Upphandlingsmyndigheten)](https://www.upphandlingsmyndigheten.se/nyheter/2025/troskelvarden-2026/)
- [Ledningssystem Licenser och priser (AM System)](https://amsystem.com/pricing/management-system)
- [Centuri – jämförelse och listpris (BusinessWith)](https://businesswith.se/system/centuri/)
- [Bästa Kvalitetsledningssystem 2026 (BusinessWith)](https://businesswith.se/kvalitetsledningssystem/)
- [Ledningssystemet (Centuri) – Region Västmanland](https://regionvastmanland.se/interna-system/ledningssystemet-centuri/)
- [Kvalitetsledningssystem för vård och omsorg (CANEA)](https://www.canea.com/en-us/industry/health-and-social-care)
- [Kvalitets- och patientsäkerhetsarbete (Stratsys)](https://www.stratsys.com/sv/produkter/kvalitetsarbete-vard-omsorg)
- [Pricing and FAQs (Eolas Medical)](https://eolasmedical.com/us/pricing)
- [Healthtech Acquisition Worth $16 Million (Forbes, om Induction/MicroGuide)](https://www.forbes.com/sites/jamessomauroo/2020/06/12/16m-healthtech-acquisition-signals-shift-in-clinician-patient-communication/)
- [Vårdcentraler i privat regi (Ekonomifakta)](https://www.ekonomifakta.se/sakomraden/foretagande/valfardsforetag/vardcentraler-i-privat-regi_1210137.html) – 1 176 vårdcentraler, 564 privata (2025)
- [Regionernas kostnader (Ekonomifakta)](https://www.ekonomifakta.se/sakomraden/offentlig-ekonomi/kommunal-ekonomi/regionernas-kostnader_1212007.html) – ca 493 mdkr (2025)
- [IT och digitalisering i hälso- och sjukvården 2024 (Inera)](https://www.inera.se/globalassets/inera/media/dokument/projekt/it-och-digitalisering-i-halso-och-sjukvarden_2024.pdf) – IT 3,6 % av regionernas kostnader 2023
- [Administration får mer tid än patienter (Vårdfokus)](https://www.vardfokus.se/yrkesroller/sjukskoterska/administration-far-mer-tid-an-patienter-2/) – 43 % direkt patientarbete, Anskär 2019
- [Vårdhandboken (Inera)](https://www.inera.se/tjanster/alla-tjanster-a-o/vardhandboken/)
- [Nationellt kliniskt kunskapsstöd / 1177 för vårdpersonal (Inera)](https://www.inera.se/tjanster/alla-tjanster-a-o/nationellt-kliniskt-kunskapsstod/)
- [Statistik om akutmottagningar, väntetider och besök 2025 (Socialstyrelsen)](https://www.socialstyrelsen.se/publikationer/statistik-om-akutmottagningar-vantetider-och-besok-2025-2026-6-10339/)
- [SaaS Valuation Multiples 2026 (Livmo)](https://livmo.com/blog/saas-valuation-multiples-2026/) – 3–7× ARR, median 4,5×

**Uttryckligt inte verifierat:** antalet sjukhusbundna akutmottagningar (60–70) kunde inte
bekräftas mot en primärkälla under arbetet – Socialstyrelsens publikationer anger siffran i
PDF-bilagor som inte gick att läsa maskinellt. Siffran är en uppskattning och bör kontrolleras
mot Socialstyrelsens rapport innan den används i externt material. Detsamma gäller
TAM/SAM/SOM-uppskattningarna i 4.2 och samtliga värderingsspann i avsnitt 6.
