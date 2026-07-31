# ETAPPLAN 5 – Säkerhet, upptäckt och incidentberedskap

*Skriven 2026-07-31, utgångsläge v5.50.0, efter att Etapp 22–31 avslutats.*

**Detta är den AKTIVA planen.** Den ersätter `ETAPPLAN4.md` som styrande dokument (den senare
är nu historisk men fortfarande korrekt – se `CLAUDE.md`s dokumentkarta).

De två utkasten `ETAPPLAN5-ALT-A.md` (sälj det som byggts) och `ETAPPLAN5-ALT-B.md` (förtjäna
förtroendet) är **inte** förkastade – de utgör menyn för vad som kommer EFTER den här planens
säkerhetsbas. Se avsnittet "Vad som kommer efter" längst ned.

---

## Varför säkerhet blev basen

En genomgång 2026-07-31 av faktisk kod, `firestore.rules`, `storage.rules`, `firebase.json`,
deploy-kedjan och avtalsunderlaget gav en tydlig slutsats:

> **Synappsen är byggd för att FÖRHINDRA obehörig åtkomst, men saknar nästan helt förmågan att
> UPPTÄCKA och ÅTERHÄMTA när något ändå går fel.**

Förhindrandet är genuint starkt och ska inte byggas om: 85 `request.auth`-kontroller över 47
Cloud Functions, organisationsisolering bevisad med 149 regeltester, PII-spärr i tre lager,
tamper-evident revisionslogg, force-logout, 2FA-policy, inbjudningstokens med 192 bitars
entropi, engångsanvändning och giltighetstid. Inget av det behöver röras.

Det som saknas är den andra halvan. Tre konkreta belägg:

1. **`avtal/PUB-AVTAL-MALL.md` p.8 lovar kunden underrättelse inom 72 timmar** efter kännedom
   om en personuppgiftsincident. `avtal/DPIA-UNDERLAG.md` rad 137 medger själv "ingen
   automatiserad detektion av dataintrång i sig" och pekar på Sentry som skyddsåtgärd – men
   `src/sentry.js` fångar bara krascher via `ErrorBoundary`. Ett nekat `onSnapshot`-anrop
   kraschar inte. **Klockan på 72 timmar startar aldrig, för ingenting ger oss kännedom.**
2. **Backupen har aldrig återställts.** Sökning efter varje tänkbar återställningsvariant i
   `functions/index.js` ger noll träffar. `veckovisBackupSchemalagt` skriver JSON till Storage;
   det finns ingen väg tillbaka och ingen har provat.
3. **Etapp 31b visade att appen kan vara trasig i månader utan att någon märker det** –
   standardrollen `personal` såg tomma listor i rutiner, förråd och akutläge. Samma
   grundproblem: dåligt tillstånd utan signal.

För en produkt som säljs till vårdorganisationer är detta dessutom den enskilt mest
granskade ytan i en upphandling. Det här är alltså inte enbart hygien – det är säljbarhet.

---

## Genomgående krav

De tio kraven i `ETAPPLAN3.md`/`ETAPPLAN4.md` gäller oförändrat. Tre tillkommer:

11. **Ingen säkerhetsåtgärd får förlita sig på att en människa tittar regelbundet.** En logg,
    en rapport eller ett mätvärde som kräver att någon minns att öppna den räknas som
    obefintlig. Det ska larma, inte finnas.
12. **Varje åtgärd i den här planen ska kunna beskrivas för en kunds IT-säkerhetsansvarige.**
    Det som inte tål den frågan är fel prioriterat.
13. **Loggning får aldrig innehålla personuppgifter eller dokumentinnehåll.** Metadata (vem,
    vad för sorts händelse, vilken organisation, när) – aldrig vad som faktiskt stod i texten.
    Detta gäller särskilt vid utökad Sentry-rapportering i Etapp 32.

---

# Etapp 32 – Upptäcka: från blind till larmad

**Varför:** Den direkta orsaken till att 72-timmarsåtagandet inte går att uppfylla. Utan
detektion är allt annat i den här planen reaktivt i efterhand.

**Modul:** ingen (Core/drift).

### 32a – Nekade dataanrop ska rapporteras, inte bara loggas i konsolen ✅ KLAR (2026-07-31)

- `permission-denied` från en `onSnapshot`-lyssnare ska skapa en Sentry-händelse med
  collection, roll, organisation och sökväg – **aldrig dokumentinnehåll** (krav 13).
