# Synappsen – kostnadskalkyl och prissättning

**Internt beslutsunderlag · 2026-08-19 · bygger vidare på `saljmaterial/MARKNADSANALYS.md` (2026-08-17)**

> **Metodnot, samma disciplin som övriga dokument:** varje pris och avgift har en angiven källa
> som faktiskt hämtats. Egna beräkningar är markerade som sådana. Uppskattningar är märkta
> **[uppskattning]**. Räknemodellen finns i `Synappsen-ekonomisk-modell.xlsx` — alla siffror
> nedan går att räkna om där genom att ändra i bladet *Antaganden*.
>
> **Allt är exklusive moms** om inget annat anges.

---

## 1. Sammanfattning

Fyra slutsatser, i den ordning de påverkar beslut.

**1. Kostnadssidan är irrelevant för prissättningen.** Att driva systemet åt en kund kostar
**265 kr per år** i det arbetsantagande jag använder, och **under 900 kr per år** även om den
faktiska förbrukningen skulle bli tio gånger högre än modellerat. Mot en intäkt på 24 000–89 000
kr ger det en bruttomarginal på **99 %** (93 % på Full-nivån, som bär AI-potten). Marknadsanalysens
gissning på "85 %+" var för försiktig. **Priset kan alltså inte härledas ur kostnaderna — det är
uteslutande ett värde- och positioneringsbeslut.**

**2. Den löpande fasta kostnaden är ca 85 000 kr per år.** Det är två kunder på Kärna-nivån.
Året du bildar bolaget tillkommer ca 28 000 kr i engångskostnader, och ett eventuellt
penetrationstest är 50 000 kr till — men det behövs först vid en regionaffär och ska inte
belasta år 1.

**3. Break-even mäts i kunder, inte kronor.** Den enda dyra resursen i bolaget är din tid:

| Vad du tar ut | Bolagets årskostnad | Kunder som krävs |
|---|---|---|
| Ingen lön (kvar i anställning) | 84 800 kr | **1,7** |
| Deltidslön 20 000 kr/mån | 400 200 kr | **8,0** |
| Heltidslön 45 000 kr/mån | 794 500 kr | **15,9** |

Sexton kunder ligger i övre delen av det spann marknadsanalysen bedömer att en person kan
onboarda och supporta (10–20). **Heltid på egen hand är alltså möjligt men trångt** — och först
efter tre år i det optimistiska scenariot.

**4. Priset är sannolikt för lågt per användare, men känns för högt i absoluta tal för en liten
enhet.** Synappsen ligger under *samtliga* jämförbara tjänster per användare och år utom den
brittiska lågprisanalogen Eolas — inklusive under Microsoft 365 Business Standard, som många
kunder redan betalar per anställd. Men en klinik med 25 anställda som ska betala 39 000 kr ser
1 560 kr per anställd, vilket är dyrare per huvud än AM Systems dyraste nivå. **Därför föreslås
en fjärde nivå, Liten, på 24 000 kr för enheter upp till 30 användare** — inte som rabatt, utan
för att prislistan idag saknar en produkt för en tredjedel av kandidatlistan.

---

## 2. Kostnadssidan

### 2.1 Molnkostnad per kund

Modellerad användningsprofil för **en enhet med 80 användare**, varav 40 aktiva per vardag med
två sessioner vardera **[uppskattning genomgående — ingen kund kör systemet skarpt ännu]**:

| Post | Volym/mån | Enhetspris | kr/år |
|---|---|---|---|
| Firestore läsningar | 360 000 | 0,03 USD/100k | 12 kr |
| Firestore skrivningar | 15 000 | 0,09 USD/100k | 2 kr |
| Firestore lagring | 0,05 GiB | 0,15 USD/GiB | 1 kr |
| Firestore egress | 0,72 GB | 0,12 USD/GB | 10 kr |
| Cloud Storage | 2 GB | 0,020 USD/GB | 5 kr |
| Hosting dataöverföring | 2 GB | 0,15 USD/GB | 34 kr |
| Functions anrop | 50 000 | 0,40 USD/milj. | 2 kr |
| Functions CPU | 7 500 vCPU-s | 0,000024 USD/s | 21 kr |
| Functions minne | 7 500 GiB-s | 0,0000025 USD/s | 2 kr |
| Auth | 80 MAU | gratis under 50 000 MAU | 0 kr |
| **Summa grundprofil** | | | **88 kr/år** |

