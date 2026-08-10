# Etapplan 13 – Baspaket: nationella referenser, inte kliniskt beslutsstöd

*Utkast 2026-08-10, samma genomgång som `ETAPPLAN12.md`, men medvetet en egen fil.*

> **Läs detta först.** Den här planen innehåller EN enda etapp (64), och den skiljer sig från
> alla andra planer i projektet på ett sätt som är värt att säga rakt ut: **den är inte
> byggbar av en kodsession.** Idén rör en regulatorisk gräns (medicinteknisk produkt under
> MDR) som kräver ett juridiskt svar innan någon rad kod skrivs – inte bara en
> premisskontroll mot koden, som resten av projektets etapper klarar sig med. Den hölls
> därför utanför `ETAPPLAN12.md` istället för att blandas in bland dess rättningar, som ALLA
> är byggbara direkt. Blanda inte ihop de två planernas mognadsgrad.

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

---

## Etapp 64 – Baspaket: nationella referenser, inte kliniskt beslutsstöd (ny idé, ej granskad juridiskt)

**Varför:** se "Bakgrund" ovan.

**Min bedömning, kort (se motivering nedan för den fulla resonemangskedjan): en försiktig
version är sannolikt görbar utan att korsa MDR-gränsen, OM den byggs som ren
referens/länkning – inte som en interaktiv poängräknare.** Den skillnaden avgör allt, och
den går inte att göra halvvägs.

Jag har ingen egen verifierad kunskap om innehållet eller omfattningen i det specifika
instrumentet ägaren nämnde (VÄST-A) och gissar inte på det här – i en produkt som redan har
en dokumenterad, medveten disciplin kring att aldrig påstå mer än vad som är verifierat
(se `PITCH.md`s "Ärlighet om vad som faktiskt är mätt"), skulle det vara fel att göra ett
undantag just här.

### Var gränsen faktiskt går (verifierat mot vad appen redan gör, inte mot en gissning)

Klinikstödet (byggt, i drift sedan 2026-07-14) löser redan en näraliggande fråga och har
gjort det utan att klassas som medicinteknisk produkt:

- **Domänbegränsning:** `functions/index.js`s `GODKANDA_KALLDOMANER` + `firestore.rules`s
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

Det här är exakt den infrastruktur ett baspaket skulle behöva – och den finns redan, testad
och i drift. Ett baspaket är alltså inte "bygg något nytt och osäkert", det är "återanvänd
ett mönster som redan bevisat sig hålla sig innanför gränsen".

### Hur ett baspaket SKA byggas, om det byggs

- **64a – Referensposter, inte innehåll Synappsen äger.** Varje post i baspaketet är en
  strukturerad referens (titel, källa, utgivare, datum, länk) till den FAKTISKA nationella
  källan – aldrig en kopia eller omskrivning av innehållet. Samma disciplin som
  `MALL_ANMARKNING` i Etapp 56, men strängare: en mall säger "fyll i det här", en
  baspaket-post säger "det här är vad [utgivaren] själv publicerat, se länken – vi har inte
  skrivit om det". Ingen tolkning, ingen sammanfattning av Synappsen självt.
- **64b – Utökad källbevakning, inte ett nytt system.** Baspaketets poster registreras i
  samma `externaKallor`-mekanism källbevakningen redan läser. Ändras eller försvinner
  källan upptäcks det automatiskt, precis som för en enskild kunds egna referenser idag –
  bara att larmet går till en central ansvarig (leverantören) snarare än en enskild
  rutinägare, eftersom posten delas av alla kunder.
- **64c – Ett UTTRYCKLIGT tekniskt tak mot att det glider mot beräkning.** Ingen
  baspaket-post får någonsin ha ett fält som lagrar ett tröskelvärde, en poängsumma eller
  en "om X då Y"-logik som appen kör. Om en framtida session frestas att bygga t.ex. en
  interaktiv poängräknare ovanpå en bedömningsskala – **stanna, det är exakt steget som
  korsar linjen.** En skala presenterad som en läsbar tabell (samma sak som en bok) är
  sannolikt okej; samma skala med ett formulär som summerar poäng och ger en rekommendation
  är sannolikt inte det (jämför MDR Annex VIII regel 11 om programvara som behandlar data
  för att ge information i diagnos-/behandlingssyfte).
- **64d – Opt-in, inte förval.** En organisation väljer att lägga till baspaketet, precis
  som moduler idag (`organisationer/{orgId}.moduler`). Det håller ansvarsfrågan tydlig:
  ingen kund får ett vårdinnehåll de inte aktivt bett om.

### Vad som INTE ingår, oavsett hur långt idén drivs

Poängberäknade bedömningsskalor (NEWS2-liknande, RETTS-liknande eller det instrument
ägaren nämnde, om det visar sig vara en beräknande skala snarare än en läsbar checklista),
allt som föreslår en åtgärd baserat på inmatade patientvärden, och allt som skulle kräva
att Synappsen *skriver om* eller *tolkar* en nationell källa snarare än att länka till den.
Dessa hör hemma i samma "rör inte"-kategori som dosberäkning redan gör i `ETAPPLAN11.md`.

**Klart när:** en extern juridisk bedömning (inte en kodgenomgång) har bekräftat att
64a–64d håller sig utanför MDR:s programvarudefinition, och den bedömningen är skriven in i
`SAKERHETSRAPPORT.md` innan något publiceras för en kund.

---

## Beslutspunkt som kräver ägaren

| # | Fråga | Varför det inte är mitt beslut | Min rekommendation |
|---|---|---|---|
| 1 | **Ska baspaketet drivas vidare, och i så fall – vem gör MDR-bedömningen innan något byggs?** | Regulatorisk risk (medicinteknisk produkt under MDR) är en juridisk fråga, inte en teknisk – jag kan visa VAR gränsen sannolikt går utifrån hur klinikstödet redan är byggt, men jag kan inte lämna ett juridiskt bindande svar. | **Beställ en kort extern juridisk bedömning av 64a–64d INNAN kod skrivs**, snarare än att bygga först och fråga sedan. Om bedömningen är positiv är det sedan ett litet, välavgränsat bygge (samma mönster som klinikstödets domänbegränsning + källbevakning) – men den ordningen (juridik → kod) är viktigare än vilken vecka det byggs. |

---

## Föreslagen ordning

Ingen – planen har bara en etapp, och den är helt villkorad av beslutspunkt 1. Den blockerar
inget annat: `ETAPPLAN12.md`s Etapp 59–63 kan byggas oberoende, i valfri ordning, medan
ägaren tar ställning till om en juridisk bedömning ska beställas.

---

## Sammanfattning

| Etapp | Innehåll | Modul | Risk | Status |
|---|---|---|---|---|
| **64** | Baspaket: nationella referenser (rena länkar/citat, aldrig beräkning) | Ny (ej namngiven) | **Regulatorisk – MDR** | Idé, **ej byggbar förrän juridisk bedömning finns** (beslutspunkt 1) |

---

## Vad som INTE föreslås inom ramen för den här idén, oavsett hur den utvecklas

- **Ett eget varumärke/en egen tolkning av ett nationellt instrument.** Om det byggs är det
  en länk till originalet, aldrig en Synappsen-version av det.
- **Automatisk uppdatering av innehåll utan mänsklig granskning.** Källbevakningen larmar
  vid ändring – den skriver aldrig om posten automatiskt. Samma "alltid en människa innan
  publicering"-princip som gäller allt annat AI-genererat i produkten.
- **Att baspaketet blir förvalt.** Se 64d – opt-in är en förutsättning, inte en detalj.
