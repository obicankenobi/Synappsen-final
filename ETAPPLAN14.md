# Etapplan 14 – Fyra vardagsfunktioner med wow-faktor, inte snabbare svarstider

*Utkast 2026-08-13. Samtliga fyra delmål (65a–65d) är nu KLARA, byggda ett i taget samma dag
på ägarens uttryckliga begäran – se respektive delmål nedan för vad som genomfördes och
eventuella avvikelser mot ursprungsskisserna.*

**Bakgrund:** ägaren efterfrågade explicit nya funktioner som "vanliga" användare möter och
som ger en wow-känsla – inte prestandaförbättringar, inte administratörsverktyg. En genomgång
av faktisk kod (samtliga sidor, komponenter och hooks under `src/`) och samtliga tidigare
`ETAPPLANx.md`-filer togs fram innan förslagen skrevs, för att undvika att både återuppfinna
redan byggda funktioner och återföreslå redan avfärdade sådana. Se avsnittet "Vad jag INTE
föreslår, och varför" längst ner för de senare.

Fyra av åtta ursprungliga förslag valdes ut av ägaren för den här etappen: uppläsning,
"ändrat sedan du läste", synonymsökning och ett övningsläge. De två återstående (förgrenade
rutiner, översatt innehåll) är medvetet inte med här – båda korsar samma juridiska
gränsdragning som redan blockerar `ETAPPLAN13.md`, se motiveringen nedan.

---

## Etapp 65 – Fyra vardagsfunktioner

Fyra oberoende delmål, byggbara i valfri ordning och var för sig releasebara – ingen av dem
förutsätter någon av de andra.

### 65a – ✅ KLAR (2026-08-13) – Lyssna på rutinen (uppläsning)

**Idé:** en högtalarknapp på rutinkortet och i körvyn som läser upp texten via webbläsarens
inbyggda `speechSynthesis`. Tänkt användning: händerna är fulla eller handskade, telefonen
står på bänken.

**Varför inte samma invändning som röstsökning (23d, avfärdad):** 23d handlade om
`SpeechRecognition` – ljud SKICKAS FRÅN enheten till en tredje part (Google) för
igenkänning, vilket krockar med att patientuppgifter aldrig får lämna verksamheten.
`speechSynthesis` är motsatt riktning: appen skickar text TILL webbläsarens inbyggda
talsyntes, ingenting spelas in, ingenting lämnar enheten. Filtreras rösten på
`voice.localService === true` (SpeechSynthesisVoice-egenskap) används dessutom garanterat
en on-device-röst, inte en molntjänst. De två funktionerna delar bara ordet "röst" – inte
den egenskap som gjorde 23d till en integritetsfråga.

**Premisskontroll (krav 8):**
- `MarkdownInnehall.jsx` renderar `rutin.innehall` (Markdown) till sanerad HTML via
  `marked`+`DOMPurify`. Talsyntesen ska INTE läsa den renderade HTML:en (skulle läsa upp
  `**`/`#`/länk-URL:er högt) – den behöver en egen text-till-tal-sanering som körs på RÅ
  `rutin.innehall`, inte på DOM:en.
- `TILLGANGLIGHETSREDOGORELSE.md` SYN-6 dokumenterar redan att emoji i rubriker läses upp
  med sitt namn av skärmläsare ("eldsflamma" för 🔥) – samma problem gäller ordagrant här
  och måste lösas i samma saneringssteg, inte lämnas som en ny variant av en redan känd brist.
- `Korvy.jsx` har inget nuvarande ljudberoende utom den egna `spelaSignal()`
  (Web Audio-oscillator, ingen extern fil) – uppläsning läggs till som ett kompletterande,
  inte ersättande, ljudspår.

**Bygge:**
- Ny `src/utils/talText.js`: en ren funktion som tar rå Markdown-text och returnerar
  talbar text – tar bort Markdown-syntax (`#`, `**`, `-`, länk-syntax `[text](url)` → bara
  `text`), tar bort emoji (Unicode-intervall, ingen ny dependency), normaliserar
  whitespace. Testas med `talText.test.js` (samma mönster som `diff.test.js` m.fl.).
