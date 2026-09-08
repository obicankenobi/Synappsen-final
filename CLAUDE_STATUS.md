# Status & överlämning – läs mig först i en ny Claude Code-session

> Kort "var slutade vi och vad gör jag nu"-sammanfattning. Ersätter INTE
> `etapplaner/UTVECKLINGSLOGG.md` (detaljerad teknisk historik) eller planfilerna i
> `etapplaner/` – den pekar vidare dit.
>
> **Historiken ligger i `etapplaner/STATUSARKIV.md`** (152 uppföljningar från 2026-07-28 och
> framåt). Den här filen behåller bara de senaste. Sök i arkivet när du behöver veta *varför*
> något gjordes.

**Senast uppdaterad:** 2026-09-07 · **v5.139.0 i produktion**. Parallell tråd (gren
`claude/synappsen-webbplats-jnmzn1`, PR #23, grön/mergebar) hittade två MDR-ord kvar i
gränssnittet (⚠️ ägarbeslut, `OPPNA-PUNKTER.md`) och att `test:e2e` inte längre bevisar att
Cloud Functions fungerar (`firebase-tools@13`-bugg, se samma fil). **Vertex AI-migreringen är
DEPLOYAD** (`deploy.yml` #98, success) och utvärderingen är helt ren efter deployen (13 OK,
0 FEL, 0 GRANSKA). Kvar: bekräfta ett riktigt anrop i appen, se `OPPNA-PUNKTER.md`. Utgående e-post är stoppat
sedan v5.131.0 i väntan på Brevos PUB-avtal. **Etapp L1 (leverantörspanelen) är SLUTFÖRD.**
**Webbplatsen har fått skärmbilder ur appen, fyra publicerade dokumentsidor och räknade
bevissiffror** (se uppföljningen 2026-09-06 om bevisluckan) – fortfarande `noindex`, nu sex
sidor som ska avgömmas samtidigt. **E2E-sviten är grön igen** (2026-09-07): `test:e2e` startar
nu functions-emulatorn, vilket den inte gjort sedan v5.136.0 bröt den.
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
| **Publik webbplats** | `synappsen-web/` (ny 2026-09-05). Statisk, två sidor, egen hosting-target `web`, härdad med HSTS/COOP. **Live på både `https://synappsen-web.web.app` och egna domänen `https://synappsen.se` (Loopia, kopplad och verifierad 2026-09-06)** – men medvetet fortsatt `noindex, nofollow` (båda sidorna + `robots.txt` `Disallow: /`) – bakgrundsstycket och namn/orgnr på policyn saknas fortfarande. `kontakt@synappsen.se` bekräftat mottagande 2026-09-05. `deploy-web.yml` skapar hosting-siten idempotent. Ta bort `noindex` när de två kvarvarande punkterna är klara, se `OPPNA-PUNKTER.md`. Domänsäkring (registrar lock/DNSSEC/2FA hos Loopia) fortfarande öppen, se `OPPNA-PUNKTER.md`. Bevakad av `tests/docs/webbplats.test.js` |
| **Senaste dokumentarbete** | 2026-09-03: `granskningar/PRODUKTDEFINITION-REGULATORISKT-UNDERLAG.md` (nytt, dokument nr 72) – kodverifierad produktdefinition som faktabas för den externa juridiska granskningen. Två kvarstående kod/dokument-diskrepanser dokumenterade (§ 9.1 "Beslutsstöd" i gränssnittet, § 9.2 checklistsegets nyckelspärr), varav den första förd till `OPPNA-PUNKTER.md`. Två villkorade assertioner i `tests/docs/dokumentpastaenden.test.js` |
| **Aktiv plan** | `etapplaner/ETAPPLAN19.md` (Etapp 72) – **antagen**, tretton delmål, samtliga sju beslutspunkter avgjorda. Nästa delmål byggs först när en namngiven kund bett om det skriftligt (beslutspunkt 5), eller om det faller under ett av de tre undantagen (nr 1 nu genomfört). `etapplaner/ETAPPLAN13.md` (Etapp 64) juridiskt blockerad |
| **Nästa steg** | **Beställ den externa juridiska granskningen** – underlaget är nu komplett (`granskningar/PRODUKTDEFINITION-REGULATORISKT-UNDERLAG.md` § 11–12), och samma uppdrag täcker Etapp 64, klinikstödets avgränsning och kvissbankens spår 2. Ta samtidigt ägarbeslutet om "Beslutsstöd"-raden i `OPPNA-PUNKTER.md`. **Åtgärda AI-integrationsriskerna** (`granskningar/AI-INTEGRATIONSRISKER-2026-09-06.md`, 8 fynd, prioritetsordning i dokumentet – börja med fynd 1, personuppgiftskontrollen sker efter överföringen till Vertex AI). Övriga 72-delmål: vänta på en namngiven kund. Fråga de tre mottagarna i det pågående utskicket vad de vill ha härnäst (billigast av allt, se planens beslutspunkt 5). Separat: flytta ägarens eget konto med `flyttaTillPlattformskonto()`, och verifiera `roles/firebaseauth.admin` med "Tvinga utloggning" |
| **AI-integrationsrisker** | **Ny 2026-09-06.** Genomgång av samtliga sex AI-anropsställen efter ägarens fråga om personuppgifter/hallucination/MDR-gräns. 8 namngivna fynd, ingen kod ändrad än, prioritetsordning satt: `granskningar/AI-INTEGRATIONSRISKER-2026-09-06.md`. Allvarligast (fynd 1): personuppgiftskontrollen på bilder körs EFTER överföring till Vertex AI, inte före. Spårat rad för rad i `OPPNA-PUNKTER.md` |

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


## Uppföljning 2026-09-07 (fynd från en parallell tråd verifierade och registrerade – ingen kod ändrad)

En parallell session har arbetat med den publika marknadswebbplatsen (`synappsen-web/`) på
gren `claude/synappsen-webbplats-jnmzn1`, PR #23 (grön, mergebar). Den hittade två saker som
ligger i produkten, inte i webbplatsen, och rapporterade dem hit i stället för att åtgärda dem
själv. **Alla tre påståenden nedan är oberoende verifierade mot faktisk kod i den här
sessionen** innan de skrevs in – inget togs för givet.

**1. Två MDR-ord kvar i gränssnittet, samma stycke har ett andra fel på köpet.**
`KlinikfragaSok.jsx:92` säger fortfarande "Beslutsstöd" (bekräftat, exakt ordalydelse), och
`KlinisktStod.jsx:11` säger "triageringsstöd" (bekräftat) – båda på
`AVSETT-ANDAMAL-KLINIKSTOD-2026-08-30.md`s lista över förbjudna ord. Redan spårat sedan
2026-09-03 (`PRODUKTDEFINITION-REGULATORISKT-UNDERLAG.md` § 9.1/§ 9.3), men INTE tidigare i
`OPPNA-PUNKTER.md` med den skärpa det förtjänar. Samma stycke i `KlinikfragaSok.jsx` räknar
dessutom upp fem källor där koden (`GODKANDA_KALLDOMANER`) har sju – bekräftat, `vardhandboken.se`
och `folkhalsomyndigheten.se` saknas i hjälptexten. **Ny konsekvens som höjde brådskan:**
`/kliniskt-stod` kan inte fotograferas till webbplatsen så länge orden står kvar (en skärmbild
hade publicerat dem och rundat webbplatsens egen ordvakt), så vyn är medvetet utelämnad ur
webbplatsens skärmbildsverktyg – produktens mest säljbara vy är just nu den enda som inte kan
visas upp. Ersättningstexten är redan framtagen och citerad (`JURIDISK-GRANSKNING.md` § 6.4).
**Inte ändrat här:** det är, som `OPPNA-PUNKTER.md` redan konstaterat innan denna uppföljning,
ett ja/nej på formulering som tillhör ägaren, inte en kodsession, även när formuleringen redan
är skriven. Uppdaterad rad i `OPPNA-PUNKTER.md` med alla tre delfynd.

**Min egen bedömning, tillagd i den här sessionen:** `startvy.js:20`s "triagering" (bekräftat,
utan "-stöd") är INTE samma sak som "beslutsstöd"/"triageringsstöd", och jag rekommenderar att
lämna den. Förbudslistan i `AVSETT-ANDAMAL-KLINIKSTOD-2026-08-30.md` gäller ord med
"-stöd"-ändelsen, eftersom just den ändelsen gör ordet till ett *funktionsanspråk* – att
produkten UTFÖR eller BISTÅR vid ett kliniskt beslut. "Triagering" utan ändelsen beskriver bara
vilket ÄMNE rutinerna handlar om ("rutiner om triagering finns i appen"), på exakt samma sätt
som "Handläggningsrutiner" i samma mening beskriver ämne utan att påstå en funktion. Att byta
den skulle vara en överreaktion på ett ordval som inte bär den risk de andra två gör. Skriven in
i `OPPNA-PUNKTER.md`s rad så att en framtida session inte återupptäcker samma fråga.

**2. `test:e2e` bevisar inte längre att Cloud Functions fungerar.** `firebase-tools@13.35.1`s
emulatorruntime anropar `functions.config()` vid varje worker-start – en funktion borttagen i
`firebase-functions@7` (bekräftat: vår version är `^7.3.0`, och grep bekräftar att ingen egen
fil anropar `functions.config()`, felet ligger i verktyget). Emulatorn laddar alla ~100
funktionsdefinitioner utan fel, men varje ANROP dör med ett svalt 500-fel. Den andra tråden
lade till `functions` i `test:e2e`s emulatorlista (se punkt 3 nedan) eftersom
`AuthContext.jsx` numera anropar `rapporteraAppVersion` på inloggningsvägen – utan den ändringen
var HELA e2e-sviten röd på båda grenarna sedan v5.136.0, oupptäckt. Sviten är nu grön, men det
beror på att appen sväljer 500-svaret, inte på att en funktion faktiskt svarade rätt.
`firebase-tools@15` (senast 15.29.0) verkar sakna buggen (provkört, inga
`functions.config()`-fel vid initiering) men kunde inte verifieras fullt ut här (ett proxyfel
stoppade firestore-triggerregistreringen i den här sandboxen). En bump av `firebase-tools` är
samma verktyg som kör produktionsdeployerna – kräver ägarens ja och en verifierad deploy
efteråt, inte en ren kodändring. Ny rad i `OPPNA-PUNKTER.md`, och en varningsrad tillagd i
`.claude/skills/synappsen-release/SKILL.md` så att en framtida releasesession inte citerar ett
grönt `test:e2e` som bevis för att en funktionsändring fungerar.

**3. Ingen dubblettrisk.** PR #23 har redan ändrat `package.json` (`test:e2e` startar nu
`functions`-emulatorn, orsaken beskriven ovan) och `LeverantorLayout.jsx` (laddnings- och
"saknar behörighet"-lägena renderar nu `<main id="huvudinnehall">` i stället för `<div>` – en
verklig WCAG-brist, 1.3.1/2.4.1, som axe missade eftersom laddningsläget passerade på
millisekunder). **Verifierat att INGENDERA ändring finns på den här grenen ännu** (diff mot
`origin/claude/synappsen-webbplats-jnmzn1`) – de kommer via PR #23:s merge. **Rör alltså inte
`package.json`s `test:e2e`-rad eller `LeverantorLayout.jsx` i den här eller någon framtida
session innan PR #23 är mergad**, annars dubbleras arbetet eller uppstår en mergekonflikt.

