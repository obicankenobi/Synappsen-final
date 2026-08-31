# Avsett ändamål – Klinikstöd-sökningen

**Internt · 2026-08-30 · Etapp 72, undantag 1** (`etapplaner/ETAPPLAN19.md`, beslutspunkt 5).

> Detta är inte juridisk rådgivning. Dokumentet formulerar funktionens avsedda ändamål så som
> MDR artikel 2.12 kräver att det formuleras – i marknadsföring, gränssnitt och dokumentation
> samtidigt – men klassificeringen kräver produktspecifik juridisk bedömning.

## Varför det här dokumentet finns

`granskningar/GRANSKNING-IDEBANK-2026-08-30.md` avsnitt 3.1 är dess viktigaste fynd:
MDCG 2019-11 Rev.1 undantar **inte** en NLP-sökning som bidrar till ett medicinskt syfte från
MDR, trots att "simple search" i övrigt är undantaget. Klinikstöd-sökningen använder en
språkmodell för att sammanfatta träffar ur medicinska källor åt vårdpersonal.

Slutsatsen ändras sannolikt inte – funktionen ligger rimligen fortfarande utanför MDR – men
**skälet gör det**. Skyddet är inte att sökning är undantagen. Skyddet är att funktionen är
beskriven, avgränsad och marknadsförd som hjälp att hitta i dokument, inte som stöd för ett
kliniskt beslut om en patient. Den distinktionen måste hållas i kod, i gränssnittstext och i
säljmaterial samtidigt (MDR art. 2.12: avsett ändamål omfattar "on the label, in the
instructions for use or in promotional or sales materials or statements").

Det här dokumentet är den skriftliga referensen. En framtida ändring av funktionens gränssnitt,
prompt eller säljtext ska stämmas av mot den här texten, inte mot minnet.

---

## Det avsedda ändamålet

**Klinikstöd-sökningen hjälper vårdpersonal att hitta och sammanfatta redan existerande
information ur ett fast urval godkända medicinska referenskällor och organisationens egna
rutiner, för att spara tid vid informationssökning i en klinisk vardag.**

Den ersätter inte, och ska aldrig beskrivas som att den ersätter, personalens egen kliniska
bedömning.

### Vad funktionen faktiskt gör (`functions/klinikstod.js`)

1. Söker via en domänbegränsad Google Programmable Search Engine, begränsad till sju namngivna
   källor: internetmedicin.se, 1177.se, Nationella kliniska kunskapsstödet, FASS,
   Läkemedelsverket, Vårdhandboken, Folkhälsomyndigheten (`GODKANDA_KALLDOMANER`).
2. Filtrerar träffar mot samma domänlista en andra gång server-side – ett extra skyddslager
   om sökmotorns egen konfiguration någonsin ändras av misstag.
3. Skickar bara de faktiska sökträffarnas utdrag till Gemini, med en instruktion att svara
   **enbart** utifrån dem – aldrig ur modellens eget minne.
4. Varje påstående i svaret hänvisar till vilken källa ([1], [2] …) det kommer från.
5. Avvisar frågor som verkar handla om en namngiven eller identifierbar person (prompt-regel 6).

### Vad funktionen INTE gör, och aldrig ska göra

- Den rangordnar, poängsätter eller prioriterar aldrig svar eller behandlingsalternativ.
  MDCG:s exempellista på klassificerande funktioner tar uttryckligen upp riskpoäng,
  rangordnade behandlingsförslag och prioritetsflaggor.
- Den ger aldrig en rekommendation eller ett beslut – bara en sammanfattning av vad källorna
  säger, med källan angiven.
- Den svarar aldrig på en fråga om en specifik, identifierbar patient.
- Den lagrar aldrig ett svar kopplat till en patient – frågeloggen (`klinikfrageloggar`)
  sparar frågan utan användar-id, i syfte att visa vilka kunskapsluckor som finns, inte vem
  som frågade.

### Rättelse gjord i samma commit som detta dokument

`functions/klinikstod.js`s prompt till Gemini innehöll tidigare regeln *"Detta är beslutsstöd,
inte en diagnos"*. Ordet **beslutsstöd** i systemets egen instruktion var en självmotsägelse
mot avgränsningen ovan – och en konkret risk, inte bara en teoretisk: om modellen ekade ordet
tillbaka i sitt svar till användaren hade gränssnittet självt sagt något annat än det avsedda
ändamålet. Regeln lyder nu: *"Detta är ett hjälpmedel för att HITTA och SAMMANFATTA information
ur källorna – aldrig ett beslutsstöd, en rekommendation eller en diagnos. Ge aldrig ett
prioriterat eller rangordnat svar."*

---

## Gränsen i ord – vad som får respektive inte får sägas

Samma tabell som i `etapplaner/ETAPPLAN19.md` genomgående krav 40, upprepad här eftersom det
är den här funktionen den skrevs för:

| Formulering | Effekt |
|---|---|
| "Hjälper personalen hitta och sammanfatta era egna rutiner och godkända källor snabbare" | Stannar utanför MDR |
| "Ger personalen kliniskt stöd i beslutssituationen" | Kan dra in funktionen i MDSW (medical device software) |

**Ord att aldrig använda om klinikstöd-sökningen:** beslutsstöd, kliniskt stöd i ett beslut,
rekommendation, bedömning, diagnos. Utöver `produkt/VARUMARKE.md`s befintliga förbud mot
AI-driven/intelligent/smart (s. 319) läggs den här raden till som en regulatorisk, inte bara
positioneringsmässig, gräns.

**Ett ordval värt att se över, inte ändrat i den här omgången eftersom det är produktcopy och
inte kod:** `src/pages/KlinisktStod.jsx` beskriver sidan som *"Handläggningsrutiner,
triageringsstöd och kritiska kom-ihåg-saker"*. Ordet "triageringsstöd" ligger närmare
"beslutsstöd" än vad ändamålet ovan medger. `src/components/KlinikfragaSok.jsx`s
exempelplaceholder ("T.ex. Dosering amoxicillin vuxen") är ett gränsfall åt samma håll – det är
inte patientspecifik interaktionskontroll (C-329/16), men det liknar den typen av fråga mer än
"hitta vår rutin om X". Båda bör granskas mot den här texten vid nästa tillfälle
produktcopy för klinikstöd redigeras, men ändras inte här – det är ett medvetet avgränsat
delmål (dokumentation + en kodrättelse som direkt motsade ändamålet), inte en omtextning av
gränssnittet.

---

## Vad som fortfarande inte är verifierat mot primärkälla

Enligt `etapplaner/ETAPPLAN19.md`s egen disciplin ("Ingen rad får citeras i kundvänt material
innan den är verifierad"):

- Att slutsatsen "funktionen ligger utanför MDR" faktiskt håller för just den här produkten,
  specifikt bedömd – inte bara att avgränsningen är rätt utformad. Kräver en produktspecifik
  MDR-bedömning, samma slags arbete som `granskningar/MDR-BEDOMNING-OVNINGSFRAGOR-2026-08.md`
  redan gjort för kvissbanken.
- Om `src/pages/KlinisktStod.jsx`s och `src/components/KlinikfragaSok.jsx`s nuvarande copy
  behöver ändras, eller om den håller sig innanför gränsen ovan – kräver en läsning av texten
  mot den här produktspecifika bedömningen, inte en allmän tolkning.

**Rekommenderas:** ta med den här frågan i samma externa juridiska uppdrag som Etapp 64
(`etapplaner/ETAPPLAN13.md`) redan väntar på.

---

## Källor

Se `granskningar/GRANSKNING-IDEBANK-2026-08-30.md` avsnitt 3.1–3.2 och avsnitt 9 för de
verifierade primärkällorna (MDCG 2019-11 Rev.1, MDR artikel 2.12, kommissionens Borderline
Manual v5).
