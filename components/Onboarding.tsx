'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DISTRICTS } from '../lib/districts';
import { useLanguage } from '../lib/i18n';
import { setLocalStorageValue, useLocalStorageValue } from '../lib/useLocalStorageState';

const SEEN_KEY = 'mur-onboarding-v2-seen';
const OPEN_EVENT = 'mur:open-onboarding';
type Intent = 'lost' | 'found' | 'adopt' | 'browse';

const intentRoutes: Record<Intent, string> = {
  lost: '/report-lost', found: '/report-found', adopt: '/adoptions', browse: '/listings',
};

function Icon({ name }: { name: Intent | 'location' | 'bell' }) {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'lost') return <svg {...common}><path d="M12 9v4m0 4h.01"/><path d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/></svg>;
  if (name === 'found') return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4m-7-5 1.5 1.5L14 9"/></svg>;
  if (name === 'adopt') return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>;
  if (name === 'browse') return <svg {...common}><path d="M3 6h18M3 12h18M3 18h18"/><circle cx="7" cy="6" r="1" fill="currentColor"/><circle cx="16" cy="12" r="1" fill="currentColor"/><circle cx="10" cy="18" r="1" fill="currentColor"/></svg>;
  if (name === 'location') return <svg {...common}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>;
  return <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>;
}

