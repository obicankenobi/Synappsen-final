# Synappsen – produktdefinition och regulatoriskt underlag

**Datum:** 2026-09-03
**Kodläge:** v5.139.0, gren `claude/compassionate-euler-rho0q5`, commit `f905f1f6`
**Status:** internt faktaunderlag, skrivet för att lämnas till en anlitad jurist.
**Ersätter inget.** Kompletterar `granskningar/JURIDISK-GRANSKNING.md` (analysen) genom att
leverera det den saknar: en **kodverifierad beskrivning av vad produkten faktiskt är**.

---

## 0. Läsanvisning – vad det här dokumentet är, och varför det behövs

`granskningar/JURIDISK-GRANSKNING.md` är projektets juridiska analys. Den är omfattande och
i huvudsak träffsäker, men dess eget avsnitt 0 redovisar en avgörande begränsning:

> *"Premisskontroll tillämpad på mig själv. Jag har läst dokumentationen, inte koden. […]
> Varje påstående nedan om vad produkten* gör *är därför i praktiken ett påstående om vad
> dokumentationen* säger *att den gör."*

När de påståendena senare kontrollerades mot koden visade sig **ett av dem vara direkt
felaktigt, och det var det som bar MDR-slutsatsen** (se § 9.2 nedan). Det är precis det
mönster projektets genomgående krav 8 finns för att fånga.

En extern juridisk bedömning som utgår från analysen ärver därför analysens premisser. Det
här dokumentet är avsett att brytas loss från den kedjan: **varje sakpåstående nedan är
kontrollerat mot koden i v5.139.0 och försett med filhänvisning**, så att juristen kan
verifiera det själv i stället för att lita på en sammanfattning.

Tre saker det här dokumentet medvetet **inte** gör:

- Det drar inga juridiska slutsatser. Det levererar underlaget för dem.
- Det städar inte bort obekväma fakta. § 9 och § 10 listar de ställen där produkten avviker
  från vad projektets egna dokument påstår om den.
- Det ersätter inte juridisk rådgivning. Det är skrivet av en kodsession, inte av en jurist.

**Så här är det tänkt att användas:** § 1–8 är beskrivningen (vad produkten är), § 9–10 är
det som gör bedömningen svår (diskrepanser och overifierade premisser), § 11 är frågorna som
behöver besvaras, § 12 är vad granskaren behöver få tillgång till.

---

## 1. Snabbfakta

| Fråga | Svar | Verifierat mot |
|---|---|---|
| Vad är det tekniskt? | Installerbar webbapp (PWA), React + Firebase. Ingen nedladdningsbar binär, ingen hårdvara | `package.json`, `vite.config.js` |
| Levereras hur? | SaaS. Alla kunder på samma kodbas, logiskt isolerade per organisation | `firestore.rules` (`matcharMinOrg()`) |
| Vem är användaren? | Personal på en vårdenhet (akutmottagning). Aldrig patienter, aldrig allmänheten | `src/firebase/roles.js` |
| Antal betalande kunder | **Noll.** Ingen pilot, inget tecknat avtal | Bevakat av `tests/docs/dokumentpastaenden.test.js` (§ "Påståenden om att det saknas betalande kunder") |
| Är produkten utsläppt på marknaden? | **Nej** i MDR:s mening. Den är byggd och deployad, men inte tillhandahållen mot ersättning till någon | Följer av raden ovan |
| Leverantörens form | Enskild firma. Aktiebolag rekommenderat men ej bildat | `granskningar/JURIDISK-GRANSKNING.md` § 3 |
| CE-märkning | Nej. Produkten görs inte gällande som medicinteknisk | – |
| Version vid bedömningen | 5.139.0 | `package.json` |

**Marknadsstatusen i rad 5 är juridiskt betydelsefull och underutnyttjad i projektets övriga
material.** Flera skyldigheter i både MDR och AI-förordningen knyts till *utsläppande på
marknaden* eller *ibruktagande*. Att produkten ännu inte är det innebär att det fortfarande
är billigt att ändra på avgränsningar som senare blir dyra – och att en bedömning som görs nu
kan påverka konstruktionen i stället för att bara beskriva den.

---

