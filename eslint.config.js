import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  /* dist lo genera vite build; coverage lo genera npm run coverage.
     Ninguno es codigo nuestro, asi que no se revisa. */
  globalIgnores(['dist', 'coverage']),

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

  /* Las pruebas usan las palabras de Jasmine (describe, it,
     expect, beforeEach...). Sin esto, eslint las marcaria como
     "no esta definido". */
  {
    files: ['**/*.spec.js'],
    languageOptions: { globals: globals.jasmine },
  },

  /* Los archivos .cjs de Karma son CommonJS y corren en Node,
     no en el navegador: usan require, module y process. */
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: globals.node,
      sourceType: 'commonjs',
    },
  },
])
