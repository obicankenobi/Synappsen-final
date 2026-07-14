# Synappsen – plan för fortsatt utveckling

*Upprättad 2026-07-14 · utgår från version 5.7.0*

## Närmast (nästa release, ~5.8.0) – pausade småpunkter från Fas 14

Redan specificerade, små och lågrisk:

1. **"Var detta hjälpsamt?"-knapp** på klinikstöd-svar – mät funktionens faktiska nytta.
2. **Beroende-statustest i adminpanelen** – knapp som pingar Gemini/sökmotorn/Storage och
   visar grönt/rött, så en trasig nyckel upptäcks av admin och inte av personalen.
3. **Markdown-förhandsvisning** i rutinredigeraren.
4. **"Senast besökta rutiner"** på startsidan (lokalt lagrat, ingen backend-ändring).
5. **Skelettladdning** istället för "Laddar..."-texter.

## Kort sikt (1–2 releaser därefter)

6. **Ägare per rutin** – granskningspåminnelser riktas till en ansvarig person istället
   för alla redaktörer i området.
7. **Schemalagd Firestore-backup** – veckovis JSON-dump till Storage; skyddar mot
   massfel som papperskorgen inte täcker.
8. **Dödlänk-kontroll** – månadsvis HEAD-ping av länkbiblioteket, 404:or flaggas i admin.
9. **Riktig offline-åtkomst** – "ladda ner hela kunskapsbasen"-knapp (IndexedDB) så ALLA
   rutiner är läsbara vid totalt nätavbrott. *Högst verksamhetsvärde i denna grupp.*

## Medellång sikt (kräver beslut/förarbete från verksamheten)

10. **Tvinga 2FA för redaktörsroller** – policybeslut behövs innan aktivering.
11. **Export av kunskapsbasen som PDF-pärm** – fysisk reservrutin vid IT-avbrott
    (nedprioriterad av beställaren tidigare, kvarstår som kandidat).
12. **Kiosk-/snabbläge för delade surfplattor** (samma status som ovan).
13. **Pilotutvärdering enligt PITCH.md** – mätning av tid-att-hitta, kvitteringsgrad och
    upplevd nytta styr vilka av punkterna ovan som prioriteras upp.

## Stående underhåll (varje release)

- Säkerhets-/beroendegenomgång vid större ändringar (mönster från Fas 11).
- Håll `GODKANDA_KALLDOMANER` i kod och sökmotorns domänlista synkade vid ändringar.
- Bevaka Custom Search-kvoten (100 gratis/dag) och Gemini-budgeten i adminpanelen när
  användningen växer; höj tak eller utöka cachen vid behov.
- Enhetstesterna byggs ut i takt med att säkerhetskritisk logik tillkommer.

## Kända öppna punkter (dokumenterade, ej planerade)

- Kvitteringsfrist finns bara på anslag, inte rutiner (medvetet – rutiner har eget
  granskningsdatum).
- Regelbaserade personnummerfiltret saknar Luhn-validering (tekniskt omöjligt i
  Firestore-regler; fullt filter finns i klient + Cloud Functions).
- Klinikstöd-sökningen är ännu inte livetestad efter ombyggnaden till domänbegränsad
  sökmotor – **första åtgärd efter nästa deploy: verifiera i skarp miljö.**
