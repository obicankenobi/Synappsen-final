# Synappsen – grafisk profil

**Internt · version 1, 2026-08-22 · motsvarar kodläge v5.121.0**

> **Vad detta är:** en beskrivning av det visuella system som **faktiskt ligger i koden**.
> Varje färgvärde, radie, skugga och koordinat nedan är läst ur en fil i det här repot, och
> filen anges. Varje kontrastsiffra är räknad med appens eget `kontrastforhallande()` i
> `src/utils/kontrast.js`, inte bedömd.
>
> **Vad det inte är:** en önskelista, en moodboard eller en beskrivning av hur appen borde se
> ut. Det som inte finns byggt står under "Kända avvikelser och luckor" längst ned, inte i
> huvudtexten.
>
> **Förhållandet till `produkt/VARUMARKE.md`:** varumärkesdokumentet §12 säger uttryckligen att
> symbol, färger, typografi, appikoner och formregler bor här, och att det aldrig upprepar
> dem. Den här filen är alltså sanningskällan för det visuella. Går de isär gäller **koden**,
> och då är det den här filen som ska rättas först och `produkt/VARUMARKE.md` §12 därefter.
>
> **Tonläget styr formen.** `produkt/VARUMARKE.md` §5: *behärskad – inga utropstecken, inga
> superlativ, ingen brådska.* Det är inte bara en skrivregel. Den är skälet till att skuggorna
> är nästan osynliga och att inget lyfter, blinkar eller studsar. Se "Form".

---

## 1. Färgsystemet

### Så är det byggt

Hela paletten bor i **`src/index.css`** som CSS-variabler. Ingen komponent äger en egen färg
(undantagen är två, uttryckligen motiverade, se avsnitt 6).

Systemet har **åtta paletter**: två teman × fyra accenter.

| Axel | Värden | Sätts av |
|---|---|---|
| Tema | ljust (bas), mörkt | `data-tema="dark"` / `"light"` på `:root`, satt av `useTema`-hooken/`TemaVaxlare`. Utan explicit val följer `@media (prefers-color-scheme: dark)` |
| Accent | `bla` (standard), `gron`, `lila`, `orange` | `data-accent` på `:root`, satt av `useAccent.js` |

Ljust läge (`:root`) definierar 31 tokens. Mörkt läge omdefinierar 29 av dem – allt utom
`--radius` och `--radius-liten`. En accent byter **bara tre** tokens (`--primar`,
`--primar-mork`, `--primar-ljus`); resten av temat rörs inte. `bla` har ingen egen regel
eftersom den är identisk med basen.

Varje mörk regel finns i **två exemplar** i filen: en under `:root[data-tema="dark"]` (det
explicita valet) och en identisk under `@media (prefers-color-scheme: dark)` med
`:root:not([data-tema="light"])` (systemvalet). De är i dag tecken för tecken lika i
värdena – men det är en dubblering som måste hållas i takt för hand. Se "Kända avvikelser".

### Bas – ljust läge (`:root`)

| Token | Värde | Roll |
|---|---|---|
| `--primar` | `#2f5fd6` | Varumärkesblå. Knappyta, länkar, aktiva tillstånd |
| `--primar-mork` | `#274eaf` | Hover på primärknapp, fokusringar, text på ljus primärfyllning |
| `--primar-ljus` | `#f0f4fc` | Svag fyllning: hover, markering, banderoller |
| `--accent` | `#0d9488` | Sekundär accent (teal) |
| `--amber` / `--amber-ljus` / `--amber-text` | `#f59e0b` / `#fffbeb` / `#92400e` | Varning, "väntar på godkännande" |
| `--text` | `#0f172a` | Brödtext |
| `--text-svag` | `#475569` | Sekundär text |
| `--bg` | `#f5f9fa` | Sidbakgrund |
| `--yta` | `#ffffff` | Kort- och panelyta |
| `--kant` | `#e2e8f0` | Dekorativ kant och avdelare |
| `--kant-stark` | `#7d8a99` | **Kontrollgräns** – fältkant, inte dekoration |
| `--farlig` / `--farlig-mork` / `--farlig-ljus` | `#dc2626` / `#b91c1c` / `#fef2f2` | Fel, destruktiv åtgärd |
| `--pa-primar` | `#ffffff` | Text och ikoner **på** en primärfärgad yta |
| `--pa-farlig` | `#ffffff` | Text och ikoner **på** en farligfärgad yta |
| `--success` / `--success-ljus` / `--success-text` | `#15803d` / `#f0fdf4` / `#15803d` | Bekräftelse, godkänt |
| `--doman-klin-ljus` / `--doman-klin-text` | `#eff6ff` / `#1d4ed8` | Domänbadge: Kliniskt stöd |
| `--doman-log-ljus` / `--doman-log-text` | `#f5f3ff` / `#6d28d9` | Domänbadge: Logistik |
| `--doman-adm-ljus` / `--doman-adm-text` | `#ecfeff` / `#0e7490` | Domänbadge: Administration |
| `--radius` / `--radius-liten` | `14px` / `10px` | Se "Form" |
| `--skugga` / `--skugga-hover` | Se "Form" | |

