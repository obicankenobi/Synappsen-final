# Etapplan 12 – Från demo till drift: det som går sönder när någon faktiskt använder appen

*Utkast 2026-08-10, efter en genomgång av faktisk kod (inte dokumentation) i v5.91.0.*

> **Läs detta först.** De elva tidigare etapplanerna har byggt funktioner. Den här bygger
> nästan inga – två av sex etapper (62, 64) tillför något nytt, resten rättar och stärker det
> som redan finns. Den utgår från ett obekvämt konstaterande: **appen har aldrig mött en
> verklig datamängd, en verklig kund eller en verklig arbetsdag** – och den här genomgången
> hittade tre saker som redan är trasiga just nu, varav två infördes av de två senaste
> etapperna. Det är inte ett argument mot tempot hittills. Det är ett argument för att nästa
> etapp ska handla om hållfasthet snarare än om ännu en funktion – och för att den enda
> genuint nya produktidén som tillkommit under genomgången (Etapp 64) hanteras med samma
> försiktighet som allt annat nära en regulatorisk gräns i det här projektet.

---

## Vad som faktiskt finns i dag (nulägesbild)

Verifierat mot kod, inte mot planfilerna:

| Mått | Värde |
|---|---|
| Kodrader (`src/` + `functions/`) | ~26 000 |
| Sidor / komponenter / adminsektioner | 27 / 59 / 32 |
| Hooks / utils | 63 / 37 |
| Cloud Functions (exports) | 92, i **en** fil på 4 621 rader |
| `firestore.rules` | 916 rader, 40 collections |
| Tester | 130 vitest · 11 regelfiler · 32 functions-filer · 4 e2e-specar |
| Etapper genomförda | Etapp 1–58 över elva planfiler |

**Alla tre säljbara paket (Core, Operations, Intelligence) plus Källbevakning är byggda.**
`ETAPPLAN11.md` har bara två öppna punkter kvar, och båda väntar medvetet på en extern
förutsättning: 54c/54d (en konkret andra enhet hos en kund) och Etapp 58 (SSO, en kund som
kräver det). Ur ett rent funktionsperspektiv finns det inget uppenbart hål kvar att fylla.

**Det är just därför den här planen ser ut som den gör.** När funktionslistan är färdig är
den intressanta frågan inte "vad mer kan vi bygga" utan "vad håller inte när det används".

---

## Vad genomgången hittade

Fem fynd, alla verifierade mot kod. De tre första är fel som finns i produktionsgrenen just nu.

### 1. Sex rutiner per ny organisation som ingen kan nå (regression från Etapp 56a)

Etapp 56a utökade `functions/verksamhetsmallar.js` till att seeda rutiner i **alla tre
områdena** – tidigare bara `kliniskt-stod`. Sex av mallarna per verksamhetstyp har
`omrade: "logistik"`. Men:

- **Logistik-sidan visar inga rutiner.** `src/pages/Logistik.jsx` renderar förrådsartiklar
  (`SektionsKort` per förråd), inte en `Sektionssida` – till skillnad från `/kliniskt-stod`
  och `/administration`. Det finns ingen vy där en `omrade: "logistik"`-rutin kan läsas.
- **De är inte sökbara.** `useSokindex()` monterar `useRutiner("kliniskt-stod")` och
  `useRutiner("administration")` – inte `"logistik"`. Varken sökfältet eller
  kommandopaletten hittar dem.
- **De kan inte godkännas.** `useGodkannandeKo()` slår ihop samma två områden. En seedad
  logistikrutin med status `utkast` kan aldrig nå godkännandeknappen.
- **Men de räknas.** `InnehallshalsaSektion` och `Ledningsrapport` läser explicit
  `useRutiner("logistik")` och räknar in dem i hälsosiffran och kvitteringsgraden.

Nettoeffekten för en ny kund: sex osynliga rutiner som aldrig kan läsas, kvitteras eller
godkännas – men som drar ned hälsosiffran och syns i ledningsrapporten. Det är precis
motsatsen till vad Etapp 56 skulle åstadkomma, och det gör hälsosiffran missvisande från
dag ett.

### 2. Kioskläget gatas inte av sin egen modulflagga (lucka från Etapp 55a)

