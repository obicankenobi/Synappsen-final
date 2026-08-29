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

## Ej ännu byggt

`intern/ETAPPLAN-INTERN-1.md` (Etapp L1, leverantörspanelen) **antogs 2026-08-29** i sin
helhet (16 delmål, L1a–L1p; se `BESLUTSLOGG.md` samma datum). Fyra av dem är klara (ovan).
Kvarstår: L1m (bygg näst, den flyttar åtkomstgränsen), L1a–L1g, L1i, L1j, L1n, L1p.

---

## Historik före den här filen

Leverantörsvyn byggdes ut i Etapp 67 (v5.108.0–v5.112.0) och fick en global frågebank i
Etapp 71 (v5.130.0). Det arbetet ligger kvar i den kundvända ändringsloggen och i
`etapplaner/ETAPPLAN16.md` respektive `CLAUDE_STATUS.md` – det skrivs medvetet **inte** om
retroaktivt. Se anmärkningen i L1l om varför den existerande överträdelsen ska stå kvar och
vara känd i stället för att städas bort.