**Ingen kod ändrad i den här uppföljningen** – bara dokumentation och tracking, som ägaren
uttryckligen bad om. Ändrade filer: `OPPNA-PUNKTER.md` (två rader utökade/tillagda),
`.claude/skills/synappsen-release/SKILL.md` (varningsrad), `CLAUDE_STATUS.md`.

## Uppföljning 2026-09-07 (e2e-blockeraren fixad – och den dolde en verklig WCAG-brist)

**Utgångspunkt:** hela e2e-sviten hade varit röd på default-grenen sedan v5.136.0 (Etapp L1j),
utan att det uppmärksammats. Fjorton rökprovstester föll med
`Failed to load resource: net::ERR_CONNECTION_REFUSED` på var och en av de 24 rutterna.

**Orsak:** `AuthContext.jsx:110` anropar Cloud Function-en `rapporteraAppVersion` på
inloggningsvägen sedan Etapp L1j. `test:e2e` startade bara `auth,firestore,storage` – ett
medvetet val från Etapp 45b, då `/leverantor` var den enda sidan som anropade en funktion.
Det slutade stämma i samma sekund L1j byggdes, och eftersom rökprovet samlar konsolfel per
rutt syntes raden på allihop.

**Åtgärd:** `functions` tillagt i `test:e2e`. Fjorton av fjorton rökprovstester gröna.

