# Intern ändringslogg

**Leverantörens egen logg över internt arbete.** Motsvarigheten till
`src/data/andringslogg.js`, men för sådant kunden varken ser eller berörs av:
leverantörspanelen, driftverktyg, plattformsadministration.

> **Varför den är en markdownfil och inte data i `src/`.**
> `src/data/andringslogg.js` importeras av `/nyheter` och hamnar därmed i klientbundlen –
> varje kund kan läsa den. Den här filen importeras aldrig av `src/` och når därför aldrig en
> webbläsare. Separationen är strukturell, inte en överenskommelse.
>
> Se genomgående krav 36 i `intern/ETAPPLAN-INTERN-1.md`: intern utveckling får aldrig hamna
> i den kundvända ändringsloggen. Ett test ska bevaka det (delmål L1l) i stället för en
> påminnelse.

**Format:** nyast först. Ange etapp (L-nummer) och vad som faktiskt ändrades. Till skillnad
från kundens ändringslogg får den här vara teknisk – läsaren är leverantören själv.

---

## v5.133.0 (2026-08-29) – de fyra "Liten"-delmålen: L1l, L1h, L1k (delvis), L1o

Byggda i den ordning ägaren begärde, direkt efter att Etapp L1 antogs samma dag. Detaljerna
(vad som byggdes, testat, avgränsat) står i `intern/ETAPPLAN-INTERN-1.md` under respektive
delmål – den här raden är bara en pekare, inte en dubblett.

- **L1l** – separationen mekanisk i stället för en vana: ett test
  (`tests/docs/andringslogg-leverantorsseparation.test.js`) som failar om en framtida post i
  `src/data/andringslogg.js` nämner leverantörsfunktioner.
- **L1h** – onboarding-pipeline (`PipelineSektion.jsx`), grupperar organisationer på
  avtalsstatus med ålder i steget. Ingen ny datakälla.
- **L1k** – `antalAnvandare`-räknare på organisationsdokumentet, underhållen av
  `losInInbjudan`/`raderaAnvandare`, med lativ backfill i `listaOrganisationer`. Ett verkligt
  fel (felaktig absolut siffra från ett blint `increment` på ett oinitierat fält) hittades och
  fixades under bygget. Kostnadshistorik-axeln lämnades medvetet orörd.
- **L1o** – åtagandekalendern (`atagandekalender/{id}`): fyra återkommande skyldigheter
  (nyckelrotation, RTO-mätning, incidentresponsplan- och tillgänglighetsöversyn) som en ny
  signaltyp, sammanslagen med organisationssignalerna i samma "kräver åtgärd"-lista.
  `rto-matning.cjs` kvitterar sin egen post automatiskt efter en lyckad mätning.

37 nya tester (vitest, regeltester, funktionstester). Fullt testsvep grönt: lint, build,
`npx vitest run` (517 tester), `npm run test:rules`, `npm run test:functions`.

Ingen kundpåverkan – ingen rad i `src/data/andringslogg.js`, precis det L1l:s eget test
bevakar.

---

## v5.134.0 (2026-08-29) – de sex "Medel"-delmålen: L1m, L1a, L1g, L1i, L1n, L1p

Byggda i samma session direkt efter de fyra "Liten"-delmålen ovan. Detaljerna står i
`intern/ETAPPLAN-INTERN-1.md` under respektive delmål.

- **L1m** – leverantörskontot. `skapaLeverantorskonto`/`flyttaTillPlattformskonto`
  (Cloud Functions), `organisationId: "_plattform"`, `LeverantorLayout.jsx` utan
  `BottomNav`/`Sidomeny`. Isoleringen bevisad skarpt mot Firestore-regler – inklusive den
  faktiska fällan (fallback till organisationen `"default"` när ett fält saknas).
- **L1a** – navigationsträdet: sju portföljrutter + kundläge med fem flikar bakom
  `KundLayout`. Kundlägets flikar delar en gemensam platshållare tills L1b finns.
  `OrganisationsRad.jsx`s inline-expansion rörd INTE, exakt som planen kräver.
- **L1g** – leverantörens egen åtgärdslogg, tvärs kunder. Filtret måste vara BÅDA
  `aktorUid` och `aktorRoll == "plattformsadmin"` – annars läcker leverantörens vardagliga
  egenanvändning av sin (idag fortfarande dubbla) roll in i loggen.
- **L1i** – ekonomisk överblick. `limit(1)` → `limit(2)` på en redan existerande fråga i
  `listaOrganisationer`, noll nya läsningar, ger en enkel kostnadstrend.
- **L1n** – återställning och beredskap. `listaBackuper` (ny), `AterstallningSektion.jsx`
  med tvåstegsbekräftelse. Premissrättelse: "Ta backup nu" är samma anrop som den REDAN
  BEFINTLIGA "Exportera"-knappen, inte ny kod. `IncidentberedskapSektion.jsx` i kundens
  adminpanel togs medvetet INTE bort – den är en fungerande självbetjäningsfunktion för en
  riktig kund, oberoende av plattformsadmin-status.
