import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import esbuild from 'esbuild';

// Next.js .js файл дотор JSX бичихийг зөвшөөрдөг ч Vite/Vitest үүнийг
// анхдагчаар танихгүй тул components/, app/ доtorх .js файлуудыг
// import-analysis-аас өмнө jsx болгож хөрвүүлэх жижиг plugin.
function jsxInJs() {
  return {
    name: 'jsx-in-js',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.endsWith('.js')) return null;
      if (!(id.includes('/components/') || id.includes('/app/') || id.includes('/lib/'))) return null;
      if (id.includes('node_modules')) return null;
      const result = await esbuild.transform(code, {
        loader: 'jsx',
        jsx: 'automatic',
        sourcefile: id,
      });
      return { code: result.code, map: result.map };
    },
  };
}

export default defineConfig({
  plugins: [jsxInJs(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/unit/**/*.test.js', 'tests/component/**/*.test.jsx'],
  },
});
