# Etapplan 15 – Ansvar som når fram: fyra tillägg på redan byggd grund

*Utkast 2026-08-14. Samtliga fyra delmål (66a–66d) är nu KLARA, byggda ett i taget samma dag
på ägarens uttryckliga begäran, och deployade 2026-08-15 (körning #78, commit `ef7c841`) – se
respektive delmål nedan för vad som genomfördes och eventuella avvikelser mot
ursprungsskisserna.*

**Bakgrund:** ägaren lade fram nio funktionsidéer. En premisskontroll mot faktisk kod
(genomgående krav 8) gjordes innan planen skrevs, och den flyttade gränsen mellan idéerna
rejält: **tre av dem var helt eller till största delen redan byggda, en byggde på en premiss
som inte stämde, och tre bör inte byggas nu.** Kvar blev fyra tillägg som alla vilar på redan
existerande datamodeller – ingen av dem är ett nybygge från grunden.

Det som medvetet INTE tas med, och varför, står i "Vad jag INTE föreslår" längst ner. Läs den
sektionen innan någon återföreslår något därifrån – två av punkterna där är redan avfärdade
en gång tidigare, och en tredje är juridiskt blockerad av samma skäl som Etapp 64.

---

## Premisskontroll (krav 8) – fyra fynd som ändrade planen

| Idé i ägarens lista | Vad koden faktiskt visar |
|---|---|
| "Rutinhål-detektor – behåll funktionen i sin helhet" | ✅ **Redan helt byggd.** `SokFalt.jsx` loggar varje sökning på ≥3 tecken som ger noll träffar till collectionen `sokloggar` (läsbar för superadmin), med `hittaPersonnummer()`-spärr så att ett personnummer aldrig kan hamna där. **Inget att bygga.** Den verkliga frågan är om någon LÄSER datan – samma "gör befintlig mätning åtgärdbar"-tema som `ETAPPLAN12.md` Etapp 62. |
| "Förbättringsförslag till ansvariga" | ⚠️ **~90 % redan byggt** (rättat vid byggstart, se 66a:s "Genomfört" – den första premisskontrollen sa "~80 %" och "ingen notis går till den ansvariga", vilket var oprecist). `ForeslaAndringModal.jsx`, `skapaForslag()`, `MinaForslag.jsx`, godkännandekön och "Ni sa, vi gjorde" finns alla – **och en notis om nya förslag finns redan**, men går till ALLA redaktörer för området i stället för till rutinens `agare`. **Luckan är routingen, inte notisen.** Byggs som 66a. |
| "Incident- och driftstörningslogg – behåll i sin helhet" | ⚠️ **Delvis byggd.** `skiftrapporter` gör redan precis det (hookens egen kommentar: "vattenläcka i taket", "slut på sutur-set"), plus `bristanmalningar` för förrådet. **Luckan är kopplingen till rutiner och kategorisering.** Byggs som 66d. |
| "Ansvarsområden – kan utökas för att täcka fler områden än medicinteknik" | ❌ **Premissen stämmer inte.** Ordet "medicinteknik" förekommer **inte en enda gång** i `src/` eller `functions/`. Det finns ingen medicinteknikpanel att utöka. Det som finns är `rutin.agare` – ansvar per RUTIN, inte per OMRÅDE, och inte synligt i användarprofilen. Idén är alltså ett nybygge, inte en utökning. Byggs som 66c, med den skillnaden tydliggjord. |

**Konsekvens:** etappen blir fyra riktade tillägg på existerande fundament, inte nio nya
funktioner.

---

## Nytt genomgående krav

28. **En signatur eller ett intyg om en annan människa får aldrig kunna sättas av personen
    själv.** Nytt 2026-08-14, av 66b. En läskvittering (`lasteAv`) är en självdeklaration och
    ska förbli det. Men i det ögonblick systemet börjar lagra att NÅGON ANNAN intygar att en
    person kan något, är dokumentet av ett annat slag: det kan åberopas i en
    patientsäkerhetsutredning eller ett arbetsrättsligt ärende. Spärren mot självsignering får
    därför inte ligga i gränssnittet, utan i `firestore.rules` – den är enkel att uttrycka där
    (`request.auth.uid != uid`) och omöjlig att kringgå. Samma resonemang som redan gjorde att
    rolländringar flyttades till en Cloud Function med revisionsloggning (Etapp 32c).

---

## Etapp 66 – Ansvar som når fram

Fyra oberoende delmål, byggbara i valfri ordning och var för sig releasebara.

### 66a – ✅ KLAR (2026-08-14) – Ett förbättringsförslag når fram till den som äger rutinen

**Idé:** ett förslag på en rutin med en utpekad ansvarig ska nå just den personen, inte
drunkna i en lista hos alla redaktörer för hela området.

**Premisskontroll (krav 8) – ett fynd som formar designen:**
- `rutin.agare` finns redan och sätts i `RutinFormular.jsx` som `{ typ: "roll" | "person",
  roll?, uid?, namn? }`. Mottagaren är alltså redan känd, inget nytt fält behövs.
- `useNotiser.js` aggregerar REDAN ändringsförslag (den läser `useAndringsforslag` per område
  och bygger notiser av dem) – notiskanalen finns, den saknar bara den här notistypen.
- **Begränsning som måste hanteras, inte antas bort:** `useAndringsforslag(omrade)` kräver
  redigeringsrätt för området för att listfrågan alls ska tillåtas – Firestores regelmotor kan
  annars inte bevisa `farRedigeraOmrade(resource.data.omrade)` (hookens egen kommentar säger
  detta rakt ut). **En `agare` som är en namngiven person UTAN redaktörsroll kan alltså inte
  läsa förslaget överhuvudtaget**, och kan därför inte heller notifieras meningsfullt.

**Två vägar, avgörs vid byggstart:**
- **(a) Notifiera bara `agare` som redan har redigeringsrätt.** Ingen regeländring, ingen ny
  fråga, rent klientderiverat ur redan laddad data. I praktiken täcker detta de flesta fall –
  en rutinägare är normalt VÖL/sektionsledare/VEC, alltså redan redaktör. **Rekommenderas som
  steg ett.**
- **(b) Vidga läsrätten så att en namngiven `agare` får läsa förslag på sina egna rutiner.**
  Kräver ett `get()` mot föräldrarutinen i regeln, alltså regelbudget – samma sorts ingrepp som
  `farLasaVersioner()` i Etapp 65b. Bygg bara om (a) visar sig otillräckligt i praktiken.

**Bygge (alternativ a):**
- `useNotiser.js`: ny notistyp "Nytt ändringsförslag på en rutin du är ansvarig för" –
  matchar `forslag.rutinId` mot rutiner där `agare.uid == currentUser.uid` eller
  `agare.typ == "roll" && agare.roll == role`. Ren klientberäkning på redan laddad data,
  ingen ny Firestore-fråga, ingen ny collection, ingen regeländring.
- E-postpåminnelse ligger UTANFÖR det här delmålet: `skickaEpost()` no-oppar tyst utan
  `BREVO_API_KEY`, som väntar på ett tecknat avtal (se `OPPNA-PUNKTER.md`). In-app-notisen
  fungerar oberoende av det, och är det som byggs här.

**Klart när:** en VÖL som står som `agare` på en rutin ser ett nytt ändringsförslag på den
rutinen i sin notisklocka, utan att först behöva öppna godkännandekön.

**Genomfört (2026-08-14) – med en rättelse av planens egen premisskontroll:**

- **Premisskontrollen ovan var oprecis och rättades vid byggstart.** Den påstod att "ingen
  notis går till den ansvariga". I själva verket fanns notisen redan (`forslagposter` i
  `useNotiser.js`, Etapp 26c) – den gick bara till ALLA redaktörer för området via
  `farGranskaKlinisktStod`/`farGranskaAdministration`, utan att titta på `rutin.agare`.
  **Luckan var alltså routingen, inte notisen**, vilket gjorde delmålet mindre än planerat.
  Rättat i tabellen ovan; noteras här eftersom felet annars ärvs av nästa läsare.
