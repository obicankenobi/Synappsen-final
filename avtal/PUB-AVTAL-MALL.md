# Personuppgiftsbiträdesavtal (PUB) – mall

**Status:** Mall för ifyllnad per kund. Fält markerade `[FYLLS I: ...]` ska ersättas innan
avtalet undertecknas. Detta är inte juridisk rådgivning – låt kundens och/eller Synappsens
jurist läsa igenom innan första undertecknandet, texten kan sedan återanvändas oförändrad.

**Upprättat:** 2026-07-26, som en del av Etapp 13a (`ETAPPLAN3.md`).

---

## 1. Parter

**Personuppgiftsansvarig ("Kunden"):** [FYLLS I: kundorganisationens namn, org.nr, adress]

**Personuppgiftsbiträde ("Biträdet"):** [FYLLS I: leverantörens firmanamn, org.nr, adress]

Detta avtal reglerar Biträdets behandling av personuppgifter för Kundens räkning vid
leverans av tjänsten Synappsen (nedan "Tjänsten"), i enlighet med artikel 28 i EU:s allmänna
dataskyddsförordning (GDPR).

## 2. Behandlingens art och ändamål

Biträdet behandlar personuppgifter enbart för att tillhandahålla Tjänsten: en webbaserad
plattform (installerbar PWA) för kliniska rutiner, förrådshantering, driftinformation och
intern kommunikation inom Kundens verksamhet.

**Viktigt att notera för Kundens dataskyddsombud:** Tjänsten är **inte avsedd att innehålla
patientuppgifter**. Systemet har ett flerlagrat, tekniskt filter som är konstruerat för att
upptäcka och blockera personnummer i fritextfält (klientkontroll, servervalidering i vissa
flöden, samt en regelbaserad spärr i Firestore-reglerna). Se `avtal/DPIA-UNDERLAG.md` (Etapp
13c) för en fullständig beskrivning av filtrets funktion och kända begränsningar – filtret
tekniskt garanterar inte att ingen patientuppgift någonsin kan skrivas in av en användare som
aktivt kringgår varningarna, och Kunden ansvarar för att instruera sin personal i enlighet med
detta.

## 3. Kategorier av registrerade

- Kundens anställda och uppdragstagare som ges konto i Tjänsten (namn, e-postadress,
  yrkesroll/befattning).

**Inga patienter eller andra tredje parter är avsedda registrerade i Tjänsten.**

## 4. Kategorier av personuppgifter

- Kontouppgifter: namn, e-postadress, roll/behörighetsnivå.
- Användningsdata: inloggningstider, vilka rutiner/artiklar en användare skapat, redigerat
  eller kvitterat som lästa.
- Fritext som personal själva skriver in i rutiner, kommentarer, skiftrapporter, anslag och
  anteckningar – avsedd att uteslutande innehålla verksamhetsinformation, inte
  personuppgifter om tredje part, se punkt 2.
- Vid tvåfaktorsautentisering (frivilligt, per organisationspolicy): en TOTP-hemlighet kopplad
  till kontot.

Inga särskilda kategorier av personuppgifter (art. 9 GDPR) är avsedda att behandlas.

## 5. Underbiträden

Se `avtal/UNDERBITRADEN.md` (Etapp 13b) för den fullständiga, löpande uppdaterade listan över
samtliga underbiträden, vilken behandling respektive underbiträde utför, samt i vilken region
behandlingen sker.

Biträdet ska underrätta Kunden om avsedda ändringar avseende tillägg eller byte av
underbiträden, och ge Kunden möjlighet att invända, i enlighet med art. 28.2 GDPR.
[FYLLS I: avtalad underrättelsetid, t.ex. 30 dagar]

## 6. Lagringstid och radering

- Personuppgifter behandlas så länge avtalet om Tjänsten löper.
- **Vid uppsägning eller avetablering av Kundens organisation** genomförs idag följande,
  redan implementerade steg (se `functions/index.js`, funktionerna `pausaOrganisation` och
  `exporteraOrganisation`):
  1. Organisationen pausas – all läs- och skrivåtkomst till organisationens data stängs
     omedelbart för samtliga användare (enforcerat i `firestore.rules`).
  2. En fullständig exportfil av organisationens data kan tas ut på begäran, för Kundens egen
     arkivering eller vidare GDPR-hantering.
- **Känd begränsning, upprättad efter kontroll av faktisk kod (Etapp 13a, i enlighet med
  genomgående krav 8 i `ETAPPLAN3.md`):** i dagsläget finns **ingen automatiserad, permanent
  radering** av en avetablerad organisations data i produktionsdatabasen. Radering sker
  manuellt av Biträdet på skriftlig begäran från Kunden, inom [FYLLS I: avtalad tidsfrist,
  t.ex. 30 dagar].
- **Backupretention (ägarbeslut och genomfört 2026-08-01, se `ETAPPLAN5.md` Etapp 33c):**
  schemalagda veckobackuper (`backups/{orgId}/...` i Firebase Storage) raderas automatiskt
  efter **90 dagar** av en schemalagd funktion som körs varje vecka.

## 7. Säkerhetsåtgärder

Biträdet tillämpar bland annat:

- Rollbaserad behörighetsstyrning, kontrollerad både i gränssnitt och i Firestore-regler.
- Organisationsisolering: varje kunds data är logiskt avskild och otillgänglig för andra
  kunder, verifierat med automatiserade tester (`tests/rules/organisationsisolering.test.mjs`).
- Kryptering i vila och under överföring (Google Cloud/Firebase standardkryptering).
- Valfri tvåfaktorsautentisering (TOTP) per Kundens policy.
- Loggning och felrapportering (Sentry) utan lagring av personuppgifter i felloggar.
- Möjlighet för Kunden att omedelbart återkalla en enskild användares session
  (force-logout).

Se `SAKERHETSRAPPORT.md` och `avtal/DPIA-UNDERLAG.md` för en fullständig teknisk genomgång.

## 8. Personuppgiftsincident

Biträdet ska utan onödigt dröjsmål, och senast inom 72 timmar efter att ha fått kännedom om en
personuppgiftsincident som rör Kundens data, underrätta Kunden med den information som krävs
för att Kunden ska kunna fullgöra sin egen anmälningsskyldighet enligt art. 33–34 GDPR.

## 9. Kundens rätt till granskning

Kunden har rätt att, med rimligt varsel, granska att Biträdet efterlever detta avtal, eller
låta en oberoende revisor göra det. `avtal/IT-FAKTABLAD.md` (Etapp 13d) kan användas som
underlag inför en sådan granskning.

## 10. Giltighetstid och uppsägning

[FYLLS I: koppling till huvudavtalets löptid – detta PUB-avtal gäller normalt så länge
huvudavtalet om Tjänsten gäller, och upphör att gälla när all behandling enligt punkt 6 har
upphört.]

---

**Underskrift**

| | Kunden | Biträdet |
|---|---|---|
| Namn | [FYLLS I] | [FYLLS I] |
| Titel | [FYLLS I] | [FYLLS I] |
| Datum | [FYLLS I] | [FYLLS I] |
