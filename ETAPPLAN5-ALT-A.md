# ETAPPLAN 5 – UTKAST A: "Från byggd produkt till såld produkt"

> **Detta är ett UTKAST, inte en antagen plan.** Det finns två alternativa utkast till
> Etapplan 5 – detta (spår A) och `ETAPPLAN5-ALT-B.md` (spår B). Meningen är att ETT av dem
> (eller en medveten kombination) väljs och skrivs om till `ETAPPLAN5.md`; det andra arkiveras
> eller stryks. Se jämförelsen längst ned i båda filerna.
>
> *Skrivet 2026-07-31, utgångsläge v5.50.0, efter att Etapp 22–31 är avklarade.*

---

## Utkastets grundtes

**Produkten är byggd. Affären är det som saknas.**

Premisskontroll mot faktisk kod och `MODULPLAN.md` (krav 8) ger ett entydigt läge:

- Core, Operations och Intelligence är i praktiken **helt byggda** – `MODULPLAN.md` listar
  exakt EN obyggd rad i hela paketstrukturen (kioskläge), och den är markerad "lågt
  prioriterad tills en pilotkund efterfrågar delade surfplattor specifikt".
- Multi-tenant-lagret, som en gång var "störst, gör först", är avklarat sedan länge.
  **Andra kunden kan onboardas idag** utan risk för dataläckage.
- De två saker som faktiskt *blockerar affärer* är båda pausade i väntan på ägarbeslut:
  **13f (SSO/Entra ID)** och **Etapp 16 (veckopuls)**. Ingen av dem väntar på teknik – båda
  väntar på ett beslut som aldrig fattats.

Slutsatsen: att bygga en åttonde generation medarbetarfunktioner ger allt mindre marginalnytta
när ingen tredje kund finns. Det som ger mest per timme nu är att ta bort de sista hindren
mellan en intresserad verksamhetschef och ett påskrivet avtal.

**Risken med det här spåret:** det bygger nästan ingenting som syns för medarbetaren i
vardagen. Om piloten tappar entusiasm under tiden får man en upphandlingsbar produkt som ingen
längre älskar. Se spår B för motsatsen.

---

## Genomgående krav

De tio kraven i `ETAPPLAN3.md`/`ETAPPLAN4.md` gäller oförändrat. Ett tillkommer i det här
spåret:

11. **Varje etapp ska kunna beskrivas i en mening för en icke-teknisk beslutsfattare.** Om ett
    delmål bara går att motivera internt ("det är snyggare så") hör det inte hemma i den här
    planen – det hör hemma i spår B eller i löpande underhåll.

---

# Etapp 32 – SSO / Microsoft Entra ID (avsluta 13f)

**Varför:** Det enskilt vanligaste stoppet i en större vårdorganisations införandebeslut. En
region som redan kör Microsoft 365 accepterar sällan ett verktyg med separata lösenord – det
blir en IT-säkerhetsinvändning innan verksamhetsnyttan ens diskuteras. `ETAPPLAN3.md` pekar ut
13f som "störst enskilt delmål i Etapp 13 – kod, inte bara dokument".

**Modul:** ingen (Core – autentisering är aldrig ett tillval).

**Blockerande beslutspunkt (måste avgöras FÖRE byggstart):** SAML eller OIDC som
förstahandsprioritet. Rekommendation: **OIDC**, eftersom Firebase Auth har förstklassigt
OIDC-stöd och Entra ID exponerar OIDC som standard – SAML är mest relevant om en specifik
kunds IT-avdelning uttryckligen kräver det.

### 32a – Firebase Auth-koppling mot Entra ID

