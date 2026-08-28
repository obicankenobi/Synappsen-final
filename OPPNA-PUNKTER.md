# Öppna punkter – samlat register

**Syfte:** ett enda ställe att läsa istället för statusblocken i fyra-fem `ETAPPLANx.md`-filer,
för punkter som INTE är blockerade av kapacitet – de väntar på en människa, ett beslut eller
extern tid. En extern granskning (2026-08-04, se `CLAUDE_STATUS.md` "Uppföljning 2026-08-04
(Etapp 45)") pekade ut att fem sådana punkter stod stilla i tre veckor medan ett tjugotal
etapper byggdes – det här registret finns för att göra dem lika synliga som byggarbetet, inte
för att ersätta planfilerna (de behåller de fulla detaljerna, resonemangen och alternativen).

**Levande dokument.** Uppdatera i SAMMA commit som en punkt läggs till, avklaras eller
omprioriteras – se `CLAUDE.md`s underhållsregel för den här filen. En rad som blir klar tas
bort härifrån (den finns kvar i sin planfils historik) snarare än att markeras överstruken.

**Grupperat efter vad som faktiskt krävs (Etapp 63a, `etapplaner/ETAPPLAN12.md`), inte efter planfil.**
Tanken: en ägare med tio lediga minuter ska kunna se direkt vilka rader som ryms i dem, utan
att läsa alla nio för att hitta dem. De fem grupperna nedan är inte likvärdiga – "tio minuter"
och "väntar, bevaka bara" kräver ingen förberedelse; "ägarbeslut", "bokad människa" och
"tecknat avtal" gör det.

## Tio minuter vid tangentbordet (ingen bokning, inget beslut)

| Vad | Var det står beskrivet | Öppet sedan | Nästa konkreta handling |
|---|---|---|---|
| **Ge Cloud Functions-tjänstekontot rollen Firebase Authentication Admin** (`roles/firebaseauth.admin`) i Google Cloud IAM. Kontot heter `<projektnummer>-compute@developer.gserviceaccount.com` | `CLAUDE_STATUS.md` uppföljning 2026-08-26 | 2026-08-26 | **BLOCKERAR TRE FUNKTIONER I PRODUKTION.** Utan rollen kastar varje `admin.auth()`-anrop "Credential implementation … insufficient permission" – bekräftat i Sentry. Det slår ut tvingad utloggning, kontoavstängning och kontoradering, och gör att organisationsradering tyst lämnar kvar Auth-konton (`avtalslivscykel.js` sväljer felet med `.catch(() => {})`). Ingen kodändring kan kringgå det |
| `drift/INCIDENT-CHECKLISTA.md`s kontakttabell – 3 av 5 rader tomma (kundens tekniska kontakt/CISO, juridiskt stöd) | `drift/INCIDENT-CHECKLISTA.md` | 2026-08-01 | Fyll i de tre tomma raderna |
| `granskningar/TILLGANGLIGHETSREDOGORELSE.md`s `[FYLL I: datum]` (åtgärdsdatum för SYN-6) samt leverantörens juridiska namn/e-post | `granskningar/TILLGANGLIGHETSREDOGORELSE.md` | Sedan dokumentet skrevs | Sätt ett realistiskt åtgärdsdatum och fyll i fälten. Egentligen ett litet åtagande snarare än ren ifyllnad (datumet behöver hålla), men kräver inget möte |
| ToS-genomgång för källbevakningens sju källdomäner | `granskningar/SAKERHETSRAPPORT.md` (tillägg 2026-07-28), `etapplaner/ETAPPLAN5.md` | 2026-07-28 | Läs igenom och dokumentera i `granskningar/SAKERHETSRAPPORT.md`. Ärlig notering: sju webbplatsers användarvillkor tar i praktiken längre än bokstavliga tio minuter, men kräver ingen extern part eller bokning – bara avsatt tid |
| **Stäng de fyra kvarvarande WCAG-bristerna på nivå A** (#4 saknad `<h1>` på anslagstavlan, #5 notiser kan inte stängas med tangentbord, #6 notiser försvinner efter 5 s, #10 etikett omsluter både verktygsrad och fält) | `granskningar/TILLGANGLIGHETSREDOGORELSE.md` (rättad sammanfattning 2026-08-23) | 2026-07-26 (ärende SYN-6) | Fyra avgränsade kodändringar, timmar snarare än veckor. **Skälet att prioritera dem är kommersiellt, inte tekniskt:** formuleringen "kvarstående brister på nivå A" väger tungt i varje anbud (`saljmaterial/kallfiler/Synappsen-upphandlingssvar.html` svar D1) och `saljmaterial/KOPARANALYS.md` §6.7 pekar ut den som en av åtta saker som gör produkten mindre lockande. Kostnaden att ta bort formuleringen helt är låg i förhållande till vad den kostar per upphandling |

## Kräver ett ägarbeslut

| Vad | Var det står beskrivet | Öppet sedan | Blockerat av | Nästa konkreta handling |
|---|---|---|---|---|
| Fynd 3.3 – push-tokens ligger i `users/{uid}`, som hela organisationen får läsa, och användaren får skriva sitt eget tokenfält. En kollega kan därför få Synappsen-notiser att dyka upp på en utvald persons telefon | `granskningar/SAKERHETSGRANSKNING-2026-08.md` fynd 3.3 | 2026-08-17 | Riktig fix kräver att tokens flyttas ur `users/{uid}` (Firestore saknar fältnivåläsrätt) med migrering och ändring i varje push-väg – en halvfärdig fix stänger av notiserna tyst för alla nuvarande användare. Faller under åtgärdsmandatets undantag "kan bryta produktionsåtkomst" | Ägaren säger ja/nej till att bygga `pushEnheter/{token}` med `{uid, organisationId}`, ägarbunden läs-/skrivrätt och en övergångsperiod där `skickaPush()` läser både gamla arrayfältet och den nya collectionen. Uppskattat omfång: en halv etapp |
| Fynd 4.1 – gör innehållssäkerhetspolicyn (CSP) skarp i stället för Report-Only | `granskningar/SAKERHETSGRANSKNING-2026-08.md` fynd 4.1 | 2026-08-17 | En skarp policy kan bryta appen för användare om något legitimt bryter mot den – särskilt reCAPTCHA/App Check, som kan injicera egna inline-skript som hash-metoden inte täcker | Deploya först den redan skärpta report-only-policyn (`'unsafe-inline'` borttaget, `img-src` begränsad till Storage, `frame-ancestors` tillagd), läs Sentry-rapporterna några dagar, och byt sedan rubriknamnet till `Content-Security-Policy` om de är tysta. Ägaren beslutar när |
| **Utfallsgarantin (`saljmaterial/KOPARANALYS.md` §11.1) – ja eller nej, och i så fall med vilken formulering** | `saljmaterial/KOPARANALYS.md` §11.1 | 2026-08-23 | Analysens motivering ("marginalen är 99 %, garantin är nästan gratis") håller inte: kostnaden för en utlöst garanti är inte det återbetalda abonnemanget utan den nedlagda tiden, som `saljmaterial/KOSTNADSKALKYL-OCH-PRISSATTNING.md` §5.1 värderar till 1 000–1 600 kr/tim × 15–25 tim onboarding. Garantin är fortfarande möjligen värd att ge – men som ett riskinstrument, inte som något gratis | Ägaren säger ja/nej. Om ja: formulera fallbacken i kronor i stället för som "betalar bara uppstarten", eftersom uppstarten kan vara noll (se raden ovan). Beslutet hänger ihop med föregående rad och bör tas samtidigt |
| **Ska paketet `systemkunskap` (19 frågor om hur appen fungerar) behållas?** | `granskningar/MDR-BEDOMNING-OVNINGSFRAGOR-2026-08.md` §8 | 2026-08-27 | Ägaren har sagt att de är av lågt värde för vårdpersonal. Sedan Etapp 71 ligger de i ett eget paket som går att stänga av i adminvyn, så beslutet kostar ingenting att skjuta upp – men frågorna underhålls i två källor (`src/data/kvissbank.js` för rutinformuläret och `functions/kvissfragorSeed.js` för banken) så länge de finns kvar | Ägaren säger behåll/ta bort. Vid "ta bort": radera dem ur seeden, ur `src/data/kvissbank.js` och ur RutinFormular.jsx:s "lägg till från banken", samt ta bort bindningstestet i `src/data/kvissfragorSeed.test.js` |
| **Innehåll till paketet `kliniskt` (spår 2)** | `granskningar/MDR-BEDOMNING-OVNINGSFRAGOR-2026-08.md` §7, §8b | 2026-08-27 | Maskineriet är byggt och tomt: paketet finns, med `kalla`/`kallaDatum` per fråga, granskningsbarhet, lokal avstängning och globalt nödstopp. Det som saknas är innehållet, som väntar på den externa juridiska bedömningen (samma uppdrag som Etapp 64, se raden under "Kräver en bokad människa") | Invänta det juridiska svaret. Skriv sedan frågorna med källa och datum, och kör `seedaKvissbank` från leverantörsvyn |
| Fynd 4.7 – härda deployjobbets leveranskedja | `granskningar/SAKERHETSGRANSKNING-2026-08.md` fynd 4.7 | 2026-08-17 | Båda ändringarna rör deployvägen, som just nu är trasig av infrastrukturskäl (körning #79) och därför inte går att provköra | Ägaren säger ja/nej till att (1) pinna `actions/checkout` och `google-github-actions/auth` till commit-SHA i stället för flyttbara taggar, och (2) pinna `npm install -g firebase-tools` till en version. Görs lämpligen i samma svep som nästa lyckade deploy, så resultatet går att verifiera direkt |

## Kräver en bokad människa

| Vad | Var det står beskrivet | Öppet sedan | Nästa konkreta handling |
|---|---|---|---|
| **Boka in en riktig användare** (ett pass, fem rutiner, en checklista med handskar) | `etapplaner/ETAPPLAN9.md` Etapp 45 (nytt, från den externa granskningen) | 2026-08-04 | Boka en person och ett pass, se `etapplaner/ETAPPLAN9.md`s 45-bakgrund |
| Etapp 30b – fysiskt akutlägestest (riktig enhet, handskar, verklig belysning) | `etapplaner/ETAPPLAN4.md`, `etapplaner/ETAPPLAN5.md` | Sedan `etapplaner/ETAPPLAN4.md` (flera etapplaner) | Boka in testet, ingen kod krävs |
| Riktig skärmläsartestning (NVDA/JAWS/VoiceOver) – automatiserad testning fångar bara ~1/3 av tillgänglighetsproblem | `granskningar/TILLGANGLIGHETSREDOGORELSE.md` (Etapp 45c, 2026-08-04) | 2026-08-04 | Boka en genomgång, gärna samma pass som "boka in en riktig användare" ovan |
| Etapp 64 (baspaketet) – kommissionera en extern juridisk bedömning (MDR-kvalificering, upphovsrätt, varumärkesrätt för instrumentnamn) | `etapplaner/ETAPPLAN13.md` §64, frågelistan i `granskningar/JURIDISK-GRANSKNING.md` §18 (frågorna 1–6 täcker och överträffar planens egna fyra) | 2026-08-11 (planen antagen samma dag, se `BESLUTSLOGG.md`) | En betald extern juridisk genomgång, inte ett internt möte – men samma "bokad, inte kapacitet"-kategori. Samma uppdrag kan lämpligen omfatta HELA `granskningar/JURIDISK-GRANSKNING.md`s bredare frågelista (bolagsform, datalagringsregion, AI-förordningen m.m.), inte bara Etapp 64:s del – se dokumentets avsnitt 18 i sin helhet. **Uppdaterat 2026-08-14:** §18 har nu även frågorna 20–22 (AI-sammanfattning av kunskapsstöd, patientriktad information, flödesschemaverktyg) – tre planerade funktioner som blockeras av samma rättsområden, tillagda för att slippa beställa ett andra uppdrag senare, se `etapplaner/ETAPPLAN15.md`s "Vad jag INTE föreslår". Ingen kod skrivs för Etapp 64 eller dessa tre förrän svaret finns. **Uppdaterat 2026-08-27:** lägg även till spår 2 i `granskningar/MDR-BEDOMNING-OVNINGSFRAGOR-2026-08.md` (leverantörskurerade kliniska övningsfrågor) i uppdraget – den interna bedömningen landar i att MDR inte hindrar det, men slutsatsen bör prövas av samma jurist som tar Etapp 64, eftersom rättsområdet är detsamma |

## Kräver ett tecknat avtal

| Vad | Var det står beskrivet | Öppet sedan | Nästa konkreta handling |
|---|---|---|---|
| **Brevo – PUB-avtal saknas medan tjänsten ÄR I DRIFT** | `avtal/UNDERBITRADEN.md` (öppen brist, dokumenterad 2026-08-27) | 2026-08-10, **eskalerad 2026-08-27** | **Nyckeln är satt och domänen verifierad sedan 2026-08-27 – e-post skickas alltså skarpt nu.** Men PUB-avtalet är inte tecknat (ägaren bekräftade 2026-08-27), så personuppgifter (mottagares e-postadresser) behandlas av ett underbiträde utan skriftligt avtal enligt GDPR art. 28.3. Utskick sker automatiskt: **daglig påminnelse 09:00** (`skickaEpostPaminnelserSchemalagt`) och månadssammanfattning den 1:a. Teckna Brevos standard-DPA i kontoinställningarna – normalt ett godkännande, inte en förhandling. **Verkställt i v5.131.0:** allt utgående e-post är stoppat genom en spärr i koden (`PUB_AVTAL_BREVO_TECKNAT = false`), inte via den manuella driftflaggan – den senare bär ingen motivering och kan slås av av misstag. **När avtalet är tecknat:** sätt konstanten till `true`, fyll i datum i `avtal/UNDERBITRADEN.md` och ta bort den här raden |

## Väntar på en extern förutsättning (bevaka bara, ingen åtgärd möjlig än)

| Vad | Var det står beskrivet | Öppet sedan | Blockerat av | Nästa konkreta handling |
|---|---|---|---|---|
| Etapp 35e – App Check-enforcement (`enforceAppCheck: true`) | `etapplaner/ETAPPLAN5.md` §35e | 2026-08-01 (senaste uppföljning) | Verifieringsgraden i Firebase-konsolen är för låg (Firestore 89%, Storage 0/10 vid senaste koll) | Kontrollera Build → App Check → Metrics igen om några veckor |
| Etapp 40 (`etapplaner/ETAPPLAN6.md`) – importstöd vid en ny kunds inflyttning | `etapplaner/ETAPPLAN6.md` §40 | 2026-08-01 | Väntar på att en konkret ny kund blir aktuell | Bevaka, bygg inte i förväg (se planens egen motivering) |

**Medvetet UTANFÖR listan:** punkter där ägaren redan sagt nej/vänta med ett giltigt
omprövningsvillkor (t.ex. Etapp 36c, externt penetrationstest – se `etapplaner/ETAPPLAN5.md`; eller
Etapp 54c/54d och Etapp 58/13f, se `BESLUTSLOGG.md` 2026-08-10) är ett BESLUT, inte en öppen
punkt – de hör hemma i `BESLUTSLOGG.md`, inte här.
