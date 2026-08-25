'use client';
import { useLanguage } from '../lib/i18n';

export default function LanguageToggle() {
  const { lang, toggle } = useLanguage();
  return <button onClick={toggle} className="min-h-[var(--touch-target-sm)] cursor-pointer rounded-[var(--r-sm)] border border-[var(--line)] bg-transparent px-2.5 py-1.5 text-[11.5px] font-bold leading-none text-[var(--ink)] transition-[border-color,background] duration-150 ease-in-out hover:border-[var(--muted)] hover:bg-[var(--eyebrow-bg)]" aria-label={lang === 'mn' ? 'Switch to English' : 'Монгол хэл рүү сэлгэх'}>{lang === 'mn' ? 'EN' : 'MN'}</button>;
}
