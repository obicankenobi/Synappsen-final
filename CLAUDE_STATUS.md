# Status & överlämning – läs mig först i en ny Claude Code-session

> Kort "var slutade vi och vad gör jag nu"-sammanfattning. Ersätter INTE
> `etapplaner/UTVECKLINGSLOGG.md` (detaljerad teknisk historik) eller planfilerna i
> `etapplaner/` – den pekar vidare dit.
>
> **Historiken ligger i `etapplaner/STATUSARKIV.md`** (117 uppföljningar från 2026-07-28 och
> framåt). Den här filen behåller bara de senaste. Sök i arkivet när du behöver veta *varför*
> något gjordes.

**Senast uppdaterad:** 2026-08-26 · version **5.129.0** · **byggd och pushad, EJ deployad än**.
Senast deployade version är 5.128.0 (körning #87).

## Nuläge

| | |
|---|---|
| **Version i produktion** | 5.128.0 (körning #87). **v5.129.0 är byggd men inte deployad** |
| **Gren** | `claude/compassionate-euler-rho0q5` – men **kontrollera alltid med `git branch --show-current`**, en session kan startas på en egen gren |
| **Senaste kodarbete** | v5.129.0: fem fel från första riktiga användningen (två kollegor inbjudna) – kontoradering/avstängning, lösenordsåterställning, ärligt inbjudnings-UI, startbibliotek i efterhand, CSP- och hemlighetsfix. Se uppföljningen 2026-08-26 |
| **Senaste dokumentarbete** | 2026-08-23: säljmaterialet infört och faktagranskat mot koden, dokumentationen strukturerad i ämnesmappar, dokumentregister + påståendetester byggda |
| **Aktiv plan** | Ingen. Etapp 69 var den sista. `etapplaner/ETAPPLAN13.md` (Etapp 64) är antagen men juridiskt blockerad – inget steg är byggbart förrän en extern bedömning finns |
| **Nästa steg** | **Ägaren måste ge tjänstekontot `roles/firebaseauth.admin` i GCP** – utan det fungerar varken avstängning, radering eller tvingad utloggning, oavsett kod. Därefter: sätt `BREVO_API_KEY`, deploya v5.129.0. Se `OPPNA-PUNKTER.md` |

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

## Uppföljning 2026-08-23 (deploy av v5.128.0, körning #87)

Deployade fixen för "Uppdatera"-knappen direkt eftersom det var en rapporterad, redan
verifierad bugg. Körning **#87** på commit `5a63c16`. Produktionen kör nu **v5.128.0**.

Verifierat på artefakten: `sw.js` innehöll noll förekomster av `SKIP_WAITING` före deployen,
en efter.

**Obs för nästa gång knappen testas:** eftersom `src/sw.js` sjäva filen ändrades är det den
DEPLOYADE service workern som saknade fixen innan nu. En webbläsare som redan hade den GAMLA
workern installerad (utan lyssnaren) sedan tidigare kan behöva en vanlig sidladdning (inte
bara "Uppdatera"-klicket) EN gång för att hämta den NYA workern som väl har fixen – därefter
fungerar knappen normalt vid framtida uppdateringar. Det är förväntat, inte ett nytt fel.

---

## Uppföljning 2026-08-23 (säljmaterialet infört, granskat och rättat)

**Ingen kodändring.** Enbart dokument – men tre av rättelserna rör påståenden som skickas till
kunder, och en av dem var direkt osann.

**Vad som hände.** Ägaren tillhandahöll ett säljmaterialpaket framtaget 2026-08-17–19 mot
kodläge v5.117.0 (marknadsanalys, kostnadskalkyl, kandidatlista, köparanalys, demomanus,
invändningshantering, e-postmallar, sex HTML-källfiler, samt Word-/PowerPoint-original).
Textdelarna laddades upp; binärfilerna gjorde det inte, se `CLAUDE.md`s nya avsnitt
"Marknads- och säljmaterial" för motiveringen och för konsekvensen (presentationerna måste
byggas om separat vid varje rättelse). Paketets kritiska påståenden verifierades mot faktisk
kod – resultatet ligger i `saljmaterial/SALJMATERIAL-UNDERLAG-FOR-BEDOMNING.md`. Därefter granskades
`saljmaterial/KOPARANALYS.md` mot sina egna källor; granskningen står som §15 i den filen, med brödtexten
orörd enligt vanlig kronologiprincip.

**Tre osanningar i kundvänt material, samtliga rättade:**

| Vad | Var | Rättat till |
|---|---|---|
| **"VANLIGASTE VALET"** på Drift-nivån, och demomanusets *"Drift, som är det de flesta väljer"* – med noll kunder har ingen valt något | `saljmaterial/kallfiler/Synappsen-prislista.html`, `saljmaterial/Synappsen-demomanus.md` | "VÅR REKOMMENDATION" respektive "den nivå jag rekommenderar", plus en uttrycklig varning i demomanuset |
| **Upphandlingssvar E2 påstod att artikel 50-märkningen var implementerad.** Ingen sådan märkning finns i koden – verifierat med genomsökning av hela `src/`. Ett aktivt felaktigt påstående i ett dokument avsett att klippas in i skarpa anbud | `saljmaterial/kallfiler/Synappsen-upphandlingssvar.html` | Redovisad som ej byggd, med en intern varningsruta om att inte skriva tillbaka påståendet utan att först kontrollera i koden |
| **Underbiträdesförteckningen beskrev klinikstöd-sökningen som pausad.** Den återaktiverades 2026-08-01; `granskningar/SAKERHETSRAPPORT.md` rättade sig själv då men förteckningen följde inte med. Ett dokument som lämnas till kundens dataskyddsombud beskrev alltså en behandling som **mindre** omfattande än den är – fel riktning att ha fel åt | `avtal/UNDERBITRADEN.md` | Rättad, med en not om varför. `granskningar/SAKERHETSRAPPORT.md`s kvarstående rubrik "Pausad funktion" är märkt som historisk så den inte citeras igen |

**Tre stale-fynd i interna dokument, rättade:** `saljmaterial/PITCH.md` sa sex roller (koden har sju,
`src/firebase/roles.js`); `produkt/MODULPLAN.md` listade kioskläget som obyggt fyra månader efter att
det byggdes i Etapp 55 – och var därmed underlag för en köparanalys som drog slutsatser om
modulgränserna ur en felaktig bild; `granskningar/TILLGANGLIGHETSREDOGORELSE.md`s sammanfattning påstod att
#8 och #9 kvarstod trots att Etapp 68 åtgärdade dem. Faktiskt kvarvarande på nivå A är fyra
små punkter (#4, #5, #6, #10), nu en rad i `OPPNA-PUNKTER.md` med kommersiell motivering.

**Ett ägarbeslut avgjort samma dag:** uppstartsavgiften (25 000 kr) var motstridig – prislistan
sa att den utgår helt för de tre första referenskunderna, kostnadskalkylen sa "ge aldrig bort
den". **Beslut: avgiften kvarstår och betalas av de tre första kunderna**, om inte annat
uttryckligen framgår i det enskilda kundavtalet. `saljmaterial/kallfiler/Synappsen-
prislista.html` rättad, `saljmaterial/KOPARANALYS.md` §15 räknat om (referenskundens förstaårskostnad är
55 625 kr, inte 24 375 kr), se `BESLUTSLOGG.md`.

**Ett ägarbeslut kvarstår öppet i `OPPNA-PUNKTER.md`:** utfallsgarantin (`saljmaterial/KOPARANALYS.md`
§11.1) – ja eller nej. Analysens motivering ("marginalen är 99 %, garantin är nästan gratis")
håller inte: kostnaden är den nedlagda tiden, inte det återbetalda abonnemanget. Garantin kan
ändå vara rätt, men som riskinstrument.

**Det viktigaste att bära med sig till nästa session:** paketet är skrivet mot v5.117.0 medan
koden är på v5.128.0. Kontrollera statuspåståenden mot koden, inte mot paketet. Och när ett
säljdokument rättas – kom ihåg att `.pptx`-filerna inte ligger i repot och inte får rättelsen
automatiskt.

---

## Uppföljning 2026-08-23 (dokumenthanteringen gjord mekanisk)

**Ingen kodändring i appen.** Löser projektets mest återkommande problem: dokument som glöms
bort och blir inaktuella trots regler om att de ska uppdateras löpande.

**Diagnosen.** Projektet hade fem utförliga prosaregler i `CLAUDE.md` och **en** mekanisk
kontroll. Utfallet var entydigt: allt med maskinkontroll höll (`src/version.js` importerar
versionen, `pitch-version.test.js` vaktar `PITCH.md`s versionsrubrik), allt med bara prosaregel
gled (`PITCH.md`s rollantal, `MODULPLAN.md` fyra månader, `UNDERBITRADEN.md` fyra veckor i ett
DSO-dokument, tillgänglighetsredogörelsens sammanfattning).

**Färskhetsstämplar övervägdes och förkastades.** De är spelbara – när testet failar är det
billigaste att bumpa stämpeln utan att läsa dokumentet, vilket gör synlig inaktualitet till
dold. De hade dessutom fångat 2 av de 6 verkliga felen. **Assertioner fångar 6 av 6, kostar
noll löpande ritual och kan inte göras gröna utan att dokumentet eller koden faktiskt rättas.**

**Byggt:**

| Vad | Effekt |
|---|---|
| `DOKUMENTREGISTER.md` | Alla 62 dokument indexerade med typ, externflagga och utlösare |
| `tests/docs/dokumentregister.test.js` | Nytt/flyttat/raderat dokument utan registerändring failar. `CLAUDE_STATUS.md` över 400 rader failar |
| `tests/docs/dokumentpastaenden.test.js` | Sex assertioner som binder dokumentpåståenden till koden. **Verifierade genom att återinföra alla sex verkliga felen – samtliga fångades** |
| `etapplaner/STATUSARKIV.md` | 117 historiska uppföljningar utbrutna, oförändrade. Alla 120 sektioner finns kvar (120 före = 120 efter) |

**Token-effekt:** `CLAUDE_STATUS.md` 75 600 → 3 645 tokens, `CLAUDE.md` 9 900 → 3 784. En ny
session går från ~85 500 till ~7 400 tokens innan den är orienterad.

**Två fel som rättades på vägen:** `CLAUDE_STATUS.md`s huvud motsade sig självt (rad 9 sa
deployad #87, rad 10–17 sa "avvakta, blockerad vid #78"), och sektionen "Nuläge i ett stycke"
beskrev i själva verket läget vid v5.24.0 – ett historiskt avsnitt med en missvisande rubrik,
alltså precis den drift arbetet handlar om. Båda arkiverade respektive omskrivna.

**Vad detta INTE löser, sagt rakt ut:** ett test kan bara kontrollera påståenden som någon har
brytt sig om att koda. Prosa som ingen omvandlat till en assertion kan fortfarande ruttna
tyst. Regeln "uppdatera dokumentet i samma commit som ändringen" gäller därför oförändrat –
testerna fångar bara den delmängd som gick att formulera maskinellt. **När du hittar ett
felaktigt påstående: rätta texten och lägg till en assertion i samma commit.**

---

## Uppföljning 2026-08-23 (kvissbank + startbibliotekets kvissfrågor)

**Fynd som motiverade arbetet.** Mikrokvissen (Etapp 19b) delar fält (`rutin.kviss`) med öva-
läget (65d) och Veckans repetition (41b), och båda de senare filtrerar på `kviss.length > 0`.
Startbiblioteket seedade 17 rutinmallar med **tomma kvissfält** – två byggda funktioner var
alltså helt tomma dag ett för varje ny organisation. Seedningen i
`functions/organisationslivscykel.js` skrev dessutom inte fältet alls, så det hade ignorerats
även om mallarna haft frågor.

**Byggt:**

| Vad | Innehåll |
|---|---|
| `src/data/kvissbank.js` | 20 återanvändbara frågor i sex kategorier (kvittering, ansvar, användning, färskhet, patientuppgifter, mallar) + `tillRutinKviss()` och `MAX_KVISSFRAGOR_PER_RUTIN` |
| `src/data/kvissbank.test.js` | 31 tester: form, unika id:n, rattIndex i intervall, **kliniska termer förbjudna**, personnummermönster förbjudna, och två kopplingstester mot koden |
| `MALL_KVISS` i `functions/verksamhetsmallar.js` | Två frågor på var och en av de 17 startmallarna |
| `functions/organisationslivscykel.js` | Seedar nu `kviss` – utan raden hade mallfrågorna aldrig nått databasen |

**Den avgörande avgränsningen.** En kvissfråga har ett rätt svar och är därför ett
faktapåstående – till skillnad från en rutinmall, som bara är ett skelett. Påhittad klinisk
vägledning i en fråga skulle passera både MDR-gränsdragningen och regeln om att aldrig påstå
overifierat sakinnehåll. **Katalogen innehåller därför bara frågor om hur systemet och
processen fungerar**, och ett test förbjuder kliniska termer (dos, mg, blodtryck, behandla …).
Kliniska frågor skrivs av verksamheten själv om den egna godkända texten, eventuellt via
`foreslaKvissfragor`, som redan bara får pröva förståelse av befintlig text.

Startmallarnas två frågor handlar om **att rutinen är en mall och inte får följas som färdig
rutin**. Det gör startbibliotekets största risk – att någon litar på en platshållare – till
det första personalen får bekräfta att de förstått.

**Två kopplingstester som skyddar en verklig fallgrop.** `MAX_KVISSFRAGOR_PER_RUTIN` binds mot
taket i `RutinFormular.jsx` OCH mot `harTroligtPersonnummerIKvissN` i `firestore.rules`, som
radar upp exakt fyra index eftersom regelspråket saknar loopar. Höjs taket utan att den
funktionen utökas slutar PII-spärren gälla för frågorna över gränsen, tyst. Verifierat genom
att höja taket till 6 – båda testerna failade.

**Fel som rättades på vägen:** demomanuset påstod att kvitteringar "räknas bort automatiskt"
vid väsentlig ändring. Mot `src/utils/kompetensStatus.js`: redaktören måste själv markera
ändringen som väsentlig, och ingenting raderas – kvittensen slutar räknas i
kompetensöversikten men finns kvar i historiken. Formuleringen rättad.

**Föreslaget men inte byggt** (kräver ägarbeslut, se nästa avsnitt i chatten): väljare i
`RutinFormular.jsx` för att plocka frågor ur banken, kviss i introduktionsspåret, och
kategorifilter i öva-läget.

---

## Uppföljning 2026-08-23 (kvissbanken kopplad in på tre ställen)

**Ingen ny datamodell.** Gårdagens `src/data/kvissbank.js` (20 frågor) och `MALL_KVISS` på
startmallarna var byggda men inte kopplade till gränssnittet. Tre kopplingar:

1. **Frågebankväljare i `RutinFormular.jsx`.** Ny knapp "📚 Välj från frågebanken" i
   kvissfältet, expanderar en lista grupperad per kategori (redan tillagda frågor filtreras
   bort). Ersatte samtidigt alla kvarvarande hårdkodade `4`:or med
   `MAX_KVISSFRAGOR_PER_RUTIN` – ett nytt test i `kvissbank.test.js` failar om en hårdkodad
   siffra smyger sig tillbaka.
2. **Kviss-badge i introduktionsspåret.** `berakraIntroduktionsProgress` (`introduktionProgress.js`)
   räknar nu fram `harKviss` per post. Ingen ny logik krävdes för själva kvissen – KvissModal
   visas redan automatiskt vid kvittering via `RutinKort.jsx` – bara en synlig "📝
   kunskapskontroll"-flagga i både den nyanställdas egen lista och chefsvyns
   "Signera punkter", så att ingen missar att en punkt har en kunskapskontroll kopplad.
3. **Kategorifilter i öva-läget.** `byggFragepool(rutiner, omrade, kategori)` tar nu ett
   valfritt tredje argument, ny `tillgangligaKategorier()` listar bara kategorier som faktiskt
   förekommer (döljer filtret helt för en organisation utan bankfrågor). `tillRutinKviss()`
   behåller nu frågans `kategori` som valfri metadata på den sparade kviss-raden – läses
   ingenstans annars, ofarligt att spara.

**Testsvep:** lint rent, 466/466 vitest (12 nya), build grönt, `test:functions` (samtliga
delsviter) och `test:rules` (samtliga delsviter) gröna. Ingen manuell webbläsarverifiering
gjordes den här gången (emulator-CLI:t inte tillgängligt interaktivt i sessionen) – litar på
att build + fyra gröna testsviter fångar det en visuell genomgång annars skulle.

---

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