### Mörkt läge

| Token | Värde | Anmärkning |
|---|---|---|
| `--primar` | `#3b82f6` | |
| `--primar-mork` | `#60a5fa` | Ljusare än basen, inte mörkare – i mörkt läge är "mork" en rollbeteckning, inte en riktning |
| `--primar-ljus` | `#14243a` | |
| `--accent` | `#2dd4bf` | |
| `--amber` / `--amber-ljus` / `--amber-text` | `#fbbf24` / `#451a03` / `#fcd34d` | |
| `--text` | `#f1f5f9` | |
| `--text-svag` | `#94a3b8` | |
| `--bg` | `#0a0e16` | |
| `--yta` | `#131722` | |
| `--kant` | `#242a3a` | |
| `--kant-stark` | `#606f89` | |
| `--farlig` / `--farlig-mork` / `--farlig-ljus` | `#f87171` / `#fca5a5` / `#450a0a` | |
| `--pa-primar` / `--pa-farlig` | `#131722` / `#131722` | **Mörk** text på färgad knapp, inte vit. Se motiveringen nedan |
| `--success` / `--success-ljus` / `--success-text` | `#4ade80` / `#14532d` / `#86efac` | |
| `--doman-klin-ljus` / `--doman-klin-text` | `#1e3a5f` / `#93c5fd` | |
| `--doman-log-ljus` / `--doman-log-text` | `#2e1065` / `#c4b5fd` | |
| `--doman-adm-ljus` / `--doman-adm-text` | `#083344` / `#67e8f9` | |

### De fyra accenterna

Personlig, valbar accentfärg (Etapp 22e, `useAccent.js`). Endast dessa tre tokens byts.

| Accent | Läge | `--primar` | `--primar-mork` | `--primar-ljus` |
|---|---|---|---|---|
| **bla** (standard) | ljust | `#2f5fd6` | `#274eaf` | `#f0f4fc` |
| bla | mörkt | `#3b82f6` | `#60a5fa` | `#14243a` |
| **gron** | ljust | `#15803d` | `#166534` | `#f0fdf4` |
| gron | mörkt | `#4ade80` | `#86efac` | `#102919` |
| **lila** | ljust | `#7c3aed` | `#6d28d9` | `#f5f3ff` |
| lila | mörkt | `#a78bfa` | `#c4b5fd` | `#1f0a44` |
| **orange** | ljust | `#c2410c` | `#9a3412` | `#fff7ed` |
| orange | mörkt | `#fb923c` | `#fdba74` | `#2c0d05` |

En kund kan dessutom sätta en helt egen hexfärg. Den valideras före sparning av
`valideraAccentfarg()` i `src/utils/kontrast.js`, mot exakt de två ställen där accenten
används som bakgrund med fast textfärg ovanpå. Godkänn aldrig en accent förbi den vägen.

### Domänfärgerna får aldrig följa accenten

Domänfärgerna (Kliniskt stöd / Logistik / Administration) är **fasta hexvärden och medvetet
frikopplade från `--primar`**. Två skäl, båda i `index.css`:

1. En domänfärg får inte ändras av att en användare byter sin personliga accent. Området är
   en egenskap hos innehållet, inte hos betraktaren.
2. Domänfärgerna hålls i en helt annan hue-familj (blå/lila/cyan) än statusfärgerna
   (amber/röd/grön), så att en Logistik-badge aldrig kan förväxlas med en "väntar på
   godkännande"-badge på samma rad.

Samma sak i formspråket: statusbadgen är **medvetet tyngre** än domänbadgen – `font-weight:
700` plus en inre kant (`box-shadow: inset 0 0 0 1px currentColor`) mot domänbadgens `500`.
Kravet är att statusbadgen aldrig får vara svagare eller mindre framträdande än domänbadgen
på samma rad.

---

## 2. Varför färgerna är de de är

Det här avsnittet är profilens viktigaste. Flera av värdena ser ut som godtyckliga nyanser och
är det inte. Ändrar man dem "för att det blir snyggare" återinför man en defekt som redan har
kostat arbete att hitta.

