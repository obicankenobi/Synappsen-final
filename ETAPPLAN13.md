# Etapplan 13 – Baspaket: nationella referenser, inte kliniskt beslutsstöd

*Utkast 2026-08-10, samma genomgång som `ETAPPLAN12.md`, men medvetet en egen fil.*
*Granskad och korrigerad 2026-08-11, andra genomläsning samma dag – se "Granskning" nedan.*
*ANTAGEN 2026-08-11 – ägaren har beslutat att idén ska drivas vidare (beslutspunkt 1:s första
hälft). Se `BESLUTSLOGG.md` för beslutet ordagrant och `OPPNA-PUNKTER.md` för vad som
konkret återstår.*

> **Läs detta först, ÄVEN efter antagandet.** Den här planen innehåller EN enda etapp (64),
> och den skiljer sig från alla andra antagna planer i projektet på ett sätt som är värt att
> säga rakt ut: **"antagen" betyder INTE "byggbar av en kodsession".** Idén rör två
> regulatoriska gränser (medicinteknisk produkt under MDR, och upphovsrätt till nationella
> instrument) som kräver juridiska svar innan någon rad kod skrivs – inte bara en
> premisskontroll mot koden, som resten av projektets etapper klarar sig med. Antagandet
> betyder bara att ägaren vill att idén drivs vidare och att den juridiska bedömningen
> kommissioneras – INTE att bygget kan påbörjas. Beslutspunkt 1:s andra hälft (vem gör
> bedömningen) är fortfarande öppen, se `OPPNA-PUNKTER.md`. Blanda inte ihop "antagen som
> nästa prioritet" med "byggbar".

---

## Granskning 2026-08-11

Utkastet granskades mot faktisk kod (genomgående krav 8, tillämpat på planen självt) innan
det skickas vidare till en jurist. Fem saker rättades, och de är värda att känna till om man
läser den ursprungliga versionen i git-historiken:

1. **En intern motsägelse.** 64a förbjöd varje kopia av källans innehåll, medan 64c samtidigt
   öppnade för "en skala presenterad som en läsbar tabell". En läsbar tabell av en skala ÄR en
   kopia. Motsägelsen är löst åt referenshållet (se 64a/64c nedan) – dels för att det är
   planens egen strängare linje, dels för att den andra tolkningen utlöser en upphovsrättslig
   fråga planen inte hade tänkt på alls.
2. **Fel juridiskt instrument.** Utkastet hänvisade till MDR Annex VIII regel 11. Den regeln
   *klassificerar* en produkt som redan bedömts vara medicinteknisk – den svarar inte på
   planens faktiska fråga, som är kvalificeringsfrågan. Rättat nedan.
3. **Upphovsrätt saknades helt.** Hela utkastet handlade om MDR. Se nytt genomgående krav 26.
4. **64b var underskattad.** "Utökad källbevakning, inte ett nytt system" stämmer inte – den
   centrala larmvägen finns inte, verifierat mot koden. Se "Tekniska förutsättningar" nedan.
5. **Beslutspunkten var falskt binär.** Den saknade ett tredje alternativ som löser flera av
   planens svåraste problem på en gång, och som redan är byggt i Etapp 56. Se beslutspunkt 2.

Dessutom rättades en stale sökväg: `GODKANDA_KALLDOMANER` ligger sedan Etapp 61a (samma dag
utkastet skrevs, men senare) i `functions/klinikstod.js`, inte i `functions/index.js`.

**Rättelse av den egna omskrivningen (samma dag, andra genomläsningen).** Två fel smög sig in
i själva omskrivningen ovan, inte i det ursprungliga utkastet – värt att säga rakt ut eftersom
det är precis den sortens fel en jurist inte får ärva:

6. **Ja/nej var omkastade i "Klart när"-tabellens fråga 1.** Ett ja-svar på "kvalificerar det
   som medicinteknisk programvara?" är det DÅLIGA utfallet (full MDR-börda) – jag hade skrivit
   det som om ja betydde "byggbart". Rättat i tabellen och i alternativ A:s "Kräver"-rad, som
   hade samma inversion.