- **Premisskontroll:** de flesta hooks ignorerar i dag error-callbacket helt (bekräftat i
  `useRutiner.js`, `useForradsartiklar.js`, `useKontakter.js` m.fl.). Signaturen behöver
  utökas till `{ data, laddar, fel }` – utöka mönstret, byt inte arkitektur.
- Detta är samma åtgärd som `ETAPPLAN5-ALT-B.md` Etapp 32a; den hör hemma här.
- **Genomfört:** ny `src/firebase/felrapportering.js` med `rapporteraNekadListning({ collection,
  roll, organisationId, sokvag, fel })` – no-opar tyst för alla felkoder utom
  `permission-denied`, skickar Sentry ett `captureMessage` med collection/roll/organisation/
  sökväg som taggar/extra, aldrig `snap.data()` eller annat dokumentinnehåll. Wire:ad in i
  samtliga 40 hooks i `src/hooks/` som har en `onSnapshot`-lyssnare (37+ enskilda
  onSnapshot-anrop), med error-callbacket som andra argument till `onSnapshot`. De flesta hooks
  fick även ett nytt `fel`-fält i sitt returnerade objekt (ingen befintlig anropare bryts av
  det – bara ett nytt, tillagt fält). `useRutin(id)` (enskild dokumentlyssnare utan roll/org i
  scope) fick medvetet ingen rapportering – inget meningsfullt att skicka. Verifierat med
  fullständigt testsvep (lint, vitest, build, rules, functions, storage, e2e) – e2e-svepet
  bekräftar dessutom att `personal`-rollens tidigare fix (Etapp 31b) fortfarande håller.

### 32b – Larm på avvikelsemönster

Ett schemalagt jobb som larmar (in-app till plattformsadmin + Sentry) vid:

- Upprepade `permission-denied` från samma användare/organisation inom kort tid.
- Ovanligt läsmönster (t.ex. en enskild användare som läser exceptionellt många dokument –
  det närmaste vi kommer exfiltreringsdetektion utan att bygga något tungt).
- Misslyckade inloggningsförsök i serie mot samma konto.
- Plötslig kostnadsspik i Gemini-/sökmotorbudgeten (budgetspärren finns – men den *stoppar*
  tyst, den *larmar* inte).

**Gränsdragning:** detta är avvikelselarm, inte ett SIEM. Målet är att någon får veta samma
dygn, inte att bygga en säkerhetsoperationsavdelning.

### 32c – Täpp till hålen i revisionsloggen

Genomgången visade att den tamper-evidenta revisionsloggen saknar flera av de mest
säkerhetskänsliga händelserna:

- **Rollbyte loggas inte alls.** `uppdateraRoll()` i `src/hooks/useAnvandare.js` är en naken
  `updateDoc(doc(db, "users", userId), { role: roll })` – **att göra någon till superadmin
  lämnar inga spår någonstans.** Det är sannolikt den enskilt allvarligaste luckan i planen.
- **Plattformsadmins tvärorganisatoriska åtkomst loggas inte.** `arPlattformsadmin()` i
  `firestore.rules` ger läsrätt till VILKEN kundorganisation som helst. Att leverantören kan
  se kundens data är avsiktligt och nödvändigt – att det sker utan spår är det inte. Detta
  kommer att efterfrågas i varje upphandling: *"vem hos er kan se våra uppgifter, och hur vet
  vi när de gör det?"*
- Konfigurationsändringar: moduler på/av, 2FA-policy, AI-budget.

Alla ska gå genom befintlig `loggaRevision()` – ingen ny mekanism.

### 32d – Loggen ska titta på sig själv

- Hashkedjans integritetskontroll (Etapp 14) körs i dag på begäran. Gör den schemalagd, med
  larm vid brott. En manipuleringsdetekterande logg som ingen kontrollerar detekterar inget
  (krav 11).

**Klart när:** ett nekat anrop, en rollhöjning eller ett avvikande läsmönster i produktion når
oss samma dygn, utan att någon behövt öppna en rapport.

---

# Etapp 33 – Överleva: en backup som går att lita på

**Varför:** Verifierat: det finns ingen återställningsfunktion. Backupen är enkelriktad. En
backup som aldrig testats är en förhoppning, inte ett skydd – och för en kund är
"återställningstid" en avtalsfråga, inte en teknisk detalj.

