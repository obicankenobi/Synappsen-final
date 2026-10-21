# Dokumentregister

**Fullständig inventering av projektets 80 dokument.** Bevakat av
`tests/docs/dokumentregister.test.js`, som failar om ett dokument finns på disk men saknas
här, eller står här men saknas på disk. **Ett nytt dokument kan alltså inte glömmas bort –
testet vägrar passera förrän det är infört i tabellerna nedan.**

> **Varför den här filen finns.** Projektet har sex gånger haft ett dokument som påstod något
> som inte längre stämde – `granskningar/SAKERHETSRAPPORT.md` 46–51 releaser efter koden,
> `produkt/FRAMTIDSPLAN.md`/`produkt/MODULPLAN.md` 38–43, `src/version.js` 19,
> `CLAUDE_STATUS.md` två, `saljmaterial/PITCH.md` 48. Svaret har varje gång varit en ny
> prosaregel i `CLAUDE.md`, och prosareglerna har varje gång misslyckats igen. Det som
> faktiskt har hållit är de två fall där drift gjordes **mekaniskt omöjlig eller mekaniskt
> upptäckt**: `src/version.js` importerar versionen i stället för att upprepa den, och
> `tests/docs/pitch-version.test.js` failar om `saljmaterial/PITCH.md`s versionsrubrik glider.
> Det här registret plus `tests/docs/dokumentpastaenden.test.js` generaliserar den principen.

## Typerna

| Typ | Betyder | Bevakning |
|---|---|---|
| **levande** | Måste uppdateras när en viss händelse inträffar | Utlösaren står i tabellen. Kritiska sakpåståenden bevakas av `dokumentpastaenden.test.js` |
| **referens** | Ändras bara vid en faktisk sakförändring, inte löpande | Ingen automatisk – läs vid behov |
| **historisk** | **Ska inte ändras.** Beskriver ett avslutat skede | Testet kontrollerar bara att filen finns kvar |
| **mall** | Fylls i per kund/tillfälle, ändras sällan i grunden | Ingen automatisk |

**Extern = ja** betyder att dokumentet lämnas ut till kund, dataskyddsombud eller i ett anbud.
Där kostar ett felaktigt påstående pengar och förtroende, inte bara irritation – de sex
kundvända filerna i `saljmaterial/kallfiler/` och de fem i `avtal/` är därför de som
`dokumentpastaenden.test.js` bevakar hårdast.

---

## Levande dokument

Dessa är de enda som kräver löpande uppmärksamhet. Är du osäker på om något du just gjorde
utlöser en uppdatering – läs kolumnen "Utlöses av".

