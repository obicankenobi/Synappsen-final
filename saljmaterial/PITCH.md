# Synappsen – rätt information, direkt i handen, när det är bråttom

*Beslutsunderlag för verksamhetsledning · Version 5.114.0 · 2026-08-17*

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
- **Klinikstöd-sökning:** besvarar en generell medicinsk fråga med källhänvisning, tekniskt
  begränsad till enbart godkända svenska källor (Internetmedicin, 1177, Nationella kliniska
  kunskapsstödet, FASS, Läkemedelsverket m.fl.) via en domänbegränsad sökmotor – inte en fri
  AI-instruktion att bara citera dessa källor. En första version kunde i vissa fall ändå
  citera källor utanför listan; vi valde då att stänga av funktionen istället för att lita på
  en lösning med osäker träffsäkerhet, byggde om den att söka via en riktigt domänbegränsad
  sökmotor istället, och den är sedan i drift igen. En daglig automatisk källkontroll och en
  manuell verifieringsknapp bevakar att gränsen håller. Vi nämner historiken öppet eftersom
  den säger något om hur vi hanterar osäkerhet i produkten.

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
- **En veckopuls i adminpanelen:** de mest angelägna sakerna att göra just nu – väntande
  godkännanden, rutiner som behöver ses över, sökningar utan träff – samlade på ett ställe
  istället för utspridda över flera vyer.
- **Kommunikation som når fram:** anslagstavla med prioritet, skiftrapport för driftinfo
  (aldrig patientdata), notiser och @omnämnanden.
- **Hittar det du inte visste fanns:** global kommandopalett (Ctrl/Cmd+K), föreslagna
  relaterade rutiner baserat på delade taggar/område, och "Sedan ditt förra pass" som
  känner igen även ett väsentligt uppdaterat innehåll – inte bara helt nytt.

## Innehållet hålls vid liv, inte bara publicerat en gång

Den vanligaste svagheten i den här typen av system är inte att innehåll saknas – det är att
det blir gammalt utan att någon märker det. Synappsen har en egen innehållshälsokontroll:

- **En hälsosiffra per område, alltid med sin nedbrytning** – aldrig ett ensamt procenttal
  utan att samtidigt visa VILKA rutiner som bör granskas, saknar ägare, aldrig kvitterats
  eller är utgångna. En siffra utan orsak går att runda av; en siffra med lista går inte.
- **Riktade granskningsrundor:** en redaktör kan starta en tidsbestämd genomgång av ett urval
  äldre rutiner inom ett område, med automatisk påminnelse till varje berörd ägare.
- **Hälsosiffran går att åtgärda direkt:** tilldela en ägare eller starta en granskningsrunda
  för exakt de flaggade rutinerna utan att lämna listan – och en sökning som inte gav träff
  kan bli en ny rutin med sökordet redan ifyllt, istället för att bara bli statistik.
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
- **Rollstyrd behörighet** (7 roller), tvåfaktorsautentisering, automatisk utloggning på
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
- **Kioskläge för en delad enhet:** en surfplatta i förrådet eller akutrummet kan låsas till
  ett eget kontotyp – läser godkänt innehåll, söker, kör checklistor och når akutläget direkt,
  men kan aldrig kvittera, kommentera eller skriva något i en persons namn. Låses upp med en
  PIN-kod, inget personligt lösenord på den delade skärmen.
- **Handledarsignering i introduktionen:** utöver att den nyanställda själv kvitterar att hon
  läst en punkt kan en kollega signera att momentet faktiskt gåtts igenom tillsammans. Att
  signera sin egen introduktion är tekniskt omöjligt – spärren ligger i databasens regler, inte
  bara i gränssnittet.
- **Tydligt ansvar:** varje rutin kan ha en utpekad ägare (roll eller namngiven person), och
  medarbetare kan tilldelas ansvarsområden. En samlad vy i adminpanelen svarar på "vem ansvarar
  för vad" utan att någon behöver leta.

## Vardagsdetaljer som gör skillnad i skiftet

- **Uppläsning:** en rutin kan läsas upp högt – användbart med händerna upptagna eller vid
  läshinder.
- **"Ändrat sedan du läste":** om en rutin ändrats efter din senaste kvittering syns exakt vad
  som skiljer, inte bara att något ändrats.
- **Sökning som förstår vårdens ord:** en sökning på "PVK" hittar rutinen som skriver "perifer
  venkateter", och tvärtom.
- **Driftstörningar kan kategoriseras och kopplas till rätt rutin** i efterhand, med en samlad
  historik utöver de senaste dygnens poster.

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

## Vad som inte finns än

Samma princip som "Ärlighet om vad som faktiskt är mätt" ovan, tillämpad på funktionalitet
istället för mätdata – en IT-avdelning som upptäcker en lucka själv drar slutsatsen att det
finns fler; en som får den berättad öppet drar inte det.

- **Enkel inloggning (SSO/Microsoft Entra ID):** inte byggt ännu. Beslutat som teknisk
  inriktning (OIDC) men väntar på att en faktisk kund kräver det innan det byggs – att bygga
  det spekulativt riskerar att inte matcha den verkliga uppsättningen.
- **Flera enheter under samma huvudman, med gemensam överblick:** ren gruppering
  (leverantörens vy) finns. Delad rutindata och en jämförande ledningsrapport MELLAN egna
  enheter finns inte – det kräver samma rigör som organisationsisoleringen i övrigt, och
  byggs när en konkret kund med flera enheter faktiskt behöver det.
- **Integration mot journalsystem (Cosmic, Melior, TakeCare) eller HR-system:** finns inte,
  och är ett medvetet avstånd – Synappsen spärrar aktivt patientuppgifter i tre lager (se
  "Byggd för vårdens krav" ovan), en journalintegration skulle vara en annan produkt med en
  helt annan riskklass.
- **Dos- eller läkemedelsberäkning:** klinikstödet sammanfattar källor och visar alltid
  varifrån, men räknar aldrig ut en dos. En funktion som gör det skulle klassa hela produkten
  som en medicinteknisk produkt under MDR – medvetet avstått.

## Ni börjar inte från ett tomt system

Väljer ni en verksamhetstyp (t.ex. akutmottagning, vårdcentral, kommunal hemtjänst) vid
etablering fylls organisationen automatiskt med ett startbibliotek: strukturella rutinmallar
över Kliniskt stöd, Logistik och Administration, ett förrådsförslag att döpa om, generella
kontaktkategorier, ett introduktionsspår för en nyanställd och ett kompetenskrav – redo att
justeras till er verkliga verksamhet istället för att skrivas från noll. Varje mall är
tydligt märkt som just en mall, aldrig påstådd färdig klinisk vägledning.

## Förslag på nästa steg

1. **Pilot 4–6 veckor** på en sektion: fyll på med befintliga rutiner (fotofunktionen gör
   detta snabbt), mät söknyttjande och kvitteringsgrad.
2. **Utvärdering** mot tre mått: tid-att-hitta, andel kvitterade rutiner, personalens
   upplevda nytta (inbyggd feedback-funktion).
3. **Breddinförande** vid godkänt utfall – appen är redan byggd för hela mottagningen.

---

*Synappsen är utvecklad iterativt med verksamhetens krav i centrum – 40+ dokumenterade
utvecklingsfaser, fullständig teknisk logg och säkerhetsrapport finns att tillgå.*
