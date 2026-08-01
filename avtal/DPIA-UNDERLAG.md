# Underlag för konsekvensbedömning (DPIA/ROS)

**Status:** Färdigt underlag som Kunden kan lämna vidare till sitt eget dataskyddsombud eller
sin egen risk- och sårbarhetsanalys (ROS). Skriven för en icke-teknisk läsare – tekniska
detaljer finns i `SAKERHETSRAPPORT.md` för den som vill gå djupare. Detta underlag är inte i
sig en fullständig DPIA (som ska göras av Kunden som personuppgiftsansvarig), utan
faktaunderlaget en sådan bedömning behöver om Synappsen som behandling.

**Upprättat:** 2026-07-26, som en del av Etapp 13c (`ETAPPLAN3.md`).
**Senast uppdaterat:** 2026-07-31 – punkt 10 (Sammanfattande riskbedömning) omskriven mot
faktiskt kodläge efter Etapp 32/33 (se `ETAPPLAN5.md` Etapp 34d).

---

## 1. Vad är Synappsen och varför behövs en bedömning?

Synappsen är en installerbar webbapp (PWA) för en vårdverksamhet, som samlar kliniska
rutiner, förrådsinformation, driftinformation och intern kommunikation på ett ställe. En
konsekvensbedömning är relevant eftersom systemet används av vårdpersonal och behandlar
uppgifter om anställda – men se punkt 2, som är den viktigaste enskilda faktan i detta
underlag.

## 2. Behandlas patientuppgifter? Nej – och så är det konstruerat

Synappsen är **uttryckligen inte avsett att innehålla patientuppgifter**. Det här är inte
bara en policy utan ett tekniskt genomfört krav, i tre oberoende lager:

1. **Klientkontroll:** varje fritextfält (rutiner, kommentarer, skiftrapporter, anteckningar,
   anslag, feedback, förrådsartiklar) kontrolleras i webbläsaren innan sparning mot mönster
   som ser ut som personnummer, med varning till användaren.
2. **Servervalidering:** de flöden som går via en Cloud Function (AI-bildtolkning,
   kommentarer, feedback) kontrolleras även på servern med en fullständig kontroll
   (datumvalidering + Luhn-checksumma), oavsett vad klienten skickade.
3. **Regelnivåspärr i databasen:** som en sista bakre spärr nekar själva databasreglerna
   (Firestore Security Rules) att spara ett fält vars innehåll matchar ett sannolikt
   personnummer, oavsett vilken väg skrivningen kommer ifrån. Denna spärr byggdes ut och en
   verklig brist i den upptäcktes och åtgärdades under sommaren 2026 (se
   `UTVECKLINGSLOGG.md`, fas 39) – ett konkret exempel på att skyddet aktivt underhålls och
   testas, inte bara antas fungera.

**Ärlig begränsning att ta med i bedömningen:** inget textfilter kan med 100 % säkerhet
förhindra att en användare som aktivt vill kringgå varningarna ändå skriver in en
patientuppgift i fritext. Detta är samma begränsning som gäller allt textbaserat
PII-skydd, oavsett leverantör. Kundens egen personal måste instrueras att aldrig skriva
patientuppgifter i systemet – de tekniska spärrarna är ett skyddsnät, inte en garanti mot en
avsiktlig eller ovetande felaktig inmatning. Se `SAKERHETSRAPPORT.md` för den fullständiga,
tekniska genomgången av detta filter och dess kända gränser.

## 3. Vilka personuppgifter behandlas, och om vem?

Endast **Kundens egen personal** (de som får ett användarkonto), inte patienter eller andra
tredje parter:

- Namn, e-postadress, yrkesroll/befattning.
- Inloggningshistorik och vilken aktivitet kontot utfört i systemet (t.ex. vilka rutiner
  personen skapat, redigerat eller kvitterat som lästa) – detta är en avsedd
  spårbarhetsfunktion (se punkt 6), inte en biprodukt.
- Fritext som personalen själva skriver (rutiner, kommentarer, anteckningar m.m.), avsedd
  att uteslutande handla om verksamheten, se punkt 2.
- Vid frivillig tvåfaktorsautentisering: en TOTP-hemlighet kopplad till kontot.

Ingen behandling av särskilda kategorier av personuppgifter (hälsouppgifter, etnicitet,
fackligt medlemskap etc.) om Kundens personal är avsedd eller känd att förekomma.

## 4. Nödvändighet och proportionalitet

Behandlingen är begränsad till vad som krävs för att driva ett internt
kunskaps-/kommunikationsverktyg för en vårdenhet:

- Kontouppgifter krävs för inloggning och rollstyrd behörighet – utan dem kan systemet inte
  skilja på vem som får redigera kliniska rutiner respektive bara läsa dem.
- Aktivitetsspårning (vem har läst/godkänt vad) är en uttrycklig, efterfrågad
  kärnfunktion inom vårdverksamheter (att kunna visa att personalen tagit del av en
  uppdaterad rutin), inte en övervakningsfunktion i sig – informationen används av
  chefer för uppföljning, inte av leverantören.
- Ingen data samlas "för säkerhets skull" utöver detta: inga platsdata, ingen
  enhetsfingeravtryck utöver det som App Check (se punkt 7) kräver tekniskt för att
  skilja äkta klientanrop från missbruk.

## 5. Roll- och behörighetsmodell

Systemet har sex roller (superadmin, vol/verksamhetsutvecklingsledare, sektionsledare, VEC,
förrådsansvarig, personal), var och en med ett tydligt avgränsat redigeringsområde. Detta är
enforcerat på två nivåer:

