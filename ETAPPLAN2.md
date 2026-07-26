# Synappsen – etappplan del 2 (Etapp 6–11)

*Fortsättning på ETAPPLAN.md, som tog appen från enkundsapp (v5.10.0) till en tekniskt
flerkundskapabel produkt (v5.15.1). Den planen är i allt väsentligt genomförd. Denna plan
tar produkten från "kan tekniskt hålla flera kunder isär" till "kan faktiskt säljas till,
onboardas och behållas av flera kunder".*

Samma format som ETAPPLAN.md: **mål**, **delmål**, **klart-kriterium** (mätbart), **beroenden**,
relativ storlek (S/M/L/XL). Inga kalenderdatum.

---

## Lägesbedömning: var vi står efter Etapp 1–5

**Det som är genuint starkt.** Multi-tenant-isoleringen är inte bara byggd utan bevisad –
50 rules-tester, 24 functions-tester, 6 storage-tester, alla mot riktiga emulatorer, som
faktiskt fångat tre skarpa buggar under resans gång. Det är ovanligt bra för ett projekt i
den här storleken, och det är rätt saker som är testade: exakt det lager där en bugg är
dyrast. Feature-gating har rätt arkitektur (tre lager, fail-closed). Kostnadsuppföljning,
backup, hälsohistorik och 2FA-policy finns på riktigt, inte bara i säljmaterialet.

**Det som är det verkliga problemet.** ETAPPLAN.md kallade Etapp 1 "investeringen som gör
Synappsen till en produkt". Den investeringen är gjord – men den är ännu inte inlösbar.
Det finns i dag **ingen väg till kund nummer två**:

- `src/context/AuthContext.jsx` sätter `organisationId: STANDARD_ORG` på varje nytt konto.
- `firestore.rules` (rad ~163) *kräver* `organisationId == 'default'` vid create – och
  kommentaren där erkänner det öppet: *"ingen egen signup-flow för att välja/skapa
  organisation finns ännu"*.
- Adminpanelen kan slå på/av moduler för den *egna* organisationen, men inte skapa en ny.

Att onboarda en andra kund kräver alltså i dag att någon manuellt redigerar Firestore. Hela
isoleringslagret är byggt, testat och deployat – men det finns bara en organisation att
isolera. Det är den enskilt viktigaste luckan och den styr hela denna plans ordning.

**Övriga fynd (i allvarlighetsordning):**

1. **Öppen registrering.** `/registrera` är helt öppen. Vem som helst som hittar URL:en får
   ett konto i `default`-organisationen med rollen personal – vilket ger läsåtkomst till
   organisationens vårdrutiner, kontaktuppgifter och anslag. För en app som innehåller
   verksamhetsdokumentation i vården är det inte acceptabelt i skarp drift, och det är en
   fråga varje upphandlare kommer att ställa.
2. **Gatingen är ofullständig på ett sätt som kostar pengar.** Endast `tolkaForradsbild`
   och `tolkaDokument` anropar `kravModul()`. `fragaKlinisktStod` – som är en
   Intelligence-funktion enligt `features.js` och som kostar både Gemini-anrop och
   sökmotor-API-anrop per fråga – har **ingen modulkontroll alls**. En kund som betalar för
   Core kan i dag använda den obegränsat på leverantörens bekostnad. Operations-funktionerna
   är gatade i UI men inte på server.
3. **Ingen leverantörsnivå.** "Superadmin" är per organisation. Du som leverantör kan inte
   se, jämföra eller administrera dina kunder utan att gå in i Firebase-konsolen. Med två
   kunder är det irriterande; med tio är det ohållbart.
4. **Frontend är i praktiken otestad.** Ett (1) enhetstest i `src/` (`piiFilter.test.js`).
   Noll komponent- eller hook-tester. All automatiserad verifiering ligger på regel- och
   funktionsnivå. Det har fungerat hittills eftersom säkerhet var risken – men UI-logiken
   växer nu snabbare än testerna.
