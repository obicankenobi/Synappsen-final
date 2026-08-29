# Intern etapplan 1 – Leverantörspanelen

**Etapp L1. UTKAST, EJ ANTAGEN.** Skriven 2026-08-27 på ägarens begäran. Ingen kod är
skriven, inget delmål är påbörjat. Antas eller förkastas av ägaren; tills dess är det här
ett förslag, inte en plan som ska byggas.

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

## Delmål

Ordningen är inte godtycklig – L1a och L1b är förutsättningar för i stort sett allt annat.

### L1a. Panelens skelett – från sektionslista till arbetsyta

Bygg navigationsträdet i avsnittet "Panelens upplägg" ovan: vänsternavigering för de sju
portföljvyerna, en nästlad layoutrutt för kundläget som håller kundrubriken och
`:orgId`-hämtningen, och kundväljaren som behåller underfliken vid byte.

Dagens elva sektioner flyttas oförändrade till sina respektive vyer. `OrganisationsRad`
behåller tills vidare sin inline-expansion – den ersätts först när kunddossién (L1b) är
komplett, så att panelen aldrig står utan en väg till en enskild kund.

**Ingen beteendeförändring.** Ren flytt av befintliga komponenter, samma
plattformsadmin-gating, samma URL-burna filtertillstånd i kundregistret.

**Testat:** varje befintlig sektion nås fortfarande på sin nya rutt, och en
icke-plattformsadmin nekas på **var och en av de tolv rutterna** – inte bara på
`/leverantor`. Klientrutten är inget skydd; testet ska bevisa att server-gatingen följer med.

---

### L1b. Kunddossién – en sida per kund

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

---

### L1c. Mätvärden per kund — kräver ett ägarbeslut

Premisskontrollen visade att `matvardenSnapshots` inte är läsbar för plattformsadmin. Två
vägar:

| Väg | Innebär | Nackdel |
|---|---|---|
| **A. Lossa regeln** | `allow read: if … \|\| arPlattformsadmin()` | Leverantören får läsa varje kunds mätvärden när som helst, utan supportfönster och utan spår |
| **B. Cloud Function** (rekommenderas) | `hamtaKundmatvarden(orgId)` läser med Admin SDK, returnerar bara aggregat, revisionsloggar varje anrop mot kundens kedja | Mer kod. Men åtkomsten blir spårbar, avgränsad och möjlig att villkora |

Väg B uppfyller krav 37 och 38; väg A gör det inte. Se beslutspunkt 1 – det är ägarens beslut
eftersom det utvidgar vad biträdet ser om den personuppgiftsansvariges verksamhet, och därför
berör `avtal/DPIA-UNDERLAG.md` och PUB-avtalet.

---

### L1d. Visualisering

Appen har inget diagrambibliotek och en CSP som blockerar externa resurser. Två vägar:

| Väg | Kostnad | Passar |
|---|---|---|
| **Egen inline-SVG** (rekommenderas) | ~150 rader, noll beroenden, inget CSP-problem | De tre former som faktiskt behövs: sparkline (veckoserie), stapel (jämför kunder), donut (fördelning) |
| **Recharts e.d.** | ~100 kB gzip, nytt beroende att hålla uppdaterat | Om behovet växer till interaktiva, zoombara diagram |

Datamängden är liten (veckovisa punkter, en stapel per kund). Rekommendationen är egen SVG
tills något faktiskt kräver mer. Se beslutspunkt 3.

**Krav:** varje diagram ska ha en textalternativ-tabell bakom en `<details>` – dels WCAG, dels
för att siffran ofta är det man faktiskt vill läsa av.

---

### L1e. Driftkonsol och incidentrespons

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

---

### L1f. Supportarbetsyta

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

---

### L1g. Leverantörens egen åtgärdslogg

Åtgärder mot en kund loggas i **kundens** hashkedja (verifierat). Rätt för kundens revision,
men det betyder att det inte finns någon sammanhållen bild av vad leverantören gjort över
kundbasen.

En vy som aggregerar leverantörens egna poster tvärs alla organisationer, via Cloud Function
(kedjorna är per organisation och får inte slås ihop). Både operativt minne och en
egenkontroll: "vad har jag rört den senaste veckan?".

Kravet är att detta är en **läsvy** – ingen ny logg, ingen andra sanning (krav 39).

---

### L1h. Onboarding-pipeline

`avtalsstatus` (offert → signerat → aktiv → pausad → avslutad) och `avtalsstatusAndrad`
finns redan. Bygg en pipeline-vy med ålder i nuvarande steg, så att en offert som legat i 60
dagar syns som det den är. Signalmotorn flaggar redan stillastående offerter efter 30 dagar –
det här ger samma information en form man kan arbeta i.

Litet bygge, hög nytta, inga nya datakällor.

---

### L1i. Ekonomisk överblick