**Modul:** operations (samma som backupen i dag).

### 33a – Återställningsfunktion

- Motsvarigheten till `backupaOrganisation()`, åt andra hållet: läs en backupfil, skriv
  tillbaka till Firestore för EN organisation.
- **Hård gränsdragning:** enbart plattformsadmin, alltid till en explicit angiven
  organisation, aldrig som ett klientanrop en kund kan trigga själv. En felriktad
  återställning skriver över levande kunddata.
- Skriv alltid en revisionsloggpost (Etapp 32c).

### 33b – Bevisa att den fungerar

- Ett skarpt test mot emulatorn: seeda → backup → radera → återställ → verifiera att allt är
  identiskt. Körs i CI tillsammans med övriga functions-tester.
- Utan detta test är 33a bara mer otestad kod.

### 33c – Gallring av backuper

- I dag skrivs en full JSON-dump av alla kärncollections per organisation **varje vecka, för
  alltid**. Ingen gallringsrutin finns (verifierat). Efter ett år: 52 kompletta kopior av all
  persondata.
- Det bryter mot lagringsminimering (GDPR art. 5.1 e) och krockar direkt med Etapp 6d: om en
  kund säger upp avtalet och datan raderas ligger allt kvar i backuperna på obestämd tid.
- **Beslutspunkt:** hur lång retention? Förslag 90 dagar, men det är en avtalsfråga –
  bestämd retention ska in i `avtal/PUB-AVTAL-MALL.md` och `avtal/DPIA-UNDERLAG.md`.

### 33d – Dokumenterad återställningstid

- Mät hur lång tid 33a faktiskt tar för en normalstor organisation och skriv in det i
  `avtal/IT-FAKTABLAD.md`. "Vi har backup" är inget svar på en IT-avdelnings fråga; "data
  återställs inom X timmar, med högst en veckas dataförlust" är det.

**Klart när:** vi har återställt en organisation på riktigt, vet hur lång tid det tar, och
gamla kopior försvinner av sig själva.

---

# Etapp 34 – Reagera: incidentberedskap

**Varför:** Det juridiska åtagandet finns nedskrivet (PUB-avtalet p.8, DPIA p.9). Det
operativa – vem gör vad, i vilken ordning, kl. 02:00 – finns ingenstans. Ett åtagande utan
rutin är ett åtagande man missar i skarpt läge.

**Modul:** ingen (Core/drift). Detta är i huvudsak dokument, inte kod.

### 34a – Policy och operativ checklista ✅ KLAR (2026-07-31)

**Genomfört:** två dokument, med medvetet olika målgrupp och strikthet.

- **`avtal/INCIDENTRESPONSPLAN.md`** (policy, extern – delas med kund och vid upphandling):
  klassificering P1/P2/P3 med exempel ur den här appen, roller, faser, tidskrav,
  kommunikationsordning (kunden anmäler till IMY, inte leverantören), bevarande av bevis,
  efterhandsgenomgång.
- **`INCIDENT-CHECKLISTA.md`** (internt, delas aldrig externt): steg-för-steg skriven för att
  följas ensam och under press, med exakta sökvägar till varje kontroll i UI:t.

Två saker är värda att lyfta ur dem:

1. **Patientsäkerhetsprincipen** (policyns avsnitt 7) är formaliserad som en styrande regel:
   *en begränsningsåtgärd får aldrig med hög sannolikhet orsaka större skada än den incident
   den avser att begränsa.* Därav: ingen automatisk utestängning av vårdpersonal, bred
   avstängning som sista utväg, men full automatisering tillåten för leverantörens egna konton.
2. **Dokumenten redovisar öppet vad som INTE finns.** Checklistan har en statustabell där
   varje saknad förmåga (larm, `permission-denied`-rapportering, rollbytesloggning,
   återställning) står som ⬜ med hänvisning till vilken etapp som bygger den. Policyns
   avsnitt 11 anger att externt incidentstöd saknas. Det är avsiktligt: en plan som beskriver
   en beredskap som inte finns är sämre än ingen plan.

**Underhållsregeln finns i `CLAUDE.md`** och är händelsestyrd (uppdatera i samma commit som
förmågan ändras), inte minnesstyrd – eftersom minnesstyrning bevisligen misslyckats i det här
projektet förut.

### 34b – Färdiga underrättelsemallar ✅ KLAR (2026-07-31)