5. **`Admin.jsx` är 1054 rader** och är samtidigt den fil där nästan all ny funktionalitet
   landat de senaste fem etapperna. Den externa kodgranskningen hade rätt i sak; det som
   var lågprioriterat då blir underhållsskuld nu.
6. **Node.js 20 avvecklas 2026-10-30.** Deploy-loggen varnar vid varje körning. Efter det
   datumet går Cloud Functions inte att deploya alls. Detta är en hård, daterad deadline –
   den enda i hela planen.
7. **`deploy.yml` har `continue-on-error: true` på deploysteget**, vilket gör att ett
   misslyckat `firebase deploy` rapporteras som lyckat jobb. Vi har snubblat på detta
   upprepade gånger under Etapp 1–5 och tvingats läsa rå loggtext varje gång. Det är en
   enkel fix som borde ha gjorts för länge sedan.

---

## Etapp 6 – Kund nummer två  ·  Storlek: L  ·  **Hård grind**  ·  ✅ GENOMFÖRD

**Status:** samtliga fyra delmål (6a–6d) genomförda och verifierade, se UTVECKLINGSLOGG.md
Fas 25. Ny `plattformsadmin`-collection (leverantörsadmin), `skapaOrganisation`/
`listaOrganisationer`/`pausaOrganisation`/`exporteraOrganisation` (Cloud Functions), och ett
helt inbjudningsbaserat registreringsflöde som ersätter den tidigare öppna
självbetjänings-registreringen. Avetablering enforcas i firestore.rules via
`organisationenArAktiv()`, inflätad i det centrala `matcharMinOrg()`.

**Mål:** en ny kundorganisation kan etableras och bemannas utan att någon rör Firestore
manuellt. Detta är denna plans motsvarighet till Etapp 1 – allt annat är mindre värt före den.

**Delmål (i ordning):**
- **6a. Leverantörsadmin (ny roll ovanför superadmin).** En `plattformsadmin`-nivå som kan
  lista alla organisationer, skapa nya, sätta moduler och se kostnad/användning per kund.
  Egen vy, egna regler, egen testsvit. Måste vara strikt separerad från vanlig superadmin –
  en kunds superadmin ska aldrig kunna se en annan kunds existens.
- **6b. Organisationsetablering.** Cloud Function `skapaOrganisation({ namn, moduler })` som
  i en transaktion skapar organisationsdokumentet, standardinställningar (budget,
  utloggningstid), tomma sektioner och den första superadmin-inbjudan.
- **6c. Inbjudningsflöde istället för öppen registrering.** Superadmin bjuder in en
  e-postadress → engångstoken → mottagaren sätter lösenord och hamnar i **rätt** organisation
  med **rätt** roll. `/registrera` stängs för självbetjäning (eller begränsas till en
  domänlista per organisation). Både `AuthContext` och `firestore.rules` måste sluta
  hårdkoda `'default'`.
- **6d. Avetablering.** Möjlighet att pausa och exportera en organisation (uppsägning,
  GDPR-radering). Att kunna ta bort en kund snyggt är ett säljargument, inte bara hygien.

**Klart när:** en ny kund kan skapas från leverantörsvyn, dess första superadmin kan bjuda in
fem kollegor, och ett automatiskt test bevisar att ingen av dem kan se `default`-organisationens
data – samtidigt som ett test bevisar att den gamla `default`-organisationen är opåverkad.

**Beroenden:** Etapp 1 (klar). Inga andra.

**Risk:** hög. Rör autentisering, roller och regler samtidigt – exakt den kombination som gav
buggar i Etapp 1 och 3. Egen gren, utökad regeltestning, säkerhetsgenomgång innan skarp drift.

---

## Etapp 7 – Stäng gatings- och åtkomstluckorna  ·  Storlek: M  ·  ✅ GENOMFÖRD

