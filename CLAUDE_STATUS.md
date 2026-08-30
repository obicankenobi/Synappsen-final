# Status & överlämning – läs mig först i en ny Claude Code-session

> Kort "var slutade vi och vad gör jag nu"-sammanfattning. Ersätter INTE
> `etapplaner/UTVECKLINGSLOGG.md` (detaljerad teknisk historik) eller planfilerna i
> `etapplaner/` – den pekar vidare dit.
>
> **Historiken ligger i `etapplaner/STATUSARKIV.md`** (122 uppföljningar från 2026-07-28 och
> framåt). Den här filen behåller bara de senaste. Sök i arkivet när du behöver veta *varför*
> något gjordes.

**Senast uppdaterad:** 2026-08-30 · **v5.137.0 committad, inte deployad** (internt arbete, ingen
brådska). Produktion står kvar på 5.132.0 (körning #93, verifierad). Utgående e-post är
stoppat sedan v5.131.0 i väntan på Brevos PUB-avtal. **Etapp L1 (leverantörspanelen) är
SLUTFÖRD: 16 av 16 delmål klara, samtliga 7 beslutspunkter avgjorda.** Sista frågan
(beslutspunkt 7, feedback-inkorgen) avgjordes och byggdes 2026-08-30.

## Nuläge

| | |
|---|---|
| **Version i produktion** | 5.132.0 (körning #93, verifierad). v5.133.0–v5.137.0 väntar på deploy |
| **Gren** | `claude/compassionate-euler-rho0q5` – men **kontrollera alltid med `git branch --show-current`**, en session kan startas på en egen gren |
| **Senaste kodarbete** | v5.137.0: beslutspunkt 7 – en helt egen kanal till leverantören (`leverantorsfeedback`, skild från kundens interna `feedback`). Ny sida `KontaktaLeverantoren.jsx`; `Feedback.jsx`/`Hjalp.jsx` fick ett explicit förtydligande av vart respektive kanal går, på ägarens begäran. Internt, ingen kundpåverkan |
| **Senaste dokumentarbete** | 2026-08-30: **`etapplaner/ETAPPLAN19.md` (Etapp 72) skriven som UTKAST – EJ ANTAGEN.** Dessutom `intern/ETAPPLAN-INTERN-1.md` v1.1, `BESLUTSLOGG.md`, `drift/INCIDENT-CHECKLISTA.md` steg 5 |
| **Aktiv plan** | **Ingen.** `intern/ETAPPLAN-INTERN-1.md` (Etapp L1) är slutförd i sin helhet. `etapplaner/ETAPPLAN19.md` (Etapp 72) är ett utkast som väntar på ägarens beslut – **den är INTE antagen och inget i den får byggas.** `etapplaner/ETAPPLAN13.md` (Etapp 64) juridiskt blockerad |
| **Nästa steg** | **Ägaren tar ställning till `etapplaner/ETAPPLAN19.md`** – sex beslutspunkter, varav 1 (patientuppgifter i avvikelsehantering) och 2 (modultillhörighet) blockerar antagandet. Beslutspunkt 1 bör ställas i samma externa juridiska uppdrag som Etapp 64 väntar på. Separat: flytta ägarens eget konto med `flyttaTillPlattformskonto()`, och verifiera `roles/firebaseauth.admin` med "Tvinga utloggning" |

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


## Uppföljning 2026-08-30 (Etapp 72 – utkast, ingen kod)

Ägaren bad om en genomgång av produktens nuvarande form och en identifiering av luckor:
funktioner som möter behov hos potentiella kunder som ännu inte bedömts. Resultatet är
`etapplaner/ETAPPLAN19.md` – **ett utkast, EJ ANTAGET. Ingen kod skriven, inget får byggas.**

**Analysens kärna, två fynd ur koden:**

1. `functions/verksamhetsmallar.js` ger nya kunder en rutinmall som heter "Avvikelsehantering"
   och vars innehåll är *"Beskriv er rutin för att rapportera och följa upp avvikelser"*.
   Produkten ber alltså kunden **beskriva** en process som sedan sker någon annanstans. Samma
   mönster för delegering (finns bara som kvissfråga) och patientsäkerhetsberättelse (finns
   bara i säljmaterialet, som något vi läser HOS kandidater). Synappsen har byggt ett ben av
   ett ledningssystem, mycket väl – de andra ligger i Excel hos målgruppen.
2. **Frekvensproblemet.** Rutindatabasen konsulteras; de saknade skyldigheterna utförs, med
   signatur, varje pass. `KOPARANALYS.md` §6.1 svarar på kallstarten med mer innehåll. Planen
   föreslår ett annat svar: en app som kräver en signatur varje pass har inget
   kallstartsproblem.

**Tolv premissantaganden kontrollerade mot kod, fyra ändrade planen** – bland annat att
`checklistkorningar` bara är en räknare (ingen signerad post), att kompetensmatrisen är
härledd och inte lagrad (kan inte bära delegeringar), och att `bristanmalningar` är hårt knuten
till förrådsartiklar (mönster att härma, inte grund att bygga på).

**Tolv delmål i tre grupper.** Tyngdpunkt: 72a (återkommande kontroller med loggbok) för att
den ensam ändrar användningsfrekvensen. Högst värde per byggtimme: 72b
(patientsäkerhetsberättelse som utkast ur data vi redan samlar). 72e (avvikelsehantering) är
**blockerad** – den kolliderar med produktens grundlöfte om att patientuppgifter aldrig finns,
och bör ingå i samma externa juridiska uppdrag som Etapp 64 väntar på.

**Ett dokumentfel hittades och rättades mekaniskt:** `DOKUMENTREGISTER.md` påstod 65 dokument
och `CLAUDE.md` 62, medan 67 fanns på disk. Båda rättade till 68, och
`tests/docs/dokumentregister.test.js` fick två nya assertioner som failar om siffrorna glider
igen – det sjunde fallet av projektets återkommande felmönster, den här gången i just det
dokument som finns för att förhindra det.

**Ingen kod, ingen versionsbump.** Planens källpåståenden om svensk vårdlagstiftning är
**inte verifierade mot primärkällor** – se planens eget avsnitt "Källor och verifieringsbehov".
Ingen rad får citeras i kundvänt material innan den tabellen är avbockad.

## Uppföljning 2026-08-30 (v5.137.0 – beslutspunkt 7: egen kanal till leverantören)

Ägaren avgjorde den sista öppna frågan i Etapp L1: ska leverantören se kundens
feedback-inkorg? Svar: nej, inte rakt av – bygg en EGEN, tydligt märkt kanal i stället.
Ägaren bad uttryckligen om att göra det tydligt i BÅDA verktygen (den nya och den
befintliga) vart respektive feedback faktiskt går.

**Byggt:** ny collection `leverantorsfeedback`, medvetet HELT ÅTSKILD från kundens interna
`feedback` – ingen tyst utvidgning av vem som läser den redan existerande. En ny sida,
`KontaktaLeverantoren.jsx` (`/kontakta-leverantoren`), säger uttryckligen "Det här går till
Synappsen – inte till din organisations admin". Den befintliga `Feedback.jsx` (och
`Hjalp.jsx`) fick motsvarande förtydligande åt andra hållet, plus en länk mellan de två
sidorna. Leverantörens sida: `LeverantorsfeedbackSektion.jsx` i `/leverantor/logg`, olästa
markerade och kan bockas av.

15 nya tester (9 funktioner, 6 regel) – bevisar bland annat att en post i
`leverantorsfeedback` aldrig läcker in i `feedback` eller tvärtom, och att en annan
superadmin i SAMMA organisation inte kan läsa någon annans meddelande till leverantören.
Fullt testsvep grönt: lint, build, `npx vitest run`, `npm run test:rules`,
`npm run test:functions`, `npm run test:storage`.

**Samtliga 7 beslutspunkter i Etapp L1 är därmed avgjorda och byggda. Etapp L1 är helt
slutförd** – 16 av 16 delmål, 7 av 7 beslutspunkter.

## Uppföljning 2026-08-30 (v5.136.0 – Etapp L1 SLUTFÖRD)

Ägaren bad om beslut på de fyra öppna beslutspunkterna som blockerade de sista fem
delmålen. Ställde dem samlat; ägaren godkände samtliga fyra rekommendationer utan avvikelse.
Detaljer i `BESLUTSLOGG.md` 2026-08-30 och `intern/ETAPPLAN-INTERN-1.md` v1.0.

- **Beslutspunkt 1** (L1c): mätvärdesaggregat via Cloud Function (väg B), inte en lossad
  regel. `hamtaKundmatvarden(orgId)` returnerar bara de redan aggregerade fälten, loggat mot
  kundens EGEN kedja.
- **Beslutspunkt 2** (L1j): bara appversion rapporteras (`rapporteraAppVersion`, skrivet på
  organisationens dokument), inte "senast aktiv" per användare.
- **Beslutspunkt 3** (L1d): egen inline-SVG (`src/utils/sparkline.js`), inget
  diagrambibliotek.
- **Beslutspunkt 4** (L1f): leverantören kan nu BEGÄRA ett supportfönster i appen
  (`begarSupportAtkomst`/`svaraSupportbegaran`) – kunden godkänner fortfarande själv.

**Två premisskontrollfynd ändrade omfånget innan bygget:** L1f:s punkt 4 (ärendetråd per
kund) visade sig redan finnas sedan Etapp 50c (`arendeanteckningar`) – planen hade missat
det. L1e:s punkt 3 (72-timmarsklockan) byggdes redan i L1p. Båda delmålen fick därför ett
mindre omfång än planen ursprungligen skisserade.

**Två punkter avgränsades MEDVETET bort**, båda dokumenterade i `intern/ETAPPLAN-INTERN-1.md`:
L1f punkt 3 (läslogg under ett aktivt supportfönster – kräver att instrumentera varje läsväg
`farSupportlasa()` täcker, ett eget, större delmål) och L1e punkt 2 (ett generaliserat
`nodstopp/{funktion}`-mönster – en omskrivning av skarp, säkerhetskritisk kod utan att en
tredje nödstoppsmekanism ännu finns som kräver den).

26 nya tester. Fullt testsvep grönt: lint, build, `npx vitest run` (546 tester, upp från
535), `npm run test:rules` (inkl. 5 nya för `supportbegaran`), `npm run test:functions`
(inkl. 17 nya, delade mellan L1c/L1f/L1j i en gemensam testfil), `npm run test:storage`.

**Etapp L1 är därmed slutförd i sin helhet: 16 av 16 delmål.** Enda kvarvarande öppna frågan
i hela planen är beslutspunkt 7 (feedback-inkorgen) – inget bygge väntar på den.

## Uppföljning 2026-08-29 (v5.135.0 – L1b byggd)

Kunddossién – planens enskilt största arbetsbesparing, byggd direkt efter de sex
"Medel"-delmålen i samma session. Detaljer i `intern/ETAPPLAN-INTERN-1.md` v0.9 under L1b.

**En verklig bugg hittad vid premisskontroll, inte en kodmiss i den här omgången:**
`listaOrganisationer` (`functions/organisationslivscykel.js`) returnerade aldrig åtta fält
(`orgnr`, `kontaktperson`, `anvandartak`, `pubAvtalTecknat`, `pubAvtalVersion`,
`underbitradeUnderrattad`, `omfattasAvNIS2`, `atagandeblock`) som L1p:s
`AvtalOchAtagandeSektion.jsx` redan berodde på att läsa. Den panelen hade alltså visat fel
sedan den byggdes förra omgången – ett tyst fel som ingen tidigare test kunde fånga eftersom
funktionstesterna läste/skrev dokumentet direkt i stället för via callet klienten faktiskt
använder. Fixat, med `tests/functions/listaorganisationer-falt.test.cjs` som bevisar det.

Fem riktiga sidor ersatte den delade platshållaren från v5.134.0: Huvud+Kontakt (delvis)
(`KundOversikt.jsx`), Användning (delvis) (`KundAnvandning.jsx`), Avtal & ekonomi
(`KundEkonomi.jsx`, återanvänder L1i + flyttar in L1p:s panel), Historik
(`KundHistorikSektion.jsx`, ny callable `hamtaKundensLeverantorshistorik`), Åtgärder
(`KundAtgarderSektion.jsx`, nio befintliga klientfunktioner, ingen ny backend).
`OrganisationsRad.jsx`s dubblerade avtalspanel togs bort till förmån för en länk till
dossién.

**Tre delar medvetet obyggda**, alla dokumenterade i planfilen: Hälsa (kräver L1c +
beslutspunkt 1), "senaste aktivitet" (kräver L1j + beslutspunkt 2), "vem är superadmin"/
"senast bjöd in" (ingen läsväg till `users/{uid}` i dag – att öppna en sådan vore en ny
läsväg mot kundinnehåll utan samtycke, krav 37, och inget L1b bad om).

7 nya funktionstester. Fullt testsvep grönt: lint, build, `npx vitest run` (535 tester,
oförändrat), `npm run test:rules`, `npm run test:functions`.

**11 av 16 delmål i Etapp L1 klara.** Kvarstår: L1e (stor, inget hinder), L1f (stor,
beslutspunkt 4), L1c/L1d/L1j (beslutspunkt 1/3/2).

## Uppföljning 2026-08-29 (v5.134.0 – L1m, L1a, L1g, L1i, L1n, L1p byggda)

De sex "Medel"-delmålen, byggda direkt efter de fyra "Liten"-delmålen i samma session.
Detaljer i `intern/ETAPPLAN-INTERN-1.md` v0.8 under respektive delmål.

**L1m (kontomodellen) är den mest säkerhetskritiska delen** – ett `_plattform`-konto bevisat
isolerat från all kundorganisations innehåll skarpt mot Firestore-regler
(`tests/rules/plattformskonto.test.mjs`), inklusive den faktiska fällan att INTE falla
tillbaka på organisationen "default". `flyttaTillPlattformskonto()` finns för att flytta
ägarens eget konto – **inte körd än**, ett operativt beslut, inte en teknisk fråga.

**L1p:s PUB-avtalsspärr är samma feltyp som Brevo, fast omvänt** – `satAvtalsstatus('aktiv')`
nekas nu utan ett registrerat PUB-avtal (`pubAvtalTecknat`), av exakt samma skäl som
Brevo-spärren: en kontroll i koden kan inte glömmas bort. Ingen skarp risk (noll kunder), men
billigast att stänga innan den första.

**Två deliberata avsteg från planens ordalydelse**, båda dokumenterade i `intern/
ETAPPLAN-INTERN-1.md`: `IncidentberedskapSektion.jsx` togs INTE bort från kundens adminpanel
(planen antog fel – en riktig kund läser sin EGEN organisations status oberoende av
plattformsadmin, att ta bort den hade varit en regression). Kundlägets fem flikar (L1a) delar
en gemensam platshållare i väntan på L1b, i stället för fem tomma sidor.

**Ett självrättat verktygsmisstag**, dokumenterat ärligt i `intern/ANDRINGSLOGG-INTERN.md`:
ett `Write`-anrop skrev av misstag över `src/firebase/functions.js`. Upptäckt omedelbart via
`git status`, återställd från `git show HEAD:...`, alla tillägg återapplicerade och
verifierade innan arbetet fortsatte. Ingen förlorad kod.

77 nya tester. Fullt testsvep grönt: lint, build, `npx vitest run` (535 tester, upp från 517),
`npm run test:rules` (alla filer inkl. 2 nya), `npm run test:functions` (alla 40 filer inkl.
5 nya).

**10 av 16 delmål i Etapp L1 klara.** Kvarstår: L1b (kunddossién – inget hinder, störst
kvarvarande arbetsbesparing), L1e/L1f (stora, L1f väntar på beslutspunkt 4), L1c/L1d/L1j
(väntar på beslutspunkt 1/3/2).

## Uppföljning 2026-08-29 (v5.133.0 – L1l, L1h, L1k, L1o byggda)

Ägaren bad om de fyra "Liten"-delmålen i Etapp L1. Byggda, testade, committade – **inte
deployade** (internt arbete, ingen brådska; nästa deploy kan vänta tills ett kundvänt behov
finns eller L1m är klar). Detaljer i `intern/ETAPPLAN-INTERN-1.md` (v0.7) under respektive
delmål och i `intern/ANDRINGSLOGG-INTERN.md` (v5.133.0-posten).

**Ett verkligt korrekthetsfel hittades och fixades under L1k**, inte i produktion senare: ett
blint `FieldValue.increment(±1)` på en organisations ännu-inte-initierade `antalAnvandare`
hade skrivit en felaktig ABSOLUT siffra (Firestore behandlar increment på ett saknat fält som
att basen är 0 – "1 användare" för en organisation som redan har tio). Både `losInInbjudan`
och `raderaAnvandare` läser nu räknarens nuvarande värde först och rör den bara om den redan
är ett tal; annars lämnas fältet åt `listaOrganisationer`s lativa backfill, som räknar rätt
från grunden. Fångat av `tests/functions/antalanvandare-raknare.test.cjs` INNAN kodgranskning
hann missa det – testet skrevs samtidigt som implementationen, inte efteråt.

L1k byggdes bara på `antalAnvandare`-axeln. Kostnadshistorik-axeln (den andra extra läsningen
i `listaOrganisationer`) avgränsades medvetet bort: den skrivs lativt inuti `reserveraBudget`,
en budgetkritisk transaktion som körs före varje Gemini-anrop, och att denormalisera dit för
en enda leverantörsvys visning vore oproportionerligt för ett delmål stämplat "Litet".

37 nya tester. Fullt testsvep grönt: `npm run lint`, `npm run build`, `npx vitest run` (517
tester, upp från 480), `npm run test:rules` (alla filer, inkl. den nya
`atagandekalender.test.mjs`), `npm run test:functions` (alla 35 filer, inkl. de två nya).

## Uppföljning 2026-08-29 (Etapp L1 antagen + arbetsuppskattning)

`intern/ETAPPLAN-INTERN-1.md` (leverantörspanelen) **antogs i sin helhet**, v0.6.
Beslutspunkterna 5 (samma app) och 6 (flytta befintligt konto) avgjordes genom antagandet
– planens struktur förutsätter dem. **1–4 och 7 kvarstår öppna** och avgörs var för sig,
precis innan L1c/L1d/L1f/L1j respektive påbörjas – de blockerar inget annat delmål.
`BESLUTSLOGG.md` fick raden, `DOKUMENTREGISTER.md` och `intern/ANDRINGSLOGG-INTERN.md`
uppdaterades. Två rader i `OPPNA-PUNKTER.md` (återställningsluckan, PUB-spärren) togs bort –
de väntade bara på det här antagandet och är nu byggkapacitet, inte ett öppet beslut.

**Arbetsuppskattning, på ägarens begäran.** 16 delmål (L1a–L1p), i samma effortskala som
tabellen "Uppskattad arbetsinsats" i planfilen: 4 små, 6 medel, 3 stora, 3 beroende av öppna
beslutspunkter. Grovt ~18–24 fokuserade byggpass (bygg + fullt testsvep + commit, samma
enhet varje `Uppföljning`-post i den här filen redan representerar) om
rekommendationerna följs på de öppna punkterna – jämförbart i total omfattning med de
senaste 15–20 etapperna tillsammans. Kalendertiden styrs av sessionstakten, inte av hur
mycket ett enskilt pass hinner. Byggordningen (L1m → fritt inom varje gren i
"Beroendeordning") gör att flera delmål kan drivas parallellt utan att vänta på varandra.

