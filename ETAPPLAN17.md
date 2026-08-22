# Etapplan 17 – Utseendet från prototypen in i appen

**Etapp 68. Utkast 2026-08-21, EJ ANTAGEN.** Bygger på jämförelsen mellan prototypartefakten
"Synkronisering från Claude Code" och den faktiska koden i v5.117.0.

> **Vad den här planen är:** en väg att föra över prototypens *visuella* beslut till appen.
> Prototypens struktur och navigering är medvetet utanför omfattningen; ägaren har klargjort
> att prototypen visar utseende, inte upplägg.
>
> **Vad den inte är:** en omdesign. Appen har redan ett fungerande tokensystem, mörkt läge,
> fyra valbara accenter och en WCAG-genomgång bakom sig. Det som saknas är tre beslut och
> ett städjobb.

---

## Premisskontroll (genomgående krav 8)

Fem antaganden kontrollerade mot koden innan planen skrevs. Tre höll, två ändrade innehållet.

### Höll

**Tokensystemet propagerar.** `src/index.css` innehåller sex hexvärden utanför `:root`, varav
fem sitter i kommentarer som förklarar WCAG-val. Komponenterna i `src/components` och
`src/pages` har fem hårdkodade hexvärden totalt. En ändring av `--primar` slår alltså faktiskt
igenom, vilket är hela förutsättningen för 68b.

**Accentsystemet i prototypen är appens eget.** Prototypens `accentSwatches` har fyra
alternativ, och `useAccent.js` har exakt fyra: `bla`, `gron`, `lila`, `orange`. Lila och grönt
är inte främmande färger utan kundens egna val. Ingenting behöver byggas här.

**Mörkt läge finns i båda och grunderna är nära identiska.** Prototypens mörka botten är
`#0B0F16`, appens `--bg` är `#0a0e16`. Ljusa bottnar `#F3F6F8` mot `#f5f9fa`.

### Ändrade planen

**Palettens värden är WCAG-härledda, inte valda på känsla.** `index.css` motiverar i klartext
varför `--text-svag` är `#475569` och inte `#64748b`, och varför `--success` är `#15803d` och
inte `#16a34a`: båda för att nå 4,5:1 mot `--bg`. Varje färgändring i den här planen måste
därför mätas, inte bedömas. Därav genomgående krav 30.

**Städjobbet är större än palettbytet.** Utanför `index.css` finns **37 hårdkodade
hexvärden fördelade på 16 komponent-CSS-filer** (`AppUppdateringBanner.css`,
`InstalleraAppBanner.css`, `KioskPinModal.css`, `Personalpuls.css`, `SkannaModal.css`,
`Akutlage.css` med flera). De påverkas inte av en tokenändring. Utan 68a blir varje framtida
palettjustering opålitlig, och det är därför 68a ligger först och inte sist.

> **Rättelse 2026-08-22.** Siffran stod ursprungligen som "141 hexvärden i 10 filer". Det var
> fel: greppet räknade in `index.css` själv, där 110 av värdena bor och där de hör hemma.
> Felet är mitt och upptäcktes först när 68a faktiskt genomfördes. Det ändrade slutsatsen
> inte alls, bara storleken på arbetet.

### Mätningar gjorda med appens eget verktyg (`src/utils/kontrast.js`)

| Färgpar | Kontrast | AA (4,5) |
|---|---|---|
| `#2563eb` (appen i dag) mot vit yta | 5,17:1 | godkänt |
| `#2563eb` mot sidbakgrund `#f5f9fa` | 4,88:1 | godkänt |
| **`#2F5FD6`** (prototypen) mot vit yta | **5,63:1** | godkänt |
| **`#2F5FD6`** mot sidbakgrund | **5,31:1** | godkänt |
| Vit text på `#3b82f6` (mörkt läges primär) | **3,68:1** | **UNDERKÄNT** |
| Mörk text `#0a0e16` på `#3b82f6` | 5,25:1 | godkänt |

