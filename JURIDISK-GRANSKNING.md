# Juridisk granskning av Synappsen — version 2

> **INTERNT DOKUMENT — delas ALDRIG externt i sin helhet.** Rapporten innehåller
> riskbedömningar om bolagsform, bisyssla, jäv och personligt ansvar som är avsedda för
> ägaren och för en anlitad jurist, inte för kund eller upphandlare. Samma hantering som
> `INCIDENT-CHECKLISTA.md`. Enskilda avsnitt kan lyftas ut till kundmaterial efter
> omarbetning — se avsnitt 21.4 för vilka.

**Datum:** 2026-08-11
**Granskad produktversion:** v5.97.0 (scaffolding för Etapp 64 byggd samma dag). **Kodverifieringen i avsnitt 21 gjordes mot v5.98.0** på grenen `claude/synappsen-final-review-slzcxe`.
**Underlag:** projektkunskapen i detta projekt — `CLAUDE.md`, `CLAUDE_STATUS.md`, `ETAPPLAN2.md`–`ETAPPLAN13.md` (inkl. `ETAPPLAN5-ALT-A/B`), `MODULPLAN.md`, `PITCH.md`, `SAKERHETSRAPPORT.md`, `TILLGANGLIGHETSREDOGORELSE.md`, `OPPNA-PUNKTER.md`, `INCIDENT-CHECKLISTA.md`, `UTVECKLINGSLOGG.md`, samt `avtal/`-katalogen (`PUB-AVTAL-MALL.md`, `UNDERBITRADEN.md`, `DPIA-UNDERLAG.md`, `IT-FAKTABLAD.md`, `INCIDENTRESPONSPLAN.md`) — **samt, sedan 2026-08-11, faktisk kod för de punkter som var markerade [PK].**
**Ersätter:** `JURIDISK-GRANSKNING-SYNAPPSEN-2026-08-11.md` (v1, samma dag). Denna version är fristående och kan läsas utan v1. Avsnitt 20 redovisar vad som ändrats sedan v1, avsnitt 21 vad kodverifieringen visade.

---

## 0. Vad det här dokumentet är, och inte är

**Det är inte juridisk rådgivning.** Jag är inte jurist. Rapporten är ett strukturerat underlag: en kartläggning av vilka regelverk som träffar Synappsen, var produkten och verksamheten står i förhållande till dem, vad som är öppet, och vilka frågor som måste besvaras av en anlitad jurist. Syftet är att göra den externa bedömningen — som redan står som en öppen punkt i `OPPNA-PUNKTER.md` — billigare och mer träffsäker, inte att ersätta den.

**Premisskontroll tillämpad på mig själv (genomgående krav 8).** Jag har läst dokumentationen, inte koden. Projektets egen erfarenhet är att planer och dokument återkommande avviker från vad koden faktiskt gör — det är hela skälet till att kravet finns. Varje påstående nedan om vad produkten *gör* är därför i praktiken ett påstående om vad dokumentationen *säger* att den gör. Där en juridisk slutsats hänger på ett tekniskt faktum är det markerat **[PK]** — premisskontroll mot kod krävs innan slutsatsen används mot en kund, en upphandlare eller en tillsynsmyndighet.

> **Uppdatering 2026-08-11: [PK]-punkterna är nu kontrollerade mot koden.** Resultatet står i sin helhet i **avsnitt 21**, och är inarbetat på plats i avsnitt 4.1, 4.4, 6.4 och 7.4. Kontrollen bekräftade två av rapportens farhågor, avfärdade en, och — viktigast — visade att **rapportens egen rekommendation i avsnitt 4.4 om att pseudonymisera revisionsloggen är tekniskt omöjlig mot den befintliga implementationen.** Det är ett exempel på precis den drift kravet finns för att fånga, fast åt andra hållet än vanligt: här var det granskningsdokumentet, inte koden, som hade fel. Övriga avsnitt bygger fortfarande på dokumentationen.

**Varför en version 2.** Projektets egen disciplin är att en andra genomläsning ska hitta fel som den första införde — `ETAPPLAN13.md` fick sju rättelser på det sättet, varav två i sin egen omskrivning. Samma disciplin tillämpas här. Utöver rättelserna har rättsläget kontrollerats mot externa källor på fyra punkter där v1 uttryckligen redovisade osäkerhet, och på tre av dem hade v1 fel eller var inaktuell (avsnitt 20).

**Dokument jag inte har kunnat läsa.** `avtal/ANVANDARVILLKOR.md` (B2B-villkoren) återfanns inte i projektkunskapen. Avsnitt 14 är därför skrivet som en kravlista för vad villkoren *behöver* täcka, inte som en granskning av vad de säger. Detsamma gäller `BESLUTSLOGG.md`, som jag bara sett refererad, och koden i sin helhet.

---

## 1. Sammanfattning

Synappsen är, mätt mot vad ett soloprojekt normalt har, ovanligt väl förberett. PUB-avtalsmall, underbiträdesförteckning, DPIA-underlag, IT-faktablad, incidentresponsplan och tillgänglighetsredogörelse finns skrivna — och de är, vilket är både ovanligare och mer värdefullt, **ärliga om sina egna luckor**. Den disciplinen är i sig en compliance-tillgång. Ett dataskyddsombud som möter ett dokument som säger "detta är inte byggt än" litar mer på resten av dokumentet, inte mindre.

Den samlade bilden är ändå densamma som i v1: **produkten är mer redo än verksamheten runt den.** Det som återstår går nästan uteslutande inte att koda bort.

### Fem punkter som bör vara lösta innan ett avtal undertecknas med första betalande kund

1. **Bolagsformen.** Enskild firma innebär personligt, obegränsat ansvar för ett system som ska bära kliniska rutiner i akutsjukvård — och den 9 december 2026 föreslås en ny produktansvarslag träda i kraft som uttryckligen omfattar fristående programvara med strikt ansvar (avsnitt 11). Detta är enligt min bedömning den allvarligaste enskilda risken i hela materialet, och den behandlas inte i något projektdokument. Den är dessutom en *flaskhals*: minst tre andra dokument väntar på ett juridiskt namn och ett organisationsnummer.
2. **Datalagringsregionen för Firestore och Storage är fortfarande overifierad.** Öppen sedan 2026-07-26 enligt `avtal/UNDERBITRADEN.md`. Det är den enskilt vanligaste blockerande frågan från ett dataskyddsombud, och den kräver en inloggning i Firebase-konsolen — inte en kodändring. Att den stått öppen i sex veckor medan ett trettiotal etapper byggts är det tydligaste exemplet på projektets eget identifierade mönster: byggtempo frikopplat från extern verklighet.
3. **Gemini API kontra Vertex AI.** Produkten använder det publika Gemini-API:et utan dokumenterad regionsgaranti. För en regionkund är detta sannolikt en avtalsbrytare, inte en detalj. Den tekniska lösningen (Vertex AI, regional endpoint) är redan identifierad i `avtal/UNDERBITRADEN.md`.
4. **Revisionsloggen som "raderas ALDRIG"** står i konflikt med GDPR:s princip om lagringsminimering. Den är formulerad som en produktstyrka i PUB-avtalsmallen; den kommer att läsas som en brist av en granskande jurist (avsnitt 4.4).
5. **Bisyssla, jäv och upphandling** aktualiseras samtidigt när en regionanställd säljer till den egna regionen. Riskerna ligger hos båda parter, men en av dem — ogiltigförklaring av avtalet — drabbar leverantören hårdast (avsnitt 13).

### Tre regelverk som materialet inte behandlar alls

- **AI-förordningen (EU) 2024/1689**, nu ändrad genom den s.k. Digital Omnibus on AI, **förordning (EU) 2026/1744**, i kraft sedan 27 juli 2026. Produkten har fyra AI-beroende funktioner och nämner inte förordningen någonstans. Avsnitt 7 — och notera att **artikel 50 (transparens) gäller sedan 2 augusti 2026, alltså sedan förra veckan.**
- **Den nya produktansvarslagen** (SOU 2025:103, genomför direktiv (EU) 2024/2853), föreslagen ikraftträdande 9 december 2026, som uttryckligen omfattar programvara — inklusive SaaS. Avsnitt 11.
- **Cybersäkerhetslagen (2025:1506)**, i kraft sedan 15 januari 2026, som genomför NIS2. Den träffar inte Synappsen direkt, men kundens krav på leverantörskedjan landar i avtalet. Avsnitt 8.

### Vad materialet gör rätt, och som inte får tappas bort

MDR-gränsdragningen är genomtänkt, dokumenterad och konsekvent hållen över flera etapper — inte bara en engångsformulering. Journalföringsgränsen likaså (`SAKERHETSRAPPORT.md`, tillägget om Etapp 18). Beslutet att pausa klinikstöd-sökningen 2026-07-14 när domänbegränsningen visade sig inte hålla är, juridiskt sett, exakt rätt reflex — och den efterföljande omkonstruktionen med enforcement i två lager plus daglig automatisk verifiering är starkare än vad de flesta konkurrenter kan visa upp. `ETAPPLAN13.md`s ordning "juridik före kod" är principiellt riktig, med den reservation som framgår av avsnitt 10.4.

---

## 2. Rättskarta: vem träffas av vad

Den vanligaste källan till förvirring i vårdnära SaaS är att regelverken inte träffar samma part. Uppdelningen nedan bör ligga till grund för allt kundmaterial — och den är i sig ett säljargument, eftersom en kund som förstår sitt eget ansvar snabbare kan säga ja.

| Regelverk | Träffar leverantören | Träffar kunden (vårdgivaren) | Avsnitt |
|---|---|---|---|
| GDPR (EU) 2016/679 | Ja — som personuppgiftsbiträde | Ja — som personuppgiftsansvarig | 4 |
| Patientdatalagen (2008:355) | Nej direkt; indirekt via biträdesrollen | Ja | 5.1 |
| Patientsäkerhetslagen (2010:659), HSLF-FS 2011:9 | Nej | Ja | 5.3 |
| MDR (EU) 2017/745 + lag (2021:600) | **Ja, om produkten kvalificeras som medicinteknisk** | Ja, som användare/ev. egentillverkare | 6 |
| AI-förordningen (EU) 2024/1689, ändrad genom (EU) 2026/1744 | Ja — som leverantör av AI-system | Ja — som tillhandahållare/deployer | 7 |
| Cybersäkerhetslagen (2025:1506) / NIS2 | Sannolikt nej direkt; ja i praktiken via leverantörskedjekrav | Ja — regioner är väsentliga entiteter | 8 |
| DOS-lagen (2018:1937), EN 301 549 | Nej formellt | Ja | 9 |
| Upphovsrättslagen (1960:729) | Ja | Ja (eget uppladdat innehåll) | 10 |
| Produktansvar — (1992:18), från 9 dec 2026 ny lag | **Ja, och alltmer** | – | 11 |
| Dataakten (EU) 2023/2854 | Möjligen ja | Ja | 12 |
| LOU (2016:1145) | Indirekt — men avtalets giltighet står på spel | Ja | 13 |
| Marknadsföringslagen (2008:486) | Ja | – | 15 |
| Kollektivavtalet AB § 8, LOA 7 §, BrB 10 kap. | Ja (som anställd) | Ja | 13.3 |

---

## 3. Bolags- och ansvarsstruktur — rapportens flaskhals

Detta avsnitt står först, före de tekniska regelverken, eftersom det blockerar flest andra saker.

### 3.1 Enskild firma är fel form för den här risken

Enskild firma innebär att näringsidkaren svarar personligen och obegränsat. Konkret för Synappsen:

- Skadeståndsanspråk från en kund efter en dataincident: **personligt.**
- Anspråk enligt de nya produktansvarsreglerna vid personskada: **personligt, och i praktiken inte avtalsbegränsningsbart** (avsnitt 11).
- Upphovsrättsanspråk från en rättighetshavare till ett bedömningsinstrument, om Etapp 64 skulle gå fel: **personligt.**
- Administrativ sanktionsavgift enligt GDPR mot biträdet: **personlig.**

Detta är inte teoretiskt i en produkt som ska bära kliniska rutiner i akutsjukvård, och där dokumentationen själv identifierar risker som "en arkiverad rutin syns i akutläget".

### 3.2 De praktiska hindren, som är minst lika konkreta

- **Upphandlingskrav på ekonomisk och finansiell ställning.** LOU tillåter myndigheten att ställa krav på omsättning och kreditvärdighet. En enskild firma utan omsättning har svårt att uppfylla dem, och kvalificeringsfasen är där de flesta små leverantörer faller.
- **Organisationsnumret är personnumret.** Det hamnar i varje avtal, faktura och diarieförd handling hos en offentlig kund — alltså i allmänna handlingar. Det är en integritetsförlust som inte går att ta tillbaka.
- **Exit blir inkråmsöverlåtelse, inte aktieöverlåtelse.** Varje framtida försäljning eller delägarskap kompliceras.
- **Försäkring.** Flera ansvarsförsäkringar för IT-/konsultverksamhet förutsätter juridisk person eller prissätter enskild firma sämre.

### 3.3 Flaskhalseffekten

Tre dokument väntar redan på ett juridiskt namn och ett organisationsnummer: `TILLGANGLIGHETSREDOGORELSE.md` (`[FYLL I: juridiskt namn på leverantören]`), `avtal/PUB-AVTAL-MALL.md` punkt 1, och — enligt vad som framgår indirekt — B2B-villkoren. Bolagsbildningen är alltså inte en av flera parallella uppgifter. **Den är förutsättningen för att tre andra ska kunna stängas.**