**Status:** samtliga fyra delmål (7a–7d) genomförda och verifierade, se UTVECKLINGSLOGG.md
Fas 24. `fragaKlinisktStod` är nu gated på server (och i UI), en gating-matris-testsvit
förhindrar att en framtida ny betalfunktion glöms bort, `OWNER_REMINDERS` gated i UI, och ett
separat hastighetstak skyddar den delade sökmotorkvoten oavsett kronbudget.

**Mål:** varje funktion som kostar pengar eller ingår i ett betalpaket är faktiskt skyddad,
på server, inte bara i gränssnittet.

**Delmål:**
- **7a. Gata `fragaKlinisktStod`** med `kravModul(orgId, "intelligence", …)` före både
  Gemini- och sökmotoranropet. Test som bevisar att ett manipulerat direktanrop utan
  Intelligence blockeras innan en enda extern förfrågan går ut (samma mönster som Etapp 2:s
  AI-import-test).
- **7b. Servergating av Operations-funktionerna** – backup, hälsohistorik, ägarpåminnelser.
  Offline-centret är läs-only och gatas rimligen bara i UI; det ska då stå uttryckligen i
  koden varför, istället för att se ut som en glömska.
- **7c. Fullständig gating-matris i test.** En tabell (modul × funktion × förväntat utfall)
  som körs som testsvit, så att en framtida ny funktion inte kan glömmas bort tyst.
- **7d. Kvotskydd.** Tak per organisation *och* per användare på klinikstöd, inte bara
  kronbudget – skyddar mot en enskild användare som råkar loopa.

**Klart när:** gating-matrisen är grön för samtliga åtta `FEATURE`-nycklar, och ingen
betalfunktion kan utlösas av en organisation som saknar modulen.

**Beroenden:** inga hårda. Kan köras parallellt med Etapp 6 – men bör vara klar *innan*
kund nummer två faktiskt får inloggning.

---

## Etapp 8 – Driftskulder & plattformshälsa  ·  Storlek: S–M  ·  ✅ GENOMFÖRD

**Status:** samtliga fem delmål (8a–8e) klara, se UTVECKLINGSLOGG.md Fas 24, 26, 27, 28.

**Mål:** ta bort de skulder som redan aktivt kostar tid vid varje leverans, samt den enda
daterade deadline i planen.

**Delmål:**
- **8a. Node 20 → Node 22 i Cloud Functions.** Hård deadline 2026-10-30. Uppgradera även
  `firebase-functions` (deploy varnar om föråldrad version). Kör hela functions-testsviten
  mot den nya runtimen. **Detta bör göras först i etappen** – ju närmare deadline, desto
  sämre förhandlingsläge om något går sönder.
- **8b. Ta bort `continue-on-error: true`** från deploysteget i `deploy.yml`, så att ett
  misslyckat deploy faktiskt rödmarkerar jobbet. Behåll det eventuellt på det efterföljande
  `setpolicy`-steget om det är genuint frivilligt.
- **8c. ✅ GENOMFÖRD.** Dela upp `Admin.jsx` (1054 rader) i sektionskomponenter – en per adminpanel-sektion,
  med den delade datahämtningen kvar i hookar. Ingen funktionsändring, ren struktur.
- **8d. ✅ GENOMFÖRD. Grundläggande frontend-testning.** Vitest + Testing Library på de hookar där logiken
  faktiskt bor (`useFeatures`, `useOfflineCenter`, `useMfaPolicy`, budget-/kostnadshookarna)
  och på `ErrorBoundary`. Målet är inte hög täckningsgrad utan att den logik som är svår att
  se med ögat är fastspikad.
- **8e. ✅ GENOMFÖRD.** Ersätt `confirm()`/`alert()` med appens egen dialog. Kosmetiskt, men det är det
  första en kund reagerar på i en demo.