**Vad det avslöjade:** med emulatorn igång föll i stället fyra axe-tester, alla på
`/leverantor`. `LeverantorLayout.jsx` renderade sitt laddningsläge och sitt "saknar
behörighet"-läge som `<div class="sida">` utan `<main>` – den globala hoppa-till-innehåll-
länken pekade alltså mot ett `#huvudinnehall` som inte fanns. Samma felklass som punkt 13 i
`granskningar/TILLGANGLIGHETSREDOGORELSE.md`, fast i två TILLSTÅND i stället för på två
sidor. Bristen var verklig också i produktion; den var bara osynlig för axe eftersom
laddningsläget passerade på millisekunder när anslutningen vägrades direkt. Rättad och
införd som punkt 18 i redogörelsen.

**Kvarstående fynd, fört till `OPPNA-PUNKTER.md`:** functions-emulatorn i `firebase-tools` 13
kan inte KÖRA funktionerna – dess runtime anropar `functions.config()`, borttaget i
`firebase-functions` 7. Varje anrop svarar 500. Sviten blir grön (appen fångar felet), men
e2e bevisar inte att någon Cloud Function fungerar. `firebase-tools@15` visar inte felet, men
en bump rör verktyget som gör produktionsdeployerna och kräver ett eget beslut.

---

