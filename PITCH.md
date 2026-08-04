# Synappsen – rätt information, direkt i handen, när det är bråttom

*Beslutsunderlag för verksamhetsledning · Version 5.73.0 · 2026-08-04*

---

## Problemet

På en akutmottagning ligger verksamhetskritisk kunskap utspridd: rutiner i pärmar och
delade mappar, förrådsplatser i huvudet på erfarna kollegor, telefonnummer på lappar,
driftinfo som förmedlas muntligt mellan skift. Konsekvensen är tid som går åt till att leta
istället för att vårda, beroende av nyckelpersoner, och rutiner som ingen vet om de är
aktuella eller ens lästa.

## Lösningen

Synappsen är en installerbar app (fungerar på mobil, surfplatta och dator, även vid dåligt
nät) som samlar mottagningens hela praktiska kunskap på ett ställe – sökbar på sekunder:

- **Kliniskt stöd, Logistik och Administration** – alla rutiner, alla förrådsartiklar med
  exakt skåp- och hyllplats, alla administrativa dokument.
- **Fota en whiteboard eller inventarielista → färdigt utkast.** AI:n tolkar foton och
  skapar sökbart innehåll automatiskt. Inget publiceras utan att en behörig person granskat
  och godkänt det.
- **Klinikstöd-sökning (under vidareutveckling):** en funktion byggd för att besvara en
  generell medicinsk fråga med källhänvisning, tekniskt begränsad till enbart godkända
  svenska källor (Internetmedicin, 1177, Nationella kliniska kunskapsstödet, FASS,
  Läkemedelsverket m.fl.). Funktionen är **medvetet pausad i gränssnittet** just nu –
  den visade sig i vissa fall kunna citera källor utanför listan, och vi valde att stänga
  av den istället för att lita på en lösning med osäker träffsäkerhet. Koden finns kvar
  och återaktiveras när en mer robust lösning (en riktigt domänbegränsad sökmotor) är på
  plats. Vi nämner detta öppet eftersom det säger något om hur vi hanterar osäkerhet i
  produkten.

## Vad ledningen får

- **Spårbarhet:** läskvittering på rutiner och anslag – se vilka som INTE tagit del av en
  ny rutin, med deadline och exporterbar rapport till t.ex. APT-underlag.
- **Kvalitetskontroll:** versionshistorik, granskningssignaturer, automatiska påminnelser
  när en rutin behöver ses över, och en fullständig ändringslogg (vem gjorde vad, när) –
  manipuleringsskyddad via en hashkedja (revisionslogg), inte bara en vanlig logg-tabell.
- **Datadriven prioritering:** appen loggar vad personalen söker efter utan att hitta –
  ledningen ser exakt vilka rutiner som saknas och efterfrågas mest. Tiden från påbörjad
  sökning till klick mäts per session, så det går att se om det tar sekunder eller minuter
  att hitta rätt.
- **En samlad godkännandekö:** alla väntande utkast och ändringsförslag – oavsett om de
  kommer från Kliniskt stöd, Logistik eller Administration – i EN vy istället för utspridda
  per sektion, med en banderoll på startsidan som visar hur mycket som väntar.
- **Effekten synlig över tid, inte bara ett ögonblick:** en veckovis mätt trendkurva
  (kvitteringsgrad, sökbeteende) och en "före/efter"-jämförelse kring specifika insatser –
  se "Ärlighet om vad som faktiskt är mätt" nedan för vad det kräver för att bli meningsfullt.
- **Ledningsrapport:** en utskriftsvänlig sida byggd specifikt för det en chef vill kunna
  visa uppåt – kvitteringsgrad per område, trend, och (frivilligt) en anonym
  personalpuls-sammanställning per område, inte bara operativa detaljer.
- **Kommunikation som når fram:** anslagstavla med prioritet, skiftrapport för driftinfo
  (aldrig patientdata), notiser och @omnämnanden.

## Innehållet hålls vid liv, inte bara publicerat en gång

Den vanligaste svagheten i den här typen av system är inte att innehåll saknas – det är att
det blir gammalt utan att någon märker det. Synappsen har en egen innehållshälsokontroll:

- **En hälsosiffra per område, alltid med sin nedbrytning** – aldrig ett ensamt procenttal
  utan att samtidigt visa VILKA rutiner som bör granskas, saknar ägare, aldrig kvitterats
  eller är utgångna. En siffra utan orsak går att runda av; en siffra med lista går inte.
- **Riktade granskningsrundor:** en redaktör kan starta en tidsbestämd genomgång av ett urval
  äldre rutiner inom ett område, med automatisk påminnelse till varje berörd ägare.
