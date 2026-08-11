# Status & överlämning – läs mig först i en ny Claude Code-session

> Denna fil uppdateras löpande och är tänkt att läsas i BÖRJAN av en ny
> Claude Code-tråd om sessionen bytts (t.ex. efter kontext-kompaktering eller
> en helt ny konversation). Den ersätter INTE `UTVECKLINGSLOGG.md` (detaljerad
> historik) eller `ETAPPLAN.md` (den etappindelade planen) – den är en kort
> "var slutade vi och vad gör jag nu"-sammanfattning som pekar vidare dit.

**Senast uppdaterad:** 2026-08-11, version **5.96.0**. **`ETAPPLAN12.md` (Etapp 59–63, "Från
demo till drift") är nu HELT KLAR** – 62a (skapa rutin från en sökluck), 62b (veckopulsen),
62c (åtgärdsbara rader i hälsosiffran), 63a (`OPPNA-PUNKTER.md` grupperad efter insatstyp),
63b (`REDAKTORSGUIDE.md`/`PILOTUPPLAGG.md`, pilotpaketet förberett utan en pilot) och 63c (de
tre ägarbesluten, se `BESLUTSLOGG.md`) byggda i ett sammanhängande pass. Se sektionen
"Uppföljning 2026-08-11 (ETAPPLAN12.md helt klar, v5.96.0)" längst ner för detaljer och
deploy-status.
`ETAPPLAN11.md` (Etapp 53–58) är nu **HELT KLAR utom 54c/54d och Etapp 58** – båda väntar
medvetet på en extern förutsättning (konkret andra enhet respektive en kund som kräver SSO),
inte på kapacitet, se `OPPNA-PUNKTER.md`. **`ETAPPLAN12.md` (Etapp 59–63, "Från demo till
drift") är den nya AKTIVA planen, ANTAGEN 2026-08-10** direkt efter en kodgenomgång (inte en
dokumentgenomgång) av v5.91.0 – till skillnad från tidigare planer bygger den nästan inga nya
funktioner, bara hållfasthet: den genomgången hittade tre fel som redan fanns i
produktionsgrenen, varav två infördes av de två senaste etapperna (Etapp 55/56).
**Etapp 59 och HELA Etapp 60 (60a–60c, 60d struket) är nu KLARA.** Etapp 60a mätte appen mot
en realistisk rutinmängd (500/1 000/2 000 rutiner) – tid-till-interaktiv och
Fuse-sökindexbygge helt oproblematiska, men en kall förstagångsinloggning drog 77 MB vid
2 000 rutiner. 60b och 60c undersökte den ursprungligen skrivna lösningen och fann i BÅDA
fallen att premissen inte höll fullt ut mot faktisk kod – 60b (en listvyprojektion hade
sparat noll, `Sektionssida.jsx` renderar redan allt direkt) och 60c (planen blandade ihop
papperskorgen och arkivet, men bara den förra ska döljas – arkivet ska medvetet stanna kvar
för redaktörer). Byggde ändå riktiga, mindre träffsäkra fixar för båda: 60b tog bort ren
datadublett (`namn` ur `lasteAv`), 60c flyttade papperskorgsfiltreringen server-side (med en
egen migrering, `backfillaBorttagenFalt`). Tillsammans: 77,3 MB → 36,0 MB (60b) plus att
mjukraderade rutiner inte längre hämtas alls (60c). **Etapp 61b och 61c är nu också KLARA:**
61b lade till 45 tester på de fem utils utan tidigare testtäckning (`offlineKo`,
`checklistFramsteg`, `senastBesokta`, `introduktionProgress`, `kvartal`) – två av dem
(`offlineKo`/`checklistFramsteg`) har en genuin dataförlustrisk om de går sönder. 61c gav
kioskläget (Etapp 55b) sin första e2e-täckning, en ny fil `tests/e2e/kioskbevakning.spec.js`
(5 tester) plus kiosk tillagt i `rokprov.spec.js`s rollista (sex → sju roller). **61a är nu
också KLAR – hela Etapp 61 är HELT KLAR.** `functions/index.js` (4 680 rader, 93 exports)
delad i 12 domänfiler + en tunn re-exporterande skarv, verifierat som en RIKTIG ren flytt
(en multiset-diff av alla rader i hela `functions/`-katalogen visar att bara EN rad
försvann – den gamla toppkommentaren – allt annat finns kvar ordagrant), exportytan bevisat
identisk mot originalet, full `test:functions`-svit (35 filer) körd två gånger (en gång per
delningsomgång) och grön båda gångerna, noll testfiler ändrade. Ett fristående, separat
förslag (Etapp 64, ett "baspaket" av nationella referenser) hölls medvetet UTANFÖR den
aktiva planen, i en egen fil `ETAPPLAN13.md`. `ETAPPLAN9.md`/`ETAPPLAN8.md`/`ETAPPLAN10.md`
fortsatt HELT KLARA OCH DEPLOYADE (utom 10:s Etapp 52, väntar på en bokning). **Läs
sektionen "Uppföljning 2026-08-10 (Etapp 61a klar, hela Etapp 61 klar)" längst ner** –
tidigare uppföljningar (61b/61c, 60c, 60b, 60a, 59, 53–57) finns kvar nedanför den, i
kronologisk ordning.

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
beslutspunkt (se `ETAPPLAN7.md` beslutspunkt 2: ska mobilvyn ingå alls, och mockupen täcker
bara tre av flera skärmar). Fråga användaren om den frågan innan du bygger 42f – det är inte
en premisskontroll-fråga, det är ett faktiskt öppet ägarbeslut.

**INTE gjort ännu:** deploy av v5.64.0–v5.66.0 till produktion.

## Uppföljning 2026-08-02 (42f pausad): ägarbeslut, inget kodat

Ställde beslutspunkt 2 (omfattning av 42f, mobilvy) till användaren efter att 42d gjorde
Etapp 42 klar förutom just den punkten. **Beslut: vänta.** Mobilvyn ska INTE byggas delvis
(bara de tre skärmar mockupen redan täcker) – skjuts upp tills Administration/Admin/
Godkännanden/Nyheter också har en mockup att bygga mot, så 42f blir en komplett
mobilupplevelse i ett svep istället för en ofullständig. Inget kodat, ingen versionsbump
(ren dokumentation). `ETAPPLAN7.md` beslutspunkt 2 och Etapp 42:s sammanfattning uppdaterade.
**Nästa steg för 42f, när det blir aktuellt, är INTE att skriva kod** – det är att ta fram
mockuper för de fyra saknade skärmarna (t.ex. via Claude Design, samma väg som de två
ursprungliga UI-utkasten kom in denna session).

**Med detta är hela `ETAPPLAN7.md` i praktiken klar** (42f medvetet pausad, inte oavslutad).
Om användaren ber om "nästa steg" utan att specificera: fråga om prioritering mellan
`ETAPPLAN6.md`s Etapp 40 (villkorad av en ny kund) och `ETAPPLAN5.md`s kvarvarande punkter –
det finns inget mer ogjort och obeslutat i den aktiva UI-planen just nu.

## Om du är en ny Claude-session som läser detta

Fråga användaren vad nästa steg ska vara – det finns inget akut, oavslutat arbete.
`ETAPPLAN7.md` (Etapp 42, gränssnittsförnyelse) är i praktiken klar: 42e/42a/42b/42c/42d
byggda, 42f medvetet pausad på ägarens beslut (vänta på mockuper för de sidor som saknar en –
se ovan). Bygg INTE 42f utan att först fråga om det förändrade läget (nya mockuper klara?).
`ETAPPLAN6.md` har bara Etapp 40 kvar (villkorad av en konkret ny kund) och `ETAPPLAN5.md`s
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
Byggde sedan 42f. Se `ETAPPLAN7.md`s egen "42f ✅ KLAR"-sektion för hela premisskontrollen och
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
  större, fristående insats utanför vad `ETAPPLAN7.md`s egen skrivna 42f-definition (nav +
  Akut-knapp) bad om – spara till en egen etapp om den ska tas.

Nya filer: `src/components/MerMeny.jsx`, `src/components/MerMeny.css`. Ändrade:
`src/components/BottomNav.jsx` (reducerad primärrad + Mer-knapp), `src/index.css`
(`.app-innehall` padding-bottom). Inga nya vitest-tester (ren UI/CSS). Inga rules-ändringar.
Fullt testsvep grönt (lint, build, 123 vitest-tester). Verifierat i en riktig webbläsare mot
emulatorerna vid 375×812. Version 5.66.0 → 5.67.0, committat och pushat till
`claude/compassionate-euler-rho0q5`. **DEPLOYAT TILL PRODUKTION 2026-08-03** (körning #65,
commit `0552d59`, `deploy.yml` via `workflow_dispatch`, `conclusion: success`).

`ETAPPLAN7.md` (Etapp 42) är därmed HELT KLAR, alla delpunkter 42a–42f. Nästa steg utan
vidare instruktion: `ETAPPLAN6.md`s Etapp 40 (villkorad av en konkret ny kund) eller
`ETAPPLAN5.md`s kvarvarande punkter (blockerade av ägarbeslut/extern tid) – båda väntar bara
på att komma i tur, inte på kapacitet. En ny `ETAPPLAN8.md` behöver skrivas när/om det finns
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

Användaren bad om en plan för detta, tillagd i SAMMA fil (`ETAPPLAN7.md`) som en ny
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
(`ETAPPLAN7.md`/`CLAUDE.md`/den här filen) committade och pushade till
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
beslutade byggordningen i `ETAPPLAN7.md`.

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
granskade i `ETAPPLAN7.md`.

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

Premisskontroll vid byggstart visade att `ETAPPLAN7.md`s antagande var fel: mörkt läge
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

**`ETAPPLAN7.md` (Etapp 42 + Etapp 43) är därmed HELT KLAR.** Två genuina buggar hittades och
fixades under Etapp 43:s byggpass (Korvy-knappens flex-läckage i "Kritiska specialfall",
Leverantörsvyns null-krasch här) – ingen av dem var kända innan premisskontrollen/testningen.

**DEPLOYAD TILL PRODUKTION 2026-08-03** (körning #66, commit `3efb193`, `deploy.yml` via
`workflow_dispatch`, `conclusion: success`) – v5.67.0 → v5.72.0 i ett enda hopp, alltså både
Etapp 42 och Etapp 43 samtidigt. Hela gränssnittsförnyelsen (`ETAPPLAN7.md`) är nu live.

Nästa steg utan vidare instruktion: `ETAPPLAN6.md`s Etapp 40 eller `ETAPPLAN5.md`s
kvarvarande punkter, båda blockerade av ägarbeslut/extern tid snarare än kapacitet. Ingen ny
UI-plan väntar just nu – nästa `ETAPPLANx.md` skrivs när/om ett nytt större arbetsområde
identifieras.

## Uppföljning 2026-08-04 (ETAPPLAN8 antagen): ny aktiv plan, mobilappskänsla

Användaren bad om en genomgång av hela produkten (vad som är byggt, vilka funktioner som
finns) och en avvägning av kandidater för nästa etapplan. Svar: alla tre huvudpaket +
källbevakning är fullt byggda och i drift (se `MODULPLAN.md`), och UI:t precis totalförnyat
(`ETAPPLAN7.md`). Tre kandidater till nästa steg togs fram: **(A) mobilappskänsla/
installationsbarhet**, **(B) sök- och kunskapsupptäckt 2.0**, **(C) incidentberedskap i
produkten**. Rekommendation gavs (A eller C, lägst beslutsspärr) – **ägaren beslutade A som
Etapp 44, med B och C uttryckligen köade som kommande etapper, inte förkastade.**

**Ny fil `ETAPPLAN8.md` skriven och antagen.** Premisskontroll (krav 8) vid antagandet
hittade att en av de ursprungliga idéerna redan var löst i kod: bakgrundssynk av
offline-gjorda kvitteringar/bristanmälningar finns redan (`useOfflineKo.js`, Etapp 29c) –
den punkten utgår helt ur Etapp 44. De genuina luckorna som blev kvar: ingen egen
installationsuppmaning (`beforeinstallprompt` + iOS-instruktion), en trolig men obekräftad
iOS-hemskärmsikonbugg (`apple-touch-icon` pekar på SVG, Apple stöder officiellt bara PNG),
ett obekräftat uppdateringsbeteende vid deploy (ingen kod hanterar `controllerchange`,
okänt om `registerType: 'autoUpdate'` ger en tyst, oanmäld omladdning mitt i en session),
och saknad touch-polish (pull-to-refresh, textmarkerings-callout på knappar). Detaljerad
plan, inklusive vilka delar som kräver ytterligare verifiering INNAN kod skrivs (44b/44c),
finns i `ETAPPLAN8.md`s egen Etapp 44-sektion.

**Inget kodat** – ren planering, ingen version-bump. `CLAUDE.md`s läsordning och dokumentkarta
uppdaterade (`ETAPPLAN8.md` är nu steg 2 i läsordningen, `ETAPPLAN7.md` nedgraderad till
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

`ETAPPLAN8.md` Etapp 44 är därmed helt klar och LIVE. Nästa steg: Etapp B (sök- och
kunskapsupptäckt 2.0) enligt den beslutade ordningen i `ETAPPLAN8.md`, om inget annat
prioriteras.

## Uppföljning 2026-08-04 (Etapp 45 antagen): extern granskning strukturerad till en plan

Användaren delade en extern, skriftlig dokumentationsgranskning (inte kodgranskning) och bad
om synpunkter, sedan om att strukturera granskningen + synpunkterna till en genomförbar plan.

**Tre av granskningens sakpåståenden verifierades innan de togs för goda:** `PITCH.md`
bekräftat stå kvar på "Version 5.25.0" (48 releaser efter v5.73.0, värre än granskningens
egen siffra eftersom den gjordes mot v5.72.0). `TILLGANGLIGHETSREDOGORELSE.md`s
`[FYLL I: datum]` bekräftad, rad 102. `INCIDENT-CHECKLISTA.md`s kontakttabell bekräftad
till stor del tom, men "2 av 5 ifyllda" snarare än granskningens "en femtedel" – en mindre
justering, slutsatsen höll ändå.

**Ny plan `ETAPPLAN9.md` (Etapp 45 – "Kvalitetsmaskineriet riktas utåt") skriven och antagen.**
Tesen: samma premisskontroll-/händelsestyrda-underhålls-disciplin som redan skyddar
`version.js`/`FRAMTIDSPLAN.md`/`CLAUDE_STATUS.md` internt saknas för de dokument och den
produktkvalitet en KUND eller MYNDIGHET faktiskt möter. Fem delmål:
- **45a:** `PITCH.md` – ett versionsdriftstest (struktur) + en innehållsuppdatering till
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

**Tre beslut togs och skrevs in direkt i `ETAPPLAN9.md`:** (1) `ETAPPLAN8.md`s köade Etapp
B/C byter plats OCH sköts bakom Etapp 45 – heter nu 46 (incidentberedskap, tidigare C) och 47
(sök/kunskapsupptäckt, tidigare B), med motivering (72-timmarsfristen i
`avtal/PUB-AVTAL-MALL.md` p. 8). (2) Deploy-per-avslutad-etapp bekräftad som redan avsedd
norm, ingen ändring. (3) `BESLUTSLOGG.md` (45f) byggs framåtriktat, ingen retroaktiv
genomgång av `CLAUDE_STATUS.md`s historik.

**Dokument uppdaterade i samma commit:** `CLAUDE.md` (läsordning nu 8 punkter, dokumentkarta,
ny obligatorisk underhållsregel för `OPPNA-PUNKTER.md`), `ETAPPLAN8.md` (Etapp B/C → 46/47,
kön flyttad bakom Etapp 45). Version oförändrad (5.73.0) – inget kodarbete, förutom
`OPPNA-PUNKTER.md` som är ren dokumentation.

**Nästa steg:** börja Etapp 45 i planens egen ordning (45a → 45b → 45c → 45e → 45f), om inget
annat prioriteras.

## Uppföljning 2026-08-04 (Etapp 45a klar): PITCH.md kan inte längre glida obemärkt

Byggde 45a direkt efter att `ETAPPLAN9.md` antogs ("börja med delmål 45a").

**45a-i:** ny `tests/docs/pitch-version.test.js` – jämför `PITCH.md`s versionsrubrik mot
`package.json`, failar om major skiljer sig eller minor ligger mer än 15 bakom. **Verifierat
mot det verkliga felet innan fixen:** kört mot ursprungsläget gav rött med "48
minorversioner efter, gränsen är 15" – bekräftar att testet faktiskt fångar problemet, inte
bara en attrapp som alltid är grön.

**45a-ii:** `PITCH.md` omskriven till att täcka Etapp 22–43 – samlad godkännandekö,
effektmätning över tid, en ny sektion om innehållshälsa/granskningsrundor/dubblettdetektion/
"Ni sa vi gjorde"/arkiverad status, revisionsloggens hashkedja (aldrig omnämnd tidigare, en
lucka utöver de granskningen själv hittade), gränssnittsförnyelsen och installationsbarheten.
Ny sektion "Ärlighet om vad som faktiskt är mätt" – skriven direkt mot granskningens fynd #7
(ingen kund ännu, siffrorna är fortsatt uppskattningar).

**Ingen versionsbump** – övervägd men reverterad, matchar det etablerade mönstret att inte
bumpa för ändringar utan motsvarande app-synlig/deploybar yta (jfr Etapp 14b/14c).

Fullt testsvep grönt (lint, build, vitest 124/124). Committat och pushat.

**Kvar i Etapp 45:** 45b (rökprovssvit), 45c (tillgänglighetsgranskning), 45e (ändringsloggens
ton), 45f (beslutslogg) – i den ordningen enligt `ETAPPLAN9.md`.

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

`TILLGANGLIGHETSREDOGORELSE.md` omskriven: nya rader #12–#17, en ärlig ny sektion om vad som
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

**Med detta är HELA `ETAPPLAN9.md` (Etapp 45, alla sex delmål 45a–45f) klar.** Nästa steg
enligt den beslutade ordningen (Beslut 1 i `ETAPPLAN9.md`): Etapp 46 (incidentberedskap i
produkten), i `ETAPPLAN8.md`.

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
`INCIDENT-CHECKLISTA.md` (ny rad i "Var saker finns", uppdaterad hashkedjerad, nytt
kodläge/datum), `SAKERHETSRAPPORT.md` (nytt tillägg-block).

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

**Med detta är `ETAPPLAN8.md` (Etapp 44, 46, 47) OCH `ETAPPLAN9.md` (Etapp 45) alla helt
klara.** Tre releaser (5.74–5.76) väntar på deploy. Ingen ny UI-/kvalitetsplan väntar – nästa
`ETAPPLANx.md` skrivs när/om ett nytt större arbetsområde identifieras.

## Uppföljning 2026-08-04 (deploy): v5.76.0 live i produktion

Användaren bad "deploya den". Triggade `deploy.yml` via `workflow_dispatch` på
`claude/compassionate-euler-rho0q5`, commit `328f940` (Etapp 47-committen, v5.76.0). Körning
#68: `status: completed`, `conclusion: success`. Detta var ett trehopp – v5.74.0 (Etapp 45),
v5.75.0 (Etapp 46) och v5.76.0 (Etapp 47) gick alla live samtidigt eftersom ingen av dem
deployats individuellt sedan v5.73.0 (körning #67). Bekräftade ny asset-hash i produktion
(`assets/index-BtpA3PtP.js`) via `curl`. Uppdaterade `CLAUDE.md`s `ETAPPLAN8.md`-rad i
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

**Tre skärpningar innan antagande** (detaljer i `ETAPPLAN10.md`s egen "Ändringar mot
utkastet"): (1) 48a är en nybyggnad av mätpunkt, inte en avsmalning – AI-budgetlarmet är ett
Sentry-larm, inte en UI-yta, och sökkvoten har ingen mätpunkt alls i dag; (2) 48c och 50a/50b
fick egna "verifiera först"-flaggor (molnkostnadsdata resp. tidsbegränsade Firestore-regler är
osäkra/nya); (3) 49a (radering) avkopplades explicit från 49b–49d, som ska köras oavsett vad
ägaren beslutar om 49a.

Skrev `ETAPPLAN10.md`, uppdaterade `CLAUDE.md`s läsordning och dokumentkarta (ny rad, flyttade
`ETAPPLAN9.md` till "helt klar och deployad"). Inget delmål byggt än – väntar på att användaren
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
organisation) kvarstår i `ETAPPLAN10.md`.

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
INTE en ny slutsats: `ETAPPLAN5.md`, `SAKERHETSRAPPORT.md` och `INCIDENT-CHECKLISTA.md` har
redan dragit exakt samma slutsats för Etapp 32b:s inloggningslarm. Uppdaterade
`OPPNA-PUNKTER.md` så samma rad nu nämner båda – ett enda ägarbeslut låser upp båda.

**En andra lucka hittades vid samma kontroll, inte tidigare känd:** det finns inget lagrat
kronbelopp för vad en organisation faktiskt betalar någonstans i datamodellen –
`MODULPLAN.md`s prismodell är bara text i ett dokument. Ett täckningsbidrag går alltså inte
att räkna ut ens grovt idag, oavsett faktureringsexporten.

**Byggde det enda förberedande steget som faktiskt var byggbart:** ny callable
`satAvtaladArsavgift`, manuellt inmatat pris per organisation i leverantörsvyn, ställt bredvid
den redan kända AI-kostnaden – med en tydlig text om att det INTE är ett fullständigt
täckningsbidrag. 5 nya functions-tester i `tests/functions/etapp6.test.cjs`. Fullt testsvep
grönt. Version 5.77.0 → **5.78.0**. Committat och pushat, INTE deployat ännu.

48d (rimlighetstak per organisation) kvarstår i `ETAPPLAN10.md` – det enda obyggda i Etapp 48.

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
Nästa punkt i `ETAPPLAN10.md` är Etapp 49 (livscykeln stängd – automatiserad radering vid
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

Nästa punkt i `ETAPPLAN10.md`, om användaren ber om fortsatt arbete, är Etapp 50
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
`avtal/INCIDENTRESPONSPLAN.md` (v1.1 → v1.2) och `INCIDENT-CHECKLISTA.md` uppdaterade i samma
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
   markerar 49b klar i `ETAPPLAN10.md`/`OPPNA-PUNKTER.md`.

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
blockering som redan var dokumenterad i `ETAPPLAN5.md` §32b. Beslöt att bygga resten av 50a
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
dokumentinnehåll läcker i svaret. `ETAPPLAN10.md` uppdaterad (§50a markerad ✅ KLAR med full
"Genomfört"-sektion).

**Testat:** fullt testsvep (lint, build, vitest, rules, functions, storage, e2e) – alla gröna,
inga regressioner. Version bumpad 5.81.0 → **5.82.0**, ny post i `src/data/andringslogg.js`.
Pushad till `claude/compassionate-euler-rho0q5`, INTE ännu deployad.

**Kvar i Etapp 50:** 50b (tidsbegränsad supportåtkomst) har en olöst beslutspunkt – ska den
byggas alls? (se `ETAPPLAN10.md` "Beslutspunkter som kräver ägaren" punkt 3). 50c
(ärendehistorik) är obyggd, inget känt hinder.

## Uppföljning 2026-08-09 (Etapp 50b klar)

Användaren fick alternativen för 50b och svarade: "Genomför alternativ A, men sätt
tidsfönstret till 6h" – ägarbeslutet är alltså att bygga tillfällig, kundinitierad
supportåtkomst, med fönstret satt till 6 timmar istället för utkastets föreslagna 4h.

**Genomfört, i den ordning `ETAPPLAN10.md` ursprungligen krävde ("isolera regelmönstret
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
`INCIDENT-CHECKLISTA.md` (ny rad i "Var saker finns" + Steg 3:s containment-tabell + en
caveat i Steg 4 om att enskilda läsningar under fönstret inte loggas, bara att fönstret var
öppet), `avtal/INCIDENTRESPONSPLAN.md` (version 1.2 → 1.3, avsnitt 5.2), `avtal/IT-FAKTABLAD.md`
§5 (ny rad: "vem hos leverantören kan se era uppgifter?"), `avtal/PUB-AVTAL-MALL.md` §7, och
ett nytt `SAKERHETSRAPPORT.md`-tillägg (2026-08-09) med en ärlig läckageriskbedömning.
`BESLUTSLOGG.md` fick en ny rad, `ETAPPLAN10.md` §50b markerad ✅ KLAR med full
"Genomfört"-sektion, beslutspunkt 3 struckt.

**Testat:** fullt testsvep (lint, build, vitest, rules – 219 tester inkl. de 7 nya, functions
– inkl. de 9 nya, storage, e2e) – alla gröna, inga regressioner. Version bumpad 5.82.0 →
**5.83.0**, ny post i `src/data/andringslogg.js`.

## Uppföljning 2026-08-09 (Etapp 50c + 51 klara)

Användaren frågade om hela `ETAPPLAN10.md` var slutförd. Svar: nej – 50c, 51a–c och Etapp 52
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
**5.84.0**, ny post i `src/data/andringslogg.js`. `ETAPPLAN10.md` uppdaterad: §50c och hela
§51 (51a–c) markerade ✅ KLAR med fulla "Genomfört"-sektioner, sammanfattningstabellens rader
för Etapp 50 och 51 uppdaterade.

**Med detta är HELA `ETAPPLAN10.md` (Etapp 48–51) klar utom Etapp 52** (pilotpaketet – kräver
bokad tid från riktiga människor, inte kodningstid, se planens egen "Beslutspunkter som kräver
ägaren").

## Uppföljning 2026-08-09 (deploy: v5.84.0 live)

Användaren bad "deploya den". Triggade `deploy.yml` (`workflow_dispatch`) mot
`claude/compassionate-euler-rho0q5`, commit `545e958` (Etapp 50c + hela Etapp 51). Körning
**#72**, `conclusion: success`. Bekräftade genom att läsa av asset-hashen på startsidan:
`assets/index-CJpO8Yof.js` på `https://synappsen-final-build.web.app/`. Ingen kodändring i
denna uppföljning. Med detta är Etapp 48–51 (hela `ETAPPLAN10.md` utom Etapp 52) HELT KLARA
OCH DEPLOYADE i produktion.

## Uppföljning 2026-08-10 (ETAPPLAN11.md skriven som UTKAST – ej antagen)

Användaren bad om en genomgång av projektet och ett förslag på en ny etapplan (nya funktioner,
saker att ändra, sådant som gör produkten mer attraktiv för kund). Resultat: **`ETAPPLAN11.md`,
tydligt märkt UTKAST/EJ ANTAGEN** – inget delmål ska byggas förrän ägaren strukit det som inte
ska med, samma ordning som `ETAPPLAN10.md` gick igenom 2026-08-06. Ingen produktkod ändrad.

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
5. **`PITCH.md` (v5.73.0) påstår felaktigt att klinikstöd-sökningen är "medvetet pausad i
   gränssnittet".** `KlinikfragaSok.jsx:15` har `const PAUSAD = false;` sedan 2026-07-14
   (Fas 13) – tre veckor innan `PITCH.md` senast skrevs. `MODULPLAN.md` säger korrekt att den
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

**Rekommenderad omedelbar åtgärd oavsett om planen antas:** Etapp 57a (rätta `PITCH.md`) –
tar minuter och det är det enda dokumentet en köpare faktiskt läser.

`OPPNA-PUNKTER.md` orörd: utkastets beslutspunkter blir öppna punkter först om/när planen
antas – ett ej antaget förslag är varken en öppen punkt eller ett beslut.

## Uppföljning 2026-08-10 (ETAPPLAN11.md ANTAGEN, Etapp 57a klar)

Användaren bad: "Anta den planen och starta första steget". `ETAPPLAN11.md` markerad
**ANTAGEN 2026-08-10** och gjord till den aktiva planen i `CLAUDE.md`s läsordning/dokumentkarta
(`ETAPPLAN10.md` nedgraderad till historisk, HELT KLAR utom Etapp 52). **Viktigt: antagandet
av planens omfattning svarar INTE på planens fyra egna beslutspunkter** (nytt underbiträde för
e-post m.fl.) – de kräver var sitt eget ägarbeslut innan respektive delmål byggs, och är nu
inlagda i `OPPNA-PUNKTER.md`. Loggat i `BESLUTSLOGG.md`.

**Första steget genomfört: Etapp 57a** (planens egen ordningsprincip: "kräver ingen antagen
plan, gör den direkt", före allt annat). `PITCH.md` rättad – det felaktiga påståendet att
klinikstöd-sökningen är "medvetet pausad i gränssnittet" (den återaktiverades 2026-07-14, tre
veckor innan `PITCH.md` senast skrevs) ersatt med en korrekt, historik-formulerad beskrivning.
Versionsraden bumpad till 5.84.0/2026-08-10 (dokumentversion, ingen kodändring/apprelease).
Lade även till en kort rad om kommandopalett, taggbaserade rutin-förslag och det uppdaterade
"Sedan ditt förra pass" (Etapp 47a/47b), som saknades helt i säljdokumentet. 57b (händelsestyrd
underhållsregel för `PITCH.md`) och 57c (ärligt "vad som inte finns"-stycke) kvarstår som egna
delmål i `ETAPPLAN11.md`.

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
**v1.4**, avsnitt 5.2), `INCIDENT-CHECKLISTA.md` (ny containment-rad + "Var saker finns"-rad,
header uppdaterad).

Testat: nytt `tests/functions/epost.test.cjs` (10 tester – validering, PII-spärr, nödstopp,
tyst no-op utan nyckel, ett faktiskt utskick mot en mockad Brevo-endpoint som bevisar att
loggposten aldrig innehåller mejlets text, `angeEpostAvstangd`s behörighet). Full testsvep
grön: lint, build, vitest (124/124), rules (oförändrade, alla gröna), functions (inkl. de 10
nya), storage, e2e (11/11 – inget flak denna gång). Version bumpad 5.84.0 → **5.85.0**, ny
post i `src/data/andringslogg.js`. `ETAPPLAN11.md` §53a markerad ✅ KLAR med full
"Genomfört"/"Testat"-sektion.

**Nästa steg i `ETAPPLAN11.md`:** 53b (inbjudan levereras per e-post), 53c (påminnelser till
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
bumpad 5.85.0 → **5.86.0**, ny post i `src/data/andringslogg.js`. `ETAPPLAN11.md` §53b
markerad ✅ KLAR. `avtal/UNDERBITRADEN.md` och `OPPNA-PUNKTER.md`s Brevo-rad uppdaterade för
att spegla att koden nu faktiskt använder underbiträdet (fast fortfarande ingen skarp
`BREVO_API_KEY`).

**Nästa steg i `ETAPPLAN11.md`:** 53c (påminnelser till rutinägare, förvalt på för tilldelade
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
(11/11). Version bumpad 5.86.0 → **5.87.0**. `ETAPPLAN11.md` §53c markerad ✅ KLAR.
`INCIDENT-CHECKLISTA.md` steg 5 utökad (ny, tillfällig plats för en redan listad
personuppgiftstyp – e-post) och header uppdaterad till v5.87.0.

**Nästa steg i `ETAPPLAN11.md`:** 53d (kundvänd månadssammanfattning till chefen, länk in i
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

**Med detta är HELA Etapp 53 (53a–53d) i `ETAPPLAN11.md` klar och testad – men INTE
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
ligger i 54c (delade rutiner), inte 54d. Skrivet in i `ETAPPLAN11.md` som en
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
etapp6.test.cjs), storage, e2e (11/11). Version bumpad 5.88.0 → **5.89.0**. `ETAPPLAN11.md`
§54a/§54b markerade ✅ KLARA. `OPPNA-PUNKTER.md`s Etapp 54-rad omskriven till att bara gälla
54c/54d (54a/54b är nu avklarade, inte längre en öppen fråga).

## Uppföljning 2026-08-10 (deploy: v5.89.0 live)

Användaren bad "deploya den" efter Etapp 54a–54b. Triggade `deploy.yml`
(`workflow_dispatch`) mot `claude/compassionate-euler-rho0q5`, commit `63f15d7` (Etapp 53a–d
+ 54a–b i sin helhet, v5.85.0 → 5.89.0). Körning **#73**, `conclusion: success`. Bekräftade
genom att läsa av asset-hashen på startsidan: `assets/index-D_ReJBIJ.js` på
`https://synappsen-final-build.web.app/`. Ingen kodändring i denna uppföljning.

**Med detta är HELA `ETAPPLAN11.md` Etapp 53 (53a–53d) OCH Etapp 54a–54b HELT KLARA OCH
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

**56d:** nytt stycke "Ni börjar inte från ett tomt system" i `PITCH.md`.

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
`ETAPPLAN11.md` §56 (56a–56d) markerad ✅ HELT KLAR.

**Med detta är HELA Etapp 53, Etapp 54a–54b och HELA Etapp 56 i `ETAPPLAN11.md` klara och
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
den enda metod som faktiskt fungerar. Se `SAKERHETSRAPPORT.md`s tillägg (2026-08-10,
v5.91.0) för den fullständiga lärdomen. Ingen produktionsdata någonsin exponerad.

PIN-verifiering sker helt server-side (`satKioskPin`/`verifieraKioskPin`, SHA-256-hash,
hastighetsbegränsad) – klienten ser aldrig hashen eller rätt PIN under några omständigheter.
UI: `KioskBevakning.jsx` (route-vitlista + auto-återgång till startsidan efter 3 minuters
inaktivitet, ALDRIG utloggning), en egen `BottomNav`-gren för kiosk-rollen
(Sök/Hem/Akutläge direkt, resten i Mer-menyn), `KioskPinModal.jsx` för att lämna kioskläget,
`KioskPinSektion.jsx` i `/admin` för att sätta PIN-koden.

**55c fullgjord i samma commit:** `INCIDENT-CHECKLISTA.md` (steg 3-tabell, steg 4,
snabbreferensen), `avtal/INCIDENTRESPONSPLAN.md` v1.4 → v1.5 (avsnitt 4 + versionshistorik),
`avtal/IT-FAKTABLAD.md` avsnitt 2, `SAKERHETSRAPPORT.md` (nytt tillägg).

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
`ETAPPLAN11.md` §55 (55a–55c) markerad ✅ HELT KLAR.

**Med detta är Etapp 53, 54a–54b, 55 OCH 56 i `ETAPPLAN11.md` alla klara och testade – men
INTE deployade** (senaste produktionsdeploy fortfarande v5.89.0). Nästa steg: deploya, eller
fortsätta med 54c/54d (väntar på en konkret andra enhet) eller 57b–c (säljmaterialets
underhållsregel + ärlighetsstycke).

## Uppföljning 2026-08-10 (Etapp 57b–c klara: PITCH.md-regeln + ärlighetsstycke)

Byggde de två sista delmålen i Etapp 57 – rent dokumentationsarbete, ingen appkod ändrad.

**57b:** ny sektion "Obligatorisk underhållsregel: PITCH.md" i `CLAUDE.md`, i exakt samma
tabellformat som de fyra befintliga levande-dokument-reglerna. Triggas av: en kundvänd
funktion blir synlig/avstängd/väsentligt ändrad, en lucka i 57c:s stycke stängs eller öppnas,
eller en större release.

**57c:** nytt stycke "Vad som inte finns än" i `PITCH.md` (SSO, delad data mellan enheter
under samma huvudman, journal-/HR-integration, dosberäkning – samma ärlighetsprincip som det
redan befintliga "Ärlighet om vad som faktiskt är mätt"-stycket).

**Sidofynd, åtgärdat i samma commit:** när 57b-regeln skrevs blev det synligt att Etapp 55
(kioskläget, förra sessionen) redan hade brutit mot den regel som just skulle skrivas in –
`PITCH.md` nämnde aldrig kioskläget trots att det är en ny, kundvänd funktion. Lade till en
kort bullet om det under "Byggd för vårdens krav", och höll det DÄRFÖR utanför listan över
luckor i 57c (det är inte längre en lucka). Ett litet, konkret exempel på att den nya regeln
löser ett verkligt, redan inträffat fall, inte bara ett hypotetiskt.

**Ingen versionsbump:** varken `package.json` eller `andringslogg.js` rördes – enbart
`CLAUDE.md` (interna instruktioner) och `PITCH.md` (säljmaterial) ändrades, ingenting i den
faktiska appen. `PITCH.md`s egen versionsrad justerades till att peka på den redan gällande
appversionen (5.91.0) istället för att skapa en egen, separat siffra.

Testsvep: lint, build, vitest (130/130) – inga rules-/functions-/storage-/e2e-tester
relevanta eftersom ingen kod under `firestore.rules`, `storage.rules`, `functions/` eller
`tests/` ändrades. `ETAPPLAN11.md` §57 (57a–57c) markerad ✅ HELT KLAR.

**Med detta har `ETAPPLAN11.md` bara två öppna punkter kvar: 54c/54d (väntar på en konkret
andra enhet hos en kund) och Etapp 58 (SSO, väntar på en kund som kräver det) – båda
medvetet väntande på en extern förutsättning, inte på kapacitet.**

## Uppföljning 2026-08-10 (`ETAPPLAN12.md` antagen, Etapp 59 klar: rättningar, v5.92.0)

`ETAPPLAN11.md` var vid det här laget helt klar utom två externt villkorade punkter (se
ovan) – dags för en ny plan. Gjorde en genomgång av FAKTISK kod (inte dokumentation) i
v5.91.0, vilket resulterade i två nya planfiler:

- **`ETAPPLAN12.md`** (Etapp 59–63, "Från demo till drift") – **ANTAGEN samma dag.**
  Genomgången hittade tre fel i produktionsgrenen, varav två infördes av de senaste två
  etapperna: sex `omrade: "logistik"`-mallrutiner (Etapp 56a) som ingen vy kunde visa/söka/
  godkänna men som ändå räknades i hälsosiffran, kioskläget (Etapp 55a) som inte gatades av
  `FEATURE.KIOSK_MODE` i något lager, och en föråldrad `dompurify`-version (produktionens
  enda XSS-sanerare). Planen är medvetet tyngre på hållfasthet än på nya funktioner.
- **`ETAPPLAN13.md`** (Etapp 64) – ett fristående, EJ byggbart förslag om ett "baspaket" av
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
  körning till `$GITHUB_STEP_SUMMARY`. Ingen ny fil skapades; se `ETAPPLAN12.md`s rättelse
  för hela resonemanget.

Testat: `tests/functions/etapp6.test.cjs`/`demo-organisation.test.cjs` (räknarna
uppdaterade), `tests/functions/gatingmatris.test.cjs` (2 nya rader),
`tests/functions/kioskrestriktioner.test.cjs` (4 nya tester, inkl. att verifieraKioskPin
ALDRIG blockeras). Full testsvep grön: lint, build, vitest (130/130), functions (alla 32
filer). Inga ändringar i `firestore.rules`/`storage.rules`, så `test:rules`/`test:storage`
kördes inte om. Version bumpad 5.91.0 → **5.92.0**. `ETAPPLAN12.md` §59 (59a–59c) markerad
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

**Resultat (se `ETAPPLAN12.md` §60 för hela tabellen och resonemanget):**

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
sunt förnuft istället, vilket är skrivet ut ärligt i `ETAPPLAN12.md` snarare än dolt.

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
sedan 5.91.0). `ETAPPLAN12.md` §60b markerad ✅ KLAR med hela resonemanget.

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
functions-testfiler). Version bumpad 5.93.0 → **5.94.0**. `ETAPPLAN12.md` §60c markerad
✅ KLAR, hela Etapp 60 markerad HELT KLAR.

**Nästa steg:** Etapp 61 (underhållbarhet/testluckor) är inte villkorat av något och kan tas
när som helst. Etapp 60 helt klart innebär att `ETAPPLAN12.md` nu bara har 61–63 kvar (plus
det fristående, ej byggbara Etapp 64 i `ETAPPLAN13.md`).

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
grön (17/17). Ingen versionsbump – rent testarbete, ingen appkod ändrad. `ETAPPLAN12.md`
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
inte bara påstådd. Se `ETAPPLAN12.md` §61a för den fullständiga filindelningen och
avvikelserna från planens ursprungliga förslag (varför ingen egen `epost.js`/`schemalagt.js`
byggdes, varför `loggaRevision` ligger i `gemensamt.js` snarare än `revisionslogg.js`).

Testat: lint, `node --check` × 12, `require`-rökprov (93 exports, identiska), full
`test:functions` (35 filer, körd två gånger) 0 misslyckade båda gångerna, build, vitest
(175/175). Ingen versionsbump krävs egentligen (ren flytt, inget beteende ändrat för en
användare) men bumpas ändå för spårbarhet i deploy-historiken. `ETAPPLAN12.md` §61a
markerad ✅ KLAR – **hela Etapp 61 (61a–61c) är nu HELT KLAR.**

**Nästa steg:** Etapp 62 (mätvärde → åtgärd) är villkorad av att Etapp 59 är stängd, vilket
den är – inget hindrar att ta den näst. Etapp 63 (gruppera öppna punkter, förbered pilot)

---

## Uppföljning 2026-08-10 (Etapp 63c-beslutspunkterna avgjorda)

Användaren tog ställning till `ETAPPLAN11.md`s tre kvarvarande beslutspunkter (samlade i
`ETAPPLAN12.md` §63c): "OIDC, på för tilldelade uppgifter, följ din rekommendation för punkt
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

`ETAPPLAN12.md` §63c:s "Klart när" (de tre beslutspunkterna har ett svar i `BESLUTSLOGG.md`)
är nu uppfyllt, men Etapp 63 som helhet är INTE klar – 63a och 63b är obyggda.

---

## Uppföljning 2026-08-11 (ETAPPLAN12.md helt klar, v5.96.0, deploy #74 live)

Genomförde hela den återstående delen av `ETAPPLAN12.md` (Etapp 62 och 63) i ett
sammanhängande pass, efter att ett tidigare försök att pausa/sprida arbetet över natten med
schemalagda återuppväckningar (`ScheduleWakeup`) inte levererade – sessionen återupptogs
aldrig automatiskt, och ingen kod byggdes mellan 62a (committad 2026-08-10 kväll) och när
användaren själv påpekade att tidsfristen redan passerat. Lärdom: lita inte på schemalagda
återuppväckningar för flerstegs kodningsarbete i den här miljön – kör i ett sammanhang eller
invänta explicit uppföljning från användaren istället.

- **62a** (redan committad föregående kväll): "Skapa rutin"-genväg från en sökning utan träff.
- **62b:** ny `VeckopulsSektion.jsx` – utgångna rutiner, obesvarade förslag och sökluckor i
  prioritetsordning med direktlänk, högst upp i adminpanelen. Löste samtidigt en kvarstående
  rad i `OPPNA-PUNKTER.md` (Etapp 16/veckopuls) som stått öppen sedan `ETAPPLAN3.md`.
- **62c:** `InnehallshalsaSektion.jsx` fick åtgärdsknappar – starta en granskningsrunda för
  exakt de rutiner som flaggats "bör granskas", tilldela ägare inline i tabellen.
  `useGranskningsrundor` fick en `aktiv`-parameter för att inte prenumerera i onödan i
  icke-superadmin-vyn (permission-denied-brus).
- **63a:** `OPPNA-PUNKTER.md` omgrupperad i fem rubriker efter insatstyp istället för en enda
  tabell – tillkom en femte kategori ("väntar på en extern förutsättning") som planens
  ursprungliga tre-vägs uppdelning inte rymde ärligt.
- **63b:** två nya root-dokument, `REDAKTORSGUIDE.md` och `PILOTUPPLAGG.md`, förberedelse för
  Etapp 52-piloten (`ETAPPLAN10.md`) utan att en pilot är bokad. Registrerade i `CLAUDE.md`s
  dokumentkarta.
- **63c:** redan avgjort och loggat föregående kväll (se sektionen ovan).

**Hela `ETAPPLAN12.md` (Etapp 59–63) är nu KLAR.**

Släppt som v5.96.0. Fullt testsvep grönt: lint, build, vitest (175/175), `test:rules` (18/18),
`test:functions` (samtliga ~33 filer), `test:storage` (21/21), `test:e2e` (17/17 – en första
körning gav en enskild `/admin`-rökprovsmiss för superadmin, `ERR_CONNECTION_REFUSED`;
en omkörning av hela sviten gav 17/17 gröna, bekräftat en transient flake, inte en regression
från Etapp 62c:s ändringar).

**Deployad:** körning #74, commit `91091be`, klar 2026-08-11 04:58 UTC. Ny asset-hash
`assets/index-CQA-Qbjq.js` bekräftad live på `https://synappsen-final-build.web.app/`.

**Nästa steg:** ingen aktiv plan pekas ut ännu – `ETAPPLAN12.md` är den senast antagna och nu
helt klar. Läs `OPPNA-PUNKTER.md` för vad som väntar på en människa/ett beslut, eller vänta på
ny instruktion från ägaren om vad nästa etapp ska vara.

---

## Uppföljning 2026-08-11 (granskning av ETAPPLAN13 + fyra döda sökvägar efter 61a)

Ägaren bad om en granskning av baspaketsförslaget. `ETAPPLAN13.md` är omskriven – fem fel i
utkastet, varav två är värda att känna till även om man inte läser planen: den citerade MDR
Annex VIII regel 11 (en KLASSIFICERINGS-regel) för vad som i själva verket är en
kvalificeringsfråga, och den saknade upphovsrätten helt trots att bedömningsinstrument ofta
är licensbelagda. Planen har nu tre beslutspunkter i stället för en, inklusive ett
alternativ B som återanvänder Etapp 56:s seedningsmekanism och flyttar utgivaransvaret till
kunden. Se planens egen "Granskning"-sektion. **Fortfarande ej byggbar** – nu av två
juridiska skäl i stället för ett.

`CLAUDE.md`s dokumentkarta uppdaterad: `ETAPPLAN12.md` står inte längre som den aktiva planen,
och `ETAPPLAN11.md`s 54c/54d + Etapp 58 pekade fortfarande mot `OPPNA-PUNKTER.md` trots att de
flyttades till `BESLUTSLOGG.md` 2026-08-10.

**Ett fynd om Etapp 61a värt att komma ihåg:** delningen av `functions/index.js` gjorde ~86
kommentarsreferenser i levande kod inaktuella. De flesta är ofarliga – skarven re-exporterar
alla 93 Cloud Functions, så referensen leder rätt via ett extra hopp. Men referenser till
INTERNA symboler som aldrig exporterats är äkta återvändsgränder, och fyra sådana fanns
(`GODKANDA_KALLDOMANER`, `STANDARD_TAK_ORE`, `aktuellManadNyckel`, `personalpulsResultat`).
Rättade. Historiska planfiler och append-only-sektionerna här och i `SAKERHETSRAPPORT.md`
lämnades medvetet orörda – de var korrekta när de skrevs. Ingen versionsbump (kommentarer och
dokument), ingen deploy: v5.96.0/körning #74 är fortfarande det som kör i produktion.
