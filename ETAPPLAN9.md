# Etapplan 9 – Kvalitetsmaskineriet riktas utåt

**✅ ANTAGEN 2026-08-04.** Utgångsläge v5.73.0, direkt efter att `ETAPPLAN8.md` Etapp 44
(mobilappskänsla) blev klar och deployad. **Detta är den AKTIVA planen för nytt arbete.**
`ETAPPLAN8.md`s köade Etapp B/C (se dess egen fil) skjuts EN etapp längre bak, med en
omprioritering (se Beslut 1 nedan) – inget annat i produktionsköns ordning ändras.

> **Bakgrund:** en extern skriftlig granskning (2026-08-04, se den bifogade PDF:en, inte
> incheckad i repot) gick igenom hela dokumentationen (`CLAUDE.md`, `CLAUDE_STATUS.md`,
> samtliga `ETAPPLANx.md`, `UTVECKLINGSLOGG.md`, `SAKERHETSRAPPORT.md`,
> `TILLGANGLIGHETSREDOGORELSE.md`, `MODULPLAN.md`, `FRAMTIDSPLAN.md`, `INCIDENT-CHECKLISTA.md`,
> `avtal/`, `PITCH.md`) utan kodgranskning. Slutsatsen var att dokumentationens **kvalitets-
> maskineri** (premisskontroll, händelsestyrda underhållsregler, ärlig statusrapportering) är
> ovanligt bra – men **enbart riktat inåt, mot vad Claude Code läser.** De dokument som möter
> en KUND eller MYNDIGHET (`PITCH.md`, `TILLGANGLIGHETSREDOGORELSE.md`) har inte fått samma
> skydd och har läckt precis det granskningen visar: `PITCH.md` stod kvar på "Version 5.25.0"
> när produkten redan var på v5.73.0 – **48 releaser efter.** Den här etappen appliceras
> samma strukturella lösningsmönster som redan använts internt (jfr `src/version.js`,
> `FRAMTIDSPLAN.md`s rollbyte) på de utåtriktade dokumenten, plus tre konkreta luckor
> granskningen hittade i produkten självt (ingen rökprovssvit, ingen tillgänglighets-
> granskning sedan UI-förnyelsen, fem människoberoende punkter utan egen synlighet).

---

## Granskningens fynd, verifierade innan planen antogs (genomgående krav 8)

Tre av granskningens mest konkreta sakpåståenden kontrollerades direkt mot koden/dokumenten
innan den här planen skrevs, istället för att tas för givna:

| Påstående | Verifierat |
|---|---|
| `PITCH.md` står kvar på "Version 5.25.0" | ✅ **Bekräftat, och värre än granskningen hann visa.** Granskningen gjordes mot v5.72.0 (glapp: 47 releaser). Vid planens antagande (v5.73.0) är glappet 48. |
| `TILLGANGLIGHETSREDOGORELSE.md` har en aktiv `[FYLL I: datum]`-platshållare | ✅ Bekräftat, rad 102, plus två till (leverantörens juridiska namn, e-postadress). |
| `INCIDENT-CHECKLISTA.md`s kontakttabell är till största delen tom | ⚠️ **Delvis.** 2 av 5 rader ifyllda (jourkontakt, IMY), inte "en femtedel" som granskningen skrev utan närmare två femtedelar – men slutsatsen (tre viktiga kontakter saknas) håller. |

**Slutsats:** granskningens sakuppgifter håller vid stickprov. Den byggs vidare på som
korrekt underlag, med den enda justeringen ovan (kontakttabellens exakta andel).

---

## Etapp 45 – Kvalitetsmaskineriet riktas utåt

**Varför:** samma "hittar fel i sig själv"-disciplin som redan skyddar `version.js`,
`FRAMTIDSPLAN.md` och `CLAUDE_STATUS.md` mot att glida saknas för de dokument och den
produktkvalitet en KUND eller en MYNDIGHETSGRANSKNING faktiskt möter. Etappen är uteslutande
strukturell (test som förhindrar återfall) plus två avgränsade engångsinsatser (innehålls-
ikapp, tillgänglighetsgranskning) – inget nytt funktionsarbete.

