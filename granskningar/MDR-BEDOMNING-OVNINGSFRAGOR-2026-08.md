# MDR-bedömning: leverantörskurerade övningsfrågor i Öva-läget

**Datum:** 2026-08-27
**Kodläge vid bedömningen:** v5.129.0, commit `4815c68`
**Frågeställare:** ägaren
**Status:** intern arbetsbedömning. **Ersätter inte extern juridisk rådgivning** – se § 9.

---

## Läsanvisning

Det här dokumentet besvarar EN avgränsad fråga, ställd 2026-08-27:

> Passerar det MDR-gränsen att lägga in generella faktafrågor om sjukdomar, skador och
> liknande i Öva-läget, om frågorna varken är kopplade till en specifik patient eller till en
> kunds egen rutin, och om användarens enda input är att markera ett svarsalternativ?

Bakgrunden är att `src/data/kvissbank.js` sedan Etapp 65d bär en kommentar som slår fast att
sådana frågor **inte** får förekomma, med MDR som skäl. Ägaren ifrågasatte den slutsatsen.
Genomgången nedan visar att **kommentaren är för hårt dragen** och bör rättas, men också att
det finns tre andra risker som är verkliga och som den nuvarande formuleringen råkar skydda
mot av fel skäl.

Dokumentet är **inte** en generell MDR-analys av Synappsen. Den finns i
`granskningar/JURIDISK-GRANSKNING.md` § 6, som fortsatt gäller. Det här är ett tillägg som
går djupare på en punkt den inte behandlar.

---

## 1. Vad som ska bedömas

Öva-läget (`src/pages/OvaLage.jsx`, Etapp 65d, utökat 2026-08-27 med ett bank-spår i commit
`d8b9106`) fungerar så här i den version bedömningen avser:

| Egenskap | Faktiskt läge i koden |
|---|---|
| Vem startar | Användaren själv, från en egen flik. Inte bundet till en kvittering eller ett moment |
| Input från användaren | Ett klick på ett av 3–4 svarsalternativ. Ingen fritext, inga siffror, inga patientdata |
| Output | "Rätt"/"Fel" plus en förklarande hänvisningstext. Inget annat |
| Patientdata | Förekommer inte. Ingen inmatningsyta finns |
| Lagring av svar | Ingen. Krav 14, verifierat: varken `KvissModal.jsx`, `VeckansRepetition.jsx` eller `OvaLage.jsx` skriver till Firestore |
| Resultat/poäng | Visas inte ens för användaren själv vid passets slut – medvetet avstått (`OvaLage.jsx` rad 130–146) |
| Källa till frågorna | I dag: kundens egna godkända rutiner, plus `KVISSBANK` (leverantörskurerad, 19 frågor om systemet) |
| Det som föreslås | Att `KVISSBANK` även skulle innehålla generella yrkes-/faktafrågor |

Det som juridiskt ändras med förslaget är **avsändarskapet**: i dag påstår Synappsen bara
saker om Synappsen. Med förslaget skulle Synappsen påstå saker om vården.

---

## 2. Tillämpliga rättskällor

### 2.1 MDR art. 2(1) – definitionen

> *"'medical device' means any instrument, apparatus, appliance, **software**, implant,
> reagent, material or other article **intended by the manufacturer to be used**, alone or in
> combination, **for human beings for one or more of the following specific medical purposes**:
>
> — diagnosis, prevention, monitoring, prediction, prognosis, treatment or alleviation of
> disease,
> — diagnosis, monitoring, treatment, alleviation of, or compensation for, an injury or
> disability,
> — investigation, replacement or modification of the anatomy or of a physiological or
> pathological process or state,
> — providing information by means of in vitro examination of specimens derived from the human
> body […]"*

Två rekvisit måste alltså vara uppfyllda: ett **medicinskt ändamål** ur listan, och att
produkten är avsedd att användas **för människor** i det ändamålet.

### 2.2 MDR skäl 19 – programvara för allmänna ändamål

> *"It is necessary to clarify that software in its own right, when specifically intended by
> the manufacturer to be used for one or more of the medical purposes set out in the definition
> of a medical device, qualifies as a medical device, **while software for general purposes,
> even when used in a healthcare setting**, or software intended for life-style and well-being
> purposes **is not a medical device**."*

Att programvaran används av vårdpersonal, på en vårdavdelning, om vårdinnehåll, är alltså
i sig inte tillräckligt. Detta är ett uttryckligt lagstiftarval, inte en tolkning.

