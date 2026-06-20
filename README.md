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

- `src/firebase/` – Firebase-initiering och rolldefinitioner
- `src/context/` – AuthContext för inloggning/registrering/rollhämtning
- `src/hooks/` – `useAuth`-hook
- `src/pages/` – Sidor (Hem, Logga in, Registrera, de tre sektionerna)
- `src/components/` – Återanvändbara komponenter (sökfält, navigering, kort)
- `firestore.rules` – Security Rules per användarroll

## Driftsättning till Firebase Hosting

```bash
npm run build
firebase deploy
```
