# Status & överlämning – läs mig först i en ny Claude Code-session

> Denna fil uppdateras löpande och är tänkt att läsas i BÖRJAN av en ny
> Claude Code-tråd om sessionen bytts (t.ex. efter kontext-kompaktering eller
> en helt ny konversation). Den ersätter INTE `UTVECKLINGSLOGG.md` (detaljerad
> historik) eller `ETAPPLAN.md` (den etappindelade planen) – den är en kort
> "var slutade vi och vad gör jag nu"-sammanfattning som pekar vidare dit.

**Senast uppdaterad:** 2026-07-25, version 5.15.1

## Nuläge i ett stycke

Etapp 1–3 är helt genomförda. Etapp 4 och 5 är delvis genomförda (medvetet –
de innehåller organisatoriska moment som pilotdrift och säljlansering som inte
är kodarbete; tekniska deluppgifter inom dem är klara, se `ETAPPLAN.md`).
Efter Etapp 5 gick vi igenom en extern kodgranskning ("Synappsen 5.15.0 –
Fullständig kodfeedback") som användaren klistrade in, bedömde den kritiskt
(inte bara höll med), och åtgärdade de två fynd som bedömdes vara reella och
prioriterade: en delad-dator-bugg i offline-centrets localStorage-nyckel, och
avsaknaden av en `ErrorBoundary`. Detta blev v5.15.1, som är **deployad till
produktion** och verifierad (asset-hash `index-BtZVzwsZ.js`, "Deploy
complete!" bekräftat i GitHub Actions-loggen).

**Det finns just nu inga kända öppna buggar eller pågående uppgifter.**
Arbetet väntar på nästa instruktion från användaren.

## Vad som återstår (icke-brådskande, se ETAPPLAN.md för detaljer)

- Etapp 4: Admin.jsx är fortfarande stor (kodgranskningens förslag om att dela
  upp den valdes bort som lägre prioritet, inte akut).
- Etapp 4/5: `confirm()`/`alert()`-mönstret i vissa vyer (samma – lägre
  prioritet, fungerar men är inte snyggast).
- `void _id`-mönstret som kodgranskningen påpekade – bedömdes som en svag
  föreslagen lösning, inte åtgärdat, se UTVECKLINGSLOGG.md Fas 23 för
  resonemang.
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
- `UTVECKLINGSLOGG.md` – fullständig kronologisk teknisk historik, "Fas 1–23".
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
