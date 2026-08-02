# Status & överlämning – läs mig först i en ny Claude Code-session

> Denna fil uppdateras löpande och är tänkt att läsas i BÖRJAN av en ny
> Claude Code-tråd om sessionen bytts (t.ex. efter kontext-kompaktering eller
> en helt ny konversation). Den ersätter INTE `UTVECKLINGSLOGG.md` (detaljerad
> historik) eller `ETAPPLAN.md` (den etappindelade planen) – den är en kort
> "var slutade vi och vad gör jag nu"-sammanfattning som pekar vidare dit.

**Senast uppdaterad:** 2026-08-02, version **5.65.0**. `ETAPPLAN7.md` (Etapp 42:
gränssnittsförnyelse) är den AKTIVA planen. **42e/42a/42b/42c är klara** (design-tokenrevision,
selektiv bulk-godkänn, den nya samlade "Godkännanden"-sidan, Nyheter i navigeringen, persistent
Akut-knapp) – 42d och 42f kvarstår, inget av dem påbörjat. `ETAPPLAN6.md` (Etapp 37–41) är
STÄNGD FÖRUTOM Etapp 40 (villkorad av en konkret ny kund). En deploy av v5.63.0 triggades via
`deploy.yml` tidigare samma session – utfallet var INTE bekräftat när den här filen senast
skrevs om (kontrollera `mcp__github__actions_list`/`actions_get` för senaste körning på
branchen om du undrar). v5.64.0 och v5.65.0 är INTE ännu deployade. `ETAPPLAN5.md` (Etapp
32–36: säkerhet) är i det närmaste klar men inte stängd. **Läs de TRETTON NYA sektionerna
längst ner i den här filen först** ("Uppföljning 2026-08-01", "Uppföljning 2026-08-01 (senare
samma dag)", "Uppföljning 2026-08-01 (Etapp 37a)", "Uppföljning 2026-08-01 (Etapp 37b)",
"Uppföljning 2026-08-01 (Etapp 37c)", "Uppföljning 2026-08-01 (Etapp 37d)", "Uppföljning
2026-08-01 (senare samma dag igen)", "Uppföljning 2026-08-01 (Etapp 38)", "Uppföljning
2026-08-02 (Etapp 39a/39b)", "Uppföljning 2026-08-02 (Etapp 39c/39d)", "Uppföljning
2026-08-02 (ETAPPLAN7 antagen)", "Uppföljning 2026-08-02 (Etapp 41)" och "Uppföljning
2026-08-02 (Etapp 42e/42a/42b/42c)") om du undrar var arbetet står idag – allt mellan denna
rad och dem (inklusive "Uppföljning 2026-07-28") är historisk, äldre kontext.