### 3.4 Rekommendation

Bilda aktiebolag innan första betalande kund. Vid övergången behöver hanteras:

1. **Skriftlig överlåtelse av immateriella rättigheter** från näringsidkaren till bolaget, med marknadsmässig värdering (skattemässigt viktigt — en underprisöverlåtelse av en tillgång med värde kan få konsekvenser).
2. Överföring av domäner, molnkonton, repositorier och tredjepartsavtal så att **bolaget**, inte personen, är avtalspart.
3. Ansvarsförsäkring tecknad i bolagets namn, med uttryckligt produktansvarsmoment och kontroll av att vårdverksamhet inte är undantagen — det är ett vanligt undantag.
4. F-skatt, momsregistrering, och ett beslut om revisorsplikt (gränsvärdena).

**Momsnoten, som påverkar prissättningen mer än de flesta tror:** SaaS till en vårdgivare är momspliktigt med 25 %, medan kundens egen vårdverksamhet är momsbefriad och avdragsrätten därför starkt begränsad. Den effektiva kostnaden för kunden är alltså listpriset plus 25 %, till skillnad från vad den skulle vara för ett vanligt företag. Det bör vara känt innan ett pris sätts, och det är ett argument för att prissätta per enhet snarare än per användare.

---

## 4. GDPR

### 4.1 Rollfördelningen är korrekt bedömd

Kunden är personuppgiftsansvarig, Synappsen personuppgiftsbiträde. Det är rätt: leverantören bestämmer varken ändamål eller medel för behandlingen av kundens personaldata i egentlig mening. `avtal/PUB-AVTAL-MALL.md` uttrycker detta korrekt.

**Två reservationer.**

För det första: leverantören behandlar sannolikt vissa uppgifter som **självständigt personuppgiftsansvarig** — kontaktpersoner hos kunden, fakturaunderlag, supportärenden, säkerhetsloggar som används för leverantörens egen driftsäkerhet och för att upptäcka missbruk. Denna behandling ligger utanför PUB-avtalet och behöver en egen rättslig grund (avtal respektive berättigat intresse) och en egen informationstext. Detta saknas i materialet.

För det andra: `PITCH.md`/`ETAPPLAN6.md` beskriver ett **referensunderlag** som exporteras anonymiserat efter aktivt medgivande, samt aggregerad statistik. Om leverantören själv bestämmer ändamålet med den behandlingen — att marknadsföra produkten — är leverantören ansvarig, inte biträde, för just den delen. Att det är anonymiserat löser frågan *om anonymiseringen håller*; själva anonymiseringsoperationen är i sig en behandling. **[PK]** Kontrollera att exporten inte kan återidentifieras via små områden och ovanliga rollkombinationer — beslutet från 2026-08-02 att utesluta kundens namn löser en del av det, inte allt.

> **[PK KONTROLLERAD 2026-08-11 — farhågan avfärdas, men en angränsande brist hittades.]**
> `exporteraReferensunderlag` (`functions/matvarden.js:299`) returnerar enbart sju aggregerade
> fält: antal anställda, två kvitteringsgrader, andel nollträffar, tid-att-hitta,
> innehållshälsa och ett genereringsdatum. Inga namn, inget `organisationId`, inget orgnr —
> och, avgörande för just den här farhågan, **ingen roll- eller områdesuppdelning alls**.
> Återidentifiering "via små områden och ovanliga rollkombinationer" är därför inte möjlig,
> eftersom de dimensionerna inte lämnar servern. Anonymiseringen sitter strukturellt i vilka
> fält som saknas i objektet, inte i en efterbehandling som kan glömmas bort — rätt
> konstruktion, och kodkommentaren intill säger uttryckligen det.
>
> **Bristen som däremot finns: ingen minsta-n-spärr.** Personalpulsen har en tröskel på fem
> svar (krav 14). Referensunderlaget har ingen. För en liten kund blir `antalAnstallda: 3`
> tillsammans med `kvitteringsgradKlinisktStod: 67` en utsaga om att exakt en av tre
> namngivna personer inte kvitterat. Svagt, men verkligt — och inkonsekvent mot en spärr
> projektet redan bedömt som nödvändig på ett likartat ställe. Att kunden samtyckt till
> exporten skyddar kunden som organisation, inte den enskilde anställde, som inte är part i
> samtycket. **Rekommendation:** samma tröskel som personalpulsen, med ett tydligt svar om
> att underlaget inte kan tas fram för en organisation under tröskeln.

### 4.2 Rättslig grund för kundens behandling

Kunden behandlar personaldata för att driva ett arbetsverktyg. Grunden är normalt art. 6.1 b (anställningsavtalet) eller 6.1 f (berättigat intresse), i offentlig sektor ofta 6.1 e (uppgift av allmänt intresse). Detta är kundens sak att avgöra, men **materialet bör innehålla ett förslag** — det sparar veckor i kundens interna process.

**Punkten som förtjänar mer uppmärksamhet än den fått:** systemet spårar per person vem som läst, kvitterat, skapat och redigerat vad, och innehåller kompetensmatris och statistik över "mest aktiva användare". Det är i praktiken **kontroll av arbetstagare**. För en offentlig arbetsgivare innebär det:

- En intresseavvägning som ska dokumenteras, inte förutsättas.
- **Förhandlingsskyldighet enligt 11 § MBL** innan systemet införs — införande av ett system som möjliggör uppföljning av enskilda anställdas arbete är en viktigare förändring av verksamheten. Detta är kundens skyldighet, men **om den missas blir det leverantörens problem i praktiken**, eftersom införandet stannar.
- Personalpulsen har redan en minsta-n-spärr på fem svar (krav 14), vilket är rätt tänkt. Samma princip bör uttryckas som ett stående krav även för kvitterings- och aktivitetsstatistik i chefsvyer.

**Rekommendation:** ett kort avsnitt i införandematerialet: "Detta bör ni ta upp med de fackliga organisationerna innan driftstart." Det gör leverantören till en partner i kundens process i stället för en risk i den.

### 4.3 Artikel 28 — granskning av PUB-avtalsmallen

Mallen täcker de obligatoriska punkterna i art. 28.3 väl. Kvarstående brister:

| Punkt | Läge | Kommentar |
|---|---|---|
| Dokumenterade instruktioner (28.3 a) | Delvis | Avtalet beskriver behandlingen men saknar en tydlig formulering om att biträdet enbart behandlar enligt kundens dokumenterade instruktioner, och vad som gäller om en instruktion strider mot lag |
| Tystnadsplikt (28.3 b) | **Saknas** | Det finns ingen skrivning om att personer hos biträdet som behandlar uppgifterna är bundna av tystnadsplikt. Vid en ensam näringsidkare känns det överflödigt — det är det inte, det är en uttrycklig punkt i artikeltexten och en granskare kommer att leta efter den |
| Säkerhetsåtgärder (28.3 c / art. 32) | Ja | Punkt 7, väl underbyggd |
| Underbiträden (28.3 d) | Ja | Med förbehåll för att underrättelsetiden är ifylld |
| Bistånd vid registrerades rättigheter (28.3 e) | **Svagt** | Vad händer konkret vid en begäran om radering eller registerutdrag från en enskild anställd? Funktionaliteten finns delvis (export), rutinen saknas |
| Bistånd art. 32–36 (28.3 f) | Delvis | DPIA-underlaget finns, vilket är mer än de flesta har |
| Radering/återlämnande (28.3 g) | Ja, ärligt | Se 4.5 |
| Information för revision (28.3 h) | Ja | Punkt 9 |

**Två saknade skrivningar som är värda att lägga till innan första undertecknande:** tystnadsplikten ovan, och en uttrycklig punkt om **vad som gäller om leverantören upphör** — konkurs, sjukdom, dödsfall. För en ensam näringsidkare är det inte en formalitet; det är den fråga en kunds jurist kommer att ställa först. En deponerad kopia av källkoden och en dokumenterad väg för kunden att få ut sin data utan leverantörens medverkan är svaret.

### 4.4 Artikel 5.1 e och artikel 17 — revisionsloggen är ett verkligt problem

`avtal/PUB-AVTAL-MALL.md` punkt 6 säger att organisationens revisionslogg **"raderas ALDRIG"**. Formuleringen presenteras som en styrka.

Den kommer att läsas som motsatsen. Lagringsminimering (art. 5.1 e) kräver att personuppgifter inte lagras längre än nödvändigt för ändamålet. En logg som innehåller namngivna personers handlingar och som per definition aldrig gallras är svår att försvara mot den principen, oavsett hur god spårbarhetsavsikten är.

**Detta är lösbart, och lösningen är i huvudsak textuell:**

1. Ange en faktisk gallringstid, motiverad av ändamålet. För en verifieringskedja som ska kunna visa vad som hänt i ett vårdverktyg är något i storleksordningen 2–5 år normalt försvarbart — men siffran ska härledas, inte gissas.
2. Beskriv vilken **rättslig grund** som bär den fortsatta lagringen efter att kundrelationen upphört. Om det är leverantörens berättigade intresse av att kunna försvara sig mot anspråk, säg det — då blir preskriptionstiden en naturlig gallringshorisont.
3. ~~Överväg om loggen kan **pseudonymiseras** efter en kortare tid: kedjans integritet bevaras, kopplingen till en namngiven person försvinner.~~ **Se rättelsen nedan — punkt 3 är felaktig.**

> **[PK KONTROLLERAD 2026-08-11 — punkt 3 ovan är tekniskt omöjlig mot den befintliga
> implementationen, och är därför överstruken.]**
>
> `raknaHash()` (`functions/gemensamt.js:461`) hashar hela loggposten **inklusive
> `aktorUid`**, och `verifieraRevisionskedja()` (samma fil, rad 501) bygger om varje hash från
> postens faktiska innehåll — uttryckligen för att upptäcka ändringar gjorda i efterhand.
> Kodkommentaren säger det rakt ut: *"en post vars innehåll ändrats i efterhand (utan att
> hash-fältet räknades om) upptäcks alltså också"*.
>
> Följden: **att pseudonymisera `aktorUid` i efterhand ÄR en sådan ändring.** Att radera en
> post bryter dessutom nästa posts `foregaendeHash`. Båda åtgärderna får nattjobbet
> `verifieraRevisionskedjor` (`functions/revisionslogg.js:32`) att rapportera "posten har
> manipulerats" respektive "kedjan bruten" — i Sentry och i `systemstatus/revisionskedja`, för
> varje drabbad organisation, varje natt, tills någon stänger av kontrollen. Kedjan är
> konstruerad för att göra exakt det rapporten föreslog omöjligt. Det är inte en brist i
> konstruktionen; det är dess syfte.
>
> **Vad som faktiskt går att göra — segmentering.** Gallra hela tidsavgränsade segment från
> kedjans början och skriv en **ankarpost** som anger segmentets period, antal borttagna
> poster och segmentets sista hash. Den nya kedjan startar från ankaret i stället för från
> `REVISIONSLOGG_GENESIS_HASH`, och `verifieraRevisionskedja()` lärs acceptera ankarposter som
> giltiga omstartspunkter. Då kan man fortfarande bevisa två saker som båda behövs: att kedjan
> från ankaret framåt är intakt, och exakt hur mycket som gallrats och fram till när.
>
> **En renare modell för framtiden:** flytta `aktorUid` ut ur den hashade posten till en
> separat uppslagstabell, så att identiteten kan gallras utan att kedjan berörs alls. Då blir
> personuppgiften faktiskt raderbar samtidigt som integriteten består — vilket är precis vad
> artikel 17 och en verifierbar logg annars drar åt var sitt håll. Migreringen kräver i sig ett
> segmentsnitt, så den praktiska ordningen är: snitta ett segment nu, låt nya poster använda
> den separerade modellen.
>
> **Härledd gallringstid: 3 år som huvudregel, 5 år för säkerhetsrelevanta händelsetyper.**
> Rapporten kräver med rätta att siffran härleds. Härledningen:
>
> - Loggens två ändamål är kundens spårbarhet i sitt eget ledningssystem och leverantörens
>   förmåga att bemöta ett påstående om manipulation. Det första följer kundens
>   egenkontrollcykel, som är årlig — **tre år täcker tre cykler**, alltså nog för att visa ett
>   mönster över tid, vilket är vad en IVO-granskning faktiskt efterfrågar.
> - Allmän preskription är tio år, men att åberopa den för "vem läste vilken rutin" är svårt
>   att försvara mot artikel 5.1 e. Tio år är rätt horisont för **releasedokumentationen**
>   (produktansvar, avsnitt 11) — inte för läskvitton.
> - Två år är för kort: fördröjningen mellan att en dataincident inträffar och att den upptäcks
>   och leder till ett anspråk äter lätt upp ett år.
> - De fem åren för säkerhetsrelevanta poster — rolländringar, plattformsadmin- och
>   supportåtkomst, avetablering, nekade behörighetsförsök — motiveras av att det är just de
>   posterna man behöver i en incidentutredning eller en tvist om obehörig åtkomst, och att de
>   utgör en liten andel av volymen. Att gallra dem lika hårt som läskvitton vore att optimera
>   bort fel sak.
> - **Pågående incident eller tvist ska frysa gallringen** (legal hold). Utan det kan en
>   automatisk gallring förstöra bevisning mitt i en utredning.
>
> **Avetableringens "gravsten" är en separat sak.** En minimal post om att raderingen skedde,
> när och av vem kan behållas utan tidsgräns — den är beviset på att raderingen genomfördes,
> och består av en handfull fält utan innehållsdata. Men PUB-avtalet säger i dag att *hela*
> organisationens revisionslogg raderas aldrig. **Det är den formuleringen som ska ändras, inte
> gravstenen.** Skillnaden mellan de två är hela skillnaden mellan en försvarbar och en
> oförsvarbar skrivning.