**Genomfört:** mall för kundunderrättelse enligt PUB-avtalets p. 8-krav finns i checklistans
steg 7, med de fält GDPR art. 33.3 kräver och en uttrycklig instruktion om vad man aldrig
skriver (gissningar, bagatellisering, skuld på enskild användare).

**Kvarstår:** kontakttabellen i checklistans snabbreferens är tom. Att fylla i den tar tio
minuter och är den enskilt mest värdefulla förberedelsen i hela etappen – men kräver uppgifter
bara ägaren har.


### 34c – Öva en gång, på papper

- En genomgång (tabletop) av ett realistiskt scenario: "en superadmins konto är kapat och har
  läst 400 rutiner i en annan avdelning". Följ runbooken och notera var den tar slut.
- **Detta är det billigaste sättet att upptäcka att en rutin inte fungerar.**

### 34d – Uppdatera DPIA:n mot verkligheten

- `avtal/DPIA-UNDERLAG.md` rad 137 anger i dag Sentry som skydd mot sen upptäckt av incidenter.
  Efter Etapp 32 blir det påståendet sant – men det ska stå vad som faktiskt gäller, inte vad
  vi hoppas. Uppdatera bedömningen när, och bara när, åtgärderna finns på plats.

### 34e – Halvautomatisk, styrd respons

**Varför:** verksamheten drivs av en person, som inte kan förväntas göra korrekt
incidentanalys klockan tre på natten. Slutsatsen efter genomgången är att **autonom respons är
fel modell** (patientsäkerhetsprincipen), men att **autonom *analys*** är både säkert och det
som hjälper mest.

Byggstenarna finns redan: `tvingaUtloggning` (som anropar `revokeRefreshTokens`),
`pausaOrganisation` och `exporteraOrganisation`. Koden gör dessutom redan automatiska
tillståndsändringar med revisionsloggning – en organisation pausas automatiskt när
provperioden går ut. Mönstret är etablerat; det som saknas är kopplingen till en larmsignal.

Målbild:

```
Larm (32b) → automatisk omfattningsanalys + bevissäkring
           → notis till ägaren
           → tre val: [Logga ut användaren] [Pausa organisationen] [Falsklarm]
           → förifyllt underrättelseutkast enligt 34b
```

- **Automatisk omfattningsanalys:** "vilka organisationer rörde det här kontot senaste 24 h,
  vilka datatyper, under vilken period" – rena databasfrågor, fullt automatiserbara, och den
  långsammaste delen av verklig incidenthantering.
- **Automatisk bevissäkring:** frys relevanta revisionsloggposter i en oföränderlig
  incidentpost när larmet går, innan något hinner rulla ur eller ändras.
- **Strypning i stället för blockering:** vid onormal läsvolym, sakta ner – lås inte.
- **Full automatisering endast för leverantörens egna plattformsadminsessioner.**

**Gränsdragning:** systemet föreslår och förbereder. Människan trycker på knappen. Beslutet
"är detta en personuppgiftsincident" är juridiskt och automatiseras aldrig.

**Klart när:** en person som väcks mitt i natten kan följa ett dokument istället för att
improvisera.

---

# Etapp 35 – Härda: de kända, konkreta luckorna

**Varför:** Samlingsetapp för verifierade brister som var för sig är små men tillsammans utgör
den lågt hängande frukten. Flera är minutersarbete.

**Modul:** ingen (Core).

### 35a – Produktionsbygget ska respektera låsfilen

- `.github/workflows/deploy.yml` kör `npm install` (rad 31 och 43). CI kör `npm ci`. **Det som
  deployas är alltså inte garanterat det som testades** – en transitiv uppdatering kan slinka
  in i produktionsbygget utan att ha passerat CI.
- Ändra till `npm ci`. Detta är den enskilt billigaste åtgärden i hela planen.

### 35b – Säkerhetsheaders och CSP

- `firebase.json` saknar **helt** en `headers`-sektion (verifierat). Ingen
  `Content-Security-Policy`, ingen `X-Frame-Options` (klickkapning), ingen
  `X-Content-Type-Options`, ingen `Referrer-Policy`, ingen `Permissions-Policy`.
- CSP är särskilt relevant som andra försvarslager: appen använder
  `dangerouslySetInnerHTML` i `MarkdownInnehall.jsx` (alltid via `DOMPurify` – korrekt, men
  ett enda lager). CSP är skyddet om DOMPurify någon gång kringgås eller felkonfigureras.
