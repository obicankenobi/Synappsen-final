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

**Grupperat efter vad som faktiskt krävs (Etapp 63a, `ETAPPLAN12.md`), inte efter planfil.**
Tanken: en ägare med tio lediga minuter ska kunna se direkt vilka rader som ryms i dem, utan
att läsa alla nio för att hitta dem. De fem grupperna nedan är inte likvärdiga – "tio minuter"
och "väntar, bevaka bara" kräver ingen förberedelse; "ägarbeslut", "bokad människa" och
"tecknat avtal" gör det.

## Tio minuter vid tangentbordet (ingen bokning, inget beslut)

| Vad | Var det står beskrivet | Öppet sedan | Nästa konkreta handling |
|---|---|---|---|
| `INCIDENT-CHECKLISTA.md`s kontakttabell – 3 av 5 rader tomma (kundens tekniska kontakt/CISO, juridiskt stöd) | `INCIDENT-CHECKLISTA.md` | 2026-08-01 | Fyll i de tre tomma raderna |
| `TILLGANGLIGHETSREDOGORELSE.md`s `[FYLL I: datum]` (åtgärdsdatum för SYN-6) samt leverantörens juridiska namn/e-post | `TILLGANGLIGHETSREDOGORELSE.md` | Sedan dokumentet skrevs | Sätt ett realistiskt åtgärdsdatum och fyll i fälten. Egentligen ett litet åtagande snarare än ren ifyllnad (datumet behöver hålla), men kräver inget möte |
| ToS-genomgång för källbevakningens sju källdomäner | `SAKERHETSRAPPORT.md` (tillägg 2026-07-28), `ETAPPLAN5.md` | 2026-07-28 | Läs igenom och dokumentera i `SAKERHETSRAPPORT.md`. Ärlig notering: sju webbplatsers användarvillkor tar i praktiken längre än bokstavliga tio minuter, men kräver ingen extern part eller bokning – bara avsatt tid |

## Kräver ett ägarbeslut

