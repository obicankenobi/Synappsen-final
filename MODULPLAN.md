# Synappsen – modul- och affärsplan (reviderad)

*Uppdaterad utifrån faktisk kodstatus i v5.10.0. Ersätter det ursprungliga modulupplägget.*

Grundstrukturen i ursprungsförslaget står fast: en obligatorisk **Core** plus två tillval,
**Operations** och **Intelligence**, styrt tekniskt via organisationsnivå, feature flags och
servervalidering. Sälj utfall, inte implementation. Det som ändrats mot ursprungsförslaget:

1. **Klinikstöd är redan byggt enligt målarkitekturen** – inte en framtida funktion (se nedan).
2. **Byggstatus är utmärkt per funktion** (✅ klart / 🔶 delvis / ⬜ ej påbörjat) så säljmaterial
   inte lovar sådant som ännu inte finns.
3. **Organisationsmodellen är upphöjd till det stora, första tekniska arbetet** – inte ett
   snabbt förberedande steg. Det är den enskilt största och mest riskfyllda migreringen i hela
   planen och blockerar allt annat modularbete.

---

## Paketen (med faktisk byggstatus)

### Core – obligatorisk kärna
*"Ett gemensamt, kvalitetssäkrat ställe för avdelningens viktigaste information."*

Feature-gatas inte – alltid tillgängligt.

- ✅ Rutiner, sök, anslag, förråd, kontakter, länkar
- ✅ Roller, versionshistorik, kvittering, godkännandeflöde
- ✅ Rutinägare, QR-koder, favoriter, senast besökta, notiser
- ✅ Grundadmin, audit-logg, papperskorg, mörkt läge
- ✅ 2FA (frivillig), auto-utloggning, PII-spärr i formulär

Core är redan tillräckligt starkt för att en kund ska kunna stanna där. Det är det naturliga
pilotpaketet och kräver ingen AI-diskussion.

### Operations – kontinuitet, ansvar, kontroll
*"Håll rutiner aktuella och tillgängliga när driften är som mest sårbar."*

- ✅ Rutinägare → riktade granskningspåminnelser → "Mina uppgifter" (klart 5.9–5.10)
- ✅ Beroende-/hälsokontroll i admin (grönt/gult/rött, 5.9)
- ✅ CSV-export av kvitteringsläge (5.7)
- ✅ Force-logout / återkalla session
- 🔶 Export/backup – CSV-export finns, men **schemalagd Firestore-backup är ej byggd**
- ⬜ Offline-center + synkstatus (IndexedDB) – ej påbörjat, hög prioritet
- ⬜ Sparad historik för hälsokontroller – resultaten visas men persisteras inte
- ⬜ 2FA-**policy** (tvinga för redaktörsroller) – 2FA finns, men kan inte krävas ännu
- ⬜ Delad-enhet/kioskläge

**Säljkonsekvens:** ~halva Operations är byggt idag. Var tydlig internt om vad som är klart vs.
vad som krävs innan paketet håller vad det lovar. Offline är det tyngsta återstående arbetet.

### Intelligence – kontrollerad AI
*"Minska manuellt innehållsarbete med kontrollerad AI."*

- ✅ AI-tolkning foto/PDF → rutinutkast, alltid mänsklig granskning före publicering (klart
  sedan tidigt)
- ✅ PII-spärr i Cloud Function före Gemini-anrop
- ✅ AI-budget + kvot per användare och globalt, styrt från admin
- ✅ **Klinikstöd-sökning – byggd enligt målarkitekturen och i drift** (se nedan)
- ✅ Klinikstöd-feedback + vanligaste frågor synliga i admin (5.10)
- 🔶 Djupare AI-feedbackanalys – grunddata visas, mer avancerad analys återstår

