# INCIDENT – CHECKLISTA

**Internt dokument. Delas inte med kund.**
Policyn som styr detta: `avtal/INCIDENTRESPONSPLAN.md`. Vid konflikt gäller policyn.

**Senast uppdaterad:** 2026-07-31 · **Motsvarar kodläge:** v5.54.0

> Den här filen är skriven för att läsas när du är ensam, trött och stressad. Följ den uppifrån
> och ned. Hoppa inte över steg 1–3 även om du tror att du vet vad som hänt.

---

## ⛔ LÄS DETTA FÖRST – tre saker du INTE ska göra

1. **Radera ingenting.** Inte loggar, inte konton, inte "skräpdata". Även det som ser ut som
   städning kan vara bevis. Bevarande går före allt annat utom att stoppa pågående skada.
2. **Stäng inte ute vårdpersonal reflexmässigt.** Om appen används just nu i en vårdsituation
   kan en utestängning skada mer än intrånget. Se steg 3 för hur du väljer åtgärd.
3. **Underrätta ingen förrän du vet något.** Ett för tidigt, felaktigt besked till en kund går
   inte att ta tillbaka. Du har 72 timmar från *kännedom* – inte 72 minuter.

**Andas. Sätt en timer på 30 minuter för steg 1–4. Det räcker nästan alltid.**

---

## Steg 0 · Starta anteckningen (2 min)

Skapa en fil `incident-ÅÅÅÅ-MM-DD.md` lokalt. Skriv löpande, med klockslag, allt du gör.
Detta blir både din utredning och ditt bevis på att du agerat.

```
## Incident ÅÅÅÅ-MM-DD

Upptäckt kl:            (klockslag)
Hur upptäcktes det:     (larm / kund / eget fynd / extern rapport)
Första bedömning:       P1 / P2 / P3
Kännedom föreligger:    JA / NEJ / OKLART   ← avgör 72h-klockan, se steg 5

### Logg
HH:MM  vad jag gjorde / vad jag såg
```

---

## Steg 1 · Pågår det just nu? (5 min)

| Fråga | Om JA |
|---|---|
| Är någon inloggad och gör något just nu? | Gå direkt till steg 3 (begränsa), återkom till steg 2 |
| Är det något som redan har hänt och är över? | Fortsätt till steg 2 – du har tid |
| Är tjänsten nere / akutläget onåbart? | **P1.** Driftstörning går före utredning. Fixa först, utred sedan |

**Var du tittar:**

- Firebase-konsolen → Firestore → Usage (onormal läs-/skrivvolym)
- Firebase-konsolen → Authentication (nya eller okända konton, senaste inloggning)
- Sentry (krascher – men **obs**, se rutan nedan)

> 🔍 **Blind fläck, bekräftad genom en skrivbordsövning (Etapp 34c, 2026-07-31):** ett konto
> som missbrukar behörighet det REDAN HAR (t.ex. en superadmin som läser 400 rutiner i en
> annan avdelning inom SAMMA organisation) lämnar **noll spår** – det är aldrig ett
> `permission-denied` (så Sentry ser inget) och en läsning loggas aldrig i revisionsloggen
> (bara skrivningar/ändringar gör det). **Den här specifika incidenttypen upptäcker vi INTE
> själva idag.** Den kräver att kunden själv märker och rapporterar det, eller en extern
> anmälan. Se Etapp 32b i `ETAPPLAN5.md` för vad som skulle stänga luckan (väntar på ett
> ägarbeslut, inte en kodfråga).
>
> ⚠️ **Vad Sentry INTE fångar (i övrigt):**
> Sentry fångar React-krascher via `ErrorBoundary` OCH (sedan Etapp 32a) nekade
> Firestore-listningar (`permission-denied` från en `onSnapshot`-lyssnare) – dessa syns nu som
> en egen Sentry-händelse (tagg `typ: permission-denied-listning`) med collection, roll,
> organisation och sökväg, aldrig dokumentinnehåll. Sedan Etapp 32c LOGGAS även rollbyte och
> plattformsadmins tvärorganisatoriska översiktsanrop i revisionsloggen (se `/admin` →
> Revisionsloggen) – men ingen av dessa skapar ett realtidslarm ännu. Massläsning av
> kundinnehåll och misslyckade inloggningsförsök loggas fortfarande INTE alls, och inget av
> ovanstående skickar ett aktivt larm till dig – du måste själv gå in och titta
> (realtidslarm = Etapp 32b, ej byggt än).
> **Frånvaro av Sentry-händelser betyder alltså fortfarande INTE att inget hänt.**

