# Kostnadsuppskattning: migrering till Vertex AI

**Internt · 2026-08-30 · Etapp 72, undantag 1** (`etapplaner/ETAPPLAN19.md`, beslutspunkt 5).

> Detta är en ingenjörsmässig grovuppskattning av arbetsinsats, gjord genom att läsa faktisk
> kod – inte en offert och inte en verifierad prisuppgift från Google. Aktuell Vertex
> AI-prissättning per token måste kontrolleras hos Google direkt innan uppskattningen används
> i en offert eller ett kundavtal.

## Varför frågan finns

`avtal/UNDERBITRADEN.md` har sedan tidigare en öppen punkt: koden använder det publika Gemini
API:et (`generativelanguage.googleapis.com`), inte Vertex AI. Google garanterar regional
databehandling (EU-only) för Vertex AI, men den garantin är historiskt inte lika tydlig för det
publika Gemini API:et. Frågan blir konkret i det ögonblick en kund med strikta krav på regional
databehandling ber om en garanti.

`granskningar/GRANSKNING-IDEBANK-2026-08-30.md` avsnitt 5 (om förslag 17, EU-datresidens)
konstaterar att Firestore, Storage och Cloud Functions redan körs i `europe-west1`, så det som
återstår är just AI-behandlingen. Den här uppskattningen finns för att avgöra om migreringen är
"en veckas arbete" (bör göras innan en kunds dataskyddsombud frågar) eller ett större projekt
(vänta tills en kund faktiskt kräver det).

## Vad som faktiskt skulle behöva ändras

Sex anropsställen i två filer, verifierat genom att läsa koden 2026-08-30:

| Fil | Anropsställen | Nuvarande mekanism |
|---|---|---|
| `functions/ai-import.js` | 4 (`tolkaForradsbild`, `tolkaDokument`, förslagsfunktionerna) | npm-paketet `@google/generative-ai`, autentiserat med en API-nyckel (`GEMINI_API_KEY`, Firebase Secret) |
| `functions/klinikstod.js` | 2 (klinikstöd-sökningens svar, samt en verifieringsfunktion) | Rå `fetch()` mot `generativelanguage.googleapis.com`, samma API-nyckel i URL:en |

### Vad som skiljer Vertex AI åt, konkret

1. **Autentisering.** Vertex AI använder Google Clouds vanliga tjänstekontobehörighet
   (Application Default Credentials) i stället för en fristående API-nyckel. Cloud
   Functions-tjänstekontot behöver rollen `roles/aiplatform.user`, och koden behöver hämta en
   åtkomsttoken (`google-auth-library`, som redan finns som transitivt beroende via
   `firebase-admin`) i stället för att läsa en secret.
2. **Endpoint och adress.** `https://{region}-aiplatform.googleapis.com/v1/projects/
   {projekt}/locations/{region}/publishers/google/models/{modell}:generateContent` i stället
   för `generativelanguage.googleapis.com`. Regionen (t.ex. `europe-west4`, där Gemini-modeller
   är tillgängliga) måste väljas och är den faktiska garantin som köps.
3. **`functions/ai-import.js`** bytter troligen bara ut klientbiblioteket
   (`@google-cloud/vertexai` i stället för `@google/generative-ai`) – anropsformen
   (`generateContent`, samma promptstruktur, samma svarsformat) är i grunden densamma, så
   själva prompt-/schemakoden bör kunna stå kvar oförändrad.
4. **`functions/klinikstod.js`** anropar API:et direkt via `fetch()`, inte via ett
   klientbibliotek. Det kräver en omskrivning av anropskoden (ny URL, ny autentisering via
   åtkomsttoken i stället för API-nyckel i URL:en) men ingen ändring av själva prompten eller
   svarstolkningen.
5. **Aktivering i GCP-projektet:** Vertex AI-API:et måste slås på, vilket är en
   konsolinställning, inte kod.

### Vad som INTE behöver ändras

- Modellen (`gemini-2.5-flash`) är samma modell, tillgänglig via båda vägarna.
- Prompttexten, svarstolkningen, budgetspärren (`reserveraBudget`), PII-spärren
  (`innehallerPersonnummer`) och personnummerkontrollen är alla oberoende av vilken endpoint
  som anropas – ingen av dem rör sig.
- Klientkoden (`src/`) rör detta inte alls – allt AI-anrop sker redan server-side i Cloud
  Functions.

## Vad som gör uppskattningen osäker

- **Ingen automatiserad test täcker någon av de sex anropsställena** (verifierat: ingen fil i
  `tests/functions/` refererar `GEMINI_API_KEY`, `generativelanguage` eller
  `GoogleGenerativeAI`). En migrering måste alltså verifieras manuellt mot en riktig bild/PDF
  respektive en riktig klinikstöd-fråga, i emulator eller i en testmiljö med riktiga
  hemligheter – samma manuella mönster som `VerifieraKlinikstodSektion.jsx` redan använder för
  källverifieringen.
- Vertex AI:s exakta regionala modelltillgänglighet (vilka regioner som har
  `gemini-2.5-flash`) och aktuell prissättning per token är **inte kontrollerade i den här
  sessionen** och måste läsas direkt hos Google innan arbetet planeras skarpt.
- IAM-behörigheten för Cloud Functions-tjänstekontot kräver ett steg i GCP-konsolen som inte
  kan göras från en kodsession (samma mönster som `roles/firebaseauth.admin`-punkten redan
  öppen i `OPPNA-PUNKTER.md`).

## Grov uppskattning

| Del | Uppskattning |
|---|---|
| Omskrivning `functions/ai-import.js` (4 anropsställen, byt klientbibliotek) | **[uppskattning] En arbetsdag**, mest testtid |
| Omskrivning `functions/klinikstod.js` (2 anropsställen, byt endpoint + auth) | **[uppskattning] En arbetsdag** |
| GCP-konfiguration (aktivera API, IAM-roll, välja region) – kräver ägaren, inte kodsessionen | **[uppskattning] Timmar**, men blockerar tills den är gjord |
| Manuell verifiering mot riktiga anrop (ingen automatisk testtäckning finns) | **[uppskattning] En halv arbetsdag** |
| Uppdatera `avtal/UNDERBITRADEN.md` med den nya, verifierade regionsgarantin | Timmar |

**Totalt: [uppskattning] 2–3 arbetsdagar**, förutsatt att Vertex AI:s regionala
modelltillgänglighet inte kräver en annan modellversion än den som redan används. Det är
"en veckas arbete" i den mening `granskningar/GRANSKNING-IDEBANK-2026-08-30.md` avsnitt 5
efterfrågade – **inte** ett större omprojekt.

## Rekommendation

Migreringen är billig nog att göra proaktivt, innan en kunds dataskyddsombud frågar – men den
kräver ett steg utanför en kodsession (GCP IAM och regionval, ägarens beslut) och bör
verifieras manuellt eftersom ingen automatisk testtäckning finns. **Rekommenderas som ett eget,
litet delmål när ägaren har tid för de GCP-konsolstegen** – inte som en del av den här
dokumentationsomgången, som är avgränsad till att skriva ned det avsedda ändamålet, kontrollera
artikel 50-märkningen och uppskatta den här kostnaden (samtliga tre nu gjorda).

## Källor

`avtal/UNDERBITRADEN.md` (öppna punkten om regional databehandling),
`granskningar/GRANSKNING-IDEBANK-2026-08-30.md` avsnitt 5 och 7 (förslag 17), egen läsning av
`functions/ai-import.js` och `functions/klinikstod.js` 2026-08-30.
