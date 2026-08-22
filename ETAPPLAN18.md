# Etapplan 18 – Appen på en datorskärm

**Etapp 69. ANTAGEN 2026-08-22** (se `BESLUTSLOGG.md`). Bygger på en genomgång av UI-lagret i
v5.121.0 (75 CSS-filer, 28 sidor) och på skissen i artefakten "Synappsen på dator".

> **Vid antagandet tillkom delmål 69h** på ägarens begäran: inloggningssidan görs om helt.
> Alla tre beslutspunkter avgjordes samtidigt, enligt rekommendationerna — brytpunkt **1024 px**,
> **fast** sidomeny, akutläget **orört**.

> **Vad den här planen är:** att ge appen en datorlayout, plus fyra defekter som genomgången
> hittade på vägen och som inte har med skärmbredd att göra.
>
> **Vad den inte är:** en andra app. Ett bygge, en service worker, ett deploy. Skärmbredd
> avgör layouten, inte användaragent — en iPad rapporterar sig som dator, och en surfplatta i
> liggande läge är genuint tvetydig.

---

## Premisskontroll (genomgående krav 8)

Åtta antaganden kontrollerade mot faktisk kod innan planen skrevs. Fem höll, tre ändrade
innehållet — varav ett tog bort ett helt delmål och ett annat lade till ett.

### Höll

| Antagande | Verifierat |
|---|---|
| Appen saknar breddbaserade brytpunkter | **Noll.** De tio `@media`-reglerna i hela `src/` är utskrift (4), mörkt läge (4) och reducerad rörelse (2) |
| `.app-innehall` saknar maxbredd | Stämmer — `src/index.css` sätter bara `flex: 1` och `padding-bottom` |
| `BottomNav` renderas ovillkorat | Stämmer — `App.jsx` rad 90, 324, 339 och 354, ingen breddkontroll |
| Det finns ingen topnav eller sidomeny att bygga vidare på | Stämmer — `BottomNav` och `MerMeny` är projektets enda navigeringskomponenter |
| Appen anpassar sig ändå något | `flex-wrap: wrap` på 47 ställen, `auto-fit`-grid på 2. Det räcker för att inget ska gå sönder, inte för att bli en datorvy |

### Ändrade planen

**1. Fokusmarkeringen på listposter är trasig — och det har inget med skärmbredd att göra.**
Tre komponenter sätter `outline: none` på fokus och ersätter ringen med *enbart* ett
bakgrundsbyte:

```css
.sok-falt__resultat li button:hover,
.sok-falt__resultat li button:focus-visible {
  background: var(--primar-ljus);
  outline: none;
}
```

Mätt med `src/utils/kontrast.js`:

| Komponent | Fokusfärg mot yta | Ljust | Mörkt |
|---|---|---|---|
| `SokFalt` sökresultat | `--primar-ljus` mot `--yta` | **1,10:1** | **1,14:1** |
| `KommandopalettInnehall` | `--primar-ljus` mot `--yta` | **1,10:1** | **1,14:1** |
| `Notisklocka` | `--bg` mot `--yta` | **1,06:1** | **1,08:1** |

WCAG 1.4.11 kräver 3:1 av en fokusindikator. Tangentbordsfokus är alltså i praktiken osynligt
på appens tre mest tangentbordsdrivna ytor. Det värsta är att `src/index.css` **redan
dokumenterar exakt den här defekten** för `.auth-form input:focus` och löste den där 2026-08:
*"#eff6ff mot vit fältbakgrund är ca 1,06:1, alltså långt under de 3:1 WCAG 1.4.11 kräver av
en fokusindikator."* Rättningen spreds aldrig till listorna. Nytt delmål **69e**.

**Varför axe-svepet inte fångade det:** axe kan konstatera att en fokusindikator *finns*, inte
att den är tillräcklig. Det är en känd begränsning, inte ett fel i testet.

**2. Fälten är däremot HELT OK.** Antagandet inför genomgången var att `outline: none`
generellt var ett problem. De fem förekomsterna delar sig i två grupper: de två på `<input>`
ersätter ringen med `border-color: var(--primar)`, vilket mäter **5,63:1 ljust och 4,87:1
mörkt**. Inget att göra där. Delmålet krympte från "alla fokusmarkeringar" till bara listorna.

