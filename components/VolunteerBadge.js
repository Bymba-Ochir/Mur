'use client';
import { useEffect, useState } from 'react';
import { joinAsVolunteer, leaveAsVolunteer, isVolunteer, fetchVolunteerCounts } from '../lib/volunteerService';
import { useAuth } from '../lib/useAuth';
import { useToast } from './Toast';

export default function VolunteerBadge({ district }) {
  const { user } = useAuth();
  const showToast = useToast();
  const [count, setCount] = useState(0);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!district) return;
    fetchVolunteerCounts().then((counts) => setCount(counts[district] || 0));
    if (user) isVolunteer(district).then(setJoined);
    else setJoined(false);
  }, [district, user]);

  async function handleToggle() {
    if (!user) {
      showToast('Эхлээд нэвтэрнэ үү', 'error');
      return;
    }
    setBusy(true);
    try {
      if (joined) {
        await leaveAsVolunteer(district);
        setJoined(false);
        setCount((c) => Math.max(0, c - 1));
        showToast('Сайн дурын жагсаалтаас гарлаа', 'info');
      } else {
        await joinAsVolunteer(district);
        setJoined(true);
        setCount((c) => c + 1);
        showToast('Баярлалаа! Та одоо сайн дурын идэвхтэн боллоо 🙌', 'success');
      }
    } catch (err) {
      showToast('Алдаа гарлаа: ' + err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (!district) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      background: 'var(--eyebrow-bg)', borderRadius: 'var(--r-sm)', padding: '10px 14px', marginBottom: 8,
    }}>
      <span style={{ fontSize: 13, color: 'var(--primary)' }}>
        🙋 <b>{count}</b> сайн дурын идэвхтэн "{district}" дүүрэгт
      </span>
      <button
        onClick={handleToggle}
        disabled={busy}
        style={{
          background: joined ? 'transparent' : 'var(--brand)',
          color: joined ? 'var(--muted)' : '#fff',
          border: joined ? '1px solid var(--line)' : 'none',
          borderRadius: 'var(--r-sm)', padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}
      >
        {joined ? 'Гарах' : '+ Нэгдэх'}
      </button>
    </div>
  );
}
