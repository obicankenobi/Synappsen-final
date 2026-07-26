# Tillgänglighetsredogörelse för Synappsen

> **Status på detta dokument:** utkast baserat på en genomförd teknisk granskning
> 2026-07-26. Tre uppgifter måste fyllas i av leverantören innan publicering – de är
> markerade `[FYLL I]` nedan och kan inte härledas ur koden. Se även avsnittet
> "Att göra före publicering" sist i dokumentet.

`[FYLL I: juridiskt namn på leverantören]` står bakom Synappsen. Vi vill att så många
som möjligt ska kunna använda tjänsten. Detta dokument beskriver hur Synappsen uppfyller
lagen om tillgänglighet till digital offentlig service (DOS-lagen, SFS 2018:1937),
eventuella kända brister och hur du kan rapportera problem.

---

## Vilka regler som gäller – och varför detta dokument finns

Synappsen är en verksamhetsapplikation som säljs till offentliga vårdgivare (regioner och
kommuner). Det ger två skilda men sammanhängande krav:

**DOS-lagen ställer kravet på kunden, inte på oss.** Lagen riktar sig till *offentliga
aktörer*. Formellt är det den upphandlande regionen eller kommunen som ansvarar för att
publicera en tillgänglighetsredogörelse för de digitala tjänster de tillhandahåller sin
personal – inklusive Synappsen. Som leverantör kan vi inte publicera den redogörelsen åt
dem. Däremot är det vi som har kunskapen om produktens faktiska tillgänglighet, och utan
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
internt arbetsverktyg för vårdpersonal och tillhandahålls inte till konsumenter. Vi bedömer
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
  tangentbord, i logisk ordning, och har en synlig fokusmarkering.
- **Automatiserad testning.** Inloggning, startsida med sökfunktion, kliniskt stöd och
  anslagstavla gav **noll** överträdelser vid maskinell granskning.

---

## Innehåll som inte är tillgängligt

### 1. Bristande förenlighet med lagkraven

Följande brister är kända och planerade att åtgärdas.

| # | Brist | WCAG-krav | Nivå | Konsekvens för användaren |
|---|-------|-----------|------|---------------------------|
| 1 | Ingen "hoppa till innehåll"-länk, och inget `<main>`-landmärke. Tio navigeringslänkar passeras innan huvudinnehållet nås. | 2.4.1 Hoppa över block | **A** | Tangentbords- och skärmläsaranvändare måste tabba förbi hela menyn på varje sida. |
| 2 | Sidans titel är "Synappsen" på samtliga sidor och ändras inte vid navigering. | 2.4.2 Sidans titel | **A** | Skärmläsaranvändare får ingen bekräftelse på vilken sida de kommit till; flera öppna flikar går inte att skilja åt. |
| 3 | Rollväljaren i adminpanelens användarlista saknar tillgängligt namn. | 4.1.2 Namn, roll, värde | **A** | Skärmläsaren läser upp menyn utan att ange vad den styr. Påverkar endast superadministratörer. |
| 4 | Anslagstavlan saknar huvudrubrik (`<h1>`). | 1.3.1 Information och relationer | **A** | Sidans syfte framgår inte vid rubriknavigering. |
| 5 | Bekräftelsemeddelanden (notiser) kan bara stängas med musklick. | 2.1.1 Tangentbord | **A** | Kan inte avfärdas med tangentbord; de försvinner dock av sig själva. |
| 6 | Bekräftelsemeddelanden försvinner automatiskt efter 5 sekunder utan möjlighet att förlänga. | 2.2.1 Justerbar tidsgräns | **A** | Användare som läser långsamt eller använder skärmläsare hinner kanske inte uppfatta meddelandet. |
| 7 | Bekräftelsedialogen kan inte stängas med Esc, håller inte kvar fokus inuti sig, återlämnar inte fokus vid stängning och saknar tillgängligt namn. | 2.4.3 Fokusordning, 4.1.2 | A/AA | Skärmläsaranvändare kan hamna i bakgrundsinnehållet medan dialogen är öppen. |
| 8 | Ramfärgen på inmatningsfält och kort har kontrasten 1,23:1 mot vit bakgrund (kravet är 3:1). | 1.4.11 Kontrast för icke-text | **AA** | Fältgränser kan vara svåra att urskilja vid nedsatt syn eller i starkt ljus. |
| 9 | I mörkt tema har den blå accentfärgen kontrasten 3,98:1 mot kortbakgrund (kravet är 4,5:1). | 1.4.3 Kontrast (minimum) | **AA** | Länktext i mörkt läge kan vara svårläst. Ljust tema är opåverkat. |
| 10 | En etikett i rutinformuläret omsluter både en verktygsrad med knappar och ett textfält. | 1.3.1 Information och relationer | **A** | Kopplingen mellan etikett och fält blir tvetydig för hjälpmedel. |
| 11 | Emoji förekommer i rubriker och navigeringslänkar. | 1.3.1 (tolkning) | – | Skärmläsare läser upp emojinamn, vilket gör uppläsningen omständlig. Formellt inget krav­brott, men en reell försämring. |

