# Etapp 1 – konkret arbetsnedbrytning: organisationsmodellen

*Detaljerad nedbrytning av ETAPPLAN.md:s Etapp 1 (delmål 1a–1e), mot faktisk kodstatus i
v5.10.0. Varje uppgift har filreferens, vad som konkret ändras, och ett verifierbart
klart-kriterium. Ordningen är bindande – varje block bygger på det föregående.*

**Nuvarande relevanta collections** (16 st, samtliga saknar `organisationId`):
`users`, `rutiner`, `forradsartiklar`, `anslag`, `kommentarer`, `feedback`,
`klinikfragefeedback`, `klinikfrageloggar`, `klinikfragecache`, `systemvarningar`, `sokloggar`,
`auditlogg`, `visningar`, `skiftrapporter`, `kontakter`, `lankbibliotek`, `anteckningar`,
`installningar`.

**Nuvarande Cloud Functions** (9 st): `tolkaForradsbild`, `tolkaDokument`, `fragaKlinisktStod`,
`tvingaUtloggning`, `skapaKommentar`, `skickaFeedback`, `testaBeroenden`, `verifieraKlinikstod`,
`verifieraKlinikstodSchemalagt`.

---

## Block 1a – Datamodell + första organisationen

**1a.1 – Skapa organisationsschemat**
- Nytt dokument `organisationer/{orgId}` enligt datamodellen i MODULPLAN.md.
- Nytt `organisationer/{orgId}/medlemmar/{uid}` – ersätter delar av dagens
  `users/{uid}.role`-modell (rollen flyttas konceptuellt hit; `users/{uid}` behåller
  profildata som namn/e-post/favoriter/snabblänkar som idag).
- Ny fil `src/firebase/organisationer.js` (eller `useOrganisation.js`-hook) som läser den
  inloggade användarens organisationstillhörighet.

**1a.2 – Bootstrap: skapa org nr 1 från befintlig data**
- Engångsskript (kör en gång, manuellt, inte i CI): skapa `organisationer/synappsen-original`
  och en `medlemmar`-post per befintlig `users`-dokument, med samma `roll` som idag.
- **Klart-kriterium:** org-dokumentet finns, alla nuvarande användare har en
  motsvarande `medlemmar`-post med korrekt roll, ingen befintlig funktionalitet är ännu
  ändrad (regler och functions rör inte vid org ännu i detta delmål).

---

## Block 1b – Backfill av befintlig data

**1b.1 – Migreringsskript (idempotent, med torrkörningsläge)**
- Ny fil `functions/scripts/migreraTillOrganisation.js` (körs lokalt/manuellt via Admin SDK,
  inte som en deployad Cloud Function – engångsjobb).
- Sätter `organisationId: "synappsen-original"` på **varje dokument** i de 16 collectionerna
  ovan. Kör i batchar (Firestore batch-gräns 500 skrivningar).
- `--dry-run`-läge som bara räknar/loggar antal dokument som SKULLE uppdateras, utan att
  skriva – kör alltid detta först och verifiera antalet mot en manuell `count()`-query.
- Idempotent: skriptet kollar `if (!doc.data().organisationId)` innan skrivning, så det kan
  köras om säkert utan att skada redan migrerad data.

**1b.2 – Uppdatera skapa-flöden att sätta `organisationId` framåt**
Varje ställe som skapar ett nytt dokument i de 16 collectionerna måste sätta
`organisationId` från och med denna punkt, annars läcker ny data ut ur migreringen direkt:
- `src/hooks/useRutiner.js` (`skapaRutin`)
- `src/hooks/useAnslag.js` (`skapaAnslag`)
- `src/hooks/useForradsartiklar.js`, `useKontakter.js`, `useLankbibliotek.js`,
  `useSkiftrapport.js`, `usePapperskorg.js`-relaterade create-anrop
- `functions/index.js`: `skapaKommentar`, `skickaFeedback`, samt `klinikfrageloggar`/
  `klinikfragefeedback`/`systemvarningar`-skrivningarna