| Dokument | Extern | Utlöses av |
|---|---|---|
| `CLAUDE_STATUS.md` | nej | Varje commit, ägarbeslut, avslutad etapp eller deploy. Håll den kort – historik flyttas till `etapplaner/STATUSARKIV.md` när testet larmar |
| `OPPNA-PUNKTER.md` | nej | En punkt blockerad av en människa/ett beslut tillkommer, löses eller visar sig inaktuell |
| `BESLUTSLOGG.md` | nej | Ett ägarbeslut fattas (ja/nej/vänta). Ny rad, ändra aldrig en gammal |
| `etapplaner/UTVECKLINGSLOGG.md` | nej | En utvecklingsfas avslutas |
| `avtal/UNDERBITRADEN.md` | **ja** | Nytt eller ändrat underbiträde, ny extern integration, ändrad region, funktion pausas/återaktiveras |
| `avtal/INCIDENTRESPONSPLAN.md` | **ja** | Ändrad detektions-, begränsnings- eller återställningsförmåga. Höj versionsnumret och fyll i versionshistoriken |
| `drift/INCIDENT-CHECKLISTA.md` | nej (delas ALDRIG externt) | Samma som ovan, plus flyttade adminkontroller i UI |
| `saljmaterial/PITCH.md` | **ja** | Kundvänd funktion blir synlig, ändras eller tas bort. Versionsrubriken bevakas av `pitch-version.test.js` |
| `granskningar/SAKERHETSRAPPORT.md` | nej | Vid varje STÖRRE release: ny collection, ny uppladdningsväg, ny loggpunkt, genomläst npm-audit |
| `granskningar/TILLGANGLIGHETSREDOGORELSE.md` | **ja** | En WCAG-brist åtgärdas eller upptäcks. **Sammanfattningstexten måste stämma med tabellen** – bevakat av test |
| `produkt/MODULPLAN.md` | nej | En funktion byggs som ändrar vad ett paket innehåller |
| `saljmaterial/kallfiler/Synappsen-prislista.html` | **ja** | Pris, nivå, rabatt eller tillägg ändras |
| `saljmaterial/kallfiler/Synappsen-teknisk-beskrivning.html` | **ja** | Arkitektur, behörighet, region, backup eller "vad som inte finns" ändras |
| `saljmaterial/kallfiler/Synappsen-upphandlingssvar.html` | **ja** | Något av de statusberoende svaren (A2, B4, B6, C3, C5, D1, E2) ändras |
| `synappsen-web/index.html` | **ja (publikt)** | Den publika marknadsplatsen – **projektets mest externa dokument**, läst av vem som helst utan att någon lämnat ut det, och enligt MDR art. 2(12) en del av produktens kvalificeringsunderlag. Utlöses av: kundvänd funktion tillkommer/ändras/tas bort, ett paket ändrar innehåll, en avgränsning i "Medvetna avgränsningar" blir inaktuell, eller första kunden tecknas. Bevakas av `tests/docs/webbplats.test.js` (förbjudna ord, källdomänantal, profilfärger, identiska varumärkestillgångar) och av rollantals- och kundpåståendevakterna i `dokumentpastaenden.test.js` |
| `synappsen-web/integritet.html` | **ja (publikt)** | Webbplatsens integritetspolicy (GDPR art. 13). Utlöses av: sidan börjar sätta kakor, mäta besök, ladda något från en annan domän, eller ta emot uppgifter via formulär – och av byte av driftleverantör. Påståendena om att inget av detta sker är mekaniskt bevakade i `tests/docs/webbplats.test.js`, som failar om koden motsäger texten |
| `synappsen-web/underlag.html` | **ja (publikt)** | Ingången till allt underlag: vad som är publicerat i fulltext, vad som lämnas på begäran, och de mekaniskt kontrollerbara antalen (behörighetstester, isoleringstester, säkerhetsgenomgångar). Utlöses av: ett dokument tillkommer/publiceras/slutar lämnas ut, incidentresponsplanens version höjs, eller ett av antalen ändras. Antalen och planens version är bundna till sina källor av `tests/docs/dokumentpastaenden.test.js` |
| `synappsen-web/foretag.html` | **ja (publikt)** | Säljsidan för det andra affärsspåret (anpassade hemsidor, bokningssystem och AI-automation för mindre företag), under samma varumärke och domän. Innehåller **publicerade priser och ett räkneexempel**, så den utlöses av: pris, paket, leveranslöfte eller garanti ändras, eller räkneexemplets antaganden ändras. Räkneexemplets summor bevakas av `tests/docs/webbplats.test.js`. Öppna villkorsfrågor (moms, SMS-kostnad, PUB-avtal, garantins avtalstext) står i `OPPNA-PUNKTER.md` |
| `synappsen-web/tillganglighet.html` | **ja (publikt)** | **GENERERAD** ur `granskningar/TILLGANGLIGHETSREDOGORELSE.md` av `synappsen-web/verktyg/bygg-underlag.mjs`. **Redigera aldrig för hand** – kör om generatorn i samma commit som källan ändras. `tests/docs/webbplats.test.js` jämför den committade filen med generatorns utdata och failar vid drift |
| `synappsen-web/underbitraden.html` | **ja (publikt)** | **GENERERAD** ur `avtal/UNDERBITRADEN.md`, se raden ovan. Publicerar även dokumentets öppna brister (bl.a. Brevo utan tecknat PUB-avtal) – det är avsiktligt, se `BESLUTSLOGG.md` 2026-09-06 |
| `synappsen-web/it-faktablad.html` | **ja (publikt)** | **GENERERAD** ur `avtal/IT-FAKTABLAD.md`, se raden ovan |

