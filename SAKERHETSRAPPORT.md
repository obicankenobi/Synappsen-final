# Synappsen – Rapport: funktionsöversikt och säkerhetsgenomgång

**Datum:** 2026-07-14 (ursprunglig genomgång), **omskriven mot verkligheten 2026-08-01**
**Version vid ursprunglig genomgång:** 5.4.1 · **Version vid omskrivning:** 5.55.0
**Omfattning:** Hela kodbasen (Firestore-regler, Storage-regler, Cloud Functions, samtliga
React-sidor/komponenter/hooks).

> **Läsanvisning (2026-08-01):** den här rapporten låg 51 releaser efter faktisk kodstatus när
> den skrevs om – exakt det mönster `CLAUDE.md` varnar för (samma sak hände `FRAMTIDSPLAN.md`
> och `MODULPLAN.md`). Del 1 och Del 2 nedan är i huvudsak oförändrade från originalgenomgången
> (2026-07-14) förutom två faktafel som rättats där de stod (klinikstöd-sökningens status,
> PII-filtrets omfattning). **Del 3 är helt ny** och sammanfattar säkerhetsarbetet i Etapp 32–35
> (`ETAPPLAN5.md`), som är den del av kodbasen som förändrats mest sedan originalgenomgången.
> Se `ETAPPLAN5.md` för fullständiga tekniska detaljer per delmål.

Denna rapport har två delar:

1. En sammanfattning av **allt som är implementerat i Synappsen hittills** (version 1.0.0 →
   5.4.1).
2. Resultatet av en **fullständig säkerhets- och buggenomgång** av hela kodbasen, med vad som
   åtgärdades och vad som medvetet lämnas kvar som en känd, dokumenterad begränsning.

Detaljerad teknisk logg per fas finns i `UTVECKLINGSLOGG.md`. Den här rapporten är en kondenserad
helhetsbild.

---

## Del 1 – Vad Synappsen gör idag

Synappsen är en installerbar webbapp (PWA) för en akutmottagning, byggd med React + Firebase.
Den samlar rutiner, förrådsinformation, kontakter och driftinformation på ett ställe, med
rollstyrd behörighet och flera lager av kvalitets- och säkerhetskontroller.

### Kärnfunktioner

- **Tre huvudsektioner:** Kliniskt stöd, Logistik (sex namngivna förråd) och Administration,
  med sökbara rutiner och förrådsartiklar.
- **AI-tolkning (Gemini):** foto på en whiteboard/anteckning/inventarielista skapar automatiskt
  ett utkast till rutin respektive förrådsartikel. Utkast måste alltid granskas och godkännas av
  en redaktör innan de publiceras. En budget (kronor/månad, både globalt och per användare)
  begränsar kostnaden.
- **Klinikstöd-sökning:** en fråga om t.ex. ett sjukdomstillstånd besvaras med källhänvisning
  från godkända medicinska källor (internetmedicin.se, 1177.se, Nationella kliniska
  kunskapsstödet, FASS vårdpersonal, Läkemedelsverket m.fl.). **Rättelse (2026-08-01): denna
  funktion är INTE längre pausad** – texten nedan om pausningen (2026-07-14) är historiskt
  korrekt för sin tid men gällde inte längre redan då rapporten skrevs om. Funktionen är i
  drift, med en daglig automatisk verifiering (se `verifieraKlinikstodSchemalagt` i
  `functions/index.js`) som larmar om en källa skulle börja svara utanför den godkända listan
  igen – exakt den typen av regression den ursprungliga pausningen inte hade skydd mot.
- **Rollstyrd behörighet:** superadmin, vol, sektionsledare, VEC, förrådsansvarig, personal –
  varje roll har ett tydligt avgränsat redigeringsområde, kontrollerat både i gränssnittet och
  (avgörande) i Firestore-reglerna.

### Samarbete och kommunikation

- Anslagstavla med prioritet ("Viktigt"), fastnålning, utgångsdatum och läskvittering.
- Kommentarer (trådade) på rutiner, med @omnämnanden som ger notiser.
- Skiftrapport för praktisk drift-info mellan skift (t.ex. "vattenläcka i taket") – **aldrig
  patientinformation**, se säkerhetsavsnittet.
- Feedback-funktion med status (ny/under utredning/åtgärdad/avvisad) och svar från superadmin.
- In-app notisflöde, notisklocka med tangentbordsnavigering.
- Kontaktlista med telefonnummer som **ren text, ingen ring-funktion**.
- Länkbibliotek för externa/interna resurser.

### Kvalitet och spårbarhet

- Läskvittering på rutiner och anslag, med påminnelse om vilka som INTE läst än.
- Versionshistorik med visuell diff, återställning av tidigare version.
- Granskad-av-signatur, revideringsdatum och "granska igen"-flagga.
- Privata anteckningar (bara ägaren ser sina egna).
- Papperskorg – borttaget innehåll kan återställas.
- Sökbar/filtrerbar ändringslogg (audit trail) i adminpanelen.
- Bulk-taggning och bulk-godkänn/neka.
- Statistik i adminpanelen: mest aktiva användare, mest kvitterade rutiner, sökningar utan
  träffar (även som trend över tid), områdesscopad statistik för sektionsledare/VEC/
  förrådsansvarig, systemstatus-översikt.

### Personlig anpassning och tillgänglighet

- Mörkt läge (ljust/mörkt/följ system).
- Egna genvägar på startsidan, favoriter, "Mina uppgifter"-widget.
- Tangentbordsnavigering i notisklocka/dropdowns, "/"-genväg till sökfältet.
- Förbättrad kontrast, enhetlig visuell design.

### Säkerhet och drift

- E-post/lösenord-inloggning med valfri tvåfaktorsautentisering (TOTP).
- Automatisk utloggning vid inaktivitet, med konfigurerbar tid och förvarning.
- Force-logout: superadmin kan omedelbart återkalla en användares session.
- Offline-cachning (fungerar vid dåligt nät) med tydlig banner när anslutningen tappas.
- PII-filter: hård spärr mot personnummer, varning vid misstänkt namn – i formulär och i
  AI-tolkningen (se säkerhetsavsnittet för fullständiga detaljer och kvarvarande begränsning).
