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
| **3** | `src/hooks/`, `src/firebase/`, `src/utils/` | ~6 300 | ✅ **KLAR** 2026-08-17 |
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
| 3.1 | Klientens personnummerspärr missade den TOLVSIFFRIGA formen helt | **Hög** | ✅ Patchad |
| 3.2 | "Senast besökta" delades mellan användare på samma enhet – och skrevs in i nästa användares konto | **Medel** | ✅ Patchad |
| 3.3 | Kollegors push-tokens är läsbara och egna är fritt skrivbara → notiskapning | **Medel** | 🚩 **Flaggad, kräver ditt beslut** |
| 3.4 | `bildUrl`/`bilagor[].url` saknar ursprungsspärr; offlinehämtningen anropade dem | **Låg–medel** | ✅ Patchad (offlinedelen) |
| 3.5 | Del 1:s fältfilter nekade en riktig klientskrivning (min egen regression) + statistiken har aldrig fungerat | **Regression** | ✅ Patchad |

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

# Del 3 – Klientens datalager ✅ KLAR (2026-08-17)

Genomgången omfattade 60 hooks, `src/firebase/` (10 filer) och `src/utils/` (28 källfiler).
Fem trådar drevs: frågekonstruktion mot regellagret (list-provability), PII-filtrets
fullständighet, klientlagringen på en delad enhet, Storage-/URL-hanteringen, samt en
egenkontroll av att Del 1:s och Del 2:s patchar inte bröt någon riktig klientskrivning. Den
sista tråden var den mest lönsamma – se fynd 3.5.

## Fynd 3.1 — Personnummerspärren missade den form journalsystemen faktiskt visar

`src/utils/piiFilter.js` är appens **primära** skydd mot att patientuppgifter skrivs in i
Synappsen. Den körs på merparten av all fritext: skiftrapporter, bristanmälningar,
kommentarer, rutininnehåll. Mönstret såg ut så här:

```js
/\b(\d{2})(\d{2})(\d{2})[-+]?(\d{4})\b/g
```

Sex siffror datum, alltså **bara tiosiffriga** personnummer. Verifierat empiriskt mot
mönstret:

| Inmatning | Upptäcktes före patchen |
|---|---|
| `900101-0017` | ✅ ja |
| `9001010017` | ✅ ja |
| `19900101-0017` | ❌ **nej** |
| `199001010017` | ❌ **nej** |

Den tolvsiffriga formen är den svenska journalsystemen (TakeCare, Cosmic) visar, och alltså
den personal kopierar när de klistrar in. Filtret fångade den mindre sannolika formen och
släppte igenom den mest sannolika.

**Hur det hittades:** genom att bära en öppen fråga från Del 1 vidare. Del 1 patchade
serverregeln `harTroligtPersonnummer()` så att den täcker *båda* formerna. Att då gå tillbaka
och kontrollera om klientlagret sa samma sak visade att de två lagren var oense – och att det
svagare av dem låg på den bredare vägen. Serverregeln skyddar bara ett fåtal fält; det här
filtret skyddar nästan all fritext.

**Åtgärd:** ett valfritt, icke-fångande århundradeprefix `(?:19|20)?`. Luhn-kontrollen räknar
fortfarande på de tio sista siffrorna, så samordningsnummerlogiken (dag + 60) är oförändrad.
Fyra nya enhetstester, varav två failade före patchen. Ett femte test låser fast att en längre
siffersekvens (t.ex. 16 siffror i rad) fortfarande inte ger falskt larm.

## Fynd 3.2 — "Senast besökta" följde enheten, inte kontot

`src/utils/senastBesokta.js` sparade listan under en **global** localStorage-nyckel:

```js
const NYCKEL = "synappsen_senast_besokta";   // ingen uid
```

