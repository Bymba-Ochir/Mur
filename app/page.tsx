'use client';
import Link from 'next/link';
import { useLanguage } from '../lib/i18n';
import PawTrail from '../components/PawTrail';

// Hero-ийн зөөлөн paw-print хээ (data-URI SVG) — зөвхөн гоёл чимэглэл
const PAW_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cg fill='%2317414D'%3E%3Cellipse cx='24' cy='30' rx='11' ry='9'/%3E%3Ccircle cx='10' cy='18' r='5.5'/%3E%3Ccircle cx='38' cy='18' r='5.5'/%3E%3Ccircle cx='17' cy='8' r='5'/%3E%3Ccircle cx='31' cy='8' r='5'/%3E%3C/g%3E%3C/svg%3E\")";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="home">
      <section className="hero">
        {/* Гоёл чимэглэл — ember sparkles + floating paw (зөвхөн desktop) */}
        <div className="hero-decor" aria-hidden="true">
          <span className="ember e1" />
          <span className="ember e2" />
          <span className="ember e3" />
          <span className="float-paw">
            <svg width="30" height="30" viewBox="0 0 48 48" fill="currentColor" focusable="false">
              <ellipse cx="24" cy="30" rx="11" ry="9" />
              <circle cx="10" cy="18" r="5.5" />
              <circle cx="38" cy="18" r="5.5" />
              <circle cx="17" cy="8" r="5" />
              <circle cx="31" cy="8" r="5" />
            </svg>
          </span>
        </div>

        <div className="hero-content">
          <div className="eyebrow">{t('hero_eyebrow')}</div>
          <h1 className="hero-title">
            {t('hero_title_1')} <span className="gradient-text">{t('hero_title_accent')}</span> {t('hero_title_2')}
          </h1>
          <p className="hero-desc">{t('hero_desc')}</p>
          <div className="hero-actions">
            <Link href="/report-lost" className="btn btn-accent">
              {t('hero_btn_lost')}
              <svg className="arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
            <Link href="/report-found" className="btn btn-ghost">{t('hero_btn_found')}</Link>
          </div>
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
        .hero { position: relative; overflow: hidden; padding: var(--sp-6) 0 var(--sp-7); }
        @media (max-width: 640px) {
          .hero { padding: var(--sp-5) 0 var(--sp-6); }
        }
        @media (max-width: 480px) {
          .hero { padding: var(--sp-4) 0 var(--sp-5); }
        }
        @media (min-width: 1025px) {
          .hero { padding: var(--sp-8) 0 calc(var(--sp-8) + var(--sp-4)); }
        }
        @media (min-width: 1440px) {
          .hero { padding: calc(var(--sp-8) + var(--sp-3)) 0 calc(var(--sp-8) + var(--sp-6)); }
        }
        /* Aurora — "steppe night → ember trail" gradient гэрэл */
        .hero::before {
          content: ''; position: absolute; inset: -20% -10%; z-index: 0; pointer-events: none;
          background:
            radial-gradient(38% 46% at 18% 28%, rgba(224,122,62,0.22), transparent 70%),
            radial-gradient(42% 50% at 82% 32%, rgba(43,101,117,0.30), transparent 70%),
            radial-gradient(50% 60% at 55% 100%, rgba(224,122,62,0.10), transparent 70%);
          filter: blur(16px);
          animation: aurora 14s ease-in-out infinite alternate;
        }
        /* Зөөлөн paw-print хээ */
        .hero::after {
          content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.05;
          background-image: ${PAW_PATTERN}; background-size: 110px 110px;
        }
        @keyframes aurora {
          0% { transform: translate(0,0) scale(1); opacity: 0.8; }
          100% { transform: translate(1.5%, 1%) scale(1.06); opacity: 1; }
        }

        .hero-content { position: relative; z-index: 1; max-width: 720px; }
        @media (min-width: 1025px) {
          .hero-content { max-width: 800px; }
        }
        .hero-title {
          font-size: var(--text-display); margin-bottom: var(--sp-4); max-width: 660px; line-height: 1.08;
        }
        @media (max-width: 640px) {
          .hero-title { font-size: var(--text-2xl); margin-bottom: var(--sp-3); }
        }
        @media (max-width: 480px) {
          .hero-title { font-size: var(--text-xl); margin-bottom: var(--sp-3); }
        }
        @media (min-width: 1025px) {
          .hero-title { font-size: var(--text-display-lg); margin-bottom: var(--sp-5); max-width: 740px; }
        }
        .hero-desc { color: var(--muted); max-width: 480px; margin-bottom: var(--sp-5); font-size: 16.5px; line-height: 1.6; }
        @media (max-width: 640px) {
          .hero-desc { font-size: 15px; margin-bottom: var(--sp-4); }
        }
        @media (max-width: 480px) {
          .hero-desc { font-size: 14.5px; margin-bottom: var(--sp-4); line-height: 1.65; }
        }
        @media (min-width: 1025px) {
          .hero-desc { font-size: 17px; margin-bottom: var(--sp-6); max-width: 540px; line-height: 1.7; }
        }
        .hero-actions { display: flex; gap: var(--sp-3); flex-wrap: wrap; }
        @media (max-width: 480px) {
          .hero-actions { gap: var(--sp-2); flex-direction: column; }
          .hero-actions :global(.btn) { width: 100%; justify-content: center; }
        }
        @media (min-width: 1025px) {
          .hero-actions { gap: var(--sp-4); }
        }

        /* Гоёл чимэглэл — ember sparkles + floating paw */
        .hero-decor { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
        .ember {
          position: absolute; border-radius: 50%;
          background: radial-gradient(circle, var(--accent), transparent 70%);
          animation: ember-float 6s ease-in-out infinite;
          opacity: 0;
        }
        .e1 { width: 10px; height: 10px; right: 16%; top: 62%; animation-delay: 0s; }
        .e2 { width: 6px; height: 6px; right: 30%; top: 74%; animation-delay: 2s; }
        .e3 { width: 7px; height: 7px; right: 10%; top: 82%; animation-delay: 4s; }
        @keyframes ember-float {
          0% { transform: translate(0,0) scale(0.8); opacity: 0; }
          15% { opacity: 0.9; }
          60% { opacity: 0.5; }
          100% { transform: translate(-20px, -96px) scale(1.15); opacity: 0; }
        }
        .float-paw {
          position: absolute; right: 7%; top: 20%;
          width: 60px; height: 60px;
          display: flex; align-items: center; justify-content: center;
          color: var(--accent);
          background: var(--glass-bg); border: 1px solid var(--glass-border);
          border-radius: 20px; box-shadow: var(--shadow-md);
          animation: paw-bob 5s ease-in-out infinite;
        }
        @keyframes paw-bob {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-10px) rotate(4deg); }
        }
        @media (max-width: 760px) {
          .float-paw, .ember { display: none; }
        }

        /* CTA glow */
        .hero-actions .btn-accent { box-shadow: var(--shadow-glow); }
        .hero-actions .btn-accent:hover { box-shadow: 0 0 0 1px rgba(224,122,62,0.35), 0 12px 36px rgba(224,122,62,0.38); }
        .hero-actions .arrow { transition: transform 0.2s ease; }
        .hero-actions .btn:hover .arrow { transform: translateX(3px); }

        /* Стеггердсэн entrance animation */
        .hero-content > * { opacity: 0; animation: rise-in 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .hero-content .eyebrow { animation-delay: 0.05s; }
        .hero-content h1 { animation-delay: 0.15s; }
        .hero-content .hero-desc { animation-delay: 0.25s; }
        .hero-content .hero-actions { animation-delay: 0.35s; }
        @keyframes rise-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .how { margin-top: var(--sp-3); animation: rise-in 0.6s cubic-bezier(0.16,1,0.3,1) 0.55s backwards; }
        @media (max-width: 640px) {
          .how { margin-top: var(--sp-5); }
        }
        @media (max-width: 480px) {
          .how { margin-top: var(--sp-4); }
        }
        @media (min-width: 1025px) {
          .how { margin-top: var(--sp-7); }
        }
        .how-title { font-size: clamp(1.4rem, 3vw, 1.9rem); margin-bottom: var(--sp-5); }
        @media (max-width: 640px) {
          .how-title { margin-bottom: var(--sp-4); }
        }
        @media (max-width: 480px) {
          .how-title { margin-bottom: var(--sp-3); font-size: var(--text-xl); }
        }
        @media (min-width: 1025px) {
          .how-title { font-size: var(--text-3xl); margin-bottom: var(--sp-6); }
        }
        .trail-wrap { max-width: 520px; margin-bottom: var(--sp-4); }
        @media (max-width: 480px) {
          .trail-wrap { margin-bottom: var(--sp-3); }
        }
        @media (min-width: 1025px) {
          .trail-wrap { max-width: 620px; margin-bottom: var(--sp-5); }
        }
        .steps-grid { margin-top: 0; gap: var(--sp-5); }
        @media (max-width: 640px) {
          .steps-grid { gap: var(--sp-4); }
        }
        @media (max-width: 480px) {
          .steps-grid { gap: var(--sp-3); }
        }
        @media (min-width: 1025px) {
          .steps-grid { gap: var(--sp-6); }
        }
        .step-card {
          background: var(--card); border: 1px solid var(--line); border-radius: var(--r-lg);
          padding: var(--sp-5); box-shadow: var(--shadow-sm);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        @media (max-width: 640px) {
          .step-card { padding: var(--sp-4); border-radius: var(--r-md); }
        }
        @media (max-width: 480px) {
          .step-card { padding: var(--sp-3); }
        }
        @media (min-width: 1025px) {
          .step-card { padding: var(--sp-6); border-radius: var(--r-xl); }
        }
        .step-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: transparent; }
        .step-desc { color: var(--muted); font-size: 13.5px; line-height: 1.5; }
        @media (max-width: 480px) {
          .step-desc { font-size: 14px; line-height: 1.6; }
        }
        @media (min-width: 1025px) {
          .step-desc { font-size: 15px; line-height: 1.65; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero::before, .ember, .float-paw { animation: none; }
          .ember, .float-paw { opacity: 0.6; }
          .hero-content > *, .how { opacity: 1; animation: none; }
        }
      `}</style>
    </div>
  );
}
