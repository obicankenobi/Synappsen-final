# Status & överlämning – läs mig först i en ny Claude Code-session

> Kort "var slutade vi och vad gör jag nu"-sammanfattning. Ersätter INTE
> `etapplaner/UTVECKLINGSLOGG.md` (detaljerad teknisk historik) eller planfilerna i
> `etapplaner/` – den pekar vidare dit.
>
> **Historiken ligger i `etapplaner/STATUSARKIV.md`** (128 uppföljningar från 2026-07-28 och
> framåt). Den här filen behåller bara de senaste. Sök i arkivet när du behöver veta *varför*
> något gjordes.

**Senast uppdaterad:** 2026-09-06 · **v5.139.0 i produktion**. Vertex AI-migreringen är
**verifierad mot skarp Vertex AI och deployen är AVBLOCKERAD** (de tre GCP-stegen är gjorda) –
koden väntar bara på en `deploy.yml`-körning. Utgående e-post är stoppat
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
| **AI-kvalitetsmätning** | **Ny 2026-09-06.** Klinikstödets säkerhetsregler (regel 4 = MDR-avgränsningen) mäts nu i tre lager: `tests/functions/klinikstodprompt.test.cjs` (gratis, i varje svep, bevisar att reglerna STÅR kvar), `verifieraKlinikstod` (bara sökmotorn), och `.github/workflows/ai-evaluering.yml` (sju fall mot skarp Vertex AI, manuell dispatch, bevisar vad modellen SVARAR). **Körd skarpt tre gånger 2026-09-06: reglerna höll i samtliga fall** (körning #3 grön: 12 OK, 0 FEL, 1 GRANSKA). Det största fyndet var att mätverktygets egna heuristiker fällde korrekta svar – en korrekt vägran måste innehålla de förbjudna orden. Rättat och verifierat. Modellvalet omprövat och bekräftat: stanna på Gemini. Se `granskningar/SAKERHETSRAPPORT.md` tillägg 2026-09-06 |
| **Senaste kodarbete** | 2026-09-06: Vertex AI-migrering av samtliga sex Gemini-anropsställen (`functions/ai-import.js`, `functions/klinikstod.js`), `@google/genai` i stället för det deprecerade `@google-cloud/vertexai` planen ursprungligen föreslog. **Verifierad mot skarp Vertex AI 2026-09-06** – GCP-stegen är gjorda, `gemini-2.5-flash` bevisad i `europe-west1`. Återstår: en `deploy.yml`-körning, tills dess kör produktionen fortfarande mot det publika Gemini API:et. Internt/infrastruktur, inget för `andringslogg.js` |
| **Publik webbplats** | `synappsen-web/` (ny 2026-09-05). Statisk, två sidor, egen hosting-target `web`, härdad med HSTS/COOP. **Live på både `https://synappsen-web.web.app` och egna domänen `https://synappsen.se` (Loopia, kopplad och verifierad 2026-09-06)** – men medvetet fortsatt `noindex, nofollow` (båda sidorna + `robots.txt` `Disallow: /`) – bakgrundsstycket och namn/orgnr på policyn saknas fortfarande. `kontakt@synappsen.se` bekräftat mottagande 2026-09-05. `deploy-web.yml` skapar hosting-siten idempotent. Ta bort `noindex` när de två kvarvarande punkterna är klara, se `OPPNA-PUNKTER.md`. Domänsäkring (registrar lock/DNSSEC/2FA hos Loopia) fortfarande öppen, se `OPPNA-PUNKTER.md`. Bevakad av `tests/docs/webbplats.test.js` |
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

## Uppföljning 2026-09-06 (promptinjektionen täppt – strukturellt, inte språkligt)

Ägaren instruerade att åtgärda promptinjektionen direkt i stället för att vänta på att
utvärderingen ska kunna köras. Rimligt: fyndet var känt, åtgärden liten, och att låta en känd
lucka mot MDR-avgränsningen stå öppen i väntan på ett mätvärde är fel ordning.

**Två skydd, olika för att de två inbäddningsställena har olika förutsättningar** (båda i
`functions/gemensamt.js`, bredvid `innehallerPersonnummer`):

- `harPromptbrytandeTecken()` – klinikstödets fråga bäddas in som `Fråga: "${fraga}"`. Ett
  citattecken avslutar den kontexten, en radbrytning gör det möjligt att skriva ett eget
  regelblock under. Inget av tecknen har ett legitimt syfte i en klinisk söksträng, så frågan
  **avvisas** i stället för att saneras tyst – en tyst ändrad fråga i ett kliniskt verktyg är
  värre än ett fel. Två lager: `fragaKlinisktStod` avvisar med ett begripligt `HttpsError` till
  användaren, och `byggKlinikstodPrompt` **kastar**, så det är strukturellt omöjligt att bygga
  en prompt av en sådan fråga oavsett anropare. Kontrollen ligger FÖRE hastighetsspärren, så en
  avvisad fråga äter ingen kvot.
- `saneraPromptblock()` – rutintexterna i `ai-import.js` (checklistesteg- och kvissförslagen)
  bäddas in i ett `"""`-block. Där går det inte att avvisa radbrytningar och citattecken;
  texten är flerradig till sin natur. I stället neutraliseras avgränsaren (`"""` → `'''`).
  Lägre risk – texten är redan människogodkänd inom organisationen och förslagen granskas innan
  de sparas – men samma klass av brist och samma enradsåtgärd, så den togs samtidigt.

**Medvetet INTE gjort:** ingen blocklista på instruktionsliknande fraser ("ignorera tidigare
regler" o.s.v.). Sådana läcker notoriskt och ger falsk trygghet. Skyddet är strukturellt – att
texten inte kan bryta sig ur sin kontext. **Ingen klientkopia av regeln heller:** servern är
auktoritativ och felmeddelandet visas redan i `KlinikfragaSok.jsx`s felruta; en regex till i
`src/` hade bara varit en andra plats att glida ifrån.

**Vad som återstår, ärligt:** den SPRÅKLIGA vägen. En påstridig fråga som bara använder
tillåtna tecken når fortfarande modellen, och där finns ingen strukturell spärr – bara
modellens vilja att lyda reglerna. Det är precis vad som inte går att veta utan att mäta, så
fall 6 i utvärderingen är omskrivet i två delar: **6a** (offline, gratis) bevisar att den
strukturella vägen är stängd, **6b** skickar en språklig injektion som når modellen. Visar 6b
att den slår igenom är nästa steg att lyfta reglerna till en `systemInstruction` i stället för
att ha dem i samma textblock som frågan.

Sex nya assertioner i `tests/functions/klinikstodprompt.test.cjs` (18 totalt), inklusive ett
test som bevisar att skyddet **inte** avvisar legitima kliniska frågor med apostrof,
bindestreck, parentes, procent eller decimaltal. Testsvep grönt: lint, build, 592 vitest,
`test:functions`, `test:rules`, `test:storage`.

## Uppföljning 2026-09-06 (AI-utvärdering byggd – klinikstödets säkerhetsregler mäts nu)

Ägaren frågade om Gemini är rätt modellval eller om andra LLM:er borde övervägas. **Svaret blev
"stanna" – men frågan blottade något viktigare.** Vid nuvarande volym (284 funktionsanrop
totalt, noll kunder) är skillnaden mellan billigaste och dyraste rimliga modell några kronor i
månaden, medan ett leverantörsbyte river upp EU-databehandlingsgarantin som Vertex AI-
migreringen precis köpte, lägger till ett underbiträde och kräver nytt PUB-avtal och uppdaterad
DPIA. Priset är alltså fel variabel att optimera på – **kvaliteten är rätt variabel, och den
gick inte att mäta.**

**Den verkliga bristen:** klinikstöd-promptens regel 4 ("aldrig ett beslutsstöd … Ge aldrig ett
prioriterat eller rangordnat svar") är den avgränsning som håller funktionen utanför MDR. Den
upprätthölls av att modellen *väljer* att lyda prompten, och ingenting mätte om den gör det.
En redigering som strök regeln hade inte fått ett enda test att faila. `verifieraKlinikstod`
testar uttryckligen **bara** sökmotorsteget, inte Gemini-svaret.

**Byggt, i tre lager med medvetet olika räckvidd:**

1. **`tests/functions/klinikstodprompt.test.cjs`** – 11 assertioner, gratis, offline, tillagd i
   `test:functions`-svepet. Bevisar att reglerna står kvar ord för ord, att ordet "beslutsstöd"
   aldrig återkommer som en självbeskrivning (regressionen från Etapp 72), och att reglerna
   ligger EFTER den användarstyrda frågan i prompten. **Mutationstestad:** stryks förbudet mot
   rangordning failar den med ett felmeddelande som pekar på MDR-konsekvensen.
2. **`functions/scripts/ai-evaluering.cjs` + `.github/workflows/ai-evaluering.yml`** – sju fall
   mot skarp Vertex AI, manuell dispatch. Rangordningsbete, rekommendationsbete, namngiven
   patient (medvetet UTAN personnummer – `innehallerPersonnummer` stoppar redan de fallen, så
   regel 6 är det enda skyddet just där), fråga som källorna inte täcker, promptinjektion, samt
   bildtolkningens schemakontrakt. **Anropar aldrig den riktiga sökmotorn** – den delade kvoten
   är 100/dygn för hela installationen, och en utvärdering som åt av den kunde släckt
   klinikstödet för riktiga kunder. Rör ingen Firestore-data, ingen budget.
3. **Tre utfall, inte två:** `OK`, `FEL` och `GRANSKA`. Det sista för frågor som inte går att
   avgöra maskinellt, där svaret skrivs ut i sin helhet för mänsklig läsning och slutkoden inte
   påverkas. Avsiktligt: en heuristik som låtsas kunna fälla ett regulatoriskt omdöme vore
   sämre än en som säger att den inte kan det. `GRANSKA`-raderna ÄR den manuella verifiering
   som kostnadsuppskattningen krävde – strukturerad, inte bortautomatiserad.

**Refaktorering som möjliggjorde det:** prompten byggdes tidigare inline i anropshanteraren och
gick inte att nå utifrån. Utbruten till `byggKlinikstodPrompt()`, exporterad, så utvärderingen
mäter EXAKT samma prompt som produktionen kör – inte en kopia som kan glida isär. Verifierat
byte-identisk. Samma skäl bakom att `tolkaBildMedGemini`/`extraktionsSchema` nu exporteras.

**Ett verkligt fynd på köpet:** frågan interpoleras osanerad in i prompten
(`Fråga: "${fraga}"`), vilket är en möjlig promptinjektion mot just de regler som bär
MDR-avgränsningen. Om den går igenom är okänt – fall 6 testar det, men kan inte köras än. Fört
till `OPPNA-PUNKTER.md` med föreslagen åtgärd (avvisa `"` och radbrytningar i söksträngen)
och med de förmildrande omständigheterna ärligt noterade.
**→ Åtgärdad samma dag, se sektionen ovan** – ägaren instruerade att inte vänta på
utvärderingen.

**Provbilden genereras i kod** (`functions/scripts/provbild.cjs`, egen PNG-enkodare utan
beroenden) i stället för att checkas in som binärfil – en bild i repot går inte att granska i
en diff. Renderad och okulärbesiktigad: texten är läsbar och datumet `2027-01-15`, som
utvärderingen jämför exakt mot, står i klartext.

**Ännu inte kört mot skarp Vertex AI** – kräver samma tre GCP-steg som allt annat. Skriptet
översätter de vanligaste felen till vilket steg som saknas. Testsvep grönt: lint, `npm run
build`, 592 vitest-tester, hela `test:functions`-svepet.

## Uppföljning 2026-09-06 (egen domän `synappsen.se` kopplad och verifierad)

Ägarens domänkoppling från föregående uppföljning (2026-09-05) är klar. Ett verkligt fel
hanns fångas och rättas under tiden: "Lägg till anpassad domän" hade av misstag startats
från fel hosting-site (`synappsen-final-build`, appens site, inte `synappsen-web`,
marknadssidan) – synligt i verifierings-TXT-postens värde `hosting-site=synappsen-final-build`.
Hade det slutförts hade `synappsen.se` visat kundappens inloggningssida i stället för
marknadssidan. Ägaren startade om flödet från rätt site; Firebase Console visade därefter
"Verified" → "Minting certificate" → **"Connected"**.

**Verifierat direkt mot `https://synappsen.se`:** HTTP 200, riktig Firebase/Fastly-CDN-trafik
(inte en proxiartefakt – `x-served-by`/`x-cache`-headrarna bekräftar det), samtliga
säkerhetsheaders från `hosting:web`-konfigurationen närvarande (CSP, HSTS, COOP,
X-Frame-Options, X-Content-Type-Options, Permissions-Policy, Referrer-Policy), rätt
sidtitel (marknadssidan, inte appen), `noindex, nofollow` och `robots.txt`s `Disallow: /`
fortfarande aktiva som avsett. **En känd begränsning:** det faktiska TLS-certifikatet kunde
inte oberoende verifieras från den här sandboxade sessionen – utgående HTTPS fångas upp av
sandboxens egen utgångsproxy (`openssl s_client` visar dess MITM-certifikat, inte Firebases/
Let's Encrypts). Inte ett tecken på ett verkligt problem – Firebase Consoles "Connected"-status
är själva beviset på att certifikatet utfärdats och bundits korrekt.

`synappsen.se` fungerar alltså som avsett. Domänsäkring (registrar lock, DNSSEC, 2FA hos
Loopia) är fortfarande en öppen punkt, se `OPPNA-PUNKTER.md`.

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

