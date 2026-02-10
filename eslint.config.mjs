import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  // Ignorar o próprio arquivo de configuração
  {
    ignores: ['eslint.config.mjs', 'eslint.config.ts'],
  },

  // Regras recomendadas do ESLint
  eslint.configs.recommended,

  // Regras recomendadas do TypeScript com checagem de tipos
  ...tseslint.configs.recommendedTypeChecked,

  // Regras do Prettier
  prettierRecommended,

  // Opções de linguagem
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'module', // ou 'commonjs' se seu projeto for CJS
      parserOptions: {
        projectService: true,
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
      },
    },
  },

  // Regras pesadas que você queria
  {
    rules: {
      // Import type
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // Tipos explícitos
      '@typescript-eslint/explicit-function-return-type': ['error'],
      '@typescript-eslint/explicit-module-boundary-types': ['error'],

      // Evitar any e unsafe
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',

      // Variáveis e parâmetros
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/prefer-readonly': 'error',

      // Promises
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',

      // Não permitir non-null assertion
      '@typescript-eslint/no-non-null-assertion': 'error',

      // Prettier
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
];