**Planerad åtgärd:** samtliga punkter ovan hanteras inom Etapp 9b i produktens
utvecklingsplan (spåras som ärende SYN-6). Punkterna 1–4 är enkla att åtgärda och bör
prioriteras först, eftersom de är på nivå A och påverkar alla användare.
Beräknat åtgärdat senast `[FYLL I: datum]`.

### 2. Oskäligt betungande anpassning

Vi åberopar inget undantag för oskäligt betungande anpassning.

### 3. Innehåll som inte omfattas av lagstiftningen

- **Användargenererat innehåll.** Rutiner, anslag, kontaktuppgifter och dokument skapas av
  kundens egen personal. Vi tillhandahåller verktyg för att skriva strukturerat innehåll
  (rubriker, listor), men kan inte garantera att enskilda dokument uppfyller kraven –
  exempelvis att uppladdade PDF-filer är taggade, eller att personalen skrivit
  alternativtext till egna bilder. Ansvaret för det egna innehållet ligger hos kunden.
- **Innehåll från tredje part.** Det kliniska uppslagsstödet återger utdrag från externa
  källor (nationella riktlinjer och kunskapsstöd). Dessa källors egen tillgänglighet är
  utanför vår kontroll.

---

## Hur vi har testat tjänsten

Granskningen genomfördes **2026-07-26** som en **självskattning** av leverantören, med
följande metoder:

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

### Vad vi uttryckligen inte har testat

Detta är väsentligt för att bedöma redogörelsens tillförlitlighet:

- **Ingen testning med riktig skärmläsare** (NVDA, JAWS eller VoiceOver) har genomförts.
  Automatiserad testning fångar erfarenhetsmässigt bara omkring en tredjedel av alla
  tillgänglighetsproblem. Ytterligare brister kan finnas.
- **Ingen granskning av förstoring/omflöde** vid 400 % zoom (WCAG 1.4.10).
- **Ingen systematisk mätning av träffytors storlek** på pekskärm.
- **Ingen användartestning med personer med funktionsnedsättning.**
- Cirka 28 av tjänstens sidor omfattades inte av den automatiserade granskningen.

En oberoende extern granskning och ett skärmläsartest rekommenderas innan tjänsten
beskrivs som fullt förenlig.

---

## Vad du kan göra om du inte kan använda delar av tjänsten

Om du behöver innehåll från Synappsen som inte är tillgängligt för dig, eller stöter på
problem som inte beskrivs här, hör av dig till oss:

**E-post:** `[FYLL I: e-postadress för tillgänglighetsfrågor]`

Vi strävar efter att svara inom tre arbetsdagar.

Arbetar du hos en kund som använder Synappsen kan du även vända dig till din egen
organisations kontaktväg för tillgänglighetsfrågor, eftersom det är din arbetsgivare som är
ansvarig offentlig aktör.

## Tillsyn

Myndigheten för digital förvaltning (DIGG) har ansvaret för tillsyn över lagen om
tillgänglighet till digital offentlig service. Om du inte är nöjd med hur vi hanterar dina
synpunkter kan du anmäla det till DIGG: <https://www.digg.se/tdosanmalan>

---

## Att göra före publicering

Detta dokument är komplett i sak men får inte publiceras som en färdig redogörelse förrän
följande är gjort:

1. **Fyll i de tre `[FYLL I]`-fälten:** leverantörens juridiska namn, e-postadress för
   tillgänglighetsfrågor och ett realistiskt måldatum för åtgärderna. Ett måldatum som
   passeras utan åtgärd är sämre än inget datum – välj med marginal.
2. **Publicera dokumentet så att det går att nå.** En redogörelse som inte är publicerad
   uppfyller inte kravet. Synappsen har i dag ingen sidfot där den normalt skulle länkas;
   lämpligast är en egen sida (`/tillganglighet`) länkad från hjälpsidan och
   inloggningssidan. Detta är en produktändring som inte gjorts ännu.
3. **Bestäm om redogörelsen även ska levereras som bilaga i anbud.** Det är
   rekommendationen – det besvarar en fråga varje offentlig upphandlare ställer.

**Senast granskad och uppdaterad:** 2026-07-26
**Nästa översyn bör ske:** vid nästa större funktionsändring, dock senast om tolv månader.

---

*Underlaget till denna redogörelse – fullständiga mätvärden, verktygsversioner och
granskade sidor – finns dokumenterat i `UTVECKLINGSLOGG.md` under Fas 34.*
