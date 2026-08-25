'use client';
import { useLayoutEffect } from 'react';
import { useLocalStorageValue, setLocalStorageValue } from '../lib/useLocalStorageState';

const THEME_KEY = 'mur-theme';

export default function ThemeToggle() {
  const saved = useLocalStorageValue(THEME_KEY);
  const theme = saved === 'dark' || saved === 'light' ? saved : 'light';
  useLayoutEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  function toggle() { setLocalStorageValue(THEME_KEY, theme === 'dark' ? 'light' : 'dark'); }

  return (
    <button onClick={toggle} className="inline-flex size-[var(--touch-target-sm)] cursor-pointer items-center justify-center rounded-[var(--r-sm)] border border-[var(--line)] bg-transparent text-[var(--ink)] transition-[border-color,background] duration-150 ease-in-out hover:border-[var(--muted)] hover:bg-[var(--eyebrow-bg)]" aria-label={theme === 'dark' ? 'Цайвар горим руу сэлгэх' : 'Бараан горим руу сэлгэх'}>
      {theme === 'dark' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" /></svg>
      )}
    </button>
  );
}
