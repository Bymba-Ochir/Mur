'use client';
import { useState } from 'react';
import { reportPet } from '../lib/petService';
import { useToast } from './Toast';
import { useLanguage } from '../lib/i18n';
import { getErrorMessage } from '../lib/utils';
import Icon from './ui/icons';

// Дотоод утга (DB-д хадгалагдах) Монгол хэвээр — admin dashboard-той нийцүүлнэ
const REASON_VALUES = ['Хуурамч мэдээлэл', 'Спам', 'Зохисгүй агуулга', 'Дахин нийтэлсэн', 'Бусад'];

export default function ReportButton({ petId }: { petId: string }) {
  const showToast = useToast();
  const { t } = useLanguage();
  const REASON_LABELS: Record<string, string> = {
    'Хуурамч мэдээлэл': t('report_reason_fake'),
    'Спам': t('report_reason_spam'),
    'Зохисгүй агуулга': t('report_reason_inappropriate'),
    'Дахин нийтэлсэн': t('report_reason_duplicate'),
    'Бусад': t('report_reason_other'),
  };
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleReport(reason: string) {
    setBusy(true);
    try {
      await reportPet(petId, reason);
      setSent(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return <p className="report-success" role="status"><Icon name="check" size={15} aria-hidden="true" /> {t('report_thanks')}<style jsx>{`.report-success{display:flex;align-items:center;gap:var(--sp-2);margin-top:var(--sp-3);padding:var(--sp-2) var(--sp-3);color:var(--success);background:color-mix(in srgb,var(--success) 8%,var(--surface-2));border-radius:var(--r-md);font-size:var(--text-xs)}`}</style></p>;
  }

  return (
    <div className="report-wrap">
      <button onClick={() => setOpen((value) => !value)} className="report-link" aria-expanded={open} aria-controls="report-reasons">
        <Icon name="flag" size={14} aria-hidden="true" /> {open ? t('sightings_close') : t('report_btn')}
      </button>
      {open && (
        <div id="report-reasons" className="report-panel">
          <p>{t('report_reason_label')}</p>
          <div className="reason-list">
          {REASON_VALUES.map((r) => (
            <button
              key={r}
              disabled={busy}
              onClick={() => handleReport(r)}
              className="reason-chip"
            >
              {REASON_LABELS[r]}
            </button>
          ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .report-wrap { margin-top:var(--sp-3); padding-top:var(--sp-3); border-top:1px solid var(--border-subtle); }
        .report-link { min-height:40px; display:inline-flex; align-items:center; gap:var(--sp-2); padding:var(--sp-1) 0; background:none; border:0; color:var(--text-tertiary); font:600 var(--text-xs) var(--font-body); cursor:pointer; text-decoration:underline; text-underline-offset:3px; transition:color 0.15s ease; }
        .report-link:hover { color: var(--alert); }
        .report-panel { margin-top:var(--sp-2); padding:var(--sp-3); background:color-mix(in srgb,var(--alert) 4%,var(--card)); border:1px solid color-mix(in srgb,var(--alert) 20%,var(--border-subtle)); border-radius:var(--r-md); }
        .report-panel > p { margin-bottom:var(--sp-2); color:var(--text-secondary); font-size:var(--text-xs); font-weight:650; }
        .reason-list { display:flex; gap:var(--sp-2); flex-wrap:wrap; }
        .reason-chip {
          min-height:36px; font:600 11.5px var(--font-body); padding: 4px 10px; border-radius: var(--r-sm);
          border: 1px solid var(--line); background: var(--card); cursor: pointer; color: var(--primary);
          transition: transform 0.12s ease, border-color 0.15s ease, background 0.15s ease;
        }
        .reason-chip:hover { border-color: var(--accent); background: var(--eyebrow-bg); }
        .reason-chip:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
        .reason-chip:disabled { opacity: 0.6; cursor: not-allowed; }
        @media(max-width:560px){.reason-list{display:grid;grid-template-columns:1fr 1fr}.reason-chip{width:100%}}
      `}</style>
    </div>
  );
}
