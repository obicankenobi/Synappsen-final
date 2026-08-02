# ETAPPLAN 7 – Gränssnittsförnyelse

**✅ ANTAGEN 2026-08-02.** Utgångsläge v5.63.0, efter att Etapp 37–39 (`ETAPPLAN6.md`) blivit
klara. Etapp 42.

**Detta är den AKTIVA planen för nytt arbete.** `ETAPPLAN6.md` är inte stängd – dess
kvarvarande punkter (Etapp 40, villkorad av en konkret ny kund, och Etapp 41, lågt hängande
frukt som kan tas när som helst) är **inte blockerade av kapacitet**, bara av att den här
planen kom i vägen kronologiskt. Ta dem närhelst det passar; bygg allt nytt UI-arbete härifrån.

> **Bakgrund:** användaren tog fram två fristående, AI-genererade UI-designutkast för
> Synappsen ("Nordic Clinical" – en lugn, kortbaserad stil, och "Synappsen Redesign" – en
> tätare, mer klinisk stil med en tillhörande mobilmockup) och bad om en jämförelse. Den här
> planen är sammanställningen av den granskningen: vilka delar av respektive utkast som är
> värda att bygga, i vilken ordning, och vad som medvetet väljs bort. Ingen av de två
> mockuperna ska adopteras i sin helhet – se premisskontrollen nedan för varför.

---

## Premisskontroll utförd före antagande (genomgående krav 8)

Båda mockupernas centrala påståenden är kontrollerade mot faktisk kod 2026-08-02, innan planen
antogs:

| Påstående i mockuperna | Verifierat |
|---|---|
| Färger/badge-system är "lyft direkt från `src/index.css`/`utils/badge.js`" (mockupernas egna `github.md`-anteckningar) | ⚠️ **Delvis falskt.** Stickprov visar att paletten är INSPIRERAD av de riktiga tokens, inte identisk. Ingen av mockuperna får antas vara pixel-facit för färg/spacing – se 42e. |
| En samlad, domänöverskridande godkännandekö ("Godkännanden") | ❌ **Finns inte idag.** Godkännande sker per sektion via `godkannAllaUtkast()` i `Sektionssida.jsx` ("Godkänn alla"-knappen), en kö per område – inte en gemensam vy. Det här är alltså en GENUIN ny funktion, inte en flytt av något befintligt. |
| En flytande, alltid synlig Akut-knapp | ❌ **Finns inte idag.** `hem__akutlage-knapp` existerar bara på `Hem.jsx` – försvinner så fort man navigerar till en sektionssida. |
| Egen nav-post för Sök | ❌ Sök är idag ett inbäddat fält (`SokFalt.jsx`) på Hem, inte en egen route/nav-post i `BottomNav.jsx`. |
| Egen nav-post för Nyheter i huvudnavigationen | ❌ `/nyheter`-routen finns (`App.jsx:192`), men syns inte i `BottomNav.jsx` – nås idag via en länk någon annanstans. |
| Bulk-godkänn/markera flera i listvyer | ✅ Finns delvis redan (`godkannAllaUtkast`, samt bulk-hantering byggd i Etapp 38 för ändringsförslag i `ForslagSektion.jsx`) – 42b generaliserar mönstret, bygger inte om det från grunden. |
| Mörkt läge (växlare i Design 2) | ⚠️ **Overifierat.** Växlaren finns strukturellt i mockupen men gick inte att bekräfta att den faktiskt växlar färger vid granskningen (Playwright-testet klickade troligen fel element). Anta INTE att funktionen är komplett förrän den testats i mockupen själv. |

**Slutsats:** ingen av mockuperna är en färdig ritning att implementera rakt av. De är två
källor att ta enskilda, namngivna beslut ifrån (nedan) – resten av premisskontrollen (exakta
hex-värden, spacing-skala) görs som en del av 42e, INNAN något annat i planen börjar byggas.

---

## Modul: Core (UI/navigation), gäller alla tre domäner

# Etapp 42 – Gränssnittsförnyelse

**Varför:** Två oberoende granskade designutkast pekar båda på samma underliggande problem –
dagens listvyer (titel + status + datum) tvingar fram ett extra klick för att se innehåll,
ägare eller sammanhang, och godkännande sker spritt per sektion istället för samlat. Det är
samma typ av friktion `ETAPPLAN6.md` Etapp 38 redan löste för ändringsförslag; den här planen
generaliserar samma princip till nya utkast och till gränssnittet i stort.

- **42a – Innehållstätare listvyer.** Varje rutinkort i domänvyerna (Kliniskt stöd/Logistik/
  Administration) visar, utöver titel/status/datum: en kort förhandsvisning av innehållet,
  ägare + roll (redan tillgängligt via `agare`-fältet), taggar/kategori som ett filter utöver
  domänen, och bulk-knappar ("Markera flera") byggda på samma mönster som redan finns i
  `ForslagSektion.jsx`.
  **Ta INTE** med Design 2:s inline Godkänn/Neka-knappar i dessa listvyer – se 42b för varför.
- **42b – Samlad, domänöverskridande godkännandekö.** En ny sida/route ("Godkännanden") i
  huvudnavigationen med badge-räknare, som listar ALLA väntande utkast tvärs över domäner i en
  enda kö – med samma innehållstäthet som 42a (fulltext, ägare, datum, taggar), inte bara
  titel. Godkännande/avvisning sker ENDAST här, inte längre inline i de vanliga listvyerna –
  annars uppstår två parallella vägar att godkänna samma utkast. Bygger vidare på det
  redan existerande mönstret i `Sektionssida.jsx`/`ForslagSektion.jsx`, men gör kön
  domänöverskridande istället för en kö per sektion.
  **Roll-/behörighetskrav oförändrat:** vem som får godkänna vad i den samlade kön styrs
  fortfarande av exakt samma `farRedigeraOmrade`/`farGodkannaKlinisktInnehall`-logik som idag –
  den samlade vyn är en ny PRESENTATION av befintlig behörighet, inte en ny behörighetsmodell.
