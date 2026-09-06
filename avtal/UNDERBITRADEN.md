# Underbiträdesförteckning (subprocessorer)

**Status:** Löpande dokument, ska hållas uppdaterat varje gång ett underbiträde läggs till,
byts eller tas bort. Refereras från `avtal/PUB-AVTAL-MALL.md` (Etapp 13a), punkt 5.

**Upprättat:** 2026-07-26, som en del av Etapp 13b (`etapplaner/ETAPPLAN3.md`).
**Senast uppdaterad:** 2026-08-29 – **version 2026-08-29** (se nedan).

> **Vad "version" betyder här** (Etapp L1p punkt 2, `intern/ETAPPLAN-INTERN-1.md`): datumet på
> raden "Senast uppdaterad" ovan ÄR versionen. `satUnderbitradeUnderrattad` (leverantörspanelen)
> registrerar per kund vilken version de underrättats om, jämfört mot
> `src/config/underbitraden.js`s `UNDERBITRADEN_AKTUELL_VERSION` – som ska höjas till SAMMA
> datum i SAMMA commit som en sakändring görs här, annars visar panelen fel kunder som à jour.

> **⚠️ ÖPPEN BRIST PER 2026-08-27:** Brevo (e-postutskick) togs i drift utan tecknat
> PUB-avtal. Behandlingen omfattar mottagares e-postadresser.
>
> **Utgående e-post är STOPPAT sedan 2026-08-28** genom en spärr i koden (v5.131.0,
> verifierad i produktion), i väntan på att avtalet tecknas (`BESLUTSLOGG.md`). Se avsnittet "Brevo (Sendinblue SAS)"
> nedan för hela beskrivningen och hur spärren hävs.

**Metod:** varje rad nedan är verifierad direkt mot koden (`functions/`-modulerna,
`.github/workflows/deploy.yml`, `src/sentry.js`), inte antagen – i enlighet med genomgående
krav 8 i `etapplaner/ETAPPLAN3.md`. Rader markerade "[FYLLS I]"/"[EJ VERIFIERAT]" kräver en åtgärd av
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
| Google Programmerbara sökmotorn (Custom Search API) | Sökfrågor för klinikstöd-sökningen | Global Google-infrastruktur | I drift (funktionen är **inte** pausad – se not nedan) |
| Sentry (Functional Software, Inc.) | Felmeddelanden och stacktraces vid krascher/undantag | EU (Frankfurt, `ingest.de.sentry.io` – verifierat) | I drift |
| Google reCAPTCHA (App Check) | Enhets-/webbläsarsignaler för att avgöra äkta klientanrop | Global Google-infrastruktur | I drift (mätläge, se Etapp 12c) |
| Linear | Interna utvecklingsärenden (backlogg) | [FYLLS I – rör inte kunddata, se not nedan] | Internt leverantörsverktyg |
| Brevo (Sendinblue SAS) | E-postadresser + en innehållslös notistext (aldrig verksamhetsinnehåll, se Etapp 53 genomgående krav 18) | Frankrike/EU (verifierat, EU-baserat bolag) | **I DRIFT sedan 2026-08-27, MEN PUB-AVTAL SAKNAS** – se den utförliga noten under "Brevo (Sendinblue SAS)" nedan. Detta är en känd, öppen brist, inte ett förbiseende |

---

## Detaljer per underbiträde

### Google Firebase / Google Cloud Platform (Google Ireland Limited / Google LLC)

Firebase används för fem separata tjänster i produkten: Authentication, Firestore, Cloud
Storage, Cloud Functions och Hosting. Samtliga körs under samma GCP-projekt.

- **Cloud Functions:** verifierat direkt i `functions/`-modulerna – varje funktion anger
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
rutiner/förrådsartiklar (`functions/ai-import.js`, modell `gemini-2.5-flash`).

- **Vad som skickas:** bilder/dokument som en redaktör själv laddar upp, avsett att
  uteslutande innehålla verksamhetsinformation (whiteboard-anteckningar,
  inventarielistor) – inte patientuppgifter, se `avtal/PUB-AVTAL-MALL.md` punkt 2.
- **Kodmigrerad till Vertex AI 2026-09-06, men INTE AKTIV ÄNNU.** Samtliga sex Gemini-
  anropsställen (`functions/ai-import.js`, `functions/klinikstod.js`) använder nu
  `@google/genai` mot Vertex AI (`enterprise: true`, projekt `synappsen-final-build`,
  region `europe-west1`) i stället för det publika Gemini API:et. Autentisering sker via
  Cloud Functions-tjänstekontots Application Default Credentials, ingen fristående
  API-nyckel längre. **Regional databehandling (EU-only) är alltså den tekniska garantin
  som nu är byggd in i koden – men den gäller inte förrän ägaren gjort tre GCP-
  konsolsteg som inte kan göras från en kodsession** (aktivera Vertex AI-API:et, ge
  tjänstekontot rollen `roles/aiplatform.user`, bekräfta att `gemini-2.5-flash` finns i
  `europe-west1`). Se `OPPNA-PUNKTER.md` och
  `granskningar/VERTEX-AI-MIGRERING-KOSTNADSUPPSKATTNING-2026-08-30.md` (tillägg
  2026-09-06) för status. **Bocka inte av den här raden som helt klar förrän en riktig
  begäran har verifierats gå via Vertex AI i produktion** (genomgående krav 8).