## 2. Vad Synappsen är – funktionell definition

Den kortaste korrekta beskrivningen:

> **Synappsen är ett internt kunskaps- och kommunikationsverktyg för en vårdenhet. Det lagrar,
> versionshanterar, distribuerar och gör sökbart de styrdokument som vårdgivaren själv har
> skrivit och själv har godkänt, samt stödjer den administrativa driften runt dem (förråd,
> kontakter, anslag, skiftöverlämning, introduktion).**

Tre egenskaper bär hela den regulatoriska positionen och bör läsas som en enhet:

1. **Innehållet är kundens eget.** Rutinerna skrivs, granskas och godkänns av kundens egen
   personal i kundens egna roller. Leverantören författar inte kliniskt innehåll. Det enda
   leverantörskurerade innehållet i produkten är övningsfrågor om yrkes- och regelkunskap
   (§ 4.7) och referenslänkar utan innehåll (`baspaketreferenser`).
2. **Ingen patient finns någonstans i flödet.** Det finns inget patientidentifierarfält i
   datamodellen, ingen inmatningsyta för patientdata, och tre oberoende tekniska lager som
   aktivt motverkar att sådan data hamnar där ändå (§ 6).
3. **Produkten räknar inte och rekommenderar inte.** Den återger. Ingen funktion beräknar en
   dos, poängsätter en risk, rangordnar behandlingsalternativ eller föreslår en åtgärd för en
   enskild patient.

Om någon av de tre punkterna bryts ändras bedömningen i grunden. De bör därför behandlas som
produktens definierande gränser, inte som nuvarande egenskaper.

---

## 3. Vad Synappsen inte är

Den negativa definitionen är juridiskt lika viktig som den positiva, eftersom MDR-kvalificering
avgörs av *avsett ändamål* och inte av teknisk kapacitet. Följande påståenden är kontrollerade
mot koden:

| Synappsen är INTE … | Grund i koden |
|---|---|
| … ett journalsystem | Inget patientidentifierarfält finns i någon collection. Checklistkörningar loggas aggregerat utan personkoppling till patient (`checklistkorningar/{rutinId}`) |
| … ett beslutsstöd för enskild patient | Ingen funktion tar patientdata som input. Klinikstöd-sökningen avvisar frågor som rör identifierbar person (`functions/klinikstod.js`, promptregel 6) |
| … en dos- eller riskkalkylator | Ingen beräkningsfunktion finns. Checklistsegets fält är `{text, bild, varning, timerSekunder}` – men se § 9.2, spärren sitter i klienten, inte i regellagret |
| … ett triageringssystem | Ingen prioritering, rangordning eller poängsättning av patienter förekommer |
| … ett läkemedelsregister | FASS ingår som en av sju sökbara externa källor, men innehållet lagras inte och tolkas inte |
| … ett system som bedömer personal med AI | Kompetensmatris och kvitteringsgrad är deterministiska beräkningar utan AI-inslag. Övningsläget sparar inga svar alls |
| … en medicinteknisk produkt enligt tillverkarens anspråk | Ingen CE-märkning, inget sådant anspråk görs – **men se § 9.1, en rad i gränssnittet säger fortfarande "Beslutsstöd"** |
| … ett system med patientkontakt | Ingen patient har konto, åtkomst eller inmatningsmöjlighet. Rollen `kiosk` är en delad enhet för personal, inte en publik terminal |

---

## 4. Funktionsinventering med regulatorisk relevans

Kodverifierad genomgång av samtliga användarvända ytor (`src/App.jsx`, routetabellen).

### 4.1 Rutindatabasen (kärnan)

Kundens egna styrdokument, med versionshistorik, diff, granskad-av-signatur, revideringsdatum,
ägare och kvitteringsfunktion med deadline. Roller: `superadmin` och `vol` godkänner kliniskt
innehåll, `sektionsledare` redigerar, `personal` läser och kvitterar
(`src/firebase/roles.js`).

**Regulatoriskt:** detta är kundens ledningssystem enligt patientsäkerhetslagen (2010:659)
3 kap. och HSLF-FS 2011:9. Kvitteringsfunktionen är i praktiken bevis för att personalen tagit
del av en uppdaterad rutin. Lagring, arkivering och kommunikation av befintliga dokument
kvalificerar normalt inte som MDSW (MDCG 2019-11 steg 3).

