import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Firebase-SDK:t (auth/firestore/storage/functions) står för en stor del av
        // huvudbundeln men ändras sällan mellan releaser – egen chunk gör att den
        // cachas separat från appens eget, betydligt oftare ändrade JS.
        manualChunks(id) {
          // Etapp 24a: firebase/messaging används ENDAST av Profil.jsx (redan en egen,
          // routelat-laddad chunk) – får INTE hamna i firebase-vendor, som laddas i förväg åt
          // alla (genomgående krav 9). Måste kollas FÖRE det generella firebase-mönstret
          // nedan, annars matchar det bredare villkoret först.
          if (id.includes("node_modules/firebase/messaging") || id.includes("node_modules/@firebase/messaging")) {
            return "firebase-messaging-vendor";
          }
          if (id.includes("node_modules/firebase") || id.includes("node_modules/@firebase")) {
            return "firebase-vendor";
          }
        },
      },
    },
  },
  test: {
    environment: "node",
    globals: false,
    // tests/rules/**, tests/functions/** och tests/e2e/** körs separat (npm run test:rules /
    // test:functions / test:e2e) – inte vitest-testsviter. tests/e2e/** är skrivna med
    // Playwright Test (@playwright/test), som har en egen "test"/"expect"-export vitest inte
    // känner till.
    exclude: ["**/node_modules/**", "**/dist/**", "tests/rules/**", "tests/functions/**", "tests/e2e/**"],
  },
  plugins: [
    react(),
    VitePWA({
      // Etapp 44c: 'autoUpdate' lät vite-plugin-pwas injicerade standardregistrering göra en
      // tyst window.location.reload() så fort en ny service worker aktiverats – utan varsel,
      // vilket kan slå till mitt i en pågående arbetssession (t.ex. ett halvifyllt formulär).
      // 'prompt' + en egen registrering via virtual:pwa-register (se App.jsx/useAppUppdatering)
      // ger istället kontroll: en ny version väntar tyst tills användaren själv klickar
      // "Uppdatera" i AppUppdateringBanner.jsx.
      registerType: 'prompt',
      // Etapp 24a: injectManifest (istället för generateSW) så att Vite/Rollup faktiskt
      // bearbetar src/sw.js – bara då kan import.meta.env.VITE_FIREBASE_* ersättas med
      // riktiga värden vid bygget. En statisk public/firebase-messaging-sw.js hade krävt att
      // Firebase-konfigurationen hårdkodades i klartext i en fil ingen bygglogik rör vid.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        // Samma mönster som tidigare globPatterns (workbox-block nedan), men injectManifest
        // läser det härifrån istället.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
      manifest: {
        name: 'Synappsen',
        short_name: 'Synappsen',
        description: 'Kunskapsbank för akutmottagningen',
        lang: 'sv',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1d4ed8',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