## Referensdokument

| Dokument | Extern | Innehåll |
|---|---|---|
| `CLAUDE.md` | nej | Projektkarta och arbetsmönster. Ändras sällan |
| `DOKUMENTREGISTER.md` | nej | Den här filen |
| `README.md` | nej | Komma igång lokalt |
| `.claude/skills/synappsen-release/SKILL.md` | nej | Releasechecklistan steg för steg |
| `avtal/DPIA-UNDERLAG.md` | **ja** | Underlag för kundens konsekvensbedömning |
| `avtal/IT-FAKTABLAD.md` | **ja** | Tekniskt faktablad till IT/DSO |
| `drift/REDAKTORSGUIDE.md` | nej | Fördjupad guide för redaktörsrollerna |
| `granskningar/JURIDISK-GRANSKNING.md` | nej (delas ALDRIG i sin helhet) | GDPR, MDR, AI-förordningen, produktansvar, NIS2, jäv/bisyssla |
| `granskningar/MDR-BEDOMNING-OVNINGSFRAGOR-2026-08.md` | nej | MDR-kvalificering av leverantörskurerat kvissinnehåll. Uppdateras när ett av besluten i § 8 fattas, eller om MDCG 2019-11 revideras |
| `granskningar/PRODUKTDEFINITION-REGULATORISKT-UNDERLAG.md` | **ja (till anlitad jurist)** | Kodverifierad definition av vad produkten är, inte är, och vad som avgör dess regulatoriska klassning. Faktabasen för den externa juridiska granskningen. Uppdateras när en definierande gräns ändras (patientinmatning, beräkning, rangordning, sparade övningsresultat), när en diskrepans i § 9 åtgärdas, eller när en overifierad premiss i § 10 verifieras |
| `produkt/VARUMARKE.md` | nej | Varumärkesplattform, tonalitet |
| `produkt/GRAFISK-PROFIL.md` | nej | Färg, typografi, komponentspråk |
| `produkt/FRAMTIDSPLAN.md` | nej | **Arkiv över ej antagna planer.** Skriv aldrig tillbaka "här är den aktiva planen" |
| `etapplaner/ETAPPLAN19.md` | nej | Etapp 72 – från rutindatabas till ledningssystem. **ANTAGEN 2026-08-30** (v0.2.1). Tretton delmål, samtliga sju beslutspunkter avgjorda – men beslutspunkt 5 (efterfrågegrinden) betyder att inget delmål byggs utan en namngiven kund. Undantag 1 (avsett ändamål, artikel 50-märkning, Vertex AI-kostnad) genomfört. Uppdateras när ett delmål byggs eller en kund efterfrågar ett. Flyttas till historiska tabellen när planen är helt genomförd eller formellt avslutad |
| `saljmaterial/00-LAS-DETTA-FORST.md` | nej | Orienteringsdokument för säljpaketet |
| `saljmaterial/PILOTUPPLAGG.md` | nej | Konkret pilotupplägg, 4–6 veckor |
| `saljmaterial/MARKNADSANALYS.md` | nej (bolagsform/jäv) | Marknad, värdering, prismodell |
| `saljmaterial/MARKNADSANALYS-EXTERN.md` | **ja** | Kortversion utan interna bedömningar |
| `saljmaterial/KOSTNADSKALKYL-OCH-PRISSATTNING.md` | nej | Kostnadssida, break-even, prisnivåer |
| `saljmaterial/KANDIDATLISTA-PRIVAT-VARD.md` | nej (skickas ALDRIG till kandidat) | 28 namngivna kandidater |
| `saljmaterial/KOPARANALYS.md` | nej | Attraktivitet ur fyra köparrollers perspektiv. Läs §15 innan du litar på §7/§11 |
| `saljmaterial/SALJMATERIAL-UNDERLAG-FOR-BEDOMNING.md` | nej | Faktaverifiering av paketet mot kod |
| `saljmaterial/Synappsen-demomanus.md` | nej | 30-minutersdemo |
| `saljmaterial/Synappsen-invandningshantering.md` | nej | Invändningar och svar |
| `saljmaterial/Synappsen-epostmallar.md` | nej | Elva mallar |
| `saljmaterial/kallfiler/Synappsen-onepager-PRIVAT-VARDGIVARE.html` | **ja** | One-pager, privat vårdgivare |
| `saljmaterial/kallfiler/Synappsen-onepager-KOMMUNAL-VARD-OCH-OMSORG.html` | **ja** | One-pager, kommunal omsorg |
| `saljmaterial/kallfiler/Synappsen-onepager-REGION-OCH-SJUKHUS.html` | **ja** | One-pager, region/sjukhus |

