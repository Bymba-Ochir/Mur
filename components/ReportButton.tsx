'use client';
import { useState } from 'react';
import { reportPet } from '../lib/petService';
import { useToast } from './Toast';
import { useLanguage } from '../lib/i18n';
import { getErrorMessage } from '../lib/utils';

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
      showToast('Алдаа гарлаа: ' + getErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 'var(--sp-2)' }}>{t('report_thanks')}</p>;
  }

  return (
    <div style={{ marginTop: 'var(--sp-2)' }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
        >
          {t('report_btn')}
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 'var(--sp-1)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t('report_reason_label')}</span>
          {REASON_VALUES.map((r) => (
            <button
              key={r}
              disabled={busy}
              onClick={() => handleReport(r)}
              style={{
                fontSize: 11.5, padding: '4px 9px', borderRadius: 'var(--r-sm)',
                border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', color: 'var(--primary)',
              }}
            >
              {REASON_LABELS[r]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
