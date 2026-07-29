'use client';
import { useState } from 'react';
import DonateModal from './DonateModal';

export default function DonateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="donate-btn">
        💛 Дэмжих
      </button>
      {open && <DonateModal onClose={() => setOpen(false)} />}
      <style jsx>{`
        .donate-btn {
          background: var(--accent); color: var(--brand); border: none;
          padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer;
        }
      `}</style>
    </>
  );
}
