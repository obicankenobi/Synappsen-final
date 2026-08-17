# Säkerhetsgranskning 2026-08 – fullständig genomgång av all kod

**Uppdrag:** granska samtlig kod i projektet efter svagheter som går att utnyttja, åtgärda
allt eftersom, i fyra omgångar. Beställd av ägaren 2026-08-17.

**Ägarbeslut som styr arbetet** (fattade före start, se `BESLUTSLOGG.md`):

| Fråga | Beslut |
|---|---|
| Åtgärdsmandat | Patcha direkt med bästa bedömning och dokumentera. **Undantag:** ändringar som kan låsa ute befintliga användare eller bryta produktionsåtkomst flaggas först |
| firebase-tools (kritisk `tar`-sårbarhet) | Försök uppgradera; rulla tillbaka och dokumentera exakt vad som brast |
| Deploy vid produktionsfynd | **Avvakta oavsett** – inget deployas under granskningen |

> ⚠️ **Konsekvens av deploy-beslutet, som måste stå tydligt:** samtliga patchar nedan är
> committade men **INTE deployade**. Produktionen kör v5.106.0. En patchad men odeployad
> sårbarhet skyddar ingen. Se "Deploystatus" längst ner för den fullständiga kön.

## Metod

Granskningen är uppdelad efter **risktäthet**, inte radantal – en rad i regellagret kan öppna
hela multi-tenant-isoleringen, medan tusen rader UI-kod sällan kan det.

| Del | Omfattning | Rader | Status |
|---|---|---|---|
| **1** | `firestore.rules`, `storage.rules`, `roles.js`, `AuthContext`, `tests/rules/` | ~1 500 | ✅ **KLAR** 2026-08-17 |
| **2** | `functions/` (14 filer) | ~5 500 | ✅ **KLAR** 2026-08-17 |
| **3** | `src/hooks/`, `src/firebase/`, `src/utils/` | ~6 300 | ⬜ Ej påbörjad |
| **4** | `src/components/`, `src/pages/`, CSP, workflows, beroenden | ~14 600 | ⬜ Ej påbörjad |

**Varje fynd som patchas får ett regressionstest som bevisligen failar mot koden före
patchen.** Ett test som passerar både före och efter bevisar ingenting.

---

## Sammanfattning av alla fynd hittills

| # | Fynd | Allvarlighet | Status |
|---|---|---|---|
| 1.1 | Personnummer-spärren missade samordningsnummer för födda den 22–31 | **Medel–hög** | ✅ Patchad |
| 1.2 | Leverantören kunde läsa varje kunds revisionslogg utan kundens medgivande | **Medel** | ✅ Patchad |
| 1.3 | `visningar`/`checklistkorningar` saknade fältbegränsning | **Medel** | ✅ Patchad |
| 1.4 | Kritisk `tar`-sårbarhet i `firebase-tools` | **Låg i praktiken** | ⚠️ Kvarstår, se nedan |
| 1.5 | `profilbildUrl` är helt ovaliderad | **Låg** | 📋 Dokumenterad |
| 1.6 | Användare kan sätta sin egen `senasteInloggning` | **Låg** | 📋 Dokumenterad |
| 1.7 | `soksstatistik`-räknare kan sättas till godtyckliga värden | **Låg** | 📋 Dokumenterad |
| 1.8 | Releasechecklistan körde testsviten *före* versionsbumpen | **Process** | ✅ Rättad |
| 2.1 | Nattkontrollen läckte leverantörens kundlista + andras integritetslarm till varje kund | **Medel** | ✅ Patchad |
| 2.2 | Kundens kedjestatus visade en global dom över alla kunder | **Låg (korrekthet)** | ✅ Patchad |
| 2.3 | Inbjuden e-postadress kan "squattas" i Firebase Auth före inlösen | **Låg** | 📋 Dokumenterad |
| 2.4 | Klinikstöd-cachenyckeln trunkeras till 480 tecken | **Låg** | 📋 Dokumenterad |

---

# Del 1 – Regel- och behörighetslagret ✅ KLAR (2026-08-17)

Genomgången omfattade hela `firestore.rules` (1 046 rader) rad för rad, `storage.rules`,
`roles.js`, `AuthContext.jsx` samt de 15 befintliga regeltestfilerna som facit.

