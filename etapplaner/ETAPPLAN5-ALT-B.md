# Etapplan 5 – UTKAST B: "Förtjäna förtroendet – tyst fel får inte finnas"

> **Detta är ett UTKAST, inte en antagen plan.** Det finns två alternativa utkast till
> Etapplan 5 – detta (spår B) och `etapplaner/ETAPPLAN5-ALT-A.md` (spår A). Meningen är att ETT av dem
> (eller en medveten kombination) väljs och skrivs om till `etapplaner/ETAPPLAN5.md`; det andra arkiveras
> eller stryks. Se jämförelsen längst ned i båda filerna.
>
> *Skrivet 2026-07-31, utgångsläge v5.50.0, efter att Etapp 22–31 är avklarade.*

---

## Utkastets grundtes

**Vi vet nu att appen kan vara trasig i månader utan att någon märker det.**

Det här spåret utgår inte från en känsla utan från en konkret, verifierad händelse i den här
kodbasen (Etapp 31b, 2026-07-31):

> Standardrollen `personal` – rollen **varje nyinbjuden medarbetare får som förval**
> (`DEFAULT_ROLE` i `src/firebase/roles.js`) – kunde inte se **rutiner, förrådsartiklar eller
> akutläget**. Inte "delvis". Ingenting. Listorna var tomma.
>
> Det upptäcktes först när ett e2e-test loggade in som just den rollen för första gången.
> Samtliga tidigare verifieringar hade använt redaktörskonton (`vol`/`superadmin`), där felet
> per definition inte kan uppstå.

Tre saker gör detta till mer än en bugg:

1. **Det var appens mest säkerhetskritiska funktion.** Akutläget hämtas globalt för alla
   inloggade och ska fungera för vem som helst i ett skarpt läge. Det gjorde det inte.
2. **Det gav ingen felsignal någonstans.** `src/sentry.js` fångar krascher via
   `ErrorBoundary` – men en nekad `onSnapshot`-lyssnare kraschar inte. Den loggar tyst i
   konsolen och renderar en tom lista. **Verifierat: felet hade varit osynligt i Sentry även
   med felrapportering fullt påslagen.** En tom lista och "det finns inga rutiner än" ser
   likadana ut för användaren.
3. **Det var fjärde gången samma buggklass dök upp** (Etapp 26, Etapp 29, och två gånger i
   31b). Det är inte otur längre – det är ett systematiskt hål i hur vi verifierar.

I en app som en sjuksköterska öppnar mitt i ett akutförlopp är "visar tyst ingenting" en
allvarligare defekt än "kraschar synligt". Det här spåret handlar om att göra den klassen av
fel omöjlig att missa.

**Risken med det här spåret:** nästan ingenting av det syns i en demo eller på en faktura. Det
gör produkten pålitlig, inte säljbar. Se spår A för motsatsen.

---

## Genomgående krav

De tio kraven i `etapplaner/ETAPPLAN3.md`/`etapplaner/ETAPPLAN4.md` gäller oförändrat. Två tillkommer i det här
spåret, båda direkta lärdomar av 31b:

11. **Ingen funktion är verifierad förrän den verifierats som `personal`.** Rollen utan
    redaktörsbehörighet är standardrollen och den absoluta majoriteten av användarna. Att
    testa som superadmin bevisar ingenting om vad personalen ser.
12. **Ett tomt läge måste kunna skilja på "inget finns" och "något gick fel".** Ingen vy får
    rendera en tom lista när den underliggande frågan misslyckades.

---

# Etapp 32 – Tyst fel ska bli högljutt

**Varför:** Den direkta orsaken till att buggen levde så länge. Så länge ett nekat dataanrop
ser ut som ett tomt resultat kommer nästa instans av samma klass också att överleva.

**Modul:** ingen (Core).

### 32a – Felmedvetna datahooks

- Varje `onSnapshot`-hook ska ta emot och exponera sitt error-callback, inte bara
  success-callbacket. I dag ignorerar de flesta hooks felfallet helt – bekräftat i
  `useRutiner.js`, `useForradsartiklar.js`, `useKontakter.js` m.fl.
- Returnera `{ data, laddar, fel }` istället för `{ data, laddar }`.
- **Omfattning: detta rör många filer.** Gör det som en genomgång, inte som en refaktor av
  arkitekturen – signaturen utökas, inget mönster byts ut.

### 32b – Tomläge kontra felläge i UI

- Där ett fel uppstått: visa "Kunde inte hämta X – försök igen" med en omförsöksknapp.
  ALDRIG samma tomläge som "det finns inga X än" (krav 12).
- Detta är den enda ändringen i hela spåret som en användare faktiskt ser.

### 32c – Rapportera nekade dataanrop till Sentry

