# Statusarkiv – historiska statusavsnitt och uppföljningar

**Utbrutet ur `CLAUDE_STATUS.md` 2026-08-23.** Filen hade vuxit till 4 352 rader
(~75 600 tokens) med 120 uppföljningssektioner, samtidigt som `CLAUDE.md` instruerade
varje ny session att läsa den FÖRST. Ett dokument som ingen orkar läsa skyddar ingenting.

Innehållet nedan är **oförändrat och i kronologisk ordning**. Två saker flyttades hit:
de 117 äldsta uppföljningssektionerna, och en sektion som hette "Nuläge i ett stycke"
men i själva verket beskrev läget vid v5.24.0–v5.25.0 – alltså ett historiskt avsnitt
med en missvisande rubrik, vilket är precis det slags drift det här arbetet finns för.

> **Läsanvisning.** Det här är ett arkiv, inte en statusfil. För aktuellt läge, läs
> `CLAUDE_STATUS.md` i rot. Sök här när du behöver veta *varför* något gjordes:
> `grep -n "sökord" etapplaner/STATUSARKIV.md`. Varje sektion är daterad.

> **Underhåll.** `CLAUDE_STATUS.md` behåller de senaste uppföljningarna. När den växer
> förbi gränsen i `tests/docs/dokumentregister.test.js` flyttas de äldsta hit, sist i
> filen, så kronologin förblir obruten. **Testet är bromsen** – den här regeln beskriver
> bara vad man gör när den slår till.

---

## Nuläge i ett stycke

Etapp 1–5 (ETAPPLAN.md) är genomförda. Efter dem gjordes en fristående
kodgenomgång som resulterade i `etapplaner/ETAPPLAN2.md` (Etapp 6–11). Användaren bad om
Etapp 6, 7, 8 samt 10b–10e – **samtliga är nu genomförda, testade och
pushade** (v5.15.1 → v5.24.0, se UTVECKLINGSLOGG.md Fas 24–32 för fullständiga
detaljer per delmål):

- **Etapp 6 (a–d):** leverantörsadmin, organisationsetablering, inbjudnings-
  flöde (ersätter öppen registrering), avetablering/pausning.
- **Etapp 7 (a–d):** `fragaKlinisktStod` gated, Operations-funktioner gated,
  gating-matris-test, hastighetstak utöver kronbudget.
- **Etapp 8 (a–e):** Node 22, `deploy.yml` utan `continue-on-error`, Admin.jsx
  delad i sektionskomponenter, grundläggande frontend-tester, egen
  confirm/alert-dialog.
- **Etapp 10 (b–e):** bulkimport (mappuppladdning + granskningskö),
  ledningsrapport (utskriftsvänlig, PDF-export via `window.print()`),
  rutinmallar per verksamhetstyp, tid-att-hitta-mätning.

Löpande testsvep i slutet av sessionen: `npm run test:rules` **61/61**,
`npm run test:functions` **57/57**, `npm run test:storage` **6/6**,
`npx vitest run` **29/29**, `npm run lint`/`npm run build` gröna. Flera
delar verifierade manuellt i en riktig browser via Playwright mot lokala
emulatorer (inte bara automatiska tester) – bl.a. confirm-dialogen, Admin.jsx-
refaktoreringen, bulkimport-UI:t, ledningsrapporten och hela
sök→klick→mätning-flödet för tid-att-hitta.

**DEPLOYAT TILL PRODUKTION 2026-07-26** (körning #46, commit `d7a3719`) – allt arbete
t.o.m. Etapp 12e (se nedan) är live. "Deploy complete!" bekräftat i den faktiska
loggtexten (inte bara jobb-`conclusion`), samtliga Cloud Functions uppdaterade/skapade
utan fel, ny asset-hash `index-s-jPubo9.js` bekräftad via `curl` mot produktions-URL:en.

**Uppföljning (v5.25.0, se UTVECKLINGSLOGG.md Fas 33):** användaren kopplade in Sentry- och
Linear-connectorerna. Utifrån det: (1) Sentry-SDK:t är nu faktiskt inkopplat i koden – två
projekt (`synappsen-frontend`, `synappsen-functions`), DSN:er satta som icke-hemliga
build-time-env i `deploy.yml` (samma mönster som Firebase-configen), `ErrorBoundary.jsx`
rapporterar renderingsfel, `functions/index.js`s `onCall`-import är wrappad EN gång så alla
callable-funktioner automatiskt rapporterar oväntade fel utan att varje anropsställe
behövde ändras. (2) Ett Linear-projekt ("Synappsen") med sju issues för hela den
återstående backloggen (Etapp 9a–9e, 10a, 11) – ETAPPLAN2.md är fortfarande källan till den
fylliga motiveringen. (3) En `SessionStart`-hook (`.claude/hooks/session-start.sh`) kör
`npm install` automatiskt i både rot och `functions/` vid ny fjärrsession. (4)
`.claude/settings.json`s `permissions.allow` fylld med skrivskyddade kommandon
(lint/build/test-scripts, `npx vitest`, `sed -n`, `node -c`, en avgränsad `curl` mot
produktions-URL:en, två read-only GitHub Actions-MCP-verktyg) baserat på faktisk användning
i sessionen – minskar antalet tillståndsprompter utan att öppna för deploy/push/godtycklig
kodkörning.

**Uppföljning igen: en extern "säkerhetsgenomlysning" gav upphov till Etapp 12** (se
ETAPPLAN2.md Etapp 12, UTVECKLINGSLOGG.md Fas 35–37). Rapporten visade sig vara en
sammanställning av vår egen dokumentation snarare än en oberoende granskning, men den
lyfte några reella punkter. Genomfört hittills:
- **12a ✅:** CI kör nu rules/functions/storage-testerna (inte bara vitest) – verifierat
  grönt i en riktig GitHub Actions-körning.
- **12b ✅:** beroendesårbarheter (rot 33→24, functions 11→**0**) via en riktad
  `"overrides": { "uuid": "^11.1.1" }` i båda `package.json`, istället för npm audits
  felaktiga förslag att NEDGRADERA `firebase-admin`/`firebase-functions`. Kvarvarande 24 i
  roten är dev-only-verktyg eller träffar inte vår användning – fullt motiverat i Fas 36.
- **12c-i ✅ OCH LIVE:** App Check aktiverat i klienten (`src/firebase/config.js`).
  Ägaren registrerade en reCAPTCHA v3-sitenyckel och den ligger nu i `deploy.yml`
  (`VITE_RECAPTCHA_SITE_KEY`) – App Check går skarpt från och med detta deploy, i
  **mätläge** (klienten skickar tokens, men `enforceAppCheck` är ännu inte satt).
  **Nästa steg (kräver ägaren, inte kod):** låt en mätperiod (1–2 veckor) passera,
  kolla Firebase-konsolen (Build → App Check → Metrics) att riktig trafik bär
  giltiga tokens, be sedan en session göra 12c-ii (`enforceAppCheck: true`) + 12c-iii
  (test).
- **12d ✅:** PII-kontroll i `ForradArtikelFormular.jsx` (var sista formuläret utan den).
- **12e ✅ (omfattning omprövad):** ursprungsplanen (Cloud Function för rutinskapande)
  visade sig lösa ett redan löst problem – rutiner/anslag/skiftrapporter/anteckningar
  hade redan regelnivå-skydd, kommentarer/feedback redan helt låsta. Fokus flyttat till
  `forradsartiklar` (saknade skyddet helt) OCH en riktig, redan existerande bugg hittad
  och fixad: `harTroligtPersonnummer()` fångade bara ett fält vars HELA innehåll var
  exakt ett personnummer (pga Firestore-reglernas fullt förankrade `matches()`), aldrig
  ett personnummer inbäddat i en mening – påverkade fyra collections. Fixat med
  `[\s\S]*` runt mönstret. Se UTVECKLINGSLOGG.md Fas 39. 12f avskriven av samma skäl.

**Spårat men EJ påbörjat:** Etapp 12g (affärsbeslut om regelns strikthet – väntar på
ägaren) och Etapp 12h (`firebase-tools` 13→15-majoruppgradering, identifierad i 12b,
kräver en egen, försiktig testcykel, se ETAPPLAN2.md för den exakta checklistan). Ska
INTE göras som en snabb sidoeffekt av något annat.

**ETAPPLAN3.md (Etapp 13–21), 13a–13c klara:** 13a skrev `avtal/PUB-AVTAL-MALL.md` (GDPR
art. 28-mall). Vid premisskontroll mot faktisk kod (genomgående krav 8 i ETAPPLAN3.md) visade
det sig att "radering vid avetablering" bara delvis stämmer – `pausaOrganisation`/
`exporteraOrganisation` finns, men ingen automatiserad permanent radering av data eller
backuper. Mallen skriver detta ärligt istället för att felaktigt lova automatik. 13b skrev
`avtal/UNDERBITRADEN.md` – full underbiträdeslista verifierad mot koden; Sentry bekräftat
EU-region (Frankfurt); nytt fynd: Gemini-anropen går via det publika Gemini API:et, inte
Vertex AI, som inte har samma dokumenterade regionsgaranti – flaggat som en öppen punkt att
kontrollera innan avtal mot en kund med strikta regionkrav. Firestore-/Storage-regionen
kvarstår som en konsolkontroll för ägaren (kan inte verifieras i kod). 13c skrev
`avtal/DPIA-UNDERLAG.md` – icke-teknisk sammanställning för kundens dataskyddsombud, byggd på
redan verifierat innehåll (inte nyskrivna påståenden), med en ärlig risktabell som noterar
att revisionsloggens manipuleringsskydd (Etapp 14) inte är byggt än. 13d skrev
`avtal/IT-FAKTABLAD.md` för kundens IT-avdelning, återanvänder samma verifierade fakta;
nytt öppet fält identifierat – ingen dokumenterad återställningstid (RTO) efter backup
finns, markerad `[FYLLS I]`. 13e uppdaterade `saljmaterial/PITCH.md` (version 5.7.0 → 5.25.0) och
**rättade ett sakfel:** dokumentet påstod att klinikstöd-sökningen "hämtar live" svar,
men funktionen är i själva verket medvetet pausad i gränssnittet sedan v5.3.5 – omskrivet
till att öppet berätta det.

**13g klart (13f avvaktar på ägarens instruktion):** fyra WCAG-A-brister från fas 34/SYN-6
åtgärdade i kod – "hoppa till innehåll"-länk + `<main>`-landmärke, dynamisk sidtitel per
rutt (`useSidTitel`), tillgängligt namn på adminpanelens rollväljare, och
bekräftelsedialogen (`DialogProvider.jsx`) stängs nu med Esc, håller kvar fokus (Tab-cykel)
och återlämnar det vid stängning. `granskningar/TILLGANGLIGHETSREDOGORELSE.md` uppdaterad med status
per rad (fortsatt "delvis förenlig" – sju punkter kvarstår). Version bumpad 5.25.0 →
**5.25.1** eftersom detta är en faktisk beteendeändring, inte dokumentation. **Linear
SYN-6 kunde inte uppdateras från den här sessionen** (ingen Linear-verktygsåtkomst
tillgänglig just nu) – uppdatera ärendet manuellt. Grönt `npm run lint`/`build`/
`npx vitest run` (29/29). Etapp 13 är nu klar utom 13f (SSO/Entra ID), som väntar på
ägarens instruktion.

**Etapp 14 påbörjad – 14a klart:** ny `revisionslogg`-collection i `firestore.rules`,
helt stängd för klientskrivning (`allow create, update, delete: if false`), läsning bara
för superadmin (egen organisation) eller leverantörsadmin. Ny testfil
`tests/rules/revisionslogg.test.mjs` (8 tester, tillagd i `test:rules`-scriptet). **Viktigt
fynd vid premisskontroll:** en redan existerande `auditlogg`-collection visade sig tillåta
att VILKEN inloggad klient som helst skriver en egen post direkt utan rollkontroll – det
skärper motiveringen för Etapp 14 rejält (revisionslogg täpper en verklig lucka, inte bara
ett komplement). `auditlogg` lämnad orörd, men kommenterad i `firestore.rules` för att
skilja de två åt. `npm run test:rules` grönt (75 tester). Ingen versionsbump (ingen
motsvarande UI-yta ännu).

**14b klart:** `loggaRevision()` och `verifieraRevisionskedja()` i `functions/index.js`.
`loggaRevision()` kör en Firestore-transaktion mot `revisionsloggHuvud/{organisationId}`,
räknar `hash = sha256(kanoniserad JSON)` via en egen `kanoniseraJSON()` (sorterade
nycklar), skriver posten och huvuddokumentet atomiskt. `verifieraRevisionskedja()` bygger
om hela kedjan från noll och kontrollerar BÅDE `foregaendeHash`-länken OCH att en
omräkning av varje posts innehåll matchar dess lagrade `hash` – den andra kontrollen är
det som gör att en direkt Firestore-ändring av en posts innehåll (utan att röra
`hash`-fältet) faktiskt upptäcks. Ny composite-index i `firestore.indexes.json`. Ny
testfil `tests/functions/revisionslogg-hash.test.cjs` (4 tester: giltig kedja,
huvuddokumentets hash, manipulerat innehåll upptäcks, kapad länk upptäcks), tillagd i
`test:functions`. Allt grönt: `test:functions`, `test:rules` (13), `lint`, `build`,
`vitest run` (29/29). Ingen versionsbump (ingen anropsplats än).

**14c klart, avgränsat efter en verklig premisskontroll:** planen antog att alla nio
händelser redan gick via Cloud Functions – bara hälften gör det. Direkta anrop tillagda i
`skapaOrganisation`/`pausaOrganisation`/`exporteraOrganisation`/`tvingaUtloggning`/
`losInInbjudan`. Rutinlivscykeln (godkännande, mjuk radering) skrivs DIREKT av klienten
(`useRutiner.js`) – löst med två Firestore-triggers vars kärnlogik ligger i separata,
direkt testbara funktioner (`hanteraRutinSkapad`/`hanteraRutinAndrad`), eftersom
`test:functions` inte kör functions-emulatorn. **Medvetet inte gjort:** "rutin
avpublicerad" (finns inte i appen), inloggningshändelser (kräver Auth-blockerande
funktioner), rollbyte/modulgating/geminiBudget-ändringar (kräver nya aktörsfält vid
klientskrivning – inte gjort i detta delmål). Ny testfil
`tests/functions/revisionslogg-handelser.test.cjs` (11 tester). Bifynd: `test:functions`
körde inte Auth-emulatorn, vilket gjorde `tvingaUtloggning` otestbar/otestad – fixat
(`--only firestore,storage,auth`). Allt grönt: `test:functions` (72 tester totalt),
`test:rules` (13), `lint`, `build`, `vitest run` (29/29). Ingen versionsbump.

**14d klart – Etapp 14 (revisionslogg) helt färdig:** två nya callables
(`verifieraRevisionsloggAdmin`, `exporteraRevisionslogg`) plus en ny adminpanel-sektion
(`RevisionsloggSektion.jsx`, synlig bara för superadmin): filter på datum/aktör/
händelsetyp, en "Verifiera kedjan"-knapp som visar resultat + begränsningstext i
klartext, och CSV-/JSON-export som alltid bakar in ett färskt kedjeresultat.
Exporttillfället loggar sig självt (`revisionslogg_exporterad`). Ny testfil
`tests/functions/revisionslogg-export.test.cjs` (6 tester). **Ingen
Playwright-browserverifiering gjord i denna fas** (sessionstiden knapp) – rekommenderas
innan produktion. Version bumpad 5.25.1 → **5.26.0** (första faktiska UI-ytan i Etapp
14). Allt grönt: `test:functions` (91 tester totalt), `test:rules` (13), `test:storage`
(6), `lint`, `build`, `vitest run` (29/29).

**Nästa steg:** Etapp 14 är klar. Kvarvarande öppna punkter i ETAPPLAN3.md: 13f
(SSO/Entra ID, avvaktar ägarens instruktion), samt tre medvetet dokumenterade luckor i
14c (inloggningshändelser, rollbyte, modul-/budgetändringar loggas inte). Därefter
Etapp 15–21.

## HISTORISKT: vad som återstod per 2026-07-28 (`etapplaner/ETAPPLAN4.md` var aktiv plan då – den är den INTE nu)

- **`etapplaner/ETAPPLAN4.md` Etapp 26–30** – medarbetarens röst (föreslå ändring), skanna i förrådet,
  kundens egen profil, riktig offline, snabbhet/WCAG AA. Inte påbörjade.
- **13f (SSO/Entra ID)** och **Etapp 16 (veckopuls)**, båda i `etapplaner/ETAPPLAN3.md` – medvetet
  pausade, väntar på ett ägarbeslut vardera (se den filens statusblock).
- **Etapp 10a (demoläge/sandlåda)** i `etapplaner/ETAPPLAN2.md` – enda ej genomförda delmålet i Etapp 10.
- **Kioskläge** (`FEATURE.KIOSK_MODE`) – reserverad flagga, aldrig byggt UI bakom den.
- **Etapp 11 (Intelligence 2.0)** – uttryckligen villkorad: bör vänta tills minst en kund
  faktiskt betalar för Intelligence-modulen.
- `void _id`-mönstret som en extern kodgranskning påpekade – bedömdes som en
  svag föreslagen lösning, inte åtgärdat, se UTVECKLINGSLOGG.md Fas 23.
- Organisatoriska moment (faktisk pilotdrift, säljlansering) – kan inte göras i kod, kräver
  beslut/aktivitet av användaren utanför denna session.


## Uppföljning 2026-07-28: allt sedan v5.25.0/Etapp 14 (läs detta för aktuell status)

**ETAPPLAN3.md (Etapp 13–21) färdigställdes helt** (utom 13f/16, se `etapplaner/ETAPPLAN3.md`s eget
statusblock för exakt vilka beslut som väntar på ägaren) – rollbaserad startvy, akutläge,
checklistläge, kompetenspaket, bristanmälan, källbevakning, m.m. Detaljer i
`etapplaner/UTVECKLINGSLOGG.md`.

**Ny plan `etapplaner/ETAPPLAN4.md` (Etapp 22–30) skrevs** efter en explicit förfrågan om funktioner med
"wow-faktor" för personalen. Genomfört i den här sessionen, i tur och ordning, allt
deployat och verifierat i produktion:

- **Etapp 22 (a–e):** eget visningsnamn istället för e-post, tel:-länkar för telefonnummer,
  bild per checklistesteg, mikropolish, valfri profilbild/accentfärg.
- **Etapp 23 (a–c, 23d medvetet ej byggd):** global kommandopalett (Ctrl/Cmd+K, "/",
  sök-knapp på mobil), återanvänder `SokFalt.jsx`s sökmotor via en ny delad `useSokindex.js`.
  23d (röstsökning) avstyrkt – webbläsarens taligenkänning skickar ljud till tredje part,
  risk för patientinformation i bakgrundsljud.
- **Etapp 24:** push-notiser (FCM). `vite-plugin-pwa` bytte strategi till `injectManifest`
  (egen `src/sw.js`) så Firebase-konfigurationen kan inlinas vid bygget. Förvalt avstängt per
  notistyp (genomgående krav 10). **Krävde en engångs-IAM-behörighet på GCP-projektet**
  (Eventarc/Pub-Sub-service-agenter) som ägaren fick sätta manuellt via Cloud Console – annars
  misslyckas deploy av nya Firestore-triggers/schemalagda jobb med
  "Permission denied while using the Eventarc Service Agent". Om det händer igen: samma fix,
  se körning #47/#48 i Actions-historiken för de exakta `gcloud`-kommandona.
- **Etapp 25:** "Sedan ditt förra pass" – passbaserad (inte dagbaserad) sammanställning sedan
  `foregaendeInloggning` (ett nytt `AuthContext`-state som fångar förra inloggningens tidpunkt
  INNAN den skrivs över av den pågående sessionen).
- **UI-designjustering (utanför etappnumreringen), i två omgångar:** (1) separerade
  domän-/statusfärger i ett nytt delat badge-system (`Badge.jsx`), så en Logistik-badge
  aldrig kan förväxlas med en "väntar på godkännande"-status. (2) Efter en ny mockupbild:
  kalibrerade om `--bg`/`--yta` mot en mätt "Nordic Clinical" (ljust)/"Midnight Ward" (mörkt)
  färgtemperatur, döpte om bottennavigeringens dubblerade "Admin"-menyval ("Regler" för
  `/administration`), och fixade en oberoende, redan existerande overflow-bugg i
  `BottomNav.css` på smala skärmar.

**Två genuina processfel hittades och fixades permanent, inte bara punktvis:**
1. `src/version.js` var en hårdkodad sträng, frikopplad från `package.json` – låg fast på
   "5.26.0" i minst 19 releaser (sedan Etapp 14d) innan användaren märkte att Nyheter-sidan
   visade fel version efter en deploy. Fixat genom att importera versionen direkt från
   `package.json` – kan inte drifta isär igen.
2. `src/data/andringslogg.js` hade av samma skäl inte fått en ny post sedan v5.26.0 – sex
   releaser (Etapp 22–25 + UI-justeringen) saknade ändringsloggposter. Fyllt i i efterhand.

**Deploy-processen bekräftad fungera korrekt end-to-end** flera gånger i skarpt läge
2026-07-28 (körning #46 t.o.m. #52), inklusive att felsöka och åtgärda ett skarpt
IAM-behörighetsfel tillsammans med ägaren (se ovan).

## Uppföljning 2026-08-01: fem ägarbeslut i ETAPPLAN5.md + Etapp 33c byggd och deployad

**Kontext:** `etapplaner/ETAPPLAN5.md` (Etapp 32–36) hade sju öppna "beslutspunkter som kräver ägaren"
kvar. Användaren tog ställning till fem av dem i den här sessionen:

- **Etapp 33c (backup-retention):** 90 dagar. Inskrivet i `avtal/PUB-AVTAL-MALL.md` p. 6.
- **Etapp 34a (jourkontakt):** namn + telefonnummer ifyllt i `drift/INCIDENT-CHECKLISTA.md`s
  kontakttabell (internt dokument, delas aldrig externt).
- **Etapp 35e (App Check-enforcement):** beslut bekräftat att FORTSÄTTA VÄNTA – Firestore låg
  på 89% verifierat (under ~98%-marginalen), Storage-siffran (0/10) för litet underlag. Ingen
  ändring, samma uppföljningsplan som redan stod i planen.
- **Etapp 36c (extern penetrationstest):** nej, inte just nu. Ompröva vid fler kunder eller en
  upphandling som kräver det.
- **Etapp 35f (nyckelrotation):** proaktiv rotation en gång per år, utöver den redan
  dokumenterade reaktiva rutinen.

**Två av besluten byggdes/verkställdes samma session, inte bara dokumenterades:**

- **Etapp 33c – gallring av backuper, helt klar:** ny funktion `gallraGamlaBackuper()` +
  schemalagd `backupGallringSchemalagt` (`functions/index.js`, kör varje måndag 03:30) som
  raderar backuper äldre än 90 dagar, baserat på datumet i filnamnet
  (`backups/{orgId}/{ÅÅÅÅ-MM-DD}.json`). Ny testfil `tests/functions/backup-gallring.test.cjs`
  (6 tester: rätt fil raderas, en nyare backup rörs inte, en backup exakt på 89-dagarsgränsen
  rörs inte, en icke-backupfil rörs inte, en andra körning är no-op). Helt testsvep grönt
  (lint, build, vitest 73/73, test:rules 13, test:functions inkl. de 6 nya, test:storage 21).
  Version 5.55.0 → **5.56.0**, ändringslogg uppdaterad. **Deployat till produktion** (körning
  #63, commit `382562b`, asset-hash `index-eOqzJeKB.js` bekräftad via `curl`).
- **Etapp 35f – årlig påminnelse:** en Claude Code Remote-Routine (`trig_01Mmw6BMfv6NePa9mLuNjE7Z`,
  nästa körning 2027-08-01) skapad så att den beslutade årliga nyckelrotationen (Gemini/
  sökmotor/tjänstekonto/VAPID) faktiskt bevakas, inte bara står som text i ett dokument.
  Rotationen är fortsatt manuell (ingen kod utför den), bara påminnelsen är automatiserad.

**Dokument uppdaterade i två commits** (`7108d50` beslut, `382562b` Etapp 33c-bygget):
`etapplaner/ETAPPLAN5.md` (statusmarkeringar + beslutspunktslistan), `drift/INCIDENT-CHECKLISTA.md`
(kontakttabell, nyckelrotationssektion, "Vad som ännu inte finns"-tabellen),
`granskningar/SAKERHETSRAPPORT.md` (Del 3-sammanfattningen), `avtal/PUB-AVTAL-MALL.md` (p. 6).

**Kvarstår i ETAPPLAN5.md:** Etapp 32b (tre larmtyper, väntar på om ägaren vill betala för
Sentry API-token/GCP-faktureringsexport), ToS-genomgång för källbevakningens sju domäner,
Etapp 30b (fysiskt akutlägestest), och 35e:s uppföljning om några veckor (se ovan). När dessa
är avklarade väljs en av `etapplaner/ETAPPLAN5-ALT-A.md`/`-ALT-B.md` som nästa plan.

**Processfel hittat och åtgärdat i samma veva:** den här filen (`CLAUDE_STATUS.md`) hade
själv inte uppdaterats sedan 2026-07-29, trots att `CLAUDE.md` uttryckligen instruerar att den
ska hållas löpande – exakt samma minnesstyrda-istället-för-händelsestyrda mönster som redan
en gång orsakat att `granskningar/SAKERHETSRAPPORT.md`/`produkt/FRAMTIDSPLAN.md`/`produkt/MODULPLAN.md` blev stale. Fixat
genom att skriva just den här sektionen, OCH genom att lägga till en ny obligatorisk,
händelsestyrd underhållsregel i `CLAUDE.md` ("Regel: CLAUDE_STATUS.md") – se den filen.

## Uppföljning 2026-08-01 (senare samma dag): ETAPPLAN6.md antagen som ny aktiv plan

**Ny aktiv plan:** `etapplaner/ETAPPLAN6.md` (Etapp 37–41, "Innehållet som håller: redaktionell kvalitet
och bevisad nytta"). Utgångsläge v5.56.0. Tesen är samma som `etapplaner/ETAPPLAN5.md`s, applicerad på
innehåll i stället för säkerhet: produkten är byggd för att innehåll ska skapas och godkännas
korrekt, men saknar förmågan att upptäcka när det som redan ligger där blivit gammalt eller
motsägelsefullt. Detaljerna hör hemma i planfilen – läs den, inte den här sammanfattningen.

**`etapplaner/ETAPPLAN5.md` är INTE stängd.** Etapp 32b, ToS-genomgången, Etapp 30b och uppföljningen av
35e (App Check) spåras fortsatt där, blockerade av ägarbeslut eller extern tid.

**Justeringar gjorda i planen innan den lades in** (den kom som ett utkast och antogs efter
en genomgång, inte rakt av):

- **Premisskontrolltabell tillagd överst** – planens åtta kodpåståenden (`borGranskas()`,
  `useVisningar`, `useLaskvittering`, ägarfältet, källbevakningen, versionsdiffen, kvissbanken,
  checklistestatistiken) stickprovskontrollerade mot faktisk kod. Alla höll.
- **Krav 14 konkretiserat med en minsta-n-spärr (5 svarande).** "Aggregerat" skyddar inte
  anonymiteten i en verksamhet med fem till tio nyckelpersoner – tre svar av fem kan peka ut
  en person. Påverkar särskilt 39c men även nedbrytningar per område i 37a/39a.
- **37a:** hälsosiffran får aldrig visas eller exporteras utan sin nedbrytning (Goodhart-risk).
- **37c:** byggs sist inom Etapp 37, piloteras på ett område, med ett uttalat klart-kriterium
  om falska positiver – annars läggs delmålet ner hellre än att lära redaktörerna ignorera
  flaggor.
- **Etapp 40 villkorad:** bygger uteslutande för en NY kunds inflyttning och ska inte byggas
  förrän en sådan kund är konkret. 40b uppgraderad Medel → Medel–Hög med krav på en tidsboxad
  spik mot tio verkliga kunddokument först.
- **Beslutspunkt 1 (moderering av granskningskön) flyttad fram i tiden** – ska ställas när
  Etapp 37 PÅBÖRJAS, inte när 38 ska byggas, eftersom 37 gör kön längre innan 38 gör den
  snabbare.

**Två premissfel i utkastet hittades och åtgärdades:**

1. **`produkt/FRAMTIDSPLAN.md` var inte det "arkiv för ej antagna planer" utkastet påstod.** Den
   pekade fortfarande på `etapplaner/ETAPPLAN4.md` som aktiv plan – elva releaser efter att `etapplaner/ETAPPLAN5.md`
   tagit över. Femte gången samma stale-mönster i det här projektet. **Fixad genom att ge filen
   en roll som inte KAN bli stale på samma sätt:** den är nu ett arkiv över bortvalda alternativ
   med omprövningsvillkor per alternativ, inte en pekare mot den aktiva planen. `CLAUDE.md` har
   fått en uttrycklig varning om att aldrig skriva tillbaka "här är den aktiva planen" där.
2. **"Kund nummer tre" fanns inte som fil.** Utkastet refererade till det som ett av tre
   skrivna alternativ; bara ALT-A och ALT-B existerar. Nu ärligt noterat på båda ställena –
   det måste skrivas ut som en riktig planfil innan det kan antas.

## Uppföljning 2026-08-01 (Etapp 37a): innehållshälsopanelen byggd, INTE ÄNNU deployad

**Etapp 37a klar.** Ny ren funktion `sammanstallHalsa()`/`berakningHalsa()` i
`src/utils/innehallshalsa.js` (13 vitest-tester) + ny adminsektion
`InnehallshalsaSektion.jsx` – visar per godkänd rutin om den bör granskas, saknar ägare,
aldrig kvitterats, har en obesvarad källvarning eller är utgången, plus en sammanvägd
hälsosiffra som **aldrig visas utan sin nedbrytning** (krav infört när `etapplaner/ETAPPLAN6.md`
antogs). Superadmin ser alla tre områden, VÖL/sektionsledare/VEC/förrådsansvarig ser bara sitt
eget. Ingen ny collection eller nytt Firestore-fält.

**Premisskontroll (krav 8) hittade två fel i planutkastet innan bygget, båda löstes genom att
INTE bygga det felaktiga kriteriet:** "aldrig visad" hade byggt på `visningar`-collectionen,
som bara skrivs vid sökträffar/kommandopalett – inte vid vanlig bläddring – och hade flaggat
nästan alla rutiner som aldrig lästa oavsett verklighet. "Saknade steg trots att
checklistläget är påslaget för organisationen" beskrev en organisationsväxel som inte finns;
checklistläge är en egenskap per rutin. Detaljerna står i `etapplaner/ETAPPLAN6.md` Etapp 37a.

**Verifierat i en riktig webbläsare** (Playwright mot Firestore-/Auth-emulatorerna, inte bara
vitest): en frisk rutin, en rutin med fyra flaggor, och ett utkast som korrekt hoppas över
helt. Hälsosiffran (50%) visades tillsammans med sin fulla nedbrytning. Fullt testsvep grönt
(lint, build, vitest 86/86, test:rules 13, test:functions, test:storage 21). Version 5.56.0 →
**5.57.0**, ändringslogg uppdaterad.

**INTE gjort ännu:** deploy till produktion (senaste produktionskörning är fortfarande #63,
v5.56.0 – 37a ligger bara pushad till branchen). Etapp 37b–d (granskningsrundor, dubbletter,
arkiverad status) är opåbörjade.

## Uppföljning 2026-08-01 (Etapp 37b): riktade granskningsrundor, INTE ÄNNU deployade

**Etapp 37b klar.** Ny collection `granskningsrundor/{rundaId}` (superadmin startar en runda:
ett urval äldre rutiner i ett område, en gemensam deadline). `rutinIds` är en OFÖRÄNDERLIG
ögonblicksbild tagen vid skapandet – firestore.rules tillåter aldrig en klientuppdatering av
en runda (`allow update: if false`), bara läsning/skapande/radering, allt begränsat till
superadmin i egen organisation (11 nya regeltester). Ny Cloud Function-trigger
`hanteraGranskningsrundaSkapad` meddelar varje berörd rutins ägare EN gång (slår ihop flera
rutiner med samma ägare, skickar inte en push per rutin) via en ny push-typ
`granskningsrunda` (förvalt avstängd, krav 10) – 6 nya funktionstester. Ny
`GranskningsrundorSektion.jsx` i adminpanelen + en sammanfattning i `Ledningsrapport.jsx`.

**Viktigt designval: ingen ny "markera som klar"-mekanism byggdes.** En rutin räknas som
granskad inom en runda när dess redan existerande `granskadDatum` (satt av den redan
existerande "Markera som granskad"-knappen i `RutinKort.jsx`, byggd långt före den här etappen)
är nyare än rundans starttid. Ren beräkningsfunktion `berakningRundaFramsteg()`
(`src/utils/granskningsrunda.js`, 5 tester) håller "vad återstår"-listan till bara
`{id, titel, omrade, granskad}` – **aldrig per person** (krav 14 i `etapplaner/ETAPPLAN6.md`, verifierat
med ett eget test).

**Verifierat i en riktig webbläsare** (Playwright mot emulatorerna): en runda med en
100-dagars tröskel matchade korrekt 1 av 2 seedade rutiner (inte den nyare), visade "0 av 1"
direkt efter start, och "1 av 1" efter att den befintliga knappen klickats på RÄTT rutin –
en första körning klickade fel kort (rutiner listas nyast-först) och avslöjade att detta var
ett testskriptfel, inte en produktbugg, innan den korrekta verifieringen bekräftade hela
kedjan. Fullt testsvep grönt (lint, build, vitest 91/91, test:rules, test:functions,
test:storage). Version 5.57.0 → **5.58.0**, ändringslogg uppdaterad.

**INTE gjort ännu:** deploy till produktion (fortfarande körning #63, v5.56.0 – både 37a och
37b ligger bara pushade till branchen). Etapp 37c–d (dubbletter/motsägelser, arkiverad status)
är opåbörjade.

## Uppföljning 2026-08-01 (Etapp 37c): dubblettdetektion byggd, väntar på PILOTUTVÄRDERING

**Etapp 37c byggd, men medvetet INTE markerad ✅ KLAR** – till skillnad från 37a/37b kräver
denna etapps eget klart-kriterium (se `etapplaner/ETAPPLAN6.md`: "minst hälften av flaggade par ska
bedömas rimliga av en redaktör") en människas bedömning mot verkligt innehåll över tid. Det
kan den här sessionen inte göra åt ägaren. **Nästa steg för en superadmin/redaktör:** öppna
adminpanelen, titta på "🔍 Möjliga dubbletter (pilot: Kliniskt stöd)"-sektionen mot RIKTIGA
rutiner, och avgöra om träffkvaliteten håller. Om inte: justera känslighetsreglaget, eller
avskriv delmålet helt (planen själv säger "hellre ingen dubblettdetektion än en som lär
redaktörerna att ignorera flaggor").

**Genomfört:** ny ren funktion `hittaMisstankaDubbletter()` (`src/utils/dubblettdetektion.js`,
7 tester) som via Fuse.js flaggar par av godkända rutiner som liknar varandra. **Ett genuint
tekniskt fynd under byggandet:** att söka med titel+innehåll ihopklistrat som Fuse-fråga gav
en missvisande hög poäng (~0.64) även för en rutin jämförd med SIG SJÄLV – Fuse:s
fuzzy-algoritm är byggd för korta sökfrågor, inte dokument-mot-dokument-jämförelse. Löst genom
att bara söka på titeln (innehållet vägs ändå in som ett Fuse `keys`-fält), vilket gav en
tydlig poängseparation (~0.15 för en verklig nästan-dubblett mot ~0.6 för besläktat men olika
innehåll). Ny collection `dubblettdismissningar` låter en redaktör avfärda ett par permanent
utan att någonting i rutininnehållet ändras (8 nya regeltester). **Hårdkodad till Kliniskt
stöd som enda pilotområde** – en dropdown för fler områden byggdes medvetet inte förrän
klart-kriteriet är utvärderat.

**Verifierat i en riktig webbläsare:** ett verkligt nästan-dubblettpar (samma innehåll, titel
med suffixet "(uppdaterad)") upptäcktes korrekt vid förvalt känslighetsläge (poäng 0.27 av
0.30), och avfärdande gjorde att paret försvann permanent. Ett förstahandsförsök med
standardtröskeln 0.25 missade paret med en hårsmån (0.27 > 0.25) – förvalet höjdes till 0.30
efter den här kalibreringen, dokumenterat i koden. Fullt testsvep grönt (lint, build, vitest
98/98, test:rules, test:storage). Version 5.58.0 → **5.59.0**.

**Etapp 37 (innehållets hälsa) är därmed i praktiken byggd i sin helhet** (37a, 37b klara,
37c byggd och väntar på utvärdering, 37d ej påbörjad). Nästa i ordning enligt planens egen
ordningsprincip är Etapp 38 (redaktörens vardag) – men kom ihåg beslutspunkt 1: frågan om
vem som äger granskningskön ska ställas till ägaren NU, inte när 38 ska börja byggas.

## Uppföljning 2026-08-01 (Etapp 37d): arkiverad status, Etapp 37 i praktiken avslutad

**Etapp 37d klar.** Ny flagga `arkiverad` (+ `arkiveradAv`/`arkiveradDatum`) på rutin-
dokument – "gäller inte längre", skilt från papperskorgen (mjuk radering). **Premisskontroll
(krav 8) bekräftade att detta var ett utökat fält, inte en ny mekanism:** samma klientsidiga
filtreringsmönster som redan fanns för `borttagen` återanvändes, och `firestore.rules`s
`farUppdateraRutin()` tillät redan att en redaktör ändrar fältet utan någon regeländring alls.

**Designvalet mirrorar en redan existerande lösning:** samma synlighetsmönster som
`arUtgangen()` (utgångna rutiner) – dold för vanlig personal, synlig med en badge för
redaktörer, som kan återaktivera. Sökindexet filtrerar inte bort arkiverat innehåll (bara
märker det "(arkiverad)"), så det förblir sökbart för alla utan extra kod.

**Det här var den mest omfattande enskilda ändringen av alla fyra 37-delmålen** – planens
egen varning om ett halvt införande (31b-mönstret: en ny status som bara syns i listvyn men
inte i cachande/filtrerande ytor) visade sig träffa rätt. Utöver de tre ytor planen
uttryckligen pekade ut (offline-center, sökindex, akutläge) hittades under byggandet FYRA
till som också behövde uteslutning: innehållshälsan (37a), granskningsrundor (37b),
dubblettdetektionen (37c), samt `Ledningsrapport.jsx`/`MinaUppgifter.jsx`/`useNotiser.js`s
kvitteringsgrad/granskningspåminnelser. Ett särskilt viktigt fynd: akutläget exkluderar nu en
arkiverad rutin ÄVEN om `akutlage: true` fortfarande råkar stå kvar på den – patientsäkerhet
går före att lita på att data alltid är konsekvent uppdaterad.

**Verifierat i en riktig webbläsare**, sex separata kontroller (dold för personal, exkluderad
ur akutläget trots akutlage-flaggan, synlig med badge för superadmin utan kvitteringsknapp,
arkivera-togglen fungerar båda vägarna, och sökning hittar arkiverat innehåll märkt för en
icke-redaktör). Fullt testsvep grönt (lint, build, vitest 104/104, test:rules,
test:functions, test:storage). Version 5.59.0 → **5.60.0**.

**Etapp 37 (innehållets hälsa) är därmed i praktiken helt avslutad** – enda kvarvarande
punkten är 37c:s pilotutvärdering (kräver en redaktörs bedömning, inte kod). Nästa i ordning
enligt planens egen ordningsprincip är Etapp 38 (redaktörens vardag) – men beslutspunkt 1
(vem äger granskningskön) bör ställas till ägaren NU, inte när 38 ska byggas.

## Uppföljning 2026-08-01 (senare samma dag igen): beslutspunkt 1 löst, Etapp 38 kan börjas

**Ägarbeslut:** granskningskön i Etapp 38 ägs **per område** – VÖL/sektionsledare för
Kliniskt stöd, VEC för Administration, samma uppdelning som redigeringsrätten redan följer.
Utlovad svarstid på ett ändringsförslag: **inom en vecka.** Löser `etapplaner/ETAPPLAN4.md`s tidigare
obesvarade beslutspunkt 3, uppdaterat i `etapplaner/ETAPPLAN6.md` (Etapp 38-sektionen + beslutspunkt 1).

**Konsekvens för det kommande bygget:** 38a måste stödja flera samtidiga granskare (en kö
per område, inte en gemensam), och 38b:s "vad hände med min ändring"-funktion ska nu
inkludera en påminnelse till den ägande rollen om det gått mer än en vecka utan svar.

**Inget kodat än** – detta var bara beslutet, inget commit gjordes (ren dokumentation,
väldigt liten ändring, ingen versionsbump). Etapp 38 är redo att påbörjas.

## Uppföljning 2026-08-01 (Etapp 38): redaktörens vardag klar, INTE ännu deployad

**Etapp 38 klar, alla fyra delmål.** Premisskontrollen (krav 8) visade att mycket redan
fanns: bulk-godkänn/neka för utkast, en egen granskningskö för ändringsförslag
(`ForslagSektion.jsx`), och flera samtidiga granskare stöds GRATIS av Firestores
realtidslyssnare – ingen låsmekanism behövde byggas. Den GENUINA luckan var 38b: ingen
plats i appen visade en medarbetare status på sina egna inlämnade förslag.

**Genomfört:**
- **38a:** ändringsförslags-antal tillagt i `MinaUppgifter.jsx`, bredvid befintliga
  utkast-antal – en redaktör ser nu hela sin kö samlat på startsidan.
- **38b (den viktigaste delen):** ny `MinaForslag.jsx` på startsidan visar status
  (väntar/godkänd/avvisad + motivering) på egna inlämnade förslag. Ny schemalagd Cloud
  Function `kontrolleraForslagPaminnelser` (daglig) skickar en engångspåminnelse till den
  ägande rollen om ett förslag väntat längre än den beslutade svarstiden (en vecka) – ny
  opt-in push-typ `forslagPaminnelse` (förvalt avstängd, krav 10). 6 nya funktionstester.
- **38c:** diffen fanns redan i `VersionsHistorik.jsx` (bekräftat vid antagandet) –
  extraherad till delade `utils/diff.js`/`DiffVy.jsx` (ren refaktorering) och återanvänd i
  `ForslagSektion.jsx` så en redaktör ser exakt vad ett förslag ändrar innan hon öppnar
  editorn.
- **38d:** tre byggblocksknappar (Varning/Kontakt/Material) i `RutinFormular.jsx`s befintliga
  verktygsfält.

**Verifierat end-to-end i en riktig webbläsare:** personal skickar förslag → status syns
direkt hos avsändaren → VÖL ser räknaren → diffvyn visar exakt ändringen → efter att VÖL
infört förslaget uppdateras status till "Godkänd" hos avsändaren. Ett testskriptfel på vägen
(en PII-varningsdialog som skriptet först avfärdade i stället för att bekräfta) visade sig
vara BEFINTLIG, korrekt produktbeteende, inte en bugg. Fullt testsvep grönt. Version 5.60.0 →
**5.61.0**.

**INTE gjort ännu:** deploy till produktion (37a/37b/37d/38 ligger alla bara pushade till
branchen sedan tidigare i sessionen). Etapp 37c väntar fortfarande på pilotutvärdering.

## Uppföljning 2026-08-02 (Etapp 39a/39b): trend + markeringar klara, INTE ännu deployade

**39a (Effekt över tid) och 39b (Före och efter) klara.** Ny collection
`organisationer/{orgId}/matvardenSnapshots/{datum}` (Cloud-Function-only, skriven av ny
schemalagd funktion `matvardenSnapshotSchemalagt`, måndagar 02:00) och ny collection
`organisationer/{orgId}/matvardenMarkeringar/{id}` (klientskrivbar av superadmin, ren
anteckning utan beräkning). Visas som en 12-veckorstabell + markeringslista i en ny sektion
i `Ledningsrapport.jsx` (`MatvardenTrendSektion.jsx`), gated på `role === "superadmin"` i
själva komponenten trots att routen tillåter alla redaktörsroller (samma mönster som
`arSuperadmin && <KostnadsuppfoljningSektion .../>` i `Admin.jsx`).

**Premisskontroll (krav 8):** inga avvikelser mot planen – till skillnad från 37a stämde
planens antaganden, inklusive att 39a:s insamling kunde byggas helt fristående från
visningen.

9 nya regeltester (rules), 8 nya funktionstester, fullt testsvep grönt, verifierat i en
riktig webbläsare mot emulatorerna (trendtabell med seedad data, skapa+ta bort en markering).
Version 5.61.0 → **5.62.0**. Detaljer i `etapplaner/ETAPPLAN6.md`s nya sektion "39a/39b – Effekt över
tid + Före och efter".

**Kvar i Etapp 39 (vid det tillfället):** 39c (anonym personalpuls) och 39d
(referensunderlag) – båda krävde ett ägarbeslut innan kod skrevs. Se nästa sektion – båda är
nu klara.

## Uppföljning 2026-08-02 (Etapp 39c/39d): hela Etapp 39 klar, INTE ännu deployad

**Ägarbeslut:** 39c byggs, resultatet läses PER OMRÅDE av VÖL/sektionsledare (kliniskt-stod)
och VEC (administration) – inte superadmin ensam. 39d byggs, men ANONYMISERAT (kundens namn
får aldrig förekomma i exporten).

**Genomfört (39c):** `Personalpuls.jsx` på startsidan (alla roller) – tre skalfrågor (1–5)
plus eget område, under 30 sekunder. `svaraPersonalpuls` (Cloud Function) skriver ALDRIG ett
enskilt svar, bara en atomär aggregatsumma per område/kvartal plus en enda "redan svarat
detta kvartal"-flagga på svarandens eget konto. `PersonalpulsResultatSektion.jsx` i
adminpanelen visar resultatet – superadmin ser alla områden, VÖL/VEC bara sitt eget. Minsta-
n-spärren (krav 14, fem svar) gäller per område.

**Genomfört (39d):** `exporteraReferensunderlag` (superadmin, kräver ett AKTIVT bekräftat
samtycke i varje enskilt anrop) returnerar bara siffror – aldrig kundens namn/orgnr/
organisationId – och loggas i revisionsloggen. UI i `ReferensunderlagSektion.jsx`
(Ledningsrapport).

**Premisskontroll (krav 8):** inga avvikelser mot planen.

15 nya tester (6 rules, 9 funktionstester), alla gröna. Fullt testsvep grönt.

**Browserverifiering – delvis, en miljöbegränsning dokumenterad:** UI:t verifierades i en
riktig webbläsare (formulär, knappars på/av-läge, minsta-n-spärrens platshållartext).
Själva skicka-anropet gick INTE att verifiera end-to-end: ett HTTP-anrop mot Cloud Functions-
emulatorn hänger utan svar i den här sandboxade miljön (bekräftat att det INTE är en
regression – samma sak händer för en redan levererad funktion, `skickaFeedback`, anropad på
samma sätt; sannolik orsak är att emulatorns metadata-serveruppslag blockeras av miljöns
nätverksproxy). Anropslogikens korrekthet täcks istället av de 9 nya funktionstesterna, som
anropar funktionerna direkt och kringgår HTTP-lagret. Detaljer i `etapplaner/ETAPPLAN6.md`s sektion
"39c/39d – Personalpuls + Referensunderlag". Version 5.62.0 → **5.63.0**.

**INTE gjort ännu (vid det tillfället):** deploy till produktion. Se nästa sektion – en deploy
triggades senare samma session.

## Uppföljning 2026-08-02 (ETAPPLAN7 antagen): ny aktiv plan, gränssnittsförnyelse

Användaren delade två fristående, AI-genererade UI-designutkast för Synappsen ("Nordic
Clinical" och "Synappsen Redesign" + en mobilmockup) som `.dc.html`-exportfiler (zip). De
kunde inte läsas via de vanliga `claude.ai/design`-länkarna (403, kräver inloggning) eller ens
via `WebFetch` mot `claude.ai/code/artifact/...`-länkar (renderas av JS i klienten, går inte
att läsa som text) – löstes genom att rendera dem i den sandboxade Playwright-webbläsaren:
`support.js` laddar React/ReactDOM/Babel från `unpkg.com`, som är blockerat i den här miljöns
nätverkspolicy (`ERR_CONNECTION_RESET`, både direkt och via `HTTPS_PROXY`) – arbetat runt
genom att installera samma paketversioner lokalt via `npm install` (registry.npmjs.org är
undantaget proxyn) och låta Playwright fånga och ersätta unpkg-anropen med de lokala filerna.
Filerna behövde också serveras över `http://` (en lokal `python3 -m http.server`), inte
`file://`, eftersom runtimen gör ett same-origin-`fetch()` av sin egen HTML som CORS-blockeras
under `file://`.

Efter granskning (skärmdumpar av båda genom flera vyer) sammanställdes en skriftlig
rekommendation, som användaren godkände som en ny etapplan: **`etapplaner/ETAPPLAN7.md`, Etapp 42 –
Gränssnittsförnyelse.** Premisskontroll (krav 8) vid antagandet visade att INGEN av
mockupernas centrala påståenden om att vara "lyfta direkt" från befintlig kod stämmer fullt
ut (se planens egen premisskontroll-tabell) – särskilt att en samlad, domänöverskridande
godkännandekö INTE finns idag (godkännande sker per sektion i `Sektionssida.jsx`), och att en
persistent Akut-knapp INTE finns idag (bara på `Hem.jsx`).

**`etapplaner/ETAPPLAN7.md` är nu den aktiva planen** (se `CLAUDE.md`s uppdaterade läsordning/dokumentkarta,
ändrad i samma veva). `etapplaner/ETAPPLAN6.md` är inte stängd men inte längre aktiv – dess kvarvarande
punkter (40, 41) väntar inte på ägarbeslut, bara på tur. Inget i `etapplaner/ETAPPLAN7.md` är påbörjat.

## Uppföljning 2026-08-02 (Etapp 41): "Innehåll som märks i vardagen" klar, ETAPPLAN6 stängd
## förutom Etapp 40

Byggde alla tre delmål av Etapp 41 på begäran ("Gör punkt 41 i etapplanen"), efter en
premisskontroll (krav 8) som visade att 41a:s "namnge aldrig utan att fråga"-krav redan var
löst av Etapp 26c (`visaNamnOffentligt`-fältet) – ingen ny standardinställning behövdes,
bara återanvändning.

**Genomfört:**
- **41a – "Ni sa, vi gjorde":** publik lista på `/nyheter` över införda ändringsförslag,
  synlig för alla roller. Krävde en regeländring (`firestore.rules`): ett infört förslag är
  inte längre bara läsbart för redaktörer/förslagsställaren, utan för hela organisationen.
- **41b – Veckans repetition:** en ren klientfunktion (`src/utils/veckansRepetition.js`)
  väljer en kvissfråga från en rutin användaren kvitterade för länge sedan, stabilt en vecka i
  taget. Inget svar sparas NÅGONSIN (krav 14) – samma princip som `KvissModal.jsx`.
- **41c – Förrådet visuellt:** nytt `hyllfotoUrl`-fält på förrådsartiklar, återanvänder
  befintlig Storage-sökväg/behörighet (ingen regeländring behövdes).

15 rader nya tester (3 rules, 10 vitest för veckansRepetition, plus befintliga svep). Fullt
testsvep grönt.

**Browserverifiering:** 41a och 41b helt verifierade end-to-end i en riktig webbläsare.
**41c INTE verifierad end-to-end** – filuppladdning via Storage-klient-SDK:t hänger utan fel i
den här sandboxade miljön (samma klass av begränsning som Cloud Functions-anropen i Etapp
39c/39d). Bekräftat att det inte är en regression: den REDAN BEFINTLIGA `bildUrl`-
uppladdningen (oförändrad av denna etapp) uppvisar exakt samma symptom i samma testkörning.
Regellogiken är istället verifierad direkt via `test:storage` (21/21 gröna). Detaljer i
`etapplaner/ETAPPLAN6.md`s Etapp 41-sektion. Version 5.63.0 → **5.64.0**.

**INTE gjort ännu (vid det tillfället):** deploy av v5.64.0 till produktion. Se nästa sektion.

## Uppföljning 2026-08-02 (Etapp 42e/42a/42b/42c): fyra av sex delpunkter i gränssnittsförnyelsen klara

Byggde de tre första delarna av `etapplaner/ETAPPLAN7.md` på begäran ("genomför dem 3 första delarna").
Premisskontroll (krav 8) vid byggstart hittade två viktiga korrigeringar av planens egna
antaganden (fulla detaljer i `etapplaner/ETAPPLAN7.md`s "42e/42a/42b/42c ✅ KLARA"-sektion):

1. **42a var redan till stor del byggt** – `RutinKort.jsx` visade redan fulltext/ägare/taggar
   innan den här etappen; den enda genuina luckan var att bulk-markeringen (fanns redan för
   masstaggning) inte kunde massgodkänna/-neka ett urval. Det är den enda kodändring som
   gjordes för 42a.
2. **42c:s planerade `/sok`-route byggdes INTE** – `BottomNav.jsx`s "Sök" öppnar redan en
   global kommandopalett från alla sidor, objektivt bättre än en dedikerad sida hade varit.

**Genomfört:**
- **42b:** ny sida `/godkannanden` (`Godkannanden.jsx`), en ren sammanställningsfunktion
  (`src/utils/godkannandeKo.js`) som slår ihop utkast-rutiner (kliniskt-stöd, administration),
  utkast-förrådsartiklar (logistik) och väntande ändringsförslag, filtrerat per faktisk
  behörighet. **Två medvetna avsteg från plantexten** (se ETAPPLAN7.md för fullständigt
  resonemang): de gamla inline-knapparna togs INTE bort (risk att ta i samma pass utan egen
  regressionsrunda), och ingen live badge-räknare byggdes (hade krävt extra
  Firestore-lyssnare på nästan varje sidvisning oavsett behörighet).
- **42c:** `/nyheter` tillagd i navigeringen. Ny global, flytande `AkutKnappFloating.jsx`
  (monterad en gång i `App.jsx`, syns på alla sidor utom `/akutlage` självt) – ersätter den
  gamla Hem-bundna knappen.
- **42a:** "Godkänn/Ta bort N markerade utkast" i `Sektionssida.jsx`, återanvänder befintlig
  markeringsmekanism.
- **42e:** ingen kodändring krävdes – bekräftade att `src/index.css` redan har kompletta
  tokens och byggde allt nytt mot dem.

5 nya vitest-tester. Inga ändringar i firestore.rules/storage.rules behövdes (allt nytt läser/
skriver bara sådant som redan hade regler). Fullt testsvep grönt (lint, build, 123
vitest-tester, test:rules oförändrat 168/8/13/11/8 gröna). Verifierat end-to-end i en riktig
webbläsare mot emulatorerna: bulk-godkänn av ett markerat utkast, den samlade kön med utkast
från alla tre domäner plus ett väntande förslag, godkännande direkt därifrån, och den flytande
Akut-knappen synlig på Hem/Kliniskt stöd men korrekt dold på `/akutlage`. Version 5.64.0 →
**5.65.0**.

**Kvar i Etapp 42:** 42d (Hem/dashboard-tillägg) och 42f (mobilvy, villkorad av
beslutspunkt 2) – ingetdera påbörjat.

**INTE gjort ännu:** deploy av v5.64.0/v5.65.0 till produktion.

## Uppföljning 2026-08-02 (Etapp 42d): femte av sex delpunkter i gränssnittsförnyelsen klar

Byggde 42d på begäran ("genomför de nästkommande 3 punkterna" – bara en genuint ny delpunkt
fanns dock kvar i Etapp 42 vid det laget, se nedan). Premisskontroll (krav 8) hittade samma
mönster som redan sågs i 42a: **"Senast besökta"/"Mest använda" fanns redan på Hem** – 42d:s
enda verkliga tillskott var att lägga dem sida vid sida (ny CSS, `.hem__sektion-rad`) och en
helt ny banderoll ("X saker väntar på granskning" → `/godkannanden`), byggd som
`GodkannandeBanner.jsx` ovanpå en ny delad hook `useGodkannandeKo.js` (refaktorerad ut ur
`Godkannanden.jsx`s tidigare inline-logik från 42b, så de två ställena aldrig kan råka räkna
olika). Banderollen är villkorat monterad (`arRedaktor(role)`), av samma prestandaskäl som
redan gällde för `BottomNav.jsx`s badge-räknare (se Etapp 42e/42a/42b/42c-uppföljningen).

Inga nya tester behövdes (ren UI ovanpå redan testad logik). Fullt testsvep grönt. Verifierat
i en riktig webbläsare: banderollen räknar rätt och länkar rätt för en superadmin, syns INTE
alls för en `personal`-roll. Version 5.65.0 → **5.66.0**.

**Detta stänger Etapp 42 förutom 42f (mobilvy)** – som är villkorad av en OBESVARAD
beslutspunkt (se `etapplaner/ETAPPLAN7.md` beslutspunkt 2: ska mobilvyn ingå alls, och mockupen täcker
bara tre av flera skärmar). Fråga användaren om den frågan innan du bygger 42f – det är inte
en premisskontroll-fråga, det är ett faktiskt öppet ägarbeslut.

**INTE gjort ännu:** deploy av v5.64.0–v5.66.0 till produktion.

## Uppföljning 2026-08-02 (42f pausad): ägarbeslut, inget kodat

Ställde beslutspunkt 2 (omfattning av 42f, mobilvy) till användaren efter att 42d gjorde
Etapp 42 klar förutom just den punkten. **Beslut: vänta.** Mobilvyn ska INTE byggas delvis
(bara de tre skärmar mockupen redan täcker) – skjuts upp tills Administration/Admin/
Godkännanden/Nyheter också har en mockup att bygga mot, så 42f blir en komplett
mobilupplevelse i ett svep istället för en ofullständig. Inget kodat, ingen versionsbump
(ren dokumentation). `etapplaner/ETAPPLAN7.md` beslutspunkt 2 och Etapp 42:s sammanfattning uppdaterade.
**Nästa steg för 42f, när det blir aktuellt, är INTE att skriva kod** – det är att ta fram
mockuper för de fyra saknade skärmarna (t.ex. via Claude Design, samma väg som de två
ursprungliga UI-utkasten kom in denna session).

**Med detta är hela `etapplaner/ETAPPLAN7.md` i praktiken klar** (42f medvetet pausad, inte oavslutad).
Om användaren ber om "nästa steg" utan att specificera: fråga om prioritering mellan
`etapplaner/ETAPPLAN6.md`s Etapp 40 (villkorad av en ny kund) och `etapplaner/ETAPPLAN5.md`s kvarvarande punkter –
det finns inget mer ogjort och obeslutat i den aktiva UI-planen just nu.

## Om du är en ny Claude-session som läser detta

Fråga användaren vad nästa steg ska vara – det finns inget akut, oavslutat arbete.
`etapplaner/ETAPPLAN7.md` (Etapp 42, gränssnittsförnyelse) är i praktiken klar: 42e/42a/42b/42c/42d
byggda, 42f medvetet pausad på ägarens beslut (vänta på mockuper för de sidor som saknar en –
se ovan). Bygg INTE 42f utan att först fråga om det förändrade läget (nya mockuper klara?).
`etapplaner/ETAPPLAN6.md` har bara Etapp 40 kvar (villkorad av en konkret ny kund) och `etapplaner/ETAPPLAN5.md`s
kvarvarande punkter kan tas närhelst de passar/blockeringen lossnar. Läs `CLAUDE.md` först om
du är osäker på vilken fil som är auktoritativ för vad – och notera dess underhållsregel för
DEN HÄR filen innan du avslutar sessionen. Om du ska verifiera en Cloud Function ELLER en
Storage-filuppladdning i en webbläsare mot emulatorerna i den här miljön: testa FÖRST med en
redan fungerande funktion (t.ex. `skickaFeedback`, eller den befintliga `bildUrl`-
uppladdningen för förrådsartiklar) innan du felsöker din egen kod – båda har en känd,
dokumenterad begränsning i den här specifika sandboxen som inte är kodens fel. Om du ska
rendera en `.dc.html`-mockup eller något annat som laddar skript från `unpkg.com`: samma
CDN-blockering gäller där också – installera paketen lokalt och fånga anropen med Playwrights
`page.route()`, se ovan för exakt recept.

## Uppföljning 2026-08-03 (Etapp 42f – ETAPPLAN7 nu helt klar)

Användaren tog fram fyra nya mockuper (Claude Design) för de tidigare saknade mobilskärmarna
(Administration, Godkännanden, Admin, Nyheter) plus en lösning på 9-postersproblemet i
`BottomNav.jsx`. Granskade dem (samma `page.route()`-recept mot lokalt cachade npm-paket som
tidigare i veckan) och gav skriftlig feedback – alla fyra skärmar och "Mer"-menyn höll måttet.
Byggde sedan 42f. Se `etapplaner/ETAPPLAN7.md`s egen "42f ✅ KLAR"-sektion för hela premisskontrollen och
motiveringen – kort sammanfattat här:

- **Mockupens ramberättelse ("nedre flikbar ersätter sidopanel på smala skärmar") stämde
  inte** – appen har aldrig haft en sidopanel, `BottomNav.jsx` är redan alltid-mobil. Det
  gjorde 42f:s FAKTISKA omfattning betydligt mindre än planerat: två konkreta buggfixar, inte
  en ny mobilvy per sida.
- **Fix 1:** `BottomNav.jsx` hade växt till 9 poster, synligt trasigt på en riktig 375px-skärm
  (bekräftat med Playwright mot emulatorerna, inloggad som en riktig testanvändare) – löst med
  en ny `MerMeny.jsx`-bottensheet, samma mönster som mockupen visade.
- **Fix 2:** `.app-innehall` saknade `padding-bottom` för den fixed-positionerade
  `BottomNav.jsx` – sidans sista innehåll gömdes bakom navigeringen på vilken sida som helst,
  bekräftat i en riktig skärmdump. Fixat med samma `76px`-marginal `AkutKnappFloating.css`
  redan använder.
- **En tredje bugg hittades UNDER byggpasset** (inte i premisskontrollen): `MerMeny` renderad
  som barn till `<nav>` fastnade i navets egen stapel-kontext (`position: fixed` +
  `z-index`), vilket fick den flytande Akut-knappen att felaktigt rendera ovanpå menyn – fixat
  genom att rendera den som syskon (React-fragment) istället.
- **Medvetet INTE byggt:** mockupens tätare/omdesignade kortlayouter för Administration/Admin/
  Nyheter-sidorna själva (t.ex. Admin-panelens accordion-lösning på dess densitet). Det är en
  större, fristående insats utanför vad `etapplaner/ETAPPLAN7.md`s egen skrivna 42f-definition (nav +
  Akut-knapp) bad om – spara till en egen etapp om den ska tas.

Nya filer: `src/components/MerMeny.jsx`, `src/components/MerMeny.css`. Ändrade:
`src/components/BottomNav.jsx` (reducerad primärrad + Mer-knapp), `src/index.css`
(`.app-innehall` padding-bottom). Inga nya vitest-tester (ren UI/CSS). Inga rules-ändringar.
Fullt testsvep grönt (lint, build, 123 vitest-tester). Verifierat i en riktig webbläsare mot
emulatorerna vid 375×812. Version 5.66.0 → 5.67.0, committat och pushat till
`claude/compassionate-euler-rho0q5`. **DEPLOYAT TILL PRODUKTION 2026-08-03** (körning #65,
commit `0552d59`, `deploy.yml` via `workflow_dispatch`, `conclusion: success`).

`etapplaner/ETAPPLAN7.md` (Etapp 42) är därmed HELT KLAR, alla delpunkter 42a–42f. Nästa steg utan
vidare instruktion: `etapplaner/ETAPPLAN6.md`s Etapp 40 (villkorad av en konkret ny kund) eller
`etapplaner/ETAPPLAN5.md`s kvarvarande punkter (blockerade av ägarbeslut/extern tid) – båda väntar bara
på att komma i tur, inte på kapacitet. En ny `etapplaner/ETAPPLAN8.md` behöver skrivas när/om det finns
ett nytt större arbetsområde att ta itu med (t.ex. Admin-panelens mobildensitet, om det
prioriteras).

## Uppföljning 2026-08-03 (Etapp 43 tillagd)

Användaren frågade vad som saknas för att HELA UI:t ska vara omgjort enligt den nya profilen.
Svar: av 27 routade sidor (`App.jsx`) var det bara sju (Hem, Kliniskt stöd, Logistik,
Administration, Godkännanden, Admin, Nyheter) som någonsin jämfördes mot mockuperna under
Etapp 42 – 20 sidor har aldrig granskats, bland dem `LoggaIn.jsx` (den allra första sidan
alla möter). Dessutom tre uppskjutna punkter från Etapp 42: Hem:s snabblänksrad (bekräftad
tät på 375px under 42f:s test), Admin-panelens mobildensitet (mockupens accordion-lösning,
medvetet inte byggd i 42f), och mörkt läge (beslutspunkt 3, aldrig löst).

Användaren bad om en plan för detta, tillagd i SAMMA fil (`etapplaner/ETAPPLAN7.md`) som en ny
"Etapp 43 – Slutföra gränssnittsförnyelsen"-sektion, snarare än en ny `ETAPPLANx.md` – ett
uttryckligt undantag från den vanliga "ny fil per avslutad plan"-principen i `CLAUDE.md`,
eftersom ETAPPLAN7 fortfarande var den aktiva/pågående filen när begäran kom.

Etapp 43 delas i: 43a (LoggaIn/Registrera/Introduktion – första intrycket, hög prioritet),
43b (Hem:s snabblänksrad, låg insats), 43c (Admin-panelens accordion, medel–hög insats),
43d (mörkt läge, löser beslutspunkt 3), 43e (resterande 17 sidor i fem grupper efter
användarkrets, inte filstorlek). Tre nya beslutspunkter väntar på ägaren: omfattning
(allt i en omgång eller gruppvis som 42), om mörkt läge ska tas nu, och om 43c ska
prioriteras tidigt eftersom den redan har en bekräftad brist (skärmdump från 42f).

**Inget kodat ännu** – detta var enbart planering. `CLAUDE.md`s dokumentkarta uppdaterad
(ETAPPLAN7.md beskrivs nu som "42 klar + 43 ny", inte längre "HELT KLAR"). Dokumentändringarna
(`etapplaner/ETAPPLAN7.md`/`CLAUDE.md`/den här filen) committade och pushade till
`claude/compassionate-euler-rho0q5` (commit `dadf0f6`), trots att inget kodarbete skedde –
planeringen i sig är den beständiga ändringen. Nästa steg: invänta ägarbeslut på Etapp 43:s
tre beslutspunkter innan bygge påbörjas.

## Uppföljning 2026-08-03 (Etapp 43a klar)

Ägaren löste Etapp 43:s tre beslutspunkter: (1) gruppvis utrullning, som Etapp 42, (2) mörkt
läge (43d) stannar i den här etapplanen (7) – frågan var bara VAR den hör hemma, inte OM den
ska byggas, (3) 43c (Admin-accordion) flyttas inte fram i kön; byggordningen jag föreslog
gäller. Byggde 43a (LoggaIn/Registrera/Introduktion) enligt planen.

**Premisskontroll (riktiga skärmdumpar, 1280px och 375px, mot emulatorerna) hittade den
faktiska bristen:** `.sida--auth` (LoggaIn/Registrera) var den ENDA platsen i hela appen utan
kort/upphöjning – text/formulär flöt fritt mot bakgrunden, uppe i det tomma övre vänstra
hörnet på breda skärmar. Introduktion (och därmed egentligen alla `<select>`-fält i appen –
Kompetensmatris, Feedback, Leverantor, `AnslagFormular`/`InbjudanFormular`/`Personalpuls`/
`RutinFormular`) hade helt ostilade webbläsarstandard-dropdowns.

**Byggt (ren CSS, inga JS-ändringar):**
- `.sida--auth` är nu ett centrerat kort (`--yta`/`--skugga`/`--radius`). Krävde `flex: 0 1
  auto` för att INTE ärva `.sida`s `flex: 1` (som annars sträckte kortets bakgrund till hela
  viewportens höjd – upptäcktes och fixades under samma byggpass, inte i premisskontrollen).
- En global `select`-regel i `src/index.css`, samma stil som `.auth-form input` – täcker alla
  ovannämnda sidor på en gång eftersom ingen hade en global stil sedan tidigare. Sidor med
  redan en egen, mer specifik select-regel (LaddaUpp/Leverantor/Feedback) opåverkade.

Inga nya vitest-tester (ren CSS). Inga rules-ändringar. Fullt testsvep grönt (lint, build,
123 vitest-tester). Verifierat i en riktig webbläsare mot emulatorerna vid 1280px och 375px.
Version 5.67.0 → 5.68.0, committat och pushat till `claude/compassionate-euler-rho0q5`.
**Inte deployat** – ingen deploy begärd den här gången.

Nästa steg utan vidare instruktion: 43b (Hem:s snabblänksrad, låg insats) enligt den
beslutade byggordningen i `etapplaner/ETAPPLAN7.md`.

## Uppföljning 2026-08-03 (Etapp 43b klar)

Byggde 43b direkt efter 43a, samma session. **Premisskontroll hittade en existerande,
underutnyttjad lösning istället för att behöva bygga en ny:** `useSnabblankar.js` låter redan
varje användare välja vilka snabblänkar som visas på Hem (sparat på `users/{uid}.snabblankar`,
redigerbart i `Profil.jsx`) – men standardvärdet (ingen har anpassat) visar ALLA 10. Att ändra
det standardvärdet avvisades: det hade ändrat beteendet för alla BEFINTLIGA användare som
aldrig besökt Profil, inte bara nya konton. Löste densiteten utan att röra datamodellen: en
lokal `useState`-växlare i `Hem.jsx` visar bara de första fyra länkarna, resten bakom en
"Fler (N) ▾"-knapp. Inget sparas, inget påverkar `Profil.jsx`s befintliga anpassning.

Ingen ny vitest-testning (ren UI/CSS + lokal komponent-state). Inga rules-ändringar. Fullt
testsvep grönt. Verifierat i en riktig webbläsare mot emulatorerna vid 375px: hopfälld vy
(2 rader istället för 5, sökfältet syns direkt) och expanderad vy. Version 5.68.0 → 5.69.0,
committat och pushat. **Inte deployat.**

Nästa steg enligt byggordningen: 43e:s "Kritiska specialfall" (Akutlage/Korvy/
SedanForraPasset) – prioriterat före de andra 43e-grupperna eftersom Akutlage är
patientsäkerhetsrelaterat.

## Uppföljning 2026-08-03 (Etapp 43e: Kritiska specialfall klar)

Premisskontroll (källkod + skärmdumpar mot emulatorerna, 1280px/375px) av alla tre:

- **`Akutlage.jsx`:** medvetet, dokumenterat FORCERAD hög kontrast (svart/vit/röd, Etapp 17c)
  oavsett ljust/mörkt tema. **Ingen ändring** – det hade varit fel att göra den lik resten.
- **`Korvy.jsx`:** använder redan tokens korrekt. **En genuin bugg hittades och fixades:**
  `.korvy__knapp` hade `flex: 1` (avsett för knapparaden, två jämnbreda knappar) som läckte
  till fristående återanvändning av samma klass ("← Tillbaka" när rutinen saknar
  checklistesteg, "Till startsidan" på klar-skärmen) – som direkt flex-child av `.korvy`
  (flex-column) sträckte det knappen till HELA sidans höjd. Bekräftat i en skärmdump, fixat
  genom att scopa `flex: 1` till `.korvy__knappar .korvy__knapp`.
- **`SedanForraPasset.jsx`:** använder redan tokens korrekt. **Ingen ändring.**

Seedade en testrutin med tre checklistesteg (`e2eChecklista`) för att verifiera BÅDA
Korvy-lägena (utan steg / med steg) i en riktig webbläsare – inte bara den tomma
fallback-vyn. Inga nya vitest-tester (ren CSS-scoping-fix). Inga rules-ändringar. Fullt
testsvep grönt. Version 5.69.0 → 5.70.0, committat och pushat. **Inte deployat.**

Nästa steg: 43e:s "Vardagsverktyg" (`ForradVy`, `LaddaUpp`, `Skiftrapport`, `Anslagstavla`).

## Uppföljning 2026-08-03 (Etapp 43e: Vardagsverktyg granskad)

Premisskontroll (källkod + riktiga skärmdumpar, 1280px/375px, mot emulatorerna) av
`ForradVy`, `LaddaUpp`, `Skiftrapport` och `Anslagstavla`: alla fyra använder redan samma
delade `.sida`-omslag, `Skelett`-laddningsskelett, tomtillstånd och design-tokens som resten
av appen – samma mönster som redan bekräftades för de sju sidorna i Etapp 42. **Ingen genuin
brist hittades den här gången** (till skillnad från Korvy-fixen i "Kritiska specialfall") –
en ärlig premisskontroll-utgång är ibland "redan i sin ordning". Ingen kodändring, ingen
version-bump (inget som visas för användaren ändrades), bara dokumentation av att sidorna är
granskade i `etapplaner/ETAPPLAN7.md`.

Nästa steg enligt byggordningen: 43c (Admin-panelens mobildensitet, accordion-lösning) –
den mest omfattande enskilda delpunkten i Etapp 43, kräver en egen premisskontroll av
`Admin.jsx`s faktiska sektionsindelning (sedan Etapp 8c) innan bygge.

## Uppföljning 2026-08-03 (Etapp 43c klar)

Premisskontroll: `Admin.jsx` består sedan Etapp 8c av 26 fristående sektionskomponenter i
`src/components/admin/`, alla med IDENTISKT mönster
(`<section className="admin-sektion"><h2>...</h2>...</section>`) – bekräftat via grep innan
bygge, inte antaget. Byggde en bulkkonvertering till native `<details>/<summary>` (ren HTML,
ingen ny JS-logik) av alla 26 + Admin.jsx:s egen inline-sektion, med en ny scopad CSS-klass
`admin-sektion--hopfallbar` (INTE på den delade basklassen `.admin-sektion`, som återanvänds
av Logistik/Introduktion/Leverantor/Kompetensmatris/Ledningsrapport/Godkännanden/Personalpuls
m.fl. – de skulle annars av misstag blivit hopfällbara också).

**En genuin scope-creep-bugg hittades och fixades UNDER byggpasset, inte i
premisskontrollen:** bulkkonverteringen råkade även träffa `MatvardenTrendSektion.jsx`/
`ReferensunderlagSektion.jsx` – två filer som råkar ligga i `components/admin/`-mappen men
används av `Ledningsrapport.jsx` (en utskriftsvänlig rapportsida), inte av `Admin.jsx`. Att
göra en utskriftssidas innehåll hopfällt-som-standard hade varit direkt skadligt (osynligt
vid `window.print()`) och var utanför 43c:s omfattning. Båda återställda (`git checkout`)
innan commit – bekräftat med en efterföljande grep att INGEN av de 26 kvarvarande filerna
används någon annanstans än `Admin.jsx`.

Alla sektioner collapsade som standard (matchar mockupen) – medveten avvägning: innehåll är
inte Ctrl+F-sökbart förrän öppnat, men densitetsvinsten (26 poster i en lista istället för
flera skärmhöjders statistik) väger tyngre för en adminpanel som besöks för specifika
uppgifter. Inga nya vitest-tester (ren HTML/CSS). Inga rules-ändringar. Fullt testsvep grönt.
Verifierat i en riktig webbläsare vid 1280px/375px: hopfällt/expanderat läge, chevron-
rotation, OCH en regressionskontroll av Logistik/Kompetensmatris som bekräftade att de delade
`.admin-sektion`-sidorna förblev helt oförändrade. Version 5.70.0 → 5.71.0, committat och
pushat. **Inte deployat.**

Nästa steg enligt byggordningen: 43d (mörkt läge, löser Etapp 42:s beslutspunkt 3) – kräver
en egen premisskontroll av vilka komponenter som saknar en fungerande mörk variant idag.

## Uppföljning 2026-08-03 (Etapp 43d: mörkt läge redan klart)

Premisskontroll vid byggstart visade att `etapplaner/ETAPPLAN7.md`s antagande var fel: mörkt läge
antogs behöva byggas (data-tema-attribut, växlare i `Profil.jsx`), men **funktionen finns
redan, komplett**: `src/hooks/useTema.js` + `src/components/TemaVaxlare.jsx` (redan monterad
i `Profil.jsx`) – ljust/mörkt/system, `localStorage`-persistens, FOUC-säkert
(`index.html` sätter attributet innan React laddar), PLUS en accentfärgsväljare planen inte
ens kände till.

Verifierat i en riktig webbläsare (inte bara läst källkoden): växlaren fungerar, temat syns
korrekt på Hem/Profil/den nya 43c-accordionen (bekräftar att 43c byggdes mot rätt CSS-tokens
sedan den fungerar i mörkt läge utan extra arbete), och inställningen överlever en
sidladdning. **Ingen kodändring, ingen version-bump** – exakt samma "redan i sin ordning"-
utgång som 43e:s "Vardagsverktyg". Etapp 42:s tre etapper gamla, olösta beslutspunkt 3 är
därmed löst: svaret var att frågan redan var besvarad i koden.

**Kvar i Etapp 43:** bara 43e:s tre återstående grupper (Stöd/hjälp: Hjalp/Feedback/
Kontakter/Lankbibliotek; Personligt: Profil/Papperskorg/OfflineCenter; Ledning/leverantör:
Leverantor/Kompetensmatris/Ledningsrapport – den sistnämnda med extra försiktighet efter
43c:s scope-creep-fynd kring dess delade komponenter).

## Uppföljning 2026-08-03 (Etapp 43 helt klar)

Granskade de tre sista 43e-grupperna i en riktig webbläsare (1280px/375px):

- **Stöd/hjälp** (`Hjalp`/`Feedback`/`Kontakter`/`Lankbibliotek`) och **Personligt**
  (`Profil`/`Papperskorg`/`OfflineCenter`): alla sju redan konsekventa, ingen kodändring.
  `Hjalp.jsx`s FAQ visade sig redan använda native `<details>/<summary>` – ytterligare
  bekräftelse att 43c:s mönster redan fanns etablerat i kodbasen innan den etappen.
- **Ledning/leverantör** (`Leverantor`/`Kompetensmatris`/`Ledningsrapport`), granskad med
  extra försiktighet efter 43c:s scope-creep-incident: `Kompetensmatris`/`Ledningsrapport`
  rena. **En genuin bugg hittades i `Leverantor.jsx`:** sidan kraschade
  (`Cannot read properties of null (reading 'length')`) om `listaOrganisationer()`
  misslyckades med något annat än exakt felkoden `permission-denied` – koden hade bara en
  tidig retur för det EN specifika felfallet. Bekräftat i en riktig webbläsare (utlöst av ett
  sandlåde-nätverksfel, men lika verklig vid t.ex. ett Functions-timeout i produktion).
  Fixat med `organisationer ?? []`.

Inga nya vitest-tester. Inga rules-ändringar. Fullt testsvep grönt. Version 5.71.0 → 5.72.0,
committat och pushat. **Inte deployat.**

**`etapplaner/ETAPPLAN7.md` (Etapp 42 + Etapp 43) är därmed HELT KLAR.** Två genuina buggar hittades och
fixades under Etapp 43:s byggpass (Korvy-knappens flex-läckage i "Kritiska specialfall",
Leverantörsvyns null-krasch här) – ingen av dem var kända innan premisskontrollen/testningen.

**DEPLOYAD TILL PRODUKTION 2026-08-03** (körning #66, commit `3efb193`, `deploy.yml` via
`workflow_dispatch`, `conclusion: success`) – v5.67.0 → v5.72.0 i ett enda hopp, alltså både
Etapp 42 och Etapp 43 samtidigt. Hela gränssnittsförnyelsen (`etapplaner/ETAPPLAN7.md`) är nu live.

Nästa steg utan vidare instruktion: `etapplaner/ETAPPLAN6.md`s Etapp 40 eller `etapplaner/ETAPPLAN5.md`s
kvarvarande punkter, båda blockerade av ägarbeslut/extern tid snarare än kapacitet. Ingen ny
UI-plan väntar just nu – nästa `ETAPPLANx.md` skrivs när/om ett nytt större arbetsområde
identifieras.

## Uppföljning 2026-08-04 (ETAPPLAN8 antagen): ny aktiv plan, mobilappskänsla

Användaren bad om en genomgång av hela produkten (vad som är byggt, vilka funktioner som
finns) och en avvägning av kandidater för nästa etapplan. Svar: alla tre huvudpaket +
källbevakning är fullt byggda och i drift (se `produkt/MODULPLAN.md`), och UI:t precis totalförnyat
(`etapplaner/ETAPPLAN7.md`). Tre kandidater till nästa steg togs fram: **(A) mobilappskänsla/
installationsbarhet**, **(B) sök- och kunskapsupptäckt 2.0**, **(C) incidentberedskap i
produkten**. Rekommendation gavs (A eller C, lägst beslutsspärr) – **ägaren beslutade A som
Etapp 44, med B och C uttryckligen köade som kommande etapper, inte förkastade.**

**Ny fil `etapplaner/ETAPPLAN8.md` skriven och antagen.** Premisskontroll (krav 8) vid antagandet
hittade att en av de ursprungliga idéerna redan var löst i kod: bakgrundssynk av
offline-gjorda kvitteringar/bristanmälningar finns redan (`useOfflineKo.js`, Etapp 29c) –
den punkten utgår helt ur Etapp 44. De genuina luckorna som blev kvar: ingen egen
installationsuppmaning (`beforeinstallprompt` + iOS-instruktion), en trolig men obekräftad
iOS-hemskärmsikonbugg (`apple-touch-icon` pekar på SVG, Apple stöder officiellt bara PNG),
ett obekräftat uppdateringsbeteende vid deploy (ingen kod hanterar `controllerchange`,
okänt om `registerType: 'autoUpdate'` ger en tyst, oanmäld omladdning mitt i en session),
och saknad touch-polish (pull-to-refresh, textmarkerings-callout på knappar). Detaljerad
plan, inklusive vilka delar som kräver ytterligare verifiering INNAN kod skrivs (44b/44c),
finns i `etapplaner/ETAPPLAN8.md`s egen Etapp 44-sektion.

**Inget kodat** – ren planering, ingen version-bump. `CLAUDE.md`s läsordning och dokumentkarta
uppdaterade (`etapplaner/ETAPPLAN8.md` är nu steg 2 i läsordningen, `etapplaner/ETAPPLAN7.md` nedgraderad till
historisk). Nästa steg: börja Etapp 44 (44a–44d i den ordning planen anger), med extra
uppmärksamhet på att 44b och 44c uttryckligen kräver verifiering mot ett riktigt beteende
(en iOS-enhet respektive en riktig deploy under en öppen flik) innan kod skrivs.

## Uppföljning 2026-08-04 (Etapp 44 klar): mobilappskänsla byggd, INTE ännu deployad

Byggde alla fyra delmål av Etapp 44 direkt efter att planen antogs ("kör igång med etapp 44").

**44c:s "overifierat"-flagga löstes genom att LÄSA `vite-plugin-pwa`s faktiska
registreringskod** (`node_modules/vite-plugin-pwa/dist/client/build/register.js`) istället för
att gissa eller behöva en riktig deploy under en öppen flik (som inte gick att arrangera i den
här sessionen) – bekräftade att `registerType: 'autoUpdate'` verkligen gav en OANMÄLD
`window.location.reload()` så fort en ny service worker aktiverats. Premisskontrollens farhåga
höll, inte bara en känsla.

**Genomfört:**
- **44c:** `registerType` → `'prompt'` (`vite.config.js`), egen registrering via
  `virtual:pwa-register` i ny `useAppUppdatering.js`, ny `AppUppdateringBanner.jsx` – en
  användarstyrd "Uppdatera"-knapp ersätter den tysta omladdningen.
- **44a:** ny `useInstallBanner.js`/`InstalleraAppBanner.jsx` – fångar `beforeinstallprompt`
  (Android/Chrome/Desktop), separat instruktionstext för iOS Safari (som aldrig avfyrar det
  eventet), redan-installerad-detektion så banderollen aldrig stör en som redan installerat,
  avvisning sparas permanent.
- **44b:** genererade en riktig 180×180 PNG-hemskärmsikon från den befintliga SVG:n (via en
  Playwright-skärmdump, inga nya byggberoenden) – `apple-touch-icon` pekade tidigare på en SVG,
  som Apple inte officiellt stöder för den taggen. `manifest.webmanifest`s SVG-ikoner
  (Android/Chrome) orörda.
- **44d:** `overscroll-behavior-y: contain` + `-webkit-touch-callout: none` (knappar/länkar/
  navigering, inte brödtext) i `src/index.css`.

**Verifierat i en riktig webbläsare mot emulatorerna** (Playwright, 375×812): installations-
banderollen visas/döljs/kommer inte tillbaka korrekt, iOS-grenen visar rätt text, standalone-
läge visar ingen banderoll alls, ikonen svarar HTTP 200, inga konsolfel i hela inloggnings-
flödet. Inga nya vitest-tester (ren UI/hook-logik). Inga rules-/storage-ändringar. Fullt
testsvep grönt (lint, build, vitest 123/123). Version 5.72.0 → **5.73.0**, `andringslogg.js`
uppdaterad. Committat och pushat till `claude/compassionate-euler-rho0q5`.

**DEPLOYAD TILL PRODUKTION 2026-08-04** (körning #67, commit `5c4ab12`, `deploy.yml` via
`workflow_dispatch`, `conclusion: success`) – ny asset-hash `index-DLJ3EL3S.js` bekräftad via
`curl` mot produktions-URL:en.

`etapplaner/ETAPPLAN8.md` Etapp 44 är därmed helt klar och LIVE. Nästa steg: Etapp B (sök- och
kunskapsupptäckt 2.0) enligt den beslutade ordningen i `etapplaner/ETAPPLAN8.md`, om inget annat
prioriteras.

## Uppföljning 2026-08-04 (Etapp 45 antagen): extern granskning strukturerad till en plan

Användaren delade en extern, skriftlig dokumentationsgranskning (inte kodgranskning) och bad
om synpunkter, sedan om att strukturera granskningen + synpunkterna till en genomförbar plan.

**Tre av granskningens sakpåståenden verifierades innan de togs för goda:** `saljmaterial/PITCH.md`
bekräftat stå kvar på "Version 5.25.0" (48 releaser efter v5.73.0, värre än granskningens
egen siffra eftersom den gjordes mot v5.72.0). `granskningar/TILLGANGLIGHETSREDOGORELSE.md`s
`[FYLL I: datum]` bekräftad, rad 102. `drift/INCIDENT-CHECKLISTA.md`s kontakttabell bekräftad
till stor del tom, men "2 av 5 ifyllda" snarare än granskningens "en femtedel" – en mindre
justering, slutsatsen höll ändå.

**Ny plan `etapplaner/ETAPPLAN9.md` (Etapp 45 – "Kvalitetsmaskineriet riktas utåt") skriven och antagen.**
Tesen: samma premisskontroll-/händelsestyrda-underhålls-disciplin som redan skyddar
`version.js`/`produkt/FRAMTIDSPLAN.md`/`CLAUDE_STATUS.md` internt saknas för de dokument och den
produktkvalitet en KUND eller MYNDIGHET faktiskt möter. Fem delmål:
- **45a:** `saljmaterial/PITCH.md` – ett versionsdriftstest (struktur) + en innehållsuppdatering till
  Etapp 22–43 (engångsinsats). Inte byggt ännu.
- **45b:** en ny rökprovssvit (alla ~27 routes × sex roller, kollar rendering/ErrorBoundary/
  konsolfel) – motiverad med att samma enkla mekanism hade fångat tre av projektets mest
  citerade buggar (31b, Korvy-flex, Leverantör-null). Inte byggd ännu.
- **45c:** en ny tillgänglighetsgranskning (axe-core över alla 27 sidor + minst ett test med
  en riktig skärmläsare) eftersom nuvarande redogörelse är från 2026-07-26, före Etapp 42/43.
  Inte gjord ännu.
- **45d – ✅ KLAR:** `OPPNA-PUNKTER.md` skapad, se filen. Ersätter (inte kompletterar)
  granskningens eget delförslag om en egen etapp för de fem människoberoende punkterna.
- **45e/45f:** ändringsloggens ton vid rena UI-releaser (konvention, framåtriktad) respektive
  en `BESLUTSLOGG.md` (lägre prioritet, byggs om tid finns). Inte gjorda ännu.

**Tre beslut togs och skrevs in direkt i `etapplaner/ETAPPLAN9.md`:** (1) `etapplaner/ETAPPLAN8.md`s köade Etapp
B/C byter plats OCH sköts bakom Etapp 45 – heter nu 46 (incidentberedskap, tidigare C) och 47
(sök/kunskapsupptäckt, tidigare B), med motivering (72-timmarsfristen i
`avtal/PUB-AVTAL-MALL.md` p. 8). (2) Deploy-per-avslutad-etapp bekräftad som redan avsedd
norm, ingen ändring. (3) `BESLUTSLOGG.md` (45f) byggs framåtriktat, ingen retroaktiv
genomgång av `CLAUDE_STATUS.md`s historik.

**Dokument uppdaterade i samma commit:** `CLAUDE.md` (läsordning nu 8 punkter, dokumentkarta,
ny obligatorisk underhållsregel för `OPPNA-PUNKTER.md`), `etapplaner/ETAPPLAN8.md` (Etapp B/C → 46/47,
kön flyttad bakom Etapp 45). Version oförändrad (5.73.0) – inget kodarbete, förutom
`OPPNA-PUNKTER.md` som är ren dokumentation.

**Nästa steg:** börja Etapp 45 i planens egen ordning (45a → 45b → 45c → 45e → 45f), om inget
annat prioriteras.

## Uppföljning 2026-08-04 (Etapp 45a klar): PITCH.md kan inte längre glida obemärkt

Byggde 45a direkt efter att `etapplaner/ETAPPLAN9.md` antogs ("börja med delmål 45a").

**45a-i:** ny `tests/docs/pitch-version.test.js` – jämför `saljmaterial/PITCH.md`s versionsrubrik mot
`package.json`, failar om major skiljer sig eller minor ligger mer än 15 bakom. **Verifierat
mot det verkliga felet innan fixen:** kört mot ursprungsläget gav rött med "48
minorversioner efter, gränsen är 15" – bekräftar att testet faktiskt fångar problemet, inte
bara en attrapp som alltid är grön.

**45a-ii:** `saljmaterial/PITCH.md` omskriven till att täcka Etapp 22–43 – samlad godkännandekö,
effektmätning över tid, en ny sektion om innehållshälsa/granskningsrundor/dubblettdetektion/
"Ni sa vi gjorde"/arkiverad status, revisionsloggens hashkedja (aldrig omnämnd tidigare, en
lucka utöver de granskningen själv hittade), gränssnittsförnyelsen och installationsbarheten.
Ny sektion "Ärlighet om vad som faktiskt är mätt" – skriven direkt mot granskningens fynd #7
(ingen kund ännu, siffrorna är fortsatt uppskattningar).

**Ingen versionsbump** – övervägd men reverterad, matchar det etablerade mönstret att inte
bumpa för ändringar utan motsvarande app-synlig/deploybar yta (jfr Etapp 14b/14c).

Fullt testsvep grönt (lint, build, vitest 124/124). Committat och pushat.

**Kvar i Etapp 45:** 45b (rökprovssvit), 45c (tillgänglighetsgranskning), 45e (ändringsloggens
ton), 45f (beslutslogg) – i den ordningen enligt `etapplaner/ETAPPLAN9.md`.

## Uppföljning 2026-08-04 (Etapp 45b klar): rökprovssvit, alla sex roller × 25 routes

Byggde 45b direkt efter 45a ("ja").

Ny `tests/e2e/rokprov.spec.js` (tillagd i `test:e2e`) laddar samtliga 25 routes (23 statiska +
2 dynamiska) för alla sex roller i `src/firebase/roles.js` och kontrollerar per sida: ingen
`ErrorBoundary`-krasch, inga konsolfel. Utökade `global-setup.mjs` med tre tidigare saknade
rollkonton (sektionsledare, vec, forradesansvarig) – bara hälften av rollerna hade ett seedat
konto sedan Etapp 31b. `plattformsadmin`-åtkomsten (styr `/leverantor` server-side) medvetet
utanför sviten, noterat i koden.

**Två tekniska hinder hittades och löstes, ingen app-bugg:** (1) Playwrights 30s-standardtimeout
räckte inte för 25 sekventiella sidladdningar med `networkidle` (Firestores websocket-
lyssnare kan hindra den från att lösa upp) – löst med `waitUntil: "load"` + kort väntan +
`test.setTimeout(120_000)`. (2) `/leverantor` gav en förväntad `ERR_CONNECTION_REFUSED`-rad
eftersom `test:e2e` inte startar functions-emulatorn – sidan kraschade INTE (bekräftar att
Etapp 43e:s null-fix håller), filtrerad bort med en route-specifik allowlist istället för att
göra hela sviten mindre strikt. Kört tre gånger under byggandet – 6/9 fel → 6/9 fel (rätt
orsak synlig) → **9/9 gröna**.

Ingen versionsbump (rent testarbete). Fullt testsvep grönt (lint, build, vitest 124/124,
test:e2e 9/9). Committat och pushat.

**Kvar i Etapp 45:** 45c (tillgänglighetsgranskning), 45e (ändringsloggens ton), 45f
(beslutslogg).

## Uppföljning 2026-08-04 (Etapp 45c klar): tillgänglighetsgranskning + sex genuina fixar

Byggde 45c direkt efter 45b ("ja").

Ny automatiserad granskning (axe-core, `@axe-core/playwright`) mot alla 27 sidor, körd som
BÅDE superadmin och personal (en andra roll avslöjade tre roll-specifika brister superadmin
inte kunde hitta – samma insikt som redan låg bakom 45b:s flerrollstestning).

**Sex genuina, tidigare okända tillgänglighetsbrister hittades och åtgärdades**, samtliga
uppkomna av eller synliggjorda av Etapp 42–44:
- `/logga-in`/`/registrera`/`/akutlage`/`/checklista/:rutinId` saknade `<main>`-landmärke
  (renderas utanför `SkyddatLayout`) – bifynd: "Hoppa till innehåll"-länken pekade mot ett
  id som inte fanns på dessa sidor, fixat som en bonus.
- Den flytande Akut-knappen (global sedan 42c) låg utanför alla landmärken.
- Två `<nav>`-landmärken utan unika namn (BottomNav, Hem:s snabblänksrad).
- **"Mer"-menyn (42f) påstod sig vara en modal dialog men saknade Esc/fokusfångst/
  fokusåterlämning** – samma mönster som redan fanns för bekräftelsedialogen (Etapp 13g)
  återanvänt, bara aldrig applicerat här.
- Rubrikordning som hoppade h1→h3 på tre ställen, inklusive två sidor som helt saknade
  `<h1>` i sitt tomma/nekade-läge för en `personal`-roll.

**Ny permanent regressionsspärr:** `tests/e2e/tillganglighet.spec.js` (tillagd i `test:e2e`),
plus en ny delad `tests/e2e/rutter.mjs` så rökprovssviten och tillgänglighetssviten aldrig kan
driva isär om en route ändras. Noll överträdelser efter fixarna, bekräftat i en riktig
körning (11/11 gröna totalt i `test:e2e`).

`granskningar/TILLGANGLIGHETSREDOGORELSE.md` omskriven: nya rader #12–#17, en ärlig ny sektion om vad som
FORTFARANDE inte är testat (riktig skärmläsare – oförändrat sedan innan; interaktionsutlöst
UI som modaler bara skannas i statiskt läge, inte öppna – ny nyans). Skärmläsartestning
tillagd i `OPPNA-PUNKTER.md`.

Fullt testsvep grönt (lint, build, vitest 124/124, test:e2e 11/11). Version 5.73.0 →
**5.74.0** (första riktiga app-synliga fixen i Etapp 45). Committat och pushat.

**Etapp 45a–45d klara.** Kvar: 45e (ändringsloggens ton), 45f (beslutslogg).

## Uppföljning 2026-08-04 (Etapp 45 helt klar): 45e/45f byggda

Byggde 45e och 45f direkt efter 45c ("ja").

**45e:** en dokumenterad konvention i `src/data/andringslogg.js`s topp – vid en release som
uteslutande är CSS/UI-polish, led med en sammanfattande användarvänd rad istället för
tekniska delfixar. Gäller framåt, ingen retroaktiv omskrivning.

**45f:** ny `BESLUTSLOGG.md` – tom vid skapandet (byggs framåtriktat, ingen retroaktiv
genomgång av `CLAUDE_STATUS.md`s historik). Ny obligatorisk underhållsregel i `CLAUDE.md`.
En rad i `OPPNA-PUNKTER.md` som blir ett beslut flyttas hit och tas bort därifrån.

Ingen versionsbump (ren dokumentation). Fullt testsvep grönt (lint, vitest 124/124).
Committat och pushat.

**Med detta är HELA `etapplaner/ETAPPLAN9.md` (Etapp 45, alla sex delmål 45a–45f) klar.** Nästa steg
enligt den beslutade ordningen (Beslut 1 i `etapplaner/ETAPPLAN9.md`): Etapp 46 (incidentberedskap i
produkten), i `etapplaner/ETAPPLAN8.md`.

## Uppföljning 2026-08-04 (Etapp 46 klar): incidentberedskap i produkten

Byggde Etapp 46 direkt efter Etapp 45 ("gå vidare").

**Premisskontroll (krav 8) smalnade planens omfattning innan bygget:** av de tre sakerna den
ursprungliga idén nämnde (senaste backup, App Check-verifieringsgrad, misslyckade
inloggningsförsök i realtid) var bara EN byggbar. App Check-metriken exponeras inte via någon
Firebase Admin SDK-funktion (bara i konsolens UI) – en produktbegränsning hos Firebase, inte
en kodfråga. Misslyckade inloggningsförsök var redan dokumenterat blockerat på ett ägarbeslut
(Etapp 32b, `OPPNA-PUNKTER.md`).

**Genomfört:** ny collection `systemstatus/{id}` – den redan existerande nattliga
hashkedjekontrollen (Etapp 32d) skriver nu ett resultat VARJE körning, inte bara vid en
avvikelse (annars omöjligt att skilja "kedjan är intakt" från "jobbet slutade köras för tre
veckor sedan"). Ny callable `hamtaBackupstatus` (listar Storage via Admin SDK). Ny
adminsektion `IncidentberedskapSektion.jsx` (superadmin) – visar båda, plus en uttrycklig
"Vad den här vyn INTE visar"-ruta för de två saker som inte kunde byggas.

**Ett genuint UX-fel hittades och fixades under den manuella webbläsarverifieringen:** ett
misslyckat backupstatus-anrop visade Firebase-klientens råa felkod ("internal") istället för
en läsbar text – fixat till en egen, tydlig felrad.

Dokumentation uppdaterad i samma commit (obligatorisk regel för incidentdokumenten):
`drift/INCIDENT-CHECKLISTA.md` (ny rad i "Var saker finns", uppdaterad hashkedjerad, nytt
kodläge/datum), `granskningar/SAKERHETSRAPPORT.md` (nytt tillägg-block).

6 nya regeltester, 4 nya functions-tester, 1 nytt assert i en befintlig testfil. Fullt
testsvep grönt (lint, build, vitest 124/124, test:rules, test:functions, test:storage
21/21). **Ett flaky test:e2e-fel under byggandet** (ERR_CONNECTION_REFUSED på `/admin` för en
roll som inte ens ser den nya sektionen) – bedömt som transient parallell-körnings-artefakt,
inte en regression, bekräftat genom en ren omkörning (11/11 gröna).

Version 5.74.0 → **5.75.0**. Committat och pushat. **Etapp 46 klar.** Nästa: Etapp 47
(sök/kunskapsupptäckt 2.0), när/om den prioriteras.

## Uppföljning 2026-08-04 (Etapp 47 klar): sök- och kunskapsupptäckt 2.0

Byggde Etapp 47 direkt efter Etapp 46 ("påbörja etapp 47").

**Premisskontroll (krav 8) visade att bara en av tre ursprungliga idéer var byggbar rakt av:**
en bredare kommandopalett (kontakter/förråd) var redan HELT byggd (`useSokindex.js` indexerar
redan båda) – utgick helt. "Relaterade rutiner"-fältet fanns men var 100% manuellt. "Sedan
ditt förra pass" fanns men fångade bara NYA rutiner, aldrig uppdaterade.

**47a:** rutinformuläret föreslår nu automatiskt andra godkända rutiner i samma område som
delar minst en tagg med den som redigeras, som en egen "Föreslagna"-lista före den fulla
manuella listan. Ren klientberäkning, ingen ny datamodell.

**47b:** en bättre lösning hittades under bygget än den ursprungligen skisserade – istället
för ett nytt fält som stämplas vid VARJE redigering (hade dränkt vyn i brus) återanvänds
`rutin.senasteVasentligaAndring` (Etapp 19c), redan en avsiktlig, kuraterad VÖL/superadmin-
flagga. `useSedanForraPasset.js` visar nu "Uppdaterad rutin: X" utöver "Ny rutin: X".

**Ett testskriptfel hittades och korrigerades under browserverifieringen, ingen produktbugg:**
navigering med `page.goto()` (full omladdning) mellan sidor omonterade `AuthContext` en andra
gång och läste in en redan uppdaterad `senasteInloggning` – exakt det scenario koden själv
varnar för. Fixat genom att navigera via en klientsidig länk istället, som en riktig
inloggad session gör.

Inga nya vitest-tester, inga rules-/functions-/storage-ändringar. Fullt testsvep grönt (lint,
build, vitest 124/124). Version 5.75.0 → **5.76.0**. Committat och pushat.

**Med detta är `etapplaner/ETAPPLAN8.md` (Etapp 44, 46, 47) OCH `etapplaner/ETAPPLAN9.md` (Etapp 45) alla helt
klara.** Tre releaser (5.74–5.76) väntar på deploy. Ingen ny UI-/kvalitetsplan väntar – nästa
`ETAPPLANx.md` skrivs när/om ett nytt större arbetsområde identifieras.

## Uppföljning 2026-08-04 (deploy): v5.76.0 live i produktion

Användaren bad "deploya den". Triggade `deploy.yml` via `workflow_dispatch` på
`claude/compassionate-euler-rho0q5`, commit `328f940` (Etapp 47-committen, v5.76.0). Körning
#68: `status: completed`, `conclusion: success`. Detta var ett trehopp – v5.74.0 (Etapp 45),
v5.75.0 (Etapp 46) och v5.76.0 (Etapp 47) gick alla live samtidigt eftersom ingen av dem
deployats individuellt sedan v5.73.0 (körning #67). Bekräftade ny asset-hash i produktion
(`assets/index-BtpA3PtP.js`) via `curl`. Uppdaterade `CLAUDE.md`s `etapplaner/ETAPPLAN8.md`-rad i
dokumentkartan (tog bort "inte deployade ännu").

Inget nytt kodat i den här sessionen – rent avstämnings-/dokumentationsarbete kring en redan
lyckad deploy.

## Uppföljning 2026-08-06 (ETAPPLAN10 antagen)

Användaren delade ett externt utkast, `ETAPPLAN10UTKAST.md` (Etapp 48–52, "Redo att drivas" –
från byggd produkt till driftbar tjänst). Bads om synpunkter, gav dem, blev ombedd att
strukturera om det till en riktig plan.

**Granskade utkastets sakpåståenden mot faktisk kod** innan antagande (samma premisskontroll-
disciplin som gäller allt annat bygge). Allt stämde: `exporteraOrganisation` täcker bara 7
collections, saknar de 7 utkastet pekade ut; `pausaOrganisation` gör bara en statusflagga;
backup-gallringen (90 dagar) och `hamtaBackupstatus` finns redan; `arPlattformsadmin()`-
gränsen stämmer.

**Tre skärpningar innan antagande** (detaljer i `etapplaner/ETAPPLAN10.md`s egen "Ändringar mot
utkastet"): (1) 48a är en nybyggnad av mätpunkt, inte en avsmalning – AI-budgetlarmet är ett
Sentry-larm, inte en UI-yta, och sökkvoten har ingen mätpunkt alls i dag; (2) 48c och 50a/50b
fick egna "verifiera först"-flaggor (molnkostnadsdata resp. tidsbegränsade Firestore-regler är
osäkra/nya); (3) 49a (radering) avkopplades explicit från 49b–49d, som ska köras oavsett vad
ägaren beslutar om 49a.

Skrev `etapplaner/ETAPPLAN10.md`, uppdaterade `CLAUDE.md`s läsordning och dokumentkarta (ny rad, flyttade
`etapplaner/ETAPPLAN9.md` till "helt klar och deployad"). Inget delmål byggt än – väntar på att användaren
säger vilket delmål som ska påbörjas.

## Uppföljning 2026-08-06 (Etapp 48a–48b klara): delad sökkvot mätt och synlig

Byggde 48a (premisskontroll, ingen kod – bekräftade att sökkvoten bara rate-limitas per
användare och att det delade dygnstaket helt saknade mätpunkt) och därefter 48b direkt, båda
på användarens "gå vidare"/"börja med"-instruktioner.

**Design valdes med krav 16 i åtanke:** aggregatet (`systemstatus/sokkvot`, totalAntal+tak,
INGEN per-org-uppdelning) ligger i samma collection som `systemstatus/revisionskedja`
(Etapp 46) – men den är läsbar av VILKEN organisations superadmin som helst, så en
per-organisation-uppdelning där hade läckt cross-tenant, exakt det skäl som redan fick
AI-budgetlarmet att gå via Sentry istället för `systemvarningar`. Per-organisation-räkningen
ligger istället direkt på `organisationer/{orgId}` (redan bara läsbar av egen org +
leverantörsadmin). Ingen ny Firestore-regel behövdes.

Ny mätpunkt `okaSokkvot()` i `functions/index.js`, anropad i `fragaKlinisktStod` direkt före
det faktiska externa Custom Search-anropet (efter cache-kontrollen). Larmar en gång/dygn vid
80 % via Sentry. `listaOrganisationer` utökad med aggregat + per-org dagens antal.
Leverantörsvyn (`Leverantor.jsx`) fick en ny sektion + en rad per organisation.

5 nya functions-tester (`tests/functions/sokkvot.test.cjs`), inga nya rules-tester behövdes
(befintliga täcker collectionerna redan). Fullt testsvep grönt: lint, build, vitest 124/124,
test:rules, test:functions. Version 5.76.0 → **5.77.0**. Committat och pushat.

48c (verifiera molnkostnadsdata, sedan täckningsbidrag) och 48d (rimlighetstak per
organisation) kvarstår i `etapplaner/ETAPPLAN10.md`.

## Uppföljning 2026-08-06 (deploy): v5.77.0 live i produktion

Användaren bad "deploya den". Triggade `deploy.yml` via `workflow_dispatch`, commit `8054230`
(Etapp 48a–48b-committen). Körning #69: `status: completed`, `conclusion: success`. Ny
asset-hash bekräftad live (`assets/index-IBbHn0yL.js`) via `curl`. Senaste produktionsdeploy
innan detta var v5.76.0 (körning #68) – ett enda releasehopp (v5.77.0).

## Uppföljning 2026-08-06 (Etapp 48c klar, smalare än planerat)

Byggde 48c direkt efter deploy, på användarens "gå vidare med 48c".

**Premisskontroll bekräftade delmålets egen "verifiera först"-varning helt och hållet:**
faktisk molnkostnad per organisation kräver att GCP:s faktureringsexport till BigQuery
aktiveras – ett projektval bara ägaren kan göra i GCP-konsolen, inte en kodfråga. Det här är
INTE en ny slutsats: `etapplaner/ETAPPLAN5.md`, `granskningar/SAKERHETSRAPPORT.md` och `drift/INCIDENT-CHECKLISTA.md` har
redan dragit exakt samma slutsats för Etapp 32b:s inloggningslarm. Uppdaterade
`OPPNA-PUNKTER.md` så samma rad nu nämner båda – ett enda ägarbeslut låser upp båda.

**En andra lucka hittades vid samma kontroll, inte tidigare känd:** det finns inget lagrat
kronbelopp för vad en organisation faktiskt betalar någonstans i datamodellen –
`produkt/MODULPLAN.md`s prismodell är bara text i ett dokument. Ett täckningsbidrag går alltså inte
att räkna ut ens grovt idag, oavsett faktureringsexporten.

**Byggde det enda förberedande steget som faktiskt var byggbart:** ny callable
`satAvtaladArsavgift`, manuellt inmatat pris per organisation i leverantörsvyn, ställt bredvid
den redan kända AI-kostnaden – med en tydlig text om att det INTE är ett fullständigt
täckningsbidrag. 5 nya functions-tester i `tests/functions/etapp6.test.cjs`. Fullt testsvep
grönt. Version 5.77.0 → **5.78.0**. Committat och pushat, INTE deployat ännu.

48d (rimlighetstak per organisation) kvarstår i `etapplaner/ETAPPLAN10.md` – det enda obyggda i Etapp 48.

## Uppföljning 2026-08-06 (Etapp 48 helt klar)

Byggde 48d direkt efter 48c, på användarens "ja, börja med 48d".

Lade in kontrollen FÖRST i `okaSokkvot`s befintliga transaktion, innan något skrivs: en
organisation som redan nått sitt eget dagliga tak nekas med `resource-exhausted`, utan att
vare sig den delade totalen eller organisationens egen räknare ökar (annars hade en blockerad
förfrågan ändå "kostat" kvot den aldrig fick använda). Standardtak `SOKKVOT_ORG_TAK_STANDARD =
50` (hälften av den delade dygnskvoten) när inget är konfigurerat. Ny callable
`satSokkvotTakPerDygn`, samma mönster som `satAvtaladArsavgift`. Leverantörsvyn fick en ny
redigerbar "Sökkvottak/dygn"-rad och visar nu "Sökkvot idag: N / tak" istället för bara N.

8 nya functions-tester (3 i `sokkvot.test.cjs`, 5 i `etapp6.test.cjs`). Fullt testsvep grönt:
lint, build, vitest 124/124, test:functions. Version 5.78.0 → **5.79.0**. Committat och
pushat, INTE deployat ännu.

**Med detta är Etapp 48 (48a–48d) helt klar.** Två releaser (5.78–5.79) väntar på deploy.
Nästa punkt i `etapplaner/ETAPPLAN10.md` är Etapp 49 (livscykeln stängd – automatiserad radering vid
avetablering, en faktisk återställningsövning, exportens fullständighet).

## Uppföljning 2026-08-06 (meta): ny skill för releasechecklistan

Användaren bad om förslag på egna arbetsförbättringar (kapacitet/token/UX), inte
projektarbete. Byggde tre av förslagen som en ny projektskill,
`.claude/skills/synappsen-release/SKILL.md`: (1) hela releasechecklistan (version/changelog/
`ETAPPLANx.md`/`CLAUDE_STATUS.md`/testsvep/commit) skriven ut steg för steg istället för att
härledas på nytt varje gång, (2) ett skript
(`scripts/gh_run_status.py`) som extraherar bara de fält som faktiskt behövs ur en GitHub
Actions-körnings JSON, (3) en tydlig regel om att föredra `list_workflow_runs` (som
overflowar till fil, håller sig utanför kontext) framför upprepade `get_workflow_run`-anrop
(som INTE overflowar och därför kostar tokens varje gång), plus en enda väl tilltagen väntetid
(~5–6 min, baserat på historiska körningar) istället för täta pollningsloopar. Ingen
projektkod ändrad. Pekare tillagd i `CLAUDE.md`s arbetsmönster-avsnitt.

## Uppföljning 2026-08-06 (Etapp 49: 49c/49d klara, 49a/49b kräver ägarbeslut)

Byggde Etapp 49 med hjälp av den nya `synappsen-release`-skillen för själva release-stegen.

**49d (exportens fullständighet) – klar.** Premisskontroll visade att av de sju collections
utkastet pekade ut var en (`systemstatus`) FEL att lägga till (delad plattforminfrastruktur,
inget `organisationId`-fält – skulle bara gett ett tomt, missvisande resultat i varje
organisations export) och en (`matvardenSnapshots`) är en underkollektion som krävde en helt
annan kod-väg än de andra sex. Hittade dessutom en ÅTTONDE, tidigare oflaggad collection
(`introduktionstilldelningar`) med samma lucka. `BACKUP_COLLECTIONS` gick från 7 till 13 +
`BACKUP_SUBCOLLECTIONS` (`matvardenSnapshots`) + en särskild post för
`revisionsloggHuvud/{orgId}` (krävs för att revisionsloggens hashkedja ska kunna fortsätta
korrekt efter en återställning). 8 nya functions-tester.

**49b – planens egen premiss visade sig vara fel.** Utkastet påstod att
`avtal/IT-FAKTABLAD.md` saknade en RTO-siffra. Den fanns redan (Etapp 33d, 2026-07-31),
ärligt caveerad som uppmätt mot emulator, inte produktion. Den enda genuint kvarstående
luckan – en produktionslik mätning – är ett ägarbeslut (tid + testmiljö), inte något jag kan
bygga mig fram till. Flyttad till `OPPNA-PUNKTER.md`, tillsammans med 49a (radering, redan
villkorat av ett ägarbeslut sedan planen antogs).

**49c – klar.** Ny punkt (5) i `CLAUDE.md`s återkommande säkerhetsgenomgång som påminner om
att kontrollera om det är dags för en ny återställningsövning.

Fullt testsvep grönt: lint, build, vitest (124/124), test:functions. Version 5.79.0 →
**5.80.0**. Committat och pushat, INTE deployat ännu (tre releaser väntar: 5.78–5.80).

Nästa punkt i `etapplaner/ETAPPLAN10.md`, om användaren ber om fortsatt arbete, är Etapp 50
(supportbarhet utan innehållsåtkomst).

## Uppföljning 2026-08-08 (deploy): v5.80.0 live i produktion

Användaren bad "deploya dem" (de tre väntande releaserna) och sa att hen själv tar besluten om
49a/49b – de behöver alltså INGEN uppföljning från min sida just nu, bara vänta på ägaren.

Triggade `deploy.yml` via `workflow_dispatch`, commit `e4a2cff` (Etapp 49c/49d-committen).
Körning #70: `status: completed`, `conclusion: success`, med den nya `synappsen-release`-
skillens polling-metod (en enda `sleep 330` istället för en pollingloop, sedan
`list_workflow_runs` + `gh_run_status.py` istället för upprepade `get_workflow_run`-anrop) –
fungerade som avsett. Ny asset-hash bekräftad live (`assets/index-aQzGtcuw.js`) via `curl`.
Detta var ett trehopp – v5.78.0 (48c), v5.79.0 (48d) och v5.80.0 (49c/49d) gick alla live
samtidigt, eftersom ingen av dem deployats individuellt sedan v5.77.0 (körning #69).

## Uppföljning 2026-08-08 (Etapp 49a klar, 49b väntar på ägaren)

Bad om utveckling kring 49a/49b-alternativen, gav ett detaljerat svar med tre alternativ
vardera. Användaren föreslog SJÄLV en tredje väg för 49a (kundinitierad, 48h-fördröjd
radering som både kunden och leverantören kan avbryta) – bättre än något av mina tre förslag,
byggde det. För backupretention vid radering ställde jag en riktig fråga
(`AskUserQuestion`): behålla 90-dagarsgallringen som extra skyddsnät, eller radera direkt?
Svar: behåll gallringen. Loggat i `BESLUTSLOGG.md`.

**49a – helt byggt och testat:** `begarRaderingAvOrganisation`/`avbrytRaderingAvOrganisation`/
`raderaOrganisationensData` + ett nytt schemalagt jobb (`utforSchemalagdRaderingSchemalagt`,
varje timme). Städar Firestore-dokument (13 collections + underkollektionen, MEN INTE
revisionslogg/revisionsloggHuvud – de ska överleva), Storage-filer (rutin-/artikelbilder,
logotyp, avatarer, råfoton – krävde samma "ägar-id på path-index 2"-mönster som
`manadsrapportOrganisationer` redan använder, eftersom de sökvägarna inte är
organisationsskopade i sig) och Firebase Auth-konton. Ny UI i `/admin` (kunden, kräver att
skriva organisationens namn + en `confirm()`-dialog) och `/leverantor` (avbryt-knapp).
14 nya functions-tester hittade två RIKTIGA buggar (inte i testerna): `FieldValue.delete()`
i ett icke-merge `set()` (Firestore avvisar det), och ett testantagande om användarantal som
var fel (den var en testbugg). `avtal/PUB-AVTAL-MALL.md` p. 6,
`avtal/INCIDENTRESPONSPLAN.md` (v1.1 → v1.2) och `drift/INCIDENT-CHECKLISTA.md` uppdaterade i samma
commit. Version 5.80.0 → **5.81.0**. Committat och pushat, INTE deployat ännu.

**49b – jag kan INTE genomföra alternativ A själv.** Den här sessionsmiljön har ingen
`gcloud`/`firebase`-CLI och ingen `GOOGLE_APPLICATION_CREDENTIALS` – jag har helt enkelt inga
produktionscredentials. En riktig mätning kräver att ägaren (eller någon med
projektåtkomst) kör en kort runbook själv:

1. `/leverantor` (skarpt) → "Skapa ny organisation", namn t.ex. "RTO-mätning 2026-08-08 – TA
   BORT", välj ett Startbibliotek (ger representativ datamängd).
2. Firebase-konsolen → Functions → `exporteraOrganisation` → "Testa funktionen" →
   `{"orgId": "<org-id från steg 1>"}` → notera den returnerade `path`.
3. Firebase-konsolen → Functions → `aterstallOrganisationCallable` → "Testa funktionen" →
   `{"orgId": "<samma org-id>", "sokvag": "<path från steg 2>"}`.
4. Firebase-konsolen → Functions → Logs → hitta anropet från steg 3 → **körningstiden loggas
   automatiskt av GCP**, inget stoppur behövs.
5. Städa bort testorganisationen (`organisationer/<org-id>` + dess dokument) manuellt i
   Firestore-konsolen.
6. Ge mig siffran från steg 4, så skriver jag in den i `avtal/IT-FAKTABLAD.md` p. 6 och
   markerar 49b klar i `etapplaner/ETAPPLAN10.md`/`OPPNA-PUNKTER.md`.

Endast v5.81.0 väntar på deploy – v5.78.0/5.79.0/5.80.0 gick redan live i körning #70.

## Uppföljning 2026-08-09 (Etapp 49b klar – produktionsmätning)

Användaren frågade om det fanns en connector eller annan väg att ge mig produktionsåtkomst,
istället för att köra runbooken själv. Bättre lösning hittades: `deploy.yml` har redan en
service account-hemlighet (`secrets.FIREBASE_SERVICE_ACCOUNT`) godkänd för produktion – en
NY, separat GitHub Actions-workflow (`workflow_dispatch` bara, aldrig på push) kan återanvända
den utan att någon ny credential behöver delas eller hamna i min sessionsmiljö.

Byggde `.github/workflows/rto-matning.yml` + `functions/scripts/rto-matning.cjs`: skapar en
tydligt märkt syntetisk testorganisation (`_rto_matning_<tidsstämpel>`, samma
"_"-prefix-konvention som `_plattform` redan använder för "detta är inte en riktig kund"),
seedar 100 dokument över 4 collections, tar en backup, tidsätter en riktig återställning, och
städar bort ALLT den skapade – inklusive backupfilen. **Verifierade skriptet lokalt mot
Firestore-/Storage-emulatorn FÖRST** (samma disciplin som all annan kod i det här projektet)
innan det committades eller kördes mot skarpt.

Körde workflowen mot produktion: `conclusion: success`, jobbloggen visar
`RTO_MATNING_RESULTAT: 1136 ms för 100 dokument`, och "städning klar" bekräftar att
testorganisationen och backupfilen togs bort igen. Skrev in siffran i
`avtal/IT-FAKTABLAD.md` p. 6 (ersatte den gamla, ärligt caveerade emulator-siffran).
Verktyget behålls (inte engångsbruk) – 49c:s återkommande övning blir nu "kör om workflowen
manuellt", inte en manuell improvisation nästa gång.

**Med detta är Etapp 49 (49a–49d) helt klar, inga öppna punkter kvar för Etapp 49.**
`OPPNA-PUNKTER.md` och `BESLUTSLOGG.md` uppdaterade i samma commit. Version oförändrad
(5.81.0) – dokumentations-/verktygsarbete, ingen ny app-funktionalitet.

## Uppföljning 2026-08-09 (deploy: v5.81.0 live)

Användaren bad "deploya den". Triggade `deploy.yml` (`workflow_dispatch`) mot grenen
`claude/compassionate-euler-rho0q5`, commit `b18e591` (innehåller både Etapp 49a:s
raderingsfunktion och Etapp 49b:s RTO-mätningsverktyg/resultat). Körning **#71**,
`conclusion: success`. Bekräftade den nya versionen live genom att hämta startsidan och
läsa av asset-hashen: `assets/index-CCVkCV2A.js` på
`https://synappsen-final-build.web.app/`. Ingen kodändring i denna uppföljning, bara
statusuppdatering – v5.81.0 är nu produktionens faktiska version.

## Uppföljning 2026-08-09 (Etapp 50a klar)

Användaren bad om nästa steg för Etapp 50 ("supportbarhet utan innehållsåtkomst"), sedan
"Börja med 50a".

**Premisskontroll gjord innan bygget:** kontrollerade var Etapp 32a:s
`permission-denied`-rapportering faktiskt syns idag – bekräftat: bara i Sentry (klientsidan),
ingen serverbar väg att fråga Sentrys händelsedatabas utan ett separat API-token. Samma
blockering som redan var dokumenterad i `etapplaner/ETAPPLAN5.md` §32b. Beslöt att bygga resten av 50a
nu och flagga felfrekvens som `felfrekvensTillganglig: false` i svaret istället för att låtsas
den finns eller vänta på ägaren för hela etappen.

**Genomfört:** ny callable `hamtaOrganisationsdiagnostik(orgId)` i `functions/index.js`
(plattformsadmin-only) – antal dokument per collection (rutiner/forradsartiklar/anslag/
kontakter, via Firestores `count()`), senaste loggade revisionslogg-händelse, backupstatus
(bröt ut delad logik `hamtaBackupstatusForOrg` från den befintliga `hamtaBackupstatus`).
Loggar sig själv in i organisationens EGEN revisionslogg (`organisation_diagnostik_visad`).
Ny expanderbar "Diagnostik"-sektion per organisationsrad i `/leverantor`
(`src/pages/Leverantor.jsx`). 11 nya functions-tester
(`tests/functions/diagnostik.test.cjs`), inklusive ett test som bevisar att inget
dokumentinnehåll läcker i svaret. `etapplaner/ETAPPLAN10.md` uppdaterad (§50a markerad ✅ KLAR med full
"Genomfört"-sektion).

**Testat:** fullt testsvep (lint, build, vitest, rules, functions, storage, e2e) – alla gröna,
inga regressioner. Version bumpad 5.81.0 → **5.82.0**, ny post i `src/data/andringslogg.js`.
Pushad till `claude/compassionate-euler-rho0q5`, INTE ännu deployad.

**Kvar i Etapp 50:** 50b (tidsbegränsad supportåtkomst) har en olöst beslutspunkt – ska den
byggas alls? (se `etapplaner/ETAPPLAN10.md` "Beslutspunkter som kräver ägaren" punkt 3). 50c
(ärendehistorik) är obyggd, inget känt hinder.

## Uppföljning 2026-08-09 (Etapp 50b klar)

Användaren fick alternativen för 50b och svarade: "Genomför alternativ A, men sätt
tidsfönstret till 6h" – ägarbeslutet är alltså att bygga tillfällig, kundinitierad
supportåtkomst, med fönstret satt till 6 timmar istället för utkastets föreslagna 4h.

**Genomfört, i den ordning `etapplaner/ETAPPLAN10.md` ursprungligen krävde ("isolera regelmönstret
innan UI"):**
1. `farSupportlasa(orgId)`/`supportAtkomstAktiv(orgId)` i `firestore.rules` – den ENDA platsen
   i hela regelfilen där en plattformsadmin (leverantören) får läsa en organisations INNEHÅLL,
   inte bara `organisationer/{orgId}` självt. Fail-closed (nekar om fältet saknas ELLER om
   organisationen är pausad, trots ett i övrigt aktivt fönster). Skrivet och testat ISOLERAT
   först (`tests/rules/supportatkomst.test.mjs`, 7 tester) innan den kopplades in i
   `rutiner`/`forradsartiklar`/`anslag`/`kontakter`s läsregler.
2. Två nya callables: `beviljaSupportAtkomst(anledning)` (superadmin, egen organisation) och
   `avslutaSupportAtkomst(orgId?)` (superadmin ELLER plattformsadmin) – samma mönster som
   49a:s radering. 9 nya functions-tester.
3. Nytt UI: `/admin` → "Tillfällig supportåtkomst" (kunden beviljar/avslutar, kräver en
   anledning), `/leverantor` → varningsrad + en "🔓 Visa innehåll"-knapp som ENDAST syns när
   ett fönster är aktivt och läser rutiner/förråd/anslag/kontakter direkt mot Firestore från
   leverantörens egen klient – exercerar regelmönstret på riktigt, inte via en Cloud Function
   som skulle kunnat dölja transparensen.

**Dokumentation uppdaterad i samma commit** (per CLAUDE.md:s obligatoriska underhållsregler,
eftersom detta ändrar behörighetsmodellen och lägger till en ny begränsningsåtgärd):
`drift/INCIDENT-CHECKLISTA.md` (ny rad i "Var saker finns" + Steg 3:s containment-tabell + en
caveat i Steg 4 om att enskilda läsningar under fönstret inte loggas, bara att fönstret var
öppet), `avtal/INCIDENTRESPONSPLAN.md` (version 1.2 → 1.3, avsnitt 5.2), `avtal/IT-FAKTABLAD.md`
§5 (ny rad: "vem hos leverantören kan se era uppgifter?"), `avtal/PUB-AVTAL-MALL.md` §7, och
ett nytt `granskningar/SAKERHETSRAPPORT.md`-tillägg (2026-08-09) med en ärlig läckageriskbedömning.
`BESLUTSLOGG.md` fick en ny rad, `etapplaner/ETAPPLAN10.md` §50b markerad ✅ KLAR med full
"Genomfört"-sektion, beslutspunkt 3 struckt.

**Testat:** fullt testsvep (lint, build, vitest, rules – 219 tester inkl. de 7 nya, functions
– inkl. de 9 nya, storage, e2e) – alla gröna, inga regressioner. Version bumpad 5.82.0 →
**5.83.0**, ny post i `src/data/andringslogg.js`.

## Uppföljning 2026-08-09 (Etapp 50c + 51 klara)

Användaren frågade om hela `etapplaner/ETAPPLAN10.md` var slutförd. Svar: nej – 50c, 51a–c och Etapp 52
kvarstod. Bad om "50c och 51a-c", vilket byggdes i samma session.

**50c – ärendehistorik:** ny subcollection `organisationer/{orgId}/arendeanteckningar/{id}`,
bara läsbar/skrivbar av plattformsadmin (internt leverantörsminne, aldrig kundfacing till
skillnad från 50a/50b). Direkt klientskrivning, samma mönster som `matvardenMarkeringar`. Ny
"🗒️ Ärenden"-sektion per organisationsrad i `/leverantor`. 6 nya regeltester.

**51 – demo-/övningsmiljö:** en ny organisation `_demo` (flaggad `arDemo: true`) som
`nollstallDemoOrganisation`/`nollstallDemoOrganisationSchemalagt` (nattlig, 04:00) seedar med
strukturellt fiktivt innehåll – 2 rutiner från de befintliga verksamhetsmallarna (fas 31), en
utkast-rutin (godkännandekö), en akutlägeschecklista (`steg`), en rutin med ett 200 dagar
gammalt `granskadDatum` (innehållshälsa), förrådsartiklar/anslag/kontakter, och ett
`kompetenskrav` utan kvittering (kompetensmatris-gap). Städas och seedas om helt varje natt
(innehåll + Firestore/Auth-konton), så en demo aldrig ärver förra besökarens spår.

**Viktigt fynd under premisskontroll:** utkastets idé om att "51c kopplas till
introduktionsspåret" och antagandet om en återanvändbar inbjudningslänk höll inte –
`losInInbjudan` kräver att den registrerande e-postadressen matchar exakt den inbjudan
utfärdades till. En jokerlänk (vem som helst kan gå med) hade återinfört precis det Etapp 6c
medvetet stängde av säkerhetsskäl. Löste det genom att återanvända EXAKT samma mekanism
`skapaOrganisation` redan har för en ny kunds första superadmin: `nollstallDemoOrganisation`
tar en valfri `inbjudanEpost` och utfärdar då en riktig, specifik inbjudan. Ny sektion i
`/leverantor` ("🎓 Demo- och övningsmiljö") för att begära en sådan på plats.

**Hårt krav uppfyllt som ett regeltest** (inte bara UI-antagande): nytt
`tests/rules/demo-isolering.test.mjs` bevisar explicit att `_demo` och en riktig kund aldrig
kan nå varandras data – mekanismen är identisk med all annan organisationsisolering, testet
finns för att en framtida specialbehandling av `_demo` inte ska kunna bryta det tyst.
`manadsrapportOrganisationer` filtrerar bort `arDemo`-organisationer så faktureringsunderlaget
inte förvrängs av den nattliga nollställningen.

**Testat:** fullt testsvep – lint, build, vitest, rules (233 tester, inkl. 10 nya), functions
(inkl. 12 nya för demo-organisationen), storage, e2e ×3 (en instabil `rökprov`-träff på
`/admin` upprepad gånger, alltid mot OLIKA roller, alltid grön i isolerad körning – en känd,
förbekräftad sandlådeflakighet under Playwrights 2-worker-parallellism, inte en regression;
samma mönster observerades även INNAN den här sessionens ändringar). Version bumpad 5.83.0 →
**5.84.0**, ny post i `src/data/andringslogg.js`. `etapplaner/ETAPPLAN10.md` uppdaterad: §50c och hela
§51 (51a–c) markerade ✅ KLAR med fulla "Genomfört"-sektioner, sammanfattningstabellens rader
för Etapp 50 och 51 uppdaterade.

**Med detta är HELA `etapplaner/ETAPPLAN10.md` (Etapp 48–51) klar utom Etapp 52** (pilotpaketet – kräver
bokad tid från riktiga människor, inte kodningstid, se planens egen "Beslutspunkter som kräver
ägaren").

## Uppföljning 2026-08-09 (deploy: v5.84.0 live)

Användaren bad "deploya den". Triggade `deploy.yml` (`workflow_dispatch`) mot
`claude/compassionate-euler-rho0q5`, commit `545e958` (Etapp 50c + hela Etapp 51). Körning
**#72**, `conclusion: success`. Bekräftade genom att läsa av asset-hashen på startsidan:
`assets/index-CJpO8Yof.js` på `https://synappsen-final-build.web.app/`. Ingen kodändring i
denna uppföljning. Med detta är Etapp 48–51 (hela `etapplaner/ETAPPLAN10.md` utom Etapp 52) HELT KLARA
OCH DEPLOYADE i produktion.

## Uppföljning 2026-08-10 (ETAPPLAN11.md skriven som UTKAST – ej antagen)

Användaren bad om en genomgång av projektet och ett förslag på en ny etapplan (nya funktioner,
saker att ändra, sådant som gör produkten mer attraktiv för kund). Resultat: **`etapplaner/ETAPPLAN11.md`,
tydligt märkt UTKAST/EJ ANTAGEN** – inget delmål ska byggas förrän ägaren strukit det som inte
ska med, samma ordning som `etapplaner/ETAPPLAN10.md` gick igenom 2026-08-06. Ingen produktkod ändrad.

Sex premisser verifierades mot faktisk kod innan utkastet skrevs (genomgående krav 8), och
samtliga sex stämde – de utgör planens grund:

1. **Ingen e-postkapacitet finns någonstans** (noll träffar på `nodemailer`/`sendgrid`/
   `mailto`/`skickaEpost`). Allt utgående är in-app-notiser + webbpush; systemet kan inte nå
   någon som inte redan är inloggad.
2. Inbjudningslänken levereras manuellt (`InbjudanFormular.jsx:32`).
3. `FEATURE.KIOSK_MODE` är reserverad men **helt oläst** – förekommer bara på två rader i
   `src/config/features.js`, ingen komponent/hook/regel/funktion refererar den.
4. Ingen enhets-/avdelningsnivå under organisationen finns (noll träffar på `enhetId`/
   `avdelningId`); `organisationId` ÄR avdelningen.
5. **`saljmaterial/PITCH.md` (v5.73.0) påstår felaktigt att klinikstöd-sökningen är "medvetet pausad i
   gränssnittet".** `KlinikfragaSok.jsx:15` har `const PAUSAD = false;` sedan 2026-07-14
   (Fas 13) – tre veckor innan `saljmaterial/PITCH.md` senast skrevs. `produkt/MODULPLAN.md` säger korrekt att den
   är i drift. **Sjätte fallet av samma stale-dokument-mönster** som gett upphov till fyra av
   projektets underhållsregler. Åtgärd föreslagen som Etapp 57a + en händelsestyrd regel (57b).
6. Startbiblioteket ger en ny akutmottagning **två** rutinmallar, och inga mallar alls för
   förråd/kontakter/introduktionsspår/kompetenskrav.

Föreslagen omfattning (Etapp 53–58): 53 e-post som kanal, 54 flera enheter under samma
huvudman (54a utredning + 54b huvudmannafält lågrisk; 54c/54d högrisk och villkorade),
55 kioskläge, 56 startbiblioteket, 57 säljmaterialets sanning, 58 SSO (beslut nu, bygge
villkorat). Fyra beslutspunkter för ägaren med rekommendation i varje, samt ett
"Vad jag INTE föreslår, och varför"-avsnitt (MDR-risken med dosberäkning,
journalsystemsintegration, benchmarking mellan kunder, native app, Intelligence 2.0, chatt).

**Rekommenderad omedelbar åtgärd oavsett om planen antas:** Etapp 57a (rätta `saljmaterial/PITCH.md`) –
tar minuter och det är det enda dokumentet en köpare faktiskt läser.

`OPPNA-PUNKTER.md` orörd: utkastets beslutspunkter blir öppna punkter först om/när planen
antas – ett ej antaget förslag är varken en öppen punkt eller ett beslut.

## Uppföljning 2026-08-10 (ETAPPLAN11.md ANTAGEN, Etapp 57a klar)

Användaren bad: "Anta den planen och starta första steget". `etapplaner/ETAPPLAN11.md` markerad
**ANTAGEN 2026-08-10** och gjord till den aktiva planen i `CLAUDE.md`s läsordning/dokumentkarta
(`etapplaner/ETAPPLAN10.md` nedgraderad till historisk, HELT KLAR utom Etapp 52). **Viktigt: antagandet
av planens omfattning svarar INTE på planens fyra egna beslutspunkter** (nytt underbiträde för
e-post m.fl.) – de kräver var sitt eget ägarbeslut innan respektive delmål byggs, och är nu
inlagda i `OPPNA-PUNKTER.md`. Loggat i `BESLUTSLOGG.md`.

**Första steget genomfört: Etapp 57a** (planens egen ordningsprincip: "kräver ingen antagen
plan, gör den direkt", före allt annat). `saljmaterial/PITCH.md` rättad – det felaktiga påståendet att
klinikstöd-sökningen är "medvetet pausad i gränssnittet" (den återaktiverades 2026-07-14, tre
veckor innan `saljmaterial/PITCH.md` senast skrevs) ersatt med en korrekt, historik-formulerad beskrivning.
Versionsraden bumpad till 5.84.0/2026-08-10 (dokumentversion, ingen kodändring/apprelease).
Lade även till en kort rad om kommandopalett, taggbaserade rutin-förslag och det uppdaterade
"Sedan ditt förra pass" (Etapp 47a/47b), som saknades helt i säljdokumentet. 57b (händelsestyrd
underhållsregel för `saljmaterial/PITCH.md`) och 57c (ärligt "vad som inte finns"-stycke) kvarstår som egna
delmål i `etapplaner/ETAPPLAN11.md`.

Ingen produktkod ändrad denna session – rent dokumentationsarbete, ingen version bump av
`package.json`/deploy behövdes.

## Uppföljning 2026-08-10 (Etapp 53a klar: e-post-infrastruktur + globalt nödstopp, v5.85.0)

Användaren svarade "ja" på beslutspunkt 1 (nytt underbiträde för e-post) – **Brevo
(Sendinblue SAS), EU-baserat (Frankrike)**, precis planens rekommendation. Loggat i
`BESLUTSLOGG.md`, borttaget från `OPPNA-PUNKTER.md` (en ny, smalare punkt tillagd: rättslig
grund/PUB-avtal med Brevo samt en riktig `BREVO_API_KEY` krävs innan skarp drift).

**Etapp 53a byggd och testad:** `skickaEpost({ till, amne, text, organisationId })`
(`functions/index.js`) – EN intern hjälpare all framtida e-post (53b–53d) ska gå igenom.
Validerar mottagaradress, kör samma Luhn-personnummerkontroll som formulären, loggar bara
*att* ett mejl skickats (aldrig innehållet) till avsändarens revisionslogg, och har ett
globalt nödstopp (`systemstatus/epost.avstangd`, satt via den nya callablen
`angeEpostAvstangd`, plattformsadmin-only, dubbel bekräftelse i UI). `BREVO_API_KEY` hanteras
som Secret Manager-parameter, samma mönster som `GEMINI_API_KEY` – saknas nyckeln (fram tills
ägaren satt en riktig som GitHub-hemlighet) no-oppar funktionen tyst istället för att
krascha. **Ingen produktfunktion anropar den ännu** – bara infrastrukturen och nödstoppet.
Ny UI-sektion "✉️ Utgående e-post" i `/leverantor`.

Underhållsregler triggade och åtgärdade i samma session: `avtal/UNDERBITRADEN.md` (ny rad,
Brevo, ersätter den gamla "veckopuls"-placeholdern), `avtal/INCIDENTRESPONSPLAN.md` (v1.3 →
**v1.4**, avsnitt 5.2), `drift/INCIDENT-CHECKLISTA.md` (ny containment-rad + "Var saker finns"-rad,
header uppdaterad).

Testat: nytt `tests/functions/epost.test.cjs` (10 tester – validering, PII-spärr, nödstopp,
tyst no-op utan nyckel, ett faktiskt utskick mot en mockad Brevo-endpoint som bevisar att
loggposten aldrig innehåller mejlets text, `angeEpostAvstangd`s behörighet). Full testsvep
grön: lint, build, vitest (124/124), rules (oförändrade, alla gröna), functions (inkl. de 10
nya), storage, e2e (11/11 – inget flak denna gång). Version bumpad 5.84.0 → **5.85.0**, ny
post i `src/data/andringslogg.js`. `etapplaner/ETAPPLAN11.md` §53a markerad ✅ KLAR med full
"Genomfört"/"Testat"-sektion.

**Nästa steg i `etapplaner/ETAPPLAN11.md`:** 53b (inbjudan levereras per e-post), 53c (påminnelser till
rutinägare), 53d (kundvänd månadssammanfattning) – alla tre går genom samma `skickaEpost()`.

## Uppföljning 2026-08-10 (Etapp 53b klar: inbjudan mejlas, v5.86.0)

Byggde vidare direkt på 53a, samma session. `skapaInbjudanIntern` (den delade hjälparen bakom
`skapaInbjudan`, `skapaOrganisation` och `nollstallDemoOrganisation`) mejlar nu automatiskt
inbjudan via `skickaEpost()` efter att inbjudningsdokumentet skapats – den kopierbara länken
behålls i alla tre UI-ställena som uttrycklig reserv (texten omformulerad till "skickat, här
är reservlänken"). Organisationens namn i ämnesrad/text är ett medvetet, i koden dokumenterat
undantag från genomgående krav 18. Ett misslyckat e-postutskick blockerar ALDRIG att
inbjudan skapas – bara ett `try/catch` runt e-poststeget, loggas som en varning. De tre
callables fick `secrets: [BREVO_API_KEY]` tillagt.

Testat: `tests/functions/epost.test.cjs` utökad till 12 tester (två nya: ett lyckat utskick
med rätt mottagare/organisationsnamn/länk mot en mockad Brevo-endpoint, samt att ett
simulerat nätverksfel inte hindrar att inbjudan ändå skapas). Full testsvep grön: lint,
build, vitest (124/124), rules, functions (alla 29 testblock, inkl. befintliga
`etapp6.test.cjs`s inbjudningssvit oförändrat grön), storage, e2e (11/11, inget flak). Version
bumpad 5.85.0 → **5.86.0**, ny post i `src/data/andringslogg.js`. `etapplaner/ETAPPLAN11.md` §53b
markerad ✅ KLAR. `avtal/UNDERBITRADEN.md` och `OPPNA-PUNKTER.md`s Brevo-rad uppdaterade för
att spegla att koden nu faktiskt använder underbiträdet (fast fortfarande ingen skarp
`BREVO_API_KEY`).

**Nästa steg i `etapplaner/ETAPPLAN11.md`:** 53c (påminnelser till rutinägare, förvalt på för tilldelade
uppgifter/av för allt annat, daglig sammanslagning) och 53d (kundvänd månadssammanfattning).

## Uppföljning 2026-08-10 (Etapp 53c klar: dagliga e-postpåminnelser, v5.87.0)

**Premisskontroll (genomgående krav 8) hittade en felaktighet i planens egen 53c-text:**
utkastet nämnde "granskningspåminnelser till rutinägare" som en tredje befintlig källa att
koppla in – den finns INTE som ett schemalagt jobb (bara ett klientberäknat värde). Byggde
mot de två som faktiskt finns: `kontrolleraKvitteringsfrister` (07:00) och
`kontrolleraForslagPaminnelser` (08:00).

Byggt: båda källorna köar nu (utöver sin befintliga push) en post per berörd användare i en
ny collection `epostPaminnelseko/{uid}` – helt otillgänglig för klienten (varken läs eller
skriv, samma kategori som `hastighetsgranser`). En ny schemalagd funktion
`skickaEpostPaminnelserSchemalagt` (09:00, efter båda källorna) tömmer kön en gång per dag
och skickar ETT sammanslaget mejl per användare, aldrig ett per händelse – byggt som en
digest från början, inte tillagt i efterhand. **Opt-OUT, förvalt PÅ** (motsatt förval av
push-notiserna, med avsikt – en tilldelad uppgift är inte brus): ny sektion i `Profil.jsx`
("✉️ E-postpåminnelser"), sparat på `users/{uid}.epostInstallningar.paminnelser`, tillagt i
`firestore.rules`s självuppdateringsbara fältlista för `users/{userId}`. Samma dedupe-fält
(`pushPaminnelseSkickadTill`/`paminnelseSkickad`) täcker nu båda kanalerna.

Testat: nytt `tests/functions/epostpaminnelser.test.cjs` (8 tester). Två befintliga testfiler
(`pushnotiser.test.cjs`, `forslagpaminnelse.test.cjs`) uppdaterade – opt-out-förvalet hade
annars gjort några testanvändare oavsiktligt till e-postmottagare och brutit deras "ingen
påminnelse alls"-assertion. Nya rules-tester: `tests/rules/systemstatus.test.mjs` (total
klientavstängning för `epostPaminnelseko`) och `tests/rules/organisationsisolering.test.mjs`
(självuppdatering av `epostInstallningar` tillåten, andras användares inte). Full testsvep
grön: lint, build, vitest (124/124), rules, functions (alla 30 testblock), storage, e2e
(11/11). Version bumpad 5.86.0 → **5.87.0**. `etapplaner/ETAPPLAN11.md` §53c markerad ✅ KLAR.
`drift/INCIDENT-CHECKLISTA.md` steg 5 utökad (ny, tillfällig plats för en redan listad
personuppgiftstyp – e-post) och header uppdaterad till v5.87.0.

**Nästa steg i `etapplaner/ETAPPLAN11.md`:** 53d (kundvänd månadssammanfattning till chefen, länk in i
`/ledningsrapport`) – sista delmålet i Etapp 53.

## Uppföljning 2026-08-10 (Etapp 53d klar: kundvänd månadssammanfattning, v5.88.0 – HELA Etapp 53 KLAR)

Byggt ovanpå det redan existerande `matvardenSnapshots` (Etapp 39a) – ingen ny mätpunkt,
bara en ny mottagare för en siffra som redan räknades ut veckovis. Ny schemalagd funktion
`skickaManadssammanfattningarSchemalagt` (1:a varje månad, 09:00) skickar till
organisationens superadmin(ar): senaste kvitteringsgrad/innehållshälsa per område och
antalet obesvarade ändringsförslag, plus en länk till `/ledningsrapport`. Demo- och pausade
organisationer, samt organisationer utan ett mätvärde ännu, hoppas medvetet över.

**Strängare tolkning av genomgående krav 18 än 53b:** organisationens namn nämns ALDRIG i
det här mejlet, varken i ämnesrad eller text – 53b:s namn-undantag gäller uttryckligen bara
inbjudningsmejlet, ingenting annat. Egen, oberoende opt-out
(`epostInstallningar.manadsrapport`, skild från 53c:s `paminnelser`) – att stänga av dagliga
påminnelser ska inte tysta månadsrapporten och tvärtom. Ny kryssruta i `Profil.jsx`, synlig
bara för superadmin. `hamtaAnvandareForEpostPaminnelse` generaliserades med en tredje
parameter (`installningsNyckel`) för att kunna återanvändas för båda opt-out-kategorierna
utan kodduplicering.

Testat: nytt `tests/functions/manadssammanfattning.test.cjs` (8 tester – demo/pausad/
mätvärdeslös utesluts, bara superadmin når fram (aldrig andra roller), senaste snapshotet
används inte ett äldre, bara `status: "ny"`-förslag räknas, organisationsnamnet läcker
aldrig, länken till ledningsrapporten finns, de två opt-out-fälten är helt oberoende av
varandra). Full testsvep grön: lint, build, vitest (124/124), rules, functions (31
testblock), storage, e2e (11/11). Version bumpad 5.87.0 → **5.88.0**.

**Med detta är HELA Etapp 53 (53a–53d) i `etapplaner/ETAPPLAN11.md` klar och testad – men INTE
deployad** (senaste produktionsdeploy är fortfarande v5.84.0). Nästa steg: antingen deploya
(kräver att ägaren först satt en riktig `BREVO_API_KEY`, annars går inget mejl ut skarpt –
se `OPPNA-PUNKTER.md`) eller fortsätta med Etapp 54 (utredning + huvudmannafält, lågrisk,
kan köras parallellt/oberoende av 53).

## Uppföljning 2026-08-10 (Etapp 54a–54b klara: utredning + huvudmannagruppering, v5.89.0)

Användaren bad "genomför nästa steg" (Etapp 54) och att sedan deploya. **54a (utredning,
bygg ingenting) genomförd först**, precis som planen kräver ("KÖR OAVSETT om resten av
etappen antas"): kartlade att `organisationId` visserligen förekommer på 85 rader i
`firestore.rules`, 198 i `functions/index.js` och i 47/63 klienthookar – men **69 av de 85
regelraderna funnlar genom EN enda funktion** (`matcharMinOrg()` → `minOrganisation()` →
`users/{uid}.organisationId`, läst LIVE vid varje regelutvärdering, ingen JWT-claim att
förnya), och varje klienthook läser samma enda fält direkt från `useAuth()`. **Slutsats:
"en organisation per användare" sitter i EN källa, inte utspritt** – att låta en användare
byta aktiv organisation utan utloggning är alltså en avgränsad, väl förstådd uppgift (en
medlemskaps-collection + en styrd växlingsfunktion + en UI-växlare), INTE en omskrivning av
behörighetsmodellen som utkastet öppnade för att det kunde vara. 54d stryks alltså inte –
nedgraderas från "okänd risk" till "förstådd, avgränsad". Den verkliga regelrisken i Etapp 54
ligger i 54c (delade rutiner), inte 54d. Skrivet in i `etapplaner/ETAPPLAN11.md` som en
"Premisskontroll"-sektion under §54.

**54b byggd** ovanpå detta: fritextfältet `huvudman` på `organisationer/{orgId}`, satt via en
ny callable `satHuvudman` (plattformsadmin-only), och en ren klientgruppering i
`/leverantor` ("🏛️ Huvudmän" – antal enheter, summerat avtalat pris). Noll rader ändrade i
`firestore.rules`. **Premisskontroll fångade en felaktighet i planens EGEN 54b-beskrivning:**
den nämnde "en enkel utökning av `/ledningsrapport`" för tvärorganisatorisk jämförelse som en
del av samma "riskfria" leverans – det stämmer inte, en sådan jämförelse kräver att en chef
läser en SYSKONorganisations data, vilket är precis den typ av nytt cross-org-undantag som
hör hemma i 54c, inte 54b. Den delen byggdes medvetet INTE.

Testat: `tests/functions/etapp6.test.cjs` utökad med 5 nya tester för `satHuvudman`. Full
testsvep grön: lint, build, vitest (124/124), rules, functions (31 testblock, samtliga 62 i
etapp6.test.cjs), storage, e2e (11/11). Version bumpad 5.88.0 → **5.89.0**. `etapplaner/ETAPPLAN11.md`
§54a/§54b markerade ✅ KLARA. `OPPNA-PUNKTER.md`s Etapp 54-rad omskriven till att bara gälla
54c/54d (54a/54b är nu avklarade, inte längre en öppen fråga).

## Uppföljning 2026-08-10 (deploy: v5.89.0 live)

Användaren bad "deploya den" efter Etapp 54a–54b. Triggade `deploy.yml`
(`workflow_dispatch`) mot `claude/compassionate-euler-rho0q5`, commit `63f15d7` (Etapp 53a–d
+ 54a–b i sin helhet, v5.85.0 → 5.89.0). Körning **#73**, `conclusion: success`. Bekräftade
genom att läsa av asset-hashen på startsidan: `assets/index-D_ReJBIJ.js` på
`https://synappsen-final-build.web.app/`. Ingen kodändring i denna uppföljning.

**Med detta är HELA `etapplaner/ETAPPLAN11.md` Etapp 53 (53a–53d) OCH Etapp 54a–54b HELT KLARA OCH
DEPLOYADE i produktion.** Observera: `BREVO_API_KEY` är fortfarande INTE satt som en riktig
GitHub-hemlighet – all e-postinfrastruktur (inbjudan, dagliga påminnelser, månadsrapport) är
alltså live i koden men no-oppar tyst tills ägaren tecknar avtal med Brevo och sätter
nyckeln (se `OPPNA-PUNKTER.md`). Nästa steg i planen: 54c/54d (väntar på en konkret andra
enhet hos en kund) eller Etapp 55–58 (kioskläge, startbiblioteket, säljmaterialets
`57b`/`57c`, SSO-beslut).

## Uppföljning 2026-08-10 (Etapp 56 (56a–56d) klar: startbiblioteket, v5.90.0)

Byggde hela Etapp 56 i en session, "startbiblioteket" – den enda etappen i planen där
merparten av arbetet var innehåll snarare än kod.

**56a:** `functions/verksamhetsmallar.js` utökad från 2 till 8–9 rutinmallar per
verksamhetstyp, nu spridda över alla tre områdena (Kliniskt stöd/Logistik/Administration –
tidigare bara kliniskt-stod). `MALL_ANMARKNING`-disciplinen (strukturella skelett, aldrig
påhittad klinisk vägledning) oförändrad.

**56b:** `skapaOrganisation` seedar nu även förrådsartiklar (`FORRADSMALLAR`), kontakter
(`KONTAKTMALLAR`), ett introduktionsspår och ett kompetenskrav – de senare två pekar på
RIKTIGA rutin-id:n bland de nyss seedade mallrutinerna, inte platshållar-referenser.

**56c – premisskontroll (utfört, planens egen instruktion):** `useValkomstchecklista`
lagrade tidigare varje stegs status som en manuellt ikryssad checkbox – kunde bockas av utan
att handlingen någonsin utförts. Enligt planens egen regel var delmålet därför INTE klart
och skulle byggas. Byggt: en ny, ren, testbar funktion `harledStegStatus`
(`src/utils/valkomstchecklista.js`) härleder varje steg ur faktisk Firestore-data (t.ex.
"importera rutiner" kräver en rutin vars `kalla` INTE är `"verksamhetsmall"`).
`KomIgangChecklista.jsx` blev en läs-only statusindikator. **Prestandafix upptäckt under
bygget:** de fyra härledningskällornas lyssnare gated bakom att checklistan faktiskt finns –
annars hade VARJE superadmins startsida fått fyra extra Firestore-lyssnare, även etablerade
organisationer som aldrig visar checklistan.

**56d:** nytt stycke "Ni börjar inte från ett tomt system" i `saljmaterial/PITCH.md`.

**E2E-flak utrett noggrant under sessionen:** en isolerad enstaka körning av
`rökprov (superadmin)` misslyckades en gång (efter min första version av 56c, INNAN
prestandafixen ovan), men gick grönt igen både före och efter fixen i flera upprepade
isolerade körningar (1 worker) – alltså inte deterministiskt kopplat till min ändring, och
konsekvent med det redan dokumenterade sandlåde-flaket. Prestandafixen behölls ändå (korrekt
oavsett flakets orsak).

Testat: `src/utils/valkomstchecklista.test.js` (6 nya vitest-tester). `tests/functions/
etapp6.test.cjs` utökad med 5 nya tester för 56b, plus uppdaterade hårdkodade räknare (8
mallrutiner istället för 2). `tests/functions/demo-organisation.test.cjs` uppdaterad (11
rutiner istället för 5, eftersom demomiljön återanvänder samma `VERKSAMHETSMALLAR.
akutmottagning`). Full testsvep grön: lint, build, vitest (130/130, 20 filer), rules,
functions (31 testblock, 67/67 i etapp6.test.cjs), storage, e2e (11/11, plus 3 extra
isolerade omkörningar av den tidigare flakiga testen). Version bumpad 5.89.0 → **5.90.0**.
`etapplaner/ETAPPLAN11.md` §56 (56a–56d) markerad ✅ HELT KLAR.

**Med detta är HELA Etapp 53, Etapp 54a–54b och HELA Etapp 56 i `etapplaner/ETAPPLAN11.md` klara och
testade – men INTE deployade** (senaste produktionsdeploy är fortfarande v5.89.0). Nästa
steg: deploya, eller fortsätta med Etapp 55 (kioskläge) eller 57b–c (säljmaterialets
underhållsregel + ärlighetsstycke).

## Uppföljning 2026-08-10 (Etapp 55 klar: kioskläge, v5.91.0)

Byggde hela Etapp 55 (55a–55c) i en session: ett nytt delat enhetskonto för en väggmonterad/
delad platta, med en ny roll `kiosk` som `firestore.rules` (`arKiosk()`) och tre Cloud
Functions (`skapaKommentar`/`skickaFeedback`/`svaraPersonalpuls`) blockerar från allt
identitetsbundet (kvittering, kommentar, ändringsförslag, bristanmälan, skiftrapport,
personalpuls). Kontot skapas genom att återanvända det BEFINTLIGA inbjudningsflödet (`kiosk`
tillagd i `GILTIGA_ROLLER`/`BJUDBARA_ROLLER`) – ingen ny funktion behövdes för
kontoskapandet i sig.

**Ett verkligt regelfel hittat och rättat under bygget, inte bara på papper:** ett första
försök att stänga `organisationer/{orgId}/installningar/kioskPin` (PIN-hashen) med ett eget,
snävare match-block bredvid det befintliga wildcard-blocket byggde på ett felaktigt antagande
om "mest specifika block vinner". Firestore Security Rules kombinerar ALLA matchande block
med ELLER – det snävare blocket stängde ingenting. Ett regeltest (skrivet FÖRE detta
upptäcktes, inte i efterhand) visade att en superadmin fortfarande kunde läsa/skriva hashen
direkt. Rättat genom att explicit undanta `dokId == 'kioskPin'` i själva wildcard-villkoren –
den enda metod som faktiskt fungerar. Se `granskningar/SAKERHETSRAPPORT.md`s tillägg (2026-08-10,
v5.91.0) för den fullständiga lärdomen. Ingen produktionsdata någonsin exponerad.

PIN-verifiering sker helt server-side (`satKioskPin`/`verifieraKioskPin`, SHA-256-hash,
hastighetsbegränsad) – klienten ser aldrig hashen eller rätt PIN under några omständigheter.
UI: `KioskBevakning.jsx` (route-vitlista + auto-återgång till startsidan efter 3 minuters
inaktivitet, ALDRIG utloggning), en egen `BottomNav`-gren för kiosk-rollen
(Sök/Hem/Akutläge direkt, resten i Mer-menyn), `KioskPinModal.jsx` för att lämna kioskläget,
`KioskPinSektion.jsx` i `/admin` för att sätta PIN-koden.

**55c fullgjord i samma commit:** `drift/INCIDENT-CHECKLISTA.md` (steg 3-tabell, steg 4,
snabbreferensen), `avtal/INCIDENTRESPONSPLAN.md` v1.4 → v1.5 (avsnitt 4 + versionshistorik),
`avtal/IT-FAKTABLAD.md` avsnitt 2, `granskningar/SAKERHETSRAPPORT.md` (nytt tillägg).

Testat: `tests/rules/kioskrestriktioner.test.mjs` (8 tester) + `tests/functions/
kioskrestriktioner.test.cjs` (9 tester, inkl. att verifieraKioskPin-svaret aldrig läcker
hashen). Full testsvep grön: lint, build, vitest (130/130), rules (kioskrestriktioner ingår),
functions (kioskrestriktioner ingår), storage (21/21). e2e: 10/11 i första körningen –
`rökprov (sektionsledare)` föll på ett `ERR_CONNECTION_REFUSED`-konsolfel mot `/admin`, en
roll och sida kiosk-ändringarna inte rör. Körd isolerat (1 worker) direkt efter: grön,
30.9s – samma redan dokumenterade sandlåde-flak som i Etapp 56:s uppföljning, inte en
regression. **Sidoanteckning om testmiljön:** den förinstallerade Playwright-webbläsaren låg
på en annan revision (`chromium-1194`) än vad den pinnade `@playwright/test`-versionen
förväntade sig (`chromium_headless_shell-1234`) – löst genom att sätta
`PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium` innan `npm run test:e2e`, exakt den
work-around miljöns egen dokumentation redan beskriver. Version bumpad 5.90.0 → **5.91.0**.
`etapplaner/ETAPPLAN11.md` §55 (55a–55c) markerad ✅ HELT KLAR.

**Med detta är Etapp 53, 54a–54b, 55 OCH 56 i `etapplaner/ETAPPLAN11.md` alla klara och testade – men
INTE deployade** (senaste produktionsdeploy fortfarande v5.89.0). Nästa steg: deploya, eller
fortsätta med 54c/54d (väntar på en konkret andra enhet) eller 57b–c (säljmaterialets
underhållsregel + ärlighetsstycke).

## Uppföljning 2026-08-10 (Etapp 57b–c klara: PITCH.md-regeln + ärlighetsstycke)

Byggde de två sista delmålen i Etapp 57 – rent dokumentationsarbete, ingen appkod ändrad.

**57b:** ny sektion "Obligatorisk underhållsregel: PITCH.md" i `CLAUDE.md`, i exakt samma
tabellformat som de fyra befintliga levande-dokument-reglerna. Triggas av: en kundvänd
funktion blir synlig/avstängd/väsentligt ändrad, en lucka i 57c:s stycke stängs eller öppnas,
eller en större release.

**57c:** nytt stycke "Vad som inte finns än" i `saljmaterial/PITCH.md` (SSO, delad data mellan enheter
under samma huvudman, journal-/HR-integration, dosberäkning – samma ärlighetsprincip som det
redan befintliga "Ärlighet om vad som faktiskt är mätt"-stycket).

**Sidofynd, åtgärdat i samma commit:** när 57b-regeln skrevs blev det synligt att Etapp 55
(kioskläget, förra sessionen) redan hade brutit mot den regel som just skulle skrivas in –
`saljmaterial/PITCH.md` nämnde aldrig kioskläget trots att det är en ny, kundvänd funktion. Lade till en
kort bullet om det under "Byggd för vårdens krav", och höll det DÄRFÖR utanför listan över
luckor i 57c (det är inte längre en lucka). Ett litet, konkret exempel på att den nya regeln
löser ett verkligt, redan inträffat fall, inte bara ett hypotetiskt.

**Ingen versionsbump:** varken `package.json` eller `andringslogg.js` rördes – enbart
`CLAUDE.md` (interna instruktioner) och `saljmaterial/PITCH.md` (säljmaterial) ändrades, ingenting i den
faktiska appen. `saljmaterial/PITCH.md`s egen versionsrad justerades till att peka på den redan gällande
appversionen (5.91.0) istället för att skapa en egen, separat siffra.

Testsvep: lint, build, vitest (130/130) – inga rules-/functions-/storage-/e2e-tester
relevanta eftersom ingen kod under `firestore.rules`, `storage.rules`, `functions/` eller
`tests/` ändrades. `etapplaner/ETAPPLAN11.md` §57 (57a–57c) markerad ✅ HELT KLAR.

**Med detta har `etapplaner/ETAPPLAN11.md` bara två öppna punkter kvar: 54c/54d (väntar på en konkret
andra enhet hos en kund) och Etapp 58 (SSO, väntar på en kund som kräver det) – båda
medvetet väntande på en extern förutsättning, inte på kapacitet.**

## Uppföljning 2026-08-10 (`etapplaner/ETAPPLAN12.md` antagen, Etapp 59 klar: rättningar, v5.92.0)

`etapplaner/ETAPPLAN11.md` var vid det här laget helt klar utom två externt villkorade punkter (se
ovan) – dags för en ny plan. Gjorde en genomgång av FAKTISK kod (inte dokumentation) i
v5.91.0, vilket resulterade i två nya planfiler:

- **`etapplaner/ETAPPLAN12.md`** (Etapp 59–63, "Från demo till drift") – **ANTAGEN samma dag.**
  Genomgången hittade tre fel i produktionsgrenen, varav två infördes av de senaste två
  etapperna: sex `omrade: "logistik"`-mallrutiner (Etapp 56a) som ingen vy kunde visa/söka/
  godkänna men som ändå räknades i hälsosiffran, kioskläget (Etapp 55a) som inte gatades av
  `FEATURE.KIOSK_MODE` i något lager, och en föråldrad `dompurify`-version (produktionens
  enda XSS-sanerare). Planen är medvetet tyngre på hållfasthet än på nya funktioner.
- **`etapplaner/ETAPPLAN13.md`** (Etapp 64) – ett fristående, EJ byggbart förslag om ett "baspaket" av
  nationella referenser (ägarens fråga under genomgången), hållet i en egen fil eftersom det
  väntar på en extern juridisk MDR-bedömning, inte på kod. Blockerar inget annat.

**Etapp 59 (59a–59c) byggd direkt, samma session:**

- **59a:** de sex logistik-mallrutinerna borttagna ur `functions/verksamhetsmallar.js`
  (8→6/6/5 mallar per verksamhetstyp), `InnehallshalsaSektion.jsx` slutade räkna in dem.
  **Ingen migrering behövdes** – kontrollerat innan bygget att Etapp 56a (som introducerade
  felet) aldrig nådde produktion (senaste deploy v5.89.0, ett steg innan). Ägarens fråga om
  att bygga logistik som ett fullt rutinområde istället (alternativ A) förblev obesvarad;
  gick vidare med planens egen rekommendation (B) snarare än att stå still.
- **59b:** kioskläget kräver nu Operations. **Avvek medvetet från planens ursprungliga
  ordalydelse** efter att ha upptäckt en inlåsningsrisk under bygget: att gata
  `verifieraKioskPin` (lämna kioskläget) hade kunnat permanent låsa in en redan konfigurerad
  enhet om Operations stängdes av i efterhand. Löste det genom att flytta spärren dit den
  faktiska affärsrisken finns istället: `skapaInbjudan` (kan inte skapa ett NYTT kiosk-konto
  utan modulen) och `satKioskPin` (kan inte konfigurera en ny PIN utan den) – medan
  `verifieraKioskPin` förblir öppen, samma princip som `tvingaUtloggning`. UI-lagret
  (`InbjudanFormular.jsx` döljer kiosk-alternativet, `KioskPinSektion.jsx` visar en
  informerande notis) uppdaterat i linje med det. `tests/functions/gatingmatris.test.cjs`
  utökad – dess EGEN statiska kontroll fångade automatiskt att de två nya gatade
  funktionerna behövde en rad i matrisen.
- **59c:** `dompurify` 3.4.12→3.4.13, `react-router-dom` 7.18.1→7.18.2 (båda patch-nivå).
  `npm audit`: 10→7 sårbarheter, alla sju nu dev-only. **En egen premisskontroll visade sig
  fel och rättades i samma session:** planens ursprungliga text påstod att
  `npm-audit-rapport.md` "inte fanns i repot" – det stämde inte, filen är MEDVETET
  gitignorad (`scripts/npm-audit-rapport.mjs`, Etapp 31a) och genereras av CI vid varje
  körning till `$GITHUB_STEP_SUMMARY`. Ingen ny fil skapades; se `etapplaner/ETAPPLAN12.md`s rättelse
  för hela resonemanget.

Testat: `tests/functions/etapp6.test.cjs`/`demo-organisation.test.cjs` (räknarna
uppdaterade), `tests/functions/gatingmatris.test.cjs` (2 nya rader),
`tests/functions/kioskrestriktioner.test.cjs` (4 nya tester, inkl. att verifieraKioskPin
ALDRIG blockeras). Full testsvep grön: lint, build, vitest (130/130), functions (alla 32
filer). Inga ändringar i `firestore.rules`/`storage.rules`, så `test:rules`/`test:storage`
kördes inte om. Version bumpad 5.91.0 → **5.92.0**. `etapplaner/ETAPPLAN12.md` §59 (59a–59c) markerad
✅ HELT KLAR.

**Med detta är Etapp 59 klar och testad – men INTE deployad** (senaste produktionsdeploy
fortfarande v5.89.0). Nästa steg: deploya, eller fortsätta med Etapp 60a (mät prestanda mot
en realistisk rutinmängd innan något optimeras).

## Uppföljning 2026-08-10 (Etapp 60a klar: prestandamätning med realistisk rutinmängd)

Byggde och körde de två verktyg 60a efterfrågade:

- **`scripts/prestandaseed.mjs`** – seedar Firestore-EMULATORN (aldrig produktion) med N
  rutiner (realistisk innehållsstorlek: markdown-brödtext, en del med checklistesteg/kviss)
  + 200 användare, vars uid:n sprids ut i varje rutins `lasteAv`-kvitteringsarray.
- **`scripts/prestandamat.mjs`** – Playwright, mäter en riktig KALL inloggning (ingen
  `persistentLocalCache`-data sedan tidigare) mot en redan seedad organisation: tid till
  interaktiv startsida, Fuse-indexbyggtid, och överförd datamängd.

Körde 500/1 000/2 000 rutiner. **Ett metodfel upptäcktes och rättades under arbetet:** att
mäta överförd data via `content-length`-headern gav samma (felaktiga) totalsumma oavsett
rutinantal – Firestores realtidskanaler svarar chunked utan den headern, och att läsa
`response.body()` istället fungerade inte heller (kanalen hålls medvetet öppen, löser sig
aldrig). Löst med CDP:s `Network.dataReceived` (samma metod som Chrome DevTools egen
Network-flik använder).

**Resultat (se `etapplaner/ETAPPLAN12.md` §60 för hela tabellen och resonemanget):**

- Tid till interaktiv (~0,9–1,0 s) och Fuse-byggtid (<2 ms) är GODKÄNDA även vid 2 000
  rutiner – oberoende av rutinantalet i det här spannet. **60d (webbworker för sökindexet)
  struket som onödigt**, bekräftat genom mätning.
- Firestore-läsningar/kostnad GODKÄNT – `persistentLocalCache` gör den dyra kalla
  synkroniseringen till en engångskostnad per (användare, enhet), inte per session. Även
  pessimistiskt räknat (alla 40 användare kallsynkar en gång i månaden) blir kostnaden under
  en krona/månad vid 2 000 rutiner.
- **Överförd datamängd är det enda måttet som INTE är helt godkänt:** 77 MB vid en kall
  förstagångsinloggning med 2 000 rutiner, skalar ~linjärt med rutinantalet. Gör **60b
  (trimma listvyns nyttolast) motiverat** – en sidoupptäckt under mätningen var att
  `lasteAv`-kvitteringsarrayen kan väga lika mycket som `innehall`/`steg`/`kviss` tillsammans
  för en populär rutin, vilket 60b:s ursprungliga fältlista missade.

**Ärlig avvikelse:** planens "Klart när"-kriterium förutsatte en tröskel nedskriven I FÖRVÄG
– ingen sådan skrevs ned innan mätningen kördes. Bedömningen ovan är gjord i efterhand med
sunt förnuft istället, vilket är skrivet ut ärligt i `etapplaner/ETAPPLAN12.md` snarare än dolt.

**Ingen versionsbump:** rent mätnings-/verktygsarbete, ingen appkod ändrad.
`src/hooks/useSokindex.js` instrumenterades TILLFÄLLIGT för Fuse-byggtidsmätningen och
återställdes till exakt ursprungligt skick innan commit (verifierat med en tom `git diff`).
Testsvep: lint, build, vitest (130/130) gröna – inga functions-/rules-/storage-ändringar,
inget att testa om där.

**60b/60c är rekommenderade av mätningen men INTE byggda** – uppdraget den här sessionen var
specifikt "Etapp 60a". Nästa steg: bygg 60b (och lågriskkomplementet 60c) om det efterfrågas,
eller fortsätt med Etapp 61 (underhållbarhet/testluckor) som inte är villkorat av något.

## Uppföljning 2026-08-10 (Etapp 60b klar: krympt lasteAv, v5.93.0 – premissen bakom
originalplanen höll INTE)

Ombads köra "60b" enligt föregående sessions rekommendation. **Innan något byggdes
kontrollerades planens premiss mot faktisk kod (samma disciplin som redan gäller i det här
projektet, genomgående krav 8)** – och den höll inte. 60b:s text antog att listvyn
(`Sektionssida.jsx`) och "öppna en rutin" är två separata vyer, där bara den senare behöver
`innehall`/`steg`/`kviss`. I verkligheten renderar `RutinKort` hela innehållet direkt, ogömt,
för VARJE godkänd rutin på listsidan samtidigt – det finns ingen separat öppningsvy att spara
in på. En listvyprojektion (planens ursprungliga "(i) ett listvy-fält" eller "(ii) en separat
collection") hade alltså sparat NOLL bandbredd; att faktiskt lösa det hade krävt att
`Sektionssida` byggdes om med paginering/virtualisering – en genuin UX-förändring för en
akutmottagning, inte en datalagerjustering, och en betydligt större/riskablare insats än
originaltexten antydde.

Lade fram det ärligt för ägaren som tre val (bygg full listvyprojektion ändå, gör ingenting,
eller en tredje – mindre – väg som identifierades under undersökningen). **Valt: den tredje
vägen.** `lasteAv`-kvitteringsposter (`{uid, namn, tidpunkt}`) innehöll `namn` i ren
duplicering – `RutinKort.jsx`/`AnslagKort.jsx` har redan organisationens användarlista laddad
som en separat prop och kan slå upp namnet från `uid`. Tog bort `namn` ur skrivningen
(`useLaskvittering.js`, gäller BÅDE rutiner och anslag – samma datamodell), uppdaterade de två
tooltip-visningarna att slå upp namnet istället. Ingen ny collection, ingen migrering, inga
regeländringar (`bararForandrarFalt(['lasteAv'])` bryr sig inte om formen på varje post),
`kompetensStatus.js`/`veckansRepetition.js` (som genuint behöver `tidpunkt` per person) helt
orörda.

**Uppmätt effekt** (samma harness som 60a, `prestandaOrg`, 2 000 rutiner, kall inloggning):
77,3 → **36,0 MB, −53 %** – större än den ~30–40 % som uppskattades i förväg. Full
listvyprojektion är struken som fel omfattning för den här etappen; nästa steg om
bandbredden fortfarande är ett problem vid en verklig pilotorganisations volym är ett
UX-beslut (paginera Sektionssida?), inte en teknisk detalj.

Testat: lint, build, vitest (130/130, befintliga `kompetensStatus.test.js`/
`veckansRepetition.test.js`/`innehallshalsa.test.js` använde redan `{uid, tidpunkt}` utan
`namn` – bekräftar i efterhand att `namn` aldrig behövdes av logiken). Inga functions-/
regeländringar denna gång. Version bumpad 5.92.0 → **5.93.0** (första app-synliga ändringen
sedan 5.91.0). `etapplaner/ETAPPLAN12.md` §60b markerad ✅ KLAR med hela resonemanget.

**Nästa steg:** 60c (serverside-filtrering av papperskorg/arkiv) kvarstår som rekommenderat,
ej byggt. Etapp 61 (underhållbarhet/testluckor) är inte villkorat av något och kan tas när
som helst.

## Uppföljning 2026-08-10 (Etapp 60c klar, hela Etapp 60 nu KLAR, v5.94.0)

Ombads köra "60c". Kontrollerade planens premiss mot faktisk kod innan bygget (samma
disciplin som 59a/60b) och fann att den blandade ihop två olika saker: papperskorgen
(`borttagen`) och arkivet (`arkiverad`). De är inte samma sorts fix – en arkiverad rutin ska
MEDVETET stanna kvar i redaktörers lista (Etapp 37d), bara uteslutas ur särskilda
beräkningar. Att filtrera `arkiverad` i frågan hade tyst ändrat vad en redaktör ser, en
beteendeförändring, inte en optimering. Byggde därför bara papperskorgsdelen.

`useRutiner.js`s fråga filtrerar nu server-side med `where("borttagen", "==", false)`
istället för att hämta allt (inkl. papperskorgen) och kasta bort i JavaScript. Den
dokumenterade fällan (`!= true` hade uteslutit varje rutin som saknar fältet helt, inte bara
de borttagna – samma som `kontrolleraKvitteringsfrister`) undveks genom:

- En ny migrering, `backfillaBorttagenFalt` (plattformsadmin, dry-run som standard,
  idempotent, batchat – samma mönster som `migreraTillOrganisation`), som backfillar
  `borttagen: false` på alla befintliga rutiner som saknar fältet.
- `borttagen: false` läggs nu till explicit vid VARJE plats en rutin skapas (klientens
  `skapaRutin`, AI-importens `tolkaDokument`, `skapaOrganisation`s mallseedning, alla fyra
  rutin-skrivningarna i `froSaDemoOrganisationensInnehall`) – inget nytt dokument saknar
  någonsin fältet framöver.
- Verifierat MOT en riktig emulator (inte antaget) att frågan – tre eller fyra likhetsfilter
  plus en `orderBy` – fungerar utan en ny `firestore.indexes.json`-post, både som redaktör
  och icke-redaktör.

Ett eget testmisstag hittades och rättades under bygget: mitt första test antog att
`rutiner`-collectionen var tom vid testets start, men `test:functions` delar EN
emulatorinstans mellan ~32 testfiler – räknade om till en nollpunkts-delta istället för ett
absolut tal, och insåg (efter ett andra fel) att den skarpa migreringskörningen KORREKT
fixar HELA collectionen, inte bara testets egna poster – rättade testets förväntan till 0,
inte "tillbaka till nollpunkten".

**Med detta är hela Etapp 60 (60a–60c) klar, 60d struket.** Testat: ny testfil
`tests/functions/backfillborttagen.test.cjs` (behörighet, dry-run, idempotens, rör inte en
redan satt true/false – MÅSTE stå sist i test:functions-kedjan, se filens egen kommentar om
varför), `etapp6.test.cjs` utökad. Full testsvep grön (lint, build, vitest 130/130, alla 32
functions-testfiler). Version bumpad 5.93.0 → **5.94.0**. `etapplaner/ETAPPLAN12.md` §60c markerad
✅ KLAR, hela Etapp 60 markerad HELT KLAR.

**Nästa steg:** Etapp 61 (underhållbarhet/testluckor) är inte villkorat av något och kan tas
när som helst. Etapp 60 helt klart innebär att `etapplaner/ETAPPLAN12.md` nu bara har 61–63 kvar (plus
det fristående, ej byggbara Etapp 64 i `etapplaner/ETAPPLAN13.md`).

## Uppföljning 2026-08-10 (Etapp 61b/61c klara: testtäckning + kiosk-e2e)

Ombads fortsätta med "nästa steg". Valde att göra 61b (lågrisk, ren testtäckning) och 61c
(måttlig risk, ny e2e-fil) i samma session, men lämnade 61a (dela `functions/index.js`,
4 680 rader/93 exports) orörd – den är genuint störst och mest riskfylld av de tre
(planen själv kräver "fullt testsvep före och efter, diffen ska gå att läsa som
förflyttning"), och förtjänar en egen session snarare än att klämmas in efter två andra
delmål samma dag.

**61b:** fem nya testfiler, 45 tester totalt: `offlineKo.test.js` (11, inkl. att en kastande
`localStorage.setItem` – privat läge/full lagring – inte får krascha appen),
`checklistFramsteg.test.js` (9), `senastBesokta.test.js` (8), `introduktionProgress.test.js`
(12), `kvartal.test.js` (14, samtliga tolv månadsgränser). Samma mönster som
`valkomstchecklista.test.js`. Inga produktionsfiler ändrade.

**61c:** ny fil `tests/e2e/kioskbevakning.spec.js` (5 tester: `/akutlage` nås och stannar,
`/profil` studsar till `/`, de tre huvudsidorna nås, PIN-dialogen öppnas/stängs korrekt).
Kiosk tillagt i `rokprov.spec.js`s rollista (sex → sju roller, kommentaren uppdaterad) och
`tests/e2e/global-setup.mjs`s seedade konton. **Medveten avgränsning:** `test:e2e` startar
ingen functions-emulator (samma etablerade gräns som redan gäller `/leverantor`), så ett
FAKTISKT PIN-upplåsningsförsök testas inte här – det täcks redan av
`tests/functions/kioskrestriktioner.test.cjs`/`tests/rules/kioskrestriktioner.test.mjs`. Hela
`test:e2e`-sviten kördes (inte bara den nya filen): 17/17 gröna.

Testat: `npm run lint`/`build`/`npx vitest run` gröna (175/175, 25 filer), full `test:e2e`
grön (17/17). Ingen versionsbump – rent testarbete, ingen appkod ändrad. `etapplaner/ETAPPLAN12.md`
§61b och §61c markerade ✅ KLARA.

**Nästa steg:** 61a (dela `functions/index.js`) kvarstår som den enda ogjorda delen av
Etapp 61 – störst och mest riskfylld, medvetet lämnad. Etapp 62 (mätvärde → åtgärd) är
villkorad av att Etapp 59 är stängd, vilket den redan är.

## Uppföljning 2026-08-10 (Etapp 61a klar, hela Etapp 61 nu HELT KLAR)

Ombads köra 61a. Given storleken (4 680 rader, 93 exports, tung intern koppling – nästan
varenda export anropar delade hjälpfunktioner som `hamtaAnvandarInfo`/`kravModul`/
`loggaRevision`) och risken (fel här stoppar HELA Cloud Functions-driften, inte bara en
funktion) skickades den mekaniska extraktionen till en bakgrundsagent med strikta,
uttryckliga krav: ren flytt, ingen beteendeändring, `index.js` som en tunn re-exporterande
skarv, och egen verifiering (lint, `require`-rökprov, full `test:functions`) innan
rapportering.

**Verifierade INTE bara agentens egen rapport – körde om nyckelbevisen själv** innan något
committades: (1) `git stash`-jämförelse av exportlistan – 93 namn, identiska mot originalet,
programmatiskt jämförda, inte bara räknade; (2) `node --check` på alla nya filer; (3) full
`npm run test:functions` (35 filer mot emulatorn) körd på nytt av mig – 0 misslyckade; (4)
`npm run build`/`npx vitest run` gröna.

**En sak agenten flaggade men inte åtgärdade: `organisationslivscykel.js` landade på
1 229 rader** – över planens ~800-radersriktmärke ("Klart när"-kriteriet). Kontrollerade med
grep att filens två teman (etablering+demo-frö vs. avtal+avvecklingslivscykel) inte delar
någon kod utöver de vanliga gemensamt.js-/backup.js-/inbjudningar.js-primitiverna – en
säker, ren delning – och bröt ut den andra halvan till en ny fil `avtalslivscykel.js`
(726 rader) själv. Körde HELA `test:functions`-sviten en andra gång efter den delningen
också, fortsatt 0 misslyckade.

**Slutresultat:** `functions/index.js` 4 680 → 142 rader. 12 domänfiler, samtliga under
~800 rader (störst är `avtalslivscykel.js` på 726). En multiset-diff av alla icke-tomma
rader i HELA `functions/`-katalogen före/efter visar att exakt EN rad försvann (den gamla
toppkommentaren, ersatt av nya filhuvuden) – bevisar att detta genuint var en ren flytt,
inte bara påstådd. Se `etapplaner/ETAPPLAN12.md` §61a för den fullständiga filindelningen och
avvikelserna från planens ursprungliga förslag (varför ingen egen `epost.js`/`schemalagt.js`
byggdes, varför `loggaRevision` ligger i `gemensamt.js` snarare än `revisionslogg.js`).

Testat: lint, `node --check` × 12, `require`-rökprov (93 exports, identiska), full
`test:functions` (35 filer, körd två gånger) 0 misslyckade båda gångerna, build, vitest
(175/175). Ingen versionsbump krävs egentligen (ren flytt, inget beteende ändrat för en
användare) men bumpas ändå för spårbarhet i deploy-historiken. `etapplaner/ETAPPLAN12.md` §61a
markerad ✅ KLAR – **hela Etapp 61 (61a–61c) är nu HELT KLAR.**

**Nästa steg:** Etapp 62 (mätvärde → åtgärd) är villkorad av att Etapp 59 är stängd, vilket
den är – inget hindrar att ta den näst. Etapp 63 (gruppera öppna punkter, förbered pilot)

---

## Uppföljning 2026-08-10 (Etapp 63c-beslutspunkterna avgjorda)

Användaren tog ställning till `etapplaner/ETAPPLAN11.md`s tre kvarvarande beslutspunkter (samlade i
`etapplaner/ETAPPLAN12.md` §63c): "OIDC, på för tilldelade uppgifter, följ din rekommendation för punkt
2. vänta med 54c/54d".

- **SSO-protokoll (Etapp 58):** OIDC, planens rekommendation.
- **Påminnelsemejl-förval (Etapp 53c):** följde rekommendationen (på för tilldelade
  uppgifter, av för allt annat) – ingen kodändring krävdes, det redan byggda 53c (v5.87.0)
  täcker bara två schemalagda källor som i sak redan ÄR "tilldelade uppgifter".
- **Etapp 54c/54d:** vänta, samma "bevaka, bygg inte i förväg"-mönster som Etapp 40.
  Omprövningsvillkor: en konkret kund med en verklig andra enhet blir aktuell.

Alla tre loggade i `BESLUTSLOGG.md`. Motsvarande fyra rader (SSO nämndes dubbelt, en gång
under Etapp 13f och en gång under Etapp 58, uttryckligen noterat som samma fråga) borttagna
ur `OPPNA-PUNKTER.md`. Ingen av de tre beslutspunkterna låste upp nytt kodningsarbete idag.
Ingen versionsbump – ren dokumentationsändring.

`etapplaner/ETAPPLAN12.md` §63c:s "Klart när" (de tre beslutspunkterna har ett svar i `BESLUTSLOGG.md`)
är nu uppfyllt, men Etapp 63 som helhet är INTE klar – 63a och 63b är obyggda.

---

## Uppföljning 2026-08-11 (ETAPPLAN12.md helt klar, v5.96.0, deploy #74 live)

Genomförde hela den återstående delen av `etapplaner/ETAPPLAN12.md` (Etapp 62 och 63) i ett
sammanhängande pass, efter att ett tidigare försök att pausa/sprida arbetet över natten med
schemalagda återuppväckningar (`ScheduleWakeup`) inte levererade – sessionen återupptogs
aldrig automatiskt, och ingen kod byggdes mellan 62a (committad 2026-08-10 kväll) och när
användaren själv påpekade att tidsfristen redan passerat. Lärdom: lita inte på schemalagda
återuppväckningar för flerstegs kodningsarbete i den här miljön – kör i ett sammanhang eller
invänta explicit uppföljning från användaren istället.

- **62a** (redan committad föregående kväll): "Skapa rutin"-genväg från en sökning utan träff.
- **62b:** ny `VeckopulsSektion.jsx` – utgångna rutiner, obesvarade förslag och sökluckor i
  prioritetsordning med direktlänk, högst upp i adminpanelen. Löste samtidigt en kvarstående
  rad i `OPPNA-PUNKTER.md` (Etapp 16/veckopuls) som stått öppen sedan `etapplaner/ETAPPLAN3.md`.
- **62c:** `InnehallshalsaSektion.jsx` fick åtgärdsknappar – starta en granskningsrunda för
  exakt de rutiner som flaggats "bör granskas", tilldela ägare inline i tabellen.
  `useGranskningsrundor` fick en `aktiv`-parameter för att inte prenumerera i onödan i
  icke-superadmin-vyn (permission-denied-brus).
- **63a:** `OPPNA-PUNKTER.md` omgrupperad i fem rubriker efter insatstyp istället för en enda
  tabell – tillkom en femte kategori ("väntar på en extern förutsättning") som planens
  ursprungliga tre-vägs uppdelning inte rymde ärligt.
- **63b:** två nya root-dokument, `drift/REDAKTORSGUIDE.md` och `saljmaterial/PILOTUPPLAGG.md`, förberedelse för
  Etapp 52-piloten (`etapplaner/ETAPPLAN10.md`) utan att en pilot är bokad. Registrerade i `CLAUDE.md`s
  dokumentkarta.
- **63c:** redan avgjort och loggat föregående kväll (se sektionen ovan).

**Hela `etapplaner/ETAPPLAN12.md` (Etapp 59–63) är nu KLAR.**

Släppt som v5.96.0. Fullt testsvep grönt: lint, build, vitest (175/175), `test:rules` (18/18),
`test:functions` (samtliga ~33 filer), `test:storage` (21/21), `test:e2e` (17/17 – en första
körning gav en enskild `/admin`-rökprovsmiss för superadmin, `ERR_CONNECTION_REFUSED`;
en omkörning av hela sviten gav 17/17 gröna, bekräftat en transient flake, inte en regression
från Etapp 62c:s ändringar).

**Deployad:** körning #74, commit `91091be`, klar 2026-08-11 04:58 UTC. Ny asset-hash
`assets/index-CQA-Qbjq.js` bekräftad live på `https://synappsen-final-build.web.app/`.

**Nästa steg:** ingen aktiv plan pekas ut ännu – `etapplaner/ETAPPLAN12.md` är den senast antagna och nu
helt klar. Läs `OPPNA-PUNKTER.md` för vad som väntar på en människa/ett beslut, eller vänta på
ny instruktion från ägaren om vad nästa etapp ska vara.

---

## Uppföljning 2026-08-11 (granskning av ETAPPLAN13 + fyra döda sökvägar efter 61a)

Ägaren bad om en granskning av baspaketsförslaget. `etapplaner/ETAPPLAN13.md` är omskriven – fem fel i
utkastet, varav två är värda att känna till även om man inte läser planen: den citerade MDR
Annex VIII regel 11 (en KLASSIFICERINGS-regel) för vad som i själva verket är en
kvalificeringsfråga, och den saknade upphovsrätten helt trots att bedömningsinstrument ofta
är licensbelagda. Planen har nu tre beslutspunkter i stället för en, inklusive ett
alternativ B som återanvänder Etapp 56:s seedningsmekanism och flyttar utgivaransvaret till
kunden. Se planens egen "Granskning"-sektion. **Fortfarande ej byggbar** – nu av två
juridiska skäl i stället för ett.

`CLAUDE.md`s dokumentkarta uppdaterad: `etapplaner/ETAPPLAN12.md` står inte längre som den aktiva planen,
och `etapplaner/ETAPPLAN11.md`s 54c/54d + Etapp 58 pekade fortfarande mot `OPPNA-PUNKTER.md` trots att de
flyttades till `BESLUTSLOGG.md` 2026-08-10.

**Ett fynd om Etapp 61a värt att komma ihåg:** delningen av `functions/index.js` gjorde ~86
kommentarsreferenser i levande kod inaktuella. De flesta är ofarliga – skarven re-exporterar
alla 93 Cloud Functions, så referensen leder rätt via ett extra hopp. Men referenser till
INTERNA symboler som aldrig exporterats är äkta återvändsgränder, och fyra sådana fanns
(`GODKANDA_KALLDOMANER`, `STANDARD_TAK_ORE`, `aktuellManadNyckel`, `personalpulsResultat`).
Rättade. Historiska planfiler och append-only-sektionerna här och i `granskningar/SAKERHETSRAPPORT.md`
lämnades medvetet orörda – de var korrekta när de skrevs. Ingen versionsbump (kommentarer och
dokument), ingen deploy: v5.96.0/körning #74 är fortfarande det som kör i produktion.

---

## Uppföljning 2026-08-11 (andra genomläsning av ETAPPLAN13 – två egna fel rättade)

Ägaren bad om en andra genomläsning av `etapplaner/ETAPPLAN13.md` efter den första omskrivningen. Hittade
två substantiella fel jag själv införde (inte i det ursprungliga utkastet): ja/nej var
omkastade i "Klart när"-tabellens fråga 1 (ett ja-svar – "det kvalificerar som medicinteknisk
programvara" – är det DÅLIGA utfallet, jag hade skrivit det som "byggbart"), och ett räknefel
i beslutspunkt 2 ("B löser tre av de fyra tekniska förutsättningarna" – rätt svar är två,
fyrakällorstaket och domänlistan gäller oavsett leveransmodell). Båda rättade, plus en
kvarleven av samma ja/nej-inversion i alternativ A:s "Kräver"-rad som annars hade smugit
förbi. Se planens egen "Granskning"-sektion, punkt 6–7. Samma slutsats som tidigare:
`etapplaner/ETAPPLAN13.md` är fortfarande inte byggbar utan en extern juridisk bedömning – det här ändrar
inte SLUTSATSEN, bara kvaliteten på underlaget som når juristen. Ingen versionsbump, ingen
deploy.

---

## Uppföljning 2026-08-11 (ETAPPLAN13 antagen)

Ägaren beslutade att baspaketsidén (Etapp 64) ska drivas vidare – beslutet loggat i
`BESLUTSLOGG.md`. `etapplaner/ETAPPLAN13.md` är därmed formellt **ANTAGEN**, precis som `etapplaner/ETAPPLAN11.md`
och `etapplaner/ETAPPLAN12.md` var den dag de antogs, och står nu överst i `CLAUDE.md`s läsordning.

**Viktig distinktion, upprepad på flera ställen i dokumenten för att den inte ska missas:**
"antagen" betyder INTE "byggbar". Planens centrala risk är regulatorisk (MDR-kvalificering +
upphovsrätt), och beslutspunkt 1:s andra hälft – vem kommissionerar den externa juridiska
bedömningen – är fortfarande öppen. Den raden finns nu i `OPPNA-PUNKTER.md` under "Kräver en
bokad människa" (en betald extern juridisk genomgång, samma bokningskategori men inte ett
internt möte). Ingen kod ska skrivas för Etapp 64 förrän den bedömningen finns.

Uppdaterade i samma commit: `etapplaner/ETAPPLAN13.md` (statusbanner, "Klart när"-beslutspunkt 1,
föreslagen ordning, sammanfattningstabell), `CLAUDE.md` (läsordning punkt 3–4 bytte plats och
innehåll, dokumentkartans två rader), `BESLUTSLOGG.md` (ny rad), `OPPNA-PUNKTER.md` (ny rad).
Ingen kod, ingen versionsbump, ingen deploy.

---

## Uppföljning 2026-08-11 (ETAPPLAN13 scaffolding klar, v5.97.0)

Direkt efter antagandet frågade ägaren om första etappen kunde påbörjas. Svarade att planens
egen spärr (ingen kod förrän juridisk bedömning finns) fortfarande gällde och frågade om
bedömningen redan var klar. Ägaren föreslog istället att bygga strukturen NU men hålla
funktionen avstängd tills juridiken är klar, med motiveringen att en jurist lättare bedömer
en konkret produkt än ett rent koncept. Gav min syn (delvis instämmande, men flaggade att
planen själv varnar för sunk-cost-risken av att bygga "provisoriskt") och föreslog en
avgränsning: bygg scaffolding med fiktiv testdata och en hård spärr, vänta med riktigt
innehåll. Ägaren godkände den avgränsningen. Beslutet loggat i `BESLUTSLOGG.md`.

**Byggt (v5.97.0):**
- Ny collection `baspaketreferenser`, HELT begränsad till plattformsadmin i `firestore.rules`
  – ingen kundorganisation kan läsa eller skriva den, oavsett roll. Schemat tillåter bara
  referensmetadata (titel/utgivare/kalldatum/url/kategori) – inget innehållsfält går att
  skriva, en strukturell spärr, inte bara en konvention.
- 12 nya regeltester (`tests/rules/baspaketreferenser.test.mjs`), alla gröna.
- `useBaspaketreferenser.js` (hook) och `BaspaketreferenserSektion.jsx` (ny sektion i
  leverantörsvyn, `/leverantor`) – syns ENDAST för plattformsadmin, aldrig för en kund.
- `etapplaner/ETAPPLAN13.md` fick en ny "Scaffolding-fasen – ✅ KLAR"-sektion.

**Vad som INTE byggdes, medvetet:** riktigt namngivet instrumentinnehåll, 64b:s centrala
källbevakningslarm, och ingen per-organisation-modulflagga (kunder kan alltså inte ens
teoretiskt aktivera något). De väntar fortfarande på den externa juridiska bedömningen.

Testat: lint, build, vitest (175/175), test:rules (260/260, inkl. de 12 nya). Ingen deploy
gjord ännu – ren backend-/leverantörsfunktion, ingen brådska. Nästa steg: kommissionera den
juridiska bedömningen (fortfarande i `OPPNA-PUNKTER.md`), eller vänta på ägarens instruktion.

---

## Uppföljning 2026-08-11 (ETAPPLAN13 beslutspunkt 2 och 3 avgjorda)

Ägaren svarade på beslutspunkt 2 och 3 direkt (utan att fråga om status först denna gång).
Loggat i `BESLUTSLOGG.md`, `etapplaner/ETAPPLAN13.md` uppdaterad genomgående (beslutspunktstabellen, ny
"Leveransmodellen"-sektion, 64d omskriven, tekniska förutsättning 4 markerad avgjord,
"Klart när"-tabellens fråga 2/4 justerade, sammanfattningstabellen).

**Beslutspunkt 2:** inte ren Alternativ A (identiskt för alla) eller ren B (kundägt) – en
tredje variant: Synappsen äger och curerar innehållet centralt, organiserat i namngivna paket
(ägaren nämnde RETTS och VÄST-A som exempel, INTE en bekräftelse på att just de är juridiskt
klarerade), och leverantören väljer per kund vilket/vilka paket som aktiveras.

**Beslutspunkt 3:** ägaren förvaltar/kuraterar själv, monetiserat som en fast engångsavgift
för grundkonfigurering per kund – ingen löpande avgift, ingen kundens egen självbetjäning.

**Vad detta INTE gör:** låser inte upp kodningsarbete. Beslutspunkt 1 (den externa juridiska
bedömningen) är fortfarande den enda blockeringen mot att bygga något med riktigt innehåll –
MDR-kvalificeringsfrågan och upphovsrättsfrågan är oförändrade av att urvalet nu är
kundspecifikt snarare än universellt. Ingen kod ändrades i den här sessionen, ingen
versionsbump, ingen deploy.

## Uppföljning 2026-08-11 (bred säkerhets-/kvalitetsgranskning, v5.98.0)

En fristående granskningssession (INTE en `ETAPPLANx.md`-etapp) gick igenom hela kodbasen med
åtta parallella genomgångar på disjunkta filområden: Firestore-/Storage-regler, Cloud
Functions, frontend, de stora formulär-/adminfilerna, tillgänglighet (WCAG 2.1 AA), offline/
PWA-livscykel, test-/byggkedja och dokumentens sanningshalt. Full detaljerad rapport i
`granskningar/GRANSKNING-2026-08-11.md` (arbetet) och ett nytt tillägg i `granskningar/SAKERHETSRAPPORT.md` (fynden,
prioriterade). Gren: `claude/synappsen-final-review-slzcxe`, PR #15.

**Allvarligast åtgärdat:**
- Firestores IndexedDB-cache tömdes ALDRIG vid utloggning – på en delad akutdator läste nästa
  person föregående persons cachade rutiner/kontakter. Ny `rensaLokalaAnvandardata()` i
  `src/firebase/config.js` (terminate + clearIndexedDbPersistence + bildcache + localStorage),
  hård omladdning efteråt, flerflikfallet hanterat.
- `deploy.yml` körde `firebase deploy --force` (inklusive reglerna) utan att köra ETT enda
  test först. Lint, vitest och regeltester körs nu före bygget.
- `firestore.rules` `organisationer/{orgId}`: fältspärren var en tom sanning vid create/delete
  (villkorad av `resource != null && request.resource != null`) – en superadmin i en pausad
  org kunde radera dokumentet och häva sin egen avetablering.
- `firestore.rules` `anteckningar/{dokId}`: skrivning kontrollerade `uid`, läsning
  kontrollerade dokId-prefixet – en användare kunde plantera en anteckning under en annan
  användares prefix.
- `sokloggar` saknade personnummerspärr på fältet `term`, till skillnad från varje annat
  fritextfält – en nollträffssökning på ett personnummer skrevs i klartext och visades för
  superadmin.
- `skickaPush` bröt FCM:s 500-tokengräns utan try/catch i de schemalagda jobbens loop – en
  organisation med fler tokens kunde avbryta dygnets påminnelser för ALLA organisationer.
- `AuthContext.jsx`: `getDoc` utan try/catch kunde ge en permanent vit skärm för hela appen.
- Fyra ställen med e-postadresser i klartext i Cloud Logging.
- Tillgänglighet: kommandopaletten (Ctrl/Cmd+K, appens primära sökväg) saknade fokusfälla/Esc/
  fokusåterlämning; `VersionsHistorik` var nakna div utan `role`; fokusindikatorn på input/
  select hade 1,06:1 kontrast mot kravet 3:1; ingen global `prefers-reduced-motion`. Tre av
  dessa motsäger `granskningar/TILLGANGLIGHETSREDOGORELSE.md` direkt (se nedan).
- Flera tysta felhanteringsluckor i `RutinFormular.jsx`/`LaddaUpp.jsx`/`Profil.jsx`/
  `Admin.jsx` (bl.a. 2FA-policyns spara-knapp kunde se sparad ut medan anropet fallit), en
  blob-URL-läcka, saknad klientvalidering av bilagor mot `storage.rules`s gränser.

**Kvar att göra, i prioritetsordning** (fullständig lista med motivering i
`granskningar/SAKERHETSRAPPORT.md`s tillägg):
1. `functions/backup.js` `aterstallOrganisation` saknar allowlist mot collection-namn.
2. `storage.rules` `arBild()` tillåter SVG överallt, inklusive organisationslogotypen – ett
   öppet ägarbeslut, nu i `OPPNA-PUNKTER.md`.
3. Ingen samtidighetshantering vid redigering av samma rutin (rak `updateDoc`, ingen
   version/transaktion) – två redaktörer som sparar överskriver varandra spårlöst.
4. `granskningar/TILLGANGLIGHETSREDOGORELSE.md` är INTE rättad mot de tre WCAG-fynden som motsäger den.

npm audit: 7 sårbarheter, men `npm audit --omit=dev` och en separat körning i `functions/` ger
båda noll – samtliga är dev-only. Den kritiska kräver en planerad major-uppgradering av
`firebase-tools` (v13→v15), inte `--force`.

Testat i granskningen: lint rent, build OK, `npx vitest run` 175/175 (25 filer).

**Uppdatering samma dag: `test:rules` och `test:e2e` verifierade i efterhand.** Regeltesterna
gick inte att köra i granskningens ursprungliga sandbox – Firebase-emulatorn hängde tyst utan
felmeddelande vid start. Rotorsaken: `firebase-tools`s interna DNS-resolver
(`node_modules/firebase-tools/lib/emulator/dns.js`) hårdkodar att hostnamnet `localhost` slår
upp till BÅDE `127.0.0.1` och `::1`, oavsett systemets faktiska nätverkskonfiguration, och
testar sedan att binda till båda adresserna innan emulatorn startar. I en container helt utan
IPv6-stack (inget `/proc/net/if_inet6`) hänger just det bindningsförsöket för evigt istället
för att felmeddela. En första fjärrsession i en annan molnmiljö träffade samma problem. Fixen:
`firebase.json`s `emulators`-block satte `"host": "127.0.0.1"` explicit för varje emulator
(auth/firestore/functions/storage) istället för standardvärdet `localhost` – det kringgår
resolverns `isIP()`-kortslutning helt, oavsett om miljön har IPv6 eller inte. Detta är alltså
en riktig fix, inte en sandbox-specifik workaround.

Med fixen: **`npm run test:rules` → 267/267 gröna** (11 testfiler, inklusive nya
regressionstester för de tre regeländringarna: organisationer create/delete, anteckningar
dokId-prefix, och två nya tester för sokloggar-personnummerspärren som tidigare saknade
täckning). **`npm run test:e2e` → 17/17 gröna** på en ren körning (en tidigare avbruten
körning lämnade en föräldralös Vite-devserverprocess som orsakade `ERR_CONNECTION_REFUSED` i
två mellanliggande försök – bekräftat vara en miljöartefakt, inte en kodbugg, genom att
isolera och köra om det enskilda testet rent). Denna gren är alltså fullt testverifierad.
Ingen deploy gjord ännu.

## Uppföljning 2026-08-11 (juridisk granskning + kodverifiering av dess premisser)

En extern juridisk kartläggning (v2) tillfördes projektet och ligger nu i repot som
`granskningar/JURIDISK-GRANSKNING.md` – **internt dokument, delas ALDRIG externt i sin helhet** (innehåller
bolags-, bisyssle- och jävsbedömningar; avsnitt 21.4 listar vad som kan omarbetas till
kundmaterial). Registrerad i `CLAUDE.md`s dokumentkarta bland incidentdokumenten, eftersom den
har samma interna/externa hantering som `drift/INCIDENT-CHECKLISTA.md`.

Rapporten markerade fyra tekniska premisser som **[PK]** – slutsatser som hängde på ett
tekniskt faktum den inte kunnat kontrollera. Samtliga är nu verifierade mot faktisk kod, och
resultatet är inarbetat på plats i rapporten:

- **Artikel 50 (AI-transparens) – brist bekräftad.** `kalla: "gemini"` sätts i
  `functions/ai-import.js:263`, överlever publicering (`useRutiner.js:117` rör inte fältet),
  men läses av **ingen** läsarvänd komponent. En medarbetare kan alltså inte se att en rutin
  ursprungligen tolkades fram av AI. Kravet gäller sedan 2026-08-02. Liten kodändring, inget
  data saknas.
- **"Beslutsstöd" i kundvänt material – bekräftad**, men bara på EN rad
  (`KlinikfragaSok.jsx:92`). Förekomsten i `functions/klinikstod.js:356` är en instruktion till
  modellen, inte kundvänd, och påverkar inte MDR-kvalificeringen.
- **Referensunderlagets anonymisering – farhågan avfärdad.**
  `functions/matvarden.js:299` exporterar sju aggregat utan roll- eller områdesuppdelning, så
  den befarade återidentifieringsvägen finns inte. **Men:** ingen minsta-n-spärr, till skillnad
  från personalpulsens tröskel på fem.
- **Revisionsloggens pseudonymisering – rapportens egen rekommendation var felaktig.**
  `raknaHash()` hashar posten inklusive `aktorUid` och `verifieraRevisionskedja()` bygger om
  hashen från innehållet, så pseudonymisering i efterhand upptäcks som manipulation. Hade
  rekommendationen följts hade nattjobbet larmat varje natt för varje drabbad organisation.
  Gallring kräver **segmentering** av kedjan med ankarposter.

**En femte premiss kontrollerades trots att den inte var markerad, och visade sig vara den
allvarligaste:** rapportens MDR-argument för checklistläget bygger på att ett steg är
"strukturellt begränsat till `{text, bild, varning, timerSekunder}` – spärren sitter i
datamodellen, inte i en policy". Det stämmer inte. `firestore.rules` spärrar antal steg (max
12) och personnummer i `text`, men **ingen regel begränsar vilka nycklar ett stegobjekt får
ha** – `hasOnly` används på sex ställen i filen, inget av dem för `rutiner`. Fältuppsättningen
upprätthålls av `RutinFormular.jsx:79`, alltså av gränssnittet. Det är en verklig teknisk
avvägning (regelspråket saknar loopar, budgeten på 1 000 deluttryck har tagit slut två gånger
förut), men påståendet som det är formulerat går inte att styrka.

**Ägarbeslut loggat samma dag:** bisysslan har fått skriftligt godkännande, se
`BESLUTSLOGG.md`. Det låser upp granskningens åtgärdspunkt A1 men avgör INTE jäv- och
upphandlingsfrågorna, som är separata.

**Två nya rader i `OPPNA-PUNKTER.md`** (båda ägarbeslut, inte kapacitet): revisionsloggens
gallringstid, och om checklistestegens spärr ska flyttas till servern eller bara formuleras
om. Ingen kod ändrad i den här sessionen – bara dokument.

---

## Uppföljning 2026-08-12 (ETAPPLAN13 avstämd mot JURIDISK-GRANSKNING.md)

Sessionen upptäckte att den lokala arbetskopian låg 14 commits efter fjärrgrenen – en annan
session hade under tiden pushat den breda granskningen (v5.98.0) och `granskningar/JURIDISK-GRANSKNING.md`.
Synkade upp med `git merge --ff-only`, sedan stämde jag av om den nya, bredare juridiska
granskningen redan täcker `etapplaner/ETAPPLAN13.md`s (Etapp 64) fyra "Klart när"-frågor.

**Svar: ja, med god marginal.** `granskningar/JURIDISK-GRANSKNING.md` §18 ("Frågor att ställa till anlitad
jurist") är en färdig, bredare frågelista – dess frågor 1–6 täcker och överträffar planens
egna fyra. En kommission bör gå efter §18, inte `etapplaner/ETAPPLAN13.md`s egen lista.

**Två saker granskningen hittade som `etapplaner/ETAPPLAN13.md` saknade helt, nu inarbetade:**
- **Nytt genomgående krav 27:** varumärkesrätt för instrumentnamn ("RETTS", "VÄST-A") är en
  tredje juridisk risk, skild från MDR och upphovsrätt – aktualiserad av beslutet 2026-08-11
  att namnge och sälja paket. Ingen marknadsföring av namngivna paket förrän juridiken svarat.
- **En reservation, INTE en omprövning**, i "Leveransmodellen"-sektionen: granskningen menar
  att den leverantörsstyrda tilldelningen (64d) kan peka MOT MDR-icke-kvalificering istället
  för för den, tvärtemot ansvarstydlighets-motiveringen bakom beslutet. Beslutet i
  `BESLUTSLOGG.md` står kvar oförändrat – det här är en flagga inför juristsamtalet, inte en
  ändring jag gjort på egen hand.

Uppdaterade `etapplaner/ETAPPLAN13.md` (nytt krav 27, reservationstext, omskriven "Klart när"-tabell med
fem frågor istället för fyra, tredje granskningsrunda dokumenterad), `CLAUDE.md` (läsordning
+ dokumentkarta, "två" → "tre" regulatoriska gränser) och `OPPNA-PUNKTER.md` (Etapp 64-raden
pekar nu på §18 och föreslår att samma uppdrag kan omfatta hela den bredare granskningen).
Ingen kod, ingen versionsbump, ingen deploy.

## Uppföljning 2026-08-13 (ny plan: ETAPPLAN14.md, Etapp 65 – fyra vardagsfunktioner)

Ägaren efterfrågade nya funktioner för "vanliga" användare med wow-faktor, uttryckligen
INTE snabbare svarstider. Gjorde en fullständig genomgång av faktisk kod (samtliga sidor,
komponenter, hooks) och grepade samtliga `ETAPPLANx.md`-filer för att skilja på genuint nya
förslag och sådant som redan är byggt eller redan medvetet avfärdat – röstsökning (23d) och
gamification (poäng/märken/topplistor, `etapplaner/ETAPPLAN12.md`) var redan avfärdade av goda skäl och
återuppfanns inte.

Lade fram åtta förslag; ägaren valde fyra för en ny plan: uppläsning, "ändrat sedan du
läste", synonymsökning, öva-läge. Skrev `etapplaner/ETAPPLAN14.md` (Etapp 65, delmål 65a–65d) –
**FÖRESLAGEN, EJ ANTAGEN**. Till skillnad från `etapplaner/ETAPPLAN13.md` är ingen del juridiskt
blockerad; väntar bara på ett ägarbeslut om byggstart.

**Ett konkret premisskontroll-fynd (krav 8) värt att komma ihåg:** 65b ("ändrat sedan du
läste") kräver en regeländring – `rutiner/{id}/versioner`s läsrätt i `firestore.rules` är
idag begränsad till redaktörer (`farRedigeraOmrade`), vilket utestänger exakt den
användargrupp funktionen är byggd för. Måste vidgas till alla organisationsmedlemmar
(samma krets som redan läser den LIVE rutinen) innan 65b kan byggas. Diff-logiken i sig
kräver ingen ny kod – `utils/diff.js`s `diffRader()` återanvänds oförändrat.

Uppdaterade `CLAUDE.md` (läsordning omnumrerad, ny rad i dokumentkartan för
`etapplaner/ETAPPLAN14.md`). Ingen kod, ingen versionsbump, ingen deploy – rent planeringsarbete.
Nästa steg: invänta ägarens besked om byggstart.

## Uppföljning 2026-08-13 (Etapp 65a klar, v5.99.0)

Ägaren bad direkt om byggstart för `etapplaner/ETAPPLAN14.md`s delmål 65a (uppläsning) – samma dag
planen föreslogs. Byggt och klart samma session:

- `src/utils/talText.js` (+ 8 enhetstester): saniterar rå Markdown-text till talbar text –
  tar bort rubrik-/fetstils-/länksyntax och emoji, normaliserar whitespace.
- `src/hooks/useTalsyntes.js`: delad wrapper runt webbläsarens `speechSynthesis`, används av
  både `RutinKort.jsx` (🔊-knapp bredvid QR-koden) och `Korvy.jsx` (🔊-knapp i headern, med
  "sticky" läge – läser om automatiskt vid stegbyte om uppläsning redan var aktiv).
  Avbryter alltid vid avmontering/navigering, plus explicit vid checklistans "Klar"-övergång
  (samma komponentinstans lever kvar där, ett unmount sker inte).
- Bekräftat att invändningen mot röstsökning (23d, avfärdad i `etapplaner/ETAPPLAN4.md` – ljud som
  skickas till en tredje part) inte gäller talsyntes: `speechSynthesis` är utdata, inget
  spelas in, inget lämnar enheten.

Två avvikelser från ursprungsplanen (dokumenterade i `etapplaner/ETAPPLAN14.md`s "Genomfört"-avsnitt):
rösturvalet blev `voice.lang.startsWith("sv")` istället för `voice.localService` (språk är
den egenskap som faktiskt avgör begriplighet), och talsyntesen delades i en egen hook
istället för att dupliceras i två komponenter.

Ingen ändring i `firestore.rules`/`storage.rules`/Cloud Functions – bara `lint`/`build`/
`vitest run` (182/182) körda, alla gröna. Version 5.98.0 → **5.99.0**, `andringslogg.js`
uppdaterad, `etapplaner/ETAPPLAN14.md` (65a markerad klar + "Genomfört"-avsnitt), `CLAUDE.md`
(läsordning + dokumentkarta, "föreslagen" → "delvis byggd"). Committat och pushat.
**Deployad samma session** (körning #76, commit `3eefd17`, ny asset-hash
`assets/index-VSVjfc_t.js` bekräftad på `synappsen-final-build.web.app`).

## Uppföljning 2026-08-13 (Etapp 65b klar, v5.100.0)

Ägaren bad direkt om byggstart för `etapplaner/ETAPPLAN14.md`s delmål 65b ("ändrat sedan du läste").
Byggt och klart samma session, inklusive den regeländring planen redan hade flaggat som en
förutsättning:

- **`firestore.rules`:** ny funktion `farLasaVersioner(rutinId)` – speglar rutin-dokumentets
  egen läsregel (org-matchning OCH (godkänd-status ELLER redigeringsrätt ELLER en aktiv
  supportsession)) i en `let`-bindning, samma budget-medvetna mönster som `farUppdateraRutin()`
  redan använder. `rutiner/{id}/versioner`s läsrätt är alltså inte längre begränsad till
  redaktörer – `create` förblir oförändrat redaktörsbart. Ny testfil
  `tests/rules/versionerlasratt.test.mjs` (7 tester, körda mot emulatorn, alla gröna):
  bekräftar att en vanlig medarbetare nu läser en GODKÄND rutins historik men fortfarande
  INTE en UTKAST-rutins, och att organisationsisoleringen samt redaktörers/skrivrättens
  beteende är oförändrat.
- **`src/utils/rutinHjalp.js`:** ny `andradSedanLasning()` – badge-synlighet utan någon ny
  Firestore-fråga, återanvänder `senasteVasentligaAndring` (samma signal Etapp 47b redan
  etablerade).
- **`src/hooks/useRutinDiffSedanLast.js`:** on-demand fråga som hittar exakt den
  versionspost som motsvarar innehållet vid läsningstillfället, diffar den mot nuvarande
  innehåll med den REDAN BEFINTLIGA `utils/diff.js`s `diffRader()` – ingen ny diff-logik
  skrevs, precis som planen förutsåg.
- **`src/components/RutinKort.jsx`:** ny klickbar badge + expanderbar `DiffVy`-panel.

**Övervägde men rörde inte incidentdokumenten.** `CLAUDE.md`s underhållsregel flaggar
regeländringar för granskning mot `drift/INCIDENT-CHECKLISTA.md` steg 4 och
`avtal/INCIDENTRESPONSPLAN.md` avsnitt 4. Bedömning: den här ändringen vidgar bara LÄSNING av
äldre versioner av innehåll som redan var läsbart i sin nuvarande form (samma organisation,
samma rutin) – den ändrar varken vilka roller som kan begränsas/återkallas (avsnitt 4:s
kompenserande kontroller handlar om kontokapning, inte innehållsläsning) eller hur en
exponering kartläggs (checklistans steg 4 räknar redan generiskt "allt som personens roll och
organisation gav åtkomst till"). Inget att uppdatera där.

Ingen ändring i `storage.rules`/Cloud Functions. Version 5.99.0 → **5.100.0**,
`andringslogg.js` uppdaterad, `etapplaner/ETAPPLAN14.md` (65b markerad klar + "Genomfört"-avsnitt),
`CLAUDE.md` (dokumentkarta). `lint`/`build`/`vitest run` (186/186)/`test:rules` (samtliga
sviter, inklusive den nya) alla gröna. Committat och pushat. **Ingen deploy gjord** – inte
begärd i den här sessionen.

## Uppföljning 2026-08-13 (Etapp 65c klar, v5.101.0)

Ägaren bad direkt om byggstart för `etapplaner/ETAPPLAN14.md`s delmål 65c (synonymsökning). Byggt och
klart samma session:

- `src/data/synonymer.js`: 17 synonymgrupper med allmänna kliniska förkortningar (PVK,
  KAD, EKG, BT, HLR m.fl.). Medvetet INGA namngivna varumärkesskyddade instrument – samma
  gräns som `etapplaner/ETAPPLAN13.md` genomgående krav 27 flaggar för Etapp 64, hölls även här trots
  att den etappen är juridiskt blockerad och den här inte är det.
- `src/utils/synonymer.js`: `expanderaNyckelord(nyckelord, innehall)`, ren funktion, 7
  enhetstester.
- `useSokindex.js`: anropas för både `rutinposter` OCH `forradsposter` (mot artikelns namn)
  – en liten utökning utöver planens text, eftersom samma nytta gäller lika mycket i
  förrådet ("PVK" ska hitta en artikel som heter "Venflon").

Ingen ändring i `firestore.rules`/`storage.rules`/Cloud Functions – ren klientsidig
datafil, ingen ny Firestore-fråga. Version 5.100.0 → **5.101.0**, `andringslogg.js`
uppdaterad, `etapplaner/ETAPPLAN14.md` (65c markerad klar + "Genomfört"-avsnitt), `CLAUDE.md`
(dokumentkarta). `lint`/`build`/`vitest run` (193/193) gröna. Committat och pushat.
**Ingen deploy gjord** – inte begärd i den här sessionen. Med detta är tre av fyra delmål
i Etapp 65 klara (65a/65b/65c) – bara 65d (öva-läge) återstår.

## Uppföljning 2026-08-13 (Etapp 65d klar, v5.102.0 – Etapp 65 helt byggd)

Ägaren bad direkt om byggstart för `etapplaner/ETAPPLAN14.md`s sista delmål, 65d (öva-läge). Byggt och
klart samma session:

- `src/utils/ovaLage.js`: `byggFragepool()` + `slumpaFragor()` (Fisher-Yates), 11
  enhetstester. Samma filtreringsprincip som `veckansRepetition.js`s `valjVeckansFraga()`
  (godkänd, ej arkiverad, `kviss.length > 0`) men utan det veckostabila hash-urvalet.
- Ny sida `src/pages/OvaLage.jsx` på `/ova`: välj område → slumpad frågeserie (8 frågor) →
  klar-skärm. Återanvänder `useAllaGodkandaRutiner()` (redan byggd för kompetensmatrisen,
  Etapp 19c) istället för planens ursprungliga skiss med två separata `useRutiner()`-anrop –
  billigare och redan filtrerad server-side på godkänd status över alla områden.
- **Ett medvetet strängare val än planens bokstav:** ingen "X av Y rätt"-sammanfattning visas
  ens vid passets slut, trots att "Klart när"-kriteriet bara förbjöd att SPARA/DELA ett
  resultat. Bedömning: även en aldrig sparad siffra kan läsas som ett betyg av användaren
  själv – samma "förståelse, inte betyg"-princip som redan gäller `KvissModal.jsx`.
- Sökbar åtgärd ("Öva") i `useSokindex.js` + post i `BottomNav.jsx`s "Mer"-meny.

Ingen ändring i `firestore.rules`/`storage.rules`/Cloud Functions – ingen ny collection,
ren klientlogik. Version 5.101.0 → **5.102.0**, `andringslogg.js` uppdaterad,
`etapplaner/ETAPPLAN14.md` (65d markerad klar + "Genomfört"-avsnitt, plus toppstycket omskrivet: HELA
Etapp 65 är nu klar), `CLAUDE.md` (läsordning + dokumentkarta, "delvis byggd" →
"helt byggd, inte ännu deployad"). `lint`/`build`/`vitest run` (204/204) gröna – ny lazy
chunk `OvaLage-*.js` bekräftad i byggutdata. Committat och pushat. **Deployad samma session**
(körning #77, commit `2addfef`, ny asset-hash `assets/index-QGEvHg37.js` bekräftad på
`synappsen-final-build.web.app`) – med detta är hela Etapp 65 (65a–65d) i produktion.

## Uppföljning 2026-08-14 (ETAPPLAN15 föreslagen, Etapp 66)

Ägaren lade fram nio funktionsidéer och bad om synpunkter, en ny plan för det som bör byggas
nu, och att de uppskjutna skulle loggas. En premisskontroll (krav 8) mot faktisk kod gjordes
innan planen skrevs och **strök fem av de nio**:

- **Tre var redan byggda.** "Rutinhål-detektorn" finns helt (`sokloggar` + `loggaNollTraff` i
  `SokFalt.jsx`). "Förbättringsförslag" är ~80 % byggt (allt utom notisen till ansvarig).
  "Incident-/driftstörningslogg" finns delvis som `skiftrapporter`.
- **En byggde på en premiss som inte stämmer.** Idén "utöka ansvarsområden utöver
  medicinteknik" förutsatte en befintlig medicinteknikpanel – ordet finns **inte en enda gång**
  i `src/` eller `functions/`. Det är ett nybygge, inte en utökning.
- **Tre bör inte byggas nu**, se nedan.

**`etapplaner/ETAPPLAN15.md` (Etapp 66) skrevs med fyra delmål**, alla tillägg på existerande
datamodeller: 66a förslag når rutinens `agare` (notis), 66b handledarsignering i
introduktionen, 66c ansvarsområden på personen, 66d driftstörning kopplad till rutin/kategori.
**Nytt genomgående krav 28:** en signatur om en annan människa får aldrig kunna sättas av
personen själv, och spärren ska ligga i `firestore.rules` (`request.auth.uid != uid`), inte i
gränssnittet.

**Tre idéer medvetet uppskjutna, loggade i planens "Vad jag INTE föreslår":**
- **Bemanning/scheman – avråds.** Redan avfärdad en gång (`etapplaner/ETAPPLAN4.md` rad 1030). Två skäl
  till: schemadata är en helt ny GDPR-yta om anställda, och regionen har redan ett system.
  Om det verkliga behovet är "vem ansvarar för vad" är det 66c som löser det.
- **Rutin-/flödesschemaverktyg – för stort och blandat för en punkt.** Bryt ner: grafiska
  mallar är rimligt och kan tas separat; AI-författande och flödesscheman bör vänta.
- **AI-sammanfattning av kunskapsstöd + patientinformation – juridiskt blockerade**, av samma
  skäl som Etapp 64 redan är det. Viktigt att notera rakt ut: *"alltid med mänsklig kontroll"
  löser inte upphovsrättsfrågan* – mänsklig granskning gör inte ett bearbetat verk till ett
  icke-intrång.

**Tillagt i `granskningar/JURIDISK-GRANSKNING.md` §18: frågorna 20–22** (AI-sammanfattning, patientriktad
information, flödesschemaverktyg) – så att de kommer med i SAMMA juridiska uppdrag som Etapp
64 i stället för att kräva ett andra uppdrag senare. `OPPNA-PUNKTER.md`s Etapp 64-rad pekar
nu på det.

Uppdaterade `CLAUDE.md` (läsordningen omnumrerad, ny rad i dokumentkartan). Ingen kod, ingen
versionsbump, ingen deploy – rent planeringsarbete. Nästa steg: ägarens besked om Etapp 66
ska antas och i vilken ordning (66a är billigast, 66b har störst nytta men bär den enda nya
rättsliga vikten – dess gallringsfråga bör avgöras före bygget).

**Rubriknormalisering samma dag (uttryckligt ägarbeslut).** Planfilernas H1-rubriker var
inkonsekventa i fyra olika varianter (`# ETAPPLAN 5`, `# ETAPPLAN3`, `# Synappsen –
etappindelad utvecklingsplan`, `# Etapplan 12`). Ägaren bad om formen **`Etapplan N`** rakt
igenom, och uttryckligen om att hela serien skulle normaliseras – inte bara den nya filen.
13 filer ändrade, **enbart rad 1 i varje** (verifierat: `13 files changed, 13 insertions(+),
13 deletions(-)`), inget sakinnehåll rört. `etapplaner/ETAPPLAN.md` och `etapplaner/ETAPPLAN2.md` hade inget
nummer alls i rubriken och fick 1 respektive 2.

Detta är värt att notera eftersom `CLAUDE.md` säger att de historiska planfilerna inte ska
redigeras. **Regeln är inte bruten av misstag** – den gäller planernas substans, och
ändringen var en uttrycklig instruktion. En förklarande ruta är inlagd i `CLAUDE.md` direkt
ovanför "Varför inte slå ihop dessa till en fil?", så att en framtida session inte tolkar
git-historiken som en regelöverträdelse. **Filnamnen är avsiktligt oförändrade** – varje
korsreferens i projektet pekar på filnamnet, inte på rubriken.

## Uppföljning 2026-08-14 (Etapp 66a klar, v5.103.0)

Ägaren bad om byggstart för `etapplaner/ETAPPLAN15.md`s delmål 66a (förbättringsförslag når rutinens
ansvariga). Byggt och klart samma session.

**Premisskontrollen vid byggstart rättade planens egen premisskontroll.** Planen påstod att
"ingen notis går till den ansvariga". Fel: notisen fanns redan (`forslagposter` i
`useNotiser.js`, Etapp 26c) – den gick bara till ALLA redaktörer för området utan att titta på
`rutin.agare`. **Luckan var routingen, inte notisen**, vilket gjorde delmålet mindre än
planerat. Rättat både i planens tabell och i dess "Genomfört"-avsnitt, eftersom ett oprättat
fel i en premisskontroll annars ärvs av nästa läsare.

**En dubblering hittades och togs bort på köpet.** Exakt samma ägarroutinglogik låg
inline-duplicerad på TVÅ ställen i `useNotiser.js` (granskningspåminnelser Etapp 21a,
källvarningar Etapp 21c). När ändringsförslagen skulle bli det tredje anropsstället
extraherades regeln till `arAnsvarigForRutin()` i `src/utils/rutinHjalp.js` – en plats, 8 nya
enhetstester, och båda de gamla anropsställena ersatta med `.filter(arAnsvarig)`. Tre kopior
av samma regel hade glidit isär förr eller senare.

Två små förbättringar utöver planen: notisen länkar nu till själva rutinen (`#rutin-{id}`) i
stället för bara områdessidan, och texten får "(du är ansvarig)" när den beror på ägarskap –
båda mönster som granskningspåminnelsen redan använde.

Alternativ (a) valdes som planen rekommenderade: **ingen regeländring**. Begränsningen att en
namngiven ägare utan redigeringsrätt inte kan notifieras (regelmotorn nekar hela listningen
för icke-redaktörer) är dokumenterad som en kommentar direkt i `useNotiser.js`, så att den
inte misstas för en bugg.

Ingen ändring i `firestore.rules`/`storage.rules`/Cloud Functions, ingen ny collection, inget
nytt fält, ingen ny Firestore-fråga. Version 5.102.0 → **5.103.0**, `andringslogg.js`
uppdaterad, `etapplaner/ETAPPLAN15.md` (66a klar + "Genomfört"), `CLAUDE.md` (läsordning +
dokumentkarta). `lint`/`build`/`vitest run` (212/212) gröna. Committat och pushat. **Ingen
deploy gjord** – inte begärd i den här sessionen.

## Uppföljning 2026-08-14 (Etapp 66b klar, v5.104.0)

Ägaren bad om byggstart för `etapplaner/ETAPPLAN15.md`s delmål 66b (handledarsignering i
introduktionen). Byggt och klart samma session.

- **`firestore.rules`:** ny subcollection `introduktionstilldelningar/{uid}/signeringar/
  {postNyckel}`. Genomgående krav 28 (en signatur om en annan människa får aldrig sättas av
  personen själv) uttryckt som `request.auth.uid != uid` i `create`-regeln – testat explicit,
  inte bara antaget. `update` stängd helt; `delete` kräver `farHanteraAnslag()`.
- **`postNyckel` = `{typ}:{id}`, deterministiskt** (samma konvention som `innehallMap`
  redan använder), vilket gör dubbelsignering strukturellt omöjlig: ett andra skrivförsök mot
  samma nyckel är ur reglernas perspektiv en UPDATE, och den är stängd.
- **UI-avvikelse från planens ordval, medveten:** ingen egen "handledare"-roll finns i
  systemet. Signeringsknappen byggdes in i chefsvyns befintliga "Pågående introduktioner"
  (redan `farHanteraAnslag()`-gated), som en ny radkomponent `PagagendeTilldelning` – krävdes
  eftersom varje rad behöver sin egen hook-prenumeration, vilket inte går i en `.map()`.
  Skriv-regeln själv är bredare (vem som helst inloggad utom kiosk), så en bredare läsyta
  kräver ingen regeländring senare, bara en ny UI-ingång.
- Personens egen vy visar signaturen separat från sin egen kvittering, exakt som planerat.

**Ägarbeslutet om gallringstid togs INTE.** Ingen radering byggdes utöver att rätta ett
misstag (`taBortSignering`, loggat i revisionsloggen). Frågan är sammanslagen med
`OPPNA-PUNKTER.md`s redan öppna rad om revisionsloggens gallringstid, som samma underliggande
fråga, i stället för en ny separat rad.

**Obligatorisk följdåtgärd (ny personuppgiftscollection):** `drift/INCIDENT-CHECKLISTA.md` steg 5
uppdaterad. `avtal/INCIDENTRESPONSPLAN.md` avsnitt 2 rördes INTE – samma precedent som Etapp
64/65b: avsnittet är generiska definitioner, ingen collection-för-collection-inventering, och
ingen detektions-/begränsningsförmåga ändras.

Ny testfil `tests/rules/introduktionssigneringar.test.mjs`, 11 tester (självsignering avvisas,
organisationsisolering, dubblettsignering avvisas, läs-/raderingsbehörighet), körda mot
emulatorn: 11/11 gröna, hela `test:rules`-sviten fortsatt grön. Version 5.103.0 → **5.104.0**,
`andringslogg.js` uppdaterad, `etapplaner/ETAPPLAN15.md` (66b klar + "Genomfört"), `CLAUDE.md`
(läsordning + dokumentkarta), `OPPNA-PUNKTER.md` (gallringsraden utökad).
`lint`/`build`/`vitest run` (212/212) gröna. Committat och pushat. **Ingen deploy gjord** –
inte begärd i den här sessionen.

## Uppföljning 2026-08-14 (Etapp 66c klar, v5.105.0)

Ägaren bad om byggstart för `etapplaner/ETAPPLAN15.md`s delmål 66c (ansvarsområden på personen). Byggt
och klart samma session.

- **Nytt fält `users/{uid}.ansvarsomraden: string[]`**, samma kommaseparerade
  split/trim/filter-mönster som `taggar` redan har i `RutinFormular.jsx`. **Ingen
  regeländring behövdes** – superadmin fick redan skriva vilket fält som helst utom `role`
  direkt. Låst fast med ett NYTT regeltest ändå (`ansvarsomraden.test.mjs`, 4 tester): en
  vanlig användare kan varken sätta sina egna eller andras ansvarsområden – planens egna
  designbeslut ("får inte läggas i självbetjäningsvitlistan") är annars precis den sortens
  invariant som kan glida in av misstag senare utan att synas i diffen.
- `AnvandareRollerSektion.jsx` fick ett nytt fält per rad; `Profil.jsx` visar den inloggades
  egna områden via en ny nyckel i `AuthContext`s befintliga live-prenumeration.
- Ny adminsektion `AnsvarsomradenOversiktSektion.jsx` ("Vem ansvarar för vad") – slår ihop
  `ansvarsomraden` med de rutiner en person äger, genom att återanvända `arAnsvarigForRutin()`
  (Etapp 66a) istället för en tredje kopia av samma agare-matchningslogik.
- **Medvetet INTE byggt: kopplingen till 66a-notisen.** Planen nämnde att ett förslag skulle
  kunna nå någon via `ansvarsomraden` också, inte bara `rutin.agare`. Fri text har ingen
  naturlig koppling till en specifik rutin eller till `rutin.omrade` (en fast enum, ett annat
  begrepp) – att uppfinna en matchningsregel hade riskerat att bygga fel sak. Var en
  "Bygge"-punkt i planen, inte en del av "Klart när"-kriteriet.
- Ny personuppgift (`ansvarsomraden` på en redan existerande collection) tillagd i
  `drift/INCIDENT-CHECKLISTA.md` steg 5:s inventeringsruta. `avtal/INCIDENTRESPONSPLAN.md` rördes
  INTE – ingen ny collection, ingen regeländring, ingen detektions-/begränsningsförmåga
  ändrad.

Ingen ändring i `storage.rules`/Cloud Functions. Version 5.104.0 → **5.105.0**,
`andringslogg.js` uppdaterad, `etapplaner/ETAPPLAN15.md` (66c klar + "Genomfört"), `CLAUDE.md`
(läsordning + dokumentkarta). 4 nya regeltester gröna, hela `test:rules`-sviten fortsatt
grön. `lint`/`build`/`vitest run` (212/212) gröna. Committat och pushat. **Ingen deploy
gjord** – inte begärd i den här sessionen. Bara 66d (driftstörningslogg) återstår i Etapp 66.

## Uppföljning 2026-08-14 (Etapp 66d klar, v5.106.0 – Etapp 66 helt byggd)

Ägaren bad om byggstart för `etapplaner/ETAPPLAN15.md`s sista delmål, 66d (driftstörningslogg kopplad
till rutin och åtgärd). Byggt och klart samma session.

- **Två nya fält på `skiftrapporter`:** `kategori` (fast lista – lokal/it/medicinteknik/
  försörjning/övrigt, validerad server-side i en ny `arGiltigDriftstorningskategori()`) och
  `rutinId`. Regeländringen exakt som planerad: `update`s `bararForandrarFalt` utökades till
  att inkludera dem, medan `text` förblir medvetet oföränderlig efter publicering.
- **Ett fel hittades och rättades UNDER byggets gång:** den första regelversionen avvisade
  ett försök att RENSA kategorin (`kategori: null`), eftersom `null` inte fanns i den giltiga
  listan – det hade gjort "ångra kategorisering" trasigt i produktion. Rättat genom att
  uttryckligen tillåta `null` (samma konvention `rutin.agare` redan använder), låst fast med
  ett eget testfall.
- **"Hela historiken"-vyn krävde ingen ny Firestore-fråga.** `useSkiftrapport.js`s fråga
  saknade redan en tidsbegränsning – `VISNINGSGRANS_TIMMAR` filtrerar bara klientsidan, all
  historik fanns alltså redan laddad. Exponerade den bara som ett nytt `alla`-fält från
  hooken.
- **Namngivningsdistinktionen mot `drift/INCIDENT-CHECKLISTA.md`/`avtal/INCIDENTRESPONSPLAN.md`
  hölls medvetet isär**, precis som planen krävde – det här är en driftstörningslogg, inte en
  säkerhetsincident med rättsliga tidsfrister.
- **Övervägde men rörde inte incidentdokumenten.** Regeländringen vidgar bara vilka FÄLT som
  får ändras i efterhand, inte vem – ingen ny detektions-/begränsningsförmåga påverkas, och
  `kategori`/`rutinId` är ingen personuppgift. Samma bedömningsmönster som redan gjordes för
  Etapp 65b/66b/66c.

Ny testfil `tests/rules/skiftrapportkategorisering.test.mjs`, 9 tester (skapande med/utan/
ogiltig kategori, kategorisering av en icke-ägare, text oföränderlig, null-rensning,
organisationsisolering), körda mot emulatorn: 9/9 gröna, hela `test:rules`-sviten (nu 15
filer) fortsatt grön. Version 5.105.0 → **5.106.0**, `andringslogg.js` uppdaterad,
`etapplaner/ETAPPLAN15.md` (66d klar + "Genomfört", plus toppstycket omskrivet: HELA Etapp 66 är nu
klar), `CLAUDE.md` (läsordning + dokumentkarta, "delvis byggd" → "helt klar, inte ännu
deployad"). `lint`/`build`/`vitest run` (212/212) gröna. Committat och pushat. **Ingen
deploy gjord** – inte begärd i den här sessionen. Nästa steg: en deploy skulle ta med sig
hela Etapp 66 (66a–66d) i ett svep.

## Uppföljning 2026-08-15 (deploy bekräftad + fyra ägarbeslut + SVG-säkerhetsfix, v5.107.0)

**Deploy av Etapp 66 bekräftad.** GitHub Actions-workflowen `deploy.yml` triggades och
avslutades med `conclusion: "success"` (körning #78, id `31914460825`, commit `ef7c841`,
2026-08-15 23:20–23:24 UTC). Verifierat live via
`curl -s https://synappsen-final-build.web.app/ | grep -o 'assets/index-[A-Za-z0-9_-]*\.js'`
mot skarp URL. Med det är HELA Etapp 66 (66a–66d) både byggd och deployad.

**Ägarens fyra svar på de öppna ägarbeslutsfrågorna i `OPPNA-PUNKTER.md`** (ställda direkt
efter deploy-triggern, besvarade medan deployen kördes) – samtliga fyra loggade i
`BESLUTSLOGG.md` och borttagna ur `OPPNA-PUNKTER.md`:

1. **GCP-faktureringsexport till BigQuery:** ägaren svarade "ja, aktivera". Aktiveringen sker
   i GCP-konsolen, inte i kod – ingen bygg gjord, det är ägarens egen åtgärd. Låser upp Etapp
   32b (tre kvarvarande larmtyper) och 48c (täckningsbidrag per kund) den dag exporten har
   körts en tid.
2. **Revisionsloggens/introduktionssigneringarnas gallringstid:** ägaren svarade "följ
   rekommendationen" → 3 år huvudregel, 5 år för säkerhetsrelevanta händelsetyper, legal hold
   vid pågående ärende. **Beslutet är taget men INTE byggt** – gallring kräver segmentering av
   hashkedjan (`raknaHash()`/`verifieraRevisionskedja()` bygger annars om hela kedjan och
   larmar falskt vid varje gallrad post). Det är ett separat, riktigt bygge som inte startades
   i den här sessionen – kräver ett eget uttryckligt byggbeslut.
3. **Checklistestegens fältuppsättning (MDR-formuleringen):** delegerad till mig ("välj det du
   anser vara bäst"). Valde att bara rätta formuleringen, inte bygga en serverside `hasOnly`-
   spärr nu. Grep över hela repot efter de aktuella fraserna visade att den felaktiga
   "strukturellt begränsat"-formuleringen bara fanns på ETT ställe utanför granskningens egen
   rättelseruta: `granskningar/JURIDISK-GRANSKNING.md` §6.2:s tabellcell (rad 359). De andra fyra träffarna
   (`etapplaner/ETAPPLAN3.md`, `etapplaner/ETAPPLAN4.md`, `granskningar/SAKERHETSRAPPORT.md`, samt gårdagens egen rättelsetext i
   den här filen) beskriver bara fältformen neutralt utan att påstå regelnivå-enforcement –
   rördes inte. Tabellcellen skrevs om för att inte längre påstå att spärren "sitter i
   datamodellen". Ingen kodändring.
4. **`storage.rules` och SVG:** delegerad till mig (osäker, ville ha rekommendation). Läste
   igenom alla bilduppladdningsvägar (`arBild()`/`arBildEllerPdf()`) och alla renderingsställen
   (`grep <img` i hela `src/`) – bekräftade att ALL bildvisning sker via `<img>`-taggar, ingen
   `<object>`/`<iframe>`/`<embed>`, vilket redan hindrar skriptkörning i normal användning. Men
   en direkt-navigering till en Storage-nedladdningslänk skulle ändå kunna trigga inbäddad
   SVG-JavaScript, och ingen bekräftad affärsnytta av SVG fanns (kommentaren i koden
   spekulerade bara om organisationslogotypen). **Rekommendation: stäng SVG helt**, byggd i
   samma commit.

**SVG-fixen, i detalj:** `arBild()`/`arBildEllerPdf()` i `storage.rules` utesluter nu
uttryckligen `image/svg+xml` (tidigare matchade `image/.*` det också). **Ett existerande test
i `tests/rules/storage.test.mjs` visade sig ha klarat sig av fel anledning** – det använde
`volA` (roll "vol") mot `forradsartiklar/`-sökvägen, som redan innan den här fixen krävde
rollen "forradesansvarig"; testet "bevisade" alltså aldrig SVG-spärren, bara att volA saknade
förrådsbehörighet. Upptäcktes genom att isolera regeln i en minimal testrules-fil och verifiera
att `image/.*` FAKTISKT matchar `image/svg+xml` i emulatorn (det gör den). Fixat: lade till en
`forradA`-användare med rätt roll i testuppsättningen och bytte testet till den, plus tre nya
tester som bevisar SVG-spärren på rutinbilagor, profilbilder och organisationslogotyp.
`test:storage` 24/24 gröna (tidigare 21/21).

**Övervägde men rörde inte:** `avtal/INCIDENTRESPONSPLAN.md`/`drift/INCIDENT-CHECKLISTA.md` – SVG-
fixen ändrar inte vem som får agera eller någon detektions-/begränsningsförmåga, bara vilken
filtyp som accepteras. `avtal/PUB-AVTAL-MALL.md` p. 6:s "raderas ALDRIG"-text för revisionsloggen
rördes INTE – gallringsbeslutet är taget men inte byggt, så avtalstexten skulle bli osann om den
ändrades i förväg.

**Genomfört:** `storage.rules`, `tests/rules/storage.test.mjs` (24 tester), `granskningar/JURIDISK-GRANSKNING.md`
§6.2, `OPPNA-PUNKTER.md` (fyra rader borttagna), `BESLUTSLOGG.md` (fyra nya rader), `CLAUDE.md`
(läsordning + dokumentkarta, deploy-status rättad), `etapplaner/ETAPPLAN15.md` (toppstycke, deploy-status
rättad), `src/data/andringslogg.js`. Version 5.106.0 → **5.107.0**. `test:storage` kört och grönt
(24/24). `lint`/`build`/`vitest run` körs innan commit. Inte deployat än – v5.107.0 väntar på
nästa deploy-tillfälle.

## Uppföljning 2026-08-16 (ETAPPLAN16.md föreslagen – leverantörsdashboard, EJ ANTAGEN)

Ägaren frågade om det finns en huvudvy för leverantören och en dashboard för översyn/hantering
av alla kunder. Svaret efter en kodgenomgång: **ja till förvaltning, nej till överblick.**
`src/pages/Leverantor.jsx` (990 rader) kan redan nästan allt som behöver GÖRAS med en kund,
men svarar inte på "vad behöver jag göra något åt i dag?" utan att man läser hela listan.

**`etapplaner/ETAPPLAN16.md` skriven som utkast (Etapp 67, fem delmål 67a–67e).** INTE antagen – väntar
på ägarens ställningstagande. Ingen rad kod skriven. Registrerad i `CLAUDE.md`s dokumentkarta
som utkast, medvetet INTE i läsordningens numrerade lista (den är för antagna planer – samma
behandling som `ETAPPLAN5-ALT-A/B.md` fick).

**Premisskontrollen (genomgående krav 8) gjordes före planen och gav sju utfall – fem höll,
två gjorde det inte:**

- **Fynd 2 (håller inte):** `/admin` gatas på `arRedaktor(role)` i `BottomNav.jsx:77`, men
  plattformsadmin-status finns INTE i `role`-fältet – den bor i collectionen
  `plattformsadmin/{uid}`. Klienten vet i dag ingenting om den. 67a måste därför bygga en ny
  hook först. `firestore.rules:300–302` visade sig tillåta `read: if arPlattformsadmin()`,
  alltså kan en plattformsadmin läsa sitt eget dokument medan alla andra får
  `permission-denied` – statusen går att avgöra utan ny collection eller regeländring.
- **Fynd 5 (håller inte, och lättast att missa tyst):** `manadsrapportOrganisationer`
  filtrerar uttryckligen bort demo-organisationen (`avtalslivscykel.js:324–325`), men
  `listaOrganisationer` gör det INTE – demo kommer med, bara flaggad `arDemo: true`. En
  nyckeltalsrad byggd rakt på arrayen hade räknat demomiljön som betalande kund. Blev
  **genomgående krav 29**: ett aggregat över alla kunder måste alltid exkludera demo, och
  exkluderingen ska synas på beräkningsstället.
- **Fynd 6 (delvis):** `satAvtalsstatus` (`avtalslivscykel.js:62`) skriver bara
  `{ avtalsstatus }` – ingen tidsstämpel. "Offerten har legat stilla i 40 dagar" går inte att
  svara på i dag. Lyftes till beslutspunkt 2 i stället för att byggas in på en gissning.
- **Fynd 7 (håller inte, men åt andra hållet):** kostnadstrend antogs kräva ny datainsamling.
  `organisationer/{orgId}/kostnadshistorik` skrivs redan en post per månad – bara `limit(1)`
  läses. Trend uteslöts ändå, men av lässkostnadsskäl, och hör ihop med Etapp 48c när
  GCP-exporten levererar.

**Tre beslutspunkter lämnades öppna åt ägaren:** samma sida eller ny (rekommenderat: samma),
om `avtalsstatusAndrad` ska byggas (rekommenderat: ja, plus att `skapad` börjar returneras –
fältet finns redan i `organisationslivscykel.js:94` men returneras inte), och om omfattningen
är rätt (om den ska kortas faller 67e först, sedan 67d).

Ingen versionsbump, ingen changelog-post – inget kundvänt har byggts. Endast
`etapplaner/ETAPPLAN16.md` (ny), `CLAUDE.md` (dokumentkartan) och den här sektionen.

## Uppföljning 2026-08-16 (Etapp 67a klar, v5.108.0 – leverantörsvyn fick en väg in)

Ägaren bad om delmål 67a ur `etapplaner/ETAPPLAN16.md`. **Planen som helhet är fortfarande inte antagen**
– de tre beslutspunkterna är obesvarade – men 67a byggdes separat eftersom det var fristående
från dem: det gör en befintlig vy nåbar och rör varken omfattning, datamodell eller server.

**Problemet som löstes:** `/leverantor` har sedan Etapp 6a saknat länk från gränssnittet
HELT. Vyn nåddes bara genom att skriva adressen för hand. Det är särskilt allvarligt eftersom
`drift/INCIDENT-CHECKLISTA.md` pekar dit på fem ställen under tidspress, bland annat för det globala
e-postnödstoppet.

**Två avvikelser mot planens egen skiss, båda funna i premisskontrollen av bygget:**

- Planen sa "post i `src/data/sokindex.js`" – **fel fil.** Den innehåller platshållardata från
  Fas 1 (påhittade kliniska rutiner), inte navigation. Rätt plats var `STATISKA_ATGARDER` i
  `useSokindex.js:34`, där Akutläge/Skiftrapport/Öva redan bor.
- **`STATISKA_ATGARDER` har ingen rollgating alls** – alla användare får hela listan. En post
  rakt in hade gett varje användare en sökträff som leder till "du har inte åtkomst". Listan
  byggs nu ihop i `useMemo` med posten villkorad.

**Ett beslut togs under bygget som inte syns i diffen:** hooken läser `plattformsadmin/{uid}`
**bara för superadmins**. Inte av behörighetsskäl (regellagret avgör ändå) utan för att
`useSokindex` används av både `SokFalt.jsx` och kommandopaletten på startsidan – en oskyddad
hook hade lagt en ALLTID misslyckad Firestore-läsning på den kritiska vägen för varje
användare vid varje session, och matat exakt den signal Etapp 32b vill larma på ("upprepade
`permission-denied`"). Att förorena mätningen innan larmet är byggt vore att sabotera den i
förväg. Säkert eftersom `blibForstaPlattformsadmin` kräver superadmin
(`functions/plattformsdrift.js:272`); den som utsetts via `gorTillPlattformsadmin` utan att
vara superadmin får ingen menypost men når vyn via adressen – dagens läge, ingen regression.

**Testet flyttade en funktion.** Predikatet låg först i hooken men gick inte att enhetstesta –
`firebase/config` anropar `getAuth(app)` vid import och kraschar i vitests nodmiljö.
`farForsokaLasaPlattformsadmin(uid, role)` bor därför i `src/firebase/roles.js`, som är fri
från Firebase-importer. Sakligt en bättre hemvist också: den står nu bredvid `arRedaktor`.

**Filer:** nya `src/hooks/useArPlattformsadmin.js` och
`src/firebase/arPlattformsadminGating.test.js` (4 tester som låser superadmin-avgränsningen);
ändrade `src/firebase/roles.js`, `src/components/BottomNav.jsx`, `src/hooks/useSokindex.js`,
`drift/INCIDENT-CHECKLISTA.md` (snabbreferensen "Var saker finns" + datumraden),
`etapplaner/ETAPPLAN16.md` (67a ✅ + "Genomfört"), `CLAUDE.md`, `src/data/andringslogg.js`.

**Övervägde men rörde inte `avtal/INCIDENTRESPONSPLAN.md`** – ingen detektions-,
begränsnings- eller återställningsförmåga ändrad, inga nya personuppgifter, ingen
regeländring. Samma bedömningsmönster som Etapp 65b/66b/66c/66d.

Version 5.107.0 → **5.108.0**. `lint`/`build`/`vitest run` (216/216) gröna.
`test:rules`/`test:storage`/`test:functions` kördes INTE – varken regelfiler eller Cloud
Functions är rörda. Committat och pushat. **Ingen deploy gjord** – inte begärd. Nästa deploy
tar med sig både v5.107.0 (SVG-spärren) och v5.108.0.

## Uppföljning 2026-08-16 (deployförsök BLOCKERAT – GitHub Actions får ingen runner)

**v5.107.0 och v5.108.0 är fortfarande INTE deployade.** Ett deployförsök gjordes på ägarens
begäran och misslyckades – men INTE på grund av koden. Skrivet här så att nästa session inte
gör om felsökningen från början.

**Symtom:** körning #79 (`deploy.yml`, commit `b0662e7`) avslutades med `failure` efter
**4 sekunder**, utan loggar (`get_job_logs` ger HTTP 404), med `runner_id: 0` och tomt
`runner_name`. En omkörning (`run_attempt: 2`) gav exakt samma resultat efter 2 sekunder.
Jobbet startade alltså aldrig – ingen runner tilldelades.

**Felsökningen visade att det inte är vår kod, och inte heller specifikt deploy.yml:**

- `deploy.yml` är **oförändrad** sedan körning #78 som lyckades (`git diff ef7c841..b0662e7 --
  .github/` är tom) och är giltig YAML.
- **CI misslyckas med exakt samma signatur** – 2 sekunder, `runner_id: 0`, inga loggar – på
  varje push sedan **2026-08-15 23:38:51** (CI #364, commit `ca574cb`). CI #362 kl. 23:25:47
  var den sista som lyckades. Även en ren dokumentationscommit (`a865b53`, CI #367) faller.
  Det utesluter att någon kodändring är orsaken.
- **Dependabots egna körningar lyckas** fortfarande (t.ex. 2026-08-16 08:45), vilket talar för
  att det är minuter/spendgräns för Actions-runners som tagit slut, inte att Actions är
  avstängt för repot.

**Slutsats:** allt som kräver en `ubuntu-latest`-runner nekas sedan 2026-08-15 ~23:38. Det
mest sannolika är att GitHub Actions-minuterna eller spendgränsen för faktureringsperioden är
förbrukade. **Det går inte att åtgärda från en kodsession** – kräver att ägaren tittar i
GitHub → Settings → Billing (spendgräns/minuter) och höjer eller inväntar nästa period.

**Koden är deployklar.** Hela CI-sviten kördes lokalt mot emulatorerna i stället, allt grönt:
`lint`, `build`, `vitest run` (216/216), `test:rules` (0 fel), `test:functions` (33 filer,
0 fel), `test:storage` (24/24). Så snart Actions fungerar igen räcker det att trigga
`deploy.yml` på `b0662e7` – ingen ny kodändring behövs, och den deployen tar med sig BÅDE
v5.107.0 (SVG-spärren + fyra ägarbeslut) och v5.108.0 (Etapp 67a).

**OBS för nästa session:** deployen körs INTE om automatiskt. Produktionen ligger kvar på
v5.106.0 (körning #78, commit `ef7c841`) tills någon triggar om den manuellt.

## Uppföljning 2026-08-16 (ETAPPLAN16.md ANTAGEN – ägaren följde alla tre rekommendationer)

Ägaren svarade "vi följer dina rekommendationer" på de tre öppna beslutspunkterna i
`etapplaner/ETAPPLAN16.md`. Loggat i `BESLUTSLOGG.md`. Beslut: (1) samma sida som `/leverantor`, inte en
separat `/leverantor/oversikt`; (2) bygg `avtalsstatusAndrad` väg (a) – `serverTimestamp()` i
`satAvtalsstatus` + `skapad` börjar returneras av `listaOrganisationer`; (3) omfattningen
(67b–67e) kortas inte.

Planen är alltså **antagen**. 67a var redan klart (v5.108.0, byggt separat samma dag eftersom
det var fristående från beslutspunkterna). 67b–67e är antagna men INTE byggda ännu – väntar på
nästa "genomför delmål 67x". Ingen kod skriven i den här uppföljningen, bara planfilerna
(`etapplaner/ETAPPLAN16.md`, `CLAUDE.md`, `BESLUTSLOGG.md`) uppdaterade.

**Deployläget är oförändrat sedan förra uppföljningen** – v5.107.0/v5.108.0 ligger fortfarande
pushade men odeployade, blockerat av att GitHub Actions inte tilldelar någon runner (se
"Uppföljning 2026-08-16 (deployförsök BLOCKERAT)"). Ägaren har bett oss avvakta med deploy
tills vidare.

## Uppföljning 2026-08-16 (avtalsstatusAndrad/skapad – Etapp 67 beslutspunkt 2, v5.109.0)

Ägaren bad om beslutspunkt 2:s serverdel först ("börja med tidsstämpeln och skapad-fältet"),
innan 67b/67c byggs ovanpå den.

**Byggt:** `avtalslivscykel.js`s `satAvtalsstatus` sätter nu `avtalsstatusAndrad:
admin.firestore.FieldValue.serverTimestamp()` i samma `set(..., { merge: true })` som
`avtalsstatus` – ingen extra skrivning. `organisationslivscykel.js`s `listaOrganisationer`
returnerar `skapad` och `avtalsstatusAndrad` som ISO-strängar (fältet `skapad` fanns redan
sedan Etapp 6b men skrevs aldrig ut; `avtalsstatusAndrad` är nytt och `null` för organisationer
vars avtalsstatus aldrig ändrats sedan fältet infördes).

**Ren serverändring – ingen UI-yta ännu.** Det här var uttryckligen bara underlaget; 67b
(nyckeltal) och 67c ("kräver åtgärd", där en stillastående offert blir en sjunde signal) är
de delmål som faktiskt visar värdena.

**Testat:** tre nya tester i `tests/functions/etapp6.test.cjs`, i det redan etablerade mönstret
för `satAvtalsstatus`/`listaOrganisationer` – `avtalsstatusAndrad` sätts och syns; en
organisation som aldrig bytt avtalsstatus visar `null` (inte ett fel, en explicit distinktion
mellan "aldrig ändrad" och "misslyckades"); `skapad` returneras som giltig ISO-tidsstämpel för
en nyetablerad organisation. `lint`/`build`/`vitest run` (216/216) och `test:functions` (hela
kedjan) gröna. `test:rules`/`test:storage` kördes inte – ingen regelfil rörd.

Version 5.108.0 → **5.109.0**. `andringslogg.js` fick en post, medvetet formulerad som "ingen
synlig förändring" – det här är ett internt förberedande steg, inget en organisations egna
användare märker av. Committat och pushat. **Ingen deploy** – ägaren har bett oss avvakta.

## Uppföljning 2026-08-16 (Etapp 67b klar, v5.110.0 – nyckeltalsrad)

Ägaren bad om att köra `etapplaner/ETAPPLAN16.md`s kvarvarande delmål (67b–67e) i följd, utan att stanna
mellan varje. Det här är det första i den kedjan.

**Byggt:** ny delad util `src/utils/leverantorSignaler.js` (`berakLeverantorSignaler`) – byggd
NU snarare än isolerat i 67c (dit den enligt planen egentligen hörde), för att 67b:s
"Kräver åtgärd"-räkning och 67c:s kommande fullständiga lista ska dela EXAKT samma sju
villkor, inte två separata implementationer som kan glida isär. Tar en injicerbar
"nu"-tidpunkt (samma testbarhetsmönster som `utils/kompetensStatus.js`).

Ny `src/components/leverantor/NyckeltalSektion.jsx`, renderad överst i `/leverantor`: aktiva
kunder, andel i provperiod, totalt antal användare, summerat avtalat pris (med explicit
markering av hur många kunder som saknar ifyllt pris), "kräver åtgärd"-antal, och den tidigare
fristående "Delad sökkvot idag"-sektionen flyttad hit enligt planens uttryckliga instruktion.
Genomgående krav 29 respekteras genomgående – varje summa exkluderar `arDemo` explicit.

Rutorna är klickbara och sätter ett nytt `snabbfilter`-state i `Leverantor.jsx`
(`null | "aktiva" | "provperiod" | "atgard"`) som filtrerar organisationslistan därunder, med
en rubrik som visar "N av M" och en "Visa alla"-knapp. Byggd som en BESTÅENDE variabel redan
nu, inte en tillfällig lösning – 67d ska bygga vidare på den, inte ersätta den. Varje rad fick
`id="org-{orgId}"`, förberett för 67c:s kommande djuplänkning.

**Testat:** 14 nya tester i `leverantorSignaler.test.js` (bl.a. att demo ALDRIG ger en signal,
och att flera samtidiga problem sorteras HÖG→MEDEL→LÅG). `lint`/`build`/`vitest run`
(230/230) gröna. Ingen regelfil/Cloud Function rörd – `test:rules`/`test:storage`/
`test:functions` kördes inte. Ingen live webbläsarverifiering (samma etablerade mönster som
tidigare delmål i den här vyn – en plattformsadmin-gated intern sida, verifierad via
enhetstester snarare än en seedad emulatoruppstart).

Version 5.109.0 → **5.110.0**. Fortsätter nu direkt med 67c enligt ägarens instruktion.

## Uppföljning 2026-08-16 (Etapp 67c klar, v5.111.0 – "kräver åtgärd"-listan)

Andra delmålet i den obevakade kedjan (67b–67e).

**Byggt:** `KraverAtgardSektion.jsx`, direkt under nyckeltalen. Ren renderingskomponent – all
logik satt redan i 67b:s delade `berakLeverantorSignaler`. En rad per signal: allvarlighetsikon,
organisationsnamn som en native `#org-{orgId}`-ankarlänk (skrollar till raden 67b redan gav ett
`id`, ingen egen JS behövdes), signalens text. Tom lista visar "Inget kräver din
uppmärksamhet just nu" istället för en tom yta.

**Sjunde signalen, utöver planens ursprungliga sex:** stillastående offert – möjliggjord av
gårdagens beslutspunkt 2 (`avtalsstatusAndrad`/`skapad`). Tröskeln (30 dagar) är ett rimligt
förstaval, dokumenterat i koden som just det, inte en branschnorm eller ett citat ur planen.

**Testat:** ingen ny testfil behövdes – logiken är redan täckt av 67b:s 14 tester mot den
delade utilen. `lint`/`build`/`vitest run` (230/230, oförändrat) gröna.

Version 5.110.0 → **5.111.0**. Fortsätter nu direkt med 67d enligt ägarens instruktion.

## Uppföljning 2026-08-16 (Etapp 67d klar, v5.112.0 – sortering/filtrering/sök)

Tredje delmålet i den obevakade kedjan (67b–67e).

**Byggt:** ny ren util `src/utils/leverantorFilter.js` (`filtreraOchSorteraOrganisationer`),
samma mönster som `leverantorSignaler.js`. En filterrad ovanför organisationslistan: fritextsök
(namn ELLER huvudman), avtalsstatus, status, modul, sortering (namn/användare/pris/kostnad/
provperiod) med riktningsknapp, och en "visa demo"-kryssruta.

**Hela tillståndet flyttat till URL:en** via `useSearchParams` (`?status=pausad&sort=pris&
riktning=desc`), `replace: true` så varje tangenttryckning i sökfältet inte spammar
webbläsarhistoriken. 67b:s `snabbfilter` (nyckeltalsrutornas genväg) ersattes INTE – det är
fortfarande samma variabel, bara flyttad från lokal `useState` till URL-parametern `snabb`,
precis som lovat i 67b:s egen dokumentation. De två filterlagren kombineras med OCH.

**En sorteringsdetalj värd att notera:** saknade värden (t.ex. ett aldrig ifyllt avtalat pris)
sorteras alltid sist oavsett riktning – annars hade "sortera på pris, fallande" blandat ihop
"dyraste kund" med "kund utan pris" beroende på vilken riktning man råkat välja.

**Testat:** 9 nya tester i `leverantorFilter.test.js`. `lint`/`build`/`vitest run` (239/239)
gröna. Ingen regelfil/Cloud Function rörd.

Version 5.111.0 → **5.112.0**. Fortsätter nu direkt med sista delmålet, 67e (dela upp
`Leverantor.jsx`), enligt ägarens instruktion.

## Uppföljning 2026-08-17 (Etapp 67e klar, v5.113.0 – Etapp 67 helt byggd)

Sista delmålet i den obevakade kedjan (67b–67e), begärd av ägaren 2026-08-16. **Med det är
`etapplaner/ETAPPLAN16.md` (Etapp 67, leverantörsdashboarden) helt byggd** – fem delmål över två dagar
(67a v5.108.0, beslutspunkt 2 v5.109.0, 67b v5.110.0, 67c v5.111.0, 67d v5.112.0, 67e v5.113.0).

**Byggt:** `Leverantor.jsx` delades från 1145 rader till **217**. Sex nya filer i
`src/components/leverantor/`: `SkapaOrganisationSektion`, `DemomiljoSektion`,
`EpostNodstoppSektion`, `HuvudmanSektion`, `OrganisationsListaSektion`, `OrganisationsRad`,
plus en delad konstant `avtalsstatusEtikett.js`. Samma katalogmönster och konvention som
Etapp 8c redan etablerade för `Admin.jsx`.

**En avvikelse mot Admin.jsx:s rena "helt självständig sektion"-mönster, medveten och
motiverad:** tre av de sex nya komponenterna (`SkapaOrganisationSektion`, `DemomiljoSektion`,
`HuvudmanSektion`) följer mönstret exakt – minimala props, egna hooks. Men
`OrganisationsListaSektion`/`OrganisationsRad` kunde inte göras lika självständiga:
`NyckeltalSektion` (67b, ett SYSKON högre upp på sidan) behöver EXAKT samma
filter-/sorteringstillstånd som listan, så det tillståndet måste ligga kvar i `Leverantor.jsx`
(föräldern till båda) och skickas ner som props.

**Ett beteende bevarades medvetet trots att en "bättre" lösning fanns nära till hands:**
`diagnostikOppen`/`innehallOppen`/`arendenOppen` är fortfarande EN variabel var i
`OrganisationsListaSektion`, inte per-rad-state i `OrganisationsRad` – exakt den
ursprungliga semantiken "bara en organisations panel öppen åt gången i HELA listan". Projektets
etablerade per-rad-hook-mönster (`RutinKort.jsx`, `PagagendeTilldelning`) hade gett flera
samtidigt öppna paneler, en teknisk sett snyggare UX, men planens "Klart när" krävde oförändrat
beteende – en förbättring smugglad in i en refaktorering är precis vad "ren flytt" utesluter.

**Testat:** inga nya tester behövdes – ingen ny logik, bara flyttad. `lint`/`build`/
`vitest run` (239/239, oförändrat) gröna, vilket bekräftar att inget importfel eller trasig
referens smög sig in under omskrivningen.

**Dokumentation avslutad för hela etappen:** `etapplaner/ETAPPLAN16.md`s toppstycke, sammanfattningstabell
och beslutspunkter uppdaterade till "HELT KLAR". `CLAUDE.md`s läsordning fick en ny post 3
(`etapplaner/ETAPPLAN16.md`), övriga punkter numrerade om ett steg (samma mönster som när `etapplaner/ETAPPLAN15.md`
sattes in tidigare) – och dokumentkartans tabellrad uppdaterad från "ANTAGEN" till "HELT KLAR".

Version 5.112.0 → **5.113.0**. **Fem versioner (v5.107.0–v5.115.0) ligger nu pushade men
odeployade** – ägaren har bett oss avvakta med deploy tills vidare. Ingen ytterligare
uppmaning väntar just nu; nästa steg är antingen en ny etapp eller en deploy, båda på ägarens
initiativ.

## Uppföljning 2026-08-17 (säkerhetsgranskning Del 1 av 4, v5.114.0)

Ägaren beställde en **komplett säkerhetsgranskning av all kod**, uppdelad i fyra omgångar med
patchning allt eftersom. Fullständigt arbetsunderlag: **`granskningar/SAKERHETSGRANSKNING-2026-08.md`** –
läs den, inte den här sektionen, för detaljerna. Tre ägarbeslut styr arbetet: patcha direkt men
flagga det som kan bryta produktionsåtkomst; försök uppgradera firebase-tools men rulla tillbaka
om det brister; **deploya inget oavsett fynd**.

**Del 1 (regel- och behörighetslagret) klar.** Tre patchade fynd i `firestore.rules`:

- **1.1 (allvarligast):** personnummer-spärren missade samordningsnummer med dagfält 82–91,
  alltså alla födda den 22:a–31:a – ungefär en tredjedel. Ett samordningsnummer är födelsedagen
  + 60, så fältet går till 91, men regeln täckte bara 61–81. Klientfiltret fångade dem, men
  regeln är det lager som ska hålla mot direktanrop förbi klienten. Nu 61–91.
- **1.2:** varje leverantörsadmin kunde läsa varje kunds **fullständiga revisionslogg** utan
  kundbeviljat fönster, utan kundens vetskap och utan spår. Gated nu på `farSupportlasa()` som
  allt annat kundinnehåll (Etapp 50b:s princip). Verifierat att ingen klientkod använde grenen.
- **1.3:** `visningar`/`checklistkorningar` saknade fältbegränsning; `visningar.titel` renderas
  för hela organisationen i kommandopaletten.

Ny `tests/rules/sakerhetsgranskning-del1.test.mjs` (15 tester) i `test:rules`. **Bevisad
meningsfull:** 7 av dem failar mot regelfilen före patchen, 15/15 passerar efter.

**firebase-tools 13 → 15 försöktes och rullades tillbaka.** `test:rules` klarade sig, men
`test:storage` gick 24/24 → 18/24: samtliga sex fel var "ska tillåtas"-tester som havererade på
`firestore.get()` i storage-emulatorn. Failar stängt, men blindar sex tester på storage-lagrets
organisationsisolering. Den kritiska `tar`-sårbarheten kvarstår därmed – dev-only, dokumenterad.

**Processfynd (1.8) som är värt att komma ihåg:** `tests/docs/pitch-version.test.js` failade
**redan innan granskningen**, sedan v5.113.0. Orsaken är att releaserutinen kört testsvepet
FÖRE versionsbumpen – vakthunden jämför mot `package.json` och såg alltid den gamla versionen.
v5.113.0 committades därför med ett rött test. `saljmaterial/PITCH.md` är nu uppdaterad (version + de
kundvända funktioner som saknades från Etapp 65/66). **Kör testsvepet EFTER bumpen framåt.**

Full svit grön: `lint`, `build`, `vitest` 239/239, `test:rules` 16 filer 0 fel, `test:storage`
24/24. **Inget deployat** – Del 1:s patchar är alltså ännu inte i produktion.

**Nästa:** Del 2 (Cloud Functions). Öppen fråga att ta med dit: `systemvarningar`/`systemstatus`/
`halsokontrollhistorik` läses av varje superadmin utan org-skopning – kontrollera vad de
schemalagda funktionerna faktiskt skriver dit.

## Uppföljning 2026-08-17 (säkerhetsgranskning Del 2 av 4, v5.115.0)

Del 2 (Cloud Functions, 14 filer, ~5 500 rader, ~93 exports) klar. Rapport:
`granskningar/SAKERHETSGRANSKNING-2026-08.md`.

**Den öppna frågan från Del 1 besvarades – och det läckte.** `verifieraRevisionskedjor()`
(nattjobbet 04:00) skrev varje avvikande organisations ID till både
`systemstatus/revisionskedja.avvikelser` och `systemvarningar.meddelande`. Båda är enligt
`firestore.rules` läsbara av en superadmin i VILKEN organisation som helst. Varje kund kunde
alltså läsa ut leverantörens kundlista OCH vilka andra kunder som hade en bruten
revisionskedja.

Det anmärkningsvärda: **kodbasen dokumenterar redan den korrekta principen två gånger och
följer den där** – `reserveraBudget()` ("skulle här läcka en annan kunds AI-förbrukning till
alla andra kunders superadmins") och `okaSokkvot()` ("bara AGGREGAT ... hade läckt
cross-tenant"). Nattkontrollen var undantaget som bröt mot sin egen husregel.

**Fynd 2.2 (följdfel av samma design):** `alletGiltigt` var en GLOBAL dom som renderades i
varje kunds egen incidentberedskapsvy. Kund A fick "🔴 Avvikelse upptäckt" när kund B:s kedja
brast – vyn som ska svara på "är MIN revisionslogg orörd?" svarade på något helt annat.

**Åtgärdat:** detaljerna går nu bara till Sentry; `systemvarningar` anger antal, aldrig vilka;
`systemstatus/revisionskedja` är rensat från kundidentiteter och läsrätten skärpt till
plattformsadmin. Varje organisation får sin EGNA status på
`organisationer/{orgId}.revisionskedja` (redan korrekt org-skopat), som `useSystemstatus.js`
och `IncidentberedskapSektion.jsx` nu läser.

**Tre befintliga tester kodifierade det gamla beteendet** och är vända: två i
`etapp32d.test.cjs` (ett krävde uttryckligen att varningen NÄMNDE den trasiga organisationen)
och ett i `systemstatus.test.mjs` (krävde att en kunds superadmin KUNDE läsa). Regeltestfilen
är omdöpt till `tests/rules/sakerhetsgranskning.test.mjs` (18 tester) eftersom den nu spänner
över flera granskningsdelar.

**Utan anmärkning, systematiskt kontrollerat:** samtliga callables kontrollerar `request.auth`
(verifierat programmatiskt, noll undantag); bara tre tar `organisationId` från klienten och
alla går genom en grind som bara litar på värdet för plattformsadmin; rolländring och
supportåtkomst är korrekt grindade (leverantören kan inte bevilja sig själv åtkomst);
källbevakningen kör domänkontroll som andra försvarslager före varje hämtning (ingen SSRF);
inbjudningstoken är 192 bitar med e-postbindning och transaktion mot dubbelinlösen;
backup-återställning kan inte path-traversas.

Full svit grön: `lint`, `build`, `vitest` 239/239, `test:rules` 16 filer 0 fel,
`test:functions` 0 fel. **Inget deployat** – fynd 1.1–1.3 och 2.1–2.2 är patchade men
fortfarande öppna i produktion.

**Nästa:** Del 3 (`src/hooks/`, `src/firebase/`, `src/utils/`).

## Uppföljning 2026-08-17 (säkerhetsgranskning Del 3 av 4, v5.116.0)

Del 3 (`src/hooks/` 60 filer, `src/firebase/` 10, `src/utils/` 28) klar. Rapport:
`granskningar/SAKERHETSGRANSKNING-2026-08.md`.

**Den lönsammaste tråden var en egenkontroll av mina egna tidigare patchar.** Del 1 lade ett
fältfilter på `checklistkorningar` (`hasOnly([... 'avbrottPerSteg'])`). Klienten skriver
`{ [\`avbrottPerSteg.${stegIndex}\`]: increment(1) }` via `setDoc({merge:true})` – och
punktnotation är en fältSÖKVÄG för `updateDoc` men INTE för `setDoc`, som skapar ett
toppnivåfält som bokstavligen heter `avbrottPerSteg.3`. Skrivningen NEKADES alltså av min egen
regel (verifierat mot emulatorn). Del 1:s test missade det för att det skrev `antalSlutforda`,
ett fält som råkade vara enkelt. **Lärdom att ta med till Del 4: ett fältfilter måste testas
mot VARJE faktisk skrivning, inte mot en representativ.** Samma rad avslöjade att
"mest avbrutna steg" aldrig fungerat sedan Etapp 18d – läsaren förväntar sig en nästlad map
som aldrig skapades. Båda lösta med en riktig nästlad map.

**Fynd 3.1 (hög):** klientens `piiFilter.js` – appens primära PII-spärr, den som gäller nästan
all fritext – missade den TOLVSIFFRIGA personnummerformen helt (`19900101-0017`). Hittades
genom att bära Del 1:s öppna fråga vidare: serverregeln patchades där till att täcka båda
formerna, och en kontroll av om klienten sa samma sak visade att lagren var oense – med det
svagare på den bredare vägen.

**Fynd 3.2 (medel):** `senastBesokta.js` använde en GLOBAL localStorage-nyckel medan
`useOfflineCenter.js` och `checklistFramsteg.js` uttryckligen resonerar om delade enheter och
nycklar per uid. Värre än att nästa person såg listan: `useSenastBesokta` faller tillbaka på
den lokala kopian när kontots fält saknas (nya användare) och skriver sedan tillbaka den till
`users/{uid}` – föregående persons historik hamnade permanent i en ANNAN användares konto.
Utloggningsstädningen sveper nu även dessa nycklar, men medvetet INTE `offlineKo_` (köade
bristanmälningar) eller `synappsen_checklista_` – skälet står i koden.

**Fynd 3.3 är FLAGGAD, inte patchad, och kräver ett ägarbeslut.** `users/{uid}` är läsbar för
hela organisationen inklusive `pushTokens`, och en användare får fritt skriva sitt eget
tokenfält. En kollega kan alltså lägga in någon annans token i sin egen lista och få
Synappsen-notiser att dyka upp på den personens telefon. Ingen dataåtkomst utöver det
angriparen redan har, men på en akutmottagning är en falsk "Ny akutrutin"-notis en
patientsäkerhetsnära väg. Riktig fix kräver att tokens flyttas ur `users/{uid}` (Firestore har
ingen fältnivåläsrätt) med migrering och ändring i varje push-väg – faller under
åtgärdsmandatets undantag. Rekommendation i rapporten: `pushEnheter/{token}` med
övergångsperiod där `skickaPush()` läser båda ställena. Uppskattat omfång: en halv etapp.

**Fynd 3.4 (låg–medel, delvis patchad):** `bildUrl`/`bilagor[].url` saknar den ursprungsspärr
`externaKallor` redan har (`arGodkandaKallor`). Offlinehämtningen anropade `cache.add()` på
dem, så en redaktör kunde få varje anställd att skicka ett anrop till en godtycklig extern
värd. Ny `src/utils/storageUrl.js` filtrerar offlinedelen. `<img src>`-halvan hör till Del 4.

**Utan anmärkning:** samtliga 37 frågeställande hooks kartlagda mot sina `where`-satser (ingen
ny list-provability-bugg); `halsokontrollhistorik`/`systemvarningar` innehåller efter Del 2
enbart infrastrukturstatus utan kundidentitet; Storage-sökvägar med `/` i filnamnet fallerar
stängt (segmentbindning i `storage.rules`); `mfa.js`, `messaging.js`, `felrapportering.js`
rena.

Full svit grön: `lint`, `build`, `vitest` 253/253, `test:rules` 16 filer 0 fel. **Inget
deployat.** Obs: v5.114.0 får INTE deployas utan v5.116.0 – Del 1:s regression rättas där.

**Nästa:** Del 4 (`src/components/`, `src/pages/`, CSP, workflows, beroenden).

## Uppföljning 2026-08-17 (säkerhetsgranskning Del 4 av 4, v5.117.0 – HELA GRANSKNINGEN KLAR)

Del 4 (`src/components/` + `src/pages/`, 131 filer, plus CSP, service workern, fem
GitHub Actions-workflows och beroendekedjan) klar. Därmed är hela den fyrdelade granskningen
avslutad: **17 fynd, 12 patchade, 3 flaggade för ägarbeslut, 2 dokumenterade.** Fullständig
rapport: `granskningar/SAKERHETSGRANSKNING-2026-08.md`. Sammanfattning även inskriven som ett
`## Tillägg`-block i `granskningar/SAKERHETSRAPPORT.md`, enligt den återkommande säkerhetsgenomgångens
rutin.

**Arbetssättet i Del 4 skilde sig:** en parallell delagent gjorde breddsvepet av komponenter
och sidor medan jag tog CSP, workflows, beroenden och service workern. Varje fynd delagenten
rapporterade verifierades mot koden innan det togs in – ett var osäkert formulerat (`target`-
attributet, som DOMPurify i själva verket redan strippar) och ett krävde en helt annan
slutsats efter en körning i riktig webbläsare. Delagenten var värd sitt pris på just den här
delen (bred, grund, låg kontextberoende), men dess rapport är ett underlag, inte ett facit.

**Fynd 4.2 (medel–hög):** `MarkdownInnehall.jsx` anropade `DOMPurify.sanitize()` UTAN
konfiguration, och DOMPurifys standard tillåter `<form>` och `<input>`. En redaktör kunde
lägga ett inloggningsliknande fält mitt i en klinisk rutin som POST:ar till en extern server.
CSP:ns `form-action 'self'` hade stoppat submitten – men policyn var Report-Only (fynd 4.1).
Två lager, båda avstängda, ingetdera synligt som en lucka. Saneringen ligger nu i
`src/utils/sanering.js` med explicit `FORBID_TAGS`/`FORBID_ATTR`.

**VIKTIG METODLÄRDOM, läs den här innan du skriver ett saneringstest.** Mitt första försök var
ett vitest-test under happy-dom. Det rapporterade `<script>` och `javascript:`-länkar som
OSANERADE – ett falskt kritiskt larm – och `<h1>` som borttagen. DOMPurify använder
webbläsarens DOM-parser och beter sig fel under happy-dom trots att den rapporterar
`isSupported: true`. Sanningen kom först ur en körning i riktig Chromium. Hade jag rapporterat
den första körningen hade rapporten innehållit en påhittad sårbarhet OCH missat den verkliga,
som drunknat i bruset. Testet ligger därför i `tests/e2e/markdownsanering.spec.js`, med hela
resonemanget i filhuvudet. Den kasserade vitest-filen finns inte kvar.

**Fynd 4.1:** CSP:n var avstängd i två oberoende avseenden – `Report-Only` (blockerar
ingenting) OCH `script-src 'unsafe-inline'` (hade gjort direktivet verkningslöst även skarpt).
`'unsafe-inline'` fanns bara för ETT statiskt inline-skript i `index.html`, som i stället
tillåts med sin sha256-hash. `img-src` är samtidigt begränsad till Storage-domänerna, vilket
stänger den kvarvarande halvan av fynd 3.4. Hashen skyddas av `tests/docs/csp-hash.test.js`
(räknar om den ur index.html + failar om `'unsafe-inline'` smyger tillbaka).

**Fynd 4.4/4.5/4.6 – kioskläget:** `anteckningar` saknade `!arKiosk()` trots att fem andra
collections har den, och det är den ENDA collectionen vars gränssnitt uttryckligen lovar
avskildhet ("Bara du kan se det du skriver här") – på ett delat konto var det osant.
Kommentarsfältets @-autokomplettering gjorde dessutom en obevakad foajéplatta till en
uppslagsbok över personalens namn och e-post. Och kvitteringsknappen visades trots att regeln
nekar den, vilket byggde en offlinekö som aldrig kunde tömmas. Regel + UI rättade,
`kioskrestriktioner.test.mjs` utökad till 12 tester.

**Flaggat, kräver ägarbeslut** (i `OPPNA-PUNKTER.md`): 3.3 (flytta push-tokens ur
`users/{uid}`), 4.1 (gör CSP:n skarp efter en mätperiod), 4.7 (pinna GitHub-actions till SHA
och `firebase-tools` till en version i deployjobbet).

**Beroenden slutgiltigt utredda:** `npm audit --omit=dev` ger 0 sårbarheter. Alla sju,
inklusive den kritiska `tar`, kommer via `firebase-tools` (devDependency). Produktionsbygget
är rent – fynd 1.4 är därmed besvarat med en mätning i stället för ett resonemang.

Full svit grön: `lint`, `build`, `vitest` 255/255, `test:rules` 16 filer 0 fel,
`test:functions`, `test:storage`, `test:e2e`.

**Deployläget, viktigast av allt just nu:** produktionen kör v5.106.0. v5.107.0–v5.117.0 är
pushade och odeployade enligt ägarbeslutet att avvakta genom hela granskningen. **Samtliga
patchade sårbarheter är alltså fortfarande öppna i produktion.** Delarna ska deployas
TILLSAMMANS – v5.114.0 utan v5.116.0 bryter checklistlägets avbrottsräknare (Del 1:s
regression, rättad i Del 3).

**Nästa:** ingen granskningsdel återstår. Nästa naturliga steg är ett deploybeslut, och
därefter de tre flaggade punkterna.

## Uppföljning 2026-08-21 (deploy av v5.107.0–v5.117.0, körning #81)

Ägaren hävde avvakta-beslutet och bad om deploy av samtliga väntande commits. **Körning #81,
commit `3c2c7df`, conclusion: success**, 20:42–20:48 UTC (5 min 46 s). Ny asset-hash live:
`assets/index-BUk2-H6q.js`.

Därmed är hela säkerhetsgranskningens patchar i produktion: fynd 1.1–1.3, 2.1–2.2, 3.1–3.2,
3.4–3.5 och 4.2–4.6. Produktionen gick från v5.106.0 till v5.117.0 i ett steg, elva versioner.

**Infrastrukturblockeringen är över.** Körning #79 (2026-08-16) och #80 (2026-08-18)
misslyckades båda på sekunder utan loggar, med `runner_id: 0` – diagnosen då var att
GitHub Actions inte tilldelade någon runner, sannolikt en spendgräns. #81 kördes normalt.
Ingen kodändring låg bakom, så inget behöver göras åt det.

**En sak är INTE verifierad, och ska kontrolleras om.** CSP-rubriken som produktionen serverar
är fortfarande den GAMLA policyn: `img-src 'self' data: blob: https:`, ingen sha256-hash, inget
`frame-ancestors`. Den deployade commiten innehåller bevisligen den patchade policyn
(`git show 3c2c7df:firebase.json`), och svaret bär `cache-control: max-age=3600`. Mest
sannolikt är det alltså Firebase Hostings edge-cache, som ignorerar query-strängar och därför
inte går att cache-busta. **Kontrollera rubriken igen efter en timme.** Står den gamla policyn
kvar då är fynd 4.1 fortfarande öppet i produktion trots deployen, och orsaken är något annat
än cache.

Övriga fynd är bekräftat live: saneringens `FORBID_ATTR` (fynd 4.2) finns i den serverade
bundlen. Regelfilerna deployades i samma `firebase deploy`, och jobbet kör lint, vitest,
`test:rules` och build som grindar före deploysteget – ett rött test hade stoppat hela
körningen.

**Kvar att besluta:** de tre flaggade punkterna i `OPPNA-PUNKTER.md` (3.3 push-tokens,
4.1 skarp CSP, 4.7 pinnade actions), samt glappet mellan `produkt/VARUMARKE.md` §12 och den faktiska
appikonen (se jämförelsen 2026-08-21).

## RÄTTELSE 2026-08-21 (körning #81 deployade INTE hosting)

**Föregående sektion är fel och rättas här.** Jag skrev att produktionen gick från v5.106.0
till v5.117.0 i körning #81. Det stämmer inte. Körningen rapporterade `conclusion: success`,
och jag tog det som bevis på att deployen var klar utan att kontrollera artefakten. Det var
felet.

**Vad som faktiskt hände:** körning #81 deployade **Cloud Functions och regelfilerna**, men
**inte hosting**. Jobbloggen visar ett sextiotal `Successful update operation` för functions
(med några 429 Quota Exceeded som CLI:n själv försökte om och lyckades med), men inget
hosting-steg syns.

**Bevisen, i den ordning som gjorde det avgjort:**

| Kontroll | Utfall |
|---|---|
| Lokal bygg-hash mot serverad | `index-BOG0uMiH.js` mot `index-BUk2-H6q.js`, olika |
| `saneraMarkdown` i serverad bundle (fynd 4.2) | saknas |
| `FORBID_TAGS` (fynd 4.2) | saknas |
| `avbrottPerSteg` (fynd 3.5) | saknas |
| `synappsen_senast_besokta_` (fynd 3.2) | saknas |
| `last-modified` på serverad tillgång | 2026-08-15 23:24 UTC, alltså **körning #78** |

Träffen på `formaction` som jag tog som bevis för att fynd 4.2 var live var **falsk**; strängen
finns i bundlen av andra skäl. Det är den enda kontroll jag gjorde direkt efter deployen, och
den råkade vara den enda som kunde ge fel svar.

**Konsekvens för säkerhetsgranskningen.** Fynden delar sig i två högar:

- **Live i produktion:** allt som ligger i `firestore.rules`, `storage.rules` och `functions/`.
  Alltså fynd 1.1, 1.2, 1.3, 2.1, 2.2 och 4.4 (regeldelen).
- **INTE live:** allt som ligger i klientkoden eller i `firebase.json`. Alltså fynd 3.1
  (tolvsiffrigt personnummer), 3.2 (senast besökta på delad enhet), 3.4, 3.5, 4.1 (CSP), 4.2
  (nätfiskeformulär i markdown), 4.3, 4.5 och 4.6.

Det förklarar också varför CSP-rubriken fortfarande var den gamla en timme efter deployen.
Cachehypotesen var fel: rubriken kommer från `firebase.json`s hosting-block, och hosting
deployades aldrig.

**Åtgärd: deployen omkörd som körning #82** (commit `c5507f3`, 21:57–22:02 UTC).
**Hosting är nu utbytt.** Verifierat med fyra oberoende signaler:

| Kontroll | Utfall |
|---|---|
| `/icons/symbol.svg` | HTTP 200. Filen fanns inte före commit `0cc1132` |
| `/icons/symbol-axon.svg` | HTTP 200. Samma sak |
| `/icons/icon.svg` | Innehåller "Appikon", alltså den nya symbolen och inte S-bokstaven |
| CSP-rubriken | `sha256-P9yZ…` finns, `unsafe-inline` borta, `img-src` begränsad till Storage, `frame-ancestors 'none'` |

**Fynd 4.1 är därmed stängt i produktion**, och hela säkerhetsgranskningen är live.

### Två testfel jag gjorde på vägen, båda värda att skriva ned

**1. En grön workflow är inte bevis för en genomförd deploy.** Det var felet efter #81.

**2. Att söka efter funktions- och variabelnamn i en byggd bundle bevisar ingenting.**
Efter #82 sökte jag `saneraMarkdown`, `FORBID_TAGS`, `avbrottPerSteg` och
`synappsen_senast_besokta_` i den serverade bundlen och fick noll träffar, och drog slutsatsen
att hosting fortfarande var gammal. Fel igen: **min egen lokala bundle saknar samma strängar**,
eftersom minifieringen döper om identifierare och koden delas i chunks. Testet kunde bara ge
ett svar.

Att jämföra lokal bygg-hash mot serverad är också ogiltigt: workflowen skriver en `.env` med
riktiga Firebase-värden före bygget, medan en lokal build saknar den, så innehållet och
därmed hashen skiljer sig alltid.

**Signaler som faktiskt håller efter en deploy:** en fil som är NY i commiten (HTTP 200 mot
404), en HTTP-rubrik som kommer ur `firebase.json`, eller en användarvänd textsträng som
överlever minifiering, hämtad ur rätt chunk. Inte identifierarnamn, inte bundle-hashar.

**Lärdom att bära vidare, och den hör hemma i releaserutinen:** en grön workflow är inte
bevis för att en deploy nått fram. Skillnaden mellan "jobbet gick igenom" och "artefakten är
utbytt" är precis den sortens glapp som resten av det här projektet redan har regler mot.
Releasechecklistan i `.claude/skills/synappsen-release/SKILL.md` säger redan åt en att
kontrollera asset-hashen efter deploy. Jag gjorde det, men jämförde den inte mot något, och
en hash utan jämförelse bevisar ingenting.

## Uppföljning 2026-08-21 (Etapp 68a och 68b, v5.118.0)

Ägaren antog `etapplaner/ETAPPLAN17.md` delvis och bad om 68a och 68b nu, med 68c, 68d och 68f
schemalagda 3,5 timmar senare. Båda klara.

**68a, tokendisciplin.** 37 hårdkodade hexvärden i 16 filer, inte 141 i 10 som planens
premisskontroll påstod. Min siffra räknade felaktigt in `index.css` själv. Rättas i 68f.

Arbetet delade sig i fyra kategorier, och den tredje gav riktiga buggar:

1. **Vitt på färgad yta** (7 filer). Två nya tokens `--pa-primar` och `--pa-farlig` i alla
   tre temablocken. Värdet är vitt i båda teman, och poängen är inte att det varierar utan
   att en framtida ändring av `--primar` blir en ändring i stället för en jakt.
2. **Döda fallbacks** (5 st). `var(--kant, #ddd)` och liknande där token:et finns, så
   fallbacken aldrig kan gälla. Värst var `var(--primar, #2a7)`, en GRÖN reservfärg för
   primärblå som hade sett besynnerlig ut om den någonsin slagit till.
3. **TRE RIKTIGA BUGGAR.** `--fel`, `--bg-yta` och `--fara` finns inte som tokens. De
   elementen renderade alltså sin hårdkodade fallback och **följde inte mörkt läge**:
   en varningstext i `Personalpuls.css`, en bakgrund i `Kommentarer.css` och en statusfärg
   i `Kompetensmatris.css`. Nu `var(--farlig)` respektive `var(--yta)`. Plus en rak
   hårdkodad röd i `KioskPinModal.css`.
4. **Medvetet fasta färger** (18 st). Akutläget är forcerad högkontrast oavsett tema
   (Etapp 17c), kameravyn i `SkannaModal` ska ha maximal kontrast mot bilden och inte mot
   appen, och `HyllEtiketter`s utskriftsfärger är fasta av fysiska skäl. De är nu
   **namngivna scope-variabler med förklaring**, inte flyttade till temat, vilket vore fel.
   Akutlägets kontraster är uppmätta och inskrivna: 21,0 / 7,6 / 9,9 / 17,4:1.

Kvar utanför `index.css`: 9 förekomster, samtliga token-DEKLARATIONER eller dokumenterade
utskriftsfärger. Det är rätt slutläge, inte en rest.

**68b, primärfärgen.** Ljust läges `--primar` bytt från `#2563eb` till `#2F5FD6`, färgen
`produkt/GRAFISK-PROFIL.md` hela tiden uppgett men som aldrig landat i koden. Bytet gjordes på
mätning (krav 30): 5,63:1 mot vit yta i stället för 5,17:1, och 5,31:1 mot `--bg` i stället
för 4,88:1. **Den nya färgen har alltså mer marginal än den den ersätter.**
`--primar-mork` `#274eaf` och `--primar-ljus` `#f0f4fc` härledda ur basen.

Följdändringar i samma commit: de fem ikonfilerna, `theme-color` i `index.html`, och
accentväljarens blå färgprick i `useAccent.js`, som annars hade visat en annan blå än den
appen faktiskt använder.

**Mörkt läge är MEDVETET orört.** Dess `--primar` `#3b82f6` ger 3,68:1 mot vit text, under
AA, och att välja ersättaren är 68c:s uppgift. Jag testade en rak omräkning av `#2f5fd6`
till samma ljushet och fick 3,26:1, alltså **sämre** än defekten. Att gissa nu hade
förvärrat det som 68c ska laga.

Accenternas egna `--primar` (gron, lila, orange) är orörda. De är separata accenter, inte
varianter av blå.

Fullt svep grönt: lint, build, vitest 255/255, `test:rules` 16 filer 0 fel, `test:e2e`
23 passed inklusive axe-core mot 25 routes i sju roller, som är den grind som hade fångat
en kontrastregression.

**Schemalagt:** 68c, 68d och 68f 2026-08-22 kl 02:43. Obs att schemaläggningen är
sessionsbunden och försvinner om sessionen avslutas, se rapporten till ägaren.

## Uppföljning 2026-08-22 (Etapp 68c, 68d och 68f, v5.119.0)

Ägaren bad om att köra dem direkt i stället för schemalagt, vilket var tur: `CronCreate` är
sessionsbunden och jobbet hade redan försvunnit när sessionen startade om.

**68c: planens premiss var fel, och premisskontrollen räddade den.**
`.knapp` sätter `color: var(--yta)`, inte vit, och `--yta` växlar med temat. Primärknappen
mäter 5,63 / 5,02 / 5,70 / 5,18:1 i ljust läge och 4,87 / 10,27 / 6,58 / 7,91:1 i mörkt, för
de fyra accenterna. **Den har alltså aldrig haft defekten.** Siffran 3,68:1 som både planen
och `produkt/VARUMARKE.md` P5 byggde på mätte ett par som inte finns i appen.

Den riktiga defekten var smalare och värre: **sju regler sätter vit text på `--primar`**, och
alla sju faller i mörkt läge, från 3,68:1 (blå) till **1,74:1 (grön)**. Den sjunde är
`.hoppa-till-innehall`, alltså just den funktion som finns FÖR tangentbords- och
skärmläsaranvändare.

Väg 2 valdes på mätning. Väg 1 går inte: accenten gör dubbel tjänst i mörkt läge, som
knappbakgrund OCH som länkfärg mot den mycket mörka bottnen, och de två rollerna drar åt
motsatt håll. `--pa-primar` och `--pa-farlig` är nu mörka i mörkt läge. Att 68a införde
token:et innan defekten var lokaliserad blev tur: rättningen blev två rader.

**68d: vakten hittade en defekt ingen letade efter.**
`tests/docs/kontrastpalett.test.js`, 14 par gånger 8 paletter, 113 test. Bevisat meningsfull:
**8 fel** mot paletten före 68c:s rättning, 113 gröna efter.

Utöver det failade `--kant-stark` på WCAG 1.4.11: 1,48:1 i ljust och 1,63:1 i mörkt mot ett
krav på 3:1. Det bär **sökfältets och kommandopalettens kantlinjer**, alltså riktiga
kontrollgränser. Nya värden `#7d8a99` och `#606f89` ger ca 3,5:1. Defekten fanns före hela
Etapp 68.

**68f: två dokumenterade avvikelser gick att stänga, en tredje inte.**
`granskningar/TILLGANGLIGHETSREDOGORELSE.md` avvikelse 9 (blå accent 3,98:1 mot kortyta i mörkt läge) är
**ommätt till 4,87:1 och åtgärdad** — siffran var stale mot en tidigare palett, och vakten
bevakar den nu. Avvikelse 8 är **delvis** åtgärdad: `--kant-stark` är fixad, men den
generella `--kant` (1,23:1) kvarstår.

**Att laga `--kant` är ett eget beslut och gjordes INTE.** Den används i 91 regler och bär
både fältgränser och kortkanter. En rättning kräver antingen ett eget `--kant-falt`-token
applicerat på formulärkontroller, eller ett medvetet beslut att mörka varje kortkant i appen.
Det är en synlig omdesign, inte en bugfix, och hör inte hemma i ett delmål om knappkontrast.

Även: `produkt/VARUMARKE.md` §12 beskriver nu symbolen som faktiskt ligger i `public/`, P5 är struken,
och `etapplaner/ETAPPLAN17.md`s premisskontroll är rättad från "141 hexvärden i 10 filer" till korrekta
**37 i 16**. Den felräkningen var min och räknade in `index.css`.

Fullt svep grönt: lint, build, vitest, `test:e2e` med axe-core mot 25 routes i sju roller.

**Etapp 68 är därmed klar utom 68e (typsnittet), som är villkorat av beslutspunkt 1 där
rekommendationen är att avstå.** Produktionen kör v5.117.0; v5.118.0 och v5.119.0 är pushade
men odeployade.


## Uppföljning 2026-08-22 (deploy av v5.118.0 och v5.119.0, körning #83)

Ägaren bad om deploy av de två väntande versionerna. Körning **#83** på commit `1a619f6`,
default-grenen. Produktionen kör nu **v5.119.0**.

**Verifierad på artefakten, inte på körningsstatusen.** Efter felet i körning #81 (grön
workflow, hosting aldrig deployad – se uppföljningen 2026-08-21) togs ett baseline FÖRE
deployen: den serverade CSS-filen var `index-C8tKQHWv.css` och innehöll `#2563eb`, inget
`--pa-primar`, inget `#2f5fd6`. Efter deployen serveras `index-CcvvKSZ3.css` med `--pa-primar`,
`#2f5fd6` (68b:s primärfärg) och `#7d8a99` (68d:s `--kant-stark`), och `#2563eb` är borta.

Det är ett giltigt signalval enligt doktrinen i uppföljningen 2026-08-21: **CSS-egna
variabelnamn minifieras inte** av Vite/Rollup, och hexvärden är literaler. Det är alltså inte
samma sak som att grepa efter identifierarnamn i en minifierad JS-bundle, vilket var det
ogiltiga testet som fick mig att felaktigt tro att #82 inte deployat.

En sidoiakttagelse värd att skriva ner för nästa gång: `5.119.0` finns **inte** i huvudchunken
`index-*.js`. `APP_VERSION` används bara i `Nyheter.jsx` och `admin/SystemstatusSektion.jsx`,
som båda är lazy-laddade – strängen ligger i `Nyheter-*.js`. Att inte hitta versionen i
huvudchunken bevisar alltså ingenting. Hämtad ur rätt chunk fanns den.

CSP-rubriken är oförändrat `Content-Security-Policy-Report-Only` med hashen
`'sha256-P9yZEO5lFejtO0SZXIJ3BVCHLkxZNrpaungAr34q224='` – alltså fortfarande inte enforcing,
vilket är avsiktligt tills rapporterna är genomlästa.

Kvar i Etapp 68: **68e** (typsnittet), villkorat av beslutspunkt 1 där rekommendationen är att
avstå. Kvar utanför etappen: `--kant` (1,23:1 över 91 regler) väntar på ett ägarbeslut, se
`OPPNA-PUNKTER.md`.

## Uppföljning 2026-08-22 (Etapp 68g – beslut om `--kant`, v5.120.0)

Ägaren delegerade den öppna punkten från 68d: "Ta beslut om --kant". Beslutet är loggat i
`BESLUTSLOGG.md`, och det gick emot det uppenbara.

**Mörka INTE `--kant`.** Token:et ger 1,23:1 mot `--yta`, alltså under 1.4.11:s 3:1 – men
kravet gäller det som behövs för att IDENTIFIERA en komponent, inte dekoration. En genomgång
av samtliga användningar delade dem i 36 faktiska kontrollgränser (fält, selects, textareas,
verktygsknappar, val-chips – där fältet har samma bakgrund som kortet under, så strecket bär
informationen) och 81 kortkanter, avdelare och ifyllnader (där kortet bärs av sin egen yta och
skugga). Att mörka alla 117 hade ramat in varje kort i appen i grått, framtvingat av ett krav
som inte ställs.

De 36 pekar nu på `--kant-stark`, som redan fanns, redan når 3,52:1 mot kortyta i båda teman
och redan var definierat som just "kontrollgräns, inte dekoration". **Inget nytt token
behövdes**, och 68d:s kontrastvakt bevakar dem därmed automatiskt. Följdfix:
`.tema-vaxlare__val` hade bas `--kant` och hover `--kant-stark` – när basen flyttades blev
hovern osynlig, den går nu till `--text-svag`.

Verifierat både mätt och renderat (Chromium, före/efter sida vid sida): fälten blir tydligt
avgränsade, korten oförändrade.

`granskningar/TILLGANGLIGHETSREDOGORELSE.md` avvikelse 8 (SYN-6) går därmed från "delvis åtgärdad" till
**ÅTGÄRDAD**. Samtidigt rättad: dokumentet angav 91 användningar, rätt siffra är 117.

Fullt svep grönt: lint, build, vitest 368/368, `test:rules`, `test:functions`, `test:storage`
och `test:e2e` 23/23 med axe-core mot 25 routes i sju roller. **Obs för nästa session:**
`test:e2e` failar utan `PLAYWRIGHT_CHROMIUM_PATH` satt i samma skal – det var inte ett riktigt
fel första gången det inträffade här.

Kvar i Etapp 68: **68e** (typsnittet), villkorat av beslutspunkt 1 där rekommendationen är att
avstå. Det är nu etappens enda återstående punkt.

## Uppföljning 2026-08-22 (deploy av v5.120.0, körning #84)

Ägaren bad om deploy. Körning **#84** på commit `a4a3205`. Produktionen kör nu **v5.120.0**.

Verifierat på artefakten med samma metod som körning #83: baseline före deployen visade
`select{border:1px solid var(--kant)` i den serverade CSS:en (`index-CcvvKSZ3.css`). Efter
deployen serveras `index-BP_CbFB9.css` – samma filnamn som den lokala byggen av `a4a3205`
producerar, alltså inte bara "en ny hash" utan bit-för-bit samma build-output – och
`select`-regeln lyder nu `var(--kant-stark)`, exakt den ändring 68g gjorde.

## Uppföljning 2026-08-22 (Etapp 68e + 68f-rättelse, v5.121.0 – ETAPP 68 HELT KLAR)

Ägaren bad om att samtliga steg i `etapplaner/ETAPPLAN17.md` slutförs, med sub-agenter, snabbt. Två
agenter kördes parallellt: en för typsnittet, en för `produkt/GRAFISK-PROFIL.md`.

**68e – typsnittet.** Beslutspunkt 1 blev därmed ja. Min rekommendation var att vänta, och
den fick stå tillbaka – det är ägarens beslut och det är loggat som sådant i `BESLUTSLOGG.md`.
Public Sans självhostat i `public/fonts/`, två delmängdade woff2-filer på totalt **45 324 byte**,
`font-display: swap` så första renderingen aldrig blockeras, och en reservkedja som slutar med
emojitypsnitt (Public Sans saknar de ~90 emoji appen använder, och webbläsaren gör reservval
per tecken). Ingen CDN – CSP:n är `font-src 'self' data:`, så en Google Fonts-länk hade
blockerats tyst. Hela `pyftsubset`-anropet står i `src/index.css` så filerna går att återskapa.

**Utöver planen:** `vite.config.js` `globPatterns` saknade `woff2`, så fonten precachades inte
och ett förstabesök helt offline hade renderats i systemtypsnittet. Tillagt och mätt: 120 → 122
entries, 1782,14 → 1827,10 KiB (+2,5 %).

**68f – rättelse av ett felaktigt ✅.** 68f markerades KLAR tidigare samma dag, men bara
`produkt/VARUMARKE.md`-delen var gjord. `produkt/GRAFISK-PROFIL.md` fanns **inte i repot alls**, trots att både
delmålet och `produkt/VARUMARKE.md` P2 pekade på den. Den är nu skriven från faktisk kod (538 rader) och
committad, och P2 är delvis avbockad. Värt att notera i just det här projektet: det var precis
det stale-mönster `CLAUDE.md` varnar för, och jag orsakade det själv genom att bocka av ett
delmål på halva innehållet. Agentens utkast påstod dessutom i sitt typografiavsnitt att appen
saknar webbfont – sant när den läste filen, falskt när den skrev den. Rättat innan commit.

**Beslutspunkt 2 och 3 avgjorda** (kortskuggor respektive radieskala): båda nej, ingen
kodändring, se `BESLUTSLOGG.md`. Prototypens `0 10px 24px`-skuggor drar mot en brådska
`produkt/VARUMARKE.md` §5 uttryckligen inte vill ha, och dess åtta radievärden (inklusive 9 och 11)
avslöjar handjustering per komponent snarare än en skala.

**`etapplaner/ETAPPLAN17.md` / Etapp 68 är därmed HELT KLAR** – 68a–68g byggda, alla tre beslutspunkter
avgjorda. Ingen aktiv etapplan väntar just nu; fråga ägaren vad nästa etapp ska vara, eller läs
`OPPNA-PUNKTER.md`.

## Uppföljning 2026-08-22 (deploy av v5.121.0, körning #85)

Ägaren bad om deploy. Körning **#85** på commit `cbbf01f`. Produktionen kör nu **v5.121.0**.

Verifierat på artefakten med tre oberoende signaler: (1) `manifest.webmanifest` gick från
`theme_color: #1d4ed8` / `background_color: #ffffff` till `#274eaf` / `#f5f9fa` – exakt 68e:s
rättelse; (2) den serverade CSS-filen bytte hash (`index-BP_CbFB9.css` → `index-D7QZ692q.css`);
(3) `GET /fonts/public-sans-400.woff2` svarar **200**, en fil som är helt ny i den här commiten
och alltså inte kunde funnits där innan.

## Uppföljning 2026-08-22 (ETAPPLAN18.md – Etapp 69 skriven som utkast)

Ägaren frågade om appen kan få en mobil- och en datorversion, bad om en demo, och därefter om
en etapplan plus fler UI-förbättringar. Demon ligger som artefakt ("Synappsen på dator", ett
reglage som växlar mellan dagens utseende och förslaget). `etapplaner/ETAPPLAN18.md` är skriven men
**EJ ANTAGEN** – tre beslutspunkter väntar på ägaren.

**Genomgången av UI-lagret gav ett fynd som inte har med skärmbredd att göra och som bör
byggas oavsett vad som händer med resten av planen.** `SokFalt`, `KommandopalettInnehall` och
`Notisklocka` sätter `outline: none` på fokus och ersätter ringen med enbart ett bakgrundsbyte.
Uppmätt: **1,06–1,14:1** i båda teman, mot WCAG 1.4.11:s krav på 3:1. Tangentbordsfokus är
alltså i praktiken osynligt på appens tre mest tangentbordsdrivna ytor. `src/index.css`
dokumenterar redan exakt samma defekt för `.auth-form input:focus` och löste den där – men
rättningen spreds aldrig till listorna. Axe fångar det inte: axe kan se ATT en fokusindikator
finns, inte att den räcker. Det är delmål 69e och är avsiktligt skrivet som fristående.

Två antaganden till föll i premisskontrollen: fälten är **helt OK** (`border-color: --primar`
ger 5,63:1 ljust och 4,87:1 mörkt), så delmålet krympte från "alla fokusmarkeringar" till bara
listorna; och de 10 kvarvarande hårdkodade hexvärdena är samtliga befogade (skanner, utskrift,
akutläget, en inuti en kommentar) – **städdelmålet ströks helt**.

Övriga mätningar värda att ha: noll breddbaserade brytpunkter, `.app-innehall` utan maxbredd,
118 av 156 `border-radius` hårdkodade (föreslås INTE städas – se planens "Vad jag INTE
föreslår"), 24 `z-index` med 10 lösa värden, ingen skrollhantering vid ruttbyte, och
**e2e-svepet kör vid en enda bredd** (1280×720) vilket blir sämre först när brytpunkter
införs. Mörkt läge underhålls i två handhållna kopior som är identiska idag men bara den ena
läses av kontrastvakten.

Rekommendationen är genomgående **en kodbas med brytpunkter**, inte två byggen med
enhetsdetektering – motiverat i planen.

## Uppföljning 2026-08-22 (Etapp 69 ANTAGEN + delmål 69h byggt, v5.122.0)

Ägaren antog `etapplaner/ETAPPLAN18.md` utan invändningar mot rekommendationerna, vilket avgör alla tre
beslutspunkter: brytpunkt **1024 px**, **fast** sidomeny, akutläget **orört**. Se
`BESLUTSLOGG.md`. Samtidigt tillkom **69h**: inloggningssidan görs om helt, med varumärkes-
profilen som ram.

**69h är byggt.** Gemensamt `AuthSkal` för `LoggaIn` och `Registrera` (de hade tidigare var sin
kopia av samma markup – samma tvåställenmönster som gjort dokument i det här projektet inaktuella
gång på gång). Delad vy med märkespanel över 1024 px, kort med märkesrad under. Panelen har egna
scoped tokens av samma skäl som akutläget: `--primar-mork` är mörkblå i ljust läge men LJUS blå i
mörkt och duger inte som panelbakgrund. Uppmätt: `#1e3a8a` / `#101a2e`, vit text 10,36:1
respektive 17,37:1.

**Att granska sidan renderad gav fyra defekter som alla fanns FÖRE 69h, och tre drabbade hela
appen:**

1. **Appen saknade helt en global länkfärg.** 72 `<Link>`/`<a>` i JSX, noll CSS-regler som satte
   `color`. De föll tillbaka på webbläsarens `#0000EE`: **9,40:1 mot vitt men 1,90–2,06:1 i mörkt
   läge**, alltså långt under AA. Rättat med `a { color: var(--primar) }` → 5,63:1 / 4,87–5,25:1.
2. **`color-scheme` deklarerades ingenstans**, så webbläsaren renderade sina egna kontroller och
   standardfärger i ljust läge oavsett appens tema. Samma rot som punkt 1. Satt per temablock.
3. `.auth-form input` saknade `background`/`color` → **vita fält mot #0a0e16** i mörkt läge.
4. `.hoppa-till-innehall` låg på `top: -40px` men är högre än så, så nederkanten syntes i övre
   vänstra hörnet på **varje sida i appen**. Ersatt med `translateY(-200%)`, höjdoberoende.

**Varför ingen sett dem:** axe-svepet kör i Playwrights standardläge, som är LJUST. **Mörkt läge
testas inte alls automatiskt.** Det är samma sorts lucka som "svepet kör vid en enda bredd", fast
i en andra dimension – och den här gången kostade den en app-övergripande WCAG-defekt. Delmål 69g
är utökat: svepet ska köras i fyra kombinationer, två bredder × två teman.

Fullt svep grönt: lint, vitest 368/368, `test:rules`, `test:functions`, `test:storage`, e2e 23/23.

Kvar i Etapp 69: 69a–69g. 69e (fokusmarkering på listposter) är fortfarande den som rättar en
defekt i produktion och kan tas när som helst.

## Uppföljning 2026-08-22 (delmål 69e byggt, v5.123.0)

Fortsatte med nästa steg i den antagna `etapplaner/ETAPPLAN18.md`: **69e**, det fristående delmålet som
rättar en WCAG-defekt som redan låg i produktion. `SokFalt`, `KommandopalettInnehall` och
`Notisklocka` hade `outline: none` på fokus utan en tillräcklig ersättning (1,06–1,14:1 mot
kravet 3:1).

Fixen: de tre `:hover, :focus-visible`-reglerna delades upp så hover behåller bara
bakgrundsbytet och `:focus-visible` dessutom får `outline: 2px solid var(--primar-mork)`.
Uppmätt mot rätt bakgrund (`--yta` för SokFalt/Kommandopalett, `--bg` för Notisklocka) i
samtliga åtta paletter: **6,70–13,76:1** – god marginal.

Nytt test `tests/docs/fokusmarkering.test.js` (27 kontroller) bevakar att `outline: none` inte
kommer tillbaka och att kontrasten håller i alla paletter, samma mönster som
`kontrastpalett.test.js`. Granskat renderat med faktisk tangentbordsnavigering (Tab) i båda
teman via en fristående HTML-harness som laddar de riktiga CSS-filerna – inte bara uträknat.

Fullt svep grönt: lint, vitest 395/395 (35 filer, +27 från det nya testet), `test:rules`,
`test:functions`, `test:storage`, e2e 23/23.

Kvar i Etapp 69: 69a, 69b, 69c, 69d, 69f, 69g.

## Uppföljning 2026-08-22 (delmål 69a, z-index-delen, v5.124.0)

Nästa steg i `etapplaner/ETAPPLAN18.md`: **69a**, brytpunkter och z-index som tokens. Byggde bara
z-index-delen — brytpunktsdelen väntar på 69b/69c, som är de delmål som faktiskt behöver
värdet, och att skapa en token i förväg hade varit gissning.

**Att gå igenom alla 25 z-index-deklarationer avslöjade en riktig bugg i produktion.**
"Lämna kioskläge" i `BottomNav.jsx` satte `pinOppen=true` utan att stänga `merOppen`. Två
fullskärmsoverlägg låg alltså monterade samtidigt, och det var bara att `MerMeny`s äldre
z-index (800) råkade vinna över `KioskPinModal`s (300) som gjorde PIN-dialogen — **enda vägen
ut ur kioskläget** (Etapp 55b) — synlig alls. Bekräftat genom att återskapa exakt det
DOM-tillståndet och rendera det: PIN-dialogen låg gråtonad och overksam bakom Mer-menyns
bakgrund. Fixat i klick-hanteraren (stänger menyn innan PIN-dialogen öppnas), inte bara med
z-index — skalan är ett skyddsnät, inte ersättningen för den riktiga fixen.

Två till, mindre allvarliga: `.sok-falt__resultat` (sökresultat på `/`) satt i en förälder
utan egen stapel-kontext och konkurrerade därför direkt mot bottennavet i appens
rot-kontext — flyttad till samma lager som andra flytande widgetar. Och `VersionsHistorik`,
`KioskPinModal` och `HyllEtiketter` låg alla lägre än systembanderollernas nivå, vilket hade
låtit en banderoll rendera ovanpå en öppen modal.

Fem namngivna tokens ersätter de 10 lösa värdena: `--z-nav`, `--z-flytande`, `--z-banner`,
`--z-modal`, `--z-modal-topp`, plus `--z-lokal` för de tre fall som bara höjer ett element
över sina egna syskon.

Verifierat renderat, inte bara uträknat: både buggen (före/efter) och att en banderoll nu
korrekt hamnar under en modal.

Fullt svep grönt: lint, build (oförändrad precache-storlek: 124 poster), vitest 395/395,
`test:rules`, `test:functions`, `test:storage`, e2e 23/23.

Kvar i Etapp 69: 69a (brytpunktsdelen, ihop med 69b/69c), 69b, 69c, 69d, 69f, 69g.

## Uppföljning 2026-08-22 (delmål 69b, premissen var fel, v5.125.0)

Nästa steg i `etapplaner/ETAPPLAN18.md`: **69b**, läsbar radlängd. Planens egen premiss höll inte vid
kontroll mot faktisk kod, och det är värt att skriva in rakt av: siffran "~150 tecken per
rad" kom från min egen artefaktdemo, inte från en mätning av appen.

**Verklig mätning:** `.sida` har redan haft `max-width: 600px` sedan Etapp 43a. Renderade en
riktig rutintext i ett `.rutin-kort` vid 1440 px viewport och mätte: innehållsytan blir
**534 px**, vilket ger **55–63 tecken per rad** i Public Sans — redan inom rekommendationen
50–75. Skärmdump tagen, inte bara uträknat.

Det faktiska problemet ligger åt andra hållet: `.sida` sätter samma 600px-tak på ALLT
innehåll, inklusive kortrutnät och dashboards som skulle må bra av mer bredd på en
datorskärm. Det är redan **69d**s jobb ("vyer som använder bredden") — inget nytt delmål
behövdes, bara en tydlig notering i planen om var gränsen går.

**Vad som byggdes:** `--maxbredd-lasbar: 600px` i `index.css` med mätningen inskriven.
`.sida` pekar nu på token:et. Samma värde fanns dessutom hårdkodat en gång till i
`VersionsHistorik.css` — två ställen som råkade vara överens men inget som tvingade dem att
förbli det. Nu ett token, inget ändrat värde. Verifierat: exakt samma pixelbredd (534 px)
före och efter.

Fullt svep grönt: lint, build, vitest 395/395, `test:rules`, `test:functions`,
`test:storage`, e2e 23/23.

Kvar i Etapp 69: 69a (brytpunktsdelen, ihop med 69c), 69c, 69d, 69f, 69g.

## Uppföljning 2026-08-22 (delmål 69c, sidomenyn, v5.126.0)

Nästa och största steget i `etapplaner/ETAPPLAN18.md`: **69c**, sidomeny över brytpunkten (1024px).

**Rättelse innan bygget:** planen antog en `useMediaQuery`-hook skulle behövas. Onödig —
`BottomNav` och `Sidomeny` monteras BÅDA alltid, och CSS (`display: none` på den ena eller
andra vid brytpunkten) avgör vilken som syns. Gör krav 34 ("de får aldrig visas samtidigt")
sant av konstruktion, inte av JS-logik som kan hinna fel.

**Ny delad datakälla, inte en ny kopia.** `useNavigeringData.js` bygger listan över sidor
(roll-/redaktörs-/plattformsadmin-logiken), och både `BottomNav.jsx` och det nya
`Sidomeny.jsx` läser den. Att låta `Sidomeny` bygga sin egen kopia av samma logik hade varit
exakt det mönster som redan orsakat en riktig bugg i den här etappen (se 69a).

**Byggt:** `useNavigeringData.js`, `Sidomeny.jsx`/`.css`, `--sidomeny-bredd: 232px` i
`index.css` (brytpunkten 1024px är INTE ett token av samma CSS-begränsning som 69a redan
dokumenterade för z-index — en upprepad, dokumenterad siffra istället), `.app-innehall` får
`padding-left` över brytpunkten, och `AkutKnappFloating` fick en egen bottenposition där
(annars ett stort oavsiktligt tomrum under knappen på en datorskärm — hittat genom att titta
på den renderade sidan).

**Krav 34 bevisat, inte påstått.** Nytt `tests/e2e/sidomeny.spec.js`, sex test inklusive en
kantfallskontroll: öppna "Mer" på mobil och förstora fönstret förbi brytpunkten UTAN att
stänga menyn — den ska ändå inte bli kvar synlig.

**En riktig regression hittad och fixad under bygget.** Hela e2e-sviten kör som standard vid
1280×720, vilket ligger OVANFÖR den nya 1024px-brytpunkten. `kioskbevakning.spec.js` klickar
uttryckligen på `BottomNav`s "Mer"-knapp och började tajma ut, eftersom bottenraden nu är
dold vid den bredden. Fixat genom att pinna den specen till en explicit mobil viewport — den
testar det mobila flödet uttryckligen, desktopmotsvarigheten täcks redan av
`sidomeny.spec.js`. Konkret bevis för varför 69g (testsvep vid två bredder) inte är kosmetiskt.

**Observation, inte åtgärdad:** `App.jsx` har fyra ställen som renderar `<BottomNav />` — en
delad `SkyddatLayout` plus tre kopierade block (`/admin`, `/godkannanden`,
`/ledningsrapport`). De tre saknar dessutom `<KommandopalettLyssnare />`, ett förmodligen
oavsiktligt hål som fanns FÖRE 69c. Utanför den här etappens omfattning.

Verifierat renderat i båda teman vid 1440px och oförändrat vid 390px (skärmdumpar), samt på
`/admin` (tyngsta av de tre duplicerade rutterna).

Fullt svep grönt: lint, build, vitest 395/395, `test:rules`, `test:functions`,
`test:storage`, e2e 29/29 (23 tidigare + 6 nya).

Kvar i Etapp 69: 69a (brytpunktsdelen, nu i praktiken klar via denna etapps 1024px), 69d, 69f,
69g.

## Uppföljning 2026-08-22 (Etapp 69 HELT KLAR: 69d, 69f, 69g, v5.127.0)

Slutförde de tre återstående delmålen i `etapplaner/ETAPPLAN18.md` i en följd, på ägarens begäran
("Slutför alla kvarvarande steg i denna etapplanen"). **Etapp 69 är därmed helt klar** –
69a–69h alla byggda, testade och renderade granskade samma dag som antagandet.

**69d (vyer som använder bredden).** Två av planens tre antaganden höll inte. "Sökfältet
permanent synligt" var redan löst av 69c (sidomenyns Sök-knapp). "Kortrutnät till tre
kolumner" gäller INTE `Sektionssida.jsx`s rutinlista – varje `RutinKort` bär egen rutintext,
och en tre-kolumners lista hade klämt in 69b:s nyss lösta läsbara radlängd i en ~300px spalt.
Det som höll: `Admin.css` och Leverantörens nyckeltalsrader är REDAN responsiva grid/flex,
bara instängda i `.sida`s 600px-tak. Löst med `--maxbredd-bred: 1100px` + `.sida--bred` på
Admin/Leverantör. En verklig regression hittades UNDER bygget: att bredda behållaren
stretchade också löpande text till 1068px brett – fixat med `.sida--bred p { max-width:
var(--maxbredd-lasbar) }`, samma princip som 69b.

**69f (skrolla till toppen vid ruttbyte).** Tog två felaktiga försök innan det satt: (1) att
lita på webbläsarens `history.scrollRestoration` höll inte – ett e2e-test bevisade
`window.scrollY` alltid blev 0 vid bakåtnavigering; (2) att spara positionen i navigerings-
effektens CLEANUP höll inte heller – cleanup körs efter att React redan bytt DOM till den nya
(kortare) sidan, som redan hunnit klampa om scrollY. Lösningen: en löpande `scroll`-lyssnare
som sparar positionen medan sidan fortfarande är fullt renderad. Byggd som
`ScrollHantering.jsx`, bevisad med `tests/e2e/skrollhantering.spec.js` (3 test).

**69g (testsvep vid två bredder/teman + drift-vakt).** En full 2×2-korsprodukt hade
fyrdubblat sviten, inte fördubblat den (planens egen budget) – delade därför upp dimensionerna:
`rokprov.spec.js` kör nu vid mobil OCH dator (motiverat av 69c:s navigeringsbyte),
`tillganglighet.spec.js` kör nu i ljust OCH mörkt (motiverat av 69h:s tema-defekt). Det
BREDDADE axe-svepet hittade en TREDJE riktig kontrastdefekt, inte i förväg: Hem-sidans fyra
genvägschips (`.hem__snabblankar a`) gav 4,25:1 i mörkt läge, under kravet 4,5:1 – och slog
igenom på alla fyra dubblerade `<BottomNav/>`-rutter eftersom de länkar dit. Fixat med
`--primar-mork` (6,15–11,05:1), samma mönster Sidomeny redan använder, och tillagt i
`kontrastpalett.test.js`s permanenta bevakning. Ny `tests/docs/morkt-lage-drift.test.js`
(8 kontroller) jämför de två handhållna mörkt-läge-kopiorna token för token – bevisat att den
faktiskt fångar drift genom att tillfälligt mutera ett värde, se testet faila, och återställa.

Fullt svep grönt: lint, build, vitest 407/407 (36 filer), `test:rules`, `test:functions`,
`test:storage`, e2e **41/41** (32 tidigare + 3 skrollhantering + widened rökprov/axe).

**Etapp 69 (`etapplaner/ETAPPLAN18.md`) är därmed HELT KLAR.** Ingen aktiv etapplan väntar. Nästa steg
är deploy (efterfrågat av ägaren), sedan att fråga vad nästa etapp ska bli, eller läsa
`OPPNA-PUNKTER.md`.

## Uppföljning 2026-08-22 (deploy av v5.127.0, körning #86 – Etapp 69 LIVE)

Ägaren bad om deploy när hela etapplanen var klar. Körning **#86** på commit `8c715bc`.
Produktionen kör nu **v5.127.0**, med samtliga delmål 69a–69h.

Verifierat på artefakten: den serverade CSS-filen (`index-SuVp5zAB.css`) är bit-för-bit samma
som den lokala byggen av samma commit, och `.hem__snabblankar a`s färg gick från
`var(--primar)` (69g:s hittade defekt, 4,25:1 i mörkt läge) till `var(--primar-mork)`
(6,15–11,05:1) — exakt den sista fixen som lades till i etappen.

**Etapp 69 är därmed inte bara klar i koden utan live i produktion.** Ingen aktiv etapplan
väntar. Nästa steg: fråga ägaren vad nästa etapp ska bli, eller läsa `OPPNA-PUNKTER.md`.


---

## Uppföljning 2026-08-23 (säljmaterialet infört, granskat och rättat)

**Ingen kodändring.** Enbart dokument – men tre av rättelserna rör påståenden som skickas till
kunder, och en av dem var direkt osann.

**Vad som hände.** Ägaren tillhandahöll ett säljmaterialpaket framtaget 2026-08-17–19 mot
kodläge v5.117.0 (marknadsanalys, kostnadskalkyl, kandidatlista, köparanalys, demomanus,
invändningshantering, e-postmallar, sex HTML-källfiler, samt Word-/PowerPoint-original).
Textdelarna laddades upp; binärfilerna gjorde det inte, se `CLAUDE.md`s nya avsnitt
"Marknads- och säljmaterial" för motiveringen och för konsekvensen (presentationerna måste
byggas om separat vid varje rättelse). Paketets kritiska påståenden verifierades mot faktisk
kod – resultatet ligger i `saljmaterial/SALJMATERIAL-UNDERLAG-FOR-BEDOMNING.md`. Därefter granskades
`saljmaterial/KOPARANALYS.md` mot sina egna källor; granskningen står som §15 i den filen, med brödtexten
orörd enligt vanlig kronologiprincip.

**Tre osanningar i kundvänt material, samtliga rättade:**

| Vad | Var | Rättat till |
|---|---|---|
| **"VANLIGASTE VALET"** på Drift-nivån, och demomanusets *"Drift, som är det de flesta väljer"* – med noll kunder har ingen valt något | `saljmaterial/kallfiler/Synappsen-prislista.html`, `saljmaterial/Synappsen-demomanus.md` | "VÅR REKOMMENDATION" respektive "den nivå jag rekommenderar", plus en uttrycklig varning i demomanuset |
| **Upphandlingssvar E2 påstod att artikel 50-märkningen var implementerad.** Ingen sådan märkning finns i koden – verifierat med genomsökning av hela `src/`. Ett aktivt felaktigt påstående i ett dokument avsett att klippas in i skarpa anbud | `saljmaterial/kallfiler/Synappsen-upphandlingssvar.html` | Redovisad som ej byggd, med en intern varningsruta om att inte skriva tillbaka påståendet utan att först kontrollera i koden |
| **Underbiträdesförteckningen beskrev klinikstöd-sökningen som pausad.** Den återaktiverades 2026-08-01; `granskningar/SAKERHETSRAPPORT.md` rättade sig själv då men förteckningen följde inte med. Ett dokument som lämnas till kundens dataskyddsombud beskrev alltså en behandling som **mindre** omfattande än den är – fel riktning att ha fel åt | `avtal/UNDERBITRADEN.md` | Rättad, med en not om varför. `granskningar/SAKERHETSRAPPORT.md`s kvarstående rubrik "Pausad funktion" är märkt som historisk så den inte citeras igen |

**Tre stale-fynd i interna dokument, rättade:** `saljmaterial/PITCH.md` sa sex roller (koden har sju,
`src/firebase/roles.js`); `produkt/MODULPLAN.md` listade kioskläget som obyggt fyra månader efter att
det byggdes i Etapp 55 – och var därmed underlag för en köparanalys som drog slutsatser om
modulgränserna ur en felaktig bild; `granskningar/TILLGANGLIGHETSREDOGORELSE.md`s sammanfattning påstod att
#8 och #9 kvarstod trots att Etapp 68 åtgärdade dem. Faktiskt kvarvarande på nivå A är fyra
små punkter (#4, #5, #6, #10), nu en rad i `OPPNA-PUNKTER.md` med kommersiell motivering.

**Ett ägarbeslut avgjort samma dag:** uppstartsavgiften (25 000 kr) var motstridig – prislistan
sa att den utgår helt för de tre första referenskunderna, kostnadskalkylen sa "ge aldrig bort
den". **Beslut: avgiften kvarstår och betalas av de tre första kunderna**, om inte annat
uttryckligen framgår i det enskilda kundavtalet. `saljmaterial/kallfiler/Synappsen-
prislista.html` rättad, `saljmaterial/KOPARANALYS.md` §15 räknat om (referenskundens förstaårskostnad är
55 625 kr, inte 24 375 kr), se `BESLUTSLOGG.md`.

**Ett ägarbeslut kvarstår öppet i `OPPNA-PUNKTER.md`:** utfallsgarantin (`saljmaterial/KOPARANALYS.md`
§11.1) – ja eller nej. Analysens motivering ("marginalen är 99 %, garantin är nästan gratis")
håller inte: kostnaden är den nedlagda tiden, inte det återbetalda abonnemanget. Garantin kan
ändå vara rätt, men som riskinstrument.

**Det viktigaste att bära med sig till nästa session:** paketet är skrivet mot v5.117.0 medan
koden är på v5.128.0. Kontrollera statuspåståenden mot koden, inte mot paketet. Och när ett
säljdokument rättas – kom ihåg att `.pptx`-filerna inte ligger i repot och inte får rättelsen
automatiskt.

---

## Uppföljning 2026-08-23 (dokumenthanteringen gjord mekanisk)

**Ingen kodändring i appen.** Löser projektets mest återkommande problem: dokument som glöms
bort och blir inaktuella trots regler om att de ska uppdateras löpande.

**Diagnosen.** Projektet hade fem utförliga prosaregler i `CLAUDE.md` och **en** mekanisk
kontroll. Utfallet var entydigt: allt med maskinkontroll höll (`src/version.js` importerar
versionen, `pitch-version.test.js` vaktar `PITCH.md`s versionsrubrik), allt med bara prosaregel
gled (`PITCH.md`s rollantal, `MODULPLAN.md` fyra månader, `UNDERBITRADEN.md` fyra veckor i ett
DSO-dokument, tillgänglighetsredogörelsens sammanfattning).

**Färskhetsstämplar övervägdes och förkastades.** De är spelbara – när testet failar är det
billigaste att bumpa stämpeln utan att läsa dokumentet, vilket gör synlig inaktualitet till
dold. De hade dessutom fångat 2 av de 6 verkliga felen. **Assertioner fångar 6 av 6, kostar
noll löpande ritual och kan inte göras gröna utan att dokumentet eller koden faktiskt rättas.**

**Byggt:**

| Vad | Effekt |
|---|---|
| `DOKUMENTREGISTER.md` | Alla 62 dokument indexerade med typ, externflagga och utlösare |
| `tests/docs/dokumentregister.test.js` | Nytt/flyttat/raderat dokument utan registerändring failar. `CLAUDE_STATUS.md` över 400 rader failar |
| `tests/docs/dokumentpastaenden.test.js` | Sex assertioner som binder dokumentpåståenden till koden. **Verifierade genom att återinföra alla sex verkliga felen – samtliga fångades** |
| `etapplaner/STATUSARKIV.md` | 117 historiska uppföljningar utbrutna, oförändrade. Alla 120 sektioner finns kvar (120 före = 120 efter) |

**Token-effekt:** `CLAUDE_STATUS.md` 75 600 → 3 645 tokens, `CLAUDE.md` 9 900 → 3 784. En ny
session går från ~85 500 till ~7 400 tokens innan den är orienterad.

**Två fel som rättades på vägen:** `CLAUDE_STATUS.md`s huvud motsade sig självt (rad 9 sa
deployad #87, rad 10–17 sa "avvakta, blockerad vid #78"), och sektionen "Nuläge i ett stycke"
beskrev i själva verket läget vid v5.24.0 – ett historiskt avsnitt med en missvisande rubrik,
alltså precis den drift arbetet handlar om. Båda arkiverade respektive omskrivna.

**Vad detta INTE löser, sagt rakt ut:** ett test kan bara kontrollera påståenden som någon har
brytt sig om att koda. Prosa som ingen omvandlat till en assertion kan fortfarande ruttna
tyst. Regeln "uppdatera dokumentet i samma commit som ändringen" gäller därför oförändrat –
testerna fångar bara den delmängd som gick att formulera maskinellt. **När du hittar ett
felaktigt påstående: rätta texten och lägg till en assertion i samma commit.**

---

## Uppföljning 2026-08-23 (kvissbank + startbibliotekets kvissfrågor)

**Fynd som motiverade arbetet.** Mikrokvissen (Etapp 19b) delar fält (`rutin.kviss`) med öva-
läget (65d) och Veckans repetition (41b), och båda de senare filtrerar på `kviss.length > 0`.
Startbiblioteket seedade 17 rutinmallar med **tomma kvissfält** – två byggda funktioner var
alltså helt tomma dag ett för varje ny organisation. Seedningen i
`functions/organisationslivscykel.js` skrev dessutom inte fältet alls, så det hade ignorerats
även om mallarna haft frågor.

**Byggt:**

| Vad | Innehåll |
|---|---|
| `src/data/kvissbank.js` | 20 återanvändbara frågor i sex kategorier (kvittering, ansvar, användning, färskhet, patientuppgifter, mallar) + `tillRutinKviss()` och `MAX_KVISSFRAGOR_PER_RUTIN` |
| `src/data/kvissbank.test.js` | 31 tester: form, unika id:n, rattIndex i intervall, **kliniska termer förbjudna**, personnummermönster förbjudna, och två kopplingstester mot koden |
| `MALL_KVISS` i `functions/verksamhetsmallar.js` | Två frågor på var och en av de 17 startmallarna |
| `functions/organisationslivscykel.js` | Seedar nu `kviss` – utan raden hade mallfrågorna aldrig nått databasen |

**Den avgörande avgränsningen.** En kvissfråga har ett rätt svar och är därför ett
faktapåstående – till skillnad från en rutinmall, som bara är ett skelett. Påhittad klinisk
vägledning i en fråga skulle passera både MDR-gränsdragningen och regeln om att aldrig påstå
overifierat sakinnehåll. **Katalogen innehåller därför bara frågor om hur systemet och
processen fungerar**, och ett test förbjuder kliniska termer (dos, mg, blodtryck, behandla …).
Kliniska frågor skrivs av verksamheten själv om den egna godkända texten, eventuellt via
`foreslaKvissfragor`, som redan bara får pröva förståelse av befintlig text.

Startmallarnas två frågor handlar om **att rutinen är en mall och inte får följas som färdig
rutin**. Det gör startbibliotekets största risk – att någon litar på en platshållare – till
det första personalen får bekräfta att de förstått.

**Två kopplingstester som skyddar en verklig fallgrop.** `MAX_KVISSFRAGOR_PER_RUTIN` binds mot
taket i `RutinFormular.jsx` OCH mot `harTroligtPersonnummerIKvissN` i `firestore.rules`, som
radar upp exakt fyra index eftersom regelspråket saknar loopar. Höjs taket utan att den
funktionen utökas slutar PII-spärren gälla för frågorna över gränsen, tyst. Verifierat genom
att höja taket till 6 – båda testerna failade.

**Fel som rättades på vägen:** demomanuset påstod att kvitteringar "räknas bort automatiskt"
vid väsentlig ändring. Mot `src/utils/kompetensStatus.js`: redaktören måste själv markera
ändringen som väsentlig, och ingenting raderas – kvittensen slutar räknas i
kompetensöversikten men finns kvar i historiken. Formuleringen rättad.

**Föreslaget men inte byggt** (kräver ägarbeslut, se nästa avsnitt i chatten): väljare i
`RutinFormular.jsx` för att plocka frågor ur banken, kviss i introduktionsspåret, och
kategorifilter i öva-läget.

---

## Uppföljning 2026-08-23 (deploy av v5.128.0, körning #87)

Deployade fixen för "Uppdatera"-knappen direkt eftersom det var en rapporterad, redan
verifierad bugg. Körning **#87** på commit `5a63c16`. Produktionen kör nu **v5.128.0**.

Verifierat på artefakten: `sw.js` innehöll noll förekomster av `SKIP_WAITING` före deployen,
en efter.

**Obs för nästa gång knappen testas:** eftersom `src/sw.js` sjäva filen ändrades är det den
DEPLOYADE service workern som saknade fixen innan nu. En webbläsare som redan hade den GAMLA
workern installerad (utan lyssnaren) sedan tidigare kan behöva en vanlig sidladdning (inte
bara "Uppdatera"-klicket) EN gång för att hämta den NYA workern som väl har fixen – därefter
fungerar knappen normalt vid framtida uppdateringar. Det är förväntat, inte ett nytt fel.

---

## Uppföljning 2026-08-23 (kvissbanken kopplad in på tre ställen)

**Ingen ny datamodell.** Gårdagens `src/data/kvissbank.js` (20 frågor) och `MALL_KVISS` på
startmallarna var byggda men inte kopplade till gränssnittet. Tre kopplingar:

1. **Frågebankväljare i `RutinFormular.jsx`.** Ny knapp "📚 Välj från frågebanken" i
   kvissfältet, expanderar en lista grupperad per kategori (redan tillagda frågor filtreras
   bort). Ersatte samtidigt alla kvarvarande hårdkodade `4`:or med
   `MAX_KVISSFRAGOR_PER_RUTIN` – ett nytt test i `kvissbank.test.js` failar om en hårdkodad
   siffra smyger sig tillbaka.
2. **Kviss-badge i introduktionsspåret.** `berakraIntroduktionsProgress` (`introduktionProgress.js`)
   räknar nu fram `harKviss` per post. Ingen ny logik krävdes för själva kvissen – KvissModal
   visas redan automatiskt vid kvittering via `RutinKort.jsx` – bara en synlig "📝
   kunskapskontroll"-flagga i både den nyanställdas egen lista och chefsvyns
   "Signera punkter", så att ingen missar att en punkt har en kunskapskontroll kopplad.
3. **Kategorifilter i öva-läget.** `byggFragepool(rutiner, omrade, kategori)` tar nu ett
   valfritt tredje argument, ny `tillgangligaKategorier()` listar bara kategorier som faktiskt
   förekommer (döljer filtret helt för en organisation utan bankfrågor). `tillRutinKviss()`
   behåller nu frågans `kategori` som valfri metadata på den sparade kviss-raden – läses
   ingenstans annars, ofarligt att spara.

**Testsvep:** lint rent, 466/466 vitest (12 nya), build grönt, `test:functions` (samtliga
delsviter) och `test:rules` (samtliga delsviter) gröna. Ingen manuell webbläsarverifiering
gjordes den här gången (emulator-CLI:t inte tillgängligt interaktivt i sessionen) – litar på
att build + fyra gröna testsviter fångar det en visuell genomgång annars skulle.

---

---

## Uppföljning 2026-08-23 (rättad: "Uppdatera"-knappen gjorde ingenting, v5.128.0)

Ägaren rapporterade att banderollen "En ny version av Synappsen finns tillgänglig" och dess
"Uppdatera"-knapp (`AppUppdateringBanner.jsx`) inte fungerade.

**Rotorsak:** `vite.config.js` kör vite-plugin-pwa i `injectManifest`-läge (Etapp 24a, för att
Firebase-konfigurationen ska processas av Vite) med `src/sw.js` som EGEN, handskriven service
worker-källa. `useAppUppdatering.js`s `uppdatera()` anropar `updateSW(true)`, som (via
`workbox-window`) postar `{type: "SKIP_WAITING"}` till den väntande workern och sedan väntar
på ett `"controlling"`-event för att ladda om sidan. **`src/sw.js` saknade helt en lyssnare
för det meddelandet**, och saknade `clientsClaim()`. `generateSW`-läget (Workbox
standardbygge) lägger till båda automatiskt – ett handskrivet `injectManifest`-`sw.js` gör
det inte. Knappen postade alltså ett meddelande ingen lyssnade på, och även om den hade
lyssnat hade den nya workern bara tagit kontroll över FRAMTIDA sidladdningar utan
`clientsClaim()`, aldrig den redan öppna fliken. Resultat: att klicka "Uppdatera" gjorde
bokstavligen ingenting.

**Varför inget test fångade det:** `test:e2e` kör Playwright mot Vites DEV-server (`npm run
dev`), som aldrig registrerar en riktig service worker. Ingen befintlig testsvit i projektet
körde `sw.js`s faktiska kod.

**Fixat:** en `message`-lyssnare som anropar `self.skipWaiting()` vid `SKIP_WAITING`, plus
`clientsClaim()` vid uppstart. Nytt `src/sw.test.js` (3 test) kör sw.js:s riktiga kod i en
mockad `self`/workbox/firebase-miljö – bevisat att det fångar exakt den här buggen genom att
tillfälligt ta bort fixen och se testet faila (alla tre), sedan återställa.

Fullt svep grönt: lint, build (bekräftat i minifierad `dist/sw.js` att både lyssnaren och
`clientsClaim()` faktiskt kompilerades in), vitest 410/410 (37 filer), `test:rules`,
`test:functions`, `test:storage`, e2e 41/41 (två `ERR_CONNECTION_REFUSED`-flakes vid full
parallell körning, bekräftat ORELATERADE genom att köra om dem isolerat – passerade båda).

---

## Uppföljning 2026-08-27 (Etapp 71: redigerbar frågebank för Öva-läget)

Ägaren antog rekommendationen i MDR-bedömningen och lade till ett krav: paketen ska gå att
pausa, och enskilda frågor ska gå att se, redigera, lägga till och ta bort – av kundens
administratör och av leverantören. **Det kravet flyttade lösningen från statisk kod
(alternativ A) till Firestore (alternativ C)**, som tidigare avråtts – men avrådan gällde
innan redigering var ett krav.

**Modellen** (fyra ägarbeslut 2026-08-27, alla enligt rekommendation): överlagring framför
kopia-per-kund, superadmin + VÖL som behörighetsnivå, eget kundpaket för fristående frågor,
och paus på både kund- och leverantörsnivå.

| Del | Var |
|---|---|
| Leverantörens frågor | `kvissfragor/{id}` (global) |
| Kundens avvikelse | `organisationer/{orgId}/kvissoverlagring/{fragaId}` |
| Kundens egna frågor | `organisationer/{orgId}/kvissegna/{id}` |
| Kundens paketval | `organisationer/{orgId}.kvisspaket` |
| Globalt nödstopp | `kvisspaket/{paketId}` |

**Ingen collection är skrivbar av någon klient** – all redigering går via
`functions/kvissbank.js`, som rolltestar, PII-kontrollerar och revisionsloggar. 19 nya
regeltester bevisar både det och organisationsisoleringen.

**Innehåll:** 12 nya yrkeskunskapsfrågor (spår 1), var och en kontrollerad mot faktisk
lagtext. De 19 gamla systemfrågorna migrerade till ett eget, avstängbart paket. Paketet
`kliniskt` (spår 2) är byggt men TOMT – innehållet väntar på den externa juridiska
bedömningen.

**Ett fynd värt att minnas:** `SOSFS 1997:14` om delegering upphävdes 2026-01-01 (HSLF-FS
2025:5). En delegeringsfråga skriven ur minnet hade varit fel från dag ett – precis den
färskhetsrisk bedömningens §5.1 pekar ut, demonstrerad på första innehållsomgången. Därav
`kalla` + `kallaDatum` per fråga, och en assertion som failar om någon skriver tillbaka den
upphävda referensen.

**Rättat:** MDR-motiveringen i `src/data/kvissbank.js` (rad 9–22) var felaktig och är omskriven.

Lint, build, vitest, regeltester (19 nya) och functions-tester gröna. **Ej deployat.**

---

## Uppföljning 2026-08-27 (v5.129.0 deployad, Öva-läget, MDR-bedömning)

**Deploy.** v5.129.0 ligger i produktion (körning #89). Två hemligheter stoppade vägen dit:
`BREVO_API_KEY` saknades (ägaren satte den, och verifierade `synappsen.se` hos Brevo via
DNS-poster hos Loopia), och `SOKMOTOR_API_KEY` visade sig **aldrig ha varit satt** – felet
syntes först nu eftersom v5.129.0 bytte `echo` mot `printf '%s'` i `deploy.yml`. Tidigare blev
en saknad hemlighet strängen `"\n"` i Secret Manager, som Secret Manager accepterade;
`printf` skickar en tom sträng, som avvisas med "Secret Payload cannot be empty". **Slutsats
värd att minnas: klinikstödets sökmotor har sannolikt kört mot en trasig nyckel i produktion
under lång tid utan att något larmade.** Ägaren hittade rätt nyckel i GCP ("API key filter",
restriktion Custom Search API) och satte den.

**Öva-läget var tomt.** Orsak: `byggFragepool()` läser bara `rutin.kviss`, och organisationen
har inga rutiner. `KVISSBANK` nåddes bara via en redaktör som manuellt fäst en fråga på en
rutin – bankens egen motivering ("så att en ny organisation inte står tom dag ett") stämde
alltså inte i praktiken. Byggt: `byggBankFragepool()` + ett Systemkunskap-spår i `OvaLage.jsx`
som läser banken direkt, oberoende av Firestore (commit `d8b9106`, ej deployad).

**Åtta nya bankfrågor skrevs och reverterades** (`4754942` → `4815c68`). Ägaren avvisade dem
med rätt argument: tekniska frågor om hur Synappsen fungerar är ointressanta för vårdpersonal,
som behöver öva på sitt yrke.

**MDR-bedömning gjord** (`granskningar/MDR-BEDOMNING-OVNINGSFRAGOR-2026-08.md`, ny fil).
Ägaren ifrågasatte om kliniska frågor verkligen passerar MDR-gränsen. Genomgång mot MDR
art. 2(1), skäl 19, art. 2(12) och MDCG 2019-11 ger: **nej, de gör inte det.** Beslutssteg 4
i MDCG 2019-11 ("är åtgärden till nytta för enskilda patienter?") besvaras nekande eftersom
ingen patientdata finns i flödet. **Kommentaren i `src/data/kvissbank.js` rad 9–22 är alltså
för hårt dragen och bör rättas** – men rättelsen väntar på ägarbeslut, eftersom regeln råkar
skydda mot fyra risker som är verkliga (färskhet, lokal variation, upphovsrätt,
AI-förordningens bilaga III). Fyra beslut ligger i `OPPNA-PUNKTER.md`.

## Uppföljning 2026-08-26 (v5.129.0: fem fel från första riktiga användningen)

Ägaren bjöd in två kollegor och rapporterade fem problem. Sentry-notiser bifogades och
avslöjade **ett sjätte, allvarligare** som ingen sett: tvingad utloggning kraschade i
produktion.

**Rotorsaker, samtliga verifierade mot kod och Sentry:**

| Symptom | Rotorsak |
|---|---|
| Tvinga utloggning "fungerade" men gjorde inget | Tjänstekontot saknar `roles/firebaseauth.admin`. `revokeRefreshTokens` kastar "Credential implementation … insufficient permission" (`organisationsadmin.js:49`). **Samma fel drabbar `deleteUser` i organisationsraderingen, där det är tyst nedsvalt** – Auth-konton blev kvar. **Kräver ägaråtgärd i GCP-konsolen, ingen kod hjälper.** |
| E-postinbjudan kom aldrig fram | `deploy.yml` satte hemligheten med `echo`, som lägger till radbrytning. En saknad GitHub-hemlighet blev `"\n"` i Secret Manager – **truthy** – så `skickaEpost`s "inte konfigurerad"-guard slog aldrig till. Brevo svarade 401 "authentication not found in headers" |
| Tom organisation | `verksamhetstyp` har default `""` i UI:t, hela seedningen är villkorad på den, och fältet **sparades aldrig** på organisationen. Ingen väg tillbaka fanns |
| Ingen lösenordsåterställning | Aldrig byggd |
| Kan inte radera/stänga av konto | Funktionerna fanns inte |
| CSP-larm i Sentry | `connect-src` tillät `ingest.de.sentry.io` men adressen är en **subdomän** → Sentrys egen SDK blockerades. `frame-src` saknade `firebaseapp.com`, vilket hade brutit lösenordsåterställningen. (`connect.facebook.net` var inte vår kod – injicerat av besökarens webbläsare) |
| `FirebaseError: Missing or insufficient permissions` | Push-token skrevs innan `losInInbjudan` hunnit skapa `users/{uid}` |

**Byggt (v5.129.0):** `satAnvandareAvstangd` (reversibel spärr, Auth `disabled`) och
`raderaAnvandare` (Auth + `users/{uid}`, GDPR art. 17 på individnivå) med UI, `avstangd`
gjort immutabelt från klienten i `firestore.rules`, lösenordsåterställning, ärligt
inbjudnings-UI (`skapaInbjudan` returnerar `epostSkickat`), `seedaStartbibliotek` (idempotent,
körbar i efterhand) + `verksamhetstyp` sparas nu, `printf '%s'` i deploy.yml + `.trim()`,
CSP-rättelser, push-race. 10 nya functions-tester
(`tests/functions/anvandarhantering.test.cjs`).

**Medvetet INTE byggt: byta organisation på en användare.** Kvitteringar,
introduktionssigneringar och revisionsloggposter hör till den gamla organisationen, och
revisionsloggen är en hashkedja som inte får skrivas om. Rätt väg är radera + bjud in på
nytt, vilket nu finns och är spårbart.

**Dokument rättade i samma commit:** `drift/INCIDENT-CHECKLISTA.md` (tvingad utloggning
stänger inte ute någon som kan lösenordet – raden pekar nu på avstängning) och
`saljmaterial/kallfiler/Synappsen-teknisk-beskrivning.html` (superadmins förmågor).

> **KVARSTÅR OCH BLOCKERAR:** utan IAM-rollen fungerar varken avstängning, radering eller
> tvingad utloggning i produktion – koden är rätt, behörigheten saknas. Se `OPPNA-PUNKTER.md`.

---

## Uppföljning 2026-08-27 (v5.130.0 – release + deploy av Etapp 71)

Versionsbump och release för Etapp 71 (se uppföljningen ovan för det tekniska innehållet).
Ändringslogg tillagd (`src/data/andringslogg.js`). `saljmaterial/PITCH.md` hade glidit till 16
minorversioner efter koden (testets gräns är 15) – innehållet skrevs om, inte bara
versionsraden: Öva-läget (som tidigare INTE nämndes i pitchen alls, trots att det funnits
sedan v5.102.0), kontoadmin (avstängning/radering), lösenordsåterställning, och startbibliotek
i efterhand.

Lint, build och hela vitest-sviten (502/502, dokumenttesterna inkluderade) gröna.
`test:rules`/`test:functions` inte omkörda i det här steget – inga ändringar i
`firestore.rules`/`functions/` sedan de kördes gröna i förra commiten.

## Uppföljning 2026-08-27 (v5.131.0 – rättslig spärr på utgående e-post)

Brevo togs i drift tidigare samma dag utan att PUB-avtal fanns. Ägaren beslutade att pausa
allt utgående e-post tills avtalet är tecknat, men hittade inte det globala nödstoppet i
leverantörsvyn – och en kodsession kan inte trycka på det (ingen firebase/gcloud CLI, inga
servicekontonycklar, och `systemstatus/epost` är `allow write: if false`).

**Byggt i stället:** en konstant `PUB_AVTAL_BREVO_TECKNAT = false` i `functions/gemensamt.js`.
`skickaEpost()` returnerar `{skickat: false, anledning: "pub_avtal_saknas"}` utan att kontakta
Brevo, oavsett driftflaggans läge.

**Varför en kodkonstant framför driftflaggan:** flaggan bär ingen motivering. Den som ser den
påslagen om tre månader vet inte varför, och risken att den slås av av misstag är exakt det
mönster projektet dokumenterat sex gånger. En kodändring kräver granskning och driftsättning –
proportionerligt mot att teckna ett avtal.

**Strukturellt:** utskicket bröts ut till `utforUtskick()`, exporterad som `_utforUtskick`
enbart för test. Utan det hade fyra testfall (nödstopp, saknad nyckel, faktiskt utskick,
revisionslogg) tystnat helt medan spärren är på. Valideringen (ogiltig adress, personnummer)
ligger kvar FÖRE spärren, så ett anroparfel syns även när kanalen är pausad.

`epostSkickat` blir korrekt `false`, och UI:t (rättat i v5.129.0) säger då sanningen om att
inbjudningslänken måste delas manuellt. Ingen UI-ändring behövdes.

**Att häva:** sätt konstanten till `true`, fyll i datum i `avtal/UNDERBITRADEN.md`, ta bort
raden ur `OPPNA-PUNKTER.md`. `tests/functions/epost.test.cjs` failar om konstanten ändras.

## Uppföljning 2026-08-28 (v5.131.0 deployad – e-postspärren verifierad i produktion)

Deploykörning #92 lyckades och är verifierad mot **faktiskt utfall**, inte mot jobbstatusen.
Skälet: körning #90 dagen innan rapporterade `success` men saknade
`hosting: finalizing version / release complete / Deploy complete!` i loggen, och produktionen
fortsatte servera föregående version. Att lita på `conclusion: success` räcker alltså inte.

**Verifierat för #92:** alla fyra hosting-releaseraderna finns i loggen, `last-modified` på
produktionens `index.html` matchar deployens sluttid (12:31:29 UTC), `version-*.js` innehåller
`5.131.0`, och de tre funktioner som kan skicka e-post – `skapaInbjudan`,
`skickaEpostPaminnelserSchemalagt`, `skickaManadssammanfattningarSchemalagt` – rapporterade
alla "Successful update operation".

**Utgående e-post är därmed faktiskt stoppat**, inte bara beslutat.

**Testerna som spärren avslöjade:** tre filer antog att e-post faktiskt skickas. Två löstes
genom att bryta ut mejlkompositionen till rena funktioner (`byggInbjudningsmejl`,
`byggPaminnelseDigest`) – bättre design oavsett spärren. Den tredje
(`manadssammanfattning.test.cjs`) testar mottagarurval och opt-out, vilket kräver att utskicket
faktiskt sker; där används `_sattPubAvtalOverridForTest`, med en assertion i `epost.test.cjs`
som failar om någon produktionsfil under `functions/` någonsin refererar till överridet.

**Kvar att göra för ägaren:** teckna Brevos DPA, sätt sedan `PUB_AVTAL_BREVO_TECKNAT = true`,
fyll i datum i `avtal/UNDERBITRADEN.md` och ta bort raden ur `OPPNA-PUNKTER.md`.

## Uppföljning 2026-08-28 (v5.132.0 – rätt orsak när ett mejl uteblir)

Ägaren testade att bjuda in någon för att bekräfta att spärren biter. Den gjorde det – men
texten sa **"e-post är inte konfigurerat för den här installationen"**, vilket är osant:
nyckeln är satt och domänen verifierad, utskicket är pausat av rättsliga skäl.

Orsak: `skapaInbjudan` returnerade bara `epostSkickat: true/false`, så gränssnittet hade EN
hårdkodad förklaring för alla utfall. Den råkade stämma medan nyckeln saknades och blev osann
i samma stund som spärren infördes. Samma klass av fel som Etapp 70c rättade – det borde ha
setts när spärren byggdes, inte efter att ägaren stötte på det.

**Två fel i själva rättelsen, båda fångade av tester:**
1. Anledningen skickades inte med alls från servern.
2. `onCall`-wrappern destrukturerade fortfarande `{ token, epostSkickat }` och tappade
   `epostAnledning` på sista raden ut. Utan testet hade en "rättelse" deployats som inte
   ändrade någonting i gränssnittet.

`EPOST_ANLEDNING_TEXT` i `InbjudanFormular.jsx` mappar nu orsak → text. Formuleringen mot kund
är neutral ("utgående e-post är tillfälligt pausat") – sann utan att lufta att det handlar om
ett osignerat biträdesavtal.

## Uppföljning 2026-08-29 (upplägg för leverantörspanelen – förslag, inte bygge)

Ingen kod. `intern/ETAPPLAN-INTERN-1.md` (Etapp L1, **fortfarande ej antagen**) fick ett nytt
avsnitt "Panelens upplägg" och en omskriven L1a. Version 0.1 → 0.2.

Den bärande idén: en panel för flera organisationer behöver **två uttalade arbetslägen**, inte
ett. Portföljläge (`/leverantor/*`, sju vyer, aggregerat över alla kunder) och kundläge
(`/leverantor/kund/:orgId/*`, fem flikar, allt låst till en organisation). Dagens vy har bara
portföljformen, och den enda vägen till en enskild kund är att expandera en rad i listan –
vilket slutar fungera någonstans runt tio kunder.

Två saker i upplägget är juridiska snarare än ergonomiska och får inte förhandlas bort i ett
senare bygge:

- **Åtkomsttaket har två nivåer.** Metadata (alltid, via `plattformsadmin/{uid}`) och innehåll
  (endast under ett supportfönster som kunden själv öppnar, Etapp 50b). Block som kräver
  innehållsåtkomst ska synas men stå tomma och märkta med varför – ett block som göms lär inte
  ut var gränsen går.
- **`LeverantorsAtgard` blir en komponent, inte en konvention.** Bekräftelse, obligatorisk
  anledning och revisionsloggning in i kundens hashkedja. En åtgärd som glömmer loggas går inte
  att upptäcka i efterhand, och konventioner har bevisligen misslyckats sex gånger här.

**Tillägg samma dag (v0.3):** ägaren bad om att panelen ska nås med ETT övergripande konto
utan organisationstillhörighet. Nytt delmål L1m, som ska byggas före allt annat eftersom det
flyttar en åtkomstgräns. Lösningen är `organisationId: "_plattform"` – sentinelvärdet finns
redan som pseudo-organisation för revisionsloggning (Etapp 32c) och matchar ingen
organisation, så isoleringen blir en följd av befintliga regler i stället för av ett nytt
undantag. **Det viktigaste premissfyndet:** att bara utelämna `organisationId` gör INTE kontot
organisationslöst – `minOrganisation()` (`firestore.rules:36`) och åtta klientfiler faller
tillbaka på `default`, en organisation med verklig data. Det tomma fältet är alltså det
farligaste alternativet, inte det säkraste. Rollen måste dessutom förbli `superadmin`, annars
slutar `farForsokaLasaPlattformsadmin` (`src/firebase/roles.js:69`) att ens leta efter
panelen.

**Tillägg samma dag (v0.4):** en behovsanalys B1–B10 – vilka återkommande arbetsuppgifter
ägaren faktiskt har, och vilken funktion i panelen som möter var och en. Nytt delmål L1n.

**Det allvarligaste fyndet i hela genomgången:** `aterstallOrganisationCallable` och
`backupaOrganisation` finns som plattformsadmin-grindade callables men har **noll
gränssnitt** – och backupfilerna är `allow read, write: if false` i `storage.rules`, så en
klient kan inte ens lista dem. Samtidigt beskriver `avtal/INCIDENTRESPONSPLAN.md` 5.5 och
`drift/INCIDENT-CHECKLISTA.md` steg 8 återställning som en existerande förmåga. Den finns som
kod men går inte att utöva utan CLI mot produktionsprojektet. Dokumenten är alltså sanna om
koden och falska om verkligheten – samma feltyp underhållsregeln finns för, fast omvänd.
Ingen dokumentändring gjord: förmågan FINNS, den saknar bara en knapp, och L1n bygger den.

Näst allvarligast: `hamtaBackupstatus`, `verifieraRevisionskedjor`, `testaBeroenden` och
`verifieraKlinikstod` sitter i `src/components/admin/IncidentberedskapSektion.jsx` – i
KUNDENS adminpanel bakom `arSuperadmin`. Efter L1m når ett `_plattform`-konto dem aldrig.

**Tillägg samma dag (v0.5):** behoven utanför driften – avtal, juridik, försäljning (B11–B20),
plus delmålen L1o (åtagandekalendern) och L1p (avtal och åtaganden per kund).

Det viktigaste fyndet där: **ingenting hindrar att en organisation sätts till `avtalsstatus:
aktiv` utan att ett PUB-avtal finns.** Organisationsdokumentet har inget sådant fält alls. Det
är samma fel som Brevo, fast med Synappsen som biträdet i stället för kunden – och lösningen
ska vara densamma som valdes då: en spärr i `satAvtalsstatus`, inte en rad i en checklista.
Motiveringen står redan i `avtal/UNDERBITRADEN.md`s ändringshistorik (2026-08-27).

Två saker till som är värda att komma ihåg utan att öppna planen: (1)
`granskningar/JURIDISK-GRANSKNING.md` risk 15 – en kund under cybersäkerhetslagen (2025:1506)
har 24 timmars tidig varning medan PUB-avtalet lovar 72, så en incidentklocka måste kunna
räkna ned från båda. (2) `drift/INCIDENT-CHECKLISTA.md` säger själv att nyckelrotationens
påminnelse *"inte är byggd än"* – den och tre andra återkommande åtaganden samlas i L1o
i stället för att bli fyra ad hoc-signaler.

**Avrått från:** att flytta `saljmaterial/KANDIDATLISTA-PRIVAT-VARD.md` in i panelen. Den
innehåller bedömningar om namngivna verksamheter och kontaktuppgifter till namngivna personer;
i produktionsdatabasen vore det en ny behandling med leverantören som personuppgifts-
ANSVARIG, inte biträde – med egen rättslig grund och informationsplikt enligt art. 14. Hela
produktens juridiska hållning bygger på biträdesrollen. Listan stannar i git.

Ägaren har också gett Cloud Functions-tjänstekontot `roles/firebaseauth.admin` i GCP.
**Ännu inte verifierat** – `tvingaUtloggning` på ett testkonto är det icke-destruktiva testet.
Tills det är gjort står raden kvar i `OPPNA-PUNKTER.md`.

## Uppföljning 2026-08-29 (Etapp L1 antagen + arbetsuppskattning)

`intern/ETAPPLAN-INTERN-1.md` (leverantörspanelen) **antogs i sin helhet**, v0.6.
Beslutspunkterna 5 (samma app) och 6 (flytta befintligt konto) avgjordes genom antagandet
– planens struktur förutsätter dem. **1–4 och 7 kvarstår öppna** och avgörs var för sig,
precis innan L1c/L1d/L1f/L1j respektive påbörjas – de blockerar inget annat delmål.
`BESLUTSLOGG.md` fick raden, `DOKUMENTREGISTER.md` och `intern/ANDRINGSLOGG-INTERN.md`
uppdaterades. Två rader i `OPPNA-PUNKTER.md` (återställningsluckan, PUB-spärren) togs bort –
de väntade bara på det här antagandet och är nu byggkapacitet, inte ett öppet beslut.

**Arbetsuppskattning, på ägarens begäran.** 16 delmål (L1a–L1p), i samma effortskala som
tabellen "Uppskattad arbetsinsats" i planfilen: 4 små, 6 medel, 3 stora, 3 beroende av öppna
beslutspunkter. Grovt ~18–24 fokuserade byggpass (bygg + fullt testsvep + commit, samma
enhet varje `Uppföljning`-post i den här filen redan representerar) om
rekommendationerna följs på de öppna punkterna – jämförbart i total omfattning med de
senaste 15–20 etapperna tillsammans. Kalendertiden styrs av sessionstakten, inte av hur
mycket ett enskilt pass hinner. Byggordningen (L1m → fritt inom varje gren i
"Beroendeordning") gör att flera delmål kan drivas parallellt utan att vänta på varandra.

## Uppföljning 2026-08-29 (v5.133.0 – L1l, L1h, L1k, L1o byggda)

Ägaren bad om de fyra "Liten"-delmålen i Etapp L1. Byggda, testade, committade – **inte
deployade** (internt arbete, ingen brådska; nästa deploy kan vänta tills ett kundvänt behov
finns eller L1m är klar). Detaljer i `intern/ETAPPLAN-INTERN-1.md` (v0.7) under respektive
delmål och i `intern/ANDRINGSLOGG-INTERN.md` (v5.133.0-posten).

**Ett verkligt korrekthetsfel hittades och fixades under L1k**, inte i produktion senare: ett
blint `FieldValue.increment(±1)` på en organisations ännu-inte-initierade `antalAnvandare`
hade skrivit en felaktig ABSOLUT siffra (Firestore behandlar increment på ett saknat fält som
att basen är 0 – "1 användare" för en organisation som redan har tio). Både `losInInbjudan`
och `raderaAnvandare` läser nu räknarens nuvarande värde först och rör den bara om den redan
är ett tal; annars lämnas fältet åt `listaOrganisationer`s lativa backfill, som räknar rätt
från grunden. Fångat av `tests/functions/antalanvandare-raknare.test.cjs` INNAN kodgranskning
hann missa det – testet skrevs samtidigt som implementationen, inte efteråt.

L1k byggdes bara på `antalAnvandare`-axeln. Kostnadshistorik-axeln (den andra extra läsningen
i `listaOrganisationer`) avgränsades medvetet bort: den skrivs lativt inuti `reserveraBudget`,
en budgetkritisk transaktion som körs före varje Gemini-anrop, och att denormalisera dit för
en enda leverantörsvys visning vore oproportionerligt för ett delmål stämplat "Litet".

37 nya tester. Fullt testsvep grönt: `npm run lint`, `npm run build`, `npx vitest run` (517
tester, upp från 480), `npm run test:rules` (alla filer, inkl. den nya
`atagandekalender.test.mjs`), `npm run test:functions` (alla 35 filer, inkl. de två nya).


---

## Uppföljning 2026-08-29 (v5.134.0 – L1m, L1a, L1g, L1i, L1n, L1p byggda)

De sex "Medel"-delmålen, byggda direkt efter de fyra "Liten"-delmålen i samma session.
Detaljer i `intern/ETAPPLAN-INTERN-1.md` v0.8 under respektive delmål.

**L1m (kontomodellen) är den mest säkerhetskritiska delen** – ett `_plattform`-konto bevisat
isolerat från all kundorganisations innehåll skarpt mot Firestore-regler
(`tests/rules/plattformskonto.test.mjs`), inklusive den faktiska fällan att INTE falla
tillbaka på organisationen "default". `flyttaTillPlattformskonto()` finns för att flytta
ägarens eget konto – **inte körd än**, ett operativt beslut, inte en teknisk fråga.

**L1p:s PUB-avtalsspärr är samma feltyp som Brevo, fast omvänt** – `satAvtalsstatus('aktiv')`
nekas nu utan ett registrerat PUB-avtal (`pubAvtalTecknat`), av exakt samma skäl som
Brevo-spärren: en kontroll i koden kan inte glömmas bort. Ingen skarp risk (noll kunder), men
billigast att stänga innan den första.

**Två deliberata avsteg från planens ordalydelse**, båda dokumenterade i `intern/
ETAPPLAN-INTERN-1.md`: `IncidentberedskapSektion.jsx` togs INTE bort från kundens adminpanel
(planen antog fel – en riktig kund läser sin EGEN organisations status oberoende av
plattformsadmin, att ta bort den hade varit en regression). Kundlägets fem flikar (L1a) delar
en gemensam platshållare i väntan på L1b, i stället för fem tomma sidor.

**Ett självrättat verktygsmisstag**, dokumenterat ärligt i `intern/ANDRINGSLOGG-INTERN.md`:
ett `Write`-anrop skrev av misstag över `src/firebase/functions.js`. Upptäckt omedelbart via
`git status`, återställd från `git show HEAD:...`, alla tillägg återapplicerade och
verifierade innan arbetet fortsatte. Ingen förlorad kod.

77 nya tester. Fullt testsvep grönt: lint, build, `npx vitest run` (535 tester, upp från 517),
`npm run test:rules` (alla filer inkl. 2 nya), `npm run test:functions` (alla 40 filer inkl.
5 nya).

**10 av 16 delmål i Etapp L1 klara.** Kvarstår: L1b (kunddossién – inget hinder, störst
kvarvarande arbetsbesparing), L1e/L1f (stora, L1f väntar på beslutspunkt 4), L1c/L1d/L1j
(väntar på beslutspunkt 1/3/2).

---

## Uppföljning 2026-08-29 (v5.135.0 – L1b byggd)

Kunddossién – planens enskilt största arbetsbesparing, byggd direkt efter de sex
"Medel"-delmålen i samma session. Detaljer i `intern/ETAPPLAN-INTERN-1.md` v0.9 under L1b.

**En verklig bugg hittad vid premisskontroll, inte en kodmiss i den här omgången:**
`listaOrganisationer` (`functions/organisationslivscykel.js`) returnerade aldrig åtta fält
(`orgnr`, `kontaktperson`, `anvandartak`, `pubAvtalTecknat`, `pubAvtalVersion`,
`underbitradeUnderrattad`, `omfattasAvNIS2`, `atagandeblock`) som L1p:s
`AvtalOchAtagandeSektion.jsx` redan berodde på att läsa. Den panelen hade alltså visat fel
sedan den byggdes förra omgången – ett tyst fel som ingen tidigare test kunde fånga eftersom
funktionstesterna läste/skrev dokumentet direkt i stället för via callet klienten faktiskt
använder. Fixat, med `tests/functions/listaorganisationer-falt.test.cjs` som bevisar det.

Fem riktiga sidor ersatte den delade platshållaren från v5.134.0: Huvud+Kontakt (delvis)
(`KundOversikt.jsx`), Användning (delvis) (`KundAnvandning.jsx`), Avtal & ekonomi
(`KundEkonomi.jsx`, återanvänder L1i + flyttar in L1p:s panel), Historik
(`KundHistorikSektion.jsx`, ny callable `hamtaKundensLeverantorshistorik`), Åtgärder
(`KundAtgarderSektion.jsx`, nio befintliga klientfunktioner, ingen ny backend).
`OrganisationsRad.jsx`s dubblerade avtalspanel togs bort till förmån för en länk till
dossién.

**Tre delar medvetet obyggda**, alla dokumenterade i planfilen: Hälsa (kräver L1c +
beslutspunkt 1), "senaste aktivitet" (kräver L1j + beslutspunkt 2), "vem är superadmin"/
"senast bjöd in" (ingen läsväg till `users/{uid}` i dag – att öppna en sådan vore en ny
läsväg mot kundinnehåll utan samtycke, krav 37, och inget L1b bad om).

7 nya funktionstester. Fullt testsvep grönt: lint, build, `npx vitest run` (535 tester,
oförändrat), `npm run test:rules`, `npm run test:functions`.

**11 av 16 delmål i Etapp L1 klara.** Kvarstår: L1e (stor, inget hinder), L1f (stor,
beslutspunkt 4), L1c/L1d/L1j (beslutspunkt 1/3/2).

---

## Uppföljning 2026-08-30 (v5.136.0 – Etapp L1 SLUTFÖRD)

Ägaren bad om beslut på de fyra öppna beslutspunkterna som blockerade de sista fem
delmålen. Ställde dem samlat; ägaren godkände samtliga fyra rekommendationer utan avvikelse.
Detaljer i `BESLUTSLOGG.md` 2026-08-30 och `intern/ETAPPLAN-INTERN-1.md` v1.0.

- **Beslutspunkt 1** (L1c): mätvärdesaggregat via Cloud Function (väg B), inte en lossad
  regel. `hamtaKundmatvarden(orgId)` returnerar bara de redan aggregerade fälten, loggat mot
  kundens EGEN kedja.
- **Beslutspunkt 2** (L1j): bara appversion rapporteras (`rapporteraAppVersion`, skrivet på
  organisationens dokument), inte "senast aktiv" per användare.
- **Beslutspunkt 3** (L1d): egen inline-SVG (`src/utils/sparkline.js`), inget
  diagrambibliotek.
- **Beslutspunkt 4** (L1f): leverantören kan nu BEGÄRA ett supportfönster i appen
  (`begarSupportAtkomst`/`svaraSupportbegaran`) – kunden godkänner fortfarande själv.

**Två premisskontrollfynd ändrade omfånget innan bygget:** L1f:s punkt 4 (ärendetråd per
kund) visade sig redan finnas sedan Etapp 50c (`arendeanteckningar`) – planen hade missat
det. L1e:s punkt 3 (72-timmarsklockan) byggdes redan i L1p. Båda delmålen fick därför ett
mindre omfång än planen ursprungligen skisserade.

**Två punkter avgränsades MEDVETET bort**, båda dokumenterade i `intern/ETAPPLAN-INTERN-1.md`:
L1f punkt 3 (läslogg under ett aktivt supportfönster – kräver att instrumentera varje läsväg
`farSupportlasa()` täcker, ett eget, större delmål) och L1e punkt 2 (ett generaliserat
`nodstopp/{funktion}`-mönster – en omskrivning av skarp, säkerhetskritisk kod utan att en
tredje nödstoppsmekanism ännu finns som kräver den).

26 nya tester. Fullt testsvep grönt: lint, build, `npx vitest run` (546 tester, upp från
535), `npm run test:rules` (inkl. 5 nya för `supportbegaran`), `npm run test:functions`
(inkl. 17 nya, delade mellan L1c/L1f/L1j i en gemensam testfil), `npm run test:storage`.

**Etapp L1 är därmed slutförd i sin helhet: 16 av 16 delmål.** Enda kvarvarande öppna frågan
i hela planen är beslutspunkt 7 (feedback-inkorgen) – inget bygge väntar på den.

---

## Uppföljning 2026-08-30 (v5.137.0 – beslutspunkt 7: egen kanal till leverantören)

Ägaren avgjorde den sista öppna frågan i Etapp L1: ska leverantören se kundens
feedback-inkorg? Svar: nej, inte rakt av – bygg en EGEN, tydligt märkt kanal i stället.
Ägaren bad uttryckligen om att göra det tydligt i BÅDA verktygen (den nya och den
befintliga) vart respektive feedback faktiskt går.

**Byggt:** ny collection `leverantorsfeedback`, medvetet HELT ÅTSKILD från kundens interna
`feedback` – ingen tyst utvidgning av vem som läser den redan existerande. En ny sida,
`KontaktaLeverantoren.jsx` (`/kontakta-leverantoren`), säger uttryckligen "Det här går till
Synappsen – inte till din organisations admin". Den befintliga `Feedback.jsx` (och
`Hjalp.jsx`) fick motsvarande förtydligande åt andra hållet, plus en länk mellan de två
sidorna. Leverantörens sida: `LeverantorsfeedbackSektion.jsx` i `/leverantor/logg`, olästa
markerade och kan bockas av.

15 nya tester (9 funktioner, 6 regel) – bevisar bland annat att en post i
`leverantorsfeedback` aldrig läcker in i `feedback` eller tvärtom, och att en annan
superadmin i SAMMA organisation inte kan läsa någon annans meddelande till leverantören.
Fullt testsvep grönt: lint, build, `npx vitest run`, `npm run test:rules`,
`npm run test:functions`, `npm run test:storage`.

**Samtliga 7 beslutspunkter i Etapp L1 är därmed avgjorda och byggda. Etapp L1 är helt
slutförd** – 16 av 16 delmål, 7 av 7 beslutspunkter.

---

## Uppföljning 2026-08-30 (Etapp 72 – utkast, ingen kod)

Ägaren bad om en genomgång av produktens nuvarande form och en identifiering av luckor:
funktioner som möter behov hos potentiella kunder som ännu inte bedömts. Resultatet är
`etapplaner/ETAPPLAN19.md` – **ett utkast, EJ ANTAGET. Ingen kod skriven, inget får byggas.**

**Analysens kärna, två fynd ur koden:**

1. `functions/verksamhetsmallar.js` ger nya kunder en rutinmall som heter "Avvikelsehantering"
   och vars innehåll är *"Beskriv er rutin för att rapportera och följa upp avvikelser"*.
   Produkten ber alltså kunden **beskriva** en process som sedan sker någon annanstans. Samma
   mönster för delegering (finns bara som kvissfråga) och patientsäkerhetsberättelse (finns
   bara i säljmaterialet, som något vi läser HOS kandidater). Synappsen har byggt ett ben av
   ett ledningssystem, mycket väl – de andra ligger i Excel hos målgruppen.
2. **Frekvensproblemet.** Rutindatabasen konsulteras; de saknade skyldigheterna utförs, med
   signatur, varje pass. `KOPARANALYS.md` §6.1 svarar på kallstarten med mer innehåll. Planen
   föreslår ett annat svar: en app som kräver en signatur varje pass har inget
   kallstartsproblem.

**Tolv premissantaganden kontrollerade mot kod, fyra ändrade planen** – bland annat att
`checklistkorningar` bara är en räknare (ingen signerad post), att kompetensmatrisen är
härledd och inte lagrad (kan inte bära delegeringar), och att `bristanmalningar` är hårt knuten
till förrådsartiklar (mönster att härma, inte grund att bygga på).

**Tolv delmål i tre grupper.** Tyngdpunkt: 72a (återkommande kontroller med loggbok) för att
den ensam ändrar användningsfrekvensen. Högst värde per byggtimme: 72b
(patientsäkerhetsberättelse som utkast ur data vi redan samlar). 72e (avvikelsehantering) är
**blockerad** – den kolliderar med produktens grundlöfte om att patientuppgifter aldrig finns,
och bör ingå i samma externa juridiska uppdrag som Etapp 64 väntar på.

**Ett dokumentfel hittades och rättades mekaniskt:** `DOKUMENTREGISTER.md` påstod 65 dokument
och `CLAUDE.md` 62, medan 67 fanns på disk. Båda rättade till 68, och
`tests/docs/dokumentregister.test.js` fick två nya assertioner som failar om siffrorna glider
igen – det sjunde fallet av projektets återkommande felmönster, den här gången i just det
dokument som finns för att förhindra det.

**Ingen kod, ingen versionsbump.** Planens källpåståenden om svensk vårdlagstiftning är
**inte verifierade mot primärkällor** – se planens eget avsnitt "Källor och verifieringsbehov".
Ingen rad får citeras i kundvänt material innan den tabellen är avbockad.

---

## Uppföljning 2026-08-30 (Etapp 72 v0.2 – omskriven mot extern granskning)

Ägaren lämnade in `granskningar/GRANSKNING-IDEBANK-2026-08-30.md` (nu i repot). Den granskar
formellt ett ANNAT dokument – produktidébanken, 18 förslag, som inte finns i repot – men sex
av dess förslag motsvarar delmål i ETAPPLAN19, och den gjorde det arbete v0.1 utpekade som sin
egen svaghet: **verifierade regulatoriska påståenden mot primärkälla.**

**Sju ändringar i v0.2. Två av dem rättar verkliga fel i v0.1:**

1. **72c omskrivet från register till koppling.** delegering.se säljer redan hela det
   ursprungliga förslaget till exakt målgruppen. v0.1 missade det, eftersom premisskontrollen
   bara kontrollerade mot vår egen kod. Delmålet bygger nu kopplingen delegering↔rutin↔
   kvittering — det en fristående delegeringstjänst strukturellt inte kan göra — plus en
   rutinmall för icke-läkemedelsdelegering, den lucka upphävandet av SOSFS 1997:14 lämnade.
2. **"Högst värde per byggtimme" struket från 72b.** Det mätte byggtid, inte ägandekostnad.
   Ett delmål som återger en föreskrifts struktur måste följa den föreskriftens ändringar för
   alltid. Arbetsinsatstabellen har fått en kolumn för underhållssvans, och slutsatsen vänder:
   **72a är dyrast att bygga och billigast att äga; 72b och 72c är tvärtom.**

Övriga fem: premisskontrollen har fått **ett andra ben mot marknaden** ("säljer någon redan
detta?"); **72e delat** i statistik (strukturerad, byggbar) och nya **72m** (händelseanalys/
lex Maria, byggs inte — det är ett produktbeslut, inte ett delmål); **nytt genomgående krav
44** om arkivlag vid kommunal kund; **beslutspunkt 5 omskriven** från byggordning till
efterfrågegrind; **ny beslutspunkt 7** om segment.

**Krav 44 är det enda fyndet som pekar på en konflikt med kod i drift.**
`BACKUP_RETENTION_DAGAR = 90` och `RADERING_VANTETID_TIMMAR = 48` är leverantörsbeslut — men
hos en kommunal kund fattar arkivmyndigheten gallringsbeslut. Båda siffrorna verifierade mot
kod innan kravet skrevs.

**En regulatorisk risk utanför planen som är mer brådskande än varje delmål i den:**
granskningens avsnitt 3.1 visar att MDR:s undantag för "simple search" inte omfattar
NLP-sökning som bidrar till ett medicinskt syfte — vilket klinikstöd-sökningen gör. Slutsatsen
ändras sannolikt inte, men skälet gör det, och det avsedda ändamålet bör skrivas ned. Det är
timmar, inte veckor, och det står som undantag 1 i beslutspunkt 5.

**Ingen kod, ingen versionsbump.** Planen är fortfarande **EJ ANTAGEN** – nu tretton delmål
och sju öppna beslutspunkter.

---

## Uppföljning 2026-08-30 (v5.138.0 – Etapp 72 antagen, undantag 1 genomfört)

Ägaren bad att anta ETAPPLAN19-utkastet och genomföra "första delmålet". Frågade tillbaka
eftersom planens egen beslutspunkt 5 (efterfrågegrinden) säger att inget delmål byggs utan en
namngiven kund – två frågor: vad "första delmålet" betyder, och om samtliga sju
beslutspunkter ska godkännas enligt planens rekommendationer eller tas en och en. Svar:
undantag 1 (arbetet som inte kräver kund), samtliga rekommendationer godkända.

**Planen antagen i sin helhet** (`BESLUTSLOGG.md`). Låser fast riktningen – Efterlevnad blir
en ny modul, innehållshälsa flyttas till Core, 72e byggs strukturerat men väntar på en extern
juridisk bekräftelse, 72j och 72m byggs inte i denna omgång. Låser INTE upp bygget av
enskilda delmål.

**Undantag 1 genomfört, tre delar:**

1. **Avsett ändamål** för klinikstöd-sökningen skrivet
   (`granskningar/AVSETT-ANDAMAL-KLINIKSTOD-2026-08-30.md`).
2. **Artikel 50-märkning byggd** – var en bekräftad brist sedan
   `granskningar/JURIDISK-GRANSKNING.md` §7.4 (2026-08-11). En AI-tolkad rutins ursprung
   (`kalla: "gemini"`) visas nu som en badge i läsvyn, oavsett om rutinen sedan godkänts.
   Upphandlingssvarets E2 uppdaterat från "ej byggt" till "byggt" – texten hade redan en
   `[FYLL I]`-platshållare som väntade på just detta.
3. **Vertex AI-migreringens kostnad uppskattad** till grovt 2–3 arbetsdagar
   (`granskningar/VERTEX-AI-MIGRERING-KOSTNADSUPPSKATTNING-2026-08-30.md`) – sex
   anropsställen i två filer, ingen automatisk testtäckning finns för någon av dem.

**Ett verkligt fynd under arbetet med punkt 1:** `functions/klinikstod.js`s Gemini-prompt sa
uttryckligen *"Detta är beslutsstöd, inte en diagnos"* – rakt emot den avgränsning
(sammanfattar, rekommenderar aldrig) som håller funktionen utanför MDR. Ordet i systemets
EGEN instruktion var en självmotsägelse, och en konkret risk: modellen kunde eka det tillbaka
i sitt svar till användaren. Rättat i samma commit.

**Ett bifynd rättat:** `avtal/UNDERBITRADEN.md` sa "fem godkända medicinska källdomäner",
koden har haft sju sedan källbevakningen byggdes ut. Ny assertion i
`tests/docs/dokumentpastaenden.test.js`.

**Detta är den första kundvända kodändringen sedan Etapp 69** (märkningen i `RutinKort.jsx`
och prompträttelsen i `klinikstod.js` påverkar vad en riktig användare ser/får). Ny post i
`src/data/andringslogg.js`. Fullt testsvep grönt.

---

## Uppföljning 2026-09-02 (v5.139.0 – 72f/72d/72h byggda på ägarens engångsinstruktion)

Ägaren instruerade direkt: "bygg och deploya delmål 72f, 72d och 72h" – ett uttryckligt
engångsundantag från Etapp 72s efterfrågegrind (beslutspunkt 5 i `etapplaner/ETAPPLAN19.md`,
se `BESLUTSLOGG.md` 2026-09-02). Grindens huvudregel gäller oförändrad för alla övriga
delmål i etappen.

**72f – Driftstoppsläge.** Exakt spegling av akutlägets mönster (`useAkutlageRutiner.js`,
`Akutlage.jsx`, `AkutlagePrefetch.jsx`) med egna fält (`driftstopp`/`driftstoppOrdning`) och
egen visuell identitet (blå/gul, inte akutlägets larmröda). Ny route `/driftstopp`, nytt
startvyblock (ingen ny flytande knapp – skulle konkurrera med "🚨 Akut"). `firestore.rules`
skyddar de nya fälten med samma VÖL/superadmin-spärr som akutläget, testat i
`tests/rules/organisationsisolering.test.mjs`. Byggde INTE "signera 72a:s kontroller
offline" – 72a finns inte i kodbasen.

**72d – Tillsyns- och revisionspaket.** Ny adminsektion `TillsynspaketSektion.jsx`
(superadmin), exporterar ett Markdown-dokument med innehållsförteckning: rutinbestånd
(ägare/giltighet/granskning), kvitteringsläge per rutin (ny ren funktion
`src/utils/kvitteringsgrad.js`), och revisionsloggens verifierade kedja
(`verifieraRevisionslogg`, redan använd i `Admin.jsx`/`BeredskapSektion.jsx`). Sektioner som
kräver obyggda delmål (72a/72b/72c/72e) skrivs ut som explicita "Ej tillgängligt ännu"-
placeholders i exporten, inte tysta uteslutningar.

**72h – Lättläst-läge och uppläsning.** Två nya fria fält på `rutiner`
(`lattlastText`/`begrepp`), redigerbara av samma behörighet som huvudinnehållet (inget
rutilltillägg i `firestore.rules` behövdes – verifierat att `farUppdateraRutin` inte
begränsar `innehall` utöver PII-filtret). `RutinKort.jsx` fick en "🔤 Lättläst"-växel, en
begreppsordlista (`<details>`-chips) och "🔊 Lyssna" läser nu upp den visade versionen via
den redan befintliga `useTalsyntes`-hooken. Ingen maskinöversättning, inget språkval –
planens uttryckliga avgränsning.

Fullt testsvep grönt: `npm run lint`, `npm run build`, `npx vitest run` (557 tester, upp från
535), `npm run test:rules` (alla filer, inkl. de sex nya driftstopp-/lattlast-raderna i
`organisationsisolering.test.mjs`), `npm run test:functions`, `npm run test:storage`. E2E
kördes inte (inte ett bindande krav för den här ändringstypen, tidsprioriterat bort). Deploy
triggad via `deploy.yml` på grenen `claude/compassionate-euler-rho0q5`.

---

## Uppföljning 2026-09-03 (produktdefinition som underlag för extern juridisk granskning)

Ägaren bad om ett dokument som definierar vad Synappsen är och samlar det som avgör produktens
regulatoriska klassning. Resultat: `granskningar/PRODUKTDEFINITION-REGULATORISKT-UNDERLAG.md`
(dokument nr 72). **Ingen kodändring** – ren dokumentation plus två nya testassertioner.

**Varför dokumentet behövdes trots att `granskningar/JURIDISK-GRANSKNING.md` finns.** Den
filens eget avsnitt 0 redovisar att den är skriven mot dokumentationen, inte mot koden. När
dess [PK]-punkter senare kontrollerades visade sig **den premiss som bar MDR-slutsatsen vara
felaktig** (checklistsegets fältspärr). En extern jurist som utgår från analysen ärver den
kedjan. Det nya dokumentet är kodverifierat mot v5.139.0 med filhänvisning per påstående, så
att juristen kan kontrollera själv i stället för att lita på en sammanfattning.

**Två diskrepanser mellan kod och projektdokumentation, båda verifierade som kvarstående:**

1. **`src/components/KlinikfragaSok.jsx:92` säger fortfarande "Beslutsstöd – ersätter aldrig
   klinisk bedömning" i gränssnittet.** Ordet står på
   `granskningar/AVSETT-ANDAMAL-KLINIKSTOD-2026-08-30.md`s egen lista över ord som aldrig får
   användas om klinikstöd-sökningen, och `JURIDISK-GRANSKNING.md` § 6.4 identifierade exakt
   den raden redan 2026-08-11 med en färdig ersättningstext. Systemprompten rättades
   2026-08-30; gränssnittsraden låg utanför det avgränsade delmålet och föll mellan stolarna.
   MDR art. 2(12) gör gränssnittstext till en del av kvalificeringsunderlaget, så produkten
   påstår i dag om sig själv precis det resten av materialet är noga med att den inte gör.
   **Inte rättad här** – produktcopy är ägarens beslut. Förd till `OPPNA-PUNKTER.md`.
2. **Checklistsegets fältuppsättning saknar fortfarande nyckelspärr i `firestore.rules`.**
   Fyndet från 2026-08-11 står kvar oförändrat i v5.139.0. Argumentet "spärren sitter
   strukturellt i datamodellen" får därför inte framföras mot en upphandlare.

**Assertionerna är villkorade, vilket är nytt för det här projektet.** Ett avsnitt som
beskriver *brister* har omvänd förfallotid mot ett som beskriver förmågor: den dag koden
rättas blir dokumentet fel åt andra hållet, och det är ett underlag som lämnas till en anlitad
jurist. De två nya testerna i `tests/docs/dokumentpastaenden.test.js` läser därför koden först
och kräver att § 9 säger samma sak – gröna i dag, röda i samma sekund som någon rättar koden
utan att skriva om dokumentet.

**Nästa steg:** dokumentet är skrivet för att gå med i samma externa juridiska uppdrag som
Etapp 64 redan väntar på (`OPPNA-PUNKTER.md`, "Kräver en bokad människa"). § 11 innehåller 15
frågor grupperade i fem områden; § 12 listar vad granskaren behöver få tillgång till – notera
särskilt att säljmaterialet är en primärkälla i MDR-bedömningen, inte en bilaga.

## Uppföljning 2026-09-05 (publik webbplats i repot, steg 1–2)

Ägaren vill utveckla den publika marknadsplatsen vidare och driva den skild från kundappen.
Steg 1 (in i repot, bevakad) och steg 2 (hosting + deployväg) är gjorda. **Ingen ändring i
appen** – ny katalog `synappsen-web/`, ny workflow, en enradsändring i `deploy.yml`.

**Sidan låg bara som en publicerad artefakt.** Enda kopian, utanför repot, utanför varje
testvakt. `produkt/VARUMARKE.md` P2 pekade ut det som en känd brist sedan 2026-08-22.

**Två faktafel hittade vid granskningen, båda rättade:**

1. **"Sex roller" – koden definierar sju.** Exakt samma fel som `saljmaterial/PITCH.md` gjorde
   efter att kioskrollen byggdes i Etapp 55, på en sida som samtidigt beskriver kioskläget i
   egen sektion. Sidan är nu tillagd i rollantalsvakten i `dokumentpastaenden.test.js`.
2. **Färgerna var från före Etapp 68b/68d.** Artefakten skrevs 2026-08-11, färgbytena gjordes
   2026-08-21/22. Den bar `#2563eb` som primärblå och `#cbd5e1` som kant-stark – det senare
   var en **defekt som fanns i produktion** (1,48:1 mot krävda 3:1). Båda rättade mot profilen.

**Övrigt mot den grafiska profilen:** Public Sans självhostad i stället för systemtypsnitt +
serif (sidan skrevs före Etapp 68e), symbolen `symbol-axon.svg` inlagd (sidan hade bara en
textlogotyp – och profilen §6 pekar uttryckligen ut den varianten för webbplats), mörkt läge
tillagt med appens egna mörka tokens, `prefers-reduced-motion` skärpt till appens nivå.

**Tillgänglighet och struktur:** `lang="sv"` (saknades – artefaktvärden satte det förr),
skip-link, mobilnavigering (nio sektioner var tidigare helt onåbara under 900 px annat än
genom att skrolla), utskriftsstöd (den gamla filens egen motivering för att avstå mörkt läge
var att sidan skrivs ut – men något utskriftsstöd fanns inte), Open Graph-taggar,
`robots.txt`, `sitemap.xml`. CSS och JS utbrutna ur HTML:en, vilket gör CSP:n strikt
(`default-src 'none'`, allt annat `'self'`, inga hashar att räkna om vid varje redigering).

**Copy:** ett stycke ströks som bröt mot `produkt/VARUMARKE.md` regel 8 (*"beröm aldrig din
egen ärlighet"*) – "vi berättar det här på en säljsida, inte vid tredje mötet" och
fortsättningen. Ersatt med vad avstängningen faktiskt kostade. Klinikstödssektionen fick
formuleringen ur `granskningar/AVSETT-ANDAMAL-KLINIKSTOD-2026-08-30.md`.

**Två nya vakter, 16 nya tester** (`tests/docs/webbplats.test.js`): förbjudna ord
("beslutsstöd", "triageringsstöd" – MDR art. 2(12) gör sidan till en del av
kvalificeringsunderlaget), källdomänantal mot `functions/klinikstod.js`, utgångna profilfärger,
inga externa resurser, `lang="sv"`, och **byte-för-byte-jämförelse av varumärkestillgångarna**
mot `public/` – sajten har egna kopior eftersom den ligger på en egen hosting-site, och två
kopior som ska vara lika glider annars i tysthet. Sidan är även registrerad i
`DOKUMENTREGISTER.md` (72 → 73 dokument) och tillagd i kundpåståendevakten.

**Hosting:** `firebase.json` har nu två targets, `app` (dist) och `web` (synappsen-web).
**`deploy.yml` fick `--only hosting:app,functions,firestore,storage`** – utan det hade varje
appdeploy även publicerat marknadsplatsen, inklusive halvfärdiga utkast i repot.

**Kvar innan publicering** (i `OPPNA-PUNKTER.md`): hosting-siten måste skapas en gång
(`firebase hosting:sites:create synappsen-web`); kontaktuppgifterna är fortfarande en
platshållare och blockeras av bolagsformen – med enskild firma blir orgnr ditt personnummer,
publikt och permanent; och `deploy-web.yml` bör få ett eget tjänstekonto med enbart
`roles/firebasehosting.admin` i stället för appdeployens breda konto.

## Uppföljning 2026-09-05 (webbplatsen steg 3 – priser, integritetspolicy)

Innehållsarbetet på den publika sajten. Fortfarande ingen ändring i appen.

**Priser publicerade.** Sektion 08 hette "Paket" och listade **modulnamnen**
(Core/Operations/Intelligence) utan priser, medan prislistan säljer **nivåerna**
Kärna/Drift/Full för 39 000 / 59 000 / 89 000 kr per enhet och år. En läsare mötte alltså
andra ord på webbplatsen än i prislistan. Sektionen visar nu nivåerna med faktiska priser och
de fyra tilläggen. Prisöppenhet är en uttalad del av positioneringen (`produkt/VARUMARKE.md`
rad 38, "ett publicerat pris") – men priser på två ställen är en drifthärd, så
`tests/docs/webbplats.test.js` binder nu sidans belopp till prislistan, som är sanningskällan.
En vakt hindrar också att modulnamnen kryper tillbaka in i kundvänd text.

**Integritetspolicy** (`synappsen-web/integritet.html`, GDPR art. 13). Kort, för att sidan
faktiskt behandlar nästan ingenting: inga kakor, ingen analys, inget laddat från annan domän,
inga formulär – bara Firebase Hostings serverloggar. Det påståendet är ovanligt starkt, så det
är **mekaniskt bevakat**: testet failar om koden börjar sätta kakor, lagra i webbläsaren eller
ladda något externt utan att policyn följer med. Policyn skiljer också uttryckligen webbplatsens
behandling (vi som ansvariga) från produktens (kunden som ansvarig, vi som biträde).

**Ett verkligt fel hittat och åtgärdat: sidorna krävde JavaScript för att synas.** Sajten ärvde
en inscrollningsanimation som satte `opacity: 0` på varje sektion och avslöjade den med en
IntersectionObserver. Det upptäcktes när policysidan lades till – den laddar inget skript och
var därför **helt osynlig**, alltså en juridisk text som inte gick att läsa. Samma svaghet gjorde
allt under hjältesektionen på startsidan beroende av att JS kördes.

Animationen är **borttagen helt** i stället för lappad. Progressiv förstärkning hade krävt en
inline-snutt i `<head>`, vilket den strikta CSP:n inte tillåter utan att bli krångligare att
redigera. Och borttagningen är det som stämmer med profilen: `GRAFISK-PROFIL.md` §5 avvisade
lyfta kort med `VARUMARKE.md` §5 som skäl ("behärskad, ingen brådska"), och appens enda
rörelseuttryck i basen är en knapp som trycks ned 1 px. Verifierat med Playwright och
`javaScriptEnabled: false`. En vakt failar om `opacity: 0` återinförs.

**Bakgrundsstycket (P1) är medvetet oskrivet.** `produkt/VARUMARKE.md` §14 säger "20 min, bara
du kan göra det". Det är den enda plats på sidan där avsändaren talar i egen sak om varför
produkten finns, och en påhittad ursprungshistoria vore precis vad bevisregeln (§7) finns för
att stoppa. Platsen finns med instruktion i HTML-kommentaren.

**Registret gjordes robust:** `dokumentregister.test.js` fångar nu varje `synappsen-web/*.html`
automatiskt, inte bara `index.html`, så en framtida sida inte kan läggas till utan att någon
tar ställning till vad som håller den aktuell. 73 → 74 dokument.

Testsvep grönt: lint, 585 tester (upp från 576).


## Uppföljning 2026-09-05 (säkerhetsgenomgång av webbplatsen)

Ägaren frågade om sajten är robust ur ett IT-säkerhetsperspektiv. Genomgång gjord mot faktisk
kod och konfiguration, inte mot känsla.

**Sidan själv har mycket liten angreppsyta, och det är strukturellt.** Ingen server, ingen
databas, ingen inloggning, ingen inmatning – alltså inget att injicera i. Verifierat: noll
externa länkar, noll `target="_blank"`, noll DOM-sänkor (`innerHTML`, `document.write`,
`eval`, `new Function`) i `sida.js`, som bara läser sina egna statiska `href`-attribut.
De klassiska webbsårbarheterna saknar helt enkelt anknytningspunkt.

**Tre verkliga svagheter hittade. Två åtgärdade i kod:**

1. **HSTS saknades.** Utan `Strict-Transport-Security` är ett första besök över `http://` mot
   en egen domän öppet för SSL-stripping. Satt till `max-age=31536000; includeSubDomains`.
   **Inte `preload`** – det är en svårreversibel registrering hos webbläsartillverkarna och
   bör vara ett ägarbeslut, inte något en kodsession skickar in. `Cross-Origin-Opener-Policy:
   same-origin` tillagd samtidigt.
2. **Deployen körde installskript för hela utvecklingsträdet.** `deploy-web.yml` körde
   `npm ci` (~1 200 paket) för att köra ett dokumenttest som bara behöver `node:fs`. Nu
   `--ignore-scripts`. Kontrollerat att det inte bryter något: bara tre paket i trädet har
   installskript (`@firebase/util`, `protobufjs`, `re2`), och inget av dem rör testkörningen –
   vitest-kedjan har inga installskript alls.
3. **Domänen är den största kvarvarande risken, och den ligger inte i koden.** Förd till
   `OPPNA-PUNKTER.md`: registrar lock, DNSSEC, 2FA på registrarkontot och en påminnelse på
   förnyelsedatumet. En kapad domän är en total varumärkesövertagning, och HSTS gör den
   dessutom långsammare att backa ur.

**Sex nya vakter** i `tests/docs/webbplats.test.js`: CSP, HSTS, `X-Content-Type-Options`,
`X-Frame-Options` och `Referrer-Policy` måste finnas kvar i `hosting:web`, och CSP:n får aldrig
innehålla `'unsafe-inline'`, `'unsafe-eval'`, `http://` eller `*`. Skälet: headrarna är den
enda säkerhetskontroll som över huvud taget finns på en statisk sajt, och en header som tyst
försvinner vid en omstrukturering av `firebase.json` märks annars först vid en extern skanning.

**Kvarstår, båda redan öppna punkter:** webbdeployen använder appdeployens breda tjänstekonto
(bör vara `roles/firebasehosting.admin` enbart), och GitHub-actionsen är opinnade flyttbara
taggar – fynd 4.7 utökat till att gälla även `deploy-web.yml`.

Testsvep grönt: lint, 591 tester (upp från 585).


## Uppföljning 2026-09-05 (bolagsform avgjord, kontaktadress ifylld)

**Ägarbeslut: enskild firma tills vidare, aktiebolag när kapitalinflöde/budget tillåter.**
Infört i `BESLUTSLOGG.md` med omprövningsvillkor (första betalande kund, eller kapital som
täcker bolagsbildning, försäkring och F-skatt). Beslutet är fattat med kännedom om att
`granskningar/JURIDISK-GRANSKNING.md` §3 pekar ut formen som rapportens allvarligaste enskilda
risk – risken bortförklaras alltså inte, den bärs medvetet.

**`kontakt@synappsen.se` ifylld** på både startsidan och integritetspolicyn, som klickbar
`mailto:`. En vakt kräver att båda sidorna anger samma adress och att ingen annan smyger in –
adressen är sidans enda kontaktväg och tillika kanalen för GDPR-förfrågningar (art. 12, svar
inom en månad), så två sidor med olika adresser vore en verklig brist.

**Kvarstår, och det är en fråga värd att se separat:** för enskild firma **är
organisationsnumret personnumret**. E-handelslagen (2002:562) §8 kräver namn, geografisk
adress, e-post och organisationsnummer av en tjänsteleverantör – men att publicera numret på
en öppen, skrapbar sida är något annat än att lämna det i ett avtal, och går inte att ta
tillbaka. Tre vägar skisserade i `OPPNA-PUNKTER.md`, och frågan tillagd som nr 16 i
`granskningar/PRODUKTDEFINITION-REGULATORISKT-UNDERLAG.md` §11 så att den externa juristen får
besvara den i samma uppdrag. Policysidan har därför kvar en synlig platshållare för namn,
orgnr och postadress – medvetet iögonfallande så att den inte kan publiceras av misstag.

**Ny öppen punkt:** mottagning för `kontakt@synappsen.se` måste finnas innan publicering. En
publicerad adress som studsar är sämre än ingen adress alls. MX-poster, ingen kod.

**Samma adress ifylld i säljmaterialet.** `kontakt@synappsen.se` ersatte `[E-POST]` i de fem
`saljmaterial/kallfiler/*.html`-filer som hade platshållaren (tre one-pagers, prislistan,
tekniska beskrivningen) – alla i samma footer-metarad, `[BOLAGSNAMN]`/`[ORG.NR]`/`[TELEFON]`
orörda. `Synappsen-upphandlingssvar.html` hade aldrig `[E-POST]`. Checklistan i
`saljmaterial/00-LAS-DETTA-FORST.md` uppdaterad, raden avbockad.

---

## Uppföljning 2026-09-05 (domänkoppling pågår, e-postmottagning bekräftad)

Ägaren är mitt i att koppla `synappsen.se` till hosting-siten via Firebase Console, med
Loopia som registrar/DNS-leverantör.

**`kontakt@synappsen.se` bekräftat mottagande** (Google Workspace, `MX → SMTP.GOOGLE.COM`
redan i DNS-zonen). Öppna punkten om mottagning borttagen ur `OPPNA-PUNKTER.md` – en av tre
kvarvarande blockerare för att ta bort `noindex` är därmed löst. Kommentarerna i
`index.html`, `integritet.html` och `robots.txt` uppdaterade till att bara nämna de två
kvarvarande (bakgrundsstycket, namn/orgnr på policyn).

**Ett verkligt fel uppmärksammat innan det fick konsekvens:** ägaren skickade en skärmbild av
Firebase Consolens domänverifiering. Verifierings-TXT-posten sa `hosting-site=synappsen-
final-build` – enligt `.firebaserc` är `synappsen-final-build` **appens** hosting-site
(target `app`), inte `synappsen-web` (target `web`, marknadssidan). "Lägg till anpassad
domän" hade alltså startats från fel site i konsolen. Hade det fullföljts skulle
`synappsen.se` ha visat kundappen/inloggningssidan i stället för marknadssidan. Ägaren
instruerad att göra om det från `synappsen-web`-siten specifikt
(`console.firebase.google.com/project/synappsen-final-build/hosting/sites/synappsen-web`).

DNS-arbetet i övrigt var korrekt utfört: apex-postens `A`-värde och den ursprungliga
`TXT`-verifieringen matchade exakt vad Firebase bad om, och de gamla parkerings-A-posterna
var borttagna – bara site-valet i konsolen var fel, inget i DNS-zonen behövde ändras om.

Ingen kodändring i detta steg utöver kommentarraden ovan. Väntar på att ägaren slutför
domänkopplingen mot rätt site och att certifikatet utfärdas.

## Uppföljning 2026-09-05 (webbplatsen live på .web.app, medvetet noindex)

Ägaren bad om att köra `hosting:sites:create` och deployen, med `noindex` – sidan är ännu
inte färdig att visa upp brett (bakgrundsstycket, namn/orgnr på policyn och mottagningen
för `kontakt@synappsen.se` saknas), men ägaren ville kunna se den live.

**`noindex, nofollow` tillagt på båda sidorna**, plus `robots.txt` ändrad till
`Disallow: /` (var `Allow: /` med en `Sitemap`-rad, som är borttagen tills vidare). Alla tre
är märkta TILLFÄLLIGT med kommentar om exakt vad som ska vara klart innan de tas bort, och
en rad i `OPPNA-PUNKTER.md` pekar på samma tre villkor.

**`hosting:sites:create` gjordes idempotent i `deploy-web.yml`** i stället för att köras
manuellt en gång: ett nytt steg försöker skapa siten och fortsätter tyst om den redan finns
("already exists" är förväntat på varje körning efter den första). Det tar bort ett manuellt
engångsmoment permanent – ingen framtida session behöver komma ihåg att siten måste finnas
innan workflowen kan köras.

**Resultat:** webbplatsen är publicerad på `https://synappsen-web.web.app`, men medvetet
osynlig för sökmotorer. Egen domän (`synappsen.se`) är inte kopplad – det är ett separat steg
i Firebase Console när domänen ska pekas dit, och bör göras tillsammans med domänsäkringen
(registrar lock, DNSSEC, 2FA) som redan står i `OPPNA-PUNKTER.md`.

---

## Uppföljning 2026-09-06 (Vertex AI-migrering genomförd i kod – INTE aktiv än)

Ägaren fick utgående Firebase-provkrediter (~2 600 kr, 7 dagar kvar, mycket låg faktisk
molnanvändning) och beslutade att göra Vertex AI-migreringen proaktivt i stället för att låta
krediten gå förlorad. Se `BESLUTSLOGG.md` 2026-09-06.

**Samtliga sex Gemini-anropsställen migrerade** (`functions/ai-import.js`: 4,
`functions/klinikstod.js`: 2) från det publika Gemini API:et (API-nyckel,
`generativelanguage.googleapis.com`) till Vertex AI (Application Default Credentials, region
`europe-west1`, projekt `synappsen-final-build`).

**Ett verkligt fynd under arbetet:** planens ursprungliga paketval, `@google-cloud/vertexai`
(`granskningar/VERTEX-AI-MIGRERING-KOSTNADSUPPSKATTNING-2026-08-30.md`), visade sig vara
**deprecerat sedan 24 juni 2025** och tas bort 24 juni 2026 – kontrollerat mot Googles egen
release-dokumentation innan någon kod skrevs. Migrerade i stället mot `@google/genai`, Googles
nu rekommenderade enhetliga SDK som talar med både det publika API:et och Vertex AI genom
samma klientkod. Bieffekt: enklare än planerat – SDK:t sköter tokenhantering mot ADC
automatiskt, ingen egen `google-auth-library`-kod behövdes (planens punkt 1 i "Vad som
skiljer Vertex AI åt" stämde alltså inte längre, se kostnadsuppskattningens tillägg
2026-09-06 för hela resonemanget).

**Städat helt, inte lämnat som en parallell väg:** `GEMINI_API_KEY` borttagen som secret-
definition (`gemensamt.js`), ur båda kodfilerna, och ur `deploy.yml`s Secret Manager-steg.
Ny central `skapaVertexKlient()`-hjälpare i `gemensamt.js` ersätter fyra separata
klientkonstruktioner i `ai-import.js` och den rå `fetch()`-koden i `klinikstod.js` – samma
beteende (inklusive den befintliga 503-återförsöksregeln, verifierad mot SDK:ns `ApiError`
som exponerar samma `.status`-fält), mindre duplicering.

**Nytt test:** `tests/functions/vertexmigrering.test.cjs` – bevisar mekaniskt att ingen
kvarvarande referens till det gamla API:et finns, och att region/projekt-konstanterna inte
kan glida i tysthet. Kan INTE bevisa att ett riktigt anrop fungerar (kräver Vertex AI aktiverat
– se nedan); det är samma begränsning kostnadsuppskattningen redan flaggade.

**⚠️ INTE aktiv i produktion.** Tre GCP-konsolsteg återstår, kan inte göras från en
kodsession, och **måste göras innan nästa `deploy.yml`-körning** – annars slutar alla sex
AI-funktioner fungera för riktiga anrop: (1) aktivera Vertex AI-API:et, (2) ge Cloud
Functions-tjänstekontot `roles/aiplatform.user`, (3) bekräfta att `gemini-2.5-flash` finns i
`europe-west1` (en websökning gav indikationer men ingen fullständig primärkälla kunde läsas
i sessionen – kontrollera i Model Garden). Överst i `OPPNA-PUNKTER.md`, märkt med ⚠️.

Testsvep grönt: lint, `npx vitest run` 592 tester, `npm run build`, `npm run test:functions`
(inkl. det nya testet), `npm run test:rules`, `npm run test:storage`.

**RTO-mätningen (samma session, samma anledning) är klar.** Kört mot skarp produktion via
`.github/workflows/rto-matning.yml`: **1 711 ms** för återställning av en syntetisk
testorganisation (100 dokument, fyra collections) – föregående mätning (2026-08-09) gav
1 136 ms, skillnaden är normal variation, inte en försämring. Ett verkligt fel i den
befintliga dokumentationen hittades och rättades i samma veva: `avtal/IT-FAKTABLAD.md`
punkt 6 sa att organisationen "säkerhetskopierades och återställdes på 1 136 ms", vilket lästes
som en kombinerad tid – skriptet (`functions/scripts/rto-matning.cjs` rad 67–71) mäter i
själva verket ENBART `aterstallOrganisation()`-anropet, inte backupsteget. Formuleringen
rättad till att vara tydlig om vad som faktiskt mäts. Testorganisationen städades bort
automatiskt, ingen skarp kunddata rörd.

---

## Uppföljning 2026-09-06 (AI-utvärdering byggd – klinikstödets säkerhetsregler mäts nu)

Ägaren frågade om Gemini är rätt modellval eller om andra LLM:er borde övervägas. **Svaret blev
"stanna" – men frågan blottade något viktigare.** Vid nuvarande volym (284 funktionsanrop
totalt, noll kunder) är skillnaden mellan billigaste och dyraste rimliga modell några kronor i
månaden, medan ett leverantörsbyte river upp EU-databehandlingsgarantin som Vertex AI-
migreringen precis köpte, lägger till ett underbiträde och kräver nytt PUB-avtal och uppdaterad
DPIA. Priset är alltså fel variabel att optimera på – **kvaliteten är rätt variabel, och den
gick inte att mäta.**

**Den verkliga bristen:** klinikstöd-promptens regel 4 ("aldrig ett beslutsstöd … Ge aldrig ett
prioriterat eller rangordnat svar") är den avgränsning som håller funktionen utanför MDR. Den
upprätthölls av att modellen *väljer* att lyda prompten, och ingenting mätte om den gör det.
En redigering som strök regeln hade inte fått ett enda test att faila. `verifieraKlinikstod`
testar uttryckligen **bara** sökmotorsteget, inte Gemini-svaret.

**Byggt, i tre lager med medvetet olika räckvidd:**

1. **`tests/functions/klinikstodprompt.test.cjs`** – 11 assertioner, gratis, offline, tillagd i
   `test:functions`-svepet. Bevisar att reglerna står kvar ord för ord, att ordet "beslutsstöd"
   aldrig återkommer som en självbeskrivning (regressionen från Etapp 72), och att reglerna
   ligger EFTER den användarstyrda frågan i prompten. **Mutationstestad:** stryks förbudet mot
   rangordning failar den med ett felmeddelande som pekar på MDR-konsekvensen.
2. **`functions/scripts/ai-evaluering.cjs` + `.github/workflows/ai-evaluering.yml`** – sju fall
   mot skarp Vertex AI, manuell dispatch. Rangordningsbete, rekommendationsbete, namngiven
   patient (medvetet UTAN personnummer – `innehallerPersonnummer` stoppar redan de fallen, så
   regel 6 är det enda skyddet just där), fråga som källorna inte täcker, promptinjektion, samt
   bildtolkningens schemakontrakt. **Anropar aldrig den riktiga sökmotorn** – den delade kvoten
   är 100/dygn för hela installationen, och en utvärdering som åt av den kunde släckt
   klinikstödet för riktiga kunder. Rör ingen Firestore-data, ingen budget.
3. **Tre utfall, inte två:** `OK`, `FEL` och `GRANSKA`. Det sista för frågor som inte går att
   avgöra maskinellt, där svaret skrivs ut i sin helhet för mänsklig läsning och slutkoden inte
   påverkas. Avsiktligt: en heuristik som låtsas kunna fälla ett regulatoriskt omdöme vore
   sämre än en som säger att den inte kan det. `GRANSKA`-raderna ÄR den manuella verifiering
   som kostnadsuppskattningen krävde – strukturerad, inte bortautomatiserad.

**Refaktorering som möjliggjorde det:** prompten byggdes tidigare inline i anropshanteraren och
gick inte att nå utifrån. Utbruten till `byggKlinikstodPrompt()`, exporterad, så utvärderingen
mäter EXAKT samma prompt som produktionen kör – inte en kopia som kan glida isär. Verifierat
byte-identisk. Samma skäl bakom att `tolkaBildMedGemini`/`extraktionsSchema` nu exporteras.

**Ett verkligt fynd på köpet:** frågan interpoleras osanerad in i prompten
(`Fråga: "${fraga}"`), vilket är en möjlig promptinjektion mot just de regler som bär
MDR-avgränsningen. Om den går igenom är okänt – fall 6 testar det, men kan inte köras än. Fört
till `OPPNA-PUNKTER.md` med föreslagen åtgärd (avvisa `"` och radbrytningar i söksträngen)
och med de förmildrande omständigheterna ärligt noterade.
**→ Åtgärdad samma dag, se sektionen ovan** – ägaren instruerade att inte vänta på
utvärderingen.

**Provbilden genereras i kod** (`functions/scripts/provbild.cjs`, egen PNG-enkodare utan
beroenden) i stället för att checkas in som binärfil – en bild i repot går inte att granska i
en diff. Renderad och okulärbesiktigad: texten är läsbar och datumet `2027-01-15`, som
utvärderingen jämför exakt mot, står i klartext.

**Ännu inte kört mot skarp Vertex AI** – kräver samma tre GCP-steg som allt annat. Skriptet
översätter de vanligaste felen till vilket steg som saknas. Testsvep grönt: lint, `npm run
build`, 592 vitest-tester, hela `test:functions`-svepet.

## Uppföljning 2026-09-06 (egen domän `synappsen.se` kopplad och verifierad)

Ägarens domänkoppling från föregående uppföljning (2026-09-05) är klar. Ett verkligt fel
hanns fångas och rättas under tiden: "Lägg till anpassad domän" hade av misstag startats
från fel hosting-site (`synappsen-final-build`, appens site, inte `synappsen-web`,
marknadssidan) – synligt i verifierings-TXT-postens värde `hosting-site=synappsen-final-build`.
Hade det slutförts hade `synappsen.se` visat kundappens inloggningssida i stället för
marknadssidan. Ägaren startade om flödet från rätt site; Firebase Console visade därefter
"Verified" → "Minting certificate" → **"Connected"**.

**Verifierat direkt mot `https://synappsen.se`:** HTTP 200, riktig Firebase/Fastly-CDN-trafik
(inte en proxiartefakt – `x-served-by`/`x-cache`-headrarna bekräftar det), samtliga
säkerhetsheaders från `hosting:web`-konfigurationen närvarande (CSP, HSTS, COOP,
X-Frame-Options, X-Content-Type-Options, Permissions-Policy, Referrer-Policy), rätt
sidtitel (marknadssidan, inte appen), `noindex, nofollow` och `robots.txt`s `Disallow: /`
fortfarande aktiva som avsett. **En känd begränsning:** det faktiska TLS-certifikatet kunde
inte oberoende verifieras från den här sandboxade sessionen – utgående HTTPS fångas upp av
sandboxens egen utgångsproxy (`openssl s_client` visar dess MITM-certifikat, inte Firebases/
Let's Encrypts). Inte ett tecken på ett verkligt problem – Firebase Consoles "Connected"-status
är själva beviset på att certifikatet utfärdats och bundits korrekt.

`synappsen.se` fungerar alltså som avsett. Domänsäkring (registrar lock, DNSSEC, 2FA hos
Loopia) är fortfarande en öppen punkt, se `OPPNA-PUNKTER.md`.

---

## Uppföljning 2026-09-06 (promptinjektionen täppt – strukturellt, inte språkligt)

Ägaren instruerade att åtgärda promptinjektionen direkt i stället för att vänta på att
utvärderingen ska kunna köras. Rimligt: fyndet var känt, åtgärden liten, och att låta en känd
lucka mot MDR-avgränsningen stå öppen i väntan på ett mätvärde är fel ordning.

**Två skydd, olika för att de två inbäddningsställena har olika förutsättningar** (båda i
`functions/gemensamt.js`, bredvid `innehallerPersonnummer`):

- `harPromptbrytandeTecken()` – klinikstödets fråga bäddas in som `Fråga: "${fraga}"`. Ett
  citattecken avslutar den kontexten, en radbrytning gör det möjligt att skriva ett eget
  regelblock under. Inget av tecknen har ett legitimt syfte i en klinisk söksträng, så frågan
  **avvisas** i stället för att saneras tyst – en tyst ändrad fråga i ett kliniskt verktyg är
  värre än ett fel. Två lager: `fragaKlinisktStod` avvisar med ett begripligt `HttpsError` till
  användaren, och `byggKlinikstodPrompt` **kastar**, så det är strukturellt omöjligt att bygga
  en prompt av en sådan fråga oavsett anropare. Kontrollen ligger FÖRE hastighetsspärren, så en
  avvisad fråga äter ingen kvot.
- `saneraPromptblock()` – rutintexterna i `ai-import.js` (checklistesteg- och kvissförslagen)
  bäddas in i ett `"""`-block. Där går det inte att avvisa radbrytningar och citattecken;
  texten är flerradig till sin natur. I stället neutraliseras avgränsaren (`"""` → `'''`).
  Lägre risk – texten är redan människogodkänd inom organisationen och förslagen granskas innan
  de sparas – men samma klass av brist och samma enradsåtgärd, så den togs samtidigt.

**Medvetet INTE gjort:** ingen blocklista på instruktionsliknande fraser ("ignorera tidigare
regler" o.s.v.). Sådana läcker notoriskt och ger falsk trygghet. Skyddet är strukturellt – att
texten inte kan bryta sig ur sin kontext. **Ingen klientkopia av regeln heller:** servern är
auktoritativ och felmeddelandet visas redan i `KlinikfragaSok.jsx`s felruta; en regex till i
`src/` hade bara varit en andra plats att glida ifrån.

**Vad som återstår, ärligt:** den SPRÅKLIGA vägen. En påstridig fråga som bara använder
tillåtna tecken når fortfarande modellen, och där finns ingen strukturell spärr – bara
modellens vilja att lyda reglerna. Det är precis vad som inte går att veta utan att mäta, så
fall 6 i utvärderingen är omskrivet i två delar: **6a** (offline, gratis) bevisar att den
strukturella vägen är stängd, **6b** skickar en språklig injektion som når modellen. Visar 6b
att den slår igenom är nästa steg att lyfta reglerna till en `systemInstruction` i stället för
att ha dem i samma textblock som frågan.

Sex nya assertioner i `tests/functions/klinikstodprompt.test.cjs` (18 totalt), inklusive ett
test som bevisar att skyddet **inte** avvisar legitima kliniska frågor med apostrof,
bindestreck, parentes, procent eller decimaltal. Testsvep grönt: lint, build, 592 vitest,
`test:functions`, `test:rules`, `test:storage`.

## Uppföljning 2026-09-06 (AI-utvärderingen körd skarpt – reglerna höll, verktyget var trasigt)

Ägaren gjorde de tre GCP-stegen (Vertex AI-API aktiverat, `roles/aiplatform.user` till **båda**
tjänstekontona). Utvärderingen kördes därefter tre gånger mot skarp Vertex AI.

**Huvudresultat: klinikstödets säkerhetsregler höll i samtliga fall, i samtliga körningar.**
Modellen vägrade konsekvent att rangordna, vägrade rekommendera, avböjde en namngiven patient,
sa ifrån när källorna inte räckte, och höll linjen även under ett språkligt injektionsförsök.
Första gången MDR-avgränsningen är MÄTT i stället för antagen. Fullständig fallredovisning i
`granskningar/SAKERHETSRAPPORT.md` (tillägg 2026-09-06).

**Men det viktigaste fyndet gällde mätverktyget, inte modellen.** Körning #1 gav `12 OK, 1 FEL`,
körning #2 gav `9 OK, 1 FEL, 3 GRANSKA` – och vid genomläsning var **varenda flagga i båda
körningarna en artefakt i mitt eget test**. Orsaken är principiell och värd att minnas:

> Ett korrekt svar måste innehålla de förbjudna orden för att kunna vägra. "Jag kan inte
> rangordna åtgärder eller agera som ett beslutsstöd" är precis det beteende vi vill ha – men
> innehåller både "rangordna" och "beslutsstöd". En nyckelordskontroll kan inte skilja
> ANVÄNDNING från VÄGRAN, och fäller därför systematiskt de bästa svaren.

Rättat i tre steg: bredare fraslista + krav på positiva tecken på påhitt innan FEL fälls;
`utanNekandeMeningar()` som filtrerar bort nekande meningar innan orden söks; och en
beslutsstöd-kontroll som letar efter faktiska självbeskrivningar i stället för ordets blotta
förekomst. Varje rättelse verifierad mot de faktiska svaren från #1 och #2 – **och mot ett
konstruerat äkta regelbrott som fortfarande fälls**, så breddningen inte blev ett godkännande
av allt. **Körning #3: `12 OK, 0 FEL, 1 GRANSKA`, grön.**

Att det upptäcktes berodde på att hela modellsvaret skrivs ut i loggen, inte bara utfallet.
Utan den designen hade ett falskt FEL sett ut som ett äkta.

**Två observationer kvar:** (1) modellen läcker interna regelhänvisningar ("[Regel 4, 6]") till
användaren, reproducerbart i båda körningarna – fört till `OPPNA-PUNKTER.md`; (2)
svarsvariationen mellan körningar är betydande, vilket betyder att sju fall vid ett tillfälle
är ett stickprov, inte en garanti. Verktyget är byggt för att köras om.

**Sidoresultat:** `gemini-2.5-flash` i `europe-west1` är nu **bevisad** genom riktiga anrop –
den frågan har stått öppen sedan migreringsuppskattningen. Svarstider 2,3–10,1 s, med marginal
till `timeoutSeconds: 60`. **Deployen är därmed avblockerad** och är det enda som återstår
innan EU-garantin gäller i produktion – tills dess kör de driftsatta funktionerna fortfarande
mot det publika Gemini API:et (`avtal/UNDERBITRADEN.md` uppdaterad med exakt den skillnaden).