### 4.2 Checklistläge (`/checklista/:rutinId`)

Återger en godkänd rutin steg för steg med valfri timer. Maximalt 12 steg (`firestore.rules`,
`arKortStegLista`).

**Regulatoriskt: gränsfall, i dag på rätt sida.** Ingen beräkning, ingen rekommendation – bara
kundens eget godkända innehåll i annan layout. **Se § 9.2 för varför den premissen är svagare
underbyggd än projektets övriga dokument påstår.**

### 4.3 Akutläge (`/akutlage`) och driftstoppsläge (`/driftstopp`)

Två kurerade helskärmslägen som visar en delmängd godkända rutiner, garanterat cachade för
offline. Endast `superadmin`/`vol` får flagga en rutin till dessa lägen (`firestore.rules`,
fältspärr i `farUppdateraRutin`).

**Regulatoriskt:** urvalet är kundens eget, gjort av kundens egen kliniskt ansvariga roll.
Ingen prioriteringslogik finns – ordningen sätts manuellt av kunden. Att systemet är
tillgängligt vid IT-avbrott är enligt `granskningar/JURIDISK-GRANSKNING.md` § 5.3 en
patientsäkerhetsfråga för kunden, vilket gör driftstoppsläget till en riskreducerande, inte
riskhöjande, funktion.

### 4.4 Klinikstöd-sökningen (`/kliniskt-stod`)

Den mest regulatoriskt känsliga funktionen. Söker via domänbegränsad Google Programmable
Search Engine mot **sju** namngivna källor, filtrerar träffarna en andra gång server-side, och
låter Gemini sammanfatta enbart de faktiska träffarnas utdrag med obligatorisk källhänvisning
per påstående (`functions/klinikstod.js`).

Godkända källdomäner (`GODKANDA_KALLDOMANER`, rad 34–42): `internetmedicin.se`, `1177.se`,
`nationelltklinisktkunskapsstod.se`, `fass.se`, `lakemedelsverket.se`, `vardhandboken.se`,
`folkhalsomyndigheten.se`.

**Regulatoriskt:** har en egen avgränsningsanalys i
`granskningar/AVSETT-ANDAMAL-KLINIKSTOD-2026-08-30.md`. Kärnan där: MDCG 2019-11 undantar
*inte* en NLP-sökning som bidrar till ett medicinskt syfte bara för att "simple search" är
undantaget. Skyddet ligger i att funktionen är beskriven och marknadsförd som hjälp att
*hitta*, inte som stöd för ett *beslut*. **Se § 9.1 – gränssnittet håller inte den gränsen i
dag.**

### 4.5 AI-tolkning av dokument och bilder

Fyra AI-beroende funktioner, samtliga via `gemini-2.5-flash` (`functions/ai-import.js`):

| Funktion | Vad den gör | Utfall |
|---|---|---|
| `tolkaDokument` | Foto/PDF → rutinutkast | Utkast, kräver mänskligt godkännande |
| `tolkaForradsbild` | Foto av förrådshylla → artikellista | Utkast |
| `foreslaChecklistSteg` | Rutintext → förslag på steg | Förslag, redigerbart |
| `foreslaKvissfragor` | Rutintext → förslag på övningsfrågor | Förslag, redigerbart |

**Gemensam egenskap som bär bedömningen:** ingen av dem publicerar något. Samtliga producerar
utkast som en behörig människa måste granska och godkänna innan det blir synligt innehåll.
Människan i loopen är strukturell, inte en policy.

### 4.6 Administrativa moduler

Förråd med bristanmälan, kontaktlista, anslagstavla, skiftrapport, länkbibliotek,
kompetensmatris, introduktionsspår, ledningsrapport, personalpuls. Ingen av dem har någon
koppling till enskild patient.

**Regulatoriskt relevant detalj:** kompetensmatris, kvitteringsgrad per person och
aktivitetsstatistik utgör i praktiken **kontroll av arbetstagare**. För en offentlig
arbetsgivare aktualiserar det en dokumenterad intresseavvägning och förhandlingsskyldighet
enligt 11 § MBL. Personalpulsen har en minsta-n-spärr på fem svar; referensunderlaget har
ingen (`granskningar/JURIDISK-GRANSKNING.md` § 4.1).