`FEATURE.KIOSK_MODE` finns i `src/config/features.js` och är listad under `operations` i
`PACKAGE_FEATURES`. **Ingen kodrad läser den.** Jämför `FEATURE.OFFLINE_CENTER`, som
kontrolleras i `OfflineCenter.jsx`.

Konsekvensen är dubbel. Affärsmässigt: kiosk-rollen går att skapa i en organisation som inte
betalar för Operations. Tekniskt allvarligare: `MODULPLAN.md` beskriver en **trelagersgating**
(UI → klient → server) som en byggd, testad disciplin med en egen gating-matris-testsvit
(`ETAPPLAN2.md` 7c). Etapp 55 byggde en hel funktion utan att följa den, och gating-matrisen
fångade det inte – vilket betyder att matrisen inte täcker nya funktioner automatiskt.

### 3. `dompurify` – XSS-saneraren – har en känd sårbarhet

`npm audit` rapporterar tio sårbarheter. Fördelningen spelar roll och bör inte
sammanfattas som "1 kritisk":

| Paket | Allvarlighet | Prod eller dev? | Bedömning |
|---|---|---|---|
| `dompurify` | moderate | **Produktion** | **Den enda som betyder något direkt.** Används i `MarkdownInnehall.jsx` för att sanera ALLT rutininnehåll. En saneringslucka är per definition relevant för en app vars redaktörer skriver markdown. |
| `react-router-dom` | high | Produktion | CVE:n gäller RSC-läge. Appen är en ren SPA med `BrowserRouter` – sannolikt inte exploaterbar, men bör uppdateras. |
| `tar` (via `firebase-tools`) | **critical** | Endast dev | Byggverktyg, når aldrig en användare. "Kritisk" i utskriften, låg i verkligheten. |
| Övriga sex | high/moderate | Endast dev | Samma sak. |

Dessutom: `CLAUDE.md`s återkommande säkerhetsgenomgång (Etapp 36b, punkt 4) säger att man ska
läsa igenom `npm-audit-rapport.md`. **Den filen finns inte i repot.** En checklista som pekar
på ett dokument som inte existerar blir en punkt man bockar av utan att göra något.

### 4. Appen hämtar hela innehållsdatabasen, varje gång

`useRutiner(omrade)` öppnar en `onSnapshot`-lyssnare utan `limit()`, utan paginering och utan
fältprojektion – hela dokumentet, inklusive `innehall` (full markdown), `steg`, `kviss` och
`externaKallor`. Mjukraderade och arkiverade rutiner filtreras **klientsidan**, alltså efter
att de hämtats. Fjorton av hooksen kör samma mönster mot sina collections; bara nio frågor i
hela kodbasen använder `limit()`.

`useSokindex()` – som driver både sökfältet på startsidan och kommandopaletten – monterar
`useRutiner` för två områden **plus** förrådsartiklar, kontakter och länkbibliotek, och bygger
ett Fuse.js-index över alltihop i en `useMemo`. Startsidan öppnar alltså i praktiken en
livelyssnare över hela organisationens innehåll.

Med dagens datamängd (8 mallrutiner) är det gratis. Men `PITCH.md` säljer uttryckligen
motsatsen: *"fyll på med befintliga rutiner (fotofunktionen gör detta snabbt)"* och
bulkimport av en hel avdelnings pärmar. En avdelning med 500–2 000 rutiner är precis det
lyckade utfallet – och det är den datamängden appen aldrig har körts mot.

`persistentLocalCache` är påslaget, vilket mildrar återbesök rejält (deltasynk mot lokal
IndexedDB). Problemet är alltså **första inloggningen på en ny enhet** och **CPU-kostnaden
för att bygga om Fuse-indexet**, inte den löpande Firestore-notan.

> **Viktigt:** detta är ett *identifierat* problem, inte ett *uppmätt*. Se Etapp 60a – planen
> kräver mätning före optimering, av precis samma skäl som genomgående krav 8 finns.

### 5. `functions/index.js`: 4 621 rader, 92 exports, en fil

