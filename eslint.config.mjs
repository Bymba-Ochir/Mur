// eslint.config.mjs — ESLint 9 flat config
// eslint-config-next@16 нь native flat config export хийдэг тул шууд ачаална
// (хуучин .eslintrc.json / FlatCompat хэрэггүй болсон).
import nextVitals from 'eslint-config-next/core-web-vitals';

const config = [
  {
    ignores: ['.next/**', 'out/**', 'public/**', 'next-env.d.ts', 'coverage/**', 'playwright-report/**', 'test-results/**'],
  },
  ...nextVitals,
];

export default config;
