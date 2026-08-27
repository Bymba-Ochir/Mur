'use client';
import Link from 'next/link';
import { useLanguage } from '../lib/i18n';

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="nf">
      <p className="nf-code" aria-hidden="true">404</p>
      <h1 className="nf-title">{t('nf_title')}</h1>
      <p className="nf-desc">{t('nf_desc')}</p>
      <Link href="/" className="nf-home">{t('nf_home')}</Link>

      <style jsx>{`
        .nf {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 80px 20px; min-height: 55vh;
        }
        .nf-code {
          font-family: var(--font-mono); font-size: 64px; font-weight: 700;
          color: var(--accent); margin: 0 0 8px; letter-spacing: 0.05em;
        }
        .nf-title { font-family: var(--font-display); font-size: 22px; color: var(--primary); margin: 0 0 10px; }
        .nf-desc { color: var(--muted); font-size: 14.5px; margin: 0 0 24px; max-width: 420px; }
        .nf-home {
          display: inline-flex; align-items: center; padding: 11px 20px;
          background: var(--brand); color: #fff; border-radius: var(--r-pill);
          font-weight: 600; font-size: 14px; text-decoration: none;
        }
        .nf-home:hover { background: var(--primary-light); }
        .nf-home:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      `}</style>
    </div>
  );
}