### 4.7 Övningsläget (`/ova`)

Kvissfrågor från tre källor: kundens egna rutiner, kundens egna frågor, och leverantörskurerade
frågor om yrkes- och regelkunskap. **Inga svar sparas någonstans** – varken resultat, poäng
eller streaks.

**Regulatoriskt:** har en egen fullständig MDR-bedömning i
`granskningar/MDR-BEDOMNING-OVNINGSFRAGOR-2026-08.md`, som drar slutsatsen att generella
faktafrågor utan patientdata inte kvalificerar (MDCG 2019-11 steg 4, MDR skäl 19). Samma
dokument fastställer att **avsaknaden av sparade svar är den juridiska spärr som håller
funktionen utanför AI-förordningens bilaga III p. 3** (utbildningssystem som utvärderar
läranderesultat). Att införa poäng eller resultatuppföljning skulle alltså flytta
bedömningen – det är inte en produktdesignfråga utan en regulatorisk.

Det leverantörskurerade innehållet är i dag begränsat till "spår 1": yrkes- och regelkunskap
som följer av lag (PSL, PDL, OSL, SoL) och därför är nationellt enhetlig och stabil. "Spår 2"
(kliniska sakfrågor) har byggt maskineri men **tomt innehåll**, i väntan på extern bedömning.

---

## 5. Datamodell och personuppgifter

**49 Firestore-collections** (`firestore.rules`). Samtliga verksamhetsnära collections är
scopade under `organisationer/{orgId}` och isoleringen är enforcerad i databasreglerna, inte i
gränssnittet – verifierat av en egen automatiserad testsvit
(`tests/rules/organisationsisolering.test.mjs`) som körs vid varje release.

### Personuppgifter som behandlas

Endast om **kundens egen personal** (`avtal/DPIA-UNDERLAG.md` punkt 3):

- Namn, e-postadress, yrkesroll/befattning (`users/{uid}`).
- Inloggningshistorik och kontots aktivitet i systemet – vilka rutiner personen skapat,
  redigerat eller kvitterat. Detta är en **avsedd spårbarhetsfunktion**, inte en biprodukt.
- Fritext som personalen själva skriver, avsedd att uteslutande handla om verksamheten.
- Vid frivillig 2FA: en TOTP-hemlighet kopplad till kontot.

**Inga särskilda kategorier av personuppgifter** (art. 9) är avsedda eller kända att förekomma.

### Revisionsloggen – den svåraste GDPR-punkten

Hashkedjad, med daglig automatisk integritetskontroll. `avtal/PUB-AVTAL-MALL.md` punkt 6 säger
i dag att organisationens revisionslogg **"raderas ALDRIG"**, formulerat som en styrka.

Det är den formulering en granskande jurist kommer att fastna på (lagringsminimering, art.
5.1 e). Kodverifieringen i `granskningar/JURIDISK-GRANSKNING.md` § 4.4 visade dessutom att den
naturliga lösningen – pseudonymisering i efterhand – är **tekniskt omöjlig** mot den befintliga
implementationen, eftersom `aktorUid` ingår i den hashade posten och varje efterhandsändring
per konstruktion detekteras som manipulation. Den framkomliga vägen är segmentgallring med
ankarposter. **Detta är en öppen, obeslutad fråga.**

---

## 6. Spärrarna mot patientuppgifter

Tre oberoende lager (`avtal/DPIA-UNDERLAG.md` punkt 2), samtliga verifierade i kod:

1. **Klientkontroll** – varje fritextfält kontrolleras i webbläsaren mot personnummermönster
   före sparning.
2. **Servervalidering** – flöden som går via en Cloud Function kontrolleras även server-side
   med datumvalidering + Luhn-checksumma, oavsett vad klienten skickade.
3. **Regelnivåspärr** – `firestore.rules` nekar skrivning av fält vars innehåll matchar ett
   sannolikt personnummer, oavsett skrivväg (`harTroligtPersonnummer`, rad 205 ff.).

