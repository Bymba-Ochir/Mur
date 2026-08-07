'use client';
import { useEffect, useRef, useState } from 'react';
import { useToast } from './Toast';
import { useLanguage } from '../lib/i18n';
import { fireConfetti } from '../lib/confetti';
import { getErrorMessage } from '../lib/utils';

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
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="donate-title">
        <button className="close" onClick={onClose} aria-label={t('donate_close')}>✕</button>
        <h2 id="donate-title">{t('donate_title')}</h2>

        {stage === 'form' && (
          <form onSubmit={handleCreate}>
            <p className="hint">{t('donate_intro')}</p>

            <div className="amounts" role="group" aria-label={t('donate_custom_label')}>
              {AMOUNTS.map((a) => (
                <button
                  type="button" key={a}
                  className={`amount-btn ${amount === a && !customAmount ? 'active' : ''}`}
                  onClick={() => { setAmount(a); setCustomAmount(''); }}
                >
                  {a.toLocaleString()}₮
                </button>
              ))}
            </div>
            <label htmlFor="custom-amount">{t('donate_custom_label')}</label>
            <input
              id="custom-amount" type="number" min="1000" placeholder={t('donate_custom_ph')}
              value={customAmount} onChange={(e) => setCustomAmount(e.target.value)}
            />

            <label htmlFor="donor-name">{t('donate_name_label')}</label>
            <input id="donor-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('donate_name_ph')} />

            <label htmlFor="donor-message">{t('donate_message_label')}</label>
            <textarea id="donor-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder={t('donate_message_ph')} />

            <label className="checkbox-row">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              {t('donate_anonymous')}
            </label>

            <button type="submit" className="submit-btn">{t('donate_pay_btn')}</button>
          </form>
        )}

        {stage === 'loading' && <p role="status">{t('donate_generating')}</p>}

        {stage === 'qr' && invoice && (
          <div className="qr-box">
            <p>{finalAmount.toLocaleString()}₮ {t('donate_invoice_created')}</p>
            <img src={invoice.qrImage} alt={t('donate_qr_alt')} className="qr-img" />
            <p className="hint">{t('donate_scan_hint')}</p>
            {invoice.deepLinks && invoice.deepLinks.length > 0 && (
              <div className="deep-links">
                {invoice.deepLinks.slice(0, 4).map((l) => (
                  <a key={l.name} href={l.link} className="deep-link">
                    {l.logo && <img src={l.logo} alt="" aria-hidden="true" />}
                    {l.description}
                  </a>
                ))}
              </div>
            )}
            <p className="hint" role="status" aria-live="polite">{t('donate_checking')}</p>
          </div>
        )}

        {stage === 'paid' && (
          <div className="paid-box pop-in" role="status">
            <div className="paid-icon" aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                <circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" />
              </svg>
            </div>
            <p style={{ fontWeight: 700, color: 'var(--success)' }}>{t('donate_thanks')}</p>
            <p className="hint">{finalAmount.toLocaleString()}₮ {t('donate_paid_hint')}</p>
            <button className="submit-btn" onClick={onClose}>{t('donate_close')}</button>
          </div>
        )}

        {stage === 'error' && (
          <div>
            <p role="alert" style={{ color: 'var(--alert)' }}>{errorMsg}</p>
            <button className="submit-btn" onClick={() => setStage('form')}>{t('donate_retry')}</button>
          </div>
        )}
      </div>

      <style jsx>{`
        .overlay {
          position: fixed; inset: 0; background: var(--overlay);
          display: flex; align-items: center; justify-content: center;
          z-index: 300; padding: 16px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal {
          background: var(--card); border-radius: var(--r-lg); padding: 24px;
          max-width: 360px; width: 100%; color: var(--ink); position: relative;
          max-height: 90vh; overflow-y: auto;
          animation: slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .close { position: absolute; top: 14px; right: 14px; background: none; border: none; font-size: 16px; cursor: pointer; color: var(--muted); }
        h2 { font-size: 18px; margin-bottom: 12px; }
        .hint { font-size: 12.5px; color: var(--muted); margin-bottom: 12px; }
        .amounts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
        .amount-btn { padding: 10px; border-radius: var(--r-sm); border: 1.5px solid var(--line); background: var(--bg); color: var(--ink); font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: all 0.15s ease; }
        .amount-btn:hover { border-color: var(--accent); }
        .amount-btn.active { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
        label { font-size: 12.5px; font-weight: 600; color: var(--primary); display: block; margin-top: 10px; margin-bottom: 4px; }
        input, textarea { width: 100%; padding: var(--sp-2) var(--sp-3); border: 1.5px solid var(--line); border-radius: var(--r-sm); font-size: var(--text-base); background: var(--card); color: var(--ink); font-family: inherit; }
        .checkbox-row { display: flex; align-items: center; gap: 8px; font-weight: 400; color: var(--ink); }
        .checkbox-row input { width: auto; }
        .submit-btn { width: 100%; margin-top: 16px; padding: 13px; border-radius: var(--r-md); border: none; background: var(--grad-brand); color: #fff; font-weight: 700; cursor: pointer; font-size: 14px; font-family: var(--font-body); transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease; box-shadow: var(--shadow-sm); }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: var(--shadow-md); filter: saturate(1.08); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .submit-btn:focus-visible { outline: 2.5px solid var(--accent); outline-offset: 2px; }
        .qr-box, .paid-box { text-align: center; }
        .paid-icon { display: flex; justify-content: center; margin-bottom: 8px; color: var(--success); }
        .qr-img { width: 200px; height: 200px; margin: 10px auto; border-radius: var(--r-sm); border: 1px solid var(--line); }
        .deep-links { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 10px 0; }
        .deep-link { display: flex; align-items: center; gap: 4px; font-size: 11.5px; background: var(--eyebrow-bg); color: var(--primary); padding: 5px 10px; border-radius: var(--r-sm); text-decoration: none; }
        .deep-link img { width: 16px; height: 16px; border-radius: var(--r-sm); }
      `}</style>
    </div>
  );
}