`Admin.jsx` delades upp i 32 sektionskomponenter vid ~600 rader (Etapp 8c). Backendfilen är
sju gånger så stor och har aldrig fått samma behandling. Den innehåller allt från
`skickaEpost` till hela raderingslivscykeln till klinikstödets sökkedja. Varje ny Cloud
Function gör det svårare att se vad som redan finns – och `hamtaAnvandarInfo`-mönstret,
rollkontrollerna och hastighetsbegränsningen upprepas i dussintals varianter utan att vara
en gemensam wrapper.

Fem utils saknar test, varav två med reell risk: `offlineKo` (offlinekön – dataförlust om den
tappar en post) och `checklistFramsteg`. Kioskläget (Etapp 55) har noll e2e-täckning.

---

## Genomgående krav (fortsätter numreringen från `ETAPPLAN11.md`)

21. **Mät före du optimerar.** Etapp 60 får inte påbörjas med en kodändring. Den börjar med
    att seeda en realistisk datamängd och mäta – annars optimerar vi en gissning. Det här är
    genomgående krav 8 (premisskontroll) tillämpat på prestanda, och skälet är detsamma:
    projektet har flera gånger byggt på antaganden som inte höll.

22. **Varje ny kundvänd funktion ska gatas av sin modulflagga i samma commit som den byggs.**
    Fynd 2 uppstod för att gatingen är en muntlig konvention, inte något som fångas
    automatiskt. Etapp 59b ska både rätta kioskläget och göra det svårare att glömma nästa
    gång.

23. **En siffra som visas för ledningen måste räkna samma sak som användaren kan se.**
    Fynd 1 bröt mot detta: hälsosiffran räknade rutiner som ingen användare kan nå. Gäller
    hälsosiffran, kvitteringsgraden, ledningsrapporten och innehållshälsan.

24. **Ingen refaktorering utan grönt testsvep före och efter.** Etapp 61 flyttar kod som
    styr radering, behörighet och betalning. Diffen ska vara läsbar som ren flytt.

25. **Innehåll som Synappsen själv curerar (inte en enskild kunds redaktör) får ALDRIG
    beräkna, poängsätta eller rekommendera en åtgärd – bara referera, citera och länka,
    med samma domänbegränsning och källbevakning som klinikstödet redan bevisat fungerar.**
    Gäller specifikt Etapp 64. Det är samma linje som redan finns i "Vad jag INTE
    föreslår" i `ETAPPLAN11.md` (dosberäkning ⇒ medicinteknisk produkt under MDR) – bara
    uttryckt som ett stående krav istället för en enskild avslagen idé, eftersom den här
    planen föreslår en ny funktion som ligger nära gränsen.

---

## Etapp 59 – Rätta det som redan är trasigt

**Varför:** tre av fem fynd är fel som finns i produktionsgrenen nu. Två infördes av de två
senaste etapperna. Att bygga vidare ovanpå dem gör dem dyrare att rätta, och fynd 1 gör
dessutom hälsosiffran missvisande för varje ny kund som etableras under tiden.

**Modul:** ingen (rättningar i Core respektive Operations).

- **59a – Logistikrutinerna: välj en väg och gör den hel.** Två alternativ, och valet är ett
  ägarbeslut (se beslutspunkt 1) eftersom de leder åt olika håll produktmässigt:
  - **Alternativ A (bygg vägen):** ge `/logistik` en rutindel vid sidan av förråden – samma
    `Sektionssida`-mönster som de andra två områdena – och lägg till `useRutiner("logistik")`
    i `useSokindex` och `useGodkannandeKo`. Störst arbete, men gör logistik till ett fullvärdigt
    område. Rimligt om en akutmottagnings logistikrutiner (leveransmottagning, sterilhantering,
    kylkedja) faktiskt hör hemma som läsbara rutiner.
  - **Alternativ B (ta bort löftet):** stryk de sex logistikmallarna ur
    `verksamhetsmallar.js` och exkludera `omrade: "logistik"` ur hälsosiffran och
    ledningsrapporten. Litet arbete, ärligt utfall – logistik förblir ett förrådsområde.
  - Oavsett väg: **en migrering krävs för redan etablerade organisationer** (demo-organisationen
    och eventuella testorganisationer har redan de sex rutinerna). Ingen får lämnas i det
    trasiga mellanläget.