**Motsvarande fråga för backupretentionen:** 90 dagars kvarhållande av backuper även efter en genomförd radering är ett medvetet, dokumenterat beslut från 2026-08-06. Det är försvarbart — men det behöver stå i PUB-avtalet som ett **villkor kunden accepterar**, inte bara som en teknisk beskrivning. En kund som utövar rätten till radering och sedan får veta att data låg kvar i tre månader har en klagomålsgrund om det inte var avtalat.

### 4.5 Artikel 30.2 — biträdets egen registerförteckning saknas

Ett personuppgiftsbiträde ska föra en egen förteckning över de kategorier av behandling som utförs för varje ansvarig. `avtal/UNDERBITRADEN.md` är en underbiträdesförteckning — inte samma sak. En art. 30.2-förteckning är ett kort dokument (kunder, kategorier av behandling, överföringar till tredjeland, en allmän beskrivning av säkerhetsåtgärderna) och kan skrivas på en timme. **Att den saknas är den billigaste bristen i hela rapporten att åtgärda.**

### 4.6 Artikel 32 — säkerhetsåtgärder

Här är materialet starkt, och starkare än vad dokumentationen själv gör anspråk på:

- Behörighetsstyrning enforcerad i databasreglerna, inte bara i gränssnittet — detta är den distinktion en teknisk granskare letar efter.
- Organisationsisolering verifierad med en egen automatiserad testsvit som körs varje release.
- Hashkedjad revisionslogg med daglig automatisk integritetskontroll.
- Kryptering i vila och under överföring, valfri TOTP-2FA som kan tvingas per organisation, automatisk utloggning, force-logout.
- Leverantören har **ingen stående läsåtkomst** till kundens innehåll; supportåtkomst är kundinitierad, tidsbegränsad till sex timmar, synlig och loggad i båda ändar.

Den sista punkten är ovanlig och bör lyftas fram tydligare i kundmaterialet än den är i dag. De flesta SaaS-leverantörer kan inte påstå det.

**Två kvarstående punkter:**

- **App Check är fortfarande i mätläge**, inte enforcement. Det betyder att skyddet mot anrop från andra klienter än den riktiga appen ännu inte är verksamt. Det är ärligt dokumenterat i `avtal/IT-FAKTABLAD.md`, men det är också en fråga en IT-säkerhetsgranskare kommer att ställa. Öppen sedan 2026-08-01, blockerad av verifieringsgraden i konsolen.
- **Den kända upptäcktsluckan** (ett konto som missbrukar behörighet det redan legitimt har lämnar inget spår) är korrekt beskriven i DPIA-underlaget. Att den är dokumenterad är bra; att den väntar på ett ägarbeslut om GCP-faktureringsexport sedan 2026-07-31 är sämre. Vid en incident är skillnaden mellan "vi hade inte den kontrollen" och "vi hade identifierat behovet men inte fattat beslutet" betydande.

### 4.7 Artiklarna 44–49 — tredjelandsöverföring

Detta är den mest sannolika enskilda invändningen från ett dataskyddsombud i offentlig vård.

| Fråga | Läge |
|---|---|
| Cloud Functions-region | ✅ europe-west1, verifierat i kod |
| Firestore- och Storage-region | ❌ **Overifierad sedan 2026-07-26.** Kan inte läsas ur koden; kräver en konsolkontroll |
| Sentry | ✅ EU (Frankfurt), verifierat |
| Brevo | ✅ EU (Frankrike) |
| Gemini API | ❌ **Publika API:et, ingen dokumenterad regionsgaranti.** Vertex AI är den identifierade lösningen |
| Firebase Hosting | Globalt CDN — statiska tillgångar utan personuppgifter, normalt oproblematiskt men bör beskrivas |
| Rättslig grund för Google | Standardavtalsklausuler + adekvansbeslutet för amerikanska mottagare, via Googles databehandlingstillägg |

**Tre saker att göra, i ordning:**

1. **Logga in i Firebase-konsolen i dag och skriv ner regionen.** Detta är tio minuters arbete som har blockerat sex veckor.
2. **Migrera AI-anropen till Vertex AI med regional endpoint** innan en regionkund. Det är ett tekniskt begränsat ingrepp (samma modell) som tar bort en hel invändningskategori.
3. **Skriv en kort transferanalys** (TIA) som bilaga till PUB-avtalet. Adekvansbeslutet för överföringar till USA har varit föremål för rättslig prövning; en TIA som visar att man tänkt på saken är värd mer än en hänvisning till att beslutet finns. Notera i den att bilder som skickas till AI-tolkning kan innehålla oavsiktlig personinformation trots PII-spärren — det är precis den restrisk analysen ska adressera.

### 4.8 Artiklarna 33–34 — incidenthantering

`avtal/INCIDENTRESPONSPLAN.md` är starkare än vad de flesta leverantörer i den här storleken har. Klassificering i tre nivåer, definition av "kännedom" som startpunkt för 72-timmarsfristen, kompenserande kontroller vid ensam bemanning, och en öppen redovisning av att verksamheten drivs av en person.

**Att den öppet redovisar ensambemanning är rätt val.** Ett dataskyddsombud som upptäcker det själv drar en värre slutsats än ett som får veta det tillsammans med de kompenserande kontrollerna.

**Kvarstående:** tre av fem rader i `INCIDENT-CHECKLISTA.md`s kontakttabell är tomma, däribland juridiskt stöd vid GDPR-incident och extern incidentkompetens. Det står i `OPPNA-PUNKTER.md` som "tio minuter vid tangentbordet" — men raden om extern incidentkompetens är i själva verket **inte** tio minuter, den kräver att någon faktiskt finns att ringa. Att ha ett namn och ett telefonnummer till en jurist innan man behöver dem är skillnaden mellan att hålla 72-timmarsfristen och att inte göra det.

---

## 5. Hälso- och sjukvårdsrätt

### 5.1 Patientdatalagen — gränsen är rätt dragen, men den är kundens att hålla

Konstruktionen är korrekt: PDL träffar vårdgivarens behandling av patientuppgifter, och Synappsen är byggt för att inte innehålla sådana. Tre oberoende tekniska lager (klientkontroll, servervalidering i AI-flödena, regelnivåspärr i databasen) plus den dokumenterade fas 39-buggen där en verklig brist i regelnivåspärren hittades och rättades.

**Den ärliga begränsningen är rätt formulerad:** inget textfilter kan hindra en användare som aktivt vill kringgå varningarna. Det som saknas är den avtalsrättsliga konsekvensen av den begränsningen.

**Om patientuppgifter ändå hamnar i systemet** — vilket över tid är sannolikt i minst ett enstaka fall — inträffar tre saker samtidigt:

1. Systemet blir, för de uppgifterna, en del av kundens vårddokumentation, med PDL:s krav på behörighetsstyrning, **åtkomstloggning och systematisk loggkontroll**.
2. Kundens skyldighet att göra loggkontroller aktualiseras på ett system som inte är byggt för det.
3. Leverantörens biträdesroll blir betydligt tyngre.

**Rekommendation, konkret:** skriv in i huvudavtalet och i PUB-avtalet att (a) kunden ansvarar för att instruera personalen, (b) kunden ska ha en rutin för hur en felaktigt inskriven patientuppgift rapporteras och raderas, och (c) leverantören har rätt att radera uppenbara patientuppgifter utan föregående medgivande. Punkt (c) är den som saknas i dag och som annars ställer leverantören i ett omöjligt läge: att veta om en överträdelse men inte få agera på den.

### 5.2 Journalföringsgränsen

Beslutet i `SAKERHETSRAPPORT.md` — att checklistkörningar loggas aggregerat och utan personkoppling, eftersom "vem körde vilken checklista på vilken patient" vore journalföring — är korrekt och välmotiverat. Datamodellen bär beslutet strukturellt (inget patientidentifierarfält finns någonstans), inte bara som en policy. Det är rätt sätt att göra det.

**Ett stående krav värt att formalisera:** ingen framtida funktion får koppla en körning, en kvittering eller en sökning till en enskild patient, oavsett hur indirekt kopplingen är. Ett fritextfält "kommentar till körningen" vore tillräckligt för att öppna dörren.

### 5.3 Patientsäkerhet och ledningssystem — den underskattade kopplingen

Det här är det starkaste säljargumentet i hela rapporten, och materialet använder det inte.

En vårdgivare ska enligt patientsäkerhetslagen och Socialstyrelsens föreskrifter om ledningssystem för systematiskt kvalitetsarbete ha processer och rutiner som är dokumenterade, aktuella, kända av personalen och föremål för egenkontroll. **Rutindokumenten i Synappsen är kundens styrdokument i det ledningssystemet.** Det innebär:

- Kvitteringsfunktionen med deadline och påminnelse är inte en trevlig funktion — den är **bevis för att personalen tagit del av en uppdaterad rutin**, vilket är exakt vad en IVO-granskning frågar efter.
- Versionshistorik med diff, granskad-av-signatur och revideringsdatum är **dokumenterad versionshantering av styrdokument**.
- Innehållshälsan (vilka rutiner som behöver granskas) är i praktiken ett stöd för **egenkontroll**.

**Det juridiska motstyckets baksida:** om kunden förlitar sig på Synappsen för sitt ledningssystem blir tillgänglighet till systemet en patientsäkerhetsfråga. Ett driftavbrott är inte bara ett SLA-brott — det kan bli en avvikelse i kundens eget kvalitetssystem. Detta motiverar (a) att offlineläget beskrivs som en patientsäkerhetsfunktion snarare än en bekvämlighet, och (b) att avtalet uttryckligen säger att kunden ansvarar för en reservrutin vid längre avbrott.

### 5.4 Egentillverkning — en fråga att ställa till kunden, inte att svara på

Om produkten någon gång skulle bedömas kvalificera som medicinteknisk (avsnitt 6), aktualiseras MDR:s regler om produkter som tillverkas och används inom samma hälso- och sjukvårdsinstitution. Det är en väg vissa regioner använder för egenutvecklade system — men den förutsätter att institutionen själv är tillverkaren, vilket direkt motsäger en kommersiell leverantörsmodell. **Vägen är alltså stängd för Synappsen och bör inte hoppas på som en reservlösning.** Det är värt att veta innan någon föreslår den i ett kundmöte.

---

## 6. MDR — medicinteknisk programvara

### 6.1 Rätt fråga är kvalificering, inte klassificering

`ETAPPLAN13.md` gör redan denna distinktion korrekt, och rättade sig själv på punkten. Det är den enskilt viktigaste sakliga insikten i hela projektets juridiska material och ska inte tappas bort:

- **Kvalificering** — är detta en medicinteknisk produkt över huvud taget? Avgörs av definitionen i MDR art. 2(1) tillsammans med MDCG:s vägledning om kvalificering och klassificering av programvara (MDCG 2019-11; kontrollera senaste revision).
- **Klassificering** — vilken riskklass? Regel 11 i bilaga VIII. Endast relevant efter ett ja på kvalificeringsfrågan.

Planens bästa argument ligger i kvalificeringsledet: programvara vars funktion är att lagra, arkivera, kommunicera eller möjliggöra enkel sökning i befintliga dokument kvalificerar normalt inte. Ett elektroniskt referensbibliotek bearbetar inte patientdata.

### 6.2 Funktionsvis bedömning

MDR-kvalificering görs per funktion och per **avsett ändamål**, inte per produkt som helhet. Genomgången nedan bygger på dokumentationen.

| Funktion | Bedömning | Kommentar |
|---|---|---|
| Rutindatabas, sök, kvittering, versionshistorik | Kvalificerar sannolikt inte | Lagring, kommunikation och sökning i kundens egna dokument |
| Förråd, kontakter, anslag, skiftrapport | Kvalificerar inte | Ingen koppling till enskild patient |
| Checklistläge ("kör rutinen") | **Gränsfall, i dag på rätt sida** | Återger kundens eget godkända innehåll i annan layout. Ingen beräkning, ingen rekommendation. Ett steg är strukturellt begränsat till `{text, bild, varning, timerSekunder}` — spärren sitter i datamodellen, inte i en policy. Det är rätt sätt. **⚠️ Se rättelsen nedan — den sista meningen stämmer inte.** |

