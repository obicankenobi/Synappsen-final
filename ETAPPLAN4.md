# ETAPPLAN4 – Etapp 22–30 ✅ ANTAGEN (2026-07-28)

*Fortsättning på `ETAPPLAN.md` (Etapp 0–5), `ETAPPLAN2.md` (Etapp 6–12) och `ETAPPLAN3.md`
(Etapp 13–21). Utgångsläge: v5.39.0, Etapp 13–21 byggda utom 13f (SSO) och 16 (veckopuls),
som är pausade i väntan på ägarens beslut.*

> **Antagen som plan (2026-07-28), inklusive tillägget 22e** (lätt personifiering: valfri
> profilbild och eget tema/accentval – se motivering och avgränsning där). Etapperna nedan är
> fortfarande opåbörjade i tur och ordning **utom 22a**, som redan är byggd (se ✅ KLAR-
> markeringen). Detaljerna inom varje etapp kan fortfarande omprövas mot verksamheten under
> byggets gång, särskilt Etapp 24 (push) och 26 (ändringsförslag), som båda ändrar hur
> personalen upplever att bli störd respektive lyssnad på – men själva ordningen och urvalet
> är beslutat.

---

## Vad den här planen försöker göra

Etapp 13–21 byggde det som får en **organisation att köpa** Synappsen: avtalsunderlag,
revisionslogg, onboarding, kompetensmatris, källbevakning. Det arbetet är i allt väsentligt
klart.

Etapp 22–30 vänder blicken helt: **vad får en undersköterska, sjuksköterska eller läkare att
faktiskt vilja öppna appen mitt i ett pass?** Ett verktyg som ledningen älskar men personalen
undviker är på sikt värdelöst – kvitteringsgraden faller, innehållet blir inaktuellt och
kompetensmatrisen visar rött överallt. Allt nedan är valt utifrån en enda fråga:

> *Syns det för alla, och gör det vardagen märkbart bättre inom fem sekunder?*

Därför är tyngdpunkten på **små saker som syns direkt** (Etapp 22), **hastighet i vardagen**
(Etapp 23), **att appen når personalen istället för tvärtom** (Etapp 24) och **att
medarbetaren får en röst i innehållet** (Etapp 26).

---

## Ordningsprincip

1. **Etapp 22–23 först** för att de ger störst upplevd förbättring per nedlagd timme, syns för
   varenda användare, och inte kräver några nya beslut från ägaren. De kan levereras som en
   enda release som märkbart lyfter helhetsintrycket.
2. **Etapp 24–26** är de tre stora "wow"-dragen, men var och en kräver ett ställningstagande
   (integritet, störningsnivå, redaktionellt ansvar) – därför efter de riskfria delarna.
3. **Etapp 27–29** är praktisk vardagsmagi som gör mest nytta när grunden ovan sitter.
4. **Etapp 30 sist** och är medvetet inte "wow" – det är underhållsskulden som annars äter upp
   känslan av att appen är snabb och proffsig.

Etapp 22 kan lyftas fram och göras när som helst – den är helt fristående och har inga
beroenden alls.

---

## Genomgående krav

De åtta genomgående kraven i `ETAPPLAN3.md` gäller oförändrat (PII i tre lager,
organisationsisolering, rules-test vid regeländring, modulgating, releaserutin, fullt
testsvep, tillgänglighet, premisskontroll före byggstart). Två krav tillkommer, eftersom
den här planen till skillnad från de tidigare rör saker personalen ser hela tiden:

9. **Ingen ny funktion får göra appen långsammare att öppna.** Varje etapp som lägger till
   kod i startvägen ska mäta bundle-storleken före/efter (`npm run build`) och motivera
   ökningen. Nya beroenden i huvudpaketet kräver ett uttryckligt skäl – det finns redan en
   686 kB Firebase-chunk att ta hänsyn till (se Etapp 30a).
10. **Varje ny notis- eller påminnelsekanal ska gå att stänga av per användare.** Den snabbaste
    vägen att göra ett vårdverktyg avskytt är att det piper. Ingen ny kanal levereras utan
    en av/på-inställning i profilen och ett förvalt läge som är återhållsamt, inte maximalt.

---

# Etapp 22 – Det som syns direkt ✅ KLAR

**Varför:** Tre konkreta brister hittade vid genomgång av koden, som var och en tar timmar –
inte dagar – och som varenda användare möter i vardagen. Det här är den billigaste
kvalitetshöjningen som finns kvar i produkten.

**Modul:** ingen (Core – ska alltid vara på).

### 22a – Namn istället för e-postadresser ✅ KLAR

- **Premisskontroll (bekräftad i kod):** `users.namn` sätts redan när ett konto skapas via
  inbjudan (`losInInbjudan` i `functions/index.js`), men gränssnittet skriver ändå ut
  e-postadressen på en rad ställen: startsidans "Inloggad som …" (`Hem.jsx`), och som
  `skapadAvNamn`/kvitteringsnamn i `RutinKort.jsx`, `Sektionssida.jsx`, `Anslagstavla.jsx`
  och `Skiftrapport.jsx` (alla anropar med `currentUser.email`).
- Resultatet i dag: "anna.svensson@regionx.se har kvitterat" istället för "Anna Svensson", och
  en kvitteringslista som ser ut som en e-postexport. `RutinKort` gör redan rätt för de
  *olästa* (`a.namn || a.email`) – det är bara skrivvägen som är fel.
- **Arbete:** hämta namnet via `useAnvandare()`/`useAuth()` och skicka det istället för
  e-posten. Behåll e-post som fallback för konton som saknar namn (skapade före Etapp 6c).