> **Denna fil ska uppdateras VARJE session där kod committas/pushas, ett ägarbeslut tas,
> eller en etapp blir klar – se den nya obligatoriska underhållsregeln i `CLAUDE.md` ("Regel:
> CLAUDE_STATUS.md"). Regeln finns för att "kom ihåg att uppdatera" bevisligen har
> misslyckats i det här projektet flera gånger tidigare (se bakgrundsstycket i `CLAUDE.md`).

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

## HISTORISKT: vad som återstod per 2026-07-28 (`ETAPPLAN4.md` var aktiv plan då – den är den INTE nu)

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
- `ETAPPLAN4.md` – Etapp 22–31. **Var den aktiva planen när det här stycket skrevs; är det
  inte längre** (`ETAPPLAN5.md` tog över, och sedan 2026-08-01 är `ETAPPLAN6.md` aktiv).
  Historisk men korrekt.
- `FRAMTIDSPLAN.md` – **arkiv över ej antagna planer** sedan 2026-08-01 (var dessförinnan en
  pekare mot den aktiva planen, och blev stale i den rollen två gånger).
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

## Uppföljning 2026-08-01: fem ägarbeslut i ETAPPLAN5.md + Etapp 33c byggd och deployad

**Kontext:** `ETAPPLAN5.md` (Etapp 32–36) hade sju öppna "beslutspunkter som kräver ägaren"
kvar. Användaren tog ställning till fem av dem i den här sessionen:

- **Etapp 33c (backup-retention):** 90 dagar. Inskrivet i `avtal/PUB-AVTAL-MALL.md` p. 6.
- **Etapp 34a (jourkontakt):** namn + telefonnummer ifyllt i `INCIDENT-CHECKLISTA.md`s
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
`ETAPPLAN5.md` (statusmarkeringar + beslutspunktslistan), `INCIDENT-CHECKLISTA.md`
(kontakttabell, nyckelrotationssektion, "Vad som ännu inte finns"-tabellen),
`SAKERHETSRAPPORT.md` (Del 3-sammanfattningen), `avtal/PUB-AVTAL-MALL.md` (p. 6).

**Kvarstår i ETAPPLAN5.md:** Etapp 32b (tre larmtyper, väntar på om ägaren vill betala för
Sentry API-token/GCP-faktureringsexport), ToS-genomgång för källbevakningens sju domäner,
Etapp 30b (fysiskt akutlägestest), och 35e:s uppföljning om några veckor (se ovan). När dessa
är avklarade väljs en av `ETAPPLAN5-ALT-A.md`/`-ALT-B.md` som nästa plan.

**Processfel hittat och åtgärdat i samma veva:** den här filen (`CLAUDE_STATUS.md`) hade
själv inte uppdaterats sedan 2026-07-29, trots att `CLAUDE.md` uttryckligen instruerar att den
ska hållas löpande – exakt samma minnesstyrda-istället-för-händelsestyrda mönster som redan
en gång orsakat att `SAKERHETSRAPPORT.md`/`FRAMTIDSPLAN.md`/`MODULPLAN.md` blev stale. Fixat
genom att skriva just den här sektionen, OCH genom att lägga till en ny obligatorisk,
händelsestyrd underhållsregel i `CLAUDE.md` ("Regel: CLAUDE_STATUS.md") – se den filen.

## Uppföljning 2026-08-01 (senare samma dag): ETAPPLAN6.md antagen som ny aktiv plan

**Ny aktiv plan:** `ETAPPLAN6.md` (Etapp 37–41, "Innehållet som håller: redaktionell kvalitet
och bevisad nytta"). Utgångsläge v5.56.0. Tesen är samma som `ETAPPLAN5.md`s, applicerad på
innehåll i stället för säkerhet: produkten är byggd för att innehåll ska skapas och godkännas
korrekt, men saknar förmågan att upptäcka när det som redan ligger där blivit gammalt eller
motsägelsefullt. Detaljerna hör hemma i planfilen – läs den, inte den här sammanfattningen.

**`ETAPPLAN5.md` är INTE stängd.** Etapp 32b, ToS-genomgången, Etapp 30b och uppföljningen av
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

1. **`FRAMTIDSPLAN.md` var inte det "arkiv för ej antagna planer" utkastet påstod.** Den
   pekade fortfarande på `ETAPPLAN4.md` som aktiv plan – elva releaser efter att `ETAPPLAN5.md`
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
hälsosiffra som **aldrig visas utan sin nedbrytning** (krav infört när `ETAPPLAN6.md`
antogs). Superadmin ser alla tre områden, VÖL/sektionsledare/VEC/förrådsansvarig ser bara sitt
eget. Ingen ny collection eller nytt Firestore-fält.

**Premisskontroll (krav 8) hittade två fel i planutkastet innan bygget, båda löstes genom att
INTE bygga det felaktiga kriteriet:** "aldrig visad" hade byggt på `visningar`-collectionen,
som bara skrivs vid sökträffar/kommandopalett – inte vid vanlig bläddring – och hade flaggat
nästan alla rutiner som aldrig lästa oavsett verklighet. "Saknade steg trots att
checklistläget är påslaget för organisationen" beskrev en organisationsväxel som inte finns;
checklistläge är en egenskap per rutin. Detaljerna står i `ETAPPLAN6.md` Etapp 37a.

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
`{id, titel, omrade, granskad}` – **aldrig per person** (krav 14 i `ETAPPLAN6.md`, verifierat
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
denna etapps eget klart-kriterium (se `ETAPPLAN6.md`: "minst hälften av flaggade par ska
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
Utlovad svarstid på ett ändringsförslag: **inom en vecka.** Löser `ETAPPLAN4.md`s tidigare
obesvarade beslutspunkt 3, uppdaterat i `ETAPPLAN6.md` (Etapp 38-sektionen + beslutspunkt 1).

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
Version 5.61.0 → **5.62.0**. Detaljer i `ETAPPLAN6.md`s nya sektion "39a/39b – Effekt över
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
anropar funktionerna direkt och kringgår HTTP-lagret. Detaljer i `ETAPPLAN6.md`s sektion
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
rekommendation, som användaren godkände som en ny etapplan: **`ETAPPLAN7.md`, Etapp 42 –
Gränssnittsförnyelse.** Premisskontroll (krav 8) vid antagandet visade att INGEN av
mockupernas centrala påståenden om att vara "lyfta direkt" från befintlig kod stämmer fullt
ut (se planens egen premisskontroll-tabell) – särskilt att en samlad, domänöverskridande
godkännandekö INTE finns idag (godkännande sker per sektion i `Sektionssida.jsx`), och att en
persistent Akut-knapp INTE finns idag (bara på `Hem.jsx`).

**`ETAPPLAN7.md` är nu den aktiva planen** (se `CLAUDE.md`s uppdaterade läsordning/dokumentkarta,
ändrad i samma veva). `ETAPPLAN6.md` är inte stängd men inte längre aktiv – dess kvarvarande
punkter (40, 41) väntar inte på ägarbeslut, bara på tur. Inget i `ETAPPLAN7.md` är påbörjat.

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
`ETAPPLAN6.md`s Etapp 41-sektion. Version 5.63.0 → **5.64.0**.

**INTE gjort ännu (vid det tillfället):** deploy av v5.64.0 till produktion. Se nästa sektion.

## Uppföljning 2026-08-02 (Etapp 42e/42a/42b/42c): fyra av sex delpunkter i gränssnittsförnyelsen klara

Byggde de tre första delarna av `ETAPPLAN7.md` på begäran ("genomför dem 3 första delarna").
Premisskontroll (krav 8) vid byggstart hittade två viktiga korrigeringar av planens egna
antaganden (fulla detaljer i `ETAPPLAN7.md`s "42e/42a/42b/42c ✅ KLARA"-sektion):

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

## Om du är en ny Claude-session som läser detta

Fråga användaren vad nästa steg ska vara – det finns inget akut, oavslutat arbete. Om
användaren säger något i stil med "fortsätt där vi var" utan att specificera: **den aktiva
planen är `ETAPPLAN7.md` (Etapp 42, gränssnittsförnyelse)** – 42e/42a/42b/42c är klara, nästa
är 42d (låg insats) eller 42f (mobilvy, kräver att beslutspunkt 2 om omfattning besvaras
först). `ETAPPLAN6.md` har bara Etapp 40 kvar (villkorad av en konkret ny kund) och
`ETAPPLAN5.md`s kvarvarande punkter kan tas närhelst de passar/blockeringen lossnar – ingen av
dem konkurrerar om samma kapacitet som `ETAPPLAN7.md` egentligen behöver, men fråga användaren
om prioritetsordning om det är oklart. Läs `CLAUDE.md` först om du är osäker på vilken fil som
är auktoritativ för vad – och notera dess underhållsregel för DEN HÄR filen innan du avslutar
sessionen. Om du ska verifiera en Cloud Function ELLER en Storage-filuppladdning i en
webbläsare mot emulatorerna i den här miljön: testa FÖRST med en redan fungerande funktion
(t.ex. `skickaFeedback`, eller den befintliga `bildUrl`-uppladdningen för förrådsartiklar)
innan du felsöker din egen kod – båda har en känd, dokumenterad begränsning i den här
specifika sandboxen som inte är kodens fel. Om du ska rendera en `.dc.html`-mockup eller något
annat som laddar skript från `unpkg.com`: samma CDN-blockering gäller där också – installera
paketen lokalt och fånga anropen med Playwrights `page.route()`, se ovan för exakt recept.
