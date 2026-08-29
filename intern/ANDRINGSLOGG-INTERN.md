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

## Ej ännu byggt

`intern/ETAPPLAN-INTERN-1.md` (Etapp L1, leverantörspanelen) **antogs 2026-08-29** i sin
helhet (16 delmål, L1a–L1p; se `BESLUTSLOGG.md` samma datum). Ingen kod är ännu skriven –
första posten här skrivs när det första delmålet (L1m, kontomodellen) faktiskt byggts.

---

## Historik före den här filen

Leverantörsvyn byggdes ut i Etapp 67 (v5.108.0–v5.112.0) och fick en global frågebank i
Etapp 71 (v5.130.0). Det arbetet ligger kvar i den kundvända ändringsloggen och i
`etapplaner/ETAPPLAN16.md` respektive `CLAUDE_STATUS.md` – det skrivs medvetet **inte** om
retroaktivt. Se anmärkningen i L1l om varför den existerande överträdelsen ska stå kvar och
vara känd i stället för att städas bort.
