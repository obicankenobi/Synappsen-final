# Synappsen – rätt information, direkt i handen, när det är bråttom

*Beslutsunderlag för verksamhetsledning · Version 5.25.0 · 2026-07-26*

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
  när en rutin behöver ses över, och en fullständig ändringslogg (vem gjorde vad, när).
- **Datadriven prioritering:** appen loggar vad personalen söker efter utan att hitta –
  ledningen ser exakt vilka rutiner som saknas och efterfrågas mest. Sedan senaste
  versionen mäts även **tiden från påbörjad sökning till klick** per session, så det går
  att se om det tar sekunder eller minuter att hitta rätt.
- **Ledningsrapport:** en utskriftsvänlig sida byggd specifikt för det en chef vill kunna
  visa uppåt – kvitteringsgrad per område, inte bara operativa detaljer.
- **Kommunikation som når fram:** anslagstavla med prioritet, skiftrapport för driftinfo
  (aldrig patientdata), notiser och @omnämnanden.

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
  kända kvarstående punkter öppet redovisade snarare än dolda.
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

## Förslag på nästa steg

1. **Pilot 4–6 veckor** på en sektion: fyll på med befintliga rutiner (fotofunktionen gör
   detta snabbt), mät söknyttjande och kvitteringsgrad.
2. **Utvärdering** mot tre mått: tid-att-hitta, andel kvitterade rutiner, personalens
   upplevda nytta (inbyggd feedback-funktion).
3. **Breddinförande** vid godkänt utfall – appen är redan byggd för hela mottagningen.

---

*Synappsen är utvecklad iterativt med verksamhetens krav i centrum – 40+ dokumenterade
utvecklingsfaser, fullständig teknisk logg och säkerhetsrapport finns att tillgå.*
