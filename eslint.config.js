import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'release/', 'android/', 'node_modules/'] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 2023, sourceType: 'module' },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-implicit-coercion': ['error', { allow: ['!!'] }],
      'no-param-reassign': ['error', { props: false }],
      'no-shadow': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      curly: ['error', 'multi-line'],
    },
  },
  // Platform-independent core: runs in browsers, Node (Electron main) and the Android background runner.
  { files: ['src/core/**/*.js'], languageOptions: { globals: { fetch: 'readonly', AbortController: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', URL: 'readonly', URLSearchParams: 'readonly' } } },
  { files: ['src/ui/**/*.js', 'src/app.js', 'src/icons.js', 'src/platform.js'], languageOptions: { globals: globals.browser } },
  { files: ['src/runner.js'], languageOptions: { globals: { CapacitorKV: 'readonly', CapacitorNotifications: 'readonly', addEventListener: 'readonly' } } },
  { files: ['electron/**/*.js', 'scripts/**/*.mjs', 'test/**/*.mjs', 'eslint.config.js'], languageOptions: { globals: globals.node } },
  { files: ['electron/**/*.cjs'], languageOptions: { sourceType: 'commonjs', globals: globals.node } },
];
