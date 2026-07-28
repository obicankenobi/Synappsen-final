import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'functions']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // Etapp 24a: src/sw.js körs som en service worker, inte i webbläsarens dokumentkontext –
  // den har `self`/`clients`/`registration` men inte `window`/`document`.
  {
    files: ['src/sw.js'],
    languageOptions: {
      globals: globals.serviceworker,
    },
  },
])
