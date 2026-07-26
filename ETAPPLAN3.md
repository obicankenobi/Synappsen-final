# ETAPPLAN3 – Etapp 13–21

*Fortsättning på `ETAPPLAN.md` (Etapp 0–5) och `ETAPPLAN2.md` (Etapp 6–12).
Utgångsläge: v5.25.0, fas 40 avslutad. Nästa fas att skriva i `UTVECKLINGSLOGG.md` är fas 41.*

*Detta är en reviderad version av ett tidigare utkast. Ändringarna mot utkastet är: ett nytt
delmål 13f (SSO/Entra ID, tidigare helt saknat), ett nytt delmål 13g (de fyra kvarvarande
WCAG-A-bristerna från fas 34/SYN-6, tidigare inte inbokade någonstans), en explicit
begränsningstext i Etapp 14 om vad hashkedjan faktiskt skyddar mot, en korrigering av 13b
(Cloud Functions-regionen är redan verifierad – bara Firestore/Storage-regionen återstår att
kolla), samt ett nytt genomgående krav (nr 8) om att verifiera en etapps premisser mot
faktisk kod innan bygget påbörjas – en direkt lärdom från fas 39, där en tidigare plan visade
sig bygga på ett antagande som inte stämde.*

---

## Ordningsprincip

Etapperna är sorterade så att **det som blockerar en affär kommer före det som imponerar i
en demo**. Etapp 13–15 tar bort de hinder som stoppar ett införandebeslut hos en
vårdorganisation (dokumentation, granskningsbarhet, förmågan att ta emot en kund utan
manuellt arbete). Etapp 16–21 bygger den upplevda nyttan för personal och chefer.

Etapp 20 (bristanmälan) är avsiktligt liten och fristående – den kan lyftas fram och göras
när som helst om en pilot behöver ett snabbt synligt tillskott.

**Ingen etapp nedan är ett facit.** Var och en ska omprövas mot den faktiska koden och
`firestore.rules` innan implementation påbörjas (se genomgående krav 8) – planer skrivna i
förväg kan ha fel premisser, vilket etapp 12e visade konkret.

## Genomgående krav – gäller varje etapp nedan

Dessa upprepas inte i varje avsnitt, men ingen etapp är klar utan dem:

1. **Ny collection eller nytt fritextfält ⇒ PII-skydd i tre lager.** Klientformulär,
   Cloud Function och `firestore.rules` (`harTroligtPersonnummer()` med `[\s\S]*`-omslutning
   enligt fas 39). Lägg till collectionen i regelfunktionens tillämpningslista.
2. **Ny collection ⇒ organisationsisolering.** Fältet `organisationId` samt regel som
   kräver att läsaren tillhör samma organisation. Utöka
   `tests/rules/organisationsisolering.test.mjs`.
3. **Regeländring ⇒ test i `tests/rules/` innan den anses klar.** Skydda alltid `get()`/
   `exists()`-resultat med `exists()` först.
4. **Ny större funktion ⇒ egen modul i feature-gatingen** (`functions/index.js`), så att den
   kan säljas till och slås på per organisation.
5. **Release ⇒ `package.json` + `src/version.js` + `src/data/andringslogg.js` + ny
   `UTVECKLINGSLOGG.md`-fas, i samma ändring.**
6. **Fullt svep innan klart:** `npm run lint`, `npm run build`, `npx vitest run`,
   `npm run test:rules`, `npm run test:functions`, `npm run test:storage`,
   `node -c functions/index.js`.
7. **Tillgänglighet:** nya vyer följer `TILLGANGLIGHETSREDOGORELSE.md` (tangentbord,
   kontrast, skärmläsare). Akutläge och checklistläge granskas extra – de används under
   stress.
8. **Verifiera premissen innan bygget påbörjas.** Läs den faktiska koden/reglerna för det
   som delmålet bygger på eller ska skydda, innan implementation påbörjas – inte bara den
   här planens beskrivning av den. Om verkligheten avviker från vad som stod i planen (t.ex.
   att skyddet redan finns, eller att det saknas på ett annat ställe än planen antog): lyft
   det till ägaren och omprioritera, bygg inte blint efter en premiss som visat sig fel.
   Dokumentera avvikelsen i `UTVECKLINGSLOGG.md` precis som fas 39.

---

# Etapp 13 – Upphandlings- och granskningspaket

**Varför först:** Kräver nästan ingen kod (utom 13f, se nedan), men är det vanligaste
stoppet i en vårdorganisations införandebeslut. Utan det hamnar varje samtal i "vi måste
fråga IT och dataskyddsombudet" och dör där.

**Modul:** ingen (leverantörsinternt material), utom 13f som är en egen, gate:ad modul.

### 13a – Personuppgiftsbiträdesavtal (PUB/DPA) ✅ KLAR

- Mall enligt GDPR art. 28 med Synappsen som biträde, kundorganisationen som ansvarig.
- Bilaga: behandlingens art och ändamål, kategorier av registrerade (personal, **inte**
  patienter), lagringstider, radering vid avetablering (koppla till befintligt
  avetableringsflöde från fas 25).
- **Arbetsuppgift:** skriv `avtal/PUB-AVTAL-MALL.md` i repot, med tydlig markering av vad
  som fylls i per kund.