## Uppföljning 2026-09-06 (webbplatsens bevislucka – skärmbilder, publicerat underlag, räknade tal)

**Utgångspunkt:** en genomgång av `synappsen-web/index.html` mot `produkt/VARUMARKE.md` och
`produkt/GRAFISK-PROFIL.md` pekade ut sidans svagaste punkt som en **bevislucka**: 2 300 ord
och 33 funktionsrubriker, men noll skärmbilder, noll läsbara dokument och en rad i sidfoten om
att underlaget "lämnas på begäran". `VARUMARKE.md` §1 säger att vallgraven ÄR underlaget, och
att skillnaden mot en konkurrent är inbjudan *"här är underlaget, kontrollera själv"* – den
inbjudan skickade sidan aldrig. Ägaren bad om tre åtgärder, plus att löftet om en demomiljö
skulle strykas.

**1. Skärmbilder i stället för attrapper.** Hjältesektionens sökruta var handritad HTML, och
felstavad: markupen `Urin<mark>kad</mark>eter` renderade **"Urinkadeter"**, medan bildtexten
under och attrappens egen `aria-label` stavade "urinkateter" rätt – en klinisk term stavad fel
i det första en vårdanställd läsare ser. Fyra bilder fotograferas nu ur den körande appen med
demodata (`synappsen-web/verktyg/demodata.mjs`, `skarmbilder.spec.mjs`,
`skarmbilder.config.mjs` – egen Playwright-konfiguration, medvetet utanför CI, eftersom
marknadsbilder inte ska kunna göra bygget rött).