- **42c – Navigation.** Sök blir en egen nav-post/route (inte bara ett inbäddat fält på Hem).
  Nyheter blir en egen nav-post (routen `/nyheter` finns redan, saknas bara i navigationen).
  Akut-knappen görs **persistent och flytande på alla sidor**, inte bara Hem – det är den
  enskilt viktigaste UI-förändringen för akutläget, eftersom en knapp som försvinner så fort
  man bläddrar i Kliniskt stöd är fel prioritering i en akutmottagning.
- **42d – Hem/dashboard.** Lägg till "Senast besökta" och "Mest lästa" sida vid sida på Hem –
  mappar direkt till redan befintliga `useSenastBesokta`/`usePopularaste`, som idag inte har
  en lika tydlig egen plats i gränssnittet. Behåll dagens tre domänkort med rutinantal. En
  banderoll ("X rutiner väntar på godkännande") länkar vidare till 42b:s samlade kö.
- **42e – Design-tokenrevision (görs FÖRST, blockerar resten av etappen).** Innan någon av
  42a–42d byggs: diffa mockupernas faktiska hex-värden, spacing-skala och typsnittsstorlekar
  mot `src/index.css`/`utils/badge.js`. Premisskontrollen ovan visar att mockuppernas egna
  påståenden om att vara "lyfta direkt" från den riktiga paletten inte stämmer fullt ut – bygg
  därför mot de VERIFIERADE, riktiga tokens, inte mot vad mockupen råkar rendera med.
- **42f – Mobilvy (egen, avgränsad delinsats, inte gated på 42a–42e).** En första riktig
  mobilanpassning: nedre flikbar (ersätter sidopanelen på smala skärmar, redan konceptuellt
  likt `BottomNav.jsx` men i en tätare, mer app-lik form) och samma persistenta,
  flytande Akut-knapp som 42c. Detta är en HELT NY yta (ingen mobilvy finns idag utöver att
  webbappen krymper responsivt) och bör tidsuppskattas separat – blanda inte ihop den med
  42a–42e:s ommöblering av befintliga skärmar.

**Klart när:** en redaktör kan beta av HELA sin godkännandekö (oavsett vilket område den
kommer ifrån) från en enda skärm, och en anställd i en akutsituation aldrig behöver navigera
bort från akut-knappen för att komma åt den.

---

## Beslutspunkter som kräver ägaren

1. **Utrullningsstrategi:** ska 42a–42d byggas och släppas som en enda stor omdesign, eller
   sektion för sektion (t.ex. 42b/godkännandekön först, som ger omedelbart mätbart värde,
   sedan resten)? Rekommendation: sektion för sektion, med 42e (tokenrevisionen) och 42b
   (samlad kö) i den ordningen som de två första leveranserna – lägst risk, tydligast nytta.
2. **Omfattning av 42f (mobil):** ska mobilvyn ingå i den här etappen alls, eller brytas ut
   till en helt egen, senare etapp? Mockupens mobilskärmar visar bara tre av flera vyer (Hem,
   Kliniskt stöd, Logistik) – Administration, Admin-panelen, Godkännanden och Nyheter i
   mobilformat är inte designade än.
3. **Mörkt läge:** ska det ingå i den här etappen, givet att det inte gick att verifiera som
   fungerande i källmockupen (se premisskontrollen)? Om ja: bygg det som en avgränsad
   delpunkt med egen testning, inte som en underförstådd bonus i 42a–42d.

---

## Sammanfattning

| Delpunkt | Innehåll | Insats | Vad det ger |
|---|---|---|---|
| 42e | Design-tokenrevision | Låg | Förhindrar ett andra, obemärkt designspråk |
| 42b | Samlad godkännandekö | Medel | En redaktör behöver bara en skärm för hela sin kö |
| 42a | Innehållstätare listvyer | Medel | Färre klick för att bedöma ett utkast |
| 42c | Navigation (Sök/Nyheter/persistent Akut) | Låg–medel | Akut alltid nåbar, oavsett sida |
| 42d | Hem/dashboard-tillägg | Låg | Synliggör redan byggd data (senast besökta/mest lästa) |
| 42f | Mobilvy | Hög (villkorad av beslutspunkt 2) | Första riktiga mobilupplevelsen |

**Om bara en sak hinns med:** 42e (tokenrevisionen) följt av 42b (samlad godkännandekö) – den
förra skyddar mot att bygga fel, den senare ger det mätbart största friktionslyftet.

---

## Vad denna plan medvetet INTE gör

| Idé från mockuperna | Varför inte (här) |
|---|---|
| Adoptera endera mockupens exakta färgpalett/spacing rakt av | Premisskontrollen visade att paletterna bara är inspirerade av, inte identiska med, de riktiga tokens – se 42e. |
| Inline Godkänn/Neka-knappar i de vanliga listvyerna (Design 2:s mönster) | Skulle skapa två parallella vägar att godkänna samma utkast – all godkännande samlas i 42b istället. |
| Bygga om behörighetsmodellen för vem som får godkänna vad | Ingen av mockuperna föreslår detta uttryckligen, men risken finns att en ny samlad vy av misstag slarvar bort per-område-kontrollen. 42b är explicit en ny PRESENTATION av befintlig `farRedigeraOmrade`-logik, inte en ny modell. |
| Fullständig mobilvy för samtliga skärmar (Administration, Admin, Godkännanden, Nyheter) | Mockupen visar bara tre skärmar i mobilformat. Se beslutspunkt 2 – resten är inte designat än. |
