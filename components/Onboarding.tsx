'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { DISTRICTS, type District } from '../lib/districts';
import { useLanguage } from '../lib/i18n';
import UiIcon, { type IconName } from './ui/icons';

const OPEN_EVENT = 'mur:open-onboarding';
type Intent = 'lost' | 'found' | 'adopt' | 'browse';

const intentRoutes: Record<Intent, string> = {
  lost: '/report-lost', found: '/report-found', adopt: '/adoptions', browse: '/listings',
};

const guideIcons: Record<Intent, IconName> = {
  lost: 'alert', found: 'eye', adopt: 'heart', browse: 'search',
};

const intents = ['lost', 'found', 'browse', 'adopt'] as const;
const overview = [
  { icon: 'pin', text: 'onb_overview_post' },
  { icon: 'search', text: 'onb_overview_search' },
  { icon: 'eye', text: 'onb_overview_help' },
] as const;
const TOTAL_STEPS = 3;

export default function Onboarding() {
  const router = useRouter();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const [manualRoute, setManualRoute] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [district, setDistrict] = useState<District | ''>('');
  const visible = manualRoute === pathname;
  const needsDistrict = intent === 'browse' || intent === 'adopt';

  useEffect(() => {
    const open = () => { setStep(0); setIntent(null); setDistrict(''); setManualRoute(pathname); };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, [pathname]);

  useEffect(() => {
    if (!visible) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), select, input, a[href]') ?? []);
      const first = nodes[0], last = nodes.at(-1);
      if (!first || !last) return;
      if (!nodes.includes(document.activeElement as HTMLElement)) {
        event.preventDefault(); (event.shiftKey ? last : first).focus(); return;
      }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', trapFocus);
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setManualRoute(null);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('keydown', trapFocus);
      previousFocus?.focus();
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const frame = requestAnimationFrame(() => {
      if (!dialogRef.current) return;
      dialogRef.current.scrollTop = 0;
      dialogRef.current.querySelector<HTMLElement>('#onb-title')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [visible, step]);

  function close() {
    setManualRoute(null);
  }

  function advance() {
    if (step < TOTAL_STEPS - 1) { setStep(step + 1); return; }
    if (!intent) return;
    const params = new URLSearchParams();
    if (needsDistrict && DISTRICTS.includes(district as District)) params.set('district', district);
    const destination = intentRoutes[intent] + (params.size ? '?' + params.toString() : '');
    close();
    router.push(destination);
  }

  if (!visible) return null;

  const nextLabel = step === 0 ? t('onb_start') : step === 1 ? t('onb_continue')
    : t(needsDistrict ? 'onb_view_listings' : 'onb_open_form');

  return (
    <div className="onb-overlay" role="dialog" aria-modal="true" aria-labelledby="onb-title" aria-describedby="onb-description" onClick={close}>
      <div ref={dialogRef} className="onb-card" onClick={(event) => event.stopPropagation()}>
        <div className="onb-top">
          <div className="onb-progress-wrap">
            <span className="onb-step-label" aria-hidden="true">{t('onb_step')} {step + 1} / {TOTAL_STEPS}</span>
            <div className="onb-progress" role="progressbar" aria-label={t('onb_progress')} aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step + 1}>
              {Array.from({ length: TOTAL_STEPS }, (_, item) => <span key={item} className={item <= step ? 'active' : ''} />)}
            </div>
          </div>
          <button className="onb-close" type="button" onClick={close} aria-label={t('close')}>×</button>
        </div>

        {step === 0 && <>
          <h2 id="onb-title" tabIndex={-1}>{t('onb_welcome_title')}</h2>
          <p className="onb-lead" id="onb-description">{t('onb_welcome_desc')}</p>
          <ul className="onb-overview">
            {overview.map(({ icon, text }) => (
              <li key={text}>
                <span className="choice-icon" aria-hidden="true"><UiIcon name={icon} size={20} /></span>
                <span>{t(text)}</span>
              </li>
            ))}
          </ul>
        </>}

        {step === 1 && <>
          <h2 id="onb-title" tabIndex={-1}>{t('onb_choose_title')}</h2>
          <p className="onb-lead" id="onb-description">{t('onb_choose_desc')}</p>
          <div className="onb-choices">
            {intents.map((item) => (
              <button key={item} type="button" aria-pressed={intent === item} className={intent === item ? 'selected' : ''} onClick={() => setIntent(item)}>
                <span className="choice-icon" aria-hidden="true"><UiIcon name={guideIcons[item]} size={24} /></span>
                <span><strong>{t(`onb_${item}_choice`)}</strong><small>{t(`onb_${item}_summary`)}</small></span>
                <span className="choice-check" aria-hidden="true"><UiIcon name="check" size={15} /></span>
              </button>
            ))}
          </div>
        </>}

        {step === 2 && intent && <>
          <span className="large-icon" aria-hidden="true"><UiIcon name={guideIcons[intent]} size={30} /></span>
          <h2 id="onb-title" tabIndex={-1}>{t(`onb_${intent}_title`)}</h2>
          <p className="onb-lead" id="onb-description">{t(`onb_${intent}_next`)}</p>
          {needsDistrict && <>
            <label htmlFor="onboarding-district">{t('onb_district')}</label>
            <select id="onboarding-district" value={district} onChange={(event) => setDistrict(event.target.value as District | '')}>
              <option value="">{t('filter_all_districts')}</option>
              {DISTRICTS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </>}
        </>}

        <div className="onb-actions">
          {step > 0
            ? <button className="secondary" type="button" onClick={() => setStep(step - 1)}>{t('onb_back')}</button>
            : <button className="secondary" type="button" onClick={close}>{t('onb_skip')}</button>}
          <button className="primary" type="button" disabled={step === 1 && !intent} onClick={advance}>{nextLabel}</button>
        </div>
      </div>

      <style jsx>{`
        .onb-overlay { position: fixed; inset: 0; z-index: 500; display: grid; place-items: center; padding: 20px; background: var(--overlay); backdrop-filter: blur(8px); }
        .onb-card { width: min(100%, 570px); max-height: min(760px, calc(100dvh - 32px)); overflow-y: auto; padding: 28px; border: 1px solid var(--border-subtle); border-radius: var(--r-xl); background: var(--card); box-shadow: var(--shadow-lift); animation: onb-pop .22s var(--ease-out); }
        @keyframes onb-pop { from { opacity: 0; transform: translateY(12px) scale(.98); } }
        .onb-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
        .onb-progress-wrap { flex: 1; max-width: 180px; }
        .onb-step-label { display: block; margin-bottom: 7px; color: var(--text-secondary); font-size: var(--text-xs); font-weight: 600; }
        .onb-progress { display: flex; gap: 7px; }
        .onb-progress span { width: 100%; height: 5px; border-radius: 999px; background: var(--surface-3); }
        .onb-progress span.active { background: var(--primary); }
        .onb-close { width: var(--touch-target); height: var(--touch-target); border: 1px solid var(--border-subtle); border-radius: 50%; color: var(--text-secondary); background: var(--surface-2); font-size: 26px; line-height: 1; cursor: pointer; }
        h2 { margin: 0; color: var(--text-primary); font-family: var(--font-display); font-size: clamp(1.45rem, 4vw, 2rem); line-height: 1.2; }
        .onb-lead { margin: 10px 0 22px; color: var(--text-secondary); font-size: 14px; line-height: 1.6; }
        .onb-choices { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .onb-choices button { position: relative; display: flex; align-items: center; gap: 12px; min-height: 82px; padding: 14px; text-align: left; color: var(--text-primary); background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: var(--r-md); cursor: pointer; transition: .18s ease; }
        .onb-choices button:hover, .onb-choices button.selected { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 9%, var(--surface-2)); transform: translateY(-1px); }
        .choice-icon, .large-icon { display: grid; place-items: center; flex: 0 0 auto; width: 44px; height: 44px; border-radius: 14px; color: var(--primary); background: color-mix(in srgb, var(--primary) 12%, transparent); }
        strong, small { display: block; }
        strong { font-size: 14px; }
        small { margin-top: 4px; color: var(--text-secondary); font-size: 11px; line-height: 1.35; }
        .choice-check { position: absolute; top: 8px; right: 10px; color: var(--primary); opacity: 0; }
        .selected .choice-check { opacity: 1; }
        .onb-overview { display: grid; gap: 8px; list-style: none; margin: 0; padding: 0; }
        .onb-overview li { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: var(--surface-2); border-radius: var(--r-md); color: var(--text-primary); font-size: 14px; line-height: 1.45; }
        .large-icon { width: 56px; height: 56px; margin-bottom: 14px; border-radius: 18px; }
        label { display: block; margin: 0 0 7px; color: var(--text-secondary); font-size: 12px; font-weight: 700; text-align: left; }
        select { width: 100%; height: 52px; padding: 0 14px; color: var(--text-primary); background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: var(--r-md); font: inherit; }
        .onb-actions { display: grid; grid-template-columns: 1fr 1.5fr; gap: 10px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-subtle); }
        .onb-actions button { min-height: 48px; border-radius: var(--r-md); font-weight: 700; cursor: pointer; }
        .onb-actions .secondary { color: var(--text-secondary); background: transparent; border: 1px solid var(--border-subtle); }
        .onb-actions .primary { color: var(--text-on-accent); background: var(--primary); border: 0; }
        .onb-actions .primary:disabled { opacity: .45; cursor: not-allowed; }
        button:focus-visible, select:focus-visible { outline: 3px solid var(--border-focus); outline-offset: 2px; }
        @media (max-width: 560px) { .onb-overlay { align-items: end; padding: 0; } .onb-card { max-height: 92dvh; padding: 18px 16px calc(16px + var(--safe-bottom)); border-radius: 24px 24px 0 0; overscroll-behavior:contain; } .onb-top{margin-bottom:14px}.onb-lead{margin:8px 0 16px;line-height:1.5}.onb-choices { grid-template-columns: 1fr; gap:8px } .onb-choices button { min-height:64px;padding:10px 12px }.large-icon{width:54px;height:54px;margin-bottom:12px}.onb-actions{position:sticky;bottom:calc(-16px - var(--safe-bottom));margin:18px -16px 0;padding:12px 16px calc(12px + var(--safe-bottom));background:var(--card)} }
        @media (max-width: 370px) { .choice-icon{width:40px;height:40px}.onb-actions{grid-template-columns:1fr 1.25fr} }
        @media (prefers-reduced-motion: reduce) { .onb-card { animation: none; } }
      `}</style>
    </div>
  );
}