- Registreringsflödet i `src/context/AuthContext.jsx` (`registrera`) – nya användare måste
  kopplas till rätt organisation vid skapande, inte bara få en roll.

**Klart-kriterium:** en `count()`-query mot varje collection visar 0 dokument utan
`organisationId`. Ett nytt testdokument skapat via UI:t har `organisationId` satt korrekt
utan manuellt ingrepp.

---

## Block 1c – Regelomskrivning (`firestore.rules` + `storage.rules`)

Detta är den enskilt känsligaste uppgiften i hela etappen – en bugg här läcker data mellan
kunder. Görs i en egen gren med extra granskning.

**1c.1 – Nya hjälpfunktioner i `firestore.rules`**
```
function minOrganisation() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organisationId;
}
function arMedlem(orgId) {
  return arInloggad() && exists(/databases/$(database)/documents/organisationer/$(orgId)/medlemmar/$(request.auth.uid));
}
function minRollIOrg(orgId) {
  return get(/databases/$(database)/documents/organisationer/$(orgId)/medlemmar/$(request.auth.uid)).data.roll;
}
```
(Namn/detaljer justeras vid implementation – poängen är mönstret: varje befintlig
rollkontroll får en `orgId`-parameter.)

**1c.2 – Omskrivning av varje befintlig hjälpfunktion**
`arSuperadmin()`, `arVol()`, `arSektionsledare()`, `arVec()`, `arForradsansvarig()`,
`farGodkannaKlinisktInnehall()`, `farRedigeraOmrade()`, `farHanteraAnslag()`, `arRedaktor()` –
samtliga nio behöver bli organisationsmedvetna (jämföra roll **inom rätt org**, inte globalt).

**1c.3 – Omskrivning av varje `match`-block**
Samtliga 16 collections ovan: varje `allow read/create/update/delete` måste lägga till en
kontroll att `request.resource.data.organisationId` (vid create) respektive
`resource.data.organisationId` (vid read/update/delete) matchar anroparens organisation –
utöver den befintliga roll-/ägarskapskontrollen, inte istället för den.

**1c.4 – `storage.rules`**
Samma mönster för `rutiner/{omrade}/{rutinId}/{filnamn}`, `forradsartiklar/{...}` och
`inkommande/{uid}/{filnamn}` – filsökvägar behöver antingen inkludera `orgId` i pathen
(kräver ändring av `src/firebase/storage.js`s path-konstruktion) eller kontrolleras via en
Firestore-uppslagning i regeln (som `minOrganisation()` ovan, dyrare men kräver ingen
path-ändring). **Rekommendation:** lägg `orgId` i storage-pathen direkt
(`rutiner/{orgId}/{omrade}/{rutinId}/{filnamn}`) – enklare regler, snabbare, och undviker
ett extra Firestore-uppslag per filåtkomst.

**1c.5 – Test: Firestore Rules-emulator**
Ny testsvit (`firebase emulators:exec` + `@firebase/rules-unit-testing`) som:
- Skapar två testorganisationer (A och B) med varsin testanvändare.
- Bevisar att användare i A **inte** kan läsa, skriva eller ta bort ett enda dokument som
  tillhör B, för **varje** collection i listan – inte bara ett urval.
- Bevisar att befintliga roll-/ägarskapskontroller (t.ex. att en "personal"-roll inte kan
  redigera rutiner) fortfarande gäller **inom** en organisation.

**Klart-kriterium:** hela testsviten från 1c.5 grön. Detta är den enda etappen i hela planen
där jag rekommenderar att INTE gå vidare förrän testtäckningen är komplett – manuell
granskning räcker inte för säkerhetsregler av den här sorten.

---

## Block 1d – AI-budget per organisation

**1d.1** – Flytta budgetdokumentet från `installningar/geminiBudget` (globalt, ett för hela
appen) till `organisationer/{orgId}.ai` (fälten `manadsbudgetSek`/`perAnvandareSek` från
MODULPLAN.md:s datamodell, eller ett underdokument `organisationer/{orgId}/installningar/
geminiBudget` om man vill behålla samma dokumentform).