## Fynd 1.1 — Personnummer-spärren missade en tredjedel av alla samordningsnummer

**Allvarlighet: medel–hög.** Detta är den allvarligaste svagheten i Del 1.

Produktens kanske viktigaste säkerhetslöfte är att patientuppgifter aldrig lagras – både
`PITCH.md` och `JURIDISK-GRANSKNING.md` bygger MDR-argumentationen på det. `firestore.rules`
är den **hårda** spärren; klientfiltret (`utils/piiFilter.js`) är bara första lagret och
kringgås helt av ett direktanrop mot Firestores REST-API, vilket är hela skälet till att
regeln finns (samma resonemang som Etapp 12e när `forradsartiklar` fick spärren).

Ett svenskt **samordningsnummer** är personnumret med **60 adderat till födelsedagen**.
Riktiga dagar är 1–31, så dagfältet löper 61–91. Regeln täckte bara `6[1-9]|7\d|8[01]`,
alltså **61–81** – och missade därmed **82–91**, vilket motsvarar alla födda den 22:a–31:a i
månaden. Ungefär en tredjedel av alla samordningsnummer passerade obehindrat.

Klientfiltret fångade dem (dess `giltigtDatum()` drar av 60 och accepterar 1–31), vilket
förklarar varför luckan aldrig märktes i normal användning – de två lagren var osynligt oense,
och bara det svagare av dem satt i den väg som faktiskt går att kringgå.

**Verifierat empiriskt före patch:**

| Dagfält | Motsvarar | Klienten såg giltigt datum | Regeln blockerade |
|---|---|---|---|
| 61, 75, 81 | dag 1, 15, 21 | ja | ja |
| **82, 85, 91** | **dag 22, 25, 31** | **ja** | **NEJ** |

**Åtgärd:** dagfältet ändrat till `6[1-9]|[78]\d|9[01]` = 61–69, 70–89, 90–91, alltså
fullständigt 61–91. Ogiltiga dagfält (92–99, 00, 32–60) nekas fortfarande, verifierat.

## Fynd 1.2 — Leverantören kunde läsa varje kunds fullständiga revisionslogg

**Allvarlighet: medel** (integritet/GDPR, inte teknisk kompromettering).

```
allow read: if (arSuperadmin() && matcharMinOrg(...)) || arPlattformsadmin();
```

Andra grenen gav **varje leverantörsadmin stående läsrätt till varje kunds hela
revisionslogg** – `aktorUid`, `handelsetyp` och `sammanfattning`, alltså vem hos kunden som
gjorde vad och när. Det skedde:

- utan kundbeviljat fönster,
- utan att kunden kunde se att det pågick,
- utan spår (en klientläsning mot Firestore loggas ingenstans).

Det motsäger direkt den princip Etapp 50b etablerade för allt annat kundinnehåll: leverantören
kommer in bara genom ett **tidsbegränsat fönster som kunden själv öppnar** och ser i sin
adminpanel. Rutiner, anslag, kontakter och förrådsartiklar är alla gated på `farSupportlasa()`
– revisionsloggen, som är den mest personuppgiftstäta av dem, var det inte.

**Verifierat att ingen funktion gick förlorad:** enda klientläsningen av collectionen är
`useRevisionslogg.js`, som alltid filtrerar på den egna organisationen. Leverantörsvyns
diagnostik hämtar senaste händelse via `hamtaOrganisationsdiagnostik` (Cloud Function, Admin
SDK) som kringgår reglerna helt. Grenen var alltså oanvänd åtkomst, inte en funktion.

**Åtgärd:** `|| arPlattformsadmin()` → `|| farSupportlasa(resource.data.organisationId)`.
Supportvägen finns kvar, men kräver nu kundens medgivande som allt annat.

## Fynd 1.3 — `visningar` och `checklistkorningar` saknade fältbegränsning

**Allvarlighet: medel.**

Båda tillät vem som helst inloggad i organisationen att skriva **godtyckliga fält** – ingen
`keys().hasOnly()`, ingen PII-spärr. Den strukturellt identiska `soksstatistik` bredvid hade
redan fältallowlist, vilket visar att detta var en inkonsekvens och inte ett designval.