### Google Programmerbara sökmotorn (Custom Search JSON API)

Används av klinikstöd-sökningens källbegränsade verifiering (`SOKMOTOR_API_KEY`,
`googleapis.com/customsearch/v1`, se `functions/klinikstod.js`). Skickar användarens fritextfråga
till Google för att hitta träffar begränsade till sju godkända medicinska källdomäner.
**Rättelse 2026-08-23: funktionen är i drift och tar emot skarpa användarfrågor.** Den var
pausad i användargränssnittet från v5.3.5, men återaktiverades och byggdes om med enforcement i
två lager plus en daglig automatisk källverifiering (`verifieraKlinikstodSchemalagt` i
`functions/index.js`). `granskningar/SAKERHETSRAPPORT.md` rättade sin egen text redan 2026-08-01, men den
här förteckningen följde inte med – i knappt fyra veckor beskrev alltså **ett dokument som
lämnas till kundens dataskyddsombud en behandling som mindre omfattande än den faktiskt är.**
Det är precis fel riktning att ha fel åt i en underbiträdesförteckning.

### Sentry (Functional Software, Inc., d/b/a Sentry)

Tar emot felmeddelanden och stacktraces vid oväntade fel, från både frontend
(`src/sentry.js`) och Cloud Functions (`functions/gemensamt.js`s `onCall`-wrapper).

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
`etapplaner/UTVECKLINGSLOGG.md`). **Behandlar inte kunddata** – ärendena beskriver funktioner och
tekniskt arbete, inte innehåll från en kunds Firestore-databas. Tas ändå upp här för
fullständighet, eftersom vissa kunder/DPO efterfrågar en fullständig lista över samtliga
verktyg leverantören använder, oavsett om kunddata behandlas.

### Brevo (Sendinblue SAS)

Vald 2026-08-10 (`BESLUTSLOGG.md`, beslutspunkt 1 i `etapplaner/ETAPPLAN11.md` §53) som e-postkanal för
Etapp 53 – i första hand inbjudningar (53b), tilldelade påminnelser (53c) och en kundvänd
månadssammanfattning (53d). EU-baserat bolag (Frankrike), vilket var det avgörande skälet
framför ett amerikanskt alternativ.

- **Vad som skickas:** en mottagaradress plus en kort, medvetet innehållslös notistext (t.ex.
  "du har 3 rutiner att granska, logga in för att se dem"). Aldrig organisationens namn,
  verksamhetsinnehåll eller andra personuppgifter än mottagarens egen adress – se
  `etapplaner/ETAPPLAN11.md` genomgående krav 18. Enda undantaget är inbjudningsmejlet (53b), som med
  nödvändighet måste nämna organisationens namn för att vara begripligt; det är ett medvetet,
  dokumenterat undantag, inte en glidning.