- Dubblettvarning vid skapande av kontakt/länk med samma namn som en befintlig.

### Pausad funktion

Klinikstöd-sökningen byggdes, testades och släpptes i flera iterationer (5.3.0–5.3.4), men
visade sig – trots upprepade fixar av modell/verktygsval, källvalidering och
redirect-upplösning – fortfarande kunna citera källor utanför den godkända listan i vissa fall.
Istället för att fortsätta lappa en lösning med osäker tillförlitlighet togs det medvetna
beslutet att **pausa funktionen** (v5.3.5) tills en mer robust lösning (t.ex. en riktig
domänbegränsad sökmotor via extern infrastruktur) kan byggas. All kod finns kvar och kan
återaktiveras.

---

## Del 2 – Säkerhets- och buggenomgång (denna rapport)

### Metod

- Fullständig manuell genomläsning av `firestore.rules` och `storage.rules`.
- Fullständig genomläsning av `functions/index.js` (alla Cloud Functions).
- Grep-genomsökning av hela `src/`-katalogen efter kända riskmönster: `dangerouslySetInnerHTML`,
  `eval`, `innerHTML=`, `document.write`, `tel:`-länkar, hårdkodade API-nycklar, känslig
  `console.log`.
- Riktad genomgång av varje `href`/`src`-bindning i JSX mot dess datakälla, för att avgöra om
  användarstyrd data kunde nå en länk osanerad.
- En bred genomgång av samtliga filer under `src/hooks`, `src/pages`, `src/components`,
  `src/utils` och `src/firebase` som inte redan omfattades av tidigare säkerhetsgenomgångar.

### Åtgärdat i denna genomgång

| # | Fynd | Fil | Åtgärd |
|---|------|-----|--------|
| 1 | Lagrad självriktad XSS: en sparad länk kunde innehålla ett `javascript:`-URI eftersom `<input type="url">`s inbyggda validering inte tillförlitligt blockerar det | `src/components/LankFormular.jsx`, `src/pages/Lankbibliotek.jsx` | Explicit kontroll att URL:en börjar med `http://`/`https://`, både innan sparning och innan den renderas som klickbar länk |
| 2 | Klinikstöd-sökningens Cloud Function saknade budgetspärr – kunde i teorin anropas direkt, obegränsat antal gånger, förbi den pausade knappen i gränssnittet | `functions/index.js` (`fragaKlinisktStod`) | Samma `reserveraBudget()`-spärr som de två andra Gemini-anropande funktionerna |
| 3 | Anslagstavlan (meddelanden till ALL personal) saknade helt patientuppgiftskontroll, till skillnad från alla andra fritextytor i appen | `src/components/AnslagFormular.jsx` | Samma `kontrolleraPatientuppgifter()`-kontroll som redan fanns i Skiftrapport/Kommentarer/Rutiner/Anteckningar/Feedback |

Samtliga tre är verifierade med grönt `npm run build`, `npm run lint` och `node -c
functions/index.js`.

### Granskat och redan säkert (inga ändringar behövdes)

- `MarkdownInnehall.jsx` – enda användningen av `dangerouslySetInnerHTML`, alltid föregången av
  `DOMPurify.sanitize()`.
- Länkar i `KlinikfragaSok.jsx` och `RutinKort.jsx` – kommer från server-validerad respektive
  Firebase Storage-genererad URL, aldrig direkt från användarinmatning.
- Kontaktlistan renderar telefonnummer som text, ingen `tel:`-länk – uppfyller kravet.
- Samtliga CRUD-hooks litar aldrig på klientens egen uppfattning om roll/ägarskap för
  auktorisering – Firestore-reglerna är den faktiska spärren i varje enskilt fall.
- Ingen `eval`, `innerHTML=`, hårdkodad hemlighet, eller känslig data i `console.log`/
  `localStorage` hittades någonstans i kodbasen.

### Kvarvarande, medvetet accepterade begränsningar

Dessa är kända och bedöms, men är arkitekturbeslut som bör tas av verksamheten – de har därför
**inte** ändrats i denna genomgång:

1. **PII-filtret för direkta Firestore-skrivningar – DELVIS ÅTGÄRDAT sedan originalgenomgången
   (Etapp 12e, rättat här 2026-08-01).** Ursprungligen (2026-07-14) var kontrollen enbart
   klientsidig för rutiner/kommentarer/skiftrapport/anteckningar/feedback/anslag. Sedan Etapp
   12e finns en regelnivåspärr (`harTroligtPersonnummer()`, 45 förekomster i
   `firestore.rules`) som blockerar text som ser ut som ett giltigt personnummer/
   samordningsnummer på de flesta skrivvägar – det här är alltså inte längre bara en
   klientkontroll en inloggad angripare kunde kringgå genom att prata direkt med
   Firestore-API:et. **Kvarvarande, mindre begränsning:** regelspråket kan inte replikera den
   fulla Luhn-checksumman (ingen sträng→tal-konvertering per tecken i Firestore-regler) – den
   fångar text som ser ut som ett giltigt datum + 4 siffror, inte en fullständig
   checksumkontroll. En text som råkar se ut som ett personnummer men inte är ett skulle alltså
   kunna nekas i onödan (falskt positivt), snarare än att ett riktigt personnummer slinker
   igenom.
2. Rå, ej AI-tolkad bild i `inkommande/{uid}/` kan läsas av vem som helst med en icke-
   "personal"-roll, inte bara den som laddade upp den – avsiktlig design för
   granskningsarbetsflödet, men innebär att PII-skanningen (som bara körs på extraherad text,
   aldrig på själva bilden) inte skyddar mot att en annan redaktör ser bilden innan tolkning.
3. `omnamnda`-fältet på en kommentar kan i teorin sättas till godtyckliga användar-ID:n av
   skaparen, utan validering mot texten – ger i värsta fall en missvisande @omnämnande-notis,
   exponerar ingen data.
4. **Rättat (2026-08-01):** `ForradArtikelFormular.jsx` saknade tidigare klientsidig
   patientuppgiftskontroll, men `firestore.rules` skyddar numera fälten `namn`/`skap`/`hylla`
   på regelnivå (`harTroligtPersonnummer()`) vid både `create` och `update` av
   `forradsartiklar/{artikelId}` – samma serverbekräftelse som punkt 1 ovan. Kvarstår som en
   ren UX-fråga (ingen felmarkering direkt i formuläret), inte längre en säkerhetslucka.

