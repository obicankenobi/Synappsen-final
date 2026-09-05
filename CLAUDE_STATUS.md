# Status & överlämning – läs mig först i en ny Claude Code-session

> Kort "var slutade vi och vad gör jag nu"-sammanfattning. Ersätter INTE
> `etapplaner/UTVECKLINGSLOGG.md` (detaljerad teknisk historik) eller planfilerna i
> `etapplaner/` – den pekar vidare dit.
>
> **Historiken ligger i `etapplaner/STATUSARKIV.md`** (124 uppföljningar från 2026-07-28 och
> framåt). Den här filen behåller bara de senaste. Sök i arkivet när du behöver veta *varför*
> något gjordes.

**Senast uppdaterad:** 2026-09-05 · **v5.139.0 i produktion.** Utgående e-post är stoppat
sedan v5.131.0 i väntan på Brevos PUB-avtal. **Etapp L1 (leverantörspanelen) är SLUTFÖRD.**
**Etapp 72 (`etapplaner/ETAPPLAN19.md`):** riktningen är antagen, beslutspunkt 5
(efterfrågegrinden) gäller fortfarande som huvudregel för alla ÖVRIGA delmål. 72f, 72d och
72h byggda och deployade som ett uttryckligt, engångsbeslutat undantag från grinden (se
`BESLUTSLOGG.md` 2026-09-02) – ägaren instruerade direkt, ingen namngiven kund låg bakom.

## Nuläge

| | |
|---|---|
| **Version i produktion** | **5.139.0** (körning #97, verifierad 2026-09-02: asset-hash `index-D_9UU18e.js` live) |
| **Gren** | `claude/compassionate-euler-rho0q5` – men **kontrollera alltid med `git branch --show-current`**, en session kan startas på en egen gren |
| **Senaste kodarbete** | v5.138.0: Etapp 72 beslutspunkt 5 undantag 1. Artikel 50-märkning byggd (`src/components/RutinKort.jsx`, en AI-tolkad rutins ursprung visas i läsvyn – bekräftad brist sedan `granskningar/JURIDISK-GRANSKNING.md` §7.4). Rättade en självmotsägelse i `functions/klinikstod.js`s Gemini-prompt ("Detta är beslutsstöd" stod rakt emot MDR-avgränsningen). **Detta är kundvänt** – första sådana ändringen sedan Etapp 69 |
| **Publik webbplats** | `synappsen-web/` (ny 2026-09-05). Statisk, två sidor (startsida + integritetspolicy), egen hosting-target `web`, egen `deploy-web.yml`. Priser publicerade och bundna till prislistan. **Inte publicerad än** – hosting-siten måste skapas en gång, och kontaktuppgifter/bakgrundsstycke väntar på ägaren, se `OPPNA-PUNKTER.md`. Bevakad av `tests/docs/webbplats.test.js` |
| **Senaste dokumentarbete** | 2026-09-03: `granskningar/PRODUKTDEFINITION-REGULATORISKT-UNDERLAG.md` (nytt, dokument nr 72) – kodverifierad produktdefinition som faktabas för den externa juridiska granskningen. Två kvarstående kod/dokument-diskrepanser dokumenterade (§ 9.1 "Beslutsstöd" i gränssnittet, § 9.2 checklistsegets nyckelspärr), varav den första förd till `OPPNA-PUNKTER.md`. Två villkorade assertioner i `tests/docs/dokumentpastaenden.test.js` |
| **Aktiv plan** | `etapplaner/ETAPPLAN19.md` (Etapp 72) – **antagen**, tretton delmål, samtliga sju beslutspunkter avgjorda. Nästa delmål byggs först när en namngiven kund bett om det skriftligt (beslutspunkt 5), eller om det faller under ett av de tre undantagen (nr 1 nu genomfört). `etapplaner/ETAPPLAN13.md` (Etapp 64) juridiskt blockerad |
| **Nästa steg** | **Beställ den externa juridiska granskningen** – underlaget är nu komplett (`granskningar/PRODUKTDEFINITION-REGULATORISKT-UNDERLAG.md` § 11–12), och samma uppdrag täcker Etapp 64, klinikstödets avgränsning och kvissbankens spår 2. Ta samtidigt ägarbeslutet om "Beslutsstöd"-raden i `OPPNA-PUNKTER.md`. Övriga 72-delmål: vänta på en namngiven kund. Fråga de tre mottagarna i det pågående utskicket vad de vill ha härnäst (billigast av allt, se planens beslutspunkt 5). Separat: flytta ägarens eget konto med `flyttaTillPlattformskonto()`, och verifiera `roles/firebaseauth.admin` med "Tvinga utloggning" |

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
