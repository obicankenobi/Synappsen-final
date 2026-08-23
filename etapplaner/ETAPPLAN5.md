# Etapplan 5 – Säkerhet, upptäckt och incidentberedskap

*Skriven 2026-07-31, utgångsläge v5.50.0, efter att Etapp 22–31 avslutats.*

**STATUS (uppdaterad 2026-08-01): den här planen är i det närmaste genomförd, men INTE
stängd – och den är inte längre den plan nytt arbete utgår från.** `etapplaner/ETAPPLAN6.md` (Etapp
37–41) antogs 2026-08-01 som aktiv plan. Kvarvarande punkter här – **Etapp 32b** (tre
larmtyper), **ToS-genomgången** för källbevakningens domäner, **Etapp 30b** (fysiskt
akutlägestest) och **uppföljningen av 35e** (App Check-enforcement) – spåras fortsatt i den
här filen. De är blockerade av ägarbeslut eller extern tid, inte av kapacitet: ta dem så
snart respektive blockering lossnar.

De två utkasten `etapplaner/ETAPPLAN5-ALT-A.md` (sälj det som byggts) och `etapplaner/ETAPPLAN5-ALT-B.md` (förtjäna
förtroendet) antogs **inte** när valet gjordes, men är inte heller förkastade – de är
arkiverade med var sitt omprövningsvillkor i `produkt/FRAMTIDSPLAN.md`. Se avsnittet "Vad som kommer
efter" längst ned.

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

De tio kraven i `etapplaner/ETAPPLAN3.md`/`etapplaner/ETAPPLAN4.md` gäller oförändrat. Tre tillkommer:

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
- Detta är samma åtgärd som `etapplaner/ETAPPLAN5-ALT-B.md` Etapp 32a; den hör hemma här.
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

### 32b – Larm på avvikelsemönster ⚠️ DELVIS KLAR (2026-07-31) – se ärlig statusgenomgång nedan

Ett schemalagt jobb som larmar (in-app till plattformsadmin + Sentry) vid:

- Upprepade `permission-denied` från samma användare/organisation inom kort tid.
- Ovanligt läsmönster (t.ex. en enskild användare som läser exceptionellt många dokument –
  det närmaste vi kommer exfiltreringsdetektion utan att bygga något tungt).
- Misslyckade inloggningsförsök i serie mot samma konto.
- Plötslig kostnadsspik i Gemini-/sökmotorbudgeten (budgetspärren finns – men den *stoppar*
  tyst, den *larmar* inte). ✅ **Genomfört:** `reserveraBudget()` sätter nu en
  `budgetvarningSkickad`-flagga (nollställs vid månadsskifte) och skickar EN
  `Sentry.captureMessage` per månad när förbrukningen passerar 80% av taket – inte vid varje
  anrop därefter. Skickas medvetet ENDAST till Sentry, inte till den delade
  `systemvarningar`-collectionen (den läses av VILKEN superadmin som helst, oavsett
  organisation – att lägga en organisations budgetförbrukning där hade läckt den siffran till
  alla andra kunders admins). 4 nya functions-tester (`tests/functions/etapp32b.test.cjs`).

**Ärlig statusgenomgång på de tre återstående punkterna – varför de INTE är byggda:**
alla tre kräver infrastruktur utanför appens egen kod, som den här sessionen inte har
tillgång till att sätta upp:

- **Upprepade `permission-denied`:** dessa syns bara i Sentry (klientsidan, sedan Etapp 32a) –
  en Cloud Function kan inte fråga Sentrys egen händelsedatabas utan ett separat Sentry
  API-token (inte samma sak som DSN:en som används för att SKICKA händelser). Kräver ett
  ägarbeslut om att skapa och lagra ett sådant token som en GitHub/Firebase-secret.
- **Ovanligt läsmönster:** Firestores per-användare läsvolym exponeras inte till Cloud
  Functions utan att antingen (a) instrumentera varenda läsanrop i klienten själv (stor
  arkitekturändring, hög risk för den här sessionen att göra utan avstämning), eller (b)
  aktivera GCP:s faktureringsexport till BigQuery och fråga den – ett projektval i
  Google Cloud Console, inte en kodändring.
  - **Misslyckade inloggningsförsök i serie:** Firebase Auth exponerar inte detta till Cloud
  Functions som standard – kräver Identity Platform-granskningsloggar exporterade till Cloud
  Logging/BigQuery, återigen en konsolkonfiguration, inte kod.

