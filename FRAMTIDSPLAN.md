# Synappsen – arkiv över ej antagna planer

*Senast omskriven 2026-08-01 · utgår från version 5.56.0.*

> **Filens roll har ändrats två gånger, och det är avsiktligt dokumenterat här.** Den skrevs
> ursprungligen 2026-07-14 (utgångsläge v5.7.0) som en egen utvecklingsplan och blev liggande
> oanvänd i 38 versioner medan `ETAPPLAN2–4.md` tog över. Den skrevs 2026-07-28 om till en kort
> pekare mot den aktiva planen – och hann då bli stale igen (den pekade på `ETAPPLAN4.md` som
> "aktiv" ända till 2026-08-01, elva releaser efter att `ETAPPLAN5.md` tagit över). Slutsatsen
> efter två misslyckanden med samma fil: **en pekare mot "den aktiva planen" blir alltid stale**,
> eftersom ingenting tvingar fram en uppdatering när planen byts. Filen har därför fått en roll
> som inte kan drifta isär från verkligheten på samma sätt: **ett arkiv över alternativ som
> övervägdes men inte antogs.** Ett arkiv är per definition inte färskvara.
>
> **Var den aktiva planen finns står numera bara i `CLAUDE.md`s dokumentkarta och i
> `CLAUDE_STATUS.md`** – båda har händelsestyrda underhållsregler som tvingar fram en
> uppdatering vid faktisk förändring.

## Ej antagna alternativ

Dessa tre övervägdes när `ETAPPLAN5.md` (säkerhet) närmade sig sitt slut. `ETAPPLAN6.md`
(innehållets kvalitet och bevisad nytta) antogs 2026-08-01 i stället. **Inget av dem är
förkastat** – de är bortvalda för stunden, med olika omprövningsvillkor.

| Alternativ | Finns som | Innehåll i korthet | Ompröva när |
|---|---|---|---|
| **Från byggd produkt till såld produkt** | `ETAPPLAN5-ALT-A.md` (fullständigt utkast) | SSO/Entra ID (13f), veckopuls (Etapp 16), kioskläge, onboarding utan konsult | **Omedelbart om en regionkund blir aktuell.** SSO blockerar den affären oavsett hur bra resten är. Bygger dessutom bäst vidare på `ETAPPLAN6.md` Etapp 39 – mätning först, säljargument sedan. |
| **Förtjäna förtroendet** | `ETAPPLAN5-ALT-B.md` (fullständigt utkast) | Rollmatris som testsvit, tomläge kontra felläge, WCAG AA utan förbehåll, akutläget under verkliga förhållanden | Efter `ETAPPLAN6.md`, eller tidigare om en ny 31b-liknande bugg dyker upp (en roll som tyst ser tomma listor). |
| **Kund nummer tre** | **Ingen egen fil** – bara den här raden | Flera enheter i samma organisation, demo/sandlåda, supportbarhet utan innehållsåtkomst, kostnad och kapacitet per kund | När en tredje kund är konkret. **Måste skrivas ut som en riktig planfil innan den kan antas** – behandla inte sammanfattningen ovan som ett färdigt beslutsunderlag. Överlappar `ETAPPLAN6.md` Etapp 40 (importstöd vid inflyttning); de två bör tas ihop, inte var för sig. |

## Kända öppna punkter (dokumenterade, ej aktivt planerade)

Dessa hör inte till något alternativ ovan – de är fristående och medvetet oplanerade.

- Kvitteringsfrist finns bara på anslag, inte rutiner (medvetet – rutiner har eget
  granskningsdatum).
- Det regelbaserade personnummerfiltret i `firestore.rules` saknar Luhn-validering (tekniskt
  omöjligt i Firestore-regler; det fulla, Luhn-validerade filtret finns i klient +
  Cloud Functions).
- Kioskläge (`FEATURE.KIOSK_MODE`) är reserverat som en feature-flagga men aldrig byggt – enda
  kvarvarande punkten från det ursprungliga Operations-paketet, se `MODULPLAN.md`. Ingår i
  alternativ A ovan.
- **Etapp 10a (demoläge/sandlåda)** i `ETAPPLAN2.md` – enda ej genomförda delmålet i Etapp 10.
  Ingår i "Kund nummer tre" ovan.
- **Etapp 11 (Intelligence 2.0)** – uttryckligen villkorad: bör vänta tills minst en kund
  faktiskt betalar för Intelligence-modulen.

## Stående underhåll (gäller oavsett vilken plan som är aktiv)

Det här stycket flyttades hit när filen blev arkiv, eftersom det inte hör hemma i en enskild
etappplan. **Den auktoritativa listan finns i `CLAUDE.md`s arbetsmönster** – nedan är bara de
punkter som är lätta att glömma och som inte fångas av en testsvit:

- Håll `GODKANDA_KALLDOMANER` (klient) och sökmotorns domänlista synkade vid ändringar av
  klinikstöd-källorna.
- Bevaka Custom Search-kvoten och Gemini-budgeten i adminpanelen när användningen växer.
- **Vid varje release:** bumpa `package.json` (+ `package-lock.json`s två versionsfält) och
  lägg till en post överst i `src/data/andringslogg.js`. `src/version.js` ska INTE röras – den
  läser versionen direkt från `package.json`. Två separata bakåtgående sessioner missade det
  senare i 19 respektive 6 releaser i rad innan det upptäcktes (2026-07-28).
