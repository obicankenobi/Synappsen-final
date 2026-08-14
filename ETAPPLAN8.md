# Etapplan 8 – Mobilappskänsla och installationsbarhet

**✅ ANTAGEN 2026-08-04.** Utgångsläge v5.72.0, efter att `ETAPPLAN7.md` (Etapp 42+43,
gränssnittsförnyelsen) blev helt klar och deployad. **Detta är den AKTIVA planen för nytt
arbete.** `ETAPPLAN6.md` (Etapp 40) och `ETAPPLAN5.md`s kvarvarande punkter är inte stängda,
men inte blockerade av kapacitet – bara av att den här planen kom i vägen kronologiskt eller av
ägarbeslut/extern tid (se respektive fils eget statusblock).

> **Bakgrund:** en genomgång av hela produkten (se `CLAUDE_STATUS.md`s uppföljning
> 2026-08-04) konstaterade att alla tre huvudpaket (Core/Operations/Intelligence) +
> Källbevakning är fullt byggda och i drift, och att UI:t precis genomgått en total förnyelse.
> Frågan blev då: vad är nästa GENUINA värdeökning, inte skuld? Tre kandidater togs fram:
> **(A) mobilappskänsla/installationsbarhet**, **(B) sök- och kunskapsupptäckt 2.0**, och
> **(C) incidentberedskap i produkten** (göra `INCIDENT-CHECKLISTA.md`/
> `avtal/INCIDENTRESPONSPLAN.md` till en aktiv adminvy istället för ett passivt dokument).
> Ägaren beslutade att bygga **A** i den här planen (Etapp 44) och att **B och C köas som
> kommande, egna etapper** – se "Kommande etapper (ej detaljplanerade ännu)" längst ner.
> Ingen av de tre är förkastad.

---

## Premisskontroll utförd före antagande (genomgående krav 8)

Innan Etapp 44 detaljplanerades kontrollerades vad som FAKTISKT redan finns av
"app-känsla"/installationsbarhet i koden – flera antaganden som lätt görs om en PWA visade
sig vara fel eller redan lösta:

| Antagande | Verifierat |
|---|---|
| Appen saknar ett installerbart manifest | ❌ **Falskt.** `vite.config.js` (VitePWA-pluginet) definierar redan ett komplett `manifest.webmanifest` med `display: 'standalone'`, `theme_color`, `background_color`, ikoner (any + maskable). Webbläsarens EGNA installationsflöde (t.ex. Chrome/Edge-adressfältets installationsikon) fungerar redan idag. |
| Kvitteringar/anmälningar gjorda offline försvinner eller kräver manuell återsändning | ❌ **Falskt, redan löst.** `useOfflineKo.js` (Etapp 29c) köar redan läskvitteringar (rutin + anslag) och bristanmälningar i `localStorage` och skickar dem automatiskt vid `online`-eventet, med `OfflineIndikator.jsx` som visar exakt vad som är tillgängligt offline och hur gammalt det är. **Denna punkt utgår helt ur Etapp 44** – inget att bygga här. |
| Det finns ingen egen uppmaning att installera appen | ✅ **Sant, genuin lucka.** Ingen kod lyssnar på `beforeinstallprompt`, och ingen instruktionstext finns för iOS Safari (som aldrig avfyrar det eventet – Apple stöder bara "Dela → Lägg till på hemskärmen" manuellt). De flesta användare vet sannolikt inte att appen går att installera. |
| Hemskärmsikonen på iPhone blir korrekt | ⚠️ **Trolig bugg, inte bekräftad utan en riktig iOS-enhet.** `index.html` pekar `<link rel="apple-touch-icon">` mot `/icons/icon.svg` – Apple stöder officiellt bara PNG för den taggen (dokumenterat Apple-beteende, inte ett Synappsen-specifikt fel), SVG kan renderas fel eller falla tillbaka på en skärmdump av sidan. Måste verifieras/åtgärdas som en del av 44b. |
| En ny deploy uppdaterar appen sömlöst i bakgrunden | ⚠️ **Overifierat beteende, inte bara overifierad känsla.** `registerType: 'autoUpdate'` (`vite.config.js`) registrerar service workern automatiskt (`injectRegister`s standardläge), men ingen kod i `src/` lyssnar på `controllerchange` eller visar något gränssnitt kring en uppdatering. Det är okänt om detta idag manifesterar sig som en TYST, oanmäld omladdning mitt i en pågående session (t.ex. mitt i ifyllnad av ett formulär) – måste testas med en riktig deploy under en öppen flik innan 44c:s omfattning låses fast. |
| Appen känns "native" vid touch (ingen pull-to-refresh, ingen textmarkerings-callout på knappar) | ✅ **Sant, ingen sådan CSS finns.** Inget `overscroll-behavior`, ingen `-webkit-touch-callout: none` på interaktiva element. Litet, men märks direkt på en riktig telefon. |

