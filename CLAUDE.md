# Synappsen – projektöversikt för Claude Code

Digital kunskapsbank/rutindatabas för en akutmottagning. PWA byggd med React, Firebase
(Auth/Firestore/Storage/Cloud Functions) och Fuse.js. Multi-tenant (flera vårdorganisationer
i samma app, fullt isolerade). Se `README.md` för att komma igång lokalt.

Det här dokumentet är en **stabil karta** över projektets skriftliga dokumentation – vilken
fil som är auktoritativ för vad, och vilka som är historiska men fortfarande korrekta kontra
vilka som aktivt hålls uppdaterade. Det ändras sällan. För "var slutade vi och vad händer
härnäst" – läs `CLAUDE_STATUS.md` istället, som uppdateras varje session.

> **Bakgrund (2026-07-28):** den här filen skapades efter att `produkt/FRAMTIDSPLAN.md` och
> `produkt/MODULPLAN.md` upptäcktes vara stale sedan v5.7.0 respektive v5.10.0 (43 respektive 38
> releaser bakom faktisk kodstatus) medan appen redan var på v5.45.3 – ett tecken på att
> dokumentationen inte hade en tydlig, känd "vem uppdaterar vad, och vem är sanningskälla"-
> struktur. Båda är omskrivna. Se `etapplaner/STATUSARKIV.md`s "Uppföljning 2026-07-28"-sektion för
> hela historien, inklusive två andra fall av samma mönster (`src/version.js`,
> `src/data/andringslogg.js`).

## Läsordning för en ny session

1. **`CLAUDE_STATUS.md`** – läs FÖRST. Nuläge, gren, senaste arbete, vad som är nästa steg.
   Kort med flit (under 400 rader, bevakat av test). Historiken ligger i
   `etapplaner/STATUSARKIV.md`.
2. **`OPPNA-PUNKTER.md`** – läs ANDRA. Allt som väntar på en människa eller ett beslut, inte
   på kapacitet, samlat på ett ställe.
3. **`DOKUMENTREGISTER.md`** – slå upp här när du behöver veta vilka dokument som finns, om
   ett är levande eller historiskt, och vad som utlöser en uppdatering.
4. **Planfilen för det du ska bygga**, om någon är utpekad. Annars fråga ägaren.

**Läget just nu (2026-08-23):** ingen aktiv plan. Etapp 69 (`etapplaner/ETAPPLAN18.md`) var
den sista och är helt klar. `etapplaner/ETAPPLAN13.md` (Etapp 64, baspaketet) är antagen men
**juridiskt blockerad** – "antagen" betyder där INTE "byggbar av en kodsession", eftersom idén
rör MDR, upphovsrätt och varumärkesrätt och kräver en extern juridisk bedömning innan en enda
rad kod skrivs. Kvarvarande etapper som väntar på en extern förutsättning snarare än på
kapacitet: 54c/54d och Etapp 58 (SSO) i `etapplaner/ETAPPLAN11.md`, Etapp 52 i
`etapplaner/ETAPPLAN10.md`, Etapp 40 i `etapplaner/ETAPPLAN6.md`. Se `BESLUTSLOGG.md` för
vilka av dem som är avgjorda beslut och `OPPNA-PUNKTER.md` för vilka som är öppna.

## Dokumentkarta

**Fullständig inventering av alla 78 dokument finns i `DOKUMENTREGISTER.md`** – med typ
(levande/referens/mall/historisk), om dokumentet lämnas ut externt, och vad som utlöser en
uppdatering. Registret bevakas av `tests/docs/dokumentregister.test.js`, som failar om ett
dokument tillkommer, flyttas eller raderas utan att registret följer med. **Ett nytt dokument
kan alltså inte glömmas bort.**

Nedan står bara det som behöver finnas i huvudet på en session som är mitt i ett bygge: vilka
dokument som är LEVANDE och vad som utlöser dem. Allt annat slår du upp i registret.

### Levande dokument – uppdatera i SAMMA commit som ändringen

