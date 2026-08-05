import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Бүх эх кодыг .ts/.tsx болгосон тул jsxInJs plugin шаардлагагүй болсон —
// Vite/React нь .tsx доторх JSX-г өөрөө боловсруулдаг.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/component/**/*.test.tsx'],
  },
});
