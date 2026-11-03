'use client';
import { useState } from 'react';
import DonateModal from './DonateModal';
import { useLanguage } from '../lib/i18n';
import Icon from './ui/icons';

export default function DonateButton({ compactOnDesktop = false }: { compactOnDesktop?: boolean }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const label = t('donate_btn');
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`donate-btn${compactOnDesktop ? ' donate-compact' : ''}`}
        aria-label={label} aria-haspopup="dialog" title={label}>
        <span className="donate-icon"><Icon name="heart" size={17} /></span>
        <span className="donate-label">{label}</span>
      </button>
      {open && <DonateModal onClose={() => setOpen(false)} />}
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
        .donate-icon { display: none; }
        @media (min-width: 1041px) and (max-width: 1280px) {
          .donate-compact { width: 44px; min-height: 44px; padding: 0; }
          .donate-compact .donate-label { display: none; }
          .donate-compact .donate-icon { display: inline-flex; }
        }
      `}</style>
    </>
  );
}