- Ny knapp (🔊) i `RutinKort.jsx`-headern, bredvid `FavoritKnapp`: `speechSynthesis.speak()`
  med svensk röst (`voice.lang.startsWith('sv')`, med tyst fallback till webbläsarens
  standardröst om ingen svensk röst finns installerad – vissa mobila webbläsare har ett
  begränsat röstbibliotek). Växlar till en stoppikon under uppspelning.
- Samma knapp i `Korvy.jsx`, kopplad till `aktivtSteg.text` – läser om automatiskt vid
  stegbyte om uppläsning redan var aktiv (så att man slipper trycka igen per steg).
- **Måste-fix, inte en detalj:** `speechSynthesis.cancel()` i en unmount-cleanup i båda
  komponenterna. Utan den fortsätter webbläsaren läsa högt över nästa sida om användaren
  navigerar bort medan uppläsningen pågår – ett konkret, lätt missat buggmönster med denna
  API:n.
- Ingen ny Firestore-collection, inget nytt fält, ingen regeländring, ingen
  feature-gating (Core – alltid tillgänglig, som resten av läsfunktionerna).

**Klart när:** en användare kan trycka 🔊 på valfri godkänd rutin och på valfritt
checklistesteg och höra texten läsas upp på svenska, utan att Markdown-syntax eller
emojinamn hörs, och utan att uppläsningen fortsätter efter att sidan lämnats.

**Genomfört (avvikelser från ursprungsplanen ovan, mindre justeringar vid byggstart):**
- Rösturvalet blev `voice.lang.toLowerCase().startsWith("sv")`, inte
  `voice.localService`. Skälet: `localService` filtrerar bort MOLNRÖSTER men säger inget om
  SPRÅK – att bara filtrera på den hade kunnat ge en engelsk on-device-röst istället för en
  svensk molnröst. `lang.startsWith("sv")` är den egenskap som faktiskt avgör om texten låter
  begriplig, och de flesta webbläsares svenska röster råkar ändå vara on-device redan.
- Talsynteslogiken lades i en delad hook, `src/hooks/useTalsyntes.js`, i stället för att
  upprepas i både `RutinKort.jsx` och `Korvy.jsx` – samma
  motivering som redan styr resten av kodbasen (`useSokindex.js`s egen kommentar om att
  undvika en parallell sökmotor).
- Körvyns "läser om automatiskt vid stegbyte" implementerades som ett eget
  `upplasningPa`-tillstånd i `Korvy.jsx` (skilt från hookens `laserUpp`, som bara speglar om
  ljud faktiskt spelas just nu) – annars hade uppläsningen tystnat vid varje stegbyte i
  stället för att fortsätta automatiskt på nästa steg.
- `speechSynthesis.cancel()`-städningen ligger på tre ställen, inte ett: hookens egen
  unmount-cleanup (täcker navigering bort från sidan), samt explicit i `Korvy.jsx`s
  `nastaSteg()` när checklistan avslutas (samma komponentinstans lever kvar in i
  "Klar"-vyn – ett unmount sker inte där, så cleanup-effekten hade missat det fallet).

**Testat:** `talText.js` har 8 enhetstester (Markdown-syntax, emoji, whitespace,
tomt/saknat innehåll). `npm run lint`, `npm run build`, `npx vitest run` (182/182) gröna.
Ingen ändring i `firestore.rules`/`storage.rules`/Cloud Functions, så `test:rules`/
`test:functions`/`test:storage` är inte relevanta för den här releasen. Manuell
webbläsarverifiering (talsyntes kräver riktiga röster, går inte att headless-testa
meningsfullt) rekommenderas innan nästa deploy, men är inte gjord i den här sessionen.

---

### 65b – ✅ KLAR (2026-08-13) – "Det här har ändrats sedan du läste den"

**Idé:** när en rutin du redan kvitterat har uppdaterats, visa EXAKT vilka stycken som
ändrats sedan din egen kvitteringstidpunkt – inte bara att den ändrats (det gör redan
Etapp 47b/"Sedan ditt förra pass"), utan VAD.

**Premisskontroll (krav 8) – två fynd, det första ändrar hela byggplanen till det bättre:**