- **Kräver omsorg:** en för snäv CSP bryter Firebase, Sentry och reCAPTCHA. Börja i
  rapporterande läge (`Content-Security-Policy-Report-Only`), verifiera, skärp sedan.

### 35c – Begränsa uppladdningar i storage.rules

- `storage.rules` har **inga** begränsningar på filstorlek eller innehållstyp (verifierat –
  noll förekomster av `resource.size`/`contentType`).
- Konsekvenser: vilken inloggad användare som helst kan ladda upp godtyckligt stora filer
  (kostnad/utrymme), och `inkommande/{uid}/` tar emot vilken filtyp som helst. SVG- och
  HTML-uppladdningar är den klassiska vägen till lagrad XSS från en lagringsdomän.
- Lägg till maxstorlek per sökväg och en `contentType`-allowlist (bild/PDF där det är
  meningen).

### 35d – Sårbara beroenden

- **Nyansering först, så siffran inte skrämmer i onödan:** `npm audit` visar 24 sårbarheter
  (23 höga + 1 kritisk), men **23 av dem finns bara i devDependencies** (`firebase-tools`,
  PWA-byggkedjan) och når aldrig en användare. Den kritiska (`tar`) likaså.
- **Exakt en når produktion:** `react-router` (hög, CSRF-relaterad). Den bör åtgärdas.
- Komplettera Etapp 31a:s rapportering med automatiska uppdaterings-PR:er (Dependabot eller
  Renovate) – annars fortsätter rapporten att rapportera samma sak varje vecka utan att någon
  agerar (krav 11).

### 35e – App Check-enforcement (avsluta 12c-ii)

- Redan förberett och dokumenterat i `ETAPPLAN4.md` Etapp 31c. Kräver bara ägarens
  konsolgranskning – se beslutspunkterna nedan.

### 35f – Rutin för nyckelrotation

- Gemini- och sökmotornycklarna sätts i Secret Manager via `deploy.yml`; tjänstekontot ligger
  som GitHub-secret. Det finns ingen dokumenterad rotationsrutin och inget beslut om
  rotationsintervall. Skriv ned det – inklusive vad man gör om en nyckel läcker.

**Klart när:** de verifierade luckorna är stängda och kända sårbarheter åtgärdas löpande i
stället för att bara rapporteras.

---

# Etapp 36 – Hålla det sant över tid

**Varför:** `SAKERHETSRAPPORT.md` är daterad v5.4.1 – **46 releaser gammal**. Den påstår att
klinikstöd-sökningen är pausad (den är i drift sedan länge) och listar klientsidig PII-kontroll
som öppen brist (delvis åtgärdad i Etapp 12e med regelnivåspärr). I ett upphandlingssamtal är
ett inaktuellt säkerhetsdokument sämre än inget: det underskattar den egna produkten och
undergräver förtroendet när kunden hittar felen själv.

Att det hände är dessutom förutsägbart – exakt samma mönster som drabbade `FRAMTIDSPLAN.md`
och `MODULPLAN.md` (se `CLAUDE.md`). Engångsdokument blir inaktuella. Lösningen är en kadens,
inte ännu en engångsinsats.

**Modul:** ingen.

### 36a – Skriv om säkerhetsrapporten mot v5.50.0

- Faktiskt läge, inklusive det som blivit BÄTTRE sedan v5.4.1 (regelnivå-PII, gating-matris,
  revisionslogg, e2e-svit).
- Ta med de kvarvarande, medvetet accepterade begränsningarna – en ärlig lista är ett
  förtroendeargument, inte en svaghet.

### 36b – Återkommande granskning som en fast punkt

- En kort säkerhetsgenomgång vid varje större release (inte varje patch), med en fast
  checklista: nya collections har regeltester, nya uppladdningsvägar har begränsningar, nya
  loggpunkter läcker inte personuppgifter, `npm audit`-rapporten är genomläst.
- In i `CLAUDE.md`s arbetsmönster, så nästa session ser den.

### 36c – Beslutspunkt: extern granskning

- Innan en första större regionkund: bör en extern penetrationstestare granska
  multi-tenant-isoleringen? Vår egen testsvit är stark men skriven av samma part som byggde
  systemet. En oberoende granskning är ofta ett upphandlingskrav ändå.

**Klart när:** säkerhetsdokumentationen speglar verkligheten, och det finns en mekanism som
gör att den fortsätter göra det.