## Mallar

| Dokument | Extern | Innehåll |
|---|---|---|
| `avtal/PUB-AVTAL-MALL.md` | **ja** | Personuppgiftsbiträdesavtal, art. 28 |

## Internt (leverantörens eget arbete – når aldrig kunden)

Dokument som rör leverantörens egna verktyg och drift. **Separerade från `etapplaner/` med
flit** (ägarens krav 2026-08-27): kundvänd utveckling och internt arbete ska inte blandas,
varken i planerna eller i ändringsloggen. Se genomgående krav 36 i `intern/ETAPPLAN-INTERN-1.md`.

| Dokument | Typ | Innehåll |
|---|---|---|
| `intern/ETAPPLAN-INTERN-1.md` | referens | Etapp L1 – leverantörspanelen. **Antagen 2026-08-29, SLUTFÖRD 2026-08-30** (v1.1): samtliga 16 delmål byggda och alla 7 beslutspunkter avgjorda. Ändras inte längre löpande |
| `intern/ANDRINGSLOGG-INTERN.md` | levande | Ändringslogg för internt arbete. Utlöses av att ett internt delmål byggs. Får ALDRIG slås ihop med `src/data/andringslogg.js`, som är kundvänd |

---

## Historiska dokument – ändras inte

Dessa beskriver avslutade skeden. **Rör inte innehållet** – värdet ligger i att kunna se vad
som gällde när. Enda undantaget hittills är rubriknormaliseringen 2026-08-14 (rad 1 i varje
planfil, på ägarens uttryckliga instruktion) och mappflytten 2026-08-23 (sökväg, inte innehåll).