- I användargränssnittet (döljer funktioner en roll inte ska använda).
- **Avgörande, i databasreglerna** (`firestore.rules`): varje läs- och skrivoperation
  kontrolleras av databasen själv utifrån den inloggade användarens roll och
  organisationstillhörighet – gränssnittets kontroll är bara en genväg, inte den faktiska
  spärren. En användare kan alltså inte komma åt mer genom att manipulera appen i
  webbläsaren.
- **Organisationsisolering:** varje kunds data är logiskt helt avskild från andra kunders,
  verifierat med en egen automatiserad testsvit
  (`tests/rules/organisationsisolering.test.mjs`) som körs i varje release.

## 6. Loggning och spårbarhet

- En sökbar/filtrerbar ändringslogg finns redan i adminpanelen.
- En mer robust, exporterbar revisionslogg med begränsad manipuleringsdetektion är planerad
  (`ETAPPLAN3.md`, Etapp 14) men **inte byggd ännu** vid tidpunkten för detta underlag – ange
  det tydligt om Kunden efterfrågar detta specifikt idag.
- Force-logout: en superadmin kan omedelbart återkalla en enskild användares aktiva session,
  t.ex. vid en misstänkt komprometterad inloggning eller när någon slutar.

## 7. Tekniska säkerhetsåtgärder i korthet

- Kryptering i vila och under överföring (Google Cloud/Firebase standard).
- Valfri tvåfaktorsautentisering (TOTP), som kan göras obligatorisk per organisation.
- Automatisk utloggning vid inaktivitet.
- App Check (Google reCAPTCHA): tekniskt skydd mot att andra klienter än den riktiga,
  installerade appen kan anropa serverfunktionerna. Aktiverat sedan sommaren 2026, för
  närvarande i en mätfas innan det görs obligatoriskt (se `ETAPPLAN2.md`, Etapp 12c).
- Beroendesårbarheter i systemets tredjepartsbibliotek övervakas och åtgärdas löpande
  (senast genomgång: `UTVECKLINGSLOGG.md`, fas 36).

## 8. Underbiträden och tredjelandsöverföring

Se `avtal/UNDERBITRADEN.md` (Etapp 13b) för den fullständiga, löpande uppdaterade listan.
Sammanfattningsvis: Google (Firebase-tjänsterna, Gemini, Google Custom Search, reCAPTCHA)
och Sentry (felrapportering, EU-region). En öppen punkt är noterad där: AI-bildtolkningen
använder för närvarande det publika Gemini API:et, vars regionsgaranti bör kontrolleras
separat om Kunden har strikta krav på var AI-behandlingen sker (en migrering till Vertex AI
är den tekniska lösningen om så krävs).

## 9. Incidentrutin

Vid en misstänkt personuppgiftsincident underrättas Kunden av leverantören utan onödigt
dröjsmål och senast inom 72 timmar, i enlighet med `avtal/PUB-AVTAL-MALL.md` punkt 8, med
den information Kunden behöver för sin egen anmälan till Integritetsskyddsmyndigheten.

## 10. Sammanfattande riskbedömning

| Risk | Bedömning | Motivering |
|---|---|---|
| Patientuppgifter hamnar av misstag i systemet | Låg–medel, aktivt begränsad | Tre oberoende tekniska lager (punkt 2), men inte en absolut garanti – personalutbildning krävs som komplement. |
| Obehörig åtkomst till en annan organisations data | Låg | Databasnivåspärr, inte bara gränssnitt; verifierat med automatiserade tester varje release. |
| Obehörig åtkomst inom den egna organisationen (fel roll) | Låg | Rollmodell enforcerad i databasreglerna, inte bara gränssnittet. |
| Manipulerad/raderad logg utan att upptäckas | Låg | Revisionsloggen är hashkedjad (Etapp 14) och kedjan kontrolleras automatiskt varje natt för samtliga organisationer, med larm vid ett faktiskt brott (Etapp 32d, 2026-07-31). Skyddar mot en icke-privilegierad klient – inte mot någon med Admin SDK-/konsolåtkomst, som i princip kan skriva om hela kedjan. |
| Personuppgiftsincident upptäcks sent | Låg–medel, delvis åtgärdad | Nekade dataanrop (`permission-denied`) rapporteras till Sentry (Etapp 32a), rollbyten och plattformsadmins tvärorganisatoriska åtkomst loggas (Etapp 32c), och en plötslig AI-kostnadsspik larmar (Etapp 32b, delvis). **Känd kvarstående lucka, bekräftad genom en skrivbordsövning (Etapp 34c):** ett konto som missbrukar behörighet det REDAN legitimt har (t.ex. läser ovanligt mycket inom sin egen organisation) lämnar inget spår i något av ovanstående – upptäckt förutsätter i dag att kunden själv märker det eller en extern anmälan. Att stänga den luckan helt kräver en extern tjänst (GCP-faktureringsexport eller ett Sentry API-token) och väntar på ett ägarbeslut. |

**Slutsats för Kundens egen bedömning:** behandlingen är begränsad till personaldata för ett
internt arbetsverktyg, med flera tekniska lager som aktivt förhindrar att den känsligaste
kategorin av uppgifter (patientdata) hamnar i systemet. De kvarstående riskerna ovan är kända
och dokumenterade snarare än dolda, vilket bör vägas in positivt i Kundens egen bedömning av
om ytterligare åtgärder krävs innan systemet tas i drift.