7. **Räknefel i beslutspunkt 2.** Skrev att alternativ B löser "tre av de fyra" tekniska
   förutsättningarna. B löser bara två (den centrala larmvägen och var paketet lever) –
   fyrakällorstaket och domänlistan gäller `externaKallor`-mekanismen oavsett ägare och
   kvarstår under B. Förutsättningstabellen fick en ny kolumn som visar vilka rader som är
   A-specifika kontra universella.

---

## Bakgrund

Frågan kom från ägaren under genomgången som ledde fram till `ETAPPLAN12.md`: vore det en
bra idé att erbjuda ett gemensamt "baspaket" av nationella/generella dokument och riktlinjer
(t.ex. bedömningsinstrument av typen VÄST-A, nämnt som exempel) – hållet tillräckligt
generellt för att INTE klassas som en medicinteknisk produkt?

Det är en genuint annorlunda produktidé jämfört med allt annat i projektet hittills:

- **Etapp 56:s verksamhetsmallar** är strukturella skelett en enskild kund fyller i själv,
  tydligt märkta som mallar, aldrig påstådd färdig klinisk vägledning.
- **Klinikstödet** (Etapp 22, i drift sedan 2026-07-14) är en domänbegränsad sökning som
  sammanfattar EXTERNA källor med citat – Synappsen skriver aldrig om innehållet självt.
- **Ett baspaket** skulle vara Synappsens EGEN, kurerade samling av innehåll, **samma för
  alla kunder** – en tredje kategori som varken är "kundens eget" eller "en sökmotor mot
  externa sidor".

Den ligger nära en gräns som redan är dragen i `ETAPPLAN11.md`s "Vad jag INTE föreslår":
*"Dos-/läkemedelsberäkning eller kliniskt beslutsstöd som räknar … kan klassa hela produkten
som en medicinteknisk produkt under MDR."*

---

## Genomgående krav (fortsätter numreringen från `ETAPPLAN12.md`)

25. **Innehåll som Synappsen själv curerar (inte en enskild kunds redaktör) får ALDRIG
    beräkna, poängsätta eller rekommendera en åtgärd – bara referera, citera och länka, med
    samma domänbegränsning och källbevakning som klinikstödet redan bevisat fungerar.** Det
    är samma linje som redan finns i "Vad jag INTE föreslår" i `ETAPPLAN11.md` (dosberäkning
    ⇒ medicinteknisk produkt under MDR) – bara uttryckt som ett stående krav istället för en
    enskild avslagen idé, eftersom den här planen föreslår en funktion som ligger nära
    gränsen snarare än att avstå helt.

26. **Synappsen reproducerar aldrig innehållet i ett instrument som någon annan äger eller
    licensierar – bara metadata och en länk till originalet.** Nytt 2026-08-11. Krav 25 skyddar mot MDR;
    det här skyddar mot en helt annan risk som utkastet missade. Bedömningsinstrument är ofta
    upphovsrättsskyddade eller licensbelagda, och flera av de mest kända kräver uttryckligt
    tillstånd för användning i en kommersiell produkt. Argumentet "det är ju samma sak som en
    bok" är just här precis fel: en bok är köpt eller licensierad. De två kraven pekar åt
    samma håll – ren referens – men av olika skäl, och båda måste hålla.

---

## Etapp 64 – Baspaket: nationella referenser, inte kliniskt beslutsstöd (ny idé, ej granskad juridiskt)

**Varför:** se "Bakgrund" ovan.

**Min bedömning, kort (se motivering nedan för den fulla resonemangskedjan): en försiktig
version är sannolikt görbar utan att korsa MDR-gränsen, OM den byggs som ren
referens/länkning – inte som en interaktiv poängräknare och inte som en reproduktion av
instrumentets innehåll.** Den skillnaden avgör allt, och den går inte att göra halvvägs.

Jag har ingen egen verifierad kunskap om innehållet eller omfattningen i det specifika
instrumentet ägaren nämnde (VÄST-A) och gissar inte på det här – i en produkt som redan har
en dokumenterad, medveten disciplin kring att aldrig påstå mer än vad som är verifierat
(se `PITCH.md`s "Ärlighet om vad som faktiskt är mätt"), skulle det vara fel att göra ett
undantag just här.

