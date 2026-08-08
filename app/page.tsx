'use client';
import Link from 'next/link';
import { useLanguage } from '../lib/i18n';
import PawTrail from '../components/PawTrail';
import ScrollReveal from '../components/ScrollReveal';
import Button from '../components/ui/Button';
import Icon from '../components/ui/icons';

// Hero-ийн зөөлөн paw-print хээ (data-URI SVG) — зөвхөн гоёл чимэглэл
const PAW_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cg fill='%233D7A5F'%3E%3Cellipse cx='24' cy='30' rx='11' ry='9'/%3E%3Ccircle cx='10' cy='18' r='5.5'/%3E%3Ccircle cx='38' cy='18' r='5.5'/%3E%3Ccircle cx='17' cy='8' r='5'/%3E%3Ccircle cx='31' cy='8' r='5'/%3E%3C/g%3E%3C/svg%3E\")";

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
            <Button as="link" href="/report-lost" variant="accent">
              {t('hero_btn_lost')}
              <svg className="arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Button>
            <Button as="link" href="/report-found" variant="ghost">{t('hero_btn_found')}</Button>
          </div>

          <ul className="hero-trust" aria-label="Платформын давуу талууд">
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span>{t('hero_trust_location')}</span>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
              </svg>
              <span>{t('hero_trust_photo')}</span>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
              </svg>
              <span>{t('hero_trust_direct')}</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="services">
        <div className="eyebrow">{t('services_title')}</div>
        <h2 className="services-title">{t('services_subtitle')}</h2>

        <div className="services-grid">
          <Link href="/report-lost" className="service-card">
            <span className="service-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <h3>{t('services_lost')}</h3>
            <p>{t('services_lost_desc')}</p>
            <span className="service-arrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </span>
          </Link>
          <Link href="/report-found" className="service-card">
            <span className="service-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
              </svg>
            </span>
            <h3>{t('services_found')}</h3>
            <p>{t('services_found_desc')}</p>
            <span className="service-arrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </span>
          </Link>
          <Link href="/adoptions" className="service-card">
            <span className="service-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              </svg>
            </span>
            <h3>{t('services_adopt')}</h3>
            <p>{t('services_adopt_desc')}</p>
            <span className="service-arrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </span>
          </Link>
          <Link href="/sitting" className="service-card">
            <span className="service-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
              </svg>
            </span>
            <h3>{t('services_sitting')}</h3>
            <p>{t('services_sitting_desc')}</p>
            <span className="service-arrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </span>
          </Link>
          <Link href="/clinics" className="service-card">
            <span className="service-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="M12 22V10" />
              </svg>
            </span>
            <h3>{t('services_clinics')}</h3>
            <p>{t('services_clinics_desc')}</p>
            <span className="service-arrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </span>
          </Link>
          <Link href="/assistant" className="service-card">
            <span className="service-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /><path d="M8 9h8M8 13h5" />
              </svg>
            </span>
            <h3>{t('services_assistant')}</h3>
            <p>{t('services_assistant_desc')}</p>
            <span className="service-arrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </span>
          </Link>
        </div>
      </section>

      <section className="how">
        <h2 className="how-title">{t('how_it_works')}</h2>
        <div className="trail-wrap">
          <PawTrail labels={[t('step1_title'), t('step2_title'), t('step3_title')]} current={2} />
        </div>

        <div className="grid steps-grid">
          <ScrollReveal className="step-card">
            <span className="step-num" aria-hidden="true">01</span>
            <p className="step-desc">{t('step1_desc')}</p>
          </ScrollReveal>
          <ScrollReveal className="step-card reveal-delay-1">
            <span className="step-num" aria-hidden="true">02</span>
            <p className="step-desc">{t('step2_desc')}</p>
          </ScrollReveal>
          <ScrollReveal className="step-card reveal-delay-2">
            <span className="step-num" aria-hidden="true">03</span>
            <p className="step-desc">{t('step3_desc')}</p>
          </ScrollReveal>
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
            radial-gradient(38% 46% at 18% 28%, rgba(232,114,92,0.18), transparent 70%),
            radial-gradient(42% 50% at 82% 32%, rgba(61,122,95,0.25), transparent 70%),
            radial-gradient(50% 60% at 55% 100%, rgba(232,114,92,0.08), transparent 70%);
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
          .hero-actions :global(.btn-base) { width: 100%; justify-content: center; }
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
        .hero-actions :global([data-variant='accent']) { box-shadow: var(--shadow-glow); }
        .hero-actions :global([data-variant='accent']):hover { box-shadow: 0 0 0 1px rgba(232,114,92,0.35), 0 12px 36px rgba(232,114,92,0.35); }
        .hero-actions .arrow { transition: transform 0.2s ease; }
        .hero-actions :global(.btn-base):hover .arrow { transform: translateX(3px); }
        .hero-trust {
          list-style: none; margin: var(--sp-5) 0 0; padding: 0;
          display: flex; flex-wrap: wrap; gap: var(--sp-2) var(--sp-4);
        }
        .hero-trust li {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: var(--text-xs); font-weight: 500; color: var(--muted);
        }
        .hero-trust svg { color: var(--accent); flex-shrink: 0; }
        @media (max-width: 480px) {
          .hero-trust { flex-direction: column; gap: var(--sp-2); margin-top: var(--sp-4); }
          .hero-trust li { font-size: 13px; }
        }

        /* Стеггердсэн entrance animation */
        .hero-content > * { opacity: 0; animation: rise-in 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .hero-content .eyebrow { animation-delay: 0.05s; }
        .hero-content h1 { animation-delay: 0.15s; }
        .hero-content .hero-desc { animation-delay: 0.25s; }
        .hero-content .hero-actions { animation-delay: 0.35s; }
        .hero-content .hero-trust { animation-delay: 0.45s; }
        @keyframes rise-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .services { margin-top: var(--sp-7); }
        @media (max-width: 640px) { .services { margin-top: var(--sp-6); } }
        @media (max-width: 480px) { .services { margin-top: var(--sp-5); } }
        .services-title { font-size: var(--text-2xl); max-width: 480px; }
        @media (max-width: 640px) { .services-title { font-size: var(--text-xl); } }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--sp-4);
          margin-top: var(--sp-5);
        }
        @media (max-width: 768px) { .services-grid { grid-template-columns: repeat(2, 1fr); gap: var(--sp-3); } }
        @media (max-width: 480px) { .services-grid { grid-template-columns: 1fr; gap: var(--sp-3); } }
        .service-card {
          position: relative;
          display: block;
          background: var(--surface-2);
          border: 1px solid var(--border-subtle);
          border-radius: var(--r-lg);
          padding: var(--sp-5);
          text-decoration: none;
          height: 100%;
          box-shadow: var(--shadow-sm);
          transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
        }
        .service-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary-light);
        }
        .service-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 48px; height: 48px; border-radius: var(--r-md);
          background: var(--surface-3); color: var(--primary);
          margin-bottom: var(--sp-4);
          transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
        }
        .service-card:hover .service-icon { background: var(--grad-brand); color: #fff; }
        .service-card h3 { font-family: var(--font-display); font-size: var(--text-base); font-weight: 700; color: var(--primary); margin-bottom: var(--sp-1); }
        .service-card p { font-size: var(--text-xs); color: var(--text-secondary); line-height: 1.5; }
        .service-arrow {
          position: absolute; top: var(--sp-5); right: var(--sp-4);
          color: var(--text-tertiary);
          transition: transform var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out);
        }
        .service-card:hover .service-arrow { transform: translateX(3px); color: var(--accent); }

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
          position: relative;
          background: var(--card); border: 1px solid var(--line); border-radius: var(--r-lg);
          padding: var(--sp-6) var(--sp-5); box-shadow: var(--shadow-sm); overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease;
        }
        @media (max-width: 640px) {
          .step-card { padding: var(--sp-5) var(--sp-4); border-radius: var(--r-md); }
        }
        @media (max-width: 480px) {
          .step-card { padding: var(--sp-4) var(--sp-3); }
        }
        @media (min-width: 1025px) {
          .step-card { padding: var(--sp-7) var(--sp-6); border-radius: var(--r-xl); }
        }
        .step-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-lift); border-color: transparent; }
        .step-num {
          display: block; font-family: var(--font-display); font-weight: 800; line-height: 1;
          font-size: clamp(2.2rem, 7vw, 3rem);
          background: var(--grad-accent); -webkit-background-clip: text; background-clip: text;
          color: transparent; opacity: 0.35; margin-bottom: var(--sp-3);
        }
        /* Dark mode-д watermark тоог илүү уншигдах болгох */
        :global([data-theme="dark"]) .step-num { opacity: 0.6; }
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