- **Möjliga dubbletter flaggas** (under pilotutvärdering i Kliniskt stöd) – två rutiner som
  liknar varandra för mycket upptäcks automatiskt istället för att upptäckas av en
  sammanträffande läsning.
- **"Ni sa, vi gjorde":** en publik lista på startsidan över ändringsförslag som faktiskt
  införts – synliggör att personalens inspel leder till riktiga ändringar, inte bara till en
  kö ingen ser resultatet av.
- **Arkiverad status** för innehåll som inte längre gäller, skild från papperskorgen – syns
  aldrig i akutläget även om ett gammalt fält råkar säga att det borde.

## Byggd för vårdens krav

- **Inga patientuppgifter, i flera lager:** appen blockerar tekniskt personnummer i alla
  fritextfält – i formuläret, på servern och i databasens egna regler – och varnar vid
  misstänkta namn. Utformad utifrån GDPR och patientdatalagen från dag ett.
- **Rollstyrd behörighet** (6 roller), tvåfaktorsautentisering, automatisk utloggning på
  delade datorer, och möjlighet för admin att omedelbart återkalla en session.
- **App Check:** ett tekniskt lager (Google reCAPTCHA) som verifierar att anrop till
  servern faktiskt kommer från den riktiga, installerade appen – infört sommaren 2026,
  för närvarande i en kontrollerad mätfas innan det görs obligatoriskt.
- **Kostnadskontroll:** AI-funktionerna har hårda månadsbudgetar (totalt och per
  användare) som styrs från adminpanelen – kostnaden kan aldrig skena.
- **Granskad, löpande:** hela kodbasen har genomgått flera dokumenterade säkerhets- och
  buggenomgångar (se SAKERHETSRAPPORT.md), med automatiska tester som körs i CI vid varje
  ändring – inklusive databehörighetsreglerna, inte bara applikationskoden.
- **Tillgänglighet:** granskad mot WCAG 2.1 AA (se TILLGANGLIGHETSREDOGORELSE.md), med
  kända kvarstående punkter öppet redovisade snarare än dolda. Mörkt läge, valfri
  accentfärg och ett gränssnitt förnyat i sin helhet (2026) mot ett konsekvent designspråk.
- **Byggd för att kännas som en app, inte en webbsida på jobbet:** installerbar på
  hemskärmen på både Android och iPhone med en tydlig uppmaning (inte bara webbläsarens
  diskreta ikon), och en ny version av appen laddas aldrig in utan förvarning mitt i en
  pågående arbetssession – personalen väljer själv när.
- **Upphandlingsklart:** PUB-avtalsmall, underbiträdesförteckning, DPIA-underlag och ett
  tekniskt faktablad till IT-avdelningen finns färdiga (se avtal/-katalogen), så ett
  inköpsbeslut inte behöver vänta på att någon skriver dessa från grunden.

## Nyttan i siffror (uppskattning att validera i pilot)

| Effekt | Idag | Med Synappsen |
|---|---|---|
| Hitta en rutin/förrådsartikel | minuter av letande/frågande | sekunder via sök |
| Veta vilka som läst en ny rutin | okänt | exakt lista + deadline |
| Digitalisera en pappersrutin | manuell omskrivning | foto → utkast på sekunder |
| Driftkostnad | – | ~0 kr fast; AI-budget ~200 kr/mån (justerbart tak) |

### Ärlighet om vad som faktiskt är mätt

Trendkurvorna, personalpulsen och effektjämförelsen ovan är byggda och redo att samla in
data – men det finns ännu ingen betalande kund, och därför inga verkliga veckor att visa.
Tabellen ovan är fortsatt en uppskattning, inte ett resultat. Anonymitetsspärren i
personalpulsen (minst fem svarande innan ett områdesresultat visas) är avsiktlig och
betyder att en ny, liten pilot kan behöva vänta ett tag innan den siffran syns alls – det är
rätt avvägning, inte en bugg. Vi säger detta rakt ut eftersom det är precis den sortens
detalj vi själva skulle vilja veta innan vi köpte något liknande.

## Förslag på nästa steg

1. **Pilot 4–6 veckor** på en sektion: fyll på med befintliga rutiner (fotofunktionen gör
   detta snabbt), mät söknyttjande och kvitteringsgrad.
2. **Utvärdering** mot tre mått: tid-att-hitta, andel kvitterade rutiner, personalens
   upplevda nytta (inbyggd feedback-funktion).
3. **Breddinförande** vid godkänt utfall – appen är redan byggd för hela mottagningen.

---

*Synappsen är utvecklad iterativt med verksamhetens krav i centrum – 40+ dokumenterade
utvecklingsfaser, fullständig teknisk logg och säkerhetsrapport finns att tillgå.*
