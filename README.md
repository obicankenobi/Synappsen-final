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

## Driftsättning till Firebase Hosting

```bash
npm run build
firebase deploy
```