**3. De kvarvarande hårdkodade hexvärdena är inte skräp, och ska inte städas.** Genomgången
hittade 10 stycken i 4 filer. Var och en är avsiktlig och dokumenterad: skannerns overlay
(`SkannaModal.css`), utskriftsstilar som inte får följa temat (`HyllEtiketter.css`),
akutlägets medvetet fasta högkontrastfärger (`Akutlage.css`), och en som ligger *inuti en
kommentar*. Genomgående krav 31 är alltså redan uppfyllt. **Det planerade städdelmålet ströks.**

---

## Mätningar som planen vilar på

Alla siffror räknade i v5.121.0, inte uppskattade.

| Vad | Läge |
|---|---|
| Breddbaserade brytpunkter | **0** |
| `border-radius`-deklarationer | **156**, varav 23 via `var(--radius*)` och 15 pillrets `999px` → **118 hårdkodade** |
| `z-index`-deklarationer | **24**, med **10 olika värden** mellan 5 och 1000, utan skala |
| Mörkt läge | Underhålls i **två handhållna kopior** (`:root[data-tema="dark"]` och `@media`-blocket). Verifierat 2026-08-22: identiska idag, 29 tokens vardera |
| Kontrastvakten läser | **Bara den ena** kopian (`tokensUr(':root[data-tema="dark"]')`) |
| E2E-svepet kör vid | **En enda bredd** — `devices["Desktop Chrome"]`, 1280×720 |
| Skrollhantering vid ruttbyte | **Ingen.** Endast två `scrollIntoView` för djuplänkning |
| Tabeller | 6 stycken, 6 `overflow-x: auto` — ser rätt ut |
| Hårdkodade hex utanför `index.css` | 10 i 4 filer, **samtliga befogade** (se premisskontrollen) |

---

## Genomgående krav

Fortsätter numreringen från `ETAPPLAN17.md` (krav 30–32).

**33. Varje layoutändring verifieras RENDERAD vid båda bredderna, inte bara mätt.**
Etapp 68 gav tre exempel på att en uträknad layout kan vara fel på ett sätt bara ögat ser:
logotypen behövde fyra försök, `symbol.svg` renderade som trasig bild, och en färgdärivering
gjorde kontrasten sämre än den var. En brytpunkt som bara är beräknad är samma sorts påstående.

**34. Bottenraden och sidomenyn får ALDRIG visas samtidigt.** De är samma navigering i två
skepnader. Två samtidiga huvudnavigeringar är både förvirrande och ett WCAG-problem
(2.4.1 Bypass Blocks får två konkurrerande landmärken). Ett test ska bevisa det, inte en
kommentar som ber någon komma ihåg.

**35. Ingen `outline: none` utan en uppmätt ersättning på minst 3:1.** Skriv siffran i
CSS-kommentaren, som krav 30 redan kräver för färger.

---

## Delmål

### 69a. Brytpunkter och z-index som tokens (förarbete, ingen synlig ändring)

Två skalor saknas, och båda behövs innan sidomenyn byggs.

**Brytpunkter.** Custom properties går inte att använda i `@media`-villkor — det är en
begränsning i CSS, inte ett designval. Skalan blir därför en dokumenterad konstant med
`@custom-media`-liknande kommentar överst i `index.css`, plus en enda `--sidomeny-bredd` som
token för det som *går* att tokenisera.

**z-index.** 24 deklarationer med 10 lösa värden mellan 5 och 1000 är inte en skala, det är
tio gånger någon gissade. Sidomenyn lägger till ett lager till, och en overlay ovanpå den.
Ersätts av namngivna tokens (`--z-nav`, `--z-panel`, `--z-modal`, `--z-toast`).

**Klart när:** inga nya värden i komponent-CSS, `npm run build` oförändrad utdata bortsett
från variabelnamn, och en renderad jämförelse före/efter som visar ingen synlig skillnad.

---

### 69b. Läsbar radlängd

`.app-innehall` får en maxbredd och centreras. Löpande text får en **snävare** egen spalt än
korten — det är prosan som blir oläslig av långa rader, inte ett kortrutnät. På en 1440-skärm
är rutinbrödtexten idag omkring 150 tecken bred; 50–75 är den vanliga rekommendationen.

