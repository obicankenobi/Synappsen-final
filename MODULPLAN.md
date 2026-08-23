# Synappsen – modul- och affärsplan (reviderad)

*Senast uppdaterad 2026-07-28, utifrån faktisk kodstatus i v5.45.3.*

> **Föregående version av detta dokument (uppdaterad t.o.m. v5.10.0) pekade ut
> organisationsmodellen/multi-tenant-lagret och feature-registryt som den enskilt största
> kvarvarande investeringen ("störst, gör först").** Båda är sedan länge helt genomförda
> (`ETAPPLAN.md` Etapp 1 respektive Etapp 2) – ett tydligt exempel på exakt den typen av
> "skriftligt dokument som inte hängt med" som gav upphov till den här omskrivningen. Se
> `CLAUDE.md` för hela dokumentkartan och vilka filer som faktiskt hålls levande löpande
> (`ETAPPLAN2.md`/`3.md`/`4.md`).

Grundstrukturen står fast: en obligatorisk **Core** plus tillval, styrt tekniskt via
organisationsnivå (`organisationer/{orgId}.moduler`), feature flags (`src/config/features.js`)
och servervalidering i tre lager (UI → klient → Cloud Functions/Firestore-regler). Sälj
utfall, inte implementation.

---

## Paketen (med faktisk byggstatus, 2026-07-28)

### Core – obligatorisk kärna
*"Ett gemensamt, kvalitetssäkrat ställe för avdelningens viktigaste information."*

Feature-gatas inte – alltid tillgängligt, oavsett vilka moduler organisationen har.

- ✅ Rutiner, sök (inkl. global kommandopalett, Ctrl/Cmd+K), anslag, förråd, kontakter, länkar
- ✅ Roller, versionshistorik, kvittering (inkl. mikrokviss), godkännandeflöde, rutinägare
- ✅ QR-koder, favoriter, senast besökta, in-app-notiser, "Sedan ditt förra pass"
- ✅ Push-notiser (helt avstängbara per användare, förvalt av)
- ✅ Grundadmin, revisionslogg (manipuleringsdetekterande hashkedja), papperskorg, mörkt läge,
  eget visningsnamn/profilbild/accentfärg
- ✅ 2FA (frivillig eller policy-tvingad per organisation), auto-utloggning, PII-spärr i
  formulär (klient + regel + Cloud Function, tre lager)
- ✅ Checklistläge ("kör rutinen"), kompetensmatris, introduktionsspår för nyanställda
- ✅ Bristanmälan i två klick, källbevakning av externa referenser (larmar vid ändring/
  trasig länk)

Core är ett mycket starkt, komplett pilotpaket – kräver ingen AI-diskussion för att sälja.

### Operations – kontinuitet, ansvar, kontroll
*"Håll rutiner aktuella och tillgängliga när driften är som mest sårbar."*

- ✅ Rutinägare → riktade granskningspåminnelser → "Mina uppgifter"
- ✅ Beroende-/hälsokontroll i admin (grönt/gult/rött)
- ✅ CSV-export av kvitteringsläge, ledningsrapport (PDF via utskrift)
- ✅ Force-logout / återkalla session
- ✅ **Schemalagd Firestore-backup** (veckovis)
- ✅ **Offline-center** – godkända rutiners text cachas för läsning utan nät (bilder/bilagor
  och övrigt innehåll, se `FEATURE.OFFLINE_CENTER` i `src/config/features.js`, är avsiktligt
  begränsat idag – utökning till kontakter/förrådsartiklar/bilder är `ETAPPLAN4.md` Etapp 29)
- ✅ **Sparad historik för hälsokontroller** (persisteras, inte bara senaste resultatet)
- ✅ **2FA-policy** (tvinga för valda roller, per organisation)
- ✅ Bulkimport av dokument (mappuppladdning + granskningskö), rutinmallar per
  verksamhetstyp, "tid-att-hitta"-mätning
