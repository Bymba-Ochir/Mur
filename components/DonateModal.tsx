'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useToast } from './Toast';
import { useLanguage } from '../lib/i18n';
import { fireConfetti } from '../lib/confetti';
import { getErrorMessage } from '../lib/utils';
import Modal from './ui/Modal';
import FieldHint from './ui/FieldHint';

const AMOUNTS = [3000, 5000, 10000, 20000];

type DonationStage = 'form' | 'loading' | 'qr' | 'paid' | 'error';

interface DonationInvoice {
  donationId: string;
  statusToken: string;
  qrImage: string;
  deepLinks?: { name: string; link: string; logo?: string; description: string }[];
}

export default function DonateModal({ onClose }: { onClose: () => void }) {
  const showToast = useToast();
  const { t } = useLanguage();
  const [amount, setAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [stage, setStage] = useState<DonationStage>('form');
  const [invoice, setInvoice] = useState<DonationInvoice | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const finalAmount = customAmount ? parseInt(customAmount, 10) : amount;

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!finalAmount || finalAmount < 1000) {
      showToast(t('donate_min_error'), 'error');
      return;
    }
    setStage('loading');
    try {
      const res = await fetch('/api/donations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          supporterName: name || undefined,
          message: message || undefined,
          isAnonymous: anonymous,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('donate_generic_error'));

      setInvoice(data);
      setStage('qr');

      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/donations/status?donationId=${data.donationId}&statusToken=${data.statusToken}`);
          const s = await r.json();
          if (s.status === 'paid') {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            setStage('paid');
            fireConfetti();
          }
        } catch {
          // polling алдааг үл тоомсорлоно
        }
      }, 3000);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
      setStage('error');
    }
  }

  return (
    <Modal open onClose={onClose} title={t('donate_title')} closeLabel={t('donate_close')} width="sm" panelClassName="donate-modal">

        {stage === 'form' && (
          <form onSubmit={handleCreate} className="[&_label]:mt-2.5 [&_label]:mb-1 [&_label]:block [&_label]:text-[12.5px] [&_label]:font-semibold [&_label]:text-[var(--primary)] [&_input:not([type='checkbox'])]:w-full [&_input:not([type='checkbox'])]:rounded-[var(--r-sm)] [&_input:not([type='checkbox'])]:border-[1.5px] [&_input:not([type='checkbox'])]:border-[var(--line)] [&_input:not([type='checkbox'])]:bg-[var(--card)] [&_input:not([type='checkbox'])]:px-[var(--sp-3)] [&_input:not([type='checkbox'])]:py-[var(--sp-2)] [&_input:not([type='checkbox'])]:font-[family-name:inherit] [&_input:not([type='checkbox'])]:text-[length:var(--text-base)] [&_input:not([type='checkbox'])]:text-[var(--ink)] [&_textarea]:w-full [&_textarea]:rounded-[var(--r-sm)] [&_textarea]:border-[1.5px] [&_textarea]:border-[var(--line)] [&_textarea]:bg-[var(--card)] [&_textarea]:px-[var(--sp-3)] [&_textarea]:py-[var(--sp-2)] [&_textarea]:font-[family-name:inherit] [&_textarea]:text-[length:var(--text-base)] [&_textarea]:text-[var(--ink)]">
            <p className="mb-3 text-[12.5px] text-[var(--muted)]">{t('donate_intro')}</p>

            <div className="mb-2.5 grid grid-cols-2 gap-2" role="group" aria-label={t('donate_custom_label')}>
              {AMOUNTS.map((a) => (
                <button
                  type="button" key={a}
                  className={`cursor-pointer rounded-[var(--r-sm)] border-[1.5px] p-2.5 font-[family-name:var(--font-body)] font-semibold transition-all hover:border-[var(--accent)] ${amount === a && !customAmount ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]' : 'border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]'}`}
                  onClick={() => { setAmount(a); setCustomAmount(''); }}
                >
                  {a.toLocaleString()}₮
                </button>
              ))}
            </div>
            <label htmlFor="custom-amount">{t('donate_custom_label')}</label>
            <FieldHint mn="Бэлэн дүн сонгох эсвэл 1,000₮-өөс дээш өөр дүн оруулна." en="Choose a preset amount or enter a custom amount of at least 1,000 MNT." />
            <input
              id="custom-amount" type="number" min="1000" placeholder={t('donate_custom_ph')}
              value={customAmount} onChange={(e) => setCustomAmount(e.target.value)}
            />

            <label htmlFor="donor-name">{t('donate_name_label')}</label>
            <FieldHint mn="Хандивлагчийн нэрийг харуулахыг хүсвэл бичнэ. Заавал биш." en="Enter a display name if you want it shown. Optional." />
            <input id="donor-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('donate_name_ph')} />

            <label htmlFor="donor-message">{t('donate_message_label')}</label>
            <FieldHint mn="Олон нийтэд харуулах богино мессеж. Хувийн мэдээлэл битгий оруулаарай." en="A short public message. Do not include private information." />
            <textarea id="donor-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder={t('donate_message_ph')} />

            <label className="flex items-center gap-2 font-normal text-[var(--ink)]">
              <input className="w-auto" type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              {t('donate_anonymous')}
            </label>

            <button type="submit" className="mt-4 w-full cursor-pointer rounded-[var(--r-md)] border-0 bg-[var(--grad-brand)] p-[13px] font-[family-name:var(--font-body)] text-sm font-bold text-[var(--text-on-accent)] shadow-[var(--shadow-sm)] transition-[transform,box-shadow,filter] hover:-translate-y-px hover:saturate-[1.08] hover:shadow-[var(--shadow-md)] focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">{t('donate_pay_btn')}</button>
          </form>
        )}

        {stage === 'loading' && <p role="status">{t('donate_generating')}</p>}

        {stage === 'qr' && invoice && (
          <div className="text-center">
            <p>{finalAmount.toLocaleString()}₮ {t('donate_invoice_created')}</p>
            <Image src={invoice.qrImage} alt={t('donate_qr_alt')} className="mx-auto my-2.5 size-[200px] rounded-[var(--r-sm)] border border-[var(--line)]" width={240} height={240} unoptimized />
            <p className="mb-3 text-[12.5px] text-[var(--muted)]">{t('donate_scan_hint')}</p>
            {invoice.deepLinks && invoice.deepLinks.length > 0 && (
              <div className="my-2.5 flex flex-wrap justify-center gap-2">
                {invoice.deepLinks.slice(0, 4).map((l) => (
                  <a key={l.name} href={l.link} className="flex items-center gap-1 rounded-[var(--r-sm)] bg-[var(--eyebrow-bg)] px-2.5 py-[5px] text-[11.5px] text-[var(--primary)] no-underline [&_img]:size-4 [&_img]:rounded-[var(--r-sm)]">
                    {l.logo && <Image src={l.logo} alt="" aria-hidden="true" width={28} height={28} unoptimized />}
                    {l.description}
                  </a>
                ))}
              </div>
            )}
            <p className="mb-3 text-[12.5px] text-[var(--muted)]" role="status" aria-live="polite">{t('donate_checking')}</p>
          </div>
        )}

        {stage === 'paid' && (
          <div className="pop-in text-center" role="status">
            <div className="mb-2 flex justify-center text-[var(--success)]" aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                <circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" />
              </svg>
            </div>
            <p className="font-bold text-[var(--success)]">{t('donate_thanks')}</p>
            <p className="mb-3 text-[12.5px] text-[var(--muted)]">{finalAmount.toLocaleString()}₮ {t('donate_paid_hint')}</p>
            <button className="mt-4 w-full cursor-pointer rounded-[var(--r-md)] border-0 bg-[var(--grad-brand)] p-[13px] font-[family-name:var(--font-body)] text-sm font-bold text-[var(--text-on-accent)] shadow-[var(--shadow-sm)]" onClick={onClose}>{t('donate_close')}</button>
          </div>
        )}

        {stage === 'error' && (
          <div>
            <p role="alert" className="text-[var(--alert)]">{errorMsg}</p>
            <button className="mt-4 w-full cursor-pointer rounded-[var(--r-md)] border-0 bg-[var(--grad-brand)] p-[13px] font-[family-name:var(--font-body)] text-sm font-bold text-[var(--text-on-accent)] shadow-[var(--shadow-sm)]" onClick={() => setStage('form')}>{t('donate_retry')}</button>
          </div>
        )}
    </Modal>
  );
}