Alla delar finns redan: `avtaladArsavgiftKr` per kund, `kostnadshistorik` per månad,
`senasteKostnad` i listan. Ingen sammanställning finns.

- ARR-summering och snitt per kund
- Marginal per kund (årsavgift ÷ 12 minus AI-kostnad)
- Kostnadstrend, för att upptäcka en kund vars AI-användning skenar innan budgettaket slår i
- Kunder utan satt årsavgift – en tyst lucka i underlaget i dag

**Avgränsning:** ingen fakturering, ingen bokföringsintegration. Underlag, inte ekonomisystem.

---

### L1j. Aktivitet och version per kund — kräver ett ägarbeslut

Två uppgifter saknas och båda är telemetri:

- **Senast aktiv.** Ingen sådan uppgift finns. Skulle kräva en skrivning vid inloggning.
- **Vilken appversion kunden faktiskt kör.** PWA:n cachar, så en kund kan ligga efter utan
  att någon vet. Skulle kräva att klienten rapporterar sin version.

Båda är rimliga driftuppgifter och båda är personuppgiftsbehandling som i dag inte sker.
Se beslutspunkt 2. **Bygg inte förrän det är avgjort** – och om det byggs ska
`avtal/UNDERBITRADEN.md` och `drift/INCIDENT-CHECKLISTA.md` steg 5 uppdateras i samma commit.

---

### L1k. Skalbarhet i `listaOrganisationer`

Två extra läsningar per organisation, varje gång vyn öppnas. Vid 50 kunder blir det 101
läsningar. Alternativ: skriv en `organisationer/{orgId}.antalAnvandare`-räknare vid
inbjudan/radering, eller cacha listsvaret några minuter.

Byggs innan det märks, inte efter. Litet nu, obehagligt senare.

---

### L1l. Intern ändringslogg och separationen från kundens

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

---

## Beslutspunkter (ägaren)

| # | Fråga | Rekommendation |
|---|---|---|
| 1 | Får leverantören se en kunds **mätvärdesaggregat** utan ett aktivt supportfönster? | **Ja, via Cloud Function (väg B)** – spårbart och avgränsat till aggregat. Kräver en rad i `avtal/DPIA-UNDERLAG.md` och sannolikt i PUB-avtalet |
| 2 | Ska klienten rapportera **senast aktiv** och **appversion**? | **Ja för version, avvakta med senast aktiv.** Versionen är ren drift och kan lagras per organisation utan att peka ut en person; "senast aktiv" per användare är närmare övervakning av personal och behöver ett tydligare syfte |
| 3 | **Diagram:** egen SVG eller bibliotek? | **Egen SVG.** Tre former räcker, inget nytt beroende, inget CSP-undantag |
| 4 | Ska leverantören kunna **begära** supportåtkomst i appen? | **Ja** – kunden godkänner fortfarande, bara den manuella kontakten försvinner |
| 5 | Ska panelen ligga kvar på `/leverantor` i samma app? | **Ja.** En separat app innebär ett andra bygge, ett andra deploy och en andra autentisering, för en användare |

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
L1a (skelett)
 ├─ L1b (kunddossié)  ← bygg denna först av allt innehåll
 │   ├─ L1c (mätvärden)   [beslutspunkt 1]
 │   │   └─ L1d (visualisering)  [beslutspunkt 3]
 │   ├─ L1i (ekonomi)
 │   └─ L1j (aktivitet/version)  [beslutspunkt 2]
 ├─ L1e (driftkonsol)
 ├─ L1f (support)  [beslutspunkt 4]
 ├─ L1g (åtgärdslogg)
 └─ L1h (pipeline)

Fristående, kan byggas när som helst:
 L1k (skalbarhet)
 L1l (intern ändringslogg + test)   ← bör byggas FÖRST, den är förutsättningen
                                       för att resten inte läcker till kunden
```

---

## Uppskattad arbetsinsats

Grov, i samma skala som tidigare etapplaner (ett "delmål" ≈ en fokuserad arbetsinsats):

| Delmål | Omfång |
|---|---|
| L1l, L1h, L1k | Små – timmar var |
| L1a, L1g, L1i | Medel |
| L1b, L1e, L1f | Stora – kärnan i planen |
| L1c, L1d, L1j | Beror helt på beslutspunkterna |

**Om bara en sak byggs:** L1l först (separationen), sedan L1b (kunddossién). De två ger
merparten av nyttan och binder inga beslut som ännu inte är fattade.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 0.1 | 2026-08-27 | Första utkastet. Ej antaget |
| 0.2 | 2026-08-29 | Avsnittet "Panelens upplägg" tillagt: portfölj- kontra kundläge, tolv rutter, tvånivåers åtkomsttak, delad datastomme och tre delade komponenter. L1a skrevs om till att bygga upplägget i stället för att beskriva det. Fortfarande ej antagen |