**`--text-svag` är `#475569`, inte `#64748b`.** Det uppenbara valet `#64748b` ger **4,49:1**
mot `--bg` – två hundradelar under AA:s 4,5. `#475569` ger **7,15:1**. Skillnaden syns inte
för den som ser bra.

**`--success` är `#15803d`, inte `#16a34a`.** `#16a34a` ger **3,11:1** mot `--bg`, alltså
underkänt för normal text. `#15803d` ger **4,73:1** mot `--bg` och **5,02:1** mot `--yta`.

**`--primar` är `#2f5fd6`, inte `#2563eb`** (bytet gjordes i Etapp 68b, 2026-08-21). Bytet
gjordes på **mätning, inte smak**: den nya färgen har mer kontrastmarginal än den den
ersatte.

| | mot vit yta | mot `--bg` |
|---|---|---|
| `#2563eb` (tidigare) | 5,17:1 | 4,88:1 |
| `#2f5fd6` (nu) | **5,63:1** | **5,31:1** |

`--primar-mork` och `--primar-ljus` är härledda ur basen (18 % mot svart, 93 % mot vitt),
inte handplockade. Vit text på `#274eaf` ger 7,51:1.

**`--pa-primar` och `--pa-farlig` är MÖRKA i mörkt läge.** Det är kontraintuitivt och det är
rätt. Vit text på mörkt läges accenter ger 3,68 (blå), 1,74 (grön), 2,72 (lila) och 2,26
(orange) – samtliga under AA. Samma ytor med `#131722` som text ger 4,87 / 10,27 / 6,58 /
7,91. Det går **inte** att laga genom att mörka accenten i stället: accenten gör dubbel
tjänst i mörkt läge, som knappbakgrund *och* som länk-/textfärg mot den mycket mörka bottnen,
och de två rollerna drar åt motsatt håll. En accent mörk nog för vit knapptext blir för mörk
för att läsas som text mot `--bg`.

Att tokens finns alls är också ett beslut: `--pa-primar` varierar knappt mellan teman, men
utan token kräver en framtida ändring av `--primar` en jakt genom sexton filer i stället för
en ändring på ett ställe.

**`--kant` är AVSIKTLIGT kvar på 1,23:1. Höj det inte.** Token:et ger 1,23:1 mot `--yta` och
1,16:1 mot `--bg` (mörkt: 1,25 och 1,35), långt under de 3:1 som WCAG 1.4.11 kräver. Den
uppenbara åtgärden – mörka `--kant` tills det når 3:1 – prövades och **förkastades** i Etapp
68g. Skälet: 1.4.11 kräver 3:1 av det som behövs för att **identifiera** en komponent eller
ett tillstånd, inte av dekoration. En genomgång av samtliga 117 användningar delade dem i två:

| | Antal | Vad | Gäller 1.4.11? |
|---|---|---|---|
| A | 36 | `<input>`, `<select>`, `<textarea>`, verktygsknappar, val-chips | **Ja.** Fältet har `background: var(--yta)`, samma som kortet under. Strecket är det enda som säger att ytan är ett fält |
| B | 81 | Kortkanter, avdelare, ifyllnader (`background: var(--kant)`) | **Nej.** Kortet bärs av sin egen yta och sin skugga; strecket är förstärkning |

De 36 pekar sedan dess på `--kant-stark`. Att mörka alla 117 hade ramat in varje kort i appen
i grått – en synlig omdesign framtvingad av ett krav som inte ställs.

**`--kant-stark` är den enda kanten som får bära betydelse.** Den är definierad som
kontrollgräns, inte dekoration, och når 3:1 i alla åtta paletter: 3,52:1 mot `--yta` i båda
teman, 3,32:1 mot `--bg` i ljust och 3,80:1 i mörkt. Före Etapp 68d gav den 1,48:1 (ljust)
och 1,63:1 (mörkt) – en defekt som fanns i produktion och som bara upptäcktes för att
kontrastvakten skrevs.

**Regel för nya färger:** varje färgändring mäts före och efter med `kontrastforhallande()`,
och siffran skrivs in. En "snyggare" nyans som tappar 0,4 i förhållande är en regression som
ingen ser förrän en användare med nedsatt syn hör av sig. (Genomgående krav 30, `etapplaner/ETAPPLAN17.md`.)

---

## 3. Kontrast och tillgänglighet

### Paletten är testbevakad

**`tests/docs/kontrastpalett.test.js`** läser tokens direkt ur `src/index.css`, löser arvet
mellan bas, tema och accent, och mäter **14 par × 8 paletter**. Plus ett test som fångar att
någon lägger till en femte accent utan att ta med den. Totalt 113 tester; de är gröna i
v5.121.0 (kört 2026-08-22).

