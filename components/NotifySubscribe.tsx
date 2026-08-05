'use client';
import { useEffect, useState } from 'react';
import { subscribeToNearbyAlerts, isSubscribed, isPushSupported } from '../lib/push';
import type { District } from '../lib/districts';
import { getErrorMessage } from '../lib/utils';

export default function NotifySubscribe({ district }: { district: District }) {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(isPushSupported());
    isSubscribed().then(setSubscribed);
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
        <p>🔔 Танай дүүрэгт шинэ мэдэгдэл бүртгэгдэхэд push мэдэгдэл авна.</p>
      ) : (
        <>
          <button onClick={handleSubscribe} disabled={loading} className="notify-btn">
            {loading ? 'Бүртгүүлж байна...' : `🔔 "${district}" дүүргийн шинэ мэдэгдэл авах`}
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
        p { font-size: 13px; color: var(--muted); }
      `}</style>
    </div>
  );
}