- `permission-denied` från en lyssnare ska skapa en Sentry-händelse med collection, roll och
  organisation (**aldrig dokumentinnehåll** – se PII-kravet).
- Utan detta upptäcks nästa incident av en användare, inte av oss.

**Klart när:** ett nekat dataanrop i produktion syns för oss inom minuter, och för användaren
som ett fel – inte som tomhet.

---

# Etapp 33 – Rollmatris som testsvit

**Varför:** 31b:s e2e-svit består i dag av **tre tester i två filer**. Den hittade en kritisk
bugg på sitt allra första försök, vilket säger mer om hur oprövad ytan var än om testernas
förträfflighet. Nästa instans av samma klass sitter i en vy ingen ännu öppnat som `personal`.

**Modul:** ingen (Core).

### 33a – Alla huvudvyer × alla roller

- En datadriven svit: för varje kombination av de sex rollerna i `ROLES` och appens
  huvudvyer – logga in, navigera, och kräv noll `permission-denied` i konsolen.
- Detta är exakt generaliseringen av `list-provability.spec.js`, som i dag bara täcker en
  roll och tre sidor.
- **Förväntat utfall: sviten kommer att vara röd när den skrivs.** Det är hela poängen. Varje
  röd cell är en bugg som redan finns i produktion i dag.

### 33b – Innehåll syns, inte bara "inga fel"

- Ett tyst fel kan också vara ett filter som råkar exkludera allt. Testerna ska verifiera att
  seedat innehåll FAKTISKT renderas för de roller som ska se det – inte bara att inget
  skriker.

### 33c – Regelmotorns list-provability som ett stående skydd

- Buggklassen (`resource.data.<fält>` i en läsregel utan matchande `where()` i frågan) har nu
  dykt upp fyra gånger. Skriv ett test som går igenom `firestore.rules` och flaggar varje
  `allow read`-regel som refererar ett `resource.data`-fält, så att den medvetet måste paras
  ihop med en känd frågeform.
- Alternativt, om det visar sig för skört: en checklista i `CLAUDE.md` som måste följas när en
  ny collection läggs till. **Avgör vilket efter ett försök – bygg inte ett skört test bara
  för att idén är elegant.**

**Klart när:** ingen roll kan öppna någon huvudvy i appen och tyst se fel eller ingenting.

---

# Etapp 34 – Avsluta tillgängligheten på riktigt

**Varför:** Etapp 30c stängdes med en uttrycklig reservation: bara fokusindikatorn åtgärdades
app-brett, och `etapplaner/ETAPPLAN4.md` konstaterar att "tillgänglighetsredogörelsen kan inte ännu säga
AA helt utan förbehåll". För offentlig upphandling (DOS-lagen) är det förbehållet en konkret
brist – och för en användare med nedsatt syn är det inte en formalitet.

**Modul:** ingen (Core).

### 34a – Kontrastmätning av varje faktisk färgkombination

- `src/utils/kontrast.js` byggdes i Etapp 28c och räknar redan WCAG-kontrast. Använd den som
  ett test över appens egna tokens i BÅDA teman, istället för att lita på att de
  handplockade värdena fortfarande stämmer efter Etapp 28:s kundvalda accentfärger.

### 34b – Tangentbord genom hela flöden

- Inte bara "finns fokusring" utan "går det att slutföra uppgiften": skapa en rutin, kvittera,
  föreslå en ändring, öppna och stänga varje modal – utan mus. Fokusfällor i modaler är den
  vanligaste bristen och `ForeslaAndringModal`/`SkannaModal` har aldrig granskats för det.

### 34c – Uppdatera tillgänglighetsredogörelsen mot verkligheten

- `granskningar/TILLGANGLIGHETSREDOGORELSE.md` är ett lagkrav och ska spegla faktiskt läge – inte ambition.

**Klart när:** redogörelsen kan säga AA utan förbehåll, och det är sant.

---

# Etapp 35 – Akutläget under verkliga förhållanden (avsluta 30b/17d)

**Varför:** Två saker gör detta mer angeläget än när det skrevs. Dels har det stått öppet sedan
Etapp 17d. Dels vet vi nu att **akutläget var helt osynligt för standardrollen** – funktionen
har alltså aldrig kunnat testas skarpt av den personal den byggdes för.

**Modul:** ingen (Core).

### 35a – Testprotokoll före testet

- Skriv ned vad som ska prövas och vad som räknas som godkänt INNAN mötet: nås akutläget inom
  X sekunder från låst skärm, går knapparna att träffa med handskar, är kontrasten läsbar i
  starkt ljus, hittar en ovan användare rätt utan instruktion.
- Utan protokoll blir det ett trevligt samtal utan slutsats.

### 35b – Genomför testet med verksamheten