Två systerfiler resonerar uttryckligen om precis det här: `useOfflineCenter.js` ("Nyckeln
inkluderar uid – annars visar en delad/kiosk-dator fel …") och `checklistFramsteg.js`
("Nyckeln inkluderar uid så två personer som delar en enhet inte …"). `senastBesokta.js` är
äldre (Etapp 17b) och missade det — och är den enda av de tre som lagrar **innehåll**
(rutintitlar och sökvägar) i stället för en tidsstämpel.

Två konsekvenser på en delad akutmottagningsdator eller en kioskplatta (Etapp 55 gör delade
enheter till ett uttryckligen stött scenario):

1. Nästa person som loggade in såg föregående persons lista på startsidan.
2. **Allvarligare:** `useSenastBesokta.js` faller tillbaka på den lokala listan när kontots
   eget `senastBesokta`-fält saknas — vilket det gör för varje ny användare — och skriver
   sedan `lasSenastBesokta()` tillbaka till `users/{uid}`. Föregående persons besökshistorik
   hamnade alltså **permanent i en annan användares konto**, synkad till alla dennes enheter.

Utloggningsstädningen (`rensaLokalaAnvandardata()` i `firebase/config.js`) hjälpte inte:
den skrevs med den delade datorn som uttalad motivering men sveper bara `offlineCenter_*`.

**Åtgärd:** nyckeln är per uid, `uid` är obligatoriskt (utloggad ⇒ inget lokalt minne alls),
den gamla kontolösa nyckeln raderas aktivt från enheten vid inloggning, och
utloggningsstädningen sveper samtliga listor. **Medvetet inte svepta, och skälet står i koden:**
`offlineKo_{uid}` (köade bristanmälningar som ännu inte nått servern — att tömma den hade tyst
kastat bort någons anmälan) och `synappsen_checklista_{uid}_{rutinId}` (en påbörjad
checklistkörning). Båda innehåller uid, så nästa användare når dem aldrig via appen.

## Fynd 3.3 🚩 — Push-tokens kan kapas till en kollegas telefon (kräver ditt beslut)

Två regler i `firestore.rules` kombineras olyckligt:

- `users/{userId}`: `allow read: if arInloggad() && sameOrg` — vem som helst i organisationen
  får läsa en kollegas **hela** användardokument, inklusive `pushTokens`.
- Samma block låter en användare fritt skriva `pushTokens` på sig själv (fältet står i
  `bararForandrarFalt`-listan, motiverat med "opaka tokens … kräver ingen PII-spärr").

**Angreppet:** Alice läser Bobs `pushTokens`, lägger in Bobs token i sin egen lista och
utlöser sedan en notis till sig själv. `skickaPush()` i `functions/gemensamt.js` läser Alices
tokenlista och skickar — till Bobs telefon. Alice kan alltså få Synappsen-notiser att dyka upp
på en utvald kollegas låsskärm. På en akutmottagning är en falsk "Ny akutrutin: …" en
patientsäkerhetsnära social-engineering-väg, inte bara en olägenhet.

Angreppet ger **ingen** åtkomst till data Alice inte redan får läsa.

**Varför jag inte patchade:** Firestore har ingen fältnivåläsrätt, så den riktiga lösningen är
att flytta tokens ur `users/{uid}` — antingen till en subcollection eller till en egen
collection `pushEnheter/{token}` med `uid`-ägarskap. Båda innebär en migrering av befintliga
tokens och en ändring i varje push-väg server-side. Gör man det halvt (läser bara den nya
platsen) slutar notiserna tyst att fungera för alla nuvarande användare. Det faller under
undantaget i ditt åtgärdsmandat: en ändring som kan bryta en fungerande produktionsfunktion.

**Rekommendation:** egen collection `pushEnheter/{token}` med `{ uid, organisationId }`,
läs-/skrivbar enbart av ägaren, och en övergångsperiod där `skickaPush()` läser BÅDE det gamla
arrayfältet och den nya collectionen. Uppskattat omfång: en halv etapp. Säg till om du vill att
jag bygger det.

## Fynd 3.4 — Bildadresser saknar den ursprungsspärr externa källor har

`bildUrl` och `bilagor[].url` är vanliga Firestore-fält som en redaktör kan sätta till vilken
adress som helst. Projektet har redan precedens för att spärra sådant: `externaKallor`
valideras mot en domänlista server-side (`arGodkandaKallor()` i `firestore.rules`). Bildfälten
hade ingen motsvarighet.

Det gör mer än att visa en främmande bild: `useOfflineCenter.laddaNerBilder()` anropar
`cache.add(url)` på varje adress. En redaktör kunde alltså få **varje anställd som trycker
"ladda ner bilder"** att skicka ett anrop till en godtycklig extern värd, som därmed ser IP och
User-Agent för hela personalstyrkan.

**Åtgärd (delvis):** ny `src/utils/storageUrl.js` med `arStorageUrl()`, som offlinehämtningen
filtrerar genom — bara projektets egen Storage-bucket cachas. Sex enhetstester, inklusive att
en värd som bara *slutar* likadant (`firebasestorage.googleapis.com.example.net`) avvisas.

**Kvar:** `<img src={rutin.bildUrl}>` i `RutinKort.jsx`/`ForradArtikelKort.jsx` hämtar
fortfarande adressen vid rendering. Den halvan hör hemma i Del 4 (UI-ytor) och bör troligen
lösas i `firestore.rules` i stället, som `externaKallor` — men regelbudgeten är redan slut två
gånger om, så det kräver en egen avvägning.

## Fynd 3.5 — Del 1:s fältfilter nekade en riktig klientskrivning (min egen regression)

Del 1 lade en fältbegränsning på `checklistkorningar` med
`hasOnly([... 'avbrottPerSteg'])`. Klienten skriver så här:

```js
setDoc(ref, { organisationId, [`avbrottPerSteg.${stegIndex}`]: increment(1) }, { merge: true });
```

Punktnotation tolkas som en fält**sökväg** av `updateDoc`, men **inte** av `setDoc` — `setDoc`
skapar ett toppnivåfält som bokstavligen heter `avbrottPerSteg.3`. Det namnet står inte i
tillåtlistan, så skrivningen **nekas**. Verifierat mot emulatorn: `PERMISSION_DENIED`.

Del 1:s testsvit missade det därför att testet skrev `{ antalSlutforda: 1 }` — ett fält som
råkade vara enkelt. Ett fältfilter måste testas mot **varje** faktisk skrivning, inte mot en
representativ.

Samma rad avslöjade en bugg som funnits sedan Etapp 18d: `ChecklistStatistikSektion.jsx` läser
`s.avbrottPerSteg` och kör `Object.entries()` på den, men det fältet skapades aldrig — bara
syskonfält med punkt i namnet. **"Mest avbrutna steg" har alltid visat "-".**

**Åtgärd:** en riktig nästlad map, `{ avbrottPerSteg: { [stegIndex]: increment(1) } }`.
`increment()` fungerar inne i en map och `merge: true` slår ihop med befintliga steg. Två nya
regeltester låser fast båda halvorna: den nästlade formen ska passera, punktformen ska inte
kunna smyga tillbaka. Regressionen hann aldrig ut i produktion (inget av granskningen är
deployat) men hade gjort det vid nästa deploy.

## Genomgång utan anmärkning

- **List-provability:** samtliga 37 frågeställande hooks kartlagda mot sina `where`-satser.
  Alla utom två filtrerar på `organisationId`; de två (`useBaspaketreferenser` —
  plattformsadmin-bara, och `useRutinDiffSedanLast` — subcollection under en rutin vars
  regel slår upp förälderns organisation) är korrekta som de är. Ingen ny motsvarighet till
  Etapp 31b:s bugg hittad.
- **`halsokontrollhistorik` och `systemvarningar`:** båda är globalt läsbara för varje kunds
  superadmin, vilket såg ut som fynd 2.1 igen. Genomgång av samtliga skrivställen
  (`functions/klinikstod.js`, `functions/revisionslogg.js`) visar att innehållet efter Del 2
  enbart är infrastrukturstatus — Gemini, sökmotorn, Storage — utan kundidentitet. Designen
  stämmer med sin egen dokumenterade motivering.
- **Storage-sökvägar:** filnamn byggs av `${Date.now()}-${fil.name}` där `fil.name` är
  användarstyrt. Ett `/` i namnet skulle lägga till ett segment, men varje `match`-block i
  `storage.rules` binder ett exakt antal segment, så en sådan sökväg matchar ingen regel och
  nekas. Fallerar stängt. `..` betyder inget i GCS (platt namnrymd).
- **`registreraVisning()`** skriver exakt de fem fält Del 1:s tillåtlista anger — kontrollerat
  explicit efter fynd 3.5.
- **MFA (`mfa.js`)** och **push-registrering (`messaging.js`)**: tunna omslag kring
  Firebase-SDK:n, ingen egen hemlighetshantering, ingen tokenlogg.
- **`felrapportering.js`:** skickar bara collection/roll/organisation/sökväg till Sentry,
  aldrig dokumentinnehåll — kravet från Etapp 32a hålls.
- **`functions.js`:** 45 tunna callable-omslag. De som skickar `orgId` från klienten
  verifierades i Del 2 som plattformsadmin-grindade server-side.
- **ReDoS:** de enda dynamiska regexarna i lagret finns i `piiFilter.js` och har inga
  nästlade kvantifierare.
- **Utloggningsstädningen** tömmer Firestores IndexedDB-cache och bildcachen korrekt, med
  motiverad felsvälining per steg.

## Test och verifiering

- `src/utils/piiFilter.test.js`: +5 tester (två failade före patchen).
- `src/utils/senastBesokta.test.js`: omskriven för uid-argumentet, +3 tester för delad enhet
  (alla tre failade före patchen).
- `src/utils/storageUrl.test.js`: ny, 6 tester.
- `tests/rules/sakerhetsgranskning.test.mjs`: +2 tester för fynd 3.5 (**20 totalt**). Testet
  för punktnotationen bevisades faila mot koden före patchen genom en separat emulatorkörning.

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
| **v5.116.0** | **Säkerhetsgranskning Del 3** | ❌ **Nej** |

Ägaren har valt att avvakta med deploy under granskningen. **Fynd 1.1–1.3, 2.1–2.2 och
3.1–3.2/3.4 är därmed patchade i koden men fortfarande öppna i produktion.**

Fynd 3.5 är motsatsen och måste läsas som en egen rad i kön: det är en regression som Del 1
införde och som Del 3 rättade **innan** något deployades. Deployas v5.114.0 utan v5.116.0
slutar checklistlägets avbrottsräknare att fungera. Delarna ska alltså deployas tillsammans,
inte en i taget.
