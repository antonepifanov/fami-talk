import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

const eslintConfig = defineConfig([
  // Next.js Core Web Vitals правила
  ...nextVitals,
  
  // TypeScript-specific правила
  ...nextTs,
  
  // Prettier (отключает конфликтующие правила форматирования)
  prettier,
  
  // Игнорируемые папки
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'node_modules/**',
    'next-env.d.ts',
  ]),
  
  // Твои кастомные правила (можно добавить)
  {
    rules: {
      // Пример: отключить правило, если мешает
      // 'react/no-unescaped-entities': 'off',
    },
  },
]);

export default eslintConfig;