**Slutsats:** Etapp 44 är smalare än den ursprungliga idén antydde – "bakgrundssynk av
offline-kvitteringar" var redan byggt. De genuina luckorna är: ingen installationsuppmaning,
en trolig men obekräftad iOS-ikonbugg, ett obekräftat (möjligen störande) uppdateringsbeteende,
och saknad touch-polish.

---

## Etapp 44 – Mobilappskänsla och installationsbarhet

**Varför:** produkten är byggd för och används mest av skiftpersonal på mobilen (se
`BottomNav.jsx`, hela `ETAPPLAN7.md`s mobilfokus), men själva "det här är en app, inte bara en
webbsida"-känslan är ofullständig: ingen uppmanar användaren att installera den, och det är
okänt om en vanlig deploy stör en pågående arbetssession.

- **44a – Egen installationsuppmaning.** Fånga `beforeinstallprompt` (Android/Chrome/Edge/
  Desktop) i en ny, liten, avvisningsbar banderoll ("Lägg till Synappsen på hemskärmen") –
  inte webbläsarens diskreta standardikon som lätt missas. **iOS Safari-gren:** eftersom
  `beforeinstallprompt` aldrig avfyras där, visa istället en textinstruktion ("Tryck Dela →
  Lägg till på hemskärmen") baserat på user-agent-sniffning av iOS Safari specifikt – ADRIG
  påstå att en riktig installationsknapp finns där den inte gör det.
  **Måste** kontrollera `display-mode: standalone`/`navigator.standalone` (installerad-
  detektion) INNAN banderollen visas överhuvudtaget, annars stör den de som redan installerat.
  Dölj permanent (localStorage) om avvisad, återkom inte varje session.
- **44b – Korrekt hemskärmsikon på iOS.** Verifiera det misstänkta SVG-problemet först (krav 8
  gäller även mitt i en etapp, inte bara vid antagandet) – om bekräftat: generera en riktig
  PNG-variant av `icons/icon.svg` (minst 180×180, Apples rekommenderade storlek) och peka
  `apple-touch-icon` dit. Rör INTE `manifest.webmanifest`s befintliga SVG-ikoner (de fungerar
  redan för Android/Chrome-installation) – det här är en riktad iOS-specifik fix.
- **44c – Kontrollerad app-uppdatering istället för en eventuell tyst omladdning.** Testa
  FÖRST (verifieringssteg, inte antagande): håll appen öppen i en flik, trigga en riktig deploy,
  observera faktiskt beteende. Om det visar sig vara en oanmäld, tvingad omladdning: bygg en
  liten, icke-påträngande "Ny version tillgänglig – ladda om"-knapp (lyssna på
  `controllerchange`/en ny SW i `waiting`-state) istället för att låta uppdateringen ske utan
  varsel. Om testet visar att beteendet redan är ofarligt (t.ex. uppdateringen sker bara vid
  nästa navigering, aldrig mitt i en öppen vy): dokumentera det och gör ingen kodändring – exakt
  samma "redan i sin ordning"-princip som flera 43e-grupper landade på.
- **44d – Touchkänsla.** CSS-only: `overscroll-behavior: contain` på appens rot (förhindra
  pull-to-refresh/gummistuds som avslöjar att det "bara" är en webbsida), samt
  `-webkit-touch-callout: none`/`user-select: none` på knappar, kort och navigering (INTE på
  brödtext/rutininnehåll – det ska fortfarande gå att markera och kopiera text ur en rutin).

**Klart när:** en ny användare som öppnar Synappsen på sin telefon (Android eller iOS) blir
tydligt uppmanad att installera den och vet hur, appikonen på hemskärmen ser korrekt ut på
båda plattformarna, en deploy stör aldrig en pågående arbetssession utan varsel, och gränssnittet
inte längre "läcker" webbläsarbeteenden (gummistuds, textmarkerings-popup på knappar) som
avslöjar att det inte är en riktig app.

### 44a–44d ✅ KLARA (2026-08-04)

**44c verifierades FÖRE bygget genom att läsa `vite-plugin-pwa`s faktiska registreringskod**
(`node_modules/vite-plugin-pwa/dist/client/build/register.js`), inte genom att gissa – ett
starkare verifieringssteg än den ursprungligen planerade "håll en flik öppen under en riktig
deploy"-testen, som inte gick att genomföra i den här sessionen. Bekräftat: med
`registerType: 'autoUpdate'` injicerar pluginet AUTOMATISKT ett registreringsskript
(`injectRegister: 'auto'` → `'script'` eftersom ingen kod importerade `virtual:pwa-register`)
som anropar `window.location.reload()` UTAN VARSEL så fort en ny service worker aktiverats –
premisskontrollens farhåga var korrekt, inte bara en känsla.

**Byggt:**
- **44c:** `registerType` ändrad till `'prompt'` (`vite.config.js`). Ny `useAppUppdatering.js`
  som importerar `virtual:pwa-register` själv (gör att `injectRegister` blir `null` – inget
  automatiskt skript längre) och exponerar `behoverUppdatering`/`uppdatera()`. Ny
  `AppUppdateringBanner.jsx`, monterad globalt i `App.jsx`, visar "En ny version av Synappsen
  är redo" med en Uppdatera-knapp – laddar ALDRIG om utan att användaren själv klickat.
- **44a:** ny `useInstallBanner.js` fångar `beforeinstallprompt` (Android/Chrome/Desktop),
  detekterar redan-installerad (`display-mode: standalone`/`navigator.standalone`) för att
  ALDRIG visa banderollen i onödan, och en separat gren för iOS Safari (som aldrig avfyrar
  `beforeinstallprompt`) med en textinstruktion istället för en knapp som inte skulle fungera.
  Avvisning sparas i `localStorage`, kommer inte tillbaka. Ny `InstalleraAppBanner.jsx`,
  monterad globalt.
- **44b:** genererade en riktig 180×180 PNG (`public/icons/apple-touch-icon.png`) från den
  befintliga SVG:n (via en Playwright-skärmdump av SVG:n i en headless webbläsare – inga nya
  byggberoenden behövdes) och pekade `index.html`s `apple-touch-icon`-tagg dit istället för
  SVG:n. `manifest.webmanifest`s SVG-ikoner (Android/Chrome) orörda – riktad iOS-fix.
- **44d:** `overscroll-behavior-y: contain` på `body` (förhindrar pull-to-refresh-gummistuds)
  och `-webkit-touch-callout: none` på knappar/länkar/navigering (INTE på brödtext – rutin-
  innehåll ska fortfarande gå att markera/kopiera), i `src/index.css`.

**Verifierat i en riktig webbläsare mot emulatorerna** (Playwright, 375×812, inte bara läst
källkod): `beforeinstallprompt` simulerat och `prompt()` bekräftat anropad vid klick;
avvisning verifierad kvarstå efter omladdning; iOS Safari-User-Agent gav korrekt
instruktionstexten (inte installationsknappen); `display-mode: standalone` simulerat gav
INGEN banderoll alls; `apple-touch-icon.png` bekräftat ladda med HTTP 200. Inga konsolfel
under hela flödet (inloggning → Hem).

Inga nya vitest-tester (ren UI/hook-logik utan datamodell). Inga rules-/storage-ändringar,
`test:rules`/`test:functions`/`test:storage` därför inte omkörda (samma princip som tidigare
"inga rules-ändringar"-fall i `ETAPPLAN7.md`). Fullt testsvep grönt: lint, build, vitest
123/123. Version 5.72.0 → **5.73.0**, `andringslogg.js` uppdaterad.

**Etapp 44 (och därmed hela `ETAPPLAN8.md`s nuvarande innehåll) är klar.** Nästa steg: B
(sök/kunskapsupptäckt 2.0) enligt den beslutade ordningen, om inget annat prioriteras.

**Genomgående krav (gäller hela etappen):**
- Krav 8 (premisskontroll) gäller på nytt vid start av VARJE delpunkt ovan, inte bara vid
  antagandet av hela planen – 44b och 44c är uttryckligen markerade "overifierat" och ska
  verifieras mot verkligt beteende (en riktig iOS-enhet respektive en riktig deploy under en
  öppen flik) innan kod skrivs, inte antas.
- Ingen del av 44 får försämra `useOfflineKo.js`/`OfflineIndikator.jsx`s redan fungerande
  offline-kö – de är medvetet lämnade orörda i den här planen (se premisskontrollen ovan).
- Fullt testsvep (`lint`, `build`, `vitest run`, samt `test:rules`/`test:storage` om någon
  regel/lagringsväg skulle beröras, vilket inte förväntas för 44a–44d) före varje commit,
  version­bump + `andringslogg.js`-post per leverans, samma mönster som `ETAPPLAN7.md`.

---

## Kommande etapper (ej detaljplanerade ännu)

Två ytterligare riktningar identifierades i samma genomgång som gav upphov till Etapp 44.
**Ingendera är förkastad** – de är medvetet köade, för att undvika att bygga tre stora,
oberoende initiativ samtidigt. Skriv INTE ut deras fulla delmålsplaner här (samma
för-tidigt-att-detaljplanera-princip som `FRAMTIDSPLAN.md`/`MODULPLAN.md` använder) – när
respektive etapp faktiskt påbörjas, skriv en riktig premisskontroll gjord DÅ, mot kodläget vid
den tidpunkten, inte mot dagens.

> **Omprioriterade 2026-08-04** (se `ETAPPLAN9.md` Beslut 1, efter en extern granskning): en
> ny etapp (45, kvalitetsmaskineriet riktas utåt – `ETAPPLAN9.md`) sköts in FÖRE båda, och C
> och B bytte plats sinsemellan. Skälet: C har en dokumenterad 72-timmarsfrist
> (`avtal/PUB-AVTAL-MALL.md` p. 8) och kända, ifyllbara luckor redan idag
> (`OPPNA-PUNKTER.md`), medan B förbättrar något som redan fungerar.

- **Etapp 46 (tidigare "C") – ✅ KLAR (2026-08-04): Incidentberedskap i produkten.** Se egen
  sektion nedan.
- **Etapp 47 – ✅ ANTAGEN OCH PÅBÖRJAD (2026-08-04): Sök- och kunskapsupptäckt 2.0.** Se egen
  sektion nedan.

Ordning: **44 → 45 → 46 → 47**, men omprövningsbar om en konkret kundhändelse (t.ex. en ny
kund, en verklig incident) gör en av dem mer akut.

---

## Etapp 46 – Incidentberedskap i produkten

**Varför:** `INCIDENT-CHECKLISTA.md` beskrev flera detektionsförmågor (revisionskedjans
nattliga kontroll, backuper) som bara var synliga via Sentry-larm (bara vid en AVVIKELSE) eller
genom att gräva i Firebase-konsolen – aldrig som ett "läget just nu"-svar i själva appen.

### Premisskontroll (krav 8), gjord innan bygget – planens ursprungliga idé var för bred

Den ursprungliga idén (från granskningen som gav upphov till hela `ETAPPLAN8.md`) nämnde tre
saker: "senaste backup, App Check-verifieringsgrad, misslyckade inloggningsförsök i realtid".
Kontroll mot faktisk kod/infrastruktur INNAN bygget visade att bara EN av de tre var byggbar
som planerat:

| Idé | Byggbar? | Varför |
|---|---|---|
| Senaste backup | ✅ Ja | Filerna finns redan i Storage (`backups/{orgId}/`), bara oläsbara för klienten – en Cloud Function med Admin SDK kan lista dem. |
| App Check-verifieringsgrad | ❌ Nej | Firebase Admin SDK exponerar ingen funktion för att LÄSA den metriken – den finns bara i Firebase-konsolens UI (Build → App Check → Metrics), inte via någon dokumenterad API. Inte en kodfråga att lösa, en produktbegränsning hos Firebase självt. |
| Misslyckade inloggningsförsök, realtid | ❌ Nej | Redan dokumenterat blockerat i `INCIDENT-CHECKLISTA.md`s egen "Vad som ännu inte finns"-tabell sedan tidigare: kräver ett ägarbeslut om en betald tjänst (Sentry API-token/GCP-faktureringsexport, Etapp 32b) – spårad i `OPPNA-PUNKTER.md`. |

**Konsekvens:** planens omfattning smalnades till det som faktiskt går att bygga (backup +
revisionskedjans status), med en tydlig, ärlig UI-text om vad som INTE visas och var det
faktiskt går att kontrollera istället – hellre en mindre men sann vy än en som låtsas täcka
allt planen ursprungligen räknade upp.

### Genomfört

- **Ny collection `systemstatus/{id}`** – `verifieraRevisionskedjor()` (den redan existerande
  nattliga kontrollen, Etapp 32d) skriver nu ett sammanfattningsdokument VARJE körning, inte
  bara vid en avvikelse. Utan det gick det inte att skilja "kedjan är intakt" från "jobbet
  slutade köras för tre veckor sedan" – tystnad betydde tidigare båda sakerna, oskiljbart.
- **Ny callable `hamtaBackupstatus`** – listar en organisations backupfiler i Storage via
  Admin SDK och returnerar senaste datum. Återanvänder exakt samma auth-upplösning som
  revisionsloggens callables (`kravLasningAvRevisionslogg`).
- **Ny adminsektion `IncidentberedskapSektion.jsx`** (superadmin, i `/admin`) – visar båda,
  plus en uttrycklig "Vad den här vyn INTE visar"-ruta som pekar till Firebase-konsolen
  respektive `OPPNA-PUNKTER.md` för de två saker som inte kunde byggas.
- **`firestore.rules`**: `systemstatus/{id}` läsbar bara för superadmin, skrivbar av ingen
  klient – samma mönster som redan etablerade `systemvarningar`.
- **Dokumentation uppdaterad i samma commit** (obligatorisk underhållsregel för
  incidentdokumenten, `CLAUDE.md`): `INCIDENT-CHECKLISTA.md`s "Var saker finns"-tabell (ny
  rad) och "Vad som ännu inte finns"-tabell (hashkedjeraden uppdaterad), toppradens
  kodläge/datum. `SAKERHETSRAPPORT.md` fick ett nytt `## Tillägg`-block (ny collection har
  regeltester, ingen ny PII-yta, inga nya uppladdningsvägar).

### Testat

- 6 nya regeltester (`tests/rules/systemstatus.test.mjs`) – superadmin läser, ingen annan
  roll, ALDRIG någon klientskrivning.
- 4 nya functions-tester (`tests/functions/backupstatus.test.cjs`) – behörighet (nekar
  icke-superadmin), en organisation utan Operations-modulen ger `harOperationsModul: false`
  utan en Storage-fråga, och det SENASTE datumet hittas korrekt bland flera sparade
  backuper utan att blanda in en annan organisations filer.
- 1 nytt assert i `tests/functions/etapp32d.test.cjs` – `systemstatus/revisionskedja`
  uppdateras även när allt är i sin ordning, inte bara vid en avvikelse.
- **Verifierat i en riktig webbläsare** mot emulatorerna: sektionen visar "🟢 Intakt – senast
  kontrollerad ..., (2 organisationer)" korrekt från en seedad `systemstatus`-post.
  Backup-knappen gav förväntat en känd miljöbegränsning (functions-emulatorn körs inte i
  `test:e2e`/den här manuella verifieringen) – **genuint fel hittat under verifieringen**:
  felmeddelandet visade Firebase-klientens råa, obegripliga kod ("internal") istället för en
  läsbar text. Fixat till en egen, tydlig felrad med en direkt pekare till Storage-konsolen.
- **Ett flaky testfel under byggandet, inte en regression:** en körning av `test:e2e` gav ett
  enstaka `ERR_CONNECTION_REFUSED`-fel på `/admin` för en enda roll (forradesansvarig, som
  inte ens ser den nya sektionen – den är superadmin-gated). En omedelbar omkörning gav 11/11
  gröna. Bedömt som en transient nätverksartefakt av parallell testkörning, inte en verklig
  regression orsakad av den här etappen.

Fullt testsvep grönt (lint, build, vitest 124/124, test:rules, test:functions, test:storage
21/21, test:e2e 11/11 vid omkörning). Version 5.74.0 → **5.75.0**, `andringslogg.js`
uppdaterad. Committat och pushat.

**Etapp 46 klar.** Nästa steg enligt ordningen: Etapp 47 (sök- och kunskapsupptäckt 2.0),
när/om den prioriteras.

---

## Etapp 47 – Sök- och kunskapsupptäckt 2.0

**Varför:** produkten är bra på att svara när någon SÖKER, men gör lite för att hjälpa
någon UPPTÄCKA innehåll den inte visste fanns – en angränsande rutin, en uppdatering på
något man redan läst, eller ett annat innehållsområde än rutiner i den globala sökningen.

### Premisskontroll (krav 8), gjord innan bygget – två av tre ursprungliga idéer var redan
### helt eller delvis lösta

| Idé | Status |
|---|---|
| En bredare kommandopalett (kontakter/förråd, inte bara rutiner) | ❌ **Redan helt byggd.** `useSokindex.js` indexerar redan kontakter, förrådsartiklar OCH länkbiblioteket (inte bara rutiner) – bekräftat genom att läsa koden, inte anta. **Inget att bygga här**, utgår helt ur etappen. |
| "Relaterade rutiner"-förslag baserat på taggar/område | ⚠️ **Fältet finns, men är 100% manuellt.** `rutin.relateradeRutiner` (visas som "Se även:" i `RutinKort.jsx`) sätts idag genom att en redaktör manuellt letar upp och väljer varje rutin i `RutinFormular.jsx` – ingen automatisk föreslagning baserat på delade taggar/område finns. **Genuin lucka, byggs (47a).** |
| "Vad är nytt sedan sist du var här" utöver ändringsloggen | ⚠️ **Delvis byggd, med en konkret begränsning.** `SedanForraPasset.jsx`/`useSedanForraPasset.js` (Etapp 25) visar redan NYA rutiner/anslag/skiftrapporter sedan förra inloggningen – men filtrerar på `r.skapad`, aldrig på en uppdatering av en REDAN BEFINTLIG rutin. En rutin som fått ett viktigt innehållstillägg sedan sist syns inte alls. **Genuin lucka, byggs (47b).** |

**Konsekvens:** etappen blir två riktade fixar på ett redan existerande, delvis byggt
fundament – inte tre nya funktioner från grunden.

### 47a – ✅ KLAR (2026-08-04) – Föreslagna relaterade rutiner baserat på taggar/område

I `RutinFormular.jsx`, när en rutin har minst en tagg satt: visa en lista med FÖRESLAGNA
rutiner (godkända, samma område, delar minst en tagg, inte redan tillagd) bredvid det
befintliga `relateradeRutiner`-fältet, med en "Lägg till"-knapp per förslag – i stället för
att redaktören måste komma ihåg och söka upp varje relaterad rutin manuellt. Ren
klientberäkning (ingen ny Firestore-fråga – rutinerna för området är redan laddade i
formuläret), ingen ny datamodell.

### 47b – ✅ KLAR (2026-08-04) – "Sedan ditt förra pass" känner nu igen väsentligt uppdaterat innehåll, inte bara nytt

**Premisskontroll vid byggstart (inte bara vid antagandet) hittade en bättre lösning än den
ursprungligen skisserade.** Första tanken var att lägga till ett nytt fält som stämplas vid
VARJE redigering – men ett fält som redan gör precis det jobbet finns sedan Etapp 19c:
`rutin.senasteVasentligaAndring`, satt av `Sektionssida.jsx` ENDAST när en VÖL/superadmin
uttryckligen kryssar i "väsentlig ändring" vid publicering (samma fält som redan tvingar
omkvittering i kompetensmatrisen, `utils/kompetensStatus.js`). Att stämpla EN gång per
redigering (oavsett hur trivial) hade dränkt "Sedan ditt förra pass" i brus – en stavfelsfix
hade räknats likadant som ett viktigt tillägg. Genom att återanvända
`senasteVasentligaAndring` ärver funktionen samma redan avsiktliga, kuraterade signal, utan
ett nytt fält, ingen regeländring, ingen extra Firestore-fråga.

`useSedanForraPasset.js` utökas att inkludera rutiner där `senasteVasentligaAndring` (inte
bara `skapad`) ligger efter förra inloggningen, med en egen text ("Uppdaterad rutin: X" skild
från "Ny rutin: X") så skillnaden är tydlig för läsaren.

**Klart när:** en redaktör som taggar en ny rutin ser omedelbart vilka andra rutiner i samma
område som delar minst en tagg, och en medarbetare som loggar in efter ett pass ser BÅDE nytt
OCH väsentligt uppdaterat innehåll i "Sedan ditt förra pass" – inte bara det förra.

### Verifierat i en riktig webbläsare mot emulatorerna

- **47a:** en seedad rutin med taggarna `sepsis`/`akut`, redigerad – en ANNAN seedad rutin med
  taggen `sepsis` visades korrekt i den nya "Föreslagna"-rutan.
- **47b:** en seedad rutin med `senasteVasentligaAndring` satt efter användarens
  `foregaendeInloggning` visades korrekt som "Uppdaterad rutin: ..." i "Sedan ditt förra
  pass", skild från "Ny rutin: ...".
- **Ett testskriptfel hittades och korrigerades under verifieringen, ingen produktbugg:**
  första försöket navigerade mellan sidor med `page.goto()` (fulla omladdningar), vilket
  omonterade och återmonterade `AuthContext` en andra gång – exakt det scenario
  `foregaendeInloggning`s egen kommentar redan varnar för ("sparas en gång per session"), och
  gjorde att den redan uppdaterade `senasteInloggning` lästes in på nytt. Fixat genom att
  navigera via en klientsidig länk (`<Link>`) istället för en ny sidladdning, som en riktig
  användare gör i en enda inloggad session.

Inga nya vitest-tester (klientsidig UI-logik verifierad i browser, samma mönster som andra
formulärsjusteringar). Inga rules-/functions-/storage-ändringar. Fullt testsvep grönt (lint,
build, vitest 124/124). Version 5.75.0 → **5.76.0**, `andringslogg.js` uppdaterad. Committat
och pushat.

**Etapp 47 (47a, 47b) klar – 47c (bredare kommandopalett) utgick helt vid premisskontrollen,
redan byggd.** Med detta är samtliga fyra köade etapper i `ETAPPLAN8.md` (44, 46, 47) klara
plus `ETAPPLAN9.md` (45). Ingen ny UI-/upptäckts-etapp väntar just nu.