### 2.3 MDR art. 2(12) – avsett ändamål

> *"'Intended purpose' means the use for which a device is intended according to the data
> supplied by the manufacturer **on the label, in the instructions for use or in promotional or
> sales materials or statements** and as specified by the manufacturer in the clinical
> evaluation."*

Marknadsföring är alltså en del av kvalificeringsunderlaget. Detta bekräftar § 6.4 i
`granskningar/JURIDISK-GRANSKNING.md`, som redan påpekat det, och gör `saljmaterial/PITCH.md`
och `saljmaterial/kallfiler/` till juridiskt relevanta dokument i den här frågan.

### 2.4 MDCG 2019-11 – beslutsstegen för kvalificering

Vägledningen (§ 3.2) definierar medicinteknisk programvara:

> *"Medical device software is software that is intended to be used, alone or in combination,
> for a purpose as specified in the definition of a 'medical device' […]"*

och slår fast (§ 3.1):

> *"**Software must have a medical purpose on its own** to be qualified as a medical device
> software (MDSW)."*

De fem beslutsstegen (§ 3.3, figur 1) är:

| Steg | Fråga |
|---|---|
| 1 | Är produkten programvara? |
| 2 | Är den en bilaga XVI-produkt, ett tillbehör, eller driver/påverkar den en medicinteknisk produkt? |
| 3 | Utför den en åtgärd på data **utöver** lagring, arkivering, kommunikation, **enkel sökning** eller förlustfri komprimering? |
| 4 | **Är åtgärden till nytta för enskilda patienter?** |
| 5 | Uppfyller den MDSW-definitionen? |

Steg 4 är avgörande här, och vägledningens exempellista är ordagrant:

> *"Examples of software which are not considered as being for the benefit of individual
> patients are those which are intended only to aggregate population data, **provide generic
> diagnostic or treatment pathways (not directed to individual patients), scientific
> literature, medical atlases, models and templates** as well as software intended only for
> epidemiological studies or registers."*

### 2.5 MDCG 2019-11 bilaga I b) – beslutsstödsprogramvara

Vägledningens egen definition av det som *kvalificerar*:

> *"In general, these are computer based tools which combine general medical information
> databases and algorithms **with patient-specific data**. They are intended to provide
> healthcare professionals and/or users with **recommendations** for diagnosis, prognosis,
> monitoring and treatment **of individual patients**. Based on Figure 1, they are qualified as
> medical devices."*

Notera vad som gör dem till produkter: **patientspecifika data** kombinerat med
**rekommendationer för enskilda patienter**. Databasen med allmän medicinsk information är
uttryckligen inte det som utlöser kvalificeringen – det är kombinationen med patientdata.

### 2.6 Svensk rätt

`lag (2021:600)` med kompletterande bestämmelser till EU:s förordningar om medicintekniska
produkter kompletterar MDR/IVDR och pekar ut tillsynsansvaret. Den innehåller ingen egen,
avvikande definition av vad som är en medicinteknisk produkt – kvalificeringen avgörs av MDR
art. 2(1). Ingenting i svensk rätt skärper alltså gränsen jämfört med genomgången ovan.

---

## 3. Beslutsstegen tillämpade på förslaget

| Steg | Bedömning för ett övningskviss med generella faktafrågor | Slutsats |
|---|---|---|
| 1. Är det programvara? | Ja. | Vidare |
| 2. Bilaga XVI / tillbehör / driver en produkt? | Nej. Kvisset används inte tillsammans med någon medicinteknisk produkt och påverkar ingen sådan. | Vidare |
| 3. Åtgärd utöver lagring/sökning? | **Tveksamt, och det spelar mindre roll.** Att jämföra ett klickat index mot ett facitindex är gränsfallet till "enkel sökning". Även vid ett generöst "ja" faller frågan på steg 4. | Vidare (för säkerhets skull) |
| 4. **Till nytta för enskilda patienter?** | **Nej.** Ingen patient finns i flödet: ingen patientdata matas in, inget svar avser en identifierbar individ, inget utfall lämnar användarens skärm. Innehållet är per definition *generiskt* – exakt vägledningens formulering *"generic diagnostic or treatment pathways (not directed to individual patients)"*. | **Kvalificerar inte** |
| 5. MDSW-definitionen? | Nås inte, eftersom steg 4 besvaras nekande. | – |

