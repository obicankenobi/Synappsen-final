# ETAPPLAN 11 – "Från en avdelning till en kund som växer"

*Skrivet 2026-08-10, utgångsläge v5.84.0, efter att Etapp 48–51 blivit klara och deployade
(körning #72). Omfattning: Etapp 53–58. **ANTAGEN 2026-08-10** – ägaren godkände planens
omfattning och ordningsprincip.*

> **Status:** aktiv plan. `ETAPPLAN10.md` (Etapp 48–51, plus den obyggda Etapp 52) är
> föregående plan – se `CLAUDE.md`s dokumentkarta för den fulla läsordningen.
>
> **Antagandet av planen svarar INTE på beslutspunkterna nedan.** De fyra beslutspunkterna
> (nytt underbiträde för e-post, hur långt Etapp 54 ska drivas spekulativt, SAML/OIDC, opt-in-
> läge för påminnelser) är fristående ägarbeslut som var och en ska bekräftas explicit innan
> respektive delmål byggs – särskilt beslutspunkt 1, som är ett avtalsrättsligt åtagande
> (nytt underbiträde), inte ett tekniskt val. Rekommendationerna står kvar som förslag tills
> dess.

> **Premisskontrollens gränser:** de sakpåståenden som anges under "Premisskontroll gjord
> inför utkastet" nedan är faktiskt verifierade mot koden. Allt annat i dokumentet är skrivet
> mot dokumentationen och en översiktlig läsning. Genomgående krav 8 gäller oförändrat och
> ska köras mot faktisk kod innan **varje** delmål byggs. Erfarenheten från 43d (mörkt läge
> fanns redan), Etapp 44 (offline-kön fanns redan), Etapp 46 (två av tre idéer visade sig
> obyggbara) och Etapp 51c (jokerinbjudan visade sig vara en säkerhetsregression) säger att
> minst en punkt nedan är antingen redan löst, onödig eller omöjlig som beskriven.

---

## Premisskontroll gjord inför utkastet (verifierad mot kod 2026-08-10)

Sex påståenden som hela planen vilar på kontrollerades innan den skrevs. Samtliga stämmer:

1. **Det finns ingen e-postkapacitet någonstans i projektet.** Noll träffar på
   `nodemailer`, `sendgrid`, `mailto`, `sendEmail`, `skickaEpost` i `functions/` och `src/`.
   All utgående kommunikation är in-app-notiser plus webbpush. En person som inte redan har
   appen öppen, eller inte har installerat den, kan i dag **inte nås alls** av systemet.
2. **Inbjudningslänken levereras manuellt.** `InbjudanFormular.jsx:32` bygger
   `.../registrera?bjudan=<token>` och visar den i ett läsbart fält att kopiera. Vem som
   helst som ska bjudas in kräver alltså att en människa manuellt för över en länk.
3. **`FEATURE.KIOSK_MODE` är reserverad men helt oläst.** Den förekommer på exakt två rader,
   båda i `src/config/features.js` (definitionen och `PACKAGE_FEATURES.operations`). Ingen
   komponent, hook, route, Cloud Function eller regel refererar till den. Det är den sista
   obyggda raden i Operations-paketet enligt `MODULPLAN.md`.
4. **Det finns ingen enhets-/avdelningsnivå under organisationen.** Noll träffar på
   `enhetId`/`avdelningId` i `src/`, `functions/` och `firestore.rules`. `organisationId` ÄR
   avdelningen. Ett sjukhus med fem enheter blir i dag fem helt separata organisationer utan
   någon gemensam yta.
5. **`PITCH.md` innehåller ett felaktigt påstående om den egna produkten.** Dokumentet
   (version 5.73.0, 2026-08-04) säger att klinikstöd-sökningen är *"medvetet pausad i
   gränssnittet just nu"*. `KlinikfragaSok.jsx:15` säger `const PAUSAD = false;` med en
   kommentar som daterar återaktiveringen till **2026-07-14 (Fas 13)** – tre veckor före
   `PITCH.md` senast skrevs. `MODULPLAN.md` säger korrekt att funktionen är i drift. Se
   Etapp 57a.
6. **Startbiblioteket är tunt.** `functions/verksamhetsmallar.js` ger en ny
   akutmottagningsorganisation **två** rutinmallar, båda rena strukturplatshållare (helt rätt
   avvägt innehållsmässigt, se filens egen motivering – men två stycken är inte "ni börjar
   inte från ett tomt system"). Ingen mall alls finns för förrådsstruktur, kontaktkategorier,
   introduktionsspår eller kompetenskrav.

---

## Var projektet står

`ETAPPLAN10.md` gjorde det den skulle: produkten gick från *byggd* till *driftbar*. Kapacitet
och kostnad mäts, avetableringen har en livscykel, supporten kan hjälpa utan stående
innehållsåtkomst, och det finns en demo-/övningsmiljö som nollställs varje natt. Enda
kvarvarande punkten där är Etapp 52 (pilotpaketet), som kräver bokad tid med människor
snarare än kod.

Elva planer har nu byggt en produkt som är **komplett för en avdelning med en handfull
inloggade, engagerade användare.** Tesen för den här planen är att de återstående svagheterna
inte längre finns *inne i* produkten:

> **Produkten är byggd och driftbar. Men den kan bara nå människor som redan är inne i den,
> och den kan bara säljas till en avdelning i taget.**

Fyra konkreta konsekvenser, alla verifierade ovan:

1. **Systemet kan inte nå någon utanför appen.** En rutinägare som får en granskningspåminnelse
   men är ledig i två veckor får den aldrig. En chef som ska se månadsrapporten måste själv
   komma ihåg att logga in. En ny medarbetare kan inte bjudas in utan att någon manuellt
   klistrar in en länk i ett annat system. Hela kvalitetsmaskineriet från Etapp 37–39 och 45
   förutsätter tyst att mottagaren redan är aktiv i appen.
2. **Affären kan inte växa uppåt inom en befintlig kund.** Går piloten bra på en
   akutmottagning är nästa naturliga steg de andra enheterna på samma sjukhus – och då finns
   inget sätt att dela en gemensam hygienrutin, ingen samlad bild för en verksamhetschef med
   fyra enheter, och ingen inloggning som fungerar för en sjuksköterska som roterar mellan
   två av dem. Det är den enskilt största kommersiella begränsningen i produkten i dag.
3. **Delad enhet är oadresserat.** En surfplatta på väggen i akutrummet eller i förrådet är
   det mest självklara användningsfallet på en akutmottagning, och det enda Operations-löftet
   som aldrig byggdes.
4. **Säljmaterialet underskattar produkten.** Det enda dokumentet som faktiskt visas för en
   köpare påstår att en av produktens mest särskiljande funktioner är avstängd. Den har varit
   igång sedan mitten av juli.

Ingen av de fyra är blockerad av teknik. Tre av fyra blir akuta samtidigt, den dag piloten
går bra.

---

## Ordningsprincip

1. **Etapp 57a först, i dag, som en femminutersåtgärd.** Ett felaktigt säljdokument kostar
   ingenting att rätta och kan kosta en affär att låta stå. Den ska inte vänta på att planen
   antas.
2. **Etapp 53 (e-post) därefter** – den har störst spridningseffekt per byggd rad. Nästan
   varje funktion som redan finns blir mer värd när den kan nå fram till en människa som
   inte är inloggad just nu. Den kräver dock ett ägarbeslut om ett nytt underbiträde
   (beslutspunkt 1) innan bygget kan börja.
3. **Etapp 54 (flera enheter) är planens tyngsta och mest riskfyllda del** och bör byggas när
   det finns en konkret andra enhet att bygga mot – inte i förväg. Jämför `ETAPPLAN6.md`
   Etapp 40, som medvetet väntar på en riktig kund av exakt samma skäl. **54a ska dock köras
   oavsett**: den är ren utredning och avgör om resten är en veckas arbete eller en månads.
4. **Etapp 55 (kiosk) och 56 (startbibliotek)** är oberoende av allt annat och kan tas när
   som helst. 56 är den enda etappen i planen som mest handlar om innehåll, inte kod.
5. **Etapp 58 (SSO) sist** – den är villkorad av ett ägarbeslut som stått öppet sedan
   `ETAPPLAN3.md`, och blir bara akut om en region- eller sjukhusövergripande affär blir
   konkret.

---

## Genomgående krav

De sjutton kraven i `ETAPPLAN3.md`–`ETAPPLAN10.md` gäller oförändrat. Tre tillkommer, alla
föranledda av vad den här planen rör:

18. **Ingenting som skickas utanför systemet får innehålla verksamhetens innehåll eller
    personuppgifter utöver mottagarens egen e-postadress.** Ett mejl från Synappsen får säga
    *"du har tre rutiner att granska, logga in för att se dem"* – aldrig vilka, aldrig ur
    vilken organisation, aldrig med en rad ur innehållet. Skälet är dubbelt: e-post är en
    okrypterad kanal utanför PUB-avtalets tekniska skyddsåtgärder, och varje undantag från
    regeln blir omöjlig att granska i efterhand. Regeln gäller ämnesraden också.
19. **Ingen ny inloggningsväg får försvaga revisionsloggens "vem".** Gäller särskilt Etapp 55
    (delat kioskkonto) och Etapp 58 (SSO). Ett delat konto som kan kvittera en rutin gör
    kvitteringsgraden – som är ett av produktens tre pilotmått – till en meningslös siffra.
    Kan handlingen inte knytas till en identifierbar person ska handlingen inte vara möjlig.
20. **Delning av innehåll mellan organisationer är en envägsdörr och behandlas därefter.**
    Hela `firestore.rules` bygger i dag på att `matcharMinOrg()` är den enda vägen till
    innehåll (med ett enda, tidsbegränsat och kundinitierat undantag: Etapp 50b). Etapp 54c
    föreslår ett andra undantag. Det ska byggas med egen regeltestfil, explicit
    isoleringstest åt båda hållen, och ett uttryckligt "detta är inte på som standard"-läge –
    exakt den behandling 50b fick.

---

# Etapp 53 – Nå fram till en människa som inte är inloggad

**Varför:** premisskontroll 1 och 2 ovan. Det här är planens billigaste stora förbättring:
den bygger inga nya funktioner, den gör att de trettiotal funktioner som redan finns faktiskt
når sin mottagare.

**Modul:** ingen (Core). En kanal som bara Operations-kunder får är fel – inbjudningsflödet
är Core.

**Beroende:** beslutspunkt 1 (nytt underbiträde) – **avgjord 2026-08-10, se BESLUTSLOGG.md**:
ja, Brevo (EU-baserat, Frankrike).

- **53a – ✅ KLAR (2026-08-10) – Kanalen som infrastruktur.** Verifierade Firebase-
  extensionen *Trigger Email from Firestore* mot en direkt API-integration: extensionen
  kräver ändå ett SMTP-konto hos någon (samma underbiträdesfråga uppstår ändå) och lägger
  till ett extra abstraktionslager utan att lösa något – valde en direkt integration mot
  Brevos REST-API istället. Byggde EN intern hjälpare, `skickaEpost({ till, amne, text,
  organisationId })` (`functions/index.js`), som allt annat i planen (53b–53d) ska gå
  igenom. Genomfört: (i) hårdvägrar en ogiltig/saknad mottagaradress
  (`HttpsError("invalid-argument", …)`), (ii) kör samma Luhn-validerade
  personnummer-kontroll (`innehallerPersonnummer`) på ämne+text som formulären gör, (iii)
  loggar *att* ett mejl skickats till avsändarens `revisionslogg` – aldrig innehållet, (iv)
  ett globalt nödstopp (`systemstatus/epost.avstangd`, satt via den nya callablen
  `angeEpostAvstangd`, plattformsadmin-only) som stänger av ALL utgående e-post för alla
  organisationer omedelbart, utan en deploy – med dubbel bekräftelse i UI:t (genomgående
  krav 17). Nyckeln (`BREVO_API_KEY`) hanteras som Secret Manager-parameter, exakt samma
  mönster som `GEMINI_API_KEY`/`SOKMOTOR_API_KEY` – saknas den (fram tills ägaren sätter en
  riktig nyckel som GitHub-hemlighet) no-oppar `skickaEpost()` tyst och loggar en varning,
  istället för att krascha anroparen. **Ingen produktfunktion anropar `skickaEpost()` ännu**
  – det är precis vad 53b–53d ska göra. Testat: `tests/functions/epost.test.cjs` (10 tester
  – validering, PII-spärr, nödstopp, tyst no-op utan nyckel, ett faktiskt utskick mot en
  mockad Brevo-endpoint som bevisar att loggposten aldrig innehåller mejlets text, samt
  `angeEpostAvstangd`s behörighet). En ny UI-sektion "✉️ Utgående e-post" i `/leverantor`
  visar och styr nödstoppet. Se `avtal/UNDERBITRADEN.md` (ny rad, Brevo),
  `avtal/INCIDENTRESPONSPLAN.md` (v1.4, avsnitt 5.2) och `INCIDENT-CHECKLISTA.md` för
  underhållsreglerna som triggades. v5.85.0.
- **53b – Inbjudan levereras per e-post.** Behåll den kopierbara länken (den behövs när
  mejlet fastnar i ett spamfilter, vilket det kommer att göra hos minst en region), men gör
  utskick till förval. Inbjudningsmejlet är det enda som med nödvändighet får innehålla
  organisationens namn – annars går det inte att förstå. Det ska vara ett medvetet, skrivet
  undantag från genomgående krav 18, inte en glidning.
- **53c – Påminnelser når ägaren även utanför appen.** Koppla de befintliga schemalagda
  jobben (`kontrolleraKvitteringsfrister`, `forslagPaminnelserSchemalagt`,
  granskningspåminnelser till rutinägare) till kanalen. **Opt-out per användare, förvalt
  PÅ för påminnelser som rör en uppgift användaren fått tilldelad, förvalt AV för allt
  annat.** Följ mönstret från push-notiserna (som är förvalt av) men notera skillnaden: push
  är ett brus, en tilldelad arbetsuppgift är inte det. En daglig sammanslagning ("du har 3
  saker") slår ett mejl per händelse – bygg det så från början, det är svårt att lägga till
  efteråt.
- **53d – Månadsrapporten kommer till chefen av sig själv.** `manadsrapportOrganisationer`
  finns redan, men bara som leverantörens fakturaunderlag. En kundvänd variant – "så såg
  förra månaden ut", med kvitteringsgrad, innehållshälsa och antalet obesvarade
  ändringsförslag, som en länk in i den befintliga `/ledningsrapport` – gör att en chef som
  aldrig loggar in ändå ser värdet. Det är också det billigaste sättet att göra en
  omförhandling enklare.

**Klart när:** en person som aldrig öppnat appen kan bjudas in, påminnas om en tilldelad
uppgift och få en månadssammanfattning – utan att någon människa manuellt kopierar något,
och utan att en enda rad verksamhetsinnehåll lämnar systemet.

**Underhållsregler som triggas:** nytt underbiträde → `avtal/UNDERBITRADEN.md` +
incidentresponsplanens avsnitt 1-tabell. Ny utgående kanal → checklistans steg 3
(begränsningsåtgärd: hur stänger man av utskicken under en incident?) och steg 5. Allt i
samma commit.

---

# Etapp 54 – Flera enheter under samma huvudman

**Varför:** premisskontroll 4 och konsekvens 2 ovan. Det här är planens kommersiella kärna
och dess största risk. Läs `FRAMTIDSPLAN.md`s rad om alternativet "Kund nummer tre" –
"flera enheter i samma organisation" stod med där redan, med noteringen att det **måste
skrivas ut som en riktig planfil innan det kan antas.** Det här är det försöket.

**Modul:** ingen (plattform/Core). Att ta betalt extra för att en kund har två avdelningar
hör hemma i prissättningen (`MODULPLAN.md`s "volympris per tillkommande enhet"), inte i en
feature-flagga.

- **54a – Utred bärkraften, bygg ingenting. KÖR OAVSETT om resten av etappen antas.**
  Kartlägg exakt vad `organisationId` bär i dag: hur många collections, hur många
  regelfunktioner, hur många hookar, och – viktigast – om `useAuth`s antagande om **ett**
  `organisationId` per användare är inbakat på ett fåtal ställen eller överallt. Svaret
  avgör om 54d är en dagsinsats eller en omskrivning av behörighetsmodellen. Resultatet
  skrivs in i den här filen som en "Premisskontroll"-sektion, precis som 48c fick.
  **Utfallet får ändra planen** – inklusive att stryka 54c och 54d helt.
- **54b – Huvudmannanivå ovanpå, inte istället för.** Ett fält `huvudman` på
  `organisationer/{orgId}` och en gruppering i `/leverantor`. Ingen dataflytt, inga ändrade
  regler, ingen risk. Ger omedelbart: en samlad vy per huvudman i leverantörsvyn, en
  gemensam fakturarad, och – med en enkel utökning av `/ledningsrapport` – en jämförelse
  mellan enheter för en verksamhetschef som ansvarar för flera. **Detta ensamt löser
  förmodligen 70 % av det upplevda behovet till 10 % av risken**, och bör byggas först och
  utvärderas innan 54c ens övervägs.
- **54c – Gemensamma rutiner (HÖGRISK, villkorad av 54b:s utfall).** En organisation kan
  utses till *gemensam källa* för sin huvudman; dess **godkända** rutiner blir läsbara för
  syskonorganisationerna, tydligt märkta *"Gemensam rutin – förvaltas av X, kan inte ändras
  här"*. Krav om den byggs: läsning aldrig skrivning; endast status `godkand`; endast inom
  samma `huvudman`; av som standard; egen regeltestfil med isoleringstest åt **båda** hållen
  (en syskonorganisation ska inte kunna läsa något annat än just de gemensamma rutinerna, och
  en organisation utan huvudman ska inte påverkas alls); och en uttrycklig kontroll av att
  källbevakning, innehållshälsa och kvittering gör något vettigt med en rutin som inte ägs
  lokalt – troligen ska den räknas bort ur den lokala hälsosiffran, annars straffas en enhet
  för innehåll den inte råder över. Se genomgående krav 20.
- **54d – En användare, flera enheter (villkorad av 54a:s utfall).** Möjlighet att byta enhet
  utan att logga ut, för personal som roterar. Realistiskt bara om 54a visar att antagandet
  om ett `organisationId` sitter på ett fåtal ställen. Om inte: **stryk delmålet och lös
  behovet med två konton**, det är en fullt acceptabel lösning för ett fåtal personer och
  oändligt mycket billigare än en behörighetsomskrivning.

**Klart när:** en verksamhetschef med tre enheter kan se dem samlat, och en ny enhet hos en
befintlig kund kan startas utan att någon behöver kopiera innehåll manuellt mellan två
organisationer.

**Uttrycklig varning:** frestelsen här är att bygga 54c först, eftersom den är den mest
imponerande. Gör inte det. 54b är tråkig, riskfri och löser det mesta.

---

# Etapp 55 – Kioskläge: appen på väggen

**Varför:** premisskontroll 3. Sista obyggda Operations-punkten, och det mest självklara
fysiska användningsfallet i en akutmottagning: en surfplatta i akutrummet, i förrådet eller i
personalrummet, som ingen loggar in på personligen.

**Modul:** Operations (`FEATURE.KIOSK_MODE` finns redan reserverad).

- **55a – Enhetskonto med kraftigt beskuren behörighet.** En organisation kan skapa ett
  *enhetskonto* (t.ex. "Surfplatta akutrum 2") som loggas in en gång och sedan står kvar.
  Kontot ska ha en egen roll, inte en befintlig: **läsa godkänt innehåll, söka, öppna
  akutläget och köra en checklista – ingenting annat.** Uttryckligen omöjligt: kvittera,
  kommentera, ändringsförslag, bristanmälan, profil, personalpuls, allt som skriver något
  som är knutet till en person. Genomgående krav 19 är hela poängen med delmålet.
  Revisionsloggen skriver `kiosk:<enhetsnamn>` som aktör.
- **55b – Kioskbeteendet i gränssnittet.** Automatisk återgång till startvyn efter kort
  inaktivitet (kortare än den vanliga `useInaktivitetsUtloggning`, och den ska INTE logga ut –
  en utloggad surfplatta i ett akutrum är värdelös), ingen personlig navigation, akutläget en
  tryckning bort, och en PIN-kod för att lämna kioskläget. Återanvänd `AkutlagePrefetch` och
  offline-cachen – en väggmonterad platta har sämre nät än en telefon i en ficka, inte bättre.
- **55c – Dokumentera den nya inloggningsvägen.** Ett stående inloggat konto är en ny
  angreppsyta och en ny sak att stänga av under en incident. `INCIDENT-CHECKLISTA.md`s steg
  3-tabell (hur återkallas alla kioskkonton?), steg 4 och snabbreferensen "Var saker finns"
  ska uppdateras i **samma commit**, och `SAKERHETSRAPPORT.md` få ett tillägg om avvägningen.
  `avtal/IT-FAKTABLAD.md` bör också nämna det – en IT-avdelning kommer att fråga.

**Klart när:** en surfplatta kan sitta på väggen i en vecka, visa rätt sak, inte kunna
missbrukas för att skriva något i någon annans namn, och kunna spärras på tio sekunder från
adminpanelen.

---

# Etapp 56 – Startbiblioteket: så att dag ett inte är tomt

**Varför:** premisskontroll 6. `PITCH.md` och säljsamtalet lovar att en ny kund inte börjar
från noll. Två platshållarrutiner infriar inte det löftet. Det här är den enda etappen i
planen där merparten av arbetet är innehåll och struktur, inte kod – och därför den som är
lättast att göra klart snabbt.

**Modul:** ingen (Core, del av etableringen).

- **56a – Fler och bättre rutinmallar per verksamhetstyp.** Behåll `MALL_ANMARKNING`-
  disciplinen exakt som den är: mallarna ska vara **strukturella skelett med rubriker och
  frågor att besvara**, aldrig påhittad klinisk vägledning. Filens egen motivering är helt
  rätt och ska citeras i varje ny mall. Sikta på 8–12 per verksamhetstyp, fördelade över
  Kliniskt stöd / Logistik / Administration, så att alla tre områdena har innehåll dag ett.
- **56b – Mallar för allt som inte är rutiner.** En ny organisation får i dag tomma listor
  för förråd, kontakter, introduktionsspår och kompetenskrav. Ett förslag på förrådsstruktur
  (skåp/hylla-skelett att döpa om), fem kontaktkategorier, ett introduktionsspår för en
  nyanställd och två–tre kompetenskrav gör skillnaden mellan "ett tomt system vi måste fylla"
  och "ett system som är nästan rätt och behöver justeras". Den psykologiska skillnaden vid
  ett införande är svår att överdriva.
- **56c – Låt kom igång-flödet mäta verkligt läge.** *Verifiera först:*
  `KomIgangChecklista`/`useValkomstchecklista` finns redan och räknar steg. Kontrollera om
  stegen markeras manuellt eller härleds ur faktisk data. Härleds de ur data är delmålet
  klart och ska strykas; markeras de manuellt är en checklista som säger "klart" om en tom
  organisation värre än ingen checklista.
- **56d – Gör mallbiblioteket till ett säljargument, inte en dold detalj.** Om 56a–56b görs:
  en rad i `PITCH.md` och en skärmbild. Ett startbibliotek som ingen köpare känner till har
  noll kommersiellt värde.

**Klart när:** en nyetablerad organisation kan visas upp i ett säljmöte direkt efter
`skapaOrganisation`, utan att någon först fyllt den manuellt – och demomiljön från Etapp 51
kan seedas från samma källa istället för sin egen kopia.

---

# Etapp 57 – Säljmaterialet ska stämma

**Varför:** premisskontroll 5. Det här är fjärde–femte gången i projektets historia som ett
dokument visar sig ligga efter koden (`SAKERHETSRAPPORT.md` 46–51 releaser,
`FRAMTIDSPLAN.md`/`MODULPLAN.md` 38–43, `src/version.js` 19, `CLAUDE_STATUS.md` två). Varje
gång har lösningen varit densamma och den har fungerat: **gör regeln händelsestyrd, inte
minnesstyrd.** `PITCH.md` har hittills bara haft en mjuk uppmaning ("kontrollera
versionsnumret vid större releaser") i `CLAUDE.md` – vilket är precis den formulering som
bevisligen inte håller.

**Modul:** ingen (dokumentation).

- **57a – ✅ KLAR (2026-08-10).** Rättade `PITCH.md`s felaktiga påstående om att
  klinikstöd-sökningen är pausad (den återaktiverades 2026-07-14) till en korrekt
  historik-formulerad beskrivning. Bumpade versionsraden till 5.84.0/2026-08-10. Kontrollerade
  resten av dokumentet mot `MODULPLAN.md`/`ETAPPLAN8.md`: lade till en kort rad om
  kommandopaletten, relaterade rutin-förslag och det uppdaterade "Sedan ditt förra pass"
  (Etapp 47a/47b) som saknades helt. 57b (händelsestyrd underhållsregel) och 57c (ärligt
  "vad som inte finns"-stycke) kvarstår som egna delmål.
- **57b – Händelsestyrd underhållsregel för `PITCH.md`.** Skriv in i `CLAUDE.md`, i samma
  format som de fyra befintliga obligatoriska reglerna: *om en etapp gör en kundvänd funktion
  synlig, avstängd eller väsentligt ändrad → uppdatera `PITCH.md` i samma commit.* Ta med
  motiveringen (den här etappens "varför") så att en framtida session förstår varför regeln
  finns och inte tar bort den som byråkrati.
- **57c – Ett ärligt "vad som inte finns"-stycke.** `PITCH.md` har redan ett utmärkt
  "Ärlighet om vad som faktiskt är mätt". Motsvarande för funktionalitet – SSO saknas i dag,
  kioskläge saknas tills 55 är byggd, ingen integration mot journal- eller HR-system – gör
  dokumentet mer trovärdigt, inte mindre. En IT-avdelning som upptäcker en lucka själv drar
  slutsatsen att det finns fler; en som får den berättad drar inte det.

**Klart när:** en köpare kan läsa `PITCH.md` rakt igenom utan att ett enda påstående går att
motbevisa med appen framför sig.

---

# Etapp 58 – SSO / Microsoft Entra ID (villkorad, kräver ägarbeslut först)

**Varför:** `ETAPPLAN3.md` §13f har stått öppen sedan den skrevs, blockerad på ett enda
ägarbeslut (SAML eller OIDC). `FRAMTIDSPLAN.md` är rakt på sak om vikten: *"Omedelbart om en
regionkund blir aktuell. SSO blockerar den affären oavsett hur bra resten är."* Den står med
här enbart för att den ska sluta ligga och vänta osynligt – **inte** för att den föreslås
byggas nu.

**Modul:** ingen (Core, upphandlingsbarhet).

- **58a – Ta beslutet, bygg inget.** Se beslutspunkt 3 nedan, som innehåller en konkret
  rekommendation. Ett beslut kostar tio minuter och tar bort en rad som stått i
  `OPPNA-PUNKTER.md` i månader.
- **58b – Bygg först när en namngiven kund kräver det.** Både SAML och OIDC i Firebase Auth
  förutsätter en uppgradering till Identity Platform (GCIP), vilket är en förändring av
  autentiseringslagret och prismodellen – inte en inställning. *Verifiera först* vad den
  uppgraderingen innebär för befintliga konton, för 2FA-policyn (`uppdateraMfaPolicy`) och
  för App Check, innan någon kod skrivs. Att bygga SSO spekulativt är fel: den är värdelös
  utan en motpart som konfigurerar sin sida.
- **58c – Inbjudningsflödet och SSO måste samsas.** Etapp 6c stängde öppen registrering med
  avsikt, och Etapp 51c visade hur lätt det är att av misstag öppna den igen. En
  SSO-inloggning som skapar konton automatiskt vid första inloggningen ÄR öppen registrering,
  bara med ett annat namn. Rätt modell: SSO ersätter lösenordet, **inte** inbjudan.

**Klart när:** beslutet är fattat och dokumenterat i `BESLUTSLOGG.md`, med ett tydligt
villkor för när bygget startar.

---

## Beslutspunkter som kräver ägaren

| # | Fråga | Varför den inte kan avgöras i en kodsession | Rekommendation |
|---|---|---|---|
| 1 | **Får ett nytt underbiträde för e-postutskick anlitas?** (Etapp 53) | Ett nytt underbiträde påverkar `avtal/UNDERBITRADEN.md`, PUB-avtalet och DPIA-underlaget. Det är ett avtalsrättsligt åtagande, inte ett tekniskt val. | **Ja, och välj en EU-baserad leverantör** (t.ex. Brevo eller Postmark EU) framför en amerikansk – underbiträdesförteckningen blir enklare att försvara i en upphandling. Endast e-postadress och en innehållslös notistext behandlas, vilket är ett mycket litet tillägg till befintlig behandling. |
| 2 | **Ska Etapp 54 (flera enheter) byggas spekulativt eller väntas ut?** | Det är en marknadsbedömning, inte en teknisk. | **Bygg 54a (utredning) och 54b (huvudmannafält) nu, vänta med 54c/54d.** 54a kostar en dag och avgör om 54d ens är möjligt. 54b är riskfritt och löser merparten av behovet. |
| 3 | **SAML eller OIDC för SSO?** (Etapp 58, öppen sedan `ETAPPLAN3.md`) | Beror på vad kunder faktiskt kräver i upphandlingar. | **OIDC.** Entra ID exponerar det nativt, det är enklare att konfigurera för en kunds IT-avdelning, och det passar Firebase Auths modell bättre. SAML behövs i praktiken bara mot äldre identitetsleverantörer – kan läggas till senare om en specifik kund kräver det. Beslutet blockerar inget bygge i dag, men tar bort en rad ur `OPPNA-PUNKTER.md`. |
| 4 | **Ska påminnelsemejl vara förvalt på eller av?** (Etapp 53c) | En avvägning mellan nytta och upplevt spam, som beror på verksamhetens kultur. | **På för tilldelade uppgifter, av för allt annat**, med daglig sammanslagning. En rutinägare som fått en uppgift har en yrkesroll, inte en prenumeration. |

---

## Vad jag INTE föreslår, och varför

Det här avsnittet finns för att en framtida session inte ska föreslå dem igen utan att känna
till invändningen.

- **Dos-/läkemedelsberäkning eller kliniskt beslutsstöd som räknar.** Den vanligaste "wow"-
  idén för en vårdapp, och den enda i listan som kan klassa hela produkten som en
  **medicinteknisk produkt under MDR**. Klinikstödet klarar sig i dag genom att sammanfatta
  källor och alltid visa dem. En funktion som räknar ut en dos gör inte det. Rör inte.
- **Integration mot journalsystem (Cosmic, Melior, TakeCare).** Enorm säljkraft, men
  förutsätter regional IT-projektorganisation, patientdata i systemet (som produkten i dag
  aktivt spärrar i tre lager) och en helt annan riskklass. Det är en annan produkt.
- **Benchmarking mellan kunder** ("er kvitteringsgrad mot branschsnittet"). Attraktivt, men
  omöjligt att göra meningsfullt med färre än tio kunder, och integritetsmässigt känsligt även
  aggregerat. Ompröva vid tio kunder, inte tidigare.
- **Native app i App Store/Google Play.** Etapp 44 gjorde PWA:n app-lik och `PITCH.md` säger
  redan rätt sak. En native app skulle lägga till distributionsfriktion (MDM, granskning,
  utrullning via regionens enhetshantering) utan att lösa något som inte redan fungerar.
- **Intelligence 2.0** (`ETAPPLAN2.md` Etapp 11). Fortfarande uttryckligen villkorad av att
  minst en kund betalar för dagens Intelligence-modul. Villkoret är inte uppfyllt. Oförändrat.
- **Chatt / meddelanden mellan användare.** Skiftrapport, anslag, kommentarer och
  @omnämnanden täcker kommunikationsbehovet. En chatt blir dessutom omedelbart det ställe där
  någon skriver ett personnummer – och till skillnad från formulären går ett chattflöde inte
  att PII-spärra utan att bli outhärdligt att använda.

---

## Sammanfattning

| Etapp | Vad | Risk | Insats | Rekommenderad ordning |
|---|---|---|---|---|
| **57a** | Rätta det felaktiga påståendet i `PITCH.md` | Ingen | Minuter | **Nu, oavsett om planen antas** |
| **53** | E-post som kanal (inbjudan, påminnelser, månadsrapport) | Låg–medel | Medel | Efter beslutspunkt 1 |
| **54a–54b** | Utred enhetsmodellen + huvudmannanivå | Låg | Låg | Parallellt med 53 |
| **56** | Startbiblioteket: fler mallar, mallar för icke-rutiner | Ingen | Låg–medel | När som helst |
| **55** | Kioskläge (delad surfplatta) | Medel | Medel | När som helst |
| **57b–57c** | Händelsestyrd `PITCH.md`-regel + ärlighetsstycke | Ingen | Låg | Ihop med 57a |
| **54c–54d** | Gemensamma rutiner, användare i flera enheter | **Hög** | Hög | Först efter 54a:s utfall, och helst mot en riktig andra enhet |
| **58** | SSO/Entra ID | Medel | Hög | Beslut nu, bygge när en kund kräver det |

**Om bara en sak görs:** Etapp 53. Den gör inte produkten större – den gör att allt som redan
är byggt faktiskt når en människa.

**Om bara en timme finns:** Etapp 57a. Ett säljdokument som påstår att en av produktens
starkaste funktioner är avstängd är den billigaste möjliga förlusten att undvika.