- **59b – Gata kioskläget, och gör gatingen svår att glömma.** Läs `FEATURE.KIOSK_MODE` i
  `KioskBevakning`, i `BottomNav`s kioskgren och i `KioskPinSektion` – och, viktigast, i
  `satKioskPin`/`verifieraKioskPin` server-side (`kravModul("operations")`, samma mönster som
  redan används för Intelligence-funktionerna). Utöka därefter gating-matris-testsviten
  (`tests/functions/gatingmatris.test.cjs`) så att den listar **varje** `FEATURE.*`-nyckel och
  failar om någon saknar en kontroll – då fångas nästa glömda gating av testet, inte av en
  genomgång ett halvår senare.
- **59c – Beroendehygien, med rätt proportioner.** Uppdatera `dompurify` (produktion,
  XSS-sanerare – den enda med direkt säkerhetsbetydelse) och `react-router-dom`. Kör
  regressionstest på `MarkdownInnehall` särskilt: en saneringsuppdatering kan tysta ändra vad
  som släpps igenom. `firebase-tools` (den "kritiska" `tar`-kedjan) är dev-only och kan tas
  separat utan brådska – men **skriv ned den bedömningen**, annars återkommer samma
  "1 kritisk sårbarhet"-larm vid varje genomgång utan att någon minns att den redan bedömts.
  Skapa `npm-audit-rapport.md` som `CLAUDE.md`s säkerhetschecklista redan förutsätter, med
  prod/dev-uppdelningen ovan som första post.

**Klart när:** en nyetablerad organisation har noll oåtkomliga rutiner, hälsosiffran räknar
bara det en användare kan nå, kioskläget kräver Operations i alla tre lagren, och
`npm audit`s utfall är bedömt och nedskrivet snarare än bara observerat.

---

## Etapp 60 – Skala till en verklig rutinmängd

**Varför:** fynd 4. Den enda datamängd appen någonsin körts mot är en demo. Det lyckade
utfallet av en pilot – en avdelning som importerar hela sin pärmvägg – är samtidigt det
scenario som aldrig testats. Det vore ett dåligt sätt att upptäcka en flaskhals.

**Modul:** ingen (Core-prestanda).

- **60a – Mät först, med riktig volym. Ingen optimering i det här delmålet.** Skriv ett
  seedningsskript (emulator, inte produktion) som skapar 500, 1 000 och 2 000 rutiner med
  realistisk innehållsstorlek, plus 200 användare i `lasteAv`-arrayerna. Mät sedan, och skriv
  in siffrorna i planen:
  - tid till interaktiv startsida vid **första** inloggningen på en tom cache,
  - överförd datamängd (Network-fliken) för samma laddning,
  - tid att bygga Fuse-indexet i `useSokindex` (CPU, gärna med simulerad mobil-CPU),
  - Firestore-läsningar per session, och vad det kostar per månad för 40 användare.
  **Om siffrorna är acceptabla stannar Etapp 60 här** och 60b–60d stryks som onödiga. Det är
  ett fullgott utfall, inte ett misslyckande – och exakt varför mätningen kommer först.
- **60b – Listvyn ska inte hämta hela innehållet.** *Villkorat av 60a.* Rutindokumentets
  tunga fält (`innehall`, `steg`, `kviss`, `externaKallor`) behövs inte för att rendera ett
  `RutinKort` i en lista – bara för att öppna rutinen. Två vägar att väga: (i) ett
  `listvy`-projekterat fält som skrivs vid spara, (ii) en separat `rutinerIndex`-collection.
  Alternativ (ii) är renare men inför en synkroniseringsrisk (två källor som kan gå isär) –
  och den sortens risk har det här projektet redan brottats med i dokumentationen. Väg det
  medvetet.
- **60c – Filtrera bort papperskorg och arkiv i frågan, inte i klienten.** `useRutiner`
  hämtar mjukraderade och arkiverade rutiner och kastar dem i JavaScript. Med
  `where("borttagen", "!=", true)` finns en känd fälla: **Firestore utesluter dokument som
  saknar fältet helt** (samma sak som redan är dokumenterad i `kontrolleraKvitteringsfrister`).
  Kräver alltså att fältet backfillas till `false` på alla befintliga rutiner först – ett
  migreringssteg, inte en enradsändring. Skriv ut det i planen så att nästa session inte
  faller i fällan.
