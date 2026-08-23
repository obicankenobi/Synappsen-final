# Bred kodgranskning 2026-08-11 (v5.97.0)

Sessionsrapport: vad som gjordes, vad som hittades, vad som återstår. Säkerhetsfynden i
prioriterad form finns i `granskningar/SAKERHETSRAPPORT.md`s tillägg för samma datum – det här dokumentet
beskriver *arbetet*, inte bara resultatet.

Gren: `claude/synappsen-final-review-slzcxe`. Utkast-PR: #15.

## Uppläggning

Granskningen delades upp på åtta parallella genomgångar med **disjunkta filområden**, så att
ingen kunde skriva över någon annans ändringar. Varje genomgång fick i uppdrag att åtgärda
bara det den var säker på, och att rapportera – inte gissa – när en fix krävde ett
produktbeslut.

| Område | Filer |
|---|---|
| Säkerhetsregler och tenant-isolering | `firestore.rules`, `storage.rules`, `tests/rules/` |
| Cloud Functions | `functions/` (~5 400 rader, 47 callables, 13 schemalagda jobb, 5 triggers) |
| React-frontend | `src/` utom formulärfilerna |
| De stora formulär-/adminfilerna | `RutinFormular.jsx`, `Profil.jsx`, `LaddaUpp.jsx`, `Admin.jsx` |
| Tillgänglighet (WCAG 2.1 AA) | `src/components/`, `src/pages/`, `src/index.css` |
| Offline, service worker, PWA-livscykel | `src/hooks/`, `src/utils/`, `src/firebase/` |
| Test- och byggkedja, CI, beroenden | `tests/`, `.github/`, byggkonfiguration |
| Dokumentens sanningshalt mot faktisk kod | `*.md`, `avtal/` |

Utöver dessa gjordes en egen genomgång av det ingen ägde: `firebase.json`, `index.html`,
hosting-headers och secrets-hygien i workflows.

## Vad som åtgärdades

### Säkerhetsregler

**`organisationer/{orgId}` – fältspärren var en tom sanning vid create och delete.** Regeln
var ett enda `allow write` (= create + update + delete) med spärren villkorad av
`resource != null && request.resource != null`. `resource` är null vid create och
`request.resource` är null vid delete, så `!(false && …)` blev sant i just de två fallen.
Två konkreta följder: en superadmin i en **pausad** organisation kunde radera dokumentet och
därmed häva sin egen avetablering – `organisationenArAktiv()` svarar "aktiv" när dokumentet
saknas, en medveten fail-open – samtidigt som `sakerhet.kravMfaForRoller` försvann och
2FA-kravet upphörde. Och en superadmin vars organisation saknade dokument kunde skapa det med
godtyckliga `moduler`/`sakerhet`, förbi revisionsloggen. Uppdelat i
`allow create, delete: if false` plus en `allow update` med ovillkorlig spärr.

**`anteckningar/{dokId}` – skrivning och läsning kontrollerade olika saker.** `read`/`delete`
använder dokument-id:ts prefix, men `create`/`update` kontrollerade bara fältet `uid`. En
användare kunde skriva `anteckningar/{annansUid}_{rutinId}` med sitt eget `uid`: offret läste
då en planterad anteckning i sin privata anteckningsruta och kunde aldrig skriva sin egen för
den rutinen. Prefixkontroll tillagd även på skrivvägarna, plus fyra regressionstester.

### Cloud Functions

- **`skickaPush` bröt FCM:s 500-tokengräns.** `sendEachForMulticast` kastar för hela anropet
  vid fler tokens, och de schemalagda jobben loopar utan try/catch per varv. En enda
  organisation med fler än 500 registrerade tokens (en per enhet, inte per person) avbröt
  därmed hela dygnets påminnelsejobb för samtliga organisationer, tyst. Skickas nu i omgångar.
- **AI-importens fritext saknade tak.** `reserveraBudget()` drar en fast kostnad per anrop
  medan modellen debiteras per token, så en klient kunde skicka megabytestora strängar och
  bränna en faktisk kostnad i storleksordningar över vad budgettaket registrerade. Gräns satt
  till 50 000 tecken, plus typkontroll som tidigare kunde ge TypeError på ett objekt.