> **[PK KONTROLLERAD 2026-08-11 — premissen håller INTE, och det här är rapportens
> allvarligaste sakfel.]**
>
> Rapporten utpekar själv den här premissen som "den enskilt viktigaste tekniska premissen för
> MDR-slutsatsen". Kontrollen visar att den är felaktigt beskriven.
>
> `firestore.rules` begränsar vid skrivning av en rutin (rad 506–531) **två** saker om
> `steg`-arrayen: antalet steg (`arKortStegLista`, max 12, rad 228) och förekomst av
> personnummer i varje stegs `text`-fält (`harTroligtPersonnummerISteg`, rad 193). **Ingen
> regel begränsar vilka NYCKLAR ett stegobjekt får ha.** Det finns inget
> `hasOnly(['text','bild','varning','timerSekunder'])` för steg — `hasOnly` används på sex
> ställen i regelfilen, men inget av dem rör `rutiner`. Fältuppsättningen upprätthålls av
> klientformuläret (`RutinFormular.jsx:79`), alltså av en konvention i gränssnittet, inte av
> datamodellen. En skrivning som går förbi formuläret kan lägga till godtyckliga fält på ett
> steg — exempelvis ett `berakning`- eller `dos`-fält.
>
> **Varför det spelar juridisk roll:** hela argumentet för att checklistläget inte kvalificerar
> som medicinteknisk programvara vilar på att det inte kan räkna eller rekommendera, och
> rapporten framhåller uttryckligen att spärren sitter strukturellt snarare än i en policy. Om
> premissen används mot en upphandlare eller en tillsynsmyndighet i den formuleringen är det ett
> påstående som inte går att styrka i koden. Att skillnaden är teoretisk i dag — ingen sådan
> skrivning sker — ändrar inte att argumentet är svagare än det påstås vara.
>
> **Varför det inte är ett rent slarv:** Firestores regelspråk saknar loopar, vilket är
> samma begränsning som tvingade fram den uppradade indexlösningen för
> personnummerkontrollen (se kommentaren vid rad 197 om regelbudgeten på 1 000 deluttryck).
> Att kontrollera nyckeluppsättningen i tolv stegobjekt skulle kosta ytterligare deluttryck i
> en budget som redan tagit slut två gånger under projektets gång. Det är alltså en verklig
> teknisk avvägning, inte en förbisedd rad.
>
> **Att projektet vet hur man gör det rätt syns på jämförelsen:** `baspaketreferenser` — den
> collection som byggdes samma dag som rapporten skrevs, uttryckligen för att bära juridiskt
> känsligt innehåll — har `hasOnly(['titel','utgivare','kalldatum','url','kategori','tillagd','tillagdAv'])`
> (rad 677) med ett eget regeltest som verifierar att ett innehållsfält nekas. Där sitter
> spärren verkligen i datamodellen. Skillnaden mot `steg` är att `baspaketreferenser` är ett
> platt dokument, inte en array.
>
> **Två möjliga åtgärder, båda rimliga:**
> 1. **Rätta formuleringen** — säg att fältuppsättningen upprätthålls i klienten och att
>    regellagret spärrar antal och personnummer. Ärligt, kostar ingenting, och gör att
>    påståendet håller.
> 2. **Flytta spärren till servern** — validera stegens nyckeluppsättning i en Cloud
>    Function-trigger i stället för i regelspråket, där budgetbegränsningen inte finns.
>    Dyrare, men gör det ursprungliga påståendet sant.
>
> Alternativ 1 bör göras omgående oavsett; alternativ 2 är en fråga om hur tungt argumentet ska
> bära i en MDR-diskussion.
| AI-tolkning av foto/PDF → utkast | Kvalificerar sannolikt inte | Producerar utkast som alltid granskas av människa före publicering |
| Klinikstöd-sökning | **Gränsfall, i dag på rätt sida** | Sammanfattar externa auktoritativa källor med obligatorisk källhänvisning, domänbegränsad i två lager. Räknar aldrig |
| Etapp 64, baspaketet | **Öppen fråga — kräver extern bedömning** | Se `ETAPPLAN13.md`s fyra frågor, och avsnitt 6.4 nedan |

### 6.3 Konsekvensanalysen som materialet inte gör

`ETAPPLAN13.md` säger att full MDR-efterlevnad "sannolikt inte är proportionerligt". Det är rätt slutsats men underdriven motivering. Om produkten kvalificeras som medicinteknisk krävs i praktiken: ett kvalitetsledningssystem enligt ISO 13485, teknisk dokumentation, klinisk utvärdering, riskhantering enligt ISO 14971, ett system för övervakning efter utsläppande på marknaden, CE-märkning och — för klass IIa och uppåt — ett anmält organ. För en ensam näringsidkare är det inte en dyr uppgift. **Det är en annan verksamhet.**

Det gör MDR-gränsen till den enda gränsen i hela projektet som är binär snarare än graderad. Det motiverar att kraven 25 och 26 i `ETAPPLAN13.md` behandlas som permanenta, oöverträdbara krav, inte som etappspecifika.

### 6.4 Avsett ändamål måste stå i marknadsföringen, inte bara i koden

En produkt kan kvalificeras som medicinteknisk på grund av vad tillverkaren **påstår** att den gör, oavsett vad den tekniskt gör. Det innebär att `PITCH.md`, webbplatsen, ett anbudssvar och en säljpresentation alla är delar av MDR-bedömningen.

**[PK] Konkret att kontrollera:** finns någonstans i kundvänt material en formulering som "stöd för kliniska beslut", "beslutsstöd i akutsituationer" eller liknande? `MODULPLAN.md` använder ordet "beslutsstöd" om klinikstödet, och `KlinikfragaSok.jsx` har enligt utvecklingsloggen en disclaimer som innehåller ordet. En disclaimer som säger "beslutsstöd, ersätter aldrig klinisk bedömning" gör två saker samtidigt: den friskriver, och den påstår. Formuleringen bör ses över.

> **[PK KONTROLLERAD 2026-08-11 — bekräftad. Ordet finns i gränssnittet.]**
> `src/components/KlinikfragaSok.jsx:92` renderar, synligt för användaren:
> *"**Beslutsstöd – ersätter aldrig klinisk bedömning.**"* Rapportens iakttagelse håller
> alltså exakt: meningen friskriver och påstår i samma andetag, och det är påståendet — inte
> friskrivningen — som väger i en kvalificeringsbedömning enligt MDR art. 2(1), eftersom
> kvalificeringen styrs av tillverkarens **avsedda ändamål** så som det uttrycks utåt.
>
> **En viktig avgränsning som gör problemet mindre än det ser ut:** ordet förekommer också i
> `functions/klinikstod.js:356`, men där som en instruktion **till modellen** i systemprompten
> (*"Detta är beslutsstöd, inte en diagnos – uppmana alltid till egen klinisk bedömning"*).
> Den förekomsten är inte kundvänd och påverkar inte kvalificeringsbedömningen — den styr
> modellens svarston. Det är alltså **en enda rad i gränssnittet** som behöver formuleras om,
> inte en genomgripande omskrivning. Övriga träffar i repot ligger i planfiler och
> utvecklingsloggen, som är interna.
>
> **Rekommendation:** ersätt raden med en formulering som beskriver funktionen utan att
> tillskriva den en klinisk roll — exempelvis *"Sammanfattar innehåll från godkända medicinska
> källor med källhänvisning. Ersätter aldrig klinisk bedömning."* Den säger samma sak till
> användaren utan att göra ett anspråk som drar produkten mot MDR:s tillämpningsområde. Samma
> formulering bör sedan användas i `MODULPLAN.md` och `PITCH.md`, enligt avsnittets egen
> rekommendation om ett enhetligt "avsett ändamål".

**Rekommendation:** skriv en kort, explicit **"avsett ändamål"-förklaring** och använd exakt samma formulering i alla kundvända dokument. Förslagsvis i stil med: *ett verktyg för att lagra, söka i och distribuera vårdgivarens egna, av vårdgivaren godkända, styrdokument — inte avsett att ge vägledning för diagnos, behandling eller bedömning av enskild patient.* Det är den formuleringen en jurist kommer att vilja se, och den är ett bättre skydd än varje enskild teknisk spärr.

---

## 7. AI-förordningen — den största luckan i materialet

Ingen av de granskade filerna nämner AI-förordningen. Produkten har fyra AI-beroende funktioner i drift (dokumenttolkning, förrådsbildtolkning, stegförslag, klinikstöd-sökning) och en femte planerad. Detta är den tydligaste enskilda avsaknaden.

### 7.1 Uppdaterat rättsläge — viktigt, och nytt sedan v1

AI-förordningen (EU) 2024/1689 har ändrats genom den s.k. **Digital Omnibus on AI, förordning (EU) 2026/1744**, publicerad i EUT den 24 juli 2026 och i kraft sedan den 27 juli 2026. Den gällande tidslinjen är därmed:

| Vad | Tillämpligt från |
|---|---|
| Förbjudna metoder (art. 5) och AI-kunnighet (art. 4) | 2 februari 2025 — **gäller redan** |
| Skyldigheter för modeller för allmänna ändamål (GPAI) | 2 augusti 2025 — gäller redan (träffar Google, inte Synappsen) |
| **Transparenskrav (art. 50)** | **2 augusti 2026 — gäller sedan förra veckan** |
| Maskinläsbar märkning av AI-genererat innehåll (art. 50.2) | Uppskjuten till 2 februari 2027 för system som fanns på marknaden före 2 augusti 2026 |
| Nya förbjudna metoder som tillkom genom omnibusen | 2 december 2026 |
| Högrisksystem enligt bilaga III (fristående) | **Uppskjutet från 2 aug 2026 till 2 december 2027** |
| Högrisksystem enligt bilaga I (inbäddade i reglerade produkter, t.ex. medicintekniska) | **Uppskjutet från 2 aug 2027 till 2 augusti 2028** |

Uppgifterna är hämtade från externa källor (se källförteckningen sist) och bör verifieras mot förordningstexten innan de används i kundmaterial — men riktningen är entydig: **högriskreglerna har fått mer tid, transparenskraven har det inte.**

### 7.2 Rollbestämning

Synappsen är sannolikt **leverantör (provider)** av ett AI-system: produkten släpps ut på marknaden under eget namn med AI-funktionalitet inbyggd, även om modellen kommer från Google. Kunden är **tillhandahållare/deployer**. Google är leverantör av en GPAI-modell.

Att modellen är någon annans befriar alltså inte. Det är den vanligaste missuppfattningen i den här produktkategorin.

### 7.3 Riskklassificering — min preliminära bedömning: inte högrisk

- **Bilaga III p. 5 (tillgång till väsentliga tjänster, inkl. triagering vid larm):** relevant att beakta men sannolikt inte tillämplig — Synappsen triagerar inte patienter. **Om Etapp 64 någon gång skulle omfatta ett triageinstrument som appen *tillämpar* i stället för länkar till, ändras bedömningen.** Det är ännu ett skäl att hålla 64c.
- **Bilaga III p. 4 (anställning, arbetsledning):** förtjänar en närmare titt. Systemet innehåller kompetensmatris, kvitteringsgrad per person och statistik över mest aktiva användare. Så länge dessa är deterministiska beräkningar utan AI-inslag faller de utanför. **Men detta bör bli ett stående, dokumenterat krav: ingen AI-funktion får kopplas till bedömning, rangordning eller uppföljning av enskild personal.** Det är en gräns som är lätt att glida över med en välmenande "AI-sammanfattning av veckans aktivitet".
- **Art. 6.1 (produktsäkerhetsvägen):** om produkten någonsin kvalificerades som medicinteknisk med krav på anmält organ, blir AI-komponenten automatiskt högrisk. MDR-gränsen och AI-gränsen är alltså samma gräns, sedd från två håll.

### 7.4 Vad som gäller redan i dag

**Artikel 4, AI-kunnighet.** Gäller sedan februari 2025 för både leverantörer och deployers: personal som arbetar med systemet ska ha tillräcklig AI-kompetens i förhållande till sin roll. För leverantören är detta en kort intern dokumentation. För kunden är det ett krav som **bör ingå i införandematerialet** — och det är ett gratis säljargument. Att kunna leverera ett tvåsidigt utbildningsunderlag som hjälper kunden uppfylla art. 4 är differentierande mot varje konkurrent i samma storleksklass.

**Artikel 50, transparens — gäller sedan 2 augusti 2026.** Fysiska personer ska informeras när de interagerar med ett AI-system, och AI-genererat innehåll ska märkas. Produkten har redan mekaniken (`kalla: "gemini"`, obligatorisk mänsklig granskning, "Väntar på godkännande"-grinden). **[PK] Den avgörande frågan: syns det i gränssnittet för en läsare att en publicerad rutin ursprungligen kom från en AI-tolkning, eller är `kalla`-fältet bara ett internt datafält?** Om det senare, är detta den mest brådskande enskilda kodändringen i hela rapporten — inte för att den är svår, utan för att kravet redan gäller.

> **[PK KONTROLLERAD 2026-08-11 — bekräftad, och det är det senare alternativet.
> `kalla` är ett rent internt datafält.]**
>
> Spårningen genom koden, i tre led:
>
> 1. **Fältet sätts korrekt.** `kalla: "gemini"` skrivs på rutinutkastet i
>    `functions/ai-import.js:263` och på förrådsartiklar i `:196`.
> 2. **Fältet överlever publiceringen.** `godkannRutin()` (`src/hooks/useRutiner.js:117`)
>    uppdaterar bara `status`, `godkandAv`, `godkandAvNamn` och `godkandDatum` — `kalla`
>    rörs inte. Ursprungsinformationen finns alltså kvar på den publicerade rutinen. Det är
>    bra: **datat behövs inte skapas, bara visas.**
> 3. **Ingen läsarvänd komponent läser det.** Noll förekomster av `kalla` i `RutinKort.jsx`,
>    `Sektionssida.jsx`, `MarkdownInnehall.jsx` och `ForradArtikelKort.jsx`. Samtliga
>    Gemini-omnämnanden i gränssnittet rör budget (`BudgetSektion.jsx`), systemstatus
>    (`SystemstatusSektion.jsx`) eller själva uppladdningsflödet (`LaddaUpp.jsx`,
>    `RutinFormular.jsx`) — alltså synligt för **den som laddar upp**, aldrig för den som
>    senare läser den publicerade rutinen. Den enda kod som läser `kalla` alls är
>    `valkomstchecklista.js:21`, och den jämför mot `"verksamhetsmall"` för att räkna
>    importerade rutiner, inte för att visa ursprung.
>
> **Slutsats: rapportens bedömning står fast.** En medarbetare som läser en rutin i appen kan
> inte se att den ursprungligen tolkades fram av en AI ur ett fotograferat dokument. Kravet i
> artikel 50 gäller sedan 2 augusti 2026.
>
> **Åtgärden är liten** — en villkorad märkning i rutinvyn där `kalla === "gemini"`, med en
> kort förklarande text. Ingen datamigrering krävs, eftersom fältet redan finns på befintliga
> poster. Det som gör den brådskande är inte svårighetsgraden utan att kravet redan är i
> kraft. Notera att rapportens nyans i stycket nedan gäller fullt ut: att en människa har
> godkänt innehållet tar inte bort märkningsplikten, eftersom transparenskravet tar sikte på
> mottagarens möjlighet att veta — inte på kvalitetssäkringen av innehållet.