MDCG 2019-11 innehåller ett arbetat exempel med precis den här utgången (bilaga II, exempel 1,
ett laboratorieinformationssystem): *"Step 4 is answered 'no' as the software does not perform
this action for the benefit of individual patients. The conclusion is that the software does not
fall under the Medical Devices Regulations."* Mekaniken är alltså inte hypotetisk – steg 4
används i praktiken som en självständig utgång.

### 3.1 Kontrollen mot skäl 19

Även om man skulle bortse från steg 4 fångas fallet av skäl 19: ett övningskviss är
programvara för allmänna ändamål (kunskapsträning) som används i en vårdmiljö. Skäl 19 säger
uttryckligen att det inte räcker för kvalificering.

### 3.2 Reductio: varför gränsen inte kan ligga där `kvissbank.js` påstår

Kommentaren i `src/data/kvissbank.js` rad 11–15 lyder i dag:

> *"En kvissfråga har till skillnad från en mall ett RÄTT SVAR – den är därför per definition
> ett faktapåstående, och en fråga som 'vilken kompressionsfrekvens gäller vid HLR?' vore
> klinisk vägledning oavsett hur den formuleras."*

Om premissen "ett medicinskt påstående med ett rätt svar ⇒ klinisk vägledning ⇒ MDR" höll,
skulle följande också kvalificera som medicintekniska produkter:

- varje medicinsk lärobok i digital form,
- varje e-learningmodul i en regions kompetensportal,
- varje digital tentamen på ett sjuksköterskeprogram,
- HLR-rådets egna utbildningsmaterial.

Ingen av dem CE-märks, och ingen tillsynsmyndighet har hävdat att de ska. Premissen bevisar
för mycket och är därför fel. **Felet i resonemanget** är att det slår ihop två skilda saker:
att *göra ett medicinskt faktapåstående* (vilket läroböcker gör) med att *ge beslutsstöd för
en enskild patient* (vilket är MDSW enligt § 2.5 ovan). Endast det senare kvalificerar.

### 3.3 Slutsats i kvalificeringsfrågan

**Ett övningskviss med generella faktafrågor, utan patientdata och utan patientspecifik
output, kvalificerar inte som medicinteknisk programvara enligt MDR art. 2(1).** Bedömningen
vilar på tre oberoende grunder som var för sig räcker: MDCG 2019-11 steg 4, MDR skäl 19, och
avsaknaden av ett medicinskt ändamål "on its own" enligt MDCG 2019-11 § 3.1.

---

## 4. Var gränsen faktiskt går

Tre förändringar skulle flytta funktionen över gränsen. De bör behandlas som stående spärrar,
inte som engångsbedömningar.

### 4.1 Patientspecifik input

Så snart användaren matar in något om en faktisk patient – ålder, vikt, värden, symtom – och
appen svarar med något som gäller *den* patienten, är steg 4 uppfyllt och produkten
kvalificerar. Detta är den skarpaste och mest praktiskt relevanta gränsen.

**Konkret spärr:** kvissytorna får aldrig ha en fritextinmatning eller ett numeriskt fält som
påverkar vilket svar som visas. Dagens `OvaLage.jsx` uppfyller detta strukturellt – enda
inputen är `type="radio"`.

### 4.2 Avsett ändamål i gränssnitt och marknadsföring

Enligt art. 2(12) (§ 2.3 ovan) avgörs ändamålet av vad tillverkaren säger, inklusive i
säljmaterial. Samma frågor under rubriken **"Öva"** är utbildning. Samma frågor under
**"Beslutsstöd – kontrollera här innan du agerar"** är ett kvalificeringsargument mot oss.

**Konkret spärr:** kvissinnehåll får aldrig presenteras som något att konsultera i ett skarpt
läge, varken i UI-text, `saljmaterial/PITCH.md` eller ett anbudssvar. Formuleringar som
"repetition", "träning", "öva" är korrekta och ska behållas. Formuleringar som "stöd",
"kontrollera", "säkerställ rätt handläggning" ska undvikas i just den här kontexten.

### 4.3 Beräkning eller rekommendation (genomgående krav 25)

`etapplaner/ETAPPLAN13.md` krav 25 gäller oförändrat: leverantörskurerat innehåll får aldrig
beräkna, poängsätta eller rekommendera en åtgärd. En fråga som *anger* ett faktum är inte en
kalkylator. Men en fråga formulerad som "patienten väger X – vilken dos?" lär ut en
beräkningsoperation, och samma innehåll placerat i checklistläget vid sängkanten närmar sig
gränsen från två håll samtidigt.