| Dokument | Innehåll |
|---|---|
| `etapplaner/ETAPPLAN.md` | Etapp 0–5: organisationsmodell, grundfunktioner |
| `etapplaner/ETAPPLAN2.md` | Etapp 6–12: leverantörsadmin, feature-gating, säkerhetshärdning |
| `etapplaner/ETAPPLAN3.md` | Etapp 13–21: upphandlingspaket, revisionslogg, onboarding |
| `etapplaner/ETAPPLAN4.md` | Etapp 22–31: medarbetarnära funktioner |
| `etapplaner/ETAPPLAN5.md` | Etapp 32–36: säkerhet, upptäckt, incidentberedskap |
| `etapplaner/ETAPPLAN5-ALT-A.md` | Utkast som INTE antogs |
| `etapplaner/ETAPPLAN5-ALT-B.md` | Utkast som INTE antogs |
| `etapplaner/ETAPPLAN6.md` | Etapp 37–41: innehållets hälsa, redaktörens vardag |
| `etapplaner/ETAPPLAN7.md` | Etapp 42–43: gränssnittsförnyelse |
| `etapplaner/ETAPPLAN8.md` | Etapp 44, 46, 47: mobilkänsla, incidentberedskap, sök |
| `etapplaner/ETAPPLAN9.md` | Etapp 45: kvalitetsmaskineriet riktas utåt |
| `etapplaner/ETAPPLAN10.md` | Etapp 48–52: "Redo att drivas" |
| `etapplaner/ETAPPLAN11.md` | Etapp 53–58: e-post, flerenhet, kiosk, SSO |
| `etapplaner/ETAPPLAN12.md` | Etapp 59–63: "Från demo till drift" |
| `etapplaner/ETAPPLAN13.md` | Etapp 64: baspaketet. **Antagen men juridiskt blockerad** |
| `etapplaner/ETAPPLAN14.md` | Etapp 65: fyra vardagsfunktioner |
| `etapplaner/ETAPPLAN15.md` | Etapp 66: fyra tillägg på byggd grund |
| `etapplaner/ETAPPLAN16.md` | Etapp 67: leverantörens överblick |
| `etapplaner/ETAPPLAN17.md` | Etapp 68: visuell finputsning |
| `etapplaner/ETAPPLAN18.md` | Etapp 69: appen på en datorskärm |
| `etapplaner/ETAPP1-ARBETSUPPGIFTER.md` | Uppgiftslista för allra första etappen |
| `etapplaner/STATUSARKIV.md` | 117 historiska uppföljningar ur `CLAUDE_STATUS.md` |
| `granskningar/GRANSKNING-2026-08-11.md` | Extern granskning, tidsstämplad |
| `granskningar/GRANSKNING-IDEBANK-2026-08-30.md` | Granskning av produktidébanken, tidsstämplad. **OBS:** det granskade dokumentet (idébanken, 18 förslag) finns INTE i repot – granskningen är ändå självbärande eftersom den citerar det den prövar, och den är källan till `etapplaner/ETAPPLAN19.md` v0.2 |
| `granskningar/AVSETT-ANDAMAL-KLINIKSTOD-2026-08-30.md` | Klinikstöd-sökningens avsedda ändamål enligt MDR art. 2.12, tidsstämplad. Skriven som Etapp 72 undantag 1. Ändra bara om funktionens faktiska ändamål ändras – annars är en ändring där ett tecken på att koden och det formulerade ändamålet glidit isär |
| `granskningar/VERTEX-AI-MIGRERING-KOSTNADSUPPSKATTNING-2026-08-30.md` | Grov arbetsuppskattning för en migrering från publika Gemini API:et till Vertex AI, tidsstämplad. Skriven som Etapp 72 undantag 1. Refererad från `avtal/UNDERBITRADEN.md` |
| `granskningar/AI-INTEGRATIONSRISKER-2026-09-06.md` | Åtta namngivna fynd om personuppgifter, hallucination och MDR-avgränsning i de sex AI-anropsställena, tidsstämplad. Levande dokument – lägg till en ny sektion (bocka aldrig av ett fynd som löst utan att verifiera mot kod) i stället för att skriva om ett gammalt. Statusspårning per fynd i `OPPNA-PUNKTER.md` |
| `granskningar/SAKERHETSGRANSKNING-2026-08.md` | Säkerhetsgenomgång, tidsstämplad |

---

## Vad som är bevakat mekaniskt, och vad som inte är det

**Bevakat** (`tests/docs/`):

| Test | Vad det hindrar |
|---|---|
| `dokumentregister.test.js` | Att ett dokument tillkommer, flyttas eller raderas utan att registret följer med. Att `CLAUDE_STATUS.md` växer sig oläslig igen |
| `dokumentpastaenden.test.js` | Att ett dokument påstår något som koden motsäger – rollantal, artikel 50-märkning, kundpåståenden, pausad/aktiv funktion |
| `pitch-version.test.js` | Att `saljmaterial/PITCH.md`s versionsrubrik glider från `package.json` |

**Inte bevakat, och det ska man veta:** ett test kan bara kontrollera påståenden som någon
har brytt sig om att koda. Prosa som ingen har omvandlat till en assertion kan fortfarande
ruttna tyst. Därför gäller fortfarande: **när du bygger något som ett dokument beskriver,
uppdatera dokumentet i samma commit.** Registret talar om vilket dokument det gäller;
testerna fångar bara den delmängd som gick att formulera maskinellt.

När du upptäcker ett felaktigt påstående i ett dokument – lägg till en assertion i
`dokumentpastaenden.test.js` samtidigt som du rättar texten. Det är så listan växer, och det
är billigare än att upptäcka samma fel igen om tre månader.