- Låt användaren ändra sitt visningsnamn i `Profil.jsx`.
- **Genomfört:** `AuthContext.jsx` lyssnar nu live (`onSnapshot`) på det egna `users`-
  dokumentet och exponerar `namn`/`namnLaddat`, så en ändring syns direkt utan omladdning.
  `Profil.jsx` fick ett eget litet namnformulär (PII-kontrollerat precis som andra
  fritextfält). Alla ställen som skickade `currentUser.email` som "vem gjorde det här"
  (`Hem.jsx`, `RutinKort.jsx`, `AnslagKort.jsx`, `Sektionssida.jsx`, `Skiftrapport.jsx`,
  `Anslagstavla.jsx`, `Logistik.jsx`, `LaddaUpp.jsx`, `ForradVy.jsx`) använder nu
  `namn || currentUser.email` – e-post kvarstår bara som en äkta e-postvisning i `Profil.jsx`
  och vid lösenordsbyte/2FA (`EmailAuthProvider.credential`, som kräver den faktiska
  e-posten). `firestore.rules` tillåter nu självuppdatering av `namn` (med samma
  personnummerspärr som andra fritextfält) – 4 nya rules-tester (122/122 totalt).

### 22e – Lätt personifiering (tillägg efter diskussion, INTE i ursprungsutkastet)

- **Bakgrund:** frågan väcktes om en fullständig personlig profil (bio, status, foto) vore
  bra för attraktiviteten. Bedömning: en FULL profilfunktion (bios, statusuppdateringar,
  ett "flöde") drar appen mot en social-nätverkskänsla, väcker en extra samtyckes-/GDPR-fråga
  kring personalfoton, och ligger nära samma resonemang som redan gjorde att gamification och
  chatt valdes bort i tabellen nedan.
- **Avgränsning som antogs istället:** bara en valfri profilbild/avatar samt ett personligt
  tema-/accentval i `Profil.jsx`. Ingen bio, ingen status, inget socialt flöde.
  - Profilbild: lagras precis som andra bilagor (`laddaUppRutinBilagor`-mönstret), visas i
    `FavoritKnapp`/kvitteringslistor bredvid namnet (22a). Helt valfri – ingen påminnelse om
    att ladda upp en.
  - Personligt tema/accentval: bygger på det CSS-variabelsystem som redan finns
    (`TemaVaxlare.jsx`, `--primar` m.fl.) – ett fåtal fördefinierade, kontrastvaliderade
    accentfärger att välja mellan, inte ett fritt färgval (samma WCAG AA-gräns som gäller för
    Etapp 28:s kundprofilering).
- **Gränsdragning som gäller permanent, inte bara vid lansering:** inga statusuppdateringar,
  ingen text som andra användare skriver om sig själva, inget flöde av andras profiländringar.
  Om det tillägget efterfrågas senare ska det tas upp som en egen, ny beslutspunkt – inte
  glida in som en utökning av den här punkten.
- **Genomfört:** `useAccent.js` (device-lokal, samma mönster som `useTema.js` – inte synkad
  mellan enheter/konto) med fyra fördefinierade, kontrastvaliderade accentfärger
  (`AccentValjare.jsx`, i `Profil.jsx`). Profilbild: `users/{uid}.profilbildUrl`, uppladdad
  till `avatarer/{uid}/...` i Storage (ny `storage.rules`-regel: bara ägaren skriver, alla i
  samma organisation läser). `firestore.rules` tillåter självuppdatering av
  `profilbildUrl` i samma lista som `namn` (Etapp 22a). Visas i dag i `Profil.jsx`; bredare
  spridning till kvitteringslistor (som bara lagrar namn-strängar idag, inte uid+bild per
  post) är en egen, större ändring och medvetet inte gjord i den här omgången. 3 nya
  rules-tester för `profilbildUrl` + 4 nya storage-rules-tester för `avatarer/{uid}` (125/125
  respektive 10/10 totalt).

### 22b – Tryck för att ringa ✅ KLAR

- **Premisskontroll (bekräftad i kod):** `Kontakter.jsx` skriver i dag ut i klartext
  *"Numren visas som text – tryck och slå manuellt."* Ingen kommentar i koden motiverar det,
  så det ser ut som en genväg snarare än ett medvetet beslut.
- I en akutverksamhet är "hitta numret → memorera → byt app → slå" exakt den friktion som gör
  att folk istället ropar över rummet.
- **Arbete:** `tel:`-länk på numret, med `aria-label` som säger vad som händer. Akutnummer
  (`akutnummer`-flaggan finns sedan Etapp 17c) får en tydligare, större träffyta.
- Samma sak för e-postadresser i kontaktlistan (`mailto:`).
- **Genomfört:** ny delad `src/utils/telefon.js` (`telHref`) används i `Kontakter.jsx` OCH
  `Akutlage.jsx` (den viktigaste platsen, eftersom det är larmnumren). 3 nya vitest-tester.
  **Premisskontroll visade att `mailto:`-delen av planen inte stämde:** kontaktmodellen
  (`useKontakter.js`) har inget e-postfält alls, bara `nummer` – ingenting att göra `mailto:`
  av. Hoppades medvetet över istället för att uppfinna ett fält som inte efterfrågats.

### 22c – Bild på ett checklistesteg ✅ KLAR

- **Premisskontroll (bekräftad i kod):** `steg`-objektet innehåller redan ett `bild`-fält
  (`laggTillSteg` i `RutinFormular.jsx` skapar `{ text, bild, varning, timerSekunder }`), men
  **det finns ingen väg att sätta det** – stegredigeraren har bara text, varning och timer –
  och `Korvy.jsx` renderar det inte. Fältet är alltså dött sedan Etapp 18.