- Konfigurera en OIDC-provider i Firebase Auth, med tenant-ID från kundens Entra.
- **Premisskontroll som MÅSTE göras först:** `AuthContext.jsx` slår i dag upp
  `users/{uid}.organisationId` efter inloggning. En SSO-användare har inget
  `users/{uid}`-dokument första gången – hela inbjudningsflödet (Etapp 6c) bygger på att en
  superadmin skapar posten i förväg. Avgör innan bygget: ska första SSO-inloggningen skapa
  användaren automatiskt (kräver en Cloud Function och en domänallowlist per organisation),
  eller ska den nekas om ingen inbjudan finns? **Min rekommendation: neka.** Automatisk
  etablering öppnar en väg där vem som helst i en stor tenant får åtkomst.

### 32b – Domän → organisation-mappning

- Nytt fält på `organisationer/{orgId}`: godkända e-postdomäner för SSO.
- Serverkontroll: en SSO-inloggning knyts till rätt organisation via domänen, aldrig via
  något klienten skickar med.

### 32c – Samexistens med lösenord och 2FA

- En organisation ska kunna köra SSO och lösenord parallellt under en övergångsperiod.
- **Gränsdragning mot 2FA-policyn (Etapp 3d):** när SSO används ägs andrafaktorn av Entra,
  inte av Synappsen. `mfaKravUppfyllt()` i `firestore.rules` måste hantera det – annars
  låser policyn ute exakt de kunder SSO var till för.

### 32d – Dokumentation för kundens IT

- Uppdatera `avtal/IT-FAKTABLAD.md` med vad kundens IT faktiskt behöver göra.
- Detta är ofta det som avgör om IT säger ja i tid eller inte.

**Klart när:** en testtenant i Entra ID kan logga in, hamnar i rätt organisation, och kundens
IT har ett papper som beskriver exakt vad de ska konfigurera.

---

# Etapp 33 – Ledningens veckopuls (avsluta Etapp 16)

**Varför:** Chefer loggar inte in av sig själva. `ETAPPLAN3.md` formulerar det bäst: veckomailet
är "det som håller förnyelsesamtalet vid liv". Utan det syns produktens nytta bara för den som
redan använder den – aldrig för den som betalar för den.

**Modul:** `veckopuls`.

**Blockerande beslutspunkt:** e-postleverantör med EU-drift och tecknat PUB-avtal (måste in i
`avtal/UNDERBITRADEN.md`).

### 33a – Leverantör och utskicksinfrastruktur

- Enligt beslutspunkten ovan. Schemalagt jobb, samma mönster som befintliga cron-funktioner.
- **Ingen patient- eller personuppgift utöver mottagarens namn och e-post får gå i mailet.**

### 33b – Innehåll som återanvänder befintligt dataunderlag

- Fem rader (per `ETAPPLAN3.md` 16b): nya/ändrade rutiner, kvitteringsgrad, ej kvitterade med
  deadline inom 7 dagar, mest sökta uttryck utan träff, öppna bristanmälningar.
- **Bygg INTE en parallell beräkning** – ledningsrapporten (Etapp 10c) har redan underlaget.

### 33c – Prenumeration, avregistrering och krav 10

- Per användare: på/av, veckodag. Endast roller med ledningsansvar erbjuds.
- Krav 10 gäller: förvalt läge ska vara återhållsamt. Ett veckomail som inte går att stänga av
  är en klagomålsgenerator.

**Klart när:** en verksamhetschef som aldrig loggar in ändå vet vad som hänt den här veckan.

---

# Etapp 34 – Kioskläge (sista raden i Operations)

**Varför:** Den enda obyggda punkten i hela paketstrukturen (`MODULPLAN.md`). Flaggan
`FEATURE.KIOSK_MODE` finns reserverad i `src/config/features.js` men **inget gränssnitt
konsumerar den** – verifierat med grep. Så länge den raden står obyggd i säljmaterialet är den
en fordran som inte går att infria om en kund frågar.

**Modul:** operations.

### 34a – Delad enhet utan personlig inloggning

- Ett läge där en surfplatta i korridoren visar godkänt innehåll utan att någon är inloggad
  som person.
- **Hård gränsdragning:** kioskläget får ALDRIG kunna kvittera, kommentera, föreslå ändringar
  eller se personuppgifter. Det är en läsvy, inget annat. Allt som skapar spårbarhet kräver en
  identifierad människa.