Två slutsatser som styr planen. Prototypens blå är inte bara varumärkesdokumentets färg, den
har **mer kontrastmarginal** än den appen kör i dag. Och mörkt läges primärknapp klarar
**inte** AA i dag, vilket bekräftar och kvantifierar den kända bristen (åtgärd P5 i
`VARUMARKE.md`).

---

## Genomgående krav

Fortsätter numreringen från krav 29 (Etapp 67).

**Krav 30. Varje färgändring mäts före och efter, och siffran skrivs in.** Använd
`kontrastforhallande()` i `src/utils/kontrast.js`. En färg som ändras utan att förhållandet
mot sin bakgrund redovisas är inte klar. Skälet står redan i `index.css`: palettens värden är
resultat av kontrastarbete, och en "snyggare" nyans som tappar 0,4 i förhållande är en
regression som ingen ser förrän en användare med nedsatt syn hör av sig.

**Krav 31. Inget nytt hårdkodat hexvärde i komponent-CSS.** Alla färger går via en token i
`index.css`. Undantag kräver en kommentar som förklarar varför tokenvägen inte fungerar, på
samma sätt som de befintliga undantagen i `index.css` gör.

**Krav 32. Typsnitt självhostas.** CSP:n sattes i säkerhetsgranskningens fynd 4.1 till
`font-src 'self' data:`. En `<link>` mot `fonts.googleapis.com` **blockeras** när policyn görs
skarp. Ett nytt typsnitt måste alltså ligga i `public/`, inte hämtas från en CDN. Det är inte
en begränsning att arbeta runt, det är avsiktligt.

---

## Delmål

### 68a. Tokendisciplin i komponent-CSS (förarbete) ✅ KLAR 2026-08-21

Migrera de 37 hårdkodade hexvärdena i de 16 komponent-CSS-filerna till befintliga tokens.
Där ingen token passar, lägg till en i `index.css` med både ljus och mörk variant.

Det här är inte kosmetika. En färg som står hårdkodad i `KioskPinModal.css` följer inte med
när `--primar` byts, och den följer inte heller med in i mörkt läge. Varje sådant värde är en
plats där appen i dag kan se fel ut utan att någon märker det.

**Klart när:** `grep -rhoE "#[0-9a-fA-F]{6}" src --include="*.css"` ger noll träffar utanför
`index.css`, eller enbart träffar med en förklarande kommentar bredvid.

**Risk:** låg. Rena CSS-ändringar, inget beteende. Fångas av `test:e2e`s axe-svep och av
rökprovet över 25 routes i sju roller.

---

### 68b. Primärfärgen till `#2F5FD6` ✅ KLAR 2026-08-21

Byt `--primar` i ljust läge från `#2563eb` till `#2F5FD6`, och härled om `--primar-mork` och
`--primar-ljus` från den. Uppdatera mörkt läges motsvarigheter.

Beslutet vilar på mätningen ovan, inte på smak: den nya färgen har högre kontrast mot båda
bottnarna, och den är den färg `GRAFISK-PROFIL.md` redan uppger som varumärkesblå. I dag
säger dokumentet och koden olika saker, och dokumentet råkar ha den bättre färgen.

**Följdändringar i samma commit:** symbolen som lades in 2026-08-21
(`public/favicon.svg`, `public/icons/icon.svg`, `public/icons/symbol.svg`,
`symbol-axon.svg`, `apple-touch-icon.png`) är ritad i `#2563eb` och måste följa med.
Även `theme-color` i `index.html`.

**Klart när:** samtliga par i tabellen ovan är ommätta och inskrivna, och `test:e2e`s
axe-svep är grönt i båda temana.

---

### 68c. Rätta knappkontrasten i mörkt läge ✅ KLAR 2026-08-22

Vit text på `--primar: #3b82f6` ger **3,68:1**. AA kräver 4,5. Det är en riktig
tillgänglighetsdefekt, inte en preferens, och den finns i produktion i dag.

