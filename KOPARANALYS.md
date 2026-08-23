# Synappsen sedd från köparens stol

**Oberoende attraktivitetsbedömning · 2026-08-23 · segment: privat vårdgivare**

> **Vad det här dokumentet är.** En bedömning av om en privat vårdgivare skulle vilja köpa
> Synappsen, gjord utifrån köparens intressen och inte säljarens. Det är medvetet inte en
> uppdatering av `MARKNADSANALYS.md` (2026-08-17) eller
> `KOSTNADSKALKYL-OCH-PRISSATTNING.md` (2026-08-19) – de är produktcentrerade och
> prislistecentrerade, och båda är bra. Det här dokumentet ställer en annan fråga: vad ser
> personen som ska skriva under, och varför skulle hen låta bli?
>
> **Metoddisciplin, lånad från projektets övriga underlag:** allt som är hämtat ur
> projektkunskapen har källfil. Allt externt är källbelagt i avsnitt 14. Allt som är min egen
> bedömning är märkt **[bedömning]**. Underlaget är kodläge per `CLAUDE_STATUS.md`
> 2026-08-23 (v5.128.0, deployad, körning #87), inklusive antagen roadmap.

---

## 1. Sammanfattning

Fem slutsatser, i den ordning de påverkar beslut.

**1. Produkten är attraktiv för en person i verksamheten, och obekväm för tre andra.**
Kvalitetschefen/chefläkaren får något hen faktiskt saknar och kan försvara uppåt. Personalen
får ett verktyg som är märkbart bättre än pärmen – men först när det finns innehåll i det.
Verksamhetschefen ser en kostnad utan bevisad besparing. IT/dataskydd ser en ensam
leverantör. **Affären avgörs av om kvalitetschefen orkar bära de andra tre.** Säljmaterialet
riktar sig idag mest till verksamhetschefen, vilket är den svåraste av de fyra.

**2. Priset är inte problemet. Förstaårskostnaden är.** Listpriset 39 000 kr är rimligt och
lätt att försvara. Men köparens verkliga förstaårskostnad är abonnemang + uppstartsavgift +
moms + egen personaltid, alltså storleksordningen **95 000–115 000 kr för en enhet på 80
anställda** **[bedömning, se avsnitt 7]**. Det är två till tre gånger den siffra som står i
offerten, och det är den siffran en ekonomichef räknar fram själv. Att inte äga den
beräkningen först är den enskilt största onödiga risken i säljprocessen.

**3. Paketeringen sätter det starkaste köpargumentet bakom fel prisnivå.** Innehållshälsan är
produktens tydligaste differentiering och den enda funktion som gör en kvalitetschef till
köpare i stället för åskådare. Den ligger i **Drift (59 000 kr)**, inte i Kärna. Ingångspaketet
är alltså den version av produkten som saknar skälet att köpa den. Det är ett paketeringsfel,
inte ett prisfel, och det kostar ingenting att rätta.

**4. Kallstarten, inte konkurrensen, är det som dödar affärer.** Synappsen konkurrerar inte
mot Centuri – den konkurrerar mot att kunden inte hinner fylla den. En tom app är värdelös,
och arbetet med att göra den icke-tom ligger idag hos kunden. Fotoimport och startbibliotek
mildrar det men är oprövade i skarpt läge. **Det här är den invändning som inte sägs högt utan
i stället yttrar sig som att köparen slutar svara efter ett bra demo.**

**5. Ja, någon skulle teckna avtal – men färre och långsammare än kandidatlistan antyder.**
Min bedömning: av tio väl bearbetade A-kandidater tackar tre till fem ja till en pilot, och
en till två blir betalande inom tolv månader **[bedömning, ingen data finns]**. Den
begränsande faktorn är inte produktens kvalitet utan säljarens tid och kundens
införandekapacitet.

---

## 2. Så här har bedömningen gjorts

Fyra köparroller definierades utifrån hur ett inköpsbeslut faktiskt går till hos en privat
vårdgivare med 25–300 anställda. Produkten bedömdes separat mot varje roll: vad rollen vinner,
vad den riskerar, och vad som skulle få just den att säga nej. Därefter räknades köparens
totala förstaårskostnad, inte listpriset. Slutligen kontrollerades tre externa förutsättningar
som ändrats eller kan ha ändrats sedan `MARKNADSANALYS.md` skrevs den 17 augusti.

**Vad som inte gjorts:** ingen verklig köpare har intervjuats. Det är den enda metod som
skulle göra det här dokumentet till något annat än en välinformerad gissning, och den saknas
av samma skäl som allt annat i projektet saknar mätdata – det finns ingen kund. Läs
bedömningen som en hypotes att testa i första säljmötet, inte som ett resultat.

---

## 3. Köparen är fyra personer, inte en

| Roll | Vad hen egentligen frågar sig | Hur Synappsen landar |
|---|---|---|
| **Ägare / VD / verksamhetschef** – betalar | "Vad får jag som jag inte redan har, och kan jag räkna hem det?" | Svagast. Nyttan är real men svår att kvantifiera utan pilotdata. |
| **Kvalitetschef / chefläkare / MAS** – äger problemet | "Kan jag visa att våra rutiner är aktuella och lästa när någon frågar?" | **Starkast.** Innehållshälsa + läskvittering + revisionslogg är precis det underlaget. |
| **Personalen** – avgör om det används | "Är det snabbare än att fråga en kollega?" | Starkt i teorin, helt beroende av innehåll och av att slippa ännu ett lösenord. |
| **IT / dataskyddsombud** – har veto | "Vad händer om leverantören försvinner, och var hamnar data?" | Ovanligt välförberett för storleken – men leverantörsrisken kvarstår. |

**Den praktiska konsekvensen:** säljmaterialet i projektet (`PITCH.md`, demomanuset,
invändningshanteringen) är skrivet mot verksamhetschefen. Det är den roll som har svårast att
säga ja, eftersom hen betalar för en nytta hen inte själv upplever. Kvalitetschefen upplever
smärtan varje gång en extern revision eller ett IVO-ärende kommer, och har dessutom ofta egen
budget för kvalitetsarbete. **Byt primär mottagare i materialet.** Kandidatlistans egen
ingångsvinkel för Carlanderska säger redan det rätta ("kvalitetschefen är den som köper") –
men det är ett undantag i listan, inte regeln.

---

## 4. Är den attraktiv? Betyg per roll

Skala 1–5, där 3 betyder "tillräckligt bra för att inte fälla affären". Genomgående
**[bedömning]**.

| Roll | Betyg | Kort motivering |
|---|---|---|
| Kvalitetschef / chefläkare | **4** | Får ett bevisunderlag som inte finns i SharePoint. Dras ned av att kärnfunktionen ligger i mellanpaketet. |
| Personalen | **4** vid fyllt innehåll, **1** vid tomt | Sök, akutläge och offline är genuint bra. Utan innehåll är produkten en tom app med inloggning. |
| IT / dataskyddsombud | **3** | Faktabladet, PII-spärren och isoleringstesterna är starka. Ensam leverantör, inget pentest, inget SSO drar ned. |
| Ägare / verksamhetschef | **2–3** | Rimligt pris, obevisad avkastning, verklig förstaårskostnad högre än offerten antyder. |
| **Sammanvägt köpbeslut** | **3** | Köps av rätt person i rätt läge. Köps inte av en genomsnittlig verksamhet i ett genomsnittligt läge. |

**Betyg 3 är ett ärligt betyg och ett säljbart betyg.** Det betyder att produkten inte säljer
sig själv, men att den inte heller har någon enskild dödsdefekt. Det som avgör är vem som
kontaktas och när.

---

## 5. Vad som faktiskt gör den lockande

Rangordnat efter hur mycket det påverkar ett köpbeslut, inte efter hur mycket arbete som
ligger bakom.

**1. Den finns. Färdig, installerbar, demonstrerbar på trettio sekunder.**
Underskattat i projektets eget material, som beskriver produkten som funktionslista. En köpare
som fått tre säljmöten om system som "kommer i nästa release" reagerar starkt på en app som
går att lägga i handen och söka i. Demomiljön (Etapp 51) med nattlig nollställning gör att
detta kan göras riskfritt hos vem som helst. **Det här är den mest undersålda tillgången i
hela produkten.**

**2. Systemet innehåller inga patientuppgifter – och det går att styrka tekniskt.**
Detta är den snabbaste genvägen till ett ja som finns i produkten. Den tar bort DPIA-arbetet i
praktiken, kortar dataskyddsombudets granskning från veckor till ett läsande av ett faktablad,
och gör att frågan "vad händer om det läcker" har ett svar som inte skrämmer. Tre lager av
spärr, varav ett i databasreglerna, är mer än de flesta leverantörer i klassen kan visa.

**3. Bevisunderlaget: innehållshälsa, läskvittering, revisionslogg.**
Ingen av de svenska konkurrenterna svarar på frågan "vilka av våra rutiner saknar ägare, är
utgångna eller aldrig kvitterade" med en siffra och en åtgärdsknapp. Det är produktens enda
genuint unika sak. Formuleringen i `ETAPPLAN6.md` – *"en kunskapsbank som ruttnar inifrån ser
precis likadan ut som en välskött"* – är bättre säljtext än något som står i `PITCH.md`.

**4. Det färdiga IT- och avtalspaketet.**
För en privat klinik utan IT-avdelning är PUB-avtalsmall, underbiträdesförteckning,
DPIA-underlag och IT-faktablad inte en formalitet – det är arbete de inte vet hur de ska göra.
Att få det färdigskrivet av leverantören är en verklig, konkret gåva i förhandlingen.

**5. Ärligheten om vad som inte finns.**
Fungerar, men bara på en köpare som är van vid att bli sålt till. En mindre erfaren köpare kan
läsa samma lista som en varningsflagga. Använd den tidigt och muntligt, inte som en bilaga att
läsas ensam.

**6. Priset ligger under direktupphandlingsgränsen, och det finns ingen inlåsning.**
Export av all data, egen administratör som kan pausa och ändra utan leverantören. Det gör
beslutet mindre irreversibelt, vilket sänker upplevd risk mer än en rabatt gör.

---

## 6. Vad som gör den mindre lockande

Rangordnat efter hur ofta det sannolikt fäller affären.

**1. Kallstarten. Kunden måste själv göra produkten värdefull.**
Detta är den avgörande svagheten och den syns inte i någon funktionslista. Dag ett är appen
strukturellt komplett och innehållsmässigt tom. Nyttan uppstår först vid kanske trettio
inlagda, godkända, ägda rutiner – och det arbetet ligger hos en redaktör som redan har ett
heltidsjobb i vården. Startbiblioteket ger skelett, inte innehåll. Fotoimporten är snabbare än
avskrift men kräver fortfarande granskning och godkännande av varje utkast.
**Invändningshanteringen kallar detta "den enda som är helt befogad". Det är riktigt, och
svaret som ges där är fortfarande kundens arbete, inte leverantörens.**

**2. En person bakom hela produkten.**
Inte bara en fråga om bussfaktor. Det påverkar supportsvarstid, semestrar, sjukdom,
utvecklingstakt och kundens förmåga att dokumentera sin egen leverantörskontroll. Frågan
kommer alltid, den ställs av jurist eller IT, och svaret i det egna säljstödet är fortfarande
ett **[FYLL I: källkodsdeposition]**. Det är den enskilt farligaste öppna punkten i hela
säljmaterialet – projektet konstaterar det själv och har inte stängt det. Från och med 2026
har frågan dessutom fått en regulatorisk skärpa, se avsnitt 9.

**3. Noll kunder och noll mätdata.**
Hanteras ärligt, men ärlighet ändrar inte matematiken: köparen ska ta en risk som ingen tagit
före hen, mot ett värde som ingen mätt. Referenskundsrabatten kompenserar delvis. Det som
skulle kompensera mer är att flytta risken till leverantören avtalsvägen (avsnitt 11, punkt 1).

**4. Ännu ett system, ännu ett lösenord.**
Personalen loggar redan in i journalsystem, schemasystem, utbildningsportal och Microsoft 365.
Utan SSO är Synappsen ett femte konto. Beslutet att avvakta med SSO tills en kund kräver det är
kommersiellt försvarbart för leverantören men **är en verklig adoptionskostnad för köparen**,
och det är köparen som bär den. En verksamhetschef som infört ett system som ingen använde
känner igen mönstret direkt.

**5. Två sanningar om samma rutin.**
Positionen "komplement, inte ersättare" är rätt säljmässigt men skapar ett verkligt
kvalitetsproblem: om samma rutin finns både i det befintliga ledningssystemet och i Synappsen,
vilken är styrande? En kvalitetschef ser den frågan direkt, och den underminerar
innehållshälso-argumentet – ett system som visar att innehållet är friskt hjälper inte om
innehållet är en kopia av något annat som ändrats. **Detta är den skarpaste invändning en
kompetent köpare kan ställa, och den finns inte besvarad i nuvarande invändningshantering.**

**6. Modulgränserna går på fel ställen för köparen.**
Innehållshälsa, effektmätning och ledningsrapport ligger i Drift. Offline-centret ligger i
Drift. Men innehållshälsan är kvalitetschefens skäl att köpa, och offline är det starkaste
demoögonblicket för ASIH och fältverksamhet. Ingångsnivån saknar alltså både det som säljs in
och det som imponerar. Köparen upplever det som att den intressanta delen kostar 50 % mer än
det pris hen just fick höra.

**7. Kvarvarande WCAG-brister på nivå A och en opublicerad tillgänglighetsredogörelse.**
Mindre kritiskt hos en privat köpare än hos en offentlig, men ISO-certifierade och
stiftelsedrivna verksamheter (Carlanderska, Ersta, Stockholms Sjukhem) frågar, och en brist på
**nivå A** läses som grundläggande, inte som en detalj.

**8. Namnet.**
Litet men verkligt. Ett namn som måste bokstaveras i telefon och som kan höras som något med
syn är friktion i just den kanal produkten ska växa i på sikt – rekommendationer mellan
kollegor. Projektets eget varumärkesdokument har redan identifierat detta korrekt.

---

## 7. Prisvärdhet: räkna som köparen räknar

Prislistan är bra. Jämförelsen som används för att försvara den är säljarens, inte köparens.

### 7.1 Vad köparen faktiskt betalar år ett

För en enhet med 80 anställda på Kärna-nivån:

| Post | Belopp | Kommentar |
|---|---|---|
| Abonnemang Kärna | 39 000 kr | Listpris |
| Uppstartsavgift | 25 000 kr | Engångs, rabatteras aldrig enligt eget beslut |
| Moms 25 % | 16 000 kr | Vårdverksamhet är momsbefriad, avdragsrätten begränsad |
| **Summa fakturerat år 1** | **80 000 kr** | |
| Redaktörens tid, införande | 15 000–25 000 kr | 40–70 timmar à ca 350 kr **[bedömning]** |
| Personalens introduktionstid | ca 5 000 kr | 80 personer × 10 min + APT-punkt **[bedömning]** |
| **Verklig totalkostnad år 1** | **ca 100 000–110 000 kr** | |

Det är inte ett orimligt belopp för en enhet som omsätter tiotals miljoner. Men det är **2,5
gånger den siffra offerten inleds med**, och en ekonomichef gör den beräkningen själv, i
efterhand, utan säljaren i rummet. Att i stället presentera den själv – och visa att man tänkt
på den – är starkare än varje jämförelse mot Microsoft 365.

### 7.2 Varför "per anställd och år" är fel argument

Formuleringen "490 kr per anställd, mindre än en timmes lönekostnad" är korrekt men bygger på
en budgetlogik som inte finns. Ingen verksamhetschef har en post som heter "verktyg per
anställd". Hen har en driftbudget där 80 000 kr konkurrerar med en bemanningsvecka, en
ultraljudsgivare eller en utbildningsdag för hela personalen. **Jämförelsen bör göras mot
sådant, inte mot personalstyrkan:**

> "Det här kostar ungefär vad en veckas hyrsjuksköterska gör. Skillnaden är att det finns kvar
> nästa år."

Den jämförelsen är i köparens egen valuta och är kontrollerbar av hen själv.

### 7.3 Uppstartsavgiften är rätt post, fel förpackning

25 000 kr är väl motiverat internt (största kassaflödesposten år ett, och den bär faktiskt
arbete). Men för köparen är det en avgift utan definierad motprestation, tillagd ovanpå ett
pris hen just accepterat. På Liten-nivån är den **större än hela årsabonnemanget** – 24 000 kr
abonnemang plus 25 000 kr uppstart är en fördubbling av inträdesbiljetten för exakt den
kundtyp som prisnivån skapades för.

**Förslag: behåll beloppet, byt beskrivning från avgift till leverans.** "25 000 kr: jag lägger
in era trettio viktigaste rutiner, klara för godkännande, inom två veckor från start." Då
betalar köparen för att slippa det arbete som är hens största invändning, i stället för att
betala för leverantörens konfigurationstid. Samma pengar, motsatt känsla, och det är dessutom
ett åtagande som går att hålla för en person.

### 7.4 Prisnivåernas trappa har ett hopp

Liten (24 000 kr, 30 användare) till Kärna (39 000 kr, 75 användare) är ett hopp på 63 % vid
användare nummer 31. En klinik som växer från 28 till 33 anställda får en prisökning som är
svår att förklara. Ett mellansteg, eller möjligheten att köpa extra användare uppåt från Liten
till samma 350 kr/användare som gäller över taket, tar bort en förhandling man annars förlorar
tid på.

### 7.5 Är den prisvärd? Ja – för rätt kund

Sammanvägt: **priset är prisvärt för en verksamhet med 60–150 anställda, hög
personalomsättning och ett verkligt kvalitetstryck.** För en klinik med 25 anställda och låg
omsättning är förstaårskostnaden inte prisvärd i förhållande till den upplevda smärtan, även
med Liten-nivån – och det är värt att veta innan man ringer, eftersom en tredjedel av
kandidatlistan ligger där.

---

## 8. Tre saker som skadar förtroendet redan idag

Alla tre är små att åtgärda och kostar oproportionerligt mycket om en köpare hittar dem först.

**1. Underbiträdesförteckningen säger att klinikstöd-sökningen är pausad. Det är den inte.**
`avtal/UNDERBITRADEN.md` beskriver funktionen som pausad i användargränssnittet sedan v5.3.5,
medan `MODULPLAN.md` beskriver den som byggd, livetestad och i drift.
Underbiträdesförteckningen är ett av de dokument som lämnas till kundens dataskyddsombud. Ett
dokument som beskriver produkten fel är exakt det en granskare noterar – och när hen väl
hittat en avvikelse läser hen resten annorlunda. Projektet räknade själv till sju tidigare fall
av samma stale-dokument-mönster i `MARKNADSANALYS.md` §3.1; **det här är ytterligare ett, och
det sitter i ett dokument som lämnas ut till kund.**

**2. AI-anropens dataregion är märkt som ej verifierad.**
Samma dokument noterar att koden använder det publika Gemini-API:et, inte Vertex AI, och att
regional databehandling inom EU därför inte är verifierad. För ett dataskyddsombud är det en
öppen fråga som stoppar Full-nivån – inte Core. Det är ännu ett skäl att sälja Kärna först,
och det är ett skäl som bör vara löst innan någon frågar, inte efter.

**3. Leverantörskontinuiteten är fortfarande ett ifyllnadsfält.**
Se avsnitt 6 punkt 2. Det egna säljstödet skriver rakt ut att detta är den enda invändning där
ett svävande svar sänker affären direkt. Den står olöst.

---

## 9. En extern faktor som inte fanns i analysen från 17 augusti

**Cybersäkerhetslagen (NIS2) trädde i kraft i Sverige den 15 januari 2026.** Hälso- och
sjukvård är en av de omfattade sektorerna, och IVO är tillsynsmyndighet för sektorn vårdgivare.
Medelstora och stora verksamheter omfattas; små och mikroföretag som huvudregel inte.

Det betyder två saker för Synappsen, och de drar åt motsatt håll:

**Motvind.** Flera av de tyngsta kandidaterna ligger klart över tröskeln – Achima Care,
Nötkärnan, Carlanderska, Familjeläkarna, Stockholms Sjukhem, Forenede Care. En omfattad köpare
måste kunna dokumentera att den bedömt och kontrollerat risker i sin leverantörskedja. En
ensam leverantör utan extern penetrationstestning, utan certifierat ledningssystem för
informationssäkerhet och utan formaliserad kontinuitetsplan är svårare att motivera i den
dokumentationen än den var i höstas **[bedömning – de exakta kraven som ställs vidare på
leverantörer är proportionerliga och avgörs av kunden, inte av lagen i detalj]**.

**Medvind, och den är större.** Samma köpare måste nu göra ett arbete de flesta inte har
påbörjat, och de flesta av deras befintliga leverantörer kommer inte att hjälpa dem med det.
Synappsen har redan merparten av materialet skrivet: incidentresponsplan, underbiträdes-
förteckning, IT-faktablad med RTO, backup- och återställningsrutin, revisionslogg. **En ensidig
"leverantörsbilaga för cybersäkerhetslagen" som svarar på de fem frågor en omfattad vårdgivare
måste kunna dokumentera om sin leverantör vore ett av de billigaste och mest differentierande
säljverktyg som går att göra av redan befintligt material.** Den vänder produktens svagaste
egenskap – litenhet – till något köparen kan bocka av.

---

## 10. Skulle någon faktiskt teckna avtal?

**Ja. Men inte på grund av funktionerna, och inte i den takt kandidatlistan antyder.**

Köparen säger inte ja för att sökningen är snabb. Hen säger ja för att en av fyra saker just
har hänt:

1. **Ett tillsynsärende, en avvikelse eller en Lex Maria** där dokumentationen inte höll.
2. **En ny enhet öppnar** och rutinerna ska skrivas ändå.
3. **En nyckelperson slutar eller går i pension** och tar ett decennium av oskriven kunskap.
4. **En extern revision** (ISO, vårdvalsuppföljning, försäkringsbolag) frågar efter något som
   inte går att få fram.

Ingen av dessa går att skapa. Alla fyra går att **leta efter**, och tre av dem är publikt
synliga – IVO-beslut, pressmeddelanden om nyetableringar, kvalitets- och
patientsäkerhetsberättelser. Kandidatlistan gör detta redan för enstaka kandidater
(Achima, Nötkärnan, Ersta) men bygger i övrigt på storleks- och strukturkriterier.
**Bedömningen är att händelsekriteriet är starkare än strukturkriteriet**, och att en
systematisk genomgång av IVO:s beslut – som listan själv utpekar som nästa researchsteg – är
värd mer än ytterligare tjugo kandidater av rätt storlek.

**Konverteringsbedömning [bedömning, ingen data]:** tio väl förberedda A-samtal ger tre till
fem pilotintressen, varav en till två blir betalande inom tolv månader. Det stämmer med det
realistiska scenariot i kostnadskalkylen (2 kunder år 1). Det innebär också att den
optimistiska banan – 25 kunder år 3 – kräver att någon annan än grundaren säljer, eller att en
referenskund gör försäljningen åt honom.

---

## 11. Vad som skulle göra den mer attraktiv

Rangordnat efter effekt per insats. De fem första kräver ingen kod.

### Utan att bygga något

**1. Flytta risken från köparen till leverantören i avtalet, inte i priset.**
Marginalen är 99 %. Det gör en utfallsgaranti nästan gratis och den är det starkaste
säljargument som finns tillgängligt: *"Vi mäter tre saker. Om kvitteringsgraden inte når 80 %
och sökningen inte används inom nittio dagar avslutar ni utan bindning och betalar bara
uppstarten."* En rabatt sänker priset; en garanti sänker **risken**, och det är risk och inte
pris som gör att en köpare utan referens tvekar. Detta är den enskilt största outnyttjade
möjligheten i hela affärsmodellen.

**2. Stäng leverantörskontinuiteten skriftligt.**
Källkodsdeposition eller motsvarande, en avtalsklausul om leverantörens upphörande, en
dokumenterad exitväg, och helst en namngiven person eller partner som kan ta över drift. Utan
detta finns en fråga i varje möte som inte går att besvara. Med det finns den inte.

**3. Gör innehållsinförandet till leveransen, inte till en avgift.**
Se 7.3. "Era trettio viktigaste rutiner inlagda på två veckor" adresserar den invändning som
faktiskt fäller affärer, och gör uppstartsavgiften till något köparen vill ha i stället för
något hen förhandlar bort.

**4. Flytta innehållshälsan till Core.**
Åtminstone hälsosiffran med nedbrytning och listan över utgångna/ägarlösa rutiner. Behåll
trendkurvor, veckosnapshots och personalpuls i Drift. Skälet att köpa måste finnas i det
paket köparen köper. Överväg samma sak för offline-läsning, som är produktens bästa
demoögonblick.

**5. Skriv leverantörsbilagan för cybersäkerhetslagen.**
Se avsnitt 9. En sida, byggd av dokument som redan finns.

**6. Byt primär mottagare i säljmaterialet från verksamhetschef till kvalitetsansvarig.**
Och byt prisjämförelsen från "per anställd" till "per bemanningsvecka" (7.2).

### Med begränsat byggarbete

**7. Ett synligt införandeläge i appen.**
En startvy för en ny organisation som visar "ni har 4 av 30 rutiner inlagda – så här långt
kommer ni på en timme". Kallstartsproblemet är idag osynligt i produkten; kunden märker det
som en känsla av att appen är tom. Att göra införandet mätbart och avslutbart gör det till en
uppgift i stället för en börda. **Bedöms som den mest värdefulla kvarvarande funktionen som
inte kräver en kund för att specificeras.**

**8. Gör bulkimporten till ett demoögonblick.**
Funktionen finns (10b). Att i ett säljmöte peka på kundens egen dokumentmapp och visa hundra
granskningsklara utkast tjugo minuter senare är starkare än sökdemot, eftersom det direkt
motbevisar deras huvudinvändning.

**9. Bygg fältet "lokal tillämpning av" med källänk och bevakning.**
Löser tvåsanningsproblemet (avsnitt 6, punkt 5): rutinen i Synappsen pekar på det styrande
dokumentet i regionens eller huvudmannens system i stället för att kopiera det, och
källbevakningen larmar när originalet ändras. Det gör komplementpositionen tekniskt sann i
stället för retoriskt sann, och det är ett argument ingen konkurrent har.

### Först när det finns en kund

**10. Flerenhetsmodellen (54c/54d).** Halva kandidatlistan är flerenhetsverksamheter, och
säljaren måste idag aktivt nedsälja dem till en enhet. Det är takhöjden på varje affär i
listan. Rätt att vänta på en verklig kravbild – men det är den bygginvestering som lyfter ARR
mest.

**11. SSO/OIDC.** Se avsnitt 6, punkt 4. Rätt beslut att vänta, men adoptionskostnaden är
kundens och bör erkännas i samtalet, inte bortförklaras.

**12. Externt penetrationstest.** Blir svårare att skjuta upp i takt med att köpare gör
leverantörsbedömningar enligt avsnitt 9.

---

## 12. Den större frågan: säljs rätt sak?

En observation som ligger utanför den ställda frågan men som påverkar attraktiviteten mer än
någon funktion.

Synappsen säljs som ett verktyg. Köparens faktiska problem är inte avsaknaden av ett verktyg –
det är att ingen har tid att göra ordning på rutinerna. Ett verktyg gör det arbetet möjligt.
Det gör det inte gjort.

**Det som skulle vara mest attraktivt för en privat vårdgivare är sannolikt inte "en app där
ni kan ordna era rutiner", utan "jag ordnar era rutiner, och de bor sen här".** En
genomgång av befintligt material, en strukturering, trettio rutiner inlagda med ägare och
giltighetstid, och därefter ett abonnemang som håller det vid liv.

Det förändrar tre saker samtidigt: köparen betalar för ett resultat i stället för för en
möjlighet, den största invändningen försvinner ur samtalet, och affärsmodellen passar bättre
för ett bolag som består av en person – tjänsteintäkt skalar dåligt men konverterar bra, och
det är konvertering och inte skala som saknas just nu.

Risken är lika tydlig: tjänsteförsäljning tar tid som inte finns bredvid en anställning, och
den bygger inte ett värde som kan säljas vidare. **Det här är ett vägval värt att fatta
medvetet snarare än att glida in i**, och det bör fattas före det femte säljsamtalet, inte
efter det tjugonde.

---

## 13. Vad jag kan ha fel om

| # | Antagande | Om det är fel |
|---|---|---|
| 1 | **Att kallstarten är den främsta dödsorsaken** | Om fotoimport och startbibliotek fungerar bättre i verkligheten än de gör i beskrivningen, faller punkt 1 i avsnitt 6 och betyget på personalrollen stiger till 4 rakt igenom. Piloten avgör detta på två veckor. |
| 2 | **Att kvalitetschefen är den rätta köparen** | I ägarledda småbolag är verksamhetschef och kvalitetsansvarig ofta samma person, och då spelar det ingen roll. I koncernägda enheter kan kvalitetsfunktionen sitta centralt och sakna budget – då är det fel person. |
| 3 | **Förstaårskostnaden 100–110 kkr** | Bygger på 40–70 timmars redaktörstid. Är det 20 timmar faller argumentet i 7.1; är det 150 timmar är produkten dyrare än den ser ut även för en stor kund. Tidsredovisa piloten. |
| 4 | **Konverteringsbedömningen 1–2 av 10** | Ren gissning utan datapunkter. Efter fem verkliga samtal är den värdelös och ska ersättas. |
| 5 | **NIS2-effekten** | Jag har verifierat att lagen gäller och att sektorn omfattas, men inte exakt vilka krav en enskild vårdgivare vidarebefordrar till en leverantör av ett icke-patientdatabärande system. Det kan visa sig vara en icke-fråga i praktiken. |
| 6 | **Att priset inte behöver ändras** | Delar kostnadskalkylens slutsats. Men om utfallsgarantin i avsnitt 11 införs kan ett högre pris bäras – garantin, inte funktionerna, är det som motiverar en prisnivå. |

---

## 14. Källor

**Projektkunskap:** `CLAUDE.md`, `CLAUDE_STATUS.md` (2026-08-23, v5.128.0), `PITCH.md`,
`MODULPLAN.md`, `MARKNADSANALYS.md` (2026-08-17), `MARKNADSANALYS-EXTERN.md`,
`KOSTNADSKALKYL-OCH-PRISSATTNING.md` (2026-08-19), `KANDIDATLISTA-PRIVAT-VARD.md` (2026-08-18),
`SALJMATERIAL-invandningshantering.md`, `SALJMATERIAL-demomanus.md`, `VARUMARKE.md`,
`JURIDISK-GRANSKNING.md`, `SAKERHETSRAPPORT.md`, `OPPNA-PUNKTER.md`, `PILOTUPPLAGG.md`,
`FRAMTIDSPLAN.md`, `ETAPPLAN2.md`, `ETAPPLAN6.md`, `ETAPPLAN10.md`, `ETAPPLAN12.md`,
`avtal/UNDERBITRADEN.md`.

**Externa källor, hämtade 2026-08-23:**

- [Det här är cybersäkerhetslagen (NCSC)](https://www.ncsc.se/sv/radgivning-och-stod/cybersakerhetslagen-nis2/det-har-ar-cybersakerhetslagen) – ikraftträdande 15 januari 2026
- [Omfattas verksamheten av cybersäkerhetslagen (NCSC)](https://www.ncsc.se/sv/radgivning-och-stod/cybersakerhetslagen-nis2/omfattas-verksamheten-av-cybersakerhetslagen/) – medelstora och stora omfattas, IVO tillsynsmyndighet för vårdgivare
- [Cybersäkerhetslagen och kunder (Secify)](https://www.secify.com/artiklar/cybersakerhetslagen-och-kunder/) – vad omfattade kunder förväntas kräva av leverantörer. *Leverantörsblogg, inte myndighetskälla – behandla som branschbedömning.*
- [MicroGuide till Eolas Medical – övergången (Eolas)](https://support.eolasmedical.com/microguide-to-eolas-transition-practical-questions-answered) – de två närmaste internationella analogerna har konsoliderats till en
- [Bästa Ledningssystem 2026 (BusinessWith)](https://businesswith.se/ledningssystem/) och [AM System](https://businesswith.se/system/am-system/) / [Centuri](https://businesswith.se/system/centuri/) – konkurrensbilden oförändrad sedan 2026-08-17

**Uttryckligen inte verifierat:** ingen verklig köpare har intervjuats. Betygen i avsnitt 4,
kostnadsuppskattningarna i avsnitt 7 och konverteringsbedömningen i avsnitt 10 är samtliga
bedömningar utan mätdata bakom sig.
