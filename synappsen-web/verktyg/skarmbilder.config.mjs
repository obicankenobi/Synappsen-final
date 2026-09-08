// Egen Playwright-konfiguration för webbplatsens skärmbilder. MEDVETET skild från
// playwright.config.js: den konfigurationen är produktens e2e-svit och körs i CI vid varje
// push. Att fånga marknadsbilder är inte ett test och ska inte kunna göra CI rött, eller
// långsammare.
//
// Emulatorerna startas utanför Playwright (firebase emulators:exec), samma mönster som
// test:e2e. Kör hela bildtagningen med:
//
//   PLAYWRIGHT_CHROMIUM_PATH=/sokvag/till/chromium \
//   npx firebase emulators:exec --project demo-test --only auth,firestore,storage \
//     "npx playwright test -c synappsen-web/verktyg/skarmbilder.config.mjs"
//
// PLAYWRIGHT_CHROMIUM_PATH behövs bara i sandboxar där den förinstallerade Chromium-
// revisionen inte matchar den @playwright/test förväntar sig – samma villkor som i
// playwright.config.js.
import { defineConfig, devices } from "@playwright/test";

const PORT = 5184;

export default defineConfig({
  testDir: ".",
  testMatch: /skarmbilder\.spec\.mjs/,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  timeout: 120_000,
  globalSetup: "./skarmbilder-setup.mjs",
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    cwd: "../../",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
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
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
          : {},
      },
    },
  ],
});
