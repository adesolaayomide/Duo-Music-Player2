import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'playwright-report/**']),
  {
    rules: {
      // No unused variables (use _ prefix to ignore intentionally)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // No explicit any
      '@typescript-eslint/no-explicit-any': 'error',
      // Consistent type imports
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      // No console.log in production (warn so CI doesn't block on it)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // React
      'react/no-unescaped-entities': 'off',
    },
  },
]);

export default eslintConfig;