**Klart när:** Cloud Functions kör på Node 22 i produktion, ett medvetet trasigt deploy
rödmarkerar CI, och `npm test` innehåller minst ett meningsfullt test per central hook.

**Beroenden:** inga. Kan börja när som helst. 8a är tidskritisk.

---

## Etapp 9 – Upphandlingsbarhet  ·  Storlek: L

**Mål:** ta bort de formella hindren som gör att en region eller kommun *inte får* köpa
Synappsen, oavsett hur bra produkten är. Detta är den etapp som har störst effekt på
säljbarhet per nedlagd timme – inte för att den är rolig, utan för att den ändrar svaret
på frågor som annars är blockerande.

**Delmål:**
- **9a. SSO / Microsoft Entra ID-inloggning.** I praktiken ett krav i offentlig vård. Ingen
  IT-avdelning vill administrera ännu ett separat lösenordskonto per anställd. Firebase Auth
  stödjer SAML/OIDC – arbetet ligger i org-koppling (vilken IdP hör till vilken organisation)
  och i att det ska samexistera med e-post/lösenord för mindre kunder.
- **9b. Tillgänglighet (WCAG 2.1 AA).** Lagen om tillgänglighet till digital offentlig
  service ställer formella krav och kräver en publicerad tillgänglighetsredogörelse.
  Konkret: tangentbordsnavigering, fokusmarkeringar, kontrastgranskning, alt-texter,
  skärmläsartest av de fem viktigaste flödena. Detta är dessutom rätt sak att göra oavsett
  upphandling.
- **9c. GDPR-underlag.** Personuppgiftsbiträdesavtal (mall), registerförteckning över
  behandlingar, dokumenterad lagringstid och raderingsrutin, samt var data fysiskt lagras
  (Firebase `europe-west1` – dokumentera det, det är ett säljargument).
- **9d. Exporterbar granskningslogg.** Auditloggen finns redan; gör den exporterbar och
  filtrerbar. Internrevision och IT-säkerhet frågar alltid efter detta.
- **9e. Driftdokumentation.** Backuprutin (finns – dokumentera den), återställningstest,
  incidentrutin, SLA-utkast. Att kunna *visa* en återställning som fungerar är starkare än
  att lova en.

**Klart när:** en kund kan logga in med sitt Entra-konto, en tillgänglighetsredogörelse är
publicerad, och det finns ett PUB-avtal och en registerförteckning att bifoga i ett anbud.

**Beroenden:** Etapp 6 (SSO måste kunna kopplas per organisation).

---

## Etapp 10 – Det som gör att kunden säger ja  ·  Storlek: M  ·  🔶 DELVIS GENOMFÖRD

**Status:** 10b–10e genomförda, se UTVECKLINGSLOGG.md Fas 29–32. 10a (demoläge/sandlåda)
återstår – inte efterfrågad i den här omgången.

**Mål:** minska tröskeln från "intressant" till "vi kör", och ge chefsledet en anledning att
betala – inte bara personalen en anledning att använda.

**Delmål:**
- **10a. Demoläge / sandlåda.** En förifylld demo-organisation med realistiska rutiner,
  förrådsartiklar och anslag, som återställs automatiskt. Att kunna visa en fungerande app
  på trettio sekunder istället för att prata om den är den billigaste säljinvesteringen som
  finns. Bygger direkt på Etapp 6:s organisationsetablering.
- **10b. ✅ GENOMFÖRD. Uppstartsimport i bulk.** Den vanligaste invändningen mot ett rutinsystem är "vi
  har 400 dokument, vi orkar inte flytta över dem". AI-dokumentimporten finns redan – bygg
  ett bulkläge ovanpå: ladda upp en mapp, granska förslagen i en kö, godkänn i klump. Detta
  är sannolikt den enskilt starkaste säljfunktionen i hela planen.