---

## Steg 2 · Bevara bevis (10 min) – gör detta före allt annat du kan vänta med

- [ ] Skärmdumpa allt onormalt du ser, med klockslag synligt
- [ ] `/admin` → **Revisionsloggen** – exportera. Notera senaste posten och dess hash
- [ ] `/admin` → **Ändringsloggen** – filtrera på berörd användare/tidsperiod, exportera
- [ ] Firebase-konsolen → Authentication → notera uid, e-post, senaste inloggning, IP om synligt
- [ ] Notera exakt tidsintervall du misstänker (från–till)

**Kontrollera revisionsloggens integritet** (hashkedjan): `/admin` → Revisionslogg →
verifieringsfunktionen. Om den rapporterar brott: **det är i sig en P1** – någon har rört
loggen. Skriv ned det och gå vidare med största försiktighet.

---

## Steg 3 · Begränsa – välj minsta verksamma åtgärd (10 min)

**Regeln:** börja smalast möjligt. Bredda bara om det smala inte räcker.

| Situation | Åtgärd | Var | Patientsäkerhetsrisk |
|---|---|---|---|
| Ett konto beter sig fel | **Tvinga utloggning** på just det kontot | `/admin` → Användare & roller | Låg – men om det är en tjänstgörande sjuksköterska, ring först om du kan |
| Kontot har för hög behörighet | **Sänk rollen** | `/admin` → Användare & roller | Låg |
| Misstänkt kapning, kontot behövs inte akut | Tvinga utloggning **+** sänk roll | `/admin` | Låg |
| Hela organisationen är komprometterad | **Pausa organisationen** | `/leverantor` | **HÖG – hela avdelningen förlorar åtkomst.** Sista utvägen. Ring kunden först |
| Läckt API-nyckel (Gemini/sökmotor) | Rotera nyckeln i Secret Manager, deploya om | GitHub Secrets + deploy-workflow | Ingen |
| Ditt eget plattformsadminkonto | Återkalla direkt, utan tvekan | Firebase-konsolen | Ingen – det är bara du |

> **Innan du pausar en hel organisation:** fråga dig om skadan av att avdelningen inte når sina
> rutiner under en vårdpass är mindre än skadan av att låta intrånget fortsätta i en timme till.
> Oftast är svaret nej. Riktade åtgärder först.

---

## Steg 4 · Kartlägg omfattningen (15 min)

Besvara i denna ordning och skriv ned svaren:

1. **Vilka organisationer är berörda?** ← viktigast, styr all kommunikation
2. **Vilka datatyper?** (rutiner / kontakter / förråd / kommentarer / användaruppgifter)
3. **Vilken tidsperiod?**
4. **Är exponeringen avslutad?**

**Så tar du reda på det idag** (⏳ automatiseras i Etapp 32b):

- Revisionsloggen filtrerad på aktörens uid ger händelser (publicering, godkännande,
  borttagning, organisationsändringar, rollbyten – sedan Etapp 32c – och, om det är en
  plattformsadmin, även när denne listat alla kundorganisationer eller hämtat
  månadsrapporten).
- Ändringsloggen ger bredare aktivitet.
- **Begränsning att känna till:** *läsningar* loggas inte. Du kan se vad någon ändrat, inte
  vad de sett. Vid misstänkt datauttag måste du därför anta det bredare scenariot: allt som
  personens roll och organisation gav åtkomst till. Skriv det uttryckligen i din bedömning.

**Påminnelse om isoleringen:** organisationsgränsen är hårt kontrollerad i `firestore.rules`
och bevisad med 149 regeltester. Att en användare i org A skulle ha sett org B:s data är
osannolikt – men *verifiera* det, anta det inte.

---

## Steg 5 · Är det en personuppgiftsincident? (BESLUT – dokumentera det)