**Konkret spärr:** kvissfrågor hålls kvar i övningsytorna och migrerar aldrig in i
checklistläget eller akutläget.

---

## 5. Riskerna som inte är MDR – och som väger tyngre

Att MDR-gränsen håller betyder inte att förslaget är riskfritt. Tre andra risker är verkliga,
och den nuvarande hårda regeln i `kvissbank.js` råkar skydda mot dem – vilket är skälet att
inte bara ta bort regeln utan att ersätta den med något.

### 5.1 Korrekthet och färskhet (den allvarligaste)

I samma stund som Synappsen påstår "rätt svar: X" om kliniskt innehåll är **Synappsen
författare till det påståendet, för samtliga kunder samtidigt**. Till skillnad från en rutin
har innehållet ingen lokal ägare, inget granskningsdatum och ingen innehållshälsoflagga som
larmar när det åldras.

Projektets egen historik är argumentet, inte en hypotes: sex dokument har legat 19–51 releaser
efter verkligheten (`granskningar/SAKERHETSRAPPORT.md` 46–51, `produkt/FRAMTIDSPLAN.md` och
`produkt/MODULPLAN.md` 38–43, `src/version.js` 19, `saljmaterial/PITCH.md` 48). Ett dokument
som glider är pinsamt. **Ett kliniskt facit som glider är en patientsäkerhetsrisk, och
dessutom en där personalen aktivt tränats att lita på det felaktiga svaret.**

Riktlinjer ändras löpande: HLR-rådet reviderar, Socialstyrelsen uppdaterar nationella
riktlinjer, nationella vårdprogram får nya versioner.

### 5.2 Regional och lokal variation

Mycket som ser nationellt ut är det inte. Triageskalor skiljer sig mellan regioner,
delegeringsregler och lokala PM likaså. Ett svar som är "nationellt rätt" kan vara lokalt fel –
och en anställd som tränat på det generella svaret kan handla i strid med sin egen
verksamhets rutin. Det motverkar direkt Synappsens grundidé, som är att verksamhetens egen
godkända rutin gäller.

### 5.3 Upphovsrätt och varumärke (genomgående krav 26 och 27)

Nationella vårdprogram, riktlinjer och bedömningsinstrument är upphovsrättsligt skyddade verk,
och flera instrument är dessutom licensbelagda. Egen formulering av ett allmänt känt sakförhållande
är fritt; att återge en poängtabell, en algoritm eller ett instruments innehåll är det inte –
oavsett att det sker i frågeform. Krav 27 gäller instrumentens namn som varumärkesfråga.

**Frågeformatet ger ingen immunitet här.** Ett kviss som steg för steg återger ett skyddat
instruments poängsättning reproducerar instrumentet.

### 5.4 AI-förordningen

Om frågor någon gång genereras av AI aktualiseras förordning (EU) 2024/1689. Bilaga III p. 3
gör AI-system inom utbildning till högrisk bland annat när de är avsedda att

> *"evaluate learning outcomes, including when those outcomes are used to steer the learning
> process of natural persons in educational and vocational training institutions at all levels"*

Öva-läget bedömer ingen och sparar ingenting. **Krav 14 (inga sparade svar) är alltså inte
bara en integritetsprincip utan en juridisk spärr som håller funktionen utanför bilaga III.**
Det bör dokumenteras som ett skäl att aldrig införa poäng, streaks eller resultatuppföljning –
en funktion som "bara" sparar resultat skulle flytta bedömningen.

### 5.5 Produktansvar och kundens ledningssystem

Kunden har enligt patientsäkerhetslagen (2010:659) 3 kap. och HSLF-FS 2011:9 ett eget ansvar
för ledningssystem och personalens kompetens. Ett övningsverktyg från en leverantör kan stödja
det arbetet, men om verktyget lär ut fel blir det kundens avvikelse och leverantörens
ansvarsfråga. Detta är avtals- och produktansvarsrätt, inte MDR, men det är den väg ett
verkligt problem sannolikt skulle nå oss.

---

## 6. Rättelse som bör göras i koden

Kommentaren i `src/data/kvissbank.js` rad 9–22 bör skrivas om. Den nuvarande lydelsen påstår
att kliniska frågor passerar MDR-gränsen. Det stämmer inte enligt § 3 ovan, och ett felaktigt
juridiskt skäl i en kodkommentar är farligt på två sätt: det blockerar något som är tillåtet,
och det gör att den dag någon upptäcker felet riskerar hela regeln att förkastas – inklusive
de delar som faktiskt bär (§ 5).

