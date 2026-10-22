# Tillgänglighetsredogörelse för Synappsen

> **Status på detta dokument:** utkast baserat på en teknisk granskning 2026-07-26,
> **omgranskat och uppdaterat 2026-08-04** (Etapp 45c) efter att gränssnittet byggts om i sin
> helhet (Etapp 42–44), och **2026-09-10** då samtliga dittills kvarstående WCAG-brister (#4–#6,
> #10, #11) åtgärdades och leverantörens namn och kontakt-e-post fylldes i. En sak återstår
> innan publicering som anbudsbilaga: se avsnittet "Att göra före publicering" sist i
> dokumentet.

`Kasper Lindqvist` står bakom Synappsen. Jag vill att så många
som möjligt ska kunna använda tjänsten. Detta dokument beskriver hur Synappsen uppfyller
lagen om tillgänglighet till digital offentlig service (DOS-lagen, SFS 2018:1937),
eventuella kända brister och hur du kan rapportera problem.

---

## Vilka regler som gäller – och varför detta dokument finns

Synappsen är en verksamhetsapplikation som säljs till offentliga vårdgivare (regioner och
kommuner). Det ger två skilda men sammanhängande krav:

**DOS-lagen ställer kravet på kunden, inte på mig.** Lagen riktar sig till *offentliga
aktörer*. Formellt är det den upphandlande regionen eller kommunen som ansvarar för att
publicera en tillgänglighetsredogörelse för de digitala tjänster de tillhandahåller sin
personal – inklusive Synappsen. Som leverantör kan jag inte publicera den redogörelsen åt
dem. Däremot är det jag som har kunskapen om produktens faktiska tillgänglighet, och utan
den kan kunden inte fullgöra sin skyldighet.

**Detta dokument fyller därför två funktioner:**

1. Det är leverantörens tillgänglighetsdokumentation – underlaget en kund behöver för att
   skriva sin egen redogörelse, och det underlag en upphandlare efterfrågar i ett anbud.
2. Det är skrivet enligt den obligatoriska mallen i kommissionens genomförandebeslut
   (EU) 2018/1523, så att en kund kan anta det med minimal bearbetning.

**Standard som tillämpas:** EN 301 549 (europeisk harmoniserad standard för tillgänglighet
i IKT), som i sin tur hänvisar till **WCAG 2.1 nivå AA**.

**Om tillgänglighetsdirektivet (European Accessibility Act, lag 2023:254):** den
lagstiftningen omfattar produkter och tjänster riktade till konsumenter. Synappsen är ett
internt arbetsverktyg för vårdpersonal och tillhandahålls inte till konsumenter. Jag bedömer
därför att den lagen inte är tillämplig. Bedömningen bör dock omprövas om produkten i
framtiden erbjuds direkt till privatpersoner.

---

## Hur tillgänglig är Synappsen?

**Synappsen är delvis förenlig med lagen om tillgänglighet till digital offentlig service**,
på grund av de brister som beskrivs nedan.

Detta är en ärlig bedömning, inte en formalitet. Granskningen visade att grunden är
starkare än väntat – automatiserad testning av fem centrala flöden gav noll fel på fyra av
dem – men det finns kända brister på **WCAG nivå A**, vilket gör att tjänsten inte kan
beskrivas som fullt förenlig. Bristerna är åtgärdbara och ingen av dem hindrar en
tangentbordsanvändare från att nå tjänstens huvudfunktioner.

**Uppdatering 2026-07-26 (Etapp 13g):** de fyra punkter av dessa som var enklast att
åtgärda och som prioriterades i den ursprungliga bedömningen (#1, #2, #3 och #7 i tabellen
nedan) är nu åtgärdade i koden – se raderna för status. Kvarstår gör punkterna #4–#6 och
#8–#11, samtliga fortsatt spårade som ärende SYN-6.

**Uppdatering 2026-08-04 (Etapp 45c):** en betydligt bredare automatiserad granskning
(samtliga 27 sidor × två roller, se "Hur jag har testat tjänsten" nedan) hittade sex NYA
brister – samtliga uppkomna av eller synliggjorda av gränssnittsförnyelsen (Etapp 42–44) och
alla **åtgärdade samma dag, se #12–#17** i tabellen. Punkterna #4–#6 och #8–#11 från den
ursprungliga granskningen kvarstår oförändrade.

**Uppdatering 2026-08-23 (rättelse av sammanfattningen ovan):** raden "#4–#6 och #8–#11
kvarstår" stämde inte längre. **#8 och #9 är åtgärdade** (Etapp 68d/68g respektive 68d, se
tabellraderna, som var korrekta hela tiden – det var sammanfattningstexten här som låg efter).
Faktiskt kvarstående var **#4, #5, #6 och #10**, samtliga på nivå A, plus #11 som inte är ett
formellt kravbrott.