Två vägar, och valet bör göras på mätning:

1. Mörka mörkt läges `--primar` tills vit text når 4,5:1.
2. Byt knapptextens färg till mörk. `#0a0e16` på `#3b82f6` ger redan 5,25:1.

Väg 1 är att föredra om den kan göras utan att knappen tappar sin lyskraft mot den mycket
mörka bottnen `#0a0e16`. Väg 2 är säkrare men gör knappen ovanlig att titta på.

**Klart när:** vit eller mörk knapptext når minst 4,5:1 mot knappens botten i mörkt läge,
mätt och inskrivet, och `TILLGANGLIGHETSREDOGORELSE.md` uppdaterad.

**Detta delmål bör göras även om resten av planen inte antas.**

#### Genomfört 2026-08-22, och premissen ovan var fel

Premisskontrollen visade att **primärknappen aldrig haft defekten**. `.knapp` sätter
`color: var(--yta)`, inte vit, och `--yta` växlar med temat. Uppmätt blir knappen 5,63 / 5,02
/ 5,70 / 5,18:1 i ljust läge och 4,87 / 10,27 / 6,58 / 7,91:1 i mörkt, för blå, grön, lila
respektive orange. Alla klarar AA. Siffran 3,68:1 som planen och `VARUMARKE.md` P5 byggde på
mätte ett par som inte finns i appen.

Den riktiga defekten är smalare och skarpare: **sju regler sätter vit text på `--primar`**,
och alla sju faller i mörkt läge, från 3,68:1 (blå) ner till **1,74:1 (grön)**. Sex av dem är
`--pa-primar` från 68a, som gjorde en redan befintlig hårdkodning enhetlig. Den sjunde är
`.hoppa-till-innehall`, alltså just den funktion som finns FÖR tangentbords- och
skärmläsaranvändare.

**Väg 2 valdes, och mätningen avgjorde det.** Väg 1, att mörka accenten, går inte: accenten
gör dubbel tjänst i mörkt läge, som knappbakgrund OCH som länk-/textfärg mot den mycket mörka
bottnen. En accent mörk nog för vit knapptext blir för mörk att läsa som text mot `--bg`.
`--pa-primar` och `--pa-farlig` är därför mörka i mörkt läge, vilket är samma sak som
`.knapp` alltid gjort. Att 68a införde token:et innan defekten var lokaliserad visade sig
vara tur: rättningen blev två rader.

---

### 68d. Kontrastvakt som test ✅ KLAR 2026-08-22

Skriv ett vitest som läser palettens tokens och kör `kontrastforhallande()` över de par som
faktiskt möts i gränssnittet: text mot bakgrund, text mot yta, vit text mot primärknapp,
svag text mot bakgrund, i båda temana. Testet failar om något par går under sitt krav.

Skälet är projektets eget mönster: `SAKERHETSRAPPORT.md` låg 51 releaser efter verkligheten
och `PITCH.md` 48, och båda löstes med samma sak, en händelsestyrd regel i stället för en
minnesstyrd. Kontrast är exakt samma sorts krav. Krav 30 säger att man ska mäta; det här
delmålet gör att man inte kan låta bli.

**Klart när:** testet ingår i `npm run test` och failar bevisligen mot paletten före 68c:s
rättning.

#### Genomfört 2026-08-22

`tests/docs/kontrastpalett.test.js`. 14 par gånger 8 paletter (fyra accenter, två teman) plus
ett vakttest som failar om någon lägger till en femte accent utan att ta med den. 113 test.

**Bevisat meningsfullt:** körd mot paletten före 68c:s rättning ger **8 fel**, ett per accent
och tema för `--pa-primar` och `--pa-farlig`. Efter rättningen 113 gröna.