- **En dubblering upptäcktes och togs bort på köpet.** Exakt samma ägarroutinglogik låg
  inline-duplicerad på två ställen i `useNotiser.js` (granskningspåminnelser från Etapp 21a,
  källvarningar från Etapp 21c). När ändringsförslagen blev ett tredje anropsställe
  extraherades den till `arAnsvarigForRutin()` i `src/utils/rutinHjalp.js` – en plats, 8 nya
  enhetstester, och de två befintliga anropsställena ersatta med `.filter(arAnsvarig)`. Tre
  kopior av samma regel hade annars glidit isär förr eller senare.
- **Två små förbättringar utöver planen:** notisen länkar nu till själva rutinen
  (`#rutin-{id}`) i stället för bara till områdessidan – samma ankarmönster som
  granskningsposter/kallvarningposter redan använde – och texten får tillägget
  "(du är ansvarig)" när notisen beror på ägarskap, precis som granskningspåminnelsen redan
  gjorde. En `Map` för rutinuppslagning ersätter en `find()` per förslag.
- **Alternativ (a) valdes**, som planen rekommenderade: ingen regeländring. Begränsningen att
  en namngiven ägare utan redigeringsrätt inte kan notifieras är dokumenterad som en kommentar
  direkt i `useNotiser.js`, så att den inte misstas för en bugg.
