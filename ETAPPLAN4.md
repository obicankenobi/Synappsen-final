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

# UI-designjustering: domän- vs. statusfärg ✅ KLAR (utanför etappnumreringen)

**Varför:** Ett externt granskat mockup-förslag ("Nordic Clinical"/"Midnight Ward",
2026-07-28) identifierade en verklig designrisk: om en fast områdesfärg (Kliniskt stöd/
Logistik/Administration) och en dynamisk statusfärg (godkänd/väntar/avvisad) delar samma
hue-familj (t.ex. orange för både "Logistik" och "väntar på godkännande") blir de omöjliga
att skilja åt i samma vy. Genomfört direkt (mellan Etapp 25 och 26) på användarens begäran,
innan resten av planen fortsatte.

**Genomfört:**
- Nya, FASTA CSS-tokens i `index.css` för domänfärger (`--doman-klin-*` blå,
  `--doman-log-*` lila, `--doman-adm-*` cyan) – medvetet FRÅNKOPPLADE `--primar` (den
  personliga, valbara accentfärgen från Etapp 22e), eftersom en domänfärg annars skulle
  ändras av att en användare bytte sin egen accent. Statusfärger (amber/grön/röd) fanns
  redan; kompletterade `--success` med `-ljus`/`-text`-varianter så alla tre statusar följer
  samma "pastell i ljust, solid i mörkt"-mönster. Samtliga 12 kombinationer
  kontrastberäknade (WCAG AA, ≥4.5:1) – lägsta uppmätta värde 4.79:1 (success/ljust).
- Delat badge-designsystem: `src/components/Badge.jsx` (`DomanBadge`/`StatusBadge`) +
  `src/utils/badge.js` (info-tabeller + `domanNyckelForEtikett`), applicerat på
  `RutinKort.jsx` och `ForradArtikelKort.jsx` (status: "Väntar på godkännande" med ⏳-ikon,
  ersatte den tidigare namnlösa "Utkast"-texten), `SokFalt.jsx`/`KommandopalettInnehall.jsx`
  (domänbadge i sökresultatens kategori-rad – den plats där olika områden faktiskt blandas
  i samma lista) och `Notisklocka.jsx` (`useNotiser.js` exponerar nu `omrade` per post).
  Statusbadgen är medvetet tyngre (font-weight 700 + en inre kant) än domänbadgen (500) för
  att aldrig vara svagare, enligt kravet på högst visuell prioritet för status.
- **Premisskontroll (genomgående krav 8):** den konkreta kollisionen i mockupen (en
  färgad "Logistik"-prick som återanvänder samma orange som "väntar") finns INTE i den
  riktiga appen idag – det saknas helt färgade domänbadges för närvarande. Åtgärden är
  alltså en förebyggande designregel inför framtida badges, inte en bugfix på en
  redan existerande kollision.
- Konsekvent datumformat: ny `src/utils/datum.js` (`formateraDatum`), ersatte tre
  duplicerade lokala implementationer (`RutinKort.jsx`, `AnslagKort.jsx`, `Feedback.jsx`,
  redan identiska: dag + förkortad månad + år, t.ex. "24 jul 2026") samt en genuint
  avvikande ISO-liknande variant (`InaktivaKontonSektion.jsx`) som nu följer samma format.
  Datum+klockslag i logg-/revisionsvyer (`adminHjalp.js` m.fl.) och chart-axel-etiketter
  (`Admin.jsx`) rörda INTE – de är ett annat, avsiktligt behov, inte samma typ av visning.
- Konsekvent sökplaceholder: `SokFalt.jsx` och `KommandopalettInnehall.jsx` delar nu samma
  kärnfras ("Sök rutin, diagnos eller nyckelord...") – paletten behåller ett tillägg
  ("– eller kör en åtgärd...") eftersom den faktiskt gör mer än att söka.
- Versalkonsekvens: enda befintliga `text-transform: uppercase` (en sektionskicker i
  `KommandopalettInnehall.css`) dokumenterad som ett medvetet, temaoberoende designtoken
  istället för borttagen, i enlighet med granskningens egen öppning för det alternativet.
- Verifierat visuellt (Playwright, ljust och mörkt läge) inklusive "stresstestet":
  en Logistik-artikel märkt "Väntar på godkännande" i samma kort – domän- och statusbadge
  är tydligt visuellt åtskilda i båda teman.
- Nya tester: `src/utils/badge.test.js` (ingen delad CSS-klass mellan domän/status-listorna,
  varje status har en ikon), `src/utils/datum.test.js`.

**Sidofynd vid deploy (fixat i samma release, v5.45.1):** `src/version.js` exporterade en
egen, HÅRDKODAD `APP_VERSION`-sträng helt frikopplad från `package.json`s `"version"` – den
hade inte uppdaterats sedan Etapp 14d (fastnade på "5.26.0") trots minst 19 efterföljande
versionshöjningar i `package.json`, inklusive hela den här sessionens Etapp 22–25 och
UI-justeringen ovan. Upptäcktes när användaren efter deploy fortfarande såg det gamla
numret i `Nyheter.jsx`. Löst genom att `version.js` nu importerar `version` direkt från
`package.json` (Vite/Rollup bearbetar JSON-importer vid bygget) istället för att underhålla
två separata versionssträngar för hand – kan alltså inte drifta isär igen.

**Uppföljning (v5.45.3): temperatur + rubrikgenomgång.** Användaren skickade en ny bild av
mockupen och bad specifikt om att den LJUSA temperaturen skulle hämtas från "Nordic Clinical"
och den MÖRKA från "Midnight Ward" (basfärgerna – bakgrund/yta – inte badge-hue-separationen,
som redan var klar). Pixelmätt med Python/PIL direkt i den uppladdade bilden istället för att
gissa:
- Ljust läge: `--bg` justerad #f8fafc → #f5f9fa (uppmätt Nordic Clinical-bakgrund, en subtil
  skillnad – ytan/`--yta` var redan `#ffffff`, matchade exakt).
