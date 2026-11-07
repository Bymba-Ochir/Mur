'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribeToNearbyAlerts, isSubscribed, isPushSupported, PUSH_SUBSCRIPTION_EVENT } from '../lib/push';
import type { District } from '../lib/districts';
import { getErrorMessage } from '../lib/utils';
import Icon from './ui/icons';
import { useLanguage } from '../lib/i18n';
import { useAuth } from '../lib/useAuth';

export default function NotifySubscribe({ district }: { district: District }) {
  const { user } = useAuth();
  return <DistrictSubscription key={`${user?.id ?? 'guest'}:${district}`} district={district} />;
}

function DistrictSubscription({ district }: { district: District }) {
  const { t } = useLanguage();
  const [state, setState] = useState<'checking' | 'subscribed' | 'unsubscribed' | 'unsupported' | 'error'>('checking');
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const alive = useRef(true);
  const requestCheck = useCallback(() => {
    setState('checking'); setError(null); setRevision(value => value + 1);
  }, []);

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      if (!isPushSupported()) { if (active) setState('unsupported'); return; }
      const subscribed = await isSubscribed(district);
      if (active) setState(subscribed ? 'subscribed' : 'unsubscribed');
    }).catch(() => { if (active) { setState('error'); setError(null); } });
    return () => { active = false; };
  }, [district, revision]);
  useEffect(() => {
    window.addEventListener('focus', requestCheck);
    window.addEventListener(PUSH_SUBSCRIPTION_EVENT, requestCheck);
    return () => { window.removeEventListener('focus', requestCheck); window.removeEventListener(PUSH_SUBSCRIPTION_EVENT, requestCheck); };
  }, [requestCheck]);

  async function handleSubscribe() {
    if (busy.current) return;
    busy.current = true; setLoading(true); setError(null);
    try {
      await subscribeToNearbyAlerts(district);
      if (alive.current) requestCheck();
    } catch (reason) {
      if (alive.current) { setState('error'); setError(getErrorMessage(reason)); }
    } finally {
      busy.current = false;
      if (alive.current) setLoading(false);
    }
  }

  if (state === 'unsupported') return null;
  return (
    <div className="notify-box" aria-busy={state === 'checking' || loading}>
      {state === 'subscribed' ? (
        <p className="notify-copy"><Icon name="check" size={16} aria-hidden="true" /> &quot;{district}&quot; — {t('listings_notify_subscribed')}</p>
      ) : state === 'checking' ? (
        <p className="notify-pending" role="status">{t('listings_notify_checking')}</p>
      ) : state === 'error' ? (
        <>
          <p className="notify-error" role="alert">{error ?? t('listings_notify_status_error')}</p>
          <button type="button" onClick={requestCheck} className="notify-btn" disabled={loading}>{t('err_retry')}</button>
        </>
      ) : (
        <button type="button" onClick={handleSubscribe} disabled={loading} className="notify-btn">
          <Icon name="bell" size={16} aria-hidden="true" /> {loading ? t('listings_notify_loading') : `"${district}" ${t('listings_notify_action')}`}
        </button>
      )}


      <style jsx>{`
        .notify-pending { color: var(--muted); min-height: var(--touch-target); display: flex; align-items: center; font-size: 13px; }
        .notify-box { min-height: 48px; }
        .notify-btn {
          min-height: var(--touch-target); display: inline-flex; align-items: center; gap: var(--sp-2);
          padding: var(--sp-2) var(--sp-3); border-radius: var(--r-md); border: 1.5px solid var(--primary);
          background: var(--card); color: var(--primary); font-family: inherit; font-weight: 650; font-size: 13px;
          cursor: pointer; transition: background var(--dur-fast) ease, color var(--dur-fast) ease;
        }
        .notify-btn:hover { background: var(--primary); color: var(--text-on-accent); }
        .notify-btn:focus-visible { outline: 2px solid var(--border-focus); outline-offset: 2px; }
        .notify-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .notify-error { color: var(--alert); font-size: 12px; margin-top: 6px; }
        .notify-copy {
          min-height: var(--touch-target); display: inline-flex; align-items: center; gap: var(--sp-2);
          padding: var(--sp-2) var(--sp-3); color: var(--success); background: color-mix(in srgb, var(--success) 8%, var(--surface-2));
          border: 1px solid color-mix(in srgb, var(--success) 28%, var(--border-subtle)); border-radius: var(--r-md); font-size: 13px;
        }
        @media (max-width: 560px) {
          .notify-btn, .notify-copy { width: 100%; justify-content: center; text-align: center; }
        }
      `}</style>
    </div>
  );
}