- **10c. ✅ GENOMFÖRD. Ledningsrapport.** En månadsrapport per avdelning: kvitteringsgrad, rutiner som
  passerat granskningsdatum, mest sökta frågor, andel nollträffar. Exporterbar till PDF.
  Personalen använder appen för att den är snabb; chefen betalar för att kunna visa att
  rutinerna faktiskt är lästa.
- **10d. ✅ GENOMFÖRD. Rutinmallar per verksamhetstyp.** Ett startbibliotek (t.ex. slutenvårdsavdelning,
  vårdcentral, kommunal hemtjänst) så att en ny kund inte möts av en tom app.
- **10e. ✅ GENOMFÖRD. "Tid-att-hitta"-mätning.** Medvetet bortvald i Etapp 4. Ta upp den nu om piloten
  efterfrågar den – det är den siffra som mest direkt översätts till kronor i en kalkyl
  ("30 sekunder × 40 sökningar/dag × 25 anställda").

**Klart när:** en demo kan startas på under en minut, en ny kund kan importera hundra
befintliga dokument på en förmiddag, och en chef kan ladda ner en månadsrapport.

**Beroenden:** Etapp 6 (10a, 10d), Etapp 7 (10b använder Intelligence-gatade funktioner).

---

## Etapp 11 – Intelligence 2.0  ·  Storlek: M–L  ·  Villkorad

**Mål:** bygga vidare på AI-funktionerna – **men bara efter** att minst en kund faktiskt
betalat för dagens Intelligence-modul.

Detta är avsiktligt sist och avsiktligt villkorat. Det är den mest lockande etappen att börja
med och nästan alltid fel att prioritera före Etapp 6–9: en AI-funktion som ingen kund kan
köpa, logga in på eller bli fakturerad för är en kostnad, inte en tillgång.

**Kandidater (välj utifrån faktisk pilotdata, inte magkänsla):**
- Semantisk sökning över rutiner (utöver dagens Fuse.js-ordmatchning).
- Automatisk sammanfattning vid rutinuppdatering – "vad ändrades sedan du kvitterade sist".
- Förslag på granskningsbehov: rutiner vars innehåll avviker från nationella källor.
- Röstsökning för handsfree-läge i vårdmiljö.

**Klart när:** en av kandidaterna är byggd, gatad, kostnadsuppföljd och används av en
betalande kund.

**Beroenden:** Etapp 5:s affärsmål (betalande Intelligence-kund) samt Etapp 7 (gating).

---

## Etapp 12 – Härdning efter den externa säkerhetsgenomlysningen  ·  Storlek: M

**Bakgrund:** en extern rapport ("Synappsen – teknisk och säkerhetsmässig genomlysning")
granskades 2026-07-26. Den visade sig i praktiken vara en sammanställning av vår egen
dokumentation (UTVECKLINGSLOGG.md, SAKERHETSRAPPORT.md) snarare än en oberoende
genomlysning – bland annat hittade den noll nya fynd och innehöll ett sakfel (hänvisning
till en "Etapp 12" som inte fanns när rapporten skrevs). Den lyfte ändå några reella,
giltiga punkter, och pekade på ett par saker som varken rapporten eller vår egen
dokumentation tidigare täckt. Denna etapp samlar åtgärderna, uppdelade så att var och en
kan tas för sig.

Två av rapportens rekommendationer täcks INTE här utan har egna spår sedan tidigare:
WCAG-A-bristerna (Linear SYN-6, se även Fas 34) och PUB-avtal/DPIA (Linear SYN-7, del av
Etapp 9c). De dubbleras inte i denna etapp.

**Delmål (oberoende av varandra, kan göras i valfri ordning – 12a föreslås först):**