### Vilken juridisk fråga som faktiskt ska ställas

Utkastet hänvisade till **MDR Annex VIII regel 11**. Det är fel instrument för planens fråga,
och skillnaden är inte akademisk:

- **Regel 11 klassificerar.** Den avgör vilken riskklass en produkt hamnar i – men bara efter
  att den redan bedömts VARA en medicinteknisk produkt.
- **Planens fråga är kvalificering:** är det här en medicinteknisk produkt över huvud taget?
  Det avgörs av definitionen i MDR artikel 2(1) tillsammans med MDCG:s vägledning om
  kvalificering och klassificering av programvara (MDCG 2019-11, kontrollera att juristen
  använder den senaste revisionen).

Att rikta frågan rätt spelar roll, för **planens bästa argument ligger i kvalificeringsledet
och utkastet missade det**: vägledningen behandlar programvara vars funktion är att lagra,
arkivera, kommunicera eller utföra enkel sökning och visning av befintliga dokument som
något som normalt inte kvalificerar som medicinteknisk programvara. Det är exakt vad 64a
beskriver – ett elektroniskt referensbibliotek, inte något som bearbetar patientdata. Det ska
juristen få pröva, inte jag; men frågan ska ställas i rätt led.

### Var gränsen faktiskt går (verifierat mot vad appen redan gör, inte mot en gissning)

Klinikstödet (byggt, i drift sedan 2026-07-14) löser redan en näraliggande fråga och har
gjort det utan att klassas som medicinteknisk produkt:

- **Domänbegränsning:** `functions/klinikstod.js`s `GODKANDA_KALLDOMANER` + `firestore.rules`s
  `arGodkandaKallor()` tillåter bara sju namngivna, auktoritativa svenska källor
  (internetmedicin.se, 1177.se, Nationella kliniska kunskapsstödet, FASS, Läkemedelsverket,
  Vårdhandboken, Folkhälsomyndigheten). Detta är redan enforcementat i BÅDA lagren – server
  och regler – inte bara en instruktion till en AI-modell.
- **Ingen beräkning, bara sammanfattning + citat:** Gemini sammanfattar de faktiska
  träffarnas utdrag och redovisar alltid källänken. Den räknar aldrig ut något (ingen dos,
  ingen poäng, ingen "gör X").
- **Källbevakning finns redan** (`kontrolleraKallbevakning`, Etapp 21a): en veckovis
  automatisk kontroll av varje `rutin.externaKallor`-länk, hashjämförelse mot tidigare
  innehåll, larm till rutinägaren vid ändring eller trasig länk.

Det här är i grunden rätt mönster för ett baspaket – men "det finns redan, återanvänd det"
är en överdrift som utkastet gjorde och som inte håller. Se nästa avsnitt.

### Tekniska förutsättningar som INTE finns idag (nytt 2026-08-11)

Verifierat mot koden. **Två av de fyra gäller bara alternativ A** (se beslutspunkt 2 nedan) –
markerat i sista kolumnen. De andra två gäller `externaKallor`-mekanismen som sådan, oavsett
vem som äger posten, och kvarstår alltså oavsett leveransmodell:

| # | Vad som saknas | Var det syns i koden | Gäller | Varför det spelar roll |
|---|---|---|---|---|
| 1 | **Ingen central larmväg till leverantören.** Källbevakningen sätter `kallVarning` på ett rutindokument, och notisen går till rutinens ägare inom organisationen (`agare.uid`/`agare.roll`). | `functions/klinikstod.js:125–146`, `functions/notiser.js:77–79` | **Bara A** | 64b:s "bara att larmet går till en central ansvarig" är inte en parameter – det är ett nytt notifieringsspår som ska byggas och testas. Under B äger kunden posten, så det befintliga larmet till rutinägaren räcker. |
| 2 | **Tak på fyra externa källor per rutin, enforcementat i reglerna.** | `firestore.rules:279` (`arKortKallLista`), `arGodkandaKallorN` manuellt utrullad för index 0–3 | **A och B** | Taket finns för att hålla nere antalet utvärderade deluttryck (Firestores gräns på 1000 per regelanrop), inte av godtycke. Gäller varje rutin oavsett ägare – ett baspaket med fler referenser per post kräver en genomtänkt regeländring oavsett leveransmodell. |
| 3 | **Domänlistan saknar de mest sannolika utgivarna.** Socialstyrelsen och SBU finns INTE bland de sju godkända domänerna. | `functions/klinikstod.js:34`, `src/config/kalldomaner.js:4`, `firestore.rules` (`urlHarGodkandDoman`) | **A och B** | Nationella riktlinjer och bedömningsunderlag bor ofta just där. Domänallowlistan är gemensam för hela appen – att utöka den är en ändring av en säkerhetsgräns i tre synkade lager plus regeltest, oavsett vem som äger den enskilda posten. |
| 4 | **Var baspaketet lever är obesvarat.** `externaKallor` är ett fält på rutindokument, och rutiner är per organisation. | `firestore.rules:469–497`, `functions/backup.js:36` (`BACKUP_COLLECTIONS`) | **Bara A** | Under A får varje kund kopior (en fan-out-uppdatering, och kopiorna hamnar i backup, export och radering som om de vore kundens eget innehåll) ELLER paketet ligger centralt (då fungerar inte den befintliga källbevakningen alls, se rad 1). Under B är frågan redan besvarad: posterna ligger på kundens egna rutiner från start. |

### Hur ett baspaket SKA byggas, om det byggs

- **64a – Referensposter, inte innehåll Synappsen äger.** Varje post i baspaketet är en
  strukturerad referens (titel, källa, utgivare, datum, länk) till den FAKTISKA nationella
  källan – aldrig en kopia eller omskrivning av innehållet. Samma disciplin som
  `MALL_ANMARKNING` i Etapp 56, men strängare: en mall säger "fyll i det här", en
  baspaket-post säger "det här är vad [utgivaren] själv publicerat, se länken – vi har inte
  skrivit om det". Ingen tolkning, ingen sammanfattning av Synappsen självt.
- **64b – Källbevakning med en NY central larmväg.** Baspaketets poster ska bevakas med samma
  hash-jämförelsemönster som `kontrolleraKallbevakning` redan använder, men larmet måste nå
  leverantören, inte en rutinägare hos en enskild kund – och den vägen finns inte idag
  (se tabellen ovan, rad 1). Utkastet kallade det här "utökad källbevakning, inte ett nytt
  system"; halva påståendet stämmer (mönstret återanvänds), men larmvägen är ny kod.
- **64c – Ett UTTRYCKLIGT tak mot att det glider mot beräkning ELLER reproduktion.** Ingen
  baspaket-post får någonsin ha ett fält som lagrar ett tröskelvärde, en poängsumma eller en
  "om X då Y"-logik som appen kör – och ingen post får innehålla instrumentets faktiska
  innehåll, vare sig som text, tabell eller formulär. Om en framtida session frestas att
  bygga t.ex. en interaktiv poängräknare ovanpå en bedömningsskala, eller att "bara" återge
  skalan som en läsbar tabell – **stanna. Det första korsar sannolikt MDR-gränsen, det andra
  sannolikt upphovsrätten.** Utkastet tillät uttryckligen det andra; det var ett misstag,
  se "Granskning" ovan.
- **64d – Opt-in, inte förval.** En organisation väljer att lägga till baspaketet, precis
  som moduler idag (`organisationer/{orgId}.moduler`). Det håller ansvarsfrågan tydlig:
  ingen kund får ett vårdinnehåll de inte aktivt bett om. Notera ringarna på vattnet: en ny
  modul betyder också en post i `PACKAGE_FEATURES` (`src/config/features.js`), en rad i
  gating-matristestet (`tests/functions/gatingmatris.test.cjs`) och ett prissättningsbeslut
  i `MODULPLAN.md`.

### Vad som INTE ingår, oavsett hur långt idén drivs

Poängberäknade bedömningsskalor (NEWS2-liknande, RETTS-liknande eller det instrument
ägaren nämnde, om det visar sig vara en beräknande skala snarare än en läsbar checklista),
allt som föreslår en åtgärd baserat på inmatade patientvärden, allt som skulle kräva
att Synappsen *skriver om* eller *tolkar* en nationell källa snarare än att länka till den,
och allt som reproducerar ett licensbelagt instruments innehåll. Dessa hör hemma i samma
"rör inte"-kategori som dosberäkning redan gör i `ETAPPLAN11.md`.