**Klart när:** radlängden är uppmätt i renderad vy vid 1440 px och ligger under 80 tecken för
löpande text, och kortrutnätet fortfarande får använda hela ytan.

---

### 69c. Sidomeny över brytpunkten

Den största delen. `BottomNav` behålls oförändrad under brytpunkten; över den ersätts den av
en sidomeny där allt syns samtidigt — de sex sidor som idag ligger bakom "Mer" inkluderade.

Kräver en `useMediaQuery`-hook (finns inte; `matchMedia` används idag bara för
PWA-installation och iOS-detektering i `messaging.js` och `useInstallBanner.js`).

**Klart när:** krav 34 är bevisat med ett test, `MerMeny` inte går att nå över brytpunkten,
tangentbordsnavigering fungerar i båda lägena, och axe är rent vid båda bredderna.

---

### 69d. Vyer som använder bredden

Kortrutnät från två till tre eller fyra kolumner, sökfältet permanent synligt i stället för
bakom en knapp, och en genomgång av de vyer som lider mest av full bredd. `Admin.css` (12
`--kant`-användningar) och `Leverantor.css` är de tyngsta och tas först.

**Klart när:** de fem mest använda vyerna är renderade och granskade vid 1440 px, och ingen av
dem har en rad löpande text över 80 tecken.

---

### 69e. Fokusmarkering på listposter (fristående defekt)

Se premisskontrollens fynd 1. `SokFalt`, `KommandopalettInnehall` och `Notisklocka` får en
fokusindikator som faktiskt syns — samma lösning som `.auth-form input:focus` redan använder.

**Detta delmål är oberoende av resten av planen och kan byggas först.** Det rättar en
WCAG-defekt som finns i produktion idag och drabbar den som navigerar med tangentbord, vilket
inkluderar skärmläsaranvändare.

**Klart när:** varje ändrad fokusmarkering är uppmätt till minst 3:1 i båda teman och alla
fyra accenter, siffran står i koden (krav 30 och 35), och ett test i `tests/docs/` bevakar
paren på samma sätt som `kontrastpalett.test.js`.

---

### 69f. Skrolla till toppen vid ruttbyte (fristående defekt)

Appen återställer inte skrollpositionen när man byter sida. Går man långt ner i en lista i
Kliniskt stöd och öppnar en rutin, öppnas rutinen mitt i texten. React Router gör det inte
automatiskt, och ingen komponent i projektet gör det heller — verifierat.

Undantag: djuplänkning (`/kliniskt-stod#rutin-{id}`) ska fortsätta fungera, liksom
webbläsarens bakåtknapp, som ska återställa den gamla positionen och inte skrolla till toppen.

**Klart när:** ett e2e-test bevisar båda beteendena — framåtnavigering börjar överst,
bakåtnavigering återvänder till samma position.

---

### 69g. Testsvepet vid två bredder, och en vakt mot temadrift

Två luckor i kvalitetsmaskineriet som blir värre av den här etappen, inte bättre.

**Bredden.** Hela e2e-svepet — rökprov och axe över 25 routes i sju roller — kör idag vid
`devices["Desktop Chrome"]`, alltså 1280×720. Mobillayouten testas alltså aldrig automatiskt.
Efter 69c testar en enda bredd bara *en av två* layouter. Svepet ska köras vid både en mobil-
och en datorbredd.

**Temat — tillagt 2026-08-22 under bygget av 69h.** Samma lucka finns i en andra dimension, och
den visade sig kosta mer: Playwrights standard är `colorScheme: 'light'`, och specen sätter inget
annat. **Mörkt läge testas alltså inte alls av axe.** Det är förklaringen till att en
app-övergripande kontrastdefekt kunde ligga kvar (se 69h): appen saknade helt en global länkfärg,
72 länkar föll tillbaka på webbläsarens `#0000EE`, och det mäter 9,40:1 mot vitt men **1,90–2,06:1**
i mörkt läge. I ljust läge var defekten osynlig. Svepet ska alltså köras i fyra kombinationer:
två bredder × två teman.

**Temadrift.** Mörkt läge underhålls i två handhållna kopior, och kontrastvakten läser bara den
ena. De är identiska idag (verifierat), men en framtida ändring i bara den ena skulle passera
oupptäckt — och kontrastvakten skulle rapportera grönt. Ett test som jämför blocken token för
token. Samma "händelsestyrd, inte minnesstyrd"-princip som resten av projektet.

