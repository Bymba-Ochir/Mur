'use client';
import { useEffect, useState } from 'react';
import { subscribeToNearbyAlerts, isSubscribed, isPushSupported } from '../lib/push';
import type { District } from '../lib/districts';
import { getErrorMessage } from '../lib/utils';
import Icon from './ui/icons';
import { useLanguage } from '../lib/i18n';

export default function NotifySubscribe({ district }: { district: District }) {
  const { t } = useLanguage();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([Promise.resolve(isPushSupported()), isSubscribed()]).then(([supp, sub]) => {
      if (!active) return;
      setSupported(supp);
      setSubscribed(sub);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      await subscribeToNearbyAlerts(district);
      setSubscribed(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null; // Safari desktop зэрэг дэмждэггүй үед нуух

  return (
    <div className="notify-box">
      {subscribed ? (
        <p className="notify-copy"><Icon name="check" size={16} aria-hidden="true" /> {t('listings_notify_subscribed')}</p>
      ) : (
        <>
          <button onClick={handleSubscribe} disabled={loading} className="notify-btn">
            <Icon name="bell" size={16} aria-hidden="true" /> {loading ? t('listings_notify_loading') : `"${district}" ${t('listings_notify_action')}`}
          </button>
          {error && <p className="notify-error" role="alert">{error}</p>}
        </>
      )}

      <style jsx>{`
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
