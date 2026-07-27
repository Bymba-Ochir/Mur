'use client';
import { useState } from 'react';
import { reportPet } from '../lib/petService';
import { useToast } from './Toast';

const REASONS = ['Хуурамч мэдээлэл', 'Спам', 'Зохисгүй агуулга', 'Дахин нийтэлсэн', 'Бусад'];

export default function ReportButton({ petId }) {
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleReport(reason) {
    setBusy(true);
    try {
      await reportPet(petId, reason);
      setSent(true);
    } catch (err) {
      showToast('Алдаа гарлаа: ' + err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return <p style={{ fontSize: 12, color: '#6B7680', marginTop: 8 }}>✅ Мэдээлэл хүлээн авлаа, баярлалаа.</p>;
  }

  return (
    <div style={{ marginTop: 10 }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{ background: 'none', border: 'none', color: '#6B7680', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
        >
          🚩 Энэ бичлэгийг мэдээлэх
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6B7680' }}>Шалтгаан:</span>
          {REASONS.map((r) => (
            <button
              key={r}
              disabled={busy}
              onClick={() => handleReport(r)}
              style={{
                fontSize: 11.5, padding: '4px 9px', borderRadius: 7,
                border: '1px solid #E1E4DF', background: '#fff', cursor: 'pointer', color: '#1F4B5C',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