Notera nyansen: godkännandegrinden gör inte märkningen överflödig. Att en människa har godkänt innehållet ändrar att det är AI-genererat i ursprung, men förordningens transparenskrav tar sikte på mottagarens möjlighet att veta.

### 7.5 Rekommendation

Skapa `avtal/AI-FORORDNINGEN.md` — 3–4 sidor: rollbestämning, riskklassificering med motivering (inklusive varför bilaga III p. 4 och p. 5 inte träffar), förteckning över samtliga AI-funktioner med deras spärrar, hur art. 50-transparensen uppfylls, och ett kort avsnitt om vad kunden behöver göra som deployer. Detta är ett dokument varje upphandlare kommer att fråga efter från och med nu, och som praktiskt taget ingen konkurrent i storleksklassen har.

---

## 8. Cybersäkerhetslagen och NIS2

Cybersäkerhetslagen (2025:1506) trädde i kraft den 15 januari 2026 och genomför NIS2-direktivet i svensk rätt. Hälso- och sjukvård är en av de sektorer som omfattas, och regioner tillhör de mest kravtyngda entiteterna.

**Träffar den Synappsen direkt?** Sannolikt inte. Tillämpningsområdet bygger i huvudsak på storlekströsklar (i normalfallet minst 50 anställda eller över tio miljoner euro i omsättning), och en enskild firma utan anställda ligger långt under. Vissa kategorier av digitala tjänsteleverantörer omfattas oavsett storlek — men de kategorierna tar sikte på molntjänster, DNS och liknande infrastruktur, inte på en vertikal applikationstjänst. **Detta bör ändå bekräftas av jurist, eftersom svaret "nej" är ett bra svar att kunna ge med säkerhet.**

**Varför det ändå landar i knät på Synappsen:** en av NIS2:s tydligaste skärpningar gäller **säkerhet i leverantörskedjan**. En region som omfattas ska ställa säkerhetskrav på sina leverantörer, följa upp dem och kunna visa att den gjort det. I praktiken innebär det att Synappsen kommer att möta ett leverantörssäkerhetsformulär i varje upphandling från och med nu — med frågor om riskanalys, incidenthantering, säkerhetsuppdateringar, kryptering, åtkomstkontroll och kontinuitetsplanering.

**Den goda nyheten:** merparten av svaren finns redan skrivna, utspridda i `SAKERHETSRAPPORT.md`, `avtal/IT-FAKTABLAD.md` och `avtal/INCIDENTRESPONSPLAN.md`. Det som saknas är att de inte är samlade i ett format som matchar frågorna.

**Rekommendation:** ett kort **leverantörssäkerhetsblad** som besvarar den standarduppsättning frågor ett NIS2-påverkat inköp ställer. Två sidor, återanvänder befintligt material. Notera särskilt att kundens egen incidentrapportering enligt lagen har en tidig varning inom 24 timmar — vilket är **snävare än de 72 timmar leverantören lovar i PUB-avtalet**. Om en incident i Synappsen kan utlösa kundens NIS2-rapportering behöver leverantörens underrättelsetid för sådana händelser vara kortare än 72 timmar. Detta är en konkret konflikt mellan två av kundens regelverk som materialet inte har uppmärksammat.

---

## 9. Tillgänglighet

`TILLGANGLIGHETSREDOGORELSE.md` är genomarbetad, och analysen i den är korrekt på den viktigaste punkten: **DOS-lagen (2018:1937) riktar sig till den offentliga aktören, inte till leverantören.** Formellt är det regionen som ska publicera en tillgänglighetsredogörelse. Men utan leverantörens underlag kan kunden inte fullgöra sin skyldighet, och därför landar kravet i upphandlingen — vilket dokumentet också konstaterar.

Bedömningen att tillgänglighetsdirektivet (lag 2023:254) inte är tillämpligt, eftersom Synappsen är ett internt arbetsverktyg och inte riktas till konsumenter, framstår som välgrundad. Reservationen om omprövning vid ändrad målgrupp är korrekt formulerad.

**Nuläget:** delvis förenlig, med kvarstående brister på **WCAG nivå A** (punkterna 4–6 och 8–11, spårade som SYN-6). Grunden är stark — samtliga 27 sidor ger noll axe-core-överträdelser för två roller, och granskningen är numera en permanent regressionsspärr i CI.

**De tre riskerna:**

1. **Kvarvarande nivå A-brister.** I ett anbud är skillnaden mellan "delvis förenlig med brister på nivå AA" och "delvis förenlig med brister på nivå A" betydande. Nivå A läses som grundläggande.
2. **Redogörelsen är inte publicerad.** Dokumentet konstaterar det själv: en redogörelse som inte går att nå uppfyller inte kravet. Den föreslagna lösningen (`/tillganglighet`, länkad från hjälpsidan och inloggningssidan) är en liten produktändring som inte gjorts.
3. **`[FYLL I]`-fälten**, som väntar på bolagsbildningen (avsnitt 3.3) — ytterligare ett exempel på flaskhalsen.

**Ärligheten i "vad vi uttryckligen inte har testat" är rätt val**, inte en svaghet: ingen skärmläsartestning, ingen granskning vid 400 % zoom, ingen mätning av träffytor, ingen användartestning med personer med funktionsnedsättning. En upphandlare som ser den listan får förtroende för resten. **Men skärmläsartestet bör bokas** — det är den enda av punkterna där automatiserad testning notoriskt missar merparten av problemen, och `OPPNA-PUNKTER.md` har redan identifierat att det kan göras i samma pass som den bokade riktiga användaren.

---

## 10. Immaterialrätt

### 10.1 Ägandet av koden — hur risken faktiskt ser ut

Frågan är om arbetsgivaren kan göra anspråk på upphovsrätten till kod skriven av en anställd.

- **Lagen (1949:345) om rätten till arbetstagares uppfinningar** gäller patenterbara uppfinningar. Programvara som sådan är inte patenterbar i Sverige. Lagen är alltså i huvudsak irrelevant här.
- **40 a § upphovsrättslagen** är den bestämmelse som gäller: upphovsrätten till ett datorprogram som skapas av en arbetstagare **som ett led i arbetsuppgifterna eller efter instruktioner från arbetsgivaren** övergår till arbetsgivaren, om inget annat avtalats.

**Bedömningen:** risken är låg, eftersom det avgörande rekvisitet är kopplingen till arbetsuppgifterna. En undersköterska/undersköterskeliknande roll på en akutmottagning har inte systemutveckling i sina arbetsuppgifter, och har inte fått instruktioner att utveckla programvara. Utvecklingen har enligt underlaget skett på fritid, med egen utrustning och egen finansiering.

**Men bedömningen bygger helt på faktaunderlaget**, och faktaunderlaget måste kunna bevisas i efterhand — inte påstås. Prioriterat, i den ordningen:

1. **Commit-historik med tidsstämplar** som visar att arbetet skett utanför arbetstid. Detta är det starkaste enskilda beviset och det finns redan.
2. **Kvitton** på hårdvara, domäner, molnkostnader och verktyg, betalda privat.
3. **Kontoägarskap** — att GitHub-, Google Cloud- och övriga konton står i eget namn, inte i arbetsgivarens.
4. **Att ingen arbetsplatsinfrastruktur använts** — inte arbetsgivarens dator, nätverk, e-post eller licenser. En enda commit från en arbetsdator är det slags detalj som en motpart bygger ett helt argument kring.

**Att begära ett fribrev från arbetsgivaren rekommenderas inte** — det signalerar en osäkerhet som inte finns, och inbjuder till en prövning av en fråga som annars aldrig ställs. Bevarande av bevisning är rätt strategi.

### 10.2 Källbevakningen — den öppna ToS-frågan är större än den ser ut

`OPPNA-PUNKTER.md` listar "ToS-genomgång för källbevakningens sju källdomäner" under rubriken "tio minuter vid tangentbordet", med en ärlig not om att det tar längre än så. **Jag skulle placera den i en annan kategori helt.**

Källbevakningen hämtar automatiskt innehåll från sju externa webbplatser varje vecka, hashar det och jämför. Det aktualiserar tre separata frågor:

1. **Användarvillkor.** Många webbplatser förbjuder automatiserad hämtning i sina villkor. Att `robots.txt` respekteras är bra men löser inte villkorsfrågan — det är två olika saker.
2. **Databasskydd (49 § URL).** Ett skydd för sammanställningar som är resultatet av en väsentlig investering. Att systematiskt hämta från en kunskapsdatabas kan aktualisera det, även om det som lagras bara är en hash.
3. **Kommersiell användning.** Flera av källorna är offentligt finansierade kunskapsstöd som tillhandahålls för vårdens användning — inte nödvändigtvis för att ingå som en komponent i en kommersiell produkt. Det är en annan fråga än om innehållet får läsas.

**Riskbedömning:** låg sannolikhet, men obehaglig konsekvens. En källa som säger nej tvingar bort en domän ur produkten, vilket är en funktionsförlust. En källa som säger nej *efter* att en kund köpt modulen är värre.

**Rekommendation:** gör genomgången, dokumentera resultatet per domän i `SAKERHETSRAPPORT.md`, och **överväg att skriva till de två eller tre viktigaste källorna och fråga.** Ett skriftligt ja är värt betydligt mer än en tolkning av deras villkor — och för en offentligt finansierad källa är ett ja ofta lättare att få än man tror, eftersom användningen ligger i linje med deras eget uppdrag.

### 10.3 Etapp 64 — planen identifierar två av tre risker

`ETAPPLAN13.md` identifierar MDR och upphovsrätt korrekt. Den tredje risken behandlas inte:

- **Upphovsrätt (krav 26):** korrekt identifierad. Att bara lagra titel, utgivare, datum, URL och kategori — enforcerat strukturellt i databasreglerna via `hasOnly([...])`, inte som en konvention — är den rätta lösningen, och att spärren sitter i reglerna snarare än i en instruktion är precis rätt konstruktion.
- **MDR (krav 25):** korrekt identifierad, se avsnitt 6.
- **Varumärkesrätt — inte identifierad.** Namnen på nationella bedömningsinstrument kan vara registrerade varumärken. Att lagra ett namn i en metadatapost och länka till originalet är normalt tillåtet — men att marknadsföra "Synappsen med [instrumentnamn]" eller att presentera ett namngivet paket som en produktegenskap kan vara varumärkesanvändning. **Detta bör bli en femte fråga till juristen**, och det är särskilt relevant givet att beslutet 2026-08-11 innebär att paketen ska ha namn ("RETTS", "VÄST-A") och tilldelas per kund som en betald tjänst.

**En kompletterande observation om ansvarsbilden:** beslutet att göra tilldelningen leverantörsstyrd i stället för kundvald (64d) är motiverat med ansvarstydlighet. Juridiskt pekar det åt motsatt håll än vad planen antar. Ju mer leverantören själv väljer vad en enskild kund får se av kliniskt referensinnehåll, desto mer ser leverantören ut som en aktör som utövar ett eget omdöme om vad som är relevant för den vårdverksamheten — vilket är precis det som talar för kvalificering. **En kund som själv aktiverar ett paket är juridiskt en säkrare konstruktion än en leverantör som tilldelar det.** Detta bör tas upp med juristen som en uttrycklig fråga, inte förutsättas löst.

### 10.4 En reservation om scaffolding-beslutet

Att bygga strukturen före den juridiska bedömningen är motiverat med att ett konkret gränssnitt är lättare för en jurist att bedöma än ett koncept. Det argumentet är riktigt.

**Reservationen:** varje byggd struktur skapar ett tryck att fylla den. Spärrarna som finns (plattformsadmin-bara, `hasOnly`-begränsat schema, varningstext om att bara fiktiva poster får läggas in, ingen kundtoggle) är verkliga och verifierade med sju regeltester. Men de skyddar mot ett tekniskt misstag, inte mot ett beslut. **Rekommendation:** skriv in i `BESLUTSLOGG.md` att den första riktiga, namngivna posten kräver ett uttryckligt ägarbeslut med hänvisning till juristens svar — inte bara att spärren finns, utan vem som får ta bort den och på vilket underlag.

### 10.5 Innehåll kunden laddar upp

Kundens personal laddar upp bilder, PDF:er och skriver text. Två saker behöver stå i avtalet:

