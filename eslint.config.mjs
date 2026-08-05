// eslint.config.mjs — ESLint 9 flat config
// eslint-config-next@16 нь native flat config export хийдэг тул шууд ачаална
// (хуучин .eslintrc.json / FlatCompat хэрэггүй болсон).
import nextVitals from 'eslint-config-next/core-web-vitals';

export default [
  {
    ignores: ['.next/**', 'out/**', 'public/**', 'next-env.d.ts', 'coverage/**', 'playwright-report/**', 'test-results/**'],
  },
  ...nextVitals,
  {
    rules: {
      // localStorage/window-г useEffect-ээр унших (hydration-safe) загварыг апп даяар
      // хэрэглэдэг — React 19-ийн шинэ дүрэм үүнийг error болгож байгаа тул
      // одоохондоо унтраана. Follow-up: useSyncExternalStore руу шилжих (#13).
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];
