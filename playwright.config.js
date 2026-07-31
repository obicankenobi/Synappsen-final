// Etapp 31b: en liten, committad e2e-svit för de två flödesklasser en enhets-/regelsvit inte
// fångar – organisationsisolering i det RIKTIGA UI:t (inte bara i regel-lagret) och
// "list-provability"-buggklassen (Etapp 26/29: en collection vars regel refererar
// resource.data.<fält> nekar HELA listningen om frågan inte har ett matchande where(), något
// bara en riktig onSnapshot-lyssnare i en riktig klient avslöjar). Körs mot Firestore-
// emulatorn, startad separat via `firebase emulators:exec` (samma mönster som
// test:rules/test:functions/test:storage) – se package.json:s "test:e2e"-skript.
import { defineConfig, devices } from "@playwright/test";

const PORT = 5183;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: "list",
  globalSetup: "./tests/e2e/global-setup.mjs",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      VITE_USE_EMULATOR: "true",
      VITE_FIREBASE_API_KEY: "demo-key",
      VITE_FIREBASE_AUTH_DOMAIN: "demo-test.firebaseapp.com",
      VITE_FIREBASE_PROJECT_ID: "demo-test",
      VITE_FIREBASE_STORAGE_BUCKET: "demo-test.appspot.com",
      VITE_FIREBASE_MESSAGING_SENDER_ID: "123456789",
      VITE_FIREBASE_APP_ID: "1:123456789:web:abcdef",
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Sandboxens förinstallerade Chromium-revision (1194) matchar inte alltid den
        // headless_shell-revision @playwright/test förväntar sig som standard – peka
        // uttryckligen på den riktiga chromium-binären istället för att ladda ner en ny.
        // Utanför den här sandboxen (t.ex. CI, se ci.yml) sätts PLAYWRIGHT_CHROMIUM_PATH
        // inte, och Playwright använder sin egen nedladdade/installerade webbläsare.
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
          : {},
      },
    },
  ],
});