- **Personuppgifter i Cloud Logging.** Mottagares e-postadresser skrevs till loggen på fyra
  ställen. Loggen är varken organisationsskopad eller täckt av appens åtkomstkontroller;
  adresserna ersattes med org-id respektive uid, som räcker för felsökning.

Genomgången bekräftade samtidigt det som var uppdragets huvudfråga: **ingen callable litar på
klientens `organisationsId`** för auktorisering. Samtliga härleder organisationen serverside
eller kräver plattformsadmin innan `data.orgId` alls läses.

### Frontend

- **`AuthContext` kunde ge permanent vit skärm för hela appen.** `await getDoc` saknade
  try/catch, vilket hoppade över `setLoading(false)`. Eftersom providern renderar
  `{!loading && children}` gav ett avvisat löfte – offline utan cachat dokument, nekad regel,
  nätavbrott – en tom sida utan felmeddelande, inte ens en inloggningssida, och omladdning
  hjälpte inte om orsaken kvarstod.
- **Error boundary saknades ovanför rutterna**, så de tolv alltid monterade komponenterna låg
  oskyddade och ett renderingsfel där avmonterade hela trädet.
- **`KlinikfragaSok`** anropade `.map` på ett `kallor`-fält som kan saknas i äldre cachade
  svar, vilket kraschade hela vyn i stället för att visa svaret utan källista.

### Formulär och adminvyer

- **Blob-URL-läcka**: `createObjectURL` anropades i renderingen, alltså en ny aldrig
  frisläppt URL per tangenttryck – hela bilden hölls kvar i minnet varje gång.
- **Tysta sparningsfel**: `onSpara` låg i `try/finally` utan `catch`. En redaktör vars
  sparning nekades såg bara att formuläret blev kvar. Samma mönster i granskningskön i
  `LaddaUpp` och i `Admin`s modul- och 2FA-växlar – den sista särskilt allvarlig, eftersom
  2FA-policyn kunde se sparad ut medan anropet fallit.
- **Klientvalidering saknades** för bilagor och profilbild trots att reglerna nekar över 20
  respektive 5 MB; `LaddaUpp` varnade dessutom vid 8 MB medan regeln nekar vid 10, så en 12
  MB-bild laddades upp i sin helhet innan den föll.
- **Ofullständiga kvissfrågor föll bort tyst**, och en fråga med ett tomt alternativ kunde
  sparas med det alternativet klickbart.

### Offline och PWA

- **Appen upptäckte aldrig att den var gammal.** `registerSW` kontrollerar bara vid
  sidladdning, och en PWA i standalone-/kioskläge på en avdelningsdator laddar aldrig om av
  sig själv. `onNeedRefresh` fyrades därför aldrig och uppdateringsbannern kunde aldrig visas
  – någon kunde läsa en månadsgammal build av en medicinsk rutindatabas utan att något
  larmade. Kontrollerar nu periodiskt samt vid `visibilitychange` och `online`.
- **Head-of-line blocking i offlinekön.** `catch { break; }` behandlade alla fel som
  tillfälliga, så en post som nekades permanent låg kvar för evigt och blockerade alla
  efterföljande poster vid varje synkförsök.

### Tillgänglighet

WCAG 2.1 AA är ett lagkrav och `granskningar/TILLGANGLIGHETSREDOGORELSE.md` är publicerad, så felaktiga
påståenden där är en juridisk risk snarare än en kvalitetsfråga. Tre av fynden motsäger
dokumentet direkt:

- **Kommandopaletten** – appens primära sökväg (Ctrl/Cmd+K) – hade `role="dialog"
  aria-modal="true"` men varken fokusfälla, Esc eller fokusåterlämning, och knapparna under
  "Senast besökta" och "Populärast" saknade Esc *och* piltangenter helt. Redogörelsen anger
  paletten som testad.
- **`VersionsHistorik`** var två nakna `<div>` utan `role`, utan Esc, utan fokushantering,
  stängbar enbart med musklick.
- **Fokusindikatorn** på input/select ersatte `outline` med en halo i `--primar-ljus`:
  1,06:1 mot vitt fält, där kravet är 3:1. Redogörelsen säger att samtliga kombinationer
  klarar kraven.
- Ingen global `prefers-reduced-motion` fanns – bara `Skelett.css` respekterade den, och den
  luckan nämns inte alls i dokumentet.
