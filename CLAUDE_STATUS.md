# Status & överlämning – läs mig först i en ny Claude Code-session

> Kort "var slutade vi och vad gör jag nu"-sammanfattning. Ersätter INTE
> `etapplaner/UTVECKLINGSLOGG.md` (detaljerad teknisk historik) eller planfilerna i
> `etapplaner/` – den pekar vidare dit.
>
> **Historiken ligger i `etapplaner/STATUSARKIV.md`** (124 uppföljningar från 2026-07-28 och
> framåt). Den här filen behåller bara de senaste. Sök i arkivet när du behöver veta *varför*
> något gjordes.

**Senast uppdaterad:** 2026-09-06 · **v5.139.0 i produktion** (kod för Vertex AI-migreringen
väntar på deploy, se raden nedan – ⚠️ tre GCP-steg måste göras FÖRST). Utgående e-post är stoppat
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
| **Senaste kodarbete** | 2026-09-06: Vertex AI-migrering av samtliga sex Gemini-anropsställen (`functions/ai-import.js`, `functions/klinikstod.js`), `@google/genai` i stället för det deprecerade `@google-cloud/vertexai` planen ursprungligen föreslog. **⚠️ Kodad men INTE aktiv** – tre GCP-konsolsteg krävs innan nästa deploy, se överst i `OPPNA-PUNKTER.md`. Internt/infrastruktur, inget för `andringslogg.js` |
| **Publik webbplats** | `synappsen-web/` (ny 2026-09-05). Statisk, två sidor, egen hosting-target `web`, härdad med HSTS/COOP. **Live på `https://synappsen-web.web.app`, men medvetet `noindex, nofollow`** (båda sidorna + `robots.txt` `Disallow: /`) – bakgrundsstycket och namn/orgnr på policyn saknas fortfarande. `kontakt@synappsen.se` bekräftat mottagande 2026-09-05. Egen domän `synappsen.se` pågår hos ägaren (Loopia) – DNS-posterna för apex är korrekt satta, men "Lägg till anpassad domän" måste startas om från rätt hosting-site (`synappsen-web`, inte `synappsen-final-build`). `deploy-web.yml` skapar hosting-siten idempotent. Ta bort `noindex` när de två kvarvarande punkterna är klara, se `OPPNA-PUNKTER.md`. Bevakad av `tests/docs/webbplats.test.js` |
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
