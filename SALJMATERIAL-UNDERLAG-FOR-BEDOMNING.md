# Säljmaterialpaketet — sammanställning och faktaverifiering för bedömning

**Framtaget 2026-08-23 · sammanställt av en Sonnet 5-session mot kodläge v5.128.0 (deployad,
körning #87) · underlaget kommer från en zip-fil användaren bifogade i chatten**

> **Syfte med det här dokumentet.** Användaren bad om extraktion, korsreferens/verifiering av
> kritiska påståenden mot faktisk kod, och en enda kompakt sammanställning — uttryckligen
> **utan** slutlig implementeringsplan eller feedback, eftersom bedömningen ska göras i nästa
> steg av en annan modell (Opus 5) i samma konversation. Det här dokumentet är alltså
> **underlag, inte slutsats.** Det gör bara ett undantag mot "inga slutsatser": där jag
> faktiskt kunde stämma av ett påstående mot koden redovisas resultatet rakt (stale/confirmed/
> unverifiable) eftersom det är ett faktapåstående, inte en bedömningsfråga.
>
> **Vad zip-filen innehöll:** ett komplett, sammanhängande säljmaterialpaket (`00-LAS-DETTA-
> FORST.md` + 8 md-dokument + 6 HTML-källfiler för PDF:er + 2 Word-mallar + 3 PowerPoint-decks),
> byggt **mot kodläge v5.117.0** (2026-08-17 till 2026-08-19). Paketet är alltså redan **elva
> versioner staleare än koden** vid tidpunkten det lästes — se avsnitt 4, fynd 1, som är det
> enskilt viktigaste resultatet av hela genomgången.

---

## 1. Vad som laddades upp till repot, och vad som medvetet inte laddades upp

**Uppladdat (git, denna session):**

| Fil | Placering | Skäl |
|---|---|---|
| `00-LAS-DETTA-FORST.md` | repo-rot | Orienteringsdokument för hela paketet, ifyllnadschecklista |
| `MARKNADSANALYS.md` | repo-rot | Intern fullversion: marknad, värdering, prismodell (2026-08-17) |
| `MARKNADSANALYS-EXTERN.md` | repo-rot | Extern kortversion, för investerare/samarbetspartner |
| `KOSTNADSKALKYL-OCH-PRISSATTNING.md` | repo-rot | Kostnadssida, break-even, fyra prisnivåer inkl. ny "Liten" (2026-08-19) |
| `KANDIDATLISTA-PRIVAT-VARD.md` | repo-rot | 28 namngivna kandidater, internt, aldrig för kundutskick |
| `KOPARANALYS.md` | repo-rot | Köparanalys ur fyra roller (den fil användaren bifogade tidigare i sessionen) |
| `Synappsen-demomanus.md` | repo-rot | 30-minuters demoscript |
| `Synappsen-invandningshantering.md` | repo-rot | Invändningshantering/FAQ |
| `Synappsen-epostmallar.md` | repo-rot | 11 e-postmallar |
| Sex `.html`-källfiler | `saljmaterial/kallfiler/` (ny mapp) | Källfiler för one-pagers, prislista, teknisk beskrivning, upphandlingssvar — se avsnitt 1.1 |

**Medvetet INTE uppladdat, med skäl:**

- **`Synappsen-offert-MALL.docx` och `Synappsen-pilotoverenskommelse-MALL.docx`** (Word).
  Innehållet är helt konsistent med det som redan finns i de uppladdade md/HTML-filerna
  (kontrollerat rad för rad, inga nya sakuppgifter) — de är alltså rena formatkonverteringar,
  inte ny information. Repot har **noll precedens** för binära Office-dokument (enda befintliga
  binärfil är en 200-byte PNG-ikon), och en `.docx` går varken att diffa, grep:a eller
  granska av en framtida Claude-session. **Rekommendation, inte beslut:** om mallarna ska in i
  repot, gör det som redigerbar text (Markdown eller HTML, samma mönster som `avtal/PUB-AVTAL-
  MALL.md`) snarare än som binärt Word-dokument.
- **Tre `.pptx`-presentationer** (13 bilder var, ca 450 kB styck). Samma skäl som ovan —
  innehållet är en direkt bild-för-bild-omformulering av redan uppladdat material (one-pagern,
  prislistan, invändningshanteringen), verifierat genom att extrahera all text och alla
  talarnoter ur samtliga tre decks. Att lägga in 1,3 MB binärdata i ett i övrigt textbaserat
  repo utan att kunna granska innehållet i diff-verktyg är en avvikelse från hur resten av
  projektet drivs. **Flaggat för ett medvetet beslut, inte tyst uteslutet.**
- **`stil.css` och `rendera.py`/`bygg-deck.js`/`bygg-docx.js`** nämns i `00-LAS-DETTA-FORST.md`
  som byggkedjan för HTML → PDF och för presentationerna/Word-dokumenten, men **fanns inte i
  zip-filen**. De sex HTML-filerna som laddats upp refererar `<link rel="stylesheet"
  href="stil.css">`, som alltså saknas i repot. HTML-filerna är läsbara som källtext men går
  inte att rendera till PDF utan den saknade stilmallen och skriptet.

### 1.1 Notering om mappstruktur

HTML-källfilerna las i en ny mapp `saljmaterial/kallfiler/` (samma namn zip-filen själv
använde). **`CLAUDE.md`s dokumentkarta är INTE uppdaterad** med de nya filerna — det är
medvetet lämnat till nästa steg (bedömningen/implementeringsplanen), eftersom `CLAUDE.md` är
mycket tydlig med att nya dokument ska indexeras och få en underhållsregel i samma commit som
de läggs till, och den bedömningen (var i läsordningen, vilken underhållsregel, om separata
säljdokument ska slås ihop med `PITCH.md`/`PILOTUPPLAGG.md` eller leva parallellt) är exakt den
typ av avvägning som hör hemma i nästa steg, inte i den här extraktionen.

---

## 2. Paketets kärninnehåll, komprimerat

### 2.1 Fyra slutsatser från `MARKNADSANALYS.md` (den styrande analysen bakom allt annat)

1. Återanskaffningsvärde 2,5–5 Mkr, marknadsvärde idag under 1 Mkr — hela gapet är noll kunder.
2. Den verkliga konkurrenten är SharePoint/pärmen, inte Centuri/CANEA/Stratsys/AM System —
   de senare *förvaltar* styrande dokument, Synappsen *använder* dem mitt i ett pass.
3. Prismodell 39 000/59 000/89 000 kr per enhet och år (tre nivåer: Kärna/Drift/Full),
   under direktupphandlingsgränsen (700 000 kr, 2026), 20–40 % under AM System.
4. Fel segmentprioritering hittills: region/akutmottagning har LOU, SSO-krav, jäv. Privat
   vårdgivare och kommunal omsorg är 10–20× fler enheter utan de blockerarna.

**Ringordning enligt marknadsanalysen:** 1) privat vårdgivare, 2) kommunal vård/omsorg,
3) enskild avdelning i region, 4) region centralt (sist).

