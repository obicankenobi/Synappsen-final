# Säljmaterial för Synappsen — innehåll och ifyllnadschecklista

**Framtaget [DATUM] · mot kodläge v5.117.0 · bygger på marknadsanalysen i `saljmaterial/MARKNADSANALYS.md`**

---

## Innan du skickar något till en kund

**Fyra saker måste vara gjorda först.** De är inte formalia — de är sådant som annars sänker
en affär i efterhand.

1. **Fyll i platshållarna.** Alla fält står inom hakparenteser och är gulmarkerade i PDF- och
   Word-dokumenten. Sök på `[` i varje fil. Full lista längre ned.
2. **Bilda aktiebolag och teckna ansvarsförsäkring med produktansvarsmoment.** Produktansvar
   är strikt och kan inte avtalas bort. Vid enskild firma möter privatekonomin ett anspråk.
   Se marknadsanalysen avsnitt 9, risk 2 och 3.
3. ~~**Deploya den senaste versionen.**~~ ✅ **KLAR 2026-08-23.** Produktionen kör v5.128.0
   (körning #87). Punkten var korrekt när den skrevs – då låg produktionen på v5.106.0 medan
   koden var på v5.117.0.
4. **Lös frågan om leverantörens upphörande.** Källkodsdeposition eller motsvarande, plus en
   avtalsklausul. Det är den fråga varje kunds jurist ställer först om en ensam leverantör,
   och den enda invändning i hela materialet där ett svävande svar sänker affären direkt.

> ~~**En femte punkt som tar minuter:** rätta rollantalet i `saljmaterial/PITCH.md`…~~ ✅ **KLAR
> 2026-08-23.** `saljmaterial/PITCH.md` säger nu sju roller, verifierat mot `src/firebase/roles.js`.
> `granskningar/SAKERHETSRAPPORT.md` räknade upp sex i löptext men beskriver kioskrollen utförligt i sitt
> tillägg om Etapp 55 – ingen ändring behövdes där.

> **VIKTIGT (tillagt 2026-08-23): hela det här paketet är skrivet mot kodläge v5.117.0.**
> Koden ligger nu på v5.128.0 – elva versioner senare, med etapp 66–69 byggda däremellan.
> Ingen av dem ändrar paketets slutsatser i sak (de rör rutinägarnotiser, handledarsignering,
> leverantörsvyn och skrivbordslayout), men **kontrollera statuspåståenden mot koden, inte mot
> det här paketet**, innan något skickas. En faktaverifiering av paketets kritiska påståenden
> mot faktisk kod finns i `saljmaterial/SALJMATERIAL-UNDERLAG-FOR-BEDOMNING.md`.

---

## Vad som finns, och när du använder det

### Presentationer (PowerPoint, 13 bilder)

| Fil | Använd när |
|---|---|
| `Synappsen-presentation-PRIVAT-VARDGIVARE.pptx` | Möte med ägare eller verksamhetschef på vårdcentral, specialistklinik eller privat omsorg |
| `Synappsen-presentation-KOMMUNAL-VARD-OCH-OMSORG.pptx` | Möte med enhetschef eller MAS inom SÄBO, hemtjänst eller LSS |
| `Synappsen-presentation-REGION-OCH-SJUKHUS.pptx` | Möte med verksamhetschef, VÖL eller VEC på en sjukhusavdelning |

Samma struktur i alla tre, olika problembeskrivning, argument och exempel. **Varje bild har
talarnoter** — läs dem, de säger vad du ska göra, inte bara vad som står på bilden.

Bild 9 heter "Vad som inte finns – och varför". **Hoppa aldrig över den**, särskilt inte när
mötet går bra. Den är det som gör resten trovärdigt.

---

### One-pagers (PDF, en A4-sida)

| Fil | Använd när |
|---|---|
| `Synappsen-onepager-PRIVAT-VARDGIVARE.pdf` | Bilaga i första mejlet, eller lämnas kvar efter ett möte |
| `Synappsen-onepager-KOMMUNAL-VARD-OCH-OMSORG.pdf` | Samma, kommunalt |
| `Synappsen-onepager-REGION-OCH-SJUKHUS.pdf` | Samma, region |

En sida, tänkt att läsas på tre minuter av någon som inte var med i mötet men som ska säga ja.

---

### Underlag för granskning

| Fil | Använd när |
|---|---|
| `Synappsen-teknisk-beskrivning.pdf` (5 sidor) | Skickas till IT-avdelning, systemförvaltare eller dataskyddsombud. **Erbjud alltid att skicka den, oavsett var beslutet står** — den kostar dem inget att granska och flyttar processen framåt utan att kräva ett ja |
| `Synappsen-prislista.pdf` (3 sidor) | Bilaga när priset ska stå skriftligt. Innehåller momsnoten, rabattstruktur och ett öppet avsnitt om vad som inte finns |
| `Synappsen-upphandlingssvar.pdf` (5 sidor) | **Internt.** Färdiga formuleringar att klippa in i anbud och leverantörsformulär. Skickas aldrig som helhet till en kund |

---

### Avtalsmallar (Word, redigerbara)

| Fil | Använd när |
|---|---|
| `Synappsen-pilotoverenskommelse-MALL.docx` | **Undertecknas innan en pilot startar, aldrig efteråt.** Punkt 4 är hela poängen: den skyddar kunden upphandlingsrättsligt och dig mot att diskvalificeras i en senare upphandling |
| `Synappsen-offert-MALL.docx` | Skarp offert efter pilot eller efter beslutsmöte |

---

### Säljstöd (Markdown, för dig själv)

| Fil | Använd när |
|---|---|
| `saljmaterial/Synappsen-demomanus.md` | Läs före varje demo. Fem ögonblick på 15 minuter, plus en checklista för förberedelser och en lista över fällor |
| `saljmaterial/Synappsen-invandningshantering.md` | Läs en gång i sin helhet, slå sedan upp inför specifika möten. Varje invändning har vad de menar, vad du svarar, och vad du inte ska säga |
| `saljmaterial/Synappsen-epostmallar.md` | Elva mallar: första kontakt per segment, påminnelse, efter möte, till IT/DSO, pilotförslag, halvtid, utvärdering, vänligt avslut |

---

## Ifyllnadschecklista

### Måste fyllas i innan något skickas

- [ ] `[BOLAGSNAMN]` — förekommer i **alla** filer
- [ ] `[ORG.NR]` — prislista, offertmall
- [ ] `[KONTAKTPERSON]` / `[DITT NAMN]` — presentationer, one-pagers, mejlmallar
- [ ] `[E-POST]` — alla filer
- [ ] `[TELEFON]` — alla filer
- [ ] `[WEBBPLATS]` — presentationernas sista bild
- [ ] `[DATUM]` — alla filer (versionsdatum)
- [ ] `[VERSION]` — teknisk beskrivning (produktversion dokumentet avser)

### Måste utredas innan de kan fyllas i

- [ ] `[FYLL I: bekräftad region, styrkt med skärmbild ur konsolen]` — **teknisk beskrivning
      avsnitt 9 och upphandlingssvar B4.** Regionen för Firestore och Storage syns inte i
      koden. Tio minuters kontroll i Firebase-konsolen; frågan har stått öppen sedan juli.
      Ett dataskyddsombuds vanligaste enskilda invändning
- [ ] `[FYLL I: avtalad gallringstid för revisionsloggen]` — **teknisk beskrivning avsnitt 13
      och upphandlingssvar B6.** Svara aldrig "raderas aldrig" — det läses som en brist mot
      lagringsminimeringen i art. 5.1 e. Ange en härledd tid (3 år som huvudregel, 5 år för
      säkerhetsrelevanta händelser är ett rimligt utgångsläge)
- [ ] `[FYLL I: rättslig grund för överföring till Google]` — upphandlingssvar B4
- [ ] `[FYLL I: avtalad rutin och svarstid för leverantörens bistånd vid registerutdrag]` —
      upphandlingssvar B5
- [ ] `[FYLL I: källkodsdeposition eller motsvarande]` — upphandlingssvar A1 och
      invändningshanteringen. **Lös detta innan ett kundmöte**
- [ ] `[FYLL I: försäkringsbolag, belopp, att produktansvar ingår]` — upphandlingssvar A3
- [ ] `[FYLL I: er hållning till att bekosta extern penetrationstestning]` — upphandlingssvar C3
- [ ] `[FYLL I: publiceringsadress för tillgänglighetsredogörelsen]` — upphandlingssvar D2.
      En redogörelse som inte är publicerad uppfyller inte kravet
- [ ] `[FYLL I: om extern juridisk MDR-bedömning inhämtats]` — upphandlingssvar E1. Om den
      finns är det ett mycket starkt svar; utelämna raden om den inte gör det
- [ ] `[FYLL I: hänvisning till huvudavtal eller ansvarsbegränsning]` — pilotöverenskommelsen §9
- [ ] `[FYLL I: supportens svarstider]` — offertmallen. **Lova inte mer än du kan hålla.**
      Ett brutet åtagande kostar mer än affären ger

### Fylls i per kund, vid varje användning

- [ ] `[KUNDENS NAMN]`, `[KONTAKTPERSON HOS KUND]`, `[NAMN PÅ ENHET]`, `[ANTAL]`,
      `[STARTDATUM]`, `[SLUTDATUM]`, `[ORT]` — pilotöverenskommelse och offert
- [ ] Belopp, nivå, rabatt och summor — offertmallen
- [ ] `[REGIONENS LEDNINGSSYSTEM]` — mejlmall 3, ersätts med Centuri, Platina, Canea eller
      vad just den regionen använder

---

## Påståenden som måste hållas sanna

Materialet är byggt på att vara ärligt om produktens brister — det är dess starkaste
säljargument, och det slutar fungera i samma sekund som något är osant. **Kontrollera dessa
före varje utskick.** Var och en ändras när en funktion byggs.

| Påstående i materialet | Kontrollera |
|---|---|
| "Ingen betalande kund ännu" | Ändra så fort första kunden är på plats — det ändrar också referenskundsargumentet |
| "SSO är inte byggt" | Ändra när Etapp 58 är klar |
| "Flerenhetsstöd finns inte" | Ändra när 54c/54d är byggda. Volymrabatterna i prislistan förutsätter det |
| "Ingen extern penetrationstestning" | Ändra om en beställs |
| "Kvarstående WCAG-brister på nivå A" | ✅ Sant per 2026-08-23. Fyra brister kvarstår (#4, #5, #6, #10) – inte sju som redogörelsens sammanfattning tidigare antydde. Ändra när SYN-6 är stängd |
| "App Check i mätfas" | ✅ Verifierat i kod 2026-08-23: klienten skickar intyg (`src/firebase/config.js`), ingen serverfunktion kräver dem. Ändra när enforcement aktiveras |
| "Sju roller" | ✅ Verifierat i kod 2026-08-23 (`src/firebase/roles.js`). `saljmaterial/PITCH.md` är rättad från sex till sju samma dag |
| AI-märkning enligt art. 50 | ❌ **INTE implementerad – verifierat i kod 2026-08-23.** Upphandlingssvar E2 påstod motsatsen och är rättat. Skicka inget svar som beskriver märkningen som byggd förrän den finns i koden. Kravet gäller sedan 2 augusti 2026 |
| "Uppstartsavgift 25 000 kr" | ✅ **Avgjort 2026-08-23** (se `BESLUTSLOGG.md`): avgiften kvarstår och betalas av de tre första kunderna, om inte annat uttryckligen framgår i det enskilda kundavtalet. Referenskundsrabatten gäller enbart abonnemanget. Prislistan är rättad |

---

## Vem du ska sälja till först

Marknadsanalysens slutsats, i korthet: **börja inte med akutmottagningar.**

| Ordning | Segment | Varför |
|---|---|---|
| 1 | **Privat vårdgivare** | Ingen upphandling, ingen jävsrisk, inget SSO-krav, ägaren beslutar. 564 privata vårdcentraler plus koncerner |
| 2 | **Kommunal vård och omsorg** | 290 kommuner, direktupphandling, lägre IT-mognad ger större relativ nytta. Startbibliotek för hemtjänst finns byggt |
| 3 | **Enskild avdelning i region** | Möjligt inom direktupphandling, men den juridiska ytan är störst här — särskilt om du är anställd hos köparen |
| 4 | **Region centralt** | Sist. Kräver SSO, WCAG utan förbehåll på nivå A, flerenhetsstöd och referenser |

Produkten behöver inte byggas om för detta. Startbiblioteket stödjer redan vårdcentral och
kommunal hemtjänst som verksamhetstyper.

---

## Underhåll av det här materialet

Uppdatera **samma dag** som något ändras som ett dokument påstår — inte inför nästa möte.
Projektets egen historik visar att den regeln är svår att hålla: sex gånger har ett skriftligt
dokument påstått något som inte längre stämde, varav en gång i själva säljmaterialet
(`saljmaterial/PITCH.md` påstod att klinikstöd-sökningen var pausad tre veckor efter att den slagits på).

Källfilerna för PDF-erna är HTML (`*.html` plus `stil.css`) och genereras om med
`python3 rendera.py *.html`. Presentationerna byggs om med `node bygg-deck.js`,
Word-dokumenten med `node bygg-docx.js`.

---

*Priser, konkurrentjämförelser och segmentprioritering i det här materialet bygger på
`saljmaterial/MARKNADSANALYS.md`. Läs den om du vill veta varför priset är satt som det är — särskilt
avsnitt 7, som förklarar varför modellen är per enhet och inte per användare, och avsnitt 7.6,
som är ärlig om att marginalen ännu inte är mätt.*