---

## Beslutspunkter som kräver ägaren

1. **Etapp 33c:** hur lång retention på backuper? (Förslag: 90 dagar.) Måste in i avtalen.
2. **Etapp 35e / 12c-ii:** granska App Check-metriken i Firebase-konsolen (Build → App Check →
   Metrics) och avgör om `enforceAppCheck` kan slås på. Fullständigt underlag finns i
   `ETAPPLAN4.md` Etapp 31c.
3. **Etapp 34a:** vem är faktiskt kontaktbar utanför kontorstid? Utan ett namn är runbooken
   fiktion.
4. **Etapp 36c:** extern penetrationstest – ja eller nej, och i så fall när?
5. **Kvarstående sedan tidigare:** ToS-genomgång för källbevakningens sju domäner
   (`SAKERHETSRAPPORT.md`, tillägg 2026-07-28) samt Etapp 30b (fysiskt akutlägestest).

---

## Sammanfattning

| Etapp | Innehåll | Insats | Varför den spelar roll |
|---|---|---|---|
| 32 | Upptäcka: larm i stället för blindhet | M | Utan den kan 72-timmarsåtagandet inte uppfyllas |
| 33 | Överleva: backup som går att lita på | M | Det finns i dag ingen väg tillbaka alls |
| 34 | Reagera: incidentberedskap | S (dokument) | Ett åtagande utan rutin missas i skarpt läge |
| 35 | Härda: kända, konkreta luckor | S–M | Mest lågt hängande frukt per timme |
| 36 | Hålla det sant över tid | S | Annars är vi tillbaka här om 46 releaser |

**Om bara en sak hinns med:** Etapp 35a (`npm install` → `npm ci`). Det tar minuter och tar
bort risken att produktionsbygget skiljer sig från det testade.

**Om bara en etapp hinns med:** Etapp 32. Allt annat i planen förutsätter att vi kan se vad
som händer.

**Föreslagen ordning:** 35a direkt (minuter) → 32 → 33 → 34 → resten av 35 → 36. Etapp 34 kan
skrivas parallellt med 32/33 av någon annan än den som kodar, eftersom den är dokumentarbete.

---

## Sådant den här planen medvetet INTE föreslår

| Idé | Varför inte |
|---|---|
| Egen SIEM-/loggplattform | Sentry plus riktade larm räcker för en produkt i den här storleken. Problemet är inte var signalerna landar, utan att de aldrig skickas. |
| Kryptering av fält i Firestore ("end-to-end") | Skulle slå sönder sök, regler och de flesta serverfunktioner, mot en hotmodell (Google läser kunddata) som PUB-avtalet och underbiträdesförteckningen redan hanterar juridiskt. |
| Bug bounty-program | Förutsätter en mognadsnivå i incidenthantering som den här planen först ska bygga. Ompröva efter Etapp 34. |
| Att bygga om auktorisationen | Den är stark och bevisad med 149 regeltester. Att röra den utan anledning är att införa risk, inte minska den. |
| Automatisk blockering vid avvikelselarm (Etapp 32b) | Ett falsklarm som låser ute personalen mitt i ett akutförlopp är farligare än det larmet skyddar mot. Larma till människa – blockera inte automatiskt. |

---

## Vad som kommer efter

Den här planen är medvetet avgränsad till säkerhet, upptäckt och beredskap. När den är
avklarad står valet mellan de två utkast som redan är skrivna:

- **`ETAPPLAN5-ALT-A.md` – "Från byggd produkt till såld produkt":** SSO/Entra ID (13f),
  veckopuls (Etapp 16), kioskläge, onboarding utan konsult. Kräver 2–3 ägarbeslut innan
  byggstart.
- **`ETAPPLAN5-ALT-B.md` – "Förtjäna förtroendet":** rollmatris som testsvit, tomläge kontra
  felläge, WCAG AA utan förbehåll, akutläget under verkliga förhållanden.

**Överlappning värd att notera:** ALT-B:s Etapp 32a (felmedvetna hooks) är samma arbete som
den här planens Etapp 32a. Görs det här, är ALT-B redan påbörjad. Det talar för ALT-B som
naturlig fortsättning – men ALT-A:s beslut (särskilt SSO-valet) bör fattas parallellt, eftersom
de har legat stilla sedan 2026-07-28 och kommer ligga stilla lika länge till om ingen tar dem.