Den rättade lydelsen bör säga att avgränsningen är vald av **innehållsförvaltningsskäl**
(korrekthet, färskhet, lokal variation, upphovsrätt), inte av MDR-skäl, och peka hit.

**Denna rättelse är inte gjord i skrivande stund** – den väntar på ägarens beslut enligt § 8,
eftersom den ändrar en avgränsning som styr vad produkten får innehålla.

---

## 7. Rekommendation

Dela innehållet i två spår med olika krav.

### Spår 1 – yrkes- och regelkunskap. Kan byggas nu.

Sekretess och tystnadsplikt, dokumentationsskyldighet enligt patientdatalagen, delegeringens
juridiska innebörd, avvikelse- och anmälningsplikt, samtycke, basala hygienrutiner som
princip, arbetsmiljöansvar.

Egenskaper som gör spåret lågrisk: innehållet följer av lag och är därför nationellt enhetligt
(PSL, PDL, OSL, SoL), det är stabilt över tid, det är genuint relevant för all vårdpersonal
oavsett verksamhet, och det är varken kliniskt beslutsstöd eller upphovsrättsligt skyddat
material.

### Spår 2 – kliniska sakfrågor. Kräver struktur först.

MDR-mässigt tillåtet enligt § 3. Men bygg det inte som statisk kod utan minst:

1. **Källa och datum per fråga** – ett fält som anger vilken riktlinje svaret bygger på och när
   det kontrollerades.
2. **Granskningscykel** – samma mekanism som rutinernas granskningsdatum, så att åldrande blir
   synligt i stället för tyst.
3. **Lokal avstängning** – verksamheten måste kunna stänga av en fråga som strider mot dess
   egen rutin, annars tränar vi personal mot deras eget ledningssystem.
4. **Egen formulering** – aldrig återgivning av en skyddad tabell, algoritm eller
   instrumenttext (krav 26).

Utan punkt 1–3 ärver spår 2 exakt det felmönster projektet dokumenterat sex gånger, i den
kontext där konsekvensen är störst.

---

## 8. Vad som behöver beslutas

| Fråga | Beslutas av | Status |
|---|---|---|
| Ska spår 1 byggas? | Ägaren | **Avgjort 2026-08-27: ja.** Byggt i Etapp 71, 12 frågor, alla källbelagda mot lagtext |
| Ska spår 2 byggas, och i så fall med vilken struktur? | Ägaren, efter extern juridisk bedömning | **Delvis avgjort:** maskineriet är byggt (paket `kliniskt`, med `kalla`/`kallaDatum`, granskningsbarhet och avstängning per fråga). INNEHÅLLET väntar fortsatt på den externa bedömningen |
| Ska `kvissbank.js` kommentar rättas enligt § 6? | Ägaren | **Avgjort 2026-08-27: ja, rättad** |
| Ska de befintliga 19 systemfrågorna behållas? | Ägaren (ägaren har uttryckt att de är av lågt värde för vårdpersonal) | Öppen – de ligger nu i ett eget paket (`systemkunskap`) som går att stänga av i adminvyn, så beslutet kan skjutas upp utan kostnad |

---

## 8b. Vad som byggdes efter bedömningen (Etapp 71, 2026-08-27)

Ägaren antog rekommendationen och lade till ett krav: paketen ska gå att pausa, och enskilda
frågor ska gå att se, redigera, lägga till och ta bort – både av kundens administratör och av
leverantören. Det kravet flyttade lösningen från statisk kod till en Firestore-backad modell.

| Del | Var |
|---|---|
| Leverantörens globala frågor | `kvissfragor/{id}` |
| Kundens avvikelse från en sådan | `organisationer/{orgId}/kvissoverlagring/{fragaId}` |
| Kundens egna, fristående frågor | `organisationer/{orgId}/kvissegna/{id}` |
| Kundens paketval | `organisationer/{orgId}.kvisspaket` |
| Leverantörens globala nödstopp | `kvisspaket/{paketId}` |

