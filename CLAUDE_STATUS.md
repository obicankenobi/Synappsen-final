# Status & överlämning – läs mig först i en ny Claude Code-session

> Denna fil uppdateras löpande och är tänkt att läsas i BÖRJAN av en ny
> Claude Code-tråd om sessionen bytts (t.ex. efter kontext-kompaktering eller
> en helt ny konversation). Den ersätter INTE `UTVECKLINGSLOGG.md` (detaljerad
> historik) eller `ETAPPLAN.md` (den etappindelade planen) – den är en kort
> "var slutade vi och vad gör jag nu"-sammanfattning som pekar vidare dit.

**Senast uppdaterad:** 2026-07-28, version **5.45.3** – **DEPLOYAT TILL PRODUKTION** (körning
#52, commit `c7ed186`, verifierad grön). `ETAPPLAN3.md` (Etapp 13–21) är sedan dess helt
genomförd utom två medvetet pausade delmål (13f SSO, Etapp 16 veckopuls – båda väntar på ett
ägarbeslut, se `ETAPPLAN3.md`s statusblock). Ny plan `ETAPPLAN4.md` (Etapp 22–30) skrevs och
Etapp 22–25 samt en fristående UI-designjustering är nu klara och live – se den nya sektionen
längst ner i den här filen ("Uppföljning 2026-07-28") för fullständig sammanfattning av allt
som hänt sedan förra gången den här filen uppdaterades (v5.25.0/Etapp 14). **Läs den sektionen
FÖRST** om du undrar var arbetet står idag – resten av filen nedan är historisk, äldre
kontext.

> **OBS (2026-07-28):** punkt 1 nedan under "Så här jobbar vi" om `continue-on-error` i
> `deploy.yml` är FEL/INAKTUELL – den flaggan togs bort i Etapp 8b (`ETAPPLAN2.md`), långt
> innan denna fil senast skrevs om. Jobbets `conclusion`-fält ÄR pålitligt idag; ett riktigt
> `firebase deploy`-fel ger `conclusion: "failure"` på riktigt (bekräftat två gånger i skarpt
> läge 2026-07-28, se den nya sektionen längst ner). Läs ändå alltid loggtexten vid osäkerhet.

## Nuläge i ett stycke

Etapp 1–5 (ETAPPLAN.md) är genomförda. Efter dem gjordes en fristående
kodgenomgång som resulterade i `ETAPPLAN2.md` (Etapp 6–11). Användaren bad om
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
finns, markerad `[FYLLS I]`. 13e uppdaterade `PITCH.md` (version 5.7.0 → 5.25.0) och
**rättade ett sakfel:** dokumentet påstod att klinikstöd-sökningen "hämtar live" svar,
men funktionen är i själva verket medvetet pausad i gränssnittet sedan v5.3.5 – omskrivet
till att öppet berätta det.

**13g klart (13f avvaktar på ägarens instruktion):** fyra WCAG-A-brister från fas 34/SYN-6
åtgärdade i kod – "hoppa till innehåll"-länk + `<main>`-landmärke, dynamisk sidtitel per
rutt (`useSidTitel`), tillgängligt namn på adminpanelens rollväljare, och
bekräftelsedialogen (`DialogProvider.jsx`) stängs nu med Esc, håller kvar fokus (Tab-cykel)
och återlämnar det vid stängning. `TILLGANGLIGHETSREDOGORELSE.md` uppdaterad med status
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

## Vad som återstår (uppdaterad 2026-07-28 – se `ETAPPLAN4.md` för den aktiva planen)

- **`ETAPPLAN4.md` Etapp 26–30** – medarbetarens röst (föreslå ändring), skanna i förrådet,
  kundens egen profil, riktig offline, snabbhet/WCAG AA. Inte påbörjade.
- **13f (SSO/Entra ID)** och **Etapp 16 (veckopuls)**, båda i `ETAPPLAN3.md` – medvetet
  pausade, väntar på ett ägarbeslut vardera (se den filens statusblock).
- **Etapp 10a (demoläge/sandlåda)** i `ETAPPLAN2.md` – enda ej genomförda delmålet i Etapp 10.
- **Kioskläge** (`FEATURE.KIOSK_MODE`) – reserverad flagga, aldrig byggt UI bakom den.
- **Etapp 11 (Intelligence 2.0)** – uttryckligen villkorad: bör vänta tills minst en kund
  faktiskt betalar för Intelligence-modulen.
- `void _id`-mönstret som en extern kodgranskning påpekade – bedömdes som en
  svag föreslagen lösning, inte åtgärdat, se UTVECKLINGSLOGG.md Fas 23.
- Organisatoriska moment (faktisk pilotdrift, säljlansering) – kan inte göras i kod, kräver
  beslut/aktivitet av användaren utanför denna session.

## Så här jobbar vi i det här projektet (etablerade mönster – följ dessa)

1. **Deploy till produktion** görs ALLTID via GitHub Actions-workflowen
   `deploy.yml` (trigger: `mcp__github__actions_run_trigger`,
   `run_workflow`, `workflow_id: deploy.yml`, ref: den aktuella
   arbetsgrenen). Polla med `actions_list`/`list_workflow_jobs` tills job är
   `completed`.
   **RÄTTAT 2026-07-28:** `continue-on-error` togs bort från "Deploya till
   Firebase"-steget redan i Etapp 8b (`ETAPPLAN2.md`) – jobbets
   `conclusion`-fält ÄR pålitligt, ett riktigt `firebase deploy`-fel ger
   `conclusion: "failure"` på riktigt (bekräftat i skarpt läge två gånger
   2026-07-28: en IAM-behörighetsfel och en Eventarc-propageringsfördröjning,
   se sektionen längst ner i den här filen). Läs ändå gärna den faktiska
   logg-texten via `mcp__github__get_job_logs` (`return_content: true`,
   `failed_only: true`) vid ett fel, för att se VILKET steg/funktion som
   faktiskt gick fel. Bekräfta produktionen med
   `curl -s https://synappsen-final-build.web.app/ | grep -o 'assets/index-[A-Za-z0-9_-]*\.js'`
   om du vill dubbelkolla asset-hashen. Rapportera resultatet på svenska.
2. **Verifiering före commit** (kör alltid hela svepet, alla ska vara gröna):
   `npm run lint`, `npm run build`, `npx vitest run`, `npm run test:rules`,
   `npm run test:functions`, `npm run test:storage`, `node -c functions/index.js`.
3. **Versionsbump** vid varje leverans: uppdatera `package.json` (OCH
   `package-lock.json`s två versionsfält). **`src/version.js` ska INTE
   uppdateras separat längre** (rättat 2026-07-28) – filen importerar numera
   `version` direkt från `package.json` (Vite/Rollup bearbetar JSON-importer
   vid bygget), efter att den låg fast på "5.26.0" i minst 19 releaser innan
   någon märkte det. Lägg också till en post överst i
   `src/data/andringslogg.js` (svensk, kort, användarvänlig ändringslogg) –
   samma glömska hände där också och krävde en separat fix.
4. **Dokumentation:** varje större fas/etapp får en ny sektion i
   `UTVECKLINGSLOGG.md` (kronologisk historik, "Fas N – rubrik"). Läs den
   filen för fullständig teknisk historik om du behöver detaljer om en
   specifik fix.
5. **Firestore/Storage-regler:** ett återkommande buggmönster (hittat och
   fixat 3+ gånger) är att `.data` på ett `get()`/`exists()`-resultat för ett
   dokument som inte finns ger `null`, och vidare fältåtkomst på `null`
   kraschar regelutvärderingen. Skydda alltid med `exists()` först.
6. **Lokal verifiering:** Firebase-emulatorer (`firebase emulators:start
   --project demo-test --only auth,firestore,functions,storage`) +
   Playwright (`chromium.launch({ executablePath:
   "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args:
   ["--no-sandbox"] })`) för att manuellt bevisa att UI-ändringar faktiskt
   fungerar i en riktig webbläsare, inte bara att testsviter är gröna.
7. **Git-gren:** allt arbete sker på `claude/compassionate-euler-rho0q5`,
   pushas dit. Skapa inte PR om inte användaren explicit ber om det (gäller
   detta repo/denna arbetsmiljö specifikt – kan skilja sig i andra kontext).

## Nyckelfiler att känna till

**Se `CLAUDE.md` för den fullständiga, underhållna dokumentkartan** (vilken fil är aktuell,
vilken är historisk, vilken är auktoritativ för vad). Kort version:

- `ETAPPLAN.md` (Etapp 0–5), `ETAPPLAN2.md` (Etapp 6–12), `ETAPPLAN3.md` (Etapp 13–21) –
  historiska men KORREKTA, status per delmål underhållen inline. Alla tre klara utom
  namngivna, medvetet pausade punkter (13f SSO, Etapp 16 veckopuls).
- `ETAPPLAN4.md` – **den aktiva planen** (Etapp 22–30). Etapp 22–25 + UI-designjustering
  klara, 26–30 kvarstår.
- `FRAMTIDSPLAN.md` – kort pekare mot ETAPPLAN4.md (skrevs om 2026-07-28, var stale sedan
  v5.7.0).
- `MODULPLAN.md` – modul-/affärsplan (skrevs om 2026-07-28, var stale sedan v5.10.0 – påstod
  bl.a. felaktigt att organisationsmodellen inte var byggd).
- `UTVECKLINGSLOGG.md` – fullständig kronologisk teknisk historik, "Fas 1–41+".
- `SAKERHETSRAPPORT.md` – säkerhetsgranskning av multi-tenant-lagret.
- `TILLGANGLIGHETSREDOGORELSE.md` – WCAG-status per punkt.
- `src/data/andringslogg.js` – användarvänd ändringslogg (visas i appen, `/nyheter`).
- `src/version.js` – läser version DIREKT från `package.json`, ska inte redigeras manuellt.
- `firestore.rules` / `storage.rules` – multi-tenant-säkerhetsmodellen,
  organisationsisolering, 2FA-policy, dokumentorganisation-cross-lookup.
- `functions/index.js` – Cloud Functions (AI-import, backup, migrering,
  modul-gating, kostnadshistorik, schemalagda jobb, push-notiser).
- `tests/rules/`, `tests/functions/` – emulator-baserade testsviter.

## Uppföljning 2026-07-28: allt sedan v5.25.0/Etapp 14 (läs detta för aktuell status)

**ETAPPLAN3.md (Etapp 13–21) färdigställdes helt** (utom 13f/16, se `ETAPPLAN3.md`s eget
statusblock för exakt vilka beslut som väntar på ägaren) – rollbaserad startvy, akutläge,
checklistläge, kompetenspaket, bristanmälan, källbevakning, m.m. Detaljer i
`UTVECKLINGSLOGG.md`.

**Ny plan `ETAPPLAN4.md` (Etapp 22–30) skrevs** efter en explicit förfrågan om funktioner med
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

## Om du är en ny Claude-session som läser detta

Fråga användaren vad nästa steg ska vara – det finns inget akut, oavslutat arbete. Om
användaren säger något i stil med "fortsätt där vi var" utan att specificera: hänvisa till
`ETAPPLAN4.md`s Etapp 26–30 (den aktiva planens återstående punkter) och fråga vilken de vill
prioritera, snarare än att gissa. Läs `CLAUDE.md` först om du är osäker på vilken fil som är
auktoritativ för vad.
