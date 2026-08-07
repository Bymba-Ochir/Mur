'use client';
import { useSyncExternalStore, useState } from 'react';
import { useLanguage } from '../lib/i18n';

// Клиент дээр sync render-ээр утгыг тооцно; SSR/hydration-д false (server snapshot).
// useSyncExternalStore нь effect-д setState хийлгүйгээр hydration-аюулгүй байлгана.
const emptySubscribe = (): (() => void) => () => {};
const getServerSnapshot = (): boolean => false;
const getClientSnapshot = (): boolean => typeof navigator !== 'undefined' && 'share' in navigator;

export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const hasNativeShare = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // хэрэглэгч цуцалсан бол алдаа шидэхгүй
      }
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="share-row">
      {hasNativeShare && (
        <button onClick={handleNativeShare} className="share-btn native">
          {t('share_native')}
        </button>
      )}
      <a href={fbShareUrl} target="_blank" rel="noopener noreferrer" className="share-btn fb">
        {t('share_fb')}
      </a>
      <button onClick={handleCopy} className="share-btn copy">
        {copied ? t('share_copied') : t('share_copy')}
      </button>

      <style jsx>{`
        .share-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
        .share-btn {
          padding: 9px 14px; border-radius: var(--r-sm); border: none; cursor: pointer;
          font-size: 13px; font-weight: 600; text-decoration: none; display: inline-block;
          transition: transform .15s ease, box-shadow .2s ease, filter .2s ease;
        }
        .share-btn:hover { transform: translateY(-1px); box-shadow: var(--shadow-sm); filter: brightness(1.05); }
        .share-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .native { background: var(--brand); color: #fff; }
        .fb { background: #1877F2; color: #fff; }
        .copy { background: var(--eyebrow-bg); color: var(--primary); }
      `}</style>
    </div>
  );
}