- **Resultat:** `avtal/PUB-AVTAL-MALL.md` skriven. Vid kontroll mot faktisk kod (genomgående
  krav 8) visade det sig att premissen "radering vid avetablering" bara stämmer delvis:
  `pausaOrganisation` och `exporteraOrganisation` finns och fungerar (pausning + export), men
  det finns **ingen automatiserad permanent radering** av en avetablerad organisations data
  eller dess veckobackuper i Storage. Avtalsmallen är skriven för att vara ärlig om detta
  (punkt 6): radering sker idag manuellt av leverantören på begäran, inom en avtalad frist.
  Avvikelsen är dokumenterad i `UTVECKLINGSLOGG.md` (fas 41) och en rekommendation om att bygga
  en automatiserad raderingsfunktion + lifecycle-regel för backuper innan avtalet används mot
  en kund med strikta raderingskrav är införd i mallen. Ingen kod ändrades i detta delmål –
  rent dokumentationsarbete.

### 13b – Subprocessor- och datalagringsförteckning ✅ KLAR

- Lista varje underbiträde: Google Firebase (Auth, Firestore, Storage, Functions, Hosting),
  Google Gemini, Sentry, den sökmotor som klinikstöd-sökningen använder, samt (från etapp 16)
  e-postleverantören.
- Per post: vad som behandlas, i vilken region, rättslig grund för eventuell
  tredjelandsöverföring.
- **Redan verifierat, behöver inte göras om:** samtliga Cloud Functions kör
  `region: "europe-west1"` – kontrollerat direkt i `functions/index.js` (konsekvent, ingen
  avvikelse). **Kvarstående beslutspunkt för ägaren:** verifiera i Firebase-konsolen vilken
  region *Firestore-databasen och Storage-bucketen* faktiskt ligger i (detta sätts vid
  projektskapande, inte per funktion, så det kräver en konsolkoll, inte en kodgranskning).
  Svara med en skärmdump av konfigurationen, inte med en formulering – det är den enskilt
  vanligaste invändningen från ett dataskyddsombud.
- **Arbetsuppgift:** `avtal/UNDERBITRADEN.md`.
- **Resultat:** `avtal/UNDERBITRADEN.md` skriven med en tabell över alla nio
  underbiträden/verktyg i drift, plus den ej upphandlade e-postleverantören (Etapp 16).
  Sentry-regionen verifierades konkret i koden: `ingest.de.sentry.io`, dvs. Sentrys
  EU-region (Frankfurt) – bra att kunna visa. **Nytt fynd vid premisskontroll (genomgående
  krav 8):** koden använder det publika Gemini API:et (`GoogleGenerativeAI`-klienten mot
  `generativelanguage.googleapis.com`), inte Vertex AI – Vertex AI har en tydlig regional
  databehandlingsgaranti (EU-only möjlig), vilket det publika Gemini API:et historiskt inte
  garanterat på samma sätt. Detta är fört in i `UNDERBITRADEN.md` som en öppen punkt att
  kontrollera mot Googles aktuella villkor innan avtalet undertecknas mot en kund med
  strikta regionkrav, med migrering till Vertex AI föreslagen som teknisk lösning om så
  krävs. Firestore-/Storage-regionen kvarstår som en konsolkontroll för ägaren (oförändrat
  från planen).

### 13c – Underlag för konsekvensbedömning (DPIA/ROS) ✅ KLAR

- Ifyllt underlag som kunden kan lämna vidare: vilka uppgifter som behandlas, varför ingen
  patientdata förekommer, hur PII-filtret fungerar i tre lager, roll- och behörighetsmodell,
  loggning, incidentrutin.
- **Arbetsuppgift:** `avtal/DPIA-UNDERLAG.md`. Återanvänd innehåll ur `SAKERHETSRAPPORT.md`
  men skriv för en icke-teknisk läsare.
- **Resultat:** `avtal/DPIA-UNDERLAG.md` skriven med tio avsnitt (syfte, patientuppgifts-
  frånvaro i tre lager, kategorier av uppgifter, nödvändighet/proportionalitet, roll-
  modell, loggning, tekniska åtgärder, underbiträden, incidentrutin, sammanfattande
  risktabell). Byggd på faktiskt verifierat innehåll från `SAKERHETSRAPPORT.md`,
  `avtal/UNDERBITRADEN.md` och `UTVECKLINGSLOGG.md` (bl.a. fas 39-bugfixen som ett konkret
  exempel på att skyddet aktivt testas), inte nyskriva påståenden. Är explicit ärlig om att
  dagens ändringslogg saknar manipuleringsskydd (Etapp 14 ännu inte byggd) och att
  Gemini-regionsfrågan (från 13b) är öppen – ingen överdrift av vad som faktiskt finns på
  plats.

### 13d – Teknisk faktablad till kundens IT ✅ KLAR

- Arkitekturskiss, autentisering (inkl. 2FA-policy från fas 20), App Check-status (nu aktivt
  i mätläge sedan fas 40 – uppdatera texten när 12c-ii/enforcement slås på), nätverkskrav,
  incident- och backupsrutin (veckobackup finns sedan fas 20), återställningstid, vad som
  händer vid avslutat avtal.
