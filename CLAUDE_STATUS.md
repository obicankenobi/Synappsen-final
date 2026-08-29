# Status & överlämning – läs mig först i en ny Claude Code-session

> Kort "var slutade vi och vad gör jag nu"-sammanfattning. Ersätter INTE
> `etapplaner/UTVECKLINGSLOGG.md` (detaljerad teknisk historik) eller planfilerna i
> `etapplaner/` – den pekar vidare dit.
>
> **Historiken ligger i `etapplaner/STATUSARKIV.md`** (117 uppföljningar från 2026-07-28 och
> framåt). Den här filen behåller bara de senaste. Sök i arkivet när du behöver veta *varför*
> något gjordes.

**Senast uppdaterad:** 2026-08-29 · version **5.132.0** i produktion (körning #93, verifierad).
Utgående e-post är stoppat sedan v5.131.0 i väntan på Brevos PUB-avtal. Ingen kod ändrad
2026-08-29 – bara `intern/ETAPPLAN-INTERN-1.md`, som fick ett upplägg för leverantörspanelen.

## Nuläge

| | |
|---|---|
| **Version i produktion** | 5.132.0 (körning #93, verifierad) |
| **Gren** | `claude/compassionate-euler-rho0q5` – men **kontrollera alltid med `git branch --show-current`**, en session kan startas på en egen gren |
| **Senaste kodarbete** | v5.131.0: rättslig spärr som stoppar allt utgående e-post tills Brevos PUB-avtal är tecknat. Dessförinnan v5.130.0 (Etapp 71, Öva-lägets redigerbara frågebank) |
| **Senaste dokumentarbete** | 2026-08-27: `saljmaterial/PITCH.md` uppdaterad till v5.130.0 (Öva-läget, kontoadmin, lösenordsåterställning, startbibliotek i efterhand tillagda) |
| **Aktiv plan** | Ingen. Etapp 69 var den sista. `etapplaner/ETAPPLAN13.md` (Etapp 64) är antagen men juridiskt blockerad – inget steg är byggbart förrän en extern bedömning finns |
| **Nästa steg** | Ägaren har gett tjänstekontot `roles/firebaseauth.admin` (2026-08-29) – **verifiera med "Tvinga utloggning" på ett testkonto innan det räknas som löst**. Därefter: ägarbeslut om Etapp L1 (leverantörspanelen, `intern/ETAPPLAN-INTERN-1.md`) och om `systemkunskap`-paketet (se `OPPNA-PUNKTER.md`) |

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


## Uppföljning 2026-08-29 (upplägg för leverantörspanelen – förslag, inte bygge)

Ingen kod. `intern/ETAPPLAN-INTERN-1.md` (Etapp L1, **fortfarande ej antagen**) fick ett nytt
avsnitt "Panelens upplägg" och en omskriven L1a. Version 0.1 → 0.2.

Den bärande idén: en panel för flera organisationer behöver **två uttalade arbetslägen**, inte
ett. Portföljläge (`/leverantor/*`, sju vyer, aggregerat över alla kunder) och kundläge
(`/leverantor/kund/:orgId/*`, fem flikar, allt låst till en organisation). Dagens vy har bara
portföljformen, och den enda vägen till en enskild kund är att expandera en rad i listan –
vilket slutar fungera någonstans runt tio kunder.

Två saker i upplägget är juridiska snarare än ergonomiska och får inte förhandlas bort i ett
senare bygge:

- **Åtkomsttaket har två nivåer.** Metadata (alltid, via `plattformsadmin/{uid}`) och innehåll
  (endast under ett supportfönster som kunden själv öppnar, Etapp 50b). Block som kräver
  innehållsåtkomst ska synas men stå tomma och märkta med varför – ett block som göms lär inte
  ut var gränsen går.
- **`LeverantorsAtgard` blir en komponent, inte en konvention.** Bekräftelse, obligatorisk
  anledning och revisionsloggning in i kundens hashkedja. En åtgärd som glömmer loggas går inte
  att upptäcka i efterhand, och konventioner har bevisligen misslyckats sex gånger här.

**Tillägg samma dag (v0.3):** ägaren bad om att panelen ska nås med ETT övergripande konto
utan organisationstillhörighet. Nytt delmål L1m, som ska byggas före allt annat eftersom det
flyttar en åtkomstgräns. Lösningen är `organisationId: "_plattform"` – sentinelvärdet finns
redan som pseudo-organisation för revisionsloggning (Etapp 32c) och matchar ingen
organisation, så isoleringen blir en följd av befintliga regler i stället för av ett nytt
undantag. **Det viktigaste premissfyndet:** att bara utelämna `organisationId` gör INTE kontot
organisationslöst – `minOrganisation()` (`firestore.rules:36`) och åtta klientfiler faller
tillbaka på `default`, en organisation med verklig data. Det tomma fältet är alltså det
farligaste alternativet, inte det säkraste. Rollen måste dessutom förbli `superadmin`, annars
slutar `farForsokaLasaPlattformsadmin` (`src/firebase/roles.js:69`) att ens leta efter
panelen.

Ägaren har också gett Cloud Functions-tjänstekontot `roles/firebaseauth.admin` i GCP.
**Ännu inte verifierat** – `tvingaUtloggning` på ett testkonto är det icke-destruktiva testet.
Tills det är gjort står raden kvar i `OPPNA-PUNKTER.md`.

## Uppföljning 2026-08-27 (Etapp 71: redigerbar frågebank för Öva-läget)

Ägaren antog rekommendationen i MDR-bedömningen och lade till ett krav: paketen ska gå att
pausa, och enskilda frågor ska gå att se, redigera, lägga till och ta bort – av kundens
administratör och av leverantören. **Det kravet flyttade lösningen från statisk kod
(alternativ A) till Firestore (alternativ C)**, som tidigare avråtts – men avrådan gällde
innan redigering var ett krav.

**Modellen** (fyra ägarbeslut 2026-08-27, alla enligt rekommendation): överlagring framför
kopia-per-kund, superadmin + VÖL som behörighetsnivå, eget kundpaket för fristående frågor,
och paus på både kund- och leverantörsnivå.

| Del | Var |
|---|---|
| Leverantörens frågor | `kvissfragor/{id}` (global) |
| Kundens avvikelse | `organisationer/{orgId}/kvissoverlagring/{fragaId}` |
| Kundens egna frågor | `organisationer/{orgId}/kvissegna/{id}` |
| Kundens paketval | `organisationer/{orgId}.kvisspaket` |
| Globalt nödstopp | `kvisspaket/{paketId}` |

**Ingen collection är skrivbar av någon klient** – all redigering går via
`functions/kvissbank.js`, som rolltestar, PII-kontrollerar och revisionsloggar. 19 nya
regeltester bevisar både det och organisationsisoleringen.

**Innehåll:** 12 nya yrkeskunskapsfrågor (spår 1), var och en kontrollerad mot faktisk
lagtext. De 19 gamla systemfrågorna migrerade till ett eget, avstängbart paket. Paketet
`kliniskt` (spår 2) är byggt men TOMT – innehållet väntar på den externa juridiska
bedömningen.

**Ett fynd värt att minnas:** `SOSFS 1997:14` om delegering upphävdes 2026-01-01 (HSLF-FS
2025:5). En delegeringsfråga skriven ur minnet hade varit fel från dag ett – precis den
färskhetsrisk bedömningens §5.1 pekar ut, demonstrerad på första innehållsomgången. Därav
`kalla` + `kallaDatum` per fråga, och en assertion som failar om någon skriver tillbaka den
upphävda referensen.

**Rättat:** MDR-motiveringen i `src/data/kvissbank.js` (rad 9–22) var felaktig och är omskriven.

Lint, build, vitest, regeltester (19 nya) och functions-tester gröna. **Ej deployat.**

## Uppföljning 2026-08-27 (v5.129.0 deployad, Öva-läget, MDR-bedömning)

**Deploy.** v5.129.0 ligger i produktion (körning #89). Två hemligheter stoppade vägen dit:
`BREVO_API_KEY` saknades (ägaren satte den, och verifierade `synappsen.se` hos Brevo via
DNS-poster hos Loopia), och `SOKMOTOR_API_KEY` visade sig **aldrig ha varit satt** – felet
syntes först nu eftersom v5.129.0 bytte `echo` mot `printf '%s'` i `deploy.yml`. Tidigare blev
en saknad hemlighet strängen `"\n"` i Secret Manager, som Secret Manager accepterade;
`printf` skickar en tom sträng, som avvisas med "Secret Payload cannot be empty". **Slutsats
värd att minnas: klinikstödets sökmotor har sannolikt kört mot en trasig nyckel i produktion
under lång tid utan att något larmade.** Ägaren hittade rätt nyckel i GCP ("API key filter",
restriktion Custom Search API) och satte den.

**Öva-läget var tomt.** Orsak: `byggFragepool()` läser bara `rutin.kviss`, och organisationen
har inga rutiner. `KVISSBANK` nåddes bara via en redaktör som manuellt fäst en fråga på en
rutin – bankens egen motivering ("så att en ny organisation inte står tom dag ett") stämde
alltså inte i praktiken. Byggt: `byggBankFragepool()` + ett Systemkunskap-spår i `OvaLage.jsx`
som läser banken direkt, oberoende av Firestore (commit `d8b9106`, ej deployad).

**Åtta nya bankfrågor skrevs och reverterades** (`4754942` → `4815c68`). Ägaren avvisade dem
med rätt argument: tekniska frågor om hur Synappsen fungerar är ointressanta för vårdpersonal,
som behöver öva på sitt yrke.

**MDR-bedömning gjord** (`granskningar/MDR-BEDOMNING-OVNINGSFRAGOR-2026-08.md`, ny fil).
Ägaren ifrågasatte om kliniska frågor verkligen passerar MDR-gränsen. Genomgång mot MDR
art. 2(1), skäl 19, art. 2(12) och MDCG 2019-11 ger: **nej, de gör inte det.** Beslutssteg 4
i MDCG 2019-11 ("är åtgärden till nytta för enskilda patienter?") besvaras nekande eftersom
ingen patientdata finns i flödet. **Kommentaren i `src/data/kvissbank.js` rad 9–22 är alltså
för hårt dragen och bör rättas** – men rättelsen väntar på ägarbeslut, eftersom regeln råkar
skydda mot fyra risker som är verkliga (färskhet, lokal variation, upphovsrätt,
AI-förordningens bilaga III). Fyra beslut ligger i `OPPNA-PUNKTER.md`.

## Uppföljning 2026-08-23 (rättad: "Uppdatera"-knappen gjorde ingenting, v5.128.0)

Ägaren rapporterade att banderollen "En ny version av Synappsen finns tillgänglig" och dess
"Uppdatera"-knapp (`AppUppdateringBanner.jsx`) inte fungerade.

**Rotorsak:** `vite.config.js` kör vite-plugin-pwa i `injectManifest`-läge (Etapp 24a, för att
Firebase-konfigurationen ska processas av Vite) med `src/sw.js` som EGEN, handskriven service
worker-källa. `useAppUppdatering.js`s `uppdatera()` anropar `updateSW(true)`, som (via
`workbox-window`) postar `{type: "SKIP_WAITING"}` till den väntande workern och sedan väntar
på ett `"controlling"`-event för att ladda om sidan. **`src/sw.js` saknade helt en lyssnare
för det meddelandet**, och saknade `clientsClaim()`. `generateSW`-läget (Workbox
standardbygge) lägger till båda automatiskt – ett handskrivet `injectManifest`-`sw.js` gör
det inte. Knappen postade alltså ett meddelande ingen lyssnade på, och även om den hade
lyssnat hade den nya workern bara tagit kontroll över FRAMTIDA sidladdningar utan
`clientsClaim()`, aldrig den redan öppna fliken. Resultat: att klicka "Uppdatera" gjorde
bokstavligen ingenting.

**Varför inget test fångade det:** `test:e2e` kör Playwright mot Vites DEV-server (`npm run
dev`), som aldrig registrerar en riktig service worker. Ingen befintlig testsvit i projektet
körde `sw.js`s faktiska kod.

**Fixat:** en `message`-lyssnare som anropar `self.skipWaiting()` vid `SKIP_WAITING`, plus
`clientsClaim()` vid uppstart. Nytt `src/sw.test.js` (3 test) kör sw.js:s riktiga kod i en
mockad `self`/workbox/firebase-miljö – bevisat att det fångar exakt den här buggen genom att
tillfälligt ta bort fixen och se testet faila (alla tre), sedan återställa.

Fullt svep grönt: lint, build (bekräftat i minifierad `dist/sw.js` att både lyssnaren och
`clientsClaim()` faktiskt kompilerades in), vitest 410/410 (37 filer), `test:rules`,
`test:functions`, `test:storage`, e2e 41/41 (två `ERR_CONNECTION_REFUSED`-flakes vid full
parallell körning, bekräftat ORELATERADE genom att köra om dem isolerat – passerade båda).

## Uppföljning 2026-08-26 (v5.129.0: fem fel från första riktiga användningen)

Ägaren bjöd in två kollegor och rapporterade fem problem. Sentry-notiser bifogades och
avslöjade **ett sjätte, allvarligare** som ingen sett: tvingad utloggning kraschade i
produktion.

**Rotorsaker, samtliga verifierade mot kod och Sentry:**

| Symptom | Rotorsak |
|---|---|
| Tvinga utloggning "fungerade" men gjorde inget | Tjänstekontot saknar `roles/firebaseauth.admin`. `revokeRefreshTokens` kastar "Credential implementation … insufficient permission" (`organisationsadmin.js:49`). **Samma fel drabbar `deleteUser` i organisationsraderingen, där det är tyst nedsvalt** – Auth-konton blev kvar. **Kräver ägaråtgärd i GCP-konsolen, ingen kod hjälper.** |
| E-postinbjudan kom aldrig fram | `deploy.yml` satte hemligheten med `echo`, som lägger till radbrytning. En saknad GitHub-hemlighet blev `"\n"` i Secret Manager – **truthy** – så `skickaEpost`s "inte konfigurerad"-guard slog aldrig till. Brevo svarade 401 "authentication not found in headers" |
| Tom organisation | `verksamhetstyp` har default `""` i UI:t, hela seedningen är villkorad på den, och fältet **sparades aldrig** på organisationen. Ingen väg tillbaka fanns |
| Ingen lösenordsåterställning | Aldrig byggd |
| Kan inte radera/stänga av konto | Funktionerna fanns inte |
| CSP-larm i Sentry | `connect-src` tillät `ingest.de.sentry.io` men adressen är en **subdomän** → Sentrys egen SDK blockerades. `frame-src` saknade `firebaseapp.com`, vilket hade brutit lösenordsåterställningen. (`connect.facebook.net` var inte vår kod – injicerat av besökarens webbläsare) |
| `FirebaseError: Missing or insufficient permissions` | Push-token skrevs innan `losInInbjudan` hunnit skapa `users/{uid}` |

**Byggt (v5.129.0):** `satAnvandareAvstangd` (reversibel spärr, Auth `disabled`) och
`raderaAnvandare` (Auth + `users/{uid}`, GDPR art. 17 på individnivå) med UI, `avstangd`
gjort immutabelt från klienten i `firestore.rules`, lösenordsåterställning, ärligt
inbjudnings-UI (`skapaInbjudan` returnerar `epostSkickat`), `seedaStartbibliotek` (idempotent,
körbar i efterhand) + `verksamhetstyp` sparas nu, `printf '%s'` i deploy.yml + `.trim()`,
CSP-rättelser, push-race. 10 nya functions-tester
(`tests/functions/anvandarhantering.test.cjs`).

**Medvetet INTE byggt: byta organisation på en användare.** Kvitteringar,
introduktionssigneringar och revisionsloggposter hör till den gamla organisationen, och
revisionsloggen är en hashkedja som inte får skrivas om. Rätt väg är radera + bjud in på
nytt, vilket nu finns och är spårbart.

**Dokument rättade i samma commit:** `drift/INCIDENT-CHECKLISTA.md` (tvingad utloggning
stänger inte ute någon som kan lösenordet – raden pekar nu på avstängning) och
`saljmaterial/kallfiler/Synappsen-teknisk-beskrivning.html` (superadmins förmågor).

> **KVARSTÅR OCH BLOCKERAR:** utan IAM-rollen fungerar varken avstängning, radering eller
> tvingad utloggning i produktion – koden är rätt, behörigheten saknas. Se `OPPNA-PUNKTER.md`.

## Uppföljning 2026-08-27 (v5.130.0 – release + deploy av Etapp 71)

Versionsbump och release för Etapp 71 (se uppföljningen ovan för det tekniska innehållet).
Ändringslogg tillagd (`src/data/andringslogg.js`). `saljmaterial/PITCH.md` hade glidit till 16
minorversioner efter koden (testets gräns är 15) – innehållet skrevs om, inte bara
versionsraden: Öva-läget (som tidigare INTE nämndes i pitchen alls, trots att det funnits
sedan v5.102.0), kontoadmin (avstängning/radering), lösenordsåterställning, och startbibliotek
i efterhand.

Lint, build och hela vitest-sviten (502/502, dokumenttesterna inkluderade) gröna.
`test:rules`/`test:functions` inte omkörda i det här steget – inga ändringar i
`firestore.rules`/`functions/` sedan de kördes gröna i förra commiten.

## Uppföljning 2026-08-27 (v5.131.0 – rättslig spärr på utgående e-post)

Brevo togs i drift tidigare samma dag utan att PUB-avtal fanns. Ägaren beslutade att pausa
allt utgående e-post tills avtalet är tecknat, men hittade inte det globala nödstoppet i
leverantörsvyn – och en kodsession kan inte trycka på det (ingen firebase/gcloud CLI, inga
servicekontonycklar, och `systemstatus/epost` är `allow write: if false`).

**Byggt i stället:** en konstant `PUB_AVTAL_BREVO_TECKNAT = false` i `functions/gemensamt.js`.
`skickaEpost()` returnerar `{skickat: false, anledning: "pub_avtal_saknas"}` utan att kontakta
Brevo, oavsett driftflaggans läge.

**Varför en kodkonstant framför driftflaggan:** flaggan bär ingen motivering. Den som ser den
påslagen om tre månader vet inte varför, och risken att den slås av av misstag är exakt det
mönster projektet dokumenterat sex gånger. En kodändring kräver granskning och driftsättning –
proportionerligt mot att teckna ett avtal.

**Strukturellt:** utskicket bröts ut till `utforUtskick()`, exporterad som `_utforUtskick`
enbart för test. Utan det hade fyra testfall (nödstopp, saknad nyckel, faktiskt utskick,
revisionslogg) tystnat helt medan spärren är på. Valideringen (ogiltig adress, personnummer)
ligger kvar FÖRE spärren, så ett anroparfel syns även när kanalen är pausad.

`epostSkickat` blir korrekt `false`, och UI:t (rättat i v5.129.0) säger då sanningen om att
inbjudningslänken måste delas manuellt. Ingen UI-ändring behövdes.

**Att häva:** sätt konstanten till `true`, fyll i datum i `avtal/UNDERBITRADEN.md`, ta bort
raden ur `OPPNA-PUNKTER.md`. `tests/functions/epost.test.cjs` failar om konstanten ändras.

## Uppföljning 2026-08-28 (v5.131.0 deployad – e-postspärren verifierad i produktion)

Deploykörning #92 lyckades och är verifierad mot **faktiskt utfall**, inte mot jobbstatusen.
Skälet: körning #90 dagen innan rapporterade `success` men saknade
`hosting: finalizing version / release complete / Deploy complete!` i loggen, och produktionen
fortsatte servera föregående version. Att lita på `conclusion: success` räcker alltså inte.

**Verifierat för #92:** alla fyra hosting-releaseraderna finns i loggen, `last-modified` på
produktionens `index.html` matchar deployens sluttid (12:31:29 UTC), `version-*.js` innehåller
`5.131.0`, och de tre funktioner som kan skicka e-post – `skapaInbjudan`,
`skickaEpostPaminnelserSchemalagt`, `skickaManadssammanfattningarSchemalagt` – rapporterade
alla "Successful update operation".

**Utgående e-post är därmed faktiskt stoppat**, inte bara beslutat.

**Testerna som spärren avslöjade:** tre filer antog att e-post faktiskt skickas. Två löstes
genom att bryta ut mejlkompositionen till rena funktioner (`byggInbjudningsmejl`,
`byggPaminnelseDigest`) – bättre design oavsett spärren. Den tredje
(`manadssammanfattning.test.cjs`) testar mottagarurval och opt-out, vilket kräver att utskicket
faktiskt sker; där används `_sattPubAvtalOverridForTest`, med en assertion i `epost.test.cjs`
som failar om någon produktionsfil under `functions/` någonsin refererar till överridet.

**Kvar att göra för ägaren:** teckna Brevos DPA, sätt sedan `PUB_AVTAL_BREVO_TECKNAT = true`,
fyll i datum i `avtal/UNDERBITRADEN.md` och ta bort raden ur `OPPNA-PUNKTER.md`.

## Uppföljning 2026-08-28 (v5.132.0 – rätt orsak när ett mejl uteblir)

Ägaren testade att bjuda in någon för att bekräfta att spärren biter. Den gjorde det – men
texten sa **"e-post är inte konfigurerat för den här installationen"**, vilket är osant:
nyckeln är satt och domänen verifierad, utskicket är pausat av rättsliga skäl.

Orsak: `skapaInbjudan` returnerade bara `epostSkickat: true/false`, så gränssnittet hade EN
hårdkodad förklaring för alla utfall. Den råkade stämma medan nyckeln saknades och blev osann
i samma stund som spärren infördes. Samma klass av fel som Etapp 70c rättade – det borde ha
setts när spärren byggdes, inte efter att ägaren stötte på det.

**Två fel i själva rättelsen, båda fångade av tester:**
1. Anledningen skickades inte med alls från servern.
2. `onCall`-wrappern destrukturerade fortfarande `{ token, epostSkickat }` och tappade
   `epostAnledning` på sista raden ut. Utan testet hade en "rättelse" deployats som inte
   ändrade någonting i gränssnittet.

`EPOST_ANLEDNING_TEXT` i `InbjudanFormular.jsx` mappar nu orsak → text. Formuleringen mot kund
är neutral ("utgående e-post är tillfälligt pausat") – sann utan att lufta att det handlar om
ett osignerat biträdesavtal.