### Sammanfattande bedömning

Ingen kritisk, direkt utnyttjningsbar sårbarhet (t.ex. IDOR mot annan användares data, förbikopp-
ling av rollbaserad åtkomst, XSS som drabbar andra användare utan interaktion) hittades i denna
genomgång. De tre åtgärdade punkterna var verkliga men begränsade i räckvidd (kräver antingen att
en användare klickar på en specifikt sparad skadlig länk, eller direkt anrop till en pausad
funktion, eller att anslagstavlan används felaktigt). Den kvarstående, mest relevanta punkten att
ta ställning till är #1 ovan – den klientsidiga PII-kontrollens begränsning – eftersom den rör
appens uttryckliga hårda krav om att aldrig lagra patientuppgifter.

---

## Tillägg (2026-07-27, version 5.33.0): Etapp 18 – checklistläge, regulatoriskt ställningstagande

Innan checklistläget ("kör rutinen", ETAPPLAN3.md Etapp 18) byggdes togs två uttryckliga
beslutspunkter upp med ägaren och godkändes enligt nedan.

### 1. MDR-gränsdragning (medicinteknisk programvara)

En funktion som ger stegvisa instruktioner kan börja glida mot att räknas som medicinteknisk
programvara enligt EU:s MDR, särskilt om den räknar ut doser eller föreslår kliniska beslut.
**Beslut:** första versionen håller sig strikt till att återge organisationens eget, redan
godkända rutininnehåll i en annan layout (ett steg i taget) – ingen beräkning, ingen
rekommendation, inget innehåll som inte redan står i den godkända rutinen.

Konkret i implementationen:
- Ett steg (`rutin.steg[i]`) är bara `{ text, bild, varning, timerSekunder }` – inget fält för
  dos, beräkning eller ett AI-genererat rekommenderat nästa steg.
- "Föreslå steg" (18b) låter Gemini dela upp en REDAN godkänd rutintext i stegförslag – aldrig
  skriva nytt kliniskt innehåll. Resultatet är alltid ett utkast (`kalla: "gemini"`) som måste
  granskas och godkännas av VÖL/superadmin precis som all annan AI-tolkning i appen (se Etapp 2).
  Auto-publicering sker aldrig.
- Doseringsberäkning är medvetet INTE byggt och är en separat framtida fråga som kräver
  juridiskt underlag innan den ens övervägs.

### 2. Journalföring

En logg över "vem körde vilken checklista på vilken patient" vore journalföring – en helt
annan regulatorisk värld (patientdatalagen, vårdgivaransvar). **Beslut:** användningsstatistiken
(18d) är aggregerad och utan personkoppling: antal påbörjade/slutförda körningar per rutin,
mediantid, vilket steg flest avbryter på. Ingen patientidentifierare, inget fritextfält kopplat
till en enskild körning finns någonstans i datamodellen.

---

## Tillägg (2026-07-28, version 5.39.0): Etapp 21 – källbevakning, olöst frågetecken kring ToS

Källbevakningsjobbet (Etapp 21b, `kontrolleraKallbevakning` i `functions/index.js`) hämtar en
gång i veckan innehållet från de externa källor en rutin refererar (`rutiner.externaKallor`),
begränsat till samma sju domäner som klinikstöd-sökningen redan använder
(`GODKANDA_KALLDOMANER`). Implementationen respekterar `robots.txt` (enkel tolkning av
`Disallow`-mönster för `User-agent: *`), skickar ett tydligt `User-Agent`, sprider anropen med
en paus mellan varje hämtning, och cachar per URL över ALLA organisationer så samma sida aldrig
hämtas mer än en gång per körning oavsett antal kunder.

**Olöst, kräver ägarens ställningstagande innan modulen slås på för en riktig kund:** planen
(ETAPPLAN3.md Etapp 21b) påpekar uttryckligen att `robots.txt` inte är hela det juridiska svaret
– en sida kan tillåta hämtning enligt `robots.txt` men ändå förbjuda automatiserad skrapning i
sina användarvillkor. Den här implementationen har INTE haft en juridisk genomgång av
användarvillkoren för de sju källdomänerna (internetmedicin.se, 1177.se,
nationelltklinisktkunskapsstod.se, fass.se, lakemedelsverket.se, vardhandboken.se,
folkhalsomyndigheten.se). Modulen (`moduler.kallbevakning`) är avstängd som standard för alla
organisationer och måste aktiveras manuellt per kund i adminpanelen – så ingen skarp hämtning
sker förrän någon medvetet slår på den, men det ersätter inte en faktisk ToS-genomgång.
**Rekommendation:** en människa läser igenom respektive källas användarvillkor innan modulen
aktiveras för en betalande kund, och den genomgången dokumenteras här som ett eget tillägg.
**Fortfarande olöst 2026-08-01** – ingen ToS-genomgång har skett, se `ETAPPLAN5.md`
beslutspunkt 5.

---

## Del 3 – Säkerhetsarbetet i Etapp 32–35 (tillägg 2026-08-01, version 5.55.0)

Det här är den mest väsentliga förändringen sedan originalgenomgången: en hel etapplan
(`ETAPPLAN5.md`) byggd kring tre konkreta, verifierade fynd – ingen automatiserad detektion av
missbruk, ingen fungerande återställning från backup, och ett produktionsbygge som inte
garanterat matchade det som testats. Sammanfattning per delområde:

### Upptäcka (Etapp 32)

- **Nekade dataanrop rapporteras.** Ett `permission-denied` från en Firestore-lyssnare
  krascher inte React och syntes tidigare bara som en tyst konsolrad. Sedan Etapp 32a skapar
  det en Sentry-händelse (collection, roll, organisation, sökväg – aldrig dokumentinnehåll),
  kopplat in i samtliga 40 hooks med en `onSnapshot`-lyssnare.
