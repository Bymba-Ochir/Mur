'use client';
import Link from 'next/link';
import { useLanguage } from '../lib/i18n';
import PawTrail from '../components/PawTrail';
import ScrollReveal from '../components/ScrollReveal';
import Button from '../components/ui/Button';

// Hero-ийн зөөлөн paw-print хээ (data-URI SVG) — зөвхөн гоёл чимэглэл
const PAW_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cg fill='%23625BF6'%3E%3Cellipse cx='24' cy='30' rx='11' ry='9'/%3E%3Ccircle cx='10' cy='18' r='5.5'/%3E%3Ccircle cx='38' cy='18' r='5.5'/%3E%3Ccircle cx='17' cy='8' r='5'/%3E%3Ccircle cx='31' cy='8' r='5'/%3E%3C/g%3E%3C/svg%3E\")";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="home">
      <section className="hero">
        {/* Indigo / Coral ambient glows */}
        <div className="hero-glow g1" aria-hidden="true" />
        <div className="hero-glow g2" aria-hidden="true" />

        <div className="hero-inner">
          <div className="hero-content">
            <div className="eyebrow">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 21s-7-4.5-9.5-9C.7 8.3 2 4.8 5.4 4.1 7.6 3.6 9.8 4.6 12 7c2.2-2.4 4.4-3.4 6.6-2.9 3.4.7 4.7 4.2 2.9 7.9C19 16.5 12 21 12 21z" /></svg>
              {t('hero_eyebrow')}
            </div>
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
              <Button as="link" href="/report-found" variant="secondary">{t('hero_btn_found')}</Button>
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

          {/* Харагдац карт — гоёл чимэглэл */}
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-card">
              <div className="hero-card-photo">
                <span className="status-chip">АЛДСАН</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64" focusable="false">
                  <circle cx="12" cy="12" r="7" />
                  <path d="M9 10.5c0-1 .6-1.5 1.4-1.5M14.6 10.5c0-1-.6-1.5-1.4-1.5M9.5 15c1.5 1 3.5 1 5 0" strokeLinecap="round" />
                </svg>
              </div>
              <div className="hero-card-body">
                <h4>Нохой</h4>
                <p>Голден ретривер, шаргал</p>
                <div className="hero-card-loc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" focusable="false">
                    <path d="M12 21s-7-4.5-8.5-9.6C2.6 7.8 4.4 5 7.3 4.9c1.9-.1 3.5 1 4.7 2.6C13.2 5.9 14.8 4.8 16.7 4.9c2.9.1 4.7 2.9 3.8 6.5C19 16.5 12 21 12 21z" />
                  </svg>
                  Баянзүрх — 22 хороо
                </div>
              </div>
            </div>
            <div className="hero-card-mini">
              <span className="dot" />
              <p>Шинэ тохирол олдлоо</p>
            </div>
          </div>
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
        .hero { position: relative; overflow: hidden; padding: var(--sp-8) 0; }
        @media (max-width: 640px) { .hero { padding: var(--sp-5) 0 var(--sp-6); } }
        @media (max-width: 480px) { .hero { padding: var(--sp-4) 0 var(--sp-5); } }
        @media (min-width: 1025px) { .hero { padding: var(--sp-8) 0 calc(var(--sp-8) + var(--sp-4)); } }
        @media (min-width: 1440px) { .hero { padding: calc(var(--sp-8) + var(--sp-3)) 0 calc(var(--sp-8) + var(--sp-6)); } }

        /* Ambient glows */
        :global(.hero-glow.g1) {
          width: 560px; height: 560px;
          background: var(--primary); opacity: 0.10;
          top: -260px; left: -180px;
        }
        :global(.hero-glow.g2) {
          width: 420px; height: 420px;
          background: var(--accent); opacity: 0.06;
          top: 80px; right: -160px;
        }

        /* Зөөлөн paw-print хээ */
        .hero::after {
          content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.04;
          background-image: ${PAW_PATTERN}; background-size: 110px 110px;
        }

        .hero-inner {
          position: relative; z-index: 1;
          display: grid; grid-template-columns: 1.15fr 0.85fr; gap: var(--sp-7); align-items: center;
        }
        @media (max-width: 900px) {
          .hero-inner { grid-template-columns: 1fr; gap: var(--sp-5); }
        }

        .hero-content { max-width: 720px; }
        @media (min-width: 1025px) { .hero-content { max-width: 800px; } }
        .hero-title {
          font-size: clamp(2.6rem, 5.4vw, 4.4rem); margin-bottom: var(--sp-5); line-height: 1.06;
        }
        @media (max-width: 640px) { .hero-title { font-size: var(--text-2xl); margin-bottom: var(--sp-3); } }
        @media (max-width: 480px) { .hero-title { font-size: var(--text-xl); margin-bottom: var(--sp-3); } }
        @media (min-width: 1025px) { .hero-title { font-size: var(--text-display-lg); margin-bottom: var(--sp-5); } }
        .hero-desc {
          color: var(--text-secondary); max-width: 480px; margin-bottom: var(--sp-5);
          font-size: 16.5px; line-height: 1.6;
        }
        @media (max-width: 640px) { .hero-desc { font-size: 15px; margin-bottom: var(--sp-4); } }
        @media (max-width: 480px) { .hero-desc { font-size: 14.5px; margin-bottom: var(--sp-4); line-height: 1.65; } }
        @media (min-width: 1025px) { .hero-desc { font-size: 17px; margin-bottom: var(--sp-6); max-width: 540px; line-height: 1.7; } }
        .hero-actions { display: flex; gap: var(--sp-3); flex-wrap: wrap; }
        .hero-title :global(.gradient-text) { background: none; color: var(--accent); }
        @media (max-width: 480px) {
          .hero-actions { gap: var(--sp-2); flex-direction: column; }
          .hero-actions :global(.btn-base) { width: 100%; justify-content: center; }
        }
        @media (min-width: 1025px) { .hero-actions { gap: var(--sp-4); } }

        /* CTA glow */
        .hero-actions :global([data-variant='accent']) { box-shadow: var(--shadow-glow); }
        .hero-actions :global([data-variant='accent']):hover {
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent),
                      0 12px 36px color-mix(in srgb, var(--accent) 35%, transparent);
        }
        .hero-actions .arrow { transition: transform 0.2s ease; }
        .hero-actions :global(.btn-base):hover .arrow { transform: translateX(3px); }
        .hero-trust {
          list-style: none; margin: var(--sp-5) 0 0; padding: 0;
          display: flex; flex-wrap: wrap; gap: var(--sp-2) var(--sp-4);
        }
        .hero-trust li {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: var(--text-xs); font-weight: 500; color: var(--text-secondary);
        }
        .hero-trust svg { color: var(--primary-light); flex-shrink: 0; }
        @media (max-width: 480px) {
          .hero-trust { flex-direction: column; gap: var(--sp-2); margin-top: var(--sp-4); }
          .hero-trust li { font-size: 13px; }
        }

        /* Харагдац карт */
        .hero-visual { position: relative; display: flex; align-items: center; justify-content: center; min-height: 320px; }
        @media (max-width: 900px) { .hero-visual { min-height: 0; padding: var(--sp-4) 0 var(--sp-5); } }
        .hero-card {
          position: relative; width: 280px;
          background: var(--surface-2); border: 1px solid var(--border-subtle);
          border-radius: var(--r-lg); box-shadow: var(--shadow-lift); overflow: hidden;
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-14px) rotate(1deg); }
        }
        .hero-card-photo {
          height: 180px; position: relative; display: flex; align-items: center; justify-content: center;
          background:
            radial-gradient(circle at 40% 30%, color-mix(in srgb, var(--primary) 55%, transparent), transparent 75%),
            var(--surface-3);
        }
        .hero-card-photo svg { color: var(--surface-2); opacity: 0.9; }
        .status-chip {
          position: absolute; top: 12px; left: 12px;
          background: var(--accent); color: var(--text-on-accent);
          font-size: 11px; font-weight: 700; letter-spacing: 0.03em;
          padding: 5px 11px; border-radius: var(--r-pill);
        }
        .hero-card-body { padding: var(--sp-4); }
        .hero-card-body h4 { font-family: var(--font-display); font-size: 17px; margin-bottom: 2px; color: var(--text-primary); }
        .hero-card-body p { font-size: 13px; color: var(--text-tertiary); margin-bottom: 10px; }
        .hero-card-loc { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--text-secondary); }
        .hero-card-loc svg { color: var(--alert-light); }
        .hero-card-mini {
          position: absolute; bottom: 8px; right: clamp(12px, 4vw, 48px);
          display: flex; align-items: center; gap: 8px;
          width: max-content; max-width: calc(100% - 24px); box-sizing: border-box;
          background: var(--surface-3); border: 1px solid var(--border-strong);
          border-radius: var(--r-md); padding: var(--sp-3);
          box-shadow: var(--shadow-md);
          animation: float 7s ease-in-out infinite reverse;
        }
        .hero-card-mini .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--confirmed); flex-shrink: 0; box-shadow: 0 0 0 4px color-mix(in srgb, var(--confirmed) 18%, transparent); }
        .hero-card-mini p { min-width: 0; font-size: 11.5px; line-height: 1.35; color: var(--text-secondary); font-weight: 600; white-space: normal; overflow-wrap: anywhere; }
        @media (max-width: 900px) { .hero-card-mini { right: max(12px, 8%); } }

        /* Entrance animation */
        .hero-content > * { opacity: 0; animation: rise-in 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .hero-content .eyebrow { animation-delay: 0.05s; }
        .hero-content h1 { animation-delay: 0.15s; }
        .hero-content .hero-desc { animation-delay: 0.25s; }
        .hero-content .hero-actions { animation-delay: 0.35s; }
        .hero-content .hero-trust { animation-delay: 0.45s; }
        .hero-visual { opacity: 0; animation: rise-in 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s forwards; }
        @keyframes rise-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .services { margin-top: 0; padding: var(--sp-9) 0; }
        @media (max-width: 640px) { .services { margin-top: var(--sp-6); } }
        @media (max-width: 480px) { .services { margin-top: var(--sp-5); } }
        .services-title { font-size: clamp(1.8rem, 3.2vw, 2.6rem); max-width: 640px; line-height: 1.15; }
        @media (max-width: 640px) { .services-title { font-size: var(--text-xl); } }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: var(--sp-4);
          margin-top: var(--sp-5);
        }
        @media (max-width: 900px) { .services-grid { gap: var(--sp-3); } }
        .service-card {
          position: relative;
          display: block;
          background: var(--surface-2);
          border: 1px solid var(--border-subtle);
          border-radius: var(--r-lg);
          padding: var(--sp-5);
          text-decoration: none;
          grid-column: span 2;
          height: 100%;
          box-shadow: var(--shadow-sm);
          transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
        }
        .service-card:nth-child(-n + 2) { grid-column: span 3; }
        .service-card:nth-child(1) { --feature-color: var(--accent); --feature-soft: #FF8A8A; }
        .service-card:nth-child(2) { --feature-color: var(--found); --feature-soft: #7DD8F0; }
        .service-card:nth-child(3) { --feature-color: var(--primary); --feature-soft: #8178F7; }
        .service-card:nth-child(4) { --feature-color: var(--found); --feature-soft: #7DD8F0; }
        .service-card:nth-child(5) { --feature-color: var(--clinic); --feature-soft: #56C7E8; }
        .service-card:nth-child(6) { --feature-color: var(--assistant); --feature-soft: #A49EFC; }
        @media (max-width: 900px) { .service-card, .service-card:nth-child(-n + 2) { grid-column: span 3; } }
        @media (max-width: 600px) { .service-card, .service-card:nth-child(-n + 2) { grid-column: span 6; } }
        .service-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: color-mix(in srgb, var(--feature-color) 55%, var(--border-subtle));
        }
        .service-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 48px; height: 48px; border-radius: var(--r-md);
          background: linear-gradient(135deg, var(--feature-soft), var(--feature-color)); color: #FFFFFF;
          margin-bottom: var(--sp-4);
          transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
        }
        .service-card:hover .service-icon { transform: scale(1.06) rotate(-3deg); box-shadow: 0 8px 20px color-mix(in srgb, var(--feature-color) 24%, transparent); }
        .service-card h3 { font-family: var(--font-display); font-size: var(--text-base); font-weight: 700; color: var(--text-primary); margin-bottom: var(--sp-1); }
        .service-card p { font-size: var(--text-xs); color: var(--text-secondary); line-height: 1.5; }
        .service-arrow {
          position: absolute; top: var(--sp-5); right: var(--sp-4);
          color: var(--text-tertiary);
          transition: transform var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out);
        }
        .service-card:hover .service-arrow { transform: translateX(3px); color: var(--feature-color); }

        .how { margin-top: 0; padding: var(--sp-9) 0; animation: rise-in 0.6s cubic-bezier(0.16,1,0.3,1) 0.55s backwards; }
        @media (max-width: 640px) { .how { margin-top: var(--sp-5); } }
        @media (max-width: 480px) { .how { margin-top: var(--sp-4); } }
        @media (min-width: 1025px) { .how { margin-top: var(--sp-7); } }
        .how-title { font-size: clamp(1.4rem, 3vw, 1.9rem); margin-bottom: var(--sp-5); }
        @media (max-width: 640px) { .how-title { margin-bottom: var(--sp-4); } }
        @media (max-width: 480px) { .how-title { margin-bottom: var(--sp-3); font-size: var(--text-xl); } }
        @media (min-width: 1025px) { .how-title { font-size: var(--text-3xl); margin-bottom: var(--sp-6); } }
        .trail-wrap { max-width: 520px; margin-bottom: var(--sp-4); }
        @media (max-width: 480px) { .trail-wrap { margin-bottom: var(--sp-3); } }
        @media (min-width: 1025px) { .trail-wrap { max-width: 620px; margin-bottom: var(--sp-5); } }
        .steps-grid { margin-top: 0; gap: var(--sp-5); }
        @media (max-width: 640px) { .steps-grid { gap: var(--sp-4); } }
        @media (max-width: 480px) { .steps-grid { gap: var(--sp-3); } }
        @media (min-width: 1025px) { .steps-grid { gap: var(--sp-6); } }
        .step-card {
          position: relative;
          background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: var(--r-lg);
          padding: var(--sp-6) var(--sp-5); box-shadow: var(--shadow-sm); overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease;
        }
        @media (max-width: 640px) { .step-card { padding: var(--sp-5) var(--sp-4); border-radius: var(--r-md); } }
        @media (max-width: 480px) { .step-card { padding: var(--sp-4) var(--sp-3); } }
        @media (min-width: 1025px) { .step-card { padding: var(--sp-7) var(--sp-6); border-radius: var(--r-xl); } }
        .step-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-lift); border-color: transparent; }
        .step-num {
          display: block; font-family: var(--font-display); font-weight: 800; line-height: 1;
          font-size: clamp(2.2rem, 7vw, 3rem);
          background: var(--grad-accent); -webkit-background-clip: text; background-clip: text;
          color: transparent; opacity: 0.6; margin-bottom: var(--sp-3);
        }
        /* Цайвар горимд watermark тоог бүдэг болгох */
        :global([data-theme="light"]) .step-num { opacity: 0.35; }
        .step-desc { color: var(--text-secondary); font-size: 13.5px; line-height: 1.5; }
        @media (max-width: 480px) { .step-desc { font-size: 14px; line-height: 1.6; } }
        @media (min-width: 1025px) { .step-desc { font-size: 15px; line-height: 1.65; } }

        @media (prefers-reduced-motion: reduce) {
          .hero-glow, .hero-card, .hero-card-mini { animation: none; }
          .hero-content > *, .hero-visual, .how { opacity: 1; animation: none; }
        }
      `}</style>
    </div>
  );
}
