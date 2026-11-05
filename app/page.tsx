'use client';
import Link from 'next/link';
import { useLanguage } from '../lib/i18n';
import { BrandMark } from '../components/ui/BrandLogo';
import Button from '../components/ui/Button';
import Icon from '../components/ui/icons';

// Hero-ийн зөөлөн paw-print хээ (data-URI SVG) — зөвхөн гоёл чимэглэл
const PAW_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cg fill='%23625BF6'%3E%3Cellipse cx='24' cy='30' rx='11' ry='9'/%3E%3Ccircle cx='10' cy='18' r='5.5'/%3E%3Ccircle cx='38' cy='18' r='5.5'/%3E%3Ccircle cx='17' cy='8' r='5'/%3E%3Ccircle cx='31' cy='8' r='5'/%3E%3C/g%3E%3C/svg%3E\")";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="home page-shell">
      <section className="hero">
        {/* Indigo / Coral ambient glows */}
        <div className="hero-glow g1" aria-hidden="true" />
        <div className="hero-glow g2" aria-hidden="true" />

        <div className="hero-inner">
          <div className="hero-content">
            <p className="eyebrow">
              <Icon name="heart" size={14} />
              {t('hero_eyebrow')}
            </p>
            <h1 className="hero-title">
              {t('hero_title_1')} <span className="gradient-text">{t('hero_title_accent')}</span> {t('hero_title_2')}
            </h1>
            <p className="hero-desc">{t('hero_desc')}</p>
            <nav className="hero-actions" aria-label={t('hero_actions_label')}>
              <Button as="link" href="/report-lost" variant="accent">
                <Icon name="pin" size={18} />{t('hero_action_lost')}
              </Button>
              <Button as="link" href="/report-found" variant="secondary">
                <Icon name="paw" size={18} />{t('hero_action_found')}
              </Button>
              <Button as="link" href="/listings" variant="secondary">
                <Icon name="search" size={18} />{t('hero_action_search')}
              </Button>
            </nav>
            <ul className="hero-trust" aria-label={t('hero_trust_aria')}>
              <li><Icon name="pin" size={16} /><span>{t('hero_trust_location')}</span></li>
              <li><Icon name="search" size={16} /><span>{t('hero_trust_photo')}</span></li>
              <li><Icon name="message" size={16} /><span>{t('hero_trust_direct')}</span></li>
            </ul>
          </div>

          {/* Харагдац карт — гоёл чимэглэл */}
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-card">
              <div className="hero-card-photo">
                <span className="status-chip">{t('hero_preview_label')}</span>
                <BrandMark size={88} />
              </div>
              <div className="hero-card-body">
                <p className="hero-card-title">{t('type_dog')}</p>
                <p>{t('hero_preview_breed')}</p>
                <div className="hero-card-loc">
                  <Icon name="pin" size={14} />
                  {t('hero_preview_location')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="how" aria-labelledby="how-heading">
        <div className="how-heading">
          <h2 id="how-heading" className="how-title">{t('how_it_works')}</h2>
          <button type="button" className="how-guide" onClick={() => window.dispatchEvent(new Event('mur:open-onboarding'))}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 17h.01"/></svg>
            {t('how_open_guide')}
          </button>
        </div>
        <ol className="steps-grid" role="list" aria-labelledby="how-heading">
          {[
            { title: t('step1_title'), description: t('step1_desc') },
            { title: t('step2_title'), description: t('step2_desc') },
            { title: t('step3_title'), description: t('step3_desc') },
          ].map((step, index) => (
            <li key={step.title} className="step-card">
              <span className="step-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="services" aria-labelledby="services-heading">
        <h2 id="services-heading" className="services-title">{t('services_subtitle')}</h2>

        <div className="services-grid">
          <Link href="/adoptions" className="service-card">
            <span className="service-icon" aria-hidden="true">
              <Icon name="heart" size={24} aria-hidden="true" />
            </span>
            <h3>{t('services_adopt')}</h3>
            <p>{t('services_adopt_desc')}</p>
            <span className="service-arrow" aria-hidden="true">
              <Icon name="arrowRight" size={16} aria-hidden="true" />
            </span>
          </Link>
          <Link href="/sitting" className="service-card">
            <span className="service-icon" aria-hidden="true">
              <Icon name="paw" size={24} aria-hidden="true" />
            </span>
            <h3>{t('services_sitting')}</h3>
            <p>{t('services_sitting_desc')}</p>
            <span className="service-arrow" aria-hidden="true">
              <Icon name="arrowRight" size={16} aria-hidden="true" />
            </span>
          </Link>
          <Link href="/clinics" className="service-card">
            <span className="service-icon" aria-hidden="true">
              <Icon name="cross" size={24} aria-hidden="true" />
            </span>
            <h3>{t('services_clinics')}</h3>
            <p>{t('services_clinics_desc')}</p>
            <span className="service-arrow" aria-hidden="true">
              <Icon name="arrowRight" size={16} aria-hidden="true" />
            </span>
          </Link>
          <Link href="/assistant" className="service-card">
            <span className="service-icon" aria-hidden="true">
              <Icon name="bot" size={24} aria-hidden="true" />
            </span>
            <h3>{t('services_assistant')}</h3>
            <p>{t('services_assistant_desc')}</p>
            <span className="service-arrow" aria-hidden="true">
              <Icon name="arrowRight" size={16} aria-hidden="true" />
            </span>
          </Link>
        </div>
      </section>

      <style jsx>{`
        .hero { position: relative; overflow: hidden; padding: clamp(32px, 5vw, 64px) 0 clamp(48px, 7vw, 88px); }
        @media (max-width: 640px) { .hero { padding: var(--sp-5) 0 var(--sp-7); } }
        @media (max-width: 480px) { .hero { padding: var(--sp-4) 0 var(--sp-6); } }

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
          content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.025;
          background-image: ${PAW_PATTERN}; background-size: 128px 128px;
        }

        .hero-inner {
          position: relative; z-index: 1;
          display: grid; grid-template-columns: 1.15fr 0.85fr; gap: var(--sp-7); align-items: center;
        }
        @media (max-width: 860px) {
          .hero-inner { grid-template-columns: 1fr; gap: var(--sp-5); }
        }

        .hero-content { max-width: 720px; }
        @media (min-width: 1025px) { .hero-content { max-width: 800px; } }
        .hero-title {
          font-size: clamp(2.6rem, 5.4vw, 4.4rem); margin-bottom: var(--sp-5); line-height: 1.06;
        }
        @media (max-width: 640px) { .hero-title { font-size: clamp(1.75rem, 6vw, 2.25rem); margin-bottom: var(--sp-3); } }
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
        .hero-trust {
          list-style: none; margin: var(--sp-5) 0 0; padding: 0;
          display: flex; flex-wrap: wrap; gap: var(--sp-2) var(--sp-4);
        }
        .hero-trust li {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: var(--text-xs); font-weight: 500; color: var(--text-secondary);
        }
        .hero-trust :global(svg) { color: var(--primary-light); flex-shrink: 0; }
        @media (max-width: 480px) {
          .hero-trust { flex-direction: column; gap: var(--sp-2); margin-top: var(--sp-4); }
          .hero-trust li { font-size: 13px; }
        }

        /* Харагдац карт */
        .hero-visual {
          position: relative; display: flex; align-items: center; justify-content: center;
          width: 100%; max-width: 380px; min-width: 0; min-height: 320px; justify-self: center;
          padding-inline: 12px; box-sizing: border-box;
        }
        .hero-card {
          position: relative; width: min(280px, calc(100% - 24px));
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
        .hero-card-photo :global(img) { width: 88px; height: 88px; }
        .status-chip {
          position: absolute; top: 12px; left: 12px;
          background: var(--accent); color: var(--text-on-accent);
          font-size: 11px; font-weight: 700; letter-spacing: 0.03em;
          padding: 5px 11px; border-radius: var(--r-pill);
        }
        .hero-card-body { padding: var(--sp-4); }
        .hero-card-body .hero-card-title { font-family: var(--font-display); font-size: 17px; font-weight: 700; margin-bottom: 2px; color: var(--text-primary); }
        .hero-card-body > p:not(.hero-card-title) { font-size: 13px; color: var(--text-tertiary); margin-bottom: 10px; }
        .hero-card-loc { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--text-secondary); }
        .hero-card-loc :global(svg) { color: var(--primary); flex-shrink: 0; }
        @media (max-width: 860px) {
          .hero-visual { max-width: 520px; min-height: 0; padding: 0; justify-self: start; }
          .hero-card { display: grid; grid-template-columns: 112px minmax(0, 1fr); width: 100%; animation: none; }
          .hero-card-photo { height: auto; min-height: 132px; padding-top: 20px; }
          .hero-card-photo :global(img) { width: 64px; height: 64px; }
          .hero-card-body { align-self: center; min-width: 0; padding: var(--sp-3); }
          .status-chip { top: 8px; left: 8px; padding: 4px 8px; font-size: 10px; }
        }

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

        .services { margin-top: 0; padding: clamp(48px, 7vw, 80px) 0; border-top: 1px solid var(--border-subtle); }
        @media (max-width: 640px) { .services { padding: var(--sp-7) 0; } }
        @media (max-width: 480px) { .services { padding: var(--sp-6) 0; } }
        .services-title { font-size: clamp(1.4rem, 3vw, 1.9rem); margin-bottom: var(--sp-5); line-height: 1.2; }
        @media (min-width: 1025px) { .services-title { font-size: var(--text-3xl); margin-bottom: var(--sp-6); } }
        @media (max-width: 640px) { .services-title { font-size: var(--text-xl); } }

        .how { margin-top: 0; padding: clamp(48px, 7vw, 80px) 0; border-top: 1px solid var(--border-subtle); animation: rise-in 0.6s cubic-bezier(0.16,1,0.3,1) 0.55s backwards; }
        @media (max-width: 640px) { .how { padding: var(--sp-7) 0; } }
        @media (max-width: 480px) { .how { padding: var(--sp-6) 0; } }
        .how-heading { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); margin-bottom: var(--sp-5); }
        .how-title { font-size: clamp(1.4rem, 3vw, 1.9rem); margin-bottom: 0; }
        .how-guide { display: inline-flex; align-items: center; gap: 8px; min-height: 42px; padding: 0 16px; border: 1px solid var(--border-subtle); border-radius: 999px; color: var(--primary); background: var(--surface-2); font-weight: 700; cursor: pointer; }
        .how-guide:hover { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 8%, var(--surface-2)); }
        .how-guide:focus-visible { outline: 3px solid var(--border-focus); outline-offset: 2px; }
        @media (max-width: 640px) { .how-heading { align-items: flex-start; flex-direction: column; margin-bottom: var(--sp-4); } }
        @media (max-width: 480px) { .how-heading { margin-bottom: var(--sp-3); } .how-title { font-size: var(--text-xl); } .how-guide { width: 100%; justify-content: center; } }
        @media (min-width: 1025px) { .how-title { font-size: var(--text-3xl); } .how-heading { margin-bottom: var(--sp-6); } }
        .steps-grid { display: grid; list-style: none; margin: 0; padding: 0; gap: var(--sp-5); grid-template-columns: repeat(3, minmax(0, 1fr)); }
        @media (max-width: 640px) { .steps-grid { gap: var(--sp-4); } }
        @media (max-width: 480px) { .steps-grid { gap: var(--sp-3); } }
        @media (max-width: 720px) { .steps-grid { grid-template-columns: 1fr; } }
        @media (min-width: 1025px) { .steps-grid { gap: var(--sp-6); } }
        .step-card {
          position: relative;
          background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: var(--r-lg);
          padding: var(--sp-6) var(--sp-5); box-shadow: var(--shadow-sm); overflow: hidden;
        }
        @media (max-width: 640px) { .step-card { padding: var(--sp-5) var(--sp-4); border-radius: var(--r-md); } }
        @media (max-width: 480px) { .step-card { padding: var(--sp-4) var(--sp-3); } }
        .step-num {
          display: block; font-family: var(--font-display); font-weight: 800; line-height: 1;
          font-size: 1.5rem; color: var(--primary); margin-bottom: var(--sp-3);
        }
        .step-title { font-size: var(--text-base); margin: 0 0 var(--sp-2); }
        .step-desc { color: var(--text-secondary); font-size: 13.5px; line-height: 1.5; }
        @media (max-width: 480px) { .step-desc { font-size: 14px; line-height: 1.6; } }
        @media (min-width: 1025px) { .step-desc { font-size: 15px; line-height: 1.65; } }

        @media (prefers-reduced-motion: reduce) {
          .hero-glow, .hero-card { animation: none; }
          .hero-content > *, .hero-visual, .how { opacity: 1; animation: none; }
        }
      `}</style>
    </div>
  );
}