**Slutsats:** budgetlarmet är den enda av de fyra punkterna som var byggbar med data appen
redan har. De tre andra kräver ett ägarbeslut (och i två fall en betald GCP-tjänst) innan de
kan påbörjas – se beslutspunkterna längst ned i den här planen.

**Gränsdragning:** detta är avvikelselarm, inte ett SIEM. Målet är att någon får veta samma
dygn, inte att bygga en säkerhetsoperationsavdelning.

### 32c – Täpp till hålen i revisionsloggen ✅ KLAR (2026-07-31)

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

**Genomfört:** fyra nya Cloud Functions ersätter naknade klient-skrivningar –
`uppdateraAnvandarRoll`, `uppdateraModuler`, `uppdateraMfaPolicy`, `uppdateraGeminiBudgetTak`
– var och en superadmin-only inom egen organisation, och loggar via `loggaRevision()`.
`firestore.rules` stänger nu de direkta klientvägarna (role-fältet är immutabelt i
superadmin-grenen av `users/{userId}`s update-regel; `moduler`/`sakerhet` är immutabla i
`organisationer/{orgId}`s write-regel; `installningar/geminiBudget` är helt stängd för
klienten) – detta är den enda kvarvarande vägen in, oavsett 2FA-status.
**Premisskontroll (krav 8) på "plattformsadmins åtkomst":** en genomgång av
`firestore.rules` visade att `arPlattformsadmin()` INTE ger läsrätt till kundinnehåll
(rutiner/kontakter/forradsartiklar/anslag – `matcharMinOrg()` saknar den bypassen), bara till
organisationsmetadata. De faktiska skrivande plattformsadmin-anropen
(`pausaOrganisation`, `satAvtalsstatus`, `satProvperiod`, `exporteraOrganisation`,
`skapaOrganisation`) loggades redan sedan tidigare. Den verkliga, tidigare ospårade luckan var
de TVÅ läsande översiktsanropen (`listaOrganisationer`, `manadsrapportOrganisationer`) som
visar metadata för ALLA kundorganisationer i ett svep – dessa loggar nu
`plattform_organisationer_listade`/`plattform_manadsrapport_hamtad` mot en pseudo-organisation
(`"_plattform"`, ingen riktig kund har det namnet) eftersom händelsen spänner över alla
organisationer samtidigt, inte en specifik.
12 nya functions-tester (`tests/functions/etapp32c.test.cjs`) + 5 nya/omskrivna rules-tester
(role/moduler/sakerhet-immutabilitet, även med 2FA uppfylld).

### 32d – Loggen ska titta på sig själv ✅ KLAR (2026-07-31)

- Hashkedjans integritetskontroll (Etapp 14) körs i dag på begäran. Gör den schemalagd, med
  larm vid brott. En manipuleringsdetekterande logg som ingen kontrollerar detekterar inget
  (krav 11).

**Genomfört:** ny schemalagd funktion `verifieraRevisionskedjorSchemalagt` (varje natt 04:00)
kör `verifieraRevisionskedja()` för ALLA organisationer (inte bara en, på begäran som
tidigare). Vid en trasig kedja: en Sentry-händelse (`captureMessage`, nivå "error", bara
organisations-ID + den redan maskinella orsakstexten – aldrig dokumentinnehåll) OCH en post i
`systemvarningar` (samma mönster som `verifieraKlinikstodSchemalagt`, redan synlig i
adminpanelen via `useNotiser`). Inget larmar vid ett normalt resultat. 3 nya functions-tester
(`tests/functions/etapp32d.test.cjs`).

**Klart när:** ett nekat anrop, en rollhöjning eller ett avvikande läsmönster i produktion når
oss samma dygn, utan att någon behövt öppna en rapport.

---

# Etapp 33 – Överleva: en backup som går att lita på

**Varför:** Verifierat: det finns ingen återställningsfunktion. Backupen är enkelriktad. En
backup som aldrig testats är en förhoppning, inte ett skydd – och för en kund är
"återställningstid" en avtalsfråga, inte en teknisk detalj.

**Modul:** operations (samma som backupen i dag).

### 33a – Återställningsfunktion ✅ KLAR (2026-07-31)

- Motsvarigheten till `backupaOrganisation()`, åt andra hållet: läs en backupfil, skriv
  tillbaka till Firestore för EN organisation.