- **60d – Sökindexet.** *Villkorat av 60a.* Om Fuse-bygget är den dyra delen: bygg indexet en
  gång och dela det (kontext/`useRef`) i stället för per konsument, alternativt flytta det
  till en Web Worker så att huvudtråden inte fryser. Rör inte träffkvaliteten – sökningen är
  produktens mest använda funktion och en tyst försämring där är värre än en långsam
  indexering.

**Klart när:** samma tre mätvärden som i 60a är körda igen mot 2 000 rutiner och ligger inom
en gräns som skrivits ned i planen i förväg – eller när 60a visat att inget behövde göras.

---

## Etapp 61 – Underhållbarhet och testluckor

**Varför:** fynd 5. Ingen användare märker den här etappen. Den handlar om att nästa etapp
ska gå att bygga utan att först läsa 4 600 rader, och om att två utils med dataförlustrisk
faktiskt har test.

**Modul:** ingen.

- **61a – Dela `functions/index.js`.** Samma behandling som `Admin.jsx` fick i Etapp 8c, och
  samma motivering. Föreslagen indelning efter domän, inte efter storlek:
  `epost.js`, `organisationslivscykel.js` (etablering/paus/radering/support),
  `revisionslogg.js`, `klinikstod.js`, `ai-import.js`, `schemalagt.js`, `notiser.js`,
  och ett `gemensamt.js` för `hamtaAnvandarInfo`/`kravModul`/`kontrolleraOchOkaHastighet`/
  `loggaRevision`. **Ren flytt, noll beteendeändring** – och krav 24 gäller: fullt testsvep
  före och efter, diffen ska gå att läsa som förflyttning. Behåll `index.js` som en tunn fil
  som bara re-exporterar, så att `firebase deploy` och de 32 testfilernas `require`-sökvägar
  fortsätter fungera oförändrade.
- **61b – Testa det som kan tappa data.** `offlineKo` (offlinekön – en tappad post är en
  förlorad kvittering eller bristanmälan som användaren tror gick fram) och
  `checklistFramsteg` först. Därefter `introduktionProgress`, `kvartal`, `senastBesokta`.
  Rena funktioner, ingen Firestore-mockning – samma mönster som `valkomstchecklista.test.js`.
- **61c – E2E för kioskläget.** Etapp 55 byggde en ny inloggningsväg med en egen
  ruttbegränsning och en automatisk återgång, och har noll e2e-täckning. Minst: en
  kiosk-roll kan nå `/akutlage` men studsar från `/profil`, och PIN-dialogen öppnas från
  Mer-menyn. Lägg samtidigt till kiosk i `rokprov.spec.js` rollista.

**Klart när:** ingen fil i `functions/` är över ~800 rader, de fem utils har test, och
kioskläget täcks av e2e.

---

## Etapp 62 – Från mätvärde till åtgärd

**Varför:** det här är planens enda riktiga funktionsetapp, och den bygger på en observation
snarare än en önskelista. Appen mäter redan ovanligt mycket: kvitteringsgrad, tid-att-hitta,
innehållshälsa, personalpuls, dubbletter, **sökningar utan träffar**. Nästan allt presenteras
som en siffra eller en lista i adminpanelen. Det som saknas är steget från *"här är ett
problem"* till *"här är knappen som löser det"*.

`PITCH.md` säljer redan detta som **"datadriven prioritering – ledningen ser exakt vilka
rutiner som saknas och efterfrågas mest"**. I dag är det en lista man läser och sedan gör
något åt någon annanstans. Att stänga den loopen är billigt, eftersom all mätning redan finns.

**Modul:** Operations.

- **62a – "Skapa rutin från en sökning utan träff".** Den starkaste signalen appen har om en
  kunskapslucka är någon som sökte och inte hittade. I dag är det en rad i
  `SokningarUtanTraffarSektion`. Lägg till en knapp som öppnar rutinformuläret med sökordet
  som förifylld titel och området förvalt – och som, när rutinen publiceras, markerar
  sökluckan som åtgärdad. Det gör "Ni sa, vi gjorde"-tanken från Etapp 41a sann även för
  sökningar, inte bara för ändringsförslag.
