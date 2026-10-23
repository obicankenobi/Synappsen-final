# Demomanus — 30 minuter

**Internt säljstöd · Synappsen · [DATUM]**

> **Den enda regeln som betyder något:** du visar aldrig en funktion. Du visar ett ögonblick
> ur deras arbetsdag. Skillnaden mellan "här är sökfunktionen" och "det är tio över tre på
> natten och du behöver veta hur ni gör vid en anafylaxi" är hela demot.
>
> **Tidsbudget:** 5 min samtal · 15 min demo · 10 min pris och nästa steg. Om du hamnar över
> 20 minuter i demot har du visat för mycket.

---

## Före mötet

- [ ] Demomiljön är seedad med **deras** verksamhetstyp (akutmottagning / vårdcentral / hemtjänst)
- [ ] Minst tre rutiner med namn som låter som deras, inte "Testrutin 1"
- [ ] Förrådet har artiklar med riktiga skåp- och hyllplatser
- [ ] En rutin är avsiktligt flaggad som "bör granskas" och en saknar ägare — du behöver dem i steg 5
- [ ] Akutläget har tre kuraterade rutiner och ett larmnummer
- [ ] **Telefonen är laddad och har appen installerad.** Det mesta av demot sker på telefon, inte på skärmdelning
- [ ] Du vet vad enheten heter, ungefär hur många som jobbar där, och vem chefen är
- [ ] One-pager och tekniskt faktablad är färdiga att mejla direkt efter mötet

---

## Del 1 — Samtal (5 min). Visa ingenting än.

Öppna med att du vill förstå innan du visar. Ställ dessa och **anteckna deras ord ordagrant** —
du ska använda dem i demot.

1. "Hur gör ni idag när någon behöver hitta en rutin mitt i ett pass?"
2. "Vad hände senast en rutin ändrades — hur fick personalen veta att den ändrats?"
3. "Hur många nya medarbetare eller vikarier tar ni emot per år?"

**Lyssna efter dessa tre saker.** De avgör vilket spår du kör:

| Vad de säger | Vad du betonar i demot |
|---|---|
| "Man frågar en kollega" | Sök och akutläge — beroendet av nyckelpersoner |
| "Vi tar upp det på APT" | Läskvittering och vem som inte läst |
| "Vi har mycket vikarier" | Introduktionsspår och kompetensmatris |
| "Vi vet inte om de är aktuella" | Innehållshälsa — det starkaste kortet |
| "Förrådet är ett kaos" | Logistik med hyllplats och QR |

**Avsluta delen med:** *"Får jag visa hur det ser ut? Det tar ungefär en kvart."*

---

## Del 2 — Demo (15 min). Fem ögonblick, i den här ordningen.

### Ögonblick 1 — Hitta något (2 min)

**Säg:** *"Du sa nyss [deras egna ord]. Så här ser det ut i stället."*

Ta upp **telefonen**, inte datorn. Öppna appen från hemskärmen — visa att den är installerad
som en app, inte en flik i en webbläsare.

Sök på något de nämnt. Tryck på träffen. Rutinen öppnas.

**Säg:** *"Tre sekunder. Och lägg märke till att jag inte loggade in — jag var redan inloggad,
som man är i en app man har på telefonen."*

**Gör inte:** förklara sökmotorn, nämna Fuse.js, eller visa filter. Ingen bryr sig.

---

### Ögonblick 2 — Akutläget (2 min)

**Säg:** *"Nu är det inte lugnt längre."*

Tryck akutknappen från startsidan. Låt helskärmsvyn stå kvar tyst i tre sekunder.

**Säg:** *"En knapptryckning. Ingen sökning, inga val. Svart och rött, hög kontrast, knappar
byggda för handskar. Innehållet väljs av er egen ansvariga — inte av mig, och inte av en
algoritm."*

Slå av wifi och mobildata på telefonen. Öppna en av rutinerna igen.

