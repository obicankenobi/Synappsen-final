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
2. **`ETAPPLAN5.md`** – den AKTIVA utvecklingsplanen (Etapp 32–36: säkerhet, upptäckt,
   incidentberedskap). Om användaren ber om fortsatt arbete utan att specificera vad: det är
   här nästa punkt finns.
3. Övriga dokument nedan, efter behov.

## Dokumentkarta

### Aktiva planer (uppdateras löpande, litar på dem)

| Fil | Innehåll | Status |
|---|---|---|
| `ETAPPLAN5.md` | Etapp 32–36: säkerhet, upptäckt, incidentberedskap | **Aktiv.** Inget påbörjat ännu. |
| `ETAPPLAN5-ALT-A.md` / `ETAPPLAN5-ALT-B.md` | Två utkast för vad som kommer EFTER säkerhetsbasen (sälj det byggda / förtjäna förtroendet) | **Utkast, ej antagna.** Ett av dem väljs när `ETAPPLAN5.md` är klar. |
| `CLAUDE_STATUS.md` | Kort handoff-sammanfattning | **Aktiv**, uppdatera varje session. |
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
| `FRAMTIDSPLAN.md` | Kort pekare mot vad som faktiskt är näst i tur (Etapp 26–30 + kända öppna punkter) | 2026-07-28 |
| `MODULPLAN.md` | Modul-/affärsplan: Core/Operations/Intelligence/Källbevakning, byggstatus, prissättning | 2026-07-28 |

Håll dessa två KORTA. Om du märker att du skriver in samma delmålsbeskrivning här som redan
finns i en `ETAPPLANx.md`, skriv en pekare istället för att kopiera – det var exakt dupliceringen
(fast åt andra hållet: gammalt innehåll som aldrig synkades) som gjorde dem stale förra gången.

### Referens-/regeldokument (ändras sällan, uppdatera bara vid en faktisk sakförändring)

| Fil | Innehåll |
|---|---|
| `SAKERHETSRAPPORT.md` | Säkerhetsgranskning av multi-tenant-lagret. |
| `TILLGANGLIGHETSREDOGORELSE.md` | WCAG-status per punkt (lagkrav för offentlig sektor). |
| `PITCH.md` | Säljmaterial/beslutsunderlag för verksamhetsledning. **Kontrollera versionsnumret i rubriken** vid större releaser (Etapp 22–25s "wow"-funktioner är t.ex. inte omnämnda ännu). |
| `avtal/PUB-AVTAL-MALL.md`, `avtal/UNDERBITRADEN.md`, `avtal/DPIA-UNDERLAG.md`, `avtal/IT-FAKTABLAD.md` | GDPR-/upphandlingsunderlag, se `ETAPPLAN3.md` Etapp 13a–13d. |

## Etablerade arbetsmönster (se `CLAUDE_STATUS.md` för den fullständiga, levande listan)

- **Deploy** görs alltid via GitHub Actions-workflowen `deploy.yml`
  (`mcp__github__actions_run_trigger`, `run_workflow`), aldrig manuellt. Trigger:as bara
  manuellt (`workflow_dispatch`) – push till branchen deployar INTE automatiskt.
- **Versionsbump vid varje release:** `package.json` (+ `package-lock.json`s två
  versionsfält) och en ny post överst i `src/data/andringslogg.js`. `src/version.js` ska
  INTE röras separat – den läser versionen direkt från `package.json`.
- **Fullt testsvep före commit:** `npm run lint`, `npm run build`, `npx vitest run`,
  `npm run test:rules`, `npm run test:functions`, `npm run test:storage`.
- **Git-gren:** allt arbete sker på `claude/compassionate-euler-rho0q5`. Skapa inte en PR om
  inte användaren explicit ber om det.
- **Genomgående krav 8 (premisskontroll):** verifiera en etapps antaganden mot FAKTISK kod
  innan bygget påbörjas – flera tidigare etapper visade sig bygga på antaganden som inte
  stämde. Se `ETAPPLAN3.md`/`ETAPPLAN4.md` för konkreta exempel.