- **62b – En veckopuls som faktiskt är en handlingslista.** `ETAPPLAN3.md` Etapp 16
  ("veckopuls") har stått öppen sedan den skrevs, blockerad på ett ägarbeslut om omfattning.
  Fatta beslutet genom att göra den minsta meningsfulla versionen: **inget nytt mätvärde**,
  bara de befintliga signalerna sorterade efter vad som är värt att göra först
  (utgångna rutiner före obesvarade förslag före sökluckor), med en direktlänk per rad. Om
  Brevo-nyckeln finns kan den skickas som e-post; annars är den en vy. Det avslutar en punkt
  som stått öppen i månader utan att bygga något nytt att underhålla.
- **62c – Hälsosiffran ska kunna svara "vad gör jag nu?".** `InnehallshalsaSektion` visar
  redan siffran med sin nedbrytning (bra, och medvetet – se `PITCH.md`). Nästa steg är att
  varje rad i nedbrytningen får en åtgärd: "saknar ägare" → tilldela ägare direkt i listan;
  "bör granskas" → starta en granskningsrunda med exakt de rutinerna förvalda (funktionen
  finns redan, Etapp 37b).

**Klart när:** de tre vanligaste sakerna en redaktör ser i adminpanelen går att åtgärda utan
att lämna vyn.

---

## Etapp 63 – Gör de mänskliga punkterna enkla att avsluta

**Varför:** `OPPNA-PUNKTER.md` har tolv rader. **Ingen av dem är blockerad av kapacitet** –
alla väntar på ett beslut, en bokning eller ett avtal. Den externa granskningen 2026-08-04
pekade ut exakt det mönstret (fem punkter stod stilla i tre veckor medan ett tjugotal etapper
byggdes), och registret skapades för att göra dem synliga. Det har fungerat delvis: de är
synliga, men de flesta står kvar.

Det här är inte en uppmaning att bygga mer. Det är en etapp för att göra det billigare för
ägaren att stänga dem.

**Modul:** ingen.

- **63a – Skilj på vad som kostar tio minuter och vad som kostar en bokning.** Fyra av tolv
  rader är rena ifyllnadsuppgifter (`INCIDENT-CHECKLISTA.md`s tre tomma kontaktrader,
  `TILLGANGLIGHETSREDOGORELSE.md`s datum och juridiska namn). De har stått öppna sedan
  2026-08-01 trots att registret självt noterar *"Inget – tar tio minuter, ingen blockering"*.
  Gruppera registret efter **vad som faktiskt krävs** (tio minuter vid tangentbordet / ett
  beslut / en bokad människa / ett tecknat avtal) i stället för efter planfil. En ägare som
  har tio minuter ska kunna se vad som ryms i dem.
- **63b – Förbered pilotpaketet så långt det går utan en pilot.** `ETAPPLAN10.md` Etapp 52
  har väntat på bokad tid sedan den skrevs. Allt som inte kräver en riktig människa kan
  färdigställas i förväg: introduktionsmaterial för en redaktör, ett förslag på
  pilotupplägg med de tre måtten från `PITCH.md`, och en checklista för vad som ska mätas
  före/efter. Då är det som återstår en kalenderbokning, inte ett arbetspass.
- **63c – Ta ställning till de tre beslutspunkterna som har en färdig rekommendation.**
  SSO-protokoll (rekommendation: OIDC), påminnelsemejlens förval (rekommendation: på för
  tilldelade uppgifter, av för övrigt) och 54c/54d. Alla tre har redan ett analyserat svar i
  `ETAPPLAN11.md` – de behöver bara ett ja eller nej, och sedan en rad i `BESLUTSLOGG.md`.
  Ett nej är ett lika bra utfall som ett ja; det som kostar är att raden står kvar.

**Klart när:** `OPPNA-PUNKTER.md` är grupperad efter insatstyp, de fyra tiominutersraderna är
borta, och de tre beslutspunkterna har ett svar i `BESLUTSLOGG.md`.

---

## Etapp 64 – Baspaket: nationella referenser, inte kliniskt beslutsstöd (ny idé, ej granskad juridiskt)