**Klart när:** svepet kör vid två bredder utan att bli mer än ungefär dubbelt så långsamt, och
drifttestet failar om man ändrar ett värde i bara det ena mörka blocket (bevisa det genom att
prova).

---

### 69h. Inloggningssidan görs om ✅ KLAR 2026-08-22

Tillkom vid antagandet. Ägarens beskrivning: *"bara textfält med mörk bakgrund"*.

**Vad som faktiskt finns idag** (verifierat): `LoggaIn.jsx` och `Registrera.jsx` renderar båda
`<main className="sida sida--auth">` — ett 380 px brett kort med `--yta` som bakgrund, en `h1`,
en undertext, två fält, en knapp och en länk. Det är inte mörkt i sig; i mörkt läge ligger
kortet på `--bg` `#0a0e16`, och då *läser* det som fält på svart. Funktionellt, men utan
avsändare: inget märke, ingen symbol, ingenting som säger vilket system man loggar in i.

**Varför det hör hemma i den här etappen och inte i en egen:** den nya formgivningen ÄR en
responsiv layout — delad vy över brytpunkten, enkel centrerad vy under. Samma 1024 px som 69c.

**Varumärkesramar som gäller** (ur `VARUMARKE.md` §5, §12 och §13):

- **Behärskad.** Inga utropstecken, inga superlativ, ingen brådska. Men behärskad är inte
  anonym — sidan får ha en åsikt.
- **Aldrig neurala nätverk, noder eller hjärnor.** §12 noterar att två av tre logotypförslag
  från en bildmodell blev nätverksgrafer, så dragningen måste motstås aktivt.
- **Aldrig bilder på vårdpersonal.** Stockfoto på vårdpersonal står som punkt 6 på listan över
  vad som skulle skada varumärket.
- **Inga nyttosiffror.** Punkt 1 på samma lista: en siffra utan täckning river hela positionen.
  En inloggningssida är ingen plats för påståenden som inte går att belägga.
- Symbolen är den enda visuella tillgång som faktiskt finns och är genomtänkt — den ska bära.

**Utförande:** ett gemensamt `AuthSkal` som båda sidorna använder, så att de inte kan glida
isär (idag är de två separata filer med samma klassnamn). Panelen behöver **egna scoped
tokens** av samma skäl som akutläget har det: `--primar-mork` är en mörk blå i ljust läge men
en *ljus* blå i mörkt, och duger därför inte som panelbakgrund i båda teman.

**Klart när:** båda sidorna renderade och granskade i ljust och mörkt läge vid både 390 px och
1440 px (krav 33), varje ny färg uppmätt och siffran inskriven (krav 30), fokusordningen
oförändrad, `h1` och `id="huvudinnehall"` kvar för hopplänken, och axe rent.

**✅ KLAR 2026-08-22.** Byggd som ett gemensamt `AuthSkal` (`src/components/AuthSkal.jsx`
+ `.css`) som både `LoggaIn` och `Registrera` använder. Panelen har egna scoped tokens,
uppmätta: `#1e3a8a` ljust (vit text 10,36:1, dämpad 5,49:1) och `#101a2e` mörkt (17,37:1 /
9,21:1). `.sida--auth` i `index.css` är borttagen som död kod.

**Att granska den renderat gav fyra defekter som ALLA fanns före 69h**, och tre av dem drabbade
hela appen, inte bara inloggningen:

| # | Defekt | Omfattning | Uppmätt |
|---|---|---|---|
| 1 | `a` saknade global färg – 72 länkar föll tillbaka på webbläsarens `#0000EE` | **Hela appen** | 9,40:1 ljust, **1,90–2,06:1 mörkt** |
| 2 | `color-scheme` deklarerades ingenstans, så webbläsaren renderade sina kontroller i ljust läge oavsett tema | **Hela appen** | — |
| 3 | `.auth-form input` saknade `background`/`color` → vita fält i mörkt läge | Auth-sidorna | — |
| 4 | `.hoppa-till-innehall` låg på `top: -40px`, men länken är högre → nederkanten syntes i övre vänstra hörnet | **Hela appen** | — |

