'use client';
import { useState } from 'react';
import DonateModal from './DonateModal';
import { useLanguage } from '../lib/i18n';

export default function DonateButton() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="donate-btn">
        {t('donate_btn')}
      </button>
      {open && <DonateModal onClose={() => setOpen(false)} />}
      <style jsx>{`
        .donate-btn {
          background: var(--grad-accent);
          color: #fff;
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