- **45a – ✅ KLAR (2026-08-04): `PITCH.md` kan inte längre glida obemärkt.**
  - **45a-i (struktur, görs FÖRST):** ett nytt vitest-test (`src/data/pitch-version.test.js`
    eller motsvarande) som failar om `PITCH.md`s versionsrubrik ligger mer än ett bestämt
    antal minorversioner efter `package.json`s (t.ex. 10) – samma "kan inte återkomma"-princip
    som redan löste `version.js`-problemet, applicerad på ett dokument istället för kod. Ska
    INTE tvinga en omskrivning vid varje patch, bara göra 48-releasers-glidningen omöjlig.
  - **45a-ii (innehåll, engångsinsats):** skriv om `PITCH.md`s funktionslista så den täcker
    Etapp 22–43 (innehållshälsa, granskningsrundor, samlad godkännandekö, effektmätning över
    tid, personalpuls, referensunderlag, arkiverad status, hela gränssnittsförnyelsen).
    **Behåll den ärliga tonen** befintliga `PITCH.md` redan har (13e rättade tidigare ett
    sakfel om klinikstöd snarare än att smeta över det) – effektsiffror ska fortsatt vara
    uttryckligen märkta som uppskattningar utan pilotdata bakom sig (se Etapp 45f/`ETAPPLAN9`s
    öppna-punkter-koppling: ingen kund finns ännu).
- **45b – ✅ KLAR (2026-08-04): Rökprovssvit: varje route, varje roll.** En ny Playwright-testsvit
  (`tests/e2e/rokprov.spec.js`, tillagd i `test:e2e`) som laddar samtliga ~27 routes i
  `App.jsx` för var och en av de sex rollerna (superadmin, VÖL/sektionsledare, VEC,
  förrådsansvarig, personal, leverantörsadmin – filtrerat per vad respektive roll faktiskt kan
  nå) och kontrollerar tre saker per sida: sidan renderar, ingen `ErrorBoundary`-krasch, inga
  konsolfel. **Motivering:** samma enkla mekanism hade fångat tre av projektets fyra mest
  citerade defekter (Etapp 31b:s tomma listor för `personal`, Korvy-knappens flex-läckage,
  Leverantörsvyns null-krasch) – alla tre hittades hittills bara genom manuell, punktvis
  granskning. Bygg som en datadriven loop över en rollmatris, ingen ny arkitektur.
- **45c – ✅ KLAR (2026-08-04): Tillgänglighetsgranskning efter hela gränssnittsförnyelsen.** Föregående granskning
  (bakom `TILLGANGLIGHETSREDOGORELSE.md`s nuvarande innehåll) gjordes 2026-07-26, mot fem
  flöden, INNAN Etapp 42/43 byggde om navigeringen (Mer-meny, flytande Akut-knapp), lade till
  `/godkannanden`, och gjorde adminpanelen till en hopfällbar accordion. Kör `axe-core` över
  samtliga 27 sidor (inte fem flöden), med särskild uppmärksamhet på: accordion-tillståndet
  (43c – kräver korrekt `aria-expanded`/fokushantering, native `<details>/<summary>` ger detta
  GRATIS men måste verifieras, inte antas), Mer-menyn (42f), den flytande Akut-knappens
  fokusordning (den ligger nu på i stort sett varje sida, inte bara Hem), `/godkannanden`, och
  `.sida--auth`-kortet (43a). **Komplettera med minst ETT test med en riktig
  skärmläsaranvändare** – dokumentet konstaterar redan självt att automatiserad testning
  fångar ungefär en tredjedel av tillgänglighetsproblemen, en brist som annars bara upprepas.
  Skriv om `TILLGANGLIGHETSREDOGORELSE.md` med resultatet. De tre `[FYLL I]`-fälten som INTE
  kan härledas ur kod (leverantörens juridiska namn, e-postadress, åtgärdsdatum) flyttas till
  `OPPNA-PUNKTER.md` istället för att lämnas som platshållare i ett dokument som delas externt.
