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
          background: none; border: 1px solid rgba(255,255,255,0.3); color: #DCE9EC;
          cursor: pointer; font-size: 11.5px; font-weight: 700; padding: 4px 8px;
          border-radius: 6px; line-height: 1;
        }
        .lang-btn:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </button>
  );
}