**2. Underlaget publicerat.** Ny `underlag.html`, plus tre sidor som **genereras** ur
markdownkällorna av `verktyg/bygg-underlag.mjs`: tillgänglighetsredogörelsen,
underbiträdesförteckningen och IT-faktabladet. Handkopiering hade blivit projektets sjunde
driftfall; nu jämför `webbplats.test.js` den committade sidan med generatorns utdata och failar
vid drift. PUB-avtalsmallen och DPIA-underlaget stannar bakom en förfrågan – se
`BESLUTSLOGG.md`, där gränsen mellan "Extern = ja" och "publikt" också är utskriven.

**3. Räknade tal i stället för adjektiv.** Sidan anger nu 404 behörighetstester, 185
isoleringstester och 9 säkerhetsgenomgångar, räknade ur källan och bundna av fyra nya
assertioner i `dokumentpastaenden.test.js`.

**Fynd som inte gick att åtgärda härifrån:** `/kliniskt-stod` går inte att fotografera, eftersom
`KlinisktStod.jsx:11` säger "triageringsstöd" och `KlinikfragaSok.jsx:92` säger "Beslutsstöd" –
de två ord `webbplats.test.js` förbjuder på sidan. Bristen är känd sedan tidigare
(`PRODUKTDEFINITION` § 9.1/9.3), men konsekvensen är ny och står nu i `OPPNA-PUNKTER.md`:
produktens mest säljbara vy är den enda som inte kan visas. Sidan säger dessutom fortfarande
"vi" där `VARUMARKE.md` §8 kräver "jag" – egen rad i `OPPNA-PUNKTER.md`.

