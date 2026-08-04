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

| Vad | Var det står beskrivet | Öppet sedan | Blockerat av | Nästa konkreta handling |
|---|---|---|---|---|
| **Boka in en riktig användare** (ett pass, fem rutiner, en checklista med handskar) | `ETAPPLAN9.md` Etapp 45 (nytt, från den externa granskningen) | 2026-08-04 | Ägarens tid att boka en anställd | Boka en person och ett pass, se `ETAPPLAN9.md`s 45-bakgrund |
| ToS-genomgång för källbevakningens sju källdomäner | `SAKERHETSRAPPORT.md` (tillägg 2026-07-28), `ETAPPLAN5.md` | 2026-07-28 | En människa som läser användarvillkoren för sju externa webbplatser | Läs igenom och dokumentera i `SAKERHETSRAPPORT.md` |
| Etapp 30b – fysiskt akutlägestest (riktig enhet, handskar, verklig belysning) | `ETAPPLAN4.md`, `ETAPPLAN5.md` | Sedan `ETAPPLAN4.md` (flera etapplaner) | En riktig enhet i en riktig verksamhet | Boka in testet, ingen kod krävs |
| Etapp 35e – App Check-enforcement (`enforceAppCheck: true`) | `ETAPPLAN5.md` §35e | 2026-08-01 (senaste uppföljning) | Verifieringsgraden i Firebase-konsolen är för låg (Firestore 89%, Storage 0/10 vid senaste koll) | Kontrollera Build → App Check → Metrics igen om några veckor |
| Etapp 32b – tre kvarvarande larmtyper (avvikande läsvolym, upprepade `permission-denied`, ovanliga inloggningar) | `ETAPPLAN5.md` §32b | 2026-07-31 | Ägarbeslut: köpa Sentry API-token/GCP-faktureringsexport? | Ägaren avgör om den betalda tjänsten ska köpas in |
| `INCIDENT-CHECKLISTA.md`s kontakttabell – 3 av 5 rader tomma (kundens tekniska kontakt/CISO, juridiskt stöd) | `INCIDENT-CHECKLISTA.md` | 2026-08-01 | Inget – tar tio minuter, ingen blockering | Fyll i de tre tomma raderna |
| `TILLGANGLIGHETSREDOGORELSE.md`s `[FYLL I: datum]` (åtgärdsdatum för SYN-6) samt leverantörens juridiska namn/e-post | `TILLGANGLIGHETSREDOGORELSE.md` | Sedan dokumentet skrevs | Kräver ett åtagande om datum, inte kod | Ägaren sätter ett realistiskt åtgärdsdatum |
| Etapp 13f – SSO/Microsoft Entra ID | `ETAPPLAN3.md` §13f, `ETAPPLAN5-ALT-A.md` | Sedan `ETAPPLAN3.md` | Ägarbeslut: SAML eller OIDC? | Ägaren väljer protokoll, bygget kan sedan planeras |
| Etapp 16 – veckopuls | `ETAPPLAN3.md` §16 | Sedan `ETAPPLAN3.md` | Ägarbeslut om omfattning | Ägaren tar ställning till om/hur den ska byggas |
| Etapp 40 (`ETAPPLAN6.md`) – importstöd vid en ny kunds inflyttning | `ETAPPLAN6.md` §40 | 2026-08-01 | Väntar på att en konkret ny kund blir aktuell | Bevaka, bygg inte i förväg (se planens egen motivering) |

**Medvetet UTANFÖR listan:** punkter där ägaren redan sagt nej/vänta med ett giltigt
omprövningsvillkor (t.ex. Etapp 36c, externt penetrationstest – se `ETAPPLAN5.md`) är ett
BESLUT, inte en öppen punkt – de hör hemma i en framtida `BESLUTSLOGG.md` (Etapp 45f), inte här.
