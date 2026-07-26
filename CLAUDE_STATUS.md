# Status & överlämning – läs mig först i en ny Claude Code-session

> Denna fil uppdateras löpande och är tänkt att läsas i BÖRJAN av en ny
> Claude Code-tråd om sessionen bytts (t.ex. efter kontext-kompaktering eller
> en helt ny konversation). Den ersätter INTE `UTVECKLINGSLOGG.md` (detaljerad
> historik) eller `ETAPPLAN.md` (den etappindelade planen) – den är en kort
> "var slutade vi och vad gör jag nu"-sammanfattning som pekar vidare dit.

**Senast uppdaterad:** 2026-07-26, version 5.25.0 (+ Etapp 12a/12b/12c-i, ingen versionsbump)

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

**Ännu INTE deployat till produktion** – allt arbete denna omgång (9 commits,
v5.15.1 → v5.24.0) ligger på `claude/compassionate-euler-rho0q5` men väntar
på en "Deploya till produktion"-instruktion.

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
- **12c-i ✅:** App Check aktiverat i klienten (`src/firebase/config.js`), men **helt
  inaktivt tills en extern åtgärd görs** – se nästa stycke. 12c-ii/12c-iii väntar på det.

**VIKTIGT – kräver ägarens medverkan, kan inte göras av Claude:** för att App Check
faktiskt ska börja göra något (12c-i → verkligt skydd) måste ägaren (1) registrera en
reCAPTCHA v3-sitenyckel på google.com/recaptcha/admin, (2) registrera appen för App Check
i Firebase-konsolen med den nyckeln, (3) be en Claude-session lägga till
`VITE_RECAPTCHA_SITE_KEY` i `deploy.yml`. Fram tills dess är koden ett ofarligt no-op.

**Spårat men EJ påbörjat:** Etapp 12h (`firebase-tools` 13→15-majoruppgradering) –
identifierad i 12b, kräver en egen, försiktig testcykel (se ETAPPLAN2.md för den exakta
checklistan) innan den görs. Ska INTE göras som en snabb sidoeffekt av något annat.

## Vad som återstår (se ETAPPLAN2.md för detaljer)

- **Etapp 9 (upphandlingsbarhet)** – SSO/Entra ID, WCAG 2.1 AA, GDPR-underlag,
  driftdokumentation. Inte påbörjad, inte efterfrågad ännu.
- **Etapp 10a (demoläge/sandlåda)** – enda ej genomförda delmålet i Etapp 10.
- **Etapp 11 (Intelligence 2.0)** – uttryckligen villkorad i planen: bör
  vänta tills minst en kund faktiskt betalar för Intelligence-modulen.
- `void _id`-mönstret som en extern kodgranskning påpekade – bedömdes som en
  svag föreslagen lösning, inte åtgärdat, se UTVECKLINGSLOGG.md Fas 23.
- Organisatoriska moment i Etapp 4/5 (faktisk pilotdrift, säljlansering) –
  kan inte göras i kod, kräver beslut/aktivitet av användaren utanför denna
  session.

## Så här jobbar vi i det här projektet (etablerade mönster – följ dessa)

1. **Deploy till produktion** görs ALLTID via GitHub Actions-workflowen
   `deploy.yml` (trigger: `mcp__github__actions_run_trigger`,
   `run_workflow`, `workflow_id: deploy.yml`, ref: den aktuella
   arbetsgrenen). Polla med `actions_list`/`list_workflow_jobs` tills job är
   `completed`.
   **KRITISKT:** jobbets övergripande `conclusion`-fält är INTE pålitligt för
   just deploy-steget, eftersom steget "Deploya till Firebase" i
   `deploy.yml` har `continue-on-error: true`. Ett riktigt `firebase deploy`-
   fel visas ändå som jobb-nivå "success". Läs ALLTID den faktiska
   logg-texten via `mcp__github__get_job_logs` (`return_content: true`) och
   leta efter `"Deploy complete!"` och avsaknad av `"##[error]"`-rader.
   Bekräfta sedan att produktionen faktiskt uppdaterats:
   `curl -s https://synappsen-final-build.web.app/ | grep -o 'assets/index-[A-Za-z0-9_-]*\.js'`
   och jämför asset-hashen mot den tidigare kända. Rapportera resultatet på
   svenska till användaren.
2. **Verifiering före commit** (kör alltid hela svepet, alla ska vara gröna):
   `npm run lint`, `npm run build`, `npx vitest run`, `npm run test:rules`,
   `npm run test:functions`, `npm run test:storage`, `node -c functions/index.js`.
3. **Versionsbump** vid varje leverans: uppdatera `src/version.js` OCH
   `package.json`, samt lägg till en post överst i `src/data/andringslogg.js`
   (svensk, kort, användarvänlig ändringslogg).
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

- `ETAPPLAN.md` – den etappindelade planen (Etapp 0–5), status per etapp.
- `ETAPPLAN2.md` – uppföljande plan (Etapp 6–11), status per etapp.
- `UTVECKLINGSLOGG.md` – fullständig kronologisk teknisk historik, "Fas 1–32".
- `SAKERHETSRAPPORT.md` – säkerhetsgranskning av multi-tenant-lagret.
- `src/data/andringslogg.js` – användarvänd ändringslogg (visas i appen).
- `firestore.rules` / `storage.rules` – multi-tenant-säkerhetsmodellen,
  organisationsisolering, 2FA-policy, dokumentorganisation-cross-lookup.
- `functions/index.js` – Cloud Functions (AI-import, backup, migrering,
  modul-gating, kostnadshistorik, schemalagda jobb).
- `tests/rules/`, `tests/functions/` – emulator-baserade testsviter.

## Om du är en ny Claude-session som läser detta

Fråga användaren vad nästa steg ska vara – det finns inget akut, oavslutat
arbete. Om användaren säger något i stil med "fortsätt där vi var" utan att
specificera: hänvisa till `ETAPPLAN.md`:s återstående punkter ovan och fråga
vilken de vill prioritera, snarare än att gissa.