**Varför:** en fråga från ägaren under den här genomgången. Idén: erbjuda ett gemensamt
"baspaket" av nationella/generella riktlinjer och bedömningsinstrument (ägaren nämnde t.ex.
VÄST-A som exempel – jag har ingen egen verifierad kunskap om det specifika instrumentets
innehåll eller omfattning, och gissar inte på det här) som är **samma för alla kunder**,
till skillnad från Etapp 56:s mallar (som är strukturella skelett en enskild kund fyller i
själv). Det är en genuint annorlunda produktidé, inte en variant av startbiblioteket – och
den ligger nära en gräns som redan är dragen i `ETAPPLAN11.md`: *"Dos-/läkemedelsberäkning
eller kliniskt beslutsstöd som räknar … kan klassa hela produkten som en medicinteknisk
produkt under MDR."*

**Min bedömning, kort (se motivering nedan för den fulla resonemangskedjan): en försiktig
version är sannolikt görbar utan att korsa MDR-gränsen, OM den byggs som ren
referens/länkning – inte som en interaktiv poängräknare.** Den skillnaden avgör allt, och
den går inte att göra halvvägs.

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

**Klart när, OM etappen antas:** en extern juridisk bedömning (inte en kodgenomgång) har
bekräftat att 64a–64d håller sig utanför MDR:s programvarudefinition, och den bedömningen
är skriven in i `SAKERHETSRAPPORT.md` innan något publiceras för en kund.

---

## Beslutspunkter som kräver ägaren

| # | Fråga | Varför det inte är mitt beslut | Min rekommendation |
|---|---|---|---|
| 1 | **59a: alternativ A (bygg logistikrutiner som ett fullt område) eller B (ta bort mallarna)?** | Det är en produktfråga: hör logistik*rutiner* hemma i produkten, eller är logistik enbart ett förrådsområde? | **B, om ingen kund har efterfrågat logistikrutiner.** Det är ärligare att ta bort ett löfte som inte infrias än att bygga en vy för innehåll ingen bett om. A blir rätt först när en kund faktiskt vill ha det – och då är A ett litet, tydligt avgränsat bygge. |
| 2 | **Ska Etapp 60b–60d byggas innan en kund med stor datamängd finns?** | Avvägning mellan att bli överraskad och att optimera i onödan. | **Kör 60a nu, vänta med resten.** Mätningen kostar en dag och tar bort gissningen. Om siffrorna är bra har vi ett svar att ge en upphandlare; om de är dåliga vill vi veta det före piloten, inte under. |
| 3 | **Ska Etapp 61a (dela `functions/index.js`) göras nu eller vid nästa större backendarbete?** | Ren underhållsinvestering utan synligt utfall – ett tempoval. | **Nu, medan inget nytt byggs ovanpå.** Refaktorering är billigast när ingen etapp pågår samtidigt, och nästa plan blir lättare oavsett vad den innehåller. |
| 4 | **Etapp 62b: ska veckopulsen skickas som e-post eller bara vara en vy?** | Beror på om Brevo-avtalet tecknas (`OPPNA-PUNKTER.md`). | **Bygg vyn först, e-posten som ett tillägg.** Vyn fungerar oavsett nyckel; e-postutskicket kopplas på när kanalen är i skarp drift. |
| 5 | **Etapp 64: ska baspaketet drivas vidare, och i så fall – vem gör MDR-bedömningen innan något byggs?** | Regulatorisk risk (medicinteknisk produkt under MDR) är en juridisk fråga, inte en teknisk – jag kan visa VAR gränsen sannolikt går utifrån hur klinikstödet redan är byggt, men jag kan inte lämna ett juridiskt bindande svar. | **Beställ en kort extern juridisk bedömning av 64a–64d INNAN kod skrivs**, snarare än att bygga först och fråga sedan. Om bedömningen är positiv är det sedan ett litet, välavgränsat bygge (samma mönster som klinikstödets domänbegränsning + källbevakning) – men den ordningen (juridik → kod) är viktigare än vilken vecka det byggs. |

---

## Föreslagen ordning

1. **Etapp 59 först, och helst i dag.** Tre kända fel i produktionsgrenen, varav ett gör
   hälsosiffran missvisande för varje ny organisation som etableras. 59b är dessutom en
   affärsspärr (kiosk utan Operations).
