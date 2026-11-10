'use client';
import Link from 'next/link';
import { useLanguage } from '../lib/i18n';
import { BrandMark } from '../components/ui/BrandLogo';
import Button from '../components/ui/Button';
import Icon from '../components/ui/icons';

const services = [
  { href: '/adoptions', icon: 'heart', title: 'services_adopt', description: 'services_adopt_desc' },
  { href: '/sitting', icon: 'paw', title: 'services_sitting', description: 'services_sitting_desc' },
  { href: '/clinics', icon: 'cross', title: 'services_clinics', description: 'services_clinics_desc' },
  { href: '/assistant', icon: 'bot', title: 'services_assistant', description: 'services_assistant_desc' },
] as const;

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="home page-shell">
      <section className="hero" aria-labelledby="home-heading">
        <div className="hero-content">
          <p className="hero-kicker">
            <Icon name="pin" size={16} />
            {t('hero_eyebrow')}
          </p>
          <h1 id="home-heading" className="hero-title">
            {t('hero_title_1')} {t('hero_title_accent')} {t('hero_title_2')}
          </h1>
          <p className="hero-desc">{t('hero_desc')}</p>
          <nav className="hero-actions" aria-label={t('hero_actions_label')}>
            <Button as="link" href="/report-lost" variant="primary">
              <Icon name="pin" size={18} />{t('hero_action_lost')}
            </Button>
            <Button as="link" href="/report-found" variant="ghost">
              <Icon name="paw" size={18} />{t('hero_action_found')}
            </Button>
            <Button as="link" href="/listings" variant="ghost" className="hero-search">
              <Icon name="search" size={18} />{t('hero_action_search')}
            </Button>
          </nav>
          <button type="button" className="how-guide" aria-haspopup="dialog" onClick={() => window.dispatchEvent(new Event('mur:open-onboarding'))}>
            <Icon name="info" size={16} />
            {t('how_open_guide')}
          </button>
          <ul className="hero-trust" aria-label={t('hero_trust_aria')}>
            <li><Icon name="pin" size={16} />{t('hero_trust_location')}</li>
            <li><Icon name="search" size={16} />{t('hero_trust_photo')}</li>
            <li><Icon name="message" size={16} />{t('hero_trust_direct')}</li>
          </ul>
        </div>

        <div className="hero-preview" aria-hidden="true">
          <div className="preview-map">
            <svg viewBox="0 0 480 240" preserveAspectRatio="xMidYMid slice" focusable="false">
              <path className="map-green" d="M0 0h136L82 87 0 75Zm353 151 127-36v125H324Z" />
              <path className="map-water" d="M-24 208c98 32 144-55 235-43s133 15 210-18l80-38" />
              <g className="map-streets">
                <path d="m-24 115 128-18 95 17 141-61 167-6M-24 149l136-18 94 20 158-68 144-6M18 257l107-95L216-16M91 248l71-75 86-189M249 254l33-95 80-179M327 254l24-87 92-188M81 43l90 18 90-17M213 115l74 23 126 37 91-31M246 222l97-28 104 10 61-28" />
              </g>
              <path className="map-route" d="m125 162 47-73 32 9 55 10" />
              <circle cx="125" cy="162" r="5" className="map-origin" />
            </svg>
            <span className="preview-label">{t('hero_preview_label')}</span>
            <span className="map-pin"><BrandMark size={32} /></span>
          </div>
          <div className="preview-details">
            <div>
              <p className="preview-title">{t('type_dog')}</p>
              <p className="preview-breed">{t('hero_preview_breed')}</p>
            </div>
            <p className="preview-location">
              <Icon name="pin" size={16} />{t('hero_preview_location')}
            </p>
          </div>
        </div>
      </section>

      <section className="how" aria-labelledby="how-heading">
        <h2 id="how-heading" className="how-title">{t('how_it_works')}</h2>
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
          {services.map(({ href, icon, title, description }) => (
            <Link key={href} href={href} className="service-card">
              <div className="service-heading">
                <Icon name={icon} size={18} />
                <h3>{t(title)}</h3>
                <Icon name="arrowRight" size={16} />
              </div>
              <p className="service-desc">{t(description)}</p>
            </Link>
          ))}
        </div>
      </section>

      <style jsx>{`
        .home {
          --home-action: #4a3de0;
          --home-action-hover: #3c32bd;
          --home-link: var(--home-action);
        }
        :global([data-theme="dark"]) .home { --home-link: var(--primary-light); }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(0, 1fr);
          align-items: center;
          gap: clamp(24px, 5vw, 64px);
          padding: clamp(24px, 4vw, 56px) 0 clamp(32px, 5vw, 64px);
        }
        .hero-kicker {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          color: var(--text-secondary);
          font-size: var(--text-sm);
        }
        .hero-title {
          margin-bottom: 16px;
          font-size: clamp(2.125rem, 4.3vw, 3.75rem);
          line-height: 1.08;
          font-weight: 700;
          letter-spacing: -0.025em;
          text-wrap: balance;
        }
        .hero-desc {
          max-width: 34rem;
          margin-bottom: 24px;
          color: var(--text-secondary);
          font-size: clamp(1rem, 1.5vw, 1.125rem);
          line-height: 1.6;
        }
        .hero-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .hero-actions :global(.btn-base) {
          min-height: max(48px, var(--touch-target));
          padding: 8px 12px;
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          background: var(--surface-2);
          color: var(--text-primary);
          box-shadow: none;
          transition: background-color var(--dur-fast) var(--ease-out);
        }
        .hero-actions :global([data-variant="primary"]) {
          background: var(--home-action);
          color: #fff;
          border-color: transparent;
        }
        .hero-actions :global(.hero-search) {
          background: transparent;
          border-color: transparent;
          color: var(--home-link);
        }
        .how-guide {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: var(--touch-target);
          margin-top: 8px;
          padding: 4px 0;
          text-align: start;
          color: var(--home-link);
          background: transparent;
          border: 0;
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
        }
        .how-guide :global(svg), .hero-trust :global(svg), .preview-location :global(svg) { flex: none; }
        .hero-trust {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 16px;
          margin: 12px 0 0;
          padding: 0;
          list-style: none;
          color: var(--text-secondary);
          font-size: var(--text-xs);
        }
        .hero-trust li { display: flex; align-items: center; gap: 8px; }

        .hero-preview {
          min-width: 0;
          overflow: hidden;
          border: 1px solid var(--border-subtle);
          border-radius: 20px;
          background: var(--surface-2);
        }
        .preview-map {
          position: relative;
          height: clamp(168px, 22vw, 264px);
          overflow: hidden;
          background: var(--surface-3);
        }
        .preview-map > svg { display: block; width: 100%; height: 100%; }
        .map-green { fill: color-mix(in srgb, #6a946c 21%, var(--surface-3)); }
        .map-water { fill: none; stroke: color-mix(in srgb, #60a1c3 24%, var(--surface-3)); stroke-width: 22; }
        .map-streets { fill: none; stroke: var(--surface-2); stroke-width: 5; }
        .map-route {
          fill: none;
          stroke: var(--home-link);
          stroke-width: 3;
          stroke-dasharray: 2 7;
          stroke-linecap: round;
        }
        .map-origin { fill: var(--surface-2); stroke: var(--home-link); stroke-width: 2; }
        .preview-label {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 4px 8px;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--surface-2);
          color: var(--text-secondary);
          font-size: var(--text-xs);
        }
        .map-pin {
          position: absolute;
          bottom: 55%;
          left: 54%;
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          transform: translateX(-50%);
          border: 2px solid var(--home-link);
          border-radius: 50%;
          background: var(--surface-2);
          box-shadow: var(--shadow-sm);
        }
        .map-pin::after {
          position: absolute;
          top: calc(100% - 1px);
          content: '';
          border: 6px solid transparent;
          border-top: 8px solid var(--home-link);
        }
        .preview-details {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px 16px;
          padding: 16px 20px;
        }
        .preview-title { font-size: var(--text-base); font-weight: 600; }
        .preview-breed, .preview-location { font-size: var(--text-xs); color: var(--text-secondary); }
        .preview-location { display: flex; align-items: center; gap: 8px; }
        .preview-location :global(svg) { color: var(--home-link); }

        .how, .services {
          padding: clamp(24px, 4vw, 56px) 0;
          border-top: 1px solid var(--border-subtle);
        }
        .how-title, .services-title {
          margin-bottom: 20px;
          font-size: clamp(1.375rem, 2.4vw, 1.875rem);
          font-weight: 600;
        }
        .steps-grid, .services-grid {
          display: grid;
          gap: 12px;
        }
        .steps-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .step-card {
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          align-content: start;
          gap: 4px 12px;
          padding: 16px;
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          background: var(--surface-2);
        }
        .step-num {
          grid-row: span 2;
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: color-mix(in srgb, var(--primary) 10%, var(--surface-2));
          color: var(--home-link);
          font-size: var(--text-xs);
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }
        .step-title, .service-heading h3 { margin: 0; font-size: var(--text-base); font-weight: 600; }
        .step-desc, .service-desc { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); line-height: 1.5; }

        .services-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .services-grid :global(.service-card) {
          display: grid;
          align-content: start;
          gap: 8px;
          min-width: 0;
          padding: 16px;
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          background: var(--surface-2);
          color: var(--text-primary);
          transition: background-color var(--dur-fast) var(--ease-out);
        }
        .service-heading {
          display: grid;
          grid-template-columns: 18px minmax(0, 1fr) 16px;
          align-items: center;
          gap: 8px;
        }
        .service-heading :global(svg) { color: var(--text-secondary); }

        @media (hover: hover) and (pointer: fine) {
          .hero-actions :global(.btn-base:hover), .services-grid :global(.service-card:hover) { background: var(--surface-3); box-shadow: none; }
          .hero-actions :global([data-variant="primary"]:hover) { background: var(--home-action-hover); }
          .how-guide:hover { text-decoration: underline; }
        }
        @media (max-width: 1100px) {
          .services-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 860px) {
          .hero { grid-template-columns: minmax(0, 1fr); }
          .hero-preview { width: 100%; max-width: 32rem; }
        }
        @media (max-width: 720px) {
          .steps-grid { grid-template-columns: minmax(0, 1fr); }
        }
        @media (max-width: 600px) {
          .services-grid { grid-template-columns: minmax(0, 1fr); }
        }
        @media (max-width: 480px) {
          .hero-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .hero-actions :global([data-variant="primary"]) { grid-column: 1 / -1; }
          .hero-actions :global(.btn-base) { font-size: var(--text-sm); }
          .hero-trust { column-gap: 12px; }
          .preview-details { padding: 12px 16px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-actions :global(.btn-base), .services-grid :global(.service-card) { transition: none; }
        }
      `}</style>
    </div>
  );
}
