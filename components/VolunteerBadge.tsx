'use client';
import { useEffect, useState } from 'react';
import { joinAsVolunteer, leaveAsVolunteer, isVolunteer, fetchVolunteerCounts } from '../lib/volunteerService';
import { useAuth } from '../lib/useAuth';
import Button from './ui/Button';
import { useToast } from './Toast';
import type { District } from '../lib/districts';
import { getErrorMessage } from '../lib/utils';
import { useLanguage } from '../lib/i18n';
import Icon from './ui/icons';

export default function VolunteerBadge({ district }: { district: District }) {
  const { user } = useAuth();
  const showToast = useToast();
  const { t } = useLanguage();
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
      showToast(t('listings_volunteer_login'), 'error');
      return;
    }
    setBusy(true);
    try {
      if (joined) {
        await leaveAsVolunteer(district);
        setJoined(false);
        setCount((c) => Math.max(0, c - 1));
        showToast(t('listings_volunteer_left'), 'info');
      } else {
        await joinAsVolunteer(district);
        setJoined(true);
        setCount((c) => c + 1);
        showToast(t('listings_volunteer_joined'), 'success');
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="volunteer-box">
      <span className="volunteer-copy">
        <span className="volunteer-icon" aria-hidden="true"><Icon name="heart" size={17} /></span>
        <span><b>{count}</b> {t('listings_volunteer_count')} · &quot;{district}&quot; {t('listings_volunteer_in')}</span>
      </span>
      <Button
        onClick={handleToggle}
        disabled={busy}
        aria-busy={busy}
        variant={joined ? 'ghost' : 'primary'}
        size="sm"
      >
        {joined ? t('listings_volunteer_leave') : t('listings_volunteer_join')}
      </Button>

      <style jsx>{`
        .volunteer-box {
          display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3);
          min-height: 58px; padding: var(--sp-2) var(--sp-3); color: var(--primary);
          background: var(--eyebrow-bg); border: 1px solid var(--glass-border); border-radius: var(--r-md);
        }
        .volunteer-copy { display: flex; align-items: center; gap: var(--sp-2); min-width: 0; font-size: 13px; line-height: 1.45; }
        .volunteer-icon { width: 32px; height: 32px; flex: 0 0 32px; display: grid; place-items: center; background: var(--surface-2); border-radius: 50%; }
        @media (max-width: 560px) {
          .volunteer-box { align-items: stretch; flex-direction: column; padding: var(--sp-3); }
          .volunteer-box :global(.btn-base) { width: 100%; }
        }
      `}</style>
    </div>
  );
}
