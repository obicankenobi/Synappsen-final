# Status & överlämning – läs mig först i en ny Claude Code-session

> Kort "var slutade vi och vad gör jag nu"-sammanfattning. Ersätter INTE
> `etapplaner/UTVECKLINGSLOGG.md` (detaljerad teknisk historik) eller planfilerna i
> `etapplaner/` – den pekar vidare dit.
>
> **Historiken ligger i `etapplaner/STATUSARKIV.md`** (121 uppföljningar från 2026-07-28 och
> framåt). Den här filen behåller bara de senaste. Sök i arkivet när du behöver veta *varför*
> något gjordes.

**Senast uppdaterad:** 2026-08-30 · **v5.136.0 committad, inte deployad** (internt arbete, ingen
brådska). Produktion står kvar på 5.132.0 (körning #93, verifierad). Utgående e-post är
stoppat sedan v5.131.0 i väntan på Brevos PUB-avtal. **Etapp L1 (leverantörspanelen) är
SLUTFÖRD: 16 av 16 delmål klara.** Beslutspunkterna 1–4 avgjordes samlat 2026-08-30, vilket
löste upp de sista fem delmålen (L1c, L1d, L1e, L1f, L1j) i en och samma omgång.

## Nuläge

| | |
|---|---|
| **Version i produktion** | 5.132.0 (körning #93, verifierad). v5.133.0–v5.136.0 väntar på deploy |
| **Gren** | `claude/compassionate-euler-rho0q5` – men **kontrollera alltid med `git branch --show-current`**, en session kan startas på en egen gren |
| **Senaste kodarbete** | v5.136.0: de sista fem delmålen i Etapp L1 – L1c (mätvärdesaggregat via Cloud Function), L1d (egna SVG-sparklines), L1e (nödstoppsöversikt + åtgärdstidslinje), L1f (leverantören kan begära ett supportfönster i appen; ärendetråden fanns redan sedan Etapp 50c), L1j (bara appversion rapporteras, inte "senast aktiv"). Internt, ingen kundpåverkan |
| **Senaste dokumentarbete** | 2026-08-30: `intern/ETAPPLAN-INTERN-1.md` v1.0 (samtliga 16 delmål klara), `intern/ANDRINGSLOGG-INTERN.md` v5.136.0-post, `BESLUTSLOGG.md` (beslutspunkterna 1–4), `drift/INCIDENT-CHECKLISTA.md` steg 5 (L1j:s nya fält) |
| **Aktiv plan** | `intern/ETAPPLAN-INTERN-1.md` (Etapp L1, leverantörspanelen) – **slutförd, inga delmål kvarstår.** Ingen KUNDVÄND plan aktiv sedan Etapp 69; `etapplaner/ETAPPLAN13.md` (Etapp 64) juridiskt blockerad |
| **Nästa steg** | Ingen aktiv intern plan kvarstår. Separat: flytta ägarens eget konto med `flyttaTillPlattformskonto()` när ägaren vill, och verifiera `roles/firebaseauth.admin` med "Tvinga utloggning" om det inte redan gjorts. Beslutspunkt 7 (feedback-inkorgen) är öppen men inget bygge väntar på den |

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

**Tillägg samma dag (v0.4):** en behovsanalys B1–B10 – vilka återkommande arbetsuppgifter
ägaren faktiskt har, och vilken funktion i panelen som möter var och en. Nytt delmål L1n.

**Det allvarligaste fyndet i hela genomgången:** `aterstallOrganisationCallable` och
`backupaOrganisation` finns som plattformsadmin-grindade callables men har **noll
gränssnitt** – och backupfilerna är `allow read, write: if false` i `storage.rules`, så en
klient kan inte ens lista dem. Samtidigt beskriver `avtal/INCIDENTRESPONSPLAN.md` 5.5 och
`drift/INCIDENT-CHECKLISTA.md` steg 8 återställning som en existerande förmåga. Den finns som
kod men går inte att utöva utan CLI mot produktionsprojektet. Dokumenten är alltså sanna om
koden och falska om verkligheten – samma feltyp underhållsregeln finns för, fast omvänd.
Ingen dokumentändring gjord: förmågan FINNS, den saknar bara en knapp, och L1n bygger den.

Näst allvarligast: `hamtaBackupstatus`, `verifieraRevisionskedjor`, `testaBeroenden` och
`verifieraKlinikstod` sitter i `src/components/admin/IncidentberedskapSektion.jsx` – i
KUNDENS adminpanel bakom `arSuperadmin`. Efter L1m når ett `_plattform`-konto dem aldrig.

**Tillägg samma dag (v0.5):** behoven utanför driften – avtal, juridik, försäljning (B11–B20),
plus delmålen L1o (åtagandekalendern) och L1p (avtal och åtaganden per kund).

Det viktigaste fyndet där: **ingenting hindrar att en organisation sätts till `avtalsstatus:
aktiv` utan att ett PUB-avtal finns.** Organisationsdokumentet har inget sådant fält alls. Det
är samma fel som Brevo, fast med Synappsen som biträdet i stället för kunden – och lösningen
ska vara densamma som valdes då: en spärr i `satAvtalsstatus`, inte en rad i en checklista.
Motiveringen står redan i `avtal/UNDERBITRADEN.md`s ändringshistorik (2026-08-27).

Två saker till som är värda att komma ihåg utan att öppna planen: (1)
`granskningar/JURIDISK-GRANSKNING.md` risk 15 – en kund under cybersäkerhetslagen (2025:1506)
har 24 timmars tidig varning medan PUB-avtalet lovar 72, så en incidentklocka måste kunna
räkna ned från båda. (2) `drift/INCIDENT-CHECKLISTA.md` säger själv att nyckelrotationens
påminnelse *"inte är byggd än"* – den och tre andra återkommande åtaganden samlas i L1o
i stället för att bli fyra ad hoc-signaler.

**Avrått från:** att flytta `saljmaterial/KANDIDATLISTA-PRIVAT-VARD.md` in i panelen. Den
innehåller bedömningar om namngivna verksamheter och kontaktuppgifter till namngivna personer;
i produktionsdatabasen vore det en ny behandling med leverantören som personuppgifts-
ANSVARIG, inte biträde – med egen rättslig grund och informationsplikt enligt art. 14. Hela
produktens juridiska hållning bygger på biträdesrollen. Listan stannar i git.

Ägaren har också gett Cloud Functions-tjänstekontot `roles/firebaseauth.admin` i GCP.
**Ännu inte verifierat** – `tvingaUtloggning` på ett testkonto är det icke-destruktiva testet.
Tills det är gjort står raden kvar i `OPPNA-PUNKTER.md`.
