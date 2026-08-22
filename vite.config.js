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
        // Etapp 68e (2026-08-22): woff2 tillagt. Utan det precachas INTE de självhostade
        // fontfilerna, och ett förstabesök helt offline hade renderats i systemtypsnittet.
        // Det hade inte varit trasigt (font-display: swap gör att texten alltid ritas), men
        // inkonsekvent i en app vars poäng delvis är att fungera utan nät mitt i ett pass.
        // Mätt kostnad: precachen gick från 120 entries / 1782,14 KiB till 122 / 1827,10 KiB,
        // alltså +44,96 KiB (+2,5 %).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
      manifest: {
        name: 'Synappsen',
        short_name: 'Synappsen',
        description: 'Kunskapsbank för akutmottagningen',
        lang: 'sv',
        start_url: '/',
        display: 'standalone',
        // Etapp 68e (2026-08-22): båda värdena låg efter koden och rättas här.
        // theme_color var kvar på #1d4ed8 medan index.html bytte till #274eaf i 68b – de
        // styr samma sak (systemets färgsättning av appfönstret) från två filer, och bara
        // den ena uppdaterades. background_color var #ffffff medan appens --bg är #f5f9fa;
        // den målas under appen innan första renderingen, så fel värde ger en kort vit blink.
        background_color: '#f5f9fa',
        theme_color: '#274eaf',
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
