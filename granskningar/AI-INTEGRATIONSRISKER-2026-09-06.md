# AI-integrationens risker – genomgång av samtliga sex Gemini/Vertex-anropsställen

**Datum:** 2026-09-06, direkt efter att Vertex AI-migreringen deployats till produktion
(`deploy.yml` #98). **Beställd av:** ägaren, som en direkt fråga ("vilka risker finns det när
det kommer till hur vi integrerat/använder AI i Synappsen") – inte en del av den ordinarie
releasechecklistan.

**Omfattning:** en läsning av samtliga sex AI-anropsställen (`functions/ai-import.js`,
`functions/klinikstod.js`) och deras faktiska dataflöden – vad som skickas till Google, vad som
sker med resultatet, vad som lagras och hur länge – med fokus på personuppgifter, hallucination
och MDR-avgränsningen. **Ingen kod är ändrad i den här genomgången.** Fynden är tänkta att
åtgärdas ett i taget, med egen testtäckning, inte i ett svep – se prioritetsordningen längst ner.

Skiljer sig från `granskningar/SAKERHETSGRANSKNING-2026-08.md` (avslutad 2026-08-17, före
Vertex-migreringen och innan flera av AI-funktionerna fick sin nuvarande form) genom att vara
smalare (bara AI-anropsvägarna) men djupare på just dem, och genom att vara ett levande dokument
snarare än en avslutad fyrafasgranskning.

---

## Fynd 1 🚩 — Personuppgiftskontrollen körs EFTER överföringen till Vertex AI, inte före

**Allvarligast av fynden nedan, eftersom det är en dataöverföring som redan skett, inte en
lagring som går att städa upp i efterhand.**

I `tolkaDokument` (`functions/ai-import.js`) sker stegen i den här ordningen: bilden hämtas från
Storage → **skickas till Vertex AI** (`tolkaBildMedGemini`) → resultatet kontrolleras med
`innehallerPersonnummer()`. Spärren skyddar Firestore mot att *lagra* ett personnummer, men den
kan inte hindra att det redan *överförts* till ett underbiträde – bilden har redan lämnat appen
när kontrollen slår till.

Två saker gör räckvidden smalare än den ser ut:

- `innehallerPersonnummer()` (`functions/gemensamt.js`) är en Luhn-validerad kontroll av
  tolvsiffriga personnummer/samordningsnummer. Den känner inte igen namn, diagnoser,
  salsnummer, avdelningsnamn kopplade till en patient, eller födelsedatum i andra format.
- Klientens namnvarning (`kontrolleraPatientuppgifter` i `src/utils/piiFilter.js`,
  `hittaMisstankaNamn`) körs bara på **formulärtext** (rutinbeskrivningar, kommentarer,
  feedback). Bilduppladdningsflödet i `RutinFormular.jsx`/`ForradsbildUpload`-motsvarigheten
  saknar en sådan påminnelse helt, trots att en whiteboard eller anteckning är den plats där ett
  namn eller en diagnos rimligen kan förekomma.

**Mildrande omständigheter, inte en ursäkt för att lämna det:** avtalet
(`avtal/PUB-AVTAL-MALL.md` punkt 2) anger uttryckligen att endast verksamhetsinformation får
laddas upp, inte patientuppgifter – ansvaret ligger delvis hos användaren redan idag. Det finns
inga skarpa kunder ännu, så ingen verklig patientuppgift har (såvitt känt) skickats. Men skyddet
vilar just nu helt på användarens omdöme, inte på tekniken, och det är precis den sortens gap
`avtal/DPIA-UNDERLAG.md` ska svara på.

**Föreslagen åtgärd:** en klientsidig namn-/personnummervarning i bilduppladdningsflödet,
motsvarande `kontrolleraPatientuppgifter`, INNAN bilden laddas upp till Storage (inte bara innan
den skickas till Gemini – Storage-uppladdningen är i sig en lagring). Löser inte allt (ingen
OCR-fri detektion är heltäckande), men flyttar den enda existerande spärren till rätt sida av
överföringen.

---

## Fynd 2 — Uppladdade råfoton raderas aldrig

`inkommande/{uid}/{filnamn}` (Storage) städas bara vid avetablering av ett helt konto
(`avtalslivscykel.js`, rad ~956: `bucket.deleteFiles({ prefix: "inkommande/${uid}/" })`). Efter
en lyckad tolkning ligger originalfotot kvar permanent, och den sparade rutinens `bildUrl` pekar
för alltid på det. Det är i strid med lagringsminimeringsprincipen (GDPR art. 5.1.e) – det finns
inget legitimt syfte med att behålla ett råfoto efter att det tolkats och en människa godkänt
resultatet.

**Bieffekt, upptäckt i samma läsning:** `storage.rules` tillåter bara uppladdaren själv
(`request.auth.uid == uid`) att läsa `inkommande/{uid}/`. Andra i samma organisation som öppnar
en rutin med `kalla: "gemini"` kan alltså sannolikt inte se originalfotot bakom den – vilket
både är en funktionell brist (granskaren kan inte jämföra utkastet mot källan, se Fynd 6) och
ett tecken på att bilden inte behöver ligga kvar där den ligger.

**Föreslagen åtgärd:** radera Storage-objektet i `inkommande/` efter att tolkningen lyckats och
utkastet sparats (eller sätt en Cloud Storage-livscykelregel, t.ex. 24 timmar, som en enklare
första version). Löser retention-frågan och gör den trasiga länken irrelevant, snarare än att
patcha behörigheten till en bild som ändå inte ska finnas kvar.

---

## Fynd 3 — Klinikstöd-loggen och -cachen har ingen gallring

`klinikfrageloggar` (frågetext + organisationId, utan uid, sparad i `fragaKlinisktStod`) och
`klinikfragecache` (cachade svar, 7 dagars **läs**-TTL) har ingen faktisk radering. Cachens
"TTL" innebär bara att ett gammalt cachat svar ignoreras vid en ny fråga – dokumentet raderas
aldrig, och samlingen växer obegränsat.

Enskilda frågor innehåller sällan personuppgifter (`innehallerPersonnummer` stoppar redan de
tydligaste fallen, se Fynd 1:s begränsningar för resten). Men ett obegränsat växande arkiv över
vad personal frågar om, utan att någon fattat ett beslut om hur länge det behövs, är precis den
sorts data en DPIA ska ha en uttrycklig retention-siffra för.

**Föreslagen åtgärd:** ett schemalagt jobb (samma mönster som `backup-gallring.js` redan
använder för backuper) som raderar `klinikfrageloggar`-dokument äldre än t.ex. 90 dagar, och
faktiskt raderar (inte bara ignorerar) `klinikfragecache`-dokument äldre än sin egen TTL.

---

## Fynd 4 — MDR-avgränsningen är promptbaserad utan efterkontroll, och gäller bara klinikstödet

Klinikstödets sex regler mättes 2026-09-06 mot skarp Vertex AI i fyra körningar och höll i
samtliga fall (`granskningar/SAKERHETSRAPPORT.md`, tillägg 2026-09-06). Det är det starkaste
stället i hela integrationen. Två begränsningar kvarstår ändå:

1. **Skyddet är helt promptbaserat, utan en efterkontroll i produktion.** Utvärderingen körs
   manuellt, inte vid varje anrop. Bryter modellen mot regel 4 i ett skarpt användarsamtal (t.ex.
   efter en modelluppdatering hos Google, som redan flaggats som en risk i
   `granskningar/AVSETT-ANDAMAL-KLINIKSTOD-2026-08-30.md`) finns inget som stoppar svaret från
   att nå användaren i realtid.
2. **Bara klinikstödet är mätt.** `foreslaChecklistSteg` och `foreslaKvissfragor`
   (`functions/ai-import.js`) har liknande, om än enklare, promptregler ("Lägg ALDRIG till nya
   rekommendationer, doser, bedömningar") men täcks INTE av `ai-evaluering.yml` och har alltså
   aldrig testats mot ett faktiskt modellsvar.

Av de två oprövade funktionerna oroar kvissfrågorna mig mest, inte checklistestegen: en
kvissfråga presenteras med ett `rättIndex` – alltså som **facit** – och används för att
kvittera att en rutin är läst och *förstådd*. En hallucinerad dos i ett kvissfacit är kliniskt
farligare än ett klinikstödssvar, eftersom kvissen bär auktoritet i stället för att uppmana till
egen kontroll (klinikstödets regel 4 gör motsatsen uttryckligen). Checklistestegen ligger också
närmare skarp klinisk användning än en söksida ("körs ett steg i taget under ett akut
arbetsmoment", enligt sin egen promptbeskrivning) och bör därför också mätas, men bär inte
samma "detta är sant"-prägel som ett facit gör.

**Föreslagen åtgärd:** lägg till minst ett fall vardera för `foreslaKvissfragor` och
`foreslaChecklistSteg` i `functions/scripts/ai-evaluering.cjs` – samma mönster som klinikstödets
fall 2/3 (mata in en rutintext, kontrollera att inget svarsalternativ/steg innehåller en dos
eller rekommendation som INTE står i källtexten). Kräver en förändring av verktyget, inte av
produktionskoden.

---

## Fynd 5 — Artikel 50-märkningen täcker bara rutinens ursprung, inte kviss och steg

`rutin.kalla === "gemini"` ger badgen "AI-tolkat ursprung" i `RutinKort.jsx`, med en korrekt och
medvetet formulerad förklaringstext (se kommentaren där om AI-förordningen artikel 50).

Men AI-genererade kvissfrågor (`foreslaKvissfragor`) och checklistesteg
(`foreslaChecklistSteg`) skrivs rakt in i formulärets state (`setKviss(data.fragor)` i
`RutinFormular.jsx`) och sparas som vanligt innehåll utan någon markör om att de föreslogs av en
modell. En rutin som är helt handskriven men har en AI-genererad kviss bär ingen AI-märkning
någonstans i det färdiga innehållet.

**Föreslagen åtgärd:** ett litet `kallaKviss`/`kallaSteg`-fält (samma mönster som `rutin.kalla`)
satt när förslaget accepteras oförändrat, och en motsvarande badge där kvissen/checklistan visas.

---

## Fynd 6 — Bildtolkningens fält tas rakt av, granskaren kan inte alltid se originalet

`giltigtTill` valideras mot ett datumformat, vilket är bra. `titel`, `innehall`, `nyckelord` och
särskilt **`komIhagFlaggor`** tas emot orört från modellen. Det sista fältet renderas som
kritiska kom-ihåg-punkter i gränssnittet – en hallucinerad varning ser identisk ut mot en äkta.

Skyddet som finns är genuint: allt AI-tolkat innehåll blir `status: "utkast"` och kräver ett
mänskligt godkännande innan det publiceras (samma mönster i hela appen). Men det skyddet
förutsätter att granskaren kan jämföra utkastet mot originalfotot – och enligt Fynd 2:s bieffekt
kan andra än uppladdaren för närvarande inte nödvändigtvis se det fotot.

**Föreslagen åtgärd:** ingen separat kodändring utöver Fynd 2 – när originalbilden är läsbar för
rätt personer (granskaren, inte bara uppladdaren, under den korta tid bilden behöver finnas
kvar) är den befintliga utkastsgranskningen ett fungerande skydd.

---

## Fynd 7 — Ingen logg över vad som faktiskt skickats till Google

Det finns ingen loggpunkt som sparar VILKEN prompt eller bild som skickades till Vertex AI för
ett givet anrop (bortsett från den generella Sentry-felrapporteringen, som bara fångar fel, inte
lyckade anrop). Skulle frågan någonsin ställas – "skickades en patientuppgift till Google den
12 mars, och i så fall vilken?" – går den inte att besvara i efterhand.

`avtal/INCIDENTRESPONSPLAN.md` avsnitt 5.1 bygger på en detektionsförmåga som här saknas: en
läckt personuppgift via AI-vägen skulle upptäckas genom att någon råkar se den i efterhand
(t.ex. i en sparad rutin), inte genom ett larm.

**Föreslagen åtgärd:** en minimal loggpost per AI-anrop (organisationId, uid, funktionsnamn,
tidsstämpel – INTE prompttexten eller bilden själv, det vore att duplicera exakt den risk som
ska undvikas) i en ny, kort TTL-collection. Räcker för att svara "vilka anrop gjordes", inte
"vad innehöll de".

---

## Fynd 8 — Budget dras även när Vertex AI-anropet misslyckas

`reserveraBudget()` (`functions/gemensamt.js`) körs FÖRE själva modellanropet och återbetalas
inte om anropet sedan kastar ett fel (t.ex. ett 503 som inte löses av det inbyggda
återförsöket). Ett utbrott av fel hos Google kan därför förbruka en organisations månadsbudget
utan att organisationen fått ett enda användbart svar.

Lägre allvarlighetsgrad än fynd 1–3 (ren kostnadsfråga, ingen personuppgifts- eller
patientsäkerhetsrisk), men värt att åtgärda i samma veva som något av ovanstående rör samma
filer.

**Föreslagen åtgärd:** återbetala den reserverade budgeten vid ett misslyckat anrop (efter att
båda försöken i den befintliga 503-retryn uttömts), symmetriskt med hur reservationen görs.

---

## Vad som redan är starkt – för att inte fynden ovan ska läsas som att integrationen är svag

- **EU-databehandling** är nu på plats (Vertex AI, `europe-west1`), verifierad genom faktiska
  anrop, inte bara konfiguration.
- **Ingen fristående API-nyckel** längre – tjänstekontobehörighet (ADC) i stället.
- **Budgettak** finns både per organisation och per användare (`MAX_PER_ANVANDARE_ORE`),
  oberoende av fynd 8 ovan.
- **Klinikstödets källbegränsning** har två oberoende lager (sökmotorns egen konfiguration +
  `domanGodkand()`-kontrollen i kod).
- **Allt AI-genererat rutininnehåll blir ett utkast** som kräver mänskligt godkännande innan
  publicering – den enskilt viktigaste spärren i hela kedjan.
- **Promptinjektionens strukturella väg är stängd** (`harPromptbrytandeTecken`,
  `saneraPromptblock`, 2026-09-06).
- **Klinikstödets säkerhetsregler är mätta, inte antagna** – fyra skarpa körningar,
  `granskningar/SAKERHETSRAPPORT.md` tillägg 2026-09-06.

---

## Prioritetsordning för åtgärder

Rangordnad efter hur mycket verklig risk varje åtgärd faktiskt flyttar, inte efter hur lätt den
är att göra:

1. **Fynd 1** – flytta/komplettera personuppgiftskontrollen till INNAN överföring, lägg en
   namnvarning i bilduppladdningsflödet.
2. **Fynd 2** – radera råfoton efter lyckad tolkning (löser även bieffekten i Fynd 6).
3. **Fynd 4** – utöka `ai-evaluering.yml` med fall för kviss- och stegförslagen.
4. **Fynd 5** – artikel 50-märkning för AI-genererad kviss/steg.
5. **Fynd 3** – gallring av `klinikfrageloggar`/`klinikfragecache`.
6. **Fynd 7** – minimal anropslogg (utan innehåll).
7. **Fynd 8** – återbetala budget vid misslyckat anrop.

**Varje åtgärd ska göras för sig, med ett eget regressionstest som bevisligen failar mot koden
före ändringen** – samma disciplin som `granskningar/SAKERHETSGRANSKNING-2026-08.md` etablerade.
Se `OPPNA-PUNKTER.md` för statusspårning av var och en.

## Källor

Egen läsning 2026-09-06 av `functions/ai-import.js`, `functions/klinikstod.js`,
`functions/gemensamt.js`, `functions/avtalslivscykel.js`, `storage.rules`, `firestore.rules`,
`src/utils/piiFilter.js`, `src/components/RutinFormular.jsx`, `src/components/RutinKort.jsx`.
Ägarens fråga ställd direkt efter att Vertex AI-migreringen deployats och verifierats
(`granskningar/SAKERHETSRAPPORT.md` tillägg 2026-09-06).
