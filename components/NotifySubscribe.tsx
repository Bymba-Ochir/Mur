'use client';
import { useEffect, useState } from 'react';
import { subscribeToNearbyAlerts, isSubscribed, isPushSupported } from '../lib/push';
import type { District } from '../lib/districts';
import { getErrorMessage } from '../lib/utils';
import Icon from './ui/icons';

export default function NotifySubscribe({ district }: { district: District }) {
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
        <p><Icon name="bell" size={15} aria-hidden="true" /> Танай дүүрэгт шинэ мэдэгдэл бүртгэгдэхэд push мэдэгдэл авна.</p>
      ) : (
        <>
          <button onClick={handleSubscribe} disabled={loading} className="notify-btn">
            <Icon name="bell" size={15} aria-hidden="true" /> {loading ? 'Бүртгүүлж байна...' : `"${district}" дүүргийн шинэ мэдэгдэл авах`}
          </button>
          {error && <p className="notify-error">{error}</p>}
        </>
      )}

      <style jsx>{`
        .notify-box { margin: 12px 0; }
        .notify-btn {
          padding: 9px 14px; border-radius: var(--r-sm); border: 1.5px solid var(--primary);
          background: var(--card); color: var(--primary); font-weight: 600; font-size: 13px; cursor: pointer;
        }
        .notify-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .notify-error { color: var(--alert); font-size: 12px; margin-top: 6px; }
        p,.notify-btn { display: inline-flex; align-items: center; gap: 7px; }
        p { font-size: 13px; color: var(--muted); }
      `}</style>
    </div>
  );
}
