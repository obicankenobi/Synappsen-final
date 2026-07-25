# Status & överlämning – läs mig först i en ny Claude Code-session

> Denna fil uppdateras löpande och är tänkt att läsas i BÖRJAN av en ny
> Claude Code-tråd om sessionen bytts (t.ex. efter kontext-kompaktering eller
> en helt ny konversation). Den ersätter INTE `UTVECKLINGSLOGG.md` (detaljerad
> historik) eller `ETAPPLAN.md` (den etappindelade planen) – den är en kort
> "var slutade vi och vad gör jag nu"-sammanfattning som pekar vidare dit.

**Senast uppdaterad:** 2026-07-25, version 5.17.0

## Nuläge i ett stycke

Etapp 1–5 (ETAPPLAN.md) är genomförda. Efter dem gjordes en fristående
kodgenomgång som resulterade i `ETAPPLAN2.md` (Etapp 6–11). Användaren bad om
Etapp 6, 7, 8 samt 10b–10e. Hittills genomfört och verifierat: **Etapp 7
(a–d, helt klar), Etapp 8a–8b (Node 22, deploy.yml), Etapp 6 (a–d, helt
klar)** – se UTVECKLINGSLOGG.md Fas 24–25 för fullständiga detaljer.
`npm run test:rules` 60/60, `npm run test:functions` 54/54, `npm run
test:storage` 6/6, `npx vitest run` 10/10, build+lint gröna.

**Kvarstående av det användaren bad om denna omgång:** Etapp 8c (dela upp
Admin.jsx), 8d (frontend-tester), 8e (ersätt confirm/alert), samt Etapp 10b
(bulkimport), 10c (ledningsrapport), 10d (rutinmallar), 10e
(tid-att-hitta-mätning). Se tasklistan (TaskList) för exakt status – varje
deluppgift är en egen task.

**Ännu inte deployat till produktion** – all denna omgångs arbete (Etapp
6+7+8a-b) ligger committat på `claude/compassionate-euler-rho0q5` men väntar
på nästa "Deploya till produktion"-instruktion (eller så fortsätter arbetet
med 8c-e/10b-e först, beroende på vad användaren väljer).

## Vad som återstår från den gamla planen (ETAPPLAN.md, lägre prioritet)

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
- `UTVECKLINGSLOGG.md` – fullständig kronologisk teknisk historik, "Fas 1–25".
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
