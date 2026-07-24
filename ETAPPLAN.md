# Synappsen – etappindelad utvecklingsplan

*Körschema från fungerande app (v5.10.0) till flerkundsprodukt. Bygger på MODULPLAN.md.*

Planen är indelad i sex etapper. Varje etapp har ett **mål**, konkreta **delmål/leverabler**,
ett **klart-kriterium** (mätbart, testbart) och tydliga **beroenden**. Storlek anges relativt
(S/M/L/XL) – inga kalenderdatum, eftersom de beror på bemanning och takt. Ordningen styrs av
tekniska beroenden, inte av vad som är roligast att bygga.

**Grundprincip:** organisationsmodellen (Etapp 1) är en hård grind. Nästan inget
produktifieringsarbete är meningsfullt före den, eftersom "vilken kund äger den här datan /
budgeten / modulen" annars är odefinierat.

---

## Etapp 0 – Stäng befintliga skulder & validera drift  ·  Storlek: S

**Mål:** allt som redan är byggt är bevisat i skarp miljö innan nytt läggs ovanpå.

**Delmål:**
- Deploya nuvarande `main`/utvecklingsgren och verifiera att bygget går igenom hela vägen.
- Livetesta klinikstöd-sökningen skarpt (frågor → källkontroll → svar) – dokumenterad öppen
  punkt i FRAMTIDSPLAN.md.
- Verifiera att den schemalagda källkontrollen (`verifieraKlinikstodSchemalagt`) faktiskt
  registrerades i Cloud Scheduler; aktivera Scheduler-API vid behov och deploya om.
- `SOKMOTOR_API_KEY` bekräftad som GitHub-secret och i Secret Manager.

**Klart när:** en superadmin kan ställa tre testfrågor och få korrekta, källhänvisade svar i
produktion, och det schemalagda jobbet syns köra i Google Cloud Console.

**Beroenden:** inga. Kan börja omedelbart.

---

## Etapp 1 – Multi-tenant-grund (organisationsmodellen)  ·  Storlek: XL  ·  ✅ GENOMFÖRD

**Status:** genomförd och verifierad med automatiska tester mot Firestore-emulatorn –
`npm run test:rules` (34/34 gröna, samtliga 14 organisationsskopade collections) och
`npm run test:functions` (14/14 gröna, migreringsfunktionens faktiska affärslogik: behörighet,
dry-run, skarp körning, idempotens) – se ETAPP1-ARBETSUPPGIFTER.md och UTVECKLINGSLOGG.md
Fas 18 för fullständiga detaljer. Förenklad mot ursprungsskissen: `organisationId` ligger
direkt på `users/{uid}` (ingen separat `medlemmar`-subcollection – onödig komplexitet så länge
en användare bara tillhör en organisation). Kvarstående, medvetet avgränsat: Storage-reglerna
för `rutiner`/`forradsartiklar` är ännu inte organisationsskopade (dokumenterad, låg-severity
lucka), migreringen måste köras manuellt av superadmin i adminpanelen innan skarp drift med en
andra kund, och ingen UI/e2e-testning har gjorts (appen har inte körts i en browser mot
emulatorerna).

**Mål:** appen kan hålla flera kunders data helt åtskilda. Detta är planens tyngsta arbete.

**Delmål (i ordning – varje steg bygger på föregående):**
- **1a. Datamodell + första organisationen.** Inför `organisationer/{orgId}` med
  `medlemmar/{uid}`-subcollection. Skapa den egna enheten som org nr 1.
- **1b. Backfill.** Migreringsskript som sätter `organisationId` på all befintlig data
  (rutiner, anslag, kontakter, länkar, förråd, kommentarer, feedback, loggar …). Körs en gång,
  idempotent, med torrkörnings-läge.
- **1c. Regelomskrivning.** `firestore.rules` + `storage.rules` görs organisationsmedvetna:
  varje hjälpfunktion kontrollerar medlemskap i rätt organisation. Detta är en omskrivning av
  regelfilen, inte ett tillägg.
- **1d. Per-org AI-budget.** Flytta `installningar/geminiBudget` till
  `organisationer/{orgId}` så två kunder aldrig delar budget/kvot.
- **1e. Org-medvetna Cloud Functions.** Alla funktioner som rör budget, AI, feedback och
  verifiering härleder/kräver `organisationId` och kontrollerar medlemskap.

**Klart när:** två testorganisationer kan samexistera i samma installation, och ett automatiskt
test bevisar att en användare i org A **aldrig** kan läsa eller skriva data i org B – via
vare sig UI, direkt Firestore-anrop eller Cloud Function. AI-budgeten räknas separat per org.

**Beroenden:** Etapp 0 (vill inte migrera ovanpå en obekräftad drift).

**Risk:** högst i hela planen. Rekommendation: egen gren, utökad testtäckning för reglerna
(Firestore rules-emulator), och en säkerhetsgenomgång som egen delaktivitet innan den slås på
skarpt. Måste vara klar **före kund nummer två** – att skjuta upp den är inte ett alternativ,
då blir dataläckage mellan kunder en reell risk.

---

## Etapp 2 – Feature-gating (moduler)  ·  Storlek: M

**Mål:** kunder kan ha olika moduler påslagna, kontrollerat i tre lager.

**Delmål:**
- `src/config/features.js` – central `FEATURE`- och `PACKAGE_FEATURES`-definition.
- `useFeatures()`-hook som läser organisationens modulkonfiguration.
- Gating i UI (navigation, knappar, tomlägen med neutral "kräver modul X"-förklaring).
- Serverkontroll av modul i berörda Cloud Functions **innan** externa API-anrop.
- Gata **en** modul först som referens: AI-import (tydlig kostnad, tydligt värde).