De 14 bevakade paren, med kravet och var de möts:

| Par | Krav | Var |
|---|---|---|
| `--yta` mot `--primar` | 4,5 | Primärknappens text |
| `--yta` mot `--primar-mork` | 4,5 | Primärknappen vid hover |
| `--pa-primar` mot `--primar` | 4,5 | Text på färgad yta (hoppa-till-innehåll m.fl.) |
| `--pa-farlig` mot `--farlig` | 4,5 | Text på farlig-knapp |
| `--text` mot `--bg` | 4,5 | Brödtext mot sidbakgrund |
| `--text` mot `--yta` | 4,5 | Brödtext mot kortyta |
| `--text-svag` mot `--bg` | 4,5 | Svag text mot sidbakgrund |
| `--text-svag` mot `--yta` | 4,5 | Svag text mot kortyta |
| `--primar` mot `--bg` | 4,5 | Sekundärknapp och länkar mot sidbakgrund |
| `--primar` mot `--yta` | 4,5 | Sekundärknapp och länkar mot kortyta |
| `--farlig` mot `--yta` | 4,5 | Felmeddelande mot kortyta |
| `--success` mot `--yta` | 4,5 | Bekräftelse mot kortyta |
| `--kant-stark` mot `--yta` | 3,0 | Kantlinje som bär betydelse (WCAG 1.4.11) |
| `--kant-stark` mot `--bg` | 3,0 | Samma, mot sidbakgrund |

### Höj ALDRIG kravet för att få testet grönt

Testets eget felmeddelande säger det, och det är den enda regeln i den här filen som är
absolut. När vakten failar finns exakt två giltiga åtgärder:

1. **Ändra färgen** tills den når kravet.
2. **Ta bort paret** – men bara om gränssnittet faktiskt inte längre sätter de två mot
   varandra, och då ska det gå att peka på var det slutade.

Att sänka `AA_TEXT` från 4,5, eller flytta ett par från 4,5 till 3,0 för att det ska passera,
är att göra defekten osynlig i stället för att laga den. Vakten skrevs just för att en
kommentar som ber någon komma ihåg att mäta bevisligen inte har hållit i det här projektet.

### Vad vakten inte gör

Den ersätter **inte** axe-svepet i `tests/e2e/tillganglighet.spec.js`. Det testet kör mot
renderade sidor och ser faktiska färgpar inklusive genomskinlighet och överlagring. Vakten
läser tokens och kontrollerar de par vi *vet* möts. De fångar olika saker: axe hittar par vi
inte tänkt på, vakten hindrar att någon ändrar en token utan att mäta. Kör båda.

### Övrigt som hör till tillgängligheten och är byggt

- **Fokusring.** En enda regel i `index.css` ger `outline: 3px solid var(--primar-mork)` med
  `outline-offset: 2px` för alla knappvarianter. Bara `:focus-visible`, så en musklickad knapp
  inte får ring. Fält och `<select>` har `outline: 2px` plus en halo i `--primar-ljus` – halon
  ensam räcker inte (den ger ca 1,06:1 mot vit fältbakgrund), den är dekor ovanpå en riktig
  outline.
- **`prefers-reduced-motion`.** En global regel stänger av animationer och övergångar i hela
  appen med `!important`. För personer med vestibulär yrsel är rörelse inte kosmetika utan
  något som gör verktyget oanvändbart. Ny animation behöver alltså inte egen hantering – men
  den får heller aldrig läggas utanför regelns räckvidd.
- **`.sr-only`** för rubriker som behövs för korrekt rubrikordning men inte ska upprepa vad
  omgivande UI redan visar.
- **`.hoppa-till-innehall`** – osynlig tills tangentbordsfokus.

Full status per WCAG-punkt: `granskningar/TILLGANGLIGHETSREDOGORELSE.md`.

---

## 4. Typografi

**Appen använder Public Sans, självhostad.** Sedan Etapp 68e (2026-08-22, v5.121.0). Dessförinnan
renderades allt i systemtypsnittet; den ändringen är beslutspunkt 1 i `etapplaner/ETAPPLAN17.md`, avgjord av
ägaren – se `BESLUTSLOGG.md`.

Två filer i `public/fonts/`, delmängdade till latin + svenska tecken:

| Fil | Vikt | Storlek |
|---|---|---|
| `public-sans-400.woff2` | 400 | 22 620 byte |
| `public-sans-600.woff2` | 600 | 22 704 byte |
| **Summa tillagd överföringsvikt** | | **45 324 byte (~44,3 KiB)** |

