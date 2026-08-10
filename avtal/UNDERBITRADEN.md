# Underbiträdesförteckning (subprocessorer)

**Status:** Löpande dokument, ska hållas uppdaterat varje gång ett underbiträde läggs till,
byts eller tas bort. Refereras från `avtal/PUB-AVTAL-MALL.md` (Etapp 13a), punkt 5.

**Upprättat:** 2026-07-26, som en del av Etapp 13b (`ETAPPLAN3.md`).

**Metod:** varje rad nedan är verifierad direkt mot koden (`functions/index.js`,
`.github/workflows/deploy.yml`, `src/sentry.js`), inte antagen – i enlighet med genomgående
krav 8 i `ETAPPLAN3.md`. Rader markerade "[FYLLS I]"/"[EJ VERIFIERAT]" kräver en åtgärd av
ägaren (vanligen en kontroll i ett moln-konsol som inte syns i koden).

---

## Sammanfattande tabell

| Underbiträde | Vad som behandlas | Region | Status |
|---|---|---|---|
| Google Firebase Authentication | Inloggningsuppgifter (e-post, hash av lösenord, ev. TOTP-hemlighet) | [EJ VERIFIERAT – se rad nedan] | I drift |
| Google Cloud Firestore | All strukturerad data i appen (se `avtal/PUB-AVTAL-MALL.md` punkt 4) | [EJ VERIFIERAT – se rad nedan] | I drift |
| Google Cloud Storage | Uppladdade bilder/dokument, backuper | [EJ VERIFIERAT – se rad nedan] | I drift |
| Google Cloud Functions | All serverlogik (Cloud Functions-koden) | europe-west1 (verifierat) | I drift |
| Google Firebase Hosting | Statiska webbtillgångar (den byggda appen) | Globalt CDN (se rad nedan) | I drift |
| Google Generative AI (Gemini API) | Bilder/text som skickas för AI-tolkning (rutin-/artikelutkast) | Ospecificerad/global (se rad nedan) | I drift |
| Google Programmerbara sökmotorn (Custom Search API) | Sökfrågor för klinikstöd-sökningen | Global Google-infrastruktur | I drift, **funktionen pausad i UI** (se `SAKERHETSRAPPORT.md`) |
| Sentry (Functional Software, Inc.) | Felmeddelanden och stacktraces vid krascher/undantag | EU (Frankfurt, `ingest.de.sentry.io` – verifierat) | I drift |
| Google reCAPTCHA (App Check) | Enhets-/webbläsarsignaler för att avgöra äkta klientanrop | Global Google-infrastruktur | I drift (mätläge, se Etapp 12c) |
| Linear | Interna utvecklingsärenden (backlogg) | [FYLLS I – rör inte kunddata, se not nedan] | Internt leverantörsverktyg |
| Brevo (Sendinblue SAS) | E-postadresser + en innehållslös notistext (aldrig verksamhetsinnehåll, se Etapp 53 genomgående krav 18) | Frankrike/EU (verifierat, EU-baserat bolag) | **Infrastruktur byggd (Etapp 53a, 2026-08-10), INTE i drift** – kräver att ägaren sätter en riktig `BREVO_API_KEY` som GitHub-hemlighet innan något faktiskt skickas. Utan nyckeln no-oppar `skickaEpost()` tyst (se `functions/index.js`). Ersätter den tidigare planerade "E-postleverantör (veckopuls)"-raden – samma infrastruktur täcker både Etapp 53 och en eventuell framtida Etapp 16 |

---

## Detaljer per underbiträde

### Google Firebase / Google Cloud Platform (Google Ireland Limited / Google LLC)

Firebase används för fem separata tjänster i produkten: Authentication, Firestore, Cloud
Storage, Cloud Functions och Hosting. Samtliga körs under samma GCP-projekt.

- **Cloud Functions:** verifierat direkt i `functions/index.js` – varje funktion anger
  explicit `region: "europe-west1"` (Belgien), konsekvent genom hela filen, ingen avvikelse.
- **Firestore-databasen och Storage-bucketen:** regionen för dessa sätts vid
  projektskapande i Firebase-konsolen, inte i kodens funktionsdefinitioner, och kan därför
  **inte** verifieras genom en kodgenomgång. **[FYLLS I av ägaren]:** kontrollera i
  Firebase-konsolen (Project settings → General, samt Storage → Files → bucket-info) vilken
  region databasen respektive bucketen faktiskt ligger i, och för in svaret här som en
  skärmdump eller ett textsvar. Detta är den enskilt vanligaste frågan från ett
  dataskyddsombud och måste kunna besvaras med ett faktum, inte en formulering.
- **Hosting:** Firebase Hosting levereras via Googles globala CDN – innehållet (den
  statiska, byggda appen, inga personuppgifter i de statiska filerna) kan cachas i valfri
  Google-datacenter globalt. Detta är normalt inte GDPR-relevant eftersom inga
  personuppgifter finns i de statiska tillgångarna (JS/CSS/bilder), men bör ändå anges för
  fullständighet.
- **Rättslig grund för Google-tjänsterna (om inte EU/EES):** Google Cloud/Firebase omfattas
  av EU:s standardavtalsklausuler (SCC) samt (sedan 2023) EU–US Data Privacy Framework för
  amerikanska mottagare. [FYLLS I: hänvisa till Googles aktuella Cloud Data Processing
  Addendum, som ska biläggas eller länkas i kundavtalet.]

### Google Generative AI (Gemini API)

Används av `tolkaForradsbild`/`tolkaDokument` (bildtolkning) för att skapa utkast till
rutiner/förrådsartiklar (`functions/index.js`, modell `gemini-2.5-flash`).