**Säg:** *"Och det fungerar utan nät. Det här är avsiktligt det första jag byggde."*

> Det här är demots höjdpunkt. Motstå frestelsen att visa något direkt efteråt — låt det
> sjunka in.

---

### Ögonblick 3 — Kör en rutin, hitta i förrådet (3 min)

Öppna en rutin i **checklistläge**. Stega igenom två steg.

**Säg:** *"Samma rutin, men körd i stället för läst. Ett steg i taget, med bild och
varningstext där det behövs. Byggd för den som står mitt i momentet, inte för den som läser i
förväg vid ett skrivbord."*

Gå till Logistik. Öppna en artikel.

**Säg:** *"Sterilförrådet, skåp B, hylla 3. Inte 'fråga Anna'. Och den där QR-koden sitter på
hyllan — skannar man den kommer man rakt hit."*

Tryck på bristanmälan.

**Säg:** *"Två klick, av vem som helst som märker att något är slut. Inte bara av
förrådsansvarig — den som upptäcker bristen är sällan den som beställer."*

---

### Ögonblick 4 — Vem har inte läst (3 min)

Byt till **chefsperspektivet**. Öppna en rutin och fäll ut listan över vilka som inte kvitterat.

**Säg:** *"Det här är frågan ingen kan svara på idag. Inte 'vi tog upp det på APT', utan de här
fyra personerna har inte tagit del av den. Med deadline, och med en lista att exportera."*

Visa kompetensmatrisen kort.

**Säg:** *"Och när redaktören markerar en ändring som väsentlig slutar tidigare kvitteringar
räknas — personen måste läsa och kvittera den nya versionen. Det är den detaljen som gör att
siffran betyder något ett år senare."*

> **Säg inte "automatiskt".** Redaktören kryssar själv i att ändringen är väsentlig; det sker
> inte av sig självt vid varje redigering. Och ingenting raderas — den gamla kvittensen finns
> kvar i historiken, den slutar bara räknas i kompetensöversikten. Verifierat mot
> `src/utils/kompetensStatus.js` 2026-08-23, efter att den tidigare formuleringen visat sig
> lova mer än koden gör.

---

### Ögonblick 5 — Innehållshälsan (4 min) — **det viktigaste**

Öppna innehållshälsan i adminpanelen.

**Säg långsamt:** *"Det här är det jag inte sett hos någon annan, och det är också anledningen
till att jag byggde produkten."*

Peka på hälsosiffran. Peka sedan direkt på nedbrytningen.

**Säg:** *"Siffran ensam är värdelös. Det som betyder något är listan under den: de här tre
rutinerna saknar ägare, de här två har inte granskats på fjorton månader, den här har ingen
kvitterat.*

*En kunskapsbank som ruttnar inifrån ser precis likadan ut som en välskött. Ända tills någon
följer en inaktuell rutin i ett akutförlopp. Det här är det enda sättet att se skillnaden i
förväg."*

Tilldela en ägare direkt i listan. Starta en granskningsrunda.

**Säg:** *"Och det går att åtgärda utan att lämna vyn. En siffra utan orsak går att runda av.
En siffra med lista går inte."*

---

## Del 3 — Pris och nästa steg (10 min)

### Säg priset rakt ut och var sedan tyst

**Säg:** *"Kärna kostar 39 000 kronor per enhet och år. Drift, som är den nivå jag
rekommenderar, kostar 59 000. Per enhet — inte per användare, för ett gemensamt verktyg ska
inte kosta mer för att fler använder det."*

> **Säg aldrig "det är den de flesta väljer".** Det finns ingen kund som valt något, och ett
> osant påstående om kundbeteende i ett samtal vars hela poäng är ärlighet är det billigaste
> sättet att förlora affären. Rekommendera nivån i eget namn i stället — det är sant, och det
> är dessutom ett starkare argument från någon som byggt produkten.

