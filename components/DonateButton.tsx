'use client';
import { useState } from 'react';
import DonateModal from './DonateModal';
import { useLanguage } from '../lib/i18n';
import Modal from './ui/Modal';
import Button from './ui/Button';

export interface BankTransfer { iban: string; bank: string; recipient: string }

export default function DonateButton({ bankTransfer }: { bankTransfer?: BankTransfer }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'copied' | 'failed' | null>(null);
  const close = () => { setOpen(false); setCopyStatus(null); };
  const label = t('donate_btn');
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)} aria-haspopup="dialog">{label}</Button>
      {open && (bankTransfer ? (
        <Modal open onClose={close} title={t('donate_title')} closeLabel={t('donate_close')} width="sm">
          <p>{t('donate_transfer_hint')}</p>
          <p>{bankTransfer.bank} · {bankTransfer.recipient}</p>
          <p><code>{bankTransfer.iban}</code></p>
          <button type="button" className="donate-btn" onClick={async () => {
            try {
              await navigator.clipboard.writeText(bankTransfer.iban);
              setCopyStatus('copied');
            } catch {
              setCopyStatus('failed');
            }
          }}>{t('donate_copy_iban')}</button>
          <p role="status">{copyStatus && t(copyStatus === 'copied' ? 'donate_iban_copied' : 'donate_copy_failed')}</p>
        </Modal>
      ) : <DonateModal onClose={close} />)}
      <style jsx>{`
        .donate-btn {
          background: var(--grad-accent);
          color: var(--accent-ink);
          border: none;
          padding: 8px 16px;
          border-radius: var(--r-pill);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;
          white-space: nowrap;
          min-height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .donate-btn:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
          filter: saturate(1.08);
        }
        .donate-btn:focus-visible {
          outline: 2.5px solid var(--accent);
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
}
