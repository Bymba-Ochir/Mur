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
          background: var(--accent); color: var(--brand); border: none;
          padding: 6px 12px; border-radius: var(--r-sm); font-size: 13px; font-weight: 700; cursor: pointer;
        }
      `}</style>
    </>
  );
}
