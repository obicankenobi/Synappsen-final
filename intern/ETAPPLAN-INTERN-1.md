# Intern etapplan 1 – Leverantörspanelen

**Etapp L1. SLUTFÖRD 2026-08-30.** Skriven 2026-08-27 på ägarens begäran, utökad 2026-08-29
(v0.2–v0.5), antagen i sin helhet 2026-08-29, och byggd i fyra omgångar under samma vecka
(se "Uppskattad arbetsinsats" och "Versionshistorik" nedan). Samtliga 16 delmål (L1a–L1p) är
klara. Beslutspunkterna 5 och 6 avgjordes genom antagandet; 1–4 avgjordes samlat 2026-08-30
(se `BESLUTSLOGG.md`), vilket löste upp de sista fem delmålen. Bara beslutspunkt 7
(feedback-inkorgen) är fortfarande öppen, och inget delmål väntar på den.

> **Varför den här filen ligger i `intern/` och inte i `etapplaner/`.**
> Ägaren bad uttryckligen om att arbetet ska hållas skilt från den kundvända
> utvecklingen. Separationen är gjord strukturellt, inte som en namnkonvention:
>
> | | Kundvänd utveckling | Intern utveckling (den här) |
> |---|---|---|
> | Plan | `etapplaner/ETAPPLANx.md`, Etapp 1–71 | `intern/ETAPPLAN-INTERN-x.md`, Etapp L1, L2 … |
> | Ändringslogg | `src/data/andringslogg.js` → syns för kunden på `/nyheter` | `intern/ANDRINGSLOGG-INTERN.md` → når aldrig klienten |
> | Beslut | `BESLUTSLOGG.md` | samma fil, men raden märks `[INTERN]` |
> | Säljmaterial | `saljmaterial/PITCH.md` m.fl. uppdateras | **berörs inte** |
>
> Numreringen `L1` i stället för `72` är avsiktlig: den kundvända etappserien ska kunna
> fortsätta räkna 72, 73 … utan att en intern etapp äter ett nummer och skapar ett hål i
> kundens historik.

---

## Vad planen är, och inte är

**Är:** att göra leverantörsvyn till ett arbetsredskap för att driva ett SaaS-bolag med
flera kunder – överblick, kunddossié, support, driftkontroll, incidentrespons, ekonomi.

**Är inte:** en väg för leverantören att läsa kundens innehåll utan kundens medgivande. Hela
produktens riskprofil och `avtal/`-dokumentationen vilar på att leverantören är
personuppgiftsbiträde med en snäv, tidsbegränsad och kundinitierad åtkomst (Etapp 50b). Den
gränsen flyttas inte av den här planen. Där en föreslagen funktion skulle tumma på den, står
det uttryckligen i beslutspunkterna.

---

## Premisskontroll (genomgående krav 8)

Nio antaganden kontrollerade mot faktisk kod 2026-08-27, innan planen skrevs. Sex höll, tre
ändrade innehållet.

### Höll

| Antagande | Verifierat |
|---|---|
| Leverantörsvyn är en platt lista av sektioner, inte en arbetsyta | `src/pages/Leverantor.jsx` är 223 rader som staplar 11 sektioner under varandra. Ingen navigation, inga underrutter |
| Det finns redan en signalmotor för "kräver åtgärd" | `src/utils/leverantorSignaler.js`, 7 signaler med tre allvarlighetsnivåer. Delad med `NyckeltalSektion` |
| Leverantörens åtgärder mot en kund revisionsloggas | `functions/avtalslivscykel.js` loggar med `organisationId: orgId` – alltså in i **kundens** hashkedja |
| Nödstopp finns men i två olika former | `systemstatus/epost.avstangd` (ett fält i ett dokument) och `kvisspaket/{paket}.avstangt` (ett dokument per paket). Två mönster för samma sak |
| Modulstyrning finns på grov nivå | 3 moduler (`operations`, `intelligence`, `kallbevakning`) som grindar 9 `FEATURE`-nycklar. Ingen styrning på enskild funktion |
| Kundens avtalsstatus har en tidsstämpel att räkna ålder på | `avtalsstatusAndrad` returneras av `listaOrganisationer` sedan v5.109.0 |

### Ändrade planen

| Antagande | Vad kontrollen visade | Följd |
|---|---|---|
| "Leverantören kan visa en kunds mätvärdestrend" | **Fel.** `organisationer/{orgId}/matvardenSnapshots` har `allow read: if arSuperadmin() && orgId == minOrganisation()` – en plattformsadmin når dem **inte**, ens under ett supportfönster | L1c blir en egen beslutspunkt, inte en självklar byggsten. Det är en utvidgning av vad biträdet ser om kunden |
| "Det går att rita en trendkurva" | **Ingen graf finns i hela appen.** Inget diagrambibliotek i `package.json`, `MatvardenTrendSektion` visar siffror i tabellform, och CSP:n tillåter inga externa resurser | L1d måste välja mellan egen inline-SVG och ett nytt beroende – blir beslutspunkt 3 |
| "Leverantören kan be om supportåtkomst" | **Fel.** `beviljaSupportAtkomst(anledning)` tar ingen `orgId` – den anropas av kundens egen superadmin för sin egen organisation. Leverantören kan bara **avsluta** ett fönster, aldrig begära ett | L1f får ett nytt delsteg: en begäran som kunden godkänner. Samtycket stannar hos kunden |

### Noterat på vägen (inte antaganden, men relevant)

- **`listaOrganisationer` är N+1.** För varje organisation görs två extra läsningar
  (`users`-count och `kostnadshistorik`). Vid 3 kunder är det 7 läsningar; vid 50 kunder 101,
  varje gång vyn öppnas. Inte ett problem i dag, men det växer linjärt med det som ska växa.
- **Ingen "senast aktiv"-uppgift finns per organisation.** Sökningen efter
  `senasteAktivitet`/`sistInloggad` ger noll träffar i `src/` och `functions/`.
- **Sentry taggar `organisationId` bara i `rapporteraNekadListning`**, inte globalt. En
  felfrekvens per kund går alltså inte att få ut i dag utan att först tagga bredare.
- **Etapp 70 och 71 har ingen planfil** – de finns bara som uppföljningar i
  `CLAUDE_STATUS.md`. Värt att veta för den som letar efter deras krav och avgränsningar.

---

## Genomgående krav

Fortsätter numreringen från `etapplaner/ETAPPLAN18.md` (krav 33–35). Kraven nedan gäller allt
internt arbete, inte bara den här etappen.

**36. Intern utveckling får aldrig synas i `src/data/andringslogg.js`.** Den filen bundlas
och visas för varje användare på `/nyheter`. En kund ska inte läsa om leverantörens
arbetsredskap. Bevakas av ett test (L1l), inte av en påminnelse.

**37. Ingen ny läsväg in i kundens innehåll utan kundens medgivande.** Leverantören får se
metadata, aggregat och driftstatus fritt. Rutintext, kommentarer, kvitteringar och
skiftrapporter kräver ett aktivt supportfönster som kunden själv öppnat. Ett aggregat som
kan brytas ner till en enskild post är inte ett aggregat.

**38. Varje åtgärd leverantören utför mot en kund ska synas i kundens egen revisionslogg.**
Det gäller redan i dag och får inte tappas bort när åtgärderna flyttar in i en ny panel.
Kunden ska kunna se vad leverantören gjort, utan att fråga.

**39. Panelen får inte bli en andra sanning.** All data ska läsas ur samma källor som
kundens egen vy använder. Ingen leverantörsspecifik kopia av kunddata, ingen egen
sammanfattningstabell som kan glida isär från originalet.

---

## Panelens upplägg

Det här avsnittet är **strukturen** – vilka vyer som finns, vad som ligger var, och varför.
Delmålen L1a–L1l nedan bygger den; om upplägget och ett delmål säger emot varandra gäller
det här avsnittet.

### Grundproblemet: en panel för flera organisationer har två arbetslägen

Dagens vy har bara ett läge. Allt är portföljformat – elva sektioner som var och en tittar
på *alla* kunder samtidigt – och den enda vägen till EN kund är att expandera en rad i
listan (`OrganisationsRad`, 300 rader inline). Det fungerar vid tre kunder och slutar
fungera vid tio.

Ett flerorganisationsverktyg behöver i stället ett **uttalat kontextbyte**:

| Läge | Rutt | Frågan det svarar på | Regel |
|---|---|---|---|
| **Portföljläge** | `/leverantor/*` | "Var behöver jag lägga min tid i dag?" | Aggregerat över alla kunder. Visar aldrig kundinnehåll, bara metadata och räknare |
| **Kundläge** | `/leverantor/kund/:orgId/*` | "Hur mår kund X, och vad gör jag åt det?" | Allt är låst till en organisation. Ingen vy här får tyst falla tillbaka på "alla" |

Kontexten ska vara omöjlig att missta sig på. I kundläget ligger en **fast kundrubrik**
högst upp på varje underflik – namn, avtalsstatus, demo-märkning och, viktigast, om ett
supportfönster är öppet just nu. Det är den enda skylten som skiljer "jag ser metadata om
kunden" från "jag kan läsa kundens innehåll", och den skillnaden är juridisk, inte
kosmetisk.

Byte mellan kunder sker i en **kundväljare** i panelens överkant som behåller den underflik
man står på: står du på `kund/a/anvandning` och byter kund landar du på
`kund/b/anvandning`, inte på kundens startsida. Det är hela poängen med ett
flerorganisationsverktyg – att kunna jämföra samma sak hos två kunder utan att navigera om.

### Kontomodellen – ett konto, ingen organisationstillhörighet

Ägaren har begärt (2026-08-29) att panelen ska nås med **ett enda övergripande konto** som
varken tillhör en kundorganisation eller behöver gå via en organisations egen vy. Det är inte
bara en inloggningsdetalj – det ändrar var åtkomstgränsen går, och det ska därför byggas
FÖRE skelettet (L1a). Delmål: L1m.

**Så ser det ut i dag.** Leverantörsbehörigheten sitter redan rätt: den ÄR existensen av
`plattformsadmin/{uid}`, inte en roll, och den är oberoende av vilken organisation kontot
tillhör (`functions/organisationslivscykel.js` `kravPlattformsadmin`). Men *kontot* är ett
vanligt kundkonto: `users/{uid}` med ett `organisationId`, `/leverantor` ligger inuti
`SkyddatLayout` med kundens `BottomNav` och `Sidomeny`, och startsidan är kundens `Hem`.
Leverantören loggar alltså in i en kunds vy och klickar sig därifrån vidare till panelen.

**Premisskontroll (krav 8) – fyra fynd som avgör hur det får byggas:**

| Fynd | Var | Följd |
|---|---|---|
| `minOrganisation()` faller tillbaka på `'default'` när fältet saknas | `firestore.rules:36` | Ett konto **utan** `organisationId` blir inte organisationslöst – det blir medlem i organisationen `default`, som innehåller verklig data. Att bara utelämna fältet är alltså det farligaste alternativet, inte det säkraste |
| Åtta klientfiler gör `organisationId ?? STANDARD_ORG` | `useRutiner`, `useAnslag`, `useAuditlogg`, `useForradsartiklar`, `useKontakter`, `useLankbibliotek`, `useSkiftrapport`, `useSokloggar` + `AuthContext` | Samma sak på klientsidan: ett tomt fält riktar läsningar och skrivningar mot `default` |
| `farForsokaLasaPlattformsadmin(uid, role)` kräver `role === 'superadmin'` | `src/firebase/roles.js:69` | Leverantörskontot kan **inte** ges en låg roll "för säkerhets skull" – klienten skulle då aldrig ens försöka läsa `plattformsadmin/{uid}` och panelen vore osynlig. Rollen måste vara `superadmin` |
| `users/{uid}` har `allow create: if false`, och enda vägen in är `losInInbjudan` – som binder kontot till en organisation | `firestore.rules:483` | Kontot går inte att skapa med något befintligt flöde. L1m behöver en egen Cloud Function |