- **L1p** – avtal och åtaganden per kund. Den HÅRDA PUB-avtalsspärren i `satAvtalsstatus`
  (samma mönster som Brevo-spärren) är delmålets kärna. Plus incidentklockan (24h NIS2 /
  72h ordinarie, `incidenter/{id}`), underrättelseregister, åtagandeblock,
  referensunderlags-begäran.

77 nya tester totalt (18 vitest, 16 regeltester, 43 funktionstester) sedan v5.133.0. Fullt testsvep
grönt: lint, build, `npx vitest run` (535 tester), `npm run test:rules` (alla filer),
`npm run test:functions` (alla 40 filer).

Ingen kundpåverkan – ingen rad i `src/data/andringslogg.js`.

**Ett självrättat misstag under bygget:** ett `Write`-anrop skrev av misstag över
`src/firebase/functions.js` med en enda platshållarrad, i stället för att läsa filen. Upptäckt
omedelbart via `git status`/`git diff --stat`; återställd från `git show HEAD:...` och alla
sessionens tillägg återapplicerade för hand, verifierat med `eslint`/`npm run build` innan
arbetet fortsatte. Ingen förlorad kod, men noterat här eftersom det är exakt den typ av
incident `CLAUDE.md`s säkerhetsprotokoll (granska innan destruktiva/skrivande verktyg) finns
för att förebygga – `Write` på en befintlig, redan lästs fil är i sig en risk att hålla koll på.

---

## v5.135.0 (2026-08-29) – L1b: kunddossién

Planens enskilt största arbetsbesparing, byggd i samma session direkt efter de sex
"Medel"-delmålen ovan. Detaljerna står i `intern/ETAPPLAN-INTERN-1.md` under L1b.

- **Bugfix funnen vid premisskontroll:** `listaOrganisationer` returnerade aldrig åtta fält
  (`orgnr`, `kontaktperson`, `anvandartak`, `pubAvtalTecknat`, `pubAvtalVersion`,
  `underbitradeUnderrattad`, `omfattasAvNIS2`, `atagandeblock`) som `AvtalOchAtagandeSektion.jsx`
  (L1p) redan berodde på – panelen hade visat "ej tecknat"/tomt sedan den byggdes, oavsett
  verkligt Firestore-läge. Fixad, med ett regressionstest som bevisar det.
- Fem riktiga sidor ersatte den delade platshållaren från v5.134.0: Huvud+Kontakt+Hälsa-
  platshållare (`KundOversikt.jsx`), Användning (`KundAnvandning.jsx`), Avtal & ekonomi
  (`KundEkonomi.jsx`, återanvänder L1i:s `beraknaEkonomiOversikt` och flyttar in L1p:s
  `AvtalOchAtagandeSektion`), Historik (`KundHistorikSektion.jsx`, ny callable
  `hamtaKundensLeverantorshistorik`), Åtgärder (`KundAtgarderSektion.jsx`, återanvänder nio
  befintliga klientfunktioner, ingen ny backend).
- `OrganisationsRad.jsx`s dubblerade "Avtal & åtaganden"-panel (en provisorisk lösning från
  L1p, innan dossién fanns) togs bort till förmån för en länk till dossién.
- Medvetet obyggt: Hälsa (kräver L1c + beslutspunkt 1), "senaste aktivitet" (kräver L1j +
  beslutspunkt 2), "vem är superadmin"/"senast bjöd in" (ingen läsväg till `users/{uid}` utan
  att öppna en ny läsväg mot kundinnehåll, krav 37 – inget L1b bad om).

7 nya funktionstester. Fullt testsvep grönt: lint, build, `npx vitest run` (535 tester,
oförändrat – inga nya vitest-filer), `npm run test:rules`, `npm run test:functions`.

Ingen kundpåverkan – ingen rad i `src/data/andringslogg.js`. Inte deployat än.

---

## Ej ännu byggt

`intern/ETAPPLAN-INTERN-1.md` (Etapp L1, leverantörspanelen) **antogs 2026-08-29** i sin
helhet (16 delmål, L1a–L1p; se `BESLUTSLOGG.md` samma datum). **11 av 16 klara** (ovan).
Kvarstår: L1e (stor, inget hinder att börja), L1f (stor, väntar på beslutspunkt 4),
L1c/L1d/L1j (väntar på beslutspunkt 1/3/2).

---

## Historik före den här filen

Leverantörsvyn byggdes ut i Etapp 67 (v5.108.0–v5.112.0) och fick en global frågebank i
Etapp 71 (v5.130.0). Det arbetet ligger kvar i den kundvända ändringsloggen och i
`etapplaner/ETAPPLAN16.md` respektive `CLAUDE_STATUS.md` – det skrivs medvetet **inte** om
retroaktivt. Se anmärkningen i L1l om varför den existerande överträdelsen ska stå kvar och
vara känd i stället för att städas bort.