- En bild per steg är den enskilt största förbättringen av checklistläget: "koppla slangen så
  här" är svårt i text och självklart i bild.
- **Arbete:** uppladdning per steg (återanvänd `laddaUppRutinBilagor`-mönstret), rendering i
  körvyn, och samma bild i den vanliga rutinvyn.
- **Inte nu, och varför:** korta videoklipp övervägdes och väljs bort i det här skedet –
  lagrings- och bandbreddskostnaden är en helt annan storleksordning än stillbilder, och det
  kräver en genomtänkt modereringsprocess. Tas upp igen om bildstödet visar sig användas.
- **Genomfört:** `RutinFormular.jsx` har en filväljare + förhandsvisning per steg. Bilden
  laddas dock upp av `Sektionssida.jsx` (inte formuläret) EFTER att rutinens id finns – en ny
  rutin har inget Storage-sökväg-id förrän `skapaRutin` körts, precis som redan gäller för
  rutinens övriga bilagor. `Korvy.jsx` visar bilden ovanför stegtexten. **Avgränsning mot
  planen:** ingen motsvarande visning i den vanliga rutinvyn utanför körvyn – `RutinKort.jsx`
  visar aldrig steglistan direkt (bara en länk till körvyn), så det fanns ingen plats att
  visa den på.

### 22d – Mikropolish ✅ KLAR

- Bekräftelser som syns: "Kopierad!", "Sparat", "Skickat" – i dag försvinner flera åtgärder
  tyst.