Konsekvensen är konkret för `visningar`: fältet `titel` renderas för **alla i organisationen**
under "Populärast" i kommandopaletten. Ett direktanrop kunde alltså skriva godtycklig text –
inklusive ett personnummer – rakt in i en yta hela arbetsplatsen ser, helt förbi alla
PII-spärrar som skyddar de vanliga innehållsfälten.

**Åtgärd:** fältallowlist på create och update i båda collections, plus personnummer-spärr på
`visningar.titel`/`sokvag`. Klienten skriver bara rutintitlar som redan är spärrade vid sin
källa, så spärren är en no-op för legitima skrivningar (bevisat med test).

## Fynd 1.4 — Kritisk `tar`-sårbarhet i `firebase-tools` ⚠️ KVARSTÅR

`npm audit` rapporterar 7 sårbarheter (1 kritisk, 6 höga). **Samtliga sitter i
`firebase-tools`** och dess transitiva beroenden. Den kritiska är
`tar` – arbitrary file creation/overwrite via hardlink path traversal.

**Faktisk blast radius är begränsad:** `firebase-tools` är en `devDependency`. Den ingår inte
i den byggda appen och når aldrig en slutanvändare. Exponeringen är utvecklingsmaskinen och
CI-runnern.

**Uppgraderingsförsök enligt ägarbeslut (13.35.1 → 15.27.0):**

| Testsvit | Före | Efter uppgradering |
|---|---|---|
| `test:rules` (15 filer) | grön | ✅ grön |
| `test:storage` | 24/24 | ❌ **18/24** |

De sex fel som uppstod var **samtliga "ska tillåtas"-tester** – varenda "ska nekas"-test
passerade fortfarande. Felen var `EvaluationException: Null value error` på just de rader i
`storage.rules` som gör cross-service-uppslag (`firestore.get(...)` i `minRoll()` och
`minOrganisation()`). I firebase-tools 15 returnerar det anropet null i storage-emulatorn, så
regelutvärderingen havererar och **allt nekas**.

Det failar alltså *stängt*, inte öppet – men effekten är att sex tester på en säkerhetskritisk
väg (storage-lagrets organisationsisolering) blir blinda. Att förlora just den verifieringen
mitt i en säkerhetsgranskning är ett sämre utbyte än att leva med en dev-only-sårbarhet.

**Beslut: rollback.** `firebase-tools` står kvar på `^13.35.1`, `test:storage` åter 24/24.

**Rekommenderad väg framåt** (ej gjord nu, kräver eget beslut): felet ser ut att vara en
emulator-regression i hur storage-emulatorn når Firestore-emulatorn, inte ett problem med
reglerna (produktionens Storage-regler stödjer `firestore.get()`). Ett riktat försök vore att
kontrollera om nyare firebase-tools kräver explicit wiring mellan emulatorerna i
`firebase.json`. Tills dess: sårbarheten är dokumenterad, dev-only, och `npm audit` kommer
fortsätta rapportera den vid varje sessionsstart.

## Fynd 1.5–1.7 — Lågriskobservationer, medvetet inte patchade

Dessa är **dokumenterade men inte åtgärdade**, eftersom patchen i varje fall kostar mer risk
eller komplexitet än den svaghet den stänger. De hör hemma i ett eget beslut, inte i en
säkerhetspatch.

**1.5 `profilbildUrl` är helt ovaliderad.** En användare får skriva sitt eget
`users/{uid}.profilbildUrl` till vilken sträng som helst; den renderas sedan som
`<img src=...>` för alla kollegor i organisationen. XSS är inte möjligt via `img src`, och
CSP:n tillåter redan `img-src https:`, så det handlar inte om kodkörning – men en användare
kan peka den mot en server de kontrollerar och därmed logga IP och tidpunkt för varje kollega
som ser deras namn i en lista. Låg påverkan, men värd att känna till.
*Möjlig åtgärd:* kräv att URL:en börjar med organisationens egen Storage-bucket.

**1.6 Användare kan sätta sin egen `senasteInloggning`.** Fältet ligger i självuppdaterings-
listan (det skrivs av `AuthContext` vid inloggning). En användare kan därmed sätta det framåt
i tiden och undgå att dyka upp i adminpanelens "inaktiva konton"-vy. Påverkar en
förvaltningsvy, inte behörighet.

