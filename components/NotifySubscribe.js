'use client';
import { useEffect, useState } from 'react';
import { subscribeToNearbyAlerts, isSubscribed, isPushSupported } from '../lib/push';

export default function NotifySubscribe({ district }) {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(isPushSupported());
    isSubscribed().then(setSubscribed);
  }, []);

  async function handleSubscribe() {
    if (!district) {
      setError('Эхлээд дүүргээ сонгоно уу');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await subscribeToNearbyAlerts(district);
      setSubscribed(true);
    } catch (err) {
      setError(err.message);
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
            {loading ? 'Бүртгүүлж байна...' : `🔔 ${district ? `"${district}"` : 'Энэ дүүргийн'} шинэ мэдэгдэл авах`}
          </button>
          {error && <p className="notify-error">{error}</p>}
        </>
      )}

      <style jsx>{`
        .notify-box { margin: 12px 0; }
        .notify-btn {
          padding: 9px 14px; border-radius: 9px; border: 1.5px solid #1F4B5C;
          background: #fff; color: #1F4B5C; font-weight: 600; font-size: 13px; cursor: pointer;
        }
        .notify-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .notify-error { color: #C6473B; font-size: 12px; margin-top: 6px; }
        p { font-size: 13px; color: #6B7680; }
      `}</style>
    </div>
  );
}
