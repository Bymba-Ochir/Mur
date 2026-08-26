'use client';
import { useEffect, useState } from 'react';
import { joinAsVolunteer, leaveAsVolunteer, isVolunteer, fetchVolunteerCounts } from '../lib/volunteerService';
import { useAuth } from '../lib/useAuth';
import Button from './ui/Button';
import { useToast } from './Toast';
import type { District } from '../lib/districts';
import { getErrorMessage } from '../lib/utils';
import { UsersRound } from 'lucide-react';

export default function VolunteerBadge({ district }: { district: District }) {
  const { user } = useAuth();
  const showToast = useToast();
  const [count, setCount] = useState(0);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchVolunteerCounts().then((counts) => setCount(counts[district] || 0));
    const task = user ? isVolunteer(district) : Promise.resolve(false);
    task.then(setJoined);
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
        showToast('Баярлалаа! Та одоо сайн дурын идэвхтэн боллоо', 'success');
      }
    } catch (err) {
      showToast('Алдаа гарлаа: ' + getErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-[var(--sp-2)] flex items-center justify-between gap-[var(--sp-2)] rounded-[var(--r-sm)] bg-[var(--eyebrow-bg)] px-3.5 py-2.5">
      <span className="text-[13px] text-[var(--primary)]">
        <UsersRound size={15} aria-hidden="true" /> <b>{count}</b> сайн дурын идэвхтэн &quot;{district}&quot; дүүрэгт
      </span>
      <Button
        onClick={handleToggle}
        disabled={busy}
        variant={joined ? 'ghost' : 'primary'}
        className="px-3 py-2 text-xs"
      >
        {joined ? 'Гарах' : '+ Нэгдэх'}
      </Button>
    </div>
  );
}
