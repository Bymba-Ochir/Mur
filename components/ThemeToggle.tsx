'use client';
import { useLayoutEffect } from 'react';
import { useLocalStorageValue, setLocalStorageValue } from '../lib/useLocalStorageState';

const THEME_KEY = 'mur-theme';

export default function ThemeToggle() {
  // localStorage-тэй синхрончлогдсон theme — useSyncExternalStore (SSR-аюулгүй)
  const saved = useLocalStorageValue(THEME_KEY);

  // "Гэрлэн бүрх" — dark default
  const theme = (saved === 'dark' || saved === 'light') ? saved : 'light';

  // localStorage/системийн утга өөрчлөгдөхөд <html data-theme> DOM-д бичих
  // (setState биш тул effect дотор зөвшөөрөгдөнө; FOUC-аас layout.tsx-ийн
  // inline script сэргийлдэг)
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function toggle() {
    setLocalStorageValue(THEME_KEY, theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <button onClick={toggle} className="theme-btn" aria-label={theme === 'dark' ? 'Цайвар горим руу сэлгэх' : 'Бараан горим руу сэлгэх'}>
      {theme === 'dark' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      )}
      <style jsx>{`
        .theme-btn {
          display: inline-flex; align-items: center; justify-content: center;
          background: none; border: 1px solid var(--line); cursor: pointer;
          width: var(--touch-target-sm); height: var(--touch-target-sm);
          border-radius: var(--r-sm); color: var(--ink);
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .theme-btn:hover { background: var(--eyebrow-bg); border-color: var(--muted); }
      `}</style>
    </button>
  );
}
