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

## Status (2026-07-28)

Etapp 13a–13e, 13g, 14, 15, 17–21 är byggda och klara (se ✅ KLAR-markeringar nedan; 17d är
delvis klar, se den etappen). **Två delmål är medvetet PAUSADE och väntar på ägaren** – inte
bortglömda, se markeringarna ⏳ FRAMTIDA vid respektive rubrik nedan:

- **13f – SSO / Microsoft Entra ID.** Väntar på ett beslut: SAML eller OIDC som
  förstahandsprioritet (se beslutspunkten i avsnittet). Störst enskilt delmål i Etapp 13 –
  kod, inte bara dokument – och kan göras som en egen session.
- **16 – Ledningens veckopuls (mail).** Väntar på ett beslut: val av e-postleverantör med
  EU-drift och PUB-avtal (se beslutspunkten i avsnittet). Så länge den saknas visas
  motsvarande data (bristanmälningar, utgående artiklar, källvarningar) direkt på respektive
  sida istället för i ett veckomail – se Etapp 20c/21c.

Båda ligger kvar i sin ordinarie plats i etappordningen nedan och tas upp igen så snart
respektive beslut är taget – de är inte struken ur planen, bara avvaktade.

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

### 13f – SSO / Microsoft Entra ID ⏳ FRAMTIDA *(ny – saknades i tidigare utkast)*

> **Pausad (2026-07-28):** avvaktar ägarens beslut om SAML vs. OIDC (se beslutspunkten
> nedan) innan bygget påbörjas. Kvarstår i planen, inte struken.

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

### 14a – Skrivskyddad loggcollection ✅ KLAR

- Ny collection `revisionslogg` med fält: `organisationId`, `tidpunkt` (serverTimestamp),
  `aktorUid`, `aktorRoll`, `handelsetyp`, `objektTyp`, `objektId`, `sammanfattning`,
  `foregaendeHash`, `hash`.
- **Firestore-regler:** ingen klient får `create`, `update` eller `delete` – enbart
  Cloud Functions (admin SDK) skriver. Läsning: superadmin och leverantörsadmin i samma
  organisation.
- **Test:** `tests/rules/revisionslogg.test.mjs` som bevisar att en inloggad superadmin
  *inte* kan skriva, uppdatera eller radera en post.
- **Resultat:** ny `match /revisionslogg/{loggId}` i `firestore.rules` – läsning kräver
  `arSuperadmin() && matcharMinOrg(...)` eller `arPlattformsadmin()` (leverantörsadmin,
  läser tvärs organisationer, samma mönster som `organisationer/{orgId}`), skrivning
  `if false` rakt av (bara Admin SDK kringgår reglerna). Ny testfil
  `tests/rules/revisionslogg.test.mjs`, 8 tester, tillagd i `test:rules`-scriptet i
  `package.json` (nu 3 testfiler i den kedjan). Alla 8 gröna, hela `test:rules`-svepet
  (62+5+8 = 75 tester) grönt.
  **Viktigt fynd vid premisskontroll (genomgående krav 8):** en redan existerande
  `auditlogg`-collection upptäcktes under arbetet – den tillåter i dag att **VILKEN
  inloggad klient som helst** skriver en egen post direkt (`allow create: if
  arInloggad() && ...`, ingen rollkontroll). Det bekräftar Etapp 14:s premiss skarpare än
  planen antog: dagens logg är inte bara "utan manipuleringsdetektion" utan rent
  klientskrivbar, vilket gör `revisionslogg` (helt stängd för klienter) till en reell
  förstärkning, inte bara ett komplement. `auditlogg` lämnades orörd – den fyller
  fortfarande sitt syfte som en enkel, snabb ändringslogg, men bör inte förväxlas med
  `revisionslogg`s granskningsgaranti. Kommentaren i `firestore.rules` förklarar
  skillnaden på plats.

### 14b – Hashkedja ✅ KLAR

- **Resultat:** `loggaRevision()` och `verifieraRevisionskedja()` implementerade i
  `functions/index.js`. `loggaRevision()` kör en Firestore-transaktion mot
  `revisionsloggHuvud/{organisationId}` (läser `senasteHash`, skriver den nya posten OCH
  det uppdaterade huvuddokumentet atomiskt), räknar `hash = sha256(kanoniserad JSON av
  posten inkl. foregaendeHash)` via en egen `kanoniseraJSON()`-hjälpfunktion (sorterade
  nycklar, så identiskt innehåll alltid ger samma hash oavsett skrivordning).
  `tidpunkt` sätts som `Date.now()` snarare än `FieldValue.serverTimestamp()`, eftersom
  hashen måste räknas över ett känt värde innan skrivningen – fortfarande betrott, koden
  körs bara på servern.
  `verifieraRevisionskedja(organisationId)` läser hela kedjan i skrivordning och bygger
  om den från noll: kontrollerar både att `foregaendeHash`-länken stämmer mot föregående
  post OCH att den lagrade hashen matchar en omräkning av postens faktiska innehåll (så en
  post vars fält ändrats i efterhand utan att hasha om upptäcks också, inte bara en trasig
  länk).
- **Ny composite-index** i `firestore.indexes.json` (`revisionslogg`:
  organisationId ASC + tidpunkt ASC) för `verifieraRevisionskedja()`s fråga.
- **Test:** ny `tests/functions/revisionslogg-hash.test.cjs`, 4 tester – bygger en giltig
  treposters-kedja och verifierar den, kontrollerar att huvuddokumentet håller rätt hash,
  manipulerar en post direkt i Firestore (ändrar `sammanfattning` utan att räkna om hash)
  och bevisar att det upptäcks, samt en separat organisation där bara
  `foregaendeHash`-länken kapas och det också upptäcks. Tillagd i `test:functions`-scriptet
  i `package.json`.