- **45d – ✅ KLAR (2026-08-04): `OPPNA-PUNKTER.md`.** Se filen själv. Konsoliderar de fem
  människoberoende punkterna granskningen pekade ut (ToS-genomgång, Etapp 30b, 35e, 32b,
  incidentkontakttabellen) plus en sjätte (45f/"boka en riktig användare", se nedan) och tre
  äldre ägarbeslutspunkter (13f SSO, Etapp 16, Etapp 40) i EN tabell istället för statusblock
  spridda över fem `ETAPPLANx.md`-filer. **Ersätter** – inte kompletterar – granskningens
  eget delförslag om en egen "etapp" för dessa fem punkter (samma sak, mindre dokument-
  duplicering).
- **45e – ✅ KLAR (2026-08-04): Ändringsloggens ton vid rena UI-releaser.** v5.68.0–v5.72.0 var till stor del
  CSS-scoping/null-skydd/densitetsjusteringar – korrekta men tekniska rader
  ("flex-scoping-fix i Korvy") som säger lite till en medarbetare som läser `/nyheter`. Ny
  skriven konvention (kommentar i `src/data/andringslogg.js`s topp): vid en release som
  uteslutande är CSS/UI-polish utan ny funktion, led med EN sammanfattande, användarvänd rad
  ("Nytt utseende i hela appen – tätare listor, samlad godkännandekö, Akut-knappen alltid
  nåbar") istället för att bara lista tekniska delfixar. **Gäller framåt, ingen retroaktiv
  omskrivning** av redan publicerade poster – ändringsloggen är en logg, inte ett levande
  dokument som ska redigeras i efterhand.
- **45f – ✅ KLAR (2026-08-04): Beslutslogg.** Ny `BESLUTSLOGG.md`:
  datum/fråga/beslut/motivering/vad det låste upp, en rad per ägarbeslut FRAMÅT (inte en
  retroaktiv genomgång av alla historiska beslut i `CLAUDE_STATUS.md` – för stort för värdet).
  Löser att en fråga som redan avgjorts (t.ex. Etapp 36c, externt pentest: nej för nu) annars
  riskerar tas upp igen om tre månader utan att någon minns svaret.

**Explicit UTANFÖR den här etappen:** inget nytt funktionsarbete. Etapp 45 är uteslutande
kvalitets-/dokumentationsarbete – exakt den typ av arbete granskningen efterlyste FÖRE nästa
funktionsetapp.

### 45a ✅ KLAR (2026-08-04)

**45a-i (struktur):** ny `tests/docs/pitch-version.test.js` (vitest) – läser versionsnumret ur
`PITCH.md`s rubrik och `package.json`, failar om major skiljer sig ELLER om PITCH.md:s
minorversion ligger mer än 15 bakom. **Verifierat att testet faktiskt fångar det verkliga
felet innan fixen skrevs:** kört mot det ursprungliga läget (PITCH.md 5.25.0, package.json
5.73.0) gav ett rött test med felmeddelandet "48 minorversioner efter, gränsen är 15" – inte
bara en grön attrapp. Gränsen (15) är medvetet satt löst nog att inte tvinga en omskrivning
vid varje enskild patch, men tight nog att en 48-releasers-glidning omöjliggörs.

**45a-ii (innehåll):** `PITCH.md` omskriven för att täcka Etapp 22–43 (var tidigare stale
sedan 13e/v5.25.0). Tillagt: en samlad godkännandekö (42b), effektmätning över tid (39a/39b),
en ny sektion "Innehållet hålls vid liv" (innehållshälsa 37a, granskningsrundor 37b,
dubblettdetektion 37c, "Ni sa vi gjorde" 41a, arkiverad status 37d), revisionsloggens
hashkedja (fanns aldrig med, trots att den byggdes redan i Etapp 14 – ännu en lucka utöver de
granskningen själv hittade), mörkt läge och gränssnittsförnyelsen (Etapp 42+43), samt
installationsbarhet/kontrollerad uppdatering (Etapp 44). **Ny sektion "Ärlighet om vad som
faktiskt är mätt"** – skriven direkt som en respons på granskningens fynd #7 (mätningen mäter
en verksamhet som ännu inte finns): säger rakt ut att trendkurvor/personalpuls/effekt-
jämförelsen ännu inte har någon verklig kund bakom sig, och att minsta-n-spärren (fem
svarande) kan göra att en liten pilot inte visar någon personalpuls-siffra alls till en
början. Samma ärliga ton som redan fanns i dokumentet (13e:s rättelse om klinikstöd) –
förstärkt, inte mjukad upp.