export default function Onboarding() {
  const router = useRouter();
  const { lang } = useLanguage();
  const seen = useLocalStorageValue(SEEN_KEY, '1');
  const [manualOpen, setManualOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [district, setDistrict] = useState('');
  const [notifications, setNotifications] = useState(false);
  const visible = manualOpen || seen !== '1';
  const en = lang === 'en';

  useEffect(() => {
    const open = () => { setStep(0); setManualOpen(true); };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  function close() {
    setLocalStorageValue(SEEN_KEY, '1');
    setManualOpen(false);
  }

  async function enableNotifications() {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    const enabled = permission === 'granted';
    setNotifications(enabled);
    setLocalStorageValue('mur-notifications-preferred', enabled ? '1' : '0');
  }

  function finish() {
    if (district) setLocalStorageValue('mur-preferred-district', district);
    close();
    if (intent) router.push(intentRoutes[intent]);
  }

  if (!visible) return null;

  const choices: Array<{ id: Intent; title: string; text: string }> = en ? [
    { id: 'lost', title: 'I lost a pet', text: 'Create a lost-pet report' },
    { id: 'found', title: 'I found a pet', text: 'Help locate its owner' },
    { id: 'adopt', title: 'Adopt a pet', text: 'Browse adoption listings' },
    { id: 'browse', title: 'Browse listings', text: 'Search and filter reports' },
  ] : [
    { id: 'lost', title: 'Амьтнаа алдсан', text: 'Алдсан амьтны зар оруулах' },
    { id: 'found', title: 'Амьтан олсон', text: 'Эзнийг нь олоход туслах' },
    { id: 'adopt', title: 'Амьтан үрчлэх', text: 'Үрчлүүлэх заруудыг үзэх' },
    { id: 'browse', title: 'Зар хайх', text: 'Жагсаалтаас шүүж хайх' },
  ];

  return (
    <div className="onb-overlay" role="dialog" aria-modal="true" aria-labelledby="onb-title" onClick={close}>
      <div className="onb-card" onClick={(event) => event.stopPropagation()}>
        <div className="onb-top">
          <div className="onb-progress" aria-label={`${step + 1} / 3`}>
            {[0, 1, 2].map((item) => <span key={item} className={item <= step ? 'active' : ''} />)}
          </div>
          <button className="onb-close" type="button" onClick={close} aria-label={en ? 'Close' : 'Хаах'}>×</button>
        </div>

        {step === 0 && <>
          <span className="onb-kicker">{en ? 'WELCOME TO МӨР' : 'МӨР-Т ТАВТАЙ МОРИЛ'}</span>
          <h2 id="onb-title">{en ? 'What would you like to do?' : 'Та юу хийх вэ?'}</h2>
          <p className="onb-lead">{en ? 'Choose one to open the right section immediately.' : 'Танд хэрэгтэй хэсгийг шууд нээхийн тулд нэгийг сонгоно уу.'}</p>
          <div className="onb-choices">
            {choices.map((choice) => (
              <button key={choice.id} type="button" className={intent === choice.id ? 'selected' : ''} onClick={() => setIntent(choice.id)}>
                <span className="choice-icon"><Icon name={choice.id} /></span>
                <span><strong>{choice.title}</strong><small>{choice.text}</small></span>
                <span className="choice-check">✓</span>
              </button>
            ))}
          </div>
        </>}

        {step === 1 && <div className="onb-centered">
          <span className="large-icon"><Icon name="location" /></span>
          <h2 id="onb-title">{en ? 'Choose your district' : 'Байршлаа сонгоно уу'}</h2>
          <p className="onb-lead">{en ? 'We will use it as the default filter. You can change it later.' : 'Жагсаалтыг энэ дүүргээр анхлан шүүнэ. Дараа нь хүссэн үедээ сольж болно.'}</p>
          <label htmlFor="onboarding-district">{en ? 'District' : 'Дүүрэг'}</label>
          <select id="onboarding-district" value={district} onChange={(event) => setDistrict(event.target.value)}>
            <option value="">{en ? 'Choose later' : 'Дараа сонгох'}</option>
            {DISTRICTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>}

        {step === 2 && <div className="onb-centered">
          <span className="large-icon"><Icon name="bell" /></span>
          <h2 id="onb-title">{en ? 'Do not miss a match' : 'Шинэ тохирлыг бүү алдаарай'}</h2>
          <p className="onb-lead">{en ? 'Allow notifications for new matches, messages, and vaccine reminders.' : 'Шинэ тохирол, зурвас болон вакцины сануулга ирэхэд мэдэгдэл аваарай.'}</p>
          <button type="button" className={`notification-choice ${notifications ? 'enabled' : ''}`} onClick={enableNotifications}>
            <Icon name="bell" />
            <span><strong>{notifications ? (en ? 'Notifications enabled' : 'Мэдэгдэл идэвхтэй') : (en ? 'Enable notifications' : 'Мэдэгдэл идэвхжүүлэх')}</strong><small>{en ? 'You can turn this off in your browser.' : 'Browser-ын тохиргооноос хүссэн үедээ унтрааж болно.'}</small></span>
          </button>
          <p className="privacy-note">{en ? 'МӨР only sends service-related notifications.' : 'МӨР зөвхөн үйлчилгээтэй холбоотой хэрэгтэй мэдэгдэл илгээнэ.'}</p>
        </div>}

        <div className="onb-actions">
          {step > 0 ? <button className="secondary" type="button" onClick={() => setStep(step - 1)}>{en ? 'Back' : 'Буцах'}</button> : <button className="secondary" type="button" onClick={close}>{en ? 'Skip' : 'Алгасах'}</button>}
          <button className="primary" type="button" disabled={step === 0 && !intent} onClick={() => step === 2 ? finish() : setStep(step + 1)}>
            {step === 2 ? (en ? 'Start' : 'Эхлэх') : (en ? 'Continue' : 'Үргэлжлүүлэх')}
          </button>
        </div>
      </div>

      <style jsx>{`
        .onb-overlay { position: fixed; inset: 0; z-index: 500; display: grid; place-items: center; padding: 20px; background: var(--overlay); backdrop-filter: blur(8px); }
        .onb-card { width: min(100%, 570px); max-height: min(760px, calc(100dvh - 32px)); overflow-y: auto; padding: 28px; border: 1px solid var(--border-subtle); border-radius: var(--r-xl); background: var(--card); box-shadow: var(--shadow-lift); animation: onb-pop .22s var(--ease-out); }
        @keyframes onb-pop { from { opacity: 0; transform: translateY(12px) scale(.98); } }
        .onb-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
        .onb-progress { display: flex; gap: 7px; flex: 1; max-width: 180px; }
        .onb-progress span { width: 100%; height: 5px; border-radius: 999px; background: var(--surface-3); }
        .onb-progress span.active { background: var(--primary); }
        .onb-close { width: 38px; height: 38px; border: 1px solid var(--border-subtle); border-radius: 50%; color: var(--text-secondary); background: var(--surface-2); font-size: 26px; line-height: 1; cursor: pointer; }
        .onb-kicker { display: block; margin-bottom: 8px; color: var(--primary); font-family: var(--font-mono); font-size: 12px; font-weight: 700; letter-spacing: .08em; }
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
        .onb-centered { text-align: center; padding: 8px 12px; }
        .large-icon { width: 64px; height: 64px; margin: 0 auto 18px; border-radius: 20px; }
        .large-icon :global(svg) { width: 30px; height: 30px; }
        label { display: block; margin: 0 0 7px; color: var(--text-secondary); font-size: 12px; font-weight: 700; text-align: left; }
        select { width: 100%; height: 52px; padding: 0 14px; color: var(--text-primary); background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: var(--r-md); font: inherit; }
        .notification-choice { display: flex; align-items: center; gap: 14px; width: 100%; padding: 16px; color: var(--text-primary); text-align: left; background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: var(--r-md); cursor: pointer; }
        .notification-choice :global(svg) { color: var(--primary); flex: 0 0 auto; }
        .notification-choice.enabled { border-color: var(--success); }
        .privacy-note { margin: 14px 0 0; color: var(--text-tertiary); font-size: 11px; }
        .onb-actions { display: grid; grid-template-columns: 1fr 1.5fr; gap: 10px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-subtle); }
        .onb-actions button { min-height: 48px; border-radius: var(--r-md); font-weight: 700; cursor: pointer; }
        .onb-actions .secondary { color: var(--text-secondary); background: transparent; border: 1px solid var(--border-subtle); }
        .onb-actions .primary { color: var(--text-on-accent); background: var(--primary); border: 0; }
        .onb-actions .primary:disabled { opacity: .45; cursor: not-allowed; }
        button:focus-visible, select:focus-visible { outline: 3px solid var(--border-focus); outline-offset: 2px; }
        @media (max-width: 560px) { .onb-overlay { align-items: end; padding: 0; } .onb-card { max-height: 92dvh; padding: 22px 18px calc(18px + env(safe-area-inset-bottom)); border-radius: 24px 24px 0 0; } .onb-choices { grid-template-columns: 1fr; } .onb-choices button { min-height: 70px; } }
        @media (prefers-reduced-motion: reduce) { .onb-card { animation: none; } }
      `}</style>
    </div>
  );
}
