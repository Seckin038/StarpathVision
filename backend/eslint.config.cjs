const globals = require('globals');
const tseslint = require('typescript-eslint');
const jest = require('jest');
const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
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