**Ingen versionsbump.** Övervägdes (5.73.0 → 5.74.0) men reverterades: detta är en
dokumentations-/testförändring utan någon app-synlig skillnad – matchar det redan
etablerade mönstret (t.ex. Etapp 14b/14c) att inte bumpa version för ändringar utan
motsvarande deploybar yta. `PITCH.md`s versionsrad pekar på nuvarande `package.json`-version
(5.73.0) utan att den själv orsakade en ny release.

Fullt testsvep grönt (lint, build, vitest 124/124 – en ny). Inga rules-/storage-/
functions-ändringar. Committat och pushat.

### 45b ✅ KLAR (2026-08-04)

Ny `tests/e2e/rokprov.spec.js`, tillagd i `test:e2e`. Utökade `global-setup.mjs` med tre
tidigare saknade rollkonton (sektionsledare, vec, forradesansvarig) – bara superadmin/vol/
personal fanns seedade sedan Etapp 31b, vilket hade gjort "varje roll" till bara halva
löftet. Sex roller × 25 routes (23 statiska + 2 dynamiska: `/logistik/sterilforradet` med en
av de sex fasta förrådsslugsen, `/checklista/e2eRutinA` med den redan seedade rutinen) = 150
sidladdningar per körning, kontrollerar per sida: ingen `ErrorBoundary`-krasch, inga
konsolfel. **`plattformsadmin`-åtkomsten (styr `/leverantor`s serversidiga behörighet)
medvetet UTANFÖR sviten** – det är en egen Firestore-collection, inte ett rollfält, och
kräver en egen seedningsmekanism (noterat, inte tyst uteslutet).

**Två genuina tekniska hinder hittades och löstes under bygget, ingen av dem en app-bugg:**
1. **Playwrights standardtesttimeout (30s) räckte inte** för 25 sekventiella sidladdningar
   med `waitUntil: "networkidle"` – Firestores ihållande realtidslyssnare (websocket) kan
   hindra "networkidle" från att någonsin lösa upp sig. Löst med `waitUntil: "load"` + en kort
   explicit väntan, samt `test.setTimeout(120_000)`.
2. **`/leverantor` gav en förväntad konsolrad** (`ERR_CONNECTION_REFUSED` från
   `listaOrganisationer()`) eftersom `test:e2e` bara startar auth/firestore/storage-
   emulatorerna, inte functions – ett medvetet, redan existerande val för de två tidigare
   specfilerna. Sidan kraschade INTE (bekräftar att Etapp 43e:s `organisationer ?? []`-fix
   fungerar som avsett) – bara en nätverksnivå-logg. Filtrerad bort med en snävt route-
   specifik allowlist (`KANDA_MILJOBEGRANSNINGAR`), inte genom att göra hela sviten mindre
   strikt.

**Kört tre gånger under byggandet, inte bara en:** första körningen (utan timeout-fixen)
gav 6 av 9 tester "Test timeout exceeded". Andra körningen (med timeout-fixen men utan
allowlistningen) gav samma 6 fel, nu med rätt orsak synlig (`/leverantor`-konsolraden). Tredje
körningen: **9/9 gröna**, inklusive alla sex roller.

Ingen versionsbump (rent testarbete, ingen app-synlig skillnad – samma princip som 45a).
Fullt testsvep grönt (lint, build, vitest 124/124, test:e2e 9/9). Inga rules-/storage-/
functions-ändringar utöver `global-setup.mjs`s tre nya, harmlösa seedade konton. Committat
och pushat.

