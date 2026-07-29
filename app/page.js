'use client';
import Link from 'next/link';
import { useLanguage } from '../lib/i18n';

export default function Home() {
  const { t } = useLanguage();
  return (
    <div>
      <div className="eyebrow">{t('hero_eyebrow')}</div>
      <h1 style={{ fontSize: 36, marginBottom: 12 }}>
        {t('hero_title_1')} <span style={{ color: 'var(--accent)' }}>{t('hero_title_accent')}</span> {t('hero_title_2')}
      </h1>
      <p style={{ color: 'var(--muted)', maxWidth: 480, marginBottom: 24 }}>
        {t('hero_desc')}
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link href="/report-lost" className="btn btn-accent">{t('hero_btn_lost')}</Link>
        <Link href="/report-found" className="btn btn-primary">{t('hero_btn_found')}</Link>
      </div>

      <div style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>{t('how_it_works')}</h2>
        <div className="grid">
          <div style={{ background: 'var(--card)', padding: 20, borderRadius: 14, border: '1px solid var(--line)' }}>
            <h3 style={{ fontSize: 16 }}>{t('step1_title')}</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 6 }}>{t('step1_desc')}</p>
          </div>
          <div style={{ background: 'var(--card)', padding: 20, borderRadius: 14, border: '1px solid var(--line)' }}>
            <h3 style={{ fontSize: 16 }}>{t('step2_title')}</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 6 }}>{t('step2_desc')}</p>
          </div>
          <div style={{ background: 'var(--card)', padding: 20, borderRadius: 14, border: '1px solid var(--line)' }}>
            <h3 style={{ fontSize: 16 }}>{t('step3_title')}</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 6 }}>{t('step3_desc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
