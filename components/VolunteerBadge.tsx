'use client';
import { useEffect, useRef, useState } from 'react';
import { joinAsVolunteer, leaveAsVolunteer, isVolunteer, fetchVolunteerCount } from '../lib/volunteerService';
import { useAuth } from '../lib/useAuth';
import Button from './ui/Button';
import { useToast } from './Toast';
import type { District } from '../lib/districts';
import { getErrorMessage } from '../lib/utils';
import { useLanguage } from '../lib/i18n';
import Icon from './ui/icons';

export default function VolunteerBadge({ district }: { district: District }) {
  const { user } = useAuth();
  return <DistrictVolunteers key={`${user?.id ?? 'guest'}:${district}`} district={district} userId={user?.id ?? null} />;
}

function DistrictVolunteers({ district, userId }: { district: District; userId: string | null }) {
  const showToast = useToast();
  const { t } = useLanguage();
  const [count, setCount] = useState<number | null>(null);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const alive = useRef(true);
  const pending = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    Promise.all([fetchVolunteerCount(district), userId ? isVolunteer(district) : Promise.resolve(false)]).then(([total, member]) => {
      if (active) { setCount(total); setJoined(member); }
    }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [district, userId, revision]);

  function retry() { setCount(null); setLoadError(false); setRevision(value => value + 1); }

  async function handleToggle() {
    if (!userId) { showToast(t('listings_volunteer_login'), 'error'); return; }
    if (pending.current || count === null) return;
    pending.current = true; setBusy(true);
    try {
      if (joined) await leaveAsVolunteer(district);
      else await joinAsVolunteer(district);
      if (!alive.current) return;
      showToast(t(joined ? 'listings_volunteer_left' : 'listings_volunteer_joined'), joined ? 'info' : 'success');
      // Re-read the aggregate and membership; a local +/- can drift after retries.
      retry();
    } catch (reason) {
      if (alive.current) showToast(getErrorMessage(reason), 'error');
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }

  return (
    <div className="volunteer-box" aria-busy={busy || (count === null && !loadError)}>
      <span className="volunteer-copy">
        <span className="volunteer-icon" aria-hidden="true"><Icon name="heart" size={17} /></span>
        <span aria-live="polite"><b>{count ?? '—'}</b> {t('listings_volunteer_count')} · &quot;{district}&quot; {t('listings_volunteer_in')}</span>
      </span>
      {loadError ? (
        <>
          <p className="volunteer-error" role="alert">{t('listings_volunteer_load_error')}</p>
          <Button onClick={retry} variant="ghost" size="sm">{t('err_retry')}</Button>
        </>
      ) : (
        <Button onClick={handleToggle} disabled={busy || count === null} aria-busy={busy || count === null} variant={joined ? 'ghost' : 'primary'} size="sm">
          {count === null ? t('listings_volunteer_loading') : joined ? t('listings_volunteer_leave') : t('listings_volunteer_join')}
        </Button>
      )}


      <style jsx>{`
        .volunteer-error { color: var(--alert); font-size: 12px; margin: 0; }
        .volunteer-box {
          display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--sp-3);
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