### 2.2 `KOSTNADSKALKYL-OCH-PRISSATTNING.md` (bygger vidare, 2026-08-19) — vad som är NYTT mot MARKNADSANALYS.md

- **Molnkostnad per kund: 265 kr/år** (medelantagande), bruttomarginal **99 %** (93 % på Full
  pga AI-pott) — högre marginal än marknadsanalysens egen försiktiga "85 %+"-gissning.
- **Ny prisnivå föreslagen: "Liten", 24 000 kr/år, tak 30 användare** — samma funktioner som
  Kärna, bara lägre användartak. Motiveras med att en tredjedel av kandidatlistan (klinker
  under 30 anställda, t.ex. IVF-gruppen ~25 anställda) annars får 1 560 kr/anställd, dyrare
  per huvud än AM Systems dyraste nivå.
- **Tre scenarier (kunder år 1/2/3):** pessimistisk 1/2/3, realistisk 2/5/10, optimistisk
  3/10/25. Realistiskt scenario med deltidslön vänder till plus år 3 (+93 498 kr).
  Heltidslön går inte ihop förrän år 3 i det optimistiska scenariot.
- **Break-even i kunder, inte kronor:** ingen lön 1,7 kunder, deltid 8,0 kunder, heltid 15,9
  kunder (mot bedömda 10–20 som ett ensamt bolag kan supportera).
