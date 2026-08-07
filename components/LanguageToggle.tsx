'use client';
import { useLanguage } from '../lib/i18n';

export default function LanguageToggle() {
  const { lang, toggle } = useLanguage();
  return (
    <button
      onClick={toggle}
      className="lang-btn"
      aria-label={lang === 'mn' ? 'Switch to English' : 'Монгол хэл рүү сэлгэх'}
    >
      {lang === 'mn' ? 'EN' : 'MN'}
      <style jsx>{`
        .lang-btn {
          background: none; border: 1px solid var(--line); color: var(--ink);
          cursor: pointer; font-size: 11.5px; font-weight: 700; padding: 6px 10px;
          min-height: var(--touch-target-sm); border-radius: var(--r-sm); line-height: 1;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .lang-btn:hover { background: var(--eyebrow-bg); border-color: var(--muted); }
      `}</style>
    </button>
  );
}