- Mörkt läge: `--bg` #0f172a → #0a0e16 och `--yta` #1e293b → #131722 (uppmätt Midnight
  Ward: bakgrund ~#080b12, ytor ~#12151c–#151a20 – betydligt djupare/svartare än tidigare).
  `--kant`/`--kant-stark` samt `--primar-ljus` (hover-/fokusfärgen, alla fyra
  accentvarianter: standard, grön, lila, orange) mörkades i motsvarande proportion så de
  fortfarande läser som "en nyans över bakgrunden" mot det nya, mycket mörkare underlaget.
  Alla text/bakgrund-kombinationer omkontrollerade (WCAG AA) efter ändringen – ingen gick
  under 4.5:1, flera förbättrades eftersom en mörkare bakgrund ökar kontrasten mot ljus text.
  Badgens egna domän-/statusfärger (fasta, opaka chip-fyllningar) rördes INTE – de behövde
  ingen ombalansering eftersom de inte är beräknade relativt bakgrunden.
- **Rubrikgenomgång:** hittade en genuin dubblett – bottennavigeringen hade två olika
  destinationer (`/administration`, policys/anslag/regelverk, och `/admin`,
  superadmin-panelen) som BÅDA visade texten "Admin". `/administration` heter nu "Regler"
  (matchar ordet "regelverk" i sidans egen beskrivning); superadmin-panelen behåller "Admin".
  Genomsökte även h1/h2 i hela `src/pages` och `src/components/admin` efter andra dubbletter
  – inga fler äkta cross-sida-kollisioner hittades (upprepade rubriker som förekom var
  samma villkorliga rubrik inom EN sida, inte två olika sidor med samma text).
- **Sidofynd under samma genomgång:** `BottomNav.css` klippte redan tidigare (oberoende av
  dagens namnbyte) bort den sista länken helt på smala skärmar (~320–360px) när alla 7 poster
  visas (redaktörsroller) – verifierat med Playwright i flera bredder. Fixat med
  `overflow-x: auto` + `flex-shrink: 0` på länkarna, så den blir nåbar via en sidledes
  svep istället för helt oåtkomlig.

---

# Etapp 26 – Medarbetarens röst: föreslå en ändring ✅ KLAR

**Varför:** I dag är innehållsflödet enkelriktat – redaktörer skriver, personal läser och
kvitterar. Den som står vid sängen och ser att en rutin är fel har bara kommentarsfältet, som
ingen är skyldig att göra något med. Att kunna föreslå en konkret ändring och sedan se den
införd är den starkaste engagemangsdrivaren som finns i den här typen av verktyg: *"min åsikt
syns i rutinen."*

**Modul:** ingen (Core).

### 26a – Föreslå ändring ✅ KLAR

- Knapp på rutinkortet: markera ett stycke → "Föreslå ändring" → skriv förslaget → skicka.
- Ny collection `andringsforslag`: `organisationId`, `rutinId`, `markeratStycke`, `forslag`,
  `motivering`, `status` (ny/infört/avvisat), `foreslagenAv`, `tidpunkt`.
- **Fritextfält ⇒ PII-spärr i tre lager** (genomgående krav 1) – klient, regel och, om AI
  används, Cloud Function.
- **Genomfört:** `RutinKort.jsx` har en ny "✏️ Föreslå ändring"-knapp som fångar en eventuell
  textmarkering via `window.getSelection()` gjord INNAN knapptrycket, och öppnar
  `ForeslaAndringModal.jsx`. **Avgränsning (genomgående krav 8):** riktig, tillförlitlig
  textmarkering över godtycklig renderad HTML är inte byggbart utan en betydligt tyngre
  editor-komponent – på skrivbord fångas en markering automatiskt, på mobil (där
  textmarkering över flera rader är opraktiskt) fylls fältet "Vilket stycke gäller det?" i för
  hand istället. PII-spärren körs klientsidan (`kontrolleraPatientuppgifter`, samma mönster
  som övriga formulär) OCH i `firestore.rules` (`harTroligtPersonnummer` på alla tre
  textfälten) – ingen AI-analys är inblandad här, så det tredje lagret (Cloud Function)
  behövdes inte.

### 26b – Redaktörens vy: en knapp ✅ KLAR

- Lista över öppna förslag för mitt område, med det markerade stycket och förslaget sida vid
  sida.
- "Inför" ska öppna rutinformuläret med förslaget förifyllt på rätt plats – inte tvinga
  redaktören att klippa och klistra manuellt. Godkännandeflödet (utkast → godkänd) gäller
  precis som vanligt; ingenting publiceras automatiskt.
- Avvisa kräver en kort motivering. Ett förslag som försvinner tyst är värre än inget flöde
  alls.