- **Arbetsuppgift:** `avtal/IT-FAKTABLAD.md`.
- **Resultat:** `avtal/IT-FAKTABLAD.md` skriven med åtta avsnitt (arkitektur, autentisering/
  behörighet, App Check-status, nätverkskrav, incidentrutin, backup/återställning,
  datalagringsregion, avslutat avtal). Återanvänder samma verifierade fakta som 13a–13c
  (europe-west1 för Cloud Functions, veckovis backup varje måndag 03:00, den öppna
  Gemini-regionfrågan, den manuella raderingsbegränsningen). **Ett nytt öppet fält
  tillkom vid skrivandet:** återställningstiden (RTO) efter en backup är inte
  dokumenterad någonstans i kodbasen eller tidigare planer – markerad `[FYLLS I]` för
  ägaren, eftersom återställning idag är en manuell process utan en definierad
  målsatt tid.

### 13e – Uppdatera PITCH.md ✅ KLAR

- Versionsnumret i `PITCH.md` ska stämma mot `package.json` (varningen i CLAUDE.md).
- Lägg till det som hänt sedan v5.7.0 och som stärker säljargumenten: ledningsrapport
  (fas 30), tid-att-hitta-mätning (fas 32), tillgänglighetsredogörelse (fas 34),
  CI-testsvepet (fas 35), App Check (fas 37/40).
- Ta bort eller validera nyttosiffrorna – de är fortfarande märkta "uppskattning att
  validera i pilot".