| Vad | Var det står beskrivet | Öppet sedan | Blockerat av | Nästa konkreta handling |
|---|---|---|---|---|
| Fynd 3.3 – push-tokens ligger i `users/{uid}`, som hela organisationen får läsa, och användaren får skriva sitt eget tokenfält. En kollega kan därför få Synappsen-notiser att dyka upp på en utvald persons telefon | `SAKERHETSGRANSKNING-2026-08.md` fynd 3.3 | 2026-08-17 | Riktig fix kräver att tokens flyttas ur `users/{uid}` (Firestore saknar fältnivåläsrätt) med migrering och ändring i varje push-väg – en halvfärdig fix stänger av notiserna tyst för alla nuvarande användare. Faller under åtgärdsmandatets undantag "kan bryta produktionsåtkomst" | Ägaren säger ja/nej till att bygga `pushEnheter/{token}` med `{uid, organisationId}`, ägarbunden läs-/skrivrätt och en övergångsperiod där `skickaPush()` läser både gamla arrayfältet och den nya collectionen. Uppskattat omfång: en halv etapp |
| Fynd 4.1 – gör innehållssäkerhetspolicyn (CSP) skarp i stället för Report-Only | `SAKERHETSGRANSKNING-2026-08.md` fynd 4.1 | 2026-08-17 | En skarp policy kan bryta appen för användare om något legitimt bryter mot den – särskilt reCAPTCHA/App Check, som kan injicera egna inline-skript som hash-metoden inte täcker | Deploya först den redan skärpta report-only-policyn (`'unsafe-inline'` borttaget, `img-src` begränsad till Storage, `frame-ancestors` tillagd), läs Sentry-rapporterna några dagar, och byt sedan rubriknamnet till `Content-Security-Policy` om de är tysta. Ägaren beslutar när |
| Fynd 4.7 – härda deployjobbets leveranskedja | `SAKERHETSGRANSKNING-2026-08.md` fynd 4.7 | 2026-08-17 | Båda ändringarna rör deployvägen, som just nu är trasig av infrastrukturskäl (körning #79) och därför inte går att provköra | Ägaren säger ja/nej till att (1) pinna `actions/checkout` och `google-github-actions/auth` till commit-SHA i stället för flyttbara taggar, och (2) pinna `npm install -g firebase-tools` till en version. Görs lämpligen i samma svep som nästa lyckade deploy, så resultatet går att verifiera direkt |

## Kräver en bokad människa

| Vad | Var det står beskrivet | Öppet sedan | Nästa konkreta handling |
|---|---|---|---|
| **Boka in en riktig användare** (ett pass, fem rutiner, en checklista med handskar) | `ETAPPLAN9.md` Etapp 45 (nytt, från den externa granskningen) | 2026-08-04 | Boka en person och ett pass, se `ETAPPLAN9.md`s 45-bakgrund |
| Etapp 30b – fysiskt akutlägestest (riktig enhet, handskar, verklig belysning) | `ETAPPLAN4.md`, `ETAPPLAN5.md` | Sedan `ETAPPLAN4.md` (flera etapplaner) | Boka in testet, ingen kod krävs |
| Riktig skärmläsartestning (NVDA/JAWS/VoiceOver) – automatiserad testning fångar bara ~1/3 av tillgänglighetsproblem | `TILLGANGLIGHETSREDOGORELSE.md` (Etapp 45c, 2026-08-04) | 2026-08-04 | Boka en genomgång, gärna samma pass som "boka in en riktig användare" ovan |
| Etapp 64 (baspaketet) – kommissionera en extern juridisk bedömning (MDR-kvalificering, upphovsrätt, varumärkesrätt för instrumentnamn) | `ETAPPLAN13.md` §64, frågelistan i `JURIDISK-GRANSKNING.md` §18 (frågorna 1–6 täcker och överträffar planens egna fyra) | 2026-08-11 (planen antagen samma dag, se `BESLUTSLOGG.md`) | En betald extern juridisk genomgång, inte ett internt möte – men samma "bokad, inte kapacitet"-kategori. Samma uppdrag kan lämpligen omfatta HELA `JURIDISK-GRANSKNING.md`s bredare frågelista (bolagsform, datalagringsregion, AI-förordningen m.m.), inte bara Etapp 64:s del – se dokumentets avsnitt 18 i sin helhet. **Uppdaterat 2026-08-14:** §18 har nu även frågorna 20–22 (AI-sammanfattning av kunskapsstöd, patientriktad information, flödesschemaverktyg) – tre planerade funktioner som blockeras av samma rättsområden, tillagda för att slippa beställa ett andra uppdrag senare, se `ETAPPLAN15.md`s "Vad jag INTE föreslår". Ingen kod skrivs för Etapp 64 eller dessa tre förrän svaret finns |

## Kräver ett tecknat avtal

| Vad | Var det står beskrivet | Öppet sedan | Nästa konkreta handling |
|---|---|---|---|
| Brevo (Etapp 53a/53b) – rättslig grund/PUB-avtal med det nya underbiträdet, samt en riktig `BREVO_API_KEY` | `avtal/UNDERBITRADEN.md` | 2026-08-10 | Ägaren tecknar avtal med Brevo och sätter `BREVO_API_KEY` som GitHub-hemlighet. Koden (inbjudningsmejl m.m.) är byggd och testad, men utan nyckeln no-oppar `skickaEpost()` bara tyst – inbjudan skapas ändå, bara mejlet uteblir |

## Väntar på en extern förutsättning (bevaka bara, ingen åtgärd möjlig än)

| Vad | Var det står beskrivet | Öppet sedan | Blockerat av | Nästa konkreta handling |
|---|---|---|---|---|
| Etapp 35e – App Check-enforcement (`enforceAppCheck: true`) | `ETAPPLAN5.md` §35e | 2026-08-01 (senaste uppföljning) | Verifieringsgraden i Firebase-konsolen är för låg (Firestore 89%, Storage 0/10 vid senaste koll) | Kontrollera Build → App Check → Metrics igen om några veckor |
| Etapp 40 (`ETAPPLAN6.md`) – importstöd vid en ny kunds inflyttning | `ETAPPLAN6.md` §40 | 2026-08-01 | Väntar på att en konkret ny kund blir aktuell | Bevaka, bygg inte i förväg (se planens egen motivering) |

**Medvetet UTANFÖR listan:** punkter där ägaren redan sagt nej/vänta med ett giltigt
omprövningsvillkor (t.ex. Etapp 36c, externt penetrationstest – se `ETAPPLAN5.md`; eller
Etapp 54c/54d och Etapp 58/13f, se `BESLUTSLOGG.md` 2026-08-10) är ett BESLUT, inte en öppen
punkt – de hör hemma i `BESLUTSLOGG.md`, inte här.