- **Genomfört:** ny `ForslagSektion.jsx`, synlig i `Sektionssida.jsx` för alla med
  redigeringsrätt för området, listar öppna (`status: "ny"`) förslag. "Inför" infogar
  förslaget direkt EFTER det markerade stycket om det går att hitta ordagrant i innehållet
  (annars läggs det till sist), formaterat som ett Markdown-citat ("**Förslag att
  bedöma:** …") och öppnar det vanliga rutinformuläret – **premisskontrollerad
  avgränsning:** riktig platsigenkänning (en äkta diff-motor) byggdes inte, den ordagranna
  sök-och-infoga-lösningen är enklare och räcker för att uppfylla "inte tvinga redaktören att
  klippa och klistra". Förslaget markeras `infört` i Firestore FÖRST efter en faktisk
  sparning av formuläret (inte redan vid knapptrycket) – avbryts redigeringen istället
  förblir förslaget `ny`. Avvisa är en inline-textruta per rad (samma mönster som
  bristanmälans hanteringsflöde).
- **Verifierat i en riktig browser mot lokala emulatorer (Playwright), inte bara testsviter:**
  hela kedjan föreslå → redaktör ser förslaget → Inför → förifylld editor → spara → förslaget
  försvinner ur listan → attribution syns på rutinkortet. Ett verkligt fel hittades och
  fixades under den här verifieringen (se sidofyndet nedan) – exakt den typ av bugg
  testsviterna inte kunde fånga.

### 26c – Återkoppling till den som föreslog ✅ KLAR

- Notis: "Ditt förslag på *Anafylaxi* är infört" respektive "…avvisades: [motivering]".
- Frivillig, avstängningsbar synlighet: "Förslag från Anna Svensson" i rutinens historik. Vill
  man vara anonym ska det gå.
- **Genomfört:** `useNotiser.js` fick två nya poster – en stående (till redaktörer, "Nytt
  förslag på …") och en engångshändelse (till förslagsställaren, styrd av
  `senasteNotisBesok` precis som bristanmälans motsvarighet). Attributionen ("Innehåller ett
  infört förslag från X") visas i `RutinKort.jsx`s signaturblock – **premisskontrollerad
  avgränsning:** INTE i den tekniska versionshistoriken (`VersionsHistorik.jsx`), som är en
  fristående mekanism för att återställa gamla innehållsversioner och inte har något fält för
  "varifrån kom det här innehållet". Lika synligt för en vanlig användare, men enklare att
  koppla in. Respekterar `visaNamnOffentligt` (avmarkerad kryssruta i förslagsformuläret ⇒
  anonym för alla utom redaktören som hanterar det, som alltid ser `foreslagenAv` för
  notissyftet).

### 26d – Gränsdragning mot MDR ✅ KLAR

- Samma ställningstagande som Etapp 18 (se `SAKERHETSRAPPORT.md`): ett förslag är **råmaterial
  till en människa**, aldrig något som publiceras utan redaktörens aktiva godkännande. Ingen
  automatik, ingen AI som inför ändringar självt.
- **Genomfört:** "Inför" gör aldrig en tyst skrivning – den öppnar samma redigeringsformulär
  som all annan rutinredigering, redaktören måste aktivt granska/justera/ta bort
  "Förslag att bedöma"-markeringen och trycka Spara. Det vanliga godkännandeflödet
  (utkast → godkänd) gäller oförändrat.

**Sidofynd under Playwright-verifieringen (viktigt mönster att komma ihåg):** en `list`-fråga
mot en collection vars läsregel refererar `resource.data.<fält>` (t.ex.
`farRedigeraOmrade(resource.data.omrade)`) NEKAS HELT av Firestore om frågan inte SJÄLV
filtrerar på det fältet (`where("omrade", "==", ...)`) – annars kan regelmotorn inte bevisa
att villkoret håller för en generell listning, och hela lyssnaren felar tyst med
`permission-denied` (upptäcktes bara genom att faktiskt öppna appen i en browser – testsviterna,
som skapar/läser enskilda dokument med känd omrade, fångade inte detta). Samma begränsning
gäller redan `rutiner/{rutinId}` (löst där sedan tidigare genom att `useRutiner(omrade)` alltid
frågar per område). `useAndringsforslag(omrade)` byggdes om för att följa samma mönster, och
skrivfunktionerna (`skapaForslag`/`markeraInfort`/`avvisaForslag`) bröts ut som fristående
funktioner (samma struktur som `useLaskvittering.js`) så att komponenter som bara skriver
(t.ex. `RutinKort.jsx`) inte behöver öppna en lyssnare de ändå inte visar något ifrån.

**Klart när:** en sjuksköterska kan föreslå en rättelse på trettio sekunder, och redaktören
kan införa den på ett klick – och båda ser att det hände.

---

# Etapp 27 – Skanna och hitta i förrådet ✅ KLAR (2026-07-29)

**Varför:** Förrådsdelen är den mest konkreta delen av appen, och den används stående framför
ett skåp med en mobil i handen. QR-kod finns redan för rutiner (`RutinKort.jsx` genererar
dem) – men bara att *visa*, inte att *läsa*.

**Modul:** logistik.

### 27a – Skanna med kameran ✅ KLAR

**Genomfört:** "📷 Skanna en hylla/QR-kod"-knapp på `Logistik.jsx`, öppnar `SkannaModal.jsx`
(full-skärms kameravy). `window.BarcodeDetector` används när den finns (Chrome/Android);
annars lazy-laddas `jsqr` (`await import("jsqr")`) som en egen chunk – bekräftat i
produktionsbygget: `jsQR-*.js` (130 kB) hamnar som en helt separat, on-demand-laddad fil,
huvudpaketet (`index-*.js`) är oförändrat i storlek jämfört med innan Etapp 27. En ren
funktion, `tolkaSkannadLank` (`src/utils/skanna.js`), avgör om den skannade texten är en giltig
länk INOM appens egen origin (`window.location.origin`) – text från en annan origin eller som
inte alls är en URL avvisas innan navigering, annars hade en manipulerad/felaktig QR-kod kunnat
bli en öppen redirect. 4 vitest-tester (`skanna.test.js`, `happy-dom`-miljö). Verifierat i
Playwright mot lokala emulatorer: kameran nekas gracefully i en miljö utan riktig kamera
(felmeddelande + modalen stänger sig själv, inga krascher) – **den faktiska
QR-avläsningsloopen (BarcodeDetector/jsQR mot en riktig videoström) går inte att verifiera i
den här sandboxen och behöver en manuell test med en riktig telefon/kamera innan lansering**,
motsvarande öppna punkten för Etapp 17d/30b.

### 27b – Etiketter att sätta på hyllan ✅ KLAR

**Genomfört:** `HyllEtiketter.jsx`, öppnas via en "🖨️ Hylletiketter"-knapp i `ForradVy.jsx`
(bara för `farRedigera`). Genererar EN QR-etikett per unikt skåp/hylla-par bland förrådets
egna artiklar – **premisskontroll (krav 8):** ingen ny "plats"-datamodell skapades, platserna
härleds direkt ur de befintliga fritextfälten `skap`/`hylla` på `forradsartiklar`, eftersom en
egen collection bara för etiketter hade löst ett problem ingen bett om. Varje etikett kodar
`{origin}/logistik/{forradSlug}?skap=X&hylla=Y` (samma `qrcode`-bibliotek som redan används i
`RutinKort.jsx`). Utskrift återanvänder samma böjda mönster som rutinernas utskriftsvy
(`body`-klass + `@media print`-regel som döljer allt annat), fast med en egen klass
(`utskrift-etiketter`) eftersom det är en helt annan yta som skrivs ut. Verifierat i
Playwright: 3 seedade artiklar med 2 unika skåp/hylla-kombinationer gav exakt 2 etiketter.

### 27c – Tydligare väg till artikeln ✅ KLAR

**Genomfört:** `ForradArtikelKort.jsx` visar nu "{Förråd} → Skåp X → Hylla Y" istället för den
tidigare "Skåp X · Hylla Y"-textraden (verifierat i Playwright: exakt
"Sterilförrådet → Skåp B → Hylla 3"). Kortet har fått samma `id`-ankare som `RutinKort.jsx`
(`id="artikel-{id}"`), och `ForradVy.jsx` tolkar både `?skap=&hylla=` (från en skannad
hylletikett – filtrerar listan och visar en banner "Visar plats: ... / Visa alla artiklar",
verifierat: filtrering till Skåp B/Hylla 3 gav exakt de 2 rätta artiklarna) och `#artikel-<id>`
(scrollar dit och ger kortet en visuell markering, `forrad-artikel-kort--markerad`). Den
befintliga bristanmälan-knappen ("⚠️ Slut/lågt saldo" → valfri kommentar → "Skicka") krävde
INGEN ändring för "två tryck" – kommentarfältet var redan valfritt, så flödet är redan
tryck+tryck utan att skriva något. Det etappen faktiskt löser är att HITTA rätt kort snabbt
(filtrering/scroll/markering ovan) – innan dess var "två tryck" i praktiken "leta i en lång
lista, sedan två tryck".

**Klart när:** man kan gå fram till ett skåp, skanna, och se exakt vad som ska finnas där –
och anmäla att det inte gör det. ✅ (med reservationen om manuell kameraverifiering ovan)

---

# Etapp 28 – Kundens egen profil ✅ KLAR (2026-07-30)

**Varför:** Billigaste sättet att få ett verktyg att kännas som "vårt" istället för "ett system
någon köpt in". Syns för alla användare, varje gång.

**Modul:** ingen (Core).

### 28a – Logotyp och accentfärg per organisation ✅ KLAR

**Genomfört:** ett namnrymdat `branding`-fält på `organisationer/{orgId}` (`logotypUrl`,
`accentfarg`, `valkomsttext`) – samma mönster som `sakerhet.kravMfaForRoller`, ingen ny
collection. `useOrganisationBranding.js` (läser + `sparaBranding()`), redigeras i en ny
adminsektion `OrganisationBrandingSektion.jsx` ("🏷️ Vår profil", bredvid `ModulerSektion`).
Logotyp laddas upp via `laddaUppLogotyp()` (`src/firebase/storage.js`, samma mönster som
`laddaUppAvatar`) till `organisationer/{orgId}/logotyp/{filnamn}` – ny `storage.rules`-regel:
läs = samma organisation, skriv = bara superadmin i den EGNA organisationen (5 nya
rules-tester). Ingen ändring av `firestore.rules` behövdes – toppnivå-skrivregeln för
`organisationer/{orgId}` (superadmin i egen org) täcker redan de nya `branding.*`-fälten.

**Premisskontroll (krav 8) – hur accentfärgen faktiskt tillämpas:** den befintliga PERSONLIGA
accenten (Etapp 22e, `useAccent.js`) är ett fast urval av 4 färger sparat per enhet i
localStorage, applicerat via `data-accent`-attributet. En kunds FRIA hexfärg kunde inte
återanvända samma attribut utan att skapa oklar prioritetsordning. Löst utan någon JS-jämförelse
alls: `OrganisationsBranding.jsx` injicerar en OSKOPAD `:root { --primar: ... }`-regel i en egen
`<style>`-tagg. Den har LÄGRE CSS-specificitet än index.css:s `:root[data-accent="gron"]` m.fl.,
så en användares eget val vinner alltid automatiskt via vanlig cascade – ingen kod behöver
avgöra "vems val gäller", CSS gör det åt oss.

### 28b – Egen välkomsttext ✅ KLAR

**Genomfört:** `branding.valkomsttext`, visas under rubriken på `Hem.jsx` tillsammans med
logotypen (`.hem__logotyp`/`.hem__egen-valkomsttext` i `index.css`).

### 28c – Gränser som inte får överskridas ✅ KLAR

**Genomfört:** `src/utils/kontrast.js` – WCAG 2.1-kontrastberäkning (relativ luminans) från
grunden (inget sådant fanns i kodbasen sedan tidigare). `valideraAccentfarg()` körs INNAN
`sparaBranding()` skriver till Firestore, och avvisar en färg som underskrider 4.5:1 mot vit
knapptext i ljust läge ELLER mot den mörka ytfärgen i mörkt läge (en automatiskt ljusgjord
variant av samma färg, samma princip som de fördefinierade accenternas hand-valda
ljus/mörk-par). **Premisskontroll:** kontrasten valideras ENDAST klientsidan – Firestores
regelspråk saknar potensfunktion och kan inte räkna WCAG-luminans, så ingen server-side spärr
finns bortom det vanliga superadmin-i-egen-organisation-kravet. Dokumenterat här som en
medveten avgränsning, inte en lucka som missats. 9 nya vitest-tester för kontrastmatematiken.
Akutläget (`Akutlage.css`) använder redan uteslutande hårdkodade hexfärger, inga CSS-variabler
alls – kontrollerat, ingen ändring behövdes för att garantera att det ser likadant ut oavsett
kundens val.

Verifierat i Playwright mot lokala emulatorer: satte accentfärg `#c2410c` + välkomsttext →
`getComputedStyle(document.documentElement).--primar` gav exakt `#c2410c` på Hem.jsx, samtidigt
som Akutläge-knappen förblev röd. Försök att spara `#fef9c3` (för ljus) gav ett tydligt
avvisningsmeddelande ("För svag kontrast... 1.1:1, kräver minst 4.5:1") och sparades inte.

**Klart när:** personalen ser sin egen verksamhets logotyp när de loggar in, utan att någon
kunnat göra appen svårläst på vägen. ✅

---

# Etapp 29 – Offline på riktigt ✅ KLAR (2026-07-30, 29a–c – se reservation i 30b nedan för akutläget)

**Varför:** Offline-centret (Etapp 3a) cachar i dag **bara godkända rutiners text** – uttryckligen
"inga bilagor/bilder", och varken kontakter eller förrådsartiklar (bekräftat i
`useOfflineCenter.js`). Källare, hissar och skyddsrum har dålig täckning, och det är exakt då
man behöver ett telefonnummer eller en artikels placering.

**Modul:** operations (samma som offline-centret i dag).

**Sidofynd innan bygget påbörjades (premisskontroll, krav 8):** medan 29c:s köflush skulle
vänta på att `useBristanmalningar()`s lista laddat klart upptäcktes att den listan ALDRIG
laddar klart för någon utan förrådsansvarig-roll – `bristanmalningar/{bristId}`s läsregel
(`farRedigeraOmrade('logistik') || resource.data.anmaldAv == request.auth.uid`) är exakt samma
buggklass som `andringsforslag/{forslagId}` i Etapp 26: en `list`-fråga vars regel refererar
ett `resource.data`-fält frågan inte konstant kan bevisa nekas i sin HELHET, inte bara
filtrerat. Bekräftat direkt mot emulatorn: en vanlig `personal`-roll fick `permission-denied`
på HELA sin bristanmälan-lyssnare, en tyst produktionsbugg sedan Etapp 20 som ingen
getDoc/create-test fångade. Fixad i `firestore.rules` (läsning öppnad till hela organisationen
– datan är inte känslig, och dubblettskyddet kräver ändå att alla ser varandras öppna
anmälningar för att kunna slås ihop). 2 nya list-baserade rules-tester
(`tests/rules/organisationsisolering.test.mjs`), 142 klarade totalt (upp från 140).

### 29a – Utöka cachen ✅ KLAR

**Genomfört:** `useOfflineCenter.js` skriven om från en enda global räknare till en
per-innehållstyp `status`-karta (`rutiner`/`kontakter`/`forradsartiklar`, var och en med egen
`senast`/`antal` i localStorage, fortfarande per-uid-nyckelad). `nedladda()` gör tre separata
`getDocs`-anrop (rutiner godkända, kontakter – alla, förrådsartiklar godkända) som tvingar in
dokumenten i Firestores `persistentLocalCache`, exakt samma mekanism som redan gällde för
rutiner. Bilder är ett HELT separat, valbart steg (`laddaNerBilder()`) som hämtar
`bildUrl`/`bilagor`-fälten från de redan nedladdade rutinerna och sparar själva bildfilerna i
en namngiven Cache Storage-cache (`synappsen-offline-bilder`) – inte Firestores dokumentcache,
som inte hanterar Cloud Storage-innehåll. `OfflineCenter.jsx` uppdaterad med tre statusrader +
en separat "Ladda ner bilder också"-knapp (inaktiverad tills huvudnedladdningen körts minst en
gång).

### 29b – Ärlig status ✅ KLAR

**Genomfört:** `OfflineIndikator.jsx` (den befintliga bannern, inget nytt byggt) läser nu
`useOfflineCenter()`s status och visar en andra rad – "Tillgängligt offline: Rutiner (nyss) ·
Kontakter (2 tim sedan) · Förråd (1 dygn sedan)" – med relativ ålder per innehållstyp.
Verifierat i Playwright (riktig offline-simulering via Chromium DevTools Protocol): bannern
visade exakt denna text efter en nedladdning.

### 29c – Kö för åtgärder offline ✅ KLAR

**Genomfört:** `src/utils/offlineKo.js` – en ren, React-fri localStorage-kö (samma
per-uid-mönster som offline-centret). Läskvittering (`kvitteraLastMedKo`/
`kvitteraLastAnslagMedKo` i `useLaskvittering.js`) är idempotent (arrayUnion) och därför säker
att köa direkt utan extra logik. Bristanmälan köas i `ForradVy.jsx`s `hanteraAnmalBrist` vid
skrivfel/offline. `useOfflineKo.js` (monterad en gång vid approten via
`OfflineKoLyssnare.jsx`) lyssnar på `window`s `online`-event och spelar upp kön – för
bristanmälan-poster väntar den EXPLICIT på att `useBristanmalningar()`s egen lista laddat klart
innan den skickar (annars hade dubblettskyddet i `skapaBristanmalning` kunnat missa en redan
öppen anmälan och skapa en duplicerad post istället för att räkna upp den). `OfflineIndikator.jsx`
visar "⏳ N åtgärder väntar på att skickas" så länge kön inte är tom, även efter att
anslutningen kommit tillbaka (försvinner när kön faktiskt tömts). Verifierat end-to-end i
Playwright: en läskvittering gjord i simulerat offline-läge hamnade i `localStorage`-kön,
och tömdes automatiskt efter ett `online`-event.
**Gränsdragning respekterad:** ENDAST läskvittering och bristanmälan köas – inget som ändrar
publicerat innehåll (rutintext, godkännanden, etc.) går att göra offline, det finns ingen
kod-väg för det.

**Klart när:** en telefon i flygplansläge kan visa en rutin, ett telefonnummer och var en
artikel ligger – och kvittera rutinen så fort täckningen är tillbaka. ✅

---

# Etapp 30 – Snabbhet och tillgänglighet (inte "wow", men avgörande) — 30a/30c ✅ KLAR, 30b öppen (kräver verksamheten)

**Varför:** Ingen av funktionerna ovan känns bra i en app som tar tid att öppna. Den här
etappen är medvetet tråkig och ligger sist, men utan den urholkas allt det andra.

**Modul:** ingen (Core).

### 30a – Startladdningen ✅ KLAR (delvis – se avgränsning)

**Premisskontroll:** planens siffra ("686 kB") var något inaktuell – ett färskt bygge innan
denna etapp visade `firebase-vendor` på 658,25 kB (194,03 kB gzip). En fullständig
lazy-laddning av Firestore separat från Auth visade sig vara en STÖRRE arkitekturändring än
motiverat just nu: `src/firebase/config.js` initierar båda i EN eager-laddad modul, och 48
filer importerar `firebase/firestore` mot bara 5 för `firebase/auth` – att dela upp dem hade
krävt att omstrukturera NÄR/HUR Firestore initieras för nästan hela appen, en risk som inte
står i proportion till vinsten (firestore/auth behövs praktiskt taget direkt på varje sida,
så lite skulle faktiskt undvikas att ladda i förväg).

**Genomfört istället, en verkligt lågriskvinst:** `firebase/app-check` gjordes om från ett
statiskt top-level-import till ett dynamiskt `import()` inuti det redan existerande
`if (VITE_RECAPTCHA_SITE_KEY...)`-villkoret – de allra flesta organisationer har ännu ingen
reCAPTCHA-nyckel konfigurerad (App Check är fortfarande i mätfas, Etapp 12c-i), så det biblioteket
behövde inte ligga i den redan tunga huvud-chunken för alla. Uppmätt: `firebase-vendor` gick
från 658,25 kB → 649,42 kB (194,03 → 191,20 kB gzip). Litet men verkligt, och riskfritt.
**Tak för framtida etapper:** `firebase-vendor` ska inte växa över nuvarande 650 kB utan en
uttrycklig, mätt motivering – samma "mät före/efter"-krav gäller alla senare tillägg av
Firebase-relaterade beroenden.

### 30b – Avsluta Etapp 17d — INTE genomförd, kräver verksamheten

- Det som saknas är inte kod utan **ett fysiskt test**: fungerar akutläget med handskar och i
  starkt ljus? Organisera testet med verksamheten, dokumentera resultatet, stäng etappen.
- Detta går inte att slutföra som ett kodningsuppdrag – kvarstår som en öppen punkt som kräver
  ett fysiskt möte med akutmottagningens personal, inte mer kod.

### 30c – Från WCAG A till AA ✅ KLAR (fokusindikator – se avgränsning)

**Genomfört:** en enda delad `:focus-visible`-regel för samtliga knappvarianter
(`.knapp`/`--sekundar`/`--farlig`/`--lank`) i `index.css` – en garanterad, konsekvent
fokusring (3 px, `--primar-mork`) istället för att förlita sig på webbläsarens standardram,
som varierar i kontrast mot appens egna färger. EN regel täcker alla knappar i HELA appen,
inklusive samtliga nya vyer från Etapp 22–29, vilket är både grundligare och mindre kod än att
lappa varje enskild komponents CSS individuellt.
**Avgränsning (premisskontroll):** en snabb genomgång av CSS/JSX i de nyaste komponenterna
(`ForeslaAndringModal`, `ForslagSektion`, `SkannaModal`, `HyllEtiketter`,
`OrganisationBrandingSektion`) visade inga ytterligare akuta gap – alla interaktiva element är
riktiga `<button>`, inga icke-semantiska klickbara `<div>`, och dialoger har redan
`role="dialog"`/`aria-label`. En FULLSTÄNDIG WCAG AA-revision (kontrastmätning av varje
färgkombination, tangentbordsfälla-test i varje modal) är utanför vad som rimligen ryms i den
här etappen och kvarstår som en öppen, mindre punkt – tillgänglighetsredogörelsen kan inte
ännu säga AA helt utan förbehåll, men den enskilt viktigaste, mest spridda bristen
(fokusindikatorn) är nu åtgärdad överallt på en gång.

**Klart när:** appen öppnas märkbart snabbare än i dag, och tillgänglighetsredogörelsen kan
säga AA utan förbehåll. Delvis uppnått (30a/30c), 30b kvarstår som en verksamhetsfråga.

---

# Etapp 31 – Uppföljning på kodgranskningsrapporten (2026-07-30) — 31a/31b ✅ KLAR, 31c beslutsunderlag skrivet (väntar på ägarens konsolgranskning)

**Varför:** En extern kodgranskning (`synappsen_code_review.pdf`) gick igenom Etapp 1–26 och
lyfte fram tre konkreta, billiga förbättringar som redan bekräftats mot faktisk kod/status i
den här sessionen – resten av rapportens punkter var antingen redan lösta (namngivna
Firestore-hjälpfunktioner, cross-org-negativtester) eller för stora för att motivera nu (en
full modulmappsomstrukturering av frontend). Se konversationen där rapporten diskuterades för
den fullständiga bedömningen av samtliga punkter.

**Modul:** ingen (Core/drift).

### 31a – Automatiserad beroendegranskning i CI ✅ KLAR (2026-07-30)

- Lägg till ett CI-steg som kör `npm audit` och sammanfattar kända CVE:er (allvarlighetsgrad,
  paket, om en fix finns) i en maskinläsbar rapport, inte bara som en tyst varning i
  build-loggen.
- **Premiss redan bekräftad:** `npm audit` visar just nu minst en hög sårbarhet i
  `react-router` (CSRF-relaterad) i produktionsberoenden, och betydligt fler (23 höga + 1
  kritisk) räknat över hela `devDependencies`-trädet – inget av detta är åtgärdat idag.
- Avgränsning: detta steg ska **rapportera**, inte blockera bygget automatiskt – en ny CVE i
  en transitiv devDependency ska inte kunna stoppa en release utan att någon aktivt bedömt den.

**Genomfört:** `scripts/npm-audit-rapport.mjs` – kör `npm audit --json` i både roten och
`functions/` (två separata `package.json`, två separata beroendeträd), filtrerar fram
hög/kritiska fynd, och skriver en Markdown-tabell (paket, allvarlighetsgrad, om en fix finns,
kända sårbarhetsnamn) till `$GITHUB_STEP_SUMMARY` i CI (syns direkt i Actions-körningens
sammanfattningsflik, inte begravt i en loggrad). Nytt steg i `.github/workflows/ci.yml`, kört
med `if: always()` (så rapporten skrivs även om ett tidigare steg misslyckats) och
`process.exit(0)` alltid i skriptet – bekräftat lokalt: 24 sårbarheter i roten (23 höga + 1
kritisk, exakt samma tal som SessionStart-hooken visat hela sessionen) skrev en fullständig
rapport och avslutades med kod 0, inget i functions/.

**Avgränsning (medveten, inte en glömd del):** ingen version bumpad, ingen ändring i
`andringslogg.js`, och ingen deploy triggad för det här delsteget – det är en ren
CI-/driftändring utan någon skillnad i det som faktiskt deployas (frontend/Cloud
Functions/regler är oförändrade), så en Firebase-deploy hade bara varit ett resultatlöst
körande av samma befintliga artefakter. Samma bedömning gjordes tidigare för Etapp 8a/8b
(Node 22, `continue-on-error`-borttagning) – ingen egen changelog-post, bakades in i nästa
substantiella releases versionsbump istället för att ge en tom `andringslogg.js`-post om ett
CI-internt jobb.

### 31b – Committad Playwright-regressionssvit för de känsligaste flödena ✅ KLAR (2026-07-31)

**Genomfört:** `tests/e2e/` (Playwright Test, `playwright.config.js`), körs via
`npm run test:e2e` (`firebase emulators:exec ... "playwright test"`, samma mönster som
test:rules/test:functions/test:storage) och nytt CI-steg i `.github/workflows/ci.yml`
(`npx playwright install --with-deps chromium` följt av `npm run test:e2e`).
`tests/e2e/global-setup.mjs` seedar egna, isolerade `e2e-*`-konton/data (skiljt från
`tests/rules/*.test.mjs`s seed) innan Playwright startar vite-dev-servern mot emulatorerna.

- `organisationsisolering.spec.js`: en användare i org B ser aldrig org A:s rutininnehåll i
  det RIKTIGA UI:t (inte bara i regel-lagret), varken via normal navigering eller en direkt
  `#rutin-<id>`-länk.
- `list-provability.spec.js`: en vanlig roll (ingen redaktörsroll alls) ska inte få NÅGRA
  `permission-denied`-fel i webbläsarkonsolen vid normal navigering.

**Detta test hittade omedelbart tre allvarliga, tidigare okända buggar av exakt den
buggklass Etapp 26 upptäckte (`resource.data.<fält>` i en läsregel utan ett matchande
`where()` i frågan ⇒ HELA listningen nekas, inte bara enskilda dokument) – betydligt
allvarligare än Etapp 26/29:s fynd, eftersom de träffade appens KÄRNINNEHÅLL för
**standardrollen `personal`** (`DEFAULT_ROLE`, den roll varje nyinbjuden medarbetare får om
inget annat anges):**

1. **`rutiner/{rutinId}`** – `useRutiner(omrade)` frågade utan statusfilter. Regeln
   (`resource.data.status == 'godkand' || farRedigeraOmrade(resource.data.omrade)`) kunde
   inte bevisas för någon som inte är redaktör för just det området → HELA rutinlistan var
   osynlig. Detta gällde INTE bara "personal" – även t.ex. `vec` som tittar på
   kliniskt-stod-rutiner, eller `forradesansvarig` som tittar på någon rutin alls, drabbades.
2. **`forradsartiklar/{artikelId}`** – samma mönster, `useForradsartiklar()`.
3. **`rutiner/{rutinId}` (akutläget!)** – `useAkutlageRutiner.js` (hämtas globalt av
   `AkutlagePrefetch` för ALLA inloggade, oavsett roll) frågade `akutlage==true` utan
   statusfilter, och förlitade sig på klientsidig filtrering. Eftersom en akutlägesfråga
   spänner över ALLA områden samtidigt kan ingen enskild roll vara redaktör för alla, så
   frågan misslyckades konsekvent för alla utom superadmin/VÖL. **Appens mest
   säkerhetskritiska funktion – som uttryckligen ska fungera för VEM SOM HELST som loggar in
   – har varit osynlig för standardrollen sedan den byggdes.**
4. **`andringsforslag/{forslagId}`** (samma sökning, en fjärde instans): `useAndringsforslag(omrade)`
   användes av `useNotiser.js` för ALLA roller (för att kolla om ens EGET förslag hanterats),
   men frågade bara på `omrade`, inte `foreslagenAv` – nekades helt för icke-redaktörer.

**Varför detta aldrig upptäcktes tidigare:** samtliga manuella Playwright-verifieringar under
Etapp 1–30 den här sessionen använde uteslutande `vol`/`superadmin`/redaktörs-konton (t.ex.
`volA@orga.test`) – ALDRIG rollen `personal`, som är den enda som faktiskt saknar
redaktörsbehörighet överallt. `farRedigeraOmrade(...)` blev därför alltid sant i testerna och
maskerade buggen fullständigt. Detta är den konkreta motiveringen bakom hela 31b – och exakt
den typen av fynd en committad, role-medveten regressionssvit är till för.

**Fixat:**
- Ny klienthjälpfunktion `farRedigeraOmrade(role, omrade)` i `src/firebase/roles.js`, en
  exakt spegling av `firestore.rules`s serverfunktion (måste hållas i synk manuellt – ingen
  delad källa mellan klient och regler finns i det här projektet).
- `useRutiner.js`/`useForradsartiklar.js`: lägger till `where("status","==","godkand")` i
  frågan när den inloggade INTE är redaktör för området/förrådet – bevarar att utkast bara är
  synliga för redaktörer (ingen säkerhetsförsämring, bara att frågan nu själv håller det
  löfte regeln redan krävde).
- `useAkutlageRutiner.js`/`useAllaGodkandaRutiner.js`: lägger ALLTID till
  `where("status","==","godkand")` (dessa frågar över alla områden, ingen enskild
  redaktörskoll är meningsfull) – rätt beteende i sak, inte bara en bevisbarhetsfix.
- `useAndringsforslag.js`: den som inte är redaktör frågar bara efter SINA EGNA förslag
  (`where("foreslagenAv","==",uid)`) – exakt vad notiskvittensen ändå bara behöver.
- 7 nya list-baserade rules-tester (`tests/rules/organisationsisolering.test.mjs`), 149
  klarade totalt (upp från 142 vid Etapp 29/30).
- **Medvetet INTE fixat:** `usePapperskorg.js` har samma latenta mönster (frågar
  `borttagen==true` utan statusfilter), men sidan (`Papperskorg.jsx`) är redan gated bakom
  `arRedaktor(role)` – en `personal`-användare som manuellt navigerar dit ser "åtkomst
  nekad" och träffas aldrig av den trasiga listan i praktiken. Lägre prioritet, kvarstår som
  en känd, dokumenterad, lågriskrisk för en framtida etapp.

**Verifierat:** samtliga tre e2e-tester gröna, samt en fristående Playwright-körning mot
emulatorerna som seedade en akutlägesmarkerad rutin och bekräftade att `/kliniskt-stod` och
`/akutlage` båda renderar innehållet korrekt för `personal`-rollen, utan ett enda
`permission-denied` i konsolen.

### 31c – Nedskrivet beslut om App Check-enforcement ✅ KLAR (beslutsunderlag skrivet, 2026-07-31)

**Genomfört:** ett konkret beslutsunderlag (inte ny kod – detta ÄR dokumentationsarbetet
punkten bad om). Nuläget, verifierat mot faktisk kod innan detta skrevs:

- **12c-i är aktivt sedan tidigare deploy.** `VITE_RECAPTCHA_SITE_KEY` är satt direkt i
  `.github/workflows/deploy.yml` (rad 26, ett klartextvärde – inte en GitHub-secret, vilket är
  korrekt/förväntat för en reCAPTCHA v3-**site**-nyckel: den är avsedd att vara publik/
  klientsynlig, hemligheten ligger i den MATCHANDE server-side-secreten hos Google, som denna
  klientnyckel aldrig exponerar). `src/firebase/config.js` initierar App Check villkorat på
  just den nyckeln (nu via dynamiskt `import()`, se Etapp 30a).
- **12c-ii (`enforceAppCheck: true` på Cloud Functions) är INTE påbörjad.** Noll förekomster
  av `enforceAppCheck` i `functions/index.js`, bekräftat igen inför denna skrivning.
- Service workern registreras med `registerType: 'autoUpdate'` (`vite.config.js`) – gamla
  klienter uppdateras automatiskt utan att användaren behöver agera, vilket minskar (men inte
  eliminerar) risken för att en gammal, cachad session saknar giltig App Check-kod när
  enforcement slås på.

**Beslutsunderlag (kräver ägarens aktiva ja, kan inte avgöras från kod):**

1. **Hur lång mätperiod?** Rekommendation oförändrad sedan `ETAPPLAN2.md` Etapp 12c-ii:
   minst 1–2 veckors RIKTIG produktionstrafik efter en deploy, inte testtrafik. Eftersom
   12c-i redan varit aktivt sedan en tidigare deploy kan den här perioden mycket väl redan
   vara avklarad – det kräver bara att någon faktiskt tittar (se punkt 2).
2. **Vilket mätvärde avgör?** Firebase-konsolen → Build → App Check → Metrics, per Cloud
   Function-tjänst: andelen anrop med giltiga tokens kontra saknade/ogiltiga. Ett rimligt
   tröskelvärde: ≥ 98–99 % giltiga tokens över mätperioden, INGEN kvarvarande topp av
   "missing"-anrop som pekar på en specifik, fortfarande aktiv klientversion.
3. **Vem beslutar?** Ägaren (kräver inloggning i Firebase-konsolen, som jag inte har åtkomst
   till) – detta är den enda punkten som blockerar 12c-ii, allt annat är redan förberett.
4. **Hur hanteras en gammal cachad PWA-version utan giltigt token efter enforcement?**
   `autoUpdate` minimerar fönstret, men eliminerar det inte (en enhet i flygplansläge vid
   exakt fel tillfälle kan missa uppdateringen). Rekommendation: slå på `enforceAppCheck`
   en organisation/miljö i taget om möjligt, annars övervaka felfrekvensen i Cloud
   Functions-loggarna under det första dygnet efter enforcement och ha en snabb
   rollback-plan (`enforceAppCheck: false` + ny deploy) redo.

**Detta beslutsunderlag stänger INTE 12c-ii i sig** – det kräver fortfarande ägarens
konsolgranskning och uttryckliga ja. Ligger kvar som en beslutspunkt (se listan nedan), men
är nu en KONKRET fråga att ta ställning till istället för en odefinierad, tyst öppen punkt.

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
6. **Etapp 31c (App Check-enforcement):** logga in i Firebase-konsolen (Build → App Check →
   Metrics) och kontrollera att andelen giltiga tokens ligger på ≥ 98–99 % över minst en
   nyligen avslutad 1–2-veckorsperiod. Om ja: säg till, så sätter jag `enforceAppCheck: true`
   i `functions/index.js` (12c-ii) och lägger till ett test som bevisar att ett anrop utan
   giltigt App Check-token nekas (12c-iii). Se Etapp 31c ovan för fullständigt
   beslutsunderlag.

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
| 31 | Uppföljning på kodgranskning (CI-audit, e2e-svit, App Check-beslut) | Låg–medel | – Osynlig, drift/kvalitet |

**Snabbaste vägen till synlig effekt:** Etapp 22 + 23 tillsammans. De kräver inga beslut, rör
inga känsliga gränsdragningar, och skulle märkas av varenda användare första dagen efter
release.
