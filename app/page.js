'use client';
import Link from 'next/link';
import { useLanguage } from '../lib/i18n';
import PawTrail from '../components/PawTrail';

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="home">
      <section className="hero">
        <div className="eyebrow">{t('hero_eyebrow')}</div>
        <h1 className="hero-title">
          {t('hero_title_1')} <span className="accent-text">{t('hero_title_accent')}</span> {t('hero_title_2')}
        </h1>
        <p className="hero-desc">{t('hero_desc')}</p>
        <div className="hero-actions">
          <Link href="/report-lost" className="btn btn-accent">{t('hero_btn_lost')}</Link>
          <Link href="/report-found" className="btn btn-primary">{t('hero_btn_found')}</Link>
        </div>
      </section>

      <section className="how">
        <h2 className="how-title">{t('how_it_works')}</h2>

        <div className="trail-wrap">
          <PawTrail labels={[t('step1_title'), t('step2_title'), t('step3_title')]} current={2} />
        </div>

        <div className="grid steps-grid">
          <div className="step-card">
            <p className="step-desc">{t('step1_desc')}</p>
          </div>
          <div className="step-card">
            <p className="step-desc">{t('step2_desc')}</p>
          </div>
          <div className="step-card">
            <p className="step-desc">{t('step3_desc')}</p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .hero { padding: 8px 0 var(--sp-7); }
        .hero-title {
          font-size: clamp(30px, 5vw, 46px);
          margin-bottom: var(--sp-4);
          max-width: 640px;
        }
        .accent-text { color: var(--accent); }
        .hero-desc {
          color: var(--muted); max-width: 480px; margin-bottom: var(--sp-5);
          font-size: 16px; line-height: 1.6;
        }
        .hero-actions { display: flex; gap: var(--sp-3); flex-wrap: wrap; }

        .how { margin-top: var(--sp-2); }
        .how-title { font-size: 22px; margin-bottom: var(--sp-5); }
        .trail-wrap { max-width: 520px; margin-bottom: var(--sp-4); }
        .steps-grid { margin-top: 0; }
        .step-card {
          background: var(--card); padding: var(--sp-4) var(--sp-4) var(--sp-5);
          border-radius: var(--r-md); border: 1px solid var(--line);
        }
        .step-desc { color: var(--muted); font-size: 13.5px; line-height: 1.5; }
      `}</style>
    </div>
  );
}