**Vakten hittade en defekt planen inte kände till.** `--kant-stark` klarade inte WCAG 1.4.11
(3:1) mot vare sig `--yta` eller `--bg`, i båda teman och alla fyra accenter: 1,48:1 i ljust
och 1,63:1 i mörkt. Det spelar roll eftersom token:et bär **sökfältets och
kommandopalettens kantlinjer**, alltså riktiga kontrollgränser och inte dekoration. Nya
värden `#7d8a99` och `#606f89` ger ca 3,5:1 mot yta och 3,3–3,8:1 mot bakgrund. Defekten
fanns före hela Etapp 68 och upptäcktes bara för att vakten skrevs, vilket är precis vad den
är till för.

---

### 68e. Typsnittet (villkorat av beslutspunkt 1)

Appen har inget eget typsnitt. `index.css` deklarerar `font-family` två gånger, båda
`inherit`, så appen renderas i systemtypsnittet: San Francisco på iOS, Roboto på Android,
Segoe på Windows.

Om beslutspunkt 1 blir ja: självhosta familjen i `public/fonts/`, delmängda till latin plus
svenska tecken, med `font-display: swap` och en fullständig reservkedja mot systemtypsnittet.
Sätt den på `body` och låt `inherit` i övrigt vara kvar.

**Klart när:** typsnittet laddas utan CDN (krav 32), första renderingen inte blockeras, och
den tillagda överföringsvikten är uppmätt och inskriven.

---

### 68f. Dokumenten i takt ✅ KLAR 2026-08-22

`GRAFISK-PROFIL.md` (finns ännu inte i repot, se `VARUMARKE.md` P2) uppdateras med den
slutgiltiga paletten, symbolens geometri och radieskalan. `VARUMARKE.md` §12 uppdateras så
att beskrivningen matchar den symbol som faktiskt ligger i `public/`. Åtgärd P5 i
`VARUMARKE.md` stryks när 68c är klar.

### 68g. Beslut om `--kant` ✅ KLAR 2026-08-22

Tillkom efter planen skrevs. 68d lämnade en öppen fråga: `--kant` ger 1,23:1 mot `--yta`
och klarar alltså inte 1.4.11:s 3:1. Ägaren delegerade beslutet ("ta beslut om --kant").

**Premisskontrollen ändrade svaret.** Den självklara åtgärden – mörka `--kant` tills det når
3:1 – visade sig vara fel. En genomgång av samtliga användningar gav två grupper:

| | Antal | Vad | Gäller 1.4.11? |
|---|---|---|---|
| A | 36 | `<input>`, `<select>`, `<textarea>`, verktygsknappar, val-chips | **Ja.** Fältet har `background: var(--yta)`, samma som kortet under. Strecket är det enda som säger att ytan är ett fält |
| B | 81 | Kortkanter, avdelare (`border-top`/`-bottom`), ifyllnader (`background: var(--kant)`) | **Nej.** Kortet bärs av sin egen yta och sin skugga; strecket är förstärkning |

1.4.11 kräver 3:1 av det som behövs för att IDENTIFIERA en komponent eller ett tillstånd,
inte av dekoration. Att mörka alla 117 hade ramat in varje kort i appen i grått – en synlig
omdesign framtvingad av ett krav som inte ställs.

**Åtgärd:** de 36 i grupp A pekar nu på `--kant-stark`, som redan fanns, redan når 3:1 i alla
åtta paletter och redan är definierat som "kontrollgräns, inte dekoration". Inget nytt token
behövdes, och 68d:s kontrastvakt bevakar det redan.

En följdfix: `.tema-vaxlare__val` hade bas `--kant` och hover `--kant-stark`. När basen flyttades
blev hovern en tom operation. Den går nu till `--text-svag` i stället.

Mätt (krav 30): `--kant-stark` mot `--yta` 3,52:1 i båda teman, mot `--bg` 3,32:1 ljust och
3,80:1 mörkt. `--kant` är oförändrat 1,23:1 och ska förbli det.

**Rättelse:** `TILLGANGLIGHETSREDOGORELSE.md` angav 91 användningar. Rätt siffra är 117.