1. **Kunden garanterar att den har rätt till det innehåll som laddas upp**, och håller leverantören skadeslös vid anspråk från tredje part. Detta är standard och saknas i det jag kunnat se.
2. **Rättigheterna till innehållet stannar hos kunden.** Detta bör sägas uttryckligen — det är ett förtroendeargument, och tystnad tolkas till leverantörens nackdel.

En tredje punkt, mindre uppenbar: **leverantören bör uttryckligen avsäga sig rätten att använda kundens innehåll för att träna eller förbättra modeller.** Det är en fråga varje kund kommer att ställa från och med nu, och ett tydligt nej är ett säljargument.

### 10.6 Rättigheter till AI-genererat innehåll

Ett AI-genererat rutinutkast har sannolikt inget upphovsrättsligt skydd i sig, eftersom det saknar mänskligt skapande. Efter att en redaktör granskat, redigerat och godkänt det uppstår normalt skydd för den mänskliga insatsen. Praktiskt spelar det liten roll — men det är värt en mening i avtalet, eftersom det annars kan uppstå oklarhet om vad kunden faktiskt "äger" i sin egen kunskapsbank.

---

## 11. Produktansvar — det regelverk som ändrar bilden mest

Detta behandlas inte i något projektdokument och är enligt min bedömning, tillsammans med bolagsformen, den viktigaste punkten i rapporten.

**Nuläget:** produktansvarslagen (1992:18) ger strikt ansvar för personskada orsakad av säkerhetsbrist i en produkt. Fristående programvara har traditionellt ansetts falla utanför produktbegreppet — historiskt en fördel för mjukvaruleverantörer.

**Förändringen:** direktiv (EU) 2024/2853 upphäver 1985 års produktansvarsdirektiv och inkluderar uttryckligen programvara i produktdefinitionen. Den svenska utredningen (SOU 2025:103, *En ny produktansvarslag*) föreslår en ny lag som ska träda i kraft **den 9 december 2026** och ersätta 1992 års lag — alltså om cirka fyra månader. Enligt utredningen ska produktansvaret, till skillnad från i dag, gälla programvara som släppts ut på marknaden, och AI-system och AI-tjänster omfattas i den mån de utgör programvara eller en digital produkt, inklusive när de tillhandahålls som SaaS.

**Varför det spelar roll här, konkret:**

1. **Strikt ansvar** — den skadelidande behöver inte visa vårdslöshet, bara att produkten hade en säkerhetsbrist och att bristen orsakade personskadan.
2. **Ansvar enligt produktansvarsregler kan normalt inte avtalas bort.** Ansvarsbegränsningen i huvudavtalet (avsnitt 14) skyddar mot kundens avtalsanspråk — inte mot detta, och inte mot anspråk från en skadelidande som inte är avtalspart.
3. **Fortsatt kontroll förskjuter bedömningstidpunkten.** Om leverantören fortsätter styra produkten efter lansering — genom uppdateringar och en kopplad molntjänst — kan invändningen "bristen fanns inte när vi levererade" normalt inte användas för brister i programvaran eller i uteblivna säkerhetsuppdateringar under den period kontrollen varade. För en kontinuerligt uppdaterad PWA innebär det att kontrollen aldrig upphör.

**Scenariot som gör det verkligt:** en rutin visas felaktigt på grund av en bugg — fel version renderas, eller en arkiverad rutin syns i akutläget, en risk materialet självt tar upp. En vårdåtgärd blir fel. En patient skadas. Under det nya regelverket kan anspråket riktas mot leverantören, oavsett vad avtalet med kunden säger och oavsett att kunden ansvarar för innehållets riktighet.

**Detta är det starkaste enskilda argumentet mot enskild firma.** Vid enskild firma är det privatekonomin som möter anspråket.

**Rekommendationer, i prioritetsordning:**

1. **Ansvarsförsäkring med produktansvarsmoment, tecknad innan första skarpa användning.** Kontrollera uttryckligen att programvara omfattas och att vårdverksamhet inte är undantagen.
2. **Bolagisering** (avsnitt 3).
3. **Dokumenterad releaseprocess.** Bevisning om vad som testades före en release är den praktiska motvikten mot ett påstående om säkerhetsbrist. Här är projektet redan starkt — fullt testsvep per release, e2e-svit över alla rutter och roller, dokumenterad i utvecklingsloggen. **Det är en juridisk tillgång, inte bara en teknisk.** Se till att den bevaras och kan visas upp.
4. **Verifiera lagens slutliga utformning och ikraftträdande** när propositionen kommer — uppgifterna ovan bygger på utredningsförslaget.

---

## 12. Dataakten

Dataakten (EU) 2023/2854 innehåller i kapitel VI bestämmelser om byte mellan databehandlingstjänster: krav på avtalsvillkor om uppsägningstid, övergångsperiod, samarbete vid migrering och avveckling av bytesavgifter.

**Om en vertikal SaaS-produkt som Synappsen utgör en "databehandlingstjänst" i förordningens mening är inte självklart.** Definitionen tar sikte på tjänster som möjliggör allmänt tillgänglig, skalbar databehandling — vilket normalt syftar på IaaS/PaaS och bred horisontell SaaS, medan snäva applikationstjänster ofta bedöms falla utanför. Praxis är begränsad.

**Praktisk konsekvens oavsett svaret:** kraven i kapitel VI — exportformat, migreringsstöd, ingen inlåsning — är sådant en offentlig upphandlare kommer att kräva ändå. Synappsen har redan exportfunktionen och ett dokumenterat avetableringsflöde. **Att beskriva det i Dataakt-termer är billigare än att bli tillfrågad om det.**

**Rekommendation:** en fråga till juristen, och ett avsnitt i huvudavtalet om migrering vid uppsägning oavsett hur frågan besvaras.

---

## 13. Upphandling, jäv och bisyssla

### 13.1 LOU

En region får inte köpa vad som helst från vem som helst. Konsekvenserna av fel drabbar båda parter — men **ogiltigförklaring av avtalet drabbar leverantören hårdast**, eftersom en redan levererad tjänst då blir obetald.

| Väg in | Risk | Kommentar |
|---|---|---|
| Direktupphandling | Låg, om beloppet håller | Gränsen avser **hela myndighetens** inköp av samma slag under räkenskapsåret, inte per avdelning. En avdelningschef kan inte ensam avgöra att gränsen håller. Kontrollera aktuellt tröskelbelopp — det har justerats flera gånger |
| Avrop från befintligt ramavtal | Låg | Förutsätter att Synappsen finns på ett ramavtal. Det gör den inte |
| Annonserad upphandling | Låg risk, hög insats | Realistiskt vid regionkund; förutsätter SSO, WCAG utan förbehåll m.m. |
| **Otillåten direktupphandling** | **Hög** | Kan leda till att avtalet ogiltigförklaras och till upphandlingsskadeavgift för myndigheten |

**Den särskilda fällan i det här fallet:** en pilot som "bara är ett test" kan formellt vara ett upphandlingspliktigt inköp om den innebär betalning. En **kostnadsfri** pilot är enklare upphandlingsrättsligt, men skapar en annan risk — att leverantören senare anses ha deltagit i förberedelserna av upphandlingen och därmed haft en konkurrensfördel som kan behöva utjämnas, i värsta fall genom uteslutning.

**Rekommendation för pilotupplägget** — dokumentera skriftligt, innan piloten börjar, att:

1. piloten är kostnadsfri och tidsbegränsad,
2. den inte ger någon förtur i en framtida upphandling,
3. **leverantören inte deltar i utformningen av eventuellt framtida upphandlingsunderlag.**

Punkt 3 är den som annars kan diskvalificera hela affären senare, och den är lätt att bryta av misstag — genom att skicka över "ett förslag på kravspecifikation" i välvilja.

### 13.2 Jäv

Om leverantören är anställd hos den upphandlande myndigheten aktualiseras LOU:s bestämmelser om att myndigheten ska förebygga, identifiera och åtgärda intressekonflikter, samt förvaltningslagens jävsregler (16–18 §§ FL). Konsekvensen i praktiken: **varje person i beslutskedjan hos kunden som har en relation till leverantören måste hållas utanför handläggningen**, och detta bör dokumenteras aktivt av myndigheten — inte antas.

Notera också korruptionsdimensionen: brottsbalkens regler om givande och tagande av muta (10 kap. 5 a–5 e §§) träffar även förmåner som inte är pengar. Ett gratis system, en gratis pilot eller en generös licens till den egna arbetsgivaren är inte en muta i sig — men konstellationen "anställd ger sin egen arbetsgivare något av värde och får en affärsfördel tillbaka" är precis den som behöver vara dokumenterad och transparent från början.

### 13.3 Bisyssla

Tre saker kan aktualiseras samtidigt för en offentliganställd som driver näringsverksamhet riktad mot den egna arbetsgivarens sektor:

1. **Förtroendeskadlig bisyssla.** För kommun- och regionanställda regleras detta i kollektivavtalet **AB § 8**, som skiljer på förtroendeskadlig, arbetshindrande och konkurrerande bisyssla. Motsvarande princip för statligt anställda finns i 7 § lagen (1994:260) om offentlig anställning.
2. **Arbetshindrande bisyssla.** Mindre sannolikt relevant, men värt att vara medveten om vid ett skiftarbete.
3. **Jäv och upphandling.** Se ovan.

**Den kritiska punkten är inte att bisysslan finns, utan att den är anmäld, prövad och besvarad skriftligt.** En anmäld och godkänd bisyssla är en tillgång i förhandlingen. En oanmäld bisyssla som upptäcks under en upphandling är potentiellt förödande för både affären och anställningen. Ett muntligt "det är väl okej" är inte ett dokument som håller när frågan kommer upp två år senare i en överprövning.

> **✅ LÖST 2026-08-11: skriftligt godkännande erhållet.** Loggat i `BESLUTSLOGG.md`. Därmed
> faller åtgärdsplanens punkt A1, som rapporten beskrev som blockerande för all kommersiell
> aktivitet.
>
> **Två saker som INTE följer av detta, och som är lätta att blanda ihop:**
>
> 1. **Jäv och upphandling är separata frågor** (avsnitt 13.1–13.2). Att arbetsgivaren
>    accepterar att verksamheten bedrivs säger ingenting om huruvida ett *köp* från den egna
>    anställde är upphandlingsrättsligt hållbart. Den bedömningen görs av den upphandlande
>    myndigheten, inte av arbetsgivaren i egenskap av arbetsgivare — även när det är samma
>    organisation. Frågorna 14–16 till juristen kvarstår oförändrade.
> 2. **Beskedet är bevisning och behöver bevaras som sådan.** Spara det med datum,
>    avsändare och underskrift, tillsammans med den ansökan det besvarar. Ett godkännande
>    vars omfattning inte går att rekonstruera två år senare är svagare än det ser ut i dag —
>    särskilt om verksamhetens inriktning hinner ändras under tiden. Om Synappsen bolagiseras
>    (avsnitt 3) eller börjar rikta sig mot den egna arbetsgivaren, bör bisysslan anmälas på
>    nytt: det är en annan bisyssla än den som prövats.

### 13.4 Den strategiska slutsatsen

Materialets tidigare identifierade sekvensering — att sälja först till en icke-vårdkund (räddningstjänst, skiftbaserad industri) — är **juridiskt välmotiverad och inte bara en marknadsföringsidé**. Den vägen undviker MDR-frågan, patientdatalagen, DOS-lagen, jävsfrågan och upphandlingsfrågan på en gång, och ger en referenskund innan de svåra frågorna behöver besvaras.

**Om jag skulle rangordna en enda rekommendation i hela rapporten efter förhållandet mellan risk som elimineras och insats som krävs, är det den.**

Ett tillägg som v1 inte gjorde: även inom vården är **en annan region eller kommun än den egna arbetsgivaren** väsentligt enklare. Bisysslan finns kvar, men förtroendefrågan och jävsfrågan blir betydligt mindre skarpa, och upphandlingsrisken hanteras som en vanlig leverantörsrelation.

---

## 14. Avtalsrätt — vad huvudavtalet måste innehålla

Eftersom `avtal/ANVANDARVILLKOR.md` inte fanns i projektkunskapen är detta en kravlista, inte en granskning. Punkter markerade **[kritisk]** bör inte saknas i ett avtal med en betalande kund.