Lager 3 är det starkaste, eftersom det inte går att kringgå med en egen klient. Det är också
det som visade sig ha en verklig brist under sommaren 2026 (mönstret fångade bara fält vars
*hela* innehåll var ett personnummer, inte ett inbäddat i löptext) – bristen är rättad och
kommentaren i regelfilen dokumenterar den.

**Den ärliga begränsningen, som ska stå kvar i varje kundvänt dokument:** inget textfilter kan
hindra en användare som aktivt vill kringgå varningarna. Spärrarna är ett skyddsnät, inte en
garanti. Ett personnummer är dessutom bara en av flera möjliga patientidentifikatorer –
initialer, rumsnummer och födelsedatum fångas inte av något lager.

---

## 7. AI-komponenterna – underlag för AI-förordningen

Fem AI-beroende ytor, samtliga byggda på Googles `gemini-2.5-flash`. Leverantören tränar ingen
egen modell och finjusterar ingen modell.

**Rollbestämning:** Synappsen är sannolikt **leverantör (provider)** av ett AI-system –
produkten släpps ut under eget namn med AI-funktionalitet inbyggd. Kunden är **deployer**.
Google är leverantör av GPAI-modellen. Att modellen är någon annans befriar inte.

**Preliminär riskklassificering (inte högrisk), med de tre gränser som skulle ändra den:**

| Bilaga III-punkt | Bedömning | Vad som skulle flytta den |
|---|---|---|
| p. 3, utbildning | Utanför | Om övningsläget började spara resultat eller utvärdera läranderesultat |
| p. 4, anställning/arbetsledning | Utanför | Om någon AI-funktion kopplades till bedömning, rangordning eller uppföljning av enskild personal |
| p. 5, väsentliga tjänster inkl. triagering | Utanför | Om produkten någonsin *tillämpade* ett triageinstrument i stället för att länka till det |

Därtill: art. 6.1 – om produkten någonsin kvalificerades som medicinteknisk med krav på anmält
organ blir AI-komponenten automatiskt högrisk. **MDR-gränsen och AI-gränsen är samma gräns
sedd från två håll.**

**Artikel 50 (transparens), tillämplig sedan 2 augusti 2026.** Produkten märker AI-tolkat
innehåll i `src/components/RutinKort.jsx` (badge "AI-tolkat ursprung" när `rutin.kalla ===
"gemini"`) och förklarar i `src/pages/Hjalp.jsx` att AI-tolkat innehåll alltid skapas som
utkast som måste godkännas. Ordvalet "AI-tolkat" är medvetet valt framför
"AI-driven"/"smart"/"intelligent" (`produkt/VARUMARKE.md`).

**Ej verifierat:** om den märkningen är tillräcklig i art. 50:s mening, och om den
maskinläsbara märkningen enligt art. 50.2 (uppskjuten till 2 februari 2027 för system som
fanns på marknaden före 2 augusti 2026) är tillämplig givet att produkten ännu inte är utsläppt
på marknaden.

---

## 8. Dataflöden ut ur EU/EES

| Mottagare | Vad som skickas | Region | Status |
|---|---|---|---|
| Google Cloud Functions | All serverlogik | europe-west1 | ✅ Verifierat i kod |
| Firestore + Storage | All kunddata | **Ej verifierad** | ❌ Öppet sedan 2026-07-26. Kräver konsolkontroll, inte kodändring |
| Sentry | Felmeddelanden, stacktraces | EU (Frankfurt) | ✅ Verifierat (`ingest.de.sentry.io`) |
| Brevo | E-postadresser + innehållslös notistext | Frankrike/EU | ⚠️ I drift, **PUB-avtal saknas** |
| Gemini API | Bild-/dokumentinnehåll, sökträffsutdrag, rutintext | **Ingen regionsgaranti** | ❌ Publikt API, inte Vertex AI |
| Firebase Hosting | Statiska tillgångar utan personuppgifter | Globalt CDN | Normalt oproblematiskt |

**De tre röda raderna är den mest sannolika enskilda invändningen från ett dataskyddsombud i
offentlig vård.** Rad 2 kräver tio minuters konsolarbete och har blockerat i över en månad.
Rad 5 har en identifierad teknisk lösning (Vertex AI, regional endpoint, samma modell) med en
kostnadsuppskattning i `granskningar/VERTEX-AI-MIGRERING-KOSTNADSUPPSKATTNING-2026-08-30.md`.