2. **Etapp 60a därefter** – en dag, ger ett svar man kan sätta i ett upphandlingsunderlag.
   60b–60d bara om mätningen motiverar dem.
3. **Etapp 61 när inget annat pågår** – störst nytta, minst risk, om den inte konkurrerar med
   ett funktionsbygge.
4. **Etapp 62 när 59 är stängd.** Det är den enda etappen som ger en kund något nytt att se,
   men den bygger på mätvärden som måste räkna rätt först (krav 23) – därför efter 59a.
5. **Etapp 63 löpande**, parallellt med allt annat. Den kräver ingen kodkapacitet.
6. **Etapp 64 väntar på beslutspunkt 5** – ingen kodrad skrivs innan en extern juridisk
   bedömning av MDR-gränsen finns. Oberoende av 59–63 i övrigt; kan drivas parallellt av
   ägaren (beställa bedömningen) medan resten byggs.

---

## Sammanfattning

| Etapp | Innehåll | Modul | Risk | Status |
|---|---|---|---|---|
| **59** | Rätta logistikrutinerna, gata kioskläget, beroendehygien | Ingen/Operations | Låg | Förslag – **bör tas först** |
| **60a** | Mät prestanda med 500–2 000 rutiner | Ingen | Låg | Förslag |
| **60b–d** | Listvyprojektion, serverside-filtrering, sökindex | Ingen | Medel | **Villkorad av 60a:s siffror** |
| **61** | Dela `functions/index.js`, testluckor, kiosk-e2e | Ingen | Låg–medel | Förslag |
| **62** | Sökluckor → rutin, veckopuls, åtgärdbar hälsosiffra | Operations | Låg | Förslag |
| **63** | Gruppera öppna punkter, förbered pilot, tre beslut | Ingen | Ingen | Förslag – kräver ägaren |
| **64** | Baspaket: nationella referenser (rena länkar/citat, aldrig beräkning) | Ny (ej namngiven) | **Regulatorisk – MDR** | Idé, **ej byggbar förrän juridisk bedömning finns** (beslutspunkt 5) |

---

## Vad jag INTE föreslår, och varför

Samma avsnitt som `ETAPPLAN11.md` har, av samma skäl: så att en framtida session inte
föreslår dem igen utan att känna till invändningen.

- **Flerspråkigt gränssnitt (i18n).** Det finns inget språkstöd alls i dag, och svensk
  akutsjukvård har personal som är tryggare på engelska. Ändå: det är ett stort ingrepp i
  varje komponent, och det verkliga språkproblemet sitter i *rutininnehållet* (som kunden
  skriver), inte i knapptexterna. Ett översatt gränssnitt runt en svensk rutin löser inte
  det. Vänta tills en kund uttryckligen efterfrågar det.
- **Fler mätvärden.** Appen mäter redan sex saker och har noll verkliga veckor av data. Ett
  sjunde mätvärde före den första riktiga användaren är att bygga i mörker – det är därför
  Etapp 62 handlar om att *använda* de befintliga, inte lägga till ett nytt.
- **Realtidslarm (Etapp 32b) och täckningsbidrag per kund (48c).** Båda kräver GCP-
  faktureringsexport till BigQuery, ett ägarbeslut med en kostnad – inte en kodfråga. De hör
  hemma i `OPPNA-PUNKTER.md`, där de redan står, inte i en etapplan.
- **Ombyggnad av kvitteringsmodellen** (`lasteAv` som array på rutindokumentet). Vid 200
  anställda är arrayen ~20 kB – långt under Firestores 1 MB-gräns – och `arrayUnion` klarar
  belastningen. Det är en verklig gräns men inte en nära förestående, och en flytt till en
  subcollection skulle röra kvitteringsgraden, kompetensmatrisen och hälsosiffran samtidigt.
  Rör den inte förrän en kund passerar ~500 anställda.
- **Etapp 54c (gemensamma rutiner mellan enheter).** Oförändrad bedömning från
  `ETAPPLAN11.md`: envägsdörr, kräver en konkret andra enhet först. Den här planen ändrar
  inget i det.