---

## Beslutspunkter som kräver ägaren

**1. Ska appen få ett eget typsnitt?**
Prototypen refererar Public Sans 16 gånger i bundlen, men dess CSS sätter `font-family:
inherit` precis som appens, så jag kan inte läsa ut att familjen faktiskt är satt.
Public Sans är ett rimligt val för sammanhanget: ritat för amerikanska myndighetstjänster med
läsbarhet i småstorlek som uttalat mål. Kostnaden är en självhostad webbfont på en produkt
vars position är att öppnas snabbt mitt i ett arbetspass. **Min rekommendation: vänta.**
Systemtypsnittet är inte fel, bara ovalt, och det är den enda punkten i planen som gör
appen långsammare.

**2. Ska korten lyftas som i prototypen?**
Appens skuggor är nästan osynliga (`0 1px 2px .04` plus `0 1px 3px .06`). Prototypen använder
`0 10px 24px .08` och `0 10px 30px .12`. **Min rekommendation: nej.** `VARUMARKE.md` §5 säger
behärskad, ingen brådska. Lyfta kort med tio pixlars spridning drar åt motsatt håll, och
skillnaden syns mest på en stor skärm som inte är produktens huvudsakliga.

**3. Ska radieskalan tas från prototypen?**
**Min rekommendation: nej, appens är bättre.** Appen har två tokens (`--radius: 14px`,
`--radius-liten: 10px`) plus 999px för piller. Prototypen använder åtta värden: 8, 9, 10, 11,
12, 14, 16 och 999. Att 9 och 11 finns med avslöjar att de är handjusterade per komponent och
inte kommer från en skala. Att införa dem vore att ärva en inkonsekvens appen inte har.

---

## Vad jag INTE föreslår

**Prototypens navigering och sidstruktur.** Ägarens klargörande gäller: prototypen visar
utseende. Den flata toppnavigeringen, "Akut" i stället för "Akutläge", och att
bristanmälningar och utgående artiklar ligger på startsidan i stället för på Logistik är
prototypartefakter, inte förslag.

**En generell omdesign.** Appen har genomgått Etapp 42 och 43 (gränssnittsförnyelse) och en
tillgänglighetsgenomgång. Den här planen ändrar en färg, rättar en kontrastdefekt, städar
tokens och lägger till en vakt. Allt annat är villkorat av ett ägarbeslut.

**Att röra accentsystemet.** Det stämmer redan mellan prototyp och app.

---

## Ordning och beroenden

```
68a  tokendisciplin ────┐
                        ├──> 68b  primärfärgen ──> 68f  dokumenten
68c  mörkt läge ────────┤
68d  kontrastvakt ──────┘

68e  typsnittet   (fristående, villkorat av beslutspunkt 1)
```

**68a före 68b** är tvingande: byter man paletten innan de 141 hårdkodade värdena är
migrerade får man en app som ser rätt ut på de flesta ställen och fel på tio, vilket är
svårare att upptäcka än om den såg fel ut överallt.

**68c och 68d kan göras direkt.** De är oberoende av färgbytet och 68c rättar en defekt som
finns i produktion nu. Vill ägaren inte anta resten av planen bör de två ändå göras.

---

## Uppskattat omfång

| Delmål | Omfång | Anmärkning |
|---|---|---|
| 68a | Störst i planen | 141 värden i 10 filer, mekaniskt men måste granskas i båda temana |
| 68b | Litet | En token plus fem ikonfiler, om 68a är gjort |
| 68c | Litet | En eller två tokens, men kräver ett val mellan två vägar |
| 68d | Litet | Ett testfile |
| 68e | Medel | Delmängdning, självhostning, viktmätning |
| 68f | Litet | Kräver att `GRAFISK-PROFIL.md` först finns i repot |

**[uppskattning, ingen mätning finns]** enligt `VARUMARKE.md` regel 1.