- **Ej gjort i detta delmål (medvetet, hör till 14c/14d):** ingen anropsplats
  (`loggaRevision()` är inte kopplad till några befintliga flöden än) och ingen
  admin-vy/export/"verifiera kedjan"-knapp.

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

### 14c – Vilka händelser som loggas ✅ KLAR (avgränsad efter premisskontroll)

Minimum: inloggning misslyckad/lyckad, rollbyte, användare skapad/inaktiverad, rutin
publicerad/avpublicerad/raderad, godkännande av kliniskt stöd, ändring av
`installningar/geminiBudget`, modulgating ändrad, organisation etablerad/pausad/avetablerad,
export av revisionslogg.

- **Arbetsuppgift:** en central hjälpfunktion `loggaRevision()` i `functions/index.js`,
  anropad från befintliga flöden. Inga fritextfält från användare in i loggen utan att
  passera PII-kontrollen.
- **Resultat, och en verklig premisskontroll (genomgående krav 8):** planens formulering
  ("anropad från befintliga flöden") antog implicit att händelserna redan går via Cloud
  Functions. Vid genomläsning visade det sig att bara en del av dem gör det:
  - **Direkta anrop (Admin SDK, säker aktör = `request.auth.uid`):**
    `skapaOrganisation` → `organisation_etablerad`, `pausaOrganisation` →
    `organisation_pausad`/`organisation_atveraktiverad`, `exporteraOrganisation` →
    `organisation_exporterad`, `losInInbjudan` → `anvandare_skapad` (loggas EFTER
    funktionens egen transaktion, inte inifrån den – `loggaRevision()` kör sin egen
    transaktion och kan inte nästlas i en annan), `tvingaUtloggning` →
    `anvandare_utloggning_tvingad`.
  - **Rutinlivscykeln skrivs DIREKT av klienten till Firestore** (`useRutiner.js`), inte
    via en Cloud Function. Löst med två Firestore-triggers
    (`onDocumentCreated`/`onDocumentUpdated` på `rutiner/{rutinId}`) vars kärnlogik ligger
    i separata, direkt anropbara funktioner (`hanteraRutinSkapad`/`hanteraRutinAndrad`) –
    eftersom `test:functions` bara kör firestore+storage-emulatorerna, inte
    functions-emulatorn, är det den enda platsen en trigger faktiskt kan verifieras av ett
    automatiskt test. Aktören hämtas ur fält klienten redan sparar
    (`skapadAv`/`godkandAv`/`borttagenAv`), eftersom en trigger inte automatiskt vet vem
    som gjorde skrivningen. Täcker "rutin publicerad" (direktgodkänd vid skapande) och
    "rutin godkänd" (övergång utkast→godkänd) samt mjuk radering.
  - **"Rutin avpublicerad" loggas INTE** – funktionen finns inte i appen (bara
    utkast→godkänd och mjuk radering existerar). Planens formulering stämde inte mot
    koden; korrigerat istället för att uppfinna en händelse som inte kan inträffa.
  - **Inloggning lyckad/misslyckad, rollbyte, modulgating-ändring och
    geminiBudget-ändring loggas INTE i detta delmål.** Alla fyra sker idag som direkta
    klient-Firestore-skrivningar (`uppdateraRoll` i `useAnvandare.js` skriver bara
    `{role}`, ingen aktör; modul-/budgetändringar motsvarande) UTAN ett aktörsfält att
    läsa i en trigger, och inloggning sker helt inom Firebase Auth SDK:t utan att någon
    Cloud Function är inblandad alls (skulle kräva Identity Platform-blockerande
    funktioner – ett större arkitekturbeslut). Att bygga in dessa nu hade krävt antingen
    nya klientskrivna aktörsfält (en mindre men bred ändring över flera formulär) eller en
    Auth-blockerande funktion (ett separat beslut). Dokumenterat som kvarstående i stället
    för att gissa en lösning.
- **Ny testfil:** `tests/functions/revisionslogg-handelser.test.cjs`, 11 tester – bevisar
  att varje ovanstående call-site faktiskt skriver rätt `handelsetyp`/aktör till
  `revisionslogg`, samt att en oförändrad rutin-skrivning INTE loggar något.
  **Miljöfix som gjordes samtidigt:** `test:functions`-scriptet körde bara
  firestore+storage-emulatorerna – `tvingaUtloggning`s `revokeRefreshTokens()`-anrop kräver
  Auth-emulatorn. `--only firestore,storage,auth` tillagt i scriptet (`package.json`),
  vilket även fixade att `tvingaUtloggning` nu kan testas alls (var otestad sedan tidigare,
  oberoende av detta delmål).

### 14d – Export och verifiering ✅ KLAR

- Adminvy: filtrera på datum, aktör, händelsetyp → export som CSV **och** JSON.
- Exporten innehåller hashkedjan, en verifieringsinstruktion, **och begränsningstexten från
  rutan ovan** – en granskare ska förstå exakt vad kontrollen bevisar och inte bevisar.
