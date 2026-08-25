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
    <div className="my-3">
      {subscribed ? (
        <p className="text-[13px] text-[var(--muted)]">🔔 Танай дүүрэгт шинэ мэдэгдэл бүртгэгдэхэд push мэдэгдэл авна.</p>
      ) : (
        <>
          <button onClick={handleSubscribe} disabled={loading} className="cursor-pointer rounded-[var(--r-sm)] border-[1.5px] border-[var(--primary)] bg-[var(--card)] px-3.5 py-[9px] text-[13px] font-semibold text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Бүртгүүлж байна...' : `🔔 "${district}" дүүргийн шинэ мэдэгдэл авах`}
          </button>
          {error && <p className="mt-1.5 text-xs text-[var(--alert)]">{error}</p>}
        </>
      )}
    </div>
  );
}