**Klart när:** `PITCH.md` inte kan glida mer än en bestämd gräns utan att ett test upptäcker
det, en rökprovssvit körs i `test:e2e` över alla routes/roller, tillgänglighetsredogörelsen
speglar den faktiska appen efter Etapp 42/43, och de människoberoende punkterna finns på ETT
ställe att läsa.

### 45c ✅ KLAR (2026-08-04)

Lade till `@axe-core/playwright` som nytt devDependency. Kördes först som en engångsskanning
(temporära skript, inte incheckade) mot alla 27 sidor som superadmin – **noll** överträdelser.
En andra körning som `personal`-rollen avslöjade tre YTTERLIGARE, roll-specifika brister
axe-scanningen mot superadmin inte kunde hitta (samma insikt som redan låg bakom 45b:s beslut
att testa flera roller, inte bara en) – ett konkret argument för att den permanenta sviten
(se nedan) kör mot flera roller, inte bara en representativ.

**Sex genuina, tidigare okända brister hittades och åtgärdades, samtliga uppkomna av eller
synliggjorda av Etapp 42–44** (fulla detaljer i `TILLGANGLIGHETSREDOGORELSE.md`s nya rader
#12–#17):
1. `/logga-in`/`/registrera` saknade `<main>`-landmärke helt (renderas utanför
   `SkyddatLayout`) – fixat.
2. Samma brist på `/akutlage` (`Akutlage.jsx`) och `/checklista/:rutinId` (`Korvy.jsx`) –
   båda medvetet utanför den vanliga layouten (inget nav i de lägena) men fick därför aldrig
   ett `<main>`. Bifynd: den globala "Hoppa till innehåll"-länken pekade mot ett id som inte
   fanns på just dessa sidor – fixat som en bonus.
3. Den flytande Akut-knappen (global sedan 42c) låg helt utanför alla landmärken – fixat med
   en namngiven `role="navigation"`-wrapper (ARIA tillåter INTE `role="navigation"` direkt på
   en `<a href>`, ett eget litet delfynd under bygget).
4. Två `<nav>`-landmärken (BottomNav, Hem:s snabblänksrad) utan unika namn – `aria-label`
   tillagt på båda.
5. **"Mer"-menyn (42f) påstod sig vara en modal dialog men saknade Esc/fokusfångst/
   fokusåterlämning** – den mest substantiella fixen. Exakt samma mönster som redan byggdes
   för bekräftelsedialogen i Etapp 13g (`DialogProvider.jsx`) återanvänt, bara aldrig
   applicerat på `MerMeny.jsx` när den byggdes.
6. Rubrikordning som hoppade `h1`→`h3`: förrådsartikelkort, Logistik:s förrådskort (när ingen
   `h2`-sektion rådde att rendera), och två sidor (`Kompetensmatris.jsx`, `Papperskorg.jsx`)
   som helt saknade `<h1>` i sitt tomma/nekade-läge för en `personal`-roll.

**Ny permanent regressionsspärr:** `tests/e2e/tillganglighet.spec.js`, tillagd i `test:e2e` –
kör axe-core mot samtliga 25 inloggade routes (`tests/e2e/rutter.mjs`, en ny delad fil som
även `rokprov.spec.js` nu importerar från, för att de två sviterna aldrig ska kunna driva isär
om en route ändras) för både superadmin och personal. **Noll överträdelser efter fixarna,
bekräftat i en riktig körning** (inte bara antaget) – 11/11 gröna i `test:e2e` totalt.

**Ett verifieringsfynd under bygget, inte en app-bugg:** en för kort väntan (500 ms) efter
navigering gav enstaka falska "page-has-heading-one"-träffar på Hem (lazy-laddad, hann inte
rendera klart innan axe-core kördes) – löst med en längre väntan (900 ms) i både
engångsskripten och den permanenta sviten.

`TILLGANGLIGHETSREDOGORELSE.md` omskriven: nya rader #12–#17 (alla redan åtgärdade), ny
beskrivning av den bredare 2026-08-04-granskningen, en ärlig ny sektion om vad som fortfarande
INTE är testat (riktig skärmläsare – oförändrat; interaktionsutlöst UI som modaler/bottensheets
skannas bara i STATISKT laddat läge, inte öppna – ny, ärlig nyans upptäckt under skrivandet).
Skärmläsartestning tillagd i `OPPNA-PUNKTER.md` som en egen rad.

Fullt testsvep grönt (lint, build, vitest 124/124, test:e2e 11/11). Version 5.73.0 →
**5.74.0** (första riktiga app-synliga fixen i Etapp 45, till skillnad från 45a/45b) –
`andringslogg.js` uppdaterad. Committat och pushat.

**Etapp 45a–45d är därmed klara.** Kvar: 45e (ändringsloggens ton vid rena UI-releaser) och
45f (beslutslogg), i den ordningen.

### 45e/45f ✅ KLARA (2026-08-04)

**45e:** en dokumenterad konvention (kommentar i `src/data/andringslogg.js`s topp), inget
annat – gäller framåt, ingen retroaktiv omskrivning av redan publicerade poster.

**45f:** ny `BESLUTSLOGG.md`, tom vid skapandet (byggs framåtriktat, se Beslut 3 ovan) med
format datum/fråga/beslut/motivering/vad det påverkade. Ny obligatorisk underhållsregel i
`CLAUDE.md` (samma händelsestyrda mönster som `OPPNA-PUNKTER.md`s egen regel) – en rad i
`OPPNA-PUNKTER.md` som blir ett beslut flyttas hit och tas bort därifrån.

Ingen versionsbump (ren dokumentation, ingen app-synlig skillnad – samma princip som 45a/45b).
Fullt testsvep grönt (lint, build, vitest 124/124).

**Med detta är hela Etapp 45 (45a–45f) klar.** Nästa steg enligt den beslutade ordningen
(Beslut 1): Etapp 46 (incidentberedskap i produkten), i `ETAPPLAN8.md`.

---

## Beslut 1 – Ordningen på `ETAPPLAN8.md`s köade Etapp B/C

Granskningens Del 3.H argumenterade för att byta plats på de två köade, ännu odetaljerade
etapperna i `ETAPPLAN8.md` ("B – sök/kunskapsupptäckt 2.0" och "C – incidentberedskap i
produkten"). **Beslut: byt.** Motiveringen håller vid granskning mot projektets eget
material – incidentberedskap har en dokumenterad 72-timmarsfrist i
`avtal/PUB-AVTAL-MALL.md` p. 8 bakom sig och `INCIDENT-CHECKLISTA.md`s statustabell har
fortfarande flera tomma rader (se `OPPNA-PUNKTER.md`), medan sök/kunskapsupptäckt förbättrar
något som redan fungerar. **Ny ordning: 45 (den här etappen) → C (nu Etapp 46,
incidentberedskap i produkten) → B (nu Etapp 47, sök/kunskapsupptäckt 2.0).**
`ETAPPLAN8.md`s "Kommande etapper"-sektion är uppdaterad i samma commit som denna fil.

## Beslut 2 – Deploy per avslutad etapp (bekräftad, inte ny)

Granskningens Del 3.G föreslog att deploya per avslutad etapp, inte per delmål (för ofta)
eller per plan (för sällan, som hände med v5.67.0→v5.72.0 i ett enda hopp över hela Etapp
42+43). Det är redan den avsedda normen (se `CLAUDE.md`s arbetsmönster) – v5.67→5.72-hoppet
var ett avsteg, inte en ny regel. Ingen ändring i `CLAUDE.md` behövs, bara en bekräftelse här:
**deploya när en etapp (inte ett enskilt delmål) är klar**, om inte användaren uttryckligen
ber om en tidigare deploy.

## Beslut 3 – Etapp 45f (beslutslogg) byggs framåtriktat, inte retroaktivt

Se 45f ovan. En fullständig genomgång av alla historiska beslut i `CLAUDE_STATUS.md` bedömdes
kosta mer än den ger – de finns redan där, kronologiskt, om än utspridda. `BESLUTSLOGG.md`
löser problemet för NYA beslut framåt.