- **3:12-regeländring 2026:** löneuttagskravet är slopat, utdelning kan tas till 20 % skatt
  utan lönekrav — författaren kallar detta "den enskilt mest kalkylkritiska skatteuppgiften i
  hela underlaget" och uppmanar att stämma av mot redovisningskonsult.
- Rekommendation: **behåll 39/59/89, lägg till Liten på 24 000, höj ingenting.**

### 2.3 `KANDIDATLISTA-PRIVAT-VARD.md` — 28 namngivna kandidater

**10 A-prioritet** (Achima Care, Nötkärnan, Carlanderska, Familjeläkarna, Ersta sjukhus,
Wästerläkarna, Specialistcenter Scandinavia, Aleris nya specialistsjukhuset Malmö, Aleris
Närakut Uppsala, Stockholms Sjukhem), **13 B**, **5 C**, samt **11 bortsållade med motivering**
(bl.a. flera bolag redan uppköpta av Kry/Prima Vård som vid ytlig sökning ser fristående ut).

**Rekommenderad ringordning (fem samtal):** Wästerläkarna (lägst friktion, publik e-post rakt
till chef) → Carlanderska → Achima Care → Nötkärnan (två nya enheter öppnar just nu) →
PRIMA Psykiatri/IVF-gruppen.

**Viktigt förbehåll som dokumentet själv gör:** merparten av personnamnen kommer ur
pressmeddelanden 1–6 år gamla och är **inte** verifierade i en aktuell växelringning; en
systematisk IVO-databassökning gjordes aldrig (bara Achima Cares tillsynshistoria hittades via
nyhetsrapportering); två av fyra researchspår slog i sökmotorns 200-sökningars-takgräns.

### 2.4 Säljstödsdokumenten (demomanus, invändningshantering, e-postmallar)

Genomgående kvalitetsmässigt konsekventa med varandra och med marknadsanalysen — samma
siffror, samma ärlighetsdisciplin ("säg det som inte finns, innan de frågar"), ingen
motsägelse hittad mellan dessa tre dokument. Enda direkt handlingskrävande punkten som
återkommer i flera av dem: **"källkodsdeposition eller motsvarande" är olöst och markerad som
den enda invändning där ett svävande svar sänker en affär direkt** (nämns i
invändningshanteringen, `00-LAS-DETTA-FORST.md`, `MARKNADSANALYS.md` risk 4, och
`upphandlingssvar.html` fråga A1).

### 2.5 HTML-källfilerna (teknisk beskrivning, prislista, upphandlingssvar, tre one-pagers)

Tre one-pagers är strukturellt identiska mallar med segmentanpassad text (privat/kommunal/
region) — verifierat med `diff`, inga sakskillnader utöver målgruppstext och terminologi
("mottagning"/"enhet"/"sektion"). De tre PowerPoint-decken är på samma sätt 13 bilder vardera
med identisk struktur och segmentanpassad text — verifierat genom att extrahera all text och
alla talarnoter ur alla tre filerna.

`Synappsen-teknisk-beskrivning.html` och `Synappsen-upphandlingssvar.html` är de två
tyngsta dokumenten sakligt — se avsnitt 3 för verifiering av deras påståenden mot koden.

---

## 3. Verifieringslogg — påstående mot faktisk kod