`font-weight: 500` förekommer i appen och mappas av webbläsaren till närmaste tillgängliga
vikt (400). Det är avsiktligt – två filer, inte fyra.

**Tre saker som INTE får ändras utan att man förstår varför:**

1. **Ingen CDN.** CSP:n är `font-src 'self' data:`. En `<link>` mot `fonts.googleapis.com`
   blockeras av webbläsaren och appen faller tyst tillbaka på systemtypsnittet.
   (Genomgående krav 32.)
2. **`font-display: swap`.** Texten ritas omedelbart i reservtypsnittet och byts när fonten
   landat. Första renderingen blockeras alltså aldrig av en fontnedladdning – produktens
   position är att öppnas snabbt mitt i ett arbetspass.
3. **Reservkedjan slutar med emojitypsnitt** efter `sans-serif`. Appen använder ett
   nittiotal emoji som Public Sans saknar helt, och webbläsaren gör reservval **per tecken**.
   Tas de leden bort hamnar emojin på webbläsarens sista utväg i stället för på ett riktigt
   emojitypsnitt. Samma ordning som Bootstrap 5 använder.

`:root` sätter fortfarande kortformen `font: 16px/1.6 system-ui, ...`, som bidrar med
font-size och radavstånd. `body` åsidosätter bara familjen. Allt annat ärver – `font-family:
inherit` respektive `font: inherit` finns kvar på formulärelement så att `<button>`/`<select>`
inte faller tillbaka på webbläsarens formulärtypsnitt.

Hela receptet för att återskapa fontfilerna (exakt `pyftsubset`-anrop, valda unicode-intervall
och varför hintningen behållits) står som kommentar överst i `src/index.css`. Duplicera det
inte hit – ändras anropet ska bara ett ställe uppdateras.

**Licens:** Public Sans är SIL Open Font License 1.1. Licenstexten ligger i
`public/fonts/OFL.txt` (4 390 byte) och upphovsrätts-/licensposterna är kvar inuti
woff2-filerna. OFL tillåter självhostning och ombildning till woff2; kravet är att notisen
följer med. Tas fontfilerna någon gång bort ska `OFL.txt` bort i samma commit, och tvärtom –
en licensfil utan font är lika missvisande som en font utan licensfil.

### Storlekar som faktiskt används i basen

Bas 16px, radavstånd 1,6. Skalan är gles med avsikt.

| Roll | Värde |
|---|---|
| `h1` | 1,6rem |
| Sektionsrubrik (`h2` i listor) | 1rem |
| Brödtext / knapp / fält | 1rem |
| `<select>` | 0,95rem |
| Sekundär text, etiketter, felmeddelande | 0,9rem |
| Piller, taggar, liten knapp | 0,85rem |
| Kryssrutetext | 0,8rem |
| Badge | 0,75rem (radavstånd 1,5) |

Vikter: 500 för svag betoning och domänbadge, 600 för knappar, länkar och piller, 700
reserverat för statusbadgen (se avsnitt 1).

---

## 5. Form

### Radier

| Token | Värde | Används till |
|---|---|---|
| `--radius` | `14px` | Kort, paneler, banderoller, modaler |
| `--radius-liten` | `10px` | Mindre ytor, hoppa-till-innehåll-länken |
| — | `999px` | Piller: badges, taggar, snabblänkar. Alltid rått, aldrig som token |

Skalan är medvetet **två steg plus piller**. Prototypen som `etapplaner/ETAPPLAN17.md` bygger på hade
åtta värden (8, 9, 10, 11, 12, 14, 16, 999); att 9 och 11 fanns med avslöjade att de var
handjusterade per komponent och inte kom från en skala. Att införa dem vore att ärva en
inkonsekvens appen inte har. **Lägg inte till ett tredje radiesteg utan att kunna säga vad
det är till för.**

Se dock den ärliga bilden under "Kända avvikelser": i praktiken används fler råa värden än
tokens.

### Skuggor

| Token | Ljust läge | Mörkt läge |
|---|---|---|
| `--skugga` | `0 1px 2px rgba(15,23,42,.04), 0 1px 3px rgba(15,23,42,.06)` | `0 1px 2px rgba(0,0,0,.3), 0 1px 3px rgba(0,0,0,.4)` |
| `--skugga-hover` | `0 6px 16px rgba(15,23,42,.10), 0 2px 6px rgba(15,23,42,.06)` | `0 6px 16px rgba(0,0,0,.5), 0 2px 6px rgba(0,0,0,.4)` |