- **Resultat:** version uppdaterad 5.7.0 → 5.25.0, datum till 2026-07-26. Tillagt:
  tid-att-hitta-mätning, ledningsrapport, App Check, CI-testsvepet (som "automatiska
  tester som körs vid varje ändring – inklusive databehörighetsreglerna"),
  tillgänglighetsgranskning (WCAG 2.1 AA), samt en ny rad om att upphandlingspaketet
  (13a–13d) nu finns färdigt – rimligt att nämna eftersom just det paketet är avsett att
  användas i säljprocessen. **Ett viktigt sakfel hittades och rättades vid
  premisskontroll (genomgående krav 8):** dokumentet påstod att klinikstöd-sökningen
  "hämtar live" ett källhänvisat svar, men enligt `SAKERHETSRAPPORT.md` är funktionen
  **medvetet pausad i gränssnittet** sedan v5.3.5 (visade sig kunna citera källor
  utanför den godkända listan). Ett säljdokument som påstår att en pausad funktion är
  live är ett allvarligare fel än ett omodernt versionsnummer – omskrivet till att
  öppet beskriva att funktionen är under vidareutveckling och varför den stängdes av.
  Nyttosiffrorna lämnades kvar märkta som uppskattning – ingen pilotdata finns ännu att
  validera mot. "14 dokumenterade utvecklingsfaser" i sidfoten uppdaterat till "40+"
  (var kraftigt inaktuellt, det finns nu 44 faser i UTVECKLINGSLOGG.md).

### 13f – SSO / Microsoft Entra ID *(ny – saknades i tidigare utkast)*

- **Detta delmål skiljer sig från övriga i etappen: det är kod, inte dokument, och är
  betydligt större.** Övervägt utbrutet till en egen session/etapp om ni vill hålla
  Etapp 13 rent leverantörsinternt och snabbrörligt – men det hör hemma här ordningsmässigt,
  eftersom SSO i praktiken är ett HÅRT krav hos många regioner/kommuner, inte bara en
  avtalsfråga. Utan den blockerar Etapp 13a–13e ändå inte köpbeslutet fullt ut hos den typen
  av kund.
- Firebase Auth stödjer SAML 2.0 och OIDC som federerade providers. Arbetet ligger i:
  vilken IdP hör till vilken organisation (ny konfiguration på `organisationer/{orgId}`),
  att SSO-inloggning ska kunna samexistera med e-post/lösenord för mindre kunder som inte
  har en egen IdP, och att den befintliga inbjudningsflödet (fas 25/Etapp 6c) ska kunna peka
  en inbjuden användare mot rätt inloggningssätt.
- **Beslutspunkt för ägaren innan byggstart:** SAML eller OIDC som första prioritet (OIDC är
  enklare att implementera och det som Microsoft Entra ID rekommenderar för nya
  integrationer; SAML kan ändå krävas av äldre kundmiljöer).
- **Klart-kriterium för just detta delmål:** en användare hos en kund med konfigurerad IdP
  kan logga in med sitt Entra-konto och hamnar i rätt organisation med rätt roll, samtidigt
  som en annan kund utan SSO fortsätter fungera med e-post/lösenord precis som idag.

### 13g – WCAG-A-snabbfixar (SYN-6) ✅ KLAR *(ny – saknades i tidigare utkast)*

- De fyra kvarvarande nivå A-bristerna som redan identifierades och dokumenterades i
  `TILLGANGLIGHETSREDOGORELSE.md` (fas 34) men aldrig schemalades i en etapp: inget
  `<main>`-landmärke/hoppa-till-innehåll-länk, statisk `<title>` som inte ändras per route,
  bekräftelsedialogens saknade Esc/fokusfälla/tillgängliga namn, rollväljarens saknade
  tillgängliga namn i adminpanelen.
- Hör hemma i den här etappen av samma skäl som resten: låg insats, tar bort ett konkret
  upphandlingshinder (en offentlig upphandlare frågar efter en tillgänglighetsredogörelse
  *utan* kända A-brister, inte en som räknar upp dem).
- **Arbetsuppgift:** åtgärda de fyra punkterna, uppdatera `TILLGANGLIGHETSREDOGORELSE.md`
  från "delvis förenlig" till (förhoppningsvis) "helt förenlig" eller motivera vad som
  eventuellt kvarstår, stäng Linear-ärendet SYN-6.
- **Resultat:** samtliga fyra punkter åtgärdade i kod – se `UTVECKLINGSLOGG.md` fas 46 för
  den fullständiga tekniska beskrivningen. `TILLGANGLIGHETSREDOGORELSE.md` uppdaterad med
  status per rad i tabellen; dokumentet ändras INTE till "helt förenlig" eftersom sju andra
  punkter (#4–#6, #8–#11) fortfarande kvarstår och är oförändrat spårade i SYN-6 – det vore
  fel att påstå full förenlighet. Linear-ärendet SYN-6 kunde inte stängas från den här
  sessionen (ingen Linear-verktygsåtkomst tillgänglig i detta körningsläge) – **ägaren
  behöver själv uppdatera SYN-6** med att fyra av elva punkter är klara, resten kvarstår.
  Version bumpad 5.25.0 → 5.25.1 eftersom detta är en faktisk, användarmärkbar
  beteendeändring (till skillnad från 13a–13f som är ren dokumentation).

**Klart när:** de fem dokumenten (13a–13e) finns i repot, `PITCH.md` matchar aktuell
version, ägaren kan svara på en IT-avdelnings standardfrågor utan att skriva något nytt,
SSO fungerar för minst en testad IdP-konfiguration (13f), och tillgänglighetsredogörelsen
är uppdaterad utan kända A-brister (13g).

---

# Etapp 14 – Exporterbar revisionslogg med begränsad manipuleringsdetektion

**Varför:** Kundens IT-säkerhetsgranskning frågar alltid "kan ni visa vem som gjorde vad, och
kan loggen manipuleras?". Ni har redan en ändringslogg i appen – det här gör den
granskningsbar.

**Modul:** `revisionslogg` (gate:ad, kan ingå i ett dyrare paket).

> **Viktig begränsning att vara ärlig om, både internt och mot kund (jfr hur
> `SAKERHETSRAPPORT.md` redan är ärlig om PII-filtrets gränser):** hashkedjan nedan skyddar
> mot att en **icke-privilegierad** angripare (en användare med en giltig men begränsad
> Auth-session) manipulerar eller raderar en enskild post direkt i Firestore. Den skyddar
> **INTE** mot någon med Firebase-konsolåtkomst eller Admin SDK-behörighet (t.ex. en
> superadmin på leverantörssidan, eller vid ett komprometterat tjänstekonto) – den personen
> kan i princip skriva om hela kedjan, inklusive omräknade efterföljande hashar. Beskriv
> detta explicit i exporten (14d) och i `avtal/IT-FAKTABLAD.md` (13d): "skyddar mot
> obehörig ändring via normal appanvändning, är inte en garanti mot en administratör med
> full systemåtkomst." Att lova mer än så håller inte vid en riktig incident.

### 14a – Skrivskyddad loggcollection

- Ny collection `revisionslogg` med fält: `organisationId`, `tidpunkt` (serverTimestamp),
  `aktorUid`, `aktorRoll`, `handelsetyp`, `objektTyp`, `objektId`, `sammanfattning`,
  `foregaendeHash`, `hash`.
- **Firestore-regler:** ingen klient får `create`, `update` eller `delete` – enbart
  Cloud Functions (admin SDK) skriver. Läsning: superadmin och leverantörsadmin i samma
  organisation.
- **Test:** `tests/rules/revisionslogg.test.mjs` som bevisar att en inloggad superadmin
  *inte* kan skriva, uppdatera eller radera en post.

### 14b – Hashkedja

- Varje post får `hash = sha256(foregaendeHash + kanoniserad JSON av postens fält)`.
- En brytning i kedjan avslöjar en manipulerad eller borttagen post – men se
  begränsningsrutan ovan för vad detta faktiskt skyddar mot.
- Skrivningen måste ske serialiserat per organisation – använd en Firestore-transaktion mot
  ett `revisionsloggHuvud/{organisationId}`-dokument som håller senaste hash.
- **Prestandanotis:** en Firestore-transaktion mot ett enda dokument har en praktisk
  skrivfrekvensgräns (riktvärde ~1/s sustained). Om en enskild organisation loggar många
  händelser snabbt (t.ex. inloggningsförsök för många användare samtidigt) kan den
  serialiserade skrivningen bli en flaskhals. Sannolikt inget problem i pilotskala, men mät
  det innan en stor kund tas emot – bygg inte in ett antagande om obegränsad skrivtakt.
- **Test:** `tests/functions/revisionslogg-hash.test.mjs` – skriv tre poster, verifiera
  kedjan, mixtra med en post och verifiera att verifieringsfunktionen larmar.

### 14c – Vilka händelser som loggas

Minimum: inloggning misslyckad/lyckad, rollbyte, användare skapad/inaktiverad, rutin
publicerad/avpublicerad/raderad, godkännande av kliniskt stöd, ändring av
`installningar/geminiBudget`, modulgating ändrad, organisation etablerad/pausad/avetablerad,
export av revisionslogg.

- **Arbetsuppgift:** en central hjälpfunktion `loggaRevision()` i `functions/index.js`,
  anropad från befintliga flöden. Inga fritextfält från användare in i loggen utan att
  passera PII-kontrollen.

### 14d – Export och verifiering

- Adminvy: filtrera på datum, aktör, händelsetyp → export som CSV **och** JSON.
- Exporten innehåller hashkedjan, en verifieringsinstruktion, **och begränsningstexten från
  rutan ovan** – en granskare ska förstå exakt vad kontrollen bevisar och inte bevisar.
- Knapp "Verifiera kedjan" som kör kontrollen på servern och visar resultat.
- Själva exporten loggas (se 14c).

**Klart när:** en granskare kan få en fil, köra en dokumenterad kontroll och konstatera att
inga poster ändrats eller tagits bort *inom ramen för vad kontrollen faktiskt täcker* –
med den begränsningen tydligt kommunicerad, inte dold.

---

# Etapp 15 – Självbetjäningsonboarding av ny kund

**Varför:** Multi-tenant-lagret finns sedan fas 18/25, men varje ny kund kräver fortfarande
manuellt arbete av ägaren. Så länge det är sant går verksamheten inte att skala, och
prissättning blir en gissning.

**Modul:** leverantörsfunktion, inte kundgate:ad.

**Beroende:** bör inte tas i skarp drift mot en extern, betalande kund innan `enforceAppCheck`
(Etapp 12c-ii, väntar på mätperiod efter fas 40) är aktiverat – annars tas nya kunder emot
utan det skyddslagret på plats. Se beslutspunkt 6 nedan.

### 15a – Etableringsguide (leverantörsadmin)

- Formulär: organisationsnamn, org.nr, verksamhetstyp, kontaktperson, valda moduler,
  användartak.
- Skapar organisationen, första superadmin-inbjudan, standardinnehåll (rutinmallar per
  verksamhetstyp finns sedan fas 31) och en välkomstcheckista i appen.
- Ersätter dagens manuella steg – dokumentera vilka de är innan ni bygger, så inget tappas.

### 15b – Guidad uppstart för kundens superadmin

- Checklista i appen: bjud in kollegor, sätt roller, importera första rutinerna (bulkimport
  finns sedan fas 29), aktivera 2FA-policy, sätt Gemini-budget.
- Progressindikator. Organisationen räknas som "i drift" när checklistan är klar.

### 15c – Användnings- och kostnadsmätning per organisation

- Månadsvis sammanställning per organisation: aktiva användare, antal rutiner, AI-anrop och
  AI-kostnad (kostnadshistoriken finns sedan fas 22), lagringsvolym.
- Vy hos leverantörsadmin + export. Detta är faktureringsunderlaget och gör en prismodell
  möjlig att sätta på riktiga siffror.

### 15d – Avtals- och betalningsflöde

- **Beslutspunkt för ägaren:** ska avtalssignering och betalning ske i appen (kräver
  integration och nytt regelverk kring betalningsuppgifter) eller utanför, med enbart en
  statusflagga i appen?
- Rekommendation: börja med statusflagga (`avtalsstatus`: offert / signerat / aktiv /
  pausad / avslutad) och manuell fakturering. Bygg inte betalningsintegration förrän kund
  nummer tre finns.

### 15e – Provperiod och automatisk pausning

- `provperiodSlut` per organisation, varning i appen 14/7/1 dag före, automatisk övergång
  till pausat läge (befintlig pausfunktion från fas 25) via schemalagt jobb.
- Pausat läge = läsbehörighet kvar, ingen ny skrivning. Radera aldrig kunddata automatiskt.

**Klart när:** ägaren kan etablera en ny kund från noll till inloggad superadmin utan att
öppna Firebase-konsolen – och App Check-enforcement (12c-ii) är på plats innan detta
används mot en riktig, extern kund.

---

# Etapp 16 – Ledningens veckopuls (mail)

**Varför:** Chefer loggar inte in av sig själva. Ett kort mail varje vecka är det som gör
att ledningsrapporten och kvitteringssiffrorna faktiskt används – och det som håller
förnyelsesamtalet vid liv.

**Modul:** `veckopuls`.

### 16a – Välj och koppla in e-postleverantör

- **Beslutspunkt:** Firebase-tillägget "Trigger Email" mot egen SMTP, eller en EU-baserad
  tjänst (t.ex. Brevo/Postmark-motsvarighet med EU-drift).
- Kravet som avgör: leverantören ska in i underbiträdesförteckningen (etapp 13b), så välj
  en med EU-datalagring och tecknat PUB-avtal.
- Ingen patient- eller personuppgift utöver mottagarens namn och e-post får gå i mailet.

### 16b – Innehåll och generering

- Fem rader: nya/ändrade rutiner denna vecka, kvitteringsgrad på pågående utskick, antal
  personer som inte kvitterat med deadline inom 7 dagar, mest sökta uttryck utan träff,
  öppna bristanmälningar (etapp 20) eller rutiner som passerat granskningsdatum.
- Genereras av ett schemalagt jobb (mönster finns sedan fas 20/22). Återanvänd
  ledningsrapportens dataunderlag (fas 30) – bygg inte en parallell beräkning.

### 16c – Prenumeration och avregistrering

- Per användare: på/av, veckodag, roll-filter. Endast roller med ledningsansvar erbjuds.
- Avregistreringslänk i varje mail. Prenumerationsstatus loggas i revisionsloggen (etapp 14,
  om den är byggd vid det här laget – annars en vanlig ändringslogg-post).

### 16d – Robusthet

- Fel vid utskick får aldrig fälla det schemalagda jobbet för övriga organisationer –
  fånga per mottagare, rapportera till Sentry (finns sedan fas 33).
- Torrkörningsläge som genererar och visar mailet i adminpanelen utan att skicka. Använd det
  för att verifiera innehållet innan första skarpa utskicket.

**Klart när:** en chef får ett läsbart mail varje måndag och kan klicka sig rakt in i rätt
vy i appen.

---

# Etapp 17 – Rollbaserad startvy och akutläge

**Varför:** Det här är den billigaste förändringen med störst upplevd effekt i en demo, och
den är en förutsättning för att checklistläget (etapp 18) ska nås snabbt när det gäller.

**Modul:** ingår i grundfunktionen.

### 17a – Rollbaserad startvy

- Startsidan visar innehåll utifrån användarens roll: sjuksköterska ser kliniskt stöd och
  förråd överst, VEC ser administration och kvitteringsläge, förrådsansvarig ser
  bristanmälningar.
- Konfigurerbart per organisation av superadmin (vilka block som visas per roll), med
  förnuftiga standardvärden så att ingen behöver konfigurera något för att komma igång.
- Enkel implementation: en `startvyKonfiguration`-post per organisation + befintlig
  rollkontroll. Undvik ett generellt widget-ramverk i första versionen.

### 17b – Snabbåtkomst och senast använda

- "Senast öppnade" och "Fästa rutiner" per användare (lokalt + synkat).
- Fästning är per användare, inte per roll – personalen vet själva vad de behöver.

### 17c – Akutläge

- En tydligt avvikande knapp på startsidan → helskärmsvy med stor typografi, hög kontrast,
  få val: kuraterade tidskritiska rutiner, larmnummer från kontaktlistan, roll-/ansvarslista
  för pågående skift.
- Innehållet kurateras av VÖL/superadmin: en flagga `akutlage: true` på rutiner, max ~12
  poster, manuell ordning.
- **Måste fungera offline.** Akutlägets innehåll cachas aggressivt av service workern
  (offline-center finns sedan fas 20) – det är den enda vyn där offline är ett hårt krav.
- Ingen sökning krävs för att nå innehållet. Max två tryck från låst skärm på en installerad
  PWA.

### 17d – Tillgänglighet under stress

- Träffytor minst 48×48 px, ingen tidsberoende interaktion, fungerar med handskar och i
  starkt ljus (kontrastkontroll även i ljust läge).
- Testa på en riktig enhet i verksamheten innan etappen stängs.

**Klart när:** en ny användare kan hitta rätt utan att söka, och akutläget öppnas och
fungerar med flygplansläge på.

---

# Etapp 18 – Checklistläge ("kör rutinen")

**Varför:** Det här är skillnaden mellan en dokumentdatabas och ett arbetsverktyg – och det
enskilt starkaste demomomentet. Det är också etappen med störst regulatorisk risk, så läs
beslutspunkten först.

**Modul:** `checklistlage`.

> **⚠ Beslutspunkt före byggstart – MDR.** En funktion som ger stegvisa instruktioner kan
> börja glida mot medicinteknisk programvara, särskilt om den räknar ut doser eller föreslår
> beslut. Håll första versionen strikt till att **återge organisationens eget, godkända
> innehåll i en annan layout** – ingen beräkning, ingen rekommendation, inget som inte redan
> står i den godkända rutinen. Dokumentera ställningstagandet i `SAKERHETSRAPPORT.md`.
> Doseringsberäkning är en separat framtida fråga som kräver juridiskt underlag.

> **⚠ Beslutspunkt – journalföring.** En logg över "vem körde vilken checklista på vilken
> patient" är journalföring och en helt annan regulatorisk värld. Första versionen loggar
> **aggregerat och utan personkoppling**: antal körningar per rutin, andel slutförda,
> genomsnittlig tid. Ingen patientidentifierare, inget fritextfält i körningen.

### 18a – Datamodell för steg

- Utöka `rutiner` med ett valfritt `steg`-fält: ordnad lista med `text`, valfri `bild`,
  valfri `varning`, valfri `timerSekunder`.
- Rutiner utan steg fungerar precis som idag. Bakåtkompatibelt, ingen migrering.
- Ändringar i `steg` följer samma godkännandeflöde som rutinen i övrigt – ett kliniskt
  stöd-steg får inte publiceras utan VÖL-godkännande.

### 18b – Redigerare

- Steglista i rutinformuläret: lägg till, ta bort, dra för att sortera.
- **"Föreslå steg" via AI:** dela upp befintlig rutintext i stegförslag. Går under befintlig
  Gemini-budgetspärr, resultatet är alltid ett utkast som måste granskas, och posten behåller
  `kalla: "gemini"`-hanteringen. Auto-publicera aldrig.
- PII-kontroll på stegtexterna, både klient och regel.

### 18c – Körvy

- Ett steg i taget, stor text, "klart"-knapp, förloppsindikator, möjlighet att hoppa bakåt.
- Timer på steg som har det, med hörbar och visuell signal.
- **Fortsätt där du var** om appen stängs eller telefonen låses (lokalt, inte i molnet).
- Fungerar offline för rutiner som redan är cachade.

### 18d – Aggregerad användningsstatistik

- Per rutin: antal påbörjade, antal slutförda, median-tid, vilket steg flest avbryter på.
- Avbrottssteget är guld för kvalitetsarbetet – det pekar ut var rutinen är otydlig eller
  fel. Lyft in det i ledningsrapporten (fas 30) och veckopulsen (etapp 16).
- Firestore-regler: skrivning endast via Cloud Function, aggregerat, ingen `aktorUid` sparad.

**Klart när:** en rutin kan köras från början till slut på en telefon utan nät, och
ledningen kan se var körningar avbryts.

---

# Etapp 19 – Kompetenspaketet

*Introduktionsspår, mikrokviss och kompetensmatris hör ihop och delar datamodell – bygg dem
i den ordningen, men i samma etapp.*

**Varför:** Läskvitteringen finns redan och är produktens starkaste ledningsargument. Det här
gör den till ett kompetensverktyg: från "har klickat läst" till "kan visa att personalen kan".

**Modul:** `kompetens`.

### 19a – Introduktionsspår för nyanställda

- Nytt objekt `introduktionsspar`: namn, målroll, ordnad lista av rutiner/anslag, indelat i
  etapper (dag 1 / vecka 1 / månad 1) med rekommenderad tidpunkt.
- Tilldelas automatiskt när en användare skapas med en viss roll, eller manuellt av VEC.
- Vy för den nyanställde: progress, nästa steg, uppskattad tid.
- Vy för chefen: alla pågående introduktioner, vem som ligger efter.
- Återanvänd befintlig kvitteringsmekanik (`useLaskvittering`) – bygg inte en parallell
  "läst"-status.

### 19b – Mikrokviss efter läskvittering

- Valfritt per rutin: 2–4 flervalsfrågor som visas när användaren kvitterar.
- Fel svar → visa rätt svar med hänvisning till stycket i rutinen, låt personen försöka igen.
  Syftet är förståelse, inte betyg.
- **Håll tonen rätt:** resultatet ska inte kunna användas som disciplinärt underlag. Spara
  per användare "godkänd/ej godkänd ännu", inte varje felsvar. Berätta det för personalen –
  annars sjunker användningen.
- **"Föreslå frågor" via AI** på samma villkor som 18b: utkast, budgetspärr, alltid granskat
  av en människa innan publicering.
- Kvittering med kviss räknas först när kvissen är klarad – uppdatera kvitteringsrapporten
  och exporten.

### 19c – Kompetensmatris per roll

- Definiera per roll vilka rutiner som är **obligatoriska** och med vilken
  omkvitteringsfrekvens (t.ex. årligen).
- Matrisvy: roller × obligatoriska rutiner, med status per person (klar / förfaller snart /
  förfallen / saknas).
- Gap-lista och export till APT-underlag och ledningsrapporten.
- Automatisk omkvittering: när en rutin uppdateras väsentligt eller frekvensen löper ut,
  återställs status och personen får en notis. Skilj på redaktionell och väsentlig ändring –
  annars drunknar personalen i notiser. Låt den som publicerar kryssa i "väsentlig ändring".

**Klart när:** en chef kan öppna en vy och på tio sekunder se vilka i sin personalgrupp som
saknar en obligatorisk rutin, och exportera det till APT.

---

# Etapp 20 – Bristanmälan i två klick

**Varför:** Minst arbete av allt i planen och omedelbart synlig nytta i vardagen. Kan
tidigareläggas fritt om en pilot behöver ett snabbt tillskott.

**Modul:** ingår i logistikmodulen.

### 20a – Anmälningsflöde

- Knapp direkt på förrådsartikelkortet: "Slut/lågt saldo" → valfri kommentar → skickat.
- Ny collection `bristanmalningar`: `organisationId`, `artikelId`, `status`
  (ny / hanterad / avvisad), `anmaldAv`, `tidpunkt`, `kommentar`.
- Fritextkommentaren måste genom PII-filtret i tre lager (se genomgående krav 1).

### 20b – Hantering

- Vy för förrådsansvarig: öppna anmälningar, sortering på antal anmälningar per artikel
  (tre personer som anmäler samma sak = verklig brist).
- Notis till förrådsansvarig vid ny anmälan, kvittens till anmälaren när den hanteras.
- Dubblettskydd: samma artikel anmäld inom 24 h slås ihop istället för att skapa en ny post.

### 20c – Utgångsdatumbevakning

- AI:n läser redan ut utgångsdatum vid bildtolkning (fas 8). Använd det: schemalagd
  kontroll som listar artiklar som går ut inom 30 dagar, och notis till förrådsansvarig.
- Ta med öppna bristanmälningar och utgående artiklar i veckopulsen (etapp 16).

**Klart när:** en sjuksköterska kan anmäla en brist på under fem sekunder utan att lämna
artikelkortet.

---

# Etapp 21 – Källbevakning

**Varför:** Angriper produktens djupaste löfte – "rutinerna är aktuella". Ligger sist för att
den kräver mest omtanke kring driftkostnad och falsklarm, inte för att den är minst värd.

**Modul:** `kallbevakning` (bygger på klinikstöd-modulen).

### 21a – Referenser som data

- Nytt fält på `rutiner`: `externaKallor` – lista av URL:er.
- **Endast domäner ur `GODKANDA_KALLDOMANER`.** Validera i klient, i Cloud Function och i
  Firestore-regeln, precis som klinikstöd-sökningens domänspärr (finns redan i
  `functions/index.js`). Håll listorna synkade – samma krav som redan gäller i CLAUDE.md.
- Migrering: hitta URL:er som redan står i befintlig rutintext och föreslå dem som
  strukturerade referenser. Förslag, inte automatisk ändring.

### 21b – Bevakningsjobb

- Schemalagt jobb (veckovis) hämtar varje refererad sida och jämför en hash av
  huvudinnehållet mot senast sparade.
- **Måste vara snällt mot källorna, och respektera mer än robots.txt:** respektera
  `robots.txt`, sprid anropen över tid, sätt en tydlig User-Agent, cacha per URL över alla
  organisationer så att samma sida inte hämtas en gång per kund. Kontrollera också källans
  användarvillkor – en del sidor tillåter enligt robots.txt men förbjuder skrapning i sina
  ToS; robots.txt är inte hela svaret juridiskt.
- Skilj på verklig ändring och brus (datumstämplar, annonser, navigation) – annars blir
  funktionen en falsklarmsmaskin och slås av. Börja med rubrik- och brödtextextraktion, mät
  falsklarmsfrekvensen under några veckor innan notiser aktiveras för kund.

### 21c – Notis och åtgärd

- Rutinens ägare (ägarskap finns sedan fas 16/17) får notis: "Källan X har uppdaterats sedan
  rutinen granskades."
- Vy som visar vad som ändrats, med två val: "granskad, ingen ändring behövs" (uppdaterar
  granskningsdatum) eller "öppna för redigering".
- Antal obesvarade källvarningar in i ledningsrapporten och veckopulsen.

### 21d – Kostnads- och driftkontroll

- Tak för antal hämtningar per organisation och månad, i samma anda som Gemini-budgetspärren,
  styrbart från adminpanelen.
- Trasig länk (404) rapporteras som en egen typ – det är i sig ett kvalitetsfynd.

**Klart när:** en rutin vars källa ändrats syns som "behöver granskas" utan att någon
människa upptäckt det manuellt, och falsklarmen är få nog att notiserna tas på allvar.

---

## Sammanfattning

| Etapp | Innehåll | Insats | Främsta värde |
|---|---|---|---|
| 13 | Upphandlings- och granskningspaket (+ SSO, + WCAG-A) | Låg–hög (13f/13g är kod) | Tar bort inköpsstoppet |
| 14 | Revisionslogg med begränsad manipuleringsdetektion | Medel | Klarar IT-säkerhetsgranskning, ärligt om gränser |
| 15 | Självbetjäningsonboarding | Medel–hög | Gör verksamheten skalbar |
| 16 | Veckopuls till chefer | Låg–medel | Håller ledningen kvar i produkten |
| 17 | Rollbaserad startvy + akutläge | Låg–medel | Störst demoeffekt per krona |
| 18 | Checklistläge | Hög | Uppslagsverk → arbetsverktyg |
| 19 | Kompetenspaketet | Hög | Starkaste ledningsargumentet |
| 20 | Bristanmälan | Låg | Snabb vardagsnytta |
| 21 | Källbevakning | Medel–hög | Infriar löftet "alltid aktuellt" |

## Beslutspunkter som kräver ägaren, inte kod

1. **Etapp 13b:** faktisk datalagringsregion för Firestore och Storage – Functions-regionen
   är redan verifierad (europe-west1, konsekvent). Bara databas-/bucket-regionen återstår.
2. **Etapp 13f (ny):** SAML eller OIDC som första prioritet för SSO, och om delmålet ska
   göras inom Etapp 13 eller brytas ut till en egen session givet dess storlek.
3. **Etapp 14:** godkänna formuleringen av hashkedjans begränsning (se rutan i etappen)
   innan den beskrivs för en kund.
4. **Etapp 15d:** avtal och betalning i appen eller utanför.
5. **Etapp 16a:** val av e-postleverantör med EU-drift och PUB-avtal.
6. **Etapp 18:** MDR-ställningstagandet och gränsen mot journalföring – ta detta *före*
   byggstart, inte efter.
7. **Etapp 19b:** hur kvissresultat får användas, kommunicerat till personalen innan
   funktionen slås på.
8. **Kvarvarande från Etapp 12:** `enforceAppCheck: true` (12c-ii) efter mätperioden, samt
   testet i 12c-iii. **Måste** vara på plats innan etapp 15 tar emot externa kunder i skarp
   drift (inte bara en rekommendation – se beroenderaden i Etapp 15).
