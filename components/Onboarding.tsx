'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DISTRICTS } from '../lib/districts';
import { useLanguage } from '../lib/i18n';
import { setLocalStorageValue, useLocalStorageValue } from '../lib/useLocalStorageState';
import { Check } from 'lucide-react';

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
    <div className="fixed inset-0 z-500 grid place-items-center bg-[var(--overlay)] p-5 backdrop-blur-lg max-[560px]:items-end max-[560px]:p-0" role="dialog" aria-modal="true" aria-labelledby="onb-title" onClick={close}>
      <div className="max-h-[min(760px,calc(100dvh-32px))] w-[min(100%,570px)] overflow-y-auto rounded-[var(--r-xl)] border border-[var(--border-subtle)] bg-[var(--card)] p-7 shadow-[var(--shadow-lift)] max-[560px]:max-h-[92dvh] max-[560px]:rounded-t-3xl max-[560px]:rounded-b-none max-[560px]:px-[18px] max-[560px]:pt-[22px] max-[560px]:pb-[calc(18px+env(safe-area-inset-bottom))]" onClick={(event) => event.stopPropagation()}>
        <div className="mb-[22px] flex items-center justify-between">
          <div className="flex max-w-[180px] flex-1 gap-[7px]" aria-label={`${step + 1} / 3`}>
            {[0, 1, 2].map((item) => <span key={item} className={`h-[5px] w-full rounded-full ${item <= step ? 'bg-[var(--primary)]' : 'bg-[var(--surface-3)]'}`} />)}
          </div>
          <button className="size-[38px] cursor-pointer rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[26px] leading-none text-[var(--text-secondary)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]" type="button" onClick={close} aria-label={en ? 'Close' : 'Хаах'}>×</button>
        </div>

        {step === 0 && <>
          <span className="mb-2 block font-[family-name:var(--font-mono)] text-xs font-bold tracking-[0.08em] text-[var(--primary)]">{en ? 'WELCOME TO МӨР' : 'МӨР-Т ТАВТАЙ МОРИЛ'}</span>
          <h2 className="m-0 font-[family-name:var(--font-display)] text-[clamp(1.45rem,4vw,2rem)] leading-[1.2] text-[var(--text-primary)]" id="onb-title">{en ? 'What would you like to do?' : 'Та юу хийх вэ?'}</h2>
          <p className="mt-2.5 mb-[22px] text-sm leading-[1.6] text-[var(--text-secondary)]">{en ? 'Choose one to open the right section immediately.' : 'Танд хэрэгтэй хэсгийг шууд нээхийн тулд нэгийг сонгоно уу.'}</p>
          <div className="grid grid-cols-2 gap-2.5 max-[560px]:grid-cols-1">
            {choices.map((choice) => (
              <button key={choice.id} type="button" className={`relative flex min-h-[82px] cursor-pointer items-center gap-3 rounded-[var(--r-md)] border bg-[var(--surface-2)] p-3.5 text-left text-[var(--text-primary)] transition duration-200 hover:-translate-y-px hover:border-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_9%,var(--surface-2))] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] max-[560px]:min-h-[70px] ${intent === choice.id ? '-translate-y-px border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_9%,var(--surface-2))]' : 'border-[var(--border-subtle)]'}`} onClick={() => setIntent(choice.id)}>
                <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]"><Icon name={choice.id} /></span>
                <span><strong className="block text-sm">{choice.title}</strong><small className="mt-1 block text-[11px] leading-[1.35] text-[var(--text-secondary)]">{choice.text}</small></span>
                <span className={`absolute top-2 right-2.5 text-[var(--primary)] transition-opacity ${intent === choice.id ? 'opacity-100' : 'opacity-0'}`}><Check size={17} aria-hidden="true" /></span>
              </button>
            ))}
          </div>
        </>}

        {step === 1 && <div className="px-3 py-2 text-center">
          <span className="mx-auto mb-[18px] grid size-16 place-items-center rounded-[20px] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)] [&>svg]:size-[30px]"><Icon name="location" /></span>
          <h2 className="m-0 font-[family-name:var(--font-display)] text-[clamp(1.45rem,4vw,2rem)] leading-[1.2] text-[var(--text-primary)]" id="onb-title">{en ? 'Choose your district' : 'Байршлаа сонгоно уу'}</h2>
          <p className="mt-2.5 mb-[22px] text-sm leading-[1.6] text-[var(--text-secondary)]">{en ? 'We will use it as the default filter. You can change it later.' : 'Жагсаалтыг энэ дүүргээр анхлан шүүнэ. Дараа нь хүссэн үедээ сольж болно.'}</p>
          <label className="mb-[7px] block text-left text-xs font-bold text-[var(--text-secondary)]" htmlFor="onboarding-district">{en ? 'District' : 'Дүүрэг'}</label>
          <select className="h-[52px] w-full rounded-[var(--r-md)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3.5 font-[family-name:inherit] text-[var(--text-primary)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]" id="onboarding-district" value={district} onChange={(event) => setDistrict(event.target.value)}>
            <option value="">{en ? 'Choose later' : 'Дараа сонгох'}</option>
            {DISTRICTS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>}

        {step === 2 && <div className="px-3 py-2 text-center">
          <span className="mx-auto mb-[18px] grid size-16 place-items-center rounded-[20px] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)] [&>svg]:size-[30px]"><Icon name="bell" /></span>
          <h2 className="m-0 font-[family-name:var(--font-display)] text-[clamp(1.45rem,4vw,2rem)] leading-[1.2] text-[var(--text-primary)]" id="onb-title">{en ? 'Do not miss a match' : 'Шинэ тохирлыг бүү алдаарай'}</h2>
          <p className="mt-2.5 mb-[22px] text-sm leading-[1.6] text-[var(--text-secondary)]">{en ? 'Allow notifications for new matches, messages, and vaccine reminders.' : 'Шинэ тохирол, зурвас болон вакцины сануулга ирэхэд мэдэгдэл аваарай.'}</p>
          <button type="button" className={`flex w-full cursor-pointer items-center gap-3.5 rounded-[var(--r-md)] border bg-[var(--surface-2)] p-4 text-left text-[var(--text-primary)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] [&>svg]:shrink-0 [&>svg]:text-[var(--primary)] ${notifications ? 'border-[var(--success)]' : 'border-[var(--border-subtle)]'}`} onClick={enableNotifications}>
            <Icon name="bell" />
            <span><strong className="block text-sm">{notifications ? (en ? 'Notifications enabled' : 'Мэдэгдэл идэвхтэй') : (en ? 'Enable notifications' : 'Мэдэгдэл идэвхжүүлэх')}</strong><small className="mt-1 block text-[11px] leading-[1.35] text-[var(--text-secondary)]">{en ? 'You can turn this off in your browser.' : 'Browser-ын тохиргооноос хүссэн үедээ унтрааж болно.'}</small></span>
          </button>
          <p className="mt-3.5 mb-0 text-[11px] text-[var(--text-tertiary)]">{en ? 'МӨР only sends service-related notifications.' : 'МӨР зөвхөн үйлчилгээтэй холбоотой хэрэгтэй мэдэгдэл илгээнэ.'}</p>
        </div>}

        <div className="mt-6 grid grid-cols-[1fr_1.5fr] gap-2.5 border-t border-[var(--border-subtle)] pt-5">
          {step > 0 ? <button className="min-h-12 cursor-pointer rounded-[var(--r-md)] border border-[var(--border-subtle)] bg-transparent font-bold text-[var(--text-secondary)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]" type="button" onClick={() => setStep(step - 1)}>{en ? 'Back' : 'Буцах'}</button> : <button className="min-h-12 cursor-pointer rounded-[var(--r-md)] border border-[var(--border-subtle)] bg-transparent font-bold text-[var(--text-secondary)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]" type="button" onClick={close}>{en ? 'Skip' : 'Алгасах'}</button>}
          <button className="min-h-12 cursor-pointer rounded-[var(--r-md)] border-0 bg-[var(--primary)] font-bold text-[var(--text-on-accent)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] disabled:cursor-not-allowed disabled:opacity-45" type="button" disabled={step === 0 && !intent} onClick={() => step === 2 ? finish() : setStep(step + 1)}>
            {step === 2 ? (en ? 'Start' : 'Эхлэх') : (en ? 'Continue' : 'Үргэлжлүүлэх')}
          </button>
        </div>
      </div>

    </div>
  );
}