**Skuggorna är nästan osynliga med avsikt.** Frågan om korten skulle lyftas som i prototypen
(`0 10px 24px .08` / `0 10px 30px .12`) prövades och avslogs i `etapplaner/ETAPPLAN17.md` beslutspunkt 2,
med `produkt/VARUMARKE.md` §5 som skäl: *behärskad, ingen brådska.* Lyfta kort med tio pixlars
spridning drar åt motsatt håll, och skillnaden syns mest på en stor skärm som inte är
produktens huvudsakliga. Ett kort bärs av sin yta, inte av sin skugga.

### Rörelse

Övergångar ligger på 0,15s för färg och skugga, 0,1s för `transform`. `.knapp:active` trycks
ned med `translateY(1px)` – det enda rörelseuttrycket i basen. Allt stängs av under
`prefers-reduced-motion`.

### Mått

- Sidans innehåll: `max-width: 600px`, padding `24px 16px 90px`. Auth-kortet är smalare,
  `380px`.
- Bottennavigeringen är `position: fixed`, och `.app-innehall` reserverar
  `calc(76px + env(safe-area-inset-bottom))` för den.
- Touchytor i akutläget: minst 48 × 48 px.

---

## 6. Symbolen

`produkt/VARUMARKE.md` §12 äger *vad* symbolen föreställer och varför. Här står *hur den är ritad*.

### Vad den är

En **synaps i genomskärning**: presynaptisk terminal (den fyllda kroppen), klyftan (det
konstanta mellanrummet) och det postsynaptiska membranet (den öppna bågen), med riktning från
övre vänster till nedre höger. Ritad och inlagd 2026-08-21.

Att terminalen är en **fylld kropp** och mottagarytan en **öppen båge** är inte dekor – det är
skillnaden i formsort som ger riktning utan förklaring. Ett tidigare utkast med två speglade
klumpar lästes som ett ben.

### Geometrin

Alla filer utom appikonen använder `viewBox="0 0 24 24"` och en yttre
`transform="translate(0.3 -1.0)"` runt märket. Appikonen har en egen transform, se nedan.

| Element | Definition |
|---|---|
| Terminal | `<circle cx="9.8" cy="11.2" r="3.15">`, fylld |
| Membran | `<path d="M 15.697 9.284 A 6.2 6.2 0 0 1 11.089 17.264">`, `stroke-width="2.7"`, `stroke-linecap="round"`, ingen fyllning |
| Axon (endast `symbol-axon.svg`) | `<path d="M 4.9 8.35 L 8.6 10.5">`, `stroke-width="2.0"`, `stroke-linecap="round"` |

Tre egenskaper är efterräknade (2026-08-22) och ska hållas om något ritas om:

1. **Bågen har exakt samma centrum som terminalen.** Avståndet från `(9.8, 11.2)` till bågens
   båda ändpunkter är 6,200 respektive 6,200 enheter, alltså bågradien. Det är det som gör
   **klyftan konstant bred**, och det är i sin tur det som gör märket skalbart: en klyfta som
   är bredare på ett ställe sluter sig alltid på det smalaste först, och då är synapsen borta.
2. **Klyftan är 1,70 av 24 enheter.** Räknat: bågradie 6,2 − halva stroken 1,35 − terminalens
   radie 3,15 = 1,70.
3. **Axeln lutar 30 grader.** Bågen spänner från −18° till +78° sett från centrum, alltså 96°
   med mittpunkt på exakt 30°. Axonet ligger i 30,2°. Flackare än 45° ger renare kanter mot
   pixelrutnätet.

### Varianterna

| Fil | Variant | Används |
|---|---|---|
| `public/icons/symbol.svg` | Utan axon | **Under 48 px:** favikon, knappar, listor, notisikon |
| `public/icons/symbol-axon.svg` | Med axon | **Från 48 px och uppåt:** webbplats, presentationer, brevpapper |
| `public/favicon.svg` | Utan axon, fasta färger + egen `prefers-color-scheme` | Webbläsarens flikikon (`index.html`) |
| `public/icons/icon.svg` | Utan axon, vit på blå platta | App-/PWA-ikon och notisikon (`vite.config.js`, `src/sw.js`) |
| `public/icons/apple-touch-icon.png` | 180 × 180 px | iOS-hemskärm. Apple stöder officiellt bara PNG här |

**Gränsen vid 48 px är inte ungefärlig.** Under den storleken smälter axonet ihop med
terminalen och vänstersidan blir grötig.

### Färgstyrning