Defekt 1 och 2 är samma rot: ingenting berättade för webbläsaren vilket tema som gällde. Båda
rättade — `color-scheme` per temablock och `a { color: var(--primar) }`, vilket ger 5,63:1 ljust
och 4,87–5,25:1 mörkt.

Ingen av dem hade kunnat fångas av det befintliga svepet, eftersom det inte kör i mörkt läge.
Därav tillägget i 69g.

---

## Beslutspunkter — AVGJORDA 2026-08-22

**1. Var går brytpunkten?** → **1024 px.** Rekommendationen följdes. Under den ligger surfplattor i stående läge och alla telefoner —
de har inte plats för en 232 px sidomeny utan att innehållet blir trängre än idag. Över den
ligger surfplattor i liggande läge och alla datorer. Det är ett värde att välja *en* gång;
byter man det senare får varje delmål granskas om.

**2. Ska sidomenyn gå att fälla ihop?** → **Nej**, inte i den här etappen. En hopfällbar meny betyder ett sparat läge per
användare, ett till tillstånd att testa i sju roller, och en till sak som kan hamna i otakt
mellan enheter. Bygg den fast först och se om någon faktiskt ber om det.

**3. Vad ska hända med Akutläge på en datorskärm?** → **Lämnas orört.**
Akutläget har medvetet egna, fasta högkontrastfärger utanför temasystemet, byggt för en telefon
i handsken. Rekommendation: **lämna det orört i den här etappen** och lägg till en rad i
`GRAFISK-PROFIL.md` om att det är ett avsiktligt undantag även från brytpunkterna. Att designa
om ett akutgränssnitt är inte en delmängd av en layoutetapp.

---

## Vad jag INTE föreslår

**Radieskalan.** 118 av 156 `border-radius` är hårdkodade. Det ser ut som ett självklart
städjobb men är det inte: det är 118 ändringar med synlig risk, noll användarnytta, och
`ETAPPLAN17.md`s beslutspunkt 3 avgjorde redan att appens tvåstegsskala är rätt. Att tokenisera
befintliga värden är ett annat arbete än att välja skala. Ta det den dag en komponent faktiskt
ritas om, inte som ett svep.

**Två separata byggen med enhetsdetektering.** Se planens ingress. Dubblar underhållet för 75
CSS-filer, bygger på en användaragent som ljuger, och ger service workern två skal att hålla
isär.

**En komponentbibliotekskatalog (Storybook e.d.).** Frestande när man ändå går igenom UI-lagret.
Men det är ett eget verktyg att underhålla, och projektet har redan en fungerande väg att se
komponenter renderade: e2e-svepet med riktiga roller och riktig data. Lägg krutet på att köra
det vid två bredder i stället (69g).

**Tomma tillstånd på alla sidor.** 8 av 28 sidor använder `.platshallare`. Resten kan mycket väl
ha rätt i att inte behöva ett — en genomgång kräver att man vet vilka som *kan* vara tomma i
praktiken, och det vet inte jag utan en riktig datamängd. Hör hemma efter piloten
(`ETAPPLAN10.md` Etapp 52), inte före.

---

## Beroendeordning

```
69e  fokusmarkering ──┐  (fristående, kan byggas först — rättar en defekt i produktion)
69f  skrollning ──────┤
                      │
69h  inloggningen ─┘  (fristående layout, delar bara brytpunktsvärdet)

69a  tokens ──> 69b  radlängd ──> 69c  sidomeny ──> 69d  vyerna
                                        │
                                        └──> 69g  testsvep vid två bredder
```

## Uppskattad arbetsinsats

| Delmål | Storlek | Största risken |
|---|---|---|
| 69a | Litet | z-index-bytet kan ge en osynlig stackningsbugg — därav renderad jämförelse |
| 69b | Litet | Ingen |
| 69c | **Stort** | Två navigeringar som råkar visas samtidigt (krav 34) |
| 69d | Medel | 28 sidor, men långt ifrån alla behöver ändras |
| 69e | Litet | Ingen — mönstret finns redan i `index.css` |
| 69f | Litet | Att bakåtknappen slutar återställa positionen |
| 69g | Medel | Svepets körtid |
| 69h | Medel | Att panelen bara fungerar i ett av två teman — därav egna scoped tokens |