| Dokument | Utlöses av |
|---|---|
| `CLAUDE_STATUS.md` | Varje commit, ägarbeslut, avslutad etapp eller deploy. **Håll den under 400 rader** – testet failar annars, och då flyttas de äldsta uppföljningarna till `etapplaner/STATUSARKIV.md` |
| `OPPNA-PUNKTER.md` | En punkt blockerad av en människa/ett beslut tillkommer, löses eller visar sig inaktuell |
| `BESLUTSLOGG.md` | Ett ägarbeslut fattas. Ny rad – ändra aldrig en gammal |
| `etapplaner/UTVECKLINGSLOGG.md` | En utvecklingsfas avslutas |
| `avtal/UNDERBITRADEN.md` | Nytt/ändrat underbiträde, ny integration, ändrad region, funktion pausas eller återaktiveras |
| `avtal/INCIDENTRESPONSPLAN.md` + `drift/INCIDENT-CHECKLISTA.md` | Ändrad detektions-, begränsnings- eller återställningsförmåga; ny personuppgiftscollection; ändrad behörighetsmodell; flyttad adminkontroll i UI |
| `saljmaterial/PITCH.md` | Kundvänd funktion blir synlig, ändras eller tas bort |
| `granskningar/SAKERHETSRAPPORT.md` | Vid varje STÖRRE release – ny collection, ny uppladdningsväg, ny loggpunkt, genomläst npm-audit |
| `granskningar/TILLGANGLIGHETSREDOGORELSE.md` | En WCAG-brist åtgärdas eller upptäcks. Sammanfattningen måste stämma med tabellen |
| `produkt/MODULPLAN.md` | En funktion byggs som ändrar vad ett paket innehåller |
| `saljmaterial/kallfiler/*.html` (prislista, teknisk beskrivning, upphandlingssvar) | Pris/nivå ändras, arkitektur eller region ändras, eller ett statusberoende svar (A2, B4, B6, C3, C5, D1, E2) blir inaktuellt |

**De tre sista raderna och `avtal/`-filerna är de som faktiskt kostar pengar när de är fel** –
de lämnas till kund, dataskyddsombud och i anbud.

### Två regler som gäller alla dokument

1. **Uppdatera i samma commit som ändringen.** "Kom ihåg senare" har bevisligen misslyckats
   sex gånger i det här projektet (`granskningar/SAKERHETSRAPPORT.md` 46–51 releaser efter
   koden, `produkt/FRAMTIDSPLAN.md`/`produkt/MODULPLAN.md` 38–43, `src/version.js` 19,
   `CLAUDE_STATUS.md` två, `saljmaterial/PITCH.md` 48).
2. **Bocka aldrig av ⬜ → ✅ utan att ha verifierat mot faktisk kod** (genomgående krav 8).
   Ett felaktigt ✅ är det värsta möjliga felet i incidentdokumenten och i allt kundvänt.

### När du hittar ett felaktigt påstående i ett dokument

Rätta texten **och lägg till en assertion i `tests/docs/dokumentpastaenden.test.js` i samma
commit.** Den filen binder dokumentpåståenden till sin sanningskälla i koden – rollantal mot
`src/firebase/roles.js`, artikel 50-märkning mot förekomsten i `src/`, kundpåståenden mot att
det inte finns kunder. Sex verkliga fel från 2026-08-23 ligger redan där som assertioner.

Det är projektets enda mekanism som bevisligen håller: prosaregler har misslyckats sex gånger,
medan `src/version.js` (importerar versionen i stället för att upprepa den) och
`tests/docs/pitch-version.test.js` aldrig har glidit igen. **Skriv hellre en assertion än en
ny regel.**

> **Varför inte färskhetsstämplar per dokument?** Övervägt och förkastat 2026-08-23. En
> stämpel ("verifierad mot v5.128.0") är spelbar – när testet failar är det billigaste att
> bumpa stämpeln utan att läsa dokumentet, vilket gör synlig inaktualitet till dold. Den hade
> dessutom fångat 2 av de 6 verkliga felen; assertioner fångar 6 av 6 och kostar noll löpande
> ritual.

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
- **Git-gren:** **kontrollera alltid med `git branch --show-current` – anta ingen gren.**
  `claude/compassionate-euler-rho0q5` är repots **default-gren** och är aktuell (v5.97.0,
  commit `f6d289d` per 2026-08-11) – huvuddelen av arbetet har skett där. Men en session kan
  startas på en egen sessionsgren (2026-08-11 t.ex. `claude/synappsen-final-review-slzcxe`),
  och då är det den grenen som gäller. Anta därför aldrig grennamnet från den här raden –
  det är exakt det stale-mönster resten av dokumentet varnar för, fast i en instruktion.
  **Obs:** `.claude/skills/synappsen-release/SKILL.md` hårdkodar `claude/compassionate-euler-rho0q5`
  i både `git push` och deploy-workflowens `ref` – det är rätt när du står på default-grenen,
  men måste bytas mot den faktiska grenen om du står någon annanstans. Skapa inte en PR om
  inte användaren explicit ber om det.
- **Genomgående krav 8 (premisskontroll):** verifiera en etapps antaganden mot FAKTISK kod
  innan bygget påbörjas – flera tidigare etapper visade sig bygga på antaganden som inte
  stämde. Se `etapplaner/ETAPPLAN3.md`/`etapplaner/ETAPPLAN4.md` för konkreta exempel.