- Tomma tillstånd med en väg vidare istället för bara "Inga poster ännu" (t.ex. "Inga
  favoriter ännu – tryck på stjärnan på en rutin för att spara den här").
- Konsekventa laddningsskelett (`Skelett.jsx` finns men används inte överallt).
- **Genomfört (avgränsat, inte en fullständig genomgång av varenda knapp i appen):**
  "✓ Kopierad!"-feedback på kopieringsknappen i `KlinikstodAnvandningSektion.jsx`; förbättrad
  tom-vy-text för favoriter i `Profil.jsx` (pekar konkret på stjärnan, med rätt platser
  nämnda efter att ha kontrollerat var `FavoritKnapp` faktiskt finns – bara rutiner och
  förrådsartiklar, inte anslag); `Skiftrapport.jsx` bytte en ren textrad ("Laddar...") mot
  samma `<Skelett />` som övriga listsidor redan använder. Övriga listsidor
  (`ForradVy`/`Kontakter`/`Lankbibliotek`/`Anslagstavla`/`Sektionssida`) använde redan
  `Skelett` konsekvent vid kontroll.

**Klart när:** en ny användare som öppnar appen möts av sitt eget namn, kan ringa
akutnumret med ett tryck, och ser bilder i checklistan – utan att någon behövt förklara något.

---

# Etapp 23 – Kommandopalett: allt på två tangenttryck ✅ KLAR (utom 23d, se beslutspunkt)

**Varför:** Sökningen är redan produktens starkaste vardagsfunktion (fuzzy-sökning över
rutiner, förråd, kontakter och länkar via Fuse.js), men den bor på startsidan. Genvägen `/`
finns bara i `Hem.jsx`. Att kunna trycka Ctrl/Cmd+K var som helst och komma direkt till rätt
rutin är den typen av detalj som får personal att beskriva ett verktyg som "snabbt".

**Modul:** ingen (Core).

### 23a – Global palett ✅ KLAR

- Överlägg som öppnas med Ctrl/Cmd+K **eller** `/` från vilken sida som helst, och med en
  permanent knapp i `BottomNav.jsx` för mobil (där det inte finns något tangentbord).
- Återanvänd `SokFalt.jsx`s befintliga index och träfflogik – bygg **inte** en parallell
  sökmotor. Sökstatistiken (`loggaSokning`, `loggaTidTillKlick`) ska fortsätta fungera
  oförändrad, annars tappar Etapp 10e sin mätning.
- **Genomfört:** indexbygget/Fuse-instansen bröts ut ur `SokFalt.jsx` till en delad
  `useSokindex.js` – både `SokFalt.jsx` (oförändrat beteende, oförändrad sökstatistik) och den
  nya paletten läser från EN källa. Paletten själv är uppdelad i två filer:
  `KommandopalettLyssnare.jsx` (liten, alltid monterad i `App.jsx`s `SkyddatLayout` – bara
  tangentbordsgenvägen) som `lazy()`-laddar `KommandopalettInnehall.jsx` (Fuse.js +
  sökhookarna) FÖRST när paletten faktiskt öppnas första gången. Motiverat av genomgående
  krav 9: en första version utan den uppdelningen ökade huvudbundlen med ~39 kB; med
  uppdelningen är den tillbaka på samma storlek som innan Etapp 23 (uppmätt med
  `npm run build` före/efter). `Hem.jsx`s tidigare lokala `"/"`-genväg (bara på startsidan)
  togs bort till förmån för den globala.

### 23b – Åtgärder, inte bara träffar ✅ KLAR

- Paletten föreslår även *handlingar*: "Kör checklista: …", "Anmäl brist på …", "Öppna
  akutläget", "Ny skiftrapport", "Min kompetensstatus".
- Det gör paletten till appens verkliga navigering och gör menyerna mindre viktiga.
- **Genomfört:** en fast lista statiska åtgärder (`STATISKA_ATGARDER` i `useSokindex.js`) –
  Akutläget, Ny skiftrapport, Min kompetensstatus, Introduktion, Kontakter – sökbara som en
  egen kategori ("Åtgärd") i SAMMA index som allt annat. Dessutom genereras en egen
  `"Kör checklista: {titel}"`-post per rutin som har `steg` (Etapp 18), som pekar direkt till
  körvyn (`/checklista/{id}`) istället för rutinens vanliga sida.
- **Avgränsning mot planen:** `"Anmäl brist på X"` som en egen, per-artikel sökbar handling
  byggdes INTE – bristanmälan (Etapp 20) sker inline på förrådsartikelns eget kort, inte på en
  egen sida, så en trovärdig djuplänkning dit hade krävt en ny mekanism (öppna kortets
  formulär automatiskt via en query-parameter) som inte stod i proportion till nyttan här.
  Logistik-sidan är redan en sökbar "Åtgärd" och ett klick bort.

### 23c – Vettigt innehåll innan man skrivit något ✅ KLAR

- Tom ruta visar: senast besökta (finns, `useSenastBesokta`), favoriter (finns,
  `useMinaFavoritPoster`), och de mest visade i organisationen (finns, `usePopularaste`).
- All data finns alltså redan – det här är att sätta ihop den, inte att samla in ny.
- **Genomfört:** exakt de tre källorna, ordnade Favoriter → Senast besökta → Populärast,
  återanvända rakt av utan någon ny datainsamling.

### 23d – Röstsökning ⚠ kräver beslut

- Tanken: händerna är upptagna eller handskade, man säger "Foley-kateter" istället för att
  skriva.
- **Integritetsproblem att ta ställning till innan något byggs:** webbläsarens
  `SpeechRecognition` skickar i Chrome ljudet till Googles servrar för igenkänning. I ett
  akutrum kan bakgrundsljud innehålla patientinformation. Det krockar rakt med appens
  bärande princip att patientuppgifter aldrig lämnar verksamheten.
- **Min rekommendation:** bygg det inte i den här formen. Antingen väntar vi på tillräckligt
  bra igenkänning på enheten (`ondevice`-läget är på väg men ojämnt stött), eller så
  hoppar vi över funktionen. Tas upp som beslutspunkt 2 nedan snarare än som ett antagande.
- **Status:** INTE byggt, i enlighet med rekommendationen ovan. Kommandopaletten (23a-c) är
  fullt fungerande utan röstsökning. Kvarstår som en öppen beslutspunkt, inte en teknisk
  uppgift i kö.

**Klart när:** en van användare når vilken rutin som helst på under tre sekunder från vilken
sida som helst, utan att röra musen.

---

# Etapp 24 – Push-notiser: appen når mig ✅ KLAR

**Varför:** Det här är planens största strukturella "wow". I dag finns notiser bara som ett
klockbadge inne i appen (`useNotiser.js`) – vilket förutsätter att personalen redan öppnat
den. En rutinändring som måste läsas före nästa pass når alltså bara den som råkar titta.
Push vänder på relationen: appen påminner, istället för att kräva att man kommer ihåg.

**Modul:** ingen (Core), men helt avstängbar per användare (genomgående krav 10).

**Beslutspunkten löst:** användaren beordrade explicit genomförande av Etapp 24, vilket löser
beslutspunkt 1 nedan (PUB-avtal/störningsnivå) – se instruktionen i konversationen. Inget
ytterligare godkännande begärdes.

### 24a – Infrastruktur ✅ KLAR

- Firebase Cloud Messaging. `messagingSenderId` finns redan i `src/firebase/config.js`, så
  projektet är halvvägs konfigurerat – men ingen kod använder Messaging i dag
  (bekräftat: inga träffar på `getToken`/`messaging` i `src/` eller `functions/`).
- Tokens per enhet på `users/{uid}.pushTokens[]`, med uppstädning av döda tokens.
- Service worker finns redan via `vite-plugin-pwa` (`registerType: 'autoUpdate'`) – push
  behöver haka in i den, inte ersätta den.
- **Genomfört:** `vite-plugin-pwa` bytte strategi från `generateSW` (implicit,
  Workbox-genererad) till **`injectManifest`** (`vite.config.js`), med en egen `src/sw.js` som
  Vite/Rollup faktiskt bearbetar (`precacheAndRoute` från `workbox-precaching`, plus modulär
  `firebase/messaging/sw` med `onBackgroundMessage` och en `notificationclick`-hanterare).
  **Skäl till bytet:** en statisk, oprocessad `public/firebase-messaging-sw.js` hade krävt att
  Firebase-konfigurationen hårdkodades i klartext i en fil ingen bygglogik rör vid –
  `injectManifest` gör att `import.meta.env.VITE_FIREBASE_*` ersätts med riktiga värden precis
  som i resten av appen. Klientsidan (`src/firebase/messaging.js`) hanterar
  behörighetsbegäran, tokenregistrering (`arrayUnion` på `pushTokens`) och avstängning
  (`deleteToken` + `arrayRemove`). `firestore.rules` utökade users-whitelisten med
  `pushTokens`/`pushInstallningar` (opaka tokens/booleaner, ingen PII-spärr behövs).
  **Bundle-krav (genomgående krav 9):** `firebase/messaging` bryter det generella
  `firebase-vendor`-mönstret i `vite.config.js`s `manualChunks` och får en egen
  `firebase-messaging-vendor`-chunk (54,6 kB) som bara laddas när `Profil.jsx` (redan
  routelat) faktiskt öppnas – uppmätt: `firebase-vendor` gick från 686 kB → 658 kB (minskade,
  inte ökade) och huvud-`index`-chunken är oförändrad (359,98 → 360,09 kB).
- **Avgränsning:** `VITE_FIREBASE_VAPID_KEY` (Web Push-certifikatet från Firebase Console →
  Cloud Messaging) finns inte i miljön ännu – tillagd som en förberedd GitHub-secret
  (`secrets.FIREBASE_VAPID_KEY`) i `deploy.yml`, men måste genereras och sättas av ägaren innan
  push faktiskt fungerar i produktion. Utan den svarar `aktiveraPush()` `"ej-konfigurerad"`
  istället för att krascha – funktionen degraderar snyggt, den ligger bara vilande tills
  nyckeln finns.

### 24b – Vad som får pushas, och vad som aldrig får det ✅ KLAR

- **Hård regel: en push innehåller aldrig kliniskt innehåll och aldrig fritext från appen.**
  Bara "Det finns en ny rutin i Kliniskt stöd" – aldrig rutinens text, aldrig en
  bristanmälans kommentar, aldrig ett namn. En notis syns på en låst skärm som vem som helst
  kan titta på i ett väntrum.
- Kandidater att pusha: ny/ändrad rutin inom mitt område, anslag med kvitteringsfrist som
  närmar sig, bristanmälan till förrådsansvarig, källvarning till rutinens ägare.
- Kandidater att *inte* pusha: kommentarer, statistik, allt som kan vänta till nästa gång man
  öppnar appen.
- **Genomfört:** central `skickaPush(anvandarLista, {titel, body, url})` i
  `functions/index.js` (Admin SDK, `sendEachForMulticast`, "data-only"-meddelanden så att
  `src/sw.js`s egen `onBackgroundMessage` är den ENDA som visar notisen, aldrig FCM:s
  standardvisning också). Döda tokens (`messaging/registration-token-not-registered`/
  `messaging/invalid-registration-token`) städas automatiskt bort med `arrayRemove`.
  `hamtaAnvandareMedPushPreferens(organisationId, nyckel, extraFilter)` väljer bara ut
  användare som **aktivt** satt `pushInstallningar.<nyckel> === true` (genomgående krav 10 –
  frånvaro av fältet, vilket är standardläget för alla, ger aldrig push).
  - Ny/ändrad rutin: `hanteraRutinSkapad`/`hanteraRutinAndrad` (samma testbara
    trigger-mönster som redan fanns för revisionsloggen) anropar `skickaPushForNyRutin` vid
    publicering/godkännande.
  - Källvarning: samma `hanteraRutinAndrad`-trigger fångar `kallVarning: false → true` som en
    tredje gren och pushar till rutinens `agare` (person eller roll, se `RutinFormular.jsx`).
  - Bristanmälan: ny `hanteraBristanmalningSkapad` + `onDocumentCreated`-trigger på
    `bristanmalningar/{bristId}`, pushar till `KAN_HANTERA_FORRAD`-rollerna (dupliceras lokalt
    i `functions/index.js` eftersom functions/ är CommonJS och inte delar moduler med
    ES-modulbaserade `src/firebase/roles.js`).
  - Anslagsfrist: ny schemalagd `kontrolleraKvitteringsfrister` (`onSchedule`, dagligen 07:00),
    mirrorar exakt `Admin.jsx`s klientsidiga "vem har inte kvitterat"-logik
    (`anslagMedFrist`), med `pushPaminnelseSkickadTill` som dedup-array per anslag så samma
    person inte pushas varje dag fram till fristen.
- **Avgränsning mot planen (genomgående krav 8 – premisskontroll):** "inom mitt område" för
  ny/ändrad rutin förenklades till hela organisationen. Det finns inget användarfält som
  binder en person till ett specifikt omrade (`kliniskt-stod`/`administration`) – bara
  rollbaserad redigeringsbehörighet (`farRedigeraOmrade`). En riktig områdesfiltrering hade
  krävt en ny datamodell för "vilket område jobbar jag i", vilket inte finns idag.

### 24c – Personliga inställningar ✅ KLAR

- Per notistyp, i `Profil.jsx`. Förvalt läge ska vara **återhållsamt** – hellre för lite än
  för mycket från start.
- Tillståndsdialogen ska aldrig komma direkt vid inloggning (då nekar de flesta reflexmässigt)
  utan efter en handling som gör syftet uppenbart, t.ex. efter en läskvittering.
- **Genomfört:** ny sektion "🔔 Push-notiser" i `Profil.jsx` med en explicit
  "Aktivera på den här enheten"-knapp (behörighetsdialogen triggas ENDAST av detta
  knapptryck, aldrig automatiskt) och fyra individuella kryssrutor (ny/ändrad rutin,
  anslagsfrist, källvarning, bristanmälan – den sista bara synlig för
  förrådsansvarig/superadmin). Ingen ruta är förikryssad; `pushInstallningar` saknas helt för
  en ny användare tills de själva aktiverar en typ.
- **Avgränsning mot planen:** triggerpunkten "efter en läskvittering" (istället för i
  profilen) byggdes INTE i den här omgången – att lägga behörighetsdialogen direkt i
  profilinställningarna är fortfarande "inte vid inloggning" och alltså återhållsamt nog för
  krav 10, men den mer sofistikerade kontextuella triggern är en möjlig framtida förbättring,
  inte en spärr för att släppa funktionen nu.

### 24d – iOS-verkligheten ✅ KLAR

- Webbpush på iOS kräver att användaren lagt till appen på hemskärmen (iOS 16.4+). En stor
  del av vårdpersonalen har iPhone.
- **Konsekvens som måste byggas, inte bara noteras:** en tydlig "lägg till på hemskärmen"-guide,
  och en ärlig text som säger *varför* den behövs. Utan det upplevs funktionen som trasig på
  halva enhetsparken.
- **Genomfört:** `arIos()`/`korSomInstalleradApp()` i `src/firebase/messaging.js` (den senare
  via `display-mode: standalone`/`navigator.standalone`, det enda tillförlitliga tecknet på en
  hemskärms-installerad PWA på iOS) styr en förklarande guidetext i `Profil.jsx`s push-sektion
  som visas just för iPhone/iPad-användare som INTE öppnat appen från hemskärmen, med konkreta
  steg (Dela-ikonen → "Lägg till på hemskärmen").

**Klart när:** en sjuksköterska får veta att en rutin ändrats innan nästa pass börjar, utan
att ha öppnat appen – och kan stänga av det i profilen på tio sekunder om hon inte vill ha det.

---

# Etapp 25 – "Sedan ditt förra pass" ✅ KLAR

**Varför:** Vårdpersonal lever i pass, inte i dagar. "Vad har hänt sedan jag jobbade sist?"
är den fråga alla ställer sig när de kommer in, och i dag måste man leta på fyra ställen
(anslag, rutiner, skiftrapporter, notisklocka).

**Modul:** ingen (Core).

### 25a – Passbaserad, inte tidsbaserad ✅ KLAR

- Utgå från senaste inloggningen (`senasteInloggning` finns redan på `users`) istället för
  ett fast antal dagar – den som varit ledig i tre veckor ska se tre veckor.
- Sammanställningen bygger uteslutande på data som redan finns: `useNotiser`s källor,
  `useAnslag`, `useRutiner`, `useSkiftrapport`.
- **Genomfört:** ny `src/hooks/useSedanForraPasset.js`. Premisskontroll (genomgående krav 8)
  visade att `senasteInloggning` INTE gick att läsa direkt – `AuthContext.jsx`s befintliga
  effekt skriver över det fältet med den PÅGÅENDE sessionens tidpunkt vid varje inloggning,
  innan något annat hinner läsa det gamla värdet. Löst genom att fånga föregående värde i ett
  nytt `foregaendeInloggning`-state i `AuthContext.jsx`, satt EN gång per session precis
  innan överskrivningen sker – det är detta, inte det (redan uppdaterade) fältet i Firestore,
  som `useSedanForraPasset` faktiskt utgår från.
- **Avgränsning:** skiftrapport-delen begränsas av `useSkiftrapport.js`s redan befintliga
  48-timmarsgräns (skiftrapporter är designade som transient driftinfo, inte historik – ingen
  ny fråga byggdes för att kringgå det). Anslag och rutiner har ingen sådan gräns och visar
  alltså verkligen "tre veckor" om personen varit borta så länge.

### 25b – Ett kort på startsidan + en egen sida ✅ KLAR

- Kortet visar antal och de tre viktigaste posterna; sidan visar allt, grupperat.
- Passar in i `STARTVY_BLOCK`-systemet från Etapp 17a, alltså konfigurerbart per roll.
- **Genomfört:** ny nyckel `"sedan-forra-passet"` i `config/startvy.js` (först i
  `STANDARDORDNING`, redigerbar precis som övriga block i
  `StartvyKonfigurationSektion.jsx`s ordningslista). Eftersom det är det enda blocket med
  DYNAMISKT innehåll (antal + tre viktigaste posterna, inte en statisk titel/länk) särskiljer
  `Hem.jsx` den nyckeln och renderar `SedanForraPassetKort.jsx` istället för den generiska
  `SektionsKort`. Kortet döljer sig helt (`return null`) om listan är tom, så en organisation
  utan färsk aktivitet inte får ett tomt kort. Egen sida `/sedan-forra-passet`
  (`SedanForraPasset.jsx`), grupperad med ikon per posttyp (📌 anslag, 🩺 rutin,
  🛠️ skiftrapport).

### 25c – Kvittera direkt ur listan ✅ KLAR

- "Läst och förstått" ska gå att trycka på direkt i sammanställningen, utan att öppna varje
  rutin för sig. Mikrokvissen (Etapp 19b) ska fortfarande gälla när den finns.
- Det här är också det som gör kompetensmatrisen (19c) grön i praktiken – funktionen betalar
  tillbaka till ledningsvärdet, inte bara till trivseln.
- **Genomfört:** varje anslags-/rutinpost bär en `kvittera()`-funktion som återanvänder de
  REDAN BEFINTLIGA `kvitteraLast`/`kvitteraLastAnslag` (`useLaskvittering.js`) rakt av – ingen
  ny kvitteringsmekanism, bara en genväg till samma en. `SedanForraPasset.jsx` visar en
  "Läst och förstått"-knapp per post som har `kanKvittera` (dvs. användaren inte redan finns i
  `lasteAv`), som blir "✓ Kvitterat" direkt vid klick.

**Klart när:** den som kommer tillbaka efter semestern kan komma ikapp på två minuter i stället
för att gissa vad hon missat.

---

# Etapp 26 – Medarbetarens röst: föreslå en ändring

**Varför:** I dag är innehållsflödet enkelriktat – redaktörer skriver, personal läser och
kvitterar. Den som står vid sängen och ser att en rutin är fel har bara kommentarsfältet, som
ingen är skyldig att göra något med. Att kunna föreslå en konkret ändring och sedan se den
införd är den starkaste engagemangsdrivaren som finns i den här typen av verktyg: *"min åsikt
syns i rutinen."*

**Modul:** ingen (Core).

### 26a – Föreslå ändring

- Knapp på rutinkortet: markera ett stycke → "Föreslå ändring" → skriv förslaget → skicka.
- Ny collection `andringsforslag`: `organisationId`, `rutinId`, `markeratStycke`, `forslag`,
  `motivering`, `status` (ny/infört/avvisat), `foreslagenAv`, `tidpunkt`.
- **Fritextfält ⇒ PII-spärr i tre lager** (genomgående krav 1) – klient, regel och, om AI
  används, Cloud Function.

### 26b – Redaktörens vy: en knapp

- Lista över öppna förslag för mitt område, med det markerade stycket och förslaget sida vid
  sida.
- "Inför" ska öppna rutinformuläret med förslaget förifyllt på rätt plats – inte tvinga
  redaktören att klippa och klistra manuellt. Godkännandeflödet (utkast → godkänd) gäller
  precis som vanligt; ingenting publiceras automatiskt.
- Avvisa kräver en kort motivering. Ett förslag som försvinner tyst är värre än inget flöde
  alls.

### 26c – Återkoppling till den som föreslog

- Notis: "Ditt förslag på *Anafylaxi* är infört" respektive "…avvisades: [motivering]".
- Frivillig, avstängningsbar synlighet: "Förslag från Anna Svensson" i rutinens historik. Vill
  man vara anonym ska det gå.

### 26d – Gränsdragning mot MDR

- Samma ställningstagande som Etapp 18 (se `SAKERHETSRAPPORT.md`): ett förslag är **råmaterial
  till en människa**, aldrig något som publiceras utan redaktörens aktiva godkännande. Ingen
  automatik, ingen AI som inför ändringar självt.

**Klart när:** en sjuksköterska kan föreslå en rättelse på trettio sekunder, och redaktören
kan införa den på ett klick – och båda ser att det hände.

---

# Etapp 27 – Skanna och hitta i förrådet

**Varför:** Förrådsdelen är den mest konkreta delen av appen, och den används stående framför
ett skåp med en mobil i handen. QR-kod finns redan för rutiner (`RutinKort.jsx` genererar
dem) – men bara att *visa*, inte att *läsa*.

**Modul:** logistik.

### 27a – Skanna med kameran

- "Skanna"-knapp som öppnar kameran och läser QR/streckkod → direkt till artikeln eller
  rutinen.
- `BarcodeDetector` finns i Chrome/Android men saknas i Safari – **kräver en fallback**
  (t.ex. `zxing`/`jsQR` som lazy-laddad chunk, aldrig i huvudpaketet, se genomgående krav 9).

### 27b – Etiketter att sätta på hyllan

- Generera utskrivbara QR-ark för skåp/hyllor: skanna hyllan → se vad som ska stå där.
- Det gör appen till en fysisk del av förrådet, inte bara ett uppslagsverk om det.

### 27c – Tydligare väg till artikeln

- Visa "Engångsförrådet → Skåp B → Hylla 3" som en tydlig väg, inte som en textrad.
- Koppla ihop med bristanmälan (Etapp 20): skanna → "slut" → klart, två tryck.

**Klart när:** man kan gå fram till ett skåp, skanna, och se exakt vad som ska finnas där –
och anmäla att det inte gör det.

---

# Etapp 28 – Kundens egen profil

**Varför:** Billigaste sättet att få ett verktyg att kännas som "vårt" istället för "ett system
någon köpt in". Syns för alla användare, varje gång.

**Modul:** ingen (Core).

### 28a – Logotyp och accentfärg per organisation

- Nytt på `organisationer/{orgId}`: `logotypUrl`, `accentfarg`. Redigeras i adminpanelen.
- CSS-variabelsystemet finns redan (`--primar`, `--yta`, `--amber-ljus` m.m.) och gör det här
  litet – det är i praktiken att sätta en variabel.

### 28b – Egen välkomsttext

- Kort rubrik/text på startsidan, satt av kundens superadmin.

### 28c – Gränser som inte får överskridas

- **Kunden får inte kunna försämra tillgängligheten.** Vald accentfärg ska kontrastvalideras
  mot både ljust och mörkt tema, och avvisas om den underskrider WCAG AA. Annars raserar Etapp
  28 det Etapp 13g byggde.
- Akutläget behåller sin egen färgsättning oavsett kundens val – det är säkerhetskritiskt att
  det ser likadant ut överallt.

**Klart när:** personalen ser sin egen verksamhets logotyp när de loggar in, utan att någon
kunnat göra appen svårläst på vägen.

---

# Etapp 29 – Offline på riktigt

**Varför:** Offline-centret (Etapp 3a) cachar i dag **bara godkända rutiners text** – uttryckligen
"inga bilagor/bilder", och varken kontakter eller förrådsartiklar (bekräftat i
`useOfflineCenter.js`). Källare, hissar och skyddsrum har dålig täckning, och det är exakt då
man behöver ett telefonnummer eller en artikels placering.

**Modul:** operations (samma som offline-centret i dag).

### 29a – Utöka cachen

- Kontakter och godkända förrådsartiklar med i offline-paketet. Båda är små datamängder –
  detta är inte ett tungt tillägg.
- Bilder på rutiner/steg (Etapp 22c) som ett *separat, valbart* nedladdningssteg, eftersom
  det är den enda delen som faktiskt kostar utrymme.

### 29b – Ärlig status

- Visa per innehållstyp vad som finns offline och hur gammalt det är. `OfflineIndikator.jsx`
  finns – bygg vidare på den istället för något nytt.

### 29c – Kö för åtgärder offline

- Läskvittering och bristanmälan gjorda utan nät läggs i kö och skickas när nätet är tillbaka,
  med tydlig "väntar på att skickas"-status.
- **Gränsdragning:** bara idempotenta, ofarliga åtgärder köas. Ingenting som ändrar
  publicerat innehåll får ske offline.

**Klart när:** en telefon i flygplansläge kan visa en rutin, ett telefonnummer och var en
artikel ligger – och kvittera rutinen så fort täckningen är tillbaka.

---

# Etapp 30 – Snabbhet och tillgänglighet (inte "wow", men avgörande)

**Varför:** Ingen av funktionerna ovan känns bra i en app som tar tid att öppna. Den här
etappen är medvetet tråkig och ligger sist, men utan den urholkas allt det andra.

**Modul:** ingen (Core).

### 30a – Startladdningen

- `firebase-vendor`-chunken är 686 kB (202 kB gzip) och laddas för alla, alltid. Undersök
  modulär import/lazy-laddning av Firestore och Auth-delarna.
- Mät före/efter enligt genomgående krav 9. Sätt ett tak som senare etapper måste hålla sig
  under.

### 30b – Avsluta Etapp 17d

- Det som saknas är inte kod utan **ett fysiskt test**: fungerar akutläget med handskar och i
  starkt ljus? Organisera testet med verksamheten, dokumentera resultatet, stäng etappen.

### 30c – Från WCAG A till AA

- Etapp 13g tog de kvarvarande A-bristerna. AA är det som faktiskt efterfrågas i offentlig
  upphandling (DOS-lagen) och är dessutom rätt sak att göra.
- Kontrast, fokusmarkeringar, konsekvent tangentbordsnavigering i de nya vyerna från Etapp
  22–29.

**Klart när:** appen öppnas märkbart snabbare än i dag, och tillgänglighetsredogörelsen kan
säga AA utan förbehåll.

---

## Sådant jag medvetet INTE föreslår

Ett förslag är också ett urval. Följande övervägdes och valdes bort – de bör inte tas upp igen
utan att någon aktivt argumenterar emot skälen nedan:

| Idé | Varför inte |
|---|---|
| Poäng, märken och topplistor mellan medarbetare | I vården läses det snabbt som övervakning och rangordning av kollegor. Risken att det skadar förtroendet är större än den motiverande effekten. Etapp 19b:s "inte disciplinärt underlag"-hållning gäller även här. |
| Chatt / meddelanden mellan användare | Ett halvbra chattverktyg bredvid de fem som redan finns i en region används inte, och det öppnar en direkt väg för patientuppgifter in i appen. |
| Videoklipp i rutiner | Lagrings- och bandbreddskostnad i en annan storleksordning, plus modereringsbehov. Ompröva när bildstödet (22c) visat sig användas. |
| Personlig AI-assistent i appen | Klinikstöd-sökningen är redan pausad en gång för att den citerade källor utanför den godkända listan (se `SAKERHETSRAPPORT.md`). Bygg inte fler AI-ytor mot personalen förrän den befintliga är stabil. |
| Schema-/bemanningsintegration | Stort, kräver integration mot regionens system, och tillför inget om personalen inte redan älskar grundfunktionerna. |
| Full personlig profil (bio, statusuppdatering, socialt flöde) | Övervägdes och avgränsades till 22e (bild + tema). En bio/status som andra kan läsa drar mot samma social-nätverkskänsla som gamification/chatt ovan, och personalfoton/bios väcker en egen samtyckesfråga som inte finns idag – se avgränsningen i 22e. |

---

## Beslutspunkter som kräver ägaren, inte kod

1. **Etapp 24 (push-notiser):** ska funktionen finnas alls? Den kräver ett tillägg i
   PUB-avtalet (enhetstokens är en personuppgift) och ett ställningstagande till hur mycket
   appen får störa personalen på fritiden.
2. **Etapp 23d (röstsökning):** min rekommendation är att inte bygga det, eftersom
   webbläsarens taligenkänning skickar ljud till tredje part och bakgrundsljud i ett akutrum
   kan innehålla patientinformation. Kräver ett aktivt ja/nej.
3. **Etapp 26 (ändringsförslag):** vem äger modereringen, och vad är rimlig svarstid? Ett
   förslagsflöde utan bemanning blir en besvikelsemaskin. Detta är en verksamhetsfråga, inte
   en teknisk.
4. **Etapp 28 (branding):** hur mycket får kunden ändra? Förslaget ovan är medvetet snålt
   (logotyp + en accentfärg) för att inte äventyra tillgänglighet och igenkänning mellan
   organisationer.
5. **Prioritering mot pausade delmål:** Etapp 13f (SSO) och Etapp 16 (veckopuls) från
   `ETAPPLAN3.md` väntar fortfarande på beslut. SSO blockerar affärer hos större regioner –
   om en sådan kund är nära bör 13f gå före hela den här planen.

---

## Sammanfattning

| Etapp | Innehåll | Insats | Wow för medarbetaren |
|---|---|---|---|
| 22 | Det som syns direkt (namn, ring, stegbilder, polish) | Låg | ⭐⭐⭐ Störst effekt per timme |
| 23 | Kommandopalett överallt | Låg–medel | ⭐⭐⭐ "Appen är snabb" |
| 24 | Push-notiser | Medel–hög | ⭐⭐⭐ Appen når mig |
| 25 | "Sedan ditt förra pass" | Låg–medel | ⭐⭐ Komma ikapp på två minuter |
| 26 | Föreslå ändring | Medel | ⭐⭐⭐ Min röst syns i innehållet |
| 27 | Skanna i förrådet | Medel | ⭐⭐ Fysisk vardagsmagi |
| 28 | Kundens egen profil | Låg | ⭐⭐ "Vår app", inte "ett system" |
| 29 | Offline på riktigt | Medel | ⭐⭐ Fungerar i källaren |
| 30 | Snabbhet och WCAG AA | Medel | – Osynlig, men bär allt annat |

**Snabbaste vägen till synlig effekt:** Etapp 22 + 23 tillsammans. De kräver inga beslut, rör
inga känsliga gränsdragningar, och skulle märkas av varenda användare första dagen efter
release.
