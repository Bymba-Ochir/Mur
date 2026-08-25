'use client';
import { useState } from 'react';
import { reportPet } from '../lib/petService';
import { useToast } from './Toast';
import { useLanguage } from '../lib/i18n';
import { getErrorMessage } from '../lib/utils';

const REASON_VALUES = ['Хуурамч мэдээлэл', 'Спам', 'Зохисгүй агуулга', 'Дахин нийтэлсэн', 'Бусад'];

export default function ReportButton({ petId }: { petId: string }) {
  const showToast = useToast();
  const { t } = useLanguage();
  const labels: Record<string, string> = {
    'Хуурамч мэдээлэл': t('report_reason_fake'), 'Спам': t('report_reason_spam'),
    'Зохисгүй агуулга': t('report_reason_inappropriate'), 'Дахин нийтэлсэн': t('report_reason_duplicate'), 'Бусад': t('report_reason_other'),
  };
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleReport(reason: string) {
    setBusy(true);
    try { await reportPet(petId, reason); setSent(true); }
    catch (err) { showToast('Алдаа гарлаа: ' + getErrorMessage(err), 'error'); }
    finally { setBusy(false); }
  }

  if (sent) return <p className="mt-[var(--sp-2)] text-xs text-[var(--muted)]">{t('report_thanks')}</p>;
  return (
    <div className="mt-[var(--sp-2)]">
      {!open ? <button onClick={() => setOpen(true)} className="cursor-pointer border-0 bg-transparent text-xs text-[var(--muted)] underline transition-colors duration-150 hover:text-[var(--alert)]">{t('report_btn')}</button> : (
        <div className="flex flex-wrap items-center gap-[var(--sp-1)]">
          <span className="text-xs text-[var(--muted)]">{t('report_reason_label')}</span>
          {REASON_VALUES.map((reason) => <button key={reason} disabled={busy} onClick={() => handleReport(reason)} className="cursor-pointer rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--card)] px-[9px] py-1 text-[11.5px] text-[var(--primary)] transition-[transform,border-color,background] duration-150 hover:border-[var(--accent)] hover:bg-[var(--eyebrow-bg)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60">{labels[reason]}</button>)}
        </div>
      )}
    </div>
  );
}