- Knapp "Verifiera kedjan" som kör kontrollen på servern och visar resultat.
- Själva exporten loggas (se 14c).
- **Resultat:**
  - **Backend:** två nya callables i `functions/index.js` – `verifieraRevisionsloggAdmin`
    (kör `verifieraRevisionskedja()` från 14b, returnerar resultat + en ny konstant
    `REVISIONSLOGG_BEGRANSNINGSTEXT` som ordagrant följer begränsningsrutan i denna plans
    Etapp 14) och `exporteraRevisionslogg` (samma sak, men loggar dessutom sig själv som
    `revisionslogg_exporterad` via `loggaRevision()` – uppfyller kravet "själva exporten
    loggas"). Behörighet: superadmin i egen organisation, eller leverantörsadmin med
    valfri `organisationId`.
  - **Frontend:** ny `src/hooks/useRevisionslogg.js` (direkt Firestore-läsning, samma
    mönster som `useAuditlogg.js` – tillåtet eftersom superadmin redan har läsrätt enligt
    `firestore.rules`, bara skrivning är stängd). Ny `RevisionsloggSektion.jsx` i
    adminpanelen (synlig bara för superadmin): filter på datumintervall, aktör-uid och
    händelsetyp, en "Verifiera kedjan"-knapp som visar resultatet OCH begränsningstexten
    i klartext, samt två exportknappar (CSV/JSON) som hämtar ett färskt kedjeresultat +
    begränsningstext från servern innan filen byggs klientsidan (så exportfilen alltid
    baseras på verifiering vid exporttillfället, inte en gammal cachad status).
  - **Test:** ny `tests/functions/revisionslogg-export.test.cjs`, 6 tester – behörighet
    (superadmin/leverantörsadmin/nekad roll/ej inloggad), att kedjeresultatet och
    begränsningstexten faktiskt kommer med, och att `exporteraRevisionslogg` skriver en
    `revisionslogg_exporterad`-post.
  - **Etapp 14 är därmed helt klar** (14a–14d), med tre medvetet kvarstående,
    dokumenterade luckor från 14c (inloggningshändelser, rollbyte, modul-/budgetändringar).

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

### 15a – Etableringsguide (leverantörsadmin) ✅ KLAR

- Formulär: organisationsnamn, org.nr, verksamhetstyp, kontaktperson, valda moduler,
  användartak. `skapaOrganisation` sparar `orgnr`, `kontaktperson`, `anvandartak` samt
  reserverar `avtalsstatus` ("offert", se 15d) och `provperiodSlut` (null tills 15e).
- Skapar organisationen, första superadmin-inbjudan (om kontaktpersonens e-post angetts –
  återanvänder samma inbjudningsmekanism som Etapp 6c, via en delad `skapaInbjudanIntern`),
  standardinnehåll (rutinmallar per verksamhetstyp, fas 31) och ett välkomstchecklista-
  dokument (`installningar/valkomstchecklista`, steg obockade – 15b bygger den interaktiva
  vyn ovanpå detta).
- Manuella steg som ersätts: (1) att skapa organisationsdokumentet saknade tidigare org.nr/
  kontaktperson/användartak helt, (2) leverantörsadmin kunde inte bjuda in kundens första
  superadmin alls (skapaInbjudan kräver en redan existerande superadmin i organisationen) –
  det krävde tidigare en manuell Firebase-konsol-åtgärd, (3) ingen välkomstchecklista fanns.
- Test: `tests/functions/etapp6.test.cjs` ("skapaOrganisation – Etapp 15a etableringsguide").

### 15b – Guidad uppstart för kundens superadmin ✅ KLAR

- Checklista i appen (`KomIgangChecklista.jsx`, ny hook `useValkomstchecklista.js`): bjud in
  kollegor, sätt roller, importera första rutinerna (bulkimport, fas 29), ta ställning till
  2FA-policy, sätt Gemini-budget. Varje steg länkar direkt till rätt sida (`/admin` eller
  `/ladda-upp`) och bockas av manuellt av superadmin – skrivs direkt till samma
  `installningar/valkomstchecklista`-dokument som 15a skapade, via klient-SDK:t (firestore.rules
  tillät redan en superadmin i egen organisation att skriva dit, ingen ny Cloud Function
  behövdes).
- Progressindikator (stapel + "X av 5 steg"). Visas bara för superadmin på Hem, och bara om
  dokumentet finns (organisationer etablerade före 15a saknar det och ser ingen checklista)
  och inte redan är helt avklarat – "i drift" innebär här att komponenten försvinner, det
  finns inget separat statusfält att sätta.
- Nya rules-tester i `tests/rules/organisationsisolering.test.mjs`: en superadmin kan bocka av
  sin egen organisations steg, men varken fel roll eller fel organisation kommer åt dokumentet.

### 15c – Användnings- och kostnadsmätning per organisation ✅ KLAR

- Ny Cloud Function `manadsrapportOrganisationer` (plattformsadmin, `functions/index.js`):
  en rad per organisation för innevarande månad med aktiva användare, antal icke-borttagna
  rutiner, AI-kostnad/AI-anrop (uppskattat utifrån samma fasta per-anrops-kostnad som
  `reserveraBudget` redan reserverar) och lagringsvolym (Storage-bucketen gås igenom EN gång
  totalt och fördelas per organisation via en uppslagskarta rutin/artikel-id → organisationId,
  istället för en genomgång per organisation).
- Ny vy hos leverantörsadmin (`ManadsrapportSektion.jsx` i `Leverantor.jsx`), hämtas på
  begäran (inte vid varje sidladdning, eftersom bucket-genomgången är för dyr för det) + export
  som CSV (samma nedladdningsmönster som revisionslogg-exporten från Etapp 14d).
- 2 nya emulatortester i `tests/functions/etapp6.test.cjs`.

### 15d – Avtals- och betalningsflöde ✅ KLAR

- **Beslutspunkt för ägaren – TAGEN:** avtalssignering och betalning sker MEDVETET utanför
  appen (manuell fakturering), inte alternativet med en betalningsintegration i appen.
- Ny Cloud Function `satAvtalsstatus` (plattformsadmin, `functions/index.js`): sätter
  `avtalsstatus` (offert/signerat/aktiv/pausad/avslutad – fältet reserverades redan av
  Etapp 15a) på en organisation, loggar `organisation_avtalsstatus_andrad` i revisionsloggen.
  Fristående från `organisationer/{orgId}.status` (drift-på/av, se `pausaOrganisation`) – en
  organisation kan vara avtalsstatus="signerat" utan att ännu vara satt i drift.
  `listaOrganisationer` antar `avtalsstatus: "aktiv"` för organisationer som saknar fältet
  helt (etablerade före Etapp 15a), så en befintlig kund inte plötsligt visas som "offert".
- Ny dropdown i leverantörsvyns organisationslista (`Leverantor.jsx`) för att ändra statusen.
- 5 nya emulatortester i `tests/functions/etapp6.test.cjs`.

### 15e – Provperiod och automatisk pausning ✅ KLAR

- Ny Cloud Function `satProvperiod` (plattformsadmin) sätter/ändrar/tar bort en organisations
  `provperiodSlut` (ISO-datum, fältet reserverades redan i Etapp 15a) – ändrar bara datumet,
  pausar aldrig något självt.
- Nytt dagligt schemalagt jobb `kontrolleraProvperioderSchemalagt` (05:00 Europe/Stockholm,
  kärnlogiken i den fristående `kontrolleraProvperioder()` för testbarhet) pausar en aktiv
  organisation vars provperiod gått ut – återanvänder samma `status: "pausad"`-mekanism som
  `pausaOrganisation`/Etapp 6d, så läsbehörighet finns kvar och ingen kunddata raderas.
- Varning i appen 14/7/1 dag före: ny `ProvperiodBanner.jsx` + `useProvperiod.js`, läser
  samma `provperiodSlut`-fält client-side (redan läsbart för alla organisationsmedlemmar) –
  ingen separat skrivning behövs för själva varningen.
- Ny dropdown/datumfält i leverantörsvyn (`Leverantor.jsx`) för att sätta provperioden.
- 7 nya emulatortester i `tests/functions/etapp6.test.cjs`.

**Etapp 15 är därmed helt klar (15a–15e).**

**Klart när:** ägaren kan etablera en ny kund från noll till inloggad superadmin utan att
öppna Firebase-konsolen – och App Check-enforcement (12c-ii) är på plats innan detta
används mot en riktig, extern kund.

---

# Etapp 16 – Ledningens veckopuls (mail) ⏳ FRAMTIDA

> **Pausad (2026-07-28):** avvaktar ägarens beslut om e-postleverantör (se beslutspunkten i
> 16a) innan bygget påbörjas. Kvarstår i planen, inte struken – motsvarande data (Etapp 20c/
> 21c) visas tills vidare direkt på respektive sida istället för i ett veckomail.

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

### 17a – Rollbaserad startvy ✅ KLAR

- Hem.jsx:s kort-grid visas nu i en ORDNING som beror på användarens roll (`src/config/
  startvy.js`: `STARTVY_BLOCK` + `STARTVY_STANDARD`) – VEC och superadmin ser administration
  överst (kvitteringsläget bor där idag), förrådsansvarig ser logistik (förrådet) överst.
  Bristanmälningar (Etapp 20) finns inte än, så förrådsansvarigs default pekar mot logistik
  istället, dokumenterat i koden.
- Konfigurerbart per organisation: `organisationer/{orgId}/installningar/startvy` (samma
  mönster som `installningar/geminiBudget`/`valkomstchecklista` – superadmin skriver direkt,
  ingen Cloud Function). Ny `useStartvyKonfiguration.js`-hook + admin-sektion
  `StartvyKonfigurationSektion.jsx` (flytta block upp/ned per roll, återställ till standard).
- Enkel implementation som planerat: bara ORDNING på befintliga block, inget nytt
  widget-ramverk. Alla block finns alltid kvar för alla roller.

### 17b – Snabbåtkomst och senast använda ✅ KLAR

- "Fästa rutiner": redan löst av den befintliga favorit-funktionen (`useFavoriter.js`,
  synkad per användare i Firestore) – samma egenskap, bara annan terminologi i planen.
  Inget nytt byggt för det.
- "Senast öppnade" var tidigare bara lokal (localStorage, `utils/senastBesokta.js`). Ny hook
  `useSenastBesokta.js` skriver samma lista till `users/{uid}.senastBesokta` också, så den
  följer med mellan enheter – localStorage-kopian behålls som omedelbar/offline-first källa,
  Firestore-synken sker i bakgrunden. `firestore.rules` utökad så en användare får ändra sitt
  eget `senastBesokta`-fält (samma vitlista som favoriter/snabblänkar).

### 17c – Akutläge ✅ KLAR

- Tydligt avvikande röd knapp direkt under headern på Hem.jsx → `/akutlage`, en helskärmsvy
  (`Akutlage.jsx`, forcerad svart/vit/röd hög kontrast oavsett användarens tema) med bara två
  sektioner: kuraterade tidskritiska rutiner och larmnummer.
- Kuratering: `akutlage`/`akutlageOrdning` på `rutiner` (endast VÖL/superadmin – enforcat i
  `firestore.rules`, inte bara UI, se testerna nedan) via en ny sektion i `RutinFormular.jsx`
  (bara synlig vid redigering av en befintlig, redan godkänd rutin). `akutnummer` på
  `kontakter` (samma roller som redan hanterar kontaktlistan) via `KontaktFormular.jsx`.
  `useAkutlageRutiner.js` läser org-övergripande (alla områden), sorterar klientsidan på
  `akutlageOrdning` – inget nytt sammansatt index.
- **Roll-/ansvarslista för pågående skift skippades medvetet** – ingen datamodell för vem som
  är i tjänst just nu finns (skiftrapporter är fristående drifthändelser, inte en
  bemanningslista). Kräver en ny bemanningsfunktion, utanför den här etappens omfattning.
- **Offline:** ingen separat nedladdningsknapp – `Akutlage.jsx` och kontakt-/rutinfrågorna
  läser via samma Firestore-klient som redan har `persistentLocalCache` (IndexedDB) påslaget
  (Etapp 1). En ny osynlig `AkutlagePrefetch.jsx`, monterad globalt i `App.jsx`, håller
  frågorna "varma" i cachen oavsett vilken sida användaren är på, så innehållet är läsbart
  offline utan att någon först behövt besöka `/akutlage` med nät.
- Ingen sökning krävs: en knapptryckning från Hem (appens `start_url`) rakt in i akutläget.
- 6 nya rules-tester (`tests/rules/organisationsisolering.test.mjs`) som visar att en
  sektionsledare (får redigera kliniskt-stod-innehåll, men är inte VÖL/superadmin) INTE kan
  sätta `akutlage`/`akutlageOrdning`, varken vid skapande eller uppdatering, men fortfarande
  kan redigera rutinens övriga innehåll.

### 17d – Tillgänglighet under stress ⚠ DELVIS

- Träffytor minst 48×48 px och forcerad hög kontrast: gjort för akutläget och dess
  startsidesknapp (`Akutlage.css`, `.hem__akutlage-knapp`). Ingen tidsberoende interaktion i
  akutläget – statiskt kuraterat innehåll, inga timers/auto-uppdateringar där.
- **Inte gjort av mig, kräver en riktig enhet:** "fungerar med handskar och i starkt ljus"
  går inte att verifiera i en kodmiljö utan fysisk hårdvara. Detta måste testas manuellt av
  verksamheten på en riktig telefon/surfplatta innan etappen kan stängas helt, precis som
  planen kräver.

**Klart när:** en ny användare kan hitta rätt utan att söka, och akutläget öppnas och
fungerar med flygplansläge på. (Det sista – verifiering på riktig hårdvara med handskar/i
starkt ljus – är kvar och kräver fysisk närvaro i verksamheten.)

---

# Etapp 18 – Checklistläge ("kör rutinen") ✅ KLAR

**Varför:** Det här är skillnaden mellan en dokumentdatabas och ett arbetsverktyg – och det
enskilt starkaste demomomentet. Det är också etappen med störst regulatorisk risk, så läs
beslutspunkten först.

**Modul:** `checklistlage`.

> **⚠ Beslutspunkt före byggstart – MDR. TAGEN.** Godkänd av ägaren: håll första versionen
> strikt till att återge organisationens eget, godkända innehåll i en annan layout – ingen
> beräkning, ingen rekommendation. Ställningstagandet är dokumenterat i `SAKERHETSRAPPORT.md`
> (tillägget daterat 2026-07-27). Konkret: `steg` är bara `{text, bild, varning,
> timerSekunder}` – inget beräkningsfält finns. "Föreslå steg" (Gemini) delar bara upp en
> REDAN godkänd text, skapar aldrig nytt kliniskt innehåll, och kräver alltid mänsklig
> granskning innan sparning (samma godkännandeflöde som allt annat rutininnehåll).

> **⚠ Beslutspunkt – journalföring. TAGEN.** Användningsstatistiken (18d) är aggregerad och
> personkopplingsfri: ett enda ackumulerande dokument per rutin (samma mönster som
> `visningar`/Etapp 5, inte en rad per körning), ingen patientidentifierare, inget fritextfält
> kopplat till en enskild körning.

### 18a – Datamodell för steg ✅ KLAR

- `rutiner.steg`: en ordnad lista med `{text, bild, varning, timerSekunder}`, helt valfri.
  Rutiner utan steg fungerar precis som innan – inget migrerat.
- `firestore.rules` PII-kontrollerar varje stegs text (samma spärr som titel/innehåll/
  referenser) och begränsar listan till max 12 steg (regelspråket saknar loopar, så
  kontrollen är uppradad per index – ett högre tak hade riskerat att nå Firestores gräns för
  antal utvärderade deluttryck per regelanrop, vilket faktiskt inträffade vid 20 och byggde
  ned till 12 under utvecklingen).
- Ändringar i `steg` följer samma godkännandeflöde som resten av rutinen (ingen egen
  statusspärr utöver den som redan finns för `status`/`akutlage`/`akutlageOrdning`).

### 18b – Redigerare ✅ KLAR

- Steglista i `RutinFormular.jsx` (bara synlig vid redigering av en befintlig rutin): lägg
  till/ta bort/flytta upp/ned (upp/ned-knappar, inget drag-och-släpp-bibliotek).
  "Föreslå steg" via en ny Cloud Function `foreslaChecklistSteg` – delar upp den redan
  skrivna texten i steg, går under samma Gemini-budgetspärr och Intelligence-modulkrav som
  övrig AI-tolkning (med i gating-matrisen, `tests/functions/gatingmatris.test.cjs`).
  Resultatet fylls bara i formuläret, sparas aldrig direkt – vanlig granskning krävs.
- PII-kontroll på stegtexterna både klientsidigt (`kontrolleraPatientuppgifter`) och i
  `firestore.rules` (server-side, den faktiska spärren).

### 18c – Körvy ✅ KLAR

- Ny helskärmsvy `/checklista/{rutinId}` (`Korvy.jsx`): ett steg i taget, stor text,
  "klart"-knapp, förloppsindikator, "föregående"-knapp för att hoppa bakåt.
  Timer på steg som har `timerSekunder`, med hörbar signal (Web Audio-oscillator, inget
  ljudfilsberoende) och en visuellt pulserande "tiden är ute"-indikator.
- **Fortsätt där du var:** lokalt (`utils/checklistFramsteg.js`, localStorage per uid+rutin),
  INTE synkat till molnet – rensas när körningen slutförs.
- Fungerar offline: läser samma `useRutin`-hook som resten av appen, via Firestores redan
  påslagna `persistentLocalCache` (Etapp 1) – ingen särskild cachning krävs utöver att
  rutinen redan besökts en gång med nät.
- Länk "▶️ Kör checklista" på varje godkänd rutin med steg (`RutinKort.jsx`).

### 18d – Aggregerad användningsstatistik ✅ KLAR

- Ett ackumulerande dokument per rutin i `checklistkorningar/{rutinId}` (samma mönster som
  `visningar`/Etapp 5): antal påbörjade, antal slutförda, total tid (för ett GENOMSNITT – se
  förenkling nedan), samt en per-steg avbrottsräknare (bästa-försök, fångar "Avsluta"-knappen
  och avmontering av vyn, inte t.ex. att hela fliken/webbläsaren stängs).
- **Förenkling mot planen:** genomsnittlig tid istället för mediantid. En sann median hade
  krävt att spara varje enskild körnings varaktighet separat, vilket börjar likna en
  händelselogg (tidsstämplar per tillfälle) – ett större integritetsavtryck för marginell
  vinst över ett aggregerat medelvärde. Dokumenterat här som ett medvetet vägval, inte en
  bugg.
- Ny adminsektion `ChecklistStatistikSektion.jsx` (superadmin). Lyft in i ledningsrapporten
  (fas 30) och veckopulsen (Etapp 16, ej byggd än) är kvar som en separat framtida uppgift.
- Firestore-regler: samma öppna skrivmönster som `visningar` (vem som helst i organisationen
  får räkna upp), organisationsisolerat vid läsning – ingen Cloud Function behövs eftersom
  det bara är ackumulerande räknare, ingen fritext, ingen identitet.

**Klart när:** en rutin kan köras från början till slut på en telefon utan nät (verifierat
via samma Firestore-cache-mekanism som Offline-center/akutläget – ingen separat
nedladdningsknapp), och ledningen kan se var körningar avbryts i adminpanelen.

---

# Etapp 19 – Kompetenspaketet

*Introduktionsspår, mikrokviss och kompetensmatris hör ihop och delar datamodell – bygg dem
i den ordningen, men i samma etapp.*

**Varför:** Läskvitteringen finns redan och är produktens starkaste ledningsargument. Det här
gör den till ett kompetensverktyg: från "har klickat läst" till "kan visa att personalen kan".

**Modul:** `kompetens`.

### 19a – Introduktionsspår för nyanställda ✅ KLAR

- Ny collection `introduktionsspar` (namn, målroll, etapper med rutin-/anslagsreferenser +
  rekommenderad dag), hanterad av VEC/superadmin (`useIntroduktionsspar.js`,
  `firestore.rules` – samma behörighet som anslagstavlan).
- `introduktionstilldelningar/{uid}` (en aktiv tilldelning per person): tilldelas automatiskt
  i `losInInbjudan` om organisationen har ett spår för den nya rollen (fristående,
  icke-transaktionell skrivning efter användarskapandet – ett saknat spår stoppar aldrig
  inloggningen), eller manuellt av VEC/superadmin i `Introduktion.jsx`.
- Progress beräknas LIVE utifrån redan befintliga `lasteAv`-listor på rutiner/anslag
  (`utils/introduktionProgress.js`) – ingen egen "klar"-status lagras, precis som planen
  krävde. "Ligger efter" jämför rekommenderadDag mot dagar sedan tilldelning.
- Ny sida `/introduktion`: progress + nästa steg för den nyanställde, och för VEC/superadmin
  en chefsvy (alla pågående introduktioner, vem som ligger efter) + spårredigerare.
- 2 nya functions-tester (automatisk tilldelning, ingen tilldelning utan matchande spår),
  8 nya rules-tester (91/91 totalt i organisationsisolering.test.mjs).

### 19b – Mikrokviss efter läskvittering ✅ KLAR

- Valfritt per rutin (fält `kviss`, max 4 frågor): flervalsfrågor med `fraga`, `alternativ`
  (2–4 st), `rattIndex`, `hanvisning` – redigeras i `RutinFormular.jsx`.
- `KvissModal.jsx`: visas när personen kvitterar en rutin med `kviss`. Fel svar → visar rätt
  svar + hänvisning, "Försök igen" nollställer bara den lokala UI-statusen (`useState`), inget
  sparas per felsvar. Bara SISTA utfallet (godkänd) leder vidare.
- **Ingen ny "godkänd"-status lagras** – kvitteringen (`kvitteraLast`, samma `lasteAv`-array
  som redan finns) skrivs FÖRST när kvissen är klarad (`onKlar`-callbacken i `RutinKort.jsx`),
  inte direkt vid klick. "Har kvitterat" = "har klarat kvissen", utan parallell datamodell.
- **"Föreslå frågor" via AI** (`foreslaKvissfragor` i functions/index.js, samma mönster som
  18b): kräver `intelligence`-modul + budget, verkar bara på redan godkänd text, resultatet är
  alltid ett klientutkast som kräver mänsklig granskning/spara. Registrerad i
  `tests/functions/gatingmatris.test.cjs`.
- PII-spärr (tre lager) utökad till kviss-frågor/hänvisningar i `firestore.rules`
  (`harTroligtPersonnummerIKviss`) och `RutinFormular.jsx`. Regelbudgeten (max 1000 deluttryck)
  krävde att `.size()` cachas EN gång per fält (`harTroligtPersonnummerIStegN`/`...IKvissN`)
  istället för att anropas i varje uppradat index – annars slog steg- och kviss-kontrollerna
  tillsammans i taket och gav "evaluation error" istället för ett rent avslag/godkännande.
- 5 nya rules-tester (96/96 totalt i organisationsisolering.test.mjs): PII i fråga, PII i
  hänvisning, giltig kviss, för många frågor (>4), PII vid uppdatering.

### 19c – Kompetensmatris per roll ✅ KLAR

- Ny collection `kompetenskrav` (roll, rutinreferens, omkvitteringsfrekvens i månader),
  hanterad av VEC/superadmin (`useKompetenskrav.js`, `firestore.rules` – samma behörighet
  som introduktionsspår/anslagstavlan). Alla i organisationen får LÄSA kraven.
- Status beräknas LIVE utifrån redan befintliga `lasteAv`-listor (`utils/kompetensStatus.js`,
  samma mönster som introduktionsspårets progress) – ingen egen "godkänd"-status lagras per
  person och rutin. Fyra lägen: klar / förfaller snart (inom 30 dagar) / förfallen / saknas.
- Ny sida `/kompetensmatris`: matrisvy (roller × obligatoriska rutiner, status per person),
  gap-lista med CSV-export (samma Blob-mönster som kvitteringsexporten). VEC/superadmin/
  sektionsledare ("chef") ser hela vyn; övrig personal ser bara sin egen status.
- **Automatisk omkvittering:** ny fält `senasteVasentligaAndring` på `rutiner`, satt via en
  kryssruta ("Väsentlig ändring") i `RutinFormular.jsx` – syns bara vid redigering av en redan
  godkänd rutin, bara för VÖL/superadmin (samma roller som `farGodkannaKlinisktInnehall()`).
  En kvittering gjord FÖRE den senaste väsentliga ändringen räknas som "saknas" i matrisen,
  oavsett omkvitteringsfrekvens – utan att någon gammal kvittering behöver raderas.
- **Fix (samma regelbudgetproblem som 19b):** att lägga till ännu ett skyddat fält i
  `rutiner`-uppdateringsregeln tippade över Firestores tak på 1000 deluttryck igen. Löst genom
  att bryta ut hela update-villkoret i en egen funktion (`farUppdateraRutin`) som använder
  `let` för att beräkna `matcharMinOrg(...)` EN gång istället för en gång per OR-gren
  (`allow`-satser kan inte innehålla `let` direkt, bara funktioner kan).
- Fix (upptäckt under arbetet): `Sektionssida.jsx` sparade aldrig `kviss`-fältet från 19b –
  formuläret hade fältet men `hanteraSpara` skickade det inte vidare till Firestore.
- 8 nya rules-tester (104/104 totalt), 9 nya vitest-tester för `kompetensStatus.js`.

**Klart när:** en chef kan öppna en vy och på tio sekunder se vilka i sin personalgrupp som
saknar en obligatorisk rutin, och exportera det till APT.

---

# Etapp 20 – Bristanmälan i två klick ✅ KLAR

**Varför:** Minst arbete av allt i planen och omedelbart synlig nytta i vardagen. Kan
tidigareläggas fritt om en pilot behöver ett snabbt tillskott.

**Modul:** ingår i logistikmodulen.

### 20a – Anmälningsflöde ✅ KLAR

- Knapp direkt på förrådsartikelkortet (`ForradArtikelKort.jsx`): "⚠️ Slut/lågt saldo" → en
  inline textruta för valfri kommentar → "Skicka". Synlig för ALLA inloggade i organisationen
  (inte bara förrådsansvarig), eftersom vem som helst kan upptäcka en brist.
- Ny collection `bristanmalningar`: `organisationId`, `artikelId`, `artikelNamn`, `forrad`,
  `status` (ny/hanterad/avvisad), `anmaldAv`, `anmaldAvNamn`, `tidpunkt`, `kommentar`,
  `antalAnmalningar`, `senastAnmald` (`useBristanmalningar.js`).
- Fritextkommentaren kontrolleras klientsidan (`kontrolleraPatientuppgifter`) och i
  `firestore.rules` (`harTroligtPersonnummer`) – samma tvålagersmönster som övriga
  direktskrivna fritextfält (skiftrapporter, kommentarer).

### 20b – Hantering ✅ KLAR

- Ny sektion högst upp på `/logistik` (`Logistik.jsx`), synlig för förrådsansvarig/
  superadmin: öppna anmälningar sorterade på `antalAnmalningar` (flest överst).
  "Markera hanterad"/"Avvisa"-knappar.
- Notis: `useNotiser.js` fick två nya, tillståndsbaserade poster (samma mönster som
  granskningspåminnelser, inte en engångshändelse) – öppna anmälningar till förrådsansvarig/
  superadmin, och en kvittens till anmälaren när den egna anmälan markeras hanterad.
- Dubblettskydd: `useBristanmalningar.js`s `skapaBristanmalning` letar först efter en redan
  öppen anmälan av SAMMA artikel inom 24 h och höjer då bara `antalAnmalningar` (regelnivån
  tillåter en vanlig anmälare att göra just den uppräkningen, men aldrig ändra status).

### 20c – Utgångsdatumbevakning ✅ KLAR (justerad efter premisskontroll, genomgående krav 8)

- **Avvikelse funnen vid premisskontroll:** planen antog att AI-bildtolkningen redan läser
  utgångsdatum för förrådsartiklar (analogt med rutiners `giltigtTill`). Så var INTE fallet –
  `tolkaForradsbildMedGemini` extraherar bara namn/skåp/hylla/antal/sökord. Byggt om till att
  `utgangsdatum` sätts manuellt (nytt datumfält i `ForradArtikelFormular.jsx`); AI-utläsning
  från foto kvarstår som en möjlig senare utökning, inte grunden för den här leveransen.
- Istället för ett schemalagt jobb + `systemvarningar` (superadmin-bara enligt befintlig
  regel) beräknas "går ut inom 30 dagar" LIVE i `/logistik` (`utils/forradHjalp.js`,
  `gerUtInom30Dagar`) – alltid uppdaterat, ingen extra collection eller körningskostnad.
- Veckopuls (Etapp 16) är inte byggd ännu (bekräftat via genomgående krav 8) – bristanmälningar
  och utgående artiklar visas därför direkt på `/logistik` tills vidare, redo att återanvändas
  när Etapp 16 landar istället för att räkna om samma sak parallellt.
- 3 nya vitest-tester för `forradHjalp.js`.
- 8 nya rules-tester (114/114 totalt i organisationsisolering.test.mjs).

**Klart när:** en sjuksköterska kan anmäla en brist på under fem sekunder utan att lämna
artikelkortet.

---

# Etapp 21 – Källbevakning ✅ KLAR

**Varför:** Angriper produktens djupaste löfte – "rutinerna är aktuella". Ligger sist för att
den kräver mest omtanke kring driftkostnad och falsklarm, inte för att den är minst värd.

**Modul:** `kallbevakning` (`FEATURE.SOURCE_MONITORING` i `src/config/features.js`, av/på per
organisation i adminpanelens moduler-sektion – avstängd som standard).

### 21a – Referenser som data ✅ KLAR

- Nytt fält på `rutiner`: `externaKallor` – lista av URL-strängar, max 4 (`MAX_KALLOR` i
  `RutinFormular.jsx`).
- **Endast domäner ur `GODKANDA_KALLDOMANER`,** validerat i tre lager: klienten
  (`src/config/kalldomaner.js`, delad med den nya bevakningsfunktionen), `firestore.rules`
  (`urlHarGodkandDoman`/`arGodkandaKallor`, samma domänlista skriven som en regex), och
  källbevakningsjobbet självt (21b) vägrar hämta en URL utanför listan även om den skulle ha
  smugit sig igenom (samma "extra skyddslager"-princip som klinikstöd-sökningens egen
  domänkontroll).
- Migrering: `hittaGodkandaUrlerIText` läser innehåll/referenser och föreslår redan skrivna
  URL:er (till godkända domäner) som strukturerade referenser – ett klick för att lägga till,
  aldrig automatiskt.
- **Fix (samma regelbudgetproblem som 19b/19c):** att lägga till källkontrollen bredvid
  steg-/kviss-kontrollerna i `rutiner`-uppdateringsregeln slog i Firestores tak på 1000
  deluttryck EN GÅNG TILL. Den här gången räckte inte bara att cacha `.size()` – löstes genom
  att även slå ihop `harTroligtPersonnummerISteg`/`IKviss` till EN regex-matchning över en
  konkatenerad sträng istället för upp till 12/4 separata `harTroligtPersonnummer()`-anrop
  (regex-matchningen är den dyra delen, inte `.get()`-anropen), plus att sänka källtaket till 4.

### 21b – Bevakningsjobb ✅ KLAR

- `kontrolleraKallbevakning` (schemalagt varje måndag 04:00, `functions/index.js`) hämtar varje
  unik URL som refereras av en godkänd rutin i en organisation med modulen påslagen, och
  jämför en sha256-hash av den extraherade brödtexten mot senast sparade
  (`kallbevakning/{urlHash}`, en delad cache över ALLA organisationer – samma URL hämtas bara
  en gång per körning oavsett antal kunder som refererar den).
- Respekterar `robots.txt` (enkel tolkning av `Disallow` för `User-agent: *`), sätter ett
  tydligt `User-Agent`, och pausar en halv sekund mellan varje hämtning.
- **Olöst, kräver ägarens ställningstagande:** ingen juridisk genomgång av källornas
  användarvillkor (ToS) har gjorts – dokumenterat som ett eget tillägg i
  `SAKERHETSRAPPORT.md` (2026-07-28), med rekommendationen att göra den genomgången innan
  modulen aktiveras för en betalande kund.
- **Förenkling mot planen:** ingen mätning av falsklarmsfrekvens över tid är byggd – en
  ändringsflagga innebär i dag alltid en notis, det finns ingen automatisk "vänta några veckor
  innan notiser aktiveras"-mekanik. Dokumenterat som en känd begränsning snarare än
  underbyggt med data, i linje med genomgående krav 8.
- 4 nya functions-tester (`tests/functions/kallbevakning.test.cjs`, mockar `fetch`): ingen
  hämtning för en organisation utan modulen, ingen flagga vid FÖRSTA kontrollen av en ny källa,
  flagga vid en verklig ändring, trasig länk (404) flaggas som en egen typ.

### 21c – Notis och åtgärd ✅ KLAR

- Ny stående notis-post i `useNotiser.js` (samma ägar-filtrering som granskningspåminnelser):
  riktas till rutinens ägare om satt, annars till redaktörerna för området.
- `RutinKort.jsx` visar en varningsruta med källänken och två val: "Granskad, ingen ändring
  behövs" (rensar `kallVarning`, sätter `kallVarningGranskadAv`/`Datum`) eller "Öppna för
  redigering" (samma formulär som vanligt).
- Obesvarade källvarningar in i `Ledningsrapport.jsx` (veckopulsen, Etapp 16, är inte byggd än
  – samma premisskontroll-avvikelse som redan dokumenterad i Etapp 20c).

### 21d – Kostnads- och driftkontroll ✅ KLAR (förenklad)

- Trasig länk (404) rapporteras som en egen typ (`kallVarningTyp: "trasig_lank"`), skilt från
  en faktisk innehållsändring (`"andring"`).
- **Förenkling mot planen:** inget separat, adminpanel-styrbart tak för antal hämtningar per
  organisation och månad är byggt. Den delade URL-cachen (21b) begränsar redan strukturellt
  totalkostnaden till antalet UNIKA källor över alla kunder (inte per kund), vilket i praktiken
  är en hård, förutsägbar övre gräns (max 4 källor × antal godkända rutiner) utan att behöva en
  egen konfigurerbar kvot – dokumenterat här som en medveten förenkling, inte en glömd punkt.

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
9. **Etapp 21b (ny):** juridisk genomgång av användarvillkoren för de sju källdomänerna
   (`GODKANDA_KALLDOMANER`) innan `kallbevakning`-modulen aktiveras för en betalande kund –
   `robots.txt` är hedrat i koden, men är inte hela det juridiska svaret. Se
   `SAKERHETSRAPPORT.md` (tillägg 2026-07-28).