---

## 9. Kända diskrepanser – där koden och dokumentationen inte säger samma sak

**Det här avsnittet är dokumentets viktigaste.** En juridisk bedömning som inte känner till
följande punkter kommer att bygga på premisser som inte håller.

### 9.1 Gränssnittet säger fortfarande "Beslutsstöd"

`src/components/KlinikfragaSok.jsx:92` renderar, synligt för användaren:

> *"…källhänvisning. **Beslutsstöd – ersätter aldrig klinisk bedömning.** Ställ…"*

Detta står i **direkt konflikt** med två av projektets egna dokument:

- `granskningar/AVSETT-ANDAMAL-KLINIKSTOD-2026-08-30.md` listar uttryckligen **"beslutsstöd"**
  bland *"ord att aldrig använda om klinikstöd-sökningen"*, som en regulatorisk gräns.
- `granskningar/JURIDISK-GRANSKNING.md` § 6.4 identifierade exakt denna rad 2026-08-11,
  konstaterade att *"meningen friskriver och påstår i samma andetag, och det är påståendet –
  inte friskrivningen – som väger i en kvalificeringsbedömning enligt MDR art. 2(1)"*, och
  rekommenderade en konkret ersättningsformulering.

**Raden är fortfarande oförändrad i v5.139.0, tre veckor efter att den identifierades, och den
står inte i `OPPNA-PUNKTER.md`.** När `AVSETT-ANDAMAL`-dokumentet skrevs 2026-08-30 rättades
motsvarande ord i systemprompten (`functions/klinikstod.js`), men gränssnittsraden lämnades
medvetet utanför det avgränsade delmålet – och föll sedan mellan stolarna.

**Varför det spelar roll juridiskt:** MDR art. 2(12) gör avsett ändamål till en funktion av vad
tillverkaren säger *"on the label, in the instructions for use or in promotional or sales
materials or statements"*. Gränssnittstext är sådan. Produkten påstår alltså i dag om sig själv
precis det som resten av materialet är noga med att den inte gör.

*Åtgärdad i denna omgång: nej. Rättelsen är en produktcopyändring som ägaren bör godkänna, och
är därför förd till `OPPNA-PUNKTER.md` i samma commit som detta dokument.*

### 9.2 Checklistsegets fältuppsättning är inte spärrad i regellagret

`granskningar/JURIDISK-GRANSKNING.md` § 6.2 utpekar detta som *"den enskilt viktigaste tekniska
premissen för MDR-slutsatsen"*, och kodkontrollen 2026-08-11 visade att den var **felaktigt
beskriven**. Kontrollerad på nytt i v5.139.0: **fyndet står kvar oförändrat.**

`firestore.rules` begränsar två saker om `steg`-arrayen – antalet steg (max 12) och förekomst
av personnummer i varje stegs `text`-fält. **Ingen regel begränsar vilka nycklar ett stegobjekt
får ha.** `hasOnly` används på elva ställen i regelfilen, men inget av dem rör `rutiner`.
Fältuppsättningen `{text, bild, varning, timerSekunder}` upprätthålls av klientformuläret
(`src/components/RutinFormular.jsx`), alltså av en konvention i gränssnittet.

En skrivning som går förbi formuläret kan lägga till godtyckliga fält på ett steg – exempelvis
`berakning` eller `dos`.

**Varför det inte är slarv:** Firestores regelspråk saknar loopar, och att kontrollera
nyckeluppsättningen i tolv stegobjekt skulle kosta deluttryck i en budget (1 000) som redan
tagit slut två gånger i projektets historia. Det är en verklig teknisk avvägning.

**Att projektet vet hur man gör det rätt syns på jämförelsen:** `baspaketreferenser` – byggd
uttryckligen för juridiskt känsligt innehåll – har
`hasOnly(['titel','utgivare','kalldatum','url','kategori','tillagd','tillagdAv'])`
(`firestore.rules:760`) med ett eget regeltest. Skillnaden är att den är ett platt dokument,
inte en array.

