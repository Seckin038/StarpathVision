const globals = require('globals');
const tseslint = require('typescript-eslint');

module.exports = [
  {
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['**/*.spec.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
  },
  ...tseslint.configs.recommended,
];