`symbol.svg` och `symbol-axon.svg` ritas i `var(--synappsen-symbol, #2f5fd6)`. Bäddas filen in
i markup går färgen att styra genom att sätta variabeln på en förälder; laddas den via en
`<img>` är den ett eget dokument och faller tillbaka på blått. `currentColor` fungerar
uttryckligen **inte** för `<img>`-fallet – den hade blivit svart.

`favicon.svg` har i stället en egen `<style>` med `prefers-color-scheme`: `#2f5fd6` i ljust,
`#6c9bf7` i mörkt. Flikikonen sitter i webbläsarens ram och kan inte nå appens tokens.

`icon.svg` är vit (`#fff`) på en platta i `#2f5fd6` med `rx="5.4"` (22,5 % av bredden).
Märket är skalat till 86 % och centrerat, så att det får den luft en ikon behöver mot sin egen
kant.

### En fälla i SVG-filerna

Skriv **aldrig** ett CSS-variabelnamn med sina två inledande bindestreck inuti en
XML-kommentar. XML-kommentarer får inte innehålla två bindestreck i rad, och filen slutar då
renderas helt. Det inträffade 2026-08-21 och upptäcktes bara för att ikonen granskades
renderad.

### Bildspråket i övrigt

Två förbud från `produkt/VARUMARKE.md` §12 som styr all ny grafik:

- **Aldrig neurala nätverk, noder eller hjärnor.** Produkten tonar medvetet ned AI, och
  nodgrafen är den mest generiska tech-symbolen som finns. Dragningen är stark – två av tre
  logotypförslag från en bildmodell blev nätverksgrafer – och måste motstås aktivt.
- **Inga bilder på vårdpersonal.** Visa gränssnittet, alltid med demodata, aldrig en kunds
  verkliga innehåll.

---

## 7. Två medvetna undantag från temasystemet

Följande färger står **utanför** tokensystemet med avsikt. Flytta dem aldrig in i
`index.css` temablock – hela poängen är att de ser likadana ut oavsett vad användaren valt.

### Akutläget (`src/pages/Akutlage.css`)

Forcerad hög kontrast oavsett tema. Läget ska vara omedelbart visuellt avvikande och läsbart i
starkt solljus.

| Token | Värde | Roll |
|---|---|---|
| `--akut-bg` | `#000000` | Bakgrund |
| `--akut-panel` | `#1a1a1a` | Panel/kort |
| `--akut-text` | `#ffffff` | Text |
| `--akut-larm` | `#ff6b6b` | Rubrik, telefonnummer |
| `--akut-lank` | `#6bb8ff` | Länk i rutininnehåll |

Kontrasten är **mätt**, inte bedömd, och reproducerad 2026-08-22:

| Par | Uppmätt |
|---|---|
| text mot bakgrund | 21,0:1 |
| larm mot bakgrund | 7,6:1 |
| länk mot bakgrund | 9,9:1 |
| text mot panel | 17,4:1 |

Samtliga klarar AA (4,5) med god marginal, vilket är meningen i ett läge som ska gå att läsa i
starkt solljus. Typografin är dessutom större genomgående (bas 1,15rem, `h1` 2rem, nummerrad
1,3rem) och tryckytorna minst 48 × 48 px.

### Kameravyn (`src/components/SkannaModal.css`)

`--skanna-bakgrund: #000` och `--skanna-hjalplinje: #ffffff`. En sökarruta ska ha maximal
kontrast mot **bilden**, inte mot appen.

### Regeln för nya undantag

Genomgående krav 31: inget nytt hårdkodat hexvärde i komponent-CSS. Alla färger går via en
token i `index.css`. Ett undantag kräver en kommentar på plats som förklarar varför
tokenvägen inte fungerar – precis som de två ovan gör. I dag finns exakt sju hexträffar i
`src/**/*.css` utanför `index.css`: fem i `Akutlage.css`, en i `SkannaModal.css` och en i en
förklarande kommentar i `TemaVaxlare.css`. Den siffran ska inte växa utan skäl.

---

## 8. Kända avvikelser och luckor

Ärlighet om luckor är hela poängen – ett dokument som beskriver ett system som inte finns är
farligare än inget dokument alls. Följande är verifierat 2026-08-22 och **inte åtgärdat** av
den här filen (den rör bara sig själv):