1. **Diff-motorn finns redan, oanvänd för det här syftet.** `src/utils/diff.js` exporterar
   `diffRader(gammal, ny)` – radbaserad LCS-diff, redan byggd för `VersionsHistorik.jsx`
   och för förhandsgranskning av ändringsförslag. Den här etappen bygger INGEN ny
   diff-logik, bara ett nytt anropsställe.
2. **`firestore.rules` stänger idag ute exakt den användargrupp funktionen är till för.**
   `rutiner/{rutinId}/versioner/{versionId}` (rad 537–543) har:
   ```
   allow read, create: if farRedigeraOmrade(...) && matcharMinOrg(...);
   ```
   `farRedigeraOmrade` är redaktörsbehörighet. En vanlig medarbetare (den här funktionens
   hela målgrupp) kan alltså i dagsläget INTE läsa versionshistoriken över huvud taget.
   **Genuin, nödvändig regeländring:** läsrätten måste vidgas till samma krets som redan får
   läsa den LIVE rutinen (`matcharMinOrg`, utan redaktörskravet) – `create` förblir
   redaktörsbara, eftersom bara `uppdateraRutin()` skriver dit. Historiska
   rutinversioner är inte känsligare än den aktuella versionen av samma rutin (samma
   innehåll, bara en äldre tidsstämpel), så vidgningen utökar ingen exponering i sak –
   den rättar en behörighet som råkat bli snävare än vad funktionen (och innehållet i sig)
   kräver. Kräver en ny rad i `tests/rules/` som verifierar att en icke-redaktör NU kan läsa,
   men fortfarande inte skriva, `versioner`.

**Algoritm (klientsidig, ingen ny Cloud Function):**
1. Hämta användarens egen kvitteringstidpunkt: `rutin.lasteAv.find(l => l.uid === uid).tidpunkt`.
2. Fråga `versioner`, ordnad `sparadVersionTidpunkt` stigande, hitta den FÖRSTA posten vars
   `sparadVersionTidpunkt` är senare än kvitteringstidpunkten. Den posten är en ögonblicksbild
   av innehållet precis SOM DET SÅG UT vid kvitteringstillfället (`versioner` sparas som en
   ögonblicksbild TAGEN NÄR en redigering skrev över den – se `useRutiner.js`
   `uppdateraRutin()`), eftersom ingen redigering hann ske mellan kvitteringen och den posten.
3. Diffa den postens `innehall` mot `rutin.innehall` (nuvarande) med befintlig `diffRader()`.
4. Finns ingen sådan post: inget har ändrats sedan kvitteringen, visa ingenting.