- **Återkommande säkerhetsgenomgång vid varje STÖRRE release** (Etapp 36b, inte varje patch):
  en kort, fast checklista – (1) har en ny collection fått regeltester i
  `tests/rules/`? (2) har en ny uppladdningsväg storlek/innehållstypsbegränsningar i
  `storage.rules`? (3) läcker en ny loggpunkt personuppgifter eller dokumentinnehåll? (4) är
  `npm-audit-rapport.md`/Dependabot-PR:arna genomlästa, inte bara ihopmergade blint? (5)
  (Etapp 49c) har det gått lång tid (riktmärke: ~6 månader) sedan senaste faktiska
  återställningsövningen (`avtal/IT-FAKTABLAD.md` p. 6)? Om ja, flagga det som en punkt att
  boka in – en RTO-siffra som aldrig omprövas blir en gissning med tiden, i takt med att
  datamängden och koden förändras. Skriv in resultatet som ett
  `## Tillägg (datum, version): …`-block i `granskningar/SAKERHETSRAPPORT.md` – samma händelsestyrda
  princip som underhållsregeln för incidentdokumenten nedan. Motiveringen är identisk:
  `granskningar/SAKERHETSRAPPORT.md` låg själv 51 releaser efter verkligheten innan den skrevs om
  2026-08-01 (se filens egen läsanvisning högst upp).

### Obligatorisk underhållsregel: incidentdokumenten

`avtal/INCIDENTRESPONSPLAN.md` och `drift/INCIDENT-CHECKLISTA.md` beskriver vilken
**detektions-, begränsnings- och återställningsförmåga som faktiskt finns**. Ett sådant
dokument som beskriver kapacitet som inte existerar är farligare än inget dokument alls: det
får en ensam operatör att i skarpt läge leta efter ett larm som aldrig kommer, eller lita på
en återställning som inte går att göra.

**Regeln är händelsestyrd, inte minnesstyrd.** "Kom ihåg att uppdatera" har bevisligen
misslyckats i det här projektet – `granskningar/SAKERHETSRAPPORT.md` låg 46 releaser efter verkligheten,
`produkt/FRAMTIDSPLAN.md` 38 versioner. Uppdatera därför alltid **i samma commit** som ändringen, när
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
| En **etapp i den aktiva planen blir klar** (`etapplaner/ETAPPLAN7.md`, eller en kvarvarande punkt i `etapplaner/ETAPPLAN6.md`/`etapplaner/ETAPPLAN5.md`) | Bocka av motsvarande rad i checklistans statustabell och policyns avsnitt 11 |

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

### Underhållsregler: de fyra registerdokumenten

Utlösarna står i tabellen under "Dokumentkarta" ovan och i `DOKUMENTREGISTER.md`. Detaljerna
som inte framgår där:

- **`CLAUDE_STATUS.md`:** uppdatera "Senast uppdaterad"-raden överst i samma veva – det är den
  rad en ny session litar mest på. Skriv en **ny** `## Uppföljning ÅÅÅÅ-MM-DD`-sektion i
  stället för att redigera in ändringar i befintlig text; det ska gå att se kronologiskt vad
  som hände när. Håll sektionen kort och peka mot detaljerna i planfilen eller
  `etapplaner/UTVECKLINGSLOGG.md`. Avslutas en session utan commit (bara diskussion) krävs
  ingen uppdatering – regeln utlöses av faktisk förändring, inte av tidsåtgång. **Filen får
  inte överstiga 400 rader** (bevakat av `tests/docs/dokumentregister.test.js`); när testet
  larmar flyttas de äldsta uppföljningarna sist i `etapplaner/STATUSARKIV.md`, så kronologin
  förblir obruten. Höj inte gränsen – det var så filen växte till 4 352 rader förra gången.
- **`OPPNA-PUNKTER.md`:** en löst punkt **tas bort** (den finns kvar i sin planfils historik),
  den markeras inte överstruken. En punkt som blir ett ägarbeslut flyttas till
  `BESLUTSLOGG.md` i stället.
- **`BESLUTSLOGG.md`:** byggs framåtriktat, ingen retroaktiv genomgång av historiska beslut.
  Ett omprövat beslut får en **ny** rad – ändra aldrig en gammal. Håll motiveringen till en
  mening; resonemanget hör hemma i `CLAUDE_STATUS.md`s uppföljningssektion.
- **`saljmaterial/PITCH.md`:** versionsrubriken bevakas av `tests/docs/pitch-version.test.js`
  och får glida högst 15 minorversioner. Höj aldrig den gränsen utan att samtidigt skriva om
  innehållet. Tas en funktion bort som `PITCH.md` nämner ska påståendet bort – ett dokument
  som lovar något som inte längre finns är värre än att inte nämna det alls.