- **Vad som skickas:** bilder/dokument som en redaktör själv laddar upp, avsett att
  uteslutande innehålla verksamhetsinformation (whiteboard-anteckningar,
  inventarielistor) – inte patientuppgifter, se `avtal/PUB-AVTAL-MALL.md` punkt 2.
- **[EJ VERIFIERAT – kräver ägarbeslut]:** koden använder det publika Gemini API:et
  (`GoogleGenerativeAI`-klienten), **inte** Vertex AI. Google garanterar regional
  databehandling (t.ex. EU-only) för Vertex AI, men Gemini API via `generativelanguage
  .googleapis.com` har historiskt inte samma regionsgaranti. **Detta bör kontrolleras mot
  Googles aktuella villkor för Gemini API innan avtalet undertecknas mot en kund med
  strikta krav på regional databehandling** – om en garanti saknas är en migrering till
  Vertex AI (samma modell, regional endpoint) den tekniska lösningen.

### Google Programmerbara sökmotorn (Custom Search JSON API)

Används av klinikstöd-sökningens källbegränsade verifiering (`SOKMOTOR_API_KEY`,
`googleapis.com/customsearch/v1`, se `functions/index.js`). Skickar användarens fritextfråga
till Google för att hitta träffar begränsade till fem godkända medicinska källdomäner.
**Funktionen är pausad i användargränssnittet** sedan v5.3.5 (se `SAKERHETSRAPPORT.md`,
"Pausad funktion") – underbiträdet är tekniskt aktivt (schemalagd verifiering körs
dagligen) men tar inte emot skarpa användarfrågor för närvarande.

### Sentry (Functional Software, Inc., d/b/a Sentry)

Tar emot felmeddelanden och stacktraces vid oväntade fel, från både frontend
(`src/sentry.js`) och Cloud Functions (`functions/index.js`s `onCall`-wrapper).

- **Region:** verifierat i `.github/workflows/deploy.yml` – båda DSN:erna pekar mot
  `ingest.de.sentry.io` (Sentrys EU-region, Frankfurt).
- **Innehåll:** avsett att vara tekniska felmeddelanden och kodrader (stack traces), inte
  användardata. `tracesSampleRate: 0` (ingen prestandaspårning av användaraktivitet).
  Sentry ingår inte i den formella PII-genomgången (Etapp 12) och bör läggas till där om
  fritextinnehåll någonsin börjar skickas med i felrapporter.

### Google reCAPTCHA / App Check

Används för att verifiera att anrop till Cloud Functions kommer från den riktiga,
installerade appen (se Etapp 12c, `src/firebase/config.js`). Behandlar tekniska
enhets-/webbläsarsignaler, ingen känd koppling till enskilda personuppgifter i appens
mening. Global Google-infrastruktur, samma juridiska grund som övriga Google-tjänster ovan.

### Linear

Används internt av leverantören för utvecklingsbacklogg (se Fas 33 i
`UTVECKLINGSLOGG.md`). **Behandlar inte kunddata** – ärendena beskriver funktioner och
tekniskt arbete, inte innehåll från en kunds Firestore-databas. Tas ändå upp här för
fullständighet, eftersom vissa kunder/DPO efterfrågar en fullständig lista över samtliga
verktyg leverantören använder, oavsett om kunddata behandlas.

### Brevo (Sendinblue SAS)

Vald 2026-08-10 (`BESLUTSLOGG.md`, beslutspunkt 1 i `ETAPPLAN11.md` §53) som e-postkanal för
Etapp 53 – i första hand inbjudningar (53b), tilldelade påminnelser (53c) och en kundvänd
månadssammanfattning (53d). EU-baserat bolag (Frankrike), vilket var det avgörande skälet
framför ett amerikanskt alternativ.

- **Vad som skickas:** en mottagaradress plus en kort, medvetet innehållslös notistext (t.ex.
  "du har 3 rutiner att granska, logga in för att se dem"). Aldrig organisationens namn,
  verksamhetsinnehåll eller andra personuppgifter än mottagarens egen adress – se
  `ETAPPLAN11.md` genomgående krav 18. Enda undantaget är inbjudningsmejlet (53b), som med
  nödvändighet måste nämna organisationens namn för att vara begripligt; det är ett medvetet,
  dokumenterat undantag, inte en glidning.
- **Teknisk status:** hjälparfunktionen `skickaEpost()` och det globala nödstoppet
  (`angeEpostAvstangd`, en knapp i `/leverantor`) byggdes i Etapp 53a. **Sedan Etapp 53b
  (2026-08-10) skickas inbjudningar faktiskt via den** – `skapaInbjudan`, `skapaOrganisation`
  och `nollstallDemoOrganisation` mejlar nu automatiskt, med den kopierbara länken kvar som
  reserv. 53c (påminnelser) och 53d (månadsrapport) återstår. Skickar fortfarande ingenting
  förrän ägaren satt en riktig `BREVO_API_KEY` som GitHub-hemlighet (Secret Manager-mönster,
  samma som `GEMINI_API_KEY`); fram tills dess no-oppar varje anrop tyst och loggar en
  varning – inbjudan skapas ändå, bara mejlet uteblir.
- **Rättslig grund:** [FYLLS I av ägaren innan skarp drift] – ett PUB-avtal med Brevo måste
  vara på plats, precis som kravet var för den tidigare planerade "veckopuls"-leverantören.

---

## Underrättelse vid ändring

I enlighet med `avtal/PUB-AVTAL-MALL.md` punkt 5 ska Kunden underrättas innan ett nytt
underbiträde läggs till eller ett befintligt byts ut, med möjlighet att invända. Denna fil
är källan för vad som gäller vid varje given tidpunkt – uppdatera den **samtidigt** som
förändringen görs i koden eller CI/CD-konfigurationen, inte i efterhand.
