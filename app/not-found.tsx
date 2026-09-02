'use client';

import Link from 'next/link';
import { useLanguage } from '../lib/i18n';
import Button from '../components/ui/Button';
import Icon, { type IconName } from '../components/ui/icons';

export default function NotFound() {
  const { t } = useLanguage();
  const routes: Array<{ href: string; label: string; icon: IconName; tone: string }> = [
    { href: '/listings', label: t('nf_listings'), icon: 'search', tone: 'indigo' },
    { href: '/report-lost', label: t('nf_report_lost'), icon: 'alert', tone: 'coral' },
    { href: '/report-found', label: t('nf_report_found'), icon: 'camera', tone: 'sky' },
  ];

  return (
    <section className="not-found page-shell" aria-labelledby="not-found-title">
      <div className="not-found-visual" aria-hidden="true">
        <span className="code-shadow">404</span>
        <div className="paw-orbit"><Icon name="paw" size={54} /></div>
      </div>

      <div className="not-found-copy">
        <p className="eyebrow">{t('nf_eyebrow')}</p>
        <p className="not-found-code" aria-label="404">404</p>
        <h1 id="not-found-title">{t('nf_title')}</h1>
        <p className="not-found-desc">{t('nf_desc')}</p>
        <Button as="link" href="/" variant="primary" size="lg"><Icon name="home" size={19} />{t('nf_home')}</Button>
      </div>

      <nav className="recovery-panel" aria-label={t('nf_actions_label')}>
        <header><span><Icon name="search" size={21} /></span><div><h2>{t('nf_help_title')}</h2><p>{t('nf_help_desc')}</p></div></header>
        <div className="recovery-grid">
          {routes.map((route) => (
            <Link key={route.href} href={route.href} className={`recovery-link tone-${route.tone}`}>
              <span><Icon name={route.icon} size={20} /></span>
              <strong>{route.label}</strong>
              <Icon name="arrowRight" size={17} />
            </Link>
          ))}
        </div>
      </nav>

      <style jsx>{`
        .not-found{display:grid;grid-template-columns:minmax(260px,.8fr) minmax(320px,1.2fr);align-items:center;gap:clamp(28px,6vw,76px);max-width:1040px;min-height:clamp(560px,72vh,760px);padding-block:var(--sp-5)}.not-found-visual{position:relative;display:grid;place-items:center;min-height:360px;overflow:hidden;border:1px solid var(--glass-border);border-radius:var(--r-xl);background:radial-gradient(circle at 50% 42%,color-mix(in srgb,var(--primary) 20%,var(--card)),var(--card) 64%);box-shadow:var(--shadow-md)}.code-shadow{position:absolute;color:color-mix(in srgb,var(--primary) 7%,transparent);font-family:var(--font-display);font-size:clamp(8rem,18vw,14rem);font-weight:900;letter-spacing:-.08em;line-height:1}.paw-orbit{position:relative;z-index:1;display:grid;place-items:center;width:132px;height:132px;border:1px solid color-mix(in srgb,var(--primary) 22%,transparent);border-radius:50%;color:var(--primary);background:var(--surface-2);box-shadow:0 0 0 24px color-mix(in srgb,var(--primary) 6%,transparent),var(--shadow-lg)}.paw-orbit:before,.paw-orbit:after{content:'';position:absolute;width:14px;height:14px;border-radius:50%;background:var(--alert);box-shadow:var(--shadow-sm)}.paw-orbit:before{top:-26px;right:2px}.paw-orbit:after{bottom:-20px;left:-8px;background:var(--found)}
        .not-found-copy .eyebrow{margin-bottom:var(--sp-2)}.not-found-code{margin:0;color:var(--alert);font-family:var(--font-mono);font-size:clamp(2.5rem,6vw,4rem);font-weight:800;letter-spacing:.06em}.not-found-copy h1{margin:var(--sp-1) 0 var(--sp-3);font-size:clamp(2rem,5vw,3.5rem)}.not-found-desc{max-width:540px;margin-bottom:var(--sp-4);color:var(--text-secondary);font-size:var(--text-base);line-height:1.7}.recovery-panel{grid-column:1/-1;padding:var(--sp-4);border:1px solid var(--border-subtle);border-radius:var(--r-xl);background:var(--card);box-shadow:var(--shadow-sm)}.recovery-panel header{display:flex;align-items:flex-start;gap:var(--sp-3);margin-bottom:var(--sp-4)}.recovery-panel header>span{display:grid;place-items:center;width:44px;height:44px;flex:0 0 44px;border-radius:var(--r-md);color:var(--primary);background:var(--eyebrow-bg)}.recovery-panel h2{margin:0 0 4px;font-size:var(--text-lg)}.recovery-panel header p{color:var(--text-secondary);font-size:var(--text-sm);line-height:1.5}.recovery-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--sp-3)}.recovery-link{--route-color:var(--primary);display:grid;grid-template-columns:38px minmax(0,1fr) auto;align-items:center;gap:10px;min-height:70px;padding:var(--sp-3);border:1px solid var(--border-subtle);border-radius:var(--r-lg);color:var(--text-primary);background:var(--surface-2);text-decoration:none;transition:transform var(--dur-fast),border-color var(--dur-fast),box-shadow var(--dur-fast)}.recovery-link>span{display:grid;place-items:center;width:38px;height:38px;border-radius:var(--r-md);color:var(--route-color);background:color-mix(in srgb,var(--route-color) 10%,transparent)}.recovery-link strong{font-size:var(--text-sm);line-height:1.4}.recovery-link> :global(svg:last-child){color:var(--text-tertiary)}.recovery-link:hover{transform:translateY(-2px);border-color:var(--route-color);box-shadow:var(--shadow-sm)}.recovery-link:focus-visible{outline:2.5px solid var(--border-focus);outline-offset:3px}.tone-coral{--route-color:var(--alert)}.tone-sky{--route-color:var(--found-deep)}
        @media(max-width:800px){.not-found{grid-template-columns:1fr;min-height:auto;gap:var(--sp-5)}.not-found-visual{min-height:260px}.not-found-copy{text-align:center}.not-found-desc{margin-inline:auto}.recovery-panel{grid-column:auto}.recovery-grid{grid-template-columns:1fr}}
        @media(max-width:520px){.not-found{padding-block:0}.not-found-visual{min-height:220px;margin-inline:calc(var(--page-pad) * -1);border-inline:0;border-radius:0}.paw-orbit{width:104px;height:104px}.not-found-copy h1{font-size:2rem}.not-found-desc{font-size:14px}.not-found-copy :global(.btn-base){width:100%}.recovery-panel{margin-inline:calc(var(--page-pad) * -1);padding:var(--sp-4) var(--page-pad);border-inline:0;border-radius:0}.recovery-link{min-height:64px}}
        @media(prefers-reduced-motion:reduce){.recovery-link{transition:none}.recovery-link:hover{transform:none}}
      `}</style>
    </section>
  );
}