| Område | Vad som behövs |
|---|---|
| Parter, avtalsföremål | **[kritisk]** Juridiskt namn och org.nr — blockerat av avsnitt 3 |
| Tjänstebeskrivning | Vad som ingår per paket (Core/Operations/Intelligence/Källbevakning) och vad som inte gör det |
| **Avsett ändamål och avgränsning** | **[kritisk]** Se avsnitt 6.4. Uttryckligt: inte ett medicintekniskt beslutsstöd, inte ett journalsystem |
| Kundens ansvar för innehåll | **[kritisk]** Riktighet, aktualitet, klinisk korrekthet, rättigheter, och att patientuppgifter aldrig skrivs in |
| Tillgänglighet/SLA | Realistisk nivå. **Lova inte mer än en ensam näringsidkare kan hålla.** Ange planerade underhållsfönster och vad som inte räknas som avbrott |
| Support | Svarstider, kanaler, tider. Kopplas till incidentresponsplanens realistiska bemanning |
| **Ansvarsbegränsning** | **[kritisk]** Takbelopp (vanligen årsavgiften), undantag för indirekt skada och utebliven vinst. Notera: gäller inte grov vårdslöshet, uppsåt, eller produktansvar (avsnitt 11) |
| Immateriella rättigheter | Leverantören äger produkten, kunden äger sitt innehåll, ingen träning av modeller på kunddata |
| Personuppgifter | Hänvisning till PUB-avtalet, som bilaga |
| **Exit och dataportabilitet** | **[kritisk]** Format, tidsfrist, migreringsstöd, radering. Se avsnitt 12 |
| **Leverantörens upphörande** | **[kritisk]** Konkurs, sjukdom, dödsfall. Källkodsdeposition eller motsvarande. Den fråga varje kunds jurist ställer om en ensam leverantör |
| Ändring av tjänsten | Rätt att utveckla vidare; skyldighet att inte försämra väsentligt utan varsel |
| Underleverantörer | Rätt att byta, med underrättelse — synkat med PUB-avtalets underbiträdesmekanik |
| Pris och prisjustering | Indexklausul. Ett flerårigt offentligt avtal utan prisjusteringsmekanism är en förlustaffär |
| Force majeure | Inklusive molnleverantörsavbrott — leverantören kan inte garantera Googles drift |
| Uppsägning | Löptid, uppsägningstid, hävningsgrunder för båda parter |
| Tvistlösning | Svensk rätt, angiven domstol. Överväg om skiljeförfarande är olämpligt — det är dyrt för en liten part |

**En avtalsrättslig observation som är lätt att missa:** vid försäljning till offentlig sektor gäller ofta att myndighetens egna standardvillkor tillämpas, inte leverantörens. Att ha ett eget avtal är ändå nödvändigt — dels för mindre kunder, dels för att veta vilka avvikelser från myndighetens villkor som är förhandlingsbara och vilka som inte är det.

---

## 15. Marknadsföringsrätt

Marknadsföringslagen (2008:486) gäller även mellan näringsidkare. Marknadsföring ska vara vederhäftig, och den som gör ett påstående ska kunna styrka det.

`PITCH.md` har redan en dokumenterad disciplin på den här punkten — avsnittet "Ärlighet om vad som faktiskt är mätt", och versionsdriften mot `package.json` är numera spärrad av ett test. Det är rätt riktning. Två saker att vara uppmärksam på:

1. **Effektsiffror utan pilotdata.** Så länge de är uttryckligen märkta som uppskattningar är det hanterbart. Ett påstående av typen "sparar X minuter per pass" utan underlag skulle inte vara det.
2. **Säkerhetspåståenden.** "Patientdata blockeras i tre lager" är korrekt och styrkbart. "Patientdata kan inte hamna i systemet" vore det inte — och skillnaden mellan formuleringarna är precis den som DPIA-underlaget redan är noggrant med. **Se till att säljmaterialet håller samma standard som compliance-materialet.** Det är i säljmaterialet glidningen normalt sker.

---

## 16. Samlat riskregister

Sannolikhet och konsekvens är mina bedömningar mot dokumentationen, inte en försäkringsteknisk analys.

| # | Risk | Sannolikhet | Konsekvens | Samlad | Åtgärd |
|---|---|---|---|---|---|
| 1 | Personligt ansvar via enskild firma vid person- eller dataskada | Låg | **Mycket hög** | **Hög** | Bolagisering + försäkring (avsnitt 3, 11) |
| 2 | Produktansvar för programvara från 9 dec 2026 | Låg | **Mycket hög** | **Hög** | Försäkring, bolagisering, bevarad releasedokumentation |
| 3 | DSO stoppar affär på ej verifierad datalagringsregion | **Hög** | Medel | **Hög** | Tio minuter i Firebase-konsolen |
| 4 | Gemini utan regionsgaranti blockerar regionkund | Medel–hög | Hög | **Hög** | Migrering till Vertex AI |
| 5 | AI-förordningens art. 50 uppfylls inte i gränssnittet | **Hög — bekräftad i kod** | Medel–hög | **Hög** | **[PK] bekräftad 2026-08-11: `kalla` visas inte för läsaren.** Kodändringen är liten och kravet gäller redan — bör göras omgående (avsnitt 7.4) |
| 6 | Otillåten direktupphandling / jäv ogiltigförklarar avtalet | Låg–medel | **Mycket hög** | **Hög** | Dokumenterat pilotupplägg, skriftlig bisyssleprövning, annan kund först |
| 7 | Revisionslogg utan gallring underkänns vid granskning | Medel | Medel | Medel | Gallringstid + rättslig grund i avtalet. **Kodverifierat 2026-08-11:** kräver segmentering av hashkedjan — pseudonymisering i efterhand är omöjlig, se 4.4 |
| 7b | Referensunderlaget saknar minsta-n-spärr (personalpulsen har en) | Låg | Låg–medel | Låg–medel | **Hittad vid kodverifieringen 2026-08-11.** Samma tröskel som personalpulsen, se 4.1 |
| 8 | Patientuppgift skrivs in trots spärrar | Medel–hög | Medel | **Medel–hög** | Avtalsreglering + raderingsrätt + kundutbildning |
| 9 | Källa förbjuder automatiserad hämtning | Låg | Medel | Medel | ToS-genomgång, gärna skriftlig förfrågan |
| 10 | WCAG nivå A-brister blockerar i anbud | Medel | Medel | Medel | Stäng SYN-6, publicera redogörelsen |
| 11 | Etapp 64 kvalificerar som medicinteknisk | Låg–medel | **Mycket hög** | **Hög** | Extern bedömning före riktigt innehåll — redan planerat |
| 11b | MDR-argumentet för checklistläget vilar på en premiss som inte håller i koden | Låg (i praktiken) | **Hög** (argumentet faller vid granskning) | **Medel–hög** | **Hittad vid kodverifieringen 2026-08-11.** Rätta formuleringen omgående; överväg serverside-validering, se 6.2 |
| 12 | Varumärkesanspråk för namngivet instrumentpaket | Låg | Medel | Låg–medel | Femte fråga till juristen |
| 13 | Leverantören blir varaktigt oförmögen (sjukdom, dödsfall) | Låg | **Mycket hög** för kunden | **Medel–hög** | Källkodsdeposition, dokumenterad exitväg, avtalsklausul |
| 14 | Art. 30.2-förteckning saknas vid tillsyn | Låg | Låg | Låg | En timmes arbete |
| 15 | Kundens NIS2-rapportering på 24 h krockar med 72 h i PUB | Låg | Medel | Låg–medel | Kortare underrättelsetid för driftpåverkande incidenter |

---

## 17. Åtgärdsplan

### A. Innan någon kommersiell aktivitet alls

1. ~~**Slutför bisyssleanmälan och begär skriftligt besked.**~~ **✅ KLAR 2026-08-11** — skriftligt godkännande erhållet, loggat i `BESLUTSLOGG.md`. Spara beskedet som bevisning; anmäl på nytt vid bolagisering eller ändrad inriktning (avsnitt 13.3).
2. **Säkra bevisningen om kodägandet** — commit-historik, kvitton, kontoägarskap, ingen arbetsplatsinfrastruktur (avsnitt 10.1).
3. **Fatta beslut om bolagsform.** Rekommendation: aktiebolag före första betalande kund.

### B. Innan avtal med första betalande kund

4. **Verifiera Firestore- och Storage-regionen** i konsolen och för in svaret i `avtal/UNDERBITRADEN.md` och `avtal/IT-FAKTABLAD.md`. *(Tio minuter, öppet i sex veckor.)*
5. **Teckna ansvarsförsäkring** med produktansvarsmoment, kontrollerat mot programvara och vårdverksamhet.
6. **Låt jurist granska PUB-avtalet och huvudavtalet.** Lägg till tystnadsplikt, upphörandeklausul, ansvarsbegränsning, exit.
7. **Skriv art. 30.2-förteckningen.** En timme.
8. **Åtgärda revisionsloggens gallring** — avtalstext plus teknisk gallring. **Uppdaterat efter kodverifiering:** pseudonymisering i efterhand är utesluten; gallringen måste ske genom segmentering av hashkedjan. Föreslagen tid: 3 år som huvudregel, 5 år för säkerhetsrelevanta händelsetyper, legal hold vid pågående incident eller tvist. Skilj gravstenen från kedjan i PUB-avtalets text (avsnitt 4.4).
9. ~~**[PK] Kontrollera AI-transparensen i gränssnittet**~~ **✅ KONTROLLERAD 2026-08-11 — brist bekräftad.** `kalla` är ett rent internt fält och visas aldrig för läsaren. **Åtgärda: lägg till en synlig märkning i rutinvyn.** Liten ändring, inget datat saknas, och kravet gäller sedan 2 augusti 2026 (avsnitt 7.4). Detta är den mest brådskande enskilda kodändringen i rapporten.
10. **Fyll i `INCIDENT-CHECKLISTA.md`s tre tomma kontaktrader**, inklusive ett faktiskt namn för juridiskt stöd.
11. **Skriv "avsett ändamål"-formuleringen** och synkronisera den över `PITCH.md`, avtal och gränssnitt. **Kodverifierat:** börja med `src/components/KlinikfragaSok.jsx:92`, som är den enda kundvända förekomsten av ordet "beslutsstöd" (avsnitt 6.4).
11b. **Lägg till minsta-n-spärr i `exporteraReferensunderlag`** — samma tröskel som personalpulsen redan har. Liten ändring, hittad vid kodverifieringen (avsnitt 4.1).

### C. Innan regionkund

12. **Migrera AI-anropen till Vertex AI** med regional endpoint.
13. **Stäng WCAG nivå A-bristerna (SYN-6)** och publicera tillgänglighetsredogörelsen på `/tillganglighet`.
14. **Boka skärmläsartestet** — gärna i samma pass som den bokade riktiga användaren.
15. **Skriv `avtal/AI-FORORDNINGEN.md`** och leverantörssäkerhetsbladet för NIS2-frågorna.
16. **Aktivera App Check-enforcement** när verifieringsgraden tillåter.
17. **Bygg SSO (Etapp 58)** — protokollbeslutet är fattat, bygget väntar på kund.

### D. Innan Etapp 64 byggs med riktigt innehåll

18. **Kommissionera den externa juridiska bedömningen** med planens fyra frågor plus varumärkesfrågan plus frågan om leverantörsstyrd tilldelning (avsnitt 10.3).
19. **Skriv in svaren i `SAKERHETSRAPPORT.md`** innan något publiceras — planen kräver redan detta.
20. **Lägg till ett uttryckligt ägarbeslutssteg** för den första riktiga posten (avsnitt 10.4).

### E. Innan källbevakningen säljs som modul

21. **Genomför ToS-genomgången** för de sju domänerna, dokumentera per domän, och överväg skriftlig förfrågan till de viktigaste.

---

## 18. Frågor att ställa till anlitad jurist

Formulerade för att kunna klippas in i ett uppdragsbrev. De sex första är de som blockerar mest.

**MDR och medicinteknik**

1. Kvalificerar Synappsen i sin nuvarande form — sökbar databas över kundens egna godkända rutiner, checklistläge utan beräkning, domänbegränsad sökning som sammanfattar externa auktoritativa källor med källhänvisning — som medicinteknisk produkt enligt MDR art. 2(1) och MDCG 2019-11?
   **Tillägg efter kodverifiering:** spelar det roll för svaret att checklistestegens fältuppsättning upprätthålls i klientgränssnittet snarare än i databasreglerna (se avsnitt 6.2)? Alltså: räcker det att produkten *inte* räknar, eller behöver det vara tekniskt omöjligt att den räknar?
2. Ändras svaret av ett baspaket enligt `ETAPPLAN13.md` (metadata plus länk, ingen reproduktion, ingen beräkning), där leverantören centralt curerar innehållet och **tilldelar** namngivna paket per kund?
3. Påverkar formuleringar i marknadsföringsmaterial ("beslutsstöd") kvalificeringsbedömningen, och vilken formulering av avsett ändamål rekommenderas?

**Upphovsrätt och varumärke**

4. Får innehållet i ett namngivet bedömningsinstrument återges i produkten, eller enbart länkas? Svaret kan skilja sig per instrument.
5. Utgör användning av instrumentens namn i produktsammanhang varumärkesintrång?
6. Är automatiserad veckovis hämtning och hashning av sju namngivna svenska medicinska källor förenlig med deras användarvillkor och med skyddet för databaser enligt 49 § URL?

**Bolag, ansvar och försäkring**

7. Vilka konkreta risker bär näringsidkaren personligen i dag, och vilka bortfaller vid bolagisering?
8. Hur påverkar den föreslagna nya produktansvarslagen (SOU 2025:103, ikraft 9 december 2026) ansvarsbilden för en SaaS-leverantör till vården, och vilket försäkringsskydd är adekvat?
9. Vilka avtalsklausuler kan begränsa ansvaret, och vilka går inte att begränsa?

**Dataskydd**

10. Är rollfördelningen (kunden ansvarig, leverantören biträde) korrekt även för referensunderlag, aggregerad statistik och supportärenden?
11. Är påståendet att revisionsloggen aldrig raderas förenligt med art. 5.1 e, och vilken gallringstid är försvarbar?
12. Vilken dokumentation krävs för överföringar till Google, och räcker Googles standardvillkor eller behövs en egen transferanalys?
13. Vilken rättslig grund och vilka förfaranden (inklusive 11 § MBL) bör rekommenderas kunden för den personuppföljning systemet möjliggör?

**Upphandling och anställning**