**Konsekvens för bedömningen:** argumentet "checklistläget kan inte räkna eller rekommendera"
får inte framföras mot en upphandlare eller tillsynsmyndighet i formen "spärren sitter
strukturellt i datamodellen". Det är inte sant. Det som är sant är att spärren sitter i
klienten och att regellagret spärrar antal och personnummer.

### 9.3 Produktcopy som ligger nära gränsen, ogranskad

`granskningar/AVSETT-ANDAMAL-KLINIKSTOD-2026-08-30.md` flaggade två formuleringar som
gränsfall men lämnade dem medvetet oförändrade:

- `src/pages/KlinisktStod.jsx` beskriver sidan som *"Handläggningsrutiner, **triageringsstöd**
  och kritiska kom-ihåg-saker"*. Ordet ligger närmare "beslutsstöd" än vad det avsedda
  ändamålet medger.
- `src/components/KlinikfragaSok.jsx`s exempelplaceholder *"T.ex. Dosering amoxicillin vuxen"*
  är inte patientspecifik interaktionskontroll, men liknar den frågetypen mer än "hitta vår
  rutin om X".

Båda är fortfarande oförändrade och bör ingå i den externa bedömningens uppdrag.

### 9.4 Etapp 64 (baspaketet) är juridiskt blockerad

`etapplaner/ETAPPLAN13.md` är antagen men blockerad i väntan på extern bedömning. Idén rör
MDR, upphovsrätt och varumärkesrätt samtidigt (återgivning av bedömningsinstrument,
nationella vårdprogram och riktlinjer). "Antagen" betyder här uttryckligen **inte** "byggbar" –
ingen rad kod får skrivas före bedömningen. Samma sak gäller innehållet i övningslägets spår 2.

---

## 10. Overifierade premisser

Punkter där en juridisk slutsats hänger på ett faktum som ingen ännu bekräftat mot primärkälla:

| Premiss | Varför den är öppen |
|---|---|
| Att produkten faktiskt ligger utanför MDR | Ingen produktspecifik bedömning gjord av jurist. Projektets tre egna bedömningar är gjorda av kodsessioner mot primärkällor |
| Firestore-/Storage-regionen | Kräver inloggning i Firebase-konsolen. Kan inte läsas ur koden |
| Gemini API:s regionshantering | Ingen dokumenterad garanti hittad. Bör kontrolleras mot Googles aktuella villkor |
| Att art. 50-märkningen är tillräcklig | Ingen bedömning gjord av märkningens utformning mot förordningstexten |
| Att MDCG 2019-11 inte reviderats | Kontrollera aktuell revision – bedömningarna bygger på Rev.1 |
| Att den nya produktansvarslagen träder i kraft 9 dec 2026 | Bygger på SOU 2025:103. Bör kontrolleras mot antagen lagtext |
| AI-förordningens ändrade tidslinje | `granskningar/JURIDISK-GRANSKNING.md` § 7.1 bygger på externa källor om förordning (EU) 2026/1744, uttryckligen ej verifierade mot förordningstexten |

---

## 11. Frågor den externa bedömningen behöver besvara

Ordnade efter hur mycket som hänger på svaret.

**A. Kvalificering enligt MDR**

1. Kvalificerar Synappsen som helhet, eller någon enskild funktion, som medicinteknisk
   programvara enligt MDR art. 2(1) tillsammans med MDCG 2019-11?
2. Ändras svaret av formuleringen i § 9.1, och räcker det att ändra den raden?
3. Hur ska checklistläget bedömas givet § 9.2 – att spärren mot beräkningsfält sitter i
   klienten och inte i datamodellen?
4. Vad krävs för att Etapp 64 (baspaketet med referenser till bedömningsinstrument) ska kunna
   byggas utan att kvalificera produkten? Är länkning till ett instrument säkert när
   tillämpning inte är det?

**B. Upphovsrätt och varumärke (Etapp 64)**

5. Var går gränsen mellan att länka till, referera till och återge ett bedömningsinstrument,
   ett nationellt vårdprogram eller en riktlinje?
6. Utgör användning av instrumentens namn i en meny eller sökfunktion varumärkesintrång?
7. Gäller samma gräns för övningsfrågor som formulerar om ett instruments innehåll?

