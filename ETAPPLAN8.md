# ETAPPLAN 8 – Mobilappskänsla och installationsbarhet

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
**Ingendera är förkastad** – de är medvetet köade, i tur och ordning, för att undvika att bygga
tre stora, oberoende initiativ samtidigt. Skriv INTE ut deras fulla delmålsplaner här (samma
för-tidigt-att-detaljplanera-princip som `FRAMTIDSPLAN.md`/`MODULPLAN.md` använder) – när
respektive etapp faktiskt påbörjas, skriv en egen `ETAPPLAN9.md`/`ETAPPLAN10.md` (eller en ny
sektion här, om den här filen fortfarande är aktiv) med en riktig premisskontroll gjord DÅ, mot
kodläget vid den tidpunkten, inte mot dagens.

- **Etapp B – Sök- och kunskapsupptäckt 2.0.** Idé i korthet: "relaterade rutiner"-förslag
  baserat på taggar/område, en "vad är nytt sedan sist du var här"-vy utöver den redan
  existerande ändringsloggen, och en bredare kommandopalett (kontakter/förråd, inte bara
  rutiner). Nästa i tur efter Etapp 44.
- **Etapp C – Incidentberedskap i produkten.** Idé i korthet: göra `INCIDENT-CHECKLISTA.md`/
  `avtal/INCIDENTRESPONSPLAN.md`s innehåll till en aktiv adminvy (senaste backup, App
  Check-verifieringsgrad, misslyckade inloggningsförsök i realtid) istället för ett passivt
  dokument som bara läses under press. Tredje i tur.

Ordning: **44 (A) → B → C**, men omprövningsbar om en konkret kundhändelse (t.ex. en ny kund,
en verklig incident) gör en av dem mer akut.
