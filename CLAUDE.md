# Synappsen – projektöversikt för Claude Code

Digital kunskapsbank/rutindatabas för en akutmottagning. PWA byggd med React, Firebase
(Auth/Firestore/Storage/Cloud Functions) och Fuse.js. Multi-tenant (flera vårdorganisationer
i samma app, fullt isolerade). Se `README.md` för att komma igång lokalt.

Det här dokumentet är en **stabil karta** över projektets skriftliga dokumentation – vilken
fil som är auktoritativ för vad, och vilka som är historiska men fortfarande korrekta kontra
vilka som aktivt hålls uppdaterade. Det ändras sällan. För "var slutade vi och vad händer
härnäst" – läs `CLAUDE_STATUS.md` istället, som uppdateras varje session.

> **Bakgrund (2026-07-28):** den här filen skapades efter att `FRAMTIDSPLAN.md` och
> `MODULPLAN.md` upptäcktes vara stale sedan v5.7.0 respektive v5.10.0 (43 respektive 38
> releaser bakom faktisk kodstatus) medan appen redan var på v5.45.3 – ett tecken på att
> dokumentationen inte hade en tydlig, känd "vem uppdaterar vad, och vem är sanningskälla"-
> struktur. Båda är omskrivna. Se `CLAUDE_STATUS.md`s "Uppföljning 2026-07-28"-sektion för
> hela historien, inklusive två andra fall av samma mönster (`src/version.js`,
> `src/data/andringslogg.js`).

## Läsordning för en ny session

1. **`CLAUDE_STATUS.md`** – läs FÖRST. Kort "var slutade vi, vad gör jag nu"-sammanfattning,
   uppdateras löpande. Pekar vidare till detaljer i planfilerna nedan.
2. **`OPPNA-PUNKTER.md`** – läs ANDRA. Ett samlat register över allt som väntar på en människa
   eller ett beslut (inte på kapacitet), tvärs över alla planfiler. Ersätter behovet av att
   läsa statusblocken i punkt 4–6 nedan var för sig.
3. **`ETAPPLAN11.md`** – den AKTIVA utvecklingsplanen (Etapp 53–58: "Från en avdelning till
   en kund som växer" – e-post som kanal, flera enheter under samma huvudman, kioskläge,
   startbiblioteket, säljmaterialets sanning, SSO). Antagen 2026-08-10. Om användaren ber om
   fortsatt arbete utan att specificera vad: det är här nästa punkt finns. Flera delmål är
   villkorade av egna ägarbeslut (se planens "Beslutspunkter som kräver ägaren") – kontrollera
   det innan ett sådant delmål påbörjas.
4. **`ETAPPLAN10.md`** – HELT KLAR utom Etapp 52 (pilotpaketet, kräver bokad tid med riktiga
   människor, inte kod – se planens egen "Beslutspunkter som kräver ägaren"). Etapp 48–51
   HELT KLARA OCH DEPLOYADE.
5. **`ETAPPLAN9.md`** – HELT KLAR (Etapp 45: kvalitetsmaskineriet riktas utåt). Historisk men
   korrekt, inget kvar att göra där.
6. **`ETAPPLAN8.md`** – Etapp 44, 46 och 47 HELT KLARA OCH DEPLOYADE. Ingen etapp väntar
   ogjord i den här filen just nu.
7. **`ETAPPLAN7.md`** – HELT KLAR OCH DEPLOYAD (Etapp 42+43, gränssnittsförnyelse). Historisk
   men korrekt, inget kvar att göra där.
8. **`ETAPPLAN6.md`** – inte stängd. Dess kvarvarande punkt (Etapp 40, villkorad av en
   konkret ny kund) är inte blockerad av kapacitet, bara av att komma i tur. Ta den när som
   helst.
9. **`ETAPPLAN5.md`** – inte stängd. Dess kvarvarande punkter listas nu i `OPPNA-PUNKTER.md`
   istället för att behöva läsas härifrån.
