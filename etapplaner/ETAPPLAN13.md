# Etapplan 13 – Baspaket: nationella referenser, inte kliniskt beslutsstöd

*Utkast 2026-08-10, samma genomgång som `etapplaner/ETAPPLAN12.md`, men medvetet en egen fil.*
*Granskad och korrigerad 2026-08-11, andra genomläsning samma dag – se "Granskning" nedan.*
*ANTAGEN 2026-08-11 – ägaren har beslutat att idén ska drivas vidare (beslutspunkt 1:s första
hälft). Se `BESLUTSLOGG.md` för beslutet ordagrant och `OPPNA-PUNKTER.md` för vad som
konkret återstår.*
*Scaffolding-fasen byggd 2026-08-11 (v5.97.0) – se "Scaffolding-fasen" nedan för den exakta
gränsen mellan vad som är byggt och vad som fortfarande väntar.*

> **Läs detta först, ÄVEN efter antagandet.** Den här planen innehåller EN enda etapp (64),
> och den skiljer sig från alla andra antagna planer i projektet på ett sätt som är värt att
> säga rakt ut: **"antagen" betyder INTE "byggbar av riktigt innehåll".** Idén rör två
> regulatoriska gränser (medicinteknisk produkt under MDR, och upphovsrätt till nationella
> instrument) som kräver juridiska svar innan ETT ENDA riktigt namngivet instrument läggs
> in eller något blir synligt för en kund. En avgränsad scaffolding-fas ÄR byggd (ny
> ägarbestämd avvägning 2026-08-11, se "Scaffolding-fasen" nedan) – rent struktur och
> gränssnitt, utan riktigt innehåll, osynligt för alla kunder. Den gränsen är skarp och
> medveten, inte en glidning: **64a:s riktiga referensposter, 64b:s centrala källbevakning
> och varje per-organisation-toggle väntar fortfarande på den juridiska bedömningen.**
> Beslutspunkt 1:s andra hälft (vem gör bedömningen) är fortfarande öppen, se
> `OPPNA-PUNKTER.md`.

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

**Tredje genomgången (2026-08-12), mot `granskningar/JURIDISK-GRANSKNING.md` §18.** Den bredare juridiska
granskningen (ett separat dokument, inte en granskning av den här planen specifikt) täckte
och överträffade planens fyra "Klart när"-frågor, och hittade två saker planen missat helt:

8. **En tredje juridisk risk: varumärkesrätt för instrumentnamn.** Varken utkastet eller de
   två första genomgångarna identifierade att namn som "RETTS"/"VÄST-A" kan vara registrerade
   varumärken, skilt från både MDR och upphovsrätt. Nytt genomgående krav 27.
9. **En reservation mot leveransmodellens ansvarslogik.** Beslutet om leverantörsstyrd
   tilldelning (64d, beslutspunkt 2) motiverades med ansvarstydlighet. Granskningen pekar på
   att det juridiskt kan tala för MOTSATT slutsats – se reservationen under "Leveransmodellen".
   Beslutet omprövas INTE här, bara flaggat inför juristsamtalet.

"Klart när"-tabellen pekar nu på `granskningar/JURIDISK-GRANSKNING.md` §18 som den faktiska frågelistan
att skicka till juristen, snarare än planens egen (nu delvis inaktuella) fyra frågor.

---

## Bakgrund

Frågan kom från ägaren under genomgången som ledde fram till `etapplaner/ETAPPLAN12.md`: vore det en
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

Den ligger nära en gräns som redan är dragen i `etapplaner/ETAPPLAN11.md`s "Vad jag INTE föreslår":
*"Dos-/läkemedelsberäkning eller kliniskt beslutsstöd som räknar … kan klassa hela produkten
som en medicinteknisk produkt under MDR."*

---

## Genomgående krav (fortsätter numreringen från `etapplaner/ETAPPLAN12.md`)