- ✅ **Delad-enhet/kioskläge** – byggt i Etapp 55 (2026-08-10), se `ETAPPLAN11.md`. Ett eget
  kontotyp/roll (`kiosk`) för en delad platta: läser godkänt innehåll, söker och kör
  checklistor, men kan aldrig kvittera, kommentera, föreslå ändringar eller bristanmäla –
  eftersom det skulle göra spårbarhetssiffrorna missvisande. PIN hashas på servern.
  `src/components/KioskPinModal.jsx`, `tests/e2e/kioskbevakning.spec.js`.

**Säljkonsekvens:** Operations är helt byggt. Ingen rad återstår.

> **Rättelse 2026-08-23.** Raden ovan stod som ⬜ obyggd fram till detta datum, drygt fyra
> månader efter att kioskläget faktiskt byggdes. Det gjorde `MODULPLAN.md` till underlag för
> en köparanalys som drog slutsatser om modulgränserna ur en felaktig bild. Detta dokument är
> daterat 2026-07-28 och har inte omgranskats sedan dess – **kontrollera byggstatus mot koden
> innan någon rad här används som beslutsunderlag.** Samma mönster som `CLAUDE.md` redan har
> fyra underhållsregler för.

### Intelligence – kontrollerad AI
*"Minska manuellt innehållsarbete med kontrollerad AI."*

- ✅ AI-tolkning foto/PDF → rutin-/förrådsartikelutkast, alltid mänsklig granskning före
  publicering
- ✅ PII-spärr i Cloud Function före Gemini-anrop
- ✅ AI-budget + kvot per organisation OCH per användare, styrt från admin
- ✅ **Klinikstöd-sökning** – domänbegränsad Google Programmable Search Engine (endast
  godkända källor: internetmedicin.se, 1177.se, Nationella kliniska kunskapsstödet, FASS,
  Läkemedelsverket, Vårdhandboken, Folkhälsomyndigheten), Gemini sammanfattar ENBART de
  faktiska träffarnas utdrag, källänkar redovisas, en efterhandskontroll blockerar allt
  utanför godkänd domän. Manuell verifieringsknapp + daglig automatisk källkontroll i admin.
- ✅ Klinikstöd-feedback, vanligaste frågor och en trendanalys över tid synliga i admin
- ✅ Kostnadsuppföljning per organisation

**Säljkonsekvens:** hela Intelligence-paketet, inklusive klinikstöd, är byggt, livetestat och
i drift – inte längre "under skarp validering" (det var statusen vid en tidigare version av
det här dokumentet).

### Källbevakning – litet, fristående tillägg (nytt sedan förra versionen av detta dokument)
*"Vet automatiskt när en extern källa en rutin hänvisar till har ändrats eller slutat
fungera."*

- ✅ Byggt som en egen, oberoende togglebar modul (`organisationer/{orgId}.moduler.kallbevakning`,
  se `ModulerSektion.jsx`) – inte en del av Operations eller Intelligence.
- ✅ Veckovis schemalagd kontroll av alla externa referenser, respekterar `robots.txt`,
  larmar via in-app-notis till rutinens ägare vid ändring eller trasig länk.

Litet nog att prissättas som ett billigt påslag snarare än ett eget paket – men tekniskt och
i UI:t redan helt separat från de tre huvudpaketen.

---

## Feature-registry, `useFeatures()` och tre säkerhetslager

**Byggt (var tidigare planerat, är nu i drift).** Central definition i
`src/config/features.js`:

```js
export const FEATURE = {
  OFFLINE_CENTER: "offlineCenter",
  OWNER_REMINDERS: "ownerReminders",
  HEALTH_HISTORY: "healthHistory",
  EXPORT_BACKUP: "exportBackup",
  KIOSK_MODE: "kioskMode",
  AI_IMPORT: "aiImport",
  AI_ANALYTICS: "aiAnalytics",
  CLINICAL_SUPPORT: "clinicalSupport",
  SOURCE_MONITORING: "sourceMonitoring",
};

export const PACKAGE_FEATURES = {
  operations: [FEATURE.OFFLINE_CENTER, FEATURE.OWNER_REMINDERS, FEATURE.HEALTH_HISTORY,
               FEATURE.EXPORT_BACKUP, FEATURE.KIOSK_MODE],
  intelligence: [FEATURE.AI_IMPORT, FEATURE.AI_ANALYTICS, FEATURE.CLINICAL_SUPPORT],
  kallbevakning: [FEATURE.SOURCE_MONITORING],
};
```

