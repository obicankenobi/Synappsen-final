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
    // tests/rules/** och tests/functions/** körs separat mot Firestore-emulatorn
    // (npm run test:rules / npm run test:functions) – inte vitest-testsviter, kräver en
    // körande emulator och är inte skrivna med vitests API.
    exclude: ["**/node_modules/**", "**/dist/**", "tests/rules/**", "tests/functions/**"],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
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
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