Detta beslut startar 72-timmarsklockan. Ta det medvetet och skriv ned motiveringen.

```
Är det en personuppgiftsincident?

Har personuppgifter varit åtkomliga för någon obehörig?      JA / NEJ
Har personuppgifter förstörts, ändrats eller gått förlorade?  JA / NEJ
Vet jag med rimlig visshet att det faktiskt hänt?             JA / NEJ / OKLART
```

- **JA på någon av de två första + JA på den tredje → kännedom föreligger.**
  Skriv ned klockslaget. **Deadline = det klockslaget + 72 timmar.** Skriv ut deadline med
  datum och tid i anteckningen.
- **OKLART** → fortsätt utreda, men sätt en påminnelse: om det fortfarande är oklart om
  24 timmar, behandla det som JA. Osäkerhet är inte ett skäl att låta klockan stå stilla.
- **NEJ** → dokumentera varför. Det räcker inte att tycka; skriv resonemanget.

> Vilka personuppgifter finns i appen? Namn, e-post, roll, organisationstillhörighet,
> läskvitteringar, kommentarer och profilbilder. **Patientuppgifter ska aldrig finnas** – om du
> hittar sådana är det en egen incident, oavsett obehörig åtkomst.

---

## Steg 6 · 72-timmarsklockan

- [ ] Deadline uträknad och nedskriven: `____-__-__ kl. __:__`
- [ ] Påminnelse satt vid halva tiden (36 h)
- [ ] Kundkontakt identifierad (se `avtal/IT-FAKTABLAD.md`)

**Vänta inte på en färdig utredning.** GDPR art. 33.4 tillåter uttryckligen underrättelse i
etapper. Skicka det du vet inom fristen och komplettera efterhand. Att missa fristen för att
du ville ha ett komplett svar är ett självförvållat fel.

---

## Steg 7 · Underrätta kunden

**Du underrättar kunden. Kunden anmäler till IMY** – du gör det aldrig i deras ställe.

Mall att utgå från:

```
Ämne: Säkerhetsincident i Synappsen – underrättelse enligt personuppgiftsbiträdesavtal p. 8

Hej [namn],

Vi underrättar er om en säkerhetsincident som berör er organisation i Synappsen.

Vad som hänt:        [kort, sakligt, ingen spekulation]
När:                 [tidsperiod]
Vilka uppgifter:     [kategorier – t.ex. namn, e-postadresser, roller]
Ungefärligt antal:   [antal registrerade, eller "kan ännu inte fastställas"]
Sannolika följder:   [saklig bedömning]
Vidtagna åtgärder:   [vad du redan gjort]
Planerade åtgärder:  [vad som återstår]

Ni är personuppgiftsansvariga och avgör om anmälan till IMY ska göras. Vi bistår med det
underlag ni behöver.

Kontakt för frågor: [din kontaktuppgift]

Detta är en preliminär underrättelse. Vi återkommer med kompletterande information
[när].
```

**Skriv aldrig:** gissningar, "det är nog inte så farligt", eller skuld på en enskild
användare. Sakligt, kort, verifierat.

---

## Steg 8 · Återställ

- [ ] Är normalt läge återställt?
- [ ] Om data gått förlorad: återställ från backup (Etapp 33a, klart 2026-07-31) –
      `aterstallOrganisationCallable` (Cloud Function, endast plattformsadmin). Ingen
      självbetjänings-knapp finns i UI:t (medvetet – en återställning är för farlig för att
      ligga bakom ett vanligt klick). Anropa den via Firebase-konsolen → Functions →
      `aterstallOrganisationCallable` → "Testa funktionen", med payloaden
      `{ "orgId": "<orgId>", "sokvag": "backups/<orgId>/<datum>.json" }` (backupfilernas
      sökvägar listas i Storage-konsolen under `backups/{orgId}/`). Funktionen vägrar en
      sökväg som inte ligger under exakt den angivna organisationens egen mapp, och hoppar
      över varje dokument vars `organisationId` inte matchar – en felriktad fil kan alltså
      aldrig skriva över en annan kunds data. Återställningstiden för en normalstor
      organisation är uppmätt till se `avtal/IT-FAKTABLAD.md` (Etapp 33d).
      **Gallring saknas ännu** (Etapp 33c, väntar på ett retentionsbeslut) – gamla
      backupfiler tas inte bort automatiskt idag.