**Sluta prata.** Låt tystnaden ligga. Deras första reaktion är den ärliga.

Först om de tvekar:

**Säg:** *"39 000 för en enhet med 80 anställda är 490 kronor per person och år. Ungefär 40
kronor i månaden."*

---

### Säg det som inte finns — innan de frågar

**Säg:** *"Tre saker jag vill att du vet innan du bestämmer dig.*

*Ett: jag har ingen kund i drift ännu. Ni skulle bli först. Effektsiffrorna i mitt material är
uttryckligen märkta som uppskattningar, inte resultat.*

*Två: enkel inloggning med era vanliga konton är inte byggd. Om det är ett hårt krav bygger jag
det mot er uppsättning, och det ingår i priset.*

*Tre: det finns kvarstående tillgänglighetsbrister som är öppet listade i redogörelsen, och
ingen extern penetrationstestning har gjorts."*

> **Detta avsnitt är det som säljer.** Nästan ingen leverantör gör det, och det ändrar helt hur
> resten av samtalet läses. Hoppa aldrig över det för att mötet går bra — särskilt inte då.

---

### Fråga om piloten

**Säg:** *"Mitt förslag är en betald pilot i sex veckor på en enhet. Ni får utvärderingen
skriftligt oavsett vad den visar."*

Ställ sedan de två frågor som avgör om affären finns:

1. **"Vilken enhet skulle du välja?"**
2. **"Vem skulle vara redaktör?"**

Konkreta namn = verkligt intresse. Vaga svar = de är inte där än, och då är nästa steg ett möte
med den som faktiskt bestämmer, inte en pilot.

Avsluta med: **"Vem behöver säga ja utöver dig?"**

---

## Efter mötet — samma dag

- [ ] Mejl med sammanfattning, one-pager, tekniskt faktablad och prislista (mall 5 eller 6)
- [ ] Erbjud att skicka underlaget till IT och dataskyddsombud **oavsett var beslutet står**
- [ ] Anteckna deras exakta formuleringar om problemet — de ska tillbaka i nästa mejl
- [ ] Boka nästa steg med datum, inte "vi hörs"

---

## Fällor i demot

| Fälla | Vad som händer | Gör i stället |
|---|---|---|
| Visa adminpanelen tidigt | De ser ett system att förvalta, inte ett verktyg att använda | Börja alltid i personalens vy, på telefonen |
| Visa allt du byggt | 67 etapper går inte att visa på en kvart. Du tappar dem vid minut nio | Fem ögonblick. Resten på fråga |
| Prata teknik | React, Firebase och hashkedjor intresserar IT-avdelningen, inte verksamhetschefen | Spara det till det tekniska faktabladet |
| Demo på delad skärm i en webbläsare | Hela poängen är att det är en app i fickan | Telefon i handen, skärmdelning bara till chefsvyerna |
| Prata efter att du sagt priset | Du förhandlar mot dig själv innan de sagt något | Var tyst |
| Hoppa över "vad som inte finns" | Det upptäcks ändå, och då i deras IT-granskning i stället för i ditt möte | Säg det själv, först |
| Lova en tidplan för SSO | Du är ensam. Tidplaner du tappar kostar mer än funktionen ger | "Byggbart mot er kravbild. Låt oss reda ut vad det behöver kunna" |

---

## Kortversion — 10 minuter

När du bara får en kvart i ett korridorsamtal eller på en mässa:

1. **En fråga:** *"Hur gör ni idag när någon behöver hitta en rutin mitt i ett pass?"* (1 min)
2. **Sök och hitta på telefonen** — deras eget exempel (2 min)
3. **Akutläget, med nätet avstängt** (2 min)
4. **Innehållshälsan med nedbrytningen** (3 min)
5. **Priset, det som inte finns, och frågan om ett riktigt möte** (2 min)

Släpp allt annat. De fyra ögonblicken bär hela produkten.