Fyra beslut styrde utformningen (ägaren 2026-08-27): **överlagring** framför kopia-per-kund, så
att en central rättelse når varje kund som inte själv ändrat frågan (§ 5.1); **superadmin +
VÖL** som behörighetsnivå, samma som redan krävs för att godkänna kliniskt innehåll; **eget
kundpaket** för frågor som inte hör till någon rutin; och **paus på båda nivåerna**, så att ett
felaktigt facit kan stoppas hos alla kunder utan en deploy.

Spärrarna i § 4 hölls: ingen fritext- eller sifferinmatning påverkar vilket svar som visas
(§ 4.1), ytan heter fortsatt "Öva" och beskrivs som träning (§ 4.2), och kvissinnehållet ligger
kvar utanför checklist- och akutläget (§ 4.3). Krav 14 (inga sparade svar) är oförändrat, vilket
enligt § 5.4 också är det som håller funktionen utanför AI-förordningens bilaga III.

**Färskhetsrisken bekräftade sig direkt.** Vid författandet av de tolv yrkeskunskapsfrågorna
visade det sig att `SOSFS 1997:14` om delegering – grunden för i stort sett varje svensk
delegeringsutbildning – **upphävdes 2026-01-01** genom HSLF-FS 2025:5. En fråga skriven ur
minnet hade alltså varit felaktig från första dagen. Frågan vilar nu i stället på
patientsäkerhetslagen 6 kap. 3 §, och `src/data/kvissfragorSeed.test.js` har en assertion som
failar om någon skriver tillbaka den upphävda referensen.

---

## 9. Avgränsning och förbehåll

- **Detta är inte juridisk rådgivning.** Bedömningen är gjord av en kodsession mot primärkällor,
  inte av en jurist med ansvarsförsäkring.
- **MDCG-vägledning är inte bindande rätt.** Den uttrycker medlemsstaternas samordnade tolkning
  och väger tungt i praktiken, men en tillsynsmyndighet är inte bunden av den. Kontrollera att
  MDCG 2019-11 inte reviderats sedan detta skrevs.
- **`etapplaner/ETAPPLAN13.md` (Etapp 64, baspaketet) är juridiskt blockerad** i väntan på
  extern bedömning av närliggande frågor. Spår 2 ligger nära nog att det bör ingå i samma
  uppdrag. Spår 1 gör det inte.
- **Bedömningen gäller funktionen som den ser ut i v5.129.0.** Varje ändring som inför
  patientinmatning, resultatlagring eller en ny placering av kvissinnehållet gör om
  förutsättningarna.

---

## 10. Källor

| Källa | Använd för |
|---|---|
| Förordning (EU) 2017/745 (MDR) art. 2(1) | Definitionen av medicinteknisk produkt |
| MDR skäl 19 | Programvara för allmänna ändamål i vårdmiljö |
| MDR art. 2(12) | Avsett ändamål inkl. marknadsföring |
| MDCG 2019-11, § 3.1, 3.2, 3.3, bilaga I b), bilaga II ex. 1 | Beslutsstegen, MDSW-definitionen, beslutsstödsprogramvara |
| Förordning (EU) 2024/1689 (AI-förordningen) bilaga III p. 3 | Utbildningssystem som högrisk |
| lag (2021:600) | Svensk komplettering till MDR |
| Patientsäkerhetslagen (2010:659) 3 kap., HSLF-FS 2011:9 | Kundens ledningssystem- och kompetensansvar |
| `granskningar/JURIDISK-GRANSKNING.md` § 6 | Projektets tidigare MDR-genomgång |
| `etapplaner/ETAPPLAN13.md` krav 25–27 | Stående krav om beräkning, upphovsrätt, varumärke |

Länkar till primärkällorna:
- MDR: https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32017R0745
- MDCG 2019-11: https://health.ec.europa.eu/system/files/2020-09/md_mdcg_2019_11_guidance_en_0.pdf
- AI-förordningen bilaga III: https://artificialintelligenceact.eu/annex/3/
- lag (2021:600): https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-2021600-med-kompletterande-bestammelser_sfs-2021-600/
- SOSFS/HSLF-FS 2011:9: https://www.socialstyrelsen.se/kunskapsstod-och-regler/regler-och-riktlinjer/foreskrifter-och-allmanna-rad/konsoliderade-foreskrifter/20119-om-ledningssystem-for-systematiskt-kvalitetsarbete/

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-08-27 | Första versionen. Besvarar ägarens fråga om generella faktafrågor i Öva-läget |
| 1.1 | 2026-08-27 | §8 uppdaterad med fattade beslut, nytt §8b om vad som faktiskt byggdes (Etapp 71) |