- **12a. CI kör bara `npm run test` (vitest).** De tester som faktiskt bevisar
  organisationsisoleringen – rules (61), functions (57) och storage (6) – körs idag bara
  när någon startar dem manuellt mot en lokal emulator. En regression i `firestore.rules`
  eller `functions/index.js` skulle inte stoppa en PR. Åtgärd: lägg till emulator-baserade
  testkörningar i `ci.yml` (`firebase emulators:exec`, samma kommandon som
  `package.json`s `test:rules`/`test:functions`/`test:storage`-scripts redan använder
  lokalt). Klart när: en medvetet trasig regel eller ett medvetet trasigt functions-test
  rödmarkerar CI. **Storlek: S.** Ingen risk – lägger bara till kontroller, ändrar inget
  produktionsbeteende.

- **12b. Beroendesårbarheter är osynliga.** `npm audit` visar 33 sårbarheter i roten
  (1 kritisk, 25 höga) och 11 i `functions/` (1 hög) – ingen av dem är omnämnda någonstans
  i projektets dokumentation eller i den externa rapporten. Åtgärd i två steg: (1) kör
  `npm audit fix` (icke-brytande) i båda katalogerna och kör hela testsvepet efteråt; (2)
  gå igenom det som återstår efter det och avgör per post om det kräver en brytande
  uppgradering, är en dev-only-sårbarhet utan produktionspåverkan, eller kan accepteras
  med en dokumenterad motivering. Klart när: `npm audit`s kritiska/höga-antal är antingen
  0 eller varje kvarvarande post har en skriven motivering i UTVECKLINGSLOGG.md.
  **Storlek: S–M**, beroende på hur många brytande uppgraderingar steg 2 kräver.

- **12c. Ingen App Check.** Firebase App Check (attestering av att anrop kommer från den
  riktiga appen, inte ett skript) är inte aktiverat – `enforceAppCheck` förekommer noll
  gånger i `functions/index.js`. Detta är inte ett akut hål (rules och `kravModul`-gating
  bär redan hela den verkliga bördan, bevisat av testsviterna), men är standardfrågan vid
  en Firebase-säkerhetsgranskning och stänger ett lager helt. Delas i tre steg som kan tas
  var för sig: **12c-i** aktivera App Check i klienten (reCAPTCHA v3-provider) utan att
  ännu kräva det server-side (mätfas, ingen risk för att stänga ute riktiga användare);
  **12c-ii** sätt `enforceAppCheck: true` på Cloud Functions sedan mätningen visar att
  legitim trafik har giltiga tokens; **12c-iii** test som bevisar att ett anrop utan
  App Check-token nekas. **Storlek: M**, mest på grund av mätfasen i 12c-i som bör pågå
  en tid innan 12c-ii slås på skarpt (annars risk att stänga ute riktiga klienter, t.ex.
  äldre cachade PWA-versioner).

- **12d. PII-härdning, del 1: förrådsartikelformuläret.** Den enda konkreta, omedelbart
  åtgärdbara luckan rapporten pekade på: `ForradArtikelFormular`-motsvarigheten saknar
  `kontrolleraPatientuppgifter()`, till skillnad från rutiner, kommentarer, anslag,
  skiftrapport, anteckningar och feedback som alla redan har den. Lågriskfält (namn,
  skåp, hylla, antal) men inkonsekvent mot övrig policy. **Storlek: S.**

- **12e. PII-härdning, del 2: flytta rutinskapande till Cloud Function.** Idag har
  Cloud Functions (AI-text) den fulla Luhn-kontrollerade personnummerkontrollen, medan
  rutiner skrivs direkt från klienten mot Firestore med bara klientsidig kontroll plus
  regelbaserad regex (som inte kan implementera Luhn). En användare med giltig
  Auth-session som skriver direkt mot Firestore-REST-API:et kan teoretiskt kringgå
  klientfiltret. Åtgärd: en `skapaRutin`/`uppdateraRutin`-Cloud Function med samma
  Luhn-kontroll som redan finns för AI-text, och stäng motsvarande direkt-skrivrätt i
  `firestore.rules`. **Detta är det största delmålet** – det är samma mönster som redan
  användes för `skapaKommentar`/`skickaFeedback`, men rutiner har fler fält och
  användningsställen (mallar, versionshistorik, bilagor) så omfattningen är större.
  **Storlek: M–L.**

