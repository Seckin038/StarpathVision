const globals = require('globals');
const tseslint = require('typescript-eslint');
const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        fetch: 'readonly',
        process: 'readonly',
      },
    },
  },
  {
    files: ['**/*.spec.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
];
