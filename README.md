# Synappsen

Digital kunskapsbank och rutindatabas för en akutmottagning. PWA byggd med React, Firebase och Fuse.js.

## Komma igång

```bash
npm install
npm run dev
```

Skapa en `.env`-fil i projektroten med Firebase-konfigurationen:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Struktur

- `src/firebase/` – Firebase-initiering, rolldefinitioner och bilduppladdning (Storage)
- `src/context/` – AuthContext för inloggning/registrering/rollhämtning
- `src/hooks/` – `useAuth`, `useRutiner` (CRUD + godkännandeflöde) och `useAnvandare` (adminpanel)
- `src/pages/` – Sidor (Hem, Logga in, Registrera, de tre sektionerna, Admin)
- `src/components/` – Återanvändbara komponenter (sökfält, navigering, kort, rutinformulär, sektionssida)
- `firestore.rules` / `storage.rules` – Security Rules per användarroll och område

## Rutinhantering och roller

Innehåll i de tre sektionerna lagras i Firestore-collectionen `rutiner` med fältet `omrade`
(`kliniskt-stod`, `logistik` eller `administration`). Vem som får skapa/redigera/ta bort styrs
per område:

- **Kliniskt stöd**: VÖL och sektionsledare skapar utkast, VÖL/superadmin godkänner innan publicering.
- **Logistik**: Förrådsansvarig (publiceras direkt).
- **Administration**: VEC (publiceras direkt).

Superadmin har alltid full behörighet. Adminpanelen (`/admin`, endast superadmin) används för
att ändra användares roller.

## Bildtolkning med Gemini Vision

Alla inloggade användare kan ladda upp foton av dokument/whiteboards under "Ladda upp dokument"
(`/ladda-upp`). En Cloud Function (`functions/index.js`) skickar bilden till Gemini Vision,
extraherar titel/innehåll/nyckelord/kom-ihåg-flaggor och skapar ett utkast i `rutiner` med
`kalla: "gemini"`. Utkastet måste granskas och godkännas av den roll som äger området innan det
publiceras, precis som manuellt skapat innehåll.

### Kostnadsspärr

Ett Firestore-dokument (`installningar/geminiBudget`) håller koll på en uppskattad månadskostnad.
Cloud Function vägrar göra fler Gemini-anrop när taket (standard 200 kr) är nått, tills en
superadmin höjer taket i adminpanelen (`/admin`). Detta är en applikationsnivå-spärr – som
komplement bör du **även sätta ett budgetlarm i Google Cloud Console** (Billing → Budgets &
alerts) på samma belopp, eftersom appens spärr bara är en uppskattning och inte ett hårt tak hos
Google.

## Driftsättning

Kräver [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`.

```bash
firebase login
firebase use synappsen-final-build

# Sätt Gemini-nyckeln som en hemlighet (Secret Manager) – krävs av Cloud Function.
# Klistra in nyckeln när du blir tillfrågad, INTE i .env.
firebase functions:secrets:set GEMINI_API_KEY

# Installera funktionernas beroenden
cd functions && npm install && cd ..

# Bygg och deploya allt (hosting, Firestore/Storage-regler, Cloud Functions)
npm run build
firebase deploy
```

Efter deploy får du en delbar länk i stil med `https://synappsen-final-build.web.app`.

Cloud Functions kräver Firebase **Blaze**-planen (pay-as-you-go med gratiskvot).