- Faller tillbaka på det gamla beteendet (alla redaktörer för området) om rutinen inte hittas
  i den laddade listan – annars hade notisen kunnat försvinna tyst för alla.

**Testat:** 8 nya enhetstester för `arAnsvarigForRutin` (roll, person, fallback, null-hantering,
samt att en utpekad ägare EXKLUDERAR andra redaktörer även när de får redigera området).
`npm run lint`, `npm run build`, `npx vitest run` (212/212) gröna. Ingen ändring i
`firestore.rules`/`storage.rules`/Cloud Functions, ingen ny collection, inget nytt fält, ingen
ny Firestore-fråga. Manuell webbläsarverifiering av notisflödet är inte gjord i den här
sessionen.

---

### 66b – ✅ KLAR (2026-08-14) – Handledarsignering i introduktionen

**Idé:** digitalisera de pappersblanketter där en handledare signerar att en introduktionspunkt
faktiskt gåtts igenom med den nyanställde.

**Premisskontroll (krav 8) – det här är en genuin lucka, och en medveten avvikelse:**
- Introduktionsspår finns (Etapp 19a): `introduktionsspar`, `introduktionstilldelningar/{uid}`
  (dokument-id ÄR uid, en aktiv tilldelning åt gången).
- **Progressen härleds i dag UTESLUTANDE ur `lasteAv`** – alltså den nyanställdes egen
  läskvittering. `introduktionProgress.js` gör ingenting annat. Ingen handledare bekräftar
  någonting, någonstans.
