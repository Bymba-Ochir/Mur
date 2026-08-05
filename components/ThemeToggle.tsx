'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const saved = localStorage.getItem('mur-theme');
    const initial = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('mur-theme', next);
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
