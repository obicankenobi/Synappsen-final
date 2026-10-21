# Status & överlämning – läs mig först i en ny Claude Code-session

> Kort "var slutade vi och vad gör jag nu"-sammanfattning. Ersätter INTE
> `etapplaner/UTVECKLINGSLOGG.md` (detaljerad teknisk historik) eller planfilerna i
> `etapplaner/` – den pekar vidare dit.
>
> **Historiken ligger i `etapplaner/STATUSARKIV.md`** (159 uppföljningar från 2026-07-28 och
> framåt). Den här filen behåller bara de senaste. Sök i arkivet när du behöver veta *varför*
> något gjordes.

**Senast uppdaterad:** 2026-10-21 · **Slumpvisa e2e-fel rättade** (en riktig tillgänglighetsbrist i appens laddningsläge, se uppföljningen
2026-10-21 längst ner; ej deployad). Före det: **v5.140.0 DEPLOYAD** (`deploy.yml` körning #100, success, 2026-10-18
14:11–14:17, commit `fc37848`; PR #35 mergad som `ce40404`; asset-hash `index-BoGw6VUc.js` live,
`last-modified` 14:17:38 GMT). v5.140.0 åtgärdar AI-integrationsriskernas fynd 3, 4, 7 och 8 – se
uppföljningen 2026-10-18 längst ner. Därefter, 2026-09-10: **v5.139.0 i produktion**. **Samtliga kvarstående punkter i
`TILLGANGLIGHETSREDOGORELSE.md` åtgärdade** (#4–#6, #10, #11 – ärende SYN-6 kan stängas), se
uppföljningen längst ner nedan. **"kviss" bytt till "quiz" i
användarsynlig text**, och tre AI-integrationsrisker åtgärdade (Fynd 1, 2, 5 i
`AI-INTEGRATIONSRISKER-2026-09-06.md`) plus regelhänvisningsläckan i klinikstödet, verifierad
skarpt mot Vertex AI. Se uppföljningen 2026-09-10 nedan. **`firebase-tools`-bumpen
(`^13.35.1` → `^15.29.0`) är DEPLOYAD** (`deploy.yml` #99, success, 2026-09-08 19:54 –
`last-modified`-headern på `https://synappsen-final-build.web.app` matchar exakt
hostingens release-tidsstämpel, samtliga Cloud Functions "Successful update operation").
`functions.config()`-buggen som gjorde att `test:e2e` inte bevisade att Cloud Functions
fungerar är löst. Den tidigare dokumenterade
"diskvalificerande Storage-regressionen" (18/6 misslyckade lokalt) var **felaktig** – ett
sandboxartefakt som inte reproducerar på riktig CI (24/0 klart där, två separata körningar).
Den verkliga blockeraren var en annan, äkta firebase-tools-bugg (`Proxied.getOriginal()`
binder bort statiska egenskaper som `admin.firestore.FieldValue`), fixad på vår sida med en
direktimport i 14 filer. Hela, korrigerade historien står i uppföljningen 2026-09-08 i `etapplaner/STATUSARKIV.md`.
**PR #23 (webbplatsen) mergad 2026-09-08.** De två MDR-orden ("Beslutsstöd"/"triageringsstöd")
är borttagna ur klinikstöd-gränssnittet samma dag, ägarbeslut i `BESLUTSLOGG.md` – se
uppföljningen 2026-09-09 nedan. **Vertex AI-migreringen är
DEPLOYAD** (`deploy.yml` #98, success) och utvärderingen är helt ren efter deployen (13 OK,
0 FEL, 0 GRANSKA). Kvar: bekräfta ett riktigt anrop i appen, se `OPPNA-PUNKTER.md`. Utgående e-post är stoppat
sedan v5.131.0 i väntan på Brevos PUB-avtal. **Etapp L1 (leverantörspanelen) är SLUTFÖRD.**
**Webbplatsen har fått skärmbilder ur appen (nu även `/kliniskt-stod`), fyra publicerade
dokumentsidor, räknade bevissiffror och konsekvent "jag"-röst på start- och underlagssidan**
(se uppföljningen 2026-09-09 nedan) – **sedan 2026-10-21 utan `noindex`** och med ett andra
affärsspår, `foretag.html` (se uppföljningarna nedan). **E2E-sviten är grön igen** (2026-09-07): `test:e2e` startar nu functions-
emulatorn, vilket den inte gjort sedan v5.136.0 bröt den.
**Etapp 72 (`etapplaner/ETAPPLAN19.md`):** riktningen är antagen, beslutspunkt 5
(efterfrågegrinden) gäller fortfarande som huvudregel för alla ÖVRIGA delmål. 72f, 72d och
72h byggda och deployade som ett uttryckligt, engångsbeslutat undantag från grinden (se
`BESLUTSLOGG.md` 2026-09-02) – ägaren instruerade direkt, ingen namngiven kund låg bakom.

## Nuläge

| | |
|---|---|
| **Version i produktion** | **5.139.0** (körning #97, verifierad 2026-09-02: asset-hash `index-D_9UU18e.js` live) |
| **Gren** | `claude/compassionate-euler-rho0q5` – men **kontrollera alltid med `git branch --show-current`**, en session kan startas på en egen gren |
| **AI-kvalitetsmätning** | **Ny 2026-09-06.** Klinikstödets säkerhetsregler (regel 4 = MDR-avgränsningen) mäts nu i tre lager: `tests/functions/klinikstodprompt.test.cjs` (gratis, i varje svep, bevisar att reglerna STÅR kvar), `verifieraKlinikstod` (bara sökmotorn), och `.github/workflows/ai-evaluering.yml` (sju fall mot skarp Vertex AI, manuell dispatch, bevisar vad modellen SVARAR). **Körd skarpt fyra gånger 2026-09-06: reglerna höll i samtliga fall** (körning #4, efter deployen, helt ren: 13 OK, 0 FEL, 0 GRANSKA). Det största fyndet var att mätverktygets egna heuristiker fällde korrekta svar – en korrekt vägran måste innehålla de förbjudna orden. Rättat och verifierat. Modellvalet omprövat och bekräftat: stanna på Gemini. Se `granskningar/SAKERHETSRAPPORT.md` tillägg 2026-09-06 |
| **Senaste kodarbete** | 2026-09-06: Vertex AI-migrering av samtliga sex Gemini-anropsställen (`functions/ai-import.js`, `functions/klinikstod.js`), `@google/genai` i stället för det deprecerade `@google-cloud/vertexai` planen ursprungligen föreslog. **Deployad 2026-09-06** (`deploy.yml` #98, success). GCP-stegen gjorda, `gemini-2.5-flash` bevisad i `europe-west1`, utvärderingen ren efter deployen. `avtal/IT-FAKTABLAD.md` p. 7 och `avtal/UNDERBITRADEN.md` uppdaterade – de sa båda att anropen gick via det publika API:et. Internt/infrastruktur, inget för `andringslogg.js` |
| **Publik webbplats** | `synappsen-web/` (ny 2026-09-05). Statisk, sju sidor (start, företagslösningar, integritet, underlag och tre genererade dokumentsidor), egen hosting-target `web`, härdad med HSTS/COOP. **Live på både `https://synappsen-web.web.app` och egna domänen `https://synappsen.se` (Loopia, kopplad och verifierad 2026-09-06)** – **indexerbar sedan 2026-10-21** (`noindex` borttaget på alla sex sidor, `robots.txt` `Allow: /` med Sitemap-rad), fast bakgrundsstycket och namn/orgnr på policyn fortfarande är platshållare. `kontakt@synappsen.se` bekräftat mottagande 2026-09-05. `deploy-web.yml` skapar hosting-siten idempotent. Domänsäkring (registrar lock/DNSSEC/2FA hos Loopia) fortfarande öppen, se `OPPNA-PUNKTER.md`. Bevakad av `tests/docs/webbplats.test.js` |
| **Senaste dokumentarbete** | 2026-09-03: `granskningar/PRODUKTDEFINITION-REGULATORISKT-UNDERLAG.md` (nytt, dokument nr 72) – kodverifierad produktdefinition som faktabas för den externa juridiska granskningen. Två kvarstående kod/dokument-diskrepanser dokumenterade (§ 9.1 "Beslutsstöd" i gränssnittet, § 9.2 checklistsegets nyckelspärr), varav den första förd till `OPPNA-PUNKTER.md`. Två villkorade assertioner i `tests/docs/dokumentpastaenden.test.js` |
| **Aktiv plan** | `etapplaner/ETAPPLAN19.md` (Etapp 72) – **antagen**, tretton delmål, samtliga sju beslutspunkter avgjorda. Nästa delmål byggs först när en namngiven kund bett om det skriftligt (beslutspunkt 5), eller om det faller under ett av de tre undantagen (nr 1 nu genomfört). `etapplaner/ETAPPLAN13.md` (Etapp 64) juridiskt blockerad |
| **Nästa steg** | **Beställ den externa juridiska granskningen** – underlaget är nu komplett (`granskningar/PRODUKTDEFINITION-REGULATORISKT-UNDERLAG.md` § 11–12), och samma uppdrag täcker Etapp 64, klinikstödets avgränsning och kvissbankens spår 2. **Åtgärda de kvarvarande AI-integrationsriskerna** (`granskningar/AI-INTEGRATIONSRISKER-2026-09-06.md`, fynd 3/4/7/8 – fynd 1/2/5 klara 2026-09-10). Övriga 72-delmål: vänta på en namngiven kund. Fråga de tre mottagarna i det pågående utskicket vad de vill ha härnäst (billigast av allt, se planens beslutspunkt 5). Separat: flytta ägarens eget konto med `flyttaTillPlattformskonto()`, och verifiera `roles/firebaseauth.admin` med "Tvinga utloggning" |
| **AI-integrationsrisker** | Genomgång av samtliga sex AI-anropsställen 2026-09-06 efter ägarens fråga om personuppgifter/hallucination/MDR-gräns, 8 namngivna fynd: `granskningar/AI-INTEGRATIONSRISKER-2026-09-06.md`. **Fynd 1, 2, 5 åtgärdade 2026-09-10** (se uppföljningen nedan) – fynd 3, 4, 7, 8 kvarstår, prioritetsordning i dokumentet |

## Var du hittar saker

| Vad | Var |
|---|---|
| **Fullständig dokumentinventering** (alla dokument, med typ och underhållsutlösare) | `DOKUMENTREGISTER.md` |
| Vad som väntar på ägaren | `OPPNA-PUNKTER.md` |
| Tagna ägarbeslut | `BESLUTSLOGG.md` |
| Teknisk historik per fas | `etapplaner/UTVECKLINGSLOGG.md` |
| Äldre statusuppföljningar | `etapplaner/STATUSARKIV.md` |
| Releaserutinen steg för steg | `.claude/skills/synappsen-release/SKILL.md` |

## Så här jobbar vi i det här projektet (etablerade mönster – följ dessa)

1. **Deploy till produktion** görs ALLTID via GitHub Actions-workflowen
   `deploy.yml` (trigger: `mcp__github__actions_run_trigger`,
   `run_workflow`, `workflow_id: deploy.yml`, ref: den aktuella
   arbetsgrenen). Polla med `actions_list`/`list_workflow_jobs` tills job är
   `completed`.
   **RÄTTAT 2026-07-28:** `continue-on-error` togs bort från "Deploya till
   Firebase"-steget redan i Etapp 8b (`etapplaner/ETAPPLAN2.md`) – jobbets
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
   `etapplaner/UTVECKLINGSLOGG.md` (kronologisk historik, "Fas N – rubrik"). Läs den
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
7. **Git-gren:** kontrollera alltid med `git branch --show-current` – anta ingen
   gren. `claude/compassionate-euler-rho0q5` är default-grenen och är aktuell
   (v5.97.0), men en session kan startas på en egen sessionsgren – 2026-08-11
   t.ex. `claude/synappsen-final-review-slzcxe`.
   Se `CLAUDE.md`s arbetsmönster. Skapa inte PR om inte användaren explicit ber om det
   (gäller detta repo/denna arbetsmiljö specifikt – kan skilja sig i andra kontext).

## Nyckelfiler att känna till

**Se `CLAUDE.md` för den fullständiga, underhållna dokumentkartan** (vilken fil är aktuell,
vilken är historisk, vilken är auktoritativ för vad). Kort version:

- `etapplaner/ETAPPLAN.md` (Etapp 0–5), `etapplaner/ETAPPLAN2.md` (Etapp 6–12), `etapplaner/ETAPPLAN3.md` (Etapp 13–21) –
  historiska men KORREKTA, status per delmål underhållen inline. Alla tre klara utom
  namngivna, medvetet pausade punkter (13f SSO, Etapp 16 veckopuls).
- `etapplaner/ETAPPLAN4.md` – Etapp 22–31. **Var den aktiva planen när det här stycket skrevs; är det
  inte längre** (`etapplaner/ETAPPLAN5.md` tog över, och sedan 2026-08-01 är `etapplaner/ETAPPLAN6.md` aktiv).
  Historisk men korrekt.
- `produkt/FRAMTIDSPLAN.md` – **arkiv över ej antagna planer** sedan 2026-08-01 (var dessförinnan en
  pekare mot den aktiva planen, och blev stale i den rollen två gånger).
- `produkt/MODULPLAN.md` – modul-/affärsplan (skrevs om 2026-07-28, var stale sedan v5.10.0 – påstod
  bl.a. felaktigt att organisationsmodellen inte var byggd).
- `etapplaner/UTVECKLINGSLOGG.md` – fullständig kronologisk teknisk historik, "Fas 1–41+".
- `granskningar/SAKERHETSRAPPORT.md` – säkerhetsgranskning av multi-tenant-lagret.
- `granskningar/TILLGANGLIGHETSREDOGORELSE.md` – WCAG-status per punkt.
- `src/data/andringslogg.js` – användarvänd ändringslogg (visas i appen, `/nyheter`).
- `src/version.js` – läser version DIREKT från `package.json`, ska inte redigeras manuellt.
- `firestore.rules` / `storage.rules` – multi-tenant-säkerhetsmodellen,
  organisationsisolering, 2FA-policy, dokumentorganisation-cross-lookup.
- `functions/index.js` – Cloud Functions (AI-import, backup, migrering,
  modul-gating, kostnadshistorik, schemalagda jobb, push-notiser).
- `tests/rules/`, `tests/functions/` – emulator-baserade testsviter.


## Uppföljning 2026-10-21 (visuellt och strukturellt lyft av webbplatsen, andra affärsspåret `foretag.html`)

Ägarens beställning i fyra steg. **Två förutsättningar i den stämde inte** och lästes mot verkligheten:
sidomenyn var redan `position: sticky` och aktiv sektion markerades redan i `sida.js` (det "tomma
fältet" var ett artefakt i en helsidesbild som sätts ihop av flera bilder, kontrollerat med riktig
scroll), och `csp-hash`-, `kontrastpalett`- och `fokusmarkering`-testerna bevakar appen, inte webbplatsen.

**Det verkliga felet bakom luftproblemen:** sajtens CSP är `style-src 'self'`, och 42 `style="…"`
(25 på startsidan) blockerades tyst i produktion. Avstånden fanns i markupen men aldrig på skärmen.
Alla ersatta med klasser i `stil.css`, även i generatorns mall. Test failar om ett style-attribut återkommer.

Byggt: hero i två kolumner, sektion 03 med infokort, kontaktkort med bokningsknapp och kopiera-knapp,
områdesväxlare (hänvisningsraden finns bara på företagssidan, vårdsidan länkar i sidfoten), bakgrundsstycket skrivet. `foretag.html` med tre paket, räkneexempel
och garanti (i sitemap och `DOKUMENTREGISTER.md`, 80 dokument). Nya vakter: inga style-attribut, alla
interna länkar och ankare finns, sitemap listar varje sida, räkneexemplets aritmetik, ingen synlig
platshållare på säljsidorna.

**Avvikelser från beställningen:** "jag" i stället för "vi" (`VARUMARKE.md` §8), räkneexemplet märkt
[uppskattning] (§7), "mjuk skugga" är profilens egen `--skugga` (`GRAFISK-PROFIL.md` §5), infokortet
säger "beräknas när rapporten öppnas" och "via webbläsarens utskrift" i stället för "realtid" och
"verifierad export" (stämmer med `Ledningsrapport.jsx`), och "två räddade bokningar täcker avgiften"
i stället för "mindre än 2" (1 920 kr mot 1 490 kr). **Öppet i `OPPNA-PUNKTER.md`:** företagssidans
villkor och avtal (garantins avtalstext, leveranslöften, SMS, AI-märkning) och ägarens läsning av bakgrundsstycket.
Priserna är exkl. moms (avgjort samma dag, står på sidan) och `foretag.html` deployades med garantin oförändrad, och garantin skrevs sedan om så att den gäller bygget (startavgiften) och inte månadsavgiften.

## Uppföljning 2026-10-21 (`noindex` borttaget från webbplatsen på ägarens uppdrag)

Ägaren bad uttryckligen om det ("Ta bort noindex nu"). Villkoren i den gamla öppna punkten
var **inte** uppfyllda och påpekades innan bytet: bakgrundsstycket och innehavarens
namn/orgnr/adress är fortfarande platshållare, och de tre dokumentsidorna (Brevo-bristen,
interna sökvägar) är inte genomlästa. Beslutet står i `BESLUTSLOGG.md` 2026-10-21.

`<meta name="robots">` borttagen ur `index.html`, `integritet.html`, `underlag.html` och
ur mallen i `bygg-underlag.mjs` (de tre dokumentsidorna regenererade, inte handredigerade).
`robots.txt` tillbaka till `Allow: /` med Sitemap-rad. Ny vakt i `webbplats.test.js`: alla
sex sidor och robots.txt är gömda eller öppna tillsammans, aldrig en blandning (mutations-
kontrollerad). Tillgänglighetsredogörelsens påstående "fortfarande noindex" rättades i
källdokumentet, annars hade den publika sidan blivit fel vid deployen. **Tar effekt först
vid `deploy-web.yml`** (en merge deployar inte).

## Uppföljning 2026-10-18 (AI-integrationsrisker fynd 3, 4, 7, 8 – v5.140.0)

De fyra återstående fynden i `granskningar/AI-INTEGRATIONSRISKER-2026-09-06.md` är åtgärdade i
koden. Detaljer och motiveringar står i incheckningsmeddelandet och i fyndens egen
statuslista; här bara läget. **Deployad 2026-10-18 (körning #100).** Gallringsjobbet
`aiGallringSchemalagt` har inte körts än – första körning är nästa måndag 03:45.

- **Fynd 8:** `aterbetalaBudget()` i alla fem AI-vägar när modellen inte levererat ett svar.
  Ett kasserat svar (personnummer i svaret) återbetalas medvetet inte.
- **Fynd 7:** `aiAnropslogg` (organisationId, uid, funktion, tid – aldrig innehåll),
  klientstängd. Svarar på om/när/av vem, inte på vad. Incidentplanen är nu v1.7 och
  `drift/INCIDENT-CHECKLISTA.md` säger uttryckligen att loggen inte kan visa vad som skickats.
- **Fynd 3:** `aiGallringSchemalagt` (måndagar 03:45): `klinikfrageloggar` 90 d,
  `klinikfragecache` 7 d, `aiAnropslogg` 90 d. **Ägaren har inte bekräftat 90/7 dagar** – siffrorna
  följer fyndets eget förslag och backupretentionen. Org-radering och backup enumererar inte
  de här tre collectionerna (gällde redan klinikloggarna); gallringen är det som begränsar dem.
- **Fynd 4:** fall 8–9 i `ai-evaluering.cjs`. **Mätt mot skarp Vertex AI 2026-10-18
  (`ai-evaluering.yml` körning #6, commit `ee626a7`): 16 OK, 0 FEL, 2 GRANSKA.** Betet
  (adrenalin utan dos i källtexten) motstods: stegen och quizens tre frågor höll sig till
  källtexten, inga uppfunna doser eller tider. GRANSKA-raderna lästes mot rutintexten: alla tre
  facit stämmer och hänvisningarna är nästan ordagranna. **Begränsning att inte glömma:** ett
  enda urval av en enda text från en icke-deterministisk modell. Det bevisar att kodvägen och
  promptreglerna fungerar, inte att det aldrig inträffar; kontrollen fångar inte heller ett
  påstående utan siffror. Mät om efter en modelluppdatering hos Google.

**Verifierat:** lint, vitest (609), bygge, full `test:functions` (EXIT 0), regeltester för
organisationsisolering (187). Testet för fynd 8 bevisades falla utan fixen. Webbplatsens
bevissiffror (406/187) och incidentplanens version höjdes i samma commit eftersom
`tests/docs/dokumentpastaenden.test.js` kräver det. Full `test:rules` och `test:e2e` kördes
inte i sin helhet efter ändringen – bara den ändrade regelfilen.

**Gren:** default-grenen hade byggts om sedan PR #15, så sessionsgrenen startades om från den
och pushades med force-with-lease efter kontroll att dess innehåll redan fanns i default.

## Uppföljning 2026-09-10 (samtliga kvarstående punkter i TILLGANGLIGHETSREDOGORELSE.md åtgärdade)

Gick igenom hela dokumentet på ägarens begäran och åtgärdade samtliga fem kvarstående punkter
i tabellen (#4–#6, #10, #11), plus en av de tre "Att göra före publicering"-punkterna:

- **#4** (Anslagstavlan saknade `<h1>`): visade sig **redan rättad i koden** –
  `src/pages/Anslagstavla.jsx` har ett ovillkorat `<h1>` sedan tidigare. Ren dokumentationsdrift,
  rättad genom att verifiera mot faktisk kod (genomgående krav 8) i stället för att bygga om
  något som redan fungerade.
- **#5/#6** (bekräftelsemeddelanden): `DialogProvider.jsx` har nu en riktig
  `<button aria-label="Stäng meddelande">` (tangentbordsbar) i stället för ett `onClick` på en
  `<div>`, och hover/fokus pausar den 5-sekunders auto-stängningen helt tills man lämnar den.
- **#10** (rutinformulärets etikett): innehållsfältet har nu ett fristående
  `<label htmlFor="rutin-innehall-falt">` som pekar bara på textarean, inte på verktygsraden.
- **#11** (emoji i rubriker): `<h1>`–`<h4>` i 85 filer fick sin ledande emoji inpackad i
  `<span aria-hidden="true">`, mekaniskt genererat och verifierat tomt efteråt. Upptäckte i
  samma svep att navigeringslänkarna (`BottomNav.jsx`/`Sidomeny.jsx`) redan gjorde rätt sedan
  tidigare – bara sammanfattningen hade inte fångat det.
- **Publicering, p. 2**: redogörelsen var redan publicerad (`synappsen-web/tillganglighet.html`)
  men olänkad FRÅN appen. Länk tillagd i `AuthSkal.jsx` (delas av inloggning/registrering) och
  `Hjalp.jsx`.

**Medvetet inte ändrat:** den övergripande "delvis förenlig"-bedömningen. Ingen känd
WCAG-avvikelse kvarstår, men skärmläsartestning, 400 %-förstoring, träffytor och
användartestning med funktionsnedsättning är fortfarande otestat – att skriva "fullt förenlig"
på det underlaget vore ett starkare påstående än det bär. De två kvarvarande `[FYLL I]`-fälten
(juridiskt namn, e-post) kräver ägaren, se `OPPNA-PUNKTER.md`.

Uppdaterade statusberoende sidoeffekter i samma svep: `OPPNA-PUNKTER.md` (raden om de fyra
WCAG-bristerna borttagen), `saljmaterial/KOPARANALYS.md` §6.7/punkt 7, och
`Synappsen-upphandlingssvar.html` svar D1 (CLAUDE.md:s regel om statusberoende svar).
Testassertionen i `tests/docs/dokumentpastaenden.test.js` som band ihop redogörelsens
sammanfattning och tabell uppdaterad för att hantera "noll kvarstående brister" utan att tvinga
fram ett påstått fel.

**Efterföljande rättning samma dag:** ägaren pushade en egen commit direkt till grenen
(`0ce31cb`) som fyllde i de två kvarvarande `[FYLL I]`-fälten (`Kasper Lindqvist`,
`kontakt@synappsen.se`) och bytte flera "vi"/"oss" till "jag"/"mig", inklusive två
rubriker (`## Hur vi har testat tjänsten` → `## Hur jag har testat tjänsten` och
`### Vad vi uttryckligen inte har testat` → `### Vad jag uttryckligen inte har testat`).
`git merge` gick igenom utan konfliktmarkörer, men lämnade två inline-hänvisningar som
citerade de GAMLA rubrikerna ordagrant ("se \"Hur vi har testat tjänsten\" nedan") – en äkta,
av sammanslagningen införd inkonsekvens, inte ägarens fel. Rättade båda hänvisningarna plus
återstående "vi"/"vår"/"oss" på fem ställen till "jag"/"min"/"mig" för en konsekvent röst
genom hela dokumentet. Tog bort `OPPNA-PUNKTER.md`s rad om de `[FYLL I]`-fälten (nu lösta) och
skrev om "Att göra före publicering" så bara p. 3 (anbudsbeslutet) står kvar som öppen.
`synappsen-web/tillganglighet.html` omgenererad. Fullt testsvep (lint, vitest, build) grönt.

## Uppföljning 2026-09-10 ("kviss" -> "quiz", tre AI-integrationsrisker åtgärdade)

**"kviss" bytt till "quiz" i användarsynlig text.** Bara text som faktiskt visas – frågeinnehåll
i `src/data/kvissbank.js`/`functions/kvissfragorSeed.js`, en bekräftelsedialog, ett
felmeddelande och en legend i `RutinFormular.jsx`. Kodidentifierare, filnamn,
Firestore-collections (`kvissfragor`, `kvisspaket`, `kvissoverlagring`, `kvissegna`) och Cloud
Functions-namn (`sparaGlobalKvissfraga` m.fl.) rör produktionsdata och deployade funktioner och
lämnades medvetet oförändrade – ägarens eget vägval när frågan ställdes.

**Tre öppna AI-integrationsrisker åtgärdade** (`granskningar/AI-INTEGRATIONSRISKER-2026-09-06.md`):

- **Fynd 1** (allvarligast): `LaddaUpp.jsx` visar nu en patientuppgifts-påminnelse
  (`BILDUPPLADDNING_PAMINNELSE`, `piiFilter.js`) INNAN bilden når Storage – inte bara innan den
  skickas till Gemini. Ingen OCR i klienten, så det är per definition en påminnelse, inte en
  detektion, med samma begränsning som den befintliga namn-varningen för text.
- **Fynd 2**: `raderaInkommandeFoto()` (`functions/ai-import.js`) tar bort originalfotot ur
  `inkommande/{uid}/` efter en lyckad tolkning, i stället för att låta det ligga kvar
  permanent. Körs EFTER Firestore-sparningen så ett misslyckat försök går att köra om.
  `bildUrl` blir en död länk – accepterat medvetet, den var redan opålitlig för de flesta
  granskare (Fynd 6, kvarstår öppen separat).
- **Fynd 5**: `kallaKviss`/`kallaSteg` (samma "byter aldrig ursprung"-mönster som `rutin.kalla`)
  sätts när ett AI-förslag för quizfrågor/checklistesteg hämtas in, med badges i `RutinKort.jsx`
  ("AI-tolkad quiz"/"AI-tolkade steg"). Nollställs bara om HELA listan tas bort manuellt, så en
  helt nyskriven fråga inte ärver en gammal märkning.

**Regelhänvisningsläckan** (modellen skrev "[Regel 4, 6]" i ett klinikstödssvar, upptäckt
2026-09-06): regel 3 i `byggKlinikstodPrompt` utökad med ett explicit förbud mot att hänvisa
till promptens egna regler. Kört om skarpt mot Vertex AI direkt efteråt eftersom det ändrar den
MDR-bärande prompttexten (`ai-evaluering.yml` #5): **13 OK, 0 FEL, 0 GRANSKA**, inga
regelhänvisningar i något av de sju svaren. Tillägg i `SAKERHETSRAPPORT.md`.

Fynd 3/4/7/8 i samma granskning kvarstår öppna, se `granskningar/AI-INTEGRATIONSRISKER-2026-09-06.md`s
prioritetsordning.

## Uppföljning 2026-09-09 (webbplatstexten omskriven för att inte läsa som AI-genererad)

Ägaren bad om en genomgång av `index.html` och `underlag.html` för att formuleringarna
inte skulle kännas maskinskrivna: färre tankstreck som pausmarkör, mindre av den
upprepade "inte X, utan Y"-kontrasten, mindre tung fetmarkering mitt i löptext.

Gick igenom all brödtext rad för rad och skrev om. **Det som INTE rördes, med skäl:**
`<title>`/`og:title`s "Synappsen – tagline" (universell branding-konvention, äldre än
AI), de nio `sek-nr`-etiketterna ("01 — Problemet", ren designstruktur, inte löpande
text), tabellens platshållar-"—" för ett tomt värde, utvecklarkommentarerna, och
bakgrundsstyckets ännu oskrivna platshållartext.

**Två mekaniska bindningar krävde extra försiktighet innan redigering** – siffrorna
"404 automatiska behörighetstester", "185 av dem", "sju svenska källor" och alla
priser är bundna av `tests/docs/dokumentpastaenden.test.js` och
`tests/docs/webbplats.test.js` och fick stå kvar exakt som de var. Ett ställe krävde
en ändring i testet också: "Sju roller —" bytte tankstreck mot punkt ("Sju roller."),
så testets regex `/(\w+) roller —/` uppdaterades till `/(\w+) roller\./` i samma
commit.

Fullt testsvep efter varje redigeringsomgång: `npm run lint`, `npx vitest run`
(607 tester), `npm run build` – alla gröna.

## Uppföljning 2026-09-09 (PR #23 mergad, klinikstöd-fyndet dubbelkollat, /kliniskt-stod fotograferad, "jag"-röst genomförd)

**PR #23 (webbplatsens bevislucka) mergad 2026-09-08**, `firebase-tools`-buggen bekräftad
löst och deployad – se uppföljningen nedan. Innan nästa steg dubbelkollades ägarens
godkända fix av "Beslutsstöd"/"triageringsstöd" mot faktisk kod (`KlinikfragaSok.jsx`,
`KlinisktStod.jsx`, `BESLUTSLOGG.md` 2026-09-08): korrekt, ersättningstexten är oförändrad
mot `JURIDISK-GRANSKNING.md` § 6.4, och källantalet stämmer nu mot `GODKANDA_KALLDOMANER`
(sju).

**Skärmbild av `/kliniskt-stod` tillagd** (`synappsen-web/verktyg/skarmbilder.spec.mjs`),
ersätter den tidigare `/administration`-substitutionen. Bilden (`app-rutiner.png`, samma
plats i `index.html`) visar klinikstöd-sökningen med källhänvisningstexten synlig men
**tom och oskickad** – sökningen anropar en extern källa (Google Programmable Search +
Vertex AI) som varken emulatorn eller bildtagningen har åtkomst till, och ett riktigt
sökresultat ska aldrig hårdkodas i en marknadsbild. Alt-text och bildtext omskrivna för att
beskriva den faktiska bilden (verifierad visuellt, inte antagen).

**Röstbyte "vi" → "jag"** (`produkt/VARUMARKE.md` §8) genomfört i `index.html` och
`underlag.html` – de två filer öppna punkten pekade ut. Genomgånget rad för rad: två
kvarvarande "vi"-förekomster i `index.html` (rubriken "vet vi att alla har läst..." och
"Ni sa, vi gjorde") är **medvetet lämnade** – de återger kundens/personalens egna röst, inte
Synappsens, och skulle ha blivit fel om de bytts. `integritet.html` (policydokument, ett
tiotal "vi") **rördes inte** – låg utanför den öppna punktens uttalade filscope och var inte
en del av den här begäran. Raden borttagen ur `OPPNA-PUNKTER.md`.

Fullt testsvep: `npm run lint`, `npx vitest run` (607 tester), `npm run build` – alla gröna.

## Uppföljning 2026-10-21 (slumpvisa e2e-fel: tillganglighet.spec.js och sidomeny.spec.js)

Två e2e-test föll slumpvis på CI på PR:er som bara rörde webbplatsen, och blev gröna vid
omkörning. **Båda reproducerades lokalt med CPU-strypning** (Chromium via CDP,
`Emulation.setCPUThrottlingRate`) – inte antagna.

- **Fel 1 (axe: `landmark-one-main` + `page-has-heading-one`) – misstänkt orsak delvis fel.**
  Förslaget var Suspense-fallbacken i `App.jsx`. För de routes som felade (`/papperskorg`,
  `/lankbibliotek`) ligger fallbacken redan INNE i `<main>`. Den verkliga orsaken är
  `AuthProvider`, som renderade `{!loading && children}`: **ingenting alls** – en tom sida utan
  `<main>`, `<h1>` eller hoppa-länk – tills inloggningsstatus var löst. Vid CPU x25 var
  `document.body.innerText` tom och axe gav exakt de två reglerna. **Riktig brist, inte bara
  ett testproblem** (`TILLGANGLIGHETSREDOGORELSE.md` #19): laddningsläget är nu ett
  `<main id="huvudinnehall">` med en `role="status"`-rad, bevakat av
  `src/context/AuthContext.test.jsx` (faller mot gamla koden, verifierat).
- **Fel 2 (`sidomeny.spec.js`: fick 0):** bekräftat som misstänkt. `evaluateAll` väntar inte, och
  `waitForURL` visar bara att adressen bytts. Vid CPU x12 blev antalet 0 varje gång. Testet
  väntar nu in att navigeringen finns; kravet "exakt 1 synlig" prövas lika strikt som förut.
- **`tillganglighet.spec.js` väntar nu atomärt** (`waitForFunction`: `<main>` finns OCH ingen
  `.sida--laddar`). Två separata väntan i följd räckte inte: `/admin` för rollen personal
  omdirigeras till `/`, och `<Navigate>` renderar `null` ett ögonblick, så båda väntan kunde
  vara uppfyllda var för sig. Hittat genom att köra den första versionen under strypning.
  En route som aldrig renderar lyfts som ett problem, inte som ett falskt grönt.
  **Axe-reglerna är oförändrade, inget test hoppat över.**
- Ny assertion i `tests/docs/dokumentpastaenden.test.js`: "Planerad åtgärd (1–N)" måste sluta på
  tabellens sista radnummer. `synappsen-web/tillganglighet.html` regenererad.

**Före/efter under identisk strypning (CPU x10, personal/dark, alla 25 routes):** gamla koden
14 routes med axe-fel; nya koden 0.

**Verifierat:** lint, vitest (628), `test:e2e` utan Functions-emulatorn **tre gånger i rad**:
27 gröna varje gång, inklusive alla fyra axe-körningar och alla sex sidomenytester.

**Vad som INTE är verifierat – och varför:** de 14 `rokprov.spec.js`-testen faller i varje körning
i den här sandboxen, **även på orörd basgren** (`ERR_CONNECTION_REFUSED`, specens egen kommentar
förklarar att sviten kräver Functions-emulatorn sedan v5.136.0). Functions-emulatorn startar inte
här: `firebase-tools` får 502 "upstream request failed" från sandboxens proxy när den
registrerar Firestore-triggers mot `127.0.0.1:8080`. Med mina ändringar innehåller de 335
felraderna noll andra fel än den raden. **Kör `npm run test:e2e` (med Functions-emulatorn) på CI
innan merge.** Ingen versionsbump och ingen deploy gjord.

