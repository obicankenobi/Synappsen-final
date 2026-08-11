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
| Etapp 32b – tre kvarvarande larmtyper (avvikande läsvolym, upprepade `permission-denied`, ovanliga inloggningar) **+ Etapp 48c – täckningsbidrag per kund** (bekräftat 2026-08-06: samma blockering) | `ETAPPLAN5.md` §32b, `ETAPPLAN10.md` §48c | 2026-07-31 | Ägarbeslut: aktivera GCP-faktureringsexport till BigQuery (GCP-konsolen, inte en kodändring)? | Ägaren avgör om exporten ska aktiveras – låser upp båda punkterna på en gång |
| `storage.rules` tillåter SVG i alla bilduppladdningsvägar (`arBild()` matchar `image/svg+xml`), inklusive organisationslogotypen – en SVG kan bära inbäddad JavaScript och är den klassiska vägen till lagrad XSS från en lagringsdomän | `storage.rules` (kommentar vid `arBild()`), `SAKERHETSRAPPORT.md` tillägg 2026-08-11 | 2026-08-11 (granskning) | Ägarbeslut: behövs SVG för organisationslogotypen, eller räcker PNG/JPEG? | Om SVG inte behövs: byt `arBild()` till en allowlist utan `svg`. Om det behövs: sanera SVG:n server-side (t.ex. strippa `<script>`/event-attribut) innan den serveras |

## Kräver en bokad människa

| Vad | Var det står beskrivet | Öppet sedan | Nästa konkreta handling |
|---|---|---|---|
| **Boka in en riktig användare** (ett pass, fem rutiner, en checklista med handskar) | `ETAPPLAN9.md` Etapp 45 (nytt, från den externa granskningen) | 2026-08-04 | Boka en person och ett pass, se `ETAPPLAN9.md`s 45-bakgrund |
| Etapp 30b – fysiskt akutlägestest (riktig enhet, handskar, verklig belysning) | `ETAPPLAN4.md`, `ETAPPLAN5.md` | Sedan `ETAPPLAN4.md` (flera etapplaner) | Boka in testet, ingen kod krävs |
| Riktig skärmläsartestning (NVDA/JAWS/VoiceOver) – automatiserad testning fångar bara ~1/3 av tillgänglighetsproblem | `TILLGANGLIGHETSREDOGORELSE.md` (Etapp 45c, 2026-08-04) | 2026-08-04 | Boka en genomgång, gärna samma pass som "boka in en riktig användare" ovan |
| Etapp 64 (baspaketet) – kommissionera en extern juridisk bedömning (MDR-kvalificering + upphovsrätt, fyra konkreta frågor i planens "Klart när") | `ETAPPLAN13.md` §64 | 2026-08-11 (planen antagen samma dag, se `BESLUTSLOGG.md`) | En betald extern juridisk genomgång, inte ett internt möte – men samma "bokad, inte kapacitet"-kategori. Ingen kod skrivs förrän svaret finns |

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