- **Revisionsloggens allvarligaste lucka är täppt.** Rolländringar var tidigare en naken
  klient-skrivning utan spår – att göra någon till superadmin lämnade inga spår alls. Sedan
  Etapp 32c går rolländring, moduler på/av, 2FA-policy och AI-budgettak via egna Cloud
  Functions som loggar varje ändring, med `firestore.rules` stängd för de gamla, direkta
  klientvägarna (även med 2FA uppfyllt). Plattformsadmins tvärorganisatoriska
  översiktsanrop loggas likaså.
- **Hashkedjan kontrolleras utan att någon behöver komma ihåg det.** Sedan Etapp 32d körs
  integritetskontrollen (Etapp 14) automatiskt varje natt för ALLA organisationer, med larm
  vid en faktisk avvikelse – tidigare bara på begäran.
- **AI-budgetspikar larmar.** Sedan Etapp 32b (delvis) skickas en Sentry-händelse när en
  organisations budgetförbrukning passerar 80% av taket samma månad – tidigare stoppade
  budgetspärren bara tyst vid 100%, utan förvarning.
- **Känd, kvarstående lucka (bekräftad genom en skrivbordsövning, Etapp 34c):** ett konto som
  missbrukar behörighet det REDAN legitimt har (t.ex. läser ovanligt mycket inom sin egen
  organisation) lämnar fortfarande inga spår. Att stänga det helt kräver ett Sentry API-token
  och/eller GCP:s faktureringsexport till BigQuery – ett ägarbeslut, inte en kodfråga (se
  `ETAPPLAN5.md` beslutspunkt 6).

### Överleva (Etapp 33)

- **En återställningsfunktion finns nu, testad end-to-end.** `backupaOrganisation()` var
  tidigare enkelriktad – ingen väg tillbaka existerade. `aterstallOrganisationCallable`
  (plattformsadmin-only, med två oberoende skyddslager mot att skriva fel organisations data)
  bevisas fungera i CI (seed → backup → radera → återställ → verifiera identiskt, inklusive
  att Firestore-tidsstämplar återställs korrekt). Återställningstid uppmätt och skriven in i
  `avtal/IT-FAKTABLAD.md`.
- **Ägarbeslut och genomfört 2026-08-01:** retention på backuper = 90 dagar (se
  `ETAPPLAN5.md` Etapp 33c, `avtal/PUB-AVTAL-MALL.md` p. 6). Gallringslogiken
  (`gallraGamlaBackuper()` + `backupGallringSchemalagt`, körs varje måndag 03:30) är byggd
  och testad – 33c helt klar.

### Reagera (Etapp 34)

- Ett externt policydokument (`avtal/INCIDENTRESPONSPLAN.md`) och en internt-only operativ
  checklista (`INCIDENT-CHECKLISTA.md`) finns nu, med en formaliserad
  patientsäkerhetsprincip (en begränsningsåtgärd får aldrig med hög sannolikhet orsaka större
  skada än incidenten den avser att begränsa).
- En skrivbordsövning (Etapp 34c) mot ett realistiskt scenario avslöjade den kvarstående
  luckan som nämns ovan under "Upptäcka", och `avtal/DPIA-UNDERLAG.md` skrevs om mot samma
  verklighet.

### Härda (Etapp 35)

- `deploy.yml` kör numera `npm ci` (var `npm install`) – produktionsbygget är nu garanterat
  detsamma som CI faktiskt testade.