`useFeatures()` läser organisationens `moduler`-fält och ger `hasFeature(...)`. Används i
navigation, routes, adminsektioner, knappar och tomlägen.

**Tre lager, alla byggda:**

| Lager | Ansvar | Status |
|---|---|---|
| UI | Visa/dölj navigation, knappar, vyer | ✅ |
| Klient | Kontrollera modul före hook/anrop | ✅ |
| Server | Kontrollera organisation + medlemskap + roll + aktiv modul i Cloud Functions och Firestore-regler | ✅ (verifierat med en egen gating-matris-testsvit, se `ETAPPLAN2.md` Etapp 7c) |

AI-importen och klinikstödet kontrollerar modul **igen** i Cloud Function innan något
Gemini-/sökanrop görs – ett manipulerat direktanrop utan Intelligence blockeras (verifierat
med test).

---

## Organisationsmodellen (multi-tenant) – ✅ helt genomförd

Tidigare den enskilt tyngsta och mest riskfyllda delen av planen. Nu i drift sedan
`ETAPPLAN.md` Etapp 1:

- `organisationer/{orgId}` med `moduler`, AI-budget (global OCH per användare), status
  (aktiv/pausad).
- Varje datacollection (rutiner, anslag, kontakter, förråd, kommentarer, m.fl.) bär
  `organisationId`.
- `firestore.rules` är fullt organisationsmedveten – varje hjälpfunktion kontrollerar
  medlemskap i rätt organisation, bevisat med en egen rules-testsvit per collection.
- Migreringsskript (`migreraTillOrganisation`) körde engångsflytten av all tidigare data.
- Leverantörsadmin-roll, självbetjänings-organisationsetablering, inbjudningsflöde (ersatte
  öppen registrering), pausning/avetablering av en organisation – allt byggt (`ETAPPLAN2.md`
  Etapp 6, `ETAPPLAN3.md` Etapp 15).

**Kvarstår inte längre som ett hinder.** Andra kunden kan onboardas idag utan risk för
dataläckage mellan organisationer.

---

## Prissättning

(Oförändrat sedan tidigare version – rätt modell för ett avdelningsgemensamt verktyg.)

| Intäkt | Modell |
|---|---|
| Core | Fast årsavgift per avdelning |
| Operations | Fast årsavgift per avdelning |
| Intelligence | Fast årsavgift inkl. AI-pott |
| Källbevakning | Litet tillägg (inte ett eget paket) |
| Hög AI-användning | Extra förbrukningspott / tydligt kvotpaket |
| Uppstart | Engångsavgift för konfiguration, migration/import, redaktörsutbildning |
| Större organisation | Volympris per tillkommande enhet |

Per avdelning/enhet och år – inte per användare. Undvik "obegränsad AI" till fast pris; den
inbyggda globala och per-användarbudgeten gör att modellen kan byggas på verkliga
kostnadsgränser.

---

## Vad som faktiskt återstår

Se `CLAUDE.md`s dokumentkarta för vilken plan som är aktiv just nu (sedan 2026-08-01:
`ETAPPLAN6.md`) och `FRAMTIDSPLAN.md` för de alternativ som valdes bort. Ur ett rent
modul-/paketperspektiv är det enda kvarvarande:

1. **Kioskläge** (Operations) – lågt prioriterat, ingen efterfrågan ännu.
2. **Upphandlingsbarhet** – SSO/Microsoft Entra ID (`ETAPPLAN3.md` 13f) väntar på ett
   ägarbeslut (SAML eller OIDC). Övriga delar av upphandlingspaketet (WCAG, GDPR-underlag,
   exporterbar granskningslogg) är redan byggda.
3. **Intelligence 2.0** – uttryckligen villkorad (`ETAPPLAN2.md` Etapp 11): bör vänta tills
   minst en kund faktiskt betalar för dagens Intelligence-modul.

Kort sagt: alla tre huvudpaket bevisar redan sin nytta i kod, inte bara i säljmaterial. Den
tidigare "stora tekniska investeringen" (organisationsmodellen) är avklarad – återstående
arbete är nu inkrementellt, inte grundläggande.