**Klart när:** en extern juridisk bedömning (inte en kodgenomgång) har besvarat frågorna
nedan, och svaren är inskrivna i `SAKERHETSRAPPORT.md` innan något publiceras för en kund.
Utkastet formulerade det här som ett binärt utfall ("bedömningen bekräftar att 64a–64d
håller"), vilket verkligheten sällan levererar – ett delvis ja är det mest sannolika svaret,
och då ska det gå att se vad som fortfarande är byggbart:

| # | Fråga till juristen | Om svaret är ja | Om svaret är nej |
|---|---|---|---|
| 1 | Kvalificerar ett rent referensbibliotek (metadata + länk, ingen bearbetning) som medicinteknisk programvara enligt MDR art. 2(1) / MDCG 2019-11? | **Ja, det kvalificerar** → A faller i sin nuvarande lätta form: full MDR-efterlevnad (klinisk utvärdering, CE-märkning, kvalitetsledningssystem) är sannolikt inte proportionerligt för ett litet baspaket. Gå till fråga 2 – ändrar B bilden? | **Nej, det kvalificerar inte** → 64a–64d är byggbara som beskrivet, ren referensfunktion utan MDR-börda |
| 2 | Ändras svaret på fråga 1 av vem som står som utgivare – Synappsen centralt, eller kunden själv efter en engångsimport? | Beslutspunkt 2 blir ett rent affärsval | Beslutspunkt 2 är avgjord av juridiken, inte av oss |
| 3 | Får instrumentets innehåll återges i produkten, eller bara länkas? (Per instrument – svaret kan skilja sig åt.) | 64c kan mjukas upp för just de instrumenten | 64c står som skriven, ren länkning |
| 4 | Ändrar opt-in (64d) ansvarsbilden på ett sätt som är värt att behålla även om 1–3 är gröna? | Behåll opt-in | Ompröva om baspaketet kan ingå i Core |

---

## Beslutspunkter som kräver ägaren

| # | Fråga | Varför det inte är mitt beslut | Min rekommendation |
|---|---|---|---|
| 1 | ~~Ska baspaketet drivas vidare?~~ **Avgjort 2026-08-11, se `BESLUTSLOGG.md`: ja.** **Fortsatt öppet: vem gör den juridiska bedömningen innan något byggs?** | Regulatorisk risk (MDR) och upphovsrätt är juridiska frågor, inte tekniska – jag kan visa VAR gränsen sannolikt går utifrån hur klinikstödet redan är byggt, men jag kan inte lämna ett juridiskt bindande svar. | **Beställ en kort extern bedömning av de fyra frågorna i "Klart när" INNAN kod skrivs**, snarare än att bygga först och fråga sedan. Ordningen (juridik → kod) är viktigare än vilken vecka det byggs. Se `OPPNA-PUNKTER.md` för den konkreta öppna raden. |
| 2 | **Vilken leveransmodell: centralt kurerat paket (A) eller engångsimport till kundens eget innehåll (B)?** | Det är ett produkt- och ansvarsval, inte ett tekniskt. A och B ger olika löften till kunden. | **Utred B först.** Se jämförelsen nedan – B löser två av de fyra tekniska förutsättningarna gratis (den centrala larmvägen och frågan var paketet lever) och flyttar utgivaransvaret, men de två andra (fyrakällorstaket, domänlistan) kvarstår oavsett modell, och löftet "alltid aktuellt, samma för alla" försvinner. Vilket pris som är värt att betala är ditt beslut, inte mitt. |
| 3 | **Vem förvaltar baspaketet, och vad får det kosta per månad?** | En löpande redaktörskostnad för leverantören är en affärsfråga. | **Prissätt det innan bygget, inte efter.** Ett kurerat delat bibliotek är ett åtagande för alla kunder, för alltid – strukturellt olikt allt annat i produkten, där innehållsansvaret ligger hos kunden. Om ingen har tid att förvalta det är B (eller inget alls) rätt svar oavsett vad juristen säger. |

### Beslutspunkt 2 i detalj: A eller B

**Alternativ A – centralt kurerat paket** (utkastets ursprungliga idé). Synappsen äger
posterna, de är samma för alla kunder, uppdateringar slår igenom överallt.
*Kräver:* alla fyra tekniska förutsättningar ovan, en ny central larmväg, löpande förvaltning,
och att juristens svar på fråga 1 är **nej** (kvalificerar inte som medicinteknisk
programvara) – annars kräver A full MDR-efterlevnad, se tabellen ovan.
*Ger:* det starkaste kundlöftet – "ni får ett underhållet nationellt referensbibliotek".

**Alternativ B – engångsimport till kundens eget innehåll.** Baspaketet levereras vid
etablering som referensposter i kundens egna rutiner, exakt som Etapp 56:s startbibliotek
redan gör. Kunden blir utgivare och ägare från sekund ett.
*Kräver:* att seedningsmekanismen från Etapp 56 utökas, PLUS de två universella
förutsättningarna (2 och 3 i tabellen ovan) – domänlistan och fyrakällorstaket är oberoende av
vem som äger posten. Men **den befintliga källbevakningen fungerar oförändrat** (posterna
ligger på kundens rutiner, larmet går till kundens rutinägare, precis som idag – dock bara för
kunder som själva har Källbevakning-modulen aktiverad, samma begränsning som gäller allt annat
`externaKallor`-innehåll redan idag), ingen central larmväg, ingen fan-out, ingen central
förvaltning.
*Ger:* ett svagare löfte – innehållet divergerar per kund och blir inte automatiskt uppdaterat
centralt. *Men:* det flyttar utgivaransvaret till kunden, vilket sannolikt är den viktigaste
skillnaden i juristens ögon (se fråga 2 ovan).

Utkastet nämnde Etapp 56 men bara för att kontrastera mot den ("mallar är skelett, baspaketet
är kurerat innehåll"). Det missade att Etapp 56:s *leveransmekanism* är ett färdigt svar på
64:s svåraste frågor. Det är inte samma sak som att B är rätt val – bara att det borde
utredas innan A byggs.

---

## Föreslagen ordning

Ingen – planen har bara en etapp, och den är fortfarande villkorad av beslutspunkt 1:s andra
hälft (vem kommissionerar bedömningen). Den blockerar inget annat: `ETAPPLAN12.md`s Etapp
59–63 är helt klara och deployade, och inget i den här planen behövde vänta på dem. Att
planen är ANTAGEN betyder att den är prioriterad framför en ny okänd idé – inte att en
kodsession kan börja bygga 64a–64d.

---

## Sammanfattning

| Etapp | Innehåll | Modul | Risk | Status |
|---|---|---|---|---|
| **64** | Baspaket: nationella referenser (rena länkar/metadata, aldrig beräkning eller reproduktion) | Ny (ej namngiven) – se 64d om ringarna på vattnet | **Regulatorisk – MDR + upphovsrätt** | **ANTAGEN 2026-08-11** (drivs vidare), men **ej byggbar förrän juridisk bedömning finns** (beslutspunkt 1:s andra hälft – vem kommissionerar). Leveransmodell ej vald (beslutspunkt 2). Förvaltning ej prissatt (beslutspunkt 3). |

---

## Vad som INTE föreslås inom ramen för den här idén, oavsett hur den utvecklas

- **Ett eget varumärke/en egen tolkning av ett nationellt instrument.** Om det byggs är det
  en länk till originalet, aldrig en Synappsen-version av det.
- **Automatisk uppdatering av innehåll utan mänsklig granskning.** Källbevakningen larmar
  vid ändring – den skriver aldrig om posten automatiskt. Samma "alltid en människa innan
  publicering"-princip som gäller allt annat AI-genererat i produkten.
- **Att baspaketet blir förvalt.** Se 64d – opt-in är en förutsättning, inte en detalj.
- **Att bygga A "provisoriskt" i väntan på juristens svar.** Det är exakt den ordningen
  beslutspunkt 1 finns för att förhindra.