14. Under vilka förutsättningar kan en region köpa Synappsen från en egen anställd utan att avtalet riskerar ogiltigförklaring?
15. Hur bör en kostnadsfri pilot dokumenteras för att inte diskvalificera leverantören i en senare upphandling?
16. Vilken bisysslebedömning gäller enligt AB § 8 för en verksamhet som säljer till den egna arbetsgivarens sektor, och vad bör det skriftliga beskedet innehålla?

**Övrigt**

17. Omfattas Synappsen av Dataaktens kapitel VI om byte av databehandlingstjänst?
18. Omfattas leverantören av cybersäkerhetslagen (2025:1506), och vilka leverantörskrav bör förväntas från en kund som omfattas?
19. Är riskklassificeringen enligt AI-förordningen — inte högrisk — korrekt, och uppfylls art. 50 av dagens märkning och godkännandeflöde?

---

## 19. Vad jag inte har kunnat bedöma

- **Koden — delvis åtgärdat 2026-08-11.** De fyra **[PK]**-markerade punkterna är nu kontrollerade mot faktisk kod (avsnitt 21). **Övriga påståenden om vad produkten gör bygger fortfarande på dokumentationen** och är inte kodverifierade — det gäller bland annat hela avsnitt 4.6 (säkerhetsåtgärderna), 5.1 (PII-spärrarnas tre lager) och 6.2 (funktionsvis MDR-bedömning). Att fyra punkter kontrollerats gör alltså inte rapporten som helhet kodverifierad.
- **B2B-villkoren.** `avtal/ANVANDARVILLKOR.md` fanns inte i projektkunskapen; avsnitt 14 är en kravlista, inte en granskning.
- **Faktiska avtalsvillkor med Google, Sentry och Brevo.** Bedömningen bygger på vad förteckningen säger, inte på avtalstexterna.
- **Innehållet i det instrument som nämns som exempel för Etapp 64.** Jag har ingen verifierad kunskap om det och gissar inte — samma hållning som planen själv intar.
- **Om det finns en försäkring i dag.** Materialet nämner ingen; frånvaron av en rad i `INCIDENT-CHECKLISTA.md` om extern incidentkompetens antyder att det inte finns.
- **Exakta tröskelbelopp, paragrafnummer och ikraftträdanden.** Där jag varit osäker har jag skrivit det i stället för att ange en siffra. Uppgifterna om AI-förordningens tidslinje, den nya produktansvarslagen och cybersäkerhetslagen bygger på externa källor kontrollerade 2026-08-11 (se nedan) och bör verifieras mot författningstext innan de används i kundmaterial.

---

## 20. Vad som ändrats sedan version 1

Sju punkter, i samma anda som `ETAPPLAN13.md`s egen granskningssektion. De tre första är sakfel eller inaktualiteter i v1.

1. **AI-förordningens tidslinje var inaktuell.** v1 redovisade osäkerhet om huruvida tidplanen förskjutits och avstod från att ta ställning. Den har förskjutits: Digital Omnibus on AI, förordning (EU) 2026/1744, i kraft 27 juli 2026, flyttar bilaga III-högrisk till 2 december 2027 och bilaga I-högrisk till 2 augusti 2028 — men **artikel 50 gäller från 2 augusti 2026**, alltså redan. v1:s praktiska slutsats (transparens är den relevanta frågan i dag) var rätt; skälet var ofullständigt. Se avsnitt 7.1.
2. **Produktansvarets svenska genomförande var obestämt i v1.** Det finns nu ett utredningsförslag, SOU 2025:103, med föreslaget ikraftträdande 9 december 2026 och uttryckligt inkluderande av programvara och SaaS. Det gör risken konkret och daterad i stället för avlägsen. Se avsnitt 11.
3. **NIS2 var beskrivet som kommande.** Cybersäkerhetslagen (2025:1506) trädde i kraft 15 januari 2026. Dessutom identifieras här en konflikt v1 missade: kundens tidiga varning inom 24 timmar mot leverantörens utfästelse om 72 timmar. Se avsnitt 8.
4. **En osäker paragrafhänvisning har tagits bort.** v1 angav ett specifikt lagrum i 4 kap. LOU för intressekonflikter. Jag är inte säker på numret och har skrivit om till en beskrivning av bestämmelsen i stället. Ett felaktigt lagrum i ett underlag till en jurist är värre än inget lagrum.
5. **Tillagt: 11 § MBL och personuppföljningen.** v1 behandlade inte att systemets aktivitetsspårning är kontroll av arbetstagare och utlöser förhandlingsskyldighet hos kunden. Det är en införandeblockerare, inte en juridisk kuriositet. Se avsnitt 4.2.
6. **Tillagt: kopplingen till kundens ledningssystem** enligt patientsäkerhetslagstiftningen — både som säljargument och som skäl att beskriva offlineläget som en patientsäkerhetsfunktion. Se avsnitt 5.3.
7. **Motsatt bedömning på en punkt:** v1 accepterade utan invändning att leverantörsstyrd tilldelning av baspaket ger tydligare ansvarsbild. Jag menar att det juridiskt pekar åt motsatt håll — ju mer leverantören väljer åt kunden, desto mer ser leverantören ut att utöva ett kliniskt relevant omdöme. Se avsnitt 10.3. Detta är en fråga till juristen, inte en slutsats.

---

## 21. Kodverifiering av [PK]-punkterna (2026-08-11)

Rapportens avsnitt 0 markerade fyra slutsatser som beroende av ett tekniskt faktum som inte
kunnat kontrolleras, med kravet att en premisskontroll skulle göras innan de används mot en
kund, en upphandlare eller en tillsynsmyndighet. Kontrollen är nu gjord mot faktisk kod i
v5.98.0. Resultatet är inarbetat på plats i respektive avsnitt; det här är sammanställningen.

### 21.1 Utfall

| Punkt | Rapportens farhåga | Utfall | Var det står |
|---|---|---|---|
| **7.4** | Är AI-ursprunget synligt för läsaren, eller är `kalla` bara ett internt fält? | ❌ **Bekräftad — bristen finns.** `kalla` visas aldrig för en läsare | Avsnitt 7.4 |
| **6.4** | Används ordet "beslutsstöd" i kundvänt material? | ❌ **Bekräftad**, men bara på **en** rad i gränssnittet | Avsnitt 6.4 |
| **4.1** | Kan referensunderlaget återidentifieras via små områden och rollkombinationer? | ✅ **Avfärdad** — de dimensionerna exporteras inte alls. Men en angränsande brist hittades: ingen minsta-n-spärr | Avsnitt 4.1 |
| **4.4** | (Rapportens egen rekommendation om pseudonymisering) | ⚠️ **Rekommendationen var felaktig** — tekniskt omöjlig mot hashkedjan | Avsnitt 4.4 |
| **6.2** | *(Ej [PK]-markerad, kontrollerades ändå)* Är checklistesteget strukturellt begränsat i datamodellen? | ❌ **Premissen håller inte.** Spärren sitter i klientformuläret, inte i regellagret | Avsnitt 6.2 |

Att den femte punkten — den som inte var markerad — visade sig vara den allvarligaste säger
något om markeringarnas träffsäkerhet: rapporten markerade de påståenden den kände sig osäker
på, men missade att den var mest säker på fel ställe. Det talar för att kontrollera de
tekniska premisser som bär tyngst juridisk vikt, snarare än de som författaren råkade tveka
inför.

### 21.2 Den viktigaste lärdomen: granskningsdokumentet hade fel, inte koden

Projektets premisskontrollkrav (genomgående krav 8) finns för att planer och dokument
återkommande visat sig avvika från vad koden gör. Den här kontrollen visade det motsatta
mönstret, och det är värt att notera uttryckligen: **koden var korrekt och rapporten hade
fel.**

Rapportens avsnitt 4.4 rekommenderade att revisionsloggen skulle pseudonymiseras efter en
tid, med motiveringen att "kedjans integritet bevaras". Kedjan är konstruerad för att
upptäcka precis den operationen som manipulation. Hade rekommendationen genomförts utan
kontroll hade resultatet blivit ett nattligt manipulationslarm för varje drabbad
organisation — alltså en försämring av exakt den kontroll åtgärden avsåg att värna, i syfte
att uppfylla ett krav som kunde ha uppfyllts på ett annat sätt.

Slutsatsen för hur rapporten ska användas: **en juridisk rekommendation som föreskriver en
teknisk lösning behöver kontrolleras mot koden på samma sätt som ett tekniskt påstående
behöver kontrolleras mot juridiken.** Den anlitade juristen bör få veta att den här
kontrollen gjorts, och att rekommendationer om *hur* något ska lösas tekniskt bör lämnas som
krav på utfall snarare än som föreskriven metod.

### 21.3 Vad kontrollen inte omfattade

Fyra punkter kontrollerades — de som var markerade. Rapportens övriga tekniska påståenden är
**inte** verifierade, och några av dem bär tung juridisk vikt:

- **Avsnitt 4.6 (artikel 32-åtgärderna).** Behörighetsstyrning i databasreglerna,
  organisationsisolering, hashkedjans dagliga kontroll, supportåtkomstens tidsbegränsning.
  Dessa används som argument utåt och förtjänar en egen genomgång. *Delvis styrkt av annat
  underlag:* den breda kodgranskningen samma dag (se `GRANSKNING-2026-08-11.md` och
  `SAKERHETSRAPPORT.md`s tillägg) gick igenom regellagret och hittade två verkliga
  behörighetshål, båda åtgärdade — vilket både bekräftar att lagret finns och att det inte
  var felfritt.
- **Avsnitt 5.1 (PII-spärrarnas tre lager).** Hela PDL-gränsdragningen vilar på dem. *Not:*
  samma kodgranskning hittade att `sokloggar` saknade personnummerspärren som alla andra
  fritextfält har — ett fjärde ställe där lagret inte var heltäckande. Åtgärdat, men det
  motiverar en systematisk genomgång snarare än stickprov.
- **Avsnitt 6.2 (funktionsvis MDR-bedömning) — kontrollerades ändå, och premissen höll inte.**
  Se rutan i 6.2. Steg-arrayens nyckeluppsättning är inte spärrad i regellagret, bara i
  klientformuläret. Detta är rapportens allvarligaste sakfel, eftersom den premissen bär hela
  MDR-argumentet för checklistläget. Övriga funktionsrader i 6.2:s tabell är fortfarande
  okontrollerade.

### 21.4 Vad som kan lyftas ut till kundmaterial

Rapporten är internt material (se rutan överst). Följande avsnitt kan omarbetas till
kundvänt underlag utan att avslöja bolags-, bisyssle- eller jävsbedömningarna:

- **Avsnitt 2 (rättskartan)** — vem träffas av vad. Rapporten noterar själv att den är ett
  säljargument, eftersom en kund som förstår sitt eget ansvar snabbare kan säga ja.
- **Avsnitt 5.3 (kopplingen till kundens ledningssystem)** — det starkaste säljargumentet i
  materialet, och det används inte i dag.
- **Avsnitt 4.6 (säkerhetsåtgärderna)** — särskilt att leverantören saknar stående
  läsåtkomst till kundens innehåll, vilket få konkurrenter kan påstå.
- **Avsnitt 8** — underlaget till det leverantörssäkerhetsblad NIS2-påverkade inköp kommer
  att kräva.

Avsnitt 3, 10.1, 11 och 13 ska **inte** lämna det interna materialet i någon form.

---

---

## Källor för de externa faktakontrollerna (2026-08-11)

Uppgifterna om AI-förordningens ändrade tidslinje, den nya produktansvarslagen och cybersäkerhetslagen har kontrollerats mot följande allmänt tillgängliga källor. Övriga bedömningar bygger på projektkunskapen och på allmän rättskunskap, och är inte källbelagda.

- Cooley, *Digital AI Omnibus Delays Key Deadlines, Introduces New Rules* — om förordning (EU) 2026/1744, publicering 24 juli 2026, ikraftträdande 27 juli 2026.
- Freshfields, *EU AI Act unpacked #34: The final Digital Omnibus on AI* — om parlamentets och rådets antagande i juni 2026.
- Secure Privacy, *EU AI Act Digital Omnibus: The New High-Risk AI Deadlines After Council Approval* — om de nya datumen 2 december 2027 respektive 2 augusti 2028.
- Plesner, *AI Act August 2026* — om att artikel 50 och bilaga III-skyldigheterna gällde från 2 augusti 2026 enligt den ursprungliga tidslinjen.
- aiacto, *Digital Omnibus: AI Act High-Risk Rules Delayed to 2027?* — om uppskjutningen av artikel 50.2 till 2 februari 2027 för system som fanns på marknaden före 2 augusti 2026.
- SOU 2025:103, *En ny produktansvarslag* (riksdagen.se) samt Gulliksson, *Den nya produktansvarslagstiftningen* — om programvara och SaaS i produktbegreppet och ikraftträdande 9 december 2026.
- CGI och PwC om cybersäkerhetslagen (2025:1506), ikraftträdande 15 januari 2026, samt om leverantörskedjekraven.

---

*Rapporten är skriven för att kunna läsas av en jurist utan förkunskap om projektet, och av ägaren utan juridisk förkunskap. Där de två behoven krockat har jag valt precision framför enkelhet, och skrivit ut resonemanget i stället för att bara ange slutsatsen.*

*Avsnitt 21 och de inarbetade `[PK KONTROLLERAD]`-rutorna tillkom 2026-08-11 efter en
kontroll mot faktisk kod. Övrigt innehåll är oförändrat från v2.*