- **12f. PII-härdning, del 3: skiftrapport.** Samma åtgärd som 12e, men för
  skiftrapportens fritextfält. Mindre omfattning eftersom skiftrapport har färre
  användningsställen än rutiner. **Storlek: M.** Bör göras efter 12e så mönstret från
  den Cloud Function-omskrivningen kan återanvändas.

- **12g. PII-härdning, del 4: regelbaserad spärr för övriga fritextfält.** För fält som
  inte flyttas till en Cloud Function (t.ex. anteckningar) – en enkel regex-spärr i
  `firestore.rules` av samma typ som redan finns i backup-filtret, med känd begränsning
  (falska positiva på tal som ser ut som personnummer men inte är det) dokumenterad i
  SAKERHETSRAPPORT.md. **Detta är ett affärsbeslut, inte bara ett tekniskt val** – fler
  falska positiva stör den dagliga användningen, så vilken strikthet som är rimlig bör
  avgöras av verksamheten, inte gissas fram. **Storlek: S**, men bör inte påbörjas förrän
  ägaren tagit ställning till den avvägningen.

**Rekommenderad ordning:** 12a → 12b → 12d (alla tre är små, snabba, riskfria) → 12c
(kräver en mätperiod, så starta den tidigt även om den avslutas sent) → 12e → 12f → 12g
(störst, kräver mest omtanke, och 12g kräver ett föregående beslut).

**Beroenden:** inga hårda mot andra etapper. 12e/12f bör göras i nämnd ordning eftersom de
delar mönster. 12g bör invänta ett uttryckligt beslut om regelstriktheten.

---

## Föreslagen ordning och motivering

```
Etapp 8a (Node 22)  ─┐  tidskritiskt, kör direkt
Etapp 6 (kund #2)   ─┼─►  Etapp 9 (upphandling)  ─►  Etapp 10 (säljbar nytta)  ─►  Etapp 11
Etapp 7 (gating)    ─┘                                    (villkorad)
Etapp 8b–8e         ─  löpande, mellan de tunga blocken
```

| Etapp | Fokus | Storlek | Kommentar |
|---|---|---|---|
| 6 | Kund nummer två | L | **Hård grind – blockerar all försäljning** |
| 7 | Gating- och åtkomstluckor | M | Kostar pengar varje dag den väntar |
| 8 | Driftskulder | S–M | 8a har hård deadline 2026-10-30 |
| 9 | Upphandlingsbarhet | L | Störst säljeffekt per timme |
| 10 | Säljbar nytta | M | Kräver 6; 10b är starkast enskilda funktion |
| 11 | Intelligence 2.0 | M–L | Villkorad – först efter betalande kund |
| 12 | Härdning efter genomlysningen | M | Sju oberoende delmål, valfri ordning (12a–12d först) |

**Om bara tre saker görs härnäst:** gata `fragaKlinisktStod` (7a, en halvdag, stoppar en
löpande kostnadsläcka), uppgradera till Node 22 (8a, hård deadline), och bygg
organisationsetablering med inbjudningsflöde (6a–6c, den enda vägen till kund nummer två).

**En ärlig invändning mot planen.** Etapp 6 och 9 är stora investeringar i något som ännu
inte har någon efterfrågan bakom sig – det finns i skrivande stund ingen pilot och ingen
betalande kund. Det finns ett alternativ värt att överväga: gör bara 7a och 8a nu, och gör
sedan Etapp 6 *när en konkret andra kund faktiskt finns*, med den kundens verkliga krav som
kravspec istället för gissningar. Risken med det är att onboardingen då blir en flaskhals i
exakt det ögonblick då snabbhet betyder mest. Vilken väg som är rätt beror på hur nära en
faktisk andra kund du är – det är ett affärsbeslut, inte ett tekniskt.