- [ ] Har pausad organisation återaktiverats?
- [ ] Är roterade nycklar deployade och verifierade?
- [ ] Har du meddelat kunden att läget är återställt?

---

## Steg 9 · Efteråt (inom 15 arbetsdagar)

- [ ] Slutrapport till kund
- [ ] Efterhandsgenomgång enligt policyns avsnitt 10 – **inte skuldsökande, bara systemändrande**
- [ ] Uppdatera `avtal/INCIDENTRESPONSPLAN.md` om policyn visade sig otillräcklig
- [ ] **Uppdatera denna checklista** – vad saknades när du behövde den?
- [ ] Lägg in konkreta åtgärder som punkter i den aktiva etapplanen
- [ ] Om revisionsloggens integritet var bruten: särskild genomgång av hur

---

## Snabbreferens

### Var saker finns

| Vad | Var |
|---|---|
| Tvinga utloggning, ändra roll | `/admin` → Användare & roller |
| Revisionslogg (hashkedja) + export | `/admin` → Revisionslogg |
| Ändringslogg (bredare aktivitet) | `/admin` → Ändringslogg |
| Pausa/återaktivera organisation | `/leverantor` |
| Konton, inloggningar | Firebase-konsolen → Authentication |
| Läs-/skrivvolym | Firebase-konsolen → Firestore → Usage |
| Backupfiler | Firebase Storage → `backups/{orgId}/` |
| API-nycklar | GitHub Secrets → sätts i Secret Manager via deploy |
| Krascher | Sentry (**men se varningen i steg 1**) |

### Kontakter – FYLL I DESSA INNAN DU BEHÖVER DEM

| Vem | Kontakt | Status |
|---|---|---|
| Kundens tekniska kontakt / CISO | _______________ | ⬜ Ej ifyllt |
| Extern incidentkompetens (försäkring/konsult) | _______________ | ⬜ Finns inte ännu – se policyns avsnitt 11 |
| Juridiskt stöd (GDPR) | _______________ | ⬜ Ej ifyllt |
| IMY (kunden anmäler, men ha numret) | imy.se | ✅ |

> **Att fylla i tabellen ovan tar tio minuter och är den enskilt mest värdefulla förberedelsen
> i hela dokumentet.** Gör det nu, inte under en incident.

### Vad som ännu inte finns (uppdateras när det byggs)

| Förmåga | Status | Kommer i |
|---|---|---|
| Larm vid AI-budgetspik (80% av taket) | ✅ Klart (2026-07-31) | Etapp 32b |
| Larm på upprepade `permission-denied`, ovanlig läsvolym, misslyckade inloggningar | ⬜ **Kräver ägarbeslut + betald tjänst** (Sentry API-token / GCP-faktureringsexport, ej en kodfråga) | Etapp 32b, se beslutspunkt 6 |
| `permission-denied` rapporteras (till Sentry, ej realtidslarm) | ✅ Klart (2026-07-31) | Etapp 32a |
| Rollbyte loggas i revisionsloggen | ✅ Klart (2026-07-31) | Etapp 32c |
| Plattformsadmins tvärorg. läsning loggas | ✅ Klart (2026-07-31) | Etapp 32c |
| Hashkedjan kontrolleras automatiskt | ✅ Klart (2026-07-31, varje natt 04:00) | Etapp 32d |
| Automatisk omfattningsanalys | ⬜ Finns inte | Etapp 32b |
| Återställning från backup | ✅ Klart (2026-07-31, se steg 8) | Etapp 33a |
| Gallring av gamla backuper | ⬜ **Väntar på ägarens retentionsbeslut** | Etapp 33c |
| Extern incidentkompetens | ⬜ Ej upphandlad | Policyns avsnitt 11 |

**Så länge kolumnen ovan innehåller ⬜ är din faktiska detektionsförmåga begränsad till att
någon annan säger till dig.** Det är den ärliga bilden, och skälet till att Etapp 32 ligger
först i etapplanen.