| Vad | Var | Anmärkning |
|---|---|---|
| `theme_color` i PWA-manifestet är `#1d4ed8` | `vite.config.js`, `manifest.theme_color` | Den gamla primärmörka. `index.html` uppdaterades till `#274eaf` i Etapp 68b, manifestet följde inte med |
| `background_color` i manifestet är `#ffffff` | `vite.config.js`, `manifest.background_color` | `--bg` är `#f5f9fa`. Skillnaden syns i splash-bilden |
| En kommentar i `index.css` uppger `--primar-mork (#1d4ed8, 7,0:1 mot vitt)` | `src/index.css`, kommentaren ovanför `.auth-form input:focus` | Stale efter 68b. Värdet är `#274eaf`, 7,51:1. Beskrivningen av *principen* stämmer fortfarande |
| Radieskalan följs inte i praktiken | Hela `src/**/*.css` | `border-radius` förekommer 156 gånger; 23 går via `--radius`/`--radius-liten` och 15 är avsedda 999px-piller. Återstoden är råa värden: `8px` 59 gånger, `12px` 17, `10px` 16, `6px` 12, dessutom 3px, 4px, 5px, 16px och 50 %. Etapp 68a migrerade **färger**, inte radier |
| Mörkt läge finns i två identiska kopior | `src/index.css`: `:root[data-tema="dark"]` och `@media (prefers-color-scheme: dark)`-blocket strax under | Kontrastvakten läser bara `:root[data-tema="dark"]`-blocket. En drift mellan kopiorna fångas alltså **inte** av testet. Ändra alltid båda, i samma commit. Samma sak gäller varje accents tre regler |
| Ordmärket är inte ritat | — | `produkt/VARUMARKE.md` §12 |
| Ingen har sett symbolen utan att veta vad den föreställer | — | `produkt/VARUMARKE.md` §12. Ingen mätning finns |
| `symbol.svg` / `symbol-axon.svg` refereras inte från appen | `src/`, `index.html` | De är avsedda för webbplats, presentationer och tryck. Appen använder `favicon.svg` och `icon.svg`. Det är inte ett fel, men det betyder att ingen bygg-/testväg upptäcker om de går sönder |

---

## 9. Underhållsregel

Samma händelsestyrda princip som gäller `CLAUDE_STATUS.md`, `OPPNA-PUNKTER.md`, `saljmaterial/PITCH.md`
och incidentdokumenten – och av samma skäl. "Kom ihåg att uppdatera" har bevisligen
misslyckats i det här projektet: `granskningar/SAKERHETSRAPPORT.md` låg 51 releaser efter verkligheten,
`saljmaterial/PITCH.md` 48, `produkt/FRAMTIDSPLAN.md`/`produkt/MODULPLAN.md` 38–43. Varje gång har lösningen varit
densamma och den har fungerat: gör regeln händelsestyrd, inte minnesstyrd.

**Uppdatera `produkt/GRAFISK-PROFIL.md` i SAMMA commit** när något av följande inträffar:

| Om du … | Uppdatera |
|---|---|
| Lägger till, tar bort eller ändrar värdet på en token i `src/index.css` | Rätt tabell i avsnitt 1 – **och** skriv in den uppmätta kontrasten mot dess bakgrund (krav 30) |
| Lägger till en femte accent | Accenttabellen i avsnitt 1, och `ACCENTER` i `tests/docs/kontrastpalett.test.js` (testet failar annars, med avsikt) |
| Lägger till, tar bort eller ändrar ett par i kontrastvakten | Partabellen i avsnitt 3 |
| Ändrar radieskalan eller skuggorna | Avsnitt 5, med skälet – inte bara det nya värdet |
| Ritar om symbolen, någon variant av den, eller ändrar storleksgränsen 48 px | Avsnitt 6, med efterräknad geometri. Kontrollera samtidigt att `produkt/VARUMARKE.md` §12 fortfarande stämmer |
| Byter typsnitt, lägger till en vikt, eller kör om delmängdningen | Avsnitt 4 – med **uppmätt** överföringsvikt per fil (`stat -c%s`), inte en uppskattning. Receptet självt hör hemma i `src/index.css`, inte här |
| Lägger till ett hårdkodat hexvärde utanför `index.css` | Avsnitt 7, med motiveringen – eller låt bli att lägga till det |
| Löser eller upptäcker en punkt i avsnitt 8 | Ta bort respektive lägg till raden |

Ytterligare krav:

- **Skriv aldrig in ett värde du inte läst ur en fil.** Den här filen kom till för att koden
  och dokumentationen sa olika saker om varumärkesblå (`index.css` Etapp 68b-kommentaren, och
  `etapplaner/ETAPPLAN17.md` 68b: *"dokumentet och koden säger olika saker, och dokumentet råkar ha den
  bättre färgen"*). Det får inte hända igen åt andra hållet.
- **Går den här filen och `produkt/VARUMARKE.md` §12 isär, gäller koden.** Rätta båda.
- **Höj aldrig ett kontrastkrav för att få ett test grönt.** Se avsnitt 3.