**Uppdatering 2026-09-10: samtliga kvarstående punkter åtgärdade.** #4 visade sig redan vara
rättad i koden (dokumentationsdrift, se tabellraden). #5, #6, #10 och #11 åtgärdade denna dag –
se respektive tabellrad för vad som gjordes. **Det finns just nu ingen känd kvarstående
avvikelse mot WCAG 2.1 nivå A/AA i den här redogörelsen.** Det är INTE detsamma som bevisad
full förenlighet: automatiserad testning fångar erfarenhetsmässigt bara omkring en tredjedel
av alla tillgänglighetsproblem, och skärmläsartestning, 400 %-förstoring, träffytor på
pekskärm och användartestning med personer med funktionsnedsättning är fortfarande otestat
(se "Vad jag uttryckligen inte har testat" nedan – oförändrat). Sammanfattningen ovan ("delvis
förenlig") lämnas därför medvetet oförändrad tills en sådan testning gjorts – att skriva "fullt
förenlig" på grundval av enbart automatiserad testning vore ett starkare påstående än
underlaget bär, och en ärlig lucka väger tyngre än ett för starkt ord i den här sortens
dokument (samma princip som resten av redogörelsen bygger på).

### Vad som fungerar bra

Följande är kontrollerat och uppfyller kraven:

- **Färgkontrast i ljust tema.** Samtliga text- och bakgrundskombinationer klarar kravet på
  4,5:1. Uppmätta värden: brödtext 17,1:1, dämpad text 7,2:1, länkfärg 4,9:1, statusfärger
  4,6–5,0:1. Färgpaletten har uttryckligen justerats för detta ändamål.
- **Språk.** Sidan är korrekt märkt med `lang="sv"`, så skärmläsare använder svenskt uttal.
- **Bilder.** Samtliga bilder har alternativtext eller är korrekt märkta som dekorativa.
- **Formulär.** Etiketter är kopplade till sina fält (via omslutande `<label>`), så
  skärmläsare läser upp rätt fältnamn.
- **Tangentbordsnavigering.** Alla kontrollerade interaktiva element går att nå med
  tangentbord, i logisk ordning, och har en synlig fokusmarkering. "Mer"-menyn (mobilnav,
  Etapp 42f) fångar nu tangentbordsfokus korrekt (Esc stänger, Tab cyklar inuti, fokus
  återlämnas vid stängning) – åtgärdat 2026-08-04, se #16.
- **Automatiserad testning, permanent.** Samtliga 27 sidor, för både en superadmin- och en
  personal-roll, gav **noll** överträdelser vid maskinell granskning (axe-core) efter
  2026-08-04-fixarna – och är sedan samma dag en del av `test:e2e`
  (`tests/e2e/tillganglighet.spec.js`), så en framtida regression upptäcks automatiskt i CI
  istället för vid nästa manuella granskning.

---

## Innehåll som inte är tillgängligt

### 1. Bristande förenlighet med lagkraven

Följande brister är kända och planerade att åtgärdas.

| # | Brist | WCAG-krav | Nivå | Konsekvens för användaren | Status |
|---|-------|-----------|------|---------------------------|--------|
| 1 | Ingen "hoppa till innehåll"-länk, och inget `<main>`-landmärke. Tio navigeringslänkar passeras innan huvudinnehållet nås. | 2.4.1 Hoppa över block | **A** | Tangentbords- och skärmläsaranvändare måste tabba förbi hela menyn på varje sida. | **Åtgärdat 2026-07-26** – synlig-vid-fokus "Hoppa till innehåll"-länk samt `<main id="huvudinnehall">` på samtliga skyddade sidor. |
| 2 | Sidans titel är "Synappsen" på samtliga sidor och ändras inte vid navigering. | 2.4.2 Sidans titel | **A** | Skärmläsaranvändare får ingen bekräftelse på vilken sida de kommit till; flera öppna flikar går inte att skilja åt. | **Åtgärdat 2026-07-26** – `document.title` sätts per rutt (`useSidTitel`). |
| 3 | Rollväljaren i adminpanelens användarlista saknar tillgängligt namn. | 4.1.2 Namn, roll, värde | **A** | Skärmläsaren läser upp menyn utan att ange vad den styr. Påverkar endast superadministratörer. | **Åtgärdat 2026-07-26** – `aria-label` med användarens namn tillagt. |
| 4 | Anslagstavlan saknar huvudrubrik (`<h1>`). | 1.3.1 Information och relationer | **A** | Sidans syfte framgår inte vid rubriknavigering. | **Redan åtgärdad i koden, upptäckt 2026-09-10.** `src/pages/Anslagstavla.jsx` har ett ovillkorat `<h1>📢 Anslagstavla</h1>` sedan tidigare – raden här hade bara aldrig uppdaterats efter att koden rättades i en senare etapp (genomgående krav 8: verifierat mot faktisk kod innan avbockning, inte antaget). |
| 5 | Bekräftelsemeddelanden (notiser) kan bara stängas med musklick. | 2.1.1 Tangentbord | **A** | Kan inte avfärdas med tangentbord; de försvinner dock av sig själva. | **Åtgärdat 2026-09-10.** `DialogProvider.jsx` visar nu en riktig `<button aria-label="Stäng meddelande">` inuti varje meddelande, nåbar och aktiverbar med tangentbord – i stället för ett `onClick` på en `<div>`. |
| 6 | Bekräftelsemeddelanden försvinner automatiskt efter 5 sekunder utan möjlighet att förlänga. | 2.2.1 Justerbar tidsgräns | **A** | Användare som läser långsamt eller använder skärmläsare hinner kanske inte uppfatta meddelandet. | **Åtgärdat 2026-09-10.** Hover ELLER tangentbordsfokus (på stäng-knappen, #5) pausar nedräkningen helt; den återstartar en full ny 5-sekundersperiod när pekaren/fokus lämnar meddelandet. En användare som aktivt uppmärksammar meddelandet kan alltså hålla det kvar obegränsat. |
| 7 | Bekräftelsedialogen kan inte stängas med Esc, håller inte kvar fokus inuti sig, återlämnar inte fokus vid stängning och saknar tillgängligt namn. | 2.4.3 Fokusordning, 4.1.2 | A/AA | Skärmläsaranvändare kan hamna i bakgrundsinnehållet medan dialogen är öppen. | **Åtgärdat 2026-07-26** – Esc stänger, fokus fångas inuti dialogen (Tab-cykel), fokus återlämnas till det som var fokuserat innan, `aria-labelledby` mot frågetexten. |
| 8 | Ramfärgen på inmatningsfält och kort (`--kant`, `#e2e8f0`) har kontrasten 1,23:1 mot vit bakgrund (kravet är 3:1). | 1.4.11 Kontrast för icke-text | **AA** | Fältgränser kan vara svåra att urskilja vid nedsatt syn eller i starkt ljus. | **ÅTGÄRDAD 2026-08-22 (Etapp 68d + 68g).** 68d höjde `--kant-stark` från 1,48:1 till 3,52:1 (ljust) respektive 1,63:1 till 3,52:1 (mörkt). 68g avgjorde återstoden. En genomgång av samtliga användningar – **117, inte 91 som tidigare stod här; den siffran var en underskattning** – delade dem i 36 faktiska kontrollgränser (`<input>`, `<select>`, `<textarea>`, verktygsknappar, val-chips) och 81 kortkanter, avdelare och ifyllnader. De 36 pekar nu på `--kant-stark` och når 3,52:1 mot kortyta i båda teman. `--kant` är MEDVETET kvar på 1,23:1: 1.4.11 kräver 3:1 av det som behövs för att identifiera en komponent, inte av dekoration, och korten identifieras av sin egen yta och skugga. Bevakas av `tests/docs/kontrastpalett.test.js`. |
| 9 | I mörkt tema har den blå accentfärgen kontrasten 3,98:1 mot kortbakgrund (kravet är 4,5:1). | 1.4.3 Kontrast (minimum) | **AA** | Länktext i mörkt läge kan vara svårläst. Ljust tema är opåverkat. | **ÅTGÄRDAD.** Ommätt 2026-08-22 (Etapp 68d): `--primar` `#3b82f6` mot `--yta` `#131722` ger 4,87:1, alltså över kravet. Siffran 3,98:1 var stale mot en tidigare palett. Bevakas nu av `tests/docs/kontrastpalett.test.js`, som failar om den går under igen. |
| 10 | En etikett i rutinformuläret omsluter både en verktygsrad med knappar och ett textfält. | 1.3.1 Information och relationer | **A** | Kopplingen mellan etikett och fält blir tvetydig för hjälpmedel. | **Åtgärdat 2026-09-10.** `RutinFormular.jsx`s innehållsfält har nu ett fristående `<label htmlFor="rutin-innehall-falt">` som pekar explicit bara på textarean – verktygsraden (åtta knappar) ligger kvar visuellt bredvid, men utanför etikettens koppling. |
| 11 | Emoji förekommer i rubriker och navigeringslänkar. | 1.3.1 (tolkning) | – | Skärmläsare läser upp emojinamn, vilket gör uppläsningen omständlig. Formellt inget krav­brott, men en reell försämring. | **Åtgärdat 2026-09-10 för rubriker** (110 `<h1>`–`<h4>` i 84 filer, ledande emoji nu `<span aria-hidden="true">`). **Navigeringslänkarna var redan rätt** (`BottomNav.jsx`/`Sidomeny.jsx` har använt `aria-hidden="true"` på sina ikon-spans sedan tidigare) – bara sammanfattningen ovan hade inte fångat det. |
| 12 | `/logga-in` och `/registrera` (inloggade sidors förnyelse i Etapp 13g nådde aldrig dessa två, eftersom de renderas utanför den skyddade layouten) saknade helt `<main>`-landmärke. | 1.3.1, 2.4.1 | – (bästa praxis) | Skärmläsaranvändare fick ingen strukturell startpunkt på appens första sida någon möter. | **Åtgärdat 2026-08-04** – `<main id="huvudinnehall">` tillagt i `LoggaIn.jsx`/`Registrera.jsx`. |
| 13 | Samma brist på `/akutlage` och `/checklista/:rutinId` (Korvy) – båda renderas medvetet utanför den vanliga layouten (inget nav i akutläge/checklistläge) men fick därför aldrig ett `<main>`. | 1.3.1 | – (bästa praxis) | "Hoppa till innehåll"-länken (global, alla sidor) pekade mot ett id som inte fanns på just dessa två sidor. | **Åtgärdat 2026-08-04.** |
| 14 | Den flytande Akut-knappen (global, syns på nästan alla sidor sedan Etapp 42c) renderades helt utanför alla landmärken. | 1.3.1 (bästa praxis) | – | Skärmläsaranvändare som navigerar landmärkesvis missade knappen helt på varje sida den syns. | **Åtgärdat 2026-08-04** – wrappad i en namngiven `role="navigation"`-region. |
| 15 | Två `<nav>`-landmärken (bottennavigeringen och Hem:s snabblänksrad, Etapp 43b) utan unika namn. | 4.1.2 (bästa praxis) | – | Går inte att skilja åt vid landmärkesnavigering med skärmläsare. | **Åtgärdat 2026-08-04** – `aria-label` tillagt på båda. |
| 16 | "Mer"-menyn (mobilnav, Etapp 42f) påstod sig vara en modal dialog (`role="dialog" aria-modal="true"`) men saknade Esc-stängning, fokusfångst och fokusåterlämning. | 2.1.2, 2.4.3, 4.1.2 | A/AA | Tangentbords-/skärmläsaranvändare kunde tabba ut i bakgrundsinnehållet medan menyn "låg över" det, och fastnade utan en tydlig väg tillbaka. | **Åtgärdat 2026-08-04** – samma mönster som bekräftelsedialogen (#7) återanvänt. |
| 17 | Rubrikordning hoppade från `<h1>` direkt till `<h3>` på tre ställen: förrådsartikelkort (`/logistik/<förråd>`), förrådskort på `/logistik` (när inga bristanmälningar/utgående artiklar fanns att visa en `<h2>` för), och två sidor (`/kompetensmatris`, `/papperskorg`) som helt saknade `<h1>` i sitt "ingen behörighet"/tomt-läge för en personal-roll. | 1.3.1 | – (bästa praxis) | Rubriknavigering (vanlig skärmläsarteknik) gav en förvirrande eller obefintlig sidstruktur, särskilt för roller utan redaktörsbehörighet. | **Åtgärdat 2026-08-04.** |
| 18 | `/leverantor`s laddningsläge och dess "saknar behörighet"-läge renderades som `<div class="sida">` utan `<main>`-landmärke – samma felklass som #13, men i två TILLSTÅND i stället för på två sidor. | 1.3.1, 2.4.1 | – (bästa praxis) | Den globala "Hoppa till innehåll"-länken pekade mot ett `#huvudinnehall` som inte fanns så länge organisationslistan laddade, och sidans innehåll låg utanför alla landmärken. | **Åtgärdat 2026-09-07** – båda grenarna renderar nu `<main id="huvudinnehall" tabIndex={-1}>`, samma som den lyckade grenen. Upptäckt av axe-svepet först när `test:e2e` började starta functions-emulatorn: dessförinnan gick laddningsläget förbi för snabbt för att hinna mätas. |

**Planerad åtgärd:** samtliga punkter i tabellen ovan (1–18) är åtgärdade – se Etapp 13g
(`etapplaner/ETAPPLAN3.md`), Etapp 45c (`etapplaner/ETAPPLAN9.md`), `etapplaner/UTVECKLINGSLOGG.md`
och uppföljningen 2026-09-10 i `CLAUDE_STATUS.md` för #4–#6, #10 och #11. Ärende SYN-6 kan
därmed stängas. Ingen kvarstående brist väntar på ett måldatum just nu – dyker en ny upp
dokumenteras den med samma mall.

### 2. Oskäligt betungande anpassning

Jag åberopar inget undantag för oskäligt betungande anpassning.

### 3. Innehåll som inte omfattas av lagstiftningen

- **Användargenererat innehåll.** Rutiner, anslag, kontaktuppgifter och dokument skapas av
  kundens egen personal. Jag tillhandahåller verktyg för att skriva strukturerat innehåll
  (rubriker, listor), men kan inte garantera att enskilda dokument uppfyller kraven –
  exempelvis att uppladdade PDF-filer är taggade, eller att personalen skrivit
  alternativtext till egna bilder. Ansvaret för det egna innehållet ligger hos kunden.
- **Innehåll från tredje part.** Det kliniska uppslagsstödet återger utdrag från externa
  källor (nationella riktlinjer och kunskapsstöd). Dessa källors egen tillgänglighet är
  utanför min kontroll.

---

## Hur jag har testat tjänsten

Den ursprungliga granskningen genomfördes **2026-07-26** som en **självskattning** av
leverantören, med följande metoder:

1. **Automatiserad granskning** med axe-core mot WCAG 2.0/2.1 nivå A och AA, körd i
   Chromium mot en fullständigt fungerande testmiljö med inloggad användare. Fem flöden
   granskades: inloggning, startsida med sökfunktion, kliniskt stöd, anslagstavla och
   adminpanel.
2. **Numerisk kontrastberäkning** av samtliga färgkombinationer i formgivningen, i både
   ljust och mörkt tema, enligt WCAG:s formel för relativ luminans.
3. **Tangentbordsgenomgång** i webbläsare: fokusordning, fokusmarkeringars synlighet och
   åtkomst till huvudfunktioner.
4. **Kodgranskning** av semantisk struktur, landmärken, rubriknivåer, formuläretiketter,
   ARIA-attribut och dialoghantering.

**Omgranskningen 2026-08-04 (Etapp 45c)** utökade metod 1 avsevärt, efter att
gränssnittsförnyelsen (Etapp 42–44) byggt om navigering, adminpanel och lagt till flera nya
sidor sedan den ursprungliga granskningen:

5. **Automatiserad granskning, samtliga sidor.** axe-core kört mot alla 27 routes i
   `App.jsx` (inte fem flöden), för både en superadmin-roll och en personal-roll (samma sida
   kan ha olika DOM-struktur beroende på rollens data – ett verkligt fynd under den här
   omgranskningen, se #17). Resultat: sex nya brister hittade och åtgärdade (#12–#17),
   **noll kvarstående** axe-core-överträdelser efter fixarna.
6. **Permanent regressionsspärr.** Samma granskning finns nu som en körbar testfil
   (`tests/e2e/tillganglighet.spec.js`), en del av `test:e2e`/CI – skiljer den här
   omgranskningen från den ursprungliga, som var en engångsinsats utan uppföljande skydd.

### Vad jag uttryckligen inte har testat

Detta är väsentligt för att bedöma redogörelsens tillförlitlighet:

- **Ingen testning med riktig skärmläsare** (NVDA, JAWS eller VoiceOver) har genomförts –
  **oförändrat sedan 2026-07-26, trots omgranskningen.** Automatiserad testning fångar
  erfarenhetsmässigt bara omkring en tredjedel av alla tillgänglighetsproblem. Ytterligare
  brister kan finnas, särskilt sådana som kräver en interaktion (t.ex. att en modal dialog
  faktiskt fungerar med tangentbord, inte bara att dess statiska markup ser rätt ut). Kräver
  en människa, inte en session – spårad i `OPPNA-PUNKTER.md`.
- **Interaktionsutlöst UI (modaler, bottensheets) granskades bara delvis.** axe-core-skanningen
  körs mot varje sidas STATISKA laddade tillstånd – den öppnar inte "Mer"-menyn,
  kommandopaletten eller bekräftelsedialogen för att skanna DEM i öppet läge. Deras
  fokushantering verifierades istället genom kodgranskning (#16) och matchar ett redan
  etablerat, testat mönster (bekräftelsedialogen, #7) – men är inte maskinellt bevisat på
  samma sätt som resten av granskningen.
- Bara två av sex roller (superadmin, personal) ingår i den automatiserade granskningen –
  ett medvetet avgränsat urval, inte alla sex.
- **Ingen granskning av förstoring/omflöde** vid 400 % zoom (WCAG 1.4.10).
- **Ingen systematisk mätning av träffytors storlek** på pekskärm.
- **Ingen användartestning med personer med funktionsnedsättning.**

En oberoende extern granskning och ett skärmläsartest rekommenderas innan tjänsten
beskrivs som fullt förenlig.

---

## Vad du kan göra om du inte kan använda delar av tjänsten

Om du behöver innehåll från Synappsen som inte är tillgängligt för dig, eller stöter på
problem som inte beskrivs här, hör av dig till mig:

**E-post:** `kontakt@synappsen.se`

Jag strävar efter att svara inom 1-3 arbetsdagar.

Arbetar du hos en kund som använder Synappsen kan du även vända dig till din egen
organisations kontaktväg för tillgänglighetsfrågor, eftersom det är din arbetsgivare som är
ansvarig offentlig aktör.

## Tillsyn

Myndigheten för digital förvaltning (DIGG) har ansvaret för tillsyn över lagen om
tillgänglighet till digital offentlig service. Om du inte är nöjd med hur jag hanterar dina
synpunkter kan du anmäla det till DIGG: <https://www.digg.se/tdosanmalan>

---

## Att göra före publicering

Detta dokument är komplett i sak. Två av tre punkter är klara; en återstår som ett ägarbeslut:

1. ~~Fyll i de två `[FYLL I]`-fälten: leverantörens juridiska namn och en e-postadress för
   tillgänglighetsfrågor.~~ **Klart 2026-09-10.** Det tredje ursprungliga fältet (måldatum för
   åtgärder) är inte längre aktuellt – samtliga kända brister är åtgärdade 2026-09-10, se
   tabellen ovan.
2. ~~Publicera och länka från appen.~~ **Klart 2026-09-10.** Dokumentet publiceras som
   `synappsen-web/tillganglighet.html` (`https://synappsen.se/tillganglighet`, genererat
   av `synappsen-web/verktyg/bygg-underlag.mjs` – redigera aldrig den genererade sidan direkt,
   redigera det här källdokumentet och kör om skriptet). Länkad från appens hjälpsida
   (`src/pages/Hjalp.jsx`) och från inloggnings-/registreringssidan (`AuthSkal.jsx`, delas av
   båda). Sidan var till 2026-10-21 medvetet `noindex` tillsammans med webbplatsens övriga
   sidor; taggen är nu borttagen och sidan går att hitta via sökmotorer.
3. **Bestäm om redogörelsen även ska levereras som bilaga i anbud.** Det är
   rekommendationen – det besvarar en fråga varje offentlig upphandlare ställer. Detta är det
   enda kvarstående ägarbeslutet, se `OPPNA-PUNKTER.md`.

**Senast granskad och uppdaterad:** 2026-09-10 (samtliga kvarstående WCAG-brister åtgärdade)
**Nästa översyn bör ske:** vid nästa större funktionsändring, dock senast om tolv månader.

---

*Underlaget till den ursprungliga redogörelsen – fullständiga mätvärden, verktygsversioner
och granskade sidor – finns dokumenterat i `etapplaner/UTVECKLINGSLOGG.md` under Fas 34. Underlaget till
2026-08-04-omgranskningen (Etapp 45c) finns i `etapplaner/ETAPPLAN9.md` och som en körbar testfil,
`tests/e2e/tillganglighet.spec.js`.*
