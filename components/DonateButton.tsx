'use client';
import { useState } from 'react';
import DonateModal from './DonateModal';
import { useLanguage } from '../lib/i18n';

export default function DonateButton() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)} className="donate-btn inline-flex min-h-9 cursor-pointer items-center justify-center whitespace-nowrap rounded-[var(--r-pill)] border-0 bg-[image:var(--grad-accent)] px-4 py-2 text-[13px] font-bold text-[var(--accent-ink)] shadow-[var(--shadow-sm)] transition-[transform,box-shadow,filter] duration-200 hover:-translate-y-px hover:saturate-[1.08] hover:shadow-[var(--shadow-md)] focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">{t('donate_btn')}</button>{open && <DonateModal onClose={() => setOpen(false)} />}</>;
}