**C. AI-förordningen**

8. Är rollbestämningen i § 7 korrekt – Synappsen som provider, kunden som deployer?
9. Är art. 50-märkningen i sin nuvarande utformning tillräcklig?
10. Håller bedömningen att ingen bilaga III-punkt är tillämplig, särskilt p. 4 mot
    kompetensmatrisen?

**D. GDPR**

11. Hur bör revisionsloggens gallring utformas (§ 5) givet att pseudonymisering är tekniskt
    utesluten? Är segmentgallring med ankarposter en försvarbar konstruktion?
12. Är leverantören självständigt personuppgiftsansvarig för kontaktpersoner, fakturaunderlag
    och säkerhetsloggar – och vad krävs i så fall?
13. Behöver referensunderlaget en minsta-n-spärr för att anonymiseringen ska hålla?

**E. Ansvar och struktur**

14. Vilken bolagsform krävs innan första kundavtal, mot bakgrund av den nya
    produktansvarslagen som uttryckligen omfattar fristående programvara?
15. Vilka avtalsvillkor krävs för att hantera att patientuppgifter *kan* hamna i systemet
    trots spärrarna – särskilt leverantörens rätt att radera uppenbara patientuppgifter utan
    föregående medgivande?

---

## 12. Vad granskaren behöver få tillgång till

| Underlag | Var | Varför |
|---|---|---|
| Detta dokument | `granskningar/PRODUKTDEFINITION-REGULATORISKT-UNDERLAG.md` | Faktabasen |
| Den juridiska analysen | `granskningar/JURIDISK-GRANSKNING.md` | Analysen, med reservation för dess egen premisskontroll |
| Avsett ändamål, klinikstöd | `granskningar/AVSETT-ANDAMAL-KLINIKSTOD-2026-08-30.md` | Den känsligaste funktionen |
| MDR-bedömning, övningsfrågor | `granskningar/MDR-BEDOMNING-OVNINGSFRAGOR-2026-08.md` | Metodexempel: MDCG-stegen faktiskt tillämpade |
| Etapp 64-planen | `etapplaner/ETAPPLAN13.md` | Den blockerade frågan |
| PUB-avtalsmall, DPIA, underbiträden, IT-faktablad, incidentplan | `avtal/` | GDPR-underlaget |
| Kundvänt material | `saljmaterial/PITCH.md`, `saljmaterial/kallfiler/` | **Del av kvalificeringsunderlaget enligt MDR art. 2(12)** |
| Databasreglerna | `firestore.rules` | Där de tekniska spärrarna faktiskt sitter |
| Klinikstödets serverkod | `functions/klinikstod.js` | Domänbegränsning, prompt, avvisningsregler |

**Särskilt:** säljmaterialet är inte en bilaga utan en **primärkälla** i MDR-bedömningen. En
granskning som bara läser koden missar halva kvalificeringsunderlaget.

---

## 13. Förbehåll

- **Detta är inte juridisk rådgivning.** Dokumentet är skrivet av en kodsession, inte av en
  jurist med ansvarsförsäkring.
- **Beskrivningen gäller v5.139.0.** Varje ändring som inför patientinmatning, beräkning,
  rangordning, resultatlagring i övningsläget, eller som flyttar innehåll mellan ytor, gör om
  förutsättningarna.
- **MDCG-vägledning är inte bindande rätt.** Den uttrycker medlemsstaternas samordnade tolkning
  och väger tungt i praktiken, men en tillsynsmyndighet är inte bunden av den.
- **§ 9 och § 10 är avsiktligt obekväma.** Att de står kvar oputsade är dokumentets poäng: en
  bedömning byggd på en skönmålning är värdelös för den som beställer den.

---

## Versionshistorik

| Version | Datum | Ändring |
|---|---|---|
| 1.0 | 2026-09-03 | Första versionen. Kodverifierad produktdefinition mot v5.139.0, skriven som underlag för extern juridisk granskning. Två diskrepanser mellan kod och projektdokumentation dokumenterade (§ 9.1, § 9.2), varav § 9.1 samtidigt förd till `OPPNA-PUNKTER.md` |