**Säljkonsekvens:** AI-dokumentimport är redo att säljas nu (inte bara "lågriskdel att börja
med"). Klinikstöd är också byggt – se korrigeringen nedan.

---

## Viktig korrigering: klinikstöd är redan byggt

Ursprungsdokumentet beskriver den kontrollerade retrieval-arkitekturen som något som återstår.
Den är byggd och i drift (v5.6.0, förstärkt i 5.9–5.10):

1. ✅ En riktig domänbegränsad Google Programmable Search Engine söker endast mot de godkända
   källorna (internetmedicin.se, 1177.se, Nationella kliniska kunskapsstödet, FASS,
   Läkemedelsverket, Vårdhandboken, Folkhälsomyndigheten). Begränsningen sitter i sökmotorns
   konfiguration – inte i en promptinstruktion som modellen kan ignorera.
2. ✅ Servern hämtar de faktiska träffarna (titel + utdrag).
3. ✅ Gemini får **enbart** dessa utdrag som kontext och sammanfattar – söker aldrig fritt själv.
4. ✅ Svaret innehåller källänkar och redovisar vilken träff varje påstående kommer ifrån.
5. ✅ Räcker inte underlaget avstår den, och en efterhandskontroll blockerar ändå allt som
   mot förmodan skulle hamna utanför godkänd domän.

Dessutom: manuell verifieringsknapp i admin (5.9) och en **daglig automatisk källkontroll**
(5.10) som larmar superadmin om källbegränsningen driftar. Funktionen som pausades i 5.3.5 är
alltså ombyggd och återaktiverad.

**Kvarstår att göra:** livetesta i skarp miljö efter deploy (dokumenterat i FRAMTIDSPLAN.md).
Innan dess: sälj klinikstöd som "byggt, under skarp validering", inte som en färdig referens.

---

## Den stora tekniska investeringen: organisationsmodellen

Detta är planens tyngsta arbete, inte ett snabbt förberedande steg. Idag är appen byggd för
**en enda organisation** – ingenting är organisationsskopat:

- Roller är **globala**: `users/{uid}.role` är en enda sträng, inte kopplad till någon
  organisation.
- **Ingen collection har ett `organisationId`** – rutiner, anslag, kontakter, kommentarer,
  förråd m.m. ligger i en gemensam pool.
- **Hela `firestore.rules` måste bli organisationsmedveten.** Varje hjälpfunktion
  (`arSuperadmin()`, `farRedigeraOmrade()`, …) behöver kontrollera medlemskap i rätt
  organisation. Det är en omskrivning av regelfilen, inte ett tillägg.
- **AI-budgeten (`installningar/geminiBudget`) är en enda pool för hela appen.** För flera
  betalande kunder måste den bli per-organisation, annars delar två kunder budget/kvot.
- **Alla Cloud Functions** som rör budget, AI, feedback och verifiering antar en enda
  organisation och måste ta emot/härleda `organisationId`.
- Ett **engångs-migreringsskript** krävs för att sätta `organisationId` på all befintlig data.

Detta måste vara klart innan feature-gating är meningsfull – annars är "vilken organisation
äger den här budgeten / rutinen / det här beroendetestet" odefinierat.

### Föreslagen datamodell

```
organisationer/{orgId}
  namn: "Akutmottagning X"
  status: "active"
  plan: "core"
  moduler: { operations: true, intelligence: false }
  ai: { manadsbudgetSek: 2000, perAnvandareSek: 50 }

organisationer/{orgId}/medlemmar/{uid}
  roll: "sektionsledare"
  omraden: ["kliniskt-stod"]
  aktiv: true
```

Kör man tills vidare en enda installation kan man börja med **ett** organisationsdokument. Men
**före kund nummer två** måste alla collections antingen bära `organisationId` eller ligga under
`organisationer/{orgId}/…`, så kunddata aldrig kan blandas. Att skjuta upp detta till efter
andra kunden är inte ett alternativ – då är risken för dataläckage mellan kunder reell.

---

## Feature-registry, `useFeatures()` och tre säkerhetslager

(Oförändrat från ursprungsförslaget – väl avvägt och matchar hur appen redan är byggd.)

Central definition i kod, inte spridda strängar:

```js
// src/config/features.js
export const FEATURE = {
  OFFLINE_CENTER: "offlineCenter",
  OWNER_REMINDERS: "ownerReminders",
  HEALTH_HISTORY: "healthHistory",
  EXPORT_BACKUP: "exportBackup",
  KIOSK_MODE: "kioskMode",
  AI_IMPORT: "aiImport",
  AI_ANALYTICS: "aiAnalytics",
  CLINICAL_SUPPORT: "clinicalSupport",
};

export const PACKAGE_FEATURES = {
  core: [],
  operations: [FEATURE.OFFLINE_CENTER, FEATURE.OWNER_REMINDERS, FEATURE.HEALTH_HISTORY, FEATURE.EXPORT_BACKUP, FEATURE.KIOSK_MODE],
  intelligence: [FEATURE.AI_IMPORT, FEATURE.AI_ANALYTICS, FEATURE.CLINICAL_SUPPORT],
};
```

`useFeatures()` läser organisationens modulkonfiguration och ger `hasFeature(...)`. Används i
navigation, routes, adminsektioner, knappar och tomlägen. En kund utan en modul ska mötas av en
neutral förklaring ("AI-import kräver Intelligence"), inte en tyst dold knapp.

**Tre lager** (feature flags i UI är UX, inte säkerhet – samma princip appen redan följer för
roller):

| Lager | Ansvar |
|---|---|
| UI | Visa/dölj navigation, knappar, vyer |
| Klient | Kontrollera modul före hook/anrop, undvik onödig datahämtning |
| Server | Kontrollera organisation + medlemskap + roll + aktiv modul i Cloud Functions och Firestore-regler |

AI-importen och klinikstöd ska kontrollera modul **igen** i Cloud Function innan något
Gemini-/sökanrop görs, så en kund utan Intelligence inte kan dra på sig AI-kostnader via ett
manipulerat direktanrop.

---

## Prissättning

(Oförändrat – rätt modell för ett avdelningsgemensamt verktyg.)

| Intäkt | Modell |
|---|---|
| Core | Fast årsavgift per avdelning |
| Operations | Fast årsavgift per avdelning |
| Intelligence | Fast årsavgift inkl. AI-pott |
| Hög AI-användning | Extra förbrukningspott / tydligt kvotpaket |
| Uppstart | Engångsavgift för konfiguration, migration/import, redaktörsutbildning |
| Större organisation | Volympris per tillkommande enhet |

Per avdelning/enhet och år – inte per användare. Undvik "obegränsad AI" till fast pris; den
inbyggda globala och per-användarbudgeten gör att modellen kan byggas på verkliga
kostnadsgränser.

---

## Reviderad genomförandeordning

Skillnaden mot ursprungsförslaget: organisationsmodellen är ett stort **eget block först**, och
"bygg Operations klart" är utbrutet eftersom halva paketet återstår.

1. **Lås paketen** – Core, Operations, Intelligence. Inget fjärde paket första året.
2. **Organisationsmodellen (stort block, gör först):**
   a. Inför `organisationer/{orgId}` + `medlemmar`-subcollection, börja med egen enhet.
   b. Sätt `organisationId` på alla befintliga collections (migreringsskript).
   c. Skriv om `firestore.rules` att vara organisationsmedveten.
   d. Gör AI-budgeten per-organisation.
   e. Uppdatera alla Cloud Functions att härleda/kräva `organisationId`.
3. **Feature-registry + `useFeatures()`** – allt påslaget för egen organisation initialt.
4. **Gata en modul i taget**, börja med AI-import (tydlig kostnad, tydligt värde).
5. **Bygg Operations klart** – det återstående: schemalagd backup, offline-center + synkstatus,
   sparad hälsokontroll-historik, 2FA-policy, ev. kioskläge.
6. **Serverskydd i varje Cloud Function** innan externa API:er eller känsliga dataflöden.
7. **Pilot** – Core + Operations till pilotkund, mät användning, validera betalningsvilja.
8. **Sälj Intelligence selektivt** – AI-dokumentimport (klart) först; klinikstöd så snart den
   skarpa valideringen är gjord.

---

## Statusöversikt

| Block | Status | Kommentar |
|---|---|---|
| Core | ✅ Byggt | Redo som pilotpaket |
| Operations – ansvar/påminnelser/uppgifter | ✅ Byggt | 5.9–5.10 |
| Operations – hälsokontroll (live) | ✅ Byggt | Historik ej sparad |
| Operations – backup, offline, kiosk, 2FA-policy | ⬜ Kvar | Offline tyngst |
| Intelligence – AI-import | ✅ Byggt | Säljbart nu |
| Intelligence – klinikstöd | ✅ Byggt | Skarp validering kvar |
| Organisationsmodell / multi-tenant | ⬜ Kvar | **Störst, gör först** |
| Feature-registry + tre lager | ⬜ Kvar | Enkelt när org-modellen finns |

Kort sagt: Core bevisar nyttan (redo nu), Operations bevisar driftsäkerheten (halvbyggt),
Intelligence finansierar AI-kostnaden (kärnan byggd). Den avgörande investeringen innan detta
blir en flerkundsprodukt är organisationsmodellen.
