'use client';
import { useLayoutEffect, useSyncExternalStore } from 'react';
import { useLocalStorageValue, setLocalStorageValue } from '../lib/useLocalStorageState';

const THEME_KEY = 'mur-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Системийн dark mode идэвхтэй эсэх — useSyncExternalStore ашиглан hydration-аюулгүй */
function useSystemDark(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(DARK_QUERY);
      mql.addEventListener('change', cb);
      return () => mql.removeEventListener('change', cb);
    },
    () => window.matchMedia(DARK_QUERY).matches,
    () => false, // SSR: хоёр талд бүх юм ижил байх — 'light' рендерлэнэ
  );
}

export default function ThemeToggle() {
  // localStorage-тэй синхрончлогдсон theme — useSyncExternalStore (SSR-аюулгүй)
  const saved = useLocalStorageValue(THEME_KEY);
  const systemDark = useSystemDark();

  // saved байвал түүнийг, үгүй бол системийн сонголтоор тодорхойлно
  const theme = (saved === 'dark' || saved === 'light') ? saved
    : systemDark ? 'dark'
    : 'light';

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
      <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
      <style jsx>{`
        .theme-btn {
          background: none; border: none; cursor: pointer; font-size: 16px;
          padding: 4px 6px; border-radius: 6px; line-height: 1;
        }
        .theme-btn:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </button>
  );
}