- `firebase.json` har säkerhetsheaders (`X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, en `Permissions-Policy` som bara tillåter kamera) och en CSP i
  rapporterande läge (`Content-Security-Policy-Report-Only`) – inte verkställande än,
  medvetet, tills en verifieringsperiod passerat.
- `storage.rules` begränsar nu filstorlek och innehållstyp per uppladdningsväg – tidigare
  fanns noll sådana begränsningar (en SVG/HTML-uppladdning hade varit den klassiska vägen
  till lagrad XSS från lagringsdomänen).
- Dependabot (`.github/dependabot.yml`) skickar nu veckovisa uppdaterings-PR:er istället för
  att bara rapportera samma sårbarhet varje vecka utan att någon agerar.
- En dokumenterad nyckelrotationsrutin finns i `INCIDENT-CHECKLISTA.md` för samtliga
  hemligheter (Gemini/sökmotor/tjänstekonto/VAPID). **Ägarbeslut 2026-08-01:** proaktiv
  rotation en gång per år, utöver den reaktiva rutinen, med en automatisk årlig påminnelse
  som ser till att den faktiskt sker.
- **Kvarstår:** App Check-enforcement (Etapp 35e) – konsolen granskad 2026-08-01, Firestore
  låg på 89% verifierat (mål ~98%), Storage-siffran (0/10) för litet underlag för att agera
  på. Se `ETAPPLAN5.md` Etapp 35e för de fullständiga mätvärdena och beslutspunkt 2 för
  uppföljningsplanen.

### Sammanfattande bedömning (Del 3)

Ingen av de tre ursprungliga fynden (ingen detektion, ingen fungerande återställning, otestat
produktionsbygge) kvarstår obehandlad. Den mest väsentliga öppna punkten är densamma som
skrivbordsövningen bekräftade: missbruk av redan legitim behörighet syns fortfarande inte
någonstans i systemet, och att stänga den luckan helt är ett ägarbeslut om extern
infrastruktur, inte ett kvarstående kodproblem.

---

## Tillägg (2026-08-04, version 5.75.0): Etapp 46 – incidentberedskap i produkten, säkerhetsgenomgång

**Ny collection `systemstatus/{id}`** (senaste läget för en automatisk bakgrundskontroll,
just nu bara `revisionskedja`) – har egna regeltester (`tests/rules/systemstatus.test.mjs`,
6 tester): läsbar endast för superadmin, skrivbar av ingen klient, samma mönster som redan
etablerade `systemvarningar`. Skrivs bara av Cloud Function (`verifieraRevisionskedjor`).

**Ny callable `hamtaBackupstatus`** – listar en organisations backupfiler i Storage via
Admin SDK (klienten har ingen egen läsrätt till `backups/`, se `storage.rules`, oförändrat).
Återanvänder befintlig auth-upplösning (`kravLasningAvRevisionslogg`): superadmin i egen
organisation, eller plattformsadmin med ett angivet `organisationId`. 4 nya functions-tester
bevisar att en icke-superadmin nekas, och att en organisations backupstatus aldrig blandas
med en annans (seedade filer för två organisationer, verifierat att rätt organisations
senaste datum returneras).

**Ny loggpunkt (`systemstatus/revisionskedja`) läcker ingen personuppgift eller
dokumentinnehåll** – bara organisations-ID:n och den redan existerande maskinella
orsakstexten (t.ex. "kedjan bruten"), identiskt med vad `systemvarningar` redan skickade till
Sentry. Ingen ny PII-yta.

**Ingen ny uppladdningsväg** i den här etappen (inget att bedöma mot storage.rules storlek/
innehållstyp).

**npm-audit/Dependabot** – inte en del av den här etappens omfattning, senaste bedömning
oförändrad sedan tidigare tillägg.

Se `ETAPPLAN8.md` Etapp 46 för den fullständiga premisskontrollen – bland annat att "App
Check-verifieringsgrad" och "misslyckade inloggningsförsök i realtid" (två av tre saker den
ursprungliga idén nämnde) INTE byggdes: den förra har ingen programmatisk API-väg via
Firebase Admin SDK, den senare är redan dokumenterat blockerad på ett ägarbeslut (Etapp 32b).

---

## Tillägg (2026-08-09, version 5.83.0): Etapp 50b – tillfällig, kundinitierad supportåtkomst

**Nytt regelmönster i `firestore.rules`: `supportAtkomstAktiv(orgId)`/`farSupportlasa(orgId)`.**
Det enda stället i hela regelfilen där en plattformsadmin (leverantören) får läsa en
organisations INNEHÅLL (`rutiner`/`forradsartiklar`/`anslag`/`kontakter`), inte bara
`organisationer/{orgId}` självt (som redan var läsbart för plattformsadmin sedan Etapp 6a).
Gated på `organisationer/{orgId}.supportAtkomstTill` (en `request.time`-jämförelse,
fail-closed om fältet saknas), skrivbart ENDAST via `beviljaSupportAtkomst`/
`avslutaSupportAtkomst` (Admin SDK) – blockerat för direkt klientskrivning i
`organisationer/{orgId}`s write-regel (samma mönster som redan gäller `moduler`/`sakerhet`/
raderingsfälten). Nekar dessutom om organisationen är pausad, trots ett i övrigt aktivt
fönster. 7 isolerade regeltester (`tests/rules/supportatkomst.test.mjs`) + 9
functions-tester (`tests/functions/supportatkomst.test.cjs`).

**Läckagerisk medvetet bedömd:** fönstret ger läsning av samma innehåll en redaktör i
organisationen redan kan se (inklusive icke godkända utkast för `rutiner`), aldrig
användarkonton, inställningar eller betalningsuppgifter. Kunden är den enda som kan öppna
fönstret (superadmin i egen organisation); leverantören kan bara stänga det, inte öppna det.
Loggat i organisationens EGEN revisionslogg i båda ändar (`support_atkomst_beviljad`/
`support_atkomst_avslutad`) – men enskilda läsningar UNDER fönstret loggas INTE, bara att
fönstret var öppet, av vem och varför (samma begränsning som redan gällde `permission-denied`-
rapporteringen, se `INCIDENT-CHECKLISTA.md` steg 4).

**Ingen ny PII-yta** – fältnamnen (`supportAtkomstTill`/`supportAtkomstBeviljadAv`/
`supportAtkomstAnledning`) innehåller själva bara en tidsstämpel, ett uid och en fritextad
anledning som kunden själv skriver (samma mönster som redan gällde raderingsanledningen,
Etapp 49a).

## Tillägg (2026-08-10, version 5.91.0): Etapp 55 – kioskläge, ett nytt regelmönster-fel upptäckt under bygget

**Ny roll: `kiosk`.** Ett delat enhetskonto (t.ex. en foajé-platta), inte en person. Läser
godkänt innehåll, söker och kör checklistor precis som `personal`, men en ny hjälpfunktion
`arKiosk()` i `firestore.rules` blockerar alla identitetsbundna skrivningar: rutin-/
anslagskvittering, bristanmälan, ändringsförslag, skiftrapport – samt (server-side, i
`functions/index.js`, eftersom de collections redan bara skrivs via Admin SDK)
`skapaKommentar`, `skickaFeedback` och `svaraPersonalpuls`. Motivet är genomgående krav 19: en
handling som inte går att knyta till en identifierbar person får inte vara möjlig, annars blir
t.ex. kvitteringsgraden en missvisande siffra.

**Ett verkligt regelfel hittat och rättat under byggandet, inte bara en design på papper.**
Den första implementationen antog att ett eget, litet match-block med en LITERAL sista
sökväg (`match /installningar/kioskPin { allow read, write: if false; }`) skulle ta
företräde framför det befintliga wildcard-blocket (`match /installningar/{dokId} { allow
read: if arInloggad() && ... }`) för just den dokumentsökvägen – ett antagande om
"mest specifika block vinner". **Det stämmer inte.** Firestore Security Rules kombinerar ALLA
matchande block med ELLER: om NÅGOT matchande block beviljar åtkomst beviljas den, oavsett om
ett annat matchande block nekar. Ett regeltest (`tests/rules/kioskrestriktioner.test.mjs`,
skrivet innan felet upptäcktes – inte i efterhand) visade att en superadmin FORTFARANDE kunde
läsa och skriva PIN-hashen direkt, trots det tillsynes stängande blocket. Rättat genom att
explicit undanta `dokId == 'kioskPin'` i själva wildcard-villkoren istället – den enda metod
som faktiskt fungerar med Firestores OR-semantik. Ingen produktionsdata var någonsin exponerad
(felet hittades av testet innan release), men det är värt att skriva in här som en allmän
lärdom om regelfilen: **ett nytt, snävare match-block bredvid ett befintligt, bredare
match-block för SAMMA sökväg stänger ingenting – det befintliga blocket måste själv
uteslutas.**

**PIN-verifiering:** `satKioskPin` (superadmin, hashar med SHA-256 server-side) och
`verifieraKioskPin` (valfri inloggad i organisationen, hastighetsbegränsad till 10
försök/timme via samma `kontrolleraOchOkaHastighet`-mönster som redan användes för
klinikstöd/kommentarer/feedback, returnerar ENDAST en boolean – aldrig hashen eller PIN-koden)
– klienten känner aldrig till rätt kod under några omständigheter. 8 regeltester
(`tests/rules/kioskrestriktioner.test.mjs`) + 9 functions-tester
(`tests/functions/kioskrestriktioner.test.cjs`).

## Tillägg (2026-08-11, v5.97.0): bred kodgranskning

En bred granskning av hela kodbasen (regelfiler, Cloud Functions, klient, CI, tillgänglighet)
genomförd 2026-08-11 mot v5.97.0. Åtgärderna nedan är committade på grenen
`claude/synappsen-final-review-slzcxe`. Detta tillägg följer den återkommande
säkerhetsgenomgången i `CLAUDE.md` – dess fem punkter besvaras sist i blocket.

### Åtgärdat: två faktiska behörighetshål i `firestore.rules`

**1. Avetablering kunde hävas av den som avetablerats.** `organisationer/{orgId}` hade en
`allow write` vars fältspärr var villkorad av `resource != null && request.resource != null`.
Villkoret är **tomt sant vid create och vid delete** – bara update träffades. En superadmin i
en PAUSAD organisation kunde därmed radera organisationsdokumentet, varpå
`organisationenArAktiv()` fail-openar (dokumentet saknas ⇒ ingen paus hittas) och hela
avetableringen hävs. Samtidigt försvann 2FA-kravet, som låg i samma fältspärr. Rättat genom
uppdelning: `allow create, delete: if false` + en ovillkorlig `allow update`. Detta är samma
familj av fel som kioskblocket i tillägget 2026-08-10 – ett villkor som *ser* heltäckande ut
men inte utvärderas för alla operationer.

**2. Anteckningar kunde blockeras av annan användare.** Skrivregeln för `anteckningar/{dokId}`
kontrollerade fältet `uid` i dokumentet, medan läsregeln kontrollerar dokId-prefixet. En
användare kunde skapa ett dokument under en annan användares prefix och därmed **permanent
blockera den användarens egen anteckning** (dokId var upptaget, och skaparen kunde själv inte
läsa det). Ingen läsning av andras data, men en varaktig funktionsförlust. Rättat till samma
kontroll på båda sidor.

### Åtgärdat: driftstabilitet i Cloud Functions

- `gemensamt.js skickaPush` bröt mot FCM:s gräns på 500 tokens per anrop. En organisation som
  passerade gränsen fick hela dygnets påminnelsejobb att avbrytas – **för samtliga
  organisationer**, inte bara sin egen. Nu chunkat.
- `ai-import.js` saknade längdgräns på `innehall` (nu 50 000 tecken). Eftersom
  `reserveraBudget()` drar en **fast** kostnad medan Gemini debiteras per token motsvarade
  budgettaket inte faktisk kostnad – ett obegränsat fält gjorde taket verkningslöst.

### Åtgärdat: personuppgifter i Cloud Logging

Mottagares e-postadresser skrevs till loggen på fyra ställen (`gemensamt.js`,
`inbjudningar.js`, `matvarden.js`, `notiser.js`). Ersatta med organisations-id/uid. Cloud
Logging är inte täckt av samma åtkomstmodell som Firestore och ska enligt principen i
incidentdokumenten aldrig innehålla identifierbara personuppgifter.

### Åtgärdat: fyra fel som kunde ta appen ur bruk

- `src/context/AuthContext.jsx`: ett `getDoc` utan try/catch hoppade över `setLoading(false)`
  – ett nätverksfel gav **permanent vit skärm för hela appen**.
- `src/hooks/useOfflineKo.js`: `catch { break; }` innebar att en post som permanent nekas
  blockerar hela offlinekön för alltid (head-of-line blocking).
- `src/hooks/useAppUppdatering.js`: uppdateringskontroll skedde bara vid sidladdning. En PWA i
  kioskläge startas sällan om – en tavla kunde alltså köra en månadsgammal build av en
  **medicinsk rutindatabas** utan att uppdateringsbannern någonsin visades. Nu periodisk.
- Tre e2e-tester kunde bli gröna utan att bevisa något (sväljd `goto`-catch plus rent negativa
  assertions). Ett test som inte kan misslyckas är sämre än inget test – det ger falsk trygghet.

### Åtgärdat: tillgänglighet (WCAG 2.1 AA – lagkrav) och CSP

Kommandopaletten saknade fokusfälla, Esc och fokusåterlämning; `VersionsHistorik` var nakna
`div`ar utan `role`/Esc; fokusindikatorn på input/select hade 1,06:1 kontrast mot kravets 3:1;
ingen global `prefers-reduced-motion`. Se `TILLGANGLIGHETSREDOGORELSE.md` för punktstatus.
CSP:n saknade `report-uri`, vilket gjorde den observationsperiod `ETAPPLAN5.md` 35b kräver före
skärpning omöjlig att genomföra. Tillagd.

### Två punkter som var öppna när tillägget skrevs, men åtgärdades i samma granskning

Rapporten skrevs parallellt med att fixarna byggdes, och listade därför båda som öppna.
Verifierat i grenen efteråt:

- **Firestores IndexedDB-cache töms nu vid utloggning.** `loggaUt()` var enbart `signOut`,
  och `persistentLocalCache` är inte nycklad per användare – på en **delad akutdator** låg
  föregående användares cachade rutiner och kontaktuppgifter kvar läsbara efter utloggning.
  Det var granskningens allvarligaste fynd, eftersom den delade datorn är det typiska
  installationsscenariot och luckan bryter mot samma isoleringsförväntan som hela
  organisationsmodellen vilar på. `rensaLokalaAnvandardata()` i `src/firebase/config.js` gör
  nu `terminate` + `clearIndexedDbPersistence`, tömmer bildcachen och `offlineCenter_*`-
  nycklarna, följt av hård omladdning. Flerflikfallet (`failed-precondition`) fångas, så
  städningen aldrig kan få utloggningen att hänga eller misslyckas. **Kvarstår:** cachen kan
  inte tömmas förrän sista fliken stängts – en Firestore-begränsning, inte något som går runt.
- **Deployen körs inte längre utan tester.** `deploy.yml` körde `firebase deploy --force` utan
  föregående lint, `vitest` eller regeltester, och eftersom deployen inkluderar
  `firestore.rules` kunde ett regelfel av exakt den typ som rättats ovan nå produktion helt
  otestat. Lint, enhetstester och regeltester körs nu före bygget och failar jobbet.

### Ej åtgärdat – prioriterat

**Hög – bör tas härnäst:**

1. **`aterstallOrganisation` saknar allowlist** (`functions/backup.js`, återställningsloopen).
   Backupfilens nycklar används verbatim som collection-namn, och org-spärren
   (`if (falt.organisationId && falt.organisationId !== orgId) continue;`) löser **inte** ut för
   dokument som saknar `organisationId` – verifierat i koden. Djupförsvar, eftersom angreppet
   kräver både plattformsadmin och skrivåtkomst till backupbucketen, men konsekvensen (skrivning
   till godtycklig collection) motiverar en allowlist mot `BACKUP_COLLECTIONS` +
   `BACKUP_SUBCOLLECTIONS` + `revisionsloggHuvud`.

**Medel:**

4. **Uppströms felmeddelanden vidarebefordras ordagrant** (`klinikstod.js` sök- och
   Gemini-anropen, `ai-import.js`) – verifierat: `throw new HttpsError("internal",
   ...${fel.message})`. Googles råa felkropp kan innehålla projektnummer och
   tjänstekontodetaljer och når en vanlig `personal`-användare. Logga fullt, returnera generiskt.
5. **Fem schemalagda loopar saknar try/catch per varv** (`notiser.js` ×3,
   `avtalslivscykel.js`, `revisionslogg.js`). Ett enda trasigt dokument stoppar batchen för alla
   återstående organisationer – samma felmönster som push-buggen ovan, som redan visat sig i
   praktiken.
6. **Ingen samtidighetshantering vid redigering av samma rutin.** Rak `updateDoc` utan
   versionskontroll: två redaktörer som sparar överskriver varandra spårlöst. I en
   rutindatabas för akutsjukvård är en tyst borttappad ändring ett innehållsintegritetsproblem,
   inte bara en olägenhet.
7. **Föräldralösa filer i Storage.** `inkommande/{uid}/…` raderas aldrig efter tolkning, och en
   borttagen bilaga tas bara ur `bilagor`-arrayen – aldrig ur Storage. Det senare är det
   allvarligare: en bilaga tas ibland bort just för att den innehöll patientuppgifter, och då
   ligger den kvar åtkomlig via sin sökväg.
8. **`arBild()` matchar `image/svg+xml`** (`storage.rules` – verifierat: `matches('image/.*')`)
   trots att kommentaren intill påstår att SVG-vägen till lagrad XSS är stängd. Ägaren har
   bedömt att en logotyp i SVG är ett rimligt användningsfall, så regeln behålls – men
   **kommentaren är felaktig och ska rättas**, annars läser nästa granskare den som ett skydd
   som inte finns. Ett dokumenterat, medvetet accepterat läge är i sig godtagbart; ett felaktigt
   påstående om ett skydd är det inte.

**Låg (skalning och användarupplevelse, inga säkerhetskonsekvenser):**

9. Saknad `.limit()`/paginering – hela `anslag` läses varje natt tvärs alla kunder, och
   `hamtaAnvandareForEpostPaminnelse` gör N×M-läsningar. Ofarligt i dagens datamängd, kostsamt
   vid tillväxt.
10. `tolkaForradsbild` gör `batch.set` per artikel utan tak mot Firestores gräns på 500
    skrivningar per batch – en tillräckligt innehållsrik förrådsbild misslyckas.
11. Halvskrivet rutinformulär kan förloras utan varning – ingen `beforeunload`-vakt och ingen
    utkastsparning.

### Verifieringslucka – läs detta innan regeländringarna litas på

**Regeltesterna gick inte att köra i sandboxen.** Firebase CLI:s emulator kräver att `::1`
binds, och miljön saknar IPv6. Regeländringarna i `firestore.rules` är därför **manuellt
granskade men inte emulatorverifierade**, och e2e-testerna endast syntaxkontrollerade.
Det är samma sorts risk som tillägget 2026-08-10 handlade om: där var det just ett *körande*
regeltest som avslöjade att en resonemangsmässigt riktig regel inte fungerade. Kör
`npm run test:rules` och `npm run test:e2e` i en miljö med IPv6 innan grenen mergas – de två
regelrättelserna ovan ska inte betraktas som bekräftade förrän det är gjort.

### Den obligatoriska femstegskontrollen (`CLAUDE.md`)

1. **Ny collection med regeltester?** Ingen ny collection i denna granskning. Två *ändrade*
   regelblock (`organisationer`, `anteckningar`) – befintliga testfiler täcker dem, men se
   verifieringsluckan ovan: de är inte körda.
2. **Ny uppladdningsväg med storleks-/innehållstypsbegränsning?** Ingen ny väg. Befintliga
   vägar har begränsningar, med den kända avvikelsen att `arBild()` släpper igenom SVG
   (punkt 8).
3. **Läcker en ny loggpunkt personuppgifter eller dokumentinnehåll?** Ja – fyra *befintliga*
   loggpunkter läckte mottagares e-postadresser och är åtgärdade. Inga nya loggpunkter tillförda.
4. **npm audit genomläst?** Ja. 7 sårbarheter i den fullständiga trädet, men både
   `npm audit --omit=dev` och `functions/` ger **noll** – samtliga sju är alltså rent
   utvecklingsberoenden och når aldrig produktionsartefakten. Den kritiska (`tar` via
   `firebase-tools@13`) kräver en major-uppgradering till v15, inte `--force`;
   `npm audit fix` utan `--force` löser 5 av 7 säkert och kan göras när som helst. Ingen
   åtgärd är brådskande, men `firebase-tools`-hoppet bör planeras in som ett eget arbete
   snarare än klämmas in i en release.
5. **~6 månader sedan senaste återställningsövning?** Nej. Riktmärket i `avtal/IT-FAKTABLAD.md`
   p. 6 är inte passerat sedan förra kontrollen, och ingen ny övning behöver bokas i denna
   omgång. Notera dock att punkt 3 ovan rör återställningsfunktionen: om allowlisten byggs bör
   nästa övning uttryckligen inkludera ett återställningsprov, eftersom koden då ändrats.

---

## Tillägg (2026-08-17, v5.114.0): fullständig kodgranskning, Del 1 av 4

Ägaren beställde 2026-08-17 en komplett säkerhetsgranskning av all kod, uppdelad i fyra
omgångar. **Det fullständiga arbetsunderlaget ligger i `SAKERHETSGRANSKNING-2026-08.md`** –
det här tillägget är den korta noteringen som `CLAUDE.md`s underhållsregel för den här filen
kräver, inte en dubblett av rapporten.

**Del 1 (regel- och behörighetslagret) är klar.** Tre fynd patchade i `firestore.rules`:

1. **Personnummer-spärren missade samordningsnummer med dagfält 82–91** – alltså alla födda
   den 22:a–31:a i månaden, ungefär en tredjedel av alla samordningsnummer. Regeln är den
   hårda spärren mot direktanrop som kringgår klientfiltret, så luckan satt i just det lager
   som ska hålla. Dagfältet täcker nu hela 61–91.
2. **Varje leverantörsadmin kunde läsa varje kunds fullständiga revisionslogg** utan
   kundbeviljat supportfönster, utan att kunden såg det och utan spår. Nu gated på
   `farSupportlasa()` som allt annat kundinnehåll (Etapp 50b:s princip). Verifierat att ingen
   klientfunktion använde grenen.
3. **`visningar`/`checklistkorningar` saknade fältbegränsning** – godtyckliga fält kunde
   skrivas, och `visningar.titel` renderas för hela organisationen i kommandopaletten.

Ny testfil `tests/rules/sakerhetsgranskning-del1.test.mjs` (15 tester) i `test:rules`.
Bevisad meningsfull: **7 av dem failar mot regelfilen före patchen**, alla 15 passerar efter.

**Punkt 4 i den återkommande checklistan (npm audit) omprövad.** Ett uppgraderingsförsök av
`firebase-tools` 13 → 15 gjordes enligt ägarbeslut och **rullades tillbaka**: `test:storage`
gick från 24/24 till 18/24, där samtliga sex fel var "ska tillåtas"-tester som havererade på
cross-service-uppslaget `firestore.get()` i storage-emulatorn. Det failar stängt, men blindar
sex tester på storage-lagrets organisationsisolering. Bedömningen i förra tillägget står
alltså kvar och är nu empiriskt underbyggd: hoppet är ett eget arbete, inte en releasedetalj.

**Ingen av patcharna är deployad** – ägaren har valt att avvakta med deploy under granskningen.

## Tillägg (2026-08-17, v5.115.0–v5.117.0): fullständig kodgranskning, Del 2–4 av 4 – AVSLUTAD

Hela genomgången är klar. Fullständig rapport med varje fynd, angreppsscenario och åtgärd:
`SAKERHETSGRANSKNING-2026-08.md`. Sammanfattning här, enligt den återkommande
säkerhetsgenomgångens rutin.

**Utfall: 17 fynd, varav 12 patchade, 3 flaggade för ägarbeslut och 2 dokumenterade.**

De fyra som betydde mest:

1. **Nattkontrollen läckte leverantörens kundlista till varje kund** (2.1). Den schemalagda
   `verifieraRevisionskedjor()` skrev varje avvikande organisations ID till två collections
   som är läsbara för superadmin i VILKEN organisation som helst. Anmärkningsvärt: kodbasen
   dokumenterar redan den korrekta principen på två andra ställen och följer den där –
   nattkontrollen var undantaget som bröt mot sin egen husregel.
2. **Klientens personnummerspärr missade den tolvsiffriga formen** (3.1) – alltså den form
   svenska journalsystem visar. Serverregeln täckte båda formerna efter Del 1; de två lagren
   sa emot varandra, och det svagare låg på den bredare vägen.
3. **Nätfiskeformulär kunde bäddas in i en klinisk rutin** (4.2). DOMPurifys
   standardkonfiguration tillåter `<form>` och `<input>`. CSP:ns `form-action 'self'` hade
   stoppat submitten – men policyn var Report-Only. Två lager, båda avstängda, ingetdera
   synligt som en lucka.
4. **Kioskkontot skrev "privata" anteckningar som nästa person vid plattan såg** (4.4).
   `!arKiosk()` saknades på `anteckningar` trots att fem andra collections har den – och just
   den här är den enda vars gränssnitt uttryckligen lovar avskildhet.

**Punkt 4 i den återkommande checklistan (npm audit), slutgiltigt svar.** `npm audit
--omit=dev` ger **0 sårbarheter**. Samtliga sju, inklusive den kritiska `tar`, kommer via
`firebase-tools` – en devDependency som inte ingår i produktionsbygget. Förra tilläggets
bedömning står, nu med en mätning i stället för ett resonemang.

**Två metodfynd som är värda mer än enskilda buggar:**

- **Ett fältfilter måste testas mot varje faktisk skrivning, inte mot en representativ.** Del
  1:s fältbegränsning på `checklistkorningar` nekade en riktig klientskrivning (fynd 3.5).
  Testet missade det för att det råkade skriva ett enkelt fält. Regressionen fångades av en
  egenkontroll i Del 3 och nådde aldrig produktion.
- **Ett test i fel miljö kan ljuga åt båda hållen.** Ett första enhetstest av
  markdown-saneringen rapporterade `<script>` som osanerat – ett falskt kritiskt larm –
  eftersom DOMPurify beter sig fel under happy-dom. Sanningen kom ur en körning i riktig
  Chromium, och testet ligger nu i e2e-sviten. Hade den första körningen rapporterats hade
  rapporten innehållit en påhittad sårbarhet och missat den verkliga.

**Kvar för ägaren att besluta** (se `OPPNA-PUNKTER.md`): flytta push-tokens ur `users/{uid}`
(3.3), gör CSP:n skarp efter en mätperiod (4.1), och härda deployjobbets leveranskedja (4.7).

**Ingenting av detta är deployat.** Produktionen kör v5.106.0; v5.107.0–v5.117.0 ligger
pushade och odeployade enligt ägarbeslut. **v5.114.0 får inte deployas utan v5.116.0** – Del
1:s regression rättas där.