- **Kan inte göras som ett kodningsuppdrag.** Kräver fysiska personer, handskar och en
  akutmottagning. Detta är en boknings-, inte en byggnadsfråga.

### 35c – Åtgärda och stäng

- Det som testet visar, i den ordning verksamheten prioriterar.

**Klart när:** någon som faktiskt arbetar i akutrummet har använt akutläget med handskar på och
sagt att det fungerar.

---

## Beslutspunkter i det här spåret

Spår B är avsiktligt nästan beslutsfritt – det mesta går att påbörja direkt. Två undantag:

1. **Etapp 35b** kräver att verksamheten avsätter tid. Det är den enda hårda blockeringen.
2. **Etapp 33a kommer att avslöja fler buggar.** Beslut som behövs när det händer: fixar vi
   allt innan sviten görs blockerande i CI, eller släpper vi in den som varnande först? (Min
   rekommendation: fixa allt. En röd svit man vant sig vid är värdelös.)
3. **Kvarstående sedan tidigare:** 31c/12c-ii (App Check-enforcement) – ägarbeslut.

---

## Sammanfattning – spår B

| Etapp | Innehåll | Insats | Effekt |
|---|---|---|---|
| 32 | Tyst fel blir högljutt | M | ⭐⭐⭐ Nästa incident upptäcks av oss, inte av en patient |
| 33 | Rollmatris som testsvit | M | ⭐⭐⭐ Hittar buggarna som redan finns |
| 34 | WCAG AA utan förbehåll | M | ⭐⭐ Lagkrav + faktisk användbarhet |
| 35 | Akutläget på riktigt | S (kod) / M (organisation) | ⭐⭐ Stänger en punkt som stått öppen i 18 etapper |

**Om bara en etapp hinns med:** Etapp 33. Den hittar de fel som redan drabbar användare i dag –
Etapp 32 gör bara att vi upptäcker nästa fel snabbare.

---

## Sådant spår B medvetet INTE föreslår

| Idé | Varför inte |
|---|---|
| Full omskrivning till TypeScript | Skulle fånga en del av felklassen ovan, men Firestore-regelfel är ett runtime-/behörighetsproblem TypeScript inte ser. Enorm insats, fel verktyg för just det här problemet. |
| 100 % testtäckning som mål | Täckningssiffran hade varit hög även med den kritiska buggen på plats – ingen enhetstest hade fångat den. Täck rätt saker, inte alla saker. |
| Egen felrapporteringsinfrastruktur | Sentry finns och räcker. Problemet är inte var felen skickas, utan att de aldrig skickas. |
| Refaktorisera alla hooks till ett gemensamt datalager | Frestande under Etapp 32a, men `CLAUDE.md` avråder från abstraktioner för hypotetiska behov. Utöka signaturen; byt inte mönster. |

---

## Jämförelse: spår A eller spår B?

| | **Spår A – sälj det som byggts** | **Spår B – förtjäna förtroendet** |
|---|---|---|
| Grundtes | Produkten är klar, affären saknas | Produkten kan vara trasig utan att vi vet |
| Byggs för | Beslutsfattare, IT-avdelningar, upphandling | Personalen i vardagen |
| Syns i demo | Ja (SSO, veckomail) | Nästan inte alls |
| Startklar? | **Nej** – kräver 2–3 ägarbeslut först | **Ja** – kan påbörjas i dag |
| Största risken | Piloten tappar entusiasm medan vi bygger för säljaren | Vi blir bäst i klassen på att ingen köper |
| Bygger på | `produkt/MODULPLAN.md`: paketen är byggda, 13f/16 blockerar affärer | Etapp 31b: en kritisk bugg levde i månader oupptäckt |

**Min rekommendation:** en medveten kombination, i den här ordningen:

1. **Etapp 32 + 33 ur spår B först.** Skälet är inte försiktighet utan ordningsföljd: spår A
   handlar om att släppa in *fler* kunder i produkten. Att göra det medan vi vet att en hel
   roll kan se tomma listor, och att vi inte får veta när det händer, är att skala upp ett
   känt problem. De två etapperna är dessutom startklara utan ett enda ägarbeslut.
2. **Parallellt: fatta besluten i spår A.** SSO-valet (OIDC) och e-postleverantören blockerar
   ingenting tekniskt just nu – men de har redan legat stilla sedan 2026-07-28, och de kommer
   ligga stilla lika länge till om ingen aktivt tar dem.
3. **Sedan Etapp 32 (SSO) ur spår A**, som det enskilt mest affärskritiska bygget.

Det som talar för att i stället köra spår A rakt av: om det finns en konkret, namngiven
regionaffär inom räckhåll där SSO är villkoret. Då slår affärstajmingen kvalitetsargumentet –
men det är ett beslut om affärsläget, som ägaren har och jag inte har.