**1d.2** – `functions/index.js`: `reserveraBudget(uid)` måste bli `reserveraBudget(orgId, uid)`
– transaktionen läser/skriver org-specifikt budgetdokument istället för det globala. Berör
`tolkaForradsbild`, `tolkaDokument`, `fragaKlinisktStod` (samtliga tre anropar
`reserveraBudget` idag).

**1d.3** – `src/hooks/useGeminiBudget.js` och `src/pages/Admin.jsx`s budgetvisning läser
org-specifikt dokument istället för det globala.

**Klart-kriterium:** två testorganisationer kan förbruka sina respektive AI-budgetar helt
oberoende av varandra – att org A når sitt tak blockerar inte org B:s anrop.

---

## Block 1e – Org-medvetna Cloud Functions

Samtliga nio functions behöver kunna härleda anroparens `organisationId` (via
`request.auth.uid` → uppslag mot `medlemmar`) och passera det vidare där det behövs:

| Funktion | Ändring |
|---|---|
| `tolkaForradsbild` / `tolkaDokument` | `reserveraBudget(orgId, uid)`; skrivningen till `forradsartiklar`/`rutiner` sätter `organisationId` |
| `fragaKlinisktStod` | `reserveraBudget(orgId, uid)`; cache-nyckeln (`klinikfragecache`) bör inkludera `orgId` – annars läcker org A:s cachade svar till org B |
| `tvingaUtloggning` | rollkontrollen (`superadmin`) måste vara **inom samma org** som målanvändaren – annars kan en superadmin i org A logga ut en användare i org B |
| `skapaKommentar` / `skickaFeedback` | sätter `organisationId`; @omnämnande-uppslaget (`db.collection("users").get()` i `skapaKommentar`) måste begränsas till org-medlemmar, annars kan man @nämna någon i en annan organisation |
| `testaBeroenden` / `verifieraKlinikstod` | superadmin-kontrollen blir org-scopad (annars kan en superadmin i org A trigga/se testresultat som egentligen är org-oberoende infrastruktur – mindre allvarligt men bör ändå gate:as konsekvent) |
| `verifieraKlinikstodSchemalagt` | om Intelligence/klinikstöd är per-org (Etapp 2), måste schemat loopa över organisationer som har modulen aktiverad, och skriva `systemvarningar` per org |

**Klart-kriterium:** en integrationstest per funktion (emulator + `firebase-functions-test`
eller motsvarande) som bevisar att ett anrop från org A:s kontext aldrig kan påverka eller läsa
org B:s data, budget eller resultat.

---

## Rekommenderad exekveringsordning (sammanfattning)

```
1a.1  Datamodell
1a.2  Bootstrap org nr 1 (ingen funktionsändring än)
1b.1  Migreringsskript, dry-run, verifiera antal
1b.2  Uppdatera alla create-flöden (framåt-säkring)
      ── verifiera: inga nya dokument utan organisationId ──
1c.1–1c.4  Regelomskrivning (egen gren)
1c.5  Rules-emulator-tester GRÖNA för samtliga 16 collections
      ── HÅRT STOPP: gå inte vidare förrän 1c.5 är grön ──
1d.1–1d.3  Per-org AI-budget
1e     Org-medvetna Cloud Functions, en i taget, med integrationstest per funktion
      ── slutverifiering: full regressionstest av befintlig ensam-org-funktionalitet ──
```

**Varför detta hårda stopp efter 1c:** allt efter regelomskrivningen (budget, functions)
bygger på att isoleringen redan är bevisad. Att bygga vidare på overifierade regler bara
flyttar risken längre in i projektet, där den blir dyrare att hitta.

## Vad som INTE ingår i Etapp 1 (medvetet avgränsat)

- Fakturering/betalning – kommer i Etapp 5, inte här.
- UI för att skapa/administrera nya organisationer (superadmin-verktyg) – kan göras manuellt
  via Admin SDK-skript för de första kunderna, byggs som riktig UI när volymen kräver det.
- Att flytta bort roll-fältet helt från `users/{uid}` – låt det ligga kvar orört där för
  bakåtkompatibilitet under övergången; `medlemmar`-posten blir den nya sanningen framåt.