- Bottennavigeringens nio emojiikoner saknade `aria-hidden`, så varje länk lästes upp som
  "förstoringsglas lutat åt vänster Sök". `MerMeny.jsx` gjorde redan rätt.

### Tester, konfiguration och dokument

- **Tre e2e-tester kunde bli gröna utan att bevisa något**: en sväljd `goto`-catch som körde
  axe mot föregående sida eller `about:blank`, och två rent negativa assertions som passerade
  även om appen aldrig monterade.
- **CSP:n saknade `report-uri`.** `etapplaner/ETAPPLAN5.md` 35b kräver en verifieringsperiod i
  produktion före skärpning till verkställande läge, men överträdelser landade bara i varje
  användares egen konsol och samlades aldrig in – verifieringen var alltså omöjlig att
  genomföra. Rapportering aktiverad.
- **Versionsrader och sex döda kodsökvägar** i avtalsunderlagen rättade mot faktiska filer
  (`functions/index.js` delades upp i Etapp 61).
- En emulatortempfil som råkade committas togs bort ur indexet och gitignorerades.

## Ett fel i granskningen, korrigerat

Dokumentgenomgången rapporterade att default-grenen `claude/compassionate-euler-rho0q5` stod
kvar på v5.80.0 och skrev om instruktionerna i `CLAUDE.md` och `CLAUDE_STATUS.md` utifrån det.
Verifiering mot `origin` visade att grenen står på v5.97.0 och är aktuell. Sakpåståendet togs
bort i en egen commit. Den generella regeln – kontrollera med `git branch --show-current` i
stället för att anta ett grennamn – står kvar, eftersom den är riktig oavsett.

Det är värt att notera i sig: en granskning som producerar självsäkra påståenden behöver
stickprovskontrolleras mot verkligheten precis som koden den granskar.

## Verifiering – och vad som inte gick att verifiera

`npm run lint` rent, `npm run build` lyckas, `npx vitest run` 175/175.

**Regeltesterna gick inte att köra i sandboxen.** Firebase CLI:s portkontroll kräver att
`::1` går att binda och miljön saknar IPv6, så emulatorn vägrar starta även med en temporär
`127.0.0.1`-konfiguration. Regeländringarna och de fyra nya testerna är därför manuellt
granskade men **inte emulatorverifierade**. E2e-ändringarna är syntaxkontrollerade men inte
körda.

**Kör `npm run test:rules` och `npm run test:e2e` innan detta går vidare till produktion.**
Det är den enskilt viktigaste kvarvarande åtgärden, eftersom två av granskningens ändringar
ligger i just säkerhetsreglerna.

## Beroenden

7 sårbarheter i `npm audit`, men `npm audit --omit=dev` och en separat körning i `functions/`
ger båda **noll**. Samtliga är dev-only och når varken klientbundlen eller
Cloud Functions-runtimen. Den kritiska (`tar` via `firebase-tools@13`) kräver en planerad
major-uppgradering till v15 – inte `npm audit fix --force` – eftersom hela emulatorkedjan
hänger på CLI:t. `npm audit fix` utan `--force` löser 5 av 7 säkert.

## Vad som inte hanns

- `RutinFormular.jsx` och `Profil.jsx` lästes rad för rad först i en andra omgång; de
  ~30 komponenterna under `src/components/admin/` granskades aldrig i detalj.
- Fyra modaler (`KvissModal`, `ForeslaAndringModal`, `SkannaModal`, `KioskPinModal`) har kvar
  samma fokus- och Esc-problem som de två som åtgärdades.
- `granskningar/TILLGANGLIGHETSREDOGORELSE.md` är inte rättad mot fynden ovan.
- Ingen systematisk list-provability-genomgång (att varje `where`-klausul kan bevisa sin
  läsregel) – den buggklass som redan bitit i Etapp 26, 29c och 41a och som inte syns i
  regelfilen ensam.
- `functions/index.js` lästes bara via grep, inte som helhet. Admin SDK-vägarna kringgår
  reglerna och är därmed den återstående största attackytan.

Öppna punkter med säkerhetsbäring är prioriterade i `granskningar/SAKERHETSRAPPORT.md`s tillägg för samma
datum.