### 34b – Automatisk återgång

- Efter inaktivitet återgår enheten till startvyn, så nästa person inte ser föregående
  persons navigering.

**Klart när:** en surfplatta kan sitta uppsatt på väggen utan att någon behöver logga in, och
utan att den kan användas för att göra något som kräver ansvar.

---

# Etapp 35 – Onboarding utan konsult

**Varför:** `MODULPLAN.md` prissätter en "engångsavgift för konfiguration, migration/import,
redaktörsutbildning". Varje timme det tar att starta en ny kund är en timme som antingen kostar
marginal eller skjuts på kunden. Om kund nummer tre ska gå att ta emot utan att någon sitter
med dem en vecka måste starten vara självgående.

**Modul:** ingen (Core).

### 35a – Mät den faktiska starttiden

- Innan något byggs: dokumentera vad som faktiskt krävs för att gå från "ny organisation" till
  "personalen använder appen". Krav 8 – gissa inte.

### 35b – Innehållsstart

- Rutinmallar per verksamhetstyp (Etapp 10d) och bulkimport (10b) finns redan. Bind ihop dem
  till ETT flöde en ny superadmin kan följa utan support.

### 35c – Färdig-att-lansera-kontroll

- En checklista i admin som säger "ni är redo att släppa in personalen" när minimikraven är
  uppfyllda (X godkända rutiner, kontakter ifyllda, minst två redaktörer, 2FA-policy vald).
- Bygg vidare på `KomIgangChecklista.jsx` – bygg inte något nytt.

**Klart när:** en ny kund kan gå från avtal till skarp drift utan att vi behöver vara med.

---

## Beslutspunkter som blockerar det här spåret

Spår A är ovanligt beroende av ägarbeslut – det är själva poängen (de besluten är det som
faktiskt står i vägen), men det betyder också att **planen inte kan startas utan dem**:

1. **Etapp 32:** SAML eller OIDC? (Rekommendation: OIDC.) Och: ska första SSO-inloggningen
   auto-etablera en användare? (Rekommendation: nej.)
2. **Etapp 33:** vilken e-postleverantör med EU-drift och PUB-avtal?
3. **Etapp 34:** finns det överhuvudtaget en kund som vill ha delade surfplattor? Om nej – hoppa
   över etappen hellre än att bygga den på spekulation.
4. **Kvarstående sedan tidigare:** Etapp 30b (fysiskt akutlägestest) och 31c/12c-ii
   (App Check-enforcement).

---

## Sammanfattning – spår A

| Etapp | Innehåll | Insats | Affärseffekt |
|---|---|---|---|
| 32 | SSO / Entra ID | L | ⭐⭐⭐ Tar bort det vanligaste IT-nejet |
| 33 | Veckopuls till ledningen | M | ⭐⭐⭐ Håller förnyelsesamtalet vid liv |
| 34 | Kioskläge | S–M | ⭐ Stänger sista luckan i paketet |
| 35 | Onboarding utan konsult | M | ⭐⭐ Marginal per ny kund |

**Om bara en etapp hinns med:** Etapp 32. SSO är det enda i hela planen som kan vara
skillnaden mellan att få och inte få en regionaffär.

---

## Sådant spår A medvetet INTE föreslår

| Idé | Varför inte |
|---|---|
| Intelligence 2.0 (`ETAPPLAN2.md` Etapp 11) | Uttryckligen villkorad: vänta tills minst en kund faktiskt BETALAR för dagens Intelligence-modul. Att bygga vidare på AI innan dess är att investera i en hypotes. |
| Fler medarbetarfunktioner i Etapp 22–29:s anda | De har gett mycket, men marginalnyttan avtar. Nästa flaskhals är kommersiell, inte funktionell. |
| Mobilapp i app-butikerna | PWA:n täcker behovet. Butikslansering tillför distributionskrav och granskningscykler utan motsvarande nytta för en intern verksamhetsapp. |
