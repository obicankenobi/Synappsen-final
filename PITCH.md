# Synappsen – rätt information, direkt i handen, när det är bråttom

*Beslutsunderlag för verksamhetsledning · Version 5.7.0 · 2026-07-14*

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
- **Klinikstöd-sökning:** ställ en generell medicinsk fråga och få ett källhänvisat svar
  hämtat live från enbart godkända svenska källor (Internetmedicin, 1177, Nationella
  kliniska kunskapsstödet, FASS, Läkemedelsverket, Vårdhandboken, Folkhälsomyndigheten) –
  tekniskt spärrat från alla andra källor, inte bara "instruerat".

## Vad ledningen får

- **Spårbarhet:** läskvittering på rutiner och anslag – se vilka som INTE tagit del av en
  ny rutin, med deadline och exporterbar rapport till t.ex. APT-underlag.
- **Kvalitetskontroll:** versionshistorik, granskningssignaturer, automatiska påminnelser
  när en rutin behöver ses över, och en fullständig ändringslogg (vem gjorde vad, när).
- **Datadriven prioritering:** appen loggar vad personalen söker efter utan att hitta –
  ledningen ser exakt vilka rutiner som saknas och efterfrågas mest.
- **Kommunikation som når fram:** anslagstavla med prioritet, skiftrapport för driftinfo
  (aldrig patientdata), notiser och @omnämnanden.

## Byggd för vårdens krav

- **Inga patientuppgifter, i flera lager:** appen blockerar tekniskt personnummer i alla
  fritextfält – i formuläret, på servern och i databasens egna regler – och varnar vid
  misstänkta namn. Utformad utifrån GDPR och patientdatalagen från dag ett.
- **Rollstyrd behörighet** (6 roller), tvåfaktorsautentisering, automatisk utloggning på
  delade datorer, och möjlighet för admin att omedelbart återkalla en session.
- **Kostnadskontroll:** AI-funktionerna har hårda månadsbudgetar (totalt och per
  användare) som styrs från adminpanelen – kostnaden kan aldrig skena.
- **Granskad:** hela kodbasen har genomgått en dokumenterad säkerhets- och buggenomgång
  (se SAKERHETSRAPPORT.md), med automatiska tester och kontroller vid varje ändring.

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

*Synappsen är utvecklad iterativt med verksamhetens krav i centrum – 14 dokumenterade
utvecklingsfaser, fullständig teknisk logg och säkerhetsrapport finns att tillgå.*