- **Teknisk status: I DRIFT sedan 2026-08-27.** Hjälparfunktionen `skickaEpost()` och det
  globala nödstoppet (`angeEpostAvstangd`, en knapp i `/leverantor`) byggdes i Etapp 53a.
  Ägaren satte en riktig `BREVO_API_KEY` som GitHub-hemlighet och verifierade avsändardomänen
  `synappsen.se` hos Brevo (SPF/DKIM/DMARC) 2026-08-27, och v5.129.0 deployades samma dag.
  Från och med då skickas e-post faktiskt, från tre håll:

  | Vad | Utlöses av | Kod |
  |---|---|---|
  | Inbjudningsmejl | Manuell handling (någon bjuder in en kollega) | `functions/inbjudningar.js` |
  | Dagliga påminnelser | **Automatiskt, varje dag kl. 09:00 Europe/Stockholm** | `skickaEpostPaminnelserSchemalagt`, `functions/notiser.js` |
  | Månadssammanfattning | **Automatiskt, den 1:a varje månad kl. 09:00** | `skickaManadssammanfattningarSchemalagt`, `functions/matvarden.js` |

  Den tidigare formuleringen här ("skickar fortfarande ingenting förrän ägaren satt en riktig
  nyckel") gällde fram till 2026-08-27 och är nu inaktuell.

- **Rättslig grund: SAKNAS. Detta är en känd, öppen brist per 2026-08-27.**

  > **⚠️ PUB-avtal med Brevo är INTE tecknat.** Ägaren bekräftade det uttryckligen
  > 2026-08-27, samma dag som tjänsten togs i drift. Personuppgifter (mottagarens
  > e-postadress, och i inbjudningsmejlet organisationens namn) behandlas alltså av ett
  > underbiträde utan det skriftliga avtal som dataskyddsförordningen art. 28.3 kräver.
  >
  > **Varför det står här i klartext:** dokumentet lämnas till kund och dataskyddsombud. En
  > förteckning som utelämnar en känd brist är farligare än ingen förteckning – den inbjuder
  > mottagaren att lita på något som inte stämmer. Se `CLAUDE.md`s underhållsregel: en
  > försämring ska dokumenteras i samma commit som den uppstår, även när den ser sämre ut.
  >
  > **Vad som krävs för att stänga bristen:** Brevo tillhör de leverantörer som
  > tillhandahåller ett standardiserat biträdesavtal (DPA) via kontoinställningarna – det är
  > normalt ett godkännande, inte en förhandling. När det är på plats: ersätt den här rutan
  > med datum för tecknandet och en hänvisning till var avtalet förvaras.
  >
  > **Begränsningsåtgärd – BESLUTAD 2026-08-27:** ägaren har beslutat att pausa allt
  > utgående e-post tills PUB-avtalet är tecknat (se `BESLUTSLOGG.md`). Åtgärden är det
  > globala nödstoppet, som stoppar ALL utgående e-post för samtliga organisationer
  > omedelbart och utan ny driftsättning. Det omfattar även de schemalagda utskicken ovan.
  > Inbjudningar skapas fortfarande – bara mejlet uteblir, och den kopierbara inbjudningslänken
  > fungerar som förut.
  >
  > **Status för verkställigheten: STOPPAT OCH VERIFIERAT I PRODUKTION 2026-08-28 12:31 UTC**
  > (v5.131.0, deploykörning #92). Verifieringen gjordes mot faktiskt utfall, inte mot att
  > deployjobbet rapporterade "success": deployloggen bekräftar att de tre funktioner som kan
  > skicka e-post – inbjudan, den dagliga påminnelsen och månadssammanfattningen – samtliga
  > uppdaterades, och att hosting-releasen slutfördes. (Skälet till den noggrannheten: en
  > tidigare körning samma dag rapporterade "success" utan att hostingreleasen genomfördes.)
  >
  > Spärren är
  > INTE den manuella driftflaggan, utan en konstant i koden (`PUB_AVTAL_BREVO_TECKNAT` i
  > `functions/gemensamt.js`): `skickaEpost()` returnerar `{skickat: false, anledning:
  > "pub_avtal_saknas"}` utan att kontakta Brevo, oavsett driftflaggans läge.
  >
  > **Varför en kodkonstant och inte driftflaggan:** driftflaggan bär ingen motivering. Den
  > som ser den påslagen om tre månader har ingenting som säger varför, och risken att den
  > slås av igen av misstag är precis det "regeln glömdes bort"-mönster som redan inträffat
  > sex gånger i det här projektet. Att häva spärren kräver en kodändring och en
  > driftsättning, vilket är rimligt i proportion till att teckna ett avtal.
  >
  > **Att häva den när avtalet är tecknat:** sätt konstanten till `true`, ersätt den här
  > rutan med datum för tecknandet och var avtalet förvaras, och ta bort raden ur
  > `OPPNA-PUNKTER.md`. `tests/functions/epost.test.cjs` failar om konstanten ändras, så
  > frågan "är avtalet faktiskt på plats?" tvingas fram.

---

## Underrättelse vid ändring

I enlighet med `avtal/PUB-AVTAL-MALL.md` punkt 5 ska Kunden underrättas innan ett nytt
underbiträde läggs till eller ett befintligt byts ut, med möjlighet att invända. Denna fil
är källan för vad som gäller vid varje given tidpunkt – uppdatera den **samtidigt** som
förändringen görs i koden eller CI/CD-konfigurationen, inte i efterhand.

---

## Ändringshistorik

| Datum | Ändring |
|---|---|
| 2026-08-29 | Etapp L1p punkt 2: mekanism för underrättelse tillagd i leverantörspanelen (`satUnderbitradeUnderrattad`). Ingen sakändring av innehållet – datumet på "Senast uppdaterad" blev samtidigt dokumentets första formella VERSION (se rutan ovan). Inga kunder finns ännu att underrätta |
| 2026-08-28 | Spärren **deployad och verifierad i produktion** (körning #92). Kontrollerat mot deployloggen att skapaInbjudan, skickaEpostPaminnelserSchemalagt och skickaManadssammanfattningarSchemalagt samtliga uppdaterades |
| 2026-08-27 | Spärren verkställd i v5.131.0: `PUB_AVTAL_BREVO_TECKNAT = false` i `functions/gemensamt.js` stoppar allt utskick i koden. Valdes framför den manuella driftflaggan eftersom den senare inte bär någon motivering och kan slås av av misstag |
| 2026-08-27 | Ägarbeslut: utgående e-post pausas tills PUB-avtal är tecknat |
| 2026-08-27 | Brevo: status ändrad från "infrastruktur byggd, inte i drift" till **i drift**, efter att ägaren satt `BREVO_API_KEY` och verifierat avsändardomänen. Samtidigt infört som **öppen brist** att PUB-avtal saknas – ägaren bekräftade detta uttryckligen samma dag. De tre utskicksvägarna (inbjudan, daglig påminnelse 09:00, månadssammanfattning) verifierade mot `functions/inbjudningar.js`, `functions/notiser.js` och `functions/matvarden.js` |
| 2026-07-26 | Dokumentet upprättat (Etapp 13b) |