- Etapp 19a valde uttryckligen bort att lagra en parallell "klar"-status
  (`useIntroduktionstilldelningar.js`: *"ingen parallell 'klar'-status lagras, enligt planens
  uttryckliga krav"*). **Det här delmålet avviker medvetet från det**, och skälet är att det
  inte är samma sak: en handledarsignatur är inte en dubblett av elevens egen kvittering, utan
  en oberoende ANDRA bekräftelse från en annan person. Att slå ihop dem vore att förlora
  precis den information funktionen finns för.
- Nuvarande regler: `introduktionstilldelningar` får bara skrivas av `farHanteraAnslag()`
  (VEC/superadmin). **En handledare är i praktiken sällan VEC** – vilket gör en regeländring
  nödvändig, inte valfri.

**Bygge:**
- Ny subcollection `introduktionstilldelningar/{uid}/signeringar/{postNyckel}` med
  `{ postTyp, postId, etappNamn, signeradAv, signeradAvNamn, tidpunkt }`. Subcollection snarare
  än ett map-fält på tilldelningen, så att varje signatur blir ett eget dokument med egen
  regelutvärdering (och så att `bararForandrarFalt`-mönstret på föräldern kan lämnas orört).
- **Regeln bär integriteten, inte gränssnittet** (nytt genomgående krav 28):
  `allow create: if arInloggad() && !arKiosk() && matcharMinOrg(...)
   && request.resource.data.signeradAv == request.auth.uid
   && request.auth.uid != uid` – den sista klausulen gör det **omöjligt att signera sin egen
  introduktion**, oavsett vad klienten skickar. `update` bör vara helt stängd (en signatur
  ändras inte i efterhand); `delete` begränsas till `farHanteraAnslag()` för att kunna rätta
  ett misstag, och den raderingen syns i revisionsloggen.
- Ny testfil `tests/rules/introduktionssigneringar.test.mjs` + rad i `test:rules`-kedjan.
  Minst: att en handledare KAN signera någon annans punkt, att ingen kan signera sin egen, att
  en annan organisation inte kommer åt, att `update` är stängd.
- `Introduktion.jsx`: signaturknapp per punkt för den som inte är personen själv, samt en
  synlig "signerad av X, datum" bredvid elevens egen kvittering – de två visas SEPARAT, aldrig
  hopslagna till en enda bock.

**Obligatorisk följdåtgärd i samma commit** (`CLAUDE.md`s underhållsregel för
incidentdokumenten): en ny collection med personuppgifter kräver uppdatering av
`INCIDENT-CHECKLISTA.md` steg 5 och `avtal/INCIDENTRESPONSPLAN.md` avsnitt 2. Missa inte det –
signaturer är personuppgifter om BÅDE eleven och handledaren.

**Ägarbeslut som behöver tas innan eller i samband med bygget:** hur länge sparas en
signatur? Den har bevisvärde och träffar därmed samma fråga som redan är öppen om
revisionsloggens gallringstid (`JURIDISK-GRANSKNING.md` §4.4, se `OPPNA-PUNKTER.md`). Bygg
inte in "sparas för alltid" tyst – det är exakt det påstående granskningen underkände på
annat håll.

**Klart när:** en handledare kan signera en genomgången introduktionspunkt för en annan
person, signaturen syns skild från personens egen kvittering, och ett försök att signera sin
egen introduktion avvisas av reglerna – inte av gränssnittet.

**Genomfört (2026-08-14):**

- **Regler exakt som skisserat:** `firestore.rules` fick `introduktionstilldelningar/{uid}/
  signeringar/{postNyckel}` med genomgående krav 28 uttryckt som `request.auth.uid != uid` i
  `create`. `update` är helt stängd; `delete` kräver `farHanteraAnslag()`. Läsning: personen
  själv för sina egna, `farHanteraAnslag()` (VEC/superadmin) för andras i samma organisation –
  en vanlig kollega utan hanteringsrätt kan alltså SKRIVA en signatur men inte fritt LÄSA
  någon annans, vilket testades explicit (se nedan).
- **`postNyckel` valdes deterministisk** (`{typ}:{id}`, samma konvention som `innehallMap` i
  `Introduktion.jsx` redan använder), inte ett auto-id. Det gör dubbelsignering av samma punkt
  strukturellt omöjlig: ett andra `setDoc`-försök mot en redan signerad nyckel är ur reglernas
  perspektiv en UPDATE (dokumentet finns redan), och den är stängd – testat explicit.
- **UI-avvikelse från planens ordval, medveten:** "en handledare" har ingen egen roll i
  systemet (bekräftat vid premisskontrollen – ingen `ROLES.HANDLEDARE` finns). Signeringsknappen
  byggdes därför in i chefsvyns befintliga "Pågående introduktioner"-lista (redan gated till
  `farHanteraAnslag()`), som en ny expanderbar `PagagendeTilldelning`-radkomponent – en egen
  komponent krävdes eftersom varje rad behöver sin egen `useIntroduktionssigneringar(uid)`-
  prenumeration, vilket inte går att anropa inuti en `.map()` (samma mönster som `RutinKort.jsx`
  redan etablerat: varje rad äger sina egna hooks). **Skriv-regeln är ändå bredare** – vem som
  helst inloggad (utom kiosk) i organisationen kan signera, inte bara VEC/superadmin – så en
  framtida bredare läsyta (om en riktig handledarroll införs) kräver ingen regeländring, bara
  en ny UI-ingång.
- Personens egen vy (`minTilldelning`/`mittSpar`) visar nu signaturen bredvid varje punkt,
  hämtad via samma `useIntroduktionssigneringar`-hook med det egna uid:t – separat från
  `✅`/`⬜`-kvitteringen, aldrig hopslagen, exakt som planerat.
- **Liten UX-detalj utöver planen:** "Signera"-knappen döljs (ersätts av en förklarande text)
  om raden råkar gälla den inloggades EGEN tilldelning, så att ett dömt-att-misslyckas
  regelavvisat försök aldrig visas för användaren.
- **Ägarbeslutet om gallringstid är INTE taget.** Ingen radering/gallring byggdes – bara
  `taBortSignering()` för att rätta ett misstag (loggat i revisionsloggen). Frågan är
  tillagd i `OPPNA-PUNKTER.md`s redan öppna rad om revisionsloggens gallringstid, som samma
  underliggande fråga, i stället för en ny separat rad.
- **Obligatorisk följdåtgärd fullgjord, delvis.** `INCIDENT-CHECKLISTA.md` steg 5 uppdaterad
  med den nya collectionen. `avtal/INCIDENTRESPONSPLAN.md` avsnitt 2 (Definitioner) rördes
  INTE – samma precedent som Etapp 64/65b, som inte heller uppdaterade det avsnittet: det
  innehåller generiska definitioner, inte en collection-för-collection-inventering, och ingen
  detektions-/begränsningsförmåga ändras av den här collectionen.

**Testat:** ny testfil `tests/rules/introduktionssigneringar.test.mjs`, 11 tester (skapande,
läsning, radering – inkl. att självsignering avvisas, att organisationsisoleringen håller, och
att en dubblettsignering avvisas). Körda mot Firestore-emulatorn: 11/11 gröna, hela
`test:rules`-sviten fortsatt grön. `npm run lint`, `npm run build`, `npx vitest run` (212/212)
gröna. Manuell webbläsarverifiering av det fulla signeringsflödet är inte gjord i den här
sessionen.

---

### 66c – ✅ KLAR (2026-08-14) – Ansvarsområden på personen, inte bara på rutinen

**Idé:** kunna se vem som ansvarar för vad, och kunna lista sina egna ansvarsområden i
profilen.

**Premisskontroll (krav 8):**
- Som konstaterat ovan: **det finns ingen befintlig medicinteknikpanel att utöka.** Det här är
  ett nybygge.
- `rutin.agare` ger ansvar per rutin. Det är en ANNAN fråga än den här: `agare` svarar på
  "vem äger den här rutinen", `ansvarsomraden` svarar på "vad ansvarar den här personen för
  i stort". De ska komplettera varandra, inte dubblera – panelen sammanfogar dem.
- `users/{userId}`s update-regel: ägaren själv får bara ändra en vitlistad uppsättning fält
  (`bararForandrarFalt([...])`); superadmin får ändra allt utom `role`. VEC kan i dag inte
  ändra användardokument alls.

**Designbeslut som följer direkt av regeln:** `ansvarsomraden` får **inte** läggas i
självbetjäningsvitlistan. Ett ansvarsområde man utser sig själv till är värdelöst som
information – det ska tilldelas, precis som en roll. Fältet sätts alltså av superadmin (och,
om ägaren så vill, VEC – vilket i så fall kräver en regelutvidgning och bör beslutas
uttryckligen, inte glida in).

**Bygge:**
- Nytt fält `users/{uid}.ansvarsomraden: string[]`. Ingen ny collection.
- Adminvy för att tilldela områden; `Profil.jsx` visar den inloggades egna områden
  (läsning, inte redigering).
- En enkel operativ vy: "vem ansvarar för vad", som slår ihop `ansvarsomraden` med de rutiner
  där personen står som `agare`.
- Naturlig koppling till 66a: om ett förslag rör ett område någon ansvarar för kan notisen gå
  dit även när ingen är satt som `agare` på just den rutinen.

**Uttrycklig avgränsning:** det här är INTE ett bemannings- eller schemaverktyg och får inte
växa till ett (se "Vad jag INTE föreslår" nedan). Det svarar på "vem äger den här frågan",
aldrig på "vem arbetar just nu".

**Klart när:** en superadmin kan tilldela ansvarsområden, en användare ser sina egna i
profilen, och det går att slå upp vem som ansvarar för ett givet område.

**Genomfört (2026-08-14):**

- **Fältet:** `users/{uid}.ansvarsomraden: string[]`, kommaseparerad textinmatning
  (`"medicinteknik, brandskydd"` → `["medicinteknik", "brandskydd"]`), exakt samma
  split/trim/filter-mönster som `taggar` redan använder i `RutinFormular.jsx`. Ingen ny
  PII-spärr lades till – matchar precedenset att `taggar` (skrivbart av redaktörer, en bredare
  krets) inte heller har en regelbaserad PII-kontroll; `ansvarsomraden` är dessutom bara
  skrivbart av superadmin, en smalare och mer betrodd krets.
- **Ingen regeländring behövdes**, precis som planen förutsåg – `users/{userId}`s befintliga
  superadmin-gren tillåter redan varje fält utom `role` direkt. **Låst fast med ett NYTT
  regeltest ändå** (`tests/rules/ansvarsomraden.test.mjs`, 4 tester): bekräftar explicit att
  fältet INTE råkat hamna i självbetjäningsvitlistan (`bararForandrarFalt`-listan på
  `request.auth.uid == userId`-grenen) – planens egna designbeslut ("ansvarsomraden får INTE
  läggas i självbetjäningsvitlistan") är annars precis den sortens invariant som kan glida in
  av misstag i en senare ändring utan att synas i diffen.
- **UI:** `AnvandareRollerSektion.jsx` (adminpanelens befintliga "Användare och roller")
  fick ett nytt fält per rad, med en egen liten `AnsvarsomradenFalt`-subkomponent (samma skäl
  som `PagagendeTilldelning` i 66b: varje rad behöver sin egen lokala inputtext). `Profil.jsx`
  visar den inloggades egna områden, läst via en ny `ansvarsomraden`-nyckel i `AuthContext`s
  redan existerande live-prenumeration på det egna användardokumentet (samma mönster som
  `pushInstallningar`/`epostInstallningar`).
- **Den operativa vyn** blev en ny, egen adminsektion `AnsvarsomradenOversiktSektion.jsx`
  ("Vem ansvarar för vad") snarare än att byggas in i `AnvandareRollerSektion`, för att hålla
  redigeringsvyn och läsvyn isär. Den slår ihop `ansvarsomraden` med de rutiner en person äger
  – och återanvänder `arAnsvarigForRutin()` (Etapp 66a) med `farRedigeraOmradet: false` för
  det, istället för att skriva en tredje kopia av samma agare-matchningslogik.
- **Medvetet INTE byggt: kopplingen till 66a** ("om ett förslag rör ett område någon ansvarar
  för kan notisen gå dit"). Skälet: `ansvarsomraden` är fri text utan någon naturlig
  koppling till en specifik rutin eller till `rutin.omrade` (som är en fast enum:
  kliniskt-stod/administration/logistik, ett annat begrepp). Att uppfinna en matchningsregel
  mellan fri text och rutiner hade riskerat att bygga fel sak. Det här stod som en
  "Bygge"-punkt i planen men var inte en del av "Klart när"-kriteriet, så det lämnas kvar som
  en möjlig, inte garanterad, framtida utökning.
- Ingen VEC-utökning byggd – kvar som superadmin-bara, precis som planens designbeslut sa.

**Testat:** 4 nya regeltester (`ansvarsomraden.test.mjs`, körda mot emulatorn, alla gröna) –
hela `test:rules`-sviten fortsatt grön. `npm run lint`, `npm run build`, `npx vitest run`
(212/212) gröna. Ingen ny collection. Manuell webbläsarverifiering av flödet (tilldela →
se i profilen → se i översikten) är inte gjord i den här sessionen.

---

### 66d – ✅ KLAR (2026-08-14) – Driftstörningar kopplade till rutin och åtgärd

**Idé:** kunna kategorisera en driftstörning och länka den till den rutin som gäller.

**Premisskontroll (krav 8):**
- `skiftrapporter` finns och gör redan grundjobbet. Regler: läs = egen org; skapa = valfri
  inloggad icke-kioskanvändare med eget uid och PII-spärr på `text`; uppdatera = **enbart**
  fälten `atgardad`/`atgardadAv` (`bararForandrarFalt`); radera = egen post eller redaktör.
- Ingen kategori, ingen rutinkoppling finns i dag.
- **En spänning värd att lösa medvetet:** `useSkiftrapport.js` har
  `VISNINGSGRANS_TIMMAR = 48` – poster äldre än två dygn döljs som standard. Det är rätt för
  en skiftöverlämning, men fel för en driftstörningslogg som ska gå att följa upp över tid.
  Att bara lägga på fält utan att ta ställning till detta ger en logg som i praktiken glömmer
  allt efter två dygn.

**Bygge:**
- Nya valfria fält på `skiftrapporter`: `kategori` (fast lista, ingen fritext – undviker en ny
  PII-yta) och `rutinId` (länk till åtgärdsstöd).
- **Regeländringar som faktiskt krävs:** `update`s `bararForandrarFalt(['atgardad',
  'atgardadAv'])` gör det i dag omöjligt att koppla en rutin i efterhand. Ska det gå måste
  listan utökas – och det är ett medvetet val, inte en detalj, eftersom samma regel är det som
  hindrar att en skiftrapports text ändras efter publicering. Rekommendation: tillåt `rutinId`
  och `kategori` i efterhand, men lämna `text` fortsatt oföränderlig.
- Ett filtrerbart läge som visar mer än 48 timmar för den som söker historik, utan att ändra
  standardvyn för skiftöverlämning.

**Måste sägas rakt ut, annars blir det farligt:** det här är **inte** samma sak som
`INCIDENT-CHECKLISTA.md` / `avtal/INCIDENTRESPONSPLAN.md`. De dokumenten beskriver
leverantörens hantering av SÄKERHETSINCIDENTER, med rättsliga tidsfrister (72-timmarsfristen i
`avtal/PUB-AVTAL-MALL.md` p. 8). En verksamhets driftstörningslogg är en helt annan sak. Låt
dem aldrig glida ihop i vare sig gränssnitt eller ordval – en operatör som under press
förväxlar dem letar efter fel checklista.

**Klart när:** en driftstörning kan kategoriseras och länkas till den rutin som gäller, och
det går att se historik längre bak än 48 timmar utan att skiftöverlämningens standardvy blir
plottrig.

**Genomfört (2026-08-14):**

- **Två nya fält:** `skiftrapporter.kategori` (fast lista – `lokal`/`it`/`medicinteknik`/
  `forsorjning`/`ovrigt`, validerad server-side i en ny `arGiltigDriftstorningskategori()`) och
  `rutinId` (fri referens, ingen `get()`-validering av att rutinen finns – samma avvägning
  som `rutin.agare.uid` redan gör, av budgetskäl).
- **Regeländringen exakt som planerad:** `update`s `bararForandrarFalt` utökades till
  `['atgardad', 'atgardadAv', 'rutinId', 'kategori']`. `text` förblir MEDVETET oföränderlig
  efter publicering – oförändrad princip, testat explicit.
- **Ett fel hittades och rättades UNDER byggets gång, inte efteråt:** den första
  regelversionen avvisade ett försök att RENSA kategorin (`kategori: null`), eftersom `null`
  inte fanns i den giltiga listan – det hade gjort "ångra kategorisering" trasigt i
  produktion. Rättat genom att uttryckligen tillåta `null` (samma "explicit null = inget
  valt"-konvention `rutin.agare` redan använder), och låst fast med ett eget testfall.
- **"Hela historiken"-vyn krävde ingen ny Firestore-fråga.** `useSkiftrapport.js`s fråga
  saknade redan en tidsbegränsning (`VISNINGSGRANS_TIMMAR` filtrerar bara KLIENTSIDAN) – all
  historik fanns alltså redan laddad. Exponerade den bara som ett nytt `alla`-fält från
  hooken, med ett kategori-filter i `Skiftrapport.jsx`, helt skilt från standardvyn (som är
  oförändrad).
- **Namngivningsdistinktionen hölls medvetet isär**, precis som planen krävde: inget i
  gränssnittet eller ordvalet blandar ihop den här driftstörningsloggen med
  `INCIDENT-CHECKLISTA.md`/`avtal/INCIDENTRESPONSPLAN.md`s säkerhetsincidenter.
- **Övervägde men rörde inte incidentdokumenten.** Regeländringen vidgar bara VILKA FÄLT som
  får ändras i efterhand, inte VEM som får ändra – ingen ny detektions- eller
  begränsningsförmåga påverkas, och `kategori`/`rutinId` är ingen personuppgift. Samma
  bedömningsmönster som redan gjordes för Etapp 65b/66b/66c.

**Testat:** ny testfil `tests/rules/skiftrapportkategorisering.test.mjs`, 9 tester (skapande
med/utan/ogiltig kategori, kategorisering/länkning i efterhand av en icke-ägare, att `text`
förblir oföränderlig, att null-rensning fungerar, organisationsisolering). Körda mot
emulatorn: 9/9 gröna, hela `test:rules`-sviten (nu 15 filer) fortsatt grön. `npm run lint`,
`npm run build`, `npx vitest run` (212/212) gröna. Manuell webbläsarverifiering av det fulla
flödet (kategorisera → länka → se i historiken) är inte gjord i den här sessionen.

---

## Vad jag INTE föreslår, och varför

Samma avsnitt som `ETAPPLAN11.md`/`ETAPPLAN12.md`/`ETAPPLAN14.md` har, av samma skäl: så att
en framtida session inte föreslår dem igen utan att känna till invändningen.

### Bemanningsöverblick och scheman – avråds

**Redan avfärdad en gång**, `ETAPPLAN4.md` rad 1030: *"Stort, kräver integration mot regionens
system, och tillför inget om personalen inte redan älskar grundfunktionerna."* Skälen håller
fortfarande, och två till tillkommer:

- **Schemadata är personuppgifter om anställda** – en helt ny GDPR-yta som produkten i dag
  inte har alls, och som drar in arbetsrättslig personuppföljning (samma tema som
  `JURIDISK-GRANSKNING.md` fråga 13 redan tar upp).
- **Regionen har redan ett system** (Medvind, Heroma e.dyl.) som personalen ändå måste använda.
  Ett halvbra parallellschema blir inte använt – exakt samma resonemang som en gång fällde
  chattfunktionen.

**Om det verkliga behovet är "vem ansvarar för vad just nu" – då är det 66c som ska byggas,
inte ett schemaverktyg.**

### Rutin- och flödesschemaverktyg – bra idé, men bryt ner den först

Inte avfärdad, men **för stor och för blandad för att antas som en punkt**. Den innehåller tre
saker med helt olika risk och storlek:

1. **Grafiska mallar för utseendet** (ladda upp verksamhetens profil) – rimligt och avgränsat.
   `OrganisationsBranding` finns redan som grund.
2. **AI-stöd för att formulera rutiner** – skilt från dagens AI-import (`tolkaDokument`), som
   tolkar ett BEFINTLIGT dokument. Att generera nytt kliniskt innehåll är en ny AI-yta mot
   personalen, vilket `ETAPPLAN4.md` uttryckligen avrådde från tills klinikstödet är stabilt.
3. **Flödesscheman** – här ligger risken. **Ett flödesschema ÄR ett beslutsträd.**
   `ETAPPLAN14.md` sköt medvetet upp "förgrenad rutin" av exakt det skälet, och
   `JURIDISK-GRANSKNING.md` §6 konstaterar att argumentet mot MDR-kvalificering vilar på att
   produkten "inte kan räkna eller rekommendera".

   **En nyans värd att ta med till juristen:** att tillhandahålla ett RITVERKTYG är inte samma
   sak som att tillhandahålla INNEHÅLLET. Ett statiskt diagram som kunden själv ritar och
   godkänner ligger betydligt längre från kvalificering än en interaktiv körvy som leder
   användaren gren för gren. **Om detta byggs: börja med statiska diagram, aldrig med en
   interaktiv beslutsmotor.**

**Ett argument som är värt mer än det låter:** "utan att behöva använda Google Dokument"
betyder att verksamhetens rutinutkast aldrig lämnar systemet till en tredje part. Det är ett
riktigt integritetsargument i en upphandling, inte bara bekvämlighet.

**Rekommendation:** ta punkt 1 som en egen liten etapp när det blir aktuellt. Låt punkt 2 och
3 vänta på samma juristsvar som Etapp 64.

**Åtgärd, redan vidtagen:** flödesschemafrågan – och särskilt skillnaden mellan ett statiskt
diagram och en interaktiv gren-för-gren-vy – är tillagd som fråga 22 i
`JURIDISK-GRANSKNING.md` §18.

### AI-sammanfattning av kunskapsstöd – vänta på juridiken

Det här är **inte en ny fråga – det är Etapp 64:s fråga, fast vassare.** Etapp 64
(`ETAPPLAN13.md`) är redan blockerad i väntan på extern juridisk bedömning, på exakt dessa
grunder, och genomgående krav 26 säger uttryckligen att licensierat innehåll aldrig får
reproduceras.

**En "lokalt anpassad sammanfattning" av ett nationellt kunskapsstöd är ett bearbetat verk i
upphovsrättslig mening.** Och detta måste sägas rakt ut, eftersom idéns egen formulering
antyder motsatsen: **"alltid med mänsklig kontroll" löser INTE upphovsrättsfrågan.** Mänsklig
granskning gör inte ett intrång till ett icke-intrång. Den hjälper mot MDR-argumentet och mot
AI-förordningens transparenskrav – men inte mot upphovsrätten.

**Åtgärd, redan vidtagen:** frågan är tillagd som fråga 20 i `JURIDISK-GRANSKNING.md` §18, så
att den kommer med i SAMMA juridiska uppdrag som Etapp 64 i stället för att kräva ett nytt
senare.

### Patientinformation – vänta, och skilj på två fall

Hänger ihop med föregående, men har en egen skiljelinje som avgör risken:

- **Generella patientbroschyrer** ("så här sköter du ett gipsat ben") är i praktiken bara en ny
  innehållskategori vid sidan av rutiner – billigt och lågrisk.
- **Individanpassad information** är något helt annat och drar rakt mot MDR-kvalificering.

Dessutom: appen har i dag **ingen mekanism alls för att dela innehåll utanför organisationen**.
Det är en ny distributionsyta med egna frågor (vem ansvarar för innehållet när det lämnat
verksamheten, hur återkallas en felaktig broschyr som redan delats ut).

**Åtgärd, redan vidtagen:** tillagd som fråga 21 i `JURIDISK-GRANSKNING.md` §18.

---

## Sammanfattning

| Delmål | Vad | Ny regeländring? | Ny datamodell? | Insats |
|---|---|---|---|---|
| 66a | Förslag når rutinens ägare (notis) | Nej (alt. a) | Nej | Liten – ✅ **KLAR 2026-08-14 (v5.103.0)** |
| 66b | Handledarsignering i introduktionen | **Ja** (ny subcollection + självsigneringsspärr) | Ja (subcollection) | Medel – ✅ **KLAR 2026-08-14 (v5.104.0)** |
| 66c | Ansvarsområden på personen | Nej (superadmin fick redan skriva fältet) | Nytt fält på `users` | Medel – ✅ **KLAR 2026-08-14 (v5.105.0)** |
| 66d | Driftstörning → kategori + rutinkoppling | **Ja** (`bararForandrarFalt` utökas) | Nya fält på `skiftrapporter` | Liten–medel – ✅ **KLAR 2026-08-14 (v5.106.0)** |

Alla fyra är Core-funktionalitet (ingen feature-gating) och oberoende av `ETAPPLAN13.md`s
juridiska blockering. **66a är den billigaste och rekommenderas först**; **66b är den med
störst verklig nytta** (ersätter faktiskt papper och stänger en riktig lucka), men bär också
den enda nya rättsliga vikten i etappen – läs dess ägarbeslut om gallringstid innan bygget
startar.