**Klart när:** AI-import kan slås av/på per organisation, och en kund utan Intelligence kan
inte utlösa ett enda Gemini-anrop ens via ett manipulerat direktanrop (verifierat test).

**Beroenden:** Etapp 1 (moduler hänger på organisationen).

---

## Etapp 3 – Bygg Operations klart  ·  Storlek: L

**Mål:** Operations-paketet håller vad säljmaterialet lovar. ~Halva paketet återstår idag.

**Delmål (kan delvis parallelliseras – offline är eget delprojekt):**
- **3a. Offline-center (störst).** Läs-only-cache av godkända rutiner i IndexedDB +
  nedladdningsknapp + synkstatus + tydlig "visar sparad kopia"-banner vid nätbortfall. Avgränsa
  medvetet: ingen offline-sök, ingen bakgrundssynk, inga bilagor i v1 (se FRAMTIDSPLAN.md).
- **3b. Schemalagd Firestore-backup.** Veckovis JSON-dump av kärncollections till Storage.
- **3c. Sparad hälsokontroll-historik.** Persistera resultaten från beroende-/källkontrollerna
  så trender syns över tid, inte bara senaste körningen.
- **3d. 2FA-policy.** Inställning "kräv 2FA för superadmin/VÖL/VEC", kontrollerad även på server.
- **3e. Kiosk-/delad-enhetsläge** (om piloten efterfrågar det – annars nedprioriterat).

**Klart när:** en avdelning kan läsa alla sina godkända rutiner utan nät, en veckobackup finns
i Storage, och 2FA kan tvingas för redaktörsroller.

**Beroenden:** Etapp 1 (offline/backup/historik ska vara org-skopade från start).

---

## Etapp 4 – Pilot & härdning  ·  Storlek: M

**Mål:** bevisa nyttan hos en riktig kund och härda produkten inför bredare försäljning.

**Delmål:**
- Pilot: Core + Operations till en pilotavdelning (Operations utan extrakostnad, men avtalat
  som separat tillägg efter pilot).
- Mätning: tid-att-hitta, andel nollträffar, kvitteringsgrad, upplevd nytta (inbyggd feedback).
- Fullständig säkerhetsgenomgång av multi-tenant-lagret (mönster från Fas 11).
- Prestanda: bundle-storlek, indexgranskning, laddningstider under verklig data.

**Klart när:** piloten har körts en mätperiod och det finns data på vilka Operations-funktioner
kunden faktiskt värderar, samt en godkänd säkerhetsgenomgång av org-isoleringen.

**Beroenden:** Etapp 2 + 3.

---

## Etapp 5 – Intelligence-lansering (selektivt)  ·  Storlek: M

**Mål:** börja ta betalt för AI, i kontrollerad ordning.

**Delmål:**
- Lansera AI-dokumentimport som betald Intelligence-funktion (redan byggd, PII-spärr + budget).
- Klinikstöd: lansera först efter att Etapp 0:s skarpa validering är bekräftad och stabil över
  tid (den dagliga automatiska källkontrollen ger löpande kvitto).
- Ev. djupare AI-feedbackanalys utöver dagens grundstatistik.
- Kostnadsuppföljning per kund via den befintliga budget-/kvotmodellen.

**Klart när:** minst en kund betalar för Intelligence, och klinikstöd har ett dokumenterat spår
av godkända dagliga källkontroller.

**Beroenden:** Etapp 2 (gating) + Etapp 4 (pilotdata).

---

## Löpande genom alla etapper

- **Versionering + changelog** vid varje release (semver, `andringslogg.js`, UTVECKLINGSLOGG).
- **CI grön före merge** – build, lint, test (redan uppsatt i `.github/workflows/ci.yml`).
- **Enhetstester byggs ut** i takt med att säkerhetskritisk logik tillkommer – särskilt
  regel-lagret i Etapp 1 (Firestore rules-emulator).
- **Säkerhetsgenomgång** som egen aktivitet vid varje större etapp, inte bara i Etapp 4.
- **Håll säljmaterialet synkat** med faktisk byggstatus (✅/🔶/⬜ i MODULPLAN.md).

---

## Beroendekarta (kort)

```
Etapp 0  ─►  Etapp 1  ─►  Etapp 2  ─►  Etapp 4  ─►  Etapp 5
                 └──────►  Etapp 3  ─────┘
```

- **Etapp 0** kan börja nu, blockerar 1.
- **Etapp 1** är den stora grinden – blockerar 2 och 3.
- **Etapp 2 och 3** kan i hög grad köras parallellt när 1 är klar.
- **Etapp 4** kräver både 2 och 3.
- **Etapp 5** kräver gating (2) och pilotdata (4).

## Sammanfattning

| Etapp | Fokus | Storlek | Grind |
|---|---|---|---|
| 0 | Validera drift, stäng skulder | S | – |
| 1 | Organisationsmodell (multi-tenant) | XL | **Hård grind** |
| 2 | Feature-gating (moduler) | M | Kräver 1 |
| 3 | Bygg Operations klart | L | Kräver 1 |
| 4 | Pilot & härdning | M | Kräver 2+3 |
| 5 | Intelligence-lansering | M | Kräver 2+4 |

Kärnan i planen: **Etapp 1 är investeringen som gör Synappsen till en produkt.** Allt före den
är förvaltning av en enkundsapp; allt efter den är försäljning av en flerkundsprodukt. Håll den
som ett eget, välavgränsat och väl testat block – det är där risken och värdet är störst.