Källor: [firebase.google.com/pricing](https://firebase.google.com/pricing),
[cloud.google.com/firestore/pricing](https://cloud.google.com/firestore/pricing),
[cloud.google.com/run/pricing](https://cloud.google.com/run/pricing),
[cloud.google.com/identity-platform/pricing](https://cloud.google.com/identity-platform/pricing) —
samtliga hämtade 2026-08-19. Växelkurs 9,505 kr/USD (xe.com samma dag).

Eftersom profilen är modellerad och inte mätt räknar modellen med tre nivåer:

| Scenario | Multipel | Kostnad per kund och år |
|---|---|---|
| Låg | 1x | 88 kr |
| **Medel (arbetsantagande)** | **3x** | **265 kr** |
| Hög | 10x | 883 kr |

**Två saker som är värda att förstå i den här tabellen.** Den ena är att den största enskilda
posten är *hosting-överföring och funktionernas CPU-tid*, inte Firestore-läsningarna — vilket
betyder att arkitekturbeslutet att göra sökningen på klienten med Fuse.js i stället för
serverside är ekonomiskt riktigt, och att den post som skulle kunna springa iväg är
Cloud Functions om något börjar polla i onödan. Den andra är att **Firebase gratiskvoter gäller
per projekt, inte per kund** — de första kunderna ryms alltså helt inom gratisnivån och
marginalkostnaden ovan börjar gälla först när projektet vuxit förbi den. Kalkylen är därför
medvetet försiktig.

**Den enda molnkostnad som är verkligt stor är AI-potten på Full-nivån:** 500 kr/mån i faktisk
förbrukning = **6 000 kr per kund och år**. Den är budgetstyrd i produkten och därmed under
kontroll, men den sänker bruttomarginalen på Full från 99 % till 93 %. Rabattera aldrig
Full-nivån utan att räkna om — det är den enda nivån där en rabatt biter i marginalen på riktigt.

> **Åtgärd som fortfarande är öppen:** GCP:s faktureringsexport till BigQuery är beslutad
> (`BESLUTSLOGG.md` 2026-08-15) men inte aktiverad. Exporten är gratis och datamängden ryms inom
> BigQuerys fria 10 GiB lagring och 1 TiB frågor per månad. Aktivera den nu, så ersätts hela
> tabellen ovan med mätdata efter första kunden i stället för efter tredje.

### 2.2 Fasta kostnader

| Post | År 1 | År 2 | År 3 | Källa/anmärkning |
|---|---|---|---|---|
| Bokföring och bokslut | 26 000 | 26 000 | 26 000 | Redovisningsbyrå: löpande 500–3 000 kr/mån + bokslut 8 000–20 000 kr ([ludvig.se](https://ludvig.se/tjanster/ekonomitjanster/redovisningsbyra/priser/)). Med eget program (Fortnox Liten 349 kr/mån) landar posten på ca 4 200 kr — men då gör du jobbet själv. |
| Ansvarsförsäkring inkl. produktansvar | 15 000 | 15 000 | 15 000 | **[UPPSKATTNING]** Se 2.3 |
| Cyberförsäkring | 6 000 | 6 000 | 6 000 | **[UPPSKATTNING]** Se 2.3 |
| Jurist, löpande | 5 000 | 5 000 | 5 000 | 1 500–5 000 kr/tim ([offerta.se](https://offerta.se/guider/ekonomi-och-juridik/vad-kostar-en-affarsjurist)) |
| Sentry (Team) | 2 966 | 2 966 | 2 966 | 26 USD/mån, 50 000 errors ([sentry.io/pricing](https://sentry.io/pricing/)) |
| Google Workspace | 918 | 918 | 918 | Business Starter 76,50 kr/mån |
| Domän .se | 149 | 149 | 149 | [loopia.se](https://www.loopia.se/domannamn/detaljerad_prislista/), ink. moms |
| E-signering | 2 000 | 2 000 | 2 000 | 49–59 kr/dokument styckepris |
| Bankavgifter | 1 800 | 1 800 | 1 800 | 0–350 kr/mån + kort och bankgiro |
| Marknadsföring, resor | 15 000 | 15 000 | 15 000 | **[UPPSKATTNING]** |
| Hårdvara | 5 000 | 5 000 | 5 000 | **[UPPSKATTNING]** |
| Buffert | 5 000 | 5 000 | 5 000 | **[UPPSKATTNING]** |
| AB-registrering + verklig huvudman | 2 650 | – | – | [verksamt.se](https://www.verksamt.se/starta/valj-foretagsform/aktiebolag): från 2 400 kr + 250 kr |
| Juristgranskning avtalspaket | 25 000 | – | – | **[UPPSKATTNING]** 5–10 tim. Krav enligt `saljmaterial/MARKNADSANALYS.md` avsnitt 10 punkt 8 |
| Penetrationstest | – | 50 000 | – | 15 000–250 000 kr, typiskt ca 50 000 ([pentesting.se](https://pentesting.se/sv/blog/pentest-pris-2026)). **Valfritt — krävs först vid regionaffär** |
| **Summa** | **112 483** | **134 833** | **84 833** | |

**Aktiekapitalet på 25 000 kr är inte en kostnad** utan bundet eget kapital, och ingår därför
inte i tabellen. Det är däremot ett likviditetsbehov vid start.

**Två fynd som sparar pengar:**

*Revisionsplikten inträder inte.* Kravet gäller först när minst två av tre gränsvärden
överskridits två år i rad: fler än 3 anställda, balansomslutning över 1,5 Mkr, eller nettoomsättning
över 3 Mkr ([FAR](https://www.far.se/kunskap/revision/vad-ar-revisionsplikt/)). Inget av
scenarierna i avsnitt 4 kommer i närheten — även det optimistiska landar på ca 1,4 Mkr år 3.
Det sparar 10 000–25 000 kr per år jämfört med en kalkyl som räknar med revisor.

*Löneuttagskravet i 3:12 är slopat från inkomstår 2026.* Skatteverket bekräftar att både
4 %-spärren och lönekravet tagits bort, och att grundbeloppet är **322 400 kr** (fyra
inkomstbasbelopp) [källa](https://www.skatteverket.se/foretag/drivaforetag/foretagsformer/famansforetag/andradereglerinforinkomstdeklarationen2027.4.4a54dc8b19aa6175a152359.html).
**Praktiskt betyder det att du, så länge du är kvar i din anställning, kan låta bolagets överskott
gå till utdelning beskattad med 20 % utan att ta ut någon lön alls.** Det är en direkt följd av en
regeländring som trädde i kraft i år och den enskilt mest kalkylkritiska skatteuppgiften i hela
underlaget. Stäm av med din redovisningskonsult innan du bygger uttagsplanen på den.

### 2.3 Den post jag inte kunde prissätta

**Ingen svensk försäkringsgivare publicerar listpris för ansvars- eller cyberförsäkring.**
Kontrollerat hos If, Trygg-Hansa, Gjensidige och Dina — samtliga säljer uteslutande offertbaserat
utifrån bransch, omsättning, största uppdrag och försäkringsbelopp. Beloppen 15 000 och 6 000 kr
i tabellen ovan är mina uppskattningar och ingenting annat.

Det finns dessutom en materiell osäkerhet bakom siffran. `saljmaterial/MARKNADSANALYS.md` risk 2 slår fast att
produktansvaret är strikt och inte kan avtalas bort. Men **standardvillkoren för IT-konsultförsäkring
är skrivna för generella IT-tjänster och nämner sällan vårdsektorn alls** — vilket kan betyda tyst
inkludering eller ett dolt undantag, beroende på bolag. Den obligatoriska patientförsäkringen
enligt patientskadelagen gäller vårdgivaren, alltså din kund, inte dig som leverantör.

> **Åtgärd:** begär tre offerter och kräv **skriftlig bekräftelse** på att programvara som används
> i vårdverksamhet omfattas. Gör det innan första skarpa användning, inte innan första signaturen —
> en pilot är skarp användning. Om premien landar väsentligt över 15 000 kr påverkar det
> break-even med ungefär en tiondels kund per 5 000 kr, alltså marginellt. **Försäkringen är en
> riskfråga, inte en kostnadsfråga.**

---

## 3. Marknadens prisnivåer

Omräknat till **kronor per användare och år** — det enda måttet som gör olika prismodeller
jämförbara. Växelkurs 9,505 kr/USD och 12,85 kr/GBP (xe.com 2026-08-19).

| Tjänst | Prisunderlag | 25 anv. | 80 anv. | 150 anv. |
|---|---|---|---|---|
| Eolas Medical (per användare) | £1/anv/mån | 154 kr | 154 kr | 154 kr |
| Confluence Standard | $6,4/anv/mån | 730 kr | 730 kr | 730 kr |
| Microsoft 365 Business Basic | 66,91 kr/anv/mån | 803 kr | 803 kr | 803 kr |
| **Synappsen Drift** | **59 000 kr/enhet** | – | – | **393 kr** |
| **Synappsen Kärna** | **39 000 kr/enhet** | – | **520 kr** | – |
| **Synappsen Full** | **89 000 kr/enhet** | – | – | **593 kr** |
| **Synappsen Liten (förslag)** | **24 000 kr/enhet** | **800 kr** | – | – |
| Notion Plus | $10/anv/mån | 1 141 kr | 1 141 kr | 1 141 kr |
| AM System Premium | 7 900 kr/mån, ≤100 anv | 3 792 kr | 1 185 kr | 1 185 kr |
| Radar Healthcare | £20 000/år fast | 10 280 kr | 3 213 kr | 1 713 kr |
| Notion Business / Slite Pro | $20/anv/mån | 2 281 kr | 2 281 kr | 2 281 kr |
| AM System Standard | 4 900 kr/mån, ≤25 anv | 2 352 kr | 2 352 kr | 2 352 kr |
| Microsoft 365 Business Standard | 224,63 kr/anv/mån | 2 696 kr | 2 696 kr | 2 696 kr |

Källor: [AM System](https://amsystem.com/pricing/management-system),
[Eolas Medical](https://eolasmedical.com/pricing), Radar Healthcare via brittiska G-Cloud,
[Microsoft](https://www.microsoft.com/sv-se/microsoft-365/business/microsoft-365-plans-and-pricing) (ex moms),
[Notion](https://www.notion.com/pricing), [Slite](https://slite.com/pricing).

**Tre observationer som borde påverka strategin.**

*Synappsen är billigare per användare än nästan allt annat.* Mot AM System — det enda direkt
jämförbara publika svenska priset — är Kärna 56 % billigare per användare än Standard, och Drift
67 % billigare än Premium. Mot Microsoft 365 Business Standard, som kunden med stor sannolikhet
redan betalar för varje anställd, är Kärna 81 % billigare. **Argumentet "ni betalar redan mer per
anställd för Office-paketet än vad hela Synappsen kostar" är sant och kontrollerbart.**

*Ingen i kategorin publicerar sina priser.* Centuri, CANEA, Stratsys, Add Systems, PreWoe,
Zimplicit, PolicyStat, Lucidoc, Guru, Document360 och Quinyx är samtliga offertbaserade —
kontrollerat 2026-08-19. Normen är alltså "kontakta oss". **En publik, tydlig prislista är därmed
en konkurrensfördel, inte en avvikelse:** den sparar kundens tid, signalerar att du inte
prisdiskriminerar, och gör att en verksamhetschef kan räkna på affären utan att först boka ett
säljmöte. För en ensam leverantör som konkurrerar mot bolag med säljorganisationer är det en av
få asymmetrier som faktiskt går att utnyttja.

*Det låga golvet är Eolas på 154 kr per användare och år.* Om Eolas eller MicroGuide etablerar
sig i Norden med svensk lokalisering blir prisnivån pressad — men den regulatoriska tröskeln
(PUB-avtal, patientdatalagen, DOS-lagen, svenska godkända källor) är precis den kostnad som gör
marknaden oattraktiv för dem. Bevakningspunkten från marknadsanalysen står kvar oförändrad.

---

## 4. Resultat i tre scenarier

Snittintäkten per kund och år är **50 150 kr**, beräknad på kundmixen 15 % Liten, 45 % Kärna,
28 % Drift, 12 % Full, plus att 30 % köper källbevakning **[uppskattning, härledd ur
storleksfördelningen i `saljmaterial/KANDIDATLISTA-PRIVAT-VARD.md`]**. Intäkten räknas på genomsnittligt
antal kunder under året, eftersom kunder tecknas löpande.

### Resultat före lön

| Scenario | Kunder (år 1/2/3) | År 1 | År 2 | År 3 |
|---|---|---|---|---|
| **Pessimistisk** | 1 / 2 / 3 | −87 975 kr | −36 085 kr | +63 080 kr |
| **Realistisk** | 2 / 5 / 10 | −63 467 kr | +112 245 kr | +408 906 kr |
| **Optimistisk** | 3 / 10 / 25 | −38 960 kr | +359 741 kr | +1 150 557 kr |

### Samma scenarier efter eget uttag

| Scenario | Uttag | År 1 | År 2 | År 3 |
|---|---|---|---|---|
| Realistisk | Deltid (20 000 kr/mån) | −378 875 | −203 163 | **+93 498** |
| Realistisk | Heltid (45 000 kr/mån) | −773 135 | −597 423 | −300 762 |
| Optimistisk | Deltid | −354 368 | **+44 333** | **+835 149** |
| Optimistisk | Heltid | −748 628 | −349 927 | **+440 889** |

**Vad tabellerna säger, utan förskönande.** Även i det pessimistiska scenariot är förlusten
begränsad till ca 88 000 kr år 1 och bolaget vänder till plus år 3 — så länge du inte tar ut lön.
**Nedsidan är alltså liten i kronor.** Uppsidan kräver däremot både tid och kunder: heltid går
inte ihop förrän år 3 och bara i det optimistiska scenariot.

Den praktiska slutsatsen är att **bolaget ska drivas utan löneuttag tills det finns minst åtta
kunder.** Det är inte ett uttryck för försiktighet utan för matematik: fram till dess kostar varje
uttagen krona mer i förlorat kassaflöde än den ger i trygghet, och 3:12-ändringen 2026 gör att du
ändå kan ta ut överskottet till 20 % skatt utan lönekrav.

**Likviditetsbehovet vid start** är aktiekapitalet 25 000 kr plus det första årets underskott,
alltså storleksordningen **90 000–115 000 kr** innan intäkterna kommer igång. Det är den siffra
som avgör om bolagiseringen är möjlig, inte omsättningen.

---

## 5. Prisförslag

### 5.1 Fyra nivåer

| | **Liten** *(ny)* | **Kärna** | **Drift** | **Full** |
|---|---|---|---|---|
| **Pris per enhet och år** | **24 000 kr** | **39 000 kr** | **59 000 kr** | **89 000 kr** |
| Användartak | 30 | 75 | 150 | 150 |
| Kr per användare och år | 800 kr | 520 kr | 393 kr | 593 kr |
| Kr per användare och månad | 67 kr | 43 kr | 33 kr | 49 kr |
| Molnkostnad per kund och år | 265 kr | 265 kr | 265 kr | 6 265 kr |
| **Bruttomarginal** | **98,9 %** | **99,3 %** | **99,6 %** | **93,0 %** |
| Motsvarar arbetstimmar per anställd och år | 2,3 h | 1,5 h | 1,1 h | 1,7 h |
| Kundens kostnad efter moms | 30 000 kr | 48 750 kr | 73 750 kr | 111 250 kr |

Innehållet per nivå är oförändrat från `saljmaterial/MARKNADSANALYS.md` avsnitt 7.2. **Liten innehåller samma
funktioner som Kärna** — den skiljer sig bara i användartak. Det är avsiktligt: en liten klinik
ska inte få en sämre produkt, den ska få ett pris som står i proportion till hur många den är.

**Varför Liten behövs.** Kandidatlistan innehåller flera verksamheter i rätt profil men fel
storlek: IVF-gruppen vid Sophiahemmet har ca 25 anställda, Ocavis Ögonklinik och Nordiska Klinikens
enskilda mottagningar är i samma storleksordning, och flera av Nötkärnans vårdcentraler ligger
under 30 personer. För dem betyder 39 000 kr **1 560 kr per anställd och år** — dyrare per huvud
än AM Systems dyraste nivå och nästan tre gånger Synappsens egen Kärna-nivå. Utan en Liten-nivå
prissätter du bort en tredjedel av din egen kandidatlista, och du gör det utan att spara en enda
krona i kostnad, eftersom molnkostnaden är densamma.

**Varför inte lägre än 24 000 kr.** Under den nivån blir en kund inte lönsam i tid räknat.
Onboarding, support och relationsvård tar ungefär lika lång tid oavsett kundens storlek —
uppskattningsvis 15–25 timmar första året **[uppskattning]**. Vid 24 000 kr motsvarar det ungefär
1 000–1 600 kr per nedlagd timme, vilket är försvarbart. Vid 15 000 kr är det inte det.

### 5.2 Tillägg och rabatter — oförändrade, med två justeringar

| Post | Pris | Kommentar |
|---|---|---|
| Uppstartsavgift | 25 000 kr engångs | **Den viktigaste posten år 1.** Vid två kunder är den 50 000 kr, alltså mer än halva den fasta kostnadsbasen. Ge aldrig bort den — rabattera hellre abonnemanget. |
| Källbevakning | 6 000 kr/år | Oförändrad |
| Extra användare över taket | 350 kr/anv/år | Oförändrad |
| Extra AI-pott | 3 000 kr per steg om 500 kr/mån | Oförändrad. Notera att detta är den enda posten där din kostnad följer intäkten. |
| Referenskundspris (kund 1–3) | 50 % rabatt år 1 | Oförändrad — mot dokumenterat referensåtagande |
| Flerårsavtal | 2 år −8 %, 3 år −15 % | Oförändrad, med indexklausul |
| Volym under samma huvudman | Enhet 2 −25 %, 3–5 −35 % | **Sälj inte förrän 54c/54d är byggt.** Oförändrad varning från marknadsanalysen. |

**Justering 1: rabattera aldrig Full-nivån procentuellt.** Den bär en verklig kostnad på 6 000 kr
per år i AI-pott. En 35 %-rabatt på Full ger 57 850 kr och en marginal på 89 % — fortfarande bra,
men det är den enda nivån där en rabatt faktiskt kostar dig pengar. Erbjud hellre Drift plus en
tidsbegränsad AI-pott.

**Justering 2: uppstartsavgiften ska aldrig ingå i referenskundsrabatten.** Referenskunden får
50 % på abonnemanget — inte på ditt arbete. Det är den distinktion som gör att en referenskund
ändå bidrar till kassaflödet det år den kostar dig mest tid.

### 5.3 Hur priset ska presenteras

Tre formuleringar, i den ordning de fungerar:

1. **"Det motsvarar en till två arbetstimmar per anställd och år."** Vid Kärna-nivån är hela
   årsavgiften 1,5 timmes lönekostnad per anställd **[uppskattning: 350 kr/tim inkl.
   arbetsgivaravgift och OB]**. Detta är den jämförelse som fungerar hos en verksamhetschef,
   eftersom den är i hens egen valuta.
2. **"Ni betalar redan mer per anställd för Office-paketet."** Microsoft 365 Business Standard är
   2 696 kr per anställd och år ex moms. Kärna är 520 kr. Sant, publikt kontrollerbart, och det
   flyttar samtalet från "är det här dyrt" till "vad får vi för pengarna".
3. **"Priset står på webbplatsen."** Ingen konkurrent i kategorin publicerar sina priser. Att göra
   det tar bort ett helt förhandlingssteg och signalerar att alla kunder betalar samma.

Nämn **inte** momspåslaget självmant i första samtalet. Det är korrekt att kundens effektiva
kostnad är listpris × 1,25 eftersom vårdverksamhet är momsbefriad och avdragsrätten begränsad —
men det är en fråga för kundens ekonomifunktion, och att lyfta den oombedd höjer det upplevda
priset med 25 % innan värdet ens diskuterats. Ha svaret redo, ge det inte i förskott.

---

## 6. Vad som skulle ändra slutsatserna

| # | Osäkerhet | Påverkan om jag har fel | Hur du stänger den |
|---|---|---|---|
| 1 | **Molnprofilen är modellerad, inte mätt** | Låg. Även 10x ger under 900 kr/kund/år | Aktivera GCP:s faktureringsexport — tio minuter, gratis |
| 2 | **Försäkringspremien är en gissning** | Låg på resultatet (en tiondels kund per 5 000 kr), hög på risken | Tre offerter, med skriftlig bekräftelse om vårdundantag |
| 3 | **Kundmixen är antagen** | Måttlig. Mix med 20 % Full i stället för 12 % höjer snittintäkten ca 7 % | Följs upp efter kund 3–5 |
| 4 | **Kundanskaffningstakten är ren gissning** | **Mycket hög — detta är hela osäkerheten i kalkylen** | Endast ett sätt: ring listan |
| 5 | **Supporttiden per kund är uppskattad till 15–25 tim år 1** | Hög vid många kunder. Om det är 50 timmar sjunker taket från 16 kunder till 8 | Tidsredovisa piloten från dag ett |
| 6 | **3:12-tolkningen** | Måttlig på uttagsplanen | Stäm av med redovisningskonsult |

Punkt 5 förtjänar en egen kommentar. Hela heltidsscenariot vilar på att en person kan supporta
16 kunder. `avtal/INCIDENTRESPONSPLAN.md` redovisar redan öppet att bemanningen är en person, och
marknadsanalysen bedömer taket till 10–20 kunder. **Om piloten visar att en kund kräver 50 timmar
om året i stället för 20, halveras taket — och då är heltid inte längre möjligt utan att anställa,
vilket ändrar hela kalkylen.** Mät det under piloten. Det är billigare att veta än att anta.

---

## 7. Rekommendation

**Behåll 39 000 / 59 000 / 89 000 kr. Lägg till Liten på 24 000 kr. Höj ingenting.**

Prisnivåerna i `saljmaterial/MARKNADSANALYS.md` avsnitt 7.2 håller mot allt jag kunnat verifiera i marknaden,
och de har fördelen att vara redan genomtänkta och dokumenterade. Att höja dem vore frestande
givet hur mycket lägre de ligger per användare än alternativen — men **en prishöjning före första
kunden optimerar en intäkt som inte finns.** Marginalen är 99 %; ytterligare tio procent på ett
listpris är värt noll kronor så länge ingen betalar det.

Det som däremot kostar pengar är att sakna en produkt för de minsta enheterna, eftersom de är
överrepresenterade bland de kandidater som har kortast beslutsväg — Wästerläkarna, IVF-gruppen,
Ocavis. Liten-nivån stänger det hålet utan att röra något annat.

**Tre saker att göra den här veckan, i prioritetsordning:**

1. **Aktivera GCP:s faktureringsexport.** Tio minuter, gratis, och det är det enda sättet att
   ersätta avsnitt 2.1:s uppskattningar med verklighet.
2. **Begär tre försäkringsofferter** med uttrycklig fråga om programvara i vårdverksamhet omfattas.
   Det är den enda posten i kalkylen som är både okänd och riskbärande.
3. **Lägg in Liten-nivån i prislistan och i `produkt/MODULPLAN.md`** innan du ringer kandidatlistan — annars
   får du improvisera ett pris i telefon för den första lilla kliniken som säger ja, och det är
   det sämsta läget att sätta pris i.

Och en sak att **inte** göra: bygg ingenting för att motivera ett högre pris. Marginalen är redan
99 %. Det som saknas är en kund, inte en funktion.

---

## 8. Källor

Samtliga länkar är inbäddade vid respektive uppgift ovan. Prislistorna hämtades 2026-08-19 från
Googles, Sentrys, Microsofts, Notions, Slites, AM Systems och Eolas egna prissidor, från
verksamt.se, Skatteverket och FAR för bolags- och skatteuppgifter, samt från xe.com för
växelkurser. Fullständig källförteckning finns i bladet *Källor* i
`Synappsen-ekonomisk-modell.xlsx`.

**Internt underlag:** `saljmaterial/MARKNADSANALYS.md` (2026-08-17), `saljmaterial/KANDIDATLISTA-PRIVAT-VARD.md`
(2026-08-18), `produkt/MODULPLAN.md`, `granskningar/JURIDISK-GRANSKNING.md`, `etapplaner/ETAPPLAN10.md` §48c,
`avtal/INCIDENTRESPONSPLAN.md`, `BESLUTSLOGG.md`.