- **Hård gränsdragning:** enbart plattformsadmin, alltid till en explicit angiven
  organisation, aldrig som ett klientanrop en kund kan trigga själv. En felriktad
  återställning skriver över levande kunddata.
- Skriv alltid en revisionsloggpost (Etapp 32c).

**Genomfört:** ny `aterstallOrganisation()`/`aterstallOrganisationCallable` i
`functions/index.js`. Två skyddslager utöver plattformsadmin-kravet: (1) sökvägen måste
ligga under EXAKT den angivna organisationens egen `backups/{orgId}/`-mapp, (2) varje
dokument vars `organisationId` inte matchar den angivna organisationen hoppas över – en
manipulerad eller felskriven backupfil kan alltså aldrig skriva över en annan kunds data,
oavsett vad filen påstår. Bygger också om Firestore `Timestamp`-fält korrekt (JSON.stringify
gör om dem till `{_seconds, _nanoseconds}`-maps – utan ombyggnad hade t.ex. `skapad`-fältet
blivit ett vanligt objekt istället för ett sorterbart tidsstämpelfält efter återställning).
**Medvetet ingen självbetjänings-knapp i UI:t** – anropas via Firebase-konsolens
"Testa funktionen"-verktyg, se `drift/INCIDENT-CHECKLISTA.md` steg 8. En återställning är för
farlig för att ligga bakom ett vanligt klick.

### 33b – Bevisa att den fungerar ✅ KLAR (2026-07-31)

- Ett skarpt test mot emulatorn: seeda → backup → radera → återställ → verifiera att allt är
  identiskt. Körs i CI tillsammans med övriga functions-tester.
- Utan detta test är 33a bara mer otestad kod.

**Genomfört:** `tests/functions/aterstallning.test.cjs` – 5 tester, inklusive de två
säkerhetsspärrarna ovan och att `Timestamp`-fält verkligen är `instanceof Timestamp` efter
återställning, inte bara en map som råkar se likadan ut.

### 33c – Gallring av backuper ✅ KLAR (2026-08-01)

- I dag skrivs en full JSON-dump av alla kärncollections per organisation **varje vecka, för
  alltid**. Ingen gallringsrutin fanns (verifierat, före denna etapp). Efter ett år: 52
  kompletta kopior av all persondata.
- Det bryter mot lagringsminimering (GDPR art. 5.1 e) och krockar direkt med Etapp 6d: om en
  kund säger upp avtalet och datan raderas ligger allt kvar i backuperna på obestämd tid.
- **Ägarbeslut (2026-08-01, se beslutspunkt 1 nedan): retention 90 dagar.** Inskrivet i
  `avtal/PUB-AVTAL-MALL.md` p. 6.

**Genomfört:** ny funktion `gallraGamlaBackuper()` i `functions/index.js` – listar alla filer
under `backups/`-prefixet, tolkar datumet direkt ur filnamnet
(`backups/{orgId}/{ÅÅÅÅ-MM-DD}.json`, samma format `backupaOrganisation()` redan skriver) och
raderar filer äldre än `BACKUP_RETENTION_DAGAR = 90`. Ny schemalagd funktion
`backupGallringSchemalagt` kör varje måndag 03:30 (30 minuter efter veckobackupen). Ny
testfil `tests/functions/backup-gallring.test.cjs` (6 tester: raderar rätt fil, rör inte en
nyare backup, rör inte en backup exakt på gränsen (89 dagar), rör inte en icke-backupfil,
en andra körning raderar inget nytt). Version bumpad 5.55.0 → **5.56.0**.

### 33d – Dokumenterad återställningstid ✅ KLAR (2026-07-31)

- Mät hur lång tid 33a faktiskt tar för en normalstor organisation och skriv in det i
  `avtal/IT-FAKTABLAD.md`. "Vi har backup" är inget svar på en IT-avdelnings fråga; "data
  återställs inom X timmar, med högst en veckas dataförlust" är det.

**Genomfört:** uppmätt mot Firestore-emulatorn (1 500 dokument, under 200 ms ren skrivtid) –
skrivet in i `avtal/IT-FAKTABLAD.md` punkt 6 tillsammans med en ärlig brasklapp om att
emulatorn saknar produktionens nätverkslatens, och en realistisk uppskattning (under en
minut för en normalstor organisation).

**Klart när:** vi har återställt en organisation på riktigt, vet hur lång tid det tar, och
gamla kopior försvinner av sig själva. **Uppnått** – 33c klar, se ovan.

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
- **`drift/INCIDENT-CHECKLISTA.md`** (internt, delas aldrig externt): steg-för-steg skriven för att
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