Metod: grep/läsning direkt i den klonade Synappsen-koden (inte i projektkunskapens
sammanfattningar). Status: **BEKRÄFTAT** / **STALE** (var sant, är det inte längre eller är
inaktuellt formulerat) / **EJ VERIFIERBART FRÅN KODEN** (kräver extern konsoll/tjänst).

| # | Påstående i säljmaterialet | Källa | Status | Bevis |
|---|---|---|---|---|
| 1 | **"Kodläge v5.117.0"** — hela paketets prisbild, riskbild och statuspåståenden är daterade mot denna version | Samtliga dokument, uttryckligt i sidhuvuden | **STALE** | `package.json` visar `"version": "5.128.0"` — elva versioner senare. Paketet skrevs 2026-08-17–19; nuvarande kodläge är från denna sessions egen `CLAUDE_STATUS.md`-uppföljning (v5.128.0, deployad, körning #87, 2026-08-22/23). **Detta är den enskilt viktigaste enskilda upptäckten** — varje statuspåstående i paketet (roller, WCAG, App Check, etc.) måste omprövas mot vad som faktiskt hänt i etapp 66–69 sedan dess, inte antas fortfarande stämma. |
| 2 | **"Sju roller"** (superadmin, VÖL, sektionsledare, VEC, förrådsansvarig, personal, kiosk) — paketets egen rättelse av `PITCH.md`s "6 roller" | `MARKNADSANALYS.md` §3.1, `Synappsen-teknisk-beskrivning.html` §3 | **BEKRÄFTAT** (paketets siffra), **PITCH.md fortfarande stale** | `src/firebase/roles.js` rad 2–21: `ROLES` innehåller exakt SUPERADMIN, VOL, SEKTIONSLEDARE, VEC, FORRADSANSVARIG, PERSONAL, KIOSK — sju. `PITCH.md` rad 91 säger fortfarande **"Rollstyrd behörighet (6 roller)"** — obekräftat rättat, alltså fortsatt en aktiv brist precis som marknadsanalysen påstår. |
| 3 | **"AI-förordningens art. 50-märkning saknas i rutinvyn"** — flaggad som bekräftad brist, brådskande | `MARKNADSANALYS.md` §3, risk 8; `JURIDISK-GRANSKNING.md` §7.4 | **BEKRÄFTAT som olöst, OCH ett allvarligare fynd** | Grep i `src/pages/`, `src/components/rutin/*.jsx` och hela `src/` gav **noll träffar** på någon AI-genererat-märkning, "kalla"-fält eller liknande UI-etikett kopplad till AI-ursprung. Samtidigt påstår `Synappsen-upphandlingssvar.html` svar E2 rakt ut: *"Transparenskravet i artikel 50 hanteras genom att AI-genererat innehåll märks för läsaren."* — **detta är en osann mening i ett dokument avsett att klippas in i skarpa anbud**, inte en hedgead platshållare. Dokumentets egen interna anmärkning direkt under ("kontrollera att märkningen faktiskt är implementerad ... innan detta svar skickas") visar att författaren själv var medveten om risken men löste den med en kommentar i stället för att ändra brödtexten. |
| 4 | **"App Check: klienten skickar intyg, servern kräver dem ännu inte (mätfas)"** | `Synappsen-teknisk-beskrivning.html` §5 | **BEKRÄFTAT** | `src/firebase/config.js` rad 34–37: klienten initierar `firebase/app-check` med `ReCaptchaV3Provider`. Grep i `functions/index.js` och övriga `functions/*.js` efter enforcement (`appCheck`, `enforceAppCheck`, `consumeAppCheckToken`) gav noll träffar — ingen serverfunktion kräver token. |
| 5 | **"Regionen för Firestore/Storage syns inte i koden"** — måste bekräftas manuellt i konsolen | `Synappsen-teknisk-beskrivning.html` §9, `upphandlingssvar.html` B4 | **BEKRÄFTAT** | `firebase.json` och `.firebaserc` innehåller ingen regionangivelse för Firestore/Storage (till skillnad från Functions, där `europe-west1` är verifierbart i `functions/index.js`). Regionen sätts vid projektskapande i Firebase-konsolen och finns inte i något repo-spårat konfigurationsfilat. **Kräver fortfarande en skärmbild ur konsolen**, precis som `[FYLL I]`-fältet säger. |
| 6 | **"Tillgänglighetsredogörelsen är inte publicerad"** | `MARKNADSANALYS.md` §3, `upphandlingssvar.html` D2 | **BEKRÄFTAT** | Ingen route/sida för en publik tillgänglighetsredogörelse hittades i `src/App.jsx` eller `src/pages/` (grep efter "tillganglighet"/"Tillganglighet" gav noll träffar). Dokumentet `TILLGANGLIGHETSREDOGORELSE.md` existerar i repot men serveras inte av appen på någon URL — DOS-lagens publiceringskrav är alltså formellt ouppfyllt, precis som paketet säger. |
| 7 | **"Klinikstöd-sökningen är pausad i UI"** | `avtal/UNDERBITRADEN.md` rad 25 och 80 (befintlig repofil, INTE en del av det uppladdade paketet) | **STALE — bekräftat i en TIDIGARE genomgång denna session, kvarstår** | `avtal/UNDERBITRADEN.md` säger fortfarande "pausad" trots att `SAKERHETSRAPPORT.md` egen rad 45 säger *"denna funktion är INTE längre pausad"* sedan 2026-08-01-rättelsen. Detta ligger utanför själva säljpaketet men är exakt den sortens dokument (underbiträdesförteckning) som skickas till en kunds dataskyddsombud enligt `Synappsen-epostmallar.md` mall 7 — **om den skickas i sitt nuvarande skick innehåller den en sakfelaktighet.** |
| 8 | **SSO/Entra ID: "inte byggt", protokollval OIDC fattat** | Genomgående i alla dokument | **BEKRÄFTAT konsistent med tidigare sessionskunskap** | Ingen ny SSO-kod hittad; matchar `ETAPPLAN11.md` §58 (protokoll beslutat, bygge villkorat av kund). |
| 9 | **Flerenhetsstöd (54c/54d): "inte byggt"** | Genomgående | **BEKRÄFTAT konsistent med tidigare sessionskunskap** | Matchar `ETAPPLAN11.md`. Volymrabatterna i prislistan (`Synappsen-prislista.html`) förutsätter uttryckligen att detta byggs — paketet varnar själv "sälj det inte innan". |
| 10 | **Kioskläge byggt, sjunde roll** | `MARKNADSANALYS.md` §3.1 | **BEKRÄFTAT** | Se punkt 2 ovan, plus `src/components/KioskPinModal.jsx` och `tests/e2e/kioskbevakning.spec.js` existerar och är i aktiv drift (verifierat tidigare i denna session under Etapp 69-arbetet). |
| 11 | **Personnummerspärr i tre lager** (klient, server, databasregel) | Teknisk beskrivning §4, upphandlingssvar B3, presentation bild 7 | **BEKRÄFTAT** | `firestore.rules` rad ~180–227 innehåller `harTroligtPersonnummer()`/`harTroligtPersonnummerISteg()`-funktioner som explicit implementerar mönstermatchning mot personnummer/samordningsnummer i databasregler — tredje lagret existerar konkret, inte bara som påstående. |
| 12 | **Hashkedjad revisionslogg** | Flera dokument | **BEKRÄFTAT** | `functions/revisionslogg.js`, `functions/backup.js`, `functions/organisationslivscykel.js` och `src/components/admin/RevisionsloggSektion.jsx` innehåller hashkedje-relaterad logik. |
| 13 | **Offline-center i Drift-nivån** | Prislista, presentation, teknisk beskrivning | **BEKRÄFTAT** | `FEATURE.OFFLINE_CENTER` finns i `src/config/features.js` (redan känt från `MODULPLAN.md`). |
| 14 | **GCP:s faktureringsexport ännu inte aktiverad** — hela kostnadskalkylens 265 kr/år är modellerat, inte mätt | `KOSTNADSKALKYL-OCH-PRISSATTNING.md` §2.1, §6 | **EJ VERIFIERBART FRÅN KODEN** | Detta är en inställning i Google Cloud Console, inte i repot. Kan inte bekräftas eller motbevisas genom kodgranskning. |
| 15 | **Försäkringspremie 15 000/6 000 kr** är en egen gissning, inget försäkringsbolag prisger listpris | `KOSTNADSKALKYL-OCH-PRISSATTNING.md` §2.3 | **EJ VERIFIERBART** (extern marknadsuppgift, dokumentet flaggar själv osäkerheten) | — |
| 16 | Samtliga externa marknads-/konkurrentsiffror (Centuri, AM System, Eolas, TAM/SAM/SOM, regionkostnader, tidsstudien 43 %) | `MARKNADSANALYS.md` §4, §5, §11 | **EJ VERIFIERBART FRÅN KODEN** — men källbelagda med länkar i dokumentets eget avsnitt 11, och författaren flaggar själv vilka siffror som är `[uppskattning]` kontra hämtade | — |

---

## 4. Sammanställda öppna punkter som kräver ett mänskligt beslut (inte kod)

Hämtat och deduplicerat från `00-LAS-DETTA-FORST.md`s ifyllnadschecklista,
`MARKNADSANALYS.md` §10 och `upphandlingssvar.html`s `[FYLL I]`-fält. Detta är EN lista, inte
tre separata (flera punkter förekommer i alla tre källorna).

**Måste vara löst före första kundmöte:**
1. Bilda aktiebolag (produktansvar är strikt, kan inte avtalas bort)
2. Teckna ansvarsförsäkring med produktansvarsmoment — bekräftat att inget svenskt
   försäkringsbolag (If, Trygg-Hansa, Gjensidige, Dina kontrollerade) publicerar listpris;
   kräver tre offerter med skriftlig bekräftelse att vårdverksamhet/programvara omfattas
3. Lösa källkodsdeposition/motsvarande + avtalsklausul om leverantörens upphörande — den
   enda invändningen där ett svävande svar sänker en affär direkt, enligt materialet självt
4. Deploya senaste kodversionen — **redan gjort**: koden är på v5.128.0 och `CLAUDE_STATUS.md`
   bekräftar deploy till produktion (körning #87). Denna punkt i `00-LAS-DETTA-FORST.md` är
   alltså numera **avklarad**, men var korrekt när paketet skrevs mot v5.106.0-i-produktion/
   v5.117.0-i-koden-gapet.
5. Lägga till AI-märkning enligt art. 50 i rutinvyn — **fortfarande olöst**, se verifiering #3

**Måste utredas (kräver research/beslut, inte bara ifyllnad):**
6. Bekräfta Firestore/Storage-region i Firebase-konsolen (skärmbild)
7. Fastställa avtalad gallringstid för revisionsloggen (materialet föreslår 3 år/5 år för
   säkerhetshändelser som utgångsläge)
8. Rättslig grund för överföring till Google (standardvillkor eller egen transferanalys)
9. Avtalad rutin/svarstid för leverantörens bistånd vid registerutdrag
10. Hållning till att bekosta extern penetrationstestning
11. Publiceringsadress för tillgänglighetsredogörelsen — **fortfarande obyggd/opublicerad**,
    se verifiering #6
12. Om extern juridisk MDR-bedömning inhämtats (om ja, starkt svar; om nej, utelämna raden)
13. Supportens svarstider i offertmallen — "lova inte mer än en ensam leverantör kan hålla"
14. Aktivera GCP:s faktureringsexport (redan beslutat enligt `BESLUTSLOGG.md` 2026-08-15,
    men enligt kostnadskalkylen ännu inte bekräftat genomfört)

**Enkla textfält som ska fyllas i vid varje användning:** bolagsnamn, org.nr, kontaktperson,
e-post, telefon, webbplats, datum — förekommer i alla filer, se `00-LAS-DETTA-FORST.md`s
fullständiga checklista för exakt vilka filer.

---

## 5. Cross-dokument-inkonsekvenser hittade under genomgången

| Inkonsekvens | Var | Konsekvens |
|---|---|---|
| Hela paketet är skrivet mot v5.117.0; koden är nu v5.128.0 | Samtliga filer | Varje statuspåstående måste omprövas — se avsnitt 3, rad 1 |
| `PITCH.md` säger "6 roller", koden och det nya paketet säger 7 | `PITCH.md` rad 91 vs `src/firebase/roles.js` | Ett kundvänt dokument underrapporterar en byggd funktion — litet i sak men samma stale-mönster `CLAUDE.md` redan har fyra underhållsregler för |
| `avtal/UNDERBITRADEN.md` säger klinikstöd-sökningen är pausad; `SAKERHETSRAPPORT.md` säger uttryckligen att den INTE längre är det | `avtal/UNDERBITRADEN.md` rad 25, 80 | Ett dokument som går till kundens dataskyddsombud innehåller en sakfelaktighet |
| `upphandlingssvar.html` svar E2 påstår art. 50-märkning är löst ("hanteras genom att... märks"); koden har ingen sådan märkning | Se verifiering #3 | Risk att en osann mening klipps in i ett skarpt anbud om den interna varningsraden direkt under missas |
| `MODULPLAN.md` (2026-07-28) är 40+ releaser gammal och listar kioskläge som obyggt (⬜); säljpaketet och koden säger byggt | Känd sedan tidigare i sessionen (se `KOPARANALYS.md`-genomgången) | Bekräftar samma mönster ytterligare en gång, inte en ny upptäckt |

---

## 6. Vad som INTE gjorts i den här extraktionen, medvetet

- **Ingen bedömning av om säljstrategin är rätt, om priserna är rätt satta, eller om
  kandidatlistans prioritering håller.** Det är precis den typ av syntes användaren bad om
  att spara till nästa steg.
- **Ingen ändring av `CLAUDE.md`s dokumentkarta**, trots att nya dokument formellt borde
  indexeras enligt projektets egna regler — lämnat till nästa steg, se avsnitt 1.1.
- **Ingen rättelse av de stale-fynd som hittades** (roller i `PITCH.md`, pausad-status i
  `avtal/UNDERBITRADEN.md`, art. 50-svaret i `upphandlingssvar.html`) — de är rapporterade
  här som fynd, inte åtgärdade, eftersom användaren bad om sammanställning, inte fixar.
- **Ingen verifiering av externa marknadssiffror** (konkurrentpriser, TAM/SAM/SOM,
  tidsstudien) mot originalkällorna — det ligger utanför vad kodgranskning kan avgöra, och
  respektive dokument redovisar redan öppet vilka siffror som är uppskattningar.

---

## 7. Snabbreferens: var allt finns

- Uppladdade säljdokument: repo-rot (`00-LAS-DETTA-FORST.md`, `MARKNADSANALYS.md`,
  `MARKNADSANALYS-EXTERN.md`, `KOSTNADSKALKYL-OCH-PRISSATTNING.md`,
  `KANDIDATLISTA-PRIVAT-VARD.md`, `KOPARANALYS.md`, `Synappsen-demomanus.md`,
  `Synappsen-invandningshantering.md`, `Synappsen-epostmallar.md`)
- HTML-källfiler: `saljmaterial/kallfiler/` (sex filer, se avsnitt 1)
- Ej uppladdade original (docx/pptx): kvar i användarens ursprungliga zip-fil, inte i repot
- Denna sammanställning: `SALJMATERIAL-UNDERLAG-FOR-BEDOMNING.md`, repo-rot