25. **Innehåll som Synappsen själv curerar (inte en enskild kunds redaktör) får ALDRIG
    beräkna, poängsätta eller rekommendera en åtgärd – bara referera, citera och länka, med
    samma domänbegränsning och källbevakning som klinikstödet redan bevisat fungerar.** Det
    är samma linje som redan finns i "Vad jag INTE föreslår" i `etapplaner/ETAPPLAN11.md` (dosberäkning
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

27. **Instrumentens NAMN behandlas som en egen juridisk risk, skild från MDR och
    upphovsrätt.** Nytt 2026-08-12, från `granskningar/JURIDISK-GRANSKNING.md` §10.3 (en tredje risk
    varken utkastet eller den första granskningen identifierade). Namn som "RETTS" eller
    "VÄST-A" kan vara registrerade varumärken. Att lagra ett namn i en metadatapost och länka
    till originalet är sannolikt tillåtet – men att MARKNADSFÖRA namngivna paket som en
    produktegenskap ("Synappsen med RETTS") kan vara varumärkesanvändning som kräver
    tillstånd. Blir särskilt aktuellt eftersom beslutet 2026-08-11 (se "Leveransmodellen"
    nedan) uttryckligen namnger paket och gör dem till en betald tjänst. Ingen marknadsföring
    av ett namngivet paket förrän juridiken svarat på fråga 5 i `granskningar/JURIDISK-GRANSKNING.md` §18.

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
(se `saljmaterial/PITCH.md`s "Ärlighet om vad som faktiskt är mätt"), skulle det vara fel att göra ett
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
| 4 | ~~Var baspaketet lever är obesvarat.~~ **Avgjort 2026-08-11** (se "Leveransmodellen" nedan): centralt i `baspaketreferenser`, organiserat i namngivna paket, med en leverantörsstyrd per-kund urvalslista på `organisationer/{orgId}` – inte fan-out-kopior, inte kundägt innehåll. | `firestore.rules:469–497`, `functions/backup.js:36` (`BACKUP_COLLECTIONS`) | **Gäller den avgjorda modellen** | Löser tvetydigheten ren A hade (fan-out-kopior i backup/export/radering) utan att ge upp centralt ägarskap som B hade gjort. Kräver ändå den centrala larmvägen i rad 1, eftersom innehållet fortsatt är leverantörsägt. |

### Scaffolding-fasen – ✅ KLAR (2026-08-11)

Ägarbeslut samma dag som antagandet: bygg strukturen NU (utan riktigt instrumentinnehåll),
eftersom ett konkret gränssnitt är lättare för en jurist att bedöma än ett rent koncept. Se
`BESLUTSLOGG.md`. Byggt:

- **Ny collection `baspaketreferenser`**, HÅRT begränsad till plattformsadmin (leverantören) –
  verifierat med sju nya regeltester (`tests/rules/baspaketreferenser.test.mjs`): ingen
  kundorganisation, inte ens en egen superadmin, kan läsa eller skriva collectionen alls.
  Ingen per-organisation-modulflagga finns än – den läggs till i en SENARE commit, efter den
  juridiska bedömningen, tillsammans med det faktiska kundgränssnittet (64d).
- **Schemat är strukturellt begränsat till referensmetadata**: `titel`, `utgivare`,
  `kalldatum`, `url`, `kategori`. Reglerna avvisar varje skrivning som innehåller ett fält
  utanför den listan (`request.resource.data.keys().hasOnly([...])`) – ett `innehall`-fält
  går alltså inte att smyga in ens av misstag, en strukturell spärr mot 64c/krav 26, inte
  bara en konvention.
- **`url` valideras mot samma godkända källdomäner som klinikstödet** (`urlHarGodkandDoman`) –
  ingen ny domän lades till (tekniska förutsättning 3 kvarstår, se ovan).
- **Gränssnitt**: `BaspaketreferenserSektion.jsx`, en ny sektion i leverantörsvyn
  (`/leverantor`, plattformsadmin-bara route sedan tidigare) – syns aldrig för en kund. Har
  en varningstext som uttryckligen säger att sektionen inte är byggd färdig och att bara
  FIKTIVA exempelposter ska läggas in tills den juridiska bedömningen finns.
- **Vad som INTE byggdes, medvetet:** 64b:s centrala källbevakningslarm (tekniska
  förutsättning 1) och riktigt namngivet instrumentinnehåll. Se "Vad som INTE ingår" nedan –
  det gäller fortfarande fullt ut, scaffoldingen ändrar ingenting där.

### Hur ett baspaket SKA byggas, om det byggs (efter juridisk bedömning)

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
- **64d – Leverantörsstyrd tilldelning, inte kundens självbetjäning (reviderat 2026-08-11).**
  Ursprungligen skisserad som en kund-toggle likt `organisationer/{orgId}.moduler` – ändrat
  efter beslutspunkt 2/3: ingen kund väljer eller aktiverar baspaketet själv. Leverantören
  väljer per kund vilket/vilka namngivna paket (t.ex. "RETTS", "VÄST-A") som gäller, som en
  del av den betalda grundkonfigureringen (beslutspunkt 3) – ett fält plattformsadmin sätter,
  inte en `PACKAGE_FEATURES`-modul en kund kan slå på/av själv i sin egen adminpanel.
  Ansvarsfrågan hålls ändå tydlig: ingen kund får ett vårdinnehåll de inte beställt, bara att
  beställningen sker som en tjänst, inte ett självbetjäningsklick. Om ett kundfacing
  gränssnitt (visa det tilldelade paketet) byggs senare är det skrivskyddat för kunden.

### Vad som INTE ingår, oavsett hur långt idén drivs

Poängberäknade bedömningsskalor (NEWS2-liknande, RETTS-liknande eller det instrument
ägaren nämnde, om det visar sig vara en beräknande skala snarare än en läsbar checklista),
allt som föreslår en åtgärd baserat på inmatade patientvärden, allt som skulle kräva
att Synappsen *skriver om* eller *tolkar* en nationell källa snarare än att länka till den,
och allt som reproducerar ett licensbelagt instruments innehåll. Dessa hör hemma i samma
"rör inte"-kategori som dosberäkning redan gör i `etapplaner/ETAPPLAN11.md`.

**Klart när:** en extern juridisk bedömning (inte en kodgenomgång) har besvarat frågorna
nedan, och svaren är inskrivna i `granskningar/SAKERHETSRAPPORT.md` innan något publiceras för en kund.
Utkastet formulerade det här som ett binärt utfall ("bedömningen bekräftar att 64a–64d
håller"), vilket verkligheten sällan levererar – ett delvis ja är det mest sannolika svaret,
och då ska det gå att se vad som fortfarande är byggbart.

**Uppdaterat 2026-08-12: kommissionera efter `granskningar/JURIDISK-GRANSKNING.md` §18, inte listan
nedan.** Den bredare granskningen (samma dag den kommenterade dokumentet, se dess §21) har
redan formulerat en fylligare, mer precis frågelista – "Frågor att ställa till anlitad
jurist", färdig att klistras in i ett uppdragsbrev. Dess frågor 1–6 (MDR, upphovsrätt,
varumärke) täcker och överträffar de fyra frågorna nedan, inklusive en risk (varumärkesrätt
för instrumentnamn, krav 27 ovan) som inte fanns här. Tabellen nedan står kvar som
bakgrundsresonemang för VARFÖR frågorna ställs, inte som det som faktiskt skickas till
juristen.

| # | Fråga till juristen (bakgrund – se §18 för den faktiska frågelistan) | Om svaret är ja | Om svaret är nej |
|---|---|---|---|
| 1 | Kvalificerar ett rent referensbibliotek (metadata + länk, ingen bearbetning) som medicinteknisk programvara enligt MDR art. 2(1) / MDCG 2019-11? | **Ja, det kvalificerar** → A faller i sin nuvarande lätta form: full MDR-efterlevnad (klinisk utvärdering, CE-märkning, kvalitetsledningssystem) är sannolikt inte proportionerligt för ett litet baspaket. Gå till fråga 2 – ändrar B bilden? | **Nej, det kvalificerar inte** → 64a–64d är byggbara som beskrivet, ren referensfunktion utan MDR-börda |
| 2 | Ändras svaret på fråga 1 av vem som står som utgivare, ELLER av att urvalet är leverantörsstyrt snarare än kundvalt? *(Se reservationen under "Leveransmodellen" – `granskningar/JURIDISK-GRANSKNING.md` §10.3 menar att leverantörsstyrd tilldelning kan peka MOT kvalificering, tvärtemot vad ansvarstydlighets-motiveringen antog.)* | Beslutspunkt 2:s arkitektur (leverantörsstyrt urval per kund) kan behöva en egen bedömning, inte bara "samma som ren A" – ompröva mot kundstyrd aktivering om svaret är negativt | Ren A-bedömningen (fråga 1) täcker den avgjorda modellen fullt ut |
| 3 | Får instrumentets innehåll återges i produkten, eller bara länkas? (Per instrument – svaret kan skilja sig åt.) | 64c kan mjukas upp för just de instrumenten | 64c står som skriven, ren länkning |
| 4 | Utgör användning av instrumentens NAMN (t.ex. "RETTS", "VÄST-A") i marknadsföring eller produktsammanhang varumärkesintrång? (Nytt, krav 27, från §10.3.) | Namnge paket fritt i marknadsföring | Marknadsför paketen generiskt ("bedömningsstöd A"), namnge bara internt/i avtal |
| 5 | Ändrar den leverantörsstyrda tilldelningen (64d) ansvarsbilden på ett sätt som är värt att behålla även om 1–4 är gröna? | Behåll modellen som beskriven | Byt till kundstyrd aktivering – enkel ändring av vem som skriver urvalsfältet, ingen omstart |

---

## Beslutspunkter som kräver ägaren

| # | Fråga | Status |
|---|---|---|
| 1 | ~~Ska baspaketet drivas vidare?~~ | **Avgjort 2026-08-11, se `BESLUTSLOGG.md`: ja.** **Fortsatt öppet: vem gör den juridiska bedömningen innan något byggs?** Se `OPPNA-PUNKTER.md` för den konkreta öppna raden – det är den enda återstående blockeringen. |
| 2 | ~~Vilken leveransmodell?~~ | **Avgjort 2026-08-11, se `BESLUTSLOGG.md`: Alternativ A med kundspecifikt urval.** Se "Leveransmodellen" nedan för den fullständiga arkitekturen. |
| 3 | ~~Vem förvaltar baspaketet, och vad får det kosta?~~ | **Avgjort 2026-08-11, se `BESLUTSLOGG.md`: ägaren själv, som en fast engångsavgift för grundkonfigurering per kund.** Ingen löpande avgift, ingen kundens egen självbetjäning. |

### Leveransmodellen: Alternativ A med kundspecifikt urval (avgjort 2026-08-11)

**Inte** ren Alternativ A (identiskt innehåll för alla kunder) och **inte** Alternativ B
(kundägt innehåll, se `BESLUTSLOGG.md` för de två ursprungliga alternativen). Den avgjorda
modellen är en tredje variant, närmare släkt med A än B eftersom Synappsen fortsatt äger och
curerar innehållet centralt:

- **Innehållet organiseras i namngivna paket** (t.ex. "RETTS", "VÄST-A" – exempel ägaren gav,
  INTE en bekräftelse på att de är juridiskt klarerade, se "Klart när"). Varje referenspost
  i `baspaketreferenser` hör till exakt ett paket.
- **Leverantören väljer per kund vilket/vilka paket som aktiveras** – inte kundens eget val
  och inte en universell på/av-växel. Det är ägarens roll som förvaltare (beslutspunkt 3) som
  gör urvalet, som en del av den betalda grundkonfigureringen.
- **Praktisk konsekvens för datamodellen** (att bygga EFTER juridisk bedömning, inte nu):
  `baspaketreferenser` behöver en `paket`-nyckel (kategori-/gruppfält) utöver
  scaffolding-fasens redan byggda metadatafält. Aktivering blir ett leverantörsstyrt fält på
  `organisationer/{orgId}` (en lista av paket-nycklar, satt av plattformsadmin – samma mönster
  som `huvudman`/`avtalsstatus` redan använder), INTE en kundfacing modul-toggle i
  `ModulerSektion.jsx` som 64d ursprungligen skisserade. En kund ser (om/när ett
  kundgränssnitt byggs, se 64d nedan) bara det paket leverantören tilldelat, ingen
  självbetjäning.
- **Vad som INTE ändras av den här beslutet:** tekniska förutsättningarna 1–3 i tabellen ovan
  gäller precis som för ren Alternativ A – innehållet är fortsatt centralt curerat, så den
  centrala larmvägen (64b) behövs fortfarande, domänlistan och fyrakällorstaket gäller
  fortfarande. Förutsättning 4 ("var baspaketet lever") är nu besvarad: centralt, med en
  per-kund urvalslista – inte fan-out-kopior som ren A, inte kundägt som B.
- **Juridiken avgör fortfarande allt.** Att innehållet är uppdelat i paket och urvalet är
  kundspecifikt ändrar INTE MDR-kvalificeringsfrågan (samma centralt curerade innehåll,
  samma "Klart när"-fråga 1) och INTE upphovsrättsfrågan (samma "bara metadata + länk,
  aldrig reproduktion"-princip i 64a/64c/krav 26). Ordningen juridik → kod gäller oförändrat.

> **Reservation från `granskningar/JURIDISK-GRANSKNING.md` §10.3 (2026-08-12) – INTE en omprövning av
> beslutet, en flagga inför juristsamtalet.** Beslutet ovan motiverades med ansvarstydlighet:
> leverantören väljer åt kunden, så ingen kund får vårdinnehåll den inte beställt. Granskningen
> pekar på att det juridiskt kan peka åt MOTSATT håll: ju mer leverantören själv utövar ett
> omdöme om vilket kliniskt referensinnehåll som är relevant för en specifik vårdverksamhet,
> desto mer liknar agerandet just det kliniska omdöme som talar FÖR MDR-kvalificering. En kund
> som själv aktiverar ett namngivet paket (självbetjäning, som 64d ursprungligen skisserade)
> är enligt granskningen en juridiskt säkrare konstruktion än att leverantören tilldelar det.
> Detta är inte en slutsats – det är fråga 2 i `granskningar/JURIDISK-GRANSKNING.md` §18, uttryckligen
> formulerad för att ställas till juristen. Beslutet om leverantörsstyrd tilldelning STÅR KVAR
> tills svaret finns (se `BESLUTSLOGG.md` 2026-08-11); om svaret talar för kundstyrd
> aktivering istället är det en enkel ändring (samma datamodell, bara vem som får skriva
> urvalsfältet) – inte ett omstart av arkitekturen.

---

## Föreslagen ordning

Ingen – planen har bara en etapp, och den är fortfarande villkorad av beslutspunkt 1:s andra
hälft (vem kommissionerar bedömningen). Den blockerar inget annat: `etapplaner/ETAPPLAN12.md`s Etapp
59–63 är helt klara och deployade, och inget i den här planen behövde vänta på dem. Att
planen är ANTAGEN betyder att den är prioriterad framför en ny okänd idé – inte att en
kodsession kan börja bygga 64a–64d.

---

## Sammanfattning

| Etapp | Innehåll | Modul | Risk | Status |
|---|---|---|---|---|
| **64** | Baspaket: nationella referenser (rena länkar/metadata, aldrig beräkning eller reproduktion), organiserat i namngivna paket med leverantörsstyrd per-kund-tilldelning | Ny (ej namngiven) – se 64d om ringarna på vattnet | **Regulatorisk – MDR, upphovsrätt och varumärke** (den tredje tillagd 2026-08-12, se krav 27) | **ANTAGEN 2026-08-11.** Scaffolding-fasen BYGGD (v5.97.0). Leveransmodell (beslutspunkt 2) och förvaltning/prissättning (beslutspunkt 3) **AVGJORDA 2026-08-11**, se `BESLUTSLOGG.md` (leveransmodellen har en juridisk reservation från 2026-08-12, se "Leveransmodellen"). **Enda kvarvarande blockering:** riktigt innehåll och 64b:s källbevakningslarm är ej byggbara förrän den juridiska bedömningen finns (beslutspunkt 1:s andra hälft – vem kommissionerar, kommissionera efter `granskningar/JURIDISK-GRANSKNING.md` §18), se `OPPNA-PUNKTER.md`. |

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