**Undvik N+1-frågor – återanvänd 47b:s redan etablerade signal:**
En lista med dussintals rutinkort får INTE göra en `versioner`-fråga per kort bara för att
avgöra om en badge ska visas – det är exakt den sortens onödiga frågevolym `ETAPPLAN12.md`
byggdes för att undvika. Lösningen är att återanvända fältet `senasteVasentligaAndring`
(redan laddat på varje rutinobjekt, redan satt av `Sektionssida.jsx` vid en uttryckligen
markerad "väsentlig ändring", redan detta projekts etablerade signal för "värt att lyfta fram
för läsaren" sedan 47b). Badge-synligheten kräver alltså INGEN ny fråga: jämför
`senasteVasentligaAndring > minKvitteringstidpunkt`, rent klientberäkning på redan laddad
data. Den faktiska `versioner`-frågan (steg 2 ovan) görs bara EN gång, on-demand, när
användaren uttryckligen expanderar "Visa vad som ändrats" på just det kortet.

**Bygge:**
- `firestore.rules`: vidga `versioner`s `read` enligt ovan + regeltest.
- `RutinKort.jsx`: ny badge "Uppdaterad sedan du läste den" (samma badge-stil som befintliga
  "Bör granskas"/"Källan har uppdaterats"), synlig när `jagHarLast && senasteVasentligaAndring
  > minTidpunkt`. Klick expanderar en diffvy – återanvänder `DiffVy.jsx` (samma komponent
  `VersionsHistorik.jsx` redan använder för att visa `diffRader()`-resultat).
- Ny liten hook, t.ex. `useRutinDiffSedanLast(rutinId, minTidpunkt)`, on-demand `getDocs`
  (inte en `onSnapshot`-prenumeration – det här är en engångsuppslagning användaren själv
  utlöser, ingen anledning till en ständig lyssnare).

**Klart när:** en medarbetare som kvitterade en rutin i mars och öppnar den idag, efter en
väsentlig ändring i maj, ser exakt vilka rader som lagts till/tagits bort sedan mars – utan
att behöva läsa om hela rutinen för att hitta det.

**Genomfört:**
- `firestore.rules`: ny funktion `farLasaVersioner(rutinId)` (en `let`-bindning, ett enda
  `get()`-anrop mot föräldradokumentet, samma budget-medvetna mönster som `farUppdateraRutin()`
  redan använder) speglar den LIVE rutinens egen läsregel exakt – org-matchning OCH
  (godkänd-status ELLER redigeringsrätt ELLER en aktiv supportsession). `create` oförändrat
  redaktörsbart. Ny testfil `tests/rules/versionerlasratt.test.mjs` (7 tester, alla gröna):
  bekräftar att en vanlig medarbetare nu kommer in på en GODKÄND rutins historik men
  fortfarande INTE på en UTKAST-rutins, att redaktörers och organisationsisoleringens
  beteende är oförändrat, och att `create` fortfarande är stängt för icke-redaktörer.
- `src/utils/rutinHjalp.js`: ny `andradSedanLasning(rutin, minKvitteringTidpunkt)` – ren
  klientjämförelse av `senasteVasentligaAndring` mot användarens egen `lasteAv`-tidsstämpel,
  ingen ny Firestore-fråga för badge-synligheten (4 nya enhetstester).
- `src/hooks/useRutinDiffSedanLast.js`: on-demand `getDocs`-fråga (`where sparadVersionTidpunkt
  > minTidpunkt, orderBy asc, limit(1)`) som hittar exakt den versionspost som motsvarar
  innehållet vid läsningstillfället, och diffar den mot `rutin.innehall` med den redan
  befintliga `diffRader()` – ingen ny diff-logik skrevs, precis som planerat.
- `src/components/RutinKort.jsx`: ny klickbar badge "Uppdaterad sedan du läste den" (samma
  varning-stil som "Bör granskas"/"Källan har uppdaterats"), expanderar en `DiffVy`-panel
  (samma delade komponent `VersionsHistorik.jsx` redan använder) vid första klick, cachar
  resultatet så efterföljande toggle inte gör om frågan.

**Testat:** 4 nya enhetstester (`rutinHjalp.test.js`) + 7 nya regeltester
(`versionerlasratt.test.mjs`, körda mot Firestore-emulatorn, alla gröna). `npm run lint`,
`npm run build`, `npx vitest run` (186/186) och `npm run test:rules` (samtliga svit-filer,
inklusive den nya) gröna. Ingen ändring i `storage.rules`/Cloud Functions. Manuell
webbläsarverifiering av den fulla flödet (kvittera → vänta på en väsentlig ändring → se
badgen → expandera diffen) är inte gjord i den här sessionen.

---

### 65c – ✅ KLAR (2026-08-13) – Sökningen som förstår vårdens synonymer

**Idé:** `useSokindex.js`s Fuse.js-konfiguration (`threshold: 0.4`) klarar felstavningar men
inte synonymer – "PVK" och "perifer venkateter" är för Fuse.js två helt olika ord, inte en
förväxlingsbar stavning av samma ord. En sökning på det ena hittar inte innehåll skrivet med
det andra.

**Premisskontroll (krav 8):** `rutinposter`s `nyckelord` i `useSokindex.js` byggs idag som
`(r.innehall ?? "").split(/\s+/).slice(0, 60)` – rå ordlista ur innehållet, ingen
normalisering eller synonymexpansion sker någonstans i indexeringen idag.

**Bygge (global, released i sin helhet i 65c):**
- Ny `src/data/synonymer.js`: en kurerad lista med synonymgrupper,
  `[["pvk", "venflon", "perifer venkateter"], ["kad", "kateter", "kad-a-vue", ...], ...]` –
  en första svensk akutvårdsvokabular, utökningsbar utan kodändring (bara lägga till en rad).
- Ny `src/utils/synonymer.js`, testad (`synonymer.test.js`): en ren funktion
  `expanderaNyckelord(nyckelord, innehall)` som, för varje synonymgrupp där NÅGOT ord i
  gruppen förekommer i `innehall`, lägger till HELA gruppens övriga ord i `nyckelord`-listan.
  Ren indexeringstidsberäkning, `O(antal grupper × innehållslängd)`, körs en gång per
  `useMemo`-omberäkning i `useSokindex.js` – ingen ny Firestore-fråga, ingen serverkomponent.
- `useSokindex.js`: anropa `expanderaNyckelord` när `rutinposter`/`forradsposter` byggs.

**Medvetet AVGRÄNSAT ur 65c, en möjlig 65c-ii senare:** organisationsspecifika synonymer
(en klinik har egna interna förkortningar) skulle kräva en ny datamodell, admin-UI och
regeltester – en betydligt större etapp än en statisk ordlista. Bygg den globala listan
först och se om den räcker, samma "bygg inte i mörker innan det finns verklig efterfrågan"-
princip som redan styr `ETAPPLAN12.md`s hållning till fler mätvärden.

**Klart när:** en sökning på "PVK" hittar en rutin vars text bara innehåller "perifer
venkateter", och vice versa, för samtliga ordpar i den initiala listan.

**Genomfört:**
- `src/data/synonymer.js`: 17 synonymgrupper – allmänna kliniska förkortningar/termer
  (PVK/venflon, KAD/foley-kateter, EKG, BT, saturation, HLR, defib, intubation m.fl.).
  Medvetet INGA namngivna varumärkesskyddade instrument, för att inte röra vid samma
  gränsdragning som `ETAPPLAN13.md` genomgående krav 27 flaggar för Etapp 64.
- `src/utils/synonymer.js`: `expanderaNyckelord(nyckelord, innehall)`, exakt som planerat –
  ren funktion, muterar inte sina argument, 7 enhetstester.
- `useSokindex.js`: anropas för både `rutinposter` (mot `r.innehall`) OCH `forradsposter`
  (mot `a.namn`, artikelns namn – motsvarande en rutins innehåll för en förrådsartikel, ett
  litet tillägg utöver planens ursprungliga text eftersom samma nytta – "PVK" hittar en
  artikel som heter "Venflon" – gäller lika mycket i förrådet som i kliniskt stöd).

**Testat:** 7 nya enhetstester (`synonymer.test.js`). `npm run lint`, `npm run build`,
`npx vitest run` (193/193) gröna. Ingen ändring i `firestore.rules`/`storage.rules`/Cloud
Functions – statisk klientsidig datafil, ingen ny fråga. Manuell verifiering i en riktig
sökning (att "PVK" faktiskt ger träff på en rutin som bara skriver "perifer venkateter") är
inte gjord i den här sessionen.

---

### 65d – ✅ KLAR (2026-08-13) – Öva-läge

**Idé:** ett kort övningspass – ett scenario i taget, en fråga ur en relevant rutins
`kviss`-bank, svara och få veta om det var rätt. Skiljer sig från kvissen (testar EN redan
öppnad rutin vid kvittering) och veckans repetition (EN fråga i veckan) genom att träna
själva sökandet/igenkänningen över flera rutiner i ett sammanhängande pass, initierat av
användaren själv – inte bundet till en kvittering eller en kalendervecka.

**Premisskontroll (krav 8):**
- Frågeformatet finns redan och återanvänds oförändrat: `rutin.kviss[]` =
  `{ fraga, alternativ[], rattIndex, hanvisning }`, redigerat i `RutinFormular.jsx`,
  renderat i `KvissModal.jsx`.
- **Krav 14 gäller oförändrat och måste upprepas explicit här:** ingen historik över svar
  (rätt eller fel) sparas NÅGONSTANS – varken i Firestore eller i `localStorage`. Samma
  princip som redan gäller `KvissModal.jsx` och `veckansRepetition.js`
  ("Syftet är förståelse, inte betyg").
- Kandidaturvalslogiken i `valjVeckansFraga()` (godkänd, ej arkiverad, `kviss.length > 0`)
  är exakt samma filter ett övningspass behöver, bara utan veckans-stabila hash-urval –
  ett pass slumpar N frågor ur ALLA kvalificerande rutiner (valfritt filtrerat på område)
  i stället för att peka ut en enda stabil fråga.

**Uttrycklig avgränsning (måste hållas, inte en implementationsdetalj):** INGA poäng över
tid, INGA streaks, INGEN topplista, INGET resultat synligt för någon chef eller
sektionsledare. `ETAPPLAN12.md`s "Vad jag INTE föreslår"-tabell avfärdade redan
"Poäng, märken och topplistor mellan medarbetare" med motiveringen att det i vården snabbt
läses som övervakning och rangordning – den bedömningen gäller ordagrant här. Öva-läget är
ett verktyg för den enskilde, inte ett mätvärde för någon annan. Byggs det med den gränsen
kvar är det en träningsfunktion; byggs den bort är det gamification under ett annat namn.

**Bygge:**
- Ny sida, t.ex. `/ova` (och valfritt `/ova/:omrade`), ny lazy route i `App.jsx`.
- Ett litet urvalssteg (välj område, eller "blandat") följt av N (t.ex. 8) slumpade frågor,
  en i taget, samma enkla radioknapp+facit-mönster som `KvissModal.jsx` redan har. Avgörs vid
  byggstart om UI:t delas som en gemensam presentationskomponent med `KvissModal.jsx` eller
  hålls separat – `KvissModal.jsx` är idag tätt kopplad till "kvittera EN rutin"-flödet
  (`onKlar`/`onAvbryt` mot `RutinKort.jsx`), så en ren delning kan kräva en liten
  omstrukturering; ingen absolut förutsättning för att bygget ska kunna starta.
- Sökbar åtgärd i `useSokindex.js`s `STATISKA_ATGARDER` (samma mönster som "Öppna akutläget"
  m.fl.), plus en post i `MerMeny.jsx`.
- Ingen ny Firestore-collection, inget nytt fält, ingen feature-gating (Core).

**Klart när:** en användare kan starta ett övningspass, svara på ett antal slumpade frågor
ur flera olika rutiner i följd, och lämna passet utan att något resultat sparats eller blivit
synligt för någon annan.

**Genomfört (avvikelser/tillägg mot ursprungsplanen):**
- `useAllaGodkandaRutiner()` (redan byggd för Etapp 19c:s kompetensmatris) återanvändes
  istället för att kombinera två `useRutiner("kliniskt-stod")`/`useRutiner("administration")`-
  anrop – frågan filtrerar redan server-side på `status == "godkand"` över ALLA områden i ett
  enda anrop, vilket är precis vad ett övningspass behöver och är billigare än planens
  ursprungliga skiss.
- Ny testad hjälpmodul `src/utils/ovaLage.js` (`byggFragepool`, `slumpaFragor`, 11
  enhetstester) i stället för att lägga logiken direkt i sidkomponenten – matchar mönstret
  från `veckansRepetition.js`s `valjVeckansFraga()`.
- UI:t hölls MEDVETET separat från `KvissModal.jsx` snarare än att dela en komponent (den
  öppna frågan i planen) – `KvissModal` är en modal tätt kopplad till "kvittera EN rutin"-
  flödet (`onKlar`/`onAvbryt` mot `RutinKort.jsx`), medan öva-läget är en egen sida med ett
  eget flöde (områdesval → frågeserie → klar). Duplicerar en liten mängd radioknapp-JSX,
  men undviker att göra `KvissModal` generisk för ett användningsfall den inte är byggd för.
- **Ett medvetet strängare val än planens bokstav:** ingen sammanfattning ("X av Y rätt")
  visas ens vid passets slut, trots att planens "Klart när"-kriterium bara förbjöd att
  SPARA/DELA ett resultat. Bedömning: även en aldrig sparad, aldrig delad siffra riskerar
  att LÄSAS som ett betyg av användaren själv, vilket underminerar samma "förståelse, inte
  betyg"-princip `KvissModal.jsx` och `veckansRepetition.js` redan vilar på. Slutskärmen
  visar bara "Bra jobbat" och en genväg att öva igen eller gå hem.
- Ny sökbar åtgärd ("Öva") i `useSokindex.js`s `STATISKA_ATGARDER`, samt en post i
  `BottomNav.jsx`s "Mer"-meny, exakt som planerat.

**Testat:** 11 nya enhetstester (`ovaLage.test.js`). `npm run lint`, `npm run build`
(ny lazy chunk `OvaLage-*.js` bekräftad – laddas bara för den som faktiskt öppnar sidan),
`npx vitest run` (204/204) gröna. Ingen ändring i `firestore.rules`/`storage.rules`/Cloud
Functions – ingen ny collection, inget nytt fält, ren klientlogik ovanpå redan existerande
data. Manuell webbläsarverifiering av det fulla flödet (starta pass → svara → nästa fråga →
klart-skärm) är inte gjord i den här sessionen.

---

## Vad jag INTE föreslår, och varför

Samma avsnitt som `ETAPPLAN11.md`/`ETAPPLAN12.md` har, av samma skäl: så att en framtida
session inte föreslår dem igen utan att känna till invändningen. De här två ingick i det
ursprungliga åttadelade förslaget men valdes uttryckligen bort av ägaren för den här etappen.

- **Förgrenad rutin i körvyn** ("om vaken → steg 7, annars → steg 4"). Skillnaden mot
  dagens linjära körvy är inte kosmetisk: en checklista som VISAR vad som står i rutinen är
  något annat än en checklista som VÄLJER åtgärd åt användaren baserat på patientens
  tillstånd. Det senare är precis den gränsdragning `JURIDISK-GRANSKNING.md` §6 beskriver
  (kvalificering som medicinteknisk programvara enligt MDR) – ett omdömesutövande system
  drar kraftigt mot kvalificering på ett sätt en linjär checklista inte gör. Vänta tills
  Etapp 64:s juridiska bedömning är klar, och lägg till den här frågan i samma uppdrag
  (se `JURIDISK-GRANSKNING.md` §18) snarare än att beställa en andra bedömning senare.
- **Maskinöversatt rutininnehåll.** `ETAPPLAN12.md` konstaterar redan att det verkliga
  språkproblemet sitter i rutininnehållet, inte i gränssnittstexten – att bygga det är alltså
  inte i sig en ny invändning. Den nya invändningen är att en FELÖVERSATT klinisk rutin är
  ett konkret sätt att skada någon, och att `ETAPPLAN4.md` redan avrådde från fler AI-ytor
  mot personalen ("Personlig AI-assistent i appen") tills klinikstödet visat sig stabilt.
  Samma försiktighet gäller maskinöversättning av kliniskt innehåll. Om det ska byggas: som
  en egen, senare etapp, aldrig i kliniskt stöd eller akutläget, och med en jurist inkopplad
  innan något visas för en användare.

---

## Sammanfattning

| Delmål | Vad | Ny regeländring? | Ny datamodell? | Wow | Status |
|---|---|---|---|---|---|
| 65a | Lyssna på rutinen (talsyntes) | Nej | Nej | ⭐⭐⭐ | ✅ KLAR 2026-08-13 (v5.99.0) |
| 65b | Ändrat sedan du läste (diff mot egen kvittering) | **Ja** (`versioner`-läsrätt vidgas) | Nej | ⭐⭐⭐ | ✅ KLAR 2026-08-13 (v5.100.0) |
| 65c | Synonymsökning (vårdens vokabulär) | Nej | Nej (statisk datafil) | ⭐⭐ | ✅ KLAR 2026-08-13 (v5.101.0) |
| 65d | Öva-läge (flera rutiner, ett pass) | Nej | Nej | ⭐⭐⭐ | ✅ KLAR 2026-08-13 (v5.102.0) |

Alla fyra är Core-funktionalitet (ingen feature-gating), byggbara oberoende av varandra och
oberoende av `ETAPPLAN13.md`s juridiska blockering.