**Kvar innan `noindex` kan tas bort:** bakgrundsstycket (P1) och namn/orgnr på policyn (fråga
#16) som förut – och nu även en genomläsning av de tre publicerade dokumentsidorna, som
exponerar den öppna Brevo-bristen och interna sökvägar. Sex sidor ska avgömmas samtidigt, inte
två.

---
## Uppföljning 2026-09-06 (AI-integrationens risker kartlagda – 8 fynd, ingen kod ändrad än)

Ägaren frågade rakt ut vilka risker som finns i hur AI faktiskt är integrerad i Synappsen –
personuppgifter, hallucination, MDR-gränsen – direkt efter att Vertex AI-migreringen
deployats och verifierats (se sektionen nedan). En läsning av samtliga sex AI-anropsställen
gav åtta namngivna fynd, skrivna ned i `granskningar/AI-INTEGRATIONSRISKER-2026-09-06.md`
tillsammans med en prioritetsordning. **Ingen kod ändrades i den här sessionen** – ägaren bad
uttryckligen om att dokumentera och komma ihåg dem för framtida arbete, ett fynd i taget med
egen testtäckning, inte ett samlat svep.

**Allvarligast (fynd 1):** `tolkaDokument` skickar en uppladdad bild till Vertex AI FÖRE
`innehallerPersonnummer()` körs på resultatet – kontrollen skyddar Firestore mot lagring, inte
själva överföringen till underbiträdet. Bilduppladdningsflödet saknar dessutom helt den
namnvarning som redan finns för formulärtext (`kontrolleraPatientuppgifter` i
`src/utils/piiFilter.js`).

**Övriga fynd, kort:** (2) uppladdade råfoton raderas aldrig, bara vid kontoavetablering –
GDPR-lagringsminimering, med bieffekten att andra än uppladdaren sannolikt inte kan se
originalbilden bakom ett AI-utkast; (3) `klinikfrageloggar`/`klinikfragecache` har ingen
faktisk gallring; (4) klinikstödets sex regler är mätta (`ai-evaluering.yml`, fyra körningar),
men kviss- och stegförslagens liknande regler är det INTE – och en kvissfråga är ett facit
(`rättIndex`), inte en sökträff, så en hallucinerad dos där väger tyngre; (5) artikel
50-märkningen ("AI-tolkat ursprung") finns bara för rutinens ursprung, inte för AI-genererad
kviss/steg; (6) bildtolkningens fritextfält (särskilt `komIhagFlaggor`) tas rakt av utan
efterkontroll, mildrat men inte löst av utkastsgranskningen (löses av fynd 2:s fix); (7) ingen
logg över VILKA anrop som gjorts till Google, vilket `avtal/INCIDENTRESPONSPLAN.md` avsnitt
5.1 förutsätter finns; (8) budgeten återbetalas inte vid ett misslyckat anrop.

**Vad som redan är starkt, för balansens skull:** EU-region verifierad genom faktiska anrop,
ingen fristående API-nyckel, budgettak per organisation och användare, klinikstödets
källbegränsning i två oberoende lager, allt AI-innehåll blir ett utkast som kräver mänskligt
godkännande, promptinjektionens strukturella väg stängd, säkerhetsreglerna mätta i stället för
antagna. Fynden ovan är förfiningar av ett redan relativt försvarat system, inte tecken på att
grunden är svag.

**Spårning:** varje fynd har en egen rad i `OPPNA-PUNKTER.md` under "Tio minuter", i samma
prioritetsordning som dokumentet. Dokument nr 75, registrerat i `DOKUMENTREGISTER.md`.

## Uppföljning 2026-09-06 (Vertex AI deployad – migreringen är i drift)

`deploy.yml` körning #98, `conclusion: success`, knappt sex minuter. Samtliga funktioner
uppdaterade. **Vertex AI-migreringen är därmed i drift** – de sex AI-anropsställena går nu mot
`europe-west1` via tjänstekontots ADC, och `GEMINI_API_KEY` finns varken i koden eller i
deploykedjan. Asset-hashen är oförändrad, vilket är korrekt: releasen rörde bara `functions/`.

**Utvärderingen kördes om direkt efter deployen: `13 OK, 0 FEL, 0 GRANSKA`** – första helt rena
körningen. Fyra körningar totalt, samma slutsats varje gång: säkerhetsreglerna håller.

**Två kundvända dokument rättades i samma veva**, eftersom de blev felaktiga i samma sekund
deployen lyckades: `avtal/IT-FAKTABLAD.md` punkt 7 (sa att AI-tolkningen gick via Googles
publika Gemini-API – det är ett dokument som lämnas till kunders IT-avdelningar i upphandlingar)
och `avtal/UNDERBITRADEN.md`.

**Vad som medvetet INTE bockades av:** utvärderingen anropar modellen förbi `onCall`-lagret, på
en GitHub-runner. Den bevisar kodvägen, inte ett användaranrop genom en **driftsatt** funktion.
Skillnaden är liten men verklig, och genomgående krav 8 säger att ett ✅ aldrig får sättas på
något som inte faktiskt observerats. Kvar som en tvåminuterspunkt i `OPPNA-PUNKTER.md`: gör en
bildimport i appen. Misslyckas den syns det direkt – ingen väg till det gamla API:et finns kvar,
så en funktion felar hellre än faller tillbaka tyst.

**En lärdom om verktygen, inte om koden:** GitHub-API:et serverade cachade svar under hela
deployen och visade `in_progress` i över en timme efter att jobbet i själva verket var klart
20:04. Jag rapporterade det stale läget som pågående. Loggendpointen (404 medan jobbet kör,
innehåll när det är klart) visade sig vara den enda tillförlitliga signalen på att en körning
faktiskt avslutats.

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