### 34c – Öva en gång, på papper ✅ KLAR (2026-07-31)

- En genomgång (tabletop) av ett realistiskt scenario: "en superadmins konto är kapat och har
  läst 400 rutiner i en annan avdelning". Följ runbooken och notera var den tar slut.
- **Detta är det billigaste sättet att upptäcka att en rutin inte fungerar.**

**Genomfört:** genomgången kördes mot `drift/INCIDENT-CHECKLISTA.md` steg för steg, med exakt det
scenario som efterfrågas. **Det viktigaste fyndet:** scenariot beskriver en superadmin som
läser innehåll denne redan HAR legitim behörighet till (en annan avdelning inom SAMMA
organisation, inte en annan kund) – det är alltså aldrig ett `permission-denied` och lämnar
**noll spår, varken i Sentry (Etapp 32a) eller i revisionsloggen** (läsningar loggas aldrig,
bara skrivningar/ändringar). Runbooken tar slut redan vid Steg 1: det finns i dag **inget sätt
att självständigt upptäcka den här specifika incidenttypen** – hela kedjan är beroende av att
kunden själv märker och rapporterar det, eller en extern anmälan. Steg 3 (begränsa, via
`tvingaUtloggning`) och steg 4:s befintliga varning ("läsningar loggas inte, anta det bredare
scenariot") höll däremot precis som avsett. Ett sekundärt fynd: eftersom rutininnehåll normalt
inte är personuppgifter (det är kliniska protokoll, inte uppgifter OM en person) hamnar
scenariot sannolikt i steg 5:s NEJ-gren – checklistans beslutsträd behövde inget tillägg för
det, bara bekräftelse på att det redan hanterar fallet.

**Åtgärd:** `drift/INCIDENT-CHECKLISTA.md` steg 1 fick en ny, konkret varningsruta om exakt den här
blinda fläcken (se nedan) – tydligare formulerad än den tidigare generiska Sentry-rutan,
eftersom övningen visade att den generiska formuleringen inte räckte för att en person i
skarpt läge omedelbart skulle förstå att just DEN HÄR typen av missbruk (legitim behörighet,
missbrukad) är osynlig. Detta är exakt den lucka Etapp 32b:s läsvolymlarm (väntar på
ägarbeslut om GCP-faktureringsexport, se beslutspunkt 6) skulle stänga.

### 34d – Uppdatera DPIA:n mot verkligheten ✅ KLAR (2026-07-31)

- `avtal/DPIA-UNDERLAG.md` rad 137 anger i dag Sentry som skydd mot sen upptäckt av incidenter.
  Efter Etapp 32 blir det påståendet sant – men det ska stå vad som faktiskt gäller, inte vad
  vi hoppas. Uppdatera bedömningen när, och bara när, åtgärderna finns på plats.

**Genomfört:** punkt 10:s riskbedömning omskriven mot faktiskt kodläge. Två rader ändrade:
"Manipulerad/raderad logg" sänkt från Medel till Låg (hashkedjan finns OCH kontrolleras
automatiskt varje natt sedan Etapp 32d – var tidigare felaktigt beskriven som "planerad men
inte byggd", trots att Etapp 14 byggde den för länge sedan). "Personuppgiftsincident upptäcks
sent" uppdaterad till att räkna upp VAD som faktiskt fångas nu (32a/32c/32b delvis) OCH den
kvarstående luckan som 34c:s skrivbordsövning bekräftade (missbruk av redan legitim
behörighet syns inte, väntar på ägarbeslut). Ärlighet om båda riktningarna – både det som
blivit bättre och det som fortfarande saknas.

### 34e – Halvautomatisk, styrd respons ⏳ BLOCKERAD (väntar på samma ägarbeslut som 32b)

**Premisskontroll (2026-07-31):** målbildens första steg är "Larm (32b) → automatisk
omfattningsanalys...". Det larmet är, förutom AI-budgetspiken, precis det som väntar på
ägarens beslut om ett Sentry API-token/GCP-faktureringsexport (beslutspunkt 6). Utan ett
verkligt anomalilarm att koppla omfattningsanalysen till skulle 34e bli en funktion som körs
på begäran istället för automatiskt vid ett larm – vilket inte är vad avsnittet beskriver.
**Bedömning:** vänta med byggstart tills 32b:s beslut är taget, så att 34e byggs mot en
verklig larmsignal från början istället för att behöva skrivas om.

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

### 35a – Produktionsbygget ska respektera låsfilen ✅ KLAR (2026-08-01)

- `.github/workflows/deploy.yml` kör `npm install` (rad 31 och 43). CI kör `npm ci`. **Det som
  deployas är alltså inte garanterat det som testades** – en transitiv uppdatering kan slinka
  in i produktionsbygget utan att ha passerat CI.
- Ändra till `npm ci`. Detta är den enskilt billigaste åtgärden i hela planen.

**Genomfört:** båda förekomsterna (frontend + `functions/`) ändrade till `npm ci`. Verifierat
med `npm ci --dry-run` i båda katalogerna innan ändringen – båda låsfilerna är redan i synk
med respektive `package.json`, så bytet är riskfritt.

### 35b – Säkerhetsheaders och CSP ✅ KLAR (2026-08-01, CSP i rapporterande läge)

- `firebase.json` saknar **helt** en `headers`-sektion (verifierat). Ingen
  `Content-Security-Policy`, ingen `X-Frame-Options` (klickkapning), ingen
  `X-Content-Type-Options`, ingen `Referrer-Policy`, ingen `Permissions-Policy`.
- CSP är särskilt relevant som andra försvarslager: appen använder
  `dangerouslySetInnerHTML` i `MarkdownInnehall.jsx` (alltid via `DOMPurify` – korrekt, men
  ett enda lager). CSP är skyddet om DOMPurify någon gång kringgås eller felkonfigureras.
- **Kräver omsorg:** en för snäv CSP bryter Firebase, Sentry och reCAPTCHA. Börja i
  rapporterande läge (`Content-Security-Policy-Report-Only`), verifiera, skärp sedan.

**Genomfört:** `firebase.json`s hosting-sektion har nu en `headers`-sektion. Direkt
verkställda (ingen risk, ingen kompatibilitetsavvägning): `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY` (appen ska aldrig ligga i en iframe), `Referrer-Policy:
strict-origin-when-cross-origin`, `Permissions-Policy` som explicit tillåter kamera (krävs
av Etapp 27:s QR-skanning) men blockerar mikrofon/geolocation/betalning/usb (används inte).
CSP satt som `Content-Security-Policy-Report-Only` (inte verkställande än, per planens egen
rekommendation) – byggd genom att faktiskt läsa av vilka domäner appen anropar (Firebase/
Google-API:er, Sentry-ingest, reCAPTCHA för App Check) istället för att gissa.
**Kvarstår innan skärpning till verkställande läge:** en verifieringsperiod i produktion (så
inga legitima anrop blockeras), och en översyn av `script-src 'unsafe-inline'` (behövs idag
för temaskriptet i `index.html` och `OrganisationsBranding.jsx`s dynamiska `<style>`-tagg –
en hash-baserad lösning vore strängare men är inte gjord här).

### 35c – Begränsa uppladdningar i storage.rules ✅ KLAR (2026-08-01)

- `storage.rules` har **inga** begränsningar på filstorlek eller innehållstyp (verifierat –
  noll förekomster av `resource.size`/`contentType`).
- Konsekvenser: vilken inloggad användare som helst kan ladda upp godtyckligt stora filer
  (kostnad/utrymme), och `inkommande/{uid}/` tar emot vilken filtyp som helst. SVG- och
  HTML-uppladdningar är den klassiska vägen till lagrad XSS från en lagringsdomän.
- Lägg till maxstorlek per sökväg och en `contentType`-allowlist (bild/PDF där det är
  meningen).

**Genomfört:** matchar exakt vad klientens egna `<input accept>` redan begränsar till (läst
av i `RutinFormular.jsx`/`storage.js`, inte gissat) – `rutiner/*` tillåter bild ELLER PDF
(max 20 MB), `forradsartiklar/*`/`inkommande/*` tillåter bara bild (max 10 MB), `avatarer/*`
och organisationslogotypen tillåter bara bild (max 5 MB). 6 nya storage-regeltester
(`tests/rules/storage.test.mjs`), inklusive att en SVG/HTML medvetet nekas.

### 35d – Sårbara beroenden ✅ KLAR (2026-08-01, se ärlig anmärkning om react-router)

- **Nyansering först, så siffran inte skrämmer i onödan:** `npm audit` visar 24 sårbarheter
  (23 höga + 1 kritisk), men **23 av dem finns bara i devDependencies** (`firebase-tools`,
  PWA-byggkedjan) och når aldrig en användare. Den kritiska (`tar`) likaså.
- **Exakt en når produktion:** `react-router` (hög, CSRF-relaterad). Den bör åtgärdas.
- Komplettera Etapp 31a:s rapportering med automatiska uppdaterings-PR:er (Dependabot eller
  Renovate) – annars fortsätter rapporten att rapportera samma sak varje vecka utan att någon
  agerar (krav 11).

**Genomfört:** `.github/dependabot.yml` – veckovisa uppdaterings-PR:er för både frontend,
`functions/` och GitHub Actions, med minor/patch grupperade till en enda PR för mindre brus.
**react-router, ärligt läge:** sårbarheten (GHSA-qwww-vcr4-c8h2) gäller uttryckligen "RSC
Mode" (React Server Components/framework-läget) – den här appen är en ren klient-SPA som
använder `<BrowserRouter>`/`<Routes>`/`<Route>` (verifierat i `App.jsx`), aldrig RSC-läget,
så sårbarheten är sannolikt inte tillämpbar i praktiken. Dessutom finns **ingen patchad
version publicerad ännu** (det åtgärdande intervallet `>=8.3.0` existerar inte – senaste
utgivna är 7.18.2, ingen v8 publicerad). Ingen kodändring är möjlig just nu; Dependabot
kommer föreslå en uppdatering automatiskt den dag en riktig patch släpps.

### 35e – App Check-enforcement (avsluta 12c-ii) ⏳ VÄNTAR – konsolen granskad, ännu inte redo

- Redan förberett och dokumenterat i `etapplaner/ETAPPLAN4.md` Etapp 31c. Kräver bara ägarens
  konsolgranskning – se beslutspunkterna nedan.

**Uppmätt (2026-08-01), Firebase-konsolen → App Check → Metrics:**

| API | Period | Verified | Underlag |
|---|---|---|---|
| Cloud Firestore | Senaste 24h | 100% | 194/194 |
| Cloud Firestore | Senaste 30 dagar | 89% (+3% outdated client) | ~5 000 |
| Storage | Senaste 30 dagar | 0% ("unknown origin") | 10 |
| Authentication (Preview) | Senaste 30 dagar | 65% | 66 |

**Rekommendation: slå INTE på `enforceAppCheck` ännu.** Firestore (den API:n som bär i
princip all riktig trafik) ligger på 89% över 30 dagar – bra, men under den ~98%-marginal
som är rimlig innan man slår på ett switch som avvisar allt annat. Storage-siffran (0/10)
är för litet underlag för att agera på direkt, men värd att utreda: appens
Storage-*läsningar* går nästan alltid via `getDownloadURL()`-länkar som hämtas direkt av
webbläsaren – den vägen går aldrig via Storage-SDK:t och syns aldrig i App Check alls. De 10
requests som väl syns är sannolikt riktiga uppladdningar (foton/loggor/avatarer), och INGEN
av dem verifierades – det bör förstås innan enforcement slås på för Storage, inte ignoreras.
Authentication (preview, 66 requests) har för lite underlag för att spela roll för beslutet
och skyddar inget den här appen faktiskt använder (bara e-post/lösenord, ingen telefon-auth).
**Nästa steg:** låt mätningen fortsätta några veckor till, kontrollera sedan Firestore mot
~98%+ och utred varför Storage-uppladdningar inte verifierar innan Storage enforcement
övervägs.

### 35f – Rutin för nyckelrotation ✅ KLAR (2026-08-01, reaktiv OCH proaktiv rutin – intervall beslutat)

- Gemini- och sökmotornycklarna sätts i Secret Manager via `deploy.yml`; tjänstekontot ligger
  som GitHub-secret. Det finns ingen dokumenterad rotationsrutin och inget beslut om
  rotationsintervall. Skriv ned det – inklusive vad man gör om en nyckel läcker.

**Genomfört:** ny sektion "Nyckelrotation" i `drift/INCIDENT-CHECKLISTA.md` – en tabell över vilka
hemligheter som finns och var de lever, plus en steg-för-steg-rutin för att rotera var och
en (inklusive den känsligaste, `FIREBASE_SERVICE_ACCOUNT`, och en särskild anmärkning om att
`FIREBASE_VAPID_KEY`-rotation tillfälligt stör befintliga push-prenumerationer).
**Ägarbeslut (2026-08-01, se beslutspunkt 7 nedan): proaktiv rotation en gång per år**,
utöver den reaktiva rutinen. Rutinen är fortsatt manuell (ingen kod kör själva rotationen),
men en årlig automatisk påminnelse (Claude Code Remote-Routine, `trig_01Mmw6BMfv6NePa9mLuNjE7Z`,
nästa körning 2027-08-01) skickar nu en påminnelse till operatören så att det faktiskt sker
i stället för att glömmas bort.

**Klart när:** de verifierade luckorna är stängda och kända sårbarheter åtgärdas löpande i
stället för att bara rapporteras. **Uppnått, förutom 35e** (väntar på ägarens
konsolgranskning, se beslutspunkt 2).

---

# Etapp 36 – Hålla det sant över tid

**Varför:** `granskningar/SAKERHETSRAPPORT.md` är daterad v5.4.1 – **46 releaser gammal**. Den påstår att
klinikstöd-sökningen är pausad (den är i drift sedan länge) och listar klientsidig PII-kontroll
som öppen brist (delvis åtgärdad i Etapp 12e med regelnivåspärr). I ett upphandlingssamtal är
ett inaktuellt säkerhetsdokument sämre än inget: det underskattar den egna produkten och
undergräver förtroendet när kunden hittar felen själv.

Att det hände är dessutom förutsägbart – exakt samma mönster som drabbade `produkt/FRAMTIDSPLAN.md`
och `produkt/MODULPLAN.md` (se `CLAUDE.md`). Engångsdokument blir inaktuella. Lösningen är en kadens,
inte ännu en engångsinsats.

**Modul:** ingen.

### 36a – Skriv om säkerhetsrapporten mot v5.50.0 ✅ KLAR (2026-08-01, mot v5.55.0)

- Faktiskt läge, inklusive det som blivit BÄTTRE sedan v5.4.1 (regelnivå-PII, gating-matris,
  revisionslogg, e2e-svit).
- Ta med de kvarvarande, medvetet accepterade begränsningarna – en ärlig lista är ett
  förtroendeargument, inte en svaghet.

**Genomfört:** rättade två faktafel som stod kvar sedan 2026-07-14 (klinikstöd-sökningen
felaktigt beskriven som pausad – den är i drift sedan länge; PII-filtret felaktigt beskrivet
som enbart klientsidigt – regelnivåspärren från Etapp 12e fanns redan). Lade till en helt ny
"Del 3" som sammanfattar hela Etapp 32–35-säkerhetsarbetet (upptäcka/överleva/reagera/härda)
med en ärlig sammanfattande bedömning av vad som kvarstår.

### 36b – Återkommande granskning som en fast punkt ✅ KLAR (2026-08-01)

- En kort säkerhetsgenomgång vid varje större release (inte varje patch), med en fast
  checklista: nya collections har regeltester, nya uppladdningsvägar har begränsningar, nya
  loggpunkter läcker inte personuppgifter, `npm audit`-rapporten är genomläst.
- In i `CLAUDE.md`s arbetsmönster, så nästa session ser den.

**Genomfört:** ny punkt i `CLAUDE.md`s "Etablerade arbetsmönster" med den fasta checklistan
och en uttrycklig instruktion att skriva resultatet som ett `## Tillägg`-block i
`granskningar/SAKERHETSRAPPORT.md` – samma händelsestyrda mönster (inte minnesstyrt) som redan gäller för
incidentdokumenten, med samma motivering (rapporten låg själv 51 releaser efter verkligheten).

### 36c – Beslutspunkt: extern granskning ✅ BESLUT TAGET (nej, inte just nu – 2026-08-01)

- Innan en första större regionkund: bör en extern penetrationstestare granska
  multi-tenant-isoleringen? Vår egen testsvit är stark men skriven av samma part som byggde
  systemet. En oberoende granskning är ofta ett upphandlingskrav ändå.
- **Ägarbeslut (2026-08-01, se beslutspunkt 4 nedan): nej, inte just nu.** Ompröva när
  produkten har fler kunder eller inför en upphandling som kräver det.

**Klart när:** säkerhetsdokumentationen speglar verkligheten, och det finns en mekanism som
gör att den fortsätter göra det. **Uppnått** – 36c kvarstår som ett rent ägarbeslut, inget
kodarbete väntar på det.

---

## Beslutspunkter som kräver ägaren

1. ✅ **Etapp 33c (beslutat OCH byggt 2026-08-01):** retention på backuper = **90 dagar**.
   Inskrivet i `avtal/PUB-AVTAL-MALL.md` p. 6. Gallringslogiken är byggd och testad
   (`gallraGamlaBackuper()` + `backupGallringSchemalagt`, se Etapp 33c ovan) – helt klar.
2. **Etapp 35e / 12c-ii:** granska App Check-metriken i Firebase-konsolen (Build → App Check →
   Metrics) och avgör om `enforceAppCheck` kan slås på. Fullständigt underlag finns i
   `etapplaner/ETAPPLAN4.md` Etapp 31c.
   **⏳ Uppföljning inbokad (2026-08-01), beslut bekräftat: fortsätt vänta.** Firestore låg på
   89% verifierat över 30 dagar – under den rimliga ~98%-marginalen. **Kolla igen om några
   veckor** när mer data samlats in, och samtidigt: utred varför Storage-uppladdningar visade
   0% verifierat (litet underlag, 10 requests – se mätningen ovan i Etapp 35e). Fråga att
   ställa nästa gång: "har Firestore klättrat mot 98%, och vet vi nu varför Storage inte
   verifierar?"
3. ✅ **Etapp 34a (beslutat 2026-08-01):** jourkontakt utanför kontorstid = Kasper Lindqvist,
   073-6797538. Inskrivet i `drift/INCIDENT-CHECKLISTA.md`s kontakttabell (internt dokument, delas
   aldrig externt).
4. ✅ **Etapp 36c (beslutat 2026-08-01):** extern penetrationstest – **nej, inte just nu.**
   Ompröva när produkten har fler kunder eller inför en upphandling som kräver det.
5. **Kvarstående sedan tidigare:** ToS-genomgång för källbevakningens sju domäner
   (`granskningar/SAKERHETSRAPPORT.md`, tillägg 2026-07-28) samt Etapp 30b (fysiskt akutlägestest).
6. **Etapp 32b (resterande tre larmtyper):** vill ägaren skapa och betala för ett Sentry
   API-token (för att fråga permission-denied-historik) och/eller aktivera GCP:s
   faktureringsexport till BigQuery (för läsvolym och misslyckade inloggningar)? Utan dessa
   beslut kan de tre punkterna inte påbörjas – det är inte en kodfråga.
7. ✅ **Etapp 35f (beslutat OCH bevakat 2026-08-01):** nycklar (Gemini/sökmotor/
   tjänstekonto/VAPID) roteras proaktivt **en gång per år**, utöver den reaktiva rutinen som
   redan finns i `drift/INCIDENT-CHECKLISTA.md`. Själva rotationen är fortsatt manuell, men en
   årlig automatisk påminnelse (Routine, nästa körning 2027-08-01) ser till att den faktiskt
   utförs.

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

Den här planen är medvetet avgränsad till säkerhet, upptäckt och beredskap.

**AVGJORT 2026-08-01:** valet föll på en tredje väg – **`etapplaner/ETAPPLAN6.md` (Etapp 37–41,
"Innehållet som håller")** är nu den aktiva planen för nytt arbete. De två utkasten nedan
antogs alltså INTE, och är arkiverade i `produkt/FRAMTIDSPLAN.md` med var sitt omprövningsvillkor:

- **`etapplaner/ETAPPLAN5-ALT-A.md` – "Från byggd produkt till såld produkt":** SSO/Entra ID (13f),
  veckopuls (Etapp 16), kioskläge, onboarding utan konsult. **Ompröva omedelbart om en
  regionkund blir aktuell** – SSO blockerar den affären oavsett resten.
- **`etapplaner/ETAPPLAN5-ALT-B.md` – "Förtjäna förtroendet":** rollmatris som testsvit, tomläge kontra
  felläge, WCAG AA utan förbehåll, akutläget under verkliga förhållanden.

**Den här filen är inte stängd.** Etapp 32b, ToS-genomgången, Etapp 30b och uppföljningen av
35e spåras fortsatt här – de är blockerade av ägarbeslut eller extern tid, inte av kapacitet.

**Överlappning värd att notera:** ALT-B:s Etapp 32a (felmedvetna hooks) är samma arbete som
den här planens Etapp 32a. Görs det här, är ALT-B redan påbörjad. Det talar för ALT-B som
naturlig fortsättning – men ALT-A:s beslut (särskilt SSO-valet) bör fattas parallellt, eftersom
de har legat stilla sedan 2026-07-28 och kommer ligga stilla lika länge till om ingen tar dem.