10. Övriga dokument nedan, efter behov.

## Dokumentkarta

### Aktiva planer (uppdateras löpande, litar på dem)

| Fil | Innehåll | Status |
|---|---|---|
| `ETAPPLAN10.md` | Etapp 48–52: "Redo att drivas" – kapacitet/kostnad, avetableringens livscykel, supportbarhet utan innehållsåtkomst, demo/övning, pilotpaketet | **HELT KLAR utom Etapp 52** (pilotpaketet, kräver bokad tid, inte kod). Etapp 48–51 klara och deployade. Historisk men korrekt. |
| `ETAPPLAN9.md` | Etapp 45: kvalitetsmaskineriet riktas utåt (respons på extern granskning) | **HELT KLAR OCH DEPLOYAD** (2026-08-04, v5.74.0, körning #68). Alla sex delmål 45a–45f byggda. |
| `OPPNA-PUNKTER.md` | Samlat register över människo-/beslutsberoende punkter, tvärs över alla planfiler | **Aktiv, LEVANDE, ny 2026-08-04 (Etapp 45d).** Händelsestyrd underhållsregel, se arbetsmönstren nedan. |
| `BESLUTSLOGG.md` | Samlat register över tagna ägarbeslut, framåtriktat från 2026-08-04 | **Aktiv, LEVANDE, ny 2026-08-04 (Etapp 45f).** Byggs inte retroaktivt – historiska beslut finns i `CLAUDE_STATUS.md`. Händelsestyrd underhållsregel, se arbetsmönstren nedan. |
| `ETAPPLAN8.md` | Etapp 44: mobilappskänsla, Etapp 46: incidentberedskap, Etapp 47: sök/kunskapsupptäckt | **Alla tre HELT KLARA OCH DEPLOYADE.** 44 v5.73.0 (körning #67). 46/47 v5.75.0/v5.76.0, deployade 2026-08-04 (körning #68). |
| `ETAPPLAN7.md` | Etapp 42 + Etapp 43: gränssnittsförnyelse | **HELT KLAR OCH DEPLOYAD** (2026-08-03). Etapp 42a–42f och Etapp 43a–43e klara, v5.72.0 live i produktion (körning #66). Historisk men korrekt. |
| `ETAPPLAN6.md` | Etapp 37–41: innehållets hälsa, redaktörens vardag, bevisad effekt, import, synlighet | **Aktiv men ej stängd.** Etapp 37–39 och 41 klara. Kvarvarande punkt (Etapp 40) listad i `OPPNA-PUNKTER.md`. |
| `ETAPPLAN5.md` | Etapp 32–36: säkerhet, upptäckt, incidentberedskap | **Aktiv men ej stängd.** I det närmaste klar – kvarvarande punkter listade i `OPPNA-PUNKTER.md` istället för att dupliceras här. |
| `ETAPPLAN11.md` | Etapp 53–58: e-post som kanal, flera enheter under samma huvudman, kioskläge, startbiblioteket, säljmaterialets sanning, SSO | **Aktiv, ANTAGEN 2026-08-10.** Sex premisser verifierade mot faktisk kod innan antagande. Flera delmål villkorade av egna ägarbeslut (se planens "Beslutspunkter som kräver ägaren") – kontrollera innan ett sådant delmål påbörjas. |
| `ETAPPLAN5-ALT-A.md` / `ETAPPLAN5-ALT-B.md` | Två utkast som INTE antogs när `ETAPPLAN6.md` valdes | **Utkast, ej antagna.** Arkiverade – se `FRAMTIDSPLAN.md` för omprövningsvillkor per alternativ. |
| `CLAUDE_STATUS.md` | Kort handoff-sammanfattning | **Aktiv, LEVANDE** – händelsestyrd underhållsregel, se "Obligatorisk underhållsregel: CLAUDE_STATUS.md" under arbetsmönstren nedan. |
| `src/data/andringslogg.js` | Användarvänd ändringslogg, visas i appen (`/nyheter`) | **Aktiv** – lägg till en post vid VARJE release. |
| `UTVECKLINGSLOGG.md` | Fullständig kronologisk teknisk historik ("Fas 1–41+") | **Aktiv**, växer varje fas. |

### Historiska planer (klara, men fortfarande KORREKTA referenser – rör inte innehållet, bara läs)

| Fil | Innehåll |
|---|---|
| `ETAPPLAN.md` | Etapp 0–5: organisationsmodell (multi-tenant), grundfunktioner. Allt klart. |
| `ETAPPLAN2.md` | Etapp 6–12: leverantörsadmin, feature-gating, driftskulder, säkerhetshärdning. Klart utom uttryckligen villkorade/ej efterfrågade delar (se filens egna markeringar). |
| `ETAPPLAN3.md` | Etapp 13–21: upphandlingspaket, revisionslogg, onboarding, rollbaserad startvy, checklistläge, kompetenspaket, bristanmälan, källbevakning. Klart utom 13f (SSO) och Etapp 16 (veckopuls) – båda medvetet pausade, väntar på ägarbeslut. |
| `ETAPPLAN4.md` | Etapp 22–31: medarbetarnära funktioner (namn/bilder, kommandopalett, push, "sedan ditt förra pass", ändringsförslag, skanning i förrådet, kundprofil, offline, snabbhet/WCAG) + uppföljning på en extern kodgranskning. Klart utom 30b (fysiskt akutlägestest) och 31c/12c-ii (App Check-enforcement) – båda väntar på ägaren. |
| `ETAPP1-ARBETSUPPGIFTER.md` | Detaljerad uppgiftslista för allra första etappen. Rent historiskt. |

**Varför inte slå ihop dessa till en fil?** Varje fil representerar en avslutad fas av
planeringsarbete – att slå ihop dem skulle förlora den kronologiska bilden av hur planen
utvecklats och göra det svårare att se VILKEN etapp som hörde till VILKEN release. Håll dem
separata; skriv en ny `ETAPPLANx.md` när den aktiva planen är klar, istället för att skriva om
en gammal.

### Sammanfattande/pekande dokument (kort, ska ALDRIG duplicera detaljer från planerna ovan)

| Fil | Innehåll | Senast omskriven |
|---|---|---|
| `FRAMTIDSPLAN.md` | **Arkiv över ej antagna planer** (de tre alternativ som valdes bort när `ETAPPLAN6.md` antogs) + kända öppna punkter | 2026-08-01 |
| `MODULPLAN.md` | Modul-/affärsplan: Core/Operations/Intelligence/Källbevakning, byggstatus, prissättning | 2026-07-28 |

Håll dessa två KORTA. Om du märker att du skriver in samma delmålsbeskrivning här som redan
finns i en `ETAPPLANx.md`, skriv en pekare istället för att kopiera – det var exakt dupliceringen
(fast åt andra hållet: gammalt innehåll som aldrig synkades) som gjorde dem stale förra gången.

> **`FRAMTIDSPLAN.md` bytte roll 2026-08-01, och skälet är värt att förstå innan någon skriver
> om den igen.** Den hade då blivit stale två gånger av samma orsak: den var en *pekare mot den
> aktiva planen*, och ingenting tvingar fram en uppdatering av en sådan pekare när planen byts
> (den pekade på `ETAPPLAN4.md` i elva releaser efter att `ETAPPLAN5.md` tagit över). Den är nu
> ett **arkiv över ej antagna alternativ** i stället – en roll som inte kan drifta isär från
> verkligheten på samma sätt. **Skriv aldrig tillbaka "här är den aktiva planen" i den filen.**
> Var den aktiva planen finns står i den här filens dokumentkarta ovan och i `CLAUDE_STATUS.md`
> – båda har händelsestyrda underhållsregler.

### Incidentdokument (LEVANDE – se den obligatoriska underhållsregeln nedan)

| Fil | Innehåll | Målgrupp |
|---|---|---|
| `avtal/INCIDENTRESPONSPLAN.md` | Policy: klassificering, roller, faser, tidskrav, patientsäkerhetsprincipen, kommunikation | **Extern** – delas med kund och vid upphandling |
| `INCIDENT-CHECKLISTA.md` | Operativ steg-för-steg-hantering, skriven för att följas under press | **Internt** – delas ALDRIG externt |

Dessa två är de enda dokumenten i projektet vars felaktighet kan få juridiska följder
(72-timmarsfristen i `avtal/PUB-AVTAL-MALL.md` p. 8). De hanteras därför strängare än
övrig dokumentation – se "Obligatorisk underhållsregel" under arbetsmönstren nedan.

### Referens-/regeldokument (ändras sällan, uppdatera bara vid en faktisk sakförändring)

| Fil | Innehåll |
|---|---|
| `SAKERHETSRAPPORT.md` | Säkerhetsgranskning av multi-tenant-lagret. |
| `TILLGANGLIGHETSREDOGORELSE.md` | WCAG-status per punkt (lagkrav för offentlig sektor). |
| `PITCH.md` | Säljmaterial/beslutsunderlag för verksamhetsledning. **Kontrollera versionsnumret i rubriken** vid större releaser (Etapp 22–25s "wow"-funktioner är t.ex. inte omnämnda ännu). |
| `avtal/PUB-AVTAL-MALL.md`, `avtal/UNDERBITRADEN.md`, `avtal/DPIA-UNDERLAG.md`, `avtal/IT-FAKTABLAD.md` | GDPR-/upphandlingsunderlag, se `ETAPPLAN3.md` Etapp 13a–13d. |

## Etablerade arbetsmönster (se `CLAUDE_STATUS.md` för den fullständiga, levande listan)

- **Releasechecklistan** (versionsbump, changelog, `ETAPPLANx.md`/`CLAUDE_STATUS.md`-
  uppdatering, testsvep, commit, deploy-trigger + effektiv polling) finns skriven ut steg för
  steg i skillen `.claude/skills/synappsen-release/SKILL.md` (2026-08-06) – läs den istället
  för att härleda ordningen på nytt varje gång. `CLAUDE.md` förblir sanningskällan för VARFÖR
  reglerna finns; skillen är bara en snabbreferens för HUR.
- **Deploy** görs alltid via GitHub Actions-workflowen `deploy.yml`
  (`mcp__github__actions_run_trigger`, `run_workflow`), aldrig manuellt. Trigger:as bara
  manuellt (`workflow_dispatch`) – push till branchen deployar INTE automatiskt.
- **Versionsbump vid varje release:** `package.json` (+ `package-lock.json`s två
  versionsfält) och en ny post överst i `src/data/andringslogg.js`. `src/version.js` ska
  INTE röras separat – den läser versionen direkt från `package.json`.
- **Fullt testsvep före commit:** `npm run lint`, `npm run build`, `npx vitest run`,
  `npm run test:rules`, `npm run test:functions`, `npm run test:storage`, `npm run test:e2e`
  (kräver `PLAYWRIGHT_CHROMIUM_PATH` lokalt i den här sandboxen, se `playwright.config.js`).
- **Git-gren:** allt arbete sker på `claude/compassionate-euler-rho0q5`. Skapa inte en PR om
  inte användaren explicit ber om det.
- **Genomgående krav 8 (premisskontroll):** verifiera en etapps antaganden mot FAKTISK kod
  innan bygget påbörjas – flera tidigare etapper visade sig bygga på antaganden som inte
  stämde. Se `ETAPPLAN3.md`/`ETAPPLAN4.md` för konkreta exempel.
- **Återkommande säkerhetsgenomgång vid varje STÖRRE release** (Etapp 36b, inte varje patch):
  en kort, fast checklista – (1) har en ny collection fått regeltester i
  `tests/rules/`? (2) har en ny uppladdningsväg storlek/innehållstypsbegränsningar i
  `storage.rules`? (3) läcker en ny loggpunkt personuppgifter eller dokumentinnehåll? (4) är
  `npm-audit-rapport.md`/Dependabot-PR:arna genomlästa, inte bara ihopmergade blint? (5)
  (Etapp 49c) har det gått lång tid (riktmärke: ~6 månader) sedan senaste faktiska
  återställningsövningen (`avtal/IT-FAKTABLAD.md` p. 6)? Om ja, flagga det som en punkt att
  boka in – en RTO-siffra som aldrig omprövas blir en gissning med tiden, i takt med att
  datamängden och koden förändras. Skriv in resultatet som ett
  `## Tillägg (datum, version): …`-block i `SAKERHETSRAPPORT.md` – samma händelsestyrda
  princip som underhållsregeln för incidentdokumenten nedan. Motiveringen är identisk:
  `SAKERHETSRAPPORT.md` låg själv 51 releaser efter verkligheten innan den skrevs om
  2026-08-01 (se filens egen läsanvisning högst upp).

### Obligatorisk underhållsregel: incidentdokumenten

`avtal/INCIDENTRESPONSPLAN.md` och `INCIDENT-CHECKLISTA.md` beskriver vilken
**detektions-, begränsnings- och återställningsförmåga som faktiskt finns**. Ett sådant
dokument som beskriver kapacitet som inte existerar är farligare än inget dokument alls: det
får en ensam operatör att i skarpt läge leta efter ett larm som aldrig kommer, eller lita på
en återställning som inte går att göra.

**Regeln är händelsestyrd, inte minnesstyrd.** "Kom ihåg att uppdatera" har bevisligen
misslyckats i det här projektet – `SAKERHETSRAPPORT.md` låg 46 releaser efter verkligheten,
`FRAMTIDSPLAN.md` 38 versioner. Uppdatera därför alltid **i samma commit** som ändringen, när
något av följande inträffar:

| Om du bygger/ändrar … | Uppdatera |
|---|---|
| Ny eller ändrad **detektion** (larm, felrapportering, loggning av en ny händelsetyp) | Checklistans tabell "Vad som ännu inte finns" + steg 1/4; policyns avsnitt 5.1 |
| Ny eller ändrad **begränsningsåtgärd** (utloggning, pausning, rolländring, strypning) | Checklistans steg 3-tabell (inkl. patientsäkerhetskolumnen); policyns avsnitt 5.2 |
| **Återställning/backup** (funktion, retention, uppmätt återställningstid) | Checklistans steg 8; policyns avsnitt 5.5; `avtal/IT-FAKTABLAD.md` |
| Ny **collection eller nytt fält med personuppgifter** | Checklistans steg 5 (rutan om vilka personuppgifter som finns); policyns avsnitt 2 |
| Ändrad **behörighetsmodell** (`firestore.rules`, roller, plattformsadmin) | Checklistans steg 4; policyns avsnitt 4 om kompenserande kontroller påverkas |
| Flyttad/ändrad **adminkontroll i UI** | Checklistans snabbreferens "Var saker finns" – annars leder den fel under press |
| Nytt **underbiträde eller extern integration** | Policyns avsnitt 1-tabell; `avtal/UNDERBITRADEN.md` |
| En **etapp i den aktiva planen blir klar** (`ETAPPLAN7.md`, eller en kvarvarande punkt i `ETAPPLAN6.md`/`ETAPPLAN5.md`) | Bocka av motsvarande rad i checklistans statustabell och policyns avsnitt 11 |

Ytterligare krav:

- **Bocka aldrig av en rad som ⬜ → ✅ utan att ha verifierat förmågan mot faktisk kod**
  (genomgående krav 8 gäller även här). Ett felaktigt ✅ är det värsta möjliga felet i de
  här två filerna.
- **Höj policyns versionsnummer och fyll i versionshistoriken** vid varje sakändring i
  `avtal/INCIDENTRESPONSPLAN.md`. Checklistan har ingen versionering men har en rad
  "Senast uppdaterad / Motsvarar kodläge" som ska stämma.
- **Lägg aldrig in driftdetaljer, sökvägar eller interna kontaktuppgifter i policyn** – den
  delas externt. Sådant hör hemma i checklistan.
- Om en ändring gör att en förmåga FÖRSVINNER eller försämras: uppdatera dokumenten i samma
  commit, även om det ser sämre ut. Ärlighet om lucka är hela poängen.

### Obligatorisk underhållsregel: CLAUDE_STATUS.md

`CLAUDE_STATUS.md` sa redan "uppdateras varje session" innan denna regel skrevs (2026-08-01)
– men det är exakt den sortens minnesstyrda instruktion som redan bevisligen misslyckats i
det här projektet flera gånger (`SAKERHETSRAPPORT.md` 46–51 releaser efter verkligheten,
`FRAMTIDSPLAN.md`/`MODULPLAN.md` 38–43 releaser, `src/version.js` 19 releaser,
`src/data/andringslogg.js` sex releaser) – filen låg själv ouppdaterad i tre dagar/två
releaser (v5.55.0 → v5.56.0) trots två pushade commits innan någon märkte det. Samma mönster,
samma fix: gör regeln händelsestyrd, inte minnesstyrd.

**Uppdatera `CLAUDE_STATUS.md` – i samma commit som ändringen, eller innan sessionen
avslutas om det blir flera commits – när något av följande inträffar:**

| Om du … | Uppdatera |
|---|---|
| Committar och pushar kod (oavsett storlek) | En rad om vad som hände, under rätt "Uppföljning"-sektion (eller en ny om ingen passande finns) |
| Tar ett ägarbeslut tillsammans med användaren | Vilket beslut, och om det låste upp något kodningsarbete (se mönstret i "Uppföljning 2026-08-01") |
| Avslutar en etapp i en `ETAPPLANx.md` | En kort notering + pekare till planfilen (inte detaljerna – de hör hemma där) |
| Deployar till produktion | Körningsnummer, commit-hash, version – samma format som redan används i filens toppstycke |
| Upptäcker att filen SJÄLV ligger efter (som denna gång) | Skriv in det ärligt, precis som för de andra filerna – dölj det inte |

Ytterligare krav:

- **Uppdatera alltid "Senast uppdaterad"-raden överst** i samma veva – det är den rad en ny
  session litar mest på för att avgöra om resten av filen är färsk.
- **Skriv en ny `## Uppföljning ÅÅÅÅ-MM-DD`-sektion snarare än att redigera in ändringar
  huller om buller i den historiska texten** – exakt samma varför-inte-slå-ihop-resonemang
  som gäller `ETAPPLANx.md`-filerna: det ska gå att se KRONOLOGISKT vad som hände när.
- **Håll den nya sektionen kort** – den ska peka mot detaljerna i `ETAPPLANx.md`/
  `UTVECKLINGSLOGG.md`/incidentdokumenten, inte duplicera dem (samma regel som för
  `FRAMTIDSPLAN.md`/`MODULPLAN.md` ovan).
- Om en session avslutas UTAN att ha committat något (bara diskussion/analys): ingen
  uppdatering krävs – regeln triggas av faktisk förändring, inte av tidsåtgång.

### Obligatorisk underhållsregel: OPPNA-PUNKTER.md

Skapad 2026-08-04 (Etapp 45d) för att lösa exakt det mönster en extern granskning pekade ut:
fem människo-/beslutsberoende punkter stod stilla i tre veckor medan ett tjugotal etapper
byggdes, utan att någon enda plats visade det samlat. Filen fyller bara sitt syfte om den
faktiskt hålls aktuell – annars blir den en sjätte stale fil i samma mönster som
`SAKERHETSRAPPORT.md`/`FRAMTIDSPLAN.md`/`MODULPLAN.md` en gång var. **Uppdatera i SAMMA
commit** när något av följande inträffar:

| Om du … | Uppdatera |
|---|---|
| Hittar eller skapar en ny punkt som är blockerad av en människa/ett beslut, inte av kapacitet | Lägg till en rad |
| Löser en punkt (ägaren beslutar, någon fyller i ett fält, ett fysiskt test genomförs) | Ta bort raden – den finns kvar i sin planfils historik |
| Upptäcker att en rad är inaktuell (redan löst utan att någon tog bort den, eller fel beskriven) | Rätta direkt, precis som för de andra levande dokumenten |

En rad som blir ett beslut (ägaren säger ja/nej med ett omprövningsvillkor) flyttas till
`BESLUTSLOGG.md` när den filen finns (se `ETAPPLAN9.md` 45f) – tas bort härifrån ändå, oavsett
om beslutsloggen redan är byggd.

### Obligatorisk underhållsregel: BESLUTSLOGG.md

Skapad 2026-08-04 (Etapp 45f) – byggs FRAMÅTRIKTAT, ingen retroaktiv genomgång av historiska
beslut (se `ETAPPLAN9.md` Beslut 3). **Uppdatera i SAMMA commit/session** när något av
följande inträffar:

| Om du … | Uppdatera |
|---|---|
| Tar ett ägarbeslut tillsammans med användaren (ja/nej/vänta, med eller utan omprövningsvillkor) | Lägg till en rad: datum, fråga, beslut, motivering, vad det påverkade/låste upp |
| Ser en rad i `OPPNA-PUNKTER.md` bli avgjord | Flytta raden hit, ta bort den därifrån |
| Upptäcker att ett tidigare loggat beslut omprövats eller ändrats | Lägg till en NY rad (ändra inte den gamla i efterhand) – samma kronologi-princip som `ETAPPLANx.md`-filerna |

Håll motiveringskolumnen kort – en mening, inte en sammanfattning av hela resonemanget (det
hör hemma i `CLAUDE_STATUS.md`s uppföljningssektion för den sessionen).

### Obligatorisk underhållsregel: PITCH.md

Skapad 2026-08-10 (Etapp 57b), efter fjärde–femte gången ett dokument i det här projektet
visat sig ligga efter koden (`SAKERHETSRAPPORT.md` 46–51 releaser, `FRAMTIDSPLAN.md`/
`MODULPLAN.md` 38–43, `src/version.js` 19, `CLAUDE_STATUS.md` två). Varje gång har lösningen
varit densamma och den har fungerat: gör regeln händelsestyrd, inte minnesstyrd.
`PITCH.md` hade fram till Etapp 57 bara en mjuk uppmaning ("kontrollera versionsnumret vid
större releaser") – exakt den sortens formulering som redan bevisligen inte håller.
**Uppdatera `PITCH.md` i SAMMA commit** när något av följande inträffar:

| Om du … | Uppdatera |
|---|---|
| Gör en kundvänd funktion synlig, tillgänglig eller väsentligt ändrad (ny etapp klar) | Lägg till/uppdatera raden i rätt avsnitt ("Vad ledningen får", "Byggd för vårdens krav" osv.) |
| Stänger av eller tar bort en funktion `PITCH.md` nämner | Ta bort eller skriv om påståendet – ett dokument som lovar något som inte längre finns är värre än att inte nämna det alls |
| Upptäcker att en lucka i "Vad som inte finns än"-stycket (57c) faktiskt byggts, eller att en ny lucka öppnats | Flytta raden till huvudtexten respektive lägg till den i stycket |
| Bumpear versionen vid en STÖRRE release (ny etapp, inte en ren bugfix) | Uppdatera versionsraden i rubriken |

Samma "aldrig lova mer än vad koden faktiskt gör"-princip som redan gäller
"Ärlighet om vad som faktiskt är mätt"-stycket lägre ner i dokumentet.