**1.7 `soksstatistik`-räknare kan sättas till godtyckliga värden.** Fältallowlisten finns, men
inget hindrar att `antalNollTraffar` sätts till ett godtyckligt tal. Det förstör
nollträffsprocenten i ledningsrapporten. Integritet i mätvärden, inte i säkerhet.

## Fynd 1.8 — Releasechecklistan dolde ett redan failande test

**Allvarlighet: process, inte säkerhet – men det är så här riktiga fel slinker igenom.**

Under Del 1:s testsvep visade det sig att `tests/docs/pitch-version.test.js` **redan failade
innan granskningen började**. Testet är en avsiktlig vakthund: `PITCH.md` får inte ligga mer
än 15 minorversioner efter `package.json`. Vid v5.113.0 var driften 16.

Orsaken är ordningen i den releaserutin jag följt: jag har kört `lint`/`build`/`vitest`
**före** versionsbumpen. Vakthunden jämför mot `package.json`, så den utvärderade alltid den
*gamla* versionen och gav grönt — felet uppstod först i och med bumpen, efter att testerna
redan körts. v5.113.0 (Etapp 67e) committades därför med ett rött test utan att det syntes.

**Åtgärd:** `PITCH.md` uppdaterad till v5.114.0, och innehållet kompletterat med de
kundvända funktioner som saknades (handledarsignering, ansvarsområden, uppläsning, "ändrat
sedan du läste", synonymsökning, kategoriserade driftstörningar). Framåt måste testsvepet
köras **efter** versionsbumpen, inte före.

En sak värd att notera i sammanhanget: `PITCH.md` påstod redan före granskningen att appen
"blockerar tekniskt personnummer i alla fritextfält – i formuläret, på servern och i databasens
egna regler". Fynd 1.1 visar att det påståendet var **delvis osant** när det skrevs – regeln
missade en tredjedel av alla samordningsnummer. Efter patchen stämmer det.

## Genomgång utan anmärkning

Följande kontrollerades särskilt och visade sig korrekta:

- **Organisationsisoleringen** – varje kunddatablock kedjar `matcharMinOrg()`, som både
  jämför `organisationId` och kontrollerar att organisationen inte är pausad. Ingen collection
  förlitar sig på enbart en rollkontroll.
- **`urlHarGodkandDoman()`** – testad mot kringgåendeförsök: `evil-internetmedicin.se`,
  `internetmedicin.se.evil.com` och userinfo-tricket `https://internetmedicin.se@evil.com/`
  avvisas alla korrekt av ankringen.
- **ReDoS** – Firestores regelspråk använder RE2 (linjär tid, ingen backtracking). De uppradade
  PII-kontrollerna kan inte utnyttjas för katastrofal backtracking.
- **`anteckningar`** – prefix- och fältkontrollen stämmer överens sedan fixen 2026-08-11; A kan
  inte längre plantera en anteckning i B:s privata ruta.
- **`plattformsadmin`/`inbjudningar`** – båda helt stängda för klientskrivning.
  `blibForstaPlattformsadmin` kräver superadmin *och* att ingen plattformsadmin finns än.
- **Krav 28** (`request.auth.uid != uid` på introduktionssigneringar) – ligger i regellagret,
  inte bara i gränssnittet, precis som avsett.

## Test och verifiering

Ny testfil `tests/rules/sakerhetsgranskning-del1.test.mjs` (15 tester), inlagd i
`npm run test:rules`.

**Bevis på att testerna är meningsfulla** – körda mot regelfilen som den såg ut *före* patchen:

```
8 klarade, 7 misslyckade
```

De 7 som failade är exakt de som motsvarar fynd 1.1–1.3. Efter patch: **15/15 gröna**.
"Fungerar oförändrat"-testerna passerar i *båda* körningarna, vilket visar att legitim
användning inte påverkas av någon patch.

---

# Del 2 – Cloud Functions ✅ KLAR (2026-08-17)

Genomgången omfattade alla 14 filer i `functions/` (~5 500 rader) och ~93 exports.

**Den öppna frågan från Del 1 besvarades — och svaret var ja, det läckte.** Se fynd 2.1.

## Fynd 2.1 — Nattkontrollen läckte leverantörens kundlista till varje kund

**Allvarlighet: medel.** Cross-tenant informationsläckage i en multi-tenant-produkt vars
kärnlöfte är "fullt isolerade" organisationer.

`verifieraRevisionskedjor()` (nattligt jobb, 04:00) skrev varje avvikande organisations ID till
**två** collections som enligt `firestore.rules` är läsbara av en superadmin i *vilken
organisation som helst*:

```js
systemstatus/revisionskedja.avvikelser = [{ orgId, orsak }, ...]
systemvarningar.meddelande = "Hashkedjan är bruten för 2 organisation(er): orgB (…) | orgC (…)"
```

Varje kunds superadmin kunde alltså läsa ut:

- **andra kunders organisations-ID** — i praktiken leverantörens kundlista, kommersiellt känslig
- **vilka av dem som hade en bruten revisionskedja** — ett allvarligt integritetslarm om någon
  annans verksamhet

Det som gör fyndet tydligt är att **kodbasen redan dokumenterar den korrekta principen på två
andra ställen och följer den där**. `reserveraBudget()`: *"Sentry, INTE systemvarningar: den
collectionen är delad … och skulle här läcka en annan kunds AI-förbrukning till alla andra
kunders superadmins."* `okaSokkvot()`: *"bara AGGREGAT … Att lägga en annan kunds
sökförbrukning där hade läckt cross-tenant."* Nattkontrollen var undantaget som inte följde
sin egen husregel.

**Kontrollerat och friat:** `klinikstod.js` skriver också till `halsokontrollhistorik` och
`systemvarningar`, men enbart om delad infrastruktur (Gemini, sökmotor, Storage,
källverifiering) — ingen organisationsdata. De är korrekt klassade som delade.

**Åtgärd:**
- Detaljerna går nu enbart till Sentry, som bara når leverantören — exakt mönstret
  `reserveraBudget()` etablerade.
- `systemvarningar`-meddelandet anger **antalet** drabbade organisationer, aldrig vilka.
- `systemstatus/revisionskedja` innehåller bara leverantörens driftaggregat, och läsrätten är
  skärpt från `arSuperadmin()` till `arPlattformsadmin()` — dokumentet *är* leverantörens
  plattformsöversikt, inte kunddata.

## Fynd 2.2 — Kundens kedjestatus var en global dom över alla kunder

**Allvarlighet: låg, men det är en korrekthetsbugg med säkerhetsinnebörd.**

Samma dokument bar fältet `alletGiltigt` — sant bara om **samtliga** organisationers kedjor var
intakta — och det renderades i *varje kunds egen* incidentberedskapsvy. Kund A fick alltså
"🔴 Avvikelse upptäckt" när kund B:s kedja brast, och "🟢 Intakt" sa ingenting om A:s egen
kedja. Vyn som ska svara på "är min revisionslogg orörd?" svarade på något helt annat.

Samma vy visade också `antalOrganisationerKontrollerade`, dvs. hur många kunder leverantören
har — till varje kund.

**Åtgärd:** varje organisation får nu sitt eget resultat på
`organisationer/{orgId}.revisionskedja` (`giltig`, `orsak`, `senastKord`), ett dokument som
redan är korrekt organisationsskopat. `useSystemstatus.js` och `IncidentberedskapSektion.jsx`
läser därifrån och visar den egna statusen, med orsakstext när kedjan brustit.

## Fynd 2.3–2.4 — Lågriskobservationer, dokumenterade

**2.3 En inbjuden e-postadress kan "squattas".** `losInInbjudan` kräver korrekt att den
inloggade adressen matchar inbjudans, men kontrollerar inte `email_verified`. En angripare som
gissar en adress som kommer att bjudas in (ofta förutsägbar, `fornamn.efternamn@region.se`) kan
registrera den i Firebase Auth först och därmed blockera den riktiga personen. **Ingen
behörighet vinns** — token är fortfarande hemligheten — så det är en tillgänglighetsstörning,
inte ett övertag. Möjlig åtgärd: kräv `request.auth.token.email_verified` vid inlösen.

**2.4 Klinikstöd-cachenyckeln trunkeras.** Nyckeln är base64url av
`${organisationId}::${fraga}`, avhuggen vid 480 tecken (~360 byte). Eftersom `organisationId`
ligger **först** kan trunkeringen aldrig ge en kollision mellan två organisationer — bara
mellan två mycket långa frågor inom samma organisation, som då kan få varandras cachade svar.
Verifierat att ordningen är rätt; noteras för att beslutet inte ska gå förlorat.

## Genomgång utan anmärkning

Följande kontrollerades systematiskt och höll:

- **Autentisering:** samtliga callables kontrollerar `request.auth` — verifierat programmatiskt
  över alla exports, noll undantag.
- **IDOR:** bara tre funktioner tar emot `organisationId` från klienten, och alla tre går genom
  `kravLasningAvRevisionslogg()`, som bara litar på värdet om anroparen är plattformsadmin och
  annars härleder organisationen ur anroparens eget användardokument.
- **Rolländring** (`uppdateraAnvandarRoll`): superadmin, samma organisation, giltig roll ur en
  fast lista, loggas i revisionsloggen.
- **Supportåtkomst** (`beviljaSupportAtkomst`): `orgId` härleds ur anroparen, så leverantören
  kan **inte** bevilja sig själv åtkomst — Etapp 50b:s princip håller i koden.
- **SSRF i källbevakningen:** `domanGodkand()` körs som ett andra försvarslager före varje
  hämtning, med en kommentar som säger exakt varför ("en URL som av någon anledning skulle ha
  smugit sig igenom, t.ex. skriven direkt av Admin SDK, hämtas ändå aldrig"). Domänkontrollen
  använder `new URL().hostname` och `endsWith('.' + domän)`, så `evil-1177.se` och
  `1177.se.evil.com` avvisas båda korrekt.
- **Inbjudningstoken:** 192 bitar från `crypto.randomBytes(24)`, e-postbindning vid inlösen,
  transaktion mot dubbelinlösen, utgångstid kontrollerad.
- **Path traversal i backup-återställning:** `sokvag` måste börja med `backups/${orgId}/`, och
  GCS behandlar `..` som ett vanligt tecken i objektnamn (inte en katalognivå), så
  `backups/orgA/../orgB/x.json` pekar på ett objekt som helt enkelt inte finns.
- **Personnummer i AI-flöden:** frågor till Gemini avvisas server-side om de innehåller ett
  personnummer, och `innehallerPersonnummer()` i `gemensamt.js` använder den **fullständiga**
  Luhn + datumkontrollen — den hade alltså inte luckan som fynd 1.1 avslöjade i regellagret.
- **Hemligheter:** API-nycklar hämtas via `defineSecret`, loggas aldrig. Mottagaradresser
  utelämnas medvetet ur loggarna med en dokumenterad motivering.

## Test och verifiering

- `tests/rules/sakerhetsgranskning.test.mjs` utökad med fynd 2.1 (**18 tester totalt**,
  filen omdöpt från `-del1` eftersom den nu spänner över flera delar).
- `tests/functions/etapp32d.test.cjs`: **två tester hade kodifierat läckaget** och är vända till
  att bevisa att det är stängt. Det ena krävde uttryckligen att systemvarningen *nämnde* den
  trasiga organisationen vid namn; det andra att `avvikelser`-listan fanns. Båda kräver nu
  motsatsen, plus ett nytt test på att varje organisation får sin egen status.

---

# Del 3 – Klientens datalager ⬜ Ej påbörjad

`src/hooks/`, `src/firebase/`, `src/utils/`. Frågekonstruktion (inkl. list-provability),
PII-filtrets fullständighet, offline-kön, klientlagring.

---

# Del 4 – UI-ytor och leveranskedja ⬜ Ej påbörjad

`src/components/`, `src/pages/`, CSP, GitHub Actions-workflows, beroenden. XSS-sänkor
(`marked`/DOMPurify), länkinjektion, hemligheter i byggsteg.

---

## Deploystatus

| Version | Innehåll | Deployad |
|---|---|---|
| v5.106.0 | Etapp 66d | ✅ Ja (körning #78) |
| v5.107.0 | SVG-spärr + fyra ägarbeslut | ❌ Nej |
| v5.108.0–v5.113.0 | Etapp 67a–67e | ❌ Nej |
| **v5.114.0** | **Säkerhetsgranskning Del 1** | ❌ **Nej** |
| **v5.115.0** | **Säkerhetsgranskning Del 2** | ❌ **Nej** |

Ägaren har valt att avvakta med deploy under granskningen. **Fynd 1.1–1.3 och 2.1–2.2 är
därmed patchade i koden men fortfarande öppna i produktion.**