**Lösningen: `_plattform` som organisationstillhörighet.** Sentinelvärdet finns redan i
koden som pseudo-organisation för revisionsloggning av plattformsåtgärder (Etapp 32c,
`functions/organisationslivscykel.js:330`: *"'_plattform' är inget riktigt organisationId –
det finns aldrig en kund vid namn det"*). Leverantörskontot får:

```
users/{uid}          → { organisationId: "_plattform", role: "superadmin", namn: … }
plattformsadmin/{uid} → { blevPlattformsadmin: … }
```

Varför det här är rätt form, och inte en ny flagga:

- **Isoleringen blir en följd av befintliga regler, inte av ny kod.** Varje
  organisationsgrindad regel jämför dokumentets `organisationId` mot `minOrganisation()`.
  `_plattform` matchar ingen organisation, så kontot nekas allt kundinnehåll **utan att en
  enda regel skrivs om**. Ett nytt undantag i reglerna hade i stället lagt till en väg in.
- **Fallbacken till `default` slutar gälla**, eftersom fältet finns och har ett värde. Både i
  reglerna och i de åtta klientfilerna.
- **`superadmin` är ofarligt här.** Rollen ger makt *inom den egna organisationen*, och
  `_plattform` har inga användare, inga rutiner och inget organisationsdokument. Rollen
  behövs bara för att klienten ska våga slå upp plattformsadmin-statusen.
- **Innehållsgränsen är oförändrad.** `farSupportlasa(orgId)` kräver inget medlemskap – bara
  `plattformsadmin/{uid}` plus ett aktivt, kundbeviljat fönster. Ett organisationslöst konto
  får alltså varken mer eller mindre innehållsåtkomst än i dag.

**Kundvyerna stängs i BÅDA riktningarna.** Reglerna nekar redan läsningarna, men ett konto
som kan navigera till `/kliniskt-stod` och får en tom sida med konsolfel är ett sämre
gränssnitt än ett som inte kan hamna där. `SkyddatLayout` skickar därför ett
`_plattform`-konto vidare till `/leverantor`, och `/` gör detsamma – panelen är kontots
startsida, inte en flik i kundens app. Panelen får en egen `LeverantorsLayout` utan
`BottomNav` och `Sidomeny`.

**Att titta på en kunds innehåll under ett supportfönster** kan då inte längre gå via
`AuthContext.organisationId`, eftersom det är `_plattform`. Kundläget måste mata `orgId`
explicit till de hookar som ska återanvändas. Det är ingen extra kostnad – det är samma sak
kundläget behöver ändå för att kunna byta kund utan att logga om, och det gör dessutom varje
läsning av kundinnehåll synlig i koden i stället för implicit via inloggningen.

**Vad det kostar ägaren.** Ett `_plattform`-konto ser inte längre någon kundvy inifrån. Vill
man se hur produkten faktiskt ser ut för en användare krävs antingen demomiljön (Etapp 51,
finns) eller ett separat konto i en riktig organisation. Det är rimligt – det är precis den
separation begäran gick ut på – men det ska vara ett medvetet val, inte en överraskning
första gången panelen används.

### Åtkomsttaket – två nivåer, inte en

Hela upplägget vilar på att leverantören har **två olika** behörigheter, och att panelen
aldrig blandar ihop dem:

| Nivå | Vad den ger | Var den kommer ifrån | Var i panelen |
|---|---|---|---|
| **Metadata** | Organisationens namn, status, moduler, antal användare, kostnad, kvot, avtalsstatus | `plattformsadmin/{uid}` – gäller alltid | Nästan hela panelen |
| **Innehåll** | Kundens rutiner, dokument, mätvärden, enskilda användare | Ett supportfönster som **kunden själv** öppnar (`beviljaSupportAtkomst`, Etapp 50b) | Endast supportarbetsytan och block markerade med hänglås |

Praktisk konsekvens för utformningen: block som kräver innehållsåtkomst ska finnas kvar i
gränssnittet även när fönstret är stängt, men **tomma och märkta med varför** – inte
bortgömda. Ett block som försvinner får det att se ut som att funktionen saknas; ett block
som säger "kräver supportfönster, kunden har inte öppnat något" lär ut var gränsen går varje
gång man ser den.

### Navigationsträdet

```
/leverantor                          Översikt        ← startsida, portföljläge
/leverantor/kunder                   Kundregister    ← listan + pipeline
/leverantor/support                  Support         ← ärenden och fönster, alla kunder
/leverantor/drift                    Drift & incident
/leverantor/innehall                 Innehåll        ← kvissbank, baspaketreferenser
/leverantor/ekonomi                  Ekonomi
/leverantor/logg                     Åtgärdslogg     ← vad JAG gjort, tvärs kunderna

/leverantor/kund/:orgId              Kunddossié      ← kundläge börjar här
/leverantor/kund/:orgId/anvandning
/leverantor/kund/:orgId/ekonomi
/leverantor/kund/:orgId/atgarder
/leverantor/kund/:orgId/historik
```

Sju portföljvyer och fem kundflikar. Vänsternavigering för portföljen (mönstret finns i
`src/components/Sidomeny.jsx`), flikrad inuti kundläget. Rutterna i `src/App.jsx` är i dag
platta – kundläget blir den första nästlade rutten i appen och behöver en egen layoutrutt
som håller kundrubriken och hämtningen av `:orgId`.

Varje ny rutt gatas server-side precis som `/leverantor` i dag. **Klientens rutt är ingen
behörighetskontroll** – testet i L1a ska verifiera att en icke-plattformsadmin nekas på var
och en av de tolv rutterna, inte bara på panelens startsida.

### Vad varje vy innehåller

**Översikt** är en triage-yta, inte en instrumentbräda. Överst: dagens signaler från
`src/utils/leverantorSignaler.js`, grupperade på allvarlighetsgrad, med kundnamnet som länk
rakt in i rätt kundflik. Under: de fyra nyckeltalen som redan finns, och driftstatus (delad
sökkvot mot tak, e-postnödstoppets läge). Inget här ska kräva att man scrollar för att veta
om något brinner.

**Kundregister** är dagens `OrganisationsListaSektion` med sitt URL-buret filtertillstånd
– det är redan välbyggt och flyttas oförändrat. Skillnaden är att en rad inte längre
expanderar; den **länkar** till kunddossién. Här ligger också "skapa organisation" och
onboarding-pipelinen (L1h), eftersom en kund som inte finns än inte kan ha en dossié.

**Kunddossién** är planens tyngdpunkt och beskrivs i L1b. Fördelningen över de fem flikarna:
startsidan svarar på "mår kunden bra?" (huvud, kontakt, hälsa, öppna signaler), och de fyra
övriga är de fördjupningar man går till när svaret är nej. Åtgärdsfliken samlar allt som i
dag ligger utspritt över `OrganisationsRad` och fyra andra sektioner – pausa, avtalsstatus,
provperiod, årsavgift, sökkvottak, huvudman, seeda startbibliotek, exportera, avsluta
supportfönster.

**Support**, **Drift & incident**, **Ekonomi** och **Åtgärdslogg** är portföljvyer av det
som annars bara syns per kund. Poängen med dem är korsjämförelsen: vilka fönster är öppna
just nu, vilka kunder ligger nära kvottaket, var marginalen är negativ, vad jag gjort den
senaste veckan och hos vem. Var och en av dem ska ha kundnamnet som länk in i kundläget, så
att portfölj → kund är ett klick överallt.

**Innehåll** är det enda som är genuint kundlöst – kvissbanken och baspaketreferenserna är
globala och delas av alla organisationer. Den ligger därför medvetet utanför både
portfölj- och kundläget i tanken, även om den bor på en portföljrutt.

### Datastommen

Kontextbytet ovan kräver att datahämtningen delas i två anrop, vilket den inte är i dag:

| Anrop | Ansvar | Läsningar |
|---|---|---|
| `listaOrganisationer` (finns) | **Bantas.** Bara det listan och signalerna faktiskt behöver | Ska bli 1 + N, inte 1 + 2N |
| `hamtaKundDossie(orgId)` (ny) | Allt tungt för EN kund – kostnadshistorik, kvotserie, användarsammanställning, leverantörens åtgärder | Betalas bara när en kund faktiskt öppnas |

Det här är L1k, men det hör hemma i upplägget snarare än som en fristående optimering:
`listaOrganisationer` gör i dag två extra läsningar per organisation (`users`-count och
`kostnadshistorik`) **varje gång panelen öppnas**, oavsett om man tänkte titta på en kund
eller inte. Vid 3 kunder är det 7 läsningar, vid 50 kunder 101. Drilldown-mönstret gör
kostnaden proportionell mot vad man tittar på i stället för mot hur många kunder man har.

### Tre komponenter som delas av allt

1. **`Kundvaljare`** – kundbyte som behåller underfliken. En plats, används i kundrubriken.
2. **`Signalmarke`** – samma allvarlighetsfärg och -text i översikten, kundregistret och
   kunddossién. Signalerna beräknas redan på ett ställe; presentationen ska också göra det.
3. **`LeverantorsAtgard`** – en omslutning runt varje knapp som ändrar något hos en kund:
   bekräftelse, obligatorisk anledning, och revisionsloggning in i **kundens** hashkedja
   (`organisationId: orgId`, mönstret finns i `functions/avtalslivscykel.js`). Att det är en
   komponent och inte en konvention är hela poängen – en åtgärd som glömmer loggas är
   omöjlig att upptäcka i efterhand.

### Byggordning för upplägget

Skelettet (L1a) är en ren flytt utan beteendeförändring och kan byggas när som helst.
Kundläget (L1b) är det som ger nyttan. Allt annat hänger på beslutspunkterna nedan.

**Om bara två saker byggs:** L1l (separationen mot kundens ändringslogg) och L1b
(kunddossién). Upplägget ovan går att införa stegvis – kundläget kan existera parallellt med
dagens inline-expansion tills det är komplett, och listan kan länka till det så snart
startsidan finns.

---

## Behoven, och vilken funktion som möter varje

Delmålen ovan beskriver VAD som byggs. Det här avsnittet beskriver VARFÖR – vilka
återkommande arbetsuppgifter ägaren faktiskt har, och vilken funktion som svarar mot var och
en. Skrivet 2026-08-29 på ägarens begäran.

Behoven är härledda ur vad koden och avtalsdokumenten säger om verksamheten, inte gissade:
en ensam person är samtidigt leverantör, utvecklare, support, kontakt för dataskydd och
säljare (`drift/INCIDENT-CHECKLISTA.md` utgår genomgående från en ensam operatör), inga
betalande kunder finns ännu (låst av `tests/docs/dokumentpastaenden.test.js`), och
kundlivscykeln har fem lägen i kod: `offert → signerat → aktiv → pausad → avslutad`.

### Sammanställning

| # | Behov | Så ser det ut i dag | Funktion i panelen | Ny kod? |
|---|---|---|---|---|
| **B1** | **Återställa en kund efter en incident** | `aterstallOrganisationCallable` finns, är plattformsadmin-grindad – och har **noll gränssnitt**. `backupaOrganisation` likaså. Backupfilerna är dessutom `allow read, write: if false` i `storage.rules`, så klienten kan inte ens lista dem | **Återställningspanel** (L1n) | Ja – och det är planens viktigaste rad |
| **B2** | **Veta att beredskapen är den dokumenten påstår** | `hamtaBackupstatus`, `verifieraRevisionskedjor`, `testaBeroenden` och `verifieraKlinikstod` sitter i `IncidentberedskapSektion.jsx` – i **kundens** adminpanel, bakom `arSuperadmin`. Leverantören når dem bara genom att vara superadmin i just den organisationen | **Beredskapskontroll** (L1n), flyttad till panelen | Nej – omflyttning |
| **B3** | **Bli påmind om återställningsövningen** | `CLAUDE.md` säger "riktmärke ~6 månader", `.github/workflows/rto-matning.yml` finns och mäter riktigt. Men ingenting registrerar NÄR den senast kördes, och regeln är prosa som en session ska komma ihåg | **Åttonde signalen:** "senaste RTO-mätning äldre än 6 månader" | Ja – ett fält plus en signal |
| **B4** | **Upptäcka fel innan kunden hör av sig** | Sentry finns, men taggar `organisationId` bara i `rapporteraNekadListning`. En felfrekvens per kund går inte att få ut | **Driftöversikt** (L1e) | Ja – bredare Sentry-taggning, utanför panelen |
| **B5** | **Veta att en deploy faktiskt gick fram** | Kört två gånger i månaden att workflowen rapporterat `success` utan att hosting deployades (körning #90). Upptäckt manuellt, båda gångerna | **Versionsöversikt**: vilken version varje kunds klienter faktiskt kör (L1j, beslutspunkt 2) | Ja |
| **B6** | **Veta vad varje kund kostar och inbringar** | `kostnadshistorik` per organisation och `avtaladArsavgiftKr` finns båda. Marginalen räknas aldrig ut någonstans | **Ekonomiöversikt** (L1i) med marginal per kund och en signal vid negativ marginal | Nej – ren beräkning |
| **B7** | **Veta var varje prospekt står och vad som väntar på mig** | De fem avtalsstatusarna och `avtalsstatusAndrad` finns, och signalen `offert_stillastaende` larmar. Men ingenting registrerar vad ägaren TÄNKT göra härnäst | **Pipeline** (L1h) + ett fritextfält "nästa steg + datum" per organisation | Ja – ett fält |
| **B8** | **Få en ny kund i drift utan att glömma ett steg** | Sex separata anrop i rätt ordning (`skapaOrganisation`, `seedaStartbibliotek`, moduler, årsavgift, kvottak, `skapaInbjudan`), utspridda över fyra sektioner, utan checklista | **Härledd onboardingchecklista** (L1h) | Nej – härleds ur befintlig data |
| **B9** | **Hjälpa en kund utan att se mer än jag får** | `beviljaSupportAtkomst` kan bara startas av kundens egen superadmin. Leverantören kan bara avsluta ett fönster, aldrig begära ett | **Supportarbetsyta** (L1f, beslutspunkt 4) | Ja |
| **B10** | **Kunna visa vad jag gjort hos en kund** | Varje leverantörsåtgärd loggas redan in i kundens hashkedja. Det finns bara ingen läsvy tvärs kunderna | **Åtgärdslogg** (L1g) | Nej – läsvy |

### De tre som betyder mest, och varför

**B1 är den enda raden där ett dokument påstår en förmåga som i praktiken inte går att
utöva.** `avtal/INCIDENTRESPONSPLAN.md` avsnitt 5.5 och `drift/INCIDENT-CHECKLISTA.md` steg 8
beskriver återställning som en existerande förmåga. Den finns också – som kod. Men det finns
ingen knapp, och ägaren har ingen CLI mot produktionsprojektet. I skarpt läge, klockan tre på
natten, är avståndet mellan "funktionen finns" och "jag kan köra den" hela poängen med
dokumentet. Det är precis det fel `CLAUDE.md`s underhållsregel varnar för, fast omvänt:
dokumentet är sant om koden och falskt om verkligheten.

**B2 och B3 hänger ihop med B1 och hör till samma bygge.** Att beredskapskontrollerna ligger
i kundens adminpanel är dessutom fel även bortsett från panelen: backupstatus och
revisionskedjeverifiering är leverantörens driftansvar, inte kundens superadmins vardag. Med
den nya kontomodellen (L1m) blir det dessutom praktiskt omöjligt – ett `_plattform`-konto är
inte superadmin i någon kundorganisation och ser dem aldrig.

**B7 och B8 är de enda raderna som handlar om att tjäna pengar.** Resten är drift. Med noll
kunder i dag är pipeline-vyn den som ger mest per byggd rad, men den är också den som lättast
blir ett CRM om man inte håller igen – därför ETT fält, inte en modul.

### Behov utanför driften – avtal, juridik och försäljning

Tillägg 2026-08-29. Samma härledning som B1–B10: ur avtalsdokumenten,
`granskningar/JURIDISK-GRANSKNING.md` och säljmaterialet, inte ur önsketänkande.

| # | Behov | Så ser det ut i dag | Funktion i panelen | Ny kod? |
|---|---|---|---|---|
| **B11** | **Hålla 72-timmarsfristen vid en personuppgiftsincident** | `drift/INCIDENT-CHECKLISTA.md` steg 6 säger "skriv ned klockslaget, deadline = +72 timmar". Papper och penna. `avtal/PUB-AVTAL-MALL.md` p. 8 är ett avtalsbrott om den missas | **Incidentklocka** (L1p) med nedräkning per drabbad kund och kvitto på skickad underrättelse | Ja |
| **B12** | **Veta att PUB-avtal finns innan en kund börjar användas** | **Ingenting i organisationsdokumentet registrerar det.** `avtalsstatus` går till `aktiv` utan att någon kontrollerat art. 28.3 | **Hård spärr** (L1p): `satAvtalsstatus('aktiv')` nekas utan registrerat PUB-avtal | Ja |
| **B13** | **Underrätta kunder när underbiträdeslistan ändras** | Skyldigheten finns (`PUB-AVTAL-MALL.md` p. 5, invändningsrätt). `avtal/UNDERBITRADEN.md` är källan – men inget registrerar VILKA kunder som underrättats om VILKEN version | **Underrättelseregister** (L1p): versionsnummer på listan, plus datum per kund | Ja |
| **B14** | **Bli påmind om årliga och halvårsvisa åtaganden** | `drift/INCIDENT-CHECKLISTA.md` om nyckelrotation: *"ingen kalenderpåminnelse är byggd för detta än, det är en manuell rutin tills vidare"*. Samma sak för RTO-övningen (~6 mån), incidentresponsplanens översyn (var 6:e mån + varje större release) och tillgänglighetsredogörelsen | **Åtagandekalender** (L1o) – EN mekanism, inte fyra signaler | Ja |
| **B15** | **Veta vad jag lovat just den här kunden** | Ingenting. Provperiodens längd finns som fält, men utfallsgaranti, prisnivå, pilotupplägg och svarstider lever i minnet och i mejl | **Åtagandeblock i kunddossién** (L1p) | Ja – ett fält |
| **B16** | **Hantera prospekt som ännu inte är en organisation** | `saljmaterial/KANDIDATLISTA-PRIVAT-VARD.md` – ett internt dokument med bedömningar om namngivna verksamheters svagheter och IVO-historik | **Lägg till prospekt** som skapar en organisation i `avtalsstatus: offert` utan startbibliotek (L1h). **Kandidatlistan flyttas INTE in** – se nedan | Nej – befintligt läge |
| **B17** | **Ha rätt e-postmall till hands i kundens sammanhang** | `saljmaterial/Synappsen-epostmallar.md` – en fil att leta upp och klippa ur | **Mallar med kundnamnet ifyllt** i kunddossién, kopiera-knapp | Ja – litet |
| **B18** | **Svara rätt i en upphandling** | `Synappsen-upphandlingssvar.html` har sju statusberoende svar (A2, B4, B6, C3, C5, D1, E2) som `DOKUMENTREGISTER.md` pekar ut som glidningsbenägna | **Ingen panelfunktion.** Bind svaren till assertioner i `tests/docs/dokumentpastaenden.test.js` | Ja – men i testerna |
| **B19** | **Be en kund om referensmaterial** | `exporteraReferensunderlag` finns, kräver kundens uttryckliga samtycke och körs av kundens egen superadmin – ett `_plattform`-konto kan aldrig anropa den, vilket är rätt | **Begäran** till kunden, samma mönster som supportfönstret (L1f) | Ja – litet |
| **B20** | **Ta fram en offert med rätt priser** | `kallfiler/Synappsen-prislista.html` är statisk och underhålls för hand mot `KOSTNADSKALKYL-OCH-PRISSATTNING.md` | **Avvakta.** Se avgränsningen nedan | – |

### Tre saker som är viktigare än de ser ut

**B12 är samma fel som Brevo, fast från andra hållet.** I augusti 2026 upptäcktes att
Synappsen skickade e-post via ett underbiträde utan tecknat PUB-avtal, och spärren blev en
kodkonstant i stället för en påminnelse – uttryckligen därför att en driftflagga "kan slås av
av misstag" (`avtal/UNDERBITRADEN.md`, ändringshistoriken 2026-08-27). Exakt samma
resonemang gäller när Synappsen är biträdet: ingenting hindrar i dag att en organisation
sätts till `aktiv` och börjar behandla vårdpersonals personuppgifter innan art. 28.3 är
uppfylld. Spärren ska sitta i `satAvtalsstatus`, inte i en checklista.

**B11 har en konflikt inbakad som materialet redan har hittat men inte hanterat.**
`granskningar/JURIDISK-GRANSKNING.md` risk 15: en kund som omfattas av cybersäkerhetslagen
(2025:1506) har **24 timmars** tidig varning, medan PUB-avtalet lovar leverantören
**72 timmar**. Incidentklockan måste därför kunna märka en kund som NIS2-omfattad och räkna
ned från 24 timmar för den, annars bygger man in avtalets fel i verktyget. Ett fält per kund,
och två olika nedräkningar.

**B14 ska bli en mekanism, inte fyra signaler.** Fyra återkommande åtaganden är i dag
utspridda som prosa i fyra dokument, varav ett uttryckligen konstaterar att påminnelsen
saknas. En åtagandekalender med `{ vad, intervall, senast utfört, källa }` matar samma
signalmotor som allt annat och gör det billigt att lägga till det femte åtagandet. Det ersätter
punkt 5 i L1n, som skulle ha byggt RTO-påminnelsen som ett engångsfall.

### Vad jag uttryckligen avråder från

- **Att flytta in `saljmaterial/KANDIDATLISTA-PRIVAT-VARD.md` i panelen.** Filen innehåller
  bedömningar om namngivna verksamheters svagheter, IVO-historik och köpbenägenhet, plus
  kontaktuppgifter till namngivna personer. Att lägga det i produktionsdatabasen vore en **ny
  behandling där leverantören är personuppgiftsansvarig**, inte biträde – med egen rättslig
  grund, egen informationsplikt (art. 14, mot personer som inte vet att de är registrerade)
  och egen plats i registerförteckningen. Hela produktens juridiska hållning bygger på att
  leverantören bara är biträde. Listan stannar i git.
- **Offertgenerator (B20) – inte nu.** Ett prisdokument som appen genererar blir ett dokument
  som lämnas till kund, och då finns två prissanningar: den i koden och den i
  `kallfiler/Synappsen-prislista.html`. Med noll kunder är nyttan liten och glidningsrisken
  säker. Byggs det senare ska båda läsa EN pristabell, på samma sätt som `src/version.js`
  läser versionen i stället för att upprepa den.
- **Att lösa B18 i panelen.** Sju upphandlingssvar som blir inaktuella är ett
  dokumentproblem, inte ett gränssnittsproblem. Assertioner har fångat 6 av 6 verkliga fel i
  det här projektet; en panelvy hade fångat noll.
- **Avtalstexter, signering eller fakturering i appen.** Redan avgjort
  (`etapplaner/ETAPPLAN3.md` beslutspunkt 6) och fortfarande rätt. B12 registrerar ATT ett
  avtal finns, aldrig avtalet självt.

### Vad jag medvetet INTE föreslår

- **Att spegla `OPPNA-PUNKTER.md` in i panelen.** Filen ligger i git, granskas av tester och
  läses av varje ny session. En andra kopia i Firestore vore ett till ställe som kan glida –
  exakt det mönster projektet har misslyckats med sex gånger.
- **Bockrutor i onboardingchecklistan.** Varje steg härleds ur faktisk data (finns
  startbibliotek? finns minst en användare? är moduler satta? finns årsavgift?). En bockruta
  man klickar i är ett påstående utan täckning – samma fel som ett felaktigt ✅ i
  incidentdokumenten, och genomgående krav 8 gäller även gränssnitt.
- **Att göra `skickaFeedback`-inkorgen leverantörssynlig rakt av.** Se beslutspunkt 7.
- **Automatiska åtgärder på signaler.** Redan avvisat ovan och gäller även de nya signalerna:
  en RTO-påminnelse ska påminna, aldrig starta en mätning själv.

---

## Delmål

Ordningen är inte godtycklig – L1a och L1b är förutsättningar för i stort sett allt annat.

### L1m. Leverantörskontot utan organisationstillhörighet — bygg FÖRST ✅ KLAR 2026-08-29

Genomför kontomodellen i avsnittet "Panelens upplägg" ovan. Ordningen är inte valfri: byggs
skelettet (L1a) först får panelen en ny navigation medan kontot fortfarande sitter i en
kundorganisation, och den halvvägspositionen är svårare att resonera om än båda ändlägena.

1. **`skapaLeverantorskonto`** (ny Cloud Function, Admin SDK). Skapar Auth-kontot,
   `users/{uid}` med `organisationId: "_plattform"` och `role: "superadmin"`, samt
   `plattformsadmin/{uid}`. Anropbar endast av en befintlig plattformsadmin, och
   revisionsloggad mot `_plattform` – samma mönster som `gorTillPlattformsadmin`. Behövs
   eftersom `users/{uid}` har `allow create: if false` och `losInInbjudan` alltid binder
   kontot till en organisation.
2. **`LeverantorsLayout`** – egen layoutrutt för `/leverantor/*` utan `BottomNav` och
   `Sidomeny`.
3. **Omdirigering i båda riktningarna.** `SkyddatLayout` och `/` skickar ett
   `_plattform`-konto till `/leverantor`. Panelen är kontots startsida.
4. **Migrera ägarens eget konto**, eller skapa ett nytt – ägarbeslut, se beslutspunkt 6.

**Testat.** Regeltester i `tests/rules/` som verifierar att ett `_plattform`-konto nekas
läsning av rutiner, anslag, kontakter, förrådsartiklar, länkbibliotek, skiftrapporter och
revisionslogg i en riktig organisation – **och att det inte råkar nå organisationen
`default`**, vilket är det faktiska felet att skydda sig mot (`minOrganisation()` faller
tillbaka dit när fältet saknas). Plus ett enhetstest som låser att `_plattform` aldrig
förekommer som ett giltigt värde i organisationslistan.

**Ingen ny åtkomst någonstans.** Kontot får exakt samma rättigheter som en plattformsadmin
har i dag; det som försvinner är den oavsiktliga medlemskapsåtkomsten till den organisation
kontot råkade tillhöra.

**Byggt:**
- `functions/plattformsdrift.js`: `skapaLeverantorskonto(epost, namn)` – skapar ett HELT NYTT
  Auth-konto + `users/{uid}` (`organisationId: "_plattform"`, `role: "superadmin"`) +
  `plattformsadmin/{uid}`, med ett engångslösenord som returneras EN gång och aldrig lagras
  (utgående e-post är ju stoppat). `flyttaTillPlattformskonto()` – flyttar ANROPARENS EGET
  konto (måste redan vara plattformsadmin), idempotent, loggar i BÅDA kedjorna (den gamla
  organisationens och `_plattform`s). Det är den faktiska implementationen av beslutspunkt 6.
- `src/pages/leverantor/LeverantorLayout.jsx` – skalet utan `BottomNav`/`Sidomeny`.
- `SkyddatLayout` i `src/App.jsx` omdirigerar ett `_plattform`-konto till `/leverantor` –
  eftersom inloggning alltid navigerar till `/`, som använder `SkyddatLayout`, räcker EN
  kontroll för "SkyddatLayout och / skickar dit" (planens egen formulering).

**Byggt, men INTE verkställt:** ägarens eget konto är ännu inte flyttat – det är ett
ägarbeslut om NÄR, inte en teknisk fråga. `flyttaTillPlattformskonto()` finns och är testad.

**Testat.** `tests/rules/plattformskonto.test.mjs` (10 tester): ett `_plattform`-konto
nekas rutiner/anslag/kontakter/förrådsartiklar/länkbibliotek/skiftrapporter/revisionslogg i en
RIKTIG organisation, och – den faktiska fällan – når INTE organisationen `default` heller.
Metadataläsning (`organisationer/{orgId}`) fungerar oförändrat. `src/firebase/
organisation.test.js` (2 tester) låser att `PLATTFORMSORGANISATION` aldrig kan förväxlas med
`STANDARD_ORG`. `tests/functions/leverantorskonto.test.cjs` (12 tester) bevisar båda
funktionernas fältsättning, behörighet och loggning.

---

### L1n. Återställning och beredskap – panelens enda riktiga kapacitetslucka ✅ KLAR 2026-08-29

Svarar mot B1, B2 och B3. Det här är det enda delmålet i planen som bygger en förmåga som
dokumenten redan påstår finns.

1. **`listaBackuper(orgId)`** – ny callable, plattformsadmin-grindad. Klienten kan inte lista
   `backups/{orgId}/` själv (`storage.rules` säger `allow read, write: if false`, medvetet).
   Returnerar datum och storlek per fil, inget innehåll.
2. **Återställningspanel per kund** – listan ovan, med `aterstallOrganisationCallable`
   (finns, oanvänd) bakom en tvåstegsbekräftelse där organisationsnamnet skrivs in. Samma
   mönster som `RaderaOrganisationSektion`, av samma skäl: en återställning skriver över
   nuvarande data och går inte att ångra.
3. **Manuell backup före en riskabel åtgärd** – `backupaOrganisation` (finns, oanvänd) som en
   knapp i kundens åtgärdsflik. Den naturliga första handlingen före en migrering eller en
   återställning.
4. **Beredskapskontroll flyttad till panelen** – `hamtaBackupstatus`,
   `verifieraRevisionskedjor`, `testaBeroenden` och `verifieraKlinikstod` lyfts ur
   `src/components/admin/IncidentberedskapSektion.jsx` (kundens adminpanel) till
   `/leverantor/drift`. De är leverantörens driftansvar, och efter L1m når ett
   `_plattform`-konto dem inte längre där de ligger.
5. **RTO-övningens ålder** – flyttad till L1o, där den är ett fall av fyra i stället för ett
   engångsfall. Motiveringen är densamma och står kvar där: riktmärket är i dag prosa i
   `CLAUDE.md` som en session ska komma ihåg, och prosaregler har misslyckats sex gånger i
   det här projektet medan signaler och assertioner inte har misslyckats en enda.

**Testat.** Att `listaBackuper` nekas för en icke-plattformsadmin; att återställningen kräver
båda bekräftelsestegen; Återställningen
själv testas inte skarpt härifrån – den har redan en egen mätning i `rto-matning.cjs`.

**Avgränsning.** Ingen automatisk återställning, och ingen "återställ alla". En återställning
är alltid en människas beslut om en namngiven organisation.

**Byggt:**
- `functions/backup.js`: `listaBackuper(orgId)` – ny callable, listar `backups/{orgId}/*`
  (datum + storlek, aldrig innehåll, krav 13).
- `AterstallningSektion.jsx` (`/leverantor/drift`): org-väljare, "Ta backup nu" (återanvänder
  den REDAN BEFINTLIGA `exporteraOrganisation` – se premissrättelsen nedan), backuplista, och
  återställning bakom samma tvåstegsbekräftelse (skriv organisationens namn + `confirm()`) som
  `RaderaOrganisationSektion` etablerade.
- `BeredskapSektion.jsx`: `testaBeroenden`/`verifieraKlinikstod` (delad infrastruktur, inget
  orgval) plus `verifieraRevisionslogg`/`hamtaBackupstatus` med ett org-val – båda klarade
  redan `organisationId` som valfri parameter (`kravLasningAvRevisionslogg`), utökade bara
  klientwrapparna.

**Premissrättelse under bygget (krav 8):** planen antog att `backupaOrganisation` var helt
oanvänd. Fel – `exporteraOrganisation` är redan en tunn callable-wrapper runt den, använd av
"Exportera"-knappen i kundregistret. "Ta backup nu" är alltså samma anrop under en tydligare
etikett, inte ny kod.

**Deliberat avsteg från planens ordalydelse:** `IncidentberedskapSektion.jsx` i kundens
adminpanel TOGS INTE bort. Planen antog den var trasig för kunder (baserat på en förväxling
med säkerhetsfixen 2026-08-17), men en riktig kunds egen superadmin läser sin EGEN
organisations status via `matcharMinOrg` – helt oberoende av plattformsadmin-status. Att ta
bort den hade varit en regression för en fungerande självbetjäningsfunktion. Kontrollerna
finns nu på BÅDA ställena: kunden ser sin egen status, leverantören kan välja vilken kund.

**Testat.** `tests/functions/listabackuper.test.cjs` (5 tester): plattformsadmin-spärr,
organisationsisolering (kan inte se en annan kunds backuper), storlek utan innehåll.

---

### L1o. Åtagandekalendern – återkommande skyldigheter som signaler ✅ KLAR 2026-08-29

Svarar mot B14, och ersätter punkt 5 i L1n (RTO-påminnelsen byggs här i stället, som ett fall
av fyra i stället för ett engångsfall).

En collection `atagandekalender/{id}` med `{ vad, intervall, senastUtfort, kalla, anteckning }`,
läsbar endast för plattformsadmin, som matar en ny signal i
`src/utils/leverantorSignaler.js` när `senastUtfort + intervall` har passerats.

Fyra åtaganden att lägga in vid bygget, alla med sin källa i dokumentationen:

| Åtagande | Intervall | Källa |
|---|---|---|
| Nyckelrotation av samtliga fem hemligheter | 12 mån | `drift/INCIDENT-CHECKLISTA.md` "Nyckelrotation" – som själv konstaterar att påminnelsen saknas |
| Faktisk RTO-mätning (`rto-matning.yml`) | 6 mån | `CLAUDE.md` säkerhetsgenomgången p. 5, `avtal/IT-FAKTABLAD.md` p. 6 |
| Översyn av incidentresponsplanen | 6 mån + varje större release | `avtal/INCIDENTRESPONSPLAN.md` avsnitt 12 |
| Översyn av tillgänglighetsredogörelsen | 12 mån | `granskningar/TILLGANGLIGHETSREDOGORELSE.md` |

**Att kvittera ett åtagande är att skriva `senastUtfort`, inte att bocka en ruta.** Där det
går ska datumet sättas av det som faktiskt utförde arbetet – `rto-matning.yml` skriver sitt
eget datum och uppmätta tid när den körts klart. Ett åtagande vars datum bara kan sättas för
hand är svagare, och ska märkas som sådant i vyn.

**Byggt:**
- `atagandekalender/{id}` i `firestore.rules` – `allow read: if arPlattformsadmin()`,
  `allow write: if false`. Ingen organisationskoppling, plattformsnivå.
- `functions/atagandekalender.js` – `seedaAtagandekalender` (idempotent, rör aldrig ett
  redan satt `senastUtfort` eftersom fältet medvetet utelämnas från seed-datat) och
  `sattAtagandeUtfort` (manuell kvittering, revisionsloggad).
- `functions/scripts/rto-matning.cjs` kvitterar `rto-matning`-posten SJÄLV efter en lyckad
  mätning, direkt mot Firestore (ingen plattformsadmin-uid att autentisera som i skriptet) –
  aldrig i `finally`-blocket, så en misslyckad mätning inte räknas som utförd.
- `berakAtagandeSignaler`/`arAtagandeForfallet` i `src/utils/leverantorSignaler.js` – ett
  åtagande utan `senastUtfort` räknas som omedelbart förfallet (planens egen motivering: en
  okänd status är minst lika angelägen att se som en känd försenad). Slås ihop med
  organisationssignalerna i `Leverantor.jsx` via en delad `sorteraSignaler`, så en operatör
  ser allt som kräver uppmärksamhet på ETT ställe.
- `src/hooks/useAtagandekalender.js` + `AtagandekalenderSektion.jsx` – direkt klientläsning
  (samma mönster som `useKvissbank.js`), sedd-knapp och en kvitteringsknapp per manuellt
  åtagande. `rto-matning`-raden har ingen knapp, bara texten "Sätts automatiskt".

**Testat.** Att signalen slår exakt vid intervallets utgång och inte tidigare (`src/utils/
leverantorSignaler.test.js`); att collectionen nekas för allt utom plattformsadmin OCH att
INGEN klient (inte ens en plattformsadmin) kan skriva direkt (`tests/rules/
atagandekalender.test.mjs`, 8 tester); att en omkörning av seeden aldrig nollställer ett
redan satt `senastUtfort`, och att kvitteringen revisionsloggas (`tests/functions/
atagandekalender.test.cjs`, 9 tester).

**Avgränsning.** Ingen automatik som utför åtgärden. En påminnelse påminner.

---

### L1p. Avtal och åtaganden per kund – där juridiken möter en knapp ✅ KLAR 2026-08-29

Svarar mot B11, B12, B13, B15 och B19.

1. **PUB-avtalsstatus som hård spärr (B12).** Fälten `pubAvtalTecknat` (datum) och
   `pubAvtalVersion` på organisationen. `satAvtalsstatus` **nekar** `aktiv` utan dem, med ett
   felmeddelande som säger varför. Samma val som Brevo-spärren i `functions/gemensamt.js`,
   av samma skäl: en kontroll som sitter i koden kan inte glömmas bort, en checklista kan.
2. **Underrättelseregister för underbiträden (B13).** `avtal/UNDERBITRADEN.md` får ett
   versionsnummer; organisationen får `underbitradeUnderrattad: { version, datum }`. Panelen
   visar vilka kunder som ligger efter den aktuella versionen. Med noll kunder i dag är detta
   nästan gratis att bygga och dyrt att retroaktivt rekonstruera senare.
3. **Incidentklocka (B11).** Vid en personuppgiftsincident: registrera klockslaget för
   kännedom, välj drabbade organisationer, och få en nedräkning per kund plus kvitto på
   skickad underrättelse. Ett fält `omfattasAvNIS2` per kund styr om nedräkningen är 72 eller
   **24 timmar** – `granskningar/JURIDISK-GRANSKNING.md` risk 15. Klockan ersätter inte
   `drift/INCIDENT-CHECKLISTA.md`, den utför dess steg 6.
4. **Åtagandeblock i kunddossién (B15).** Fritext plus datum för vad som lovats just den här
   kunden: provperiodens villkor, prisnivå, eventuell utfallsgaranti, svarstider. Ett fält,
   inte en modul – annars blir det ett CRM.
5. **Begäran om referensunderlag (B19).** Samma mönster som supportfönstret: leverantören ber,
   kunden utför med sitt eget samtycke via `exporteraReferensunderlag`. Ingen ny åtkomst.

**Testat.** Att `satAvtalsstatus('aktiv')` nekas utan PUB-fälten – det är delmålets kärna och
det enda testet som skyddar mot ett faktiskt regelbrott. Plus att 24- respektive
72-timmarsnedräkningen väljs på rätt fält, och att varje åtgärd här loggas i kundens kedja.

**Avgränsning.** Ingen avtalstext, ingen signering, ingen fakturering
(`etapplaner/ETAPPLAN3.md` beslutspunkt 6). Panelen registrerar ATT ett avtal finns – aldrig
avtalet självt.

**Byggt:**
- `functions/avtalslivscykel.js`: `satAvtalsstatus` nekar nu `avtalsstatus: "aktiv"` utan
  `pubAvtalTecknat` – DEN HÅRDA SPÄRREN, samma val och motivering som Brevo-spärren i
  `gemensamt.js`. `satPubAvtal`, `satUnderbitradeUnderrattad`, `satOmfattasAvNIS2`,
  `satAtagandeblock`, `begarReferensunderlag` – fem nya callables, ett fält var.
- `avtal/UNDERBITRADEN.md` fick sin första formella VERSION (datumet på "Senast uppdaterad",
  se filens egen ruta för principen) och `src/config/underbitraden.js`
  (`UNDERBITRADEN_AKTUELL_VERSION`) – höjs i SAMMA commit som en sakändring i dokumentet.
- `functions/incidentklocka.js`: `startaIncident`/`kvitteraIncidentunderrattelse` mot en ny
  `incidenter/{id}`-collection (plattformsnivå, `firestore.rules`). `src/utils/
  incidentklocka.js` väljer 24h (NIS2) eller 72h per organisation – ren funktion, egna
  tester. `IncidentklockaSektion.jsx` i `/leverantor/drift`.
- `AvtalOchAtagandeSektion.jsx` – PUB-status, NIS2-märkning, underrättelseversion,
  åtagandeblock och referensunderlags-begäran, alla per kund. Ligger i `OrganisationsRad.jsx`s
  expansion (en FJÄRDE, helt självförsörjande panel, se filens egen kommentar för varför den
  medvetet inte tvingas in i "bara en öppen åt gången"-modellen) – L1b finns ju inte än.
- `ReferensunderlagSektion.jsx` (kundens adminpanel) visar nu leverantörens begäran, om en
  finns; `useOrganisationsstatus.js` utökad med fältet.

**Testat.** `tests/functions/pubavtalsparr.test.cjs` (12 tester) – **spärren är delmålets
kärna**: `aktiv` nekas utan avtal, men `pausad`/`signerat` fungerar ändå, och fungerar direkt
efter registrering. `tests/functions/incidentklocka.test.cjs` (10 tester), där det KRITISKA
testet bevisar att en kvittering för EN organisation aldrig skriver över en ANNAN
organisations post i samma incident (satt via `set({...}, {merge:true})` med ett nästlat
objekt – verifierat skarpt, inte antaget). `tests/rules/incidenter.test.mjs` (6 tester).
`src/utils/incidentklocka.test.js` (8 tester): 24h/72h-valet, förfallo-gränsen exakt, halvtid.

---

### L1a. Panelens skelett – från sektionslista till arbetsyta ✅ KLAR 2026-08-29

Bygg navigationsträdet i avsnittet "Panelens upplägg" ovan: vänsternavigering för de sju
portföljvyerna, en nästlad layoutrutt för kundläget som håller kundrubriken och
`:orgId`-hämtningen, och kundväljaren som behåller underfliken vid byte.

Dagens elva sektioner flyttas oförändrade till sina respektive vyer. `OrganisationsRad`
behåller tills vidare sin inline-expansion – den ersätts först när kunddossién (L1b) är
komplett, så att panelen aldrig står utan en väg till en enskild kund.

**Ingen beteendeförändring.** Ren flytt av befintliga komponenter, samma
plattformsadmin-gating, samma URL-burna filtertillstånd i kundregistret.

**Byggt:** navigationsträdet exakt som specificerat – sju portföljrutter
(`LeverantorOversikt`/`Kunder`/`Support`/`Drift`/`Innehall`/`Ekonomi`/`Logg`) plus
`kund/:orgId` med fem nästlade underrutter (`KundLayout` + `KundStub`). Elva befintliga
sektioner flyttade oförändrat till sina nya hem (Nyckeltal+KraverAtgard→Översikt,
OrganisationsLista+Pipeline+SkapaOrganisation+SeedaStartbibliotek+Demomiljo+Huvudman→Kunder,
Kvissbank+Baspaketreferenser→Innehåll, Manadsrapport→Ekonomi). `OrganisationsRad.jsx`s
inline-expansion rörd INTE, exakt som planen kräver – den är fortfarande den fungerande vägen
in i en enskild kund tills L1b finns.

**Deliberat avsteg:** kundlägets fem flikar renderar en gemensam `KundStub`, inte fem separata
sidor med innehåll – L1b (kunddossién) är inte byggd i den här omgången, och att bygga tomma,
innehållslösa sidor bara för att fylla en mall hade varit att bygga scaffolding utan värde.
Navigationsträdet, `:orgId`-hämtningen och den fasta kundrubriken (namn, avtalsstatus,
demo-/supportfönster-märkning) är REDA fullt fungerande, så L1b kan slå in innehåll flik för
flik utan att röra routingen.

**Testat.** `tests/rules/plattformskonto.test.mjs` bevisar server-gatingen (samma
`arPlattformsadmin()`-mekanism gäller alla tolv rutter, eftersom ingen av dem har en egen
regel – åtkomsten avgörs av vilka Cloud Functions/collections respektive sida anropar, inte
av rutten själv). `npm run build` och `npm run lint` gröna med hela den nya sidstrukturen.

---

### L1b. Kunddossién – en sida per kund — ✅ KLAR 2026-08-29

I dag är allt om EN kund utspritt: `OrganisationsRad` (300 rader) expanderar inline i en
lista, och resten ligger i andra sektioner. Att svara på "hur mår kund X?" kräver att man
läser fem ställen.

En sida, sju block:

1. **Huvud** – namn, orgnr, huvudman, avtalsstatus, provperiod, demo-märkning, användartak
   mot faktiskt antal.
2. **Kontakt** – kontaktperson, vem som är superadmin, när de senast bjöd in någon.
3. **Avtal & ekonomi** – årsavgift, senaste månadens AI-kostnad, marginal (L1i).
4. **Användning** – antal användare, sökkvot i dag mot tak, modulstatus, senaste aktivitet
   (kräver L1j).
5. **Hälsa** – mätvärdestrend (kräver L1c + beslutspunkt 1).
6. **Historik** – kundens revisionslogg filtrerad på leverantörens egna åtgärder, så det
   syns vad *vi* gjort hos just den här kunden.
7. **Åtgärder** – allt som i dag ligger utspritt: pausa, avtalsstatus, provperiod, årsavgift,
   sökkvottak, huvudman, seeda startbibliotek, exportera, avsluta supportfönster.

**Detta är planens enskilt största arbetsbesparing** och det jag skulle bygga först om bara
ett delmål fick byggas.

**Byggt:**

- **Bugfix (upptäckt vid premisskontroll, inte en del av den ursprungliga L1b-uppgiften):**
  `listaOrganisationer` (`functions/organisationslivscykel.js`) returnerade aldrig `orgnr`,
  `kontaktperson`, `anvandartak` (satta sedan Etapp 6b) eller `pubAvtalTecknat`,
  `pubAvtalVersion`, `underbitradeUnderrattad`, `omfattasAvNIS2`, `atagandeblock` (satta sedan
  L1p, samma session). Det gjorde att `AvtalOchAtagandeSektion.jsx` (byggd i L1p) alltid visade
  "ej tecknat"/tomt oavsett verkligt Firestore-läge – ett tyst fel som ingen tidigare test fångade
  eftersom funktionstesterna läste/skrev dokumentet direkt, aldrig via det callet klienten
  faktiskt använder. Fixat genom att lägga till alla åtta fälten i returobjektet. Regressionstest:
  `tests/functions/listaorganisationer-falt.test.cjs`.
- Block 1 "Huvud", block 2 "Kontakt" (utan "vem är superadmin"/"senast bjöd in" – se nedan) och
  en placeholder för block 5 "Hälsa": `src/pages/leverantor/kund/KundOversikt.jsx`.
- Block 4 "Användning" (antal/tak, sökkvot, modulstatus) plus en placeholder för "senaste
  aktivitet": `src/pages/leverantor/kund/KundAnvandning.jsx`.
- Block 3 "Avtal & ekonomi": `src/pages/leverantor/kund/KundEkonomi.jsx`, återanvänder
  `beraknaEkonomiOversikt` (L1i) på en enkund-array och `AvtalOchAtagandeSektion` (L1p) –
  flyttad hit från `OrganisationsRad.jsx` (se nedan).
- Block 6 "Historik": ny callable `hamtaKundensLeverantorshistorik(orgId)`
  (`functions/plattformsdrift.js`), plattformsadmin-gated, läser leverantörens EGNA poster i
  den befintliga `revisionslogg` (filtrerad på `organisationId` + `aktorRoll ==
  "plattformsadmin"`) – ingen ny personuppgiftsexponering (krav 38, symmetriskt med att kunden
  redan ser vad leverantören gjort). Ny sammansatt index i `firestore.indexes.json`. Klient:
  `src/components/leverantor/KundHistorikSektion.jsx` + `src/pages/leverantor/kund/
  KundHistorik.jsx`.
- Block 7 "Åtgärder": `src/components/leverantor/KundAtgarderSektion.jsx`, en
  fristående komponent (samma mönster som `AvtalOchAtagandeSektion` i L1p) som återanvänder
  alla nio befintliga klientfunktioner (pausa, avtalsstatus, provperiod, årsavgift, sökkvottak,
  huvudman, seed, exportera, avsluta support) – ingen ny backend. `src/pages/leverantor/kund/
  KundAtgarder.jsx` är en tunn wrapper.
- Ruttträdet i `src/App.jsx` bytte de fem `KundStub`-platshållarna mot riktiga sidor;
  `src/pages/leverantor/kund/KundStub.jsx` borttagen.
- `OrganisationsRad.jsx`: den tidigare fristående "Avtal & åtaganden"-panelen (byggd i L1p
  innan kunddossién fanns) togs bort och ersattes med en länk till `/leverantor/kund/:orgId/
  ekonomi`, för att undvika dubblerad UI för samma funktion. `OrganisationsListaSektion.jsx`
  städad efter (onödig prop borttagen).
- Ny CSS-klass `.kund-lista` i `src/pages/Leverantor.css` (kunddossiens sidor laddar inte
  `Admin.css`, så `admin-statistik-lista` var inte tillgänglig där).
- **Medvetet INTE byggt, i väntan på öppna beslutspunkter:** block 5 "Hälsa" (kräver L1c +
  beslutspunkt 1) och delen av block 4 som är "senaste aktivitet" (kräver L1j + beslutspunkt
  2) – båda visas som platshållare i respektive sida. Del av block 2 – "vem är superadmin"
  och "senast bjöd in någon" – byggdes INTE: plattformsadmin har i dag ingen läsväg till
  `users/{uid}`, och att öppna en sådan skulle vara en ny läsväg mot kundinnehåll utan
  samtycke (krav 37); det är inget delmålet L1b bad om, och görs inte i förbifarten.
- **Medvetet lämnat orört:** `OrganisationsRad.jsx`s inline-expansion i kundregistret –
  att retirera den helt till förmån för kunddossién är ett separat, större steg som inte
  krävdes av L1b (se kommentar i `KundLayout.jsx`).

**Testat:** `tests/functions/listaorganisationer-falt.test.cjs`, 7 tester (4 för
bugfixen, 3 för `hamtaKundensLeverantorshistorik` – åtkomstnekad för icke-plattformsadmin,
bara egna poster för rätt organisation, ingen läckage mellan organisationer). Fullt
testsvep grönt: lint, build, 535 vitest (oförändrat antal – inga nya vitest-filer),
`test:rules`, `test:functions`.

---

### L1c. Mätvärden per kund — ✅ KLAR 2026-08-30

Premisskontrollen visade att `matvardenSnapshots` inte är läsbar för plattformsadmin. Två
vägar:

| Väg | Innebär | Nackdel |
|---|---|---|
| **A. Lossa regeln** | `allow read: if … \|\| arPlattformsadmin()` | Leverantören får läsa varje kunds mätvärden när som helst, utan supportfönster och utan spår |
| **B. Cloud Function** (rekommenderas) | `hamtaKundmatvarden(orgId)` läser med Admin SDK, returnerar bara aggregat, revisionsloggar varje anrop mot kundens kedja | Mer kod. Men åtkomsten blir spårbar, avgränsad och möjlig att villkora |

Väg B uppfyller krav 37 och 38; väg A gör det inte. Beslutspunkt 1 avgjordes 2026-08-30: väg B.

**Byggt:** `hamtaKundmatvarden(orgId)` (`functions/matvarden.js`), plattformsadmin-gated,
returnerar ENDAST de redan aggregerade fälten från de senaste 12 veckornas
`matvardenSnapshots` (ingen enskild rutin, inget användarnamn, ingen sökfråga) och
revisionsloggar varje anrop mot **kundens egen** kedja (inte `_plattform`) – kunden ser i sin
egen historik att aggregaten lästs, precis som ett supportfönster redan hade synts. Klient:
`hamtaKundmatvarden` i `src/firebase/functions.js`, använd av `KundHalsaSektion.jsx` (se L1d).

**Testat.** `tests/functions/kundmatvarden-och-appversion.test.cjs`: åtkomstnekad för
icke-plattformsadmin, bara de aggregerade fälten (inget läckt rutininnehåll), loggas mot
kundens kedja.

---

### L1d. Visualisering — ✅ KLAR 2026-08-30

Appen har inget diagrambibliotek och en CSP som blockerar externa resurser. Två vägar:

| Väg | Kostnad | Passar |
|---|---|---|
| **Egen inline-SVG** (rekommenderas) | ~150 rader, noll beroenden, inget CSP-problem | De tre former som faktiskt behövs: sparkline (veckoserie), stapel (jämför kunder), donut (fördelning) |
| **Recharts e.d.** | ~100 kB gzip, nytt beroende att hålla uppdaterat | Om behovet växer till interaktiva, zoombara diagram |

Datamängden är liten (veckovisa punkter, en stapel per kund). Beslutspunkt 3 avgjordes
2026-08-30: egen SVG.

**Krav:** varje diagram ska ha en textalternativ-tabell bakom en `<details>` – dels WCAG, dels
för att siffran ofta är det man faktiskt vill läsa av.

**Byggt:** `src/utils/sparkline.js` (`genereraSparklinePath`, ren funktion – tar en lista tal
inklusive `null` för saknade veckor, räknar ut en SVG-path, ingen DOM-beroende). Bara
sparklinen byggdes (den enda av de tre formerna kunddossién faktiskt behöver just nu; stapel/
donut väntar tills ett verkligt behov, t.ex. en portföljjämförelse, faktiskt uppstår – samma
"bygg inte i förväg"-princip som resten av planen). `KundHalsaSektion.jsx` renderar en
sparkline per mätvärde (kvitteringsgrad klin/adm, andel nollträffar, innehållshälsa) plus en
`<details>` med en fullständig tabell bakom varje kurva (WCAG-kravet ovan), fyller L1b:s
"Hälsa"-block i `KundOversikt.jsx`.

**Testat.** `src/utils/sparkline.test.js`, 7 tester: tom lista, alla värden `null`,
utspridda `null`-luckor, en enda punkt, en konstant serie (ingen division med noll), stigande
serie (rätt SVG-y-riktning), respekterar angiven bredd/höjd/marginal.

---

### L1e. Driftkonsol och incidentrespons — ✅ KLAR 2026-08-30 (punkt 1, 3, 4 – punkt 2 avgränsad bort)

I dag är nödstoppen utspridda och olikformiga: e-poststoppet är ett fält i `systemstatus/epost`,
kvisspaketstoppet är ett dokument per paket, pausning ligger på organisationen, tvingad
utloggning är en callable per användare.

**Bygg:**

1. **En panel med samtliga spakar** – e-post, varje kvisspaket, pausa organisation, tvinga
   utloggning – med aktuellt läge synligt utan att man klickar sig in.
2. **Ett generaliserat nödstoppsmönster.** En `nodstopp/{funktion}`-collection som nya
   funktioner ansluter till, i stället för ett nytt engångsmönster per gång. De två befintliga
   migreras eller adapteras – de får inte bli ett tredje mönster.
3. **72-timmarsklockan från `drift/INCIDENT-CHECKLISTA.md` steg 6**, inbyggd. Startas
   manuellt vid en misstänkt personuppgiftsincident, räknar ned, visar deadline och halvtid.
   Checklistan i övrigt förblir ett dokument – den ska gå att följa när appen är nere.
4. **En åtgärdstidslinje** – vad som stoppats och startats, av vem, när. Underlag till
   incidentrapporten i efterhand.

**Avgränsning:** ingen APM, ingen uptime-övervakning, ingen larmkanal. Det är en annan
produktkategori, och Sentry täcker felrapporteringen redan.

**Byggt:** punkt 3 (72-timmarsklockan) byggdes redan i L1p (`IncidentklockaSektion.jsx`) –
ingen ny kod här. Punkt 1: `NodstoppsoversiktSektion.jsx` visar e-postnödstoppets och varje
Öva-lägespakets läge i EN lista, live-lyssnad, utan att man behöver öppna Innehåll-fliken för
att se paketstatusen. Pausning per kund och tvingad utloggning per användare är riktade
åtgärder utan ett eget globalt "läge" att visa – de hänvisas till kunddossién i stället för
att tvingas in i en översikt de inte passar i. Punkt 4: samma komponent filtrerar
`hamtaLeverantorsAtgardslogg` (L1g) till de sju händelsetyper som faktiskt är en
nödstopps-/pausningsåtgärd (`src/utils/atgardstidslinje.js`) – ingen ny logg, bara ett filter
ovanpå en redan existerande, redan testad datakälla (krav 39).

**Punkt 2 byggdes MEDVETET INTE.** Att migrera de två befintliga, skarpa nödstoppen
(e-post, Öva-läge) till ett nytt `nodstopp/{funktion}`-mönster är en omskrivning av
säkerhetskritisk kod utan att lösa något akut problem – ingen tredje mekanism finns ännu som
skulle tvinga fram ett gemensamt mönster. Risken (att göra om ett fungerande nödstopp) väger
tyngre än vinsten just nu. Görs om och när en tredje nödstoppsmekanism faktiskt tillkommer.

**Testat.** `src/utils/atgardstidslinje.test.js`, 4 tester: tom/saknad indata, släpper igenom
nödstopps-/pausningshändelser, filtrerar bort allt annat, bevarar ordningen.

---

### L1f. Supportarbetsyta — ✅ KLAR 2026-08-30 (punkt 1, 2 – punkt 3 avgränsad bort, punkt 4 redan byggd sedan Etapp 50c)

Supportåtkomsten (Etapp 50b) är tidsbegränsad och kundinitierad – bra modell, dålig
ergonomi. Premisskontrollen visade att leverantören inte ens kan **begära** ett fönster: det
måste ske via telefon eller mejl utanför appen.

**Bygg:**

1. **Begäran i appen.** Leverantören begär åtkomst med en angiven anledning; kundens
   superadmin får en notis och godkänner eller avslår. Samtycket ligger kvar hos kunden –
   bara den manuella kontakten försvinner.
2. **Aktiva fönster med nedräkning**, samlade på ett ställe, med knapp för att avsluta i
   förtid.
3. **Vad som lästes under fönstret.** I dag loggas att fönstret öppnades, inte vad
   leverantören sedan gjorde. En läslogg under aktivt supportfönster stärker kundens
   ställning och är rimlig att visa i ett PUB-sammanhang.
4. **Ärendetråd per kund** – anteckningar, kopplade till kunddossién. Inte ett ärendesystem;
   en anteckningsbok som överlever att man glömmer.

**Premisskontrollfynd (2026-08-30): punkt 4 fanns redan.** `organisationer/{orgId}/
arendeanteckningar` byggdes i Etapp 50c – exakt "en anteckningsbok som överlever att man
glömmer", plattformsadmin-bara, redan i produktion, reachable från `OrganisationsListaSektion.jsx`.
Planen hade inte upptäckt detta när L1f skrevs. Ingen ny kod, bara ett rättat antagande.

**Byggt (punkt 1):** `begarSupportAtkomst(orgId, anledning)` (plattformsadmin-gated) skapar
`organisationer/{orgId}/supportbegaran/{id}` med status `vantar`. `svaraSupportbegaran
(begaranId, godkann)` (superadmin-gated, bara den EGNA organisationen – kan aldrig gissa ett
`orgId` och godkänna en annan kunds begäran) öppnar vid godkännande samma
6-timmarsfönster som `beviljaSupportAtkomst` redan gör. Samtycket ligger fortfarande hos
kunden – bara den manuella kontakten utanför appen försvinner, precis som planen kräver.
Kundens `SupportatkomstSektion.jsx` fick en live-lyssnad lista över väntande begäranden
(fälls automatiskt upp om det finns en) med Godkänn/Avslå-knappar. Leverantörens
`KundAtgarderSektion.jsx` (kunddossién) fick ett "Support"-block med formuläret.

**Byggt (punkt 2):** `AktivaSupportfonsterSektion.jsx` i driftkonsolen listar ALLA
organisationer med ett aktivt supportfönster just nu, med nedräkning och en
"Avsluta i förtid"-knapp per rad – tidigare bara synligt en kund i taget i registret.

**Punkt 3 (läslogg under aktivt fönster) byggdes MEDVETET INTE.** Att logga VAD som lästs
(inte bara att fönstret öppnades) kräver att instrumentera varje läsväg i firestore.rules
`farSupportlasa()` täcker (rutiner, förråd, anslag, kontakter) – ett större, eget ingrepp i
läsvägar som i dag inte loggar något alls, med en verklig risk att missa en väg och skapa en
falsk trygghet ("loggen visar allt som lästes" när den inte gör det). Kräver ett eget,
avgränsat delmål, inte en biprodukt av L1f:s övriga tre punkter.

**Testat.** `tests/functions/kundmatvarden-och-appversion.test.cjs` (samma fil som L1c/L1j,
se ovan): åtkomstnekad för icke-plattformsadmin, kräver en anledning, en begäran skapas med
rätt status, en annan organisations superadmin kan inte godkänna (not-found, inget läckt id),
godkännande öppnar samma fönster som `beviljaSupportAtkomst`, en redan besvarad begäran kan
inte besvaras igen, avslag fungerar. `tests/rules/supportatkomst.test.mjs` utökad med 5 nya
regeltester för `supportbegaran`-subcollectionen (läsning för rätt superadmin/plattformsadmin,
nekad för fel organisation, ingen klient kan skriva direkt).

---

### L1g. Leverantörens egen åtgärdslogg ✅ KLAR 2026-08-29

Åtgärder mot en kund loggas i **kundens** hashkedja (verifierat). Rätt för kundens revision,
men det betyder att det inte finns någon sammanhållen bild av vad leverantören gjort över
kundbasen.

En vy som aggregerar leverantörens egna poster tvärs alla organisationer, via Cloud Function
(kedjorna är per organisation och får inte slås ihop). Både operativt minne och en
egenkontroll: "vad har jag rört den senaste veckan?".

**Byggt:** `hamtaLeverantorsAtgardslogg` (`functions/plattformsdrift.js`) – frågar
det redan existerande, top-level `revisionslogg` (INTE en underkollektion, se
`firestore.indexes.json`s nya sammansatta index) filtrerat på `aktorUid == request.auth.uid`
OCH `aktorRoll == "plattformsadmin"`. `AtgardsloggSektion.jsx` i `/leverantor/logg`.

**Ett verkligt fynd under bygget:** filtret måste vara BÅDA fälten, inte bara `aktorUid`.
Dagens leverantör är fortfarande (innan L1m verkställs på riktigt) samtidigt superadmin i sin
EGEN organisation – ett filter på bara uid hade läckt in leverantörens vardagliga
egenanvändning (skapa en rutin i sin egen org) i "vad har jag gjort mot KUNDER"-loggen.

**Testat.** `tests/functions/leverantorslogg.test.cjs` (4 tester) – bevisar just den
distinktionen explicit: en post med rätt uid men fel roll (`superadmin`) och en post med rätt
roll men FEL uid (en annan leverantör) läcker båda INTE igenom, bara de två som matchar båda.

---

### L1h. Onboarding-pipeline ✅ KLAR 2026-08-29

`avtalsstatus` (offert → signerat → aktiv → pausad → avslutad) och `avtalsstatusAndrad`
finns redan. Bygg en pipeline-vy med ålder i nuvarande steg, så att en offert som legat i 60
dagar syns som det den är. Signalmotorn flaggar redan stillastående offerter efter 30 dagar –
det här ger samma information en form man kan arbeta i.

Litet bygge, hög nytta, inga nya datakällor.

**Byggt:** `src/utils/leverantorPipeline.js` (`grupperaPipeline`, ren funktion, egna tester)
grupperar organisationer på `avtalsstatus` och räknar ålder från `avtalsstatusAndrad ?? skapad`
– samma fallback-princip som signalen `offert_stillastaende` redan använder. Demo-organisationen
utesluts (krav 29). `PipelineSektion.jsx` renderar de fem stegen sida vid sida, äldst överst
inom varje steg, länkad till kundraden (`#org-{orgId}`) och märkt visuellt vid ≥30 dagar (samma
tröskel som signalen). Ingen ny datakälla – bara den redan laddade `organisationer`-listan.

**Testat.** `src/utils/leverantorPipeline.test.js`, 8 tester: gruppering, demo-uteslutning,
okänd avtalsstatus, båda ålders-fallbackerna, och sorteringen inom en grupp.

---

### L1i. Ekonomisk överblick ✅ KLAR 2026-08-29

Alla delar finns redan: `avtaladArsavgiftKr` per kund, `kostnadshistorik` per månad,
`senasteKostnad` i listan. Ingen sammanställning finns.

- ARR-summering och snitt per kund
- Marginal per kund (årsavgift ÷ 12 minus AI-kostnad)
- Kostnadstrend, för att upptäcka en kund vars AI-användning skenar innan budgettaket slår i
- Kunder utan satt årsavgift – en tyst lucka i underlaget i dag

**Byggt:** `src/utils/leverantorEkonomi.js` (`beraknaEkonomiOversikt`, ren funktion) –
ARR-summa, snitt per kund, marginal (årsavgift/12 minus senaste kostnad, `null` om priset
saknas – ALDRIG en gissning), enkel trend (upp/ner/stabil) och kunder utan pris.
`EkonomiOversiktSektion.jsx` i `/leverantor/ekonomi`, tillsammans med den redan befintliga
`ManadsrapportSektion`.

**En rad kod i `listaOrganisationer` (`functions/organisationslivscykel.js`)**: `limit(1)` →
`limit(2)` på den redan existerande kostnadshistorik-frågan – SAMMA fråga, en extra rad i
samma svar, noll nya läsningar. Ger `kostnadshistorikSenaste` (upp till två månader) vid sidan
av det oförändrade `senasteKostnad`.

**Testat.** `src/utils/leverantorEkonomi.test.js`, 8 tester: tom lista, demo-uteslutning,
ARR-summering, marginal (inklusive `null` när priset saknas), negativ marginal-flaggning,
alla tre trendlägen plus "okänd", och sorteringsordningen.

---

### L1j. Aktivitet och version per kund — ✅ KLAR 2026-08-30 (bara version, "senast aktiv" avvaktas)

Två uppgifter saknas och båda är telemetri:

- **Senast aktiv.** Ingen sådan uppgift finns. Skulle kräva en skrivning vid inloggning.
- **Vilken appversion kunden faktiskt kör.** PWA:n cachar, så en kund kan ligga efter utan
  att någon vet. Skulle kräva att klienten rapporterar sin version.

Båda är rimliga driftuppgifter och båda är personuppgiftsbehandling som i dag inte sker.
Beslutspunkt 2 avgjordes 2026-08-30: **bara appversion.** "Senast aktiv" per användare
byggdes INTE – det är närmare personalövervakning och behöver ett tydligare syfte innan det
byggs (se BESLUTSLOGG.md 2026-08-30).

**Byggt:** `rapporteraAppVersion(version)` (`functions/organisationslivscykel.js`), anropas
tyst en gång per inloggning från `AuthContext.jsx` (samma ställe som redan skriver
`senasteInloggning`, fel sväljs – får aldrig blockera inloggningsflödet). Skriver
`senasteAppVersion`/`senasteAppVersionTid` på **organisationens** dokument, inte per
användare – "senaste inloggade klientens version, senast vunnen om flera är öppna samtidigt"
räcker för syftet (se en kund ligger kvar på en gammal version). `listaOrganisationer`
returnerar fälten; `KundAnvandning.jsx` (L1b) visar dem i ett nytt "Version"-block, ersätter
den tidigare "Senaste aktivitet"-platshållaren.

**Dokumentation uppdaterad i samma commit** (planens eget krav): `drift/
INCIDENT-CHECKLISTA.md` steg 5 fick ett nytt stycke om de två fälten (ingen person pekas ut,
organisationsskopat, inte per användare). `avtal/UNDERBITRADEN.md` rördes INTE – inget nytt
underbiträde eller ny integration tillkom, bara två fält på ett dokument hos en redan
befintlig (Firebase/GCP).

**Testat.** `tests/functions/kundmatvarden-och-appversion.test.cjs`: kräver inloggning,
skriver på organisationens dokument (inte per användare), avvisar en ogiltig version.

---

### L1k. Skalbarhet i `listaOrganisationer` ✅ KLAR 2026-08-29 (halva axeln)

Två extra läsningar per organisation, varje gång vyn öppnas. Vid 50 kunder blir det 101
läsningar. Alternativ: skriv en `organisationer/{orgId}.antalAnvandare`-räknare vid
inbjudan/radering, eller cacha listsvaret några minuter.

Byggs innan det märks, inte efter. Litet nu, obehagligt senare.

**Byggt – bara `antalAnvandare`-axeln:** `losInInbjudan` och `raderaAnvandare` underhåller nu
räknaren atomiskt (`FieldValue.increment(±1)`). `listaOrganisationer` läser den direkt när den
finns, och backfillar lativt (en enda users-fråga, skriver tillbaka) för organisationer som
saknar fältet – exakt samma "läs en gång, cacha genom att skriva tillbaka"-princip som
kostnadshistorikens egen lativa arkivering i `gemensamt.js`.

**Ett verkligt fel hittat och fixat under bygget, inte bara i produktionen senare:** ett blint
`FieldValue.increment(±1)` på ett ÄNNU INTE initierat fält hade skapat en felaktig ABSOLUT
siffra (t.ex. "1 användare" för en organisation som redan har tio), eftersom Firestore
behandlar increment på ett saknat fält som att basen är 0. Båda skrivvägarna läser därför
räknarens nuvarande värde först och rör den bara om den redan är ett tal – annars lämnas
fältet orört åt nästa `listaOrganisationer`-anrops backfill, som räknar rätt från grunden.

**Kostnadshistorik-axeln byggdes MEDVETET INTE.** Den skrivs lativt inuti `reserveraBudget`
(en budgetkritisk transaktion som körs före varje Gemini-anrop) – att denormalisera dit hade
touchat en hot path där felaktighet kostar riktiga pengar, för en optimering som bara gynnar
en enda leverantörsvys visning. Proportionerligt fel för ett delmål stämplat "Litet".
Kvarstår som en möjlig framtida rad om `listaOrganisationer` någonsin blir en faktisk
flaskhals – se `orderBy("manad", "desc").limit(1)`-frågan i funktionen.

**Testat.** `tests/functions/antalanvandare-raknare.test.cjs`, 5 tester: att räknaren INTE
skapas felaktigt på en oinitierad organisation (varken vid inbjudan eller radering), att
`listaOrganisationer` backfillar korrekt OCH skriver tillbaka, och att en redan initierad
räknare ökar/minskar atomiskt via de riktiga anropsvägarna (inte bara enhetstestad isolerat).

---

### L1l. Intern ändringslogg och separationen från kundens ✅ KLAR 2026-08-29

Det som gör ägarens krav mekaniskt i stället för en vana:

1. **`intern/ANDRINGSLOGG-INTERN.md`** – markdown, aldrig importerad av `src/`, når därför
   aldrig klientbundlen.
2. **Ett test** som failar om en post i `src/data/andringslogg.js` med version **högre än
   dagens** nämner leverantörsfunktioner (t.ex. "Leverantörsvyn", "leverantörspanel",
   "plattformsadmin").

> **Ärlig anmärkning om varför testet måste vara versionsavgränsat:** kundens ändringslogg
> innehåller **redan** fyra sådana poster – v5.108.0, v5.110.0, v5.111.0 och v5.112.0 handlar
> uteslutande om leverantörsvyn. Filens egen regel säger att den är en logg som aldrig skrivs
> om retroaktivt. Testet måste därför gälla framåt, och den existerande överträdelsen ska stå
> kvar och vara känd, inte städas bort.

**Byggt.** `intern/ANDRINGSLOGG-INTERN.md` (fanns redan, skapad 2026-08-27 tillsammans med
planen). `tests/docs/andringslogg-leverantorsseparation.test.js` – `GRANSVERSION = "5.132.0"`
(package.json-versionen just innan det här delmålet byggdes) är hårdkodad avsiktligt, inte
läst dynamiskt: läses den från `package.json` vid testkörning skulle den alltid vara lika med
den senast tillagda postens version (samma commit bumpar båda), och "högre än dagens" skulle
då aldrig kunna sluta vara sant för någon post – testet skulle tyst aldrig kunna slå till. Se
`tests/docs/pitch-version.test.js` för samma "frysta tröskelkonstant, inte dynamisk"-princip.

**Testat.** 2 tester: de fyra kända posterna bekräftas ligga UNDER gränsen (grandfather-skyddet
fungerar), och `test.each` är förberett för varje framtida post som skulle hamna över den.

---

## Beslutspunkter (ägaren)

**Status per 2026-08-30:** planen är antagen sedan 2026-08-29, och 1–4 avgjordes samlat
2026-08-30 (se `BESLUTSLOGG.md` samma datum) – samtliga enligt planens egen rekommendation.
5 och 6 var redan besvarade genom hur L1a/L1m är utformade. Bara 7 är fortfarande öppen, och
inget kvarvarande delmål väntar på den.

| # | Fråga | Rekommendation | Status |
|---|---|---|---|
| 1 | Får leverantören se en kunds **mätvärdesaggregat** utan ett aktivt supportfönster? | **Ja, via Cloud Function (väg B)** – spårbart och avgränsat till aggregat. Kräver en rad i `avtal/DPIA-UNDERLAG.md` och sannolikt i PUB-avtalet | **Avgjord 2026-08-30** – väg B. Låser upp L1c |
| 2 | Ska klienten rapportera **senast aktiv** och **appversion**? | **Ja för version, avvakta med senast aktiv.** Versionen är ren drift och kan lagras per organisation utan att peka ut en person; "senast aktiv" per användare är närmare övervakning av personal och behöver ett tydligare syfte | **Avgjord 2026-08-30** – bara version. Låser upp L1j |
| 3 | **Diagram:** egen SVG eller bibliotek? | **Egen SVG.** Tre former räcker, inget nytt beroende, inget CSP-undantag | **Avgjord 2026-08-30** – egen SVG. Låser upp L1d |
| 4 | Ska leverantören kunna **begära** supportåtkomst i appen? | **Ja** – kunden godkänner fortfarande, bara den manuella kontakten försvinner | **Avgjord 2026-08-30** – ja. Låser upp L1f |
| 5 | Ska panelen ligga kvar på `/leverantor` i samma app? | **Ja.** En separat app innebär ett andra bygge, ett andra deploy och en andra autentisering, för en användare | **Avgjord genom antagandet** – planens hela struktur (L1a) förutsätter det |
| 6 | Ska ägarens **befintliga konto** flyttas till `_plattform`, eller ska ett nytt leverantörskonto skapas vid sidan av? | **Flytta det befintliga.** Begäran var uttryckligen ett enda övergripande konto. Priset är att kontot inte längre ser någon kundvy inifrån – för att se produkten som en användare finns demomiljön (Etapp 51). Ett andra konto återinför precis det kontobyte begäran ville bli av med | **Byggt (2026-08-29)** – `flyttaTillPlattformskonto()` finns och är testad. Ägaren har ännu inte kört den mot sitt eget konto – det återstår som en operativ handling, inte en teknisk fråga |
| 7 | Ska leverantören se kundens **feedback-inkorg** (`skickaFeedback`)? | **Nej, inte rakt av.** Regeln är i dag `arSuperadmin() && matcharMinOrg()` – feedbacken är skriven till kundens egen admin, inte till leverantören. Efter L1m når ett `_plattform`-konto den inte alls, vilket är rätt utfall. Behövs en kanal till leverantören bör den vara en EGEN, tydligt märkt sådan – inte en tyst utvidgning av vem som läser det kunden trodde stannade internt | Öppen – ingen kod byggs mot den i dag, avgörs om/när behovet blir konkret |

---

## Vad jag INTE föreslår

- **Att leverantören läser kundens rutininnehåll utan supportfönster.** Hela produktens
  juridiska hållning bygger på motsatsen.
- **En separat leverantörsapp eller egen domän.** Ett andra bygge och deploy för en enda
  användare. `/leverantor` bakom plattformsadmin räcker.
- **Uptime-/APM-övervakning och larmkanaler.** Annan produktkategori. Sentry täcker felen.
- **Fakturering, avtalssignering eller bokföring i appen.** Beslutat tidigare
  (`etapplaner/ETAPPLAN3.md` beslutspunkt 6) och fortfarande rätt.
- **Ett CRM.** Kunddossién ska svara på "hur mår kunden", inte ersätta säljverktyg.
- **Sammanslagna revisionsloggar över kunder.** Kedjorna är per organisation och ska förbli
  det. L1g är en läsvy, inte en sammanslagning.
- **Automatiska åtgärder på signaler.** En signal ska föreslå, aldrig utföra. Att pausa en
  kund automatiskt vid ett tröskelvärde vore ett driftstopp utan människa i loopen.

---

## Beroendeordning

```
L1m ✅ (leverantörskontot)   ← byggd FÖRST, flyttade åtkomstgränsen
 └─ L1a ✅ (skelett)
     ├─ L1b ✅ (kunddossié)
     │   ├─ L1c ✅ (mätvärden)
     │   │   └─ L1d ✅ (visualisering)
     │   ├─ L1i ✅ (ekonomi)  – byggd fristående av portföljvyn, väntar inte på L1b
     │   └─ L1j ✅ (aktivitet/version)
     ├─ L1e ✅ (driftkonsol – punkt 1,3,4; punkt 2 avgränsad bort)
     ├─ L1n ✅ (återställning + beredskap)
     ├─ L1p ✅ (avtal + åtaganden per kund)
     ├─ L1f ✅ (support – punkt 1,2; punkt 3 avgränsad bort, punkt 4 redan fanns)
     ├─ L1g ✅ (åtgärdslogg)
     └─ L1h ✅ (pipeline)

Fristående, kan byggas när som helst:
 L1k ✅ (skalbarhet, antalAnvandare-axeln)
 L1o ✅ (åtagandekalendern)
 L1l ✅ (intern ändringslogg + test)
```

**Status per 2026-08-30: 16 av 16 delmål klara.** Etapp L1 är därmed slutförd i sin helhet
(L1h, L1k, L1l, L1o i första omgången; L1m, L1a, L1g, L1i, L1n, L1p i andra; L1b i tredje;
L1c, L1d, L1e, L1f, L1j i fjärde, efter att beslutspunkterna 1–4 avgjordes samlat 2026-08-30).
Beslutspunkt 7 (feedback-inkorgen) är den enda kvarvarande öppna frågan i hela planen – inget
delmål väntar på den, den togs upp om/när ett behov faktiskt blir konkret.

---

## Uppskattad arbetsinsats

Grov, i samma skala som tidigare etapplaner (ett "delmål" ≈ en fokuserad arbetsinsats):

| Delmål | Omfång | Status |
|---|---|---|
| L1l, L1h, L1k | Små – timmar var | ✅ Klara (2026-08-29, första omgången) |
| L1m | Medel – liten kodmängd, men den flyttar en åtkomstgräns och bär därför mest testarbete per rad i hela planen | ✅ Klar |
| L1a, L1g, L1i | Medel | ✅ Klara |
| L1n | Medel – tre av fyra punkter är gränssnitt ovanpå kod som redan finns | ✅ Klar |
| L1o | Liten – en collection, en signal, fyra rader innehåll | ✅ Klar |
| L1p | Medel – liten kodmängd, men punkt 1 är en spärr mot ett faktiskt regelbrott och bär planens tyngsta test | ✅ Klar |
| L1b | Stor – kärnan i planen | ✅ Klar |
| L1e, L1f | Stora | ✅ Klara (avgränsade – se respektive delmåls "Byggt") |
| L1c, L1d, L1j | Berodde helt på beslutspunkterna | ✅ Klara (1–4 avgjorda 2026-08-30) |

**Byggordningen som faktiskt kördes:** L1m → (L1l, L1h, L1k, L1o – kunde byggas fristående,
kördes först) → L1a → L1g, L1i, L1n, L1p (alla fyra byggda parallellt inom samma session,
eftersom ingen av dem beror på en öppen beslutspunkt eller på L1b) → L1b → (beslutspunkterna
1–4 avgjordes samlat) → L1c, L1d, L1e, L1f, L1j, de sista fem, byggda parallellt inom samma
session eftersom inget av dem längre väntade på något. **Etapp L1 är därmed slutförd.**

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 0.1 | 2026-08-27 | Första utkastet. Ej antaget |
| 0.2 | 2026-08-29 | Avsnittet "Panelens upplägg" tillagt: portfölj- kontra kundläge, tolv rutter, tvånivåers åtkomsttak, delad datastomme och tre delade komponenter. L1a skrevs om till att bygga upplägget i stället för att beskriva det. Fortfarande ej antagen |
| 0.3 | 2026-08-29 | Kontomodellen tillagd på ägarens begäran: ett enda övergripande konto med `organisationId: "_plattform"`, utan medlemskap i någon kundorganisation. Nytt delmål L1m (bygg först), ny beslutspunkt 6. Fyra premissfynd ändrade utformningen – särskilt att ett SAKNAT `organisationId` inte ger organisationslöshet utan medlemskap i `default` |
| 0.4 | 2026-08-29 | Avsnittet "Behoven, och vilken funktion som möter varje" tillagt (B1–B10, härledda ur kod och avtalsdokument). Nytt delmål L1n: återställningspanel, manuell backup, beredskapskontroller flyttade från kundens adminpanel, och RTO-övningens ålder som åttonde signal. Ny beslutspunkt 7 (feedback-inkorgen). Fyndet som motiverar L1n: `aterstallOrganisationCallable` och `backupaOrganisation` finns i kod men har noll gränssnitt, medan incidentdokumenten beskriver återställning som en existerande förmåga |
| 0.5 | 2026-08-29 | Behov B11–B20 tillagda: avtal, juridik och försäljning. Två nya delmål – L1o (åtagandekalendern, ersätter L1n punkt 5) och L1p (PUB-spärr, underrättelseregister, incidentklocka med 24/72 timmar, åtagandeblock). Avråder uttryckligen från att flytta in kandidatlistan i produktionsdatabasen: det vore en ny behandling med leverantören som personuppgiftsansvarig |
| 0.6 | 2026-08-29 | **Antagen.** Ägaren markerade planen som antagen i sin helhet. Beslutspunkterna 5 och 6 avgjorda genom antagandet (planens struktur förutsätter dem); 1–4 och 7 kvarstår öppna och avgörs var för sig, precis innan respektive delmål påbörjas. Se `BESLUTSLOGG.md` 2026-08-29 |
| 0.7 | 2026-08-29 | **L1l, L1h, L1k (delvis), L1o byggda.** De fyra "Liten"-delmålen. Se "Byggt"/"Testat" i respektive delmål ovan. L1k byggdes bara på `antalAnvandare`-axeln – kostnadshistorik-axeln avgränsades medvetet bort (skulle touchat en budgetkritisk transaktion för en oproportionerlig vinst). Ett verkligt korrekthetsfel (blint `FieldValue.increment` på ett oinitierat fält) hittades och fixades under bygget, inte efteråt. 37 nya tester totalt (8+5+2 vitest, 8 regel, 5+9 funktioner) |
| 0.8 | 2026-08-29 | **L1m, L1a, L1g, L1i, L1n, L1p byggda.** De sex "Medel"-delmålen. Beslutspunkt 6 gick från "avgjord genom antagandet" till faktiskt byggd (`flyttaTillPlattformskonto`). Två deliberata avsteg dokumenterade i respektive delmåls "Byggt": `IncidentberedskapSektion.jsx` togs INTE bort från kundens adminpanel (en riktig regression för en fungerande kundfunktion), och kundlägets fem flikar delar en gemensam platshållare i väntan på L1b. 10 av 16 delmål nu klara – bara L1b, L1c, L1d, L1e, L1f, L1j kvarstår, och fyra av de sex väntar på en öppen beslutspunkt |
| 0.9 | 2026-08-29 | **L1b byggd.** Kunddossién – planens enskilt största arbetsbesparing. Fem riktiga sidor ersatte den delade platshållaren från 0.8: Huvud, Kontakt (delvis), Avtal & ekonomi, Användning (delvis), Historik, Åtgärder. Ett verkligt korrekthetsfel hittades och fixades vid premisskontroll: `listaOrganisationer` returnerade aldrig åtta fält som `AvtalOchAtagandeSektion.jsx` (L1p) redan berodde på, vilket gjorde den panelen permanent felaktig sedan L1p byggdes. Två block (Hälsa, senaste aktivitet) och en delfunktion (vem är superadmin) lämnades medvetet obyggda i väntan på öppna beslutspunkter/krav 37. `OrganisationsRad.jsx`s dubblerade avtalspanel togs bort till förmån för en länk till dossién. 7 nya funktionstester. 11 av 16 delmål nu klara |
| 1.0 | 2026-08-30 | **Etapp L1 SLUTFÖRD – L1c, L1d, L1e, L1f, L1j byggda.** Beslutspunkterna 1–4 avgjordes samlat (samtliga enligt planens rekommendation, se `BESLUTSLOGG.md` 2026-08-30), vilket löste upp de sista fem delmålen på en gång. L1c+L1d fyllde kunddossiens sista platshållare (Hälsa) med spårbara mätvärdesaggregat och egna SVG-sparklines. L1j fyllde "Användning"s platshållare med appversion (inte "senast aktiv" – avgjort avvaktat). L1f: en premisskontroll visade att punkt 4 (ärendetråd) redan fanns sedan Etapp 50c – bara punkt 1 (begäran i appen) och 2 (aktiva fönster samlade) byggdes nytt, punkt 3 (läslogg) avgränsades bort som ett eget, större delmål. L1e: punkt 3 (72h-klockan) fanns redan sedan L1p; punkt 1 (nödstoppsöversikt) och 4 (åtgärdstidslinje) byggdes, punkt 2 (generaliserat nödstoppsmönster) avgränsades bort – en omskrivning av skarp, säkerhetskritisk kod utan att en tredje mekanism ännu finns som kräver den. 16 av 16 delmål klara. Enda kvarvarande öppna frågan i hela planen: beslutspunkt 7 (feedback-inkorgen), som inget delmål väntar på |
