# ETAPPLAN 10 – "Redo att drivas": från byggd produkt till driftbar tjänst

*Antagen 2026-08-06, utgångsläge v5.76.0, efter att Etapp 44–47 blivit klara och deployade
(körning #68). Etapp 48–52. Ursprungligen ett externt utkast, granskat och skärpt innan
antagande – se "Ändringar mot utkastet" nedan.*

> **Premisskontrollens gränser:** det här dokumentet är skrivet mot dokumentationen och en
> första kontroll av koden, inte mot en fullständig genomläsning. Genomgående krav 8 gäller
> oförändrat och ska köras mot faktisk kod innan varje delmål byggs. Flera punkter nedan är
> uttryckligen markerade "verifiera först" – erfarenheten från 43d (mörkt läge fanns redan),
> Etapp 44 (offline-kön fanns redan) och Etapp 46 (två av tre idéer visade sig obyggbara) säger
> att minst en av punkterna nedan sannolikt är antingen redan löst eller omöjlig som beskriven.

---

## Ändringar mot utkastet (granskning 2026-08-06)

Utkastets sakpåståenden kontrollerades mot faktisk kod innan planen antogs. Samtliga stämde:
`exporteraOrganisation` täcker verkligen bara 7 collections (`rutiner, anslag, kontakter,
lankbibliotek, forradsartiklar, skiftrapporter, kommentarer`) – alla sju påstått saknade fält
(`revisionslogg`, `matvardenSnapshots`, `checklistkorningar`, `bristanmalningar`,
`introduktionsspar`, `kompetenskrav`, `systemstatus`) saknas verkligen. `pausaOrganisation` gör
bara en statusflagga. Backup-gallringen (90 dagar) och `hamtaBackupstatus` finns redan.
`arPlattformsadmin()`-gränsen stämmer precis som beskrivet.

Tre skärpningar gjordes innan antagande:

1. **48b:s referens till "samma mönster som AI-budgetens 80 %-larm" är missvisande.**
   AI-budgetlarmet i dag är ett `Sentry.captureMessage` (functions/index.js), inte något som
   syns i leverantörsvyn. 48b vill ha larmet synligt *i UI* – det är alltså en nybyggnad, inte
   återanvändning av en befintlig vy. Dessutom: sökkvoten är i dag rate-limitad **per
   användare** (20/timme), inte globalt eller per organisation som utkastet antydde – det
   delade dygnstaket (100/dygn, Googles egen gräns) har ingen egen mätpunkt alls i koden. 48a
   är därför bredare än ett smalt verifieringssteg – det är i praktiken "bygg mätpunkten från
   grunden", inte "hitta den befintliga".
2. **48c och 50a/50b fick egna "verifiera först"-markeringar** (fanns bara på 48a i utkastet).
   48c förutsätter tillgång till faktisk molnkostnadsdata (Firebase-fakturering) som inte är
   bekräftad tillgänglig programmatiskt – samma typ av osäkerhet som App Check-metriken visade
   sig ha (`ETAPPLAN4.md`/`OPPNA-PUNKTER.md`). 50b är den arkitektoniskt mest nya biten i hela
   planen: en tidsbegränsad, villkorad läsrätt i `firestore.rules` (en `request.time`-jämförelse
   mot en lagrad utgångstid) är ett mönster som inte finns någon annanstans i regelfilen i dag.
3. **49a avkopplas explicit från 49b–49d.** Beslutspunkt 2 gör tydligt att 49a (automatiserad
   radering) kräver ett ägarbeslut som inte är akut. Men 49b (återställningsövning), 49c
   (återkommande rutin) och 49d (exportens fullständighet) ska köras oavsett vad det beslutet
   blir – de är inte villkorade av att 49a byggs.

---

## Var projektet står

Fyra planer i rad har riktats inåt: gränssnittet (42–43), app-känslan (44),
kvalitetsmaskineriet (45), incidentberedskapen och söket (46–47). Arbetet har varit
välgjort, och Etapp 45 stängde den strukturella svaghet en extern granskning pekade ut.

Efter det finns inget kvarvarande arbete i någon planfil. `ETAPPLAN8.md`s kö är tom.
`OPPNA-PUNKTER.md` innehåller nio rader – och **varenda en av dem väntar på en människa,
ett beslut eller en kund, inte på kapacitet.**

Det är den situationen den här planen svarar på. Tesen:

> **Produkten är byggd. Tjänsten runt den är det inte.** Det finns saker som bara blir
> synliga när någon annan än utvecklaren ska drifta, sälja, supporta och avveckla den – och
> flera av dem är löften som redan står skrivna i `avtal/`-mappen utan att vara byggda.

Fyra konkreta exempel, alla dokumenterade i projektets eget material och bekräftade mot koden
inför antagandet:

1. **`avtal/PUB-AVTAL-MALL.md` p. 6 lovar radering vid avtalets slut – manuellt.** Det står
   ärligt i mallen, vilket är rätt. Men det är ett åtagande i ett personuppgiftsbiträdesavtal
   som i dag utförs av en person som kommer ihåg att göra det. Bekräftat: `pausaOrganisation`
   sätter bara en statusflagga, ingen radering finns.
2. **`avtal/IT-FAKTABLAD.md` har fortfarande `[FYLLS I]` för återställningstid.** Ingen
   återställning från backup har någonsin genomförts och tidtagits. En påhittad RTO är värre
   än ingen.
3. **Sökmotorns gratiskvot är 100 anrop/dygn för hela installationen, alla kunder** (Etapp
   7d). Bekräftat: ingen mätpunkt alls finns för det delade dygnstaket i dag; endast en
   per-användarbegränsning (20/timme) finns. Med en kund märks det aldrig. Med tre kan en
   kunds förmiddag släcka en annan kunds klinikstöd, och ingenting varnar i förväg.
4. **Leverantören kan medvetet inte läsa kundens innehåll** (verifierat i Etapp 32c, och
   bekräftat igen i denna genomgång: `arPlattformsadmin()` ger läsrätt till organisationsmetadata
   och revisionslogg, men rutiner/kontakter/förrådsartiklar/anslag gates uteslutande på
   `matcharMinOrg()`). Det är en integritetsstyrka som ska bevaras – men det betyder att en
   supportfråga om en trasig checklista i dag måste lösas blint över telefon.

Ingen av dessa fyra är blockerad av något. Alla fyra blir akuta samtidigt, den dag det finns
en betalande kund.

---

## Ordningsprincip

1. **Etapp 48 först** – kapacitetstaket är det enda i planen som kan orsaka ett fel hos en
   kund utan att någon gjort något fel.
2. **Etapp 49** stänger två skrivna avtalslöften. Bör göras innan avtalet skrivs under, inte
   efter. (49b–49d oberoende av 49a, se "Ändringar mot utkastet" ovan.)
3. **Etapp 50–51** är de två som ger värde omedelbart även utan kund (support respektive
   demo/övning).
4. **Etapp 52 sist** – den kräver mest av ägaren och minst av koden.

---

## Genomgående krav

De femton kraven i `ETAPPLAN3.md`–`ETAPPLAN6.md` gäller oförändrat. Två tillkommer, båda
föranledda av vad planen rör:

16. **Ingen ny leverantörsyta får ge stående läsåtkomst till kundens innehåll.** Etapp 32c
    visade att `arPlattformsadmin()` når organisationsmetadata men inte rutiner, kontakter,
    förrådsartiklar eller anslag. Den gränsen är en produktegenskap, inte en tillfällighet.
    Allt i Etapp 50 byggs som *kundinitierad, tidsbegränsad och loggad* åtkomst – aldrig som
    en permanent utökning.
17. **Varje raderande eller irreversibel funktion kräver dubbel bekräftelse och en post i
    revisionsloggen innan den utförs, inte efter.** Gäller särskilt 49a. En felaktigt körd
    raderingsfunktion är den enda kategori av bugg i det här projektet som inte går att
    rätta i nästa release.

---

# Etapp 48 – Kapacitet och kostnad per organisation

**Varför:** punkt 3 ovan. Kostnadsmätning per organisation byggdes redan i Etapp 15c, och
AI-budgetlarmet vid 80 % i Etapp 32b – men den delade sökkvoten har inget motsvarande skydd.

**Modul:** ingen (plattform).

- **48a – ✅ KLAR (2026-08-06).** Verifiera först, och räkna med att det är en nybyggnad, inte
  en avsmalning. Bekräftat inför antagandet: sökkvoten rate-limitas i dag bara per användare
  (20/timme, `MAX_KLINIKSTOD_FRAGOR_PER_TIMME`), och det delade dygnstaket (100/dygn hos
  Google) hade ingen egen mätpunkt någonstans i koden. Omkontrollerad en gång till direkt
  före 48b:s bygge – ingenting hade ändrats.
- **48b – ✅ KLAR (2026-08-06).** Delade kvoter synliga och larmande. Se "Genomfört"/"Testat"
  nedan för detaljer.
- **48c – Verifiera först: är faktisk molnkostnad ens tillgänglig programmatiskt?** Innan
  täckningsbidrag byggs, kontrollera om Firebase/GCP-faktureringsdata går att hämta via API
  för det här projektet. Om inte (samma typ av begränsning som gjorde App Check-metriken
  obyggbar, se `ETAPPLAN4.md`) krymper delmålet till en manuell, dokumenterad uppskattning
  istället för en automatiserad vy.
- **48c (fortsättning) – Täckningsbidrag per kund.** Faktisk molnkostnad ställd mot avtalad
  avgift. `MODULPLAN.md`s prismodell (fast årsavgift per avdelning) vilar på ett
  förbrukningsantagande som ingen har mätt mot verkligheten. Det kan visa att modellen behöver
  ändras – obekvämt, men billigare att veta nu än efter tre avtal.
- **48d – Rimlighetstak per organisation.** Ett konfigurerbart tak så att en enskild
  organisation inte kan förbruka hela den delade kvoten. Förvalt generöst; syftet är ett
  skyddsräcke, inte en begränsning.

**Klart när:** frågan "vad kostar den här kunden, och vad händer om hon dubblar sin
användning?" går att besvara på en minut, och en kund kan inte längre släcka en annans
funktioner utan förvarning. (48c/48d kvarstår – se ovan.)

### Genomfört (48a–48b)

- **Ny mätpunkt `okaSokkvot(organisationId)`** i `functions/index.js`, anropad i
  `fragaKlinisktStod` direkt före det faktiska externa anropet till Custom Search (efter
  cache-kontrollen – en cacheträff kostar ingen kvot, precis som tidigare).
- **Aggregatet ligger i `systemstatus/sokkvot`** (samma delade infrastruktur-collection som
  `systemstatus/revisionskedja` från Etapp 46, ingen ny regel behövs) – men **medvetet utan
  per-organisation-uppdelning där**, eftersom `systemstatus/{id}` är läsbar för EN superadmin
  i VILKEN ORGANISATION SOM HELST, inte bara leverantörsadmin. Att lägga en annan kunds
  sökförbrukning där hade läckt cross-tenant, av samma skäl som redan gjorde att
  AI-budgetlarmet går via Sentry istället för `systemvarningar` (se kommentaren i
  `reserveraBudget`).
- **Per-organisation-räkningen ligger istället på `organisationer/{orgId}`** själv
  (`sokkvotDatum`/`sokkvotAntal`), som redan bara är läsbar av den egna organisationen och
  leverantörsadmin – ingen ny regel, ingen ny läcka.
- **Larm vid 80 % av dagstaket** via `Sentry.captureMessage` (samma mönster/tröskel som
  AI-budgetens `BUDGETVARNING_TROSKEL`), en gång per dygn.
- **`listaOrganisationer`** utökad att returnera `sokkvot: { totalAntal, tak }` (aggregat) och
  `sokkvotIdag` per organisation – båda beräknade mot dagens datum (Europe/Stockholm) så att
  gårdagens siffror aldrig visas som aktuella.
- **Leverantörsvyn (`Leverantor.jsx`)** visar en ny sektion "🔍 Delad sökkvot idag"
  (total/tak, varningsfärgad vid ≥80 %) och en rad per organisation ("Sökkvot idag: N") när
  organisationen sökt minst en gång samma dag.

### Testat (48a–48b)

- 5 nya functions-tester (`tests/functions/sokkvot.test.cjs`): total- och orgräknare ökar
  korrekt och oberoende av varandra, ett gammalt datum nollställer BÅDA räknarna istället för
  att räkna vidare på gårdagens siffror, och larmet sätts (utan att kasta fel) vid 80/100.
- Inga nya Firestore-regler krävdes – `systemstatus/{id}` och `organisationer/{orgId}` täcks
  redan av befintliga, testade regler (`tests/rules/systemstatus.test.mjs`,
  `organisationsisolering.test.mjs`); hela `test:rules`-sviten kördes om ändå och är grön.
- Fullt testsvep: lint, build, vitest (124/124), `test:rules`, `test:functions`.

---

# Etapp 49 – Livscykeln stängd

**Varför:** punkt 1 och 2 ovan. Två skrivna åtaganden i `avtal/`-mappen som inte har någon
motsvarighet i kod.

**Modul:** ingen (plattform).

- **49a – Automatiserad radering vid avetablering.** *Villkorat av beslutspunkt 2 (ägaren) –
  49b–49d nedan är INTE beroende av detta beslut och ska köras oavsett utfall.* En riktig
  raderingsfunktion: organisationens data, uppladdade filer och backupfiler. Dubbel
  bekräftelse, obligatorisk angiven anledning, loggad i revisionsloggen **innan** körningen
  (krav 17), och en kvittensrapport efteråt som kunden kan få. Uppdatera
  `avtal/PUB-AVTAL-MALL.md` p. 6 – **i den ordningen**, aldrig tvärtom.
  **Verifiera först:** bekräftat att `pausaOrganisation` bara sätter en statusflagga och att
  `exporteraOrganisation` är en tunn wrapper runt samma `backupaOrganisation` som det
  schemalagda jobbet – ingen av dem gör något som 49a kan återanvända rakt av, men
  backup-gallringsmönstret (`gallraGamlaBackuper`, `functions/index.js`) är en bra mall för
  hur en riktig raderingsfunktion bör vara strukturerad.
  **Backup-gallringen (90 dagar) byggdes redan i Etapp 33c och är bekräftat aktiv** –
  raderingsfunktionen behöver alltså bara städa organisationens live-data och Storage-filer,
  inte uppfinna backup-hanteringen på nytt.
- **49b – En faktisk återställningsövning.** Återställ en veckobackup i en testmiljö, ta tid,
  och fyll i `[FYLLS I]` i `avtal/IT-FAKTABLAD.md` med en **uppmätt** siffra. Skriv ner
  proceduren som en runbook medan den är färsk – samma logik som tabletop-övningen i 34c, som
  var det bästa enskilda arbetet i hela dokumentationen just för att den följde ett verkligt
  förlopp i stället för att beskriva ett tänkt.
- **49c – Återställningsövningen som återkommande rutin.** En rad i den befintliga
  återkommande säkerhetsgenomgången, inte en engångshändelse.
- **49d – Exportens fullständighet.** Bekräftat: `exporteraOrganisation` täcker i dag bara
  `rutiner, anslag, kontakter, lankbibliotek, forradsartiklar, skiftrapporter, kommentarer`
  (`BACKUP_COLLECTIONS`, `functions/index.js`). Sju collections saknas helt:
  `revisionslogg`, `matvardenSnapshots`, `checklistkorningar`, `bristanmalningar`,
  `introduktionsspar`, `kompetenskrav`, `systemstatus`. `kompetenskrav` är dessutom
  rent klientskriven (`src/hooks/useKompetenskrav.js`) och rörs aldrig av Cloud Functions –
  värt att dubbelkolla dess Firestore-regelvägar samtidigt. En dataportabilitetsbegäran som
  saknar hälften är en GDPR-brist, inte en bugg.

**Klart när:** det inte finns ett enda `[FYLLS I]` kvar i `avtal/`-mappen, och varje löfte i
PUB-mallen har en funktion bakom sig.

---

# Etapp 50 – Supportbarhet utan innehållsåtkomst

**Varför:** punkt 4 ovan. Att vända en verifierad integritetsstyrka till en säljbar funktion i
stället för ett arbetshinder.

**Modul:** ingen (plattform).

- **50a – Verifiera först.** Kontrollera exakt vad Etapp 32a:s `permission-denied`-rapportering
  redan fångar och var den visas i dag, innan en ny diagnostikvy byggs ovanpå den – det är
  fullt möjligt att en del av 50a redan är synlig någonstans i leverantörsvyn.
- **50a (fortsättning) – Diagnostik utan innehåll.** En leverantörsvy som per organisation
  visar strukturell hälsa: antal dokument per collection, senaste skrivning, felfrekvens från
  Etapp 32a:s `permission-denied`-rapportering, modulstatus, AI- och sökförbrukning mot tak
  (48b), senaste lyckade backup (46 byggde redan `hamtaBackupstatus`, bekräftat i drift).
  **Metadata, aldrig dokumentinnehåll.**
- **50b – Verifiera först: det här är den arkitektoniskt mest nya biten i hela planen.**
  En tidsbegränsad, villkorad läsrätt i `firestore.rules` (en `request.time`-jämförelse mot en
  lagrad utgångstid) finns inte som mönster någon annanstans i regelfilen i dag. Skriv och
  testa mönstret isolerat (ett rules-test som beviljar läsning inom fönstret och nekar utanför
  det) innan det kopplas in i en riktig UI-yta.
- **50b (fortsättning) – Tillfällig, kundinitierad supportåtkomst.** Kundens superadmin
  beviljar läsåtkomst i ett begränsat fönster (förslagsvis 4 timmar) med angiven anledning.
  Loggas i revisionsloggen i båda ändar, **syns tydligt i kundens gränssnitt medan den är
  aktiv**, upphör automatiskt. Det här är svaret på den fråga varje upphandling ställer: *"vem
  hos er kan se våra uppgifter, och hur vet vi när de gör det?"* – i dag är svaret "ingen",
  vilket är starkt men gör support omöjlig. Efter 50b är svaret "bara när ni själva öppnar, och
  ni ser det".
- **50c – Ärendehistorik per organisation.** En enkel notering i leverantörsvyn: vad hände,
  när, vad gjordes. Med mer än en kund räcker inte minnet.

**Klart när:** en supportfråga kan besvaras utan att gissa, och utan att leverantören har
stående åtkomst till något kundinnehåll.

---

# Etapp 51 – Demo- och övningsmiljö (`ETAPPLAN2.md` Etapp 10a)

**Varför:** det enda ej genomförda delmålet i hela Etapp 10, aldrig byggt, och nu det som
står mellan produkten och både ett riskfritt säljmöte och en trygg övningsplats för en
nyanställd. Bekräftat: ingen demo-/övningsorganisation finns i dag – alla träffar på "demo" i
koden är emulatorns projekt-ID (`demo-test`), inte en riktig tenant.

**Modul:** ingen.

- **51a** En demo-organisation med realistiskt men helt fiktivt innehåll. Verksamhetsmallarna
  från fas 31 är grunden, men behöver mer kött för att visa checklistläge, kompetensmatris,
  innehållshälsa och den samlade godkännandekön. **Samma hållning som fas 31:** strukturella
  platshållare, aldrig fabricerat kliniskt innehåll.
- **51b** Nollställs nattligt via det redan etablerade schemalagda jobbmönstret, så en demo
  aldrig ärver förra besökarens spår.
- **51c** Dubblerar som **övningsmiljö för nyanställda** – kör en checklista, testa
  bristanmälan, gör en mikrokviss utan att skriva i skarp data. Kopplas till
  introduktionsspåret (19a).
- **Hårt krav:** demo-organisationen får aldrig nås från ett riktigt kundkonto eller tvärtom.
  Det är ett rules-test, inte en UI-regel.
- **Bonus värd att notera:** 51 ger också en miljö där Etapp 52:s användartest kan göras utan
  att någon behöver oroa sig för att förstöra riktig data.

**Klart när:** en säljdemo och en nyanställds första övning kan göras utan att en rad riktig
kunddata rörs.

---

# Etapp 52 – Pilotpaketet

**Varför:** den enda kategori av kunskap projektet helt saknar. Varje antagande om koden har
kontrollerats rigoröst i 47 etapper. Antagandena om användarna har aldrig kontrollerats alls,
för att de inte går att verifiera från en session.

**Modul:** ingen. Detta är till största delen inte kod.

- **52a – Införandematerial.** En kort redaktörsguide och en ensidig personalintroduktion
  ("så här hittar du en rutin, så här kvitterar du"). Bekräftat: `src/pages/Hjalp.jsx` finns
  redan (kom-igång, roller/behörigheter, FAQ) men innehåller **inte** en separat
  redaktörsguide eller en fristående personalintroduktion – 52a bygger vidare på `Hjalp.jsx`,
  inte parallellt med den.
- **52b – De två fysiska testerna, äntligen.** Etapp 30b (akutläget med handskar, i starkt
  ljus, på riktiga enheter, av personal som inte byggt något) och skärmläsartestet som
  `TILLGANGLIGHETSREDOGORELSE.md` själv efterlyser. Båda står i `OPPNA-PUNKTER.md` och båda
  kräver bokad tid, inte utvecklingstid.
- **52c – En riktig användare, en gång.** En person, ett pass, fem rutiner. Låt henne söka
  efter något hon faktiskt behöver, köra en checklista, kvittera ett anslag. Anteckna var hon
  stannar upp. Det är sannolikt det billigaste och mest informationsrika som går att göra med
  produkten just nu.
- **52d – Återkoppling in i planeringen.** Fynden blir rader i `OPPNA-PUNKTER.md` eller
  konkreta delmål – inte en rapport som läggs undan.

**Klart när:** minst en person som inte byggt Synappsen har använt den i skarpt läge, och det
finns nedskrivet vad som hände.

---

## Sådant den här planen medvetet INTE gör

| Idé | Varför inte |
|---|---|
| SSO/Entra ID (13f) | Kräver ett ägarbeslut (SAML/OIDC) som legat sedan 2026-07-28. Ligger i `FRAMTIDSPLAN.md`s ALT-A och **bör lyftas fram omedelbart om en regionkund blir aktuell** – men bygg det inte spekulativt. |
| Flera enheter i samma organisation | Planens största tänkbara risk, rör hela behörighetsmodellen. Bygg inte för en tänkt koncernkund. Ligger kvar i `FRAMTIDSPLAN.md`. |
| Kioskläge | Reserverad flagga sedan länge, `MODULPLAN.md` noterar "ingen efterfrågan ännu". Låt den ligga tills någon frågar. |
| Veckopuls via e-post (Etapp 16) | Push-notiser (Etapp 24) täcker en stor del av behovet utan ett nytt underbiträde. Ompröva när det finns en chef som faktiskt inte öppnar appen. |
| Intelligence 2.0 | Fortsatt villkorad sedan `ETAPPLAN2.md`: vänta tills minst en kund betalar för dagens Intelligence-modul. |
| Ny funktionalitet mot personalen | Sju etapper i rad har byggt för personalen. Nästa förbättring där bör komma från 52c:s observationer, inte från ännu en idé. |

---

## Beslutspunkter som kräver ägaren

1. **Etapp 48c (täckningsbidrag):** vill du veta det? Svaret kan bli att prismodellen i
   `MODULPLAN.md` inte håller. (Beror även på 48c:s "verifiera först" – frågan kan vara moot om
   faktureringsdata inte går att hämta programmatiskt.)
2. **Etapp 49a (radering):** ska den byggas nu, eller räcker den manuella rutinen tills en
   kund med strikta raderingskrav dyker upp? PUB-mallen är ärlig om läget, så det är inte
   akut – men det blir det vid första uppsägningen. **49b–49d körs oavsett svar.**
3. **Etapp 50b (supportåtkomst):** ska den finnas alls? Alternativet – att fortsätta lösa
   support blint – är ett legitimt val, men bör vara ett val.
4. **Etapp 52:** kräver bokad tid från riktiga människor. Det är den enda punkten i hela
   planen som inte går att lösa i en session, och den viktigaste.
5. **`TILLGANGLIGHETSREDOGORELSE.md`s tre `[FYLL I]`-fält** (leverantörens juridiska namn,
   e-postadress, åtgärdsdatum) ligger i `OPPNA-PUNKTER.md`. Det första förutsätter att det
   finns ett bolag att namnge – vilket kopplar ihop den här planen med bolagsbildningen och
   den pågående bisyssla-processen. Värt att veta att ett externt delat dokument står och
   väntar på det.

---

## Sammanfattning

| Etapp | Innehåll | Insats | Vad det ger |
|---|---|---|---|
| 48 | Kapacitet och kostnad per organisation | Medel (48a är en nybyggnad, inte en avsmalning) | En kund kan inte släcka en annans funktioner |
| 49 | Livscykeln stängd | Medel | Inga obesvarade löften kvar i `avtal/` |
| 50 | Supportbarhet utan innehållsåtkomst | Medel–hög (50b är arkitektoniskt nytt) | Hållbar support + ett starkt upphandlingssvar |
| 51 | Demo- och övningsmiljö | Låg–medel | Säljdemo utan kunddata + trygg övningsplats |
| 52 | Pilotpaketet | Låg kodinsats, hög ägarinsats | Den enda kunskap projektet helt saknar |

**Om bara en sak hinns med:** 48b (larm före den delade sökkvoten tar slut). Det är samma
mönster som redan byggts för AI-budgeten och tar bort en felkälla ingen skulle förstå när den
inträffar.

**Om bara en etapp hinns med:** 52. Den är billigast i kod och dyrast i kalendertid – och den
är den enda som kan visa att något av de andra fyra är fel prioriterat.

---

## Om du hellre vill åt ett annat håll

Två alternativ som skulle vara lika försvarbara, båda redan beskrivna i `FRAMTIDSPLAN.md`:

- **"Från byggd produkt till såld produkt" (ALT-A):** SSO, veckopuls, kiosk, onboarding.
  **Rätt val om en regionkund är konkret** – SSO blockerar den affären oavsett hur bra resten
  är. Fel val om den kunden är hypotetisk.
- **"Kund nummer tre":** flera enheter, demo, supportbarhet, kostnad per kund. Överlappar
  Etapp 48, 50 och 51 i det här utkastet med omvänd tyngdpunkt – där ligger det stora arbetet
  på flerenhetsmodellen, som är hög risk och bör vänta på en verklig koncernkund.

Den här planen är medvetet den varianten som **inte förutsätter någon kund alls** för att ge
värde, samtidigt som den gör produkten redo den dag en dyker upp.
